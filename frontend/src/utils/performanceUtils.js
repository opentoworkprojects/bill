/**
 * Performance monitoring utilities for button interactions and API calls
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map()
    this.thresholds = {
      button: 200, // Button should respond within 200ms
      api: 2000,   // API calls should complete within 2s
      render: 16   // Render should complete within 16ms (60fps)
    }
  }

  // Start timing an operation
  startTiming(key) {
    this.metrics.set(key, {
      startTime: performance.now(),
      type: this.getOperationType(key)
    })
  }

  // End timing and log if threshold exceeded
  endTiming(key) {
    const metric = this.metrics.get(key)
    if (!metric) return

    const duration = performance.now() - metric.startTime
    const threshold = this.thresholds[metric.type] || 1000

    if (duration > threshold) {
      console.warn(`⚠️ Performance: ${key} took ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`)
    }

    this.metrics.delete(key)
    return duration
  }

  // Get operation type from key
  getOperationType(key) {
    if (key.includes('button') || key.includes('click')) return 'button'
    if (key.includes('api') || key.includes('fetch')) return 'api'
    if (key.includes('render') || key.includes('paint')) return 'render'
    return 'other'
  }

  // Measure function execution time
  measure(key, fn) {
    return async (...args) => {
      this.startTiming(key)
      try {
        const result = await fn(...args)
        return result
      } finally {
        this.endTiming(key)
      }
    }
  }

  // Get performance summary
  getSummary() {
    const entries = performance.getEntriesByType('measure')
    return entries.map(entry => ({
      name: entry.name,
      duration: entry.duration,
      startTime: entry.startTime
    }))
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor()

/**
 * Debounce function to prevent rapid function calls
 */
export const debounce = (func, wait, immediate = false) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }
    const callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    if (callNow) func(...args)
  }
}

/**
 * Throttle function to limit function calls
 */
export const throttle = (func, limit) => {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * Optimize images for better loading performance
 */
export const optimizeImage = (url, options = {}) => {
  const { width = 400, height = 300, quality = 80, format = 'webp' } = options
  
  // If it's a local image or already optimized, return as is
  if (!url || url.startsWith('data:') || url.includes('optimized')) {
    return url
  }

  // Add optimization parameters (works with many CDNs)
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}w=${width}&h=${height}&q=${quality}&f=${format}&auto=compress`
}

/**
 * Preload critical resources
 */
export const preloadResource = (url, type = 'fetch') => {
  const link = document.createElement('link')
  link.rel = 'preload'
  link.href = url
  
  if (type === 'image') {
    link.as = 'image'
  } else if (type === 'script') {
    link.as = 'script'
  } else if (type === 'style') {
    link.as = 'style'
  } else {
    link.as = 'fetch'
    link.crossOrigin = 'anonymous'
  }
  
  document.head.appendChild(link)
}

/**
 * Lazy load components with intersection observer
 */
export const createLazyLoader = (threshold = 0.1) => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target
          const src = element.dataset.src
          
          if (src) {
            element.src = src
            element.removeAttribute('data-src')
          }
          
          observer.unobserve(element)
        }
      })
    },
    { threshold }
  )

  return {
    observe: (element) => observer.observe(element),
    unobserve: (element) => observer.unobserve(element),
    disconnect: () => observer.disconnect()
  }
}

/**
 * Batch DOM updates to prevent layout thrashing
 */
export const batchDOMUpdates = (updates) => {
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      updates.forEach(update => update())
      resolve()
    })
  })
}

/**
 * Check if device has good performance capabilities
 */
export const getDeviceCapabilities = () => {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  const memory = navigator.deviceMemory || 4 // Default to 4GB if not available
  const cores = navigator.hardwareConcurrency || 4 // Default to 4 cores
  
  return {
    memory,
    cores,
    connectionType: connection?.effectiveType || 'unknown',
    isLowEnd: memory < 4 || cores < 4,
    isSlowConnection: connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g'
  }
}

/**
 * Adaptive loading based on device capabilities
 */
export const getOptimalSettings = () => {
  const capabilities = getDeviceCapabilities()
  
  if (capabilities.isLowEnd || capabilities.isSlowConnection) {
    return {
      imageQuality: 60,
      animationDuration: 150,
      debounceTime: 500,
      batchSize: 3,
      cacheTime: 10 * 60 * 1000, // 10 minutes
      enableAnimations: false
    }
  }
  
  return {
    imageQuality: 80,
    animationDuration: 200,
    debounceTime: 300,
    batchSize: 5,
    cacheTime: 5 * 60 * 1000, // 5 minutes
    enableAnimations: true
  }
}

/**
 * Monitor Core Web Vitals
 */
export const monitorWebVitals = () => {
  // Largest Contentful Paint (LCP)
  new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries()
    const lastEntry = entries[entries.length - 1]
    console.log('LCP:', lastEntry.startTime)
  }).observe({ entryTypes: ['largest-contentful-paint'] })

  // First Input Delay (FID)
  new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries()
    entries.forEach(entry => {
      console.log('FID:', entry.processingStart - entry.startTime)
    })
  }).observe({ entryTypes: ['first-input'] })

  // Cumulative Layout Shift (CLS)
  let clsValue = 0
  new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries()
    entries.forEach(entry => {
      if (!entry.hadRecentInput) {
        clsValue += entry.value
      }
    })
    console.log('CLS:', clsValue)
  }).observe({ entryTypes: ['layout-shift'] })
}

/**
 * Optimize button interactions for better perceived performance
 */
export const optimizeButtonInteraction = (element, callback) => {
  let isProcessing = false
  
  const handleInteraction = async (event) => {
    if (isProcessing) return
    
    isProcessing = true
    
    // Immediate visual feedback
    element.style.transform = 'scale(0.95)'
    element.style.transition = 'transform 0.1s ease'
    
    // Haptic feedback on mobile
    if (navigator.vibrate) {
      navigator.vibrate(10)
    }
    
    try {
      await callback(event)
    } finally {
      // Reset visual state
      setTimeout(() => {
        element.style.transform = ''
        isProcessing = false
      }, 100)
    }
  }
  
  element.addEventListener('click', handleInteraction)
  element.addEventListener('touchstart', handleInteraction, { passive: true })
  
  return () => {
    element.removeEventListener('click', handleInteraction)
    element.removeEventListener('touchstart', handleInteraction)
  }
}