import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { 
  Mail, Phone, MapPin, Send, Loader2, MessageCircle, 
  Clock, Sparkles, CheckCircle, HeadphonesIcon 
} from 'lucide-react';
import axios from 'axios';
import { API } from '../App';
import { useNavigate } from 'react-router-dom';

const ContactPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    priority: 'medium',
    requestType: 'support', // support or demo
    preferredDate: '',
    preferredTime: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/support/ticket`, form);
      toast.success('Support ticket created successfully!');
      setSubmitted(true);
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error) {
      toast.error('Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center shadow-2xl">
          <CardContent className="pt-12 pb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Thank You!</h2>
            <p className="text-gray-600 mb-2">
              Your support ticket has been created successfully.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              We'll get back to you within 24 hours via your preferred contact method.
            </p>
            <Button
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-violet-600 to-purple-600"
            >
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <HeadphonesIcon className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Get in Touch</h1>
          <p className="text-xl text-violet-100 max-w-2xl mx-auto">
            Have questions? Need support? We're here to help you succeed with BillByteKOT
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Submit Ticket Card */}
          <Card className="text-center hover:shadow-xl transition-shadow bg-gradient-to-br from-violet-50 to-purple-50">
            <CardContent className="pt-8 pb-6">
              <div className="w-16 h-16 bg-violet-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-xl mb-2">Submit a Ticket</h3>
              <p className="text-gray-600 text-sm mb-3">
                Fill out the form below and we'll get back to you within 24 hours
              </p>
              <div className="text-violet-600 font-semibold">
                All tickets are saved in our database
              </div>
            </CardContent>
          </Card>

          {/* Book Demo Card */}
          <Card className="text-center hover:shadow-xl transition-shadow bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent className="pt-8 pb-6">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-xl mb-2">Book a Demo</h3>
              <p className="text-gray-600 text-sm mb-3">
                Schedule a personalized demo at your preferred time
              </p>
              <div className="text-purple-600 font-semibold">
                Select your preferred date & time below
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Contact Form */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Form */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">Send us a Message</CardTitle>
              <p className="text-gray-600 text-sm">
                Fill out the form below and we'll get back to you as soon as possible
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Name *</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Your full name"
                      required
                    />
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Phone (Optional)</Label>
                    <Input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div>
                    <Label>Request Type *</Label>
                    <select
                      value={form.requestType}
                      onChange={(e) => setForm({ ...form, requestType: e.target.value })}
                      className="w-full h-10 px-3 border rounded-md"
                      required
                    >
                      <option value="support">Support Ticket</option>
                      <option value="demo">Book a Demo</option>
                      <option value="inquiry">General Inquiry</option>
                    </select>
                  </div>
                </div>

                {/* Show booking fields if demo is selected */}
                {form.requestType === 'demo' && (
                  <div className="grid md:grid-cols-2 gap-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div>
                      <Label>Preferred Date *</Label>
                      <Input
                        type="date"
                        value={form.preferredDate}
                        onChange={(e) => setForm({ ...form, preferredDate: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                        required={form.requestType === 'demo'}
                      />
                    </div>
                    <div>
                      <Label>Preferred Time *</Label>
                      <select
                        value={form.preferredTime}
                        onChange={(e) => setForm({ ...form, preferredTime: e.target.value })}
                        className="w-full h-10 px-3 border rounded-md"
                        required={form.requestType === 'demo'}
                      >
                        <option value="">Select time</option>
                        <option value="09:00">09:00 AM</option>
                        <option value="10:00">10:00 AM</option>
                        <option value="11:00">11:00 AM</option>
                        <option value="12:00">12:00 PM</option>
                        <option value="14:00">02:00 PM</option>
                        <option value="15:00">03:00 PM</option>
                        <option value="16:00">04:00 PM</option>
                        <option value="17:00">05:00 PM</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-purple-700">
                        📅 We'll confirm your demo booking via email within 2 hours
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <Label>Subject *</Label>
                  <Input
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="What can we help you with?"
                    required
                  />
                </div>

                <div>
                  <Label>Priority Level</Label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full h-10 px-3 border rounded-md"
                  >
                    <option value="low">Low - General inquiry</option>
                    <option value="medium">Medium - Need assistance</option>
                    <option value="high">High - Urgent issue</option>
                    <option value="critical">Critical - System down</option>
                  </select>
                </div>

                <div>
                  <Label>Message *</Label>
                  <Textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Please describe your issue or question in detail..."
                    required
                    rows={6}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-lg py-6"
                >
                  {loading ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Sending...</>
                  ) : (
                    <><Send className="w-5 h-5 mr-2" /> Submit Support Ticket</>
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  By submitting this form, you agree to our Terms of Service and Privacy Policy
                </p>
              </form>
            </CardContent>
          </Card>

          {/* Info Sidebar */}
          <div className="space-y-6">
            {/* Response Time */}
            <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-violet-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Quick Response Time</h3>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      We typically respond to all inquiries within 24 hours during business days. 
                      Critical issues are prioritized and handled immediately.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Support */}
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">AI-Powered Support</h3>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Get instant answers to common questions using our AI chat assistant. 
                      Available 24/7 in the floating widget at the bottom right.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Database Storage Info */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Secure Storage</h3>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      All submissions are securely stored in our database. 
                      We review every ticket and respond within 24 hours.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* FAQ Link */}
            <Card className="bg-gradient-to-r from-violet-600 to-purple-600 text-white">
              <CardContent className="pt-6">
                <h3 className="font-bold text-lg mb-2">Need Quick Answers?</h3>
                <p className="text-violet-100 text-sm mb-4">
                  Check out our comprehensive documentation and FAQ section for instant solutions.
                </p>
                <Button 
                  variant="secondary" 
                  className="w-full"
                  onClick={() => navigate('/blog')}
                >
                  Visit Help Center
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom CTA */}
        <Card className="mt-12 bg-gradient-to-r from-violet-600 to-purple-600 text-white">
          <CardContent className="py-8 text-center">
            <h2 className="text-2xl font-bold mb-3">Ready to Transform Your Restaurant?</h2>
            <p className="text-violet-100 mb-6 max-w-2xl mx-auto">
              Join thousands of restaurants already using BillByteKOT to streamline their operations
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button 
                variant="secondary" 
                size="lg"
                onClick={() => navigate('/login')}
              >
                Start Free Trial
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="bg-white/10 border-white text-white hover:bg-white/20"
                onClick={() => navigate('/download')}
              >
                Download App
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContactPage;
