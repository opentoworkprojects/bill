import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Zap, Calendar } from 'lucide-react';

// TimedPopup — triggers after 60s on page, once per browser session
const TimedPopup = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show once per session
    if (sessionStorage.getItem('timedPopupShown') === 'true') return;

    const timer = setTimeout(() => {
      setVisible(true);
      sessionStorage.setItem('timedPopupShown', 'true');
    }, 60000); // 60 seconds

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
        <button
          onClick={() => setVisible(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="text-center">
          <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h3 className="font-black text-xl text-gray-900 mb-2">
            Still reading? Let us show you live!
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            See BillByteKOT in action with a free 15-minute demo — or start your 7-day free trial right now.
          </p>
          <div className="space-y-3">
            <Link
              to="/login"
              onClick={() => setVisible(false)}
              className="block w-full bg-orange-500 hover:bg-orange-400 text-white font-black py-3 rounded-xl text-sm transition-colors"
            >
              🚀 Start Free 7-Day Trial
            </Link>
            <Link
              to="/contact?demo=true"
              onClick={() => setVisible(false)}
              className="flex items-center justify-center gap-2 w-full border-2 border-gray-200 hover:border-orange-300 text-gray-700 font-bold py-3 rounded-xl text-sm transition-colors"
            >
              <Calendar className="w-4 h-4" />
              Book Free Demo
            </Link>
          </div>
          <p className="text-gray-400 text-xs mt-4">No credit card required • Setup in 5 minutes</p>
        </div>
      </div>
    </div>
  );
};

export default TimedPopup;
