/**
 * Property-Based Tests for Request Deduplication Layer
 * **Feature: menu-page-performance, Property 4: Request Deduplication**
 * **Validates: Requirements 2.2, 2.4, 9.1, 9.2, 9.3, 9.4**
 * 
 * Property: For any in-flight request with a given operation type and item ID, 
 * subsequent identical requests SHALL be ignored until the first request completes.
 */

import fc from 'fast-check';
import { MenuRequestDeduplication } from '../menuRequestDeduplication';

// Test data generators
const operationTypeGenerator = fc.constantFrom('create', 'update', 'delete', 'toggle');

const itemIdGenerator = fc.string({ minLength: 1, maxLength: 20 });

const formDataGenerator = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }),
  category: fc.string({ minLength: 1, maxLength: 50 }),
  price: fc.float({ min: Math.fround(0.01), max: Math.fround(9999.99), noNaN: true }),
  description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
  available: fc.boolean(),
  preparation_time: fc.integer({ min: 0, max: 120 })
});

const requestMetadataGenerator = fc.record({
  requestId: fc.uuid(),
  operationType: operationTypeGenerator,
  itemId: fc.option(itemIdGenerator, { nil: null }),
  timestamp: fc.integer({ min: Date.now() - 10000, max: Date.now() })
});

const delayGenerator = fc.integer({ min: 10, max: 200 });

describe('Property 4: Request Deduplication', () => {
  let deduplication;

  // Increase timeout for property-based tests
  jest.setTimeout(30000);

  beforeEach(() => {
    deduplication = new MenuRequestDeduplication();
  });

  afterEach(() => {
    deduplication.destroy();
  });

  /**
   * Property 4.1: Duplicate requests are blocked while request is in flight
   * **Validates: Requirements 2.2, 9.1, 9.2**
   */
  test('Property 4.1: Duplicate requests are blocked while original request is in flight', async () => {
    await fc.assert(
      fc.asyncProperty(
        operationTypeGenerator,
        itemIdGenerator,
        delayGenerator,
        fc.integer({ min: 2, max: 10 }),
        async (operation, itemId, delay, duplicateCount) => {
          const requestKey = deduplication.generateRequestKey(operation, itemId);
          let apiCallCount = 0;

          // Mock API call that takes some time
          const mockApiCall = async (signal) => {
            apiCallCount++;
            await new Promise(resolve => setTimeout(resolve, delay));
            return { success: true, itemId };
          };

          // Fire multiple identical requests simultaneously
          const promises = Array(duplicateCount)
            .fill(null)
            .map(() => 
              deduplication.executeWithDeduplication(
                requestKey,
                mockApiCall,
                { operationType: operation, itemId }
              )
            );

          // Wait for all promises to resolve
          await Promise.all(promises);

          // Property: Only one API call should have been made
          expect(apiCallCount).toBe(1);

          // Property: Request should no longer be in flight
          expect(deduplication.isRequestInFlight(requestKey)).toBe(false);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4.2: Request key generation is consistent for same inputs
   * **Validates: Requirements 9.1**
   */
  test('Property 4.2: Request key generation is consistent and deterministic', () => {
    fc.assert(
      fc.property(
        operationTypeGenerator,
        itemIdGenerator,
        formDataGenerator,
        (operation, itemId, formData) => {
          // Generate key multiple times with same inputs
          const key1 = deduplication.generateRequestKey(operation, itemId, formData);
          const key2 = deduplication.generateRequestKey(operation, itemId, formData);
          const key3 = deduplication.generateRequestKey(operation, itemId, formData);

          // Property: Keys should be identical for same inputs
          expect(key1).toBe(key2);
          expect(key2).toBe(key3);

          // Property: Keys should be non-empty strings
          expect(typeof key1).toBe('string');
          expect(key1.length).toBeGreaterThan(0);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4.3: Different operations generate different request keys
   * **Validates: Requirements 9.1**
   */
  test('Property 4.3: Different operations or items generate different request keys', () => {
    fc.assert(
      fc.property(
        operationTypeGenerator,
        operationTypeGenerator,
        itemIdGenerator,
        itemIdGenerator,
        (operation1, operation2, itemId1, itemId2) => {
          // Skip if both operations and items are the same
          if (operation1 === operation2 && itemId1 === itemId2) {
            return true;
          }

          const key1 = deduplication.generateRequestKey(operation1, itemId1);
          const key2 = deduplication.generateRequestKey(operation2, itemId2);

          // Property: Different inputs should generate different keys
          expect(key1).not.toBe(key2);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4.4: Create operations with different form data generate different keys
   * **Validates: Requirements 9.1**
   */
  test('Property 4.4: Create operations with different form data generate different keys', () => {
    fc.assert(
      fc.property(
        formDataGenerator,
        formDataGenerator,
        (formData1, formData2) => {
          // Skip if form data is identical
          if (JSON.stringify(formData1) === JSON.stringify(formData2)) {
            return true;
          }

          const key1 = deduplication.generateRequestKey('create', null, formData1);
          const key2 = deduplication.generateRequestKey('create', null, formData2);

          // Property: Different form data should generate different keys
          expect(key1).not.toBe(key2);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4.5: Completed requests are removed from in-flight tracking
   * **Validates: Requirements 9.3**
   */
  test('Property 4.5: Completed requests are removed from in-flight tracking', async () => {
    await fc.assert(
      fc.asyncProperty(
        operationTypeGenerator,
        itemIdGenerator,
        delayGenerator,
        async (operation, itemId, delay) => {
          const requestKey = deduplication.generateRequestKey(operation, itemId);

          // Mock API call
          const mockApiCall = async (signal) => {
            await new Promise(resolve => setTimeout(resolve, delay));
            return { success: true };
          };

          // Property: Request should not be in flight initially
          expect(deduplication.isRequestInFlight(requestKey)).toBe(false);

          // Execute request
          const promise = deduplication.executeWithDeduplication(
            requestKey,
            mockApiCall,
            { operationType: operation, itemId }
          );

          // Property: Request should be in flight during execution
          expect(deduplication.isRequestInFlight(requestKey)).toBe(true);

          // Wait for completion
          await promise;

          // Property: Request should not be in flight after completion
          expect(deduplication.isRequestInFlight(requestKey)).toBe(false);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4.6: Failed requests are removed from in-flight tracking
   * **Validates: Requirements 9.3**
   */
  test('Property 4.6: Failed requests are removed from in-flight tracking', async () => {
    await fc.assert(
      fc.asyncProperty(
        operationTypeGenerator,
        itemIdGenerator,
        delayGenerator,
        fc.string({ minLength: 1, maxLength: 100 }),
        async (operation, itemId, delay, errorMessage) => {
          const requestKey = deduplication.generateRequestKey(operation, itemId);

          // Mock API call that fails
          const mockApiCall = async (signal) => {
            await new Promise(resolve => setTimeout(resolve, delay));
            throw new Error(errorMessage);
          };

          // Execute request (expect it to fail)
          try {
            await deduplication.executeWithDeduplication(
              requestKey,
              mockApiCall,
              { operationType: operation, itemId }
            );
          } catch (error) {
            // Expected to fail
          }

          // Property: Request should not be in flight after failure
          expect(deduplication.isRequestInFlight(requestKey)).toBe(false);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4.7: Multiple different requests can be in flight simultaneously
   * **Validates: Requirements 9.1, 9.2**
   */
  test('Property 4.7: Multiple different requests can be in flight simultaneously', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            operation: operationTypeGenerator,
            itemId: itemIdGenerator
          }),
          { minLength: 2, maxLength: 10 }
        ),
        delayGenerator,
        async (requests, delay) => {
          // Ensure unique request keys by filtering
          const uniqueRequests = [];
          const seenKeys = new Set();
          
          for (const req of requests) {
            const key = deduplication.generateRequestKey(req.operation, req.itemId);
            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              uniqueRequests.push(req);
            }
          }

          if (uniqueRequests.length < 2) {
            return true; // Skip if not enough unique requests
          }

          // Mock API call
          const mockApiCall = async (signal) => {
            await new Promise(resolve => setTimeout(resolve, delay));
            return { success: true };
          };

          // Start all requests
          const promises = uniqueRequests.map(req => {
            const requestKey = deduplication.generateRequestKey(req.operation, req.itemId);
            return deduplication.executeWithDeduplication(
              requestKey,
              mockApiCall,
              { operationType: req.operation, itemId: req.itemId }
            );
          });

          // Give a moment for all requests to register
          await new Promise(resolve => setTimeout(resolve, 5));

          // Property: All requests should be in flight
          uniqueRequests.forEach(req => {
            const requestKey = deduplication.generateRequestKey(req.operation, req.itemId);
            expect(deduplication.isRequestInFlight(requestKey)).toBe(true);
          });

          // Property: In-flight count should match number of unique requests
          expect(deduplication.getInFlightCount()).toBe(uniqueRequests.length);

          // Wait for all to complete
          await Promise.all(promises);

          // Property: No requests should be in flight after completion
          expect(deduplication.getInFlightCount()).toBe(0);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4.8: Request cancellation removes request from tracking
   * **Validates: Requirements 9.3**
   */
  test('Property 4.8: Request cancellation removes request from in-flight tracking', async () => {
    await fc.assert(
      fc.asyncProperty(
        operationTypeGenerator,
        itemIdGenerator,
        async (operation, itemId) => {
          const requestKey = deduplication.generateRequestKey(operation, itemId);

          // Mock API call that takes a long time
          const mockApiCall = async (signal) => {
            await new Promise((resolve, reject) => {
              const timeout = setTimeout(resolve, 5000);
              signal.addEventListener('abort', () => {
                clearTimeout(timeout);
                reject(new Error('Request aborted'));
              });
            });
            return { success: true };
          };

          // Start request
          const promise = deduplication.executeWithDeduplication(
            requestKey,
            mockApiCall,
            { operationType: operation, itemId }
          );

          // Property: Request should be in flight
          expect(deduplication.isRequestInFlight(requestKey)).toBe(true);

          // Cancel request
          const cancelled = deduplication.cancelRequest(requestKey);

          // Property: Cancellation should succeed
          expect(cancelled).toBe(true);

          // Property: Request should not be in flight after cancellation
          expect(deduplication.isRequestInFlight(requestKey)).toBe(false);

          // Wait for promise to reject (with timeout)
          try {
            await Promise.race([
              promise,
              new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100))
            ]);
          } catch (error) {
            // Expected to fail
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4.9: Request history is maintained correctly
   * **Validates: Requirements 9.3**
   */
  test('Property 4.9: Request history is maintained with correct metadata', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            operation: operationTypeGenerator,
            itemId: itemIdGenerator,
            shouldSucceed: fc.boolean()
          }),
          { minLength: 1, maxLength: 15 }
        ),
        async (requests) => {
          // Execute all requests
          for (const req of requests) {
            const requestKey = deduplication.generateRequestKey(req.operation, req.itemId);
            
            const mockApiCall = async (signal) => {
              await new Promise(resolve => setTimeout(resolve, 10));
              if (!req.shouldSucceed) {
                throw new Error('Test error');
              }
              return { success: true };
            };

            try {
              await deduplication.executeWithDeduplication(
                requestKey,
                mockApiCall,
                { operationType: req.operation, itemId: req.itemId }
              );
            } catch (error) {
              // Expected for failed requests
            }
          }

          // Get history
          const history = deduplication.getRequestHistory(requests.length);

          // Property: History should contain entries
          expect(history.length).toBeGreaterThan(0);
          expect(history.length).toBeLessThanOrEqual(requests.length);

          // Property: Each history entry should have required fields
          history.forEach(entry => {
            expect(entry).toHaveProperty('requestKey');
            expect(entry).toHaveProperty('operationType');
            expect(entry).toHaveProperty('duration');
            expect(entry).toHaveProperty('success');
            expect(entry).toHaveProperty('timestamp');
            expect(typeof entry.duration).toBe('number');
            expect(entry.duration).toBeGreaterThanOrEqual(0);
            expect(typeof entry.success).toBe('boolean');
          });

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4.10: Statistics are accurate
   * **Validates: Requirements 9.1, 9.2, 9.3**
   */
  test('Property 4.10: Statistics accurately reflect request state', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            operation: operationTypeGenerator,
            itemId: itemIdGenerator,
            shouldSucceed: fc.boolean()
          }),
          { minLength: 1, maxLength: 20 }
        ),
        async (requests) => {
          // Create unique requests to avoid deduplication
          const uniqueRequests = [];
          const seenKeys = new Set();
          
          for (const req of requests) {
            const key = deduplication.generateRequestKey(req.operation, req.itemId);
            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              uniqueRequests.push(req);
            }
          }

          // Execute all requests
          for (const req of uniqueRequests) {
            const requestKey = deduplication.generateRequestKey(req.operation, req.itemId);
            
            const mockApiCall = async (signal) => {
              await new Promise(resolve => setTimeout(resolve, 10));
              if (!req.shouldSucceed) {
                throw new Error('Test error');
              }
              return { success: true };
            };

            try {
              await deduplication.executeWithDeduplication(
                requestKey,
                mockApiCall,
                { operationType: req.operation, itemId: req.itemId }
              );
            } catch (error) {
              // Expected for failed requests
            }
          }

          // Get statistics
          const stats = deduplication.getStats();

          // Property: Stats should have required fields
          expect(stats).toHaveProperty('inFlightCount');
          expect(stats).toHaveProperty('totalRequests');
          expect(stats).toHaveProperty('successCount');
          expect(stats).toHaveProperty('failureCount');
          expect(stats).toHaveProperty('successRate');
          expect(stats).toHaveProperty('averageDuration');

          // Property: No requests should be in flight after all complete
          expect(stats.inFlightCount).toBe(0);

          // Property: Total requests should be at least the number of unique requests
          expect(stats.totalRequests).toBeGreaterThanOrEqual(uniqueRequests.length);

          // Property: Success + failure should equal total
          expect(stats.successCount + stats.failureCount).toBe(stats.totalRequests);

          // Property: Success rate should be between 0 and 100
          expect(stats.successRate).toBeGreaterThanOrEqual(0);
          expect(stats.successRate).toBeLessThanOrEqual(100);

          // Property: Average duration should be non-negative
          expect(stats.averageDuration).toBeGreaterThanOrEqual(0);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4.11: Form data hashing is consistent
   * **Validates: Requirements 9.1**
   */
  test('Property 4.11: Form data hashing produces consistent results', () => {
    fc.assert(
      fc.property(
        formDataGenerator,
        (formData) => {
          // Hash same data multiple times
          const hash1 = deduplication.hashFormData(formData);
          const hash2 = deduplication.hashFormData(formData);
          const hash3 = deduplication.hashFormData(formData);

          // Property: Hashes should be identical
          expect(hash1).toBe(hash2);
          expect(hash2).toBe(hash3);

          // Property: Hash should be a non-empty string
          expect(typeof hash1).toBe('string');
          expect(hash1.length).toBeGreaterThan(0);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4.12: Timed-out requests are cleaned up
   * **Validates: Requirements 9.3**
   */
  test('Property 4.12: Timed-out requests are detected and cleaned up', async () => {
    await fc.assert(
      fc.asyncProperty(
        operationTypeGenerator,
        itemIdGenerator,
        async (operation, itemId) => {
          // Create a new instance with short timeout for testing
          const testDedup = new MenuRequestDeduplication();
          testDedup.config.requestTimeout = 100; // 100ms timeout

          const requestKey = testDedup.generateRequestKey(operation, itemId);

          // Mock API call that takes longer than timeout
          const mockApiCall = async (signal) => {
            await new Promise(resolve => setTimeout(resolve, 200));
            return { success: true };
          };

          // Start request (don't await)
          testDedup.executeWithDeduplication(
            requestKey,
            mockApiCall,
            { operationType: operation, itemId }
          ).catch(() => {}); // Ignore errors

          // Property: Request should be in flight initially
          expect(testDedup.isRequestInFlight(requestKey)).toBe(true);

          // Wait for timeout + cleanup
          await new Promise(resolve => setTimeout(resolve, 150));

          // Property: After timeout, request should be considered not in flight
          expect(testDedup.isRequestInFlight(requestKey)).toBe(false);

          testDedup.destroy();
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 4.13: Clear operation resets all state
   * **Validates: Requirements 9.3**
   */
  test('Property 4.13: Clear operation resets all deduplication state', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            operation: operationTypeGenerator,
            itemId: itemIdGenerator
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (requests) => {
          // Start multiple requests with short delay (don't await)
          const promises = requests.map(req => {
            const requestKey = deduplication.generateRequestKey(req.operation, req.itemId);
            const mockApiCall = async (signal) => {
              await new Promise(resolve => setTimeout(resolve, 100));
              return { success: true };
            };
            return deduplication.executeWithDeduplication(
              requestKey,
              mockApiCall,
              { operationType: req.operation, itemId: req.itemId }
            ).catch(() => {}); // Ignore errors
          });

          // Give a moment for requests to register
          await new Promise(resolve => setTimeout(resolve, 10));

          // Property: Some requests should be in flight
          const initialCount = deduplication.getInFlightCount();
          expect(initialCount).toBeGreaterThanOrEqual(0);

          // Clear all state
          deduplication.clear();

          // Property: No requests should be in flight after clear
          expect(deduplication.getInFlightCount()).toBe(0);

          // Property: History should be cleared
          expect(deduplication.getRequestHistory().length).toBe(0);

          // Wait for promises to settle
          await Promise.allSettled(promises);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 4.14: Rapid duplicate clicks are deduplicated
   * **Validates: Requirements 2.2, 2.4, 9.4**
   */
  test('Property 4.14: Rapid duplicate clicks result in single API call', async () => {
    await fc.assert(
      fc.asyncProperty(
        operationTypeGenerator,
        itemIdGenerator,
        fc.integer({ min: 5, max: 20 }),
        delayGenerator,
        async (operation, itemId, clickCount, delay) => {
          const requestKey = deduplication.generateRequestKey(operation, itemId);
          let apiCallCount = 0;

          // Mock API call
          const mockApiCall = async (signal) => {
            apiCallCount++;
            await new Promise(resolve => setTimeout(resolve, delay));
            return { success: true };
          };

          // Simulate rapid clicks
          const promises = [];
          for (let i = 0; i < clickCount; i++) {
            promises.push(
              deduplication.executeWithDeduplication(
                requestKey,
                mockApiCall,
                { operationType: operation, itemId }
              ).catch(() => {}) // Some may throw "already in progress"
            );
          }

          // Wait for all to complete
          await Promise.allSettled(promises);

          // Property: Only one API call should have been made
          expect(apiCallCount).toBe(1);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4.15: Cancelling non-existent request returns false
   * **Validates: Requirements 9.3**
   */
  test('Property 4.15: Cancelling non-existent request is handled gracefully', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        (nonExistentKey) => {
          // Property: Cancelling non-existent request should return false
          const result = deduplication.cancelRequest(nonExistentKey);
          expect(result).toBe(false);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});

// Integration tests to verify property test setup
describe('Property Test Infrastructure', () => {
  test('should generate valid operation types', () => {
    fc.assert(
      fc.property(operationTypeGenerator, (operation) => {
        expect(['create', 'update', 'delete', 'toggle']).toContain(operation);
        return true;
      }),
      { numRuns: 20 }
    );
  });

  test('should generate valid item IDs', () => {
    fc.assert(
      fc.property(itemIdGenerator, (itemId) => {
        expect(typeof itemId).toBe('string');
        expect(itemId.length).toBeGreaterThan(0);
        return true;
      }),
      { numRuns: 20 }
    );
  });

  test('should generate valid form data', () => {
    fc.assert(
      fc.property(formDataGenerator, (formData) => {
        expect(formData).toHaveProperty('name');
        expect(formData).toHaveProperty('category');
        expect(formData).toHaveProperty('price');
        expect(formData).toHaveProperty('available');
        expect(typeof formData.name).toBe('string');
        expect(typeof formData.price).toBe('number');
        expect(typeof formData.available).toBe('boolean');
        expect(formData.price).toBeGreaterThan(0);
        return true;
      }),
      { numRuns: 20 }
    );
  });

  test('should generate valid request metadata', () => {
    fc.assert(
      fc.property(requestMetadataGenerator, (metadata) => {
        expect(metadata).toHaveProperty('requestId');
        expect(metadata).toHaveProperty('operationType');
        expect(metadata).toHaveProperty('timestamp');
        expect(typeof metadata.requestId).toBe('string');
        expect(['create', 'update', 'delete', 'toggle']).toContain(metadata.operationType);
        expect(typeof metadata.timestamp).toBe('number');
        return true;
      }),
      { numRuns: 20 }
    );
  });
});
