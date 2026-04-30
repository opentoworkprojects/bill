/**
 * Unit Tests for Optimistic State Manager
 * Focuses on specific examples and edge cases
 */

import { MenuOptimisticStateManager } from '../menuOptimisticState';

describe('MenuOptimisticStateManager - Unit Tests', () => {
  let manager;

  beforeEach(() => {
    manager = new MenuOptimisticStateManager();
  });

  afterEach(() => {
    manager.clear();
  });

  describe('generateTemporaryId()', () => {
    /**
     * Task 2.2: Verify temporary ID generation meets requirements
     * Requirements: 1.4
     */
    test('should generate IDs with temp_ prefix', () => {
      const tempId = manager.generateTemporaryId();
      
      // Should start with 'temp_' prefix
      expect(tempId).toMatch(/^temp_/);
      
      // Should be a non-empty string
      expect(tempId.length).toBeGreaterThan(5);
      
      // If crypto.randomUUID is available, should be UUID format
      // Otherwise, should be timestamp-based format
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        // UUID format: temp_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
        expect(tempId).toMatch(/^temp_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      } else {
        // Fallback format: temp_timestamp_randomstring
        expect(tempId).toMatch(/^temp_\d+_[a-z0-9]+$/);
      }
    });

    test('should generate unique IDs', () => {
      const ids = new Set();
      const count = 1000;

      for (let i = 0; i < count; i++) {
        const id = manager.generateTemporaryId();
        ids.add(id);
      }

      // All IDs should be unique
      expect(ids.size).toBe(count);
    });

    test('should be distinguishable from server IDs', () => {
      const tempId = manager.generateTemporaryId();
      const serverIds = [
        '123',
        'abc123',
        'menu_item_456',
        '550e8400-e29b-41d4-a716-446655440000'
      ];

      // Temporary ID should start with 'temp_'
      expect(tempId.startsWith('temp_')).toBe(true);

      // Server IDs should not start with 'temp_'
      serverIds.forEach(serverId => {
        expect(serverId.startsWith('temp_')).toBe(false);
      });

      // Easy to distinguish
      expect(tempId).not.toEqual(expect.arrayContaining(serverIds));
    });

    test('should work in environments without crypto.randomUUID', () => {
      // Save original crypto
      const originalCrypto = global.crypto;

      // Mock environment without crypto.randomUUID
      global.crypto = undefined;

      const tempId = manager.generateTemporaryId();

      // Should still generate valid temporary ID
      expect(tempId).toMatch(/^temp_/);
      expect(tempId.length).toBeGreaterThan(5);

      // Restore original crypto
      global.crypto = originalCrypto;
    });

    test('fallback IDs should also be unique', () => {
      // Save original crypto
      const originalCrypto = global.crypto;

      // Mock environment without crypto.randomUUID
      global.crypto = undefined;

      const ids = new Set();
      const count = 100;

      for (let i = 0; i < count; i++) {
        const id = manager.generateTemporaryId();
        ids.add(id);
      }

      // All fallback IDs should be unique
      expect(ids.size).toBe(count);

      // Restore original crypto
      global.crypto = originalCrypto;
    });
  });

  describe('Optimistic item creation with temporary IDs', () => {
    test('should create optimistic item with temporary ID', () => {
      const tempId = manager.generateTemporaryId();
      const operation = {
        id: 'op_123',
        type: 'create',
        itemId: tempId,
        optimisticState: {
          id: tempId,
          name: 'New Item',
          price: 10.99,
          available: true
        }
      };

      const result = manager.applyOptimisticUpdate(operation);

      // Should have temporary ID
      expect(result.id).toBe(tempId);
      expect(result.id).toMatch(/^temp_/);
      expect(result._optimistic).toBe(true);
    });

    test('should replace temporary ID with server ID on confirmation', () => {
      const tempId = manager.generateTemporaryId();
      const serverId = 'server_item_456';
      
      const operation = {
        id: 'op_123',
        type: 'create',
        itemId: tempId,
        optimisticState: {
          id: tempId,
          name: 'New Item',
          price: 10.99,
          available: true
        }
      };

      // Apply optimistic update with temporary ID
      manager.applyOptimisticUpdate(operation);

      // Confirm with server data (real ID)
      const serverData = {
        id: serverId,
        name: 'New Item',
        price: 10.99,
        available: true
      };
      manager.confirmOperation(operation.id, serverData);

      // Should have server ID now
      const finalItem = manager.getOptimisticItem(tempId);
      expect(finalItem.id).toBe(serverId);
      expect(finalItem.id).not.toMatch(/^temp_/);
      expect(finalItem._optimistic).toBe(false);
    });

    test('should remove temporary item on rollback', () => {
      const tempId = manager.generateTemporaryId();
      
      const operation = {
        id: 'op_123',
        type: 'create',
        itemId: tempId,
        optimisticState: {
          id: tempId,
          name: 'New Item',
          price: 10.99,
          available: true
        }
      };

      // Apply optimistic update
      manager.applyOptimisticUpdate(operation);
      expect(manager.getOptimisticItem(tempId)).toBeTruthy();

      // Rollback on failure
      manager.rollbackOperation(operation.id, new Error('Server error'));

      // Temporary item should be removed
      expect(manager.getOptimisticItem(tempId)).toBeNull();
    });
  });

  describe('Edge cases - Task 2.4', () => {
    /**
     * Task 2.4: Unit tests for optimistic state edge cases
     * Requirements: 1.1, 1.2, 1.3
     */
    
    test('should handle empty state initialization', () => {
      // Verify all state collections are empty on initialization
      expect(manager.getPendingOperations()).toEqual([]);
      expect(manager.getAllOptimisticItems()).toEqual([]);
      expect(manager.getRecentRollbacks()).toEqual([]);
      
      // Verify queries on empty state don't crash
      expect(manager.isOperationPending('non_existent')).toBe(false);
      expect(manager.getOptimisticItem('non_existent')).toBeNull();
      expect(manager.getPendingOperation('non_existent')).toBeNull();
    });

    test('should handle multiple concurrent operations', () => {
      const operations = [
        {
          id: 'op_1',
          type: 'create',
          itemId: manager.generateTemporaryId(),
          optimisticState: { id: 'temp_1', name: 'Item 1' }
        },
        {
          id: 'op_2',
          type: 'update',
          itemId: 'item_2',
          originalState: { id: 'item_2', name: 'Old Name' },
          optimisticState: { id: 'item_2', name: 'New Name' }
        },
        {
          id: 'op_3',
          type: 'delete',
          itemId: 'item_3',
          originalState: { id: 'item_3', name: 'To Delete' },
          optimisticState: { id: 'item_3', name: 'To Delete' }
        }
      ];

      operations.forEach(op => manager.applyOptimisticUpdate(op));

      expect(manager.getPendingOperations().length).toBe(3);
      operations.forEach(op => {
        expect(manager.isOperationPending(op.id)).toBe(true);
      });
    });

    test('should handle rollback with missing original state', () => {
      const operation = {
        id: 'op_1',
        type: 'update',
        itemId: 'item_1',
        optimisticState: { id: 'item_1', name: 'Updated' }
        // Missing originalState
      };

      manager.applyOptimisticUpdate(operation);
      
      // Should not crash on rollback
      expect(() => {
        manager.rollbackOperation(operation.id, new Error('Test error'));
      }).not.toThrow();
      
      // Operation should be removed from pending
      expect(manager.isOperationPending(operation.id)).toBe(false);
      
      // Rollback should be recorded
      const rollbacks = manager.getRecentRollbacks();
      expect(rollbacks.length).toBe(1);
      expect(rollbacks[0].operationId).toBe(operation.id);
    });

    test('should handle multiple concurrent operations on same item', () => {
      // Simulate rapid updates to the same item
      const operations = [
        {
          id: 'op_1',
          type: 'update',
          itemId: 'item_1',
          originalState: { id: 'item_1', name: 'Original', price: 10 },
          optimisticState: { id: 'item_1', name: 'Update 1', price: 10 }
        },
        {
          id: 'op_2',
          type: 'update',
          itemId: 'item_1',
          originalState: { id: 'item_1', name: 'Update 1', price: 10 },
          optimisticState: { id: 'item_1', name: 'Update 2', price: 15 }
        },
        {
          id: 'op_3',
          type: 'toggle_availability',
          itemId: 'item_1',
          originalState: { id: 'item_1', name: 'Update 2', price: 15, available: true },
          optimisticState: { id: 'item_1', name: 'Update 2', price: 15, available: false }
        }
      ];

      // Apply all operations
      operations.forEach(op => manager.applyOptimisticUpdate(op));

      // All operations should be tracked
      expect(manager.getPendingOperations().length).toBe(3);
      
      // Latest state should reflect all changes
      const item = manager.getOptimisticItem('item_1');
      expect(item.name).toBe('Update 2');
      expect(item.price).toBe(15);
      expect(item.available).toBe(false);
    });

    test('should handle confirming operations out of order', () => {
      const operations = [
        {
          id: 'op_1',
          type: 'create',
          itemId: 'temp_1',
          optimisticState: { id: 'temp_1', name: 'Item 1' }
        },
        {
          id: 'op_2',
          type: 'create',
          itemId: 'temp_2',
          optimisticState: { id: 'temp_2', name: 'Item 2' }
        },
        {
          id: 'op_3',
          type: 'create',
          itemId: 'temp_3',
          optimisticState: { id: 'temp_3', name: 'Item 3' }
        }
      ];

      operations.forEach(op => manager.applyOptimisticUpdate(op));
      expect(manager.getPendingOperations().length).toBe(3);

      // Confirm operations out of order (2, 1, 3)
      manager.confirmOperation('op_2', { id: 'server_2', name: 'Item 2' });
      expect(manager.isOperationPending('op_2')).toBe(false);
      expect(manager.getPendingOperations().length).toBe(2);

      manager.confirmOperation('op_1', { id: 'server_1', name: 'Item 1' });
      expect(manager.isOperationPending('op_1')).toBe(false);
      expect(manager.getPendingOperations().length).toBe(1);

      manager.confirmOperation('op_3', { id: 'server_3', name: 'Item 3' });
      expect(manager.isOperationPending('op_3')).toBe(false);
      expect(manager.getPendingOperations().length).toBe(0);
    });

    test('should handle rolling back operations out of order', () => {
      const operations = [
        {
          id: 'op_1',
          type: 'create',
          itemId: 'temp_1',
          optimisticState: { id: 'temp_1', name: 'Item 1' }
        },
        {
          id: 'op_2',
          type: 'create',
          itemId: 'temp_2',
          optimisticState: { id: 'temp_2', name: 'Item 2' }
        },
        {
          id: 'op_3',
          type: 'create',
          itemId: 'temp_3',
          optimisticState: { id: 'temp_3', name: 'Item 3' }
        }
      ];

      operations.forEach(op => manager.applyOptimisticUpdate(op));

      // Rollback middle operation first
      manager.rollbackOperation('op_2', new Error('Failed'));
      expect(manager.isOperationPending('op_2')).toBe(false);
      expect(manager.getOptimisticItem('temp_2')).toBeNull();
      
      // Other operations should still be pending
      expect(manager.isOperationPending('op_1')).toBe(true);
      expect(manager.isOperationPending('op_3')).toBe(true);
    });

    test('should handle confirming non-existent operation gracefully', () => {
      const result = manager.confirmOperation('non_existent_op', { id: 'server_1' });
      expect(result).toBe(false);
      // Should not crash or throw
    });

    test('should handle very large number of concurrent operations', () => {
      const operationCount = 100;
      const operations = [];

      // Create 100 concurrent operations
      for (let i = 0; i < operationCount; i++) {
        const operation = {
          id: `op_${i}`,
          type: 'create',
          itemId: `temp_${i}`,
          optimisticState: { id: `temp_${i}`, name: `Item ${i}` }
        };
        operations.push(operation);
        manager.applyOptimisticUpdate(operation);
      }

      // All should be tracked
      expect(manager.getPendingOperations().length).toBe(operationCount);

      // Confirm half, rollback half
      for (let i = 0; i < operationCount; i++) {
        if (i % 2 === 0) {
          manager.confirmOperation(`op_${i}`, { id: `server_${i}`, name: `Item ${i}` });
        } else {
          manager.rollbackOperation(`op_${i}`, new Error('Test error'));
        }
      }

      // All should be resolved
      expect(manager.getPendingOperations().length).toBe(0);
    });

    test('should handle operation with null or undefined fields', () => {
      const operation = {
        id: 'op_1',
        type: 'update',
        itemId: 'item_1',
        originalState: { id: 'item_1', name: null, price: undefined },
        optimisticState: { id: 'item_1', name: 'Updated', price: 10 }
      };

      // Should not crash
      expect(() => {
        manager.applyOptimisticUpdate(operation);
      }).not.toThrow();

      const item = manager.getOptimisticItem('item_1');
      expect(item.name).toBe('Updated');
      expect(item.price).toBe(10);
    });

    test('should handle rollback when optimistic item was already removed', () => {
      const operation = {
        id: 'op_1',
        type: 'create',
        itemId: 'temp_1',
        optimisticState: { id: 'temp_1', name: 'Item' }
      };

      manager.applyOptimisticUpdate(operation);
      
      // Manually clear the optimistic item (simulating external removal)
      manager.clear();

      // Rollback should handle gracefully
      expect(() => {
        manager.rollbackOperation(operation.id, new Error('Test error'));
      }).not.toThrow();
    });

    test('should handle empty operation object', () => {
      const operation = {
        id: 'op_1'
        // Missing type, itemId, and states
      };

      // Should handle gracefully without crashing
      expect(() => {
        manager.applyOptimisticUpdate(operation);
      }).not.toThrow();
    });

    test('should maintain operation order in pending operations list', () => {
      const operations = [];
      for (let i = 0; i < 5; i++) {
        const operation = {
          id: `op_${i}`,
          type: 'create',
          itemId: `temp_${i}`,
          optimisticState: { id: `temp_${i}`, name: `Item ${i}` }
        };
        operations.push(operation);
        manager.applyOptimisticUpdate(operation);
      }

      const pendingOps = manager.getPendingOperations();
      
      // Operations should be in the order they were added
      for (let i = 0; i < 5; i++) {
        expect(pendingOps[i].id).toBe(`op_${i}`);
      }
    });

    test('should handle rapid create and delete of same item', () => {
      const tempId = manager.generateTemporaryId();
      
      // Create item
      const createOp = {
        id: 'op_create',
        type: 'create',
        itemId: tempId,
        optimisticState: { id: tempId, name: 'New Item' }
      };
      manager.applyOptimisticUpdate(createOp);
      expect(manager.getOptimisticItem(tempId)).toBeTruthy();

      // Immediately delete it
      const deleteOp = {
        id: 'op_delete',
        type: 'delete',
        itemId: tempId,
        originalState: { id: tempId, name: 'New Item' },
        optimisticState: { id: tempId, name: 'New Item' }
      };
      manager.applyOptimisticUpdate(deleteOp);

      // Both operations should be tracked
      expect(manager.isOperationPending('op_create')).toBe(true);
      expect(manager.isOperationPending('op_delete')).toBe(true);
    });

    test('should handle operation with extremely long strings', () => {
      const longString = 'a'.repeat(10000);
      const operation = {
        id: 'op_1',
        type: 'create',
        itemId: 'temp_1',
        optimisticState: { 
          id: 'temp_1', 
          name: longString,
          description: longString
        }
      };

      // Should handle without crashing
      expect(() => {
        manager.applyOptimisticUpdate(operation);
      }).not.toThrow();

      const item = manager.getOptimisticItem('temp_1');
      expect(item.name.length).toBe(10000);
    });

    test('should handle operation with special characters in IDs', () => {
      const specialIds = [
        'item-with-dashes',
        'item_with_underscores',
        'item.with.dots',
        'item@with@at',
        'item#with#hash'
      ];

      specialIds.forEach((itemId, index) => {
        const operation = {
          id: `op_${index}`,
          type: 'update',
          itemId: itemId,
          originalState: { id: itemId, name: 'Old' },
          optimisticState: { id: itemId, name: 'New' }
        };

        expect(() => {
          manager.applyOptimisticUpdate(operation);
        }).not.toThrow();

        expect(manager.getOptimisticItem(itemId)).toBeTruthy();
      });
    });
  });

  describe('Rollback Queue Management - Task 2.3', () => {
    /**
     * Task 2.3: Verify rollback queue management functions
     * Requirements: 8.1, 8.2
     */
    test('should add rollback to queue on operation failure', () => {
      const operation = {
        id: 'op_1',
        type: 'create',
        itemId: manager.generateTemporaryId(),
        optimisticState: { id: 'temp_1', name: 'New Item' }
      };

      manager.applyOptimisticUpdate(operation);
      manager.rollbackOperation(operation.id, new Error('Server error'));

      const rollbacks = manager.getRecentRollbacks();
      expect(rollbacks.length).toBe(1);
      expect(rollbacks[0].operationId).toBe(operation.id);
      expect(rollbacks[0].errorMessage).toBeTruthy();
    });

    test('should limit rollback queue to 10 items', () => {
      // Create 15 operations and roll them all back
      for (let i = 0; i < 15; i++) {
        const operation = {
          id: `op_${i}`,
          type: 'create',
          itemId: manager.generateTemporaryId(),
          optimisticState: { id: `temp_${i}`, name: `Item ${i}` }
        };

        manager.applyOptimisticUpdate(operation);
        manager.rollbackOperation(operation.id, new Error('Test error'));
      }

      const rollbacks = manager.getRecentRollbacks(100); // Request more than limit
      expect(rollbacks.length).toBe(10); // Should be limited to 10
      
      // Should contain the most recent 10 rollbacks
      expect(rollbacks[rollbacks.length - 1].operationId).toBe('op_14');
      expect(rollbacks[0].operationId).toBe('op_5');
    });

    test('should retrieve limited number of recent rollbacks', () => {
      // Create 5 rollbacks
      for (let i = 0; i < 5; i++) {
        const operation = {
          id: `op_${i}`,
          type: 'create',
          itemId: manager.generateTemporaryId(),
          optimisticState: { id: `temp_${i}`, name: `Item ${i}` }
        };

        manager.applyOptimisticUpdate(operation);
        manager.rollbackOperation(operation.id, new Error('Test error'));
      }

      // Get only 3 most recent
      const rollbacks = manager.getRecentRollbacks(3);
      expect(rollbacks.length).toBe(3);
      expect(rollbacks[2].operationId).toBe('op_4'); // Most recent
      expect(rollbacks[0].operationId).toBe('op_2'); // Third most recent
    });

    test('should clear rollback queue', () => {
      // Create some rollbacks
      for (let i = 0; i < 3; i++) {
        const operation = {
          id: `op_${i}`,
          type: 'create',
          itemId: manager.generateTemporaryId(),
          optimisticState: { id: `temp_${i}`, name: `Item ${i}` }
        };

        manager.applyOptimisticUpdate(operation);
        manager.rollbackOperation(operation.id, new Error('Test error'));
      }

      expect(manager.getRecentRollbacks().length).toBe(3);

      manager.clearRollbackQueue();
      expect(manager.getRecentRollbacks().length).toBe(0);
    });

    test('rollback queue should include timestamp', () => {
      const operation = {
        id: 'op_1',
        type: 'create',
        itemId: manager.generateTemporaryId(),
        optimisticState: { id: 'temp_1', name: 'New Item' }
      };

      const beforeTime = Date.now();
      manager.applyOptimisticUpdate(operation);
      manager.rollbackOperation(operation.id, new Error('Server error'));
      const afterTime = Date.now();

      const rollbacks = manager.getRecentRollbacks();
      expect(rollbacks[0].timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(rollbacks[0].timestamp).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('Automatic Rollback on Failure - Task 2.3', () => {
    /**
     * Task 2.3: Verify automatic rollback for different operation types
     * Requirements: 8.1
     */
    test('should automatically rollback create operation', () => {
      const tempId = manager.generateTemporaryId();
      const operation = {
        id: 'op_1',
        type: 'create',
        itemId: tempId,
        optimisticState: { id: tempId, name: 'New Item', price: 10.99 }
      };

      manager.applyOptimisticUpdate(operation);
      expect(manager.getOptimisticItem(tempId)).toBeTruthy();

      // Rollback should remove the optimistic item
      manager.rollbackOperation(operation.id, new Error('Server error'));
      expect(manager.getOptimisticItem(tempId)).toBeNull();
      expect(manager.isOperationPending(operation.id)).toBe(false);
    });

    test('should automatically rollback update operation', () => {
      const operation = {
        id: 'op_1',
        type: 'update',
        itemId: 'item_1',
        originalState: { id: 'item_1', name: 'Original Name', price: 10.99 },
        optimisticState: { id: 'item_1', name: 'Updated Name', price: 15.99 }
      };

      manager.applyOptimisticUpdate(operation);
      const optimisticItem = manager.getOptimisticItem('item_1');
      expect(optimisticItem.name).toBe('Updated Name');

      // Rollback should restore original state
      const rolledBack = manager.rollbackOperation(operation.id, new Error('Server error'));
      expect(rolledBack).toEqual(operation.originalState);
      
      const restoredItem = manager.getOptimisticItem('item_1');
      expect(restoredItem.name).toBe('Original Name');
      expect(restoredItem.price).toBe(10.99);
      expect(restoredItem._optimistic).toBe(false);
    });

    test('should automatically rollback delete operation', () => {
      const operation = {
        id: 'op_1',
        type: 'delete',
        itemId: 'item_1',
        originalState: { id: 'item_1', name: 'Item to Delete', price: 10.99 },
        optimisticState: { id: 'item_1', name: 'Item to Delete', price: 10.99 }
      };

      manager.applyOptimisticUpdate(operation);
      
      // Simulate deletion (in real scenario, item would be removed from UI)
      // For rollback test, we need to verify restoration
      manager.rollbackOperation(operation.id, new Error('Server error'));
      
      const restoredItem = manager.getOptimisticItem('item_1');
      expect(restoredItem).toBeTruthy();
      expect(restoredItem.name).toBe('Item to Delete');
      expect(restoredItem._optimistic).toBe(false);
    });

    test('should automatically rollback toggle_availability operation', () => {
      const operation = {
        id: 'op_1',
        type: 'toggle_availability',
        itemId: 'item_1',
        originalState: { id: 'item_1', name: 'Item', available: true },
        optimisticState: { id: 'item_1', name: 'Item', available: false }
      };

      manager.applyOptimisticUpdate(operation);
      expect(manager.getOptimisticItem('item_1').available).toBe(false);

      // Rollback should restore original availability
      manager.rollbackOperation(operation.id, new Error('Server error'));
      expect(manager.getOptimisticItem('item_1').available).toBe(true);
    });

    test('should automatically rollback toggle_popularity operation', () => {
      const operation = {
        id: 'op_1',
        type: 'toggle_popularity',
        itemId: 'item_1',
        originalState: { id: 'item_1', name: 'Item', is_popular: false },
        optimisticState: { id: 'item_1', name: 'Item', is_popular: true }
      };

      manager.applyOptimisticUpdate(operation);
      expect(manager.getOptimisticItem('item_1').is_popular).toBe(true);

      // Rollback should restore original popularity
      manager.rollbackOperation(operation.id, new Error('Server error'));
      expect(manager.getOptimisticItem('item_1').is_popular).toBe(false);
    });

    test('should handle rollback of non-existent operation gracefully', () => {
      const result = manager.rollbackOperation('non_existent_op', new Error('Test error'));
      expect(result).toBeNull();
      // Should not crash or throw
    });
  });

  describe('Error Message Generation - Task 2.3', () => {
    /**
     * Task 2.3: Verify error message generation for different scenarios
     * Requirements: 8.2
     */
    test('should generate error message for 401 Unauthorized', () => {
      const operation = {
        id: 'op_1',
        type: 'create',
        itemId: 'temp_1',
        optimisticState: { id: 'temp_1', name: 'New Item' }
      };

      const error = {
        response: { status: 401 }
      };

      manager.applyOptimisticUpdate(operation);
      manager.rollbackOperation(operation.id, error);

      const rollbacks = manager.getRecentRollbacks();
      expect(rollbacks[0].errorMessage).toContain('Authentication required');
      expect(rollbacks[0].errorMessage).toContain('log in again');
    });

    test('should generate error message for 403 Forbidden', () => {
      const operation = {
        id: 'op_1',
        type: 'delete',
        itemId: 'item_1',
        originalState: { id: 'item_1', name: 'Item' },
        optimisticState: { id: 'item_1', name: 'Item' }
      };

      const error = {
        response: { status: 403 }
      };

      manager.applyOptimisticUpdate(operation);
      manager.rollbackOperation(operation.id, error);

      const rollbacks = manager.getRecentRollbacks();
      expect(rollbacks[0].errorMessage).toContain("don't have permission");
    });

    test('should generate error message for 404 Not Found', () => {
      const operation = {
        id: 'op_1',
        type: 'update',
        itemId: 'item_1',
        originalState: { id: 'item_1', name: 'Old' },
        optimisticState: { id: 'item_1', name: 'New' }
      };

      const error = {
        response: { status: 404 }
      };

      manager.applyOptimisticUpdate(operation);
      manager.rollbackOperation(operation.id, error);

      const rollbacks = manager.getRecentRollbacks();
      expect(rollbacks[0].errorMessage).toContain('not found');
    });

    test('should generate error message for 409 Conflict', () => {
      const operation = {
        id: 'op_1',
        type: 'create',
        itemId: 'temp_1',
        optimisticState: { id: 'temp_1', name: 'New Item' }
      };

      const error = {
        response: { status: 409 }
      };

      manager.applyOptimisticUpdate(operation);
      manager.rollbackOperation(operation.id, error);

      const rollbacks = manager.getRecentRollbacks();
      expect(rollbacks[0].errorMessage).toContain('Conflict');
    });

    test('should generate error message for 500 Server Error', () => {
      const operation = {
        id: 'op_1',
        type: 'create',
        itemId: 'temp_1',
        optimisticState: { id: 'temp_1', name: 'New Item' }
      };

      const error = {
        response: { status: 500 }
      };

      manager.applyOptimisticUpdate(operation);
      manager.rollbackOperation(operation.id, error);

      const rollbacks = manager.getRecentRollbacks();
      expect(rollbacks[0].errorMessage).toContain('Server error');
      expect(rollbacks[0].errorMessage).toContain('try again later');
    });

    test('should generate error message for Network Error', () => {
      const operation = {
        id: 'op_1',
        type: 'create',
        itemId: 'temp_1',
        optimisticState: { id: 'temp_1', name: 'New Item' }
      };

      const error = {
        message: 'Network Error: Connection failed'
      };

      manager.applyOptimisticUpdate(operation);
      manager.rollbackOperation(operation.id, error);

      const rollbacks = manager.getRecentRollbacks();
      expect(rollbacks[0].errorMessage).toContain('Network connection lost');
      expect(rollbacks[0].errorMessage).toContain('check your internet connection');
    });

    test('should generate operation-specific error messages', () => {
      const operations = [
        { type: 'create', expectedText: 'create menu item' },
        { type: 'update', expectedText: 'update menu item' },
        { type: 'delete', expectedText: 'delete menu item' },
        { type: 'toggle_availability', expectedText: 'toggle item availability' },
        { type: 'toggle_popularity', expectedText: 'toggle item popularity' }
      ];

      operations.forEach((opConfig, index) => {
        const operation = {
          id: `op_${index}`,
          type: opConfig.type,
          itemId: `item_${index}`,
          originalState: { id: `item_${index}`, name: 'Item' },
          optimisticState: { id: `item_${index}`, name: 'Item' }
        };

        manager.applyOptimisticUpdate(operation);
        manager.rollbackOperation(operation.id, new Error('Test error'));
      });

      const rollbacks = manager.getRecentRollbacks(10);
      operations.forEach((opConfig, index) => {
        expect(rollbacks[index].errorMessage).toContain(opConfig.expectedText);
      });
    });

    test('should generate generic error message for unknown errors', () => {
      const operation = {
        id: 'op_1',
        type: 'create',
        itemId: 'temp_1',
        optimisticState: { id: 'temp_1', name: 'New Item' }
      };

      const error = {}; // No specific error info

      manager.applyOptimisticUpdate(operation);
      manager.rollbackOperation(operation.id, error);

      const rollbacks = manager.getRecentRollbacks();
      expect(rollbacks[0].errorMessage).toContain('Failed to create menu item');
      expect(rollbacks[0].errorMessage).toContain('try again');
    });

    test('should include custom error message when available', () => {
      const operation = {
        id: 'op_1',
        type: 'create',
        itemId: 'temp_1',
        optimisticState: { id: 'temp_1', name: 'New Item' }
      };

      const error = {
        message: 'Custom validation error: Name is too long'
      };

      manager.applyOptimisticUpdate(operation);
      manager.rollbackOperation(operation.id, error);

      const rollbacks = manager.getRecentRollbacks();
      expect(rollbacks[0].errorMessage).toContain('Custom validation error: Name is too long');
    });
  });
});
