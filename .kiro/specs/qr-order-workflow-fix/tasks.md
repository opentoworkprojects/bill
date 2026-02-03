# Implementation Plan: QR Order Workflow Fix

## Overview

This implementation plan fixes the critical workflow issue where orders are incorrectly removed from the active tab when marked as "paid" through the edit modal. The fix changes the active tab filtering logic to use "completed" status instead of "paid" status, ensuring orders remain visible until properly completed through the billing workflow.

## Tasks

- [x] 1. Update OrdersPage.js active tab filtering logic
  - [x] 1.1 Remove 'paid' status from completedStatuses array
    - Update the completedStatuses array in line 677 to exclude 'paid'
    - Change from `['completed', 'cancelled', 'paid', 'billed', 'settled']` to `['completed', 'cancelled', 'billed', 'settled']`
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x]* 1.2 Write property test for active tab filtering
    - **Property 1: Active Tab Filtering Based on Completion Status**
    - **Validates: Requirements 1.1, 1.2, 1.3**
  
  - [x] 1.3 Update active tab count calculation
    - Modify line 2108 to exclude only completed/cancelled orders from count
    - Update filter to `orders.filter(o => !['completed', 'cancelled'].includes(o.status)).length`
    - _Requirements: 1.1_
  
  - [x] 1.4 Update order display filtering in active tab
    - Modify line 2171 to show paid orders in active tab
    - Change filter from `!['completed', 'cancelled', 'paid'].includes(order.status)` to `!['completed', 'cancelled'].includes(order.status)`
    - _Requirements: 1.2, 1.3_
  
  - [x] 1.5 Update empty state check for active orders
    - Modify line 2162 empty state condition to exclude only completed/cancelled orders
    - Update filter to match the display filtering logic
    - _Requirements: 1.1_

- [x] 2. Verify EditOrderModal.jsx payment handling
  - [x] 2.1 Confirm edit modal doesn't set status to 'completed'
    - Review handleUpdateOrder function to ensure it never sets status: 'completed'
    - Verify payment status changes don't trigger order completion
    - _Requirements: 4.3, 3.3_
  
  - [x]* 2.2 Write property test for edit modal payment independence
    - **Property 3: Payment Status Independence from Completion**
    - **Validates: Requirements 4.3, 1.4**
  
  - [x] 2.3 Verify payment_received handling preserves existing values
    - Confirm line 259 correctly preserves existing payment_received when not using split payment
    - Ensure edit modal doesn't automatically set payment_received = total
    - _Requirements: 3.1, 5.1_
  
  - [x]* 2.4 Write unit tests for edit modal payment scenarios
    - Test marking order as paid doesn't remove from active tab
    - Test payment method changes don't trigger completion
    - _Requirements: 4.3, 3.3_

- [x] 3. Verify BillingPage.js completion logic
  - [x] 3.1 Confirm Bill Pay action sets status to 'completed'
    - Review processPayment function to ensure it correctly sets status: 'completed'
    - Verify only successful Bill Pay action triggers completion
    - _Requirements: 4.1, 4.2_
  
  - [x]* 3.2 Write property test for Bill Pay completion mechanism
    - **Property 2: Bill Pay Action as Sole Completion Mechanism**
    - **Validates: Requirements 2.4, 4.1, 4.2**
  
  - [x] 3.3 Verify payment amount display accuracy
    - Confirm billing page shows current payment_received amounts correctly
    - Test payment amount updates reflect immediately in interface
    - _Requirements: 2.1, 2.2, 5.2_
  
  - [x]* 3.4 Write property test for payment amount accuracy
    - **Property 5: Payment Amount Accuracy and Persistence**
    - **Validates: Requirements 5.1, 5.2, 5.4**

- [x] 4. Test data consistency across interfaces
  - [x] 4.1 Verify edit modal and billing page data consistency
    - Test that edit modal changes are reflected correctly in billing page
    - Ensure no data conflicts between interfaces
    - _Requirements: 3.1, 3.2, 3.4_
  
  - [x]* 4.2 Write property test for data consistency
    - **Property 4: Data Consistency Across Interfaces**
    - **Validates: Requirements 3.1, 3.2, 3.4**
  
  - [x] 4.3 Test concurrent modification scenarios
    - Test edit modal changes while billing page is open
    - Verify billing workflow remains unaffected by edit modal changes
    - _Requirements: 3.2, 3.3_
  
  - [x]* 4.4 Write unit tests for concurrent modifications
    - Test simultaneous edit modal and billing page updates
    - Test data integrity during concurrent operations
    - _Requirements: 3.2, 3.3_

- [x] 5. Checkpoint - Verify core functionality
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Test complete workflow integration
  - [x] 6.1 Test end-to-end workflow for QR orders
    - Create QR order → Mark as paid in edit modal → Verify stays in active tab → Complete via billing → Verify removal
    - _Requirements: 6.1, 6.2_
  
  - [x] 6.2 Test end-to-end workflow for manual orders
    - Create manual order → Mark as paid in edit modal → Verify stays in active tab → Complete via billing → Verify removal
    - _Requirements: 6.1, 6.2_
  
  - [x]* 6.3 Write property test for workflow integration
    - **Property 8: End-to-End Workflow Integrity**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
  
  - [x] 6.4 Test edge cases and error scenarios
    - Test partial payments, network failures, concurrent modifications
    - Verify consistent behavior across all order types
    - _Requirements: 6.4_
  
  - [x]* 6.5 Write unit tests for edge cases
    - Test partial payment scenarios
    - Test error handling and recovery
    - _Requirements: 6.4_

- [x] 7. Performance and UI verification
  - [x] 7.1 Verify filtering performance with large order sets
    - Test active tab performance with 100+ orders
    - Ensure filtering changes don't impact load times
    - _Requirements: 1.1_
  
  - [x] 7.2 Test real-time updates and cache invalidation
    - Verify orders move correctly between active and completed states
    - Test immediate UI updates after status changes
    - _Requirements: 4.4, 2.3_
  
  - [x]* 7.3 Write property test for billing workflow consistency
    - **Property 6: Billing Workflow Processing Consistency**
    - **Validates: Requirements 2.1, 2.2, 2.3, 4.4**

- [x] 8. Final integration testing and validation
  - [x] 8.1 Test all order types with new filtering logic
    - Verify QR orders, manual orders, and other types all follow same completion rules
    - Test consistency across different order creation methods
    - _Requirements: 1.4, 4.1_
  
  - [x]* 8.2 Write property test for edit modal workflow isolation
    - **Property 7: Edit Modal Workflow Isolation**
    - **Validates: Requirements 3.3, 5.3**
  
  - [x] 8.3 Validate user interface consistency
    - Ensure all screens show consistent order status information
    - Test navigation between active orders and billing pages
    - _Requirements: 3.4, 4.4_
  
  - [x] 8.4 Final checkpoint - Complete system verification
    - Run all tests to ensure no regressions
    - Verify the original problem is completely resolved
    - _Requirements: All requirements_

- [x] 9. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties with minimum 100 iterations
- Unit tests validate specific examples and edge cases
- The fix primarily involves changing filtering logic in OrdersPage.js
- Edit modal and billing page logic are mostly correct and need verification rather than changes
- Focus on ensuring paid orders remain visible until properly completed through billing workflow
- Test run: `npm test -- --runTestsByPath src/utils/__tests__/orderWorkflowRules.property.test.js --runInBand --watchAll=false` (PASS)
