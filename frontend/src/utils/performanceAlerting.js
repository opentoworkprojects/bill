/**
 * Performance Alerting System
 * Handles threshold violations and alert notifications
 * Requirements: 11.3 - Alert administrators when Performance_Threshold limits are exceeded
 */

class PerformanceAlertingSystem {
  constructor() {
    this.alertRules = new Map();
    this.alertHistory = [];
    this.notificationCallbacks = new Set();
    this.suppressionRules = new Map();
    this.enabled = true;
    
    // Initialize default alert rules
    this.initializeDefaultRules();
  }

  /**
   * Initialize default alerting rules based on requirements
   */
  initializeDefaultRules() {
    // UI Response Time Alerts (Requirements 1.1-1.4)
    this.addAlertRule('ui_click', {
      threshold: 50,
      severity: 'high',
      message: 'UI click response time exceeded 50ms threshold',
      suppressionWindow: 30000 // 30 seconds
    });

    this.addAlertRule('ui_typing', {
      threshold: 100,
      severity: 'medium',
      message: 'UI typing response time exceeded 100ms threshold',
      suppressionWindow: 60000 // 1 minute
    });

    this.addAlertRule('ui_navigation', {
      threshold: 200,
      severity: 'medium',
      message: 'UI navigation response time exceeded 200ms threshold',
      suppressionWindow: 60000
    });

    this.addAlertRule('ui_cart_update', {
      threshold: 100,
      severity: 'high',
      message: 'Cart update response time exceeded 100ms threshold',
      suppressionWindow: 30000
    });

    // Menu Performance Alerts (Requirements 2.1-2.3)
    this.addAlertRule('menu_load', {
      threshold: 500,
      severity: 'high',
      message: 'Menu loading time exceeded 500ms threshold',
      suppressionWindow: 120000 // 2 minutes
    });

    this.addAlertRule('menu_search', {
      threshold: 200,
      severity: 'medium',
      message: 'Menu search response time exceeded 200ms threshold',
      suppressionWindow: 60000
    });

    this.addAlertRule('menu_item_details', {
      threshold: 300,
      severity: 'medium',
      message: 'Menu item details loading exceeded 300ms threshold',
      suppressionWindow: 60000
    });

    // API Performance Alerts (Requirements 5.1, 5.2)
    this.addAlertRule('api_response', {
      threshold: 500,
      severity: 'high',
      message: 'API response time exceeded 500ms threshold',
      suppressionWindow: 60000
    });

    this.addAlertRule('database_query', {
      threshold: 200,
      severity: 'critical',
      message: 'Database query time exceeded 200ms threshold',
      suppressionWindow: 30000
    });

    // Cache Performance Alerts (Requirements 6.1, 6.2)
    this.addAlertRule('cache_memory', {
      threshold: 10,
      severity: 'critical',
      message: 'Memory cache response time exceeded 10ms threshold',
      suppressionWindow: 30000
    });

    // Real-time Update Alerts (Requirements 7.1, 7.2, 10.1, 10.2)
    this.addAlertRule('realtime_kitchen', {
      threshold: 2000,
      severity: 'critical',
      message: 'Kitchen display update exceeded 2s threshold',
      suppressionWindow: 60000
    });

    this.addAlertRule('realtime_client', {
      threshold: 3000,
      severity: 'high',
      message: 'Client update exceeded 3s threshold',
      suppressionWindow: 60000
    });

    // Payment Processing Alerts (Requirements 4.1, 4.3, 4.4)
    this.addAlertRule('payment_validation', {
      threshold: 300,
      severity: 'high',
      message: 'Payment validation exceeded 300ms threshold',
      suppressionWindow: 30000
    });

    this.addAlertRule('payment_confirmation', {
      threshold: 500,
      severity: 'critical',
      message: 'Payment confirmation exceeded 500ms threshold',
      suppressionWindow: 30000
    });

    // Progressive Loading Alerts (Requirements 9.1, 9.2)
    this.addAlertRule('app_load', {
      threshold: 1000,
      severity: 'high',
      message: 'Application load time exceeded 1s threshold',
      suppressionWindow: 300000 // 5 minutes
    });
  }

  /**
   * Add a new alert rule
   */
  addAlertRule(operationType, rule) {
    this.alertRules.set(operationType, {
      threshold: rule.threshold,
      severity: rule.severity || 'medium',
      message: rule.message || `${operationType} performance threshold exceeded`,
      suppressionWindow: rule.suppressionWindow || 60000,
      enabled: rule.enabled !== false,
      consecutiveViolations: rule.consecutiveViolations || 1,
      currentStreak: 0
    });
  }

  /**
   * Process a performance violation and determine if alert should be sent
   */
  processViolation(violation) {
    if (!this.enabled) return false;

    const rule = this.alertRules.get(violation.operationType);
    if (!rule || !rule.enabled) return false;

    // Check if violation meets threshold
    if (violation.duration <= rule.threshold) {
      // Reset consecutive violation counter
      rule.currentStreak = 0;
      return false;
    }

    // Increment consecutive violations
    rule.currentStreak++;

    // Check if we need consecutive violations
    if (rule.currentStreak < rule.consecutiveViolations) {
      return false;
    }

    // Check suppression window
    if (this.isSupressed(violation.operationType, rule.suppressionWindow)) {
      return false;
    }

    // Create alert
    const alert = this.createAlert(violation, rule);
    
    // Record suppression
    this.recordSuppression(violation.operationType);
    
    // Add to history
    this.alertHistory.push(alert);
    
    // Keep only last 100 alerts
    if (this.alertHistory.length > 100) {
      this.alertHistory.splice(0, this.alertHistory.length - 100);
    }

    // Send notifications
    this.sendNotifications(alert);

    return true;
  }

  /**
   * Create alert object from violation and rule
   */
  createAlert(violation, rule) {
    return {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      operationType: violation.operationType,
      operationId: violation.operationId,
      duration: violation.duration,
      threshold: rule.threshold,
      severity: rule.severity,
      message: rule.message,
      metadata: violation.metadata || {},
      acknowledged: false,
      resolved: false
    };
  }

  /**
   * Check if alerts for operation type are suppressed
   */
  isSupressed(operationType, suppressionWindow) {
    const lastAlert = this.suppressionRules.get(operationType);
    if (!lastAlert) return false;

    const now = Date.now();
    return (now - lastAlert) < suppressionWindow;
  }

  /**
   * Record suppression timestamp
   */
  recordSuppression(operationType) {
    this.suppressionRules.set(operationType, Date.now());
  }

  /**
   * Send notifications to all registered callbacks
   */
  sendNotifications(alert) {
    this.notificationCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Error in alert notification callback:', error);
      }
    });

    // Log alert based on severity
    this.logAlert(alert);

    // Send browser notification for critical alerts
    this.sendBrowserNotification(alert);

    // Send to external monitoring systems if configured
    this.sendToExternalSystems(alert);
  }

  /**
   * Log alert with appropriate level
   */
  logAlert(alert) {
    const emoji = this.getSeverityEmoji(alert.severity);
    const message = `${emoji} PERFORMANCE ALERT [${alert.severity.toUpperCase()}]: ${alert.message} (${alert.duration}ms > ${alert.threshold}ms)`;
    
    switch (alert.severity) {
      case 'critical':
        console.error(message, alert);
        break;
      case 'high':
        console.warn(message, alert);
        break;
      default:
        console.log(message, alert);
    }
  }

  /**
   * Send browser notification for critical alerts
   */
  sendBrowserNotification(alert) {
    if (alert.severity !== 'critical' && alert.severity !== 'high') return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    try {
      new Notification('Performance Alert', {
        body: `${alert.message} (${alert.duration}ms)`,
        icon: '/favicon.ico',
        tag: `perf-alert-${alert.operationType}`, // Prevent duplicate notifications
        requireInteraction: alert.severity === 'critical'
      });
    } catch (error) {
      console.warn('Failed to send browser notification:', error);
    }
  }

  /**
   * Send alert to external monitoring systems
   */
  sendToExternalSystems(alert) {
    // This would integrate with external monitoring services
    // For now, we'll just store it for potential webhook integration
    
    if (typeof window !== 'undefined' && window.performanceWebhook) {
      try {
        fetch(window.performanceWebhook, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'performance_alert',
            alert: alert,
            timestamp: new Date().toISOString()
          })
        }).catch(error => {
          console.warn('Failed to send alert to webhook:', error);
        });
      } catch (error) {
        console.warn('Error sending to external systems:', error);
      }
    }
  }

  /**
   * Get emoji for severity level
   */
  getSeverityEmoji(severity) {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '⚡';
      case 'low': return 'ℹ️';
      default: return '📊';
    }
  }

  /**
   * Register notification callback
   */
  onAlert(callback) {
    this.notificationCallbacks.add(callback);
    return () => this.notificationCallbacks.delete(callback);
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId, acknowledgedBy = 'user') {
    const alert = this.alertHistory.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedBy = acknowledgedBy;
      alert.acknowledgedAt = new Date().toISOString();
    }
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId, resolvedBy = 'user', resolution = '') {
    const alert = this.alertHistory.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedBy = resolvedBy;
      alert.resolvedAt = new Date().toISOString();
      alert.resolution = resolution;
    }
  }

  /**
   * Get alert statistics
   */
  getAlertStats(timeRange = 3600000) { // Default 1 hour
    const now = Date.now();
    const cutoff = new Date(now - timeRange);
    
    const recentAlerts = this.alertHistory.filter(
      alert => new Date(alert.timestamp) > cutoff
    );

    const bySeverity = {
      critical: recentAlerts.filter(a => a.severity === 'critical').length,
      high: recentAlerts.filter(a => a.severity === 'high').length,
      medium: recentAlerts.filter(a => a.severity === 'medium').length,
      low: recentAlerts.filter(a => a.severity === 'low').length
    };

    const byOperation = {};
    recentAlerts.forEach(alert => {
      byOperation[alert.operationType] = (byOperation[alert.operationType] || 0) + 1;
    });

    return {
      total: recentAlerts.length,
      bySeverity,
      byOperation,
      acknowledged: recentAlerts.filter(a => a.acknowledged).length,
      resolved: recentAlerts.filter(a => a.resolved).length,
      recentAlerts: recentAlerts.slice(-10)
    };
  }

  /**
   * Enable/disable alerting system
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    console.log(`🔔 Performance alerting ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Update alert rule
   */
  updateAlertRule(operationType, updates) {
    const rule = this.alertRules.get(operationType);
    if (rule) {
      Object.assign(rule, updates);
    }
  }

  /**
   * Get all alert rules
   */
  getAlertRules() {
    return Object.fromEntries(this.alertRules);
  }

  /**
   * Clear alert history
   */
  clearAlertHistory() {
    this.alertHistory = [];
    this.suppressionRules.clear();
    console.log('🗑️ Alert history cleared');
  }
}

// Singleton instance
export const performanceAlerting = new PerformanceAlertingSystem();

// Convenience functions
export const addAlertRule = (operationType, rule) => 
  performanceAlerting.addAlertRule(operationType, rule);

export const onPerformanceAlert = (callback) => 
  performanceAlerting.onAlert(callback);

export const acknowledgeAlert = (alertId, acknowledgedBy) => 
  performanceAlerting.acknowledgeAlert(alertId, acknowledgedBy);

export const resolveAlert = (alertId, resolvedBy, resolution) => 
  performanceAlerting.resolveAlert(alertId, resolvedBy, resolution);

export const getAlertStats = (timeRange) => 
  performanceAlerting.getAlertStats(timeRange);

// Global access for debugging
if (typeof window !== 'undefined') {
  window.performanceAlerting = {
    getStats: () => performanceAlerting.getAlertStats(),
    getRules: () => performanceAlerting.getAlertRules(),
    setEnabled: (enabled) => performanceAlerting.setEnabled(enabled),
    clearHistory: () => performanceAlerting.clearAlertHistory(),
    alerting: performanceAlerting
  };
}

export default performanceAlerting;