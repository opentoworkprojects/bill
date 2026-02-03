import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import { X, Gift, Clock, Star, Zap } from 'lucide-react';

const PromotionalBanner = ({ position = 'top', showOnPages = ['all'] }) => {
  const [campaigns, setCampaigns] = useState([]);
  const [saleOffer, setSaleOffer] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [currentBanner, setCurrentBanner] = useState(null);
  const [isVisible, setIsVisible] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPromotionalData();
  }, []);

  const fetchPromotionalData = async () => {
    try {
      setLoading(true);
      console.log('PromotionalBanner - Fetching promotional data...');
      
      // Fetch pricing first as it's most reliable
      const pricingRes = await axios.get(`${API}/public/pricing`);
      console.log('PromotionalBanner - Pricing data:', pricingRes.data);
      setPricing(pricingRes.data);
      
      // Always show pricing banner if we have campaign data
      if (pricingRes.data && (pricingRes.data.campaign_active || pricingRes.data.early_adopter)) {
        console.log('PromotionalBanner - Setting pricing banner');
        setCurrentBanner({ type: 'pricing', data: pricingRes.data });
        setIsVisible(true);
      } else {
        console.log('PromotionalBanner - No active campaigns found');
        // Still try to fetch other data
        try {
          const campaignsRes = await axios.get(`${API}/public/active-campaigns`);
          setCampaigns(campaignsRes.data.campaigns || []);
          
          const saleOfferRes = await axios.get(`${API}/public/sale-offer`);
          setSaleOffer(saleOfferRes.data.enabled ? saleOfferRes.data : null);
          
          if (saleOfferRes.data.enabled) {
            setCurrentBanner({ type: 'sale', data: saleOfferRes.data });
          } else if (campaignsRes.data.campaigns && campaignsRes.data.campaigns.length > 0) {
            setCurrentBanner({ type: 'campaign', data: campaignsRes.data.campaigns[0] });
          }
        } catch (err) {
          console.log('PromotionalBanner - Failed to fetch additional data:', err);
        }
      }
      
    } catch (error) {
      console.error('PromotionalBanner - Failed to fetch promotional data:', error);
      // Set fallback banner to ensure something shows
      setCurrentBanner({ 
        type: 'pricing', 
        data: {
          regular_price: 2999,
          campaign_price: 2549,
          campaign_active: true,
          campaign_name: 'Early Adopter Special',
          campaign_discount_percent: 15,
          early_adopter: true,
          early_adopter_spots_left: 850
        }
      });
      setIsVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    // Store in localStorage to remember user dismissed it
    if (currentBanner) {
      localStorage.setItem(`banner_dismissed_${currentBanner.type}`, Date.now().toString());
    }
  };

  const getBannerColors = (color) => {
    const colors = {
      violet: 'from-violet-500 to-purple-600',
      red: 'from-red-500 to-orange-500',
      green: 'from-green-500 to-emerald-600',
      blue: 'from-blue-500 to-cyan-600',
      orange: 'from-orange-500 to-red-500',
      pink: 'from-pink-500 to-rose-600',
      default: 'from-violet-500 to-purple-600'
    };
    return colors[color] || colors.default;
  };

  const getIcon = (type) => {
    switch (type) {
      case 'sale': return <Zap className="w-5 h-5" />;
      case 'campaign': return <Gift className="w-5 h-5" />;
      case 'pricing': return <Star className="w-5 h-5" />;
      default: return <Gift className="w-5 h-5" />;
    }
  };

  if (loading || !isVisible || !currentBanner) {
    return null;
  }

  const { type, data } = currentBanner;

  // Check if user previously dismissed this banner
  const dismissedTime = localStorage.getItem(`banner_dismissed_${type}`);
  if (dismissedTime && Date.now() - parseInt(dismissedTime) < 24 * 60 * 60 * 1000) {
    return null; // Don't show for 24 hours after dismissal
  }

  const renderSaleBanner = () => (
    <div className={`bg-gradient-to-r ${getBannerColors(data.bg_color?.split(' ')[0]?.replace('from-', ''))} text-white`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getIcon('sale')}
            <div>
              <span className="font-bold text-lg">{data.title}</span>
              <span className="ml-2 text-sm opacity-90">{data.subtitle}</span>
              {data.discount_text && (
                <span className="ml-3 bg-white text-red-600 px-2 py-1 rounded-full text-xs font-bold">
                  {data.discount_text}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {data.valid_until && (
              <div className="flex items-center space-x-1 text-sm">
                <Clock className="w-4 h-4" />
                <span>Ends: {new Date(data.valid_until).toLocaleDateString()}</span>
              </div>
            )}
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        {data.urgency_text && (
          <div className="mt-2 text-center text-sm opacity-90">
            {data.urgency_text}
          </div>
        )}
      </div>
    </div>
  );

  const renderCampaignBanner = () => (
    <div className={`bg-gradient-to-r ${getBannerColors(data.banner_color)} text-white`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getIcon('campaign')}
            <div>
              <span className="font-bold text-lg">{data.title}</span>
              <span className="ml-2 text-sm opacity-90">{data.description}</span>
              {data.discount_value && (
                <span className="ml-3 bg-white text-purple-600 px-2 py-1 rounded-full text-xs font-bold">
                  {data.discount_type === 'percentage' ? `${data.discount_value}% OFF` : `₹${data.discount_value} OFF`}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {data.coupon_code && (
              <div className="bg-white text-purple-600 px-3 py-1 rounded-md text-sm font-mono font-bold">
                {data.coupon_code}
              </div>
            )}
            <div className="flex items-center space-x-1 text-sm">
              <Clock className="w-4 h-4" />
              <span>Ends: {new Date(data.end_date).toLocaleDateString()}</span>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        {data.banner_text && (
          <div className="mt-2 text-center text-sm opacity-90">
            {data.banner_text}
          </div>
        )}
      </div>
    </div>
  );

  const renderPricingBanner = () => (
    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getIcon('pricing')}
            <div>
              <span className="font-bold text-lg">{data.campaign_name || 'Special Pricing'}</span>
              <span className="ml-2 text-sm opacity-90">
                Save {data.campaign_discount_percent}% on your subscription
              </span>
              <span className="ml-3 bg-white text-emerald-600 px-2 py-1 rounded-full text-xs font-bold">
                {data.campaign_price_display} 
                <span className="line-through ml-1 opacity-70">{data.regular_price_display}</span>
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {data.campaign_end_date && (
              <div className="flex items-center space-x-1 text-sm">
                <Clock className="w-4 h-4" />
                <span>Ends: {new Date(data.campaign_end_date).toLocaleDateString()}</span>
              </div>
            )}
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const positionClasses = {
    top: 'fixed top-0 left-0 right-0 z-50',
    bottom: 'fixed bottom-0 left-0 right-0 z-50',
    inline: 'relative'
  };

  return (
    <div className={positionClasses[position]}>
      {type === 'sale' && renderSaleBanner()}
      {type === 'campaign' && renderCampaignBanner()}
      {type === 'pricing' && renderPricingBanner()}
    </div>
  );
};

export default PromotionalBanner;