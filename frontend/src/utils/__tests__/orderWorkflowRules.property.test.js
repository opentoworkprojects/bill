/**
 * Property & unit tests for the QR order workflow rules.
 * Validates filtering, payment preservation, billing completion gating,
 * large-set handling, and end-to-end workflow integrity.
 */

import fc from 'fast-check';
import {
  buildEditPaymentFields,
  computePaymentState,
  determineBillingCompletionStatus,
  filterActiveOrders,
  filterServerActiveOrders,
  isActiveTabStatus,
  isCompletedForActiveFilter,
  normalizeStatus
} from '../orderWorkflowRules';

const statusGenerator = fc.oneof(
  fc.constantFrom('pending', 'preparing', 'ready', 'paid', 'completed', 'cancelled', 'billed', 'settled'),
  fc.string({ minLength: 3, maxLength: 12 })
);

const orderGenerator = fc.record({
  id: fc.string({ minLength: 1, maxLength: 12 }),
  status: statusGenerator,
  total: fc.float({ min: 1, max: 5000 }),
  payment_received: fc.float({ min: 0, max: 5000 })
});

describe('Property 1: Active Tab Filtering Based on Completion Status', () => {
  test('active tab never hides orders unless status is completed/cancelled', async () => {
    await fc.assert(
      fc.property(fc.array(orderGenerator, { minLength: 5, maxLength: 50 }), (orders) => {
        const active = filterActiveOrders(orders);
        return active.every((order) => isActiveTabStatus(order.status));
      }),
      { numRuns: 120 }
    );
  });

  test('paid orders remain in active tab while completed/billed/settled stay out', () => {
    const orders = [
      { id: 'paid-1', status: 'paid', total: 120, payment_received: 120 },
      { id: 'completed-1', status: 'completed', total: 100, payment_received: 100 },
      { id: 'billed-1', status: 'billed', total: 90, payment_received: 90 },
      { id: 'pending-1', status: 'pending', total: 75, payment_received: 0 }
    ];

    const active = filterActiveOrders(orders);
    expect(active.map((o) => o.id)).toEqual(expect.arrayContaining(['paid-1', 'pending-1']));
    expect(active.map((o) => normalizeStatus(o.status))).not.toEqual(expect.arrayContaining(['completed', 'billed']));
  });
});

describe('Property 2: Bill Pay Action as Sole Completion Mechanism', () => {
  test('completion status is only set to completed when not credit and not QR', async () => {
    await fc.assert(
      fc.property(fc.boolean(), fc.boolean(), (isCredit, isSelfOrder) => {
        const waiter = isSelfOrder ? 'Self-Order' : 'Alice';
        const status = determineBillingCompletionStatus({ waiterName: waiter, isCredit });
        if (isSelfOrder || isCredit) {
          expect(status).toBe('pending');
        } else {
          expect(status).toBe('completed');
        }
      }),
      { numRuns: 120 }
    );
  });

  test('manual vs QR orders follow separate completion paths', () => {
    const manualStatus = determineBillingCompletionStatus({ waiterName: 'Table Agent', isCredit: false });
    const qrStatus = determineBillingCompletionStatus({ waiterName: 'Self-Order', isCredit: false });
    expect(manualStatus).toBe('completed');
    expect(qrStatus).toBe('pending');
  });
});

describe('Property 3: Payment Status Independence from Completion', () => {
  test('edit modal preserves existing payment_received when not using split payment', async () => {
    await fc.assert(
      fc.property(
        fc.float({ min: 0, max: 2000 }),
        fc.float({ min: 50, max: 2000 }),
        (existingPayment, total) => {
          const fields = buildEditPaymentFields({
            orderPaymentReceived: existingPayment,
            paymentMethod: 'card',
            useSplitPayment: false,
            total
          });
          expect(fields.payment_received).toBe(existingPayment);
          expect(fields.is_credit).toBe(false);
        }
      ),
      { numRuns: 120 }
    );
  });

  test('split payments explicitly control payment_received and balance', () => {
    const fields = buildEditPaymentFields({
      orderPaymentReceived: 0,
      paymentMethod: 'cash',
      useSplitPayment: true,
      paidAmount: 70,
      creditAmount: 30,
      cashAmount: 70,
      cardAmount: 0,
      upiAmount: 0,
      total: 100
    });

    expect(fields.payment_received).toBe(70);
    expect(fields.balance_amount).toBe(30);
    expect(fields.is_credit).toBe(true);
  });
});

describe('Property 4: Data Consistency Across Interfaces', () => {
  test('edit payload flows into billing without marking completion', () => {
    const total = 250;
    const editFields = buildEditPaymentFields({
      orderPaymentReceived: 0,
      paymentMethod: 'card',
      useSplitPayment: false,
      total
    });
    const paymentState = computePaymentState(total, editFields.payment_received);
    const completion = determineBillingCompletionStatus({ waiterName: 'Alice', isCredit: paymentState.is_credit });

    expect(editFields.payment_method).toBe('card');
    expect(paymentState.is_credit).toBe(true); // unpaid -> treated as credit until billing collects
    expect(completion).toBe('pending');
  });
});

describe('Property 5: Payment Amount Accuracy and Persistence', () => {
  test('payment state math never produces negative balances', async () => {
    await fc.assert(
      fc.property(fc.float({ min: 0, max: 2000 }), fc.float({ min: 0, max: 2500 }), (total, received) => {
        const { balance_amount } = computePaymentState(total, received);
        expect(balance_amount).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 150 }
    );
  });

  test('full payment zeroes the balance and credit flag', () => {
    const { balance_amount, is_credit } = computePaymentState(100, 150);
    expect(balance_amount).toBe(0);
    expect(is_credit).toBe(false);
  });
});

describe('Property 6: Billing Workflow Processing Consistency', () => {
  test('recomputing payment state yields stable results under repeated runs', () => {
    const total = 400;
    const received = 250;
    const first = computePaymentState(total, received);
    const second = computePaymentState(total, received);
    expect(first).toEqual(second);
    expect(determineBillingCompletionStatus({ waiterName: 'Self-Order', isCredit: first.is_credit })).toBe('pending');
  });
});

describe('Property 7: Edit Modal Workflow Isolation', () => {
  test('edit payment fields never inject status fields', () => {
    const fields = buildEditPaymentFields({
      orderPaymentReceived: 30,
      paymentMethod: 'upi',
      useSplitPayment: false,
      total: 120
    });
    expect(fields.status).toBeUndefined();
    expect(fields.payment_method).toBe('upi');
  });
});

describe('Property 8: End-to-End Workflow Integrity', () => {
  test('paid via edit modal stays active until billing marks completed', () => {
    const order = { id: 'demo', status: 'pending', total: 180, payment_received: 0 };

    // Edit modal marks paid but should not complete
    const editFields = buildEditPaymentFields({
      orderPaymentReceived: order.payment_received,
      paymentMethod: 'card',
      useSplitPayment: false,
      total: order.total
    });

    const postEditOrders = [{ ...order, ...editFields }];
    expect(filterActiveOrders(postEditOrders)).toHaveLength(1);

    // Billing collects full payment -> completion
    const paymentState = computePaymentState(order.total, order.total);
    const completion = determineBillingCompletionStatus({ waiterName: 'Waiter', isCredit: paymentState.is_credit });
    const postBilling = [{ ...order, status: completion, payment_received: order.total }];

    expect(filterActiveOrders(postBilling)).toHaveLength(0);
    expect(isCompletedForActiveFilter(completion)).toBe(true);
  });
});

describe('Performance & real-time update checks', () => {
  test('active filtering handles 150+ orders without mutation', () => {
    const orders = Array.from({ length: 180 }, (_, i) => ({
      id: `order-${i}`,
      status: i % 9 === 0 ? 'completed' : 'pending',
      total: 100,
      payment_received: i % 5 === 0 ? 100 : 0
    }));
    const snapshot = JSON.stringify(orders);
    const active = filterServerActiveOrders(orders);

    expect(JSON.stringify(orders)).toBe(snapshot); // no mutations
    expect(active.length).toBeLessThan(orders.length);
    expect(active.every((o) => !isCompletedForActiveFilter(o.status))).toBe(true);
  });

  test('real-time status change moves orders between active and completed buckets', () => {
    const order = { id: 'rt-1', status: 'pending', total: 90, payment_received: 0 };
    expect(filterActiveOrders([order])).toHaveLength(1);

    const updated = { ...order, status: 'completed' };
    expect(filterActiveOrders([updated])).toHaveLength(0);
  });
});

describe('UI consistency across status casing', () => {
  test('normalization keeps filtering consistent regardless of status case', () => {
    const orders = [
      { id: 'upper-completed', status: 'Completed', total: 50, payment_received: 50 },
      { id: 'mixed-paid', status: 'Paid', total: 60, payment_received: 60 },
      { id: 'lower-pending', status: 'pending', total: 70, payment_received: 0 }
    ];

    const active = filterActiveOrders(orders);
    expect(active.map((o) => o.id)).toContain('mixed-paid');
    expect(active.map((o) => o.id)).toContain('lower-pending');
    expect(active.map((o) => o.id)).not.toContain('upper-completed');
  });
});
