import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { 
  Crown, CheckCircle, AlertCircle, Sparkles, Zap, Shield, 
  Clock, Gift, Star, TrendingUp, Users, Printer, BarChart3,
  Smartphone, Globe, HeadphonesIcon, Rocket, Tag, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SubscriptionPage = ({ user }) => {
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await axios.get(`${API}/subscription/status`);
      setSubscriptionStatus(response.data);
    } catch (error) {
      toast.error('Failed to fetch subscription status');
    }
  };

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    setValidatingCoupon(true);
    try {
      const response = await axios.post(`${API}/subscription/validate-coupon`, {
        coupon_code: couponCode
      });
      setCouponApplied(response.data);
      toast.success(`🎉 Coupon applied! ${response.data.description}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid coupon code');
      setCouponApplied(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setCouponApplied(null);
    toast.info('Coupon removed');
  };

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/subscription/create-order`, {
        coupon_code: couponApplied ? couponApplied.coupon_code : null
      });
      
      const finalAmount = response.data.amount;
      const discountInfo = response.data.coupon_applied 
        ? ` (${response.data.coupon_applied.discount_display} discount applied!)` 
        : '';
      
      const options = {
        key: response.data.key_id,
        amount: finalAmount,
        currency: response.data.currency,
        order_id: response.data.razorpay_order_id,
        name: 'BillByteKOT AI',
        description: `Premium Subscription - 1 Year${discountInfo}`,
        handler: async (razorpayResponse) => {
          try {
            await axios.post(`${API}/subscription/verify`, {
              razorpay_payment_id: razorpayResponse.razorpay_payment_id,
              razorpay_order_id: razorpayResponse.razorpay_order_id,
              razorpay_signature: razorpayResponse.razorpay_signature
            });
            toast.success('🎉 Premium activated! Welcome to BillByteKOT AI Pro!');
            fetchSubscriptionStatus();
            // Update local user data
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            userData.subscription_active = true;
            localStorage.setItem('user', JSON.stringify(userData));
            setTimeout(() => navigate('/dashboard'), 2000);
          } catch (error) {
            toast.error(error.response?.data?.detail || 'Subscription verification failed');
          }
        },
        theme: { color: '#7c3aed' }
      };
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create subscription order');
    } finally {
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
      <div className="max-w-6xl mx-auto space-y-8" data-testid="subscription-page">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-100 text-violet-700 rounded-full text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            Special Launch Offer
          </div>
          <h1 className="text-5xl font-black bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-transparent" 
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Upgrade to Premium
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Unlock unlimited potential for your restaurant with our powerful features
          </p>
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

        {/* Special Offers Banner */}
        {!subscriptionStatus?.subscription_active && (
          <Card className="border-0 shadow-xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Gift className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">🎉 Limited Time Offers!</h3>
                    <p className="text-orange-100">Use coupon codes to save up to 50% on your subscription</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['LAUNCH50', 'WELCOME25', 'TEST1RS'].map((code) => (
                    <button
                      key={code}
                      onClick={async () => {
                        setCouponCode(code);
                        setValidatingCoupon(true);
                        try {
                          const response = await axios.post(`${API}/subscription/validate-coupon`, {
                            coupon_code: code
                          });
                          setCouponApplied(response.data);
                          toast.success(`🎉 ${code} applied! ${response.data.description}`);
                        } catch (error) {
                          toast.error('Failed to apply coupon');
                        } finally {
                          setValidatingCoupon(false);
                        }
                      }}
                      className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-bold transition-all border border-white/30"
                    >
                      {code}
                    </button>
                  ))}
                </div>
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
            ) : (
              <div className="absolute top-4 right-4 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                🔥 BEST VALUE
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
                {couponApplied ? (
                  <>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl text-gray-400 line-through">{couponApplied.original_price_display}</span>
                      <span className="bg-green-100 text-green-600 px-2 py-0.5 rounded text-sm font-bold">
                        {couponApplied.discount_percent}% OFF
                      </span>
                    </div>
                    <p className="text-6xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      {couponApplied.final_price_display}
                    </p>
                    <p className="text-gray-500">per year • Just ₹{Math.round(couponApplied.final_price / 100 / 12)}/month</p>
                    <div className="mt-2 p-2 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-green-700 font-medium">
                        🎉 {couponApplied.description} - Save {couponApplied.discount_display}!
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-6xl font-black bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                      ₹999
                    </p>
                    <p className="text-gray-500">per year • Just ₹83/month</p>
                  </>
                )}
              </div>

              {/* Coupon Code Section */}
              {!subscriptionStatus?.subscription_active && (
                <div className="space-y-3 p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg border border-violet-200">
                  <Label className="flex items-center gap-2 text-sm font-semibold text-violet-700">
                    <Tag className="w-4 h-4" />
                    Have a coupon code?
                  </Label>
                  {couponApplied ? (
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-green-500">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-bold text-green-700">{couponApplied.coupon_code}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveCoupon}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter code (e.g., LAUNCH50)"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="flex-1"
                        onKeyPress={(e) => e.key === 'Enter' && handleValidateCoupon()}
                      />
                      <Button
                        onClick={handleValidateCoupon}
                        disabled={validatingCoupon || !couponCode.trim()}
                        variant="outline"
                        className="border-violet-300 text-violet-700 hover:bg-violet-50"
                      >
                        {validatingCoupon ? 'Checking...' : 'Apply'}
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 text-center">
                    Try: LAUNCH50, WELCOME25, SAVE100, EARLYBIRD, FIRSTYEAR, TEST1RS
                  </p>
                </div>
              )}

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
                  className="w-full h-14 text-lg font-bold bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg">
                  <Rocket className="w-5 h-5 mr-2" />
                  {loading ? 'Processing...' : couponApplied 
                    ? `Subscribe Now - ${couponApplied.final_price_display}/year` 
                    : 'Subscribe Now - ₹999/year'}
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
              { q: 'How long is the free trial?', a: 'You get 7 days of full access to all premium features, no credit card required.' },
              { q: 'What happens after the trial?', a: 'After 7 days, you can subscribe for ₹999/year or continue with limited features.' },
              { q: 'Do you have any discount codes?', a: 'Yes! Try these codes: LAUNCH50 (50% off), WELCOME25 (25% off), SAVE100 (₹100 off), EARLYBIRD (30% off), FIRSTYEAR (40% off), or TEST1RS (₹1 for testing). Enter the code during checkout!' },
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
    </Layout>
  );
};

export default SubscriptionPage;
