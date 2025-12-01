import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setAuthToken } from '../App';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { ChefHat, Phone, Lock, Sparkles } from 'lucide-react';
import OTPLogin from '../components/OTPLogin';
import GuidedDemo from '../components/GuidedDemo';

const LoginPage = ({ setUser }) => {
  const [loginMethod, setLoginMethod] = useState('otp'); // otp or password
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [tempUser, setTempUser] = useState(null);
  const navigate = useNavigate();

  const handleLoginSuccess = (user) => {
    setTempUser(user);
    
    // Show onboarding for new users
    if (!user.onboarding_completed) {
      setShowOnboarding(true);
    } else {
      completeLogin(user);
    }
  };

  const completeLogin = (user) => {
    setAuthToken(localStorage.getItem('token'));
    setUser(user);
    toast.success('Welcome to BillByteKOT!');
    
    if (user.role === 'admin' && !user.setup_completed) {
      navigate('/setup');
    } else {
      navigate('/dashboard');
    }
  };

  const handleOnboardingComplete = async () => {
    // Mark onboarding as completed
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.REACT_APP_API_URL || 'https://restro-ai.onrender.com'}/api/users/me/onboarding`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ onboarding_completed: true })
      });
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
      {/* Animated background elements */}
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

          <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm">Free Trial</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <Lock className="w-4 h-4" />
              <span className="text-sm">Secure</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <Phone className="w-4 h-4" />
              <span className="text-sm">24/7 Support</span>
            </div>
          </div>
        </div>

        {/* Right side - Login */}
        <div>
          {loginMethod === 'otp' ? (
            <OTPLogin onLoginSuccess={handleLoginSuccess} />
          ) : (
            <Card className="border-0 shadow-2xl">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Password Login</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-gray-600">
                  Password login coming soon. Use OTP login for now.
                </p>
                <Button 
                  onClick={() => setLoginMethod('otp')}
                  className="w-full mt-4 bg-gradient-to-r from-violet-600 to-purple-600"
                >
                  Back to OTP Login
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="text-center mt-4 text-white text-sm">
            <p>
              Don't have an account? OTP login will auto-register you!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
