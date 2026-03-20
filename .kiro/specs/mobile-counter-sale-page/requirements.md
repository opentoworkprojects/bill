# Requirements Document

## Introduction

This document specifies requirements for a mobile-optimized counter sale page designed specifically for mobile devices (smartphones and tablets). The existing CounterSalePage will remain visible on desktop devices, while the new mobile version will provide a touch-optimized, fast billing experience similar to the PWAHomePage pattern. The goal is to improve UI/UX and accelerate the billing process on mobile devices through larger touch targets, simplified layouts, and mobile-first interactions.

## Glossary

- **Counter_Sale_Page**: The existing desktop-optimized billing page for counter sales
- **Mobile_Counter_Sale_Page**: The new mobile-optimized billing page for counter sales
- **Desktop_Device**: A device with screen width >= 1024px (laptop, desktop computer)
- **Mobile_Device**: A device with screen width < 1024px (smartphone, tablet)
- **Touch_Target**: An interactive UI element sized for finger touch (minimum 44x44px)
- **Bill_Item**: A menu item added to the current sale transaction
- **Payment_Method**: The method of payment (cash, card, UPI, credit, split)
- **Split_Payment**: A payment divided across multiple payment methods
- **Quick_Billing**: Fast checkout process optimized for speed
- **Thermal_Printer**: A receipt printer that prints on thermal paper
- **Business_Settings**: Configuration settings for the restaurant/business
- **Menu_Item**: A product available for sale from the menu
- **Cart**: The collection of Bill_Items in the current transaction
- **Subtotal**: Sum of all Bill_Item prices before tax and discount
- **Tax_Amount**: Calculated tax based on Tax_Rate and taxable amount
- **Tax_Rate**: Percentage rate for tax calculation
- **Discount**: Reduction in price (amount or percentage)
- **Total_Amount**: Final amount after applying discount and tax
- **Receipt**: Printed or digital proof of purchase
- **Customer_Info**: Customer name and phone number
- **Credit_Sale**: A sale where payment is deferred (customer pays later)

## Requirements

### Requirement 1: Device-Based Page Routing

**User Story:** As a restaurant staff member, I want to see the appropriate counter sale page based on my device type, so that I have an optimized experience for my screen size.

#### Acceptance Criteria

1. WHEN a user accesses the counter sale route on a Mobile_Device, THE System SHALL render the Mobile_Counter_Sale_Page
2. WHEN a user accesses the counter sale route on a Desktop_Device, THE System SHALL render the existing Counter_Sale_Page
3. THE System SHALL detect device type using screen width measurement (< 1024px = mobile, >= 1024px = desktop)
4. WHEN the screen is resized across the 1024px threshold, THE System SHALL switch to the appropriate page version
5. THE Mobile_Counter_Sale_Page SHALL be hidden from Desktop_Device users
6. THE Counter_Sale_Page SHALL remain visible and functional for Desktop_Device users

### Requirement 2: Mobile-Optimized Layout

**User Story:** As a mobile user, I want a simplified single-column layout, so that I can easily navigate and complete sales on my small screen.

#### Acceptance Criteria

1. THE Mobile_Counter_Sale_Page SHALL use a single-column vertical layout
2. THE Mobile_Counter_Sale_Page SHALL display menu items in a scrollable list with large Touch_Targets
3. THE Mobile_Counter_Sale_Page SHALL display the Cart as a bottom sheet or expandable section
4. THE Mobile_Counter_Sale_Page SHALL use full-width buttons for primary actions
5. THE Mobile_Counter_Sale_Page SHALL use minimum 44x44px Touch_Targets for all interactive elements
6. THE Mobile_Counter_Sale_Page SHALL use font sizes >= 16px for input fields to prevent iOS zoom
7. THE Mobile_Counter_Sale_Page SHALL adapt to keyboard visibility by adjusting viewport height

### Requirement 3: Fast Menu Item Selection

**User Story:** As a cashier, I want to quickly add items to the cart with minimal taps, so that I can process sales faster during busy periods.

#### Acceptance Criteria

1. WHEN a user taps a Menu_Item, THE System SHALL add it to the Cart immediately
2. WHEN a Menu_Item already exists in the Cart, THE System SHALL increment its quantity by 1
3. THE System SHALL provide visual feedback (animation, haptic) within 100ms of tap
4. THE System SHALL display item emoji icons for quick visual identification
5. THE System SHALL support search filtering with instant results (< 200ms)
6. THE System SHALL support category filtering with one-tap category buttons
7. THE System SHALL display the most recently added item with visual highlight

### Requirement 4: Touch-Optimized Cart Management

**User Story:** As a mobile user, I want to easily adjust quantities and remove items using touch gestures, so that I can correct mistakes quickly.

#### Acceptance Criteria

1. THE Mobile_Counter_Sale_Page SHALL display quantity adjustment buttons (+ and -) with minimum 44x44px size
2. WHEN a user taps the minus button and quantity reaches 0, THE System SHALL remove the Bill_Item from the Cart
3. THE Mobile_Counter_Sale_Page SHALL display a swipe-to-delete gesture for removing Bill_Items
4. THE Mobile_Counter_Sale_Page SHALL show the Cart total prominently at all times
5. THE Mobile_Counter_Sale_Page SHALL display item count badge on the Cart icon
6. WHEN the Cart is empty, THE System SHALL display an empty state message
7. THE Mobile_Counter_Sale_Page SHALL support pull-to-refresh for menu updates

### Requirement 5: Simplified Payment Flow

**User Story:** As a cashier, I want a streamlined payment process with large buttons, so that I can complete transactions quickly on mobile.

#### Acceptance Criteria

1. THE Mobile_Counter_Sale_Page SHALL display payment method buttons in a grid with large Touch_Targets
2. THE Mobile_Counter_Sale_Page SHALL highlight the selected Payment_Method with visual distinction
3. WHEN payment method is cash, THE System SHALL auto-calculate change amount
4. WHEN payment method is credit, THE System SHALL require Customer_Info if configured in Business_Settings
5. THE Mobile_Counter_Sale_Page SHALL display a prominent "Complete Sale" button at the bottom
6. THE System SHALL process payment and show success feedback within 500ms
7. THE Mobile_Counter_Sale_Page SHALL support Split_Payment with simplified input fields

### Requirement 6: Mobile-Optimized Keyboard Handling

**User Story:** As a mobile user, I want the interface to adapt when the keyboard appears, so that I can see what I'm typing without obstruction.

#### Acceptance Criteria

1. WHEN the keyboard appears, THE System SHALL adjust the viewport to keep the focused input visible
2. THE System SHALL use font-size >= 16px for all input fields to prevent automatic zoom on iOS
3. WHEN a user taps outside an input field, THE System SHALL dismiss the keyboard
4. THE Mobile_Counter_Sale_Page SHALL use numeric keyboards for amount inputs
5. THE Mobile_Counter_Sale_Page SHALL use tel keyboard for phone number inputs
6. THE System SHALL maintain scroll position when keyboard is dismissed
7. THE Mobile_Counter_Sale_Page SHALL provide a "Done" button to dismiss keyboard on iOS

### Requirement 7: Instant Receipt Printing

**User Story:** As a cashier, I want receipts to print automatically after payment, so that I can hand them to customers immediately.

#### Acceptance Criteria

1. WHEN a sale is completed, THE System SHALL trigger thermal printing automatically if auto_print is enabled in Business_Settings
2. THE System SHALL generate receipt content within 100ms of payment completion
3. THE System SHALL display a print preview option before completing the sale
4. WHEN thermal printing fails, THE System SHALL show a retry button
5. THE System SHALL support manual print triggering via a print button
6. THE System SHALL include all transaction details in the Receipt (items, amounts, payment method, customer info)
7. THE System SHALL format receipts according to Business_Settings preferences

### Requirement 8: Offline-First Data Loading

**User Story:** As a user, I want the menu to load instantly from cache, so that I can start billing even with slow network.

#### Acceptance Criteria

1. THE System SHALL cache Menu_Items in local storage after first load
2. WHEN the Mobile_Counter_Sale_Page loads, THE System SHALL display cached Menu_Items immediately
3. THE System SHALL refresh Menu_Items in the background after displaying cache
4. WHEN cached data is older than 5 minutes, THE System SHALL show a refresh indicator
5. THE System SHALL cache Business_Settings for offline access
6. WHEN network is unavailable, THE System SHALL queue transactions for later sync
7. THE System SHALL display network status indicator when offline

### Requirement 9: Customer Information Capture

**User Story:** As a cashier, I want to quickly capture customer details for credit sales, so that I can track who owes money.

#### Acceptance Criteria

1. WHEN payment method is credit AND Business_Settings requires customer info, THE System SHALL show a customer info modal
2. THE System SHALL validate that Customer_Info contains both name and phone for credit sales
3. THE Mobile_Counter_Sale_Page SHALL provide quick-access buttons to open customer info modal
4. THE System SHALL save customer info with the transaction
5. THE Mobile_Counter_Sale_Page SHALL support auto-fill from recent customers
6. THE System SHALL validate phone number format (10 digits for India)
7. THE Mobile_Counter_Sale_Page SHALL allow optional customer info for non-credit sales

### Requirement 10: Performance Optimization

**User Story:** As a user, I want the mobile page to load and respond quickly, so that I can process sales without delays.

#### Acceptance Criteria

1. THE Mobile_Counter_Sale_Page SHALL render initial UI within 500ms of navigation
2. THE System SHALL respond to user interactions within 100ms
3. THE System SHALL use optimistic UI updates for cart operations
4. THE System SHALL lazy-load menu item images
5. THE System SHALL debounce search input to prevent excessive filtering
6. THE System SHALL use virtual scrolling for large menu lists (> 100 items)
7. THE System SHALL minimize re-renders using React memoization

### Requirement 11: Visual Feedback and Animations

**User Story:** As a mobile user, I want clear visual feedback for my actions, so that I know the system is responding.

#### Acceptance Criteria

1. WHEN a user taps a button, THE System SHALL show a press animation (scale down)
2. WHEN an item is added to Cart, THE System SHALL show a success animation
3. WHEN a sale is completed, THE System SHALL show a success checkmark animation
4. THE System SHALL use haptic feedback (vibration) for key actions if supported
5. THE Mobile_Counter_Sale_Page SHALL use smooth transitions between states (< 300ms)
6. WHEN loading data, THE System SHALL show skeleton loaders instead of spinners
7. THE System SHALL use color coding for payment status (green = paid, orange = credit)

### Requirement 12: Error Handling and Validation

**User Story:** As a user, I want clear error messages when something goes wrong, so that I know how to fix the issue.

#### Acceptance Criteria

1. WHEN Cart is empty and user attempts to complete sale, THE System SHALL show error message "Add at least one item"
2. WHEN payment amount is invalid, THE System SHALL show error message with specific issue
3. WHEN network request fails, THE System SHALL show retry option
4. WHEN subscription limit is reached, THE System SHALL redirect to subscription page with explanation
5. THE System SHALL validate all payment amounts before processing
6. WHEN Split_Payment amounts don't match total, THE System SHALL show error with difference
7. THE System SHALL log errors to console for debugging while showing user-friendly messages

### Requirement 13: Accessibility and Usability

**User Story:** As a user with accessibility needs, I want the mobile page to be usable with assistive technologies, so that I can operate it independently.

#### Acceptance Criteria

1. THE Mobile_Counter_Sale_Page SHALL use semantic HTML elements for proper screen reader support
2. THE System SHALL provide ARIA labels for icon-only buttons
3. THE Mobile_Counter_Sale_Page SHALL support keyboard navigation for external keyboard users
4. THE System SHALL maintain sufficient color contrast (WCAG AA minimum)
5. THE Mobile_Counter_Sale_Page SHALL support text scaling up to 200%
6. THE System SHALL provide focus indicators for interactive elements
7. THE Mobile_Counter_Sale_Page SHALL announce important state changes to screen readers

### Requirement 14: Integration with Existing Systems

**User Story:** As a system administrator, I want the mobile page to integrate seamlessly with existing backend APIs, so that data remains consistent across platforms.

#### Acceptance Criteria

1. THE Mobile_Counter_Sale_Page SHALL use the same API endpoints as Counter_Sale_Page
2. THE System SHALL create orders with order_type "takeaway" and table_id "counter"
3. THE System SHALL dispatch paymentCompleted events for real-time order updates
4. THE System SHALL invalidate billing cache after successful payment
5. THE System SHALL increment bill_count in subscription status after each sale
6. THE System SHALL support all existing Payment_Methods (cash, card, UPI, credit, split)
7. THE System SHALL respect Business_Settings for payment method availability

### Requirement 15: Testing and Quality Assurance

**User Story:** As a developer, I want comprehensive test coverage, so that I can ensure the mobile page works reliably.

#### Acceptance Criteria

1. THE System SHALL include unit tests for all calculation functions (subtotal, tax, discount, total)
2. THE System SHALL include integration tests for payment processing flow
3. THE System SHALL include tests for device detection logic
4. THE System SHALL include tests for cart operations (add, remove, update quantity)
5. THE System SHALL include tests for payment validation logic
6. THE System SHALL include visual regression tests for mobile layouts
7. THE System SHALL include performance tests to verify < 500ms load time

