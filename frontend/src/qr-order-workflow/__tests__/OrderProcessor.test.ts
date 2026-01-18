/**
 * OrderProcessor Service Tests
 * 
 * Tests for the OrderProcessor service implementation to verify
 * order validation and routing logic works correctly.
 */

import { OrderProcessor } from '../services/OrderProcessor';
import { Order, OrderSource, OrderStatusType } from '../../types';

describe('OrderProcessor', () => {
  let orderProcessor: OrderProcessor;

  beforeEach(() => {
    orderProcessor = new OrderProcessor();
  });

  describe('Order Validation', () => {
    test('should validate a complete valid order', () => {
      const validOrder: Order = {
        id: 'ORD-123456789',
        tableNumber: 'T5',
        items: [
          {
            id: 'item-1',
            name: 'Margherita Pizza',
            quantity: 2,
            unitPrice: 15.99,
            totalPrice: 31.98,
          }
        ],
        source: 'QR',
        status: {
          current: 'pending',
          history: []
        },
        timestamps: {
          placed: new Date('2024-01-01T10:00:00Z'),
          received: new Date('2024-01-01T10:00:30Z'),
        },
        metadata: {
          priority: 'normal'
        }
      };

      const result = orderProcessor.validateOrder(validOrder);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject order with missing required fields', () => {
      const invalidOrder: Order = {
        id: '',
        tableNumber: '',
        items: [],
        source: 'QR',
        status: {
          current: 'pending',
          history: []
        },
        timestamps: {
          placed: new Date(),
          received: new Date(),
        },
        metadata: {
          priority: 'normal'
        }
      };

      const result = orderProcessor.validateOrder(invalidOrder);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain('Order ID is required');
      expect(result.errors).toContain('Table number is required');
      expect(result.errors).toContain('Order must contain at least one item');
    });

    test('should validate item details correctly', () => {
      const orderWithInvalidItems: Order = {
        id: 'ORD-123456789',
        tableNumber: 'T5',
        items: [
          {
            id: '',
            name: '',
            quantity: 0,
            unitPrice: -5,
            totalPrice: 0,
          }
        ],
        source: 'QR',
        status: {
          current: 'pending',
          history: []
        },
        timestamps: {
          placed: new Date(),
          received: new Date(),
        },
        metadata: {
          priority: 'normal'
        }
      };

      const result = orderProcessor.validateOrder(orderWithInvalidItems);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Item 1: ID is required');
      expect(result.errors).toContain('Item 1: Name is required');
      expect(result.errors).toContain('Item 1: Quantity must be greater than 0');
      expect(result.errors).toContain('Item 1: Unit price cannot be negative');
    });
  });

  describe('Order Processing', () => {
    test('should process QR order and route to active_orders', async () => {
      const qrOrder: Order = {
        id: 'QR-123456789',
        tableNumber: 'T5',
        items: [
          {
            id: 'item-1',
            name: 'Margherita Pizza',
            quantity: 2,
            unitPrice: 15.99,
            totalPrice: 31.98,
          }
        ],
        source: 'QR',
        status: {
          current: 'pending',
          history: []
        },
        timestamps: {
          placed: new Date(),
          received: new Date(),
        },
        metadata: {
          priority: 'normal'
        }
      };

      const processedOrder = await orderProcessor.processOrder(qrOrder, 'QR');

      expect(processedOrder.source).toBe('QR');
      expect(processedOrder.validationStatus).toBe('valid');
      expect(processedOrder.routingDestination).toBe('active_orders');
      expect(processedOrder.processingTimestamp).toBeInstanceOf(Date);
    });

    test('should process STAFF order and route to active_orders', async () => {
      const staffOrder: Order = {
        id: 'STAFF-123456789',
        tableNumber: 'T3',
        items: [
          {
            id: 'item-2',
            name: 'Caesar Salad',
            quantity: 1,
            unitPrice: 12.50,
            totalPrice: 12.50,
          }
        ],
        source: 'STAFF',
        status: {
          current: 'pending',
          history: []
        },
        timestamps: {
          placed: new Date(),
          received: new Date(),
        },
        metadata: {
          priority: 'normal'
        }
      };

      const processedOrder = await orderProcessor.processOrder(staffOrder, 'STAFF');

      expect(processedOrder.source).toBe('STAFF');
      expect(processedOrder.validationStatus).toBe('valid');
      expect(processedOrder.routingDestination).toBe('active_orders');
    });

    test('should route invalid orders to reject', async () => {
      const invalidOrder: Order = {
        id: '',
        tableNumber: '',
        items: [],
        source: 'QR',
        status: {
          current: 'pending',
          history: []
        },
        timestamps: {
          placed: new Date(),
          received: new Date(),
        },
        metadata: {
          priority: 'normal'
        }
      };

      const processedOrder = await orderProcessor.processOrder(invalidOrder, 'QR');

      expect(processedOrder.validationStatus).toBe('invalid');
      expect(processedOrder.routingDestination).toBe('reject');
    });

    test('should fix QR orders that start as completed status', async () => {
      const completedQrOrder: Order = {
        id: 'QR-123456789',
        tableNumber: 'T5',
        items: [
          {
            id: 'item-1',
            name: 'Margherita Pizza',
            quantity: 2,
            unitPrice: 15.99,
            totalPrice: 31.98,
          }
        ],
        source: 'QR',
        status: {
          current: 'completed', // This is the bug - QR orders shouldn't start as completed
          history: []
        },
        timestamps: {
          placed: new Date(),
          received: new Date(),
        },
        metadata: {
          priority: 'normal'
        }
      };

      const processedOrder = await orderProcessor.processOrder(completedQrOrder, 'QR');

      expect(processedOrder.validationStatus).toBe('valid');
      expect(processedOrder.routingDestination).toBe('active_orders');
      // The order should be corrected to pending status during routing
      expect(processedOrder.status.current).toBe('pending');
    });
  });

  describe('Routing Logic', () => {
    test('should route all valid orders to active_orders regardless of source', async () => {
      const sources: OrderSource[] = ['QR', 'STAFF', 'PHONE'];
      
      for (const source of sources) {
        const order: Order = {
          id: `${source}-123456789`,
          tableNumber: 'T1',
          items: [
            {
              id: 'item-1',
              name: 'Test Item',
              quantity: 1,
              unitPrice: 10.00,
              totalPrice: 10.00,
            }
          ],
          source,
          status: {
            current: 'pending',
            history: []
          },
          timestamps: {
            placed: new Date(),
            received: new Date(),
          },
          metadata: {
            priority: 'normal'
          }
        };

        const processedOrder = await orderProcessor.processOrder(order, source);
        
        expect(processedOrder.routingDestination).toBe('active_orders');
        expect(processedOrder.source).toBe(source);
      }
    });
  });
});