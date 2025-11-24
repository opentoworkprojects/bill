import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Settings as SettingsIcon, CreditCard, Shield, Info } from 'lucide-react';

const SettingsPage = ({ user }) => {
  const [razorpaySettings, setRazorpaySettings] = useState({
    razorpay_key_id: '',
    razorpay_key_secret: ''
  });
  const [loading, setLoading] = useState(false);
  const [razorpayConfigured, setRazorpayConfigured] = useState(false);

  useEffect(() => {
    fetchRazorpaySettings();
  }, []);

  const fetchRazorpaySettings = async () => {
    try {
      const response = await axios.get(`${API}/settings/razorpay`);
      if (response.data.razorpay_key_id) {
        setRazorpaySettings({
          razorpay_key_id: response.data.razorpay_key_id,
          razorpay_key_secret: '••••••••••••••••'
        });
      }
      setRazorpayConfigured(response.data.razorpay_configured);
    } catch (error) {
      console.error('Failed to fetch settings', error);
    }
  };

  const handleSaveRazorpay = async () => {
    if (!razorpaySettings.razorpay_key_id || !razorpaySettings.razorpay_key_secret) {
      toast.error('Please fill all fields');
      return;
    }
    if (razorpaySettings.razorpay_key_secret === '••••••••••••••••') {
      toast.error('Please enter actual secret key');
      return;
    }
    
    setLoading(true);
    try {
      await axios.post(`${API}/settings/razorpay`, razorpaySettings);
      toast.success('Razorpay settings saved successfully!');
      fetchRazorpaySettings();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <Layout user={user}>
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500">Only admin can access settings</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user}>
      <div className="space-y-6" data-testid="settings-page">
        <div>
          <h1 className="text-4xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Settings</h1>
          <p className="text-gray-600 mt-2">Configure your restaurant billing system</p>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-violet-600" />
              Razorpay Integration
            </CardTitle>
            <CardDescription>
              Configure your own Razorpay account for accepting payments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">How to get Razorpay Keys:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Sign up at <a href="https://dashboard.razorpay.com/signup" target="_blank" rel="noopener noreferrer" className="underline font-medium">dashboard.razorpay.com</a></li>
                  <li>Complete KYC verification</li>
                  <li>Go to Settings → API Keys</li>
                  <li>Generate Test/Live keys and paste below</li>
                </ol>
              </div>
            </div>

            {razorpayConfigured && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Razorpay is configured and active
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label>Razorpay Key ID</Label>
                <Input
                  placeholder="rzp_test_xxxxxxxxxxxxx"
                  value={razorpaySettings.razorpay_key_id}
                  onChange={(e) => setRazorpaySettings({ ...razorpaySettings, razorpay_key_id: e.target.value })}
                  data-testid="razorpay-key-id-input"
                />
              </div>

              <div>
                <Label>Razorpay Key Secret</Label>
                <Input
                  type="password"
                  placeholder="Enter secret key"
                  value={razorpaySettings.razorpay_key_secret}
                  onChange={(e) => setRazorpaySettings({ ...razorpaySettings, razorpay_key_secret: e.target.value })}
                  data-testid="razorpay-key-secret-input"
                />
                <p className="text-xs text-gray-500 mt-1">Your secret key is encrypted and stored securely</p>
              </div>

              <Button
                onClick={handleSaveRazorpay}
                disabled={loading}
                className="bg-gradient-to-r from-violet-600 to-purple-600"
                data-testid="save-razorpay-button"
              >
                {loading ? 'Saving...' : 'Save Razorpay Settings'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Restaurant Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Restaurant Name</p>
                <p className="font-medium">{user?.restaurant_name || 'Not set'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Admin Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Username</p>
                <p className="font-medium">{user?.username}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="font-medium capitalize">{user?.role}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default SettingsPage;
