/**
 * Centralized logging utility for frontend
 * Automatically disables logs in production
 */

class Logger {
  // Check if we should log (lazy evaluation to avoid localStorage access during build)
  shouldLog() {
    try {
      const isDevelopment = process.env.NODE_ENV === 'development';
      const isDebugMode = typeof window !== 'undefined' && 
                          typeof localStorage !== 'undefined' && 
                          localStorage.getItem('DEBUG_MODE') === 'true';
      return isDevelopment || isDebugMode;
    } catch (e) {
      // If we can't access localStorage, default to production mode (no logs)
      return false;
    }
  }

  log(...args) {
    if (this.shouldLog()) {
      console.log(...args);
    }
  }

  info(...args) {
    if (this.shouldLog()) {
      console.info(...args);
    }
  }

  warn(...args) {
    // Always show warnings
    console.warn(...args);
  }

  error(...args) {
    // Always show errors
    console.error(...args);
  }

  debug(...args) {
    if (this.shouldLog()) {
      console.debug(...args);
    }
  }

  // Special method for performance logs
  perf(...args) {
    if (this.shouldLog()) {
      console.log('⚡', ...args);
    }
  }

  // Special method for auth logs
  auth(...args) {
    if (this.shouldLog()) {
      console.log('🔑', ...args);
    }
  }

  // Special method for network logs
  network(...args) {
    if (this.shouldLog()) {
      console.log('🌐', ...args);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export individual methods for convenience
export const { log, info, warn, error, debug, perf, auth, network } = logger;

// Default export
export default logger;
