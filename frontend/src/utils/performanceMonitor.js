/**
 * Performance Monitor for Active Orders Display
 * 
 * This utility tracks timing metrics for active orders display to ensure
 * the < 100ms target is consistently met and provides alerts when
 * performance degrades.
 */

import performanceLogger from './performanceLogger';

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      displayTimes: [],
      cacheHits: 0,
      cacheMisses: 0,
      serverRequests: 0,
      errors: 0,
      totalOperations: 0
    };
    
    this.thresholds = {
      displayTime: 100, // 100ms target
      warningTime: 150, // Warning threshold
      criticalTime: 500, // Critical threshold
      maxMetricsHistory: 1000 // Keep last 1000 measurements
    };
    
    this.alerts = {
      enabled: true,
      consecutiveSlowOperations: 0,
      lastAlert: 0,
      alertCooldown: 30000 // 30 seconds between alerts
    };
    
    this.debugMode = process.env.NODE_ENV === 'development';
    
    this.log('PerformanceMonitor initialized');
  }
  
  /**
   * Log debug messages in development mode
   */
  log(message, data = null) {
    if (this.debugMode) {
      const timestamp = new Date().toISOString();
      console.log(`[PerformanceMonitor ${timestamp}] ${message}`, data || '');
    }
  }
  
  /**
   * Start timing an active orders display operation
   * @param {string} operationType - Type of operation (order-creation, status-change, etc.)
   * @param {Object} context - Additional context for the operation
   * @returns {Function} - Function to call when operation completes
   */
  startTiming(operationType, context = {}) {
    const startTime = performance.now();
    const operationId = `${operationType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.log(`⏱️ TIMING START: ${operationType}`, { operationId, context });
    
    // Log timing start
    performanceLogger.debug('PERFORMANCE', `Timing started: ${operationType}`, {
      operationId,
      operationType,
      context,
      startTime
    });
    
    // Create performance mark
    performanceLogger.mark(`${operationType}-start-${operationId}`);
    
    // Return completion function
    return (result = {}) => {
      const endTime = performance.now();
      const displayTime = endTime - startTime;
      
      // Create performance measure
      performanceLogger.measure(
        `${operationType}-duration-${operationId}`,
        `${operationType}-start-${operationId}`
      );
      
      this.recordDisplayTime(displayTime, operationType, {
        ...context,
        ...result,
        operationId
      });
      
      return displayTime;
    };
  }
  
  /**
   * Record display time measurement
   * @param {number} displayTime - Time taken in milliseconds
   * @param {string} operationType - Type of operation
   * @param {Object} context - Operation context
   */
  recordDisplayTime(displayTime, operationType, context = {}) {
    const measurement = {
      displayTime,
      operationType,
      timestamp: Date.now(),
      context,
      performance: this.getPerformanceCategory(displayTime)
    };
    
    // Add to metrics
    this.metrics.displayTimes.push(measurement);
    this.metrics.totalOperations++;
    
    // Maintain history size
    if (this.metrics.displayTimes.length > this.thresholds.maxMetricsHistory) {
      this.metrics.displayTimes.shift();
    }
    
    this.log(`📊 TIMING RECORDED: ${operationType} in ${displayTime.toFixed(2)}ms`, {
      performance: measurement.performance,
      context
    });
    
    // Log to performance logger
    performanceLogger.logTiming(operationType, displayTime, {
      performance: measurement.performance,
      context,
      threshold: this.thresholds.displayTime.target
    });
    
    // Check for performance issues
    this.checkPerformanceThresholds(measurement);
    
    // Update cache metrics if available
    if (context.fromCache !== undefined) {
      if (context.fromCache) {
        this.metrics.cacheHits++;
      } else {
        this.metrics.cacheMisses++;
        this.metrics.serverRequests++;
      }
    }
    
    // Track errors
    if (context.error) {
      this.metrics.errors++;
      performanceLogger.error('PERFORMANCE', `Operation failed: ${operationType}`, {
        error: context.error,
        displayTime,
        context
      });
    }
  }
  
  /**
   * Get performance category for display time
   * @param {number} displayTime - Time in milliseconds
   * @returns {string} - Performance category
   */
  getPerformanceCategory(displayTime) {
    if (displayTime <= this.thresholds.displayTime) {
      return 'excellent';
    } else if (displayTime <= this.thresholds.warningTime) {
      return 'good';
    } else if (displayTime <= this.thresholds.criticalTime) {
      return 'warning';
    } else {
      return 'critical';
    }
  }
  
  /**
   * Check performance thresholds and trigger alerts
   * @param {Object} measurement - Performance measurement
   */
  checkPerformanceThresholds(measurement) {
    const { displayTime, operationType } = measurement;
    
    if (displayTime > this.thresholds.displayTime) {
      this.alerts.consecutiveSlowOperations++;
      
      this.log(`⚠️ SLOW OPERATION: ${operationType} took ${displayTime.toFixed(2)}ms (target: ${this.thresholds.displayTime}ms)`);
      
      // Trigger alert for critical performance
      if (displayTime > this.thresholds.criticalTime) {
        this.triggerPerformanceAlert('critical', measurement);
      } else if (displayTime > this.thresholds.warningTime) {
        this.triggerPerformanceAlert('warning', measurement);
      }
      
      // Alert for consecutive slow operations
      if (this.alerts.consecutiveSlowOperations >= 3) {
        this.triggerPerformanceAlert('consecutive-slow', {
          count: this.alerts.consecutiveSlowOperations,
          lastOperation: measurement
        });
      }
    } else {
      // Reset consecutive slow operations counter
      this.alerts.consecutiveSlowOperations = 0;
    }
  }
  
  /**
   * Trigger performance alert
   * @param {string} alertType - Type of alert
   * @param {Object} data - Alert data
   */
  triggerPerformanceAlert(alertType, data) {
    if (!this.alerts.enabled) return;
    
    const now = Date.now();
    
    // Check cooldown
    if (now - this.alerts.lastAlert < this.alerts.alertCooldown) {
      return;
    }
    
    this.alerts.lastAlert = now;
    
    const alertMessage = this.getAlertMessage(alertType, data);
    
    this.log(`🚨 PERFORMANCE ALERT: ${alertType}`, data);
    
    // Dispatch custom event for UI components to handle
    const alertEvent = new CustomEvent('performanceAlert', {
      detail: {
        type: alertType,
        message: alertMessage,
        data,
        timestamp: now
      }
    });
    
    window.dispatchEvent(alertEvent);
    
    // Console warning for development
    if (this.debugMode) {
      console.warn(`🚨 Performance Alert: ${alertMessage}`, data);
    }
  }
  
  /**
   * Get alert message for alert type
   * @param {string} alertType - Type of alert
   * @param {Object} data - Alert data
   * @returns {string} - Alert message
   */
  getAlertMessage(alertType, data) {
    switch (alertType) {
      case 'critical':
        return `Critical performance: ${data.operationType} took ${data.displayTime.toFixed(0)}ms (target: ${this.thresholds.displayTime}ms)`;
      
      case 'warning':
        return `Slow performance: ${data.operationType} took ${data.displayTime.toFixed(0)}ms (target: ${this.thresholds.displayTime}ms)`;
      
      case 'consecutive-slow':
        return `${data.count} consecutive slow operations detected. Last: ${data.lastOperation.operationType}`;
      
      case 'cache-miss-rate':
        return `High cache miss rate: ${data.missRate.toFixed(1)}% (threshold: ${data.threshold}%)`;
      
      case 'error-rate':
        return `High error rate: ${data.errorRate.toFixed(1)}% (threshold: ${data.threshold}%)`;
      
      default:
        return `Performance issue detected: ${alertType}`;
    }
  }
  
  /**
   * Get current performance statistics
   * @returns {Object} - Performance statistics
   */
  getStats() {
    const recentMeasurements = this.getRecentMeasurements(60000); // Last minute
    const allMeasurements = this.metrics.displayTimes;
    
    if (allMeasurements.length === 0) {
      return {
        totalOperations: 0,
        averageDisplayTime: 0,
        medianDisplayTime: 0,
        percentile95: 0,
        percentile99: 0,
        cacheHitRate: 0,
        errorRate: 0,
        performanceDistribution: {},
        recentPerformance: {},
        thresholds: { ...this.thresholds },
        alerts: {
          consecutiveSlowOperations: this.alerts.consecutiveSlowOperations,
          lastAlert: this.alerts.lastAlert
        }
      };
    }
    
    const displayTimes = allMeasurements.map(m => m.displayTime);
    const recentDisplayTimes = recentMeasurements.map(m => m.displayTime);
    
    return {
      totalOperations: this.metrics.totalOperations,
      averageDisplayTime: this.calculateAverage(displayTimes),
      medianDisplayTime: this.calculateMedian(displayTimes),
      percentile95: this.calculatePercentile(displayTimes, 95),
      percentile99: this.calculatePercentile(displayTimes, 99),
      cacheHitRate: this.calculateCacheHitRate(),
      errorRate: this.calculateErrorRate(),
      performanceDistribution: this.getPerformanceDistribution(allMeasurements),
      recentPerformance: {
        count: recentMeasurements.length,
        averageDisplayTime: this.calculateAverage(recentDisplayTimes),
        medianDisplayTime: this.calculateMedian(recentDisplayTimes)
      },
      thresholds: { ...this.thresholds },
      alerts: {
        consecutiveSlowOperations: this.alerts.consecutiveSlowOperations,
        lastAlert: this.alerts.lastAlert
      }
    };
  }
  
  /**
   * Get recent measurements within time window
   * @param {number} timeWindow - Time window in milliseconds
   * @returns {Array} - Recent measurements
   */
  getRecentMeasurements(timeWindow) {
    const cutoff = Date.now() - timeWindow;
    return this.metrics.displayTimes.filter(m => m.timestamp >= cutoff);
  }
  
  /**
   * Calculate average of array
   * @param {Array} values - Array of numbers
   * @returns {number} - Average value
   */
  calculateAverage(values) {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }
  
  /**
   * Calculate median of array
   * @param {Array} values - Array of numbers
   * @returns {number} - Median value
   */
  calculateMedian(values) {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }
  
  /**
   * Calculate percentile of array
   * @param {Array} values - Array of numbers
   * @param {number} percentile - Percentile to calculate (0-100)
   * @returns {number} - Percentile value
   */
  calculatePercentile(values, percentile) {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    
    return sorted[Math.max(0, index)];
  }
  
  /**
   * Calculate cache hit rate
   * @returns {number} - Cache hit rate as percentage
   */
  calculateCacheHitRate() {
    const totalCacheOperations = this.metrics.cacheHits + this.metrics.cacheMisses;
    
    if (totalCacheOperations === 0) return 0;
    
    return (this.metrics.cacheHits / totalCacheOperations) * 100;
  }
  
  /**
   * Calculate error rate
   * @returns {number} - Error rate as percentage
   */
  calculateErrorRate() {
    if (this.metrics.totalOperations === 0) return 0;
    
    return (this.metrics.errors / this.metrics.totalOperations) * 100;
  }
  
  /**
   * Get performance distribution
   * @param {Array} measurements - Array of measurements
   * @returns {Object} - Performance distribution
   */
  getPerformanceDistribution(measurements) {
    const distribution = {
      excellent: 0,
      good: 0,
      warning: 0,
      critical: 0
    };
    
    measurements.forEach(measurement => {
      distribution[measurement.performance]++;
    });
    
    return distribution;
  }
  
  /**
   * Check for performance degradation trends
   * @returns {Object} - Trend analysis
   */
  analyzeTrends() {
    const recentMeasurements = this.getRecentMeasurements(300000); // Last 5 minutes
    const olderMeasurements = this.metrics.displayTimes
      .filter(m => m.timestamp < Date.now() - 300000)
      .slice(-100); // Last 100 older measurements
    
    if (recentMeasurements.length < 10 || olderMeasurements.length < 10) {
      return { trend: 'insufficient-data' };
    }
    
    const recentAverage = this.calculateAverage(recentMeasurements.map(m => m.displayTime));
    const olderAverage = this.calculateAverage(olderMeasurements.map(m => m.displayTime));
    
    const percentageChange = ((recentAverage - olderAverage) / olderAverage) * 100;
    
    let trend = 'stable';
    if (percentageChange > 20) {
      trend = 'degrading';
    } else if (percentageChange < -20) {
      trend = 'improving';
    }
    
    return {
      trend,
      recentAverage,
      olderAverage,
      percentageChange,
      recentCount: recentMeasurements.length,
      olderCount: olderMeasurements.length
    };
  }
  
  /**
   * Generate performance report
   * @returns {Object} - Comprehensive performance report
   */
  generateReport() {
    const stats = this.getStats();
    const trends = this.analyzeTrends();
    
    return {
      summary: {
        totalOperations: stats.totalOperations,
        averageDisplayTime: Math.round(stats.averageDisplayTime * 100) / 100,
        targetMet: stats.averageDisplayTime <= this.thresholds.displayTime,
        cacheHitRate: Math.round(stats.cacheHitRate * 100) / 100,
        errorRate: Math.round(stats.errorRate * 100) / 100
      },
      performance: {
        median: Math.round(stats.medianDisplayTime * 100) / 100,
        percentile95: Math.round(stats.percentile95 * 100) / 100,
        percentile99: Math.round(stats.percentile99 * 100) / 100,
        distribution: stats.performanceDistribution
      },
      trends,
      recent: stats.recentPerformance,
      alerts: {
        consecutiveSlowOperations: stats.alerts.consecutiveSlowOperations,
        lastAlert: stats.alerts.lastAlert,
        alertsEnabled: this.alerts.enabled
      },
      thresholds: stats.thresholds,
      timestamp: Date.now()
    };
  }
  
  /**
   * Reset all metrics
   */
  reset() {
    this.log('Resetting performance metrics');
    
    this.metrics = {
      displayTimes: [],
      cacheHits: 0,
      cacheMisses: 0,
      serverRequests: 0,
      errors: 0,
      totalOperations: 0
    };
    
    this.alerts.consecutiveSlowOperations = 0;
    this.alerts.lastAlert = 0;
  }
  
  /**
   * Enable or disable alerts
   * @param {boolean} enabled - Whether to enable alerts
   */
  setAlertsEnabled(enabled) {
    this.alerts.enabled = enabled;
    this.log(`Performance alerts ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  /**
   * Update performance thresholds
   * @param {Object} newThresholds - New threshold values
   */
  updateThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    this.log('Performance thresholds updated', this.thresholds);
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Convenience functions for billing operations
export function startBillingTimer(operationType, context = {}) {
  return performanceMonitor.startTiming(`billing-${operationType}`, context);
}

export function endBillingTimer(timerFunction, result = {}) {
  if (typeof timerFunction === 'function') {
    return timerFunction(result);
  }
  return 0;
}

export function trackCacheHit(operationType, context = {}) {
  performanceMonitor.recordDisplayTime(0, `cache-hit-${operationType}`, {
    ...context,
    fromCache: true
  });
}

export function trackCacheMiss(operationType, context = {}) {
  performanceMonitor.recordDisplayTime(0, `cache-miss-${operationType}`, {
    ...context,
    fromCache: false
  });
}

// Export both class and singleton
export { PerformanceMonitor };
export default performanceMonitor;