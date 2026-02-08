# Requirements Document

## Introduction

The Counter Sale (Quick Sale) feature provides a streamlined, single-screen interface for fast counter/takeaway order processing in restaurant POS systems. Unlike the table-based billing flow, this feature eliminates table assignment and focuses on speed, enabling staff to select items, process payments, and print receipts instantly with minimal clicks.

## Glossary

- **Counter_Sale_System**: The single-screen interface for processing counter/takeaway orders
- **Menu_Search**: Real-time search functionality for finding menu items quickly
- **Quick_Payment**: Instant payment processing without table assignment
- **Thermal_Printer**: Receipt printer using thermal printing technology
- **Split_Payment**: Payment divided across multiple payment methods
- **Order_Total**: Final amount including items, tax, and discounts
- **Receipt_Generator**: Component that creates printable receipt content
- **Payment_Method**: Cash, Card, UPI, or Credit payment options
- **Business_Settings**: Restaurant configuration including tax rates and print settings

## Requirements

### Requirement 1: Single-Screen Order Interface

**User Story:** As a cashier, I want to select menu items and process payment on one screen, so that I can complete counter sales quickly without navigation delays.

#### Acceptance Criteria

1. THE Counter_Sale_System SHALL display menu search, selected items, and payment options on a single screen
2. WHEN a menu item is selected, THE Counter_Sale_System SHALL add it to the order immediately without page refresh
3. WHEN the order total changes, THE Counter_Sale_System SHALL update all calculated fields within 100ms
4. THE Counter_Sale_System SHALL NOT require table assignment for counter orders
5. WHEN an item is added, THE Counter_Sale_System SHALL maintain focus on the search input for continuous item entry

### Requirement 2: Fast Menu Item Selection

**User Story:** As a cashier, I want to search and add menu items instantly, so that I can build orders quickly during busy periods.

#### Acceptance Criteria

1. WHEN a user types in the search field, THE Menu_Search SHALL display matching results after 1 character
2. WHEN search results are displayed, THE Menu_Search SHALL show item name, price, and category
3. WHEN a menu item is clicked, THE Counter_Sale_System SHALL add it to the order and clear the search
4. WHEN an item already exists in the order, THE Counter_Sale_System SHALL increment its quantity instead of duplicating
5. THE Menu_Search SHALL support keyboard navigation for selecting items without mouse interaction
6. WHEN no matches are found, THE Menu_Search SHALL provide an option to add a custom item with manual price entry

### Requirement 3: Real-Time Order Calculation

**User Story:** As a cashier, I want to see accurate totals instantly, so that I can inform customers of the amount immediately.

#### Acceptance Criteria

1. WHEN items are added or removed, THE Counter_Sale_System SHALL recalculate subtotal, tax, and total within 100ms
2. WHEN a discount is applied, THE Counter_Sale_System SHALL update the total immediately
3. THE Counter_Sale_System SHALL display subtotal, tax amount, discount amount, and grand total separately
4. WHEN quantity changes, THE Counter_Sale_System SHALL update all calculations without delay
5. THE Counter_Sale_System SHALL use the business tax rate from Business_Settings for all calculations

### Requirement 4: Multiple Payment Methods

**User Story:** As a cashier, I want to accept various payment methods, so that I can accommodate customer preferences.

#### Acceptance Criteria

1. THE Quick_Payment SHALL support Cash, Card, UPI, and Credit payment methods
2. WHEN a payment method is selected, THE Quick_Payment SHALL validate the payment amount
3. THE Quick_Payment SHALL support split payments across multiple methods
4. WHEN split payment is enabled, THE Quick_Payment SHALL ensure the sum equals the order total
5. WHEN cash payment exceeds the total, THE Quick_Payment SHALL calculate and display change amount
6. WHEN credit payment is selected, THE Quick_Payment SHALL allow zero payment with balance tracking

### Requirement 5: Instant Receipt Printing

**User Story:** As a cashier, I want receipts to print automatically after payment, so that customers receive confirmation immediately.

#### Acceptance Criteria

1. WHEN payment is completed, THE Receipt_Generator SHALL create a formatted receipt immediately
2. WHEN auto-print is enabled in Business_Settings, THE Thermal_Printer SHALL print the receipt automatically
3. THE Receipt_Generator SHALL include business name, items, quantities, prices, tax, total, and payment method
4. WHEN split payment is used, THE Receipt_Generator SHALL show the breakdown of each payment method
5. THE Thermal_Printer SHALL support 58mm and 80mm paper widths based on Business_Settings
6. WHEN printing fails, THE Counter_Sale_System SHALL provide a manual print option

### Requirement 6: Order Item Management

**User Story:** As a cashier, I want to modify order items before payment, so that I can correct mistakes or accommodate customer changes.

#### Acceptance Criteria

1. WHEN an item is in the order, THE Counter_Sale_System SHALL provide quantity increase and decrease controls
2. WHEN quantity reaches zero, THE Counter_Sale_System SHALL remove the item from the order
3. THE Counter_Sale_System SHALL provide a delete button for immediate item removal
4. WHEN items are modified, THE Counter_Sale_System SHALL update totals immediately
5. THE Counter_Sale_System SHALL display item name, quantity, unit price, and line total for each item

### Requirement 7: Discount Application

**User Story:** As a cashier, I want to apply discounts to orders, so that I can honor promotions and special pricing.

#### Acceptance Criteria

1. THE Counter_Sale_System SHALL support both percentage and fixed amount discounts
2. WHEN a discount is applied, THE Counter_Sale_System SHALL validate it does not exceed the subtotal
3. WHEN discount type changes, THE Counter_Sale_System SHALL recalculate the discount amount
4. THE Counter_Sale_System SHALL display the discount amount separately in the order summary
5. THE Receipt_Generator SHALL include discount information on printed receipts

### Requirement 8: Customer Information Capture

**User Story:** As a cashier, I want to optionally capture customer details, so that I can track credit orders and send receipts.

#### Acceptance Criteria

1. THE Counter_Sale_System SHALL provide optional fields for customer name and phone number
2. WHEN credit payment is selected, THE Counter_Sale_System SHALL encourage customer information entry
3. WHEN customer phone is provided, THE Counter_Sale_System SHALL validate the phone number format
4. THE Counter_Sale_System SHALL save customer information with the order for future reference
5. THE Receipt_Generator SHALL include customer name on receipts when provided

### Requirement 9: Performance Optimization

**User Story:** As a cashier, I want the system to respond instantly, so that I can serve customers without delays.

#### Acceptance Criteria

1. WHEN the counter sale page loads, THE Counter_Sale_System SHALL display the interface within 500ms
2. THE Counter_Sale_System SHALL cache menu items for instant search results
3. WHEN payment is processed, THE Counter_Sale_System SHALL complete the transaction within 2 seconds
4. THE Counter_Sale_System SHALL preload payment data to minimize processing time
5. WHEN network is slow, THE Counter_Sale_System SHALL use cached data to maintain responsiveness

### Requirement 10: Integration with Existing Systems

**User Story:** As a system administrator, I want counter sales to integrate with existing reports and inventory, so that all sales are tracked consistently.

#### Acceptance Criteria

1. WHEN a counter sale is completed, THE Counter_Sale_System SHALL create an order record in the database
2. THE Counter_Sale_System SHALL use the same payment validation logic as the billing page
3. WHEN items are sold, THE Counter_Sale_System SHALL update inventory counts if inventory tracking is enabled
4. THE Counter_Sale_System SHALL include counter sales in daily reports and analytics
5. THE Counter_Sale_System SHALL use existing print utilities and business settings

### Requirement 11: Error Handling and Recovery

**User Story:** As a cashier, I want clear error messages and recovery options, so that I can resolve issues quickly without losing order data.

#### Acceptance Criteria

1. WHEN payment validation fails, THE Counter_Sale_System SHALL display a specific error message
2. WHEN network errors occur, THE Counter_Sale_System SHALL retry the operation automatically
3. WHEN printing fails, THE Counter_Sale_System SHALL offer manual print and email options
4. THE Counter_Sale_System SHALL preserve order data in local storage during processing
5. WHEN an error occurs, THE Counter_Sale_System SHALL log the error for troubleshooting

### Requirement 12: Keyboard Shortcuts and Accessibility

**User Story:** As a cashier, I want keyboard shortcuts for common actions, so that I can work faster without using the mouse.

#### Acceptance Criteria

1. THE Counter_Sale_System SHALL support Enter key to add selected menu items
2. THE Counter_Sale_System SHALL support Tab key to navigate between fields
3. THE Counter_Sale_System SHALL support Escape key to clear search or cancel actions
4. THE Counter_Sale_System SHALL provide keyboard shortcuts for payment method selection
5. THE Counter_Sale_System SHALL maintain accessibility standards for screen readers
