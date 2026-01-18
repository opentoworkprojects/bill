/**
 * StatusManager Service for QR Order Workflow Fix
 * 
 * This service manages the complete order status lifecycle, ensuring proper
 * status transitions, validation, history tracking, and automatic routing
 * to Today's Bills when orders are completed.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */

import {
  StatusManager,
  OrderStatus,
  OrderStatusType,
  StatusChange,
  StatusChangeCallback,
  Order,
  OrderProcessingError,
} from '../../types';

/**
 * Valid status transitions in the order lifecycle
 */
const VALID_TRANSITIONS: Record<OrderStatusType, OrderStatusType[]> = {
  pending: ['active', 'preparing'],
  active: ['preparing', 'ready'],
  preparing: ['ready', 'completed'],
  ready: ['completed'],
  completed: [], // Terminal state
};

/**
 * Interface for Today's Bills routing service
 */
interface TodaysBillsRouter {
  moveOrderToTodaysBills(orderId: string): Promise<void>;
}

/**
 * Interface for order storage/retrieval
 */
interface OrderStore {
  getOrder(orderId: string): Promise<Order | null>;
  updateOrderStatus(orderId: string, status: OrderStatus): Promise<void>;
}

/**
 * StatusManager implementation with complete lifecycle management
 */
export class StatusManagerImpl implements StatusManager {
  private statusChangeListeners: StatusChangeCallback[] = [];
  private orderStore: OrderStore;
  private todaysBillsRouter: TodaysBillsRouter;

  constructor(orderStore: OrderStore, todaysBillsRouter: TodaysBillsRouter) {
    this.orderStore = orderStore;
    this.todaysBillsRouter = todaysBillsRouter;
  }

  /**
   * Update the status of an order with validation and history tracking
   * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
   */
  async updateOrderStatus(orderId: string, newStatus: OrderStatusType): Promise<void> {
    try {
      // Retrieve current order
      const order = await this.orderStore.getOrder(orderId);
      if (!order) {
        throw new OrderProcessingError(`Order not found: ${orderId}`, orderId, 'ORDER_NOT_FOUND');
      }

      const currentStatus = order.status.current;

      // Validate status transition
      this.validateStatusTransition(currentStatus, newStatus, orderId);

      // Create status change record
      const statusChange: StatusChange = {
        from: currentStatus,
        to: newStatus,
        timestamp: new Date(),
        triggeredBy: 'system', // Default to system, can be overridden by caller
        // staffId would be set by caller if triggered by staff
      };

      // Update order status with history
      const updatedStatus: OrderStatus = {
        current: newStatus,
        history: [...order.status.history, statusChange],
      };

      // Save updated status
      await this.orderStore.updateOrderStatus(orderId, updatedStatus);

      // Handle automatic routing for completed orders (Requirement 4.5)
      if (newStatus === 'completed') {
        await this.handleOrderCompletion(orderId);
      }

      // Notify listeners of status change
      this.notifyStatusChangeListeners(orderId, currentStatus, newStatus);

    } catch (error) {
      if (error instanceof OrderProcessingError) {
        throw error;
      }
      throw new OrderProcessingError(
        `Failed to update order status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        orderId,
        'STATUS_UPDATE_FAILED'
      );
    }
  }

  /**
   * Get the current status of an order
   * Requirements: 4.6
   */
  async getOrderStatus(orderId: string): Promise<OrderStatus> {
    try {
      const order = await this.orderStore.getOrder(orderId);
      if (!order) {
        throw new OrderProcessingError(`Order not found: ${orderId}`, orderId, 'ORDER_NOT_FOUND');
      }

      return order.status;
    } catch (error) {
      if (error instanceof OrderProcessingError) {
        throw error;
      }
      throw new OrderProcessingError(
        `Failed to get order status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        orderId,
        'STATUS_RETRIEVAL_FAILED'
      );
    }
  }

  /**
   * Subscribe to status change notifications
   * Requirements: 4.6
   */
  subscribeToStatusChanges(callback: StatusChangeCallback): void {
    this.statusChangeListeners.push(callback);
  }

  /**
   * Unsubscribe from status change notifications
   */
  unsubscribeFromStatusChanges(callback: StatusChangeCallback): void {
    const index = this.statusChangeListeners.indexOf(callback);
    if (index > -1) {
      this.statusChangeListeners.splice(index, 1);
    }
  }

  /**
   * Validate that a status transition is allowed
   * Requirements: 4.1, 4.2, 4.3, 4.4
   */
  private validateStatusTransition(
    currentStatus: OrderStatusType,
    newStatus: OrderStatusType,
    orderId: string
  ): void {
    // Allow staying in the same status (idempotent updates)
    if (currentStatus === newStatus) {
      return;
    }

    // Check if transition is valid according to lifecycle rules
    const allowedTransitions = VALID_TRANSITIONS[currentStatus];
    if (!allowedTransitions.includes(newStatus)) {
      throw new OrderProcessingError(
        `Invalid status transition from '${currentStatus}' to '${newStatus}'. ` +
        `Allowed transitions: ${allowedTransitions.join(', ')}`,
        orderId,
        'INVALID_STATUS_TRANSITION'
      );
    }
  }

  /**
   * Handle order completion by routing to Today's Bills
   * Requirements: 4.5
   */
  private async handleOrderCompletion(orderId: string): Promise<void> {
    try {
      await this.todaysBillsRouter.moveOrderToTodaysBills(orderId);
    } catch (error) {
      // Log error but don't fail the status update
      console.error(`Failed to move completed order ${orderId} to Today's Bills:`, error);
      
      // Could implement retry logic here or queue for later processing
      // For now, we'll let the status update succeed but log the routing failure
    }
  }

  /**
   * Notify all listeners of status changes
   * Requirements: 4.6
   */
  private notifyStatusChangeListeners(
    orderId: string,
    oldStatus: OrderStatusType,
    newStatus: OrderStatusType
  ): void {
    this.statusChangeListeners.forEach(callback => {
      try {
        callback(orderId, oldStatus, newStatus);
      } catch (error) {
        // Log listener errors but don't fail the status update
        console.error(`Status change listener error for order ${orderId}:`, error);
      }
    });
  }

  /**
   * Get the next valid statuses for an order
   * Utility method for UI components
   */
  async getValidNextStatuses(orderId: string): Promise<OrderStatusType[]> {
    const orderStatus = await this.getOrderStatus(orderId);
    return VALID_TRANSITIONS[orderStatus.current] || [];
  }

  /**
   * Check if a status transition is valid without performing it
   * Utility method for validation
   */
  isValidTransition(currentStatus: OrderStatusType, newStatus: OrderStatusType): boolean {
    if (currentStatus === newStatus) {
      return true; // Idempotent updates are always valid
    }
    
    const allowedTransitions = VALID_TRANSITIONS[currentStatus];
    return allowedTransitions.includes(newStatus);
  }

  /**
   * Get the complete status history for an order
   * Utility method for audit trails
   */
  async getStatusHistory(orderId: string): Promise<StatusChange[]> {
    const orderStatus = await this.getOrderStatus(orderId);
    return orderStatus.history;
  }

  /**
   * Update order status with additional context (staff ID, trigger type)
   * Enhanced version of updateOrderStatus with more context
   */
  async updateOrderStatusWithContext(
    orderId: string,
    newStatus: OrderStatusType,
    triggeredBy: 'system' | 'staff' | 'customer',
    staffId?: string
  ): Promise<void> {
    try {
      // Retrieve current order
      const order = await this.orderStore.getOrder(orderId);
      if (!order) {
        throw new OrderProcessingError(`Order not found: ${orderId}`, orderId, 'ORDER_NOT_FOUND');
      }

      const currentStatus = order.status.current;

      // Validate status transition
      this.validateStatusTransition(currentStatus, newStatus, orderId);

      // Create status change record with context
      const statusChange: StatusChange = {
        from: currentStatus,
        to: newStatus,
        timestamp: new Date(),
        triggeredBy,
        staffId,
      };

      // Update order status with history
      const updatedStatus: OrderStatus = {
        current: newStatus,
        history: [...order.status.history, statusChange],
      };

      // Save updated status
      await this.orderStore.updateOrderStatus(orderId, updatedStatus);

      // Handle automatic routing for completed orders
      if (newStatus === 'completed') {
        await this.handleOrderCompletion(orderId);
      }

      // Notify listeners of status change
      this.notifyStatusChangeListeners(orderId, currentStatus, newStatus);

    } catch (error) {
      if (error instanceof OrderProcessingError) {
        throw error;
      }
      throw new OrderProcessingError(
        `Failed to update order status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        orderId,
        'STATUS_UPDATE_FAILED'
      );
    }
  }
}

/**
 * Factory function to create a StatusManager instance
 */
export function createStatusManager(
  orderStore: OrderStore,
  todaysBillsRouter: TodaysBillsRouter
): StatusManager {
  return new StatusManagerImpl(orderStore, todaysBillsRouter);
}

/**
 * Mock implementations for testing and development
 */
export class MockOrderStore implements OrderStore {
  private orders: Map<string, Order> = new Map();

  async getOrder(orderId: string): Promise<Order | null> {
    return this.orders.get(orderId) || null;
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    const order = this.orders.get(orderId);
    if (order) {
      this.orders.set(orderId, { ...order, status });
    }
  }

  // Helper method for testing
  setOrder(order: Order): void {
    this.orders.set(order.id, order);
  }
}

export class MockTodaysBillsRouter implements TodaysBillsRouter {
  private movedOrders: string[] = [];

  async moveOrderToTodaysBills(orderId: string): Promise<void> {
    this.movedOrders.push(orderId);
  }

  // Helper method for testing
  getMovedOrders(): string[] {
    return [...this.movedOrders];
  }

  clearMovedOrders(): void {
    this.movedOrders = [];
  }
}

// Export the valid transitions for testing
export { VALID_TRANSITIONS };