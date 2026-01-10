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
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [cacheStatus, setCacheStatus] = useState(null);
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
    username: '', email: '', password: '', role: 'sales', 
    permissions: [], full_name: '', phone: '' 
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
  const [pushStats, setPushStats] = useState({ active_subscriptions: 0, total_subscriptions: 0, recent_subscriptions: [] });

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
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
                  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
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

  // Preview invoice for a user
  const previewInvoice = (user) => {
    const now = new Date();
    const subscriptionStartDate = user.subscription_started_at ? new Date(user.subscription_started_at) : now;
    const expiresAt = new Date(user.subscription_expires_at);
    
    // Calculate subscription duration in months
    const monthsDiff = Math.round((expiresAt - subscriptionStartDate) / (1000 * 60 * 60 * 24 * 30));
    const amount = user.subscription_amount || 999;
    
    const data = {
      invoiceNumber: generateInvoiceNumber(user.invoice_number),
      invoiceDate: subscriptionStartDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      dueDate: subscriptionStartDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      customerName: user.username,
      customerEmail: user.email,
      customerPhone: user.phone || 'N/A',
      businessName: user.business_settings?.name || user.username + "'s Restaurant",
      businessAddress: user.business_settings?.address || 'N/A',
      businessCity: user.business_settings?.city || '',
      businessState: user.business_settings?.state || 'Karnataka',
      businessPincode: user.business_settings?.pincode || '',
      paymentId: user.subscription_payment_id || 'N/A',
      paymentMethod: user.subscription_type || 'Online',
      subscriptionPlan: 'BillByteKOT Premium',
      subscriptionPeriod: `${monthsDiff || 12} Months`,
      validFrom: subscriptionStartDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      validUntil: expiresAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      amount: amount,
      amountInWords: numberToWords(amount)
    };
    
    setInvoiceData(data);
    setShowInvoicePreview(true);
  };

  // Download invoice as PDF
  const downloadInvoicePDF = async (sendEmail = false) => {
    if (!invoiceRef.current) return;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${invoiceData?.invoiceNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; background: white; color: #333; }
          .invoice-container { max-width: 800px; margin: 0 auto; padding: 30px; position: relative; }
          .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 100px; color: rgba(124, 58, 237, 0.05); font-weight: bold; pointer-events: none; z-index: 0; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 3px solid #7c3aed; position: relative; z-index: 1; }
          .logo { font-size: 26px; font-weight: bold; color: #7c3aed; }
          .logo-sub { font-size: 11px; color: #666; margin-top: 4px; }
          .company-details { font-size: 10px; color: #888; margin-top: 10px; line-height: 1.5; }
          .invoice-title { text-align: right; }
          .invoice-title h1 { font-size: 28px; color: #333; margin-bottom: 5px; letter-spacing: 2px; }
          .invoice-number { font-size: 13px; color: #7c3aed; font-weight: 600; background: #f3e8ff; padding: 6px 12px; border-radius: 4px; display: inline-block; }
          .invoice-meta { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 25px; position: relative; z-index: 1; }
          .meta-section { background: #fafafa; padding: 15px; border-radius: 8px; border-left: 3px solid #7c3aed; }
          .meta-section h3 { font-size: 10px; color: #7c3aed; text-transform: uppercase; margin-bottom: 10px; letter-spacing: 1px; font-weight: 600; }
          .meta-section p { font-size: 12px; color: #333; margin-bottom: 4px; line-height: 1.4; }
          .meta-section .highlight { color: #7c3aed; font-weight: 600; }
          .meta-section .business-name { font-size: 14px; font-weight: 600; color: #1a1a1a; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; position: relative; z-index: 1; }
          .items-table th { background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%); color: white; padding: 12px 10px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
          .items-table th:first-child { border-radius: 6px 0 0 0; }
          .items-table th:last-child { border-radius: 0 6px 0 0; text-align: right; }
          .items-table td { padding: 14px 10px; border-bottom: 1px solid #eee; font-size: 12px; vertical-align: top; }
          .items-table td:last-child { text-align: right; }
          .items-table .item-name { font-weight: 600; color: #1a1a1a; margin-bottom: 4px; }
          .items-table .item-desc { font-size: 10px; color: #666; line-height: 1.4; }
          .totals-section { display: flex; justify-content: space-between; margin-bottom: 20px; position: relative; z-index: 1; }
          .bank-details { flex: 1; background: #f8f5ff; padding: 15px; border-radius: 8px; margin-right: 20px; }
          .bank-details h4 { font-size: 10px; color: #7c3aed; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 1px; }
          .bank-details p { font-size: 11px; color: #555; margin-bottom: 3px; }
          .totals { width: 280px; }
          .totals-row { display: flex; justify-content: space-between; padding: 8px 12px; font-size: 12px; }
          .totals-row:nth-child(odd) { background: #fafafa; }
          .totals-row.total { background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%); color: white; font-size: 16px; font-weight: bold; border-radius: 6px; margin-top: 8px; padding: 12px; }
          .amount-words { background: linear-gradient(135deg, #f3e8ff 0%, #faf5ff 100%); padding: 12px 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e9d5ff; position: relative; z-index: 1; }
          .amount-words span { font-size: 9px; color: #7c3aed; text-transform: uppercase; letter-spacing: 1px; }
          .amount-words p { font-size: 12px; color: #333; font-weight: 500; margin-top: 4px; }
          .terms { background: #fafafa; padding: 15px; border-radius: 8px; margin-bottom: 20px; position: relative; z-index: 1; }
          .terms h4 { font-size: 10px; color: #666; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 1px; }
          .terms ul { font-size: 10px; color: #666; padding-left: 15px; line-height: 1.6; }
          .footer { text-align: center; padding-top: 20px; border-top: 2px solid #eee; position: relative; z-index: 1; }
          .footer p { font-size: 11px; color: #666; margin-bottom: 4px; }
          .footer .thank-you { font-size: 14px; color: #7c3aed; font-weight: 600; margin-bottom: 8px; }
          .paid-stamp { position: absolute; top: 40%; right: 30px; transform: rotate(-20deg); font-size: 50px; color: rgba(34, 197, 94, 0.25); font-weight: bold; border: 5px solid rgba(34, 197, 94, 0.25); padding: 8px 25px; border-radius: 10px; z-index: 2; }
          .qr-section { text-align: center; margin-top: 15px; }
          .qr-section p { font-size: 9px; color: #888; }
          @media print { 
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } 
            .invoice-container { padding: 20px; }
          }
        </style>
      </head>
      <body>
        ${invoiceRef.current.innerHTML}
      </body>
      </html>
    `;
    
    if (sendEmail && invoiceData) {
      try {
        toast.loading('Sending receipt via email...');
        const response = await axios.post(
          `${API}/super-admin/send-receipt-pdf`,
          {
            user_email: invoiceData.customerEmail,
            user_name: invoiceData.customerName,
            business_name: invoiceData.businessName,
            receipt_number: invoiceData.invoiceNumber,
            amount: invoiceData.amount,
            valid_from: invoiceData.validFrom,
            valid_until: invoiceData.validUntil,
            payment_id: invoiceData.paymentId,
            payment_method: invoiceData.paymentMethod,
            html_content: htmlContent
          },
          { params: credentials }
        );
        toast.dismiss();
        if (response.data.success) {
          toast.success('Receipt sent to ' + invoiceData.customerEmail);
        } else {
          toast.error('Failed to send receipt');
        }
      } catch (error) {
        toast.dismiss();
        toast.error(error.response?.data?.detail || 'Failed to send receipt email');
      }
    } else {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 300);
    }
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
      // Step 1: Lightweight login check (NO data loading)
      const loginResponse = await axios.get(`${API}/super-admin/login`, {
        params: credentials,
        timeout: 10000 // 10 second timeout for login
      });
      
      if (loginResponse.data.success) {
        // Step 2: Set authenticated state immediately
        setUserType('super-admin');
        setAuthenticated(true);
        toast.success('Super Admin access granted');
        
        // Step 3: Load basic dashboard stats (lightweight)
        try {
          const dashboardResponse = await axios.get(`${API}/super-admin/dashboard`, {
            params: credentials,
            timeout: 15000 // 15 second timeout for dashboard
          });
          setDashboard(dashboardResponse.data);
        } catch (dashboardError) {
          console.warn('Dashboard loading failed, using minimal data:', dashboardError);
          // Set minimal dashboard if it fails
          setDashboard({
            overview: {
              total_users: 0,
              active_subscriptions: 0,
              trial_users: 0,
              total_orders_30d: 0,
              open_tickets: 0,
              pending_tickets: 0,
              resolved_tickets: 0
            },
            users: [],
            tickets: [],
            recent_orders: []
          });
        }
        
        // Step 4: Load additional data in background (non-blocking)
        loadAdditionalDataInBackground();
        
        // Step 5: Check cache status
        checkCacheStatus();
      }
    } catch (superAdminError) {
      console.error('Super admin login error:', superAdminError);
      
      // Check if it's a timeout or network error
      if (superAdminError.code === 'ECONNABORTED' || superAdminError.message?.includes('timeout')) {
        toast.error('Login timeout. Server might be slow. Please try again.');
        setLoading(false);
        return;
      }
      
      // If super admin fails, try team member login
      try {
        const teamResponse = await axios.post(`${API}/team/login`, {
          username: credentials.username,
          password: credentials.password
        }, {
          timeout: 15000 // 15 second timeout for team login
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
        console.error('Team login error:', teamError);
        
        // Provide specific error messages
        if (teamError.response?.status === 403) {
          toast.error('Invalid credentials');
        } else if (teamError.code === 'ECONNABORTED' || teamError.message?.includes('timeout')) {
          toast.error('Login timeout. Please check your connection and try again.');
        } else if (teamError.response?.status >= 500) {
          toast.error('Server error. Please try again later.');
        } else {
          toast.error('Login failed. Please check your credentials.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Load additional data in background after login
  const loadAdditionalDataInBackground = () => {
    // Don't load all data at once - let user click to load what they need
    console.log('✅ Login successful. Data will be loaded on-demand when you switch tabs.');
  };

  const loadUsersData = async () => {
    if (loadingUsers) return; // Prevent duplicate calls
    setLoadingUsers(true);
    try {
      const response = await axios.get(`${API}/super-admin/users`, {
        params: { ...credentials, limit: 20 }, // Small limit
        timeout: 30000 // Increased timeout to 30 seconds
      });
      setUsers(response.data.users || []);
      toast.success(`Loaded ${response.data.users?.length || 0} users`);
    } catch (error) {
      console.error('Failed to load users:', error);
      
      // Provide specific error messages
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        toast.error('Request timed out. The server might be slow. Please try again.');
      } else if (error.response?.status === 500) {
        toast.error('Server error loading users. Please try again in a moment.');
      } else if (error.response?.status === 403) {
        toast.error('Access denied. Please check your credentials.');
      } else {
        toast.error('Failed to load users data. Please try again.');
      }
      
      // Set empty array to show retry button
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadTicketsData = async () => {
    if (loadingTickets) return; // Prevent duplicate calls
    setLoadingTickets(true);
    try {
      const response = await axios.get(`${API}/super-admin/tickets/recent`, {
        params: { ...credentials, limit: 10 }, // Small limit
        timeout: 30000 // Increased timeout
      });
      setTickets(response.data.tickets || []);
      toast.success(`Loaded ${response.data.tickets?.length || 0} tickets`);
    } catch (error) {
      console.error('Failed to load tickets:', error);
      
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        toast.error('Tickets request timed out. Please try again.');
      } else if (error.response?.status === 500) {
        toast.error('Server error loading tickets. Please try again.');
      } else {
        toast.error('Failed to load tickets data. Please try again.');
      }
      
      setTickets([]);
    } finally {
      setLoadingTickets(false);
    }
  };

  const loadOrdersData = async () => {
    if (loadingOrders) return; // Prevent duplicate calls
    setLoadingOrders(true);
    try {
      const response = await axios.get(`${API}/super-admin/orders/recent`, {
        params: { ...credentials, days: 7, limit: 10 }, // Small limits
        timeout: 30000 // Increased timeout
      });
      // Update dashboard with recent orders
      setDashboard(prev => ({
        ...prev,
        recent_orders: response.data.orders || []
      }));
      toast.success(`Loaded ${response.data.orders?.length || 0} recent orders`);
    } catch (error) {
      console.error('Failed to load orders:', error);
      
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        toast.error('Orders request timed out. Please try again.');
      } else if (error.response?.status === 500) {
        toast.error('Server error loading orders. Please try again.');
      } else {
        toast.error('Failed to load orders data. Please try again.');
      }
    } finally {
      setLoadingOrders(false);
    }
  };

  const loadLeadsData = async () => {
    if (loadingLeads) return; // Prevent duplicate calls
    setLoadingLeads(true);
    try {
      const response = await axios.get(`${API}/super-admin/leads`, {
        params: credentials,
        timeout: 10000
      });
      setLeads(response.data.leads || []);
      setLeadsStats(response.data.stats);
    } catch (error) {
      console.warn('Failed to load leads:', error);
      toast.error('Failed to load leads data');
    } finally {
      setLoadingLeads(false);
    }
  };

  const loadTeamData = async () => {
    if (loadingTeam) return; // Prevent duplicate calls
    setLoadingTeam(true);
    try {
      const response = await axios.get(`${API}/super-admin/team`, {
        params: credentials,
        timeout: 10000
      });
      setTeamMembers(response.data.members || []);
      setTeamStats(response.data.stats);
    } catch (error) {
      console.warn('Failed to load team:', error);
      toast.error('Failed to load team data');
    } finally {
      setLoadingTeam(false);
    }
  };

  const loadAnalyticsData = async () => {
    if (loadingAnalytics) return; // Prevent duplicate calls
    setLoadingAnalytics(true);
    try {
      const response = await axios.get(`${API}/super-admin/analytics`, {
        params: { ...credentials, days: 30 },
        timeout: 10000
      });
      setAnalytics(response.data);
    } catch (error) {
      console.warn('Failed to load analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const loadOtherData = async () => {
    // Load non-critical data with enhanced error handling
    const loadPromises = [
      loadLeadsData(),
      loadTeamData(),
      loadAnalyticsData()
    ];

    // Load app versions and other settings
    try {
      const appVersionsResponse = await axios.get(`${API}/super-admin/app-versions`, {
        params: credentials,
        timeout: 10000
      });
      setAppVersions(appVersionsResponse.data.versions || []);
    } catch (error) {
      console.warn('Failed to fetch app versions:', error);
    }

    // Fetch sale/offer settings
    try {
      const saleOfferRes = await axios.get(`${API}/super-admin/sale-offer`, {
        params: credentials,
        timeout: 5000
      });
      if (saleOfferRes.data) {
        setSaleOffer(prev => ({...prev, ...saleOfferRes.data}));
      }
    } catch (error) {
      console.warn('Failed to fetch sale offer:', error);
    }

    // Fetch pricing settings
    try {
      const pricingRes = await axios.get(`${API}/super-admin/pricing`, {
        params: credentials,
        timeout: 5000
      });
      if (pricingRes.data) {
        setPricing(pricingRes.data);
      }
    } catch (error) {
      console.warn('Failed to fetch pricing:', error);
    }

    // Wait for all critical data to load
    await Promise.allSettled(loadPromises);
  };

  // Check cache status
  const checkCacheStatus = async () => {
    try {
      const response = await axios.get(`${API}/super-admin/cache/status`, {
        params: credentials,
        timeout: 5000
      });
      setCacheStatus(response.data);
    } catch (error) {
      console.warn('Failed to check cache status:', error);
      setCacheStatus({ connected: false, performance_mode: "MongoDB only" });
    }
  };

  // Invalidate cache
  const invalidateCache = async (cacheType = 'all') => {
    try {
      const response = await axios.post(`${API}/super-admin/cache/invalidate`, {}, {
        params: { ...credentials, cache_type: cacheType },
        timeout: 5000
      });
      
      if (response.data.invalidated) {
        toast.success(`${cacheType} cache invalidated successfully`);
        // Refresh current tab data
        handleTabChange(activeTab);
      } else {
        toast.info('Cache invalidation not available (Redis not connected)');
      }
    } catch (error) {
      console.warn('Failed to invalidate cache:', error);
      toast.error('Failed to invalidate cache');
    }
  };

  // Handle tab change and load data accordingly
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    
    // Load data for the selected tab if not already loaded
    switch (tab) {
      case 'users':
        if (users.length === 0 && !loadingUsers) {
          loadUsersData();
        }
        break;
      case 'tickets':
        if (tickets.length === 0 && !loadingTickets) {
          loadTicketsData();
        }
        break;
      case 'leads':
        if (leads.length === 0 && !loadingLeads) {
          loadLeadsData();
        }
        break;
      case 'team':
        if (teamMembers.length === 0 && !loadingTeam) {
          loadTeamData();
        }
        break;
      case 'analytics':
        if (!analytics && !loadingAnalytics) {
          loadAnalyticsData();
        }
        break;
      default:
        break;
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
      // Fetch dashboard data first (this is now optimized and fast)
      const dashboardRes = await axios.get(`${API}/super-admin/dashboard`, {
        params: credentials,
        timeout: 15000 // 15 second timeout
      });
      setDashboard(dashboardRes.data);
      
      // Set initial data from dashboard response
      setUsers(dashboardRes.data.users || []);
      setTickets(dashboardRes.data.tickets || []);
      
      // Fetch additional data in background (non-blocking)
      Promise.all([
        // Fetch leads
        axios.get(`${API}/super-admin/leads`, {
          params: credentials,
          timeout: 10000
        }).then(res => {
          setLeads(res.data.leads || []);
          setLeadsStats(res.data.stats);
        }).catch(e => console.warn('Failed to fetch leads:', e)),

        // Fetch team members
        axios.get(`${API}/super-admin/team`, {
          params: credentials,
          timeout: 10000
        }).then(res => {
          setTeamMembers(res.data.members || []);
          setTeamStats(res.data.stats);
        }).catch(e => console.warn('Failed to fetch team:', e)),

        // Fetch analytics
        axios.get(`${API}/super-admin/analytics`, {
          params: { ...credentials, days: 30 },
          timeout: 10000
        }).then(res => {
          setAnalytics(res.data);
        }).catch(e => console.warn('Failed to fetch analytics:', e)),

        // Fetch app versions
        axios.get(`${API}/super-admin/app-versions`, {
          params: credentials,
          timeout: 10000
        }).then(res => {
          setAppVersions(res.data.versions || []);
        }).catch(e => console.warn('Failed to fetch app versions:', e))
      ]);

      // Fetch sale/offer settings
      try {
        const saleOfferRes = await axios.get(`${API}/super-admin/sale-offer`, {
          params: credentials,
          timeout: 5000
        });
        if (saleOfferRes.data) {
          setSaleOffer(prev => ({...prev, ...saleOfferRes.data}));
        }
      } catch (e) {
        console.warn('Failed to fetch sale offer:', e);
      }

      // Fetch pricing settings
      try {
        const pricingRes = await axios.get(`${API}/super-admin/pricing`, {
          params: credentials,
          timeout: 5000
        });
        if (pricingRes.data) {
          setPricing(pricingRes.data);
        }
      } catch (e) {
        console.warn('Failed to fetch pricing:', e);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
      toast.error('Failed to load dashboard. Please try again.');
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
      const response = await axios.post(
        `${API}/super-admin/generate-payment-id`,
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
      const response = await axios.post(
        `${API}/super-admin/users/${selectedUser.id}/manual-subscription`,
        {
          payment_id: paymentId,
          payment_method: paymentMethod,
          payment_proof_url: paymentProofUrl || null,
          payment_notes: paymentNotes || null,
          amount: subscriptionAmount,
          months: subscriptionMonths,
          send_invoice: sendInvoice
        },
        { params: credentials }
      );
      
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

  const sendInvoiceEmail = async (userId) => {
    try {
      const response = await axios.post(
        `${API}/super-admin/users/${userId}/send-invoice`,
        {},
        { params: credentials }
      );
      if (response.data.success) {
        toast.success('Invoice sent successfully');
      } else {
        toast.error('Failed to send invoice');
      }
    } catch (error) {
      toast.error('Failed to send invoice');
    }
  };

  const deactivateSubscription = async (userId) => {
    if (!window.confirm('Are you sure you want to deactivate this subscription?')) return;
    
    try {
      await axios.put(
        `${API}/super-admin/users/${userId}/subscription`,
        { subscription_active: false },
        { params: credentials }
      );
      toast.success('Subscription deactivated');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to deactivate subscription');
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
      await axios.put(
        `${API}/super-admin/tickets/${ticketId}`,
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
      const response = await axios.put(
        `${API}/super-admin/users/${userId}/extend-trial`,
        { days: parseInt(days) },
        { params: credentials }
      );
      toast.success(`Trial extended by ${days} days! Total trial: ${response.data.total_trial_days} days`);
      fetchAllData();
    } catch (error) {
      toast.error('Failed to extend trial');
    }
  };

  const updateLeadStatus = async (leadId, status) => {
    try {
      await axios.put(
        `${API}/super-admin/leads/${leadId}`,
        { status, contacted: status !== 'new' },
        { params: credentials }
      );
      toast.success('Lead updated');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to update lead');
    }
  };

  const deleteLead = async (leadId) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return;
    
    try {
      await axios.delete(`${API}/super-admin/leads/${leadId}`, {
        params: credentials
      });
      toast.success('Lead deleted');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to delete lead');
    }
  };

  const createLead = async () => {
    if (!newLead.name || !newLead.email || !newLead.phone) {
      toast.error('Please fill required fields');
      return;
    }

    try {
      await axios.post(
        `${API}/super-admin/leads`,
        newLead,
        { params: credentials }
      );
      toast.success('Lead created successfully');
      setShowCreateLead(false);
      setNewLead({ name: '', email: '', phone: '', businessName: '', notes: '' });
      fetchAllData();
    } catch (error) {
      toast.error('Failed to create lead');
    }
  };

  const createTeamMember = async () => {
    if (!newTeamMember.username || !newTeamMember.email || !newTeamMember.password) {
      toast.error('Please fill required fields');
      return;
    }

    try {
      await axios.post(
        `${API}/super-admin/team`,
        newTeamMember,
        { params: credentials }
      );
      toast.success('Team member created successfully');
      setShowCreateTeam(false);
      setNewTeamMember({ 
        username: '', email: '', password: '', role: 'sales', 
        permissions: [], full_name: '', phone: '' 
      });
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create team member');
    }
  };

  const updateTeamMember = async (memberId, updates) => {
    try {
      await axios.put(
        `${API}/super-admin/team/${memberId}`,
        updates,
        { params: credentials }
      );
      toast.success('Team member updated');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to update team member');
    }
  };

  const deleteTeamMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to delete this team member?')) return;
    
    try {
      await axios.delete(`${API}/super-admin/team/${memberId}`, {
        params: credentials
      });
      toast.success('Team member deleted');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to delete team member');
    }
  };

  // App Version Management Functions
  const handleAppFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validExtensions = newAppVersion.platform === 'android' ? ['.apk'] : ['.exe', '.msi', '.zip'];
      const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!validExtensions.includes(fileExt)) {
        toast.error(`Please select a valid ${newAppVersion.platform === 'android' ? 'APK' : 'Windows installer'} file`);
        return;
      }
      setAppFile(file);
      // Auto-fill file size
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setNewAppVersion(prev => ({ ...prev, file_size: `${sizeMB} MB` }));
    }
  };

  const createAppVersion = async () => {
    if (!newAppVersion.version) {
      toast.error('Please fill version number');
      return;
    }
    
    // Either file or URL is required
    if (!appFile && !newAppVersion.download_url) {
      toast.error('Please upload a file or provide a download URL');
      return;
    }

    setUploadingApp(true);
    setUploadProgress(0);
    
    try {
      let downloadUrl = newAppVersion.download_url;
      
      // If file is selected, upload it first
      if (appFile) {
        const formData = new FormData();
        formData.append('file', appFile);
        formData.append('platform', newAppVersion.platform);
        formData.append('version', newAppVersion.version);
        
        const uploadResponse = await axios.post(
          `${API}/super-admin/app-versions/upload`,
          formData,
          { 
            params: credentials,
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (progressEvent) => {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(progress);
            }
          }
        );
        downloadUrl = uploadResponse.data.download_url;
      }
      
      // Create version record
      await axios.post(
        `${API}/super-admin/app-versions`,
        { ...newAppVersion, download_url: downloadUrl },
        { params: credentials }
      );
      
      toast.success(`${newAppVersion.platform.toUpperCase()} app version created`);
      setShowAppVersionModal(false);
      setAppFile(null);
      setNewAppVersion({
        platform: 'android',
        version: '',
        version_code: 1,
        download_url: '',
        release_notes: '',
        min_supported_version: '',
        is_mandatory: false,
        file_size: ''
      });
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create app version');
    } finally {
      setUploadingApp(false);
      setUploadProgress(0);
    }
  };

  const updateAppVersion = async () => {
    if (!editingVersion) return;

    setUploadingApp(true);
    setUploadProgress(0);
    
    try {
      let downloadUrl = newAppVersion.download_url;
      
      // If new file is selected, upload it
      if (appFile) {
        const formData = new FormData();
        formData.append('file', appFile);
        formData.append('platform', newAppVersion.platform);
        formData.append('version', newAppVersion.version);
        
        const uploadResponse = await axios.post(
          `${API}/super-admin/app-versions/upload`,
          formData,
          { 
            params: credentials,
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (progressEvent) => {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(progress);
            }
          }
        );
        downloadUrl = uploadResponse.data.download_url;
      }
      
      await axios.put(
        `${API}/super-admin/app-versions/${editingVersion.id}`,
        { ...newAppVersion, download_url: downloadUrl },
        { params: credentials }
      );
      toast.success('App version updated');
      setShowAppVersionModal(false);
      setEditingVersion(null);
      setAppFile(null);
      setNewAppVersion({
        platform: 'android',
        version: '',
        version_code: 1,
        download_url: '',
        release_notes: '',
        min_supported_version: '',
        is_mandatory: false,
        file_size: ''
      });
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update app version');
    } finally {
      setUploadingApp(false);
      setUploadProgress(0);
    }
  };

  const deleteAppVersion = async (versionId) => {
    if (!window.confirm('Are you sure you want to delete this app version?')) return;
    
    try {
      await axios.delete(`${API}/super-admin/app-versions/${versionId}`, {
        params: credentials
      });
      toast.success('App version deleted');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to delete app version');
    }
  };

  const toggleAppVersionActive = async (version) => {
    try {
      await axios.put(
        `${API}/super-admin/app-versions/${version.id}`,
        { is_active: !version.is_active },
        { params: credentials }
      );
      toast.success(`Version ${version.is_active ? 'deactivated' : 'activated'}`);
      fetchAllData();
    } catch (error) {
      toast.error('Failed to update version status');
    }
  };

  const openEditVersion = (version) => {
    setEditingVersion(version);
    setNewAppVersion({
      platform: version.platform,
      version: version.version,
      version_code: version.version_code,
      download_url: version.download_url,
      release_notes: version.release_notes || '',
      min_supported_version: version.min_supported_version || '',
      is_mandatory: version.is_mandatory || false,
      file_size: version.file_size || ''
    });
    setShowAppVersionModal(true);
  };

  // Sale/Offer Management
  const saveSaleOffer = async () => {
    setSavingSaleOffer(true);
    try {
      await axios.post(
        `${API}/super-admin/sale-offer`,
        saleOffer,
        { params: credentials }
      );
      toast.success(saleOffer.enabled ? 'Sale offer enabled and saved!' : 'Sale offer disabled');
      setShowSaleOfferModal(false);
    } catch (error) {
      toast.error('Failed to save sale offer');
      console.error(error);
    } finally {
      setSavingSaleOffer(false);
    }
  };

  const toggleSaleOffer = async () => {
    const newEnabled = !saleOffer.enabled;
    const updatedOffer = { ...saleOffer, enabled: newEnabled };
    setSaleOffer(updatedOffer);
    
    try {
      await axios.post(
        `${API}/super-admin/sale-offer`,
        updatedOffer,
        { params: credentials }
      );
      toast.success(newEnabled ? 'Sale offer enabled!' : 'Sale offer disabled');
    } catch (error) {
      toast.error('Failed to toggle sale offer');
      setSaleOffer({ ...saleOffer, enabled: !newEnabled }); // Revert
    }
  };

  // Pricing Management
  const savePricing = async () => {
    setSavingPricing(true);
    try {
      await axios.post(
        `${API}/super-admin/pricing`,
        pricing,
        { params: credentials }
      );
      toast.success('Pricing updated successfully!');
    } catch (error) {
      toast.error('Failed to save pricing');
      console.error(error);
    } finally {
      setSavingPricing(false);
    }
  };

  const toggleCampaign = async () => {
    const newActive = !pricing.campaign_active;
    const updatedPricing = { ...pricing, campaign_active: newActive };
    setPricing(updatedPricing);
    
    try {
      await axios.post(
        `${API}/super-admin/pricing`,
        updatedPricing,
        { params: credentials }
      );
      toast.success(newActive ? 'Campaign activated!' : 'Campaign deactivated');
    } catch (error) {
      toast.error('Failed to toggle campaign');
      setPricing({ ...pricing, campaign_active: !newActive }); // Revert
    }
  };

  // View Business Details
  const viewBusinessDetails = async (userId) => {
    setBusinessDetailsLoading(true);
    try {
      const response = await axios.get(`${API}/super-admin/users/${userId}/business-details`, {
        params: credentials
      });
      setBusinessDetails(response.data);
      setShowBusinessDetails(true);
    } catch (error) {
      toast.error('Failed to load business details');
      console.error(error);
    } finally {
      setBusinessDetailsLoading(false);
    }
  };

  // Export User Full Data
  const exportUserData = async (userId, username) => {
    setExportingData(userId);
    try {
      const response = await axios.get(`${API}/super-admin/users/${userId}/full-data`, {
        params: credentials
      });
      
      // Create and download JSON file
      const dataStr = JSON.stringify(response.data, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${username}_business_data_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`Data exported for ${username}`);
    } catch (error) {
      toast.error('Failed to export data');
      console.error(error);
    } finally {
      setExportingData(null);
    }
  };

  // Update Staff Subscription
  const updateStaffSubscription = async (staffId, subscriptionActive) => {
    try {
      await axios.put(
        `${API}/super-admin/staff/${staffId}/subscription`,
        {},
        { params: { ...credentials, subscription_active: subscriptionActive } }
      );
      toast.success(`Staff subscription ${subscriptionActive ? 'activated' : 'deactivated'}`);
      // Refresh business details if open
      if (businessDetails) {
        viewBusinessDetails(businessDetails.user.id);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update staff subscription');
    }
  };

  // Export User Database (SQLite .db file)
  const exportUserDatabase = async (userId, username) => {
    setExportingDb(userId);
    try {
      const response = await axios.get(`${API}/super-admin/users/${userId}/export-db`, {
        params: credentials,
        responseType: 'blob'
      });
      
      // Create and download .db file
      const blob = new Blob([response.data], { type: 'application/x-sqlite3' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${username}_backup_${new Date().toISOString().split('T')[0]}.db`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`SQLite database exported for ${username}`);
    } catch (error) {
      toast.error('Failed to export database');
      console.error(error);
    } finally {
      setExportingDb(null);
    }
  };

  // Open Import Modal
  const openImportModal = (userId, username) => {
    setImportUserId(userId);
    setImportUsername(username);
    setImportFile(null);
    setImportReplaceMode(false);
    setShowImportModal(true);
  };

  // Handle Import File Selection
  const handleImportFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.endsWith('.db')) {
        toast.error('Please select a .db (SQLite) file');
        return;
      }
      setImportFile(file);
    }
  };

  // Import User Database
  const importUserDatabase = async () => {
    if (!importFile || !importUserId) {
      toast.error('Please select a database file');
      return;
    }

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', importFile);

      const response = await axios.post(
        `${API}/super-admin/users/${importUserId}/import-db`,
        formData,
        {
          params: { ...credentials, replace_existing: importReplaceMode },
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      const imported = response.data.imported;
      toast.success(
        `Database imported! Users: ${imported.users}, Orders: ${imported.orders}, Menu: ${imported.menu_items}, Tables: ${imported.tables}, Inventory: ${imported.inventory}, Payments: ${imported.payments}`
      );
      
      setShowImportModal(false);
      setImportFile(null);
      setImportUserId(null);
      setImportUsername('');
      
      // Refresh data
      fetchAllData();
      if (businessDetails && businessDetails.user?.id === importUserId) {
        viewBusinessDetails(importUserId);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to import database');
      console.error(error);
    } finally {
      setImporting(false);
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
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Authenticating...
                  </div>
                ) : 'Login'}
              </Button>
              
              {loading && (
                <Button 
                  type="button"
                  variant="outline"
                  className="w-full mt-2 border-gray-600 text-gray-300 hover:bg-gray-800"
                  onClick={() => {
                    setLoading(false);
                    toast.info('Login cancelled');
                  }}
                >
                  Cancel
                </Button>
              )}
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
              {cacheStatus && (
                <span className={`ml-3 px-2 py-1 rounded text-xs ${
                  cacheStatus.connected 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {cacheStatus.performance_mode}
                </span>
              )}
            </h1>
            <p className="text-gray-600">
              {userType === 'super-admin' ? (
                <span className="flex items-center gap-2">
                  Site Owner Dashboard
                  {cacheStatus && cacheStatus.connected && (
                    <span className="text-green-600 text-sm">⚡ Redis Accelerated</span>
                  )}
                </span>
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
          <div className="flex items-center gap-2">
            {userType === 'super-admin' && cacheStatus && (
              <Button
                onClick={() => invalidateCache('all')}
                variant="outline"
                size="sm"
                title="Clear all caches for fresh data"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Clear Cache
              </Button>
            )}
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
        </div>

        {/* Tabs - Show based on permissions */}
        <div className="mb-6 flex gap-2 border-b overflow-x-auto">
          {getAvailableTabs().map(tab => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
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
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Dashboard Overview</h2>
              <Button
                onClick={async () => {
                  setLoading(true);
                  try {
                    const dashboardResponse = await axios.get(`${API}/super-admin/dashboard`, {
                      params: credentials,
                      timeout: 15000
                    });
                    setDashboard(dashboardResponse.data);
                    toast.success('Dashboard refreshed');
                  } catch (error) {
                    console.error('Dashboard refresh failed:', error);
                    toast.error('Failed to refresh dashboard');
                  } finally {
                    setLoading(false);
                  }
                }}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full"></div>
                    Refreshing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Refresh Dashboard
                  </div>
                )}
              </Button>
            </div>
            
            {dashboard ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="w-4 h-4 text-gray-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboard.overview.total_users}</div>
                  <p className="text-xs text-gray-600">
                    {dashboard.overview.active_subscriptions} active subscriptions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
                  <Ticket className="w-4 h-4 text-gray-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboard.overview.open_tickets}</div>
                  <p className="text-xs text-gray-600">
                    {dashboard.overview.pending_tickets} pending
                  </p>
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
                  <p className="text-xs text-gray-600">
                    {dashboard.overview.new_leads || 0} new
                  </p>
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
          )}
        )}

        {/* Users Tab */}
        {activeTab === 'users' && hasPermission('users') && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  All Users & Subscription Management
                </CardTitle>
                <Button
                  onClick={loadUsersData}
                  variant="outline"
                  size="sm"
                  disabled={loadingUsers}
                >
                  {loadingUsers ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full"></div>
                      Loading...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" />
                      Refresh
                    </div>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading users data...</p>
                    <p className="text-sm text-gray-500 mt-1">This may take a few seconds</p>
                  </div>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-600 mb-2">No users data available</p>
                  <Button onClick={loadUsersData} variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Loading Again
                  </Button>
                </div>
              ) : (
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
                            <span className={`${new Date(user.subscription_expires_at) < new Date() ? 'text-red-600' : 'text-green-600'}`}>
                              {new Date(user.subscription_expires_at).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-2">
                          <span className="text-sm">
                            {7 + (user.trial_extension_days || 0)}d
                          </span>
                          {user.trial_extension_days > 0 && (
                            <span className="text-xs text-green-600 ml-1">(+{user.trial_extension_days})</span>
                          )}
                        </td>
                        <td className="p-2">{user.bill_count || 0}</td>
                        <td className="p-2">
                          <div className="flex flex-wrap gap-1">
                            {/* View Business Details */}
                            {hasPermission('view_details') && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => viewBusinessDetails(user.id)}
                                className="text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                title="View Business Details"
                                disabled={businessDetailsLoading}
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                Details
                              </Button>
                            )}
                            
                            {/* Export Data (JSON) */}
                            {hasPermission('export_data') && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => exportUserData(user.id, user.username)}
                                className="text-xs text-teal-600 border-teal-200 hover:bg-teal-50"
                                title="Export All Business Data (JSON)"
                                disabled={exportingData === user.id}
                              >
                                <Download className="w-3 h-3 mr-1" />
                                {exportingData === user.id ? '...' : 'JSON'}
                              </Button>
                            )}
                            
                            {/* Export Database (SQLite .db) */}
                            {hasPermission('export_data') && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => exportUserDatabase(user.id, user.username)}
                                className="text-xs text-cyan-600 border-cyan-200 hover:bg-cyan-50"
                                title="Export SQLite Database (.db)"
                                disabled={exportingDb === user.id}
                              >
                                <Database className="w-3 h-3 mr-1" />
                                {exportingDb === user.id ? '...' : 'DB'}
                              </Button>
                            )}
                            
                            {/* Import Database */}
                            {hasPermission('import_data') && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openImportModal(user.id, user.username)}
                                className="text-xs text-amber-600 border-amber-200 hover:bg-amber-50"
                                title="Import SQLite Database (.db)"
                              >
                                <Upload className="w-3 h-3 mr-1" />
                                Import
                              </Button>
                            )}
                            
                            {/* Subscription Management */}
                            {user.subscription_active ? (
                              <>
                                {hasPermission('send_invoice') && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => sendInvoiceEmail(user.id)}
                                    className="text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                                    title="Send Invoice Email"
                                  >
                                    <Mail className="w-3 h-3 mr-1" />
                                    Email
                                  </Button>
                                )}
                                {hasPermission('send_invoice') && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => previewInvoice(user)}
                                    className="text-xs text-purple-600 border-purple-200 hover:bg-purple-50"
                                    title="Preview & Download Invoice"
                                  >
                                    <FileText className="w-3 h-3 mr-1" />
                                    Invoice
                                  </Button>
                                )}
                                {hasPermission('deactivate_license') && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => deactivateSubscription(user.id)}
                                    className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                                  >
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Deactivate
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
                                  <CreditCard className="w-3 h-3 mr-1" />
                                  Activate
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

        {/* Leads Tab */}
        {activeTab === 'leads' && hasPermission('leads') && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Lead Management
                  </CardTitle>
                  {leadsStats && !loadingLeads && (
                    <div className="flex gap-4 mt-2 text-sm">
                      <span className="text-blue-600">New: {leadsStats.new}</span>
                      <span className="text-yellow-600">Contacted: {leadsStats.contacted}</span>
                      <span className="text-green-600">Converted: {leadsStats.converted}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={loadLeadsData}
                    variant="outline"
                    size="sm"
                    disabled={loadingLeads}
                  >
                    {loadingLeads ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full"></div>
                        Loading...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                      </div>
                    )}
                  </Button>
                  <Button onClick={() => setShowCreateLead(true)}>
                    + Add Lead
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingLeads ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading leads data...</p>
                    <p className="text-sm text-gray-500 mt-1">This may take a few seconds</p>
                  </div>
                </div>
              ) : leads.length === 0 ? (
                <div className="text-center py-12">
                  <UserPlus className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-600 mb-2">No leads data available</p>
                  <p className="text-sm text-gray-500 mb-4">Leads will appear here when visitors fill the "Get Started" form.</p>
                  <Button onClick={loadLeadsData} variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Loading Again
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Name</th>
                        <th className="text-left p-2">Email</th>
                        <th className="text-left p-2">Phone</th>
                        <th className="text-left p-2">Business</th>
                        <th className="text-left p-2">Source</th>
                        <th className="text-left p-2">Date</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                    {leads.map(lead => (
                      <tr key={lead.timestamp} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{lead.name}</td>
                        <td className="p-2">{lead.email}</td>
                        <td className="p-2">{lead.phone}</td>
                        <td className="p-2">{lead.businessName || '-'}</td>
                        <td className="p-2">
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                            {lead.source}
                          </span>
                        </td>
                        <td className="p-2 text-sm text-gray-600">
                          {new Date(lead.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-2">
                          <select
                            value={lead.status}
                            onChange={(e) => updateLeadStatus(lead.timestamp, e.target.value)}
                            className={`px-2 py-1 border rounded text-xs ${
                              lead.status === 'new' ? 'bg-blue-50 text-blue-800' :
                              lead.status === 'contacted' ? 'bg-yellow-50 text-yellow-800' :
                              'bg-green-50 text-green-800'
                            }`}
                          >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="converted">Converted</option>
                            <option value="not_interested">Not Interested</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteLead(lead.timestamp)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {leads.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No leads yet. They will appear here when visitors fill the "Get Started" form.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tickets Tab */}
        {activeTab === 'tickets' && hasPermission('tickets') && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="w-5 h-5" />
                  Support Tickets
                </CardTitle>
                <Button
                  onClick={loadTicketsData}
                  variant="outline"
                  size="sm"
                  disabled={loadingTickets}
                >
                  {loadingTickets ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full"></div>
                      Loading...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" />
                      Refresh
                    </div>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingTickets ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading tickets data...</p>
                    <p className="text-sm text-gray-500 mt-1">This may take a few seconds</p>
                  </div>
                </div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-12">
                  <Ticket className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-600 mb-2">No support tickets available</p>
                  <p className="text-sm text-gray-500 mb-4">Tickets will appear here when users submit support requests.</p>
                  <Button onClick={loadTicketsData} variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Loading Again
                  </Button>
                </div>
              ) : (
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
                        <a href={`mailto:${ticket.email}`} className="text-blue-600 hover:underline">{ticket.email}</a>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block">Phone</span>
                        {ticket.phone ? (
                          <a href={`tel:${ticket.phone}`} className="text-blue-600 hover:underline">{ticket.phone}</a>
                        ) : (
                          <span className="text-gray-400">Not provided</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Demo booking details */}
                    {ticket.request_type === 'demo' && (ticket.preferred_date || ticket.preferred_time) && (
                      <div className="mb-3 p-3 bg-purple-50 rounded border border-purple-200">
                        <span className="text-xs text-purple-600 font-medium block mb-1">📅 Demo Booking Request</span>
                        <div className="flex gap-4">
                          {ticket.preferred_date && (
                            <span className="text-sm"><strong>Date:</strong> {ticket.preferred_date}</span>
                          )}
                          {ticket.preferred_time && (
                            <span className="text-sm"><strong>Time:</strong> {ticket.preferred_time}</span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Message */}
                    <div className="mb-3">
                      <span className="text-xs text-gray-500 block mb-1">Message</span>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-3 border rounded">{ticket.message}</p>
                    </div>
                    
                    {/* Previous Replies */}
                    {ticket.replies && ticket.replies.length > 0 && (
                      <div className="mb-3">
                        <span className="text-xs text-gray-500 block mb-2">💬 Conversation History</span>
                        <div className="space-y-2">
                          {ticket.replies.map((reply, idx) => (
                            <div key={idx} className="p-3 bg-green-50 border border-green-200 rounded">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-green-700">
                                  {reply.from === 'support' ? `Support (${reply.admin_name})` : 'Customer'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(reply.created_at).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">{reply.message}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Reply Form */}
                    <div className="mb-3 p-3 bg-blue-50 rounded border border-blue-200">
                      <span className="text-xs text-blue-600 font-medium block mb-2">📧 Reply to Customer (sends email from support@billbytekot.in)</span>
                      <textarea
                        id={`reply-${ticket.id}`}
                        placeholder="Type your reply here..."
                        className="w-full p-2 border rounded text-sm min-h-[80px] mb-2"
                        rows={3}
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={async () => {
                            const textarea = document.getElementById(`reply-${ticket.id}`);
                            const message = textarea?.value?.trim();
                            if (!message) {
                              toast.error('Please enter a reply message');
                              return;
                            }
                            try {
                              if (userType === 'super-admin') {
                                await axios.post(
                                  `${API}/super-admin/tickets/${ticket.id}/reply`,
                                  { message, update_status: 'pending' },
                                  { params: credentials }
                                );
                              } else {
                                await axios.post(
                                  `${API}/support/ticket/${ticket.id}/reply`,
                                  { message, update_status: 'pending' },
                                  { headers: { Authorization: `Bearer ${teamToken}` } }
                                );
                              }
                              toast.success('Reply sent successfully! Email sent to customer.');
                              textarea.value = '';
                              userType === 'super-admin' ? fetchAllData() : fetchTeamData(teamToken, teamUser);
                            } catch (error) {
                              toast.error(error.response?.data?.detail || 'Failed to send reply');
                            }
                          }}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Send Reply & Email
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            const textarea = document.getElementById(`reply-${ticket.id}`);
                            const message = textarea?.value?.trim();
                            if (!message) {
                              toast.error('Please enter a reply message');
                              return;
                            }
                            try {
                              if (userType === 'super-admin') {
                                await axios.post(
                                  `${API}/super-admin/tickets/${ticket.id}/reply`,
                                  { message, update_status: 'resolved' },
                                  { params: credentials }
                                );
                              } else {
                                await axios.post(
                                  `${API}/support/ticket/${ticket.id}/reply`,
                                  { message, update_status: 'resolved' },
                                  { headers: { Authorization: `Bearer ${teamToken}` } }
                                );
                              }
                              toast.success('Reply sent & ticket resolved!');
                              textarea.value = '';
                              userType === 'super-admin' ? fetchAllData() : fetchTeamData(teamToken, teamUser);
                            } catch (error) {
                              toast.error(error.response?.data?.detail || 'Failed to send reply');
                            }
                          }}
                          className="border-green-300 text-green-700 hover:bg-green-50"
                        >
                          Send & Resolve
                        </Button>
                      </div>
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

        {/* Team Tab - Super Admin Only */}
        {activeTab === 'team' && userType === 'super-admin' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team Management</CardTitle>
                  {teamStats && (
                    <div className="flex gap-4 mt-2 text-sm">
                      <span className="text-blue-600">Sales: {teamStats.sales}</span>
                      <span className="text-green-600">Support: {teamStats.support}</span>
                      <span className="text-purple-600">Admin: {teamStats.admin}</span>
                    </div>
                  )}
                </div>
                <Button onClick={() => setShowCreateTeam(true)}>
                  + Add Team Member
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Username</th>
                      <th className="text-left p-2">Email</th>
                      <th className="text-left p-2">Role</th>
                      <th className="text-left p-2">Permissions</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.map(member => (
                      <tr key={member.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{member.full_name || '-'}</td>
                        <td className="p-2">{member.username}</td>
                        <td className="p-2">{member.email}</td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            member.role === 'sales' ? 'bg-blue-100 text-blue-800' :
                            member.role === 'support' ? 'bg-green-100 text-green-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {member.role}
                          </span>
                        </td>
                        <td className="p-2 text-sm">
                          <div className="flex flex-wrap gap-1">
                            {member.permissions?.filter(p => ['leads', 'tickets', 'users', 'analytics'].includes(p)).map(p => (
                              <span key={p} className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{p}</span>
                            ))}
                            {member.permissions?.filter(p => !['leads', 'tickets', 'users', 'analytics'].includes(p)).length > 0 && (
                              <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                                +{member.permissions.filter(p => !['leads', 'tickets', 'users', 'analytics'].includes(p)).length} actions
                              </span>
                            )}
                            {(!member.permissions || member.permissions.length === 0) && <span className="text-gray-400">None</span>}
                          </div>
                        </td>
                        <td className="p-2">
                          <button
                            onClick={() => updateTeamMember(member.id, { active: !member.active })}
                            className={`px-2 py-1 rounded text-xs ${
                              member.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {member.active ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="p-2">
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingTeamMember(member);
                                setNewTeamMember({
                                  username: member.username,
                                  email: member.email,
                                  password: '',
                                  role: member.role,
                                  permissions: member.permissions || [],
                                  full_name: member.full_name || '',
                                  phone: member.phone || ''
                                });
                                setShowEditTeamModal(true);
                              }}
                              className="text-xs"
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteTeamMember(member.id)}
                              className="text-xs"
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {teamMembers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No team members yet. Add sales or support team members to give them access.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analytics Tab - Super Admin Only */}
        {activeTab === 'analytics' && userType === 'super-admin' && analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Last 30 Days</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">New Users</span>
                    <span className="font-semibold">{analytics.new_users}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{width: '60%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">New Orders</span>
                    <span className="font-semibold">{analytics.new_orders}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{width: '80%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">Active Users</span>
                    <span className="font-semibold">{analytics.active_users}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{width: '70%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">New Tickets</span>
                    <span className="font-semibold">{analytics.new_tickets}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-red-600 h-2 rounded-full" style={{width: '40%'}}></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Database Status</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                      Healthy
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">API Status</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                      Online
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Email Service</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                      Active
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* App Versions Tab - Super Admin Only */}
        {activeTab === 'app-versions' && userType === 'super-admin' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    App Version Management
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">Manage Android APK and Windows app downloads</p>
                </div>
                <Button 
                  onClick={() => {
                    setEditingVersion(null);
                    setNewAppVersion({
                      platform: 'android',
                      version: '',
                      version_code: 1,
                      download_url: '',
                      release_notes: '',
                      min_supported_version: '',
                      is_mandatory: false,
                      file_size: ''
                    });
                    setShowAppVersionModal(true);
                  }}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Version
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Platform Sections */}
              <div className="space-y-6">
                {/* Android Section */}
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                    <Smartphone className="w-5 h-5 text-green-600" />
                    Android APK
                  </h3>
                  <div className="space-y-2">
                    {appVersions.filter(v => v.platform === 'android').length === 0 ? (
                      <p className="text-gray-500 text-sm py-4 text-center bg-gray-50 rounded-lg">No Android versions added yet</p>
                    ) : (
                      appVersions.filter(v => v.platform === 'android').map(version => (
                        <div key={version.id} className={`p-4 rounded-lg border-2 ${version.is_active ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${version.is_active ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                                <Smartphone className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">v{version.version}</span>
                                  <span className="text-xs text-gray-500">(Code: {version.version_code})</span>
                                  {version.is_active && <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">Active</span>}
                                  {version.is_mandatory && <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">Mandatory</span>}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  {version.file_size && `${version.file_size} • `}
                                  {version.download_count || 0} downloads
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <a href={version.download_url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-gray-200 rounded-lg" title="Open URL">
                                <ExternalLink className="w-4 h-4 text-gray-600" />
                              </a>
                              <button onClick={() => openEditVersion(version)} className="p-2 hover:bg-blue-100 rounded-lg" title="Edit">
                                <Edit className="w-4 h-4 text-blue-600" />
                              </button>
                              <button onClick={() => toggleAppVersionActive(version)} className={`p-2 rounded-lg ${version.is_active ? 'hover:bg-orange-100' : 'hover:bg-green-100'}`} title={version.is_active ? 'Deactivate' : 'Activate'}>
                                {version.is_active ? <XCircle className="w-4 h-4 text-orange-600" /> : <CheckCircle className="w-4 h-4 text-green-600" />}
                              </button>
                              <button onClick={() => deleteAppVersion(version.id)} className="p-2 hover:bg-red-100 rounded-lg" title="Delete">
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </button>
                            </div>
                          </div>
                          {version.release_notes && (
                            <p className="text-sm text-gray-600 mt-2 pl-13">{version.release_notes}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-2 pl-13 truncate">URL: {version.download_url}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Windows Section */}
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                    <Monitor className="w-5 h-5 text-blue-600" />
                    Windows App
                  </h3>
                  <div className="space-y-2">
                    {appVersions.filter(v => v.platform === 'windows').length === 0 ? (
                      <p className="text-gray-500 text-sm py-4 text-center bg-gray-50 rounded-lg">No Windows versions added yet</p>
                    ) : (
                      appVersions.filter(v => v.platform === 'windows').map(version => (
                        <div key={version.id} className={`p-4 rounded-lg border-2 ${version.is_active ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${version.is_active ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                                <Monitor className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">v{version.version}</span>
                                  <span className="text-xs text-gray-500">(Code: {version.version_code})</span>
                                  {version.is_active && <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">Active</span>}
                                  {version.is_mandatory && <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">Mandatory</span>}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  {version.file_size && `${version.file_size} • `}
                                  {version.download_count || 0} downloads
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <a href={version.download_url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-gray-200 rounded-lg" title="Open URL">
                                <ExternalLink className="w-4 h-4 text-gray-600" />
                              </a>
                              <button onClick={() => openEditVersion(version)} className="p-2 hover:bg-blue-100 rounded-lg" title="Edit">
                                <Edit className="w-4 h-4 text-blue-600" />
                              </button>
                              <button onClick={() => toggleAppVersionActive(version)} className={`p-2 rounded-lg ${version.is_active ? 'hover:bg-orange-100' : 'hover:bg-green-100'}`} title={version.is_active ? 'Deactivate' : 'Activate'}>
                                {version.is_active ? <XCircle className="w-4 h-4 text-orange-600" /> : <CheckCircle className="w-4 h-4 text-green-600" />}
                              </button>
                              <button onClick={() => deleteAppVersion(version.id)} className="p-2 hover:bg-red-100 rounded-lg" title="Delete">
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </button>
                            </div>
                          </div>
                          {version.release_notes && (
                            <p className="text-sm text-gray-600 mt-2 pl-13">{version.release_notes}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-2 pl-13 truncate">URL: {version.download_url}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Public Download URLs Info */}
              <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                <h4 className="font-medium text-sm mb-2">📱 Public Download Endpoints:</h4>
                <div className="space-y-1 text-xs font-mono text-gray-600">
                  <p>Android: <span className="text-purple-600">{API}/app/latest/android</span></p>
                  <p>Windows: <span className="text-purple-600">{API}/app/latest/windows</span></p>
                  <p>Check Update: <span className="text-purple-600">{API}/app/check-update/[platform]/[version]</span></p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Promotions Tab - Super Admin Only */}
        {activeTab === 'promotions' && userType === 'super-admin' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="w-5 h-5" />
                    Sale & Promotions
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">Manage landing page sale banners and offers</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Sale Offer Toggle Card */}
              <div className={`p-6 rounded-xl border-2 ${saleOffer.enabled ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${saleOffer.enabled ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                      <Percent className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Sale Day / Special Offer</h3>
                      <p className="text-sm text-gray-500">Show promotional banner on landing page</p>
                    </div>
                  </div>
                  <button
                    onClick={toggleSaleOffer}
                    className={`relative w-14 h-7 rounded-full transition-colors ${saleOffer.enabled ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${saleOffer.enabled ? 'translate-x-8' : 'translate-x-1'}`} />
                  </button>
                </div>

                {saleOffer.enabled && (
                  <div className="space-y-4 pt-4 border-t">
                    {/* Preview */}
                    <div className="mb-4">
                      <Label className="text-xs text-gray-500 mb-2 block">Preview:</Label>
                      <div className={`p-4 rounded-lg bg-gradient-to-r ${saleOffer.bg_color || 'from-red-500 to-orange-500'} text-white`}>
                        <div className="flex items-center justify-between">
                          <div>
                            {saleOffer.badge_text && (
                              <span className="px-2 py-1 bg-white/20 rounded text-xs font-bold mb-1 inline-block">{saleOffer.badge_text}</span>
                            )}
                            <h4 className="font-bold text-lg">{saleOffer.title || 'Sale Title'}</h4>
                            <p className="text-sm opacity-90">{saleOffer.subtitle || 'Sale subtitle goes here'}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-2xl font-bold">{saleOffer.discount_text || '50% OFF'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Edit Form */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Badge Text (e.g., "LIMITED TIME")</Label>
                        <Input
                          value={saleOffer.badge_text}
                          onChange={(e) => setSaleOffer({...saleOffer, badge_text: e.target.value})}
                          placeholder="🔥 LIMITED TIME"
                        />
                      </div>
                      <div>
                        <Label>Discount Text</Label>
                        <Input
                          value={saleOffer.discount_text}
                          onChange={(e) => setSaleOffer({...saleOffer, discount_text: e.target.value})}
                          placeholder="50% OFF"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Title</Label>
                      <Input
                        value={saleOffer.title}
                        onChange={(e) => setSaleOffer({...saleOffer, title: e.target.value})}
                        placeholder="New Year Sale!"
                      />
                    </div>

                    <div>
                      <Label>Subtitle</Label>
                      <Input
                        value={saleOffer.subtitle}
                        onChange={(e) => setSaleOffer({...saleOffer, subtitle: e.target.value})}
                        placeholder="Get premium subscription at discounted price"
                      />
                    </div>

                    {/* Banner Design Selector */}
                    <div className="p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg border border-violet-200">
                      <Label className="text-violet-700 font-medium mb-2 block">🎨 Top Banner Design</Label>
                      <p className="text-xs text-violet-600 mb-3">Choose an animated banner design for the landing page</p>
                      <select
                        value={saleOffer.banner_design || 'gradient-wave'}
                        onChange={(e) => setSaleOffer({...saleOffer, banner_design: e.target.value})}
                        className="w-full px-3 py-2 border border-violet-300 rounded-lg bg-white"
                      >
                        <option value="gradient-wave">🌊 Gradient Wave (Floating particles)</option>
                        <option value="neon-glow">� NeonB Glow (Cyberpunk style)</option>
                        <option value="festive-confetti">🎊 Festive Confetti (Celebration)</option>
                        <option value="minimal-elegant">✨ Minimal Elegant (Clean & Simple)</option>
                        <option value="marquee-urgent">🔥 Marquee Urgent (Scrolling text)</option>
                        <option value="glass-modern">🪟 Glass Modern (Glassmorphism)</option>
                        <option value="retro-pixel">👾 Retro Pixel (Gaming style)</option>
                        <option value="rainbow-gradient">🌈 Rainbow Gradient (Colorful)</option>
                        <option value="split-diagonal">⚡ Split Diagonal (Bold)</option>
                        <option value="countdown-focus">⏰ Countdown Focus (Timer prominent)</option>
                        <option value="early-adopter">🔥 Early Adopter (₹9/Year 99% OFF)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Sale Theme (Hero Banner)</Label>
                        <select
                          value={saleOffer.theme || 'default'}
                          onChange={(e) => setSaleOffer({...saleOffer, theme: e.target.value})}
                          className="w-full px-3 py-2 border rounded-lg"
                        >
                          <option value="default">🎯 Default (Violet)</option>
                          <option value="flash">⚡ Flash Sale (Red/Orange)</option>
                          <option value="blackfriday">🖤 Black Friday</option>
                          <option value="diwali">🪔 Diwali Special</option>
                          <option value="christmas">🎄 Christmas</option>
                          <option value="newyear">🎉 New Year</option>
                          <option value="republic">🇮🇳 Republic Day</option>
                          <option value="holi">🎨 Holi Festival</option>
                          <option value="summer">☀️ Summer Sale</option>
                        </select>
                      </div>
                      <div>
                        <Label>Discount Percent</Label>
                        <Input
                          type="number"
                          value={saleOffer.discount_percent || 20}
                          onChange={(e) => setSaleOffer({...saleOffer, discount_percent: Number(e.target.value)})}
                          placeholder="20"
                          min="1"
                          max="90"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Original Price (₹)</Label>
                        <Input
                          type="number"
                          value={saleOffer.original_price || 1999}
                          onChange={(e) => setSaleOffer({...saleOffer, original_price: Number(e.target.value)})}
                          placeholder="1999"
                        />
                      </div>
                      <div>
                        <Label>Sale Price (₹)</Label>
                        <Input
                          type="number"
                          value={saleOffer.sale_price || 1599}
                          onChange={(e) => setSaleOffer({...saleOffer, sale_price: Number(e.target.value)})}
                          placeholder="1599"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Background Color</Label>
                        <select
                          value={saleOffer.bg_color}
                          onChange={(e) => setSaleOffer({...saleOffer, bg_color: e.target.value})}
                          className="w-full px-3 py-2 border rounded-lg"
                        >
                          <option value="from-red-500 to-orange-500">Red to Orange</option>
                          <option value="from-purple-500 to-pink-500">Purple to Pink</option>
                          <option value="from-blue-500 to-cyan-500">Blue to Cyan</option>
                          <option value="from-green-500 to-emerald-500">Green to Emerald</option>
                          <option value="from-yellow-500 to-orange-500">Yellow to Orange</option>
                          <option value="from-indigo-500 to-purple-500">Indigo to Purple</option>
                          <option value="from-pink-500 to-rose-500">Pink to Rose</option>
                          <option value="from-orange-500 via-red-500 to-pink-500">Diwali (Orange-Red-Pink)</option>
                          <option value="from-red-600 via-red-500 to-green-600">Christmas (Red-Green)</option>
                          <option value="from-indigo-900 via-purple-900 to-pink-900">New Year (Dark Purple)</option>
                          <option value="from-gray-900 via-black to-gray-900">Black Friday</option>
                        </select>
                      </div>
                      <div>
                        <Label>End Date</Label>
                        <Input
                          type="date"
                          value={saleOffer.end_date}
                          onChange={(e) => setSaleOffer({...saleOffer, end_date: e.target.value})}
                        />
                      </div>
                    </div>

                    <div>
                      <Label>CTA Button Text</Label>
                      <Input
                        value={saleOffer.cta_text || ''}
                        onChange={(e) => setSaleOffer({...saleOffer, cta_text: e.target.value})}
                        placeholder="Grab This Deal Now!"
                      />
                    </div>

                    <div>
                      <Label>Urgency Text</Label>
                      <Input
                        value={saleOffer.urgency_text || ''}
                        onChange={(e) => setSaleOffer({...saleOffer, urgency_text: e.target.value})}
                        placeholder="⚡ Limited slots available. Offer ends soon!"
                      />
                    </div>

                    {/* Exact Validity DateTime */}
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <Label className="text-orange-700 font-medium">⏰ Valid Until (Exact Date & Time)</Label>
                      <p className="text-xs text-orange-600 mb-2">Banner will auto-hide after this exact time</p>
                      <Input
                        type="datetime-local"
                        value={saleOffer.valid_until}
                        onChange={(e) => setSaleOffer({...saleOffer, valid_until: e.target.value})}
                        className="mt-1"
                      />
                      {saleOffer.valid_until && (
                        <p className="text-xs text-orange-600 mt-2">
                          Offer expires: {new Date(saleOffer.valid_until).toLocaleString('en-IN', { 
                            dateStyle: 'full', 
                            timeStyle: 'short' 
                          })}
                        </p>
                      )}
                    </div>

                    <Button
                      onClick={saveSaleOffer}
                      disabled={savingSaleOffer}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                    >
                      {savingSaleOffer ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {!saleOffer.enabled && (
                  <p className="text-sm text-gray-500 mt-2">
                    Enable to show a promotional banner on the landing page. Configure the offer details after enabling.
                  </p>
                )}
              </div>

              {/* Info */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-sm text-blue-800 mb-2">💡 How it works:</h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• When enabled, a promotional banner will appear on the landing page</li>
                  <li>• The banner shows your custom title, subtitle, and discount text</li>
                  <li>• Set an end date OR exact validity time to auto-expire the offer</li>
                  <li>• Banner auto-hides when validity expires - no manual action needed</li>
                  <li>• Toggle off anytime to hide the banner immediately</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pricing Tab - Super Admin Only */}
        {activeTab === 'pricing' && userType === 'super-admin' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Subscription Pricing
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">Manage subscription prices and campaigns</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Regular Pricing */}
              <div className="p-6 rounded-xl border-2 border-gray-200 bg-gray-50">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-gray-600" />
                  Regular Pricing
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Regular Price (₹)</Label>
                    <Input
                      type="number"
                      value={pricing.regular_price}
                      onChange={(e) => setPricing({...pricing, regular_price: parseInt(e.target.value) || 0, regular_price_display: `₹${e.target.value}`})}
                      placeholder="1999"
                    />
                  </div>
                  <div>
                    <Label>Trial Days</Label>
                    <Input
                      type="number"
                      value={pricing.trial_days}
                      onChange={(e) => setPricing({...pricing, trial_days: parseInt(e.target.value) || 7})}
                      placeholder="7"
                    />
                  </div>
                  <div>
                    <Label>Subscription Duration (months)</Label>
                    <Input
                      type="number"
                      value={pricing.subscription_months}
                      onChange={(e) => setPricing({...pricing, subscription_months: parseInt(e.target.value) || 12})}
                      placeholder="12"
                    />
                  </div>
                  <div>
                    <Label>Trial Expired Discount (%)</Label>
                    <Input
                      type="number"
                      value={pricing.trial_expired_discount}
                      onChange={(e) => setPricing({...pricing, trial_expired_discount: parseInt(e.target.value) || 10})}
                      placeholder="10"
                    />
                    <p className="text-xs text-gray-500 mt-1">Discount shown when user's trial expires</p>
                  </div>
                </div>
                {/* Trial Expired Preview */}
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 font-medium">Trial Expired Offer Preview:</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="line-through text-gray-500">₹{pricing.regular_price}</span>
                    <span className="text-xl font-bold text-red-600">₹{Math.round(pricing.regular_price * (100 - pricing.trial_expired_discount) / 100)}</span>
                    <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs">{pricing.trial_expired_discount}% OFF</span>
                  </div>
                </div>
              </div>

              {/* Campaign Pricing */}
              <div className={`p-6 rounded-xl border-2 ${pricing.campaign_active ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${pricing.campaign_active ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                      <Gift className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Campaign / Special Offer</h3>
                      <p className="text-sm text-gray-500">Enable discounted pricing for campaigns</p>
                    </div>
                  </div>
                  <button
                    onClick={toggleCampaign}
                    className={`relative w-14 h-7 rounded-full transition-colors ${pricing.campaign_active ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${pricing.campaign_active ? 'translate-x-8' : 'translate-x-1'}`} />
                  </button>
                </div>

                {pricing.campaign_active && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Campaign Name</Label>
                        <Input
                          value={pricing.campaign_name}
                          onChange={(e) => setPricing({...pricing, campaign_name: e.target.value})}
                          placeholder="NEWYEAR2026"
                        />
                      </div>
                      <div>
                        <Label>Discount Percentage (%)</Label>
                        <Input
                          type="number"
                          value={pricing.campaign_discount_percent}
                          onChange={(e) => setPricing({...pricing, campaign_discount_percent: parseInt(e.target.value) || 0})}
                          placeholder="40"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Campaign Price (₹)</Label>
                        <Input
                          type="number"
                          value={pricing.campaign_price}
                          onChange={(e) => setPricing({...pricing, campaign_price: parseInt(e.target.value) || 0, campaign_price_display: `₹${e.target.value}`})}
                          placeholder="599"
                        />
                      </div>
                      <div>
                        <Label>Display Text</Label>
                        <Input
                          value={pricing.campaign_price_display}
                          onChange={(e) => setPricing({...pricing, campaign_price_display: e.target.value})}
                          placeholder="₹599"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Start Date</Label>
                        <Input
                          type="date"
                          value={pricing.campaign_start_date}
                          onChange={(e) => setPricing({...pricing, campaign_start_date: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>End Date</Label>
                        <Input
                          type="date"
                          value={pricing.campaign_end_date}
                          onChange={(e) => setPricing({...pricing, campaign_end_date: e.target.value})}
                        />
                      </div>
                    </div>

                    {/* Preview */}
                    <div className="p-4 bg-gradient-to-r from-violet-500 to-purple-600 rounded-lg text-white">
                      <p className="text-sm opacity-80">Preview:</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="line-through opacity-70">{pricing.regular_price_display}</span>
                        <span className="text-3xl font-bold">{pricing.campaign_price_display}</span>
                        <span className="bg-white/20 px-2 py-1 rounded text-sm">{pricing.campaign_discount_percent}% OFF</span>
                      </div>
                      <p className="text-sm mt-1 opacity-80">Campaign: {pricing.campaign_name}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Save Button */}
              <Button
                onClick={savePricing}
                disabled={savingPricing}
                className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
              >
                {savingPricing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Save Pricing Settings
                  </>
                )}
              </Button>

              {/* Info */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-sm text-blue-800 mb-2">💡 How pricing works:</h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Regular price is shown when no campaign is active</li>
                  <li>• Campaign price is shown when campaign is enabled and within date range</li>
                  <li>• Changes apply immediately to the subscription page</li>
                  <li>• Trial days determine how long users can try before subscribing</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notifications Tab - Super Admin Only */}
        {activeTab === 'notifications' && userType === 'super-admin' && (
          <div className="space-y-4">
            {/* Send Notification Card */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Push Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Quick Templates */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Quick Templates</Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { icon: '🎉', label: 'Welcome', title: 'Welcome to BillByteKOT!', message: 'Thanks for joining! Start creating orders and managing your restaurant like a pro.', type: 'success' },
                        { icon: '🚀', label: 'New Feature', title: 'New Feature Alert!', message: 'We\'ve added exciting new features. Check them out now!', type: 'info' },
                        { icon: '🎁', label: 'Promo', title: 'Special Offer Just For You!', message: 'Get 50% off on your subscription. Limited time only!', type: 'promo' },
                        { icon: '⚠️', label: 'Maintenance', title: 'Scheduled Maintenance', message: 'We\'ll be performing maintenance soon. Service may be briefly unavailable.', type: 'warning' },
                        { icon: '⏰', label: 'Trial Ending', title: 'Your Trial Ends Soon!', message: 'Don\'t lose access! Subscribe now to continue using all features.', type: 'warning' },
                        { icon: '💜', label: 'Thank You', title: 'Thank You!', message: 'Thanks for being part of the BillByteKOT family. We appreciate you!', type: 'success' },
                        { icon: '✨', label: 'Update', title: 'App Updated!', message: 'We\'ve made improvements to make your experience even better.', type: 'info' },
                        { icon: '💡', label: 'Pro Tip', title: 'Pro Tip', message: 'Did you know? You can print receipts directly from the app!', type: 'info' }
                      ].map((template, idx) => (
                        <button
                          key={idx}
                          onClick={() => setNewNotification({
                            ...newNotification,
                            title: template.title,
                            message: template.message,
                            type: template.type
                          })}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-violet-100 rounded-full text-xs font-medium transition-colors flex items-center gap-1"
                        >
                          {template.icon} {template.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notification Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Title *</Label>
                      <Input
                        value={newNotification.title}
                        onChange={(e) => setNewNotification({...newNotification, title: e.target.value})}
                        placeholder="Notification title"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Type</Label>
                      <select
                        value={newNotification.type}
                        onChange={(e) => setNewNotification({...newNotification, type: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg mt-1"
                      >
                        <option value="info">📢 Info</option>
                        <option value="success">✅ Success</option>
                        <option value="warning">⚠️ Warning</option>
                        <option value="error">❌ Error</option>
                        <option value="promo">🎉 Promo</option>
                        <option value="order">🍽️ Order</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label>Message *</Label>
                    <textarea
                      value={newNotification.message}
                      onChange={(e) => setNewNotification({...newNotification, message: e.target.value})}
                      placeholder="Notification message..."
                      className="w-full px-3 py-2 border rounded-lg mt-1 h-20 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Target Audience</Label>
                      <select
                        value={newNotification.target}
                        onChange={(e) => setNewNotification({...newNotification, target: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg mt-1"
                      >
                        <option value="all">All Users</option>
                        <option value="subscribed">Subscribed Users Only</option>
                        <option value="trial">Trial Users Only</option>
                      </select>
                    </div>
                    <div>
                      <Label>Priority</Label>
                      <select
                        value={newNotification.priority}
                        onChange={(e) => setNewNotification({...newNotification, priority: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg mt-1"
                      >
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="p-4 bg-gray-900 rounded-xl">
                    <p className="text-xs text-gray-400 mb-2">Preview:</p>
                    <div className={`p-4 rounded-xl text-white ${
                      newNotification.type === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                      newNotification.type === 'warning' ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                      newNotification.type === 'error' ? 'bg-gradient-to-r from-red-500 to-rose-500' :
                      newNotification.type === 'promo' ? 'bg-gradient-to-r from-pink-500 to-rose-400' :
                      newNotification.type === 'order' ? 'bg-gradient-to-r from-amber-400 to-yellow-400' :
                      'bg-gradient-to-r from-violet-500 to-purple-500'
                    }`}>
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">
                          {newNotification.type === 'success' ? '✅' :
                           newNotification.type === 'warning' ? '⚠️' :
                           newNotification.type === 'error' ? '❌' :
                           newNotification.type === 'promo' ? '🎉' :
                           newNotification.type === 'order' ? '🍽️' : '📢'}
                        </span>
                        <div>
                          <p className="font-bold">{newNotification.title || 'Notification Title'}</p>
                          <p className="text-sm opacity-90 mt-1">{newNotification.message || 'Notification message will appear here...'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Send Button */}
                  <Button
                    onClick={async () => {
                      if (!newNotification.title || !newNotification.message) {
                        toast.error('Title and message are required');
                        return;
                      }
                      setSendingNotification(true);
                      try {
                        // Send FCM push notification (real push like WhatsApp)
                        const fcmResponse = await axios.post(
                          `${API}/fcm/send?username=${credentials.username}&password=${credentials.password}`,
                          {
                            title: newNotification.title,
                            body: newNotification.message,
                            type: newNotification.type,
                            priority: newNotification.priority,
                            target: newNotification.target,
                            url: newNotification.action_url || '/',
                            image: newNotification.image || null
                          }
                        );
                        
                        // Also send in-app notification
                        const response = await axios.post(
                          `${API}/super-admin/notifications/send?username=${credentials.username}&password=${credentials.password}`,
                          newNotification
                        );
                        
                        const fcmCount = fcmResponse.data.sent_count || 0;
                        const inAppCount = response.data.target_users_count || 0;
                        
                        if (fcmCount > 0) {
                          toast.success(`📱 Push sent to ${fcmCount} devices! 💬 In-app: ${inAppCount} users`);
                        } else {
                          toast.success(`💬 In-app notification sent to ${inAppCount} users`);
                          if (fcmResponse.data.message) {
                            toast.info(fcmResponse.data.message);
                          }
                        }
                        
                        setNewNotification({
                          title: '',
                          message: '',
                          type: 'info',
                          target: 'all',
                          target_users: [],
                          action_url: '',
                          action_label: '',
                          priority: 'normal',
                          expires_at: '',
                          image: ''
                        });
                        
                        // Refresh stats
                        const [notifResponse, fcmStatsRes] = await Promise.all([
                          axios.get(`${API}/super-admin/notifications?username=${credentials.username}&password=${credentials.password}`),
                          axios.get(`${API}/fcm/stats?username=${credentials.username}&password=${credentials.password}`).catch(() => ({ data: {} }))
                        ]);
                        setNotifications(notifResponse.data.notifications || []);
                        setPushStats(fcmStatsRes.data || {});
                      } catch (error) {
                        toast.error(error.response?.data?.detail || 'Failed to send notification');
                      }
                      setSendingNotification(false);
                    }}
                    disabled={sendingNotification || !newNotification.title || !newNotification.message}
                    className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                  >
                    {sendingNotification ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        📱 Send Push Notification (Like WhatsApp)
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Push Notification Subscribers Stats */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5" />
                    📱 Push Notification Devices (FCM)
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                    onClick={async () => {
                      try {
                        const response = await axios.get(
                          `${API}/fcm/stats?username=${credentials.username}&password=${credentials.password}`
                        );
                        setPushStats(response.data);
                        toast.success('Stats refreshed');
                      } catch (error) {
                        toast.error('Failed to load FCM stats');
                      }
                    }}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-green-600">{pushStats?.active_devices || 0}</p>
                    <p className="text-sm text-green-700">Active Devices</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-gray-600">{pushStats?.total_devices || 0}</p>
                    <p className="text-sm text-gray-700">Total Registered</p>
                  </div>
                </div>
                
                {/* Firebase Status */}
                <div className={`p-3 rounded-lg mb-4 ${pushStats?.firebase_configured ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${pushStats?.firebase_configured ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                    <span className={`text-sm font-medium ${pushStats?.firebase_configured ? 'text-green-700' : 'text-amber-700'}`}>
                      {pushStats?.firebase_configured ? '✅ Firebase Connected - Push Ready!' : '⚠️ Firebase Not Configured'}
                    </span>
                  </div>
                  {!pushStats?.firebase_configured && (
                    <p className="text-xs text-amber-600 mt-1">
                      Add FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL to backend .env
                    </p>
                  )}
                </div>
                
                {pushStats?.recent_registrations?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Recent Devices:</p>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {pushStats.recent_registrations.map((sub, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                          <span className="text-gray-600">
                            📱 {sub.device_info?.platform || 'Android'} - {sub.device_info?.userAgent?.substring(0, 25) || 'Device'}...
                          </span>
                          <span className="text-gray-400">
                            {new Date(sub.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-700">
                    <strong>📱 How it works:</strong> When users install the Android app and allow notifications, 
                    they'll receive push notifications even when the app is closed - just like WhatsApp or Zomato!
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Sent Notifications History */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Sent Notifications
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        const response = await axios.get(
                          `${API}/super-admin/notifications?username=${credentials.username}&password=${credentials.password}`
                        );
                        setNotifications(response.data.notifications || []);
                        toast.success('Refreshed');
                      } catch (error) {
                        toast.error('Failed to load notifications');
                      }
                    }}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No notifications sent yet</p>
                    <p className="text-sm">Send your first notification above!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notif) => (
                      <div key={notif.id} className="p-4 bg-gray-50 rounded-lg border">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                notif.type === 'success' ? 'bg-green-100 text-green-700' :
                                notif.type === 'warning' ? 'bg-amber-100 text-amber-700' :
                                notif.type === 'error' ? 'bg-red-100 text-red-700' :
                                notif.type === 'promo' ? 'bg-pink-100 text-pink-700' :
                                'bg-violet-100 text-violet-700'
                              }`}>
                                {notif.type}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(notif.created_at).toLocaleString()}
                              </span>
                            </div>
                            <p className="font-semibold">{notif.title}</p>
                            <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                              <span>Target: {notif.target}</span>
                              <span>Sent to: {notif.sent_count} users</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              try {
                                await axios.delete(
                                  `${API}/super-admin/notifications/${notif.id}?username=${credentials.username}&password=${credentials.password}`
                                );
                                setNotifications(notifications.filter(n => n.id !== notif.id));
                                toast.success('Notification deleted');
                              } catch (error) {
                                toast.error('Failed to delete');
                              }
                            }}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* App Version Modal */}
      {showAppVersionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                {editingVersion ? 'Edit App Version' : 'Add New App Version'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Platform *</Label>
                  <select
                    value={newAppVersion.platform}
                    onChange={(e) => {
                      setNewAppVersion({...newAppVersion, platform: e.target.value});
                      setAppFile(null); // Reset file when platform changes
                    }}
                    className="w-full px-3 py-2 border rounded-lg mt-1"
                    disabled={!!editingVersion}
                  >
                    <option value="android">Android (APK)</option>
                    <option value="windows">Windows (EXE)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Version * (e.g., 1.0.0)</Label>
                    <Input
                      value={newAppVersion.version}
                      onChange={(e) => setNewAppVersion({...newAppVersion, version: e.target.value})}
                      placeholder="1.0.0"
                    />
                  </div>
                  <div>
                    <Label>Version Code * (number)</Label>
                    <Input
                      type="number"
                      value={newAppVersion.version_code}
                      onChange={(e) => setNewAppVersion({...newAppVersion, version_code: parseInt(e.target.value) || 1})}
                      placeholder="1"
                      min="1"
                    />
                  </div>
                </div>

                {/* File Upload Section */}
                <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                  <Label className="text-purple-700 font-medium">
                    Upload {newAppVersion.platform === 'android' ? 'APK' : 'Windows Installer'} File
                  </Label>
                  <input
                    ref={appFileRef}
                    type="file"
                    accept={newAppVersion.platform === 'android' ? '.apk' : '.exe,.msi,.zip'}
                    onChange={handleAppFileChange}
                    className="hidden"
                  />
                  <div className="mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => appFileRef.current?.click()}
                      className="w-full justify-center border-purple-300 hover:bg-purple-100"
                      disabled={uploadingApp}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {appFile ? appFile.name : `Choose ${newAppVersion.platform === 'android' ? '.apk' : '.exe/.msi'} File`}
                    </Button>
                  </div>
                  {appFile && (
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-green-600">✓ {(appFile.size / (1024 * 1024)).toFixed(1)} MB</span>
                      <button
                        onClick={() => setAppFile(null)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  {uploadingApp && uploadProgress > 0 && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-center mt-1 text-purple-600">{uploadProgress}% uploaded</p>
                    </div>
                  )}
                </div>

                {/* OR Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 border-t border-gray-300"></div>
                  <span className="text-xs text-gray-500 font-medium">OR</span>
                  <div className="flex-1 border-t border-gray-300"></div>
                </div>

                {/* URL Input */}
                <div>
                  <Label>Download URL (Direct link to APK/EXE)</Label>
                  <Input
                    value={newAppVersion.download_url}
                    onChange={(e) => setNewAppVersion({...newAppVersion, download_url: e.target.value})}
                    placeholder="https://example.com/app.apk"
                    disabled={!!appFile}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {appFile ? 'URL will be auto-generated after upload' : 'Use direct download links from Google Drive, Dropbox, GitHub Releases, etc.'}
                  </p>
                </div>

                <div>
                  <Label>File Size (optional)</Label>
                  <Input
                    value={newAppVersion.file_size}
                    onChange={(e) => setNewAppVersion({...newAppVersion, file_size: e.target.value})}
                    placeholder="25 MB"
                  />
                </div>

                <div>
                  <Label>Release Notes (optional)</Label>
                  <textarea
                    value={newAppVersion.release_notes}
                    onChange={(e) => setNewAppVersion({...newAppVersion, release_notes: e.target.value})}
                    placeholder="What's new in this version..."
                    className="w-full px-3 py-2 border rounded-lg mt-1 h-20 resize-none"
                  />
                </div>

                <div>
                  <Label>Min Supported Version (optional)</Label>
                  <Input
                    value={newAppVersion.min_supported_version}
                    onChange={(e) => setNewAppVersion({...newAppVersion, min_supported_version: e.target.value})}
                    placeholder="1.0.0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Users below this version will be forced to update</p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_mandatory"
                    checked={newAppVersion.is_mandatory}
                    onChange={(e) => setNewAppVersion({...newAppVersion, is_mandatory: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="is_mandatory" className="cursor-pointer">Mandatory Update (force users to update)</Label>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => {
                      setShowAppVersionModal(false);
                      setEditingVersion(null);
                      setAppFile(null);
                    }}
                    variant="outline"
                    className="flex-1"
                    disabled={uploadingApp}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={editingVersion ? updateAppVersion : createAppVersion}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                    disabled={uploadingApp}
                  >
                    {uploadingApp ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        {uploadProgress > 0 ? 'Uploading...' : 'Processing...'}
                      </>
                    ) : (
                      editingVersion ? 'Update Version' : 'Create Version'
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Business Details Modal */}
      {showBusinessDetails && businessDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Business Details: {businessDetails.business_settings?.restaurant_name || businessDetails.user?.username}
                  </CardTitle>
                  <p className="text-indigo-100 text-sm mt-1">{businessDetails.user?.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBusinessDetails(false)}
                  className="text-white hover:bg-white/20"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* User Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-600 font-medium">Username</p>
                  <p className="font-bold">{businessDetails.user?.username}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-green-600 font-medium">Subscription</p>
                  <p className="font-bold flex items-center gap-1">
                    {businessDetails.user?.subscription_active ? (
                      <><CheckCircle className="w-4 h-4 text-green-600" /> Active</>
                    ) : businessDetails.user?.is_trial_active ? (
                      <><Clock className="w-4 h-4 text-yellow-600" /> Trial ({businessDetails.user?.trial_days_remaining}d left)</>
                    ) : (
                      <><XCircle className="w-4 h-4 text-red-600" /> Expired</>
                    )}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-xs text-purple-600 font-medium">Total Revenue</p>
                  <p className="font-bold">₹{(businessDetails.stats?.total_revenue || 0).toLocaleString()}</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <p className="text-xs text-orange-600 font-medium">Total Orders</p>
                  <p className="font-bold">{businessDetails.stats?.completed_orders || 0}</p>
                </div>
              </div>

              {/* Business Settings */}
              {businessDetails.business_settings && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4" /> Business Settings
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div><span className="text-gray-500">Name:</span> <span className="font-medium">{businessDetails.business_settings.restaurant_name || '-'}</span></div>
                    <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{businessDetails.business_settings.phone || '-'}</span></div>
                    <div><span className="text-gray-500">Email:</span> <span className="font-medium">{businessDetails.business_settings.email || '-'}</span></div>
                    <div><span className="text-gray-500">Address:</span> <span className="font-medium">{businessDetails.business_settings.address || '-'}</span></div>
                    <div><span className="text-gray-500">GSTIN:</span> <span className="font-medium">{businessDetails.business_settings.gstin || '-'}</span></div>
                    <div><span className="text-gray-500">Business Type:</span> <span className="font-medium">{businessDetails.business_settings.business_type || 'restaurant'}</span></div>
                    <div><span className="text-gray-500">KOT Mode:</span> <span className="font-medium">{businessDetails.business_settings.kot_mode_enabled ? 'Enabled' : 'Disabled'}</span></div>
                    <div><span className="text-gray-500">Tax Rate:</span> <span className="font-medium">{businessDetails.business_settings.tax_rate || 5}%</span></div>
                    <div><span className="text-gray-500">Currency:</span> <span className="font-medium">{businessDetails.business_settings.currency || 'INR'}</span></div>
                  </div>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-white border rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">{businessDetails.stats?.menu_items || 0}</p>
                  <p className="text-xs text-gray-500">Menu Items</p>
                </div>
                <div className="p-3 bg-white border rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">{businessDetails.stats?.tables || 0}</p>
                  <p className="text-xs text-gray-500">Tables</p>
                </div>
                <div className="p-3 bg-white border rounded-lg text-center">
                  <p className="text-2xl font-bold text-purple-600">{businessDetails.stats?.inventory_items || 0}</p>
                  <p className="text-xs text-gray-500">Inventory Items</p>
                </div>
                <div className="p-3 bg-white border rounded-lg text-center">
                  <p className="text-2xl font-bold text-orange-600">{businessDetails.stats?.credit_orders || 0}</p>
                  <p className="text-xs text-gray-500">Credit Orders</p>
                  {businessDetails.stats?.pending_credit > 0 && (
                    <p className="text-xs text-red-600">₹{businessDetails.stats.pending_credit.toLocaleString()} pending</p>
                  )}
                </div>
              </div>

              {/* Staff Members */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" /> Staff Members ({businessDetails.staff_count || 0})
                </h4>
                {businessDetails.staff?.length > 0 ? (
                  <div className="space-y-2">
                    {businessDetails.staff.map(staff => (
                      <div key={staff.id} className="flex items-center justify-between p-2 bg-white rounded border">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-indigo-600">{staff.username?.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">{staff.username}</p>
                            <p className="text-xs text-gray-500">{staff.email} • {staff.role}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs ${staff.subscription_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {staff.subscription_active ? 'Active' : 'Inactive'}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStaffSubscription(staff.id, !staff.subscription_active)}
                            className={`text-xs ${staff.subscription_active ? 'text-red-600 border-red-200' : 'text-green-600 border-green-200'}`}
                          >
                            {staff.subscription_active ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No staff members</p>
                )}
              </div>

              {/* Recent Orders */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Recent Orders
                </h4>
                {businessDetails.recent_orders?.length > 0 ? (
                  <div className="space-y-2">
                    {businessDetails.recent_orders.map(order => (
                      <div key={order.id} className="flex items-center justify-between p-2 bg-white rounded border text-sm">
                        <div>
                          <span className="font-mono text-xs text-gray-500">#{order.id?.slice(0, 8)}</span>
                          {order.customer_name && <span className="ml-2">{order.customer_name}</span>}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            order.status === 'completed' ? 'bg-green-100 text-green-700' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {order.status}
                          </span>
                          {order.is_credit && <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">Credit</span>}
                          <span className="font-bold">₹{order.total?.toFixed(0)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No orders yet</p>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t bg-gray-50 flex gap-3 flex-wrap flex-shrink-0">
              {hasPermission('export_data') && (
                <Button
                  onClick={() => exportUserData(businessDetails.user?.id, businessDetails.user?.username)}
                  className="bg-teal-600 hover:bg-teal-700"
                  disabled={exportingData === businessDetails.user?.id}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {exportingData === businessDetails.user?.id ? 'Exporting...' : 'Export JSON'}
                </Button>
              )}
              {hasPermission('export_data') && (
                <Button
                  onClick={() => exportUserDatabase(businessDetails.user?.id, businessDetails.user?.username)}
                  className="bg-cyan-600 hover:bg-cyan-700"
                  disabled={exportingDb === businessDetails.user?.id}
                >
                  <Database className="w-4 h-4 mr-2" />
                  {exportingDb === businessDetails.user?.id ? 'Exporting...' : 'Export DB'}
                </Button>
              )}
              {hasPermission('import_data') && (
                <Button
                  onClick={() => {
                    setShowBusinessDetails(false);
                    openImportModal(businessDetails.user?.id, businessDetails.user?.username);
                  }}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import DB
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setShowBusinessDetails(false)}
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Import Database Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="w-5 h-5" />
                  Import Database
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowImportModal(false)}
                  className="text-white hover:bg-white/20"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>User:</strong> {importUsername}
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  Import a SQLite .db backup file to restore or fix data corruption.
                </p>
              </div>

              {/* File Upload */}
              <div>
                <Label className="text-sm font-medium">Select Database File (.db)</Label>
                <div className="mt-2">
                  <input
                    ref={importFileRef}
                    type="file"
                    accept=".db"
                    onChange={handleImportFileChange}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => importFileRef.current?.click()}
                    className="w-full justify-center"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {importFile ? importFile.name : 'Choose .db File'}
                  </Button>
                </div>
                {importFile && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ File selected: {(importFile.size / 1024).toFixed(1)} KB
                  </p>
                )}
              </div>

              {/* Import Mode */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <Label className="text-sm font-medium mb-2 block">Import Mode</Label>
                <div className="space-y-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      checked={!importReplaceMode}
                      onChange={() => setImportReplaceMode(false)}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium text-sm">Merge</p>
                      <p className="text-xs text-gray-500">Add new records, update existing ones (safe)</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importReplaceMode}
                      onChange={() => setImportReplaceMode(true)}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium text-sm text-red-600">Replace All</p>
                      <p className="text-xs text-red-500">Delete existing data and replace with backup (use for corruption fix)</p>
                    </div>
                  </label>
                </div>
              </div>

              {importReplaceMode && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 font-medium">⚠️ Warning</p>
                  <p className="text-xs text-red-600">
                    Replace mode will DELETE all existing orders, menu items, tables, inventory, payments, and staff for this user before importing.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={importUserDatabase}
                  disabled={!importFile || importing}
                  className={`flex-1 ${importReplaceMode ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'}`}
                >
                  {importing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4 mr-2" />
                      {importReplaceMode ? 'Replace & Import' : 'Merge & Import'}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowImportModal(false)}
                  disabled={importing}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Lead Modal */}
      {showCreateLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add New Lead</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    value={newLead.name}
                    onChange={(e) => setNewLead({...newLead, name: e.target.value})}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={newLead.email}
                    onChange={(e) => setNewLead({...newLead, email: e.target.value})}
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <Label>Phone *</Label>
                  <Input
                    value={newLead.phone}
                    onChange={(e) => setNewLead({...newLead, phone: e.target.value})}
                    placeholder="+91-9876543210"
                  />
                </div>
                <div>
                  <Label>Business Name</Label>
                  <Input
                    value={newLead.businessName}
                    onChange={(e) => setNewLead({...newLead, businessName: e.target.value})}
                    placeholder="Restaurant Name"
                  />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Input
                    value={newLead.notes}
                    onChange={(e) => setNewLead({...newLead, notes: e.target.value})}
                    placeholder="Additional notes..."
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={createLead} className="flex-1">Create Lead</Button>
                  <Button onClick={() => setShowCreateLead(false)} variant="outline" className="flex-1">Cancel</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Team Member Modal */}
      {showCreateTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <Card className="w-full max-w-md my-8">
            <CardHeader>
              <CardTitle>Add Team Member</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Full Name</Label>
                  <Input
                    value={newTeamMember.full_name}
                    onChange={(e) => setNewTeamMember({...newTeamMember, full_name: e.target.value})}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label>Username *</Label>
                  <Input
                    value={newTeamMember.username}
                    onChange={(e) => setNewTeamMember({...newTeamMember, username: e.target.value})}
                    placeholder="johndoe"
                  />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={newTeamMember.email}
                    onChange={(e) => setNewTeamMember({...newTeamMember, email: e.target.value})}
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <Label>Password *</Label>
                  <Input
                    type="password"
                    value={newTeamMember.password}
                    onChange={(e) => setNewTeamMember({...newTeamMember, password: e.target.value})}
                    placeholder="Secure password"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={newTeamMember.phone}
                    onChange={(e) => setNewTeamMember({...newTeamMember, phone: e.target.value})}
                    placeholder="+91-9876543210"
                  />
                </div>
                <div>
                  <Label>Role *</Label>
                  <select
                    value={newTeamMember.role}
                    onChange={(e) => setNewTeamMember({...newTeamMember, role: e.target.value})}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="sales">Sales</option>
                    <option value="support">Support</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <Label>Permissions</Label>
                  <div className="space-y-3 mt-2">
                    <p className="text-xs text-gray-500 font-medium">Tab Access:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {['leads', 'tickets', 'users', 'analytics'].map(perm => (
                        <label key={perm} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={newTeamMember.permissions.includes(perm)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewTeamMember({
                                  ...newTeamMember,
                                  permissions: [...newTeamMember.permissions, perm]
                                });
                              } else {
                                setNewTeamMember({
                                  ...newTeamMember,
                                  permissions: newTeamMember.permissions.filter(p => p !== perm)
                                });
                              }
                            }}
                          />
                          <span className="capitalize text-sm">{perm}</span>
                        </label>
                      ))}
                    </div>
                    
                    {newTeamMember.permissions.includes('users') && (
                      <>
                        <p className="text-xs text-gray-500 font-medium mt-3 pt-3 border-t">User Management Actions:</p>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { key: 'activate_license', label: 'Activate License' },
                            { key: 'deactivate_license', label: 'Deactivate License' },
                            { key: 'extend_trial', label: 'Extend Trial' },
                            { key: 'delete_user', label: 'Delete User' },
                            { key: 'export_data', label: 'Export Data (JSON/DB)' },
                            { key: 'import_data', label: 'Import Data' },
                            { key: 'view_details', label: 'View Business Details' },
                            { key: 'send_invoice', label: 'Send Invoice' }
                          ].map(perm => (
                            <label key={perm.key} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={newTeamMember.permissions.includes(perm.key)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setNewTeamMember({
                                      ...newTeamMember,
                                      permissions: [...newTeamMember.permissions, perm.key]
                                    });
                                  } else {
                                    setNewTeamMember({
                                      ...newTeamMember,
                                      permissions: newTeamMember.permissions.filter(p => p !== perm.key)
                                    });
                                  }
                                }}
                              />
                              <span className="text-sm">{perm.label}</span>
                            </label>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={createTeamMember} className="flex-1">Create Member</Button>
                  <Button onClick={() => setShowCreateTeam(false)} variant="outline" className="flex-1">Cancel</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Team Member Modal */}
      {showEditTeamModal && editingTeamMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <Card className="w-full max-w-md my-8 mx-4">
            <CardHeader>
              <CardTitle>Edit Team Member: {editingTeamMember.username}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Full Name</Label>
                  <Input
                    value={newTeamMember.full_name}
                    onChange={(e) => setNewTeamMember({...newTeamMember, full_name: e.target.value})}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={newTeamMember.phone}
                    onChange={(e) => setNewTeamMember({...newTeamMember, phone: e.target.value})}
                    placeholder="+91-9876543210"
                  />
                </div>
                <div>
                  <Label>Role</Label>
                  <select
                    value={newTeamMember.role}
                    onChange={(e) => setNewTeamMember({...newTeamMember, role: e.target.value})}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="sales">Sales</option>
                    <option value="support">Support</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <Label>Permissions</Label>
                  <div className="space-y-3 mt-2">
                    <p className="text-xs text-gray-500 font-medium">Tab Access:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {['leads', 'tickets', 'users', 'analytics'].map(perm => (
                        <label key={perm} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={newTeamMember.permissions.includes(perm)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewTeamMember({
                                  ...newTeamMember,
                                  permissions: [...newTeamMember.permissions, perm]
                                });
                              } else {
                                // Remove tab permission and related action permissions
                                let newPerms = newTeamMember.permissions.filter(p => p !== perm);
                                if (perm === 'users') {
                                  // Remove all user action permissions
                                  newPerms = newPerms.filter(p => !['activate_license', 'deactivate_license', 'extend_trial', 'delete_user', 'export_data', 'import_data', 'view_details', 'send_invoice'].includes(p));
                                }
                                setNewTeamMember({
                                  ...newTeamMember,
                                  permissions: newPerms
                                });
                              }
                            }}
                          />
                          <span className="capitalize text-sm">{perm}</span>
                        </label>
                      ))}
                    </div>
                    
                    {newTeamMember.permissions.includes('users') && (
                      <>
                        <p className="text-xs text-gray-500 font-medium mt-3 pt-3 border-t">User Management Actions:</p>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { key: 'activate_license', label: 'Activate License' },
                            { key: 'deactivate_license', label: 'Deactivate License' },
                            { key: 'extend_trial', label: 'Extend Trial' },
                            { key: 'delete_user', label: 'Delete User' },
                            { key: 'export_data', label: 'Export Data (JSON/DB)' },
                            { key: 'import_data', label: 'Import Data' },
                            { key: 'view_details', label: 'View Business Details' },
                            { key: 'send_invoice', label: 'Send Invoice' }
                          ].map(perm => (
                            <label key={perm.key} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={newTeamMember.permissions.includes(perm.key)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setNewTeamMember({
                                      ...newTeamMember,
                                      permissions: [...newTeamMember.permissions, perm.key]
                                    });
                                  } else {
                                    setNewTeamMember({
                                      ...newTeamMember,
                                      permissions: newTeamMember.permissions.filter(p => p !== perm.key)
                                    });
                                  }
                                }}
                              />
                              <span className="text-sm">{perm.label}</span>
                            </label>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={async () => {
                      try {
                        await updateTeamMember(editingTeamMember.id, {
                          full_name: newTeamMember.full_name,
                          phone: newTeamMember.phone,
                          role: newTeamMember.role,
                          permissions: newTeamMember.permissions
                        });
                        setShowEditTeamModal(false);
                        setEditingTeamMember(null);
                      } catch (error) {
                        console.error(error);
                      }
                    }} 
                    className="flex-1"
                  >
                    Save Changes
                  </Button>
                  <Button 
                    onClick={() => {
                      setShowEditTeamModal(false);
                      setEditingTeamMember(null);
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
                
                {/* Payment Proof URL */}
                <div>
                  <Label className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Payment Proof URL (optional)
                  </Label>
                  <Input
                    value={paymentProofUrl}
                    onChange={(e) => setPaymentProofUrl(e.target.value)}
                    placeholder="https://drive.google.com/... or image URL"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Upload screenshot to Google Drive/Imgur and paste link</p>
                </div>
                
                {/* Payment Notes */}
                <div>
                  <Label>Payment Notes (optional)</Label>
                  <Input
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="Transaction reference, remarks..."
                    className="mt-1"
                  />
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
                
                {/* Expiry Preview */}
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-700">Subscription will expire on:</p>
                  <p className="font-bold text-green-800">
                    {(() => {
                      const date = new Date();
                      date.setMonth(date.getMonth() + subscriptionMonths);
                      return date.toLocaleDateString('en-IN', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      });
                    })()}
                  </p>
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

      {/* Receipt Preview Modal */}
      {showInvoicePreview && invoiceData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl my-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-600 to-purple-700">
              <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                <FileText className="w-5 h-5" />
                Receipt Preview - {invoiceData.invoiceNumber}
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => downloadInvoicePDF(true)}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send PDF
                </Button>
                <Button
                  onClick={() => downloadInvoicePDF(false)}
                  className="bg-white text-purple-600 hover:bg-purple-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowInvoicePreview(false)}
                  className="text-white hover:bg-purple-500"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
            
            {/* Receipt Content */}
            <div ref={invoiceRef} className="p-8 bg-white overflow-auto max-h-[80vh]">
              <div className="invoice-container relative">
                {/* Watermark */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-[-30deg] text-[100px] font-bold text-purple-100 pointer-events-none select-none z-0">
                  BillByteKOT
                </div>
                
                {/* Paid Stamp */}
                <div className="absolute top-[35%] right-8 transform rotate-[-20deg] text-5xl font-bold text-green-500/25 border-[5px] border-green-500/25 px-6 py-2 rounded-lg z-10">
                  PAID
                </div>
                
                {/* Header */}
                <div className="flex justify-between items-start mb-6 pb-5 border-b-[3px] border-purple-600 relative z-10">
                  <div>
                    <div className="text-2xl font-bold text-purple-600">🍽️ BillByteKOT</div>
                    <div className="text-xs text-gray-500 mt-1">Smart Restaurant Management System</div>
                    <div className="text-[10px] text-gray-400 mt-3 leading-relaxed">
                      BillByte Innovations<br />
                      Bangalore, Karnataka 560001, India<br />
                      support@billbytekot.in | +91-8310832669
                    </div>
                  </div>
                  <div className="text-right">
                    <h1 className="text-3xl font-bold text-gray-800 tracking-wider">PAYMENT RECEIPT</h1>
                    <div className="text-purple-600 font-semibold mt-2 bg-purple-50 px-3 py-1.5 rounded inline-block text-sm">
                      {invoiceData.invoiceNumber}
                    </div>
                  </div>
                </div>
                
                {/* Receipt Meta - 3 Column Grid */}
                <div className="grid grid-cols-3 gap-4 mb-6 relative z-10">
                  <div className="bg-gray-50 p-4 rounded-lg border-l-[3px] border-purple-600">
                    <h3 className="text-[10px] text-purple-600 uppercase tracking-wider mb-2 font-semibold">Received From</h3>
                    <p className="font-semibold text-gray-800 text-sm">{invoiceData.businessName}</p>
                    <p className="text-xs text-gray-600 mt-1">{invoiceData.customerName}</p>
                    <p className="text-xs text-gray-600">{invoiceData.customerEmail}</p>
                    <p className="text-xs text-gray-600">{invoiceData.customerPhone}</p>
                    {invoiceData.businessAddress !== 'N/A' && (
                      <p className="text-xs text-gray-600 mt-1">{invoiceData.businessAddress}</p>
                    )}
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border-l-[3px] border-purple-600">
                    <h3 className="text-[10px] text-purple-600 uppercase tracking-wider mb-2 font-semibold">Receipt Details</h3>
                    <p className="text-xs mb-1"><span className="text-gray-500">Receipt Date:</span> <span className="font-medium">{invoiceData.invoiceDate}</span></p>
                    <p className="text-xs mb-1"><span className="text-gray-500">Receipt No:</span> <span className="font-medium text-purple-600">{invoiceData.invoiceNumber}</span></p>
                    <p className="text-xs mb-1"><span className="text-gray-500">Payment ID:</span> <span className="font-medium text-purple-600">{invoiceData.paymentId}</span></p>
                    <p className="text-xs"><span className="text-gray-500">Payment Mode:</span> <span className="font-medium uppercase">{invoiceData.paymentMethod}</span></p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border-l-[3px] border-purple-600">
                    <h3 className="text-[10px] text-purple-600 uppercase tracking-wider mb-2 font-semibold">Subscription Period</h3>
                    <p className="text-xs mb-1"><span className="text-gray-500">Plan:</span> <span className="font-medium">{invoiceData.subscriptionPlan}</span></p>
                    <p className="text-xs mb-1"><span className="text-gray-500">Duration:</span> <span className="font-medium">{invoiceData.subscriptionPeriod}</span></p>
                    <p className="text-xs mb-1"><span className="text-gray-500">Valid From:</span> <span className="font-medium text-green-600">{invoiceData.validFrom}</span></p>
                    <p className="text-xs"><span className="text-gray-500">Valid Until:</span> <span className="font-medium text-green-600">{invoiceData.validUntil}</span></p>
                  </div>
                </div>
                
                {/* Items Table */}
                <table className="w-full mb-6 relative z-10">
                  <thead>
                    <tr className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                      <th className="py-3 px-3 text-left text-[10px] uppercase tracking-wider rounded-tl-lg">Description</th>
                      <th className="py-3 px-3 text-center text-[10px] uppercase tracking-wider">Duration</th>
                      <th className="py-3 px-3 text-center text-[10px] uppercase tracking-wider">Qty</th>
                      <th className="py-3 px-3 text-right text-[10px] uppercase tracking-wider rounded-tr-lg">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="py-4 px-3">
                        <div className="font-semibold text-gray-800 text-sm">BillByteKOT Premium Subscription</div>
                        <div className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                          Premium subscription with all features:<br />
                          • Unlimited Bills & KOT Generation<br />
                          • AI-Powered Analytics & Reports<br />
                          • Thermal Printer Integration<br />
                          • Multi-device Sync & Cloud Backup<br />
                          • Priority Customer Support
                        </div>
                      </td>
                      <td className="py-4 px-3 text-center text-xs text-gray-600">{invoiceData.subscriptionPeriod}</td>
                      <td className="py-4 px-3 text-center text-xs">1</td>
                      <td className="py-4 px-3 text-right font-semibold text-sm">₹{invoiceData.amount.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
                
                {/* Totals Section */}
                <div className="flex justify-end mb-5 relative z-10">
                  {/* Totals */}
                  <div className="w-72">
                    <div className="flex justify-between py-3 px-3 text-lg font-bold text-white bg-gradient-to-r from-purple-600 to-purple-700 rounded">
                      <span>Total Amount Received</span>
                      <span>₹{invoiceData.amount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                {/* Amount in Words */}
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-3 rounded-lg mb-5 border border-purple-200 relative z-10">
                  <span className="text-[9px] text-purple-600 uppercase tracking-wider font-semibold">Amount in Words</span>
                  <p className="text-xs text-gray-800 font-medium mt-1">{invoiceData.amountInWords}</p>
                </div>
                
                {/* Note */}
                <div className="bg-green-50 p-4 rounded-lg mb-5 border border-green-200 relative z-10">
                  <p className="text-xs text-green-700">
                    <span className="font-semibold">✓ Payment Confirmed:</span> This receipt confirms that we have received your payment for the BillByteKOT Premium subscription. Your subscription is now active.
                  </p>
                </div>
                
                {/* Footer */}
                <div className="text-center pt-5 border-t-2 border-gray-100 relative z-10">
                  <p className="text-sm text-purple-600 font-semibold mb-2">Thank you for choosing BillByteKOT! 🙏</p>
                  <p className="text-[11px] text-gray-500">We appreciate your business and look forward to serving you.</p>
                  <p className="text-[10px] text-gray-400 mt-3">
                    www.billbytekot.in | support@billbytekot.in | +91-8310832669
                  </p>
                  <p className="text-[9px] text-gray-400 mt-2">This is a computer-generated receipt and does not require a signature.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminPage;
