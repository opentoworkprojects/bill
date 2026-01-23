"""
Business Profile Fast Access Caching System
============================================

Provides ultra-fast caching for business profiles with:
- Multi-level caching (Redis + local cache)
- Intelligent cache invalidation
- Real-time profile updates
- Automatic cache warming
- Zero-latency access patterns

PERFORMANCE TARGETS:
- Cache hit: <10ms (vs MongoDB: 50-200ms)
- Profile access: 95%+ cache hit rate
- Memory efficiency: <100KB per profile
"""

import json
import asyncio
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from functools import lru_cache
import hashlib
import pickle

class BusinessProfileCache:
    """High-performance business profile caching with multi-level storage"""
    
    def __init__(self):
        # Local in-memory cache (tier 1 - fastest)
        self._local_cache: Dict[str, tuple] = {}  # {org_id: (profile_dict, expiry_time)}
        self._cache_stats = {
            "hits": 0,
            "misses": 0,
            "updates": 0,
            "invalidations": 0,
            "total_access_time": 0.0
        }
        
        # Cache configuration
        self.LOCAL_TTL = 300  # 5 minutes for local cache
        self.REDIS_TTL = 3600  # 1 hour for Redis cache
        
        # Redis client (will be injected)
        self.redis_client = None
        
        # Cache warming list
        self._warm_cache_orgs: List[str] = []
        
    async def set_redis_client(self, redis_client):
        """Set the Redis client for distributed caching"""
        self.redis_client = redis_client
        
    async def get_profile(self, org_id: str, db=None) -> Optional[Dict[str, Any]]:
        """
        Get business profile with multi-level caching
        
        Access pattern:
        1. Check local memory cache (< 1ms)
        2. Check Redis cache (< 10ms)
        3. Query MongoDB (50-200ms)
        4. Cache result and return
        """
        start_time = time.time()
        
        # Tier 1: Check local cache
        if org_id in self._local_cache:
            profile, expiry = self._local_cache[org_id]
            if time.time() < expiry:
                access_time = (time.time() - start_time) * 1000
                self._cache_stats["hits"] += 1
                self._cache_stats["total_access_time"] += access_time
                print(f"✅ Profile HIT (local): {org_id} in {access_time:.2f}ms")
                return profile
            else:
                # Expired, remove
                del self._local_cache[org_id]
        
        # Tier 2: Check Redis cache
        if self.redis_client:
            try:
                cache_key = f"profile:{org_id}"
                redis_data = await self.redis_client.get(cache_key)
                if redis_data:
                    profile = json.loads(redis_data)
                    # Promote to local cache
                    self._local_cache[org_id] = (profile, time.time() + self.LOCAL_TTL)
                    access_time = (time.time() - start_time) * 1000
                    self._cache_stats["hits"] += 1
                    self._cache_stats["total_access_time"] += access_time
                    print(f"✅ Profile HIT (Redis): {org_id} in {access_time:.2f}ms")
                    return profile
            except Exception as e:
                print(f"⚠️ Redis read failed: {e}")
        
        # Tier 3: Query MongoDB
        if not db:
            self._cache_stats["misses"] += 1
            print(f"❌ Profile MISS: {org_id} (no database)")
            return None
            
        try:
            profile = await db.users.find_one(
                {"id": org_id, "role": "admin"},
                {
                    "_id": 0,
                    "id": 1,
                    "username": 1,
                    "email": 1,
                    "restaurant_name": 1,
                    "business_settings": 1,
                    "setup_completed": 1,
                    "razorpay_key_id": 1,
                    "phone": 1,
                    "address": 1,
                    "city": 1,
                    "state": 1,
                    "pincode": 1,
                    "gst_number": 1,
                    "billing_address": 1,
                    "logo_url": 1,
                    "theme_color": 1,
                    "currency": 1,
                    "timezone": 1
                }
            )
            
            if profile:
                access_time = (time.time() - start_time) * 1000
                self._cache_stats["misses"] += 1
                self._cache_stats["total_access_time"] += access_time
                
                # Store in both caches
                self._local_cache[org_id] = (profile, time.time() + self.LOCAL_TTL)
                if self.redis_client:
                    try:
                        cache_key = f"profile:{org_id}"
                        await self.redis_client.setex(cache_key, self.REDIS_TTL, json.dumps(profile, default=str))
                    except Exception as e:
                        print(f"⚠️ Redis write failed: {e}")
                
                print(f"📊 Profile FETCH (MongoDB): {org_id} in {access_time:.2f}ms")
                return profile
            
            self._cache_stats["misses"] += 1
            print(f"❌ Profile NOT FOUND: {org_id}")
            return None
            
        except Exception as e:
            print(f"❌ Database error: {e}")
            self._cache_stats["misses"] += 1
            return None
    
    async def get_profile_lite(self, org_id: str, db=None) -> Optional[Dict[str, str]]:
        """
        Get lightweight profile (only essential fields)
        Perfect for billing and fast lookups
        """
        profile = await self.get_profile(org_id, db)
        if not profile:
            return None
            
        return {
            "id": profile.get("id"),
            "restaurant_name": profile.get("restaurant_name", ""),
            "gst_number": profile.get("gst_number", ""),
            "email": profile.get("email", ""),
            "phone": profile.get("phone", ""),
            "city": profile.get("city", ""),
            "billing_address": profile.get("billing_address", ""),
            "currency": profile.get("currency", "INR"),
            "timezone": profile.get("timezone", "Asia/Kolkata")
        }
    
    async def update_profile(self, org_id: str, updates: Dict[str, Any], db=None) -> bool:
        """
        Update business profile and invalidate cache
        """
        try:
            # Update database
            if db:
                result = await db.users.update_one(
                    {"id": org_id, "role": "admin"},
                    {"$set": updates}
                )
                
                if result.modified_count > 0:
                    self._cache_stats["updates"] += 1
                    
                    # Invalidate caches
                    await self.invalidate_profile(org_id)
                    
                    # Pre-fetch fresh data and cache it
                    await self.get_profile(org_id, db)
                    
                    print(f"✅ Profile updated and cache invalidated: {org_id}")
                    return True
            
            return False
            
        except Exception as e:
            print(f"❌ Profile update error: {e}")
            return False
    
    async def invalidate_profile(self, org_id: str) -> bool:
        """Invalidate profile from all cache tiers"""
        try:
            self._cache_stats["invalidations"] += 1
            
            # Clear local cache
            if org_id in self._local_cache:
                del self._local_cache[org_id]
            
            # Clear Redis cache
            if self.redis_client:
                try:
                    cache_key = f"profile:{org_id}"
                    await self.redis_client.delete(cache_key)
                except Exception as e:
                    print(f"⚠️ Redis invalidation failed: {e}")
            
            print(f"🗑️ Profile cache invalidated: {org_id}")
            return True
            
        except Exception as e:
            print(f"❌ Invalidation error: {e}")
            return False
    
    async def warm_cache(self, org_ids: List[str], db=None):
        """Pre-load profiles into cache"""
        print(f"🔥 Warming cache for {len(org_ids)} organizations...")
        
        for org_id in org_ids:
            try:
                await self.get_profile(org_id, db)
                await asyncio.sleep(0.01)  # Prevent overwhelming database
            except Exception as e:
                print(f"⚠️ Cache warming error for {org_id}: {e}")
        
        print(f"✅ Cache warming complete")
    
    async def get_profiles_batch(self, org_ids: List[str], db=None) -> Dict[str, Dict]:
        """
        Get multiple profiles efficiently with batching
        Ideal for dashboard and multi-restaurant views
        """
        profiles = {}
        missing_ids = []
        
        # Try local cache first
        for org_id in org_ids:
            if org_id in self._local_cache:
                profile, expiry = self._local_cache[org_id]
                if time.time() < expiry:
                    profiles[org_id] = profile
                else:
                    del self._local_cache[org_id]
                    missing_ids.append(org_id)
            else:
                missing_ids.append(org_id)
        
        # Batch fetch missing profiles from database
        if missing_ids and db:
            try:
                batch_profiles = await db.users.find(
                    {"id": {"$in": missing_ids}, "role": "admin"},
                    {"_id": 0}
                ).to_list(None)
                
                for profile in batch_profiles:
                    org_id = profile.get("id")
                    profiles[org_id] = profile
                    # Cache each one
                    self._local_cache[org_id] = (profile, time.time() + self.LOCAL_TTL)
            except Exception as e:
                print(f"❌ Batch fetch error: {e}")
        
        return profiles
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache performance statistics"""
        total_requests = self._cache_stats["hits"] + self._cache_stats["misses"]
        hit_rate = (self._cache_stats["hits"] / total_requests * 100) if total_requests > 0 else 0
        avg_access_time = (self._cache_stats["total_access_time"] / total_requests) if total_requests > 0 else 0
        
        return {
            "total_requests": total_requests,
            "cache_hits": self._cache_stats["hits"],
            "cache_misses": self._cache_stats["misses"],
            "hit_rate": f"{hit_rate:.2f}%",
            "profile_updates": self._cache_stats["updates"],
            "cache_invalidations": self._cache_stats["invalidations"],
            "avg_access_time_ms": f"{avg_access_time:.2f}ms",
            "local_cache_size": len(self._local_cache),
            "memory_usage": self._estimate_memory_usage()
        }
    
    def _estimate_memory_usage(self) -> str:
        """Estimate memory usage of cache"""
        total_size = 0
        for profile, _ in self._local_cache.values():
            total_size += len(json.dumps(profile))
        
        if total_size < 1024:
            return f"{total_size}B"
        elif total_size < 1024 * 1024:
            return f"{total_size / 1024:.2f}KB"
        else:
            return f"{total_size / (1024 * 1024):.2f}MB"
    
    def clear_all_caches(self):
        """Clear all local caches (for maintenance/testing)"""
        self._local_cache.clear()
        self._cache_stats = {
            "hits": 0,
            "misses": 0,
            "updates": 0,
            "invalidations": 0,
            "total_access_time": 0.0
        }
        print("🗑️ All local caches cleared")


# Global instance
_business_profile_cache: Optional[BusinessProfileCache] = None

async def init_business_profile_cache(redis_client=None) -> BusinessProfileCache:
    """Initialize the business profile cache"""
    global _business_profile_cache
    
    _business_profile_cache = BusinessProfileCache()
    if redis_client:
        await _business_profile_cache.set_redis_client(redis_client)
    
    print("✅ Business profile cache initialized")
    return _business_profile_cache

def get_business_profile_cache() -> Optional[BusinessProfileCache]:
    """Get the global business profile cache instance"""
    return _business_profile_cache
