import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { DollarSign, ShoppingCart, Users, TrendingUp, MessageSquare, Sparkles, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState({
    todayOrders: 0,
    todaySales: 0,
    activeOrders: 0
  });
  const [chatMessage, setChatMessage] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
    fetchRecommendations();
    fetchSubscriptionStatus();
  }, []);

  const fetchStats = async () => {
    try {
      const dailyReport = await axios.get(`${API}/reports/daily`);
      const orders = await axios.get(`${API}/orders`);
      const activeOrders = orders.data.filter(o => ['pending', 'preparing'].includes(o.status));

      setStats({
        todayOrders: dailyReport.data.total_orders,
        todaySales: dailyReport.data.total_sales,
        activeOrders: activeOrders.length
      });
    } catch (error) {
      console.error('Failed to fetch stats', error);
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

  const statCards = [
    { title: 'Today\'s Sales', value: `₹${stats.todaySales.toFixed(2)}`, icon: DollarSign, color: 'from-green-500 to-emerald-600' },
    { title: 'Today\'s Orders', value: stats.todayOrders, icon: ShoppingCart, color: 'from-blue-500 to-cyan-600' },
    { title: 'Active Orders', value: stats.activeOrders, icon: TrendingUp, color: 'from-orange-500 to-amber-600' }
  ];

  return (
    <Layout user={user}>
      <div className="space-y-6" data-testid="dashboard-page">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Welcome back, {user?.username}!</h1>
          <p className="text-gray-600 mt-2">Here's what's happening with your restaurant today</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statCards.map((stat, index) => (
            <Card key={index} className="card-hover border-0 shadow-lg" data-testid={`stat-card-${index}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
                <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-lg" data-testid="ai-chat-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-violet-600" />
                AI Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask about menu, orders, or anything..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleChat()}
                  data-testid="chat-input"
                />
                <Button onClick={handleChat} disabled={loading} className="bg-gradient-to-r from-violet-600 to-purple-600" data-testid="chat-send-button">
                  {loading ? 'Sending...' : 'Send'}
                </Button>
              </div>
              {chatResponse && (
                <div className="p-4 bg-violet-50 rounded-lg border border-violet-200" data-testid="chat-response">
                  <p className="text-sm text-gray-700">{chatResponse}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg" data-testid="recommendations-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-600" />
                AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recommendations ? (
                <div className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 rounded-lg border border-violet-200">
                  <p className="text-sm text-gray-700 whitespace-pre-line">{recommendations}</p>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Loading recommendations...</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
