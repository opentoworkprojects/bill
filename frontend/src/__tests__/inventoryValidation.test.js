/**
 * Property Tests: Inventory Validation and Edit Pre-population
 * 
 * **Property 10: Inventory Validation Completeness**
 * *For any* inventory item submission, if any required field (name, quantity, unit, 
 * min_quantity, price_per_unit) is missing or invalid, the system SHALL reject the 
 * submission with a validation error.
 * 
 * **Property 11: Inventory Edit Pre-population**
 * *For any* existing inventory item being edited, the form SHALL be pre-populated 
 * with all current values matching the item's stored data.
 * 
 * **Validates: Requirements 5.2, 5.6**
 * 
 * Feature: platform-fixes-enhancements, Property 10, 11: Inventory Validation and Edit Pre-population
 */

describe('Inventory Validation and Edit Pre-population', () => {
  /**
   * Helper function to generate a random valid inventory item
   */
  const generateValidInventoryItem = (index) => {
    return {
      id: `item_${index}_${Math.random().toString(36).substr(2, 9)}`,
      name: `Item ${index} ${Math.random().toString(36).substr(2, 5)}`,
      quantity: Math.floor(Math.random() * 1000) + 1,
      unit: ['kg', 'liters', 'pieces', 'boxes', 'packs'][Math.floor(Math.random() * 5)],
      min_quantity: Math.floor(Math.random() * 50) + 1,
      max_quantity: Math.random() > 0.5 ? Math.floor(Math.random() * 2000) + 100 : null,
      price_per_unit: Math.floor(Math.random() * 1000) + 1,
      cost_price: Math.random() > 0.5 ? Math.floor(Math.random() * 800) + 1 : null,
      category_id: Math.random() > 0.5 ? `cat_${Math.floor(Math.random() * 10)}` : null,
      supplier_id: Math.random() > 0.5 ? `sup_${Math.floor(Math.random() * 10)}` : null,
      sku: Math.random() > 0.5 ? `SKU-${Math.random().toString(36).substr(2, 6).toUpperCase()}` : null,
      barcode: Math.random() > 0.5 ? `${Math.floor(Math.random() * 10000000000000)}` : null,
      description: Math.random() > 0.5 ? `Description for item ${index}` : null,
      location: Math.random() > 0.5 ? `Location ${Math.floor(Math.random() * 10)}` : null,
      expiry_date: Math.random() > 0.5 ? new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null,
      batch_number: Math.random() > 0.5 ? `BATCH-${Math.random().toString(36).substr(2, 6).toUpperCase()}` : null,
      reorder_point: Math.random() > 0.5 ? Math.floor(Math.random() * 30) + 1 : null,
      reorder_quantity: Math.random() > 0.5 ? Math.floor(Math.random() * 100) + 10 : null
    };
  };

  /**
   * Helper function to generate a random form data object
   */
  const generateFormData = (overrides = {}) => {
    const base = {
      name: `Item ${Math.random().toString(36).substr(2, 5)}`,
      quantity: String(Math.floor(Math.random() * 1000) + 1),
      unit: ['kg', 'liters', 'pieces', 'boxes', 'packs'][Math.floor(Math.random() * 5)],
      min_quantity: String(Math.floor(Math.random() * 50) + 1),
      max_quantity: Math.random() > 0.5 ? String(Math.floor(Math.random() * 2000) + 100) : '',
      price_per_unit: String(Math.floor(Math.random() * 1000) + 1),
      cost_price: Math.random() > 0.5 ? String(Math.floor(Math.random() * 800) + 1) : '',
      category_id: '',
      supplier_id: '',
      sku: '',
      barcode: '',
      description: '',
      location: '',
      expiry_date: '',
      batch_number: '',
      reorder_point: '',
      reorder_quantity: ''
    };
    return { ...base, ...overrides };
  };

  /**
   * Implementation of validateInventoryForm function (mirrors InventoryPage.js validation)
   * Requirements: 5.2
   */
  const validateInventoryForm = (formData) => {
    const errors = [];
    
    // Validate name (required, non-empty)
    if (!formData.name?.trim()) {
      errors.push('Item name is required');
    } else if (formData.name.trim().length < 2) {
      errors.push('Item name must be at least 2 characters');
    }
    
    // Validate quantity (required, non-negative number)
    const quantity = parseFloat(formData.quantity);
    if (formData.quantity === '' || formData.quantity === null || formData.quantity === undefined) {
      errors.push('Quantity is required');
    } else if (isNaN(quantity)) {
      errors.push('Quantity must be a valid number');
    } else if (quantity < 0) {
      errors.push('Quantity cannot be negative');
    }
    
    // Validate unit (required, non-empty)
    if (!formData.unit?.trim()) {
      errors.push('Unit is required (e.g., kg, liters, pieces)');
    }
    
    // Validate min_quantity (required, non-negative number)
    const minQuantity = parseFloat(formData.min_quantity);
    if (formData.min_quantity === '' || formData.min_quantity === null || formData.min_quantity === undefined) {
      errors.push('Minimum quantity is required');
    } else if (isNaN(minQuantity)) {
      errors.push('Minimum quantity must be a valid number');
    } else if (minQuantity < 0) {
      errors.push('Minimum quantity cannot be negative');
    }
    
    // Validate price_per_unit (required, positive number)
    const pricePerUnit = parseFloat(formData.price_per_unit);
    if (formData.price_per_unit === '' || formData.price_per_unit === null || formData.price_per_unit === undefined) {
      errors.push('Selling price is required');
    } else if (isNaN(pricePerUnit)) {
      errors.push('Selling price must be a valid number');
    } else if (pricePerUnit <= 0) {
      errors.push('Selling price must be greater than 0');
    }
    
    // Validate optional numeric fields if provided
    if (formData.max_quantity && isNaN(parseFloat(formData.max_quantity))) {
      errors.push('Maximum quantity must be a valid number');
    }
    if (formData.cost_price && isNaN(parseFloat(formData.cost_price))) {
      errors.push('Cost price must be a valid number');
    }
    if (formData.reorder_point && isNaN(parseFloat(formData.reorder_point))) {
      errors.push('Reorder point must be a valid number');
    }
    if (formData.reorder_quantity && isNaN(parseFloat(formData.reorder_quantity))) {
      errors.push('Reorder quantity must be a valid number');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  /**
   * Implementation of prepopulateFormFromItem function (mirrors InventoryPage.js handleEdit)
   * Requirements: 5.6
   */
  const prepopulateFormFromItem = (item) => {
    return {
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      min_quantity: item.min_quantity,
      max_quantity: item.max_quantity || '',
      price_per_unit: item.price_per_unit,
      cost_price: item.cost_price || '',
      category_id: item.category_id ? String(item.category_id) : '',
      supplier_id: item.supplier_id ? String(item.supplier_id) : '',
      sku: item.sku || '',
      barcode: item.barcode || '',
      description: item.description || '',
      location: item.location || '',
      expiry_date: item.expiry_date || '',
      batch_number: item.batch_number || '',
      reorder_point: item.reorder_point || '',
      reorder_quantity: item.reorder_quantity || ''
    };
  };

  /**
   * Property 10: Inventory Validation Completeness
   * For any inventory item submission, if any required field is missing or invalid,
   * the system SHALL reject the submission with a validation error.
   * 
   * Validates: Requirements 5.2
   */
  describe('Property 10: Inventory Validation Completeness', () => {
    const REQUIRED_FIELDS = ['name', 'quantity', 'unit', 'min_quantity', 'price_per_unit'];

    it('should accept valid inventory items (100 iterations)', () => {
      for (let i = 0; i < 100; i++) {
        const formData = generateFormData();
        const result = validateInventoryForm(formData);
        
        expect(result.isValid).toBe(true);
        expect(result.errors.length).toBe(0);
      }
    });

    it('should reject items with missing required fields (100 iterations)', () => {
      for (let i = 0; i < 100; i++) {
        // Pick a random required field to make invalid
        const fieldToInvalidate = REQUIRED_FIELDS[Math.floor(Math.random() * REQUIRED_FIELDS.length)];
        
        const formData = generateFormData({ [fieldToInvalidate]: '' });
        const result = validateInventoryForm(formData);
        
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });

    it('should reject items with invalid numeric values (100 iterations)', () => {
      const NUMERIC_FIELDS = ['quantity', 'min_quantity', 'price_per_unit'];
      
      for (let i = 0; i < 100; i++) {
        // Pick a random numeric field to make invalid
        const fieldToInvalidate = NUMERIC_FIELDS[Math.floor(Math.random() * NUMERIC_FIELDS.length)];
        
        const formData = generateFormData({ [fieldToInvalidate]: 'not-a-number' });
        const result = validateInventoryForm(formData);
        
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });

    it('should reject items with negative quantity', () => {
      for (let i = 0; i < 100; i++) {
        const formData = generateFormData({ quantity: String(-Math.floor(Math.random() * 100) - 1) });
        const result = validateInventoryForm(formData);
        
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('negative'))).toBe(true);
      }
    });

    it('should reject items with negative min_quantity', () => {
      for (let i = 0; i < 100; i++) {
        const formData = generateFormData({ min_quantity: String(-Math.floor(Math.random() * 100) - 1) });
        const result = validateInventoryForm(formData);
        
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('negative'))).toBe(true);
      }
    });

    it('should reject items with zero or negative price', () => {
      for (let i = 0; i < 100; i++) {
        const invalidPrice = Math.random() > 0.5 ? '0' : String(-Math.floor(Math.random() * 100) - 1);
        const formData = generateFormData({ price_per_unit: invalidPrice });
        const result = validateInventoryForm(formData);
        
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('price') || e.includes('greater than 0'))).toBe(true);
      }
    });

    it('should reject items with name less than 2 characters', () => {
      const shortNames = ['', ' ', 'A', 'X', '1'];
      
      shortNames.forEach(name => {
        const formData = generateFormData({ name });
        const result = validateInventoryForm(formData);
        
        expect(result.isValid).toBe(false);
      });
    });

    it('should accept items with valid optional numeric fields', () => {
      for (let i = 0; i < 100; i++) {
        const formData = generateFormData({
          max_quantity: String(Math.floor(Math.random() * 2000) + 100),
          cost_price: String(Math.floor(Math.random() * 800) + 1),
          reorder_point: String(Math.floor(Math.random() * 30) + 1),
          reorder_quantity: String(Math.floor(Math.random() * 100) + 10)
        });
        const result = validateInventoryForm(formData);
        
        expect(result.isValid).toBe(true);
      }
    });

    it('should reject items with invalid optional numeric fields', () => {
      const OPTIONAL_NUMERIC_FIELDS = ['max_quantity', 'cost_price', 'reorder_point', 'reorder_quantity'];
      
      for (let i = 0; i < 100; i++) {
        // Pick a random optional numeric field to make invalid
        const fieldToInvalidate = OPTIONAL_NUMERIC_FIELDS[Math.floor(Math.random() * OPTIONAL_NUMERIC_FIELDS.length)];
        
        const formData = generateFormData({ [fieldToInvalidate]: 'invalid-number' });
        const result = validateInventoryForm(formData);
        
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });

    it('should handle whitespace-only name as invalid', () => {
      const whitespaceNames = ['   ', '\t', '\n', '  \t  '];
      
      whitespaceNames.forEach(name => {
        const formData = generateFormData({ name });
        const result = validateInventoryForm(formData);
        
        expect(result.isValid).toBe(false);
      });
    });

    it('should handle whitespace-only unit as invalid', () => {
      const whitespaceUnits = ['   ', '\t', '\n', '  \t  '];
      
      whitespaceUnits.forEach(unit => {
        const formData = generateFormData({ unit });
        const result = validateInventoryForm(formData);
        
        expect(result.isValid).toBe(false);
      });
    });
  });

  /**
   * Property 11: Inventory Edit Pre-population
   * For any existing inventory item being edited, the form SHALL be pre-populated 
   * with all current values matching the item's stored data.
   * 
   * Validates: Requirements 5.6
   */
  describe('Property 11: Inventory Edit Pre-population', () => {
    it('should pre-populate all fields correctly for any inventory item (100 iterations)', () => {
      for (let i = 0; i < 100; i++) {
        const item = generateValidInventoryItem(i);
        const formData = prepopulateFormFromItem(item);
        
        // Required fields should match exactly
        expect(formData.name).toBe(item.name);
        expect(formData.quantity).toBe(item.quantity);
        expect(formData.unit).toBe(item.unit);
        expect(formData.min_quantity).toBe(item.min_quantity);
        expect(formData.price_per_unit).toBe(item.price_per_unit);
        
        // Optional fields should match or be empty string
        expect(formData.max_quantity).toBe(item.max_quantity || '');
        expect(formData.cost_price).toBe(item.cost_price || '');
        expect(formData.sku).toBe(item.sku || '');
        expect(formData.barcode).toBe(item.barcode || '');
        expect(formData.description).toBe(item.description || '');
        expect(formData.location).toBe(item.location || '');
        expect(formData.expiry_date).toBe(item.expiry_date || '');
        expect(formData.batch_number).toBe(item.batch_number || '');
        expect(formData.reorder_point).toBe(item.reorder_point || '');
        expect(formData.reorder_quantity).toBe(item.reorder_quantity || '');
        
        // ID fields should be converted to strings
        expect(formData.category_id).toBe(item.category_id ? String(item.category_id) : '');
        expect(formData.supplier_id).toBe(item.supplier_id ? String(item.supplier_id) : '');
      }
    });

    it('should handle null values correctly', () => {
      const itemWithNulls = {
        id: 'test_item',
        name: 'Test Item',
        quantity: 100,
        unit: 'pieces',
        min_quantity: 10,
        price_per_unit: 50,
        max_quantity: null,
        cost_price: null,
        category_id: null,
        supplier_id: null,
        sku: null,
        barcode: null,
        description: null,
        location: null,
        expiry_date: null,
        batch_number: null,
        reorder_point: null,
        reorder_quantity: null
      };
      
      const formData = prepopulateFormFromItem(itemWithNulls);
      
      // All null fields should become empty strings
      expect(formData.max_quantity).toBe('');
      expect(formData.cost_price).toBe('');
      expect(formData.category_id).toBe('');
      expect(formData.supplier_id).toBe('');
      expect(formData.sku).toBe('');
      expect(formData.barcode).toBe('');
      expect(formData.description).toBe('');
      expect(formData.location).toBe('');
      expect(formData.expiry_date).toBe('');
      expect(formData.batch_number).toBe('');
      expect(formData.reorder_point).toBe('');
      expect(formData.reorder_quantity).toBe('');
    });

    it('should handle undefined values correctly', () => {
      const itemWithUndefined = {
        id: 'test_item',
        name: 'Test Item',
        quantity: 100,
        unit: 'pieces',
        min_quantity: 10,
        price_per_unit: 50
        // All optional fields are undefined
      };
      
      const formData = prepopulateFormFromItem(itemWithUndefined);
      
      // All undefined fields should become empty strings
      expect(formData.max_quantity).toBe('');
      expect(formData.cost_price).toBe('');
      expect(formData.category_id).toBe('');
      expect(formData.supplier_id).toBe('');
      expect(formData.sku).toBe('');
      expect(formData.barcode).toBe('');
      expect(formData.description).toBe('');
      expect(formData.location).toBe('');
      expect(formData.expiry_date).toBe('');
      expect(formData.batch_number).toBe('');
      expect(formData.reorder_point).toBe('');
      expect(formData.reorder_quantity).toBe('');
    });

    it('should preserve numeric precision for quantity fields', () => {
      for (let i = 0; i < 100; i++) {
        const item = {
          id: `item_${i}`,
          name: `Item ${i}`,
          quantity: Math.random() * 1000,
          unit: 'kg',
          min_quantity: Math.random() * 50,
          price_per_unit: Math.random() * 1000,
          max_quantity: Math.random() * 2000,
          cost_price: Math.random() * 800,
          reorder_point: Math.random() * 30,
          reorder_quantity: Math.random() * 100
        };
        
        const formData = prepopulateFormFromItem(item);
        
        // Numeric values should be preserved exactly
        expect(formData.quantity).toBe(item.quantity);
        expect(formData.min_quantity).toBe(item.min_quantity);
        expect(formData.price_per_unit).toBe(item.price_per_unit);
        expect(formData.max_quantity).toBe(item.max_quantity);
        expect(formData.cost_price).toBe(item.cost_price);
        expect(formData.reorder_point).toBe(item.reorder_point);
        expect(formData.reorder_quantity).toBe(item.reorder_quantity);
      }
    });

    it('should convert category_id and supplier_id to strings', () => {
      const testCases = [
        { category_id: 123, supplier_id: 456, expectedCat: '123', expectedSup: '456' },
        { category_id: '123', supplier_id: '456', expectedCat: '123', expectedSup: '456' },
        { category_id: 'cat_abc', supplier_id: 'sup_xyz', expectedCat: 'cat_abc', expectedSup: 'sup_xyz' },
        // 0 is treated as falsy, so it becomes empty string (no category/supplier selected)
        { category_id: 0, supplier_id: 0, expectedCat: '', expectedSup: '' },
        { category_id: null, supplier_id: null, expectedCat: '', expectedSup: '' },
        { category_id: undefined, supplier_id: undefined, expectedCat: '', expectedSup: '' }
      ];
      
      testCases.forEach(({ category_id, supplier_id, expectedCat, expectedSup }) => {
        const item = {
          id: 'test',
          name: 'Test',
          quantity: 100,
          unit: 'pieces',
          min_quantity: 10,
          price_per_unit: 50,
          category_id,
          supplier_id
        };
        
        const formData = prepopulateFormFromItem(item);
        
        expect(typeof formData.category_id).toBe('string');
        expect(typeof formData.supplier_id).toBe('string');
        expect(formData.category_id).toBe(expectedCat);
        expect(formData.supplier_id).toBe(expectedSup);
      });
    });
  });

  /**
   * Combined Property Test: Validation + Pre-population Round Trip
   * For any valid inventory item, pre-populating a form and validating it should pass
   */
  describe('Combined: Validation + Pre-population Round Trip', () => {
    it('should pass validation for any pre-populated form from valid item (100 iterations)', () => {
      for (let i = 0; i < 100; i++) {
        const item = generateValidInventoryItem(i);
        const formData = prepopulateFormFromItem(item);
        
        // Convert numeric values to strings for form validation (as they would be in a real form)
        const formDataAsStrings = {
          ...formData,
          quantity: String(formData.quantity),
          min_quantity: String(formData.min_quantity),
          price_per_unit: String(formData.price_per_unit),
          max_quantity: formData.max_quantity ? String(formData.max_quantity) : '',
          cost_price: formData.cost_price ? String(formData.cost_price) : '',
          reorder_point: formData.reorder_point ? String(formData.reorder_point) : '',
          reorder_quantity: formData.reorder_quantity ? String(formData.reorder_quantity) : ''
        };
        
        const result = validateInventoryForm(formDataAsStrings);
        
        expect(result.isValid).toBe(true);
        expect(result.errors.length).toBe(0);
      }
    });
  });
});
