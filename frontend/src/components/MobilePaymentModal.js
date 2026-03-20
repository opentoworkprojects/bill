import React, { useState, useCallback, useMemo } from 'react';
import { X, Banknote, CreditCard, Smartphone, UserCheck, Split } from 'lucide-react';

const MobilePaymentModal = ({
  total,
  paymentMethod,
  paymentOptions,
  receivedAmount,
  cashAmount,
  cardAmount,
  upiAmount,
  onPaymentMethodChange,
  onReceivedAmountChange,
  onCashAmountChange,
  onCardAmountChange,
  onUpiAmountChange,
  onComplete,
  onCancel,
  processing,
  currency = '₹'
}) => {
  const [errors, setErrors] = useState({});

  // Payment method icons
  const paymentIcons = {
    cash: Banknote,
    card: CreditCard,
    upi: Smartphone,
    credit: UserCheck,
    split: Split
  };

  // Payment method labels
  const paymentLabels = {
    cash: 'Cash',
    card: 'Card',
    upi: 'UPI',
    credit: 'Credit',
    split: 'Split'
  };

  // Calculate change for cash payment
  const change = useMemo(() => {
    if (paymentMethod === 'cash') {
      const received = parseFloat(receivedAmount) || 0;
      return Math.max(0, received - total);
    }
    return 0;
  }, [paymentMethod, receivedAmount, total]);

  // Calculate split payment total and balance
  const splitTotal = useMemo(() => {
    if (paymentMethod === 'split') {
      const cash = parseFloat(cashAmount) || 0;
      const card = parseFloat(cardAmount) || 0;
      const upi = parseFloat(upiAmount) || 0;
      return cash + card + upi;
    }
    return 0;
  }, [paymentMethod, cashAmount, cardAmount, upiAmount]);

  const splitBalance = useMemo(() => {
    if (paymentMethod === 'split') {
      return total - splitTotal;
    }
    return 0;
  }, [paymentMethod, total, splitTotal]);

  // Handle payment method selection
  const handlePaymentMethodSelect = useCallback((method) => {
    onPaymentMethodChange(method);
    setErrors({});
  }, [onPaymentMethodChange]);

  // Handle quick amount buttons
  const handleQuickAmount = useCallback((type) => {
    if (paymentMethod === 'cash') {
      if (type === 'exact') {
        onReceivedAmountChange(total.toString());
      } else if (type === 'half') {
        onReceivedAmountChange((total / 2).toFixed(2));
      } else if (type === 'round') {
        const rounded = Math.ceil(total / 10) * 10;
        onReceivedAmountChange(rounded.toString());
      }
    }
  }, [paymentMethod, total, onReceivedAmountChange]);

  // Validate payment before completion
  const validatePayment = useCallback(() => {
    const newErrors = {};

    if (paymentMethod === 'cash') {
      const received = parseFloat(receivedAmount) || 0;
      if (received <= 0) {
        newErrors.receivedAmount = 'Please enter received amount';
      } else if (received < total) {
        newErrors.receivedAmount = 'Received amount must be at least ' + currency + total.toFixed(2);
      }
    } else if (paymentMethod === 'split') {
      if (Math.abs(splitBalance) > 0.01) {
        newErrors.split = `Split amounts must equal total. Difference: ${currency}${Math.abs(splitBalance).toFixed(2)}`;
      }
      if (splitTotal === 0) {
        newErrors.split = 'Please enter split payment amounts';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [paymentMethod, receivedAmount, total, splitBalance, splitTotal, currency]);

  // Handle complete sale
  const handleComplete = useCallback(() => {
    if (validatePayment()) {
      onComplete();
    }
  }, [validatePayment, onComplete]);

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-2xl font-bold text-gray-800">Payment</h2>
        <button
          onClick={onCancel}
          className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
          aria-label="Close payment"
          disabled={processing}
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Total Amount */}
        <div className="bg-violet-50 rounded-lg p-4 mb-6">
          <p className="text-gray-600 text-sm mb-1">Total Amount</p>
          <p className="text-3xl font-bold text-violet-600">
            {currency}{total.toFixed(2)}
          </p>
        </div>

        {/* Payment Method Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Select Payment Method</h3>
          <div className="grid grid-cols-2 gap-3">
            {paymentOptions.map((option) => {
              const Icon = paymentIcons[option];
              const isSelected = paymentMethod === option;

              return (
                <button
                  key={option}
                  onClick={() => handlePaymentMethodSelect(option)}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-violet-600 bg-violet-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  style={{ minHeight: '60px' }}
                  disabled={processing}
                >
                  <Icon className={`w-8 h-8 mb-2 ${isSelected ? 'text-violet-600' : 'text-gray-600'}`} />
                  <span className={`font-semibold ${isSelected ? 'text-violet-600' : 'text-gray-700'}`}>
                    {paymentLabels[option]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cash Payment Input */}
        {paymentMethod === 'cash' && (
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">Received Amount</label>
            <input
              type="number"
              inputMode="numeric"
              value={receivedAmount}
              onChange={(e) => onReceivedAmountChange(e.target.value)}
              placeholder="0.00"
              className={`w-full px-4 py-3 border-2 rounded-lg text-2xl font-bold text-center ${
                errors.receivedAmount ? 'border-red-500' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
              style={{ fontSize: '24px' }}
              disabled={processing}
            />
            {errors.receivedAmount && (
              <p className="text-red-500 text-sm mt-1">{errors.receivedAmount}</p>
            )}

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              <button
                onClick={() => handleQuickAmount('exact')}
                className="py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 active:scale-95 transition-transform"
                disabled={processing}
              >
                Exact
              </button>
              <button
                onClick={() => handleQuickAmount('half')}
                className="py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 active:scale-95 transition-transform"
                disabled={processing}
              >
                50%
              </button>
              <button
                onClick={() => handleQuickAmount('round')}
                className="py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 active:scale-95 transition-transform"
                disabled={processing}
              >
                Round
              </button>
            </div>

            {/* Change Calculation */}
            {change > 0 && (
              <div className="mt-4 bg-green-50 rounded-lg p-3">
                <p className="text-gray-600 text-sm">Change to Return</p>
                <p className="text-2xl font-bold text-green-600">
                  {currency}{change.toFixed(2)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Split Payment Inputs */}
        {paymentMethod === 'split' && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Split Payment Amounts</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Cash Amount</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={cashAmount}
                  onChange={(e) => onCashAmountChange(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  style={{ fontSize: '18px' }}
                  disabled={processing}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Card Amount</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={cardAmount}
                  onChange={(e) => onCardAmountChange(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  style={{ fontSize: '18px' }}
                  disabled={processing}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">UPI Amount</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={upiAmount}
                  onChange={(e) => onUpiAmountChange(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  style={{ fontSize: '18px' }}
                  disabled={processing}
                />
              </div>
            </div>

            {/* Split Summary */}
            <div className="mt-4 bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Split Total</span>
                <span className="font-semibold">{currency}{splitTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Order Total</span>
                <span className="font-semibold">{currency}{total.toFixed(2)}</span>
              </div>
              <div className={`flex justify-between font-bold ${
                Math.abs(splitBalance) < 0.01 ? 'text-green-600' : 'text-red-600'
              }`}>
                <span>Balance</span>
                <span>{currency}{splitBalance.toFixed(2)}</span>
              </div>
            </div>

            {errors.split && (
              <p className="text-red-500 text-sm mt-2">{errors.split}</p>
            )}
          </div>
        )}

        {/* Card/UPI/Credit Payment - No additional input needed */}
        {['card', 'upi', 'credit'].includes(paymentMethod) && (
          <div className="mb-6 bg-blue-50 rounded-lg p-4">
            <p className="text-gray-700 text-center">
              {paymentMethod === 'credit' 
                ? 'Customer information will be collected after payment confirmation.'
                : `Payment will be processed via ${paymentLabels[paymentMethod]}.`}
            </p>
          </div>
        )}
      </div>

      {/* Complete Sale Button */}
      <div className="p-4 border-t">
        <button
          onClick={handleComplete}
          disabled={processing}
          className="w-full bg-violet-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-violet-700 active:scale-98 transition-transform disabled:bg-gray-400 disabled:cursor-not-allowed"
          style={{ minHeight: '56px' }}
        >
          {processing ? 'Processing...' : 'Complete Sale'}
        </button>
      </div>
    </div>
  );
};

export default MobilePaymentModal;
