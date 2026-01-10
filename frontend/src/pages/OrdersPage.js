import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Plus, Eye, Printer, CreditCard, MessageCircle, X, Receipt, Search, Edit, Trash2, Ban, MoreVertical, AlertTriangle, ArrowLeft, ArrowRight, ShoppingCart, Clock, CheckCircle, Wallet, DollarSign } from 'lucide-react';
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
    use_split_payment: false,
    tax_rate: 5, // Tax rate for this order
    // Discount support
    discount_type: 'amount', // 'amount' or 'percent'
    discount_value: 0,
    // Manual item entry
    manual_item_name: '',
    manual_item_price: ''
  });
  const [editItems, setEditItems] = useState([]);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({ open: false, order: null });
  const [cancelConfirmModal, setCancelConfirmModal] = useState({ open: false, order: null });
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  // State for 2-step order flow
  const [showMenuPage, setShowMenuPage] = useState(false);
  // Cart expanded state for drag-up
  const [cartExpanded, setCartExpanded] = useState(false);
  // Skip customer prompt preference (stored in localStorage)
  const [skipCustomerPrompt, setSkipCustomerPrompt] = useState(() => {
    return localStorage.getItem('skipCustomerPrompt') === 'true';
  });
  // Tab state for Active Orders vs Today's Bills
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'history'
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const dataLoadedRef = useRef(false);

  // Helper function to check if order is from today (using IST timezone)
  const isToday = (dateString) => {
    if (!dateString) return false;
    
    try {
      const orderDate = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(orderDate.getTime())) {
        console.warn('Invalid date string:', dateString);
        return false;
      }
      
      const now = new Date();
      
      // Get IST date strings for comparison
      // IST is UTC+5:30, so we use 'Asia/Kolkata' timezone
      const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' };
      const orderDateIST = orderDate.toLocaleDateString('en-CA', options); // YYYY-MM-DD format
      const todayIST = now.toLocaleDateString('en-CA', options);
      
      return orderDateIST === todayIST;
    } catch (error) {
      console.warn('Error checking if date is today:', error, dateString);
      return false;
    }
  };

  // Get unique categories from menu items
  const categories = ['all', ...new Set(menuItems.map(item => item.category).filter(Boolean))];

  useEffect(() => {
    if (!dataLoadedRef.current) {
      dataLoadedRef.current = true;
      loadInitialData();
    }
  }, []);

  // Add real-time polling for active orders (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'active') {
        fetchOrders(); // Refresh orders when viewing active tab
      }
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [activeTab]);

  const loadInitialData = async () => {
    try {
      // Load critical data first (orders and tables), then secondary data
      const [ordersRes, tablesRes] = await Promise.all([
        axios.get(`${API}/orders`).catch(() => ({ data: [] })),
        axios.get(`${API}/tables`).catch(() => ({ data: [] }))
      ]);
      
      // Process orders data
      const ordersData = Array.isArray(ordersRes.data) ? ordersRes.data : [];
      const validOrders = ordersData.filter(order => {
        return order && order.id && order.created_at && order.status && typeof order.total === 'number';
      }).map(order => ({
        ...order,
        customer_name: order.customer_name || '',
        table_number: order.table_number || 0,
        payment_method: order.payment_method || 'cash',
        created_at: order.created_at || new Date().toISOString()
      }));
      
      // Process tables data
      const tablesData = Array.isArray(tablesRes.data) ? tablesRes.data : [];
      const validTables = tablesData.filter(table => {
        return table && table.id && typeof table.table_number === 'number';
      });
      
      setOrders(validOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      setTables(validTables);
      
      // Load secondary data in background
      Promise.all([
        axios.get(`${API}/menu`).catch(() => ({ data: [] })),
        axios.get(`${API}/business/settings`).catch(() => ({ data: { business_settings: {} } }))
      ]).then(([menuRes, settingsRes]) => {
        const items = Array.isArray(menuRes.data) ? menuRes.data : [];
        setMenuItems(items.filter(item => item.available));
        setBusinessSettings(settingsRes.data.business_settings || {});
      });
      
    } catch (error) {
      console.error('Failed to load initial data', error);
      // Set empty defaults to prevent crashes
      setOrders([]);
      setTables([]);
      setMenuItems([]);
      setBusinessSettings({});
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API}/orders`);
      const ordersData = Array.isArray(response.data) ? response.data : [];
      
      // Validate and clean order data
      const validOrders = ordersData.filter(order => {
        // Ensure order has required fields
        return order && 
               order.id && 
               order.created_at && 
               order.status && 
               typeof order.total === 'number' &&
               Array.isArray(order.items);
      }).map(order => ({
        ...order,
        // Ensure all required fields have default values
        customer_name: order.customer_name || '',
        table_number: order.table_number || 0,
        payment_method: order.payment_method || 'cash',
        payment_received: order.payment_received || 0,
        balance_amount: order.balance_amount || 0,
        is_credit: order.is_credit || false,
        // Ensure date is valid
        created_at: order.created_at || new Date().toISOString()
      }));
      
      setOrders(validOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (error) {
      console.error('Failed to fetch orders', error);
      setOrders([]);
      // Show user-friendly error
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
      } else if (error.response?.status >= 500) {
        toast.error('Server error. Please try again later.');
      }
    }
  };

  const fetchTables = async () => {
    try {
      const response = await axios.get(`${API}/tables`);
      const tablesData = Array.isArray(response.data) ? response.data : [];
      
      // Validate and clean table data
      const validTables = tablesData.filter(table => {
        return table && table.id && typeof table.table_number === 'number';
      }).map(table => ({
        ...table,
        status: table.status || 'available',
        capacity: table.capacity || 4,
        current_order_id: table.current_order_id || null
      }));
      
      setTables(validTables);
    } catch (error) {
      console.error('Failed to fetch tables', error);
      setTables([]);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
      }
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
      // Use "Cash Sale" if no customer name provided (for counter sales)
      const customerName = formData.customer_name?.trim() || (businessSettings?.kot_mode_enabled === false ? 'Cash Sale' : '');
      
      const response = await axios.post(`${API}/orders`, {
        table_id: formData.table_id || null,
        table_number: selectedTable?.table_number || 0,
        items: selectedItems,
        customer_name: customerName,
        customer_phone: formData.customer_phone || '',
        frontend_origin: window.location.origin
      });
      
      toast.success('Order created successfully!');
      setShowMenuPage(false);
      setCartExpanded(false);
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
      use_split_payment: hasSplitPayment || order.payment_method === 'split',
      // Use order's stored tax_rate, fallback to business settings
      // If order has tax > 0 but no tax_rate, calculate it from tax/subtotal
      tax_rate: (() => {
        if (order.tax_rate !== undefined && order.tax_rate !== null) return order.tax_rate;
        if (order.tax > 0 && order.subtotal > 0) {
          return Math.round((order.tax / order.subtotal) * 100);
        }
        return businessSettings?.tax_rate ?? 5;
      })(),
      // Discount fields - load properly based on what was saved
      // If discount_value exists, use it with its type
      // Otherwise, load discount_amount as 'amount' type
      discount_type: order.discount_type || 'amount',
      discount_value: (() => {
        // If discount_value was saved (the input value), use it
        if (order.discount_value !== undefined && order.discount_value !== null && order.discount_value > 0) {
          return order.discount_value;
        }
        // Otherwise use the calculated discount amount
        return order.discount_amount || order.discount || 0;
      })(),
      // Manual item entry
      manual_item_name: '',
      manual_item_price: ''
    });
    setActionMenuOpen(null);
  };

  // Add manual item (not from menu)
  const handleAddManualItem = () => {
    const name = editOrderModal.manual_item_name?.trim();
    const price = parseFloat(editOrderModal.manual_item_price) || 0;
    
    if (!name) {
      toast.error('Enter item name');
      return;
    }
    if (price <= 0) {
      toast.error('Enter valid price');
      return;
    }
    
    setEditItems([...editItems, {
      menu_item_id: `manual_${Date.now()}`,
      name: name,
      price: price,
      quantity: 1,
      notes: 'Manual entry'
    }]);
    
    setEditOrderModal({ 
      ...editOrderModal, 
      manual_item_name: '', 
      manual_item_price: '' 
    });
    toast.success(`Added: ${name}`);
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
      
      // Calculate discount
      let discountAmount = 0;
      const discountValue = parseFloat(editOrderModal.discount_value) || 0;
      if (discountValue > 0) {
        if (editOrderModal.discount_type === 'percent') {
          discountAmount = (subtotal * discountValue) / 100;
        } else {
          discountAmount = discountValue;
        }
      }
      
      // Subtotal after discount
      const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
      
      // Use the tax_rate from the edit modal (can be changed by user)
      const orderTaxRate = editOrderModal.tax_rate ?? editOrderModal.order?.tax_rate ?? businessSettings?.tax_rate ?? 5;
      const taxRate = orderTaxRate / 100;
      const tax = subtotalAfterDiscount * taxRate;
      const total = subtotalAfterDiscount + tax;

      let paymentReceived, balanceAmount, isCredit, paymentMethod;
      let cashAmount = 0, cardAmount = 0, upiAmount = 0, creditAmount = 0;

      if (editOrderModal.use_split_payment) {
        // Multi-payment / Split payment mode
        cashAmount = parseFloat(editOrderModal.cash_amount) || 0;
        cardAmount = parseFloat(editOrderModal.card_amount) || 0;
        upiAmount = parseFloat(editOrderModal.upi_amount) || 0;
        creditAmount = parseFloat(editOrderModal.credit_amount) || 0;
        
        // Calculate what's been entered
        const totalEntered = cashAmount + cardAmount + upiAmount + creditAmount;
        
        // If total entered doesn't match bill total, auto-adjust
        // This handles cases where discount was added after payment amounts were set
        if (Math.abs(totalEntered - total) > 0.01) {
          // Auto-adjust: put the difference in cash (or reduce cash if discount added)
          const difference = total - (cardAmount + upiAmount + creditAmount);
          if (difference >= 0) {
            cashAmount = difference;
          } else {
            // If other payments exceed total, reduce credit first, then others
            const excess = -difference;
            if (creditAmount >= excess) {
              creditAmount -= excess;
            } else {
              // Just set cash to 0 and let user fix
              cashAmount = 0;
              toast.info('Payment amounts adjusted. Please verify split amounts.');
            }
          }
        }
        
        paymentReceived = cashAmount + cardAmount + upiAmount;
        balanceAmount = creditAmount;
        isCredit = creditAmount > 0;
        
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
        subtotal: subtotalAfterDiscount,
        tax,
        tax_rate: orderTaxRate, // Store the tax rate used
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
        credit_amount: creditAmount,
        // Discount fields
        discount: discountAmount,
        discount_type: editOrderModal.discount_type || 'amount',
        discount_value: discountValue,
        discount_amount: discountAmount
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
        use_split_payment: false,
        tax_rate: 5,
        discount_type: 'amount',
        discount_value: 0,
        manual_item_name: '',
        manual_item_price: ''
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
        <div className="fixed inset-0 z-50 bg-gray-100">
          <div className="h-full flex flex-col">
            {/* Header - Clean Design */}
            <div className="bg-violet-600 text-white px-4 py-3 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { setShowMenuPage(false); resetForm(); }}
                    className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-lg"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h1 className="text-lg font-bold">Add Items</h1>
                    <p className="text-sm text-white/80">
                      {formData.table_id ? `Table ${tables.find(t => t.id === formData.table_id)?.table_number || ''}` : 'Counter Order'}
                      {formData.customer_name && ` • ${formData.customer_name}`}
                    </p>
                  </div>
                </div>
                {selectedItems.length > 0 && (
                  <div className="flex items-center gap-2 bg-white text-violet-600 px-3 py-2 rounded-lg">
                    <ShoppingCart className="w-4 h-4" />
                    <span className="font-bold text-lg">{selectedItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Search and Categories - Enhanced */}
            <div className="bg-white px-3 py-2 border-b border-gray-100">
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search items..."
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  className="pl-9 h-10 text-sm rounded-full border-gray-200 focus:border-violet-400 bg-gray-50 focus:bg-white"
                />
                {menuSearch && (
                  <button 
                    onClick={() => setMenuSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center text-white hover:bg-gray-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                      activeCategory === cat
                        ? 'bg-violet-600 text-white'
                        : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                    }`}
                  >
                    {cat === 'all' ? '🍽️ All' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Grid - Enhanced Round Plate Style */}
            <div className="flex-1 overflow-y-auto px-2 py-2 bg-gray-50" style={{ paddingBottom: '160px' }}>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                {menuItems
                  .filter(item => {
                    const matchesSearch = item.name.toLowerCase().includes(menuSearch.toLowerCase());
                    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
                    return matchesSearch && matchesCategory;
                  })
                  .map(item => {
                    const selectedItem = selectedItems.find(si => si.menu_item_id === item.id);
                    const quantity = selectedItem?.quantity || 0;
                    
                    // Generate consistent color based on item name
                    const colors = ['bg-rose-50', 'bg-orange-50', 'bg-amber-50', 'bg-lime-50', 'bg-emerald-50', 'bg-cyan-50', 'bg-blue-50', 'bg-violet-50', 'bg-pink-50'];
                    const colorIndex = item.name.charCodeAt(0) % colors.length;
                    const bgColor = colors[colorIndex];
                    
                    return (
                      <div
                        key={item.id}
                        className="flex flex-col items-center py-1"
                      >
                        {/* Round Plate with tap animation */}
                        <div
                          onClick={() => {
                            if (quantity === 0) {
                              handleAddItem(item);
                            } else {
                              playSound('add');
                              const idx = selectedItems.findIndex(si => si.menu_item_id === item.id);
                              handleQuantityChange(idx, quantity + 1);
                            }
                          }}
                          className={`relative w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-full cursor-pointer select-none transition-transform duration-150 active:scale-90 ${
                            quantity > 0 ? 'ring-2 ring-violet-500 ring-offset-1' : ''
                          }`}
                        >
                          {/* Plate Background */}
                          {item.image_url ? (
                            <img 
                              src={item.image_url} 
                              alt={item.name}
                              className="w-full h-full rounded-full object-cover border-3 border-white shadow-md"
                              loading="lazy"
                            />
                          ) : (
                            <div className={`w-full h-full rounded-full border-3 border-white shadow-md flex items-center justify-center ${bgColor}`}>
                              <span className="text-2xl sm:text-3xl">
                                {item.category?.toLowerCase().includes('beverage') ? '🥤' :
                                 item.category?.toLowerCase().includes('snack') ? '🍟' :
                                 item.category?.toLowerCase().includes('pizza') ? '🍕' :
                                 item.category?.toLowerCase().includes('burger') ? '🍔' :
                                 item.category?.toLowerCase().includes('rice') ? '🍚' :
                                 item.category?.toLowerCase().includes('noodle') ? '🍜' :
                                 item.category?.toLowerCase().includes('soup') ? '🍲' :
                                 item.category?.toLowerCase().includes('dessert') ? '🍰' :
                                 item.category?.toLowerCase().includes('ice') ? '🍨' :
                                 item.category?.toLowerCase().includes('coffee') ? '☕' :
                                 item.category?.toLowerCase().includes('tea') ? '🍵' :
                                 item.category?.toLowerCase().includes('juice') ? '🧃' :
                                 item.category?.toLowerCase().includes('salad') ? '🥗' :
                                 item.category?.toLowerCase().includes('sandwich') ? '🥪' :
                                 item.category?.toLowerCase().includes('chicken') ? '🍗' :
                                 item.category?.toLowerCase().includes('fish') ? '🐟' :
                                 item.category?.toLowerCase().includes('egg') ? '🍳' :
                                 item.category?.toLowerCase().includes('bread') ? '🍞' :
                                 '🍽️'}
                              </span>
                            </div>
                          )}
                          
                          {/* Quantity Badge */}
                          {quantity > 0 && (
                            <div className="absolute -top-0.5 -right-0.5 w-6 h-6 bg-violet-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow border-2 border-white animate-bounce-once">
                              {quantity}
                            </div>
                          )}
                          
                          {/* Tap indicator for unselected */}
                          {quantity === 0 && (
                            <div className="absolute bottom-0 right-0 w-5 h-5 bg-violet-600 rounded-full flex items-center justify-center shadow border border-white">
                              <Plus className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        
                        {/* Quantity Controls (when selected) */}
                        {quantity > 0 && (
                          <div className="flex items-center gap-0.5 mt-0.5 bg-white rounded-full shadow-sm border border-gray-100 px-0.5 py-0.5" onClick={(e) => e.stopPropagation()}>
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
                              className="w-6 h-6 flex items-center justify-center bg-red-50 text-red-500 rounded-full text-sm font-bold active:scale-90"
                            >
                              −
                            </button>
                            <button
                              onClick={() => {
                                playSound('add');
                                const idx = selectedItems.findIndex(si => si.menu_item_id === item.id);
                                handleQuantityChange(idx, quantity + 1);
                              }}
                              className="w-6 h-6 flex items-center justify-center bg-violet-600 rounded-full text-white text-sm font-bold active:scale-90"
                            >
                              +
                            </button>
                          </div>
                        )}
                        
                        {/* Item Name & Price - Compact */}
                        <p className="text-[10px] font-medium text-gray-600 text-center mt-0.5 line-clamp-1 w-full leading-tight">{item.name}</p>
                        <p className="text-xs font-bold text-violet-600">₹{item.price}</p>
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
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-lg font-semibold text-gray-700">No items found</p>
                  <p className="text-gray-500 mt-1 text-sm">Try a different search or category</p>
                  <button 
                    onClick={() => { setMenuSearch(''); setActiveCategory('all'); }}
                    className="mt-4 px-5 py-2 bg-violet-100 text-violet-600 rounded-lg font-medium hover:bg-violet-200 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>

            {/* Fixed Bottom Cart - Expandable Drag-Up Design */}
            <div 
              className={`fixed left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-[60] transition-all duration-300 ease-out ${
                cartExpanded ? 'bottom-0 rounded-t-2xl' : 'bottom-16'
              }`}
              style={{ maxHeight: cartExpanded ? '70vh' : 'auto' }}
            >
              {selectedItems.length > 0 ? (
                <div className="flex flex-col h-full">
                  {/* Drag Handle - Tap to expand/collapse */}
                  <button 
                    onClick={() => setCartExpanded(!cartExpanded)}
                    className="w-full py-2 flex flex-col items-center"
                  >
                    <div className="w-10 h-1 bg-gray-300 rounded-full mb-1"></div>
                    <p className="text-[10px] text-gray-400">
                      {cartExpanded ? 'Tap to minimize' : 'Tap to see all items'}
                    </p>
                  </button>
                  
                  {/* Expanded View - Full Item List */}
                  {cartExpanded ? (
                    <div className="flex-1 overflow-y-auto px-3 pb-2" style={{ maxHeight: 'calc(70vh - 120px)' }}>
                      <div className="space-y-2">
                        {selectedItems.map((item, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 rounded-xl p-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span className="w-8 h-8 bg-violet-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">{item.quantity}</span>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-gray-800 text-sm truncate">{item.name}</p>
                                <p className="text-xs text-gray-500">₹{item.price} each</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <div className="flex items-center gap-1 bg-white rounded-full border px-1 py-0.5">
                                <button
                                  onClick={() => {
                                    if (item.quantity === 1) {
                                      handleRemoveItem(index);
                                    } else {
                                      playSound('remove');
                                      handleQuantityChange(index, item.quantity - 1);
                                    }
                                  }}
                                  className="w-6 h-6 flex items-center justify-center bg-red-50 text-red-500 rounded-full text-sm font-bold"
                                >
                                  −
                                </button>
                                <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                                <button
                                  onClick={() => {
                                    playSound('add');
                                    handleQuantityChange(index, item.quantity + 1);
                                  }}
                                  className="w-6 h-6 flex items-center justify-center bg-violet-600 text-white rounded-full text-sm font-bold"
                                >
                                  +
                                </button>
                              </div>
                              <span className="font-bold text-violet-600 w-16 text-right">₹{(item.price * item.quantity).toFixed(0)}</span>
                              <button onClick={() => handleRemoveItem(index)} className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                                <X className="w-3 h-3 text-red-500" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Collapsed View - Horizontal scroll */
                    <div className="flex gap-1.5 px-2 pb-2 overflow-x-auto scrollbar-hide">
                      {selectedItems.map((item, index) => (
                        <div key={index} className="flex items-center gap-1.5 bg-violet-50 border border-violet-100 rounded-full pl-1 pr-2 py-1 flex-shrink-0">
                          <span className="w-5 h-5 bg-violet-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">{item.quantity}</span>
                          <span className="text-[11px] font-medium text-gray-700 max-w-[60px] truncate">{item.name}</span>
                          <span className="text-[11px] font-bold text-violet-600">₹{(item.price * item.quantity).toFixed(0)}</span>
                          <button onClick={() => handleRemoveItem(index)} className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center">
                            <X className="w-2.5 h-2.5 text-red-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Total Bar - Always visible */}
                  <div className={`flex items-center justify-between bg-violet-600 mx-2 mb-2 rounded-xl px-3 py-2 ${cartExpanded ? 'mb-4' : ''}`}>
                    <div className="flex items-center gap-2 text-white">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <ShoppingCart className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] text-violet-200">{selectedItems.reduce((sum, item) => sum + item.quantity, 0)} items</p>
                        <p className="text-base font-bold leading-tight">₹{selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(0)}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => { playSound('success'); handleSubmitOrder(); }}
                      disabled={loading || selectedItems.length === 0}
                      className="bg-white text-violet-600 font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 disabled:opacity-50 active:scale-95 transition-transform text-sm"
                    >
                      {loading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin"></span>
                          Wait
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Create
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-3 text-center">
                  <p className="text-gray-400 text-sm">👆 Tap items to add</p>
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
            <>
              {/* New Order Button - Unified for both KOT modes */}
              <Button 
                onClick={() => {
                  // KOT disabled + skip prompt = go directly to menu
                  if (businessSettings?.kot_mode_enabled === false && skipCustomerPrompt) {
                    setFormData({ table_id: '', customer_name: '', customer_phone: '' });
                    setShowMenuPage(true);
                  } else {
                    setDialogOpen(true);
                  }
                }}
                className="bg-violet-600 hover:bg-violet-700 text-sm sm:text-base" 
                data-testid="create-order-button"
              >
                <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">New Order</span>
                <span className="sm:hidden">New</span>
              </Button>
              
              {/* Unified New Order Dialog - Works for both KOT enabled/disabled */}
              {dialogOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                    {/* Header with Icon */}
                    <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-5 text-center relative">
                      <button 
                        onClick={() => { setDialogOpen(false); resetForm(); }}
                        className="absolute top-3 right-3 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                        {businessSettings?.kot_mode_enabled !== false ? (
                          <Receipt className="w-8 h-8 text-violet-600" />
                        ) : (
                          <ShoppingCart className="w-8 h-8 text-violet-600" />
                        )}
                      </div>
                      <h2 className="text-xl font-bold text-white">New Order</h2>
                      <p className="text-violet-200 text-sm mt-1">
                        {businessSettings?.kot_mode_enabled !== false 
                          ? 'Select table & add customer info' 
                          : 'Add customer details or skip'}
                      </p>
                    </div>
                    
                    {/* Form */}
                    <div className="p-5 space-y-4">
                      {/* Table Selection - Only show when KOT is enabled */}
                      {businessSettings?.kot_mode_enabled !== false && (
                        <div>
                          <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                            <span className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 text-xs">🪑</span>
                            Select Table <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <select
                              className="w-full px-4 py-3 text-base border-2 rounded-xl bg-white appearance-none cursor-pointer focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
                              value={formData.table_id}
                              onChange={(e) => setFormData({ ...formData, table_id: e.target.value })}
                              data-testid="order-table-select"
                            >
                              <option value="">Choose a table...</option>
                              {availableTables.map(table => (
                                <option key={table.id} value={table.id}>
                                  Table {table.table_number} ({table.capacity} seats)
                                </option>
                              ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                          {availableTables.length === 0 && (
                            <div className="flex items-center gap-2 mt-2 p-2 bg-orange-50 rounded-lg">
                              <span className="text-orange-500">⚠️</span>
                              <p className="text-xs text-orange-600">No tables available. All tables are occupied.</p>
                            </div>
                          )}
                          {availableTables.length > 0 && (
                            <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                              {availableTables.length} table{availableTables.length > 1 ? 's' : ''} available
                            </p>
                          )}
                        </div>
                      )}
                      
                      {/* Customer Name */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <span className="w-6 h-6 bg-violet-100 rounded-full flex items-center justify-center text-violet-600 text-xs">👤</span>
                          Customer Name
                        </label>
                        <Input
                          value={formData.customer_name}
                          onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                          placeholder={businessSettings?.kot_mode_enabled !== false ? "Enter customer name (optional)" : "Enter name or leave blank"}
                          className="mt-2 h-12 text-base rounded-xl border-gray-200 focus:border-violet-400 focus:ring-violet-400"
                          autoFocus={businessSettings?.kot_mode_enabled === false}
                        />
                      </div>
                      
                      {/* Phone */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xs">📱</span>
                          Phone Number
                          <span className="text-xs text-gray-400 font-normal">(for WhatsApp)</span>
                        </label>
                        <Input
                          value={formData.customer_phone}
                          onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                          placeholder="+91 9876543210"
                          className="mt-2 h-12 text-base rounded-xl border-gray-200 focus:border-violet-400 focus:ring-violet-400"
                        />
                      </div>
                      
                      {/* Don't ask again - Only show when KOT is disabled */}
                      {businessSettings?.kot_mode_enabled === false && (
                        <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                          <input
                            type="checkbox"
                            checked={skipCustomerPrompt}
                            onChange={(e) => {
                              setSkipCustomerPrompt(e.target.checked);
                              localStorage.setItem('skipCustomerPrompt', e.target.checked ? 'true' : 'false');
                            }}
                            className="w-5 h-5 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-700">Skip this next time</p>
                            <p className="text-xs text-gray-500">Go directly to menu</p>
                          </div>
                        </label>
                      )}
                    </div>
                    
                    {/* Buttons */}
                    <div className="p-5 pt-0 flex gap-3">
                      <button 
                        onClick={() => { setDialogOpen(false); resetForm(); }}
                        className="flex-1 h-12 border-2 border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => {
                          // KOT enabled - require table selection
                          if (businessSettings?.kot_mode_enabled !== false && !formData.table_id) {
                            toast.error('Please select a table');
                            return;
                          }
                          setDialogOpen(false);
                          setShowMenuPage(true);
                        }}
                        className="flex-1 h-12 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-500/25"
                      >
                        {businessSettings?.kot_mode_enabled !== false ? (
                          <>
                            Next: Add Items
                            <ArrowRight className="w-4 h-4" />
                          </>
                        ) : formData.customer_name ? (
                          <>
                            Continue
                            <ArrowRight className="w-4 h-4" />
                          </>
                        ) : (
                          <>💵 Cash Sale</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
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
              {orders.filter(o => ['completed', 'cancelled'].includes(o.status) && isToday(o.created_at)).length}
            </span>
          </button>
        </div>

        {/* Active Orders Tab */}
        {activeTab === 'active' && (
          <div className="space-y-3">
            {orders.filter(order => !['completed', 'cancelled'].includes(order.status)).length === 0 && (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
                <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🍽️</span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">No Active Orders</h3>
                <p className="text-gray-500 text-sm">All clear! Tap "New Order" to get started</p>
              </div>
            )}
            {orders.filter(order => !['completed', 'cancelled'].includes(order.status)).map((order) => {
              const statusConfig = {
                pending: { color: 'amber', icon: '⏳', label: 'Pending', bg: 'bg-amber-500' },
                preparing: { color: 'blue', icon: '👨‍🍳', label: 'Cooking', bg: 'bg-blue-500' },
                ready: { color: 'emerald', icon: '✅', label: 'Ready', bg: 'bg-emerald-500' }
              };
              const config = statusConfig[order.status] || statusConfig.pending;
              
              return (
                <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" data-testid={`order-card-${order.id}`}>
                  {/* Header Row */}
                  <div className="flex items-center justify-between p-3 border-b border-gray-50">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${config.bg} rounded-xl flex items-center justify-center text-white text-lg shadow-sm`}>
                        {config.icon}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">#{order.id.slice(0, 6)}</p>
                        <p className="text-xs text-gray-500">
                          {order.table_number > 0 ? `Table ${order.table_number}` : 'Counter'} • {
                            (() => {
                              try {
                                return new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                              } catch (e) {
                                console.warn('Invalid date for order:', order.id, order.created_at);
                                return 'Invalid time';
                              }
                            })()
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-${config.color}-100 text-${config.color}-700`}>
                        {config.label}
                      </span>
                      {['admin', 'cashier'].includes(user?.role) && (
                        <button
                          onClick={() => setActionMenuOpen(actionMenuOpen === order.id ? null : order.id)}
                          className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Bottom Sheet Action Menu for Active Orders */}
                  {actionMenuOpen === order.id && ['admin', 'cashier'].includes(user?.role) && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setActionMenuOpen(null)}>
                      <div 
                        className="w-full bg-white rounded-t-2xl overflow-hidden animate-in slide-in-from-bottom duration-200 pb-safe"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Handle */}
                        <div className="flex justify-center py-2">
                          <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
                        </div>
                        {/* Header */}
                        <div className="px-4 pb-3 border-b">
                          <h3 className="font-bold text-gray-800">Order #{order.id.slice(0, 6)}</h3>
                          <p className="text-sm text-gray-500">Select an action</p>
                        </div>
                        {/* Actions */}
                        <div className="py-2">
                          <button onClick={() => handleEditOrder(order)} className="w-full px-4 py-4 text-left active:bg-gray-100 flex items-center gap-3 border-b border-gray-100">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Edit className="w-5 h-5 text-blue-600" />
                            </div>
                            <span className="font-medium text-gray-800">Edit Order</span>
                          </button>
                          <button onClick={() => { setCancelConfirmModal({ open: true, order }); setActionMenuOpen(null); }} className="w-full px-4 py-4 text-left active:bg-gray-100 flex items-center gap-3 border-b border-gray-100">
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                              <Ban className="w-5 h-5 text-orange-600" />
                            </div>
                            <span className="font-medium text-orange-600">Cancel Order</span>
                          </button>
                          {user?.role === 'admin' && (
                            <button onClick={() => { setDeleteConfirmModal({ open: true, order }); setActionMenuOpen(null); }} className="w-full px-4 py-4 text-left active:bg-gray-100 flex items-center gap-3 border-b border-gray-100">
                              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                <Trash2 className="w-5 h-5 text-red-600" />
                              </div>
                              <span className="font-medium text-red-600">Delete Order</span>
                            </button>
                          )}
                        </div>
                        {/* Cancel Button */}
                        <div className="px-4 pb-4">
                          <button onClick={() => setActionMenuOpen(null)} className="w-full py-3 bg-gray-100 rounded-xl font-medium text-gray-600">
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Customer Info */}
                  {order.customer_name && (
                    <div className="px-3 py-2 bg-gray-50 flex items-center gap-2 text-sm">
                      <span className="text-gray-500">👤</span>
                      <span className="font-medium text-gray-700">{order.customer_name}</span>
                      {order.customer_phone && <span className="text-gray-400 text-xs">• {order.customer_phone}</span>}
                    </div>
                  )}
                  
                  {/* Items */}
                  <div className="p-3">
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 bg-violet-100 text-violet-600 rounded-md flex items-center justify-center text-xs font-bold">{item.quantity}</span>
                            <span className="text-gray-700">{item.name}</span>
                          </div>
                          <span className="font-medium text-gray-600">₹{(item.price * item.quantity).toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Total */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-dashed border-gray-200">
                      <span className="text-gray-500 text-sm">Total</span>
                      <span className="text-xl font-bold text-violet-600">₹{
                        (() => {
                          try {
                            return (order.total || 0).toFixed(0);
                          } catch (e) {
                            console.warn('Invalid total for order:', order.id, order.total);
                            return '0';
                          }
                        })()
                      }</span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="px-3 pb-3 flex gap-2">
                    {['admin', 'kitchen'].includes(user?.role) && order.status === 'pending' && (
                      <button onClick={() => handleStatusChange(order.id, 'preparing')} className="flex-1 h-10 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-1.5">
                        👨‍🍳 Start Cooking
                      </button>
                    )}
                    {['admin', 'kitchen'].includes(user?.role) && order.status === 'preparing' && (
                      <button onClick={() => handleStatusChange(order.id, 'ready')} className="flex-1 h-10 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-1.5">
                        ✅ Mark Ready
                      </button>
                    )}
                    {['admin', 'waiter', 'cashier'].includes(user?.role) && order.status !== 'completed' && (
                      <button onClick={() => handlePrintKOT(order)} className="h-10 px-4 border border-gray-200 hover:bg-gray-50 rounded-xl font-medium text-sm flex items-center justify-center gap-1.5 text-gray-600">
                        <Printer className="w-4 h-4" /> KOT
                      </button>
                    )}
                    {['admin', 'cashier'].includes(user?.role) && ['ready', 'preparing', 'pending'].includes(order.status) && (
                      <button onClick={() => navigate(`/billing/${order.id}`)} className="flex-1 h-10 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-1.5">
                        <CreditCard className="w-4 h-4" /> Bill & Pay
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Today's Bills Tab */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            {orders.filter(order => ['completed', 'cancelled'].includes(order.status) && isToday(order.created_at)).length === 0 && (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📋</span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">No Bills Today</h3>
                <p className="text-gray-500 text-sm">Completed orders will appear here</p>
              </div>
            )}
            {orders.filter(order => ['completed', 'cancelled'].includes(order.status) && isToday(order.created_at)).map((order) => {
              const isCompleted = order.status === 'completed';
              const isCancelled = order.status === 'cancelled';
              const hasCredit = order.is_credit || order.credit_amount > 0;
              
              return (
                <div key={order.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${isCancelled ? 'border-red-200 opacity-75' : hasCredit ? 'border-orange-200' : 'border-gray-100'}`}>
                  {/* Header */}
                  <div className="flex items-center justify-between p-3 border-b border-gray-50">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg shadow-sm ${isCancelled ? 'bg-red-500' : hasCredit ? 'bg-orange-500' : 'bg-emerald-500'}`}>
                        {isCancelled ? '❌' : hasCredit ? '⚠️' : '✅'}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">#{order.id.slice(0, 6)}</p>
                        <p className="text-xs text-gray-500">
                          {
                            (() => {
                              try {
                                return new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                              } catch (e) {
                                console.warn('Invalid date for order:', order.id, order.created_at);
                                return 'Invalid time';
                              }
                            })()
                          }
                          {order.payment_method && !isCancelled && (
                            <span className="ml-1">• {order.payment_method === 'split' ? 'Split' : order.payment_method}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasCredit && !isCancelled && (
                        <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-orange-100 text-orange-700">
                          ₹{(order.balance_amount || order.credit_amount || 0).toFixed(0)} due
                        </span>
                      )}
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isCancelled ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {isCancelled ? 'Cancelled' : 'Paid'}
                      </span>
                      {['admin', 'cashier'].includes(user?.role) && (
                        <button onClick={() => setActionMenuOpen(actionMenuOpen === order.id ? null : order.id)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Bottom Sheet Action Menu for Today's Bills */}
                  {actionMenuOpen === order.id && ['admin', 'cashier'].includes(user?.role) && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setActionMenuOpen(null)}>
                      <div 
                        className="w-full bg-white rounded-t-2xl overflow-hidden animate-in slide-in-from-bottom duration-200 pb-safe"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Handle */}
                        <div className="flex justify-center py-2">
                          <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
                        </div>
                        {/* Header */}
                        <div className="px-4 pb-3 border-b">
                          <h3 className="font-bold text-gray-800">Order #{order.id.slice(0, 6)}</h3>
                          <p className="text-sm text-gray-500">₹{order.total.toFixed(0)} • {isCancelled ? 'Cancelled' : hasCredit ? 'Credit' : 'Paid'}</p>
                        </div>
                        {/* Actions - Scrollable */}
                        <div className="py-2 max-h-[50vh] overflow-y-auto">
                          <button onClick={() => handleViewOrder(order)} className="w-full px-4 py-4 text-left active:bg-gray-100 flex items-center gap-3 border-b border-gray-100">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                              <Eye className="w-5 h-5 text-gray-600" />
                            </div>
                            <span className="font-medium text-gray-800">View Details</span>
                          </button>
                          {isCompleted && (
                            <button onClick={() => handleEditOrder(order)} className="w-full px-4 py-4 text-left active:bg-gray-100 flex items-center gap-3 border-b border-gray-100">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <Edit className="w-5 h-5 text-blue-600" />
                              </div>
                              <span className="font-medium text-gray-800">Edit Order</span>
                            </button>
                          )}
                          <button onClick={() => handlePrintReceipt(order)} className="w-full px-4 py-4 text-left active:bg-gray-100 flex items-center gap-3 border-b border-gray-100">
                            <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                              <Receipt className="w-5 h-5 text-violet-600" />
                            </div>
                            <span className="font-medium text-gray-800">Print Receipt</span>
                          </button>
                          <button onClick={() => { setWhatsappModal({ open: true, orderId: order.id, customerName: order.customer_name || '' }); setWhatsappPhone(order.customer_phone || ''); setActionMenuOpen(null); }} className="w-full px-4 py-4 text-left active:bg-gray-100 flex items-center gap-3 border-b border-gray-100">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <MessageCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <span className="font-medium text-gray-800">Share via WhatsApp</span>
                          </button>
                          {isCompleted && !hasCredit && (
                            <button onClick={() => handleMarkAsCredit(order)} className="w-full px-4 py-4 text-left active:bg-gray-100 flex items-center gap-3 border-b border-gray-100">
                              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                <Wallet className="w-5 h-5 text-orange-600" />
                              </div>
                              <span className="font-medium text-orange-600">Mark as Credit</span>
                            </button>
                          )}
                          {isCompleted && hasCredit && (
                            <button onClick={() => handleMarkAsPaid(order)} className="w-full px-4 py-4 text-left active:bg-gray-100 flex items-center gap-3 border-b border-gray-100">
                              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <DollarSign className="w-5 h-5 text-green-600" />
                              </div>
                              <span className="font-medium text-green-600">Mark as Paid</span>
                            </button>
                          )}
                          {user?.role === 'admin' && (
                            <button onClick={() => { setDeleteConfirmModal({ open: true, order }); setActionMenuOpen(null); }} className="w-full px-4 py-4 text-left active:bg-gray-100 flex items-center gap-3 border-b border-gray-100">
                              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                <Trash2 className="w-5 h-5 text-red-600" />
                              </div>
                              <span className="font-medium text-red-600">Delete Order</span>
                            </button>
                          )}
                        </div>
                        {/* Cancel Button */}
                        <div className="px-4 pb-4">
                          <button onClick={() => setActionMenuOpen(null)} className="w-full py-3 bg-gray-100 rounded-xl font-medium text-gray-600">
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Customer */}
                  {order.customer_name && (
                    <div className="px-3 py-2 bg-gray-50 flex items-center gap-2 text-sm">
                      <span className="text-gray-500">👤</span>
                      <span className="font-medium text-gray-700">{order.customer_name}</span>
                    </div>
                  )}
                  
                  {/* Compact Items + Total */}
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="w-6 h-6 bg-violet-100 text-violet-600 rounded-md flex items-center justify-center text-xs font-bold">
                          {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                        </span>
                        <span>{order.items.length} item{order.items.length > 1 ? 's' : ''}</span>
                      </div>
                      <span className={`text-xl font-bold ${isCancelled ? 'text-gray-400 line-through' : 'text-violet-600'}`}>
                        ₹{
                          (() => {
                            try {
                              return (order.total || 0).toFixed(0);
                            } catch (e) {
                              console.warn('Invalid total for order:', order.id, order.total);
                              return '0';
                            }
                          })()
                        }
                      </span>
                    </div>
                    
                    {/* Quick Actions */}
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => handleViewOrder(order)} className="flex-1 h-9 border border-gray-200 hover:bg-gray-50 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 text-gray-600">
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                      <button onClick={() => handlePrintReceipt(order)} className="flex-1 h-9 border border-gray-200 hover:bg-gray-50 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 text-gray-600">
                        <Receipt className="w-3.5 h-3.5" /> Print
                      </button>
                      <button onClick={() => { setWhatsappModal({ open: true, orderId: order.id, customerName: order.customer_name || '' }); setWhatsappPhone(order.customer_phone || ''); }} className="flex-1 h-9 border border-green-200 hover:bg-green-50 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 text-green-600">
                        <MessageCircle className="w-3.5 h-3.5" /> Share
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* WhatsApp Modal */}
        {whatsappModal.open && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3 sm:p-4">
            <Card className="w-full max-w-md border-0 shadow-2xl bg-white">
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
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3 sm:p-4">
            <Card className="w-full max-w-lg border-0 shadow-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col bg-white">
              <CardHeader className="relative bg-violet-600 text-white rounded-t-lg p-4 sm:p-6 flex-shrink-0">
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
                    <span className="font-medium">₹{(() => {
                      const order = viewOrderModal.order;
                      const discount = order?.discount || order?.discount_amount || 0;
                      // If discount exists, calculate original subtotal from items
                      if (discount > 0 && order?.items) {
                        return order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(0);
                      }
                      return (order?.subtotal || 0).toFixed(0);
                    })()}</span>
                  </div>
                  {(viewOrderModal.order?.discount > 0 || viewOrderModal.order?.discount_amount > 0) && (
                    <div className="flex justify-between text-xs sm:text-sm text-green-600">
                      <span>Discount:</span>
                      <span className="font-medium">-₹{(viewOrderModal.order?.discount || viewOrderModal.order?.discount_amount || 0).toFixed(0)}</span>
                    </div>
                  )}
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
            <Card className="w-full sm:max-w-lg border-0 shadow-2xl max-h-[85vh] sm:mx-4 sm:rounded-xl rounded-t-2xl rounded-b-none sm:rounded-b-xl overflow-hidden flex flex-col bg-white">
              {/* Header */}
              <CardHeader className="bg-blue-600 text-white p-3 flex-shrink-0">
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
                        const subtotal = editItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                        const discountValue = parseFloat(editOrderModal.discount_value) || 0;
                        const discountAmount = editOrderModal.discount_type === 'percent' ? (subtotal * discountValue) / 100 : discountValue;
                        const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
                        const total = subtotalAfterDiscount * (1 + (editOrderModal.tax_rate || 0) / 100);
                        if (editOrderModal.use_split_payment) {
                          setEditOrderModal({ ...editOrderModal, use_split_payment: false, payment_method: 'cash', payment_received: total, balance_amount: 0, cash_amount: 0, card_amount: 0, upi_amount: 0, credit_amount: 0, is_credit: false });
                        } else {
                          setEditOrderModal({ ...editOrderModal, use_split_payment: true, payment_method: 'split', cash_amount: total, card_amount: 0, upi_amount: 0, credit_amount: 0 });
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
                            const subtotal = editItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                            const discountValue = parseFloat(editOrderModal.discount_value) || 0;
                            const discountAmount = editOrderModal.discount_type === 'percent' ? (subtotal * discountValue) / 100 : discountValue;
                            const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
                            const total = subtotalAfterDiscount * (1 + (editOrderModal.tax_rate || 0) / 100);
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
                        const subtotal = editItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                        const discountValue = parseFloat(editOrderModal.discount_value) || 0;
                        const discountAmount = editOrderModal.discount_type === 'percent' ? (subtotal * discountValue) / 100 : discountValue;
                        const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
                        const total = subtotalAfterDiscount * (1 + (editOrderModal.tax_rate || 0) / 100);
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
                            const subtotal = editItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                            const discountValue = parseFloat(editOrderModal.discount_value) || 0;
                            const discountAmount = editOrderModal.discount_type === 'percent' ? (subtotal * discountValue) / 100 : discountValue;
                            const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
                            const total = subtotalAfterDiscount * (1 + (editOrderModal.tax_rate || 0) / 100);
                            const remaining = total - (parseFloat(editOrderModal.cash_amount) || 0) - (parseFloat(editOrderModal.card_amount) || 0) - (parseFloat(editOrderModal.upi_amount) || 0) - (parseFloat(editOrderModal.credit_amount) || 0);
                            if (remaining > 0) setEditOrderModal({ ...editOrderModal, cash_amount: (parseFloat(editOrderModal.cash_amount) || 0) + remaining });
                          }}
                          className="text-[9px] px-2 py-0.5 bg-white border rounded flex-1"
                        >
                          Fill Cash
                        </button>
                        <button
                          onClick={() => {
                            const subtotal = editItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                            const discountValue = parseFloat(editOrderModal.discount_value) || 0;
                            const discountAmount = editOrderModal.discount_type === 'percent' ? (subtotal * discountValue) / 100 : discountValue;
                            const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
                            const total = subtotalAfterDiscount * (1 + (editOrderModal.tax_rate || 0) / 100);
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
                  
                  {/* Manual Item Entry */}
                  <div className="mt-2 flex gap-1">
                    <Input
                      placeholder="Item name"
                      value={editOrderModal.manual_item_name || ''}
                      onChange={(e) => setEditOrderModal({ ...editOrderModal, manual_item_name: e.target.value })}
                      className="h-7 text-xs flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="₹"
                      value={editOrderModal.manual_item_price || ''}
                      onChange={(e) => setEditOrderModal({ ...editOrderModal, manual_item_price: e.target.value })}
                      className="h-7 text-xs w-16"
                      min="0"
                    />
                    <Button 
                      size="sm" 
                      onClick={handleAddManualItem}
                      className="h-7 px-2 bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
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
                {/* Discount Section */}
                <div className="flex items-center gap-2 mb-2 pb-2 border-b">
                  <span className="text-[10px] text-gray-500">Discount:</span>
                  <select
                    value={editOrderModal.discount_type}
                    onChange={(e) => setEditOrderModal({ ...editOrderModal, discount_type: e.target.value })}
                    className="text-xs px-1 py-0.5 border rounded bg-gray-50 w-14"
                  >
                    <option value="amount">₹</option>
                    <option value="percent">%</option>
                  </select>
                  <Input
                    type="number"
                    value={editOrderModal.discount_value || ''}
                    onChange={(e) => setEditOrderModal({ ...editOrderModal, discount_value: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    className="h-6 text-xs w-16 px-1"
                    min="0"
                  />
                  {(editOrderModal.discount_value > 0) && (
                    <span className="text-[10px] text-green-600 font-medium">
                      -₹{editOrderModal.discount_type === 'percent' 
                        ? ((editItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) * editOrderModal.discount_value) / 100).toFixed(0)
                        : editOrderModal.discount_value}
                    </span>
                  )}
                </div>
                
                {/* Tax Rate Selector */}
                <div className="flex items-center justify-between mb-2 pb-2 border-b">
                  <span className="text-[10px] text-gray-500">Tax Rate:</span>
                  <select
                    value={editOrderModal.tax_rate}
                    onChange={(e) => setEditOrderModal({ ...editOrderModal, tax_rate: Number(e.target.value) })}
                    className="text-xs px-2 py-1 border rounded bg-gray-50"
                  >
                    <option value="0">No Tax (0%)</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    {(() => {
                      const subtotal = editItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                      const discountValue = parseFloat(editOrderModal.discount_value) || 0;
                      const discountAmount = editOrderModal.discount_type === 'percent' 
                        ? (subtotal * discountValue) / 100 
                        : discountValue;
                      const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
                      const tax = subtotalAfterDiscount * (editOrderModal.tax_rate || 0) / 100;
                      const total = subtotalAfterDiscount + tax;
                      
                      return (
                        <>
                          <p className="text-[10px] text-gray-400">
                            {editItems.reduce((sum, item) => sum + item.quantity, 0)} items 
                            {discountAmount > 0 && <span className="text-green-600"> • Disc -₹{discountAmount.toFixed(0)}</span>}
                            {' '}• Tax {editOrderModal.tax_rate}%
                          </p>
                          <p className="text-lg font-bold text-blue-600">₹{total.toFixed(0)}</p>
                        </>
                      );
                    })()}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setEditOrderModal({ open: false, order: null, customer_name: '', customer_phone: '', payment_method: 'cash', is_credit: false, payment_received: 0, balance_amount: 0, tax_rate: 5, discount_type: 'amount', discount_value: 0, manual_item_name: '', manual_item_price: '' }); setEditItems([]); }}>
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
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3 sm:p-4">
            <Card className="w-full max-w-sm border-0 shadow-2xl bg-white">
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
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3 sm:p-4">
            <Card className="w-full max-w-sm border-0 shadow-2xl bg-white">
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
