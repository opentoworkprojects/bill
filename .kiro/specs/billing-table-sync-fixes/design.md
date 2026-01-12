# Design Document: Billing and Table Sync Fixes

## Overview

This design addresses critical synchronization issues between the billing page and tables page in the restaurant management system. The fixes ensure that:
1. Table status updates correctly persist to the database after payment completion
2. Full payments are recorded with correct balance (zero) and credit status (false)
3. Menu loading is optimized for better user experience

## Architecture

The system follows a React frontend with FastAPI backend architecture:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  BillingPage.js │────▶│  Backend API    │────▶│   MongoDB       │
│                 │     │  (server.py)    │     │   Database      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │                       ▼                       │
        │               ┌─────────────────┐             │
        │               │  Redis Cache    │◀────────────┘
        │               └─────────────────┘
        │                       │
        ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│  TablesPage.js  │◀────│  Cache Service  │
└─────────────────┘     └─────────────────┘
```

## Components and Interfaces

### Frontend Components

#### BillingPage.js - Payment Processing Fix

**Current Issue:** When processing a full payment without explicitly entering an amount, the `received` variable defaults to `total`, but the payment data sent to backend may not correctly set `payment_received`.

**Fix:** Ensure `payment_received` is always explicitly set in the payment data:

```javascript
// processPayment function fix
const processPayment = async () => {
  const total = calculateTotal();
  // Fix: Always calculate received amount correctly
  const received = (showReceivedAmount || splitPayment) 
    ? calculateReceivedAmount() 
    : total;  // Default to full payment
  
  const balance = Math.max(0, total - received);
  const isCredit = balance > 0;
  
  const paymentData = {
    status: isCredit ? 'pending' : 'completed',
    payment_method: splitPayment ? 'split' : paymentMethod,
    payment_received: received,  // Always set explicitly
    balance_amount: balance,     // Always set explicitly  
    is_credit: isCredit,         // Always set explicitly
    // ... other fields
  };
};
```

#### BillingPage.js - Table Release Fix

**Current Issue:** The `releaseTable` function may fail silently, and errors are only logged to console.

**Fix:** Add proper error handling and user feedback:

```javascript
const releaseTable = async () => {
  const kotEnabled = businessSettings?.kot_mode_enabled !== false;
  if (!kotEnabled || !order?.table_id || order.table_id === 'counter') return true;
  
  try {
    const tableResponse = await axios.get(`${API}/tables/${order.table_id}`);
    await axios.put(`${API}/tables/${order.table_id}`, {
      table_number: tableResponse.data.table_number,
      capacity: tableResponse.data.capacity || 4,
      status: 'available',
      current_order_id: null
    });
    console.log(`✅ Table ${order.table_number} released successfully`);
    return true;
  } catch (error) {
    console.error('❌ Failed to release table:', error);
    toast.error(`Failed to release table ${order.table_number}. Please manually clear it.`);
    return false;
  }
};
```

#### TablesPage.js - Data Refresh Fix

**Current Issue:** Tables page may show stale cached data.

**Fix:** Add cache-busting parameter and force refresh on mount:

```javascript
const fetchTables = async (forceRefresh = false) => {
  try {
    const url = forceRefresh 
      ? `${API}/tables?_t=${Date.now()}`  // Cache bust
      : `${API}/tables`;
    const response = await axios.get(url);
    setTables(response.data.sort((a, b) => a.table_number - b.table_number));
  } catch (error) {
    toast.error('Failed to fetch tables');
  }
};

useEffect(() => {
  fetchAllData(true);  // Force refresh on mount
}, []);
```

### Backend Components

#### server.py - Order Update Fix

**Current Issue:** The backend may not correctly handle the case where `payment_received` equals `total`.

**Fix:** Ensure balance calculation handles edge cases:

```python
@api_router.put("/orders/{order_id}")
async def update_order(order_id: str, order_data: dict, current_user: dict = Depends(get_current_user)):
    # ... existing validation ...
    
    # Fix: Ensure payment fields are correctly calculated
    if "payment_received" in order_data:
        total = order_data.get("total", existing_order.get("total", 0))
        payment_received = order_data.get("payment_received", 0) or 0
        
        # Calculate balance - ensure it's never negative
        balance = max(0, total - payment_received)
        
        update_data["payment_received"] = payment_received
        update_data["balance_amount"] = balance
        update_data["is_credit"] = balance > 0
        
        # If full payment, ensure status is completed
        if balance <= 0:
            update_data["status"] = "completed"
            update_data["is_credit"] = False
            update_data["balance_amount"] = 0
```

#### server.py - Table Cache Invalidation Fix

**Current Issue:** Table cache may not be invalidated after status updates.

**Fix:** Add explicit cache invalidation after table updates:

```python
@api_router.put("/tables/{table_id}", response_model=Table)
async def update_table(table_id: str, table: TableCreate, current_user: dict = Depends(get_current_user)):
    # ... existing update logic ...
    
    # Fix: Invalidate table cache after update
    try:
        cached_service = get_cached_order_service()
        await cached_service.invalidate_table_caches(user_org_id)
        print(f"🗑️ Table cache invalidated for org {user_org_id}")
    except Exception as e:
        print(f"⚠️ Table cache invalidation error: {e}")
    
    return updated
```

## Data Models

### Order Payment State

```typescript
interface OrderPaymentState {
  status: 'pending' | 'preparing' | 'ready' | 'completed';
  payment_method: 'cash' | 'card' | 'upi' | 'split' | 'credit';
  payment_received: number;  // Amount actually received
  balance_amount: number;    // Remaining balance (0 for full payment)
  is_credit: boolean;        // true if balance > 0
  total: number;             // Total bill amount
}

// Invariant: balance_amount = max(0, total - payment_received)
// Invariant: is_credit = (balance_amount > 0)
// Invariant: if status === 'completed' && !is_credit, then balance_amount === 0
```

### Table State

```typescript
interface TableState {
  id: string;
  table_number: number;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance' | 'cleaning';
  current_order_id: string | null;
  capacity: number;
}

// Invariant: if status === 'available', then current_order_id === null
// Invariant: if status === 'occupied', then current_order_id !== null
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Payment State Consistency

*For any* order where payment_received >= total, the balance_amount SHALL be 0 and is_credit SHALL be false.

**Validates: Requirements 2.1, 2.2, 2.4, 2.5**

### Property 2: Table Status Persistence

*For any* table status change operation, the database SHALL reflect the new status, and subsequent fetch operations SHALL return the updated status.

**Validates: Requirements 1.1, 1.4, 1.5, 4.1, 4.2**

### Property 3: Completed Order Invariant

*For any* order marked as completed with full payment (payment_received >= total), the order record SHALL have status="completed", is_credit=false, and balance_amount=0.

**Validates: Requirements 2.3, 4.3**

## Error Handling

### Frontend Error Handling

1. **Table Release Failure:**
   - Display toast error message to user
   - Log error details to console for debugging
   - Allow user to manually clear table from Tables page

2. **Payment Processing Failure:**
   - Display specific error message based on error type
   - Do not mark payment as completed
   - Allow user to retry

3. **Menu Fetch Failure:**
   - Display user-friendly error message
   - Provide retry button
   - Handle authentication errors by redirecting to login

### Backend Error Handling

1. **Database Update Failure:**
   - Return appropriate HTTP error code
   - Log error details
   - Do not partially update data

2. **Cache Invalidation Failure:**
   - Log warning but don't fail the request
   - Data will be eventually consistent

## Testing Strategy

### Unit Tests

Unit tests will verify specific examples and edge cases:

1. **Payment calculation edge cases:**
   - Full payment (received = total)
   - Overpayment (received > total)
   - Partial payment (received < total)
   - Zero payment

2. **Table status transitions:**
   - Occupied → Available after payment
   - Error handling when table not found

### Property-Based Tests

Property-based tests will verify universal properties using fast-check library:

1. **Payment State Consistency Property:**
   - Generate random order totals and payment amounts
   - Verify balance calculation is correct
   - Verify is_credit flag is set correctly

2. **Table Status Persistence Property:**
   - Generate random table status changes
   - Verify database reflects changes
   - Verify fetched data matches database

### Integration Tests

1. **End-to-end payment flow:**
   - Create order → Process payment → Verify table released
   - Verify order status and payment fields

2. **Data consistency:**
   - Update table status → Fetch tables → Verify updated status
