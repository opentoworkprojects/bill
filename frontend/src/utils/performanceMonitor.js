/**
 * Comprehensive Performance Monitor for Fast Order Creation Optimization
 * Tracks all performance metrics across UI, API, cache, and real-time operations
 * Requirements: 11.1, 11.2, 11.3, 11.4
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.thresholds = {
      // UI Response Time Thresholds (Requirements 1.1-1.4)
      ui_click: 50,           // Visual feedback within 50ms
      ui_typing: 100,         // Search/input response within 100ms
      ui_navigation: 200,     // Menu category navigation within 200ms
      ui_cart_update: 100,    // Cart updates within 100ms
      
      // Menu Performance Thresholds (Requirements 2.1-2.3)
      menu_load: 500,         // Menu display within 500ms
      menu_search: 200,       // Search results within 200ms
      menu_item_details: 300, // Item details within 300ms
      
      // Payment Processing Thresholds (Requirements 4.1, 4.3, 4.4)
      payment_validation: 300, // Payment validation within 300ms
      payment_confirmation: 500, // Payment confirmation within 500ms
      payment_error: 200,     // Error display within 200ms
      billing_load: 1000,     // Billing page load within 1s (with preloaded data)
      
      // API Performance Thresholds (Requirements 5.1, 5.2)
      api_response: 500,      // 95% of API requests within 500ms
      database_query: 200,    // Database queries within 200ms
      
      // Cache Performance Thresholds (Requirements 6.1, 6.2)
      cache_memory: 10,       // Memory cache within 10ms
      cache_session: 50,      // Session data without DB queries
      
      // Real-time Update Thresholds (Requirements 7.1, 7.2, 10.1, 10.2)
      realtime_kitchen: 2000, // Kitchen display updates within 2s
      realtime_client: 3000,  // Client updates within 3s
      
      // Progressive Loading Thresholds (Requirements 9.1, 9.2)
      app_load: 1000,         // Core interface within 1s
      image_placeholder: 100, // Image placeholders within 100ms
    };
    
    this.enabled = process.env.NODE_ENV === 'development' || localStorage.getItem('enablePerformanceMonitoring') === 'true';
    this.alertCallbacks = new Set();
    this.dashboardData = {
      responseTimeHistory: [],
      thresholdViolations: [],
      performanceMetrics: new Map()
    };
    
    // Initialize Web Vitals monitoring
    this.initializeWebVitals();
  }

  /**
   * Initialize Web Vitals monitoring for Core Web Vitals tracking
   */
  initializeWebVitals() {
    if (typeof window === 'undefined') return;

    // Largest Contentful Paint (LCP) - should be < 2.5s
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.recordMetric('web_vital_lcp', lastEntry.startTime, {
        threshold: 2500,
        element: lastEntry.element?.tagName || 'unknown'
      });
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay (FID) - should be < 100ms
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach(entry => {
        const fid = entry.processingStart - entry.startTime;
        this.recordMetric('web_vital_fid', fid, {
          threshold: 100,
          eventType: entry.name
        });
      });
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift (CLS) - should be < 0.1
    let clsValue = 0;
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach(entry => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      this.recordMetric('web_vital_cls', clsValue * 1000, { // Convert to ms for consistency
        threshold: 100, // 0.1 * 1000
        cumulative: true
      });
    }).observe({ entryTypes: ['layout-shift'] });
  }

  /**
   * Start timing an operation with enhanced metadata
   */
  startTiming(operationId, operationType, metadata = {}) {
    if (!this.enabled) return;
    
    const key = `${operationId}_${operationType}`;
    this.metrics.set(key, {
      startTime: performance.now(),
      operationType,
      operationId,
      metadata,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * End timing and record performance metrics with threshold checking
   */
  endTiming(operationId, operationType, additionalMetadata = {}) {
    if (!this.enabled) return;
    
    const key = `${operationId}_${operationType}`;
    const metric = this.metrics.get(key);
    
    if (!metric) {
      console.warn(`No timing started for ${key}`);
      return null;
    }
    
    const duration = performance.now() - metric.startTime;
    const threshold = this.thresholds[operationType] || 1000;
    
    const result = {
      operationId,
      operationType,
      duration: Math.round(duration * 100) / 100, // Round to 2 decimal places
      threshold,
      withinThreshold: duration <= threshold,
      timestamp: metric.timestamp,
      metadata: { ...metric.metadata, ...additionalMetadata }
    };
    
    // Record the metric
    this.recordMetric(operationType, duration, result);
    
    // Check for threshold violations and alert
    if (!result.withinThreshold) {
      this.handleThresholdViolation(result);
    }
    
    // Log with appropriate emoji based on performance
    const emoji = this.getPerformanceEmoji(duration, threshold);
    console.log(`${emoji} ${operationType} (${operationId}): ${result.duration}ms (threshold: ${threshold}ms)`, result);
    
    // Clean up
    this.metrics.delete(key);
    
    return result;
  }

  /**
   * Record a performance metric for dashboard and analytics
   */
  recordMetric(operationType, duration, metadata = {}) {
    const metric = {
      operationType,
      duration,
      timestamp: new Date().toISOString(),
      ...metadata
    };
    
    // Store in dashboard data
    if (!this.dashboardData.performanceMetrics.has(operationType)) {
      this.dashboardData.performanceMetrics.set(operationType, []);
    }
    
    const metrics = this.dashboardData.performanceMetrics.get(operationType);
    metrics.push(metric);
    
    // Keep only last 100 metrics per operation type
    if (metrics.length > 100) {
      metrics.splice(0, metrics.length - 100);
    }
    
    // Update response time history for dashboard
    this.dashboardData.responseTimeHistory.push({
      timestamp: metric.timestamp,
      operationType,
      duration,
      threshold: metadata.threshold || this.thresholds[operationType] || 1000
    });
    
    // Keep only last 200 entries in history
    if (this.dashboardData.responseTimeHistory.length > 200) {
      this.dashboardData.responseTimeHistory.splice(0, this.dashboardData.responseTimeHistory.length - 200);
    }
    
    // Store in localStorage for persistence
    this.persistMetric(metric);
  }

  /**
   * Handle threshold violations with alerting
   */
  handleThresholdViolation(result) {
    const violation = {
      ...result,
      severity: this.calculateSeverity(result.duration, result.threshold),
      violationTimestamp: new Date().toISOString()
    };
    
    this.dashboardData.thresholdViolations.push(violation);
    
    // Keep only last 50 violations
    if (this.dashboardData.thresholdViolations.length > 50) {
      this.dashboardData.thresholdViolations.splice(0, this.dashboardData.thresholdViolations.length - 50);
    }
    
    // Trigger alert callbacks
    this.alertCallbacks.forEach(callback => {
      try {
        callback(violation);
      } catch (error) {
        console.error('Error in performance alert callback:', error);
      }
    });
    
    // Log severe violations
    if (violation.severity === 'critical') {
      console.error('🚨 CRITICAL Performance Violation:', violation);
    } else if (violation.severity === 'high') {
      console.warn('⚠️ HIGH Performance Violation:', violation);
    }
  }

  /**
   * Calculate severity of performance violation
   */
  calculateSeverity(duration, threshold) {
    const ratio = duration / threshold;
    if (ratio >= 3) return 'critical';
    if (ratio >= 2) return 'high';
    if (ratio >= 1.5) return 'medium';
    return 'low';
  }

  /**
   * Get appropriate emoji for performance level
   */
  getPerformanceEmoji(duration, threshold) {
    const ratio = duration / threshold;
    if (ratio <= 0.5) return '⚡'; // Excellent
    if (ratio <= 0.8) return '🚀'; // Good
    if (ratio <= 1.0) return '✅'; // Acceptable
    if (ratio <= 1.5) return '⏱️'; // Slow
    if (ratio <= 2.0) return '🐌'; // Very slow
    return '🚨'; // Critical
  }

  /**
   * Store metric for persistence and analysis
   */
  persistMetric(metric) {
    try {
      const stored = JSON.parse(localStorage.getItem('performanceMetrics') || '[]');
      stored.push(metric);
      
      // Keep only last 500 metrics
      if (stored.length > 500) {
        stored.splice(0, stored.length - 500);
      }
      
      localStorage.setItem('performanceMetrics', JSON.stringify(stored));
    } catch (error) {
      console.warn('Failed to persist performance metric:', error);
    }
  }

  /**
   * Register alert callback for threshold violations
   */
  onThresholdViolation(callback) {
    this.alertCallbacks.add(callback);
    return () => this.alertCallbacks.delete(callback);
  }

  /**
   * Get comprehensive performance statistics and dashboard data
   */
  getDashboardData() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    // Filter recent metrics
    const recentMetrics = this.dashboardData.responseTimeHistory.filter(
      metric => new Date(metric.timestamp) > oneHourAgo
    );
    
    // Calculate statistics by operation type
    const statsByOperation = {};
    this.dashboardData.performanceMetrics.forEach((metrics, operationType) => {
      const recentOperationMetrics = metrics.filter(
        metric => new Date(metric.timestamp) > oneHourAgo
      );
      
      if (recentOperationMetrics.length > 0) {
        const durations = recentOperationMetrics.map(m => m.duration);
        const threshold = this.thresholds[operationType] || 1000;
        const withinThreshold = durations.filter(d => d <= threshold).length;
        
        statsByOperation[operationType] = {
          count: recentOperationMetrics.length,
          averageDuration: Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length * 100) / 100,
          minDuration: Math.min(...durations),
          maxDuration: Math.max(...durations),
          p95Duration: this.calculatePercentile(durations, 95),
          threshold,
          successRate: Math.round((withinThreshold / durations.length) * 100),
          recentTrend: this.calculateTrend(recentOperationMetrics)
        };
      }
    });
    
    return {
      summary: {
        totalOperations: recentMetrics.length,
        averageResponseTime: recentMetrics.length > 0 
          ? Math.round(recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length * 100) / 100
          : 0,
        thresholdViolations: this.dashboardData.thresholdViolations.filter(
          v => new Date(v.violationTimestamp) > oneHourAgo
        ).length,
        overallHealthScore: this.calculateHealthScore(statsByOperation)
      },
      operationStats: statsByOperation,
      recentViolations: this.dashboardData.thresholdViolations.slice(-10),
      responseTimeHistory: recentMetrics,
      webVitals: this.getWebVitalsStats()
    };
  }

  /**
   * Calculate percentile for performance analysis
   */
  calculatePercentile(values, percentile) {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  /**
   * Calculate trend for recent metrics
   */
  calculateTrend(metrics) {
    if (metrics.length < 2) return 'stable';
    
    const recent = metrics.slice(-10);
    const older = metrics.slice(-20, -10);
    
    if (older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, m) => sum + m.duration, 0) / recent.length;
    const olderAvg = older.reduce((sum, m) => sum + m.duration, 0) / older.length;
    
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    if (change > 10) return 'degrading';
    if (change < -10) return 'improving';
    return 'stable';
  }

  /**
   * Calculate overall system health score
   */
  calculateHealthScore(statsByOperation) {
    const operations = Object.values(statsByOperation);
    if (operations.length === 0) return 100;
    
    const totalSuccessRate = operations.reduce((sum, op) => sum + op.successRate, 0);
    return Math.round(totalSuccessRate / operations.length);
  }

  /**
   * Get Web Vitals statistics
   */
  getWebVitalsStats() {
    const webVitalMetrics = ['web_vital_lcp', 'web_vital_fid', 'web_vital_cls'];
    const stats = {};
    
    webVitalMetrics.forEach(vital => {
      const metrics = this.dashboardData.performanceMetrics.get(vital) || [];
      if (metrics.length > 0) {
        const recent = metrics.slice(-10);
        const values = recent.map(m => m.duration);
        stats[vital] = {
          current: values[values.length - 1] || 0,
          average: values.reduce((sum, v) => sum + v, 0) / values.length,
          trend: this.calculateTrend(recent)
        };
      }
    });
    
    return stats;
  }

  /**
   * Legacy method for backward compatibility - get performance statistics
   */
  getStats() {
    try {
      const metrics = JSON.parse(localStorage.getItem('performanceMetrics') || '[]');
      
      if (metrics.length === 0) {
        return { message: 'No performance data available' };
      }
      
      // Group by operation type
      const byOperation = {};
      metrics.forEach(metric => {
        if (!byOperation[metric.operationType]) {
          byOperation[metric.operationType] = [];
        }
        byOperation[metric.operationType].push(metric);
      });
      
      const summary = {};
      Object.entries(byOperation).forEach(([operation, operationMetrics]) => {
        const durations = operationMetrics.map(m => m.duration);
        const threshold = this.thresholds[operation] || 1000;
        const withinThreshold = durations.filter(d => d <= threshold).length;
        
        summary[operation] = {
          count: operationMetrics.length,
          averageDuration: `${Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length)}ms`,
          successRate: `${Math.round((withinThreshold / durations.length) * 100)}%`,
          threshold: `${threshold}ms`
        };
      });
      
      return {
        totalMetrics: metrics.length,
        operationSummary: summary,
        recentMetrics: metrics.slice(-10)
      };
    } catch (error) {
      console.error('Failed to get performance stats:', error);
      return { error: 'Failed to get stats' };
    }
  }

  /**
   * Clear all stored metrics
   */
  clearStats() {
    localStorage.removeItem('performanceMetrics');
    localStorage.removeItem('billingPerformanceMetrics'); // Legacy cleanup
    this.dashboardData.responseTimeHistory = [];
    this.dashboardData.thresholdViolations = [];
    this.dashboardData.performanceMetrics.clear();
    console.log('🗑️ Performance metrics cleared');
  }

  /**
   * Enable/disable performance monitoring
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    localStorage.setItem('enablePerformanceMonitoring', enabled.toString());
    console.log(`📊 Performance monitoring ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Track UI interaction performance (Requirements 1.1-1.4)
   */
  trackUIInteraction(interactionType, elementId, callback) {
    return async (...args) => {
      const operationId = `${elementId}_${Date.now()}`;
      this.startTiming(operationId, `ui_${interactionType}`, { elementId });
      
      try {
        const result = await callback(...args);
        this.endTiming(operationId, `ui_${interactionType}`, { success: true });
        return result;
      } catch (error) {
        this.endTiming(operationId, `ui_${interactionType}`, { success: false, error: error.message });
        throw error;
      }
    };
  }

  /**
   * Track API call performance (Requirements 5.1, 5.2)
   */
  trackAPICall(endpoint, method = 'GET') {
    const operationId = `${method}_${endpoint}_${Date.now()}`;
    this.startTiming(operationId, 'api_response', { endpoint, method });
    
    return {
      end: (success = true, metadata = {}) => {
        this.endTiming(operationId, 'api_response', { success, endpoint, method, ...metadata });
      }
    };
  }

  /**
   * Track cache performance (Requirements 6.1, 6.2)
   */
  trackCacheOperation(cacheType, operation, key) {
    const operationId = `${cacheType}_${operation}_${key}_${Date.now()}`;
    const operationType = `cache_${cacheType}`;
    
    this.startTiming(operationId, operationType, { cacheType, operation, key });
    
    return {
      hit: (metadata = {}) => {
        this.endTiming(operationId, operationType, { hit: true, operation, ...metadata });
      },
      miss: (metadata = {}) => {
        this.endTiming(operationId, operationType, { hit: false, operation, ...metadata });
      }
    };
  }

  /**
   * Track real-time update performance (Requirements 7.1, 7.2, 10.1, 10.2)
   */
  trackRealTimeUpdate(updateType, targetId) {
    const operationId = `${updateType}_${targetId}_${Date.now()}`;
    const operationType = updateType.includes('kitchen') ? 'realtime_kitchen' : 'realtime_client';
    
    this.startTiming(operationId, operationType, { updateType, targetId });
    
    return {
      complete: (metadata = {}) => {
        this.endTiming(operationId, operationType, { updateType, targetId, ...metadata });
      }
    };
  }

  /**
   * Track menu loading performance (Requirements 2.1-2.3)
   */
  trackMenuOperation(operationType, itemId = null) {
    const operationId = `menu_${operationType}_${itemId || 'all'}_${Date.now()}`;
    const perfOperationType = `menu_${operationType}`;
    
    this.startTiming(operationId, perfOperationType, { itemId });
    
    return {
      complete: (metadata = {}) => {
        this.endTiming(operationId, perfOperationType, { itemId, ...metadata });
      }
    };
  }

  /**
   * Track payment processing performance (Requirements 4.1, 4.3, 4.4)
   */
  trackPaymentOperation(operationType, paymentId) {
    const operationId = `payment_${operationType}_${paymentId}_${Date.now()}`;
    const perfOperationType = `payment_${operationType}`;
    
    this.startTiming(operationId, perfOperationType, { paymentId });
    
    return {
      complete: (success = true, metadata = {}) => {
        this.endTiming(operationId, perfOperationType, { paymentId, success, ...metadata });
      }
    };
  }

  /**
   * Legacy cache tracking methods for backward compatibility
   */
  trackCacheHit(orderId, hitType = 'full') {
    if (!this.enabled) return;
    
    console.log(`💾 Cache ${hitType} hit for order ${orderId}`);
    this.recordMetric('cache_hit', 0, {
      orderId,
      hitType,
      operationType: 'cache_hit'
    });
  }

  trackCacheMiss(orderId, reason = 'not_found') {
    if (!this.enabled) return;
    
    console.log(`❌ Cache miss for order ${orderId}: ${reason}`);
    this.recordMetric('cache_miss', 0, {
      orderId,
      reason,
      operationType: 'cache_miss'
    });
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Enhanced convenience functions for different operation types
export const trackUIClick = (elementId, callback) => 
  performanceMonitor.trackUIInteraction('click', elementId, callback);

export const trackUITyping = (elementId, callback) => 
  performanceMonitor.trackUIInteraction('typing', elementId, callback);

export const trackUINavigation = (elementId, callback) => 
  performanceMonitor.trackUIInteraction('navigation', elementId, callback);

export const trackCartUpdate = (elementId, callback) => 
  performanceMonitor.trackUIInteraction('cart_update', elementId, callback);

export const trackAPICall = (endpoint, method) => 
  performanceMonitor.trackAPICall(endpoint, method);

export const trackCacheOperation = (cacheType, operation, key) => 
  performanceMonitor.trackCacheOperation(cacheType, operation, key);

export const trackMenuLoad = () => 
  performanceMonitor.trackMenuOperation('load');

export const trackMenuSearch = () => 
  performanceMonitor.trackMenuOperation('search');

export const trackMenuItemDetails = (itemId) => 
  performanceMonitor.trackMenuOperation('item_details', itemId);

export const trackPaymentValidation = (paymentId) => 
  performanceMonitor.trackPaymentOperation('validation', paymentId);

export const trackPaymentConfirmation = (paymentId) => 
  performanceMonitor.trackPaymentOperation('confirmation', paymentId);

export const trackPaymentError = (paymentId) => 
  performanceMonitor.trackPaymentOperation('error', paymentId);

export const trackKitchenUpdate = (orderId) => 
  performanceMonitor.trackRealTimeUpdate('kitchen_update', orderId);

export const trackClientUpdate = (clientId) => 
  performanceMonitor.trackRealTimeUpdate('client_update', clientId);

// Legacy compatibility functions
export const startBillingTimer = (orderId) => 
  performanceMonitor.startTiming(orderId, 'billing_load', { legacy: true });

export const endBillingTimer = (orderId, metadata) => 
  performanceMonitor.endTiming(orderId, 'billing_load', { legacy: true, ...metadata });

export const trackCacheHit = (orderId, hitType) => 
  performanceMonitor.trackCacheHit(orderId, hitType);

export const trackCacheMiss = (orderId, reason) => 
  performanceMonitor.trackCacheMiss(orderId, reason);

// Global access for debugging and dashboard
if (typeof window !== 'undefined') {
  window.performanceMonitor = {
    // Dashboard data access
    getDashboard: () => performanceMonitor.getDashboardData(),
    getStats: () => performanceMonitor.getStats(),
    
    // Control functions
    clearStats: () => performanceMonitor.clearStats(),
    setEnabled: (enabled) => performanceMonitor.setEnabled(enabled),
    
    // Alert management
    onAlert: (callback) => performanceMonitor.onThresholdViolation(callback),
    
    // Direct access to monitor instance
    monitor: performanceMonitor
  };
  
  // Legacy compatibility
  window.billingPerformance = window.performanceMonitor;
}

export default performanceMonitor;