# Design Document: QR Order Workflow Fix

## Overview

This design addresses a critical workflow issue where orders are incorrectly removed from the active tab when marked as "paid" through the edit modal, even when actual completion has not been processed through the proper billing workflow. The fix implements a distinction between "paid" status and "completed" status, ensuring orders remain visible in the active tab until properly completed through the billing page.

The solution applies to all order types (QR orders, manual orders, etc.) and maintains consistency across the entire order management system.

## Architecture

The fix involves three main components:

1. **Active Tab Filtering Logic** - Change from filtering by "paid" status to filtering by "completed" status
2. **Edit Modal Payment Handling** - Prevent automatic order removal when payment status is changed
3. **Billing Page Completion Logic** - Ensure only the "Bill Pay" action marks orders as "completed"

### Current vs. Proposed Flow

**Current (Problematic) Flow:**
```
Order Created → Edit Modal (Mark as "Paid") → Order Removed from Active Tab → Lost from View
```

**Proposed (Fixed) Flow:**
```
Order Created → Edit Modal (Mark as "Paid") → Order Remains in Active Tab → Billing Page ("Bill Pay") → Order Marked as "Completed" → Order Removed from Active Tab
```

## Components and Interfaces

### 1. OrdersPage.js - Active Tab Filtering

**Current Implementation:**
```javascript
// Lines 2171, 2108, 678-682
orders.filter(order => !['completed', 'cancelled', 'paid'].includes(order.status))
```

**Proposed Change:**
```javascript
// Remove 'paid' from the filter - only filter by 'completed'
orders.filter(order => !['completed', 'cancelled'].includes(order.status))
```

**Key Changes:**
- Remove `'paid'` from the `completedStatuses` array in line 677
- Update active tab count calculation (line 2108)
- Update order display filtering (line 2171)
- Update empty state check (line 2162)

### 2. EditOrderModal.jsx - Payment Status Handling

**Current Implementation:**
```javascript
// Lines 257-260 - Already partially fixed
payment_received: useSplitPayment ? paidAmount : (order?.payment_received || 0),
```

**Analysis:**
The edit modal is already correctly implemented to not automatically set `payment_received = total`. The issue is in the filtering logic, not the edit modal itself.

**Required Verification:**
- Ensure edit modal never sets `status: 'completed'`
- Ensure edit modal preserves existing `payment_received` values
- Ensure edit modal allows payment method changes without triggering completion

### 3. BillingPage.js - Completion Logic

**Current Implementation:**
```javascript
// Lines 683, 772, 820 - Correct completion logic
status: shouldStayPending ? 'pending' : 'completed',
```

**Analysis:**
The billing page correctly sets `status: 'completed'` only when the "Bill Pay" action is executed. This logic is already correct and should remain unchanged.

**Key Verification Points:**
- Only `processPayment()` function should set `status: 'completed'`
- QR orders should stay 'pending' until kitchen marks as completed
- Credit orders should stay 'pending' until fully paid

## Data Models

### Order Status States

```javascript
// Current order statuses
const ORDER_STATUSES = {
  PENDING: 'pending',      // Order created, not yet processed
  PREPARING: 'preparing',  // Kitchen is preparing the order
  READY: 'ready',         // Order is ready for pickup/delivery
  COMPLETED: 'completed', // Order fully completed and paid
  CANCELLED: 'cancelled', // Order was cancelled
  PAID: 'paid'           // Order payment received but not completed
};
```

### Payment vs Completion States

```javascript
// Payment status (can be partial)
const PAYMENT_STATES = {
  UNPAID: { payment_received: 0, balance_amount: total },
  PARTIAL: { payment_received: partial, balance_amount: remaining },
  PAID: { payment_received: total, balance_amount: 0 }
};

// Completion status (binary)
const COMPLETION_STATES = {
  ACTIVE: 'pending|preparing|ready|paid', // Shows in active tab
  COMPLETED: 'completed|cancelled'        // Removed from active tab
};
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Active Tab Filtering Based on Completion Status
*For any* order of any type (QR, manual, etc.), the active tab should display the order if and only if its status is not "completed" or "cancelled", regardless of payment status
**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Bill Pay Action as Sole Completion Mechanism  
*For any* order of any type, the order should only be marked as "completed" and removed from the active tab when the Bill Pay action is successfully executed on the billing page
**Validates: Requirements 2.4, 4.1, 4.2**

### Property 3: Payment Status Independence from Completion
*For any* order of any type, marking the order as "paid" through any interface should not automatically mark it as "completed" or remove it from the active tab
**Validates: Requirements 4.3, 1.4**

### Property 4: Data Consistency Across Interfaces
*For any* order modifications made through the edit modal, the billing page should display consistent and current data without conflicts
**Validates: Requirements 3.1, 3.2, 3.4**

### Property 5: Payment Amount Accuracy and Persistence
*For any* payment amount updates, the system should accurately store, validate, and display the current payment amounts across all interfaces
**Validates: Requirements 5.1, 5.2, 5.4**

### Property 6: Billing Workflow Processing Consistency
*For any* order type, the billing page should process payment workflows consistently and update all related displays immediately upon completion
**Validates: Requirements 2.1, 2.2, 2.3, 4.4**

### Property 7: Edit Modal Workflow Isolation
*For any* changes made in the edit modal, the billing workflow functionality should remain unaffected and continue to work correctly
**Validates: Requirements 3.3, 5.3**

### Property 8: End-to-End Workflow Integrity
*For any* order type, the complete workflow from creation through edit modal modifications to billing completion should maintain proper state transitions and consistent behavior
**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

## Error Handling

### Edit Modal Error Scenarios
1. **Invalid Payment Status Changes** - Prevent setting invalid payment combinations
2. **Data Validation Failures** - Handle cases where order updates fail validation
3. **Network Failures** - Graceful handling of update failures with rollback

### Billing Page Error Scenarios  
1. **Payment Processing Failures** - Ensure failed payments don't mark orders as completed
2. **Concurrent Modification Conflicts** - Handle cases where order is modified during billing
3. **Incomplete Payment Data** - Validate payment amounts before processing completion

### Active Tab Display Errors
1. **Status Synchronization Issues** - Handle cases where order status is inconsistent
2. **Cache Invalidation Failures** - Ensure fresh data is displayed after status changes
3. **Filter Logic Errors** - Prevent orders from being incorrectly hidden or shown

## Testing Strategy

### Dual Testing Approach
This fix requires both unit testing and property-based testing to ensure comprehensive coverage:

**Unit Tests** focus on:
- Specific examples of the problematic workflow
- Edge cases like concurrent modifications
- Error conditions and failure scenarios
- Integration points between edit modal and billing page

**Property Tests** focus on:
- Universal properties that hold for all order types
- Comprehensive input coverage through randomization
- State transition correctness across different workflows
- Data consistency validation across interfaces

### Property-Based Testing Configuration
- **Testing Library**: Use Jest with fast-check for JavaScript property-based testing
- **Test Iterations**: Minimum 100 iterations per property test
- **Test Tagging**: Each property test must reference its design document property
- **Tag Format**: `// Feature: qr-order-workflow-fix, Property {number}: {property_text}`

### Key Test Scenarios

**Unit Test Examples:**
1. Mark QR order as "paid" in edit modal → Verify order remains in active tab
2. Complete payment via billing page → Verify order is marked "completed" and removed
3. Partial payment scenario → Verify order stays active until full completion
4. Concurrent edit modal and billing page modifications → Verify data consistency

**Property Test Examples:**
1. Generate random orders with various statuses → Verify active tab filtering is correct
2. Generate random payment amounts → Verify billing page displays accurate amounts
3. Generate random order modifications → Verify edit modal doesn't break billing workflow
4. Generate random completion scenarios → Verify only Bill Pay marks orders as completed

### Integration Testing
- Test complete workflow from order creation to completion
- Verify cross-component communication works correctly
- Test real-time updates and cache invalidation
- Validate user interface consistency across all screens

### Performance Testing
- Ensure filtering changes don't impact page load times
- Verify real-time updates don't cause UI lag
- Test with large numbers of orders to ensure scalability
- Monitor memory usage during status transitions