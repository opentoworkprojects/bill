/**
 * Menu Cache Manager
 * Multi-layer caching for menu items with stale-while-revalidate pattern
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

/**
 * Cache entry structure
 * @typedef {Object} CacheEntry
 * @property {Array<Object>} items - Menu items
 * @property {number} timestamp - Cache timestamp
 * @property {number} version - Cache version
 * @property {string} userId - User ID who cached the data
 */

/**
 * Cache metadata structure
 * @typedef {Object} CacheMetadata
 * @property {number} version - Cache version
 * @property {string} userId - User ID
 * @property {number} timestamp - Cache timestamp
 * @property {number} itemCount - Number of cached items
 * @property {number} lastSyncTimestamp - Last sync timestamp
 */

class MenuCacheManager {
  constructor() {
    // Memory cache (fastest)
    this.memoryCache = {
      items: null,
      timestamp: 0,
      version: 1
    };

    // Configuration
    this.config = {
      localStorageKey: 'billbyte_menu_cache_v1',
      metadataKey: 'billbyte_menu_cache_metadata',
      cacheTTL: 300000, // 5 minutes
      persistentCacheTTL: 1800000, // 30 minutes
      maxCacheSize: 1000, // Maximum number of items to cache
      cacheVersion: 1
    };

    this.debugMode = process.env.NODE_ENV === 'development';

    // Load cache from localStorage on initialization
    this.loadFromLocalStorage();
  }

  /**
   * Log debug messages in development mode
   */
  log(message, data = null) {
    if (this.debugMode) {
      const timestamp = new Date().toISOString();
      console.log(`[MenuCache ${timestamp}] ${message}`, data || '');
    }
  }

  /**
   * Get current user ID from localStorage
   * @returns {string|null} - User ID or null
   */
  getCurrentUserId() {
    try {
      // Try to get user ID from token or user data
      const token = localStorage.getItem('token');
      if (token) {
        // Simple extraction - in production, decode JWT properly
        return token.substring(0, 20); // Use first 20 chars as user identifier
      }
      
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.id || user.email || null;
      }
    } catch (error) {
      this.log('Failed to get current user ID', error);
    }
    return null;
  }

  /**
   * Get cached items (memory first, then localStorage)
   * @returns {Array<Object>|null} - Cached items or null
   */
  getCachedItems() {
    const startTime = Date.now();
    const userId = this.getCurrentUserId();

    // Try memory cache first
    if (this.memoryCache.items && this.memoryCache.items.length > 0) {
      const age = Date.now() - this.memoryCache.timestamp;
      
      if (age < this.config.cacheTTL) {
        this.log(`Memory cache hit (age: ${age}ms)`, {
          itemCount: this.memoryCache.items.length,
          duration: Date.now() - startTime
        });
        return this.memoryCache.items;
      } else {
        this.log(`Memory cache expired (age: ${age}ms)`);
      }
    }

    // Try localStorage cache
    try {
      const stored = localStorage.getItem(this.config.localStorageKey);
      if (stored) {
        const cacheEntry = JSON.parse(stored);
        const age = Date.now() - cacheEntry.timestamp;

        // Check if cache is valid
        if (age < this.config.persistentCacheTTL) {
          // Check if cache belongs to current user
          if (cacheEntry.userId === userId || !userId) {
            // Update memory cache
            this.memoryCache = {
              items: cacheEntry.items,
              timestamp: cacheEntry.timestamp,
              version: cacheEntry.version
            };

            this.log(`LocalStorage cache hit (age: ${age}ms)`, {
              itemCount: cacheEntry.items.length,
              duration: Date.now() - startTime
            });

            return cacheEntry.items;
          } else {
            this.log('Cache belongs to different user, invalidating');
            this.invalidateCache();
          }
        } else {
          this.log(`LocalStorage cache expired (age: ${age}ms)`);
        }
      }
    } catch (error) {
      this.log('Failed to read from localStorage cache', error);
      this.handleCacheError(error);
    }

    this.log('Cache miss', { duration: Date.now() - startTime });
    return null;
  }

  /**
   * Set cached items (updates both memory and localStorage)
   * @param {Array<Object>} items - Menu items to cache
   * @returns {boolean} - Success status
   */
  setCachedItems(items) {
    const startTime = Date.now();

    if (!Array.isArray(items)) {
      this.log('Invalid items provided to setCachedItems', items);
      return false;
    }

    // Limit cache size
    const itemsToCache = items.slice(0, this.config.maxCacheSize);
    if (items.length > this.config.maxCacheSize) {
      this.log(`Cache size limited to ${this.config.maxCacheSize} items (had ${items.length})`);
    }

    const timestamp = Date.now();
    const userId = this.getCurrentUserId();

    // Update memory cache
    this.memoryCache = {
      items: itemsToCache,
      timestamp,
      version: this.config.cacheVersion
    };

    // Update localStorage cache
    try {
      const cacheEntry = {
        items: itemsToCache,
        timestamp,
        version: this.config.cacheVersion,
        userId
      };

      localStorage.setItem(
        this.config.localStorageKey,
        JSON.stringify(cacheEntry)
      );

      // Update metadata
      this.updateMetadata({
        version: this.config.cacheVersion,
        userId,
        timestamp,
        itemCount: itemsToCache.length,
        lastSyncTimestamp: timestamp
      });

      this.log(`Cache updated with ${itemsToCache.length} items`, {
        duration: Date.now() - startTime
      });

      return true;
    } catch (error) {
      this.log('Failed to write to localStorage cache', error);
      this.handleCacheError(error);
      return false;
    }
  }

  /**
   * Update cache metadata
   * @param {CacheMetadata} metadata - Metadata to store
   */
  updateMetadata(metadata) {
    try {
      localStorage.setItem(
        this.config.metadataKey,
        JSON.stringify(metadata)
      );
    } catch (error) {
      this.log('Failed to update cache metadata', error);
    }
  }

  /**
   * Get cache metadata
   * @returns {CacheMetadata|null} - Cache metadata or null
   */
  getMetadata() {
    try {
      const stored = localStorage.getItem(this.config.metadataKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      this.log('Failed to read cache metadata', error);
    }
    return null;
  }

  /**
   * Check if cache is stale (older than 5 minutes)
   * @returns {boolean} - True if cache is stale
   */
  isCacheStale() {
    const items = this.getCachedItems();
    if (!items) return true;

    const age = Date.now() - this.memoryCache.timestamp;
    const isStale = age > this.config.cacheTTL;

    if (isStale) {
      this.log(`Cache is stale (age: ${age}ms, TTL: ${this.config.cacheTTL}ms)`);
    }

    return isStale;
  }

  /**
   * Invalidate cache (clear all cached data)
   */
  invalidateCache() {
    this.log('Invalidating cache');

    // Clear memory cache
    this.memoryCache = {
      items: null,
      timestamp: 0,
      version: this.config.cacheVersion
    };

    // Clear localStorage cache
    try {
      localStorage.removeItem(this.config.localStorageKey);
      localStorage.removeItem(this.config.metadataKey);
    } catch (error) {
      this.log('Failed to clear localStorage cache', error);
    }
  }

  /**
   * Load cache from localStorage
   */
  loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem(this.config.localStorageKey);
      if (stored) {
        const cacheEntry = JSON.parse(stored);
        const age = Date.now() - cacheEntry.timestamp;
        const userId = this.getCurrentUserId();

        // Only load if not expired and belongs to current user
        if (age < this.config.persistentCacheTTL) {
          // Check if cache belongs to current user
          if (cacheEntry.userId === userId || !userId || !cacheEntry.userId) {
            this.memoryCache = {
              items: cacheEntry.items,
              timestamp: cacheEntry.timestamp,
              version: cacheEntry.version
            };

            this.log(`Cache loaded from localStorage`, {
              itemCount: cacheEntry.items.length,
              age
            });
          } else {
            this.log('Cache belongs to different user, not loading');
            this.invalidateCache();
          }
        } else {
          this.log('Stored cache expired, not loading');
          this.invalidateCache();
        }
      }
    } catch (error) {
      this.log('Failed to load cache from localStorage', error);
      this.handleCacheError(error);
    }
  }

  /**
   * Merge cached data with fresh server data
   * @param {Array<Object>} serverItems - Fresh items from server
   * @returns {Array<Object>} - Merged items
   */
  mergeCacheWithServerData(serverItems) {
    const cachedItems = this.getCachedItems();

    if (!cachedItems || cachedItems.length === 0) {
      return serverItems;
    }

    // Create map of server items for quick lookup
    const serverItemsMap = new Map();
    serverItems.forEach(item => {
      serverItemsMap.set(item.id, item);
    });

    // Detect changes
    const changes = {
      added: [],
      updated: [],
      removed: []
    };

    // Find added and updated items
    serverItems.forEach(serverItem => {
      const cachedItem = cachedItems.find(item => item.id === serverItem.id);
      
      if (!cachedItem) {
        changes.added.push(serverItem);
      } else if (this.itemHasChanged(cachedItem, serverItem)) {
        changes.updated.push(serverItem);
      }
    });

    // Find removed items
    cachedItems.forEach(cachedItem => {
      if (!serverItemsMap.has(cachedItem.id)) {
        changes.removed.push(cachedItem);
      }
    });

    this.log('Cache merge completed', {
      added: changes.added.length,
      updated: changes.updated.length,
      removed: changes.removed.length
    });

    return serverItems;
  }

  /**
   * Check if item has changed
   * @param {Object} cachedItem - Cached item
   * @param {Object} serverItem - Server item
   * @returns {boolean} - True if item has changed
   */
  itemHasChanged(cachedItem, serverItem) {
    // Compare key fields
    const keyFields = [
      'name',
      'price',
      'available',
      'description',
      'image_url',
      'updated_at',
      'is_popular',
      'is_vegetarian',
      'is_spicy'
    ];

    return keyFields.some(field => cachedItem[field] !== serverItem[field]);
  }

  /**
   * Update single item in cache
   * @param {Object} item - Updated item
   * @returns {boolean} - Success status
   */
  updateCachedItem(item) {
    if (!item || !item.id) {
      this.log('Invalid item provided to updateCachedItem', item);
      return false;
    }

    const cachedItems = this.getCachedItems();
    if (!cachedItems) {
      // No cache to update
      return false;
    }

    const itemIndex = cachedItems.findIndex(i => i.id === item.id);
    
    if (itemIndex >= 0) {
      // Update existing item
      cachedItems[itemIndex] = item;
      this.log(`Updated item ${item.id} in cache`);
    } else {
      // Add new item
      cachedItems.push(item);
      this.log(`Added item ${item.id} to cache`);
    }

    return this.setCachedItems(cachedItems);
  }

  /**
   * Remove item from cache
   * @param {string} itemId - Item ID to remove
   * @returns {boolean} - Success status
   */
  removeCachedItem(itemId) {
    if (!itemId) {
      this.log('Invalid itemId provided to removeCachedItem', itemId);
      return false;
    }

    const cachedItems = this.getCachedItems();
    if (!cachedItems) {
      return false;
    }

    const filteredItems = cachedItems.filter(item => item.id !== itemId);
    
    if (filteredItems.length < cachedItems.length) {
      this.log(`Removed item ${itemId} from cache`);
      return this.setCachedItems(filteredItems);
    }

    return false;
  }

  /**
   * Handle cache errors (e.g., quota exceeded)
   * @param {Error} error - Error object
   */
  handleCacheError(error) {
    if (error.name === 'QuotaExceededError') {
      this.log('LocalStorage quota exceeded, clearing cache');
      this.invalidateCache();
    } else if (error.name === 'SecurityError') {
      this.log('LocalStorage access denied (private browsing?)');
    } else {
      this.log('Cache error', error);
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} - Cache statistics
   */
  getStats() {
    const metadata = this.getMetadata();
    const cachedItems = this.getCachedItems();
    const memoryCacheAge = Date.now() - this.memoryCache.timestamp;

    return {
      memoryCacheSize: this.memoryCache.items?.length || 0,
      memoryCacheAge,
      memoryCacheValid: memoryCacheAge < this.config.cacheTTL,
      localStorageCacheSize: cachedItems?.length || 0,
      cacheStale: this.isCacheStale(),
      cacheTTL: this.config.cacheTTL,
      persistentCacheTTL: this.config.persistentCacheTTL,
      metadata,
      userId: this.getCurrentUserId()
    };
  }

  /**
   * Clear all cache data
   */
  clear() {
    this.invalidateCache();
    this.log('Cache cleared');
  }
}

// Create singleton instance
const menuCache = new MenuCacheManager();

// Export both class and singleton
export { MenuCacheManager };
export default menuCache;
