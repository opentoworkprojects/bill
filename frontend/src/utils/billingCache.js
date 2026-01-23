/**
 * Billing Data Cache for Instant Bill & Pay Experience
 * Pre-loads and caches billing data to eliminate 2-3 second delays
 */

import axios from 'axios';
import { API } from '../App';
import { performanceMonitor, trackCacheHit, trackCacheMiss } from './performanceMonitor';

class BillingCache {
  constructor() {
    this.cache = new Map();
    this.preloadPromises = new Map();
    this.CACHE_TTL = 60000; // 1 minute cache
  }

  /**
   * Pre-load billing data for an order (called when order is displayed)
   */
  async preloadBillingData(orderId) {
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
    } else {
      trackCacheMiss(orderId, 'not_found');
    }
    
    return null;
  }

  /**
   * Get billing data with cache-first strategy
   */
  async getBillingData(orderId) {
    // Try cache first
    const cached = this.getCachedBillingData(orderId);
    if (cached) {
      return cached;
    }

    // Fetch fresh data
    console.log(`🔄 Fetching fresh billing data for order ${orderId}`);
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
   * Cache data with timestamp
   */
  _cacheData(orderId, data) {
    this.cache.set(orderId, {
      data,
      timestamp: Date.now()
    });

    // Clean up old cache entries (keep only last 20)
    if (this.cache.size > 20) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toDelete = entries.slice(0, entries.length - 20);
      toDelete.forEach(([key]) => this.cache.delete(key));
    }
  }

  /**
   * Invalidate cache for an order (after updates)
   */
  invalidateOrder(orderId) {
    this.cache.delete(orderId);
    this.preloadPromises.delete(orderId);
    console.log(`🗑️ Cache invalidated for order ${orderId}`);
  }

  /**
   * Pre-load billing data for multiple orders (batch)
   */
  async preloadMultipleOrders(orderIds) {
    const promises = orderIds.map(orderId => 
      this.preloadBillingData(orderId).catch(error => {
        console.warn(`Failed to preload order ${orderId}:`, error);
        return null;
      })
    );

    const results = await Promise.allSettled(promises);
    const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
    console.log(`💾 Preloaded billing data for ${successful}/${orderIds.length} orders`);
  }

  /**
   * Clear all cache
   */
  clearCache() {
    this.cache.clear();
    this.preloadPromises.clear();
    console.log('🗑️ Billing cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      cacheSize: this.cache.size,
      preloadingCount: this.preloadPromises.size,
      cacheKeys: Array.from(this.cache.keys())
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
    clearCache: () => billingCache.clearCache(),
    getCacheStats: () => billingCache.getCacheStats()
  };
}

export default billingCache;