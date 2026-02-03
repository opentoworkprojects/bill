/**
 * Order Polling Manager - Coordinates all order refresh operations to prevent duplicates
 * 
 * This utility ensures that only one order refresh operation happens at a time,
 * preventing duplicate orders from appearing during overlapping polling cycles.
 */

class OrderPollingManager {
  constructor() {
    this.isRefreshing = false;
    this.pendingRefresh = false;
    this.lastRefreshTime = 0;
    this.refreshPromise = null;
    this.abortController = null;
    this.refreshCallbacks = new Set();
    
    // Minimum time between refreshes (in milliseconds)
    this.MIN_REFRESH_INTERVAL = 1000; // 1 second
    
    console.log('🔄 OrderPollingManager initialized');
  }
  
  /**
   * Register a callback to be called when orders are refreshed
   */
  onRefresh(callback) {
    this.refreshCallbacks.add(callback);
    return () => this.refreshCallbacks.delete(callback);
  }
  
  /**
   * Check if a refresh is currently in progress
   */
  isRefreshInProgress() {
    return this.isRefreshing;
  }
  
  /**
   * Get time since last refresh
   */
  getTimeSinceLastRefresh() {
    return Date.now() - this.lastRefreshTime;
  }
  
  /**
   * Cancel any in-flight refresh operation
   */
  cancelCurrentRefresh() {
    if (this.abortController) {
      console.log('🚫 Cancelling in-flight refresh operation');
      this.abortController.abort();
      this.abortController = null;
    }
  }
  
  /**
   * Coordinate order refresh to prevent duplicates
   * 
   * @param {Function} refreshFunction - The actual refresh function to execute
   * @param {Object} options - Refresh options
   * @param {boolean} options.force - Force refresh even if one is in progress
   * @param {string} options.source - Source of the refresh request (for logging)
   * @param {boolean} options.immediate - Skip minimum interval check
   * @returns {Promise} - Promise that resolves when refresh is complete
   */
  async coordinateRefresh(refreshFunction, options = {}) {
    const { force = false, source = 'unknown', immediate = false } = options;
    
    console.log(`🔄 Refresh requested from: ${source}`, {
      isRefreshing: this.isRefreshing,
      pendingRefresh: this.pendingRefresh,
      timeSinceLastRefresh: this.getTimeSinceLastRefresh(),
      force,
      immediate
    });
    
    // If refresh is in progress and not forced, queue it
    if (this.isRefreshing && !force) {
      console.log(`⏳ Refresh already in progress, queuing request from: ${source}`);
      this.pendingRefresh = true;
      
      // Wait for current refresh to complete, then execute pending
      if (this.refreshPromise) {
        await this.refreshPromise;
        
        // Execute pending refresh if still needed
        if (this.pendingRefresh) {
          this.pendingRefresh = false;
          return this.coordinateRefresh(refreshFunction, { ...options, force: true });
        }
      }
      return;
    }
    
    // Check minimum interval (unless immediate or forced)
    if (!immediate && !force && this.getTimeSinceLastRefresh() < this.MIN_REFRESH_INTERVAL) {
      console.log(`⏸️ Skipping refresh from ${source} - too soon (${this.getTimeSinceLastRefresh()}ms < ${this.MIN_REFRESH_INTERVAL}ms)`);
      return;
    }
    
    // Cancel any existing refresh
    this.cancelCurrentRefresh();
    
    // Start new refresh
    this.isRefreshing = true;
    this.abortController = new AbortController();
    
    console.log(`🚀 Starting coordinated refresh from: ${source}`);
    
    this.refreshPromise = this.executeRefresh(refreshFunction, source);
    
    try {
      const result = await this.refreshPromise;
      console.log(`✅ Refresh completed successfully from: ${source}`);
      return result;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`🚫 Refresh cancelled from: ${source}`);
      } else {
        console.error(`❌ Refresh failed from: ${source}`, error);
      }
      throw error;
    } finally {
      this.isRefreshing = false;
      this.lastRefreshTime = Date.now();
      this.abortController = null;
      this.refreshPromise = null;
      
      // Execute pending refresh if queued
      if (this.pendingRefresh) {
        this.pendingRefresh = false;
        setTimeout(() => {
          this.coordinateRefresh(refreshFunction, { source: 'pending', force: true });
        }, 100);
      }
    }
  }
  
  /**
   * Execute the actual refresh function with error handling
   */
  async executeRefresh(refreshFunction, source) {
    try {
      // Add abort signal to refresh function if it supports it
      const result = await refreshFunction({
        signal: this.abortController?.signal,
        source
      });
      
      // Notify all registered callbacks
      this.refreshCallbacks.forEach(callback => {
        try {
          callback(result, source);
        } catch (error) {
          console.error('Error in refresh callback:', error);
        }
      });
      
      return result;
    } catch (error) {
      // Don't log abort errors as they're expected
      if (error.name !== 'AbortError') {
        console.error(`Refresh execution error from ${source}:`, error);
      }
      throw error;
    }
  }
  
  /**
   * Force an immediate refresh, cancelling any in-progress operations
   */
  async forceRefresh(refreshFunction, source = 'force') {
    return this.coordinateRefresh(refreshFunction, { 
      force: true, 
      immediate: true, 
      source 
    });
  }
  
  /**
   * Schedule a refresh with debouncing
   */
  scheduleRefresh(refreshFunction, delay = 100, source = 'scheduled') {
    if (this.scheduleTimeout) {
      clearTimeout(this.scheduleTimeout);
    }
    
    this.scheduleTimeout = setTimeout(() => {
      this.coordinateRefresh(refreshFunction, { source });
    }, delay);
  }
  
  /**
   * Clear any scheduled refresh
   */
  clearScheduledRefresh() {
    if (this.scheduleTimeout) {
      clearTimeout(this.scheduleTimeout);
      this.scheduleTimeout = null;
    }
  }
  
  /**
   * Reset the polling manager state
   */
  reset() {
    console.log('🔄 Resetting OrderPollingManager');
    this.cancelCurrentRefresh();
    this.clearScheduledRefresh();
    this.isRefreshing = false;
    this.pendingRefresh = false;
    this.lastRefreshTime = 0;
    this.refreshPromise = null;
    this.refreshCallbacks.clear();
  }
  
  /**
   * Get current status for debugging
   */
  getStatus() {
    return {
      isRefreshing: this.isRefreshing,
      pendingRefresh: this.pendingRefresh,
      lastRefreshTime: this.lastRefreshTime,
      timeSinceLastRefresh: this.getTimeSinceLastRefresh(),
      hasActiveCallbacks: this.refreshCallbacks.size > 0,
      hasScheduledRefresh: !!this.scheduleTimeout
    };
  }
}

// Create singleton instance
const orderPollingManager = new OrderPollingManager();

// Export both the class and singleton for different use cases
export { OrderPollingManager };
export default orderPollingManager;