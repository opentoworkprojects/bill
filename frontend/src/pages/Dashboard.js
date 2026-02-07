import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  DollarSign, ShoppingCart, TrendingUp, MessageSquare, Sparkles, 
  Clock, Users, ChefHat, ArrowUpRight, ArrowDownRight, Utensils,
  Calendar, Zap, Target, Award, RefreshCw, Bell
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import TrialBanner from '../components/TrialBanner';
import AIInsightsPanel from '../components/AIInsightsPanel';
import QuickActionsPanel from '../components/QuickActionsPanel';
import LiveMetricsBar from '../components/LiveMetricsBar';

const Dashboard = ({ user }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    todayOrders: 0,
    todaySales: 0,
    activeOrders: 0,
    avgOrderValue: 0,
    pendingOrders: 0,
    preparingOrders: 0,
    readyOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [chatMessage, setChatMessage] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [loading, setLoading] = useState(false);
  const [restaurantName, setRestaurantName] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchRecommendations();
    fetchBusinessSettings();
    fetchRecentOrders();
    fetchTopItems();
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    const refreshInterval = setInterval(() => {
      fetchStats();
      fetchRecentOrders();
      fetchTopItems();
    }, 15000); // Auto refresh every 15s for more responsive dashboard
    
    // Refresh when window gains focus
    const handleFocus = () => {
      fetchStats();
      fetchRecentOrders();
      fetchTopItems();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(clockInterval);
      clearInterval(refreshInterval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const fetchBusinessSettings = async () => {
    try {
      const response = await axios.get(`${API}/business/settings`);
      setRestaurantName(response.data.business_settings?.restaurant_name || '');
    } catch (error) {
      console.error('Failed to fetch business settings', error);
    }
  };

  const fetchStats = async () => {
    try {
      const [dashboardRes, ordersRes] = await Promise.all([
        axios.get(`${API}/dashboard`),  // Use new real-time dashboard endpoint
        axios.get(`${API}/orders`)
      ]);
      
      const orders = ordersRes.data;
      const activeOrders = orders.filter(o => ['pending', 'preparing', 'ready'].includes(o.status));
      const dashboardData = dashboardRes.data;
      
      // Calculate average order value from dashboard data
      const avgValue = dashboardData.todaysOrders > 0 
        ? dashboardData.todaysRevenue / dashboardData.todaysOrders 
        : 0;

      setStats({
        todayOrders: dashboardData.todaysOrders,
        todaySales: dashboardData.todaysRevenue,
        activeOrders: activeOrders.length,
        avgOrderValue: avgValue,
        pendingOrders: activeOrders.filter(o => o.status === 'pending').length,
        preparingOrders: activeOrders.filter(o => o.status === 'preparing').length,
        readyOrders: activeOrders.filter(o => o.status === 'ready').length
      });
    } catch (error) {
      console.error('Failed to fetch stats', error);
      
      // Fallback to daily report endpoint if dashboard fails
      try {
        const dailyReport = await axios.get(`${API}/reports/daily`);
        const orders = await axios.get(`${API}/orders`);
        
        const ordersData = orders.data;
        const activeOrders = ordersData.filter(o => ['pending', 'preparing', 'ready'].includes(o.status));
        const avgValue = dailyReport.data.total_orders > 0 
          ? dailyReport.data.total_sales / dailyReport.data.total_orders 
          : 0;

        setStats({
          todayOrders: dailyReport.data.total_orders,
          todaySales: dailyReport.data.total_sales,
          activeOrders: activeOrders.length,
          avgOrderValue: avgValue,
          pendingOrders: activeOrders.filter(o => o.status === 'pending').length,
          preparingOrders: activeOrders.filter(o => o.status === 'preparing').length,
          readyOrders: activeOrders.filter(o => o.status === 'ready').length
        });
      } catch (fallbackError) {
        console.error('Both dashboard endpoints failed', fallbackError);
      }
    }
  };

  const fetchRecentOrders = async () => {
    try {
      const response = await axios.get(`${API}/orders`);
      const recent = response.data
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);
      setRecentOrders(recent);
    } catch (error) {
      console.error('Failed to fetch recent orders', error);
    }
  };

  const fetchTopItems = async () => {
    try {
      const response = await axios.get(`${API}/reports/top-items`);
      setTopItems(response.data.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch top items', error);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await axios.post(`${API}/ai/recommendations`);
      setRecommendations(response.data.recommendations);
    } catch (error) {
      console.error('Failed to fetch recommendations', error);
    }
  };

  const handleChat = async () => {
    if (!chatMessage.trim()) return;
    setLoading(true);
    try {
      const response = await axios.post(`${API}/ai/chat`, { message: chatMessage });
      setChatResponse(response.data.response);
      setChatMessage('');
    } catch (error) {
      toast.error('Failed to get AI response');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchStats(), fetchRecentOrders(), fetchTopItems()]);
    toast.success('Dashboard refreshed!');
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return '☀️ Good Morning';
    if (hour < 17) return '🌤️ Good Afternoon';
    return '🌙 Good Evening';
  };

  const formatCurrency = (value) => `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-amber-100 text-amber-700',
      preparing: 'bg-blue-100 text-blue-700',
      ready: 'bg-green-100 text-green-700',
      completed: 'bg-gray-100 text-gray-700'
    };
    return colors[status] || colors.completed;
  };


  return (
    <Layout user={user}>
      <div className="space-y-6" data-testid="dashboard-page">
        {/* Trial Banner */}
        <TrialBanner user={user} />

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-gray-500 text-sm font-medium">{getGreeting()}</p>
            <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {restaurantName || user?.username}
            </h1>
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {currentTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              <span className="text-violet-600 font-mono font-bold">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            className="self-start sm:self-auto"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Today's Sales */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-green-600 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-xs font-medium uppercase tracking-wide">Today's Sales</p>
                  <p className="text-3xl sm:text-4xl font-black mt-2">{formatCurrency(stats.todaySales)}</p>
                  <p className="text-emerald-200 text-xs mt-1 flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3" /> vs yesterday
                  </p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <DollarSign className="w-7 h-7" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Today's Orders */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-cyan-600 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-xs font-medium uppercase tracking-wide">Today's Orders</p>
                  <p className="text-3xl sm:text-4xl font-black mt-2">{stats.todayOrders}</p>
                  <p className="text-blue-200 text-xs mt-1">orders completed</p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <ShoppingCart className="w-7 h-7" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Orders */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-amber-500 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-xs font-medium uppercase tracking-wide">Active Orders</p>
                  <p className="text-3xl sm:text-4xl font-black mt-2">{stats.activeOrders}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">{stats.pendingOrders} pending</span>
                    <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">{stats.preparingOrders} cooking</span>
                  </div>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <ChefHat className="w-7 h-7" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Avg Order Value */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-violet-100 text-xs font-medium uppercase tracking-wide">Avg Order Value</p>
                  <p className="text-3xl sm:text-4xl font-black mt-2">{formatCurrency(stats.avgOrderValue)}</p>
                  <p className="text-violet-200 text-xs mt-1">per order</p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Target className="w-7 h-7" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Button 
            onClick={() => navigate('/orders')} 
            className="h-auto py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 flex flex-col items-center gap-2"
          >
            <ShoppingCart className="w-6 h-6" />
            <span className="text-sm font-semibold">New Order</span>
          </Button>
          <Button 
            onClick={() => navigate('/kitchen')} 
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2 border-2 hover:bg-orange-50 hover:border-orange-300"
          >
            <ChefHat className="w-6 h-6 text-orange-600" />
            <span className="text-sm font-semibold">Kitchen</span>
            {stats.pendingOrders > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {stats.pendingOrders}
              </span>
            )}
          </Button>
          <Button 
            onClick={() => navigate('/menu')} 
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2 border-2 hover:bg-blue-50 hover:border-blue-300"
          >
            <Utensils className="w-6 h-6 text-blue-600" />
            <span className="text-sm font-semibold">Menu</span>
          </Button>
          <Button 
            onClick={() => navigate('/reports')} 
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2 border-2 hover:bg-green-50 hover:border-green-300"
          >
            <TrendingUp className="w-6 h-6 text-green-600" />
            <span className="text-sm font-semibold">Reports</span>
          </Button>
        </div>

        {/* Middle Section - Recent Orders & Top Items */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="w-5 h-5 text-violet-600" />
                  Recent Orders
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/orders')} className="text-violet-600 text-xs">
                  View All →
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentOrders.length > 0 ? recentOrders.map((order, idx) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => navigate(`/billing/${order.id}`)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                      <span className="text-violet-600 font-bold text-sm">#{idx + 1}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{order.table_number ? `Table ${order.table_number}` : 'Counter'}</p>
                      <p className="text-gray-500 text-xs">{order.items?.length || 0} items • {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-violet-600">{formatCurrency(order.total || 0)}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-gray-400">
                  <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No recent orders</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Selling Items */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Award className="w-5 h-5 text-amber-500" />
                Top Selling Items
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {topItems.length > 0 ? topItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white ${idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-amber-700' : 'bg-gray-300'}`}>
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{item.name}</p>
                      <p className="text-gray-500 text-xs">{item.quantity} sold</p>
                    </div>
                  </div>
                  <p className="font-bold text-green-600">{formatCurrency(item.revenue || 0)}</p>
                </div>
              )) : (
                <div className="text-center py-8 text-gray-400">
                  <Utensils className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No sales data yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-lg" data-testid="ai-chat-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="w-5 h-5 text-violet-600" />
                AI Assistant
                <span className="text-[10px] bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full font-medium">BETA</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask about menu, orders, sales..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleChat()}
                  className="h-11"
                  data-testid="chat-input"
                />
                <Button onClick={handleChat} disabled={loading} className="h-11 px-6 bg-gradient-to-r from-violet-600 to-purple-600" data-testid="chat-send-button">
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                </Button>
              </div>
              {chatResponse && (
                <div className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-200" data-testid="chat-response">
                  <p className="text-sm text-gray-700 whitespace-pre-line">{chatResponse}</p>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {['Today\'s sales?', 'Top items?', 'Busy hours?'].map(q => (
                  <button key={q} onClick={() => { setChatMessage(q); }} className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-violet-100 rounded-full text-gray-600 hover:text-violet-600 transition-colors">
                    {q}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg" data-testid="recommendations-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="w-5 h-5 text-amber-500" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recommendations ? (
                <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                  <p className="text-sm text-gray-700 whitespace-pre-line">{recommendations}</p>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 text-gray-400">
                  <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                  Loading insights...
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
