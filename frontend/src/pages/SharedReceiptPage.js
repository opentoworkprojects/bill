import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

const CURRENCY_SYMBOLS = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'د.إ'
};

function decodePayload(encoded) {
  if (!encoded) return null;
  try {
    const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
    const json = atob(normalized + padding);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function formatDate(value) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function SharedReceiptPage() {
  const [searchParams] = useSearchParams();
  const receipt = useMemo(() => decodePayload(searchParams.get('d')), [searchParams]);

  if (!receipt) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 text-center">
          <h1 className="text-xl font-bold text-gray-900">Receipt unavailable</h1>
          <p className="text-sm text-gray-600 mt-2">This shared invoice link is invalid or incomplete.</p>
        </div>
      </div>
    );
  }

  const currency = CURRENCY_SYMBOLS[receipt.currency] || CURRENCY_SYMBOLS.INR;
  const items = Array.isArray(receipt.items) ? receipt.items : [];

  return (
    <div className="min-h-screen bg-stone-100 py-6 px-3">
      <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-stone-200">
        <div className="bg-stone-900 text-white px-6 py-5">
          <div className="text-2xl font-bold">{receipt.restaurant_name || 'Restaurant'}</div>
          {receipt.restaurant_address ? <div className="text-sm text-stone-300 mt-1">{receipt.restaurant_address}</div> : null}
          {receipt.restaurant_phone ? <div className="text-sm text-stone-300 mt-1">{receipt.restaurant_phone}</div> : null}
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="flex justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-500">Invoice</div>
              <div className="text-lg font-semibold text-gray-900">{receipt.invoice_number || 'RECEIPT'}</div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-wide text-gray-500">Date</div>
              <div className="text-sm font-medium text-gray-900">{formatDate(receipt.created_at)}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-stone-50 p-3">
              <div className="text-gray-500">Customer</div>
              <div className="font-medium text-gray-900">{receipt.customer_name || 'Guest'}</div>
            </div>
            <div className="rounded-2xl bg-stone-50 p-3">
              <div className="text-gray-500">Table</div>
              <div className="font-medium text-gray-900">{receipt.table_number || 'N/A'}</div>
            </div>
          </div>

          {items.length > 0 ? (
            <div className="rounded-2xl border border-stone-200 overflow-hidden">
              <div className="px-4 py-3 bg-stone-50 text-sm font-semibold text-gray-900">Items</div>
              <div className="divide-y divide-stone-200">
                {items.map((item, index) => {
                  const quantity = Number(item.quantity || 0);
                  const price = Number(item.price || 0);
                  const lineTotal = quantity * price;
                  return (
                    <div key={`${item.name}-${index}`} className="px-4 py-3 flex justify-between gap-3 text-sm">
                      <div>
                        <div className="font-medium text-gray-900">{item.name || 'Item'}</div>
                        <div className="text-gray-500">{quantity} x {currency}{price.toFixed(2)}</div>
                      </div>
                      <div className="font-semibold text-gray-900">{currency}{lineTotal.toFixed(2)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="rounded-2xl bg-stone-900 text-white p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-stone-300">Subtotal</span>
              <span>{currency}{Number(receipt.subtotal || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-stone-300">Tax</span>
              <span>{currency}{Number(receipt.tax || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-stone-700">
              <span>Total</span>
              <span>{currency}{Number(receipt.total || 0).toFixed(2)}</span>
            </div>
          </div>

          <div className="text-center text-sm text-gray-600">
            {receipt.footer_message || 'Thank you for dining with us!'}
          </div>
        </div>
      </div>
    </div>
  );
}
