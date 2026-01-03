import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Utensils, ChefHat, BarChart3, Smartphone,
  CheckCircle, ArrowRight, Star, Users,
  Zap, Shield, Clock, IndianRupee
} from 'lucide-react';

const PWAHomePage = () => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      // User is logged in, redirect to dashboard
      navigate('/dashboard', { replace: true });
      return;
    }
    setIsChecking(false);
  }, [navigate]);

  // Show loading while checking auth
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-violet-700 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Utensils className="w-8 h-8 text-white" />
          </div>
          <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  const features = [
    { icon: ChefHat, title: 'Smart KOT', desc: 'Kitchen order tickets' },
    { icon: BarChart3, title: 'Reports', desc: 'Sales analytics' },
    { icon: Clock, title: 'Fast Billing', desc: 'Quick checkout' },
    { icon: Shield, title: 'Secure', desc: 'Data protection' },
  ];

  const benefits = [
    'Free 14-day trial',
    'No credit card required',
    'Cancel anytime',
    'WhatsApp support',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-violet-700">
      {/* Header */}
      <div className="px-6 pt-12 pb-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <Utensils className="w-6 h-6 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">BillByteKOT</h1>
            <p className="text-white/70 text-sm">Restaurant Billing & KOT</p>
          </div>
        </div>

        {/* Hero */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white leading-tight mb-3">
            Manage Your Restaurant
            <span className="block text-yellow-300">Like a Pro</span>
          </h2>
          <p className="text-white/80 text-base">
            Complete billing, KOT system, inventory & reports in one app
          </p>
        </div>

        {/* Rating Badge */}
        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-full mb-6">
          <div className="flex">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            ))}
          </div>
          <span className="text-white text-sm font-medium">500+ Restaurants</span>
        </div>
      </div>

      {/* Features Grid */}
      <div className="px-6 mb-8">
        <div className="grid grid-cols-2 gap-3">
          {features.map((f, i) => (
            <div key={i} className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-2">
                <f.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-white font-semibold text-sm">{f.title}</p>
              <p className="text-white/60 text-xs">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="px-6 pb-8">
        <div className="bg-white rounded-3xl p-6 shadow-2xl">
          {/* Price Badge */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-gray-400 line-through text-lg">₹1999</span>
            <span className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold">
              Starting ₹499/year
            </span>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-gray-600 text-xs">{b}</span>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <button
            onClick={() => navigate('/login?signup=true')}
            className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg mb-3 flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-transform"
          >
            Start Free Trial
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={() => navigate('/login')}
            className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-98 transition-transform"
          >
            Already have an account? Login
          </button>

          {/* Trust Badge */}
          <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-1 text-gray-500 text-xs">
              <Shield className="w-4 h-4" />
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-1 text-gray-500 text-xs">
              <Zap className="w-4 h-4" />
              <span>Fast Setup</span>
            </div>
            <div className="flex items-center gap-1 text-gray-500 text-xs">
              <Users className="w-4 h-4" />
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Info */}
      <div className="px-6 pb-8 text-center">
        <p className="text-white/60 text-xs">
          By continuing, you agree to our Terms of Service & Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default PWAHomePage;
