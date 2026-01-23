/**
 * Performance Measurement Utilities
 * Comprehensive timing functions and measurement tools
 * Requirements: 11.1 - Track and report UI response times for all user interactions
 */

import { performanceMonitor } from './performanceMonitor';
import { performanceAlerting } from './performanceAlerting';

/**
 * High-precision timer for performance measurements
 */
class PerformanceTimer {
  constructor(name, operationType, metadata = {}) {
    this.name = name;
    this.operationType = operationType;
    this.metadata = metadata;
    this.startTime = null;
    this.endTime = null;
    this.marks = new Map();
    this.measures = new Map();
  }

  /**
   * Start the timer
   */
  start() {
    this.startTime = performance.now();
    
    // Create performance mark for browser DevTools
    if (typeof performance.mark === 'function') {
      try {
        performance.mark(`${this.name}-start`);
      } catch (error) {
        // Ignore marking errors in some environments
      }
    }

    // Start monitoring
    performanceMonitor.startTiming(this.name, this.operationType, this.metadata);
    
    return this;
  }

  /**
   * Add an intermediate mark
   */
  mark(markName) {
    if (!this.startTime) {
      console.warn('Timer not started, cannot add mark');
      return this;
    }

    const markTime = performance.now();
    const elapsed = markTime - this.startTime;
    
    this.marks.set(markName, {
      timestamp: markTime,
      elapsed: elapsed
    });

    // Create performance mark for browser DevTools
    if (typeof performance.mark === 'function') {
      try {
        performance.mark(`${this.name}-${markName}`);
      } catch (error) {
        // Ignore marking errors
      }
    }

    return this;
  }

  /**
   * End the timer and record results
   */
  end(additionalMetadata = {}) {
    if (!this.startTime) {
      console.warn('Timer not started, cannot end');
      return null;
    }

    this.endTime = performance.now();
    const duration = this.endTime - this.startTime;

    // Create performance mark and measure for browser DevTools
    if (typeof performance.mark === 'function' && typeof performance.measure === 'function') {
      try {
        performance.mark(`${this.name}-end`);
        performance.measure(this.name, `${this.name}-start`, `${this.name}-end`);
      } catch (error) {
        // Ignore marking errors
      }
    }

    // Record with performance monitor
    const result = performanceMonitor.endTiming(
      this.name, 
      this.operationType, 
      { 
        ...this.metadata, 
        ...additionalMetadata,
        marks: Object.fromEntries(this.marks),
        totalDuration: duration
      }
    );

    // Check for threshold violations
    if (result && !result.withinThreshold) {
      performanceAlerting.processViolation(result);
    }

    return {
      name: this.name,
      operationType: this.operationType,
      duration: duration,
      startTime: this.startTime,
      endTime: this.endTime,
      marks: this.marks,
      result: result
    };
  }

  /**
   * Get current elapsed time without ending the timer
   */
  getElapsed() {
    if (!this.startTime) return 0;
    return performance.now() - this.startTime;
  }
}

/**
 * Create a new performance timer
 */
export const createTimer = (name, operationType, metadata = {}) => {
  return new PerformanceTimer(name, operationType, metadata);
};

/**
 * Measure the execution time of a function
 */
export const measureFunction = async (name, operationType, fn, metadata = {}) => {
  const timer = createTimer(name, operationType, metadata);
  timer.start();
  
  try {
    const result = await fn();
    timer.end({ success: true });
    return result;
  } catch (error) {
    timer.end({ success: false, error: error.message });
    throw error;
  }
};

/**
 * Measure the execution time of a synchronous function
 */
export const measureSync = (name, operationType, fn, metadata = {}) => {
  const timer = createTimer(name, operationType, metadata);
  timer.start();
  
  try {
    const result = fn();
    timer.end({ success: true });
    return result;
  } catch (error) {
    timer.end({ success: false, error: error.message });
    throw error;
  }
};

/**
 * Decorator for measuring method execution time
 */
export const measureMethod = (operationType, metadata = {}) => {
  return function(target, propertyName, descriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function(...args) {
      const name = `${target.constructor.name}.${propertyName}`;
      return measureFunction(name, operationType, () => method.apply(this, args), metadata);
    };
    
    return descriptor;
  };
};

/**
 * Measure DOM interaction performance
 */
export const measureDOMInteraction = (element, eventType, operationType, callback) => {
  const measureInteraction = async (event) => {
    const elementId = element.id || element.className || 'unknown';
    const name = `${eventType}_${elementId}`;
    
    return measureFunction(name, operationType, () => callback(event), {
      elementId,
      eventType,
      elementTag: element.tagName
    });
  };

  element.addEventListener(eventType, measureInteraction);
  
  return () => element.removeEventListener(eventType, measureInteraction);
};

/**
 * Measure API call performance with detailed metrics
 */
export const measureAPICall = async (url, options = {}, metadata = {}) => {
  const method = options.method || 'GET';
  const name = `${method}_${url}`;
  const timer = createTimer(name, 'api_response', { url, method, ...metadata });
  
  timer.start();
  
  // Mark request start
  timer.mark('request_start');
  
  try {
    const response = await fetch(url, options);
    
    // Mark response received
    timer.mark('response_received');
    
    const responseData = await response.json();
    
    // Mark parsing complete
    timer.mark('parsing_complete');
    
    const result = timer.end({
      success: response.ok,
      status: response.status,
      responseSize: JSON.stringify(responseData).length,
      cached: response.headers.get('x-cache') === 'HIT'
    });

    return { response, data: responseData, performance: result };
  } catch (error) {
    timer.end({
      success: false,
      error: error.message
    });
    throw error;
  }
};

/**
 * Measure React component render performance
 */
export const measureComponentRender = (ComponentName) => {
  return function(WrappedComponent) {
    return class extends React.Component {
      componentDidMount() {
        this.measureRender('mount');
      }

      componentDidUpdate() {
        this.measureRender('update');
      }

      measureRender(phase) {
        const name = `${ComponentName}_${phase}`;
        // This would be measured by React DevTools profiler in practice
        console.log(`📊 Component render: ${name}`);
      }

      render() {
        return React.createElement(WrappedComponent, this.props);
      }
    };
  };
};

/**
 * Measure page load performance
 */
export const measurePageLoad = (pageName) => {
  const timer = createTimer(`page_load_${pageName}`, 'app_load', { pageName });
  
  // Start timing from navigation start
  const navigationStart = performance.timing?.navigationStart || performance.timeOrigin;
  const now = performance.now();
  
  timer.start();
  
  // Wait for page to be fully loaded
  if (document.readyState === 'complete') {
    timer.end({
      domContentLoaded: performance.timing?.domContentLoadedEventEnd - navigationStart,
      loadComplete: performance.timing?.loadEventEnd - navigationStart
    });
  } else {
    window.addEventListener('load', () => {
      timer.end({
        domContentLoaded: performance.timing?.domContentLoadedEventEnd - navigationStart,
        loadComplete: performance.timing?.loadEventEnd - navigationStart
      });
    });
  }
};

/**
 * Measure image loading performance
 */
export const measureImageLoad = (imageUrl, element = null) => {
  const timer = createTimer(`image_load_${imageUrl}`, 'image_placeholder', { imageUrl });
  
  return new Promise((resolve, reject) => {
    const img = element || new Image();
    
    timer.start();
    
    img.onload = () => {
      const result = timer.end({
        success: true,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight
      });
      resolve({ img, performance: result });
    };
    
    img.onerror = () => {
      const result = timer.end({
        success: false,
        error: 'Image failed to load'
      });
      reject(new Error('Image failed to load'));
    };
    
    if (!element) {
      img.src = imageUrl;
    }
  });
};

/**
 * Measure cache operation performance
 */
export const measureCacheOperation = (cacheType, operation, key, fn) => {
  const timer = createTimer(`cache_${operation}_${key}`, `cache_${cacheType}`, {
    cacheType,
    operation,
    key
  });
  
  timer.start();
  
  return Promise.resolve(fn()).then(
    result => {
      timer.end({
        success: true,
        hit: result !== null && result !== undefined,
        cacheType,
        operation
      });
      return result;
    },
    error => {
      timer.end({
        success: false,
        error: error.message,
        cacheType,
        operation
      });
      throw error;
    }
  );
};

/**
 * Measure WebSocket message performance
 */
export const measureWebSocketMessage = (messageType, data) => {
  const timer = createTimer(`ws_${messageType}`, 'realtime_client', {
    messageType,
    dataSize: JSON.stringify(data).length
  });
  
  timer.start();
  
  return {
    complete: (success = true, metadata = {}) => {
      timer.end({
        success,
        messageType,
        ...metadata
      });
    }
  };
};

/**
 * Batch performance measurements for efficiency
 */
export class PerformanceBatch {
  constructor(batchName) {
    this.batchName = batchName;
    this.measurements = [];
    this.startTime = performance.now();
  }

  add(name, operationType, duration, metadata = {}) {
    this.measurements.push({
      name,
      operationType,
      duration,
      metadata,
      timestamp: performance.now()
    });
  }

  commit() {
    const batchDuration = performance.now() - this.startTime;
    
    // Record individual measurements
    this.measurements.forEach(measurement => {
      performanceMonitor.recordMetric(
        measurement.operationType,
        measurement.duration,
        {
          ...measurement.metadata,
          batch: this.batchName,
          batchSize: this.measurements.length
        }
      );
    });

    // Record batch summary
    performanceMonitor.recordMetric('batch_operation', batchDuration, {
      batchName: this.batchName,
      measurementCount: this.measurements.length,
      averageDuration: this.measurements.reduce((sum, m) => sum + m.duration, 0) / this.measurements.length
    });

    console.log(`📊 Performance batch "${this.batchName}" completed: ${this.measurements.length} measurements in ${batchDuration.toFixed(2)}ms`);
  }
}

/**
 * Create a new performance batch
 */
export const createBatch = (batchName) => {
  return new PerformanceBatch(batchName);
};

/**
 * Measure multiple operations in parallel
 */
export const measureParallel = async (operations) => {
  const batch = createBatch(`parallel_${Date.now()}`);
  
  const promises = operations.map(async ({ name, operationType, fn, metadata = {} }) => {
    return measureFunction(name, operationType, fn, metadata);
  });
  
  const results = await Promise.allSettled(promises);
  batch.commit();
  
  return results;
};

/**
 * Performance measurement middleware for Redux actions
 */
export const performanceMiddleware = (store) => (next) => (action) => {
  const timer = createTimer(`redux_${action.type}`, 'ui_state_update', {
    actionType: action.type
  });
  
  timer.start();
  
  try {
    const result = next(action);
    timer.end({ success: true });
    return result;
  } catch (error) {
    timer.end({ success: false, error: error.message });
    throw error;
  }
};

// Export all measurement utilities
export default {
  createTimer,
  measureFunction,
  measureSync,
  measureMethod,
  measureDOMInteraction,
  measureAPICall,
  measureComponentRender,
  measurePageLoad,
  measureImageLoad,
  measureCacheOperation,
  measureWebSocketMessage,
  createBatch,
  measureParallel,
  performanceMiddleware,
  PerformanceTimer,
  PerformanceBatch
};