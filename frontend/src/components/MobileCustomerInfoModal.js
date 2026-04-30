import React, { useState, useCallback, useEffect, useRef } from 'react';
import { X, User, Phone } from 'lucide-react';

const MobileCustomerInfoModal = ({
  customerName,
  customerPhone,
  onCustomerNameChange,
  onCustomerPhoneChange,
  onSave,
  onCancel,
  required = false
}) => {
  const [errors, setErrors] = useState({});
  const nameInputRef = useRef(null);

  // Auto-focus on name field when modal opens
  useEffect(() => {
    if (nameInputRef.current) {
      setTimeout(() => {
        nameInputRef.current.focus();
      }, 100);
    }
  }, []);

  // Validate phone number (10 digits for India)
  const validatePhone = useCallback((phone) => {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
  }, []);

  // Handle save with validation
  const handleSave = useCallback(() => {
    const newErrors = {};

    if (required) {
      if (!customerName || customerName.trim() === '') {
        newErrors.name = 'Customer name is required';
      }
      if (!customerPhone || customerPhone.trim() === '') {
        newErrors.phone = 'Customer phone is required';
      } else if (!validatePhone(customerPhone)) {
        newErrors.phone = 'Phone number must be 10 digits';
      }
    } else {
      // Optional validation - only validate if provided
      if (customerPhone && customerPhone.trim() !== '' && !validatePhone(customerPhone)) {
        newErrors.phone = 'Phone number must be 10 digits';
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSave();
    }
  }, [customerName, customerPhone, required, validatePhone, onSave]);

  // Handle phone input change (only allow digits)
  const handlePhoneChange = useCallback((e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    onCustomerPhoneChange(value);
    
    // Clear phone error when user starts typing
    if (errors.phone) {
      setErrors((prev) => ({ ...prev, phone: null }));
    }
  }, [onCustomerPhoneChange, errors.phone]);

  // Handle name input change
  const handleNameChange = useCallback((e) => {
    onCustomerNameChange(e.target.value);
    
    // Clear name error when user starts typing
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: null }));
    }
  }, [onCustomerNameChange, errors.name]);

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-2xl font-bold text-gray-800">Customer Information</h2>
        <button
          onClick={onCancel}
          className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
          aria-label="Close customer info"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {required && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-yellow-800 text-sm">
              Customer information is required for credit sales.
            </p>
          </div>
        )}

        {/* Customer Name Input */}
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">
            Customer Name {required && <span className="text-red-500">*</span>}
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={nameInputRef}
              type="text"
              value={customerName}
              onChange={handleNameChange}
              placeholder="Enter customer name"
              className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
              style={{ fontSize: '16px', minHeight: '48px' }}
            />
          </div>
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        {/* Customer Phone Input */}
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">
            Customer Phone {required && <span className="text-red-500">*</span>}
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="tel"
              inputMode="tel"
              value={customerPhone}
              onChange={handlePhoneChange}
              placeholder="Enter 10-digit phone number"
              maxLength={10}
              className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
              style={{ fontSize: '16px', minHeight: '48px' }}
            />
          </div>
          {errors.phone && (
            <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
          )}
          {customerPhone && customerPhone.length < 10 && !errors.phone && (
            <p className="text-gray-500 text-sm mt-1">
              {10 - customerPhone.length} more digit{10 - customerPhone.length !== 1 ? 's' : ''} required
            </p>
          )}
        </div>

        {!required && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
            <p className="text-blue-800 text-sm">
              Customer information is optional for this payment method.
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t space-y-2">
        <button
          onClick={handleSave}
          className="w-full bg-violet-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-violet-700 active:scale-98 transition-transform"
          style={{ minHeight: '56px' }}
        >
          Save & Continue
        </button>
        {!required && (
          <button
            onClick={onCancel}
            className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 active:scale-98 transition-transform"
            style={{ minHeight: '48px' }}
          >
            Skip
          </button>
        )}
      </div>
    </div>
  );
};

export default MobileCustomerInfoModal;
