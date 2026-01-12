# Implementation Plan: Billing and Table Sync Fixes

## Overview

This implementation plan addresses critical synchronization issues between the billing page and tables page. The fixes ensure correct payment recording, table status updates, and data consistency.

## Tasks

- [x] 1. Fix Payment Recording in BillingPage
  - [x] 1.1 Update processPayment function to always set payment_received explicitly
    - Ensure payment_received is set to total when no explicit amount is entered
    - Ensure balance_amount is calculated as max(0, total - received)
    - Ensure is_credit is set to (balance > 0)
    - _Requirements: 2.1, 2.2, 2.4, 2.5_
  - [x] 1.2 Write property test for payment state consistency
    - **Property 1: Payment State Consistency**
    - **Validates: Requirements 2.1, 2.2, 2.4, 2.5**

- [x] 2. Fix Table Release in BillingPage
  - [x] 2.1 Update releaseTable function with proper error handling
    - Add try-catch with user-facing error message
    - Return success/failure status
    - Log success/failure for debugging
    - _Requirements: 1.1, 1.3_
  - [x] 2.2 Update processPayment to handle releaseTable failure
    - Show warning if table release fails but payment succeeded
    - _Requirements: 4.4_

- [x] 3. Fix Backend Order Update Logic
  - [x] 3.1 Update order update endpoint to correctly handle full payments
    - Ensure balance_amount is set to 0 when payment_received >= total
    - Ensure is_credit is set to false for full payments
    - Ensure status is set to "completed" for full payments
    - _Requirements: 2.2, 2.4, 2.5, 4.3_
  - [x] 3.2 Write property test for completed order invariant
    - **Property 3: Completed Order Invariant**
    - **Validates: Requirements 2.3, 4.3**

- [x] 4. Fix Backend Table Cache Invalidation
  - [x] 4.1 Add cache invalidation to table update endpoint
    - Call invalidate_table_caches after table status update
    - Log cache invalidation success/failure
    - _Requirements: 1.5, 4.1_
  - [x] 4.2 Write property test for table status persistence
    - **Property 2: Table Status Persistence**
    - **Validates: Requirements 1.1, 1.4, 1.5, 4.1, 4.2**

- [x] 5. Fix TablesPage Data Refresh
  - [x] 5.1 Update fetchTables to support force refresh
    - Add cache-busting parameter option
    - Force refresh on component mount
    - _Requirements: 1.4, 4.2_

- [x] 6. Fix Balance Display in BillingPage UI
  - [x] 6.1 Update payment completion display logic
    - Only show "Balance Due" when balance_amount > 0
    - Show "PAID" status when payment is complete
    - _Requirements: 2.3_

- [x] 7. Checkpoint - Verify all fixes work together
  - Test full payment flow: create order → process payment → verify table released
  - Test that Tables page shows correct status after payment
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Each task references specific requirements for traceability
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
