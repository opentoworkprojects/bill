import { useState, useRef } from 'react';
import axios from 'axios';
import { API } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { 
  Users, Ticket, TrendingUp, Shield, 
  CheckCircle, Clock, XCircle, UserPlus, Calendar, CreditCard,
  Mail, FileText, Upload, RefreshCw, Lock, Download, Eye, X,
  Smartphone, Monitor, Package, Plus, Trash2, Edit, ExternalLink,
  Database, HardDrive, Tag, Gift, Percent, DollarSign, Bell, Send, MessageSquare
} from 'lucide-react';

const SuperAdminPage = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [userType, setUserType] = useState(null); // 'super-admin' or 'team'
  const [teamUser, setTeamUser] = useState(null);
  const [teamToken, setTeamToken] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [leads, setLeads] = useState([]);
  const [leadsStats, setLeadsStats] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamStats, setTeamStats] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [showCreateLead, setShowCreateLead] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [subscriptionMonths, setSubscriptionMonths] = useState(12);
  const [subscriptionAmount, setSubscriptionAmount] = useState(999);
  const [paymentId, setPaymentId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('manual');
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [sendInvoice, setSendInvoice] = useState(true);
  const [newLead, setNewLead] = useState({ name: '', email: '', phone: '', businessName: '', notes: '' });
  const [newTeamMember, setNewTeamMember] = useState({ 
    username: '', email: '', password: '', role: 'sales', permissions: [], full_name: '', phone: '' 
  });
  const [editingTeamMember, setEditingTeamMember] = useState(null);
  const [showEditTeamModal, setShowEditTeamModal] = useState(false);
  const [appVersions, setAppVersions] = useState([]);
  const [showAppVersionModal, setShowAppVersionModal] = useState(false);
  const [editingVersion, setEditingVersion] = useState(null);
  const [newAppVersion, setNewAppVersion] = useState({
    platform: 'android',
    version: '',
    version_code: 1,
    download_url: '',
    release_notes: '',
    min_supported_version: '',
    is_mandatory: false,
    file_size: ''
  });
  const [appFile, setAppFile] = useState(null);
  const [uploadingApp, setUploadingApp] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const appFileRef = useRef(null);

  // Sale/Offer Day Feature
  const [saleOffer, setSaleOffer] = useState({
    enabled: false,
    title: '',
    subtitle: '',
    discount_text: '',
    badge_text: '',
    bg_color: 'from-red-500 to-orange-500',
    end_date: '',
    valid_until: '', // Exact datetime when offer expires
    theme: 'default', // Theme: default, diwali, christmas, newyear, flash, blackfriday, summer, republic, holi
    banner_design: 'gradient-wave', // Top banner design
    discount_percent: 20,
    original_price: 1999,
    sale_price: 1599,
    cta_text: 'Grab This Deal Now!',
    urgency_text: '⚡ Limited slots available. Offer ends soon!'
  });
  const [showSaleOfferModal, setShowSaleOfferModal] = useState(false);
  const [savingSaleOffer, setSavingSaleOffer] = useState(false);

  // Pricing Management
  const [pricing, setPricing] = useState({
    regular_price: 1999,
    regular_price_display: '₹1999',
    campaign_price: 1799,
    campaign_price_display: '₹1799',
    campaign_active: false,
    campaign_name: '',
    campaign_discount_percent: 10,
    campaign_start_date: '',
    campaign_end_date: '',
    trial_expired_discount: 10,
    trial_days: 7,
    subscription_months: 12
  });
  const [savingPricing, setSavingPricing] = useState(false);
  const [showBusinessDetails, setShowBusinessDetails] = useState(false);
  const [businessDetails, setBusinessDetails] = useState(null);
  const [businessDetailsLoading, setBusinessDetailsLoading] = useState(false);
  const [exportingData, setExportingData] = useState(null);
  const [exportingDb, setExportingDb] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importUserId, setImportUserId] = useState(null);
  const [importUsername, setImportUsername] = useState('');
  const [importFile, setImportFile] = useState(null);
  const [importReplaceMode, setImportReplaceMode] = useState(false);
  const [importing, setImporting] = useState(false);
  const importFileRef = useRef(null);
  const invoiceRef = useRef(null);

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [notificationTemplates, setNotificationTemplates] = useState([]);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'info',
    target: 'all',
    target_users: [],
    action_url: '',
    action_label: '',
    priority: 'normal',
    expires_at: ''
  });
  const [sendingNotification, setSendingNotification] = useState(false);
  const [pushStats, setPushStats] = useState({ 
    active_subscriptions: 0, total_subscriptions: 0, recent_subscriptions: [] 
  });

  // Generate invoice number with format: BBK/2025-26/INV/0001
  const generateInvoiceNumber = (existingInvoiceNo = null) => {
    if (existingInvoiceNo) return existingInvoiceNo;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const fiscalYear = month >= 4 ? `${year}-${(year + 1).toString().slice(-2)}` : `${year - 1}-${year.toString().slice(-2)}`;
    const timestamp = Date.now().toString().slice(-6);
    return `BBK/${fiscalYear}/INV/${timestamp}`;
  };

  // Convert number to words for Indian currency
  const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (num === 0) return 'Zero';
    
    const convertLessThanThousand = (n) => {
      if (n === 0) return '';
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
      return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertLessThanThousand(n % 100) : '');
    };
    
    const intPart = Math.floor(num);
    const decPart = Math.round((num - intPart) * 100);
    let result = '';
    
    if (intPart >= 10000000) {
      result += convertLessThanThousand(Math.floor(intPart / 10000000)) + ' Crore ';
      num = intPart % 10000000;
    }
    if (intPart >= 100000) {
      result += convertLessThanThousand(Math.floor((intPart % 10000000) / 100000)) + ' Lakh ';
    }
    if (intPart >= 1000) {
      result += convertLessThanThousand(Math.floor((intPart % 100000) / 1000)) + ' Thousand ';
    }
    result += convertLessThanThousand(intPart % 1000);
    result = result.trim() + ' Rupees';
    
    if (decPart > 0) {
      result += ' and ' + convertLessThanThousand(decPart) + ' Paise';
    }
    return result + ' Only';
  };

  // Check if team member has specific permission
  const hasPermission = (permission) => {
    if (userType === 'super-admin') return true;
    if (!teamUser) return false;
    return teamUser.permissions?.includes(permission) || false;
  };

  // Get available tabs based on user type and permissions
  const getAvailableTabs = () => {
    if (userType === 'super-admin') {
      return ['dashboard', 'users', 'leads', 'team', 'tickets', 'analytics', 'app-versions', 'promotions', 'pricing', 'notifications'];
    }
    const tabs = [];
    if (hasPermission('analytics')) tabs.push('dashboard');
    if (hasPermission('users')) tabs.push('users');
    if (hasPermission('leads')) tabs.push('leads');
    if (hasPermission('tickets')) tabs.push('tickets');
    return tabs.length > 0 ? tabs : ['tickets']; // Default to tickets if no permissions
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // First try super admin login
      const response = await axios.get(`${API}/super-admin/dashboard`, {
        params: credentials
      });
      setDashboard(response.data);
      setUserType('super-admin');
      setAuthenticated(true);
      toast.success('Super Admin access granted');
      fetchAllData();
    } catch (superAdminError) {
      // If super admin fails, try team member login
      try {
        const teamResponse = await axios.post(`${API}/team/login`, {
          username: credentials.username,
          password: credentials.password
        });
        setTeamToken(teamResponse.data.token);
        setTeamUser(teamResponse.data.user);
        setUserType('team');
        setAuthenticated(true);
        const availableTabs = getAvailableTabsForUser(teamResponse.data.user);
        setActiveTab(availableTabs[0] || 'tickets');
        toast.success(`Welcome ${teamResponse.data.user.full_name || teamResponse.data.user.username}!`);
        fetchTeamData(teamResponse.data.token, teamResponse.data.user);
      } catch (teamError) {
        toast.error('Invalid credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  const getAvailableTabsForUser = (user) => {
    const tabs = [];
    if (user.permissions?.includes('analytics')) tabs.push('dashboard');
    if (user.permissions?.includes('users')) tabs.push('users');
    if (user.permissions?.includes('leads')) tabs.push('leads');
    if (user.permissions?.includes('tickets')) tabs.push('tickets');
    return tabs.length > 0 ? tabs : ['tickets'];
  };

  const fetchAllData = async () => {
    try {
      // Fetch users
      const usersRes = await axios.get(`${API}/super-admin/users`, {
        params: credentials
      });
      setUsers(usersRes.data.users);

      // Fetch tickets
      const ticketsRes = await axios.get(`${API}/super-admin/tickets`, {
        params: credentials
      });
      setTickets(ticketsRes.data.tickets);

      // Fetch leads
      const leadsRes = await axios.get(`${API}/super-admin/leads`, {
        params: credentials
      });
      setLeads(leadsRes.data.leads);
      setLeadsStats(leadsRes.data.stats);

      // Fetch team members
      const teamRes = await axios.get(`${API}/super-admin/team`, {
        params: credentials
      });
      setTeamMembers(teamRes.data.members);
      setTeamStats(teamRes.data.stats);

      // Fetch analytics
      const analyticsRes = await axios.get(`${API}/super-admin/analytics`, {
        params: { ...credentials, days: 30 }
      });
      setAnalytics(analyticsRes.data);

      // Fetch app versions
      const appVersionsRes = await axios.get(`${API}/super-admin/app-versions`, {
        params: credentials
      });
      setAppVersions(appVersionsRes.data.versions || []);

      // Fetch sale/offer settings
      try {
        const saleOfferRes = await axios.get(`${API}/super-admin/sale-offer`, {
          params: credentials
        });
        if (saleOfferRes.data) {
          // Merge with default state to ensure all fields exist
          setSaleOffer(prev => ({
            ...prev, ...saleOfferRes.data
          }));
        }
      } catch (e) {
        // Sale offer not configured yet
      }

      // Fetch pricing settings
      try {
        const pricingRes = await axios.get(`${API}/super-admin/pricing`, {
          params: credentials
        });
        if (pricingRes.data) {
          setPricing(pricingRes.data);
        }
      } catch (e) {
        // Pricing not configured yet
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
    }
  };

  const fetchTeamData = async (token, user) => {
    const headers = { Authorization: `Bearer ${token}` };
    try {
      // Fetch tickets if has permission
      if (user.permissions?.includes('tickets')) {
        try {
          const ticketsRes = await axios.get(`${API}/support/tickets`, { headers });
          setTickets(ticketsRes.data.tickets || []);
        } catch (e) {
          console.error('Failed to fetch tickets', e);
        }
      }

      // Fetch leads if has permission (need to add team endpoint)
      if (user.permissions?.includes('leads')) {
        try {
          const leadsRes = await axios.get(`${API}/super-admin/leads`, {
            params: credentials
          });
          setLeads(leadsRes.data.leads || []);
          setLeadsStats(leadsRes.data.stats);
        } catch (e) {
          console.error('Failed to fetch leads', e);
        }
      }
    } catch (error) {
      console.error('Failed to fetch team data', error);
    }
  };

  const generatePaymentId = async () => {
    try {
      const response = await axios.post(`${API}/super-admin/generate-payment-id`, 
        {}, 
        { params: credentials }
      );
      setPaymentId(response.data.payment_id);
      toast.success('Payment ID generated');
    } catch (error) {
      toast.error('Failed to generate payment ID');
    }
  };

  const activateSubscription = async () => {
    if (!selectedUser) return;
    if (!paymentId) {
      toast.error('Payment ID is required');
      return;
    }

    try {
      const response = await axios.post(`${API}/super-admin/users/${selectedUser.id}/manual-subscription`, {
        payment_id: paymentId,
        payment_method: paymentMethod,
        payment_proof_url: paymentProofUrl || null,
        payment_notes: paymentNotes || null,
        amount: subscriptionAmount,
        months: subscriptionMonths,
        send_invoice: sendInvoice
      }, { params: credentials });

      toast.success(`Subscription activated! Invoice #${response.data.invoice_number}`);
      if (sendInvoice && response.data.invoice_sent) {
        toast.success('Invoice email sent to user');
      }
      resetSubscriptionModal();
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to activate subscription');
    }
  };

  const resetSubscriptionModal = () => {
    setShowSubscriptionModal(false);
    setSelectedUser(null);
    setSubscriptionMonths(12);
    setSubscriptionAmount(999);
    setPaymentId('');
    setPaymentMethod('manual');
    setPaymentProofUrl('');
    setPaymentNotes('');
    setSendInvoice(true);
  };

  const openSubscriptionModal = (user) => {
    setSelectedUser(user);
    resetSubscriptionModal();
    setSelectedUser(user);
    setShowSubscriptionModal(true);
  };

  const updateTicketStatus = async (ticketId, status) => {
    try {
      await axios.put(`${API}/super-admin/tickets/${ticketId}`, 
        { status }, 
        { params: credentials }
      );
      toast.success('Ticket updated');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to update ticket');
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure? This will delete all user data!')) return;
    try {
      await axios.delete(`${API}/super-admin/users/${userId}`, {
        params: credentials
      });
      toast.success('User deleted');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const extendTrial = async (userId, days) => {
    if (!days || days <= 0) {
      toast.error('Please enter valid number of days');
      return;
    }
    try {
      const response = await axios.put(`${API}/super-admin/users/${userId}/extend-trial`, 
        { days: parseInt(days) }, 
        { params: credentials }
      );
      toast.success(`Trial extended by ${days} days! Total trial: ${response.data.total_trial_days} days`);
      fetchAllData();
    } catch (error) {
      toast.error('Failed to extend trial');
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-purple-500/20 bg-gray-900/50 backdrop-blur">
          <CardHeader>
            <div className="flex items-center gap-2 justify-center">
              <Shield className="w-8 h-8 text-purple-400" />
              <CardTitle className="text-2xl text-white">Ops Controls</CardTitle>
            </div>
            <p className="text-center text-gray-400 text-sm">Site Owner & Team Access</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label className="text-white">Username</Label>
                <Input
                  type="text"
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="Enter username"
                  required
                />
              </div>
              <div>
                <Label className="text-white">Password</Label>
                <Input
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="Enter password"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={loading}
              >
                {loading ? 'Authenticating...' : 'Login'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-8 h-8 text-purple-600" />
              {userType === 'super-admin' ? 'Ops Controls' : 'Team Panel'}
            </h1>
            <p className="text-gray-600">
              {userType === 'super-admin' ? (
                'Site Owner Dashboard'
              ) : (
                <span className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    teamUser?.role === 'sales' ? 'bg-blue-100 text-blue-800' :
                    teamUser?.role === 'support' ? 'bg-green-100 text-green-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {teamUser?.role?.toUpperCase()}
                  </span>
                  {teamUser?.full_name || teamUser?.username}
                  {teamUser?.permissions?.length > 0 && (
                    <span className="text-xs text-gray-500">
                      ({teamUser.permissions.join(', ')})
                    </span>
                  )}
                </span>
              )}
            </p>
          </div>
          <Button 
            onClick={() => {
              setAuthenticated(false);
              setUserType(null);
              setTeamUser(null);
              setTeamToken(null);
              setCredentials({ username: '', password: '' });
            }}
            variant="outline"
          >
            Logout
          </Button>
        </div>

        {/* Tabs - Show based on permissions */}
        <div className="mb-6 flex gap-2 border-b overflow-x-auto">
          {getAvailableTabs().map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium capitalize whitespace-nowrap ${
                activeTab === tab
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && hasPermission('analytics') && (
          dashboard ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="w-4 h-4 text-gray-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboard.overview.total_users}</div>
                  <p className="text-xs text-gray-600">{dashboard.overview.active_subscriptions} active subscriptions</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
                  <Ticket className="w-4 h-4 text-gray-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboard.overview.open_tickets}</div>
                  <p className="text-xs text-gray-600">{dashboard.overview.pending_tickets} pending</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Orders (30d)</CardTitle>
                  <TrendingUp className="w-4 h-4 text-gray-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboard.overview.total_orders_30d}</div>
                  <p className="text-xs text-gray-600">Last 30 days</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Leads</CardTitle>
                  <UserPlus className="w-4 h-4 text-gray-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboard.overview.total_leads || 0}</div>
                  <p className="text-xs text-gray-600">{dashboard.overview.new_leads || 0} new</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                <Lock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Dashboard data not available for your access level</p>
              </CardContent>
            </Card>
          )
        )}

        {/* Users Tab */}
        {activeTab === 'users' && hasPermission('users') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                All Users & Subscription Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-2">Username</th>
                      <th className="text-left p-2">Email</th>
                      <th className="text-left p-2">Role</th>
                      <th className="text-left p-2">Subscription Status</th>
                      <th className="text-left p-2">Expires</th>
                      <th className="text-left p-2">Trial</th>
                      <th className="text-left p-2">Bills</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{user.username}</td>
                        <td className="p-2 text-sm text-gray-600">{user.email}</td>
                        <td className="p-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {user.role}
                          </span>
                        </td>
                        <td className="p-2">
                          {user.subscription_active ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs flex items-center gap-1 w-fit">
                              <CheckCircle className="w-3 h-3" /> Active
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs flex items-center gap-1 w-fit">
                              <Clock className="w-3 h-3" /> Trial
                            </span>
                          )}
                        </td>
                        <td className="p-2 text-sm">
                          {user.subscription_expires_at ? (
                            <span className={`${
                              new Date(user.subscription_expires_at) < new Date() ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {new Date(user.subscription_expires_at).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-2">
                          <span className="text-sm">{7 + (user.trial_extension_days || 0)}d</span>
                          {user.trial_extension_days > 0 && (
                            <span className="text-xs text-green-600 ml-1">(+{user.trial_extension_days})</span>
                          )}
                        </td>
                        <td className="p-2">{user.bill_count || 0}</td>
                        <td className="p-2">
                          <div className="flex flex-wrap gap-1">
                            {/* Subscription Management */}
                            {user.subscription_active ? (
                              <>
                                {hasPermission('send_invoice') && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {/* sendInvoiceEmail(user.id) */}}
                                    className="text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                                    title="Send Invoice Email"
                                  >
                                    <Mail className="w-3 h-3 mr-1" />Email
                                  </Button>
                                )}
                                {hasPermission('deactivate_license') && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {/* deactivateSubscription(user.id) */}}
                                    className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                                  >
                                    <XCircle className="w-3 h-3 mr-1" />Deactivate
                                  </Button>
                                )}
                              </>
                            ) : (
                              hasPermission('activate_license') && (
                                <Button
                                  size="sm"
                                  onClick={() => openSubscriptionModal(user)}
                                  className="text-xs bg-green-600 hover:bg-green-700"
                                >
                                  <CreditCard className="w-3 h-3 mr-1" />Activate
                                </Button>
                              )
                            )}

                            {/* Extend Trial */}
                            {hasPermission('extend_trial') && (
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  placeholder="Days"
                                  className="w-14 h-7 text-xs"
                                  min="1"
                                  max="365"
                                  id={`trial-days-${user.id}`}
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-7 bg-blue-50 hover:bg-blue-100"
                                  onClick={() => {
                                    const input = document.getElementById(`trial-days-${user.id}`);
                                    extendTrial(user.id, input?.value);
                                  }}
                                >
                                  +Trial
                                </Button>
                              </div>
                            )}

                            {/* Delete User */}
                            {hasPermission('delete_user') && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteUser(user.id)}
                                className="text-xs h-7"
                              >
                                Delete
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tickets Tab */}
        {activeTab === 'tickets' && hasPermission('tickets') && (
          <Card>
            <CardHeader>
              <CardTitle>Support Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tickets.map(ticket => (
                  <div key={ticket.id} className="border rounded-lg p-4 bg-white shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{ticket.subject}</h3>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            ticket.request_type === 'demo' ? 'bg-purple-100 text-purple-800' :
                            ticket.request_type === 'inquiry' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {ticket.request_type || 'support'}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            ticket.priority === 'high' ? 'bg-red-100 text-red-800' :
                            ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {ticket.priority} priority
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">Ticket ID: #{ticket.id}</p>
                      </div>
                      <select
                        value={ticket.status}
                        onChange={(e) => updateTicketStatus(ticket.id, e.target.value)}
                        className={`px-3 py-1 border rounded font-medium ${
                          ticket.status === 'open' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          ticket.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                          ticket.status === 'resolved' ? 'bg-green-50 text-green-700 border-green-200' :
                          'bg-gray-50 text-gray-700 border-gray-200'
                        }`}
                      >
                        <option value="open">Open</option>
                        <option value="pending">Pending</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>

                    {/* Contact Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 p-3 bg-gray-50 rounded">
                      <div>
                        <span className="text-xs text-gray-500 block">Name</span>
                        <span className="font-medium">{ticket.name}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block">Email</span>
                        <a href={`mailto:${ticket.email}`} className="text-blue-600 hover:underline">
                          {ticket.email}
                        </a>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block">Phone</span>
                        {ticket.phone ? (
                          <a href={`tel:${ticket.phone}`} className="text-blue-600 hover:underline">
                            {ticket.phone}
                          </a>
                        ) : (
                          <span className="text-gray-400">Not provided</span>
                        )}
                      </div>
                    </div>

                    {/* Message */}
                    <div className="mb-3">
                      <span className="text-xs text-gray-500 block mb-1">Message</span>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-3 border rounded">
                        {ticket.message}
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                      <span>Created: {new Date(ticket.created_at).toLocaleString()}</span>
                      {ticket.updated_at && ticket.updated_at !== ticket.created_at && (
                        <span>Updated: {new Date(ticket.updated_at).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                ))}
                {tickets.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No support tickets yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Subscription Management Modal */}
        {showSubscriptionModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
            <Card className="w-full max-w-lg my-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-green-600" />
                  Manual Subscription Activation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* User Info */}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">User</p>
                    <p className="font-medium">{selectedUser.username}</p>
                    <p className="text-sm text-gray-500">{selectedUser.email}</p>
                  </div>

                  {/* Payment ID - Required */}
                  <div>
                    <Label className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Payment ID *
                    </Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={paymentId}
                        onChange={(e) => setPaymentId(e.target.value)}
                        placeholder="Enter or generate payment ID"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={generatePaymentId}
                        className="flex items-center gap-1"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Generate
                      </Button>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <Label>Payment Method</Label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 border rounded mt-1"
                    >
                      <option value="manual">Manual / Cash</option>
                      <option value="upi">UPI</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="card">Card</option>
                      <option value="cheque">Cheque</option>
                    </select>
                  </div>

                  {/* Duration & Amount */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Duration
                      </Label>
                      <select
                        value={subscriptionMonths}
                        onChange={(e) => setSubscriptionMonths(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border rounded mt-1"
                      >
                        <option value={1}>1 Month</option>
                        <option value={3}>3 Months</option>
                        <option value={6}>6 Months</option>
                        <option value={12}>12 Months</option>
                        <option value={24}>24 Months</option>
                      </select>
                    </div>
                    <div>
                      <Label>Amount (₹)</Label>
                      <Input
                        type="number"
                        value={subscriptionAmount}
                        onChange={(e) => setSubscriptionAmount(parseFloat(e.target.value))}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Send Invoice Checkbox */}
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                    <input
                      type="checkbox"
                      id="sendInvoice"
                      checked={sendInvoice}
                      onChange={(e) => setSendInvoice(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <label htmlFor="sendInvoice" className="flex items-center gap-2 cursor-pointer">
                      <Mail className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">Send invoice email to user</span>
                    </label>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button 
                      onClick={activateSubscription} 
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={!paymentId}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Activate Subscription
                    </Button>
                    <Button 
                      onClick={resetSubscriptionModal}
                      variant="outline" 
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminPage;