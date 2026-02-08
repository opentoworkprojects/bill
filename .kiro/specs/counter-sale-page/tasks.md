# Implementation Plan: Counter Sale Page

## Overview

This implementation plan breaks down the Counter Sale feature into discrete, incremental coding tasks. Each task builds on previous work, with testing integrated throughout to catch errors early. The implementation reuses existing utilities (paymentValidator, printUtils, orderWorkflowRules, billingCache) and follows the established patterns from BillingPage.js.

## Tasks

- [x] 1. Set up Counter Sale page structure and routing
  - Create `frontend/src/pages/CounterSalePage.js` with basic React component structure
  - Add route in `App.js`: `/counter-sale` accessible to cashier and admin roles
  - Import Layout component and set up basic page structure with header
  - Add navigation link in Layout.js menu for "Counter Sale" or "Quick Sale"
  - Verify page loads and is accessible from navigation
  - _Requirements: 1.1, 1.4_

- [x] 2. Implement menu search and item selection
  - [x] 2.1 Create MenuSearchBar component with search input and dropdown
    - Build search input with debounced onChange (100ms delay)
    - Implement filtered menu items display based on search query
    - Add keyboard navigation support (Arrow keys, Enter, Escape)
    - Style dropdown with proper positioning and z-index
    - _Requirements: 2.1, 2.2, 2.5_
  
  - [x] 2.2 Write property test for menu search responsiveness
    - **Property 7: Menu Search Responsiveness**
    - **Validates: Requirements 2.1, 2.2**
    - Test that search returns results for any query with matches
    - Test that results include name, price, and category fields
  
  - [x] 2.3 Implement item addition logic with duplicate handling
    - Add handleAddItem function that checks for existing items
    - If item exists, increment quantity; otherwise add new item
    - Clear search query and refocus search input after addition
    - Show toast notification for successful addition
    - _Requirements: 1.2, 2.3, 2.4_
  
  - [x] 2.4 Write property test for item addition and quantity increment
    - **Property: Item Addition Consistency**
    - **Validates: Requirements 1.2, 2.4**
    - Test that adding existing item increments quantity
    - Test that adding new item creates new order entry
  
  - [x] 2.5 Add custom item entry for no-match scenarios
    - Show custom item form when search has no results
    - Add fields for item name and price
    - Validate price is positive before adding
    - _Requirements: 2.6_

- [x] 3. Build order items list and management
  - [x] 3.1 Create OrderItemsList component
    - Display list of selected items with name, quantity, price, line total
    - Add quantity controls (+/- buttons) for each item
    - Add remove button for each item
    - Show empty state message when no items
    - _Requirements: 6.1, 6.3, 6.5_
  
  - [x] 3.2 Implement quantity change and item removal logic
    - Create handleQuantityChange function with delta parameter
    - Remove item when quantity reaches zero
    - Create handleRemoveItem function for immediate deletion
    - Update order state immutably
    - _Requirements: 6.2, 6.4_
  
  - [x] 3.3 Write property test for quantity management
    - **Property 5: Item Quantity Consistency**
    - **Validates: Requirements 6.2, 6.4**
    - Test that decrementing to zero removes item
    - Test that quantity changes update totals correctly

- [x] 4. Implement real-time calculations
  - [x] 4.1 Create calculation functions with memoization
    - Implement calculateSubtotal using useMemo
    - Implement calculateDiscountAmount with type support (amount/percent)
    - Implement calculateTax using business tax rate
    - Implement calculateTotal (subtotal - discount + tax)
    - Ensure all calculations use memoization for performance
    - _Requirements: 3.1, 3.2, 3.4, 3.5_
  
  - [x] 4.2 Write property test for order total consistency
    - **Property 1: Order Total Consistency**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
    - Test that total always equals (subtotal - discount + tax)
    - Test with various item combinations and discount types
  
  - [x] 4.3 Create OrderSummary component
    - Display subtotal, tax, discount, and grand total
    - Update in real-time when order changes
    - Format currency properly with ₹ symbol
    - _Requirements: 3.3_

- [x] 5. Implement discount functionality
  - [x] 5.1 Create DiscountSection component
    - Add discount type toggle (percentage vs fixed amount)
    - Add discount value input field
    - Show calculated discount amount
    - _Requirements: 7.1, 7.4_
  
  - [x] 5.2 Add discount validation logic
    - Validate discount does not exceed subtotal
    - Ensure final total is non-negative
    - Show error message for invalid discounts
    - _Requirements: 7.2_
  
  - [x] 5.3 Write property test for discount validation
    - **Property 6: Discount Validation**
    - **Validates: Requirements 7.2, 7.4**
    - Test that discount never exceeds subtotal
    - Test that final total is always non-negative
    - Test both percentage and fixed amount discounts

- [x] 6. Build payment section with multiple methods
  - [x] 6.1 Create PaymentSection component
    - Display payment method buttons (Cash, Card, UPI, Credit)
    - Filter available methods based on business settings
    - Add split payment toggle
    - Show payment summary (received, balance, change)
    - _Requirements: 4.1_
  
  - [x] 6.2 Implement payment method selection and validation
    - Create handlePaymentMethodChange function
    - Integrate paymentValidator for amount validation
    - Show validation errors inline
    - Calculate change for overpayments
    - _Requirements: 4.2, 4.5_
  
  - [x] 6.3 Write property test for payment validation
    - **Property 2: Payment Amount Validation**
    - **Validates: Requirements 4.2, 4.6**
    - Test that non-credit payments require amount > 0
    - Test that credit payments allow zero amount
  
  - [x] 6.4 Write property test for change calculation
    - **Property 4: Change Calculation Accuracy**
    - **Validates: Requirements 4.5**
    - Test that change equals (received - total) for overpayments
  
  - [x] 6.5 Implement split payment functionality
    - Add input fields for cash, card, and UPI amounts
    - Calculate total received from all methods
    - Validate sum equals order total
    - Show remaining balance in real-time
    - _Requirements: 4.3, 4.4_
  
  - [x] 6.6 Write property test for split payment validation
    - **Property 3: Split Payment Sum Equality**
    - **Validates: Requirements 4.3, 4.4**
    - Test that sum of split amounts equals order total
    - Test with various split combinations

- [x] 7. Add customer information capture
  - [x] 7.1 Create CustomerInfoSection component
    - Add optional customer name input
    - Add optional customer phone input with validation
    - Show encouragement message for credit orders
    - _Requirements: 8.1, 8.2_
  
  - [x] 7.2 Implement phone number validation
    - Validate phone format (10-15 digits)
    - Show validation error for invalid format
    - Allow international formats with +
    - _Requirements: 8.3_
  
  - [x] 7.3 Write property test for phone validation
    - **Property: Phone Number Validation**
    - **Validates: Requirements 8.3**
    - Test that valid phone formats pass validation
    - Test that invalid formats are rejected

- [x] 8. Checkpoint - Ensure UI components render and interact correctly
  - Verify all components render without errors
  - Test item addition, quantity changes, and removal
  - Test discount application and validation
  - Test payment method selection
  - Ask the user if questions arise

- [x] 9. Implement payment processing and order creation
  - [x] 9.1 Create handleCompletePayment function
    - Validate order has items
    - Validate payment using paymentValidator
    - Build order data object with all required fields
    - Set table_id to 'counter' and table_number to 0
    - Set order_type to 'counter' and status to 'completed'
    - _Requirements: 1.4, 10.1_
  
  - [x] 9.2 Integrate with backend API for order creation
    - Use apiWithRetry for order creation POST request
    - Handle success and error responses
    - Show loading state during processing
    - Display success/error toast notifications
    - _Requirements: 10.1, 10.2_
  
  - [x] 9.3 Write property test for order creation
    - **Property 12: Order Creation Success**
    - **Validates: Requirements 10.1, 10.4**
    - Test that completed orders have correct fields
    - Test that table_id is always 'counter'
    - Test that order_type is always 'counter'
  
  - [x] 9.4 Add local storage persistence for error recovery
    - Save order data to localStorage during processing
    - Restore order data on page load if exists
    - Clear localStorage after successful completion
    - _Requirements: 11.4_
  
  - [x] 9.5 Write property test for order state preservation
    - **Property 8: Order State Preservation**
    - **Validates: Requirements 11.4**
    - Test that order data is saved to localStorage
    - Test that data is restored on page load

- [x] 10. Implement receipt generation and printing
  - [x] 10.1 Integrate with existing printUtils
    - Import printReceipt and generatePlainTextReceipt functions
    - Build receipt data object with all order details
    - Include split payment breakdown if applicable
    - Include customer info if provided
    - _Requirements: 5.3, 5.4, 8.5_
  
  - [x] 10.2 Add auto-print functionality
    - Check business settings for auto_print flag
    - Call printReceipt automatically after payment if enabled
    - Handle print errors gracefully
    - _Requirements: 5.1, 5.2_
  
  - [x] 10.3 Write property test for receipt completeness
    - **Property 9: Receipt Content Completeness**
    - **Validates: Requirements 5.3, 5.4, 7.5, 8.5**
    - Test that receipt includes all required fields
    - Test that split payment details are included
    - Test that customer name appears when provided
  
  - [x] 10.4 Add manual print and preview options
    - Add "Print Preview" button to show receipt before printing
    - Add "Print Receipt" button for manual printing
    - Reuse PrintPreviewModal component from BillingPage
    - _Requirements: 5.6_

- [x] 11. Add error handling and recovery
  - [x] 11.1 Implement payment validation error handling
    - Catch validation errors from paymentValidator
    - Display specific error messages to user
    - Prevent submission when validation fails
    - _Requirements: 11.1_
  
  - [x] 11.2 Add network error handling with retry
    - Use apiWithRetry for automatic retry on network errors
    - Show retry button for failed requests
    - Log errors using billingErrorLogger
    - _Requirements: 11.2, 11.5_
  
  - [x] 11.3 Implement print error recovery
    - Catch print errors and show error message
    - Offer manual print option on failure
    - Save receipt to localStorage for later printing
    - _Requirements: 11.3_

- [x] 12. Implement performance optimizations
  - [x] 12.1 Add menu data caching
    - Cache menu items in localStorage with 5-minute TTL
    - Load from cache on page load for instant display
    - Fetch fresh data in background
    - _Requirements: 9.2_
  
  - [x] 12.2 Optimize search with debouncing
    - Implement 100ms debounce on search input
    - Cancel pending searches on new input
    - _Requirements: 2.1_
  
  - [x] 12.3 Add performance monitoring
    - Use performanceMonitor utility to track timing
    - Monitor page load, search, calculation, and payment times
    - Log slow operations for optimization
    - _Requirements: 9.1, 9.3_

- [x] 13. Add keyboard shortcuts and accessibility
  - [x] 13.1 Implement keyboard navigation
    - Add Enter key handler for item selection
    - Add Escape key handler for search clearing
    - Add Tab key navigation between sections
    - Add Arrow key navigation in search results
    - _Requirements: 12.1, 12.2, 12.3_
  
  - [x] 13.2 Add ARIA labels and screen reader support
    - Add aria-label to all interactive elements
    - Add live regions for total updates
    - Add role attributes for semantic structure
    - Test with screen reader
    - _Requirements: 12.5_

- [x] 14. Implement order clearing and reset
  - [x] 14.1 Create clearOrder function
    - Reset all state variables to initial values
    - Clear localStorage
    - Show confirmation dialog before clearing
    - Refocus search input after clearing
    - _Requirements: 1.5_
  
  - [x] 14.2 Add "Clear Order" button
    - Place button in action section
    - Style as secondary/outline button
    - Show confirmation before clearing
    - _Requirements: 1.1_

- [x] 15. Final integration and testing
  - [x] 15.1 Test complete order flow end-to-end
    - Test search → add items → apply discount → pay → print
    - Test all payment methods (cash, card, UPI, credit)
    - Test split payment flow
    - Test error scenarios
  
  - [x] 15.2 Verify integration with existing systems
    - Verify orders appear in OrdersPage
    - Verify orders appear in reports
    - Verify payment validation matches BillingPage
    - Verify print output matches BillingPage
    - _Requirements: 10.2, 10.3, 10.4, 10.5_
  
  - [x] 15.3 Write integration tests for complete flow
    - Test full order creation flow
    - Test payment processing
    - Test receipt generation
    - Test error recovery

- [x] 16. Final checkpoint - Ensure all tests pass
  - Run all unit tests and property tests
  - Run integration tests
  - Test on different screen sizes
  - Test keyboard navigation
  - Test with screen reader
  - Ensure all tests pass, ask the user if questions arise

## Notes

- All tasks are required for comprehensive implementation with full test coverage
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties using fast-check library (20 iterations for fast execution)
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end workflows
- Performance monitoring ensures sub-second response times
- Reuse existing utilities: paymentValidator, printUtils, orderWorkflowRules, billingCache, apiClient
- Follow existing patterns from BillingPage.js for consistency
