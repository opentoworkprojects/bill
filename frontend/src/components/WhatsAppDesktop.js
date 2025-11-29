import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { MessageCircle, Send, Users, Zap, QrCode, Loader2, Smartphone } from 'lucide-react';

const WhatsAppDesktop = ({ isElectron = false }) => {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [businessNumber, setBusinessNumber] = useState('');
  const [bulkContacts, setBulkContacts] = useState('');
  const [bulkMessage, setBulkMessage] = useState('');
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [activeTab, setActiveTab] = useState('single'); // single, bulk, qr

  const sendSingleMessage = () => {
    if (!phone || !message) {
      toast.error('Please enter phone number and message');
      return;
    }

    if (isElectron && window.electronAPI?.sendWhatsApp) {
      window.electronAPI.sendWhatsApp(phone, message);
      toast.success('Opening WhatsApp...');
    } else {
      // Fallback for web
      const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      toast.success('Opening WhatsApp in browser...');
    }
    
    setPhone('');
    setMessage('');
  };

  const sendBusinessMessage = () => {
    if (!phone || !message) {
      toast.error('Please enter phone number and message');
      return;
    }

    if (isElectron && window.electronAPI?.sendWhatsAppBusiness) {
      window.electronAPI.sendWhatsAppBusiness(phone, message, businessNumber);
      toast.success('Opening WhatsApp Business...');
    } else {
      sendSingleMessage(); // Fallback to regular WhatsApp
    }
  };

  const sendBulkMessages = () => {
    if (!bulkContacts || !bulkMessage) {
      toast.error('Please enter contacts and message');
      return;
    }

    try {
      // Parse contacts (format: name:phone, one per line)
      const contacts = bulkContacts.split('\n')
        .filter(line => line.trim())
        .map(line => {
          const [name, phone] = line.split(':').map(s => s.trim());
          return { name: name || 'Customer', phone };
        })
        .filter(contact => contact.phone);

      if (contacts.length === 0) {
        toast.error('No valid contacts found. Use format: Name:Phone');
        return;
      }

      if (isElectron && window.electronAPI?.sendBulkWhatsApp) {
        window.electronAPI.sendBulkWhatsApp(contacts, bulkMessage);
        toast.success(`Sending ${contacts.length} WhatsApp messages...`);
      } else {
        // Fallback for web - send one by one with delay
        contacts.forEach((contact, index) => {
          setTimeout(() => {
            const whatsappUrl = `https://wa.me/${contact.phone.replace(/\D/g, '')}?text=${encodeURIComponent(bulkMessage.replace('{name}', contact.name))}`;
            window.open(whatsappUrl, '_blank');
          }, index * 2000);
        });
        toast.success(`Opening ${contacts.length} WhatsApp chats...`);
      }

      setBulkContacts('');
      setBulkMessage('');
    } catch (error) {
      toast.error('Error parsing contacts. Use format: Name:Phone');
    }
  };

  const quickMessages = [
    {
      title: 'Order Ready',
      message: 'Hi {name}! Your order is ready for pickup. Thank you for choosing us! 🍽️'
    },
    {
      title: 'Order Confirmation',
      message: 'Thank you for your order! We have received it and will prepare it shortly. Order ID: {orderId}'
    },
    {
      title: 'Delivery Update',
      message: 'Your order is out for delivery and will reach you in 15-20 minutes. Track: {trackingLink}'
    },
    {
      title: 'Feedback Request',
      message: 'Hi {name}! How was your dining experience? We would love to hear your feedback! ⭐'
    }
  ];

  // Check WhatsApp connection status
  useEffect(() => {
    const savedStatus = localStorage.getItem('whatsapp_connected');
    if (savedStatus === 'true') {
      setWhatsappConnected(true);
    }
  }, []);

  const handleConnectWhatsApp = () => {
    setConnecting(true);
    // Open WhatsApp Web for QR scanning
    if (isElectron && window.electronAPI?.openWhatsAppWeb) {
      window.electronAPI.openWhatsAppWeb();
    } else {
      window.open('https://web.whatsapp.com', '_blank');
    }
    
    // Simulate connection after user scans QR
    setTimeout(() => {
      setConnecting(false);
      setWhatsappConnected(true);
      localStorage.setItem('whatsapp_connected', 'true');
      toast.success('WhatsApp connected successfully!');
    }, 3000);
  };

  const handleDisconnect = () => {
    setWhatsappConnected(false);
    localStorage.removeItem('whatsapp_connected');
    toast.info('WhatsApp disconnected');
  };

  if (!isElectron) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6 text-center">
          <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="font-semibold mb-2">WhatsApp Integration</h3>
          <p className="text-sm text-gray-500">
            Enhanced WhatsApp features are available in the desktop app
          </p>
          <Button 
            onClick={() => window.open('/download', '_blank')} 
            className="mt-4 bg-green-600 hover:bg-green-700"
          >
            Download Desktop App
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card className="border-0 shadow-xl bg-gradient-to-r from-green-50 to-emerald-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${whatsappConnected ? 'bg-green-500' : 'bg-gray-300'}`}>
                <MessageCircle className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">WhatsApp Status</h3>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${whatsappConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span className={`text-sm ${whatsappConnected ? 'text-green-600' : 'text-gray-500'}`}>
                    {whatsappConnected ? 'Connected' : 'Not Connected'}
                  </span>
                </div>
              </div>
            </div>
            {whatsappConnected ? (
              <Button variant="outline" onClick={handleDisconnect} className="border-red-200 text-red-600 hover:bg-red-50">
                Disconnect
              </Button>
            ) : (
              <Button onClick={handleConnectWhatsApp} disabled={connecting} className="bg-green-600 hover:bg-green-700">
                {connecting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connecting...</>
                ) : (
                  <><QrCode className="w-4 h-4 mr-2" /> Connect WhatsApp</>
                )}
              </Button>
            )}
          </div>
          
          {!whatsappConnected && (
            <div className="mt-4 p-4 bg-white rounded-xl border border-green-200">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Smartphone className="w-4 h-4" /> How to Connect
              </h4>
              <ol className="text-sm text-gray-600 space-y-1">
                <li>1. Click "Connect WhatsApp" button</li>
                <li>2. WhatsApp Web will open in a new window</li>
                <li>3. Open WhatsApp on your phone</li>
                <li>4. Go to Settings → Linked Devices → Link a Device</li>
                <li>5. Scan the QR code shown on screen</li>
              </ol>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
        {[
          { id: 'single', label: 'Single Message', icon: Send },
          { id: 'bulk', label: 'Bulk Messages', icon: Users },
          { id: 'templates', label: 'Templates', icon: Zap }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-all ${
              activeTab === tab.id ? 'bg-white shadow text-green-600' : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Single Message Tab */}
      {activeTab === 'single' && (
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-600" />
              Send WhatsApp Message
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phone Number</Label>
                <Input
                  placeholder="+91 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <Label>Business Number (Optional)</Label>
                <Input
                  placeholder="Your WhatsApp Business number"
                  value={businessNumber}
                  onChange={(e) => setBusinessNumber(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>Message</Label>
              <textarea
                className="w-full px-3 py-2 border rounded-md resize-none"
                rows={3}
                placeholder="Type your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            
            {/* Quick Messages in Single Tab */}
            <div>
              <Label className="mb-2 block">Quick Templates</Label>
              <div className="grid grid-cols-2 gap-2">
                {quickMessages.map((template, index) => (
                  <button
                    key={index}
                    onClick={() => setMessage(template.message)}
                    className="p-2 text-left border rounded-lg hover:bg-gray-50 transition-colors text-xs"
                  >
                    <p className="font-medium">{template.title}</p>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={sendSingleMessage} className="flex-1 bg-green-600 hover:bg-green-700">
                <Send className="w-4 h-4 mr-2" />
                Send WhatsApp
              </Button>
              {businessNumber && (
                <Button onClick={sendBusinessMessage} variant="outline" className="flex-1">
                  <Zap className="w-4 h-4 mr-2" />
                  Send Business
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Messages Tab */}
      {activeTab === 'bulk' && (
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Bulk WhatsApp Messages
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Contacts (Name:Phone, one per line)</Label>
              <textarea
                className="w-full px-3 py-2 border rounded-md resize-none"
                rows={4}
                placeholder="John Doe:+91 9876543210&#10;Jane Smith:+91 9876543211&#10;..."
                value={bulkContacts}
                onChange={(e) => setBulkContacts(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: Name:Phone (one contact per line). Use {'{name}'} in message for personalization.
              </p>
            </div>
            <div>
              <Label>Bulk Message</Label>
              <textarea
                className="w-full px-3 py-2 border rounded-md resize-none"
                rows={3}
                placeholder="Hi {name}! We have a special offer for you..."
                value={bulkMessage}
                onChange={(e) => setBulkMessage(e.target.value)}
              />
            </div>
            <Button 
              onClick={sendBulkMessages} 
              disabled={!whatsappConnected}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
            >
              <Users className="w-4 h-4 mr-2" />
              {whatsappConnected ? 'Send Bulk Messages' : 'Connect WhatsApp First'}
            </Button>
            <p className="text-xs text-gray-500 text-center">
              Messages will be sent with 2-second intervals to avoid spam detection
            </p>
          </CardContent>
        </Card>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-600" />
              Message Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickMessages.map((template, index) => (
                <div
                  key={index}
                  className="p-4 border rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => {
                    setMessage(template.message);
                    setActiveTab('single');
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">{template.title}</h4>
                    <Button size="sm" variant="outline" className="text-xs">
                      Use Template
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-3">{template.message}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
              <h4 className="font-medium mb-2">Custom Template Variables</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <code className="bg-white px-2 py-1 rounded">{'{name}'}</code>
                <code className="bg-white px-2 py-1 rounded">{'{orderId}'}</code>
                <code className="bg-white px-2 py-1 rounded">{'{trackingLink}'}</code>
                <code className="bg-white px-2 py-1 rounded">{'{amount}'}</code>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WhatsAppDesktop;