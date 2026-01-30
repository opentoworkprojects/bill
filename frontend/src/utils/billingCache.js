/**
 * Enhanced Billing Data Cache for Instant Bill & Pay Experience
 * Pre-loads and caches billing data with persistent storage and background updates
 */

import axios from 'axios';
import { API } from '../App';
import { performanceMonitor, trackCacheHit, trackCacheMiss } from './performanceMonitor';

class BillingCache {
  constructor() {
    this.cache = new Map();
    this.preloadPromises = new Map();
    this.CACHE_TTL = 300000; // 5 minutes cache (increased from 1 minute)
    this.PERSISTENT_CACHE_TTL = 1800000; // 30 minutes for persistent storage
    this.STORAGE_KEY = 'billbyte_billing_cache';
    this.LAST_PRELOAD_KEY = 'billbyte_last_preload';
    this.PRELOAD_COOLDOWN = 60000; // 1 minute cooldown between preloads
    
    // Load persistent cache on initialization
    this._loadPersistentCache();
  }

  /**
   * Load cache from localStorage
   */
  _loadPersistentCache() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsedData = JSON.parse(stored);
        const now = Date.now();
        
        // Only load non-expired data
        Object.entries(parsedData).forEach(([orderId, cacheEntry]) => {
          if (now - cacheEntry.timestamp < this.PERSISTENT_CACHE_TTL) {
            this.cache.set(orderId, cacheEntry);
          }
        });
        
        console.log(`💾 Loaded ${this.cache.size} cached orders from persistent storage`);
      }
    } catch (error) {
      console.warn('Failed to load persistent cache:', error);
    }
  }

  /**
   * Save cache to localStorage
   */
  _savePersistentCache() {
    try {
      const cacheData = {};
      this.cache.forEach((value, key) => {
        cacheData[key] = value;
      });
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to save persistent cache:', error);
    }
  }

  /**
   * Check if we should skip preloading (cooldown period)
   */
  _shouldSkipPreload() {
    const lastPreload = localStorage.getItem(this.LAST_PRELOAD_KEY);
    if (lastPreload) {
      const timeSinceLastPreload = Date.now() - parseInt(lastPreload);
      return timeSinceLastPreload < this.PRELOAD_COOLDOWN;
    }
    return false;
  }

  /**
   * Pre-load billing data for an order (called when order is displayed)
   */
  async preloadBillingData(orderId) {
    // Check if already cached and fresh
    const cached = this.getCachedBillingData(orderId);
    if (cached) {
      console.log(`⚡ Order ${orderId} already cached, skipping preload`);
      return cached;
    }

    // Avoid duplicate preload requests
    if (this.preloadPromises.has(orderId)) {
      return this.preloadPromises.get(orderId);
    }

    const preloadPromise = this._fetchBillingData(orderId);
    this.preloadPromises.set(orderId, preloadPromise);

    try {
      const data = await preloadPromise;
      this._cacheData(orderId, data);
      console.log(`💾 Billing data preloaded for order ${orderId}`);
      return data;
    } catch (error) {
      console.warn(`⚠️ Failed to preload billing data for order ${orderId}:`, error);
      this.preloadPromises.delete(orderId);
      return null;
    }
  }

  /**
   * Get cached billing data instantly
   */
  getCachedBillingData(orderId) {
    const cached = this.cache.get(orderId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log(`⚡ Using cached billing data for order ${orderId}`);
      trackCacheHit(orderId, 'full');
      return cached.data;
    }
    
    if (cached) {
      trackCacheMiss(orderId, 'expired');
      // Background refresh for expired cache
      this._backgroundRefresh(orderId);
    } else {
      trackCacheMiss(orderId, 'not_found');
    }
    
    return null;
  }

  /**
   * Background refresh of expired cache
   */
  async _backgroundRefresh(orderId) {
    try {
      console.log(`🔄 Background refresh for order ${orderId}`);
      const data = await this._fetchBillingData(orderId);
      this._cacheData(orderId, data);
    } catch (error) {
      console.warn(`Failed background refresh for order ${orderId}:`, error);
    }
  }

  /**
   * Get billing data with cache-first strategy
   * @param {string} orderId - Order ID
   * @param {boolean} forceRefresh - Skip cache and fetch fresh data
   */
  async getBillingData(orderId, forceRefresh = false) {
    // Skip cache if force refresh is requested
    if (!forceRefresh) {
      // Try cache first
      const cached = this.getCachedBillingData(orderId);
      if (cached) {
        return cached;
      }
    }

    // Fetch fresh data
    console.log(`🔄 Fetching ${forceRefresh ? 'FRESH' : 'fresh'} billing data for order ${orderId}`);
    const data = await this._fetchBillingData(orderId);
    this._cacheData(orderId, data);
    return data;
  }

  /**
   * Fetch all billing-related data in parallel
   */
  async _fetchBillingData(orderId) {
    const token = localStorage.getItem('token');
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Fetch all required data in parallel for speed
    const [orderRes, businessRes, menuRes] = await Promise.allSettled([
      axios.get(`${API}/orders/${orderId}`, { headers, timeout: 5000 }),
      axios.get(`${API}/business/settings`, { headers, timeout: 5000 }),
      axios.get(`${API}/menu`, { headers, timeout: 5000 })
    ]);

    // Process results with error handling
    const order = orderRes.status === 'fulfilled' ? orderRes.value.data : null;
    const businessSettings = businessRes.status === 'fulfilled' ? businessRes.value.data.business_settings : {};
    const menuItems = menuRes.status === 'fulfilled' ? 
      (Array.isArray(menuRes.value.data) ? menuRes.value.data.filter(item => item.available) : []) : [];

    if (!order) {
      throw new Error('Failed to fetch order data');
    }

    return {
      order,
      businessSettings,
      menuItems,
      timestamp: Date.now()
    };
  }

  /**
   * Cache data with timestamp and persistent storage
   */
  _cacheData(orderId, data) {
    this.cache.set(orderId, {
      data,
      timestamp: Date.now()
    });

    // Save to persistent storage
    this._savePersistentCache();

    // Clean up old cache entries (keep only last 50 for better performance)
    if (this.cache.size > 50) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toDelete = entries.slice(0, entries.length - 50);
      toDelete.forEach(([key]) => this.cache.delete(key));
      this._savePersistentCache();
    }
  }

  /**
   * Invalidate cache for an order (after updates)
   */
  invalidateOrder(orderId) {
    this.cache.delete(orderId);
    this.preloadPromises.delete(orderId);
    this._savePersistentCache();
    console.log(`🗑️ Cache invalidated for order ${orderId}`);
  }

  /**
   * Smart pre-load billing data for multiple orders (with cooldown)
   */
  async preloadMultipleOrders(orderIds) {
    // Check cooldown to prevent excessive preloading
    if (this._shouldSkipPreload()) {
      console.log(`⏰ Skipping preload due to cooldown (last preload was recent)`);
      return;
    }

    // Filter out already cached orders
    const uncachedOrderIds = orderIds.filter(orderId => !this.getCachedBillingData(orderId));
    
    if (uncachedOrderIds.length === 0) {
      console.log(`⚡ All ${orderIds.length} orders already cached, skipping preload`);
      return;
    }

    console.log(`💾 Pre-loading billing data for ${uncachedOrderIds.length}/${orderIds.length} uncached orders...`);
    
    // Update last preload timestamp
    localStorage.setItem(this.LAST_PRELOAD_KEY, Date.now().toString());

    // Batch preload with limited concurrency (5 at a time)
    const BATCH_SIZE = 5;
    const batches = [];
    for (let i = 0; i < uncachedOrderIds.length; i += BATCH_SIZE) {
      batches.push(uncachedOrderIds.slice(i, i + BATCH_SIZE));
    }

    let successful = 0;
    for (const batch of batches) {
      const promises = batch.map(orderId => 
        this.preloadBillingData(orderId).catch(error => {
          console.warn(`Failed to preload order ${orderId}:`, error);
          return null;
        })
      );

      const results = await Promise.allSettled(promises);
      successful += results.filter(r => r.status === 'fulfilled' && r.value).length;
    }

    console.log(`💾 Preloaded billing data for ${successful}/${uncachedOrderIds.length} orders`);
  }

  /**
   * Background sync - update cache for active orders
   */
  async backgroundSync(activeOrderIds) {
    if (!activeOrderIds || activeOrderIds.length === 0) return;

    // Only sync orders that are cached but might be stale
    const staleOrders = activeOrderIds.filter(orderId => {
      const cached = this.cache.get(orderId);
      return cached && (Date.now() - cached.timestamp > this.CACHE_TTL / 2); // Refresh at 50% TTL
    });

    if (staleOrders.length > 0) {
      console.log(`🔄 Background sync for ${staleOrders.length} stale orders`);
      staleOrders.forEach(orderId => this._backgroundRefresh(orderId));
    }
  }

  /**
   * Clear all cache
   */
  clearCache() {
    this.cache.clear();
    this.preloadPromises.clear();
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.LAST_PRELOAD_KEY);
    console.log('🗑️ Billing cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const now = Date.now();
    const fresh = Array.from(this.cache.values()).filter(entry => now - entry.timestamp < this.CACHE_TTL).length;
    const stale = this.cache.size - fresh;
    
    return {
      cacheSize: this.cache.size,
      freshEntries: fresh,
      staleEntries: stale,
      preloadingCount: this.preloadPromises.size,
      cacheKeys: Array.from(this.cache.keys()),
      lastPreload: localStorage.getItem(this.LAST_PRELOAD_KEY)
    };
  }
}

// Singleton instance
export const billingCache = new BillingCache();

/**
 * Hook for React components to use billing cache
 */
export function useBillingCache() {
  return {
    preloadBillingData: (orderId) => billingCache.preloadBillingData(orderId),
    getCachedBillingData: (orderId) => billingCache.getCachedBillingData(orderId),
    getBillingData: (orderId) => billingCache.getBillingData(orderId),
    invalidateOrder: (orderId) => billingCache.invalidateOrder(orderId),
    backgroundSync: (activeOrderIds) => billingCache.backgroundSync(activeOrderIds),
    clearCache: () => billingCache.clearCache(),
    getCacheStats: () => billingCache.getCacheStats()
  };
}

export default billingCache;