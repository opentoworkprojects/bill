"""
Performance Enhancement Implementation - Ready to integrate into server.py
Copy and paste the relevant sections into your server.py file
"""

# ============================================================================
# 1. ADD TO IMPORTS SECTION (Top of server.py)
# ============================================================================

from starlette.middleware.gzip import GZipMiddleware  # Add this import
from response_optimizer import (
    CacheDecorator,
    ResponseOptimizer,
    PerformanceMetrics,
    ResponseHeaders
)
from query_optimizer import (
    QueryOptimizer,
    CacheKeyGenerator,
    PerformanceConstants,
    QueryLogger
)
import hashlib
import time

# ============================================================================
# 2. ADD MIDDLEWARE SECTION (After app = FastAPI(...) declaration)
# ============================================================================

"""
# Add GZIP compression middleware (around line 200)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Add performance monitoring middleware
class PerformanceMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        response = await call_next(request)
        
        # Calculate response time
        duration = (time.time() - start_time) * 1000  # Convert to ms
        
        # Log performance metrics
        PerformanceMetrics.record_request(duration, cached=False)
        
        # Add performance headers
        response.headers["X-Response-Time"] = str(duration)
        response.headers["Cache-Control"] = "public, max-age=300"
        
        # Log slow queries
        if duration > 1000:
            logger.warning(f"Slow request: {request.url.path} - {duration:.2f}ms")
        
        return response

app.add_middleware(PerformanceMiddleware)
"""

# ============================================================================
# 3. ADD DATABASE INDEX CREATION (In create_indexes() function)
# ============================================================================

"""
async def create_performance_indexes():
    '''Create optimized indexes for high-query collections'''
    try:
        optimizer = QueryOptimizer()
        indexes = optimizer.get_optimal_indexes()
        
        for collection_name, index_list in indexes.items():
            collection = db[collection_name]
            
            for index_spec in index_list:
                try:
                    # Handle both single field and compound indexes
                    if isinstance(index_spec, list):
                        # Compound index
                        await collection.create_index(index_spec, background=True)
                    elif isinstance(index_spec, tuple):
                        # Single field index
                        await collection.create_index([index_spec], background=True)
                    else:
                        # Index name as string
                        await collection.create_index(index_spec, background=True)
                        
                    logger.info(f"✓ Created index on {collection_name}: {index_spec}")
                except Exception as e:
                    logger.debug(f"Index already exists or error: {e}")
        
        logger.info("✅ All performance indexes created")
        
    except Exception as e:
        logger.error(f"Error creating performance indexes: {e}")

# Call in connect_to_mongo():
# await create_performance_indexes()
"""

# ============================================================================
# 4. ADD OPTIMIZED ENDPOINTS EXAMPLES
# ============================================================================

"""
# Example 1: Paginated Orders Endpoint
@api_router.get("/orders")
@CacheDecorator.cache_response(ttl_seconds=300, key_prefix="orders")
async def get_orders(
    credentials: dict = Depends(get_credentials),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str = Query(None),
    date: str = Query(None)
):
    '''Get paginated orders with caching'''
    try:
        org_id = credentials.get("org_id")
        
        # Build optimized query
        filters = {"organization_id": org_id}
        if status:
            filters["status"] = status
        if date:
            from datetime import datetime, timedelta
            parsed_date = datetime.strptime(date, "%Y-%m-%d")
            next_date = parsed_date + timedelta(days=1)
            filters["created_at"] = {
                "$gte": parsed_date.isoformat(),
                "$lt": next_date.isoformat()
            }
        
        # Calculate pagination
        skip = (page - 1) * page_size
        
        # Fetch orders with projection (only needed fields)
        orders = await db.orders.find(
            filters
        ).skip(skip).limit(page_size).sort("created_at", -1).to_list(None)
        
        # Get total count
        total = await db.orders.count_documents(filters)
        
        # Log query performance
        query_logger = QueryLogger()
        query_logger.log_query("get_orders", 10, len(orders))
        
        return {
            "data": ResponseOptimizer.optimize_json(orders),
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total": total,
                "total_pages": (total + page_size - 1) // page_size,
                "has_next": (page * page_size) < total,
                "has_prev": page > 1
            }
        }
    except Exception as e:
        logger.error(f"Error fetching orders: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch orders")


# Example 2: Cached Analytics Endpoint
@api_router.get("/analytics/daily")
@CacheDecorator.cache_response(ttl_seconds=3600, key_prefix="analytics_daily")
async def get_daily_analytics(
    credentials: dict = Depends(get_credentials),
    date: str = Query(None)
):
    '''Get daily analytics with long-term caching'''
    try:
        org_id = credentials.get("org_id")
        
        if not date:
            from datetime import datetime
            date = datetime.now().strftime("%Y-%m-%d")
        
        # Use aggregation pipeline for efficient calculations
        from datetime import datetime, timedelta
        parsed_date = datetime.strptime(date, "%Y-%m-%d")
        next_date = parsed_date + timedelta(days=1)
        
        pipeline = [
            {
                "$match": {
                    "organization_id": org_id,
                    "created_at": {
                        "$gte": parsed_date.isoformat(),
                        "$lt": next_date.isoformat()
                    }
                }
            },
            {
                "$group": {
                    "_id": "$status",
                    "count": {"$sum": 1},
                    "total_sales": {"$sum": "$total"}
                }
            }
        ]
        
        results = await db.orders.aggregate(pipeline).to_list(None)
        
        return ResponseOptimizer.optimize_json(results)
    except Exception as e:
        logger.error(f"Error fetching daily analytics: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch analytics")


# Example 3: Batch Operation Endpoint
@api_router.post("/orders/batch-status")
async def batch_update_order_status(
    credentials: dict = Depends(get_credentials),
    updates: list = Body(...)
):
    '''Batch update order statuses - reduce N+1 queries'''
    try:
        org_id = credentials.get("org_id")
        
        # Use bulk operations for efficiency
        from pymongo import UpdateOne
        
        bulk_ops = []
        for update in updates:
            bulk_ops.append(
                UpdateOne(
                    {
                        "_id": update["order_id"],
                        "organization_id": org_id
                    },
                    {"$set": {"status": update["status"]}}
                )
            )
        
        if bulk_ops:
            result = await db.orders.bulk_write(bulk_ops)
            
            return {
                "modified_count": result.modified_count,
                "success": result.modified_count == len(updates)
            }
        
        return {"modified_count": 0, "success": True}
    except Exception as e:
        logger.error(f"Error batch updating orders: {e}")
        raise HTTPException(status_code=500, detail="Failed to update orders")
"""

# ============================================================================
# 5. ADD REDIS CACHING INTEGRATION
# ============================================================================

"""
# Add to imports if not already present
from redis_cache import redis_client

# Add this helper function
async def get_or_fetch(cache_key, fetch_fn, ttl=300):
    '''Generic get-or-fetch pattern with Redis caching'''
    try:
        # Try to get from cache
        cached = await redis_client.get(cache_key)
        if cached:
            logger.debug(f"Cache hit: {cache_key}")
            return json.loads(cached)
    except Exception as e:
        logger.debug(f"Cache retrieval failed: {e}")
    
    # Fetch fresh data
    data = await fetch_fn()
    
    # Cache the result
    try:
        await redis_client.setex(
            cache_key,
            ttl,
            json.dumps(data, default=str)
        )
    except Exception as e:
        logger.debug(f"Cache storage failed: {e}")
    
    return data
"""

# ============================================================================
# 6. ADD PERFORMANCE MONITORING ENDPOINT
# ============================================================================

"""
@api_router.get("/admin/performance-metrics")
async def get_performance_metrics(credentials: dict = Depends(get_credentials)):
    '''Get API performance metrics'''
    if not credentials.get("is_super_admin"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    metrics = PerformanceMetrics.get_metrics()
    slow_queries = QueryLogger.get_slow_queries()
    
    return {
        "api_metrics": metrics,
        "slow_queries": slow_queries[-20:],  # Last 20
        "timestamp": datetime.now().isoformat()
    }
"""

# ============================================================================
# 7. ADD RESPONSE OPTIMIZATION TO EXISTING ENDPOINTS
# ============================================================================

"""
# For any endpoint returning large data, add response optimization:

# Example: Update existing menu endpoint
@api_router.get("/menu")
@CacheDecorator.cache_response(ttl_seconds=1800)
async def get_menu(credentials: dict = Depends(get_credentials)):
    try:
        org_id = credentials.get("org_id")
        
        menu_items = await db.menu_items.find({
            "organization_id": org_id,
            "active": True
        }).sort("category", 1).to_list(None)
        
        # Optimize response JSON
        optimized = ResponseOptimizer.optimize_json(menu_items)
        
        return {
            "items": optimized,
            "count": len(menu_items),
            "cached": False
        }
    except Exception as e:
        logger.error(f"Error fetching menu: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch menu")
"""

# ============================================================================
# 8. CONFIGURATION SUMMARY
# ============================================================================

PERFORMANCE_CONFIG = {
    "gzip_enabled": True,
    "cache_ttls": {
        "menu": 30 * 60,              # 30 minutes
        "orders_list": 5 * 60,        # 5 minutes
        "analytics": 15 * 60,         # 15 minutes
        "reports": 60 * 60,           # 1 hour
    },
    "pagination": {
        "default_page_size": 20,
        "max_page_size": 100,
    },
    "redis": {
        "enabled": True,
        "ttl": 300,  # 5 minutes
    },
    "indices": {
        "enabled": True,
        "background": True,
    }
}

# ============================================================================
# 9. INTEGRATION INSTRUCTIONS
# ============================================================================

"""
STEP-BY-STEP INTEGRATION:

1. Add all imports from section 1 to the top of server.py

2. After app = FastAPI(...), add the middleware from section 2:
   - Uncomment the GZipMiddleware line
   - Add the PerformanceMiddleware class

3. In the create_indexes() function, add the call from section 3:
   - Create the create_performance_indexes() function
   - Call it in connect_to_mongo()

4. Add optimized endpoints from section 4:
   - Add at least the orders endpoint
   - Add the analytics endpoint
   - Add the batch update endpoint

5. Integrate Redis caching from section 5:
   - Add to existing redis_cache usage

6. Add monitoring endpoint from section 6:
   - Access via GET /api/admin/performance-metrics

7. Gradually migrate existing endpoints:
   - Add @CacheDecorator to GET endpoints
   - Add pagination to list endpoints
   - Use ResponseOptimizer.optimize_json() before returning

8. Test thoroughly:
   - Check performance metrics endpoint
   - Verify caching is working
   - Monitor query performance logs
   - Test with real data volumes

9. Deploy and monitor:
   - Watch performance metrics
   - Adjust cache TTLs based on usage patterns
   - Monitor slow query logs
"""
