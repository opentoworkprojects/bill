# Design Document: Mobile Counter Sale Page

## Overview

This design specifies a mobile-optimized counter sale page for devices with screen width < 1024px. The implementation creates a new `MobileCounterSalePage` component that provides a touch-first, single-column layout optimized for fast billing on smartphones and tablets. The existing `CounterSalePage` remains unchanged for desktop users (>= 1024px).

The mobile version follows the PWAHomePage pattern with:
- Single-column vertical layout with bottom sheet cart
- Large touch targets (minimum 44x44px)
- Instant visual feedback (< 100ms)
- Offline-first data loading with caching
- Simplified payment flow with large buttons
- Performance targets: 500ms initial render, 100ms interaction response

### Key Design Decisions

1. **Separate Component vs Responsive**: Create a dedicated `MobileCounterSalePage` component rather than making `CounterSalePage` responsive. This allows mobile-specific optimizations without compromising the desktop experience.

2. **Routing Strategy**: Use a device detection wrapper component that renders the appropriate page based on screen width, with dynamic switching on resize.

3. **State Management**: Reuse existing state management patterns from `CounterSalePage` (React hooks) but optimize for mobile interactions.

4. **API Integration**: Use identical API endpoints and data structures as desktop version to ensure consistency.

5. **Offline-First**: Implement aggressive caching with background refresh to enable instant loading even on slow networks.

## Architecture

### Component Structure

```
MobileCounterSalePage (new)
├── MobileMenuSection
│   ├── SearchBar
│   ├── CategoryFilter
│   └── MenuItemGrid
├── MobileCartBottomSheet
│   ├── CartSummary
│   ├── CartItemList
│   └── ExpandButton
├── MobilePaymentModal
│   ├── PaymentMethodSelector
│   ├── AmountInput
│   └── CompleteButton
├── CustomerInfoModal (reused)
└── ReceiptModal (reused)

CounterSaleRouter (new wrapper)
├── DeviceDetector
├── MobileCounterSalePage (< 1024px)
└── CounterSalePage (>= 1024px)
```

### Routing Integration

Modify the existing route in `App.js`:

```javascript
// Before:
<Route path="/counter-sale" element={<CounterSalePage user={user} />} />

// After:
<Route path="/counter-sale" element={<CounterSaleRouter user={user} />} />
```

The `CounterSaleRouter` component detects device type and renders the appropriate page.

### Data Flow

```
User Action → Optimistic UI Update → API Call (background) → Cache Update
```

1. User taps menu item
2. Item immediately added to cart (optimistic)
3. Cart state updated in React
4. No API call needed (cart is client-side until checkout)
5. On payment completion:
   - Show success immediately
   - Create order in background
   - Process payment in background
   - Update cache
   - Trigger thermal print (fire-and-forget)

## Components and Interfaces

### 1. CounterSaleRouter Component

**Purpose**: Device detection and routing wrapper

**Props**:
```typescript
interface CounterSaleRouterProps {
  user: User;
}
```

**State**:
```typescript
{
  isMobile: boolean;  // true if window.innerWidth < 1024
}
```

**Behavior**:
- Detects screen width on mount
- Listens to window resize events
- Renders `MobileCounterSalePage` if width < 1024px
- Renders `CounterSalePage` if width >= 1024px
- Debounces resize events (300ms) to prevent excessive re-renders

### 2. MobileCounterSalePage Component

**Purpose**: Main mobile counter sale interface

**Props**:
```typescript
interface MobileCounterSalePageProps {
  user: User;
}
```

**State**:
```typescript
{
  // Menu data
  menuItems: MenuItem[];
  menuLoading: boolean;
  menuSearch: string;
  activeCategory: string;
  
  // Cart
  selectedItems: CartItem[];
  
  // Customer
  customerName: string;
  customerPhone: string;
  
  // Pricing
  discountType: 'amount' | 'percent';
  discountValue: string;
  subtotal: number;
  discountAmount: number;
  tax: number;
  total: number;
  
  // Payment
  paymentMethod: 'cash' | 'card' | 'upi' | 'credit' | 'split';
  receivedAmount: string;
  cashAmount: string;
  cardAmount: string;
  upiAmount: string;
  
  // UI state
  cartExpanded: boolean;
  paymentModalOpen: boolean;
  customerModalOpen: boolean;
  receiptModalOpen: boolean;
  processing: boolean;
  
  // Settings
  businessSettings: BusinessSettings;
  subscriptionStatus: SubscriptionStatus;
  
  // Completed sale
  completedSaleOrder: Order | null;
}
```

**Key Methods**:
- `handleAddItem(menuItem)`: Add item to cart with haptic feedback
- `adjustItemQuantity(menuItemId, delta)`: Update quantity
- `toggleCart()`: Expand/collapse bottom sheet
- `openPaymentModal()`: Open payment flow
- `completeSale()`: Process payment and create order
- `resetSale()`: Clear cart and start new sale

### 3. MobileMenuSection Component

**Purpose**: Display menu items in touch-optimized grid

**Props**:
```typescript
interface MobileMenuSectionProps {
  menuItems: MenuItem[];
  selectedItems: CartItem[];
  menuSearch: string;
  activeCategory: string;
  onSearchChange: (search: string) => void;
  onCategoryChange: (category: string) => void;
  onAddItem: (item: MenuItem) => void;
  onAdjustQuantity: (menuItemId: string, delta: number) => void;
  loading: boolean;
}
```

**Layout**:
- Full-width search bar at top (font-size: 16px to prevent iOS zoom)
- Horizontal scrolling category chips
- Grid of menu items (2 columns on small phones, 3 on larger phones/tablets)
- Each item: circular image/emoji, name, price, quantity badge
- Tap anywhere on item to add
- Quantity controls appear when item is in cart

### 4. MobileCartBottomSheet Component

**Purpose**: Collapsible cart summary at bottom of screen

**Props**:
```typescript
interface MobileCartBottomSheetProps {
  selectedItems: CartItem[];
  subtotal: number;
  discountAmount: number;
  tax: number;
  total: number;
  expanded: boolean;
  onToggle: () => void;
  onAdjustQuantity: (menuItemId: string, delta: number) => void;
  onCheckout: () => void;
}
```

**States**:
- **Collapsed**: Shows item count, total, and "View Cart" button (height: 80px)
- **Expanded**: Shows full item list with quantity controls (height: 60% of screen)

**Behavior**:
- Swipe up to expand, swipe down to collapse
- Tap outside to collapse
- Smooth animation (300ms ease-out)
- Fixed to bottom of screen (position: fixed)

### 5. MobilePaymentModal Component

**Purpose**: Full-screen payment interface

**Props**:
```typescript
interface MobilePaymentModalProps {
  total: number;
  paymentMethod: PaymentMethod;
  paymentOptions: PaymentOption[];
  receivedAmount: string;
  cashAmount: string;
  cardAmount: string;
  upiAmount: string;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  onReceivedAmountChange: (amount: string) => void;
  onCashAmountChange: (amount: string) => void;
  onCardAmountChange: (amount: string) => void;
  onUpiAmountChange: (amount: string) => void;
  onComplete: () => void;
  onCancel: () => void;
  processing: boolean;
}
```

**Layout**:
- Full-screen modal (100vh)
- Large payment method buttons (grid, 2 columns, 60px height)
- Amount input with large font (24px)
- Quick amount buttons (Exact, 50%, Round)
- Large "Complete Sale" button at bottom (56px height)
- Shows change/balance calculation

### 6. CustomerInfoModal Component

**Purpose**: Capture customer details (reused from desktop)

**Props**: Same as desktop version

**Mobile Optimizations**:
- Full-screen on small devices
- Large input fields (48px height)
- Numeric keyboard for phone input (inputMode="tel")
- Auto-focus on name field

### 7. ReceiptModal Component

**Purpose**: Show sale completion and print options (reused from desktop)

**Props**: Same as desktop version

**Mobile Optimizations**:
- Full-screen on small devices
- Large buttons (56px height)
- Success animation (checkmark)
- Auto-dismiss after 3 seconds (optional)

## Data Models

### MenuItem
```typescript
interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  image_url?: string;
  available: boolean;
}
```

### CartItem
```typescript
interface CartItem {
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
  notes: string;
}
```

### BusinessSettings
```typescript
interface BusinessSettings {
  currency: string;
  tax_rate: number;
  payment_methods_enabled: {
    cash: boolean;
    card: boolean;
    upi: boolean;
  };
  credit_payment_enabled: boolean;
  credit_requires_customer_info: boolean;
  print_customization: {
    auto_print: boolean;
  };
}
```

### SubscriptionStatus
```typescript
interface SubscriptionStatus {
  subscription_active: boolean;
  bill_count: number;
  needs_subscription: boolean;
}
```

### Order
```typescript
interface Order {
  id: string;
  items: CartItem[];
  customer_name: string;
  customer_phone: string;
  order_type: 'takeaway';
  table_id: 'counter';
  subtotal: number;
  tax: number;
  tax_rate: number;
  total: number;
  discount: number;
  discount_amount: number;
  discount_type: 'amount' | 'percent';
  payment_method: PaymentMethod;
  payment_received: number;
  balance_amount: number;
  is_credit: boolean;
  status: 'completed';
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies:

- **1.5 and 1.2**: Both test that desktop users see CounterSalePage (redundant)
- **6.2 and 2.6**: Both test font-size >= 16px for inputs (redundant)

These redundant properties will be consolidated into single comprehensive properties.

### Property 1: Device-based routing

*For any* screen width, the counter sale route should render MobileCounterSalePage if width < 1024px, and CounterSalePage if width >= 1024px.

**Validates: Requirements 1.1, 1.2, 1.3, 1.5**

### Property 2: Dynamic device switching

*For any* initial screen width, when the screen is resized across the 1024px threshold, the system should switch to the appropriate page component.

**Validates: Requirements 1.4**

### Property 3: Touch target minimum size

*For all* interactive elements on MobileCounterSalePage (buttons, links, inputs), the element dimensions should be at least 44x44px.

**Validates: Requirements 2.5, 4.1, 5.1**

### Property 4: Input font size for iOS zoom prevention

*For all* input fields on MobileCounterSalePage, the font-size should be >= 16px to prevent automatic zoom on iOS.

**Validates: Requirements 2.6, 6.2**

### Property 5: Full-width primary buttons

*For all* primary action buttons on MobileCounterSalePage, the width should be 100% of the container.

**Validates: Requirements 2.4**

### Property 6: Add to cart immediately

*For any* menu item, when tapped, the item should be added to the cart immediately (within 100ms).

**Validates: Requirements 3.1, 3.3**

### Property 7: Quantity increment on duplicate add

*For any* menu item already in the cart, when tapped again, the quantity should increment by 1.

**Validates: Requirements 3.2**

### Property 8: Item emoji display

*For all* menu items displayed, each item should have an emoji icon for visual identification.

**Validates: Requirements 3.4**

### Property 9: Search performance

*For any* search query, the filtered results should appear within 200ms of input.

**Validates: Requirements 3.5**

### Property 10: Category filtering

*For any* category selection, only items from that category (or all items if "all" is selected) should be displayed.

**Validates: Requirements 3.6**

### Property 11: Recently added item highlight

*For any* item addition, the most recently added item should have a visual highlight in the menu.

**Validates: Requirements 3.7**

### Property 12: Remove item when quantity reaches zero

*For any* cart item, when the minus button is tapped and quantity reaches 0, the item should be removed from the cart.

**Validates: Requirements 4.2**

### Property 13: Cart item count badge

*For any* cart state, the cart icon badge should display the total number of items (sum of all quantities).

**Validates: Requirements 4.5**

### Property 14: Payment method visual distinction

*For any* selected payment method, that method's button should have visual distinction (different color/style) from unselected methods.

**Validates: Requirements 5.2**

### Property 15: Cash change calculation

*For any* cash payment where received amount > total, the system should display the correct change amount (received - total).

**Validates: Requirements 5.3**

### Property 16: Credit payment customer info requirement

*For any* credit payment when Business_Settings.credit_requires_customer_info is true, the system should require both customer name and phone before completing the sale.

**Validates: Requirements 5.4, 9.1, 9.2**

### Property 17: Payment processing performance

*For any* payment completion, the system should show success feedback within 500ms of the complete button tap.

**Validates: Requirements 5.6**

### Property 18: Split payment validation

*For any* split payment, the sum of cash_amount + card_amount + upi_amount should equal the total, or the system should show an error with the difference.

**Validates: Requirements 5.7, 12.6**

### Property 19: Numeric keyboard for amount inputs

*For all* amount input fields, the inputMode or type attribute should be set to trigger numeric keyboards.

**Validates: Requirements 6.4**

### Property 20: Tel keyboard for phone inputs

*For all* phone number input fields, the inputMode should be "tel" to trigger telephone keyboards.

**Validates: Requirements 6.5**

### Property 21: Auto-print based on settings

*For any* completed sale, thermal printing should be triggered automatically if and only if Business_Settings.print_customization.auto_print is true.

**Validates: Requirements 7.1**

### Property 22: Receipt generation performance

*For any* payment completion, the receipt content should be generated within 100ms.

**Validates: Requirements 7.2**

### Property 23: Print failure retry

*For any* thermal print failure, the system should display a retry button.

**Validates: Requirements 7.4**

### Property 24: Manual print support

*For any* completed sale, the system should provide a manual print button that triggers receipt printing.

**Validates: Requirements 7.5**

### Property 25: Receipt completeness

*For any* generated receipt, it should include all transaction details: items, subtotal, tax, discount, total, payment method, and customer info (if provided).

**Validates: Requirements 7.6**

### Property 26: Receipt formatting from settings

*For any* receipt generation, the format should respect Business_Settings preferences (currency, tax rate, business name, etc).

**Validates: Requirements 7.7**

### Property 27: Menu caching

*For any* successful menu load, the menu items should be stored in localStorage for offline access.

**Validates: Requirements 8.1**

### Property 28: Immediate cache display

*For any* page load when cached menu exists, the cached menu items should be displayed before the API call completes.

**Validates: Requirements 8.2**

### Property 29: Background refresh after cache

*For any* page load with cached data, an API call to refresh menu items should be initiated in the background.

**Validates: Requirements 8.3**

### Property 30: Stale cache indicator

*For any* cached data older than 5 minutes, the system should display a refresh indicator.

**Validates: Requirements 8.4**

### Property 31: Settings caching

*For any* successful settings load, the Business_Settings should be cached in localStorage.

**Validates: Requirements 8.5**

### Property 32: Offline transaction queuing

*For any* transaction when network is unavailable, the transaction should be queued in localStorage for later sync.

**Validates: Requirements 8.6**

### Property 33: Offline indicator

*For any* offline state, the system should display a network status indicator.

**Validates: Requirements 8.7**

### Property 34: Customer info in order

*For any* completed sale with customer name or phone provided, the order should include that customer information.

**Validates: Requirements 9.4**

### Property 35: Recent customer auto-fill

*For any* customer info modal opening, if recent customers exist, the system should provide auto-fill suggestions.

**Validates: Requirements 9.5**

### Property 36: Phone number validation

*For any* phone number input, the system should validate that it matches the expected format (10 digits for India).

**Validates: Requirements 9.6**

### Property 37: Optional customer info for non-credit

*For any* non-credit payment, the sale should complete successfully even if customer info is not provided.

**Validates: Requirements 9.7**

### Property 38: Initial render performance

*For any* navigation to MobileCounterSalePage, the initial UI should render within 500ms.

**Validates: Requirements 10.1**

### Property 39: Interaction response performance

*For any* user interaction (tap, input), the system should respond with visual feedback within 100ms.

**Validates: Requirements 10.2, 3.3**

### Property 40: Optimistic cart updates

*For any* cart operation (add, remove, adjust quantity), the UI should update immediately before any API call.

**Validates: Requirements 10.3**

### Property 41: Lazy image loading

*For all* menu item images, the loading attribute should be set to "lazy" for performance.

**Validates: Requirements 10.4**

### Property 42: Search debouncing

*For any* search input, filtering should be debounced to prevent execution on every keystroke (minimum 150ms delay).

**Validates: Requirements 10.5**

### Property 43: Virtual scrolling for large lists

*For any* menu with more than 100 items, virtual scrolling should be implemented to render only visible items.

**Validates: Requirements 10.6**

### Property 44: Button press animation

*For any* button tap, the button should show a press animation (scale down effect).

**Validates: Requirements 11.1**

### Property 45: Add to cart animation

*For any* item added to cart, a success animation should be displayed.

**Validates: Requirements 11.2**

### Property 46: Sale completion animation

*For any* completed sale, a success checkmark animation should be displayed.

**Validates: Requirements 11.3**

### Property 47: Smooth state transitions

*For all* state transitions (modal open/close, cart expand/collapse), the transition duration should be less than 300ms.

**Validates: Requirements 11.5**

### Property 48: Skeleton loaders

*For any* loading state, skeleton loaders should be displayed instead of spinners.

**Validates: Requirements 11.6**

### Property 49: Payment status color coding

*For any* payment status display, paid status should use green color and credit status should use orange color.

**Validates: Requirements 11.7**

### Property 50: Invalid payment amount errors

*For any* invalid payment amount (negative, non-numeric, exceeds reasonable limits), the system should show an error message describing the specific issue.

**Validates: Requirements 12.2**

### Property 51: Network failure retry

*For any* failed network request, the system should display a retry option.

**Validates: Requirements 12.3**

### Property 52: Subscription limit handling

*For any* sale attempt when subscription limit is reached, the system should redirect to the subscription page with an explanation.

**Validates: Requirements 12.4**

### Property 53: Payment amount validation

*For all* payment amounts, the system should validate that amounts are non-negative numbers before processing.

**Validates: Requirements 12.5**

### Property 54: Error logging

*For any* error, the system should log the error to console while displaying a user-friendly message.

**Validates: Requirements 12.7**

### Property 55: Semantic HTML

*For all* UI elements, semantic HTML elements should be used (button for buttons, nav for navigation, etc).

**Validates: Requirements 13.1**

### Property 56: ARIA labels for icon buttons

*For all* icon-only buttons, an aria-label attribute should be provided for screen readers.

**Validates: Requirements 13.2**

### Property 57: Keyboard navigation support

*For all* interactive elements, keyboard navigation should work (tab order, enter/space activation).

**Validates: Requirements 13.3**

### Property 58: Color contrast compliance

*For all* text and interactive elements, the color contrast ratio should meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text).

**Validates: Requirements 13.4**

### Property 59: Text scaling support

*For any* text scaling up to 200%, the interface should remain functional and readable.

**Validates: Requirements 13.5**

### Property 60: Focus indicators

*For all* interactive elements, visible focus indicators should be provided for keyboard navigation.

**Validates: Requirements 13.6**

### Property 61: Screen reader announcements

*For any* important state change (item added, sale completed, error), the change should be announced to screen readers via aria-live regions.

**Validates: Requirements 13.7**

### Property 62: API endpoint consistency

*For all* API calls from MobileCounterSalePage, the same endpoints should be used as CounterSalePage.

**Validates: Requirements 14.1**

### Property 63: Counter order structure

*For any* order created from MobileCounterSalePage, the order_type should be "takeaway" and table_id should be "counter".

**Validates: Requirements 14.2**

### Property 64: Payment completed event dispatch

*For any* successful payment, a paymentCompleted event should be dispatched with order details.

**Validates: Requirements 14.3**

### Property 65: Cache invalidation after payment

*For any* successful payment, the billing cache should be invalidated to ensure fresh data on next load.

**Validates: Requirements 14.4**

### Property 66: Bill count increment

*For any* completed sale, the subscription status bill_count should increment by 1.

**Validates: Requirements 14.5**

### Property 67: Payment method support

*For all* payment methods (cash, card, UPI, credit, split), the system should support processing that payment type.

**Validates: Requirements 14.6**

### Property 68: Payment method availability from settings

*For any* payment method, it should only be displayed if enabled in Business_Settings.payment_methods_enabled (or if the setting is undefined, default to enabled).

**Validates: Requirements 14.7**

## Error Handling

### Client-Side Errors

1. **Empty Cart Validation**
   - Check: `selectedItems.length === 0`
   - Action: Show toast error "Add at least one item to continue"
   - Prevent: Payment modal from opening

2. **Invalid Payment Amount**
   - Check: Amount is negative, non-numeric, or unreasonably large
   - Action: Show toast error with specific issue
   - Prevent: Payment processing

3. **Split Payment Mismatch**
   - Check: `Math.abs(splitTotal - orderTotal) > 0.01`
   - Action: Show inline error "Split amounts must equal total"
   - Prevent: Complete button from working

4. **Missing Customer Info for Credit**
   - Check: `paymentMethod === 'credit' && creditRequiresCustomerInfo && (!customerName || !customerPhone)`
   - Action: Open customer modal, show toast error
   - Prevent: Payment processing until info provided

5. **Invalid Phone Format**
   - Check: Phone doesn't match expected pattern (10 digits for India)
   - Action: Show inline validation error
   - Prevent: Form submission

6. **Subscription Limit Reached**
   - Check: `needsSubscription === true`
   - Action: Show toast error, redirect to /subscription
   - Prevent: Order creation

### Network Errors

1. **Menu Load Failure**
   - Fallback: Display cached menu if available
   - Action: Show toast "Using cached menu, refresh to update"
   - Retry: Provide manual refresh button

2. **Order Creation Failure**
   - Fallback: Queue order in localStorage for later sync
   - Action: Show toast "Order saved offline, will sync when online"
   - Retry: Automatic retry when network restored

3. **Payment Processing Failure**
   - Fallback: None (critical operation)
   - Action: Show toast with error message, provide retry button
   - Retry: Manual retry via button

4. **Print Failure**
   - Fallback: Show print preview, allow manual print
   - Action: Show toast "Print failed, tap to retry"
   - Retry: Manual retry via button

### State Recovery

1. **Interrupted Sale**
   - Save cart state to localStorage on every change
   - On page reload, offer to restore previous cart
   - Clear saved state after successful completion

2. **Network Restoration**
   - Detect online event
   - Process queued transactions automatically
   - Show toast "Syncing offline orders..."

3. **Session Expiration**
   - Detect 401 response
   - Save current cart state
   - Redirect to login with return URL
   - Restore cart after re-authentication

## Testing Strategy

### Unit Testing

The mobile counter sale page requires comprehensive unit tests for calculation logic, validation, and state management. Unit tests should focus on:

1. **Calculation Functions**
   - Subtotal calculation: `sum(item.price * item.quantity)`
   - Discount calculation: amount vs percentage
   - Tax calculation: `(subtotal - discount) * taxRate / 100`
   - Total calculation: `subtotal - discount + tax`
   - Change calculation: `received - total`
   - Split payment validation: `cash + card + upi + credit === total`

2. **Validation Logic**
   - Empty cart validation
   - Payment amount validation (non-negative, numeric)
   - Phone number format validation
   - Customer info requirement for credit sales
   - Split payment sum validation

3. **State Management**
   - Add item to cart (new item)
   - Add item to cart (existing item - increment quantity)
   - Remove item from cart (quantity = 0)
   - Adjust item quantity (+ and -)
   - Clear cart
   - Payment method selection

4. **Device Detection**
   - Screen width < 1024px returns true (mobile)
   - Screen width >= 1024px returns false (desktop)
   - Resize event triggers re-detection

5. **Caching Logic**
   - Menu items saved to localStorage after load
   - Cached items loaded on mount
   - Cache age calculation
   - Stale cache detection (> 5 minutes)

### Property-Based Testing

Property-based testing is essential for verifying universal properties across all possible inputs. Use **fast-check** (JavaScript property-based testing library) with minimum 100 iterations per test.

Each property test must include a comment tag referencing the design property:

```javascript
// Feature: mobile-counter-sale-page, Property 1: Device-based routing
```

**Key Property Tests**:

1. **Property 1: Device-based routing**
   - Generate: Random screen widths (300-2000px)
   - Test: Correct component rendered based on width threshold
   - Tag: `Feature: mobile-counter-sale-page, Property 1: Device-based routing`

2. **Property 6: Add to cart immediately**
   - Generate: Random menu items
   - Test: Item appears in cart within 100ms
   - Tag: `Feature: mobile-counter-sale-page, Property 6: Add to cart immediately`

3. **Property 7: Quantity increment on duplicate add**
   - Generate: Random menu items, random initial quantities
   - Test: Adding existing item increments quantity by 1
   - Tag: `Feature: mobile-counter-sale-page, Property 7: Quantity increment on duplicate add`

4. **Property 15: Cash change calculation**
   - Generate: Random totals, random received amounts (> total)
   - Test: Change = received - total
   - Tag: `Feature: mobile-counter-sale-page, Property 15: Cash change calculation`

5. **Property 18: Split payment validation**
   - Generate: Random totals, random split amounts
   - Test: Error shown if sum ≠ total, success if sum = total
   - Tag: `Feature: mobile-counter-sale-page, Property 18: Split payment validation`

6. **Property 25: Receipt completeness**
   - Generate: Random orders with various items, payments, customers
   - Test: Receipt contains all required fields
   - Tag: `Feature: mobile-counter-sale-page, Property 25: Receipt completeness`

7. **Property 36: Phone number validation**
   - Generate: Random strings (valid and invalid phone formats)
   - Test: Validation passes for 10-digit numbers, fails otherwise
   - Tag: `Feature: mobile-counter-sale-page, Property 36: Phone number validation`

8. **Property 53: Payment amount validation**
   - Generate: Random payment amounts (including negative, zero, very large)
   - Test: Validation rejects negative/invalid, accepts valid positive amounts
   - Tag: `Feature: mobile-counter-sale-page, Property 53: Payment amount validation`

**Property Test Configuration**:
```javascript
import fc from 'fast-check';

fc.assert(
  fc.property(
    fc.integer({ min: 300, max: 2000 }), // screen width
    (width) => {
      // Test logic here
    }
  ),
  { numRuns: 100 } // Minimum 100 iterations
);
```

### Integration Testing

Integration tests verify the complete flow from user action to API call to UI update:

1. **Complete Sale Flow**
   - Add items to cart
   - Select payment method
   - Enter payment amount
   - Complete sale
   - Verify: Order created, payment processed, receipt shown, cart cleared

2. **Credit Sale with Customer Info**
   - Add items to cart
   - Select credit payment
   - Attempt to complete (should block)
   - Enter customer info
   - Complete sale
   - Verify: Customer info included in order

3. **Offline Mode**
   - Disconnect network
   - Add items to cart
   - Complete sale
   - Verify: Order queued in localStorage
   - Reconnect network
   - Verify: Order synced to server

4. **Device Switching**
   - Load page on mobile width
   - Verify: MobileCounterSalePage rendered
   - Resize to desktop width
   - Verify: CounterSalePage rendered

### Performance Testing

Performance tests verify that the mobile page meets speed requirements:

1. **Initial Render Time**
   - Measure: Time from navigation to first paint
   - Target: < 500ms
   - Test: Use React Profiler or browser Performance API

2. **Interaction Response Time**
   - Measure: Time from tap to visual feedback
   - Target: < 100ms
   - Test: Use performance.now() before and after state update

3. **Search Performance**
   - Measure: Time from input to filtered results
   - Target: < 200ms
   - Test: Generate large menu (1000 items), measure filter time

4. **Receipt Generation Time**
   - Measure: Time from payment completion to receipt ready
   - Target: < 100ms
   - Test: Generate order, measure receipt generation

### Accessibility Testing

Accessibility tests ensure the mobile page is usable with assistive technologies:

1. **Screen Reader Testing**
   - Tool: NVDA (Windows), VoiceOver (iOS/Mac)
   - Test: Navigate entire flow with screen reader
   - Verify: All actions announced, all buttons labeled

2. **Keyboard Navigation**
   - Test: Complete sale using only keyboard (external keyboard on tablet)
   - Verify: All elements reachable, focus visible, logical tab order

3. **Color Contrast**
   - Tool: axe DevTools, Lighthouse
   - Test: Scan all pages for contrast issues
   - Verify: All text meets WCAG AA (4.5:1 for normal, 3:1 for large)

4. **Touch Target Size**
   - Tool: Manual measurement or automated accessibility scanner
   - Test: Measure all interactive elements
   - Verify: All buttons/links >= 44x44px

5. **Text Scaling**
   - Test: Increase browser font size to 200%
   - Verify: No text overlap, all content readable, no horizontal scroll

### Visual Regression Testing

Visual regression tests catch unintended UI changes:

1. **Tool**: Percy, Chromatic, or Playwright screenshots
2. **Scenarios**:
   - Empty cart state
   - Cart with items
   - Payment modal (each payment method)
   - Customer info modal
   - Receipt modal
   - Error states
   - Loading states
3. **Devices**: Test on multiple viewport sizes (375px, 768px, 1023px)

### Test Coverage Goals

- **Unit Tests**: 80% code coverage minimum
- **Property Tests**: All calculation and validation logic
- **Integration Tests**: All critical user flows
- **Performance Tests**: All performance requirements (< 500ms, < 100ms, < 200ms)
- **Accessibility Tests**: WCAG AA compliance
- **Visual Regression**: All major UI states

### Continuous Integration

All tests should run automatically on:
- Every pull request
- Every commit to main branch
- Nightly builds (full test suite including visual regression)

Failed tests should block deployment to production.
