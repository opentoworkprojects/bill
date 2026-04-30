import { useNavigate } from 'react-router-dom';
import AnimatedHeroSection from './AnimatedHeroSection';
import QRFeatureCard from './QRFeatureCard';
import AnimatedStatsCounter from './AnimatedStatsCounter';
import { QrCode, Zap, Shield, TrendingUp, CheckCircle, Clock, Users, Bot, BarChart3, Smartphone, Wifi } from 'lucide-react';

/**
 * QR Ordering Section for Landing Page
 * 
 * Complete section showcasing QR ordering features with animations
 * Includes hero, features, and statistics
 */
const QROrderingSection = () => {
  const navigate = useNavigate();

  // QR Features data
  const qrFeatures = [
    {
      id: 'contactless',
      title: 'Contactless Ordering',
      description: 'Let customers order safely and conveniently from their phones by scanning QR codes at tables',
      icon: QrCode,
      benefits: [
        'Reduce physical contact and improve safety',
        'Faster table turnover and service',
        'Improved customer satisfaction',
        'No app download required'
      ],
      detailedInfo: 'Customers simply scan the QR code at their table to view your full menu and place orders directly from their phones. Orders go straight to your kitchen, eliminating miscommunication.',
      caseStudy: {
        restaurantName: 'Cafe Delight Mumbai',
        improvement: '40% faster service, 25% higher table turnover',
        testimonial: 'Our customers love the convenience! We serve 30% more customers during peak hours.'
      }
    },
    {
      id: 'accuracy',
      title: 'Eliminate Order Errors',
      description: 'Say goodbye to miscommunication and mistakes with direct digital ordering',
      icon: Shield,
      benefits: [
        '95% reduction in order errors',
        'Direct kitchen communication',
        'Customer order confirmation',
        'Special requests captured accurately'
      ],
      detailedInfo: 'Orders go directly from customer phones to your kitchen display, eliminating the telephone game of verbal orders. Customers can review their order before submitting.',
      caseStudy: {
        restaurantName: 'Spice Garden Delhi',
        improvement: '95% accuracy improvement',
        testimonial: 'We went from 10-15 order mistakes per day to almost zero. Kitchen staff love it!'
      }
    },
    {
      id: 'efficiency',
      title: 'Boost Efficiency',
      description: 'Serve more customers in less time with streamlined digital ordering',
      icon: Zap,
      benefits: [
        '50% faster order processing',
        'Reduced staff workload',
        'Higher table turnover rate',
        'Real-time order tracking'
      ],
      detailedInfo: 'Free up your staff to focus on service and hospitality instead of taking orders. Process multiple orders simultaneously without bottlenecks.',
      caseStudy: {
        restaurantName: 'Urban Bistro Bangalore',
        improvement: '50% faster service, 35% more orders',
        testimonial: 'We handle lunch rush with half the stress. Staff can focus on making customers happy!'
      }
    },
    {
      id: 'insights',
      title: 'Customer Insights',
      description: 'Understand your customers better with detailed ordering analytics',
      icon: TrendingUp,
      benefits: [
        'Popular items tracking',
        'Peak hours analysis',
        'Customer preferences',
        'Menu optimization data'
      ],
      detailedInfo: 'Get detailed insights into what customers order, when they order, and how they browse your menu. Use data to optimize your offerings.',
    },
    {
      id: 'upsell',
      title: 'Smart Upselling',
      description: 'Increase average order value with intelligent recommendations',
      icon: CheckCircle,
      benefits: [
        'Automated combo suggestions',
        'Popular add-ons display',
        '20% higher average order value',
        'Seasonal promotions'
      ],
      detailedInfo: 'The system automatically suggests complementary items and popular combinations, increasing your revenue without pushy sales tactics.',
    },
    {
      id: 'multilingual',
      title: 'Multilingual Support',
      description: 'Serve diverse customers with menus in multiple languages',
      icon: Users,
      benefits: [
        'Hindi, English, and regional languages',
        'Automatic language detection',
        'Better customer experience',
        'Wider customer reach'
      ],
      detailedInfo: 'Customers can view your menu in their preferred language, making ordering easier for everyone and expanding your customer base.',
    }
  ];

  // Statistics data
  const stats = [
    { 
      label: 'Order Accuracy', 
      value: 95, 
      suffix: '%',
      description: 'Fewer mistakes'
    },
    { 
      label: 'Faster Service', 
      value: 50, 
      suffix: '%',
      description: 'Quicker orders'
    },
    { 
      label: 'Customer Rating', 
      value: 4.8, 
      suffix: '/5',
      description: 'Satisfaction score'
    },
    { 
      label: 'Active Restaurants', 
      value: 10000, 
      prefix: '',
      description: 'Using QR ordering'
    }
  ];

  return (
    <div className="qr-ordering-section">
      {/* Restaurant Automation Hero Section */}
      <section style={{ 
        padding: '100px 20px 80px', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Animated background elements */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.1 }}>
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: '4px',
                height: '4px',
                background: 'white',
                borderRadius: '50%',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 3}s`
              }}
            />
          ))}
        </div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 20px',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              borderRadius: '50px',
              marginBottom: '24px',
              animation: 'slideInDown 0.6s ease-out'
            }}>
              <Bot style={{ width: '20px', height: '20px' }} />
              <span style={{ fontSize: '14px', fontWeight: '600' }}>AI-Powered Restaurant Automation</span>
            </div>
            
            <h1 style={{ 
              fontSize: 'clamp(32px, 5vw, 56px)', 
              fontWeight: 'bold',
              marginBottom: '24px',
              lineHeight: '1.2',
              animation: 'slideInLeft 0.6s ease-out 0.2s backwards'
            }}>
              Automate Your Restaurant
              <br />
              <span style={{ 
                background: 'linear-gradient(to right, #fbbf24, #f59e0b)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                With Smart Technology
              </span>
            </h1>
            
            <p style={{ 
              fontSize: 'clamp(16px, 2vw, 20px)', 
              opacity: 0.95,
              maxWidth: '800px',
              margin: '0 auto 40px',
              lineHeight: '1.6',
              animation: 'fadeIn 0.6s ease-out 0.4s backwards'
            }}>
              From QR code ordering to AI-powered analytics, WhatsApp integration to automated billing - 
              streamline every aspect of your restaurant operations and boost efficiency by 50%
            </p>

            <div style={{ 
              display: 'flex', 
              gap: '16px', 
              justifyContent: 'center',
              flexWrap: 'wrap',
              animation: 'scaleIn 0.6s ease-out 0.6s backwards'
            }}>
              <button
                onClick={() => navigate('/signup')}
                style={{
                  background: 'white',
                  color: '#667eea',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '16px 32px',
                  fontSize: '18px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                <Zap style={{ width: '20px', height: '20px' }} />
                Start Free Trial
              </button>
              <button
                onClick={() => navigate('/login')}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  border: '2px solid white',
                  borderRadius: '12px',
                  padding: '16px 32px',
                  fontSize: '18px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'white';
                  e.target.style.color = '#667eea';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.color = 'white';
                }}
              >
                Watch Demo
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '24px',
            marginTop: '60px'
          }}>
            {[
              { icon: Users, value: '10,000+', label: 'Active Restaurants' },
              { icon: TrendingUp, value: '50%', label: 'Faster Service' },
              { icon: CheckCircle, value: '95%', label: 'Order Accuracy' },
              { icon: BarChart3, value: '24/7', label: 'AI Analytics' }
            ].map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div
                  key={index}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '16px',
                    padding: '24px',
                    textAlign: 'center',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    animation: `slideInUp 0.6s ease-out ${0.8 + index * 0.1}s backwards`
                  }}
                >
                  <IconComponent style={{ width: '32px', height: '32px', margin: '0 auto 12px' }} />
                  <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '4px' }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: '14px', opacity: 0.9 }}>
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Animated Hero Section - QR Ordering */}
      <AnimatedHeroSection
        title="Transform Your Restaurant with QR Code Ordering"
        subtitle="Enable contactless ordering, reduce errors by 95%, and serve customers 50% faster with our innovative QR code system. No app download required for customers!"
        ctaText="Start Free Trial"
        onCtaClick={() => navigate('/signup')}
      />

      {/* Features Section */}
      <section style={{ padding: '80px 20px', background: '#f7fafc' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ 
              fontSize: 'clamp(28px, 4vw, 42px)', 
              fontWeight: 'bold',
              marginBottom: '16px',
              color: '#1a202c'
            }}>
              Why Choose QR Code Ordering?
            </h2>
            <p style={{ 
              fontSize: 'clamp(16px, 2vw, 18px)', 
              color: '#718096',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Join thousands of restaurants already using QR code ordering to improve service and increase revenue
            </p>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '32px'
          }}>
            {qrFeatures.map((feature, index) => (
              <QRFeatureCard
                key={feature.id}
                feature={feature}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section style={{ padding: '80px 20px', background: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h2 style={{ 
              fontSize: 'clamp(28px, 4vw, 42px)', 
              fontWeight: 'bold',
              marginBottom: '16px',
              color: '#1a202c'
            }}>
              Proven Results
            </h2>
            <p style={{ 
              fontSize: 'clamp(16px, 2vw, 18px)', 
              color: '#718096',
              marginBottom: '60px'
            }}>
              Real data from restaurants using our QR ordering system
            </p>
          </div>
          <AnimatedStatsCounter stats={stats} duration={2000} />
        </div>
      </section>

      {/* Restaurant Automation Features Section */}
      <section style={{ padding: '80px 20px', background: 'linear-gradient(to bottom, #f7fafc, #edf2f7)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 20px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              borderRadius: '50px',
              marginBottom: '16px',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              <Bot style={{ width: '16px', height: '16px' }} />
              Complete Automation Suite
            </div>
            <h2 style={{ 
              fontSize: 'clamp(28px, 4vw, 42px)', 
              fontWeight: 'bold',
              marginBottom: '16px',
              color: '#1a202c'
            }}>
              Everything You Need to
              <span style={{ 
                display: 'block',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Automate Your Restaurant
              </span>
            </h2>
            <p style={{ 
              fontSize: 'clamp(16px, 2vw, 18px)', 
              color: '#718096',
              maxWidth: '700px',
              margin: '0 auto'
            }}>
              Integrated tools that work together seamlessly to save time, reduce costs, and improve customer experience
            </p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '32px'
          }}>
            {[
              {
                icon: Smartphone,
                title: 'WhatsApp Integration',
                description: 'Take orders directly through WhatsApp. Automated confirmations, updates, and customer communication.',
                benefits: ['Direct customer messaging', 'Order confirmations', 'Automated notifications', 'No extra app needed'],
                gradient: 'from-green-500 to-emerald-600'
              },
              {
                icon: Bot,
                title: 'AI-Powered Analytics',
                description: 'Smart insights powered by Gemini AI. Understand trends, predict demand, and optimize operations.',
                benefits: ['Sales predictions', 'Menu optimization', 'Staff scheduling', 'Inventory forecasting'],
                gradient: 'from-blue-500 to-indigo-600'
              },
              {
                icon: Zap,
                title: 'Automated Billing',
                description: 'Lightning-fast billing with thermal printer support. Generate bills in seconds, not minutes.',
                benefits: ['Instant bill generation', '6 printer themes', 'GST compliant', 'Split bill support'],
                gradient: 'from-violet-500 to-purple-600'
              },
              {
                icon: BarChart3,
                title: 'Real-Time Reports',
                description: 'Live dashboards with sales, inventory, and performance metrics. Make data-driven decisions instantly.',
                benefits: ['Live sales tracking', 'Inventory alerts', 'Staff performance', 'Profit analysis'],
                gradient: 'from-orange-500 to-red-600'
              },
              {
                icon: Wifi,
                title: 'Cloud Sync',
                description: 'Access your restaurant data from anywhere. Automatic backups and multi-device support.',
                benefits: ['Multi-device access', 'Automatic backups', 'Offline mode', 'Secure cloud storage'],
                gradient: 'from-cyan-500 to-blue-600'
              },
              {
                icon: Users,
                title: 'Staff Management',
                description: 'Manage roles, permissions, and track staff performance. Streamline team operations.',
                benefits: ['Role-based access', 'Attendance tracking', 'Performance metrics', 'Shift scheduling'],
                gradient: 'from-pink-500 to-rose-600'
              }
            ].map((feature, index) => (
              <div
                key={index}
                style={{
                  background: 'white',
                  borderRadius: '20px',
                  padding: '32px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                  border: '1px solid #e2e8f0'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.07)';
                }}
              >
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
                  backgroundImage: `linear-gradient(135deg, ${feature.gradient.includes('green') ? '#10b981, #059669' : 
                    feature.gradient.includes('blue') && feature.gradient.includes('indigo') ? '#3b82f6, #4f46e5' :
                    feature.gradient.includes('violet') ? '#8b5cf6, #7c3aed' :
                    feature.gradient.includes('orange') ? '#f97316, #dc2626' :
                    feature.gradient.includes('cyan') ? '#06b6d4, #3b82f6' :
                    '#ec4899, #f43f5e'})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)'
                }}>
                  <feature.icon style={{ width: '28px', height: '28px', color: 'white' }} />
                </div>
                
                <h3 style={{ 
                  fontSize: '20px', 
                  fontWeight: 'bold', 
                  marginBottom: '12px',
                  color: '#1a202c'
                }}>
                  {feature.title}
                </h3>
                
                <p style={{ 
                  fontSize: '14px', 
                  color: '#718096',
                  marginBottom: '20px',
                  lineHeight: '1.6'
                }}>
                  {feature.description}
                </p>

                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                  {feature.benefits.map((benefit, i) => (
                    <div key={i} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      marginBottom: '8px'
                    }}>
                      <CheckCircle style={{ width: '16px', height: '16px', color: '#10b981', flexShrink: 0 }} />
                      <span style={{ fontSize: '13px', color: '#4a5568' }}>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div style={{ 
            marginTop: '60px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '24px',
            padding: '48px 32px',
            textAlign: 'center',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', inset: 0, opacity: 0.1 }}>
              {[...Array(15)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    width: '3px',
                    height: '3px',
                    background: 'white',
                    borderRadius: '50%',
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animation: `float ${3 + Math.random() * 3}s ease-in-out infinite`,
                    animationDelay: `${Math.random() * 2}s`
                  }}
                />
              ))}
            </div>
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h3 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 'bold', marginBottom: '16px' }}>
                Ready to Automate Your Restaurant?
              </h3>
              <p style={{ fontSize: '18px', opacity: 0.95, marginBottom: '32px', maxWidth: '600px', margin: '0 auto 32px' }}>
                Join 10,000+ restaurants already using BillByteKOT to streamline operations and boost revenue
              </p>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => navigate('/signup')}
                  style={{
                    background: 'white',
                    color: '#667eea',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '16px 32px',
                    fontSize: '18px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  <Zap style={{ width: '20px', height: '20px' }} />
                  Start Free 7-Day Trial
                </button>
                <button
                  onClick={() => navigate('/login')}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    border: '2px solid white',
                    borderRadius: '12px',
                    padding: '16px 32px',
                    fontSize: '18px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'white';
                    e.target.style.color = '#667eea';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                    e.target.style.color = 'white';
                  }}
                >
                  Schedule Demo
                </button>
              </div>
              <p style={{ fontSize: '14px', opacity: 0.8, marginTop: '20px' }}>
                ✨ No credit card required • Cancel anytime • 24/7 support
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section style={{ 
        padding: '80px 20px', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ 
              fontSize: 'clamp(28px, 4vw, 42px)', 
              fontWeight: 'bold',
              marginBottom: '16px'
            }}>
              How It Works
            </h2>
            <p style={{ 
              fontSize: 'clamp(16px, 2vw, 18px)', 
              opacity: 0.9
            }}>
              Get started in minutes, no technical knowledge required
            </p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '32px'
          }}>
            {[
              {
                step: '1',
                title: 'Generate QR Codes',
                description: 'Create unique QR codes for each table in seconds',
                icon: QrCode
              },
              {
                step: '2',
                title: 'Print & Place',
                description: 'Print QR codes and place them on your tables',
                icon: CheckCircle
              },
              {
                step: '3',
                title: 'Customers Scan',
                description: 'Customers scan to view menu and place orders',
                icon: Users
              },
              {
                step: '4',
                title: 'Receive Orders',
                description: 'Orders appear instantly in your kitchen',
                icon: Clock
              }
            ].map((item, index) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={index}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '16px',
                    padding: '32px',
                    textAlign: 'center',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'white',
                    color: '#667eea',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    fontSize: '24px',
                    fontWeight: 'bold'
                  }}>
                    {item.step}
                  </div>
                  <IconComponent style={{ 
                    width: '40px', 
                    height: '40px', 
                    margin: '0 auto 16px',
                    display: 'block'
                  }} />
                  <h3 style={{ 
                    fontSize: '20px', 
                    fontWeight: 'bold', 
                    marginBottom: '12px' 
                  }}>
                    {item.title}
                  </h3>
                  <p style={{ 
                    fontSize: '14px', 
                    opacity: 0.9 
                  }}>
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div style={{ textAlign: 'center', marginTop: '60px' }}>
            <button
              onClick={() => navigate('/signup')}
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
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              Get Started Free
              <TrendingUp style={{ width: '20px', height: '20px' }} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default QROrderingSection;
