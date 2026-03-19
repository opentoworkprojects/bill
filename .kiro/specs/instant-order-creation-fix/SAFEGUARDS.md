# Critical Safeguards for Instant Order Creation

## Overview

This document outlines the critical safeguards implemented to ensure data integrity and prevent failures when moving operations to background tasks.

## 1. Prevent Duplicate WhatsApp Messages

**Problem**: If order creation is retried due to network timeout, WhatsApp messages could be sent multiple times to the same customer.

**Solution**:
- Add `whatsapp_notification_sent` boolean field to Order model
- Check this flag before sending WhatsApp in background task
- Use atomic database update to set flag after successful send
- If order creation is retried, WhatsApp is NOT sent again (idempotency)

**Implementation**:
```python
# Before sending WhatsApp
if order.get("whatsapp_notification_sent"):
    return  # Already sent, skip

# Send WhatsApp
result = await send_whatsapp_notification(...)

# Mark as sent atomically
await db.orders.update_one(
    {"id": order_id, "whatsapp_notification_sent": False},
    {"$set": {"whatsapp_notification_sent": True}}
)
```

## 2. Guaranteed Table Status Updates

**Problem**: Table status is CRITICAL for restaurant operations. If it fails silently, waiters won't know which tables are occupied.

**Solution**:
- Implement aggressive retry logic: 5 attempts with exponential backoff
- Use atomic database updates to prevent race conditions
- Log CRITICAL error with alert if all retries fail
- Add monitoring metric for table update failures

**Implementation**:
```python
async def update_table_status_with_retry(table_id, order_id, max_retries=5):
    for attempt in range(max_retries):
        try:
            result = await db.tables.update_one(
                {"id": table_id},
                {"$set": {"status": "occupied", "current_order_id": order_id}}
            )
            if result.modified_count > 0:
                return True
        except Exception as e:
            if attempt == max_retries - 1:
                # CRITICAL: Alert monitoring system
                log_critical_error(f"Table status update failed after {max_retries} attempts")
                raise
            await asyncio.sleep(0.1 * (2 ** attempt))  # Exponential backoff
```

## 3. Consolidation Never Loses Data

**Problem**: If order consolidation fails, we could lose the new order data.

**Solution**:
- ALWAYS create the new order first (no data loss)
- Attempt consolidation in background as best-effort
- If consolidation fails after retries, log error for manual review
- New order is visible to staff immediately

**Implementation**:
```python
# 1. Create new order FIRST (critical path)
new_order = await db.orders.insert_one(order_data)

# 2. Attempt consolidation in background (best-effort)
asyncio.create_task(attempt_consolidation(new_order.id, table_id))

# 3. Return immediately - staff can start cooking
return new_order
```

## 4. Background Task Error Handling

**Problem**: Background tasks could fail silently without anyone knowing.

**Solution**:
- Wrap all background tasks in try-except blocks
- Log all errors to monitoring system
- Add retry logic for critical operations
- Alert on repeated failures

**Implementation**:
```python
async def background_task_wrapper(task_name, task_func, *args, **kwargs):
    try:
        await task_func(*args, **kwargs)
    except Exception as e:
        log_error(f"Background task {task_name} failed: {e}")
        # Alert monitoring system for critical tasks
        if task_name in ["table_update", "consolidation"]:
            send_alert(f"Critical background task failed: {task_name}")
```

## 5. Cache Invalidation is Best-Effort

**Problem**: Cache invalidation failures could cause stale data to be displayed.

**Solution**:
- Cache invalidation is non-critical (eventual consistency is acceptable)
- Implement retry logic: 3 attempts
- If all retries fail, log warning (not critical error)
- Cache will expire naturally after TTL (30 seconds)

## Testing Strategy

### Test 1: Duplicate WhatsApp Prevention
1. Create order with WhatsApp enabled
2. Simulate network timeout on frontend
3. Frontend retries order creation
4. Verify WhatsApp message sent ONLY ONCE

### Test 2: Table Status Guaranteed Update
1. Create order for table
2. Simulate database connection failure
3. Verify retry logic attempts 5 times
4. Verify table status eventually updates
5. Verify CRITICAL error logged if all retries fail

### Test 3: Consolidation Data Safety
1. Create order for table with existing pending order
2. Simulate consolidation failure
3. Verify new order is STILL created (no data loss)
4. Verify consolidation failure is logged

### Test 4: Background Task Monitoring
1. Create order with all background tasks enabled
2. Simulate various failure scenarios
3. Verify all failures are logged
4. Verify critical failures trigger alerts

## Monitoring Metrics

Add these metrics to track background task health:

- `background_task_failures_total` - Counter of all background task failures
- `whatsapp_duplicate_prevented_total` - Counter of duplicate WhatsApp messages prevented
- `table_update_retries_total` - Counter of table update retry attempts
- `consolidation_failures_total` - Counter of consolidation failures
- `background_task_duration_seconds` - Histogram of background task execution times

## Rollback Plan

If background tasks cause issues in production:

1. **Immediate**: Revert to synchronous operations (previous commit)
2. **Short-term**: Disable specific background tasks via feature flags
3. **Long-term**: Fix issues and re-enable gradually (WhatsApp → Cache → Consolidation → Table)

## Success Criteria

- Order creation completes in <1 second (95th percentile)
- Zero duplicate WhatsApp messages sent
- Table status updates succeed 99.9% of the time
- Zero data loss from consolidation failures
- All background task failures logged and alerted
