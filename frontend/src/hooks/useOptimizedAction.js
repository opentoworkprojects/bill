import { useState, useCallback, useRef } from 'react'
import { toast } from 'sonner'

/**
 * Hook for optimizing button actions with loading states, debouncing, and error handling
 * @param {Function} action - The async action to perform
 * @param {Object} options - Configuration options
 * @returns {Object} - { execute, loading, error, reset }
 */
export const useOptimizedAction = (action, options = {}) => {
  const {
    debounceMs = 300,
    showSuccessToast = true,
    showErrorToast = true,
    successMessage = 'Action completed successfully',
    onSuccess,
    onError,
    retryAttempts = 0,
    retryDelay = 1000
  } = options

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const lastExecutionTime = useRef(0)
  const retryCount = useRef(0)

  const execute = useCallback(async (...args) => {
    const now = Date.now()
    
    // Debounce rapid calls
    if (now - lastExecutionTime.current < debounceMs) {
      return
    }
    
    lastExecutionTime.current = now
    setLoading(true)
    setError(null)

    const attemptAction = async (attempt = 0) => {
      try {
        const result = await action(...args)
        
        if (showSuccessToast && successMessage) {
          toast.success(successMessage)
        }
        
        if (onSuccess) {
          onSuccess(result)
        }
        
        retryCount.current = 0
        return result
      } catch (err) {
        console.error('Action failed:', err)
        
        // Retry logic
        if (attempt < retryAttempts) {
          console.log(`Retrying action (attempt ${attempt + 1}/${retryAttempts})`)
          await new Promise(resolve => setTimeout(resolve, retryDelay))
          return attemptAction(attempt + 1)
        }
        
        setError(err)
        
        if (showErrorToast) {
          const errorMessage = err.response?.data?.detail || err.message || 'Action failed'
          toast.error(errorMessage)
        }
        
        if (onError) {
          onError(err)
        }
        
        throw err
      }
    }

    try {
      const result = await attemptAction()
      return result
    } finally {
      setLoading(false)
    }
  }, [action, debounceMs, showSuccessToast, showErrorToast, successMessage, onSuccess, onError, retryAttempts, retryDelay])

  const reset = useCallback(() => {
    setLoading(false)
    setError(null)
    retryCount.current = 0
  }, [])

  return {
    execute,
    loading,
    error,
    reset
  }
}

/**
 * Hook for optimizing API calls with caching and request deduplication
 */
export const useOptimizedAPI = () => {
  const requestCache = useRef(new Map())
  const pendingRequests = useRef(new Map())

  const call = useCallback(async (key, apiCall, options = {}) => {
    const { 
      cacheTime = 5 * 60 * 1000, // 5 minutes default
      forceRefresh = false 
    } = options

    // Check cache first
    if (!forceRefresh && requestCache.current.has(key)) {
      const cached = requestCache.current.get(key)
      if (Date.now() - cached.timestamp < cacheTime) {
        return cached.data
      }
    }

    // Check if request is already pending
    if (pendingRequests.current.has(key)) {
      return pendingRequests.current.get(key)
    }

    // Make the request
    const requestPromise = apiCall()
    pendingRequests.current.set(key, requestPromise)

    try {
      const result = await requestPromise
      
      // Cache the result
      requestCache.current.set(key, {
        data: result,
        timestamp: Date.now()
      })
      
      return result
    } finally {
      pendingRequests.current.delete(key)
    }
  }, [])

  const clearCache = useCallback((key) => {
    if (key) {
      requestCache.current.delete(key)
    } else {
      requestCache.current.clear()
    }
  }, [])

  return { call, clearCache }
}

/**
 * Hook for batch operations with progress tracking
 */
export const useBatchOperation = () => {
  const [progress, setProgress] = useState({ current: 0, total: 0, percentage: 0 })
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])

  const execute = useCallback(async (items, operation, options = {}) => {
    const { 
      batchSize = 5, 
      delayBetweenBatches = 100,
      onProgress,
      onBatchComplete 
    } = options

    setLoading(true)
    setProgress({ current: 0, total: items.length, percentage: 0 })
    setResults([])

    const allResults = []
    
    try {
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize)
        
        // Process batch in parallel
        const batchPromises = batch.map(async (item, index) => {
          try {
            const result = await operation(item, i + index)
            return { success: true, result, item, index: i + index }
          } catch (error) {
            return { success: false, error, item, index: i + index }
          }
        })

        const batchResults = await Promise.all(batchPromises)
        allResults.push(...batchResults)

        // Update progress
        const current = Math.min(i + batchSize, items.length)
        const percentage = Math.round((current / items.length) * 100)
        
        setProgress({ current, total: items.length, percentage })
        setResults([...allResults])

        if (onProgress) {
          onProgress({ current, total: items.length, percentage, batchResults })
        }

        if (onBatchComplete) {
          onBatchComplete(batchResults)
        }

        // Delay between batches to prevent overwhelming the server
        if (i + batchSize < items.length && delayBetweenBatches > 0) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenBatches))
        }
      }

      return allResults
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    execute,
    loading,
    progress,
    results
  }
}