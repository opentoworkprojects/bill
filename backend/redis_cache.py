"""
Redis Cache Service for BillByteKOT
Provides fast caching for active orders and real-time updates
"""

import json
import os
import asyncio
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import redis.asyncio as redis
from motor.motor_asyncio import AsyncIOMotorDatabase

class RedisCache:
    def __init__(self):
        self.redis = None
        self.connected = False
        
    async def connect(self):
        """Connect to Redis with fallback handling"""
        try:
            redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
            redis_password = os.getenv("REDIS_PASSWORD")
            
            print(f"🔍 Connecting to Redis: {redis_url}")
            
            # Check if it's a cloud URL
            is_cloud_url = "cloud.redislabs.com" in redis_url or "amazonaws.com" in redis_url or "azure.com" in redis_url
            
            if is_cloud_url and redis_password and redis_password != "your_redis_password_here":
                # Add password to cloud URL
                if "://" in redis_url and "@" not in redis_url:
                    protocol, rest = redis_url.split("://", 1)
                    auth_url = f"{protocol}://:{redis_password}@{rest}"
                else:
                    auth_url = redis_url
                
                self.redis = redis.from_url(
                    auth_url,
                    decode_responses=True,
                    socket_connect_timeout=10,
                    socket_timeout=10
                )
                await self.redis.ping()
                self.connected = True
                print("✅ Redis connected (cloud with auth)")
                return
                
            elif redis_url != "redis://localhost:6379":
                # Try direct connection without auth
                self.redis = redis.from_url(
                    redis_url,
                    decode_responses=True,
                    socket_connect_timeout=10,
                    socket_timeout=10
                )
                await self.redis.ping()
                self.connected = True
                print("✅ Redis connected (direct)")
                return
                
            else:
                # Try local Redis
                self.redis = redis.from_url(redis_url, decode_responses=True)
                await self.redis.ping()
                self.connected = True
                print("✅ Redis connected (local)")
                return
                
        except Exception as e:
            print(f"⚠️ Redis connection failed: {e}")
            
        print("📝 Continuing without Redis cache (will use MongoDB only)")
        self.connected = False
        self.redis = None
    
    async def disconnect(self):
        """Disconnect from Redis"""
        if self.redis:
            await self.redis.aclose()
            self.connected = False
            print("🔌 Redis disconnected")
    
    def is_connected(self) -> bool:
        """Check if Redis is connected"""
        return self.connected and self.redis is not None
    
    # ============ ACTIVE ORDERS CACHE ============
    
    async def get_active_orders(self, org_id: str) -> Optional[List[Dict]]:
        """Get active orders from cache"""
        if not self.is_connected():
            return None
            
        try:
            cache_key = f"active_orders:{org_id}"
            cached_data = await self.redis.get(cache_key)
            
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
            
            await self.redis.setex(cache_key, ttl, json.dumps(serializable_orders))
            print(f"💾 Cached {len(orders)} active orders for org {org_id} (TTL: {ttl}s)")
            return True
            
        except Exception as e:
            print(f"❌ Redis set error: {e}")
            return False
    
    async def invalidate_active_orders(self, org_id: str):
        """Invalidate active orders cache when orders change"""
        if not self.is_connected():
            return False
            
        try:
            cache_key = f"active_orders:{org_id}"
            await self.redis.delete(cache_key)
            print(f"🗑️ Invalidated active orders cache for org {org_id}")
            return True
            
        except Exception as e:
            print(f"❌ Redis delete error: {e}")
            return False
    
    # ============ ORDER DETAILS CACHE ============
    
    async def get_order(self, order_id: str, org_id: str) -> Optional[Dict]:
        """Get single order from cache"""
        if not self.is_connected():
            return None
            
        try:
            cache_key = f"order:{org_id}:{order_id}"
            cached_data = await self.redis.get(cache_key)
            
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
            
            await self.redis.setex(cache_key, ttl, json.dumps(order_copy))
            print(f"💾 Cached order {order_id}")
            return True
            
        except Exception as e:
            print(f"❌ Redis set order error: {e}")
            return False
    
    async def invalidate_order(self, order_id: str, org_id: str):
        """Invalidate single order cache"""
        if not self.is_connected():
            return False
            
        try:
            cache_key = f"order:{org_id}:{order_id}"
            await self.redis.delete(cache_key)
            print(f"🗑️ Invalidated order cache {order_id}")
            return True
            
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
            
            await self.redis.publish(channel, json.dumps(message))
            print(f"📡 Published order update: {action} for order {order_id}")
            return True
            
        except Exception as e:
            print(f"❌ Redis publish error: {e}")
            return False
    
    # ============ STATISTICS CACHE ============
    
    async def get_order_stats(self, org_id: str) -> Optional[Dict]:
        """Get cached order statistics"""
        if not self.is_connected():
            return None
            
        try:
            cache_key = f"order_stats:{org_id}"
            cached_data = await self.redis.get(cache_key)
            
            if cached_data:
                stats = json.loads(cached_data)
                print(f"🚀 Cache HIT: order stats for org {org_id}")
                return stats
            else:
                print(f"💾 Cache MISS: order stats for org {org_id}")
                return None
                
        except Exception as e:
            print(f"❌ Redis get stats error: {e}")
            return None
    
    async def set_order_stats(self, org_id: str, stats: Dict, ttl: int = 180):
        """Cache order statistics (3 min TTL)"""
        if not self.is_connected():
            return False
            
        try:
            cache_key = f"order_stats:{org_id}"
            await self.redis.setex(cache_key, ttl, json.dumps(stats))
            print(f"💾 Cached order stats for org {org_id}")
            return True
            
        except Exception as e:
            print(f"❌ Redis set stats error: {e}")
            return False

# ============ CACHE-ENHANCED ORDER SERVICE ============

class CachedOrderService:
    def __init__(self, db: AsyncIOMotorDatabase, cache: RedisCache):
        self.db = db
        self.cache = cache
    
    async def get_active_orders(self, org_id: str, use_cache: bool = True) -> List[Dict]:
        """Get active orders with Redis caching"""
        
        # Try cache first if enabled
        if use_cache:
            cached_orders = await self.cache.get_active_orders(org_id)
            if cached_orders is not None:
                return cached_orders
        
        # Fallback to MongoDB
        print(f"📊 Fetching active orders from MongoDB for org {org_id}")
        
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
            if isinstance(order.get("created_at"), str):
                order["created_at"] = datetime.fromisoformat(order["created_at"])
            if isinstance(order.get("updated_at"), str):
                order["updated_at"] = datetime.fromisoformat(order["updated_at"])
        
        # Cache the results
        if use_cache:
            await self.cache.set_active_orders(org_id, orders, ttl=300)  # 5 min cache
        
        print(f"📊 Found {len(orders)} active orders for org {org_id}")
        return orders
    
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

# Global cache instance
redis_cache = RedisCache()
cached_order_service = None

async def init_redis_cache(db: AsyncIOMotorDatabase):
    """Initialize Redis cache and order service"""
    global cached_order_service
    
    await redis_cache.connect()
    cached_order_service = CachedOrderService(db, redis_cache)
    
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