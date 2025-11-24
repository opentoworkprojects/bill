import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Crown, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SubscriptionPage = ({ user }) => {
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [loading, setLoading] = useState(false);
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

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/subscription/create-order`);

      const options = {
        key: response.data.key_id,
        amount: response.data.amount,
        currency: response.data.currency,
        order_id: response.data.razorpay_order_id,
        name: 'RestoBill AI',
        description: 'Annual Subscription - Unlimited Bills',
        handler: async (razorpayResponse) => {
          try {
            await axios.post(`${API}/subscription/verify`, {
              razorpay_payment_id: razorpayResponse.razorpay_payment_id,
              razorpay_order_id: razorpayResponse.razorpay_order_id
            });
            toast.success('Subscription activated! Thank you!');
            fetchSubscriptionStatus();
            setTimeout(() => navigate('/dashboard'), 2000);
          } catch (error) {
            toast.error('Subscription verification failed');
          }
        },
        theme: {
          color: '#7c3aed'
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create subscription order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout user={user}>
      <div className="max-w-4xl mx-auto space-y-6" data-testid="subscription-page">
        <div className="text-center">
          <h1 className="text-4xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Subscription</h1>
          <p className="text-gray-600 mt-2">Manage your RestoBill AI subscription</p>
        </div>

        {subscriptionStatus?.needs_subscription && (
          <Card className="border-0 shadow-xl border-l-4 border-l-orange-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <AlertCircle className="w-6 h-6" />
                Subscription Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                You have reached the limit of 50 free bills. Please subscribe to continue using RestoBill AI.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-0 shadow-lg opacity-60">
            <CardHeader>
              <CardTitle className="text-center">Free Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-gray-400">₹0</p>
                <p className="text-sm text-gray-500">First 50 Bills</p>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>50 Bills Maximum</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>All Basic Features</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>AI Features</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Reports & Analytics</span>
                </li>
              </ul>
              <div className="text-center">
                <p className="text-sm text-gray-600">Bills used: {subscriptionStatus?.bill_count || 0} / 50</p>
              </div>
            </CardContent>
          </Card>

          <Card className={`border-0 shadow-xl relative overflow-hidden ${subscriptionStatus?.subscription_active ? 'border-2 border-violet-500' : ''}`}>
            {subscriptionStatus?.subscription_active && (
              <div className="absolute top-0 right-0 bg-gradient-to-r from-violet-600 to-purple-600 text-white px-4 py-1 text-xs font-medium rounded-bl-lg">
                ACTIVE
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-center flex items-center justify-center gap-2">
                <Crown className="w-6 h-6 text-yellow-500" />
                Premium Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-5xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">₹99</p>
                <p className="text-sm text-gray-500">Per Year</p>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-violet-600" />
                  <span className="font-medium">Unlimited Bills</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-violet-600" />
                  <span>All Premium Features</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-violet-600" />
                  <span>Priority Support</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-violet-600" />
                  <span>Custom Razorpay Integration</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-violet-600" />
                  <span>Advanced AI Analytics</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-violet-600" />
                  <span>Multi-device Support</span>
                </li>
              </ul>

              {subscriptionStatus?.subscription_active ? (
                <div className="text-center space-y-2">
                  <p className="text-sm text-green-600 font-medium">Active Subscription</p>
                  {subscriptionStatus?.subscription_expires_at && (
                    <p className="text-xs text-gray-500">
                      Expires: {new Date(subscriptionStatus.subscription_expires_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ) : (
                <Button
                  onClick={handleSubscribe}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-violet-600 to-purple-600 h-12 text-lg"
                  data-testid="subscribe-button"
                >
                  {loading ? 'Processing...' : 'Subscribe Now'}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Why Subscribe?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-violet-50 rounded-lg">
                <h3 className="font-semibold text-violet-900 mb-2">Unlimited Growth</h3>
                <p className="text-sm text-gray-700">No limits on bills. Grow your business without restrictions.</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h3 className="font-semibold text-purple-900 mb-2">Cost Effective</h3>
                <p className="text-sm text-gray-700">Just ₹99/year. Less than ₹8.25 per month!</p>
              </div>
              <div className="p-4 bg-pink-50 rounded-lg">
                <h3 className="font-semibold text-pink-900 mb-2">Premium Features</h3>
                <p className="text-sm text-gray-700">Access all advanced features and integrations.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default SubscriptionPage;
