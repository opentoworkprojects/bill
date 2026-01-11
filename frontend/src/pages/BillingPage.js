import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, CreditCard, Wallet, Smartphone, Download, MessageCircle, X, Check, Plus, Trash2, Search } from 'lucide-react';
import { printReceipt } from '../utils/printUtils';

const BillingPage = ({ user }) => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [receivedAmount, setReceivedAmount] = useState('');
  const [showReceivedAmount, setShowReceivedAmount] = useState(false);
  const [splitPayment, setSplitPayment] = useState(false);
  const [cashAmount, setCashAmount] = useState('');
  const [cardAmount, setCardAmount] = useState('');
  const [upiAmount, setUpiAmount] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [businessSettings, setBusinessSettings] = useState(null);
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [discountType, setDiscountType] = useState('amount');
  const [discountValue, setDiscountValue] = useState('');
  const [customTaxRate, setCustomTaxRate] = useState(null);
  const [customPrice, setCustomPrice] = useState('');
  const [orderItems, setOrderItems] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const priceInputRef = useRef(null);
  const isSelectingRef = useRef(false);

  useEffect(() => {
    fetchOrder();
    fetchBusinessSettings();
    fetchMenuItems();
  }, [orderId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Don't close if we're in the middle of selecting
      if (isSelectingRef.current) {
        isSelectingRef.current = false;
        return;
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowMenuDropdown(false);
      }
    };
    // Use click instead of mousedown - fires after touch events complete
    document.addEventListener('click', handleClickOutside, true);
    return () => {
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, []);

  const fetchOrder = async () => {
    try {
      const response = await axios.get(`${API}/orders/${orderId}`);
      setOrder(response.data);
      setOrderItems(response.data.items || []);
      if (response.data.customer_phone) setWhatsappPhone(response.data.customer_phone);
      if (response.data.discount || response.data.discount_amount) {
        setDiscountType(response.data.discount_type || 'amount');
        setDiscountValue(response.data.discount_value || response.data.discount || '');
      }
    } catch (error) {
      toast.error('Failed to fetch order');
      navigate('/orders');
    }
  };

  const fetchBusinessSettings = async () => {
    try {
      const response = await axios.get(`${API}/business/settings`);
      setBusinessSettings(response.data.business_settings);
    } catch (error) {
      console.error('Failed to fetch business settings', error);
    }
  };

  const fetchMenuItems = async () => {
    try {
      console.log('Fetching menu items...');
      
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No auth token found');
        return;
      }
      
      const response = await axios.get(`${API}/menu`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const items = Array.isArray(response.data) ? response.data : [];
      const availableItems = items.filter(item => item.available);
      
      console.log('Menu fetch successful:', availableItems.length, 'available items out of', items.length, 'total');
      setMenuItems(availableItems);
      
      if (availableItems.length === 0) {
        console.warn('No available menu items found');
        toast.warning('No menu items available. Please add menu items first.');
      }
      
    } catch (error) {
      console.error('Failed to fetch menu items', error);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      if (error.response?.status === 401) {
        toast.error('Authentication required. Please login again.');
      } else if (error.response?.status === 403) {
        toast.error('Not authorized to view menu items.');
      } else {
        toast.error('Failed to load menu items. Please refresh the page.');
      }
      
      setMenuItems([]);
    }
  };

  const getCurrencySymbol = () => {
    const symbols = { 'INR': '₹', 'USD': '$', 'EUR': '€', 'GBP': '£' };
    return symbols[businessSettings?.currency || 'INR'] || '₹';
  };

  const calculateReceivedAmount = () => {
    if (splitPayment) {
      return (parseFloat(cashAmount) || 0) + (parseFloat(cardAmount) || 0) + (parseFloat(upiAmount) || 0);
    }
    return parseFloat(receivedAmount) || 0;
  };

  const calculateBalanceAmount = () => {
    const total = calculateTotal();
    const received = calculateReceivedAmount();
    return Math.max(0, total - received);
  };

  const calculateChangeAmount = () => {
    const total = calculateTotal();
    const received = calculateReceivedAmount();
    return Math.max(0, received - total);
  };

  const isPartialPayment = () => {
    const total = calculateTotal();
    const received = calculateReceivedAmount();
    return received > 0 && received < total;
  };

  const isOverPayment = () => {
    const total = calculateTotal();
    const received = calculateReceivedAmount();
    return received > total;
  };

  const getTotalSplitAmount = () => {
    return (parseFloat(cashAmount) || 0) + (parseFloat(cardAmount) || 0) + (parseFloat(upiAmount) || 0);
  };

  // Memoized calculations to prevent unnecessary recalculations
  const subtotal = useMemo(() => orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0), [orderItems]);
  
  const discountAmount = useMemo(() => {
    const value = parseFloat(discountValue) || 0;
    if (value <= 0) return 0;
    if (discountType === 'percent') {
      const pct = Math.min(value, 100);
      return (subtotal * pct) / 100;
    }
    return Math.min(value, subtotal);
  }, [subtotal, discountValue, discountType]);

  const effectiveTaxRate = useMemo(() => {
    if (customTaxRate !== null) return customTaxRate;
    if (order?.tax_rate !== undefined) return order.tax_rate;
    if (order?.subtotal > 0 && order?.tax !== undefined) {
      return Math.round((order.tax / order.subtotal) * 100 * 100) / 100;
    }
    return businessSettings?.tax_rate ?? 5;
  }, [customTaxRate, order, businessSettings]);

  const tax = useMemo(() => {
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    return (taxableAmount * effectiveTaxRate) / 100;
  }, [subtotal, discountAmount, effectiveTaxRate]);

  const total = useMemo(() => Math.max(0, subtotal - discountAmount + tax), [subtotal, discountAmount, tax]);

  // Keep old function names for compatibility but use memoized values
  const calculateSubtotal = useCallback(() => subtotal, [subtotal]);
  const calculateDiscountAmount = useCallback(() => discountAmount, [discountAmount]);
  const calculateTax = useCallback(() => tax, [tax]);
  const calculateTotal = useCallback(() => total, [total]);
  const getEffectiveTaxRate = useCallback(() => effectiveTaxRate, [effectiveTaxRate]);

  const handleAddMenuItem = (menuItem) => {
    const existingIndex = orderItems.findIndex(item => item.menu_item_id === menuItem.id);
    if (existingIndex !== -1) {
      const updated = [...orderItems];
      updated[existingIndex].quantity += 1;
      setOrderItems(updated);
    } else {
      setOrderItems([...orderItems, { menu_item_id: menuItem.id, name: menuItem.name, price: menuItem.price, quantity: 1, notes: '' }]);
    }
    setShowMenuDropdown(false);
    setSearchQuery('');
    setCustomPrice('');
    toast.success(`Added: ${menuItem.name}`);
  };

  // Get filtered menu items based on search
  const filteredMenuItems = searchQuery.trim() 
    ? menuItems.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];
  const hasMatches = filteredMenuItems.length > 0;

  // Add custom item (when no menu match)
  const handleAddCustomItem = () => {
    const name = searchQuery.trim();
    const price = parseFloat(customPrice) || 0;
    if (!name) { toast.error('Enter item name'); return; }
    if (price <= 0) { toast.error('Enter price'); return; }
    setOrderItems([...orderItems, { menu_item_id: `custom_${Date.now()}`, name, price, quantity: 1, notes: 'Custom item' }]);
    setSearchQuery('');
    setCustomPrice('');
    setShowMenuDropdown(false);
    toast.success(`Added: ${name}`);
  };

  const handleItemQuantityChange = (index, delta) => {
    const updated = [...orderItems];
    const newQty = updated[index].quantity + delta;
    if (newQty < 1) updated.splice(index, 1);
    else updated[index].quantity = newQty;
    setOrderItems(updated);
  };

  const handleRemoveItem = (index) => setOrderItems(orderItems.filter((_, i) => i !== index));

  const updateOrderItems = async () => {
    if (orderItems.length === 0) { toast.error('Order must have at least one item'); return false; }
    try {
      const subtotal = calculateSubtotal();
      const discountAmt = calculateDiscountAmount();
      const tax = calculateTax();
      const total = calculateTotal();
      await axios.put(`${API}/orders/${orderId}`, {
        items: orderItems, subtotal: subtotal - discountAmt, tax, tax_rate: getEffectiveTaxRate(), total,
        discount: discountAmt, discount_type: discountType, discount_value: parseFloat(discountValue) || 0, discount_amount: discountAmt
      });
      setOrder(prev => ({ ...prev, items: orderItems, subtotal: subtotal - discountAmt, tax, total }));
      return true;
    } catch (error) {
      toast.error('Failed to update order');
      return false;
    }
  };

  const releaseTable = async () => {
    const kotEnabled = businessSettings?.kot_mode_enabled !== false;
    if (!kotEnabled || !order?.table_id || order.table_id === 'counter') return;
    try {
      const tableResponse = await axios.get(`${API}/tables/${order.table_id}`);
      await axios.put(`${API}/tables/${order.table_id}`, {
        table_number: tableResponse.data.table_number, capacity: tableResponse.data.capacity || 4, status: 'available', current_order_id: null
      });
      toast.success(`Table ${order.table_number} released`);
    } catch (error) {
      console.error('Failed to release table:', error);
    }
  };

  const processPayment = async () => {
    const total = calculateTotal();
    const received = (showReceivedAmount || splitPayment) ? calculateReceivedAmount() : total;
    const balance = Math.max(0, total - received);
    const isCredit = balance > 0;
    
    setLoading(true);
    try {
      console.log('Processing payment:', { total, received, balance, isCredit });
      
      // Create payment record
      await axios.post(`${API}/payments/create-order`, { 
        order_id: orderId, 
        amount: received, 
        payment_method: splitPayment ? 'split' : paymentMethod 
      });
      
      // Prepare payment data
      const paymentData = {
        status: isCredit ? 'pending' : 'completed',
        payment_method: splitPayment ? 'split' : paymentMethod,
        payment_received: received,
        balance_amount: balance,
        is_credit: isCredit,
        discount: calculateDiscountAmount(),
        discount_type: discountType,
        discount_value: parseFloat(discountValue) || 0,
        discount_amount: calculateDiscountAmount(),
        total: total,
        updated_at: new Date().toISOString(),
        items: orderItems,
        subtotal: calculateSubtotal() - calculateDiscountAmount(),
        tax: calculateTax(),
        tax_rate: getEffectiveTaxRate()
      };

      // Add customer info for partial payments
      if (isCredit && customerName) {
        paymentData.customer_name = customerName;
      }
      if (isCredit && customerPhone) {
        paymentData.customer_phone = customerPhone;
      }

      // Add split payment details if applicable
      if (splitPayment) {
        paymentData.cash_amount = parseFloat(cashAmount) || 0;
        paymentData.card_amount = parseFloat(cardAmount) || 0;
        paymentData.upi_amount = parseFloat(upiAmount) || 0;
        paymentData.credit_amount = balance;
      }
      
      console.log('Updating order with payment data:', paymentData);
      
      // Update order with payment details
      await axios.put(`${API}/orders/${orderId}`, paymentData);
      
      toast.success(isCredit ? 'Partial payment recorded!' : 'Payment completed!');
      setPaymentCompleted(true);
      
      // Release table for all payments (partial or full)
      await releaseTable();
      
      // Print receipt
      const discountAmt = calculateDiscountAmount();
      const receiptData = { 
        ...order, 
        items: orderItems, 
        subtotal: calculateSubtotal(), 
        tax: calculateTax(), 
        total: total, 
        discount: discountAmt, 
        discount_amount: discountAmt, 
        tax_rate: getEffectiveTaxRate(),
        status: isCredit ? 'pending' : 'completed',
        payment_method: splitPayment ? 'split' : paymentMethod,
        payment_received: received,
        balance_amount: balance,
        is_credit: isCredit,
        customer_name: customerName || order.customer_name,
        customer_phone: customerPhone || order.customer_phone
      };

      // Add split payment details to receipt
      if (splitPayment) {
        receiptData.cash_amount = parseFloat(cashAmount) || 0;
        receiptData.card_amount = parseFloat(cardAmount) || 0;
        receiptData.upi_amount = parseFloat(upiAmount) || 0;
        receiptData.credit_amount = balance;
      }

      console.log('Printing receipt with data:', receiptData);
      printReceipt(receiptData, businessSettings);
      
    } catch (error) {
      console.error('Payment error:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      let errorMessage = 'Payment failed. Please try again.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please login again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Not authorized to process payment.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Order not found. Please refresh and try again.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    try {
      if (!order) {
        toast.error('Order not found');
        return;
      }
      
      const updated = await updateOrderItems();
      if (!updated) return;
      
      const total = calculateTotal();
      const received = (showReceivedAmount || splitPayment) ? calculateReceivedAmount() : total;
      const balance = Math.max(0, total - received);
      const isCredit = balance > 0;
      
      if ((showReceivedAmount || splitPayment) && received <= 0) {
        toast.error('Please enter a valid received amount');
        return;
      }

      // Check if partial payment and customer info is missing
      if (isCredit && (!customerName || !customerPhone)) {
        setShowCustomerModal(true);
        return;
      }
      
      await processPayment();
    } catch (error) {
      console.error('Error in handlePayment:', error);
      toast.error('Payment processing failed. Please try again.');
      setLoading(false);
    }
  };

  const handleWhatsappShare = async () => {
    if (!whatsappPhone.trim()) { toast.error('Enter phone number'); return; }
    try {
      const response = await axios.post(`${API}/whatsapp/send-receipt/${orderId}`, { phone_number: whatsappPhone, customer_name: order?.customer_name });
      window.open(response.data.whatsapp_link, '_blank');
      setShowWhatsappModal(false);
    } catch (error) {
      toast.error('Failed to share');
    }
  };


  const downloadBillPDF = async () => {
    if (!order) return;
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      const restaurantName = businessSettings?.restaurant_name || 'Restaurant';
      const invoiceNo = order.invoice_number || order.id.slice(0, 8).toUpperCase();
      const subtotal = calculateSubtotal();
      const tax = calculateTax();
      const discount = calculateDiscountAmount();
      const total = calculateTotal();
      const taxRate = getEffectiveTaxRate();
      
      // Use "Rs." for PDF to avoid encoding issues
      const rs = 'Rs.';
      
      // ===== HEADER =====
      doc.setFillColor(124, 58, 237);
      doc.rect(0, 0, 210, 45, 'F');
      
      // Restaurant Name
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont(undefined, 'bold');
      doc.text(restaurantName, 20, 22);
      
      // Invoice label
      doc.setFontSize(12);
      doc.text('TAX INVOICE', 190, 15, { align: 'right' });
      doc.setFontSize(14);
      doc.text(`#${invoiceNo}`, 190, 28, { align: 'right' });
      
      // Table/Counter badge
      if (order.table_number) {
        doc.setFontSize(10);
        doc.text(`Table ${order.table_number}`, 190, 38, { align: 'right' });
      }
      
      // ===== BUSINESS & ORDER INFO =====
      let y = 58;
      doc.setTextColor(80, 80, 80);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      
      // Left side - Business info
      if (businessSettings?.address) {
        doc.text(businessSettings.address, 20, y);
        y += 5;
      }
      if (businessSettings?.phone) {
        doc.text(`Phone: ${businessSettings.phone}`, 20, y);
        y += 5;
      }
      if (businessSettings?.gstin) {
        doc.setFont(undefined, 'bold');
        doc.text(`GSTIN: ${businessSettings.gstin}`, 20, y);
        doc.setFont(undefined, 'normal');
      }
      
      // Right side - Date/Time
      doc.text(`Date: ${new Date(order.created_at).toLocaleDateString('en-IN')}`, 190, 58, { align: 'right' });
      doc.text(`Time: ${new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`, 190, 64, { align: 'right' });
      
      if (order.customer_name) {
        doc.text(`Customer: ${order.customer_name}`, 190, 70, { align: 'right' });
      }
      
      // ===== ITEMS TABLE =====
      y = 85;
      
      // Table Header
      doc.setFillColor(248, 250, 252);
      doc.rect(15, y - 6, 180, 12, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.line(15, y + 6, 195, y + 6);
      
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('ITEM', 20, y);
      doc.text('QTY', 115, y, { align: 'center' });
      doc.text('RATE', 145, y, { align: 'right' });
      doc.text('AMOUNT', 188, y, { align: 'right' });
      
      // Table Rows
      y += 14;
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      
      orderItems.forEach((item, index) => {
        // Alternate row background
        if (index % 2 === 0) {
          doc.setFillColor(252, 252, 254);
          doc.rect(15, y - 5, 180, 10, 'F');
        }
        
        doc.setTextColor(40, 40, 40);
        doc.text(item.name.length > 35 ? item.name.substring(0, 35) + '...' : item.name, 20, y);
        doc.text(item.quantity.toString(), 115, y, { align: 'center' });
        doc.text(`${rs}${item.price.toFixed(2)}`, 145, y, { align: 'right' });
        doc.setFont(undefined, 'bold');
        doc.text(`${rs}${(item.quantity * item.price).toFixed(2)}`, 188, y, { align: 'right' });
        doc.setFont(undefined, 'normal');
        y += 10;
      });
      
      // ===== TOTALS SECTION =====
      y += 5;
      doc.setDrawColor(200, 200, 200);
      doc.line(120, y, 195, y);
      y += 10;
      
      // Subtotal
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text('Subtotal:', 140, y);
      doc.text(`${rs}${subtotal.toFixed(2)}`, 188, y, { align: 'right' });
      
      // Tax
      y += 8;
      doc.text(`Tax (${taxRate}%):`, 140, y);
      doc.text(`${rs}${tax.toFixed(2)}`, 188, y, { align: 'right' });
      
      // Discount (if any)
      if (discount > 0) {
        y += 8;
        doc.setTextColor(34, 197, 94);
        doc.text('Discount:', 140, y);
        doc.text(`-${rs}${discount.toFixed(2)}`, 188, y, { align: 'right' });
      }
      
      // Total Box
      y += 12;
      doc.setFillColor(124, 58, 237);
      doc.roundedRect(120, y - 6, 75, 14, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('TOTAL:', 125, y + 2);
      doc.text(`${rs}${total.toFixed(2)}`, 190, y + 2, { align: 'right' });
      
      // ===== PAYMENT INFO =====
      if (paymentCompleted || order.status === 'completed') {
        y += 20;
        doc.setFillColor(34, 197, 94);
        doc.roundedRect(15, y - 4, 50, 10, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.text('PAID', 40, y + 2, { align: 'center' });
        
        doc.setTextColor(80, 80, 80);
        doc.setFont(undefined, 'normal');
        doc.text(`Payment: ${(order.payment_method || paymentMethod || 'Cash').toUpperCase()}`, 70, y + 2);
      }
      
      // ===== FOOTER =====
      doc.setTextColor(120, 120, 120);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text('Thank you for your business!', 105, 265, { align: 'center' });
      
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('Generated by BillByteKOT', 105, 275, { align: 'center' });
      doc.text('www.billbytekot.in', 105, 280, { align: 'center' });
      
      // Save
      doc.save(`Invoice-${invoiceNo}.pdf`);
      toast.success('Invoice downloaded!');
    } catch (error) {
      console.error('PDF Error:', error);
      toast.error('Failed to download PDF');
    }
  };

  if (!order) {
    return (
      <Layout user={user}>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full"></div>
        </div>
      </Layout>
    );
  }

  const currency = getCurrencySymbol();
  const discountAmt = calculateDiscountAmount();
  const orderData = { ...order, items: orderItems, subtotal: calculateSubtotal(), tax: calculateTax(), total: calculateTotal(), discount: discountAmt, discount_amount: discountAmt, tax_rate: getEffectiveTaxRate() };

  return (
    <Layout user={user}>
      {/* ========== MOBILE LAYOUT ========== */}
      <div className="lg:hidden p-2 pb-4">
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-3 py-2 rounded-t-xl flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="font-bold">#{order.invoice_number || order.id.slice(0, 6)}</span>
            <span className="text-violet-200 text-sm">{order.table_number ? `• T${order.table_number}` : '• Counter'}</span>
          </div>
          <span className="text-sm">{new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
        </div>
        <Card className="rounded-t-none border-0 shadow-lg">
          <CardContent className="p-3">
            {/* Smart Search Bar */}
            <div className="relative mb-2" ref={dropdownRef}>
              <div className="flex gap-1">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input 
                    placeholder="Search item... (Enter to add)" 
                    value={searchQuery} 
                    onChange={(e) => { setSearchQuery(e.target.value); setShowMenuDropdown(true); }} 
                    onFocus={() => setShowMenuDropdown(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && hasMatches) {
                        e.preventDefault();
                        handleAddMenuItem(filteredMenuItems[0]);
                      }
                    }}
                    className="pl-8 h-10 text-base" 
                  />
                </div>
                {!hasMatches && searchQuery.trim() && (
                  <>
                    <Input type="number" placeholder="₹" value={customPrice} onChange={(e) => setCustomPrice(e.target.value)} className="w-16 h-10 text-base" ref={priceInputRef} />
                    <Button size="sm" onClick={handleAddCustomItem} className="h-10 px-3 bg-green-600"><Plus className="w-4 h-4" /></Button>
                  </>
                )}
              </div>
              
              {/* Suggested Items - Large touch targets */}
              {showMenuDropdown && searchQuery.trim() && hasMatches && (
                <div className="mt-2 bg-white border-2 border-violet-400 rounded-2xl overflow-hidden shadow-xl">
                  <div className="bg-violet-600 text-white px-4 py-2.5 text-sm font-semibold flex justify-between items-center">
                    <span>👆 Tap to add ({filteredMenuItems.length})</span>
                    <button 
                      onClick={() => setShowMenuDropdown(false)} 
                      className="bg-white/20 rounded-full w-7 h-7 flex items-center justify-center"
                    >✕</button>
                  </div>
                  <div className="max-h-64 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                    {filteredMenuItems.slice(0, 6).map((item, idx) => (
                      <div 
                        key={item.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          isSelectingRef.current = true;
                          handleAddMenuItem(item);
                        }}
                        onTouchStart={() => { isSelectingRef.current = true; }}
                        onTouchEnd={(e) => {
                          e.preventDefault();
                          handleAddMenuItem(item);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-5 border-b-2 border-gray-100 cursor-pointer select-none ${idx === 0 ? 'bg-violet-50 border-violet-200' : 'bg-white'} active:bg-violet-200`}
                        style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'rgba(139, 92, 246, 0.3)', minHeight: '60px' }}
                      >
                        <span className={`font-semibold text-lg ${idx === 0 ? 'text-violet-700' : 'text-gray-800'}`}>
                          {idx === 0 && '⏎ '}{item.name}
                        </span>
                        <span className="bg-violet-600 text-white px-4 py-2 rounded-xl font-bold text-base ml-2">
                          {currency}{item.price}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* No match message */}
              {showMenuDropdown && searchQuery.trim() && !hasMatches && (
                <div className="mt-2 bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-orange-700 text-sm">
                    No match. Enter price → <span className="font-bold">{searchQuery}</span>
                  </p>
                </div>
              )}
            </div>
            <div className="max-h-[28vh] overflow-y-auto mb-2 space-y-1">
              {orderItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 py-1 px-2 bg-gray-50 rounded">
                  <button onClick={() => handleItemQuantityChange(idx, -1)} className="w-6 h-6 bg-white border rounded text-xs">-</button>
                  <span className="w-6 h-6 bg-violet-600 text-white rounded flex items-center justify-center text-xs font-bold">{item.quantity}</span>
                  <button onClick={() => handleItemQuantityChange(idx, 1)} className="w-6 h-6 bg-white border rounded text-xs">+</button>
                  <span className="flex-1 text-sm truncate">{item.name}</span>
                  <span className="font-bold text-sm text-violet-600">{currency}{(item.price * item.quantity).toFixed(0)}</span>
                  <button onClick={() => handleRemoveItem(idx)} className="text-red-400 p-0.5"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
            <div className="border-t pt-2 space-y-2 text-sm">
              {/* Subtotal Row */}
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">{currency}{calculateSubtotal().toFixed(0)}</span>
              </div>
              
              {/* Discount Row - Better Layout */}
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-gray-500">Discount</span>
                  <span className="text-green-600 font-medium">{discountAmt > 0 ? `-${currency}${discountAmt.toFixed(0)}` : '—'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <select value={discountType} onChange={(e) => { setDiscountType(e.target.value); setDiscountValue(''); }} className="h-8 px-2 text-sm border rounded-lg bg-white">
                    <option value="amount">₹</option>
                    <option value="percent">%</option>
                  </select>
                  <input 
                    type="number" 
                    value={discountValue} 
                    onChange={(e) => setDiscountValue(e.target.value)} 
                    placeholder="0"
                    className="w-16 h-8 px-2 text-sm border rounded-lg text-center" 
                    min="0"
                    max={discountType === 'percent' ? 100 : undefined}
                  />
                  <div className="flex gap-1 flex-1 justify-end">
                    {[5, 10, 15].map(p => (
                      <button 
                        key={p} 
                        onClick={() => { setDiscountType('percent'); setDiscountValue(p.toString()); }} 
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium ${discountType === 'percent' && discountValue === p.toString() ? 'bg-green-500 text-white' : 'bg-white border'}`}
                      >
                        {p}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Tax Row */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Tax</span>
                  <select 
                    value={customTaxRate !== null ? customTaxRate : getEffectiveTaxRate()} 
                    onChange={(e) => setCustomTaxRate(Number(e.target.value))} 
                    className="h-7 px-2 text-xs border rounded-lg bg-white"
                  >
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                  </select>
                </div>
                <span className="font-medium">{currency}{calculateTax().toFixed(0)}</span>
              </div>
              
              {/* Total Row */}
              <div className="flex justify-between text-xl font-bold pt-2 border-t">
                <span>Total</span>
                <span className="text-violet-600">{currency}{calculateTotal().toFixed(0)}</span>
              </div>
            </div>
            {/* Payment Method Selection */}
            <div className="bg-gray-50 p-3 rounded-lg mt-3">
              <h4 className="font-semibold text-sm mb-2">Payment Method</h4>
              <div className="grid grid-cols-3 gap-2">
                {[{ id: 'cash', icon: Wallet, label: 'Cash', color: '#22c55e' }, { id: 'card', icon: CreditCard, label: 'Card', color: '#3b82f6' }, { id: 'upi', icon: Smartphone, label: 'UPI', color: '#8b5cf6' }].map(m => (
                  <button 
                    key={m.id} 
                    onClick={() => {
                      setPaymentMethod(m.id);
                      setSplitPayment(false);
                    }} 
                    className={`py-2 rounded-lg flex flex-col items-center gap-1 border-2 transition-all ${paymentMethod === m.id && !splitPayment ? 'text-white border-transparent' : 'bg-white border-gray-200'}`} 
                    style={paymentMethod === m.id && !splitPayment ? { backgroundColor: m.color } : {}}
                  >
                    <m.icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{m.label}</span>
                  </button>
                ))}
              </div>
              
              {/* Split Payment Option */}
              <div className="mt-3">
                <button 
                  onClick={() => {
                    setSplitPayment(!splitPayment);
                    if (!splitPayment) {
                      setShowReceivedAmount(false);
                      setReceivedAmount('');
                    }
                  }}
                  className={`w-full py-2 px-3 rounded-lg border-2 transition-all ${splitPayment ? 'bg-purple-600 text-white border-purple-600' : 'bg-white border-gray-200 hover:border-purple-300'}`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    <span className="text-sm font-medium">Split Payment</span>
                  </div>
                </button>
              </div>
            </div>
            
            {/* Payment Amount Options */}
            <div className="bg-blue-50 p-3 rounded-lg mt-3">
              <h4 className="font-semibold text-sm mb-2">Payment Amount</h4>
              
              {!splitPayment && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      id="fullPayment" 
                      name="paymentType" 
                      checked={!showReceivedAmount} 
                      onChange={() => {
                        setShowReceivedAmount(false);
                        setReceivedAmount('');
                      }}
                      className="rounded"
                    />
                    <label htmlFor="fullPayment" className="text-sm font-medium">
                      Full Payment: {currency}{calculateTotal().toFixed(2)}
                    </label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      id="customPayment" 
                      name="paymentType" 
                      checked={showReceivedAmount} 
                      onChange={() => setShowReceivedAmount(true)}
                      className="rounded"
                    />
                    <label htmlFor="customPayment" className="text-sm font-medium">
                      Custom Amount (Partial/Overpayment)
                    </label>
                  </div>
                  
                  {showReceivedAmount && (
                    <div className="ml-6 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 min-w-[100px]">Amount Received:</span>
                        <input 
                          type="number" 
                          value={receivedAmount} 
                          onChange={(e) => setReceivedAmount(e.target.value)} 
                          placeholder={calculateTotal().toFixed(0)}
                          className="flex-1 h-8 px-2 text-sm border rounded-lg text-center" 
                          min="0"
                          step="0.01"
                        />
                      </div>
                      
                      {/* Quick Amount Buttons */}
                      <div className="flex gap-1">
                        <button 
                          onClick={() => setReceivedAmount((calculateTotal() * 0.5).toFixed(2))}
                          className="px-2 py-1 text-xs bg-yellow-100 border border-yellow-300 rounded hover:bg-yellow-200"
                        >
                          50%
                        </button>
                        <button 
                          onClick={() => setReceivedAmount(calculateTotal().toFixed(2))}
                          className="px-2 py-1 text-xs bg-green-100 border border-green-300 rounded hover:bg-green-200"
                        >
                          Full
                        </button>
                        <button 
                          onClick={() => setReceivedAmount(Math.ceil(calculateTotal()).toString())}
                          className="px-2 py-1 text-xs bg-blue-100 border border-blue-300 rounded hover:bg-blue-200"
                        >
                          Round Up
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Split Payment Inputs */}
              {splitPayment && (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-gray-600">Cash</label>
                      <input 
                        type="number" 
                        value={cashAmount} 
                        onChange={(e) => setCashAmount(e.target.value)} 
                        placeholder="0.00"
                        className="w-full h-8 px-2 text-sm border rounded-lg text-center" 
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Card</label>
                      <input 
                        type="number" 
                        value={cardAmount} 
                        onChange={(e) => setCardAmount(e.target.value)} 
                        placeholder="0.00"
                        className="w-full h-8 px-2 text-sm border rounded-lg text-center" 
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">UPI</label>
                      <input 
                        type="number" 
                        value={upiAmount} 
                        onChange={(e) => setUpiAmount(e.target.value)} 
                        placeholder="0.00"
                        className="w-full h-8 px-2 text-sm border rounded-lg text-center" 
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-600 text-center">
                    Total Split: {currency}{getTotalSplitAmount().toFixed(2)} / {currency}{calculateTotal().toFixed(2)}
                  </div>
                </div>
              )}
              
              {/* Payment Summary */}
              {((showReceivedAmount && receivedAmount) || splitPayment) && (
                <div className="bg-white p-2 rounded border mt-2 text-xs space-y-1">
                  <div className="flex justify-between font-medium">
                    <span>Bill Total:</span>
                    <span>{currency}{calculateTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount Received:</span>
                    <span>{currency}{calculateReceivedAmount().toFixed(2)}</span>
                  </div>
                  {isPartialPayment() && (
                    <div className="flex justify-between text-red-600 font-medium">
                      <span>Balance Due:</span>
                      <span>{currency}{calculateBalanceAmount().toFixed(2)}</span>
                    </div>
                  )}
                  {isOverPayment() && (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>Change to Return:</span>
                      <span>{currency}{calculateChangeAmount().toFixed(2)}</span>
                    </div>
                  )}
                  {calculateReceivedAmount() === calculateTotal() && (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>Status:</span>
                      <span>EXACT PAYMENT</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            {!paymentCompleted ? (
              <Button onClick={handlePayment} disabled={loading} className="w-full h-12 mt-3 text-lg font-bold bg-gradient-to-r from-violet-600 to-purple-600 rounded-lg">
                {loading ? <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : (
                  splitPayment ? (
                    getTotalSplitAmount() === 0 ? 'Enter Split Payment Amounts' :
                    getTotalSplitAmount() < calculateTotal() ? `Record Split Payment ${currency}${getTotalSplitAmount().toFixed(0)} (Due: ${currency}${(calculateTotal() - getTotalSplitAmount()).toFixed(0)})` :
                    getTotalSplitAmount() > calculateTotal() ? `Pay Split ${currency}${getTotalSplitAmount().toFixed(0)} (Change: ${currency}${(getTotalSplitAmount() - calculateTotal()).toFixed(0)})` :
                    `Pay Split ${currency}${getTotalSplitAmount().toFixed(0)}`
                  ) : showReceivedAmount && receivedAmount ? (
                    isPartialPayment() ? `Record Partial Payment ${currency}${calculateReceivedAmount().toFixed(0)}` :
                    isOverPayment() ? `Pay ${currency}${calculateReceivedAmount().toFixed(0)} (Change: ${currency}${calculateChangeAmount().toFixed(0)})` :
                    `Pay ${currency}${calculateReceivedAmount().toFixed(0)}`
                  ) : `Pay ${currency}${calculateTotal().toFixed(0)}`
                )}
              </Button>
            ) : (
              <div className="bg-green-100 border border-green-300 rounded-lg p-2 mt-3 flex items-center gap-2">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center"><Check className="w-4 h-4 text-white" /></div>
                <div><p className="font-bold text-green-800 text-sm">Paid!</p><p className="text-xs text-green-600">{currency}{calculateTotal().toFixed(0)} via {paymentMethod}</p></div>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2 mt-3">
              <Button variant="outline" size="sm" onClick={() => printReceipt(orderData, businessSettings)} className="h-9"><Printer className="w-4 h-4 mr-1" />Print</Button>
              <Button variant="outline" size="sm" onClick={downloadBillPDF} className="h-9"><Download className="w-4 h-4 mr-1" />PDF</Button>
              <Button variant="outline" size="sm" onClick={() => setShowWhatsappModal(true)} className="h-9 border-green-500 text-green-600"><MessageCircle className="w-4 h-4 mr-1" />Share</Button>
            </div>
            {paymentCompleted && <Button variant="ghost" size="sm" onClick={() => navigate('/orders')} className="w-full mt-2">← Back</Button>}
          </CardContent>
        </Card>
      </div>


      {/* ========== DESKTOP LAYOUT - FULL WIDTH ========== */}
      <div className="hidden lg:flex h-[calc(100vh-80px)] gap-4 p-4">
        {/* Left Panel - Items (65%) */}
        <div className="flex-[3] flex flex-col bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span className="text-2xl font-bold">#{order.invoice_number || order.id.slice(0, 6)}</span>
              <span className="text-violet-200 text-lg">{order.table_number ? `Table ${order.table_number}` : 'Counter Order'}</span>
            </div>
            <span className="text-violet-200">{new Date(order.created_at).toLocaleString()}</span>
          </div>
          <div className="p-4 border-b">
            {/* Smart Search Bar - Desktop */}
            <div className="relative" ref={dropdownRef}>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input 
                    placeholder="Search menu or type item name..." 
                    value={searchQuery} 
                    onChange={(e) => { setSearchQuery(e.target.value); setShowMenuDropdown(true); }} 
                    onFocus={() => setShowMenuDropdown(true)} 
                    className="pl-12 h-12 text-lg" 
                  />
                </div>
                {!hasMatches && searchQuery.trim() && (
                  <>
                    <Input type="number" placeholder="₹ Price" value={customPrice} onChange={(e) => setCustomPrice(e.target.value)} className="w-32 h-12 text-lg" />
                    <Button onClick={handleAddCustomItem} className="h-12 px-6 bg-green-600 hover:bg-green-700 text-lg"><Plus className="w-5 h-5 mr-2" />Add</Button>
                  </>
                )}
              </div>
              {showMenuDropdown && searchQuery.trim() && (
                <div className="absolute z-20 w-full mt-1 bg-white border rounded-xl shadow-2xl max-h-80 overflow-y-auto" style={{ touchAction: 'pan-y' }}>
                  {hasMatches ? (
                    filteredMenuItems.slice(0, 12).map(item => (
                      <div 
                        key={item.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          isSelectingRef.current = true;
                          handleAddMenuItem(item);
                        }}
                        onTouchStart={() => { isSelectingRef.current = true; }}
                        onTouchEnd={(e) => {
                          e.preventDefault();
                          handleAddMenuItem(item);
                        }}
                        className="w-full px-4 py-4 text-left hover:bg-violet-50 active:bg-violet-100 flex justify-between items-center text-lg border-b last:border-0 cursor-pointer select-none"
                        style={{ touchAction: 'manipulation' }}
                      >
                        <span className="font-medium">{item.name}</span><span className="text-violet-600 font-bold">{currency}{item.price}</span>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-gray-500">
                      No menu item found. Enter price to add "<span className="font-semibold text-gray-700">{searchQuery}</span>" as custom item.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {orderItems.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-xl">Search and add items to the order</div>
            ) : (
              <div className="space-y-2">
                {orderItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleItemQuantityChange(idx, -1)} className="w-12 h-12 bg-white border-2 hover:border-violet-300 rounded-xl text-xl font-bold flex items-center justify-center">−</button>
                      <span className="w-14 h-12 bg-violet-600 text-white rounded-xl flex items-center justify-center text-xl font-bold">{item.quantity}</span>
                      <button onClick={() => handleItemQuantityChange(idx, 1)} className="w-12 h-12 bg-white border-2 hover:border-violet-300 rounded-xl text-xl font-bold flex items-center justify-center">+</button>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-xl">{item.name}</p>
                      <p className="text-gray-500">{currency}{item.price} each</p>
                    </div>
                    <span className="text-2xl font-bold text-violet-600">{currency}{(item.price * item.quantity).toFixed(0)}</span>
                    <button onClick={() => handleRemoveItem(idx)} className="w-12 h-12 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl flex items-center justify-center"><Trash2 className="w-6 h-6" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Payment (35%) */}
        <div className="flex-[2] flex flex-col bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 border-b space-y-4">
            <div className="flex justify-between text-lg"><span className="text-gray-500">Subtotal</span><span className="font-semibold">{currency}{calculateSubtotal().toFixed(0)}</span></div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="text-gray-500">Discount</span>
                <select value={discountType} onChange={(e) => { setDiscountType(e.target.value); setDiscountValue(''); }} className="px-3 py-2 border rounded-lg bg-white text-base">
                  <option value="amount">₹ Amount</option><option value="percent">% Percent</option>
                </select>
                <input type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} placeholder="0" className="w-24 px-3 py-2 border rounded-lg text-center text-base" />
                <div className="flex gap-1">
                  {[5, 10, 15, 20].map(p => (
                    <button key={p} onClick={() => { setDiscountType('percent'); setDiscountValue(p.toString()); }} className={`px-4 py-2 rounded-lg font-medium transition-all ${discountType === 'percent' && discountValue === p.toString() ? 'bg-green-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>{p}%</button>
                  ))}
                </div>
              </div>
              <span className="text-green-600 font-semibold text-lg">{discountAmt > 0 ? `-${currency}${discountAmt.toFixed(0)}` : '—'}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="text-gray-500">Tax</span>
                <select value={customTaxRate !== null ? customTaxRate : getEffectiveTaxRate()} onChange={(e) => setCustomTaxRate(Number(e.target.value))} className="px-3 py-2 border rounded-lg bg-white text-base">
                  <option value="0">0%</option><option value="5">5%</option><option value="12">12%</option><option value="18">18%</option><option value="28">28%</option>
                </select>
              </div>
              <span className="font-semibold text-lg">{currency}{calculateTax().toFixed(0)}</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t-2 border-dashed">
              <span className="text-3xl font-bold">Total</span>
              <span className="text-4xl font-bold text-violet-600">{currency}{calculateTotal().toFixed(0)}</span>
            </div>
          </div>
          <div className="p-6 border-b">
            <p className="text-sm text-gray-500 mb-4 font-semibold uppercase tracking-wide">Payment Method</p>
            <div className="grid grid-cols-3 gap-4">
              {[{ id: 'cash', icon: Wallet, label: 'Cash', color: '#22c55e' }, { id: 'card', icon: CreditCard, label: 'Card', color: '#3b82f6' }, { id: 'upi', icon: Smartphone, label: 'UPI', color: '#8b5cf6' }].map(m => (
                <button key={m.id} onClick={() => setPaymentMethod(m.id)} className={`py-5 rounded-xl flex flex-col items-center gap-2 border-2 transition-all ${paymentMethod === m.id ? 'text-white border-transparent shadow-lg scale-105' : 'bg-white border-gray-200 hover:border-gray-300'}`} style={paymentMethod === m.id ? { backgroundColor: m.color } : {}}>
                  <m.icon className="w-8 h-8" /><span className="font-semibold text-lg">{m.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="p-6 flex-1 flex flex-col">
            {!paymentCompleted ? (
              <Button onClick={handlePayment} disabled={loading} className="w-full h-16 text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 rounded-xl shadow-xl">
                {loading ? <div className="animate-spin w-6 h-6 border-3 border-white border-t-transparent rounded-full" /> : <>Pay {currency}{calculateTotal().toFixed(0)}</>}
              </Button>
            ) : (
              <div className="bg-green-50 border-2 border-green-300 rounded-xl p-5 flex items-center gap-4">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center"><Check className="w-8 h-8 text-white" /></div>
                <div><p className="text-2xl font-bold text-green-800">Payment Successful!</p><p className="text-green-600 text-lg">{currency}{calculateTotal().toFixed(0)} paid via {paymentMethod.toUpperCase()}</p></div>
              </div>
            )}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <Button variant="outline" onClick={() => printReceipt(orderData, businessSettings)} className="h-14 text-lg"><Printer className="w-5 h-5 mr-2" />Print</Button>
              <Button variant="outline" onClick={downloadBillPDF} className="h-14 text-lg"><Download className="w-5 h-5 mr-2" />PDF</Button>
              <Button variant="outline" onClick={() => setShowWhatsappModal(true)} className="h-14 text-lg border-green-500 text-green-600 hover:bg-green-50"><MessageCircle className="w-5 h-5 mr-2" />Share</Button>
            </div>
            {paymentCompleted && <Button variant="ghost" onClick={() => navigate('/orders')} className="w-full mt-4 h-12 text-lg">← Back to Orders</Button>}
          </div>
        </div>
      </div>

      {/* Customer Info Modal for Partial Payments */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Customer Information</h3>
                <button 
                  onClick={() => setShowCustomerModal(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                For partial payments, please provide customer details:
              </p>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Customer Name *</Label>
                  <Input 
                    placeholder="Enter customer name" 
                    value={customerName} 
                    onChange={(e) => setCustomerName(e.target.value)} 
                    className="h-12 text-lg mt-1" 
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Phone Number *</Label>
                  <Input 
                    placeholder="+91 9876543210" 
                    value={customerPhone} 
                    onChange={(e) => setCustomerPhone(e.target.value)} 
                    className="h-12 text-lg mt-1" 
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCustomerModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    try {
                      if (!customerName.trim()) {
                        toast.error('Please enter customer name');
                        return;
                      }
                      if (!customerPhone.trim()) {
                        toast.error('Please enter phone number');
                        return;
                      }
                      setShowCustomerModal(false);
                      processPayment();
                    } catch (error) {
                      console.error('Error in customer modal:', error);
                      toast.error('Error processing customer information');
                    }
                  }}
                  className="flex-1 bg-violet-600 hover:bg-violet-700"
                  disabled={!customerName.trim() || !customerPhone.trim()}
                >
                  Continue Payment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* WhatsApp Modal */}
      {showWhatsappModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Share via WhatsApp</h3>
                <button onClick={() => setShowWhatsappModal(false)}><X className="w-6 h-6" /></button>
              </div>
              <Input placeholder="+91 9876543210" value={whatsappPhone} onChange={(e) => setWhatsappPhone(e.target.value)} className="mb-4 h-12 text-lg" />
              <Button onClick={handleWhatsappShare} className="w-full h-12 bg-green-600 hover:bg-green-700 text-lg"><MessageCircle className="w-5 h-5 mr-2" />Send Receipt</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </Layout>
  );
};

export default BillingPage;
