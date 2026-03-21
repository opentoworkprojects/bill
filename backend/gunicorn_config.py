"""
Gunicorn configuration for production high-traffic deployment.
Workers = (2 * CPU cores) + 1 for optimal concurrency.
Uses UvicornWorker for async ASGI support.
"""
import multiprocessing
import os

# Worker configuration
workers = int(os.getenv("WEB_CONCURRENCY", str((2 * multiprocessing.cpu_count()) + 1)))
worker_class = "uvicorn.workers.UvicornWorker"
worker_connections = 1000

# Timeouts
timeout = int(os.getenv("WORKER_TIMEOUT", "120"))
keepalive = int(os.getenv("WORKER_KEEPALIVE", "5"))
graceful_timeout = int(os.getenv("GRACEFUL_TIMEOUT", "30"))

# Memory management - restart workers after N requests to prevent memory bloat
max_requests = int(os.getenv("MAX_REQUESTS", "1000"))
max_requests_jitter = int(os.getenv("MAX_REQUESTS_JITTER", "100"))

# Preload app to share memory across workers (faster startup, lower memory)
preload_app = os.getenv("PRELOAD_APP", "true").lower() == "true"

# Binding
bind = f"{os.getenv('HOST', '0.0.0.0')}:{os.getenv('PORT', '10000')}"

# Logging
loglevel = os.getenv("LOG_LEVEL", "info").lower()
accesslog = "-"   # stdout
errorlog = "-"    # stderr
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s %(D)sµs'

# Process naming
proc_name = "restrobill-api"

# Graceful shutdown
def worker_exit(server, worker):
    """Called when a worker exits - log for monitoring."""
    server.log.info(f"Worker {worker.pid} exited")

def on_starting(server):
    server.log.info(f"Starting Gunicorn with {workers} workers (UvicornWorker)")

def post_fork(server, worker):
    server.log.info(f"Worker spawned (pid: {worker.pid})")
