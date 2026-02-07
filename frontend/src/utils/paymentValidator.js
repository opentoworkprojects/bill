/**
 * Payment Validation Utility
 * Provides comprehensive client-side validation for payment processing
 */

export class PaymentValidator {
  constructor() {
    this.supportedPaymentMethods = ['cash', 'card', 'upi', 'credit', 'split'];
    this.maxAmount = 999999.99; // Maximum payment amount
    this.minAmount = 0; // Minimum payment amount (allow 0 for full credit orders)
  }

  /**
   * Validate payment amount
   * @param {number|string} amount - Payment amount to validate
   * @param {boolean} allowZero - Whether to allow zero amount (for credit orders)
   * @returns {Object} - Validation result with isValid and error message
   */
  validateAmount(amount, allowZero = false) {
    try {
      // Convert to number if string
      const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      
      // Check if it's a valid number
      if (isNaN(numAmount) || !isFinite(numAmount)) {
        return {
          isValid: false,
          error: 'Payment amount must be a valid number'
        };
      }
      
      // Check if negative
      if (numAmount < 0) {
        return {
          isValid: false,
          error: 'Payment amount cannot be negative'
        };
      }
      
      // Check if zero (only allowed for credit orders)
      if (numAmount === 0 && !allowZero) {
        return {
          isValid: false,
          error: `Payment amount must be at least ₹${this.minAmount}`
        };
      }
      
      // Check maximum limit
      if (numAmount > this.maxAmount) {
        return {
          isValid: false,
          error: `Payment amount cannot exceed ₹${this.maxAmount.toLocaleString()}`
        };
      }
      
      // Check for reasonable decimal places (max 2)
      const decimalPlaces = (numAmount.toString().split('.')[1] || '').length;
      if (decimalPlaces > 2) {
        return {
          isValid: false,
          error: 'Payment amount cannot have more than 2 decimal places'
        };
      }
      
      return {
        isValid: true,
        validAmount: numAmount
      };
    } catch (error) {
      return {
        isValid: false,
        error: 'Invalid payment amount format'
      };
    }
  }

  /**
   * Validate payment method
   * @param {string} paymentMethod - Payment method to validate
   * @returns {Object} - Validation result
   */
  validatePaymentMethod(paymentMethod) {
    if (!paymentMethod || typeof paymentMethod !== 'string') {
      return {
        isValid: false,
        error: 'Payment method is required'
      };
    }
    
    const method = paymentMethod.toLowerCase().trim();
    
    if (!this.supportedPaymentMethods.includes(method)) {
      return {
        isValid: false,
        error: `Unsupported payment method. Supported methods: ${this.supportedPaymentMethods.join(', ')}`
      };
    }
    
    return {
      isValid: true,
      validMethod: method
    };
  }

  /**
   * Validate order data completeness
   * @param {Object} orderData - Order data to validate
   * @returns {Object} - Validation result
   */
  validateOrderData(orderData) {
    if (!orderData || typeof orderData !== 'object') {
      return {
        isValid: false,
        error: 'Order data is required'
      };
    }
    
    // Check required fields
    const requiredFields = ['id', 'total', 'items'];
    const missingFields = requiredFields.filter(field => !orderData[field]);
    
    if (missingFields.length > 0) {
      return {
        isValid: false,
        error: `Missing required order fields: ${missingFields.join(', ')}`
      };
    }
    
    // Validate order total
    const totalValidation = this.validateAmount(orderData.total);
    if (!totalValidation.isValid) {
      return {
        isValid: false,
        error: `Invalid order total: ${totalValidation.error}`
      };
    }
    
    // Validate items array
    if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
      return {
        isValid: false,
        error: 'Order must contain at least one item'
      };
    }
    
    // Validate each item
    for (let i = 0; i < orderData.items.length; i++) {
      const item = orderData.items[i];
      
      if (!item.name || typeof item.name !== 'string') {
        return {
          isValid: false,
          error: `Item ${i + 1}: Name is required`
        };
      }
      
      if (!item.quantity || item.quantity <= 0) {
        return {
          isValid: false,
          error: `Item ${i + 1}: Quantity must be greater than 0`
        };
      }
      
      const priceValidation = this.validateAmount(item.price);
      if (!priceValidation.isValid) {
        return {
          isValid: false,
          error: `Item ${i + 1}: ${priceValidation.error}`
        };
      }
    }
    
    return {
      isValid: true
    };
  }

  /**
   * Validate customer information for credit transactions
   * @param {Object} customerInfo - Customer information
   * @param {boolean} isCredit - Whether this is a credit transaction
   * @returns {Object} - Validation result
   */
  validateCustomerInfo(customerInfo, isCredit = false) {
    if (!isCredit) {
      return { isValid: true }; // No validation needed for non-credit transactions
    }
    
    // For credit transactions, customer info is optional but recommended
    // If provided, validate the format
    if (!customerInfo || typeof customerInfo !== 'object') {
      return { isValid: true }; // Allow credit without customer info
    }
    
    // If name is provided, validate it
    if (customerInfo.name && customerInfo.name.trim().length > 0) {
      if (customerInfo.name.trim().length < 2) {
        return {
          isValid: false,
          error: 'Customer name must be at least 2 characters'
        };
      }
    }
    
    // If phone is provided, validate format
    if (customerInfo.phone && customerInfo.phone.trim().length > 0) {
      const phoneRegex = /^[+]?[\d\s\-\(\)]{10,15}$/;
      if (!phoneRegex.test(customerInfo.phone)) {
        return {
          isValid: false,
          error: 'Invalid phone number format'
        };
      }
    }
    
    return {
      isValid: true
    };
  }

  /**
   * Validate split payment amounts
   * @param {Object} splitAmounts - Split payment amounts
   * @param {number} totalAmount - Total order amount
   * @returns {Object} - Validation result
   */
  validateSplitPayment(splitAmounts, totalAmount) {
    if (!splitAmounts || typeof splitAmounts !== 'object') {
      return {
        isValid: false,
        error: 'Split payment amounts are required'
      };
    }
    
    const { cash_amount = 0, card_amount = 0, upi_amount = 0, credit_amount = 0 } = splitAmounts;
    
    // Validate each amount
    const amounts = { cash_amount, card_amount, upi_amount, credit_amount };
    for (const [key, amount] of Object.entries(amounts)) {
      if (amount > 0) {
        const validation = this.validateAmount(amount);
        if (!validation.isValid) {
          return {
            isValid: false,
            error: `Invalid ${key.replace('_', ' ')}: ${validation.error}`
          };
        }
      }
    }
    
    // Check if total split amounts match order total
    const totalSplit = cash_amount + card_amount + upi_amount + credit_amount;
    const totalValidation = this.validateAmount(totalAmount);
    
    if (!totalValidation.isValid) {
      return {
        isValid: false,
        error: `Invalid total amount: ${totalValidation.error}`
      };
    }
    
    const difference = Math.abs(totalSplit - totalValidation.validAmount);
    if (difference > 0.01) { // Allow for small rounding differences
      return {
        isValid: false,
        error: `Split payment total (₹${totalSplit.toFixed(2)}) does not match order total (₹${totalValidation.validAmount.toFixed(2)})`
      };
    }
    
    return {
      isValid: true,
      validAmounts: {
        cash_amount,
        card_amount,
        upi_amount,
        credit_amount,
        total: totalValidation.validAmount
      }
    };
  }

  /**
   * Comprehensive payment validation
   * @param {Object} paymentData - Complete payment data
   * @returns {Object} - Validation result
   */
  validatePayment(paymentData) {
    try {
      const {
        orderData,
        paymentMethod,
        paymentAmount,
        customerInfo,
        splitAmounts
      } = paymentData;
      
      // Validate order data
      const orderValidation = this.validateOrderData(orderData);
      if (!orderValidation.isValid) {
        return orderValidation;
      }
      
      // Validate payment method
      const methodValidation = this.validatePaymentMethod(paymentMethod);
      if (!methodValidation.isValid) {
        return methodValidation;
      }
      
      // Determine if this is a credit transaction (allow zero payment)
      const isCredit = paymentMethod === 'credit' || (splitAmounts && splitAmounts.credit_amount > 0);
      
      // Validate payment amount (allow zero ONLY for credit orders)
      const amountValidation = this.validateAmount(paymentAmount, isCredit);
      if (!amountValidation.isValid) {
        return amountValidation;
      }
      
      // IMPORTANT: For non-credit payments, amount must be greater than 0
      // Partial payments (₹200 on ₹1000 bill) are allowed
      // Overpayments (₹1200 on ₹1000 bill) are allowed (change will be returned)
      if (!isCredit && paymentMethod !== 'split') {
        const payAmount = amountValidation.validAmount;
        
        // Must have some payment for non-credit orders
        if (payAmount <= 0) {
          return {
            isValid: false,
            error: 'Payment amount must be greater than ₹0. Use "Credit" payment method for pay-later orders.'
          };
        }
        
        // Payment can be any positive amount:
        // - Less than total = Partial payment (balance tracked)
        // - Equal to total = Full payment
        // - More than total = Overpayment (change returned)
        // All are valid!
      }
      
      // Validate customer info for credit transactions
      const customerValidation = this.validateCustomerInfo(customerInfo, isCredit);
      if (!customerValidation.isValid) {
        return customerValidation;
      }
      
      // Validate split payment if applicable
      if (paymentMethod === 'split' && splitAmounts) {
        const splitValidation = this.validateSplitPayment(splitAmounts, orderData.total);
        if (!splitValidation.isValid) {
          return splitValidation;
        }
      }
      
      return {
        isValid: true,
        message: 'Payment validation successful'
      };
      
    } catch (error) {
      console.error('Payment validation error:', error);
      return {
        isValid: false,
        error: 'Payment validation failed due to unexpected error'
      };
    }
  }

  /**
   * Get validation error message with user-friendly formatting
   * @param {Object} validationResult - Result from validation function
   * @returns {string} - Formatted error message
   */
  getErrorMessage(validationResult) {
    if (validationResult.isValid) {
      return '';
    }
    
    return validationResult.error || 'Validation failed';
  }
}

// Create singleton instance
export const paymentValidator = new PaymentValidator();

// Export validation functions for direct use
export const validatePaymentAmount = (amount) => paymentValidator.validateAmount(amount);
export const validatePaymentMethod = (method) => paymentValidator.validatePaymentMethod(method);
export const validateOrderData = (orderData) => paymentValidator.validateOrderData(orderData);
export const validateCustomerInfo = (customerInfo, isCredit) => paymentValidator.validateCustomerInfo(customerInfo, isCredit);
export const validateSplitPayment = (splitAmounts, totalAmount) => paymentValidator.validateSplitPayment(splitAmounts, totalAmount);
export const validatePayment = (paymentData) => paymentValidator.validatePayment(paymentData);