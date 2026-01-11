import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Shield,
  Users,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Download,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Clock,
  Star,
  UserPlus,
  Settings,
  BarChart3,
  PieChart,
  Activity,
  Database,
  Server,
  Zap,
  Globe,
  Lock,
  Unlock,
  Ban,
  CheckSquare,
  X,
  Plus,
  Minus,
  ArrowUp,
  ArrowDown,
  ExternalLink
} from 'lucide-react';

const SuperAdminPage = () => {
  const navigate = useNavigate();
  
  // Authentication state
  const [authenticated, setAuthenticated] = useState(false);
  const [userType, setUserType] = useState(null);
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: ''
  });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Data state
  const [dashboardData, setDashboardData] = useState(null);
  const [users, setUsers] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [orders, setOrders] = useState([]);
  const [leads, setLeads] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  
  // UI state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);

  // Permissions based on user type
  const permissions = {
    'super-admin': {
      dashboard: true,
      users: true,
      tickets: true,
      orders: true,
      leads: true,
      analytics: true,
      system: true,
      delete_user: true,
      edit_user: true,
      view_sensitive: true
    },
    'team': {
      dashboard: true,
      users: false,
      tickets: true,
      orders: false,
      leads: true,
      analytics: false,
      system: false,
      delete_user: false,
      edit_user: false,
      view_sensitive: false
    }
  };

  const hasPermission = (permission) => {
    return permissions[userType]?.[permission] || false;
  };

  // Authentication functions
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      const response = await fetch(`/api/super-admin/login?username=${encodeURIComponent(loginForm.username)}&password=${encodeURIComponent(loginForm.password)}`);
      
      if (response.ok) {
        const data = await response.json();
        setAuthenticated(true);
        setUserType(data.user_type || 'super-admin');
        await loadDashboardData();
      } else {
        const errorData = await response.json();
        setLoginError(errorData.detail || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Connection error. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setAuthenticated(false);
    setUserType(null);
    setLoginForm({ username: '', password: '' });
    setDashboardData(null);
    setUsers([]);
    setTickets([]);
    setOrders([]);
    setLeads([]);
    setAnalytics(null);
    setSystemHealth(null);
  };

  // Data fetching functions
  const loadDashboardData = async () => {
    if (!authenticated) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/super-admin/dashboard?username=${encodeURIComponent(loginForm.username)}&password=${encodeURIComponent(loginForm.password)}`);
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    if (!hasPermission('users')) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/super-admin/users?username=${encodeURIComponent(loginForm.username)}&password=${encodeURIComponent(loginForm.password)}&skip=0&limit=50`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTickets = async () => {
    if (!hasPermission('tickets')) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/super-admin/tickets/recent?username=${encodeURIComponent(loginForm.username)}&password=${encodeURIComponent(loginForm.password)}&limit=20`);
      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets || []);
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    if (!hasPermission('orders')) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/super-admin/orders/recent?username=${encodeURIComponent(loginForm.username)}&password=${encodeURIComponent(loginForm.password)}&days=7&limit=20`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    if (!hasPermission('analytics')) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/super-admin/analytics?username=${encodeURIComponent(loginForm.username)}&password=${encodeURIComponent(loginForm.password)}&days=30`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSystemHealth = async () => {
    if (!hasPermission('system')) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/super-admin/system/health?username=${encodeURIComponent(loginForm.username)}&password=${encodeURIComponent(loginForm.password)}`);
      if (response.ok) {
        const data = await response.json();
        setSystemHealth(data);
      }
    } catch (error) {
      console.error('Error loading system health:', error);
    } finally {
      setLoading(false);
    }
  };

  // User management functions
  const updateUserSubscription = async (userId, subscriptionActive) => {
    if (!hasPermission('edit_user')) return;
    
    try {
      const response = await fetch(`/api/super-admin/users/${userId}/subscription?username=${encodeURIComponent(loginForm.username)}&password=${encodeURIComponent(loginForm.password)}&subscription_active=${subscriptionActive}`, {
        method: 'PUT'
      });
      
      if (response.ok) {
        await loadUsers();
        await loadDashboardData();
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
    }
  };

  const deleteUser = async (userId) => {
    if (!hasPermission('delete_user')) return;
    
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/super-admin/users/${userId}?username=${encodeURIComponent(loginForm.username)}&password=${encodeURIComponent(loginForm.password)}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadUsers();
        await loadDashboardData();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  // Ticket management functions
  const updateTicketStatus = async (ticketId, status) => {
    if (!hasPermission('tickets')) return;
    
    try {
      const response = await fetch(`/api/super-admin/tickets/${ticketId}?username=${encodeURIComponent(loginForm.username)}&password=${encodeURIComponent(loginForm.password)}&status=${status}`, {
        method: 'PUT'
      });
      
      if (response.ok) {
        await loadTickets();
        await loadDashboardData();
      }
    } catch (error) {
      console.error('Error updating ticket:', error);
    }
  };

  // Load data when tab changes
  useEffect(() => {
    if (!authenticated) return;
    
    switch (activeTab) {
      case 'dashboard':
        loadDashboardData();
        break;
      case 'users':
        loadUsers();
        break;
      case 'tickets':
        loadTickets();
        break;
      case 'orders':
        loadOrders();
        break;
      case 'analytics':
        loadAnalytics();
        break;
      case 'system':
        loadSystemHealth();
        break;
      default:
        break;
    }
  }, [activeTab, authenticated]);

  // Filter functions
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'active' && user.subscription_active) ||
      (filterStatus === 'trial' && !user.subscription_active);
    
    return matchesSearch && matchesFilter;
  });

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = !searchTerm || 
      ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || ticket.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  // Utility functions
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  const formatDateTime = (dateString) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Invalid Date';
    }
  };

  const formatCurrency = (amount) => {
    try {
      return `₹${(amount / 100).toFixed(2)}`;
    } catch {
      return '₹0.00';
    }
  };

  // Login form
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-purple-500/20 bg-gray-900/50 backdrop-blur">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-white">Ops Control Panel</CardTitle>
            <p className="text-gray-300">Secure access required</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter username"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter password"
                  required
                />
              </div>
              
              {loginError && (
                <div className="p-3 bg-red-900/50 border border-red-500/50 rounded-lg text-red-300 text-sm">
                  {loginError}
                </div>
              )}
              
              <Button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3"
              >
                {loginLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Authenticating...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Shield className="w-4 h-4" />
                    Access Control Panel
                  </div>
                )}
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
              {userType === 'super-admin' ? 'System administration and monitoring' : 'Team dashboard and support'}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center gap-2 text-red-600 hover:text-red-700"
            >
              <X className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3, permission: 'dashboard' },
              { id: 'users', label: 'Users', icon: Users, permission: 'users' },
              { id: 'tickets', label: 'Support', icon: AlertTriangle, permission: 'tickets' },
              { id: 'orders', label: 'Orders', icon: ShoppingCart, permission: 'orders' },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp, permission: 'analytics' },
              { id: 'system', label: 'System', icon: Server, permission: 'system' }
            ].filter(tab => hasPermission(tab.permission)).map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-gray-600">
              <RefreshCw className="w-5 h-5 animate-spin" />
              Loading data...
            </div>
          </div>
        )}

        {/* Dashboard Tab */}
        {!loading && activeTab === 'dashboard' && hasPermission('dashboard') && (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Users</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {dashboardData?.overview?.total_users || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {dashboardData?.overview?.active_subscriptions || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Trial Users</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {dashboardData?.overview?.trial_users || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Open Tickets</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {dashboardData?.overview?.open_tickets || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    System Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Database</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Healthy
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Redis Cache</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Connected
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">API Server</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Running
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Orders (30 days)</span>
                      <span className="font-medium">{dashboardData?.overview?.total_orders_30d || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Pending Tickets</span>
                      <span className="font-medium">{dashboardData?.overview?.pending_tickets || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Last Updated</span>
                      <span className="text-sm text-gray-500">
                        {dashboardData?.cached_at ? formatDateTime(dashboardData.cached_at) : 'Never'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {!loading && activeTab === 'users' && hasPermission('users') && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 w-full"
                />
              </div>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Users</option>
                <option value="active">Active Subscriptions</option>
                <option value="trial">Trial Users</option>
              </select>
            </div>

            {/* Users Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  User Management ({filteredUsers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">User</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Business</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Created</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-gray-900">{user.email}</p>
                              <p className="text-xs text-gray-500">ID: {user.id?.slice(0, 8)}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-gray-900">{user.business_name || 'Not set'}</p>
                            <p className="text-xs text-gray-500">{user.phone || 'No phone'}</p>
                          </td>
                          <td className="py-3 px-4">
                            {user.subscription_active ? (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                <Clock className="w-3 h-3 mr-1" />
                                Trial
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-gray-900">{formatDate(user.created_at)}</p>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateUserSubscription(user.id, !user.subscription_active)}
                                className="text-xs h-7"
                              >
                                {user.subscription_active ? 'Deactivate' : 'Activate'}
                              </Button>
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
                  
                  {filteredUsers.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No users found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Support Tickets Tab */}
        {!loading && activeTab === 'tickets' && hasPermission('tickets') && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 w-full"
                />
              </div>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Tickets</option>
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            {/* Tickets List */}
            <div className="space-y-4">
              {filteredTickets.map((ticket) => (
                <Card key={ticket.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-gray-900">{ticket.subject}</h3>
                          <Badge 
                            variant="secondary" 
                            className={
                              ticket.status === 'open' ? 'bg-red-100 text-red-800' :
                              ticket.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                              'bg-green-100 text-green-800'
                            }
                          >
                            {ticket.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{ticket.message}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>From: {ticket.user_email}</span>
                          <span>Created: {formatDateTime(ticket.created_at)}</span>
                          <span>ID: {ticket.id?.slice(0, 8)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        {ticket.status !== 'resolved' && (
                          <Button
                            size="sm"
                            onClick={() => updateTicketStatus(ticket.id, 'resolved')}
                            className="bg-green-600 hover:bg-green-700 text-xs h-7"
                          >
                            Resolve
                          </Button>
                        )}
                        {ticket.status === 'open' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateTicketStatus(ticket.id, 'pending')}
                            className="text-xs h-7"
                          >
                            Mark Pending
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {filteredTickets.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No support tickets found</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {!loading && activeTab === 'orders' && hasPermission('orders') && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Recent Orders ({orders.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">#{order.id?.slice(0, 8)}</span>
                          <Badge variant="secondary">
                            {order.status}
                          </Badge>
                        </div>
                        <span className="font-bold">₹{order.total?.toFixed(0) || '0'}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>Customer: {order.customer_name || 'Walk-in'}</p>
                        <p>Table: {order.table_number || 'Counter'}</p>
                        <p>Created: {formatDateTime(order.created_at)}</p>
                      </div>
                    </div>
                  ))}
                  
                  {orders.length === 0 && (
                    <div className="text-center py-8">
                      <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No recent orders found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Analytics Tab */}
        {!loading && activeTab === 'analytics' && hasPermission('analytics') && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">New Users (30d)</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {analytics?.new_users || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <UserPlus className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">New Orders (30d)</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {analytics?.new_orders || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <ShoppingCart className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Users (30d)</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {analytics?.active_users || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Activity className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">New Tickets (30d)</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {analytics?.new_tickets || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* System Health Tab */}
        {!loading && activeTab === 'system' && hasPermission('system') && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Database Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Users</span>
                      <span className="font-medium">{systemHealth?.database?.users || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Orders</span>
                      <span className="font-medium">{systemHealth?.database?.orders || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Menu Items</span>
                      <span className="font-medium">{systemHealth?.database?.menu_items || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Support Tickets</span>
                      <span className="font-medium">{systemHealth?.database?.tickets || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="w-5 h-5" />
                    System Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {systemHealth?.system?.status || 'Healthy'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Database Size</span>
                      <span className="font-medium">
                        {systemHealth?.database?.size_mb ? `${systemHealth.database.size_mb.toFixed(1)} MB` : 'Unknown'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Last Check</span>
                      <span className="text-sm text-gray-500">
                        {systemHealth?.system?.timestamp ? formatDateTime(systemHealth.system.timestamp) : 'Never'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminPage;