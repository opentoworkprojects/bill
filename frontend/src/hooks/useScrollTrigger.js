import { useState, useEffect, useRef, useCallback } from 'react';
import { useReducedMotion } from './useReducedMotion';

/**
 * Custom hook for detecting when elements enter the viewport using Intersection Observer
 * 
 * Triggers animations when elements scroll into view. Supports staggered animations
 * for multiple elements and respects user's reduced motion preferences.
 * Automatically cleans up observers on unmount.
 * 
 * Requirements: 2.2, 3.3
 * 
 * @param {Object} config - Scroll trigger configuration
 * @param {number} [config.threshold=0.1] - Intersection threshold (0-1, how much of element must be visible)
 * @param {string} [config.rootMargin='0px'] - Root margin for intersection observer
 * @param {boolean} [config.triggerOnce=true] - Only trigger once when element enters viewport
 * @param {number} [config.staggerDelay=100] - Delay between staggered items in milliseconds
 * @param {number} [config.staggerIndex=0] - Index for staggered animations (used internally)
 * 
 * @returns {Object} Scroll trigger state object
 * @returns {boolean} return.isVisible - Whether element is currently visible in viewport
 * @returns {React.RefObject} return.ref - Ref to attach to the target element
 * @returns {boolean} return.hasTriggered - Whether the trigger has fired at least once
 * 
 * @example
 * const scrollTrigger = useScrollTrigger({ threshold: 0.2, triggerOnce: true });
 * 
 * return (
 *   <div ref={scrollTrigger.ref}>
 *     {scrollTrigger.isVisible && <AnimatedContent />}
 *   </div>
 * );
 */
export const useScrollTrigger = (config = {}) => {
  const {
    threshold = 0.1,
    rootMargin = '0px',
    triggerOnce = true,
    staggerDelay = 100,
    staggerIndex = 0,
  } = config;

  const prefersReducedMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const ref = useRef(null);
  const observerRef = useRef(null);
  const staggerTimeoutRef = useRef(null);

  // Check if Intersection Observer is supported
  const hasIntersectionObserver = typeof window !== 'undefined' && 'IntersectionObserver' in window;

  // Cleanup function
  const cleanup = useCallback(() => {
    // Disconnect observer
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    // Clear stagger timeout
    if (staggerTimeoutRef.current) {
      clearTimeout(staggerTimeoutRef.current);
      staggerTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    // If reduced motion is preferred, show content immediately without scroll trigger
    if (prefersReducedMotion) {
      setIsVisible(true);
      setHasTriggered(true);
      return;
    }

    // If Intersection Observer is not supported, fall back to immediate display
    if (!hasIntersectionObserver) {
      console.warn('IntersectionObserver not supported, disabling scroll animations');
      setIsVisible(true);
      setHasTriggered(true);
      return;
    }

    // If no ref element, nothing to observe
    if (!ref.current) {
      return;
    }

    // Create intersection observer
    const observerOptions = {
      threshold,
      rootMargin,
    };

    const handleIntersection = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Element is visible in viewport
          
          // Apply stagger delay if specified (Requirement 3.3)
          if (staggerDelay > 0 && staggerIndex > 0) {
            const delay = staggerIndex * staggerDelay;
            
            staggerTimeoutRef.current = setTimeout(() => {
              setIsVisible(true);
              setHasTriggered(true);
              
              // If triggerOnce is true, disconnect observer after first trigger
              if (triggerOnce && observerRef.current) {
                observerRef.current.disconnect();
                observerRef.current = null;
              }
            }, delay);
          } else {
            // No stagger delay, trigger immediately
            setIsVisible(true);
            setHasTriggered(true);
            
            // If triggerOnce is true, disconnect observer after first trigger
            if (triggerOnce && observerRef.current) {
              observerRef.current.disconnect();
              observerRef.current = null;
            }
          }
        } else if (!triggerOnce) {
          // Element is not visible and triggerOnce is false
          // Reset visibility so animation can trigger again
          setIsVisible(false);
        }
      });
    };

    // Create and store observer
    observerRef.current = new IntersectionObserver(handleIntersection, observerOptions);
    
    // Start observing the element
    observerRef.current.observe(ref.current);

    // Cleanup on unmount
    return cleanup;
  }, [
    threshold,
    rootMargin,
    triggerOnce,
    staggerDelay,
    staggerIndex,
    prefersReducedMotion,
    hasIntersectionObserver,
    cleanup,
  ]);

  return {
    isVisible,
    ref,
    hasTriggered,
  };
};

/**
 * Create multiple scroll triggers with staggered delays
 * Useful for animating lists or grids of elements
 * 
 * @param {number} count - Number of scroll triggers to create
 * @param {Object} config - Base configuration for all triggers
 * @returns {Array} Array of scroll trigger objects
 * 
 * @example
 * const triggers = useScrollTriggers(5, { threshold: 0.2, staggerDelay: 100 });
 * 
 * return (
 *   <div>
 *     {items.map((item, index) => (
 *       <div key={item.id} ref={triggers[index].ref}>
 *         {triggers[index].isVisible && <AnimatedItem item={item} />}
 *       </div>
 *     ))}
 *   </div>
 * );
 */
export const useScrollTriggers = (count, config = {}) => {
  const triggers = [];
  
  for (let i = 0; i < count; i++) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    triggers.push(useScrollTrigger({
      ...config,
      staggerIndex: i,
    }));
  }
  
  return triggers;
};

export default useScrollTrigger;
