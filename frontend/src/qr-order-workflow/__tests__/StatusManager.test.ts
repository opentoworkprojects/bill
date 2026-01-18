/**
 * Unit Tests for StatusManager Service
 * 
 * Tests the complete order status lifecycle management including
 * status transitions, validation, history tracking, and automatic
 * routing to Today's Bills.
 */

import {
  StatusManagerImpl,
  MockOrderStore,
  MockTodaysBillsRouter,
  VALID_TRANSITIONS,
  createStatusManager,
} from '../services/StatusManager';
import {
  Order,
  OrderStatus,
  OrderStatusType,
  StatusChange,
  OrderProcessingError,
} from '../../types';
import { generators } from './generators';
import * as fc from 'fast-check';

describe('StatusManager', () => {
  let statusManager: StatusManagerImpl;
  let mockOrderStore: MockOrderStore;
  let mockTodaysBillsRouter: MockTodaysBillsRouter;

  beforeEach(() => {
    mockOrderStore = new MockOrderStore();
    mockTodaysBillsRouter = new MockTodaysBillsRouter();
    statusManager = new StatusManagerImpl(mockOrderStore, mockTodaysBillsRouter);
  });

  describe('Status Lifecycle Management', () => {
    test('should allow valid status transitions', async () => {
      // Create a test order with pending status
      const order = fc.sample(generators.orderWithStatus('pending'), 1)[0];
      mockOrderStore.setOrder(order);

      // Test valid transition: pending -> preparing
      await statusManager.updateOrderStatus(order.id, 'preparing');

      const updatedStatus = await statusManager.getOrderStatus(order.id);
      expect(updatedStatus.current).toBe('preparing');
      expect(updatedStatus.history).toHaveLength(order.status.history.length + 1);

      const lastChange = updatedStatus.history[updatedStatus.history.length - 1];
      expect(lastChange.from).toBe('pending');
      expect(lastChange.to).toBe('preparing');
      expect(lastChange.triggeredBy).toBe('system');
    });

    test('should reject invalid status transitions', async () => {
      const order = fc.sample(generators.orderWithStatus('pending'), 1)[0];
      mockOrderStore.setOrder(order);

      // Test invalid transition: pending -> completed (skipping intermediate steps)
      await expect(
        statusManager.updateOrderStatus(order.id, 'completed')
      ).rejects.toThrow(OrderProcessingError);
    });

    test('should allow idempotent status updates', async () => {
      const order = fc.sample(generators.orderWithStatus('preparing'), 1)[0];
      mockOrderStore.setOrder(order);

      const originalHistoryLength = order.status.history.length;

      // Update to same status should succeed without adding history
      await statusManager.updateOrderStatus(order.id, 'preparing');

      const updatedStatus = await statusManager.getOrderStatus(order.id);
      expect(updatedStatus.current).toBe('preparing');
      expect(updatedStatus.history).toHaveLength(originalHistoryLength);
    });

    test('should handle complete status lifecycle', async () => {
      const order = fc.sample(generators.orderWithStatus('pending'), 1)[0];
      mockOrderStore.setOrder(order);

      // Test complete lifecycle: pending -> preparing -> ready -> completed
      await statusManager.updateOrderStatus(order.id, 'preparing');
      await statusManager.updateOrderStatus(order.id, 'ready');
      await statusManager.updateOrderStatus(order.id, 'completed');

      const finalStatus = await statusManager.getOrderStatus(order.id);
      expect(finalStatus.current).toBe('completed');
      expect(finalStatus.history).toHaveLength(order.status.history.length + 3);

      // Verify Today's Bills routing was triggered
      expect(mockTodaysBillsRouter.getMovedOrders()).toContain(order.id);
    });
  });

  describe('Today\'s Bills Routing', () => {
    test('should automatically route completed orders to Today\'s Bills', async () => {
      const order = fc.sample(generators.orderWithStatus('ready'), 1)[0];
      mockOrderStore.setOrder(order);

      await statusManager.updateOrderStatus(order.id, 'completed');

      expect(mockTodaysBillsRouter.getMovedOrders()).toContain(order.id);
    });

    test('should not route non-completed orders to Today\'s Bills', async () => {
      const order = fc.sample(generators.orderWithStatus('pending'), 1)[0];
      mockOrderStore.setOrder(order);

      await statusManager.updateOrderStatus(order.id, 'preparing');

      expect(mockTodaysBillsRouter.getMovedOrders()).not.toContain(order.id);
    });

    test('should continue status update even if Today\'s Bills routing fails', async () => {
      const order = fc.sample(generators.orderWithStatus('ready'), 1)[0];
      mockOrderStore.setOrder(order);

      // Mock routing failure
      jest.spyOn(mockTodaysBillsRouter, 'moveOrderToTodaysBills')
        .mockRejectedValueOnce(new Error('Routing service unavailable'));

      // Status update should still succeed
      await expect(
        statusManager.updateOrderStatus(order.id, 'completed')
      ).resolves.not.toThrow();

      const updatedStatus = await statusManager.getOrderStatus(order.id);
      expect(updatedStatus.current).toBe('completed');
    });
  });

  describe('Status Change Notifications', () => {
    test('should notify listeners of status changes', async () => {
      const order = fc.sample(generators.orderWithStatus('pending'), 1)[0];
      mockOrderStore.setOrder(order);

      const mockCallback = jest.fn();
      statusManager.subscribeToStatusChanges(mockCallback);

      await statusManager.updateOrderStatus(order.id, 'preparing');

      expect(mockCallback).toHaveBeenCalledWith(order.id, 'pending', 'preparing');
    });

    test('should not notify listeners for idempotent updates', async () => {
      const order = fc.sample(generators.orderWithStatus('preparing'), 1)[0];
      mockOrderStore.setOrder(order);

      const mockCallback = jest.fn();
      statusManager.subscribeToStatusChanges(mockCallback);

      await statusManager.updateOrderStatus(order.id, 'preparing');

      expect(mockCallback).not.toHaveBeenCalled();
    });

    test('should handle listener errors gracefully', async () => {
      const order = fc.sample(generators.orderWithStatus('pending'), 1)[0];
      mockOrderStore.setOrder(order);

      const errorCallback = jest.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });
      const successCallback = jest.fn();

      statusManager.subscribeToStatusChanges(errorCallback);
      statusManager.subscribeToStatusChanges(successCallback);

      // Should not throw despite listener error
      await expect(
        statusManager.updateOrderStatus(order.id, 'preparing')
      ).resolves.not.toThrow();

      expect(errorCallback).toHaveBeenCalled();
      expect(successCallback).toHaveBeenCalled();
    });

    test('should allow unsubscribing from notifications', async () => {
      const order = fc.sample(generators.orderWithStatus('pending'), 1)[0];
      mockOrderStore.setOrder(order);

      const mockCallback = jest.fn();
      statusManager.subscribeToStatusChanges(mockCallback);
      statusManager.unsubscribeFromStatusChanges(mockCallback);

      await statusManager.updateOrderStatus(order.id, 'preparing');

      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('Enhanced Status Updates with Context', () => {
    test('should record staff ID and trigger type in status changes', async () => {
      const order = fc.sample(generators.orderWithStatus('pending'), 1)[0];
      mockOrderStore.setOrder(order);

      const staffId = 'STAFF-123';
      await statusManager.updateOrderStatusWithContext(
        order.id,
        'preparing',
        'staff',
        staffId
      );

      const updatedStatus = await statusManager.getOrderStatus(order.id);
      const lastChange = updatedStatus.history[updatedStatus.history.length - 1];

      expect(lastChange.triggeredBy).toBe('staff');
      expect(lastChange.staffId).toBe(staffId);
    });

    test('should handle customer-triggered status changes', async () => {
      const order = fc.sample(generators.orderWithStatus('ready'), 1)[0];
      mockOrderStore.setOrder(order);

      await statusManager.updateOrderStatusWithContext(
        order.id,
        'completed',
        'customer'
      );

      const updatedStatus = await statusManager.getOrderStatus(order.id);
      const lastChange = updatedStatus.history[updatedStatus.history.length - 1];

      expect(lastChange.triggeredBy).toBe('customer');
      expect(lastChange.staffId).toBeUndefined();
    });
  });

  describe('Utility Methods', () => {
    test('should return valid next statuses for an order', async () => {
      const order = fc.sample(generators.orderWithStatus('preparing'), 1)[0];
      mockOrderStore.setOrder(order);

      const validNextStatuses = await statusManager.getValidNextStatuses(order.id);

      expect(validNextStatuses).toEqual(VALID_TRANSITIONS.preparing);
      expect(validNextStatuses).toContain('ready');
      expect(validNextStatuses).toContain('completed');
    });

    test('should validate transitions without performing them', () => {
      expect(statusManager.isValidTransition('pending', 'preparing')).toBe(true);
      expect(statusManager.isValidTransition('pending', 'completed')).toBe(false);
      expect(statusManager.isValidTransition('ready', 'ready')).toBe(true); // Idempotent
    });

    test('should return complete status history', async () => {
      const order = fc.sample(generators.order(), 1)[0];
      // Add some history
      order.status.history = [
        {
          from: 'pending',
          to: 'preparing',
          timestamp: new Date(),
          triggeredBy: 'staff',
          staffId: 'STAFF-1',
        },
      ];
      mockOrderStore.setOrder(order);

      const history = await statusManager.getStatusHistory(order.id);

      expect(history).toEqual(order.status.history);
    });
  });

  describe('Error Handling', () => {
    test('should throw error for non-existent order', async () => {
      await expect(
        statusManager.updateOrderStatus('NON-EXISTENT', 'preparing')
      ).rejects.toThrow(OrderProcessingError);
    });

    test('should throw error when getting status of non-existent order', async () => {
      await expect(
        statusManager.getOrderStatus('NON-EXISTENT')
      ).rejects.toThrow(OrderProcessingError);
    });

    test('should provide detailed error information', async () => {
      const order = fc.sample(generators.orderWithStatus('completed'), 1)[0];
      mockOrderStore.setOrder(order);

      try {
        await statusManager.updateOrderStatus(order.id, 'pending');
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(OrderProcessingError);
        expect((error as OrderProcessingError).orderId).toBe(order.id);
        expect((error as OrderProcessingError).errorCode).toBe('INVALID_STATUS_TRANSITION');
      }
    });
  });

  describe('Factory Function', () => {
    test('should create StatusManager instance via factory', () => {
      const manager = createStatusManager(mockOrderStore, mockTodaysBillsRouter);
      expect(manager).toBeInstanceOf(StatusManagerImpl);
    });
  });

  describe('Valid Transitions Configuration', () => {
    test('should have correct transition rules', () => {
      expect(VALID_TRANSITIONS.pending).toContain('active');
      expect(VALID_TRANSITIONS.pending).toContain('preparing');
      expect(VALID_TRANSITIONS.active).toContain('preparing');
      expect(VALID_TRANSITIONS.active).toContain('ready');
      expect(VALID_TRANSITIONS.preparing).toContain('ready');
      expect(VALID_TRANSITIONS.preparing).toContain('completed');
      expect(VALID_TRANSITIONS.ready).toContain('completed');
      expect(VALID_TRANSITIONS.completed).toHaveLength(0); // Terminal state
    });

    test('should not allow backwards transitions', () => {
      expect(VALID_TRANSITIONS.preparing).not.toContain('pending');
      expect(VALID_TRANSITIONS.ready).not.toContain('preparing');
      expect(VALID_TRANSITIONS.completed).not.toContain('ready');
    });
  });
});