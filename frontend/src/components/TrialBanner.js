import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { AlertTriangle, Sparkles, Clock, Gift } from 'lucide-react';

const TrialBanner = ({ user }) => {
  const navigate = useNavigate();
  const [saleOffer, setSaleOffer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSaleOffer();
  }, []);

  const fetchSaleOffer = async () => {
    try {
      const response = await axios.get(`${API}/sale-offer`);
      setSaleOffer(response.data);
    } catch (error) {
      console.error('Failed to fetch sale offer', error);
      setSaleOffer({ enabled: false });
    } finally {
      setLoading(false);
    }
  };

  // Don't show anything while loading
  if (loading) return null;

  // Don't show if sale offer is not enabled from Super Admin
  if (!saleOffer?.enabled) return null;

  if (!user?.trial_info) return null;

  const { is_trial, trial_days_left, trial_expired } = user.trial_info;

  // Don't show if user has active subscription
  if (!is_trial) return null;

  // Get offer details from super admin settings
  const offerTitle = saleOffer.title || 'Special Offer';
  const offerPrice = saleOffer.price || '₹599/Year';
  const offerBgColor = saleOffer.bg_color || 'from-red-500 to-orange-500';

  // Trial expired - urgent banner
  if (trial_expired) {
    return (
      <Card className="border-0 shadow-lg border-l-4 border-l-red-500 bg-red-50 mb-6">
        <CardContent className="p-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-red-900">Trial Expired - Subscription Required</p>
              <p className="text-sm text-red-700">Your 7-day trial has ended. Subscribe now to continue using BillByteKOT.</p>
            </div>
          </div>
          <Button 
            onClick={() => navigate('/subscription')} 
            className={`bg-gradient-to-r ${offerBgColor} hover:opacity-90`}
          >
            <Gift className="w-4 h-4 mr-2" />
            {offerTitle} - {offerPrice}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Trial expiring soon (2 days or less) - warning banner
  if (trial_days_left <= 2) {
    return (
      <Card className={`border-0 shadow-lg bg-gradient-to-r ${offerBgColor} text-white mb-6`}>
        <CardContent className="p-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold">⚠️ Trial Ending Soon!</p>
              <p className="text-sm text-white/90">
                Only {trial_days_left} {trial_days_left === 1 ? 'day' : 'days'} left • {offerTitle}: {offerPrice}
              </p>
            </div>
          </div>
          <Button 
            onClick={() => navigate('/subscription')} 
            variant="secondary" 
            className="bg-white text-gray-800 hover:bg-gray-100"
          >
            <Gift className="w-4 h-4 mr-2" />
            Get {offerPrice}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Trial active - info banner
  return (
    <Card className="border-0 shadow-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white mb-6">
      <CardContent className="p-4 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold">🎁 Free Trial Active!</p>
            <p className="text-sm text-green-100">
              {trial_days_left} {trial_days_left === 1 ? 'day' : 'days'} remaining • {offerTitle}: {offerPrice}
            </p>
          </div>
        </div>
        <Button 
          onClick={() => navigate('/subscription')} 
          variant="secondary" 
          className="bg-white text-green-600 hover:bg-green-50"
        >
          <Gift className="w-4 h-4 mr-2" />
          Upgrade - {offerPrice}
        </Button>
      </CardContent>
    </Card>
  );
};

export default TrialBanner;
