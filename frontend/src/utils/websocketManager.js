/**
 * WebSocket Manager for Real-Time Updates
 * Replaces aggressive polling with efficient WebSocket connections
 */

import { API } from '../App';

class WebSocketManager {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
    this.isConnecting = false;
    this.wasConnected = false;
    this.heartbeatInterval = null;
    this.missedHeartbeats = 0;
    this.maxMissedHeartbeats = 3;
  }

  /**
   * Connect to WebSocket server
   */
  connect(token) {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    if (this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      // Derive WebSocket URL from the API base URL (handles both dev and prod)
      // API = "https://restro-ai.onrender.com/api" → wss://restro-ai.onrender.com/ws
      // API = "http://localhost:10000/api"         → ws://localhost:10000/ws
      const apiBase = API.replace(/\/api$/, '');
      const wsProtocol = apiBase.startsWith('https') ? 'wss:' : 'ws:';
      const wsHost = apiBase.replace(/^https?:\/\//, '');
      const wsUrl = `${wsProtocol}//${wsHost}/ws?token=${encodeURIComponent(token)}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.wasConnected = true;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.startHeartbeat();
        this.emit('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Reset heartbeat counter on any message
          this.missedHeartbeats = 0;
          
          // Handle different message types
          switch (data.type) {
            case 'pong':
              // Heartbeat response
              break;
            case 'order_created':
              this.emit('order_created', data.order);
              break;
            case 'order_updated':
              this.emit('order_updated', data.order);
              break;
            case 'order_status_changed':
              this.emit('order_status_changed', data.order);
              break;
            case 'whatsapp_sent':
              this.emit('whatsapp_sent', data.order_id);
              break;
            case 'payment_completed':
              this.emit('payment_completed', data.order);
              break;
            case 'table_updated':
              this.emit('table_updated', data.table);
              break;
            case 'menu_updated':
              this.emit('menu_updated', data.menu);
              break;
            default:
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        // Suppress error log — WS endpoint may not exist, fallback polling handles it
        this.isConnecting = false;
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        this.stopHeartbeat();
        this.emit('disconnected');
        // Only reconnect if we had a successful connection before — don't retry on initial failure
        if (this.wasConnected && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect(token);
        }
      };

    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.isConnecting = false;
      this.attemptReconnect(token);
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  startHeartbeat() {
    this.stopHeartbeat();
    
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.missedHeartbeats++;
        
        if (this.missedHeartbeats >= this.maxMissedHeartbeats) {
          this.ws.close();
          return;
        }
        
        // Send ping
        this.send({ type: 'ping' });
      }
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this.missedHeartbeats = 0;
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  attemptReconnect(token) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      this.emit('max_reconnect_attempts');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    setTimeout(() => {
      this.connect(token);
    }, delay);
  }

  /**
   * Send message through WebSocket
   */
  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return true;
    }
    return false;
  }

  /**
   * Subscribe to WebSocket events
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
          console.error(`Error in WebSocket listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.reconnectAttempts = 0;
    this.isConnecting = false;
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
const websocketManager = new WebSocketManager();

export default websocketManager;
