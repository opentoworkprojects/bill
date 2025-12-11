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

  useEffect(() => {
    fetchOrder();
    fetchBusinessSettings();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await axios.get(`${API}/orders/${orderId}`);
      setOrder(response.data);
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
    if (!order?.table_id) {
      console.log('No table_id found in order');
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
      if (paymentMethod === 'razorpay') {
        const response = await axios.post(`${API}/payments/create-order`, {
          order_id: orderId,
          amount: order.total,
          payment_method: 'razorpay'
        });

        const options = {
          key: response.data.key_id,
          amount: response.data.amount,
          currency: response.data.currency,
          order_id: response.data.razorpay_order_id,
          name: businessSettings?.restaurant_name || 'BillByteKOT AI',
          description: `Payment for Order #${orderId.slice(0, 8)}`,
          handler: async (razorpayResponse) => {
            try {
              await axios.post(`${API}/payments/verify`, {
                razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                razorpay_order_id: razorpayResponse.razorpay_order_id,
                order_id: orderId
              });
              toast.success('Payment successful!');
              setPaymentCompleted(true);
              
              // Update order status to completed
              await axios.put(`${API}/orders/${orderId}`, { status: 'completed' });
              
              // Release table automatically
              await releaseTable();
              
              // Deduct inventory if enabled
              await deductInventory();
              
              await printThermalBill();
            } catch (error) {
              toast.error('Payment verification failed');
            }
          },
          prefill: {
            name: order.customer_name || 'Customer',
            contact: '9999999999'
          },
          theme: {
            color: '#7c3aed'
          }
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } else {
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
      }
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
      // Get thermal receipt from backend
      const response = await axios.post(`${API}/print/bill/${orderId}`, null, {
        params: { theme: businessSettings?.receipt_theme || 'classic' }
      });
      
      // Determine paper width based on theme
      const isCompact = businessSettings?.receipt_theme === 'compact';
      const paperWidth = isCompact ? '58mm' : '80mm';
      const fontSize = isCompact ? '10px' : '12px';
      
      // Create a printable window with thermal receipt styling
      const printWindow = window.open('', '', 'width=400,height=700');
      printWindow.document.write(`
        <html>
          <head>
            <title>Thermal Receipt - Order #${order.id.slice(0, 8)}</title>
            <style>
              @media print {
                @page {
                  size: ${paperWidth} auto;
                  margin: 0;
                }
                body {
                  margin: 0;
                  padding: 0;
                }
                .no-print {
                  display: none !important;
                }
              }
              body {
                font-family: 'Courier New', 'Courier', 'Consolas', 'Monaco', monospace;
                font-size: ${fontSize};
                line-height: 1.4;
                padding: 8mm 5mm;
                margin: 0;
                width: ${paperWidth};
                background: white;
                color: #000;
              }
              pre {
                margin: 0;
                padding: 0;
                font-family: 'Courier New', 'Courier', 'Consolas', 'Monaco', monospace;
                font-size: ${fontSize};
                white-space: pre;
                word-wrap: normal;
                line-height: 1.5;
                letter-spacing: 0.5px;
              }
              .no-print {
                display: flex;
                gap: 10px;
                justify-content: center;
                margin: 20px 0;
                padding: 20px;
                background: #f3f4f6;
                border-radius: 8px;
              }
              .btn {
                padding: 12px 24px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 600;
                transition: all 0.2s;
              }
              .btn-print {
                background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
                color: white;
              }
              .btn-print:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
              }
              .btn-close {
                background: #6b7280;
                color: white;
              }
              .btn-close:hover {
                background: #4b5563;
              }
              .preview-container {
                max-width: 400px;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
              }
              .preview-header {
                text-align: center;
                padding: 24px 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                font-family: 'Segoe UI', Arial, sans-serif;
                position: relative;
                overflow: hidden;
              }
              .preview-header::before {
                content: '';
                position: absolute;
                top: -50%;
                right: -50%;
                width: 200%;
                height: 200%;
                background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
                animation: shimmer 3s infinite;
              }
              @keyframes shimmer {
                0%, 100% { transform: translate(0, 0); }
                50% { transform: translate(-20px, -20px); }
              }
              .preview-header h2 {
                margin: 0;
                font-size: 24px;
                font-weight: 700;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                position: relative;
                z-index: 1;
              }
              .preview-header p {
                margin: 8px 0 0 0;
                font-size: 13px;
                opacity: 0.95;
                position: relative;
                z-index: 1;
              }
              .preview-badge {
                display: inline-block;
                background: rgba(255, 255, 255, 0.2);
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 11px;
                margin-top: 8px;
                backdrop-filter: blur(10px);
              }
              .receipt-content {
                padding: 20px;
                background: #f8f9fa;
              }
              .receipt-paper {
                background: #ffffff;
                padding: 24px 20px;
                border-radius: 8px;
                box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
                border: 1px solid #e5e7eb;
                max-width: 100%;
                overflow-x: auto;
              }
              .receipt-paper pre {
                background: #fafafa;
                padding: 16px;
                border-radius: 6px;
                border: 1px dashed #d1d5db;
              }
              .action-buttons {
                padding: 20px;
                display: flex;
                gap: 12px;
                background: white;
                border-top: 1px solid #e5e7eb;
              }
              .btn {
                flex: 1;
                padding: 14px 24px;
                border: none;
                border-radius: 10px;
                font-size: 15px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
              }
              .btn-print {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
              }
              .btn-print:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
              }
              .btn-print:active {
                transform: translateY(0);
              }
              .btn-close {
                background: #f3f4f6;
                color: #374151;
              }
              .btn-close:hover {
                background: #e5e7eb;
              }
              @media print {
                .preview-header,
                .action-buttons,
                .receipt-content {
                  display: none;
                }
                .receipt-paper {
                  box-shadow: none;
                  border: none;
                  padding: 0;
                }
                .preview-container {
                  box-shadow: none;
                  max-width: none;
                }
              }
            </style>
          </head>
          <body>
            <div class="preview-container">
              <div class="preview-header no-print">
                <h2>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                  Thermal Receipt Preview
                </h2>
                <p>Ready to print on ${paperWidth} thermal paper</p>
                <div class="preview-badge">
                  ${businessSettings?.receipt_theme || 'classic'} theme
                </div>
              </div>
              
              <div class="receipt-content no-print">
                <div class="receipt-paper">
                  <pre>${response.data.content}</pre>
                </div>
              </div>
              
              <div class="receipt-paper" style="display: none;">
                <pre>${response.data.content}</pre>
              </div>
              
              <div class="action-buttons no-print">
                <button onclick="window.print()" class="btn btn-print">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 6 2 18 2 18 9"></polyline>
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                    <rect x="6" y="14" width="12" height="8"></rect>
                  </svg>
                  Print Receipt
                </button>
                <button onclick="window.close()" class="btn btn-close">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                  Close
                </button>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      
      // Auto-trigger print dialog after a short delay
      setTimeout(() => {
        printWindow.focus();
      }, 250);
      
      toast.success('Receipt ready for printing!');
    } catch (error) {
      console.error('Failed to print bill', error);
      toast.error('Failed to generate receipt');
    }
  };

  const downloadBill = async () => {
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

              <button
                onClick={() => setPaymentMethod('razorpay')}
                className={`p-4 border-2 rounded-xl flex flex-col items-center gap-2 transition-all ${
                  paymentMethod === 'razorpay' ? 'border-violet-600 bg-violet-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                data-testid="payment-razorpay"
              >
                <CreditCard className="w-8 h-8 text-violet-600" />
                <span className="font-medium">Razorpay</span>
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
                onClick={downloadBill}
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
