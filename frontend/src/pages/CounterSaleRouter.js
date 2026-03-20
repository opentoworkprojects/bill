import React, { useState, useEffect } from 'react';
import CounterSalePage from './CounterSalePage';
import MobileCounterSalePage from './MobileCounterSalePage';

const MOBILE_BREAKPOINT = 1024;
const RESIZE_DEBOUNCE_MS = 300;

/**
 * CounterSaleRouter - Device detection and routing wrapper
 * 
 * Detects screen width and renders the appropriate counter sale page:
 * - MobileCounterSalePage for screens < 1024px
 * - CounterSalePage for screens >= 1024px
 * 
 * Listens to window resize events with 300ms debounce to handle
 * dynamic screen size changes.
 */
const CounterSaleRouter = ({ user }) => {
  const [isMobile, setIsMobile] = useState(() => {
    // Initialize based on current window width
    return typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT;
  });

  useEffect(() => {
    let timeoutId = null;

    const handleResize = () => {
      // Clear existing timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Debounce resize events (300ms)
      timeoutId = setTimeout(() => {
        const newIsMobile = window.innerWidth < MOBILE_BREAKPOINT;
        if (newIsMobile !== isMobile) {
          setIsMobile(newIsMobile);
        }
      }, RESIZE_DEBOUNCE_MS);
    };

    // Add resize listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [isMobile]);

  // Render MobileCounterSalePage for mobile devices (< 1024px)
  // Render CounterSalePage for desktop devices (>= 1024px)
  if (isMobile) {
    return <MobileCounterSalePage user={user} />;
  }

  return <CounterSalePage user={user} />;
};

export default CounterSaleRouter;
