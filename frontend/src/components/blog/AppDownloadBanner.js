import { useState } from 'react';
import { X, Smartphone, Star } from 'lucide-react';
import { PLAY_STORE_URL } from '../../utils/playStoreUrl';

// AppDownloadBanner — renders on every blog post page
// mobile=true: sticky top bar (Smart App Banner equivalent), dismissible via sessionStorage
// mobile=false (default): inline card with Play Store badge, star rating, description
const AppDownloadBanner = ({ mobile = false, targetMarket = [] }) => {
  const isIndia = targetMarket.includes('India') || targetMarket.length === 0;

  const [dismissed, setDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('appBannerDismissed') === 'true';
    }
    return false;
  });

  const handleDismiss = () => {
    sessionStorage.setItem('appBannerDismissed', 'true');
    setDismissed(true);
  };

  if (dismissed && mobile) return null;

  if (mobile) {
    return (
      <div
        className="fixed left-0 right-0 z-40 bg-gray-900 text-white flex items-center gap-3 px-4 py-2 shadow-lg"
        style={{ top: '64px' }}
      >
        <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Smartphone className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-xs leading-tight">BillByteKOT — Restaurant Billing App</div>
          <div className="flex items-center gap-1 text-[10px] text-yellow-400">
            {[1,2,3,4,5].map(i => <Star key={i} className="w-2.5 h-2.5 fill-current" />)}
            <span className="text-gray-400 ml-1">4.8</span>
          </div>
        </div>
        <a
          href={PLAY_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-500 hover:bg-green-400 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap flex-shrink-0"
        >
          GET IT ON Google Play
          {isIndia && <span className="block text-[9px] font-normal text-green-100">अभी डाउनलोड करें</span>}
        </a>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-white flex-shrink-0 ml-1"
          aria-label="Dismiss app banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Inline card mode
  return (
    <div className="rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4 flex items-center gap-4 my-6">
      <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
        <Smartphone className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm text-gray-900">BillByteKOT — Restaurant Billing App</div>
        <div className="flex items-center gap-1 text-yellow-500 my-0.5">
          {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 fill-current" />)}
          <span className="text-gray-500 text-xs ml-1">4.8 • Free</span>
        </div>
        <div className="text-xs text-gray-600">Bill faster, manage KOTs, track inventory — all on Android.</div>
      </div>
      <a
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-4 py-2 rounded-lg whitespace-nowrap flex-shrink-0 text-center"
      >
        GET IT ON<br />Google Play
        {isIndia && <span className="block text-[10px] font-normal text-green-100 mt-0.5">अभी डाउनलोड करें</span>}
      </a>
    </div>
  );
};

export default AppDownloadBanner;
