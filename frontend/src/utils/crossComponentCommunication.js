/**
 * Cross-Component Communication System for Active Orders
 * 
 * This utility provides a centralized event system for communication between
 * different components (OrdersPage, KitchenPage, BillingPage) regarding
 * active orders updates, ensuring all components stay in sync.
 */

class CrossComponentCommunication {
  constructor() {
    this.eventListeners = new Map();
    this.eventHistory = [];
    this.maxHistorySize = 100;
    this.debugMode = process.env.NODE_ENV === 'development';
    
    // Event types for active orders
    this.EVENT_TYPES = {
      ORDER_CREATED: 'activeOrder:created',
      ORDER_UPDATED: 'activeOrder:updated',
      ORDER_STATUS_CHANGED: 'activeOrder:statusChanged',
      ORDER_COMPLETED: 'activeOrder:completed',
      ORDER_CANCELLED: 'activeOrder:cancelled',
      ORDERS_REFRESHED: 'activeOrders:refreshed',
      CACHE_UPDATED: 'activeOrders:cacheUpdated',
      SYNC_REQUESTED: 'activeOrders:syncRequested'
    };
    
    // Component identifiers
    this.COMPONENTS = {
      ORDERS_PAGE: 'orders-page',
      KITCHEN_PAGE: 'kitchen-page',
      BILLING_PAGE: 'billing-page',
      TABLES_PAGE: 'tables-page'
    };
    
    this.log('CrossComponentCommunication initialized');
    this.initializeWindowEventSystem();
  }
  
  /**
   * Log debug messages in development mode
   */
  log(message, data = null) {
    if (this.debugMode) {
      const timestamp = new Date().toISOString();
      console.log(`[CrossComponentComm ${timestamp}] ${message}`, data || '');
    }
  }
  
  /**
   * Initialize window-based event system
   */
  initializeWindowEventSystem() {
    // Listen for all active order events on window
    Object.values(this.EVENT_TYPES).forEach(eventType => {
      window.addEventListener(eventType, (event) => {
        this.handleWindowEvent(eventType, event.detail);
      });
    });
    
    // Listen for storage events (cross-tab communication)
    window.addEventListener('storage', (event) => {
      if (event.key && event.key.startsWith('activeOrders:')) {
        this.handleStorageEvent(event);
      }
    });
    
    this.log('Window event system initialized');
  }
  
  /**
   * Handle window events
   */
  handleWindowEvent(eventType, eventData) {
    this.log(`Window event received: ${eventType}`, eventData);
    
    // Add to event history
    this.addToEventHistory({
      type: eventType,
      data: eventData,
      timestamp: Date.now(),
      source: 'window'
    });
    
    // Notify registered listeners
    this.notifyListeners(eventType, eventData);
  }
  
  /**
   * Handle storage events (cross-tab)
   */
  handleStorageEvent(storageEvent) {
    try {
      const eventData = JSON.parse(storageEvent.newValue || '{}');
      const eventType = storageEvent.key.replace('activeOrders:', this.EVENT_TYPES.ORDER_CREATED.split(':')[0] + ':');
      
      this.log(`Storage event received: ${eventType}`, eventData);
      
      // Add to event history
      this.addToEventHistory({
        type: eventType,
        data: eventData,
        timestamp: Date.now(),
        source: 'storage'
      });
      
      // Notify registered listeners
      this.notifyListeners(eventType, eventData);
      
    } catch (error) {
      this.log('Failed to parse storage event', error);
    }
  }
  
  /**
   * Register event listener for specific component
   */
  addEventListener(componentId, eventType, callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }
    
    const listenerKey = `${componentId}:${eventType}`;
    
    if (!this.eventListeners.has(listenerKey)) {
      this.eventListeners.set(listenerKey, new Set());
    }
    
    this.eventListeners.get(listenerKey).add(callback);
    
    this.log(`Event listener added: ${listenerKey}`);
    
    // Return cleanup function
    return () => this.removeEventListener(componentId, eventType, callback);
  }
  
  /**
   * Remove event listener
   */
  removeEventListener(componentId, eventType, callback) {
    const listenerKey = `${componentId}:${eventType}`;
    
    if (this.eventListeners.has(listenerKey)) {
      const removed = this.eventListeners.get(listenerKey).delete(callback);
      
      // Clean up empty listener sets
      if (this.eventListeners.get(listenerKey).size === 0) {
        this.eventListeners.delete(listenerKey);
      }
      
      if (removed) {
        this.log(`Event listener removed: ${listenerKey}`);
      }
      
      return removed;
    }
    
    return false;
  }
  
  /**
   * Broadcast event to all components
   */
  broadcastEvent(eventType, eventData, options = {}) {
    const {
      sourceComponent = 'unknown',
      crossTab = true,
      persistent = false
    } = options;
    
    this.log(`Broadcasting event: ${eventType} from ${sourceComponent}`, eventData);
    
    const event = {
      type: eventType,
      data: eventData,
      timestamp: Date.now(),
      source: sourceComponent
    };
    
    // Add to event history
    this.addToEventHistory(event);
    
    // Broadcast via window events
    const customEvent = new CustomEvent(eventType, { 
      detail: {
        ...eventData,
        _meta: {
          source: sourceComponent,
          timestamp: event.timestamp
        }
      }
    });
    
    window.dispatchEvent(customEvent);
    
    // Cross-tab communication via localStorage
    if (crossTab) {
      try {
        const storageKey = `activeOrders:${eventType.split(':')[1]}`;
        const storageData = {
          ...eventData,
          _meta: {
            source: sourceComponent,
            timestamp: event.timestamp,
            tabId: this.getTabId()
          }
        };
        
        localStorage.setItem(storageKey, JSON.stringify(storageData));
        
        // Clean up storage after a delay (unless persistent)
        if (!persistent) {
          setTimeout(() => {
            localStorage.removeItem(storageKey);
          }, 5000);
        }
        
      } catch (error) {
        this.log('Failed to broadcast via localStorage', error);
      }
    }
  }
  
  /**
   * Notify registered listeners
   */
  notifyListeners(eventType, eventData) {
    const notifiedComponents = new Set();
    
    // Notify specific listeners for this event type
    this.eventListeners.forEach((listeners, listenerKey) => {
      const [componentId, registeredEventType] = listenerKey.split(':');
      
      if (registeredEventType === eventType) {
        listeners.forEach(callback => {
          try {
            callback(eventData, eventType);
            notifiedComponents.add(componentId);
          } catch (error) {
            this.log(`Listener error for ${listenerKey}`, error);
          }
        });
      }
    });
    
    this.log(`Event ${eventType} notified components:`, Array.from(notifiedComponents));
  }
  
  /**
   * Add event to history
   */
  addToEventHistory(event) {
    this.eventHistory.push(event);
    
    // Maintain history size limit
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }
  
  /**
   * Get unique tab ID for cross-tab communication
   */
  getTabId() {
    if (!this.tabId) {
      this.tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    return this.tabId;
  }
  
  /**
   * Order-specific event broadcasters
   */
  
  /**
   * Broadcast order created event
   */
  broadcastOrderCreated(order, sourceComponent) {
    this.broadcastEvent(this.EVENT_TYPES.ORDER_CREATED, {
      order,
      orderId: order.id
    }, {
      sourceComponent,
      crossTab: true
    });
  }
  
  /**
   * Broadcast order updated event
   */
  broadcastOrderUpdated(order, changes, sourceComponent) {
    this.broadcastEvent(this.EVENT_TYPES.ORDER_UPDATED, {
      order,
      orderId: order.id,
      changes
    }, {
      sourceComponent,
      crossTab: true
    });
  }
  
  /**
   * Broadcast order status changed event
   */
  broadcastOrderStatusChanged(orderId, oldStatus, newStatus, sourceComponent) {
    this.broadcastEvent(this.EVENT_TYPES.ORDER_STATUS_CHANGED, {
      orderId,
      oldStatus,
      newStatus,
      timestamp: Date.now()
    }, {
      sourceComponent,
      crossTab: true
    });
  }
  
  /**
   * Broadcast order completed event
   */
  broadcastOrderCompleted(orderId, completionData, sourceComponent) {
    this.broadcastEvent(this.EVENT_TYPES.ORDER_COMPLETED, {
      orderId,
      completionData
    }, {
      sourceComponent,
      crossTab: true
    });
  }
  
  /**
   * Broadcast orders refreshed event
   */
  broadcastOrdersRefreshed(orders, sourceComponent) {
    this.broadcastEvent(this.EVENT_TYPES.ORDERS_REFRESHED, {
      orders,
      count: orders.length,
      timestamp: Date.now()
    }, {
      sourceComponent,
      crossTab: false // Don't cross-tab for bulk updates
    });
  }
  
  /**
   * Broadcast cache updated event
   */
  broadcastCacheUpdated(cacheStats, sourceComponent) {
    this.broadcastEvent(this.EVENT_TYPES.CACHE_UPDATED, {
      cacheStats,
      timestamp: Date.now()
    }, {
      sourceComponent,
      crossTab: false
    });
  }
  
  /**
   * Request sync from all components
   */
  requestSync(reason, sourceComponent) {
    this.broadcastEvent(this.EVENT_TYPES.SYNC_REQUESTED, {
      reason,
      timestamp: Date.now()
    }, {
      sourceComponent,
      crossTab: true
    });
  }
  
  /**
   * Get event history
   */
  getEventHistory(eventType = null, componentId = null) {
    let filteredHistory = this.eventHistory;
    
    if (eventType) {
      filteredHistory = filteredHistory.filter(event => event.type === eventType);
    }
    
    if (componentId) {
      filteredHistory = filteredHistory.filter(event => event.source === componentId);
    }
    
    return filteredHistory;
  }
  
  /**
   * Get system statistics
   */
  getStats() {
    const eventTypeCounts = {};
    this.eventHistory.forEach(event => {
      eventTypeCounts[event.type] = (eventTypeCounts[event.type] || 0) + 1;
    });
    
    return {
      totalEvents: this.eventHistory.length,
      eventTypeCounts,
      activeListeners: this.eventListeners.size,
      tabId: this.getTabId(),
      uptime: Date.now() - (this.startTime || Date.now())
    };
  }
  
  /**
   * Clear event history
   */
  clearHistory() {
    this.eventHistory = [];
    this.log('Event history cleared');
  }
  
  /**
   * Destroy communication system
   */
  destroy() {
    this.log('Destroying CrossComponentCommunication');
    
    // Remove all event listeners
    this.eventListeners.clear();
    
    // Clear history
    this.clearHistory();
    
    // Remove window event listeners
    Object.values(this.EVENT_TYPES).forEach(eventType => {
      window.removeEventListener(eventType, this.handleWindowEvent);
    });
    
    window.removeEventListener('storage', this.handleStorageEvent);
  }
}

// Create singleton instance
const crossComponentCommunication = new CrossComponentCommunication();

// Export both class and singleton
export { CrossComponentCommunication };
export default crossComponentCommunication;
/**
 * Enhanced Order Status Change Broadcasting System
 */

/**
 * Order Status Change Broadcaster
 * Specialized system for broadcasting order status changes with enhanced features
 */
class OrderStatusBroadcaster {
  constructor(communicationSystem) {
    this.comm = communicationSystem;
    this.statusChangeQueue = [];
    this.isProcessingQueue = false;
    this.statusChangeHistory = new Map(); // orderId -> status changes
    this.maxHistoryPerOrder = 10;
    
    // Status change event types
    this.STATUS_EVENTS = {
      PENDING_TO_PREPARING: 'status:pendingToPreparing',
      PREPARING_TO_READY: 'status:preparingToReady',
      READY_TO_COMPLETED: 'status:readyToCompleted',
      ANY_TO_CANCELLED: 'status:cancelled',
      PAYMENT_RECEIVED: 'status:paymentReceived',
      CREDIT_MARKED: 'status:creditMarked'
    };
    
    this.log('OrderStatusBroadcaster initialized');
  }
  
  log(message, data = null) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[StatusBroadcaster] ${message}`, data || '');
    }
  }
  
  /**
   * Broadcast order status change with enhanced metadata
   */
  broadcastStatusChange(orderId, statusChange, sourceComponent, options = {}) {
    const {
      immediate = true,
      includeOrderData = false,
      notifyKitchen = true,
      notifyBilling = true,
      crossTab = true
    } = options;
    
    const statusChangeEvent = {
      orderId,
      oldStatus: statusChange.from,
      newStatus: statusChange.to,
      timestamp: Date.now(),
      sourceComponent,
      metadata: {
        reason: statusChange.reason || 'manual',
        userId: statusChange.userId,
        duration: statusChange.duration,
        includeOrderData,
        notifyKitchen,
        notifyBilling
      }
    };
    
    this.log(`Broadcasting status change: ${orderId} ${statusChange.from} -> ${statusChange.to}`, statusChangeEvent);
    
    // Add to status change history
    this.addToStatusHistory(orderId, statusChangeEvent);
    
    if (immediate) {
      this.processStatusChange(statusChangeEvent, crossTab);
    } else {
      this.queueStatusChange(statusChangeEvent, crossTab);
    }
  }
  
  /**
   * Process status change immediately
   */
  processStatusChange(statusChangeEvent, crossTab = true) {
    const { orderId, oldStatus, newStatus, sourceComponent, metadata } = statusChangeEvent;
    
    // Determine specific status transition event
    const transitionEvent = this.getStatusTransitionEvent(oldStatus, newStatus);
    
    // Broadcast general status change
    this.comm.broadcastEvent(this.comm.EVENT_TYPES.ORDER_STATUS_CHANGED, {
      orderId,
      oldStatus,
      newStatus,
      transition: transitionEvent,
      metadata,
      timestamp: statusChangeEvent.timestamp
    }, {
      sourceComponent,
      crossTab
    });
    
    // Broadcast specific transition event if applicable
    if (transitionEvent) {
      this.comm.broadcastEvent(transitionEvent, {
        orderId,
        oldStatus,
        newStatus,
        metadata,
        timestamp: statusChangeEvent.timestamp
      }, {
        sourceComponent,
        crossTab
      });
    }
    
    // Component-specific notifications
    this.sendComponentSpecificNotifications(statusChangeEvent);
  }
  
  /**
   * Queue status change for batch processing
   */
  queueStatusChange(statusChangeEvent, crossTab = true) {
    this.statusChangeQueue.push({ statusChangeEvent, crossTab });
    
    if (!this.isProcessingQueue) {
      setTimeout(() => this.processStatusChangeQueue(), 100);
    }
  }
  
  /**
   * Process queued status changes
   */
  async processStatusChangeQueue() {
    if (this.isProcessingQueue || this.statusChangeQueue.length === 0) {
      return;
    }
    
    this.isProcessingQueue = true;
    
    try {
      while (this.statusChangeQueue.length > 0) {
        const { statusChangeEvent, crossTab } = this.statusChangeQueue.shift();
        this.processStatusChange(statusChangeEvent, crossTab);
        
        // Small delay between processing to prevent overwhelming
        if (this.statusChangeQueue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }
  
  /**
   * Get specific status transition event type
   */
  getStatusTransitionEvent(oldStatus, newStatus) {
    const transition = `${oldStatus}_to_${newStatus}`.toLowerCase();
    
    switch (transition) {
      case 'pending_to_preparing':
        return this.STATUS_EVENTS.PENDING_TO_PREPARING;
      case 'preparing_to_ready':
        return this.STATUS_EVENTS.PREPARING_TO_READY;
      case 'ready_to_completed':
        return this.STATUS_EVENTS.READY_TO_COMPLETED;
      default:
        if (newStatus.toLowerCase() === 'cancelled') {
          return this.STATUS_EVENTS.ANY_TO_CANCELLED;
        }
        return null;
    }
  }
  
  /**
   * Send component-specific notifications
   */
  sendComponentSpecificNotifications(statusChangeEvent) {
    const { orderId, newStatus, metadata } = statusChangeEvent;
    
    // Kitchen notifications
    if (metadata.notifyKitchen) {
      this.sendKitchenNotification(orderId, newStatus, statusChangeEvent);
    }
    
    // Billing notifications
    if (metadata.notifyBilling) {
      this.sendBillingNotification(orderId, newStatus, statusChangeEvent);
    }
    
    // Tables page notifications (for table status updates)
    this.sendTablesNotification(orderId, newStatus, statusChangeEvent);
  }
  
  /**
   * Send kitchen-specific notification
   */
  sendKitchenNotification(orderId, newStatus, statusChangeEvent) {
    const kitchenEvent = {
      type: 'kitchen:orderStatusChanged',
      orderId,
      newStatus,
      priority: this.getKitchenPriority(newStatus),
      timestamp: statusChangeEvent.timestamp,
      sourceComponent: statusChangeEvent.sourceComponent
    };
    
    this.comm.broadcastEvent('kitchen:orderStatusChanged', kitchenEvent, {
      sourceComponent: statusChangeEvent.sourceComponent,
      crossTab: true
    });
    
    this.log(`Kitchen notification sent for order ${orderId}: ${newStatus}`);
  }
  
  /**
   * Send billing-specific notification
   */
  sendBillingNotification(orderId, newStatus, statusChangeEvent) {
    const billingEvent = {
      type: 'billing:orderStatusChanged',
      orderId,
      newStatus,
      readyForBilling: ['ready', 'completed'].includes(newStatus.toLowerCase()),
      timestamp: statusChangeEvent.timestamp,
      sourceComponent: statusChangeEvent.sourceComponent
    };
    
    this.comm.broadcastEvent('billing:orderStatusChanged', billingEvent, {
      sourceComponent: statusChangeEvent.sourceComponent,
      crossTab: true
    });
    
    this.log(`Billing notification sent for order ${orderId}: ${newStatus}`);
  }
  
  /**
   * Send tables page notification
   */
  sendTablesNotification(orderId, newStatus, statusChangeEvent) {
    const tablesEvent = {
      type: 'tables:orderStatusChanged',
      orderId,
      newStatus,
      shouldUpdateTableStatus: true,
      timestamp: statusChangeEvent.timestamp,
      sourceComponent: statusChangeEvent.sourceComponent
    };
    
    this.comm.broadcastEvent('tables:orderStatusChanged', tablesEvent, {
      sourceComponent: statusChangeEvent.sourceComponent,
      crossTab: true
    });
    
    this.log(`Tables notification sent for order ${orderId}: ${newStatus}`);
  }
  
  /**
   * Get kitchen priority based on status
   */
  getKitchenPriority(status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'high'; // New orders need immediate attention
      case 'preparing':
        return 'normal';
      case 'ready':
        return 'low'; // Order is done, just waiting for pickup
      default:
        return 'normal';
    }
  }
  
  /**
   * Add status change to history
   */
  addToStatusHistory(orderId, statusChangeEvent) {
    if (!this.statusChangeHistory.has(orderId)) {
      this.statusChangeHistory.set(orderId, []);
    }
    
    const orderHistory = this.statusChangeHistory.get(orderId);
    orderHistory.push(statusChangeEvent);
    
    // Maintain history size limit
    if (orderHistory.length > this.maxHistoryPerOrder) {
      orderHistory.shift();
    }
  }
  
  /**
   * Get status change history for an order
   */
  getOrderStatusHistory(orderId) {
    return this.statusChangeHistory.get(orderId) || [];
  }
  
  /**
   * Get all status change statistics
   */
  getStatusChangeStats() {
    const stats = {
      totalOrders: this.statusChangeHistory.size,
      totalStatusChanges: 0,
      statusTransitions: {},
      averageChangesPerOrder: 0
    };
    
    this.statusChangeHistory.forEach((history, orderId) => {
      stats.totalStatusChanges += history.length;
      
      history.forEach(change => {
        const transition = `${change.oldStatus}_to_${change.newStatus}`;
        stats.statusTransitions[transition] = (stats.statusTransitions[transition] || 0) + 1;
      });
    });
    
    if (stats.totalOrders > 0) {
      stats.averageChangesPerOrder = stats.totalStatusChanges / stats.totalOrders;
    }
    
    return stats;
  }
  
  /**
   * Clear status change history
   */
  clearStatusHistory(orderId = null) {
    if (orderId) {
      this.statusChangeHistory.delete(orderId);
      this.log(`Status history cleared for order ${orderId}`);
    } else {
      this.statusChangeHistory.clear();
      this.log('All status history cleared');
    }
  }
}

// Add status broadcaster to the main communication system
crossComponentCommunication.statusBroadcaster = new OrderStatusBroadcaster(crossComponentCommunication);

// Export enhanced system
export { OrderStatusBroadcaster };
/**
 * Fallback Communication Methods
 * 
 * Provides alternative communication channels when primary methods fail
 */

/**
 * Fallback Communication System
 */
class FallbackCommunicationSystem {
  constructor(primaryComm) {
    this.primaryComm = primaryComm;
    this.fallbackMethods = new Map();
    this.failureCount = 0;
    this.lastFailure = null;
    this.isInFallbackMode = false;
    this.fallbackQueue = [];
    
    this.initializeFallbackMethods();
    this.log('FallbackCommunicationSystem initialized');
  }
  
  log(message, data = null) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[FallbackComm] ${message}`, data || '');
    }
  }
  
  /**
   * Initialize fallback communication methods
   */
  initializeFallbackMethods() {
    // Method 1: localStorage polling
    this.fallbackMethods.set('localStorage', {
      name: 'localStorage',
      priority: 1,
      available: this.isLocalStorageAvailable(),
      send: (eventType, data) => this.sendViaLocalStorage(eventType, data),
      receive: (callback) => this.receiveViaLocalStorage(callback)
    });
    
    // Method 2: sessionStorage polling
    this.fallbackMethods.set('sessionStorage', {
      name: 'sessionStorage',
      priority: 2,
      available: this.isSessionStorageAvailable(),
      send: (eventType, data) => this.sendViaSessionStorage(eventType, data),
      receive: (callback) => this.receiveViaSessionStorage(callback)
    });
    
    // Method 3: URL hash communication
    this.fallbackMethods.set('urlHash', {
      name: 'urlHash',
      priority: 3,
      available: true,
      send: (eventType, data) => this.sendViaUrlHash(eventType, data),
      receive: (callback) => this.receiveViaUrlHash(callback)
    });
    
    // Method 4: Polling-based state sync
    this.fallbackMethods.set('polling', {
      name: 'polling',
      priority: 4,
      available: true,
      send: (eventType, data) => this.sendViaPolling(eventType, data),
      receive: (callback) => this.receiveViaPolling(callback)
    });
    
    // Method 5: Direct function calls (same-tab only)
    this.fallbackMethods.set('direct', {
      name: 'direct',
      priority: 5,
      available: true,
      send: (eventType, data) => this.sendViaDirect(eventType, data),
      receive: (callback) => this.receiveViaDirect(callback)
    });
    
    this.log('Fallback methods initialized', {
      methods: Array.from(this.fallbackMethods.keys()),
      available: Array.from(this.fallbackMethods.values()).filter(m => m.available).length
    });
  }
  
  /**
   * Check if localStorage is available
   */
  isLocalStorageAvailable() {
    try {
      const test = '__fallback_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Check if sessionStorage is available
   */
  isSessionStorageAvailable() {
    try {
      const test = '__fallback_test__';
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Attempt to send via primary method, fallback on failure
   */
  async sendWithFallback(eventType, eventData, options = {}) {
    try {
      // Try primary method first
      this.primaryComm.broadcastEvent(eventType, eventData, options);
      
      // Reset failure count on success
      if (this.failureCount > 0) {
        this.log(`Primary communication restored after ${this.failureCount} failures`);
        this.failureCount = 0;
        this.isInFallbackMode = false;
      }
      
      return { success: true, method: 'primary' };
      
    } catch (error) {
      this.log('Primary communication failed, trying fallback', error);
      
      this.failureCount++;
      this.lastFailure = Date.now();
      this.isInFallbackMode = true;
      
      // Try fallback methods in priority order
      return this.tryFallbackMethods(eventType, eventData, options);
    }
  }
  
  /**
   * Try fallback methods in priority order
   */
  async tryFallbackMethods(eventType, eventData, options = {}) {
    const availableMethods = Array.from(this.fallbackMethods.values())
      .filter(method => method.available)
      .sort((a, b) => a.priority - b.priority);
    
    for (const method of availableMethods) {
      try {
        this.log(`Trying fallback method: ${method.name}`);
        
        await method.send(eventType, eventData);
        
        this.log(`Fallback success: ${method.name}`);
        return { success: true, method: method.name };
        
      } catch (error) {
        this.log(`Fallback method failed: ${method.name}`, error);
        continue;
      }
    }
    
    // All methods failed
    this.log('All communication methods failed', {
      eventType,
      failureCount: this.failureCount
    });
    
    // Queue for retry
    this.fallbackQueue.push({ eventType, eventData, options, timestamp: Date.now() });
    
    return { success: false, method: 'none' };
  }
  
  /**
   * localStorage fallback method
   */
  sendViaLocalStorage(eventType, eventData) {
    const key = `fallback_comm_${eventType}`;
    const data = {
      eventType,
      eventData,
      timestamp: Date.now(),
      method: 'localStorage'
    };
    
    localStorage.setItem(key, JSON.stringify(data));
    
    // Clean up after 30 seconds
    setTimeout(() => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        // Ignore cleanup errors
      }
    }, 30000);
  }
  
  receiveViaLocalStorage(callback) {
    const handleStorageChange = (event) => {
      if (event.key && event.key.startsWith('fallback_comm_')) {
        try {
          const data = JSON.parse(event.newValue);
          callback(data.eventType, data.eventData, 'localStorage');
        } catch (e) {
          this.log('localStorage fallback parse error', e);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => window.removeEventListener('storage', handleStorageChange);
  }
  
  /**
   * sessionStorage fallback method
   */
  sendViaSessionStorage(eventType, eventData) {
    const key = `fallback_session_${Date.now()}`;
    const data = {
      eventType,
      eventData,
      timestamp: Date.now(),
      method: 'sessionStorage'
    };
    
    sessionStorage.setItem(key, JSON.stringify(data));
  }
  
  receiveViaSessionStorage(callback) {
    // Poll sessionStorage for new events
    const pollInterval = setInterval(() => {
      try {
        const keys = Object.keys(sessionStorage);
        const fallbackKeys = keys.filter(key => key.startsWith('fallback_session_'));
        
        fallbackKeys.forEach(key => {
          try {
            const data = JSON.parse(sessionStorage.getItem(key));
            
            // Only process recent events (within 10 seconds)
            if (Date.now() - data.timestamp < 10000) {
              callback(data.eventType, data.eventData, 'sessionStorage');
            }
            
            // Clean up processed events
            sessionStorage.removeItem(key);
          } catch (e) {
            // Remove invalid entries
            sessionStorage.removeItem(key);
          }
        });
      } catch (e) {
        this.log('sessionStorage polling error', e);
      }
    }, 1000);
    
    return () => clearInterval(pollInterval);
  }
  
  /**
   * URL hash fallback method
   */
  sendViaUrlHash(eventType, eventData) {
    const hashData = {
      type: eventType,
      data: eventData,
      timestamp: Date.now()
    };
    
    const encodedData = btoa(JSON.stringify(hashData));
    window.location.hash = `#fallback_${encodedData}`;
    
    // Clear hash after short delay
    setTimeout(() => {
      if (window.location.hash.startsWith('#fallback_')) {
        window.location.hash = '';
      }
    }, 2000);
  }
  
  receiveViaUrlHash(callback) {
    const handleHashChange = () => {
      const hash = window.location.hash;
      
      if (hash.startsWith('#fallback_')) {
        try {
          const encodedData = hash.substring('#fallback_'.length);
          const data = JSON.parse(atob(encodedData));
          
          // Only process recent events
          if (Date.now() - data.timestamp < 5000) {
            callback(data.type, data.data, 'urlHash');
          }
        } catch (e) {
          this.log('URL hash fallback parse error', e);
        }
      }
    };
    
    window.addEventListener('hashchange', handleHashChange);
    
    return () => window.removeEventListener('hashchange', handleHashChange);
  }
  
  /**
   * Polling-based fallback method
   */
  sendViaPolling(eventType, eventData) {
    // Store in a global polling queue
    if (!window.__fallbackPollingQueue) {
      window.__fallbackPollingQueue = [];
    }
    
    window.__fallbackPollingQueue.push({
      eventType,
      eventData,
      timestamp: Date.now(),
      method: 'polling'
    });
    
    // Keep queue size manageable
    if (window.__fallbackPollingQueue.length > 50) {
      window.__fallbackPollingQueue.shift();
    }
  }
  
  receiveViaPolling(callback) {
    const pollInterval = setInterval(() => {
      if (window.__fallbackPollingQueue && window.__fallbackPollingQueue.length > 0) {
        const events = [...window.__fallbackPollingQueue];
        window.__fallbackPollingQueue = [];
        
        events.forEach(event => {
          // Only process recent events
          if (Date.now() - event.timestamp < 30000) {
            callback(event.eventType, event.eventData, 'polling');
          }
        });
      }
    }, 2000);
    
    return () => clearInterval(pollInterval);
  }
  
  /**
   * Direct function call fallback method
   */
  sendViaDirect(eventType, eventData) {
    // Store in global direct call queue
    if (!window.__fallbackDirectQueue) {
      window.__fallbackDirectQueue = [];
    }
    
    window.__fallbackDirectQueue.push({
      eventType,
      eventData,
      timestamp: Date.now(),
      method: 'direct'
    });
    
    // Trigger immediate processing
    this.processDirectQueue();
  }
  
  receiveViaDirect(callback) {
    // Register callback for direct processing
    if (!window.__fallbackDirectCallbacks) {
      window.__fallbackDirectCallbacks = new Set();
    }
    
    window.__fallbackDirectCallbacks.add(callback);
    
    return () => {
      if (window.__fallbackDirectCallbacks) {
        window.__fallbackDirectCallbacks.delete(callback);
      }
    };
  }
  
  processDirectQueue() {
    if (!window.__fallbackDirectQueue || !window.__fallbackDirectCallbacks) {
      return;
    }
    
    const events = [...window.__fallbackDirectQueue];
    window.__fallbackDirectQueue = [];
    
    events.forEach(event => {
      window.__fallbackDirectCallbacks.forEach(callback => {
        try {
          callback(event.eventType, event.eventData, 'direct');
        } catch (e) {
          this.log('Direct callback error', e);
        }
      });
    });
  }
  
  /**
   * Process queued events when communication is restored
   */
  processQueuedEvents() {
    if (this.fallbackQueue.length === 0) return;
    
    this.log(`Processing ${this.fallbackQueue.length} queued events`);
    
    const eventsToProcess = [...this.fallbackQueue];
    this.fallbackQueue = [];
    
    eventsToProcess.forEach(queuedEvent => {
      // Only process recent events (within 5 minutes)
      if (Date.now() - queuedEvent.timestamp < 5 * 60 * 1000) {
        this.sendWithFallback(
          queuedEvent.eventType,
          queuedEvent.eventData,
          queuedEvent.options
        );
      }
    });
  }
  
  /**
   * Get fallback system status
   */
  getStatus() {
    return {
      isInFallbackMode: this.isInFallbackMode,
      failureCount: this.failureCount,
      lastFailure: this.lastFailure,
      queuedEvents: this.fallbackQueue.length,
      availableMethods: Array.from(this.fallbackMethods.values())
        .filter(method => method.available)
        .map(method => method.name)
    };
  }
  
  /**
   * Test all fallback methods
   */
  async testFallbackMethods() {
    const results = {};
    
    for (const [name, method] of this.fallbackMethods) {
      if (!method.available) {
        results[name] = { available: false };
        continue;
      }
      
      try {
        const testData = { test: true, timestamp: Date.now() };
        await method.send('test_event', testData);
        results[name] = { available: true, success: true };
      } catch (error) {
        results[name] = { available: true, success: false, error: error.message };
      }
    }
    
    this.log('Fallback method test results', results);
    return results;
  }
}

// Add fallback system to main communication
crossComponentCommunication.fallbackSystem = new FallbackCommunicationSystem(crossComponentCommunication);

// Override broadcastEvent to use fallback system
const originalBroadcastEvent = crossComponentCommunication.broadcastEvent;
crossComponentCommunication.broadcastEvent = function(eventType, eventData, options = {}) {
  return this.fallbackSystem.sendWithFallback(eventType, eventData, options);
};

// Export fallback system
export { FallbackCommunicationSystem };