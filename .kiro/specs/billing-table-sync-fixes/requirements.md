# Requirements Document

## Introduction

This document specifies requirements for fixing critical synchronization issues between the billing page and tables page. The current implementation has three main issues:
1. Table occupancy status doesn't update after bill completion - even after page refresh, tables remain shown as "occupied"
2. Balance due still displays after full payment is processed - showing "overdue" status despite full cash payment
3. Menu loading delays when starting new orders

Root cause analysis indicates:
- The frontend `releaseTable` function may fail silently or the backend table update isn't persisting correctly
- The `payment_received` field may not be set correctly when user doesn't explicitly enter an amount (defaults to full payment)
- Cache invalidation may not be triggering properly for table status updates

## Glossary

- **Billing_Page**: The frontend component that handles payment processing and order completion
- **Tables_Page**: The frontend component that displays table occupancy status and management
- **Table_Status**: The current state of a table (available, occupied, reserved, maintenance, cleaning)
- **Balance_Due**: The remaining amount to be paid after a partial payment
- **Payment_Completion**: The state when a payment has been fully processed
- **Cache_Invalidation**: The process of clearing cached data to force fresh data retrieval
- **Order_Status**: The state of an order (pending, preparing, ready, completed)

## Requirements

### Requirement 1: Table Status Update After Payment Completion

**User Story:** As a restaurant staff member, I want the table status to update correctly after completing a bill, so that I can see accurate table availability.

#### Acceptance Criteria

1. WHEN a payment is completed on the Billing_Page, THE Backend SHALL update the table status to "available" in the database
2. WHEN the releaseTable function executes, THE System SHALL log success or failure for debugging
3. IF the table status update fails, THEN THE System SHALL display an error message to the user
4. WHEN the Tables_Page loads or refreshes, THE System SHALL fetch table data directly from the database (bypassing cache if stale)
5. THE Backend SHALL invalidate table cache after any table status change

### Requirement 2: Correct Payment Recording and Balance Display

**User Story:** As a cashier, I want the billing page to correctly record full payments and show zero balance, so that I have accurate payment confirmation.

#### Acceptance Criteria

1. WHEN a full payment is processed without explicit amount entry, THE System SHALL set payment_received equal to the total amount
2. WHEN payment_received equals or exceeds total, THE System SHALL set balance_amount to 0 and is_credit to false
3. WHEN the order status is "completed" with zero balance, THE System SHALL NOT display "Balance Due" or "overdue" status
4. THE Backend SHALL correctly calculate and store balance_amount as (total - payment_received)
5. WHEN updating an order with full payment, THE Backend SHALL ensure is_credit is set to false

### Requirement 3: Optimized Menu Loading for New Orders

**User Story:** As a staff member, I want the menu to load quickly when starting a new order, so that I can serve customers efficiently.

#### Acceptance Criteria

1. WHEN the Billing_Page loads, THE System SHALL fetch menu items efficiently
2. IF the menu fetch fails, THEN THE System SHALL display a user-friendly error message and provide a retry option
3. THE System SHALL handle authentication errors gracefully during menu fetch

### Requirement 4: Data Consistency Between Frontend and Backend

**User Story:** As a restaurant manager, I want all pages to show consistent and accurate data, so that staff can make correct decisions.

#### Acceptance Criteria

1. WHEN a table status changes via the Billing_Page, THE Backend SHALL persist the change to the database
2. WHEN the Tables_Page fetches data, THE System SHALL return the current database state
3. WHEN an order is marked as completed with full payment, THE Order record SHALL have status="completed", is_credit=false, and balance_amount=0
4. THE System SHALL ensure the frontend releaseTable call and backend order update both succeed before showing success message
