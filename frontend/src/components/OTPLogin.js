import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { Phone, Lock, ArrowRight, Loader2, Shield } from 'lucide-react';
import axios from 'axios';
import { API } from '../App';

const OTPLogin = ({ onLoginSuccess }) => {
  const [step, setStep] = useState('phone'); // phone, otp
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      // Send OTP via backend
      await axios.post(`${API}/auth/send-otp`, { phone });
      setOtpSent(true);
      setStep('otp');
      toast.success('OTP sent to your phone!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/verify-otp`, { phone, otp });
      const { access_token, user } = response.data;
      
      // Store token
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      
      toast.success('Login successful!');
      onLoginSuccess(user);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    try {
      await axios.post(`${API}/auth/send-otp`, { phone });
      toast.success('OTP resent!');
    } catch (error) {
      toast.error('Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">
            {step === 'phone' ? 'Welcome Back!' : 'Verify OTP'}
          </CardTitle>
          <p className="text-gray-600 text-sm mt-2">
            {step === 'phone' 
              ? 'Enter your phone number to continue' 
              : `We sent a code to ${phone}`}
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {step === 'phone' ? (
            <>
              <div>
                <Label>Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="tel"
                    placeholder="+91 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10"
                    maxLength={13}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Include country code (e.g., +91 for India)
                </p>
              </div>

              <Button 
                onClick={handleSendOTP} 
                disabled={loading}
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending OTP...</>
                ) : (
                  <>Send OTP <ArrowRight className="w-4 h-4 ml-2" /></>
                )}
              </Button>
            </>
          ) : (
            <>
              <div>
                <Label>Enter 6-Digit OTP</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="pl-10 text-center text-2xl tracking-widest"
                    maxLength={6}
                  />
                </div>
              </div>

              <Button 
                onClick={handleVerifyOTP} 
                disabled={loading}
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</>
                ) : (
                  <>Verify & Login <ArrowRight className="w-4 h-4 ml-2" /></>
                )}
              </Button>

              <div className="flex items-center justify-between text-sm">
                <button
                  onClick={() => setStep('phone')}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Change Number
                </button>
                <button
                  onClick={handleResendOTP}
                  disabled={loading}
                  className="text-violet-600 hover:text-violet-700 font-medium"
                >
                  Resend OTP
                </button>
              </div>
            </>
          )}

          <div className="pt-4 border-t text-center">
            <p className="text-xs text-gray-500">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OTPLogin;
