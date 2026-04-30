import React, { useEffect, useState } from 'react';
import { useScrollTrigger } from '../hooks/useScrollTrigger';
import { useAnimation } from '../hooks/useAnimation';
import { ChevronDown, ChevronUp } from 'lucide-react';

/**
 * QR Feature Card Component
 * 
 * Individual feature card with scroll-triggered entrance animation
 * Includes hover effects and expandable details
 * 
 * Requirements: 2.3, 5.3, 5.4
 */
const QRFeatureCard = ({ feature, index, onLearnMore }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Scroll trigger with stagger delay based on index
  const scrollTrigger = useScrollTrigger({
    threshold: 0.2,
    staggerDelay: 100,
    staggerIndex: index,
    triggerOnce: true,
  });

  // Animation triggered by scroll
  const animation = useAnimation({
    type: 'slide',
    direction: 'up',
    duration: 500,
  });

  useEffect(() => {
    if (scrollTrigger.isVisible && !animation.hasAnimated) {
      animation.trigger();
    }
  }, [scrollTrigger.isVisible]);

  const IconComponent = feature.icon;

  return (
    <div ref={scrollTrigger.ref} style={animation.style}>
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: isHovered
            ? '0 20px 40px rgba(0, 0, 0, 0.15)'
            : '0 4px 12px rgba(0, 0, 0, 0.08)',
          transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          border: '1px solid rgba(0, 0, 0, 0.05)',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Icon with animation on hover */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            transform: isHovered ? 'rotate(5deg) scale(1.1)' : 'rotate(0) scale(1)',
            transition: 'transform 0.3s ease',
          }}
        >
          {IconComponent && <IconComponent className="w-8 h-8 text-white" />}
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#1a202c',
            marginBottom: '12px',
          }}
        >
          {feature.title}
        </h3>

        {/* Description */}
        <p
          style={{
            fontSize: '16px',
            color: '#4a5568',
            lineHeight: '1.6',
            marginBottom: '16px',
          }}
        >
          {feature.description}
        </p>

        {/* Benefits list */}
        {feature.benefits && feature.benefits.length > 0 && (
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: '16px 0',
            }}
          >
            {feature.benefits.slice(0, isExpanded ? undefined : 3).map((benefit, idx) => (
              <li
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                  fontSize: '14px',
                  color: '#718096',
                }}
              >
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#667eea',
                  }}
                />
                {benefit}
              </li>
            ))}
          </ul>
        )}

        {/* Expandable details */}
        {feature.detailedInfo && (
          <div
            style={{
              maxHeight: isExpanded ? '500px' : '0',
              overflow: 'hidden',
              transition: 'max-height 0.3s ease',
            }}
          >
            <div
              style={{
                marginTop: '16px',
                padding: '16px',
                background: '#f7fafc',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#4a5568',
                lineHeight: '1.6',
              }}
            >
              {feature.detailedInfo}
            </div>
          </div>
        )}

        {/* Case study */}
        {feature.caseStudy && isExpanded && (
          <div
            style={{
              marginTop: '16px',
              padding: '16px',
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
              borderRadius: '8px',
              borderLeft: '4px solid #667eea',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#667eea', marginBottom: '8px' }}>
              SUCCESS STORY
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a202c', marginBottom: '4px' }}>
              {feature.caseStudy.restaurantName}
            </div>
            <div style={{ fontSize: '14px', color: '#4a5568', marginBottom: '8px' }}>
              {feature.caseStudy.improvement}
            </div>
            <div style={{ fontSize: '13px', color: '#718096', fontStyle: 'italic' }}>
              "{feature.caseStudy.testimonial}"
            </div>
          </div>
        )}

        {/* Expand/Collapse button */}
        {(feature.detailedInfo || feature.caseStudy) && (
          <button
            style={{
              marginTop: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'none',
              border: 'none',
              color: '#667eea',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              padding: '8px 0',
            }}
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
              if (onLearnMore) onLearnMore(feature);
            }}
          >
            {isExpanded ? (
              <>
                Show Less <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                Learn More <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default QRFeatureCard;
