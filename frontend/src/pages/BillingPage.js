import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, CreditCard, Wallet, Smartphone, Download } from 'lucide-react';

const BillingPage = ({ user }) => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [businessSettings, setBusinessSettings] = useState(null);

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
          name: businessSettings?.restaurant_name || 'RestoBill AI',
          description: `Payment for Order #${orderId.slice(0, 8)}`,
          handler: async (razorpayResponse) => {
            try {
              await axios.post(`${API}/payments/verify`, {
                razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                razorpay_order_id: razorpayResponse.razorpay_order_id,
                order_id: orderId
              });
              toast.success('Payment successful!');
              await printThermalBill();
              setTimeout(() => navigate('/orders'), 1500);
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
        await printThermalBill();
        setTimeout(() => navigate('/orders'), 1500);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const printThermalBill = async () => {
    if (!order) return;
    try {
      // Get thermal receipt from backend
      const response = await axios.post(`${API}/print/bill/${orderId}`, null, {
        params: { theme: businessSettings?.receipt_theme || 'classic' }
      });
      
      // Create a printable window with thermal receipt styling
      const printWindow = window.open('', '', 'width=300,height=600');
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt - Order #${order.id.slice(0, 8)}</title>
            <style>
              @media print {
                @page {
                  size: 80mm auto;
                  margin: 0;
                }
                body {
                  margin: 0;
                  padding: 0;
                }
              }
              body {
                font-family: 'Courier New', monospace;
                font-size: 12px;
                line-height: 1.4;
                padding: 10px;
                margin: 0;
                width: 80mm;
                background: white;
              }
              pre {
                margin: 0;
                padding: 0;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                white-space: pre-wrap;
                word-wrap: break-word;
              }
              .no-print {
                display: block;
                text-align: center;
                margin: 20px 0;
              }
              @media print {
                .no-print {
                  display: none;
                }
              }
            </style>
          </head>
          <body>
            <pre>${response.data.content}</pre>
            <div class="no-print">
              <button onclick="window.print()" style="padding: 10px 20px; background: #7c3aed; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">Print Receipt</button>
              <button onclick="window.close()" style="padding: 10px 20px; background: #gray; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px; margin-left: 10px;">Close</button>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      
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
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 h-12 text-lg"
                data-testid="complete-payment-button"
              >
                {loading ? 'Processing...' : `Pay ${getCurrencySymbol()}${order.total.toFixed(2)}`}
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
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default BillingPage;