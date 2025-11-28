import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast, Toaster } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const CustomerOrderPage = () => {
  const { orgId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tableNumber = searchParams.get('table');
  
  const [menu, setMenu] = useState(null);
  const [tables, setTables] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    selectedTable: tableNumber || ''
  });
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    fetchMenu();
    fetchTables();
  }, [orgId]);

  const fetchMenu = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/public/menu/${orgId}`);
      setMenu(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  const fetchTables = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/public/tables/${orgId}`);
      setTables(response.data.tables || []);
    } catch (err) {
      console.error('Failed to fetch tables');
    }
  };

  const addToCart = (item) => {
    const existing = cart.find(c => c.menu_item_id === item.id);
    if (existing) {
      setCart(cart.map(c => 
        c.menu_item_id === item.id ? { ...c, quantity: c.quantity + 1 } : c
      ));
    } else {
      setCart([...cart, {
        menu_item_id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1
      }]);
    }
    toast.success(`Added ${item.name} to cart`);
  };

  const updateQuantity = (itemId, delta) => {
    setCart(cart.map(item => {
      if (item.menu_item_id === itemId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const getCartTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const taxRate = (menu?.tax_rate || 5) / 100;
    const tax = subtotal * taxRate;
    return { subtotal, tax, total: subtotal + tax };
  };

  const handleSubmitOrder = async () => {
    if (!customerInfo.name || !customerInfo.phone) {
      toast.error('Please enter your name and phone number');
      return;
    }
    if (!customerInfo.selectedTable) {
      toast.error('Please select a table');
      return;
    }
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    const selectedTable = tables.find(t => t.table_number === parseInt(customerInfo.selectedTable));
    if (!selectedTable) {
      toast.error('Invalid table selected');
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/public/order`, {
        table_id: selectedTable.id,
        table_number: parseInt(customerInfo.selectedTable),
        items: cart,
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone,
        org_id: orgId
      });

      toast.success('Order placed successfully!');
      
      // Redirect to tracking page
      if (response.data.tracking_token) {
        setTimeout(() => {
          navigate(`/track/${response.data.tracking_token}`);
        }, 1500);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  const getCurrencySymbol = () => {
    const symbols = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
    return symbols[menu?.currency] || '₹';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-6xl mb-4">😕</p>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Menu Not Available</h2>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currency = getCurrencySymbol();
  const totals = getCartTotal();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 pb-24">
      <Toaster position="top-center" richColors />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-6 sticky top-0 z-40">
        <h1 className="text-2xl font-bold">{menu.restaurant_name}</h1>
        <p className="text-orange-100">
          {tableNumber ? `Table ${tableNumber}` : 'Browse our menu'}
        </p>
      </div>

      {/* Customer Info */}
      <div className="p-4">
        <Card className="border-0 shadow-lg mb-4">
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Your Name *</Label>
                <Input
                  placeholder="Enter name"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Phone (WhatsApp) *</Label>
                <Input
                  placeholder="+91 9876543210"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                />
              </div>
            </div>
            {!tableNumber && (
              <div>
                <Label className="text-xs">Select Table *</Label>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={customerInfo.selectedTable}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, selectedTable: e.target.value })}
                >
                  <option value="">Choose table</option>
                  {tables.filter(t => t.status === 'available').map(t => (
                    <option key={t.id} value={t.table_number}>
                      Table {t.table_number} (Seats {t.capacity})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Menu Categories */}
        {Object.entries(menu.categories || {}).map(([category, items]) => (
          <div key={category} className="mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-3 px-1">{category}</h2>
            <div className="space-y-3">
              {items.map((item) => (
                <Card key={item.id} className="border-0 shadow-md">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {item.image_data && (
                        <img 
                          src={item.image_data} 
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium">{item.name}</h3>
                        {item.description && (
                          <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
                        )}
                        <div className="flex justify-between items-center mt-2">
                          <span className="font-bold text-orange-600">
                            {currency}{item.price.toFixed(2)}
                          </span>
                          <Button
                            size="sm"
                            onClick={() => addToCart(item)}
                            className="bg-orange-500 hover:bg-orange-600"
                          >
                            + Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Cart Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg z-50">
          <Button
            onClick={() => setShowCart(true)}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 h-14 text-lg"
          >
            View Cart ({cart.reduce((sum, i) => sum + i.quantity, 0)} items) • {currency}{totals.total.toFixed(2)}
          </Button>
        </div>
      )}

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white w-full max-h-[80vh] rounded-t-3xl overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Your Order</h2>
              <button onClick={() => setShowCart(false)} className="text-2xl">×</button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[50vh]">
              {cart.map((item) => (
                <div key={item.menu_item_id} className="flex justify-between items-center py-3 border-b">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">{currency}{item.price.toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateQuantity(item.menu_item_id, -1)}
                      className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="font-medium w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.menu_item_id, 1)}
                      className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{currency}{totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Tax ({menu?.tax_rate || 5}%)</span>
                <span>{currency}{totals.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total</span>
                <span className="text-orange-600">{currency}{totals.total.toFixed(2)}</span>
              </div>
              
              <Button
                onClick={handleSubmitOrder}
                disabled={submitting}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 h-14 text-lg mt-4"
              >
                {submitting ? 'Placing Order...' : 'Place Order'}
              </Button>
              <p className="text-xs text-center text-gray-500">
                You'll receive order updates on WhatsApp
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerOrderPage;
