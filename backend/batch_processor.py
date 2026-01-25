"""
Batch Processor for High-Performance Operations
================================================

Batches multiple database operations into single transactions
Reduces database round-trips from N to 1

PERFORMANCE TARGETS:
- Batch size: 50-100 operations
- Flush interval: 100ms
- Throughput: 10,000+ ops/second
- Latency reduction: 80%+
"""

import asyncio
import time
from typing import Dict, List, Callable, Any, Optional
from collections import defaultdict
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class BatchProcessor:
    """
    Batches operations for efficient processing
    
    Usage:
        processor = BatchProcessor(flush_interval=0.1, max_batch_size=50)
        
        # Add operations to batch
        await processor.add_operation("update_order", order_id, update_data)
        
        # Operations are automatically flushed every 100ms or when batch is full
    """
    
    def __init__(
        self, 
        flush_interval: float = 0.1,  # 100ms
        max_batch_size: int = 50
    ):
        self.flush_interval = flush_interval
        self.max_batch_size = max_batch_size
        
        # Pending operations by type
        self.pending_operations: Dict[str, List[Dict]] = defaultdict(list)
        
        # Operation handlers
        self.handlers: Dict[str, Callable] = {}
        
        # Statistics
        self.stats = {
            "total_operations": 0,
            "batches_processed": 0,
            "avg_batch_size": 0,
            "operations_per_second": 0,
            "last_flush_time": time.time()
        }
        
        # Start flush loop
        self.running = True
        asyncio.create_task(self._flush_loop())
    
    def register_handler(self, operation_type: str, handler: Callable):
        """Register a handler for an operation type"""
        self.handlers[operation_type] = handler
        logger.info(f"✅ Registered handler: {operation_type}")
    
    async def add_operation(self, operation_type: str, *args, **kwargs):
        """
        Add operation to batch queue
        
        Args:
            operation_type: Type of operation (e.g., "update_order")
            *args, **kwargs: Operation parameters
        """
        operation = {
            "type": operation_type,
            "args": args,
            "kwargs": kwargs,
            "timestamp": time.time()
        }
        
        self.pending_operations[operation_type].append(operation)
        self.stats["total_operations"] += 1
        
        # Flush if batch is full
        if len(self.pending_operations[operation_type]) >= self.max_batch_size:
            await self._flush_operation_type(operation_type)
    
    async def _flush_operation_type(self, operation_type: str):
        """Flush all pending operations of a specific type"""
        if operation_type not in self.pending_operations:
            return
        
        operations = self.pending_operations[operation_type]
        if not operations:
            return
        
        # Clear pending operations
        self.pending_operations[operation_type] = []
        
        # Get handler
        handler = self.handlers.get(operation_type)
        if not handler:
            logger.warning(f"⚠️ No handler for operation type: {operation_type}")
            return
        
        # Process batch
        start_time = time.time()
        try:
            await handler(operations)
            
            # Update statistics
            self.stats["batches_processed"] += 1
            batch_size = len(operations)
            
            # Update average batch size
            total_batches = self.stats["batches_processed"]
            current_avg = self.stats["avg_batch_size"]
            self.stats["avg_batch_size"] = (
                (current_avg * (total_batches - 1) + batch_size) / total_batches
            )
            
            elapsed = time.time() - start_time
            logger.info(
                f"✅ Flushed {batch_size} {operation_type} operations in {elapsed*1000:.2f}ms"
            )
            
        except Exception as e:
            logger.error(f"❌ Error processing batch {operation_type}: {e}")
            # Re-add failed operations (with retry limit)
            for op in operations:
                if op.get("retry_count", 0) < 3:
                    op["retry_count"] = op.get("retry_count", 0) + 1
                    self.pending_operations[operation_type].append(op)
    
    async def _flush_all(self):
        """Flush all pending operations"""
        for operation_type in list(self.pending_operations.keys()):
            await self._flush_operation_type(operation_type)
    
    async def _flush_loop(self):
        """Periodic flush of pending operations"""
        while self.running:
            await asyncio.sleep(self.flush_interval)
            
            # Calculate operations per second
            current_time = time.time()
            elapsed = current_time - self.stats["last_flush_time"]
            if elapsed > 0:
                ops_in_period = sum(len(ops) for ops in self.pending_operations.values())
                self.stats["operations_per_second"] = ops_in_period / elapsed
            
            self.stats["last_flush_time"] = current_time
            
            # Flush all pending operations
            await self._flush_all()
    
    async def shutdown(self):
        """Gracefully shutdown processor"""
        self.running = False
        await self._flush_all()
        logger.info("✅ Batch processor shutdown complete")
    
    def get_stats(self) -> dict:
        """Get processor statistics"""
        return {
            **self.stats,
            "pending_operations": sum(len(ops) for ops in self.pending_operations.values()),
            "operation_types": len(self.handlers)
        }


class OrderBatchProcessor:
    """
    Specialized batch processor for order operations
    Handles order status updates, table updates, cache invalidation
    """
    
    def __init__(self, db, redis_client=None, websocket_manager=None):
        self.db = db
        self.redis = redis_client
        self.ws_manager = websocket_manager
        
        # Create batch processor
        self.processor = BatchProcessor(flush_interval=0.1, max_batch_size=50)
        
        # Register handlers
        self.processor.register_handler("update_order_status", self._handle_order_status_updates)
        self.processor.register_handler("update_table_status", self._handle_table_status_updates)
        self.processor.register_handler("invalidate_cache", self._handle_cache_invalidations)
    
    async def update_order_status(self, order_id: str, org_id: str, status: str):
        """Queue order status update"""
        await self.processor.add_operation(
            "update_order_status",
            order_id=order_id,
            org_id=org_id,
            status=status
        )
    
    async def update_table_status(self, table_id: str, org_id: str, status: str, order_id: Optional[str] = None):
        """Queue table status update"""
        await self.processor.add_operation(
            "update_table_status",
            table_id=table_id,
            org_id=org_id,
            status=status,
            order_id=order_id
        )
    
    async def invalidate_cache(self, org_id: str, cache_keys: List[str]):
        """Queue cache invalidation"""
        await self.processor.add_operation(
            "invalidate_cache",
            org_id=org_id,
            cache_keys=cache_keys
        )
    
    async def _handle_order_status_updates(self, operations: List[Dict]):
        """Batch process order status updates"""
        from pymongo import UpdateOne
        
        # Build bulk operations
        bulk_ops = []
        websocket_updates = []
        
        for op in operations:
            kwargs = op["kwargs"]
            order_id = kwargs["order_id"]
            org_id = kwargs["org_id"]
            status = kwargs["status"]
            
            # Add to bulk update
            bulk_ops.append(
                UpdateOne(
                    {"id": order_id, "organization_id": org_id},
                    {"$set": {
                        "status": status,
                        "updated_at": datetime.utcnow().isoformat()
                    }}
                )
            )
            
            # Prepare WebSocket notification
            websocket_updates.append({
                "org_id": org_id,
                "order_id": order_id,
                "status": status
            })
        
        # Execute bulk update
        if bulk_ops:
            try:
                result = await self.db.orders.bulk_write(bulk_ops, ordered=False)
                logger.info(f"✅ Bulk updated {result.modified_count} orders")
                
                # Send WebSocket notifications
                if self.ws_manager:
                    for update in websocket_updates:
                        await self.ws_manager.broadcast_order_update(
                            update["org_id"],
                            {"order_id": update["order_id"], "status": update["status"]}
                        )
                
            except Exception as e:
                logger.error(f"❌ Bulk order update failed: {e}")
    
    async def _handle_table_status_updates(self, operations: List[Dict]):
        """Batch process table status updates"""
        from pymongo import UpdateOne
        
        bulk_ops = []
        websocket_updates = []
        
        for op in operations:
            kwargs = op["kwargs"]
            table_id = kwargs["table_id"]
            org_id = kwargs["org_id"]
            status = kwargs["status"]
            order_id = kwargs.get("order_id")
            
            update_data = {"status": status}
            if order_id is not None:
                update_data["current_order_id"] = order_id
            
            bulk_ops.append(
                UpdateOne(
                    {"id": table_id, "organization_id": org_id},
                    {"$set": update_data}
                )
            )
            
            websocket_updates.append({
                "org_id": org_id,
                "table_id": table_id,
                "status": status
            })
        
        # Execute bulk update
        if bulk_ops:
            try:
                result = await self.db.tables.bulk_write(bulk_ops, ordered=False)
                logger.info(f"✅ Bulk updated {result.modified_count} tables")
                
                # Send WebSocket notifications
                if self.ws_manager:
                    for update in websocket_updates:
                        await self.ws_manager.broadcast_table_update(
                            update["org_id"],
                            {"table_id": update["table_id"], "status": update["status"]}
                        )
                
            except Exception as e:
                logger.error(f"❌ Bulk table update failed: {e}")
    
    async def _handle_cache_invalidations(self, operations: List[Dict]):
        """Batch process cache invalidations"""
        if not self.redis:
            return
        
        # Collect all cache keys
        all_keys = set()
        for op in operations:
            kwargs = op["kwargs"]
            cache_keys = kwargs.get("cache_keys", [])
            all_keys.update(cache_keys)
        
        # Delete in batch
        if all_keys:
            try:
                await self.redis.delete(*all_keys)
                logger.info(f"✅ Invalidated {len(all_keys)} cache keys")
            except Exception as e:
                logger.error(f"❌ Cache invalidation failed: {e}")
    
    def get_stats(self) -> dict:
        """Get processor statistics"""
        return self.processor.get_stats()


# Global instance
_order_batch_processor: Optional[OrderBatchProcessor] = None


async def init_order_batch_processor(db, redis_client=None, websocket_manager=None) -> OrderBatchProcessor:
    """Initialize order batch processor"""
    global _order_batch_processor
    _order_batch_processor = OrderBatchProcessor(db, redis_client, websocket_manager)
    logger.info("✅ Order batch processor initialized")
    return _order_batch_processor


def get_order_batch_processor() -> Optional[OrderBatchProcessor]:
    """Get the global order batch processor instance"""
    return _order_batch_processor
