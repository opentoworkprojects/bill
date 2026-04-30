import React from 'react'
import { optimizedAPI } from './optimizedAPI'
import { performanceMonitor, debounce, getOptimalSettings } from './performanceUtils'

/**
 * Enhanced button wrapper that provides optimized interactions
 */
export const withButtonEnhancement = (WrappedComponent) => {
  return React.forwardRef((props, ref) => {
    const {
      onClick,
      loading: externalLoading,
      disabled: externalDisabled,
      optimizeAPI = true,
      debounceMs,
      hapticFeedback = true,
      soundFeedback = false,
      showLoadingState = true,
      loadingText = 'Loading...',
      successMessage,
      errorMessage,
      retryOnError = false,
      ...otherProps
    } = props

    const [internalLoading, setInternalLoading] = React.useState(false)
    const [error, setError] = React.useState(null)
    const lastClickTime = React.useRef(0)
    const settings = React.useMemo(() => getOptimalSettings(), [])
    const effectiveDebounceMs = debounceMs || settings.debounceTime

    const handleClick = React.useCallback(async (event) => {
      const now = Date.now()
      
      // Prevent rapid clicks
      if (now - lastClickTime.current < effectiveDebounceMs) {
        event.preventDefault()
        return
      }
      
      lastClickTime.current = now
      setError(null)
      
      // Haptic feedback
      if (hapticFeedback && navigator.vibrate && !settings.isLowEnd) {
        navigator.vibrate(10)
      }
      
      // Sound feedback
      if (soundFeedback && !settings.isLowEnd) {
        try {
          const AudioContext = window.AudioContext || window.webkitAudioContext
          if (AudioContext) {
            const audioContext = new AudioContext()
            const oscillator = audioContext.createOscillator()
            const gainNode = audioContext.createGain()
            
            oscillator.connect(gainNode)
            gainNode.connect(audioContext.destination)
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
            oscillator.frequency.exponentialRampToValueAtTime(1000, audioContext.currentTime + 0.05)
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
            
            oscillator.start(audioContext.currentTime)
            oscillator.stop(audioContext.currentTime + 0.1)
          }
        } catch (e) {
          // Silently fail
        }
      }
      
      if (onClick) {
        const buttonId = `button_${Date.now()}`
        performanceMonitor.startTiming(buttonId)
        
        if (showLoadingState) {
          setInternalLoading(true)
        }
        
        try {
          const result = onClick(event)
          
          // Handle async operations
          if (result instanceof Promise) {
            await result
          }
          
          if (successMessage) {
            const { toast } = await import('sonner')
            toast.success(successMessage)
          }
        } catch (error) {
          console.error('Button action failed:', error)
          setError(error)
          
          if (errorMessage) {
            const { toast } = await import('sonner')
            toast.error(errorMessage)
          }
          
          if (retryOnError) {
            // Implement retry logic here if needed
          }
        } finally {
          performanceMonitor.endTiming(buttonId)
          
          if (showLoadingState) {
            // Minimum loading time to prevent flashing
            setTimeout(() => {
              setInternalLoading(false)
            }, 150)
          }
        }
      }
    }, [
      onClick,
      effectiveDebounceMs,
      hapticFeedback,
      soundFeedback,
      showLoadingState,
      successMessage,
      errorMessage,
      retryOnError,
      settings
    ])

    const isLoading = externalLoading || internalLoading
    const isDisabled = externalDisabled || isLoading

    return (
      <WrappedComponent
        ref={ref}
        {...otherProps}
        onClick={handleClick}
        loading={isLoading}
        disabled={isDisabled}
        loadingText={loadingText}
      />
    )
  })
}

/**
 * Hook for enhanced button interactions
 */
export const useEnhancedButton = (action, options = {}) => {
  const {
    debounceMs = 300,
    showSuccessToast = true,
    showErrorToast = true,
    successMessage = 'Action completed successfully',
    errorMessage,
    retryAttempts = 0,
    optimizeAPI = true
  } = options

  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState(null)
  const lastExecutionTime = React.useRef(0)

  const execute = React.useCallback(async (...args) => {
    const now = Date.now()
    
    // Debounce
    if (now - lastExecutionTime.current < debounceMs) {
      return
    }
    
    lastExecutionTime.current = now
    setLoading(true)
    setError(null)

    try {
      let result
      
      if (optimizeAPI && typeof action === 'function') {
        // Wrap API calls with optimization
        result = await performanceMonitor.measure('button_action', action)(...args)
      } else {
        result = await action(...args)
      }
      
      if (showSuccessToast && successMessage) {
        const { toast } = await import('sonner')
        toast.success(successMessage)
      }
      
      return result
    } catch (err) {
      console.error('Enhanced button action failed:', err)
      setError(err)
      
      if (showErrorToast) {
        const { toast } = await import('sonner')
        const message = errorMessage || err.response?.data?.detail || err.message || 'Action failed'
        toast.error(message)
      }
      
      throw err
    } finally {
      setLoading(false)
    }
  }, [action, debounceMs, showSuccessToast, showErrorToast, successMessage, errorMessage, optimizeAPI])

  return {
    execute,
    loading,
    error,
    reset: () => {
      setLoading(false)
      setError(null)
    }
  }
}

/**
 * Batch button operations for multiple actions
 */
export const useBatchButtons = () => {
  const [operations, setOperations] = React.useState(new Map())
  
  const addOperation = React.useCallback((id, operation) => {
    setOperations(prev => new Map(prev).set(id, {
      ...operation,
      loading: false,
      error: null
    }))
  }, [])
  
  const executeOperation = React.useCallback(async (id, ...args) => {
    const operation = operations.get(id)
    if (!operation) return
    
    setOperations(prev => {
      const newMap = new Map(prev)
      newMap.set(id, { ...operation, loading: true, error: null })
      return newMap
    })
    
    try {
      const result = await operation.action(...args)
      
      setOperations(prev => {
        const newMap = new Map(prev)
        newMap.set(id, { ...operation, loading: false, error: null })
        return newMap
      })
      
      return result
    } catch (error) {
      setOperations(prev => {
        const newMap = new Map(prev)
        newMap.set(id, { ...operation, loading: false, error })
        return newMap
      })
      
      throw error
    }
  }, [operations])
  
  const getOperationState = React.useCallback((id) => {
    return operations.get(id) || { loading: false, error: null }
  }, [operations])
  
  return {
    addOperation,
    executeOperation,
    getOperationState,
    operations
  }
}

/**
 * Smart loading states that adapt to user behavior
 */
export const useSmartLoading = (initialState = false) => {
  const [loading, setLoading] = React.useState(initialState)
  const [showSpinner, setShowSpinner] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const timeoutRef = React.useRef(null)
  const startTime = React.useRef(null)

  const startLoading = React.useCallback((estimatedDuration = 2000) => {
    setLoading(true)
    startTime.current = Date.now()
    
    // Show spinner after 200ms to avoid flashing for quick operations
    timeoutRef.current = setTimeout(() => {
      setShowSpinner(true)
    }, 200)
    
    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime.current
      const progressPercent = Math.min(90, (elapsed / estimatedDuration) * 100)
      setProgress(progressPercent)
      
      if (progressPercent >= 90) {
        clearInterval(progressInterval)
      }
    }, 100)
    
    return () => {
      clearInterval(progressInterval)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const stopLoading = React.useCallback(() => {
    setProgress(100)
    
    // Brief delay to show completion
    setTimeout(() => {
      setLoading(false)
      setShowSpinner(false)
      setProgress(0)
    }, 150)
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [])

  return {
    loading,
    showSpinner,
    progress,
    startLoading,
    stopLoading
  }
}

/**
 * Global button performance optimizer
 */
export const optimizeAllButtons = () => {
  // Add global styles for better button performance
  const style = document.createElement('style')
  style.textContent = `
    button, [role="button"] {
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
      will-change: transform;
    }
    
    button:active, [role="button"]:active {
      transform: scale(0.98);
      transition: transform 0.1s ease;
    }
    
    .button-loading {
      pointer-events: none;
      opacity: 0.7;
    }
    
    .button-enhanced {
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .button-enhanced:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    
    .button-enhanced:active {
      transform: translateY(0);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    @media (prefers-reduced-motion: reduce) {
      button, [role="button"] {
        transition: none !important;
        transform: none !important;
      }
    }
  `
  
  document.head.appendChild(style)
  
  // Add global event listeners for better touch handling
  document.addEventListener('touchstart', (e) => {
    if (e.target.matches('button, [role="button"]')) {
      e.target.classList.add('button-active')
    }
  }, { passive: true })
  
  document.addEventListener('touchend', (e) => {
    if (e.target.matches('button, [role="button"]')) {
      setTimeout(() => {
        e.target.classList.remove('button-active')
      }, 150)
    }
  }, { passive: true })
}

// Auto-optimize buttons when module loads
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', optimizeAllButtons)
}