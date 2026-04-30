/**
 * Payment validation utility for counter sales and billing
 */

/**
 * Validate payment data before processing
 * @returns {{ isValid: boolean, error: string|null }}
 */
export const validatePayment = ({ orderData, paymentMethod, paymentAmount, customerInfo = {}, splitAmounts = null }) => {
  if (!orderData || !orderData.total) {
    return { isValid: false, error: 'Invalid order data' };
  }

  const total = orderData.total;

  if (paymentMethod === 'credit') {
    // Credit sales are always valid (no payment required upfront)
    return { isValid: true, error: null };
  }

  if (paymentMethod === 'split') {
    if (!splitAmounts) {
      return { isValid: false, error: 'Split payment amounts are required' };
    }
    const { cash_amount = 0, card_amount = 0, upi_amount = 0, credit_amount = 0 } = splitAmounts;
    const splitTotal = (parseFloat(cash_amount) || 0) + (parseFloat(card_amount) || 0) +
                       (parseFloat(upi_amount) || 0) + (parseFloat(credit_amount) || 0);
    if (splitTotal < total - 0.01) {
      return { isValid: false, error: `Split amounts (₹${splitTotal.toFixed(2)}) don't cover total (₹${total.toFixed(2)})` };
    }
    return { isValid: true, error: null };
  }

  // For cash/card/upi — payment amount must be >= total
  const amount = parseFloat(paymentAmount) || 0;
  if (amount < total - 0.01) {
    return { isValid: false, error: `Payment amount (₹${amount.toFixed(2)}) is less than total (₹${total.toFixed(2)})` };
  }

  return { isValid: true, error: null };
};
