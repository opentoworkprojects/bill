import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { ChefHat, KeyRound, CheckCircle, Mail } from 'lucide-react';
import axios from 'axios';
import { API, setAuthToken } from '../App';
import ValidationAlert from '../components/ValidationAlert';

const VerifyEmailPage = ({ setUser }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  const username = location.state?.username || '';
  
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const errors = [];
    
    if (!otp || otp.trim() === '') {
      errors.push('OTP is required');
    } else if (otp.length !== 6) {
      errors.push('OTP must be 6 digits');
    }
    
    if (!email) {
      errors.push('Email is missing');
    }
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      setTimeout(() => setValidationErrors([]), 5000);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/verify-registration`, {
        email,
        otp
      });
      
      toast.success('Email verified! Registration complete!');
      
      // Auto-login after verification
      // The response contains the user object, but we need to login to get token
      setTimeout(() => {
        navigate('/login');
      }, 1500);
      
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error(error.response?.data?.detail || 'Invalid or expired OTP');
      } else {
        toast.error('Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    toast.info('Resend OTP feature coming soon!');
    // TODO: Implement resend OTP
  };

  if (!email) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-red-600">Email Required</CardTitle>
            <CardDescription>
              Please start from the registration page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => navigate('/login')}
              className="w-full bg-gradient-to-r from-violet-600 to-purple-600"
            >
              Go to Registration
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <ValidationAlert errors={validationErrors} onClose={() => setValidationErrors([])} />
      
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <Link to="/" className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
              <ChefHat className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              BillByteKOT
            </span>
          </Link>
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Verify Your Email</CardTitle>
          <CardDescription>
            We've sent a 6-digit OTP to <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Display */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                Verifying email for: <strong>{username}</strong>
              </p>
            </div>

            {/* OTP Input */}
            <div>
              <Label htmlFor="otp">Enter OTP *</Label>
              <div className="relative mt-1">
                <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit OTP"
                  className="pl-10 text-center text-2xl tracking-widest"
                  maxLength={6}
                  disabled={loading}
                  autoFocus
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Check your email inbox (and spam folder)
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-violet-600 to-purple-600 h-11"
              disabled={loading || otp.length !== 6}
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Didn't receive the OTP?</p>
              <button
                type="button"
                onClick={handleResendOTP}
                className="text-sm text-violet-600 hover:text-violet-700 font-medium"
              >
                Resend OTP
              </button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Tips:</h3>
            <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
              <li>Check your spam/junk folder</li>
              <li>OTP is valid for 10 minutes</li>
              <li>Make sure you entered the correct email</li>
              <li>Contact support if you need help</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmailPage;
