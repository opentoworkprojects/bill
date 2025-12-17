import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import TrialBanner from '../components/TrialBanner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Settings as SettingsIcon, CreditCard, Shield, Info, Printer, Building2, MessageCircle } from 'lucide-react';
import PrintCustomization from '../components/PrintCustomization';
import WhatsAppDesktop from '../components/WhatsAppDesktop';
import ValidationAlert from '../components/ValidationAlert';

const SettingsPage = ({ user }) => {
  const [activeTab, setActiveTab] = useState('business');
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
    footer_message: 'Thank you for dining with us!',
    kot_mode_enabled: true, // KOT mode for restaurants with tables
    business_type: 'restaurant' // restaurant, stall, food-truck, takeaway-only
  });
  const [whatsappSettings, setWhatsappSettings] = useState({
    whatsapp_enabled: false,
    whatsapp_business_number: '',
    whatsapp_message_template: 'Thank you for dining at {restaurant_name}! Your bill of {currency}{total} has been paid. Order #{order_id}',
    whatsapp_auto_notify: false,
    whatsapp_notify_on_placed: true,
    whatsapp_notify_on_preparing: true,
    whatsapp_notify_on_ready: true,
    whatsapp_notify_on_completed: true,
    customer_self_order_enabled: false
  });
  const [themes, setThemes] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [businessLoading, setBusinessLoading] = useState(false);
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [razorpayConfigured, setRazorpayConfigured] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  useEffect(() => {
    fetchRazorpaySettings();
    fetchBusinessSettings();
    fetchThemes();
    fetchCurrencies();
    fetchWhatsappSettings();
  }, []);

  const fetchRazorpaySettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/settings/razorpay`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.razorpay_key_id) {
        setRazorpaySettings({
          razorpay_key_id: response.data.razorpay_key_id,
          razorpay_key_secret: '••••••••••••••••'
        });
      }
      setRazorpayConfigured(response.data.razorpay_configured);
    } catch (error) {
      console.error('Failed to fetch settings', error);
      if (error.response?.status === 403) {
        toast.error('Access denied. Please login again.');
      }
    }
  };

  const fetchBusinessSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/business/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.business_settings) {
        // Merge with defaults to ensure all fields exist
        setBusinessSettings(prevSettings => ({
          ...prevSettings,
          ...response.data.business_settings
        }));
      }
    } catch (error) {
      console.error('Failed to fetch business settings', error);
      if (error.response?.status === 403) {
        toast.error('Access denied. Please login again.');
      }
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

  const fetchWhatsappSettings = async () => {
    try {
      const response = await axios.get(`${API}/whatsapp/settings`);
      setWhatsappSettings({
        whatsapp_enabled: response.data.whatsapp_enabled || false,
        whatsapp_business_number: response.data.whatsapp_business_number || '',
        whatsapp_message_template: response.data.whatsapp_message_template || 'Thank you for dining at {restaurant_name}! Your bill of {currency}{total} has been paid. Order #{order_id}',
        whatsapp_auto_notify: response.data.whatsapp_auto_notify || false,
        whatsapp_notify_on_placed: response.data.whatsapp_notify_on_placed !== false,
        whatsapp_notify_on_preparing: response.data.whatsapp_notify_on_preparing !== false,
        whatsapp_notify_on_ready: response.data.whatsapp_notify_on_ready !== false,
        whatsapp_notify_on_completed: response.data.whatsapp_notify_on_completed !== false,
        customer_self_order_enabled: response.data.customer_self_order_enabled || false
      });
    } catch (error) {
      console.error('Failed to fetch WhatsApp settings', error);
    }
  };

  const handleSaveWhatsappSettings = async () => {
    setWhatsappLoading(true);
    try {
      await axios.put(`${API}/whatsapp/settings`, whatsappSettings);
      toast.success('WhatsApp settings updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update WhatsApp settings');
    } finally {
      setWhatsappLoading(false);
    }
  };

  const handleSaveBusinessSettings = async () => {
    const errors = [];
    
    if (!businessSettings.restaurant_name) {
      errors.push('Restaurant Name is required');
    }
    if (!businessSettings.phone) {
      errors.push('Phone Number is required');
    }
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      setTimeout(() => setValidationErrors([]), 5000);
      return;
    }
    
    setBusinessLoading(true);
    try {
      await axios.put(`${API}/business/settings`, businessSettings);
      toast.success('Business settings updated successfully!');
      // Update local storage user data
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      user.business_settings = businessSettings;
      localStorage.setItem('user', JSON.stringify(user));
      // Refresh settings from server to confirm
      await fetchBusinessSettings();
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
      <ValidationAlert errors={validationErrors} onClose={() => setValidationErrors([])} />
      <div className="space-y-6" data-testid="settings-page">
        <TrialBanner user={user} />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Settings</h1>
            <p className="text-gray-600 mt-2">Configure your restaurant billing system</p>
          </div>
          {window.electronAPI?.getVersion && (
            <div className="text-right">
              <p className="text-sm text-gray-500">Desktop App</p>
              <p className="text-lg font-bold text-violet-600">v{window.electronAPI.getVersion()}</p>
            </div>
          )}
        </div>

        {/* Settings Tabs */}
        <div className="flex flex-wrap gap-2 p-1 bg-gray-100 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('business')}
            className={`px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 ${
              activeTab === 'business' ? 'bg-white shadow text-violet-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Business Details
          </button>
          <button
            onClick={() => setActiveTab('print')}
            className={`px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 ${
              activeTab === 'print' ? 'bg-white shadow text-violet-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Printer className="w-4 h-4" />
            Print Customization
          </button>
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 ${
              activeTab === 'whatsapp' ? 'bg-white shadow text-green-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </button>
          <button
            onClick={() => setActiveTab('payment')}
            className={`px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 ${
              activeTab === 'payment' ? 'bg-white shadow text-violet-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Payment
          </button>

          {/* WhatsApp Pro tab - Only show in desktop app */}
          {(window.__ELECTRON__ || window.electronAPI) && (
            <button
              onClick={() => setActiveTab('whatsapp-desktop')}
              className={`px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 ${
                activeTab === 'whatsapp-desktop' ? 'bg-white shadow text-green-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp Pro
            </button>
          )}
        </div>

        {/* Print Customization Tab */}
        {activeTab === 'print' && (
          <PrintCustomization 
            businessSettings={businessSettings} 
            onUpdate={(updated) => setBusinessSettings(updated)}
          />
        )}

        {/* WhatsApp Tab */}
        {activeTab === 'whatsapp' && (
          <div className="space-y-6">
            {/* Basic WhatsApp Settings */}
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                  WhatsApp Integration
                </CardTitle>
                <CardDescription>
                  Send receipts and live order updates to customers via WhatsApp
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Enable WhatsApp Sharing</p>
                    <p className="text-sm text-gray-500">Allow manual sharing of receipts via WhatsApp</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={whatsappSettings.whatsapp_enabled}
                      onChange={(e) => setWhatsappSettings({ ...whatsappSettings, whatsapp_enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>

                <div>
                  <Label>Your WhatsApp Business Number</Label>
                  <Input
                    placeholder="+91 9876543210"
                    value={whatsappSettings.whatsapp_business_number}
                    onChange={(e) => setWhatsappSettings({ ...whatsappSettings, whatsapp_business_number: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Auto Notifications */}
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🔔 Auto Notifications
                </CardTitle>
                <CardDescription>
                  Automatically send WhatsApp updates when order status changes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <p className="font-medium text-green-800">Enable Auto Notifications</p>
                    <p className="text-sm text-green-600">Send automatic WhatsApp messages on order updates</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={whatsappSettings.whatsapp_auto_notify}
                      onChange={(e) => setWhatsappSettings({ ...whatsappSettings, whatsapp_auto_notify: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>

                {whatsappSettings.whatsapp_auto_notify && (
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                      <input
                        type="checkbox"
                        checked={whatsappSettings.whatsapp_notify_on_placed}
                        onChange={(e) => setWhatsappSettings({ ...whatsappSettings, whatsapp_notify_on_placed: e.target.checked })}
                        className="w-4 h-4 text-green-600 rounded"
                      />
                      <div>
                        <p className="font-medium text-sm">✅ Order Placed</p>
                        <p className="text-xs text-gray-500">Confirmation message</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                      <input
                        type="checkbox"
                        checked={whatsappSettings.whatsapp_notify_on_preparing}
                        onChange={(e) => setWhatsappSettings({ ...whatsappSettings, whatsapp_notify_on_preparing: e.target.checked })}
                        className="w-4 h-4 text-green-600 rounded"
                      />
                      <div>
                        <p className="font-medium text-sm">👨‍🍳 Preparing</p>
                        <p className="text-xs text-gray-500">Chef started cooking</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                      <input
                        type="checkbox"
                        checked={whatsappSettings.whatsapp_notify_on_ready}
                        onChange={(e) => setWhatsappSettings({ ...whatsappSettings, whatsapp_notify_on_ready: e.target.checked })}
                        className="w-4 h-4 text-green-600 rounded"
                      />
                      <div>
                        <p className="font-medium text-sm">🔔 Ready</p>
                        <p className="text-xs text-gray-500">Food is ready to serve</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                      <input
                        type="checkbox"
                        checked={whatsappSettings.whatsapp_notify_on_completed}
                        onChange={(e) => setWhatsappSettings({ ...whatsappSettings, whatsapp_notify_on_completed: e.target.checked })}
                        className="w-4 h-4 text-green-600 rounded"
                      />
                      <div>
                        <p className="font-medium text-sm">💳 Completed</p>
                        <p className="text-xs text-gray-500">Payment receipt</p>
                      </div>
                    </label>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Customer Self-Order & QR */}
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📱 Customer Self-Order & Live Tracking
                </CardTitle>
                <CardDescription>
                  Let customers scan QR to order and track their order live
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div>
                    <p className="font-medium text-blue-800">Enable Customer Self-Ordering</p>
                    <p className="text-sm text-blue-600">Customers can scan QR code to view menu and place orders</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={whatsappSettings.customer_self_order_enabled}
                      onChange={(e) => setWhatsappSettings({ ...whatsappSettings, customer_self_order_enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {whatsappSettings.customer_self_order_enabled && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium mb-2">📍 Customer Features:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Scan table QR → View menu → Place order</li>
                      <li>• Get WhatsApp updates on order status</li>
                      <li>• Track order live via tracking link</li>
                    </ul>
                    <p className="text-xs text-green-600 mt-3 font-medium">✓ QR codes auto-generated using your current URL</p>
                    <p className="text-xs text-gray-500">Go to Tables page to generate & print QR codes for each table</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Message Template */}
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Receipt Message Template</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <textarea
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[100px] font-mono text-sm"
                  value={whatsappSettings.whatsapp_message_template}
                  onChange={(e) => setWhatsappSettings({ ...whatsappSettings, whatsapp_message_template: e.target.value })}
                  placeholder="Thank you for dining at {restaurant_name}!"
                />
                <div className="flex flex-wrap gap-2">
                  {['{restaurant_name}', '{currency}', '{total}', '{order_id}', '{customer_name}', '{table_number}'].map((v) => (
                    <code key={v} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">{v}</code>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleSaveWhatsappSettings}
              disabled={whatsappLoading}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600"
            >
              {whatsappLoading ? 'Saving...' : 'Save All WhatsApp Settings'}
            </Button>
          </div>
        )}

        {/* Payment Tab */}
        {activeTab === 'payment' && (
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
        )}

        {/* Business Tab */}
        {activeTab === 'business' && (
        <>
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
          <CardContent className="space-y-6">
            {/* Business Type & KOT Mode Toggle */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Business Type & KOT Mode</h3>
                  <p className="text-sm text-gray-600">
                    Configure how your business operates. KOT mode is for restaurants with table service.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Business Type Selection */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Business Type</Label>
                  <select
                    value={businessSettings.business_type || 'restaurant'}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setBusinessSettings({ 
                        ...businessSettings, 
                        business_type: newType,
                        // Auto-disable KOT for non-restaurant types
                        kot_mode_enabled: newType === 'restaurant' ? businessSettings.kot_mode_enabled : false
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="restaurant">🍽️ Restaurant (Dine-in with tables)</option>
                    <option value="stall">🏪 Food Stall (Counter service)</option>
                    <option value="food-truck">🚚 Food Truck (Mobile service)</option>
                    <option value="takeaway-only">📦 Takeaway Only (No dine-in)</option>
                    <option value="cafe">☕ Cafe (Mixed service)</option>
                    <option value="cloud-kitchen">🏠 Cloud Kitchen (Delivery only)</option>
                  </select>
                </div>

                {/* KOT Mode Toggle */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">KOT Mode</Label>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-md border border-gray-200">
                    <button
                      onClick={() => setBusinessSettings({ ...businessSettings, kot_mode_enabled: !businessSettings.kot_mode_enabled })}
                      disabled={businessSettings.business_type !== 'restaurant' && businessSettings.business_type !== 'cafe'}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        businessSettings.kot_mode_enabled 
                          ? 'bg-blue-600' 
                          : 'bg-gray-300'
                      } ${
                        (businessSettings.business_type !== 'restaurant' && businessSettings.business_type !== 'cafe')
                          ? 'opacity-50 cursor-not-allowed'
                          : 'cursor-pointer'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          businessSettings.kot_mode_enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {businessSettings.kot_mode_enabled ? 'Enabled' : 'Disabled'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {businessSettings.kot_mode_enabled 
                          ? 'Table & KOT management active'
                          : 'Simple billing only'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Message */}
              <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-100">
                <div className="flex gap-2">
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-800">
                    {businessSettings.kot_mode_enabled ? (
                      <>
                        <strong>KOT Mode Enabled:</strong> Customers must select a table when ordering. 
                        Orders are sent to kitchen displays. Best for dine-in restaurants.
                      </>
                    ) : (
                      <>
                        <strong>Simple Billing Mode:</strong> No table selection required. 
                        Direct billing without KOT. Perfect for stalls, food trucks, and takeaway-only businesses.
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

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
        </>
        )}



        {/* WhatsApp Desktop Tab */}
        {activeTab === 'whatsapp-desktop' && (
          <WhatsAppDesktop isElectron={!!window.electronAPI?.isElectron} />
        )}
      </div>
    </Layout>
  );
};

export default SettingsPage;
