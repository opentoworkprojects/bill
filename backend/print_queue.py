"""
Ultra-Performance Print Queue Manager
Async print job processing with retry logic and status tracking
"""

import asyncio
import json
import logging
import time
import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from collections import deque
import aiofiles

logger = logging.getLogger(__name__)

class PrintJobStatus(Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    RETRYING = "retrying"

class PrintJobType(Enum):
    RECEIPT = "receipt"
    KOT = "kot"
    LABEL = "label"
    REPORT = "report"

@dataclass
class PrintJob:
    id: str
    type: PrintJobType
    status: PrintJobStatus
    content: str
    printer_name: Optional[str] = None
    copies: int = 1
    priority: int = 5  # 1-10, higher = more priority
    created_at: datetime = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    retry_count: int = 0
    max_retries: int = 3
    error_message: Optional[str] = None
    metadata: Dict[str, Any] = None
    organization_id: Optional[str] = None
    user_id: Optional[str] = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now(timezone.utc)
        if self.metadata is None:
            self.metadata = {}

    def to_dict(self):
        data = asdict(self)
        # Convert enums to strings
        data['type'] = self.type.value
        data['status'] = self.status.value
        # Convert datetime to ISO string
        for field in ['created_at', 'started_at', 'completed_at']:
            if data[field]:
                data[field] = data[field].isoformat()
        return data

class PrintQueue:
    def __init__(self, max_concurrent_jobs: int = 5):
        self.jobs: Dict[str, PrintJob] = {}
        self.pending_queue = deque()
        self.processing_jobs: Dict[str, asyncio.Task] = {}
        self.max_concurrent_jobs = max_concurrent_jobs
        self.is_running = False
        self.worker_task: Optional[asyncio.Task] = None
        self.stats = {
            'total_jobs': 0,
            'completed_jobs': 0,
            'failed_jobs': 0,
            'avg_processing_time': 0.0,
            'queue_size': 0
        }
        
        # Performance metrics
        self.metrics = {
            'jobs_per_second': 0.0,
            'success_rate': 0.0,
            'avg_queue_wait_time': 0.0,
            'peak_queue_size': 0
        }
        
        # Callbacks for different events
        self.callbacks = {
            'job_started': [],
            'job_completed': [],
            'job_failed': [],
            'queue_empty': []
        }

    async def start(self):
        """Start the print queue worker"""
        if self.is_running:
            return
        
        self.is_running = True
        self.worker_task = asyncio.create_task(self._worker())
        logger.info("🖨️ Print queue started")

    async def stop(self):
        """Stop the print queue worker"""
        if not self.is_running:
            return
        
        self.is_running = False
        
        # Cancel worker task
        if self.worker_task:
            self.worker_task.cancel()
            try:
                await self.worker_task
            except asyncio.CancelledError:
                pass
        
        # Cancel all processing jobs
        for task in self.processing_jobs.values():
            task.cancel()
        
        # Wait for all tasks to complete
        if self.processing_jobs:
            await asyncio.gather(*self.processing_jobs.values(), return_exceptions=True)
        
        logger.info("🖨️ Print queue stopped")

    def add_job(self, 
                content: str, 
                job_type: PrintJobType = PrintJobType.RECEIPT,
                printer_name: Optional[str] = None,
                copies: int = 1,
                priority: int = 5,
                organization_id: Optional[str] = None,
                user_id: Optional[str] = None,
                metadata: Optional[Dict[str, Any]] = None) -> str:
        """Add a new print job to the queue"""
        
        job_id = str(uuid.uuid4())
        job = PrintJob(
            id=job_id,
            type=job_type,
            status=PrintJobStatus.PENDING,
            content=content,
            printer_name=printer_name,
            copies=copies,
            priority=priority,
            organization_id=organization_id,
            user_id=user_id,
            metadata=metadata or {}
        )
        
        self.jobs[job_id] = job
        self._add_to_queue(job)
        self.stats['total_jobs'] += 1
        self.stats['queue_size'] = len(self.pending_queue)
        
        # Update peak queue size
        if self.stats['queue_size'] > self.metrics['peak_queue_size']:
            self.metrics['peak_queue_size'] = self.stats['queue_size']
        
        logger.info(f"📄 Print job added: {job_id} ({job_type.value})")
        return job_id

    def _add_to_queue(self, job: PrintJob):
        """Add job to queue with priority sorting"""
        # Insert job based on priority (higher priority first)
        inserted = False
        for i, existing_job_id in enumerate(self.pending_queue):
            existing_job = self.jobs[existing_job_id]
            if job.priority > existing_job.priority:
                self.pending_queue.insert(i, job.id)
                inserted = True
                break
        
        if not inserted:
            self.pending_queue.append(job.id)

    async def _worker(self):
        """Main worker loop for processing print jobs"""
        logger.info("🔄 Print queue worker started")
        
        while self.is_running:
            try:
                # Clean up completed processing jobs
                completed_jobs = [
                    job_id for job_id, task in self.processing_jobs.items()
                    if task.done()
                ]
                for job_id in completed_jobs:
                    del self.processing_jobs[job_id]
                
                # Start new jobs if we have capacity
                while (len(self.processing_jobs) < self.max_concurrent_jobs and 
                       self.pending_queue and self.is_running):
                    
                    job_id = self.pending_queue.popleft()
                    job = self.jobs.get(job_id)
                    
                    if job and job.status == PrintJobStatus.PENDING:
                        # Start processing the job
                        task = asyncio.create_task(self._process_job(job))
                        self.processing_jobs[job_id] = task
                
                # Update queue size
                self.stats['queue_size'] = len(self.pending_queue)
                
                # Check if queue is empty
                if not self.pending_queue and not self.processing_jobs:
                    await self._trigger_callbacks('queue_empty')
                
                # Sleep briefly to avoid busy waiting
                await asyncio.sleep(0.1)
                
            except Exception as e:
                logger.error(f"❌ Print queue worker error: {e}")
                await asyncio.sleep(1)

    async def _process_job(self, job: PrintJob):
        """Process a single print job"""
        job.status = PrintJobStatus.PROCESSING
        job.started_at = datetime.now(timezone.utc)
        
        logger.info(f"🖨️ Processing print job: {job.id}")
        await self._trigger_callbacks('job_started', job)
        
        try:
            # Simulate print processing time based on content length
            processing_time = min(max(len(job.content) / 1000, 0.1), 5.0)
            await asyncio.sleep(processing_time)
            
            # Here you would integrate with actual printer drivers
            success = await self._send_to_printer(job)
            
            if success:
                job.status = PrintJobStatus.COMPLETED
                job.completed_at = datetime.now(timezone.utc)
                self.stats['completed_jobs'] += 1
                
                # Update average processing time
                total_time = (job.completed_at - job.started_at).total_seconds()
                self._update_avg_processing_time(total_time)
                
                logger.info(f"✅ Print job completed: {job.id}")
                await self._trigger_callbacks('job_completed', job)
            else:
                raise Exception("Printer communication failed")
                
        except Exception as e:
            job.error_message = str(e)
            logger.error(f"❌ Print job failed: {job.id} - {e}")
            
            # Retry logic
            if job.retry_count < job.max_retries:
                job.retry_count += 1
                job.status = PrintJobStatus.RETRYING
                
                # Add back to queue with delay
                await asyncio.sleep(2 ** job.retry_count)  # Exponential backoff
                self._add_to_queue(job)
                
                logger.info(f"🔄 Retrying print job: {job.id} (attempt {job.retry_count})")
            else:
                job.status = PrintJobStatus.FAILED
                job.completed_at = datetime.now(timezone.utc)
                self.stats['failed_jobs'] += 1
                
                logger.error(f"💥 Print job permanently failed: {job.id}")
                await self._trigger_callbacks('job_failed', job)

    async def _send_to_printer(self, job: PrintJob) -> bool:
        """Send job to actual printer (mock implementation)"""
        # This is where you would integrate with actual printer drivers
        # For now, we'll simulate success/failure
        
        # Simulate occasional failures for testing
        import random
        if random.random() < 0.05:  # 5% failure rate
            return False
        
        # Log the print job (in production, this would go to printer)
        logger.info(f"🖨️ Printing {job.type.value} to {job.printer_name or 'default printer'}")
        logger.debug(f"Print content: {job.content[:100]}...")
        
        return True

    def _update_avg_processing_time(self, processing_time: float):
        """Update average processing time with exponential moving average"""
        if self.stats['avg_processing_time'] == 0:
            self.stats['avg_processing_time'] = processing_time
        else:
            # Exponential moving average with alpha = 0.1
            self.stats['avg_processing_time'] = (
                0.9 * self.stats['avg_processing_time'] + 
                0.1 * processing_time
            )

    async def _trigger_callbacks(self, event: str, job: Optional[PrintJob] = None):
        """Trigger callbacks for specific events"""
        for callback in self.callbacks.get(event, []):
            try:
                if asyncio.iscoroutinefunction(callback):
                    await callback(job)
                else:
                    callback(job)
            except Exception as e:
                logger.error(f"❌ Callback error for {event}: {e}")

    def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get status of a specific job"""
        job = self.jobs.get(job_id)
        if job:
            return job.to_dict()
        return None

    def cancel_job(self, job_id: str) -> bool:
        """Cancel a pending or processing job"""
        job = self.jobs.get(job_id)
        if not job:
            return False
        
        if job.status == PrintJobStatus.PENDING:
            # Remove from queue
            try:
                self.pending_queue.remove(job_id)
                job.status = PrintJobStatus.CANCELLED
                job.completed_at = datetime.now(timezone.utc)
                logger.info(f"🚫 Print job cancelled: {job_id}")
                return True
            except ValueError:
                pass
        
        elif job.status == PrintJobStatus.PROCESSING:
            # Cancel processing task
            task = self.processing_jobs.get(job_id)
            if task:
                task.cancel()
                job.status = PrintJobStatus.CANCELLED
                job.completed_at = datetime.now(timezone.utc)
                logger.info(f"🚫 Print job cancelled: {job_id}")
                return True
        
        return False

    def get_queue_status(self) -> Dict[str, Any]:
        """Get overall queue status and statistics"""
        # Calculate success rate
        total_completed = self.stats['completed_jobs'] + self.stats['failed_jobs']
        success_rate = (
            (self.stats['completed_jobs'] / total_completed * 100) 
            if total_completed > 0 else 0
        )
        
        # Calculate jobs per second (rough estimate)
        uptime_hours = 1  # This would be actual uptime in production
        jobs_per_second = self.stats['total_jobs'] / (uptime_hours * 3600)
        
        return {
            'queue_size': len(self.pending_queue),
            'processing_jobs': len(self.processing_jobs),
            'total_jobs': self.stats['total_jobs'],
            'completed_jobs': self.stats['completed_jobs'],
            'failed_jobs': self.stats['failed_jobs'],
            'success_rate': round(success_rate, 2),
            'avg_processing_time': round(self.stats['avg_processing_time'], 3),
            'jobs_per_second': round(jobs_per_second, 3),
            'peak_queue_size': self.metrics['peak_queue_size'],
            'is_running': self.is_running
        }

    def get_recent_jobs(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get recent jobs sorted by creation time"""
        sorted_jobs = sorted(
            self.jobs.values(),
            key=lambda x: x.created_at,
            reverse=True
        )
        return [job.to_dict() for job in sorted_jobs[:limit]]

    def add_callback(self, event: str, callback):
        """Add callback for specific events"""
        if event in self.callbacks:
            self.callbacks[event].append(callback)

    def remove_callback(self, event: str, callback):
        """Remove callback for specific events"""
        if event in self.callbacks and callback in self.callbacks[event]:
            self.callbacks[event].remove(callback)

    async def save_job_history(self, filepath: str):
        """Save job history to file"""
        try:
            history = {
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'stats': self.get_queue_status(),
                'jobs': [job.to_dict() for job in self.jobs.values()]
            }
            
            async with aiofiles.open(filepath, 'w') as f:
                await f.write(json.dumps(history, indent=2))
            
            logger.info(f"💾 Print job history saved to {filepath}")
        except Exception as e:
            logger.error(f"❌ Failed to save job history: {e}")

# Global print queue instance
print_queue = PrintQueue()

# Convenience functions
async def add_receipt_print_job(content: str, **kwargs) -> str:
    """Add a receipt print job"""
    return print_queue.add_job(content, PrintJobType.RECEIPT, **kwargs)

async def add_kot_print_job(content: str, **kwargs) -> str:
    """Add a KOT print job"""
    return print_queue.add_job(content, PrintJobType.KOT, **kwargs)

async def get_print_job_status(job_id: str) -> Optional[Dict[str, Any]]:
    """Get print job status"""
    return print_queue.get_job_status(job_id)

async def cancel_print_job(job_id: str) -> bool:
    """Cancel a print job"""
    return print_queue.cancel_job(job_id)

# Initialize print queue on import
async def init_print_queue():
    """Initialize the print queue system"""
    await print_queue.start()
    logger.info("🖨️ Print queue system initialized")

async def cleanup_print_queue():
    """Cleanup print queue system"""
    await print_queue.stop()
    logger.info("🖨️ Print queue system cleaned up")