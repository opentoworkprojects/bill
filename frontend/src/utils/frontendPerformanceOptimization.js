/**
 * Frontend Performance Optimization Module
 * Advanced caching, code splitting, and request optimization
 */

import { lazy, Suspense } from 'react';

/**
 * Dynamic Import Helper for Code Splitting
 * Reduces initial bundle size
 */
export const lazyLoadComponent = (importStatement) => {
  return lazy(() => importStatement);
};

/**
 * Intersection Observer for Lazy Loading Images
 * Load images only when they're visible
 */
export class LazyImageLoader {
  constructor() {
    this.observer = null;
  }

  init() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const src = img.dataset.src;
            if (src) {
              img.src = src;
              img.removeAttribute('data-src');
              this.observer.unobserve(img);
            }
          }
        });
      },
      { rootMargin: '50px' }
    );
  }

  observe(element) {
    if (this.observer && element) {
      this.observer.observe(element);
    }
  }

  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

/**
 * Advanced Request Deduplication
 * Prevents duplicate concurrent requests for the same resource
 */
export class RequestDeduplicator {
  constructor() {
    this.pendingRequests = new Map();
  }

  /**
   * Execute request with deduplication
   * If request is already pending, return the same promise
   */
  async deduplicate(key, requestFn) {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    const promise = requestFn()
      .finally(() => {
        this.pendingRequests.delete(key);
      });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  clear(pattern) {
    if (pattern) {
      for (const key of this.pendingRequests.keys()) {
        if (key.includes(pattern)) {
          this.pendingRequests.delete(key);
        }
      }
    } else {
      this.pendingRequests.clear();
    }
  }
}

/**
 * Intelligent Request Batching
 * Combines multiple requests into single batch request
 */
export class RequestBatcher {
  constructor(maxBatchSize = 10, batchDelayMs = 50) {
    this.maxBatchSize = maxBatchSize;
    this.batchDelayMs = batchDelayMs;
    this.queue = [];
    this.batchTimer = null;
  }

  add(request) {
    return new Promise((resolve, reject) => {
      this.queue.push({ request, resolve, reject });

      if (this.queue.length >= this.maxBatchSize) {
        this.flush();
      } else if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => this.flush(), this.batchDelayMs);
      }
    });
  }

  async flush() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, this.maxBatchSize);

    try {
      const results = await this.processBatch(batch.map(b => b.request));
      batch.forEach((item, index) => {
        item.resolve(results[index]);
      });
    } catch (error) {
      batch.forEach(item => {
        item.reject(error);
      });
    }
  }

  async processBatch(requests) {
    // Implement batch API call
    return Promise.all(requests);
  }
}

/**
 * LocalStorage with Expiration
 * Efficient client-side caching with TTL
 */
export class ExpiringCache {
  constructor(prefix = 'cache_') {
    this.prefix = prefix;
  }

  set(key, value, ttlSeconds = 3600) {
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    const item = {
      value,
      expiresAt
    };

    try {
      localStorage.setItem(
        `${this.prefix}${key}`,
        JSON.stringify(item)
      );
      return true;
    } catch (e) {
      console.warn('LocalStorage full, clearing old items...');
      this.cleanupExpired();
      try {
        localStorage.setItem(
          `${this.prefix}${key}`,
          JSON.stringify(item)
        );
        return true;
      } catch (e2) {
        console.error('Failed to cache:', e2);
        return false;
      }
    }
  }

  get(key) {
    try {
      const item = localStorage.getItem(`${this.prefix}${key}`);
      if (!item) return null;

      const parsed = JSON.parse(item);
      if (Date.now() > parsed.expiresAt) {
        localStorage.removeItem(`${this.prefix}${key}`);
        return null;
      }

      return parsed.value;
    } catch (e) {
      console.error('Cache retrieval error:', e);
      return null;
    }
  }

  remove(key) {
    localStorage.removeItem(`${this.prefix}${key}`);
  }

  cleanupExpired() {
    const now = Date.now();
    const keys = Object.keys(localStorage);

    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        try {
          const item = JSON.parse(localStorage.getItem(key));
          if (now > item.expiresAt) {
            localStorage.removeItem(key);
          }
        } catch (e) {
          // Invalid item, remove it
          localStorage.removeItem(key);
        }
      }
    });
  }

  clear() {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }
}

/**
 * Virtual Scrolling for Large Lists
 * Render only visible items to improve performance
 */
export class VirtualScroller {
  constructor(containerElement, itemHeight, renderItem) {
    this.container = containerElement;
    this.itemHeight = itemHeight;
    this.renderItem = renderItem;
    this.items = [];
    this.visibleRange = { start: 0, end: 0 };

    this.calculateVisibleRange();
    this.setupScrollListener();
  }

  setItems(items) {
    this.items = items;
    this.render();
  }

  calculateVisibleRange() {
    const scrollTop = this.container.scrollTop;
    const containerHeight = this.container.clientHeight;

    this.visibleRange.start = Math.floor(scrollTop / this.itemHeight);
    this.visibleRange.end = Math.ceil(
      (scrollTop + containerHeight) / this.itemHeight
    );
  }

  setupScrollListener() {
    this.container.addEventListener('scroll', () => {
      this.calculateVisibleRange();
      this.render();
    }, { passive: true });
  }

  render() {
    const { start, end } = this.visibleRange;
    const totalHeight = this.items.length * this.itemHeight;

    // Render visible items
    const visibleItems = this.items.slice(start, end);
    const offsetY = start * this.itemHeight;

    this.container.innerHTML = '';
    
    // Add spacer for items above viewport
    if (start > 0) {
      const spacer = document.createElement('div');
      spacer.style.height = `${offsetY}px`;
      this.container.appendChild(spacer);
    }

    // Render visible items
    visibleItems.forEach((item, index) => {
      const element = this.renderItem(item, start + index);
      this.container.appendChild(element);
    });

    // Add spacer for items below viewport
    const remainingHeight = totalHeight - (end * this.itemHeight);
    if (remainingHeight > 0) {
      const spacer = document.createElement('div');
      spacer.style.height = `${remainingHeight}px`;
      this.container.appendChild(spacer);
    }
  }
}

/**
 * Service Worker Registration and Management
 * Enable offline support and background caching
 */
export class ServiceWorkerManager {
  static async register() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  static async unregister() {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (let registration of registrations) {
        await registration.unregister();
      }
    }
  }

  static async sendMessage(message) {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(message);
    }
  }

  static onMessage(callback) {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', callback);
    }
  }
}

/**
 * Resource Prefetching
 * Preload critical resources before they're needed
 */
export class ResourcePrefetcher {
  static prefetchImage(src) {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  }

  static prefetchScript(src) {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = 'script';
    link.href = src;
    document.head.appendChild(link);
  }

  static preloadFont(src) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.href = src;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  }

  static prefetchDNS(domain) {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = `//${domain}`;
    document.head.appendChild(link);
  }

  static preconnect(domain) {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = `//${domain}`;
    document.head.appendChild(link);
  }
}

/**
 * Memory Management
 * Detect and clean up memory leaks
 */
export class MemoryManager {
  static getMemoryUsage() {
    if (performance.memory) {
      return {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        percentageUsed: (
          (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
        ).toFixed(2)
      };
    }
    return null;
  }

  static monitorMemory(threshold = 80, callback) {
    setInterval(() => {
      const usage = this.getMemoryUsage();
      if (usage && usage.percentageUsed > threshold) {
        callback(usage);
      }
    }, 5000);
  }
}

/**
 * Preact Signals for Fine-grained Reactivity
 * Faster re-renders with minimal re-renders
 */
export class SignalCache {
  constructor() {
    this.cache = new Map();
  }

  createSignal(initialValue) {
    let value = initialValue;
    const subscribers = new Set();

    return {
      get: () => value,
      set: (newValue) => {
        if (value !== newValue) {
          value = newValue;
          subscribers.forEach(subscriber => subscriber(newValue));
        }
      },
      subscribe: (callback) => {
        subscribers.add(callback);
        return () => subscribers.delete(callback);
      }
    };
  }

  createComputed(computeFn, dependencies) {
    let computedValue = computeFn();
    let prevDeps = dependencies;

    return {
      get: () => {
        // Recompute if dependencies changed
        if (!this.dependenciesEqual(prevDeps, dependencies)) {
          computedValue = computeFn();
          prevDeps = dependencies;
        }
        return computedValue;
      }
    };
  }

  dependenciesEqual(prev, curr) {
    if (prev.length !== curr.length) return false;
    return prev.every((val, idx) => val === curr[idx]);
  }
}

// Export instances
export const lazyImageLoader = new LazyImageLoader();
export const requestDeduplicator = new RequestDeduplicator();
export const expiringCache = new ExpiringCache();
export const signalCache = new SignalCache();

export default {
  lazyLoadComponent,
  LazyImageLoader,
  RequestDeduplicator,
  RequestBatcher,
  ExpiringCache,
  VirtualScroller,
  ServiceWorkerManager,
  ResourcePrefetcher,
  MemoryManager,
  SignalCache
};
