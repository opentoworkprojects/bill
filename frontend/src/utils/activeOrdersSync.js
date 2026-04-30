/**
 * Active Orders Sync - Instant notification system for active orders display
 * 
 * This utility provides immediate synchronization between order creation and
 * active orders display, bypassing polling delays to ensure orders appear
 * instantly in the UI.
 */

import performanceLogger from './performanceLogger';

class ActiveOrdersSync {
  constructor() {
    this.listeners = new Set();
    this.lastUpdate = 0;
    this.eventQueue = [];
    this.isProcessingQueue = false;
    this.debugMode = process.env.NODE_ENV === 'development';
    
    // Performance tracking
    this.metrics = {
      notificationsCount: 0,
      averageProcessingTime: 0,
      lastNotificationTime: 0,
      errorCount: 0
    };
    
    this.log('ActiveOrdersSync initialized');
  }
  
  /**
   * Log debug messages in development mode
   */
  log(message, data = null) {
    if (this.debugMode) {
      const timestamp = new Date().toISOString();
      console.log(`[ActiveOrdersSync ${timestamp}] ${message}`, data || '');
    }
  }
  
  /**
   * Add event listener for active orders updates
   * @param {Function} listener - Callback function to handle updates
   * @returns {Function} - Cleanup function to remove listener
   */
  addEventListener(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Listener must be a function');
    }
    
    this.listeners.add(listener);
    this.log(`Event listener added. Total listeners: ${this.listeners.size}`);
    
    // Return cleanup function
    return () => this.removeEventListener(listener);
  }
  
  /**
   * Remove event listener
   * @param {Function} listener - Listener function to remove
   */
  removeEventListener(listener) {
    const removed = this.listeners.delete(listener);
    if (removed) {
      this.log(`Event listener removed. Total listeners: ${this.listeners.size}`);
    }
    return removed;
  }
  
  /**
   * Notify all listeners of a new order - INSTANT UPDATE
   * @param {Object} order - New order object
   */
  notifyNewOrder(order) {
    if (!order || !order.id) {
      this.log('Invalid order provided to notifyNewOrder', order);
      performanceLogger.warn('SYNC', 'Invalid order provided to notifyNewOrder', { order });
      return;
    }
    
    const startTime = Date.now();
    this.log(`Notifying new order: ${order.id}`, { 
      status: order.status, 
      total: order.total,
      customer: order.customer_name 
    });
    
    // Log sync operation
    performanceLogger.logSyncOperation('new-order-notification', {
      orderId: order.id,
      status: order.status,
      total: order.total,
      listenersCount: this.listeners.size
    });
    
    // Create notification event
    const event = {
      type: 'new-order',
      order,
      timestamp: startTime,
      source: 'order-creation'
    };
    
    // Add to queue for processing
    this.eventQueue.push(event);
    
    // Process queue immediately (non-blocking)
    this.processEventQueue();
    
    // Update metrics
    this.metrics.notificationsCount++;
    this.metrics.lastNotificationTime = startTime;
    
    // Broadcast to window for cross-component communication
    this.broadcastWindowEvent('activeOrderAdded', { order });
  }
  
  /**
   * Broadcast general active orders update
   * @param {Array} orders - Array of active orders
   * @param {string} source - Source of the update
   */
  broadcastUpdate(orders, source = 'unknown') {
    if (!Array.isArray(orders)) {
      this.log('Invalid orders array provided to broadcastUpdate', orders);
      return;
    }
    
    const startTime = Date.now();
    this.log(`Broadcasting update from ${source}`, { count: orders.length });
    
    // Create update event
    const event = {
      type: 'orders-update',
      orders,
      timestamp: startTime,
      source
    };
    
    // Add to queue for processing
    this.eventQueue.push(event);
    
    // Process queue immediately
    this.processEventQueue();
    
    // Broadcast to window
    this.broadcastWindowEvent('activeOrdersUpdated', { orders, source });
  }
  
  /**
   * Trigger immediate refresh of active orders display
   * @param {string} reason - Reason for the refresh
   */
  triggerImmediateRefresh(reason = 'manual') {
    this.log(`Triggering immediate refresh: ${reason}`);
    
    const event = {
      type: 'immediate-refresh',
      timestamp: Date.now(),
      reason
    };
    
    // Add to queue and process
    this.eventQueue.push(event);
    this.processEventQueue();
    
    // Broadcast refresh event
    this.broadcastWindowEvent('activeOrdersRefreshRequested', { reason });
  }
  
  /**
   * Process event queue with error handling and debouncing
   */
  async processEventQueue() {
    // Prevent concurrent processing
    if (this.isProcessingQueue || this.eventQueue.length === 0) {
      return;
    }
    
    this.isProcessingQueue = true;
    
    try {
      // Process all queued events
      const eventsToProcess = [...this.eventQueue];
      this.eventQueue = [];
      
      this.log(`Processing ${eventsToProcess.length} queued events`);
      
      // Group events by type for efficient processing
      const eventGroups = this.groupEventsByType(eventsToProcess);
      
      // Process each group
      for (const [eventType, events] of Object.entries(eventGroups)) {
        await this.processEventGroup(eventType, events);
      }
      
    } catch (error) {
      this.log('Error processing event queue', error);
      this.metrics.errorCount++;
    } finally {
      this.isProcessingQueue = false;
      
      // Process any new events that arrived during processing
      if (this.eventQueue.length > 0) {
        setTimeout(() => this.processEventQueue(), 10);
      }
    }
  }
  
  /**
   * Group events by type for efficient batch processing
   * @param {Array} events - Array of events to group
   * @returns {Object} - Events grouped by type
   */
  groupEventsByType(events) {
    return events.reduce((groups, event) => {
      if (!groups[event.type]) {
        groups[event.type] = [];
      }
      groups[event.type].push(event);
      return groups;
    }, {});
  }
  
  /**
   * Process a group of events of the same type
   * @param {string} eventType - Type of events to process
   * @param {Array} events - Array of events
   */
  async processEventGroup(eventType, events) {
    const startTime = Date.now();
    
    try {
      // Notify all listeners for each event
      for (const event of events) {
        await this.notifyListeners(event);
      }
      
      // Update performance metrics
      const processingTime = Date.now() - startTime;
      this.updatePerformanceMetrics(processingTime);
      
      this.log(`Processed ${events.length} ${eventType} events in ${processingTime}ms`);
      
    } catch (error) {
      this.log(`Error processing ${eventType} events`, error);
      this.metrics.errorCount++;
    }
  }
  
  /**
   * Notify all listeners of an event with error handling
   * @param {Object} event - Event to broadcast
   */
  async notifyListeners(event) {
    const failedListeners = [];
    
    // Notify each listener with error isolation
    for (const listener of this.listeners) {
      try {
        // Call listener with event data
        await listener(event);
      } catch (error) {
        this.log(`Listener error for ${event.type}`, error);
        failedListeners.push(listener);
      }
    }
    
    // Remove failed listeners to prevent future errors
    failedListeners.forEach(listener => {
      this.listeners.delete(listener);
      this.log('Removed failed listener');
    });
  }
  
  /**
   * Broadcast event to window for cross-component communication
   * @param {string} eventName - Name of the window event
   * @param {Object} detail - Event detail data
   */
  broadcastWindowEvent(eventName, detail) {
    try {
      const customEvent = new CustomEvent(eventName, { detail });
      window.dispatchEvent(customEvent);
      this.log(`Window event broadcasted: ${eventName}`, detail);
    } catch (error) {
      this.log(`Failed to broadcast window event: ${eventName}`, error);
    }
  }
  
  /**
   * Update performance metrics
   * @param {number} processingTime - Time taken to process events
   */
  updatePerformanceMetrics(processingTime) {
    const { notificationsCount, averageProcessingTime } = this.metrics;
    
    // Calculate rolling average
    this.metrics.averageProcessingTime = 
      (averageProcessingTime * (notificationsCount - 1) + processingTime) / notificationsCount;
  }
  
  /**
   * Get current performance metrics
   * @returns {Object} - Performance metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      listenersCount: this.listeners.size,
      queueLength: this.eventQueue.length,
      isProcessing: this.isProcessingQueue
    };
  }
  
  /**
   * Reset all metrics (useful for testing)
   */
  resetMetrics() {
    this.metrics = {
      notificationsCount: 0,
      averageProcessingTime: 0,
      lastNotificationTime: 0,
      errorCount: 0
    };
    this.log('Metrics reset');
  }
  
  /**
   * Clear all listeners and reset state
   */
  destroy() {
    this.log('Destroying ActiveOrdersSync');
    this.listeners.clear();
    this.eventQueue = [];
    this.isProcessingQueue = false;
    this.resetMetrics();
  }
  
  /**
   * Check if the sync system is healthy
   * @returns {boolean} - True if system is healthy
   */
  isHealthy() {
    const metrics = this.getMetrics();
    
    // System is unhealthy if:
    // - Too many errors (>10% of notifications)
    // - Average processing time too high (>100ms)
    // - Queue is backing up (>50 events)
    
    const errorRate = metrics.notificationsCount > 0 ? 
      metrics.errorCount / metrics.notificationsCount : 0;
    
    const isHealthy = 
      errorRate < 0.1 && 
      metrics.averageProcessingTime < 100 && 
      metrics.queueLength < 50;
    
    if (!isHealthy) {
      this.log('System health check failed', metrics);
    }
    
    return isHealthy;
  }
}

// Create singleton instance
const activeOrdersSync = new ActiveOrdersSync();

// Export both the class and singleton
export { ActiveOrdersSync };
export default activeOrdersSync;