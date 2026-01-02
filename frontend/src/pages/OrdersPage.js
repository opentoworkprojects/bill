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
import { Plus, Eye, Printer, CreditCard, MessageCircle, X, Receipt, Minus, Search, Edit, Trash2, Ban, MoreVertical, AlertTriangle, ArrowLeft, ShoppingCart, Clock, CheckCircle, Wallet, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TrialBanner from '../components/TrialBanner';
import { printKOT as printKOTUtil, printReceipt as printReceiptUtil } from '../utils/printUtils';

// Sound effects for better UX
const playSound = (type) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (type === 'add') {
      // Pleasant "pop" sound for adding item
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.05);
      oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.15);
    } else if (type === 'remove') {
      // Soft "thud" for removing
      oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } else if (type === 'success') {
      // Success chime
      oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.4);
    }
  } catch (e) {
    // Silently fail if audio not supported
  }
};

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
  const [editOrderModal, setEditOrderModal] = useState({ 
    open: false, 
    order: null,
    customer_name: '',
    customer_phone: '',
    payment_method: 'cash',
    is_credit: false,
    payment_received: 0,
    balance_amount: 0,
    // Multi-payment support
    cash_amount: 0,
    card_amount: 0,
    upi_amount: 0,
    credit_amount: 0,
    use_split_payment: false
  });
  const [editItems, setEditItems] = useState([]);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({ open: false, order: null });
  const [cancelConfirmModal, setCancelConfirmModal] = useState({ open: false, order: null });
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  // State for 2-step order flow
  const [showMenuPage, setShowMenuPage] = useState(false);
  // Tab state for Active Orders vs Today's Bills
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'history'
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Get unique categories from menu items
  const categories = ['all', ...new Set(menuItems.map(item => item.category).filter(Boolean))];

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchOrders(),
        fetchTables(),
        fetchMenuItems(),
        fetchBusinessSettings()
      ]);
    } catch (error) {
      console.error('Failed to load initial data', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinessSettings = async () => {
    try {
      const response = await axios.get(`${API}/business/settings`);
      setBusinessSettings(response.data.business_settings || {});
    } catch (error) {
      console.error('Failed to fetch business settings', error);
      setBusinessSettings({});
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API}/orders`);
      const ordersData = Array.isArray(response.data) ? response.data : [];
      setOrders(ordersData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (error) {
      console.error('Failed to fetch orders', error);
      setOrders([]);
    }
  };

  const fetchTables = async () => {
    try {
      const response = await axios.get(`${API}/tables`);
      setTables(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch tables', error);
      setTables([]);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const response = await axios.get(`${API}/menu`);
      const items = Array.isArray(response.data) ? response.data : [];
      setMenuItems(items.filter(item => item.available));
    } catch (error) {
      console.error('Failed to fetch menu', error);
      setMenuItems([]);
    }
  };

  const handleAddItem = (menuItem) => {
    playSound('add');
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
    playSound('remove');
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleQuantityChange = (index, quantity) => {
    if (quantity < 1) return;
    const updated = [...selectedItems];
    updated[index].quantity = quantity;
    setSelectedItems(updated);
  };

  // Submit order from full-screen menu page
  const handleSubmitOrder = async () => {
    if (selectedItems.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    setLoading(true);
    try {
      const selectedTable = formData.table_id ? tables.find(t => t.id === formData.table_id) : null;
      const response = await axios.post(`${API}/orders`, {
        table_id: formData.table_id || null,
        table_number: selectedTable?.table_number || 0,
        items: selectedItems,
        customer_name: formData.customer_name || '',
        customer_phone: formData.customer_phone || '',
        frontend_origin: window.location.origin
      });
      
      toast.success('Order created successfully!');
      setShowMenuPage(false);
      resetForm();
      
      // Refresh data
      await Promise.all([fetchOrders(), fetchTables()]);
      
      // Offer WhatsApp notification
      if (response.data?.whatsapp_link && formData.customer_phone) {
        setTimeout(() => {
          if (window.confirm('Send order confirmation via WhatsApp?')) {
            window.open(response.data.whatsapp_link, '_blank');
          }
        }, 300);
      }
    } catch (error) {
      console.error('Order creation failed:', error);
      const errorMsg = error.response?.data?.detail || error.message || 'Failed to create order';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ table_id: '', customer_name: '', customer_phone: '' });
    setSelectedItems([]);
    setMenuSearch('');
    setActiveCategory('all');
  };

  const handleStatusChange = async (orderId, status) => {
    try {
      const response = await axios.put(`${API}/orders/${orderId}/status?status=${status}&frontend_origin=${encodeURIComponent(window.location.origin)}`);
      toast.success('Status updated!');
      
      if (response.data?.whatsapp_link && response.data?.customer_phone) {
        setTimeout(() => {
          if (window.confirm(`Send "${status}" update via WhatsApp?`)) {
            window.open(response.data.whatsapp_link, '_blank');
          }
        }, 300);
      }
      
      await Promise.all([fetchOrders(), fetchTables()]);
    } catch (error) {
      console.error('Status update failed:', error);
      toast.error(error.response?.data?.detail || 'Failed to update status');
    }
  };

  const handlePrintKOT = (order) => {
    try {
      printKOTUtil(order, businessSettings);
      toast.success('KOT sent to printer');
    } catch (error) {
      console.error('Print KOT failed:', error);
      toast.error('Failed to print KOT');
    }
  };

  const handleWhatsappShare = async () => {
    if (!whatsappPhone.trim()) {
      toast.error('Please enter a phone number');
      return;
    }
    
    try {
      const response = await axios.post(`${API}/whatsapp/send-receipt/${whatsappModal.orderId}`, {
        phone_number: whatsappPhone,
        customer_name: whatsappModal.customerName || ''
      });
      
      if (response.data?.whatsapp_link) {
        window.open(response.data.whatsapp_link, '_blank');
        toast.success('Opening WhatsApp...');
      }
      setWhatsappModal({ open: false, orderId: null, customerName: '' });
      setWhatsappPhone('');
    } catch (error) {
      console.error('WhatsApp share failed:', error);
      toast.error(error.response?.data?.detail || 'Failed to share');
    }
  };

  const handleViewOrder = (order) => {
    if (!order) return;
    setViewOrderModal({ open: true, order });
    setActionMenuOpen(null);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700',
      preparing: 'bg-blue-100 text-blue-700',
      ready: 'bg-green-100 text-green-700',
      completed: 'bg-gray-100 text-gray-700',
      cancelled: 'bg-red-100 text-red-700',
      credit: 'bg-orange-100 text-orange-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const handlePrintReceipt = (order) => {
    setPrintLoading(true);
    try {
      printReceiptUtil(order, businessSettings);
      toast.success('Receipt sent to printer');
    } catch (error) {
      console.error('Print receipt failed:', error);
      toast.error('Failed to print receipt');
    } finally {
      setPrintLoading(false);
    }
    setActionMenuOpen(null);
  };

  const handleEditOrder = (order) => {
    const items = (order.items || []).map(item => ({
      menu_item_id: item.menu_item_id || item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      notes: item.notes || ''
    }));
    setEditItems(items);
    
    // Check if order has split payments
    const hasSplitPayment = (order.cash_amount > 0 && (order.card_amount > 0 || order.upi_amount > 0 || order.credit_amount > 0)) ||
                           (order.card_amount > 0 && (order.upi_amount > 0 || order.credit_amount > 0)) ||
                           (order.upi_amount > 0 && order.credit_amount > 0);
    
    setEditOrderModal({ 
      open: true, 
      order,
      customer_name: order.customer_name || '',
      customer_phone: order.customer_phone || '',
      payment_method: order.payment_method || 'cash',
      is_credit: order.is_credit || false,
      payment_received: order.payment_received || 0,
      balance_amount: order.balance_amount || 0,
      // Multi-payment fields
      cash_amount: order.cash_amount || 0,
      card_amount: order.card_amount || 0,
      upi_amount: order.upi_amount || 0,
      credit_amount: order.credit_amount || 0,
      use_split_payment: hasSplitPayment || order.payment_method === 'split'
    });
    setActionMenuOpen(null);
  };

  // Update order items
  const handleUpdateOrder = async () => {
    if (editItems.length === 0) {
      toast.error('Order must have at least one item');
      return;
    }

    // Validate customer name is required for credit bills
    if ((editOrderModal.is_credit || editOrderModal.credit_amount > 0) && !editOrderModal.customer_name?.trim()) {
      toast.error('Customer name is required for credit bills');
      return;
    }

    try {
      const subtotal = editItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const tax = subtotal * 0.05;
      const total = subtotal + tax;

      let paymentReceived, balanceAmount, isCredit, paymentMethod;
      let cashAmount = 0, cardAmount = 0, upiAmount = 0, creditAmount = 0;

      if (editOrderModal.use_split_payment) {
        // Multi-payment / Split payment mode
        cashAmount = parseFloat(editOrderModal.cash_amount) || 0;
        cardAmount = parseFloat(editOrderModal.card_amount) || 0;
        upiAmount = parseFloat(editOrderModal.upi_amount) || 0;
        creditAmount = parseFloat(editOrderModal.credit_amount) || 0;
        
        paymentReceived = cashAmount + cardAmount + upiAmount;
        balanceAmount = creditAmount;
        isCredit = creditAmount > 0;
        
        // Validate total matches
        const totalPaid = paymentReceived + creditAmount;
        if (Math.abs(totalPaid - total) > 0.01) {
          toast.error(`Payment total (₹${totalPaid.toFixed(2)}) doesn't match bill total (₹${total.toFixed(2)})`);
          return;
        }
        
        paymentMethod = 'split';
      } else {
        // Single payment mode
        paymentReceived = parseFloat(editOrderModal.payment_received) || 0;
        balanceAmount = Math.max(0, total - paymentReceived);
        isCredit = editOrderModal.is_credit || balanceAmount > 0;
        paymentMethod = editOrderModal.payment_method || 'cash';
        
        // Set single payment amounts
        if (paymentMethod === 'cash') cashAmount = paymentReceived;
        else if (paymentMethod === 'card') cardAmount = paymentReceived;
        else if (paymentMethod === 'upi') upiAmount = paymentReceived;
        else if (paymentMethod === 'credit') creditAmount = total;
      }

      await axios.put(`${API}/orders/${editOrderModal.order.id}`, {
        items: editItems,
        subtotal,
        tax,
        total,
        customer_name: editOrderModal.customer_name || '',
        customer_phone: editOrderModal.customer_phone || '',
        payment_method: paymentMethod,
        is_credit: isCredit,
        payment_received: paymentReceived,
        balance_amount: balanceAmount,
        cash_amount: cashAmount,
        card_amount: cardAmount,
        upi_amount: upiAmount,
        credit_amount: creditAmount
      });

      toast.success('Order updated!');
      setEditOrderModal({ 
        open: false, 
        order: null, 
        customer_name: '', 
        customer_phone: '', 
        payment_method: 'cash', 
        is_credit: false,
        payment_received: 0,
        balance_amount: 0,
        cash_amount: 0,
        card_amount: 0,
        upi_amount: 0,
        credit_amount: 0,
        use_split_payment: false
      });
      setEditItems([]);
      await fetchOrders();
    } catch (error) {
      console.error('Update order failed:', error);
      toast.error(error.response?.data?.detail || 'Failed to update order');
    }
  };

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

  const handleRemoveEditItem = (index) => {
    setEditItems(editItems.filter((_, i) => i !== index));
  };

  const handleEditQuantityChange = (index, quantity) => {
    if (quantity < 1) return;
    const updated = [...editItems];
    updated[index].quantity = quantity;
    setEditItems(updated);
  };

  const handleCancelOrder = async () => {
    if (!cancelConfirmModal.order?.id) return;
    try {
      await axios.put(`${API}/orders/${cancelConfirmModal.order.id}/cancel`);
      toast.success('Order cancelled');
      setCancelConfirmModal({ open: false, order: null });
      await Promise.all([fetchOrders(), fetchTables()]);
    } catch (error) {
      console.error('Cancel order failed:', error);
      toast.error(error.response?.data?.detail || 'Failed to cancel order');
    }
  };

  const handleDeleteOrder = async () => {
    if (!deleteConfirmModal.order?.id) return;
    try {
      await axios.delete(`${API}/orders/${deleteConfirmModal.order.id}`);
      toast.success('Order deleted');
      setDeleteConfirmModal({ open: false, order: null });
      await Promise.all([fetchOrders(), fetchTables()]);
    } catch (error) {
      console.error('Delete order failed:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete order');
    }
  };

  // Mark order as credit (unpaid)
  const handleMarkAsCredit = async (order) => {
    if (!order?.id) return;
    
    // Check if customer name exists
    if (!order.customer_name?.trim()) {
      toast.error('Customer name is required for credit bills. Please edit the order first.');
      setActionMenuOpen(null);
      return;
    }
    
    try {
      await axios.put(`${API}/orders/${order.id}`, {
        is_credit: true,
        payment_method: 'credit',
        payment_received: 0,
        balance_amount: order.total
      });
      toast.success('Marked as credit bill');
      setActionMenuOpen(null);
      await fetchOrders();
    } catch (error) {
      console.error('Mark as credit failed:', error);
      toast.error(error.response?.data?.detail || 'Failed to mark as credit');
    }
  };

  // Mark credit bill as paid
  const handleMarkAsPaid = async (order) => {
    if (!order?.id) return;
    try {
      await axios.put(`${API}/orders/${order.id}`, {
        is_credit: false,
        payment_method: 'cash',
        payment_received: order.total,
        balance_amount: 0
      });
      toast.success('Marked as paid');
      setActionMenuOpen(null);
      await fetchOrders();
    } catch (error) {
      console.error('Mark as paid failed:', error);
      toast.error(error.response?.data?.detail || 'Failed to mark as paid');
    }
  };

  // Get available tables for selection
  const availableTables = tables.filter(t => t.status === 'available');

  return (
    <Layout user={user}>
      {/* Full-screen Menu Selection Page (Step 2) */}
      {showMenuPage && (
        <div className="fixed inset-0 z-50 bg-gray-50">
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white p-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { setShowMenuPage(false); resetForm(); }}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h1 className="text-lg font-bold">Select Items</h1>
                    <p className="text-xs text-white/80">
                      {formData.table_id ? `Table ${tables.find(t => t.id === formData.table_id)?.table_number || ''}` : 'Counter'}
                      {formData.customer_name && ` • ${formData.customer_name}`}
                    </p>
                  </div>
                </div>
                {selectedItems.length > 0 && (
                  <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
                    <ShoppingCart className="w-4 h-4" />
                    <span className="font-bold">{selectedItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Search and Categories */}
            <div className="bg-white border-b p-3 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search menu items..."
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  className="pl-11 h-12 text-base"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      activeCategory === cat
                        ? 'bg-violet-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat === 'all' ? 'All Items' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Grid - Full screen scrollable */}
            <div className="flex-1 overflow-y-auto p-3 pb-36">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
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
                        onClick={() => quantity === 0 && handleAddItem(item)}
                        className={`relative p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer select-none active:scale-95 ${
                          quantity > 0 
                            ? 'border-violet-500 bg-gradient-to-br from-violet-50 to-purple-50 shadow-lg shadow-violet-100' 
                            : 'border-gray-100 bg-white hover:border-violet-300 hover:shadow-lg hover:shadow-violet-50 active:bg-violet-50'
                        }`}
                      >
                        {/* Quantity Badge */}
                        {quantity > 0 && (
                          <div className="absolute -top-2.5 -right-2.5 w-8 h-8 bg-gradient-to-br from-violet-600 to-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg animate-bounce-in">
                            {quantity}
                          </div>
                        )}
                        
                        {/* Item Info */}
                        <div className="mb-2">
                          <p className="font-semibold text-sm line-clamp-2 leading-tight">{item.name}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{item.category}</p>
                        </div>
                        
                        {/* Price */}
                        <p className="text-lg font-bold text-violet-600 mb-2">₹{item.price}</p>
                        
                        {/* Add/Quantity Controls */}
                        {quantity === 0 ? (
                          <div className="flex items-center justify-center gap-1 py-2 bg-violet-100 rounded-lg text-violet-700 font-medium text-sm">
                            <Plus className="w-4 h-4" />
                            <span>Add</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between bg-violet-100 rounded-lg p-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                const idx = selectedItems.findIndex(si => si.menu_item_id === item.id);
                                if (quantity === 1) {
                                  handleRemoveItem(idx);
                                } else {
                                  playSound('remove');
                                  handleQuantityChange(idx, quantity - 1);
                                }
                              }}
                              className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm text-violet-600 font-bold active:scale-90 transition-transform"
                            >
                              −
                            </button>
                            <span className="font-bold text-violet-700 text-lg min-w-[2rem] text-center">{quantity}</span>
                            <button
                              onClick={() => {
                                playSound('add');
                                const idx = selectedItems.findIndex(si => si.menu_item_id === item.id);
                                handleQuantityChange(idx, quantity + 1);
                              }}
                              className="w-8 h-8 flex items-center justify-center bg-violet-600 rounded-md shadow-sm text-white font-bold active:scale-90 transition-transform"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
              
              {/* Empty State */}
              {menuItems.filter(item => {
                const matchesSearch = item.name.toLowerCase().includes(menuSearch.toLowerCase());
                const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
                return matchesSearch && matchesCategory;
              }).length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-lg font-medium">No items found</p>
                  <p className="text-sm mt-1">Try a different search or category</p>
                </div>
              )}
            </div>

            {/* Fixed Bottom Cart Summary - Enhanced */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-violet-200 shadow-2xl z-[60] safe-area-bottom">
              {selectedItems.length > 0 ? (
                <div className="p-3">
                  {/* Compact items list */}
                  <div className="max-h-28 overflow-y-auto space-y-1 mb-3 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-2">
                    {selectedItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm bg-white/80 rounded-lg px-2 py-1.5">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="w-6 h-6 bg-violet-600 text-white rounded-full flex items-center justify-center text-xs font-bold">{item.quantity}</span>
                          <span className="truncate font-medium">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="font-bold text-violet-600">₹{(item.price * item.quantity).toFixed(0)}</span>
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="w-6 h-6 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Total and Create Order */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl flex items-center justify-center">
                        <ShoppingCart className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{selectedItems.reduce((sum, item) => sum + item.quantity, 0)} items</p>
                        <p className="text-2xl font-bold text-violet-600">
                          ₹{selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(0)}
                        </p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => {
                        playSound('success');
                        handleSubmitOrder();
                      }}
                      disabled={loading || selectedItems.length === 0}
                      className="bg-gradient-to-r from-violet-600 to-purple-600 h-14 px-6 text-base font-bold shadow-xl shadow-violet-200 disabled:opacity-50 active:scale-95 transition-transform"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                          Creating...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5" />
                          Create Order
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-gray-400">
                    <ShoppingCart className="w-5 h-5" />
                    <p>Tap items to add to order</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4 sm:space-y-6" data-testid="orders-page">
        <TrialBanner user={user} />
        <div className="flex justify-between items-center flex-wrap gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Orders</h1>
            <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Manage restaurant orders</p>
          </div>
          {['admin', 'waiter', 'cashier'].includes(user?.role) && (
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-violet-600 to-purple-600 text-sm sm:text-base" data-testid="create-order-button">
                  <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">New Order</span>
                  <span className="sm:hidden">New</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md w-[95vw] p-0" data-testid="order-dialog">
                <DialogHeader className="p-4 sm:p-6 pb-2 sm:pb-4 border-b bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-t-lg">
                  <DialogTitle className="text-lg sm:text-xl">New Order</DialogTitle>
                </DialogHeader>
                
                {/* Customer Details Form */}
                <div className="p-4 sm:p-6 space-y-4">
                  {/* Table Selection */}
                  {businessSettings?.kot_mode_enabled !== false && (
                    <div>
                      <Label className="text-sm font-medium">Select Table *</Label>
                      <select
                        className="w-full px-3 py-3 text-base border-2 rounded-xl mt-2 bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                        value={formData.table_id}
                        onChange={(e) => setFormData({ ...formData, table_id: e.target.value })}
                        data-testid="order-table-select"
                      >
                        <option value="">Choose a table...</option>
                        {availableTables.map(table => (
                          <option key={table.id} value={table.id}>Table {table.table_number} (Seats {table.capacity})</option>
                        ))}
                      </select>
                      {availableTables.length === 0 && (
                        <p className="text-xs text-orange-600 mt-1">No tables available. All tables are occupied.</p>
                      )}
                    </div>
                  )}
                  
                  {/* Customer Name */}
                  <div>
                    <Label className="text-sm font-medium">Customer Name</Label>
                    <Input
                      value={formData.customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      placeholder="Enter customer name"
                      className="mt-2 h-12 text-base"
                    />
                  </div>
                  
                  {/* Phone */}
                  <div>
                    <Label className="text-sm font-medium">Phone (for WhatsApp updates)</Label>
                    <Input
                      value={formData.customer_phone}
                      onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                      placeholder="+91 9876543210"
                      className="mt-2 h-12 text-base"
                    />
                  </div>
                  
                  {/* Next Button */}
                  <div className="pt-4 flex gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => { setDialogOpen(false); resetForm(); }}
                      className="flex-1 h-12"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => {
                        // Validate table selection if KOT mode is enabled
                        if (businessSettings?.kot_mode_enabled !== false && !formData.table_id) {
                          toast.error('Please select a table');
                          return;
                        }
                        setDialogOpen(false);
                        setShowMenuPage(true);
                      }}
                      className="flex-1 h-12 bg-gradient-to-r from-violet-600 to-purple-600 text-base font-semibold"
                    >
                      Next: Add Items →
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Tabs for Active Orders and Today's Bills */}
        <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'active'
                ? 'bg-white text-violet-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            Active Orders
            <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'active' ? 'bg-violet-100 text-violet-700' : 'bg-gray-200'}`}>
              {orders.filter(o => !['completed', 'cancelled'].includes(o.status)).length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'history'
                ? 'bg-white text-violet-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            Today's Bills
            <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'history' ? 'bg-violet-100 text-violet-700' : 'bg-gray-200'}`}>
              {orders.filter(o => ['completed', 'cancelled'].includes(o.status)).length}
            </span>
          </button>
        </div>

        {/* Active Orders Tab */}
        {activeTab === 'active' && (
          <div className="grid gap-3 sm:gap-4">
            {orders.filter(order => !['completed', 'cancelled'].includes(order.status)).length === 0 && (
              <Card className="p-8 text-center border-2 border-dashed border-gray-200">
                <div className="text-4xl mb-3">🍽️</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-1">No Active Orders</h3>
                <p className="text-gray-500 text-sm">All tables are clear. Create a new order to get started!</p>
              </Card>
            )}
            {orders.filter(order => !['completed', 'cancelled'].includes(order.status)).map((order) => {
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
        </div>
        )}

        {/* Today's Bills Tab (Completed & Cancelled) */}
        {activeTab === 'history' && (
          <div className="grid gap-3 sm:gap-4">
            {orders.filter(order => ['completed', 'cancelled'].includes(order.status)).length === 0 && (
              <Card className="p-8 text-center border-2 border-dashed border-gray-200">
                <div className="text-4xl mb-3">📋</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-1">No Bills Today</h3>
                <p className="text-gray-500 text-sm">Completed and cancelled orders will appear here</p>
              </Card>
            )}
            {orders.filter(order => ['completed', 'cancelled'].includes(order.status)).map((order) => {
              const statusConfig = {
                completed: { bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-100 text-green-700', icon: '✅' },
                cancelled: { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-600', icon: '❌' }
              };
              const config = statusConfig[order.status] || statusConfig.completed;
              
              return (
                <Card key={order.id} className={`border-2 ${config.border} ${config.bg} shadow-sm hover:shadow-md transition-all overflow-hidden`}>
                  <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{config.icon}</span>
                          <CardTitle className="text-base sm:text-lg font-bold">Bill #{order.id.slice(0, 8)}</CardTitle>
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
                          <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            {order.customer_name}
                            {order.customer_phone && <span className="text-gray-400"> • {order.customer_phone}</span>}
                          </p>
                        )}
                        <p className="text-[10px] sm:text-xs text-gray-400 mt-1">
                          {new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          {order.is_credit || order.credit_amount > 0 ? (
                            <span className="ml-2 text-orange-600 font-medium">• ⚠️ Credit (₹{(order.balance_amount || order.credit_amount || 0).toFixed(0)} due)</span>
                          ) : order.payment_method === 'split' ? (
                            <span className="ml-2">• Split Payment</span>
                          ) : order.payment_method && (
                            <span className="ml-2">• Paid via {order.payment_method}</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {(order.is_credit || order.credit_amount > 0) && (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 shadow-sm">
                            Credit
                          </span>
                        )}
                        {order.payment_method === 'split' && !order.is_credit && !order.credit_amount && (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 shadow-sm">
                            Split
                          </span>
                        )}
                        <span className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap ${config.badge} shadow-sm`}>
                          {order.status}
                        </span>
                        {/* Action Menu for completed/cancelled orders */}
                        {['admin', 'cashier'].includes(user?.role) && (
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
                                <div className="absolute right-0 top-8 z-20 w-44 bg-white rounded-xl shadow-xl border py-1.5">
                                  <button
                                    onClick={() => handleViewOrder(order)}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors"
                                  >
                                    <Eye className="w-4 h-4 text-gray-600" />
                                    <span>View Details</span>
                                  </button>
                                  <button
                                    onClick={() => handlePrintReceipt(order)}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors"
                                  >
                                    <Receipt className="w-4 h-4 text-gray-600" />
                                    <span>Print Receipt</span>
                                  </button>
                                  {order.status === 'completed' && !order.is_credit && (
                                    <button
                                      onClick={() => handleMarkAsCredit(order)}
                                      className="w-full px-3 py-2 text-left text-sm hover:bg-orange-50 flex items-center gap-2 text-orange-600 transition-colors"
                                    >
                                      <Wallet className="w-4 h-4" />
                                      <span>Mark as Credit</span>
                                    </button>
                                  )}
                                  {order.status === 'completed' && order.is_credit && (
                                    <button
                                      onClick={() => handleMarkAsPaid(order)}
                                      className="w-full px-3 py-2 text-left text-sm hover:bg-green-50 flex items-center gap-2 text-green-600 transition-colors"
                                    >
                                      <DollarSign className="w-4 h-4" />
                                      <span>Mark as Paid</span>
                                    </button>
                                  )}
                                  {order.status === 'completed' && (
                                    <button
                                      onClick={() => handleEditOrder(order)}
                                      className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 flex items-center gap-2 transition-colors"
                                    >
                                      <Edit className="w-4 h-4 text-blue-600" />
                                      <span>Edit Bill</span>
                                    </button>
                                  )}
                                  {order.status === 'completed' && (
                                    <button
                                      onClick={() => { setCancelConfirmModal({ open: true, order }); setActionMenuOpen(null); }}
                                      className="w-full px-3 py-2 text-left text-sm hover:bg-orange-50 flex items-center gap-2 text-orange-600 transition-colors"
                                    >
                                      <Ban className="w-4 h-4" />
                                      <span>Cancel Bill</span>
                                    </button>
                                  )}
                                  {user?.role === 'admin' && (
                                    <button
                                      onClick={() => { setDeleteConfirmModal({ open: true, order }); setActionMenuOpen(null); }}
                                      className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-600 transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      <span>Delete Bill</span>
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
                      {/* Items - Compact view */}
                      <div className="bg-white/60 rounded-xl p-2.5 sm:p-3 space-y-1.5 max-h-24 overflow-y-auto">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs sm:text-sm">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span className="w-5 h-5 bg-violet-100 text-violet-700 rounded flex items-center justify-center text-xs font-bold flex-shrink-0">
                                {item.quantity}
                              </span>
                              <span className="truncate">{item.name}</span>
                            </div>
                            <span className="font-medium text-gray-700 ml-2 flex-shrink-0">₹{(item.price * item.quantity).toFixed(0)}</span>
                          </div>
                        ))}
                      </div>
                      
                      {/* Total */}
                      <div className="flex justify-between items-center pt-2 border-t border-dashed">
                        <span className="text-sm text-gray-600">Total</span>
                        <span className="text-xl font-bold text-violet-600">₹{order.total.toFixed(0)}</span>
                      </div>
                      
                      {/* Credit Bill Balance Info */}
                      {order.is_credit && (
                        <div className="flex justify-between items-center text-sm text-orange-600 font-medium">
                          <span>Balance Due</span>
                          <span>₹{(order.balance_amount || order.total).toFixed(0)}</span>
                        </div>
                      )}
                      
                      {/* Quick Actions */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewOrder(order)}
                          className="flex-1 text-xs h-9"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePrintReceipt(order)}
                          className="flex-1 text-xs h-9"
                        >
                          <Receipt className="w-3.5 h-3.5 mr-1" />
                          Print
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setWhatsappModal({ open: true, orderId: order.id, customerName: order.customer_name || '' });
                            setWhatsappPhone(order.customer_phone || '');
                          }}
                          className="flex-1 text-xs h-9"
                        >
                          <MessageCircle className="w-3.5 h-3.5 mr-1" />
                          Share
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

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
                  Order #{(viewOrderModal.order?.id || '').slice(0, 8)}
                </CardTitle>
                <p className="text-violet-100 text-xs sm:text-sm mt-1">
                  {viewOrderModal.order?.created_at ? new Date(viewOrderModal.order.created_at).toLocaleString() : ''}
                </p>
              </CardHeader>
              <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto flex-1">
                {/* Order Info */}
                <div className="grid grid-cols-2 gap-2 sm:gap-4 text-sm">
                  <div className="p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-xs">Table</p>
                    <p className="font-bold text-base sm:text-lg">{viewOrderModal.order?.table_number || 'Counter'}</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-xs">Status</p>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(viewOrderModal.order?.status)}`}>
                      {viewOrderModal.order?.status || 'unknown'}
                    </span>
                  </div>
                  {viewOrderModal.order?.customer_name && (
                    <div className="p-2 sm:p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-500 text-xs">Customer</p>
                      <p className="font-bold text-sm truncate">{viewOrderModal.order.customer_name}</p>
                    </div>
                  )}
                  <div className="p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-xs">Server</p>
                    <p className="font-bold text-sm truncate">{viewOrderModal.order?.waiter_name || 'N/A'}</p>
                  </div>
                </div>

                {/* Items */}
                <div className="border-t pt-3 sm:pt-4">
                  <h4 className="font-bold mb-2 sm:mb-3 text-sm sm:text-base">Order Items</h4>
                  <div className="space-y-1.5 sm:space-y-2 max-h-32 sm:max-h-40 overflow-y-auto">
                    {(viewOrderModal.order?.items || []).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{item.quantity}× {item.name}</p>
                          {item.notes && <p className="text-xs text-orange-600 truncate">Note: {item.notes}</p>}
                        </div>
                        <p className="font-bold text-sm ml-2 flex-shrink-0">₹{((item.price || 0) * (item.quantity || 0)).toFixed(0)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="border-t pt-3 sm:pt-4 space-y-1 sm:space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span className="font-medium">₹{(viewOrderModal.order?.subtotal || 0).toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm text-gray-600">
                    <span>Tax:</span>
                    <span>₹{(viewOrderModal.order?.tax || 0).toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-lg sm:text-xl font-bold text-violet-600 pt-2 border-t">
                    <span>Total:</span>
                    <span>₹{(viewOrderModal.order?.total || 0).toFixed(0)}</span>
                  </div>
                  {viewOrderModal.order?.payment_method && (
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-500">Payment:</span>
                      <span className="font-medium capitalize">{viewOrderModal.order.payment_method === 'split' ? 'Split Payment' : viewOrderModal.order.payment_method}</span>
                    </div>
                  )}
                  {/* Split Payment Breakdown */}
                  {viewOrderModal.order?.payment_method === 'split' && (
                    <div className="mt-2 p-2 bg-purple-50 rounded-lg space-y-1">
                      <p className="text-xs font-medium text-purple-700">Payment Breakdown:</p>
                      {viewOrderModal.order.cash_amount > 0 && (
                        <div className="flex justify-between text-xs">
                          <span>💵 Cash:</span>
                          <span>₹{viewOrderModal.order.cash_amount.toFixed(0)}</span>
                        </div>
                      )}
                      {viewOrderModal.order.card_amount > 0 && (
                        <div className="flex justify-between text-xs">
                          <span>💳 Card:</span>
                          <span>₹{viewOrderModal.order.card_amount.toFixed(0)}</span>
                        </div>
                      )}
                      {viewOrderModal.order.upi_amount > 0 && (
                        <div className="flex justify-between text-xs">
                          <span>📱 UPI:</span>
                          <span>₹{viewOrderModal.order.upi_amount.toFixed(0)}</span>
                        </div>
                      )}
                      {viewOrderModal.order.credit_amount > 0 && (
                        <div className="flex justify-between text-xs text-orange-600 font-medium">
                          <span>⚠️ Credit:</span>
                          <span>₹{viewOrderModal.order.credit_amount.toFixed(0)}</span>
                        </div>
                      )}
                    </div>
                  )}
                  {(viewOrderModal.order?.is_credit || viewOrderModal.order?.credit_amount > 0) && (
                    <>
                      <div className="flex justify-between text-xs sm:text-sm text-green-600">
                        <span>Amount Received:</span>
                        <span className="font-medium">₹{(viewOrderModal.order.payment_received || (viewOrderModal.order.cash_amount || 0) + (viewOrderModal.order.card_amount || 0) + (viewOrderModal.order.upi_amount || 0)).toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between text-xs sm:text-sm text-orange-600 font-medium">
                        <span>⚠️ Balance Due:</span>
                        <span>₹{(viewOrderModal.order.balance_amount || viewOrderModal.order.credit_amount || 0).toFixed(0)}</span>
                      </div>
                      <div className="text-xs text-orange-600 font-medium mt-1">⚠️ Credit Bill (Unpaid)</div>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4 border-t flex-wrap">
                  <Button
                    onClick={() => viewOrderModal.order && handlePrintReceipt(viewOrderModal.order)}
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
                      const orderId = viewOrderModal.order?.id;
                      const customerName = viewOrderModal.order?.customer_name || 'Guest';
                      setViewOrderModal({ open: false, order: null });
                      if (orderId) {
                        setWhatsappModal({ open: true, orderId, customerName });
                      }
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

        {/* Edit Order Modal - Improved UI/UX */}
        {editOrderModal.open && editOrderModal.order && (
          <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50">
            <Card className="w-full sm:max-w-lg border-0 shadow-2xl max-h-[85vh] sm:mx-4 sm:rounded-xl rounded-t-2xl rounded-b-none sm:rounded-b-xl overflow-hidden flex flex-col">
              {/* Header */}
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Edit className="w-4 h-4" />
                    Edit #{editOrderModal.order.id.slice(0, 8)}
                  </CardTitle>
                  <button
                    onClick={() => { setEditOrderModal({ open: false, order: null, customer_name: '', customer_phone: '', payment_method: 'cash', is_credit: false, payment_received: 0, balance_amount: 0 }); setEditItems([]); }}
                    className="p-1 hover:bg-white/20 rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </CardHeader>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto">
                {/* Customer - Compact */}
                <div className="p-3 border-b bg-gray-50">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px] text-gray-500">Name {editOrderModal.is_credit && <span className="text-red-500">*</span>}</Label>
                      <Input
                        value={editOrderModal.customer_name || ''}
                        onChange={(e) => setEditOrderModal({ ...editOrderModal, customer_name: e.target.value })}
                        placeholder="Customer"
                        className={`h-8 text-sm ${editOrderModal.is_credit && !editOrderModal.customer_name?.trim() ? 'border-red-400' : ''}`}
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-gray-500">Phone</Label>
                      <Input
                        value={editOrderModal.customer_phone || ''}
                        onChange={(e) => setEditOrderModal({ ...editOrderModal, customer_phone: e.target.value })}
                        placeholder="+91 9876543210"
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment - Compact */}
                <div className="p-3 border-b">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs font-medium">Payment</Label>
                    <button
                      onClick={() => {
                        const total = editItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 1.05;
                        if (editOrderModal.use_split_payment) {
                          setEditOrderModal({ ...editOrderModal, use_split_payment: false, payment_method: 'cash', payment_received: total, balance_amount: 0, cash_amount: 0, card_amount: 0, upi_amount: 0, credit_amount: 0, is_credit: false });
                        } else {
                          setEditOrderModal({ ...editOrderModal, use_split_payment: true, payment_method: 'split', cash_amount: 0, card_amount: 0, upi_amount: 0, credit_amount: 0 });
                        }
                      }}
                      className={`px-2 py-1 rounded-full text-[10px] font-medium ${editOrderModal.use_split_payment ? 'bg-purple-600 text-white' : 'bg-gray-100 hover:bg-purple-100'}`}
                    >
                      {editOrderModal.use_split_payment ? '✓ Split' : 'Split'}
                    </button>
                  </div>
                  
                  {!editOrderModal.use_split_payment ? (
                    <div className="flex gap-1.5">
                      {['cash', 'card', 'upi', 'credit'].map((method) => (
                        <button
                          key={method}
                          onClick={() => {
                            const total = editItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 1.05;
                            setEditOrderModal({ ...editOrderModal, payment_method: method, is_credit: method === 'credit', payment_received: method === 'credit' ? 0 : total, balance_amount: method === 'credit' ? total : 0 });
                          }}
                          className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium ${
                            editOrderModal.payment_method === method
                              ? method === 'credit' ? 'bg-orange-500 text-white' : 'bg-green-600 text-white'
                              : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                        >
                          {method === 'cash' && '💵'}
                          {method === 'card' && '💳'}
                          {method === 'upi' && '📱'}
                          {method === 'credit' && '⚠️'}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-purple-50 rounded-lg p-2 space-y-2">
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { key: 'cash_amount', label: '💵' },
                          { key: 'card_amount', label: '💳' },
                          { key: 'upi_amount', label: '📱' },
                          { key: 'credit_amount', label: '⚠️' }
                        ].map(({ key, label }) => (
                          <div key={key}>
                            <Label className="text-[9px] text-gray-500 block text-center">{label}</Label>
                            <Input
                              type="number"
                              value={editOrderModal[key] || ''}
                              onChange={(e) => setEditOrderModal({ ...editOrderModal, [key]: parseFloat(e.target.value) || 0, is_credit: key === 'credit_amount' ? parseFloat(e.target.value) > 0 : editOrderModal.is_credit })}
                              placeholder="0"
                              className={`h-7 text-xs text-center px-1 ${key === 'credit_amount' ? 'border-orange-300' : ''}`}
                              min="0"
                            />
                          </div>
                        ))}
                      </div>
                      {(() => {
                        const total = editItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 1.05;
                        const paid = (parseFloat(editOrderModal.cash_amount) || 0) + (parseFloat(editOrderModal.card_amount) || 0) + (parseFloat(editOrderModal.upi_amount) || 0);
                        const credit = parseFloat(editOrderModal.credit_amount) || 0;
                        const remaining = total - paid - credit;
                        return (
                          <div className="flex items-center justify-between text-[10px] pt-1 border-t border-purple-200">
                            <span>₹{total.toFixed(0)}</span>
                            <span className="text-green-600">Paid: ₹{paid.toFixed(0)}</span>
                            {credit > 0 && <span className="text-orange-600">Credit: ₹{credit.toFixed(0)}</span>}
                            <span className={remaining > 0.5 ? 'text-red-600 font-bold' : 'text-green-600'}>
                              {remaining > 0.5 ? `⚠️₹${remaining.toFixed(0)}` : '✓'}
                            </span>
                          </div>
                        );
                      })()}
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            const total = editItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 1.05;
                            const remaining = total - (parseFloat(editOrderModal.cash_amount) || 0) - (parseFloat(editOrderModal.card_amount) || 0) - (parseFloat(editOrderModal.upi_amount) || 0) - (parseFloat(editOrderModal.credit_amount) || 0);
                            if (remaining > 0) setEditOrderModal({ ...editOrderModal, cash_amount: (parseFloat(editOrderModal.cash_amount) || 0) + remaining });
                          }}
                          className="text-[9px] px-2 py-0.5 bg-white border rounded flex-1"
                        >
                          Fill Cash
                        </button>
                        <button
                          onClick={() => {
                            const total = editItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 1.05;
                            const remaining = total - (parseFloat(editOrderModal.cash_amount) || 0) - (parseFloat(editOrderModal.card_amount) || 0) - (parseFloat(editOrderModal.upi_amount) || 0) - (parseFloat(editOrderModal.credit_amount) || 0);
                            if (remaining > 0) setEditOrderModal({ ...editOrderModal, credit_amount: (parseFloat(editOrderModal.credit_amount) || 0) + remaining, is_credit: true });
                          }}
                          className="text-[9px] px-2 py-0.5 bg-orange-100 border-orange-300 border rounded text-orange-700 flex-1"
                        >
                          Fill Credit
                        </button>
                      </div>
                    </div>
                  )}
                  {editOrderModal.is_credit && !editOrderModal.customer_name?.trim() && (
                    <p className="text-[9px] text-red-500 mt-1">⚠️ Name required</p>
                  )}
                </div>

                {/* Add Items */}
                <div className="p-2 border-b bg-gray-50">
                  <Label className="text-[10px] text-gray-500 mb-1 block">Add Items</Label>
                  <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
                    {menuItems.slice(0, 8).map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleAddEditItem(item)}
                        className="flex-shrink-0 px-2 py-1 bg-white border rounded text-[10px] hover:border-blue-400 hover:bg-blue-50 whitespace-nowrap"
                      >
                        {item.name} ₹{item.price}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Items List */}
                <div className="p-2 min-h-[100px]">
                  {editItems.length > 0 ? (
                    <div className="space-y-1">
                      {editItems.map((item, index) => (
                        <div key={index} className="flex items-center gap-1.5 p-1.5 bg-gray-50 rounded">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{item.name}</p>
                          </div>
                          <button onClick={() => item.quantity === 1 ? handleRemoveEditItem(index) : handleEditQuantityChange(index, item.quantity - 1)} className="w-6 h-6 bg-gray-200 rounded text-xs">−</button>
                          <span className="w-5 text-center text-xs font-bold">{item.quantity}</span>
                          <button onClick={() => handleEditQuantityChange(index, item.quantity + 1)} className="w-6 h-6 bg-blue-600 text-white rounded text-xs">+</button>
                          <span className="w-12 text-right text-xs font-bold">₹{(item.price * item.quantity).toFixed(0)}</span>
                          <button onClick={() => handleRemoveEditItem(index)} className="text-red-400 p-0.5"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-400 text-xs">No items</div>
                  )}
                </div>
              </div>

              {/* Footer - Fixed */}
              <div className="border-t bg-white p-3 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-gray-400">{editItems.reduce((sum, item) => sum + item.quantity, 0)} items</p>
                    <p className="text-lg font-bold text-blue-600">₹{(editItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 1.05).toFixed(0)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setEditOrderModal({ open: false, order: null, customer_name: '', customer_phone: '', payment_method: 'cash', is_credit: false, payment_received: 0, balance_amount: 0 }); setEditItems([]); }}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleUpdateOrder} className="bg-blue-600 px-5" disabled={editItems.length === 0}>
                      Update
                    </Button>
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
