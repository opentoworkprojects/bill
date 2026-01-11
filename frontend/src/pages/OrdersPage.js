import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  Users, 
  CreditCard, 
  Printer, 
  Eye, 
  Edit, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Timer,
  ChefHat,
  Utensils,
  Phone,
  User,
  Calendar,
  DollarSign,
  ShoppingCart,
  X,
  Minus
} from 'lucide-react';

const OrdersPage = ({ user }) => {
  const navigate = useNavigate();
  
  // State management
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [businessSettings, setBusinessSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  
  // Modal states
  const [showNewOrderDialog, setShowNewOrderDialog] = useState(false);
  const [showMenuPage, setShowMenuPage] = useState(false);
  const [editOrderModal, setEditOrderModal] = useState({ open: false, order: null });
  const [cancelConfirmModal, setCancelConfirmModal] = useState({ open: false, order: null });
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({ open: false, order: null });
  
  // Form states
  const [formData, setFormData] = useState({
    table_id: '',
    customer_name: '',
    customer_phone: '',
    items: [],
    notes: ''
  });
  const [cart, setCart] = useState([]);
  const [cartExpanded, setCartExpanded] = useState(false);
  const [menuSearch, setMenuSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [dontAskAgain, setDontAskAgain] = useState(false);

  // Fetch data functions
  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    }
  }, []);

  const fetchTables = useCallback(async () => {
    try {
      const response = await fetch('/api/tables');
      if (response.ok) {
        const data = await response.json();
        setTables(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
      setTables([]);
    }
  }, []);

  const fetchMenuItems = useCallback(async () => {
    try {
      const response = await fetch('/api/menu-items');
      if (response.ok) {
        const data = await response.json();
        setMenuItems(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching menu items:', error);
      setMenuItems([]);
    }
  }, []);

  const fetchBusinessSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/business-settings');
      if (response.ok) {
        const data = await response.json();
        setBusinessSettings(data || {});
      }
    } catch (error) {
      console.error('Error fetching business settings:', error);
      setBusinessSettings({});
    }
  }, []);

  // Initialize data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchOrders(),
        fetchTables(),
        fetchMenuItems(),
        fetchBusinessSettings()
      ]);
      setLoading(false);
    };
    
    loadData();
  }, [fetchOrders, fetchTables, fetchMenuItems, fetchBusinessSettings]);

  // Auto-refresh orders
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'active') {
        fetchOrders();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [activeTab, fetchOrders]);

  // Order management functions
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        await fetchOrders();
        setActionMenuOpen(null);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelConfirmModal.order) return;
    
    try {
      const response = await fetch(`/api/orders/${cancelConfirmModal.order.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      });

      if (response.ok) {
        await fetchOrders();
        setCancelConfirmModal({ open: false, order: null });
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
    }
  };

  const handleDeleteOrder = async () => {
    if (!deleteConfirmModal.order) return;
    
    try {
      const response = await fetch(`/api/orders/${deleteConfirmModal.order.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchOrders();
        setDeleteConfirmModal({ open: false, order: null });
      }
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  };

  const handlePrintKOT = async (order) => {
    try {
      const response = await fetch(`/api/orders/${order.id}/print-kot`, {
        method: 'POST'
      });
      
      if (response.ok) {
        console.log('KOT printed successfully');
      }
    } catch (error) {
      console.error('Error printing KOT:', error);
    }
  };

  // New order functions
  const handleNewOrder = () => {
    if (businessSettings?.kot_mode_enabled === false && dontAskAgain) {
      // Skip dialog and go directly to menu
      setFormData({
        table_id: '',
        customer_name: '',
        customer_phone: '',
        items: [],
        notes: ''
      });
      setCart([]);
      setShowMenuPage(true);
    } else {
      setShowNewOrderDialog(true);
    }
  };

  const handleCreateOrder = async () => {
    try {
      const orderData = {
        ...formData,
        items: cart,
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        await fetchOrders();
        setShowNewOrderDialog(false);
        setShowMenuPage(false);
        setFormData({
          table_id: '',
          customer_name: '',
          customer_phone: '',
          items: [],
          notes: ''
        });
        setCart([]);
      }
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  // Cart management
  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(cartItem => cartItem.id === item.id);
      if (existing) {
        return prev.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prev => {
      const existing = prev.find(cartItem => cartItem.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map(cartItem =>
          cartItem.id === itemId
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        );
      }
      return prev.filter(cartItem => cartItem.id !== itemId);
    });
  };

  const getCartItemQuantity = (itemId) => {
    const item = cart.find(cartItem => cartItem.id === itemId);
    return item ? item.quantity : 0;
  };

  // Filter and search functions
  const filteredOrders = orders.filter(order => {
    const matchesTab = activeTab === 'active' 
      ? !['completed', 'cancelled'].includes(order.status)
      : ['completed', 'cancelled'].includes(order.status);
    
    const matchesSearch = !searchTerm || 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.table_number?.toString().includes(searchTerm);
    
    const matchesFilter = filterStatus === 'all' || order.status === filterStatus;
    
    return matchesTab && matchesSearch && matchesFilter;
  });

  const availableTables = tables.filter(t => t.status === 'available');
  const categories = ['all', ...new Set(menuItems.map(item => item.category))];
  const filteredMenuItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(menuSearch.toLowerCase());
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Status configuration
  const statusConfig = {
    pending: { color: 'amber', icon: '⏳', label: 'Pending', bg: 'bg-amber-500' },
    preparing: { color: 'blue', icon: '👨‍🍳', label: 'Cooking', bg: 'bg-blue-500' },
    ready: { color: 'green', icon: '✅', label: 'Ready', bg: 'bg-green-500' },
    completed: { color: 'gray', icon: '✓', label: 'Completed', bg: 'bg-gray-500' },
    cancelled: { color: 'red', icon: '✗', label: 'Cancelled', bg: 'bg-red-500' }
  };

  if (showMenuPage) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-100">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="bg-violet-600 text-white p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold">Add Items</h1>
                <p className="text-sm text-white/80">
                  {formData.table_id ? `Table ${tables.find(t => t.id === formData.table_id)?.table_number || ''}` : 'Counter Order'}
                  {formData.customer_name && ` • ${formData.customer_name}`}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMenuPage(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Search and Categories */}
          <div className="p-4 bg-white border-b">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search menu items..."
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                    activeCategory === category
                      ? 'bg-violet-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {category === 'all' ? 'All Items' : category}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredMenuItems.map((item) => {
                const quantity = getCartItemQuantity(item.id);
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => addToCart(item)}
                  >
                    <div className="aspect-square relative bg-gray-50 flex items-center justify-center">
                      {item.image_url ? (
                        <img 
                          src={item.image_url} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Utensils className="w-8 h-8 text-gray-400" />
                      )}
                      
                      {quantity > 0 && (
                        <div className="absolute -top-0.5 -right-0.5 w-6 h-6 bg-violet-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow border-2 border-white">
                          {quantity}
                        </div>
                      )}
                      
                      {quantity === 0 && (
                        <div className="absolute bottom-0 right-0 w-5 h-5 bg-violet-600 rounded-full flex items-center justify-center shadow border border-white">
                          <Plus className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    
                    {quantity > 0 && (
                      <div className="flex items-center gap-0.5 mt-0.5 bg-white rounded-full shadow-sm border border-gray-100 px-0.5 py-0.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-sm font-medium">{quantity}</span>
                        <button
                          onClick={() => addToCart(item)}
                          className="w-6 h-6 bg-violet-600 hover:bg-violet-700 text-white rounded-full flex items-center justify-center"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    
                    <div className="p-2 text-center">
                      <p className="text-xs font-medium text-gray-600 line-clamp-1">{item.name}</p>
                      <p className="text-sm font-bold text-violet-600">₹{item.price}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {filteredMenuItems.length === 0 && (
              <div className="text-center py-12">
                <Utensils className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No menu items found</p>
              </div>
            )}
          </div>

          {/* Cart Footer */}
          {cartItemCount > 0 && (
            <div className="bg-white border-t p-4">
              <div className="flex items-center justify-between bg-violet-600 rounded-xl px-4 py-3 text-white">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  <span className="font-medium">{cartItemCount} items</span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">₹{cartTotal.toFixed(0)}</p>
                </div>
              </div>
              
              <Button
                onClick={handleCreateOrder}
                className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium"
              >
                Create Order
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Layout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
            <p className="text-gray-600">Manage your restaurant orders</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 w-64"
              />
            </div>
            
            <Button onClick={handleNewOrder} className="bg-violet-600 hover:bg-violet-700">
              <Plus className="w-4 h-4 mr-2" />
              New Order
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'active'
                ? 'bg-white text-violet-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Active Orders
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-white text-violet-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Today's Bills
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                      <div className="h-3 bg-gray-200 rounded w-32"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Orders List */}
        {!loading && (
          <div className="space-y-3">
            {filteredOrders.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {activeTab === 'active' ? 'No active orders' : 'No orders today'}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {activeTab === 'active' ? 'All clear! Tap "New Order" to get started' : 'No completed orders for today'}
                  </p>
                </CardContent>
              </Card>
            )}

            {filteredOrders.map((order) => {
              const config = statusConfig[order.status] || statusConfig.pending;
              const isCancelled = order.status === 'cancelled';
              const hasCredit = order.is_credit || order.credit_amount > 0;
              
              return (
                <Card key={order.id} className={`overflow-hidden ${isCancelled ? 'border-red-200 opacity-75' : hasCredit ? 'border-orange-200' : 'border-gray-100'}`}>
                  <CardContent className="p-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className={`${config.bg} text-white`}>
                          {config.icon} {config.label}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          #{order.id.slice(0, 8)}
                        </span>
                        {hasCredit && (
                          <Badge variant="outline" className="text-orange-600 border-orange-200">
                            Credit
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {['admin', 'cashier'].includes(user?.role) && activeTab === 'active' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setActionMenuOpen(actionMenuOpen === order.id ? null : order.id)}
                          >
                            •••
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Action Menu */}
                    {actionMenuOpen === order.id && ['admin', 'cashier'].includes(user?.role) && (
                      <div className="mb-3 p-3 bg-gray-50 rounded-lg border">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/billing/${order.id}`)}
                          >
                            <CreditCard className="w-4 h-4 mr-1" />
                            Bill & Pay
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setCancelConfirmModal({ open: true, order })}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeleteConfirmModal({ open: true, order })}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Customer Info */}
                    {order.customer_name && (
                      <div className="px-3 py-2 bg-gray-50 rounded-lg flex items-center gap-2 text-sm mb-3">
                        <User className="w-4 h-4 text-gray-500" />
                        <span>{order.customer_name}</span>
                        {order.customer_phone && <span className="text-gray-400">• {order.customer_phone}</span>}
                      </div>
                    )}

                    {/* Table Info */}
                    {order.table_number && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <Users className="w-4 h-4" />
                        <span>Table {order.table_number}</span>
                      </div>
                    )}

                    {/* Items */}
                    <div className="space-y-2 mb-4">
                      {order.items?.slice(0, 3).map((item, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="text-gray-700">
                            {item.quantity}x {item.name}
                          </span>
                          <span className="font-medium">₹{(item.price * item.quantity).toFixed(0)}</span>
                        </div>
                      ))}
                      {order.items?.length > 3 && (
                        <div className="text-sm text-gray-500">
                          +{order.items.length - 3} more items
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(order.created_at).toLocaleTimeString()}</span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          ₹{(() => {
                            try {
                              return (order.total || 0).toFixed(0);
                            } catch (e) {
                              console.warn('Invalid total for order:', order.id, order.total);
                              return '0';
                            }
                          })()}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {activeTab === 'active' && (
                      <div className="flex gap-2 mt-4">
                        {['admin', 'kitchen'].includes(user?.role) && order.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(order.id, 'preparing')}
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                          >
                            <ChefHat className="w-4 h-4 mr-1" />
                            Start Cooking
                          </Button>
                        )}
                        {['admin', 'kitchen'].includes(user?.role) && order.status === 'preparing' && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(order.id, 'ready')}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Mark Ready
                          </Button>
                        )}
                        {['admin', 'waiter', 'cashier'].includes(user?.role) && order.status !== 'completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePrintKOT(order)}
                          >
                            <Printer className="w-4 h-4 mr-1" />
                            KOT
                          </Button>
                        )}
                        {['admin', 'cashier'].includes(user?.role) && ['ready', 'preparing', 'pending'].includes(order.status) && (
                          <Button
                            size="sm"
                            onClick={() => navigate(`/billing/${order.id}`)}
                            className="flex-1 bg-violet-600 hover:bg-violet-700"
                          >
                            <CreditCard className="w-4 h-4 mr-1" />
                            Bill & Pay
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* New Order Dialog */}
        {showNewOrderDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-sm">
              <CardHeader>
                <CardTitle className="text-center">New Order</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Table Selection */}
                {businessSettings?.kot_mode_enabled !== false && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Select Table
                    </label>
                    <select
                      value={formData.table_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, table_id: e.target.value }))}
                      className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      <option value="">Counter Order</option>
                      {availableTables.map(table => (
                        <option key={table.id} value={table.id}>
                          Table {table.table_number}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Customer Name */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Customer Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="Enter customer name"
                  />
                </div>

                {/* Customer Phone */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="Enter phone number"
                  />
                </div>

                {/* Don't ask again option */}
                {businessSettings?.kot_mode_enabled === false && (
                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dontAskAgain}
                      onChange={(e) => setDontAskAgain(e.target.checked)}
                      className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                    />
                    <span className="text-sm text-gray-700">Don't ask again for counter orders</span>
                  </label>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowNewOrderDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      setShowNewOrderDialog(false);
                      setShowMenuPage(true);
                    }}
                    className="flex-1 bg-violet-600 hover:bg-violet-700"
                  >
                    Continue
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Cancel Order Confirmation Modal */}
        {cancelConfirmModal.open && cancelConfirmModal.order && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-sm">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
                <CardTitle className="text-lg text-orange-600">Cancel Order?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-center text-gray-600 text-sm">
                  Are you sure you want to cancel order <strong>#{cancelConfirmModal.order.id.slice(0, 8)}</strong>?
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setCancelConfirmModal({ open: false, order: null })}
                    className="flex-1"
                  >
                    Keep Order
                  </Button>
                  <Button
                    onClick={handleCancelOrder}
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                  >
                    Cancel Order
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Delete Order Confirmation Modal */}
        {deleteConfirmModal.open && deleteConfirmModal.order && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-sm">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <CardTitle className="text-lg text-red-600">Delete Order?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-center text-gray-600 text-sm">
                  Are you sure you want to <strong>permanently delete</strong> order <strong>#{deleteConfirmModal.order.id.slice(0, 8)}</strong>?
                  This will remove all records of this order.
                </p>
                <div className="p-3 bg-red-50 rounded-lg text-sm border border-red-200">
                  <p><strong>Table:</strong> {deleteConfirmModal.order.table_number}</p>
                  <p><strong>Total:</strong> ₹{deleteConfirmModal.order.total.toFixed(0)}</p>
                  <p><strong>Status:</strong> {deleteConfirmModal.order.status}</p>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setDeleteConfirmModal({ open: false, order: null })}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDeleteOrder}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default OrdersPage;