/**
 * Property-Based Tests for Optimistic State Manager
 * **Feature: menu-page-performance, Property 1: Optimistic Update Consistency**
 * **Validates: Requirements 1.1, 1.2, 1.3, 4.1, 4.2, 4.3, 7.1, 7.2, 7.3, 8.1**
 * 
 * Property: For any menu operation (create, update, delete, toggle), the UI SHALL 
 * immediately reflect the change, and if the server confirms the operation, the change 
 * SHALL remain; if the server rejects the operation, the UI SHALL revert to the 
 * previous state and display an error message.
 */

import fc from 'fast-check';
import { MenuOptimisticStateManager } from '../menuOptimisticState';

// Test data generators
const menuItemIdGenerator = fc.string({ minLength: 1, maxLength: 20 });

const menuItemGenerator = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  category: fc.string({ minLength: 1, maxLength: 50 }),
  price: fc.float({ min: Math.fround(0.01), max: Math.fround(9999.99), noNaN: true }),
  description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
  image_url: fc.option(fc.webUrl(), { nil: undefined }),
  available: fc.boolean(),
  preparation_time: fc.integer({ min: 0, max: 120 }),
  is_popular: fc.boolean(),
  is_vegetarian: fc.boolean(),
  is_spicy: fc.boolean(),
  allergens: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
  created_at: fc.integer({ min: 1577836800000, max: 1767225600000 }).map(ts => new Date(ts).toISOString()),
  updated_at: fc.integer({ min: 1577836800000, max: 1767225600000 }).map(ts => new Date(ts).toISOString())
});

const operationTypeGenerator = fc.constantFrom(
  'create',
  'update',
  'delete',
  'toggle_availability',
  'toggle_popularity'
);

const operationGenerator = fc.record({
  id: fc.uuid(),
  type: operationTypeGenerator,
  itemId: menuItemIdGenerator,
  originalState: fc.option(menuItemGenerator, { nil: null }),
  optimisticState: menuItemGenerator,
  retryCount: fc.integer({ min: 0, max: 3 }),
  maxRetries: fc.integer({ min: 1, max: 5 })
});

const errorGenerator = fc.record({
  message: fc.string({ minLength: 1, maxLength: 200 }),
  response: fc.option(
    fc.record({
      status: fc.constantFrom(400, 401, 403, 404, 409, 500, 502, 503)
    }),
    { nil: undefined }
  )
});

describe('Property 1: Optimistic Update Consistency', () => {
  let manager;

  beforeEach(() => {
    manager = new MenuOptimisticStateManager();
  });

  afterEach(() => {
    manager.clear();
  });

  /**
   * Property 1.1: Optimistic updates are applied immediately
   * **Validates: Requirements 1.1, 4.1, 7.1**
   */
  test('Property 1.1: Optimistic updates are applied immediately for all operation types', () => {
    fc.assert(
      fc.property(operationGenerator, (operation) => {
        // Apply optimistic update
        const result = manager.applyOptimisticUpdate(operation);

        // Property: Update should be applied immediately
        expect(result).toBeTruthy();
        expect(result._optimistic).toBe(true);
        expect(result._pendingOperationId).toBe(operation.id);

        // Property: Operation should be tracked as pending
        expect(manager.isOperationPending(operation.id)).toBe(true);
        expect(manager.getPendingOperation(operation.id)).toBeTruthy();

        // Property: Optimistic item should be retrievable
        const optimisticItem = manager.getOptimisticItem(operation.itemId);
        expect(optimisticItem).toBeTruthy();
        expect(optimisticItem._optimistic).toBe(true);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1.2: Confirmed operations finalize the update
   * **Validates: Requirements 1.2, 4.2, 7.2**
   */
  test('Property 1.2: Confirmed operations finalize the update and remove pending status', () => {
    fc.assert(
      fc.property(
        operationGenerator,
        menuItemGenerator,
        (operation, serverData) => {
          // For delete operations, ensure originalState exists
          if (operation.type === 'delete' && !operation.originalState) {
            operation.originalState = { ...operation.optimisticState };
          }

          // Apply optimistic update
          manager.applyOptimisticUpdate(operation);

          // Confirm operation - for delete operations, don't pass serverData
          const confirmed = operation.type === 'delete' 
            ? manager.confirmOperation(operation.id)
            : manager.confirmOperation(operation.id, serverData);

          // Property: Confirmation should succeed
          expect(confirmed).toBe(true);

          // Property: Operation should no longer be pending
          expect(manager.isOperationPending(operation.id)).toBe(false);

          // Property: For non-delete operations, item should be updated with server data
          if (operation.type !== 'delete') {
            const finalItem = manager.getOptimisticItem(operation.itemId);
            expect(finalItem).toBeTruthy();
            expect(finalItem._optimistic).toBe(false);
            expect(finalItem._pendingOperationId).toBeNull();
            expect(finalItem.id).toBe(serverData.id);
          } else {
            // Property: For delete operations, item should be removed
            const finalItem = manager.getOptimisticItem(operation.itemId);
            expect(finalItem).toBeNull();
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1.3: Failed operations rollback to original state
   * **Validates: Requirements 1.3, 4.3, 7.3, 8.1**
   */
  test('Property 1.3: Failed operations rollback to original state for all operation types', () => {
    fc.assert(
      fc.property(
        operationGenerator,
        errorGenerator,
        (operation, error) => {
          // Ensure operation has original state for non-create operations
          if (operation.type !== 'create' && !operation.originalState) {
            operation.originalState = { ...operation.optimisticState };
          }

          // Apply optimistic update
          manager.applyOptimisticUpdate(operation);

          // Rollback operation
          const rolledBackState = manager.rollbackOperation(operation.id, error);

          // Property: Operation should no longer be pending
          expect(manager.isOperationPending(operation.id)).toBe(false);

          // Property: Rollback behavior depends on operation type
          if (operation.type === 'create') {
            // Property: Created items should be removed on rollback
            const item = manager.getOptimisticItem(operation.itemId);
            expect(item).toBeNull();
            expect(rolledBackState).toBeNull();
          } else if (operation.type === 'delete') {
            // Property: Deleted items should be restored on rollback
            const item = manager.getOptimisticItem(operation.itemId);
            expect(item).toBeTruthy();
            expect(item._optimistic).toBe(false);
            expect(rolledBackState).toBeTruthy();
          } else {
            // Property: Updated/toggled items should revert to original state
            const item = manager.getOptimisticItem(operation.itemId);
            expect(item).toBeTruthy();
            expect(item._optimistic).toBe(false);
            expect(rolledBackState).toBeTruthy();
          }

          // Property: Rollback should be added to rollback queue
          const recentRollbacks = manager.getRecentRollbacks();
          expect(recentRollbacks.length).toBeGreaterThan(0);
          const lastRollback = recentRollbacks[recentRollbacks.length - 1];
          expect(lastRollback.operationId).toBe(operation.id);
          expect(lastRollback.errorMessage).toBeTruthy();

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1.4: Multiple concurrent operations are tracked independently
   * **Validates: Requirements 1.1, 1.2, 1.3**
   */
  test('Property 1.4: Multiple concurrent operations are tracked independently', () => {
    fc.assert(
      fc.property(
        fc.array(operationGenerator, { minLength: 2, maxLength: 10 }),
        (operations) => {
          // Ensure unique operation IDs and item IDs
          const uniqueOperations = operations.map((op, index) => ({
            ...op,
            id: `op_${index}_${op.id}`,
            itemId: `item_${index}_${op.itemId}`
          }));

          // Apply all optimistic updates
          uniqueOperations.forEach(op => {
            manager.applyOptimisticUpdate(op);
          });

          // Property: All operations should be tracked
          expect(manager.getPendingOperations().length).toBe(uniqueOperations.length);

          // Property: Each operation should be independently retrievable
          uniqueOperations.forEach(op => {
            expect(manager.isOperationPending(op.id)).toBe(true);
            expect(manager.getOptimisticItem(op.itemId)).toBeTruthy();
          });

          // Confirm half, rollback half
          const halfIndex = Math.floor(uniqueOperations.length / 2);
          uniqueOperations.slice(0, halfIndex).forEach(op => {
            manager.confirmOperation(op.id, op.optimisticState);
          });
          uniqueOperations.slice(halfIndex).forEach(op => {
            manager.rollbackOperation(op.id, new Error('Test error'));
          });

          // Property: Confirmed operations should not be pending
          uniqueOperations.slice(0, halfIndex).forEach(op => {
            expect(manager.isOperationPending(op.id)).toBe(false);
          });

          // Property: Rolled back operations should not be pending
          uniqueOperations.slice(halfIndex).forEach(op => {
            expect(manager.isOperationPending(op.id)).toBe(false);
          });

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1.5: Error messages are generated for all error types
   * **Validates: Requirement 8.1**
   */
  test('Property 1.5: Error messages are generated appropriately for all error types', () => {
    fc.assert(
      fc.property(
        operationGenerator,
        errorGenerator,
        (operation, error) => {
          // Apply and rollback operation
          manager.applyOptimisticUpdate(operation);
          manager.rollbackOperation(operation.id, error);

          // Property: Error message should be generated
          const recentRollbacks = manager.getRecentRollbacks();
          const lastRollback = recentRollbacks[recentRollbacks.length - 1];
          
          expect(lastRollback.errorMessage).toBeTruthy();
          expect(typeof lastRollback.errorMessage).toBe('string');
          expect(lastRollback.errorMessage.length).toBeGreaterThan(0);

          // Property: Error message should contain operation type
          const operationNames = {
            create: 'create menu item',
            update: 'update menu item',
            delete: 'delete menu item',
            toggle_availability: 'toggle item availability',
            toggle_popularity: 'toggle item popularity'
          };
          const expectedPhrase = operationNames[operation.type];
          expect(lastRollback.errorMessage.toLowerCase()).toContain(expectedPhrase.toLowerCase());

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1.6: Temporary IDs are unique and distinguishable
   * **Validates: Requirement 1.4**
   */
  test('Property 1.6: Temporary IDs are unique and distinguishable from server IDs', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 100 }),
        (count) => {
          const tempIds = new Set();

          // Generate multiple temporary IDs
          for (let i = 0; i < count; i++) {
            const tempId = manager.generateTemporaryId();
            
            // Property: Temporary ID should start with 'temp_'
            expect(tempId).toMatch(/^temp_/);
            
            // Property: Temporary ID should be unique
            expect(tempIds.has(tempId)).toBe(false);
            tempIds.add(tempId);
          }

          // Property: All generated IDs should be unique
          expect(tempIds.size).toBe(count);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 1.7: Retry count is tracked correctly
   * **Validates: Requirement 8.1**
   */
  test('Property 1.7: Retry count is tracked and enforced correctly', () => {
    fc.assert(
      fc.property(
        operationGenerator,
        fc.integer({ min: 1, max: 10 }),
        (operation, retryAttempts) => {
          // Apply optimistic update
          manager.applyOptimisticUpdate(operation);

          // Property: Initial retry count should be as specified
          const initialOp = manager.getPendingOperation(operation.id);
          expect(initialOp.retryCount).toBe(operation.retryCount || 0);

          // Increment retry count multiple times
          for (let i = 0; i < retryAttempts; i++) {
            manager.incrementRetryCount(operation.id);
          }

          // Property: Retry count should be incremented correctly
          const updatedOp = manager.getPendingOperation(operation.id);
          expect(updatedOp.retryCount).toBe((operation.retryCount || 0) + retryAttempts);

          // Property: canRetry should respect maxRetries
          const canRetry = manager.canRetry(operation.id);
          expect(canRetry).toBe(updatedOp.retryCount < updatedOp.maxRetries);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1.8: State consistency after clear operation
   * **Validates: Requirements 1.1, 1.2, 1.3**
   */
  test('Property 1.8: Clear operation resets all state consistently', () => {
    fc.assert(
      fc.property(
        fc.array(operationGenerator, { minLength: 1, maxLength: 20 }),
        (operations) => {
          // Apply multiple optimistic updates
          operations.forEach(op => {
            manager.applyOptimisticUpdate(op);
          });

          // Property: State should have pending operations before clear
          expect(manager.getPendingOperations().length).toBeGreaterThan(0);

          // Clear all state
          manager.clear();

          // Property: All state should be cleared
          expect(manager.getPendingOperations().length).toBe(0);
          expect(manager.getAllOptimisticItems().length).toBe(0);
          expect(manager.getRecentRollbacks().length).toBe(0);

          // Property: Operations should not be retrievable after clear
          operations.forEach(op => {
            expect(manager.isOperationPending(op.id)).toBe(false);
            expect(manager.getPendingOperation(op.id)).toBeNull();
            expect(manager.getOptimisticItem(op.itemId)).toBeNull();
          });

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1.9: Rollback queue has bounded size
   * **Validates: Requirement 8.1**
   */
  test('Property 1.9: Rollback queue maintains bounded size', () => {
    fc.assert(
      fc.property(
        fc.array(operationGenerator, { minLength: 15, maxLength: 30 }),
        (operations) => {
          // Apply and rollback multiple operations
          operations.forEach(op => {
            manager.applyOptimisticUpdate(op);
            manager.rollbackOperation(op.id, new Error('Test error'));
          });

          // Property: Rollback queue should not exceed maximum size (10)
          const rollbacks = manager.getRecentRollbacks(100);
          expect(rollbacks.length).toBeLessThanOrEqual(10);

          // Property: Most recent rollbacks should be retained
          if (operations.length > 10) {
            const lastOperation = operations[operations.length - 1];
            const lastRollback = rollbacks[rollbacks.length - 1];
            expect(lastRollback.operationId).toBe(lastOperation.id);
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 1.10: Statistics are accurate
   * **Validates: Requirements 1.1, 1.2, 1.3**
   */
  test('Property 1.10: Statistics accurately reflect current state', () => {
    fc.assert(
      fc.property(
        fc.array(operationGenerator, { minLength: 1, maxLength: 15 }),
        fc.integer({ min: 0, max: 100 }),
        (operations, confirmCount) => {
          // Create a fresh manager for this test iteration
          const testManager = new MenuOptimisticStateManager();

          // Ensure unique operation IDs
          const uniqueOperations = operations.map((op, index) => ({
            ...op,
            id: `op_${index}_${op.id}`,
            itemId: `item_${index}_${op.itemId}`
          }));

          // Apply all operations
          uniqueOperations.forEach(op => {
            testManager.applyOptimisticUpdate(op);
          });

          // Confirm some operations
          const toConfirm = Math.min(confirmCount, uniqueOperations.length);
          for (let i = 0; i < toConfirm; i++) {
            const op = uniqueOperations[i];
            if (op.type === 'delete') {
              testManager.confirmOperation(op.id);
            } else {
              testManager.confirmOperation(op.id, op.optimisticState);
            }
          }

          // Get statistics
          const stats = testManager.getStats();

          // Property: Pending operations count should match actual pending operations
          const expectedPending = uniqueOperations.length - toConfirm;
          expect(stats.pendingOperationsCount).toBe(expectedPending);
          expect(stats.pendingOperations.length).toBe(expectedPending);

          // Property: Each pending operation should have required fields
          stats.pendingOperations.forEach(op => {
            expect(op).toHaveProperty('id');
            expect(op).toHaveProperty('type');
            expect(op).toHaveProperty('itemId');
            expect(op).toHaveProperty('retryCount');
            expect(op).toHaveProperty('age');
            expect(typeof op.age).toBe('number');
            expect(op.age).toBeGreaterThanOrEqual(0);
          });

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1.11: Original state is preserved for rollback
   * **Validates: Requirements 4.3, 7.3**
   */
  test('Property 1.11: Original state is preserved correctly for rollback', () => {
    fc.assert(
      fc.property(
        menuItemGenerator,
        menuItemGenerator,
        operationTypeGenerator,
        (originalItem, modifiedItem, operationType) => {
          // Skip create operations (no original state)
          if (operationType === 'create') {
            return true;
          }

          const operation = {
            id: `op_${Date.now()}_${Math.random()}`,
            type: operationType,
            itemId: originalItem.id,
            originalState: originalItem,
            optimisticState: modifiedItem,
            retryCount: 0,
            maxRetries: 3
          };

          // Apply optimistic update
          manager.applyOptimisticUpdate(operation);

          // Property: Original state should be stored
          const optimisticItem = manager.getOptimisticItem(operation.itemId);
          expect(optimisticItem._originalState).toEqual(originalItem);

          // Rollback operation
          const rolledBackState = manager.rollbackOperation(operation.id, new Error('Test'));

          // Property: Rolled back state should match original state
          if (operationType === 'delete') {
            expect(rolledBackState).toEqual(originalItem);
          } else {
            expect(rolledBackState).toEqual(originalItem);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1.12: Invalid operations are handled gracefully
   * **Validates: Requirements 1.1, 1.2, 1.3**
   */
  test('Property 1.12: Invalid operations are handled gracefully', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(null, undefined, {}, { id: null }, { type: 'invalid' }),
        (invalidOperation) => {
          // Property: Invalid operations should not crash
          expect(() => {
            manager.applyOptimisticUpdate(invalidOperation);
          }).not.toThrow();

          // Property: Invalid operations should return null
          const result = manager.applyOptimisticUpdate(invalidOperation);
          expect(result).toBeNull();

          // Property: State should remain consistent
          expect(manager.getPendingOperations().length).toBe(0);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 1.13: Confirming non-existent operation is handled gracefully
   * **Validates: Requirement 1.2**
   */
  test('Property 1.13: Confirming non-existent operation returns false', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        (nonExistentId) => {
          // Property: Confirming non-existent operation should return false
          const result = manager.confirmOperation(nonExistentId);
          expect(result).toBe(false);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 1.14: Rolling back non-existent operation is handled gracefully
   * **Validates: Requirement 1.3**
   */
  test('Property 1.14: Rolling back non-existent operation returns null', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        errorGenerator,
        (nonExistentId, error) => {
          // Property: Rolling back non-existent operation should return null
          const result = manager.rollbackOperation(nonExistentId, error);
          expect(result).toBeNull();

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});

// Integration tests to verify property test setup
describe('Property Test Infrastructure', () => {
  test('should generate valid menu items', () => {
    fc.assert(
      fc.property(menuItemGenerator, (item) => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('price');
        expect(item).toHaveProperty('available');
        expect(typeof item.id).toBe('string');
        expect(typeof item.name).toBe('string');
        expect(typeof item.price).toBe('number');
        expect(typeof item.available).toBe('boolean');
        expect(item.price).toBeGreaterThan(0);
        return true;
      }),
      { numRuns: 20 }
    );
  });

  test('should generate valid operations', () => {
    fc.assert(
      fc.property(operationGenerator, (operation) => {
        expect(operation).toHaveProperty('id');
        expect(operation).toHaveProperty('type');
        expect(operation).toHaveProperty('itemId');
        expect(operation).toHaveProperty('optimisticState');
        expect(['create', 'update', 'delete', 'toggle_availability', 'toggle_popularity']).toContain(operation.type);
        return true;
      }),
      { numRuns: 20 }
    );
  });

  test('should generate valid errors', () => {
    fc.assert(
      fc.property(errorGenerator, (error) => {
        expect(error).toHaveProperty('message');
        expect(typeof error.message).toBe('string');
        if (error.response) {
          expect(error.response).toHaveProperty('status');
          expect(typeof error.response.status).toBe('number');
        }
        return true;
      }),
      { numRuns: 20 }
    );
  });
});
