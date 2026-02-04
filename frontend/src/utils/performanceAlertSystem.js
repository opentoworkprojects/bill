/**
 * Performance Alert System for Active Orders Display
 * 
 * This utility provides a centralized alert system for performance degradation
 * detection and notification, integrating with the performance monitor and
 * cache systems to provide real-time alerts.
 */

import performanceMonitor from './performanceMonitor';
import activeOrdersCache from './activeOrdersCache';

class PerformanceAlertSystem {
  constructor() {
    this.alerts = {
      enabled: true,
      history: [],
      maxHistorySize: 100,
      cooldownPeriods: new Map(), // alertType -> lastAlertTime
      defaultCooldown: 30000, // 30 seconds
      escalationThresholds: {
        warning: 3, // 3 consecutive warnings = escalation
        critical: 2  // 2 consecutive critical = escalation
      }
    };
    
    this.thresholds = {
      displayTime: {
        warning: 150,   // 150ms
        critical: 500,  // 500ms
        target: 100     // 100ms target
      },
      cacheHitRate: {
        warning: 70,    // 70%
        critical: 50    // 50%
      },
      errorRate: {
        warning: 5,     // 5%
        critical: 15    // 15%
      },
      consecutiveSlowOps: {
        warning: 3,
        critical: 5
      }
    };
    
    this.escalationState = {
      consecutiveWarnings: 0,
      consecutiveCritical: 0,
      lastEscalation: 0,
      escalationCooldown: 300000 // 5 minutes
    };
    
    this.debugMode = process.env.NODE_ENV === 'development';
    
    this.log('PerformanceAlertSystem initialized');
    this.initializeEventListeners();
  }
  
  /**
   * Log debug messages in development mode
   */
  log(message, data = null) {
    if (this.debugMode) {
      const timestamp = new Date().toISOString();
      console.log(`[PerformanceAlerts ${timestamp}] ${message}`, data || '');
    }
  }
  
  /**
   * Initialize event listeners for performance events
   */
  initializeEventListeners() {
    // Listen for performance alerts from performance monitor
    window.addEventListener('performanceAlert', (event) => {
      this.handlePerformanceAlert(event.detail);
    });
    
    // Listen for cache performance alerts
    window.addEventListener('cachePerformanceAlert', (event) => {
      this.handleCachePerformanceAlert(event.detail);
    });
    
    // Periodic performance checks
    this.startPeriodicChecks();
    
    this.log('Event listeners initialized');
  }
  
  /**
   * Start periodic performance checks
   */
  startPeriodicChecks() {
    // Check every 30 seconds
    setInterval(() => {
      this.performPeriodicCheck();
    }, 30000);
    
    // Comprehensive check every 5 minutes
    setInterval(() => {
      this.performComprehensiveCheck();
    }, 300000);
  }
  
  /**
   * Handle performance alert from performance monitor
   * @param {Object} alertData - Alert data from performance monitor
   */
  handlePerformanceAlert(alertData) {
    const { type, message, data, timestamp } = alertData;
    
    this.log(`📨 Performance alert received: ${type}`, data);
    
    // Process different alert types
    switch (type) {
      case 'critical':
        this.processDisplayTimeAlert('critical', data);
        break;
      
      case 'warning':
        this.processDisplayTimeAlert('warning', data);
        break;
      
      case 'consecutive-slow':
        this.processConsecutiveSlowAlert(data);
        break;
      
      default:
        this.processGenericAlert(type, data);
    }
  }
  
  /**
   * Handle cache performance alert
   * @param {Object} alertData - Alert data from cache system
   */
  handleCachePerformanceAlert(alertData) {
    const { type, data, timestamp } = alertData;
    
    this.log(`💾 Cache alert received: ${type}`, data);
    
    switch (type) {
      case 'low-hit-rate':
        this.processCacheHitRateAlert(data);
        break;
      
      case 'slow-cache-hits':
      case 'slow-cache-adds':
        this.processCacheSlowAlert(type, data);
        break;
      
      default:
        this.processGenericAlert(`cache-${type}`, data);
    }
  }
  
  /**
   * Process display time alert
   * @param {string} severity - Alert severity (warning, critical)
   * @param {Object} data - Alert data
   */
  processDisplayTimeAlert(severity, data) {
    const { displayTime, operationType } = data;
    
    const alert = {
      id: this.generateAlertId(),
      type: 'display-time',
      severity,
      message: `${operationType} took ${displayTime.toFixed(0)}ms (target: ${this.thresholds.displayTime.target}ms)`,
      data: {
        displayTime,
        operationType,
        threshold: this.thresholds.displayTime[severity],
        target: this.thresholds.displayTime.target
      },
      timestamp: Date.now(),
      acknowledged: false
    };
    
    this.addAlert(alert);
    
    // Check for escalation
    if (severity === 'critical') {
      this.escalationState.consecutiveCritical++;
      this.escalationState.consecutiveWarnings = 0;
    } else if (severity === 'warning') {
      this.escalationState.consecutiveWarnings++;
    }
    
    this.checkEscalation();
  }
  
  /**
   * Process consecutive slow operations alert
   * @param {Object} data - Alert data
   */
  processConsecutiveSlowAlert(data) {
    const { count, lastOperation } = data;
    
    const severity = count >= this.thresholds.consecutiveSlowOps.critical ? 'critical' : 'warning';
    
    const alert = {
      id: this.generateAlertId(),
      type: 'consecutive-slow',
      severity,
      message: `${count} consecutive slow operations detected`,
      data: {
        count,
        lastOperation: lastOperation.operationType,
        lastDisplayTime: lastOperation.displayTime
      },
      timestamp: Date.now(),
      acknowledged: false
    };
    
    this.addAlert(alert);
    
    // Immediate escalation for consecutive slow operations
    if (severity === 'critical') {
      this.triggerEscalation('consecutive-slow-critical', alert);
    }
  }
  
  /**
   * Process cache hit rate alert
   * @param {Object} data - Alert data
   */
  processCacheHitRateAlert(data) {
    const { hitRate, threshold } = data;
    
    const severity = hitRate < this.thresholds.cacheHitRate.critical ? 'critical' : 'warning';
    
    const alert = {
      id: this.generateAlertId(),
      type: 'cache-hit-rate',
      severity,
      message: `Cache hit rate is ${hitRate.toFixed(1)}% (threshold: ${threshold}%)`,
      data: {
        hitRate,
        threshold,
        impact: 'Increased server load and slower response times'
      },
      timestamp: Date.now(),
      acknowledged: false
    };
    
    this.addAlert(alert);
  }
  
  /**
   * Process cache slow operation alert
   * @param {string} type - Alert type
   * @param {Object} data - Alert data
   */
  processCacheSlowAlert(type, data) {
    const { averageTime, threshold } = data;
    
    const alert = {
      id: this.generateAlertId(),
      type: `cache-slow-${type.replace('slow-cache-', '')}`,
      severity: 'warning',
      message: `Slow cache ${type.replace('slow-cache-', '')}: ${averageTime.toFixed(1)}ms average (threshold: ${threshold}ms)`,
      data: {
        averageTime,
        threshold,
        operation: type.replace('slow-cache-', '')
      },
      timestamp: Date.now(),
      acknowledged: false
    };
    
    this.addAlert(alert);
  }
  
  /**
   * Process generic alert
   * @param {string} type - Alert type
   * @param {Object} data - Alert data
   */
  processGenericAlert(type, data) {
    const alert = {
      id: this.generateAlertId(),
      type,
      severity: 'info',
      message: `Performance issue detected: ${type}`,
      data,
      timestamp: Date.now(),
      acknowledged: false
    };
    
    this.addAlert(alert);
  }
  
  /**
   * Add alert to system
   * @param {Object} alert - Alert object
   */
  addAlert(alert) {
    // Check cooldown
    if (this.isInCooldown(alert.type)) {
      this.log(`⏳ Alert ${alert.type} in cooldown, skipping`);
      return;
    }
    
    // Add to history
    this.alerts.history.push(alert);
    
    // Maintain history size
    if (this.alerts.history.length > this.alerts.maxHistorySize) {
      this.alerts.history.shift();
    }
    
    // Set cooldown
    this.alerts.cooldownPeriods.set(alert.type, Date.now());
    
    this.log(`🚨 ALERT ADDED: ${alert.type} (${alert.severity})`, alert);
    
    // Dispatch alert event
    this.dispatchAlert(alert);
    
    // Show user notification if enabled
    this.showUserNotification(alert);
  }
  
  /**
   * Check if alert type is in cooldown
   * @param {string} alertType - Alert type
   * @returns {boolean} - True if in cooldown
   */
  isInCooldown(alertType) {
    const lastAlert = this.alerts.cooldownPeriods.get(alertType);
    if (!lastAlert) return false;
    
    return Date.now() - lastAlert < this.alerts.defaultCooldown;
  }
  
  /**
   * Check for escalation conditions
   */
  checkEscalation() {
    const now = Date.now();
    
    // Check escalation cooldown
    if (now - this.escalationState.lastEscalation < this.escalationState.escalationCooldown) {
      return;
    }
    
    // Check for warning escalation
    if (this.escalationState.consecutiveWarnings >= this.alerts.escalationThresholds.warning) {
      this.triggerEscalation('consecutive-warnings', {
        count: this.escalationState.consecutiveWarnings
      });
      this.escalationState.consecutiveWarnings = 0;
    }
    
    // Check for critical escalation
    if (this.escalationState.consecutiveCritical >= this.alerts.escalationThresholds.critical) {
      this.triggerEscalation('consecutive-critical', {
        count: this.escalationState.consecutiveCritical
      });
      this.escalationState.consecutiveCritical = 0;
    }
  }
  
  /**
   * Trigger escalation
   * @param {string} escalationType - Type of escalation
   * @param {Object} data - Escalation data
   */
  triggerEscalation(escalationType, data) {
    this.escalationState.lastEscalation = Date.now();
    
    const escalationAlert = {
      id: this.generateAlertId(),
      type: 'escalation',
      severity: 'critical',
      message: `Performance escalation: ${escalationType}`,
      data: {
        escalationType,
        ...data
      },
      timestamp: Date.now(),
      acknowledged: false,
      isEscalation: true
    };
    
    this.log(`🚨🚨 ESCALATION TRIGGERED: ${escalationType}`, data);
    
    // Add escalation alert (bypasses cooldown)
    this.alerts.history.push(escalationAlert);
    this.dispatchAlert(escalationAlert);
    this.showUserNotification(escalationAlert, true);
  }
  
  /**
   * Dispatch alert event
   * @param {Object} alert - Alert object
   */
  dispatchAlert(alert) {
    const alertEvent = new CustomEvent('performanceAlertSystemAlert', {
      detail: alert
    });
    
    window.dispatchEvent(alertEvent);
  }
  
  /**
   * Show user notification
   * @param {Object} alert - Alert object
   * @param {boolean} forceShow - Force show even if notifications disabled
   */
  showUserNotification(alert, forceShow = false) {
    if (!this.alerts.enabled && !forceShow) return;
    
    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(`Performance Alert: ${alert.type}`, {
        body: alert.message,
        icon: '/icon-192.png',
        tag: `perf-alert-${alert.id}`,
        requireInteraction: alert.severity === 'critical' || alert.isEscalation
      });
      
      // Auto-close after 10 seconds for non-critical alerts
      if (alert.severity !== 'critical' && !alert.isEscalation) {
        setTimeout(() => notification.close(), 10000);
      }
    }
    
    // Console warning for development
    if (this.debugMode) {
      const logMethod = alert.severity === 'critical' ? 'error' : 'warn';
      console[logMethod](`🚨 Performance Alert: ${alert.message}`, alert.data);
    }
  }
  
  /**
   * Perform periodic performance check
   */
  performPeriodicCheck() {
    if (!this.alerts.enabled) return;
    
    // Get current performance stats
    const perfStats = performanceMonitor.getStats();
    const cacheStats = activeOrdersCache.getPerformanceStats();
    
    // Check display time performance
    if (perfStats.averageDisplayTime > this.thresholds.displayTime.warning) {
      this.processDisplayTimeAlert(
        perfStats.averageDisplayTime > this.thresholds.displayTime.critical ? 'critical' : 'warning',
        {
          displayTime: perfStats.averageDisplayTime,
          operationType: 'average-performance'
        }
      );
    }
    
    // Check cache hit rate
    if (cacheStats.hitRate < this.thresholds.cacheHitRate.warning) {
      this.processCacheHitRateAlert({
        hitRate: cacheStats.hitRate,
        threshold: this.thresholds.cacheHitRate.warning
      });
    }
    
    // Check error rate
    if (perfStats.errorRate > this.thresholds.errorRate.warning) {
      this.processGenericAlert('high-error-rate', {
        errorRate: perfStats.errorRate,
        threshold: this.thresholds.errorRate.warning
      });
    }
  }
  
  /**
   * Perform comprehensive performance check
   */
  performComprehensiveCheck() {
    this.log('🔍 Performing comprehensive performance check');
    
    // Generate performance report
    const report = performanceMonitor.generateReport();
    const cacheStats = activeOrdersCache.getPerformanceStats();
    
    // Check for performance trends
    const trends = performanceMonitor.analyzeTrends();
    
    if (trends.trend === 'degrading' && trends.percentageChange > 50) {
      this.processGenericAlert('performance-degrading', {
        trend: trends.trend,
        percentageChange: trends.percentageChange,
        recentAverage: trends.recentAverage,
        olderAverage: trends.olderAverage
      });
    }
    
    // Log comprehensive stats
    this.log('📊 Comprehensive performance check complete', {
      report: report.summary,
      cacheStats: {
        hitRate: cacheStats.hitRate,
        averageTimes: cacheStats.averageTimes
      },
      trends
    });
  }
  
  /**
   * Generate unique alert ID
   * @returns {string} - Unique alert ID
   */
  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Get alert history
   * @param {Object} filters - Filters for alerts
   * @returns {Array} - Filtered alert history
   */
  getAlertHistory(filters = {}) {
    let alerts = [...this.alerts.history];
    
    if (filters.severity) {
      alerts = alerts.filter(alert => alert.severity === filters.severity);
    }
    
    if (filters.type) {
      alerts = alerts.filter(alert => alert.type === filters.type);
    }
    
    if (filters.acknowledged !== undefined) {
      alerts = alerts.filter(alert => alert.acknowledged === filters.acknowledged);
    }
    
    if (filters.timeRange) {
      const cutoff = Date.now() - filters.timeRange;
      alerts = alerts.filter(alert => alert.timestamp >= cutoff);
    }
    
    return alerts.sort((a, b) => b.timestamp - a.timestamp);
  }
  
  /**
   * Acknowledge alert
   * @param {string} alertId - Alert ID to acknowledge
   */
  acknowledgeAlert(alertId) {
    const alert = this.alerts.history.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = Date.now();
      this.log(`✅ Alert acknowledged: ${alertId}`);
    }
  }
  
  /**
   * Get system status
   * @returns {Object} - System status
   */
  getStatus() {
    const recentAlerts = this.getAlertHistory({ timeRange: 3600000 }); // Last hour
    const criticalAlerts = recentAlerts.filter(a => a.severity === 'critical');
    const unacknowledgedAlerts = recentAlerts.filter(a => !a.acknowledged);
    
    return {
      enabled: this.alerts.enabled,
      totalAlerts: this.alerts.history.length,
      recentAlerts: recentAlerts.length,
      criticalAlerts: criticalAlerts.length,
      unacknowledgedAlerts: unacknowledgedAlerts.length,
      escalationState: { ...this.escalationState },
      thresholds: { ...this.thresholds }
    };
  }
  
  /**
   * Enable or disable alert system
   * @param {boolean} enabled - Whether to enable alerts
   */
  setEnabled(enabled) {
    this.alerts.enabled = enabled;
    this.log(`Alert system ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  /**
   * Update alert thresholds
   * @param {Object} newThresholds - New threshold values
   */
  updateThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    this.log('Alert thresholds updated', this.thresholds);
  }
  
  /**
   * Clear alert history
   */
  clearHistory() {
    this.alerts.history = [];
    this.escalationState.consecutiveWarnings = 0;
    this.escalationState.consecutiveCritical = 0;
    this.log('Alert history cleared');
  }
}

// Create singleton instance
const performanceAlertSystem = new PerformanceAlertSystem();

// Export both class and singleton
export { PerformanceAlertSystem };
export default performanceAlertSystem;