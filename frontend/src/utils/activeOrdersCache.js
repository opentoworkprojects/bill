/**
 * Active Orders Cache - Fast in-memory cache for active orders
 * 
 * This utility provides immediate access to active orders data with
 * persistence to session storage and intelligent synchronization
 * with server data.
 */

import performanceLogger from './performanceLogger';

class ActiveOrdersCache {
  constructor() {
    this.cache = new Map();
    this.subscribers = new Set();
    this.lastSync = 0;
    this.lastUpdate = 0;
    this.debugMode = process.env.NODE_ENV === 'development';
    
    // Cache configuration
    this.config = {
      maxCacheSize: 1000,
      syncInterval: 30000, // 30 seconds
      persistenceKey: 'billbyte_active_orders_cache',
      maxAge: 3600000 // 1 hour
    };
    
    // Performance metrics
    this.metrics = {
      hits: 0,
      misses: 0,
      adds: 0,
      removes: 0,
      syncs: 0,
      errors: 0,
      // Enhanced performance tracking
      hitTimes: [],
      missTimes: [],
      syncTimes: [],
      addTimes: [],
      totalOperations: 0,
      lastPerformanceCheck: Date.now()
    };
    
    // Initialize cache from session storage
    this.loadFromStorage();
    
    this.log('ActiveOrdersCache initialized', {
      cacheSize: this.cache.size,
      subscribersCount: this.subscribers.size
    });
  }
  
  /**
   * Log debug messages in development mode
   */
  log(message, data = null) {
    if (this.debugMode) {
      const timestamp = new Date().toISOString();
      console.log(`[ActiveOrdersCache ${timestamp}] ${message}`, data || '');
    }
  }
  
  /**
   * Subscribe to cache updates
   * @param {Function} callback - Callback function for updates
   * @returns {Function} - Unsubscribe function
   */
  subscribe(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }
    
    this.subscribers.add(callback);
    this.log(`Subscriber added. Total: ${this.subscribers.size}`);
    
    // Immediately call with current data
    try {
      callback(this.getActiveOrders(), 'initial');
    } catch (error) {
      this.log('Error in initial subscriber callback', error);
    }
    
    // Return unsubscribe function
    return () => this.unsubscribe(callback);
  }
  
  /**
   * Unsubscribe from cache updates
   * @param {Function} callback - Callback function to remove
   */
  unsubscribe(callback) {
    const removed = this.subscribers.delete(callback);
    if (removed) {
      this.log(`Subscriber removed. Total: ${this.subscribers.size}`);
    }
    return removed;
  }
  
  /**
   * Add active order to cache immediately
   * @param {Object} order - Order object to add
   */
  addActiveOrder(order) {
    if (!order || !order.id) {
      this.log('Invalid order provided to addActiveOrder', order);
      return false;
    }
    
    // Check if order is actually active
    if (!this.isActiveOrder(order)) {
      this.log(`Order ${order.id} is not active, skipping cache add`, {
        status: order.status
      });
      return false;
    }
    
    const startTime = Date.now();
    
    // Add to cache with metadata
    const cacheEntry = {
      ...order,
      _cached_at: startTime,
      _cache_source: 'add-active-order'
    };
    
    this.cache.set(order.id, cacheEntry);
    this.lastUpdate = startTime;
    this.metrics.adds++;
    this.recordPerformanceTiming('add', startTime);
    
    this.log(`Order ${order.id} added to cache`, {
      status: order.status,
      total: order.total,
      cacheSize: this.cache.size
    });
    
    // Persist to storage
    this.persistToStorage();
    
    // Notify subscribers
    this.notifySubscribers('order-added', order);
    
    // Cleanup if cache is too large
    this.cleanupCache();
    
    return true;
  }
  
  /**
   * Get all active orders from cache
   * @returns {Array} - Array of active orders
   */
  getActiveOrders() {
    const startTime = Date.now();
    
    // Filter and sort active orders
    const activeOrders = Array.from(this.cache.values())
      .filter(order => this.isActiveOrder(order) && !this.isExpired(order))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Update metrics
    if (activeOrders.length > 0) {
      this.metrics.hits++;
      this.recordPerformanceTiming('hit', startTime);
    } else {
      this.metrics.misses++;
      this.recordPerformanceTiming('miss', startTime);
    }
    
    this.log(`Retrieved ${activeOrders.length} active orders from cache`, {
      processingTime: Date.now() - startTime
    });
    
    // Check performance periodically
    this.checkPerformanceThresholds();
    
    return activeOrders;
  }
  
  /**
   * Get specific order from cache
   * @param {string} orderId - Order ID to retrieve
   * @returns {Object|null} - Order object or null if not found
   */
  getOrder(orderId) {
    if (!orderId) return null;
    
    const order = this.cache.get(orderId);
    
    if (order) {
      this.metrics.hits++;
      
      // Check if expired
      if (this.isExpired(order)) {
        this.removeOrder(orderId);
        this.metrics.misses++;
        return null;
      }
      
      return order;
    }
    
    this.metrics.misses++;
    return null;
  }
  
  /**
   * Remove order from cache
   * @param {string} orderId - Order ID to remove
   */
  removeOrder(orderId) {
    if (!orderId) return false;
    
    const removed = this.cache.delete(orderId);
    
    if (removed) {
      this.metrics.removes++;
      this.lastUpdate = Date.now();
      
      this.log(`Order ${orderId} removed from cache`, {
        cacheSize: this.cache.size
      });
      
      // Persist changes
      this.persistToStorage();
      
      // Notify subscribers
      this.notifySubscribers('order-removed', { id: orderId });
    }
    
    return removed;
  }
  
  /**
   * Update existing order in cache
   * @param {Object} order - Updated order object
   */
  updateOrder(order) {
    if (!order || !order.id) {
      this.log('Invalid order provided to updateOrder', order);
      return false;
    }
    
    const existingOrder = this.cache.get(order.id);
    
    if (existingOrder) {
      // Merge with existing data
      const updatedOrder = {
        ...existingOrder,
        ...order,
        _cached_at: existingOrder._cached_at, // Preserve original cache time
        _updated_at: Date.now(),
        _cache_source: 'update-order'
      };
      
      this.cache.set(order.id, updatedOrder);
      this.lastUpdate = Date.now();
      
      this.log(`Order ${order.id} updated in cache`, {
        status: order.status
      });
      
      // Persist changes
      this.persistToStorage();
      
      // Notify subscribers
      this.notifySubscribers('order-updated', updatedOrder);
      
      return true;
    }
    
    // If not in cache, add it
    return this.addActiveOrder(order);
  }
  
  /**
   * Sync cache with server data
   * @param {Array} serverOrders - Orders from server
   * @param {string} source - Source of the sync
   */
  syncWithServer(serverOrders, source = 'server-sync') {
    if (!Array.isArray(serverOrders)) {
      this.log('Invalid server orders provided to syncWithServer', serverOrders);
      return;
    }
    
    const startTime = Date.now();
    this.log(`Syncing cache with ${serverOrders.length} server orders`, { source });
    
    // Create maps for efficient comparison
    const serverOrdersMap = new Map();
    const activeServerOrders = serverOrders.filter(order => this.isActiveOrder(order));
    
    activeServerOrders.forEach(order => {
      serverOrdersMap.set(order.id, {
        ...order,
        _cached_at: Date.now(),
        _cache_source: source
      });
    });
    
    // Track changes
    const changes = {
      added: 0,
      updated: 0,
      removed: 0
    };
    
    // Update existing orders and add new ones
    serverOrdersMap.forEach((serverOrder, orderId) => {
      const cachedOrder = this.cache.get(orderId);
      
      if (cachedOrder) {
        // Check if order needs updating
        if (this.orderNeedsUpdate(cachedOrder, serverOrder)) {
          this.cache.set(orderId, {
            ...cachedOrder,
            ...serverOrder,
            _cached_at: cachedOrder._cached_at, // Preserve original cache time
            _updated_at: Date.now()
          });
          changes.updated++;
        }
      } else {
        // Add new order
        this.cache.set(orderId, serverOrder);
        changes.added++;
      }
    });
    
    // Remove orders that are no longer active on server
    const ordersToRemove = [];
    this.cache.forEach((cachedOrder, orderId) => {
      if (!serverOrdersMap.has(orderId) && this.isActiveOrder(cachedOrder)) {
        ordersToRemove.push(orderId);
      }
    });
    
    ordersToRemove.forEach(orderId => {
      this.cache.delete(orderId);
      changes.removed++;
    });
    
    // Update metrics and state
    this.lastSync = Date.now();
    this.lastUpdate = Date.now();
    this.metrics.syncs++;
    this.recordPerformanceTiming('sync', startTime);
    
    const syncTime = Date.now() - startTime;
    this.log(`Cache sync completed in ${syncTime}ms`, {
      ...changes,
      totalCached: this.cache.size,
      source
    });
    
    // Persist changes if any
    if (changes.added > 0 || changes.updated > 0 || changes.removed > 0) {
      this.persistToStorage();
      
      // Notify subscribers of sync
      this.notifySubscribers('cache-synced', {
        changes,
        source,
        orders: this.getActiveOrders()
      });
    }
  }
  
  /**
   * Check if order needs updating
   * @param {Object} cachedOrder - Order in cache
   * @param {Object} serverOrder - Order from server
   * @returns {boolean} - True if update needed
   */
  orderNeedsUpdate(cachedOrder, serverOrder) {
    // Compare key fields that might change
    const keyFields = ['status', 'updated_at', 'payment_received', 'balance_amount'];
    
    return keyFields.some(field => cachedOrder[field] !== serverOrder[field]);
  }
  
  /**
   * Check if order is active (should be in cache)
   * @param {Object} order - Order to check
   * @returns {boolean} - True if order is active
   */
  isActiveOrder(order) {
    if (!order || !order.status) return false;
    
    const activeStatuses = ['pending', 'preparing', 'ready'];
    return activeStatuses.includes(order.status.toLowerCase());
  }
  
  /**
   * Check if cached order is expired
   * @param {Object} order - Cached order
   * @returns {boolean} - True if expired
   */
  isExpired(order) {
    if (!order._cached_at) return false;
    
    const age = Date.now() - order._cached_at;
    return age > this.config.maxAge;
  }
  
  /**
   * Notify all subscribers of changes
   * @param {string} eventType - Type of change
   * @param {*} data - Event data
   */
  notifySubscribers(eventType, data) {
    const failedSubscribers = [];
    
    this.subscribers.forEach(callback => {
      try {
        callback(this.getActiveOrders(), eventType, data);
      } catch (error) {
        this.log(`Subscriber callback error for ${eventType}`, error);
        failedSubscribers.push(callback);
        this.metrics.errors++;
      }
    });
    
    // Remove failed subscribers
    failedSubscribers.forEach(callback => {
      this.subscribers.delete(callback);
    });
  }
  
  /**
   * Persist cache to session storage
   */
  persistToStorage() {
    try {
      const cacheData = {
        orders: Array.from(this.cache.entries()),
        lastUpdate: this.lastUpdate,
        lastSync: this.lastSync,
        timestamp: Date.now()
      };
      
      sessionStorage.setItem(this.config.persistenceKey, JSON.stringify(cacheData));
      
    } catch (error) {
      this.log('Failed to persist cache to storage', error);
      this.metrics.errors++;
    }
  }
  
  /**
   * Load cache from session storage
   */
  loadFromStorage() {
    try {
      const stored = sessionStorage.getItem(this.config.persistenceKey);
      
      if (stored) {
        const cacheData = JSON.parse(stored);
        
        // Check if data is not too old
        const age = Date.now() - (cacheData.timestamp || 0);
        if (age < this.config.maxAge) {
          // Restore cache
          this.cache = new Map(cacheData.orders || []);
          this.lastUpdate = cacheData.lastUpdate || 0;
          this.lastSync = cacheData.lastSync || 0;
          
          this.log(`Cache loaded from storage`, {
            orders: this.cache.size,
            age: Math.round(age / 1000) + 's'
          });
        } else {
          this.log('Stored cache too old, starting fresh');
          this.clearStorage();
        }
      }
      
    } catch (error) {
      this.log('Failed to load cache from storage', error);
      this.clearStorage();
    }
  }
  
  /**
   * Clear storage
   */
  clearStorage() {
    try {
      sessionStorage.removeItem(this.config.persistenceKey);
    } catch (error) {
      this.log('Failed to clear storage', error);
    }
  }
  
  /**
   * Cleanup expired orders and enforce size limits
   */
  cleanupCache() {
    const startSize = this.cache.size;
    
    // Remove expired orders
    const expiredOrders = [];
    this.cache.forEach((order, orderId) => {
      if (this.isExpired(order)) {
        expiredOrders.push(orderId);
      }
    });
    
    expiredOrders.forEach(orderId => {
      this.cache.delete(orderId);
    });
    
    // Enforce size limit
    if (this.cache.size > this.config.maxCacheSize) {
      const entries = Array.from(this.cache.entries());
      
      // Sort by cache time (oldest first)
      entries.sort((a, b) => (a[1]._cached_at || 0) - (b[1]._cached_at || 0));
      
      // Remove oldest entries
      const toRemove = entries.slice(0, this.cache.size - this.config.maxCacheSize);
      toRemove.forEach(([orderId]) => {
        this.cache.delete(orderId);
      });
    }
    
    const cleanedCount = startSize - this.cache.size;
    if (cleanedCount > 0) {
      this.log(`Cache cleanup removed ${cleanedCount} orders`, {
        expired: expiredOrders.length,
        sizeLimit: cleanedCount - expiredOrders.length
      });
    }
  }
  
  /**
   * Record performance timing for cache operations
   * @param {string} operation - Operation type (hit, miss, add, sync)
   * @param {number} startTime - Operation start time
   */
  recordPerformanceTiming(operation, startTime) {
    const duration = Date.now() - startTime;
    this.metrics.totalOperations++;
    
    // Store timing data (keep last 100 measurements per operation)
    const timingArray = this.metrics[`${operation}Times`];
    if (timingArray) {
      timingArray.push(duration);
      if (timingArray.length > 100) {
        timingArray.shift();
      }
    }
    
    // Log to performance logger
    performanceLogger.logCacheOperation(operation, {
      duration,
      cacheSize: this.cache.size,
      subscribersCount: this.subscribers.size
    });
    
    // Log slow operations in development
    if (this.debugMode && duration > 10) {
      this.log(`⚠️ SLOW CACHE OPERATION: ${operation} took ${duration}ms`);
      performanceLogger.warn('CACHE', `Slow cache operation: ${operation}`, {
        duration,
        threshold: 10,
        operation
      });
    }
  }
  
  /**
   * Get cache performance statistics
   * @returns {Object} - Performance statistics
   */
  getPerformanceStats() {
    const hitRate = this.metrics.hits + this.metrics.misses > 0 ?
      (this.metrics.hits / (this.metrics.hits + this.metrics.misses)) * 100 : 0;
    
    const calculateAverage = (times) => {
      if (times.length === 0) return 0;
      return times.reduce((sum, time) => sum + time, 0) / times.length;
    };
    
    const calculatePercentile = (times, percentile) => {
      if (times.length === 0) return 0;
      const sorted = [...times].sort((a, b) => a - b);
      const index = Math.ceil((percentile / 100) * sorted.length) - 1;
      return sorted[Math.max(0, index)];
    };
    
    return {
      hitRate: Math.round(hitRate * 100) / 100,
      totalOperations: this.metrics.totalOperations,
      operationCounts: {
        hits: this.metrics.hits,
        misses: this.metrics.misses,
        adds: this.metrics.adds,
        removes: this.metrics.removes,
        syncs: this.metrics.syncs,
        errors: this.metrics.errors
      },
      averageTimes: {
        hit: Math.round(calculateAverage(this.metrics.hitTimes) * 100) / 100,
        miss: Math.round(calculateAverage(this.metrics.missTimes) * 100) / 100,
        add: Math.round(calculateAverage(this.metrics.addTimes) * 100) / 100,
        sync: Math.round(calculateAverage(this.metrics.syncTimes) * 100) / 100
      },
      percentile95Times: {
        hit: Math.round(calculatePercentile(this.metrics.hitTimes, 95) * 100) / 100,
        miss: Math.round(calculatePercentile(this.metrics.missTimes, 95) * 100) / 100,
        add: Math.round(calculatePercentile(this.metrics.addTimes, 95) * 100) / 100,
        sync: Math.round(calculatePercentile(this.metrics.syncTimes, 95) * 100) / 100
      },
      cacheSize: this.cache.size,
      subscribersCount: this.subscribers.size,
      lastUpdate: this.lastUpdate,
      lastSync: this.lastSync,
      timeSinceLastUpdate: Date.now() - this.lastUpdate,
      timeSinceLastSync: Date.now() - this.lastSync
    };
  }
  
  /**
   * Check cache performance and trigger alerts if needed
   */
  checkPerformanceThresholds() {
    const stats = this.getPerformanceStats();
    const now = Date.now();
    
    // Only check every 30 seconds to avoid spam
    if (now - this.metrics.lastPerformanceCheck < 30000) {
      return;
    }
    
    this.metrics.lastPerformanceCheck = now;
    
    // Alert on low hit rate
    if (stats.hitRate < 70 && stats.totalOperations > 50) {
      this.triggerPerformanceAlert('low-hit-rate', {
        hitRate: stats.hitRate,
        threshold: 70,
        totalOperations: stats.totalOperations
      });
    }
    
    // Alert on slow operations
    if (stats.averageTimes.hit > 5) {
      this.triggerPerformanceAlert('slow-cache-hits', {
        averageTime: stats.averageTimes.hit,
        threshold: 5
      });
    }
    
    if (stats.averageTimes.add > 10) {
      this.triggerPerformanceAlert('slow-cache-adds', {
        averageTime: stats.averageTimes.add,
        threshold: 10
      });
    }
  }
  
  /**
   * Trigger performance alert
   * @param {string} alertType - Type of alert
   * @param {Object} data - Alert data
   */
  triggerPerformanceAlert(alertType, data) {
    this.log(`🚨 CACHE PERFORMANCE ALERT: ${alertType}`, data);
    
    // Dispatch custom event for monitoring systems
    const alertEvent = new CustomEvent('cachePerformanceAlert', {
      detail: {
        type: alertType,
        data,
        timestamp: Date.now(),
        source: 'activeOrdersCache'
      }
    });
    
    window.dispatchEvent(alertEvent);
  }

  /**
   * Get cache statistics
   * @returns {Object} - Cache statistics
   */
  getStats() {
    const hitRate = this.metrics.hits + this.metrics.misses > 0 ?
      (this.metrics.hits / (this.metrics.hits + this.metrics.misses)) * 100 : 0;
    
    return {
      ...this.metrics,
      hitRate: Math.round(hitRate * 100) / 100,
      cacheSize: this.cache.size,
      subscribersCount: this.subscribers.size,
      lastUpdate: this.lastUpdate,
      lastSync: this.lastSync,
      timeSinceLastUpdate: Date.now() - this.lastUpdate,
      timeSinceLastSync: Date.now() - this.lastSync
    };
  }
  
  /**
   * Clear all cache data
   */
  clear() {
    this.cache.clear();
    this.lastUpdate = 0;
    this.lastSync = 0;
    this.clearStorage();
    
    this.log('Cache cleared');
    
    // Notify subscribers
    this.notifySubscribers('cache-cleared', null);
  }
  
  /**
   * Destroy cache and cleanup
   */
  destroy() {
    this.log('Destroying ActiveOrdersCache');
    
    this.clear();
    this.subscribers.clear();
    
    // Reset metrics
    Object.keys(this.metrics).forEach(key => {
      this.metrics[key] = 0;
    });
  }
}

// Create singleton instance
const activeOrdersCache = new ActiveOrdersCache();

// Export both class and singleton
export { ActiveOrdersCache };
export default activeOrdersCache;