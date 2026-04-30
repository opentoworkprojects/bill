"""
Distributed Cache Utility

Redis-backed cache with in-memory fallback.
Implements cache stampede prevention via probabilistic early expiration.
"""
import asyncio
import json
import logging
import math
import os
import random
import time
from typing import Any, Callable, Optional

logger = logging.getLogger(__name__)

# In-memory fallback cache
_memory_cache: dict = {}
_memory_cache_expiry: dict = {}
MAX_MEMORY_CACHE_SIZE = 500


class DistributedCache:
    """
    Redis-backed cache with in-memory fallback.
    Falls back to in-memory if Redis is unavailable.
    """

    def __init__(self, redis_url: str = ""):
        self._redis = None
        self._redis_url = redis_url
        self._use_redis = bool(redis_url)
        self._connected = False

    async def connect(self):
        """Initialize Redis connection if URL is configured."""
        if not self._use_redis:
            logger.info("No REDIS_URL configured - using in-memory cache fallback")
            return
        try:
            import redis.asyncio as aioredis
            self._redis = await aioredis.from_url(
                self._redis_url,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
            )
            await self._redis.ping()
            self._connected = True
            logger.info("Redis cache connected successfully")
        except Exception as e:
            logger.warning(f"Redis connection failed, using in-memory fallback: {e}")
            self._use_redis = False

    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache. Returns None if not found or expired."""
        if self._connected and self._redis:
            try:
                value = await self._redis.get(key)
                return json.loads(value) if value else None
            except Exception as e:
                logger.warning(f"Redis get failed for {key}: {e}")
        # Fallback to memory
        return self._memory_get(key)

    async def set(self, key: str, value: Any, ttl: int = 300) -> bool:
        """Set value in cache with TTL (seconds)."""
        if self._connected and self._redis:
            try:
                await self._redis.setex(key, ttl, json.dumps(value, default=str))
                return True
            except Exception as e:
                logger.warning(f"Redis set failed for {key}: {e}")
        # Fallback to memory
        return self._memory_set(key, value, ttl)

    async def delete(self, key: str) -> bool:
        """Delete a key from cache."""
        if self._connected and self._redis:
            try:
                await self._redis.delete(key)
                return True
            except Exception as e:
                logger.warning(f"Redis delete failed for {key}: {e}")
        # Fallback to memory
        _memory_cache.pop(key, None)
        _memory_cache_expiry.pop(key, None)
        return True

    async def delete_pattern(self, pattern: str) -> int:
        """Delete all keys matching a pattern (e.g., 'org:123:*')."""
        if self._connected and self._redis:
            try:
                keys = await self._redis.keys(pattern)
                if keys:
                    await self._redis.delete(*keys)
                return len(keys)
            except Exception as e:
                logger.warning(f"Redis delete_pattern failed for {pattern}: {e}")
        # Memory fallback: iterate and delete matching keys
        to_delete = [k for k in _memory_cache if self._match_pattern(k, pattern)]
        for k in to_delete:
            _memory_cache.pop(k, None)
            _memory_cache_expiry.pop(k, None)
        return len(to_delete)

    async def get_or_set(
        self,
        key: str,
        factory: Callable,
        ttl: int = 300,
        beta: float = 1.0,
    ) -> Any:
        """
        Get from cache or compute and store.
        Uses probabilistic early expiration (XFetch) to prevent cache stampede.
        beta > 1 = more aggressive early expiration (reduces stampede risk).
        """
        cached = await self.get(key)
        if cached is not None:
            # XFetch: probabilistically recompute before expiry to prevent stampede
            expiry = _memory_cache_expiry.get(key, time.monotonic() + ttl)
            remaining = expiry - time.monotonic()
            if remaining > 0:
                # Probability of early recompute increases as expiry approaches
                if -beta * math.log(random.random()) < (ttl - remaining):
                    return cached

        # Compute fresh value
        value = await factory() if asyncio.iscoroutinefunction(factory) else factory()
        await self.set(key, value, ttl)
        return value

    async def disconnect(self):
        """Close Redis connection."""
        if self._redis:
            await self._redis.close()

    def _memory_get(self, key: str) -> Optional[Any]:
        expiry = _memory_cache_expiry.get(key)
        if expiry and time.monotonic() > expiry:
            _memory_cache.pop(key, None)
            _memory_cache_expiry.pop(key, None)
            return None
        return _memory_cache.get(key)

    def _memory_set(self, key: str, value: Any, ttl: int) -> bool:
        # Evict oldest entries if at capacity
        if len(_memory_cache) >= MAX_MEMORY_CACHE_SIZE:
            oldest = min(_memory_cache_expiry, key=_memory_cache_expiry.get)
            _memory_cache.pop(oldest, None)
            _memory_cache_expiry.pop(oldest, None)
        _memory_cache[key] = value
        _memory_cache_expiry[key] = time.monotonic() + ttl
        return True

    @staticmethod
    def _match_pattern(key: str, pattern: str) -> bool:
        """Simple glob-style pattern matching for memory cache."""
        if pattern.endswith("*"):
            return key.startswith(pattern[:-1])
        return key == pattern


# Module-level singleton
_cache: Optional[DistributedCache] = None


async def init_cache(redis_url: str = "") -> DistributedCache:
    """Initialize the global cache. Call during app startup."""
    global _cache
    _cache = DistributedCache(redis_url=redis_url)
    await _cache.connect()
    return _cache


def get_cache() -> Optional[DistributedCache]:
    """Get the global cache instance."""
    return _cache
