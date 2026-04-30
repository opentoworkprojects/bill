import { Link } from 'react-router-dom';
import { Smartphone, Monitor, Download, CheckCircle, Globe, ArrowRight } from 'lucide-react';
import { PLAY_STORE_URL } from '../../utils/playStoreUrl';

// App promo card — used in blog sidebar and inline positions
// compact=true: hides description and offline note (for tight spaces)
const AppPromoCard = ({ compact = false }) => (
  <div className="rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
    <div className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
          <Smartphone className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="font-black text-sm">BillByteKOT App</div>
          <div className="text-gray-400 text-[10px]">Android • Windows • Web</div>
        </div>
      </div>
      {!compact && (
        <p className="text-gray-300 text-xs mb-4 leading-relaxed">
          Manage your restaurant from anywhere. Bill faster, track inventory, send KOTs — all on your phone or PC.
        </p>
      )}
      <div className="space-y-2">
        {/* Android — Play Store with UTM tracking */}
        <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer">
          <div className="flex items-center gap-3 bg-green-600 hover:bg-green-500 transition-colors rounded-xl px-3 py-2.5 cursor-pointer">
            <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-green-200 leading-none">GET IT ON</div>
              <div className="font-black text-sm leading-tight">Google Play Store</div>
            </div>
            <Download className="w-4 h-4 text-green-200 flex-shrink-0" />
          </div>
        </a>
        {/* Windows */}
        <Link to="/download">
          <div className="flex items-center gap-3 bg-blue-600 hover:bg-blue-500 transition-colors rounded-xl px-3 py-2.5 cursor-pointer">
            <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Monitor className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-blue-200 leading-none">DOWNLOAD FOR</div>
              <div className="font-black text-sm leading-tight">Windows Desktop</div>
            </div>
            <Download className="w-4 h-4 text-blue-200 flex-shrink-0" />
          </div>
        </Link>
        {/* Web */}
        <Link to="/login">
          <div className="flex items-center gap-3 bg-white/10 hover:bg-white/15 transition-colors rounded-xl px-3 py-2.5 cursor-pointer border border-white/10">
            <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-gray-400 leading-none">USE IN BROWSER</div>
              <div className="font-black text-sm leading-tight">Web App — Free Trial</div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </div>
        </Link>
      </div>
      {!compact && (
        <div className="mt-3 flex items-center gap-1.5 text-[10px] text-gray-500">
          <CheckCircle className="w-3 h-3 text-green-400" />
          <span>Works offline • No internet needed for billing</span>
        </div>
      )}
    </div>
  </div>
);

export default AppPromoCard;
