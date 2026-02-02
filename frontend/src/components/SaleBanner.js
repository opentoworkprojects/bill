import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { Gift, Zap, Clock, Sparkles, Star, Flame, PartyPopper, X, Rocket } from 'lucide-react';

const SaleBanner = ({ position = 'top', saleData: propSaleData = null }) => {
  const navigate = useNavigate();
  const [internalSaleData, setInternalSaleData] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  // Use prop data if provided, otherwise use internal state
  const saleData = propSaleData || internalSaleData;

  // Check localStorage for dismissal
  useEffect(() => {
    const dismissalKey = `saleBanner_${position}_dismissed`;
    const dismissedAt = localStorage.getItem(dismissalKey);
    if (dismissedAt) {
      const dismissedTime = new Date(dismissedAt).getTime();
      const now = new Date().getTime();
      const hoursSinceDismissal = (now - dismissedTime) / (1000 * 60 * 60);
      // Hide banner if dismissed within 24 hours
      if (hoursSinceDismissal < 24) {
        setDismissed(true);
      } else {
        // Clear old dismissal
        localStorage.removeItem(dismissalKey);
      }
    }
  }, [position]);

  // Only fetch data if no prop data provided
  useEffect(() => {
    if (!propSaleData) {
      fetchSaleData();
    }
  }, [propSaleData]);

  useEffect(() => {
    if (saleData?.end_date) {
      // Calculate immediately
      const calculateTimeLeft = () => {
        let endDateStr = saleData.end_date;
        // If it's just a date (YYYY-MM-DD), add end of day time
        if (endDateStr && endDateStr.length === 10) {
          endDateStr = endDateStr + 'T23:59:59';
        }
        
        const end = new Date(endDateStr);
        const now = new Date();
        const diff = end - now;
        
        if (diff <= 0) {
          setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
          return false;
        } else {
          setTimeLeft({
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((diff % (1000 * 60)) / 1000)
          });
          return true;
        }
      };
      
      calculateTimeLeft();
      const timer = setInterval(() => {
        if (!calculateTimeLeft()) {
          clearInterval(timer);
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [saleData]);

  const fetchSaleData = async () => {
    try {
      const response = await axios.get(`${API}/public/sale-offer`);
      if (response.data?.enabled) {
        setInternalSaleData(response.data);
      }
    } catch (error) {
      console.log('No active sale');
    }
  };

  // Handle dismissal with localStorage persistence
  const handleDismiss = () => {
    const dismissalKey = `saleBanner_${position}_dismissed`;
    localStorage.setItem(dismissalKey, new Date().toISOString());
    setDismissed(true);
  };

  if (!saleData || dismissed) return null;

  const theme = saleData.theme || 'default';
  
  // Theme configurations
  const themes = {
    default: {
      bg: 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600',
      text: 'text-white',
      accent: 'bg-yellow-400 text-black',
      icon: Sparkles,
      badge: 'SPECIAL OFFER'
    },
    early_adopter: {
      bg: 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500',
      text: 'text-white',
      accent: 'bg-yellow-300 text-emerald-900',
      icon: Rocket,
      badge: 'EARLY ADOPTER',
      pattern: '🚀'
    },
    diwali: {
      bg: 'bg-gradient-to-r from-orange-500 via-red-500 to-pink-500',
      text: 'text-white',
      accent: 'bg-yellow-300 text-orange-900',
      icon: Sparkles,
      pattern: '🪔'
    },
    christmas: {
      bg: 'bg-gradient-to-r from-red-600 via-red-500 to-green-600',
      text: 'text-white',
      accent: 'bg-white text-red-600',
      icon: Gift,
      pattern: '🎄'
    },
    newyear: {
      bg: 'bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900',
      text: 'text-white',
      accent: 'bg-yellow-400 text-black',
      icon: PartyPopper,
      pattern: '🎉'
    },
    flash: {
      bg: 'bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500',
      text: 'text-white',
      accent: 'bg-black text-yellow-400',
      icon: Zap,
      animate: true
    },
    blackfriday: {
      bg: 'bg-gradient-to-r from-gray-900 via-black to-gray-900',
      text: 'text-white',
      accent: 'bg-yellow-400 text-black',
      icon: Flame
    },
    summer: {
      bg: 'bg-gradient-to-r from-cyan-400 via-yellow-400 to-orange-400',
      text: 'text-gray-900',
      accent: 'bg-white text-orange-600',
      icon: Star
    },
    republic: {
      bg: 'bg-gradient-to-r from-orange-500 via-white to-green-600',
      text: 'text-gray-900',
      accent: 'bg-blue-900 text-white',
      icon: Star,
      pattern: '🇮🇳'
    },
    holi: {
      bg: 'bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500',
      text: 'text-white',
      accent: 'bg-yellow-300 text-purple-900',
      icon: Sparkles,
      pattern: '🎨'
    }
  };

  const currentTheme = themes[theme] || themes.default;
  const IconComponent = currentTheme.icon;

  // Floating Top Banner
  if (position === 'top') {
    return (
      <div className={`${currentTheme.bg} ${currentTheme.text} py-2 px-4 relative overflow-hidden ${currentTheme.animate ? 'animate-pulse' : ''}`}>
        {/* Background pattern */}
        {currentTheme.pattern && (
          <div className="absolute inset-0 opacity-10 flex items-center justify-around">
            {[...Array(10)].map((_, i) => (
              <span key={i} className="text-4xl">{currentTheme.pattern}</span>
            ))}
          </div>
        )}
        
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-4 relative z-10">
          <IconComponent className="w-5 h-5 animate-bounce" />
          <p className="text-sm font-medium">
            <span className="font-bold">{saleData.title || 'Special Offer!'}</span>
            {' '}{saleData.subtitle || `Get ${saleData.discount_percent || 20}% OFF`}
          </p>
          {timeLeft && (
            <div className="hidden sm:flex items-center gap-1 text-xs">
              <Clock className="w-3 h-3" />
              <span>{timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m</span>
            </div>
          )}
          <button 
            onClick={() => navigate('/login')}
            className={`${currentTheme.accent} px-3 py-1 rounded-full text-xs font-bold hover:scale-105 transition-transform`}
          >
            Claim Now
          </button>
          <button onClick={handleDismiss} className="absolute right-2 opacity-60 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Hero Section Banner
  if (position === 'hero') {
    return (
      <div className={`${currentTheme.bg} ${currentTheme.text} rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-2xl`}>
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          {currentTheme.pattern && [...Array(20)].map((_, i) => (
            <span 
              key={i} 
              className="absolute text-4xl opacity-10 animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 5}s`
              }}
            >
              {currentTheme.pattern}
            </span>
          ))}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
        </div>

        <div className="relative z-10 text-center">
          {/* Sale Badge */}
          <div className={`inline-flex items-center gap-2 ${currentTheme.accent} px-4 py-2 rounded-full text-sm font-bold mb-4 ${currentTheme.animate ? 'animate-pulse' : ''}`}>
            <IconComponent className="w-4 h-4" />
            {saleData.badge || 'LIMITED TIME OFFER'}
          </div>

          {/* Main Title */}
          <h2 className="text-3xl sm:text-5xl font-black mb-2">
            {saleData.title || 'Mega Sale!'}
          </h2>
          
          {/* Discount Display */}
          <div className="flex items-center justify-center gap-4 my-4">
            <span className="text-6xl sm:text-8xl font-black">
              {saleData.discount_percent || 20}%
            </span>
            <span className="text-2xl sm:text-3xl font-bold opacity-80">OFF</span>
          </div>

          {/* Subtitle */}
          <p className="text-lg opacity-90 mb-4">
            {saleData.subtitle || 'On Annual Subscription'}
          </p>

          {/* Price Display - Updated for ₹2999 pricing */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="text-2xl line-through opacity-50">₹{saleData.original_price || 2999}</span>
            <span className="text-4xl font-black">₹{saleData.sale_price || 2549}</span>
            <span className="text-sm opacity-70">/year</span>
          </div>

          {/* Countdown Timer */}
          {timeLeft && (
            <div className="flex items-center justify-center gap-2 sm:gap-4 mb-6">
              {[
                { value: timeLeft.days, label: 'Days' },
                { value: timeLeft.hours, label: 'Hours' },
                { value: timeLeft.minutes, label: 'Mins' },
                { value: timeLeft.seconds, label: 'Secs' }
              ].map((item, i) => (
                <div key={i} className="bg-white/20 backdrop-blur rounded-lg p-2 sm:p-3 min-w-[60px]">
                  <div className="text-2xl sm:text-3xl font-black">{String(item.value).padStart(2, '0')}</div>
                  <div className="text-xs opacity-70">{item.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* CTA Button */}
          <button 
            onClick={() => navigate('/login')}
            className={`${currentTheme.accent} px-8 py-4 rounded-xl text-lg font-bold hover:scale-105 transition-all shadow-xl`}
          >
            <span className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              {saleData.cta_text || 'Grab This Deal Now!'}
            </span>
          </button>

          {/* Urgency Text */}
          <p className="mt-4 text-sm opacity-70">
            {saleData.urgency_text || '⚡ Limited slots available. Offer ends soon!'}
          </p>
        </div>
      </div>
    );
  }

  // Floating Corner Banner
  if (position === 'corner') {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${currentTheme.bg} ${currentTheme.text} rounded-2xl p-4 shadow-2xl max-w-xs ${currentTheme.animate ? 'animate-bounce' : ''}`}>
        <button onClick={handleDismiss} className="absolute -top-2 -right-2 bg-white text-gray-800 rounded-full p-1 shadow-lg">
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className={`${currentTheme.accent} p-3 rounded-xl`}>
            <IconComponent className="w-6 h-6" />
          </div>
          <div>
            <p className="font-bold text-sm">{saleData.title || 'Special Offer!'}</p>
            <p className="text-2xl font-black">{saleData.discount_percent || 20}% OFF</p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/login')}
          className={`w-full mt-3 ${currentTheme.accent} py-2 rounded-lg font-bold text-sm hover:scale-105 transition-transform`}
        >
          Claim Now →
        </button>
      </div>
    );
  }

  // Floating Side Banner (Right side of screen)
  if (position === 'side') {
    return (
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50 hidden sm:block">
        <div className={`${currentTheme.bg} ${currentTheme.text} rounded-l-2xl shadow-2xl overflow-hidden ${currentTheme.animate ? 'animate-pulse' : ''}`}>
          {/* Close button */}
          <button 
            onClick={handleDismiss} 
            className="absolute top-2 left-2 bg-white/20 hover:bg-white/30 rounded-full p-1 transition-colors z-10"
          >
            <X className="w-3 h-3" />
          </button>
          
          {/* Vertical content */}
          <div className="p-3 flex flex-col items-center gap-2 min-w-[70px]">
            {/* Icon */}
            <div className={`${currentTheme.accent} p-2 rounded-xl`}>
              <IconComponent className="w-5 h-5" />
            </div>
            
            {/* Discount */}
            <div className="text-center">
              <p className="text-2xl font-black leading-none">{saleData.discount_percent || 20}%</p>
              <p className="text-xs font-bold opacity-80">OFF</p>
            </div>
            
            {/* Divider */}
            <div className="w-8 h-px bg-white/30"></div>
            
            {/* Price */}
            <div className="text-center">
              <p className="text-xs line-through opacity-50">₹{saleData.original_price || 1999}</p>
              <p className="text-lg font-black">₹{saleData.sale_price || 1799}</p>
            </div>
            
            {/* Timer (compact) */}
            {timeLeft && (
              <div className="text-center">
                <div className="flex gap-1 text-xs font-mono">
                  <span className="bg-white/20 px-1 rounded">{String(timeLeft.hours).padStart(2, '0')}</span>
                  <span>:</span>
                  <span className="bg-white/20 px-1 rounded">{String(timeLeft.minutes).padStart(2, '0')}</span>
                </div>
                <p className="text-[8px] opacity-60 mt-0.5">left</p>
              </div>
            )}
            
            {/* CTA Button */}
            <button 
              onClick={() => navigate('/login')}
              className={`${currentTheme.accent} px-3 py-2 rounded-lg text-xs font-bold hover:scale-105 transition-transform whitespace-nowrap`}
            >
              Grab →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Inline CTA Banner
  if (position === 'inline') {
    return (
      <div className={`${currentTheme.bg} ${currentTheme.text} rounded-xl p-4 sm:p-6 relative overflow-hidden`}>
        {currentTheme.pattern && (
          <div className="absolute inset-0 opacity-10 flex items-center justify-around">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="text-6xl">{currentTheme.pattern}</span>
            ))}
          </div>
        )}
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`${currentTheme.accent} p-3 rounded-xl`}>
              <IconComponent className="w-8 h-8" />
            </div>
            <div>
              <p className="font-bold text-lg">{saleData.title || 'Limited Time Offer!'}</p>
              <p className="opacity-80">{saleData.subtitle || `Save ${saleData.discount_percent || 20}% on annual plan`}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm line-through opacity-50">₹{saleData.original_price || 1999}</p>
              <p className="text-2xl font-black">₹{saleData.sale_price || 1599}</p>
            </div>
            <button 
              onClick={() => navigate('/login')}
              className={`${currentTheme.accent} px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform`}
            >
              Get Deal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default SaleBanner;
