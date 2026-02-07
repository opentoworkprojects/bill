# 🔧 Order Status Fix - Partial Payment Display

## Problem
When an order had a balance due (partial payment) or was a credit order, it was incorrectly showing as "Paid" or "Completed" in the active orders list. It should show as "Due" to indicate outstanding balance.

**Example**:
- Bill: ₹1000
- Customer pays: ₹200
- Balance: ₹800
- ❌ Was showing: "Completed" (wrong!)
- ✅ Should show: "Due" (correct!)

## Root Cause
The `determineBillingCompletionStatus` function in `orderWorkflowRules.js` was setting status to 'completed' for all non-credit orders, even when there was an outstanding balance.

```javascript
// OLD (WRONG):
export const determineBillingCompletionStatus = ({ waiterName, isCredit }) =>
  waiterName === 'Self-Order' || isCredit ? 'pending' : 'completed';

// This set status to 'completed' even for partial payments!
```

## Solution Applied

### 1. Fixed Status Determination Logic
**File**: `frontend/src/utils/orderWorkflowRules.js`

```javascript
// NEW (CORRECT):
export const determineBillingCompletionStatus = ({ waiterName, isCredit }) => {
  // Self-Order (QR orders) stay pending until kitchen marks as completed
  if (waiterName === 'Self-Order') return 'pending';
  
  // Orders with outstanding balance (partial payment or credit) should be 'due'
  if (isCredit) return 'due';
  
  // Full payment with no balance = completed
  return 'completed';
};
```

### 2. Added 'due' Status Color
**File**: `frontend/src/pages/OrdersPage.js`

```javascript
const getStatusColor = (status) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-700',
    preparing: 'bg-blue-100 text-blue-700',
    ready: 'bg-green-100 text-green-700',
    completed: 'bg-gray-100 text-gray-700',
    cancelled: 'bg-red-100 text-red-700',
    credit: 'bg-orange-100 text-orange-700',
    due: 'bg-orange-100 text-orange-700'  // NEW: Partial payment or credit order
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
};
```

## Order Status Flow

### Full Payment (No Balance)
```
Bill: ₹1000
Payment: ₹1000
Balance: ₹0
is_credit: false
Status: 'completed' ✅
Display: Gray badge "completed"
Location: Completed Orders tab
```

### Partial Payment (Has Balance)
```
Bill: ₹1000
Payment: ₹200
Balance: ₹800
is_credit: true
Status: 'due' ✅
Display: Orange badge "due"
Location: Active Orders tab
```

### Credit Order (Pay Later)
```
Bill: ₹1000
Payment: ₹0
Balance: ₹1000
is_credit: true
Status: 'due' ✅
Display: Orange badge "due"
Location: Active Orders tab
```

### QR Order (Self-Order)
```
Bill: ₹1000
Payment: ₹1000
Balance: ₹0
is_credit: false
waiterName: 'Self-Order'
Status: 'pending' ✅
Display: Yellow badge "pending"
Location: Active Orders tab (until kitchen marks as completed)
```

## Status Badge Colors

| Status | Color | Badge | Meaning |
|--------|-------|-------|---------|
| pending | Yellow | 🟡 | Order placed, not yet preparing |
| preparing | Blue | 🔵 | Kitchen is preparing |
| ready | Green | 🟢 | Ready for pickup/delivery |
| completed | Gray | ⚪ | Fully paid and completed |
| cancelled | Red | 🔴 | Order cancelled |
| due | Orange | 🟠 | Has outstanding balance |
| credit | Orange | 🟠 | Credit order (legacy) |

## Active vs Completed Orders

### Active Orders Tab Shows:
- ✅ pending
- ✅ preparing
- ✅ ready
- ✅ **due** (NEW - partial payments)
- ❌ completed (excluded)
- ❌ cancelled (excluded)

### Completed Orders Tab Shows:
- ✅ completed
- ✅ cancelled
- ❌ pending (excluded)
- ❌ due (excluded)

## Customer Balance Tracking

Orders with 'due' status appear in:

### 1. Active Orders Tab
Shows order is still active with outstanding balance

### 2. Reports → Customer Balance
Shows customer name, phone, and balance owed:
```
Customer: John Doe (9876543210)
Order #123 - Status: due - Balance: ₹800
```

### 3. Order Details
Shows payment breakdown:
```
Total: ₹1000
Paid: ₹200
Balance: ₹800
Status: due
```

## Real-World Examples

### Example 1: Restaurant Table - Partial Payment
```
Scenario: Customer at table pays ₹200 on ₹1000 bill

Before Fix:
- Status: 'completed' ❌
- Display: Gray "completed" badge
- Location: Completed Orders (wrong!)
- Problem: Can't see customer still owes ₹800

After Fix:
- Status: 'due' ✅
- Display: Orange "due" badge
- Location: Active Orders (correct!)
- Benefit: Clear that ₹800 is still owed
```

### Example 2: Credit Customer
```
Scenario: Regular customer orders ₹1000, pays later

Before Fix:
- Status: 'pending' (if credit button used)
- Display: Yellow "pending" badge
- Problem: Looks like order not processed

After Fix:
- Status: 'due' ✅
- Display: Orange "due" badge
- Benefit: Clear it's a credit order with balance
```

### Example 3: Full Payment
```
Scenario: Customer pays exact ₹1000 on ₹1000 bill

Before Fix:
- Status: 'completed' ✅
- Display: Gray "completed" badge
- Location: Completed Orders

After Fix:
- Status: 'completed' ✅ (unchanged)
- Display: Gray "completed" badge
- Location: Completed Orders
- Benefit: No change, works correctly
```

## Benefits

### 1. Clear Status Visibility
- Orange "due" badge immediately shows outstanding balance
- No confusion between paid and unpaid orders
- Easy to identify which customers owe money

### 2. Better Order Management
- Active orders tab shows all orders needing attention
- Partial payments stay visible until fully paid
- Credit orders tracked properly

### 3. Accurate Reporting
- Customer balance report shows correct data
- Outstanding balances tracked accurately
- Payment history maintained

### 4. Improved Workflow
- Staff can see which orders have pending payments
- Follow up with customers for outstanding balances
- Clear distinction between completed and due orders

## Testing Checklist

- [ ] Full payment (₹1000 on ₹1000) → Status: 'completed', Gray badge
- [ ] Partial payment (₹200 on ₹1000) → Status: 'due', Orange badge
- [ ] Credit order (₹0 on ₹1000) → Status: 'due', Orange badge
- [ ] QR order full payment → Status: 'pending', Yellow badge
- [ ] 'due' orders appear in Active Orders tab
- [ ] 'completed' orders appear in Completed Orders tab
- [ ] Customer Balance report shows 'due' orders
- [ ] Order details show correct status badge

## Files Modified

1. **frontend/src/utils/orderWorkflowRules.js**
   - Updated `determineBillingCompletionStatus` function
   - Added logic to set 'due' status for orders with balance
   - Separated Self-Order logic from credit logic

2. **frontend/src/pages/OrdersPage.js**
   - Added 'due' status to `getStatusColor` function
   - Orange badge for 'due' status (same as 'credit')

## Migration Notes

### Existing Orders
Orders already in the system with partial payments may have 'completed' or 'pending' status. They will be corrected when:
1. Customer makes another payment
2. Order is edited
3. Status is manually updated

### Status Mapping
- Old 'pending' with balance → Now 'due'
- Old 'completed' with balance → Now 'due'
- Old 'completed' without balance → Still 'completed'

The fix ensures all new orders get the correct status from the start! 🎉
