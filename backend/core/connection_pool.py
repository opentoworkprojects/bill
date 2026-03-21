"""
MongoDB Connection Pool Manager
Provides health checks, pool warming, and metrics collection.
"""
import asyncio
import logging
import time
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class ConnectionPoolManager:
    """Manages MongoDB connection pool health, warming, and metrics."""

    def __init__(self, client, db):
        self.client = client
        self.db = db
        self._start_time = time.monotonic()
        self._metrics: Dict[str, Any] = {
            "pool_checks": 0,
            "pool_errors": 0,
            "last_check_time": None,
            "last_check_ok": None,
        }

    async def warm_pool(self, connections: int = 5) -> bool:
        """
        Warm the connection pool by issuing lightweight ping commands.
        Ensures minPoolSize connections are ready before serving traffic.
        """
        logger.info(f"Warming connection pool with {connections} connections...")
        tasks = [self._ping() for _ in range(connections)]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        errors = [r for r in results if isinstance(r, Exception)]
        if errors:
            logger.warning(f"Pool warming: {len(errors)}/{connections} pings failed: {errors[0]}")
        else:
            logger.info(f"Connection pool warmed successfully ({connections} connections)")
        return len(errors) == 0

    async def _ping(self) -> bool:
        """Issue a lightweight ping to establish a connection."""
        await self.db.command("ping")
        return True

    async def health_check(self) -> Dict[str, Any]:
        """
        Check connection pool health.
        Returns dict with status, latency_ms, and pool metrics.
        """
        self._metrics["pool_checks"] += 1
        start = time.monotonic()
        try:
            await self.db.command("ping")
            latency_ms = (time.monotonic() - start) * 1000
            status = "healthy"
            self._metrics["last_check_ok"] = True
        except Exception as e:
            latency_ms = (time.monotonic() - start) * 1000
            status = "unhealthy"
            self._metrics["pool_errors"] += 1
            self._metrics["last_check_ok"] = False
            logger.error(f"Connection pool health check failed: {e}")

        self._metrics["last_check_time"] = time.monotonic()

        # Get pool stats from Motor client
        pool_stats = self._get_pool_stats()

        return {
            "status": status,
            "latency_ms": round(latency_ms, 2),
            "uptime_seconds": round(time.monotonic() - self._start_time, 1),
            "checks_total": self._metrics["pool_checks"],
            "errors_total": self._metrics["pool_errors"],
            **pool_stats,
        }

    def _get_pool_stats(self) -> Dict[str, Any]:
        """Extract pool statistics from the Motor client."""
        try:
            # Motor wraps PyMongo - access topology for pool info
            topology = self.client._topology
            pool_options = {}
            for server in topology.select_servers(lambda s: True, server_selection_timeout=0):
                pool = server._pool
                pool_options = {
                    "max_pool_size": pool.opts.max_pool_size,
                    "min_pool_size": pool.opts.min_pool_size,
                    "active_connections": pool.active_sockets,
                    "available_connections": pool.requests,
                }
                break
            return pool_options
        except Exception:
            return {"pool_stats": "unavailable"}

    def get_metrics(self) -> Dict[str, Any]:
        """Return current pool metrics for monitoring integration."""
        return {
            "connection_pool_checks": self._metrics["pool_checks"],
            "connection_pool_errors": self._metrics["pool_errors"],
            "connection_pool_healthy": self._metrics["last_check_ok"],
        }


# Module-level singleton (set during app startup)
_pool_manager: Optional[ConnectionPoolManager] = None


def init_pool_manager(client, db) -> ConnectionPoolManager:
    """Initialize the global pool manager. Call during app startup."""
    global _pool_manager
    _pool_manager = ConnectionPoolManager(client, db)
    return _pool_manager


def get_pool_manager() -> Optional[ConnectionPoolManager]:
    """Get the global pool manager instance."""
    return _pool_manager
