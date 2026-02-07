import { useState, useEffect, useCallback, useRef } from 'react';
import { useReducedMotion } from './useReducedMotion';
import {
  createAnimationConfig,
  createReducedMotionConfig,
  getAnimationPreset,
  generateTransitionString,
} from '../utils/animationConfig';

/**
 * Custom hook for managing animation states and generating CSS styles
 * 
 * Accepts an animation config object and returns animation state with trigger/reset functions.
 * Automatically respects user's reduced motion preferences for accessibility.
 * Cleans up animation styles after completion.
 * 
 * Requirements: 3.1, 3.5, 4.1
 * 
 * @param {Object} config - Animation configuration
 * @param {string} [config.type] - Animation type (fade, slide, scale, bounce) or preset name
 * @param {number} [config.duration=300] - Animation duration in milliseconds
 * @param {number} [config.delay=0] - Delay before animation starts in milliseconds
 * @param {string} [config.easing='ease-out'] - CSS easing function
 * @param {string} [config.direction] - Direction for slide animations (up, down, left, right)
 * @param {Object} [config.transform] - Custom transform values {from, to}
 * @param {Object} [config.opacity] - Custom opacity values {from, to}
 * 
 * @returns {Object} Animation state object
 * @returns {boolean} return.isAnimating - Whether animation is currently running
 * @returns {boolean} return.hasAnimated - Whether animation has completed at least once
 * @returns {Function} return.trigger - Function to trigger the animation
 * @returns {Function} return.reset - Function to reset animation to initial state
 * @returns {Object} return.style - CSS styles to apply to the animated element
 * 
 * @example
 * const animation = useAnimation({ type: 'slideInUp', duration: 400 });
 * 
 * return (
 *   <div style={animation.style}>
 *     <button onClick={animation.trigger}>Animate</button>
 *   </div>
 * );
 */
export const useAnimation = (config = {}) => {
  const prefersReducedMotion = useReducedMotion();
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const timeoutRef = useRef(null);
  const cleanupTimeoutRef = useRef(null);

  // Parse and normalize the animation configuration
  const animationConfig = useRef(null);
  
  useEffect(() => {
    // Build the animation config from the input
    let baseConfig;
    
    // Check if config is a preset name (string) or a config object
    if (typeof config === 'string') {
      baseConfig = getAnimationPreset(config);
      if (!baseConfig) {
        console.warn(`Animation preset "${config}" not found, using fadeIn`);
        baseConfig = getAnimationPreset('fadeIn');
      }
    } else if (config && config.type) {
      // Try to get preset by type
      const presetName = buildPresetName(config.type, config.direction);
      baseConfig = getAnimationPreset(presetName);
      
      if (!baseConfig) {
        // Fall back to creating custom config
        baseConfig = createAnimationConfig(config);
      } else {
        // Merge preset with custom overrides
        baseConfig = {
          ...baseConfig,
          duration: config.duration !== undefined ? config.duration : baseConfig.duration,
          delay: config.delay !== undefined ? config.delay : baseConfig.delay,
          easing: config.easing || baseConfig.easing,
        };
      }
    } else {
      // Create custom config from scratch
      baseConfig = createAnimationConfig(config);
    }
    
    // Apply reduced motion if needed (Requirement 4.1)
    animationConfig.current = prefersReducedMotion
      ? createReducedMotionConfig(baseConfig)
      : baseConfig;
  }, [config, prefersReducedMotion]);

  // Cleanup function to remove animation styles (Requirement 3.5)
  const cleanup = useCallback(() => {
    setIsAnimating(false);
    
    // Clear any pending timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Trigger animation
  const trigger = useCallback(() => {
    if (!animationConfig.current) return;
    
    // Clear any existing timeouts
    cleanup();
    
    // Start animation
    setIsAnimating(true);
    
    const { duration, delay } = animationConfig.current;
    const totalDuration = duration + delay;
    
    // Set timeout to mark animation as complete
    timeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
      setHasAnimated(true);
      
      // Schedule cleanup of animation styles after a brief delay
      // This ensures the final state is visible before cleanup
      cleanupTimeoutRef.current = setTimeout(() => {
        // Animation styles will be removed by returning to initial state
        // The component can handle this by checking hasAnimated
      }, 50);
    }, totalDuration);
  }, [cleanup]);

  // Reset animation to initial state
  const reset = useCallback(() => {
    cleanup();
    setHasAnimated(false);
  }, [cleanup]);

  // Generate CSS styles based on animation state
  const style = useRef({});
  
  useEffect(() => {
    if (!animationConfig.current) {
      style.current = {};
      return;
    }
    
    const cfg = animationConfig.current;
    
    if (!isAnimating && !hasAnimated) {
      // Initial state (before animation)
      style.current = {
        transform: cfg.transform.from !== 'none' ? cfg.transform.from : undefined,
        opacity: cfg.opacity.from,
        transition: 'none',
      };
    } else if (isAnimating) {
      // Animating state
      style.current = {
        transform: cfg.transform.to !== 'none' ? cfg.transform.to : undefined,
        opacity: cfg.opacity.to,
        transition: generateTransitionString(cfg),
        // Add will-change hint for performance (Requirement 3.1)
        willChange: getWillChangeProperties(cfg),
      };
    } else if (hasAnimated) {
      // Final state (after animation completes) - cleanup styles (Requirement 3.5)
      style.current = {
        transform: cfg.transform.to !== 'none' ? cfg.transform.to : undefined,
        opacity: cfg.opacity.to,
        // Remove transition and will-change to free resources
      };
    }
  }, [isAnimating, hasAnimated]);

  return {
    isAnimating,
    hasAnimated,
    trigger,
    reset,
    style: style.current,
  };
};

/**
 * Build preset name from type and direction
 * @param {string} type - Animation type (fade, slide, scale, bounce)
 * @param {string} direction - Direction (up, down, left, right)
 * @returns {string} Preset name
 */
function buildPresetName(type, direction) {
  if (type === 'fade') {
    return 'fadeIn';
  }
  
  if (type === 'slide' && direction) {
    const directionMap = {
      up: 'slideInUp',
      down: 'slideInDown',
      left: 'slideInLeft',
      right: 'slideInRight',
    };
    return directionMap[direction] || 'slideInUp';
  }
  
  if (type === 'scale') {
    return 'scaleIn';
  }
  
  if (type === 'bounce') {
    return 'bounceIn';
  }
  
  // Default to fadeIn
  return 'fadeIn';
}

/**
 * Get will-change CSS property value based on animation config
 * @param {Object} config - Animation configuration
 * @returns {string} will-change property value
 */
function getWillChangeProperties(config) {
  const properties = [];
  
  if (config.transform.from !== 'none' || config.transform.to !== 'none') {
    properties.push('transform');
  }
  
  if (config.opacity.from !== config.opacity.to) {
    properties.push('opacity');
  }
  
  return properties.length > 0 ? properties.join(', ') : 'auto';
}

export default useAnimation;
