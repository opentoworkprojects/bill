# Payment and Reliability Fixes Bugfix Design

## Overview

This design addresses four critical reliability and performance issues in a high-traffic restaurant SaaS billing system:

1. **Payment Processing Performance**: Reduce payment processing time from 2-4 seconds to under 1 second by eliminating redundant API calls
2. **Tables Disappearing from UI**: Prevent tables from vanishing when network requests fail by preserving last known good state
3. **Order Creation Failures**: Implement retry logic with exponential backoff to handle network timeouts during order creation
4. **Frontend Graceful Degradation**: Maintain functionality with cached data when servers are slow or unavailable

The fixes maintain strict data consistency requirements for a multi-tenant SaaS platform with no tolerance for payment false positives, duplicate transactions, or data loss.

## Glossary

- **Bug_Condition (C)**: The conditions that trigger each of the four bugs
- **Property (P)**: The desired behavior when the bug conditions occur
- **Preservation**: Existing payment correctness, data consistency, and multi-tenant isolation that must remain unchanged
- **processPaymentFast**: The optimized payment function in `frontend/src/utils/optimizedPayment.js`
- **apiWithRetry**: The retry-enabled API client in `frontend/src/utils/apiClient.js`
- **fetchTables**: The function in `frontend/src/pages/TablesPage.js` that fetches table data
- **loadInitialData**: The function in `frontend/src/pages/OrdersPage.js` that loads orders and tables
- **Payment False Positive**: Showing payment success to user when server never received/confirmed the payment
- **Optimistic Update**: Updating UI immediately before server confirmation (must be reverted on failure)

## Bug Details

### Bug Condition 1: Payment Processing Performance

The payment processing flow currently takes 2-4 seconds or more due to redundant API calls and sequential processing.

**Formal Specification:**
```
FUNCTION isBugCondition1(paymentRequest)
  INPUT: paymentRequest of type PaymentData
  OUTPUT: boolean
  
  RETURN paymentRequest.payment_method IN ['cash', 'card', 'upi']
         AND paymentRequest.uses_create_payment_endpoint = true
         AND paymentRequest.processing_time > 1000ms
END FUNCTION
```

### Examples

- **Example 1**: User completes cash payment for ₹500 order → System takes 3.2 seconds to process → Expected: <1 second
- **Example 2**: User completes card payment for ₹1200 order → System calls `/payments/create-order` then `/orders/{id}` sequentially → Expected: Single `/orders/{id}` call
- **Example 3**: User completes UPI payment → System performs table release, cache invalidation, and payment record creation sequentially → Expected: Parallel execution with non-blocking operations
- **Edge Case**: Razorpay online payment → System MUST continue using `/payments/create-order` endpoint → Expected: No change to Razorpay flow

### Bug Condition 2: Tables Disappearing from UI

When network requests fail, the frontend clears the tables state completely, causing all tables to disappear.

**Formal Specification:**
```
FUNCTION isBugCondition2(networkResponse)
  INPUT: networkResponse of type APIResponse
  OUTPUT: boolean
  
  RETURN networkResponse.endpoint = '/tables'
         AND (networkResponse.status = 'error' OR networkResponse.status = 'timeout')
         AND currentTablesState.length > 0
         AND newTablesState.length = 0
END FUNCTION
```

### Examples

- **Example 1**: Network timeout while fetching tables → All 15 tables disappear from UI → Expected: 15 tables remain visible with staleness indicator
- **Example 2**: Server returns 500 error → Tables array cleared to [] → Expected: Previous tables preserved, error shown non-intrusively
- **Example 3**: Intermittent connectivity → Tables flicker in/out repeatedly → Expected: Stable display with last known good state
- **Edge Case**: First load with no cached data and network failure → Expected: Show empty state with retry button, not crash

### Bug Condition 3: Order Creation Failures

Network timeouts during order creation cause complete failure with no retry mechanism.

**Formal Specification:**
```
FUNCTION isBugCondition3(orderCreationRequest)
  INPUT: orderCreationRequest of type OrderData
  OUTPUT: boolean
  
  RETURN orderCreationRequest.network_status = 'timeout'
         AND orderCreationRequest.retry_count = 0
         AND orderCreationRequest.result = 'failed'
END FUNCTION
```

### Examples

- **Example 1**: Create order for Table 5 → Network timeout after 10 seconds → Order creation fails completely → Expected: Automatic retry with exponential backoff
- **Example 2**: Poor network conditions → Order creation fails → Restaurant loses order → Expected: Up to 3 retries before showing error
- **Example 3**: Server under heavy load → Slow response causes timeout → Expected: Longer timeout with retry logic
- **Edge Case**: All 3 retries fail → Expected: Clear error message with manual retry option, order data preserved locally

### Bug Condition 4: Frontend Updates Failing on Server Slowness

When servers are slow or unavailable, the frontend shows error states or blank screens instead of gracefully degrading.

**Formal Specification:**
```
FUNCTION isBugCondition4(serverResponse)
  INPUT: serverResponse of type APIResponse
  OUTPUT: boolean
  
  RETURN (serverResponse.response_time > 5000ms OR serverResponse.status = 'unavailable')
         AND currentUIState = 'error_screen'
         AND cachedData.exists = true
         AND cachedData.age < 300000ms
END FUNCTION
```

### Examples

- **Example 1**: Server takes 8 seconds to respond → Frontend shows blank screen → Expected: Show cached data with "Updating..." indicator
- **Example 2**: Server completely unavailable → All functionality disabled → Expected: Core functionality works with cached data, queue updates
- **Example 3**: Backend under heavy load → Multiple requests timeout → Expected: Graceful degradation with cached data, non-blocking error notifications
- **Edge Case**: Cache is stale (>5 minutes old) → Expected: Show staleness warning but still display cached data with prominent refresh button

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**

1. **Payment Correctness**: Payment success MUST only be shown after server confirmation (no false positives)
2. **Data Consistency**: All database updates must maintain ACID properties across orders, payments, and tables
3. **Multi-Tenant Isolation**: Organization-level data isolation must be enforced for all API requests
4. **Razorpay Integration**: Online Razorpay payments must continue using `/payments/create-order` endpoint
5. **Table Management**: Table status updates must sync correctly when orders are completed
6. **Order Workflow**: Orders must transition correctly between pending → cooking → completed states
7. **Split Payments**: Cash/card/UPI split payment calculations must remain accurate
8. **Partial Payments**: Credit/balance amount calculations must be correct for partial payments
9. **Cache Invalidation**: Caches must be invalidated after successful payment completion
10. **WhatsApp Receipts**: Auto-send WhatsApp receipts must continue working after payment

**Scope:**

All inputs that do NOT involve the four specific bug conditions should be completely unaffected by these fixes. This includes:
- Razorpay online payment flow (must use existing `/payments/create-order` endpoint)
- Order editing and cancellation workflows
- KOT printing and kitchen display system
- Menu management and inventory tracking
- User authentication and authorization
- Business settings and configuration
- Analytics and reporting features

## Hypothesized Root Cause

Based on the bug descriptions and code analysis, the most likely issues are:

### 1. Payment Processing Performance Issues

**Root Cause**: Redundant API call to `/payments/create-order` endpoint for cash/card/UPI payments

- The `processPaymentFast` function in `optimizedPayment.js` calls both `/payments/create-order` AND `/orders/{id}` endpoints
- The `/orders/{id}` PUT endpoint already handles payment completion, table release, and cache invalidation
- The `/payments/create-order` endpoint is only needed for Razorpay online payments (to create Razorpay order)
- For cash/card/UPI payments, the `/payments/create-order` call is redundant and adds 1-2 seconds of latency
- Sequential execution of payment record creation, order update, and table release adds cumulative latency

**Evidence from Code**:
```javascript
// optimizedPayment.js - Lines 65-75
const promises = [
  this.createPaymentRecordWithRetry(optimizedPayload).catch(...),  // REDUNDANT for cash/card/UPI
  this.updateOrderStatusWithRetry(optimizedPayload)                // This is sufficient
];
```

### 2. Tables Disappearing from UI

**Root Cause**: Frontend replaces existing table state with empty array on network errors

- `TablesPage.js` `fetchTables` function sets `setTables(response.data)` unconditionally
- When network request fails, the catch block doesn't preserve existing tables
- No fallback to cached data when fresh fetch fails
- `OrdersPage.js` has similar issue in `loadInitialData` function

**Evidence from Code**:
```javascript
// TablesPage.js - Lines 90-100
const fetchTables = async (forceRefresh = false) => {
  try {
    const response = await axios.get(url, { headers });
    setTables(response.data.sort(...));  // Unconditional replacement
  } catch (error) { 
    console.error('Failed to fetch tables:', error);
    toast.error('Failed to fetch tables');
    // BUG: No preservation of existing tables state
  }
};
```

### 3. Order Creation Failures

**Root Cause**: No retry logic in order creation API calls

- Order creation uses standard `axios` calls without retry wrapper
- Network timeouts cause immediate failure with no retry attempts
- The `apiWithRetry` utility exists but is not used for order creation
- No exponential backoff or retry strategy for transient network failures

**Evidence from Code**:
```javascript
// OrdersPage.js - Order creation (needs retry logic)
const response = await axios.post(`${API}/orders`, orderData, { headers });
// No retry wrapper - fails immediately on timeout
```

### 4. Frontend Updates Failing on Server Slowness

**Root Cause**: No graceful degradation strategy when servers are slow

- Frontend doesn't check cache age before showing error states
- No fallback to cached data when server responses are slow
- Module-level cache `_pageCache` exists but isn't used as fallback on errors
- No staleness indicators or background refresh when showing cached data

**Evidence from Code**:
```javascript
// OrdersPage.js - Lines 450-470
const loadInitialData = async () => {
  // Uses cache if fresh (<30s) but doesn't fall back to stale cache on error
  if (_pageCache.orders && cacheAge < CACHE_TTL) {
    // Show cached data
  }
  // BUG: If fetch fails and cache is stale, shows error instead of stale cache
};
```

## Correctness Properties

Property 1: Bug Condition - Payment Processing Performance

_For any_ payment request where the payment method is cash, card, or UPI (not Razorpay), the fixed payment processing function SHALL complete in less than 1 second by eliminating the redundant `/payments/create-order` API call and using only the `/orders/{id}` PUT endpoint which already handles payment completion, table release, and cache invalidation.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

Property 2: Bug Condition - Tables Disappearing from UI

_For any_ network request to fetch tables that fails or times out, the fixed frontend SHALL preserve the existing table data in the UI state instead of clearing it, and SHALL display a non-intrusive error indicator while keeping the last known good state visible to users.

**Validates: Requirements 2.6, 2.7, 2.8, 2.9**

Property 3: Bug Condition - Order Creation Failures

_For any_ order creation request that fails due to network timeout, the fixed system SHALL automatically retry the request up to 3 times with exponential backoff (delays of 500ms, 1000ms, 2000ms) before showing an error to the user, and SHALL provide a manual retry option if all automatic retries fail.

**Validates: Requirements 2.10, 2.11, 2.12, 2.13**

Property 4: Bug Condition - Frontend Graceful Degradation

_For any_ server response that is slow (>5 seconds) or unavailable, the fixed frontend SHALL gracefully degrade by displaying cached data with a staleness indicator, SHALL maintain core functionality with cached data, and SHALL queue updates for when the server recovers.

**Validates: Requirements 2.14, 2.15, 2.16, 2.17**

Property 5: Preservation - Payment Correctness

_For any_ payment transaction, the fixed system SHALL produce exactly the same payment correctness guarantees as the original system, including waiting for server confirmation before showing success, preventing duplicate transactions, and maintaining ACID properties for all database updates.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9**

Property 6: Preservation - Razorpay Integration

_For any_ payment using Razorpay online payment method, the fixed system SHALL continue to use the `/payments/create-order` endpoint exactly as before, with no changes to the Razorpay order creation, payment verification, or webhook handling flows.

**Validates: Requirements 3.20, 3.21, 3.22**

Property 7: Preservation - Multi-Tenant Isolation

_For any_ API request from any restaurant organization, the fixed system SHALL continue to enforce organization-level data isolation by validating authentication, filtering by organization_id, and preventing cross-organization data access.

**Validates: Requirements 3.17, 3.18, 3.19**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

#### Fix 1: Payment Processing Performance

**File**: `frontend/src/utils/optimizedPayment.js`

**Function**: `processPaymentOptimized`

**Specific Changes**:

1. **Conditional Payment Record Creation**: Only call `/payments/create-order` for Razorpay payments
   - Add check: `if (paymentData.payment_method === 'razorpay')`
   - Skip payment record creation for cash/card/UPI payments
   - The `/orders/{id}` PUT endpoint already creates payment records in the backend

2. **Remove Redundant Promise**: Eliminate the first promise from the parallel execution array
   - Before: `[createPaymentRecordWithRetry(...), updateOrderStatusWithRetry(...), releaseTableAsync(...)]`
   - After: `[updateOrderStatusWithRetry(...), releaseTableAsync(...)]` for cash/card/UPI
   - Keep all three promises for Razorpay payments

3. **Update Result Handling**: Adjust result array indices after removing redundant promise
   - `orderResult` becomes `results[0]` instead of `results[1]`
   - `tableResult` becomes `results[1]` instead of `results[2]`

4. **Add Performance Logging**: Log actual processing time to verify <1 second target
   - Already exists: `console.log(\`✅ Payment processed successfully in ${processingTime.toFixed(0)}ms\`)`

5. **Preserve Error Handling**: Maintain all existing error handling and retry logic
   - Keep timeout handling, network error detection, and fallback mechanisms
   - Ensure payment correctness is never compromised

**Code Location**: Lines 45-120 in `optimizedPayment.js`

#### Fix 2: Tables Disappearing from UI

**File**: `frontend/src/pages/TablesPage.js`

**Function**: `fetchTables`

**Specific Changes**:

1. **Preserve Existing State on Error**: Don't clear tables when fetch fails
   - Remove implicit state clearing in catch block
   - Only update state when response is successful and valid

2. **Add Conditional State Update**: Only call `setTables()` when response has valid data
   - Check: `if (response?.data && Array.isArray(response.data) && response.data.length >= 0)`
   - Preserve existing tables if response is invalid

3. **Add Staleness Indicator**: Show non-intrusive error message without clearing UI
   - Use `toast.warning()` instead of `toast.error()` for less intrusive feedback
   - Add visual indicator (e.g., yellow banner) showing "Using cached data - refresh to update"

4. **Implement Retry Button**: Add manual refresh option when auto-refresh fails
   - Already exists: Refresh button in header calls `fetchTables(true)`

**Code Location**: Lines 90-110 in `TablesPage.js`

**File**: `frontend/src/pages/OrdersPage.js`

**Function**: `loadInitialData`

**Specific Changes**:

1. **Fallback to Stale Cache**: Use cached data even if stale when fresh fetch fails
   - Current: Only uses cache if `cacheAge < CACHE_TTL`
   - Fixed: Use cache regardless of age if fetch fails, show staleness warning

2. **Preserve State on Error**: Don't clear orders/tables when fetch fails
   - Check if `_pageCache.orders` exists before showing error state
   - Only set `setLoadFailed(true)` if no cache exists at all

3. **Add Background Refresh**: Attempt to refresh stale cache in background
   - Show cached data immediately, then update when fresh data arrives
   - Use `Promise.allSettled()` to prevent one failure from blocking others (already implemented)

**Code Location**: Lines 450-520 in `OrdersPage.js`

#### Fix 3: Order Creation Failures

**File**: `frontend/src/pages/OrdersPage.js`

**Function**: Order creation handler (in `handleSubmitOrder`)

**Specific Changes**:

1. **Wrap with Retry Logic**: Use `apiWithRetry` instead of plain `axios`
   - Replace: `await axios.post(\`${API}/orders\`, orderData, { headers })`
   - With: `await apiWithRetry({ method: 'post', url: \`${API}/orders\`, data: orderData, timeout: 15000 })`

2. **Increase Timeout**: Allow more time for order creation under load
   - Current: Default axios timeout (no explicit timeout)
   - Fixed: 15 second timeout to handle server load

3. **Add Retry Configuration**: Configure exponential backoff in `apiWithRetry`
   - Already implemented in `apiClient.js` with 3 retries
   - Exponential backoff: 500ms, 1000ms, 2000ms delays

4. **Preserve Order Data on Failure**: Keep form data if all retries fail
   - Don't clear `selectedItems` or `formData` on error
   - Show clear error message with "Retry" button

5. **Add Manual Retry Option**: Allow user to retry after automatic retries fail
   - Keep dialog open on error
   - Show "Retry" button that calls order creation again

**Code Location**: Order creation in `OrdersPage.js` (search for `axios.post(\`${API}/orders\``)

#### Fix 4: Frontend Graceful Degradation

**File**: `frontend/src/pages/OrdersPage.js`

**Function**: `loadInitialData`

**Specific Changes**:

1. **Extend Cache TTL for Fallback**: Use longer TTL for fallback scenarios
   - Current: 30 second TTL for fresh cache
   - Add: 5 minute TTL for stale-but-usable cache as fallback

2. **Add Staleness Indicator**: Show visual indicator when using stale cache
   - Add banner: "Showing cached data from X minutes ago - Refresh to update"
   - Use yellow/warning color scheme, not red/error

3. **Background Refresh**: Attempt to refresh stale cache without blocking UI
   - Show cached data immediately
   - Fetch fresh data in background
   - Update UI when fresh data arrives (if user hasn't navigated away)

4. **Queue Updates**: Store failed updates locally and retry when server recovers
   - Use localStorage to persist pending updates
   - Retry on next successful server connection
   - Show indicator: "X pending updates - will sync when online"

5. **Non-Blocking Errors**: Show errors as toasts, not full-screen error states
   - Use `toast.warning()` for non-critical errors
   - Keep UI functional with cached data
   - Only show full error state if no cache exists at all

**Code Location**: Lines 450-520 in `OrdersPage.js`

**File**: `frontend/src/pages/TablesPage.js`

**Function**: `fetchTables`

**Specific Changes**:

1. **Similar Graceful Degradation**: Apply same patterns as OrdersPage
   - Fallback to stale cache on error
   - Show staleness indicator
   - Background refresh
   - Non-blocking error notifications

**Code Location**: Lines 90-110 in `TablesPage.js`

## Testing Strategy

### Validation Approach

The testing strategy follows a three-phase approach:

1. **Exploratory Bug Condition Checking**: Surface counterexamples on unfixed code to confirm root causes
2. **Fix Checking**: Verify fixes work correctly for all bug conditions
3. **Preservation Checking**: Verify existing behavior is unchanged for all non-buggy inputs

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bugs BEFORE implementing fixes. Confirm or refute the root cause analysis.

**Test Plan**: Write tests that simulate each bug condition and measure actual behavior on UNFIXED code.

**Test Cases**:

1. **Payment Performance Test**: Measure payment processing time for cash payment (will show >2 seconds on unfixed code)
   - Create order with 5 items, total ₹500
   - Complete cash payment
   - Measure time from button click to success message
   - Expected counterexample: 2000-4000ms processing time

2. **Tables Disappearing Test**: Simulate network failure during table fetch (will show empty table list on unfixed code)
   - Load TablesPage with 10 tables visible
   - Simulate network timeout using browser DevTools
   - Trigger table refresh
   - Expected counterexample: All 10 tables disappear from UI

3. **Order Creation Failure Test**: Simulate network timeout during order creation (will show immediate failure on unfixed code)
   - Create order with 3 items
   - Simulate network timeout (10 second delay)
   - Submit order
   - Expected counterexample: Order creation fails immediately with no retry

4. **Graceful Degradation Test**: Simulate slow server response (will show error screen on unfixed code)
   - Load OrdersPage with cached data
   - Simulate 8 second server response delay
   - Trigger data refresh
   - Expected counterexample: Blank screen or error state instead of cached data

**Expected Counterexamples**:
- Payment processing takes 2-4 seconds instead of <1 second
- Tables disappear completely when network fails
- Order creation fails immediately on timeout with no retry
- Frontend shows error screens instead of cached data when server is slow

### Fix Checking

**Goal**: Verify that for all inputs where the bug conditions hold, the fixed functions produce the expected behavior.

**Pseudocode:**

```
// Fix 1: Payment Performance
FOR ALL paymentRequest WHERE isBugCondition1(paymentRequest) DO
  startTime := getCurrentTime()
  result := processPaymentOptimized_fixed(paymentRequest)
  endTime := getCurrentTime()
  processingTime := endTime - startTime
  
  ASSERT processingTime < 1000ms
  ASSERT result.success = true
  ASSERT result.paymentRecordCreated = false  // For cash/card/UPI
  ASSERT result.orderUpdated = true
END FOR

// Fix 2: Tables Preservation
FOR ALL networkResponse WHERE isBugCondition2(networkResponse) DO
  initialTables := getCurrentTablesState()
  fetchTables_fixed(networkResponse)
  finalTables := getCurrentTablesState()
  
  ASSERT finalTables.length = initialTables.length
  ASSERT finalTables = initialTables  // State preserved
  ASSERT stalenessIndicatorShown = true
END FOR

// Fix 3: Order Creation Retry
FOR ALL orderRequest WHERE isBugCondition3(orderRequest) DO
  result := createOrder_fixed(orderRequest)
  
  ASSERT result.retryCount >= 1 AND result.retryCount <= 3
  ASSERT result.success = true OR result.manualRetryOffered = true
END FOR

// Fix 4: Graceful Degradation
FOR ALL serverResponse WHERE isBugCondition4(serverResponse) DO
  cachedData := getCachedData()
  loadData_fixed(serverResponse)
  displayedData := getCurrentDisplayedData()
  
  ASSERT displayedData = cachedData
  ASSERT stalenessIndicatorShown = true
  ASSERT uiFunctional = true
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug conditions do NOT hold, the fixed functions produce the same result as the original functions.

**Pseudocode:**

```
// Preservation: Payment Correctness
FOR ALL paymentRequest WHERE NOT isBugCondition1(paymentRequest) DO
  // Test Razorpay payments still work correctly
  IF paymentRequest.payment_method = 'razorpay' THEN
    result_original := processPayment_original(paymentRequest)
    result_fixed := processPayment_fixed(paymentRequest)
    
    ASSERT result_fixed.usesCreatePaymentEndpoint = true
    ASSERT result_fixed.razorpayOrderCreated = true
    ASSERT result_fixed = result_original
  END IF
  
  // Test payment correctness is preserved
  ASSERT paymentSuccessShownOnlyAfterServerConfirmation = true
  ASSERT noDuplicateTransactions = true
  ASSERT databaseConsistencyMaintained = true
END FOR

// Preservation: Table Management
FOR ALL tableRequest WHERE NOT isBugCondition2(tableRequest) DO
  // Test successful table fetches still work
  IF tableRequest.status = 'success' THEN
    result_original := fetchTables_original(tableRequest)
    result_fixed := fetchTables_fixed(tableRequest)
    
    ASSERT result_fixed = result_original
    ASSERT tablesDisplayedCorrectly = true
  END IF
END FOR

// Preservation: Order Creation
FOR ALL orderRequest WHERE NOT isBugCondition3(orderRequest) DO
  // Test successful order creation still works
  IF orderRequest.status = 'success' THEN
    result_original := createOrder_original(orderRequest)
    result_fixed := createOrder_fixed(orderRequest)
    
    ASSERT result_fixed = result_original
    ASSERT orderCreatedCorrectly = true
  END IF
END FOR

// Preservation: Multi-Tenant Isolation
FOR ALL apiRequest DO
  result := processRequest_fixed(apiRequest)
  
  ASSERT organizationIdValidated = true
  ASSERT dataIsolationEnforced = true
  ASSERT noDataLeaks = true
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs
- It can test the full range of payment methods, network conditions, and server states

**Test Plan**: 

1. **Observe Behavior on UNFIXED Code**: Document exact behavior for non-buggy inputs
   - Razorpay payment flow (order creation, verification, webhooks)
   - Successful table fetches with various table counts
   - Successful order creation with various item counts
   - Multi-tenant data isolation across organizations

2. **Write Property-Based Tests**: Capture observed behavior in properties
   - Generate random payment requests with various methods
   - Generate random network responses (success, error, timeout)
   - Generate random order data with various item configurations
   - Generate random organization IDs to test isolation

3. **Run Tests on FIXED Code**: Verify properties hold after fixes
   - All Razorpay payments work identically to before
   - All successful API calls work identically to before
   - All data isolation checks pass identically to before

**Test Cases**:

1. **Razorpay Payment Preservation**: Verify Razorpay flow unchanged
   - Create Razorpay payment for ₹1000
   - Verify `/payments/create-order` endpoint called
   - Verify Razorpay order created with correct amount
   - Verify payment verification works correctly
   - Compare with unfixed code behavior - should be identical

2. **Successful Table Fetch Preservation**: Verify successful fetches work
   - Fetch tables with 15 tables in database
   - Verify all 15 tables displayed correctly
   - Verify table status colors correct
   - Compare with unfixed code behavior - should be identical

3. **Successful Order Creation Preservation**: Verify successful creation works
   - Create order with 5 items, Table 3, ₹750 total
   - Verify order created in database
   - Verify table status updated to "occupied"
   - Verify order appears in active orders list
   - Compare with unfixed code behavior - should be identical

4. **Multi-Tenant Isolation Preservation**: Verify data isolation maintained
   - Create orders for Organization A
   - Attempt to fetch orders as Organization B
   - Verify Organization B cannot see Organization A's orders
   - Verify organization_id filtering works correctly
   - Compare with unfixed code behavior - should be identical

### Unit Tests

- Test payment processing with cash/card/UPI methods (should skip `/payments/create-order`)
- Test payment processing with Razorpay method (should use `/payments/create-order`)
- Test table fetch with network error (should preserve existing tables)
- Test table fetch with successful response (should update tables)
- Test order creation with network timeout (should retry 3 times)
- Test order creation with successful response (should create order)
- Test data loading with slow server (should show cached data)
- Test data loading with successful response (should update data)

### Property-Based Tests

- Generate random payment requests and verify processing time <1 second for cash/card/UPI
- Generate random network failures and verify tables never disappear
- Generate random network timeouts and verify order creation retries correctly
- Generate random server delays and verify graceful degradation works
- Generate random Razorpay payments and verify flow unchanged
- Generate random organization IDs and verify data isolation maintained

### Integration Tests

- Test full payment flow: order creation → item selection → payment → receipt printing
- Test full table management flow: table creation → order assignment → payment → table release
- Test full order lifecycle: creation → cooking → completion → today's bills
- Test cross-tab communication: payment in one tab → order list updates in another tab
- Test offline/online transitions: work offline with cache → reconnect → sync updates
- Test concurrent users: multiple cashiers processing payments simultaneously
