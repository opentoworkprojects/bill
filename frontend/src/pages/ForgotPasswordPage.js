import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { ChefHat, ArrowLeft, Mail, Phone, MessageCircle, HelpCircle } from 'lucide-react';

const ForgotPasswordPage = () => {
  const supportEmail = "support@billbytekot.in";
  const supportPhone = "+91 8210066921"; // Update with actual number
  
  const handleWhatsApp = () => {
    const message = encodeURIComponent("Hi, I need help resetting my BillByteKOT password. My registered email is: ");
    window.open(`https://wa.me/918210066921?text=${message}`, '_blank');
  };

  const handleEmail = () => {
    const subject = encodeURIComponent("Password Reset Request - BillByteKOT");
    const body = encodeURIComponent("Hi Support Team,\n\nI need help resetting my password.\n\nMy registered email: \nMy username: \n\nThank you.");
    window.location.href = `mailto:${supportEmail}?subject=${subject}&body=${body}`;
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
          <CardTitle className="text-2xl">Forgot Password?</CardTitle>
          <CardDescription>
            Contact our support team to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Info Box */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-blue-800 font-medium">Need to reset your password?</p>
                <p className="text-xs text-blue-700 mt-1">
                  Please contact our support team with your registered email address. We'll help you reset your password within 24 hours.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Options */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Contact Support:</h3>
            
            {/* WhatsApp - Primary */}
            <Button
              onClick={handleWhatsApp}
              className="w-full h-12 bg-green-600 hover:bg-green-700 text-white"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              WhatsApp Support (Fastest)
            </Button>

            {/* Email */}
            <Button
              onClick={handleEmail}
              variant="outline"
              className="w-full h-12"
            >
              <Mail className="w-5 h-5 mr-2" />
              Email: {supportEmail}
            </Button>

            {/* Phone */}
            <a href={`tel:${supportPhone.replace(/\s/g, '')}`} className="block">
              <Button
                variant="outline"
                className="w-full h-12"
              >
                <Phone className="w-5 h-5 mr-2" />
                Call: {supportPhone}
              </Button>
            </a>
          </div>

          {/* What to Include */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">When contacting support, please provide:</h3>
            <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
              <li>Your registered email address</li>
              <li>Your username</li>
              <li>Restaurant/Business name</li>
            </ul>
          </div>

          {/* Back to Login */}
          <div className="text-center pt-2">
            <Link
              to="/login"
              className="text-sm text-gray-600 hover:text-violet-600 flex items-center justify-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
