/**
 * Property-based test generators for QR Order Workflow Fix
 * 
 * This module provides fast-check generators for creating test data
 * that covers the full input space for order processing scenarios.
 */

import * as fc from 'fast-check';
import {
  Order,
  OrderItem,
  OrderStatus,
  OrderTimestamps,
  OrderMetadata,
  CustomerInfo,
  StatusChange,
  OrderSource,
  OrderStatusType,
  OrderPriority,
  StatusChangeTrigger,
  ProcessedOrder,
  ValidationResult,
  ValidationStatus,
  RoutingDestination,
} from '../../types';

// ============================================================================
// Basic Type Generators
// ============================================================================

/**
 * Generator for order sources
 */
export const orderSourceArb = (): fc.Arbitrary<OrderSource> =>
  fc.constantFrom('QR', 'STAFF', 'PHONE');

/**
 * Generator for order status types
 */
export const orderStatusTypeArb = (): fc.Arbitrary<OrderStatusType> =>
  fc.constantFrom('pending', 'active', 'preparing', 'ready', 'completed');

/**
 * Generator for order priorities
 */
export const orderPriorityArb = (): fc.Arbitrary<OrderPriority> =>
  fc.constantFrom('normal', 'high', 'rush');

/**
 * Generator for status change triggers
 */
export const statusChangeTriggerArb = (): fc.Arbitrary<StatusChangeTrigger> =>
  fc.constantFrom('system', 'staff', 'customer');

/**
 * Generator for validation status
 */
export const validationStatusArb = (): fc.Arbitrary<ValidationStatus> =>
  fc.constantFrom('valid', 'invalid', 'warning');

/**
 * Generator for routing destinations
 */
export const routingDestinationArb = (): fc.Arbitrary<RoutingDestination> =>
  fc.constantFrom('active_orders', 'hold', 'reject');

// ============================================================================
// Date and Time Generators
// ============================================================================

/**
 * Generator for recent timestamps (within last 7 days)
 */
export const recentTimestampArb = (): fc.Arbitrary<Date> => {
  const now = Date.now();
  const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
  return fc.integer({ min: sevenDaysAgo, max: now }).map(timestamp => new Date(timestamp));
};

/**
 * Generator for ordered timestamps (ensuring chronological order)
 */
export const orderedTimestampsArb = (): fc.Arbitrary<OrderTimestamps> =>
  fc.tuple(
    recentTimestampArb(),
    fc.integer({ min: 0, max: 300000 }), // up to 5 minutes later
    fc.integer({ min: 0, max: 1800000 }), // up to 30 minutes later
    fc.integer({ min: 0, max: 600000 }), // up to 10 minutes later
    fc.integer({ min: 0, max: 300000 }) // up to 5 minutes later
  ).map(([placed, receivedOffset, startedOffset, readyOffset, completedOffset]) => {
    const received = new Date(placed.getTime() + receivedOffset);
    const started = Math.random() > 0.3 ? new Date(received.getTime() + startedOffset) : undefined;
    const ready = started && Math.random() > 0.5 ? new Date(started.getTime() + readyOffset) : undefined;
    const completed = ready && Math.random() > 0.7 ? new Date(ready.getTime() + completedOffset) : undefined;

    return {
      placed,
      received,
      started,
      ready,
      completed,
    };
  });

// ============================================================================
// String Generators
// ============================================================================

/**
 * Generator for order IDs
 */
export const orderIdArb = (): fc.Arbitrary<string> =>
  fc.tuple(
    fc.constantFrom('ORD', 'QR', 'STAFF'),
    fc.integer({ min: 1000000000000, max: 9999999999999 }),
    fc.array(fc.integer({ min: 0, max: 15 }), { minLength: 6, maxLength: 10 })
  ).map(([prefix, timestamp, hexArray]) => 
    `${prefix}-${timestamp}-${hexArray.map(n => n.toString(16)).join('')}`
  );

/**
 * Generator for table numbers
 */
export const tableNumberArb = (): fc.Arbitrary<string> =>
  fc.oneof(
    fc.integer({ min: 1, max: 100 }).map(n => `T${n}`),
    fc.integer({ min: 1, max: 50 }).map(n => `TABLE-${n}`),
    fc.constantFrom('BAR-1', 'BAR-2', 'COUNTER', 'TAKEAWAY')
  );

/**
 * Generator for item names
 */
export const itemNameArb = (): fc.Arbitrary<string> =>
  fc.constantFrom(
    'Margherita Pizza',
    'Chicken Biryani',
    'Butter Chicken',
    'Caesar Salad',
    'Fish and Chips',
    'Pasta Carbonara',
    'Grilled Salmon',
    'Vegetable Curry',
    'Beef Burger',
    'Tom Yum Soup',
    'Chocolate Cake',
    'Mango Lassi'
  );

// ============================================================================
// Complex Object Generators
// ============================================================================

/**
 * Generator for customer information
 */
export const customerInfoArb = (): fc.Arbitrary<CustomerInfo> =>
  fc.record({
    name: fc.option(fc.string({ minLength: 2, maxLength: 50 }), { nil: undefined }),
    phone: fc.option(fc.string({ minLength: 10, maxLength: 15 }).filter(s => /^\+?[\d\s-()]+$/.test(s)), { nil: undefined }),
    email: fc.option(fc.emailAddress(), { nil: undefined }),
    notes: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
  });

/**
 * Generator for order items
 */
export const orderItemArb = (): fc.Arbitrary<OrderItem> =>
  fc.record({
    id: fc.uuid(),
    name: itemNameArb(),
    quantity: fc.integer({ min: 1, max: 10 }),
    unitPrice: fc.float({ min: 1, max: 100, noNaN: true }).map(price => Math.round(price * 100) / 100),
    totalPrice: fc.constant(0), // Will be calculated
    specialInstructions: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
    category: fc.option(fc.constantFrom('Appetizer', 'Main Course', 'Dessert', 'Beverage', 'Side'), { nil: undefined }),
  }).map(item => ({
    ...item,
    totalPrice: Math.round(item.quantity * item.unitPrice * 100) / 100,
  }));

/**
 * Generator for status changes
 */
export const statusChangeArb = (): fc.Arbitrary<StatusChange> =>
  fc.record({
    from: orderStatusTypeArb(),
    to: orderStatusTypeArb(),
    timestamp: recentTimestampArb(),
    triggeredBy: statusChangeTriggerArb(),
    staffId: fc.option(fc.uuid(), { nil: undefined }),
  }).filter(change => change.from !== change.to); // Ensure status actually changes

/**
 * Generator for order status with history
 */
export const orderStatusArb = (): fc.Arbitrary<OrderStatus> =>
  fc.tuple(
    orderStatusTypeArb(),
    fc.array(statusChangeArb(), { minLength: 0, maxLength: 5 })
  ).map(([current, history]) => ({
    current,
    history: history.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
  }));

/**
 * Generator for order metadata
 */
export const orderMetadataArb = (): fc.Arbitrary<OrderMetadata> =>
  fc.record({
    customerInfo: fc.option(customerInfoArb(), { nil: undefined }),
    specialInstructions: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
    estimatedPrepTime: fc.option(fc.integer({ min: 5, max: 120 }), { nil: undefined }),
    priority: orderPriorityArb(),
  });

/**
 * Generator for complete orders
 */
export const orderArb = (): fc.Arbitrary<Order> =>
  fc.record({
    id: orderIdArb(),
    tableNumber: tableNumberArb(),
    items: fc.array(orderItemArb(), { minLength: 1, maxLength: 10 }),
    source: orderSourceArb(),
    status: orderStatusArb(),
    timestamps: orderedTimestampsArb(),
    metadata: orderMetadataArb(),
  });

/**
 * Generator for validation results
 */
export const validationResultArb = (): fc.Arbitrary<ValidationResult> =>
  fc.record({
    isValid: fc.boolean(),
    errors: fc.array(fc.string({ minLength: 5, maxLength: 100 }), { maxLength: 5 }),
    warnings: fc.array(fc.string({ minLength: 5, maxLength: 100 }), { maxLength: 3 }),
    metadata: fc.option(fc.dictionary(fc.string(), fc.anything()), { nil: undefined }),
  });

/**
 * Generator for processed orders
 */
export const processedOrderArb = (): fc.Arbitrary<ProcessedOrder> =>
  fc.tuple(
    orderArb(),
    validationStatusArb(),
    routingDestinationArb(),
    recentTimestampArb()
  ).map(([order, validationStatus, routingDestination, processingTimestamp]) => ({
    ...order,
    validationStatus,
    routingDestination,
    processingTimestamp,
  }));

// ============================================================================
// Specialized Generators for Edge Cases
// ============================================================================

/**
 * Generator for QR orders specifically
 */
export const qrOrderArb = (): fc.Arbitrary<Order> =>
  orderArb().map(order => ({
    ...order,
    source: 'QR' as OrderSource,
  }));

/**
 * Generator for orders with specific status
 */
export const orderWithStatusArb = (status: OrderStatusType): fc.Arbitrary<Order> =>
  orderArb().map(order => ({
    ...order,
    status: {
      ...order.status,
      current: status,
    },
  }));

/**
 * Generator for orders from the same table (for duplicate testing)
 */
export const sameTableOrdersArb = (): fc.Arbitrary<Order[]> =>
  fc.tuple(
    tableNumberArb(),
    fc.array(orderArb(), { minLength: 2, maxLength: 5 })
  ).map(([tableNumber, orders]) =>
    orders.map(order => ({
      ...order,
      tableNumber,
    }))
  );

/**
 * Generator for orders within time window (for duplicate prevention testing)
 */
export const ordersWithinTimeWindowArb = (windowMinutes: number = 5): fc.Arbitrary<Order[]> =>
  fc.tuple(
    recentTimestampArb(),
    fc.array(orderArb(), { minLength: 2, maxLength: 3 })
  ).map(([baseTime, orders]) => {
    const windowMs = windowMinutes * 60 * 1000;
    return orders.map((order, index) => ({
      ...order,
      timestamps: {
        ...order.timestamps,
        placed: new Date(baseTime.getTime() + (index * windowMs / orders.length)),
      },
    }));
  });

// ============================================================================
// Export All Generators
// ============================================================================

export const generators = {
  // Basic types
  orderSource: orderSourceArb,
  orderStatusType: orderStatusTypeArb,
  orderPriority: orderPriorityArb,
  statusChangeTrigger: statusChangeTriggerArb,
  validationStatus: validationStatusArb,
  routingDestination: routingDestinationArb,

  // Dates and strings
  recentTimestamp: recentTimestampArb,
  orderedTimestamps: orderedTimestampsArb,
  orderId: orderIdArb,
  tableNumber: tableNumberArb,
  itemName: itemNameArb,

  // Complex objects
  customerInfo: customerInfoArb,
  orderItem: orderItemArb,
  statusChange: statusChangeArb,
  orderStatus: orderStatusArb,
  orderMetadata: orderMetadataArb,
  order: orderArb,
  validationResult: validationResultArb,
  processedOrder: processedOrderArb,

  // Specialized generators
  qrOrder: qrOrderArb,
  orderWithStatus: orderWithStatusArb,
  sameTableOrders: sameTableOrdersArb,
  ordersWithinTimeWindow: ordersWithinTimeWindowArb,
};