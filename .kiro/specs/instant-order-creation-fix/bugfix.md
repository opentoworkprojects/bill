# Bugfix Requirements Document

## Introduction

Order creation in the restaurant management system currently takes 2-4 seconds due to multiple synchronous backend operations (subscription validation, duplicate checks, order consolidation, table updates, WhatsApp notifications, cache invalidation). This causes unacceptable delays in high-traffic restaurant operations where staff need instant feedback to process the next order. The system should complete order creation in under 1 second, matching the performance of counter-style sales.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a waiter submits an order via `handleSubmitOrder()` THEN the system closes the menu immediately but waits 2-4 seconds for the server response before displaying the order in the UI

1.2 WHEN the backend processes order creation via `POST /orders` THEN the system performs subscription validation, duplicate order checks (scanning last 30 seconds), order consolidation logic (scanning last 2 hours), table status updates, WhatsApp notifications, and cache invalidation synchronously before responding

1.3 WHEN order creation takes 2-4 seconds THEN restaurant staff cannot start cooking or billing the next order, causing operational bottlenecks during peak hours

1.4 WHEN the backend runs on Render free tier (512MB RAM) THEN multiple synchronous database queries and external API calls cause memory pressure and slow response times

1.5 WHEN 100+ concurrent restaurants create orders simultaneously THEN the synchronous processing model creates cascading delays across all tenants

### Expected Behavior (Correct)

2.1 WHEN a waiter submits an order via `handleSubmitOrder()` THEN the system SHALL complete the entire operation (backend processing + UI update) in under 1 second

2.2 WHEN the backend processes order creation via `POST /orders` THEN the system SHALL perform only critical synchronous operations (order creation, basic validation) and defer non-critical operations (WhatsApp notifications, cache invalidation, consolidation checks) to background tasks

2.3 WHEN order creation completes in under 1 second THEN restaurant staff SHALL be able to immediately start cooking or billing the next order without waiting

2.4 WHEN the backend runs on Render free tier (512MB RAM) THEN the system SHALL minimize memory usage by processing non-critical operations asynchronously

2.5 WHEN 100+ concurrent restaurants create orders simultaneously THEN the system SHALL maintain sub-1-second response times by isolating tenant operations and using async processing

### Unchanged Behavior (Regression Prevention)

3.1 WHEN subscription validation fails (trial expired or bill limit reached) THEN the system SHALL CONTINUE TO reject order creation with a 402 status code and appropriate error message

3.2 WHEN duplicate orders are detected (same table, same items within 10 seconds) THEN the system SHALL CONTINUE TO prevent duplicate order creation and return the existing order

3.3 WHEN order consolidation is needed (existing pending order on same table) THEN the system SHALL CONTINUE TO merge items into the existing order instead of creating a new order

3.4 WHEN table status needs updating (KOT mode enabled) THEN the system SHALL CONTINUE TO mark the table as occupied with the current order ID

3.5 WHEN WhatsApp notifications are enabled THEN the system SHALL CONTINUE TO send order notifications to customers (but asynchronously)

3.6 WHEN cache invalidation is needed THEN the system SHALL CONTINUE TO invalidate Redis caches for active orders (but asynchronously)

3.7 WHEN quick billing mode is used THEN the system SHALL CONTINUE TO use the fast path that skips duplicate/consolidation checks

3.8 WHEN order creation fails due to network timeout THEN the system SHALL CONTINUE TO perform background verification to check if the order was created

3.9 WHEN the frontend displays orders THEN the system SHALL CONTINUE TO show orders in real-time via polling and deduplicate any duplicates

3.10 WHEN bill count increments THEN the system SHALL CONTINUE TO track the count for subscription limit enforcement

3.11 WHEN order creation is retried due to network timeout THEN the system SHALL CONTINUE TO prevent duplicate WhatsApp messages (send ONLY ONCE per order)

3.12 WHEN background tasks fail THEN the system SHALL CONTINUE TO log errors to monitoring system and alert on critical failures (table updates, consolidation)

3.13 WHEN table status update fails THEN the system SHALL CONTINUE TO retry aggressively (5 attempts) and log CRITICAL error if all retries fail

3.14 WHEN order consolidation fails THEN the system SHALL CONTINUE TO create the new order (no data loss) and log the consolidation failure for manual review

3.15 WHEN backend operations fail THEN the frontend SHALL NEVER show error messages to users (silent error handling with automatic recovery)

3.16 WHEN order creation succeeds on backend but frontend times out THEN the frontend SHALL show the order immediately via background polling (no error shown to user)

3.17 WHEN background tasks fail on backend THEN the frontend SHALL remain completely unaffected (no error propagation to frontend)

3.18 WHEN network is slow or unstable THEN the frontend SHALL show loading states instead of errors (graceful degradation)

3.19 WHEN WhatsApp message is successfully sent THEN the frontend SHALL show a success toast notification "📱 WhatsApp message sent!" to confirm delivery

3.20 WHEN WhatsApp message fails to send THEN the frontend SHALL NOT show any error (silent failure, logged for monitoring)
