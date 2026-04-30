/**
 * Property-Based Tests for Menu Cache Manager
 * Feature: menu-page-performance
 * Tests cache consistency properties across all operations
 */

import fc from 'fast-check';
import { MenuCacheManager } from '../menuCache';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

global.localStorage = localStorageMock;

// Arbitrary generators for menu items
const arbitraryMenuItem = () => fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  category: fc.constantFrom('Appetizers', 'Main Course', 'Desserts', 'Beverages'),
  price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
  description: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
  image_url: fc.option(fc.webUrl(), { nil: null }),
  available: fc.boolean(),
  preparation_time: fc.integer({ min: 1, max: 120 }),
  is_popular: fc.boolean(),
  is_vegetarian: fc.boolean(),
  is_spicy: fc.boolean(),
  allergens: fc.option(fc.string({ maxLength: 100 }), { nil: null }),
  created_at: fc.integer({ min: 1577836800000, max: 1767225600000 }).map(ts => new Date(ts).toISOString()),
  updated_at: fc.integer({ min: 1577836800000, max: 1767225600000 }).map(ts => new Date(ts).toISOString())
});

const arbitraryMenuItems = () => fc.array(arbitraryMenuItem(), { minLength: 0, maxLength: 50 });

describe('MenuCache Property-Based Tests', () => {
  let cache;

  beforeEach(() => {
    localStorage.clear();
    cache = new MenuCacheManager();
  });

  afterEach(() => {
    cache.clear();
    localStorage.clear();
  });

  /**
   * Property 13: Cache Update on Fetch
   * **Validates: Requirements 5.1, 5.3**
   * 
   * For any successful menu items fetch, the items SHALL be stored 
   * in both memory cache and local storage cache.
   */
  describe('Property 13: Cache Update on Fetch', () => {
    test('cached items are stored in both memory and localStorage', () => {
      fc.assert(
        fc.property(
          arbitraryMenuItems(),
          (items) => {
            // Set cached items
            const success = cache.setCachedItems(items);

            // Should succeed
            expect(success).toBe(true);

            // Should be in memory cache
            const memoryCached = cache.memoryCache.items;
            expect(memoryCached).not.toBeNull();
            expect(memoryCached.length).toBe(Math.min(items.length, cache.config.maxCacheSize));

            // Should be in localStorage
            const localStorageKey = cache.config.localStorageKey;
            const stored = localStorage.getItem(localStorageKey);
            expect(stored).not.toBeNull();

            const parsed = JSON.parse(stored);
            expect(parsed.items).toBeDefined();
            expect(parsed.items.length).toBe(Math.min(items.length, cache.config.maxCacheSize));
            expect(parsed.timestamp).toBeDefined();
            expect(parsed.version).toBe(cache.config.cacheVersion);

            // Retrieved items should match stored items
            const retrieved = cache.getCachedItems();
            expect(retrieved).not.toBeNull();
            expect(retrieved.length).toBe(Math.min(items.length, cache.config.maxCacheSize));
          }
        ),
        { numRuns: 100 }
      );
    });

    test('cache retrieval prioritizes memory over localStorage', () => {
      fc.assert(
        fc.property(
          arbitraryMenuItems(),
          arbitraryMenuItems(),
          (memoryItems, localStorageItems) => {
            // Assume different items in memory vs localStorage
            if (memoryItems.length === 0 && localStorageItems.length === 0) {
              return true; // Skip empty case
            }

            // Set localStorage cache
            cache.setCachedItems(localStorageItems);

            // Manually set memory cache to different items
            cache.memoryCache = {
              items: memoryItems,
              timestamp: Date.now(),
              version: cache.config.cacheVersion
            };

            // Get cached items should return memory cache
            const retrieved = cache.getCachedItems();
            
            if (memoryItems.length > 0) {
              expect(retrieved).toEqual(memoryItems);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('cache updates preserve all item properties', () => {
      fc.assert(
        fc.property(
          arbitraryMenuItems(),
          (items) => {
            if (items.length === 0) return true;

            cache.setCachedItems(items);
            const retrieved = cache.getCachedItems();

            // Check that all properties are preserved
            const limitedItems = items.slice(0, cache.config.maxCacheSize);
            expect(retrieved.length).toBe(limitedItems.length);

            retrieved.forEach((retrievedItem, index) => {
              const originalItem = limitedItems[index];
              expect(retrievedItem.id).toBe(originalItem.id);
              expect(retrievedItem.name).toBe(originalItem.name);
              expect(retrievedItem.price).toBe(originalItem.price);
              expect(retrievedItem.available).toBe(originalItem.available);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional cache consistency properties
   */
  describe('Cache Consistency Properties', () => {
    test('cache invalidation clears both memory and localStorage', () => {
      fc.assert(
        fc.property(
          arbitraryMenuItems(),
          (items) => {
            if (items.length === 0) return true;

            // Set cache
            cache.setCachedItems(items);
            expect(cache.getCachedItems()).not.toBeNull();

            // Invalidate cache
            cache.invalidateCache();

            // Memory cache should be cleared
            expect(cache.memoryCache.items).toBeNull();

            // localStorage should be cleared
            const stored = localStorage.getItem(cache.config.localStorageKey);
            expect(stored).toBeNull();

            // getCachedItems should return null
            expect(cache.getCachedItems()).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('updateCachedItem maintains cache consistency', () => {
      fc.assert(
        fc.property(
          arbitraryMenuItems(),
          arbitraryMenuItem(),
          (items, updatedItem) => {
            if (items.length === 0) return true;

            // Set initial cache
            cache.setCachedItems(items);

            // Update an existing item or add new one
            const itemToUpdate = items.length > 0 ? 
              { ...updatedItem, id: items[0].id } : 
              updatedItem;

            const success = cache.updateCachedItem(itemToUpdate);
            expect(success).toBe(true);

            // Retrieve and verify
            const retrieved = cache.getCachedItems();
            const found = retrieved.find(item => item.id === itemToUpdate.id);
            expect(found).toBeDefined();
            expect(found.name).toBe(itemToUpdate.name);
            expect(found.price).toBe(itemToUpdate.price);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('removeCachedItem maintains cache consistency', () => {
      fc.assert(
        fc.property(
          arbitraryMenuItems(),
          (items) => {
            if (items.length === 0) return true;

            // Set initial cache
            cache.setCachedItems(items);

            // Remove first item
            const itemToRemove = items[0];
            const success = cache.removeCachedItem(itemToRemove.id);
            expect(success).toBe(true);

            // Retrieve and verify
            const retrieved = cache.getCachedItems();
            const found = retrieved.find(item => item.id === itemToRemove.id);
            expect(found).toBeUndefined();

            // Other items should still be present
            if (items.length > 1) {
              expect(retrieved.length).toBe(Math.min(items.length - 1, cache.config.maxCacheSize));
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('cache respects maximum size limit', () => {
      fc.assert(
        fc.property(
          fc.array(arbitraryMenuItem(), { minLength: 1, maxLength: 2000 }),
          (items) => {
            cache.setCachedItems(items);
            const retrieved = cache.getCachedItems();

            // Should not exceed max cache size
            expect(retrieved.length).toBeLessThanOrEqual(cache.config.maxCacheSize);

            // If items exceed max, should store first maxCacheSize items
            if (items.length > cache.config.maxCacheSize) {
              expect(retrieved.length).toBe(cache.config.maxCacheSize);
            } else {
              expect(retrieved.length).toBe(items.length);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    test('cache staleness detection is accurate', () => {
      fc.assert(
        fc.property(
          arbitraryMenuItems(),
          fc.integer({ min: 0, max: 600000 }), // 0 to 10 minutes
          (items, ageMs) => {
            if (items.length === 0) return true;

            // Set cache with specific timestamp
            const timestamp = Date.now() - ageMs;
            cache.memoryCache = {
              items,
              timestamp,
              version: cache.config.cacheVersion
            };

            const isStale = cache.isCacheStale();
            const expectedStale = ageMs > cache.config.cacheTTL;

            expect(isStale).toBe(expectedStale);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('cache merge preserves server data priority', () => {
      fc.assert(
        fc.property(
          arbitraryMenuItems(),
          arbitraryMenuItems(),
          (cachedItems, serverItems) => {
            if (cachedItems.length === 0 && serverItems.length === 0) {
              return true;
            }

            // Set cached items
            if (cachedItems.length > 0) {
              cache.setCachedItems(cachedItems);
            }

            // Merge with server data
            const merged = cache.mergeCacheWithServerData(serverItems);

            // Merged result should equal server items (server has priority)
            expect(merged).toEqual(serverItems);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Cache error handling properties
   */
  describe('Cache Error Handling', () => {
    test('handles invalid input gracefully', () => {
      fc.assert(
        fc.property(
          fc.anything(),
          (invalidInput) => {
            // Should not throw on invalid input
            expect(() => {
              cache.setCachedItems(invalidInput);
            }).not.toThrow();

            // Should return false for non-array input
            if (!Array.isArray(invalidInput)) {
              const result = cache.setCachedItems(invalidInput);
              expect(result).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('handles missing item IDs gracefully', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string(),
            price: fc.double({ min: 0, max: 1000, noNaN: true })
          }),
          (itemWithoutId) => {
            // Should not throw
            expect(() => {
              cache.updateCachedItem(itemWithoutId);
            }).not.toThrow();

            // Should return false
            const result = cache.updateCachedItem(itemWithoutId);
            expect(result).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Cache metadata properties
   */
  describe('Cache Metadata Properties', () => {
    test('metadata is updated on cache operations', () => {
      fc.assert(
        fc.property(
          arbitraryMenuItems(),
          (items) => {
            if (items.length === 0) return true;

            cache.setCachedItems(items);
            const metadata = cache.getMetadata();

            expect(metadata).not.toBeNull();
            expect(metadata.version).toBe(cache.config.cacheVersion);
            expect(metadata.timestamp).toBeDefined();
            expect(metadata.itemCount).toBe(Math.min(items.length, cache.config.maxCacheSize));
          }
        ),
        { numRuns: 100 }
      );
    });

    test('cache statistics are accurate', () => {
      fc.assert(
        fc.property(
          arbitraryMenuItems(),
          (items) => {
            cache.setCachedItems(items);
            const stats = cache.getStats();

            expect(stats).toBeDefined();
            expect(stats.memoryCacheSize).toBe(Math.min(items.length, cache.config.maxCacheSize));
            expect(stats.memoryCacheAge).toBeGreaterThanOrEqual(0);
            expect(stats.cacheTTL).toBe(cache.config.cacheTTL);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
