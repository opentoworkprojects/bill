/**
 * Order Polling Manager - Coordinates all order refresh operations to prevent duplicates
 * 
 * This utility ensures that only one order refresh operation happens at a time,
 * preventing duplicate orders from appearing during overlapping polling cycles.
 */

class OrderPollingManager {
  constructor() {
    this.isRefreshing = false;
    this.pendingRefresh = false;
    this.lastRefreshTime = 0;
    this.refreshPromise = null;
    this.abortController = null;
    this.refreshCallbacks = new Set();
    
    // Priority system for different types of refreshes
    this.priorityQueue = [];
    this.isProcessingPriority = false;
    
    // Event-driven refresh triggers
    this.eventListeners = new Map();
    this.eventQueue = [];
    this.isProcessingEvents = false;
    
    // Smart polling intervals
    this.smartPolling = {
      baseInterval: 3000,        // 3 seconds base
      fastInterval: 1000,        // 1 second when active
      slowInterval: 10000,       // 10 seconds when idle
      currentInterval: 3000,
      lastActivity: Date.now(),
      activityThreshold: 30000,  // 30 seconds of inactivity = slow mode
      fastModeThreshold: 5000,   // 5 seconds of activity = fast mode
      intervalId: null,
      isAdaptive: true
    };
    
    // Activity tracking
    this.activityTracker = {
      userInteractions: 0,
      orderCreations: 0,
      statusChanges: 0,
      lastInteractionTime: Date.now(),
      recentActivity: []
    };
    
    // Minimum time between refreshes (in milliseconds)
    this.MIN_REFRESH_INTERVAL = 1000; // 1 second
    
    // Priority levels
    this.PRIORITY_LEVELS = {
      CRITICAL: 0,    // New order creation, payment completion
      HIGH: 1,        // Status changes, immediate user actions
      NORMAL: 2,      // Regular polling, background updates
      LOW: 3          // Cleanup, maintenance operations
    };
    
    // Event types that trigger refreshes
    this.REFRESH_EVENTS = {
      ORDER_CREATED: 'order_created',
      ORDER_UPDATED: 'order_updated', 
      ORDER_STATUS_CHANGED: 'order_status_changed',
      PAYMENT_COMPLETED: 'payment_completed',
      USER_INTERACTION: 'user_interaction',
      WINDOW_FOCUS: 'window_focus',
      VISIBILITY_CHANGE: 'visibility_change'
    };
    
    // Initialize event-driven triggers
    this.initializeEventTriggers();
    
    // Initialize smart polling
    this.initializeSmartPolling();
    
    console.log('🔄 OrderPollingManager initialized with priority system, event triggers, and smart polling');
  }
  
  /**
   * Initialize smart polling system
   */
  initializeSmartPolling() {
    console.log('🧠 Initializing smart polling system');
    
    // Track user activity for adaptive polling
    this.trackUserActivity();
    
    // Start adaptive polling interval
    this.startAdaptivePolling();
    
    // Monitor system performance
    this.monitorPerformance();
  }
  
  /**
   * Track user activity to adjust polling intervals
   */
  trackUserActivity() {
    const activityEvents = ['click', 'touchstart', 'keydown', 'mousemove', 'scroll'];
    
    const handleActivity = () => {
      const now = Date.now();
      this.activityTracker.userInteractions++;
      this.activityTracker.lastInteractionTime = now;
      this.smartPolling.lastActivity = now;
      
      // Add to recent activity buffer
      this.activityTracker.recentActivity.push(now);
      
      // Keep only last 10 activities
      if (this.activityTracker.recentActivity.length > 10) {
        this.activityTracker.recentActivity.shift();
      }
      
      // Adjust polling based on activity
      this.adjustPollingInterval();
    };
    
    // Throttle activity tracking to prevent excessive calls
    let activityTimeout;
    const throttledActivity = () => {
      if (activityTimeout) return;
      
      activityTimeout = setTimeout(() => {
        handleActivity();
        activityTimeout = null;
      }, 1000); // Track activity at most once per second
    };
    
    activityEvents.forEach(event => {
      document.addEventListener(event, throttledActivity, { passive: true });
    });
    
    // Track order-specific activities
    this.addEventListener(this.REFRESH_EVENTS.ORDER_CREATED, () => {
      this.activityTracker.orderCreations++;
      this.adjustPollingInterval('order_created');
    });
    
    this.addEventListener(this.REFRESH_EVENTS.ORDER_STATUS_CHANGED, () => {
      this.activityTracker.statusChanges++;
      this.adjustPollingInterval('status_changed');
    });
  }
  
  /**
   * Adjust polling interval based on activity
   */
  adjustPollingInterval(activityType = 'user_interaction') {
    if (!this.smartPolling.isAdaptive) return;
    
    const now = Date.now();
    const timeSinceLastActivity = now - this.smartPolling.lastActivity;
    
    let newInterval = this.smartPolling.baseInterval;
    
    // Determine interval based on activity patterns
    if (activityType === 'order_created' || activityType === 'status_changed') {
      // High activity - use fast interval
      newInterval = this.smartPolling.fastInterval;
      console.log(`⚡ FAST POLLING: Order activity detected, switching to ${newInterval}ms`);
    } else if (timeSinceLastActivity < this.smartPolling.fastModeThreshold) {
      // Recent activity - use fast interval
      newInterval = this.smartPolling.fastInterval;
      console.log(`🏃 ACTIVE POLLING: Recent activity, using ${newInterval}ms`);
    } else if (timeSinceLastActivity > this.smartPolling.activityThreshold) {
      // No recent activity - use slow interval
      newInterval = this.smartPolling.slowInterval;
      console.log(`🐌 SLOW POLLING: No recent activity, using ${newInterval}ms`);
    } else {
      // Normal activity - use base interval
      newInterval = this.smartPolling.baseInterval;
      console.log(`🚶 NORMAL POLLING: Standard activity, using ${newInterval}ms`);
    }
    
    // Only update if interval changed significantly
    if (Math.abs(newInterval - this.smartPolling.currentInterval) > 500) {
      this.smartPolling.currentInterval = newInterval;
      this.restartAdaptivePolling();
    }
  }
  
  /**
   * Start adaptive polling with current interval
   */
  startAdaptivePolling() {
    if (this.smartPolling.intervalId) {
      clearInterval(this.smartPolling.intervalId);
    }
    
    console.log(`🔄 Starting adaptive polling with ${this.smartPolling.currentInterval}ms interval`);
    
    this.smartPolling.intervalId = setInterval(() => {
      // Only poll if no high-priority operations are in progress
      if (!this.isRefreshing && this.priorityQueue.length === 0) {
        this.triggerEventRefresh('adaptive-polling', this.PRIORITY_LEVELS.LOW);
      }
    }, this.smartPolling.currentInterval);
  }
  
  /**
   * Restart adaptive polling with new interval
   */
  restartAdaptivePolling() {
    console.log(`🔄 Restarting adaptive polling with new interval: ${this.smartPolling.currentInterval}ms`);
    this.startAdaptivePolling();
  }
  
  /**
   * Monitor system performance and adjust accordingly
   */
  monitorPerformance() {
    // Monitor refresh performance
    this.onRefresh((result, source) => {
      const refreshTime = Date.now() - this.lastRefreshTime;
      
      // If refreshes are taking too long, slow down polling
      if (refreshTime > 5000) { // 5 seconds
        console.log(`⚠️ PERFORMANCE: Slow refresh detected (${refreshTime}ms), adjusting polling`);
        this.smartPolling.currentInterval = Math.min(
          this.smartPolling.currentInterval * 1.5,
          this.smartPolling.slowInterval
        );
        this.restartAdaptivePolling();
      }
    });
    
    // Monitor memory usage (if available)
    if (performance.memory) {
      setInterval(() => {
        const memoryUsage = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
        
        if (memoryUsage > 0.8) { // 80% memory usage
          console.log(`⚠️ MEMORY: High memory usage detected (${Math.round(memoryUsage * 100)}%), slowing polling`);
          this.smartPolling.currentInterval = this.smartPolling.slowInterval;
          this.restartAdaptivePolling();
        }
      }, 30000); // Check every 30 seconds
    }
  }
  
  /**
   * Get current polling statistics
   */
  getPollingStats() {
    return {
      currentInterval: this.smartPolling.currentInterval,
      lastActivity: this.smartPolling.lastActivity,
      timeSinceLastActivity: Date.now() - this.smartPolling.lastActivity,
      activityTracker: { ...this.activityTracker },
      isAdaptive: this.smartPolling.isAdaptive,
      queueLength: this.priorityQueue.length,
      isRefreshing: this.isRefreshing
    };
  }
  
  /**
   * Enable or disable adaptive polling
   */
  setAdaptivePolling(enabled) {
    this.smartPolling.isAdaptive = enabled;
    
    if (enabled) {
      console.log('🧠 Adaptive polling enabled');
      this.adjustPollingInterval();
    } else {
      console.log('🔒 Adaptive polling disabled, using base interval');
      this.smartPolling.currentInterval = this.smartPolling.baseInterval;
      this.restartAdaptivePolling();
    }
  }
  /**
   * Initialize event-driven refresh triggers
   */
  initializeEventTriggers() {
    // Listen for window events that should trigger refreshes
    this.addEventListener(this.REFRESH_EVENTS.WINDOW_FOCUS, () => {
      this.triggerEventRefresh('window-focus', this.PRIORITY_LEVELS.HIGH);
    });
    
    this.addEventListener(this.REFRESH_EVENTS.VISIBILITY_CHANGE, () => {
      if (!document.hidden) {
        this.triggerEventRefresh('visibility-change', this.PRIORITY_LEVELS.HIGH);
      }
    });
    
    this.addEventListener(this.REFRESH_EVENTS.ORDER_CREATED, (orderData) => {
      this.triggerEventRefresh('order-created', this.PRIORITY_LEVELS.CRITICAL, { orderData });
    });
    
    this.addEventListener(this.REFRESH_EVENTS.ORDER_STATUS_CHANGED, (statusData) => {
      this.triggerEventRefresh('status-changed', this.PRIORITY_LEVELS.HIGH, { statusData });
    });
    
    this.addEventListener(this.REFRESH_EVENTS.PAYMENT_COMPLETED, (paymentData) => {
      this.triggerEventRefresh('payment-completed', this.PRIORITY_LEVELS.CRITICAL, { paymentData });
    });
    
    // Set up DOM event listeners
    window.addEventListener('focus', () => {
      this.dispatchEvent(this.REFRESH_EVENTS.WINDOW_FOCUS);
    });
    
    document.addEventListener('visibilitychange', () => {
      this.dispatchEvent(this.REFRESH_EVENTS.VISIBILITY_CHANGE);
    });
    
    // Listen for custom events from other components
    window.addEventListener('orderCreated', (event) => {
      this.dispatchEvent(this.REFRESH_EVENTS.ORDER_CREATED, event.detail);
    });
    
    window.addEventListener('orderStatusChanged', (event) => {
      this.dispatchEvent(this.REFRESH_EVENTS.ORDER_STATUS_CHANGED, event.detail);
    });
    
    window.addEventListener('paymentCompleted', (event) => {
      this.dispatchEvent(this.REFRESH_EVENTS.PAYMENT_COMPLETED, event.detail);
    });
  }
  
  /**
   * Add event listener for refresh triggers
   */
  addEventListener(eventType, callback) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    
    this.eventListeners.get(eventType).add(callback);
    
    console.log(`🎧 Event listener added for: ${eventType}`);
    
    // Return cleanup function
    return () => this.removeEventListener(eventType, callback);
  }
  
  /**
   * Remove event listener
   */
  removeEventListener(eventType, callback) {
    if (this.eventListeners.has(eventType)) {
      this.eventListeners.get(eventType).delete(callback);
      
      // Clean up empty event type
      if (this.eventListeners.get(eventType).size === 0) {
        this.eventListeners.delete(eventType);
      }
    }
  }
  
  /**
   * Dispatch event to trigger refresh
   */
  dispatchEvent(eventType, data = null) {
    const event = {
      type: eventType,
      data,
      timestamp: Date.now()
    };
    
    this.eventQueue.push(event);
    
    console.log(`📡 Event dispatched: ${eventType}`, data);
    
    // Process events immediately
    this.processEventQueue();
  }
  
  /**
   * Process event queue
   */
  async processEventQueue() {
    if (this.isProcessingEvents || this.eventQueue.length === 0) {
      return;
    }
    
    this.isProcessingEvents = true;
    
    try {
      while (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift();
        
        // Notify all listeners for this event type
        if (this.eventListeners.has(event.type)) {
          const listeners = this.eventListeners.get(event.type);
          
          for (const listener of listeners) {
            try {
              await listener(event.data);
            } catch (error) {
              console.error(`❌ Event listener error for ${event.type}:`, error);
            }
          }
        }
      }
    } finally {
      this.isProcessingEvents = false;
    }
  }
  
  /**
   * Trigger event-driven refresh
   */
  triggerEventRefresh(source, priority = this.PRIORITY_LEVELS.NORMAL, eventData = {}) {
    console.log(`🎯 Event-driven refresh triggered: ${source} (priority: ${priority})`);
    
    // Create event-specific refresh function
    const eventRefreshFunction = async (options = {}) => {
      const { signal } = options;
      
      try {
        // Determine refresh strategy based on event type
        let refreshUrl = `${window.API || '/api'}/orders?fresh=true&_t=${Date.now()}`;
        
        if (source === 'order-created' || source === 'status-changed') {
          refreshUrl += '&active_only=true';
        }
        
        const response = await fetch(refreshUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          },
          signal
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        return {
          orders: Array.isArray(data) ? data : [],
          source: `event-${source}`,
          eventData
        };
        
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error(`❌ Event refresh failed for ${source}:`, error);
        }
        throw error;
      }
    };
    
    // Add to priority queue
    this.addToPriorityQueue(eventRefreshFunction, {
      priority,
      source: `event-${source}`,
      eventData,
      force: priority <= this.PRIORITY_LEVELS.HIGH
    });
  }
  
  /**
   * Add refresh request to priority queue
   * @param {Function} refreshFunction - Function to execute
   * @param {Object} options - Refresh options with priority
   */
  addToPriorityQueue(refreshFunction, options = {}) {
    const { 
      priority = this.PRIORITY_LEVELS.NORMAL, 
      source = 'unknown',
      timestamp = Date.now()
    } = options;
    
    const queueItem = {
      refreshFunction,
      options: { ...options, priority, source, timestamp },
      id: `${source}_${timestamp}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    // Insert in priority order (lower number = higher priority)
    let insertIndex = this.priorityQueue.length;
    for (let i = 0; i < this.priorityQueue.length; i++) {
      if (this.priorityQueue[i].options.priority > priority) {
        insertIndex = i;
        break;
      }
    }
    
    this.priorityQueue.splice(insertIndex, 0, queueItem);
    
    console.log(`📋 Added to priority queue: ${source} (priority: ${priority}, position: ${insertIndex})`);
    
    // Process queue if not already processing
    if (!this.isProcessingPriority) {
      this.processPriorityQueue();
    }
    
    return queueItem.id;
  }
  
  /**
   * Process priority queue in order
   */
  async processPriorityQueue() {
    if (this.isProcessingPriority || this.priorityQueue.length === 0) {
      return;
    }
    
    this.isProcessingPriority = true;
    
    try {
      while (this.priorityQueue.length > 0) {
        const queueItem = this.priorityQueue.shift();
        const { refreshFunction, options } = queueItem;
        
        console.log(`🚀 Processing priority queue item: ${options.source} (priority: ${options.priority})`);
        
        try {
          // Execute with original coordinateRefresh logic but bypass queue
          await this.executeDirectRefresh(refreshFunction, options);
        } catch (error) {
          console.error(`❌ Priority queue item failed: ${options.source}`, error);
          // Continue processing other items even if one fails
        }
        
        // Small delay between priority items to prevent overwhelming
        if (this.priorityQueue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
    } finally {
      this.isProcessingPriority = false;
    }
  }
  
  /**
   * Execute refresh directly without normal coordination logic
   */
  async executeDirectRefresh(refreshFunction, options) {
    const { source, force = false } = options;
    
    // For critical priority, always execute immediately
    if (options.priority === this.PRIORITY_LEVELS.CRITICAL || force) {
      console.log(`⚡ CRITICAL PRIORITY: Executing ${source} immediately`);
      return this.executeRefresh(refreshFunction, source);
    }
    
    // For other priorities, use normal coordination
    return this.coordinateRefresh(refreshFunction, { ...options, force: true });
  }
  
  /**
   * Clear priority queue (emergency use)
   */
  clearPriorityQueue() {
    const clearedCount = this.priorityQueue.length;
    this.priorityQueue = [];
    console.log(`🧹 Cleared ${clearedCount} items from priority queue`);
  }
  /**
   * Register a callback to be called when orders are refreshed
   */
  onRefresh(callback) {
    this.refreshCallbacks.add(callback);
    return () => this.refreshCallbacks.delete(callback);
  }
  
  /**
   * Check if a refresh is currently in progress
   */
  isRefreshInProgress() {
    return this.isRefreshing;
  }
  
  /**
   * Get time since last refresh
   */
  getTimeSinceLastRefresh() {
    return Date.now() - this.lastRefreshTime;
  }
  
  /**
   * Cancel any in-flight refresh operation
   */
  cancelCurrentRefresh() {
    if (this.abortController) {
      console.log('🚫 Cancelling in-flight refresh operation');
      this.abortController.abort();
      this.abortController = null;
    }
  }
  
  /**
   * Coordinate order refresh to prevent duplicates
   * 
   * @param {Function} refreshFunction - The actual refresh function to execute
   * @param {Object} options - Refresh options
   * @param {boolean} options.force - Force refresh even if one is in progress
   * @param {string} options.source - Source of the refresh request (for logging)
   * @param {boolean} options.immediate - Skip minimum interval check
   * @param {boolean} options.newOrderCreated - Indicates a new order was just created
   * @param {boolean} options.priorityRefresh - High priority refresh for active orders
   * @param {Object} options.orderCreationData - Data about the created order
   * @returns {Promise} - Promise that resolves when refresh is complete
   */
  async coordinateRefresh(refreshFunction, options = {}) {
    const { 
      force = false, 
      source = 'unknown', 
      immediate = false, 
      newOrderCreated = false,
      priorityRefresh = false,
      orderCreationData = null
    } = options;
    
    console.log(`🔄 Refresh requested from: ${source}`, {
      isRefreshing: this.isRefreshing,
      pendingRefresh: this.pendingRefresh,
      timeSinceLastRefresh: this.getTimeSinceLastRefresh(),
      force,
      immediate,
      newOrderCreated,
      priorityRefresh,
      hasOrderData: !!orderCreationData
    });
    
    // OPTIMIZED ORDER CREATION COORDINATION
    if (newOrderCreated) {
      console.log(`🚀 NEW ORDER COORDINATION: Optimizing refresh for order creation`);
      
      // Dispatch order creation event for other components
      if (orderCreationData) {
        this.dispatchEvent(this.REFRESH_EVENTS.ORDER_CREATED, orderCreationData);
      }
      
      // Use specialized order creation refresh
      return this.coordinateOrderCreationRefresh(refreshFunction, orderCreationData, source);
    }
    
    // PRIORITY SYSTEM: Priority refresh for active orders bypasses normal queuing
    if (priorityRefresh && !this.isRefreshing) {
      console.log(`⚡ PRIORITY REFRESH: Executing immediately`);
      force = true;
      immediate = true;
    }
    
    // If refresh is in progress and not forced, queue it
    if (this.isRefreshing && !force) {
      console.log(`⏳ Refresh already in progress, queuing request from: ${source}`);
      this.pendingRefresh = true;
      
      // Wait for current refresh to complete, then execute pending
      if (this.refreshPromise) {
        await this.refreshPromise;
        
        // Execute pending refresh if still needed
        if (this.pendingRefresh) {
          this.pendingRefresh = false;
          return this.coordinateRefresh(refreshFunction, { ...options, force: true });
        }
      }
      return;
    }
    
    // Check minimum interval (unless immediate or forced)
    if (!immediate && !force && this.getTimeSinceLastRefresh() < this.MIN_REFRESH_INTERVAL) {
      console.log(`⏸️ Skipping refresh from ${source} - too soon (${this.getTimeSinceLastRefresh()}ms < ${this.MIN_REFRESH_INTERVAL}ms)`);
      return;
    }
    
    // Cancel any existing refresh
    this.cancelCurrentRefresh();
    
    // Start new refresh
    this.isRefreshing = true;
    this.abortController = new AbortController();
    
    console.log(`🚀 Starting coordinated refresh from: ${source}`);
    
    this.refreshPromise = this.executeRefresh(refreshFunction, source);
    
    try {
      const result = await this.refreshPromise;
      console.log(`✅ Refresh completed successfully from: ${source}`);
      return result;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`🚫 Refresh cancelled from: ${source}`);
      } else {
        console.error(`❌ Refresh failed from: ${source}`, error);
      }
      throw error;
    } finally {
      this.isRefreshing = false;
      this.lastRefreshTime = Date.now();
      this.abortController = null;
      this.refreshPromise = null;
      
      // Execute pending refresh if queued
      if (this.pendingRefresh) {
        this.pendingRefresh = false;
        setTimeout(() => {
          this.coordinateRefresh(refreshFunction, { source: 'pending', force: true });
        }, 100);
      }
    }
  }
  
  /**
   * Specialized coordination for order creation events
   */
  async coordinateOrderCreationRefresh(refreshFunction, orderData, source) {
    console.log(`🎯 ORDER CREATION COORDINATION: Optimizing refresh for new order`);
    
    // Create optimized refresh function for order creation
    const orderCreationRefreshFunction = async (options = {}) => {
      const { signal } = options;
      
      try {
        // Strategy 1: If we have order data, use optimistic update approach
        if (orderData && orderData.id) {
          console.log(`⚡ OPTIMISTIC: Using order data for immediate update`);
          
          // Return the new order immediately for instant UI update
          const optimisticResult = {
            activeOrders: [orderData],
            source: 'optimistic-order-creation',
            isOptimistic: true,
            orderData
          };
          
          // Trigger background sync after a short delay
          setTimeout(() => {
            this.triggerEventRefresh('order-creation-sync', this.PRIORITY_LEVELS.HIGH, orderData);
          }, 500);
          
          return optimisticResult;
        }
        
        // Strategy 2: Fallback to immediate server refresh
        console.log(`🔄 FALLBACK: Immediate server refresh for order creation`);
        
        const response = await fetch(`${window.API || '/api'}/orders?fresh=true&active_only=true&_t=${Date.now()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          },
          signal
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        return {
          activeOrders: Array.isArray(data) ? data : [],
          source: 'order-creation-server-refresh',
          isOptimistic: false
        };
        
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error(`❌ Order creation refresh failed:`, error);
        }
        throw error;
      }
    };
    
    // Execute with highest priority and no delays
    return this.executeDirectRefresh(orderCreationRefreshFunction, {
      priority: this.PRIORITY_LEVELS.CRITICAL,
      source: `order-creation-${source}`,
      force: true,
      immediate: true
    });
  }
  
  /**
   * Handle order creation event from external components
   */
  handleOrderCreation(orderData) {
    console.log(`📥 ORDER CREATION EVENT: Received order data`, orderData);
    
    // Dispatch to event system
    this.dispatchEvent(this.REFRESH_EVENTS.ORDER_CREATED, orderData);
    
    // Trigger immediate optimized refresh
    this.coordinateOrderCreationRefresh(null, orderData, 'external-order-creation');
  }
  
  /**
   * Handle order status change event
   */
  handleOrderStatusChange(statusData) {
    console.log(`📝 ORDER STATUS CHANGE: Received status data`, statusData);
    
    // Dispatch to event system
    this.dispatchEvent(this.REFRESH_EVENTS.ORDER_STATUS_CHANGED, statusData);
    
    // Trigger high priority refresh for status changes
    this.triggerEventRefresh('status-change-coordination', this.PRIORITY_LEVELS.HIGH, statusData);
  }
  
  /**
   * Execute the actual refresh function with error handling
   */
  async executeRefresh(refreshFunction, source) {
    try {
      // Add abort signal to refresh function if it supports it
      const result = await refreshFunction({
        signal: this.abortController?.signal,
        source
      });
      
      // Notify all registered callbacks
      this.refreshCallbacks.forEach(callback => {
        try {
          callback(result, source);
        } catch (error) {
          console.error('Error in refresh callback:', error);
        }
      });
      
      return result;
    } catch (error) {
      // Don't log abort errors as they're expected
      if (error.name !== 'AbortError') {
        console.error(`Refresh execution error from ${source}:`, error);
      }
      throw error;
    }
  }
  
  /**
   * Force an immediate refresh, cancelling any in-progress operations
   */
  async forceRefresh(refreshFunction, source = 'force') {
    return this.coordinateRefresh(refreshFunction, { 
      force: true, 
      immediate: true, 
      source 
    });
  }
  
  /**
   * Force immediate active orders refresh - bypasses all delays and intervals
   * @param {string} source - Source of the refresh request
   * @returns {Promise} - Promise that resolves when refresh is complete
   */
  async forceActiveOrdersRefresh(source = 'immediate') {
    console.log(`🚀 Force active orders refresh from: ${source}`);
    
    // Create a specialized refresh function for active orders
    const activeOrdersRefreshFunction = async (options = {}) => {
      const { signal } = options;
      
      try {
        // Skip all delays and intervals - direct database query
        const response = await fetch(`${window.API || '/api'}/orders?fresh=true&active_only=true&_t=${Date.now()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          },
          signal
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`✅ Force refresh completed: ${data.length} active orders`);
        
        return {
          activeOrders: Array.isArray(data) ? data : [],
          source: 'force-active-orders-refresh'
        };
        
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error(`❌ Force active orders refresh failed:`, error);
        }
        throw error;
      }
    };
    
    // Execute with highest priority
    return this.coordinateRefresh(activeOrdersRefreshFunction, {
      force: true,
      immediate: true,
      source: `force-active-orders-${source}`
    });
  }
  
  /**
   * Schedule a refresh with debouncing and priority support
   */
  scheduleRefresh(refreshFunction, delay = 100, source = 'scheduled', priority = false) {
    if (this.scheduleTimeout) {
      clearTimeout(this.scheduleTimeout);
    }
    
    this.scheduleTimeout = setTimeout(() => {
      this.coordinateRefresh(refreshFunction, { 
        source, 
        priorityRefresh: priority 
      });
    }, delay);
  }
  
  /**
   * Schedule priority refresh for active orders with shorter delay
   */
  schedulePriorityRefresh(refreshFunction, source = 'priority-scheduled') {
    this.scheduleRefresh(refreshFunction, 50, source, true);
  }
  
  /**
   * Clear any scheduled refresh
   */
  clearScheduledRefresh() {
    if (this.scheduleTimeout) {
      clearTimeout(this.scheduleTimeout);
      this.scheduleTimeout = null;
    }
  }
  
  /**
   * Reset the polling manager state
   */
  reset() {
    console.log('🔄 Resetting OrderPollingManager');
    this.cancelCurrentRefresh();
    this.clearScheduledRefresh();
    
    // Reset smart polling
    if (this.smartPolling.intervalId) {
      clearInterval(this.smartPolling.intervalId);
      this.smartPolling.intervalId = null;
    }
    
    // Reset state
    this.isRefreshing = false;
    this.pendingRefresh = false;
    this.lastRefreshTime = 0;
    this.refreshPromise = null;
    this.refreshCallbacks.clear();
    
    // Reset priority queue
    this.priorityQueue = [];
    this.isProcessingPriority = false;
    
    // Reset event system
    this.eventQueue = [];
    this.isProcessingEvents = false;
    
    // Reset activity tracking
    this.activityTracker = {
      userInteractions: 0,
      orderCreations: 0,
      statusChanges: 0,
      lastInteractionTime: Date.now(),
      recentActivity: []
    };
    
    // Restart smart polling
    this.startAdaptivePolling();
  }
  
  /**
   * Get current status for debugging
   */
  getStatus() {
    return {
      isRefreshing: this.isRefreshing,
      pendingRefresh: this.pendingRefresh,
      lastRefreshTime: this.lastRefreshTime,
      timeSinceLastRefresh: this.getTimeSinceLastRefresh(),
      hasActiveCallbacks: this.refreshCallbacks.size > 0,
      hasScheduledRefresh: !!this.scheduleTimeout,
      priorityQueueLength: this.priorityQueue.length,
      eventQueueLength: this.eventQueue.length,
      pollingStats: this.getPollingStats(),
      eventListeners: Array.from(this.eventListeners.keys())
    };
  }
}

// Create singleton instance
const orderPollingManager = new OrderPollingManager();

// Export both the class and singleton for different use cases
export { OrderPollingManager };
export default orderPollingManager;