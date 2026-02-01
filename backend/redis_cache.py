"""
Redis Cache Service for BillByteKOT with Upstash Support
Provides fast caching for active orders and real-time updates
Supports both traditional Redis and Upstash Redis REST API
"""

import json
import os
import asyncio
import aiohttp
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import redis.asyncio as redis
from motor.motor_asyncio import AsyncIOMotorDatabase

class UpstashRedisCache:
    """Upstash Redis REST API client for serverless Redis"""
    
    def __init__(self):
        self.rest_url = os.getenv("UPSTASH_REDIS_REST_URL")
        self.rest_token = os.getenv("UPSTASH_REDIS_REST_TOKEN")
        self.connected = False
        self.session = None
        self.failed_attempts = 0
        self.max_failed_attempts = 3
        self.last_failure_time = None
        self.backoff_duration = 300  # 5 minutes backoff after failures
        
    async def connect(self):
        """Connect to Upstash Redis"""
        if not self.rest_url or not self.rest_token:
            print("⚠️ Upstash Redis credentials not configured")
            return
            
        # Check if we're in backoff period after repeated failures
        if self.last_failure_time and (datetime.now() - self.last_failure_time).seconds < self.backoff_duration:
            print(f"⏳ Upstash Redis in backoff period, using MongoDB only")
            return
            
        try:
            self.session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=10),
                headers={
                    "Authorization": f"Bearer {self.rest_token}",
                    "Content-Type": "application/json"
                }
            )
            
            # Test connection with a simple ping
            await self._execute_command(["PING"])
            
            self.connected = True
            self.failed_attempts = 0
            self.last_failure_time = None
            print("✅ Upstash Redis connected successfully")
            
        except Exception as e:
            self.failed_attempts += 1
            self.last_failure_time = datetime.now()
            
            print(f"⚠️ Upstash Redis connection failed: {e} (attempt {self.failed_attempts})")
            
            if self.failed_attempts >= self.max_failed_attempts:
                print(f"🔄 Too many Upstash failures, entering {self.backoff_duration}s backoff period")
            
            self.connected = False
            if self.session:
                await self.session.close()
                self.session = None
    
    async def disconnect(self):
        """Disconnect from Upstash Redis"""
        if self.session:
            await self.session.close()
            self.session = None
        self.connected = False
        print("🔌 Upstash Redis disconnected")
    
    def is_connected(self) -> bool:
        """Check if Upstash Redis is connected"""
        return self.connected and self.session is not None
    
    async def _execute_command(self, command: List[str]) -> Any:
        """Execute a Redis command via Upstash REST API"""
        if not self.is_connected():
            return None
            
        try:
            async with self.session.post(self.rest_url, json=command) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get("result")
                else:
                    error_text = await response.text()
                    print(f"❌ Upstash command failed: {response.status} - {error_text}")
                    return None
        except Exception as e:
            print(f"❌ Upstash command error: {e}")
            return None
    
    async def get(self, key: str) -> Optional[str]:
        """Get value from Upstash Redis"""
        result = await self._execute_command(["GET", key])
        return result
    
    async def set(self, key: str, value: str, ex: Optional[int] = None) -> bool:
        """Set value in Upstash Redis with optional expiration"""
        if ex:
            result = await self._execute_command(["SETEX", key, str(ex), value])
        else:
            result = await self._execute_command(["SET", key, value])
        return result == "OK"
    
    async def setex(self, key: str, time: int, value: str) -> bool:
        """Set value with expiration time"""
        result = await self._execute_command(["SETEX", key, str(time), value])
        return result == "OK"
    
    async def delete(self, *keys: str) -> int:
        """Delete keys from Upstash Redis"""
        if not keys:
            return 0
        result = await self._execute_command(["DEL"] + list(keys))
        return result or 0
    
    async def keys(self, pattern: str) -> List[str]:
        """Get keys matching pattern"""
        result = await self._execute_command(["KEYS", pattern])
        return result or []
    
    async def incr(self, key: str) -> int:
        """Increment key value"""
        result = await self._execute_command(["INCR", key])
        return result or 0
    
    async def expire(self, key: str, time: int) -> bool:
        """Set expiration time for key"""
        result = await self._execute_command(["EXPIRE", key, str(time)])
        return result == 1
    
    async def publish(self, channel: str, message: str) -> int:
        """Publish message to channel"""
        result = await self._execute_command(["PUBLISH", channel, message])
        return result or 0

class RedisCache:
    def __init__(self):
        self.redis = None
        self.upstash = None
        self.connected = False
        self.connection_pool = None
        self.failed_attempts = 0
        self.max_failed_attempts = 3
        self.last_failure_time = None
        self.backoff_duration = 300  # 5 minutes backoff after failures
        self.use_upstash = False
        
    async def connect(self):
        """Connect to Redis with Upstash priority and fallback handling"""
        # Check if we're in backoff period after repeated failures
        if self.last_failure_time and (datetime.now() - self.last_failure_time).seconds < self.backoff_duration:
            print(f"⏳ Redis in backoff period, using MongoDB only")
            return
        
        # Try Upstash Redis first
        upstash_url = os.getenv("UPSTASH_REDIS_REST_URL")
        upstash_token = os.getenv("UPSTASH_REDIS_REST_TOKEN")
        
        if upstash_url and upstash_token:
            print("🔍 Trying Upstash Redis...")
            try:
                self.upstash = UpstashRedisCache()
                await self.upstash.connect()
                
                if self.upstash.is_connected():
                    self.connected = True
                    self.use_upstash = True
                    self.failed_attempts = 0
                    self.last_failure_time = None
                    print("✅ Using Upstash Redis")
                    return
            except Exception as e:
                print(f"⚠️ Upstash Redis failed: {e}")
        
        # Fallback to traditional Redis
        print("🔍 Falling back to traditional Redis...")
        try:
            redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
            redis_password = os.getenv("REDIS_PASSWORD")
            
            print(f"🔍 Connecting to Redis: {redis_url}")
            
            # Check if it's a cloud URL
            is_cloud_url = "cloud.redislabs.com" in redis_url or "amazonaws.com" in redis_url or "azure.com" in redis_url
            
            # Free tier optimized connection settings
            connection_kwargs = {
                'decode_responses': True,
                'socket_connect_timeout': 5,  # Reduced timeout for free tier
                'socket_timeout': 5,
                'retry_on_timeout': True,
                'health_check_interval': 30,  # Health check every 30 seconds
                'max_connections': 5,  # Limit connections for free tier
                'socket_keepalive': True,
                'socket_keepalive_options': {}
            }
            
            if is_cloud_url and redis_password and redis_password != "your_redis_password_here":
                # Add password to cloud URL for free tier
                if "://" in redis_url and "@" not in redis_url:
                    protocol, rest = redis_url.split("://", 1)
                    auth_url = f"{protocol}://:{redis_password}@{rest}"
                else:
                    auth_url = redis_url
                
                self.redis = redis.from_url(auth_url, **connection_kwargs)
                await self.redis.ping()
                self.connected = True
                self.use_upstash = False
                self.failed_attempts = 0
                self.last_failure_time = None
                print("✅ Redis connected (cloud free tier optimized)")
                return
                
            elif redis_url != "redis://localhost:6379":
                # Try direct connection without auth
                self.redis = redis.from_url(redis_url, **connection_kwargs)
                await self.redis.ping()
                self.connected = True
                self.use_upstash = False
                self.failed_attempts = 0
                self.last_failure_time = None
                print("✅ Redis connected (direct)")
                return
                
            else:
                # Try local Redis
                self.redis = redis.from_url(redis_url, decode_responses=True)
                await self.redis.ping()
                self.connected = True
                self.use_upstash = False
                self.failed_attempts = 0
                self.last_failure_time = None
                print("✅ Redis connected (local)")
                return
                
        except Exception as e:
            self.failed_attempts += 1
            self.last_failure_time = datetime.now()
            
            error_msg = str(e).lower()
            if "max number of clients reached" in error_msg or "connection limit" in error_msg:
                print(f"🚫 Redis free tier connection limit reached (attempt {self.failed_attempts})")
                print("📝 Switching to MongoDB-only mode for better performance")
            elif "timeout" in error_msg:
                print(f"⏰ Redis connection timeout (attempt {self.failed_attempts})")
            else:
                print(f"⚠️ Redis connection failed: {e} (attempt {self.failed_attempts})")
            
            if self.failed_attempts >= self.max_failed_attempts:
                print(f"🔄 Too many Redis failures, entering {self.backoff_duration}s backoff period")
            
        print("📝 Continuing without Redis cache (will use MongoDB only)")
        self.connected = False
        self.redis = None
        self.upstash = None
    
    async def disconnect(self):
        """Disconnect from Redis"""
        if self.upstash:
            await self.upstash.disconnect()
        if self.redis:
            await self.redis.aclose()
        self.connected = False
        print("🔌 Redis disconnected")
    
    def is_connected(self) -> bool:
        """Check if Redis is connected"""
        return self.connected and (self.upstash or self.redis) is not None
    
    async def get(self, key: str) -> Optional[str]:
        """Get value from Redis"""
        if not self.is_connected():
            return None
        
        try:
            if self.use_upstash and self.upstash:
                return await self.upstash.get(key)
            elif self.redis:
                return await self.redis.get(key)
        except Exception as e:
            print(f"❌ Redis get error: {e}")
        return None
    
    async def setex(self, key: str, time: int, value: str) -> bool:
        """Set value with expiration"""
        if not self.is_connected():
            return False
        
        try:
            if self.use_upstash and self.upstash:
                return await self.upstash.setex(key, time, value)
            elif self.redis:
                await self.redis.setex(key, time, value)
                return True
        except Exception as e:
            print(f"❌ Redis setex error: {e}")
        return False
    
    async def delete(self, *keys: str) -> bool:
        """Delete keys from Redis"""
        if not self.is_connected() or not keys:
            return False
        
        try:
            if self.use_upstash and self.upstash:
                result = await self.upstash.delete(*keys)
                return result > 0
            elif self.redis:
                result = await self.redis.delete(*keys)
                return result > 0
        except Exception as e:
            print(f"❌ Redis delete error: {e}")
        return False
    
    async def keys(self, pattern: str) -> List[str]:
        """Get keys matching pattern"""
        if not self.is_connected():
            return []
        
        try:
            if self.use_upstash and self.upstash:
                return await self.upstash.keys(pattern)
            elif self.redis:
                return await self.redis.keys(pattern)
        except Exception as e:
            print(f"❌ Redis keys error: {e}")
        return []
    
    async def publish(self, channel: str, message: str) -> bool:
        """Publish message to channel"""
        if not self.is_connected():
            return False
        
        try:
            if self.use_upstash and self.upstash:
                result = await self.upstash.publish(channel, message)
                return result > 0
            elif self.redis:
                result = await self.redis.publish(channel, message)
                return result > 0
        except Exception as e:
            print(f"❌ Redis publish error: {e}")
        return False
    
    async def check_rate_limit(self, key: str, limit: int, window: int) -> bool:
        """Check if request is within rate limit"""
        if not self.is_connected():
            return True  # Allow if Redis is not available
        
        try:
            if self.use_upstash and self.upstash:
                # Use Upstash Redis for rate limiting
                current = await self.upstash.incr(key)
                if current == 1:
                    await self.upstash.expire(key, window)
                return current <= limit
            elif self.redis:
                # Use traditional Redis for rate limiting
                current = await self.redis.incr(key)
                if current == 1:
                    await self.redis.expire(key, window)
                return current <= limit
        except Exception as e:
            print(f"❌ Redis rate limit error: {e}")
        return True  # Allow if error occurs

    # ============ ACTIVE ORDERS CACHE ============
    
    async def get_active_orders(self, org_id: str) -> Optional[List[Dict]]:
        """Get active orders from cache"""
        if not self.is_connected():
            return None
            
        try:
            cache_key = f"active_orders:{org_id}"
            cached_data = await self.get(cache_key)
            
            if cached_data:
                orders = json.loads(cached_data)
                print(f"🚀 Cache HIT: {len(orders)} active orders for org {org_id}")
                return orders
            else:
                print(f"💾 Cache MISS: active orders for org {org_id}")
                return None
                
        except Exception as e:
            print(f"❌ Redis get error: {e}")
            return None
    
    async def set_active_orders(self, org_id: str, orders: List[Dict], ttl: int = 300):
        """Cache active orders (5 min TTL by default)"""
        if not self.is_connected():
            return False
            
        try:
            cache_key = f"active_orders:{org_id}"
            
            # Convert datetime objects to ISO strings for JSON serialization
            serializable_orders = []
            for order in orders:
                order_copy = order.copy()
                if isinstance(order_copy.get('created_at'), datetime):
                    order_copy['created_at'] = order_copy['created_at'].isoformat()
                if isinstance(order_copy.get('updated_at'), datetime):
                    order_copy['updated_at'] = order_copy['updated_at'].isoformat()
                serializable_orders.append(order_copy)
            
            success = await self.setex(cache_key, ttl, json.dumps(serializable_orders))
            if success:
                print(f"💾 Cached {len(orders)} active orders for org {org_id} (TTL: {ttl}s)")
            return success
            
        except Exception as e:
            print(f"❌ Redis set error: {e}")
            return False
    
    async def invalidate_active_orders(self, org_id: str):
        """Invalidate active orders cache when orders change"""
        if not self.is_connected():
            return False
            
        try:
            cache_key = f"active_orders:{org_id}"
            success = await self.delete(cache_key)
            if success:
                print(f"🗑️ Invalidated active orders cache for org {org_id}")
            return success
            
        except Exception as e:
            print(f"❌ Redis delete error: {e}")
            return False
    
    async def invalidate_date_aware_caches(self, org_id: str, date_key: str = None):
        """Invalidate date-aware caches for orders and bills"""
        if not self.is_connected():
            return False
            
        try:
            # Use current date if not provided
            if not date_key:
                date_key = datetime.now().strftime("%Y-%m-%d")
            
            # Invalidate date-aware cache keys
            cache_keys = [
                f"active_orders:{org_id}:{date_key}",
                f"todays_bills:{org_id}:{date_key}",
                f"active_orders:{org_id}",  # Legacy key for backward compatibility
            ]
            
            success_count = 0
            for key in cache_keys:
                try:
                    if await self.delete(key):
                        success_count += 1
                        print(f"🗑️ Invalidated date-aware cache: {key}")
                except Exception as key_error:
                    print(f"⚠️ Failed to invalidate cache key {key}: {key_error}")
            
            return success_count > 0
            
        except Exception as e:
            print(f"❌ Redis date-aware invalidation error: {e}")
            return False
    
    # ============ ORDER DETAILS CACHE ============
    
    async def get_order(self, order_id: str, org_id: str) -> Optional[Dict]:
        """Get single order from cache"""
        if not self.is_connected():
            return None
            
        try:
            cache_key = f"order:{org_id}:{order_id}"
            cached_data = await self.get(cache_key)
            
            if cached_data:
                order = json.loads(cached_data)
                print(f"🚀 Cache HIT: order {order_id}")
                return order
            else:
                print(f"💾 Cache MISS: order {order_id}")
                return None
                
        except Exception as e:
            print(f"❌ Redis get order error: {e}")
            return None
    
    async def set_order(self, order_id: str, org_id: str, order: Dict, ttl: int = 600):
        """Cache single order (10 min TTL by default)"""
        if not self.is_connected():
            return False
            
        try:
            cache_key = f"order:{org_id}:{order_id}"
            
            # Convert datetime objects to ISO strings
            order_copy = order.copy()
            if isinstance(order_copy.get('created_at'), datetime):
                order_copy['created_at'] = order_copy['created_at'].isoformat()
            if isinstance(order_copy.get('updated_at'), datetime):
                order_copy['updated_at'] = order_copy['updated_at'].isoformat()
            
            success = await self.setex(cache_key, ttl, json.dumps(order_copy))
            if success:
                print(f"💾 Cached order {order_id}")
            return success
            
        except Exception as e:
            print(f"❌ Redis set order error: {e}")
            return False
    
    async def invalidate_order(self, order_id: str, org_id: str):
        """Invalidate single order cache"""
        if not self.is_connected():
            return False
            
        try:
            cache_key = f"order:{org_id}:{order_id}"
            success = await self.delete(cache_key)
            if success:
                print(f"🗑️ Invalidated order cache {order_id}")
            return success
            
        except Exception as e:
            print(f"❌ Redis delete order error: {e}")
            return False
    
    # ============ REAL-TIME UPDATES ============
    
    async def publish_order_update(self, org_id: str, order_id: str, action: str, order_data: Dict = None):
        """Publish real-time order updates"""
        if not self.is_connected():
            return False
            
        try:
            channel = f"orders:{org_id}"
            message = {
                "action": action,  # "created", "updated", "status_changed", "deleted"
                "order_id": order_id,
                "timestamp": datetime.now().isoformat(),
                "data": order_data
            }
            
            success = await self.publish(channel, json.dumps(message))
            if success:
                print(f"📡 Published order update: {action} for order {order_id}")
            return success
            
        except Exception as e:
            print(f"❌ Redis publish error: {e}")
            return False
    
    # ============ SUPER ADMIN CACHE ============
    
    async def get_super_admin_users(self, skip: int = 0, limit: int = 50) -> Optional[Dict]:
        """Get cached super admin users data"""
        if not self.is_connected():
            return None
            
        try:
            cache_key = f"super_admin:users:{skip}:{limit}"
            cached_data = await self.get(cache_key)
            
            if cached_data:
                users_data = json.loads(cached_data)
                print(f"🚀 Cache HIT: super admin users (skip={skip}, limit={limit})")
                return users_data
            else:
                print(f"💾 Cache MISS: super admin users (skip={skip}, limit={limit})")
                return None
                
        except Exception as e:
            print(f"❌ Redis get super admin users error: {e}")
            return None
    
    async def set_super_admin_users(self, users_data: Dict, skip: int = 0, limit: int = 50, ttl: int = 180):
        """Cache super admin users data"""
        if not self.is_connected():
            return False
            
        try:
            cache_key = f"super_admin:users:{skip}:{limit}"
            
            # Convert datetime objects to ISO strings for JSON serialization
            serializable_data = users_data.copy()
            if 'users' in serializable_data:
                for user in serializable_data['users']:
                    if isinstance(user.get('created_at'), datetime):
                        user['created_at'] = user['created_at'].isoformat()
                    if isinstance(user.get('subscription_expires_at'), datetime):
                        user['subscription_expires_at'] = user['subscription_expires_at'].isoformat()
            
            success = await self.setex(cache_key, ttl, json.dumps(serializable_data))
            if success:
                print(f"💾 Cached super admin users (skip={skip}, limit={limit}, TTL: {ttl}s)")
            return success
            
        except Exception as e:
            print(f"❌ Redis set super admin users error: {e}")
            return False
    
    async def invalidate_super_admin_users(self):
        """Invalidate all super admin users cache"""
        if not self.is_connected():
            return False
            
        try:
            # Get all super admin users cache keys
            pattern = "super_admin:users:*"
            keys = await self.keys(pattern)
            
            if keys:
                success = await self.delete(*keys)
                if success:
                    print(f"🗑️ Invalidated {len(keys)} super admin users cache entries")
                return success > 0
            return True
            
        except Exception as e:
            print(f"❌ Redis invalidate super admin users error: {e}")
            return False
    
    async def get_super_admin_analytics(self, days: int = 30) -> Optional[Dict]:
        """Get cached super admin analytics data"""
        if not self.is_connected():
            return None
            
        try:
            cache_key = f"super_admin:analytics:{days}"
            cached_data = await self.get(cache_key)
            
            if cached_data:
                analytics_data = json.loads(cached_data)
                print(f"🚀 Cache HIT: super admin analytics (days={days})")
                return analytics_data
            else:
                print(f"💾 Cache MISS: super admin analytics (days={days})")
                return None
                
        except Exception as e:
            print(f"❌ Redis get super admin analytics error: {e}")
            return None
    
    async def set_super_admin_analytics(self, analytics_data: Dict, days: int = 30, ttl: int = 300):
        """Cache super admin analytics data"""
        if not self.is_connected():
            return False
            
        try:
            cache_key = f"super_admin:analytics:{days}"
            
            # Convert datetime objects to ISO strings for JSON serialization
            serializable_data = analytics_data.copy()
            if 'cached_at' in serializable_data and isinstance(serializable_data['cached_at'], datetime):
                serializable_data['cached_at'] = serializable_data['cached_at'].isoformat()
            
            success = await self.setex(cache_key, ttl, json.dumps(serializable_data))
            if success:
                print(f"💾 Cached super admin analytics (days={days}, TTL: {ttl}s)")
            return success
            
        except Exception as e:
            print(f"❌ Redis set super admin analytics error: {e}")
            return False

# ============ CACHE-ENHANCED ORDER SERVICE ============

class CachedOrderService:
    def __init__(self, db: AsyncIOMotorDatabase, cache: RedisCache):
        self.db = db
        self.cache = cache
    
    async def get_active_orders(self, org_id: str, use_cache: bool = True) -> List[Dict]:
        """Get active orders with Redis caching and robust fallback"""
        
        # Try cache first if enabled and Redis is connected
        if use_cache and self.cache.is_connected():
            try:
                cached_orders = await self.cache.get_active_orders(org_id)
                if cached_orders is not None:
                    print(f"🚀 Cache HIT: {len(cached_orders)} active orders for org {org_id}")
                    return cached_orders
                else:
                    print(f"💾 Cache MISS: active orders for org {org_id}")
            except Exception as cache_error:
                print(f"❌ Redis cache error: {cache_error}, falling back to MongoDB")
        
        # Fallback to MongoDB
        print(f"📊 Fetching active orders from MongoDB for org {org_id}")
        
        try:
            # Query only active orders (not completed/cancelled)
            query = {
                "organization_id": org_id,
                "status": {"$nin": ["completed", "cancelled"]}
            }
            
            orders = await self.db.orders.find(
                query, 
                {"_id": 0}
            ).sort("created_at", -1).limit(100).to_list(100)
            
            # Convert datetime objects for consistency
            for order in orders:
                try:
                    if isinstance(order.get("created_at"), str):
                        order["created_at"] = datetime.fromisoformat(order["created_at"])
                    if isinstance(order.get("updated_at"), str):
                        order["updated_at"] = datetime.fromisoformat(order["updated_at"])
                except Exception as dt_error:
                    # If datetime conversion fails, leave as string
                    print(f"⚠️ Datetime conversion error for order {order.get('id', 'unknown')}: {dt_error}")
                    pass
            
            # Try to cache the results if Redis is available
            if use_cache and self.cache.is_connected():
                try:
                    await self.cache.set_active_orders(org_id, orders, ttl=300)  # 5 min cache
                except Exception as cache_set_error:
                    print(f"⚠️ Failed to cache orders: {cache_set_error}")
            
            print(f"📊 Found {len(orders)} active orders for org {org_id}")
            return orders
            
        except Exception as db_error:
            print(f"❌ MongoDB error in get_active_orders: {db_error}")
            # Return empty list rather than crash
            return []
    
    async def get_order_by_id(self, order_id: str, org_id: str, use_cache: bool = True) -> Optional[Dict]:
        """Get single order with caching"""
        
        # Try cache first
        if use_cache:
            cached_order = await self.cache.get_order(order_id, org_id)
            if cached_order is not None:
                return cached_order
        
        # Fallback to MongoDB
        order = await self.db.orders.find_one(
            {"id": order_id, "organization_id": org_id}, 
            {"_id": 0}
        )
        
        if order:
            # Convert datetime objects
            if isinstance(order.get("created_at"), str):
                order["created_at"] = datetime.fromisoformat(order["created_at"])
            if isinstance(order.get("updated_at"), str):
                order["updated_at"] = datetime.fromisoformat(order["updated_at"])
            
            # Cache the result
            if use_cache:
                await self.cache.set_order(order_id, org_id, order, ttl=600)  # 10 min cache
        
        return order
    
    async def invalidate_order_caches(self, org_id: str, order_id: str = None):
        """Invalidate caches when orders change"""
        
        # Always invalidate active orders list
        await self.cache.invalidate_active_orders(org_id)
        
        # Invalidate specific order if provided
        if order_id:
            await self.cache.invalidate_order(order_id, org_id)
        
        # Publish real-time update
        if order_id:
            await self.cache.publish_order_update(org_id, order_id, "cache_invalidated")
    
    async def get_tables(self, org_id: str, use_cache: bool = True) -> List[Dict]:
        """Get tables with Redis caching and robust fallback"""
        
        # Try cache first if enabled and Redis is connected
        if use_cache and self.cache.is_connected():
            try:
                cache_key = f"tables:{org_id}"
                cached_data = await self.cache.get(cache_key)
                
                if cached_data:
                    tables = json.loads(cached_data)
                    print(f"🚀 Cache HIT: {len(tables)} tables for org {org_id}")
                    return tables
                else:
                    print(f"💾 Cache MISS: tables for org {org_id}")
            except Exception as cache_error:
                print(f"❌ Redis cache error: {cache_error}, falling back to MongoDB")
        
        # Fallback to MongoDB
        print(f"📊 Fetching tables from MongoDB for org {org_id}")
        
        try:
            # Query tables for the organization
            query = {"organization_id": org_id}
            
            tables = await self.db.tables.find(
                query, 
                {"_id": 0}
            ).sort("table_number", 1).to_list(100)
            
            # Try to cache the results if Redis is available
            if use_cache and self.cache.is_connected():
                try:
                    cache_key = f"tables:{org_id}"
                    await self.cache.setex(cache_key, 600, json.dumps(tables))  # 10 min cache
                    print(f"💾 Cached {len(tables)} tables for org {org_id}")
                except Exception as cache_set_error:
                    print(f"⚠️ Failed to cache tables: {cache_set_error}")
            
            print(f"📊 Found {len(tables)} tables for org {org_id}")
            return tables
            
        except Exception as db_error:
            print(f"❌ MongoDB error in get_tables: {db_error}")
            # Return empty list rather than crash
            return []
    
    async def get_menu_items(self, org_id: str, use_cache: bool = True) -> List[Dict]:
        """Get menu items with Redis caching and robust fallback"""
        
        # Try cache first if enabled and Redis is connected
        if use_cache and self.cache.is_connected():
            try:
                cache_key = f"menu_items:{org_id}"
                cached_data = await self.cache.get(cache_key)
                
                if cached_data:
                    menu_items = json.loads(cached_data)
                    print(f"🚀 Cache HIT: {len(menu_items)} menu items for org {org_id}")
                    return menu_items
                else:
                    print(f"💾 Cache MISS: menu items for org {org_id}")
            except Exception as cache_error:
                print(f"❌ Redis cache error: {cache_error}, falling back to MongoDB")
        
        # Fallback to MongoDB
        print(f"📊 Fetching menu items from MongoDB for org {org_id}")
        
        try:
            # Query menu items for the organization
            query = {"organization_id": org_id}
            
            menu_items = await self.db.menu_items.find(
                query, 
                {"_id": 0}
            ).sort("name", 1).to_list(1000)
            
            # Convert datetime objects for consistency
            for item in menu_items:
                try:
                    if isinstance(item.get("created_at"), str):
                        item["created_at"] = datetime.fromisoformat(item["created_at"])
                except Exception as dt_error:
                    # If datetime conversion fails, leave as string
                    print(f"⚠️ Datetime conversion error for menu item {item.get('id', 'unknown')}: {dt_error}")
                    pass
            
            # Try to cache the results if Redis is available
            if use_cache and self.cache.is_connected():
                try:
                    cache_key = f"menu_items:{org_id}"
                    # Convert datetime objects to strings for JSON serialization
                    cache_items = []
                    for item in menu_items:
                        cache_item = item.copy()
                        if isinstance(cache_item.get("created_at"), datetime):
                            cache_item["created_at"] = cache_item["created_at"].isoformat()
                        cache_items.append(cache_item)
                    
                    await self.cache.setex(cache_key, 600, json.dumps(cache_items))  # 10 min cache
                    print(f"💾 Cached {len(menu_items)} menu items for org {org_id}")
                except Exception as cache_set_error:
                    print(f"⚠️ Failed to cache menu items: {cache_set_error}")
            
            print(f"📊 Found {len(menu_items)} menu items for org {org_id}")
            return menu_items
            
        except Exception as db_error:
            print(f"❌ MongoDB error in get_menu_items: {db_error}")
            # Return empty list rather than crash
            return []
    
    async def invalidate_menu_caches(self, org_id: str):
        """Invalidate menu item caches when menu changes"""
        
        if self.cache.is_connected():
            try:
                cache_key = f"menu_items:{org_id}"
                await self.cache.delete(cache_key)
                print(f"🗑️ Menu cache invalidated for org {org_id}")
            except Exception as cache_error:
                print(f"⚠️ Failed to invalidate menu cache: {cache_error}")
        else:
            print(f"⚠️ Redis not connected, skipping menu cache invalidation for org {org_id}")
    
    async def get_inventory_items(self, org_id: str, use_cache: bool = True) -> List[Dict]:
        """Get inventory items with Redis caching and robust fallback"""
        
        # Try cache first if enabled and Redis is connected
        if use_cache and self.cache.is_connected():
            try:
                cache_key = f"inventory:{org_id}"
                cached_data = await self.cache.get(cache_key)
                
                if cached_data:
                    inventory_items = json.loads(cached_data)
                    print(f"🚀 Cache HIT: {len(inventory_items)} inventory items for org {org_id}")
                    return inventory_items
                else:
                    print(f"💾 Cache MISS: inventory items for org {org_id}")
            except Exception as cache_error:
                print(f"❌ Redis cache error: {cache_error}, falling back to MongoDB")
        
        # Fallback to MongoDB
        print(f"📊 Fetching inventory items from MongoDB for org {org_id}")
        
        try:
            # Query inventory items for the organization
            query = {"organization_id": org_id}
            
            inventory_items = await self.db.inventory.find(
                query, 
                {"_id": 0}
            ).sort("name", 1).to_list(1000)
            
            # Convert datetime objects for consistency
            for item in inventory_items:
                try:
                    if isinstance(item.get("last_updated"), str):
                        item["last_updated"] = datetime.fromisoformat(item["last_updated"])
                except Exception as dt_error:
                    # If datetime conversion fails, leave as string
                    print(f"⚠️ Datetime conversion error for inventory item {item.get('id', 'unknown')}: {dt_error}")
                    pass
            
            # Try to cache the results if Redis is available
            if use_cache and self.cache.is_connected():
                try:
                    cache_key = f"inventory:{org_id}"
                    # Convert datetime objects to strings for JSON serialization
                    cache_items = []
                    for item in inventory_items:
                        cache_item = item.copy()
                        if isinstance(cache_item.get("last_updated"), datetime):
                            cache_item["last_updated"] = cache_item["last_updated"].isoformat()
                        cache_items.append(cache_item)
                    
                    await self.cache.setex(cache_key, 300, json.dumps(cache_items))  # 5 min cache
                    print(f"💾 Cached {len(inventory_items)} inventory items for org {org_id}")
                except Exception as cache_set_error:
                    print(f"⚠️ Failed to cache inventory items: {cache_set_error}")
            
            print(f"📊 Found {len(inventory_items)} inventory items for org {org_id}")
            return inventory_items
            
        except Exception as db_error:
            print(f"❌ MongoDB error in get_inventory_items: {db_error}")
            # Return empty list rather than crash
            return []
    
    async def invalidate_inventory_caches(self, org_id: str):
        """Invalidate inventory caches when inventory changes"""
        
        if self.cache.is_connected():
            try:
                cache_key = f"inventory:{org_id}"
                await self.cache.delete(cache_key)
                print(f"🗑️ Inventory cache invalidated for org {org_id}")
            except Exception as cache_error:
                print(f"⚠️ Failed to invalidate inventory cache: {cache_error}")
        else:
            print(f"⚠️ Redis not connected, skipping inventory cache invalidation for org {org_id}")
    
    async def invalidate_table_caches(self, org_id: str):
        """Invalidate table caches when table status changes"""
        
        if self.cache.is_connected():
            try:
                cache_key = f"tables:{org_id}"
                await self.cache.delete(cache_key)
                print(f"🗑️ Table cache invalidated for org {org_id}")
            except Exception as cache_error:
                print(f"⚠️ Failed to invalidate table cache: {cache_error}")
        else:
            print(f"⚠️ Redis not connected, skipping table cache invalidation for org {org_id}")


# ============ TABLE STATUS MANAGER ============

class TableStatusManager:
    """
    Handles immediate table status updates with direct database writes.
    Bypasses cache for writes, then invalidates cache to ensure consistency.
    """
    
    def __init__(self, db: AsyncIOMotorDatabase, cache: RedisCache):
        self.db = db
        self.cache = cache
        self.max_retries = 2
    
    async def set_table_occupied(self, org_id: str, table_id: str, order_id: str) -> dict:
        """
        Immediately set table to occupied when order is created.
        Uses direct DB update, then invalidates cache.
        Returns dict with success status and message.
        """
        for attempt in range(self.max_retries):
            try:
                # Direct database update - bypasses cache
                result = await self.db.tables.update_one(
                    {"id": table_id, "organization_id": org_id},
                    {"$set": {
                        "status": "occupied",
                        "current_order_id": order_id
                    }}
                )
                
                if result.modified_count > 0 or result.matched_count > 0:
                    # Invalidate cache after successful DB update
                    await self._invalidate_table_cache(org_id)
                    
                    print(f"✅ Table {table_id} set to OCCUPIED (order: {order_id})")
                    return {
                        "success": True,
                        "message": f"Table set to occupied",
                        "table_id": table_id,
                        "status": "occupied"
                    }
                else:
                    print(f"⚠️ Table {table_id} not found for org {org_id}")
                    return {
                        "success": False,
                        "message": "Table not found",
                        "table_id": table_id
                    }
                    
            except Exception as e:
                print(f"❌ Error setting table occupied (attempt {attempt + 1}): {e}")
                if attempt == self.max_retries - 1:
                    return {
                        "success": False,
                        "message": f"Failed to update table status: {str(e)}",
                        "table_id": table_id
                    }
        
        return {"success": False, "message": "Max retries exceeded", "table_id": table_id}
    
    async def set_table_available(self, org_id: str, table_id: str) -> dict:
        """
        Immediately set table to available when bill is completed.
        Uses direct DB update, then invalidates cache.
        Returns dict with success status and message.
        """
        for attempt in range(self.max_retries):
            try:
                # Direct database update - bypasses cache
                result = await self.db.tables.update_one(
                    {"id": table_id, "organization_id": org_id},
                    {"$set": {
                        "status": "available",
                        "current_order_id": None
                    }}
                )
                
                if result.modified_count > 0 or result.matched_count > 0:
                    # Invalidate cache after successful DB update
                    await self._invalidate_table_cache(org_id)
                    
                    print(f"✅ Table {table_id} set to AVAILABLE (cleared)")
                    return {
                        "success": True,
                        "message": "Table cleared and available",
                        "table_id": table_id,
                        "status": "available"
                    }
                else:
                    print(f"⚠️ Table {table_id} not found for org {org_id}")
                    return {
                        "success": False,
                        "message": "Table not found",
                        "table_id": table_id
                    }
                    
            except Exception as e:
                print(f"❌ Error setting table available (attempt {attempt + 1}): {e}")
                if attempt == self.max_retries - 1:
                    return {
                        "success": False,
                        "message": f"Failed to update table status: {str(e)}",
                        "table_id": table_id
                    }
        
        return {"success": False, "message": "Max retries exceeded", "table_id": table_id}
    
    async def get_tables_fresh(self, org_id: str) -> List[Dict]:
        """
        Fetch tables directly from database, bypassing cache.
        Used for critical operations requiring fresh data.
        """
        try:
            tables = await self.db.tables.find(
                {"organization_id": org_id},
                {"_id": 0}
            ).sort("table_number", 1).to_list(100)
            
            print(f"📊 Fresh fetch: {len(tables)} tables for org {org_id}")
            return tables
            
        except Exception as e:
            print(f"❌ Error fetching fresh tables: {e}")
            return []
    
    async def _invalidate_table_cache(self, org_id: str):
        """Internal method to invalidate table cache"""
        if self.cache.is_connected():
            try:
                cache_key = f"tables:{org_id}"
                await self.cache.delete(cache_key)
                print(f"🗑️ Table cache invalidated for org {org_id}")
            except Exception as e:
                print(f"⚠️ Failed to invalidate table cache: {e}")


# Global cache instance
redis_cache = RedisCache()
cached_order_service = None
table_status_manager = None

async def init_redis_cache(db: AsyncIOMotorDatabase):
    """Initialize Redis cache and order service"""
    global cached_order_service, table_status_manager
    
    await redis_cache.connect()
    cached_order_service = CachedOrderService(db, redis_cache)
    table_status_manager = TableStatusManager(db, redis_cache)
    
    print("🚀 Redis cache service initialized")

async def cleanup_redis_cache():
    """Cleanup Redis connections"""
    await redis_cache.disconnect()
    print("🧹 Redis cache cleaned up")

def get_cached_order_service() -> CachedOrderService:
    """Get the cached order service instance"""
    if cached_order_service is None:
        raise RuntimeError("Redis cache not initialized. Call init_redis_cache() first.")
    return cached_order_service

def get_table_status_manager() -> TableStatusManager:
    """Get the table status manager instance"""
    if table_status_manager is None:
        raise RuntimeError("Redis cache not initialized. Call init_redis_cache() first.")
    return table_status_manager