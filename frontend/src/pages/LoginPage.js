import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { API, setAuthToken } from '../App';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { 
  ChefHat, Mail, Lock, User, Eye, EyeOff, ArrowRight, Sparkles,
  Shield, Zap, BarChart3, MessageCircle,
  CheckCircle, Star, TrendingUp, Users, Clock, CreditCard
} from 'lucide-react';
import GuidedDemo from '../components/GuidedDemo';

const LoginPage = ({ setUser }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [tempUser, setTempUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const navigate = useNavigate();

  // Rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    { icon: Zap, title: 'Lightning Fast', desc: 'Process orders in seconds', color: 'from-yellow-400 to-orange-500' },
    { icon: BarChart3, title: 'Smart Analytics', desc: 'Real-time insights', color: 'from-blue-400 to-cyan-500' },
    { icon: MessageCircle, title: 'WhatsApp Integration', desc: 'Auto customer updates', color: 'from-green-400 to-emerald-500' },
    { icon: Shield, title: 'Secure & Reliable', desc: 'Cloud-based system', color: 'from-purple-400 to-pink-500' },
  ];

  const stats = [
    { value: 'Free', label: '7-Day Trial', icon: TrendingUp },
    { value: '24/7', label: 'Support', icon: Users },
    { value: 'Cloud', label: 'Based', icon: Clock },
    { value: '₹0', label: 'Setup Fee', icon: CreditCard },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        let response;
        let isTeamMember = false;
        
        try {
          response = await axios.post(`${API}/auth/login`, {
            username: formData.username,
            password: formData.password
          });
        } catch (userLoginError) {
          if (userLoginError.response?.status === 401) {
            try {
              response = await axios.post(`${API}/team/login`, {
                username: formData.username,
                password: formData.password
              });
              isTeamMember = true;
            } catch {
              throw userLoginError;
            }
          } else {
            throw userLoginError;
          }
        }
        
        const { token, access_token, user } = response.data;
        const authToken = token || access_token;
        const userData = { ...user, isTeamMember };
        setAuthToken(authToken, userData);
        setTempUser(userData);
        
        if (isTeamMember) {
          completeLogin(userData);
        } else if (user.onboarding_completed === false) {
          setShowOnboarding(true);
        } else {
          completeLogin(userData);
        }
      } else {
        await axios.post(`${API}/auth/register`, {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: 'admin'
        });
        
        toast.success('🎉 Account created! Please login.');
        setIsLogin(true);
        setFormData({ ...formData, password: '' });
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const completeLogin = (user) => {
    setUser(user);
    toast.success(`Welcome back, ${user.username}! 🚀`);
    navigate(user.role === 'admin' && !user.setup_completed ? '/setup' : '/dashboard');
  };

  const handleOnboardingComplete = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/users/me/onboarding`, 
        { onboarding_completed: true },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
    } catch {
      console.error('Failed to update onboarding status');
    }
    setShowOnboarding(false);
    completeLogin(tempUser);
  };

  if (showOnboarding) {
    return (
      <GuidedDemo 
        onComplete={handleOnboardingComplete}
        onSkip={() => { setShowOnboarding(false); completeLogin(tempUser); }}
      />
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600">
          <div className="absolute inset-0 opacity-30 bg-grid-pattern"></div>
          
          {/* Floating Orbs */}
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-8 xl:p-12 w-full">
          {/* Logo & Brand */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-black/20">
                <ChefHat className="w-8 h-8 text-violet-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">BillByteKOT</h1>
                <p className="text-white/70 text-sm">Restaurant Management System</p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
                Transform Your
                <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                  Restaurant Business
                </span>
              </h2>
              <p className="text-lg text-white/80 max-w-md">
                All-in-one POS system with KOT management, billing, inventory tracking, and real-time analytics.
              </p>
            </div>

            {/* Animated Feature Cards */}
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl backdrop-blur-sm transition-all duration-500 ${
                    activeFeature === idx 
                      ? 'bg-white/20 scale-105 shadow-xl' 
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-3`}>
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                  <p className="text-sm text-white/70">{feature.desc}</p>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="flex gap-6 pt-4">
              {stats.map((stat, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-2xl xl:text-3xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-white/60">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                R
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-white/90 text-sm leading-relaxed">
                  "BillByteKOT transformed our restaurant operations. Orders are faster, billing is seamless, and the WhatsApp integration keeps our customers happy!"
                </p>
                <p className="text-white/60 text-sm mt-2">— Rajesh Kumar, Spice Garden Restaurant</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-6 sm:p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl flex items-center justify-center">
              <ChefHat className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              BillByteKOT
            </h1>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-50 rounded-full text-violet-600 text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4" />
                {isLogin ? '7 Days Free Trial' : 'Start Free Today'}
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {isLogin ? 'Welcome Back!' : 'Create Account'}
              </h2>
              <p className="text-gray-500 mt-2">
                {isLogin ? 'Enter your credentials to continue' : 'Join thousands of restaurants'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                  Username or Email
                </Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-gray-400 group-focus-within:text-violet-500 transition-colors" />
                  </div>
                  <Input
                    id="username"
                    placeholder="Enter your username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="pl-12 h-12 rounded-xl border-gray-200 focus:border-violet-500 focus:ring-violet-500 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Email (Register only) */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address
                  </Label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="w-5 h-5 text-gray-400 group-focus-within:text-violet-500 transition-colors" />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@restaurant.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-12 h-12 rounded-xl border-gray-200 focus:border-violet-500 focus:ring-violet-500 transition-all"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  {isLogin && (
                    <Link 
                      to="/forgot-password" 
                      className="text-sm text-violet-600 hover:text-violet-700 font-medium"
                    >
                      Forgot?
                    </Link>
                  )}
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-400 group-focus-within:text-violet-500 transition-colors" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-12 pr-12 h-12 rounded-xl border-gray-200 focus:border-violet-500 focus:ring-violet-500 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold shadow-lg shadow-violet-500/30 hover:shadow-violet-500/40 transition-all group"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Please wait...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </Button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">or</span>
                </div>
              </div>

              {/* Toggle Login/Register */}
              <div className="text-center">
                <p className="text-gray-600">
                  {isLogin ? "Don't have an account?" : 'Already have an account?'}
                  <button
                    type="button"
                    className="ml-2 text-violet-600 hover:text-violet-700 font-semibold"
                    onClick={() => setIsLogin(!isLogin)}
                  >
                    {isLogin ? 'Sign Up Free' : 'Sign In'}
                  </button>
                </p>
              </div>
            </form>

            {/* Features List */}
            {!isLogin && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-3">What you'll get:</p>
                <div className="grid grid-cols-2 gap-2">
                  {['7-day free trial', 'No credit card', 'Full features', '24/7 support'].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Links */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>
              By continuing, you agree to our{' '}
              <Link to="/privacy" className="text-violet-600 hover:underline">Terms</Link>
              {' '}and{' '}
              <Link to="/privacy" className="text-violet-600 hover:underline">Privacy Policy</Link>
            </p>
          </div>

          {/* Mobile Stats */}
          <div className="lg:hidden mt-8 grid grid-cols-4 gap-2">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center p-3 bg-white rounded-xl shadow-sm">
                <div className="text-lg font-bold text-violet-600">{stat.value}</div>
                <div className="text-[10px] text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
