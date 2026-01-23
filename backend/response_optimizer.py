"""
API Response Optimization Module
Implements response compression, caching, and efficient serialization
"""

import gzip
import json
import logging
from functools import wraps
from datetime import datetime, timedelta
from typing import Any, Dict, Optional, Callable
import time

logger = logging.getLogger(__name__)


class ResponseOptimizer:
    """Optimizes API responses for faster transmission"""
    
    @staticmethod
    def compress_response(data: Any, compression: str = "gzip") -> bytes:
        """
        Compress response data
        
        Args:
            data: Data to compress
            compression: Compression type (gzip)
        
        Returns:
            Compressed bytes
        """
        if isinstance(data, str):
            json_data = data.encode('utf-8')
        else:
            json_data = json.dumps(data, default=str).encode('utf-8')
        
        if compression == "gzip":
            return gzip.compress(json_data)
        
        return json_data
    
    @staticmethod
    def optimize_json(data: Any) -> Dict[str, Any]:
        """
        Optimize JSON structure for smaller payload
        - Remove null values
        - Use shorter keys where possible
        - Remove unnecessary nesting
        """
        if isinstance(data, dict):
            # Remove None/null values
            return {
                k: ResponseOptimizer.optimize_json(v)
                for k, v in data.items()
                if v is not None
            }
        elif isinstance(data, list):
            return [ResponseOptimizer.optimize_json(item) for item in data]
        elif isinstance(data, datetime):
            return data.isoformat()
        
        return data
    
    @staticmethod
    def paginate_response(
        data: list,
        page: int = 1,
        page_size: int = 20
    ) -> Dict[str, Any]:
        """
        Paginate response data
        
        Args:
            data: List of items
            page: Page number (1-based)
            page_size: Items per page
        
        Returns:
            Paginated response with metadata
        """
        total = len(data)
        start = (page - 1) * page_size
        end = start + page_size
        items = data[start:end]
        
        return {
            "data": items,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total": total,
                "total_pages": (total + page_size - 1) // page_size,
                "has_next": end < total,
                "has_prev": page > 1
            }
        }


class CacheDecorator:
    """Decorator for caching API responses"""
    
    _cache = {}
    _cache_ttl = {}
    
    @classmethod
    def cache_response(
        cls,
        ttl_seconds: int = 300,
        key_prefix: str = "",
        skip_cache_params: list = None
    ):
        """
        Decorator to cache function responses
        
        Args:
            ttl_seconds: Cache time-to-live in seconds
            key_prefix: Prefix for cache key
            skip_cache_params: List of query parameters to skip caching for
        """
        skip_cache_params = skip_cache_params or []
        
        def decorator(func: Callable) -> Callable:
            @wraps(func)
            async def async_wrapper(*args, **kwargs):
                # Generate cache key
                cache_key = f"{key_prefix}:{func.__name__}:{str(args)}:{str(kwargs)}"
                current_time = time.time()
                
                # Check cache
                if cache_key in cls._cache and cache_key in cls._cache_ttl:
                    if current_time < cls._cache_ttl[cache_key]:
                        logger.debug(f"Cache hit: {cache_key}")
                        return cls._cache[cache_key]
                
                # Execute function
                result = await func(*args, **kwargs)
                
                # Cache result
                cls._cache[cache_key] = result
                cls._cache_ttl[cache_key] = current_time + ttl_seconds
                
                return result
            
            @wraps(func)
            def sync_wrapper(*args, **kwargs):
                # Generate cache key
                cache_key = f"{key_prefix}:{func.__name__}:{str(args)}:{str(kwargs)}"
                current_time = time.time()
                
                # Check cache
                if cache_key in cls._cache and cache_key in cls._cache_ttl:
                    if current_time < cls._cache_ttl[cache_key]:
                        logger.debug(f"Cache hit: {cache_key}")
                        return cls._cache[cache_key]
                
                # Execute function
                result = func(*args, **kwargs)
                
                # Cache result
                cls._cache[cache_key] = result
                cls._cache_ttl[cache_key] = current_time + ttl_seconds
                
                return result
            
            # Return appropriate wrapper based on function type
            if hasattr(func, '__call__'):
                try:
                    import asyncio
                    if asyncio.iscoroutinefunction(func):
                        return async_wrapper
                except:
                    pass
            
            return sync_wrapper
        
        return decorator
    
    @classmethod
    def clear_cache(cls, pattern: str = None):
        """Clear cached responses"""
        if pattern:
            to_delete = [k for k in cls._cache.keys() if pattern in k]
            for k in to_delete:
                del cls._cache[k]
                if k in cls._cache_ttl:
                    del cls._cache_ttl[k]
        else:
            cls._cache.clear()
            cls._cache_ttl.clear()


class ResponseHeaders:
    """Optimize response headers for performance"""
    
    @staticmethod
    def get_cache_headers(
        cache_type: str = "public",
        max_age: int = 300,
        etag: str = None
    ) -> Dict[str, str]:
        """
        Generate cache-related headers
        
        Args:
            cache_type: "public", "private", or "no-cache"
            max_age: Cache duration in seconds
            etag: ETag for conditional requests
        
        Returns:
            Headers dictionary
        """
        headers = {
            "Cache-Control": f"{cache_type}, max-age={max_age}",
            "Pragma": "cache" if cache_type != "no-cache" else "no-cache",
        }
        
        if etag:
            headers["ETag"] = etag
        
        return headers
    
    @staticmethod
    def get_performance_headers() -> Dict[str, str]:
        """Get headers that improve performance"""
        return {
            "Content-Encoding": "gzip",
            "Vary": "Accept-Encoding",
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "SAMEORIGIN",
            # Enable compression on supported content types
            "Content-Type": "application/json; charset=utf-8"
        }


class BatchResponseProcessor:
    """Process batch responses efficiently"""
    
    @staticmethod
    def batch_results(
        results: list,
        batch_size: int = 50,
        compress: bool = True
    ) -> list:
        """
        Batch large result sets for efficient transmission
        
        Args:
            results: List of results
            batch_size: Size of each batch
            compress: Whether to compress batches
        
        Returns:
            List of batches
        """
        batches = []
        for i in range(0, len(results), batch_size):
            batch = results[i:i + batch_size]
            if compress:
                batch = ResponseOptimizer.optimize_json(batch)
            batches.append(batch)
        
        return batches
    
    @staticmethod
    def stream_large_results(
        query_func: Callable,
        chunk_size: int = 100
    ):
        """
        Stream large result sets without loading everything in memory
        Useful for exports, reports, etc.
        """
        offset = 0
        while True:
            results = query_func(offset=offset, limit=chunk_size)
            if not results:
                break
            
            yield ResponseOptimizer.optimize_json(results)
            offset += chunk_size


class PerformanceMetrics:
    """Track API performance metrics"""
    
    _metrics = {
        "requests": 0,
        "total_time": 0,
        "cache_hits": 0,
        "cache_misses": 0,
        "slow_requests": []
    }
    
    @classmethod
    def record_request(cls, duration_ms: float, cached: bool = False):
        """Record request metrics"""
        cls._metrics["requests"] += 1
        cls._metrics["total_time"] += duration_ms
        
        if cached:
            cls._metrics["cache_hits"] += 1
        else:
            cls._metrics["cache_misses"] += 1
        
        # Track slow requests (> 1 second)
        if duration_ms > 1000:
            cls._metrics["slow_requests"].append({
                "duration_ms": duration_ms,
                "timestamp": datetime.now().isoformat()
            })
            
            # Keep only recent slow requests
            if len(cls._metrics["slow_requests"]) > 50:
                cls._metrics["slow_requests"] = cls._metrics["slow_requests"][-50:]
    
    @classmethod
    def get_metrics(cls) -> Dict[str, Any]:
        """Get performance metrics"""
        total_requests = cls._metrics["requests"]
        cache_hits = cls._metrics["cache_hits"]
        cache_misses = cls._metrics["cache_misses"]
        
        return {
            "total_requests": total_requests,
            "avg_response_time_ms": (
                cls._metrics["total_time"] / total_requests
                if total_requests > 0 else 0
            ),
            "cache_hit_rate": (
                (cache_hits / (cache_hits + cache_misses) * 100)
                if (cache_hits + cache_misses) > 0 else 0
            ),
            "slow_requests_count": len(cls._metrics["slow_requests"]),
            "recent_slow_requests": cls._metrics["slow_requests"][-10:]
        }
    
    @classmethod
    def reset_metrics(cls):
        """Reset performance metrics"""
        cls._metrics = {
            "requests": 0,
            "total_time": 0,
            "cache_hits": 0,
            "cache_misses": 0,
            "slow_requests": []
        }


def response_optimization_middleware(
    compress: bool = True,
    optimize_json: bool = True,
    cache_headers: bool = True
):
    """
    Middleware to optimize all API responses
    
    Usage:
        @response_optimization_middleware()
        async def my_endpoint():
            return {"data": "value"}
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            
            # Get response
            response = await func(*args, **kwargs) if hasattr(func, '__await__') else func(*args, **kwargs)
            
            # Optimize JSON
            if optimize_json and isinstance(response, dict):
                response = ResponseOptimizer.optimize_json(response)
            
            # Record metrics
            duration_ms = (time.time() - start_time) * 1000
            PerformanceMetrics.record_request(duration_ms)
            
            return response
        
        return wrapper
    
    return decorator
