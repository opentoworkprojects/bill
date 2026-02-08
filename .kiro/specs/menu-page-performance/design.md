# Design Document: Menu Page Performance Optimization

## Overview

This design addresses critical performance and user experience issues in the MenuPage component through a comprehensive optimization strategy. The solution implements optimistic UI updates, request deduplication, intelligent caching, and enhanced loading states to provide instant feedback for all user actions while maintaining data consistency.

The core approach uses an optimistic update pattern where UI changes are applied immediately, with automatic rollback on failure. A request deduplication system prevents duplicate operations, while a multi-layer caching strategy reduces server load and improves perceived performance. All operations include comprehensive loading states and error recovery mechanisms.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        MenuPage Component                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Optimistic State Manager                   │ │
│  │  - Tracks pending operations                           │ │
│  │  - Manages rollback queue                              │ │
│  │  - Coordinates UI updates                              │ │
│  └────────────────────────────────────────────────────────┘ │
│                            ↓                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           Request Deduplication Layer                   │ │
│  │  - Tracks in-flight requests                           │ │
│  │  - Prevents duplicate operations                       │ │
│  │  - Manages request lifecycle                           │ │
│  └────────────────────────────────────────────────────────┘ │
│                            ↓                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                  Cache Manager                          │ │
│  │  - Local storage cache                                 │ │
│  │  - Memory cache for active session                     │ │
│  │  - Cache invalidation logic                            │ │
│  └────────────────────────────────────────────────────────┘ │
│                            ↓                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Enhanced API Client                        │ │
│  │  - Image compression                                   │ │
│  │  - Upload progress tracking                            │ │
│  │  - Retry with exponential backoff                      │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    Backend API Server
```

### Data Flow

1. **User Action** → Optimistic State Manager applies immediate UI update
2. **Optimistic State Manager** → Request Deduplication Layer checks for duplicates
3. **Request Deduplication Layer** → Cache Manager updates local cache
4. **Cache Manager** → Enhanced API Client sends request to server
5. **Server Response** → Optimistic State Manager finalizes or rolls back update

## Components and Interfaces

### 1. Optimistic State Manager

**Purpose:** Manages optimistic updates and rollback logic for all menu operations.

**State Structure:**
```javascript
{
  pendingOperations: Map<string, PendingOperation>,
  rollbackQueue: Array<RollbackAction>,
  optimisticItems: Map<string, MenuItem>
}

interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete' | 'toggle';
  itemId: string;
  timestamp: number;
  originalState?: MenuItem;
  optimisticState: MenuItem;
}

interface RollbackAction {
  operationId: string;
  rollbackFn: () => void;
  errorMessage: string;
}
```

**Key Methods:**
- `applyOptimisticUpdate(operation: PendingOperation): void` - Applies immediate UI update
- `confirmOperation(operationId: string): void` - Finalizes successful operation
- `rollbackOperation(operationId: string, error: Error): void` - Reverts failed operation
- `getPendingOperations(): PendingOperation[]` - Returns all pending operations

### 2. Request Deduplication Layer

**Purpose:** Prevents duplicate requests from being sent to the server.

**State Structure:**
```javascript
{
  inFlightRequests: Map<string, RequestMetadata>
}

interface RequestMetadata {
  requestId: string;
  operationType: string;
  itemId?: string;
  timestamp: number;
  abortController: AbortController;
}
```

**Key Methods:**
- `generateRequestKey(operation: string, itemId?: string): string` - Creates unique request identifier
- `isRequestInFlight(requestKey: string): boolean` - Checks if request is already in progress
- `registerRequest(requestKey: string, metadata: RequestMetadata): void` - Tracks new request
- `completeRequest(requestKey: string): void` - Removes completed request from tracking
- `cancelRequest(requestKey: string): void` - Aborts in-flight request

### 3. Cache Manager

**Purpose:** Manages multi-layer caching for menu items.

**Cache Structure:**
```javascript
{
  memoryCache: {
    items: MenuItem[],
    timestamp: number,
    version: number
  },
  localStorageKey: 'menu_cache_v1'
}

interface CacheEntry {
  items: MenuItem[];
  timestamp: number;
  version: number;
  userId: string;
}
```

**Key Methods:**
- `getCachedItems(): MenuItem[] | null` - Retrieves cached items (memory first, then localStorage)
- `setCachedItems(items: MenuItem[]): void` - Updates both memory and localStorage cache
- `invalidateCache(): void` - Clears all cached data
- `isCacheStale(): boolean` - Checks if cache is older than 5 minutes
- `mergeCacheWithServerData(serverItems: MenuItem[]): MenuItem[]` - Intelligently merges cached and fresh data

### 4. Enhanced API Client

**Purpose:** Provides optimized API calls with image compression and progress tracking.

**Key Methods:**
- `uploadImageWithProgress(file: File, onProgress: (percent: number) => void): Promise<string>` - Uploads image with compression and progress
- `createMenuItem(item: MenuItem, signal: AbortSignal): Promise<MenuItem>` - Creates menu item with deduplication
- `updateMenuItem(id: string, item: MenuItem, signal: AbortSignal): Promise<MenuItem>` - Updates menu item
- `deleteMenuItem(id: string, signal: AbortSignal): Promise<void>` - Deletes menu item
- `fetchMenuItems(signal: AbortSignal): Promise<MenuItem[]>` - Fetches all menu items

**Image Compression:**
```javascript
interface CompressionOptions {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.85,
  format: 'image/jpeg'
}
```

### 5. Loading State Manager

**Purpose:** Manages all loading indicators and progress states.

**State Structure:**
```javascript
{
  globalLoading: boolean,
  operationLoading: Map<string, LoadingState>
}

interface LoadingState {
  operationId: string;
  type: 'create' | 'update' | 'delete' | 'upload' | 'fetch';
  progress?: number;
  message?: string;
}
```

**Key Methods:**
- `setOperationLoading(operationId: string, state: LoadingState): void` - Sets loading state for operation
- `clearOperationLoading(operationId: string): void` - Removes loading state
- `getLoadingState(operationId: string): LoadingState | null` - Gets current loading state

## Data Models

### MenuItem (Enhanced)

```javascript
interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description?: string;
  image_url?: string;
  available: boolean;
  preparation_time: number;
  is_popular: boolean;
  is_vegetarian: boolean;
  is_spicy: boolean;
  allergens?: string;
  created_at: string;
  updated_at: string;
  
  // Optimistic update metadata
  _optimistic?: boolean;
  _pendingOperationId?: string;
  _originalState?: MenuItem;
}
```

### OptimisticOperation

```javascript
interface OptimisticOperation {
  id: string;
  type: 'create' | 'update' | 'delete' | 'toggle_availability' | 'toggle_popularity';
  itemId: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  
  // For rollback
  originalItem?: MenuItem;
  optimisticItem: MenuItem;
  
  // For retry
  retryCount: number;
  maxRetries: number;
  
  // For deduplication
  requestKey: string;
}
```

### CacheMetadata

```javascript
interface CacheMetadata {
  version: number;
  userId: string;
  timestamp: number;
  itemCount: number;
  lastSyncTimestamp: number;
}
```

## Implementation Details

### Optimistic Update Flow

1. **User initiates action** (e.g., creates menu item)
2. **Generate operation ID** using `crypto.randomUUID()`
3. **Check for duplicate request** using request key
4. **Apply optimistic update** to local state immediately
5. **Update cache** with optimistic item
6. **Send API request** with abort signal
7. **On success**: Confirm operation, update with server data
8. **On failure**: Rollback optimistic update, show error with retry option

### Request Deduplication Strategy

**Request Key Generation:**
```javascript
function generateRequestKey(operation, itemId, formData) {
  if (operation === 'create') {
    // For creates, use form data hash to detect duplicates
    return `create_${hashFormData(formData)}`;
  }
  // For updates/deletes, use operation + itemId
  return `${operation}_${itemId}`;
}
```

**Deduplication Logic:**
```javascript
function executeWithDeduplication(requestKey, apiCall) {
  // Check if request already in flight
  if (inFlightRequests.has(requestKey)) {
    console.log('Duplicate request blocked:', requestKey);
    return inFlightRequests.get(requestKey).promise;
  }
  
  // Create abort controller for cancellation
  const abortController = new AbortController();
  
  // Execute API call
  const promise = apiCall(abortController.signal)
    .finally(() => {
      inFlightRequests.delete(requestKey);
    });
  
  // Track request
  inFlightRequests.set(requestKey, {
    promise,
    abortController,
    timestamp: Date.now()
  });
  
  return promise;
}
```

### Cache Strategy

**Multi-Layer Cache:**
1. **Memory Cache** (fastest): Stores items for current session
2. **LocalStorage Cache** (persistent): Survives page reloads
3. **Server** (source of truth): Fetched on cache miss or staleness

**Cache Invalidation Rules:**
- Invalidate on user logout
- Invalidate on explicit refresh
- Mark stale after 5 minutes
- Update on any CRUD operation

**Stale-While-Revalidate Pattern:**
```javascript
async function fetchMenuItems() {
  // 1. Show cached data immediately
  const cachedItems = getCachedItems();
  if (cachedItems) {
    setMenuItems(cachedItems);
    setLoading(false);
  }
  
  // 2. Fetch fresh data in background
  try {
    const freshItems = await api.fetchMenuItems();
    
    // 3. Update cache and UI
    setCachedItems(freshItems);
    setMenuItems(freshItems);
    
    // 4. Show subtle indicator if data changed
    if (hasChanges(cachedItems, freshItems)) {
      showUpdateNotification();
    }
  } catch (error) {
    // If fetch fails but we have cache, keep showing cached data
    if (!cachedItems) {
      throw error;
    }
  }
}
```

### Image Upload Optimization

**Client-Side Compression:**
```javascript
async function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        
        // Maintain aspect ratio
        const maxDimension = 1200;
        if (width > height && width > maxDimension) {
          height = (height / width) * maxDimension;
          width = maxDimension;
        } else if (height > maxDimension) {
          width = (width / height) * maxDimension;
          height = maxDimension;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => resolve(blob),
          'image/jpeg',
          0.85
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
```

**Progress Tracking:**
```javascript
async function uploadWithProgress(file, onProgress) {
  const compressedFile = await compressImage(file);
  
  const formData = new FormData();
  formData.append('file', compressedFile);
  
  return axios.post('/upload/image', formData, {
    onUploadProgress: (progressEvent) => {
      const percent = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
      onProgress(percent);
    }
  });
}
```

### Error Recovery

**Automatic Retry with Exponential Backoff:**
```javascript
async function retryOperation(operation, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await executeOperation(operation);
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (4xx)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        break;
      }
      
      // Wait before retry (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}
```

**Rollback with Undo Option:**
```javascript
function rollbackWithUndo(operation) {
  // Revert UI immediately
  revertOptimisticUpdate(operation);
  
  // Show error toast with undo option
  toast.error(`Failed to ${operation.type} item`, {
    duration: 5000,
    action: {
      label: 'Retry',
      onClick: () => retryOperation(operation)
    }
  });
}
```

### Background Synchronization

**Polling Strategy:**
```javascript
function startBackgroundSync() {
  let pollInterval;
  
  // Poll every 30 seconds when page is visible
  function startPolling() {
    pollInterval = setInterval(async () => {
      try {
        const freshItems = await api.fetchMenuItems();
        mergeWithLocalState(freshItems);
      } catch (error) {
        console.warn('Background sync failed:', error);
      }
    }, 30000);
  }
  
  // Stop polling when page is hidden
  function stopPolling() {
    if (pollInterval) {
      clearInterval(pollInterval);
    }
  }
  
  // Listen to visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopPolling();
    } else {
      startPolling();
    }
  });
  
  // Start initial polling
  if (!document.hidden) {
    startPolling();
  }
  
  // Cleanup on unmount
  return () => {
    stopPolling();
    document.removeEventListener('visibilitychange', () => {});
  };
}
```

### UI Loading States

**Operation-Specific Indicators:**

1. **Creating Item:**
   - Disable submit button
   - Show "Creating..." text
   - Display spinner in button
   - Show optimistic item with pending badge

2. **Uploading Image:**
   - Show progress bar (0-100%)
   - Display file size and upload speed
   - Enable cancel button
   - Preview image with loading overlay

3. **Deleting Item:**
   - Fade out animation (300ms)
   - Show undo toast for 3 seconds
   - Remove from list after animation

4. **Toggling Availability:**
   - Instant toggle with subtle animation
   - Show pending indicator (pulsing dot)
   - Revert on failure with error message

5. **Refreshing Menu:**
   - Subtle refresh icon in header
   - No blocking spinner
   - Show "Updated" badge on changed items



## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property Reflection

After analyzing all acceptance criteria, I identified several areas where properties can be consolidated:

1. **Optimistic Update Pattern**: Properties 1.1, 1.2, 1.3, 4.1, 4.2, 4.3, 7.1, 7.2, 7.3 all follow the same pattern (optimistic update → confirm or rollback). These can be consolidated into a single comprehensive property about optimistic updates.

2. **Request Deduplication**: Properties 2.2, 2.4, 9.1, 9.2, 9.3, 9.4 all relate to request deduplication and can be combined into one property about preventing duplicate requests.

3. **Button State Management**: Properties 2.1 and 2.5 both relate to button state during operations and can be combined.

4. **Cache Operations**: Properties 5.1 and 5.3 both relate to cache updates and can be combined into one property about cache consistency.

5. **Loading Indicators**: Properties 6.1, 6.2, 6.3, 6.4, 6.5 all relate to loading states and can be consolidated into fewer properties.

6. **Error Recovery**: Properties 8.1, 8.2, 8.3 all relate to error handling and can be combined.

### Consolidated Properties

**Property 1: Optimistic Update Consistency**
*For any* menu operation (create, update, delete, toggle), the UI SHALL immediately reflect the change, and if the server confirms the operation, the change SHALL remain; if the server rejects the operation, the UI SHALL revert to the previous state and display an error message.
**Validates: Requirements 1.1, 1.2, 1.3, 4.1, 4.2, 4.3, 7.1, 7.2, 7.3, 8.1**

**Property 2: Temporary ID Generation**
*For any* optimistically created menu item, the item SHALL have a unique temporary client-side ID before server confirmation.
**Validates: Requirements 1.4**

**Property 3: Sort Order Invariant**
*For any* sort configuration and any optimistic update, the menu item list SHALL maintain the correct sort order.
**Validates: Requirements 1.5**

**Property 4: Request Deduplication**
*For any* in-flight request with a given operation type and item ID, subsequent identical requests SHALL be ignored until the first request completes.
**Validates: Requirements 2.2, 2.4, 9.1, 9.2, 9.3, 9.4**

**Property 5: Submit Button State Management**
*For any* form submission operation, the submit button SHALL be disabled during the operation and re-enabled when the operation completes (success or failure).
**Validates: Requirements 2.1, 2.5**

**Property 6: Image Preview Display**
*For any* selected image file, a preview SHALL be displayed immediately before upload begins.
**Validates: Requirements 3.1**

**Property 7: Upload Progress Tracking**
*For any* image upload operation, a progress indicator SHALL display the upload percentage from 0 to 100.
**Validates: Requirements 3.2, 6.3**

**Property 8: Image Compression**
*For any* image file uploaded, the compressed file size SHALL be less than or equal to the original file size (or within 10% for already-compressed images).
**Validates: Requirements 3.3**

**Property 9: Upload Retry Without Re-selection**
*For any* failed image upload, retrying the upload SHALL use the previously selected file without requiring re-selection.
**Validates: Requirements 3.4**

**Property 10: Upload Cancellation**
*For any* in-progress image upload, calling the cancel function SHALL abort the upload and clean up resources.
**Validates: Requirements 3.5**

**Property 11: Deletion Undo Window**
*For any* deleted menu item, an undo option SHALL be available for exactly 3 seconds after deletion.
**Validates: Requirements 4.4**

**Property 12: Deletion Position Restoration**
*For any* failed deletion, the restored item SHALL appear at its original index in the menu list.
**Validates: Requirements 4.5**

**Property 13: Cache Update on Fetch**
*For any* successful menu items fetch, the items SHALL be stored in both memory cache and local storage cache.
**Validates: Requirements 5.1, 5.3**

**Property 14: Stale-While-Revalidate Pattern**
*For any* page load with valid cached data, cached items SHALL be displayed immediately while fresh data is fetched in the background.
**Validates: Requirements 5.2**

**Property 15: Cache Staleness Detection**
*For any* cached data older than 5 minutes, a refresh indicator SHALL be displayed to the user.
**Validates: Requirements 5.4**

**Property 16: Operation Loading Indicators**
*For any* menu operation in progress, an appropriate loading indicator SHALL be visible in the UI.
**Validates: Requirements 6.1, 6.2, 6.4, 6.5**

**Property 17: Non-Blocking Refresh**
*For any* menu refresh operation, the UI SHALL remain interactive and not show a blocking spinner.
**Validates: Requirements 6.5**

**Property 18: Error Message Display**
*For any* failed operation with rollback, a clear error message SHALL be displayed explaining what happened.
**Validates: Requirements 8.2**

**Property 19: Retry Button Availability**
*For any* failed operation, a retry button SHALL be available in the error notification.
**Validates: Requirements 8.3**

**Property 20: Form State Preservation**
*For any* failed form submission, the form input values SHALL be preserved and remain editable.
**Validates: Requirements 8.5**

**Property 21: Server State Priority in Conflicts**
*For any* conflict between local optimistic state and server state, the server state SHALL take precedence.
**Validates: Requirements 10.4**

**Property 22: New Item Notification**
*For any* menu item added by another user (detected during background sync), a notification SHALL be displayed.
**Validates: Requirements 10.5**

## Error Handling

### Error Categories

1. **Network Errors**
   - Connection timeout
   - Connection refused
   - DNS resolution failure
   - **Handling**: Retry with exponential backoff (max 3 attempts), show offline indicator

2. **Server Errors (5xx)**
   - Internal server error
   - Service unavailable
   - Gateway timeout
   - **Handling**: Retry with exponential backoff, rollback optimistic update, show error with retry button

3. **Client Errors (4xx)**
   - Bad request (400)
   - Unauthorized (401)
   - Forbidden (403)
   - Not found (404)
   - Conflict (409)
   - **Handling**: No retry, rollback optimistic update, show specific error message

4. **Validation Errors**
   - Invalid form data
   - Missing required fields
   - Invalid file type/size
   - **Handling**: Show inline validation errors, preserve form state, no API call

5. **Cache Errors**
   - LocalStorage quota exceeded
   - Cache corruption
   - **Handling**: Clear cache, fetch fresh data, log error

### Error Recovery Strategies

**Automatic Retry:**
- Network errors: 3 retries with exponential backoff (1s, 2s, 4s)
- Server errors: 2 retries with exponential backoff (1s, 2s)
- Client errors: No automatic retry

**Manual Retry:**
- All failed operations show retry button
- Retry uses same operation data
- Retry count is tracked and limited to 5 manual retries

**Graceful Degradation:**
- If cache fails, continue without caching
- If image upload fails, allow form submission without image
- If background sync fails, continue with local state

**User Feedback:**
- All errors show toast notifications
- Critical errors show modal dialogs
- Transient errors show subtle indicators

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests** focus on:
- Specific examples of optimistic updates
- Edge cases (empty lists, single items, maximum items)
- Error conditions (network failures, validation errors)
- Integration between components
- UI state transitions

**Property-Based Tests** focus on:
- Universal properties across all inputs
- Invariants that must hold (sort order, cache consistency)
- Round-trip properties (optimistic update → rollback)
- Comprehensive input coverage through randomization

### Property-Based Testing Configuration

**Library Selection:**
- **JavaScript/React**: Use `fast-check` library for property-based testing
- Minimum 100 iterations per property test
- Each test must reference its design document property

**Test Tagging Format:**
```javascript
// Feature: menu-page-performance, Property 1: Optimistic Update Consistency
test('optimistic updates are consistent', () => {
  fc.assert(
    fc.property(
      fc.record({
        operation: fc.constantFrom('create', 'update', 'delete', 'toggle'),
        item: arbitraryMenuItem(),
        shouldSucceed: fc.boolean()
      }),
      ({ operation, item, shouldSucceed }) => {
        // Test implementation
      }
    ),
    { numRuns: 100 }
  );
});
```

### Test Coverage Requirements

**Unit Test Coverage:**
- All error handling paths
- All UI state transitions
- All cache operations
- All deduplication scenarios
- Integration between optimistic state and API client

**Property Test Coverage:**
- All 22 correctness properties
- Each property maps to specific requirements
- Minimum 100 iterations per property
- Random input generation for comprehensive coverage

### Testing Tools and Utilities

**Mocking:**
- Mock API responses with configurable delays
- Mock localStorage for cache testing
- Mock AbortController for cancellation testing
- Mock setTimeout/setInterval for timing tests

**Test Utilities:**
- `arbitraryMenuItem()`: Generates random valid menu items
- `arbitraryOperation()`: Generates random operations
- `mockApiResponse()`: Simulates API responses with delays
- `waitForOptimisticUpdate()`: Waits for UI to reflect optimistic change
- `waitForRollback()`: Waits for rollback to complete

**Performance Testing:**
- Measure time from user action to UI update (target: <50ms)
- Measure time from optimistic update to server confirmation (target: <500ms)
- Measure cache read time (target: <10ms)
- Measure image compression time (target: <1s for 5MB image)

### Example Property Test

```javascript
// Feature: menu-page-performance, Property 4: Request Deduplication
test('duplicate requests are prevented', () => {
  fc.assert(
    fc.property(
      fc.record({
        operation: fc.constantFrom('create', 'update', 'delete'),
        itemId: fc.string(),
        duplicateCount: fc.integer({ min: 2, max: 10 })
      }),
      async ({ operation, itemId, duplicateCount }) => {
        const requestKey = generateRequestKey(operation, itemId);
        const apiCallCount = jest.fn();
        
        // Simulate multiple identical requests
        const promises = Array(duplicateCount)
          .fill(null)
          .map(() => executeWithDeduplication(requestKey, apiCallCount));
        
        await Promise.all(promises);
        
        // Only one API call should have been made
        expect(apiCallCount).toHaveBeenCalledTimes(1);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Testing

**End-to-End Scenarios:**
1. Create item → Upload image → Verify in list → Delete item
2. Create item → Server fails → Verify rollback → Retry → Success
3. Toggle availability → Server fails → Verify revert → Retry → Success
4. Bulk delete → Some fail → Verify partial rollback
5. Offline → Queue operations → Online → Verify sync

**Performance Benchmarks:**
- Initial page load with cache: <100ms to first paint
- Initial page load without cache: <1s to first paint
- Optimistic update: <50ms to UI change
- Image upload (1MB): <2s total time
- Background sync: <500ms, no UI blocking
