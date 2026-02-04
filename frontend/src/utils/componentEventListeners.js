/**
 * Component Event Listeners for Kitchen and Billing Pages
 * 
 * This utility provides specialized event listeners for different components
 * to handle active orders updates and maintain synchronization across the app.
 */

import crossComponentCommunication from './crossComponentCommunication';
import activeOrdersCache from './activeOrdersCache';

/**
 * Kitchen Page Event Listeners
 */
export class KitchenPageEventListeners {
  constructor() {
    this.componentId = crossComponentCommunication.COMPONENTS.KITCHEN_PAGE;
    this.listeners = [];
    this.isActive = false;
    this.orderUpdateCallbacks = new Set();
    
    this.log('KitchenPageEventListeners initialized');
  }
  
  log(message, data = null) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[KitchenListeners] ${message}`, data || '');
    }
  }
  
  /**
   * Activate kitchen page listeners
   */
  activate() {
    if (this.isActive) return;
    
    this.log('Activating kitchen page event listeners');
    
    // Listen for new orders
    this.listeners.push(
      crossComponentCommunication.addEventListener(
        this.componentId,
        crossComponentCommunication.EVENT_TYPES.ORDER_CREATED,
        (eventData) => this.handleOrderCreated(eventData)
      )
    );
    
    // Listen for order status changes
    this.listeners.push(
      crossComponentCommunication.addEventListener(
        this.componentId,
        crossComponentCommunication.EVENT_TYPES.ORDER_STATUS_CHANGED,
        (eventData) => this.handleOrderStatusChanged(eventData)
      )
    );
    
    // Listen for kitchen-specific events
    this.listeners.push(
      crossComponentCommunication.addEventListener(
        this.componentId,
        'kitchen:orderStatusChanged',
        (eventData) => this.handleKitchenOrderUpdate(eventData)
      )
    );
    
    // Listen for orders refresh
    this.listeners.push(
      crossComponentCommunication.addEventListener(
        this.componentId,
        crossComponentCommunication.EVENT_TYPES.ORDERS_REFRESHED,
        (eventData) => this.handleOrdersRefreshed(eventData)
      )
    );
    
    // Listen for sync requests
    this.listeners.push(
      crossComponentCommunication.addEventListener(
        this.componentId,
        crossComponentCommunication.EVENT_TYPES.SYNC_REQUESTED,
        (eventData) => this.handleSyncRequested(eventData)
      )
    );
    
    this.isActive = true;
    this.log('Kitchen page listeners activated');
  }
  
  /**
   * Deactivate kitchen page listeners
   */
  deactivate() {
    if (!this.isActive) return;
    
    this.log('Deactivating kitchen page event listeners');
    
    // Remove all listeners
    this.listeners.forEach(cleanup => cleanup());
    this.listeners = [];
    
    this.isActive = false;
    this.log('Kitchen page listeners deactivated');
  }
  
  /**
   * Register callback for order updates
   */
  onOrderUpdate(callback) {
    this.orderUpdateCallbacks.add(callback);
    return () => this.orderUpdateCallbacks.delete(callback);
  }
  
  /**
   * Handle new order created
   */
  handleOrderCreated(eventData) {
    const { order } = eventData;
    
    this.log(`New order received: ${order.id}`, {
      status: order.status,
      items: order.items?.length || 0
    });
    
    // Only show orders that need kitchen attention
    if (this.shouldShowInKitchen(order)) {
      this.notifyOrderUpdate({
        type: 'order_created',
        order,
        priority: 'high'
      });
      
      // Show notification for new order
      this.showKitchenNotification(`New Order #${order.id}`, {
        body: `${order.items?.length || 0} items - Table ${order.table_number || 'Counter'}`,
        priority: 'high',
        sound: true
      });
    }
  }
  
  /**
   * Handle order status change
   */
  handleOrderStatusChanged(eventData) {
    const { orderId, oldStatus, newStatus } = eventData;
    
    this.log(`Order status changed: ${orderId} ${oldStatus} -> ${newStatus}`);
    
    // Update kitchen display based on status change
    this.notifyOrderUpdate({
      type: 'status_changed',
      orderId,
      oldStatus,
      newStatus,
      priority: this.getKitchenPriority(newStatus)
    });
    
    // Show notification for important status changes
    if (newStatus === 'ready') {
      this.showKitchenNotification(`Order #${orderId} Ready!`, {
        body: 'Order is ready for pickup',
        priority: 'normal',
        sound: true
      });
    }
  }
  
  /**
   * Handle kitchen-specific order updates
   */
  handleKitchenOrderUpdate(eventData) {
    const { orderId, newStatus, priority } = eventData;
    
    this.log(`Kitchen-specific update: ${orderId} -> ${newStatus} (${priority})`);
    
    this.notifyOrderUpdate({
      type: 'kitchen_update',
      orderId,
      newStatus,
      priority
    });
  }
  
  /**
   * Handle orders refreshed
   */
  handleOrdersRefreshed(eventData) {
    const { orders, count } = eventData;
    
    this.log(`Orders refreshed: ${count} total orders`);
    
    // Filter orders for kitchen display
    const kitchenOrders = orders.filter(order => this.shouldShowInKitchen(order));
    
    this.notifyOrderUpdate({
      type: 'orders_refreshed',
      orders: kitchenOrders,
      count: kitchenOrders.length
    });
  }
  
  /**
   * Handle sync request
   */
  handleSyncRequested(eventData) {
    const { reason } = eventData;
    
    this.log(`Sync requested: ${reason}`);
    
    this.notifyOrderUpdate({
      type: 'sync_requested',
      reason
    });
  }
  
  /**
   * Check if order should be shown in kitchen
   */
  shouldShowInKitchen(order) {
    if (!order) return false;
    
    const status = order.status?.toLowerCase();
    
    // Show orders that need kitchen attention
    return ['pending', 'preparing'].includes(status);
  }
  
  /**
   * Get kitchen priority for status
   */
  getKitchenPriority(status) {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'high';
      case 'preparing':
        return 'normal';
      case 'ready':
        return 'low';
      default:
        return 'normal';
    }
  }
  
  /**
   * Notify order update to registered callbacks
   */
  notifyOrderUpdate(updateData) {
    this.orderUpdateCallbacks.forEach(callback => {
      try {
        callback(updateData);
      } catch (error) {
        this.log('Order update callback error', error);
      }
    });
  }
  
  /**
   * Show kitchen notification
   */
  showKitchenNotification(title, options = {}) {
    const { body, priority = 'normal', sound = false } = options;
    
    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/icon-192.png',
        tag: `kitchen-${Date.now()}`,
        requireInteraction: priority === 'high'
      });
    }
    
    // Sound notification
    if (sound) {
      this.playKitchenSound(priority);
    }
    
    this.log(`Kitchen notification: ${title}`, { body, priority });
  }
  
  /**
   * Play kitchen sound
   */
  playKitchenSound(priority) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      if (priority === 'high') {
        // Urgent sound for new orders
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } else {
        // Normal sound for status updates
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
      }
    } catch (error) {
      this.log('Kitchen sound failed', error);
    }
  }
}

/**
 * Billing Page Event Listeners
 */
export class BillingPageEventListeners {
  constructor() {
    this.componentId = crossComponentCommunication.COMPONENTS.BILLING_PAGE;
    this.listeners = [];
    this.isActive = false;
    this.orderUpdateCallbacks = new Set();
    
    this.log('BillingPageEventListeners initialized');
  }
  
  log(message, data = null) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[BillingListeners] ${message}`, data || '');
    }
  }
  
  /**
   * Activate billing page listeners
   */
  activate() {
    if (this.isActive) return;
    
    this.log('Activating billing page event listeners');
    
    // Listen for order status changes
    this.listeners.push(
      crossComponentCommunication.addEventListener(
        this.componentId,
        crossComponentCommunication.EVENT_TYPES.ORDER_STATUS_CHANGED,
        (eventData) => this.handleOrderStatusChanged(eventData)
      )
    );
    
    // Listen for billing-specific events
    this.listeners.push(
      crossComponentCommunication.addEventListener(
        this.componentId,
        'billing:orderStatusChanged',
        (eventData) => this.handleBillingOrderUpdate(eventData)
      )
    );
    
    // Listen for order completion
    this.listeners.push(
      crossComponentCommunication.addEventListener(
        this.componentId,
        crossComponentCommunication.EVENT_TYPES.ORDER_COMPLETED,
        (eventData) => this.handleOrderCompleted(eventData)
      )
    );
    
    // Listen for cache updates
    this.listeners.push(
      crossComponentCommunication.addEventListener(
        this.componentId,
        crossComponentCommunication.EVENT_TYPES.CACHE_UPDATED,
        (eventData) => this.handleCacheUpdated(eventData)
      )
    );
    
    this.isActive = true;
    this.log('Billing page listeners activated');
  }
  
  /**
   * Deactivate billing page listeners
   */
  deactivate() {
    if (!this.isActive) return;
    
    this.log('Deactivating billing page event listeners');
    
    // Remove all listeners
    this.listeners.forEach(cleanup => cleanup());
    this.listeners = [];
    
    this.isActive = false;
    this.log('Billing page listeners deactivated');
  }
  
  /**
   * Register callback for order updates
   */
  onOrderUpdate(callback) {
    this.orderUpdateCallbacks.add(callback);
    return () => this.orderUpdateCallbacks.delete(callback);
  }
  
  /**
   * Handle order status change
   */
  handleOrderStatusChanged(eventData) {
    const { orderId, oldStatus, newStatus } = eventData;
    
    this.log(`Order status changed: ${orderId} ${oldStatus} -> ${newStatus}`);
    
    // Update billing display based on status change
    if (this.shouldShowInBilling(newStatus)) {
      this.notifyOrderUpdate({
        type: 'status_changed',
        orderId,
        oldStatus,
        newStatus,
        readyForBilling: ['ready', 'completed'].includes(newStatus.toLowerCase())
      });
      
      // Show notification for orders ready for billing
      if (newStatus.toLowerCase() === 'ready') {
        this.showBillingNotification(`Order #${orderId} Ready for Billing`, {
          body: 'Order is ready to be billed',
          priority: 'normal'
        });
      }
    }
  }
  
  /**
   * Handle billing-specific order updates
   */
  handleBillingOrderUpdate(eventData) {
    const { orderId, newStatus, readyForBilling } = eventData;
    
    this.log(`Billing-specific update: ${orderId} -> ${newStatus} (ready: ${readyForBilling})`);
    
    this.notifyOrderUpdate({
      type: 'billing_update',
      orderId,
      newStatus,
      readyForBilling
    });
  }
  
  /**
   * Handle order completion
   */
  handleOrderCompleted(eventData) {
    const { orderId, completionData } = eventData;
    
    this.log(`Order completed: ${orderId}`, completionData);
    
    this.notifyOrderUpdate({
      type: 'order_completed',
      orderId,
      completionData
    });
  }
  
  /**
   * Handle cache updates
   */
  handleCacheUpdated(eventData) {
    const { cacheStats } = eventData;
    
    this.log('Cache updated', cacheStats);
    
    this.notifyOrderUpdate({
      type: 'cache_updated',
      cacheStats
    });
  }
  
  /**
   * Check if order should be shown in billing
   */
  shouldShowInBilling(status) {
    if (!status) return false;
    
    const normalizedStatus = status.toLowerCase();
    
    // Show orders that are ready for billing or completed
    return ['ready', 'completed', 'paid'].includes(normalizedStatus);
  }
  
  /**
   * Notify order update to registered callbacks
   */
  notifyOrderUpdate(updateData) {
    this.orderUpdateCallbacks.forEach(callback => {
      try {
        callback(updateData);
      } catch (error) {
        this.log('Order update callback error', error);
      }
    });
  }
  
  /**
   * Show billing notification
   */
  showBillingNotification(title, options = {}) {
    const { body, priority = 'normal' } = options;
    
    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/icon-192.png',
        tag: `billing-${Date.now()}`,
        requireInteraction: priority === 'high'
      });
    }
    
    this.log(`Billing notification: ${title}`, { body, priority });
  }
}

/**
 * Tables Page Event Listeners
 */
export class TablesPageEventListeners {
  constructor() {
    this.componentId = crossComponentCommunication.COMPONENTS.TABLES_PAGE;
    this.listeners = [];
    this.isActive = false;
    this.tableUpdateCallbacks = new Set();
    
    this.log('TablesPageEventListeners initialized');
  }
  
  log(message, data = null) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[TablesListeners] ${message}`, data || '');
    }
  }
  
  /**
   * Activate tables page listeners
   */
  activate() {
    if (this.isActive) return;
    
    this.log('Activating tables page event listeners');
    
    // Listen for order creation (affects table status)
    this.listeners.push(
      crossComponentCommunication.addEventListener(
        this.componentId,
        crossComponentCommunication.EVENT_TYPES.ORDER_CREATED,
        (eventData) => this.handleOrderCreated(eventData)
      )
    );
    
    // Listen for order completion (affects table status)
    this.listeners.push(
      crossComponentCommunication.addEventListener(
        this.componentId,
        crossComponentCommunication.EVENT_TYPES.ORDER_COMPLETED,
        (eventData) => this.handleOrderCompleted(eventData)
      )
    );
    
    // Listen for tables-specific events
    this.listeners.push(
      crossComponentCommunication.addEventListener(
        this.componentId,
        'tables:orderStatusChanged',
        (eventData) => this.handleTableOrderUpdate(eventData)
      )
    );
    
    this.isActive = true;
    this.log('Tables page listeners activated');
  }
  
  /**
   * Deactivate tables page listeners
   */
  deactivate() {
    if (!this.isActive) return;
    
    this.log('Deactivating tables page event listeners');
    
    // Remove all listeners
    this.listeners.forEach(cleanup => cleanup());
    this.listeners = [];
    
    this.isActive = false;
    this.log('Tables page listeners deactivated');
  }
  
  /**
   * Register callback for table updates
   */
  onTableUpdate(callback) {
    this.tableUpdateCallbacks.add(callback);
    return () => this.tableUpdateCallbacks.delete(callback);
  }
  
  /**
   * Handle order created (table becomes occupied)
   */
  handleOrderCreated(eventData) {
    const { order } = eventData;
    
    if (order.table_id) {
      this.log(`Table occupied: ${order.table_number} by order ${order.id}`);
      
      this.notifyTableUpdate({
        type: 'table_occupied',
        tableId: order.table_id,
        tableNumber: order.table_number,
        orderId: order.id
      });
    }
  }
  
  /**
   * Handle order completed (table becomes available)
   */
  handleOrderCompleted(eventData) {
    const { orderId, completionData } = eventData;
    
    if (completionData?.table_id) {
      this.log(`Table available: ${completionData.table_number} from order ${orderId}`);
      
      this.notifyTableUpdate({
        type: 'table_available',
        tableId: completionData.table_id,
        tableNumber: completionData.table_number,
        orderId
      });
    }
  }
  
  /**
   * Handle table-specific order updates
   */
  handleTableOrderUpdate(eventData) {
    const { orderId, newStatus, shouldUpdateTableStatus } = eventData;
    
    if (shouldUpdateTableStatus) {
      this.log(`Table status update needed for order ${orderId}: ${newStatus}`);
      
      this.notifyTableUpdate({
        type: 'table_status_update',
        orderId,
        newStatus
      });
    }
  }
  
  /**
   * Notify table update to registered callbacks
   */
  notifyTableUpdate(updateData) {
    this.tableUpdateCallbacks.forEach(callback => {
      try {
        callback(updateData);
      } catch (error) {
        this.log('Table update callback error', error);
      }
    });
  }
}

// Create singleton instances
export const kitchenPageListeners = new KitchenPageEventListeners();
export const billingPageListeners = new BillingPageEventListeners();
export const tablesPageListeners = new TablesPageEventListeners();
/**
 * Event Listener Cleanup and Management System
 */

/**
 * Event Listener Manager
 * Centralized system for managing event listener lifecycle and cleanup
 */
export class EventListenerManager {
  constructor() {
    this.activeListeners = new Map(); // componentId -> Set of cleanup functions
    this.listenerStats = new Map(); // componentId -> stats
    this.cleanupScheduled = false;
    this.cleanupInterval = null;
    
    this.log('EventListenerManager initialized');
    this.initializeCleanupSystem();
  }
  
  log(message, data = null) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[EventListenerManager] ${message}`, data || '');
    }
  }
  
  /**
   * Initialize automatic cleanup system
   */
  initializeCleanupSystem() {
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      this.cleanupAllListeners();
    });
    
    // Cleanup on visibility change (when tab becomes hidden)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.scheduleCleanup();
      }
    });
    
    // Periodic cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.performPeriodicCleanup();
    }, 5 * 60 * 1000);
    
    this.log('Cleanup system initialized');
  }
  
  /**
   * Register component listeners
   */
  registerComponent(componentId, listeners = []) {
    if (!this.activeListeners.has(componentId)) {
      this.activeListeners.set(componentId, new Set());
      this.listenerStats.set(componentId, {
        registered: 0,
        cleaned: 0,
        lastActivity: Date.now()
      });
    }
    
    const componentListeners = this.activeListeners.get(componentId);
    const stats = this.listenerStats.get(componentId);
    
    // Add listeners to component set
    listeners.forEach(cleanup => {
      if (typeof cleanup === 'function') {
        componentListeners.add(cleanup);
        stats.registered++;
      }
    });
    
    stats.lastActivity = Date.now();
    
    this.log(`Registered ${listeners.length} listeners for ${componentId}`, {
      total: componentListeners.size,
      stats
    });
    
    // Return cleanup function for the entire component
    return () => this.cleanupComponent(componentId);
  }
  
  /**
   * Add single listener to component
   */
  addListener(componentId, cleanupFunction) {
    if (typeof cleanupFunction !== 'function') {
      throw new Error('Cleanup function must be a function');
    }
    
    if (!this.activeListeners.has(componentId)) {
      this.registerComponent(componentId, []);
    }
    
    const componentListeners = this.activeListeners.get(componentId);
    const stats = this.listenerStats.get(componentId);
    
    componentListeners.add(cleanupFunction);
    stats.registered++;
    stats.lastActivity = Date.now();
    
    this.log(`Added listener to ${componentId}`, {
      total: componentListeners.size
    });
    
    // Return cleanup function for this specific listener
    return () => this.removeListener(componentId, cleanupFunction);
  }
  
  /**
   * Remove single listener from component
   */
  removeListener(componentId, cleanupFunction) {
    if (!this.activeListeners.has(componentId)) {
      return false;
    }
    
    const componentListeners = this.activeListeners.get(componentId);
    const stats = this.listenerStats.get(componentId);
    
    if (componentListeners.has(cleanupFunction)) {
      // Execute cleanup
      try {
        cleanupFunction();
        stats.cleaned++;
      } catch (error) {
        this.log(`Cleanup error for ${componentId}`, error);
      }
      
      // Remove from set
      const removed = componentListeners.delete(cleanupFunction);
      stats.lastActivity = Date.now();
      
      this.log(`Removed listener from ${componentId}`, {
        remaining: componentListeners.size
      });
      
      return removed;
    }
    
    return false;
  }
  
  /**
   * Cleanup all listeners for a component
   */
  cleanupComponent(componentId) {
    if (!this.activeListeners.has(componentId)) {
      return 0;
    }
    
    const componentListeners = this.activeListeners.get(componentId);
    const stats = this.listenerStats.get(componentId);
    let cleanedCount = 0;
    
    this.log(`Cleaning up component: ${componentId}`, {
      listeners: componentListeners.size
    });
    
    // Execute all cleanup functions
    componentListeners.forEach(cleanup => {
      try {
        cleanup();
        cleanedCount++;
        stats.cleaned++;
      } catch (error) {
        this.log(`Cleanup error for ${componentId}`, error);
      }
    });
    
    // Clear the component's listeners
    componentListeners.clear();
    stats.lastActivity = Date.now();
    
    this.log(`Cleaned up ${cleanedCount} listeners for ${componentId}`);
    
    return cleanedCount;
  }
  
  /**
   * Cleanup all listeners for all components
   */
  cleanupAllListeners() {
    let totalCleaned = 0;
    
    this.log('Cleaning up all event listeners');
    
    this.activeListeners.forEach((listeners, componentId) => {
      const cleaned = this.cleanupComponent(componentId);
      totalCleaned += cleaned;
    });
    
    // Clear all data
    this.activeListeners.clear();
    this.listenerStats.clear();
    
    this.log(`Cleaned up ${totalCleaned} total listeners`);
    
    return totalCleaned;
  }
  
  /**
   * Schedule cleanup for inactive components
   */
  scheduleCleanup() {
    if (this.cleanupScheduled) return;
    
    this.cleanupScheduled = true;
    
    // Cleanup after 30 seconds of inactivity
    setTimeout(() => {
      this.performScheduledCleanup();
      this.cleanupScheduled = false;
    }, 30000);
    
    this.log('Cleanup scheduled for inactive components');
  }
  
  /**
   * Perform scheduled cleanup
   */
  performScheduledCleanup() {
    const now = Date.now();
    const inactivityThreshold = 10 * 60 * 1000; // 10 minutes
    const componentsToCleanup = [];
    
    // Find inactive components
    this.listenerStats.forEach((stats, componentId) => {
      const inactiveTime = now - stats.lastActivity;
      
      if (inactiveTime > inactivityThreshold) {
        componentsToCleanup.push(componentId);
      }
    });
    
    // Cleanup inactive components
    if (componentsToCleanup.length > 0) {
      this.log(`Cleaning up ${componentsToCleanup.length} inactive components`, componentsToCleanup);
      
      componentsToCleanup.forEach(componentId => {
        this.cleanupComponent(componentId);
      });
    }
  }
  
  /**
   * Perform periodic cleanup
   */
  performPeriodicCleanup() {
    this.log('Performing periodic cleanup');
    
    // Clean up components that haven't been active for a long time
    this.performScheduledCleanup();
    
    // Log statistics
    this.logCleanupStats();
  }
  
  /**
   * Log cleanup statistics
   */
  logCleanupStats() {
    const stats = {
      activeComponents: this.activeListeners.size,
      totalListeners: 0,
      componentStats: {}
    };
    
    this.activeListeners.forEach((listeners, componentId) => {
      const componentStats = this.listenerStats.get(componentId);
      stats.totalListeners += listeners.size;
      stats.componentStats[componentId] = {
        active: listeners.size,
        ...componentStats
      };
    });
    
    this.log('Cleanup statistics', stats);
  }
  
  /**
   * Get current listener statistics
   */
  getStats() {
    const stats = {
      activeComponents: this.activeListeners.size,
      totalActiveListeners: 0,
      components: {}
    };
    
    this.activeListeners.forEach((listeners, componentId) => {
      const componentStats = this.listenerStats.get(componentId);
      stats.totalActiveListeners += listeners.size;
      stats.components[componentId] = {
        activeListeners: listeners.size,
        totalRegistered: componentStats.registered,
        totalCleaned: componentStats.cleaned,
        lastActivity: componentStats.lastActivity,
        inactiveTime: Date.now() - componentStats.lastActivity
      };
    });
    
    return stats;
  }
  
  /**
   * Force cleanup of specific component
   */
  forceCleanup(componentId) {
    this.log(`Force cleanup requested for: ${componentId}`);
    return this.cleanupComponent(componentId);
  }
  
  /**
   * Check if component has active listeners
   */
  hasActiveListeners(componentId) {
    const listeners = this.activeListeners.get(componentId);
    return listeners && listeners.size > 0;
  }
  
  /**
   * Destroy the entire cleanup system
   */
  destroy() {
    this.log('Destroying EventListenerManager');
    
    // Cleanup all listeners
    this.cleanupAllListeners();
    
    // Clear cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    // Remove window event listeners
    window.removeEventListener('beforeunload', this.cleanupAllListeners);
    document.removeEventListener('visibilitychange', this.scheduleCleanup);
  }
}

// Create singleton instance
export const eventListenerManager = new EventListenerManager();

/**
 * Enhanced component listeners with automatic cleanup
 */

// Enhance existing component listeners with cleanup management
const originalKitchenActivate = kitchenPageListeners.activate;
kitchenPageListeners.activate = function() {
  originalKitchenActivate.call(this);
  
  // Register with cleanup manager
  this.cleanupManager = eventListenerManager.registerComponent(
    this.componentId,
    this.listeners
  );
};

const originalKitchenDeactivate = kitchenPageListeners.deactivate;
kitchenPageListeners.deactivate = function() {
  // Use cleanup manager
  if (this.cleanupManager) {
    this.cleanupManager();
    this.cleanupManager = null;
  }
  
  originalKitchenDeactivate.call(this);
};

// Enhance billing listeners
const originalBillingActivate = billingPageListeners.activate;
billingPageListeners.activate = function() {
  originalBillingActivate.call(this);
  
  // Register with cleanup manager
  this.cleanupManager = eventListenerManager.registerComponent(
    this.componentId,
    this.listeners
  );
};

const originalBillingDeactivate = billingPageListeners.deactivate;
billingPageListeners.deactivate = function() {
  // Use cleanup manager
  if (this.cleanupManager) {
    this.cleanupManager();
    this.cleanupManager = null;
  }
  
  originalBillingDeactivate.call(this);
};

// Enhance tables listeners
const originalTablesActivate = tablesPageListeners.activate;
tablesPageListeners.activate = function() {
  originalTablesActivate.call(this);
  
  // Register with cleanup manager
  this.cleanupManager = eventListenerManager.registerComponent(
    this.componentId,
    this.listeners
  );
};

const originalTablesDeactivate = tablesPageListeners.deactivate;
tablesPageListeners.deactivate = function() {
  // Use cleanup manager
  if (this.cleanupManager) {
    this.cleanupManager();
    this.cleanupManager = null;
  }
  
  originalTablesDeactivate.call(this);
};

/**
 * React Hook for automatic event listener cleanup
 */
export function useEventListenerCleanup(componentId) {
  const [cleanupFunction, setCleanupFunction] = React.useState(null);
  
  React.useEffect(() => {
    // Register component on mount
    const cleanup = eventListenerManager.registerComponent(componentId, []);
    setCleanupFunction(() => cleanup);
    
    // Cleanup on unmount
    return cleanup;
  }, [componentId]);
  
  // Return function to add listeners with automatic cleanup
  const addListener = React.useCallback((listenerCleanup) => {
    return eventListenerManager.addListener(componentId, listenerCleanup);
  }, [componentId]);
  
  return { addListener, cleanup: cleanupFunction };
}