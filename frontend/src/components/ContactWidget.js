import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { MessageCircle, X, Send, Mail, Phone, Sparkles, Loader2 } from 'lucide-react';
import axios from 'axios';
import { API } from '../App';

const ContactWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('contact'); // contact, ai
  const [loading, setLoading] = useState(false);
  
  // Contact form
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    priority: 'medium'
  });

  // AI Chat
  const [aiMessages, setAiMessages] = useState([
    { role: 'assistant', content: 'Hi! I\'m your BillByteKOT AI assistant. How can I help you today?' }
  ]);
  const [aiInput, setAiInput] = useState('');

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/support/ticket`, contactForm);
      toast.success('Support ticket created! We\'ll contact you within 24 hours.');
      setContactForm({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        priority: 'medium'
      });
      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAiChat = async () => {
    if (!aiInput.trim()) return;

    const userMessage = aiInput;
    setAiInput('');
    setAiMessages([...aiMessages, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await axios.post(`${API}/ai/support-chat`, {
        message: userMessage,
        history: aiMessages
      });

      setAiMessages([
        ...aiMessages,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: response.data.response }
      ]);
    } catch (error) {
      setAiMessages([
        ...aiMessages,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: 'Sorry, I\'m having trouble connecting. Please use the contact form or email support@finverge.tech' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50 animate-bounce"
        style={{ animationDuration: '2s' }}
      >
        <MessageCircle className="w-8 h-8 text-white" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className="w-96 shadow-2xl border-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-6 h-6" />
              <h3 className="font-bold text-lg">Need Help?</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 rounded-full p-1 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab('contact')}
              className={`flex-1 py-2 px-4 rounded-lg transition-all ${
                activeTab === 'contact'
                  ? 'bg-white text-violet-600 font-semibold'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <Mail className="w-4 h-4 inline mr-2" />
              Contact
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex-1 py-2 px-4 rounded-lg transition-all ${
                activeTab === 'ai'
                  ? 'bg-white text-violet-600 font-semibold'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <Sparkles className="w-4 h-4 inline mr-2" />
              AI Chat
            </button>
          </div>
        </div>

        <CardContent className="p-4 max-h-96 overflow-y-auto">
          {activeTab === 'contact' ? (
            <form onSubmit={handleContactSubmit} className="space-y-3">
              <div>
                <Label className="text-sm">Name *</Label>
                <Input
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  placeholder="Your name"
                  required
                  className="h-9"
                />
              </div>

              <div>
                <Label className="text-sm">Email *</Label>
                <Input
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  placeholder="your@email.com"
                  required
                  className="h-9"
                />
              </div>

              <div>
                <Label className="text-sm">Phone</Label>
                <Input
                  type="tel"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="h-9"
                />
              </div>

              <div>
                <Label className="text-sm">Subject *</Label>
                <Input
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  placeholder="How can we help?"
                  required
                  className="h-9"
                />
              </div>

              <div>
                <Label className="text-sm">Priority</Label>
                <select
                  value={contactForm.priority}
                  onChange={(e) => setContactForm({ ...contactForm, priority: e.target.value })}
                  className="w-full h-9 px-3 border rounded-md text-sm"
                >
                  <option value="low">Low - General inquiry</option>
                  <option value="medium">Medium - Need assistance</option>
                  <option value="high">High - Urgent issue</option>
                </select>
              </div>

              <div>
                <Label className="text-sm">Message *</Label>
                <Textarea
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  placeholder="Describe your issue or question..."
                  required
                  rows={4}
                  className="text-sm"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
                ) : (
                  <><Send className="w-4 h-4 mr-2" /> Submit Ticket</>
                )}
              </Button>

              <div className="text-center text-xs text-gray-500 pt-2">
                <p>We typically respond within 24 hours</p>
                <p className="mt-1">
                  <Phone className="w-3 h-3 inline mr-1" />
                  Emergency: +91-XXXXXXXXXX
                </p>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              {/* AI Chat Messages */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {aiMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg text-sm ${
                        msg.role === 'user'
                          ? 'bg-violet-600 text-white rounded-br-none'
                          : 'bg-gray-100 text-gray-800 rounded-bl-none'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 p-3 rounded-lg rounded-bl-none">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                    </div>
                  </div>
                )}
              </div>

              {/* AI Input */}
              <div className="flex gap-2">
                <Input
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !loading && handleAiChat()}
                  placeholder="Ask me anything..."
                  className="h-10"
                  disabled={loading}
                />
                <Button
                  onClick={handleAiChat}
                  disabled={loading || !aiInput.trim()}
                  className="bg-gradient-to-r from-violet-600 to-purple-600"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              <div className="text-xs text-gray-500 text-center">
                <p>💡 Try asking: "How do I setup thermal printer?" or "What's the pricing?"</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ContactWidget;
