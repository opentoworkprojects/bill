import { useState, useEffect, useMemo } from 'react';
import { API } from '../App';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { toast } from 'sonner';
import { ShoppingCart } from 'lucide-react';
import MenuSearchBar from '../components/MenuSearchBar';
import OrderItemsList from '../components/OrderItemsList';
import OrderSummary from '../components/OrderSummary';
import DiscountSection from '../components/DiscountSection';
import PaymentSection from '../components/PaymentSection';
import CustomerInfoSection from '../components/CustomerInfoSection';
import { apiWithRetry } from '../utils/apiClient';
import { validatePayment } from '../utils/paymentValidator';
import { printReceipt, generatePlainTextReceipt } from '../utils/printUtils';
import PrintPreviewModal from '../components/PrintPreviewModal';
import { performanceMonitor } from '../utils/performanceMonitor';

const CounterSalePage = ({ user }) => {
  const [orderItems, setOrderItems] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [businessSettings, setBusinessSettings] = useState(null);
  
  // Discount state
  const [discountType, setDiscountType] = useState('amount');
  const [discountValue, setDiscountValue] = useState(0);
  
  // Customer info state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  
  // Print preview state
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [lastOrderData, setLastOrderData] = useState(null);

  // Phone validation helper
  const validatePhoneNumber = (phone) => {
    if (!phone) return ''; // Empty is valid (optional field)
    
    // Remove spaces and special characters for validation
    const cleanPhone = phone.replace(/[\s\-()]/g, '');
    
    // Check if it's a valid format
    if (!/^[\+]?[\d]{10,15}$/.test(cleanPhone)) {
      return 'Phone number must be 10-15 digits';
    }
    
    return '';
  };

  const handlePhoneChange = (value) => {
    setCustomerPhone(value);
    const error = validatePhoneNumber(value);
    setPhoneError(error);
  };
  
  // Payment state
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [splitPayment, setSplitPayment] = useState(false);
  const [cashAmount, setCashAmount] = useState(0);
  const [cardAmount, setCardAmount] = useState(0);
  const [upiAmount, setUpiAmount] = useState(0);
  const [creditAmount, setCreditAmount] = useState(0);

  useEffect(() => {
    performanceMonitor.startTimer('counter_sale_page_load');
    loadMenuItems();
    loadBusinessSettings();
    restoreOrderFromStorage();
    performanceMonitor.endTimer('counter_sale_page_load');
  }, []);

  const loadMenuItems = async () => {
    try {
      setLoading(true);
      performanceMonitor.startTimer('menu_load');
      
      // Check cache first
      const cacheKey = 'counter_sale_menu_cache';
      const cacheTimestampKey = 'counter_sale_menu_cache_timestamp';
      const cached = localStorage.getItem(cacheKey);
      const cacheTimestamp = localStorage.getItem(cacheTimestampKey);
      
      // Use cache if less than 5 minutes old
      if (cached && cacheTimestamp) {
        const age = Date.now() - parseInt(cacheTimestamp);
        if (age < 5 * 60 * 1000) { // 5 minutes
          const items = JSON.parse(cached);
          setMenuItems(items);
          performanceMonitor.endTimer('menu_load');
          setLoading(false);
          
          // Fetch fresh data in background
          fetchMenuItemsFromAPI(cacheKey, cacheTimestampKey);
          return;
        }
      }
      
      // No valid cache, fetch from API
      await fetchMenuItemsFromAPI(cacheKey, cacheTimestampKey);
      performanceMonitor.endTimer('menu_load');
    } catch (error) {
      console.error('Failed to load menu items:', error);
      toast.error('Failed to load menu items. Please try again.');
      performanceMonitor.endTimer('menu_load');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchMenuItemsFromAPI = async (cacheKey, cacheTimestampKey) => {
    const response = await apiWithRetry({
      method: 'get',
      url: `${API}/menu`,
      timeout: 10000
    });
    
    const items = Array.isArray(response.data) ? response.data : [];
    setMenuItems(items);
    
    // Update cache
    localStorage.setItem(cacheKey, JSON.stringify(items));
    localStorage.setItem(cacheTimestampKey, Date.now().toString());
    
    if (items.length === 0) {
      toast.info('No menu items found. Please add menu items first.');
    }
  };

  const loadBusinessSettings = async () => {
    try {
      const response = await apiWithRetry({
        method: 'get',
        url: `${API}/business-settings`,
        timeout: 10000
      });
      setBusinessSettings(response.data);
    } catch (error) {
      console.error('Failed to load business settings:', error);
      setBusinessSettings({ tax_rate: 5, auto_print: false });
    }
  };

  const restoreOrderFromStorage = () => {
    try {
      const saved = localStorage.getItem('counter_sale_order');
      if (saved) {
        const data = JSON.parse(saved);
        setOrderItems(data.items || []);
        setCustomerName(data.customerName || '');
        setCustomerPhone(data.customerPhone || '');
      }
    } catch (error) {
      console.error('Failed to restore order:', error);
    }
  };

  const saveOrderToStorage = () => {
    try {
      localStorage.setItem('counter_sale_order', JSON.stringify({
        items: orderItems,
        customerName,
        customerPhone,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Failed to save order:', error);
    }
  };

  useEffect(() => {
    if (orderItems.length > 0) {
      saveOrderToStorage();
    }
  }, [orderItems, customerName, customerPhone]);

  // Memoized calculations
  const subtotal = useMemo(() => 
    orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    [orderItems]
  );

  const discountAmount = useMemo(() => {
    if (discountType === 'percent') {
      return (subtotal * discountValue) / 100;
    }
    return Math.min(discountValue, subtotal);
  }, [subtotal, discountType, discountValue]);

  const taxableAmount = useMemo(() => 
    Math.max(0, subtotal - discountAmount),
    [subtotal, discountAmount]
  );

  const tax = useMemo(() => {
    const taxRate = businessSettings?.tax_rate || 5;
    return (taxableAmount * taxRate) / 100;
  }, [taxableAmount, businessSettings]);

  const total = useMemo(() => 
    Math.max(0, taxableAmount + tax),
    [taxableAmount, tax]
  );

  const receivedAmount = useMemo(() => {
    if (splitPayment) {
      return cashAmount + cardAmount + upiAmount + creditAmount;
    }
    if (paymentMethod === 'credit') {
      return creditAmount;
    }
    return total;
  }, [splitPayment, cashAmount, cardAmount, upiAmount, creditAmount, paymentMethod, total]);

  const changeAmount = useMemo(() => 
    Math.max(0, receivedAmount - total),
    [receivedAmount, total]
  );

  const balanceAmount = useMemo(() => 
    Math.max(0, total - receivedAmount),
    [total, receivedAmount]
  );

  const handleAddItem = (item) => {
    const existingItemIndex = orderItems.findIndex(
      orderItem => orderItem.menu_item_id === item.id
    );

    if (existingItemIndex !== -1) {
      const updatedItems = [...orderItems];
      updatedItems[existingItemIndex].quantity += 1;
      setOrderItems(updatedItems);
      toast.success(`${item.name} quantity increased to ${updatedItems[existingItemIndex].quantity}`);
    } else {
      const newItem = {
        menu_item_id: item.id,
        name: item.name,
        price: parseFloat(item.price),
        quantity: 1
      };
      setOrderItems([...orderItems, newItem]);
      toast.success(`${item.name} added to order`);
    }
  };

  const handleQuantityChange = (index, delta) => {
    const updatedItems = [...orderItems];
    updatedItems[index].quantity += delta;
    
    if (updatedItems[index].quantity <= 0) {
      updatedItems.splice(index, 1);
      toast.info('Item removed from order');
    }
    
    setOrderItems(updatedItems);
  };

  const handleRemoveItem = (index) => {
    const updatedItems = [...orderItems];
    const itemName = updatedItems[index].name;
    updatedItems.splice(index, 1);
    setOrderItems(updatedItems);
    toast.info(`${itemName} removed from order`);
  };

  const handleClearOrder = () => {
    if (orderItems.length === 0) return;
    
    if (window.confirm('Are you sure you want to clear this order?')) {
      setOrderItems([]);
      setDiscountValue(0);
      setCustomerName('');
      setCustomerPhone('');
      setCashAmount(0);
      setCardAmount(0);
      setUpiAmount(0);
      setCreditAmount(0);
      setSplitPayment(false);
      localStorage.removeItem('counter_sale_order');
      toast.success('Order cleared');
    }
  };

  const handleCompletePayment = async () => {
    performanceMonitor.startTimer('payment_processing');
    
    // Validation
    if (orderItems.length === 0) {
      toast.error('Please add items to the order');
      performanceMonitor.endTimer('payment_processing');
      return;
    }

    // Validate discount
    if (discountAmount > subtotal) {
      toast.error('Discount cannot exceed subtotal');
      performanceMonitor.endTimer('payment_processing');
      return;
    }

    // Validate phone number if provided
    if (phoneError) {
      toast.error('Please fix the phone number error');
      performanceMonitor.endTimer('payment_processing');
      return;
    }

    // Build payment data for validation
    const isCredit = paymentMethod === 'credit' || (splitPayment && creditAmount > 0);
    const paymentData = {
      orderData: {
        id: 'temp-' + Date.now(),
        total: total,
        items: orderItems
      },
      paymentMethod: splitPayment ? 'split' : paymentMethod,
      paymentAmount: splitPayment ? receivedAmount : (isCredit ? 0 : total),
      customerInfo: {
        name: customerName,
        phone: customerPhone
      },
      splitAmounts: splitPayment ? {
        cash_amount: cashAmount,
        card_amount: cardAmount,
        upi_amount: upiAmount,
        credit_amount: creditAmount
      } : undefined
    };

    // Validate payment
    try {
      const validation = validatePayment(paymentData);
      if (!validation.isValid) {
        toast.error(validation.error);
        performanceMonitor.endTimer('payment_processing');
        return;
      }
    } catch (error) {
      toast.error(error.message || 'Payment validation failed');
      performanceMonitor.endTimer('payment_processing');
      return;
    }

    // Create order
    try {
      setLoading(true);
      
      const orderData = {
        items: orderItems,
        subtotal: parseFloat(subtotal.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        tax_rate: businessSettings?.tax_rate || 5,
        discount: parseFloat(discountAmount.toFixed(2)),
        discount_type: discountType,
        discount_value: discountValue,
        total: parseFloat(total.toFixed(2)),
        payment_method: splitPayment ? 'split' : paymentMethod,
        payment_received: parseFloat(receivedAmount.toFixed(2)),
        balance_amount: parseFloat(balanceAmount.toFixed(2)),
        is_credit: isCredit,
        cash_amount: splitPayment ? cashAmount : (paymentMethod === 'cash' ? total : 0),
        card_amount: splitPayment ? cardAmount : (paymentMethod === 'card' ? total : 0),
        upi_amount: splitPayment ? upiAmount : (paymentMethod === 'upi' ? total : 0),
        credit_amount: splitPayment ? creditAmount : (paymentMethod === 'credit' ? total : 0),
        customer_name: customerName || undefined,
        customer_phone: customerPhone || undefined,
        table_id: 'counter',
        table_number: 0,
        waiter_name: user?.name || 'Counter Staff',
        status: 'completed',
        order_type: 'counter'
      };

      const response = await apiWithRetry({
        method: 'post',
        url: `${API}/orders`,
        data: orderData,
        timeout: 10000,
        retries: 3
      });

      performanceMonitor.endTimer('payment_processing');
      toast.success('Payment completed successfully!');

      // Build complete order data for receipt
      const completeOrderData = {
        ...orderData,
        order_id: response.data.order_id,
        business_name: businessSettings?.restaurant_name || 'Restaurant',
        business_phone: businessSettings?.phone || '',
        business_address: businessSettings?.address || ''
      };
      
      setLastOrderData(completeOrderData);

      // Auto-print if enabled
      if (businessSettings?.auto_print) {
        try {
          performanceMonitor.startTimer('receipt_print');
          await printReceipt(completeOrderData);
          performanceMonitor.endTimer('receipt_print');
        } catch (printError) {
          console.error('Print failed:', printError);
          toast.error('Receipt printing failed. Use manual print option.');
          performanceMonitor.endTimer('receipt_print');
          // Save to localStorage for later printing
          localStorage.setItem('pending_receipt', JSON.stringify(completeOrderData));
        }
      }

      // Clear order
      handleClearOrder();
      
    } catch (error) {
      console.error('Payment failed:', error);
      toast.error(error.response?.data?.message || 'Payment failed. Please try again.');
      performanceMonitor.endTimer('payment_processing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout user={user}>
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="w-8 h-8 text-violet-600" />
            Counter Sale
          </h1>
          <p className="text-gray-600 mt-1">
            Quick sale for counter and takeaway orders
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Menu Search & Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Menu Search Section */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">Search Menu Items</h2>
                <MenuSearchBar
                  menuItems={menuItems}
                  onAddItem={handleAddItem}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                />
              </CardContent>
            </Card>

            {/* Order Items List */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">Order Items</h2>
                <OrderItemsList
                  items={orderItems}
                  onQuantityChange={handleQuantityChange}
                  onRemove={handleRemoveItem}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary & Payment */}
          <div className="space-y-6">
            {/* Discount Section */}
            {orderItems.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <DiscountSection
                    discountType={discountType}
                    discountValue={discountValue}
                    onDiscountTypeChange={setDiscountType}
                    onDiscountValueChange={setDiscountValue}
                    discountAmount={discountAmount}
                    subtotal={subtotal}
                  />
                </CardContent>
              </Card>
            )}

            {/* Order Summary */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
                <OrderSummary
                  subtotal={subtotal}
                  tax={tax}
                  discount={discountAmount}
                  total={total}
                />
              </CardContent>
            </Card>

            {/* Customer Information */}
            {orderItems.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Customer Information</h2>
                  <CustomerInfoSection
                    customerName={customerName}
                    customerPhone={customerPhone}
                    onCustomerNameChange={setCustomerName}
                    onCustomerPhoneChange={handlePhoneChange}
                    isCredit={paymentMethod === 'credit' || (splitPayment && creditAmount > 0)}
                    phoneError={phoneError}
                  />
                </CardContent>
              </Card>
            )}

            {/* Payment Section */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">Payment</h2>
                <PaymentSection
                  paymentMethod={paymentMethod}
                  onPaymentMethodChange={setPaymentMethod}
                  splitPayment={splitPayment}
                  onSplitPaymentToggle={() => setSplitPayment(!splitPayment)}
                  cashAmount={cashAmount}
                  cardAmount={cardAmount}
                  upiAmount={upiAmount}
                  creditAmount={creditAmount}
                  onAmountChange={(type, amount) => {
                    if (type === 'cash') setCashAmount(amount);
                    else if (type === 'card') setCardAmount(amount);
                    else if (type === 'upi') setUpiAmount(amount);
                    else if (type === 'credit') setCreditAmount(amount);
                  }}
                  total={total}
                  receivedAmount={receivedAmount}
                  balanceAmount={balanceAmount}
                  changeAmount={changeAmount}
                  businessSettings={businessSettings}
                />
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                size="lg"
                disabled={orderItems.length === 0 || loading}
                onClick={handleCompletePayment}
                aria-label="Complete payment and create order"
              >
                {loading ? 'Processing...' : 'Complete Payment'}
              </Button>
              
              {lastOrderData && (
                <>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowPrintPreview(true)}
                    aria-label="Preview last receipt"
                  >
                    Print Preview
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={async () => {
                      try {
                        await printReceipt(lastOrderData);
                        toast.success('Receipt printed successfully');
                      } catch (error) {
                        toast.error('Print failed. Please try again.');
                      }
                    }}
                    aria-label="Print last receipt"
                  >
                    Print Receipt
                  </Button>
                </>
              )}
              
              <Button
                variant="outline"
                className="w-full"
                disabled={orderItems.length === 0}
                onClick={handleClearOrder}
                aria-label="Clear current order"
              >
                Clear Order
              </Button>
            </div>
          </div>
        </div>
        
        {/* Print Preview Modal */}
        {showPrintPreview && lastOrderData && (
          <PrintPreviewModal
            isOpen={showPrintPreview}
            onClose={() => setShowPrintPreview(false)}
            orderData={lastOrderData}
            receiptText={generatePlainTextReceipt(lastOrderData)}
          />
        )}
      </div>
    </Layout>
  );
};

export default CounterSalePage;
