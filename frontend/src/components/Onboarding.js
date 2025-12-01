import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { 
  ChefHat, ShoppingCart, Users, CreditCard, BarChart3, 
  MessageCircle, Printer, Settings, ArrowRight, X, Calendar,
  CheckCircle, Sparkles, Zap, TrendingUp, Clock
} from 'lucide-react';

const Onboarding = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const features = [
    {
      icon: ShoppingCart,
      title: 'Smart Order Management',
      description: 'Take orders quickly with our intuitive POS system. Track order status in real-time from kitchen to table.',
      color: 'from-blue-500 to-cyan-500',
      benefits: ['Quick order entry', 'Real-time tracking', 'Kitchen display system']
    },
    {
      icon: Users,
      title: 'Table & Customer Management',
      description: 'Manage tables, track occupancy, and build customer relationships with order history.',
      color: 'from-purple-500 to-pink-500',
      benefits: ['Table status tracking', 'Customer profiles', 'Order history']
    },
    {
      icon: CreditCard,
      title: 'Multiple Payment Options',
      description: 'Accept cash, cards, UPI, and online payments. Integrated with Razorpay for seamless transactions.',
      color: 'from-green-500 to-emerald-500',
      benefits: ['Cash & Card', 'UPI payments', 'Split bills']
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp Integration',
      description: 'Send order updates, receipts, and promotional messages directly to customers via WhatsApp.',
      color: 'from-green-600 to-teal-600',
      benefits: ['Auto notifications', 'Bulk messaging', 'Receipt sharing']
    },
    {
      icon: BarChart3,
      title: 'Analytics & Reports',
      description: 'Track sales, popular items, peak hours, and revenue with beautiful charts and insights.',
      color: 'from-orange-500 to-red-500',
      benefits: ['Sales reports', 'Top items', 'Revenue tracking']
    },
    {
      icon: Printer,
      title: 'Thermal Printing',
      description: 'Print receipts and KOT (Kitchen Order Tickets) on thermal printers. Multiple format options.',
      color: 'from-gray-600 to-slate-700',
      benefits: ['Receipt printing', 'KOT printing', 'Custom formats']
    }
  ];

  const handleNext = () => {
    if (currentStep < features.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentFeature = features[currentStep];
  const Icon = currentFeature.icon;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-0 shadow-2xl relative overflow-hidden">
        {/* Skip button */}
        <button
          onClick={onSkip}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Progress bar */}
        <div className="h-1 bg-gray-200">
          <div 
            className="h-full bg-gradient-to-r from-violet-600 to-purple-600 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / features.length) * 100}%` }}
          />
        </div>

        <CardContent className="p-8">
          {/* Welcome screen */}
          {currentStep === 0 && (
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-violet-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-2">Welcome to RestoBill! 🎉</h2>
              <p className="text-gray-600">Let's take a quick tour of your new restaurant management system</p>
            </div>
          )}

          {/* Feature showcase */}
          <div className="flex flex-col items-center">
            <div className={`w-24 h-24 bg-gradient-to-br ${currentFeature.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}>
              <Icon className="w-12 h-12 text-white" />
            </div>

            <h3 className="text-2xl font-bold mb-3 text-center">{currentFeature.title}</h3>
            <p className="text-gray-600 text-center mb-6 max-w-md">{currentFeature.description}</p>

            {/* Benefits */}
            <div className="grid grid-cols-1 gap-3 w-full max-w-md mb-6">
              {currentFeature.benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm font-medium">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <div className="flex gap-2">
              {features.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all ${
                    index === currentStep ? 'w-8 bg-violet-600' : 'w-2 bg-gray-300'
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-3">
              {currentStep > 0 && (
                <Button variant="outline" onClick={handlePrevious}>
                  Previous
                </Button>
              )}
              <Button onClick={handleNext} className="bg-gradient-to-r from-violet-600 to-purple-600">
                {currentStep === features.length - 1 ? (
                  <>
                    Get Started <Zap className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    Next <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Book demo link */}
          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-sm text-gray-600 mb-3">Need help getting started?</p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open('https://calendly.com/finverge/restobill-demo', '_blank')}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Book a Free Demo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
