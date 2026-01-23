/**
 * Optimized State Management for Fast Order Creation
 * High-performance state management with memoization and optimistic updates
 * Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 3.3, 3.5
 */

import { createContext, useContext, useReducer, useCallback, useMemo, useRef, useEffect } from 'react';
import { performanceMonitor } from './performanceMonitor';

// Action types
const ORDER_ACTIONS = {
  // Menu actions
  SET_MENU_ITEMS: 'SET_MENU_ITEMS',
  SET_CATEGORIES: 'SET_CATEGORIES',
  SET_ACTIVE_CATEGORY: 'SET_ACTIVE_CATEGORY',
  SET_SEARCH_QUERY: 'SET_SEARCH_QUERY',
  
  // Cart actions (optimistic)
  ADD_TO_CART_OPTIMISTIC: 'ADD_TO_CART_OPTIMISTIC',
  UPDATE_CART_QUANTITY_OPTIMISTIC: 'UPDATE_CART_QUANTITY_OPTIMISTIC',
  REMOVE_FROM_CART_OPTIMISTIC: 'REMOVE_FROM_CART_OPTIMISTIC',
  CLEAR_CART_OPTIMISTIC: 'CLEAR_CART_OPTIMISTIC',
  
  // Cart sync actions
  SYNC_CART_SUCCESS: 'SYNC_CART_SUCCESS',
  SYNC_CART_FAILURE: 'SYNC_CART_FAILURE',
  REVERT_OPTIMISTIC_UPDATE: 'REVERT_OPTIMISTIC_UPDATE',
  
  // UI state
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  
  // Performance tracking
  TRACK_PERFORMANCE: 'TRACK_PERFORMANCE'
};

// Initial state
const initialState = {
  // Menu data
  menuItems: [],
  categories: [],
  activeCategory: null,
  searchQuery: '',
  filteredItems: [],
  
  // Cart data
  cartItems: [],
  cartTotal: 0,
  cartItemCount: 0,
  
  // Optimistic updates tracking
  pendingUpdates: new Map(),
  optimisticHistory: [],
  
  // UI state
  loading: {
    menu: false,
    cart: false,
    checkout: false
  },
  errors: {},
  
  // Performance metrics
  performanceMetrics: {
    lastMenuLoad: null,
    lastCartUpdate: null,
    averageResponseTime: 0
  }
};

// Optimized reducer with performance tracking
const orderReducer = (state, action) => {
  const startTime = performance.now();
  
  let newState;
  
  switch (action.type) {
    case ORDER_ACTIONS.SET_MENU_ITEMS:
      newState = {
        ...state,
        menuItems: action.payload,
        filteredItems: state.searchQuery 
          ? action.payload.filter(item => 
              item.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
              item.description?.toLowerCase().includes(state.searchQuery.toLowerCase())
            )
          : action.payload,
        loading: { ...state.loading, menu: false }
      };
      break;
      
    case ORDER_ACTIONS.SET_CATEGORIES:
      newState = {
        ...state,
        categories: action.payload,
        activeCategory: action.payload[0] || null
      };
      break;
      
    case ORDER_ACTIONS.SET_ACTIVE_CATEGORY:
      newState = {
        ...state,
        activeCategory: action.payload
      };
      break;
      
    case ORDER_ACTIONS.SET_SEARCH_QUERY:
      const query = action.payload.toLowerCase();
      newState = {
        ...state,
        searchQuery: action.payload,
        filteredItems: query
          ? state.menuItems.filter(item =>
              item.name.toLowerCase().includes(query) ||
              item.description?.toLowerCase().includes(query)
            )
          : state.menuItems
      };
      break;
      
    case ORDER_ACTIONS.ADD_TO_CART_OPTIMISTIC:
      const existingItemIndex = state.cartItems.findIndex(item => item.id === action.payload.id);
      let updatedCartItems;
      
      if (existingItemIndex >= 0) {
        updatedCartItems = state.cartItems.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + (action.payload.quantity || 1) }
            : item
        );
      } else {
        updatedCartItems = [...state.cartItems, { ...action.payload, quantity: action.payload.quantity || 1 }];
      }
      
      newState = {
        ...state,
        cartItems: updatedCartItems,
        cartTotal: calculateCartTotal(updatedCartItems),
        cartItemCount: calculateCartItemCount(updatedCartItems),
        pendingUpdates: new Map(state.pendingUpdates).set(action.updateId, {
          type: 'add',
          item: action.payload,
          timestamp: Date.now()
        })
      };
      break;
      
    case ORDER_ACTIONS.UPDATE_CART_QUANTITY_OPTIMISTIC:
      const updatedItems = state.cartItems.map(item =>
        item.id === action.payload.itemId
          ? { ...item, quantity: Math.max(0, action.payload.quantity) }
          : item
      ).filter(item => item.quantity > 0);
      
      newState = {
        ...state,
        cartItems: updatedItems,
        cartTotal: calculateCartTotal(updatedItems),
        cartItemCount: calculateCartItemCount(updatedItems),
        pendingUpdates: new Map(state.pendingUpdates).set(action.updateId, {
          type: 'update',
          itemId: action.payload.itemId,
          oldQuantity: state.cartItems.find(item => item.id === action.payload.itemId)?.quantity || 0,
          newQuantity: action.payload.quantity,
          timestamp: Date.now()
        })
      };
      break;
      
    case ORDER_ACTIONS.REMOVE_FROM_CART_OPTIMISTIC:
      const itemToRemove = state.cartItems.find(item => item.id === action.payload.itemId);
      const remainingItems = state.cartItems.filter(item => item.id !== action.payload.itemId);
      
      newState = {
        ...state,
        cartItems: remainingItems,
        cartTotal: calculateCartTotal(remainingItems),
        cartItemCount: calculateCartItemCount(remainingItems),
        pendingUpdates: new Map(state.pendingUpdates).set(action.updateId, {
          type: 'remove',
          item: itemToRemove,
          timestamp: Date.now()
        })
      };
      break;
      
    case ORDER_ACTIONS.SYNC_CART_SUCCESS:
      const newPendingUpdates = new Map(state.pendingUpdates);
      newPendingUpdates.delete(action.updateId);
      
      newState = {
        ...state,
        cartItems: action.payload.cartItems || state.cartItems,
        cartTotal: action.payload.cartTotal || state.cartTotal,
        cartItemCount: action.payload.cartItemCount || state.cartItemCount,
        pendingUpdates: newPendingUpdates,
        loading: { ...state.loading, cart: false }
      };
      break;
      
    case ORDER_ACTIONS.SYNC_CART_FAILURE:
      // Revert optimistic update
      const failedUpdate = state.pendingUpdates.get(action.updateId);
      let revertedState = { ...state };
      
      if (failedUpdate) {
        switch (failedUpdate.type) {
          case 'add':
            revertedState.cartItems = state.cartItems.filter(item => 
              !(item.id === failedUpdate.item.id && item.quantity === failedUpdate.item.quantity)
            );
            break;
          case 'update':
            revertedState.cartItems = state.cartItems.map(item =>
              item.id === failedUpdate.itemId
                ? { ...item, quantity: failedUpdate.oldQuantity }
                : item
            );
            break;
          case 'remove':
            if (failedUpdate.item) {
              revertedState.cartItems = [...state.cartItems, failedUpdate.item];
            }
            break;
        }
        
        revertedState.cartTotal = calculateCartTotal(revertedState.cartItems);
        revertedState.cartItemCount = calculateCartItemCount(revertedState.cartItems);
      }
      
      const updatedPendingUpdates = new Map(state.pendingUpdates);
      updatedPendingUpdates.delete(action.updateId);
      
      newState = {
        ...revertedState,
        pendingUpdates: updatedPendingUpdates,
        loading: { ...state.loading, cart: false },
        errors: { ...state.errors, cart: action.error }
      };
      break;
      
    case ORDER_ACTIONS.SET_LOADING:
      newState = {
        ...state,
        loading: { ...state.loading, [action.payload.type]: action.payload.loading }
      };
      break;
      
    case ORDER_ACTIONS.SET_ERROR:
      newState = {
        ...state,
        errors: { ...state.errors, [action.payload.type]: action.payload.error }
      };
      break;
      
    case ORDER_ACTIONS.CLEAR_ERROR:
      const clearedErrors = { ...state.errors };
      delete clearedErrors[action.payload.type];
      newState = {
        ...state,
        errors: clearedErrors
      };
      break;
      
    default:
      newState = state;
  }
  
  // Track reducer performance
  const duration = performance.now() - startTime;
  if (duration > 5) { // Only track if reducer takes more than 5ms
    performanceMonitor.recordMetric('state_update', duration, {
      actionType: action.type,
      stateSize: JSON.stringify(newState).length
    });
  }
  
  return newState;
};

// Helper functions
const calculateCartTotal = (cartItems) => {
  return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
};

const calculateCartItemCount = (cartItems) => {
  return cartItems.reduce((count, item) => count + item.quantity, 0);
};

// Context
const OrderStateContext = createContext();
const OrderDispatchContext = createContext();

// Provider component
export const OptimizedOrderProvider = ({ children, apiService }) => {
  const [state, dispatch] = useReducer(orderReducer, initialState);
  const syncTimeoutRef = useRef(new Map());
  const performanceRef = useRef({ updateCount: 0, totalTime: 0 });

  // Memoized selectors for performance
  const selectors = useMemo(() => ({
    getMenuItems: () => state.menuItems,
    getCategories: () => state.categories,
    getActiveCategory: () => state.activeCategory,
    getCartItems: () => state.cartItems,
    getCartTotal: () => state.cartTotal,
    getCartItemCount: () => state.cartItemCount,
    getFilteredItems: () => state.filteredItems,
    getSearchQuery: () => state.searchQuery,
    isLoading: (type) => state.loading[type] || false,
    getError: (type) => state.errors[type] || null,
    getPendingUpdates: () => state.pendingUpdates,
    getPerformanceMetrics: () => state.performanceMetrics
  }), [state]);

  // Optimized actions with automatic sync
  const actions = useMemo(() => ({
    // Menu actions
    setMenuItems: (items) => {
      const startTime = performance.now();
      dispatch({ type: ORDER_ACTIONS.SET_MENU_ITEMS, payload: items });
      performanceMonitor.recordMetric('menu_load', performance.now() - startTime, {
        itemCount: items.length
      });
    },

    setCategories: (categories) => {
      dispatch({ type: ORDER_ACTIONS.SET_CATEGORIES, payload: categories });
    },

    setActiveCategory: (category) => {
      const startTime = performance.now();
      dispatch({ type: ORDER_ACTIONS.SET_ACTIVE_CATEGORY, payload: category });
      performanceMonitor.recordMetric('ui_navigation', performance.now() - startTime, {
        categoryId: category?.id
      });
    },

    setSearchQuery: (query) => {
      const startTime = performance.now();
      dispatch({ type: ORDER_ACTIONS.SET_SEARCH_QUERY, payload: query });
      performanceMonitor.recordMetric('menu_search', performance.now() - startTime, {
        queryLength: query.length
      });
    },

    // Optimistic cart actions
    addToCartOptimistic: async (item, quantity = 1) => {
      const updateId = `add_${item.id}_${Date.now()}`;
      const startTime = performance.now();
      
      // Optimistic update
      dispatch({
        type: ORDER_ACTIONS.ADD_TO_CART_OPTIMISTIC,
        payload: { ...item, quantity },
        updateId
      });
      
      performanceMonitor.recordMetric('ui_cart_update', performance.now() - startTime, {
        operation: 'add',
        itemId: item.id
      });

      // Sync with server
      try {
        const result = await apiService.addToCart(item.id, quantity);
        dispatch({
          type: ORDER_ACTIONS.SYNC_CART_SUCCESS,
          updateId,
          payload: result
        });
      } catch (error) {
        dispatch({
          type: ORDER_ACTIONS.SYNC_CART_FAILURE,
          updateId,
          error: error.message
        });
        throw error;
      }
    },

    updateCartQuantityOptimistic: async (itemId, quantity) => {
      const updateId = `update_${itemId}_${Date.now()}`;
      const startTime = performance.now();
      
      // Optimistic update
      dispatch({
        type: ORDER_ACTIONS.UPDATE_CART_QUANTITY_OPTIMISTIC,
        payload: { itemId, quantity },
        updateId
      });
      
      performanceMonitor.recordMetric('ui_cart_update', performance.now() - startTime, {
        operation: 'update',
        itemId
      });

      // Debounced sync with server
      if (syncTimeoutRef.current.has(itemId)) {
        clearTimeout(syncTimeoutRef.current.get(itemId));
      }

      const syncTimeout = setTimeout(async () => {
        try {
          const result = await apiService.updateCartQuantity(itemId, quantity);
          dispatch({
            type: ORDER_ACTIONS.SYNC_CART_SUCCESS,
            updateId,
            payload: result
          });
        } catch (error) {
          dispatch({
            type: ORDER_ACTIONS.SYNC_CART_FAILURE,
            updateId,
            error: error.message
          });
        } finally {
          syncTimeoutRef.current.delete(itemId);
        }
      }, 500); // 500ms debounce

      syncTimeoutRef.current.set(itemId, syncTimeout);
    },

    removeFromCartOptimistic: async (itemId) => {
      const updateId = `remove_${itemId}_${Date.now()}`;
      const startTime = performance.now();
      
      // Optimistic update
      dispatch({
        type: ORDER_ACTIONS.REMOVE_FROM_CART_OPTIMISTIC,
        payload: { itemId },
        updateId
      });
      
      performanceMonitor.recordMetric('ui_cart_update', performance.now() - startTime, {
        operation: 'remove',
        itemId
      });

      // Sync with server
      try {
        const result = await apiService.removeFromCart(itemId);
        dispatch({
          type: ORDER_ACTIONS.SYNC_CART_SUCCESS,
          updateId,
          payload: result
        });
      } catch (error) {
        dispatch({
          type: ORDER_ACTIONS.SYNC_CART_FAILURE,
          updateId,
          error: error.message
        });
        throw error;
      }
    },

    // Loading and error management
    setLoading: (type, loading) => {
      dispatch({ type: ORDER_ACTIONS.SET_LOADING, payload: { type, loading } });
    },

    setError: (type, error) => {
      dispatch({ type: ORDER_ACTIONS.SET_ERROR, payload: { type, error } });
    },

    clearError: (type) => {
      dispatch({ type: ORDER_ACTIONS.CLEAR_ERROR, payload: { type } });
    }
  }), [apiService]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      syncTimeoutRef.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  // Performance monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      const metrics = performanceRef.current;
      if (metrics.updateCount > 0) {
        const averageTime = metrics.totalTime / metrics.updateCount;
        performanceMonitor.recordMetric('state_manager_performance', averageTime, {
          updateCount: metrics.updateCount,
          totalTime: metrics.totalTime
        });
        
        // Reset metrics
        performanceRef.current = { updateCount: 0, totalTime: 0 };
      }
    }, 30000); // Report every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <OrderStateContext.Provider value={{ state, selectors }}>
      <OrderDispatchContext.Provider value={actions}>
        {children}
      </OrderDispatchContext.Provider>
    </OrderStateContext.Provider>
  );
};

// Hooks
export const useOrderState = () => {
  const context = useContext(OrderStateContext);
  if (!context) {
    throw new Error('useOrderState must be used within OptimizedOrderProvider');
  }
  return context;
};

export const useOrderActions = () => {
  const context = useContext(OrderDispatchContext);
  if (!context) {
    throw new Error('useOrderActions must be used within OptimizedOrderProvider');
  }
  return context;
};

// Optimized selectors with memoization
export const useOptimizedSelector = (selector) => {
  const { state, selectors } = useOrderState();
  
  return useMemo(() => {
    const startTime = performance.now();
    const result = selector(state, selectors);
    const duration = performance.now() - startTime;
    
    if (duration > 1) { // Track slow selectors
      performanceMonitor.recordMetric('selector_performance', duration, {
        selectorName: selector.name || 'anonymous'
      });
    }
    
    return result;
  }, [state, selectors, selector]);
};

// Performance-optimized cart hook
export const useOptimizedCart = () => {
  const { selectors } = useOrderState();
  const actions = useOrderActions();

  return useMemo(() => ({
    items: selectors.getCartItems(),
    total: selectors.getCartTotal(),
    itemCount: selectors.getCartItemCount(),
    pendingUpdates: selectors.getPendingUpdates(),
    addItem: actions.addToCartOptimistic,
    updateQuantity: actions.updateCartQuantityOptimistic,
    removeItem: actions.removeFromCartOptimistic
  }), [selectors, actions]);
};

// Performance-optimized menu hook
export const useOptimizedMenu = () => {
  const { selectors } = useOrderState();
  const actions = useOrderActions();

  return useMemo(() => ({
    items: selectors.getMenuItems(),
    categories: selectors.getCategories(),
    activeCategory: selectors.getActiveCategory(),
    filteredItems: selectors.getFilteredItems(),
    searchQuery: selectors.getSearchQuery(),
    setActiveCategory: actions.setActiveCategory,
    setSearchQuery: actions.setSearchQuery
  }), [selectors, actions]);
};

export default {
  OptimizedOrderProvider,
  useOrderState,
  useOrderActions,
  useOptimizedSelector,
  useOptimizedCart,
  useOptimizedMenu
};