// ✅ Optimized API Client with Request Deduplication & Caching
import axios from 'axios'

// In-memory cache with TTL support
class ExpiringCache {
  constructor(prefix = '') {
    this.prefix = prefix
    this.cache = new Map()
    this.timers = new Map()
  }

  get(key) {
    const fullKey = this.prefix + key
    const cached = this.cache.get(fullKey)
    if (cached && cached.expiry > Date.now()) {
      console.log(`🚀 Cache hit: ${key}`)
      return cached.value
    }
    this.cache.delete(fullKey)
    this.timers.delete(fullKey)
    return null
  }

  set(key, value, ttlSeconds = 300) {
    const fullKey = this.prefix + key
    
    // Clear existing timer
    if (this.timers.has(fullKey)) {
      clearTimeout(this.timers.get(fullKey))
    }

    const expiry = Date.now() + ttlSeconds * 1000
    this.cache.set(fullKey, { value, expiry })

    // Auto-cleanup after TTL
    const timer = setTimeout(() => {
      this.cache.delete(fullKey)
      this.timers.delete(fullKey)
    }, ttlSeconds * 1000)

    this.timers.set(fullKey, timer)
  }

  clear(pattern = null) {
    if (!pattern) {
      this.cache.clear()
      this.timers.forEach(timer => clearTimeout(timer))
      this.timers.clear()
      return
    }

    // Clear entries matching pattern
    const keysToDelete = []
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => {
      this.cache.delete(key)
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key))
        this.timers.delete(key)
      }
    })
  }

  getStats() {
    let totalBytes = 0
    this.cache.forEach(({ value }) => {
      totalBytes += JSON.stringify(value).length
    })

    return {
      size: this.cache.size,
      memoryBytes: totalBytes,
      pendingCleanup: this.timers.size
    }
  }
}

// Request deduplication - prevents duplicate concurrent requests
class RequestDeduplicator {
  constructor() {
    this.pending = new Map()
  }

  async deduplicate(key, requestFn) {
    // If already pending, wait for that request
    if (this.pending.has(key)) {
      console.log(`⏳ Deduplicating request: ${key}`)
      return this.pending.get(key)
    }

    // Create and store the promise
    const promise = requestFn()
      .then(response => {
        this.pending.delete(key)
        return response
      })
      .catch(error => {
        this.pending.delete(key)
        throw error
      })

    this.pending.set(key, promise)
    return promise
  }

  getPendingCount() {
    return this.pending.size
  }

  clear() {
    this.pending.clear()
  }
}

// Optimized API Client
export class OptimizedAPIClient {
  constructor(baseURL) {
    this.baseURL = baseURL || process.env.REACT_APP_API_URL || 'https://billbytekot-backend.onrender.com/api'
    this.cache = new ExpiringCache('api_cache_')
    this.deduplicator = new RequestDeduplicator()
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
      }
    })

    // Add response interceptor for caching and deduplication
    this.client.interceptors.response.use(
      response => {
        // Log response time
        const time = response.headers['x-response-time']
        if (time) {
          console.log(`⏱️ Response time: ${time}ms for ${response.config.url}`)
        }
        return response
      },
      error => {
        console.error('API Error:', error.message)
        return Promise.reject(error)
      }
    )
  }

  async get(url, config = {}, cacheTTL = 300) {
    const cacheKey = `GET:${url}:${JSON.stringify(config.params || {})}`

    // Check cache first
    const cached = this.cache.get(cacheKey)
    if (cached) {
      return { data: cached, fromCache: true, status: 200 }
    }

    try {
      // Deduplicate identical requests
      const response = await this.deduplicator.deduplicate(
        cacheKey,
        () => this.client.get(url, config)
      )

      // Cache successful responses
      if (response.status === 200 && cacheTTL > 0) {
        this.cache.set(cacheKey, response.data, cacheTTL)
      }

      return { data: response.data, fromCache: false, status: response.status }
    } catch (error) {
      throw error
    }
  }

  async post(url, data, config = {}) {
    try {
      const response = await this.client.post(url, data, config)
      
      // Clear related cache on POST
      this.cache.clear(url.split('/')[0])
      
      return { data: response.data, status: response.status }
    } catch (error) {
      throw error
    }
  }

  async put(url, data, config = {}) {
    try {
      const response = await this.client.put(url, data, config)
      
      // Clear related cache on PUT
      this.cache.clear(url.split('/')[0])
      
      return { data: response.data, status: response.status }
    } catch (error) {
      throw error
    }
  }

  async delete(url, config = {}) {
    try {
      const response = await this.client.delete(url, config)
      
      // Clear related cache on DELETE
      this.cache.clear(url.split('/')[0])
      
      return { data: response.data, status: response.status }
    } catch (error) {
      throw error
    }
  }

  setAuthToken(token) {
    if (token) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete this.client.defaults.headers.common['Authorization']
    }
  }

  clearCache(pattern) {
    this.cache.clear(pattern)
  }

  getCacheStats() {
    return {
      cache: this.cache.getStats(),
      pending: this.deduplicator.getPendingCount()
    }
  }

  // Batch GET requests with request batching
  async getBatch(urls, config = {}, cacheTTL = 300) {
    const requests = urls.map(url => this.get(url, config, cacheTTL))
    const results = await Promise.all(requests)
    return results
  }
}

// Lazy Image Loader - defer loading images until visible
export class LazyImageLoader {
  constructor() {
    this.observer = null
    this.images = new Set()
  }

  init() {
    if ('IntersectionObserver' in window) {
      const options = {
        root: null,
        rootMargin: '50px', // Start loading 50px before visible
        threshold: 0
      }

      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target
            if (img.dataset.src) {
              img.src = img.dataset.src
              img.removeAttribute('data-src')
              this.observer.unobserve(img)
              this.images.delete(img)
              console.log('🖼️ Lazy loaded image:', img.src)
            }
          }
        })
      }, options)
    }
  }

  observe(imgElement) {
    if (this.observer && imgElement.dataset.src) {
      this.observer.observe(imgElement)
      this.images.add(imgElement)
    }
  }

  disconnect() {
    if (this.observer) {
      this.images.forEach(img => this.observer.unobserve(img))
      this.observer.disconnect()
      this.images.clear()
    }
  }
}

// Virtual Scroller for large lists
export class VirtualScroller {
  constructor(container, itemHeight, renderItem) {
    this.container = container
    this.itemHeight = itemHeight
    this.renderItem = renderItem
    this.items = []
    this.visibleStart = 0
    this.visibleEnd = 0
    this.virtualScroll = null

    this.container.addEventListener('scroll', () => this.onScroll())
    this.updateVisibleRange()
  }

  setItems(items) {
    this.items = items
    this.render()
  }

  onScroll() {
    this.updateVisibleRange()
    this.render()
  }

  updateVisibleRange() {
    const scrollTop = this.container.scrollTop
    const containerHeight = this.container.clientHeight
    
    this.visibleStart = Math.floor(scrollTop / this.itemHeight)
    this.visibleEnd = Math.ceil((scrollTop + containerHeight) / this.itemHeight)
  }

  render() {
    // Clear container
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild)
    }

    // Add spacer before visible items
    const spacerTop = document.createElement('div')
    spacerTop.style.height = this.visibleStart * this.itemHeight + 'px'
    this.container.appendChild(spacerTop)

    // Render visible items
    for (let i = this.visibleStart; i < Math.min(this.visibleEnd, this.items.length); i++) {
      const itemElement = this.renderItem(this.items[i], i)
      this.container.appendChild(itemElement)
    }

    // Add spacer after visible items
    const spacerBottom = document.createElement('div')
    const remainingItems = Math.max(0, this.items.length - this.visibleEnd)
    spacerBottom.style.height = remainingItems * this.itemHeight + 'px'
    this.container.appendChild(spacerBottom)
  }
}

// Resource Prefetcher
export class ResourcePrefetcher {
  static prefetchDNS(domain) {
    const link = document.createElement('link')
    link.rel = 'dns-prefetch'
    link.href = `//${domain}`
    document.head.appendChild(link)
    console.log('🔗 DNS prefetch:', domain)
  }

  static preconnect(domain) {
    const link = document.createElement('link')
    link.rel = 'preconnect'
    link.href = `//${domain}`
    document.head.appendChild(link)
    console.log('🔗 Preconnect:', domain)
  }

  static prefetchResource(url) {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = url
    document.head.appendChild(link)
    console.log('📄 Prefetch resource:', url)
  }

  static preloadResource(url, type = 'script') {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = url
    link.as = type
    document.head.appendChild(link)
    console.log(`📦 Preload ${type}:`, url)
  }
}

// Service Worker Manager
export class ServiceWorkerManager {
  static async register() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js')
        console.log('✅ Service Worker registered:', registration)
        return registration
      } catch (error) {
        console.warn('⚠️ Service Worker registration failed:', error)
      }
    }
  }

  static async unregister() {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      registrations.forEach(reg => reg.unregister())
      console.log('✅ Service Workers unregistered')
    }
  }

  static async updateCache(cacheName, urls) {
    try {
      const cache = await caches.open(cacheName)
      await cache.addAll(urls)
      console.log(`✅ Updated cache ${cacheName}`)
    } catch (error) {
      console.error('Cache update failed:', error)
    }
  }
}

// Memory Manager - prevent memory leaks
export class MemoryManager {
  static getMemoryUsage() {
    if (performance.memory) {
      return {
        jsHeapSize: (performance.memory.jsHeapSize / 1048576).toFixed(2) + ' MB',
        jsHeapLimit: (performance.memory.jsHeapLimit / 1048576).toFixed(2) + ' MB',
        jsHeapSizeLimit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB'
      }
    }
    return null
  }

  static logMemoryUsage() {
    const memory = this.getMemoryUsage()
    if (memory) {
      console.log('💾 Memory Usage:', memory)
    }
  }

  static clearUnusedData() {
    // This should be called periodically to free up memory
    if (window.gc) {
      window.gc()
      console.log('🧹 Garbage collection triggered')
    }
  }
}

// Export singleton instances
export const apiClient = new OptimizedAPIClient()
export const lazyImageLoader = new LazyImageLoader()
export const expiringCache = new ExpiringCache('app_')
