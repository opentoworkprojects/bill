import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { API } from '../App';
import { apiWithRetry, apiSilent } from '../utils/apiClient';
import { fetchMenu, fetchBusinessSettings } from '../utils/sharedDataCache';
import { processPaymentFast } from '../utils/optimizedPayment';
import { computePaymentState } from '../utils/orderWorkflowRules';
import { validatePayment } from '../utils/paymentValidator';
import { printReceipt } from '../utils/printUtils';
import MobileMenuSection from '../components/MobileMenuSection';
import MobileCartBottomSheet from '../components/MobileCartBottomSheet';
import MobilePaymentModal from '../components/MobilePaymentModal';
import MobileCustomerInfoModal from '../components/MobileCustomerInfoModal';
// 🚀 WEBSOCKET + BATCHING: Import hybrid sync manager for real-time updates
import hybridSyncManager from '../utils/hybridSyncManager';

const getCurrencySymbol = (code) => {
  const symbols = { 
    INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'AED', 
    SAR: 'SAR', JPY: '¥', CNY: '¥', AUD: 'A$', CAD: 'C$' 
  };
  return symbols[code] || '₹';
};

const MobileCounterSalePage = ({ user }) => {
  const navigate = useNavigate();

  // Menu data state
  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuSearch, setMenuSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  // Cart state
  const [selectedItems, setSelectedItems] = useState([]);

  // Customer state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Pricing state
  const [discountType, setDiscountType] = useState('amount');
  const [discountValue, setDiscountValue] = useState('');

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState(() => 
    localStorage.getItem('counterSale_lastPaymentMethod') || 'cash'
  );
  const [receivedAmount, setReceivedAmount] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [cardAmount, setCardAmount] = useState('');
  const [upiAmount, setUpiAmount] = useState('');

  // UI state
  const [cartExpanded, setCartExpanded] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Settings state
  const [businessSettings, setBusinessSettings] = useState({});
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);

  // Completed sale state
  const [completedSaleOrder, setCompletedSaleOrder] = useState(null);

  // Currency and tax rate
  const currency = useMemo(() => 
    getCurrencySymbol(businessSettings?.currency), 
    [businessSettings?.currency]
  );
  const taxRate = businessSettings?.tax_rate ?? 5;

  // Fetch menu items and business settings with caching
  const fetchData = useCallback(async () => {
    setMenuLoading(true);
    
    try {
      // Check network status
      const isOnline = navigator.onLine;
      
      // Try to load from cache first
      const cachedMenu = localStorage.getItem('mobile_counter_menu_cache');
      const cachedSettings = localStorage.getItem('mobile_counter_settings_cache');
      const cacheTimestamp = localStorage.getItem('mobile_counter_cache_timestamp');
      
      if (cachedMenu && cachedSettings && cacheTimestamp) {
        const cacheAge = Date.now() - parseInt(cacheTimestamp, 10);
        const FIVE_MINUTES = 5 * 60 * 1000;
        
        // Display cached data immediately
        try {
          const parsedMenu = JSON.parse(cachedMenu);
          const parsedSettings = JSON.parse(cachedSettings);
          setMenuItems(parsedMenu);
          setBusinessSettings(parsedSettings);
          setMenuLoading(false);
          
          // Show refresh indicator if cache is stale
          if (cacheAge > FIVE_MINUTES) {
            toast.info('Refreshing menu in background...');
          }
          
          // Show offline indicator if not online
          if (!isOnline) {
            toast.warning('You are offline. Using cached data.');
          }
        } catch (parseError) {
          console.error('Cache parse error:', parseError);
        }
      }

      // Skip fetch if offline and we have cache
      if (!isOnline && cachedMenu && cachedSettings) {
        return;
      }

      // Fetch fresh data in background
      const [menuData, settingsData] = await Promise.all([
        fetchMenu(true),
        fetchBusinessSettings()
      ]);

      const items = Array.isArray(menuData) 
        ? menuData.filter((item) => item && item.available !== false) 
        : [];
      const settings = settingsData?.business_settings || settingsData || {};

      setMenuItems(items);
      setBusinessSettings(settings);

      // Cache the fresh data
      localStorage.setItem('mobile_counter_menu_cache', JSON.stringify(items));
      localStorage.setItem('mobile_counter_settings_cache', JSON.stringify(settings));
      localStorage.setItem('mobile_counter_cache_timestamp', Date.now().toString());

    } catch (error) {
      console.error('Failed to load menu:', error);
      
      // If we have cache, use it
      const cachedMenu = localStorage.getItem('mobile_counter_menu_cache');
      const cachedSettings = localStorage.getItem('mobile_counter_settings_cache');
      
      if (cachedMenu && cachedSettings) {
        toast.warning('Using cached data. Network unavailable.');
      } else {
        toast.error('Failed to load menu for counter sale');
      }
    } finally {
      setMenuLoading(false);
    }
  }, []);

  // Fetch subscription status
  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      try {
        const response = await apiSilent({
          method: 'get',
          url: `${API}/subscription/status`,
          timeout: 8000
        });
        if (response?.data) {
          setSubscriptionStatus(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch subscription status:', error);
      }
    };
    fetchSubscriptionStatus();
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 🚀 WEBSOCKET + BATCHING: Initialize hybrid sync manager for real-time updates
  useEffect(() => {
    console.log('🚀 [Mobile] Initializing WebSocket + Batching system');
    
    // Initialize hybrid sync with user token
    const token = user?.token || localStorage.getItem('token');
    if (token) {
      hybridSyncManager.initialize(token);
    }
    
    // Subscribe to menu updates
    const unsubscribeMenuUpdated = hybridSyncManager.on('menu_updated', (menu) => {
      console.log('📨 [Mobile] Real-time: Menu updated');
      if (Array.isArray(menu)) {
        const items = menu.filter(item => item && item.available !== false);
        setMenuItems(items);
        // Update cache
        localStorage.setItem('mobile_counter_menu_cache', JSON.stringify(items));
        localStorage.setItem('mobile_counter_cache_timestamp', Date.now().toString());
        toast.success('Menu updated!', { duration: 2000 });
      }
    });
    
    console.log('✅ [Mobile] WebSocket event listeners set up');
    
    // Cleanup on unmount
    return () => {
      console.log('🧹 [Mobile] Cleaning up WebSocket listeners');
      unsubscribeMenuUpdated();
    };
  }, [user]);

  // Save last payment method
  useEffect(() => {
    localStorage.setItem('counterSale_lastPaymentMethod', paymentMethod);
  }, [paymentMethod]);

  // Calculate subtotal
  const subtotal = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [selectedItems]
  );

  // Calculate discount amount
  const discountAmount = useMemo(() => {
    const value = parseFloat(discountValue) || 0;
    if (value <= 0) return 0;
    if (discountType === 'percent') {
      const pct = Math.min(value, 100);
      return (subtotal * pct) / 100;
    }
    return Math.min(value, subtotal);
  }, [subtotal, discountValue, discountType]);

  // Calculate tax
  const tax = useMemo(() => {
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    return (taxableAmount * taxRate) / 100;
  }, [subtotal, discountAmount, taxRate]);

  // Calculate total
  const total = useMemo(
    () => Math.max(0, subtotal - discountAmount + tax), 
    [subtotal, discountAmount, tax]
  );

  // Calculate total items count
  const totalItems = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.quantity, 0), 
    [selectedItems]
  );

  // Add item to cart
  const handleAddItem = useCallback((menuItem) => {
    setSelectedItems((prev) => {
      const id = String(menuItem.id);
      const existingIndex = prev.findIndex((item) => item.menu_item_id === id);
      
      if (existingIndex !== -1) {
        // Item exists, increment quantity
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        return updated;
      }
      
      // New item, add to cart
      return [
        ...prev,
        {
          menu_item_id: id,
          name: menuItem.name,
          price: parseFloat(menuItem.price) || 0,
          quantity: 1,
          notes: ''
        }
      ];
    });
  }, []);

  // Adjust item quantity
  const adjustItemQuantity = useCallback((menuItemId, delta) => {
    setSelectedItems((prev) => {
      const index = prev.findIndex((item) => item.menu_item_id === menuItemId);
      if (index === -1) return prev;
      
      const updated = [...prev];
      const nextQty = updated[index].quantity + delta;
      
      if (nextQty <= 0) {
        // Remove item if quantity reaches 0
        updated.splice(index, 1);
        return updated;
      }
      
      updated[index].quantity = nextQty;
      return updated;
    });
  }, []);

  // Reset sale
  const resetSale = useCallback(() => {
    setSelectedItems([]);
    setCustomerName('');
    setCustomerPhone('');
    setDiscountValue('');
    setReceivedAmount('');
    setCashAmount('');
    setCardAmount('');
    setUpiAmount('');
  }, []);

  // Toggle cart expanded state
  const toggleCart = useCallback(() => {
    setCartExpanded((prev) => !prev);
  }, []);

  // Open payment modal
  const openPaymentModal = useCallback(() => {
    if (selectedItems.length === 0) {
      toast.error('Add at least one item to continue');
      return;
    }
    setCartExpanded(false);
    setPaymentModalOpen(true);
  }, [selectedItems.length]);

  // Get available payment options based on settings
  const paymentOptions = useMemo(() => {
    const options = [];
    const enabled = businessSettings?.payment_methods_enabled || {};
    
    if (enabled.cash !== false) options.push('cash');
    if (enabled.card !== false) options.push('card');
    if (enabled.upi !== false) options.push('upi');
    if (businessSettings?.credit_payment_enabled !== false) options.push('credit');
    if (options.length > 1) options.push('split');
    
    return options;
  }, [businessSettings]);

  // Handle customer info save
  const handleCustomerInfoSave = useCallback(() => {
    setCustomerModalOpen(false);
    // Retry payment after customer info is provided
    if (paymentModalOpen) {
      completeSale();
    }
  }, [paymentModalOpen, completeSale]);

  // Handle receipt modal close
  const handleReceiptClose = useCallback(() => {
    setReceiptModalOpen(false);
    setCompletedSaleOrder(null);
  }, []);

  // Handle manual print
  const handleManualPrint = useCallback(async () => {
    if (completedSaleOrder) {
      try {
        await printReceipt(completedSaleOrder, businessSettings);
        toast.success('Receipt sent to printer');
      } catch (error) {
        console.error('Print failed:', error);
        toast.error('Print failed. Please try again.');
      }
    }
  }, [completedSaleOrder, businessSettings]);

  // Complete sale (placeholder - will be implemented in later tasks)
  const completeSale = useCallback(async () => {
    if (selectedItems.length === 0) {
      toast.error('Add at least one item to continue');
      return;
    }

    if (processing) return;

    // Check subscription limit
    const billCount = subscriptionStatus?.bill_count ?? user?.bill_count ?? 0;
    const subscriptionActive = subscriptionStatus?.subscription_active ?? user?.subscription_active ?? false;
    const needsSubscription = subscriptionStatus?.needs_subscription ?? (!subscriptionActive && billCount >= 50);
    
    if (needsSubscription) {
      toast.error('Free plan limit reached (50 bills). Please subscribe to continue.');
      navigate('/subscription');
      return;
    }

    // Check if customer info is required for credit payment
    const creditRequiresCustomerInfo = businessSettings?.credit_requires_customer_info ?? true;
    if (paymentMethod === 'credit' && creditRequiresCustomerInfo) {
      if (!customerName || !customerPhone) {
        setCustomerModalOpen(true);
        toast.error('Customer information required for credit sales');
        return;
      }
    }

    setProcessing(true);
    
    try {
      // Calculate payment amounts
      let effectiveReceived = total;
      let splitPaid = 0;
      let splitCredit = 0;

      if (paymentMethod === 'cash') {
        effectiveReceived = parseFloat(receivedAmount) || 0;
      } else if (paymentMethod === 'split') {
        const cash = parseFloat(cashAmount) || 0;
        const card = parseFloat(cardAmount) || 0;
        const upi = parseFloat(upiAmount) || 0;
        splitPaid = cash + card + upi;
        splitCredit = Math.max(0, total - splitPaid);
        effectiveReceived = splitPaid;
      }

      // Validate payment
      const orderDataForValidation = {
        items: selectedItems,
        subtotal,
        tax,
        tax_rate: taxRate,
        total,
        discount: discountAmount,
        discount_amount: discountAmount,
        discount_type: discountType
      };

      const paymentAmount = paymentMethod === 'split' ? total : effectiveReceived;

      const validation = validatePayment({
        orderData: orderDataForValidation,
        paymentMethod,
        paymentAmount,
        customerInfo: { name: customerName, phone: customerPhone }
      });

      if (!validation.isValid) {
        toast.error(validation.errors[0] || 'Payment validation failed');
        setProcessing(false);
        return;
      }

      // Compute payment state
      const paymentStats = paymentMethod === 'split'
        ? { payment_received: splitPaid, balance_amount: splitCredit, is_credit: splitCredit > 0 }
        : computePaymentState(total, effectiveReceived);

      if (paymentMethod === 'credit') {
        paymentStats.is_credit = true;
        paymentStats.balance_amount = total;
        paymentStats.payment_received = 0;
      }

      // Create order data
      const orderData = {
        items: selectedItems,
        customer_name: customerName || '',
        customer_phone: customerPhone || '',
        order_type: 'takeaway',
        table_id: 'counter',
        subtotal,
        tax,
        tax_rate: taxRate,
        total,
        discount: discountAmount,
        discount_amount: discountAmount,
        discount_type: discountType,
        payment_method: paymentMethod,
        payment_received: paymentStats.payment_received,
        balance_amount: paymentStats.balance_amount,
        is_credit: paymentStats.is_credit,
        status: 'completed'
      };

      // Add split payment details if applicable
      if (paymentMethod === 'split') {
        orderData.split_payment = {
          cash: parseFloat(cashAmount) || 0,
          card: parseFloat(cardAmount) || 0,
          upi: parseFloat(upiAmount) || 0
        };
      }

      // Show success feedback immediately (optimistic UI)
      toast.success('Processing payment...');

      // Single API call — create order with payment data included
      const orderResponse = await apiWithRetry({
        method: 'post',
        url: `${API}/orders`,
        data: {
          table_id: 'counter',
          table_number: 0,
          items: selectedItems,
          customer_name: customerName || 'Counter Sale',
          customer_phone: customerPhone || '',
          order_type: 'takeaway',
          status: 'completed',
          frontend_origin: window.location.origin,
          quick_billing: true,
          payment_method: paymentMethod === 'split' ? 'split' : paymentMethod,
          payment_received: paymentStats.payment_received,
          balance_amount: paymentStats.balance_amount,
          is_credit: paymentStats.is_credit,
          discount: discountAmount,
          discount_amount: discountAmount,
          discount_type: discountType,
          tax_rate_override: taxRate,
          ...(paymentMethod === 'split' ? {
            cash_amount: parseFloat(cashAmount) || 0,
            card_amount: parseFloat(cardAmount) || 0,
            upi_amount: parseFloat(upiAmount) || 0,
            credit_amount: splitCredit
          } : {})
        },
        timeout: 8000
      });

      const result = { order: orderResponse.data };

      if (result?.order) {
        setCompletedSaleOrder(result.order);

        // Dispatch payment completed event
        const event = new CustomEvent('paymentCompleted', {
          detail: {
            order: result.order,
            removeFromActiveOrders: true
          }
        });
        window.dispatchEvent(event);

        // Store in localStorage for cross-tab sync
        localStorage.setItem('lastPaymentCompleted', JSON.stringify({
          order: result.order,
          timestamp: Date.now(),
          removeFromActiveOrders: true
        }));

        // Clear after 5 seconds
        setTimeout(() => {
          localStorage.removeItem('lastPaymentCompleted');
        }, 5000);

        // Invalidate billing cache
        localStorage.removeItem('mobile_counter_menu_cache');
        localStorage.removeItem('mobile_counter_cache_timestamp');

        // Update subscription status
        if (subscriptionStatus) {
          setSubscriptionStatus({
            ...subscriptionStatus,
            bill_count: (subscriptionStatus.bill_count || 0) + 1
          });
        }

        // Auto-print if enabled
        const autoPrint = businessSettings?.print_customization?.auto_print ?? false;
        if (autoPrint) {
          try {
            await printReceipt(result.order, businessSettings);
          } catch (printError) {
            console.error('Auto-print failed:', printError);
            toast.error('Print failed. Use manual print button.');
          }
        }

        // Show receipt modal
        setReceiptModalOpen(true);
        setPaymentModalOpen(false);

        // Reset sale for next transaction
        setTimeout(() => {
          resetSale();
        }, 500);

        toast.success('Payment completed successfully!');
      } else {
        throw new Error('Order creation failed');
      }
    } catch (error) {
      console.error('Payment failed:', error);
      toast.error(error.message || 'Payment processing failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  }, [
    selectedItems, processing, subscriptionStatus, user, navigate, paymentMethod,
    businessSettings, customerName, customerPhone, total, receivedAmount, cashAmount,
    cardAmount, upiAmount, subtotal, tax, taxRate, discountAmount, discountType, resetSale
  ]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" data-testid="mobile-counter-sale-page">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
        <h1 className="text-xl font-bold text-gray-800">Counter Sale</h1>
        <p className="text-sm text-gray-600">
          {totalItems} items • {currency}{total.toFixed(2)}
        </p>
      </div>

      {/* Menu Section - Takes remaining space */}
      <div className="flex-1 overflow-hidden">
        <MobileMenuSection
          menuItems={menuItems}
          selectedItems={selectedItems}
          menuSearch={menuSearch}
          activeCategory={activeCategory}
          onSearchChange={setMenuSearch}
          onCategoryChange={setActiveCategory}
          onAddItem={handleAddItem}
          onAdjustQuantity={adjustItemQuantity}
          loading={menuLoading}
          currency={currency}
        />
      </div>

      {/* Cart Bottom Sheet */}
      <MobileCartBottomSheet
        selectedItems={selectedItems}
        subtotal={subtotal}
        discountAmount={discountAmount}
        tax={tax}
        total={total}
        expanded={cartExpanded}
        onToggle={toggleCart}
        onAdjustQuantity={adjustItemQuantity}
        onCheckout={openPaymentModal}
        currency={currency}
      />

      {/* Payment Modal */}
      {paymentModalOpen && (
        <MobilePaymentModal
          total={total}
          paymentMethod={paymentMethod}
          paymentOptions={paymentOptions}
          receivedAmount={receivedAmount}
          cashAmount={cashAmount}
          cardAmount={cardAmount}
          upiAmount={upiAmount}
          onPaymentMethodChange={setPaymentMethod}
          onReceivedAmountChange={setReceivedAmount}
          onCashAmountChange={setCashAmount}
          onCardAmountChange={setCardAmount}
          onUpiAmountChange={setUpiAmount}
          onComplete={completeSale}
          onCancel={() => setPaymentModalOpen(false)}
          processing={processing}
          currency={currency}
        />
      )}

      {/* Customer Info Modal */}
      {customerModalOpen && (
        <MobileCustomerInfoModal
          customerName={customerName}
          customerPhone={customerPhone}
          onCustomerNameChange={setCustomerName}
          onCustomerPhoneChange={setCustomerPhone}
          onSave={handleCustomerInfoSave}
          onCancel={() => setCustomerModalOpen(false)}
          required={paymentMethod === 'credit' && (businessSettings?.credit_requires_customer_info ?? true)}
        />
      )}

      {/* Receipt Modal */}
      {receiptModalOpen && completedSaleOrder && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-2xl font-bold text-gray-800">Sale Completed</h2>
            <button
              onClick={handleReceiptClose}
              className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
              aria-label="Close receipt"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex flex-col items-center justify-center mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h3>
              <p className="text-gray-600">Order #{completedSaleOrder.id}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount</span>
                <span className="font-bold text-gray-800">{currency}{completedSaleOrder.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method</span>
                <span className="font-semibold text-gray-800 capitalize">{completedSaleOrder.payment_method}</span>
              </div>
              {completedSaleOrder.customer_name && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer</span>
                  <span className="font-semibold text-gray-800">{completedSaleOrder.customer_name}</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border-t space-y-2">
            <button
              onClick={handleManualPrint}
              className="w-full bg-violet-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-violet-700 active:scale-98 transition-transform"
              style={{ minHeight: '56px' }}
            >
              Print Receipt
            </button>
            <button
              onClick={handleReceiptClose}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 active:scale-98 transition-transform"
              style={{ minHeight: '48px' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileCounterSalePage;
