/**
 * Setup verification tests for QR Order Workflow Fix
 * 
 * This test file verifies that the testing framework is properly configured
 * and that our generators produce valid test data.
 */

import * as fc from 'fast-check';
import { setupTestEnvironment, DEFAULT_PBT_CONFIG, runPropertyTest } from './setup';
import { generators } from './generators';
import { Order, OrderSource, OrderStatusType } from '../../types';

// Setup test environment
setupTestEnvironment();

describe('QR Order Workflow - Test Setup Verification', () => {
  describe('Testing Framework Setup', () => {
    test('fast-check is properly configured', () => {
      expect(fc).toBeDefined();
      expect(typeof fc.assert).toBe('function');
      expect(typeof fc.property).toBe('function');
    });

    test('default PBT configuration is valid', () => {
      expect(DEFAULT_PBT_CONFIG.numRuns).toBeGreaterThanOrEqual(100);
      expect(DEFAULT_PBT_CONFIG.verbose).toBe(true);
    });

    test('property test runner works correctly', () => {
      const simpleProperty = fc.property(fc.integer(), (n) => {
        return typeof n === 'number';
      });

      expect(() => runPropertyTest(simpleProperty)).not.toThrow();
    });
  });

  describe('Generator Validation', () => {
    test('order generator produces valid orders', () => {
      const orderProperty = fc.property(generators.order(), (order: Order) => {
        // Validate basic order structure
        expect(typeof order.id).toBe('string');
        expect(order.id.length).toBeGreaterThan(0);
        expect(typeof order.tableNumber).toBe('string');
        expect(order.tableNumber.length).toBeGreaterThan(0);
        expect(Array.isArray(order.items)).toBe(true);
        expect(order.items.length).toBeGreaterThan(0);
        expect(['QR', 'STAFF', 'PHONE']).toContain(order.source);
        expect(['pending', 'active', 'preparing', 'ready', 'completed']).toContain(order.status.current);
        
        // Validate timestamps
        expect(order.timestamps.placed).toBeInstanceOf(Date);
        expect(order.timestamps.received).toBeInstanceOf(Date);
        expect(order.timestamps.received.getTime()).toBeGreaterThanOrEqual(order.timestamps.placed.getTime());
        
        // Validate items
        order.items.forEach(item => {
          expect(typeof item.id).toBe('string');
          expect(typeof item.name).toBe('string');
          expect(typeof item.quantity).toBe('number');
          expect(item.quantity).toBeGreaterThan(0);
          expect(typeof item.unitPrice).toBe('number');
          expect(item.unitPrice).toBeGreaterThan(0);
          expect(typeof item.totalPrice).toBe('number');
          expect(item.totalPrice).toBeCloseTo(item.quantity * item.unitPrice, 2);
        });

        return true;
      });

      runPropertyTest(orderProperty);
    });

    test('QR order generator produces only QR orders', () => {
      const qrOrderProperty = fc.property(generators.qrOrder(), (order: Order) => {
        expect(order.source).toBe('QR');
        return true;
      });

      runPropertyTest(qrOrderProperty);
    });

    test('order with status generator produces correct status', () => {
      const statuses: OrderStatusType[] = ['pending', 'active', 'preparing', 'ready', 'completed'];
      
      statuses.forEach(status => {
        const statusProperty = fc.property(generators.orderWithStatus(status), (order: Order) => {
          expect(order.status.current).toBe(status);
          return true;
        });

        runPropertyTest(statusProperty);
      });
    });

    test('same table orders generator produces orders with same table', () => {
      const sameTableProperty = fc.property(generators.sameTableOrders(), (orders: Order[]) => {
        expect(orders.length).toBeGreaterThanOrEqual(2);
        
        const firstTableNumber = orders[0].tableNumber;
        orders.forEach(order => {
          expect(order.tableNumber).toBe(firstTableNumber);
        });

        return true;
      });

      runPropertyTest(sameTableProperty);
    });

    test('time window orders generator produces orders within window', () => {
      const windowMinutes = 5;
      const timeWindowProperty = fc.property(
        generators.ordersWithinTimeWindow(windowMinutes), 
        (orders: Order[]) => {
          expect(orders.length).toBeGreaterThanOrEqual(2);
          
          const timestamps = orders.map(order => order.timestamps.placed.getTime());
          const minTime = Math.min(...timestamps);
          const maxTime = Math.max(...timestamps);
          const windowMs = windowMinutes * 60 * 1000;
          
          expect(maxTime - minTime).toBeLessThanOrEqual(windowMs);

          return true;
        }
      );

      runPropertyTest(timeWindowProperty);
    });
  });

  describe('Type Safety Verification', () => {
    test('generators produce type-safe objects', () => {
      // This test verifies that our generators produce objects that match TypeScript interfaces
      const typeProperty = fc.property(generators.order(), (order: Order) => {
        // If this compiles and runs without TypeScript errors, our types are correct
        const orderSource: OrderSource = order.source;
        const orderStatus: OrderStatusType = order.status.current;
        
        expect(['QR', 'STAFF', 'PHONE']).toContain(orderSource);
        expect(['pending', 'active', 'preparing', 'ready', 'completed']).toContain(orderStatus);

        return true;
      });

      runPropertyTest(typeProperty);
    });
  });
});

describe('Property Test Examples', () => {
  test('example property: order total equals sum of item totals', () => {
    const orderTotalProperty = fc.property(generators.order(), (order: Order) => {
      const calculatedTotal = order.items.reduce((sum, item) => sum + item.totalPrice, 0);
      const expectedTotal = order.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      
      // Allow for small floating point differences
      expect(Math.abs(calculatedTotal - expectedTotal)).toBeLessThan(0.01);
      
      return true;
    });

    runPropertyTest(orderTotalProperty);
  });

  test('example property: order timestamps are chronological', () => {
    const chronologicalProperty = fc.property(generators.order(), (order: Order) => {
      const { placed, received, started, ready, completed } = order.timestamps;
      
      // Basic chronological order
      expect(received.getTime()).toBeGreaterThanOrEqual(placed.getTime());
      
      if (started) {
        expect(started.getTime()).toBeGreaterThanOrEqual(received.getTime());
      }
      
      if (ready && started) {
        expect(ready.getTime()).toBeGreaterThanOrEqual(started.getTime());
      }
      
      if (completed && ready) {
        expect(completed.getTime()).toBeGreaterThanOrEqual(ready.getTime());
      }

      return true;
    });

    runPropertyTest(chronologicalProperty);
  });
});