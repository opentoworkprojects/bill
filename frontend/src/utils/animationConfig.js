/**
 * Animation Configuration and Presets
 * 
 * Provides reusable animation configurations using GPU-accelerated CSS transforms.
 * All animations use transform and opacity properties for optimal performance.
 * 
 * Requirements: 3.1, 3.3, 7.2
 */

// ============================================================================
// TIMING CONSTANTS
// ============================================================================

/**
 * Standard animation durations in milliseconds
 */
export const DURATION = {
  INSTANT: 0,
  FAST: 200,
  NORMAL: 300,
  MEDIUM: 400,
  SLOW: 600,
  VERY_SLOW: 800,
};

/**
 * Minimum stagger delay between consecutive animations (Requirement 3.3)
 */
export const MIN_STAGGER_DELAY = 50;

/**
 * Standard stagger delays for multiple element animations
 */
export const STAGGER_DELAY = {
  MINIMAL: 50,
  SMALL: 100,
  MEDIUM: 150,
  LARGE: 200,
};

/**
 * Maximum concurrent animations to prevent performance degradation
 */
export const MAX_CONCURRENT_ANIMATIONS = 10;

// ============================================================================
// EASING FUNCTIONS
// ============================================================================

/**
 * CSS easing functions for smooth animations
 * Using standard cubic-bezier curves for natural motion
 */
export const EASING = {
  // Standard easings
  LINEAR: 'linear',
  EASE: 'ease',
  EASE_IN: 'ease-in',
  EASE_OUT: 'ease-out',
  EASE_IN_OUT: 'ease-in-out',
  
  // Custom cubic-bezier easings
  EASE_OUT_QUAD: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  EASE_OUT_CUBIC: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
  EASE_OUT_QUART: 'cubic-bezier(0.165, 0.84, 0.44, 1)',
  EASE_OUT_EXPO: 'cubic-bezier(0.19, 1, 0.22, 1)',
  
  EASE_IN_QUAD: 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',
  EASE_IN_CUBIC: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
  EASE_IN_QUART: 'cubic-bezier(0.895, 0.03, 0.685, 0.22)',
  EASE_IN_EXPO: 'cubic-bezier(0.95, 0.05, 0.795, 0.035)',
  
  EASE_IN_OUT_QUAD: 'cubic-bezier(0.455, 0.03, 0.515, 0.955)',
  EASE_IN_OUT_CUBIC: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
  EASE_IN_OUT_QUART: 'cubic-bezier(0.77, 0, 0.175, 1)',
  EASE_IN_OUT_EXPO: 'cubic-bezier(1, 0, 0, 1)',
  
  // Special easings
  BOUNCE: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  SPRING: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
};

// ============================================================================
// ANIMATION PRESETS
// ============================================================================

/**
 * Fade In Animation
 * Simple opacity transition with no transforms
 */
export const fadeIn = {
  name: 'fadeIn',
  duration: DURATION.NORMAL,
  delay: 0,
  easing: EASING.EASE_OUT,
  transform: {
    from: 'none',
    to: 'none',
  },
  opacity: {
    from: 0,
    to: 1,
  },
};

/**
 * Fade Out Animation
 * Simple opacity transition with no transforms
 */
export const fadeOut = {
  name: 'fadeOut',
  duration: DURATION.NORMAL,
  delay: 0,
  easing: EASING.EASE_IN,
  transform: {
    from: 'none',
    to: 'none',
  },
  opacity: {
    from: 1,
    to: 0,
  },
};

/**
 * Slide In Up Animation
 * Element slides up from below while fading in
 * Uses translateY for GPU acceleration
 */
export const slideInUp = {
  name: 'slideInUp',
  duration: DURATION.MEDIUM,
  delay: 0,
  easing: EASING.EASE_OUT_CUBIC,
  transform: {
    from: 'translateY(30px)',
    to: 'translateY(0)',
  },
  opacity: {
    from: 0,
    to: 1,
  },
};

/**
 * Slide In Down Animation
 * Element slides down from above while fading in
 * Uses translateY for GPU acceleration
 */
export const slideInDown = {
  name: 'slideInDown',
  duration: DURATION.MEDIUM,
  delay: 0,
  easing: EASING.EASE_OUT_CUBIC,
  transform: {
    from: 'translateY(-30px)',
    to: 'translateY(0)',
  },
  opacity: {
    from: 0,
    to: 1,
  },
};

/**
 * Slide In Left Animation
 * Element slides in from the left while fading in
 * Uses translateX for GPU acceleration
 */
export const slideInLeft = {
  name: 'slideInLeft',
  duration: DURATION.MEDIUM,
  delay: 0,
  easing: EASING.EASE_OUT_CUBIC,
  transform: {
    from: 'translateX(-30px)',
    to: 'translateX(0)',
  },
  opacity: {
    from: 0,
    to: 1,
  },
};

/**
 * Slide In Right Animation
 * Element slides in from the right while fading in
 * Uses translateX for GPU acceleration
 */
export const slideInRight = {
  name: 'slideInRight',
  duration: DURATION.MEDIUM,
  delay: 0,
  easing: EASING.EASE_OUT_CUBIC,
  transform: {
    from: 'translateX(30px)',
    to: 'translateX(0)',
  },
  opacity: {
    from: 0,
    to: 1,
  },
};

/**
 * Scale In Animation
 * Element scales up from smaller size while fading in
 * Uses scale for GPU acceleration
 */
export const scaleIn = {
  name: 'scaleIn',
  duration: DURATION.NORMAL,
  delay: 0,
  easing: EASING.EASE_OUT_CUBIC,
  transform: {
    from: 'scale(0.9)',
    to: 'scale(1)',
  },
  opacity: {
    from: 0,
    to: 1,
  },
};

/**
 * Scale Out Animation
 * Element scales down to smaller size while fading out
 * Uses scale for GPU acceleration
 */
export const scaleOut = {
  name: 'scaleOut',
  duration: DURATION.NORMAL,
  delay: 0,
  easing: EASING.EASE_IN_CUBIC,
  transform: {
    from: 'scale(1)',
    to: 'scale(0.9)',
  },
  opacity: {
    from: 1,
    to: 0,
  },
};

/**
 * Bounce In Animation
 * Element bounces in with spring-like effect
 * Uses scale for GPU acceleration with bounce easing
 */
export const bounceIn = {
  name: 'bounceIn',
  duration: DURATION.SLOW,
  delay: 0,
  easing: EASING.BOUNCE,
  transform: {
    from: 'scale(0.3)',
    to: 'scale(1)',
  },
  opacity: {
    from: 0,
    to: 1,
  },
};

/**
 * Zoom In Animation
 * Element zooms in from very small size
 * Uses scale for GPU acceleration
 */
export const zoomIn = {
  name: 'zoomIn',
  duration: DURATION.NORMAL,
  delay: 0,
  easing: EASING.EASE_OUT_QUAD,
  transform: {
    from: 'scale(0.5)',
    to: 'scale(1)',
  },
  opacity: {
    from: 0,
    to: 1,
  },
};

/**
 * Zoom Out Animation
 * Element zooms out to very small size
 * Uses scale for GPU acceleration
 */
export const zoomOut = {
  name: 'zoomOut',
  duration: DURATION.NORMAL,
  delay: 0,
  easing: EASING.EASE_IN_QUAD,
  transform: {
    from: 'scale(1)',
    to: 'scale(0.5)',
  },
  opacity: {
    from: 1,
    to: 0,
  },
};

/**
 * Rotate In Animation
 * Element rotates in while scaling and fading
 * Uses rotate and scale for GPU acceleration
 */
export const rotateIn = {
  name: 'rotateIn',
  duration: DURATION.MEDIUM,
  delay: 0,
  easing: EASING.EASE_OUT_CUBIC,
  transform: {
    from: 'rotate(-180deg) scale(0.8)',
    to: 'rotate(0deg) scale(1)',
  },
  opacity: {
    from: 0,
    to: 1,
  },
};

/**
 * Pulse Animation
 * Element pulses with subtle scale change
 * Uses scale for GPU acceleration
 */
export const pulse = {
  name: 'pulse',
  duration: DURATION.SLOW,
  delay: 0,
  easing: EASING.EASE_IN_OUT_QUAD,
  transform: {
    from: 'scale(1)',
    to: 'scale(1.05)',
  },
  opacity: {
    from: 1,
    to: 1,
  },
};

/**
 * Lift Animation
 * Element lifts up with shadow effect (transform only)
 * Uses translateY for GPU acceleration
 */
export const lift = {
  name: 'lift',
  duration: DURATION.FAST,
  delay: 0,
  easing: EASING.EASE_OUT_QUAD,
  transform: {
    from: 'translateY(0)',
    to: 'translateY(-8px)',
  },
  opacity: {
    from: 1,
    to: 1,
  },
};

// ============================================================================
// ANIMATION PRESET COLLECTION
// ============================================================================

/**
 * Collection of all animation presets
 * Organized by animation type for easy access
 */
export const ANIMATION_PRESETS = {
  // Fade animations
  fadeIn,
  fadeOut,
  
  // Slide animations
  slideInUp,
  slideInDown,
  slideInLeft,
  slideInRight,
  
  // Scale animations
  scaleIn,
  scaleOut,
  bounceIn,
  zoomIn,
  zoomOut,
  
  // Rotate animations
  rotateIn,
  
  // Special animations
  pulse,
  lift,
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get animation preset by name
 * @param {string} name - Name of the animation preset
 * @returns {Object|null} Animation preset object or null if not found
 */
export const getAnimationPreset = (name) => {
  return ANIMATION_PRESETS[name] || null;
};

/**
 * Create custom animation configuration
 * @param {Object} config - Custom animation configuration
 * @returns {Object} Complete animation configuration with defaults
 */
export const createAnimationConfig = (config = {}) => {
  // Handle null by treating it as empty object
  const cfg = config || {};
  
  return {
    name: cfg.name || 'custom',
    duration: cfg.duration !== undefined ? cfg.duration : DURATION.NORMAL,
    delay: cfg.delay !== undefined ? cfg.delay : 0,
    easing: cfg.easing || EASING.EASE_OUT,
    transform: {
      from: cfg.transform?.from || 'none',
      to: cfg.transform?.to || 'none',
    },
    opacity: {
      from: cfg.opacity?.from !== undefined ? cfg.opacity.from : 1,
      to: cfg.opacity?.to !== undefined ? cfg.opacity.to : 1,
    },
  };
};

/**
 * Calculate staggered delay for multiple elements
 * @param {number} index - Index of the element in the sequence
 * @param {number} baseDelay - Base delay before stagger starts (default: 0)
 * @param {number} staggerAmount - Delay between each element (default: MIN_STAGGER_DELAY)
 * @returns {number} Calculated delay in milliseconds
 */
export const calculateStaggerDelay = (
  index,
  baseDelay = 0,
  staggerAmount = MIN_STAGGER_DELAY
) => {
  // Ensure minimum stagger delay (Requirement 3.3)
  const effectiveStagger = Math.max(staggerAmount, MIN_STAGGER_DELAY);
  return baseDelay + (index * effectiveStagger);
};

/**
 * Generate CSS transition string from animation config
 * @param {Object} config - Animation configuration
 * @returns {string} CSS transition string
 */
export const generateTransitionString = (config) => {
  const { duration, easing, delay } = config;
  const transitions = [];
  
  if (config.transform.from !== 'none' || config.transform.to !== 'none') {
    transitions.push(`transform ${duration}ms ${easing} ${delay}ms`);
  }
  
  if (config.opacity.from !== config.opacity.to) {
    transitions.push(`opacity ${duration}ms ${easing} ${delay}ms`);
  }
  
  return transitions.join(', ');
};

/**
 * Create reduced motion version of animation config
 * Removes transforms and shortens duration for accessibility
 * @param {Object} config - Original animation configuration
 * @returns {Object} Reduced motion animation configuration
 */
export const createReducedMotionConfig = (config) => {
  return {
    ...config,
    duration: Math.min(config.duration, DURATION.FAST),
    transform: {
      from: 'none',
      to: 'none',
    },
    // Keep opacity transitions but make them faster
    opacity: config.opacity,
  };
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  DURATION,
  STAGGER_DELAY,
  MIN_STAGGER_DELAY,
  MAX_CONCURRENT_ANIMATIONS,
  EASING,
  ANIMATION_PRESETS,
  getAnimationPreset,
  createAnimationConfig,
  calculateStaggerDelay,
  generateTransitionString,
  createReducedMotionConfig,
};
