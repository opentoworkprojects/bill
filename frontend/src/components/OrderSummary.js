import React from 'react';

/**
 * OrderSummary Component
 * 
 * Displays the order summary with subtotal, tax, discount, and grand total.
 * Updates in real-time when order changes.
 * 
 * @param {Object} props
 * @param {number} props.subtotal - Order subtotal
 * @param {number} props.tax - Tax amount
 * @param {number} props.discount - Discount amount
 * @param {number} props.total - Grand total
 */
const OrderSummary = ({ subtotal, tax, discount, total }) => {
  return (
    <div className="space-y-3" data-testid="order-summary">
      <div className="flex justify-between text-gray-600">
        <span>Subtotal</span>
        <span data-testid="summary-subtotal">₹{subtotal.toFixed(2)}</span>
      </div>
      
      {discount > 0 && (
        <div className="flex justify-between text-green-600">
          <span>Discount</span>
          <span data-testid="summary-discount">-₹{discount.toFixed(2)}</span>
        </div>
      )}
      
      <div className="flex justify-between text-gray-600">
        <span>Tax</span>
        <span data-testid="summary-tax">₹{tax.toFixed(2)}</span>
      </div>
      
      <div className="border-t pt-3 flex justify-between text-lg font-bold">
        <span>Total</span>
        <span className="text-violet-600" data-testid="summary-total">
          ₹{total.toFixed(2)}
        </span>
      </div>
    </div>
  );
};

export default OrderSummary;
