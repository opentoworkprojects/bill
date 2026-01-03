import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { 
  Crown, CheckCircle, AlertCircle, Sparkles, Zap, Shield, 
  Clock, Gift, Star, TrendingUp, Users, Printer, BarChart3,
  Smartphone, Globe, HeadphonesIcon, Rocket, Timer
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SubscriptionPage = ({ user }) => {
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true); // Loading state for initial data
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [pricing, setPricing] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadPageData();
  }, []);

  // Load all data before showing the page
  const loadPageData = async () => {
    setPageLoading(true);
    try {
      const [statusRes, pricingRes] = await Promise.all([
        axios.get(`${API}/subscription/status`).catch(() => ({ data: null })),
        axios.get(`${API}/pricing`).catch(() => ({ data: null }))
      ]);
      
      if (statusRes.data) {
        setSubscriptionStatus(statusRes.data);
      }
      
      if (pricingRes.data) {
        setPricing(pricingRes.data);
      } else {
        // Fallback pricing
        setPricing({
          regular_price: 1999,
          regular_price_display: '₹1999',
          campaign_price: 1799,
          campaign_price_display: '₹1799',
          campaign_active: false,
          campaign_discount_percent: 10,
          trial_expired_discount: 10,
          trial_expired_price: 1799,
          trial_expired_price_display: '₹1799',
          trial_days: 7
        });
      }
      
      // Setup countdown timer only if campaign is active
      if (pricingRes.data?.campaign_active && pricingRes.data?.campaign_end_date) {
        setupCountdownTimer(pricingRes.data.campaign_end_date);
      }
    } catch (error) {
      console.error('Failed to load page data', error);
    } finally {
      setPageLoading(false);
    }
  };

  const setupCountdownTimer = (endDateStr) => {
    const calculateTimeLeft = () => {
      const endDate = new Date(endDateStr);
      const now = new Date();
      const difference = endDate - now;
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };
    
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  };

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await axios.get(`${API}/subscription/status`);
      setSubscriptionStatus(response.data);
    } catch (error) {
      toast.error('Failed to fetch subscription status');
    }
  };

  const fetchPricing = async () => {
    try {
      const response = await axios.get(`${API}/pricing`);
      setPricing(response.data);
    } catch (error) {
      // Use default pricing - ₹1999 base
      setPricing({
        regular_price: 1999,
        regular_price_display: '₹1999',
        campaign_price: 1799,
        campaign_price_display: '₹1799',
        campaign_active: false,
        campaign_discount_percent: 10,
        trial_expired_discount: 10,
        trial_expired_price: 1799,
        trial_expired_price_display: '₹1799',
        trial_days: 7
      });
    }
  };

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/subscription/create-order`, {});
      
      const finalAmount = response.data.amount;
      const campaignInfo = response.data.campaign_active ? ' (New Year Special!)' : '';
      
      // Razorpay options with mobile-specific settings
      const options = {
        key: response.data.key_id,
        amount: finalAmount,
        currency: response.data.currency,
        order_id: response.data.razorpay_order_id,
        name: 'BillByteKOT AI',
        description: `Premium Subscription - 1 Year${campaignInfo}`,
        image: 'https://billbytekot.in/logo.png',
        handler: async (razorpayResponse) => {
          try {
            const verifyResponse = await axios.post(`${API}/subscription/verify`, {
              razorpay_payment_id: razorpayResponse.razorpay_payment_id,
              razorpay_order_id: razorpayResponse.razorpay_order_id,
              razorpay_signature: razorpayResponse.razorpay_signature
            });
            toast.success(verifyResponse.data.message || '🎉 Premium activated! Welcome to BillByteKOT AI Pro!');
            fetchSubscriptionStatus();
            // Update local user data
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            userData.subscription_active = true;
            userData.is_early_adopter = response.data.campaign_active;
            localStorage.setItem('user', JSON.stringify(userData));
            setTimeout(() => navigate('/dashboard'), 2000);
          } catch (error) {
            toast.error(error.response?.data?.detail || 'Subscription verification failed. Please contact support.');
          }
        },
        prefill: {
          name: user?.restaurant_name || user?.username || '',
          email: user?.email || '',
          contact: user?.phone || ''
        },
        notes: {
          user_id: user?.id || '',
          campaign: response.data.campaign_name || 'NEWYEAR2026'
        },
        theme: { 
          color: '#7c3aed',
          backdrop_color: 'rgba(0,0,0,0.7)'
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
            toast.info('Payment cancelled');
          },
          escape: true,
          animation: true,
          backdropclose: false
        },
        // Mobile-specific settings
        config: {
          display: {
            blocks: {
              banks: {
                name: 'Pay via UPI/Bank',
                instruments: [
                  { method: 'upi' },
                  { method: 'netbanking' },
                  { method: 'card' },
                  { method: 'wallet' }
                ]
              }
            },
            sequence: ['block.banks'],
            preferences: {
              show_default_blocks: true
            }
          }
        },
        retry: {
          enabled: true,
          max_count: 3
        }
      };
      
      // Check if Razorpay is loaded
      if (!window.Razorpay) {
        toast.error('Payment system not loaded. Please refresh the page.');
        setLoading(false);
        return;
      }
      
      const razorpay = new window.Razorpay(options);
      
      // Handle payment failure
      razorpay.on('payment.failed', function(response) {
        console.error('Payment failed:', response.error);
        toast.error(`Payment failed: ${response.error.description || 'Please try again'}`);
        setLoading(false);
      });
      
      razorpay.open();
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error(error.response?.data?.detail || 'Failed to create subscription order');
      setLoading(false);
    }
  };

  const features = [
    { icon: Zap, title: 'Unlimited Bills', desc: 'No restrictions on billing' },
    { icon: Printer, title: '6 Print Formats', desc: 'Professional thermal printing' },
    { icon: BarChart3, title: 'Advanced Analytics', desc: 'Detailed reports & insights' },
    { icon: Users, title: 'Unlimited Staff', desc: 'Add unlimited team members' },
    { icon: Smartphone, title: 'Multi-Device', desc: 'Access from any device' },
    { icon: Globe, title: 'Cloud Sync', desc: 'Real-time data sync' },
    { icon: Shield, title: 'Priority Support', desc: '24/7 premium support' },
    { icon: Sparkles, title: 'AI Features', desc: 'Smart recommendations' },
  ];

  return (
    <Layout user={user}>
      {/* Show loading skeleton while fetching data */}
      {pageLoading ? (
        <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
          <div className="text-center space-y-4">
            <div className="h-12 bg-gray-200 rounded-lg w-64 mx-auto"></div>
            <div className="h-6 bg-gray-200 rounded w-96 mx-auto"></div>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="h-96 bg-gray-200 rounded-2xl"></div>
            <div className="h-96 bg-gray-200 rounded-2xl"></div>
          </div>
        </div>
      ) : (
      <div className="max-w-6xl mx-auto space-y-8" data-testid="subscription-page">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          {/* Only show campaign banner when campaign is ACTUALLY active */}
          {pricing?.campaign_active && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full text-sm font-bold animate-pulse">
              <Gift className="w-4 h-4" />
              🎉 {pricing?.campaign_name || 'Special Offer'} - {pricing?.campaign_discount_percent || 10}% OFF!
            </div>
          )}
          {/* Show trial expired banner only when trial is expired and no campaign */}
          {!pricing?.campaign_active && subscriptionStatus?.needs_subscription && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full text-sm font-bold animate-pulse">
              <Gift className="w-4 h-4" />
              🎁 Trial Expired - Get {pricing?.trial_expired_discount || 10}% OFF!
            </div>
          )}
          <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-transparent" 
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Upgrade to Premium
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Unlock unlimited potential for your restaurant with our powerful features
          </p>
          
          {/* Countdown Timer - Only show when campaign is active */}
          {pricing?.campaign_active && (
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-red-50 border border-red-200 rounded-xl">
              <Timer className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-red-700">Offer ends in:</span>
              <div className="flex gap-1">
                <span className="bg-red-600 text-white px-2 py-1 rounded font-mono font-bold text-sm">{String(timeLeft.days).padStart(2, '0')}d</span>
                <span className="bg-red-600 text-white px-2 py-1 rounded font-mono font-bold text-sm">{String(timeLeft.hours).padStart(2, '0')}h</span>
                <span className="bg-red-600 text-white px-2 py-1 rounded font-mono font-bold text-sm">{String(timeLeft.minutes).padStart(2, '0')}m</span>
                <span className="bg-red-600 text-white px-2 py-1 rounded font-mono font-bold text-sm animate-pulse">{String(timeLeft.seconds).padStart(2, '0')}s</span>
              </div>
            </div>
          )}
        </div>

        {/* Trial Banner */}
        {subscriptionStatus?.is_trial && (
          <Card className="border-0 shadow-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                  <Gift className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">🎁 Free Trial Active!</h3>
                  <p className="text-green-100">
                    {subscriptionStatus.trial_days_left} days remaining • Enjoy all premium features
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black">{subscriptionStatus.trial_days_left}</p>
                <p className="text-sm text-green-100">days left</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Subscription Required Alert */}
        {subscriptionStatus?.needs_subscription && (
          <Card className="border-0 shadow-xl border-l-4 border-l-red-500 bg-red-50">
            <CardContent className="p-6 flex items-center gap-4">
              <AlertCircle className="w-10 h-10 text-red-500" />
              <div>
                <h3 className="text-lg font-bold text-red-700">Trial Expired - Subscription Required</h3>
                <p className="text-red-600">Your 7-day trial has ended. Subscribe now to continue using BillByteKOT AI.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Free Trial Card */}
          <Card className="border-2 border-gray-200 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gray-300"></div>
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-gray-500" />
              </div>
              <CardTitle className="text-2xl">Free Trial</CardTitle>
              <p className="text-gray-500">Get started risk-free</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-5xl font-black text-gray-400">₹0</p>
                <p className="text-gray-500">for 7 days</p>
              </div>
              <ul className="space-y-3">
                {['7 Days Full Access', 'All Features Included', 'No Credit Card Required', 'Unlimited Bills (Trial)'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-4 border-t">
                <p className="text-center text-sm text-gray-500">
                  Bills used: <span className="font-bold">{subscriptionStatus?.bill_count || 0}</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Premium Card */}
          <Card className={`border-2 shadow-2xl relative overflow-hidden transform hover:scale-[1.02] transition-all ${
            subscriptionStatus?.subscription_active ? 'border-green-500' : 'border-violet-500'
          }`}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-600 to-purple-600"></div>
            {subscriptionStatus?.subscription_active ? (
              <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> ACTIVE
              </div>
            ) : (pricing?.campaign_active || subscriptionStatus?.needs_subscription) ? (
              <div className="absolute top-4 right-4 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                🔥 {pricing?.campaign_active ? 'LIMITED OFFER' : 'SPECIAL DEAL'}
              </div>
            ) : (
              <div className="absolute top-4 right-4 bg-gradient-to-r from-violet-500 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                ⭐ BEST VALUE
              </div>
            )}
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl flex items-center justify-center gap-2">
                Premium <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              </CardTitle>
              <p className="text-gray-500">Unlimited everything</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                {/* Dynamic Pricing from Backend - Only show campaign when ACTUALLY active */}
                {pricing?.campaign_active ? (
                  <>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-2xl text-gray-400 line-through">{pricing?.regular_price_display || '₹1999'}</span>
                      <span className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        {pricing?.campaign_discount_percent || 10}% OFF
                      </span>
                    </div>
                    <p className="text-6xl font-black bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                      {pricing?.campaign_price_display || '₹1799'}
                    </p>
                    <p className="text-gray-500">per year • Just ₹{Math.round((pricing?.campaign_price || 1799) / 12)}/month!</p>
                    <div className="mt-2 p-2 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200">
                      <p className="text-sm text-red-700 font-medium">
                        🎉 {pricing?.campaign_name || 'Special Offer'} - Save ₹{(pricing?.regular_price || 1999) - (pricing?.campaign_price || 1799)}!
                      </p>
                    </div>
                  </>
                ) : subscriptionStatus?.needs_subscription ? (
                  // Trial expired - show trial expired discount
                  <>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-2xl text-gray-400 line-through">{pricing?.regular_price_display || '₹1999'}</span>
                      <span className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        {pricing?.trial_expired_discount || 10}% OFF
                      </span>
                    </div>
                    <p className="text-6xl font-black bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                      {pricing?.trial_expired_price_display || '₹1799'}
                    </p>
                    <p className="text-gray-500">per year • Just ₹{Math.round((pricing?.trial_expired_price || 1799) / 12)}/month!</p>
                    <div className="mt-2 p-2 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200">
                      <p className="text-sm text-red-700 font-medium">
                        🎁 Trial Expired Offer - Save ₹{(pricing?.regular_price || 1999) - (pricing?.trial_expired_price || 1799)}!
                      </p>
                    </div>
                  </>
                ) : (
                  // Regular pricing - no campaign, no trial expired
                  <>
                    <p className="text-6xl font-black bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                      {pricing?.regular_price_display || '₹1999'}
                    </p>
                    <p className="text-gray-500">per year • Just ₹{Math.round((pricing?.regular_price || 1999) / 12)}/month</p>
                  </>
                )}
              </div>

              <ul className="space-y-3">
                {['Unlimited Bills Forever', 'All Premium Features', 'Priority 24/7 Support', 'Advanced AI Analytics', 'Multi-Device Access', 'Custom Integrations'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-violet-600" />
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
              {subscriptionStatus?.subscription_active ? (
                <div className="text-center space-y-2 pt-4 border-t">
                  <p className="text-green-600 font-bold flex items-center justify-center gap-2">
                    <Shield className="w-5 h-5" /> Subscription Active
                  </p>
                  {subscriptionStatus?.subscription_expires_at && (
                    <p className="text-sm text-gray-500">
                      Valid until: {new Date(subscriptionStatus.subscription_expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  )}
                </div>
              ) : (
                <Button onClick={handleSubscribe} disabled={loading}
                  className={`w-full h-14 text-lg font-bold shadow-lg ${
                    (pricing?.campaign_active || subscriptionStatus?.needs_subscription)
                      ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600' 
                      : 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700'
                  }`}>
                  <Rocket className="w-5 h-5 mr-2" />
                  {loading ? 'Processing...' : pricing?.campaign_active
                      ? `🎉 Get ${pricing?.campaign_price_display || '₹1799'}/Year Deal Now!`
                      : subscriptionStatus?.needs_subscription
                        ? `🎁 Get ${pricing?.trial_expired_discount || 10}% OFF - ${pricing?.trial_expired_price_display || '₹1799'}/year`
                        : `Subscribe Now - ${pricing?.regular_price_display || '₹1999'}/year`}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-center">Everything You Need to Succeed</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {features.map((feature, i) => (
              <Card key={i} className="border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto bg-gradient-to-br from-violet-100 to-purple-100 rounded-xl flex items-center justify-center mb-3">
                    <feature.icon className="w-6 h-6 text-violet-600" />
                  </div>
                  <h3 className="font-bold text-gray-900">{feature.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Why Choose Us */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-violet-50 to-purple-50">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-center mb-8">Why 10,000+ Restaurants Trust BillByteKOT AI</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-lg">30% More Efficient</h3>
                <p className="text-gray-600 text-sm">Restaurants report 30% faster billing and order management</p>
              </div>
              <div className="text-center space-y-3">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <HeadphonesIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-lg">24/7 Support</h3>
                <p className="text-gray-600 text-sm">Our team is always here to help you succeed</p>
              </div>
              <div className="text-center space-y-3">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-lg">100% Secure</h3>
                <p className="text-gray-600 text-sm">Bank-grade security for all your data</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Money Back Guarantee */}
        <div className="text-center space-y-4 py-8">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-100 text-green-700 rounded-full">
            <Shield className="w-5 h-5" />
            <span className="font-bold">30-Day Money Back Guarantee</span>
          </div>
          <p className="text-gray-600 max-w-xl mx-auto">
            Not satisfied? Get a full refund within 30 days, no questions asked. We're confident you'll love BillByteKOT AI.
          </p>
        </div>

        {/* FAQ */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { q: 'How long is the free trial?', a: `You get ${pricing?.trial_days || 7} days of full access to all premium features, no credit card required.` },
              { q: 'What happens after the trial?', a: `After your trial ends, you get a special ${pricing?.trial_expired_discount || 10}% discount - pay only ${pricing?.trial_expired_price_display || '₹1799'} instead of ${pricing?.regular_price_display || '₹1999'}!` },
              { q: 'What is the regular price?', a: `The regular subscription price is ${pricing?.regular_price_display || '₹1999'}/year. Special discounts may apply during campaigns or after trial expiry.` },
              { q: 'Can I cancel anytime?', a: 'Yes! Cancel anytime. We also offer a 30-day money-back guarantee.' },
              { q: 'Is my data secure?', a: 'Absolutely. We use bank-grade encryption and never share your data.' },
            ].map((faq, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-bold text-gray-900">{faq.q}</h4>
                <p className="text-gray-600 text-sm mt-1">{faq.a}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      )}
    </Layout>
  );
};

export default SubscriptionPage;
