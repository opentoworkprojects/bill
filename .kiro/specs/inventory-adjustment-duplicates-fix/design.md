# Inventory Adjustment Duplicates Fix - Bugfix Design

## Overview

This bugfix addresses a critical data integrity issue where rapid clicks on "Add Stock" or "Reduce Stock" buttons create duplicate stock movement records and apply inventory quantity adjustments multiple times. The fix implements a multi-layered defense strategy: frontend request deduplication with loading states, backend idempotency protection using time-windowed duplicate detection, and proper error handling to ensure exactly-once semantics for inventory adjustments.

The approach combines immediate UI feedback (button disabling), in-flight request tracking (preventing concurrent calls), and backend validation (rejecting duplicates within a 5-second window) to eliminate race conditions while preserving all legitimate sequential adjustment operations.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when a user clicks "Add Stock" or "Reduce Stock" multiple times rapidly (within 5 seconds), causing duplicate API calls
- **Property (P)**: The desired behavior - exactly one stock movement record is created and inventory quantity is adjusted exactly once per user action
- **Preservation**: Existing legitimate stock adjustment behavior that must remain unchanged - sequential adjustments with sufficient time between them, error handling, UI refresh behavior
- **handleStockAdjust**: The function in `frontend/src/pages/InventoryPage.js` that processes stock adjustment button clicks and makes sequential API calls (PUT /inventory/{id} then POST /inventory/movements)
- **create_stock_movement**: The backend endpoint in `backend/server.py` at line 7719 that records stock movements and updates inventory quantities
- **Idempotency Key**: A unique identifier combining item_id, movement_type, quantity, and timestamp used to detect duplicate requests within a time window
- **In-Flight Request**: An API call sequence (PUT + POST) that is currently being processed but has not yet completed
- **Time Window**: A 5-second period used for duplicate detection - requests with identical parameters within this window are considered duplicates

## Bug Details

### Bug Condition

The bug manifests when a user clicks the "Add Stock" or "Reduce Stock" button multiple times in rapid succession (typically double-clicks or impatient repeated clicks during network latency). The `handleStockAdjust` function lacks protection against concurrent invocations, and the button remains enabled during API processing, allowing multiple identical API call sequences to execute in parallel or rapid succession.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { clickEvent, itemId, adjustmentType, quantity, timestamp }
  OUTPUT: boolean
  
  RETURN input.clickEvent = "button_click"
         AND input.adjustmentType IN ['add', 'reduce']
         AND EXISTS previousRequest WHERE (
           previousRequest.itemId = input.itemId
           AND previousRequest.adjustmentType = input.adjustmentType
           AND previousRequest.quantity = input.quantity
           AND (input.timestamp - previousRequest.timestamp) < 5000ms
           AND previousRequest.status IN ['pending', 'in-flight']
         )
END FUNCTION
```

### Examples

- **Example 1 - Double Click**: User clicks "Add Stock" button twice rapidly (within 200ms). Expected: +10 units, 1 movement record. Actual: +20 units, 2 movement records.

- **Example 2 - Network Latency**: User clicks "Add Stock" (+15 units), waits 2 seconds with no response, clicks again thinking it failed. Expected: +15 units, 1 movement record. Actual: +30 units, 2 movement records.

- **Example 3 - Reduce Stock Duplicate**: User clicks "Reduce Stock" (-5 units) three times rapidly. Expected: -5 units, 1 movement record. Actual: -15 units, 3 movement records.

- **Edge Case - Legitimate Sequential**: User adds 10 units, waits 10 seconds, then adds 10 more units. Expected: +20 units total, 2 separate movement records. This should continue to work correctly.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Legitimate sequential stock adjustments (with >5 seconds between them) must continue to process independently
- Error handling for authorization (403) and validation errors must continue to display appropriate messages
- Successful adjustments must continue to refresh inventory list and low stock indicators
- Stock movement history must continue to display all legitimate movements with correct timestamps
- Adjustments for different inventory items must continue to process independently and concurrently

**Scope:**
All inputs that do NOT involve rapid duplicate clicks on the same item with the same adjustment parameters should be completely unaffected by this fix. This includes:
- Sequential adjustments to the same item with sufficient time between them (>5 seconds)
- Adjustments to different inventory items (even if simultaneous)
- Adjustments with different quantities or types to the same item
- Failed adjustments that are legitimately retried by the user after error messages

## Hypothesized Root Cause

Based on the bug description and code analysis, the root causes are:

1. **No Frontend Loading State**: The "Add Stock" / "Reduce Stock" button in the modal (line 2173 of InventoryPage.js) does not disable itself or show a loading indicator during API processing, allowing users to click multiple times before the first request completes.

2. **No In-Flight Request Tracking**: The `handleStockAdjust` function has no mechanism to track whether an adjustment is already in progress for the current item, allowing concurrent invocations to proceed simultaneously.

3. **Sequential API Calls Create Race Window**: The function makes two sequential API calls (PUT /inventory/{id} then POST /inventory/movements) without atomic transaction protection, creating a window where duplicate calls can interleave and cause inconsistent state.

4. **No Backend Idempotency Protection**: The `create_stock_movement` endpoint (line 7719 of server.py) processes every request independently without checking for recent duplicates, allowing identical requests within a short time window to all succeed.

5. **No Request Deduplication**: Neither frontend nor backend implements request deduplication based on operation parameters (item_id, type, quantity, timestamp), so identical requests are treated as distinct operations.

## Correctness Properties

Property 1: Bug Condition - Single Adjustment Per User Action

_For any_ user action where the "Add Stock" or "Reduce Stock" button is clicked multiple times rapidly (within 5 seconds) with the same item and adjustment parameters, the fixed system SHALL create exactly one stock movement record and adjust the inventory quantity exactly once by the specified amount, regardless of how many times the button was clicked.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

Property 2: Preservation - Sequential Adjustments

_For any_ sequence of stock adjustment operations where sufficient time (>5 seconds) elapses between operations, OR where the operations involve different items, OR where the operations have different parameters (quantity/type), the fixed system SHALL process each adjustment independently and produce exactly the same results as the original system, preserving all existing functionality for legitimate sequential operations.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `frontend/src/pages/InventoryPage.js`

**Function**: `handleStockAdjust` (line 1107)

**Specific Changes**:

1. **Add Loading State Management**: 
   - Add new state variable: `const [isAdjusting, setIsAdjusting] = useState(false)`
   - Set `setIsAdjusting(true)` at the start of `handleStockAdjust`
   - Set `setIsAdjusting(false)` in both success and error paths (finally block)
   - Pass `disabled={!stockAdjustQty || parseFloat(stockAdjustQty) <= 0 || isAdjusting}` to the button

2. **Add In-Flight Request Tracking**:
   - Add early return guard: `if (isAdjusting) return;` at the start of `handleStockAdjust`
   - This prevents concurrent invocations even if the button is somehow clicked while disabled

3. **Add Loading Indicator to Button**:
   - Show spinner icon when `isAdjusting` is true
   - Change button text to "Processing..." during adjustment
   - Maintain visual feedback that operation is in progress

4. **Wrap API Calls in Try-Finally**:
   - Ensure `setIsAdjusting(false)` is called even if API calls fail
   - Prevents button from staying disabled after errors

**File**: `backend/server.py`

**Function**: `create_stock_movement` (line 7719)

**Specific Changes**:

1. **Add Idempotency Key Generation**:
   - Generate key from: `f"{movement.item_id}:{movement.type}:{movement.quantity}:{user_org_id}"`
   - Use this key to check for recent duplicates

2. **Add Duplicate Detection Logic**:
   - Query `stock_movements` collection for records with same item_id, type, quantity, organization_id
   - Filter to records created within last 5 seconds
   - If found, return the existing movement record instead of creating a new one (HTTP 200, not 409)

3. **Add Idempotency Response**:
   - When duplicate detected, log: "Duplicate stock movement detected, returning existing record"
   - Return existing movement record to maintain idempotent behavior
   - Do NOT update inventory quantity again (it was already updated by the first request)

4. **Add Database Index**:
   - Create compound index on `stock_movements` collection: `{item_id: 1, organization_id: 1, created_at: -1}`
   - Ensures fast duplicate detection queries

5. **Handle Edge Case - Partial Failure**:
   - If inventory update succeeds but movement recording fails, the duplicate detection prevents re-updating inventory
   - Consider adding transaction support or compensating logic for production systems

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior. Testing will use both unit tests (for specific scenarios) and property-based tests (for comprehensive coverage of the input space).

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that simulate rapid button clicks and concurrent API calls on the UNFIXED code. Use browser automation or direct API calls to trigger the race condition. Observe duplicate stock movements and incorrect quantity adjustments.

**Test Cases**:
1. **Double Click Test**: Simulate two clicks on "Add Stock" within 100ms (will fail on unfixed code - creates 2 movements)
2. **Triple Click Test**: Simulate three clicks on "Reduce Stock" within 200ms (will fail on unfixed code - creates 3 movements)
3. **Network Latency Test**: Simulate click, delay 2 seconds, click again before first completes (will fail on unfixed code - creates 2 movements)
4. **Concurrent API Test**: Send two identical POST /inventory/movements requests simultaneously (will fail on unfixed code - both succeed)

**Expected Counterexamples**:
- Multiple stock movement records with identical parameters and timestamps within seconds of each other
- Inventory quantity adjusted multiple times (e.g., +10 becomes +20 or +30)
- Possible causes: no button disabling, no in-flight tracking, no backend duplicate detection

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds (rapid duplicate clicks), the fixed function produces the expected behavior (exactly one adjustment).

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := handleStockAdjust_fixed(input)
  movements := getStockMovements(input.itemId, input.timestamp - 1s, input.timestamp + 10s)
  inventoryChange := getInventoryChange(input.itemId, input.timestamp - 1s, input.timestamp + 10s)
  
  ASSERT movements.length = 1
  ASSERT inventoryChange = input.quantity (for 'add') OR -input.quantity (for 'reduce')
  ASSERT result.success = true
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold (legitimate sequential adjustments, different items, different parameters), the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  result_original := simulateOriginalBehavior(input)
  result_fixed := handleStockAdjust_fixed(input)
  
  ASSERT result_original.movementCount = result_fixed.movementCount
  ASSERT result_original.inventoryChange = result_fixed.inventoryChange
  ASSERT result_original.errorBehavior = result_fixed.errorBehavior
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain (different items, quantities, timing)
- It catches edge cases that manual unit tests might miss (e.g., boundary conditions on the 5-second window)
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for legitimate sequential adjustments, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Sequential Adjustments Preservation**: Observe that two adjustments 10 seconds apart create 2 movements on unfixed code, verify this continues after fix
2. **Different Items Preservation**: Observe that simultaneous adjustments to different items work independently on unfixed code, verify this continues after fix
3. **Error Handling Preservation**: Observe that validation errors (negative quantity, unauthorized) display correct messages on unfixed code, verify this continues after fix
4. **UI Refresh Preservation**: Observe that successful adjustments refresh inventory list on unfixed code, verify this continues after fix

### Unit Tests

- Test button disabling during API calls (frontend)
- Test in-flight request guard prevents concurrent invocations (frontend)
- Test loading state is cleared on success and error paths (frontend)
- Test backend duplicate detection within 5-second window (backend)
- Test backend allows identical requests after 5-second window (backend)
- Test idempotency returns existing record without re-updating inventory (backend)

### Property-Based Tests

- Generate random sequences of adjustment operations with varying timing (0-10 seconds apart) and verify correct number of movements created
- Generate random combinations of items, quantities, and types and verify each processes independently
- Generate random error scenarios (invalid quantities, unauthorized users) and verify error handling is preserved
- Test boundary conditions on the 5-second duplicate detection window (4.9s, 5.0s, 5.1s)

### Integration Tests

- Test full flow: open modal, click "Add Stock", verify button disables, verify single movement created, verify inventory updated once
- Test rapid double-click scenario: click twice within 100ms, verify only one adjustment processes
- Test network latency scenario: click, delay 2s, click again, verify only one adjustment processes
- Test sequential legitimate adjustments: adjust, wait 10s, adjust again, verify both process independently
- Test cross-item adjustments: adjust item A and item B simultaneously, verify both process correctly
