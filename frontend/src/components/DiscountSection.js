import React from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Percent, DollarSign } from 'lucide-react';

/**
 * DiscountSection Component
 * 
 * Provides discount type toggle and value input for applying discounts to orders.
 * 
 * @param {Object} props
 * @param {string} props.discountType - 'amount' or 'percent'
 * @param {number} props.discountValue - Discount value
 * @param {Function} props.onDiscountTypeChange - Callback when discount type changes
 * @param {Function} props.onDiscountValueChange - Callback when discount value changes
 * @param {number} props.discountAmount - Calculated discount amount
 * @param {number} props.subtotal - Order subtotal for validation
 */
const DiscountSection = ({
  discountType,
  discountValue,
  onDiscountTypeChange,
  onDiscountValueChange,
  discountAmount,
  subtotal
}) => {
  const isInvalid = discountAmount > subtotal;

  return (
    <div className="space-y-4" data-testid="discount-section">
      <h3 className="font-semibold text-gray-900">Discount (Optional)</h3>
      
      {/* Discount Type Toggle */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={discountType === 'amount' ? 'default' : 'outline'}
          className={`flex-1 ${
            discountType === 'amount'
              ? 'bg-violet-600 hover:bg-violet-700'
              : ''
          }`}
          onClick={() => onDiscountTypeChange('amount')}
          data-testid="discount-type-amount"
        >
          <DollarSign className="w-4 h-4 mr-2" />
          Fixed Amount
        </Button>
        <Button
          type="button"
          variant={discountType === 'percent' ? 'default' : 'outline'}
          className={`flex-1 ${
            discountType === 'percent'
              ? 'bg-violet-600 hover:bg-violet-700'
              : ''
          }`}
          onClick={() => onDiscountTypeChange('percent')}
          data-testid="discount-type-percent"
        >
          <Percent className="w-4 h-4 mr-2" />
          Percentage
        </Button>
      </div>

      {/* Discount Value Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Discount {discountType === 'percent' ? 'Percentage' : 'Amount'}
        </label>
        <div className="relative">
          <Input
            type="number"
            value={discountValue || ''}
            onChange={(e) => onDiscountValueChange(parseFloat(e.target.value) || 0)}
            placeholder={discountType === 'percent' ? 'Enter percentage' : 'Enter amount'}
            min="0"
            step={discountType === 'percent' ? '1' : '0.01'}
            max={discountType === 'percent' ? '100' : undefined}
            className={`w-full ${isInvalid ? 'border-red-500' : ''}`}
            data-testid="discount-value-input"
          />
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
            {discountType === 'percent' ? '%' : '₹'}
          </span>
        </div>
        {isInvalid && (
          <p className="text-sm text-red-600 mt-1" data-testid="discount-error">
            Discount cannot exceed subtotal
          </p>
        )}
      </div>

      {/* Calculated Discount Amount */}
      {discountAmount > 0 && !isInvalid && (
        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-green-800">
              Discount Applied
            </span>
            <span className="text-lg font-bold text-green-600" data-testid="calculated-discount">
              -₹{discountAmount.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscountSection;
