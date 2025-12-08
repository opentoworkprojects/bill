import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { AlertTriangle, Sparkles, Clock } from 'lucide-react';

const TrialBanner = ({ user }) => {
  const navigate = useNavigate();

  if (!user?.trial_info) return null;

  const { is_trial, trial_days_left, trial_expired } = user.trial_info;

  // Don't show if user has active subscription
  if (!is_trial) return null;

  // Trial expired - urgent banner
  if (trial_expired) {
    return (
      <Card className="border-0 shadow-lg border-l-4 border-l-red-500 bg-red-50 mb-6">
        <CardContent className="p-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-red-900">Trial Expired - Subscription Required</p>
              <p className="text-sm text-red-700">Your 7-day trial has ended. Subscribe to continue using BillByteKOT.</p>
            </div>
          </div>
          <Button 
            onClick={() => navigate('/subscription')} 
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
          >
            Subscribe Now - ₹499/year
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Trial expiring soon (2 days or less) - warning banner
  if (trial_days_left <= 2) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-500 to-amber-600 text-white mb-6">
        <CardContent className="p-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold">⚠️ Trial Ending Soon!</p>
              <p className="text-sm text-orange-100">
                Only {trial_days_left} {trial_days_left === 1 ? 'day' : 'days'} left • Subscribe now to keep all your data and features
              </p>
            </div>
          </div>
          <Button 
            onClick={() => navigate('/subscription')} 
            variant="secondary" 
            className="bg-white text-orange-600 hover:bg-orange-50"
          >
            Subscribe - ₹499/year
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
              {trial_days_left} {trial_days_left === 1 ? 'day' : 'days'} remaining • Enjoy all premium features
            </p>
          </div>
        </div>
        <Button 
          onClick={() => navigate('/subscription')} 
          variant="secondary" 
          className="bg-white text-green-600 hover:bg-green-50"
        >
          Upgrade to Premium
        </Button>
      </CardContent>
    </Card>
  );
};

export default TrialBanner;
