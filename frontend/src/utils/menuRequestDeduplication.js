/**
 * Menu Request Deduplication Layer
 * Prevents duplicate requests from being sent to the server
 * Requirements: 2.1, 2.2, 2.4, 2.5, 9.1, 9.2, 9.3, 9.4
 */

/**
 * Request metadata structure
 * @typedef {Object} RequestMetadata
 * @property {string} requestId - Unique request identifier
 * @property {string} operationType - Type of operation (create, update, delete, toggle)
 * @property {string} itemId - Menu item ID (optional for creates)
 * @property {number} timestamp - Request start timestamp
 * @property {AbortController} abortController - Controller for request cancellation
 * @property {Promise} promise - Request promise
 */

class MenuRequestDeduplication {
  constructor() {
    this.inFlightRequests = new Map();
    this.requestHistory = [];
    this.debugMode = process.env.NODE_ENV === 'development';
    
    // Configuration
    this.config = {
      maxHistorySize: 100,
      requestTimeout: 30000, // 30 seconds
      cleanupInterval: 60000 // 1 minute
    };

    // Start periodic cleanup
    this.startPeriodicCleanup();
  }

  /**
   * Log debug messages in development mode
   */
  log(message, data = null) {
    if (this.debugMode) {
      const timestamp = new Date().toISOString();
      console.log(`[MenuRequestDedup ${timestamp}] ${message}`, data || '');
    }
  }

  /**
   * Generate unique request key
   * @param {string} operation - Operation type (create, update, delete, toggle)
   * @param {string} itemId - Item ID (optional for creates)
   * @param {Object} formData - Form data for creates (optional)
   * @returns {string} - Unique request key
   */
  generateRequestKey(operation, itemId = null, formData = null) {
    if (operation === 'create' && formData) {
      // For creates, use form data hash to detect duplicates
      const formHash = this.hashFormData(formData);
      return `create_${formHash}`;
    }
    
    // For updates/deletes/toggles, use operation + itemId
    if (itemId) {
      return `${operation}_${itemId}`;
    }
    
    // Fallback to operation + timestamp (shouldn't happen in normal flow)
    return `${operation}_${Date.now()}`;
  }

  /**
   * Hash form data for duplicate detection
   * @param {Object} formData - Form data object
   * @returns {string} - Hash string
   */
  hashFormData(formData) {
    // Create a stable string representation of form data
    const keys = Object.keys(formData).sort();
    const values = keys.map(key => {
      const value = formData[key];
      // Handle different types
      if (value === null || value === undefined) return 'null';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    });
    
    const dataString = keys.join('|') + '|' + values.join('|');
    
    // Simple hash function (djb2)
    let hash = 5381;
    for (let i = 0; i < dataString.length; i++) {
      hash = ((hash << 5) + hash) + dataString.charCodeAt(i);
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Check if request is already in flight
   * @param {string} requestKey - Request key
   * @returns {boolean} - True if request is in flight
   */
  isRequestInFlight(requestKey) {
    const inFlight = this.inFlightRequests.has(requestKey);
    
    if (inFlight) {
      const metadata = this.inFlightRequests.get(requestKey);
      const age = Date.now() - metadata.timestamp;
      
      // Check if request has timed out
      if (age > this.config.requestTimeout) {
        this.log(`Request ${requestKey} timed out after ${age}ms, allowing retry`);
        this.completeRequest(requestKey);
        return false;
      }
      
      this.log(`Request ${requestKey} already in flight (age: ${age}ms)`);
    }
    
    return inFlight;
  }

  /**
   * Register new request
   * @param {string} requestKey - Request key
   * @param {RequestMetadata} metadata - Request metadata
   */
  registerRequest(requestKey, metadata) {
    if (!requestKey || !metadata) {
      this.log('Invalid request registration', { requestKey, metadata });
      return;
    }

    this.inFlightRequests.set(requestKey, {
      ...metadata,
      timestamp: Date.now()
    });

    this.log(`Request registered: ${requestKey}`, {
      operationType: metadata.operationType,
      itemId: metadata.itemId
    });
  }

  /**
   * Complete request (success or failure)
   * @param {string} requestKey - Request key
   * @param {boolean} success - Whether request succeeded
   * @param {Error} error - Error if request failed
   */
  completeRequest(requestKey, success = true, error = null) {
    const metadata = this.inFlightRequests.get(requestKey);
    
    if (!metadata) {
      this.log(`Request ${requestKey} not found for completion`);
      return;
    }

    const duration = Date.now() - metadata.timestamp;

    // Add to history
    this.requestHistory.push({
      requestKey,
      operationType: metadata.operationType,
      itemId: metadata.itemId,
      duration,
      success,
      error: error?.message || null,
      timestamp: Date.now()
    });

    // Limit history size
    if (this.requestHistory.length > this.config.maxHistorySize) {
      this.requestHistory.shift();
    }

    // Remove from in-flight
    this.inFlightRequests.delete(requestKey);

    this.log(`Request completed: ${requestKey}`, {
      success,
      duration,
      error: error?.message
    });
  }

  /**
   * Cancel in-flight request
   * @param {string} requestKey - Request key
   * @returns {boolean} - True if request was cancelled
   */
  cancelRequest(requestKey) {
    const metadata = this.inFlightRequests.get(requestKey);
    
    if (!metadata) {
      this.log(`Request ${requestKey} not found for cancellation`);
      return false;
    }

    // Abort the request
    if (metadata.abortController) {
      metadata.abortController.abort();
      this.log(`Request ${requestKey} aborted`);
    }

    // Complete the request
    this.completeRequest(requestKey, false, new Error('Request cancelled'));
    
    return true;
  }

  /**
   * Execute API call with deduplication
   * @param {string} requestKey - Request key
   * @param {Function} apiCall - API call function that accepts AbortSignal
   * @param {Object} metadata - Additional request metadata
   * @returns {Promise} - API call promise
   */
  async executeWithDeduplication(requestKey, apiCall, metadata = {}) {
    // Check if request already in flight
    if (this.isRequestInFlight(requestKey)) {
      this.log(`Duplicate request blocked: ${requestKey}`);
      
      // Return the existing promise
      const existingMetadata = this.inFlightRequests.get(requestKey);
      if (existingMetadata && existingMetadata.promise) {
        return existingMetadata.promise;
      }
      
      // If no promise available, throw error
      throw new Error('Request already in progress');
    }

    // Create abort controller for cancellation
    const abortController = new AbortController();

    // Execute API call
    const promise = apiCall(abortController.signal)
      .then(result => {
        this.completeRequest(requestKey, true);
        return result;
      })
      .catch(error => {
        // Don't log as error if request was aborted
        if (error.name === 'AbortError') {
          this.log(`Request ${requestKey} was aborted`);
        } else {
          this.completeRequest(requestKey, false, error);
        }
        throw error;
      });

    // Register request
    this.registerRequest(requestKey, {
      requestId: requestKey,
      operationType: metadata.operationType || 'unknown',
      itemId: metadata.itemId || null,
      abortController,
      promise
    });

    return promise;
  }

  /**
   * Get in-flight request count
   * @returns {number} - Number of in-flight requests
   */
  getInFlightCount() {
    return this.inFlightRequests.size;
  }

  /**
   * Get in-flight requests
   * @returns {Array<Object>} - Array of in-flight request metadata
   */
  getInFlightRequests() {
    return Array.from(this.inFlightRequests.entries()).map(([key, metadata]) => ({
      requestKey: key,
      operationType: metadata.operationType,
      itemId: metadata.itemId,
      age: Date.now() - metadata.timestamp
    }));
  }

  /**
   * Get request history
   * @param {number} limit - Maximum number of history entries to return
   * @returns {Array<Object>} - Array of request history entries
   */
  getRequestHistory(limit = 20) {
    return this.requestHistory.slice(-limit);
  }

  /**
   * Get statistics
   * @returns {Object} - Statistics object
   */
  getStats() {
    const successCount = this.requestHistory.filter(r => r.success).length;
    const failureCount = this.requestHistory.filter(r => !r.success).length;
    const totalRequests = this.requestHistory.length;
    
    const durations = this.requestHistory
      .filter(r => r.success)
      .map(r => r.duration);
    
    const averageDuration = durations.length > 0
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length
      : 0;

    return {
      inFlightCount: this.inFlightRequests.size,
      totalRequests,
      successCount,
      failureCount,
      successRate: totalRequests > 0 ? (successCount / totalRequests) * 100 : 0,
      averageDuration: Math.round(averageDuration),
      inFlightRequests: this.getInFlightRequests()
    };
  }

  /**
   * Start periodic cleanup of timed-out requests
   */
  startPeriodicCleanup() {
    this.cleanupInterval = setInterval(() => {
      this.cleanupTimedOutRequests();
    }, this.config.cleanupInterval);
  }

  /**
   * Cleanup timed-out requests
   */
  cleanupTimedOutRequests() {
    const now = Date.now();
    const timedOutKeys = [];

    this.inFlightRequests.forEach((metadata, key) => {
      const age = now - metadata.timestamp;
      if (age > this.config.requestTimeout) {
        timedOutKeys.push(key);
      }
    });

    if (timedOutKeys.length > 0) {
      this.log(`Cleaning up ${timedOutKeys.length} timed-out requests`);
      
      timedOutKeys.forEach(key => {
        const metadata = this.inFlightRequests.get(key);
        if (metadata?.abortController) {
          metadata.abortController.abort();
        }
        this.completeRequest(key, false, new Error('Request timeout'));
      });
    }
  }

  /**
   * Clear all in-flight requests and history
   */
  clear() {
    // Abort all in-flight requests
    this.inFlightRequests.forEach((metadata, key) => {
      if (metadata.abortController) {
        metadata.abortController.abort();
      }
    });

    this.inFlightRequests.clear();
    this.requestHistory = [];
    
    this.log('All requests cleared');
  }

  /**
   * Destroy and cleanup
   */
  destroy() {
    this.clear();
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    this.log('Request deduplication destroyed');
  }
}

// Create singleton instance
const menuRequestDeduplication = new MenuRequestDeduplication();

// Export both class and singleton
export { MenuRequestDeduplication };
export default menuRequestDeduplication;
