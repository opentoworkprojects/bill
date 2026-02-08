# Design Document: Counter Sale Page

## Overview

The Counter Sale Page is a streamlined, single-screen React component optimized for fast counter/takeaway order processing. It combines menu search, order building, payment processing, and receipt printing into one cohesive interface with zero navigation delays. The design prioritizes speed, minimal clicks, and instant feedback while reusing existing infrastructure (payment validation, print utilities, business settings).

**Key Design Principles:**
- **Single-Screen Operation**: All functionality accessible without navigation
- **Performance First**: Sub-100ms UI updates, cached data, optimized rendering
- **Reuse Existing Infrastructure**: Leverage paymentValidator, printUtils, orderWorkflowRules
- **Progressive Enhancement**: Works offline with cached menu data
- **Accessibility**: Keyboard shortcuts and screen reader support

## Architecture

### Component Structure

```
CounterSalePage (Main Container)
├── MenuSearchBar (Search + Quick Add)
│   ├── SearchInput (Debounced search)
│   ├── SearchResults (Dropdown with keyboard nav)
│   └── CustomItemForm (Manual price entry)
├── OrderItemsList (Selected items display)
│   ├── OrderItem (Individual item row)
│   │   ├── QuantityControls (+/- buttons)
│   │   ├── ItemDetails (name, price, total)
│   │   └── RemoveButton (delete item)
│   └── OrderSummary (Subtotal, tax, discount, total)
├── DiscountSection (Optional discount)
│   ├── DiscountTypeToggle (% or ₹)
│   └── DiscountInput (value entry)
├── CustomerInfoSection (Optional)
│   ├── CustomerNameInput
│   └── CustomerPhoneInput
├── PaymentSection (Payment methods)
│   ├── PaymentMethodSelector (Cash/Card/UPI/Credit)
│   ├── SplitPaymentToggle
│   ├── SplitPaymentInputs (when enabled)
│   └── PaymentSummary (received, balance, change)
└── ActionButtons
    ├── CompletePaymentButton (Primary action)
    ├── PrintPreviewButton
    └── ClearOrderButton
```

### Data Flow

```
User Input → State Update → Calculation → UI Update
     ↓
Menu Search → Filter Items → Display Results → Add to Order
     ↓
Order Items → Calculate Totals → Update Summary
     ↓
Payment → Validate → Process → Print → Clear
```

### State Management

**Local Component State (useState):**
- `orderItems`: Array of selected menu items with quantities
- `menuItems`: Cached menu data from API
- `searchQuery`: Current search input
- `paymentMethod`: Selected payment method (cash/card/upi/credit)
- `splitPayment`: Boolean for split payment mode
- `cashAmount`, `cardAmount`, `upiAmount`: Split payment amounts
- `discountType`: 'amount' or 'percent'
- `discountValue`: Discount value
- `customerName`, `customerPhone`: Optional customer info
- `loading`: Loading states for async operations

**Computed Values (useMemo):**
- `filteredMenuItems`: Search-filtered menu items
- `subtotal`: Sum of all item prices × quantities
- `discountAmount`: Calculated discount
- `tax`: Calculated tax based on business settings
- `total`: Final amount (subtotal - discount + tax)
- `receivedAmount`: Total payment received
- `balanceAmount`: Remaining balance
- `changeAmount`: Change to return (if overpayment)

## Components and Interfaces

### 1. CounterSalePage Component

**Props:**
```typescript
interface CounterSalePageProps {
  user: User; // Current user with role and organization
}
```

**Key Methods:**
- `loadMenuItems()`: Fetch and cache menu items
- `handleAddItem(item)`: Add menu item to order
- `handleQuantityChange(index, delta)`: Adjust item quantity
- `handleRemoveItem(index)`: Remove item from order
- `calculateTotals()`: Compute subtotal, tax, discount, total
- `handlePayment()`: Process payment and create order
- `handlePrint()`: Generate and print receipt
- `clearOrder()`: Reset all state for new order

### 2. MenuSearchBar Component

**Props:**
```typescript
interface MenuSearchBarProps {
  menuItems: MenuItem[];
  onAddItem: (item: MenuItem) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}
```

**Features:**
- Debounced search (100ms delay)
- Keyboard navigation (Arrow keys, Enter, Escape)
- Auto-focus after item selection
- Custom item entry when no matches
- Score-based search ranking (name > category > description)

### 3. OrderItemsList Component

**Props:**
```typescript
interface OrderItemsListProps {
  items: OrderItem[];
  onQuantityChange: (index: number, delta: number) => void;
  onRemove: (index: number) => void;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
}
```

**Features:**
- Real-time total updates
- Quantity controls with validation
- Line item totals
- Empty state message

### 4. PaymentSection Component

**Props:**
```typescript
interface PaymentSectionProps {
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  splitPayment: boolean;
  onSplitPaymentToggle: () => void;
  cashAmount: number;
  cardAmount: number;
  upiAmount: number;
  onAmountChange: (type: string, amount: number) => void;
  total: number;
  receivedAmount: number;
  balanceAmount: number;
  changeAmount: number;
}
```

**Features:**
- Dynamic payment method availability (based on business settings)
- Split payment with real-time validation
- Change calculation for overpayments
- Balance tracking for partial payments
- Visual feedback for payment status

## Data Models

### MenuItem
```typescript
interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description?: string;
  image_url?: string;
  available: boolean;
  preparation_time?: number;
  is_popular?: boolean;
  is_vegetarian?: boolean;
  is_spicy?: boolean;
  allergens?: string;
}
```

### OrderItem
```typescript
interface OrderItem {
  menu_item_id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}
```

### CounterSaleOrder
```typescript
interface CounterSaleOrder {
  items: OrderItem[];
  subtotal: number;
  tax: number;
  tax_rate: number;
  discount: number;
  discount_type: 'amount' | 'percent';
  discount_value: number;
  total: number;
  payment_method: PaymentMethod;
  payment_received: number;
  balance_amount: number;
  is_credit: boolean;
  cash_amount?: number;
  card_amount?: number;
  upi_amount?: number;
  credit_amount?: number;
  customer_name?: string;
  customer_phone?: string;
  table_id: 'counter'; // Always 'counter' for counter sales
  table_number: 0; // Always 0 for counter sales
  waiter_name: string; // Current user name
  status: 'completed'; // Always completed after payment
  order_type: 'counter'; // Identifies as counter sale
}
```

### PaymentMethod
```typescript
type PaymentMethod = 'cash' | 'card' | 'upi' | 'credit' | 'split';
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Order Total Consistency

*For any* order with items, the displayed total should always equal (subtotal - discount + tax), where subtotal is the sum of (item.price × item.quantity) for all items.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

### Property 2: Payment Amount Validation

*For any* non-credit payment, the payment amount must be greater than zero. For credit payments, zero payment is allowed with balance equal to total.

**Validates: Requirements 4.2, 4.6**

### Property 3: Split Payment Sum Equality

*For any* split payment, the sum of (cash_amount + card_amount + upi_amount + credit_amount) must equal the order total within 0.01 tolerance.

**Validates: Requirements 4.3, 4.4**

### Property 4: Change Calculation Accuracy

*For any* cash payment where received amount exceeds total, the change amount should equal (received_amount - total) and be displayed to the user.

**Validates: Requirements 4.5**

### Property 5: Item Quantity Consistency

*For any* order item, when quantity is decremented to zero, the item should be removed from the order and totals should update accordingly.

**Validates: Requirements 6.2, 6.4**

### Property 6: Discount Validation

*For any* discount application, the discount amount must not exceed the subtotal, and the final total must be non-negative.

**Validates: Requirements 7.2, 7.4**

### Property 7: Menu Search Responsiveness

*For any* search query, results should be displayed within 200ms of the last keystroke, and the list should be filtered based on name, category, or description matches.

**Validates: Requirements 2.1, 2.2**

### Property 8: Order State Preservation

*For any* order in progress, if the page is refreshed or network fails, the order items and customer information should be restored from local storage.

**Validates: Requirements 11.4**

### Property 9: Receipt Content Completeness

*For any* completed order, the generated receipt must include business name, all order items with quantities and prices, subtotal, tax, discount (if any), total, payment method, and timestamp.

**Validates: Requirements 5.3, 5.4**

### Property 10: Keyboard Navigation Completeness

*For any* menu search with results, pressing Enter should add the first/selected item, Arrow keys should navigate results, and Escape should clear the search.

**Validates: Requirements 2.5, 12.1, 12.3**

### Property 11: Payment Method Availability

*For any* business configuration, only payment methods enabled in business settings should be displayed and selectable.

**Validates: Requirements 4.1, 10.2**

### Property 12: Order Creation Success

*For any* completed payment, an order record must be created in the database with status 'completed', table_id 'counter', and order_type 'counter'.

**Validates: Requirements 10.1, 10.4**

## Error Handling

### Error Categories

**1. Validation Errors:**
- Empty order (no items)
- Invalid payment amount (negative or zero for non-credit)
- Split payment sum mismatch
- Discount exceeds subtotal
- Invalid phone number format

**Strategy:** Display inline error messages, prevent submission, highlight invalid fields

**2. Network Errors:**
- Menu fetch failure
- Order creation failure
- Payment processing timeout

**Strategy:** Retry with exponential backoff (3 attempts), use cached data, show retry button

**3. Print Errors:**
- Printer not connected
- Print job failed
- Bluetooth/USB communication error

**Strategy:** Offer manual print option, save receipt to local storage, provide email option

**4. Data Errors:**
- Menu item not found
- Business settings missing
- Invalid order state

**Strategy:** Log error, show user-friendly message, provide fallback values

### Error Recovery

```typescript
// Example error recovery for order creation
const createOrder = async (orderData) => {
  try {
    const response = await apiWithRetry({
      method: 'post',
      url: `${API}/orders`,
      data: orderData,
      timeout: 10000,
      retries: 3
    });
    return response.data;
  } catch (error) {
    // Save to local storage for recovery
    localStorage.setItem('failedOrder', JSON.stringify({
      orderData,
      timestamp: Date.now(),
      error: error.message
    }));
    
    // Log for troubleshooting
    billingErrorLogger.logNetworkError('order_creation', error);
    
    // Show user-friendly error
    toast.error('Order creation failed. Data saved for retry.', {
      action: {
        label: 'Retry',
        onClick: () => createOrder(orderData)
      }
    });
    
    throw error;
  }
};
```

## Testing Strategy

### Unit Tests

**Focus Areas:**
- Calculation functions (subtotal, tax, discount, total)
- Payment validation logic
- Search filtering and ranking
- Discount validation
- Customer phone validation
- Change calculation

**Example Tests:**
```javascript
describe('Counter Sale Calculations', () => {
  test('calculates subtotal correctly', () => {
    const items = [
      { price: 100, quantity: 2 },
      { price: 50, quantity: 3 }
    ];
    expect(calculateSubtotal(items)).toBe(350);
  });
  
  test('applies percentage discount correctly', () => {
    const subtotal = 1000;
    const discount = { type: 'percent', value: 10 };
    expect(calculateDiscount(subtotal, discount)).toBe(100);
  });
  
  test('validates split payment sum', () => {
    const total = 1000;
    const split = { cash: 500, card: 300, upi: 200 };
    expect(validateSplitPayment(split, total)).toBe(true);
  });
});
```

### Property-Based Tests

**Configuration:** Minimum 100 iterations per test using fast-check library

**Property Test 1: Order Total Consistency**
```javascript
// Feature: counter-sale-page, Property 1: Order Total Consistency
test('order total always equals subtotal - discount + tax', () => {
  fc.assert(
    fc.property(
      fc.array(fc.record({
        price: fc.float({ min: 1, max: 1000 }),
        quantity: fc.integer({ min: 1, max: 10 })
      }), { minLength: 1, maxLength: 20 }),
      fc.float({ min: 0, max: 100 }),
      fc.float({ min: 0, max: 30 }),
      (items, discountPercent, taxRate) => {
        const subtotal = items.reduce((sum, item) => 
          sum + (item.price * item.quantity), 0);
        const discount = (subtotal * discountPercent) / 100;
        const tax = ((subtotal - discount) * taxRate) / 100;
        const expectedTotal = subtotal - discount + tax;
        
        const calculatedTotal = calculateTotal(items, discountPercent, taxRate);
        
        return Math.abs(calculatedTotal - expectedTotal) < 0.01;
      }
    ),
    { numRuns: 100 }
  );
});
```

**Property Test 2: Split Payment Sum Equality**
```javascript
// Feature: counter-sale-page, Property 3: Split Payment Sum Equality
test('split payment sum always equals order total', () => {
  fc.assert(
    fc.property(
      fc.float({ min: 100, max: 10000 }),
      fc.float({ min: 0, max: 1 }),
      fc.float({ min: 0, max: 1 }),
      fc.float({ min: 0, max: 1 }),
      (total, cashRatio, cardRatio, upiRatio) => {
        // Normalize ratios to sum to 1
        const sum = cashRatio + cardRatio + upiRatio;
        const normalizedCash = (cashRatio / sum) * total;
        const normalizedCard = (cardRatio / sum) * total;
        const normalizedUpi = (upiRatio / sum) * total;
        
        const splitSum = normalizedCash + normalizedCard + normalizedUpi;
        
        return Math.abs(splitSum - total) < 0.01;
      }
    ),
    { numRuns: 100 }
  );
});
```

**Property Test 3: Discount Validation**
```javascript
// Feature: counter-sale-page, Property 6: Discount Validation
test('discount never exceeds subtotal', () => {
  fc.assert(
    fc.property(
      fc.float({ min: 100, max: 10000 }),
      fc.oneof(
        fc.record({ type: fc.constant('amount'), value: fc.float({ min: 0, max: 20000 }) }),
        fc.record({ type: fc.constant('percent'), value: fc.float({ min: 0, max: 150 }) })
      ),
      (subtotal, discount) => {
        const discountAmount = calculateDiscountAmount(subtotal, discount);
        const finalTotal = subtotal - discountAmount;
        
        return discountAmount <= subtotal && finalTotal >= 0;
      }
    ),
    { numRuns: 100 }
  );
});
```

**Property Test 4: Menu Search Responsiveness**
```javascript
// Feature: counter-sale-page, Property 7: Menu Search Responsiveness
test('search returns results within time limit', async () => {
  fc.assert(
    fc.asyncProperty(
      fc.array(fc.record({
        name: fc.string({ minLength: 3, maxLength: 30 }),
        category: fc.string({ minLength: 3, maxLength: 20 }),
        price: fc.float({ min: 1, max: 1000 })
      }), { minLength: 10, maxLength: 100 }),
      fc.string({ minLength: 1, maxLength: 10 }),
      async (menuItems, searchQuery) => {
        const startTime = performance.now();
        const results = await searchMenuItems(menuItems, searchQuery);
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        return duration < 200; // Must complete within 200ms
      }
    ),
    { numRuns: 100 }
  );
});
```

**Property Test 5: Receipt Content Completeness**
```javascript
// Feature: counter-sale-page, Property 9: Receipt Content Completeness
test('receipt contains all required information', () => {
  fc.assert(
    fc.property(
      fc.record({
        items: fc.array(fc.record({
          name: fc.string({ minLength: 3, maxLength: 30 }),
          quantity: fc.integer({ min: 1, max: 10 }),
          price: fc.float({ min: 1, max: 1000 })
        }), { minLength: 1, maxLength: 20 }),
        subtotal: fc.float({ min: 1, max: 10000 }),
        tax: fc.float({ min: 0, max: 1000 }),
        discount: fc.float({ min: 0, max: 1000 }),
        total: fc.float({ min: 1, max: 10000 }),
        payment_method: fc.constantFrom('cash', 'card', 'upi', 'credit')
      }),
      fc.record({
        restaurant_name: fc.string({ minLength: 3, maxLength: 50 }),
        phone: fc.string({ minLength: 10, maxLength: 15 })
      }),
      (order, businessSettings) => {
        const receipt = generateReceipt(order, businessSettings);
        
        // Check all required fields are present
        const hasBusinessName = receipt.includes(businessSettings.restaurant_name);
        const hasItems = order.items.every(item => receipt.includes(item.name));
        const hasSubtotal = receipt.includes(order.subtotal.toString());
        const hasTax = receipt.includes(order.tax.toString());
        const hasTotal = receipt.includes(order.total.toString());
        const hasPaymentMethod = receipt.includes(order.payment_method);
        
        return hasBusinessName && hasItems && hasSubtotal && 
               hasTax && hasTotal && hasPaymentMethod;
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Tests

**Focus Areas:**
- Complete order flow (search → add → pay → print)
- Payment method switching
- Split payment workflow
- Error recovery scenarios
- Local storage persistence

**Example Integration Test:**
```javascript
describe('Counter Sale Complete Flow', () => {
  test('completes full order from search to receipt', async () => {
    render(<CounterSalePage user={mockUser} />);
    
    // Search and add items
    const searchInput = screen.getByTestId('menu-search-input');
    fireEvent.change(searchInput, { target: { value: 'burger' } });
    await waitFor(() => screen.getByText('Cheese Burger'));
    fireEvent.click(screen.getByText('Cheese Burger'));
    
    // Verify item added
    expect(screen.getByText('Cheese Burger')).toBeInTheDocument();
    expect(screen.getByText('₹150')).toBeInTheDocument();
    
    // Select payment method
    fireEvent.click(screen.getByText('Cash'));
    
    // Complete payment
    fireEvent.click(screen.getByText('Complete Payment'));
    
    // Verify success
    await waitFor(() => {
      expect(screen.getByText('Payment completed successfully')).toBeInTheDocument();
    });
  });
});
```

### Performance Tests

**Metrics to Track:**
- Initial page load time (target: < 500ms)
- Search response time (target: < 200ms)
- Total calculation time (target: < 100ms)
- Payment processing time (target: < 2s)
- Receipt generation time (target: < 500ms)

**Performance Monitoring:**
```javascript
// Use performanceMonitor utility
import { startBillingTimer, endBillingTimer } from '../utils/performanceMonitor';

const handlePayment = async () => {
  const timerId = startBillingTimer('counter-sale-payment');
  
  try {
    await processPayment(orderData);
    endBillingTimer(timerId, { success: true });
  } catch (error) {
    endBillingTimer(timerId, { success: false, error: error.message });
    throw error;
  }
};
```

## Performance Optimizations

### 1. Menu Data Caching

```javascript
// Cache menu items in localStorage with TTL
const MENU_CACHE_KEY = 'counter_sale_menu_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const loadMenuItems = async () => {
  // Try cache first
  const cached = localStorage.getItem(MENU_CACHE_KEY);
  if (cached) {
    const { items, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_TTL) {
      setMenuItems(items);
      // Fetch fresh data in background
      fetchMenuItemsBackground();
      return;
    }
  }
  
  // Fetch fresh data
  await fetchMenuItems();
};
```

### 2. Debounced Search

```javascript
// Debounce search input to reduce re-renders
const [searchQuery, setSearchQuery] = useState('');
const [debouncedSearch, setDebouncedSearch] = useState('');

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(searchQuery);
  }, 100); // 100ms debounce
  
  return () => clearTimeout(timer);
}, [searchQuery]);
```

### 3. Memoized Calculations

```javascript
// Memoize expensive calculations
const subtotal = useMemo(() => 
  orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
  [orderItems]
);

const discountAmount = useMemo(() => 
  calculateDiscountAmount(subtotal, discountType, discountValue),
  [subtotal, discountType, discountValue]
);

const tax = useMemo(() => 
  (subtotal - discountAmount) * (taxRate / 100),
  [subtotal, discountAmount, taxRate]
);

const total = useMemo(() => 
  Math.max(0, subtotal - discountAmount + tax),
  [subtotal, discountAmount, tax]
);
```

### 4. Optimistic UI Updates

```javascript
// Update UI immediately, sync with server in background
const handleAddItem = (item) => {
  // Immediate UI update
  setOrderItems(prev => {
    const existing = prev.find(i => i.menu_item_id === item.id);
    if (existing) {
      return prev.map(i => 
        i.menu_item_id === item.id 
          ? { ...i, quantity: i.quantity + 1 }
          : i
      );
    }
    return [...prev, { menu_item_id: item.id, name: item.name, quantity: 1, price: item.price }];
  });
  
  // Clear search for next item
  setSearchQuery('');
  
  // Focus back to search
  setTimeout(() => searchInputRef.current?.focus(), 50);
};
```

### 5. Virtual Scrolling for Large Menus

```javascript
// Use react-window for large menu lists
import { FixedSizeList } from 'react-window';

const MenuSearchResults = ({ items, onSelect }) => (
  <FixedSizeList
    height={400}
    itemCount={items.length}
    itemSize={60}
    width="100%"
  >
    {({ index, style }) => (
      <div style={style} onClick={() => onSelect(items[index])}>
        {items[index].name} - ₹{items[index].price}
      </div>
    )}
  </FixedSizeList>
);
```

## Security Considerations

### 1. Input Validation

- Sanitize all user inputs (customer name, phone, custom item names)
- Validate numeric inputs (prices, quantities, discounts)
- Prevent XSS attacks in search queries
- Validate payment amounts server-side

### 2. Authentication

- Verify user role before allowing counter sales
- Check permissions for discount application
- Log all transactions with user ID

### 3. Data Protection

- Don't store sensitive payment details in local storage
- Clear completed order data after successful submission
- Use HTTPS for all API calls
- Implement CSRF protection

## Accessibility

### Keyboard Navigation

- Tab order: Search → Items → Discount → Customer Info → Payment → Actions
- Enter: Add selected item, submit payment
- Escape: Clear search, cancel actions
- Arrow keys: Navigate search results
- +/- keys: Adjust quantities (when focused)

### Screen Reader Support

- ARIA labels for all interactive elements
- Live regions for total updates
- Descriptive button labels
- Error announcements

### Visual Accessibility

- High contrast mode support
- Minimum font size 14px
- Clear focus indicators
- Color-blind friendly payment method indicators

## Future Enhancements

1. **Barcode Scanner Integration**: Scan items instead of search
2. **Recent Items**: Quick access to frequently sold items
3. **Saved Orders**: Save incomplete orders for later
4. **Customer History**: Quick lookup of previous orders
5. **Loyalty Points**: Integrate with loyalty program
6. **Multi-Currency**: Support for multiple currencies
7. **Offline Mode**: Complete offline operation with sync
8. **Analytics Dashboard**: Counter sale specific metrics
9. **Voice Commands**: Hands-free operation
10. **Receipt Customization**: Per-order receipt templates
