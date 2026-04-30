import { useState, useEffect } from 'react';
import { useAnimation } from '../hooks/useAnimation';
import { QrCode, X, Sparkles, TrendingUp, CheckCircle, ArrowRight, Smartphone, Users, Clock, Zap } from 'lucide-react';

/**
 * QR Promotional Banner Component
 * 
 * Displays animated banner promoting QR ordering system on Tables page
 * Features rotating benefit highlights, animated "How It Works" steps
 * Banner is always visible to promote QR ordering adoption
 * 
 * Requirements: 1.1, 1.2, 5.1
 */
const QRPromotionalBanner = ({ onEnableClick, variant = 'full' }) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [currentBenefitIndex, setCurrentBenefitIndex] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  
  const animation = useAnimation({ type: 'slide', direction: 'down', duration: 500 });

  const benefits = [
    { icon: <Sparkles className="w-5 h-5" />, text: 'Contactless ordering for safer dining', color: '#f59e0b' },
    { icon: <TrendingUp className="w-5 h-5" />, text: '50% faster service, happier customers', color: '#10b981' },
    { icon: <CheckCircle className="w-5 h-5" />, text: 'Reduce order errors by 95%', color: '#3b82f6' },
    { icon: <Zap className="w-5 h-5" />, text: 'No app download required for customers', color: '#8b5cf6' },
  ];

  const howItWorksSteps = [
    { 
      step: '1', 
      icon: <QrCode className="w-6 h-6" />, 
      title: 'Generate QR Codes', 
      description: 'Create unique QR codes for each table',
      color: '#667eea'
    },
    { 
      step: '2', 
      icon: <Smartphone className="w-6 h-6" />, 
      title: 'Customer Scans', 
      description: 'Customers scan with their phone camera',
      color: '#10b981'
    },
    { 
      step: '3', 
      icon: <Users className="w-6 h-6" />, 
      title: 'Browse & Order', 
      description: 'View menu and place orders instantly',
      color: '#f59e0b'
    },
    { 
      step: '4', 
      icon: <Clock className="w-6 h-6" />, 
      title: 'Kitchen Receives', 
      description: 'Orders appear in your kitchen instantly',
      color: '#ef4444'
    },
  ];

  useEffect(() => {
    // Check if banner was dismissed (kept for future use)
    const dismissed = localStorage.getItem('qr-banner-dismissed');
    if (dismissed) {
      setIsDismissed(true);
    }
    // Trigger entrance animation
    animation.trigger();
  }, [animation]);

  useEffect(() => {
    // Rotate benefits every 2.5 seconds (faster!)
    const interval = setInterval(() => {
      setCurrentBenefitIndex((prev) => (prev + 1) % benefits.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Rotate "How It Works" steps every 2 seconds (faster!)
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev + 1) % howItWorksSteps.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('qr-banner-dismissed', 'true');
    setIsDismissed(true);
  };

  // Banner is always visible - removed conditions
  // if (isDismissed || isQREnabled) return null;

  const isCompact = variant === 'compact';
  const currentBenefit = benefits[currentBenefitIndex];
  const currentStep = howItWorksSteps[currentStepIndex];

  return (
    <div style={animation.style}>
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '16px',
          padding: isCompact ? '20px' : '32px',
          marginBottom: '24px',
          position: 'relative',
          boxShadow: '0 20px 50px rgba(102, 126, 234, 0.3)',
          overflow: 'hidden',
        }}
      >
        {/* Background decoration with multiple floating orbs */}
        <div
          style={{
            position: 'absolute',
            top: '-50%',
            right: '-10%',
            width: '400px',
            height: '400px',
            background: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '50%',
            filter: 'blur(80px)',
            animation: 'float 4s ease-in-out infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-30%',
            left: '-5%',
            width: '300px',
            height: '300px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            filter: 'blur(60px)',
            animation: 'float 5s ease-in-out infinite reverse',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '30%',
            width: '200px',
            height: '200px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '50%',
            filter: 'blur(50px)',
            animation: 'float 6s ease-in-out infinite',
            animationDelay: '1s',
          }}
        />

        {/* Animated sparkles - MORE AND FASTER */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.3 }}>
          {[...Array(25)].map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: `${3 + Math.random() * 4}px`,
                height: `${3 + Math.random() * 4}px`,
                background: 'white',
                borderRadius: '50%',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `twinkle ${1 + Math.random() * 2}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
                boxShadow: '0 0 10px rgba(255, 255, 255, 0.8)',
              }}
            />
          ))}
        </div>

        {/* Shooting stars effect */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.4 }}>
          {[...Array(3)].map((_, i) => (
            <div
              key={`star-${i}`}
              style={{
                position: 'absolute',
                width: '2px',
                height: '2px',
                background: 'white',
                borderRadius: '50%',
                left: `${20 + i * 30}%`,
                top: '10%',
                animation: `shootingStar ${3 + i}s ease-in-out infinite`,
                animationDelay: `${i * 1.5}s`,
                boxShadow: '0 0 20px rgba(255, 255, 255, 1)',
              }}
            />
          ))}
        </div>

        {/* Close button */}
        <button
          onClick={handleDismiss}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            zIndex: 10,
            backdropFilter: 'blur(10px)',
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.3)';
            e.target.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.2)';
            e.target.style.transform = 'scale(1)';
          }}
        >
          <X className="w-4 h-4 text-white" />
        </button>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isCompact ? '1fr' : 'auto 1fr auto', 
          gap: isCompact ? '20px' : '32px', 
          alignItems: 'center',
          position: 'relative' 
        }}>
          {/* QR Icon with intense pulse and glow animation */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.25)',
              borderRadius: '20px',
              padding: isCompact ? '16px' : '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'intensePulse 1.5s ease-in-out infinite',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), 0 0 40px rgba(255, 255, 255, 0.3)',
              position: 'relative',
            }}
          >
            <QrCode className={`text-white ${isCompact ? 'w-12 h-12' : 'w-16 h-16'}`} style={{ animation: 'spin 3s linear infinite' }} />
            {/* Glow rings */}
            <div style={{
              position: 'absolute',
              inset: '-10px',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '24px',
              animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
            }} />
            <div style={{
              position: 'absolute',
              inset: '-20px',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '28px',
              animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
              animationDelay: '0.5s',
            }} />
          </div>

          {/* Main Content */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <h3
                style={{
                  color: 'white',
                  fontSize: isCompact ? '20px' : '28px',
                  fontWeight: 'bold',
                  margin: 0,
                }}
              >
                Enable QR Code Ordering
              </h3>
              <div
                style={{
                  background: 'linear-gradient(135deg, #fbbf24, #f59e0b, #fbbf24)',
                  backgroundSize: '200% 200%',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'white',
                  animation: 'shimmer 2s ease-in-out infinite, bounce 1s ease-in-out infinite',
                  boxShadow: '0 4px 15px rgba(251, 191, 36, 0.5)',
                }}
              >
                🔥 POPULAR
              </div>
            </div>

            {/* Rotating benefits */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: 'rgba(255, 255, 255, 0.95)',
                fontSize: isCompact ? '15px' : '18px',
                minHeight: '28px',
                marginBottom: '16px',
              }}
            >
              <div 
                style={{ 
                  color: currentBenefit.color,
                  transition: 'color 0.5s ease',
                }}
              >
                {currentBenefit.icon}
              </div>
              <span
                key={currentBenefitIndex}
                style={{
                  animation: 'slideInFade 0.5s ease-in-out',
                  fontWeight: '500',
                }}
              >
                {currentBenefit.text}
              </span>
            </div>

            {/* Animated "How It Works" Section */}
            {!isCompact && (
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: '16px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}>
                <div style={{ 
                  fontSize: '12px', 
                  color: 'rgba(255, 255, 255, 0.8)', 
                  marginBottom: '12px',
                  fontWeight: '600',
                  letterSpacing: '0.5px',
                }}>
                  HOW IT WORKS
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {/* Animated step indicator */}
                  <div
                    key={currentStepIndex}
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: currentStep.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '20px',
                      fontWeight: 'bold',
                      boxShadow: `0 8px 24px ${currentStep.color}60`,
                      animation: 'scaleIn 0.5s ease-in-out',
                      transition: 'all 0.5s ease',
                    }}
                  >
                    {currentStep.icon}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div 
                      key={`title-${currentStepIndex}`}
                      style={{ 
                        color: 'white', 
                        fontSize: '16px', 
                        fontWeight: '600',
                        marginBottom: '4px',
                        animation: 'slideInFade 0.5s ease-in-out',
                      }}
                    >
                      Step {currentStep.step}: {currentStep.title}
                    </div>
                    <div 
                      key={`desc-${currentStepIndex}`}
                      style={{ 
                        color: 'rgba(255, 255, 255, 0.8)', 
                        fontSize: '14px',
                        animation: 'slideInFade 0.5s ease-in-out 0.1s backwards',
                      }}
                    >
                      {currentStep.description}
                    </div>
                  </div>
                </div>

                {/* Progress dots */}
                <div style={{ 
                  display: 'flex', 
                  gap: '6px', 
                  marginTop: '12px',
                  justifyContent: 'center',
                }}>
                  {howItWorksSteps.map((_, index) => (
                    <div
                      key={index}
                      style={{
                        width: index === currentStepIndex ? '24px' : '6px',
                        height: '6px',
                        borderRadius: '3px',
                        background: index === currentStepIndex 
                          ? 'white' 
                          : 'rgba(255, 255, 255, 0.4)',
                        transition: 'all 0.3s ease',
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* CTA Button with intense animations */}
          <button
            onClick={onEnableClick}
            style={{
              background: 'linear-gradient(135deg, #ffffff, #f0f0f0, #ffffff)',
              backgroundSize: '200% 200%',
              color: '#667eea',
              border: 'none',
              borderRadius: '12px',
              padding: isCompact ? '12px 24px' : '16px 32px',
              fontSize: isCompact ? '15px' : '18px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2), 0 0 30px rgba(255, 255, 255, 0.5)',
              whiteSpace: 'nowrap',
              animation: 'shimmer 3s ease-in-out infinite, buttonPulse 2s ease-in-out infinite',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-4px) scale(1.05)';
              e.target.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.3), 0 0 50px rgba(255, 255, 255, 0.8)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0) scale(1)';
              e.target.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.2), 0 0 30px rgba(255, 255, 255, 0.5)';
            }}
          >
            {/* Button shine effect */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent)',
              animation: 'shine 3s ease-in-out infinite',
            }} />
            <span style={{ position: 'relative', zIndex: 1 }}>Enable Now</span>
            <ArrowRight className="w-5 h-5" style={{ animation: 'slideRight 1s ease-in-out infinite' }} />
          </button>
        </div>

        {/* CSS animations */}
        <style>{`
          @keyframes intensePulse {
            0%, 100% { transform: scale(1); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1), 0 0 40px rgba(255, 255, 255, 0.3); }
            50% { transform: scale(1.1); box-shadow: 0 12px 48px rgba(0, 0, 0, 0.2), 0 0 60px rgba(255, 255, 255, 0.6); }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          @keyframes slideInFade {
            from { opacity: 0; transform: translateX(-20px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.7) rotate(-5deg); }
            to { opacity: 1; transform: scale(1) rotate(0deg); }
          }
          @keyframes float {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            33% { transform: translate(30px, -30px) rotate(5deg); }
            66% { transform: translate(-20px, 20px) rotate(-5deg); }
          }
          @keyframes twinkle {
            0%, 100% { opacity: 0.2; transform: scale(1); }
            50% { opacity: 1; transform: scale(2); }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes ping {
            75%, 100% {
              transform: scale(1.5);
              opacity: 0;
            }
          }
          @keyframes shimmer {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
          }
          @keyframes buttonPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.02); }
          }
          @keyframes shine {
            0% { left: -100%; }
            50%, 100% { left: 200%; }
          }
          @keyframes slideRight {
            0%, 100% { transform: translateX(0); }
            50% { transform: translateX(5px); }
          }
          @keyframes shootingStar {
            0% {
              transform: translate(0, 0);
              opacity: 0;
            }
            10% {
              opacity: 1;
            }
            90% {
              opacity: 1;
            }
            100% {
              transform: translate(300px, 300px);
              opacity: 0;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default QRPromotionalBanner;
