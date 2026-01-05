import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, CreditCard, Wallet, Smartphone, Download, MessageCircle, X, Check, Plus, Trash2, Search } from 'lucide-react';
import { printReceipt } from '../utils/printUtils';

const BillingPage = ({ user }) => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
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

  useEffect(() => {
    fetchOrder();
    fetchBusinessSettings();
    fetchMenuItems();
  }, [orderId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowMenuDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
      const response = await axios.get(`${API}/menu`);
      const items = Array.isArray(response.data) ? response.data : [];
      setMenuItems(items.filter(item => item.available));
    } catch (error) {
      console.error('Failed to fetch menu items', error);
    }
  };

  const getCurrencySymbol = () => {
    const symbols = { 'INR': '₹', 'USD': '$', 'EUR': '€', 'GBP': '£' };
    return symbols[businessSettings?.currency || 'INR'] || '₹';
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

  const handlePayment = async () => {
    if (!order) return;
    const updated = await updateOrderItems();
    if (!updated) return;
    setLoading(true);
    try {
      await axios.post(`${API}/payments/create-order`, { order_id: orderId, amount: calculateTotal(), payment_method: paymentMethod });
      await axios.put(`${API}/orders/${orderId}`, {
        status: 'completed', payment_method: paymentMethod, discount: calculateDiscountAmount(),
        discount_type: discountType, discount_value: parseFloat(discountValue) || 0, discount_amount: calculateDiscountAmount(), total: calculateTotal()
      });
      toast.success('Payment completed!');
      setPaymentCompleted(true);
      await releaseTable();
      const discountAmt = calculateDiscountAmount();
      printReceipt({ ...order, items: orderItems, subtotal: calculateSubtotal(), tax: calculateTax(), total: calculateTotal(), discount: discountAmt, discount_amount: discountAmt, tax_rate: getEffectiveTaxRate() }, businessSettings);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Payment failed');
    } finally {
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
              
              {/* Fixed Position Dropdown for Mobile - Ensures it's always clickable */}
              {showMenuDropdown && searchQuery.trim() && hasMatches && (
                <div className="fixed inset-x-0 top-auto bottom-0 z-[100] bg-white border-t-2 border-violet-300 shadow-2xl rounded-t-2xl max-h-[50vh] overflow-hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
                  {/* Header with close */}
                  <div className="sticky top-0 bg-violet-600 text-white px-4 py-3 flex justify-between items-center">
                    <span className="font-bold">Select Item ({filteredMenuItems.length} found)</span>
                    <button 
                      onClick={() => setShowMenuDropdown(false)}
                      className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  {/* Items List */}
                  <div className="overflow-y-auto max-h-[40vh]">
                    {filteredMenuItems.slice(0, 10).map((item, index) => (
                      <div 
                        key={item.id} 
                        className={`px-4 py-4 flex justify-between items-center border-b border-gray-100 active:bg-violet-100 ${index === 0 ? 'bg-violet-50' : ''}`}
                        onClick={() => handleAddMenuItem(item)}
                        onTouchEnd={(e) => { e.preventDefault(); handleAddMenuItem(item); }}
                      >
                        <div className="flex items-center gap-3">
                          {index === 0 && <span className="text-xs bg-violet-600 text-white px-2 py-0.5 rounded">⏎</span>}
                          <span className={`font-medium ${index === 0 ? 'text-violet-700' : 'text-gray-800'}`}>{item.name}</span>
                        </div>
                        <span className="text-violet-600 font-bold text-lg">{currency}{item.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Backdrop when dropdown is open */}
              {showMenuDropdown && searchQuery.trim() && hasMatches && (
                <div 
                  className="fixed inset-0 bg-black/30 z-[99]" 
                  onClick={() => setShowMenuDropdown(false)}
                />
              )}
              
              {/* No match message */}
              {showMenuDropdown && searchQuery.trim() && !hasMatches && (
                <div className="absolute z-20 w-full mt-1 bg-orange-50 border border-orange-200 rounded-lg p-3">
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
            <div className="grid grid-cols-3 gap-2 mt-3">
              {[{ id: 'cash', icon: Wallet, label: 'Cash', color: '#22c55e' }, { id: 'card', icon: CreditCard, label: 'Card', color: '#3b82f6' }, { id: 'upi', icon: Smartphone, label: 'UPI', color: '#8b5cf6' }].map(m => (
                <button key={m.id} onClick={() => setPaymentMethod(m.id)} className={`py-2 rounded-lg flex flex-col items-center gap-1 border-2 ${paymentMethod === m.id ? 'text-white border-transparent' : 'bg-white border-gray-200'}`} style={paymentMethod === m.id ? { backgroundColor: m.color } : {}}>
                  <m.icon className="w-5 h-5" /><span className="text-xs font-medium">{m.label}</span>
                </button>
              ))}
            </div>
            {!paymentCompleted ? (
              <Button onClick={handlePayment} disabled={loading} className="w-full h-12 mt-3 text-lg font-bold bg-gradient-to-r from-violet-600 to-purple-600 rounded-lg">
                {loading ? <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : <>Pay {currency}{calculateTotal().toFixed(0)}</>}
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
                      <button 
                        key={item.id} 
                        onClick={() => handleAddMenuItem(item)} 
                        onTouchEnd={(e) => { e.preventDefault(); handleAddMenuItem(item); }}
                        className="w-full px-4 py-4 text-left hover:bg-violet-50 active:bg-violet-100 flex justify-between items-center text-lg border-b last:border-0 cursor-pointer select-none"
                        style={{ touchAction: 'manipulation' }}
                      >
                        <span className="font-medium">{item.name}</span><span className="text-violet-600 font-bold">{currency}{item.price}</span>
                      </button>
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
