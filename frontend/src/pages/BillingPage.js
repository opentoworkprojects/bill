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
  Calculator, Percent, DollarSign, Gift, Users, Clock, CheckCircle,
  AlertCircle, TrendingUp, Receipt, Zap, Star
} from 'lucide-react';
import { printReceipt as printReceiptUtil, getPrintSettings, generateReceiptContent, printDocument } from '../utils/printUtils';

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
  const [customAmount, setCustomAmount] = useState('');
  const [showCalculator, setShowCalculator] = useState(false);
  const [showSplitBill, setShowSplitBill] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [customerRating, setCustomerRating] = useState(0);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [receiptContent, setReceiptContent] = useState('');
  const [thermalPaperSize, setThermalPaperSize] = useState('80mm'); // 58mm or 80mm

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
      // Use centralized print utility with global settings
      const settings = getPrintSettings();
      const content = generateReceiptContent(order, businessSettings);
      
      // Store receipt content for preview
      setReceiptContent(content);
      setShowPrintPreview(true);
      
      // Update thermal paper size from settings
      setThermalPaperSize(settings.paper_width || '80mm');
      
      toast.success('Receipt ready for printing!');
    } catch (error) {
      console.error('Failed to print bill', error);
      toast.error('Failed to generate receipt');
    }
  };

  const handleActualPrint = () => {
    // Use centralized print utility
    const settings = getPrintSettings();
    printDocument(receiptContent, `Receipt - ${order?.id?.slice(0, 8)}`, 'receipt');
  };

  const handlePopupPrint = () => {
    // Use centralized print utility
    printDocument(receiptContent, `Receipt - ${order?.id?.slice(0, 8)}`, 'receipt');
    toast.success('Receipt opened for printing');
  };

  const closePrintPreview = () => {
    setShowPrintPreview(false);
  };

  // Old popup code completely removed - now using inline modal

  const downloadBillPDF = async () => {
    if (!order) return;
    try {
      // Generate PDF using jsPDF
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      
      // Restaurant details
      const restaurantName = businessSettings?.restaurant_name || 'Restaurant';
      const address = businessSettings?.address || '';
      const phone = businessSettings?.phone || '';
      const gst = businessSettings?.gst_number || '';
      
      // Header
      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.text(restaurantName, 105, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      if (address) doc.text(address, 105, 28, { align: 'center' });
      if (phone) doc.text(`Phone: ${phone}`, 105, 34, { align: 'center' });
      if (gst) doc.text(`GSTIN: ${gst}`, 105, 40, { align: 'center' });
      
      // Line
      doc.line(20, 45, 190, 45);
      
      // Invoice details
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('INVOICE', 105, 52, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Invoice #: ${order.id.slice(0, 8).toUpperCase()}`, 20, 60);
      doc.text(`Date: ${new Date(order.created_at).toLocaleString()}`, 20, 66);
      if (order.table_number) doc.text(`Table: ${order.table_number}`, 20, 72);
      if (order.customer_name) doc.text(`Customer: ${order.customer_name}`, 20, 78);
      
      // Items table
      let yPos = 90;
      doc.setFont(undefined, 'bold');
      doc.text('Item', 20, yPos);
      doc.text('Qty', 120, yPos, { align: 'right' });
      doc.text('Price', 150, yPos, { align: 'right' });
      doc.text('Total', 180, yPos, { align: 'right' });
      
      doc.line(20, yPos + 2, 190, yPos + 2);
      yPos += 8;
      
      doc.setFont(undefined, 'normal');
      order.items.forEach(item => {
        doc.text(item.name, 20, yPos);
        doc.text(item.quantity.toString(), 120, yPos, { align: 'right' });
        doc.text(`${getCurrencySymbol()}${item.price.toFixed(2)}`, 150, yPos, { align: 'right' });
        doc.text(`${getCurrencySymbol()}${(item.quantity * item.price).toFixed(2)}`, 180, yPos, { align: 'right' });
        yPos += 6;
      });
      
      // Totals
      yPos += 5;
      doc.line(20, yPos, 190, yPos);
      yPos += 8;
      
      const subtotal = order.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
      const tax = order.tax || 0;
      const discount = order.discount || 0;
      const total = order.total;
      
      doc.text('Subtotal:', 130, yPos);
      doc.text(`${getCurrencySymbol()}${subtotal.toFixed(2)}`, 180, yPos, { align: 'right' });
      yPos += 6;
      
      if (discount > 0) {
        doc.text('Discount:', 130, yPos);
        doc.text(`-${getCurrencySymbol()}${discount.toFixed(2)}`, 180, yPos, { align: 'right' });
        yPos += 6;
      }
      
      if (tax > 0) {
        doc.text('Tax:', 130, yPos);
        doc.text(`${getCurrencySymbol()}${tax.toFixed(2)}`, 180, yPos, { align: 'right' });
        yPos += 6;
      }
      
      doc.setFont(undefined, 'bold');
      doc.setFontSize(12);
      doc.text('Total:', 130, yPos);
      doc.text(`${getCurrencySymbol()}${total.toFixed(2)}`, 180, yPos, { align: 'right' });
      
      // Payment method
      yPos += 10;
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Payment Method: ${order.payment_method || 'Cash'}`, 20, yPos);
      
      // Footer
      yPos += 15;
      doc.setFontSize(9);
      doc.text('Thank you for your business!', 105, yPos, { align: 'center' });
      yPos += 5;
      doc.text('Powered by BillByteKOT - billbytekot.in', 105, yPos, { align: 'center' });
      
      // Save PDF
      doc.save(`invoice-${order.id.slice(0, 8)}.pdf`);
      toast.success('Invoice downloaded as PDF!');
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

  const calculateDiscount = () => {
    if (!order) return 0;
    if (discountType === 'percentage') {
      return (order.subtotal * discount) / 100;
    }
    return discount;
  };

  const calculateFinalTotal = () => {
    if (!order) return 0;
    const discountAmount = calculateDiscount();
    return order.total - discountAmount + tip;
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
              <div>
                <p className="text-gray-500">Table Number</p>
                <p className="font-medium">{order.table_number}</p>
              </div>
              <div>
                <p className="text-gray-500">Waiter</p>
                <p className="font-medium">{order.waiter_name}</p>
              </div>
              {order.customer_name && (
                <div>
                  <p className="text-gray-500">Customer</p>
                  <p className="font-medium">{order.customer_name}</p>
                </div>
              )}
              <div>
                <p className="text-gray-500">Date & Time</p>
                <p className="font-medium">{new Date(order.created_at).toLocaleString()}</p>
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
                <span>Tax ({businessSettings?.tax_rate || 5}%):</span>
                <span>{getCurrencySymbol()}{order.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-2xl font-bold text-violet-600 pt-2 border-t" data-testid="order-total">
                <span>Total:</span>
                <span>{getCurrencySymbol()}{order.total.toFixed(2)}</span>
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
              <div className="flex justify-between text-sm opacity-90">
                <span>Tax:</span>
                <span>{getCurrencySymbol()}{order?.tax.toFixed(2)}</span>
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
                {loading ? 'Processing...' : paymentCompleted ? '✓ Paid' : `Pay ${getCurrencySymbol()}${order.total.toFixed(2)}`}
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

      {/* Inline Print Preview Modal */}
      {showPrintPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-auto bg-slate-800 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="sticky top-0 z-10 px-6 py-5 bg-gradient-to-r from-indigo-600 to-purple-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Receipt className="w-6 h-6 text-white" />
                  <div>
                    <h3 className="text-lg font-bold text-white">Receipt Preview</h3>
                    <p className="text-sm text-indigo-100">Order #{order?.id?.slice(0, 8)}</p>
                  </div>
                </div>
                <button
                  onClick={closePrintPreview}
                  className="p-2 text-white transition-colors rounded-lg hover:bg-white/20"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Paper Size Selector */}
              <div className="mt-4 flex items-center gap-3">
                <span className="text-sm text-indigo-100 font-medium">Paper Size:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setThermalPaperSize('58mm')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      thermalPaperSize === '58mm'
                        ? 'bg-white text-indigo-600 shadow-lg'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    58mm
                  </button>
                  <button
                    onClick={() => setThermalPaperSize('80mm')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      thermalPaperSize === '80mm'
                        ? 'bg-white text-indigo-600 shadow-lg'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    80mm
                  </button>
                </div>
              </div>
            </div>

            {/* Receipt Content */}
            <div className="p-6">
              <div className="relative p-5 bg-gradient-to-b from-slate-700 to-slate-800 rounded-2xl">
                <div 
                  className="bg-white rounded-xl shadow-xl overflow-hidden mx-auto"
                  style={{ 
                    maxWidth: thermalPaperSize === '58mm' ? '220px' : '302px',
                    width: '100%'
                  }}
                >
                  <pre 
                    className="p-4 font-mono leading-relaxed text-gray-900 whitespace-pre-wrap"
                    style={{ 
                      fontSize: thermalPaperSize === '58mm' ? '10px' : '12px',
                      lineHeight: '1.3'
                    }}
                  >
                    {receiptContent}
                  </pre>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="sticky bottom-0 flex gap-3 px-6 py-5 bg-slate-800 border-t border-slate-700">
              <button
                onClick={handleActualPrint}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 text-white font-semibold bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                <Printer className="w-5 h-5" />
                Print Receipt
              </button>
              <button
                onClick={handlePopupPrint}
                className="flex items-center justify-center gap-2 px-6 py-3 text-white font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all"
                title="Open in new window"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={closePrintPreview}
                className="px-6 py-3 text-slate-300 font-semibold bg-slate-700 rounded-xl hover:bg-slate-600 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default BillingPage;
