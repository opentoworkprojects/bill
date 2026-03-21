"""
Request Queue Management Middleware

Implements priority-based request queuing with backpressure to handle
high-volume order creation flow without overwhelming the system.

Priority tiers:
  HIGH (0):   Order creation, payment processing
  MEDIUM (1): Order updates, table status changes  
  LOW (2):    Analytics, reports, background tasks

Returns HTTP 503 with Retry-After header when queue is full.
"""
import asyncio
import time
import logging
from enum import IntEnum
from typing import Callable, Awaitable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

logger = logging.getLogger(__name__)


class Priority(IntEnum):
    HIGH = 0
    MEDIUM = 1
    LOW = 2


# Route priority mapping
HIGH_PRIORITY_PATTERNS = [
    "/api/orders",          # POST /api/orders (order creation)
    "/api/payments",        # Payment processing
    "/api/public/order",    # Customer self-ordering
]

MEDIUM_PRIORITY_PATTERNS = [
    "/api/orders/",         # Order updates (PATCH/PUT)
    "/api/tables",          # Table status changes
    "/api/billing",         # Billing operations
]

LOW_PRIORITY_PATTERNS = [
    "/api/analytics",
    "/api/reports",
    "/api/export",
    "/api/monitoring",
]


def get_request_priority(path: str, method: str) -> Priority:
    """Determine request priority based on path and HTTP method."""
    # POST to order creation = HIGH
    if method == "POST" and any(path.startswith(p) for p in HIGH_PRIORITY_PATTERNS):
        return Priority.HIGH
    # Order/table updates = MEDIUM
    if any(path.startswith(p) for p in MEDIUM_PRIORITY_PATTERNS):
        return Priority.MEDIUM
    # Analytics/reports = LOW
    if any(path.startswith(p) for p in LOW_PRIORITY_PATTERNS):
        return Priority.LOW
    # Default = MEDIUM
    return Priority.MEDIUM


class RequestQueueMiddleware(BaseHTTPMiddleware):
    """
    Priority queue middleware that controls concurrent request processing.
    
    - Queues incoming requests by priority
    - Returns 503 with Retry-After when queue is full
    - Tracks queue metrics for monitoring
    """

    def __init__(
        self,
        app,
        max_queue_size: int = 1000,
        max_concurrent: int = 50,
        request_timeout: float = 30.0,
    ):
        super().__init__(app)
        self.max_queue_size = max_queue_size
        self.max_concurrent = max_concurrent
        self.request_timeout = request_timeout
        
        # Semaphore limits concurrent processing
        self._semaphore = asyncio.Semaphore(max_concurrent)
        
        # Metrics
        self._queued = 0
        self._processed = 0
        self._rejected = 0
        self._total_wait_ms = 0.0
        self._total_process_ms = 0.0

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip queue for health checks, static files, public endpoints, and preflight
        path = request.url.path
        if (
            path in ("/health", "/", "/docs", "/openapi.json", "/redoc")
            or request.method == "OPTIONS"
            or path.startswith("/api/public/")
            or path.startswith("/api/app/latest")
            or path.startswith("/webhooks/")
            or path.startswith("/api/monitoring/")
            # Read-only endpoints that should never be queued
            or (request.method == "GET" and path.startswith("/api/menu"))
            or (request.method == "GET" and path.startswith("/api/business/settings"))
            or (request.method == "GET" and path.startswith("/api/subscription/status"))
            or (request.method == "GET" and path.startswith("/api/auth/me"))
            or (request.method == "GET" and path.startswith("/api/ping"))
        ):
            return await call_next(request)

        priority = get_request_priority(path, request.method)

        # Check queue capacity
        if self._queued >= self.max_queue_size:
            self._rejected += 1
            logger.warning(
                f"Request queue full ({self._queued}/{self.max_queue_size}), "
                f"rejecting {request.method} {path}"
            )
            return JSONResponse(
                status_code=503,
                content={
                    "error": "Service temporarily unavailable",
                    "message": "Server is under high load. Please retry shortly.",
                    "queue_size": self._queued,
                },
                headers={"Retry-After": "5"},
            )

        self._queued += 1
        enqueue_time = time.monotonic()

        try:
            # Wait for a slot with timeout
            try:
                await asyncio.wait_for(
                    self._semaphore.acquire(),
                    timeout=self.request_timeout,
                )
            except asyncio.TimeoutError:
                self._rejected += 1
                logger.warning(
                    f"Request timed out waiting in queue after {self.request_timeout}s: "
                    f"{request.method} {path}"
                )
                return JSONResponse(
                    status_code=503,
                    content={
                        "error": "Request timeout",
                        "message": f"Request waited >{self.request_timeout}s in queue.",
                    },
                    headers={"Retry-After": "10"},
                )

            wait_ms = (time.monotonic() - enqueue_time) * 1000
            self._total_wait_ms += wait_ms

            process_start = time.monotonic()
            try:
                response = await call_next(request)
                return response
            finally:
                process_ms = (time.monotonic() - process_start) * 1000
                self._total_process_ms += process_ms
                self._processed += 1
                self._semaphore.release()

                if wait_ms > 1000:  # Log if waited >1s
                    logger.warning(
                        f"High queue wait: {wait_ms:.0f}ms for {request.method} {path} "
                        f"(priority={priority.name})"
                    )
        finally:
            self._queued -= 1

    def get_metrics(self) -> dict:
        """Return queue metrics for monitoring integration."""
        avg_wait = (self._total_wait_ms / self._processed) if self._processed > 0 else 0
        avg_process = (self._total_process_ms / self._processed) if self._processed > 0 else 0
        return {
            "queue_current_size": self._queued,
            "queue_max_size": self.max_queue_size,
            "requests_processed": self._processed,
            "requests_rejected": self._rejected,
            "avg_queue_wait_ms": round(avg_wait, 2),
            "avg_process_time_ms": round(avg_process, 2),
        }


# Module-level singleton for metrics access
_queue_middleware: RequestQueueMiddleware = None


def get_queue_middleware() -> RequestQueueMiddleware:
    return _queue_middleware


def create_queue_middleware(app, max_queue_size=1000, max_concurrent=50, request_timeout=30.0):
    """Factory function - creates and registers the middleware, stores singleton."""
    global _queue_middleware
    middleware = RequestQueueMiddleware(
        app,
        max_queue_size=max_queue_size,
        max_concurrent=max_concurrent,
        request_timeout=request_timeout,
    )
    _queue_middleware = middleware
    return middleware
