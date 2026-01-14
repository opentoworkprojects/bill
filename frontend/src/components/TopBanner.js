import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { Zap, Clock, Sparkles, Star, Flame, X, Crown, Timer, ArrowRight, Tag, Monitor, Smartphone, Tablet } from 'lucide-react';

const TopBanner = ({ saleData: propSaleData = null }) => {
  const navigate = useNavigate();
  const [internalBannerData, setInternalBannerData] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Use prop data if provided, otherwise use internal state
  const bannerData = propSaleData || internalBannerData;

  // Only fetch data if no prop data provided
  useEffect(() => {
    if (!propSaleData) {
      fetchBannerData();
    }
  }, [propSaleData]);

  useEffect(() => {
    // Get the end date from either valid_until or end_date
    let endDateStr = bannerData?.valid_until || bannerData?.end_date;
    
    if (endDateStr) {
      // If it's just a date (YYYY-MM-DD), add end of day time
      if (endDateStr.length === 10) {
        endDateStr = endDateStr + 'T23:59:59';
      }
      
      // Calculate time left immediately
      const calculateTimeLeft = () => {
        const end = new Date(endDateStr);
        const now = new Date();
        const diff = end - now;
        
        if (diff <= 0) {
          setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
          return false; // Timer expired
        } else {
          setTimeLeft({
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((diff % (1000 * 60)) / 1000)
          });
          return true; // Timer still running
        }
      };
      
      // Calculate immediately on mount
      calculateTimeLeft();
      
      // Then update every second
      const timer = setInterval(() => {
        const stillRunning = calculateTimeLeft();
        if (!stillRunning) {
          clearInterval(timer);
        }
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [bannerData]);

  const fetchBannerData = async () => {
    try {
      const response = await axios.get(`${API}/sale-offer`);
      if (response.data?.enabled) {
        setInternalBannerData(response.data);
      }
    } catch (error) {
      console.log('No active banner');
    }
  };

  if (!bannerData || dismissed) return null;

  const design = bannerData.banner_design || 'gradient-wave';

  // Design 1: Gradient Wave with Floating Elements
  if (design === 'gradient-wave') {
    return (
      <div className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white">
        {/* Animated wave background - pointer-events-none */}
        <div className="absolute inset-0 pointer-events-none">
          <svg className="absolute bottom-0 w-full h-8 text-white/10" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" fill="currentColor">
              <animate attributeName="d" dur="10s" repeatCount="indefinite" values="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z;M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z;M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"/>
            </path>
          </svg>
        </div>
        {/* Floating particles - pointer-events-none */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <div key={i} className="absolute w-2 h-2 bg-white/30 rounded-full animate-float" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 3}s`, animationDuration: `${3 + Math.random() * 2}s` }} />
          ))}
        </div>
        <div className="relative z-10 py-3 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 animate-bounce">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <span className="font-bold text-lg">{bannerData.badge_text || '🎉 SPECIAL OFFER'}</span>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-white/80">{bannerData.title}</span>
              <span className="bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-black animate-pulse">{bannerData.discount_percent || 20}% OFF</span>
            </div>
            {timeLeft.days > 0 || timeLeft.hours > 0 ? (
              <div className="flex items-center gap-1 text-xs bg-black/20 px-3 py-1 rounded-full">
                <Timer className="w-3 h-3" />
                <span>{timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m</span>
              </div>
            ) : null}
            <button onClick={() => navigate('/login')} className="bg-white text-violet-600 px-4 py-1.5 rounded-full text-sm font-bold hover:bg-yellow-300 hover:text-black transition-all hover:scale-105 shadow-lg">
              {bannerData.cta_text || 'Claim Now'} →
            </button>
            <button onClick={() => setDismissed(true)} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Design 2: Neon Glow with Pulse Effect
  if (design === 'neon-glow') {
    return (
      <div className="relative overflow-hidden bg-gray-900 text-white">
        {/* Neon glow effects - pointer-events-none */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-32 h-32 bg-pink-500 rounded-full filter blur-3xl opacity-30 animate-pulse" />
          <div className="absolute top-0 right-1/4 w-32 h-32 bg-cyan-500 rounded-full filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '0.5s' }} />
          <div className="absolute top-0 left-1/2 w-32 h-32 bg-purple-500 rounded-full filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        {/* Grid pattern - pointer-events-none */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
        <div className="relative z-10 py-3 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Zap className="w-6 h-6 text-yellow-400 animate-pulse" />
                <div className="absolute inset-0 bg-yellow-400 rounded-full filter blur-md opacity-50 animate-ping" />
              </div>
              <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-lg animate-gradient" style={{ backgroundSize: '200% auto' }}>
                {bannerData.badge_text || 'FLASH SALE'}
              </span>
            </div>
            <div className="text-center">
              <span className="text-gray-300">{bannerData.title}</span>
              <span className="ml-2 text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">{bannerData.discount_percent || 20}% OFF</span>
            </div>
            <div className="flex gap-1">
              {[timeLeft.days, timeLeft.hours, timeLeft.minutes, timeLeft.seconds].map((val, i) => (
                <div key={i} className="bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-700 px-2 py-1 rounded text-center min-w-[36px]">
                  <span className="font-mono font-bold text-cyan-400">{String(val).padStart(2, '0')}</span>
                  <span className="text-[8px] text-gray-500 block">{['D', 'H', 'M', 'S'][i]}</span>
                </div>
              ))}
            </div>
            <button onClick={() => navigate('/login')} className="relative group bg-gradient-to-r from-pink-500 to-purple-500 px-5 py-2 rounded-lg font-bold text-sm overflow-hidden">
              <span className="relative z-10">{bannerData.cta_text || 'Get Deal'}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <button onClick={() => setDismissed(true)} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    );
  }

  // Design 3: Festive Confetti with Celebration Theme
  if (design === 'festive-confetti') {
    return (
      <div className="relative overflow-hidden bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white">
        {/* Confetti particles - pointer-events-none */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <div key={i} className="absolute animate-confetti" style={{
              left: `${Math.random() * 100}%`,
              top: '-10px',
              width: `${4 + Math.random() * 6}px`,
              height: `${4 + Math.random() * 6}px`,
              backgroundColor: ['#FFD700', '#FF69B4', '#00CED1', '#98FB98', '#DDA0DD', '#F0E68C'][Math.floor(Math.random() * 6)],
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }} />
          ))}
        </div>
        {/* Sparkle effects - pointer-events-none */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(10)].map((_, i) => (
            <Sparkles key={i} className="absolute w-4 h-4 text-yellow-300 animate-ping" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 2}s` }} />
          ))}
        </div>
        <div className="relative z-10 py-3 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-3xl animate-bounce">🎉</span>
              <span className="font-black text-xl tracking-wide drop-shadow-lg">{bannerData.badge_text || 'CELEBRATION SALE!'}</span>
              <span className="text-3xl animate-bounce" style={{ animationDelay: '0.2s' }}>🎊</span>
            </div>
            <div className="bg-white/20 backdrop-blur px-4 py-1 rounded-full">
              <span className="font-bold">{bannerData.title}</span>
            </div>
            <div className="relative">
              <span className="text-4xl font-black drop-shadow-lg animate-pulse">{bannerData.discount_percent || 20}%</span>
              <span className="absolute -top-1 -right-4 text-yellow-300 text-sm font-bold">OFF</span>
            </div>
            <button onClick={() => navigate('/login')} className="bg-yellow-400 text-black px-6 py-2 rounded-full font-black text-sm hover:bg-white hover:scale-110 transition-all shadow-xl animate-bounce">
              🎁 {bannerData.cta_text || 'Grab Now!'}
            </button>
            <button onClick={() => setDismissed(true)} className="text-white/60 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    );
  }

  // Design 4: Minimal Elegant with Slide Animation
  if (design === 'minimal-elegant') {
    return (
      <div className="relative overflow-hidden bg-black text-white">
        {/* Sliding gradient line */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent animate-slide-x" />
        <div className="relative z-10 py-3 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-6">
            <div className="flex items-center gap-3">
              <Crown className="w-5 h-5 text-yellow-500" />
              <span className="text-sm tracking-[0.2em] uppercase font-light">{bannerData.badge_text || 'Exclusive Offer'}</span>
            </div>
            <div className="h-4 w-px bg-white/30" />
            <span className="font-light">{bannerData.title}</span>
            <div className="h-4 w-px bg-white/30" />
            <span className="font-bold text-yellow-500">{bannerData.discount_percent || 20}% OFF</span>
            <button onClick={() => navigate('/login')} className="border border-white/50 px-4 py-1 text-sm hover:bg-white hover:text-black transition-all group flex items-center gap-2">
              {bannerData.cta_text || 'Shop Now'}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button onClick={() => setDismissed(true)} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    );
  }

  // Design 5: Marquee Scroll with Urgency
  if (design === 'marquee-urgent') {
    return (
      <div className="relative overflow-hidden bg-gradient-to-r from-red-600 to-red-700 text-white">
        {/* Pulsing background - pointer-events-none */}
        <div className="absolute inset-0 bg-red-500 animate-pulse opacity-30 pointer-events-none" />
        <div className="relative z-10 py-2">
          <div className="flex items-center">
            {/* Static left section */}
            <div className="flex-shrink-0 bg-black/30 px-4 py-1 flex items-center gap-2 z-10">
              <Flame className="w-5 h-5 text-yellow-400 animate-pulse" />
              <span className="font-black text-sm">{bannerData.discount_percent || 20}% OFF</span>
            </div>
            {/* Scrolling marquee */}
            <div className="flex-1 overflow-hidden">
              <div className="animate-marquee whitespace-nowrap flex items-center gap-8">
                {[...Array(4)].map((_, i) => (
                  <span key={i} className="flex items-center gap-4">
                    <span className="text-yellow-300">⚡</span>
                    <span className="font-bold">{bannerData.title || 'LIMITED TIME OFFER'}</span>
                    <span className="text-yellow-300">⚡</span>
                    <span>{bannerData.subtitle || 'Hurry! Offer ends soon'}</span>
                    <span className="text-yellow-300">🔥</span>
                  </span>
                ))}
              </div>
            </div>
            {/* Static right section */}
            <div className="flex-shrink-0 flex items-center gap-2 px-4 z-10">
              <button onClick={() => navigate('/login')} className="bg-yellow-400 text-black px-4 py-1 rounded font-bold text-sm hover:bg-white transition-colors animate-pulse">
                {bannerData.cta_text || 'BUY NOW'}
              </button>
              <button onClick={() => setDismissed(true)} className="text-white/60 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Design 6: Glassmorphism Modern
  if (design === 'glass-modern') {
    return (
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 text-white">
        {/* Animated gradient orbs - pointer-events-none */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-40 h-40 bg-blue-500 rounded-full filter blur-3xl opacity-20 animate-float" />
          <div className="absolute top-0 right-1/3 w-40 h-40 bg-purple-500 rounded-full filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute top-0 right-1/4 w-40 h-40 bg-pink-500 rounded-full filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '2s' }} />
        </div>
        <div className="relative z-10 py-3 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-4 flex-wrap">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium">{bannerData.badge_text || 'Live Now'}</span>
            </div>
            <span className="text-lg font-light">{bannerData.title}</span>
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-4 py-1 rounded-full font-black text-sm">
              {bannerData.discount_percent || 20}% OFF
            </div>
            <div className="hidden sm:flex items-center gap-1 bg-white/10 backdrop-blur px-3 py-1 rounded-full text-xs">
              <Clock className="w-3 h-3" />
              <span>{timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s</span>
            </div>
            <button onClick={() => navigate('/login')} className="bg-white text-black px-5 py-1.5 rounded-full font-bold text-sm hover:bg-gradient-to-r hover:from-yellow-400 hover:to-orange-500 transition-all hover:scale-105">
              {bannerData.cta_text || 'Get Started'} →
            </button>
            <button onClick={() => setDismissed(true)} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    );
  }

  // Design 7: Retro Pixel Style
  if (design === 'retro-pixel') {
    return (
      <div className="relative overflow-hidden bg-black text-white font-mono">
        {/* Scanline effect - already has pointer-events-none */}
        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[size:100%_4px] pointer-events-none opacity-30" />
        {/* Pixel border - pointer-events-none */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 pointer-events-none" />
        <div className="relative z-10 py-3 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-green-400">
              <span className="animate-pulse">▶</span>
              <span className="tracking-wider">{bannerData.badge_text || 'POWER UP!'}</span>
            </div>
            <span className="text-yellow-400">{bannerData.title}</span>
            <div className="border-2 border-yellow-400 px-3 py-0.5 text-yellow-400 font-bold animate-pulse">
              -{bannerData.discount_percent || 20}%
            </div>
            <div className="text-cyan-400 text-sm">
              ⏱ {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
            </div>
            <button onClick={() => navigate('/login')} className="bg-green-500 text-black px-4 py-1 font-bold hover:bg-yellow-400 transition-colors border-b-4 border-green-700 hover:border-yellow-600 active:border-b-0 active:mt-1">
              {bannerData.cta_text || 'START →'}
            </button>
            <button onClick={() => setDismissed(true)} className="text-red-500 hover:text-white">[X]</button>
          </div>
        </div>
      </div>
    );
  }

  // Design 8: Gradient Rainbow Animated
  if (design === 'rainbow-gradient') {
    return (
      <div className="relative overflow-hidden text-white" style={{ background: 'linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8f00ff, #ff0000)', backgroundSize: '400% 100%', animation: 'gradient-x 8s linear infinite' }}>
        <div className="relative z-10 py-3 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 bg-black/30 backdrop-blur px-3 py-1 rounded-full">
              <Star className="w-4 h-4 text-yellow-300 animate-spin" style={{ animationDuration: '3s' }} />
              <span className="font-bold text-sm">{bannerData.badge_text || 'MEGA SALE'}</span>
            </div>
            <span className="font-medium drop-shadow-lg">{bannerData.title}</span>
            <div className="bg-white text-black px-4 py-1 rounded-full font-black text-lg animate-bounce">
              {bannerData.discount_percent || 20}% OFF
            </div>
            <button onClick={() => navigate('/login')} className="bg-black text-white px-5 py-1.5 rounded-full font-bold text-sm hover:bg-white hover:text-black transition-all shadow-xl">
              {bannerData.cta_text || 'Shop Now'} ✨
            </button>
            <button onClick={() => setDismissed(true)} className="text-white/60 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    );
  }

  // Design 9: Split Diagonal
  if (design === 'split-diagonal') {
    return (
      <div className="relative overflow-hidden bg-black text-white h-12">
        {/* Diagonal split - pointer-events-none */}
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600 pointer-events-none" style={{ clipPath: 'polygon(0 0, 60% 0, 50% 100%, 0 100%)' }} />
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 pointer-events-none" style={{ clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 40% 100%)' }} />
        <div className="relative z-10 h-full flex items-center justify-center gap-6 px-4">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            <span className="font-bold">{bannerData.badge_text || 'SPECIAL'}</span>
          </div>
          <span className="text-2xl font-black">{bannerData.discount_percent || 20}% OFF</span>
          <span className="hidden sm:inline">{bannerData.title}</span>
          <button onClick={() => navigate('/login')} className="bg-white text-black px-4 py-1 rounded font-bold text-sm hover:bg-yellow-400 transition-colors">
            {bannerData.cta_text || 'Get It'} →
          </button>
          <button onClick={() => setDismissed(true)} className="absolute right-2 text-white/60 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
      </div>
    );
  }

  // Design 10: Countdown Focus
  if (design === 'countdown-focus') {
    return (
      <div className="relative overflow-hidden bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_70%)] pointer-events-none" />
        <div className="relative z-10 py-3 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-4 flex-wrap">
            <span className="text-red-500 font-bold animate-pulse flex items-center gap-1">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
              ENDING SOON
            </span>
            <div className="flex gap-2">
              {[
                { val: timeLeft.days, label: 'DAYS' },
                { val: timeLeft.hours, label: 'HRS' },
                { val: timeLeft.minutes, label: 'MIN' },
                { val: timeLeft.seconds, label: 'SEC' }
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div className="bg-gradient-to-b from-red-500 to-red-700 px-3 py-1 rounded-lg font-mono font-black text-xl min-w-[50px]">
                    {String(item.val).padStart(2, '0')}
                  </div>
                  <span className="text-[10px] text-gray-400">{item.label}</span>
                </div>
              ))}
            </div>
            <div className="text-center">
              <span className="text-gray-400 text-sm">{bannerData.title}</span>
              <span className="ml-2 text-yellow-400 font-black text-xl">{bannerData.discount_percent || 20}% OFF</span>
            </div>
            <button onClick={() => navigate('/login')} className="bg-gradient-to-r from-red-500 to-orange-500 px-6 py-2 rounded-lg font-bold text-sm hover:from-red-600 hover:to-orange-600 transition-all shadow-lg shadow-red-500/30">
              {bannerData.cta_text || 'Claim Offer'}
            </button>
            <button onClick={() => setDismissed(true)} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    );
  }

  // Design 11: Early Adopter Special - Orange/Red theme with scrolling text
  if (design === 'early-adopter') {
    const monthlyPrice = bannerData.monthly_price || 159;
    const yearlyPrice = bannerData.sale_price || 1899;
    const originalYearlyPrice = bannerData.original_price || 1999;
    const discountPercent = bannerData.discount_percent || 5;
    
    return (
      <div className="relative overflow-hidden text-white" style={{
        background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 25%, #ff4757 50%, #ff6348 75%, #ff9f43 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradient-x 3s ease infinite'
      }}>
        {/* Glowing orbs - pointer-events-none */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-20 h-20 bg-yellow-400 rounded-full filter blur-2xl opacity-30" />
          <div className="absolute top-0 right-1/4 w-20 h-20 bg-orange-500 rounded-full filter blur-2xl opacity-30" />
        </div>
        
        <div className="relative z-10 py-2 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
            
            {/* Animated Badge */}
            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full border border-yellow-400/50">
              <Flame className="w-4 h-4 text-yellow-300 animate-pulse" />
              <span className="font-black text-sm tracking-wide text-yellow-100">
                {bannerData.badge_text || '🚀 EARLY ADOPTER SPECIAL'}
              </span>
              <Flame className="w-4 h-4 text-yellow-300 animate-pulse" />
            </div>
            
            {/* Monthly Price - HIGHLIGHTED */}
            <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm px-3 py-1 rounded-xl border border-white/20">
              <span className="text-2xl sm:text-3xl font-black text-yellow-200">₹{monthlyPrice}</span>
              <div className="text-left">
                <span className="text-yellow-200 text-xs font-bold block">/month</span>
                <span className="text-white/60 text-[10px]">billed yearly</span>
              </div>
            </div>
            
            {/* Yearly Price Display */}
            <div className="hidden sm:flex items-center gap-2 bg-black/30 backdrop-blur-sm px-3 py-1 rounded-xl border border-white/20">
              <span className="text-white/50 line-through text-sm">₹{originalYearlyPrice}/yr</span>
              <ArrowRight className="w-4 h-4 text-yellow-300" />
              <span className="text-xl font-black text-yellow-200">₹{yearlyPrice}</span>
              <span className="text-yellow-200 text-sm">/year</span>
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-2 py-0.5 rounded-lg font-black text-xs">
                {discountPercent}% OFF
              </span>
            </div>
            
            {/* Countdown Timer */}
            <div className="hidden md:flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-lg">
              <Timer className="w-4 h-4 text-red-400" />
              <div className="flex gap-0.5">
                {[
                  { val: timeLeft.days, label: 'd' },
                  { val: timeLeft.hours, label: 'h' },
                  { val: timeLeft.minutes, label: 'm' },
                  { val: timeLeft.seconds, label: 's' }
                ].map((item, i) => (
                  <div key={i} className="bg-red-600/80 px-1.5 py-0.5 rounded text-center min-w-[28px]">
                    <span className="font-mono font-bold text-white text-sm">{String(item.val).padStart(2, '0')}</span>
                    <span className="text-[9px] text-red-200">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* CTA Button */}
            <button 
              onClick={() => navigate('/login')} 
              className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black px-4 py-1.5 rounded-full font-bold text-sm shadow-lg hover:scale-105 transition-all flex items-center gap-1.5"
            >
              <Zap className="w-4 h-4" />
              {bannerData.cta_text || 'Get This Deal Now!'}
              <ArrowRight className="w-4 h-4" />
            </button>
            
            {/* Close */}
            <button onClick={() => setDismissed(true)} className="text-white/60 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Scrolling urgency text */}
          <div className="mt-1 overflow-hidden border-t border-white/10 pt-1">
            <div className="animate-marquee whitespace-nowrap text-xs font-medium">
              <span className="mx-4 text-yellow-200">🔥 JUST ₹{monthlyPrice}/MONTH</span>
              <span className="mx-4 text-white">⚡ UNLIMITED BILLS FOREVER</span>
              <span className="mx-4 text-yellow-200">💎 ALL PREMIUM FEATURES</span>
              <span className="mx-4 text-white">📞 24/7 PRIORITY SUPPORT</span>
              <span className="mx-4 text-yellow-200">⏰ LIMITED TIME ONLY</span>
              <span className="mx-4 text-white">🚀 EARLY ADOPTERS ONLY</span>
              <span className="mx-4 text-yellow-200">🔥 JUST ₹{monthlyPrice}/MONTH</span>
              <span className="mx-4 text-white">⚡ UNLIMITED BILLS FOREVER</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default fallback - Simple gradient
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-violet-600 to-purple-600 text-white py-2 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-4 flex-wrap">
        <Sparkles className="w-5 h-5 animate-pulse" />
        <span className="font-bold">{bannerData.title || 'Special Offer!'}</span>
        <span className="bg-yellow-400 text-black px-3 py-0.5 rounded-full text-sm font-bold">{bannerData.discount_percent || 20}% OFF</span>
        <button onClick={() => navigate('/login')} className="bg-white text-violet-600 px-4 py-1 rounded-full text-sm font-bold hover:bg-yellow-400 hover:text-black transition-all">
          {bannerData.cta_text || 'Get Deal'}
        </button>
        <button onClick={() => setDismissed(true)} className="text-white/60 hover:text-white"><X className="w-4 h-4" /></button>
      </div>
    </div>
  );
};

export default TopBanner;
