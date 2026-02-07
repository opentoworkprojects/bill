import React, { useState, useEffect, useRef } from 'react';
import { useScrollTrigger } from '../hooks/useScrollTrigger';

/**
 * Animated Stats Counter Component
 * 
 * Displays statistics with count-up animation when scrolled into view
 * Uses easeOutExpo easing for natural deceleration
 * 
 * Requirements: 2.4, 4.3
 */
const AnimatedStatsCounter = ({ stats, duration = 2000 }) => {
  const scrollTrigger = useScrollTrigger({
    threshold: 0.3,
    triggerOnce: true,
  });

  return (
    <div ref={scrollTrigger.ref}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '32px',
          padding: '40px 20px',
        }}
      >
        {stats.map((stat, index) => (
          <StatItem
            key={index}
            stat={stat}
            shouldAnimate={scrollTrigger.isVisible}
            duration={duration}
            delay={index * 100}
          />
        ))}
      </div>
    </div>
  );
};

const StatItem = ({ stat, shouldAnimate, duration, delay }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const animationRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (!shouldAnimate) return;

    // Wait for delay before starting
    const delayTimeout = setTimeout(() => {
      startTimeRef.current = null;
      
      const animate = (timestamp) => {
        if (!startTimeRef.current) {
          startTimeRef.current = timestamp;
        }

        const elapsed = timestamp - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);

        // easeOutExpo easing function
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        
        const currentValue = eased * stat.value;
        setDisplayValue(currentValue);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          // Ensure final value is exact
          setDisplayValue(stat.value);
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(delayTimeout);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [shouldAnimate, stat.value, duration, delay]);

  // Format the display value
  const formatValue = (value) => {
    if (stat.suffix === '%' || Number.isInteger(stat.value)) {
      return Math.round(value);
    }
    return value.toFixed(1);
  };

  const formattedValue = formatValue(displayValue);

  return (
    <div
      style={{
        textAlign: 'center',
        padding: '24px',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        transition: 'transform 0.3s ease',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
    >
      {/* Value with prefix/suffix */}
      <div
        style={{
          fontSize: '48px',
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '8px',
        }}
        // Accessibility: Announce final value to screen readers
        aria-live="polite"
        aria-atomic="true"
      >
        {stat.prefix || ''}
        {formattedValue.toLocaleString()}
        {stat.suffix || ''}
      </div>

      {/* Label */}
      <div
        style={{
          fontSize: '16px',
          color: '#4a5568',
          fontWeight: '500',
        }}
      >
        {stat.label}
      </div>

      {/* Optional description */}
      {stat.description && (
        <div
          style={{
            fontSize: '14px',
            color: '#718096',
            marginTop: '8px',
          }}
        >
          {stat.description}
        </div>
      )}
    </div>
  );
};

export default AnimatedStatsCounter;
