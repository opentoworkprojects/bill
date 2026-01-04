import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, CreditCard, Wallet, Smartphone, Download, MessageCircle, X, ArrowLeft, Check, Plus, Minus, Trash2 } from 'lucide-react';
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
  const [discount, setDiscount] = useState(0);
  const [customTaxRate, setCustomTaxRate] = useState(null);
  const [manualItemName, setManualItemName] = useState('');
  const [manualItemPrice, setManualItemPrice] = useState('');
  const [orderItems, setOrderItems] = useState([]);

  useEffect(() => {
    fetchOrder();
    fetchBusinessSettings();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await axios.get(`${API}/orders/${orderId}`);
      setOrder(response.data);
      setOrderItems(response.data.items || []);
      if (response.data.customer_phone) {
        setWhatsappPhone(response.data.customer_phone);
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

  const getCurrencySymbol = () => {
    const symbols = { 'INR': '₹', 'USD': '$', 'EUR': '€', 'GBP': '£' };
    return symbols[businessSettings?.currency || 'INR'] || '₹';
  };

  const getEffectiveTaxRate = () => {
    if (customTaxRate !== null) return customTaxRate;
    if (order?.tax_rate !== undefined) return order.tax_rate;
    if (order?.subtotal > 0 && order?.tax !== undefined) {
      return Math.round((order.tax / order.subtotal) * 100 * 100) / 100;
    }
    return businessSettings?.tax_rate ?? 5;
  };

  const calculateSubtotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    return (subtotal * getEffectiveTaxRate()) / 100;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() - discount;
  };

  // Manual item functions
  const handleAddManualItem = () => {
    const name = manualItemName.trim();
    const price = parseFloat(manualItemPrice) || 0;
    
    if (!name) {
      toast.error('Enter item name');
      return;
    }
    if (price <= 0) {
      toast.error('Enter valid price');
      return;
    }
    
    setOrderItems([...orderItems, {
      menu_item_id: `manual_${Date.now()}`,
      name: name,
      price: price,
      quantity: 1,
      notes: 'Manual entry'
    }]);
    
    setManualItemName('');
    setManualItemPrice('');
    toast.success(`Added: ${name}`);
  };

  const handleItemQuantityChange = (index, delta) => {
    const updated = [...orderItems];
    const newQty = updated[index].quantity + delta;
    if (newQty < 1) {
      // Remove item if quantity goes to 0
      updated.splice(index, 1);
    } else {
      updated[index].quantity = newQty;
    }
    setOrderItems(updated);
  };

  const handleRemoveItem = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  // Update order with new items before payment
  const updateOrderItems = async () => {
    if (orderItems.length === 0) {
      toast.error('Order must have at least one item');
      return false;
    }
    
    try {
      const subtotal = calculateSubtotal();
      const tax = calculateTax();
      const total = calculateTotal();
      
      await axios.put(`${API}/orders/${orderId}`, {
        items: orderItems,
        subtotal,
        tax,
        tax_rate: getEffectiveTaxRate(),
        total,
        discount: discount
      });
      
      // Update local order state
      setOrder(prev => ({
        ...prev,
        items: orderItems,
        subtotal,
        tax,
        total
      }));
      
      return true;
    } catch (error) {
      console.error('Failed to update order items:', error);
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
        table_number: tableResponse.data.table_number,
        capacity: tableResponse.data.capacity || 4,
        status: 'available',
        current_order_id: null
      });
      toast.success(`Table ${order.table_number} released`);
    } catch (error) {
      console.error('Failed to release table:', error);
    }
  };

  const handlePayment = async () => {
    if (!order) return;
    
    // First update order items if changed
    const updated = await updateOrderItems();
    if (!updated) return;
    
    setLoading(true);
    try {
      await axios.post(`${API}/payments/create-order`, {
        order_id: orderId,
        amount: calculateTotal(),
        payment_method: paymentMethod
      });
      
      await axios.put(`${API}/orders/${orderId}`, { 
        status: 'completed',
        payment_method: paymentMethod,
        discount: discount,
        total: calculateTotal()
      });
      
      toast.success('Payment completed!');
      setPaymentCompleted(true);
      await releaseTable();
      
      // Use updated order for printing
      const updatedOrder = { ...order, items: orderItems, subtotal: calculateSubtotal(), tax: calculateTax(), total: calculateTotal() };
      printReceipt(updatedOrder, businessSettings);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsappShare = async () => {
    if (!whatsappPhone.trim()) {
      toast.error('Enter phone number');
      return;
    }
    try {
      const response = await axios.post(`${API}/whatsapp/send-receipt/${orderId}`, {
        phone_number: whatsappPhone,
        customer_name: order?.customer_name
      });
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
      const currency = getCurrencySymbol();
      const restaurantName = businessSettings?.restaurant_name || 'Restaurant';
      
      // Header
      doc.setFillColor(124, 58, 237);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont(undefined, 'bold');
      doc.text(restaurantName, 15, 20);
      doc.setFontSize(10);
      doc.text('INVOICE', 195, 15, { align: 'right' });
      doc.text(`#${order.invoice_number || order.id.slice(0, 8).toUpperCase()}`, 195, 25, { align: 'right' });
      
      // Info
      let y = 55;
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(9);
      doc.text(`Date: ${new Date(order.created_at).toLocaleDateString()}`, 15, y);
      doc.text(`Time: ${new Date(order.created_at).toLocaleTimeString()}`, 100, y);
      if (order.table_number) doc.text(`Table: ${order.table_number}`, 160, y);
      y += 8;
      if (order.customer_name) { doc.text(`Customer: ${order.customer_name}`, 15, y); y += 6; }
      if (businessSettings?.address) { doc.text(businessSettings.address, 15, y); y += 6; }
      if (businessSettings?.gstin) { doc.text(`GSTIN: ${businessSettings.gstin}`, 15, y); y += 6; }
      
      // Items header
      y += 5;
      doc.setFillColor(245, 245, 250);
      doc.rect(15, y - 5, 180, 10, 'F');
      doc.setFont(undefined, 'bold');
      doc.text('Item', 20, y);
      doc.text('Qty', 120, y, { align: 'center' });
      doc.text('Price', 150, y, { align: 'right' });
      doc.text('Total', 190, y, { align: 'right' });
      y += 8;
      
      // Items
      doc.setFont(undefined, 'normal');
      orderItems.forEach(item => {
        doc.text(item.name.substring(0, 30), 20, y);
        doc.text(item.quantity.toString(), 120, y, { align: 'center' });
        doc.text(`${currency}${item.price}`, 150, y, { align: 'right' });
        doc.text(`${currency}${(item.quantity * item.price).toFixed(2)}`, 190, y, { align: 'right' });
        y += 7;
      });
      
      // Totals
      y += 5;
      doc.line(15, y, 195, y);
      y += 8;
      doc.text('Subtotal:', 140, y);
      doc.text(`${currency}${calculateSubtotal().toFixed(2)}`, 190, y, { align: 'right' });
      y += 6;
      doc.text(`Tax (${getEffectiveTaxRate()}%):`, 140, y);
      doc.text(`${currency}${calculateTax().toFixed(2)}`, 190, y, { align: 'right' });
      if (discount > 0) {
        y += 6;
        doc.setTextColor(34, 197, 94);
        doc.text('Discount:', 140, y);
        doc.text(`-${currency}${discount.toFixed(2)}`, 190, y, { align: 'right' });
        doc.setTextColor(50, 50, 50);
      }
      y += 8;
      doc.setFillColor(124, 58, 237);
      doc.rect(130, y - 5, 65, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, 'bold');
      doc.setFontSize(11);
      doc.text('TOTAL:', 135, y + 2);
      doc.text(`${currency}${calculateTotal().toFixed(2)}`, 190, y + 2, { align: 'right' });
      
      // Footer
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text('Thank you for your visit!', 105, 270, { align: 'center' });
      doc.setFontSize(7);
      doc.text('Generated by BillByteKOT • billbytekot.in', 105, 280, { align: 'center' });
      
      doc.save(`Invoice-${order.invoice_number || order.id.slice(0, 8)}.pdf`);
      toast.success('Invoice downloaded!');
    } catch (error) {
      toast.error('Failed to download');
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


  return (
    <Layout user={user}>
      <div className="max-w-md mx-auto pb-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button 
            onClick={() => navigate('/orders')} 
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Bill #{order.invoice_number || order.id.slice(0, 6)}</h1>
            <p className="text-sm text-gray-500">
              {order.table_number ? `Table ${order.table_number}` : 'Counter'} • {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </p>
          </div>
        </div>

        {/* Order Items */}
        <Card className="mb-4 border-0 shadow-lg">
          <CardContent className="p-4">
            {/* Manual Item Entry */}
            <div className="flex gap-2 mb-3 pb-3 border-b border-dashed">
              <Input
                placeholder="Item name"
                value={manualItemName}
                onChange={(e) => setManualItemName(e.target.value)}
                className="flex-1 h-9 text-sm"
              />
              <Input
                type="number"
                placeholder="₹"
                value={manualItemPrice}
                onChange={(e) => setManualItemPrice(e.target.value)}
                className="w-20 h-9 text-sm"
                min="0"
              />
              <Button 
                size="sm" 
                onClick={handleAddManualItem}
                className="h-9 px-3 bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-3">
              {orderItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleItemQuantityChange(idx, -1)}
                        className="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center text-sm"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-7 h-7 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center text-sm font-bold">
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => handleItemQuantityChange(idx, 1)}
                        className="w-6 h-6 bg-violet-600 hover:bg-violet-700 text-white rounded flex items-center justify-center text-sm"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="font-medium text-sm truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{currency}{(item.price * item.quantity).toFixed(0)}</span>
                    <button 
                      onClick={() => handleRemoveItem(idx)}
                      className="text-red-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Totals */}
            <div className="mt-4 pt-4 border-t border-dashed space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{currency}{calculateSubtotal().toFixed(0)}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <div className="flex items-center gap-2">
                  <span>Tax</span>
                  <select
                    value={customTaxRate !== null ? customTaxRate : getEffectiveTaxRate()}
                    onChange={(e) => setCustomTaxRate(Number(e.target.value))}
                    className="text-xs px-2 py-1 border rounded bg-gray-50"
                  >
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                </div>
                <span>{currency}{calculateTax().toFixed(0)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{currency}{discount.toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold pt-2 border-t">
                <span>Total</span>
                <span className="text-violet-600">{currency}{calculateTotal().toFixed(0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Discount */}
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-2">Quick Discount</p>
          <div className="flex gap-2">
            {[0, 5, 10, 15, 20].map(pct => (
              <button
                key={pct}
                onClick={() => setDiscount(pct === 0 ? 0 : (calculateSubtotal() * pct) / 100)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  (pct === 0 && discount === 0) || (pct > 0 && Math.round((discount / calculateSubtotal()) * 100) === pct)
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {pct === 0 ? 'None' : `${pct}%`}
              </button>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-2">Payment Method</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'cash', icon: Wallet, label: 'Cash', color: 'green' },
              { id: 'card', icon: CreditCard, label: 'Card', color: 'blue' },
              { id: 'upi', icon: Smartphone, label: 'UPI', color: 'purple' }
            ].map(method => (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id)}
                className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${
                  paymentMethod === method.id
                    ? `bg-${method.color}-500 text-white shadow-lg scale-105`
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
                style={paymentMethod === method.id ? {
                  backgroundColor: method.color === 'green' ? '#22c55e' : method.color === 'blue' ? '#3b82f6' : '#8b5cf6'
                } : {}}
              >
                <method.icon className="w-6 h-6" />
                <span className="text-sm font-medium">{method.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Pay Button */}
        {!paymentCompleted ? (
          <Button
            onClick={handlePayment}
            disabled={loading}
            className="w-full h-14 text-lg font-bold bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 rounded-xl shadow-lg"
          >
            {loading ? (
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>Pay {currency}{calculateTotal().toFixed(0)}</>
            )}
          </Button>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <Check className="w-6 h-6 text-white" />
            </div>
            <p className="font-bold text-green-800">Payment Successful!</p>
            <p className="text-sm text-green-600">{currency}{calculateTotal().toFixed(0)} paid via {paymentMethod}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => {
              const updatedOrder = { ...order, items: orderItems, subtotal: calculateSubtotal(), tax: calculateTax(), total: calculateTotal() };
              printReceipt(updatedOrder, businessSettings);
            }}
            className="flex-1 h-12"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button
            variant="outline"
            onClick={downloadBillPDF}
            className="flex-1 h-12"
          >
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowWhatsappModal(true)}
            className="flex-1 h-12 border-green-500 text-green-600 hover:bg-green-50"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>

        {/* Back to Orders */}
        {paymentCompleted && (
          <Button
            variant="ghost"
            onClick={() => navigate('/orders')}
            className="w-full mt-4"
          >
            ← Back to Orders
          </Button>
        )}

        {/* WhatsApp Modal */}
        {showWhatsappModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-sm">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold">Share via WhatsApp</h3>
                  <button onClick={() => setShowWhatsappModal(false)}>
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <Input
                  placeholder="+91 9876543210"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  className="mb-4"
                />
                <Button
                  onClick={handleWhatsappShare}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Send Receipt
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BillingPage;
