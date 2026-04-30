"""
Database Query Optimization Module
Provides utilities for optimizing database queries with pagination, filtering, and indexing
"""

from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class QueryOptimizer:
    """Optimizes MongoDB queries with pagination, caching, and proper indexing"""
    
    @staticmethod
    def build_pagination_query(
        collection_name: str,
        filters: Dict[str, Any] = None,
        sort_by: List[Tuple[str, int]] = None,
        page: int = 1,
        page_size: int = 20,
        fields: List[str] = None
    ) -> Dict[str, Any]:
        """
        Build optimized pagination query
        
        Args:
            collection_name: MongoDB collection name
            filters: Query filters
            sort_by: List of (field, direction) tuples
            page: Page number (1-based)
            page_size: Items per page
            fields: Fields to project (None = all fields)
        
        Returns:
            Dict with optimized query parameters
        """
        skip = (page - 1) * page_size
        limit = page_size
        
        query = {
            "filters": filters or {},
            "skip": skip,
            "limit": limit,
        }
        
        if sort_by:
            query["sort"] = sort_by
        
        if fields:
            query["projection"] = {field: 1 for field in fields}
        
        return query
    
    @staticmethod
    def build_aggregation_pipeline(
        collection_name: str,
        filters: Dict[str, Any] = None,
        group_by: str = None,
        aggregations: Dict[str, str] = None,
        sort_by: List[Tuple[str, int]] = None,
        limit: int = None
    ) -> List[Dict[str, Any]]:
        """
        Build optimized aggregation pipeline for complex queries
        
        Args:
            collection_name: MongoDB collection name
            filters: Initial match filters
            group_by: Field to group by
            aggregations: Aggregation operations (e.g., {"total": "$sum:amount"})
            sort_by: Sort specification
            limit: Result limit
        
        Returns:
            Aggregation pipeline
        """
        pipeline = []
        
        # Match stage - filter early
        if filters:
            pipeline.append({"$match": filters})
        
        # Group stage
        if group_by:
            group_spec = {"_id": f"${group_by}"}
            if aggregations:
                for key, operation in aggregations.items():
                    if operation.startswith("$sum:"):
                        field = operation.replace("$sum:", "")
                        group_spec[key] = {"$sum": f"${field}"}
                    elif operation.startswith("$avg:"):
                        field = operation.replace("$avg:", "")
                        group_spec[key] = {"$avg": f"${field}"}
                    elif operation.startswith("$count"):
                        group_spec[key] = {"$sum": 1}
            pipeline.append({"$group": group_spec})
        
        # Sort stage
        if sort_by:
            sort_spec = {}
            for field, direction in sort_by:
                sort_spec[field] = direction
            pipeline.append({"$sort": sort_spec})
        
        # Limit stage - reduce data transfer
        if limit:
            pipeline.append({"$limit": limit})
        
        return pipeline
    
    @staticmethod
    def get_optimal_indexes() -> Dict[str, List[Tuple[str, int]]]:
        """
        Return recommended indexes for optimal query performance
        Prevents N+1 queries and slow scans
        """
        return {
            "orders": [
                [("organization_id", 1), ("created_at", -1)],
                [("table_number", 1), ("status", 1)],
                [("user_id", 1), ("created_at", -1)],
                [("status", 1), ("created_at", -1)],
                ("invoice_number", 1),
            ],
            "users": [
                ("email", 1),
                [("organization_id", 1), ("created_at", -1)],
                ("phone", 1),
            ],
            "tables": [
                [("organization_id", 1), ("table_number", 1)],
                [("organization_id", 1), ("status", 1)],
            ],
            "menu_items": [
                [("organization_id", 1), ("category", 1)],
                [("organization_id", 1), ("active", 1)],
                ("name", 1),
            ],
            "payments": [
                [("organization_id", 1), ("created_at", -1)],
                [("order_id", 1), ("status", 1)],
                ("status", 1),
            ],
        }


class CacheKeyGenerator:
    """Generate optimized cache keys for different query types"""
    
    @staticmethod
    def order_cache_key(org_id: str, date: str = None, status: str = None) -> str:
        """Generate cache key for order queries"""
        parts = [f"orders:{org_id}"]
        if date:
            parts.append(f"date:{date}")
        if status:
            parts.append(f"status:{status}")
        return ":".join(parts)
    
    @staticmethod
    def menu_cache_key(org_id: str, category: str = None) -> str:
        """Generate cache key for menu queries"""
        parts = [f"menu:{org_id}"]
        if category:
            parts.append(f"cat:{category}")
        return ":".join(parts)
    
    @staticmethod
    def user_cache_key(user_id: str) -> str:
        """Generate cache key for user data"""
        return f"user:{user_id}"
    
    @staticmethod
    def analytics_cache_key(org_id: str, metric: str, period: str = "daily") -> str:
        """Generate cache key for analytics"""
        return f"analytics:{org_id}:{metric}:{period}:{datetime.now().strftime('%Y-%m-%d')}"


class PerformanceConstants:
    """Performance configuration constants"""
    
    # Cache TTL values (in seconds)
    CACHE_TTL = {
        "menu": 30 * 60,           # 30 minutes
        "orders_list": 5 * 60,     # 5 minutes
        "analytics": 15 * 60,      # 15 minutes
        "user": 10 * 60,           # 10 minutes
        "table_status": 2 * 60,    # 2 minutes
        "reports": 60 * 60,        # 1 hour
    }
    
    # Pagination defaults
    DEFAULT_PAGE_SIZE = 20
    MAX_PAGE_SIZE = 100
    
    # Query timeouts (milliseconds)
    QUERY_TIMEOUT = 5000
    SLOW_QUERY_THRESHOLD = 1000  # Log queries slower than 1 second
    
    # Maximum results for various endpoints
    MAX_RESULTS = {
        "orders": 1000,
        "menu_items": 500,
        "customers": 2000,
        "analytics_points": 365,  # One year of daily data
    }


class QueryLogger:
    """Log slow queries for optimization"""
    
    slow_queries = []
    
    @classmethod
    def log_query(cls, query_name: str, duration_ms: float, query_size: int):
        """Log query performance"""
        if duration_ms > PerformanceConstants.SLOW_QUERY_THRESHOLD:
            logger.warning(
                f"Slow query: {query_name} - {duration_ms:.2f}ms - {query_size} results"
            )
            cls.slow_queries.append({
                "query": query_name,
                "duration_ms": duration_ms,
                "size": query_size,
                "timestamp": datetime.now().isoformat()
            })
            
            # Keep only recent queries
            if len(cls.slow_queries) > 100:
                cls.slow_queries = cls.slow_queries[-100:]
    
    @classmethod
    def get_slow_queries(cls) -> List[Dict]:
        """Get list of slow queries"""
        return cls.slow_queries


# Query template builders for common patterns
class QueryTemplates:
    """Pre-built query templates for common patterns"""
    
    @staticmethod
    def daily_orders(org_id: str, date: str) -> Dict[str, Any]:
        """Get orders for a specific day"""
        from datetime import datetime as dt
        parsed_date = dt.strptime(date, "%Y-%m-%d")
        next_date = parsed_date + timedelta(days=1)
        
        return {
            "filters": {
                "organization_id": org_id,
                "created_at": {
                    "$gte": parsed_date.isoformat(),
                    "$lt": next_date.isoformat()
                }
            },
            "sort": [("created_at", -1)],
            "fields": ["_id", "table_number", "items", "total", "status", "created_at"]
        }
    
    @staticmethod
    def active_tables(org_id: str) -> Dict[str, Any]:
        """Get active tables with minimal data"""
        return {
            "filters": {
                "organization_id": org_id,
                "status": "occupied"
            },
            "fields": ["_id", "table_number", "current_order_id", "status"],
            "sort": [("table_number", 1)]
        }
    
    @staticmethod
    def menu_by_category(org_id: str, category: str) -> Dict[str, Any]:
        """Get menu items by category"""
        return {
            "filters": {
                "organization_id": org_id,
                "category": category,
                "active": True
            },
            "fields": ["_id", "name", "price", "category", "description", "image"],
            "sort": [("name", 1)]
        }
