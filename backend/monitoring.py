"""
Comprehensive Monitoring and Metrics System for BillByteKOT
Supports million-user scalability with real-time metrics
"""

import asyncio
import json
import time
import psutil
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any
from collections import defaultdict, deque
from dataclasses import dataclass, asdict
from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class MetricPoint:
    """Single metric data point"""
    timestamp: float
    value: float
    labels: Dict[str, str] = None

@dataclass
class SystemMetrics:
    """System-level metrics"""
    cpu_percent: float
    memory_percent: float
    memory_used_mb: float
    memory_total_mb: float
    disk_percent: float
    disk_used_gb: float
    disk_total_gb: float
    network_sent_mb: float
    network_recv_mb: float
    load_average: List[float]
    active_connections: int
    timestamp: float

@dataclass
class ApplicationMetrics:
    """Application-level metrics"""
    active_users: int
    total_requests: int
    requests_per_second: float
    avg_response_time: float
    error_rate: float
    cache_hit_rate: float
    database_connections: int
    redis_connections: int
    active_orders: int
    orders_per_minute: float
    timestamp: float

class MetricsCollector:
    """Collects and stores metrics in memory with Redis backup"""
    
    def __init__(self, redis_cache=None, max_points: int = 1000):
        self.redis_cache = redis_cache
        self.max_points = max_points
        
        # In-memory storage for fast access
        self.system_metrics: deque = deque(maxlen=max_points)
        self.app_metrics: deque = deque(maxlen=max_points)
        self.custom_metrics: Dict[str, deque] = defaultdict(lambda: deque(maxlen=max_points))
        
        # Request tracking
        self.request_count = 0
        self.request_times = deque(maxlen=100)  # Last 100 request times
        self.error_count = 0
        self.last_reset = time.time()
        
        # Cache metrics
        self.cache_hits = 0
        self.cache_misses = 0
        
        # Network baseline for delta calculation
        self.network_baseline = None
        
    async def collect_system_metrics(self) -> SystemMetrics:
        """Collect system-level metrics"""
        try:
            # CPU and Memory
            cpu_percent = psutil.cpu_percent(interval=0.1)
            memory = psutil.virtual_memory()
            
            # Disk usage
            disk = psutil.disk_usage('/')
            
            # Network I/O (calculate delta)
            network = psutil.net_io_counters()
            if self.network_baseline is None:
                self.network_baseline = {
                    'bytes_sent': network.bytes_sent,
                    'bytes_recv': network.bytes_recv,
                    'timestamp': time.time()
                }
                network_sent_mb = 0
                network_recv_mb = 0
            else:
                time_delta = time.time() - self.network_baseline['timestamp']
                if time_delta > 0:
                    sent_delta = network.bytes_sent - self.network_baseline['bytes_sent']
                    recv_delta = network.bytes_recv - self.network_baseline['bytes_recv']
                    network_sent_mb = (sent_delta / (1024 * 1024)) / time_delta
                    network_recv_mb = (recv_delta / (1024 * 1024)) / time_delta
                    
                    # Update baseline
                    self.network_baseline = {
                        'bytes_sent': network.bytes_sent,
                        'bytes_recv': network.bytes_recv,
                        'timestamp': time.time()
                    }
                else:
                    network_sent_mb = 0
                    network_recv_mb = 0
            
            # Load average (Unix-like systems)
            try:
                load_avg = list(psutil.getloadavg())
            except AttributeError:
                # Windows doesn't have load average
                load_avg = [cpu_percent / 100.0] * 3
            
            # Active connections
            try:
                connections = len(psutil.net_connections())
            except (psutil.AccessDenied, psutil.NoSuchProcess):
                connections = 0
            
            metrics = SystemMetrics(
                cpu_percent=cpu_percent,
                memory_percent=memory.percent,
                memory_used_mb=memory.used / (1024 * 1024),
                memory_total_mb=memory.total / (1024 * 1024),
                disk_percent=disk.percent,
                disk_used_gb=disk.used / (1024 * 1024 * 1024),
                disk_total_gb=disk.total / (1024 * 1024 * 1024),
                network_sent_mb=network_sent_mb,
                network_recv_mb=network_recv_mb,
                load_average=load_avg,
                active_connections=connections,
                timestamp=time.time()
            )
            
            # Store in memory
            self.system_metrics.append(metrics)
            
            # Store in Redis if available
            if self.redis_cache and self.redis_cache.is_connected() and self.redis_cache.redis:
                try:
                    await self.redis_cache.redis.setex(
                        "metrics:system:latest", 
                        300,  # 5 min TTL
                        json.dumps(asdict(metrics))
                    )
                except Exception as redis_error:
                    logger.debug(f"Redis metrics storage failed: {redis_error}")
            
            return metrics
            
        except Exception as e:
            logger.error(f"Error collecting system metrics: {e}")
            return None
    
    async def collect_app_metrics(self, db: AsyncIOMotorDatabase) -> ApplicationMetrics:
        """Collect application-level metrics"""
        try:
            current_time = time.time()
            time_window = current_time - self.last_reset
            
            # Calculate requests per second
            rps = self.request_count / max(time_window, 1)
            
            # Calculate average response time
            avg_response_time = sum(self.request_times) / len(self.request_times) if self.request_times else 0
            
            # Calculate error rate
            total_requests = self.request_count + self.error_count
            error_rate = (self.error_count / max(total_requests, 1)) * 100
            
            # Calculate cache hit rate
            total_cache_requests = self.cache_hits + self.cache_misses
            cache_hit_rate = (self.cache_hits / max(total_cache_requests, 1)) * 100
            
            # Get active users (users with activity in last 5 minutes)
            five_min_ago = datetime.now(timezone.utc) - timedelta(minutes=5)
            active_users = await db.users.count_documents({
                "last_activity": {"$gte": five_min_ago.isoformat()}
            })
            
            # Get active orders
            active_orders = await db.orders.count_documents({
                "status": {"$nin": ["completed", "cancelled"]}
            })
            
            # Calculate orders per minute (last hour)
            one_hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)
            recent_orders = await db.orders.count_documents({
                "created_at": {"$gte": one_hour_ago.isoformat()}
            })
            orders_per_minute = recent_orders / 60.0
            
            metrics = ApplicationMetrics(
                active_users=active_users,
                total_requests=self.request_count,
                requests_per_second=rps,
                avg_response_time=avg_response_time,
                error_rate=error_rate,
                cache_hit_rate=cache_hit_rate,
                database_connections=0,  # Would need MongoDB driver metrics
                redis_connections=0,     # Would need Redis connection pool metrics
                active_orders=active_orders,
                orders_per_minute=orders_per_minute,
                timestamp=current_time
            )
            
            # Store in memory
            self.app_metrics.append(metrics)
            
            # Store in Redis if available
            if self.redis_cache and self.redis_cache.is_connected() and self.redis_cache.redis:
                try:
                    await self.redis_cache.redis.setex(
                        "metrics:app:latest", 
                        300,  # 5 min TTL
                        json.dumps(asdict(metrics))
                    )
                except Exception as redis_error:
                    logger.debug(f"Redis metrics storage failed: {redis_error}")
            
            return metrics
            
        except Exception as e:
            logger.error(f"Error collecting app metrics: {e}")
            return None
    
    def record_request(self, response_time: float, is_error: bool = False):
        """Record a request for metrics"""
        self.request_count += 1
        self.request_times.append(response_time)
        
        if is_error:
            self.error_count += 1
    
    def record_cache_hit(self):
        """Record a cache hit"""
        self.cache_hits += 1
    
    def record_cache_miss(self):
        """Record a cache miss"""
        self.cache_misses += 1
    
    def add_custom_metric(self, name: str, value: float, labels: Dict[str, str] = None):
        """Add a custom metric"""
        point = MetricPoint(
            timestamp=time.time(),
            value=value,
            labels=labels or {}
        )
        self.custom_metrics[name].append(point)
    
    def get_metrics_summary(self) -> Dict[str, Any]:
        """Get a summary of all metrics"""
        latest_system = self.system_metrics[-1] if self.system_metrics else None
        latest_app = self.app_metrics[-1] if self.app_metrics else None
        
        return {
            "system": asdict(latest_system) if latest_system else None,
            "application": asdict(latest_app) if latest_app else None,
            "custom_metrics": {
                name: [asdict(point) for point in points][-10:]  # Last 10 points
                for name, points in self.custom_metrics.items()
            },
            "collection_time": datetime.now(timezone.utc).isoformat()
        }
    
    def reset_counters(self):
        """Reset request counters (call periodically)"""
        self.request_count = 0
        self.error_count = 0
        self.cache_hits = 0
        self.cache_misses = 0
        self.last_reset = time.time()

class HealthChecker:
    """Health check system for all components"""
    
    def __init__(self, db: AsyncIOMotorDatabase, redis_cache=None):
        self.db = db
        self.redis_cache = redis_cache
        self.checks = {}
    
    async def check_database(self) -> Dict[str, Any]:
        """Check MongoDB health"""
        try:
            start_time = time.time()
            
            # Simple ping
            await self.db.command("ping")
            
            # Check if we can read/write
            test_doc = {"_id": "health_check", "timestamp": datetime.now(timezone.utc).isoformat()}
            await self.db.health_checks.replace_one({"_id": "health_check"}, test_doc, upsert=True)
            
            response_time = (time.time() - start_time) * 1000  # ms
            
            # Get database stats
            stats = await self.db.command("dbStats")
            
            return {
                "status": "healthy",
                "response_time_ms": response_time,
                "collections": stats.get("collections", 0),
                "data_size_mb": stats.get("dataSize", 0) / (1024 * 1024),
                "storage_size_mb": stats.get("storageSize", 0) / (1024 * 1024)
            }
            
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "response_time_ms": None
            }
    
    async def check_redis(self) -> Dict[str, Any]:
        """Check Redis health"""
        if not self.redis_cache or not self.redis_cache.is_connected():
            return {
                "status": "unavailable",
                "error": "Redis not configured or not connected"
            }
        
        try:
            start_time = time.time()
            
            # Ping Redis
            await self.redis_cache.redis.ping()
            
            # Test read/write
            test_key = "health_check"
            test_value = str(time.time())
            await self.redis_cache.redis.setex(test_key, 10, test_value)
            retrieved = await self.redis_cache.redis.get(test_key)
            
            if retrieved != test_value:
                raise Exception("Redis read/write test failed")
            
            response_time = (time.time() - start_time) * 1000  # ms
            
            # Get Redis info
            info = await self.redis_cache.redis.info()
            
            return {
                "status": "healthy",
                "response_time_ms": response_time,
                "connected_clients": info.get("connected_clients", 0),
                "used_memory_mb": info.get("used_memory", 0) / (1024 * 1024),
                "keyspace_hits": info.get("keyspace_hits", 0),
                "keyspace_misses": info.get("keyspace_misses", 0)
            }
            
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "response_time_ms": None
            }
    
    async def check_external_services(self) -> Dict[str, Any]:
        """Check external service dependencies"""
        checks = {}
        
        # Check email service
        try:
            # This would ping your email service
            checks["email_service"] = {"status": "healthy"}
        except Exception as e:
            checks["email_service"] = {"status": "unhealthy", "error": str(e)}
        
        # Check payment gateway (Razorpay)
        try:
            # This would ping Razorpay API
            checks["payment_gateway"] = {"status": "healthy"}
        except Exception as e:
            checks["payment_gateway"] = {"status": "unhealthy", "error": str(e)}
        
        return checks
    
    async def run_all_checks(self) -> Dict[str, Any]:
        """Run all health checks"""
        results = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "overall_status": "healthy"
        }
        
        # Run checks concurrently
        db_check = await self.check_database()
        redis_check = await self.check_redis()
        external_checks = await self.check_external_services()
        
        results["database"] = db_check
        results["redis"] = redis_check
        results["external_services"] = external_checks
        
        # Determine overall status
        if db_check["status"] != "healthy":
            results["overall_status"] = "unhealthy"
        elif redis_check["status"] == "unhealthy":  # Redis unavailable is OK
            results["overall_status"] = "degraded"
        
        return results

class AlertManager:
    """Alert system for critical issues"""
    
    def __init__(self, redis_cache=None):
        self.redis_cache = redis_cache
        self.alert_thresholds = {
            "cpu_percent": 80.0,
            "memory_percent": 85.0,
            "disk_percent": 90.0,
            "error_rate": 5.0,
            "response_time": 2000.0,  # ms
            "cache_hit_rate": 70.0    # minimum
        }
        self.alert_cooldown = 300  # 5 minutes
        self.active_alerts = {}
    
    async def check_alerts(self, system_metrics: SystemMetrics, app_metrics: ApplicationMetrics):
        """Check if any metrics exceed thresholds"""
        current_time = time.time()
        alerts = []
        
        # System alerts
        if system_metrics.cpu_percent > self.alert_thresholds["cpu_percent"]:
            alerts.append({
                "type": "high_cpu",
                "severity": "warning",
                "message": f"CPU usage is {system_metrics.cpu_percent:.1f}%",
                "value": system_metrics.cpu_percent,
                "threshold": self.alert_thresholds["cpu_percent"]
            })
        
        if system_metrics.memory_percent > self.alert_thresholds["memory_percent"]:
            alerts.append({
                "type": "high_memory",
                "severity": "warning",
                "message": f"Memory usage is {system_metrics.memory_percent:.1f}%",
                "value": system_metrics.memory_percent,
                "threshold": self.alert_thresholds["memory_percent"]
            })
        
        if system_metrics.disk_percent > self.alert_thresholds["disk_percent"]:
            alerts.append({
                "type": "high_disk",
                "severity": "critical",
                "message": f"Disk usage is {system_metrics.disk_percent:.1f}%",
                "value": system_metrics.disk_percent,
                "threshold": self.alert_thresholds["disk_percent"]
            })
        
        # Application alerts
        if app_metrics.error_rate > self.alert_thresholds["error_rate"]:
            alerts.append({
                "type": "high_error_rate",
                "severity": "critical",
                "message": f"Error rate is {app_metrics.error_rate:.1f}%",
                "value": app_metrics.error_rate,
                "threshold": self.alert_thresholds["error_rate"]
            })
        
        if app_metrics.avg_response_time > self.alert_thresholds["response_time"]:
            alerts.append({
                "type": "slow_response",
                "severity": "warning",
                "message": f"Average response time is {app_metrics.avg_response_time:.0f}ms",
                "value": app_metrics.avg_response_time,
                "threshold": self.alert_thresholds["response_time"]
            })
        
        if app_metrics.cache_hit_rate < self.alert_thresholds["cache_hit_rate"]:
            alerts.append({
                "type": "low_cache_hit_rate",
                "severity": "warning",
                "message": f"Cache hit rate is {app_metrics.cache_hit_rate:.1f}%",
                "value": app_metrics.cache_hit_rate,
                "threshold": self.alert_thresholds["cache_hit_rate"]
            })
        
        # Process alerts with cooldown
        for alert in alerts:
            alert_key = alert["type"]
            last_alert_time = self.active_alerts.get(alert_key, 0)
            
            if current_time - last_alert_time > self.alert_cooldown:
                await self.send_alert(alert)
                self.active_alerts[alert_key] = current_time
    
    async def send_alert(self, alert: Dict[str, Any]):
        """Send alert notification"""
        try:
            # Log the alert
            logger.warning(f"ALERT [{alert['severity'].upper()}]: {alert['message']}")
            
            # Store in Redis for dashboard
            if self.redis_cache and self.redis_cache.is_connected() and self.redis_cache.redis:
                alert_data = {
                    **alert,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
                await self.redis_cache.redis.lpush("alerts", json.dumps(alert_data))
                await self.redis_cache.redis.ltrim("alerts", 0, 99)  # Keep last 100 alerts
            
            # Here you could add integrations with:
            # - Email notifications
            # - Slack/Discord webhooks
            # - SMS alerts
            # - PagerDuty/OpsGenie
            
        except Exception as e:
            logger.error(f"Failed to send alert: {e}")

# Global instances
metrics_collector = None
health_checker = None
alert_manager = None

def init_monitoring(db: AsyncIOMotorDatabase, redis_cache=None):
    """Initialize monitoring system"""
    global metrics_collector, health_checker, alert_manager
    
    metrics_collector = MetricsCollector(redis_cache)
    health_checker = HealthChecker(db, redis_cache)
    alert_manager = AlertManager(redis_cache)
    
    logger.info("🔍 Monitoring system initialized")

async def collect_metrics_task(db: AsyncIOMotorDatabase):
    """Background task to collect metrics"""
    global metrics_collector, alert_manager
    
    if not metrics_collector or not alert_manager:
        return
    
    while True:
        try:
            # Collect metrics
            system_metrics = await metrics_collector.collect_system_metrics()
            app_metrics = await metrics_collector.collect_app_metrics(db)
            
            # Check for alerts
            if system_metrics and app_metrics:
                await alert_manager.check_alerts(system_metrics, app_metrics)
            
            # Reset counters every 5 minutes
            if time.time() - metrics_collector.last_reset > 300:
                metrics_collector.reset_counters()
            
            # Wait 30 seconds before next collection
            await asyncio.sleep(30)
            
        except Exception as e:
            logger.error(f"Error in metrics collection: {e}")
            await asyncio.sleep(60)  # Wait longer on error

# API Router for monitoring endpoints
monitoring_router = APIRouter(prefix="/api/monitoring", tags=["Monitoring"])

@monitoring_router.get("/metrics")
async def get_metrics():
    """Get current metrics summary"""
    if not metrics_collector:
        raise HTTPException(status_code=503, detail="Monitoring not initialized")
    
    return metrics_collector.get_metrics_summary()

@monitoring_router.get("/health")
async def health_check():
    """Comprehensive health check"""
    if not health_checker:
        raise HTTPException(status_code=503, detail="Health checker not initialized")
    
    return await health_checker.run_all_checks()

@monitoring_router.get("/alerts")
async def get_recent_alerts():
    """Get recent alerts"""
    if not alert_manager or not alert_manager.redis_cache:
        return {"alerts": []}
    
    try:
        alerts_data = await alert_manager.redis_cache.redis.lrange("alerts", 0, 19)  # Last 20 alerts
        alerts = [json.loads(alert) for alert in alerts_data]
        return {"alerts": alerts}
    except Exception as e:
        logger.error(f"Error fetching alerts: {e}")
        return {"alerts": []}

@monitoring_router.get("/system")
async def get_system_info():
    """Get detailed system information"""
    try:
        import platform
        
        return {
            "platform": platform.platform(),
            "python_version": platform.python_version(),
            "cpu_count": psutil.cpu_count(),
            "memory_total_gb": psutil.virtual_memory().total / (1024**3),
            "disk_total_gb": psutil.disk_usage('/').total / (1024**3),
            "boot_time": datetime.fromtimestamp(psutil.boot_time()).isoformat(),
            "uptime_hours": (time.time() - psutil.boot_time()) / 3600
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting system info: {e}")
