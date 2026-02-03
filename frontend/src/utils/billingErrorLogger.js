/**
 * Billing Error Logger
 * Comprehensive error logging for payment processing and billing operations
 */

class BillingErrorLogger {
  constructor() {
    this.logQueue = [];
    this.maxQueueSize = 100;
    this.isOnline = navigator.onLine;
    this.setupNetworkListeners();
  }

  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushQueuedLogs();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /**
   * Get current network conditions
   */
  getNetworkInfo() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    return {
      online: this.isOnline,
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 'unknown',
      rtt: connection?.rtt || 'unknown',
      saveData: connection?.saveData || false
    };
  }

  /**
   * Get browser and device information
   */
  getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth
      }
    };
  }

  /**
   * Get current user context
   */
  getUserContext() {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return {
        userId: user.id || 'anonymous',
        username: user.username || 'unknown',
        organizationId: user.organization_id || 'none',
        role: user.role || 'unknown'
      };
    } catch (error) {
      return {
        userId: 'anonymous',
        username: 'unknown',
        organizationId: 'none',
        role: 'unknown'
      };
    }
  }

  /**
   * Create comprehensive error context
   */
  createErrorContext(error, additionalContext = {}) {
    return {
      timestamp: new Date().toISOString(),
      error: {
        message: error.message || 'Unknown error',
        name: error.name || 'Error',
        stack: error.stack || 'No stack trace available',
        code: error.code || 'UNKNOWN',
        status: error.response?.status || null,
        statusText: error.response?.statusText || null,
        responseData: error.response?.data || null
      },
      network: this.getNetworkInfo(),
      device: this.getDeviceInfo(),
      user: this.getUserContext(),
      url: window.location.href,
      referrer: document.referrer,
      ...additionalContext
    };
  }

  /**
   * Log payment processing errors
   */
  logPaymentError(error, paymentData = {}) {
    const context = this.createErrorContext(error, {
      type: 'PAYMENT_ERROR',
      paymentData: {
        orderId: paymentData.orderId || 'unknown',
        amount: paymentData.amount || 0,
        paymentMethod: paymentData.paymentMethod || 'unknown',
        isCredit: paymentData.isCredit || false,
        tableNumber: paymentData.tableNumber || 'unknown'
      },
      severity: 'HIGH'
    });

    this.logError(context);
    
    // Also log to console for immediate debugging
    console.error('💳 Payment Error:', {
      message: error.message,
      orderId: paymentData.orderId,
      amount: paymentData.amount,
      method: paymentData.paymentMethod,
      status: error.response?.status,
      data: error.response?.data
    });
  }

  /**
   * Log CORS errors
   */
  logCorsError(error, requestDetails = {}) {
    const context = this.createErrorContext(error, {
      type: 'CORS_ERROR',
      requestDetails: {
        url: requestDetails.url || 'unknown',
        method: requestDetails.method || 'unknown',
        headers: requestDetails.headers || {},
        origin: window.location.origin
      },
      severity: 'HIGH'
    });

    this.logError(context);
    
    console.error('🚫 CORS Error:', {
      message: error.message,
      url: requestDetails.url,
      method: requestDetails.method,
      origin: window.location.origin
    });
  }

  /**
   * Log validation errors
   */
  logValidationError(validationResult, inputData = {}) {
    const context = {
      timestamp: new Date().toISOString(),
      type: 'VALIDATION_ERROR',
      error: {
        message: validationResult.error || 'Validation failed',
        name: 'ValidationError'
      },
      inputData: this.sanitizeData(inputData),
      user: this.getUserContext(),
      url: window.location.href,
      severity: 'MEDIUM'
    };

    this.logError(context);
    
    console.warn('⚠️ Validation Error:', {
      message: validationResult.error,
      inputData: this.sanitizeData(inputData)
    });
  }

  /**
   * Log network errors
   */
  logNetworkError(error, requestConfig = {}) {
    const context = this.createErrorContext(error, {
      type: 'NETWORK_ERROR',
      requestConfig: {
        url: requestConfig.url || 'unknown',
        method: requestConfig.method || 'unknown',
        timeout: requestConfig.timeout || 'unknown'
      },
      network: this.getNetworkInfo(),
      severity: 'HIGH'
    });

    this.logError(context);
    
    console.error('🌐 Network Error:', {
      message: error.message,
      code: error.code,
      url: requestConfig.url,
      networkInfo: this.getNetworkInfo()
    });
  }

  /**
   * Log performance issues
   */
  logPerformanceIssue(operation, duration, threshold = 5000) {
    if (duration > threshold) {
      const context = {
        timestamp: new Date().toISOString(),
        type: 'PERFORMANCE_ISSUE',
        operation: operation,
        duration: duration,
        threshold: threshold,
        network: this.getNetworkInfo(),
        user: this.getUserContext(),
        url: window.location.href,
        severity: duration > threshold * 2 ? 'HIGH' : 'MEDIUM'
      };

      this.logError(context);
      
      console.warn('🐌 Performance Issue:', {
        operation,
        duration: `${duration}ms`,
        threshold: `${threshold}ms`,
        networkInfo: this.getNetworkInfo()
      });
    }
  }

  /**
   * Sanitize sensitive data before logging
   */
  sanitizeData(data) {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sensitiveFields = [
      'password', 'token', 'authorization', 'credit_card', 'cvv', 'pin',
      'razorpay_key_secret', 'api_key', 'secret'
    ];

    const sanitized = { ...data };

    const sanitizeObject = (obj) => {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const lowerKey = key.toLowerCase();
          
          if (sensitiveFields.some(field => lowerKey.includes(field))) {
            obj[key] = '[REDACTED]';
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            sanitizeObject(obj[key]);
          }
        }
      }
    };

    sanitizeObject(sanitized);
    return sanitized;
  }

  /**
   * Store error log (queue if offline)
   */
  logError(errorContext) {
    // Add to queue
    this.logQueue.push(errorContext);
    
    // Maintain queue size
    if (this.logQueue.length > this.maxQueueSize) {
      this.logQueue.shift(); // Remove oldest entry
    }

    // Store in localStorage for persistence
    try {
      const existingLogs = JSON.parse(localStorage.getItem('billingErrorLogs') || '[]');
      existingLogs.push(errorContext);
      
      // Keep only last 50 logs in localStorage
      if (existingLogs.length > 50) {
        existingLogs.splice(0, existingLogs.length - 50);
      }
      
      localStorage.setItem('billingErrorLogs', JSON.stringify(existingLogs));
    } catch (storageError) {
      console.warn('Failed to store error log in localStorage:', storageError);
    }

    // Try to send immediately if online
    if (this.isOnline) {
      this.sendErrorLog(errorContext);
    }
  }

  /**
   * Send error log to server
   */
  async sendErrorLog(errorContext) {
    try {
      // Only send high severity errors to avoid spam
      if (errorContext.severity !== 'HIGH') {
        return;
      }

      const response = await fetch('/api/error-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(errorContext),
        timeout: 5000
      });

      if (!response.ok) {
        throw new Error(`Failed to send error log: ${response.status}`);
      }

      console.log('📤 Error log sent to server');
    } catch (error) {
      console.warn('Failed to send error log to server:', error.message);
      // Error will remain in queue for retry
    }
  }

  /**
   * Flush queued logs when back online
   */
  async flushQueuedLogs() {
    if (!this.isOnline || this.logQueue.length === 0) {
      return;
    }

    console.log(`📤 Flushing ${this.logQueue.length} queued error logs...`);

    const logsToSend = [...this.logQueue];
    this.logQueue = [];

    for (const log of logsToSend) {
      await this.sendErrorLog(log);
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Get stored error logs for debugging
   */
  getStoredLogs() {
    try {
      return JSON.parse(localStorage.getItem('billingErrorLogs') || '[]');
    } catch (error) {
      console.warn('Failed to retrieve stored error logs:', error);
      return [];
    }
  }

  /**
   * Clear stored error logs
   */
  clearStoredLogs() {
    try {
      localStorage.removeItem('billingErrorLogs');
      this.logQueue = [];
      console.log('🗑️ Error logs cleared');
    } catch (error) {
      console.warn('Failed to clear stored error logs:', error);
    }
  }

  /**
   * Export logs for support
   */
  exportLogs() {
    const logs = this.getStoredLogs();
    const exportData = {
      timestamp: new Date().toISOString(),
      userContext: this.getUserContext(),
      deviceInfo: this.getDeviceInfo(),
      networkInfo: this.getNetworkInfo(),
      logs: logs
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billing-error-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('📁 Error logs exported');
  }
}

// Create singleton instance
export const billingErrorLogger = new BillingErrorLogger();

// Export convenience functions
export const logPaymentError = (error, paymentData) => billingErrorLogger.logPaymentError(error, paymentData);
export const logCorsError = (error, requestDetails) => billingErrorLogger.logCorsError(error, requestDetails);
export const logValidationError = (validationResult, inputData) => billingErrorLogger.logValidationError(validationResult, inputData);
export const logNetworkError = (error, requestConfig) => billingErrorLogger.logNetworkError(error, requestConfig);
export const logPerformanceIssue = (operation, duration, threshold) => billingErrorLogger.logPerformanceIssue(operation, duration, threshold);

export default billingErrorLogger;