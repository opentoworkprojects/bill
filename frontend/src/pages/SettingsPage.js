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
  const [businessSettings, setBusinessSettings] = useState({
    restaurant_name: '',
    address: '',
    phone: '',
    email: '',
    gstin: '',
    fssai: '',
    currency: 'INR',
    tax_rate: 5.0,
    receipt_theme: 'classic',
    logo_url: '',
    website: '',
    tagline: '',
    footer_message: 'Thank you for dining with us!'
  });
  const [themes, setThemes] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [businessLoading, setBusinessLoading] = useState(false);
  const [razorpayConfigured, setRazorpayConfigured] = useState(false);

  useEffect(() => {
    fetchRazorpaySettings();
    fetchBusinessSettings();
    fetchThemes();
    fetchCurrencies();
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

  const fetchBusinessSettings = async () => {
    try {
      const response = await axios.get(`${API}/business/settings`);
      if (response.data.business_settings) {
        setBusinessSettings({
          ...businessSettings,
          ...response.data.business_settings
        });
      }
    } catch (error) {
      console.error('Failed to fetch business settings', error);
    }
  };

  const fetchThemes = async () => {
    try {
      const response = await axios.get(`${API}/receipt-themes`);
      setThemes(response.data);
    } catch (error) {
      console.error('Failed to fetch themes', error);
    }
  };

  const fetchCurrencies = async () => {
    try {
      const response = await axios.get(`${API}/currencies`);
      setCurrencies(response.data);
    } catch (error) {
      console.error('Failed to fetch currencies', error);
    }
  };

  const handleSaveBusinessSettings = async () => {
    if (!businessSettings.restaurant_name || !businessSettings.phone) {
      toast.error('Restaurant name and phone are required');
      return;
    }
    
    setBusinessLoading(true);
    try {
      await axios.put(`${API}/business/settings`, businessSettings);
      toast.success('Business settings updated successfully!');
      // Refresh user data
      window.location.reload();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update settings');
    } finally {
      setBusinessLoading(false);
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
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-violet-600" />
              Business Details
            </CardTitle>
            <CardDescription>
              Update your restaurant information and receipt settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Restaurant Name *</Label>
                <Input
                  value={businessSettings.restaurant_name}
                  onChange={(e) => setBusinessSettings({ ...businessSettings, restaurant_name: e.target.value })}
                  placeholder="Your Restaurant Name"
                />
              </div>

              <div>
                <Label>Phone Number *</Label>
                <Input
                  value={businessSettings.phone}
                  onChange={(e) => setBusinessSettings({ ...businessSettings, phone: e.target.value })}
                  placeholder="+91 1234567890"
                />
              </div>

              <div className="md:col-span-2">
                <Label>Address</Label>
                <Input
                  value={businessSettings.address}
                  onChange={(e) => setBusinessSettings({ ...businessSettings, address: e.target.value })}
                  placeholder="Street, City, State, PIN"
                />
              </div>

              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={businessSettings.email}
                  onChange={(e) => setBusinessSettings({ ...businessSettings, email: e.target.value })}
                  placeholder="restaurant@example.com"
                />
              </div>

              <div>
                <Label>Website</Label>
                <Input
                  value={businessSettings.website}
                  onChange={(e) => setBusinessSettings({ ...businessSettings, website: e.target.value })}
                  placeholder="www.yourrestaurant.com"
                />
              </div>

              <div>
                <Label>GSTIN</Label>
                <Input
                  value={businessSettings.gstin}
                  onChange={(e) => setBusinessSettings({ ...businessSettings, gstin: e.target.value })}
                  placeholder="22AAAAA0000A1Z5"
                />
              </div>

              <div>
                <Label>FSSAI License</Label>
                <Input
                  value={businessSettings.fssai}
                  onChange={(e) => setBusinessSettings({ ...businessSettings, fssai: e.target.value })}
                  placeholder="12345678901234"
                />
              </div>

              <div className="md:col-span-2">
                <Label>Tagline</Label>
                <Input
                  value={businessSettings.tagline}
                  onChange={(e) => setBusinessSettings({ ...businessSettings, tagline: e.target.value })}
                  placeholder="Delicious food, memorable moments"
                />
              </div>

              <div className="md:col-span-2">
                <Label>Receipt Footer Message</Label>
                <Input
                  value={businessSettings.footer_message}
                  onChange={(e) => setBusinessSettings({ ...businessSettings, footer_message: e.target.value })}
                  placeholder="Thank you for dining with us!"
                />
              </div>

              <div>
                <Label>Currency</Label>
                <select
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                  value={businessSettings.currency}
                  onChange={(e) => setBusinessSettings({ ...businessSettings, currency: e.target.value })}
                >
                  {currencies.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.code}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Tax Rate (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={businessSettings.tax_rate}
                  onChange={(e) => setBusinessSettings({ ...businessSettings, tax_rate: parseFloat(e.target.value) })}
                  placeholder="5.0"
                />
              </div>
            </div>

            <div>
              <Label className="mb-3 block">Thermal Print Format</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setBusinessSettings({ ...businessSettings, receipt_theme: theme.id })}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      businessSettings.receipt_theme === theme.id
                        ? 'border-violet-600 bg-violet-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium text-sm">{theme.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{theme.description}</p>
                    <p className="text-xs text-violet-600 mt-1 font-medium">{theme.width}</p>
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleSaveBusinessSettings}
              disabled={businessLoading}
              className="w-full bg-gradient-to-r from-violet-600 to-purple-600"
            >
              {businessLoading ? 'Saving...' : 'Save Business Settings'}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
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
              <div>
                <p className="text-sm text-gray-500">Bill Count</p>
                <p className="font-medium">{user?.bill_count || 0} / 50</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default SettingsPage;
