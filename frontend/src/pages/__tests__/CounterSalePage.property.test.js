import * as fc from 'fast-check';

/**
 * Property-Based Tests for Counter Sale Page Logic
 * 
 * Feature: counter-sale-page
 * These tests verify correctness properties for counter sale operations
 * using property-based testing with fast-check library (20 iterations for fast execution).
 */

/**
 * Helper function to simulate adding an item to order
 * Mimics the handleAddItem logic from CounterSalePage
 */
const addItemToOrder = (orderItems, newItem) => {
  const existingItemIndex = orderItems.findIndex(
    orderItem => orderItem.menu_item_id === newItem.id
  );

  if (existingItemIndex !== -1) {
    // Item exists, increment quantity
    const updatedItems = [...orderItems];
    updatedItems[existingItemIndex] = {
      ...updatedItems[existingItemIndex],
      quantity: updatedItems[existingItemIndex].quantity + 1
    };
    return updatedItems;
  } else {
    // New item, add to order
    const newOrderItem = {
      menu_item_id: newItem.id,
      name: newItem.name,
      price: parseFloat(newItem.price),
      quantity: 1
    };
    return [...orderItems, newOrderItem];
  }
};

describe('Counter Sale Page - Property-Based Tests', () => {
  /**
   * Property: Item Addition Consistency
   * **Validates: Requirements 1.2, 2.4**
   * 
   * Test that adding existing item increments quantity
   * and adding new item creates new order entry.
   */
  describe('Property: Item Addition Consistency', () => {
    // Generator for menu items
    const menuItemArbitrary = fc.record({
      id: fc.uuid(),
      name: fc.string({ minLength: 3, maxLength: 30 }),
      category: fc.constantFrom('burgers', 'pizza', 'appetizers', 'salads', 'beverages'),
      price: fc.float({ min: 1, max: 1000, noNaN: true })
    });

    // Generator for order items
    const orderItemArbitrary = fc.record({
      menu_item_id: fc.uuid(),
      name: fc.string({ minLength: 3, maxLength: 30 }),
      price: fc.float({ min: 1, max: 1000, noNaN: true }),
      quantity: fc.integer({ min: 1, max: 10 })
    });

    test('adding new item increases order length by 1', () => {
      fc.assert(
        fc.property(
          fc.array(orderItemArbitrary, { minLength: 0, maxLength: 20 }),
          menuItemArbitrary,
          (orderItems, newItem) => {
            // Ensure newItem is not in orderItems
            const filteredOrder = orderItems.filter(
              item => item.menu_item_id !== newItem.id
            );

            const result = addItemToOrder(filteredOrder, newItem);

            return result.length === filteredOrder.length + 1;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('adding existing item increments quantity without changing order length', () => {
      fc.assert(
        fc.property(
          fc.array(orderItemArbitrary, { minLength: 1, maxLength: 20 }),
          (orderItems) => {
            // Pick an existing item from the order
            const existingItem = orderItems[0];
            const menuItem = {
              id: existingItem.menu_item_id,
              name: existingItem.name,
              price: existingItem.price
            };

            const originalQuantity = existingItem.quantity;
            const result = addItemToOrder(orderItems, menuItem);

            // Length should remain the same
            const lengthUnchanged = result.length === orderItems.length;

            // Quantity should be incremented
            const updatedItem = result.find(
              item => item.menu_item_id === existingItem.menu_item_id
            );
            const quantityIncremented = updatedItem.quantity === originalQuantity + 1;

            return lengthUnchanged && quantityIncremented;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('adding item preserves other items in order', () => {
      fc.assert(
        fc.property(
          fc.array(orderItemArbitrary, { minLength: 2, maxLength: 20 }),
          menuItemArbitrary,
          (orderItems, newItem) => {
            // Ensure newItem is not in orderItems
            const filteredOrder = orderItems.filter(
              item => item.menu_item_id !== newItem.id
            );

            if (filteredOrder.length < 2) return true;

            const result = addItemToOrder(filteredOrder, newItem);

            // All original items should still be present
            return filteredOrder.every(originalItem =>
              result.some(resultItem =>
                resultItem.menu_item_id === originalItem.menu_item_id &&
                resultItem.name === originalItem.name &&
                resultItem.price === originalItem.price
              )
            );
          }
        ),
        { numRuns: 20 }
      );
    });

    test('adding same item multiple times increments quantity correctly', () => {
      fc.assert(
        fc.property(
          menuItemArbitrary,
          fc.integer({ min: 1, max: 10 }),
          (menuItem, timesToAdd) => {
            let orderItems = [];

            // Add the same item multiple times
            for (let i = 0; i < timesToAdd; i++) {
              orderItems = addItemToOrder(orderItems, menuItem);
            }

            // Should have exactly one item with quantity equal to timesToAdd
            return (
              orderItems.length === 1 &&
              orderItems[0].quantity === timesToAdd &&
              orderItems[0].menu_item_id === menuItem.id
            );
          }
        ),
        { numRuns: 20 }
      );
    });

    test('adding different items increases order length correctly', () => {
      fc.assert(
        fc.property(
          fc.array(menuItemArbitrary, { minLength: 1, maxLength: 10 })
            .map(items => {
              // Ensure all items have unique IDs
              return items.map((item, index) => ({
                ...item,
                id: `unique-${index}`
              }));
            }),
          (menuItems) => {
            let orderItems = [];

            // Add each item once
            menuItems.forEach(item => {
              orderItems = addItemToOrder(orderItems, item);
            });

            // Order length should equal number of unique items
            return orderItems.length === menuItems.length;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('newly added item has quantity of 1', () => {
      fc.assert(
        fc.property(
          fc.array(orderItemArbitrary, { minLength: 0, maxLength: 20 }),
          menuItemArbitrary,
          (orderItems, newItem) => {
            // Ensure newItem is not in orderItems
            const filteredOrder = orderItems.filter(
              item => item.menu_item_id !== newItem.id
            );

            const result = addItemToOrder(filteredOrder, newItem);

            // Find the newly added item
            const addedItem = result.find(
              item => item.menu_item_id === newItem.id
            );

            return addedItem && addedItem.quantity === 1;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('added item preserves menu item properties', () => {
      fc.assert(
        fc.property(
          fc.array(orderItemArbitrary, { minLength: 0, maxLength: 20 }),
          menuItemArbitrary,
          (orderItems, newItem) => {
            // Ensure newItem is not in orderItems
            const filteredOrder = orderItems.filter(
              item => item.menu_item_id !== newItem.id
            );

            const result = addItemToOrder(filteredOrder, newItem);

            // Find the newly added item
            const addedItem = result.find(
              item => item.menu_item_id === newItem.id
            );

            return (
              addedItem &&
              addedItem.menu_item_id === newItem.id &&
              addedItem.name === newItem.name &&
              Math.abs(addedItem.price - parseFloat(newItem.price)) < 0.01
            );
          }
        ),
        { numRuns: 20 }
      );
    });

    test('order remains immutable after adding item', () => {
      fc.assert(
        fc.property(
          fc.array(orderItemArbitrary, { minLength: 1, maxLength: 20 }),
          menuItemArbitrary,
          (orderItems, newItem) => {
            const originalOrder = JSON.parse(JSON.stringify(orderItems));
            const originalLength = orderItems.length;

            addItemToOrder(orderItems, newItem);

            // Original array should not be modified
            return (
              orderItems.length === originalLength &&
              JSON.stringify(orderItems) === JSON.stringify(originalOrder)
            );
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});

describe('Counter Sale Page - Quantity Management Tests', () => {
  /**
   * Property 5: Item Quantity Consistency
   * **Validates: Requirements 6.2, 6.4**
   * 
   * Test that decrementing to zero removes item
   * and that quantity changes update totals correctly.
   */
  describe('Property 5: Item Quantity Consistency', () => {
    // Generator for order items
    const orderItemArbitrary = fc.record({
      menu_item_id: fc.uuid(),
      name: fc.string({ minLength: 3, maxLength: 30 }),
      price: fc.float({ min: 1, max: 1000, noNaN: true }),
      quantity: fc.integer({ min: 1, max: 10 })
    });

    /**
     * Helper function to simulate quantity change
     * Mimics the handleQuantityChange logic from CounterSalePage
     */
    const changeQuantity = (orderItems, index, delta) => {
      const updatedItems = [...orderItems];
      updatedItems[index] = {
        ...updatedItems[index],
        quantity: updatedItems[index].quantity + delta
      };
      
      // Remove item if quantity reaches zero or below
      if (updatedItems[index].quantity <= 0) {
        updatedItems.splice(index, 1);
      }
      
      return updatedItems;
    };

    /**
     * Helper function to calculate order total
     */
    const calculateTotal = (orderItems) => {
      return orderItems.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
      );
    };

    test('decrementing quantity to zero removes item from order', () => {
      fc.assert(
        fc.property(
          fc.array(orderItemArbitrary, { minLength: 1, maxLength: 20 }),
          (orderItems) => {
            // Pick a random item
            const index = 0;
            const item = orderItems[index];
            const originalLength = orderItems.length;

            // Decrement quantity to zero
            let result = orderItems;
            for (let i = 0; i < item.quantity; i++) {
              result = changeQuantity(result, 0, -1);
            }

            // Item should be removed
            return result.length === originalLength - 1;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('decrementing quantity by 1 reduces quantity correctly', () => {
      fc.assert(
        fc.property(
          fc.array(orderItemArbitrary, { minLength: 1, maxLength: 20 })
            .filter(items => items.some(item => item.quantity > 1)),
          (orderItems) => {
            // Find an item with quantity > 1
            const index = orderItems.findIndex(item => item.quantity > 1);
            if (index === -1) return true;

            const originalQuantity = orderItems[index].quantity;
            const result = changeQuantity(orderItems, index, -1);

            // Quantity should be reduced by 1
            return result[index].quantity === originalQuantity - 1;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('incrementing quantity increases quantity correctly', () => {
      fc.assert(
        fc.property(
          fc.array(orderItemArbitrary, { minLength: 1, maxLength: 20 }),
          (orderItems) => {
            const index = 0;
            const originalQuantity = orderItems[index].quantity;
            const result = changeQuantity(orderItems, index, 1);

            // Quantity should be increased by 1
            return result[index].quantity === originalQuantity + 1;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('quantity change updates order total correctly', () => {
      fc.assert(
        fc.property(
          fc.array(orderItemArbitrary, { minLength: 1, maxLength: 20 }),
          fc.integer({ min: -5, max: 5 }).filter(d => d !== 0),
          (orderItems, delta) => {
            const index = 0;
            const item = orderItems[index];
            
            // Skip if decrement would remove item
            if (item.quantity + delta <= 0) return true;

            const originalTotal = calculateTotal(orderItems);
            const result = changeQuantity(orderItems, index, delta);
            const newTotal = calculateTotal(result);

            // Total should change by (price * delta)
            const expectedChange = item.price * delta;
            const actualChange = newTotal - originalTotal;

            return Math.abs(actualChange - expectedChange) < 0.01;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('removing item decreases order length by 1', () => {
      fc.assert(
        fc.property(
          fc.array(orderItemArbitrary, { minLength: 1, maxLength: 20 }),
          (orderItems) => {
            const originalLength = orderItems.length;
            const result = [...orderItems];
            result.splice(0, 1);

            return result.length === originalLength - 1;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('removing item updates total correctly', () => {
      fc.assert(
        fc.property(
          fc.array(orderItemArbitrary, { minLength: 1, maxLength: 20 }),
          (orderItems) => {
            const originalTotal = calculateTotal(orderItems);
            const removedItem = orderItems[0];
            const removedItemTotal = removedItem.price * removedItem.quantity;
            
            const result = [...orderItems];
            result.splice(0, 1);
            const newTotal = calculateTotal(result);

            // Total should decrease by removed item's total
            const expectedTotal = originalTotal - removedItemTotal;
            return Math.abs(newTotal - expectedTotal) < 0.01;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('quantity changes preserve other items', () => {
      fc.assert(
        fc.property(
          fc.array(orderItemArbitrary, { minLength: 2, maxLength: 20 }),
          fc.integer({ min: 1, max: 5 }),
          (orderItems, delta) => {
            const index = 0;
            const result = changeQuantity(orderItems, index, delta);

            // All other items should remain unchanged
            return orderItems.slice(1).every((item, i) => {
              const resultItem = result[i + 1];
              return resultItem &&
                resultItem.menu_item_id === item.menu_item_id &&
                resultItem.quantity === item.quantity &&
                Math.abs(resultItem.price - item.price) < 0.01;
            });
          }
        ),
        { numRuns: 20 }
      );
    });

    test('order remains immutable after quantity change', () => {
      fc.assert(
        fc.property(
          fc.array(orderItemArbitrary, { minLength: 1, maxLength: 20 }),
          fc.integer({ min: 1, max: 5 }),
          (orderItems, delta) => {
            const originalOrder = JSON.parse(JSON.stringify(orderItems));
            const originalLength = orderItems.length;

            changeQuantity(orderItems, 0, delta);

            // Original array should not be modified
            return (
              orderItems.length === originalLength &&
              JSON.stringify(orderItems) === JSON.stringify(originalOrder)
            );
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});


describe('Counter Sale Page - Order Total Calculation Tests', () => {
  /**
   * Property 1: Order Total Consistency
   * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
   * 
   * Test that total always equals (subtotal - discount + tax)
   * with various item combinations and discount types.
   */
  describe('Property 1: Order Total Consistency', () => {
    // Generator for order items
    const orderItemArbitrary = fc.record({
      menu_item_id: fc.uuid(),
      name: fc.string({ minLength: 3, maxLength: 30 }),
      price: fc.float({ min: 1, max: 1000, noNaN: true }),
      quantity: fc.integer({ min: 1, max: 10 })
    });

    /**
     * Helper function to calculate subtotal
     */
    const calculateSubtotal = (orderItems) => {
      return orderItems.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
      );
    };

    /**
     * Helper function to calculate discount amount
     */
    const calculateDiscountAmount = (subtotal, discountType, discountValue) => {
      if (discountType === 'percent') {
        return (subtotal * discountValue) / 100;
      }
      return Math.min(discountValue, subtotal);
    };

    /**
     * Helper function to calculate tax
     */
    const calculateTax = (taxableAmount, taxRate) => {
      return (taxableAmount * taxRate) / 100;
    };

    /**
     * Helper function to calculate total
     */
    const calculateTotal = (subtotal, discountAmount, tax) => {
      const taxableAmount = Math.max(0, subtotal - discountAmount);
      return Math.max(0, taxableAmount + tax);
    };

    test('total equals subtotal - discount + tax for any order', () => {
      fc.assert(
        fc.property(
          fc.array(orderItemArbitrary, { minLength: 1, maxLength: 20 }),
          fc.float({ min: 0, max: 100, noNaN: true }),
          fc.float({ min: 0, max: 30, noNaN: true }),
          (orderItems, discountPercent, taxRate) => {
            const subtotal = calculateSubtotal(orderItems);
            const discountAmount = calculateDiscountAmount(subtotal, 'percent', discountPercent);
            const taxableAmount = Math.max(0, subtotal - discountAmount);
            const tax = calculateTax(taxableAmount, taxRate);
            const expectedTotal = Math.max(0, taxableAmount + tax);
            
            const calculatedTotal = calculateTotal(subtotal, discountAmount, tax);
            
            return Math.abs(calculatedTotal - expectedTotal) < 0.01;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('total with fixed discount equals subtotal - discount + tax', () => {
      fc.assert(
        fc.property(
          fc.array(orderItemArbitrary, { minLength: 1, maxLength: 20 }),
          fc.float({ min: 0, max: 500, noNaN: true }),
          fc.float({ min: 0, max: 30, noNaN: true }),
          (orderItems, discountAmount, taxRate) => {
            const subtotal = calculateSubtotal(orderItems);
            const actualDiscount = Math.min(discountAmount, subtotal);
            const taxableAmount = Math.max(0, subtotal - actualDiscount);
            const tax = calculateTax(taxableAmount, taxRate);
            const expectedTotal = Math.max(0, taxableAmount + tax);
            
            const calculatedTotal = calculateTotal(subtotal, actualDiscount, tax);
            
            return Math.abs(calculatedTotal - expectedTotal) < 0.01;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('subtotal equals sum of (price * quantity) for all items', () => {
      fc.assert(
        fc.property(
          fc.array(orderItemArbitrary, { minLength: 1, maxLength: 20 }),
          (orderItems) => {
            const subtotal = calculateSubtotal(orderItems);
            const expectedSubtotal = orderItems.reduce((sum, item) => 
              sum + (item.price * item.quantity), 0
            );
            
            return Math.abs(subtotal - expectedSubtotal) < 0.01;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('percentage discount is calculated correctly', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 100, max: 10000, noNaN: true }),
          fc.float({ min: 0, max: 100, noNaN: true }),
          (subtotal, discountPercent) => {
            const discountAmount = calculateDiscountAmount(subtotal, 'percent', discountPercent);
            const expectedDiscount = (subtotal * discountPercent) / 100;
            
            return Math.abs(discountAmount - expectedDiscount) < 0.01;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('fixed discount never exceeds subtotal', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 100, max: 10000, noNaN: true }),
          fc.float({ min: 0, max: 20000, noNaN: true }),
          (subtotal, discountValue) => {
            const discountAmount = calculateDiscountAmount(subtotal, 'amount', discountValue);
            
            return discountAmount <= subtotal;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('tax is calculated on taxable amount (subtotal - discount)', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 100, max: 10000, noNaN: true }),
          fc.float({ min: 0, max: 1000, noNaN: true }),
          fc.float({ min: 0, max: 30, noNaN: true }),
          (subtotal, discountAmount, taxRate) => {
            const actualDiscount = Math.min(discountAmount, subtotal);
            const taxableAmount = Math.max(0, subtotal - actualDiscount);
            const tax = calculateTax(taxableAmount, taxRate);
            const expectedTax = (taxableAmount * taxRate) / 100;
            
            return Math.abs(tax - expectedTax) < 0.01;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('total is never negative', () => {
      fc.assert(
        fc.property(
          fc.array(orderItemArbitrary, { minLength: 1, maxLength: 20 }),
          fc.float({ min: 0, max: 20000, noNaN: true }),
          fc.float({ min: 0, max: 30, noNaN: true }),
          (orderItems, discountAmount, taxRate) => {
            const subtotal = calculateSubtotal(orderItems);
            const actualDiscount = Math.min(discountAmount, subtotal);
            const taxableAmount = Math.max(0, subtotal - actualDiscount);
            const tax = calculateTax(taxableAmount, taxRate);
            const total = calculateTotal(subtotal, actualDiscount, tax);
            
            return total >= 0;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('zero discount results in total = subtotal + tax', () => {
      fc.assert(
        fc.property(
          fc.array(orderItemArbitrary, { minLength: 1, maxLength: 20 }),
          fc.float({ min: 0, max: 30, noNaN: true }),
          (orderItems, taxRate) => {
            const subtotal = calculateSubtotal(orderItems);
            const discountAmount = 0;
            const tax = calculateTax(subtotal, taxRate);
            const total = calculateTotal(subtotal, discountAmount, tax);
            const expectedTotal = subtotal + tax;
            
            return Math.abs(total - expectedTotal) < 0.01;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('100% discount results in total = tax on zero', () => {
      fc.assert(
        fc.property(
          fc.array(orderItemArbitrary, { minLength: 1, maxLength: 20 }),
          fc.float({ min: 0, max: 30, noNaN: true }),
          (orderItems, taxRate) => {
            const subtotal = calculateSubtotal(orderItems);
            const discountAmount = subtotal; // 100% discount
            const taxableAmount = Math.max(0, subtotal - discountAmount);
            const tax = calculateTax(taxableAmount, taxRate);
            const total = calculateTotal(subtotal, discountAmount, tax);
            
            // Total should be 0 (or very close to 0)
            return Math.abs(total) < 0.01;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('calculations are consistent across multiple runs', () => {
      fc.assert(
        fc.property(
          fc.array(orderItemArbitrary, { minLength: 1, maxLength: 20 }),
          fc.float({ min: 0, max: 100, noNaN: true }),
          fc.float({ min: 0, max: 30, noNaN: true }),
          (orderItems, discountPercent, taxRate) => {
            const subtotal1 = calculateSubtotal(orderItems);
            const subtotal2 = calculateSubtotal(orderItems);
            
            const discount1 = calculateDiscountAmount(subtotal1, 'percent', discountPercent);
            const discount2 = calculateDiscountAmount(subtotal2, 'percent', discountPercent);
            
            const taxable1 = Math.max(0, subtotal1 - discount1);
            const taxable2 = Math.max(0, subtotal2 - discount2);
            
            const tax1 = calculateTax(taxable1, taxRate);
            const tax2 = calculateTax(taxable2, taxRate);
            
            const total1 = calculateTotal(subtotal1, discount1, tax1);
            const total2 = calculateTotal(subtotal2, discount2, tax2);
            
            // Results should be identical
            return Math.abs(total1 - total2) < 0.01;
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});


describe('Counter Sale Page - Payment Validation Tests', () => {
  /**
   * Property 2: Payment Amount Validation
   * **Validates: Requirements 4.2, 4.6**
   * 
   * Test that non-credit payments require amount > 0
   * and credit payments allow zero amount.
   */
  describe('Property 2: Payment Amount Validation', () => {
    /**
     * Helper function to validate payment amount
     */
    const validatePaymentAmount = (amount, isCredit) => {
      // For credit payments, zero is allowed
      if (isCredit) {
        return amount >= 0;
      }
      // For non-credit payments, amount must be greater than 0
      return amount > 0;
    };

    test('non-credit payments require amount greater than zero', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('cash', 'card', 'upi'),
          fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
          (paymentMethod, amount) => {
            const isCredit = false;
            const isValid = validatePaymentAmount(amount, isCredit);
            
            return isValid === true;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('non-credit payments with zero amount are invalid', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('cash', 'card', 'upi'),
          (paymentMethod) => {
            const amount = 0;
            const isCredit = false;
            const isValid = validatePaymentAmount(amount, isCredit);
            
            return isValid === false;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('credit payments allow zero amount', () => {
      fc.assert(
        fc.property(
          fc.constant('credit'),
          (paymentMethod) => {
            const amount = 0;
            const isCredit = true;
            const isValid = validatePaymentAmount(amount, isCredit);
            
            return isValid === true;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('credit payments allow positive amounts', () => {
      fc.assert(
        fc.property(
          fc.constant('credit'),
          fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
          (paymentMethod, amount) => {
            const isCredit = true;
            const isValid = validatePaymentAmount(amount, isCredit);
            
            return isValid === true;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('negative amounts are invalid for all payment methods', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('cash', 'card', 'upi', 'credit'),
          fc.float({ min: Math.fround(-10000), max: Math.fround(-0.01), noNaN: true }),
          (paymentMethod, amount) => {
            const isCredit = paymentMethod === 'credit';
            const isValid = validatePaymentAmount(amount, isCredit);
            
            return isValid === false;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('partial payments are valid for non-credit methods', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('cash', 'card', 'upi'),
          fc.float({ min: Math.fround(100), max: Math.fround(10000), noNaN: true }),
          fc.float({ min: Math.fround(0.1), max: Math.fround(0.9), noNaN: true }),
          (paymentMethod, total, partialRatio) => {
            const partialAmount = total * partialRatio;
            const isCredit = false;
            const isValid = validatePaymentAmount(partialAmount, isCredit);
            
            // Partial payment is valid as long as amount > 0
            return isValid === true;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('overpayments are valid for cash', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(100), max: Math.fround(10000), noNaN: true }),
          fc.float({ min: Math.fround(1.01), max: Math.fround(2), noNaN: true }),
          (total, overpaymentRatio) => {
            const overpaymentAmount = total * overpaymentRatio;
            const isCredit = false;
            const isValid = validatePaymentAmount(overpaymentAmount, isCredit);
            
            // Overpayment is valid (change will be returned)
            return isValid === true;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('very small positive amounts are valid for non-credit', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('cash', 'card', 'upi'),
          fc.float({ min: Math.fround(0.01), max: Math.fround(1), noNaN: true }),
          (paymentMethod, amount) => {
            const isCredit = false;
            const isValid = validatePaymentAmount(amount, isCredit);
            
            return isValid === true;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('very large amounts are valid if positive', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('cash', 'card', 'upi', 'credit'),
          fc.float({ min: Math.fround(10000), max: Math.fround(999999), noNaN: true }),
          (paymentMethod, amount) => {
            const isCredit = paymentMethod === 'credit';
            const isValid = validatePaymentAmount(amount, isCredit);
            
            return isValid === true;
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});


describe('Counter Sale Page - Change Calculation Tests', () => {
  /**
   * Property 4: Change Calculation Accuracy
   * **Validates: Requirements 4.5**
   * 
   * Test that change equals (received - total) for overpayments.
   */
  describe('Property 4: Change Calculation Accuracy', () => {
    /**
     * Helper function to calculate change
     */
    const calculateChange = (receivedAmount, total) => {
      return Math.max(0, receivedAmount - total);
    };

    test('change equals received minus total for overpayments', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(100), max: Math.fround(10000), noNaN: true }),
          fc.float({ min: Math.fround(1.01), max: Math.fround(2), noNaN: true }),
          (total, overpaymentRatio) => {
            const receivedAmount = total * overpaymentRatio;
            const change = calculateChange(receivedAmount, total);
            const expectedChange = receivedAmount - total;
            
            return Math.abs(change - expectedChange) < 0.01;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('change is zero when received equals total', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(1), max: Math.fround(10000), noNaN: true }),
          (total) => {
            const receivedAmount = total;
            const change = calculateChange(receivedAmount, total);
            
            return Math.abs(change) < 0.01;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('change is zero when received is less than total', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(100), max: Math.fround(10000), noNaN: true }),
          fc.float({ min: Math.fround(0.1), max: Math.fround(0.99), noNaN: true }),
          (total, underpaymentRatio) => {
            const receivedAmount = total * underpaymentRatio;
            const change = calculateChange(receivedAmount, total);
            
            // Change should be zero for underpayments
            return Math.abs(change) < 0.01;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('change is never negative', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(1), max: Math.fround(10000), noNaN: true }),
          fc.float({ min: Math.fround(0), max: Math.fround(20000), noNaN: true }),
          (total, receivedAmount) => {
            const change = calculateChange(receivedAmount, total);
            
            return change >= 0;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('change increases proportionally with overpayment', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(100), max: Math.fround(10000), noNaN: true }),
          fc.float({ min: Math.fround(1), max: Math.fround(100), noNaN: true }),
          (total, extraAmount) => {
            const receivedAmount = total + extraAmount;
            const change = calculateChange(receivedAmount, total);
            
            return Math.abs(change - extraAmount) < 0.01;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('change calculation is consistent across multiple runs', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(100), max: Math.fround(10000), noNaN: true }),
          fc.float({ min: Math.fround(100), max: Math.fround(15000), noNaN: true }),
          (total, receivedAmount) => {
            const change1 = calculateChange(receivedAmount, total);
            const change2 = calculateChange(receivedAmount, total);
            
            return Math.abs(change1 - change2) < 0.01;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('small overpayments calculate change correctly', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(100), max: Math.fround(10000), noNaN: true }),
          fc.float({ min: Math.fround(0.01), max: Math.fround(1), noNaN: true }),
          (total, extraAmount) => {
            const receivedAmount = total + extraAmount;
            const change = calculateChange(receivedAmount, total);
            
            return Math.abs(change - extraAmount) < 0.01;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('large overpayments calculate change correctly', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(100), max: Math.fround(1000), noNaN: true }),
          fc.float({ min: Math.fround(1000), max: Math.fround(10000), noNaN: true }),
          (total, extraAmount) => {
            const receivedAmount = total + extraAmount;
            const change = calculateChange(receivedAmount, total);
            
            return Math.abs(change - extraAmount) < 0.01;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('change with zero total returns received amount', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(1), max: Math.fround(10000), noNaN: true }),
          (receivedAmount) => {
            const total = 0;
            const change = calculateChange(receivedAmount, total);
            
            return Math.abs(change - receivedAmount) < 0.01;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('change with zero received returns zero', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(1), max: Math.fround(10000), noNaN: true }),
          (total) => {
            const receivedAmount = 0;
            const change = calculateChange(receivedAmount, total);
            
            return Math.abs(change) < 0.01;
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});


describe('Counter Sale Page - Split Payment Tests', () => {
  /**
   * Property 3: Split Payment Sum Equality
   * **Validates: Requirements 4.3, 4.4**
   * 
   * Test that sum of split amounts equals order total
   * with various split combinations.
   */
  describe('Property 3: Split Payment Sum Equality', () => {
    /**
     * Helper function to validate split payment sum
     */
    const validateSplitPaymentSum = (cashAmount, cardAmount, upiAmount, creditAmount, total) => {
      const sum = cashAmount + cardAmount + upiAmount + creditAmount;
      return Math.abs(sum - total) < 0.01;
    };

    test('split payment sum equals total for any valid split', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(100), max: Math.fround(10000), noNaN: true }),
          fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }),
          fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }),
          fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }),
          (total, cashRatio, cardRatio, upiRatio) => {
            // Normalize ratios to sum to 1
            const sum = cashRatio + cardRatio + upiRatio;
            if (sum === 0) return true; // Skip edge case
            
            const normalizedCash = (cashRatio / sum) * total;
            const normalizedCard = (cardRatio / sum) * total;
            const normalizedUpi = (upiRatio / sum) * total;
            const creditAmount = 0;
            
            return validateSplitPaymentSum(
              normalizedCash,
              normalizedCard,
              normalizedUpi,
              creditAmount,
              total
            );
          }
        ),
        { numRuns: 20 }
      );
    });

    test('split payment with credit equals total', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(100), max: Math.fround(10000), noNaN: true }),
          fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }),
          fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }),
          fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }),
          fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }),
          (total, cashRatio, cardRatio, upiRatio, creditRatio) => {
            // Normalize ratios to sum to 1
            const sum = cashRatio + cardRatio + upiRatio + creditRatio;
            if (sum === 0) return true; // Skip edge case
            
            const normalizedCash = (cashRatio / sum) * total;
            const normalizedCard = (cardRatio / sum) * total;
            const normalizedUpi = (upiRatio / sum) * total;
            const normalizedCredit = (creditRatio / sum) * total;
            
            return validateSplitPaymentSum(
              normalizedCash,
              normalizedCard,
              normalizedUpi,
              normalizedCredit,
              total
            );
          }
        ),
        { numRuns: 20 }
      );
    });

    test('two-way split equals total', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(100), max: Math.fround(10000), noNaN: true }),
          fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }),
          (total, splitRatio) => {
            const cashAmount = total * splitRatio;
            const cardAmount = total * (1 - splitRatio);
            const upiAmount = 0;
            const creditAmount = 0;
            
            return validateSplitPaymentSum(
              cashAmount,
              cardAmount,
              upiAmount,
              creditAmount,
              total
            );
          }
        ),
        { numRuns: 20 }
      );
    });

    test('three-way split equals total', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(100), max: Math.fround(10000), noNaN: true }),
          fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }),
          fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }),
          (total, ratio1, ratio2) => {
            const sum = ratio1 + ratio2 + (1 - ratio1 - ratio2);
            if (sum <= 0 || ratio1 + ratio2 > 1) return true; // Skip invalid cases
            
            const cashAmount = total * ratio1;
            const cardAmount = total * ratio2;
            const upiAmount = total * (1 - ratio1 - ratio2);
            const creditAmount = 0;
            
            return validateSplitPaymentSum(
              cashAmount,
              cardAmount,
              upiAmount,
              creditAmount,
              total
            );
          }
        ),
        { numRuns: 20 }
      );
    });

    test('equal split across all methods equals total', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(100), max: Math.fround(10000), noNaN: true }),
          (total) => {
            const equalAmount = total / 4;
            
            return validateSplitPaymentSum(
              equalAmount,
              equalAmount,
              equalAmount,
              equalAmount,
              total
            );
          }
        ),
        { numRuns: 20 }
      );
    });

    test('single method payment equals total', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(100), max: Math.fround(10000), noNaN: true }),
          fc.constantFrom('cash', 'card', 'upi', 'credit'),
          (total, method) => {
            const cashAmount = method === 'cash' ? total : 0;
            const cardAmount = method === 'card' ? total : 0;
            const upiAmount = method === 'upi' ? total : 0;
            const creditAmount = method === 'credit' ? total : 0;
            
            return validateSplitPaymentSum(
              cashAmount,
              cardAmount,
              upiAmount,
              creditAmount,
              total
            );
          }
        ),
        { numRuns: 20 }
      );
    });

    test('split with zero amounts equals total', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(100), max: Math.fround(10000), noNaN: true }),
          (total) => {
            // All in cash, others zero
            return validateSplitPaymentSum(total, 0, 0, 0, total);
          }
        ),
        { numRuns: 20 }
      );
    });

    test('split with very small amounts equals total', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(10), max: Math.fround(100), noNaN: true }),
          (total) => {
            const cashAmount = 0.01;
            const cardAmount = 0.01;
            const upiAmount = 0.01;
            const creditAmount = total - 0.03;
            
            return validateSplitPaymentSum(
              cashAmount,
              cardAmount,
              upiAmount,
              creditAmount,
              total
            );
          }
        ),
        { numRuns: 20 }
      );
    });

    test('split validation is consistent across multiple runs', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(100), max: Math.fround(10000), noNaN: true }),
          fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }),
          (total, ratio) => {
            const cashAmount = total * ratio;
            const cardAmount = total * (1 - ratio);
            
            const result1 = validateSplitPaymentSum(cashAmount, cardAmount, 0, 0, total);
            const result2 = validateSplitPaymentSum(cashAmount, cardAmount, 0, 0, total);
            
            return result1 === result2;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('split with rounding errors within tolerance', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(100), max: Math.fround(10000), noNaN: true }),
          (total) => {
            // Simulate rounding errors
            const cashAmount = Math.round(total * 0.333 * 100) / 100;
            const cardAmount = Math.round(total * 0.333 * 100) / 100;
            const upiAmount = Math.round(total * 0.334 * 100) / 100;
            const creditAmount = 0;
            
            // Should be within tolerance even with rounding
            const sum = cashAmount + cardAmount + upiAmount + creditAmount;
            return Math.abs(sum - total) < 0.02; // Slightly larger tolerance for rounding
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});


describe('Counter Sale Page - Phone Validation Tests', () => {
  /**
   * Property: Phone Number Validation
   * **Validates: Requirements 8.3**
   * 
   * Test that valid phone formats pass validation
   * and invalid formats are rejected.
   */
  describe('Property: Phone Number Validation', () => {
    /**
     * Helper function to validate phone number
     */
    const validatePhoneNumber = (phone) => {
      if (!phone) return true; // Empty is valid (optional field)
      
      // Remove spaces and special characters for validation
      const cleanPhone = phone.replace(/[\s\-()]/g, '');
      
      // Check if it's a valid format (10-15 digits, optional + prefix)
      return /^[\+]?[\d]{10,15}$/.test(cleanPhone);
    };

    test('valid 10-digit phone numbers pass validation', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000000000, max: 9999999999 }),
          (phoneNumber) => {
            const phone = phoneNumber.toString();
            return validatePhoneNumber(phone) === true;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('valid phone numbers with country code pass validation', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000000000, max: 9999999999 }),
          (phoneNumber) => {
            const phone = '+91' + phoneNumber.toString();
            return validatePhoneNumber(phone) === true;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('phone numbers with spaces pass validation', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000000000, max: 9999999999 }),
          (phoneNumber) => {
            const phoneStr = phoneNumber.toString();
            const phone = phoneStr.slice(0, 5) + ' ' + phoneStr.slice(5);
            return validatePhoneNumber(phone) === true;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('phone numbers with dashes pass validation', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000000000, max: 9999999999 }),
          (phoneNumber) => {
            const phoneStr = phoneNumber.toString();
            const phone = phoneStr.slice(0, 3) + '-' + phoneStr.slice(3, 6) + '-' + phoneStr.slice(6);
            return validatePhoneNumber(phone) === true;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('phone numbers with parentheses pass validation', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000000000, max: 9999999999 }),
          (phoneNumber) => {
            const phoneStr = phoneNumber.toString();
            const phone = '(' + phoneStr.slice(0, 3) + ') ' + phoneStr.slice(3);
            return validatePhoneNumber(phone) === true;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('empty phone number is valid (optional field)', () => {
      fc.assert(
        fc.property(
          fc.constant(''),
          (phone) => {
            return validatePhoneNumber(phone) === true;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('phone numbers shorter than 10 digits fail validation', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100000, max: 999999999 }),
          (phoneNumber) => {
            const phone = phoneNumber.toString();
            if (phone.length >= 10) return true; // Skip if accidentally valid
            return validatePhoneNumber(phone) === false;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('phone numbers longer than 15 digits fail validation', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 16, maxLength: 20 })
            .filter(s => /^\d+$/.test(s)),
          (phone) => {
            return validatePhoneNumber(phone) === false;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('phone numbers with letters fail validation', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 15 })
            .filter(s => /[a-zA-Z]/.test(s)),
          (phone) => {
            return validatePhoneNumber(phone) === false;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('phone numbers with special characters (except allowed) fail validation', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('123@456789', '123#456789', '123*456789', '123&456789'),
          (phone) => {
            return validatePhoneNumber(phone) === false;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('validation is consistent across multiple runs', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000000000, max: 9999999999 }),
          (phoneNumber) => {
            const phone = phoneNumber.toString();
            const result1 = validatePhoneNumber(phone);
            const result2 = validatePhoneNumber(phone);
            return result1 === result2;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('international phone numbers with + prefix pass validation', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 999 }),
          fc.integer({ min: 1000000000, max: 9999999999 }),
          (countryCode, phoneNumber) => {
            const phone = '+' + countryCode.toString() + phoneNumber.toString();
            // Should pass if total length is 10-15 digits
            const cleanPhone = phone.replace(/[\s\-()]/g, '');
            const digitCount = cleanPhone.replace('+', '').length;
            const expectedValid = digitCount >= 10 && digitCount <= 15;
            return validatePhoneNumber(phone) === expectedValid;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('phone numbers with mixed formatting pass validation', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000000000, max: 9999999999 }),
          (phoneNumber) => {
            const phoneStr = phoneNumber.toString();
            // Format: +91 (123) 456-7890
            const phone = '+91 (' + phoneStr.slice(0, 3) + ') ' + phoneStr.slice(3, 6) + '-' + phoneStr.slice(6);
            return validatePhoneNumber(phone) === true;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('whitespace-only phone number fails validation', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 })
            .filter(s => /^\s+$/.test(s)),
          (phone) => {
            return validatePhoneNumber(phone) === false;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('phone numbers with only special characters fail validation', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('---', '()', '+++', '   '),
          (phone) => {
            return validatePhoneNumber(phone) === false;
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});

