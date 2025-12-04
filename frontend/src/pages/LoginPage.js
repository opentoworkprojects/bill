import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API, setAuthToken } from '../App';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { ChefHat, Mail, Lock, User } from 'lucide-react';
import GuidedDemo from '../components/GuidedDemo';

const LoginPage = ({ setUser }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [tempUser, setTempUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const response = await axios.post(`${API}/auth/login`, {
          username: formData.username,
          password: formData.password
        });
        
        const { token, access_token, user } = response.data;
        const authToken = token || access_token;
        setAuthToken(authToken);
        localStorage.setItem('user', JSON.stringify(user));
        
        setTempUser(user);
        
        // Show onboarding ONLY for first-time users
        if (user.onboarding_completed === false) {
          setShowOnboarding(true);
        } else {
          completeLogin(user);
        }
      } else {
        // Register
        const response = await axios.post(`${API}/auth/register`, {
          username: formData.username,
          email: formData.email,
          password: formData.password
        });
        
        const { token, access_token, user } = response.data;
        const authToken = token || access_token;
        setAuthToken(authToken);
        localStorage.setItem('user', JSON.stringify(user));
        
        setTempUser(user);
        // Show onboarding for new registrations (first time only)
        setShowOnboarding(true);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const completeLogin = (user) => {
    setUser(user);
    toast.success('Welcome to BillByteKOT!');
    
    if (user.role === 'admin' && !user.setup_completed) {
      navigate('/setup');
    } else {
      navigate('/dashboard');
    }
  };

  const handleOnboardingComplete = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/users/me/onboarding`, 
        { onboarding_completed: true },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Failed to update onboarding status');
    }
    
    setShowOnboarding(false);
    completeLogin(tempUser);
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
    completeLogin(tempUser);
  };

  if (showOnboarding) {
    return (
      <GuidedDemo 
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="text-white space-y-6 text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start gap-3">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center">
              <ChefHat className="w-10 h-10 text-violet-600" />
            </div>
            <h1 className="text-4xl font-bold">BillByteKOT</h1>
          </div>
          
          <h2 className="text-3xl lg:text-4xl font-bold leading-tight">
            Modern Restaurant Management Made Simple
          </h2>
          
          <p className="text-lg text-white/90">
            Complete POS system with order management, billing, analytics, and WhatsApp integration.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-3xl font-bold mb-1">10K+</div>
              <div className="text-sm text-white/80">Orders Processed</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-3xl font-bold mb-1">500+</div>
              <div className="text-sm text-white/80">Restaurants</div>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <Card className="border-0 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{isLogin ? 'Welcome Back!' : 'Create Account'}</CardTitle>
            <CardDescription>
              {isLogin ? 'Login to your account' : 'Sign up to get started'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="username"
                    placeholder="Enter username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                disabled={loading}
              >
                {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Register')}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  className="text-sm text-violet-600 hover:underline"
                  onClick={() => setIsLogin(!isLogin)}
                >
                  {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
