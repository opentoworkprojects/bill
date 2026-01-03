import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Printer, CreditCard, Wallet, Smartphone, Download, MessageCircle, X,
  Calculator, Percent, Gift, Users, Receipt, Zap
} from 'lucide-react';
import { printReceipt, getPrintSettings, generateReceiptHTML, printThermal } from '../utils/printUtils';

const BillingPage = ({ user }) => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [businessSettings, setBusinessSettings] = useState(null);
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('percentage'); // percentage or fixed
  const [tip, setTip] = useState(0);
  const [splitBill, setSplitBill] = useState(1);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showSplitBill, setShowSplitBill] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [customTaxRate, setCustomTaxRate] = useState(null); // null means use settings

  useEffect(() => {
    fetchOrder();
    fetchBusinessSettings();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await axios.get(`${API}/orders/${orderId}`);
      setOrder(response.data);
      // Auto-fill customer phone if available
      if (response.data.customer_phone) {
        setWhatsappPhone(response.data.customer_phone);
      }
    } catch (error) {
      toast.error('Failed to fetch order');
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

  const releaseTable = async () => {
    // Skip table release if KOT mode is disabled or no table assigned
    const kotEnabled = businessSettings?.kot_mode_enabled !== false;
    if (!kotEnabled || !order?.table_id || order.table_id === 'counter') {
      console.log('Skipping table release - KOT disabled or counter order');
      return;
    }
    
    try {
      // First, get the current table data
      const tableResponse = await axios.get(`${API}/tables/${order.table_id}`);
      const currentTable = tableResponse.data;
      
      // Update table status to available
      await axios.put(`${API}/tables/${order.table_id}`, {
        table_number: currentTable.table_number,
        capacity: currentTable.capacity || 4,
        status: 'available',
        current_order_id: null
      });
      
      console.log(`Table ${order.table_number} released successfully`);
      toast.success(`✅ Table ${order.table_number} is now available`, {
        duration: 3000,
        icon: '🪑'
      });
    } catch (error) {
      console.error('Failed to release table:', error);
      toast.error(`Could not release table ${order.table_number}`);
    }
  };

  const deductInventory = async () => {
    if (!order?.items) return;
    
    try {
      // Deduct inventory for each item
      for (const item of order.items) {
        try {
          await axios.post(`${API}/inventory/deduct`, {
            menu_item_id: item.menu_item_id,
            quantity: item.quantity
          });
        } catch (error) {
          console.error(`Failed to deduct inventory for ${item.name}`, error);
        }
      }
    } catch (error) {
      console.error('Failed to deduct inventory', error);
    }
  };

  const handlePayment = async () => {
    if (!order) return;
    setLoading(true);
    try {
      // Process payment (Cash, Card, or UPI)
      await axios.post(`${API}/payments/create-order`, {
        order_id: orderId,
        amount: order.total,
        payment_method: paymentMethod
      });
      toast.success('Payment completed!');
      setPaymentCompleted(true);
      
      // Update order status to completed
      await axios.put(`${API}/orders/${orderId}`, { status: 'completed' });
      
      // Release table automatically
      await releaseTable();
      
      // Deduct inventory if enabled
      await deductInventory();
      
      await printThermalBill();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsappShare = async () => {
    if (!whatsappPhone.trim()) {
      toast.error('Please enter a phone number');
      return;
    }
    
    setWhatsappLoading(true);
    try {
      const response = await axios.post(`${API}/whatsapp/send-receipt/${orderId}`, {
        phone_number: whatsappPhone,
        customer_name: order?.customer_name
      });
      
      // Open WhatsApp link in new tab
      window.open(response.data.whatsapp_link, '_blank');
      toast.success('Opening WhatsApp...');
      setShowWhatsappModal(false);
      setWhatsappPhone('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to generate WhatsApp link');
    } finally {
      setWhatsappLoading(false);
    }
  };

  const printThermalBill = async () => {
    if (!order) return;
    try {
      // Direct thermal print using the new utility
      const success = printReceipt(order, businessSettings);
      if (success) {
        toast.success('Printing receipt...');
      }
    } catch (error) {
      console.error('Failed to print bill', error);
      toast.error('Failed to print receipt');
    }
  };

  const downloadBillPDF = async () => {
    if (!order) return;
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      
      // Colors
      const primaryColor = [124, 58, 237]; // Violet
      const darkColor = [31, 41, 55];
      const grayColor = [107, 114, 128];
      const lightGray = [243, 244, 246];
      
      // Restaurant details
      const restaurantName = businessSettings?.restaurant_name || 'Restaurant';
      const address = businessSettings?.address || '';
      const phone = businessSettings?.phone || '';
      const email = businessSettings?.email || '';
      const gstin = businessSettings?.gstin || '';
      const fssai = businessSettings?.fssai || '';
      const website = businessSettings?.website || '';
      const tagline = businessSettings?.tagline || '';
      const currency = getCurrencySymbol();
      
      // Page dimensions
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      
      // ===== HEADER SECTION =====
      // Purple header bar
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, pageWidth, 45, 'F');
      
      // Restaurant name
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont(undefined, 'bold');
      doc.text(restaurantName, margin, 22);
      
      // Tagline
      if (tagline) {
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(tagline, margin, 32);
      }
      
      // Invoice label on right
      doc.setFontSize(28);
      doc.setFont(undefined, 'bold');
      doc.text('INVOICE', pageWidth - margin, 25, { align: 'right' });
      
      // Invoice number below
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`#${order.invoice_number || order.id.slice(0, 8).toUpperCase()}`, pageWidth - margin, 35, { align: 'right' });
      
      // ===== BUSINESS & CUSTOMER INFO =====
      let yPos = 55;
      
      // Left side - Business details
      doc.setTextColor(...darkColor);
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text('FROM:', margin, yPos);
      doc.setFont(undefined, 'normal');
      yPos += 5;
      
      doc.setFontSize(8);
      doc.setTextColor(...grayColor);
      if (address) { doc.text(address, margin, yPos); yPos += 4; }
      if (phone) { doc.text(`📞 ${phone}`, margin, yPos); yPos += 4; }
      if (email) { doc.text(`✉️ ${email}`, margin, yPos); yPos += 4; }
      if (website) { doc.text(`🌐 ${website}`, margin, yPos); yPos += 4; }
      if (gstin) { doc.text(`GSTIN: ${gstin}`, margin, yPos); yPos += 4; }
      if (fssai) { doc.text(`FSSAI: ${fssai}`, margin, yPos); yPos += 4; }
      
      // Right side - Invoice details box
      const boxX = pageWidth - margin - 70;
      const boxY = 50;
      doc.setFillColor(...lightGray);
      doc.roundedRect(boxX, boxY, 70, 35, 3, 3, 'F');
      
      doc.setTextColor(...darkColor);
      doc.setFontSize(8);
      let rightY = boxY + 8;
      
      doc.setFont(undefined, 'bold');
      doc.text('Invoice Date:', boxX + 5, rightY);
      doc.setFont(undefined, 'normal');
      doc.text(new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), boxX + 35, rightY);
      rightY += 6;
      
      doc.setFont(undefined, 'bold');
      doc.text('Time:', boxX + 5, rightY);
      doc.setFont(undefined, 'normal');
      doc.text(new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), boxX + 35, rightY);
      rightY += 6;
      
      if (order.table_number && order.table_number !== 0) {
        doc.setFont(undefined, 'bold');
        doc.text('Table:', boxX + 5, rightY);
        doc.setFont(undefined, 'normal');
        doc.text(`#${order.table_number}`, boxX + 35, rightY);
        rightY += 6;
      }
      
      doc.setFont(undefined, 'bold');
      doc.text('Order Type:', boxX + 5, rightY);
      doc.setFont(undefined, 'normal');
      const orderTypeLabel = order.order_type === 'dine_in' ? 'Dine In' : order.order_type === 'takeaway' ? 'Takeaway' : order.order_type === 'delivery' ? 'Delivery' : 'Dine In';
      doc.text(orderTypeLabel, boxX + 35, rightY);
      
      // Customer info (if available)
      if (order.customer_name || order.customer_phone) {
        yPos = Math.max(yPos, 90);
        doc.setFillColor(...lightGray);
        doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 18, 2, 2, 'F');
        
        doc.setTextColor(...darkColor);
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text('BILL TO:', margin + 5, yPos + 7);
        doc.setFont(undefined, 'normal');
        const customerInfo = [order.customer_name, order.customer_phone].filter(Boolean).join(' • ');
        doc.text(customerInfo, margin + 30, yPos + 7);
        
        if (order.waiter_name) {
          doc.text(`Served by: ${order.waiter_name}`, pageWidth - margin - 5, yPos + 7, { align: 'right' });
        }
        yPos += 25;
      } else {
        yPos = Math.max(yPos + 10, 95);
      }
      
      // ===== ITEMS TABLE =====
      // Table header
      doc.setFillColor(...primaryColor);
      doc.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text('ITEM', margin + 5, yPos + 7);
      doc.text('QTY', pageWidth - margin - 65, yPos + 7, { align: 'center' });
      doc.text('PRICE', pageWidth - margin - 35, yPos + 7, { align: 'right' });
      doc.text('AMOUNT', pageWidth - margin - 5, yPos + 7, { align: 'right' });
      
      yPos += 12;
      
      // Table rows
      doc.setTextColor(...darkColor);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      
      let isAlternate = false;
      order.items.forEach((item, index) => {
        // Alternate row background
        if (isAlternate) {
          doc.setFillColor(250, 250, 252);
          doc.rect(margin, yPos - 4, pageWidth - 2 * margin, 8, 'F');
        }
        isAlternate = !isAlternate;
        
        // Item name (truncate if too long)
        const itemName = item.name.length > 35 ? item.name.substring(0, 35) + '...' : item.name;
        doc.text(itemName, margin + 5, yPos);
        doc.text(item.quantity.toString(), pageWidth - margin - 65, yPos, { align: 'center' });
        doc.text(`${currency}${item.price.toFixed(2)}`, pageWidth - margin - 35, yPos, { align: 'right' });
        doc.text(`${currency}${(item.quantity * item.price).toFixed(2)}`, pageWidth - margin - 5, yPos, { align: 'right' });
        
        // Item notes if any
        if (item.notes) {
          doc.setFontSize(7);
          doc.setTextColor(...grayColor);
          yPos += 4;
          doc.text(`  Note: ${item.notes}`, margin + 5, yPos);
          doc.setFontSize(9);
          doc.setTextColor(...darkColor);
        }
        
        yPos += 8;
      });
      
      // Line after items
      doc.setDrawColor(...grayColor);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;
      
      // ===== TOTALS SECTION =====
      const totalsX = pageWidth - margin - 80;
      
      // Subtotal
      doc.setFontSize(9);
      doc.setTextColor(...grayColor);
      doc.text('Subtotal:', totalsX, yPos);
      doc.setTextColor(...darkColor);
      doc.text(`${currency}${order.subtotal.toFixed(2)}`, pageWidth - margin - 5, yPos, { align: 'right' });
      yPos += 6;
      
      // Discount (if any)
      const discountAmount = calculateDiscount();
      if (discountAmount > 0) {
        doc.setTextColor(34, 197, 94); // Green
        doc.text('Discount:', totalsX, yPos);
        doc.text(`-${currency}${discountAmount.toFixed(2)}`, pageWidth - margin - 5, yPos, { align: 'right' });
        yPos += 6;
      }
      
      // Tax
      const taxAmount = calculateTax();
      const taxRate = getEffectiveTaxRate();
      doc.setTextColor(...grayColor);
      doc.text(`Tax (${taxRate}%):`, totalsX, yPos);
      doc.setTextColor(...darkColor);
      doc.text(`${currency}${taxAmount.toFixed(2)}`, pageWidth - margin - 5, yPos, { align: 'right' });
      yPos += 6;
      
      // Tip (if any)
      if (tip > 0) {
        doc.setTextColor(...grayColor);
        doc.text('Tip:', totalsX, yPos);
        doc.setTextColor(...darkColor);
        doc.text(`${currency}${tip.toFixed(2)}`, pageWidth - margin - 5, yPos, { align: 'right' });
        yPos += 6;
      }
      
      // Total box
      yPos += 2;
      doc.setFillColor(...primaryColor);
      doc.roundedRect(totalsX - 5, yPos - 4, pageWidth - margin - totalsX + 10, 14, 2, 2, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('TOTAL:', totalsX, yPos + 5);
      doc.text(`${currency}${calculateFinalTotal().toFixed(2)}`, pageWidth - margin - 5, yPos + 5, { align: 'right' });
      
      yPos += 20;
      
      // ===== PAYMENT INFO =====
      doc.setTextColor(...darkColor);
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text('Payment Method:', margin, yPos);
      doc.setFont(undefined, 'normal');
      
      const paymentMethodLabel = {
        'cash': '💵 Cash',
        'card': '💳 Card',
        'upi': '📱 UPI',
        'credit': '📝 Credit',
        'split': '🔀 Split Payment'
      }[order.payment_method] || 'Cash';
      doc.text(paymentMethodLabel, margin + 40, yPos);
      
      // Payment status
      const isPaid = !order.is_credit && order.balance_amount <= 0;
      doc.setFont(undefined, 'bold');
      if (isPaid) {
        doc.setTextColor(34, 197, 94);
        doc.text('✓ PAID', pageWidth - margin, yPos, { align: 'right' });
      } else {
        doc.setTextColor(239, 68, 68);
        doc.text(`BALANCE: ${currency}${(order.balance_amount || 0).toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
      }
      
      // ===== FOOTER =====
      // Thank you message
      yPos = pageHeight - 35;
      doc.setDrawColor(...lightGray);
      doc.line(margin, yPos - 5, pageWidth - margin, yPos - 5);
      
      doc.setTextColor(...darkColor);
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('Thank you for your visit!', pageWidth / 2, yPos, { align: 'center' });
      
      // Footer message
      const footerMsg = businessSettings?.footer_message || 'We hope to serve you again soon.';
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...grayColor);
      doc.text(footerMsg, pageWidth / 2, yPos + 6, { align: 'center' });
      
      // Powered by
      doc.setFontSize(7);
      doc.text('Generated by BillByteKOT • billbytekot.in', pageWidth / 2, yPos + 14, { align: 'center' });
      
      // Save PDF
      const fileName = `Invoice-${order.invoice_number || order.id.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      toast.success('Invoice downloaded!');
    } catch (error) {
      console.error('Failed to generate PDF', error);
      toast.error('Failed to download invoice');
    }
  };

  if (!order) {
    return (
      <Layout user={user}>
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500">Loading order...</p>
        </div>
      </Layout>
    );
  }

  const getCurrencySymbol = () => {
    const symbols = {
      'INR': '₹',
      'USD': '$',
      'EUR': '€',
      'GBP': '£'
    };
    return symbols[businessSettings?.currency || 'INR'] || '₹';
  };

  // Get effective tax rate (custom or from order's stored tax_rate or from settings)
  const getEffectiveTaxRate = () => {
    if (customTaxRate !== null) return customTaxRate;
    // Use the tax_rate stored with the order (not recalculated from settings)
    if (order && order.tax_rate !== undefined) {
      return order.tax_rate;
    }
    // Fallback: Calculate from order's tax/subtotal for old orders without tax_rate field
    if (order && order.subtotal > 0 && order.tax !== undefined) {
      const orderTaxRate = (order.tax / order.subtotal) * 100;
      return Math.round(orderTaxRate * 100) / 100;
    }
    return businessSettings?.tax_rate ?? 0;
  };

  // Calculate tax based on effective rate
  const calculateTax = () => {
    if (!order) return 0;
    // If order already has tax calculated, use it (unless custom rate is set)
    if (customTaxRate === null && order.tax !== undefined) {
      return order.tax;
    }
    return (order.subtotal * getEffectiveTaxRate()) / 100;
  };

  const calculateDiscount = () => {
    if (!order) return 0;
    if (discountType === 'percentage') {
      return (order.subtotal * discount) / 100;
    }
    return discount;
  };

  const calculateFinalTotal = () => {
    if (!order) return 0;
    const subtotal = order.subtotal;
    const taxAmount = calculateTax();
    const discountAmount = calculateDiscount();
    return subtotal + taxAmount - discountAmount + tip;
  };

  const calculateSplitAmount = () => {
    return calculateFinalTotal() / splitBill;
  };

  const applyQuickDiscount = (percentage) => {
    setDiscountType('percentage');
    setDiscount(percentage);
    setShowDiscount(true);
  };

  const applyQuickTip = (amount) => {
    setTip(amount);
    setShowTip(true);
  };

  return (
    <Layout user={user}>
      <div className="max-w-2xl mx-auto space-y-6" data-testid="billing-page">
        <div>
          <h1 className="text-4xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Billing & Payment</h1>
          <p className="text-gray-600 mt-2">Complete payment for order #{order.id.slice(0, 8)}</p>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Order Details</CardTitle>
              {/* Order Type Badge */}
              {order.order_type && (
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  order.order_type === 'dine_in' ? 'bg-blue-100 text-blue-800' :
                  order.order_type === 'takeaway' ? 'bg-green-100 text-green-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {order.order_type === 'dine_in' && '🍽️ Dine In'}
                  {order.order_type === 'takeaway' && '📦 Takeaway'}
                  {order.order_type === 'delivery' && '🚚 Delivery'}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="min-w-0">
                <p className="text-gray-500">Table Number</p>
                <p className="font-medium">{order.table_number}</p>
              </div>
              <div className="min-w-0">
                <p className="text-gray-500">Waiter</p>
                <p className="font-medium truncate" title={order.waiter_name}>{order.waiter_name}</p>
              </div>
              {order.customer_name && (
                <div className="min-w-0">
                  <p className="text-gray-500">Customer</p>
                  <p className="font-medium truncate" title={order.customer_name}>{order.customer_name}</p>
                </div>
              )}
              <div className="min-w-0">
                <p className="text-gray-500">Date & Time</p>
                <p className="font-medium text-xs sm:text-sm">{new Date(order.created_at).toLocaleString()}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium mb-3">Items</h3>
              <div className="space-y-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm" data-testid={`order-item-${idx}`}>
                    <span>{item.quantity}x {item.name}</span>
                    <span className="font-medium">{getCurrencySymbol()}{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-medium">{getCurrencySymbol()}{order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Tax ({getEffectiveTaxRate()}%):</span>
                <span>{getCurrencySymbol()}{calculateTax().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-2xl font-bold text-violet-600 pt-2 border-t" data-testid="order-total">
                <span>Total:</span>
                <span>{getCurrencySymbol()}{(order.subtotal + calculateTax()).toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-violet-50 to-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-violet-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDiscount(!showDiscount)}
                className="h-20 flex-col gap-2"
              >
                <Percent className="w-6 h-6 text-green-600" />
                <span className="text-sm">Discount</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowTip(!showTip)}
                className="h-20 flex-col gap-2"
              >
                <Gift className="w-6 h-6 text-blue-600" />
                <span className="text-sm">Add Tip</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowSplitBill(!showSplitBill)}
                className="h-20 flex-col gap-2"
              >
                <Users className="w-6 h-6 text-purple-600" />
                <span className="text-sm">Split Bill</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCalculator(!showCalculator)}
                className="h-20 flex-col gap-2"
              >
                <Calculator className="w-6 h-6 text-orange-600" />
                <span className="text-sm">Calculator</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Discount Section */}
        {showDiscount && (
          <Card className="border-0 shadow-xl border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Percent className="w-5 h-5" />
                Apply Discount
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                {[5, 10, 15, 20].map(percent => (
                  <Button
                    key={percent}
                    variant="outline"
                    size="sm"
                    onClick={() => applyQuickDiscount(percent)}
                    className={discount === percent && discountType === 'percentage' ? 'bg-green-100 border-green-500' : ''}
                  >
                    {percent}%
                  </Button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Discount Type</Label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="w-full h-10 px-3 border rounded-md"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount ({getCurrencySymbol()})</option>
                  </select>
                </div>
                <div>
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  Discount: <strong>{getCurrencySymbol()}{calculateDiscount().toFixed(2)}</strong>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tip Section */}
        {showTip && (
          <Card className="border-0 shadow-xl border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Gift className="w-5 h-5" />
                Add Tip
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-2">
                {[10, 20, 50, 100].map(amount => (
                  <Button
                    key={amount}
                    variant="outline"
                    onClick={() => applyQuickTip(amount)}
                    className={tip === amount ? 'bg-blue-100 border-blue-500' : ''}
                  >
                    {getCurrencySymbol()}{amount}
                  </Button>
                ))}
              </div>
              <div>
                <Label>Custom Tip Amount</Label>
                <Input
                  type="number"
                  value={tip}
                  onChange={(e) => setTip(Number(e.target.value))}
                  placeholder="0"
                />
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  Tip Amount: <strong>{getCurrencySymbol()}{tip.toFixed(2)}</strong>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Split Bill Section */}
        {showSplitBill && (
          <Card className="border-0 shadow-xl border-l-4 border-l-purple-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-700">
                <Users className="w-5 h-5" />
                Split Bill
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Number of People</Label>
                <div className="flex gap-2 items-center">
                  <Button
                    variant="outline"
                    onClick={() => setSplitBill(Math.max(1, splitBill - 1))}
                  >
                    -
                  </Button>
                  <Input
                    type="number"
                    value={splitBill}
                    onChange={(e) => setSplitBill(Math.max(1, Number(e.target.value)))}
                    className="text-center"
                    min="1"
                  />
                  <Button
                    variant="outline"
                    onClick={() => setSplitBill(splitBill + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-purple-600 mb-2">Amount per person</p>
                  <p className="text-3xl font-bold text-purple-700">
                    {getCurrencySymbol()}{calculateSplitAmount().toFixed(2)}
                  </p>
                  <p className="text-xs text-purple-500 mt-2">
                    Total: {getCurrencySymbol()}{calculateFinalTotal().toFixed(2)} ÷ {splitBill} people
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Final Total Summary */}
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-violet-600 to-purple-600 text-white">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm opacity-90">
                <span>Subtotal:</span>
                <span>{getCurrencySymbol()}{order?.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm opacity-90">
                <div className="flex items-center gap-2">
                  <span>Tax ({getEffectiveTaxRate()}%):</span>
                  <select
                    value={customTaxRate !== null ? customTaxRate : (order?.tax_rate ?? businessSettings?.tax_rate ?? 5)}
                    onChange={(e) => setCustomTaxRate(Number(e.target.value))}
                    className="bg-white/20 text-white text-xs px-2 py-1 rounded border border-white/30"
                  >
                    <option value="0" className="text-gray-800">No Tax (0%)</option>
                    <option value="5" className="text-gray-800">5%</option>
                    <option value="12" className="text-gray-800">12%</option>
                    <option value="18" className="text-gray-800">18%</option>
                    <option value="28" className="text-gray-800">28%</option>
                  </select>
                </div>
                <span>{getCurrencySymbol()}{calculateTax().toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-green-300">
                  <span>Discount:</span>
                  <span>- {getCurrencySymbol()}{calculateDiscount().toFixed(2)}</span>
                </div>
              )}
              {tip > 0 && (
                <div className="flex justify-between text-sm text-blue-300">
                  <span>Tip:</span>
                  <span>+ {getCurrencySymbol()}{tip.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-white/20 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold">Final Total:</span>
                  <span className="text-3xl font-bold">{getCurrencySymbol()}{calculateFinalTotal().toFixed(2)}</span>
                </div>
                {splitBill > 1 && (
                  <div className="text-right text-sm opacity-90 mt-1">
                    {getCurrencySymbol()}{calculateSplitAmount().toFixed(2)} per person
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`p-4 border-2 rounded-xl flex flex-col items-center gap-2 transition-all ${
                  paymentMethod === 'cash' ? 'border-violet-600 bg-violet-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                data-testid="payment-cash"
              >
                <Wallet className="w-8 h-8 text-violet-600" />
                <span className="font-medium">Cash</span>
              </button>

              <button
                onClick={() => setPaymentMethod('card')}
                className={`p-4 border-2 rounded-xl flex flex-col items-center gap-2 transition-all ${
                  paymentMethod === 'card' ? 'border-violet-600 bg-violet-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                data-testid="payment-card"
              >
                <CreditCard className="w-8 h-8 text-violet-600" />
                <span className="font-medium">Card</span>
              </button>

              <button
                onClick={() => setPaymentMethod('upi')}
                className={`p-4 border-2 rounded-xl flex flex-col items-center gap-2 transition-all ${
                  paymentMethod === 'upi' ? 'border-violet-600 bg-violet-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                data-testid="payment-upi"
              >
                <Smartphone className="w-8 h-8 text-violet-600" />
                <span className="font-medium">UPI</span>
              </button>

            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handlePayment}
                disabled={loading || paymentCompleted}
                className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 h-12 text-lg"
                data-testid="complete-payment-button"
              >
                {loading ? 'Processing...' : paymentCompleted ? '✓ Paid' : `Pay ${getCurrencySymbol()}${calculateFinalTotal().toFixed(2)}`}
              </Button>
              <Button
                variant="outline"
                onClick={printThermalBill}
                className="h-12 px-6"
                data-testid="print-bill-button"
                title="Print Thermal Receipt"
              >
                <Printer className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                onClick={downloadBillPDF}
                className="h-12 px-6"
                data-testid="download-bill-button"
                title="Download Receipt"
              >
                <Download className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowWhatsappModal(true)}
                className="h-12 px-6 border-green-500 text-green-600 hover:bg-green-50"
                data-testid="whatsapp-share-button"
                title="Share via WhatsApp"
              >
                <MessageCircle className="w-5 h-5" />
              </Button>
            </div>

            {/* Post-payment actions */}
            {paymentCompleted && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium mb-3">✅ Payment Completed!</p>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    onClick={() => setShowWhatsappModal(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Send Receipt via WhatsApp
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate('/orders')}
                  >
                    Back to Orders
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* WhatsApp Modal */}
        {showWhatsappModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md border-0 shadow-2xl">
              <CardHeader className="relative">
                <button
                  onClick={() => setShowWhatsappModal(false)}
                  className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                  Share Receipt via WhatsApp
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Customer Phone Number</Label>
                  <Input
                    placeholder="+91 9876543210"
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter with country code (e.g., +91 for India)</p>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>Order:</strong> #{orderId?.slice(0, 8)}<br />
                    <strong>Amount:</strong> {getCurrencySymbol()}{order?.total?.toFixed(2)}<br />
                    <strong>Customer:</strong> {order?.customer_name || 'Guest'}
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleWhatsappShare}
                    disabled={whatsappLoading}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {whatsappLoading ? 'Opening...' : 'Open WhatsApp'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowWhatsappModal(false)}
                  >
                    Cancel
                  </Button>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  This will open WhatsApp with a pre-filled receipt message
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BillingPage;
