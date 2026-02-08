import { useState } from 'react';
import { Button } from './ui/button';
import { CreditCard, Wallet, Smartphone, DollarSign } from 'lucide-react';

const PaymentSection = ({
  paymentMethod,
  onPaymentMethodChange,
  splitPayment,
  onSplitPaymentToggle,
  cashAmount,
  cardAmount,
  upiAmount,
  creditAmount,
  onAmountChange,
  total,
  receivedAmount,
  balanceAmount,
  changeAmount,
  businessSettings
}) => {
  // Available payment methods based on business settings
  const availableMethods = [
    { id: 'cash', label: 'Cash', icon: DollarSign, enabled: true },
    { id: 'card', label: 'Card', icon: CreditCard, enabled: businessSettings?.card_enabled !== false },
    { id: 'upi', label: 'UPI', icon: Smartphone, enabled: businessSettings?.upi_enabled !== false },
    { id: 'credit', label: 'Credit', icon: Wallet, enabled: businessSettings?.credit_enabled !== false }
  ].filter(method => method.enabled);

  return (
    <div className="space-y-4">
      {/* Payment Method Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Method
        </label>
        <div className="grid grid-cols-2 gap-2">
          {availableMethods.map(method => {
            const Icon = method.icon;
            const isSelected = paymentMethod === method.id && !splitPayment;
            
            return (
              <Button
                key={method.id}
                type="button"
                variant={isSelected ? 'default' : 'outline'}
                className={`flex items-center justify-center gap-2 ${
                  isSelected 
                    ? 'bg-violet-600 hover:bg-violet-700 text-white' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => {
                  onPaymentMethodChange(method.id);
                  if (splitPayment) {
                    onSplitPaymentToggle();
                  }
                }}
              >
                <Icon className="w-4 h-4" />
                {method.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Split Payment Toggle */}
      {availableMethods.length > 1 && (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">Split Payment</span>
          <button
            type="button"
            onClick={onSplitPaymentToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              splitPayment ? 'bg-violet-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                splitPayment ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      )}

      {/* Split Payment Inputs */}
      {splitPayment && (
        <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Split Payment Amounts</h3>
          
          {availableMethods.map(method => (
            <div key={method.id} className="flex items-center gap-2">
              <label className="text-sm text-gray-600 w-16">{method.label}:</label>
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    method.id === 'cash' ? cashAmount :
                    method.id === 'card' ? cardAmount :
                    method.id === 'upi' ? upiAmount :
                    creditAmount
                  }
                  onChange={(e) => onAmountChange(method.id, parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payment Summary */}
      <div className="space-y-2 p-4 bg-gradient-to-br from-violet-50 to-purple-50 rounded-lg border border-violet-200">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Order Total:</span>
          <span className="font-semibold text-gray-900">₹{total.toFixed(2)}</span>
        </div>
        
        {splitPayment && (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Received:</span>
              <span className={`font-semibold ${
                Math.abs(receivedAmount - total) < 0.01 ? 'text-green-600' : 'text-orange-600'
              }`}>
                ₹{receivedAmount.toFixed(2)}
              </span>
            </div>
            
            {balanceAmount > 0.01 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Balance:</span>
                <span className="font-semibold text-red-600">₹{balanceAmount.toFixed(2)}</span>
              </div>
            )}
          </>
        )}
        
        {!splitPayment && paymentMethod === 'cash' && changeAmount > 0 && (
          <div className="flex justify-between text-sm pt-2 border-t border-violet-200">
            <span className="text-gray-600">Change to Return:</span>
            <span className="font-semibold text-green-600">₹{changeAmount.toFixed(2)}</span>
          </div>
        )}
        
        {paymentMethod === 'credit' && !splitPayment && (
          <div className="text-xs text-orange-600 mt-2">
            ⚠️ Credit payment - Balance will be tracked
          </div>
        )}
        
        {splitPayment && creditAmount > 0 && (
          <div className="text-xs text-orange-600 mt-2">
            ⚠️ Partial credit payment - Balance will be tracked
          </div>
        )}
      </div>

      {/* Payment Status Indicator */}
      {splitPayment && (
        <div className="text-center">
          {Math.abs(receivedAmount - total) < 0.01 ? (
            <div className="text-sm text-green-600 font-medium">
              ✓ Payment amounts match total
            </div>
          ) : receivedAmount < total ? (
            <div className="text-sm text-orange-600 font-medium">
              ⚠️ Payment short by ₹{balanceAmount.toFixed(2)}
            </div>
          ) : (
            <div className="text-sm text-red-600 font-medium">
              ⚠️ Payment exceeds total by ₹{(receivedAmount - total).toFixed(2)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PaymentSection;
