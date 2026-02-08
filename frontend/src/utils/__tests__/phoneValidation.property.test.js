import fc from 'fast-check';

/**
 * Property-Based Tests for Phone Number Validation
 * Feature: counter-sale-page
 * Property: Phone Number Validation
 * Validates: Requirements 8.3
 */

// Phone validation function (extracted from CounterSalePage)
const validatePhoneNumber = (phone) => {
  if (!phone) return ''; // Empty is valid (optional field)
  
  // Remove spaces and special characters for validation
  const cleanPhone = phone.replace(/[\s\-()]/g, '');
  
  // Check if it's a valid format
  if (!/^[\+]?[\d]{10,15}$/.test(cleanPhone)) {
    return 'Phone number must be 10-15 digits';
  }
  
  return '';
};

describe('Phone Number Validation - Property Tests', () => {
  /**
   * Property: Valid phone formats should pass validation
   * Validates: Requirements 8.3
   */
  test('valid phone numbers (10-15 digits) should pass validation', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 15 }).chain(length =>
          fc.tuple(
            fc.constant(length),
            fc.array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'), { minLength: length, maxLength: length }).map(arr => arr.join(''))
          )
        ),
        ([length, digits]) => {
          const error = validatePhoneNumber(digits);
          return error === '';
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Valid phone numbers with + prefix should pass validation
   * Validates: Requirements 8.3
   */
  test('valid phone numbers with + prefix should pass validation', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 15 }).chain(length =>
          fc.array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'), { minLength: length, maxLength: length }).map(arr => arr.join(''))
        ),
        (digits) => {
          const phoneWithPlus = '+' + digits;
          const error = validatePhoneNumber(phoneWithPlus);
          return error === '';
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Phone numbers with spaces and dashes should pass validation
   * Validates: Requirements 8.3
   */
  test('phone numbers with formatting characters should pass validation', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 15 }).chain(length =>
          fc.array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'), { minLength: length, maxLength: length }).map(arr => arr.join(''))
        ),
        (digits) => {
          // Add some formatting characters
          const formatted = digits.slice(0, 3) + ' ' + digits.slice(3, 6) + '-' + digits.slice(6);
          const error = validatePhoneNumber(formatted);
          return error === '';
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Empty phone number should pass validation (optional field)
   * Validates: Requirements 8.1, 8.3
   */
  test('empty phone number should pass validation', () => {
    const error = validatePhoneNumber('');
    expect(error).toBe('');
  });

  /**
   * Property: Phone numbers shorter than 10 digits should fail validation
   * Validates: Requirements 8.3
   */
  test('phone numbers shorter than 10 digits should fail validation', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 9 }).chain(length =>
          fc.array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'), { minLength: length, maxLength: length }).map(arr => arr.join(''))
        ),
        (digits) => {
          const error = validatePhoneNumber(digits);
          return error === 'Phone number must be 10-15 digits';
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Phone numbers longer than 15 digits should fail validation
   * Validates: Requirements 8.3
   */
  test('phone numbers longer than 15 digits should fail validation', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 16, max: 25 }).chain(length =>
          fc.array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'), { minLength: length, maxLength: length }).map(arr => arr.join(''))
        ),
        (digits) => {
          const error = validatePhoneNumber(digits);
          return error === 'Phone number must be 10-15 digits';
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Phone numbers with letters should fail validation
   * Validates: Requirements 8.3
   */
  test('phone numbers with letters should fail validation', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 10, maxLength: 15 }).filter(s => /[a-zA-Z]/.test(s)),
        (invalidPhone) => {
          const error = validatePhoneNumber(invalidPhone);
          return error === 'Phone number must be 10-15 digits';
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Phone numbers with special characters (except +, -, space, parentheses) should fail
   * Validates: Requirements 8.3
   */
  test('phone numbers with invalid special characters should fail validation', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 15 }).chain(length =>
          fc.array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'), { minLength: length, maxLength: length }).map(arr => arr.join(''))
        ),
        fc.constantFrom('@', '#', '$', '%', '&', '*', '!', '?'),
        (digits, specialChar) => {
          const invalidPhone = digits.slice(0, 5) + specialChar + digits.slice(5);
          const error = validatePhoneNumber(invalidPhone);
          return error === 'Phone number must be 10-15 digits';
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Validation is consistent for the same input
   * Validates: Requirements 8.3
   */
  test('validation should be consistent for the same input', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 20 }),
        (phone) => {
          const error1 = validatePhoneNumber(phone);
          const error2 = validatePhoneNumber(phone);
          return error1 === error2;
        }
      ),
      { numRuns: 20 }
    );
  });
});
