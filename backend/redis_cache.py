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
    
    # ============ MENU CACHE ============
    
    async def get_menu_items(self, org_id: str) -> Optional[List[Dict]]:
        """Get cached menu items"""
        if not self.is_connected():
            return None
            
        try:
            cache_key = f"menu_items:{org_id}"
            cached_data = await self.redis.get(cache_key)
            
            if cached_data:
                items = json.loads(cached_data)
                print(f"🚀 Cache HIT: {len(items)} menu items for org {org_id}")
                return items
            else:
                print(f"💾 Cache MISS: menu items for org {org_id}")
                return None
                
        except Exception as e:
            print(f"❌ Redis get menu error: {e}")
            return None
    
    async def set_menu_items(self, org_id: str, items: List[Dict], ttl: int = 1800):
        """Cache menu items (30 min TTL)"""
        if not self.is_connected():
            return False
            
        try:
            cache_key = f"menu_items:{org_id}"
            
            # Convert datetime objects to ISO strings
            serializable_items = []
            for item in items:
                item_copy = item.copy()
                if isinstance(item_copy.get('created_at'), datetime):
                    item_copy['created_at'] = item_copy['created_at'].isoformat()
                serializable_items.append(item_copy)
            
            await self.redis.setex(cache_key, ttl, json.dumps(serializable_items))
            print(f"💾 Cached {len(items)} menu items for org {org_id} (TTL: {ttl}s)")
            return True
            
        except Exception as e:
            print(f"❌ Redis set menu error: {e}")
            return False
    
    async def invalidate_menu_items(self, org_id: str):
        """Invalidate menu items cache"""
        if not self.is_connected():
            return False
            
        try:
            cache_key = f"menu_items:{org_id}"
            await self.redis.delete(cache_key)
            print(f"🗑️ Invalidated menu items cache for org {org_id}")
            return True
            
        except Exception as e:
            print(f"❌ Redis delete menu error: {e}")
            return False
    
    # ============ TABLES CACHE ============
    
    async def get_tables(self, org_id: str) -> Optional[List[Dict]]:
        """Get cached tables"""
        if not self.is_connected():
            return None
            
        try:
            cache_key = f"tables:{org_id}"
            cached_data = await self.redis.get(cache_key)
            
            if cached_data:
                tables = json.loads(cached_data)
                print(f"🚀 Cache HIT: {len(tables)} tables for org {org_id}")
                return tables
            else:
                print(f"💾 Cache MISS: tables for org {org_id}")
                return None
                
        except Exception as e:
            print(f"❌ Redis get tables error: {e}")
            return None
    
    async def set_tables(self, org_id: str, tables: List[Dict], ttl: int = 900):
        """Cache tables (15 min TTL)"""
        if not self.is_connected():
            return False
            
        try:
            cache_key = f"tables:{org_id}"
            await self.redis.setex(cache_key, ttl, json.dumps(tables))
            print(f"💾 Cached {len(tables)} tables for org {org_id} (TTL: {ttl}s)")
            return True
            
        except Exception as e:
            print(f"❌ Redis set tables error: {e}")
            return False
    
    async def invalidate_tables(self, org_id: str):
        """Invalidate tables cache"""
        if not self.is_connected():
            return False
            
        try:
            cache_key = f"tables:{org_id}"
            await self.redis.delete(cache_key)
            print(f"🗑️ Invalidated tables cache for org {org_id}")
            return True
            
        except Exception as e:
            print(f"❌ Redis delete tables error: {e}")
            return False
    
    # ============ USER SETTINGS CACHE ============
    
    async def get_user_settings(self, user_id: str) -> Optional[Dict]:
        """Get cached user settings"""
        if not self.is_connected():
            return None
            
        try:
            cache_key = f"user_settings:{user_id}"
            cached_data = await self.redis.get(cache_key)
            
            if cached_data:
                settings = json.loads(cached_data)
                print(f"🚀 Cache HIT: user settings for {user_id}")
                return settings
            else:
                print(f"💾 Cache MISS: user settings for {user_id}")
                return None
                
        except Exception as e:
            print(f"❌ Redis get user settings error: {e}")
            return None
    
    async def set_user_settings(self, user_id: str, settings: Dict, ttl: int = 3600):
        """Cache user settings (1 hour TTL)"""
        if not self.is_connected():
            return False
            
        try:
            cache_key = f"user_settings:{user_id}"
            
            # Convert datetime objects to ISO strings
            settings_copy = settings.copy()
            if isinstance(settings_copy.get('created_at'), datetime):
                settings_copy['created_at'] = settings_copy['created_at'].isoformat()
            if isinstance(settings_copy.get('subscription_expires_at'), datetime):
                settings_copy['subscription_expires_at'] = settings_copy['subscription_expires_at'].isoformat()
            
            await self.redis.setex(cache_key, ttl, json.dumps(settings_copy))
            print(f"💾 Cached user settings for {user_id}")
            return True
            
        except Exception as e:
            print(f"❌ Redis set user settings error: {e}")
            return False
    
    async def invalidate_user_settings(self, user_id: str):
        """Invalidate user settings cache"""
        if not self.is_connected():
            return False
            
        try:
            cache_key = f"user_settings:{user_id}"
            await self.redis.delete(cache_key)
            print(f"🗑️ Invalidated user settings cache for {user_id}")
            return True
            
        except Exception as e:
            print(f"❌ Redis delete user settings error: {e}")
            return False
    
    # ============ REPORTS CACHE ============
    
    async def get_reports_data(self, org_id: str, report_type: str, date_range: str) -> Optional[Dict]:
        """Get cached reports data"""
        if not self.is_connected():
            return None
            
        try:
            cache_key = f"reports:{org_id}:{report_type}:{date_range}"
            cached_data = await self.redis.get(cache_key)
            
            if cached_data:
                reports = json.loads(cached_data)
                print(f"🚀 Cache HIT: {report_type} reports for org {org_id}")
                return reports
            else:
                print(f"💾 Cache MISS: {report_type} reports for org {org_id}")
                return None
                
        except Exception as e:
            print(f"❌ Redis get reports error: {e}")
            return None
    
    async def set_reports_data(self, org_id: str, report_type: str, date_range: str, data: Dict, ttl: int = 600):
        """Cache reports data (10 min TTL)"""
        if not self.is_connected():
            return False
            
        try:
            cache_key = f"reports:{org_id}:{report_type}:{date_range}"
            
            # Convert datetime objects to ISO strings
            data_copy = data.copy()
            if 'orders' in data_copy:
                for order in data_copy['orders']:
                    if isinstance(order.get('created_at'), datetime):
                        order['created_at'] = order['created_at'].isoformat()
            
            await self.redis.setex(cache_key, ttl, json.dumps(data_copy))
            print(f"💾 Cached {report_type} reports for org {org_id}")
            return True
            
        except Exception as e:
            print(f"❌ Redis set reports error: {e}")
            return False
    
    async def invalidate_reports_data(self, org_id: str):
        """Invalidate all reports cache for organization"""
        if not self.is_connected():
            return False
            
        try:
            # Use pattern matching to delete all report caches for this org
            pattern = f"reports:{org_id}:*"
            keys = await self.redis.keys(pattern)
            if keys:
                await self.redis.delete(*keys)
                print(f"🗑️ Invalidated {len(keys)} report caches for org {org_id}")
            return True
            
        except Exception as e:
            print(f"❌ Redis delete reports error: {e}")
            return False
    
    # ============ SUPER ADMIN CACHE ============
    
    async def get_super_admin_dashboard(self) -> Optional[Dict]:
        """Get cached super admin dashboard data"""
        if not self.is_connected():
            return None
            
        try:
            cache_key = "super_admin:dashboard"
            cached_data = await self.redis.get(cache_key)
            
            if cached_data:
                dashboard = json.loads(cached_data)
                print("🚀 Cache HIT: super admin dashboard")
                return dashboard
            else:
                print("💾 Cache MISS: super admin dashboard")
                return None
                
        except Exception as e:
            print(f"❌ Redis get super admin dashboard error: {e}")
            return None
    
    async def set_super_admin_dashboard(self, dashboard: Dict, ttl: int = 300):
        """Cache super admin dashboard (5 min TTL)"""
        if not self.is_connected():
            return False
            
        try:
            cache_key = "super_admin:dashboard"
            await self.redis.setex(cache_key, ttl, json.dumps(dashboard))
            print(f"💾 Cached super admin dashboard (TTL: {ttl}s)")
            return True
            
        except Exception as e:
            print(f"❌ Redis set super admin dashboard error: {e}")
            return False
    
    async def get_super_admin_users(self, skip: int = 0, limit: int = 50) -> Optional[Dict]:
        """Get cached super admin users data"""
        if not self.is_connected():
            return None
            
        try:
            cache_key = f"super_admin:users:{skip}:{limit}"
            cached_data = await self.redis.get(cache_key)
            
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
        """Cache super admin users data (3 min TTL)"""
        if not self.is_connected():
            return False
            
        try:
            cache_key = f"super_admin:users:{skip}:{limit}"
            
            # Convert datetime objects to ISO strings
            users_copy = users_data.copy()
            if 'users' in users_copy:
                for user in users_copy['users']:
                    if isinstance(user.get('created_at'), datetime):
                        user['created_at'] = user['created_at'].isoformat()
                    if isinstance(user.get('subscription_expires_at'), datetime):
                        user['subscription_expires_at'] = user['subscription_expires_at'].isoformat()
                    if isinstance(user.get('subscription_started_at'), datetime):
                        user['subscription_started_at'] = user['subscription_started_at'].isoformat()
            
            await self.redis.setex(cache_key, ttl, json.dumps(users_copy))
            print(f"💾 Cached super admin users (skip={skip}, limit={limit}, TTL: {ttl}s)")
            return True
            
        except Exception as e:
            print(f"❌ Redis set super admin users error: {e}")
            return False
    
    async def get_super_admin_tickets(self, limit: int = 20) -> Optional[Dict]:
        """Get cached super admin tickets data"""
        if not self.is_connected():
            return None
            
        try:
            cache_key = f"super_admin:tickets:{limit}"
            cached_data = await self.redis.get(cache_key)
            
            if cached_data:
                tickets_data = json.loads(cached_data)
                print(f"🚀 Cache HIT: super admin tickets (limit={limit})")
                return tickets_data
            else:
                print(f"💾 Cache MISS: super admin tickets (limit={limit})")
                return None
                
        except Exception as e:
            print(f"❌ Redis get super admin tickets error: {e}")
            return None
    
    async def set_super_admin_tickets(self, tickets_data: Dict, limit: int = 20, ttl: int = 120):
        """Cache super admin tickets data (2 min TTL)"""
        if not self.is_connected():
            return False
            
        try:
            cache_key = f"super_admin:tickets:{limit}"
            
            # Convert datetime objects to ISO strings
            tickets_copy = tickets_data.copy()
            if 'tickets' in tickets_copy:
                for ticket in tickets_copy['tickets']:
                    if isinstance(ticket.get('created_at'), datetime):
                        ticket['created_at'] = ticket['created_at'].isoformat()
                    if isinstance(ticket.get('updated_at'), datetime):
                        ticket['updated_at'] = ticket['updated_at'].isoformat()
            
            await self.redis.setex(cache_key, ttl, json.dumps(tickets_copy))
            print(f"💾 Cached super admin tickets (limit={limit}, TTL: {ttl}s)")
            return True
            
        except Exception as e:
            print(f"❌ Redis set super admin tickets error: {e}")
            return False
    
    async def get_super_admin_orders(self, days: int = 7, limit: int = 20) -> Optional[Dict]:
        """Get cached super admin orders data"""
        if not self.is_connected():
            return None
            
        try:
            cache_key = f"super_admin:orders:{days}:{limit}"
            cached_data = await self.redis.get(cache_key)
            
            if cached_data:
                orders_data = json.loads(cached_data)
                print(f"🚀 Cache HIT: super admin orders (days={days}, limit={limit})")
                return orders_data
            else:
                print(f"💾 Cache MISS: super admin orders (days={days}, limit={limit})")
                return None
                
        except Exception as e:
            print(f"❌ Redis get super admin orders error: {e}")
            return None
    
    async def set_super_admin_orders(self, orders_data: Dict, days: int = 7, limit: int = 20, ttl: int = 180):
        """Cache super admin orders data (3 min TTL)"""
        if not self.is_connected():
            return False
            
        try:
            cache_key = f"super_admin:orders:{days}:{limit}"
            
            # Convert datetime objects to ISO strings
            orders_copy = orders_data.copy()
            if 'orders' in orders_copy:
                for order in orders_copy['orders']:
                    if isinstance(order.get('created_at'), datetime):
                        order['created_at'] = order['created_at'].isoformat()
                    if isinstance(order.get('updated_at'), datetime):
                        order['updated_at'] = order['updated_at'].isoformat()
            
            await self.redis.setex(cache_key, ttl, json.dumps(orders_copy))
            print(f"💾 Cached super admin orders (days={days}, limit={limit}, TTL: {ttl}s)")
            return True
            
        except Exception as e:
            print(f"❌ Redis set super admin orders error: {e}")
            return False
    
    async def get_super_admin_leads(self) -> Optional[Dict]:
        """Get cached super admin leads data"""
        if not self.is_connected():
            return None
            
        try:
            cache_key = "super_admin:leads"
            cached_data = await self.redis.get(cache_key)
            
            if cached_data:
                leads_data = json.loads(cached_data)
                print("🚀 Cache HIT: super admin leads")
                return leads_data
            else:
                print("💾 Cache MISS: super admin leads")
                return None
                
        except Exception as e:
            print(f"❌ Redis get super admin leads error: {e}")
            return None
    
    async def set_super_admin_leads(self, leads_data: Dict, ttl: int = 300):
        """Cache super admin leads data (5 min TTL)"""
        if not self.is_connected():
            return False
            
        try:
            cache_key = "super_admin:leads"
            
            # Convert datetime objects to ISO strings
            leads_copy = leads_data.copy()
            if 'leads' in leads_copy:
                for lead in leads_copy['leads']:
                    if isinstance(lead.get('created_at'), datetime):
                        lead['created_at'] = lead['created_at'].isoformat()
                    if isinstance(lead.get('timestamp'), datetime):
                        lead['timestamp'] = lead['timestamp'].isoformat()
            
            await self.redis.setex(cache_key, ttl, json.dumps(leads_copy))
            print(f"💾 Cached super admin leads (TTL: {ttl}s)")
            return True
            
        except Exception as e:
            print(f"❌ Redis set super admin leads error: {e}")
            return False
    
    async def get_super_admin_team(self) -> Optional[Dict]:
        """Get cached super admin team data"""
        if not self.is_connected():
            return None
            
        try:
            cache_key = "super_admin:team"
            cached_data = await self.redis.get(cache_key)
            
            if cached_data:
                team_data = json.loads(cached_data)
                print("🚀 Cache HIT: super admin team")
                return team_data
            else:
                print("💾 Cache MISS: super admin team")
                return None
                
        except Exception as e:
            print(f"❌ Redis get super admin team error: {e}")
            return None
    
    async def set_super_admin_team(self, team_data: Dict, ttl: int = 600):
        """Cache super admin team data (10 min TTL)"""
        if not self.is_connected():
            return False
            
        try:
            cache_key = "super_admin:team"
            
            # Convert datetime objects to ISO strings
            team_copy = team_data.copy()
            if 'members' in team_copy:
                for member in team_copy['members']:
                    if isinstance(member.get('created_at'), datetime):
                        member['created_at'] = member['created_at'].isoformat()
                    if isinstance(member.get('last_login'), datetime):
                        member['last_login'] = member['last_login'].isoformat()
            
            await self.redis.setex(cache_key, ttl, json.dumps(team_copy))
            print(f"💾 Cached super admin team (TTL: {ttl}s)")
            return True
            
        except Exception as e:
            print(f"❌ Redis set super admin team error: {e}")
            return False
    
    async def get_super_admin_analytics(self, days: int = 30) -> Optional[Dict]:
        """Get cached super admin analytics data"""
        if not self.is_connected():
            return None
            
        try:
            cache_key = f"super_admin:analytics:{days}"
            cached_data = await self.redis.get(cache_key)
            
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
    
    async def set_super_admin_analytics(self, analytics_data: Dict, days: int = 30, ttl: int = 900):
        """Cache super admin analytics data (15 min TTL)"""
        if not self.is_connected():
            return False
            
        try:
            cache_key = f"super_admin:analytics:{days}"
            await self.redis.setex(cache_key, ttl, json.dumps(analytics_data))
            print(f"💾 Cached super admin analytics (days={days}, TTL: {ttl}s)")
            return True
            
        except Exception as e:
            print(f"❌ Redis set super admin analytics error: {e}")
            return False
    
    async def invalidate_super_admin_cache(self, cache_type: str = "all"):
        """Invalidate super admin caches"""
        if not self.is_connected():
            return False
            
        try:
            if cache_type == "all":
                # Delete all super admin caches
                pattern = "super_admin:*"
                keys = await self.redis.keys(pattern)
                if keys:
                    await self.redis.delete(*keys)
                    print(f"🗑️ Invalidated {len(keys)} super admin caches")
            else:
                # Delete specific cache type
                if cache_type == "dashboard":
                    await self.redis.delete("super_admin:dashboard")
                elif cache_type == "users":
                    pattern = "super_admin:users:*"
                    keys = await self.redis.keys(pattern)
                    if keys:
                        await self.redis.delete(*keys)
                elif cache_type == "tickets":
                    pattern = "super_admin:tickets:*"
                    keys = await self.redis.keys(pattern)
                    if keys:
                        await self.redis.delete(*keys)
                elif cache_type == "orders":
                    pattern = "super_admin:orders:*"
                    keys = await self.redis.keys(pattern)
                    if keys:
                        await self.redis.delete(*keys)
                elif cache_type == "leads":
                    await self.redis.delete("super_admin:leads")
                elif cache_type == "team":
                    await self.redis.delete("super_admin:team")
                elif cache_type == "analytics":
                    pattern = "super_admin:analytics:*"
                    keys = await self.redis.keys(pattern)
                    if keys:
                        await self.redis.delete(*keys)
                
                print(f"🗑️ Invalidated super admin {cache_type} cache")
            
            return True
            
        except Exception as e:
            print(f"❌ Redis invalidate super admin cache error: {e}")
            return False

    # ============ RATE LIMITING ============
    
    async def check_rate_limit(self, key: str, limit: int, window: int) -> bool:
        """Check if request is within rate limit"""
        if not self.is_connected():
            return True  # Allow if Redis is down
            
        try:
            current = await self.redis.incr(key)
            if current == 1:
                await self.redis.expire(key, window)
            
            return current <= limit
            
        except Exception as e:
            print(f"❌ Redis rate limit error: {e}")
            return True  # Allow if error
    
    async def get_rate_limit_remaining(self, key: str, limit: int) -> int:
        """Get remaining requests in rate limit window"""
        if not self.is_connected():
            return limit
            
        try:
            current = await self.redis.get(key)
            if current is None:
                return limit
            return max(0, limit - int(current))
            
        except Exception as e:
            print(f"❌ Redis rate limit check error: {e}")
            return limit

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
    
    async def get_menu_items(self, org_id: str, use_cache: bool = True) -> List[Dict]:
        """Get menu items with caching"""
        
        # Try cache first
        if use_cache:
            cached_items = await self.cache.get_menu_items(org_id)
            if cached_items is not None:
                return cached_items
        
        # Fallback to MongoDB
        print(f"📊 Fetching menu items from MongoDB for org {org_id}")
        
        items = await self.db.menu_items.find(
            {"organization_id": org_id}, 
            {"_id": 0}
        ).sort("category", 1).to_list(1000)
        
        # Convert datetime objects
        for item in items:
            if isinstance(item.get("created_at"), str):
                item["created_at"] = datetime.fromisoformat(item["created_at"])
        
        # Cache the results
        if use_cache:
            await self.cache.set_menu_items(org_id, items, ttl=1800)  # 30 min cache
        
        print(f"📊 Found {len(items)} menu items for org {org_id}")
        return items
    
    async def get_tables(self, org_id: str, use_cache: bool = True) -> List[Dict]:
        """Get tables with caching"""
        
        # Try cache first
        if use_cache:
            cached_tables = await self.cache.get_tables(org_id)
            if cached_tables is not None:
                return cached_tables
        
        # Fallback to MongoDB
        print(f"📊 Fetching tables from MongoDB for org {org_id}")
        
        tables = await self.db.tables.find(
            {"organization_id": org_id}, 
            {"_id": 0}
        ).sort("table_number", 1).to_list(1000)
        
        # Cache the results
        if use_cache:
            await self.cache.set_tables(org_id, tables, ttl=900)  # 15 min cache
        
        print(f"📊 Found {len(tables)} tables for org {org_id}")
        return tables
    
    async def get_user_settings(self, user_id: str, use_cache: bool = True) -> Optional[Dict]:
        """Get user settings with caching"""
        
        # Try cache first
        if use_cache:
            cached_settings = await self.cache.get_user_settings(user_id)
            if cached_settings is not None:
                return cached_settings
        
        # Fallback to MongoDB
        user = await self.db.users.find_one(
            {"id": user_id}, 
            {"_id": 0, "password": 0}  # Exclude password for security
        )
        
        if user:
            # Convert datetime objects
            if isinstance(user.get("created_at"), str):
                user["created_at"] = datetime.fromisoformat(user["created_at"])
            if isinstance(user.get("subscription_expires_at"), str):
                user["subscription_expires_at"] = datetime.fromisoformat(user["subscription_expires_at"])
            
            # Cache the result
            if use_cache:
                await self.cache.set_user_settings(user_id, user, ttl=3600)  # 1 hour cache
        
        return user
    
    async def get_reports_data(self, org_id: str, report_type: str, date_range: str, use_cache: bool = True) -> Optional[Dict]:
        """Get reports data with caching"""
        
        # Try cache first
        if use_cache:
            cached_reports = await self.cache.get_reports_data(org_id, report_type, date_range)
            if cached_reports is not None:
                return cached_reports
        
        # Fallback to MongoDB - implement based on report type
        print(f"📊 Generating {report_type} reports from MongoDB for org {org_id}")
        
        # This would contain the actual report generation logic
        # For now, return a placeholder
        reports_data = {
            "type": report_type,
            "date_range": date_range,
            "generated_at": datetime.now().isoformat(),
            "data": {}
        }
        
        # Cache the results
        if use_cache:
            await self.cache.set_reports_data(org_id, report_type, date_range, reports_data, ttl=600)  # 10 min cache
        
        return reports_data
    
    async def invalidate_order_caches(self, org_id: str, order_id: str = None):
        """Invalidate caches when orders change"""
        
        # Always invalidate active orders list
        await self.cache.invalidate_active_orders(org_id)
        
        # Invalidate specific order if provided
        if order_id:
            await self.cache.invalidate_order(order_id, org_id)
        
        # Invalidate reports since order data changed
        await self.cache.invalidate_reports_data(org_id)
        
        # Publish real-time update
        if order_id:
            await self.cache.publish_order_update(org_id, order_id, "cache_invalidated")
    
    async def invalidate_menu_caches(self, org_id: str):
        """Invalidate menu-related caches"""
        await self.cache.invalidate_menu_items(org_id)
    
    async def invalidate_table_caches(self, org_id: str):
        """Invalidate table-related caches"""
        await self.cache.invalidate_tables(org_id)
    
    async def invalidate_user_caches(self, user_id: str):
        """Invalidate user-related caches"""
        await self.cache.invalidate_user_settings(user_id)

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