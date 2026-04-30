"""
Gunicorn configuration optimized for Render free tier (512MB RAM).
Hard cap: 2 UvicornWorkers. Each worker loads the full app (~100MB),
so 2 workers = ~200MB + overhead, safely within 512MB.
Set WEB_CONCURRENCY env var to override (max recommended: 3).
"""
import os

# Render free tier: 512MB RAM. Each UvicornWorker ~100MB.
# Default 2 workers — safe headroom. Override via WEB_CONCURRENCY env var.
_default_workers = 2
workers = int(os.getenv("WEB_CONCURRENCY", str(_default_workers)))
# Safety cap — never exceed 3 on free tier
workers = min(workers, 3)

worker_class = "uvicorn.workers.UvicornWorker"
worker_connections = 200  # per worker; 2 workers × 200 = 400 concurrent

# Timeouts
timeout = int(os.getenv("WORKER_TIMEOUT", "120"))
keepalive = int(os.getenv("WORKER_KEEPALIVE", "5"))
graceful_timeout = int(os.getenv("GRACEFUL_TIMEOUT", "30"))

# Recycle workers after N requests to prevent memory bloat
max_requests = int(os.getenv("MAX_REQUESTS", "500"))
max_requests_jitter = int(os.getenv("MAX_REQUESTS_JITTER", "50"))

# Preload app — shares memory across workers (saves ~50MB on fork)
preload_app = True

# Binding
bind = f"{os.getenv('HOST', '0.0.0.0')}:{os.getenv('PORT', '10000')}"

# Logging
loglevel = os.getenv("LOG_LEVEL", "warning").lower()  # warning reduces log noise
accesslog = "-"
errorlog = "-"
access_log_format = '%(h)s "%(r)s" %(s)s %(b)s %(D)sµs'

proc_name = "restrobill-api"

def on_starting(server):
    server.log.info(f"Starting Gunicorn with {workers} workers (UvicornWorker)")

def post_fork(server, worker):
    server.log.info(f"Worker spawned (pid: {worker.pid})")

def worker_exit(server, worker):
    server.log.info(f"Worker {worker.pid} exited")
