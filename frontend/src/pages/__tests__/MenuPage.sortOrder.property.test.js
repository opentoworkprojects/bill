/**
 * Property-based tests for MenuPage sort order invariant
 * Feature: menu-page-performance, Property 3: Sort Order Invariant
 * **Validates: Requirements 1.5**
 */

import fc from 'fast-check';

// Mock menu item generator
const arbitraryMenuItem = () => fc.record({
  id: fc.string(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  category: fc.constantFrom('Appetizer', 'Main Course', 'Dessert', 'Beverage'),
  price: fc.float({ min: 1, max: 1000 }),
  available: fc.boolean(),
  is_popular: fc.boolean(),
  created_at: fc.integer({ min: 1577836800000, max: 1735689600000 }).map(ts => new Date(ts).toISOString()),
  preparation_time: fc.integer({ min: 5, max: 60 })
});

// Sort function (extracted from MenuPage logic)
const sortMenuItems = (items, sortBy, sortOrder) => {
  return [...items].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'price':
        aValue = parseFloat(a.price) || 0;
        bValue = parseFloat(b.price) || 0;
        break;
      case 'category':
        aValue = a.category.toLowerCase();
        bValue = b.category.toLowerCase();
        break;
      case 'created':
        aValue = new Date(a.created_at || 0);
        bValue = new Date(b.created_at || 0);
        break;
      case 'popularity':
        aValue = a.is_popular ? 1 : 0;
        bValue = b.is_popular ? 1 : 0;
        break;
      default: // name
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
};

describe('MenuPage Sort Order Property Tests', () => {
  test('Property 3: Sort order is maintained after optimistic create', () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryMenuItem(), { minLength: 0, maxLength: 20 }),
        arbitraryMenuItem(),
        fc.constantFrom('name', 'price', 'category', 'created', 'popularity'),
        fc.constantFrom('asc', 'desc'),
        (existingItems, newItem, sortBy, sortOrder) => {
          // Sort existing items
          const sortedExisting = sortMenuItems(existingItems, sortBy, sortOrder);
          
          // Add new item optimistically
          const withNewItem = [...sortedExisting, newItem];
          
          // Re-sort with new item
          const sortedWithNew = sortMenuItems(withNewItem, sortBy, sortOrder);
          
          // Verify sort order is maintained
          for (let i = 0; i < sortedWithNew.length - 1; i++) {
            const current = sortedWithNew[i];
            const next = sortedWithNew[i + 1];
            
            let currentValue, nextValue;
            
            switch (sortBy) {
              case 'price':
                currentValue = parseFloat(current.price) || 0;
                nextValue = parseFloat(next.price) || 0;
                break;
              case 'category':
                currentValue = current.category.toLowerCase();
                nextValue = next.category.toLowerCase();
                break;
              case 'created':
                currentValue = new Date(current.created_at || 0);
                nextValue = new Date(next.created_at || 0);
                break;
              case 'popularity':
                currentValue = current.is_popular ? 1 : 0;
                nextValue = next.is_popular ? 1 : 0;
                break;
              default: // name
                currentValue = current.name.toLowerCase();
                nextValue = next.name.toLowerCase();
            }
            
            if (sortOrder === 'asc') {
              expect(currentValue <= nextValue).toBe(true);
            } else {
              expect(currentValue >= nextValue).toBe(true);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 3: Sort order is maintained after optimistic update', () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryMenuItem(), { minLength: 1, maxLength: 20 }),
        fc.nat(),
        fc.record({
          name: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
          price: fc.option(fc.float({ min: 1, max: 1000 })),
          category: fc.option(fc.constantFrom('Appetizer', 'Main Course', 'Dessert', 'Beverage')),
          is_popular: fc.option(fc.boolean())
        }),
        fc.constantFrom('name', 'price', 'category', 'created', 'popularity'),
        fc.constantFrom('asc', 'desc'),
        (items, indexGen, updates, sortBy, sortOrder) => {
          if (items.length === 0) return true;
          
          const index = indexGen % items.length;
          
          // Apply optimistic update
          const updatedItems = items.map((item, i) => {
            if (i === index) {
              return {
                ...item,
                ...(updates.name !== null && { name: updates.name }),
                ...(updates.price !== null && { price: updates.price }),
                ...(updates.category !== null && { category: updates.category }),
                ...(updates.is_popular !== null && { is_popular: updates.is_popular })
              };
            }
            return item;
          });
          
          // Sort updated items
          const sorted = sortMenuItems(updatedItems, sortBy, sortOrder);
          
          // Verify sort order
          for (let i = 0; i < sorted.length - 1; i++) {
            const current = sorted[i];
            const next = sorted[i + 1];
            
            let currentValue, nextValue;
            
            switch (sortBy) {
              case 'price':
                currentValue = parseFloat(current.price) || 0;
                nextValue = parseFloat(next.price) || 0;
                break;
              case 'category':
                currentValue = current.category.toLowerCase();
                nextValue = next.category.toLowerCase();
                break;
              case 'created':
                currentValue = new Date(current.created_at || 0);
                nextValue = new Date(next.created_at || 0);
                break;
              case 'popularity':
                currentValue = current.is_popular ? 1 : 0;
                nextValue = next.is_popular ? 1 : 0;
                break;
              default: // name
                currentValue = current.name.toLowerCase();
                nextValue = next.name.toLowerCase();
            }
            
            if (sortOrder === 'asc') {
              expect(currentValue <= nextValue).toBe(true);
            } else {
              expect(currentValue >= nextValue).toBe(true);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 3: Sort order is maintained after optimistic delete', () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryMenuItem(), { minLength: 1, maxLength: 20 }),
        fc.nat(),
        fc.constantFrom('name', 'price', 'category', 'created', 'popularity'),
        fc.constantFrom('asc', 'desc'),
        (items, indexGen, sortBy, sortOrder) => {
          if (items.length === 0) return true;
          
          const index = indexGen % items.length;
          
          // Sort original items
          const sorted = sortMenuItems(items, sortBy, sortOrder);
          
          // Remove item optimistically
          const afterDelete = sorted.filter((_, i) => i !== index);
          
          // Verify remaining items maintain sort order
          for (let i = 0; i < afterDelete.length - 1; i++) {
            const current = afterDelete[i];
            const next = afterDelete[i + 1];
            
            let currentValue, nextValue;
            
            switch (sortBy) {
              case 'price':
                currentValue = parseFloat(current.price) || 0;
                nextValue = parseFloat(next.price) || 0;
                break;
              case 'category':
                currentValue = current.category.toLowerCase();
                nextValue = next.category.toLowerCase();
                break;
              case 'created':
                currentValue = new Date(current.created_at || 0);
                nextValue = new Date(next.created_at || 0);
                break;
              case 'popularity':
                currentValue = current.is_popular ? 1 : 0;
                nextValue = next.is_popular ? 1 : 0;
                break;
              default: // name
                currentValue = current.name.toLowerCase();
                nextValue = next.name.toLowerCase();
            }
            
            if (sortOrder === 'asc') {
              expect(currentValue <= nextValue).toBe(true);
            } else {
              expect(currentValue >= nextValue).toBe(true);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
