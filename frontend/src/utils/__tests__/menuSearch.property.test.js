import * as fc from 'fast-check';
import { filterMenuItems, hasRequiredFields, allItemsHaveRequiredFields } from '../menuSearch';

/**
 * Property-Based Tests for Menu Search Utility Functions
 * 
 * Feature: counter-sale-page
 * Property 7: Menu Search Responsiveness
 * Validates: Requirements 2.1, 2.2
 * 
 * These tests verify that the menu search functionality maintains
 * correctness properties across a wide range of inputs using
 * property-based testing with fast-check library (20 iterations for fast execution).
 */

describe('Menu Search Utility - Property-Based Tests', () => {
  /**
   * Property 7: Menu Search Responsiveness
   * **Validates: Requirements 2.1, 2.2**
   * 
   * Test that search returns results for any query with matches
   * and that results include name, price, and category fields.
   */
  describe('Property 7: Menu Search Responsiveness', () => {
    // Generator for valid menu items
    const menuItemArbitrary = fc.record({
      id: fc.uuid(),
      name: fc.string({ minLength: 3, maxLength: 30 }).filter(s => s.trim().length >= 3),
      category: fc.constantFrom('burgers', 'pizza', 'appetizers', 'salads', 'beverages', 'desserts'),
      price: fc.integer({ min: 1, max: 10000 }),
      description: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined }),
      available: fc.boolean()
    });

    test('filterMenuItems returns empty array for empty or whitespace queries', () => {
      fc.assert(
        fc.property(
          fc.array(menuItemArbitrary, { minLength: 1, maxLength: 20 }),
          fc.oneof(
            fc.constant(''),
            fc.constant('   '),
            fc.constant('\t'),
            fc.constant('\n')
          ),
          (menuItems, query) => {
            const result = filterMenuItems(menuItems, query);
            return result.length === 0;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('filterMenuItems returns items matching query in name', () => {
      fc.assert(
        fc.property(
          fc.array(menuItemArbitrary, { minLength: 1, maxLength: 20 }),
          (menuItems) => {
            if (menuItems.length === 0) return true;

            // Pick first item and search for part of its name
            const targetItem = menuItems[0];
            const query = targetItem.name.substring(0, Math.min(3, targetItem.name.length));

            const results = filterMenuItems(menuItems, query);

            // All results should match the query
            return results.every(item =>
              item.name.toLowerCase().includes(query.toLowerCase()) ||
              item.category.toLowerCase().includes(query.toLowerCase()) ||
              (item.description && item.description.toLowerCase().includes(query.toLowerCase()))
            );
          }
        ),
        { numRuns: 20 }
      );
    });

    test('filterMenuItems returns items matching query in category', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('burgers', 'pizza', 'appetizers', 'salads', 'beverages', 'desserts'),
          fc.array(menuItemArbitrary, { minLength: 5, maxLength: 20 }),
          (searchCategory, menuItems) => {
            const results = filterMenuItems(menuItems, searchCategory);

            // All results should have matching category
            return results.every(item =>
              item.category.toLowerCase().includes(searchCategory.toLowerCase())
            );
          }
        ),
        { numRuns: 20 }
      );
    });

    test('filterMenuItems is case-insensitive', () => {
      fc.assert(
        fc.property(
          fc.array(menuItemArbitrary, { minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 2, maxLength: 10 }).filter(s => s.trim().length >= 2),
          (menuItems, query) => {
            const lowerResults = filterMenuItems(menuItems, query.toLowerCase());
            const upperResults = filterMenuItems(menuItems, query.toUpperCase());
            const mixedResults = filterMenuItems(menuItems, query);

            // All three should return the same results
            return (
              lowerResults.length === upperResults.length &&
              lowerResults.length === mixedResults.length
            );
          }
        ),
        { numRuns: 20 }
      );
    });

    test('filterMenuItems never returns more items than input', () => {
      fc.assert(
        fc.property(
          fc.array(menuItemArbitrary, { minLength: 0, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 20 }),
          (menuItems, query) => {
            const results = filterMenuItems(menuItems, query);
            return results.length <= menuItems.length;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('filterMenuItems returns subset of original array', () => {
      fc.assert(
        fc.property(
          fc.array(menuItemArbitrary, { minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length >= 1),
          (menuItems, query) => {
            const results = filterMenuItems(menuItems, query);

            // Every result should be in the original array
            return results.every(result =>
              menuItems.some(item => item.id === result.id)
            );
          }
        ),
        { numRuns: 20 }
      );
    });

    test('filterMenuItems with guaranteed match returns at least one result', () => {
      fc.assert(
        fc.property(
          fc.array(menuItemArbitrary, { minLength: 1, maxLength: 20 }),
          (menuItems) => {
            if (menuItems.length === 0) return true;

            // Use the exact name of the first item as query
            const query = menuItems[0].name;
            const results = filterMenuItems(menuItems, query);

            // Should return at least the first item
            return results.length >= 1;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('hasRequiredFields validates name, category, and price', () => {
      fc.assert(
        fc.property(
          menuItemArbitrary,
          (item) => {
            const result = hasRequiredFields(item);

            // Should return true for valid items
            return result === true;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('hasRequiredFields rejects items with missing name', () => {
      fc.assert(
        fc.property(
          menuItemArbitrary,
          (item) => {
            const invalidItem = { ...item, name: '' };
            const result = hasRequiredFields(invalidItem);

            return result === false;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('hasRequiredFields rejects items with missing category', () => {
      fc.assert(
        fc.property(
          menuItemArbitrary,
          (item) => {
            const invalidItem = { ...item, category: '' };
            const result = hasRequiredFields(invalidItem);

            return result === false;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('hasRequiredFields rejects items with invalid price', () => {
      fc.assert(
        fc.property(
          menuItemArbitrary,
          (item) => {
            const invalidItem = { ...item, price: NaN };
            const result = hasRequiredFields(invalidItem);

            return result === false;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('allItemsHaveRequiredFields validates entire array', () => {
      fc.assert(
        fc.property(
          fc.array(menuItemArbitrary, { minLength: 1, maxLength: 20 }),
          (items) => {
            const result = allItemsHaveRequiredFields(items);

            // Should return true for valid items
            return result === true;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('allItemsHaveRequiredFields rejects arrays with invalid items', () => {
      fc.assert(
        fc.property(
          fc.array(menuItemArbitrary, { minLength: 2, maxLength: 20 }),
          (items) => {
            // Make one item invalid
            const invalidItems = [...items];
            invalidItems[0] = { ...invalidItems[0], name: '' };

            const result = allItemsHaveRequiredFields(invalidItems);

            return result === false;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('filterMenuItems handles special characters in query', () => {
      fc.assert(
        fc.property(
          fc.array(menuItemArbitrary, { minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 10 }),
          (menuItems, query) => {
            // Should not throw an error
            try {
              const results = filterMenuItems(menuItems, query);
              return Array.isArray(results);
            } catch (error) {
              return false;
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    test('filterMenuItems returns consistent results for same input', () => {
      fc.assert(
        fc.property(
          fc.array(menuItemArbitrary, { minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length >= 1),
          (menuItems, query) => {
            const results1 = filterMenuItems(menuItems, query);
            const results2 = filterMenuItems(menuItems, query);

            // Should return same results
            return results1.length === results2.length &&
              results1.every((item, index) => item.id === results2[index].id);
          }
        ),
        { numRuns: 20 }
      );
    });

    test('filterMenuItems handles undefined and null gracefully', () => {
      fc.assert(
        fc.property(
          fc.array(menuItemArbitrary, { minLength: 1, maxLength: 20 }),
          (menuItems) => {
            const result1 = filterMenuItems(menuItems, null);
            const result2 = filterMenuItems(menuItems, undefined);

            // Should return empty arrays
            return result1.length === 0 && result2.length === 0;
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});

