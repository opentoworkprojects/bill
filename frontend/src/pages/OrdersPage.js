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
import { Plus, Eye, Printer, CreditCard, MessageCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const OrdersPage = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [formData, setFormData] = useState({
    table_id: '',
    customer_name: '',
    customer_phone: ''
  });
  const [whatsappModal, setWhatsappModal] = useState({ open: false, orderId: null, customerName: '' });
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
    fetchTables();
    fetchMenuItems();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API}/orders`);
      setOrders(response.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (error) {
      toast.error('Failed to fetch orders');
    }
  };

  const fetchTables = async () => {
    try {
      const response = await axios.get(`${API}/tables`);
      setTables(response.data);
    } catch (error) {
      toast.error('Failed to fetch tables');
    }
  };

  const fetchMenuItems = async () => {
    try {
      const response = await axios.get(`${API}/menu`);
      setMenuItems(response.data.filter(item => item.available));
    } catch (error) {
      toast.error('Failed to fetch menu');
    }
  };

  const handleAddItem = (menuItem) => {
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
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleQuantityChange = (index, quantity) => {
    if (quantity < 1) return;
    const updated = [...selectedItems];
    updated[index].quantity = quantity;
    setSelectedItems(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      toast.error('Please add at least one item');
      return;
    }
    try {
      const selectedTable = tables.find(t => t.id === formData.table_id);
      const response = await axios.post(`${API}/orders`, {
        table_id: formData.table_id,
        table_number: selectedTable.table_number,
        items: selectedItems,
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        frontend_origin: window.location.origin  // Auto-pass current URL for tracking links
      });
      toast.success('Order created!');
      
      // If WhatsApp link is returned, offer to send notification
      if (response.data.whatsapp_link) {
        const sendNow = window.confirm('Send order confirmation to customer via WhatsApp?');
        if (sendNow) {
          window.open(response.data.whatsapp_link, '_blank');
        }
      }
      
      setDialogOpen(false);
      fetchOrders();
      fetchTables();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create order');
    }
  };

  const resetForm = () => {
    setFormData({ table_id: '', customer_name: '', customer_phone: '' });
    setSelectedItems([]);
  };

  const handleStatusChange = async (orderId, status) => {
    try {
      // Pass frontend_origin for tracking link generation
      const response = await axios.put(`${API}/orders/${orderId}/status?status=${status}&frontend_origin=${encodeURIComponent(window.location.origin)}`);
      toast.success('Order status updated!');
      
      // If WhatsApp link is returned, offer to send notification
      if (response.data.whatsapp_link && response.data.customer_phone) {
        const sendNow = window.confirm(`Send "${status}" update to customer via WhatsApp?`);
        if (sendNow) {
          window.open(response.data.whatsapp_link, '_blank');
        }
      }
      
      fetchOrders();
      fetchTables();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handlePrintKOT = async (order) => {
    try {
      const kotContent = `
=================================
        KITCHEN ORDER TICKET
=================================
Table: ${order.table_number}
Waiter: ${order.waiter_name}
Customer: ${order.customer_name || 'N/A'}
Time: ${new Date(order.created_at).toLocaleString()}
---------------------------------
ITEMS:
${order.items.map(item => `${item.quantity}x ${item.name}${item.notes ? `\n   Note: ${item.notes}` : ''}`).join('\n')}
---------------------------------
Status: ${order.status.toUpperCase()}
=================================
      `;
      await axios.post(`${API}/print`, {
        content: kotContent,
        type: 'kot'
      });
      window.print();
      toast.success('KOT sent to printer');
    } catch (error) {
      toast.error('Failed to print KOT');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700',
      preparing: 'bg-blue-100 text-blue-700',
      ready: 'bg-green-100 text-green-700',
      completed: 'bg-gray-100 text-gray-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const handleWhatsappShare = async () => {
    if (!whatsappPhone.trim()) {
      toast.error('Please enter a phone number');
      return;
    }
    
    try {
      const response = await axios.post(`${API}/whatsapp/send-receipt/${whatsappModal.orderId}`, {
        phone_number: whatsappPhone,
        customer_name: whatsappModal.customerName
      });
      
      window.open(response.data.whatsapp_link, '_blank');
      toast.success('Opening WhatsApp...');
      setWhatsappModal({ open: false, orderId: null, customerName: '' });
      setWhatsappPhone('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to generate WhatsApp link');
    }
  };

  return (
    <Layout user={user}>
      <div className="space-y-6" data-testid="orders-page">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Orders</h1>
            <p className="text-gray-600 mt-2">Manage restaurant orders</p>
          </div>
          {['admin', 'waiter', 'cashier'].includes(user?.role) && (
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-violet-600 to-purple-600" data-testid="create-order-button">
                  <Plus className="w-4 h-4 mr-2" />
                  New Order
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="order-dialog">
                <DialogHeader>
                  <DialogTitle>Create New Order</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label>Table</Label>
                      <select
                        className="w-full px-3 py-2 border rounded-md"
                        value={formData.table_id}
                        onChange={(e) => setFormData({ ...formData, table_id: e.target.value })}
                        required
                        data-testid="order-table-select"
                      >
                        <option value="">Select table</option>
                        {tables.filter(t => t.status === 'available').map(table => (
                          <option key={table.id} value={table.id}>Table {table.table_number} (Cap: {table.capacity})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Customer Name</Label>
                      <Input
                        value={formData.customer_name}
                        onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                        placeholder="Customer name"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Customer Phone (for WhatsApp updates)</Label>
                      <Input
                        value={formData.customer_phone}
                        onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                        placeholder="+91 9876543210"
                        placeholder="Enter customer name"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Select Menu Items</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 border rounded-md">
                      {menuItems.map(item => (
                        <Button
                          key={item.id}
                          type="button"
                          variant="outline"
                          onClick={() => handleAddItem(item)}
                          className="h-auto flex flex-col items-start p-3"
                          data-testid={`add-item-${item.id}`}
                        >
                          <span className="font-medium">{item.name}</span>
                          <span className="text-xs text-gray-500">₹{item.price}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {selectedItems.length > 0 && (
                    <div>
                      <Label>Order Items</Label>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {selectedItems.map((item, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md" data-testid={`selected-item-${index}`}>
                            <div className="flex-1">
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-gray-500">₹{item.price} each</p>
                            </div>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(index, parseInt(e.target.value))}
                              className="w-20"
                            />
                            <Button type="button" variant="outline" size="sm" onClick={() => handleRemoveItem(index)}>Remove</Button>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 p-2 bg-violet-50 rounded-md">
                        <p className="font-bold">Subtotal: ₹{selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600" data-testid="submit-order-button">Create Order</Button>
                    <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancel</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid gap-4">
          {orders.map((order) => (
            <Card key={order.id} className="border-0 shadow-lg" data-testid={`order-card-${order.id}`}>
              <CardHeader>
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div>
                    <CardTitle>Order #{order.id.slice(0, 8)}</CardTitle>
                    <p className="text-sm text-gray-500">Table {order.table_number} • {order.waiter_name}</p>
                    {order.customer_name && <p className="text-sm text-gray-500">Customer: {order.customer_name}</p>}
                    <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.name}</span>
                      <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-medium">
                      <span>Subtotal:</span>
                      <span>₹{order.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Tax (5%):</span>
                      <span>₹{order.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-violet-600">
                      <span>Total:</span>
                      <span>₹{order.total.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap mt-4">
                    {['admin', 'kitchen'].includes(user?.role) && order.status === 'pending' && (
                      <Button size="sm" onClick={() => handleStatusChange(order.id, 'preparing')} data-testid={`status-preparing-${order.id}`}>Start Preparing</Button>
                    )}
                    {['admin', 'kitchen'].includes(user?.role) && order.status === 'preparing' && (
                      <Button size="sm" onClick={() => handleStatusChange(order.id, 'ready')} data-testid={`status-ready-${order.id}`}>Mark Ready</Button>
                    )}
                    {['admin', 'waiter', 'cashier'].includes(user?.role) && order.status !== 'completed' && order.status !== 'cancelled' && (
                      <Button size="sm" variant="outline" onClick={() => handlePrintKOT(order)} data-testid={`print-kot-${order.id}`}>
                        <Printer className="w-4 h-4 mr-2" />
                        Print KOT
                      </Button>
                    )}
                    {['admin', 'cashier'].includes(user?.role) && ['ready', 'preparing'].includes(order.status) && (
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-green-600 to-emerald-600"
                        onClick={() => navigate(`/billing/${order.id}`)}
                        data-testid={`billing-${order.id}`}
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Billing
                      </Button>
                    )}
                    {order.status === 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-green-500 text-green-600 hover:bg-green-50"
                        onClick={() => setWhatsappModal({ open: true, orderId: order.id, customerName: order.customer_name || 'Guest' })}
                        data-testid={`whatsapp-${order.id}`}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        WhatsApp
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {orders.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No orders found</p>
            </div>
          )}
        </div>

        {/* WhatsApp Modal */}
        {whatsappModal.open && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md border-0 shadow-2xl">
              <CardHeader className="relative">
                <button
                  onClick={() => { setWhatsappModal({ open: false, orderId: null, customerName: '' }); setWhatsappPhone(''); }}
                  className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                  Share Receipt via WhatsApp
                </CardTitle>
              </CardHeader>
              <div className="p-6 space-y-4">
                <div>
                  <Label>Customer Phone Number</Label>
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

                <div className="flex gap-3">
                  <Button
                    onClick={handleWhatsappShare}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Open WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { setWhatsappModal({ open: false, orderId: null, customerName: '' }); setWhatsappPhone(''); }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default OrdersPage;
