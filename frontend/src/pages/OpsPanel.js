import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { 
  Activity, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  Server, 
  Database, 
  Zap, 
  AlertTriangle,
  TrendingUp,
  Monitor,
  Settings,
  Download,
  RefreshCw,
  Search,
  Filter,
  BarChart3,
  PieChart,
  LineChart,
  Shield,
  Clock,
  HardDrive,
  Cpu,
  Wifi,
  Eye,
  UserCheck,
  ShoppingBag
} from 'lucide-react';

const OpsPanel = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Data states
  const [overview, setOverview] = useState(null);
  const [userAnalytics, setUserAnalytics] = useState(null);
  const [orderAnalytics, setOrderAnalytics] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  
  // Search filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.get(`${API}/ops/auth/login`, {
        params: credentials
      });
      
      if (response.data.success) {
        setIsAuthenticated(true);
        toast.success('Ops Panel access granted');
        loadDashboardData();
      }
    } catch (error) {
      toast.error('Invalid ops credentials');
      console.error('Ops login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      // Load overview data
      const overviewRes = await axios.get(`${API}/ops/dashboard/overview`, {
        params: credentials
      });
      setOverview(overviewRes.data);
      
      // Load alerts
      const alertsRes = await axios.get(`${API}/ops/alerts/system`, {
        params: credentials
      });
      setAlerts(alertsRes.data);
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    }
  };

  const loadUserAnalytics = async (days = 30) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/ops/users/analytics`, {
        params: { ...credentials, days }
      });
      setUserAnalytics(response.data);
    } catch (error) {
      console.error('Failed to load user analytics:', error);
      toast.error('Failed to load user analytics');
    } finally {
      setLoading(false);
    }
  };

  const loadOrderAnalytics = async (days = 30) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/ops/orders/analytics`, {
        params: { ...credentials, days }
      });
      setOrderAnalytics(response.data);
    } catch (error) {
      console.error('Failed to load order analytics:', error);
      toast.error('Failed to load order analytics');
    } finally {
      setLoading(false);
    }
  };

  const loadPerformanceMetrics = async () => {
    try {
      const response = await axios.get(`${API}/ops/performance/metrics`, {
        params: credentials
      });
      setPerformance(response.data);
    } catch (error) {
      console.error('Failed to load performance metrics:', error);
      toast.error('Failed to load performance metrics');
    }
  };

  const searchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/ops/users/search`, {
        params: {
          ...credentials,
          query: searchQuery,
          role: roleFilter,
          status: statusFilter,
          limit: 20
        }
      });
      setSearchResults(response.data);
    } catch (error) {
      console.error('User search failed:', error);
      toast.error('User search failed');
    } finally {
      setLoading(false);
    }
  };

  const clearCache = async () => {
    try {
      setLoading(true);
      await axios.post(`${API}/ops/maintenance/cache/clear`, null, {
        params: credentials
      });
      toast.success('System cache cleared successfully');
      loadDashboardData(); // Refresh data
    } catch (error) {
      console.error('Cache clear failed:', error);
      toast.error('Failed to clear cache');
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (type) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/ops/export/${type}`, {
        params: { ...credentials, format: 'json' }
      });
      
      // Download the data
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}_export_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      toast.success(`${type} data exported successfully`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed');
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(() => {
        if (activeTab === 'overview') {
          loadDashboardData();
        } else if (activeTab === 'performance') {
          loadPerformanceMetrics();
        }
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, activeTab]);

  // Login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-2xl bg-white/10 backdrop-blur-lg">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">Ops Panel</CardTitle>
            <p className="text-purple-200 text-sm">Site Owner Dashboard</p>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="Ops Username"
                  value={credentials.username}
                  onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                  required
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Ops Password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                disabled={loading}
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Shield className="w-4 h-4 mr-2" />
                )}
                Access Ops Panel
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Ops Panel</h1>
                <p className="text-sm text-gray-500">Site Owner Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={clearCache}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Clear Cache
              </Button>
              <Button
                onClick={() => setIsAuthenticated(false)}
                variant="outline"
                size="sm"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: Monitor },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'orders', label: 'Orders', icon: ShoppingCart },
              { id: 'performance', label: 'Performance', icon: Activity },
              { id: 'search', label: 'Search', icon: Search }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'users' && !userAnalytics) loadUserAnalytics();
                  if (tab.id === 'orders' && !orderAnalytics) loadOrderAnalytics();
                  if (tab.id === 'performance') loadPerformanceMetrics();
                }}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Alerts */}
            {alerts && alerts.alert_count > 0 && (
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-800">
                    <AlertTriangle className="w-5 h-5" />
                    System Alerts ({alerts.alert_count})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {alerts.alerts.map((alert, index) => (
                      <div key={index} className={`p-3 rounded-lg ${
                        alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                        alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="font-medium">{alert.category}</span>
                          <span className="text-sm">- {alert.message}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Key Metrics */}
            {overview && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Users</p>
                        <p className="text-3xl font-bold text-gray-900">{overview.database.total_users}</p>
                        <p className="text-sm text-green-600">
                          {overview.database.active_users} active
                        </p>
                      </div>
                      <Users className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Orders</p>
                        <p className="text-3xl font-bold text-gray-900">{overview.database.total_orders}</p>
                        <p className="text-sm text-blue-600">
                          {overview.activity.recent_orders_24h} today
                        </p>
                      </div>
                      <ShoppingCart className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Revenue (30d)</p>
                        <p className="text-3xl font-bold text-gray-900">₹{overview.revenue.last_30_days.toFixed(0)}</p>
                        <p className="text-sm text-purple-600">
                          ₹{overview.revenue.avg_order_value.toFixed(0)} avg
                        </p>
                      </div>
                      <DollarSign className="w-8 h-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">System Health</p>
                        <p className="text-3xl font-bold text-green-600">Good</p>
                        <p className="text-sm text-gray-600">
                          CPU: {overview.system.cpu_usage.toFixed(1)}%
                        </p>
                      </div>
                      <Activity className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* System Status */}
            {overview && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Server className="w-5 h-5" />
                      System Resources
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm">
                          <span>CPU Usage</span>
                          <span>{overview.system.cpu_usage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${overview.system.cpu_usage}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm">
                          <span>Memory Usage</span>
                          <span>{overview.system.memory_usage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${overview.system.memory_usage}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm">
                          <span>Disk Usage</span>
                          <span>{overview.system.disk_usage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-purple-500 h-2 rounded-full" 
                            style={{ width: `${overview.system.disk_usage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="w-5 h-5" />
                      Services Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Database</span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          Connected
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Redis Cache</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          overview.redis.connected 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {overview.redis.connected ? 'Connected' : 'Disconnected'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Cache Type</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {overview.redis.type}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">User Analytics</h2>
              <div className="flex gap-2">
                <Button onClick={() => loadUserAnalytics(7)} variant="outline" size="sm">7 Days</Button>
                <Button onClick={() => loadUserAnalytics(30)} variant="outline" size="sm">30 Days</Button>
                <Button onClick={() => exportData('users')} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {userAnalytics && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>User Segmentation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {userAnalytics.segmentation.map((segment, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm font-medium capitalize">{segment._id}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">{segment.count}</span>
                            <span className="text-xs text-green-600">({segment.active} active)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Users by Orders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {userAnalytics.top_users.slice(0, 5).map((user, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{user.email}</p>
                            <p className="text-xs text-gray-500">{user.role}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{user.order_count} orders</p>
                            <p className="text-xs text-green-600">₹{user.total_revenue.toFixed(0)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Order Analytics</h2>
              <div className="flex gap-2">
                <Button onClick={() => loadOrderAnalytics(7)} variant="outline" size="sm">7 Days</Button>
                <Button onClick={() => loadOrderAnalytics(30)} variant="outline" size="sm">30 Days</Button>
              </div>
            </div>

            {orderAnalytics && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Order Status Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {orderAnalytics.status_distribution.map((status, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm font-medium capitalize">{status._id}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">{status.count}</span>
                            <span className="text-xs text-green-600">₹{status.revenue.toFixed(0)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Restaurants</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {orderAnalytics.top_restaurants.slice(0, 5).map((restaurant, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{restaurant.restaurant_name || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">{restaurant.owner_email}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{restaurant.order_count} orders</p>
                            <p className="text-xs text-green-600">₹{restaurant.total_revenue.toFixed(0)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Performance Metrics</h2>
              <Button onClick={loadPerformanceMetrics} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>

            {performance && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Cpu className="w-5 h-5" />
                      CPU & Memory
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm">
                          <span>CPU Usage</span>
                          <span>{performance.system.cpu_usage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${performance.system.cpu_usage}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm">
                          <span>Memory</span>
                          <span>{performance.system.memory.usage_percent.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${performance.system.memory.usage_percent}%` }}
                          ></div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        {performance.system.memory.available_gb}GB / {performance.system.memory.total_gb}GB available
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HardDrive className="w-5 h-5" />
                      Storage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm">
                          <span>Disk Usage</span>
                          <span>{performance.system.disk.usage_percent.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-purple-500 h-2 rounded-full" 
                            style={{ width: `${performance.system.disk.usage_percent}%` }}
                          ></div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        {performance.system.disk.free_gb}GB / {performance.system.disk.total_gb}GB free
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="w-5 h-5" />
                      Database
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Response Time</span>
                        <span className="text-sm font-medium">{performance.database.response_time_ms.toFixed(0)}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Status</span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          {performance.database.status}
                        </span>
                      </div>
                      {performance.redis.response_time_ms && (
                        <div className="flex justify-between">
                          <span className="text-sm">Redis Response</span>
                          <span className="text-sm font-medium">{performance.redis.response_time_ms.toFixed(0)}ms</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Advanced Search</h2>
            </div>

            {/* Search Form */}
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="all">All Roles</option>
                      <option value="admin">Admin</option>
                      <option value="waiter">Waiter</option>
                      <option value="cashier">Cashier</option>
                      <option value="kitchen">Kitchen</option>
                    </select>
                  </div>
                  <div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <Button onClick={searchUsers} className="w-full" disabled={loading}>
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Search Results */}
            {searchResults && (
              <Card>
                <CardHeader>
                  <CardTitle>Search Results ({searchResults.count})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {searchResults.users.map((user, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{user.email}</p>
                          <p className="text-sm text-gray-500">{user.username} • {user.role}</p>
                          <p className="text-xs text-gray-400">
                            Joined: {new Date(user.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{user.order_count} orders</p>
                          <p className="text-sm text-green-600">₹{user.total_revenue.toFixed(0)}</p>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            user.subscription_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.subscription_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OpsPanel;