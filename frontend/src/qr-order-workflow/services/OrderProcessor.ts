/**
 * OrderProcessor Service Implementation
 * 
 * This service handles the core order processing logic, including validation
 * and routing for QR orders to ensure they follow the same workflow as
 * staff-entered orders.
 */

import {
  Order,
  OrderProcessor as IOrderProcessor,
  OrderSource,
  ProcessedOrder,
  ValidationResult,
  ValidationStatus,
  RoutingDestination,
  OrderValidationError,
  OrderRoutingError,
} from '../../types';

/**
 * Implementation of the OrderProcessor interface
 */
export class OrderProcessor implements IOrderProcessor {
  /**
   * Process an order from a specific source
   */
  async processOrder(order: Order, source: OrderSource): Promise<ProcessedOrder> {
    try {
      // Validate the order first
      const validationResult = this.validateOrder(order);
      
      // Determine validation status
      const validationStatus: ValidationStatus = validationResult.isValid 
        ? (validationResult.warnings.length > 0 ? 'warning' : 'valid')
        : 'invalid';

      // Determine routing destination based on validation
      const routingDestination: RoutingDestination = this.determineRoutingDestination(
        validationResult,
        source
      );

      // Create processed order
      const processedOrder: ProcessedOrder = {
        ...order,
        source, // Ensure source is set correctly
        validationStatus,
        routingDestination,
        processingTimestamp: new Date(),
      };

      // Route the order if validation passed
      if (validationStatus !== 'invalid') {
        await this.routeOrder(processedOrder);
      }

      return processedOrder;
    } catch (error) {
      throw new OrderRoutingError(
        `Failed to process order: ${error instanceof Error ? error.message : 'Unknown error'}`,
        order.id
      );
    }
  }

  /**
   * Validate an order's data integrity
   */
  validateOrder(order: Order): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validation
    if (!order.id || order.id.trim() === '') {
      errors.push('Order ID is required');
    }

    if (!order.tableNumber || order.tableNumber.trim() === '') {
      errors.push('Table number is required');
    }

    if (!order.items || order.items.length === 0) {
      errors.push('Order must contain at least one item');
    }

    // Items validation
    if (order.items) {
      order.items.forEach((item, index) => {
        if (!item.id || item.id.trim() === '') {
          errors.push(`Item ${index + 1}: ID is required`);
        }

        if (!item.name || item.name.trim() === '') {
          errors.push(`Item ${index + 1}: Name is required`);
        }

        if (item.quantity <= 0) {
          errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
        }

        if (item.unitPrice < 0) {
          errors.push(`Item ${index + 1}: Unit price cannot be negative`);
        }

        // Check if total price matches calculation
        const expectedTotal = Math.round(item.quantity * item.unitPrice * 100) / 100;
        if (Math.abs(item.totalPrice - expectedTotal) > 0.01) {
          warnings.push(`Item ${index + 1}: Total price may be incorrect`);
        }
      });
    }

    // Status validation
    if (!order.status || !order.status.current) {
      errors.push('Order status is required');
    }

    // Timestamp validation
    if (!order.timestamps || !order.timestamps.placed) {
      errors.push('Order placement timestamp is required');
    }

    if (!order.timestamps || !order.timestamps.received) {
      errors.push('Order received timestamp is required');
    }

    // Check timestamp order
    if (order.timestamps?.placed && order.timestamps?.received) {
      if (order.timestamps.placed > order.timestamps.received) {
        errors.push('Order placement time cannot be after received time');
      }
    }

    // Source validation
    if (!order.source || !['QR', 'STAFF', 'PHONE'].includes(order.source)) {
      errors.push('Valid order source is required (QR, STAFF, or PHONE)');
    }

    // Priority validation
    if (!order.metadata?.priority || !['normal', 'high', 'rush'].includes(order.metadata.priority)) {
      warnings.push('Order priority should be set to normal, high, or rush');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metadata: {
        validatedAt: new Date(),
        itemCount: order.items?.length || 0,
        totalValue: order.items?.reduce((sum, item) => sum + item.totalPrice, 0) || 0,
      },
    };
  }

  /**
   * Route a processed order to its destination
   */
  async routeOrder(order: ProcessedOrder): Promise<void> {
    try {
      switch (order.routingDestination) {
        case 'active_orders':
          await this.routeToActiveOrders(order);
          break;
        case 'hold':
          await this.routeToHold(order);
          break;
        case 'reject':
          await this.routeToReject(order);
          break;
        default:
          throw new OrderRoutingError(
            `Unknown routing destination: ${order.routingDestination}`,
            order.id
          );
      }
    } catch (error) {
      throw new OrderRoutingError(
        `Failed to route order to ${order.routingDestination}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        order.id
      );
    }
  }

  /**
   * Determine where to route the order based on validation results
   */
  private determineRoutingDestination(
    validationResult: ValidationResult,
    source: OrderSource
  ): RoutingDestination {
    // Invalid orders go to reject
    if (!validationResult.isValid) {
      return 'reject';
    }

    // Orders with warnings go to hold for manual review
    if (validationResult.warnings.length > 0) {
      return 'hold';
    }

    // All valid orders (including QR orders) go to active_orders
    // This is the key fix - QR orders should NOT go directly to Today's Bills
    return 'active_orders';
  }

  /**
   * Route order to Active Orders system
   */
  private async routeToActiveOrders(order: ProcessedOrder): Promise<void> {
    // In a real implementation, this would make API calls to the Active Orders system
    // For now, we'll simulate the routing with logging
    console.log(`Routing order ${order.id} from ${order.source} to Active Orders`);
    
    // Ensure the order has the correct initial status
    if (order.status.current === 'completed') {
      // This is the bug fix - QR orders should not start as completed
      order.status.current = 'pending';
      order.status.history.push({
        from: 'completed',
        to: 'pending',
        timestamp: new Date(),
        triggeredBy: 'system',
      });
    }

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Route order to hold for manual review
   */
  private async routeToHold(order: ProcessedOrder): Promise<void> {
    console.log(`Routing order ${order.id} to hold for manual review`);
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  /**
   * Route order to reject (invalid orders)
   */
  private async routeToReject(order: ProcessedOrder): Promise<void> {
    console.log(`Rejecting order ${order.id} due to validation errors`);
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}

/**
 * Factory function to create a new OrderProcessor instance
 */
export function createOrderProcessor(): IOrderProcessor {
  return new OrderProcessor();
}

/**
 * Singleton instance for global use
 */
export const orderProcessor = createOrderProcessor();