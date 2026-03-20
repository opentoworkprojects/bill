/**
 * Hybrid Sync Manager
 * Combines WebSockets for real-time updates with request batching for efficiency
 * Maintains billing speed while dramatically reducing server load
 */

import websocketManager from './websocketManager';
import requestBatcher from './requestBatcher';
import { apiWithRetry } from './apiClient';
import { API } from '../App';

class HybridSyncManager {
  constructor() {
    this.isInitialized = false;
    this.fallbackPolling = null;
    this.listeners = new Map();
    this.pendingUpdates = new Map();
    this.batchTimer = null;
  }

  /**
   * Initialize hybrid sync system
   */
  initialize(token) {
    if (this.isInitialized) {
      console.log('🔄 Hybrid sync already initialized');
      return;
    }

    console.log('🚀 Initializing hybrid sync manager');
    
    // Connect WebSocket
    websocketManager.connect(token);

    // Set up WebSocket event listeners
    this.setupWebSocketListeners();

    // Set up fallback polling (only if WebSocket fails)
    this.setupFallbackPolling();

    this.isInitialized = true;
  }

  /**
   * Set up WebSocket event listeners
   */
  setupWebSocketListeners() {
    // Order created
    websocketManager.on('order_created', (order) => {
      console.log('📨 WS: Order created', order.id);
      this.emit('order_created', order);
    });

    // Order updated
    websocketManager.on('order_updated', (order) => {
      console.log('📨 WS: Order updated', order.id);
      this.emit('order_updated', order);
    });

    // Order status changed
    websocketManager.on('order_status_changed', (order) => {
      console.log('📨 WS: Order status changed', order.id, order.status);
      this.emit('order_status_changed', order);
    });

    // WhatsApp sent
    websocketManager.on('whatsapp_sent', (orderId) => {
      console.log('📨 WS: WhatsApp sent for order', orderId);
      this.emit('whatsapp_sent', orderId);
    });

    // Payment completed
    websocketManager.on('payment_completed', (order) => {
      console.log('📨 WS: Payment completed', order.id);
      this.emit('payment_completed', order);
    });

    // Table updated
    websocketManager.on('table_updated', (table) => {
      console.log('📨 WS: Table updated', table.id);
      this.emit('table_updated', table);
    });

    // Menu updated
    websocketManager.on('menu_updated', (menu) => {
      console.log('📨 WS: Menu updated');
      this.emit('menu_updated', menu);
    });

    // WebSocket disconnected - start fallback
    websocketManager.on('disconnected', () => {
      console.warn('⚠️ WebSocket disconnected, using fallback polling');
      this.startFallbackPolling();
    });

    // WebSocket reconnected - stop fallback
    websocketManager.on('connected', () => {
      console.log('✅ WebSocket reconnected, stopping fallback polling');
      this.stopFallbackPolling();
    });
  }

  /**
   * Set up fallback polling (only used when WebSocket is down)
   */
  setupFallbackPolling() {
    // Fallback polling is only started when WebSocket disconnects
    console.log('📡 Fallback polling configured (inactive until needed)');
  }

  /**
   * Start fallback polling (only when WebSocket is down)
   */
  startFallbackPolling() {
    if (this.fallbackPolling) return;

    console.log('🔄 Starting fallback polling (WebSocket unavailable)');
    
    this.fallbackPolling = setInterval(async () => {
      try {
        // Batch fetch all necessary data in one call
        const data = await requestBatcher.prefetchBatch([
          { type: 'orders', id: 'active' },
          { type: 'tables', id: 'all' }
        ]);

        if (data.orders) {
          this.emit('orders_updated', data.orders);
        }
        if (data.tables) {
          this.emit('tables_updated', data.tables);
        }
      } catch (error) {
        console.error('Fallback polling failed:', error);
      }
    }, 10000); // Poll every 10 seconds (much less aggressive than before)
  }

  /**
   * Stop fallback polling
   */
  stopFallbackPolling() {
    if (this.fallbackPolling) {
      clearInterval(this.fallbackPolling);
      this.fallbackPolling = null;
      console.log('⏹️ Fallback polling stopped');
    }
  }

  /**
   * Batch multiple order status updates
   */
  async batchStatusUpdate(orderId, status) {
    // Add to pending updates
    this.pendingUpdates.set(orderId, status);

    // Clear existing timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    // Execute batch after short delay (allows collecting multiple updates)
    this.batchTimer = setTimeout(async () => {
      const updates = Array.from(this.pendingUpdates.entries()).map(([id, st]) => ({
        orderId: id,
        status: st
      }));

      this.pendingUpdates.clear();

      try {
        const results = await requestBatcher.batchUpdateStatus(updates);
        console.log(`✅ Batch updated ${results.length} order statuses`);
        
        // Emit individual updates
        results.forEach(order => {
          this.emit('order_status_changed', order);
        });
      } catch (error) {
        console.error('Batch status update failed:', error);
        throw error;
      }
    }, 100); // Wait 100ms to collect updates
  }

  /**
   * Fetch multiple orders efficiently
   */
  async fetchOrders(orderIds) {
    try {
      const orders = await requestBatcher.batchFetchOrders(orderIds);
      console.log(`✅ Batch fetched ${orders.length} orders`);
      return orders;
    } catch (error) {
      console.error('Batch fetch orders failed:', error);
      throw error;
    }
  }

  /**
   * Subscribe to events
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Emit event to all listeners
   */
  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in hybrid sync listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Disconnect and cleanup
   */
  disconnect() {
    console.log('🔌 Disconnecting hybrid sync manager');
    websocketManager.disconnect();
    this.stopFallbackPolling();
    requestBatcher.clearAll();
    this.isInitialized = false;
  }

  /**
   * Check if connected (WebSocket or fallback)
   */
  isConnected() {
    return websocketManager.isConnected() || this.fallbackPolling !== null;
  }
}

// Singleton instance
const hybridSyncManager = new HybridSyncManager();

export default hybridSyncManager;
