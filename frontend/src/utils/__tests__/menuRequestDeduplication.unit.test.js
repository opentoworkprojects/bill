/**
 * Unit Tests for Menu Request Deduplication
 * Tests edge cases and specific scenarios for request deduplication
 * Requirements: 2.2, 9.2, 9.3
 */

import { MenuRequestDeduplication } from '../menuRequestDeduplication';

describe('MenuRequestDeduplication - Unit Tests', () => {
  let deduplication;

  beforeEach(() => {
    deduplication = new MenuRequestDeduplication();
    // Disable debug logging for tests
    deduplication.debugMode = false;
  });

  afterEach(() => {
    deduplication.destroy();
  });

  describe('Rapid Duplicate Requests', () => {
    test('should block rapid duplicate create requests', async () => {
      const formData = { name: 'Test Item', price: 10 };
      const requestKey = deduplication.generateRequestKey('create', null, formData);
      
      let apiCallCount = 0;
      const mockApiCall = jest.fn(async (signal) => {
        apiCallCount++;
        await new Promise(resolve => setTimeout(resolve, 100));
        return { id: '123', ...formData };
      });

      // Fire 5 rapid requests
      const promises = Array(5).fill(null).map(() => 
        deduplication.executeWithDeduplication(
          requestKey,
          mockApiCall,
          { operationType: 'create' }
        ).catch(() => {}) // Catch errors from blocked requests
      );

      await Promise.allSettled(promises);

      // Only one API call should have been made
      expect(apiCallCount).toBe(1);
    });

    test('should block rapid duplicate update requests', async () => {
      const itemId = 'item-123';
      const requestKey = deduplication.generateRequestKey('update', itemId);
      
      let apiCallCount = 0;
      const mockApiCall = jest.fn(async (signal) => {
        apiCallCount++;
        await new Promise(resolve => setTimeout(resolve, 50));
        return { id: itemId, name: 'Updated' };
      });

      // Fire 3 rapid requests
      const promises = Array(3).fill(null).map(() => 
        deduplication.executeWithDeduplication(
          requestKey,
          mockApiCall,
          { operationType: 'update', itemId }
        ).catch(() => {})
      );

      await Promise.allSettled(promises);

      // Only one API call should have been made
      expect(apiCallCount).toBe(1);
    });

    test('should block rapid duplicate delete requests', async () => {
      const itemId = 'item-456';
      const requestKey = deduplication.generateRequestKey('delete', itemId);
      
      let apiCallCount = 0;
      const mockApiCall = jest.fn(async (signal) => {
        apiCallCount++;
        await new Promise(resolve => setTimeout(resolve, 50));
        return { success: true };
      });

      // Fire 10 rapid requests (simulating aggressive clicking)
      const promises = Array(10).fill(null).map(() => 
        deduplication.executeWithDeduplication(
          requestKey,
          mockApiCall,
          { operationType: 'delete', itemId }
        ).catch(() => {})
      );

      await Promise.allSettled(promises);

      // Only one API call should have been made
      expect(apiCallCount).toBe(1);
    });

    test('should block rapid duplicate toggle requests', async () => {
      const itemId = 'item-789';
      const requestKey = deduplication.generateRequestKey('toggle_availability', itemId);
      
      let apiCallCount = 0;
      const mockApiCall = jest.fn(async (signal) => {
        apiCallCount++;
        await new Promise(resolve => setTimeout(resolve, 30));
        return { id: itemId, available: true };
      });

      // Fire 20 rapid toggle requests (simulating rapid clicking)
      const promises = Array(20).fill(null).map(() => 
        deduplication.executeWithDeduplication(
          requestKey,
          mockApiCall,
          { operationType: 'toggle_availability', itemId }
        ).catch(() => {})
      );

      await Promise.allSettled(promises);

      // Only one API call should have been made
      expect(apiCallCount).toBe(1);
    });
  });

  describe('Request Cleanup on Completion', () => {
    test('should remove request from in-flight map on success', async () => {
      const itemId = 'item-success';
      const requestKey = deduplication.generateRequestKey('update', itemId);
      
      const mockApiCall = jest.fn(async (signal) => {
        return { id: itemId, name: 'Success' };
      });

      expect(deduplication.getInFlightCount()).toBe(0);

      await deduplication.executeWithDeduplication(
        requestKey,
        mockApiCall,
        { operationType: 'update', itemId }
      );

      // Request should be removed from in-flight map
      expect(deduplication.getInFlightCount()).toBe(0);
      expect(deduplication.isRequestInFlight(requestKey)).toBe(false);
    });

    test('should add successful request to history', async () => {
      const itemId = 'item-history';
      const requestKey = deduplication.generateRequestKey('create', itemId);
      
      const mockApiCall = jest.fn(async (signal) => {
        return { id: itemId };
      });

      const historyBefore = deduplication.getRequestHistory().length;

      await deduplication.executeWithDeduplication(
        requestKey,
        mockApiCall,
        { operationType: 'create', itemId }
      );

      const historyAfter = deduplication.getRequestHistory();
      expect(historyAfter.length).toBe(historyBefore + 1);
      
      const lastEntry = historyAfter[historyAfter.length - 1];
      expect(lastEntry.success).toBe(true);
      expect(lastEntry.operationType).toBe('create');
      expect(lastEntry.itemId).toBe(itemId);
    });

    test('should allow new request after previous completes', async () => {
      const itemId = 'item-sequential';
      const requestKey = deduplication.generateRequestKey('update', itemId);
      
      let callCount = 0;
      const mockApiCall = jest.fn(async (signal) => {
        callCount++;
        await new Promise(resolve => setTimeout(resolve, 50));
        return { id: itemId, count: callCount };
      });

      // First request
      const result1 = await deduplication.executeWithDeduplication(
        requestKey,
        mockApiCall,
        { operationType: 'update', itemId }
      );

      expect(result1.count).toBe(1);
      expect(deduplication.isRequestInFlight(requestKey)).toBe(false);

      // Second request (should be allowed now)
      const result2 = await deduplication.executeWithDeduplication(
        requestKey,
        mockApiCall,
        { operationType: 'update', itemId }
      );

      expect(result2.count).toBe(2);
      expect(callCount).toBe(2);
    });
  });

  describe('Request Cleanup on Failure', () => {
    test('should remove request from in-flight map on failure', async () => {
      const itemId = 'item-fail';
      const requestKey = deduplication.generateRequestKey('delete', itemId);
      
      const mockApiCall = jest.fn(async (signal) => {
        throw new Error('API Error');
      });

      expect(deduplication.getInFlightCount()).toBe(0);

      await expect(
        deduplication.executeWithDeduplication(
          requestKey,
          mockApiCall,
          { operationType: 'delete', itemId }
        )
      ).rejects.toThrow('API Error');

      // Request should be removed from in-flight map
      expect(deduplication.getInFlightCount()).toBe(0);
      expect(deduplication.isRequestInFlight(requestKey)).toBe(false);
    });

    test('should add failed request to history', async () => {
      const itemId = 'item-fail-history';
      const requestKey = deduplication.generateRequestKey('update', itemId);
      
      const mockApiCall = jest.fn(async (signal) => {
        throw new Error('Network Error');
      });

      const historyBefore = deduplication.getRequestHistory().length;

      await expect(
        deduplication.executeWithDeduplication(
          requestKey,
          mockApiCall,
          { operationType: 'update', itemId }
        )
      ).rejects.toThrow('Network Error');

      const historyAfter = deduplication.getRequestHistory();
      expect(historyAfter.length).toBe(historyBefore + 1);
      
      const lastEntry = historyAfter[historyAfter.length - 1];
      expect(lastEntry.success).toBe(false);
      expect(lastEntry.error).toBe('Network Error');
      expect(lastEntry.operationType).toBe('update');
    });

    test('should allow retry after failure', async () => {
      const itemId = 'item-retry';
      const requestKey = deduplication.generateRequestKey('create', itemId);
      
      let attemptCount = 0;
      const mockApiCall = jest.fn(async (signal) => {
        attemptCount++;
        if (attemptCount === 1) {
          throw new Error('First attempt failed');
        }
        return { id: itemId, attempt: attemptCount };
      });

      // First attempt (fails)
      await expect(
        deduplication.executeWithDeduplication(
          requestKey,
          mockApiCall,
          { operationType: 'create', itemId }
        )
      ).rejects.toThrow('First attempt failed');

      expect(deduplication.isRequestInFlight(requestKey)).toBe(false);

      // Retry (succeeds)
      const result = await deduplication.executeWithDeduplication(
        requestKey,
        mockApiCall,
        { operationType: 'create', itemId }
      );

      expect(result.attempt).toBe(2);
      expect(attemptCount).toBe(2);
    });

    test('should handle multiple failures gracefully', async () => {
      const itemId = 'item-multi-fail';
      const requestKey = deduplication.generateRequestKey('update', itemId);
      
      const mockApiCall = jest.fn(async (signal) => {
        throw new Error('Persistent Error');
      });

      // Multiple failed attempts
      for (let i = 0; i < 3; i++) {
        await expect(
          deduplication.executeWithDeduplication(
            requestKey,
            mockApiCall,
            { operationType: 'update', itemId }
          )
        ).rejects.toThrow('Persistent Error');

        expect(deduplication.isRequestInFlight(requestKey)).toBe(false);
      }

      // All failures should be in history
      const history = deduplication.getRequestHistory();
      const failures = history.filter(h => h.requestKey === requestKey);
      expect(failures.length).toBe(3);
      expect(failures.every(f => !f.success)).toBe(true);
    });
  });

  describe('AbortController Cancellation', () => {
    test('should cancel request using AbortController', async () => {
      const itemId = 'item-cancel';
      const requestKey = deduplication.generateRequestKey('update', itemId);
      
      let abortSignalReceived = null;
      const mockApiCall = jest.fn(async (signal) => {
        abortSignalReceived = signal;
        // Don't reject on abort, just track the signal
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { id: itemId };
      });

      // Start request
      const promise = deduplication.executeWithDeduplication(
        requestKey,
        mockApiCall,
        { operationType: 'update', itemId }
      );

      // Wait a bit then cancel
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(deduplication.isRequestInFlight(requestKey)).toBe(true);
      
      const cancelled = deduplication.cancelRequest(requestKey);
      expect(cancelled).toBe(true);

      // Request should be removed from in-flight
      expect(deduplication.isRequestInFlight(requestKey)).toBe(false);

      // Verify abort signal was triggered
      expect(abortSignalReceived).not.toBeNull();
      expect(abortSignalReceived.aborted).toBe(true);
    });

    test('should handle cancellation of non-existent request', () => {
      const requestKey = 'non-existent-request';
      
      const cancelled = deduplication.cancelRequest(requestKey);
      expect(cancelled).toBe(false);
    });

    test('should not throw when cancelling already completed request', async () => {
      const itemId = 'item-completed';
      const requestKey = deduplication.generateRequestKey('delete', itemId);
      
      const mockApiCall = jest.fn(async (signal) => {
        return { success: true };
      });

      // Complete request
      await deduplication.executeWithDeduplication(
        requestKey,
        mockApiCall,
        { operationType: 'delete', itemId }
      );

      // Try to cancel (should return false but not throw)
      expect(() => {
        const cancelled = deduplication.cancelRequest(requestKey);
        expect(cancelled).toBe(false);
      }).not.toThrow();
    });

    test('should handle AbortError gracefully', async () => {
      const itemId = 'item-abort-error';
      const requestKey = deduplication.generateRequestKey('create', itemId);
      
      let abortCalled = false;
      const mockApiCall = jest.fn(async (signal) => {
        // Track if abort was called
        signal.addEventListener('abort', () => {
          abortCalled = true;
        });
        
        // Simulate a long-running request
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { id: itemId };
      });

      // Start request
      const promise = deduplication.executeWithDeduplication(
        requestKey,
        mockApiCall,
        { operationType: 'create', itemId }
      );

      // Cancel immediately
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Cancel the request
      const cancelled = deduplication.cancelRequest(requestKey);
      
      expect(cancelled).toBe(true);
      expect(abortCalled).toBe(true);

      // Request should be cleaned up
      expect(deduplication.isRequestInFlight(requestKey)).toBe(false);
    });

    test('should allow new request after cancellation', async () => {
      const itemId = 'item-after-cancel';
      const requestKey = deduplication.generateRequestKey('update', itemId);
      
      let callCount = 0;
      const mockApiCall = jest.fn(async (signal) => {
        callCount++;
        const currentCount = callCount;
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => resolve({ id: itemId, count: currentCount }), 500);
          signal.addEventListener('abort', () => {
            clearTimeout(timeout);
            const error = new Error('Cancelled');
            error.name = 'AbortError';
            reject(error);
          });
        });
      });

      // First request (will be cancelled)
      const promise1 = deduplication.executeWithDeduplication(
        requestKey,
        mockApiCall,
        { operationType: 'update', itemId }
      );

      await new Promise(resolve => setTimeout(resolve, 50));
      deduplication.cancelRequest(requestKey);

      await expect(promise1).rejects.toThrow();

      // Second request (should be allowed)
      const result = await deduplication.executeWithDeduplication(
        requestKey,
        mockApiCall,
        { operationType: 'update', itemId }
      );

      expect(result.count).toBe(2);
      expect(callCount).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    test('should handle request with no itemId', async () => {
      const requestKey = deduplication.generateRequestKey('create', null, { name: 'Test' });
      
      const mockApiCall = jest.fn(async (signal) => {
        return { id: 'new-id', name: 'Test' };
      });

      const result = await deduplication.executeWithDeduplication(
        requestKey,
        mockApiCall,
        { operationType: 'create' }
      );

      expect(result.id).toBe('new-id');
      expect(mockApiCall).toHaveBeenCalledTimes(1);
    });

    test('should handle concurrent different operations', async () => {
      const itemId1 = 'item-1';
      const itemId2 = 'item-2';
      const key1 = deduplication.generateRequestKey('update', itemId1);
      const key2 = deduplication.generateRequestKey('delete', itemId2);
      
      let callCount = 0;
      const mockApiCall = jest.fn(async (signal) => {
        callCount++;
        await new Promise(resolve => setTimeout(resolve, 50));
        return { success: true, count: callCount };
      });

      // Fire two different operations concurrently
      const [result1, result2] = await Promise.all([
        deduplication.executeWithDeduplication(key1, mockApiCall, { operationType: 'update', itemId: itemId1 }),
        deduplication.executeWithDeduplication(key2, mockApiCall, { operationType: 'delete', itemId: itemId2 })
      ]);

      // Both should succeed
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(callCount).toBe(2);
    });

    test('should handle empty form data', () => {
      const requestKey = deduplication.generateRequestKey('create', null, {});
      expect(requestKey).toMatch(/^create_/);
    });

    test('should generate consistent keys for identical form data', () => {
      const formData = { name: 'Pizza', price: 15, category: 'Main' };
      
      const key1 = deduplication.generateRequestKey('create', null, formData);
      const key2 = deduplication.generateRequestKey('create', null, formData);
      
      expect(key1).toBe(key2);
    });

    test('should generate different keys for different form data', () => {
      const formData1 = { name: 'Pizza', price: 15 };
      const formData2 = { name: 'Burger', price: 12 };
      
      const key1 = deduplication.generateRequestKey('create', null, formData1);
      const key2 = deduplication.generateRequestKey('create', null, formData2);
      
      expect(key1).not.toBe(key2);
    });

    test('should handle request timeout', async () => {
      // Create instance with short timeout
      const shortTimeoutDedup = new MenuRequestDeduplication();
      shortTimeoutDedup.config.requestTimeout = 100; // 100ms
      shortTimeoutDedup.debugMode = false;

      const itemId = 'item-timeout';
      const requestKey = shortTimeoutDedup.generateRequestKey('update', itemId);
      
      const mockApiCall = jest.fn(async (signal) => {
        await new Promise(resolve => setTimeout(resolve, 200)); // Longer than timeout
        return { id: itemId };
      });

      // Start request
      const promise = shortTimeoutDedup.executeWithDeduplication(
        requestKey,
        mockApiCall,
        { operationType: 'update', itemId }
      );

      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      // Request should be considered timed out and removed
      expect(shortTimeoutDedup.isRequestInFlight(requestKey)).toBe(false);

      shortTimeoutDedup.destroy();
    });

    test('should track statistics correctly', async () => {
      const mockApiCall = jest.fn(async (signal) => {
        return { success: true };
      });

      const failingApiCall = jest.fn(async (signal) => {
        throw new Error('Failed');
      });

      // Execute some successful requests
      await deduplication.executeWithDeduplication(
        'req1',
        mockApiCall,
        { operationType: 'create' }
      );

      await deduplication.executeWithDeduplication(
        'req2',
        mockApiCall,
        { operationType: 'update' }
      );

      // Execute a failing request
      await expect(
        deduplication.executeWithDeduplication(
          'req3',
          failingApiCall,
          { operationType: 'delete' }
        )
      ).rejects.toThrow();

      const stats = deduplication.getStats();
      
      expect(stats.totalRequests).toBe(3);
      expect(stats.successCount).toBe(2);
      expect(stats.failureCount).toBe(1);
      expect(stats.successRate).toBeCloseTo(66.67, 1);
      expect(stats.inFlightCount).toBe(0);
    });
  });
});
