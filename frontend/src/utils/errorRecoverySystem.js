/**
 * Error Recovery System for Active Orders Display
 * 
 * This utility provides comprehensive error handling and recovery mechanisms
 * for the active orders system, including retry logic, fallback strategies,
 * and automatic recovery procedures.
 */

import performanceLogger from './performanceLogger';
import activeOrdersCache from './activeOrdersCache';
import activeOrdersSync from './activeOrdersSync';

class ErrorRecoverySystem {
  constructor() {
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000, // 1 second
      maxDelay: 10000, // 10 seconds
      backoffMultiplier: 2,
      jitterFactor: 0.1
    };
    
    this.circuitBreaker = {
      failureThreshold: 5,
      resetTimeout: 30000, // 30 seconds
      halfOpenMaxCalls: 3,
      state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
      failureCount: 0,
      lastFailureTime: 0,
      successCount: 0
    };
    
    this.fallbackStrategies = {
      CACHE_FIRST: 'cache_first',
      OFFLINE_MODE: 'offline_mode',
      DEGRADED_SERVICE: 'degraded_service',
      MANUAL_REFRESH: 'manual_refresh'
    };
    
    this.currentFallbackStrategy = null;
    this.recoveryAttempts = new Map(); // operationId -> attempt count
    this.errorHistory = [];
    this.maxErrorHistory = 100;
    
    this.debugMode = process.env.NODE_ENV === 'development';
    
    this.log('ErrorRecoverySystem initialized');
    this.initializeErrorHandlers();
  }
  
  /**
   * Log debug messages
   */
  log(message, data = null) {
    if (this.debugMode) {
      const timestamp = new Date().toISOString();
      console.log(`[ErrorRecovery ${timestamp}] ${message}`, data || '');
    }
    
    performanceLogger.debug('ERROR', message, data);
  }
  
  /**
   * Initialize global error handlers
   */
  initializeErrorHandlers() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleUnhandledError('unhandled_promise_rejection', event.reason);
    });
    
    // Handle JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleUnhandledError('javascript_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      });
    });
    
    this.log('Global error handlers initialized');
  }
  
  /**
   * Handle unhandled errors
   */
  handleUnhandledError(type, error) {
    this.log(`🚨 UNHANDLED ERROR: ${type}`, error);
    
    performanceLogger.critical('ERROR', `Unhandled error: ${type}`, {
      error: error?.message || error,
      stack: error?.stack,
      type
    });
    
    this.recordError(type, error, 'unhandled');
    
    // Trigger recovery if error affects active orders system
    if (this.isActiveOrdersRelatedError(error)) {
      this.triggerRecovery('unhandled_error', { type, error });
    }
  }
  
  /**
   * Check if error is related to active orders system
   */
  isActiveOrdersRelatedError(error) {
    const errorString = error?.message || error?.toString() || '';
    const activeOrdersKeywords = [
      'activeOrders',
      'orderSync',
      'orderCache',
      'fetchOrders',
      'orderPolling'
    ];
    
    return activeOrdersKeywords.some(keyword => 
      errorString.toLowerCase().includes(keyword.toLowerCase())
    );
  }
  
  /**
   * Execute operation with retry logic
   * @param {Function} operation - Operation to execute
   * @param {Object} options - Retry options
   * @returns {Promise} - Operation result
   */
  async executeWithRetry(operation, options = {}) {
    const {
      operationId = `op_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      maxRetries = this.retryConfig.maxRetries,
      baseDelay = this.retryConfig.baseDelay,
      context = {}
    } = options;
    
    // Check circuit breaker
    if (!this.canExecute()) {
      throw new Error('Circuit breaker is OPEN - operation blocked');
    }
    
    let lastError;
    const startTime = Date.now();
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        this.log(`🔄 Executing operation: ${operationId} (attempt ${attempt + 1}/${maxRetries + 1})`);
        
        const result = await operation({ attempt, operationId, context });
        
        // Success - reset circuit breaker
        this.recordSuccess();
        
        const duration = Date.now() - startTime;
        this.log(`✅ Operation succeeded: ${operationId} in ${duration}ms`);
        
        performanceLogger.info('ERROR', `Operation succeeded after ${attempt + 1} attempts`, {
          operationId,
          attempts: attempt + 1,
          duration,
          context
        });
        
        return result;
        
      } catch (error) {
        lastError = error;
        
        this.log(`❌ Operation failed: ${operationId} (attempt ${attempt + 1})`, error);
        
        // Record failure
        this.recordFailure(error);
        this.recordError(operationId, error, 'retry_attempt', { attempt, context });
        
        // Don't retry on certain errors
        if (this.isNonRetryableError(error)) {
          this.log(`🚫 Non-retryable error for ${operationId}`, error);
          break;
        }
        
        // Don't delay on last attempt
        if (attempt < maxRetries) {
          const delay = this.calculateDelay(attempt, baseDelay);
          this.log(`⏳ Waiting ${delay}ms before retry ${attempt + 2}`);
          await this.sleep(delay);
        }
      }
    }
    
    // All retries failed
    const totalDuration = Date.now() - startTime;
    this.log(`💥 Operation failed permanently: ${operationId} after ${totalDuration}ms`);
    
    performanceLogger.error('ERROR', `Operation failed after all retries`, {
      operationId,
      attempts: maxRetries + 1,
      totalDuration,
      error: lastError?.message,
      context
    });
    
    // Trigger fallback strategy
    this.triggerFallback(operationId, lastError, context);
    
    throw lastError;
  }
  
  /**
   * Check if error is non-retryable
   */
  isNonRetryableError(error) {
    const nonRetryablePatterns = [
      /400/i, // Bad Request
      /401/i, // Unauthorized
      /403/i, // Forbidden
      /404/i, // Not Found
      /422/i, // Unprocessable Entity
      /validation/i,
      /invalid/i,
      /malformed/i
    ];
    
    const errorString = error?.message || error?.toString() || '';
    return nonRetryablePatterns.some(pattern => pattern.test(errorString));
  }
  
  /**
   * Calculate retry delay with exponential backoff and jitter
   */
  calculateDelay(attempt, baseDelay) {
    const exponentialDelay = baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt);
    const cappedDelay = Math.min(exponentialDelay, this.retryConfig.maxDelay);
    
    // Add jitter to prevent thundering herd
    const jitter = cappedDelay * this.retryConfig.jitterFactor * Math.random();
    
    return Math.floor(cappedDelay + jitter);
  }
  
  /**
   * Sleep for specified duration
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Check if operation can execute (circuit breaker logic)
   */
  canExecute() {
    const now = Date.now();
    
    switch (this.circuitBreaker.state) {
      case 'CLOSED':
        return true;
      
      case 'OPEN':
        if (now - this.circuitBreaker.lastFailureTime >= this.circuitBreaker.resetTimeout) {
          this.circuitBreaker.state = 'HALF_OPEN';
          this.circuitBreaker.successCount = 0;
          this.log('🔄 Circuit breaker: OPEN -> HALF_OPEN');
          return true;
        }
        return false;
      
      case 'HALF_OPEN':
        return this.circuitBreaker.successCount < this.circuitBreaker.halfOpenMaxCalls;
      
      default:
        return true;
    }
  }
  
  /**
   * Record successful operation
   */
  recordSuccess() {
    if (this.circuitBreaker.state === 'HALF_OPEN') {
      this.circuitBreaker.successCount++;
      
      if (this.circuitBreaker.successCount >= this.circuitBreaker.halfOpenMaxCalls) {
        this.circuitBreaker.state = 'CLOSED';
        this.circuitBreaker.failureCount = 0;
        this.log('✅ Circuit breaker: HALF_OPEN -> CLOSED');
      }
    } else if (this.circuitBreaker.state === 'CLOSED') {
      this.circuitBreaker.failureCount = Math.max(0, this.circuitBreaker.failureCount - 1);
    }
  }
  
  /**
   * Record failed operation
   */
  recordFailure(error) {
    this.circuitBreaker.failureCount++;
    this.circuitBreaker.lastFailureTime = Date.now();
    
    if (this.circuitBreaker.state === 'CLOSED' && 
        this.circuitBreaker.failureCount >= this.circuitBreaker.failureThreshold) {
      this.circuitBreaker.state = 'OPEN';
      this.log('🚨 Circuit breaker: CLOSED -> OPEN');
      
      performanceLogger.warn('ERROR', 'Circuit breaker opened due to failures', {
        failureCount: this.circuitBreaker.failureCount,
        threshold: this.circuitBreaker.failureThreshold
      });
    } else if (this.circuitBreaker.state === 'HALF_OPEN') {
      this.circuitBreaker.state = 'OPEN';
      this.log('🚨 Circuit breaker: HALF_OPEN -> OPEN');
    }
  }
  
  /**
   * Record error in history
   */
  recordError(operationId, error, category, metadata = {}) {
    const errorRecord = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now(),
      operationId,
      category,
      error: {
        message: error?.message || error?.toString() || 'Unknown error',
        stack: error?.stack,
        name: error?.name,
        code: error?.code
      },
      metadata,
      recovered: false
    };
    
    this.errorHistory.push(errorRecord);
    
    // Maintain history size
    if (this.errorHistory.length > this.maxErrorHistory) {
      this.errorHistory.shift();
    }
    
    return errorRecord.id;
  }
  
  /**
   * Trigger fallback strategy
   */
  async triggerFallback(operationId, error, context) {
    this.log(`🔄 Triggering fallback for operation: ${operationId}`, { error: error?.message, context });
    
    // Determine best fallback strategy
    const strategy = this.selectFallbackStrategy(error, context);
    this.currentFallbackStrategy = strategy;
    
    performanceLogger.warn('ERROR', `Fallback strategy activated: ${strategy}`, {
      operationId,
      error: error?.message,
      context
    });
    
    try {
      switch (strategy) {
        case this.fallbackStrategies.CACHE_FIRST:
          return await this.executeCacheFirstFallback(context);
        
        case this.fallbackStrategies.OFFLINE_MODE:
          return await this.executeOfflineModeFallback(context);
        
        case this.fallbackStrategies.DEGRADED_SERVICE:
          return await this.executeDegradedServiceFallback(context);
        
        case this.fallbackStrategies.MANUAL_REFRESH:
          return await this.executeManualRefreshFallback(context);
        
        default:
          throw new Error(`Unknown fallback strategy: ${strategy}`);
      }
    } catch (fallbackError) {
      this.log(`❌ Fallback strategy failed: ${strategy}`, fallbackError);
      
      performanceLogger.error('ERROR', `Fallback strategy failed: ${strategy}`, {
        operationId,
        fallbackError: fallbackError?.message,
        originalError: error?.message
      });
      
      throw fallbackError;
    }
  }
  
  /**
   * Select appropriate fallback strategy
   */
  selectFallbackStrategy(error, context) {
    const errorString = error?.message || error?.toString() || '';
    
    // Network errors -> cache first
    if (errorString.includes('network') || errorString.includes('fetch')) {
      return this.fallbackStrategies.CACHE_FIRST;
    }
    
    // Server errors -> offline mode
    if (errorString.includes('500') || errorString.includes('503')) {
      return this.fallbackStrategies.OFFLINE_MODE;
    }
    
    // Rate limiting -> degraded service
    if (errorString.includes('429') || errorString.includes('rate limit')) {
      return this.fallbackStrategies.DEGRADED_SERVICE;
    }
    
    // Default to cache first
    return this.fallbackStrategies.CACHE_FIRST;
  }
  
  /**
   * Execute cache-first fallback
   */
  async executeCacheFirstFallback(context) {
    this.log('💾 Executing cache-first fallback');
    
    try {
      const cachedOrders = activeOrdersCache.getActiveOrders();
      
      if (cachedOrders.length > 0) {
        this.log(`✅ Cache fallback successful: ${cachedOrders.length} orders`);
        
        // Notify UI about fallback mode
        this.notifyFallbackMode('cache_first', {
          ordersCount: cachedOrders.length,
          message: 'Using cached data due to network issues'
        });
        
        return {
          orders: cachedOrders,
          source: 'cache_fallback',
          fallbackStrategy: 'cache_first'
        };
      } else {
        throw new Error('No cached data available');
      }
    } catch (cacheError) {
      this.log('❌ Cache fallback failed', cacheError);
      throw cacheError;
    }
  }
  
  /**
   * Execute offline mode fallback
   */
  async executeOfflineModeFallback(context) {
    this.log('📴 Executing offline mode fallback');
    
    // Get any available cached data
    const cachedOrders = activeOrdersCache.getActiveOrders();
    
    // Notify UI about offline mode
    this.notifyFallbackMode('offline_mode', {
      ordersCount: cachedOrders.length,
      message: 'Operating in offline mode - some features may be limited'
    });
    
    return {
      orders: cachedOrders,
      source: 'offline_fallback',
      fallbackStrategy: 'offline_mode',
      isOffline: true
    };
  }
  
  /**
   * Execute degraded service fallback
   */
  async executeDegradedServiceFallback(context) {
    this.log('⚠️ Executing degraded service fallback');
    
    // Reduce polling frequency and use cached data
    const cachedOrders = activeOrdersCache.getActiveOrders();
    
    // Notify UI about degraded service
    this.notifyFallbackMode('degraded_service', {
      ordersCount: cachedOrders.length,
      message: 'Service is experiencing high load - updates may be delayed'
    });
    
    return {
      orders: cachedOrders,
      source: 'degraded_fallback',
      fallbackStrategy: 'degraded_service',
      isDegraded: true
    };
  }
  
  /**
   * Execute manual refresh fallback
   */
  async executeManualRefreshFallback(context) {
    this.log('🔄 Executing manual refresh fallback');
    
    const cachedOrders = activeOrdersCache.getActiveOrders();
    
    // Notify UI to show manual refresh option
    this.notifyFallbackMode('manual_refresh', {
      ordersCount: cachedOrders.length,
      message: 'Automatic updates are unavailable - please refresh manually'
    });
    
    return {
      orders: cachedOrders,
      source: 'manual_fallback',
      fallbackStrategy: 'manual_refresh',
      requiresManualRefresh: true
    };
  }
  
  /**
   * Notify UI about fallback mode
   */
  notifyFallbackMode(strategy, details) {
    const fallbackEvent = new CustomEvent('errorRecoveryFallback', {
      detail: {
        strategy,
        details,
        timestamp: Date.now()
      }
    });
    
    window.dispatchEvent(fallbackEvent);
  }
  
  /**
   * Trigger automatic recovery
   */
  async triggerRecovery(reason, context = {}) {
    this.log(`🔧 Triggering recovery: ${reason}`, context);
    
    performanceLogger.info('ERROR', `Recovery triggered: ${reason}`, context);
    
    try {
      // Reset circuit breaker if it's been open for a while
      if (this.circuitBreaker.state === 'OPEN' && 
          Date.now() - this.circuitBreaker.lastFailureTime > this.circuitBreaker.resetTimeout) {
        this.circuitBreaker.state = 'HALF_OPEN';
        this.circuitBreaker.successCount = 0;
        this.log('🔄 Circuit breaker reset to HALF_OPEN for recovery');
      }
      
      // Clear current fallback strategy
      this.currentFallbackStrategy = null;
      
      // Attempt to refresh active orders
      await this.attemptSystemRecovery();
      
      // Notify successful recovery
      this.notifyRecoverySuccess(reason);
      
    } catch (recoveryError) {
      this.log('❌ Recovery failed', recoveryError);
      
      performanceLogger.error('ERROR', `Recovery failed: ${reason}`, {
        error: recoveryError?.message,
        context
      });
      
      throw recoveryError;
    }
  }
  
  /**
   * Attempt system recovery
   */
  async attemptSystemRecovery() {
    this.log('🔧 Attempting system recovery');
    
    // Try to sync with server
    try {
      // This would typically call the main fetch function
      // For now, we'll just verify the cache is working
      const cachedOrders = activeOrdersCache.getActiveOrders();
      
      // Trigger sync notification
      activeOrdersSync.triggerImmediateRefresh('recovery-attempt');
      
      this.log(`✅ System recovery successful: ${cachedOrders.length} orders available`);
      
    } catch (error) {
      this.log('❌ System recovery failed', error);
      throw error;
    }
  }
  
  /**
   * Notify successful recovery
   */
  notifyRecoverySuccess(reason) {
    const recoveryEvent = new CustomEvent('errorRecoverySuccess', {
      detail: {
        reason,
        timestamp: Date.now()
      }
    });
    
    window.dispatchEvent(recoveryEvent);
  }
  
  /**
   * Get error statistics
   */
  getErrorStats() {
    const recentErrors = this.errorHistory.filter(
      error => Date.now() - error.timestamp < 3600000 // Last hour
    );
    
    const errorsByCategory = {};
    recentErrors.forEach(error => {
      errorsByCategory[error.category] = (errorsByCategory[error.category] || 0) + 1;
    });
    
    return {
      totalErrors: this.errorHistory.length,
      recentErrors: recentErrors.length,
      errorsByCategory,
      circuitBreakerState: this.circuitBreaker.state,
      currentFallbackStrategy: this.currentFallbackStrategy,
      recoveredErrors: this.errorHistory.filter(e => e.recovered).length
    };
  }
  
  /**
   * Clear error history
   */
  clearErrorHistory() {
    this.errorHistory = [];
    this.log('Error history cleared');
  }
  
  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker() {
    this.circuitBreaker.state = 'CLOSED';
    this.circuitBreaker.failureCount = 0;
    this.circuitBreaker.successCount = 0;
    this.log('Circuit breaker manually reset');
  }
}

// Create singleton instance
const errorRecoverySystem = new ErrorRecoverySystem();

// Export both class and singleton
export { ErrorRecoverySystem };
export default errorRecoverySystem;