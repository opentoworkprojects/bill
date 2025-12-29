import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Plus, Eye, Printer, CreditCard, MessageCircle, X, Receipt, Minus, Search, Edit, Trash2, Ban, MoreVertical, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TrialBanner from '../components/TrialBanner';
import { printKOT as printKOTUtil, printReceipt as printReceiptUtil } from '../utils/printUtils';

const OrdersPage = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [businessSettings, setBusinessSettings] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [formData, setFormData] = useState({
    table_id: '',
    customer_name: '',
    customer_phone: ''
  });
  const [whatsappModal, setWhatsappModal] = useState({ open: false, orderId: null, customerName: '' });
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [viewOrderModal, setViewOrderModal] = useState({ open: false, order: null });
  const [printLoading, setPrintLoading] = useState(false);
  const [menuSearch, setMenuSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [editOrderModal, setEditOrderModal] = useState({ open: false, order: null });
  const [editItems, setEditItems] = useState([]);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({ open: false, order: null });
  const [cancelConfirmModal, setCancelConfirmModal] = useState({ open: false, order: null });
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  const navigate = useNavigate();

  // Get unique categories from menu items
  const categories = ['all', ...new Set(menuItems.map(item => item.category).filter(Boolean))];

  useEffect(() => {
    fetchOrders();
    fetchTables();
    fetchMenuItems();
    fetchBusinessSettings();
  }, []);

  const fetchBusinessSettings = async () => {
    try {
      const response = await axios.get(`${API}/business/settings`);
      setBusinessSettings(response.data.business_settings);
    } catch (error) {
      console.error('Failed to fetch business settings', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API}/orders`);
      setOrders(response.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (error) {
      toast.error('Failed to fetch orders');
    }
  };

  const fetchTables = async () => {
    try {
      const response = await axios.get(`${API}/tables`);
      setTables(response.data);
    } catch (error) {
      toast.error('Failed to fetch tables');
    }
  };

  const fetchMenuItems = async () => {
    try {
      const response = await axios.get(`${API}/menu`);
      setMenuItems(response.data.filter(item => item.available));
    } catch (error) {
      toast.error('Failed to fetch menu');
    }
  };

  const handleAddItem = (menuItem) => {
    const existingIndex = selectedItems.findIndex(item => item.menu_item_id === menuItem.id);
    if (existingIndex !== -1) {
      const updated = [...selectedItems];
      updated[existingIndex].quantity += 1;
      setSelectedItems(updated);
    } else {
      setSelectedItems([...selectedItems, {
        menu_item_id: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: 1,
        notes: ''
      }]);
    }
  };

  const handleRemoveItem = (index) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleQuantityChange = (index, quantity) => {
    if (quantity < 1) return;
    const updated = [...selectedItems];
    updated[index].quantity = quantity;
    setSelectedItems(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      toast.error('Please add at least one item');
      return;
    }
    
    // Check if table is required (KOT mode enabled)
    if (businessSettings?.kot_mode_enabled !== false && !formData.table_id) {
      toast.error('Please select a table');
      return;
    }
    
    try {
      const selectedTable = formData.table_id ? tables.find(t => t.id === formData.table_id) : null;
      const response = await axios.post(`${API}/orders`, {
        table_id: formData.table_id || null,
        table_number: selectedTable?.table_number || 0,
        items: selectedItems,
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        frontend_origin: window.location.origin  // Auto-pass current URL for tracking links
      });
      toast.success('Order created!');
      
      // If WhatsApp link is returned, offer to send notification
      if (response.data.whatsapp_link) {
        const sendNow = window.confirm('Send order confirmation to customer via WhatsApp?');
        if (sendNow) {
          window.open(response.data.whatsapp_link, '_blank');
        }
      }
      
      setDialogOpen(false);
      fetchOrders();
      fetchTables();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create order');
    }
  };

  const resetForm = () => {
    setFormData({ table_id: '', customer_name: '', customer_phone: '' });
    setSelectedItems([]);
  };

  const handleStatusChange = async (orderId, status) => {
    try {
      // Pass frontend_origin for tracking link generation
      const response = await axios.put(`${API}/orders/${orderId}/status?status=${status}&frontend_origin=${encodeURIComponent(window.location.origin)}`);
      toast.success('Order status updated!');
      
      // If WhatsApp link is returned, offer to send notification
      if (response.data.whatsapp_link && response.data.customer_phone) {
        const sendNow = window.confirm(`Send "${status}" update to customer via WhatsApp?`);
        if (sendNow) {
          window.open(response.data.whatsapp_link, '_blank');
        }
      }
      
      fetchOrders();
      fetchTables();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handlePrintKOT = async (order) => {
    try {
      // Use centralized print utility with global settings
      printKOTUtil(order, businessSettings);
      toast.success('KOT ready to print');
    } catch (error) {
      console.error('Failed to print KOT:', error);
      toast.error('Failed to print KOT');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700',
      preparing: 'bg-blue-100 text-blue-700',
      ready: 'bg-green-100 text-green-700',
      completed: 'bg-gray-100 text-gray-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const handleWhatsappShare = async () => {
    if (!whatsappPhone.trim()) {
      toast.error('Please enter a phone number');
      return;
    }
    
    try {
      const response = await axios.post(`${API}/whatsapp/send-receipt/${whatsappModal.orderId}`, {
        phone_number: whatsappPhone,
        customer_name: whatsappModal.customerName
      });
      
      window.open(response.data.whatsapp_link, '_blank');
      toast.success('Opening WhatsApp...');
      setWhatsappModal({ open: false, orderId: null, customerName: '' });
      setWhatsappPhone('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to generate WhatsApp link');
    }
  };

  // View order details
  const handleViewOrder = (order) => {
    setViewOrderModal({ open: true, order });
  };

  // Print receipt for completed order
  const handlePrintReceipt = async (order) => {
    setPrintLoading(true);
    try {
      // Use centralized print utility with global settings
      printReceiptUtil(order, businessSettings);
      toast.success('Receipt ready for printing!');
    } catch (error) {
      console.error('Failed to print receipt:', error);
      toast.error('Failed to print receipt');
    } finally {
      setPrintLoading(false);
    }
  };

  // Edit order - open modal with order items
  const handleEditOrder = (order) => {
    // Convert order items to editable format
    const items = order.items.map(item => ({
      menu_item_id: item.menu_item_id || item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      notes: item.notes || ''
    }));
    setEditItems(items);
    setEditOrderModal({ open: true, order });
    setActionMenuOpen(null);
  };

  // Update order items
  const handleUpdateOrder = async () => {
    if (editItems.length === 0) {
      toast.error('Order must have at least one item');
      return;
    }

    try {
      const subtotal = editItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const tax = subtotal * 0.05;
      const total = subtotal + tax;

      await axios.put(`${API}/orders/${editOrderModal.order.id}`, {
        items: editItems,
        subtotal,
        tax,
        total
      });

      toast.success('Order updated successfully!');
      setEditOrderModal({ open: false, order: null });
      setEditItems([]);
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update order');
    }
  };

  // Add item to edit order
  const handleAddEditItem = (menuItem) => {
    const existingIndex = editItems.findIndex(item => item.menu_item_id === menuItem.id);
    if (existingIndex !== -1) {
      const updated = [...editItems];
      updated[existingIndex].quantity += 1;
      setEditItems(updated);
    } else {
      setEditItems([...editItems, {
        menu_item_id: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: 1,
        notes: ''
      }]);
    }
  };

  // Remove item from edit order
  const handleRemoveEditItem = (index) => {
    setEditItems(editItems.filter((_, i) => i !== index));
  };

  // Change quantity in edit order
  const handleEditQuantityChange = (index, quantity) => {
    if (quantity < 1) return;
    const updated = [...editItems];
    updated[index].quantity = quantity;
    setEditItems(updated);
  };

  // Cancel order
  const handleCancelOrder = async () => {
    try {
      await axios.put(`${API}/orders/${cancelConfirmModal.order.id}/cancel`);
      toast.success('Order cancelled');
      setCancelConfirmModal({ open: false, order: null });
      fetchOrders();
      fetchTables();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to cancel order');
    }
  };

  // Delete order
  const handleDeleteOrder = async () => {
    try {
      await axios.delete(`${API}/orders/${deleteConfirmModal.order.id}`);
      toast.success('Order deleted');
      setDeleteConfirmModal({ open: false, order: null });
      fetchOrders();
      fetchTables();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete order');
    }
  };

  return (
    <Layout user={user}>
      <div className="space-y-4 sm:space-y-6" data-testid="orders-page">
        <TrialBanner user={user} />
        <div className="flex justify-between items-center flex-wrap gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Orders</h1>
            <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Manage restaurant orders</p>
          </div>
          {['admin', 'waiter', 'cashier'].includes(user?.role) && (
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { resetForm(); setMenuSearch(''); setActiveCategory('all'); } }}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-violet-600 to-purple-600 text-sm sm:text-base" data-testid="create-order-button">
                  <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">New Order</span>
                  <span className="sm:hidden">New</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl w-[95vw] sm:w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col p-0" data-testid="order-dialog">
                <DialogHeader className="p-4 sm:p-6 pb-2 sm:pb-4 border-b bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-t-lg">
                  <DialogTitle className="text-lg sm:text-xl">Create New Order</DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                  {/* Customer Info Section - Collapsible on mobile */}
                  <div className="p-3 sm:p-4 border-b bg-gray-50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                      {/* Only show table selection if KOT mode is enabled */}
                      {businessSettings?.kot_mode_enabled !== false && (
                        <div>
                          <Label className="text-xs sm:text-sm font-medium">Table *</Label>
                          <select
                            className="w-full px-2 sm:px-3 py-2 text-sm border rounded-lg mt-1 bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                            value={formData.table_id}
                            onChange={(e) => setFormData({ ...formData, table_id: e.target.value })}
                            required
                            data-testid="order-table-select"
                          >
                            <option value="">Select table</option>
                            {tables.filter(t => t.status === 'available').map(table => (
                              <option key={table.id} value={table.id}>Table {table.table_number} ({table.capacity})</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div>
                        <Label className="text-xs sm:text-sm font-medium">Customer Name</Label>
                        <Input
                          value={formData.customer_name}
                          onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                          placeholder="Name"
                          className="mt-1 text-sm"
                        />
                      </div>
                      <div className={businessSettings?.kot_mode_enabled !== false ? "sm:col-span-2" : "sm:col-span-2 lg:col-span-3"}>
                        <Label className="text-xs sm:text-sm font-medium">Phone (WhatsApp)</Label>
                        <Input
                          value={formData.customer_phone}
                          onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                          placeholder="+91 9876543210"
                          className="mt-1 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Menu Items Section */}
                  <div className="flex-1 overflow-hidden flex flex-col p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-3">
                      {/* Search */}
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="Search menu..."
                          value={menuSearch}
                          onChange={(e) => setMenuSearch(e.target.value)}
                          className="pl-9 text-sm"
                        />
                      </div>
                      
                      {/* Category Filter - Horizontal scroll on mobile */}
                      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-hide">
                        {categories.map(cat => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setActiveCategory(cat)}
                            className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                              activeCategory === cat
                                ? 'bg-violet-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {cat === 'all' ? 'All' : cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Menu Grid */}
                    <div className="flex-1 overflow-y-auto -mx-3 px-3 sm:mx-0 sm:px-0">
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                        {menuItems
                          .filter(item => {
                            const matchesSearch = item.name.toLowerCase().includes(menuSearch.toLowerCase());
                            const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
                            return matchesSearch && matchesCategory;
                          })
                          .map(item => {
                            const selectedItem = selectedItems.find(si => si.menu_item_id === item.id);
                            const quantity = selectedItem?.quantity || 0;
                            
                            return (
                              <div
                                key={item.id}
                                className={`relative p-2 sm:p-3 rounded-xl border-2 transition-all ${
                                  quantity > 0 
                                    ? 'border-violet-500 bg-violet-50' 
                                    : 'border-gray-200 bg-white hover:border-violet-300'
                                }`}
                              >
                                {quantity > 0 && (
                                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-violet-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                    {quantity}
                                  </div>
                                )}
                                <div className="mb-2">
                                  <p className="font-medium text-sm sm:text-base line-clamp-2 leading-tight">{item.name}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">{item.category}</p>
                                  <p className="text-sm sm:text-base font-bold text-violet-600 mt-1">₹{item.price}</p>
                                </div>
                                
                                {quantity === 0 ? (
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => handleAddItem(item)}
                                    className="w-full h-8 text-xs sm:text-sm bg-violet-600 hover:bg-violet-700"
                                  >
                                    <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                    Add
                                  </Button>
                                ) : (
                                  <div className="flex items-center justify-between gap-1">
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        const idx = selectedItems.findIndex(si => si.menu_item_id === item.id);
                                        if (quantity === 1) {
                                          handleRemoveItem(idx);
                                        } else {
                                          handleQuantityChange(idx, quantity - 1);
                                        }
                                      }}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                                    </Button>
                                    <span className="font-bold text-sm sm:text-base">{quantity}</span>
                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={() => {
                                        const idx = selectedItems.findIndex(si => si.menu_item_id === item.id);
                                        handleQuantityChange(idx, quantity + 1);
                                      }}
                                      className="h-8 w-8 p-0 bg-violet-600 hover:bg-violet-700"
                                    >
                                      <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                      
                      {menuItems.filter(item => {
                        const matchesSearch = item.name.toLowerCase().includes(menuSearch.toLowerCase());
                        const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
                        return matchesSearch && matchesCategory;
                      }).length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <p>No items found</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Summary - Fixed at bottom */}
                  <div className="border-t bg-white p-3 sm:p-4 shadow-lg">
                    {selectedItems.length > 0 ? (
                      <div className="space-y-2 sm:space-y-3">
                        {/* Selected Items - Compact view on mobile */}
                        <div className="max-h-24 sm:max-h-32 overflow-y-auto space-y-1.5">
                          {selectedItems.map((item, index) => (
                            <div key={index} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-2 py-1.5">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className="font-medium text-violet-600">{item.quantity}×</span>
                                <span className="truncate">{item.name}</span>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="font-medium">₹{(item.price * item.quantity).toFixed(0)}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(index)}
                                  className="text-red-500 hover:text-red-700 p-1"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Total and Submit */}
                        <div className="flex items-center justify-between pt-2 border-t">
                          <div>
                            <p className="text-xs text-gray-500">{selectedItems.reduce((sum, item) => sum + item.quantity, 0)} items</p>
                            <p className="text-lg sm:text-xl font-bold text-violet-600">
                              ₹{selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(0)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              onClick={() => { setDialogOpen(false); resetForm(); setMenuSearch(''); setActiveCategory('all'); }}
                              className="text-xs sm:text-sm"
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit" 
                              className="bg-gradient-to-r from-violet-600 to-purple-600 text-xs sm:text-sm px-4 sm:px-6"
                              data-testid="submit-order-button"
                            >
                              Create Order
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-2 text-gray-500 text-sm">
                        <p>Select items to create an order</p>
                      </div>
                    )}
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid gap-3 sm:gap-4">
          {orders.map((order) => {
            const statusConfig = {
              pending: { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', icon: '⏳' },
              preparing: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', icon: '👨‍🍳' },
              ready: { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', icon: '✅' },
              completed: { bg: 'bg-gray-50', border: 'border-gray-200', badge: 'bg-gray-100 text-gray-600', icon: '🎉' },
              cancelled: { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-600', icon: '❌' }
            };
            const config = statusConfig[order.status] || statusConfig.pending;
            
            return (
              <Card key={order.id} className={`border-2 ${config.border} ${config.bg} shadow-sm hover:shadow-md transition-all overflow-hidden`} data-testid={`order-card-${order.id}`}>
                {/* Status Bar */}
                <div className={`h-1 ${order.status === 'preparing' ? 'bg-gradient-to-r from-blue-400 to-blue-600 animate-pulse' : order.status === 'ready' ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : order.status === 'pending' ? 'bg-gradient-to-r from-amber-400 to-amber-600' : 'bg-gray-300'}`} />
                
                <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{config.icon}</span>
                        <CardTitle className="text-base sm:text-lg font-bold">Order #{order.id.slice(0, 8)}</CardTitle>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <span className="w-5 h-5 bg-violet-100 rounded-full flex items-center justify-center text-[10px]">🍽️</span>
                          Table {order.table_number}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-[10px]">👤</span>
                          {order.waiter_name}
                        </span>
                      </div>
                      {order.customer_name && (
                        <p className="text-xs sm:text-sm text-gray-500 mt-1 flex items-center gap-1">
                          <span className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center text-[10px]">📱</span>
                          {order.customer_name}
                          {order.customer_phone && <span className="text-gray-400">• {order.customer_phone}</span>}
                        </p>
                      )}
                      <p className="text-[10px] sm:text-xs text-gray-400 mt-1">
                        {new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}, {new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap ${config.badge} shadow-sm`}>
                        {order.status}
                      </span>
                      {/* Action Menu for Edit/Cancel/Delete */}
                      {['admin', 'cashier'].includes(user?.role) && order.status !== 'completed' && (
                        <div className="relative">
                          <button
                            onClick={() => setActionMenuOpen(actionMenuOpen === order.id ? null : order.id)}
                            className="p-1.5 rounded-lg hover:bg-white/80 transition-colors"
                          >
                            <MoreVertical className="w-4 h-4 text-gray-500" />
                          </button>
                          {actionMenuOpen === order.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setActionMenuOpen(null)} />
                              <div className="absolute right-0 top-8 z-20 w-40 bg-white rounded-xl shadow-xl border py-1.5">
                                {order.status !== 'cancelled' && (
                                  <>
                                    <button
                                      onClick={() => handleEditOrder(order)}
                                      className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 flex items-center gap-2 transition-colors"
                                    >
                                      <Edit className="w-4 h-4 text-blue-600" />
                                      <span>Edit Order</span>
                                    </button>
                                    <button
                                      onClick={() => { setCancelConfirmModal({ open: true, order }); setActionMenuOpen(null); }}
                                      className="w-full px-3 py-2 text-left text-sm hover:bg-orange-50 flex items-center gap-2 text-orange-600 transition-colors"
                                    >
                                      <Ban className="w-4 h-4" />
                                      <span>Cancel Order</span>
                                    </button>
                                  </>
                                )}
                                {user?.role === 'admin' && (
                                  <button
                                    onClick={() => { setDeleteConfirmModal({ open: true, order }); setActionMenuOpen(null); }}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-600 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    <span>Delete Order</span>
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  <div className="space-y-3">
                    {/* Items - Enhanced styling */}
                    <div className="bg-white/60 rounded-xl p-2.5 sm:p-3 space-y-1.5 max-h-28 sm:max-h-36 overflow-y-auto">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs sm:text-sm py-1 border-b border-gray-100 last:border-0">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="w-6 h-6 bg-violet-100 text-violet-700 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {item.quantity}x
                            </span>
                            <span className="truncate font-medium">{item.name}</span>
                          </div>
                          <span className="font-semibold text-gray-700 ml-2 flex-shrink-0">₹{(item.price * item.quantity).toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Totals - Enhanced styling */}
                    <div className="bg-white rounded-xl p-3 shadow-sm space-y-1">
                      <div className="flex justify-between text-xs sm:text-sm text-gray-600">
                        <span>Subtotal:</span>
                        <span className="font-medium">₹{order.subtotal.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between text-[10px] sm:text-xs text-gray-400">
                        <span>Tax (5%):</span>
                        <span>₹{order.tax.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between text-base sm:text-lg font-bold pt-1.5 border-t border-dashed border-gray-200">
                        <span className="text-gray-700">Total:</span>
                        <span className="text-violet-600">₹{order.total.toFixed(0)}</span>
                      </div>
                    </div>
                    
                    {/* Action Buttons - Enhanced styling */}
                    <div className="flex gap-1.5 sm:gap-2 flex-wrap pt-1">
                      {['admin', 'kitchen'].includes(user?.role) && order.status === 'pending' && (
                        <Button 
                          size="sm" 
                          onClick={() => handleStatusChange(order.id, 'preparing')} 
                          className="text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-md"
                          data-testid={`status-preparing-${order.id}`}
                        >
                          👨‍🍳 Start Cooking
                        </Button>
                      )}
                      {['admin', 'kitchen'].includes(user?.role) && order.status === 'preparing' && (
                        <Button 
                          size="sm" 
                          onClick={() => handleStatusChange(order.id, 'ready')} 
                          className="text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 shadow-md"
                          data-testid={`status-ready-${order.id}`}
                        >
                          ✅ Ready
                        </Button>
                      )}
                      {['admin', 'waiter', 'cashier'].includes(user?.role) && order.status !== 'completed' && order.status !== 'cancelled' && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handlePrintKOT(order)} 
                          className="text-xs sm:text-sm h-9 sm:h-10 px-2.5 sm:px-3 border-2 hover:bg-gray-50"
                          data-testid={`print-kot-${order.id}`}
                        >
                          <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1.5" />
                          <span className="hidden sm:inline">Print KOT</span>
                        </Button>
                      )}
                      {['admin', 'cashier'].includes(user?.role) && ['ready', 'preparing'].includes(order.status) && (
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4 shadow-md"
                          onClick={() => navigate(`/billing/${order.id}`)}
                          data-testid={`billing-${order.id}`}
                        >
                          <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
                          <span>Bill</span>
                        </Button>
                      )}
                      {order.status === 'completed' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewOrder(order)}
                            className="text-xs sm:text-sm h-9 sm:h-10 px-2.5 sm:px-3 border-2"
                            data-testid={`view-${order.id}`}
                          >
                            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePrintReceipt(order)}
                            disabled={printLoading}
                            className="text-xs sm:text-sm h-9 sm:h-10 px-2.5 sm:px-3 border-2"
                            data-testid={`print-receipt-${order.id}`}
                          >
                            <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-2 border-green-500 text-green-600 hover:bg-green-50 text-xs sm:text-sm h-9 sm:h-10 px-2.5 sm:px-3"
                            onClick={() => setWhatsappModal({ open: true, orderId: order.id, customerName: order.customer_name || 'Guest' })}
                            data-testid={`whatsapp-${order.id}`}
                          >
                            <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {orders.length === 0 && (
            <div className="text-center py-8 sm:py-12">
              <p className="text-gray-500 text-sm sm:text-base">No orders found</p>
            </div>
          )}
        </div>

        {/* WhatsApp Modal */}
        {whatsappModal.open && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
            <Card className="w-full max-w-md border-0 shadow-2xl">
              <CardHeader className="relative p-4 sm:p-6">
                <button
                  onClick={() => { setWhatsappModal({ open: false, orderId: null, customerName: '' }); setWhatsappPhone(''); }}
                  className="absolute right-3 sm:right-4 top-3 sm:top-4 text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg pr-8">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                  Share via WhatsApp
                </CardTitle>
              </CardHeader>
              <div className="p-4 sm:p-6 pt-0 space-y-4">
                <div>
                  <Label className="text-sm">Phone Number</Label>
                  <Input
                    placeholder="+91 9876543210"
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter with country code</p>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                  <strong>Order:</strong> #{whatsappModal.orderId?.slice(0, 8)}<br />
                  <strong>Customer:</strong> {whatsappModal.customerName}
                </div>

                <div className="flex gap-2 sm:gap-3">
                  <Button
                    onClick={handleWhatsappShare}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-sm sm:text-base"
                  >
                    Open WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { setWhatsappModal({ open: false, orderId: null, customerName: '' }); setWhatsappPhone(''); }}
                    className="text-sm sm:text-base"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* View Order Modal */}
        {viewOrderModal.open && viewOrderModal.order && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
            <Card className="w-full max-w-lg border-0 shadow-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
              <CardHeader className="relative bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-t-lg p-4 sm:p-6 flex-shrink-0">
                <button
                  onClick={() => setViewOrderModal({ open: false, order: null })}
                  className="absolute right-3 sm:right-4 top-3 sm:top-4 text-white/80 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg pr-8">
                  <Receipt className="w-5 h-5" />
                  Order #{viewOrderModal.order.id.slice(0, 8)}
                </CardTitle>
                <p className="text-violet-100 text-xs sm:text-sm mt-1">
                  {new Date(viewOrderModal.order.created_at).toLocaleString()}
                </p>
              </CardHeader>
              <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto flex-1">
                {/* Order Info */}
                <div className="grid grid-cols-2 gap-2 sm:gap-4 text-sm">
                  <div className="p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-xs">Table</p>
                    <p className="font-bold text-base sm:text-lg">{viewOrderModal.order.table_number || 'Counter'}</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-xs">Status</p>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(viewOrderModal.order.status)}`}>
                      {viewOrderModal.order.status}
                    </span>
                  </div>
                  {viewOrderModal.order.customer_name && (
                    <div className="p-2 sm:p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-500 text-xs">Customer</p>
                      <p className="font-bold text-sm truncate">{viewOrderModal.order.customer_name}</p>
                    </div>
                  )}
                  <div className="p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-xs">Server</p>
                    <p className="font-bold text-sm truncate">{viewOrderModal.order.waiter_name}</p>
                  </div>
                </div>

                {/* Items */}
                <div className="border-t pt-3 sm:pt-4">
                  <h4 className="font-bold mb-2 sm:mb-3 text-sm sm:text-base">Order Items</h4>
                  <div className="space-y-1.5 sm:space-y-2 max-h-32 sm:max-h-40 overflow-y-auto">
                    {viewOrderModal.order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{item.quantity}× {item.name}</p>
                          {item.notes && <p className="text-xs text-orange-600 truncate">Note: {item.notes}</p>}
                        </div>
                        <p className="font-bold text-sm ml-2 flex-shrink-0">₹{(item.price * item.quantity).toFixed(0)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="border-t pt-3 sm:pt-4 space-y-1 sm:space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span className="font-medium">₹{viewOrderModal.order.subtotal.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm text-gray-600">
                    <span>Tax:</span>
                    <span>₹{viewOrderModal.order.tax.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-lg sm:text-xl font-bold text-violet-600 pt-2 border-t">
                    <span>Total:</span>
                    <span>₹{viewOrderModal.order.total.toFixed(0)}</span>
                  </div>
                  {viewOrderModal.order.payment_method && (
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-500">Payment:</span>
                      <span className="font-medium capitalize">{viewOrderModal.order.payment_method}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4 border-t flex-wrap">
                  <Button
                    onClick={() => handlePrintReceipt(viewOrderModal.order)}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-sm h-9 sm:h-10"
                    disabled={printLoading}
                  >
                    <Printer className="w-4 h-4 mr-1 sm:mr-2" />
                    Print
                  </Button>
                  <Button
                    variant="outline"
                    className="border-green-500 text-green-600 hover:bg-green-50 text-sm h-9 sm:h-10"
                    onClick={() => {
                      setViewOrderModal({ open: false, order: null });
                      setWhatsappModal({ open: true, orderId: viewOrderModal.order.id, customerName: viewOrderModal.order.customer_name || 'Guest' });
                    }}
                  >
                    <MessageCircle className="w-4 h-4 sm:mr-1" />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setViewOrderModal({ open: false, order: null })}
                    className="text-sm h-9 sm:h-10"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Edit Order Modal */}
        {editOrderModal.open && editOrderModal.order && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
            <Card className="w-full max-w-2xl border-0 shadow-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
              <CardHeader className="relative bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg p-4 sm:p-6 flex-shrink-0">
                <button
                  onClick={() => { setEditOrderModal({ open: false, order: null }); setEditItems([]); }}
                  className="absolute right-3 sm:right-4 top-3 sm:top-4 text-white/80 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg pr-8">
                  <Edit className="w-5 h-5" />
                  Edit Order #{editOrderModal.order.id.slice(0, 8)}
                </CardTitle>
              </CardHeader>
              <div className="flex-1 overflow-hidden flex flex-col">
                {/* Menu Items to Add */}
                <div className="p-3 sm:p-4 border-b bg-gray-50">
                  <Label className="text-sm font-medium mb-2 block">Add Items</Label>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {menuItems.slice(0, 10).map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleAddEditItem(item)}
                        className="flex-shrink-0 px-3 py-2 bg-white border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-sm"
                      >
                        <span className="font-medium">{item.name}</span>
                        <span className="text-gray-500 ml-1">₹{item.price}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Current Order Items */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4">
                  <Label className="text-sm font-medium mb-2 block">Order Items</Label>
                  {editItems.length > 0 ? (
                    <div className="space-y-2">
                      {editItems.map((item, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{item.name}</p>
                            <p className="text-xs text-gray-500">₹{item.price} each</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (item.quantity === 1) {
                                  handleRemoveEditItem(index);
                                } else {
                                  handleEditQuantityChange(index, item.quantity - 1);
                                }
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="w-8 text-center font-bold">{item.quantity}</span>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleEditQuantityChange(index, item.quantity + 1)}
                              className="h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                            <span className="w-16 text-right font-bold">₹{(item.price * item.quantity).toFixed(0)}</span>
                            <button
                              onClick={() => handleRemoveEditItem(index)}
                              className="p-1 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No items in order</p>
                    </div>
                  )}
                </div>

                {/* Summary and Actions */}
                <div className="border-t bg-white p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs text-gray-500">{editItems.reduce((sum, item) => sum + item.quantity, 0)} items</p>
                      <p className="text-lg font-bold text-blue-600">
                        ₹{editItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(0)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => { setEditOrderModal({ open: false, order: null }); setEditItems([]); }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleUpdateOrder}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600"
                        disabled={editItems.length === 0}
                      >
                        Update Order
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Cancel Order Confirmation Modal */}
        {cancelConfirmModal.open && cancelConfirmModal.order && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
            <Card className="w-full max-w-sm border-0 shadow-2xl">
              <CardHeader className="text-center pb-2">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Ban className="w-6 h-6 text-orange-600" />
                </div>
                <CardTitle className="text-lg">Cancel Order?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-center text-gray-600 text-sm">
                  Are you sure you want to cancel order <strong>#{cancelConfirmModal.order.id.slice(0, 8)}</strong>?
                  This action cannot be undone.
                </p>
                <div className="p-3 bg-gray-50 rounded-lg text-sm">
                  <p><strong>Table:</strong> {cancelConfirmModal.order.table_number}</p>
                  <p><strong>Total:</strong> ₹{cancelConfirmModal.order.total.toFixed(0)}</p>
                </div>
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
            <Card className="w-full max-w-sm border-0 shadow-2xl">
              <CardHeader className="text-center pb-2">
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
