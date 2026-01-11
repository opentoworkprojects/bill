import React, { useState, useRef, useEffect } from 'react';
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
  Database, HardDrive, Tag, Gift, Percent, DollarSign, Bell, Send, MessageSquare,
  Activity, Server, Zap, Globe, BarChart3, Settings, AlertTriangle, CheckSquare,
  Filter, Search, SortAsc, SortDesc, Copy, Share2, Star, Heart, Target,
  Layers, Code, Terminal, Wifi, WifiOff, CloudOff, Cloud, Cpu, MemoryStick,
  PieChart, LineChart, AreaChart, TrendingDown, ArrowUp, ArrowDown, Minus,
  PlayCircle, PauseCircle, StopCircle, SkipForward, Rewind, Volume2, VolumeX,
  Bookmark, BookOpen, Lightbulb, Sparkles, Flame, Rocket, Crown, Award
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

  // Enhanced state for new features
  const [systemHealth, setSystemHealth] = useState(null);
  const [realTimeStats, setRealTimeStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [showSystemLogs, setShowSystemLogs] = useState(false);
  const [systemLogs, setSystemLogs] = useState([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [exportFormat, setExportFormat] = useState('json');
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [recentActivities, setRecentActivities] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [alertsConfig, setAlertsConfig] = useState({
    lowDiskSpace: true,
    highCpuUsage: true,
    failedLogins: true,
    systemErrors: true
  });
  const [customDashboard, setCustomDashboard] = useState({
    widgets: ['users', 'revenue', 'tickets', 'performance'],
    layout: 'grid'
  });

  // Additional state variables
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

  // Auto-refresh effect
  useEffect(() => {
    let interval;
    if (authenticated && autoRefresh) {
      interval = setInterval(() => {
        fetchRealTimeStats();
        fetchSystemHealth();
      }, refreshInterval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [authenticated, autoRefresh, refreshInterval]);

  // Fetch real-time statistics
  const fetchRealTimeStats = async () => {
    try {
      const response = await axios.get(`${API}/super-admin/real-time-stats`, {
        params: credentials
      });
      setRealTimeStats(response.data);
    } catch (error) {
      console.error('Failed to fetch real-time stats:', error);
    }
  };

  // Fetch system health
  const fetchSystemHealth = async () => {
    try {
      const response = await axios.get(`${API}/super-admin/system/health`, {
        params: credentials
      });
      setSystemHealth(response.data);
    } catch (error) {
      console.error('Failed to fetch system health:', error);
    }
  };

  // Fetch recent activities
  const fetchRecentActivities = async () => {
    try {
      const response = await axios.get(`${API}/super-admin/activities`, {
        params: { ...credentials, limit: 20 }
      });
      setRecentActivities(response.data.activities || []);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    }
  };

  // Fetch performance metrics
  const fetchPerformanceMetrics = async () => {
    try {
      const response = await axios.get(`${API}/super-admin/performance`, {
        params: credentials
      });
      setPerformanceMetrics(response.data);
    } catch (error) {
      console.error('Failed to fetch performance metrics:', error);
    }
  };

  // Fetch system logs
  const fetchSystemLogs = async () => {
    try {
      const response = await axios.get(`${API}/super-admin/system/logs`, {
        params: { ...credentials, limit: 100 }
      });
      setSystemLogs(response.data.logs || []);
      setShowSystemLogs(true);
    } catch (error) {
      toast.error('Failed to fetch system logs');
    }
  };

  // Bulk actions for users
  const handleBulkAction = async () => {
    if (!bulkAction || selectedUsers.length === 0) {
      toast.error('Please select users and an action');
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${API}/super-admin/bulk-action`, {
        action: bulkAction,
        user_ids: selectedUsers
      }, { params: credentials });
      
      toast.success(`Bulk action "${bulkAction}" completed for ${selectedUsers.length} users`);
      setSelectedUsers([]);
      setBulkAction('');
      setShowBulkModal(false);
      fetchAllData();
    } catch (error) {
      toast.error('Bulk action failed: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Export data in different formats
  const exportData = async (type, format = 'json') => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/super-admin/export/${type}`, {
        params: { ...credentials, format, ...dateRange },
        responseType: format === 'csv' ? 'blob' : 'json'
      });

      if (format === 'csv') {
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        const dataStr = JSON.stringify(response.data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${type}_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      toast.success(`${type} data exported successfully`);
    } catch (error) {
      toast.error('Export failed: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Quick action shortcuts
  const quickActions = [
    {
      id: 'backup',
      label: 'Create Backup',
      icon: Database,
      color: 'bg-blue-500',
      action: () => exportData('full-backup', 'json')
    },
    {
      id: 'system-logs',
      label: 'View System Logs',
      icon: Terminal,
      color: 'bg-gray-500',
      action: fetchSystemLogs
    },
    {
      id: 'system-check',
      label: 'System Check',
      icon: Activity,
      color: 'bg-green-500',
      action: fetchSystemHealth
    },
    {
      id: 'user-stats',
      label: 'User Analytics',
      icon: BarChart3,
      color: 'bg-orange-500',
      action: () => setActiveTab('analytics')
    }
  ];

  // Filter and sort functions
  const getFilteredUsers = () => {
    let filtered = users.filter(user => {
      const matchesSearch = !searchQuery || 
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'active' && user.subscription_active) ||
        (filterStatus === 'trial' && !user.subscription_active) ||
        (filterStatus === 'expired' && user.subscription_expires_at && new Date(user.subscription_expires_at) < new Date());
      
      return matchesSearch && matchesStatus;
    });

    // Sort users
    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (sortBy === 'created_at' || sortBy === 'subscription_expires_at') {
        aVal = new Date(aVal || 0);
        bVal = new Date(bVal || 0);
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  };

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
      // Try ops panel login
      const response = await axios.get(`${API}/ops/auth/login`, {
        params: credentials
      });
      
      if (response.data.success) {
        setUserType('super-admin');
        setAuthenticated(true);
        toast.success('Ops Panel access granted');
        fetchAllData();
      } else {
        toast.error('Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Invalid credentials or server error');
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
      // Fetch users using ops panel endpoint
      const usersRes = await axios.get(`${API}/ops/users/search`, {
        params: credentials
      });
      setUsers(usersRes.data.users || []);

      // Fetch dashboard data
      const dashboardRes = await axios.get(`${API}/ops/dashboard/overview`, {
        params: credentials
      });
      setDashboard(dashboardRes.data);

      // For now, set empty arrays for features not yet implemented in ops panel
      setTickets([]);
      setLeads([]);
      setLeadsStats(null);
      setTeamMembers([]);
      setTeamStats(null);

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

  // Additional missing functions
  const viewBusinessDetails = async (userId) => {
    try {
      setBusinessDetailsLoading(true);
      const response = await axios.get(`${API}/super-admin/users/${userId}/business-details`, {
        params: credentials
      });
      setBusinessDetails(response.data);
      setShowBusinessDetails(true);
    } catch (error) {
      toast.error('Failed to fetch business details');
    } finally {
      setBusinessDetailsLoading(false);
    }
  };

  const previewInvoice = async (user) => {
    try {
      const response = await axios.get(`${API}/super-admin/users/${user.id}/invoice-preview`, {
        params: credentials
      });
      setInvoiceData(response.data);
      setShowInvoicePreview(true);
    } catch (error) {
      toast.error('Failed to generate invoice preview');
    }
  };

  const deactivateSubscription = async (userId) => {
    if (!window.confirm('Are you sure you want to deactivate this subscription?')) return;
    
    try {
      await axios.put(`${API}/super-admin/users/${userId}/deactivate-subscription`, {}, {
        params: credentials
      });
      toast.success('Subscription deactivated');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to deactivate subscription');
    }
  };

  const sendInvoiceEmail = async (userId) => {
    try {
      await axios.post(`${API}/super-admin/users/${userId}/send-invoice`, {}, {
        params: credentials
      });
      toast.success('Invoice email sent successfully');
    } catch (error) {
      toast.error('Failed to send invoice email');
    }
  };

  const exportUserData = async (userId, username) => {
    try {
      setExportingData(userId);
      const response = await axios.get(`${API}/super-admin/users/${userId}/export`, {
        params: credentials,
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${username}_data_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('User data exported successfully');
    } catch (error) {
      toast.error('Failed to export user data');
    } finally {
      setExportingData(null);
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
          <div className="space-y-6">
            {/* Enhanced Dashboard Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">System Overview</h2>
                <p className="text-gray-600">Real-time monitoring and analytics</p>
              </div>
              <div className="flex items-center gap-3">
                {/* Auto-refresh toggle */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className={`p-2 rounded-lg transition-colors ${
                      autoRefresh ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                    }`}
                    title={autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
                  >
                    {autoRefresh ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
                  </button>
                  <span className="text-xs text-gray-500">
                    {autoRefresh ? `${refreshInterval/1000}s` : 'Manual'}
                  </span>
                </div>
                
                {/* Quick Actions */}
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowQuickActions(!showQuickActions)}
                    className="flex items-center gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    Quick Actions
                  </Button>
                  
                  {showQuickActions && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border z-50">
                      {quickActions.map(action => (
                        <button
                          key={action.id}
                          onClick={() => {
                            action.action();
                            setShowQuickActions(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                        >
                          <div className={`w-8 h-8 rounded-lg ${action.color} flex items-center justify-center`}>
                            <action.icon className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-sm font-medium">{action.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    fetchAllData();
                    fetchRealTimeStats();
                    fetchSystemHealth();
                    fetchPerformanceMetrics();
                  }}
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>

            {dashboard ? (
              <>
                {/* Enhanced Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Total Users Card */}
                  <Card className="relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-blue-600/20 rounded-bl-full"></div>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Users className="w-4 h-4 text-blue-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-900">{dashboard.overview.total_users}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm text-green-600 flex items-center gap-1">
                          <ArrowUp className="w-3 h-3" />
                          {dashboard.overview.active_subscriptions}
                        </span>
                        <span className="text-xs text-gray-500">active subscriptions</span>
                      </div>
                      {realTimeStats?.user_growth && (
                        <div className="mt-2 text-xs text-gray-500">
                          +{realTimeStats.user_growth.today} today
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Revenue Card */}
                  <Card className="relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500/10 to-green-600/20 rounded-bl-full"></div>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Revenue (30d)</CardTitle>
                      <div className="p-2 bg-green-100 rounded-lg">
                        <DollarSign className="w-4 h-4 text-green-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-900">
                        ₹{(dashboard.overview.total_revenue || 0).toLocaleString()}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm text-green-600 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          12.5%
                        </span>
                        <span className="text-xs text-gray-500">vs last month</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Support Tickets Card */}
                  <Card className="relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-500/10 to-orange-600/20 rounded-bl-full"></div>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Support Tickets</CardTitle>
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Ticket className="w-4 h-4 text-orange-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-900">{dashboard.overview.open_tickets}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm text-orange-600">{dashboard.overview.pending_tickets} pending</span>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Avg response: 2.3h
                      </div>
                    </CardContent>
                  </Card>

                  {/* System Health Card */}
                  <Card className="relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-purple-600/20 rounded-bl-full"></div>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">System Health</CardTitle>
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Activity className="w-4 h-4 text-purple-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-lg font-bold text-gray-900">Healthy</span>
                      </div>
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">CPU</span>
                          <span className="text-gray-900">{systemHealth?.cpu_usage || '45'}%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Memory</span>
                          <span className="text-gray-900">{systemHealth?.memory_usage || '62'}%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Uptime</span>
                          <span className="text-gray-900">{systemHealth?.uptime || '99.9'}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts and Analytics Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* User Growth Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <LineChart className="w-5 h-5 text-blue-600" />
                        User Growth (7 days)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-48 flex items-end justify-between gap-2">
                        {[12, 19, 15, 27, 23, 31, 28].map((value, index) => (
                          <div key={index} className="flex flex-col items-center gap-2">
                            <div 
                              className="w-8 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t"
                              style={{ height: `${(value / 31) * 100}%` }}
                            ></div>
                            <span className="text-xs text-gray-500">
                              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Activities */}
                  <Card>
                    <CardHeader className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-green-600" />
                        Recent Activities
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={fetchRecentActivities}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-48 overflow-y-auto">
                        {recentActivities.length > 0 ? recentActivities.map((activity, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                              activity.type === 'user' ? 'bg-blue-500' :
                              activity.type === 'payment' ? 'bg-green-500' :
                              activity.type === 'ticket' ? 'bg-orange-500' :
                              'bg-gray-500'
                            }`}></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900">{activity.message}</p>
                              <p className="text-xs text-gray-500">{activity.timestamp}</p>
                            </div>
                          </div>
                        )) : (
                          <div className="text-center py-8 text-gray-500">
                            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No recent activities</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Performance Metrics */}
                {performanceMetrics && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-purple-600" />
                        Performance Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">
                            {performanceMetrics.avg_response_time || '120'}ms
                          </div>
                          <div className="text-sm text-gray-500">Avg Response Time</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">
                            {performanceMetrics.requests_per_minute || '45'}
                          </div>
                          <div className="text-sm text-gray-500">Requests/min</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">
                            {performanceMetrics.error_rate || '0.1'}%
                          </div>
                          <div className="text-sm text-gray-500">Error Rate</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">
                            {performanceMetrics.active_connections || '234'}
                          </div>
                          <div className="text-sm text-gray-500">Active Connections</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  <Lock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Dashboard data not available for your access level</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && hasPermission('users') && (
          <div className="space-y-6">
            {/* Enhanced Users Header with Search and Filters */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      User Management
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      {getFilteredUsers().length} of {users.length} users
                    </p>
                  </div>
                  
                  {/* Bulk Actions */}
                  {selectedUsers.length > 0 && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">
                        {selectedUsers.length} selected
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowBulkModal(true)}
                        className="flex items-center gap-2"
                      >
                        <CheckSquare className="w-4 h-4" />
                        Bulk Actions
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                {/* Search and Filter Bar */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search users by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  {/* Status Filter */}
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border rounded-lg bg-white min-w-[140px]"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="trial">Trial</option>
                    <option value="expired">Expired</option>
                  </select>
                  
                  {/* Sort Options */}
                  <div className="flex items-center gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-2 border rounded-lg bg-white min-w-[120px]"
                    >
                      <option value="created_at">Created</option>
                      <option value="username">Username</option>
                      <option value="subscription_expires_at">Expires</option>
                      <option value="bill_count">Bills</option>
                    </select>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="p-2"
                    >
                      {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                    </Button>
                  </div>
                  
                  {/* Advanced Filters Toggle */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="flex items-center gap-2"
                  >
                    <Filter className="w-4 h-4" />
                    Filters
                  </Button>
                  
                  {/* Export Button */}
                  <div className="relative">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportData('users', exportFormat)}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export
                    </Button>
                  </div>
                </div>
                
                {/* Advanced Filters Panel */}
                {showAdvancedFilters && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-6 space-y-4">
                    <h4 className="font-medium text-gray-900">Advanced Filters</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm">Date Range</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                            className="text-sm"
                          />
                          <Input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                            className="text-sm"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm">Export Format</Label>
                        <select
                          value={exportFormat}
                          onChange={(e) => setExportFormat(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg bg-white mt-1"
                        >
                          <option value="json">JSON</option>
                          <option value="csv">CSV</option>
                        </select>
                      </div>
                      
                      <div className="flex items-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSearchQuery('');
                            setFilterStatus('all');
                            setSortBy('created_at');
                            setSortOrder('desc');
                            setDateRange({ start: '', end: '' });
                          }}
                          className="w-full"
                        >
                          Clear Filters
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enhanced Users Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-3">
                          <input
                            type="checkbox"
                            checked={selectedUsers.length === getFilteredUsers().length && getFilteredUsers().length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers(getFilteredUsers().map(u => u.id));
                              } else {
                                setSelectedUsers([]);
                              }
                            }}
                            className="rounded"
                          />
                        </th>
                        <th className="text-left p-3 font-medium">User</th>
                        <th className="text-left p-3 font-medium">Status</th>
                        <th className="text-left p-3 font-medium">Subscription</th>
                        <th className="text-left p-3 font-medium">Activity</th>
                        <th className="text-left p-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredUsers().map(user => (
                        <tr key={user.id} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedUsers([...selectedUsers, user.id]);
                                } else {
                                  setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                                }
                              }}
                              className="rounded"
                            />
                          </td>
                          
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                                {user.username.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{user.username}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                                    {user.role}
                                  </span>
                                  {user.business_settings?.restaurant_name && (
                                    <span className="text-xs text-gray-500">
                                      {user.business_settings.restaurant_name}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          
                          <td className="p-3">
                            <div className="space-y-1">
                              {user.subscription_active ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                  <CheckCircle className="w-3 h-3" />
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                                  <Clock className="w-3 h-3" />
                                  Trial
                                </span>
                              )}
                              
                              {user.subscription_expires_at && (
                                <div className="text-xs text-gray-500">
                                  Expires: {new Date(user.subscription_expires_at).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </td>
                          
                          <td className="p-3">
                            <div className="space-y-1">
                              <div className="text-sm font-medium">
                                ₹{(user.subscription_amount || 0).toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-500">
                                {user.subscription_months || 12} months
                              </div>
                              {user.trial_extension_days > 0 && (
                                <div className="text-xs text-green-600">
                                  +{user.trial_extension_days} trial days
                                </div>
                              )}
                            </div>
                          </td>
                          
                          <td className="p-3">
                            <div className="space-y-1">
                              <div className="text-sm font-medium">
                                {user.bill_count || 0} bills
                              </div>
                              <div className="text-xs text-gray-500">
                                Last seen: {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                              </div>
                            </div>
                          </td>
                          
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1">
                              {/* Quick Actions */}
                              {hasPermission('view_details') && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => viewBusinessDetails(user.id)}
                                  className="text-xs h-7 px-2"
                                  title="View Details"
                                >
                                  <Eye className="w-3 h-3" />
                                </Button>
                              )}
                              
                              {user.subscription_active ? (
                                <>
                                  {hasPermission('send_invoice') && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => previewInvoice(user)}
                                      className="text-xs h-7 px-2 text-purple-600 border-purple-200"
                                      title="Invoice"
                                    >
                                      <FileText className="w-3 h-3" />
                                    </Button>
                                  )}
                                  
                                  {hasPermission('deactivate_license') && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => deactivateSubscription(user.id)}
                                      className="text-xs h-7 px-2 text-red-600 border-red-200"
                                      title="Deactivate"
                                    >
                                      <XCircle className="w-3 h-3" />
                                    </Button>
                                  )}
                                </>
                              ) : (
                                hasPermission('activate_license') && (
                                  <Button
                                    size="sm"
                                    onClick={() => openSubscriptionModal(user)}
                                    className="text-xs h-7 px-2 bg-green-600 hover:bg-green-700"
                                    title="Activate Subscription"
                                  >
                                    <CreditCard className="w-3 h-3" />
                                  </Button>
                                )
                              )}
                              
                              {/* More Actions Dropdown */}
                              <div className="relative group">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-7 px-2"
                                  title="More Actions"
                                >
                                  <Settings className="w-3 h-3" />
                                </Button>
                                
                                {/* Dropdown Menu */}
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                  <div className="py-1">
                                    {hasPermission('export_data') && (
                                      <button
                                        onClick={() => exportUserData(user.id, user.username)}
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                                      >
                                        <Download className="w-3 h-3" />
                                        Export Data
                                      </button>
                                    )}
                                    
                                    {hasPermission('extend_trial') && (
                                      <button
                                        onClick={() => {
                                          const days = prompt('Enter number of days to extend trial:');
                                          if (days) extendTrial(user.id, days);
                                        }}
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                                      >
                                        <Calendar className="w-3 h-3" />
                                        Extend Trial
                                      </button>
                                    )}
                                    
                                    {hasPermission('send_invoice') && (
                                      <button
                                        onClick={() => sendInvoiceEmail(user.id)}
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                                      >
                                        <Mail className="w-3 h-3" />
                                        Send Invoice
                                      </button>
                                    )}
                                    
                                    <div className="border-t my-1"></div>
                                    
                                    {hasPermission('delete_user') && (
                                      <button
                                        onClick={() => deleteUser(user.id)}
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                        Delete User
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {getFilteredUsers().length === 0 && (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500">No users found matching your criteria</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchQuery('');
                          setFilterStatus('all');
                        }}
                        className="mt-2"
                      >
                        Clear Filters
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
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

        {/* Bulk Actions Modal */}
        {showBulkModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-blue-600" />
                  Bulk Actions
                </CardTitle>
                <p className="text-sm text-gray-600">
                  {selectedUsers.length} users selected
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Select Action</Label>
                    <select
                      value={bulkAction}
                      onChange={(e) => setBulkAction(e.target.value)}
                      className="w-full px-3 py-2 border rounded mt-1"
                    >
                      <option value="">Choose an action...</option>
                      <option value="send_notification">Send Notification</option>
                      <option value="extend_trial">Extend Trial (7 days)</option>
                      <option value="export_data">Export Data</option>
                      <option value="deactivate">Deactivate Subscriptions</option>
                      <option value="send_invoice">Send Invoices</option>
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleBulkAction}
                      disabled={!bulkAction || loading}
                      className="flex-1"
                    >
                      {loading ? 'Processing...' : 'Execute Action'}
                    </Button>
                    <Button 
                      onClick={() => {
                        setShowBulkModal(false);
                        setBulkAction('');
                      }}
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

        {/* System Logs Modal */}
        {showSystemLogs && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-green-600" />
                  System Logs
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSystemLogs(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="overflow-y-auto">
                <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm space-y-1 max-h-96 overflow-y-auto">
                  {systemLogs.length > 0 ? systemLogs.map((log, index) => (
                    <div key={index} className="flex gap-2">
                      <span className="text-gray-500">[{log.timestamp}]</span>
                      <span className={`${
                        log.level === 'ERROR' ? 'text-red-400' :
                        log.level === 'WARN' ? 'text-yellow-400' :
                        log.level === 'INFO' ? 'text-blue-400' :
                        'text-green-400'
                      }`}>
                        {log.level}
                      </span>
                      <span>{log.message}</span>
                    </div>
                  )) : (
                    <div className="text-center text-gray-500 py-8">
                      No logs available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Business Details Modal */}
        {showBusinessDetails && businessDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  Business Details
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBusinessDetails(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="overflow-y-auto">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-500">Restaurant Name</Label>
                      <p className="font-medium">{businessDetails.restaurant_name || 'Not set'}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Owner Name</Label>
                      <p className="font-medium">{businessDetails.owner_name || 'Not set'}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Phone</Label>
                      <p className="font-medium">{businessDetails.phone || 'Not set'}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Email</Label>
                      <p className="font-medium">{businessDetails.email || 'Not set'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm text-gray-500">Address</Label>
                    <p className="font-medium">{businessDetails.address || 'Not set'}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-500">GST Number</Label>
                      <p className="font-medium">{businessDetails.gst_number || 'Not set'}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">FSSAI Number</Label>
                      <p className="font-medium">{businessDetails.fssai_number || 'Not set'}</p>
                    </div>
                  </div>

                  {businessDetails.stats && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-3">Usage Statistics</h4>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-blue-600">
                            {businessDetails.stats.total_bills || 0}
                          </div>
                          <div className="text-sm text-gray-500">Total Bills</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">
                            ₹{(businessDetails.stats.total_revenue || 0).toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-500">Revenue</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-purple-600">
                            {businessDetails.stats.menu_items || 0}
                          </div>
                          <div className="text-sm text-gray-500">Menu Items</div>
                        </div>
                      </div>
                    </div>
                  )}
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