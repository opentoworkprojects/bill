/**
 * Hybrid Sync Manager
 * Combines WebSockets for real-time updates with request batching for efficiency
 * Maintains billing speed while dramatically reducing server load
 */

import websocketManager from './websocketManager';
import { apiWithRetry } from './apiClient';
import { API } from '../App';
import requestBatcher from './requestBatcher';

class HybridSyncManager {
  constructor() {
    this.isInitialized = false;
    this.fallbackPolling = null;
    this.listeners = new Map();
    this.pendingUpdates = new Map();
    this.batchTimer = null;
    this.wsEverConnected = false; // track if WS ever succeeded
  }

  /**
   * Initialize hybrid sync system
   */
  initialize(token) {
    if (this.isInitialized) {
      return;
    }
    
    // Connect WebSocket
    websocketManager.connect(token);

    // Set up WebSocket event listeners
    this.setupWebSocketListeners();

    this.isInitialized = true;
  }

  /**
   * Set up WebSocket event listeners
   */
  setupWebSocketListeners() {
    websocketManager.on('order_created', (order) => {
      this.emit('order_created', order);
    });

    websocketManager.on('order_updated', (order) => {
      this.emit('order_updated', order);
    });

    websocketManager.on('order_status_changed', (order) => {
      this.emit('order_status_changed', order);
    });

    websocketManager.on('whatsapp_sent', (orderId) => {
      this.emit('whatsapp_sent', orderId);
    });

    websocketManager.on('payment_completed', (order) => {
      this.emit('payment_completed', order);
    });

    websocketManager.on('table_updated', (table) => {
      this.emit('table_updated', table);
    });

    websocketManager.on('menu_updated', (menu) => {
      this.emit('menu_updated', menu);
    });

    // Only start fallback if WS was previously working and then dropped
    websocketManager.on('disconnected', () => {
      if (this.wsEverConnected) {
        this.startFallbackPolling();
      }
      // If WS never connected (no /ws endpoint), don't start fallback —
      // OrdersPage handles its own polling via orderPollingManager
    });

    websocketManager.on('connected', () => {
      this.wsEverConnected = true;
      this.stopFallbackPolling();
    });
  }

  /**
   * Start fallback polling using real /orders endpoint
   */
  startFallbackPolling() {
    if (this.fallbackPolling) return;
    
    this.fallbackPolling = setInterval(async () => {
      try {
        const response = await apiWithRetry({
          method: 'get',
          url: `${API}/orders?fresh=true&_t=${Date.now()}`,
          timeout: 8000
        });
        const orders = Array.isArray(response.data) ? response.data : [];
        if (orders.length > 0) {
          this.emit('orders_updated', orders);
        }
      } catch (error) {
        // Silent — fallback polling failures are expected occasionally
      }
    }, 10000);
  }

  /**
   * Stop fallback polling
   */
  stopFallbackPolling() {
    if (this.fallbackPolling) {
      clearInterval(this.fallbackPolling);
      this.fallbackPolling = null;
    }
  }

  /**
   * Batch multiple order status updates
   */
  async batchStatusUpdate(orderId, status) {
    this.pendingUpdates.set(orderId, status);

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    this.batchTimer = setTimeout(async () => {
      const updates = Array.from(this.pendingUpdates.entries()).map(([id, st]) => ({
        orderId: id,
        status: st
      }));
      this.pendingUpdates.clear();

      try {
        // Use the real batch-update-status endpoint
        const response = await apiWithRetry({
          method: 'post',
          url: `${API}/orders/batch-update-status`,
          data: { updates: updates.map(u => ({ order_id: u.orderId, status: u.status })) }
        });
        const results = Array.isArray(response.data) ? response.data : [];
        results.forEach(order => this.emit('order_status_changed', order));
      } catch (error) {
      }
    }, 100);
  }

  /**
   * Fetch multiple orders efficiently
   */
  async fetchOrders(orderIds) {
    try {
      const response = await apiWithRetry({
        method: 'get',
        url: `${API}/orders?fresh=true`,
        timeout: 8000
      });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
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
    websocketManager.disconnect();
    this.stopFallbackPolling();
    requestBatcher.clearAll();
    this.isInitialized = false;
  }

  /**
   * Check if connected (WebSocket or active fallback)
   */
  isConnected() {
    // Only report connected if WS is actually open
    // Don't count fallback polling as "connected" — that would suppress OrdersPage polling
    return websocketManager.isConnected();
  }
}

// Singleton instance
const hybridSyncManager = new HybridSyncManager();

export default hybridSyncManager;
