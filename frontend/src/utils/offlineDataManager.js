// ✅ Unified Offline Data Manager
// Handles all data operations with automatic fallback and sync

import { offlineStorage } from './offlineStorage';
import { dataSyncService } from './dataSyncService';
import { toast } from 'sonner';

class OfflineDataManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.syncQueue = [];
    this.dataCache = new Map();
    this.subscribers = new Map();
    this.lastFetchTimes = new Map();
    this.cacheTTL = 30000; // 30 seconds cache TTL
    
    this.initializeNetworkListeners();
    this.startCacheCleanup();
  }

  initializeNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.handleOnlineEvent();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.handleOfflineEvent();
    });
  }

  async handleOnlineEvent() {
    console.log('🌐 Back online - syncing data');
    toast.success('Back online - syncing data...', { duration: 2000 });
    
    try {
      await dataSyncService.performFullSync();
      this.notifySubscribers('network', { isOnline: true });
    } catch (error) {
      console.error('Failed to sync on reconnection:', error);
    }
  }

  handleOfflineEvent() {
    console.log('📴 Gone offline - using cached data');
    toast.info('Working offline - data will sync when reconnected', { duration: 3000 });
    this.notifySubscribers('network', { isOnline: false });
  }

  // Unified data fetching with automatic fallback
  async fetchData(endpoint, options = {}) {
    const cacheKey = `${endpoint}_${JSON.stringify(options)}`;
    const now = Date.now();
    
    // Check memory cache first
    if (this.dataCache.has(cacheKey)) {
      const cached = this.dataCache.get(cacheKey);
      if (now - cached.timestamp < this.cacheTTL) {
        console.log(`💾 Memory cache hit: ${endpoint}`);
        return cached.data;
      }
    }
    
    try {
      let data;
      
      if (this.isOnline) {
        // Try to fetch from server
        data = await this.fetchFromServer(endpoint, options);
        
        // Cache successful response
        this.dataCache.set(cacheKey, { data, timestamp: now });
        this.lastFetchTimes.set(endpoint, now);
        
        // Store in offline storage
        await this.storeOfflineData(endpoint, data);
        
      } else {
        // Fetch from offline storage
        data = await this.fetchFromOfflineStorage(endpoint, options);
        
        if (!data) {
          throw new Error('No offline data available');
        }
      }
      
      return data;
      
    } catch (error) {
      console.warn(`Failed to fetch ${endpoint}, trying offline storage:`, error);
      
      // Fallback to offline storage
      const offlineData = await this.fetchFromOfflineStorage(endpoint, options);
      
      if (offlineData) {
        if (this.isOnline) {
          toast.warning('Using cached data - server temporarily unavailable');
        }
        return offlineData;
      }
      
      throw new Error(`No data available for ${endpoint}`);
    }
  }

  async fetchFromServer(endpoint, options) {
    const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
    const url = `${baseURL}${endpoint}`;
    
    // Add auth token if available
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      timeout: 10000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  }

  async fetchFromOfflineStorage(endpoint, options) {
    try {
      switch (endpoint) {
        case '/orders':
          return await offlineStorage.getOrders({ 
            status: ['pending', 'preparing', 'ready'] 
          });
          
        case '/orders/today-bills':
          return await offlineStorage.getOrders({ 
            today: true, 
            status: ['completed', 'cancelled'] 
          });
          
        case '/menu':
          return await offlineStorage.getMenuItems({ available: true });
          
        case '/tables':
          return await offlineStorage.getTables();
          
        case '/dashboard':
          return await offlineStorage.getDashboardStats();
          
        case '/business/settings':
          const settings = await offlineStorage.getBusinessSettings();
          return { business_settings: settings };
          
        default:
          return null;
      }
    } catch (error) {
      console.error(`Failed to fetch from offline storage: ${endpoint}`, error);
      return null;
    }
  }

  async storeOfflineData(endpoint, data) {
    try {
      switch (endpoint) {
        case '/orders':
          for (const order of data) {
            await offlineStorage.saveOrder(order);
          }
          break;
          
        case '/orders/today-bills':
          for (const bill of data) {
            await offlineStorage.saveOrder(bill);
          }
          break;
          
        case '/menu':
          await offlineStorage.saveMenuItems(data);
          break;
          
        case '/tables':
          await offlineStorage.saveTables(data);
          break;
          
        case '/dashboard':
          await offlineStorage.saveDashboardStats(data);
          break;
          
        case '/business/settings':
          await offlineStorage.saveBusinessSettings(data.business_settings || {});
          break;
      }
    } catch (error) {
      console.warn(`Failed to store offline data for ${endpoint}:`, error);
    }
  }

  // Unified data mutation with automatic queuing
  async mutateData(endpoint, data, method = 'POST') {
    const mutationId = `${method}_${endpoint}_${Date.now()}`;
    
    try {
      if (this.isOnline) {
        // Try to mutate on server immediately
        const result = await this.mutateOnServer(endpoint, data, method);
        
        // Update local storage with server response
        await this.updateLocalAfterMutation(endpoint, result, method);
        
        // Clear relevant cache
        this.clearRelatedCache(endpoint);
        
        return result;
        
      } else {
        // Handle offline mutation
        const result = await this.mutateOffline(endpoint, data, method);
        
        // Queue for sync when online
        await this.queueMutation(mutationId, endpoint, data, method);
        
        return result;
      }
      
    } catch (error) {
      console.error(`Mutation failed for ${endpoint}:`, error);
      
      if (this.isOnline) {
        // If online mutation fails, try offline
        const result = await this.mutateOffline(endpoint, data, method);
        await this.queueMutation(mutationId, endpoint, data, method);
        
        toast.warning('Saved locally - will sync when connection improves');
        return result;
      }
      
      throw error;
    }
  }

  async mutateOnServer(endpoint, data, method) {
    const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
    const url = `${baseURL}${endpoint}`;
    
    // Add auth token if available
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(data),
      timeout: 15000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  }

  async mutateOffline(endpoint, data, method) {
    switch (method) {
      case 'POST':
        if (endpoint === '/orders') {
          const orderId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const order = {
            id: orderId,
            ...data,
            status: 'pending',
            created_at: new Date().toISOString(),
            total: data.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0,
            sync_status: 'pending'
          };
          
          await offlineStorage.saveOrder(order);
          return order;
        }
        break;
        
      case 'PUT':
        if (endpoint.includes('/orders/') && endpoint.includes('/status')) {
          const orderId = endpoint.split('/orders/')[1].split('/status')[0];
          const status = data.status || new URLSearchParams(endpoint.split('?')[1] || '').get('status');
          
          return await offlineStorage.updateOrderStatus(orderId, status);
        }
        break;
        
      case 'DELETE':
        if (endpoint.includes('/orders/')) {
          const orderId = endpoint.split('/orders/')[1];
          await offlineStorage.performDBOperation('orders', 'delete', orderId);
          return { success: true };
        }
        break;
    }
    
    throw new Error(`Offline ${method} not supported for ${endpoint}`);
  }

  async queueMutation(id, endpoint, data, method) {
    await offlineStorage.addToSyncQueue(`${method.toLowerCase()}_${endpoint.replace('/', '_')}`, {
      id,
      endpoint,
      data,
      method
    }, 'high');
  }

  async updateLocalAfterMutation(endpoint, result, method) {
    if (method === 'POST' && endpoint === '/orders') {
      await offlineStorage.saveOrder({ ...result, sync_status: 'synced' });
    }
    // Add more cases as needed
  }

  clearRelatedCache(endpoint) {
    const keysToDelete = [];
    
    for (const key of this.dataCache.keys()) {
      if (key.includes(endpoint) || 
          (endpoint.includes('orders') && key.includes('orders')) ||
          (endpoint.includes('dashboard') && key.includes('dashboard'))) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.dataCache.delete(key));
  }

  // Subscription system for real-time updates
  subscribe(event, callback) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    
    this.subscribers.get(event).add(callback);
    
    // Return unsubscribe function
    return () => {
      const eventSubscribers = this.subscribers.get(event);
      if (eventSubscribers) {
        eventSubscribers.delete(callback);
      }
    };
  }

  notifySubscribers(event, data) {
    const eventSubscribers = this.subscribers.get(event);
    if (eventSubscribers) {
      eventSubscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Subscriber callback error:', error);
        }
      });
    }
  }

  // Cache cleanup
  startCacheCleanup() {
    setInterval(() => {
      const now = Date.now();
      const keysToDelete = [];
      
      for (const [key, value] of this.dataCache.entries()) {
        if (now - value.timestamp > this.cacheTTL * 2) {
          keysToDelete.push(key);
        }
      }
      
      keysToDelete.forEach(key => this.dataCache.delete(key));
      
      if (keysToDelete.length > 0) {
        console.log(`🧹 Cleaned up ${keysToDelete.length} expired cache entries`);
      }
    }, 60000); // Clean every minute
  }

  // Preload critical data
  async preloadCriticalData() {
    const criticalEndpoints = [
      '/orders',
      '/orders/today-bills',
      '/menu',
      '/tables',
      '/dashboard',
      '/business/settings'
    ];
    
    console.log('🚀 Preloading critical data...');
    
    const promises = criticalEndpoints.map(endpoint => 
      this.fetchData(endpoint).catch(error => {
        console.warn(`Failed to preload ${endpoint}:`, error);
        return null;
      })
    );
    
    await Promise.all(promises);
    console.log('✅ Critical data preloaded');
  }

  // Status and diagnostics
  getStatus() {
    return {
      isOnline: this.isOnline,
      cacheSize: this.dataCache.size,
      subscriberCount: Array.from(this.subscribers.values()).reduce((sum, set) => sum + set.size, 0),
      lastFetchTimes: Object.fromEntries(this.lastFetchTimes)
    };
  }

  async getSyncStatus() {
    const pendingCount = await dataSyncService.getPendingSyncCount();
    const syncStatus = dataSyncService.getSyncStatus();
    
    return {
      ...syncStatus,
      pendingCount,
      cacheStats: this.getStatus()
    };
  }

  // Cleanup
  destroy() {
    this.subscribers.clear();
    this.dataCache.clear();
    this.lastFetchTimes.clear();
  }
}

// Export singleton instance
export const offlineDataManager = new OfflineDataManager();
export default OfflineDataManager;