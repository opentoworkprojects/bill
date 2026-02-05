import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { AlertTriangle, Sparkles, Clock, Gift, Zap } from 'lucide-react';

// Cache for pricing data (5 minute TTL)
const cache = {
  data: null,
  timestamp: 0,
  TTL: 5 * 60 * 1000
};

const TrialBanner = ({ user }) => {
  const navigate = useNavigate();
  const [pricing, setPricing] = useState(cache.data?.pricing || null);
  const [loading, setLoading] = useState(!cache.data);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    if (cache.data && Date.now() - cache.timestamp < cache.TTL) {
      setPricing(cache.data.pricing);
      setLoading(false);
      return;
    }
    fetchedRef.current = true;
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API}/pricing`);
      cache.data = { pricing: response.data };
      cache.timestamp = Date.now();
      setPricing(response.data);
    } catch (error) {
      // Fallback pricing with 5% early adopter discount
      setPricing({
        regular_price: 1999,
        regular_price_display: '₹1999',
        trial_expired_discount: 5,
        trial_expired_price: 1899,
        trial_expired_price_display: '₹1899',
        early_adopter: true,
        early_adopter_discount: 5
      });
    } finally {
      setLoading(false);
    }
  };

  // Don't show while loading or if no user/trial info
  if (loading || !user?.trial_info) return null;

  const { is_trial, trial_days_left, trial_expired } = user.trial_info;

  // Don't show if user has active subscription (not in trial)
  if (!is_trial && !trial_expired) return null;

  // Get dynamic pricing from Super Admin (5% early adopter discount)
  const regularPrice = pricing?.regular_price_display || '₹1999';
  const discountPercent = pricing?.early_adopter_discount || pricing?.trial_expired_discount || 5;
  const discountedPrice = pricing?.trial_expired_price_display || '₹1899';

  // Determine banner color based on trial days
  const getBannerStyle = () => {
    if (trial_expired) {
      return {
        bg: 'bg-gradient-to-r from-red-500 to-rose-600',
        border: 'border-l-red-600',
        icon: AlertTriangle,
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600'
      };
    }
    if (trial_days_left <= 1) {
      return {
        bg: 'bg-gradient-to-r from-red-500 to-orange-500',
        border: 'border-l-red-500',
        icon: AlertTriangle,
        iconBg: 'bg-white/20',
        iconColor: 'text-white'
      };
    }
    if (trial_days_left <= 3) {
      return {
        bg: 'bg-gradient-to-r from-orange-500 to-amber-500',
        border: 'border-l-orange-500',
        icon: Clock,
        iconBg: 'bg-white/20',
        iconColor: 'text-white'
      };
    }
    if (trial_days_left <= 5) {
      return {
        bg: 'bg-gradient-to-r from-yellow-500 to-amber-500',
        border: 'border-l-yellow-500',
        icon: Clock,
        iconBg: 'bg-white/20',
        iconColor: 'text-white'
      };
    }
    // More than 5 days - green/healthy
    return {
      bg: 'bg-gradient-to-r from-emerald-500 to-green-600',
      border: 'border-l-green-500',
      icon: Sparkles,
      iconBg: 'bg-white/20',
      iconColor: 'text-white'
    };
  };

  const style = getBannerStyle();
  const IconComponent = style.icon;

  // Trial Expired Banner
  if (trial_expired) {
    return (
      <Card className="border-0 shadow-xl bg-red-50 border-l-4 border-l-red-500 mb-4">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${style.iconBg} rounded-full flex items-center justify-center flex-shrink-0`}>
                <IconComponent className={`w-5 h-5 ${style.iconColor}`} />
              </div>
              <div>
                <p className="font-bold text-red-900 text-sm sm:text-base">Trial Expired - Subscription Required</p>
                <p className="text-xs sm:text-sm text-red-700">
                  Get {discountPercent}% OFF → <span className="line-through opacity-60">{regularPrice}</span> <span className="font-bold">{discountedPrice}/year</span>
                </p>
              </div>
            </div>
            <Button 
              onClick={() => navigate('/subscription')} 
              size="sm"
              className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg"
            >
              <Gift className="w-4 h-4 mr-1" />
              Get {discountedPrice}/Year Deal
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Active Trial Banner - Color changes based on days left
  return (
    <Card className={`border-0 shadow-xl ${style.bg} text-white mb-4`}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${style.iconBg} rounded-full flex items-center justify-center flex-shrink-0`}>
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm sm:text-base">
                {trial_days_left <= 1 && '⚠️ Last Day of Trial!'}
                {trial_days_left === 2 && '⚠️ Trial Ending Tomorrow!'}
                {trial_days_left > 2 && trial_days_left <= 5 && `⏰ ${trial_days_left} Days Left in Trial`}
                {trial_days_left > 5 && `🎁 Free Trial - ${trial_days_left} Days Left`}
              </p>
              <p className="text-xs sm:text-sm opacity-90">
                {trial_days_left <= 3 
                  ? `Subscribe now & get ${discountPercent}% OFF → ${discountedPrice}/year`
                  : `Upgrade anytime for just ${regularPrice}/year`
                }
              </p>
            </div>
          </div>
          <Button 
            onClick={() => navigate('/subscription')} 
            size="sm"
            variant="secondary"
            className={`${trial_days_left <= 3 ? 'bg-white text-red-600 hover:bg-red-50' : 'bg-white/20 text-white hover:bg-white/30 border border-white/30'}`}
          >
            <Zap className="w-4 h-4 mr-1" />
            {trial_days_left <= 3 ? `Get ${discountedPrice}` : 'Upgrade'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrialBanner;
