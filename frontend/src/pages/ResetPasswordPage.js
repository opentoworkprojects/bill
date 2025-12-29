import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { toast } from 'sonner';
import { ChefHat, ArrowLeft, Lock, Eye, EyeOff, Loader2, CheckCircle, RefreshCw } from 'lucide-react';

const ResetPasswordPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [step, setStep] = useState(email ? 'otp' : 'email'); // email, otp, password, success
  const [otpVerified, setOtpVerified] = useState(false);
  const otpRefs = useRef([]);

  // Auto-fill OTP if passed from forgot password page
  useEffect(() => {
    if (location.state?.otp) {
      const otpDigits = location.state.otp.split('');
      setOtp(otpDigits);
      toast.info('OTP auto-filled. Click Verify to continue.');
    }
  }, [location.state?.otp]);

  // Auto-focus first OTP input
  useEffect(() => {
    if (step === 'otp' && otpRefs.current[0] && !location.state?.otp) {
      otpRefs.current[0].focus();
    }
  }, [step, location.state?.otp]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      // Focus last filled or next empty
      const nextIndex = Math.min(index + digits.length, 5);
      otpRefs.current[nextIndex]?.focus();
    } else {
      const newOtp = [...otp];
      newOtp[index] = value.replace(/\D/g, '');
      setOtp(newOtp);
      // Auto-focus next input
      if (value && index < 5) {
        otpRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/forgot-password`, { email: email.trim() });
      if (response.data.success) {
        toast.success('OTP sent to your email!');
        setStep('otp');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      toast.error('Please enter the complete 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/verify-reset-otp`, {
        email: email.trim(),
        otp: otpCode
      });
      if (response.data.success) {
        toast.success('OTP verified!');
        setOtpVerified(true);
        setStep('password');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/reset-password`, {
        email: email.trim(),
        otp: otp.join(''),
        new_password: newPassword
      });
      if (response.data.success) {
        toast.success('Password reset successful!');
        setStep('success');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResending(true);
    try {
      const response = await axios.post(`${API}/auth/forgot-password`, { email: email.trim() });
      if (response.data.success) {
        toast.success('New OTP sent!');
        setOtp(['', '', '', '', '', '']);
        otpRefs.current[0]?.focus();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
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
          <CardTitle className="text-2xl">
            {step === 'email' && 'Reset Password'}
            {step === 'otp' && 'Enter OTP'}
            {step === 'password' && 'New Password'}
            {step === 'success' && 'Success!'}
          </CardTitle>
          <CardDescription>
            {step === 'email' && 'Enter your email to receive an OTP'}
            {step === 'otp' && `Enter the 6-digit code sent to ${email}`}
            {step === 'password' && 'Create your new password'}
            {step === 'success' && 'Your password has been reset'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step 1: Email */}
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12"
                  required
                  disabled={loading}
                />
              </div>
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-violet-600 to-purple-600"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send OTP'}
              </Button>
            </form>
          )}

          {/* Step 2: OTP */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="flex justify-center gap-2">
                {otp.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => (otpRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-12 h-14 text-center text-xl font-bold"
                    disabled={loading}
                  />
                ))}
              </div>
              
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-violet-600 to-purple-600"
                disabled={loading || otp.join('').length !== 6}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify OTP'}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resending}
                  className="text-sm text-violet-600 hover:text-violet-700 flex items-center justify-center gap-1 mx-auto"
                >
                  {resending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Resend OTP
                </button>
              </div>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === 'password' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 pr-10 h-12"
                    required
                    minLength={6}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 h-12"
                    required
                    minLength={6}
                    disabled={loading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-violet-600 to-purple-600"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password'}
              </Button>
            </form>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Password Reset Complete!</h3>
              <p className="text-gray-600 mb-6">
                You can now login with your new password.
              </p>
              <Button
                onClick={() => navigate('/login')}
                className="w-full h-12 bg-gradient-to-r from-violet-600 to-purple-600"
              >
                Go to Login
              </Button>
            </div>
          )}

          {/* Back to Login */}
          {step !== 'success' && (
            <div className="text-center pt-4">
              <Link
                to="/login"
                className="text-sm text-gray-600 hover:text-violet-600 flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;
