"""
Load Balancing Strategy Configuration

Documents and implements query routing for high-traffic scenarios:
- Writes: Always go to MongoDB primary
- Reads: Route to SECONDARY_PREFERRED when replica set is available
- Gunicorn distributes HTTP requests across worker processes automatically
"""
import os
import time
from pymongo import ReadPreference
from typing import Optional


# Read preference for read-heavy operations (analytics, reports, menu listings)
READ_PREFERENCE_SECONDARY = ReadPreference.SECONDARY_PREFERRED

# Read preference for operations requiring fresh data (order status, payments)
READ_PREFERENCE_PRIMARY = ReadPreference.PRIMARY


def get_read_preference(operation: str) -> ReadPreference:
    """
    Return appropriate read preference based on operation type.
    
    - 'fresh': PRIMARY (order status, payment verification, inventory)
    - 'analytics': SECONDARY_PREFERRED (reports, dashboards, exports)
    - default: PRIMARY (safe default)
    """
    if operation == "analytics":
        return READ_PREFERENCE_SECONDARY
    return READ_PREFERENCE_PRIMARY


class LoadBalancerConfig:
    """
    Documents the load balancing architecture for this deployment.
    
    Layer 1 - Application: Gunicorn spawns (2*CPU)+1 UvicornWorker processes.
              Each worker handles requests independently with shared MongoDB pool.
    
    Layer 2 - Database: MongoDB connection pool (maxPoolSize=50) distributes
              DB operations. Reads can be routed to secondaries if replica set available.
    
    Layer 3 - External (optional): Nginx reverse proxy for SSL termination,
              rate limiting, and upstream health checks. See nginx.conf.template.
    """
    
    workers: int = int(os.getenv("WEB_CONCURRENCY", "3"))
    max_connections_per_worker: int = 1000
    total_capacity: int = workers * max_connections_per_worker
    
    @staticmethod
    def get_worker_info() -> dict:
        """Return current worker process information."""
        import os
        return {
            "worker_pid": os.getpid(),
            "worker_count_configured": int(os.getenv("WEB_CONCURRENCY", "3")),
        }
