"""
Multi-Tier Caching System
==========================

L1: In-memory LRU cache (1-5ms access) - Hot data
L2: Redis cache (5-20ms access) - Warm data  
L3: MongoDB (50-100ms access) - Cold data

PERFORMANCE TARGETS:
- L1 hit rate: 60%+
- L2 hit rate: 30%+
- L3 fallback: 10%
- Average access time: <15ms
"""

import time
import asyncio
from typing import Any, Optional, Dict, Callable
from collections import OrderedDict
from datetime import datetime, timedelta
import json
import hashlib


class LRUCache:
    """Thread-safe LRU cache for L1 (in-memory)"""
    
    def __init__(self, capacity: int = 1000):
        self.cache: OrderedDict = OrderedDict()
        self.capacity = capacity
        self.hits = 0
        self.misses = 0
        self.lock = asyncio.Lock()
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        async with self.lock:
            if key in self.cache:
                # Move to end (most recently used)
                self.cache.move_to_end(key)
                self.hits += 1
                return self.cache[key]["value"]
            self.misses += 1
            return None
    
    async def set(self, key: str, value: Any, ttl: int = 300):
        """Set value in cache with TTL"""
        async with self.lock:
            if key in self.cache:
                self.cache.move_to_end(key)
            else:
                if len(self.cache) >= self.capacity:
                    # Remove least recently used
                    self.cache.popitem(last=False)
            
            self.cache[key] = {
                "value": value,
                "expires_at": time.time() + ttl
            }
    
    async def delete(self, key: str):
        """Delete key from cache"""
        async with self.lock:
            self.cache.pop(key, None)
    
    async def clear(self):
        """Clear all cache"""
        async with self.lock:
            self.cache.clear()
    
    async def cleanup_expired(self):
        """Remove expired entries"""
        async with self.lock:
            current_time = time.time()
            expired_keys = [
                k for k, v in self.cache.items() 
                if v["expires_at"] < current_time
            ]
            for key in expired_keys:
                del self.cache[key]
    
    def get_stats(self) -> dict:
        """Get cache statistics"""
        total = self.hits + self.misses
        hit_rate = (self.hits / total * 100) if total > 0 else 0
        return {
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate": f"{hit_rate:.2f}%",
            "size": len(self.cache),
            "capacity": self.capacity
        }


class MultiTierCache:
    """
    Multi-tier caching system with automatic fallback
    
    Usage:
        cache = MultiTierCache(redis_client, db)
        
        # Get with automatic tier fallback
        data = await cache.get("menu:org123", fetch_from_db_func)
        
        # Set across all tiers
        await cache.set("menu:org123", menu_data, ttl=1800)
    """
    
    def __init__(self, redis_client=None, db=None):
        # L1: In-memory LRU cache
        self.l1_cache = LRUCache(capacity=1000)
        
        # L2: Redis cache
        self.redis = redis_client
        
        # L3: MongoDB
        self.db = db
        
        # Statistics
        self.stats = {
            "l1_hits": 0,
            "l2_hits": 0,
            "l3_hits": 0,
            "total_requests": 0,
            "avg_latency_ms": 0
        }
        
        # Start cleanup task
        asyncio.create_task(self._cleanup_loop())
    
    async def get(
        self, 
        key: str, 
        fetch_func: Optional[Callable] = None,
        ttl: int = 300
    ) -> Optional[Any]:
        """
        Get value from cache with automatic tier fallback
        
        Args:
            key: Cache key
            fetch_func: Function to fetch data if not in cache
            ttl: Time to live in seconds
        
        Returns:
            Cached value or fetched value
        """
        start_time = time.time()
        self.stats["total_requests"] += 1
        
        # Try L1 (in-memory)
        value = await self.l1_cache.get(key)
        if value is not None:
            self.stats["l1_hits"] += 1
            latency = (time.time() - start_time) * 1000
            self._update_avg_latency(latency)
            print(f"🚀 L1 HIT: {key} ({latency:.2f}ms)")
            return value
        
        # Try L2 (Redis)
        if self.redis:
            try:
                redis_value = await self.redis.get(key)
                if redis_value:
                    # Deserialize
                    value = json.loads(redis_value)
                    
                    # Promote to L1
                    await self.l1_cache.set(key, value, ttl)
                    
                    self.stats["l2_hits"] += 1
                    latency = (time.time() - start_time) * 1000
                    self._update_avg_latency(latency)
                    print(f"⚡ L2 HIT: {key} ({latency:.2f}ms)")
                    return value
            except Exception as e:
                print(f"⚠️ Redis error: {e}")
        
        # Try L3 (fetch from source)
        if fetch_func:
            try:
                value = await fetch_func()
                
                if value is not None:
                    # Store in all tiers
                    await self.set(key, value, ttl)
                    
                    self.stats["l3_hits"] += 1
                    latency = (time.time() - start_time) * 1000
                    self._update_avg_latency(latency)
                    print(f"📊 L3 FETCH: {key} ({latency:.2f}ms)")
                    return value
            except Exception as e:
                print(f"❌ Fetch error: {e}")
        
        return None
    
    async def set(self, key: str, value: Any, ttl: int = 300):
        """Set value in all cache tiers"""
        # L1: In-memory
        await self.l1_cache.set(key, value, ttl)
        
        # L2: Redis
        if self.redis:
            try:
                serialized = json.dumps(value, default=str)
                await self.redis.setex(key, ttl, serialized)
            except Exception as e:
                print(f"⚠️ Redis set error: {e}")
    
    async def delete(self, key: str):
        """Delete key from all cache tiers"""
        # L1
        await self.l1_cache.delete(key)
        
        # L2
        if self.redis:
            try:
                await self.redis.delete(key)
            except Exception as e:
                print(f"⚠️ Redis delete error: {e}")
    
    async def invalidate_pattern(self, pattern: str):
        """Invalidate all keys matching pattern"""
        # L1: Clear all (pattern matching not efficient in LRU)
        await self.l1_cache.clear()
        
        # L2: Delete matching keys
        if self.redis:
            try:
                keys = await self.redis.keys(pattern)
                if keys:
                    await self.redis.delete(*keys)
                    print(f"🗑️ Invalidated {len(keys)} keys matching: {pattern}")
            except Exception as e:
                print(f"⚠️ Redis pattern delete error: {e}")
    
    def _update_avg_latency(self, latency_ms: float):
        """Update average latency"""
        current_avg = self.stats["avg_latency_ms"]
        total = self.stats["total_requests"]
        
        # Exponential moving average
        alpha = 0.1
        self.stats["avg_latency_ms"] = (alpha * latency_ms) + ((1 - alpha) * current_avg)
    
    async def _cleanup_loop(self):
        """Periodic cleanup of expired entries"""
        while True:
            await asyncio.sleep(60)  # Every minute
            try:
                await self.l1_cache.cleanup_expired()
            except Exception as e:
                print(f"⚠️ Cleanup error: {e}")
    
    def get_stats(self) -> dict:
        """Get comprehensive cache statistics"""
        total = self.stats["total_requests"]
        
        return {
            "total_requests": total,
            "l1_hits": self.stats["l1_hits"],
            "l2_hits": self.stats["l2_hits"],
            "l3_hits": self.stats["l3_hits"],
            "l1_hit_rate": f"{(self.stats['l1_hits'] / total * 100) if total > 0 else 0:.2f}%",
            "l2_hit_rate": f"{(self.stats['l2_hits'] / total * 100) if total > 0 else 0:.2f}%",
            "l3_hit_rate": f"{(self.stats['l3_hits'] / total * 100) if total > 0 else 0:.2f}%",
            "avg_latency_ms": f"{self.stats['avg_latency_ms']:.2f}",
            "l1_stats": self.l1_cache.get_stats()
        }


# Global instance
_multi_tier_cache: Optional[MultiTierCache] = None


async def init_multi_tier_cache(redis_client=None, db=None) -> MultiTierCache:
    """Initialize multi-tier cache"""
    global _multi_tier_cache
    _multi_tier_cache = MultiTierCache(redis_client, db)
    print("✅ Multi-tier cache initialized")
    return _multi_tier_cache


def get_multi_tier_cache() -> Optional[MultiTierCache]:
    """Get the global multi-tier cache instance"""
    return _multi_tier_cache


# Convenience decorators
def cached(ttl: int = 300, key_prefix: str = ""):
    """
    Decorator for caching function results
    
    Usage:
        @cached(ttl=600, key_prefix="menu")
        async def get_menu(org_id: str):
            return await db.menu_items.find({"org_id": org_id}).to_list(None)
    """
    def decorator(func):
        async def wrapper(*args, **kwargs):
            cache = get_multi_tier_cache()
            if not cache:
                return await func(*args, **kwargs)
            
            # Generate cache key from function name and args
            key_parts = [key_prefix or func.__name__]
            key_parts.extend(str(arg) for arg in args)
            key_parts.extend(f"{k}={v}" for k, v in sorted(kwargs.items()))
            cache_key = ":".join(key_parts)
            
            # Try to get from cache
            result = await cache.get(
                cache_key,
                fetch_func=lambda: func(*args, **kwargs),
                ttl=ttl
            )
            
            return result
        
        return wrapper
    return decorator
