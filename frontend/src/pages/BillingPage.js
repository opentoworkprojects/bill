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
import { Printer, CreditCard, Wallet, Smartphone, Download, MessageCircle, X } from 'lucide-react';

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
    if (!order?.table_id) return;
    
    try {
      // Update table status to available
      await axios.put(`${API}/tables/${order.table_id}`, {
        table_number: order.table_number,
        capacity: 4, // Default capacity
        status: 'available',
        current_order_id: null
      });
      toast.success(`Table ${order.table_number} is now available`);
    } catch (error) {
      console.error('Failed to release table', error);
      // Don't show error to user, it's not critical
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
                font-family: 'Courier New', 'Consolas', monospace;
                font-size: ${fontSize};
                line-height: 1.3;
                padding: 5mm;
                margin: 0;
                width: ${paperWidth};
                background: white;
                color: black;
              }
              pre {
                margin: 0;
                padding: 0;
                font-family: 'Courier New', 'Consolas', monospace;
                font-size: ${fontSize};
                white-space: pre-wrap;
                word-wrap: break-word;
                line-height: 1.3;
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
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                border: 1px solid #e5e7eb;
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
      const response = await axios.post(`${API}/print/bill/${orderId}`, null, {
        params: { theme: businessSettings?.receipt_theme || 'classic' }
      });
      
      const blob = new Blob([response.data.content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${order.id.slice(0, 8)}.txt`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Receipt downloaded!');
    } catch (error) {
      toast.error('Failed to download receipt');
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

  return (
    <Layout user={user}>
      <div className="max-w-2xl mx-auto space-y-6" data-testid="billing-page">
        <div>
          <h1 className="text-4xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Billing & Payment</h1>
          <p className="text-gray-600 mt-2">Complete payment for order #{order.id.slice(0, 8)}</p>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
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
