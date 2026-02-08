import { User, Phone } from 'lucide-react';

const CustomerInfoSection = ({
  customerName,
  customerPhone,
  onCustomerNameChange,
  onCustomerPhoneChange,
  isCredit,
  phoneError
}) => {
  return (
    <div className="space-y-4">
      {/* Encouragement message for credit orders */}
      {isCredit && (
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-800">
            💡 <strong>Tip:</strong> Add customer details to track credit orders easily
          </p>
        </div>
      )}

      {/* Customer Name Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <User className="w-4 h-4 inline mr-1" />
          Customer Name (Optional)
        </label>
        <input
          type="text"
          value={customerName}
          onChange={(e) => onCustomerNameChange(e.target.value)}
          placeholder="Enter customer name"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        />
      </div>

      {/* Customer Phone Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Phone className="w-4 h-4 inline mr-1" />
          Customer Phone (Optional)
        </label>
        <input
          type="tel"
          value={customerPhone}
          onChange={(e) => onCustomerPhoneChange(e.target.value)}
          placeholder="Enter phone number"
          className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-violet-500 focus:border-transparent ${
            phoneError ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {phoneError && (
          <p className="text-sm text-red-600 mt-1">{phoneError}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Format: 10-15 digits (e.g., 9876543210 or +919876543210)
        </p>
      </div>

      {/* Benefits of adding customer info */}
      {!customerName && !customerPhone && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            <strong>Why add customer info?</strong>
          </p>
          <ul className="text-xs text-gray-600 mt-1 space-y-1 list-disc list-inside">
            <li>Track credit orders and balances</li>
            <li>Send digital receipts via SMS/email</li>
            <li>Build customer loyalty database</li>
            <li>Easier order history lookup</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default CustomerInfoSection;
