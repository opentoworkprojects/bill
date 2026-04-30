import { useState, useEffect } from 'react';

/**
 * Hook to detect user's motion preference from system settings
 * Queries the prefers-reduced-motion media query and updates when preference changes
 * 
 * @returns {boolean} True if user prefers reduced motion, false otherwise
 * 
 * @example
 * const prefersReducedMotion = useReducedMotion();
 * 
 * if (prefersReducedMotion) {
 *   // Use simple fade animations or no animations
 * } else {
 *   // Use full animations with transforms
 * }
 */
export const useReducedMotion = () => {
  // Initialize state based on current media query
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    // Check if window and matchMedia are available (SSR safety)
    if (typeof window === 'undefined' || !window.matchMedia) {
      return false;
    }
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    return mediaQuery.matches;
  });

  useEffect(() => {
    // Check if matchMedia is available
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    // Handler for media query changes
    const handleChange = (event) => {
      setPrefersReducedMotion(event.matches);
    };

    // Add event listener for changes
    // Use addEventListener for modern browsers, addListener for older ones
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else if (mediaQuery.addListener) {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }

    // Cleanup function to remove event listener
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else if (mediaQuery.removeListener) {
        // Fallback for older browsers
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  return prefersReducedMotion;
};

export default useReducedMotion;
