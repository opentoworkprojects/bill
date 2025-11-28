import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const TrackOrderPage = () => {
  const { trackingToken } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrder();
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchOrder, 10000);
    return () => clearInterval(interval);
  }, [trackingToken]);

  const fetchOrder = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/public/track/${trackingToken}`);
      setOrder(response.data);
      setError(null);
    } catch (err) {
      setError('Order not found or tracking link expired');
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    const statuses = {
      pending: { icon: '📋', label: 'Order Received', color: 'bg-yellow-500', progress: 25 },
      preparing: { icon: '👨‍🍳', label: 'Being Prepared', color: 'bg-blue-500', progress: 50 },
      ready: { icon: '🔔', label: 'Ready to Serve', color: 'bg-green-500', progress: 75 },
      completed: { icon: '✅', label: 'Completed', color: 'bg-gray-500', progress: 100 }
    };
    return statuses[status] || statuses.pending;
  };

  const getCurrencySymbol = (currency) => {
    const symbols = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
    return symbols[currency] || '₹';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-6xl mb-4">😕</p>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Order Not Found</h2>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);
  const currency = getCurrencySymbol(order.currency);

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-100 p-4">
      <div className="max-w-lg mx-auto space-y-4">
        {/* Header */}
        <div className="text-center py-4">
          <h1 className="text-2xl font-bold text-gray-800">{order.restaurant_name}</h1>
          <p className="text-gray-600">Order #{order.order_id}</p>
        </div>

        {/* Status Card */}
        <Card className="border-0 shadow-xl overflow-hidden">
          <div className={`${statusInfo.color} p-6 text-white text-center`}>
            <p className="text-5xl mb-2">{statusInfo.icon}</p>
            <h2 className="text-2xl font-bold">{statusInfo.label}</h2>
          </div>
          <CardContent className="pt-4">
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Received</span>
                <span>Preparing</span>
                <span>Ready</span>
                <span>Done</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${statusInfo.color} transition-all duration-500`}
                  style={{ width: `${statusInfo.progress}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Table</p>
                <p className="font-medium">{order.table_number}</p>
              </div>
              <div>
                <p className="text-gray-500">Customer</p>
                <p className="font-medium">{order.customer_name || 'Guest'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg">Order Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 border-b last:border-0">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                </div>
                <p className="font-medium">{currency}{(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
            
            <div className="pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{currency}{order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Tax</span>
                <span>{currency}{order.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-violet-600 pt-2 border-t">
                <span>Total</span>
                <span>{currency}{order.total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        {order.restaurant_phone && (
          <Card className="border-0 shadow-lg">
            <CardContent className="py-4 text-center">
              <p className="text-sm text-gray-500">Need help?</p>
              <a href={`tel:${order.restaurant_phone}`} className="text-violet-600 font-medium">
                📞 {order.restaurant_phone}
              </a>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-gray-400 py-4">
          Auto-refreshing every 10 seconds
        </p>
      </div>
    </div>
  );
};

export default TrackOrderPage;
