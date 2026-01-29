import { useState, useEffect, useRef } from 'react';
import { API } from '../App';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Plus, Eye, Printer, MessageCircle, X, Receipt, Search, Edit, Trash2, Ban, MoreVertical, AlertTriangle, ArrowLeft, ArrowRight, ShoppingCart, Clock, CheckCircle, Wallet, DollarSign, RefreshCw } from 'lucide-react';
import TrialBanner from '../components/TrialBanner';
import { printKOT as printKOTUtil, printReceipt as printReceiptUtil } from '../utils/printUtils';
import OptimizedBillingButton from '../components/OptimizedBillingButton';
import { billingCache } from '../utils/billingCache';
import EditOrderModal from '../components/EditOrderModal';
import { apiWithRetry, apiSilent } from '../utils/apiClient';

// Enhanced sound effects for better UX
const playSound = (type) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (type === 'add') {
      // Pleasant "pop" sound for adding item
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.05);
      oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.15);
    } else if (type === 'remove') {
      // Soft "thud" for removing
      oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } else if (type === 'success') {
      // Success chime - ascending notes
      oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.4);
    } else if (type === 'cooking') {
      // Cooking sound - warm, bubbling effect
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(550, audioContext.currentTime + 0.1);
      oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.2);
      oscillator.frequency.exponentialRampToValueAtTime(500, audioContext.currentTime + 0.3);
      gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.35);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.35);
    } else if (type === 'error') {
      // Error sound - descending notes
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.1);
      oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.25);
    }
  } catch (e) {
    // Silently fail if audio not supported
  }
};

const OrdersPage = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [todaysBills, setTodaysBills] = useState([]);
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [businessSettings, setBusinessSettings] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [formData, setFormData] = useState({
    table_id: '',
    customer_name: '',
    customer_phone: ''
  });
  const [whatsappModal, setWhatsappModal] = useState({ open: false, orderId: null, customerName: '' });
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [viewOrderModal, setViewOrderModal] = useState({ open: false, order: null });
  const [printLoading, setPrintLoading] = useState(false);
  const [menuSearch, setMenuSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  
  // Simplified edit order state for new EditOrderModal component
  const [editOrderModal, setEditOrderModal] = useState({ open: false, order: null });
  
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({ open: false, order: null });
  const [cancelConfirmModal, setCancelConfirmModal] = useState({ open: false, order: null });
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  // State for 2-step order flow
  const [showMenuPage, setShowMenuPage] = useState(false);
  // Cart expanded state for drag-up
  const [cartExpanded, setCartExpanded] = useState(false);
  // Skip customer prompt preference (stored in localStorage)
  const [skipCustomerPrompt, setSkipCustomerPrompt] = useState(() => {
    return localStorage.getItem('skipCustomerPrompt') === 'true';
  });
  // Tab state for Active Orders vs Today's Bills
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'history'
  const [loading, setLoading] = useState(true);
  
  // Add state for preventing duplicate orders
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [lastOrderCreated, setLastOrderCreated] = useState(null);
  // Add state for preventing double-clicks on status change buttons
  const [processingStatusChanges, setProcessingStatusChanges] = useState(new Set());
  // Add state for forcing immediate refresh after status changes
  const [needsImmediateRefresh, setNeedsImmediateRefresh] = useState(false);
  const dataLoadedRef = useRef(false);

  // Get unique categories from menu items
  const categories = ['all', ...new Set(menuItems.map(item => item.category).filter(Boolean))];

  useEffect(() => {
    if (!dataLoadedRef.current) {
      dataLoadedRef.current = true;
      loadInitialData();
    }
  }, []);

  // Real-time polling for active orders and today's bills (every 2 seconds to avoid overriding optimistic updates)
  useEffect(() => {
    const interval = setInterval(() => {
      // Force immediate refresh if needed
      if (needsImmediateRefresh) {
        console.log('🚀 Immediate refresh triggered');
        setNeedsImmediateRefresh(false);
        if (activeTab === 'active') {
          fetchOrders(true); // Force refresh
        } else if (activeTab === 'history') {
          fetchTodaysBills();
        }
        return;
      }
      
      // Skip polling if there are active status changes to avoid conflicts
      if (processingStatusChanges.size > 0) {
        console.log('⏸️ Skipping polling - status changes in progress:', Array.from(processingStatusChanges));
        return;
      }
      
      // Skip polling if user recently interacted (within 2 seconds for faster response)
      const lastInteraction = localStorage.getItem('lastUserInteraction');
      if (lastInteraction && (Date.now() - parseInt(lastInteraction)) < 2000) {
        console.log('⏸️ Skipping polling - recent user interaction');
        return;
      }
      
      console.log('🔄 Background polling - fetching orders');
      if (activeTab === 'active') {
        fetchOrders(); // Refresh orders when viewing active tab
      } else if (activeTab === 'history') {
        fetchTodaysBills(); // Refresh today's bills when viewing history tab
      }
    }, 2000); // Reduced to 2 seconds for faster updates

    return () => clearInterval(interval);
  }, [activeTab, processingStatusChanges, needsImmediateRefresh]); // Added needsImmediateRefresh dependency

  // Track user interactions to pause polling
  useEffect(() => {
    const trackInteraction = () => {
      localStorage.setItem('lastUserInteraction', Date.now().toString());
    };

    // Track various user interactions
    document.addEventListener('click', trackInteraction);
    document.addEventListener('touchstart', trackInteraction);
    document.addEventListener('keydown', trackInteraction);

    return () => {
      document.removeEventListener('click', trackInteraction);
      document.removeEventListener('touchstart', trackInteraction);
      document.removeEventListener('keydown', trackInteraction);
    };
  }, []);

  // Aggressive real-time refresh on window focus (when user returns to tab)
  useEffect(() => {
    const handleFocus = () => {
      if (activeTab === 'active') {
        fetchOrders();
      } else if (activeTab === 'history') {
        fetchTodaysBills();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [activeTab]);

  // Real-time refresh on tab visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        if (activeTab === 'active') {
          fetchOrders();
        } else if (activeTab === 'history') {
          fetchTodaysBills();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [activeTab]);

  // Real-time refresh on mouse movement (user is active)
  useEffect(() => {
    let lastRefresh = Date.now();
    const handleMouseMove = () => {
      const now = Date.now();
      // Only refresh if it's been more than 2 seconds since last refresh
      if (now - lastRefresh > 2000) {
        lastRefresh = now;
        if (activeTab === 'active') {
          fetchOrders();
        } else if (activeTab === 'history') {
          fetchTodaysBills();
        }
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [activeTab]);

  // Manual refresh function for real-time updates
  const handleManualRefresh = async () => {
    setLoading(true);
    
    try {
      // Clear caches for fresh data
      sessionStorage.removeItem(`orders_${user?.id}`);
      localStorage.removeItem('billbyte_menu_cache');
      
      // Play feedback sound and vibration
      if ('vibrate' in navigator) {
        navigator.vibrate([50]);
      }
      
      if (activeTab === 'active') {
        await fetchOrders(true); // Force refresh
      } else if (activeTab === 'history') {
        await fetchTodaysBills();
      }
      
      // Also refresh tables for real-time table status
      await fetchTables(true); // Force refresh
      
      // Reload menu with fresh data
      try {
        const menuRes = await apiSilent({ 
          method: 'get', 
          url: `${API}/menu?_t=${Date.now()}`, 
          timeout: 8000 
        });
        
        if (menuRes?.data) {
          const menuData = Array.isArray(menuRes.data) ? menuRes.data : [];
          const validMenuItems = menuData.filter(item => item && item.id && item.name);
          
          // Cache fresh menu data
          localStorage.setItem('billbyte_menu_cache', JSON.stringify({
            data: validMenuItems,
            timestamp: Date.now()
          }));
          
          setMenuItems(validMenuItems);
        }
      } catch (menuError) {
        console.error('Menu refresh failed:', menuError);
      }
      
      toast.success('Data refreshed successfully!', { duration: 2000 });
      
    } catch (error) {
      console.error('Manual refresh failed:', error);
      toast.error('Refresh failed - please try again');
    } finally {
      setLoading(false);
    }
  };

  const loadInitialData = async () => {
    try {
      // Try to load menu from cache first for instant display
      const cachedMenu = localStorage.getItem('billbyte_menu_cache');
      if (cachedMenu) {
        try {
          const { data: cachedMenuData, timestamp } = JSON.parse(cachedMenu);
          // Use cached menu if less than 5 minutes old
          if (Date.now() - timestamp < 300000 && Array.isArray(cachedMenuData)) {
            const validCachedItems = cachedMenuData.filter(item => item && item.id && item.name && item.available);
            setMenuItems(validCachedItems);
            setMenuLoading(false);
          }
        } catch (e) {
          console.warn('Failed to parse cached menu:', e);
        }
      }

      // Load critical data first (orders, today's bills, tables, and menu items)
      const [ordersRes, todaysBillsRes, tablesRes, menuRes] = await Promise.all([
        apiSilent({ method: 'get', url: `${API}/orders` }),
        apiSilent({ method: 'get', url: `${API}/orders/today-bills` }),
        // Use fresh=true and cache-busting for tables to get real-time status
        apiSilent({ method: 'get', url: `${API}/tables?fresh=true&_t=${Date.now()}` }),
        // Load menu items with timeout and caching
        apiSilent({ method: 'get', url: `${API}/menu`, timeout: 8000 })
      ]);
      
      // Process orders data
      const ordersData = Array.isArray(ordersRes?.data) ? ordersRes.data : [];
      const validOrders = ordersData.filter(order => {
        return order && order.id && order.created_at && order.status && typeof order.total === 'number';
      }).map(order => ({
        ...order,
        customer_name: order.customer_name || '',
        table_number: order.table_number || 0,
        payment_method: order.payment_method || 'cash',
        created_at: order.created_at || new Date().toISOString()
      }));
      
      // Process today's bills data
      const billsData = Array.isArray(todaysBillsRes?.data) ? todaysBillsRes.data : [];
      const validBills = billsData.filter(order => {
        return order && order.id && order.created_at && order.status && typeof order.total === 'number';
      }).map(order => ({
        ...order,
        customer_name: order.customer_name || '',
        table_number: order.table_number || 0,
        payment_method: order.payment_method || 'cash',
        created_at: order.created_at || new Date().toISOString()
      }));
      
      // Process tables data
      const tablesData = Array.isArray(tablesRes?.data) ? tablesRes.data : [];
      const validTables = tablesData.filter(table => {
        return table && table.id && typeof table.table_number === 'number';
      });
      
      // Process menu items data - now loaded as priority
      const menuData = Array.isArray(menuRes?.data) ? menuRes.data : [];
      const validMenuItems = menuData.filter(item => item && item.id && item.name && item.available);
      
      setOrders(validOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      setTodaysBills(validBills.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      setTables(validTables);
      setMenuItems(validMenuItems); // Set menu items immediately
      setMenuLoading(false);
      
      // Cache menu items for next time
      try {
        localStorage.setItem('billbyte_menu_cache', JSON.stringify({
          data: validMenuItems,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.warn('Failed to cache menu items:', e);
      }
      
      // 🚀 PERFORMANCE OPTIMIZATION: Smart pre-loading with persistent cache
      const activeOrderIds = validOrders
        .filter(order => ['ready', 'preparing', 'pending'].includes(order.status))
        .map(order => order.id)
        .slice(0, 15); // Increased from 10 to 15 for better coverage
      
      if (activeOrderIds.length > 0) {
        // Smart preloading - only preload uncached orders
        billingCache.preloadMultipleOrders(activeOrderIds).catch(error => {
          console.warn('Smart preload failed:', error);
        });
        
        // Background sync for potentially stale cached orders
        billingCache.backgroundSync(activeOrderIds);
      }
      
      // Load business settings in background (less critical)
      apiSilent({ method: 'get', url: `${API}/business/settings` })
        .then((settingsRes) => {
          if (settingsRes?.data) {
            setBusinessSettings(settingsRes.data.business_settings || {});
          }
        });
      
    } catch (error) {
      console.error('Failed to load initial data', error);
      // Set empty defaults to prevent crashes
      setOrders([]);
      setTodaysBills([]);
      setTables([]);
      setMenuItems([]);
      setBusinessSettings({});
      setMenuLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async (forceRefresh = false) => {
    try {
      // Use cache for faster loading unless force refresh
      const cacheKey = `orders_${user?.id}`;
      const cachedData = !forceRefresh ? sessionStorage.getItem(cacheKey) : null;
      
      if (cachedData && !forceRefresh) {
        try {
          const parsed = JSON.parse(cachedData);
          if (Date.now() - parsed.timestamp < 30000) { // 30 second cache
            // Preserve optimistic orders when loading from cache
            setOrders(prevOrders => {
              const optimisticOrders = prevOrders.filter(order => order.is_optimistic);
              const cachedOrders = parsed.data.filter(order => !order.is_optimistic);
              return [...optimisticOrders, ...cachedOrders];
            });
            console.log('� Orders loaded from cache (preserving optimistic orders)');
            return;
          }
        } catch (e) {
          console.warn('Cache parse error:', e);
        }
      }
      
      const params = forceRefresh ? `?_t=${Date.now()}` : '';
      const response = await apiWithRetry({
        method: 'get',
        url: `${API}/orders${params}`,
        timeout: 10000 // 10 second timeout
      });
      
      const ordersData = Array.isArray(response.data) ? response.data : [];
      
      // Validate and clean order data
      const validOrders = ordersData.filter(order => {
        // Ensure order has required fields
        return order && 
               order.id && 
               order.created_at && 
               order.status && 
               typeof order.total === 'number' &&
               Array.isArray(order.items);
      }).map(order => ({
        ...order,
        // Ensure all required fields have default values
        customer_name: order.customer_name || '',
        table_number: order.table_number || 0,
        payment_method: order.payment_method || 'cash',
        payment_received: order.payment_received || 0,
        balance_amount: order.balance_amount || 0,
        is_credit: order.is_credit || false,
        // Ensure date is valid
        created_at: order.created_at || new Date().toISOString()
      }));
      
      const sortedOrders = validOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      // Cache the response for faster subsequent loads
      sessionStorage.setItem(cacheKey, JSON.stringify({
        data: sortedOrders,
        timestamp: Date.now()
      }));
      
      // 🚀 PRESERVE OPTIMISTIC ORDERS: Merge server data with local changes
      setOrders(prevOrders => {
        try {
          const optimisticOrders = prevOrders.filter(order => order.is_optimistic);
          const instantUpdates = prevOrders.filter(order => order.instant_update);
          const serverOrders = sortedOrders.filter(order => !order.is_optimistic);
          
          // Remove optimistic orders that now exist on server (successful creation)
          const finalOptimisticOrders = optimisticOrders.filter(optimisticOrder => {
            // Check if this optimistic order has been created on server
            const existsOnServer = serverOrders.some(serverOrder => {
              // Match by table and items (since temp IDs won't match)
              return serverOrder.table_id === optimisticOrder.table_id &&
                     serverOrder.items?.length === optimisticOrder.items?.length &&
                     Math.abs(serverOrder.total - optimisticOrder.total) < 0.01;
            });
            return !existsOnServer;
          });
          
          // Preserve instant status updates with improved logic to prevent flickering
          const mergedServerOrders = serverOrders.map(serverOrder => {
            const instantUpdate = instantUpdates.find(local => local.id === serverOrder.id);
            
            if (instantUpdate) {
              // Use timestamp-based preservation for better accuracy
              if (instantUpdate.instant_update_timestamp) {
                const timeSinceUpdate = Date.now() - instantUpdate.instant_update_timestamp;
                // Preserve instant updates for 8 seconds (matching handleStatusChange)
                if (timeSinceUpdate < 8000 && instantUpdate.status !== serverOrder.status) {
                  console.log('🔒 Preserving instant update:', serverOrder.id, instantUpdate.status, 'over server:', serverOrder.status);
                  return {
                    ...serverOrder,
                    status: instantUpdate.status,
                    updated_at: instantUpdate.updated_at,
                    instant_update: true,
                    instant_update_timestamp: instantUpdate.instant_update_timestamp,
                    processing_status: instantUpdate.processing_status || false
                  };
                }
              } else if (instantUpdate.updated_at) {
                // Fallback to date-based preservation
                try {
                  const timeSinceUpdate = Date.now() - new Date(instantUpdate.updated_at).getTime();
                  // Preserve instant updates for 8 seconds
                  if (timeSinceUpdate < 8000 && instantUpdate.status !== serverOrder.status) {
                    console.log('🔒 Preserving instant update (fallback):', serverOrder.id, instantUpdate.status);
                    return {
                      ...serverOrder,
                      status: instantUpdate.status,
                      updated_at: instantUpdate.updated_at,
                      instant_update: true,
                      processing_status: instantUpdate.processing_status || false
                    };
                  }
                } catch (dateError) {
                  console.warn('Date parsing error:', dateError);
                }
              }
            }
            
            return serverOrder;
          });
          
          // Filter out completed and paid orders from active orders
          const activeServerOrders = mergedServerOrders.filter(order => 
            !['completed', 'cancelled', 'paid'].includes(order.status)
          );
          
          // Move completed orders to today's bills
          const completedOrders = mergedServerOrders.filter(order => 
            ['completed', 'paid'].includes(order.status)
          );
          
          if (completedOrders.length > 0) {
            setTodaysBills(prevBills => {
              const existingIds = new Set(prevBills.map(bill => bill.id));
              const newCompletedOrders = completedOrders.filter(order => !existingIds.has(order.id));
              return [...newCompletedOrders, ...prevBills];
            });
          }
          
          const mergedOrders = [...finalOptimisticOrders, ...activeServerOrders];
          
          return mergedOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        } catch (mergeError) {
          console.error('Error merging orders:', mergeError);
          // Fallback to just server orders if merging fails
          return sortedOrders.filter(order => !['completed', 'cancelled', 'paid'].includes(order.status));
        }
      });
      
    } catch (error) {
      console.error('Failed to fetch orders', error);
      setOrders([]);
      // Show user-friendly error
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
      } else if (error.response?.status >= 500) {
        toast.error('Server error. Please try again later.');
      } else if (error.code === 'ECONNABORTED') {
        toast.error('Request timeout - please try again');
      } else {
        toast.error('Failed to load orders');
      }
    }
  };

  const fetchTodaysBills = async () => {
    try {
      const response = await apiWithRetry({
        method: 'get',
        url: `${API}/orders/today-bills`,
        timeout: 10000
      });
      
      const billsData = Array.isArray(response.data) ? response.data : [];
      
      // Validate and clean bills data
      const validBills = billsData.filter(order => {
        // Ensure order has required fields
        return order && 
               order.id && 
               order.created_at && 
               order.status && 
               typeof order.total === 'number' &&
               Array.isArray(order.items);
      }).map(order => ({
        ...order,
        // Ensure all required fields have default values
        customer_name: order.customer_name || '',
        table_number: order.table_number || 0,
        payment_method: order.payment_method || 'cash',
        payment_received: order.payment_received || 0,
        balance_amount: order.balance_amount || 0,
        is_credit: order.is_credit || false,
        // Ensure date is valid
        created_at: order.created_at || new Date().toISOString()
      }));
      
      setTodaysBills(validBills.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (error) {
      console.error('Failed to fetch today\'s bills', error);
      setTodaysBills([]);
      // Error handling is done by apiWithRetry
    }
  };

  const fetchTables = async (forceRefresh = false) => {
    try {
      // Always use fresh=true parameter to bypass cache and get direct DB data
      // Add cache-busting timestamp when force refresh is requested
      const params = new URLSearchParams();
      params.append('fresh', 'true');  // Always bypass cache for table status
      if (forceRefresh) {
        params.append('_t', Date.now().toString());  // Cache-busting for browser
      }
      const url = `${API}/tables?${params.toString()}`;
      
      const response = await apiWithRetry({
        method: 'get',
        url: url,
        timeout: 8000
      });
      
      const tablesData = Array.isArray(response.data) ? response.data : [];
      
      // Validate and clean table data
      const validTables = tablesData.filter(table => {
        return table && table.id && typeof table.table_number === 'number';
      }).map(table => ({
        ...table,
        status: table.status || 'available',
        capacity: table.capacity || 4,
        current_order_id: table.current_order_id || null
      }));
      
      setTables(validTables);
    } catch (error) {
      console.error('Failed to fetch tables', error);
      setTables([]);
      // Error handling is done by apiWithRetry
    }
  };

  const handleAddItem = (menuItem) => {
    playSound('add');
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
    playSound('remove');
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleQuantityChange = (index, quantity) => {
    if (quantity < 1) return;
    const updated = [...selectedItems];
    updated[index].quantity = quantity;
    setSelectedItems(updated);
  };

  // Submit order from full-screen menu page with instant feedback
  const handleSubmitOrder = async () => {
    if (selectedItems.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    // Validate table selection only if table-wise ordering is enabled
    if (tableWiseOrdering && businessSettings?.kot_mode_enabled !== false && !formData.table_id) {
      toast.error('Please select a table');
      return;
    }

    // Prevent duplicate order creation
    if (isCreatingOrder) {
      toast.warning('Order is being created, please wait...');
      return;
    }

    // Check for recent duplicate order (same table, same items within 10 seconds)
    const orderSignature = `${formData.table_id || 'counter'}_${selectedItems.map(i => `${i.id}_${i.quantity}`).join('_')}`;
    const now = Date.now();
    if (lastOrderCreated && lastOrderCreated.signature === orderSignature && (now - lastOrderCreated.timestamp) < 10000) {
      toast.error('Duplicate order detected! Please wait 10 seconds before creating the same order again.');
      return;
    }

    setIsCreatingOrder(true);

    try {
      const selectedTable = formData.table_id ? tables.find(t => t.id === formData.table_id) : null;
      const customerName = formData.customer_name?.trim() || (businessSettings?.kot_mode_enabled === false ? 'Cash Sale' : '');
      
      // Create optimistic order for instant display
      const optimisticOrder = {
        id: `temp_${Date.now()}`,
        table_id: formData.table_id || null,
        table_number: selectedTable?.table_number || 0,
        items: selectedItems,
        customer_name: customerName,
        customer_phone: formData.customer_phone || '',
        status: 'pending',
        total: selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        created_at: new Date().toISOString(),
        is_optimistic: true // Flag to identify optimistic orders
      };

      // Instant UI update - show order immediately
      setOrders(prevOrders => [optimisticOrder, ...prevOrders]);
      
      // Instant feedback
      playSound('success');
      toast.success('🎉 Order created successfully!');
      
      // Close menu and reset form
      setShowMenuPage(false);
      setCartExpanded(false);
      resetForm();

      // Create actual order on server
      const response = await apiWithRetry({
        method: 'post',
        url: `${API}/orders`,
        data: {
          table_id: formData.table_id || null,
          table_number: selectedTable?.table_number || 0,
          items: selectedItems,
          customer_name: customerName,
          customer_phone: formData.customer_phone || '',
          frontend_origin: window.location.origin
        },
        timeout: 12000 // Longer timeout for order creation
      });

      // Replace optimistic order with real order
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === optimisticOrder.id 
            ? { ...response.data, created_at: response.data.created_at || new Date().toISOString() }
            : order
        )
      );

      // Update last order created to prevent duplicates
      setLastOrderCreated({
        signature: orderSignature,
        timestamp: now
      });

      // Update table status if needed
      if (selectedTable && selectedTable.status === 'available') {
        setTables(prevTables => 
          prevTables.map(table => 
            table.id === selectedTable.id 
              ? { ...table, status: 'occupied' }
              : table
          )
        );
      }

      // Background refresh for consistency (but don't override optimistic updates)
      setTimeout(() => {
        fetchTables(true);
        // Delay the first order refresh to let optimistic update be visible
        setTimeout(() => {
          fetchOrders(true);
        }, 1000);
      }, 3000); // Increased delay to let optimistic update be visible
      
      // Offer WhatsApp notification
      if (response.data?.whatsapp_link && formData.customer_phone) {
        setTimeout(() => {
          if (window.confirm('Send order confirmation via WhatsApp?')) {
            window.open(response.data.whatsapp_link, '_blank');
          }
        }, 500);
      }

    } catch (error) {
      console.error('Order creation failed:', error);
      
      // Remove optimistic order on failure
      setOrders(prevOrders => prevOrders.filter(order => order.id !== `temp_${now}`));
      
      const errorMsg = error.response?.data?.detail || error.message || 'Failed to create order';
      toast.error(`Order creation failed: ${errorMsg}`);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const resetForm = () => {
    setFormData({ table_id: '', customer_name: '', customer_phone: '' });
    setSelectedItems([]);
    setMenuSearch('');
    setActiveCategory('all');
  };

  const handleStatusChangeWithTracking = (orderId, status) => {
    // Immediately track user interaction to pause polling
    localStorage.setItem('lastUserInteraction', Date.now().toString());
    
    // Provide immediate visual feedback by adding a "clicked" state
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId 
          ? { ...order, button_clicked: true, clicked_status: status }
          : order
      )
    );
    
    // Clear the clicked state after a short delay
    setTimeout(() => {
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, button_clicked: false, clicked_status: undefined }
            : order
        )
      );
    }, 200);
    
    // Call the actual status change handler
    handleStatusChange(orderId, status);
  };

  const handleStatusChange = async (orderId, status) => {
    console.log('🔄 Status change requested:', orderId, 'to', status);
    
    // 🚫 PREVENT DOUBLE-CLICKS: Check if already processing this order
    if (processingStatusChanges.has(orderId)) {
      console.log('⏸️ Status change already in progress for order:', orderId);
      return;
    }

    // 🚫 PREVENT SAME STATUS: Don't allow changing to the same status
    const existingOrder = orders.find(order => order.id === orderId);
    if (existingOrder?.status === status) {
      console.log('⏸️ Order already has this status:', orderId, status);
      return;
    }

    console.log('✅ Status change proceeding:', orderId, existingOrder?.status, '->', status);

    // Add to processing set immediately with longer duration
    setProcessingStatusChanges(prev => new Set([...prev, orderId]));

    // Store original status for potential rollback
    const originalStatus = existingOrder?.status;
    
    // 🚀 INSTANT VISUAL FEEDBACK - Update UI immediately with stronger persistence
    const instantUpdateTimestamp = Date.now();
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId 
          ? { 
              ...order, 
              status,
              updated_at: new Date().toISOString(),
              instant_update: true,
              instant_update_timestamp: instantUpdateTimestamp,
              processing_status: true,
              original_status: originalStatus // Store for rollback
            }
          : order
      )
    );

    // 🎵 IMMEDIATE SOUND FEEDBACK
    const statusSounds = {
      'preparing': 'cooking',
      'ready': 'success',
      'completed': 'success'
    };
    
    if (statusSounds[status]) {
      playSound(statusSounds[status]);
    }
    
    // 📳 IMMEDIATE VIBRATION FEEDBACK
    try {
      if (navigator.vibrate) {
        if (status === 'preparing') {
          navigator.vibrate([100, 50, 100]); // Cooking pattern
        } else if (status === 'ready') {
          navigator.vibrate([200, 100, 200, 100, 200]); // Ready pattern - more celebratory
        } else if (status === 'completed') {
          navigator.vibrate([150, 50, 150, 50, 150]); // Completion pattern
        }
      }
    } catch (e) {}
    
    // 🎉 IMMEDIATE TOAST FEEDBACK
    const statusMessages = {
      'preparing': '👨‍🍳 Started cooking!',
      'ready': '🎉 Order is ready!',
      'completed': '✅ Order completed!'
    };
    
    if (statusMessages[status]) {
      toast.success(statusMessages[status], {
        duration: 2000,
        style: {
          background: status === 'preparing' ? 'linear-gradient(135deg, #f59e0b, #d97706)' :
                     status === 'ready' ? 'linear-gradient(135deg, #10b981, #059669)' :
                     'linear-gradient(135deg, #8b5cf6, #7c3aed)',
          color: 'white',
          fontWeight: 'bold'
        }
      });
    }

    // 🔄 BACKGROUND SERVER UPDATE (non-blocking)
    try {
      const response = await apiWithRetry({
        method: 'put',
        url: `${API}/orders/${orderId}/status?status=${status}&frontend_origin=${encodeURIComponent(window.location.origin)}`,
        timeout: 15000 // Increased timeout for better reliability
      });
      
      console.log('✅ Server status update successful:', orderId, status);
      
      // ✅ SUCCESS: Update order with server response but preserve instant update
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { 
                ...order, 
                ...response.data,
                status, // Ensure status is what we set
                processing_status: false,
                server_synced: true,
                // Keep instant_update flag for longer to prevent polling override
                instant_update: true,
                instant_update_timestamp: instantUpdateTimestamp
              }
            : order
        )
      );
      
      // Only move to Today's Bills if order is completed/paid
      if (status === 'completed') {
        setTimeout(() => {
          setOrders(prevOrders => {
            const completedOrder = prevOrders.find(order => order.id === orderId);
            if (completedOrder) {
              // Add to today's bills
              setTodaysBills(prevBills => [
                { ...completedOrder, status: 'completed' },
                ...prevBills
              ]);
              // Remove from active orders
              return prevOrders.filter(order => order.id !== orderId);
            }
            return prevOrders;
          });
        }, 2000);
      }
      
      // WhatsApp notification
      if (response.data?.whatsapp_link && response.data?.customer_phone) {
        setTimeout(() => {
          if (window.confirm(`Send "${status}" update via WhatsApp?`)) {
            window.open(response.data.whatsapp_link, '_blank');
          }
        }, 300);
      }
      
    } catch (error) {
      console.error('❌ Status update failed:', error);
      
      // 🔄 REVERT ON ERROR - Silent rollback with user feedback
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { 
                ...order, 
                status: order.original_status || originalStatus || order.status,
                processing_status: false,
                instant_update: false,
                error_state: true
              }
            : order
        )
      );
      
      // Error feedback
      try {
        if (navigator.vibrate) {
          navigator.vibrate([300, 100, 300]);
        }
      } catch (e) {}
      
      const errorMessage = error.response?.data?.detail || error.message || 'Network error';
      toast.error(`❌ Failed to update status: ${errorMessage}`, {
        duration: 4000,
        style: {
          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
          color: 'white',
          fontWeight: 'bold'
        }
      });
    } finally {
      // Clean up processing state with shorter delay for faster responsiveness
      setTimeout(() => {
        setProcessingStatusChanges(prev => {
          const newSet = new Set(prev);
          newSet.delete(orderId);
          return newSet;
        });
        
        // Trigger immediate refresh to sync with server
        setNeedsImmediateRefresh(true);
      }, 300); // Reduced from 500ms to 300ms
      
      // Clear instant update flag after longer delay to prevent polling conflicts
      setTimeout(() => {
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId
              ? { 
                  ...order, 
                  instant_update: false,
                  instant_update_timestamp: undefined,
                  error_state: false,
                  original_status: undefined
                }
              : order
          )
        );
      }, 8000); // Keep instant update for 8 seconds to prevent polling override
    }
  };

  const handlePrintKOT = (order) => {
    try {
      printKOTUtil(order, businessSettings);
      toast.success('KOT sent to printer');
    } catch (error) {
      console.error('Print KOT failed:', error);
      toast.error('Failed to print KOT');
    }
  };

  const handleWhatsappShare = async () => {
    if (!whatsappPhone.trim()) {
      toast.error('Please enter a phone number');
      return;
    }
    
    try {
      const response = await apiWithRetry({
        method: 'post',
        url: `${API}/whatsapp/send-receipt/${whatsappModal.orderId}`,
        data: {
          phone_number: whatsappPhone,
          customer_name: whatsappModal.customerName || ''
        },
        timeout: 10000
      });
      
      if (response.data?.whatsapp_link) {
        window.open(response.data.whatsapp_link, '_blank');
        toast.success('Opening WhatsApp...');
      }
      setWhatsappModal({ open: false, orderId: null, customerName: '' });
      setWhatsappPhone('');
    } catch (error) {
      console.error('WhatsApp share failed:', error);
      toast.error(error.response?.data?.detail || 'Failed to share');
    }
  };

  const handleViewOrder = (order) => {
    if (!order) return;
    setViewOrderModal({ open: true, order });
    setActionMenuOpen(null);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700',
      preparing: 'bg-blue-100 text-blue-700',
      ready: 'bg-green-100 text-green-700',
      completed: 'bg-gray-100 text-gray-700',
      cancelled: 'bg-red-100 text-red-700',
      credit: 'bg-orange-100 text-orange-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const handlePrintReceipt = (order) => {
    setPrintLoading(true);
    try {
      printReceiptUtil(order, businessSettings);
      toast.success('Receipt sent to printer');
    } catch (error) {
      console.error('Print receipt failed:', error);
      toast.error('Failed to print receipt');
    } finally {
      setPrintLoading(false);
    }
    setActionMenuOpen(null);
  };

  const handleEditOrder = (order) => {
    setEditOrderModal({ open: true, order });
    setActionMenuOpen(null);
  };

  // Add manual item (not from menu)

  // Update order items
  const handleUpdateOrder = async (payload) => {
    try {
      await apiWithRetry({
        method: 'put',
        url: `${API}/orders/${editOrderModal.order.id}`,
        data: payload,
        timeout: 10000
      });
      toast.success('Order updated successfully!');
      setEditOrderModal({ open: false, order: null });
      await fetchOrders();
    } catch (error) {
      console.error('Update order failed:', error);
      // Error handling is done by apiWithRetry
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelConfirmModal.order?.id) return;
    try {
      await apiWithRetry({
        method: 'put',
        url: `${API}/orders/${cancelConfirmModal.order.id}/cancel`,
        timeout: 10000
      });
      toast.success('Order cancelled');
      setCancelConfirmModal({ open: false, order: null });
      await Promise.all([fetchOrders(), fetchTables()]);
    } catch (error) {
      console.error('Cancel order failed:', error);
      // Error handling is done by apiWithRetry
    }
  };

  const handleDeleteOrder = async () => {
    if (!deleteConfirmModal.order?.id) return;
    try {
      await apiWithRetry({
        method: 'delete',
        url: `${API}/orders/${deleteConfirmModal.order.id}`,
        timeout: 10000
      });
      toast.success('Order deleted');
      setDeleteConfirmModal({ open: false, order: null });
      await Promise.all([fetchOrders(), fetchTables()]);
    } catch (error) {
      console.error('Delete order failed:', error);
      // Error handling is done by apiWithRetry
    }
  };

  // Mark order as credit (unpaid)
  const handleMarkAsCredit = async (order) => {
    if (!order?.id) return;
    
    // Check if customer name exists
    if (!order.customer_name?.trim()) {
      toast.error('Customer name is required for credit bills. Please edit the order first.');
      setActionMenuOpen(null);
      return;
    }
    
    try {
      await apiWithRetry({
        method: 'put',
        url: `${API}/orders/${order.id}`,
        data: {
          is_credit: true,
          payment_method: 'credit',
          payment_received: 0,
          balance_amount: order.total
        },
        timeout: 10000
      });
      toast.success('Marked as credit bill');
      setActionMenuOpen(null);
      await fetchOrders();
    } catch (error) {
      console.error('Mark as credit failed:', error);
      // Error handling is done by apiWithRetry
    }
  };

  // Mark credit bill as paid
  const handleMarkAsPaid = async (order) => {
    if (!order?.id) return;
    try {
      await apiWithRetry({
        method: 'put',
        url: `${API}/orders/${order.id}`,
        data: {
          is_credit: false,
          payment_method: 'cash',
          payment_received: order.total,
          balance_amount: 0
        },
        timeout: 10000
      });
      toast.success('Marked as paid');
      setActionMenuOpen(null);
      await fetchOrders();
    } catch (error) {
      console.error('Mark as paid failed:', error);
      // Error handling is done by apiWithRetry
    }
  };

  // Add state for table-wise ordering toggle - make it persistent in localStorage
  const [tableWiseOrdering, setTableWiseOrdering] = useState(() => {
    // Default to true, but allow user to override
    const saved = localStorage.getItem('tableWiseOrdering');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const tableWiseOrderingRef = useRef(tableWiseOrdering);
  
  // Update ref and localStorage whenever state changes
  useEffect(() => {
    tableWiseOrderingRef.current = tableWiseOrdering;
    localStorage.setItem('tableWiseOrdering', JSON.stringify(tableWiseOrdering));
  }, [tableWiseOrdering]);

  // Handle table-wise ordering toggle
  const handleTableWiseOrderingToggle = (checked) => {
    setTableWiseOrdering(checked);
    if (!checked) {
      // Clear table selection when disabling table-wise ordering
      setFormData(prev => ({ ...prev, table_id: '' }));
    }
  };
  const availableTables = tables.filter(t => t.status === 'available');

  return (
    <Layout user={user}>
      <style jsx>{`
        .touch-target {
          min-height: 44px;
          min-width: 44px;
        }
        
        @media (max-width: 640px) {
          .touch-target {
            min-height: 48px;
            min-width: 48px;
          }
        }
        
        /* Prevent zoom on input focus (iOS) */
        @media screen and (max-width: 767px) {
          input[type="text"], 
          input[type="number"], 
          input[type="search"],
          select {
            font-size: 16px !important;
          }
        }
        
        /* Enhanced modal responsiveness for small screens */
        .modal-content {
          max-height: calc(100vh - 2rem);
          overflow-y: auto;
        }
        
        @media (max-width: 640px) {
          .modal-content {
            max-height: calc(100vh - 1rem);
            margin: 0.5rem;
          }
        }
        
        /* Ensure modal fits on very small screens like iPhone 17 */
        @media (max-height: 700px) {
          .modal-content {
            max-height: calc(100vh - 0.5rem);
            margin: 0.25rem;
          }
        }
        
        /* Fixed bottom button area for small screens */
        @media (max-width: 640px) and (max-height: 700px) {
          .fixed-bottom-button {
            position: sticky;
            bottom: 0;
            z-index: 10;
            background: white;
            border-top: 1px solid #e5e7eb;
          }
        }
      `}</style>
      {/* Full-screen Menu Selection Page (Step 2) */}
      {showMenuPage && (
        <div className="fixed inset-0 z-50 bg-gray-100">
          <div className="h-full flex flex-col">
            {/* Header - Clean Design */}
            <div className="bg-violet-600 text-white px-4 py-3 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { setShowMenuPage(false); resetForm(); }}
                    className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-lg"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h1 className="text-lg font-bold">Add Items</h1>
                    <p className="text-sm text-white/80">
                      {formData.table_id ? `Table ${tables.find(t => t.id === formData.table_id)?.table_number || ''}` : 'Counter Order'}
                      {formData.customer_name && ` • ${formData.customer_name}`}
                    </p>
                  </div>
                </div>
                {selectedItems.length > 0 && (
                  <div className="flex items-center gap-2 bg-white text-violet-600 px-3 py-2 rounded-lg">
                    <ShoppingCart className="w-4 h-4" />
                    <span className="font-bold text-lg">{selectedItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Search and Categories - Enhanced */}
            <div className="bg-white px-3 py-2 border-b border-gray-100">
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search items..."
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  className="pl-9 h-10 text-sm rounded-full border-gray-200 focus:border-violet-400 bg-gray-50 focus:bg-white"
                />
                {menuSearch && (
                  <button 
                    onClick={() => setMenuSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center text-white hover:bg-gray-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                      activeCategory === cat
                        ? 'bg-violet-600 text-white'
                        : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                    }`}
                  >
                    {cat === 'all' ? '🍽️ All' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Grid - Enhanced Round Plate Style */}
            <div className="flex-1 overflow-y-auto px-2 py-2 bg-gray-50" style={{ paddingBottom: '160px' }}>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                {menuItems
                  .filter(item => {
                    const matchesSearch = item.name.toLowerCase().includes(menuSearch.toLowerCase());
                    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
                    return matchesSearch && matchesCategory;
                  })
                  .map(item => {
                    const selectedItem = selectedItems.find(si => si.menu_item_id === item.id);
                    const quantity = selectedItem?.quantity || 0;
                    
                    // Generate consistent color based on item name
                    const colors = ['bg-rose-50', 'bg-orange-50', 'bg-amber-50', 'bg-lime-50', 'bg-emerald-50', 'bg-cyan-50', 'bg-blue-50', 'bg-violet-50', 'bg-pink-50'];
                    const colorIndex = item.name.charCodeAt(0) % colors.length;
                    const bgColor = colors[colorIndex];
                    
                    return (
                      <div
                        key={item.id}
                        className="flex flex-col items-center py-1"
                      >
                        {/* Round Plate with tap animation */}
                        <div
                          onClick={() => {
                            if (quantity === 0) {
                              handleAddItem(item);
                            } else {
                              playSound('add');
                              const idx = selectedItems.findIndex(si => si.menu_item_id === item.id);
                              handleQuantityChange(idx, quantity + 1);
                            }
                          }}
                          className={`relative w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-full cursor-pointer select-none transition-transform duration-150 active:scale-90 ${
                            quantity > 0 ? 'ring-2 ring-violet-500 ring-offset-1' : ''
                          }`}
                        >
                          {/* Plate Background */}
                          {item.image_url ? (
                            <img 
                              src={item.image_url} 
                              alt={item.name}
                              className="w-full h-full rounded-full object-cover border-3 border-white shadow-md"
                              loading="lazy"
                            />
                          ) : (
                            <div className={`w-full h-full rounded-full border-3 border-white shadow-md flex items-center justify-center ${bgColor}`}>
                              <span className="text-2xl sm:text-3xl">
                                {item.category?.toLowerCase().includes('beverage') ? '🥤' :
                                 item.category?.toLowerCase().includes('snack') ? '🍟' :
                                 item.category?.toLowerCase().includes('pizza') ? '🍕' :
                                 item.category?.toLowerCase().includes('burger') ? '🍔' :
                                 item.category?.toLowerCase().includes('rice') ? '🍚' :
                                 item.category?.toLowerCase().includes('noodle') ? '🍜' :
                                 item.category?.toLowerCase().includes('soup') ? '🍲' :
                                 item.category?.toLowerCase().includes('dessert') ? '🍰' :
                                 item.category?.toLowerCase().includes('ice') ? '🍨' :
                                 item.category?.toLowerCase().includes('coffee') ? '☕' :
                                 item.category?.toLowerCase().includes('tea') ? '🍵' :
                                 item.category?.toLowerCase().includes('juice') ? '🧃' :
                                 item.category?.toLowerCase().includes('salad') ? '🥗' :
                                 item.category?.toLowerCase().includes('sandwich') ? '🥪' :
                                 item.category?.toLowerCase().includes('chicken') ? '🍗' :
                                 item.category?.toLowerCase().includes('fish') ? '🐟' :
                                 item.category?.toLowerCase().includes('egg') ? '🍳' :
                                 item.category?.toLowerCase().includes('bread') ? '🍞' :
                                 '🍽️'}
                              </span>
                            </div>
                          )}
                          
                          {/* Quantity Badge */}
                          {quantity > 0 && (
                            <div className="absolute -top-0.5 -right-0.5 w-6 h-6 bg-violet-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow border-2 border-white animate-bounce-once">
                              {quantity}
                            </div>
                          )}
                          
                          {/* Tap indicator for unselected */}
                          {quantity === 0 && (
                            <div className="absolute bottom-0 right-0 w-5 h-5 bg-violet-600 rounded-full flex items-center justify-center shadow border border-white">
                              <Plus className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        
                        {/* Quantity Controls (when selected) */}
                        {quantity > 0 && (
                          <div className="flex items-center gap-0.5 mt-0.5 bg-white rounded-full shadow-sm border border-gray-100 px-0.5 py-0.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                const idx = selectedItems.findIndex(si => si.menu_item_id === item.id);
                                if (quantity === 1) {
                                  handleRemoveItem(idx);
                                } else {
                                  playSound('remove');
                                  handleQuantityChange(idx, quantity - 1);
                                }
                              }}
                              className="w-6 h-6 flex items-center justify-center bg-red-50 text-red-500 rounded-full text-sm font-bold active:scale-90"
                            >
                              −
                            </button>
                            <button
                              onClick={() => {
                                playSound('add');
                                const idx = selectedItems.findIndex(si => si.menu_item_id === item.id);
                                handleQuantityChange(idx, quantity + 1);
                              }}
                              className="w-6 h-6 flex items-center justify-center bg-violet-600 rounded-full text-white text-sm font-bold active:scale-90"
                            >
                              +
                            </button>
                          </div>
                        )}
                        
                        {/* Item Name & Price - Compact */}
                        <p className="text-[10px] font-medium text-gray-600 text-center mt-0.5 line-clamp-1 w-full leading-tight">{item.name}</p>
                        <p className="text-xs font-bold text-violet-600">₹{item.price}</p>
                      </div>
                    );
                  })}
              </div>
              
              {/* Loading State for Menu */}
              {menuLoading && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="w-8 h-8 border-3 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <p className="text-lg font-semibold text-gray-700">Loading menu...</p>
                  <p className="text-gray-500 mt-1 text-sm">Getting fresh menu items</p>
                </div>
              )}
              
              {/* Empty State - Only show when not loading and no items */}
              {!menuLoading && menuItems.filter(item => {
                const matchesSearch = item.name.toLowerCase().includes(menuSearch.toLowerCase());
                const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
                return matchesSearch && matchesCategory;
              }).length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-lg font-semibold text-gray-700">No items found</p>
                  <p className="text-gray-500 mt-1 text-sm">Try a different search or category</p>
                  <button 
                    onClick={() => { setMenuSearch(''); setActiveCategory('all'); }}
                    className="mt-4 px-5 py-2 bg-violet-100 text-violet-600 rounded-lg font-medium hover:bg-violet-200 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>

            {/* Fixed Bottom Cart - Expandable Drag-Up Design */}
            <div 
              className={`fixed left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-[60] transition-all duration-300 ease-out ${
                cartExpanded ? 'bottom-0 rounded-t-2xl' : 'bottom-16'
              }`}
              style={{ maxHeight: cartExpanded ? '70vh' : 'auto' }}
            >
              {selectedItems.length > 0 ? (
                <div className="flex flex-col h-full">
                  {/* Drag Handle - Tap to expand/collapse */}
                  <button 
                    onClick={() => setCartExpanded(!cartExpanded)}
                    className="w-full py-2 flex flex-col items-center"
                  >
                    <div className="w-10 h-1 bg-gray-300 rounded-full mb-1"></div>
                    <p className="text-[10px] text-gray-400">
                      {cartExpanded ? 'Tap to minimize' : 'Tap to see all items'}
                    </p>
                  </button>
                  
                  {/* Expanded View - Full Item List */}
                  {cartExpanded ? (
                    <div className="flex-1 overflow-y-auto px-3 pb-2" style={{ maxHeight: 'calc(70vh - 120px)' }}>
                      <div className="space-y-2">
                        {selectedItems.map((item, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 rounded-xl p-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span className="w-8 h-8 bg-violet-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">{item.quantity}</span>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-gray-800 text-sm truncate">{item.name}</p>
                                <p className="text-xs text-gray-500">₹{item.price} each</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <div className="flex items-center gap-1 bg-white rounded-full border px-1 py-0.5">
                                <button
                                  onClick={() => {
                                    if (item.quantity === 1) {
                                      handleRemoveItem(index);
                                    } else {
                                      playSound('remove');
                                      handleQuantityChange(index, item.quantity - 1);
                                    }
                                  }}
                                  className="w-6 h-6 flex items-center justify-center bg-red-50 text-red-500 rounded-full text-sm font-bold"
                                >
                                  −
                                </button>
                                <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                                <button
                                  onClick={() => {
                                    playSound('add');
                                    handleQuantityChange(index, item.quantity + 1);
                                  }}
                                  className="w-6 h-6 flex items-center justify-center bg-violet-600 text-white rounded-full text-sm font-bold"
                                >
                                  +
                                </button>
                              </div>
                              <span className="font-bold text-violet-600 w-16 text-right">₹{(item.price * item.quantity).toFixed(0)}</span>
                              <button onClick={() => handleRemoveItem(index)} className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                                <X className="w-3 h-3 text-red-500" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Collapsed View - Horizontal scroll */
                    <div className="flex gap-1.5 px-2 pb-2 overflow-x-auto scrollbar-hide">
                      {selectedItems.map((item, index) => (
                        <div key={index} className="flex items-center gap-1.5 bg-violet-50 border border-violet-100 rounded-full pl-1 pr-2 py-1 flex-shrink-0">
                          <span className="w-5 h-5 bg-violet-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">{item.quantity}</span>
                          <span className="text-[11px] font-medium text-gray-700 max-w-[60px] truncate">{item.name}</span>
                          <span className="text-[11px] font-bold text-violet-600">₹{(item.price * item.quantity).toFixed(0)}</span>
                          <button onClick={() => handleRemoveItem(index)} className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center">
                            <X className="w-2.5 h-2.5 text-red-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Total Bar - Always visible */}
                  <div className={`flex items-center justify-between bg-violet-600 mx-2 mb-2 rounded-xl px-3 py-2 ${cartExpanded ? 'mb-4' : ''}`}>
                    <div className="flex items-center gap-2 text-white">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <ShoppingCart className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] text-violet-200">{selectedItems.reduce((sum, item) => sum + item.quantity, 0)} items</p>
                        <p className="text-base font-bold leading-tight">₹{selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(0)}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => { playSound('success'); handleSubmitOrder(); }}
                      disabled={selectedItems.length === 0}
                      className="bg-white text-violet-600 font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 disabled:opacity-50 active:scale-95 transition-transform text-sm"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Create
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-3 text-center">
                  <p className="text-gray-400 text-sm">👆 Tap items to add</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4 sm:space-y-6" data-testid="orders-page">
        <TrialBanner user={user} />
        <div className="flex justify-between items-center flex-wrap gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-4xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Orders</h1>
              {/* Live indicator */}
              <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Live
              </div>
            </div>
            <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Manage restaurant orders • Updates every 2 seconds</p>
          </div>
          {['admin', 'waiter', 'cashier'].includes(user?.role) && (
            <div className="flex items-center gap-3">
              {/* New Order Button - Unified for both KOT modes */}
              <Button 
                onClick={() => {
                  // KOT disabled + skip prompt = go directly to menu
                  if (businessSettings?.kot_mode_enabled === false && skipCustomerPrompt) {
                    setFormData({ table_id: '', customer_name: '', customer_phone: '' });
                    setShowMenuPage(true);
                  } else {
                    setDialogOpen(true);
                  }
                }}
                className="bg-violet-600 hover:bg-violet-700 text-sm sm:text-base" 
                data-testid="create-order-button"
              >
                <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                <span>New Order</span>
              </Button>

              {/* Real-time Refresh Button - Responsive: Round on mobile, full button on desktop */}
              <Button 
                onClick={handleManualRefresh}
                variant="outline"
                className="sm:text-sm sm:border-violet-200 sm:text-violet-600 sm:hover:bg-violet-50 sm:px-3 sm:py-2 sm:h-auto sm:w-auto sm:rounded-lg w-10 h-10 rounded-full p-0 flex items-center justify-center" 
                disabled={loading}
                title="Real-time Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''} sm:mr-2`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          )}

        {/* Unified New Order Dialog - Works for both KOT enabled/disabled */}
        {dialogOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
                  <div className="bg-white rounded-2xl w-full max-w-md sm:max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[95vh] sm:max-h-[90vh]">
                    {/* Header with Icon */}
                    <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-4 sm:p-5 text-center relative flex-shrink-0">
                      <button 
                        onClick={() => { setDialogOpen(false); resetForm(); }}
                        className="absolute top-3 right-3 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors touch-target"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                        {businessSettings?.kot_mode_enabled !== false ? (
                          <Receipt className="w-8 h-8 text-violet-600" />
                        ) : (
                          <ShoppingCart className="w-8 h-8 text-violet-600" />
                        )}
                      </div>
                      <h2 className="text-xl font-bold text-white">New Order</h2>
                      <p className="text-violet-200 text-sm mt-1">
                        {businessSettings?.kot_mode_enabled !== false 
                          ? (tableWiseOrdering ? 'Select table & add customer info' : '✓ Table selection disabled - add customer info')
                          : 'Add customer details or skip'}
                      </p>
                    </div>
                    
                    {/* Form - Scrollable */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 min-h-0">
                      {/* Table-wise Ordering Toggle - Only show when KOT is enabled */}
                      {businessSettings?.kot_mode_enabled !== false && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs">🍽️</span>
                              <span className="text-sm font-medium text-gray-700">Table-wise Ordering</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={tableWiseOrdering}
                                onChange={(e) => handleTableWiseOrderingToggle(e.target.checked)}
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                          {!tableWiseOrdering && (
                            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                              <p className="text-sm text-green-700 flex items-center gap-2">
                                <span className="text-green-500">✓</span>
                                <span className="font-medium">Table selection disabled</span>
                              </p>
                              <p className="text-xs text-green-600 mt-1">Orders will be created as counter sales without table assignment</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Table Selection - Only show when KOT is enabled AND table-wise ordering is on */}
                      {businessSettings?.kot_mode_enabled !== false && tableWiseOrdering && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <span className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 text-xs">🪑</span>
                              Select Table <span className="text-red-500">*</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => fetchTables(true)}
                              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 touch-target p-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Refresh
                            </button>
                          </div>
                          <div className="relative">
                            <select
                              className="w-full px-4 py-3 text-base border-2 rounded-xl bg-white appearance-none cursor-pointer focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
                              value={formData.table_id}
                              onChange={(e) => setFormData({ ...formData, table_id: e.target.value })}
                              data-testid="order-table-select"
                            >
                              <option value="">Choose a table...</option>
                              {availableTables.map(table => (
                                <option key={table.id} value={table.id}>
                                  Table {table.table_number} ({table.capacity} seats)
                                </option>
                              ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                          {availableTables.length === 0 && (
                            <div className="space-y-2 mt-2">
                              <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-xl">
                                <span className="text-orange-500 text-lg">⚠️</span>
                                <p className="text-sm text-orange-700 font-medium">No tables available</p>
                              </div>
                              <p className="text-xs text-orange-600 px-3">All tables are currently occupied. You can:</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleTableWiseOrderingToggle(false)}
                                  className="w-full px-3 py-3 text-sm bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors font-medium touch-target"
                                >
                                  Skip Table Selection
                                </button>
                                <button
                                  type="button"
                                  onClick={() => window.open('/tables', '_blank')}
                                  className="w-full px-3 py-3 text-sm bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors font-medium touch-target"
                                >
                                  Create New Table
                                </button>
                              </div>
                            </div>
                          )}
                          {availableTables.length > 0 && (
                            <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                              {availableTables.length} table{availableTables.length > 1 ? 's' : ''} available
                            </p>
                          )}
                        </div>
                      )}
                      
                      {/* Customer Name */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <span className="w-6 h-6 bg-violet-100 rounded-full flex items-center justify-center text-violet-600 text-xs">👤</span>
                          Customer Name
                        </label>
                        <Input
                          value={formData.customer_name}
                          onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                          placeholder={businessSettings?.kot_mode_enabled !== false ? "Enter customer name (optional)" : "Enter name or leave blank"}
                          className="mt-2 h-12 text-base rounded-xl border-gray-200 focus:border-violet-400 focus:ring-violet-400"
                          autoFocus={businessSettings?.kot_mode_enabled === false}
                        />
                      </div>
                      
                      {/* Phone */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xs">📱</span>
                          Phone Number
                          <span className="text-xs text-gray-400 font-normal">(for WhatsApp)</span>
                        </label>
                        <Input
                          value={formData.customer_phone}
                          onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                          placeholder="+91 9876543210"
                          className="mt-2 h-12 text-base rounded-xl border-gray-200 focus:border-violet-400 focus:ring-violet-400"
                        />
                      </div>
                      
                      {/* Don't ask again - Only show when KOT is disabled */}
                      {businessSettings?.kot_mode_enabled === false && (
                        <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors touch-target">
                          <input
                            type="checkbox"
                            checked={skipCustomerPrompt}
                            onChange={(e) => {
                              setSkipCustomerPrompt(e.target.checked);
                              localStorage.setItem('skipCustomerPrompt', e.target.checked ? 'true' : 'false');
                            }}
                            className="w-5 h-5 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-700">Skip this next time</p>
                            <p className="text-xs text-gray-500">Go directly to menu</p>
                          </div>
                        </label>
                      )}
                    </div>
                    
                    {/* Fixed Bottom Button - Always visible */}
                    <div className="flex-shrink-0 p-4 sm:p-5 pt-3 border-t border-gray-100 bg-white">
                      <button 
                        onClick={() => {
                          // Only require table selection if KOT is enabled AND table-wise ordering is on
                          if (businessSettings?.kot_mode_enabled !== false && tableWiseOrdering && !formData.table_id) {
                            toast.error('Please select a table or disable table-wise ordering');
                            return;
                          }
                          
                          setDialogOpen(false);
                          setShowMenuPage(true);
                        }}
                        className="w-full h-12 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-500/25 touch-target"
                      >
                        {businessSettings?.kot_mode_enabled !== false ? (
                          <>
                            Next: Add Items
                            <ArrowRight className="w-4 h-4" />
                          </>
                        ) : formData.customer_name ? (
                          <>
                            Continue
                            <ArrowRight className="w-4 h-4" />
                          </>
                        ) : (
                          <>💵 Cash Sale</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

        </div>

        {/* Tabs for Active Orders and Today's Bills */}
        <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => {
              setActiveTab('active');
              // Immediate refresh when switching to Active Orders
              setTimeout(() => fetchOrders(), 100);
            }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'active'
                ? 'bg-white text-violet-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            Active Orders
            <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'active' ? 'bg-violet-100 text-violet-700' : 'bg-gray-200'}`}>
              {loading ? '...' : orders.filter(o => !['completed', 'cancelled', 'paid'].includes(o.status)).length}
            </span>
          </button>
          <button
            onClick={() => {
              setActiveTab('history');
              // Immediate refresh when switching to Today's Bills
              setTimeout(() => fetchTodaysBills(), 100);
            }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'history'
                ? 'bg-white text-violet-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            Today's Bills
            <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'history' ? 'bg-violet-100 text-violet-700' : 'bg-gray-200'}`}>
              {loading ? '...' : todaysBills.length}
            </span>
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm animate-pulse">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div>
                      <div className="w-20 h-4 bg-gray-200 rounded mb-1"></div>
                      <div className="w-32 h-3 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                  <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
                </div>
                <div className="space-y-2">
                  <div className="w-full h-3 bg-gray-200 rounded"></div>
                  <div className="w-3/4 h-3 bg-gray-200 rounded"></div>
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                  <div className="w-16 h-4 bg-gray-200 rounded"></div>
                  <div className="w-20 h-6 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Active Orders Tab */}
        {!loading && activeTab === 'active' && (
          <div className="space-y-3">
            {orders.filter(order => !['completed', 'cancelled'].includes(order.status) && order.status !== 'paid').length === 0 && (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
                <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🍽️</span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">No Active Orders</h3>
                <p className="text-gray-500 text-sm">All clear! Tap "New Order" to get started</p>
              </div>
            )}
            {orders.filter(order => !['completed', 'cancelled', 'paid'].includes(order.status)).map((order) => {
              const statusConfig = {
                pending: { color: 'amber', icon: '⏳', label: 'Pending', bg: 'bg-amber-500' },
                preparing: { color: 'blue', icon: '👨‍🍳', label: 'Cooking', bg: 'bg-blue-500' },
                ready: { color: 'emerald', icon: '✅', label: 'Ready', bg: 'bg-emerald-500' }
              };
              const config = statusConfig[order.status] || statusConfig.pending;
              
              return (
                <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" data-testid={`order-card-${order.id}`}>
                  {/* Header Row */}
                  <div className="flex items-center justify-between p-3 border-b border-gray-50">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${config.bg} rounded-xl flex items-center justify-center text-white text-lg shadow-sm`}>
                        {config.icon}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">#{order.id.slice(0, 6)}</p>
                        <p className="text-xs text-gray-500">
                          {order.table_number > 0 ? `Table ${order.table_number}` : 'Counter'} • {
                            (() => {
                              try {
                                return new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                              } catch (e) {
                                console.warn('Invalid date for order:', order.id, order.created_at);
                                return 'Invalid time';
                              }
                            })()
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-${config.color}-100 text-${config.color}-700`}>
                        {config.label}
                      </span>
                      {['admin', 'cashier'].includes(user?.role) && (
                        <button
                          onClick={() => setActionMenuOpen(actionMenuOpen === order.id ? null : order.id)}
                          className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Bottom Sheet Action Menu for Active Orders */}
                  {actionMenuOpen === order.id && ['admin', 'cashier'].includes(user?.role) && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setActionMenuOpen(null)}>
                      <div 
                        className="w-full bg-white rounded-t-2xl overflow-hidden animate-in slide-in-from-bottom duration-200 pb-safe"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Handle */}
                        <div className="flex justify-center py-2">
                          <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
                        </div>
                        {/* Header */}
                        <div className="px-4 pb-3 border-b">
                          <h3 className="font-bold text-gray-800">Order #{order.id.slice(0, 6)}</h3>
                          <p className="text-sm text-gray-500">Select an action</p>
                        </div>
                        {/* Actions */}
                        <div className="py-2">
                          <button onClick={() => handleEditOrder(order)} className="w-full px-4 py-4 text-left active:bg-gray-100 flex items-center gap-3 border-b border-gray-100">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Edit className="w-5 h-5 text-blue-600" />
                            </div>
                            <span className="font-medium text-gray-800">Edit Order</span>
                          </button>
                          <button onClick={() => { setCancelConfirmModal({ open: true, order }); setActionMenuOpen(null); }} className="w-full px-4 py-4 text-left active:bg-gray-100 flex items-center gap-3 border-b border-gray-100">
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                              <Ban className="w-5 h-5 text-orange-600" />
                            </div>
                            <span className="font-medium text-orange-600">Cancel Order</span>
                          </button>
                          {user?.role === 'admin' && (
                            <button onClick={() => { setDeleteConfirmModal({ open: true, order }); setActionMenuOpen(null); }} className="w-full px-4 py-4 text-left active:bg-gray-100 flex items-center gap-3 border-b border-gray-100">
                              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                <Trash2 className="w-5 h-5 text-red-600" />
                              </div>
                              <span className="font-medium text-red-600">Delete Order</span>
                            </button>
                          )}
                        </div>
                        {/* Cancel Button */}
                        <div className="px-4 pb-4">
                          <button onClick={() => setActionMenuOpen(null)} className="w-full py-3 bg-gray-100 rounded-xl font-medium text-gray-600">
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Customer Info */}
                  {order.customer_name && (
                    <div className="px-3 py-2 bg-gray-50 flex items-center gap-2 text-sm">
                      <span className="text-gray-500">👤</span>
                      <span className="font-medium text-gray-700">{order.customer_name}</span>
                      {order.customer_phone && <span className="text-gray-400 text-xs">• {order.customer_phone}</span>}
                    </div>
                  )}
                  
                  {/* Items */}
                  <div className="p-3">
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 bg-violet-100 text-violet-600 rounded-md flex items-center justify-center text-xs font-bold">{item.quantity}</span>
                            <span className="text-gray-700">{item.name}</span>
                          </div>
                          <span className="font-medium text-gray-600">₹{(item.price * item.quantity).toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Total */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-dashed border-gray-200">
                      <span className="text-gray-500 text-sm">Total</span>
                      <span className="text-xl font-bold text-violet-600">₹{
                        (() => {
                          try {
                            return (order.total || 0).toFixed(0);
                          } catch (e) {
                            console.warn('Invalid total for order:', order.id, order.total);
                            return '0';
                          }
                        })()
                      }</span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="px-3 pb-3 flex gap-2">
                    {['admin', 'kitchen'].includes(user?.role) && order.status === 'pending' && (
                      <button 
                        onClick={() => handleStatusChangeWithTracking(order.id, 'preparing')} 
                        disabled={processingStatusChanges.has(order.id) || order.processing_status}
                        className={`flex-1 h-10 rounded-xl font-medium text-sm flex items-center justify-center gap-1.5 transition-all duration-200 shadow-lg hover:shadow-xl transform ${
                          processingStatusChanges.has(order.id) || order.processing_status
                            ? 'bg-green-500 text-white scale-95 cursor-not-allowed animate-pulse pointer-events-none'
                            : order.button_clicked && order.clicked_status === 'preparing'
                            ? 'bg-amber-600 text-white scale-95 animate-pulse'
                            : 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white active:scale-95 hover:scale-105 cursor-pointer'
                        }`}
                        style={{
                          boxShadow: processingStatusChanges.has(order.id) || order.processing_status
                            ? '0 0 20px rgba(34, 197, 94, 0.5)' 
                            : undefined,
                          transform: processingStatusChanges.has(order.id) || order.processing_status
                            ? 'scale(0.95)' 
                            : undefined,
                          cursor: processingStatusChanges.has(order.id) || order.processing_status ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {processingStatusChanges.has(order.id) || order.processing_status ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <span className="animate-bounce">👨‍🍳</span> Start Cooking
                          </>
                        )}
                      </button>
                    )}
                    {['admin', 'kitchen'].includes(user?.role) && order.status === 'preparing' && (
                      <button 
                        onClick={() => handleStatusChangeWithTracking(order.id, 'ready')} 
                        disabled={processingStatusChanges.has(order.id) || order.processing_status}
                        className={`flex-1 h-10 rounded-xl font-medium text-sm flex items-center justify-center gap-1.5 transition-all duration-200 shadow-lg hover:shadow-xl transform ${
                          processingStatusChanges.has(order.id) || order.processing_status
                            ? 'bg-green-600 text-white scale-95 cursor-not-allowed animate-pulse pointer-events-none'
                            : order.button_clicked && order.clicked_status === 'ready'
                            ? 'bg-emerald-600 text-white scale-95 animate-pulse'
                            : 'bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white active:scale-95 hover:scale-105 cursor-pointer'
                        }`}
                        style={{
                          boxShadow: processingStatusChanges.has(order.id) || order.processing_status
                            ? '0 0 20px rgba(16, 185, 129, 0.6)' // Emerald glow for ready
                            : undefined,
                          transform: processingStatusChanges.has(order.id) || order.processing_status
                            ? 'scale(0.95)' 
                            : undefined,
                          cursor: processingStatusChanges.has(order.id) || order.processing_status ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {processingStatusChanges.has(order.id) || order.processing_status ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <span className="animate-pulse text-lg">🎉</span> Mark Ready
                          </>
                        )}
                      </button>
                    )}
                    {['admin', 'waiter', 'cashier'].includes(user?.role) && order.status !== 'completed' && (
                      <button onClick={() => handlePrintKOT(order)} className="h-10 px-4 border border-gray-200 hover:bg-gray-50 rounded-xl font-medium text-sm flex items-center justify-center gap-1.5 text-gray-600">
                        <Printer className="w-4 h-4" /> KOT
                      </button>
                    )}
                    <OptimizedBillingButton order={order} user={user} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Today's Bills Tab */}
        {!loading && activeTab === 'history' && (
          <div className="space-y-3">
            {todaysBills.length === 0 && (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📋</span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">No Bills Today</h3>
                <p className="text-gray-500 text-sm">Completed orders will appear here</p>
              </div>
            )}
            {todaysBills.map((order) => {
              const isCompleted = order.status === 'completed';
              const isCancelled = order.status === 'cancelled';
              const hasCredit = order.is_credit || order.credit_amount > 0;
              
              return (
                <div key={order.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${isCancelled ? 'border-red-200 opacity-75' : hasCredit ? 'border-orange-200' : 'border-gray-100'}`}>
                  {/* Header */}
                  <div className="flex items-center justify-between p-3 border-b border-gray-50">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg shadow-sm ${isCancelled ? 'bg-red-500' : hasCredit ? 'bg-orange-500' : 'bg-emerald-500'}`}>
                        {isCancelled ? '❌' : hasCredit ? '⚠️' : '✅'}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">#{order.id.slice(0, 6)}</p>
                        <p className="text-xs text-gray-500">
                          {
                            (() => {
                              try {
                                return new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                              } catch (e) {
                                console.warn('Invalid date for order:', order.id, order.created_at);
                                return 'Invalid time';
                              }
                            })()
                          }
                          {order.payment_method && !isCancelled && (
                            <span className="ml-1">• {order.payment_method === 'split' ? 'Split' : order.payment_method}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasCredit && !isCancelled && (
                        <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-orange-100 text-orange-700">
                          ₹{(order.balance_amount || order.credit_amount || 0).toFixed(0)} due
                        </span>
                      )}
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isCancelled ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {isCancelled ? 'Cancelled' : 'Paid'}
                      </span>
                      {['admin', 'cashier'].includes(user?.role) && (
                        <button onClick={() => setActionMenuOpen(actionMenuOpen === order.id ? null : order.id)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Bottom Sheet Action Menu for Today's Bills */}
                  {actionMenuOpen === order.id && ['admin', 'cashier'].includes(user?.role) && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setActionMenuOpen(null)}>
                      <div 
                        className="w-full bg-white rounded-t-2xl overflow-hidden animate-in slide-in-from-bottom duration-200 pb-safe"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Handle */}
                        <div className="flex justify-center py-2">
                          <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
                        </div>
                        {/* Header */}
                        <div className="px-4 pb-3 border-b">
                          <h3 className="font-bold text-gray-800">Order #{order.id.slice(0, 6)}</h3>
                          <p className="text-sm text-gray-500">₹{order.total.toFixed(0)} • {isCancelled ? 'Cancelled' : hasCredit ? 'Credit' : 'Paid'}</p>
                        </div>
                        {/* Actions - Scrollable */}
                        <div className="py-2 max-h-[50vh] overflow-y-auto">
                          <button onClick={() => handleViewOrder(order)} className="w-full px-4 py-4 text-left active:bg-gray-100 flex items-center gap-3 border-b border-gray-100">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                              <Eye className="w-5 h-5 text-gray-600" />
                            </div>
                            <span className="font-medium text-gray-800">View Details</span>
                          </button>
                          {isCompleted && (
                            <button onClick={() => handleEditOrder(order)} className="w-full px-4 py-4 text-left active:bg-gray-100 flex items-center gap-3 border-b border-gray-100">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <Edit className="w-5 h-5 text-blue-600" />
                              </div>
                              <span className="font-medium text-gray-800">Edit Order</span>
                            </button>
                          )}
                          <button onClick={() => handlePrintReceipt(order)} className="w-full px-4 py-4 text-left active:bg-gray-100 flex items-center gap-3 border-b border-gray-100">
                            <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                              <Receipt className="w-5 h-5 text-violet-600" />
                            </div>
                            <span className="font-medium text-gray-800">Print Receipt</span>
                          </button>
                          <button onClick={() => { setWhatsappModal({ open: true, orderId: order.id, customerName: order.customer_name || '' }); setWhatsappPhone(order.customer_phone || ''); setActionMenuOpen(null); }} className="w-full px-4 py-4 text-left active:bg-gray-100 flex items-center gap-3 border-b border-gray-100">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <MessageCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <span className="font-medium text-gray-800">Share via WhatsApp</span>
                          </button>
                          {isCompleted && !hasCredit && (
                            <button onClick={() => handleMarkAsCredit(order)} className="w-full px-4 py-4 text-left active:bg-gray-100 flex items-center gap-3 border-b border-gray-100">
                              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                <Wallet className="w-5 h-5 text-orange-600" />
                              </div>
                              <span className="font-medium text-orange-600">Mark as Credit</span>
                            </button>
                          )}
                          {isCompleted && hasCredit && (
                            <button onClick={() => handleMarkAsPaid(order)} className="w-full px-4 py-4 text-left active:bg-gray-100 flex items-center gap-3 border-b border-gray-100">
                              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <DollarSign className="w-5 h-5 text-green-600" />
                              </div>
                              <span className="font-medium text-green-600">Mark as Paid</span>
                            </button>
                          )}
                          {user?.role === 'admin' && (
                            <button onClick={() => { setDeleteConfirmModal({ open: true, order }); setActionMenuOpen(null); }} className="w-full px-4 py-4 text-left active:bg-gray-100 flex items-center gap-3 border-b border-gray-100">
                              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                <Trash2 className="w-5 h-5 text-red-600" />
                              </div>
                              <span className="font-medium text-red-600">Delete Order</span>
                            </button>
                          )}
                        </div>
                        {/* Cancel Button */}
                        <div className="px-4 pb-4">
                          <button onClick={() => setActionMenuOpen(null)} className="w-full py-3 bg-gray-100 rounded-xl font-medium text-gray-600">
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Customer */}
                  {order.customer_name && (
                    <div className="px-3 py-2 bg-gray-50 flex items-center gap-2 text-sm">
                      <span className="text-gray-500">👤</span>
                      <span className="font-medium text-gray-700">{order.customer_name}</span>
                    </div>
                  )}
                  
                  {/* Compact Items + Total */}
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="w-6 h-6 bg-violet-100 text-violet-600 rounded-md flex items-center justify-center text-xs font-bold">
                          {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                        </span>
                        <span>{order.items.length} item{order.items.length > 1 ? 's' : ''}</span>
                      </div>
                      <span className={`text-xl font-bold ${isCancelled ? 'text-gray-400 line-through' : 'text-violet-600'}`}>
                        ₹{
                          (() => {
                            try {
                              return (order.total || 0).toFixed(0);
                            } catch (e) {
                              console.warn('Invalid total for order:', order.id, order.total);
                              return '0';
                            }
                          })()
                        }
                      </span>
                    </div>
                    
                    {/* Quick Actions */}
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => handleViewOrder(order)} className="flex-1 h-9 border border-gray-200 hover:bg-gray-50 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 text-gray-600">
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                      <button onClick={() => handlePrintReceipt(order)} className="flex-1 h-9 border border-gray-200 hover:bg-gray-50 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 text-gray-600">
                        <Receipt className="w-3.5 h-3.5" /> Print
                      </button>
                      <button onClick={() => { setWhatsappModal({ open: true, orderId: order.id, customerName: order.customer_name || '' }); setWhatsappPhone(order.customer_phone || ''); }} className="flex-1 h-9 border border-green-200 hover:bg-green-50 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 text-green-600">
                        <MessageCircle className="w-3.5 h-3.5" /> Share
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* WhatsApp Modal */}
        {whatsappModal.open && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3 sm:p-4">
            <Card className="w-full max-w-md border-0 shadow-2xl bg-white">
              <CardHeader className="relative p-4 sm:p-6">
                <button
                  onClick={() => { setWhatsappModal({ open: false, orderId: null, customerName: '' }); setWhatsappPhone(''); }}
                  className="absolute right-3 sm:right-4 top-3 sm:top-4 text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg pr-8">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                  Share via WhatsApp
                </CardTitle>
              </CardHeader>
              <div className="p-4 sm:p-6 pt-0 space-y-4">
                <div>
                  <Label className="text-sm">Phone Number</Label>
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

                <div className="flex gap-2 sm:gap-3">
                  <Button
                    onClick={handleWhatsappShare}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-sm sm:text-base"
                  >
                    Open WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { setWhatsappModal({ open: false, orderId: null, customerName: '' }); setWhatsappPhone(''); }}
                    className="text-sm sm:text-base"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* View Order Modal */}
        {viewOrderModal.open && viewOrderModal.order && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3 sm:p-4">
            <Card className="w-full max-w-lg border-0 shadow-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col bg-white">
              <CardHeader className="relative bg-violet-600 text-white rounded-t-lg p-4 sm:p-6 flex-shrink-0">
                <button
                  onClick={() => setViewOrderModal({ open: false, order: null })}
                  className="absolute right-3 sm:right-4 top-3 sm:top-4 text-white/80 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg pr-8">
                  <Receipt className="w-5 h-5" />
                  Order #{(viewOrderModal.order?.id || '').slice(0, 8)}
                </CardTitle>
                <p className="text-violet-100 text-xs sm:text-sm mt-1">
                  {viewOrderModal.order?.created_at ? new Date(viewOrderModal.order.created_at).toLocaleString() : ''}
                </p>
              </CardHeader>
              <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto flex-1">
                {/* Order Info */}
                <div className="grid grid-cols-2 gap-2 sm:gap-4 text-sm">
                  <div className="p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-xs">Table</p>
                    <p className="font-bold text-base sm:text-lg">{viewOrderModal.order?.table_number || 'Counter'}</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-xs">Status</p>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(viewOrderModal.order?.status)}`}>
                      {viewOrderModal.order?.status || 'unknown'}
                    </span>
                  </div>
                  {viewOrderModal.order?.customer_name && (
                    <div className="p-2 sm:p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-500 text-xs">Customer</p>
                      <p className="font-bold text-sm truncate">{viewOrderModal.order.customer_name}</p>
                    </div>
                  )}
                  <div className="p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-xs">Server</p>
                    <p className="font-bold text-sm truncate">{viewOrderModal.order?.waiter_name || 'N/A'}</p>
                  </div>
                </div>

                {/* Items */}
                <div className="border-t pt-3 sm:pt-4">
                  <h4 className="font-bold mb-2 sm:mb-3 text-sm sm:text-base">Order Items</h4>
                  <div className="space-y-1.5 sm:space-y-2 max-h-32 sm:max-h-40 overflow-y-auto">
                    {(viewOrderModal.order?.items || []).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{item.quantity}× {item.name}</p>
                          {item.notes && <p className="text-xs text-orange-600 truncate">Note: {item.notes}</p>}
                        </div>
                        <p className="font-bold text-sm ml-2 flex-shrink-0">₹{((item.price || 0) * (item.quantity || 0)).toFixed(0)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="border-t pt-3 sm:pt-4 space-y-1 sm:space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span className="font-medium">₹{(() => {
                      const order = viewOrderModal.order;
                      const discount = order?.discount || order?.discount_amount || 0;
                      // If discount exists, calculate original subtotal from items
                      if (discount > 0 && order?.items) {
                        return order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(0);
                      }
                      return (order?.subtotal || 0).toFixed(0);
                    })()}</span>
                  </div>
                  {(viewOrderModal.order?.discount > 0 || viewOrderModal.order?.discount_amount > 0) && (
                    <div className="flex justify-between text-xs sm:text-sm text-green-600">
                      <span>Discount:</span>
                      <span className="font-medium">-₹{(viewOrderModal.order?.discount || viewOrderModal.order?.discount_amount || 0).toFixed(0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs sm:text-sm text-gray-600">
                    <span>Tax:</span>
                    <span>₹{(viewOrderModal.order?.tax || 0).toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-lg sm:text-xl font-bold text-violet-600 pt-2 border-t">
                    <span>Total:</span>
                    <span>₹{(viewOrderModal.order?.total || 0).toFixed(0)}</span>
                  </div>
                  {viewOrderModal.order?.payment_method && (
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-500">Payment:</span>
                      <span className="font-medium capitalize">{viewOrderModal.order.payment_method === 'split' ? 'Split Payment' : viewOrderModal.order.payment_method}</span>
                    </div>
                  )}
                  {/* Split Payment Breakdown */}
                  {viewOrderModal.order?.payment_method === 'split' && (
                    <div className="mt-2 p-2 bg-purple-50 rounded-lg space-y-1">
                      <p className="text-xs font-medium text-purple-700">Payment Breakdown:</p>
                      {viewOrderModal.order.cash_amount > 0 && (
                        <div className="flex justify-between text-xs">
                          <span>💵 Cash:</span>
                          <span>₹{viewOrderModal.order.cash_amount.toFixed(0)}</span>
                        </div>
                      )}
                      {viewOrderModal.order.card_amount > 0 && (
                        <div className="flex justify-between text-xs">
                          <span>💳 Card:</span>
                          <span>₹{viewOrderModal.order.card_amount.toFixed(0)}</span>
                        </div>
                      )}
                      {viewOrderModal.order.upi_amount > 0 && (
                        <div className="flex justify-between text-xs">
                          <span>📱 UPI:</span>
                          <span>₹{viewOrderModal.order.upi_amount.toFixed(0)}</span>
                        </div>
                      )}
                      {viewOrderModal.order.credit_amount > 0 && (
                        <div className="flex justify-between text-xs text-orange-600 font-medium">
                          <span>⚠️ Credit:</span>
                          <span>₹{viewOrderModal.order.credit_amount.toFixed(0)}</span>
                        </div>
                      )}
                    </div>
                  )}
                  {(viewOrderModal.order?.is_credit || viewOrderModal.order?.credit_amount > 0) && (
                    <>
                      <div className="flex justify-between text-xs sm:text-sm text-green-600">
                        <span>Amount Received:</span>
                        <span className="font-medium">₹{(viewOrderModal.order.payment_received || (viewOrderModal.order.cash_amount || 0) + (viewOrderModal.order.card_amount || 0) + (viewOrderModal.order.upi_amount || 0)).toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between text-xs sm:text-sm text-orange-600 font-medium">
                        <span>⚠️ Balance Due:</span>
                        <span>₹{(viewOrderModal.order.balance_amount || viewOrderModal.order.credit_amount || 0).toFixed(0)}</span>
                      </div>
                      <div className="text-xs text-orange-600 font-medium mt-1">⚠️ Credit Bill (Unpaid)</div>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4 border-t flex-wrap">
                  <Button
                    onClick={() => viewOrderModal.order && handlePrintReceipt(viewOrderModal.order)}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-sm h-9 sm:h-10"
                    disabled={printLoading}
                  >
                    <Printer className="w-4 h-4 mr-1 sm:mr-2" />
                    Print
                  </Button>
                  <Button
                    variant="outline"
                    className="border-green-500 text-green-600 hover:bg-green-50 text-sm h-9 sm:h-10"
                    onClick={() => {
                      const orderId = viewOrderModal.order?.id;
                      const customerName = viewOrderModal.order?.customer_name || 'Guest';
                      setViewOrderModal({ open: false, order: null });
                      if (orderId) {
                        setWhatsappModal({ open: true, orderId, customerName });
                      }
                    }}
                  >
                    <MessageCircle className="w-4 h-4 sm:mr-1" />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setViewOrderModal({ open: false, order: null })}
                    className="text-sm h-9 sm:h-10"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Edit Order Modal - New Responsive Component */}
        <EditOrderModal 
          open={editOrderModal.open}
          order={editOrderModal.order}
          onClose={() => setEditOrderModal({ open: false, order: null })}
          onUpdate={handleUpdateOrder}
          menuItems={menuItems}
          businessSettings={businessSettings}
        />

        {/* Cancel Order Confirmation Modal */}
        {cancelConfirmModal.open && cancelConfirmModal.order && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3 sm:p-4">
            <Card className="w-full max-w-sm border-0 shadow-2xl bg-white">
              <CardHeader className="text-center pb-2">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Ban className="w-6 h-6 text-orange-600" />
                </div>
                <CardTitle className="text-lg">Cancel Order?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-center text-gray-600 text-sm">
                  Are you sure you want to cancel order <strong>#{cancelConfirmModal.order.id.slice(0, 8)}</strong>?
                  This action cannot be undone.
                </p>
                <div className="p-3 bg-gray-50 rounded-lg text-sm">
                  <p><strong>Table:</strong> {cancelConfirmModal.order.table_number}</p>
                  <p><strong>Total:</strong> ₹{cancelConfirmModal.order.total.toFixed(0)}</p>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setCancelConfirmModal({ open: false, order: null })}
                    className="flex-1"
                  >
                    Keep Order
                  </Button>
                  <Button
                    onClick={handleCancelOrder}
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                  >
                    Cancel Order
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Delete Order Confirmation Modal */}
        {deleteConfirmModal.open && deleteConfirmModal.order && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3 sm:p-4">
            <Card className="w-full max-w-sm border-0 shadow-2xl bg-white">
              <CardHeader className="text-center pb-2">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <CardTitle className="text-lg text-red-600">Delete Order?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-center text-gray-600 text-sm">
                  Are you sure you want to <strong>permanently delete</strong> order <strong>#{deleteConfirmModal.order.id.slice(0, 8)}</strong>?
                  This will remove all records of this order.
                </p>
                <div className="p-3 bg-red-50 rounded-lg text-sm border border-red-200">
                  <p><strong>Table:</strong> {deleteConfirmModal.order.table_number}</p>
                  <p><strong>Total:</strong> ₹{deleteConfirmModal.order.total.toFixed(0)}</p>
                  <p><strong>Status:</strong> {deleteConfirmModal.order.status}</p>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setDeleteConfirmModal({ open: false, order: null })}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDeleteOrder}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default OrdersPage;
