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
  Mail, FileText, Upload, RefreshCw, Lock, Download, Eye, X
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
    username: '', email: '', password: '', role: 'sales', 
    permissions: [], full_name: '', phone: '' 
  });
  const invoiceRef = useRef(null);

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
      return ['dashboard', 'users', 'leads', 'team', 'tickets', 'analytics'];
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

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-purple-500/20 bg-gray-900/50 backdrop-blur">
          <CardHeader>
            <div className="flex items-center gap-2 justify-center">
              <Shield className="w-8 h-8 text-purple-400" />
              <CardTitle className="text-2xl text-white">Super Admin Panel</CardTitle>
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
              {userType === 'super-admin' ? 'Super Admin Panel' : 'Team Panel'}
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
                            {/* Subscription Management */}
                            {user.subscription_active ? (
                              <>
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
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => previewInvoice(user)}
                                  className="text-xs text-purple-600 border-purple-200 hover:bg-purple-50"
                                  title="Preview & Download Invoice"
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  View
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deactivateSubscription(user.id)}
                                  className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                                >
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Deactivate
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => openSubscriptionModal(user)}
                                className="text-xs bg-green-600 hover:bg-green-700"
                              >
                                <CreditCard className="w-3 h-3 mr-1" />
                                Activate
                              </Button>
                            )}
                            
                            {/* Extend Trial */}
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
                            
                            {/* Delete User */}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteUser(user.id)}
                              className="text-xs h-7"
                            >
                              Delete
                            </Button>
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
                  <CardTitle>Lead Management</CardTitle>
                  {leadsStats && (
                    <div className="flex gap-4 mt-2 text-sm">
                      <span className="text-blue-600">New: {leadsStats.new}</span>
                      <span className="text-yellow-600">Contacted: {leadsStats.contacted}</span>
                      <span className="text-green-600">Converted: {leadsStats.converted}</span>
                    </div>
                  )}
                </div>
                <Button onClick={() => setShowCreateLead(true)}>
                  + Add Lead
                </Button>
              </div>
            </CardHeader>
            <CardContent>
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
                          {member.permissions?.join(', ') || 'None'}
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
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteTeamMember(member.id)}
                          >
                            Delete
                          </Button>
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
      </div>

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
                  <div className="space-y-2 mt-2">
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
                        <span className="capitalize">{perm}</span>
                      </label>
                    ))}
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
