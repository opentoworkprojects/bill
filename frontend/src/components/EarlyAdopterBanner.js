import React, { useState, useEffect } from 'react';
import { X, Sparkles, Clock, Users, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';

const EarlyAdopterBanner = ({ pricing, onClose }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('EarlyAdopterBanner - pricing data:', pricing);
    
    // Show if early adopter offer is active OR if we have campaign pricing
    const shouldShow = pricing?.early_adopter || 
                      (pricing?.campaign_active && pricing?.campaign_name?.includes('Early Adopter')) ||
                      (pricing?.campaign_price && pricing?.regular_price);
    
    if (!shouldShow) {
      console.log('EarlyAdopterBanner - not showing, conditions not met');
      setIsVisible(false);
      return;
    }
    
    console.log('EarlyAdopterBanner - showing banner');
    setIsVisible(true);

    // Setup countdown timer
    const calculateTimeLeft = () => {
      const endDate = new Date('2026-03-31T23:59:59+00:00');
      const now = new Date();
      const difference = endDate - now;
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60)
        });
      }
    };
    
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, [pricing]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  const handleSubscribe = () => {
    navigate('/subscription');
  };

  if (!isVisible || !pricing) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-yellow-300 animate-pulse" />
              <span className="font-bold text-lg">Early Adopter Special</span>
              <div className="bg-yellow-400 text-black px-2 py-1 rounded-full text-xs font-bold">
                15% OFF
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <span className="text-sm opacity-90">Save ₹450!</span>
                <span className="text-lg font-bold">₹2549</span>
                <span className="text-sm line-through opacity-70">₹2999</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span className="text-sm">
                  Only {pricing.early_adopter_spots_left || 850} spots left
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm">
                  {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m left
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              onClick={handleSubscribe}
              className="bg-white text-purple-600 hover:bg-gray-100 font-semibold px-6 py-2 rounded-full transition-all duration-200 transform hover:scale-105"
            >
              Claim Offer
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Close banner"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Mobile version */}
        <div className="md:hidden mt-2 text-center">
          <div className="text-sm space-y-1">
            <div>Save ₹450! ₹2549 <span className="line-through opacity-70">₹2999</span></div>
            <div>{pricing.early_adopter_spots_left || 850} spots left • {timeLeft.days}d {timeLeft.hours}h left</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EarlyAdopterBanner;