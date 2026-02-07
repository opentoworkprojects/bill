import React, { useEffect } from 'react';
import { useAnimation } from '../hooks/useAnimation';
import { ArrowRight, Sparkles } from 'lucide-react';

/**
 * Animated Hero Section Component
 * 
 * Hero section with staggered entrance animations for Landing page
 * Features parallax scrolling effect and responsive design
 * 
 * Requirements: 2.1
 */
const AnimatedHeroSection = ({
  title,
  subtitle,
  ctaText,
  onCtaClick,
  backgroundImage,
}) => {
  // Staggered animations for each element
  const titleAnimation = useAnimation({ type: 'slide', direction: 'left', duration: 600, delay: 200 });
  const subtitleAnimation = useAnimation({ type: 'fade', duration: 500, delay: 400 });
  const ctaAnimation = useAnimation({ type: 'scale', duration: 400, delay: 600 });
  const backgroundAnimation = useAnimation({ type: 'fade', duration: 800, delay: 0 });

  useEffect(() => {
    // Trigger all animations on mount
    backgroundAnimation.trigger();
    titleAnimation.trigger();
    subtitleAnimation.trigger();
    ctaAnimation.trigger();
  }, []);

  return (
    <section
      style={{
        position: 'relative',
        minHeight: '600px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      {/* Background with parallax effect */}
      <div
        style={{
          ...backgroundAnimation.style,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.2,
        }}
      />

      {/* Gradient overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%)',
        }}
      />

      {/* Decorative elements */}
      <div
        style={{
          position: 'absolute',
          top: '10%',
          right: '10%',
          width: '300px',
          height: '300px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          filter: 'blur(80px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '10%',
          width: '400px',
          height: '400px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '50%',
          filter: 'blur(100px)',
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
          padding: '40px 20px',
          maxWidth: '900px',
        }}
      >
        {/* Title */}
        <h1
          style={{
            ...titleAnimation.style,
            color: 'white',
            fontSize: 'clamp(32px, 5vw, 56px)',
            fontWeight: 'bold',
            marginBottom: '24px',
            lineHeight: '1.2',
            textShadow: '0 2px 20px rgba(0, 0, 0, 0.2)',
          }}
        >
          {title}
        </h1>

        {/* Subtitle */}
        <p
          style={{
            ...subtitleAnimation.style,
            color: 'rgba(255, 255, 255, 0.95)',
            fontSize: 'clamp(16px, 2.5vw, 20px)',
            marginBottom: '40px',
            lineHeight: '1.6',
            maxWidth: '700px',
            margin: '0 auto 40px',
          }}
        >
          {subtitle}
        </p>

        {/* CTA Button */}
        <div style={ctaAnimation.style}>
          <button
            onClick={onCtaClick}
            style={{
              background: 'white',
              color: '#667eea',
              border: 'none',
              borderRadius: '12px',
              padding: '16px 40px',
              fontSize: '18px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'all 0.3s ease',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-4px) scale(1.05)';
              e.target.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0) scale(1)';
              e.target.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.2)';
            }}
          >
            <Sparkles className="w-5 h-5" />
            {ctaText}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Trust indicators */}
        <div
          style={{
            marginTop: '48px',
            display: 'flex',
            justifyContent: 'center',
            gap: '40px',
            flexWrap: 'wrap',
            opacity: 0.9,
          }}
        >
          <div style={{ color: 'white', fontSize: '14px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>10,000+</div>
            <div style={{ opacity: 0.8 }}>Active Users</div>
          </div>
          <div style={{ color: 'white', fontSize: '14px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>95%</div>
            <div style={{ opacity: 0.8 }}>Accuracy Rate</div>
          </div>
          <div style={{ color: 'white', fontSize: '14px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>50%</div>
            <div style={{ opacity: 0.8 }}>Faster Service</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AnimatedHeroSection;
