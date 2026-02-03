// Shared rules for order workflow filtering, payment handling, and billing completion.
// These helpers keep OrdersPage, EditOrderModal, and BillingPage in sync and testable.

// Status buckets
export const COMPLETED_STATUSES = ['completed', 'cancelled', 'billed', 'settled'];
export const ACTIVE_TAB_EXCLUDE_STATUSES = ['completed', 'cancelled'];

export const normalizeStatus = (status) => (status || '').toString().toLowerCase();

// Active tab helpers
export const isCompletedForActiveFilter = (status) => COMPLETED_STATUSES.includes(normalizeStatus(status));
export const isActiveTabStatus = (status) => !ACTIVE_TAB_EXCLUDE_STATUSES.includes(normalizeStatus(status));
export const filterActiveOrders = (orders = []) => orders.filter((order) => isActiveTabStatus(order?.status));

// Server-side active filter mirrors the OrdersPage fetchOrders logic.
export const isServerActiveOrder = (order, recentPaymentCompletions = new Set()) => {
  if (!order || !order.status) return false;
  if (isCompletedForActiveFilter(order.status)) return false;
  if (recentPaymentCompletions.has(order.id)) return false;
  if (order.payment_received && order.total && order.payment_received >= order.total) return false;
  return true;
};

export const filterServerActiveOrders = (orders = [], recentPaymentCompletions = new Set()) =>
  orders.filter((order) => isServerActiveOrder(order, recentPaymentCompletions));

// Billing completion gating: only the billing flow can complete orders.
export const determineBillingCompletionStatus = ({ waiterName, isCredit }) =>
  waiterName === 'Self-Order' || isCredit ? 'pending' : 'completed';

// Payment math used across edit modal and billing flows.
export const computePaymentState = (total = 0, received = 0) => {
  const paymentReceived = Number.isFinite(received) ? received : 0;
  const safeTotal = Number.isFinite(total) ? total : 0;
  const balance = Math.max(0, safeTotal - paymentReceived);
  return {
    payment_received: paymentReceived,
    balance_amount: balance,
    is_credit: balance > 0
  };
};

// Edit modal payment field builder mirrors handleUpdateOrder logic without touching status.
export const buildEditPaymentFields = ({
  orderPaymentReceived = 0,
  paymentMethod = 'cash',
  useSplitPayment = false,
  paidAmount = 0,
  creditAmount = 0,
  cashAmount = 0,
  cardAmount = 0,
  upiAmount = 0,
  total = 0
}) => {
  const payment_received = useSplitPayment ? paidAmount : orderPaymentReceived;
  const balance_amount = useSplitPayment
    ? creditAmount
    : paymentMethod === 'credit'
      ? total
      : Math.max(0, total - orderPaymentReceived);
  const is_credit = useSplitPayment ? creditAmount > 0 : paymentMethod === 'credit';

  return {
    payment_method: useSplitPayment ? 'split' : paymentMethod,
    is_credit,
    payment_received,
    balance_amount,
    cash_amount: useSplitPayment ? cashAmount : paymentMethod === 'cash' ? total : 0,
    card_amount: useSplitPayment ? cardAmount : paymentMethod === 'card' ? total : 0,
    upi_amount: useSplitPayment ? upiAmount : paymentMethod === 'upi' ? total : 0,
    credit_amount: useSplitPayment ? creditAmount : paymentMethod === 'credit' ? total : 0
  };
};

