/**
 * Order Fetcher - Enhanced atomic order fetching with immediate active orders support
 * 
 * This utility provides clean, atomic order fetching operations that prevent
 * the complex state merging that was causing duplicate orders. Enhanced with
 * immediate active orders support and cache-first strategies.
 */

import { apiWithRetry } from './apiClient';
import { filterServerActiveOrders, normalizeStatus } from './orderWorkflowRules';
import activeOrdersCache from './activeOrdersCache';

/**
 * Fetch orders with atomic state updates and immediate active orders support
 * 
 * @param {string} apiUrl - Base API URL
 * @param {Object} options - Fetch options
 * @param {AbortSignal} options.signal - Abort signal for cancellation
 * @param {string} options.source - Source of the request (for logging)
 * @param {boolean} options.immediateActiveOrders - Prioritize active orders fetching
 * @param {boolean} options.cacheFirst - Try cache first before server
 * @param {Set} recentPaymentCompletions - Set of recently completed payment IDs
 * @returns {Promise<Object>} - Object containing active orders and completed orders
 */
export async function fetchOrdersAtomic(apiUrl, options = {}, recentPaymentCompletions = new Set()) {
  const { 
    signal, 
    source = 'unknown', 
    immediateActiveOrders = false,
    cacheFirst = false 
  } = options;
  
  console.log(`🚀 Fetching orders atomically from: ${source}`, {
    immediateActiveOrders,
    cacheFirst,
    recentPaymentCompletions: recentPaymentCompletions.size
  });
  
  // CACHE-FIRST STRATEGY: Try cache first if requested
  if (cacheFirst) {
    try {
      const cachedOrders = activeOrdersCache.getActiveOrders();
      if (cachedOrders.length > 0) {
        console.log(`💾 Using cached active orders: ${cachedOrders.length} orders`);
        
        // Trigger background server sync
        setTimeout(() => {
          fetchOrdersAtomic(apiUrl, { 
            ...options, 
            cacheFirst: false, 
            source: `${source}-background-sync` 
          }, recentPaymentCompletions)
            .then(result => {
              // Update cache with fresh server data
              activeOrdersCache.syncWithServer(result.activeOrders, 'background-sync');
            })
            .catch(error => {
              console.warn('Background sync failed:', error);
            });
        }, 100);
        
        return {
          activeOrders: cachedOrders,
          completedOrders: [],
          totalOrders: cachedOrders.length,
          source: `${source}-cache`,
          fromCache: true
        };
      }
    } catch (error) {
      console.warn('Cache-first strategy failed, falling back to server:', error);
    }
  }
  
  try {
    // IMMEDIATE ACTIVE ORDERS: Use optimized endpoint for active orders only
    let fetchUrl = `${apiUrl}/orders`;
    let params = `?fresh=true&_t=${Date.now()}`;
    
    if (immediateActiveOrders) {
      // Use specialized active orders endpoint for faster response
      params += '&active_only=true&limit=50'; // Limit for performance
      console.log(`⚡ IMMEDIATE MODE: Fetching active orders only`);
    }
    
    const response = await apiWithRetry({
      method: 'get',
      url: `${fetchUrl}${params}`,
      timeout: immediateActiveOrders ? 5000 : 10000, // Shorter timeout for immediate mode
      signal
    });
    
    const ordersData = Array.isArray(response.data) ? response.data : [];
    console.log(`📦 Received ${ordersData.length} orders from server (immediate: ${immediateActiveOrders})`);
    
    // Enhanced validation and cleaning
    const validOrders = ordersData.filter(order => {
      if (!order || !order.id || !order.created_at || !order.status || 
          typeof order.total !== 'number' || !Array.isArray(order.items)) {
        console.warn('⚠️ Invalid order data:', order?.id);
        return false;
      }
      
      // Additional validation for immediate mode
      if (immediateActiveOrders) {
        const status = normalizeStatus(order.status);
        if (['completed', 'paid', 'cancelled', 'billed', 'settled'].includes(status)) {
          return false; // Skip completed orders in immediate mode
        }
      }
      
      return true;
    }).map(order => ({
      ...order,
      customer_name: order.customer_name || '',
      table_number: order.table_number || 0,
      payment_method: order.payment_method || 'cash',
      payment_received: order.payment_received || 0,
      balance_amount: order.balance_amount || 0,
      is_credit: order.is_credit || false,
      created_at: order.created_at || new Date().toISOString(),
      // Add fetch metadata
      _fetched_at: Date.now(),
      _fetch_source: source,
      _immediate_mode: immediateActiveOrders
    }));
    
    // Sort orders by creation date (newest first)
    const sortedOrders = validOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // ATOMIC SEPARATION with enhanced logic
    const activeOrders = [];
    const completedOrders = [];
    
    sortedOrders.forEach(order => {
      const status = normalizeStatus(order.status);
      
      // Enhanced completion detection
      const isCompleted = ['completed', 'paid', 'cancelled', 'billed', 'settled'].includes(status);
      const isRecentlyPaid = recentPaymentCompletions.has(order.id);
      const isFullyPaid = order.payment_received >= order.total && order.balance_amount <= 0;
      
      if (isCompleted || isRecentlyPaid) {
        completedOrders.push({
          ...order,
          status: isRecentlyPaid ? 'completed' : order.status
        });
      } else if (immediateActiveOrders || !isFullyPaid) {
        // In immediate mode, include all non-completed orders
        // In normal mode, exclude fully paid orders unless explicitly active
        activeOrders.push(order);
      } else {
        // Edge case: fully paid but not marked as completed
        completedOrders.push({
          ...order,
          status: 'completed'
        });
      }
    });
    
    console.log(`📊 Enhanced order separation complete:`, {
      total: sortedOrders.length,
      active: activeOrders.length,
      completed: completedOrders.length,
      source,
      immediateMode: immediateActiveOrders
    });
    
    // UPDATE CACHE: Sync active orders with cache
    if (activeOrders.length > 0) {
      activeOrdersCache.syncWithServer(activeOrders, `fetch-${source}`);
    }
    
    return {
      activeOrders,
      completedOrders,
      totalOrders: sortedOrders.length,
      source,
      fromCache: false,
      immediateMode: immediateActiveOrders
    };
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log(`🚫 Order fetch cancelled from: ${source}`);
      throw error;
    }
    
    console.error(`❌ Failed to fetch orders from: ${source}`, error);
    
    // FALLBACK TO CACHE on server error
    if (!cacheFirst) {
      try {
        const cachedOrders = activeOrdersCache.getActiveOrders();
        if (cachedOrders.length > 0) {
          console.log(`🔄 FALLBACK: Using cached orders due to server error`);
          return {
            activeOrders: cachedOrders,
            completedOrders: [],
            totalOrders: cachedOrders.length,
            source: `${source}-fallback-cache`,
            fromCache: true,
            error: error.message
          };
        }
      } catch (cacheError) {
        console.warn('Cache fallback also failed:', cacheError);
      }
    }
    
    // Return empty results on complete failure
    return {
      activeOrders: [],
      completedOrders: [],
      totalOrders: 0,
      source,
      error: error.message,
      fromCache: false
    };
  }
}

/**
 * Bypass polling delays for immediate active orders fetching
 * 
 * @param {string} apiUrl - Base API URL
 * @param {Object} options - Fetch options
 * @param {string} options.reason - Reason for bypass (for logging)
 * @param {boolean} options.skipCache - Skip cache entirely
 * @returns {Promise<Object>} - Immediate fetch result
 */
export async function bypassPollingDelays(apiUrl, options = {}) {
  const { reason = 'unknown', skipCache = false } = options;
  
  console.log(`⚡ BYPASS POLLING: Immediate fetch requested for: ${reason}`);
  
  const startTime = Date.now();
  
  try {
    // Create abort controller with short timeout for immediate response
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, 3000); // 3 second timeout for immediate mode
    
    // Use immediate active orders mode with bypass
    const result = await fetchOrdersAtomic(apiUrl, {
      signal: abortController.signal,
      source: `bypass-${reason}`,
      immediateActiveOrders: true,
      cacheFirst: !skipCache
    });
    
    clearTimeout(timeoutId);
    
    const fetchTime = Date.now() - startTime;
    console.log(`⚡ BYPASS COMPLETE: ${reason} in ${fetchTime}ms`, {
      activeOrders: result.activeOrders.length,
      fromCache: result.fromCache
    });
    
    return {
      ...result,
      bypassTime: fetchTime,
      bypassReason: reason
    };
    
  } catch (error) {
    const fetchTime = Date.now() - startTime;
    
    if (error.name === 'AbortError') {
      console.log(`⏰ BYPASS TIMEOUT: ${reason} after ${fetchTime}ms`);
    } else {
      console.error(`❌ BYPASS FAILED: ${reason} after ${fetchTime}ms`, error);
    }
    
    // Fallback to cache on bypass failure
    if (!skipCache) {
      try {
        const cachedOrders = activeOrdersCache.getActiveOrders();
        console.log(`🔄 BYPASS FALLBACK: Using cache for ${reason}`);
        
        return {
          activeOrders: cachedOrders,
          completedOrders: [],
          totalOrders: cachedOrders.length,
          source: `bypass-${reason}-fallback`,
          fromCache: true,
          bypassTime: fetchTime,
          bypassReason: reason,
          error: error.message
        };
      } catch (cacheError) {
        console.warn('Bypass cache fallback failed:', cacheError);
      }
    }
    
    throw error;
  }
}

/**
 * Smart bypass decision based on context
 * 
 * @param {string} context - Context for the bypass decision
 * @param {Object} systemState - Current system state
 * @returns {boolean} - Whether to bypass polling delays
 */
export function shouldBypassPolling(context, systemState = {}) {
  const {
    isUserActive = false,
    recentOrderCreation = false,
    recentStatusChange = false,
    networkLatency = 0,
    cacheAge = 0
  } = systemState;
  
  // Always bypass for critical events
  if (recentOrderCreation || recentStatusChange) {
    console.log(`🚀 BYPASS DECISION: Critical event (${context})`);
    return true;
  }
  
  // Bypass for active users with fresh interactions
  if (isUserActive && context.includes('user-interaction')) {
    console.log(`👤 BYPASS DECISION: Active user interaction (${context})`);
    return true;
  }
  
  // Bypass if cache is stale
  if (cacheAge > 10000) { // 10 seconds
    console.log(`💾 BYPASS DECISION: Stale cache (${context})`);
    return true;
  }
  
  // Bypass if network is fast enough
  if (networkLatency < 500) { // 500ms
    console.log(`🌐 BYPASS DECISION: Fast network (${context})`);
    return true;
  }
  
  console.log(`⏸️ BYPASS DECISION: Use normal polling (${context})`);
  return false;
}

/**
 * Immediate refresh with intelligent bypass
 * 
 * @param {string} apiUrl - Base API URL
 * @param {string} trigger - What triggered the refresh
 * @param {Object} context - Additional context
 * @returns {Promise<Object>} - Refresh result
 */
export async function immediateRefreshWithBypass(apiUrl, trigger, context = {}) {
  console.log(`🎯 IMMEDIATE REFRESH: Triggered by ${trigger}`);
  
  const systemState = {
    isUserActive: Date.now() - (context.lastUserInteraction || 0) < 5000,
    recentOrderCreation: trigger.includes('order-creation'),
    recentStatusChange: trigger.includes('status-change'),
    networkLatency: context.networkLatency || 0,
    cacheAge: Date.now() - (context.lastCacheUpdate || 0)
  };
  
  // Decide whether to bypass based on context
  const shouldBypass = shouldBypassPolling(trigger, systemState);
  
  if (shouldBypass) {
    return bypassPollingDelays(apiUrl, {
      reason: trigger,
      skipCache: systemState.recentOrderCreation
    });
  } else {
    // Use normal fetch with cache-first strategy
    return fetchOrdersAtomic(apiUrl, {
      source: `normal-${trigger}`,
      cacheFirst: true
    });
  }
}

/**
 * Fetch today's bills atomically
 * 
 * @param {string} apiUrl - Base API URL
 * @param {Object} options - Fetch options
 * @returns {Promise<Array>} - Array of today's completed orders
 */
export async function fetchTodaysBillsAtomic(apiUrl, options = {}) {
  const { signal, source = 'unknown' } = options;
  
  console.log(`📋 Fetching today's bills atomically from: ${source}`);
  
  try {
    // Use the dedicated today-bills endpoint with cache busting
    const response = await apiWithRetry({
      method: 'get',
      url: `${apiUrl}/orders/today-bills?fresh=true&_t=${Date.now()}`,
      timeout: 10000,
      signal
    });
    
    const billsData = Array.isArray(response.data) ? response.data : [];
    
    // Backend already filters for today's completed/paid orders
    // Just sort by created_at descending (newest first)
    const todaysBills = billsData
      .filter(order => order && order.id) // Basic validation
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    console.log(`📋 Found ${todaysBills.length} bills for today from: ${source}`);
    
    return todaysBills;
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log(`🚫 Bills fetch cancelled from: ${source}`);
      throw error;
    }
    
    console.error(`❌ Failed to fetch today's bills from: ${source}`, error);
    return [];
  }
}

/**
 * Merge new orders with existing orders, preventing duplicates
 * 
 * @param {Array} existingOrders - Current orders in state
 * @param {Array} newOrders - New orders from server
 * @param {string} source - Source of the update (for logging)
 * @returns {Array} - Merged orders without duplicates
 */
export function mergeOrdersAtomic(existingOrders = [], newOrders = [], source = 'unknown') {
  console.log(`🔄 Merging orders atomically from: ${source}`, {
    existing: existingOrders.length,
    new: newOrders.length
  });
  
  // Create a map of new orders by ID for fast lookup
  const newOrdersMap = new Map();
  newOrders.forEach(order => {
    if (order && order.id) {
      newOrdersMap.set(order.id, order);
    }
  });
  
  // Start with new orders (they are the source of truth)
  const mergedOrders = [...newOrders];
  
  // Add any existing orders that are not in the new orders
  // (This handles edge cases where local state has orders not yet reflected on server)
  existingOrders.forEach(existingOrder => {
    if (existingOrder && existingOrder.id && !newOrdersMap.has(existingOrder.id)) {
      // Only add if it's not a recently completed order
      const status = normalizeStatus(existingOrder.status);
      if (!['completed', 'paid', 'cancelled', 'billed', 'settled'].includes(status)) {
        mergedOrders.push(existingOrder);
      }
    }
  });
  
  // Sort by creation date (newest first)
  const sortedMerged = mergedOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  console.log(`✅ Orders merged successfully from: ${source}`, {
    result: sortedMerged.length,
    duplicatesRemoved: (existingOrders.length + newOrders.length) - sortedMerged.length
  });
  
  return sortedMerged;
}

/**
 * Cache-first strategy for active orders with intelligent fallbacks
 * 
 * @param {string} apiUrl - Base API URL
 * @param {Object} options - Cache strategy options
 * @param {number} options.maxCacheAge - Maximum cache age in milliseconds
 * @param {boolean} options.backgroundSync - Enable background server sync
 * @param {string} options.source - Source identifier
 * @returns {Promise<Object>} - Orders from cache or server
 */
export async function fetchActiveOrdersCacheFirst(apiUrl, options = {}) {
  const {
    maxCacheAge = 5000, // 5 seconds default
    backgroundSync = true,
    source = 'cache-first'
  } = options;
  
  console.log(`💾 CACHE-FIRST: Fetching active orders (maxAge: ${maxCacheAge}ms)`);
  
  const startTime = Date.now();
  
  try {
    // Step 1: Try cache first
    const cachedOrders = activeOrdersCache.getActiveOrders();
    const cacheStats = activeOrdersCache.getStats();
    const cacheAge = Date.now() - cacheStats.lastUpdate;
    
    console.log(`💾 Cache status:`, {
      orders: cachedOrders.length,
      age: cacheAge,
      maxAge: maxCacheAge,
      hitRate: cacheStats.hitRate
    });
    
    // Step 2: Decide if cache is fresh enough
    const isCacheFresh = cacheAge < maxCacheAge && cachedOrders.length > 0;
    
    if (isCacheFresh) {
      console.log(`⚡ CACHE HIT: Using cached orders (${cacheAge}ms old)`);
      
      // Step 3: Optional background sync for fresh data
      if (backgroundSync) {
        setTimeout(() => {
          console.log(`🔄 BACKGROUND SYNC: Updating cache from server`);
          fetchOrdersAtomic(apiUrl, {
            source: `${source}-bg-sync`,
            immediateActiveOrders: true
          })
          .then(result => {
            activeOrdersCache.syncWithServer(result.activeOrders, 'background-sync');
            console.log(`✅ BACKGROUND SYNC: Cache updated with ${result.activeOrders.length} orders`);
          })
          .catch(error => {
            console.warn('Background sync failed:', error);
          });
        }, 100); // Small delay to not block main thread
      }
      
      return {
        activeOrders: cachedOrders,
        completedOrders: [],
        totalOrders: cachedOrders.length,
        source: `${source}-cache`,
        fromCache: true,
        cacheAge,
        fetchTime: Date.now() - startTime
      };
    }
    
    // Step 4: Cache miss or stale - fetch from server
    console.log(`🌐 CACHE MISS: Fetching from server (cache age: ${cacheAge}ms)`);
    
    const serverResult = await fetchOrdersAtomic(apiUrl, {
      source: `${source}-server`,
      immediateActiveOrders: true,
      cacheFirst: false // Prevent recursion
    });
    
    // Step 5: Update cache with fresh data
    if (serverResult.activeOrders.length > 0) {
      activeOrdersCache.syncWithServer(serverResult.activeOrders, 'cache-first-update');
    }
    
    return {
      ...serverResult,
      fetchTime: Date.now() - startTime,
      cacheAge: 0 // Fresh from server
    };
    
  } catch (error) {
    console.error(`❌ CACHE-FIRST FAILED: ${source}`, error);
    
    // Step 6: Fallback to any available cache on server error
    try {
      const fallbackOrders = activeOrdersCache.getActiveOrders();
      if (fallbackOrders.length > 0) {
        console.log(`🔄 FALLBACK: Using stale cache (${fallbackOrders.length} orders)`);
        
        return {
          activeOrders: fallbackOrders,
          completedOrders: [],
          totalOrders: fallbackOrders.length,
          source: `${source}-fallback`,
          fromCache: true,
          error: error.message,
          fetchTime: Date.now() - startTime
        };
      }
    } catch (cacheError) {
      console.warn('Cache fallback also failed:', cacheError);
    }
    
    throw error;
  }
}

/**
 * Smart cache strategy selector based on context
 * 
 * @param {string} apiUrl - Base API URL
 * @param {Object} context - Request context
 * @returns {Promise<Object>} - Orders using optimal strategy
 */
export async function fetchActiveOrdersSmart(apiUrl, context = {}) {
  const {
    userInteraction = false,
    orderCreation = false,
    statusChange = false,
    networkSpeed = 'unknown',
    priority = 'normal'
  } = context;
  
  console.log(`🧠 SMART FETCH: Selecting optimal strategy`, context);
  
  // Strategy 1: Critical events - bypass cache entirely
  if (orderCreation || statusChange || priority === 'critical') {
    console.log(`🚀 CRITICAL: Direct server fetch`);
    return fetchOrdersAtomic(apiUrl, {
      source: 'smart-critical',
      immediateActiveOrders: true,
      cacheFirst: false
    });
  }
  
  // Strategy 2: User interactions - cache-first with short max age
  if (userInteraction) {
    console.log(`👤 USER INTERACTION: Cache-first with short age`);
    return fetchActiveOrdersCacheFirst(apiUrl, {
      maxCacheAge: 2000, // 2 seconds for user interactions
      backgroundSync: true,
      source: 'smart-interaction'
    });
  }
  
  // Strategy 3: Background/polling - cache-first with longer age
  console.log(`🔄 BACKGROUND: Cache-first with normal age`);
  return fetchActiveOrdersCacheFirst(apiUrl, {
    maxCacheAge: 5000, // 5 seconds for background
    backgroundSync: true,
    source: 'smart-background'
  });
}

/**
 * Preload active orders into cache
 * 
 * @param {string} apiUrl - Base API URL
 * @param {Array} orderIds - Specific order IDs to preload (optional)
 * @returns {Promise<void>}
 */
export async function preloadActiveOrdersCache(apiUrl, orderIds = null) {
  console.log(`🔄 PRELOAD: Loading active orders into cache`);
  
  try {
    let fetchOptions = {
      source: 'preload',
      immediateActiveOrders: true,
      cacheFirst: false
    };
    
    // If specific order IDs provided, use targeted fetch
    if (orderIds && orderIds.length > 0) {
      console.log(`🎯 TARGETED PRELOAD: ${orderIds.length} specific orders`);
      // Note: This would require backend support for fetching specific orders
      fetchOptions.targetOrderIds = orderIds;
    }
    
    const result = await fetchOrdersAtomic(apiUrl, fetchOptions);
    
    // Update cache with preloaded data
    if (result.activeOrders.length > 0) {
      activeOrdersCache.syncWithServer(result.activeOrders, 'preload');
      console.log(`✅ PRELOAD COMPLETE: ${result.activeOrders.length} orders cached`);
    }
    
  } catch (error) {
    console.warn('Preload failed:', error);
  }
}

/**
 * Immediate server sync after order creation
 * 
 * @param {string} apiUrl - Base API URL
 * @param {Object} createdOrder - The newly created order
 * @param {Object} options - Sync options
 * @returns {Promise<Object>} - Sync result with updated orders
 */
export async function immediateServerSyncAfterCreation(apiUrl, createdOrder, options = {}) {
  const { 
    syncDelay = 500, // 500ms delay to allow server processing
    maxRetries = 3,
    source = 'post-creation-sync'
  } = options;
  
  console.log(`🔄 IMMEDIATE SYNC: Starting post-creation sync for order ${createdOrder.id}`);
  
  // Wait for server to process the order
  await new Promise(resolve => setTimeout(resolve, syncDelay));
  
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      console.log(`🔄 SYNC ATTEMPT ${retryCount + 1}: Fetching updated orders`);
      
      // Fetch fresh orders from server
      const result = await fetchOrdersAtomic(apiUrl, {
        source: `${source}-attempt-${retryCount + 1}`,
        immediateActiveOrders: true,
        cacheFirst: false // Always go to server for post-creation sync
      });
      
      // Verify the created order is in the results
      const foundOrder = result.activeOrders.find(order => order.id === createdOrder.id);
      
      if (foundOrder) {
        console.log(`✅ SYNC SUCCESS: Order ${createdOrder.id} found in server response`);
        
        // Update cache with fresh server data
        activeOrdersCache.syncWithServer(result.activeOrders, 'post-creation-sync');
        
        return {
          ...result,
          syncSuccess: true,
          syncAttempts: retryCount + 1,
          foundCreatedOrder: foundOrder
        };
      } else {
        console.log(`⚠️ SYNC PARTIAL: Order ${createdOrder.id} not yet in server response`);
        
        if (retryCount < maxRetries - 1) {
          // Wait before retry with exponential backoff
          const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 5000);
          console.log(`⏳ RETRY DELAY: Waiting ${retryDelay}ms before retry`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
      
      retryCount++;
      
    } catch (error) {
      console.error(`❌ SYNC ATTEMPT ${retryCount + 1} FAILED:`, error);
      
      retryCount++;
      
      if (retryCount >= maxRetries) {
        console.error(`❌ SYNC FAILED: All ${maxRetries} attempts failed`);
        
        // Fallback: ensure created order is at least in cache
        activeOrdersCache.addActiveOrder(createdOrder);
        
        return {
          activeOrders: [createdOrder],
          completedOrders: [],
          totalOrders: 1,
          source: `${source}-fallback`,
          syncSuccess: false,
          syncAttempts: retryCount,
          error: error.message
        };
      }
      
      // Wait before retry
      const retryDelay = Math.min(1000 * Math.pow(2, retryCount - 1), 5000);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  // Should not reach here, but fallback just in case
  console.warn(`⚠️ SYNC INCOMPLETE: Max retries reached without success`);
  
  activeOrdersCache.addActiveOrder(createdOrder);
  
  return {
    activeOrders: [createdOrder],
    completedOrders: [],
    totalOrders: 1,
    source: `${source}-incomplete`,
    syncSuccess: false,
    syncAttempts: retryCount
  };
}

/**
 * Optimistic order creation with server sync
 * 
 * @param {string} apiUrl - Base API URL
 * @param {Object} orderData - Order data to create
 * @param {Function} onOptimisticUpdate - Callback for immediate UI update
 * @param {Function} onServerSync - Callback for server sync completion
 * @returns {Promise<Object>} - Creation and sync result
 */
export async function createOrderWithImmediateSync(apiUrl, orderData, onOptimisticUpdate, onServerSync) {
  console.log(`🚀 OPTIMISTIC CREATION: Starting order creation with immediate sync`);
  
  const startTime = Date.now();
  let optimisticOrder; // Declare outside try block for catch block access
  
  try {
    // Step 1: Create optimistic order for immediate UI update
    optimisticOrder = {
      id: `temp_${Date.now()}`,
      ...orderData,
      status: 'pending',
      created_at: new Date().toISOString(),
      _optimistic: true,
      _created_at_client: startTime
    };
    
    console.log(`⚡ OPTIMISTIC: Created temporary order ${optimisticOrder.id}`);
    
    // Step 2: Immediate UI update
    if (onOptimisticUpdate) {
      onOptimisticUpdate(optimisticOrder);
    }
    
    // Add to cache immediately
    activeOrdersCache.addActiveOrder(optimisticOrder);
    
    // Step 3: Create order on server
    const serverResponse = await apiWithRetry({
      method: 'post',
      url: `${apiUrl}/orders`,
      data: orderData,
      timeout: 12000
    });
    
    const serverOrder = serverResponse.data;
    console.log(`✅ SERVER CREATION: Order created with ID ${serverOrder.id}`);
    
    // Step 4: Replace optimistic order with server order
    const finalOrder = {
      ...serverOrder,
      created_at: serverOrder.created_at || new Date().toISOString(),
      _server_confirmed: true,
      _creation_time: Date.now() - startTime
    };
    
    // Update cache with real order
    activeOrdersCache.removeOrder(optimisticOrder.id);
    activeOrdersCache.addActiveOrder(finalOrder);
    
    // Step 5: Immediate server sync to get complete state
    const syncResult = await immediateServerSyncAfterCreation(apiUrl, finalOrder, {
      source: 'optimistic-creation-sync'
    });
    
    console.log(`🎯 CREATION COMPLETE: Order ${finalOrder.id} created and synced in ${Date.now() - startTime}ms`);
    
    // Step 6: Final callback with synced data
    if (onServerSync) {
      onServerSync(syncResult);
    }
    
    return {
      optimisticOrder,
      serverOrder: finalOrder,
      syncResult,
      totalTime: Date.now() - startTime,
      success: true
    };
    
  } catch (error) {
    console.error(`❌ OPTIMISTIC CREATION FAILED:`, error);
    
    // Remove optimistic order on failure
    if (optimisticOrder) {
      activeOrdersCache.removeOrder(optimisticOrder.id);
    }
    
    throw error;
  }
}
/**
 * Optimized data merging for real-time updates
 * 
 * @param {Array} currentOrders - Current orders in UI state
 * @param {Array} newOrders - New orders from server/cache
 * @param {Object} options - Merge options
 * @returns {Object} - Merge result with optimized orders
 */
export function optimizedDataMerging(currentOrders = [], newOrders = [], options = {}) {
  const {
    preserveOptimistic = true,
    preserveInstantUpdates = true,
    conflictResolution = 'server-wins',
    source = 'unknown'
  } = options;
  
  console.log(`🔄 OPTIMIZED MERGE: Merging orders from ${source}`, {
    current: currentOrders.length,
    new: newOrders.length,
    preserveOptimistic,
    preserveInstantUpdates
  });
  
  const startTime = Date.now();
  
  // Create maps for efficient lookups
  const currentOrdersMap = new Map();
  const newOrdersMap = new Map();
  const mergeStats = {
    added: 0,
    updated: 0,
    preserved: 0,
    conflicts: 0,
    removed: 0
  };
  
  // Index current orders
  currentOrders.forEach(order => {
    if (order && order.id) {
      currentOrdersMap.set(order.id, order);
    }
  });
  
  // Index new orders
  newOrders.forEach(order => {
    if (order && order.id) {
      newOrdersMap.set(order.id, order);
    }
  });
  
  const mergedOrders = [];
  
  // Step 1: Process new orders (add or update)
  newOrdersMap.forEach((newOrder, orderId) => {
    const currentOrder = currentOrdersMap.get(orderId);
    
    if (!currentOrder) {
      // New order - add it
      mergedOrders.push(newOrder);
      mergeStats.added++;
    } else {
      // Existing order - merge intelligently
      const mergedOrder = mergeOrderIntelligently(currentOrder, newOrder, {
        preserveOptimistic,
        preserveInstantUpdates,
        conflictResolution
      });
      
      mergedOrders.push(mergedOrder);
      
      if (mergedOrder !== currentOrder) {
        mergeStats.updated++;
      } else {
        mergeStats.preserved++;
      }
    }
  });
  
  // Step 2: Handle orders that exist in current but not in new
  currentOrdersMap.forEach((currentOrder, orderId) => {
    if (!newOrdersMap.has(orderId)) {
      // Order exists in current but not in new
      
      // Preserve optimistic orders
      if (preserveOptimistic && currentOrder._optimistic) {
        console.log(`💾 PRESERVING: Optimistic order ${orderId}`);
        mergedOrders.push(currentOrder);
        mergeStats.preserved++;
      }
      // Preserve orders with recent instant updates
      else if (preserveInstantUpdates && currentOrder.instant_update && 
               Date.now() - (currentOrder.instant_update_timestamp || 0) < 5000) {
        console.log(`⚡ PRESERVING: Recent instant update for order ${orderId}`);
        mergedOrders.push(currentOrder);
        mergeStats.preserved++;
      }
      // Otherwise, order was removed/completed
      else {
        console.log(`🗑️ REMOVING: Order ${orderId} no longer in server data`);
        mergeStats.removed++;
      }
    }
  });
  
  // Step 3: Sort merged orders by creation date (newest first)
  const sortedOrders = mergedOrders.sort((a, b) => {
    const dateA = new Date(a.created_at || 0);
    const dateB = new Date(b.created_at || 0);
    return dateB - dateA;
  });
  
  const mergeTime = Date.now() - startTime;
  
  console.log(`✅ MERGE COMPLETE: ${source} in ${mergeTime}ms`, {
    result: sortedOrders.length,
    stats: mergeStats
  });
  
  return {
    orders: sortedOrders,
    stats: mergeStats,
    mergeTime,
    source
  };
}

/**
 * Intelligently merge individual orders
 * 
 * @param {Object} currentOrder - Current order in state
 * @param {Object} newOrder - New order from server
 * @param {Object} options - Merge options
 * @returns {Object} - Merged order
 */
function mergeOrderIntelligently(currentOrder, newOrder, options = {}) {
  const {
    preserveOptimistic = true,
    preserveInstantUpdates = true,
    conflictResolution = 'server-wins'
  } = options;
  
  // If current order is optimistic, preserve it until server confirms
  if (preserveOptimistic && currentOrder._optimistic && !newOrder._server_confirmed) {
    return currentOrder;
  }
  
  // If current order has recent instant updates, be careful about overriding
  if (preserveInstantUpdates && currentOrder.instant_update) {
    const updateAge = Date.now() - (currentOrder.instant_update_timestamp || 0);
    
    if (updateAge < 3000) { // 3 seconds
      console.log(`⚡ CONFLICT: Instant update vs server data for order ${currentOrder.id}`);
      
      if (conflictResolution === 'instant-wins') {
        return currentOrder;
      } else if (conflictResolution === 'merge') {
        // Merge: keep instant update status but use server data for other fields
        return {
          ...newOrder,
          status: currentOrder.status, // Keep instant status
          instant_update: currentOrder.instant_update,
          instant_update_timestamp: currentOrder.instant_update_timestamp,
          _conflict_resolved: 'merged'
        };
      }
      // Default: server-wins, but log the conflict
      console.log(`🔄 RESOLVING: Server data wins for order ${currentOrder.id}`);
    }
  }
  
  // Check for actual changes to avoid unnecessary updates
  const hasChanges = hasOrderChanged(currentOrder, newOrder);
  
  if (!hasChanges) {
    return currentOrder; // No changes, keep current
  }
  
  // Server data wins by default
  return {
    ...newOrder,
    _last_updated: Date.now(),
    _merge_source: 'server'
  };
}

/**
 * Check if order has actually changed
 * 
 * @param {Object} order1 - First order
 * @param {Object} order2 - Second order
 * @returns {boolean} - True if orders are different
 */
function hasOrderChanged(order1, order2) {
  if (!order1 || !order2) return true;
  
  // Key fields to compare for changes
  const keyFields = [
    'status',
    'updated_at',
    'payment_received',
    'balance_amount',
    'is_credit',
    'items'
  ];
  
  for (const field of keyFields) {
    if (field === 'items') {
      // Deep compare items array
      if (!arraysEqual(order1.items || [], order2.items || [])) {
        return true;
      }
    } else {
      if (order1[field] !== order2[field]) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Deep compare arrays for equality
 * 
 * @param {Array} arr1 - First array
 * @param {Array} arr2 - Second array
 * @returns {boolean} - True if arrays are equal
 */
function arraysEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  
  for (let i = 0; i < arr1.length; i++) {
    const item1 = arr1[i];
    const item2 = arr2[i];
    
    if (typeof item1 === 'object' && typeof item2 === 'object') {
      // Compare key fields for items
      if (item1.menu_item_id !== item2.menu_item_id ||
          item1.quantity !== item2.quantity ||
          item1.price !== item2.price) {
        return false;
      }
    } else if (item1 !== item2) {
      return false;
    }
  }
  
  return true;
}

/**
 * Real-time update coordinator
 * 
 * @param {Array} currentOrders - Current orders
 * @param {Object} updateEvent - Update event data
 * @returns {Array} - Updated orders
 */
export function coordinateRealTimeUpdate(currentOrders, updateEvent) {
  const { type, orderId, data, timestamp } = updateEvent;
  
  console.log(`🎯 REAL-TIME UPDATE: ${type} for order ${orderId}`);
  
  switch (type) {
    case 'order_created':
      return handleOrderCreatedUpdate(currentOrders, data);
    
    case 'order_status_changed':
      return handleOrderStatusUpdate(currentOrders, orderId, data);
    
    case 'order_updated':
      return handleOrderDataUpdate(currentOrders, orderId, data);
    
    case 'order_completed':
      return handleOrderCompletedUpdate(currentOrders, orderId);
    
    default:
      console.warn(`Unknown update type: ${type}`);
      return currentOrders;
  }
}

/**
 * Handle order created update
 */
function handleOrderCreatedUpdate(currentOrders, orderData) {
  // Check if order already exists (prevent duplicates)
  const exists = currentOrders.some(order => order.id === orderData.id);
  
  if (exists) {
    console.log(`⚠️ DUPLICATE: Order ${orderData.id} already exists`);
    return currentOrders;
  }
  
  console.log(`➕ ADDING: New order ${orderData.id}`);
  return [orderData, ...currentOrders];
}

/**
 * Handle order status update
 */
function handleOrderStatusUpdate(currentOrders, orderId, statusData) {
  return currentOrders.map(order => {
    if (order.id === orderId) {
      console.log(`🔄 STATUS UPDATE: Order ${orderId} -> ${statusData.status}`);
      return {
        ...order,
        ...statusData,
        _real_time_update: true,
        _update_timestamp: Date.now()
      };
    }
    return order;
  });
}

/**
 * Handle order data update
 */
function handleOrderDataUpdate(currentOrders, orderId, updateData) {
  return currentOrders.map(order => {
    if (order.id === orderId) {
      console.log(`📝 DATA UPDATE: Order ${orderId}`);
      return {
        ...order,
        ...updateData,
        _real_time_update: true,
        _update_timestamp: Date.now()
      };
    }
    return order;
  });
}

/**
 * Handle order completed update
 */
function handleOrderCompletedUpdate(currentOrders, orderId) {
  console.log(`✅ COMPLETING: Order ${orderId}`);
  return currentOrders.filter(order => order.id !== orderId);
}