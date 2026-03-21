import { API } from '../App';
import { apiWithRetry } from './apiClient';

/**
 * Process payment for a completed order (fire-and-forget friendly).
 * Calls PUT /api/orders/{order_id} with payment and status data.
 *
 * @param {Object} paymentData
 * @param {string} paymentData.order_id
 * @param {string} paymentData.status
 * @param {string} paymentData.payment_method
 * @param {number} paymentData.payment_received
 * @param {number} paymentData.balance_amount
 * @param {boolean} paymentData.is_credit
 * @param {number} [paymentData.discount]
 * @param {number} [paymentData.total]
 * @param {number} [paymentData.subtotal]
 * @param {number} [paymentData.tax]
 * @param {number} [paymentData.tax_rate]
 * @param {string} [paymentData.customer_name]
 * @param {string} [paymentData.customer_phone]
 * @param {Array}  [paymentData.items]
 * @param {number} [paymentData.cash_amount]   - split payments only
 * @param {number} [paymentData.card_amount]   - split payments only
 * @param {number} [paymentData.upi_amount]    - split payments only
 * @param {number} [paymentData.credit_amount] - split payments only
 * @returns {Promise<Object>} response data from the API
 */
export const processPaymentFast = async (paymentData) => {
  const { order_id, ...rest } = paymentData;

  if (!order_id) {
    throw new Error('processPaymentFast: order_id is required');
  }

  const response = await apiWithRetry({
    method: 'put',
    url: `${API}/orders/${order_id}`,
    data: rest,
    timeout: 8000
  });

  return response.data;
};

/**
 * Preload payment data for an order (no-op prefetch — keeps BillingPage import happy).
 * Can be extended to warm a cache if needed.
 *
 * @param {string} orderId
 * @returns {Promise<void>}
 */
export const preloadPaymentData = async (orderId) => {
  if (!orderId) return;
  try {
    await apiWithRetry({
      method: 'get',
      url: `${API}/orders/${orderId}`,
      timeout: 5000
    });
  } catch {
    // Preload is best-effort — ignore failures
  }
};
