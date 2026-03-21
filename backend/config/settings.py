import os
import multiprocessing
from dataclasses import dataclass


@dataclass
class Settings:
    # Server
    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", "10000"))
    environment: str = os.getenv("ENVIRONMENT", "production")
    debug: bool = os.getenv("DEBUG", "false").lower() == "true"
    log_level: str = os.getenv("LOG_LEVEL", "info").lower()

    # Database
    mongo_url: str = os.getenv("MONGO_URL", "mongodb://localhost:27017/restrobill")
    db_name: str = os.getenv("DB_NAME", "restrobill")
    mongo_max_pool_size: int = int(os.getenv("MONGO_MAX_POOL_SIZE", "50"))
    mongo_min_pool_size: int = int(os.getenv("MONGO_MIN_POOL_SIZE", "10"))
    mongo_max_idle_time_ms: int = int(os.getenv("MONGO_MAX_IDLE_TIME_MS", "30000"))

    # Workers
    workers: int = int(os.getenv("WEB_CONCURRENCY", str((2 * multiprocessing.cpu_count()) + 1)))
    worker_timeout: int = int(os.getenv("WORKER_TIMEOUT", "120"))
    worker_keepalive: int = int(os.getenv("WORKER_KEEPALIVE", "5"))

    # Redis
    redis_url: str = os.getenv("REDIS_URL", "")

    # Security
    jwt_secret: str = os.getenv("JWT_SECRET", "default-jwt-secret-please-change-in-production")

    # Queue
    request_queue_max_size: int = int(os.getenv("REQUEST_QUEUE_MAX_SIZE", "1000"))
    request_timeout_seconds: float = float(os.getenv("REQUEST_TIMEOUT_SECONDS", "30.0"))


settings = Settings()
