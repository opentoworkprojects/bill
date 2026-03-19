# Requirements Document

## Introduction

The fast order creation optimization feature eliminates blocking operations that cause 2-4 second delays in order creation. The current system blocks on subscription validation (~10ms) and duplicate checks (~50ms) at the start of the endpoint, preventing instant order creation. This optimization moves these checks to background tasks or middleware, allowing orders to be created immediately with just the database insert (~100ms), while maintaining data consistency and preventing duplicates through graceful background validation.

## Glossary

- **Order_Endpoint**: The FastAPI endpoint `/orders` that handles order creation requests
- **Subscription_Validator**: Component that checks if restaurant subscription is active and within bill limits
- **Duplicate_Checker**: Component that queries recent orders to prevent duplicate submissions
- **Database_Insert**: MongoDB operation that persists the order document
- **Background_Task**: Asynchronous operation that executes after response is sent to client
- **Validation_Failure**: Condition where subscription or duplicate check fails after order creation
- **Order_Marker**: Database field indicating validation status (pending_validation, validated, validation_failed)
- **Response_Time**: Time from request received to response sent to client
- **Critical_Path**: Operations that block the response from being sent
- **WhatsApp_Notifier**: Background service that sends order notifications via WhatsApp API
- **Cache_Invalidator**: Background service that clears cached order data
- **Table_Status_Updater**: Background service that marks tables as occupied
- **Order_Consolidator**: Background service that merges orders for the same table

## Requirements

### Requirement 1: Instant Order Creation Response

**User Story:** As a restaurant staff member, I want order creation to complete in under 1 second, so that I can start cooking and billing immediately without waiting.

#### Acceptance Criteria

1. WHEN an order creation request is received, THE Order_Endpoint SHALL respond within 1000ms
2. WHEN quick billing is used, THE Order_Endpoint SHALL respond within 500ms
3. WHEN the database insert completes, THE Order_Endpoint SHALL send the response immediately without waiting for validation
4. WHEN 100 concurrent orders are submitted, THE Order_Endpoint SHALL maintain sub-1-second response times for all requests
5. THE Order_Endpoint SHALL include only the database insert operation in the Critical_Path

### Requirement 2: Background Subscription Validation

**User Story:** As a system administrator, I want subscription validation to happen in the background, so that valid orders are not delayed by validation checks.

#### Acceptance Criteria

1. WHEN an order is created, THE Subscription_Validator SHALL execute as a Background_Task after the response is sent
2. WHEN subscription validation completes successfully, THE Subscription_Validator SHALL update the Order_Marker to "validated"
3. IF subscription validation fails, THEN THE Subscription_Validator SHALL update the Order_Marker to "validation_failed" and log the failure
4. WHEN subscription is expired or bill limit is reached, THE Subscription_Validator SHALL mark the order but NOT delete it
5. THE Subscription_Validator SHALL complete validation within 5 seconds of order creation

### Requirement 3: Background Duplicate Detection

**User Story:** As a restaurant manager, I want duplicate orders to be prevented without blocking order creation, so that the system remains fast while maintaining data consistency.

#### Acceptance Criteria

1. WHEN an order is created, THE Duplicate_Checker SHALL execute as a Background_Task after the response is sent
2. WHEN a duplicate is detected, THE Duplicate_Checker SHALL mark the newer order with "duplicate_detected" flag
3. WHEN duplicate detection completes, THE Duplicate_Checker SHALL update the Order_Marker field within 3 seconds
4. IF a duplicate is found, THEN THE Duplicate_Checker SHALL log the duplicate order IDs for manual review
5. THE Duplicate_Checker SHALL query orders from the last 10 seconds on the same table with the same items

### Requirement 4: Graceful Validation Failure Handling

**User Story:** As a restaurant owner, I want validation failures to be handled gracefully without losing orders, so that no customer orders are lost due to technical issues.

#### Acceptance Criteria

1. WHEN a Validation_Failure occurs, THE Order_Endpoint SHALL preserve the order in the database
2. WHEN subscription validation fails, THE Order_Endpoint SHALL send an alert notification to administrators
3. WHEN duplicate detection fails, THE Order_Endpoint SHALL log the error and continue processing
4. WHEN validation completes, THE Order_Endpoint SHALL emit events for frontend updates
5. THE Order_Endpoint SHALL never delete orders due to validation failures

### Requirement 5: Database Insert Optimization

**User Story:** As a developer, I want database inserts to be as fast as possible, so that the critical path is minimized.

#### Acceptance Criteria

1. WHEN an order is inserted, THE Database_Insert SHALL complete within 100ms
2. WHEN database indexes exist on organization_id, table_id, and created_at, THE Database_Insert SHALL use them for optimal performance
3. WHEN concurrent inserts occur, THE Database_Insert SHALL handle them without lock contention
4. WHEN the insert completes, THE Database_Insert SHALL return the order ID immediately
5. THE Database_Insert SHALL be the only blocking operation in the Critical_Path

### Requirement 6: Background Task Reliability

**User Story:** As a system administrator, I want background tasks to complete reliably, so that validation and notifications always happen even if they're not blocking.

#### Acceptance Criteria

1. WHEN a Background_Task is created, THE Order_Endpoint SHALL ensure it executes even if the client disconnects
2. WHEN a Background_Task fails, THE Order_Endpoint SHALL retry it up to 3 times with exponential backoff
3. WHEN all retries fail, THE Order_Endpoint SHALL log the failure with full context for debugging
4. WHEN Background_Tasks complete, THE Order_Endpoint SHALL update order status atomically
5. THE Order_Endpoint SHALL monitor Background_Task completion rates and alert on failures

### Requirement 7: WhatsApp Notification Background Processing

**User Story:** As a restaurant owner, I want WhatsApp notifications to be sent without delaying order creation, so that customers receive notifications while orders are created instantly.

#### Acceptance Criteria

1. WHEN WhatsApp is enabled, THE WhatsApp_Notifier SHALL execute as a Background_Task
2. WHEN WhatsApp notification is sent, THE WhatsApp_Notifier SHALL update the order with "whatsapp_notification_sent" flag
3. WHEN WhatsApp API call fails, THE WhatsApp_Notifier SHALL retry up to 3 times with exponential backoff
4. WHEN WhatsApp notification completes, THE WhatsApp_Notifier SHALL return status to frontend via order response field
5. THE WhatsApp_Notifier SHALL prevent duplicate messages by checking the "whatsapp_notification_sent" flag before sending

### Requirement 8: Cache Invalidation Background Processing

**User Story:** As a developer, I want cache invalidation to happen in the background, so that it doesn't block order creation.

#### Acceptance Criteria

1. WHEN an order is created, THE Cache_Invalidator SHALL execute as a Background_Task
2. WHEN cache invalidation completes, THE Cache_Invalidator SHALL log success within 2 seconds
3. WHEN cache invalidation fails, THE Cache_Invalidator SHALL retry once and log failure if unsuccessful
4. WHEN Redis is unavailable, THE Cache_Invalidator SHALL fail gracefully without affecting order creation
5. THE Cache_Invalidator SHALL invalidate caches for active orders, today's bills, and table status

### Requirement 9: Table Status Update Background Processing

**User Story:** As a restaurant manager, I want table status updates to happen reliably without blocking order creation, so that tables are marked as occupied while orders are created instantly.

#### Acceptance Criteria

1. WHEN KOT mode is enabled, THE Table_Status_Updater SHALL execute as a Background_Task
2. WHEN table status update completes, THE Table_Status_Updater SHALL mark the table as occupied within 1 second
3. WHEN table status update fails, THE Table_Status_Updater SHALL retry up to 5 times with exponential backoff
4. IF all retries fail, THEN THE Table_Status_Updater SHALL log a CRITICAL error with alert
5. THE Table_Status_Updater SHALL use atomic database updates to prevent race conditions

### Requirement 10: Order Consolidation Background Processing

**User Story:** As a restaurant staff member, I want order consolidation to happen in the background, so that orders are merged correctly without delaying order creation.

#### Acceptance Criteria

1. WHEN an existing pending order exists on the same table, THE Order_Consolidator SHALL execute as a Background_Task
2. WHEN consolidation completes, THE Order_Consolidator SHALL merge items and update totals within 2 seconds
3. WHEN consolidation fails, THE Order_Consolidator SHALL retry up to 3 times with exponential backoff
4. IF consolidation fails after all retries, THEN THE Order_Consolidator SHALL preserve both orders and log the error
5. THE Order_Consolidator SHALL never lose order data due to consolidation failures

### Requirement 11: Frontend Error Prevention

**User Story:** As a restaurant staff member, I want the frontend to never show errors during order creation, so that I can work without interruptions or confusion.

#### Acceptance Criteria

1. WHEN order creation times out, THE Order_Endpoint SHALL verify order creation in the background after 2 seconds
2. WHEN network failures occur, THE Order_Endpoint SHALL handle them silently and use cached data
3. WHEN backend errors occur, THE Order_Endpoint SHALL log them without showing error messages to users
4. WHEN orders are created, THE Order_Endpoint SHALL use optimistic UI updates to show orders immediately
5. THE Order_Endpoint SHALL never throw errors that reach user-facing components

### Requirement 12: Optimistic UI Updates

**User Story:** As a restaurant staff member, I want orders to appear in the UI immediately when I submit them, so that I can continue working without waiting for server confirmation.

#### Acceptance Criteria

1. WHEN an order is submitted, THE Order_Endpoint SHALL add an optimistic order to the UI immediately
2. WHEN the backend responds, THE Order_Endpoint SHALL replace the optimistic order with the real order
3. WHEN the backend times out, THE Order_Endpoint SHALL keep the optimistic order and verify in the background
4. WHEN verification completes, THE Order_Endpoint SHALL update the UI silently without showing errors
5. THE Order_Endpoint SHALL deduplicate orders by ID to prevent showing the same order twice

### Requirement 13: WhatsApp Success Notification

**User Story:** As a restaurant staff member, I want to see confirmation when WhatsApp messages are sent, so that I know customers have been notified.

#### Acceptance Criteria

1. WHEN WhatsApp notification succeeds, THE Order_Endpoint SHALL include "whatsapp_sent: true" in the order response
2. WHEN the frontend receives "whatsapp_sent: true", THE Order_Endpoint SHALL show a success toast message
3. WHEN WhatsApp notification fails, THE Order_Endpoint SHALL include "whatsapp_error" in the response but NOT show an error to the user
4. WHEN WhatsApp success toast is shown, THE Order_Endpoint SHALL show it only once per order
5. THE Order_Endpoint SHALL track which orders have shown WhatsApp notifications to prevent duplicates

### Requirement 14: Data Consistency Guarantees

**User Story:** As a system administrator, I want data consistency to be maintained even with background validation, so that no duplicate orders or invalid subscriptions go undetected.

#### Acceptance Criteria

1. WHEN background validation completes, THE Order_Endpoint SHALL update order status atomically
2. WHEN duplicate orders are detected, THE Order_Endpoint SHALL mark them clearly for manual review
3. WHEN subscription validation fails, THE Order_Endpoint SHALL alert administrators immediately
4. WHEN validation status changes, THE Order_Endpoint SHALL emit events for real-time frontend updates
5. THE Order_Endpoint SHALL maintain audit logs of all validation results for compliance

### Requirement 15: Performance Monitoring

**User Story:** As a system administrator, I want to monitor order creation performance, so that I can ensure the optimization is working correctly.

#### Acceptance Criteria

1. THE Order_Endpoint SHALL log Response_Time for every order creation request
2. THE Order_Endpoint SHALL track Background_Task completion times and success rates
3. THE Order_Endpoint SHALL alert when Response_Time exceeds 1000ms for normal orders or 500ms for quick billing
4. THE Order_Endpoint SHALL provide metrics on validation failure rates and duplicate detection rates
5. THE Order_Endpoint SHALL generate performance reports showing p50, p95, and p99 response times
