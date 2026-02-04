/**
 * Performance Logger for Active Orders System
 * 
 * This utility provides comprehensive logging for debugging and optimization
 * of the active orders display system, with structured logging, filtering,
 * and export capabilities.
 */

class PerformanceLogger {
  constructor() {
    this.logs = [];
    this.maxLogSize = 1000; // Keep last 1000 log entries
    this.logLevels = {
      DEBUG: 0,
      INFO: 1,
      WARN: 2,
      ERROR: 3,
      CRITICAL: 4
    };
    
    this.currentLogLevel = process.env.NODE_ENV === 'development' ? 
      this.logLevels.DEBUG : this.logLevels.INFO;
    
    this.categories = {
      PERFORMANCE: 'performance',
      CACHE: 'cache',
      SYNC: 'sync',
      POLLING: 'polling',
      UI: 'ui',
      ERROR: 'error',
      NETWORK: 'network',
      USER_ACTION: 'user_action'
    };
    
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    
    this.log('INFO', 'SYSTEM', 'PerformanceLogger initialized', {
      sessionId: this.sessionId,
      logLevel: this.getCurrentLogLevelName(),
      maxLogSize: this.maxLogSize
    });
    
    // Initialize performance observers if available
    this.initializePerformanceObservers();
  }
  
  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Get current log level name
   */
  getCurrentLogLevelName() {
    return Object.keys(this.logLevels).find(
      key => this.logLevels[key] === this.currentLogLevel
    );
  }
  
  /**
   * Initialize performance observers for automatic logging
   */
  initializePerformanceObservers() {
    try {
      // Observe navigation timing
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.logPerformanceEntry(entry);
          }
        });
        
        observer.observe({ entryTypes: ['navigation', 'measure', 'mark'] });
      }
      
      // Observe long tasks
      if ('PerformanceObserver' in window && 'PerformanceLongTaskTiming' in window) {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.log('WARN', 'PERFORMANCE', 'Long task detected', {
              duration: entry.duration,
              startTime: entry.startTime,
              name: entry.name
            });
          }
        });
        
        longTaskObserver.observe({ entryTypes: ['longtask'] });
      }
      
    } catch (error) {
      this.log('WARN', 'SYSTEM', 'Failed to initialize performance observers', { error: error.message });
    }
  }
  
  /**
   * Log performance entry from PerformanceObserver
   */
  logPerformanceEntry(entry) {
    if (entry.entryType === 'navigation') {
      this.log('INFO', 'PERFORMANCE', 'Navigation timing', {
        domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
        loadComplete: entry.loadEventEnd - entry.loadEventStart,
        domInteractive: entry.domInteractive - entry.navigationStart,
        firstPaint: entry.responseEnd - entry.requestStart
      });
    } else if (entry.entryType === 'measure') {
      this.log('DEBUG', 'PERFORMANCE', `Performance measure: ${entry.name}`, {
        duration: entry.duration,
        startTime: entry.startTime
      });
    } else if (entry.entryType === 'mark') {
      this.log('DEBUG', 'PERFORMANCE', `Performance mark: ${entry.name}`, {
        startTime: entry.startTime
      });
    }
  }
  
  /**
   * Main logging method
   * @param {string} level - Log level (DEBUG, INFO, WARN, ERROR, CRITICAL)
   * @param {string} category - Log category
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   * @param {Object} context - Additional context
   */
  log(level, category, message, data = {}, context = {}) {
    const levelValue = this.logLevels[level] || this.logLevels.INFO;
    
    // Filter by log level
    if (levelValue < this.currentLogLevel) {
      return;
    }
    
    const logEntry = {
      id: this.generateLogId(),
      timestamp: Date.now(),
      sessionId: this.sessionId,
      level,
      category,
      message,
      data,
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        sessionTime: Date.now() - this.startTime,
        ...context
      }
    };
    
    // Add to logs array
    this.logs.push(logEntry);
    
    // Maintain log size limit
    if (this.logs.length > this.maxLogSize) {
      this.logs.shift();
    }
    
    // Console output in development
    if (process.env.NODE_ENV === 'development') {
      this.outputToConsole(logEntry);
    }
    
    // Dispatch log event for external listeners
    this.dispatchLogEvent(logEntry);
  }
  
  /**
   * Generate unique log ID
   */
  generateLogId() {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }
  
  /**
   * Output log entry to console
   */
  outputToConsole(logEntry) {
    const { level, category, message, data } = logEntry;
    const timestamp = new Date(logEntry.timestamp).toISOString();
    const prefix = `[${timestamp}] [${level}] [${category}]`;
    
    const consoleMethod = {
      DEBUG: 'debug',
      INFO: 'info',
      WARN: 'warn',
      ERROR: 'error',
      CRITICAL: 'error'
    }[level] || 'log';
    
    if (Object.keys(data).length > 0) {
      console[consoleMethod](`${prefix} ${message}`, data);
    } else {
      console[consoleMethod](`${prefix} ${message}`);
    }
  }
  
  /**
   * Dispatch log event for external listeners
   */
  dispatchLogEvent(logEntry) {
    const logEvent = new CustomEvent('performanceLog', {
      detail: logEntry
    });
    
    window.dispatchEvent(logEvent);
  }
  
  /**
   * Convenience methods for different log levels
   */
  debug(category, message, data, context) {
    this.log('DEBUG', category, message, data, context);
  }
  
  info(category, message, data, context) {
    this.log('INFO', category, message, data, context);
  }
  
  warn(category, message, data, context) {
    this.log('WARN', category, message, data, context);
  }
  
  error(category, message, data, context) {
    this.log('ERROR', category, message, data, context);
  }
  
  critical(category, message, data, context) {
    this.log('CRITICAL', category, message, data, context);
  }
  
  /**
   * Log performance timing
   * @param {string} operation - Operation name
   * @param {number} duration - Duration in milliseconds
   * @param {Object} metadata - Additional metadata
   */
  logTiming(operation, duration, metadata = {}) {
    const level = duration > 500 ? 'WARN' : duration > 100 ? 'INFO' : 'DEBUG';
    
    this.log(level, this.categories.PERFORMANCE, `Timing: ${operation}`, {
      operation,
      duration,
      ...metadata
    });
  }
  
  /**
   * Log cache operation
   * @param {string} operation - Cache operation (hit, miss, add, remove, sync)
   * @param {Object} details - Operation details
   */
  logCacheOperation(operation, details = {}) {
    this.log('DEBUG', this.categories.CACHE, `Cache ${operation}`, {
      operation,
      ...details
    });
  }
  
  /**
   * Log sync operation
   * @param {string} syncType - Type of sync operation
   * @param {Object} details - Sync details
   */
  logSyncOperation(syncType, details = {}) {
    this.log('INFO', this.categories.SYNC, `Sync: ${syncType}`, {
      syncType,
      ...details
    });
  }
  
  /**
   * Log polling operation
   * @param {string} pollingType - Type of polling operation
   * @param {Object} details - Polling details
   */
  logPollingOperation(pollingType, details = {}) {
    this.log('DEBUG', this.categories.POLLING, `Polling: ${pollingType}`, {
      pollingType,
      ...details
    });
  }
  
  /**
   * Log UI interaction
   * @param {string} interaction - Type of interaction
   * @param {Object} details - Interaction details
   */
  logUIInteraction(interaction, details = {}) {
    this.log('DEBUG', this.categories.UI, `UI: ${interaction}`, {
      interaction,
      ...details
    });
  }
  
  /**
   * Log user action
   * @param {string} action - User action
   * @param {Object} details - Action details
   */
  logUserAction(action, details = {}) {
    this.log('INFO', this.categories.USER_ACTION, `User: ${action}`, {
      action,
      ...details
    });
  }
  
  /**
   * Log network operation
   * @param {string} operation - Network operation
   * @param {Object} details - Operation details
   */
  logNetworkOperation(operation, details = {}) {
    const level = details.error ? 'ERROR' : details.duration > 5000 ? 'WARN' : 'DEBUG';
    
    this.log(level, this.categories.NETWORK, `Network: ${operation}`, {
      operation,
      ...details
    });
  }
  
  /**
   * Get filtered logs
   * @param {Object} filters - Filter criteria
   * @returns {Array} - Filtered log entries
   */
  getLogs(filters = {}) {
    let filteredLogs = [...this.logs];
    
    if (filters.level) {
      const levelValue = this.logLevels[filters.level];
      filteredLogs = filteredLogs.filter(log => this.logLevels[log.level] >= levelValue);
    }
    
    if (filters.category) {
      filteredLogs = filteredLogs.filter(log => log.category === filters.category);
    }
    
    if (filters.timeRange) {
      const cutoff = Date.now() - filters.timeRange;
      filteredLogs = filteredLogs.filter(log => log.timestamp >= cutoff);
    }
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        log.message.toLowerCase().includes(searchTerm) ||
        JSON.stringify(log.data).toLowerCase().includes(searchTerm)
      );
    }
    
    return filteredLogs.sort((a, b) => b.timestamp - a.timestamp);
  }
  
  /**
   * Get log statistics
   * @returns {Object} - Log statistics
   */
  getStats() {
    const stats = {
      totalLogs: this.logs.length,
      sessionTime: Date.now() - this.startTime,
      levelCounts: {},
      categoryCounts: {},
      recentErrors: 0,
      averageLogRate: 0
    };
    
    // Count by level and category
    this.logs.forEach(log => {
      stats.levelCounts[log.level] = (stats.levelCounts[log.level] || 0) + 1;
      stats.categoryCounts[log.category] = (stats.categoryCounts[log.category] || 0) + 1;
      
      // Count recent errors (last 5 minutes)
      if ((log.level === 'ERROR' || log.level === 'CRITICAL') && 
          Date.now() - log.timestamp < 300000) {
        stats.recentErrors++;
      }
    });
    
    // Calculate average log rate (logs per minute)
    if (stats.sessionTime > 0) {
      stats.averageLogRate = (stats.totalLogs / (stats.sessionTime / 60000)).toFixed(2);
    }
    
    return stats;
  }
  
  /**
   * Export logs to JSON
   * @param {Object} filters - Filter criteria
   * @returns {string} - JSON string of logs
   */
  exportLogs(filters = {}) {
    const logsToExport = this.getLogs(filters);
    const exportData = {
      sessionId: this.sessionId,
      exportTime: new Date().toISOString(),
      filters,
      stats: this.getStats(),
      logs: logsToExport
    };
    
    return JSON.stringify(exportData, null, 2);
  }
  
  /**
   * Download logs as file
   * @param {Object} filters - Filter criteria
   * @param {string} filename - Optional filename
   */
  downloadLogs(filters = {}, filename = null) {
    const logsJson = this.exportLogs(filters);
    const defaultFilename = `performance-logs-${this.sessionId}-${Date.now()}.json`;
    
    const blob = new Blob([logsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || defaultFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    this.info('SYSTEM', 'Logs downloaded', { filename: filename || defaultFilename });
  }
  
  /**
   * Clear logs
   * @param {Object} filters - Optional filters to clear specific logs
   */
  clearLogs(filters = {}) {
    if (Object.keys(filters).length === 0) {
      // Clear all logs
      const clearedCount = this.logs.length;
      this.logs = [];
      this.info('SYSTEM', 'All logs cleared', { clearedCount });
    } else {
      // Clear filtered logs
      const logsToKeep = this.logs.filter(log => {
        if (filters.level && this.logLevels[log.level] >= this.logLevels[filters.level]) {
          return false;
        }
        if (filters.category && log.category === filters.category) {
          return false;
        }
        if (filters.timeRange && Date.now() - log.timestamp < filters.timeRange) {
          return false;
        }
        return true;
      });
      
      const clearedCount = this.logs.length - logsToKeep.length;
      this.logs = logsToKeep;
      this.info('SYSTEM', 'Filtered logs cleared', { clearedCount, filters });
    }
  }
  
  /**
   * Set log level
   * @param {string} level - New log level
   */
  setLogLevel(level) {
    if (this.logLevels[level] !== undefined) {
      this.currentLogLevel = this.logLevels[level];
      this.info('SYSTEM', 'Log level changed', { 
        oldLevel: this.getCurrentLogLevelName(),
        newLevel: level 
      });
    }
  }
  
  /**
   * Add custom log listener
   * @param {Function} listener - Log listener function
   * @returns {Function} - Cleanup function
   */
  addLogListener(listener) {
    const handleLogEvent = (event) => {
      listener(event.detail);
    };
    
    window.addEventListener('performanceLog', handleLogEvent);
    
    return () => {
      window.removeEventListener('performanceLog', handleLogEvent);
    };
  }
  
  /**
   * Create performance mark
   * @param {string} name - Mark name
   */
  mark(name) {
    if ('performance' in window && 'mark' in performance) {
      performance.mark(name);
      this.debug('PERFORMANCE', `Performance mark: ${name}`);
    }
  }
  
  /**
   * Create performance measure
   * @param {string} name - Measure name
   * @param {string} startMark - Start mark name
   * @param {string} endMark - End mark name (optional)
   */
  measure(name, startMark, endMark = null) {
    if ('performance' in window && 'measure' in performance) {
      try {
        if (endMark) {
          performance.measure(name, startMark, endMark);
        } else {
          performance.measure(name, startMark);
        }
        
        const measure = performance.getEntriesByName(name, 'measure')[0];
        if (measure) {
          this.logTiming(name, measure.duration, {
            startMark,
            endMark,
            startTime: measure.startTime
          });
        }
      } catch (error) {
        this.warn('PERFORMANCE', `Failed to create measure: ${name}`, { error: error.message });
      }
    }
  }
  
  /**
   * Get system information for debugging
   * @returns {Object} - System information
   */
  getSystemInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth
      },
      window: {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio
      },
      performance: {
        supported: 'performance' in window,
        timing: 'timing' in (window.performance || {}),
        navigation: 'navigation' in (window.performance || {}),
        memory: 'memory' in (window.performance || {})
      },
      storage: {
        localStorage: 'localStorage' in window,
        sessionStorage: 'sessionStorage' in window,
        indexedDB: 'indexedDB' in window
      }
    };
  }
}

// Create singleton instance
const performanceLogger = new PerformanceLogger();

// Export both class and singleton
export { PerformanceLogger };
export default performanceLogger;