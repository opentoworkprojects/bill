# Implementation Plan: Mobile Counter Sale Page

## Overview

This implementation plan creates a mobile-optimized counter sale page for devices with screen width < 1024px. The implementation follows a progressive approach: first establishing the routing and device detection infrastructure, then building the core mobile UI components, implementing the cart and payment flows, and finally adding performance optimizations and testing.

The mobile version provides a touch-first, single-column layout optimized for fast billing on smartphones and tablets, while the existing CounterSalePage remains unchanged for desktop users.

## Tasks

- [x] 1. Set up device detection and routing infrastructure
  - Create CounterSaleRouter component that detects screen width and renders appropriate page
  - Implement window resize listener with 300ms debounce
  - Update App.js route to use CounterSaleRouter instead of CounterSalePage directly
  - Add tests for device detection logic (< 1024px = mobile, >= 1024px = desktop)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 2. Create MobileCounterSalePage component structure
  - [x] 2.1 Create MobileCounterSalePage component with core state management
    - Set up React component with all required state hooks (menu, cart, customer, payment, UI state)
    - Implement data fetching for menu items and business settings with caching
    - Add subscription status fetching
    - Implement useMemo hooks for calculations (subtotal, discount, tax, total)
    - _Requirements: 2.1, 8.1, 8.2, 8.3, 8.5, 10.1_


  - [ ]* 2.2 Write property test for device-based routing
    - **Property 1: Device-based routing**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.5**

  - [ ]* 2.3 Write property test for dynamic device switching
    - **Property 2: Dynamic device switching**
    - **Validates: Requirements 1.4**

- [x] 3. Implement mobile menu section with search and filtering
  - [x] 3.1 Create MobileMenuSection component with search bar and category filters
    - Build search input with 16px font size (prevent iOS zoom)
    - Implement horizontal scrolling category chips
    - Add search filtering with debouncing (150ms)
    - Implement category filtering logic
    - Display menu items in responsive grid (2-3 columns based on screen size)
    - _Requirements: 2.6, 3.5, 3.6, 6.2, 10.5_

  - [x] 3.2 Implement menu item cards with touch-optimized interactions
    - Create menu item card component with emoji icons, name, price
    - Implement tap-to-add functionality with immediate cart update (< 100ms)
    - Add visual feedback animation on tap
    - Show quantity badge when item is in cart
    - Add quantity adjustment controls (+/-) with 44x44px touch targets
    - Highlight most recently added item
    - _Requirements: 2.5, 3.1, 3.2, 3.3, 3.4, 3.7, 4.1, 10.2, 10.3, 11.1, 11.2_

  - [ ]* 3.3 Write property test for add to cart immediately
    - **Property 6: Add to cart immediately**
    - **Validates: Requirements 3.1, 3.3**

  - [ ]* 3.4 Write property test for quantity increment on duplicate add
    - **Property 7: Quantity increment on duplicate add**
    - **Validates: Requirements 3.2**

  - [ ]* 3.5 Write property test for search performance
    - **Property 9: Search performance**
    - **Validates: Requirements 3.5**

- [x] 4. Build mobile cart bottom sheet component
  - [x] 4.1 Create MobileCartBottomSheet with collapsible functionality
    - Build fixed bottom sheet with collapsed (80px) and expanded (60% screen) states
    - Implement swipe-up/swipe-down gestures for expand/collapse
    - Add smooth animation transitions (< 300ms)
    - Display item count badge and total in collapsed state
    - Show full item list with quantity controls in expanded state
    - Implement tap-outside-to-collapse behavior
    - _Requirements: 2.3, 4.4, 4.5, 11.5_

  - [x] 4.2 Implement cart item management
    - Display cart items with name, price, quantity
    - Add quantity adjustment buttons (+/-) with 44x44px size
    - Implement remove item when quantity reaches 0
    - Add swipe-to-delete gesture for items
    - Show empty cart state message when cart is empty
    - Display cart summary (subtotal, discount, tax, total)
    - _Requirements: 4.1, 4.2, 4.3, 4.6_

  - [ ]* 4.3 Write property test for remove item when quantity reaches zero
    - **Property 12: Remove item when quantity reaches zero**
    - **Validates: Requirements 4.2**

  - [ ]* 4.4 Write property test for cart item count badge
    - **Property 13: Cart item count badge**
    - **Validates: Requirements 4.5**

- [x] 5. Checkpoint - Ensure menu and cart functionality works
  - Ensure all tests pass, ask the user if questions arise.


- [x] 6. Implement mobile payment modal with payment method selection
  - [x] 6.1 Create MobilePaymentModal component with full-screen layout
    - Build full-screen modal (100vh) with payment method grid
    - Display payment method buttons in 2-column grid with 60px height and large touch targets
    - Implement payment method selection with visual distinction for selected method
    - Add payment method icons and labels (Cash, Card, UPI, Credit, Split)
    - Filter payment methods based on Business_Settings.payment_methods_enabled
    - _Requirements: 2.4, 2.5, 5.1, 5.2, 14.7_

  - [x] 6.2 Implement payment amount inputs with keyboard optimization
    - Add amount input field with 24px font size and numeric keyboard (inputMode="numeric")
    - Implement quick amount buttons (Exact, 50%, Round)
    - Show change calculation for cash payments (received - total)
    - Show balance calculation for partial payments
    - Display split payment inputs (cash, card, UPI) with numeric keyboards
    - Validate split payment amounts sum to total
    - _Requirements: 5.3, 6.4, 12.6_

  - [x] 6.3 Add complete sale button and processing logic
    - Create large "Complete Sale" button at bottom (56px height, full width)
    - Implement payment validation before processing
    - Show processing state during API calls
    - Display success feedback within 500ms
    - Handle credit payment customer info requirement
    - _Requirements: 2.4, 5.5, 5.6, 5.7, 12.1, 12.2, 12.5_

  - [ ]* 6.4 Write property test for payment method visual distinction
    - **Property 14: Payment method visual distinction**
    - **Validates: Requirements 5.2**

  - [ ]* 6.5 Write property test for cash change calculation
    - **Property 15: Cash change calculation**
    - **Validates: Requirements 5.3**

  - [ ]* 6.6 Write property test for split payment validation
    - **Property 18: Split payment validation**
    - **Validates: Requirements 5.7, 12.6**

  - [ ]* 6.7 Write property test for payment amount validation
    - **Property 53: Payment amount validation**
    - **Validates: Requirements 12.5**

- [x] 7. Implement customer information modal
  - [x] 7.1 Create CustomerInfoModal component with mobile optimizations
    - Build full-screen modal on small devices
    - Add large input fields (48px height) for name and phone
    - Set inputMode="tel" for phone number input
    - Implement auto-focus on name field when modal opens
    - Add phone number validation (10 digits for India)
    - Show validation errors inline
    - _Requirements: 6.5, 9.1, 9.3, 9.6_

  - [x] 7.2 Implement customer info requirement logic for credit sales
    - Check Business_Settings.credit_requires_customer_info
    - Block credit payment completion if customer info missing
    - Show error toast when customer info required but not provided
    - Save customer info with transaction
    - Support optional customer info for non-credit sales
    - _Requirements: 5.4, 9.2, 9.4, 9.7_

  - [ ]* 7.3 Write property test for credit payment customer info requirement
    - **Property 16: Credit payment customer info requirement**
    - **Validates: Requirements 5.4, 9.1, 9.2**

  - [ ]* 7.4 Write property test for phone number validation
    - **Property 36: Phone number validation**
    - **Validates: Requirements 9.6**

  - [ ]* 7.5 Write property test for optional customer info for non-credit
    - **Property 37: Optional customer info for non-credit**
    - **Validates: Requirements 9.7**


- [x] 8. Implement payment processing and order creation
  - [x] 8.1 Create order creation logic with optimistic UI
    - Implement completeSale function with optimistic UI updates
    - Create order via POST /orders API with order_type "takeaway" and table_id "counter"
    - Process payment using processPaymentFast utility
    - Show success feedback immediately (< 100ms)
    - Handle API calls in background (non-blocking)
    - Reset cart and UI for next transaction
    - _Requirements: 10.2, 10.3, 14.1, 14.2_

  - [x] 8.2 Implement payment state calculation and validation
    - Use computePaymentState for payment calculations
    - Validate payment using validatePayment utility
    - Handle split payment amounts (cash, card, UPI, credit)
    - Calculate change amount for cash payments
    - Calculate balance amount for partial payments
    - Set is_credit flag for credit sales
    - _Requirements: 5.3, 5.7, 12.2, 12.5, 12.6_

  - [x] 8.3 Add subscription limit checking and bill count increment
    - Check subscription status before order creation
    - Block order if needs_subscription is true
    - Redirect to /subscription page with error message
    - Increment bill_count after successful order
    - Update subscription status state
    - _Requirements: 12.4, 14.5_

  - [x] 8.4 Implement payment completed event dispatch
    - Dispatch paymentCompleted custom event with order details
    - Store payment completion in localStorage for cross-tab sync
    - Set removeFromActiveOrders flag for counter sales
    - Clear localStorage after 5 seconds
    - _Requirements: 14.3_

  - [ ]* 8.5 Write property test for payment processing performance
    - **Property 17: Payment processing performance**
    - **Validates: Requirements 5.6**

- [x] 9. Checkpoint - Ensure payment flow works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement receipt generation and thermal printing
  - [x] 10.1 Create receipt modal with mobile optimizations
    - Build full-screen receipt modal on small devices
    - Display sale completion with success animation (checkmark)
    - Show receipt preview with all transaction details
    - Add large print and close buttons (56px height)
    - Implement auto-dismiss after 3 seconds (optional)
    - _Requirements: 11.3, 11.5_

  - [x] 10.2 Implement thermal printing with auto-print support
    - Trigger printReceipt automatically if Business_Settings.print_customization.auto_print is true
    - Generate receipt content within 100ms of payment completion
    - Use fire-and-forget pattern for non-blocking print
    - Add manual print button for retry
    - Show retry button on print failure
    - Format receipt according to Business_Settings preferences
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [ ]* 10.3 Write property test for auto-print based on settings
    - **Property 21: Auto-print based on settings**
    - **Validates: Requirements 7.1**

  - [ ]* 10.4 Write property test for receipt generation performance
    - **Property 22: Receipt generation performance**
    - **Validates: Requirements 7.2**

  - [ ]* 10.5 Write property test for receipt completeness
    - **Property 25: Receipt completeness**
    - **Validates: Requirements 7.6**


- [x] 11. Implement offline-first data loading and caching
  - [x] 11.1 Add menu caching with localStorage
    - Cache menu items in localStorage after successful fetch
    - Load cached menu immediately on page mount
    - Trigger background refresh after displaying cache
    - Calculate cache age and show refresh indicator if > 5 minutes
    - Implement pull-to-refresh for manual menu updates
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 4.7_

  - [x] 11.2 Implement offline transaction queuing
    - Detect network availability using navigator.onLine
    - Queue transactions in localStorage when offline
    - Show network status indicator when offline
    - Implement automatic sync when network restored
    - Show toast notification during sync
    - _Requirements: 8.6, 8.7_

  - [x] 11.3 Add cache invalidation after payment
    - Invalidate billing cache after successful payment
    - Clear cached menu if stale (> 5 minutes)
    - Trigger background refresh on cache invalidation
    - _Requirements: 14.4_

  - [ ]* 11.4 Write property test for menu caching
    - **Property 27: Menu caching**
    - **Validates: Requirements 8.1**

  - [ ]* 11.5 Write property test for immediate cache display
    - **Property 28: Immediate cache display**
    - **Validates: Requirements 8.2**

- [x] 12. Implement performance optimizations
  - [x] 12.1 Add React memoization and optimization hooks
    - Use React.memo for menu item cards
    - Use useMemo for expensive calculations (subtotal, tax, total)
    - Use useCallback for event handlers
    - Minimize re-renders by optimizing state updates
    - _Requirements: 10.7_

  - [x] 12.2 Implement lazy loading and virtual scrolling
    - Add lazy loading for menu item images (loading="lazy")
    - Implement virtual scrolling for menus with > 100 items
    - Use skeleton loaders instead of spinners
    - _Requirements: 10.4, 10.6, 11.6_

  - [x] 12.3 Add debouncing and throttling
    - Debounce search input (150ms)
    - Throttle window resize events (300ms)
    - Debounce scroll events for virtual scrolling
    - _Requirements: 10.5_

  - [ ]* 12.4 Write property test for initial render performance
    - **Property 38: Initial render performance**
    - **Validates: Requirements 10.1**

  - [ ]* 12.5 Write property test for interaction response performance
    - **Property 39: Interaction response performance**
    - **Validates: Requirements 10.2, 3.3**

- [x] 13. Implement visual feedback and animations
  - [x] 13.1 Add button press animations and haptic feedback
    - Implement scale-down animation on button tap
    - Add haptic feedback (vibration) for key actions if supported
    - Use smooth transitions for all state changes (< 300ms)
    - _Requirements: 11.1, 11.4, 11.5_

  - [x] 13.2 Add success animations and color coding
    - Create success animation for item added to cart
    - Add checkmark animation for sale completion
    - Implement color coding for payment status (green = paid, orange = credit)
    - _Requirements: 11.2, 11.3, 11.7_

  - [ ]* 13.3 Write property test for smooth state transitions
    - **Property 47: Smooth state transitions**
    - **Validates: Requirements 11.5**


- [x] 14. Implement error handling and validation
  - [x] 14.1 Add client-side validation
    - Validate empty cart before payment
    - Validate payment amounts (non-negative, numeric)
    - Validate split payment sum equals total
    - Validate customer info for credit sales
    - Validate phone number format
    - Show inline validation errors
    - _Requirements: 12.1, 12.2, 12.5, 12.6_

  - [x] 14.2 Add network error handling
    - Handle menu load failures with cached fallback
    - Handle order creation failures with offline queuing
    - Handle payment processing failures with retry
    - Handle print failures with retry button
    - Show user-friendly error messages
    - _Requirements: 12.3, 12.7_

  - [x] 14.3 Implement subscription limit error handling
    - Detect 402 response from API
    - Show error toast with explanation
    - Redirect to /subscription page
    - Update subscription status state
    - _Requirements: 12.4_

  - [ ]* 14.4 Write property test for invalid payment amount errors
    - **Property 50: Invalid payment amount errors**
    - **Validates: Requirements 12.2**

  - [ ]* 14.5 Write property test for network failure retry
    - **Property 51: Network failure retry**
    - **Validates: Requirements 12.3**

- [x] 15. Implement accessibility features
  - [x] 15.1 Add semantic HTML and ARIA labels
    - Use semantic HTML elements (button, nav, main, etc.)
    - Add aria-label for icon-only buttons
    - Add aria-live regions for important state changes
    - Ensure proper heading hierarchy
    - _Requirements: 13.1, 13.2, 13.7_

  - [x] 15.2 Implement keyboard navigation support
    - Ensure all interactive elements are keyboard accessible
    - Add visible focus indicators
    - Implement logical tab order
    - Support enter/space for button activation
    - _Requirements: 13.3, 13.6_

  - [x] 15.3 Ensure color contrast and text scaling
    - Verify all text meets WCAG AA contrast (4.5:1 for normal, 3:1 for large)
    - Test interface with 200% text scaling
    - Ensure no text overlap or horizontal scroll at 200%
    - _Requirements: 13.4, 13.5_

  - [ ]* 15.4 Write property test for touch target minimum size
    - **Property 3: Touch target minimum size**
    - **Validates: Requirements 2.5, 4.1, 5.1**

  - [ ]* 15.5 Write property test for input font size for iOS zoom prevention
    - **Property 4: Input font size for iOS zoom prevention**
    - **Validates: Requirements 2.6, 6.2**

  - [ ]* 15.6 Write property test for ARIA labels for icon buttons
    - **Property 56: ARIA labels for icon buttons**
    - **Validates: Requirements 13.2**

- [x] 16. Checkpoint - Ensure all features work correctly
  - Ensure all tests pass, ask the user if questions arise.


- [x] 17. Add mobile-specific UI polish and refinements
  - [x] 17.1 Implement keyboard handling for mobile
    - Adjust viewport when keyboard appears
    - Maintain scroll position when keyboard dismissed
    - Add "Done" button to dismiss keyboard on iOS
    - Implement tap-outside-input to dismiss keyboard
    - _Requirements: 6.1, 6.3, 6.6, 6.7_

  - [x] 17.2 Add mobile layout refinements
    - Ensure single-column vertical layout
    - Implement full-width buttons for primary actions
    - Add proper spacing for touch interactions
    - Optimize for different mobile screen sizes (375px - 1023px)
    - _Requirements: 2.1, 2.2, 2.4_

  - [x] 17.3 Add loading states and empty states
    - Show skeleton loaders during menu loading
    - Display empty cart state message
    - Show loading spinner during payment processing
    - Add empty search results state
    - _Requirements: 4.6, 11.6_

- [ ] 18. Write integration tests for critical flows
  - [ ]* 18.1 Write integration test for complete sale flow
    - Test: Add items → Select payment → Enter amount → Complete sale
    - Verify: Order created, payment processed, receipt shown, cart cleared
    - _Requirements: All payment and order requirements_

  - [ ]* 18.2 Write integration test for credit sale with customer info
    - Test: Add items → Select credit → Attempt complete → Enter customer info → Complete
    - Verify: Customer info required, included in order
    - _Requirements: 5.4, 9.1, 9.2, 9.4_

  - [ ]* 18.3 Write integration test for offline mode
    - Test: Disconnect network → Add items → Complete sale → Reconnect
    - Verify: Order queued, synced when online
    - _Requirements: 8.6, 8.7_

  - [ ]* 18.4 Write integration test for device switching
    - Test: Load on mobile width → Resize to desktop width
    - Verify: Correct component rendered for each width
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 19. Add remaining property-based tests
  - [ ]* 19.1 Write property test for category filtering
    - **Property 10: Category filtering**
    - **Validates: Requirements 3.6**

  - [ ]* 19.2 Write property test for numeric keyboard for amount inputs
    - **Property 19: Numeric keyboard for amount inputs**
    - **Validates: Requirements 6.4**

  - [ ]* 19.3 Write property test for tel keyboard for phone inputs
    - **Property 20: Tel keyboard for phone inputs**
    - **Validates: Requirements 6.5**

  - [ ]* 19.4 Write property test for API endpoint consistency
    - **Property 62: API endpoint consistency**
    - **Validates: Requirements 14.1**

  - [ ]* 19.5 Write property test for counter order structure
    - **Property 63: Counter order structure**
    - **Validates: Requirements 14.2**

  - [ ]* 19.6 Write property test for payment method support
    - **Property 67: Payment method support**
    - **Validates: Requirements 14.6**

  - [ ]* 19.7 Write property test for payment method availability from settings
    - **Property 68: Payment method availability from settings**
    - **Validates: Requirements 14.7**


- [x] 20. Final integration and testing
  - [x] 20.1 Wire all components together
    - Connect MobileCounterSalePage with all child components
    - Ensure proper prop passing and event handling
    - Test complete user flow from menu to payment to receipt
    - Verify all state updates work correctly
    - _Requirements: All requirements_

  - [x] 20.2 Test on real mobile devices
    - Test on iOS devices (iPhone, iPad)
    - Test on Android devices (various screen sizes)
    - Verify touch interactions work smoothly
    - Test keyboard behavior on both platforms
    - Verify thermal printing works on mobile
    - _Requirements: All mobile-specific requirements_

  - [x] 20.3 Performance testing and optimization
    - Measure initial render time (target: < 500ms)
    - Measure interaction response time (target: < 100ms)
    - Measure search performance (target: < 200ms)
    - Measure receipt generation time (target: < 100ms)
    - Optimize any slow operations
    - _Requirements: 10.1, 10.2, 3.5, 7.2_

  - [ ]* 20.4 Run accessibility audit
    - Use axe DevTools or Lighthouse for automated testing
    - Test with screen readers (VoiceOver, TalkBack)
    - Verify keyboard navigation works
    - Check color contrast ratios
    - Test with 200% text scaling
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7_

- [x] 21. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties
- Integration tests validate complete user flows
- The implementation uses JavaScript/TypeScript as specified in the design document
- All components should reuse existing utilities (apiWithRetry, processPaymentFast, validatePayment, printReceipt)
- The mobile page shares the same API endpoints and data structures as the desktop CounterSalePage
- Performance targets: 500ms initial render, 100ms interaction response, 200ms search, 100ms receipt generation
- Accessibility compliance: WCAG AA minimum (4.5:1 contrast for normal text, 3:1 for large text)
- Touch targets: Minimum 44x44px for all interactive elements
- Font sizes: Minimum 16px for input fields to prevent iOS zoom
