/**
 * Payment Performance Monitor
 * Monitors payment processing performance and success rates
 */

class PaymentPerformanceMonitor {
  constructor() {
    this.metrics = {
      totalPayments: 0,
      successfulPayments: 0,
      failedPayments: 0,
      averageProcessingTime: 0,
      processingTimes: [],
      errorTypes: {},
      performanceAlerts: []
    };
    
    this.thresholds = {
      slowProcessingTime: 5000, // 5 seconds
      verySlowProcessingTime: 10000, // 10 seconds
      lowSuccessRate: 0.85, // 85%
      criticalSuccessRate: 0.70 // 70%
    };
    
    this.maxStoredTimes = 100; // Keep last 100 processing times
    this.loadStoredMetrics();
  }

  /**
   * Load stored metrics from localStorage
   */
  loadStoredMetrics() {
    try {
      const stored = localStorage.getItem('paymentPerformanceMetrics');
      if (stored) {
        const data = JSON.parse(stored);
        this.metrics = { ...this.metrics, ...data };
        
        // Ensure arrays don't grow too large
        if (this.metrics.processingTimes.length > this.maxStoredTimes) {
          this.metrics.processingTimes = this.metrics.processingTimes.slice(-this.maxStoredTimes);
        }
      }
    } catch (error) {
      console.warn('Failed to load stored payment metrics:', error);
    }
  }

  /**
   * Save metrics to localStorage
   */
  saveMetrics() {
    try {
      localStorage.setItem('paymentPerformanceMetrics', JSON.stringify(this.metrics));
    } catch (error) {
      console.warn('Failed to save payment metrics:', error);
    }
  }

  /**
   * Start monitoring a payment process
   * @param {string} paymentId - Unique payment identifier
   * @returns {Object} - Monitoring session
   */
  startPaymentMonitoring(paymentId) {
    const startTime = performance.now();
    
    return {
      paymentId,
      startTime,
      endTime: null,
      duration: null,
      success: null,
      error: null,
      
      /**
       * Mark payment as successful
       */
      markSuccess: () => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.recordPaymentSuccess(duration);
        
        return {
          paymentId,
          startTime,
          endTime,
          duration,
          success: true
        };
      },
      
      /**
       * Mark payment as failed
       * @param {Error} error - Payment error
       */
      markFailure: (error) => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.recordPaymentFailure(duration, error);
        
        return {
          paymentId,
          startTime,
          endTime,
          duration,
          success: false,
          error: error.message || 'Unknown error'
        };
      }
    };
  }

  /**
   * Record successful payment
   * @param {number} duration - Processing time in milliseconds
   */
  recordPaymentSuccess(duration) {
    this.metrics.totalPayments++;
    this.metrics.successfulPayments++;
    this.addProcessingTime(duration);
    
    // Check for performance alerts
    this.checkPerformanceAlerts(duration, true);
    
    this.saveMetrics();
    
    console.log(`✅ Payment success recorded: ${duration.toFixed(2)}ms`);
  }

  /**
   * Record failed payment
   * @param {number} duration - Processing time in milliseconds
   * @param {Error} error - Payment error
   */
  recordPaymentFailure(duration, error) {
    this.metrics.totalPayments++;
    this.metrics.failedPayments++;
    this.addProcessingTime(duration);
    
    // Track error types
    const errorType = this.categorizeError(error);
    this.metrics.errorTypes[errorType] = (this.metrics.errorTypes[errorType] || 0) + 1;
    
    // Check for performance alerts
    this.checkPerformanceAlerts(duration, false);
    
    this.saveMetrics();
    
    console.log(`❌ Payment failure recorded: ${duration.toFixed(2)}ms, Error: ${errorType}`);
  }

  /**
   * Add processing time to metrics
   * @param {number} duration - Processing time in milliseconds
   */
  addProcessingTime(duration) {
    this.metrics.processingTimes.push(duration);
    
    // Keep only recent times
    if (this.metrics.processingTimes.length > this.maxStoredTimes) {
      this.metrics.processingTimes.shift();
    }
    
    // Recalculate average
    this.metrics.averageProcessingTime = 
      this.metrics.processingTimes.reduce((sum, time) => sum + time, 0) / 
      this.metrics.processingTimes.length;
  }

  /**
   * Categorize error for tracking
   * @param {Error} error - Payment error
   * @returns {string} - Error category
   */
  categorizeError(error) {
    const message = error.message?.toLowerCase() || '';
    const status = error.response?.status;
    
    if (error.code === 'ERR_NETWORK' || !error.response) {
      return 'network_error';
    } else if (status === 500) {
      return 'server_error';
    } else if (status === 400) {
      return 'validation_error';
    } else if (status === 401 || status === 403) {
      return 'auth_error';
    } else if (status === 404) {
      return 'not_found_error';
    } else if (message.includes('timeout')) {
      return 'timeout_error';
    } else if (message.includes('cors')) {
      return 'cors_error';
    } else {
      return 'unknown_error';
    }
  }

  /**
   * Check for performance alerts
   * @param {number} duration - Processing time
   * @param {boolean} success - Whether payment succeeded
   */
  checkPerformanceAlerts(duration, success) {
    const now = Date.now();
    
    // Slow processing alert
    if (duration > this.thresholds.verySlowProcessingTime) {
      this.addAlert('critical', `Very slow payment processing: ${(duration/1000).toFixed(1)}s`, now);
    } else if (duration > this.thresholds.slowProcessingTime) {
      this.addAlert('warning', `Slow payment processing: ${(duration/1000).toFixed(1)}s`, now);
    }
    
    // Success rate alerts (check every 10 payments)
    if (this.metrics.totalPayments % 10 === 0 && this.metrics.totalPayments > 0) {
      const successRate = this.getSuccessRate();
      
      if (successRate < this.thresholds.criticalSuccessRate) {
        this.addAlert('critical', `Critical success rate: ${(successRate * 100).toFixed(1)}%`, now);
      } else if (successRate < this.thresholds.lowSuccessRate) {
        this.addAlert('warning', `Low success rate: ${(successRate * 100).toFixed(1)}%`, now);
      }
    }
  }

  /**
   * Add performance alert
   * @param {string} level - Alert level (warning, critical)
   * @param {string} message - Alert message
   * @param {number} timestamp - Alert timestamp
   */
  addAlert(level, message, timestamp) {
    const alert = { level, message, timestamp };
    this.metrics.performanceAlerts.push(alert);
    
    // Keep only recent alerts (last 50)
    if (this.metrics.performanceAlerts.length > 50) {
      this.metrics.performanceAlerts.shift();
    }
    
    // Log alert
    if (level === 'critical') {
      console.error(`🚨 Payment Performance Alert: ${message}`);
    } else {
      console.warn(`⚠️ Payment Performance Alert: ${message}`);
    }
    
    // Trigger diagnostic if needed
    if (level === 'critical') {
      this.triggerDiagnostics();
    }
  }

  /**
   * Trigger diagnostic collection
   */
  triggerDiagnostics() {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      metrics: this.getMetrics(),
      networkInfo: this.getNetworkInfo(),
      browserInfo: this.getBrowserInfo(),
      recentErrors: this.getRecentErrors()
    };
    
    console.log('🔍 Payment diagnostics triggered:', diagnostics);
    
    // Store diagnostics for support
    try {
      const existing = JSON.parse(localStorage.getItem('paymentDiagnostics') || '[]');
      existing.push(diagnostics);
      
      // Keep only last 10 diagnostic reports
      if (existing.length > 10) {
        existing.splice(0, existing.length - 10);
      }
      
      localStorage.setItem('paymentDiagnostics', JSON.stringify(existing));
    } catch (error) {
      console.warn('Failed to store payment diagnostics:', error);
    }
  }

  /**
   * Get network information
   */
  getNetworkInfo() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    return {
      online: navigator.onLine,
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 'unknown',
      rtt: connection?.rtt || 'unknown',
      saveData: connection?.saveData || false
    };
  }

  /**
   * Get browser information
   */
  getBrowserInfo() {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
  }

  /**
   * Get recent errors
   */
  getRecentErrors() {
    try {
      const errorLogs = JSON.parse(localStorage.getItem('billingErrorLogs') || '[]');
      return errorLogs.slice(-10); // Last 10 errors
    } catch (error) {
      return [];
    }
  }

  /**
   * Get current success rate
   * @returns {number} - Success rate (0-1)
   */
  getSuccessRate() {
    if (this.metrics.totalPayments === 0) return 1;
    return this.metrics.successfulPayments / this.metrics.totalPayments;
  }

  /**
   * Get performance metrics
   * @returns {Object} - Current metrics
   */
  getMetrics() {
    const successRate = this.getSuccessRate();
    const recentTimes = this.metrics.processingTimes.slice(-20); // Last 20 payments
    const recentAverage = recentTimes.length > 0 ? 
      recentTimes.reduce((sum, time) => sum + time, 0) / recentTimes.length : 0;
    
    return {
      ...this.metrics,
      successRate,
      recentAverageProcessingTime: recentAverage,
      medianProcessingTime: this.getMedianProcessingTime(),
      p95ProcessingTime: this.getPercentileProcessingTime(95),
      p99ProcessingTime: this.getPercentileProcessingTime(99)
    };
  }

  /**
   * Get median processing time
   * @returns {number} - Median time in milliseconds
   */
  getMedianProcessingTime() {
    if (this.metrics.processingTimes.length === 0) return 0;
    
    const sorted = [...this.metrics.processingTimes].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    return sorted.length % 2 === 0 ? 
      (sorted[mid - 1] + sorted[mid]) / 2 : 
      sorted[mid];
  }

  /**
   * Get percentile processing time
   * @param {number} percentile - Percentile (0-100)
   * @returns {number} - Processing time at percentile
   */
  getPercentileProcessingTime(percentile) {
    if (this.metrics.processingTimes.length === 0) return 0;
    
    const sorted = [...this.metrics.processingTimes].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    
    return sorted[Math.max(0, index)];
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      totalPayments: 0,
      successfulPayments: 0,
      failedPayments: 0,
      averageProcessingTime: 0,
      processingTimes: [],
      errorTypes: {},
      performanceAlerts: []
    };
    
    this.saveMetrics();
    console.log('🔄 Payment performance metrics reset');
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics() {
    const exportData = {
      timestamp: new Date().toISOString(),
      metrics: this.getMetrics(),
      diagnostics: JSON.parse(localStorage.getItem('paymentDiagnostics') || '[]'),
      thresholds: this.thresholds
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-performance-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('📁 Payment performance metrics exported');
  }

  /**
   * Get performance status
   * @returns {Object} - Current performance status
   */
  getPerformanceStatus() {
    const metrics = this.getMetrics();
    const recentAlerts = this.metrics.performanceAlerts.filter(
      alert => Date.now() - alert.timestamp < 300000 // Last 5 minutes
    );
    
    let status = 'good';
    let message = 'Payment processing is performing well';
    
    if (metrics.successRate < this.thresholds.criticalSuccessRate) {
      status = 'critical';
      message = `Critical: Success rate is ${(metrics.successRate * 100).toFixed(1)}%`;
    } else if (metrics.successRate < this.thresholds.lowSuccessRate) {
      status = 'warning';
      message = `Warning: Success rate is ${(metrics.successRate * 100).toFixed(1)}%`;
    } else if (metrics.recentAverageProcessingTime > this.thresholds.verySlowProcessingTime) {
      status = 'critical';
      message = `Critical: Very slow processing (${(metrics.recentAverageProcessingTime/1000).toFixed(1)}s avg)`;
    } else if (metrics.recentAverageProcessingTime > this.thresholds.slowProcessingTime) {
      status = 'warning';
      message = `Warning: Slow processing (${(metrics.recentAverageProcessingTime/1000).toFixed(1)}s avg)`;
    }
    
    return {
      status,
      message,
      metrics,
      recentAlerts: recentAlerts.length,
      recommendations: this.getRecommendations(status, metrics)
    };
  }

  /**
   * Get performance recommendations
   * @param {string} status - Current status
   * @param {Object} metrics - Current metrics
   * @returns {Array} - Recommendations
   */
  getRecommendations(status, metrics) {
    const recommendations = [];
    
    if (status === 'critical') {
      if (metrics.successRate < this.thresholds.criticalSuccessRate) {
        recommendations.push('Check server status and network connectivity');
        recommendations.push('Review recent error logs for patterns');
        recommendations.push('Consider implementing retry logic');
      }
      
      if (metrics.recentAverageProcessingTime > this.thresholds.verySlowProcessingTime) {
        recommendations.push('Check network connection quality');
        recommendations.push('Review server performance and load');
        recommendations.push('Consider optimizing payment processing logic');
      }
    } else if (status === 'warning') {
      recommendations.push('Monitor performance trends');
      recommendations.push('Review error patterns');
      recommendations.push('Consider preemptive optimizations');
    } else {
      recommendations.push('Continue monitoring performance');
      recommendations.push('Maintain current optimization strategies');
    }
    
    return recommendations;
  }
}

// Create singleton instance
export const paymentPerformanceMonitor = new PaymentPerformanceMonitor();

// Export convenience functions
export const startPaymentMonitoring = (paymentId) => paymentPerformanceMonitor.startPaymentMonitoring(paymentId);
export const getPaymentMetrics = () => paymentPerformanceMonitor.getMetrics();
export const getPerformanceStatus = () => paymentPerformanceMonitor.getPerformanceStatus();
export const resetPaymentMetrics = () => paymentPerformanceMonitor.resetMetrics();
export const exportPaymentMetrics = () => paymentPerformanceMonitor.exportMetrics();

export default paymentPerformanceMonitor;