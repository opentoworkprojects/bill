import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { 
  Package, Clock, CheckCircle, XCircle, RefreshCw, 
  Phone, MapPin, User, IndianRupee, Filter, Search
} from 'lucide-react';
import { Input } from '../components/ui/input';

const AggregatorOrdersPage = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, accepted, rejected
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchOrders();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API}/aggregator/orders`);
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch aggregator orders');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      await axios.put(`${API}/aggregator/orders/${orderId}/accept`);
      toast.success('Order accepted successfully');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to accept order');
    }
  };

  const handleRejectOrder = async (orderId, reason = 'Restaurant busy') => {
    try {
      await axios.put(`${API}/aggregator/orders/${orderId}/reject`, { reason });
      toast.success('Order rejected');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to reject order');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending_acceptance: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      placed: { color: 'bg-blue-100 text-blue-800', label: 'Accepted' },
      preparing: { color: 'bg-orange-100 text-orange-800', label: 'Preparing' },
      ready: { color: 'bg-green-100 text-green-800', label: 'Ready' },
      completed: { color: 'bg-gray-100 text-gray-800', label: 'Completed' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' }
    };
    const config = statusConfig[status] || statusConfig.pending_acceptance;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getSourceIcon = (source) => {
    if (source === 'zomato') {
      return <div className="w-6 h-6 bg-red-500 rounded text-white text-xs flex items-center justify-center font-bold">Z</div>;
    }
    if (source === 'swiggy') {
      return <div className="w-6 h-6 bg-orange-500 rounded text-white text-xs flex items-center justify-center font-bold">S</div>;
    }
    return <Package className="w-6 h-6 text-gray-400" />;
  };

  const filteredOrders = orders.filter(order => {
    const matchesFilter = filter === 'all' || order.status === filter;
    const matchesSearch = !searchQuery || 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.external_order_id?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <Layout user={user}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Aggregator Orders</h1>
            <p className="text-gray-600">Manage orders from Zomato and Swiggy</p>
          </div>
          <Button onClick={fetchOrders} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex gap-2">
                {[
                  { key: 'all', label: 'All Orders' },
                  { key: 'pending_acceptance', label: 'Pending' },
                  { key: 'placed', label: 'Accepted' },
                  { key: 'preparing', label: 'Preparing' },
                  { key: 'rejected', label: 'Rejected' }
                ].map(f => (
                  <Button
                    key={f.key}
                    variant={filter === f.key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter(f.key)}
                  >
                    {f.label}
                  </Button>
                ))}
              </div>
              <div className="flex-1 max-w-sm">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search orders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Orders Found</h3>
              <p className="text-gray-500">
                {orders.length === 0 
                  ? 'Connect Zomato or Swiggy to start receiving orders'
                  : 'No orders match your current filters'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getSourceIcon(order.source)}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">#{order.id.slice(-8)}</h3>
                          {getStatusBadge(order.status)}
                        </div>
                        <p className="text-sm text-gray-500">
                          {order.source?.toUpperCase()} • {formatTime(order.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">₹{order.total}</p>
                      {order.payment_status === 'paid' && (
                        <p className="text-xs text-green-600">Prepaid</p>
                      )}
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{order.customer_name}</span>
                    </div>
                    {order.customer_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{order.customer_phone}</span>
                      </div>
                    )}
                    {order.customer_address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm truncate">{order.customer_address}</span>
                      </div>
                    )}
                  </div>

                  {/* Items */}
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Items ({order.items?.length || 0})</h4>
                    <div className="space-y-1">
                      {order.items?.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>{item.name} × {item.quantity}</span>
                          <span>₹{(item.price * item.quantity).toFixed(0)}</span>
                        </div>
                      ))}
                      {order.items?.length > 3 && (
                        <p className="text-xs text-gray-500">+{order.items.length - 3} more items</p>
                      )}
                    </div>
                  </div>

                  {/* Special Instructions */}
                  {order.special_instructions && (
                    <div className="mb-4 p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
                      <p className="text-sm"><strong>Instructions:</strong> {order.special_instructions}</p>
                    </div>
                  )}

                  {/* Actions */}
                  {order.status === 'pending_acceptance' && (
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleAcceptOrder(order.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Accept Order
                      </Button>
                      <Button 
                        onClick={() => handleRejectOrder(order.id)}
                        variant="outline"
                        className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  )}

                  {order.status === 'placed' && (
                    <div className="flex gap-2">
                      <Button className="flex-1 bg-orange-600 hover:bg-orange-700">
                        <Clock className="w-4 h-4 mr-2" />
                        Mark Preparing
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AggregatorOrdersPage;
