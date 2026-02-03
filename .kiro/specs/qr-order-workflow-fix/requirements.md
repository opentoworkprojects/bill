# Requirements Document

## Introduction

This specification addresses a critical workflow issue in the order payment system where orders are incorrectly removed from the active tab when marked as "paid" through the edit modal, even when actual completion has not been processed through the proper billing workflow. This affects all order types including QR orders, manual orders, and any other order types in the system.

## Glossary

- **Order_System**: The complete order management system handling all order types (QR orders, manual orders, etc.)
- **All_Order_Types**: Includes QR orders, manual orders, and any other order types processed by the system
- **Edit_Modal**: The modal interface allowing order status modifications
- **Billing_Page**: The dedicated page for processing payments and bill completion
- **Active_Tab**: The display area showing orders that are currently active/unpaid
- **Bill_Pay_Action**: The specific action on the billing page that completes payment processing
- **Order_State**: The current status including both payment and completion information of an order
- **Completed_Status**: A distinct status indicating an order has been fully processed and should be removed from active display
- **Paid_Status**: A status indicating payment has been received but order may still need completion processing

## Requirements

### Requirement 1: Active Tab Filtering Logic

**User Story:** As a restaurant staff member, I want the active tab to filter all order types based on completion status rather than payment status, so that paid orders remain visible until properly completed through the billing workflow.

#### Acceptance Criteria

1. THE Order_System SHALL filter the active tab based on "completed" status rather than "paid" status for all order types
2. WHEN a user marks any order (QR, manual, or other types) as "paid" through the edit modal, THE Order_System SHALL keep the order visible in the active tab until it is marked as "completed"
3. WHEN an order of any type is paid but not completed, THE Order_System SHALL ensure the order appears in both active tab and today's orders
4. THE Order_System SHALL apply consistent completion logic across all order types (QR orders, manual orders, etc.)

### Requirement 2: Billing Page Payment Processing

**User Story:** As a restaurant staff member, I want the billing page to show accurate received amounts and handle payment completion properly for all order types, so that I can process payments correctly regardless of how the order was created.

#### Acceptance Criteria

1. WHEN the billing page loads for any order type, THE Order_System SHALL display the current received amount accurately
2. WHEN a user updates payment amounts on billing page for any order, THE Order_System SHALL reflect changes immediately in the interface
3. WHEN the "Bill Pay" action is triggered for any order type, THE Order_System SHALL process the complete payment workflow consistently
4. THE Order_System SHALL only remove orders from active tab when Bill_Pay_Action is successfully completed, regardless of order type

### Requirement 3: Order State Consistency

**User Story:** As a restaurant staff member, I want order state to remain consistent between edit modal and billing workflow for all order types, so that there are no conflicts or data inconsistencies.

#### Acceptance Criteria

1. WHEN order data is modified in edit modal for any order type, THE Order_System SHALL maintain consistency with billing page data
2. WHEN billing page processes payments for any order type, THE Order_System SHALL update order state without conflicts from edit modal changes
3. THE Order_System SHALL ensure payment status changes from edit modal do not interfere with billing workflow logic for any order type
4. WHEN an order of any type transitions between different workflow stages, THE Order_System SHALL maintain data integrity across all interfaces

### Requirement 4: Order Completion Logic

**User Story:** As a restaurant staff member, I want orders of all types to be marked as "completed" and removed from active status only through the proper billing completion process, so that the workflow remains predictable and reliable.

#### Acceptance Criteria

1. THE Order_System SHALL only mark orders as "completed" and remove them from active tab through Bill_Pay_Action completion, regardless of order type
2. WHEN Bill_Pay_Action is executed successfully for any order type, THE Order_System SHALL mark the order as "completed" and remove it from active display
3. THE Order_System SHALL allow orders of any type to be "paid" without being "completed" to maintain visibility in active tab
4. WHEN order completion occurs for any order type, THE Order_System SHALL update all related displays and caches immediately

### Requirement 5: Payment Amount Tracking

**User Story:** As a restaurant staff member, I want the system to accurately track and display payment amounts received, so that I can complete billing with correct information.

#### Acceptance Criteria

1. WHEN payment amounts are recorded, THE Order_System SHALL store them accurately in the order record
2. WHEN the billing page displays payment information, THE Order_System SHALL show the most current received amounts
3. THE Order_System SHALL allow users to update payment amounts on the billing page as needed
4. WHEN payment amounts are modified, THE Order_System SHALL validate and persist changes immediately

### Requirement 6: Workflow Integration Testing

**User Story:** As a system administrator, I want comprehensive testing of the complete payment workflow for all order types, so that the fix addresses all edge cases and integration points across QR orders, manual orders, and other order types.

#### Acceptance Criteria

1. THE Order_System SHALL handle the complete flow from order creation through edit modal modifications to billing completion for all order types
2. WHEN testing the workflow, THE Order_System SHALL demonstrate proper order state transitions at each step for QR orders, manual orders, and other order types
3. THE Order_System SHALL validate that edit modal changes do not break billing page functionality for any order type
4. WHEN edge cases are tested, THE Order_System SHALL maintain consistent behavior across all order types and scenarios