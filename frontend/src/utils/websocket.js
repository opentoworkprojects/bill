/**
 * Ultra-Performance WebSocket Manager
 * Real-time updates with auto-reconnect and message queuing
 */

class WebSocketManager {
  constructor() {
    this.ws = null;
    this.url = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000;
    this.messageQueue = [];
    this.listeners = new Map();
    this.isConnected = false;
    this.heartbeatInterval = null;
    this.lastHeartbeat = null;
    
    // Performance metrics
    this.metrics = {
      messagesReceived: 0,
      messagesSent: 0,
      reconnections: 0,
      avgLatency: 0,
      lastLatency: 0
    };
  }

  /**
   * Connect to WebSocket server
   */
  connect(orgId, userId, userRole) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    this.url = `${protocol}//${host}/ws/${orgId}/${userId}/${userRole}`;
    
    console.log('🔌 Connecting to WebSocket:', this.url);
    
    try {
      this.ws = new WebSocket(this.url);
      this.setupEventListeners();
    } catch (error) {
      console.error('❌ WebSocket connection failed:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Setup WebSocket event listeners
   */
  setupEventListeners() {
    this.ws.onopen = (event) => {
      console.log('✅ WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.flushMessageQueue();
      this.emit('connected', event);
    };

    this.ws.onmessage = (event) => {
      this.metrics.messagesReceived++;
      
      try {
        const data = JSON.parse(event.data);
        
        // Handle heartbeat response
        if (data.type === 'pong') {
          this.handleHeartbeatResponse(data.timestamp);
          return;
        }
        
        console.log('📨 WebSocket message received:', data.type);
        this.emit(data.type, data);
        this.emit('message', data);
        
      } catch (error) {
        console.error('❌ Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onclose = (event) => {
      console.log('🔌 WebSocket disconnected:', event.code, event.reason);
      this.isConnected = false;
      this.stopHeartbeat();
      this.emit('disconnected', event);
      
      if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      this.emit('error', error);
    };
  }

  /**
   * Send message to server
   */
  send(type, data = {}) {
    const message = {
      type,
      data,
      timestamp: Date.now()
    };

    if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        this.metrics.messagesSent++;
        console.log('📤 WebSocket message sent:', type);
      } catch (error) {
        console.error('❌ Failed to send WebSocket message:', error);
        this.queueMessage(message);
      }
    } else {
      console.log('📋 Queueing message (not connected):', type);
      this.queueMessage(message);
    }
  }

  /**
   * Queue message for later sending
   */
  queueMessage(message) {
    this.messageQueue.push(message);
    
    // Limit queue size
    if (this.messageQueue.length > 100) {
      this.messageQueue.shift();
    }
  }

  /**
   * Flush queued messages
   */
  flushMessageQueue() {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const message = this.messageQueue.shift();
      try {
        this.ws.send(JSON.stringify(message));
        this.metrics.messagesSent++;
      } catch (error) {
        console.error('❌ Failed to send queued message:', error);
        break;
      }
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.lastHeartbeat = Date.now();
        this.send('ping', { timestamp: this.lastHeartbeat });
      }
    }, 30000); // 30 seconds
  }

  /**
   * Stop heartbeat
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Handle heartbeat response and calculate latency
   */
  handleHeartbeatResponse(serverTimestamp) {
    if (this.lastHeartbeat) {
      const latency = Date.now() - this.lastHeartbeat;
      this.metrics.lastLatency = latency;
      
      // Calculate rolling average latency
      if (this.metrics.avgLatency === 0) {
        this.metrics.avgLatency = latency;
      } else {
        this.metrics.avgLatency = (this.metrics.avgLatency * 0.9) + (latency * 0.1);
      }
      
      console.log(`💓 WebSocket latency: ${latency}ms (avg: ${Math.round(this.metrics.avgLatency)}ms)`);
    }
  }

  /**
   * Schedule reconnection attempt
   */
  scheduleReconnect() {
    this.reconnectAttempts++;
    this.metrics.reconnections++;
    
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      30000 // Max 30 seconds
    );
    
    console.log(`🔄 Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      if (this.url) {
        const urlParts = this.url.split('/');
        const orgId = urlParts[urlParts.length - 3];
        const userId = urlParts[urlParts.length - 2];
        const userRole = urlParts[urlParts.length - 1];
        this.connect(orgId, userId, userRole);
      }
    }, delay);
  }

  /**
   * Add event listener
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Error in WebSocket event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    console.log('🔌 Disconnecting WebSocket');
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.isConnected = false;
    this.url = null;
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      queuedMessages: this.messageQueue.length,
      metrics: { ...this.metrics }
    };
  }

  /**
   * Subscribe to order updates for a specific table
   */
  subscribeToTable(tableId) {
    this.send('subscribe_table', { tableId });
  }

  /**
   * Unsubscribe from table updates
   */
  unsubscribeFromTable(tableId) {
    this.send('unsubscribe_table', { tableId });
  }

  /**
   * Subscribe to kitchen updates
   */
  subscribeToKitchen() {
    this.send('subscribe_kitchen');
  }

  /**
   * Send order update
   */
  sendOrderUpdate(orderId, status, data = {}) {
    this.send('order_update', {
      orderId,
      status,
      ...data
    });
  }

  /**
   * Send table status update
   */
  sendTableUpdate(tableId, status, data = {}) {
    this.send('table_update', {
      tableId,
      status,
      ...data
    });
  }
}

// Create singleton instance
const wsManager = new WebSocketManager();

// Auto-connect when user data is available
let autoConnectInterval = setInterval(() => {
  const userData = localStorage.getItem('user');
  if (userData && !wsManager.isConnected) {
    try {
      const user = JSON.parse(userData);
      if (user.id && user.organization_id) {
        wsManager.connect(user.organization_id, user.id, user.role || 'admin');
        clearInterval(autoConnectInterval);
      }
    } catch (error) {
      console.error('❌ Failed to parse user data for WebSocket:', error);
    }
  }
}, 1000);

// Clear interval after 30 seconds to avoid infinite checking
setTimeout(() => {
  clearInterval(autoConnectInterval);
}, 30000);

// Export singleton instance
export default wsManager;

// Export class for testing
export { WebSocketManager };