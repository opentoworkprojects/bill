# Implementation Plan: Menu Page Performance Optimization

## Overview

This implementation plan breaks down the menu page performance optimization into discrete, incremental tasks. Each task builds on previous work, with testing integrated throughout to catch issues early. The approach prioritizes core optimistic update functionality first, then adds caching, deduplication, and enhanced UI features.

## Tasks

- [x] 1. Create utility modules for core functionality
  - Create `frontend/src/utils/menuOptimisticState.js` for optimistic state management
  - Create `frontend/src/utils/menuRequestDeduplication.js` for request deduplication
  - Create `frontend/src/utils/menuCache.js` for caching logic
  - Create `frontend/src/utils/imageCompression.js` for client-side image compression
  - _Requirements: 1.1, 2.1, 5.1, 3.3_

- [x] 1.1 Write property test for optimistic state manager
  - **Property 1: Optimistic Update Consistency**
  - **Validates: Requirements 1.1, 1.2, 1.3, 4.1, 4.2, 4.3, 7.1, 7.2, 7.3, 8.1**

- [x] 1.2 Write property test for request deduplication
  - **Property 4: Request Deduplication**
  - **Validates: Requirements 2.2, 2.4, 9.1, 9.2, 9.3, 9.4**

- [x] 2. Implement optimistic state manager
  - [x] 2.1 Implement core optimistic state management functions
    - Write `applyOptimisticUpdate()` function to apply immediate UI updates
    - Write `confirmOperation()` function to finalize successful operations
    - Write `rollbackOperation()` function to revert failed operations
    - Implement pending operations tracking with Map data structure
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 2.2 Implement temporary ID generation for optimistic items
    - Write `generateTemporaryId()` function using crypto.randomUUID()
    - Ensure temporary IDs are unique and distinguishable from server IDs
    - _Requirements: 1.4_

  - [x] 2.3 Implement rollback queue and error handling
    - Write rollback queue management functions
    - Implement automatic rollback on operation failure
    - Add error message generation for rollback scenarios
    - _Requirements: 8.1, 8.2_

  - [x] 2.4 Write unit tests for optimistic state edge cases
    - Test empty state initialization
    - Test multiple concurrent operations
    - Test rollback with missing original state
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 3. Implement request deduplication layer
  - [x] 3.1 Create request tracking system
    - Implement `generateRequestKey()` function for unique request identification
    - Create Map to track in-flight requests with metadata
    - Implement `isRequestInFlight()` check function
    - _Requirements: 2.4, 9.1_

  - [x] 3.2 Implement deduplication logic
    - Write `executeWithDeduplication()` wrapper function
    - Implement request registration and cleanup
    - Add AbortController support for request cancellation
    - _Requirements: 2.2, 9.2, 9.3_

  - [x] 3.3 Add deduplication for all operation types
    - Apply deduplication to create operations
    - Apply deduplication to update operations
    - Apply deduplication to delete operations
    - Apply deduplication to toggle operations
    - _Requirements: 9.4_

  - [x] 3.4 Write unit tests for deduplication edge cases
    - Test rapid duplicate requests
    - Test request cleanup on completion
    - Test request cleanup on failure
    - Test AbortController cancellation
    - _Requirements: 2.2, 9.2, 9.3_

- [x] 4. Implement cache manager
  - [x] 4.1 Create cache storage and retrieval functions
    - Implement `getCachedItems()` with memory-first fallback to localStorage
    - Implement `setCachedItems()` to update both memory and localStorage
    - Add cache metadata tracking (timestamp, version, userId)
    - _Requirements: 5.1, 5.2_

  - [x] 4.2 Implement cache invalidation logic
    - Write `invalidateCache()` function to clear all cached data
    - Implement `isCacheStale()` function to check 5-minute staleness
    - Add cache invalidation on logout
    - _Requirements: 5.4, 5.5_

  - [x] 4.3 Implement cache update on CRUD operations
    - Update cache on item creation
    - Update cache on item update
    - Update cache on item deletion
    - Update cache on bulk operations
    - _Requirements: 5.3_

  - [x] 4.4 Write property test for cache consistency
    - **Property 13: Cache Update on Fetch**
    - **Validates: Requirements 5.1, 5.3**

  - [x] 4.5 Write unit tests for cache edge cases
    - Test localStorage quota exceeded
    - Test cache corruption handling
    - Test cache with missing data
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 5. Implement image compression utility
  - [x] 5.1 Create client-side image compression function
    - Implement `compressImage()` function using Canvas API
    - Add aspect ratio preservation logic
    - Set compression quality to 0.85 and max dimension to 1200px
    - Handle different image formats (JPEG, PNG, WebP)
    - _Requirements: 3.3_

  - [x] 5.2 Add upload progress tracking
    - Implement `uploadImageWithProgress()` function
    - Add progress callback support with percentage calculation
    - Integrate with axios onUploadProgress
    - _Requirements: 3.2_

  - [x] 5.3 Add upload cancellation support
    - Implement AbortController for upload cancellation
    - Add cleanup logic for cancelled uploads
    - _Requirements: 3.5_

  - [x] 5.4 Write property test for image compression
    - **Property 8: Image Compression**
    - **Validates: Requirements 3.3**

  - [x] 5.5 Write unit tests for image upload edge cases
    - Test invalid file types
    - Test oversized files
    - Test upload cancellation
    - Test upload retry after failure
    - _Requirements: 3.3, 3.4, 3.5_

- [x] 6. Checkpoint - Ensure all utility modules are working
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Integrate optimistic updates into MenuPage component
  - [x] 7.1 Add optimistic state to MenuPage
    - Import and initialize optimistic state manager
    - Add state for pending operations
    - Add state for rollback queue
    - _Requirements: 1.1_

  - [x] 7.2 Implement optimistic item creation
    - Modify `handleSubmit()` to apply optimistic update immediately
    - Generate temporary ID for new items
    - Add pending indicator to optimistic items in UI
    - Send API request with deduplication
    - Handle success: confirm operation and update with server data
    - Handle failure: rollback and show error with retry button
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.2_

  - [x] 7.3 Implement optimistic item deletion
    - Modify `handleDelete()` to remove item from UI immediately
    - Store original item for potential rollback
    - Send API request with deduplication
    - Handle success: finalize deletion
    - Handle failure: restore item to original position
    - Add 3-second undo option with toast notification
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 7.4 Implement optimistic availability toggle
    - Modify `toggleItemAvailability()` to update UI immediately
    - Add subtle animation for toggle
    - Send API request with deduplication
    - Handle success: finalize toggle
    - Handle failure: revert toggle and show error
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 7.5 Implement optimistic popularity toggle
    - Modify `toggleItemPopularity()` to update UI immediately
    - Send API request with deduplication
    - Handle success: finalize toggle
    - Handle failure: revert toggle and show error
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 7.6 Write property test for sort order invariant
    - **Property 3: Sort Order Invariant**
    - **Validates: Requirements 1.5**

  - [x] 7.7 Write integration tests for optimistic updates
    - Test create → success flow
    - Test create → failure → rollback flow
    - Test delete → success flow
    - Test delete → failure → restore flow
    - Test toggle → success flow
    - Test toggle → failure → revert flow
    - _Requirements: 1.1, 1.2, 1.3, 4.1, 4.2, 4.3, 7.1, 7.2, 7.3_

- [x] 8. Integrate request deduplication into MenuPage
  - [x] 8.1 Add deduplication to form submission
    - Wrap `handleSubmit()` with deduplication logic
    - Disable submit button during in-flight requests
    - Re-enable submit button on completion or failure
    - _Requirements: 2.1, 2.2, 2.5_

  - [x] 8.2 Add deduplication to delete operations
    - Wrap `handleDelete()` with deduplication logic
    - Prevent multiple delete requests for same item
    - _Requirements: 2.2, 9.4_

  - [x] 8.3 Add deduplication to toggle operations
    - Wrap `toggleItemAvailability()` with deduplication logic
    - Wrap `toggleItemPopularity()` with deduplication logic
    - Prevent rapid toggle spam
    - _Requirements: 2.2, 9.4_

  - [x] 8.4 Add deduplication to bulk operations
    - Wrap `handleBulkDelete()` with deduplication logic
    - Wrap `handleBulkAvailabilityToggle()` with deduplication logic
    - _Requirements: 2.2, 9.4_

  - [x] 8.5 Write property test for submit button state
    - **Property 5: Submit Button State Management**
    - **Validates: Requirements 2.1, 2.5**

- [x] 9. Integrate caching into MenuPage
  - [x] 9.1 Implement stale-while-revalidate pattern
    - Modify `fetchMenuItems()` to check cache first
    - Display cached items immediately if available
    - Fetch fresh data in background
    - Update UI when fresh data arrives
    - Show subtle notification if data changed
    - _Requirements: 5.2_

  - [x] 9.2 Add cache updates on CRUD operations
    - Update cache after successful item creation
    - Update cache after successful item update
    - Update cache after successful item deletion
    - Update cache after bulk operations
    - _Requirements: 5.3_

  - [x] 9.3 Add cache staleness indicator
    - Check cache age on page load
    - Show refresh indicator if cache is older than 5 minutes
    - Add manual refresh button
    - _Requirements: 5.4_

  - [x] 9.4 Add cache invalidation on logout
    - Clear cache when user logs out
    - Clear cache on authentication errors
    - _Requirements: 5.5_

  - [x] 9.5 Write property test for stale-while-revalidate
    - **Property 14: Stale-While-Revalidate Pattern**
    - **Validates: Requirements 5.2**

  - [x] 9.6 Write property test for cache staleness detection
    - **Property 15: Cache Staleness Detection**
    - **Validates: Requirements 5.4**

- [x] 10. Checkpoint - Ensure core optimistic updates and caching work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Enhance image upload with compression and progress
  - [x] 11.1 Integrate image compression into upload flow
    - Modify `handleImageUpload()` to compress images before upload
    - Show compression progress indicator
    - Display compressed file size
    - _Requirements: 3.3_

  - [x] 11.2 Add upload progress tracking
    - Add state for upload progress percentage
    - Display progress bar during upload
    - Show upload speed and estimated time remaining
    - _Requirements: 3.2_

  - [x] 11.3 Add image preview on selection
    - Display preview immediately when file is selected
    - Show preview before upload starts
    - _Requirements: 3.1_

  - [x] 11.4 Add upload cancellation
    - Add cancel button during upload
    - Implement AbortController cancellation
    - Clean up resources on cancellation
    - _Requirements: 3.5_

  - [x] 11.5 Add upload retry without re-selection
    - Store selected file in state
    - Add retry button on upload failure
    - Retry using stored file
    - _Requirements: 3.4_

  - [x] 11.6 Write property test for image preview
    - **Property 6: Image Preview Display**
    - **Validates: Requirements 3.1**

  - [x] 11.7 Write property test for upload progress
    - **Property 7: Upload Progress Tracking**
    - **Validates: Requirements 3.2, 6.3**

  - [x] 11.8 Write property test for upload cancellation
    - **Property 10: Upload Cancellation**
    - **Validates: Requirements 3.5**

  - [x] 11.9 Write property test for upload retry
    - **Property 9: Upload Retry Without Re-selection**
    - **Validates: Requirements 3.4**

- [x] 12. Enhance loading states and UI feedback
  - [x] 12.1 Add operation-specific loading indicators
    - Add "Creating..." indicator during item creation
    - Add "Deleting..." indicator during item deletion
    - Add "Updating..." indicator during item update
    - Add pending badge to optimistic items
    - _Requirements: 6.1, 6.2_

  - [x] 12.2 Add fade-out animation for deletions
    - Implement CSS fade-out animation (300ms)
    - Apply animation before removing item from DOM
    - _Requirements: 6.4_

  - [x] 12.3 Add subtle animations for toggles
    - Add animation for availability toggle
    - Add animation for popularity toggle
    - Use smooth transitions for state changes
    - _Requirements: 7.4_

  - [x] 12.4 Add non-blocking refresh indicator
    - Show subtle refresh icon in header during background fetch
    - Keep UI interactive during refresh
    - Don't show blocking spinner
    - _Requirements: 6.5_

  - [x] 12.5 Write property test for loading indicators
    - **Property 16: Operation Loading Indicators**
    - **Validates: Requirements 6.1, 6.2, 6.4, 6.5**

  - [x] 12.6 Write property test for non-blocking refresh
    - **Property 17: Non-Blocking Refresh**
    - **Validates: Requirements 6.5**

- [x] 13. Implement comprehensive error handling
  - [x] 13.1 Add error message display for all operations
    - Show clear error messages on rollback
    - Include operation type in error message
    - Explain what went wrong
    - _Requirements: 8.2_

  - [x] 13.2 Add retry buttons to error notifications
    - Add retry button to all error toasts
    - Implement retry logic for failed operations
    - Track retry count and limit to 5 retries
    - _Requirements: 8.3_

  - [x] 13.3 Add form state preservation on failure
    - Preserve form input values when submission fails
    - Keep form open on failure
    - Allow user to edit and retry
    - _Requirements: 8.5_

  - [x] 13.4 Add automatic retry with exponential backoff
    - Implement retry logic for network errors (max 3 retries)
    - Implement retry logic for server errors (max 2 retries)
    - Use exponential backoff (1s, 2s, 4s)
    - Don't retry on client errors (4xx)
    - _Requirements: 8.1_

  - [x] 13.5 Write property test for error messages
    - **Property 18: Error Message Display**
    - **Validates: Requirements 8.2**

  - [x] 13.6 Write property test for retry button
    - **Property 19: Retry Button Availability**
    - **Validates: Requirements 8.3**

  - [x] 13.7 Write property test for form preservation
    - **Property 20: Form State Preservation**
    - **Validates: Requirements 8.5**

- [x] 14. Implement background synchronization
  - [x] 14.1 Add polling for menu updates
    - Implement 30-second polling interval
    - Poll only when page is visible
    - Pause polling when page is hidden
    - _Requirements: 10.1, 10.3_

  - [x] 14.2 Implement merge logic for background updates
    - Merge new server data with local state
    - Don't disrupt UI during merge
    - Prioritize server state in conflicts
    - _Requirements: 10.2, 10.4_

  - [x] 14.3 Add notifications for new items from other users
    - Detect items added by other users
    - Show subtle notification for new items
    - Don't interrupt user's current work
    - _Requirements: 10.5_

  - [x] 14.4 Write property test for conflict resolution
    - **Property 21: Server State Priority in Conflicts**
    - **Validates: Requirements 10.4**

  - [x] 14.5 Write property test for new item notifications
    - **Property 22: New Item Notification**
    - **Validates: Requirements 10.5**

  - [x] 14.6 Write integration tests for background sync
    - Test polling starts on page load
    - Test polling pauses when page hidden
    - Test merge without UI disruption
    - Test conflict resolution
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 15. Add deletion undo functionality
  - [x] 15.1 Implement undo toast for deletions
    - Show undo toast for 3 seconds after deletion
    - Add undo button to toast
    - Implement undo logic to restore item
    - _Requirements: 4.4_

  - [x] 15.2 Implement position restoration on undo
    - Store original item position before deletion
    - Restore item to exact original position on undo
    - Maintain sort order after restoration
    - _Requirements: 4.5_

  - [x] 15.3 Write property test for undo window
    - **Property 11: Deletion Undo Window**
    - **Validates: Requirements 4.4**

  - [x] 15.4 Write property test for position restoration
    - **Property 12: Deletion Position Restoration**
    - **Validates: Requirements 4.5**

- [-] 16. Final checkpoint and integration testing
  - [x] 16.1 Run all unit tests and property tests
    - Verify all tests pass
    - Check test coverage meets requirements
    - Fix any failing tests
    - _Requirements: All_

  - [ ] 16.2 Perform manual testing of complete flows
    - Test create → upload → delete flow
    - Test create → fail → rollback → retry flow
    - Test offline → queue → online → sync flow
    - Test bulk operations with partial failures
    - Test background sync with conflicts
    - _Requirements: All_

  - [ ] 16.3 Performance testing
    - Measure optimistic update time (target: <50ms)
    - Measure cache read time (target: <10ms)
    - Measure image compression time (target: <1s for 5MB)
    - Measure background sync time (target: <500ms)
    - _Requirements: All_

  - [ ] 16.4 Final checkpoint
    - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end flows
- The implementation follows an incremental approach: utilities → core features → enhancements → polish
