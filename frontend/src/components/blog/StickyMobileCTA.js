import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Zap } from 'lucide-react';

// StickyMobileCTA — fixed bottom bar on mobile (< 768px)
// Dismissed via close icon; state stored in sessionStorage
const StickyMobileCTA = () => {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('stickyCtaDismissed') === 'true';
    }
    return false;
  });

  if (dismissed) return null;

  const handleDismiss = () => {
    sessionStorage.setItem('stickyCtaDismissed', 'true');
    setDismissed(true);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-gray-900 text-white px-4 py-3 flex items-center gap-3 shadow-2xl border-t border-gray-700">
      <Zap className="w-5 h-5 text-yellow-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold leading-tight">Free 7-Day Trial</div>
        <div className="text-[10px] text-gray-400">No credit card • Full features</div>
      </div>
      <Link
        to="/login"
        className="bg-orange-500 hover:bg-orange-400 text-white font-black text-xs px-4 py-2 rounded-lg whitespace-nowrap flex-shrink-0"
      >
        Start Free Trial
      </Link>
      <button
        onClick={handleDismiss}
        className="text-gray-500 hover:text-white flex-shrink-0"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default StickyMobileCTA;
