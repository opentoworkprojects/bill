import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

// Currency display per market
const MARKET_CURRENCY = {
  India: { symbol: '₹', price: '1,999', period: '/year' },
  US: { symbol: '$', price: '29', period: '/year' },
  UK: { symbol: '£', price: '24', period: '/year' },
  UAE: { symbol: 'AED', price: '109', period: '/year' },
  Singapore: { symbol: 'SGD', price: '39', period: '/year' },
  Malaysia: { symbol: 'MYR', price: '129', period: '/year' },
  Australia: { symbol: 'AUD', price: '44', period: '/year' },
  Canada: { symbol: 'CAD', price: '39', period: '/year' },
  Global: { symbol: '$', price: '29', period: '/year' },
};

// InlineCTA — renders mid-article (40–60% content position)
// market: first value from post.targetMarket, e.g. "India", "US", "UK", "UAE"
const InlineCTA = ({ market = 'India' }) => {
  const currency = MARKET_CURRENCY[market] || MARKET_CURRENCY['India'];

  return (
    <div className="my-8 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white text-center shadow-lg">
      <div className="flex items-center justify-center gap-2 mb-2">
        <Zap className="w-5 h-5 text-yellow-300" />
        <span className="font-black text-lg">Try BillByteKOT Free for 7 Days</span>
      </div>
      <p className="text-orange-100 text-sm mb-4">
        No credit card required. Full features. Setup in 5 minutes.
        <br />
        <span className="font-bold text-white">
          Then just {currency.symbol}{currency.price}{currency.period} — no hidden fees.
        </span>
      </p>
      <Link
        to="/login"
        className="inline-block bg-white text-orange-600 font-black px-8 py-3 rounded-xl hover:bg-orange-50 transition-colors text-sm"
      >
        🚀 Start Free Trial Now
      </Link>
    </div>
  );
};

export default InlineCTA;
