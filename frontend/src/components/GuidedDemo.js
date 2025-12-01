import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { 
  ShoppingCart, Users, CreditCard, BarChart3, 
  MessageCircle, Printer, ArrowRight, X, 
  CheckCircle, Sparkles, Play, ChevronRight,
  Plus, Minus, DollarSign, Clock, TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

const GuidedDemo = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [demoData, setDemoData] = useState({
    orderItems: [],
    tableNumber: 5,
    customerName: '',
    totalAmount: 0
  });

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to BillByteKOT! 🎉',
      description: 'Let\'s take an interactive tour. You\'ll actually try each feature!',
      icon: Sparkles,
      color: 'from-violet-600 to-purple-600',
      component: 'welcome'
    },
    {
      id: 'order',
      title: 'Create Your First Order',
      description: 'Add items to an order just like you would in real life',
      icon: ShoppingCart,
      color: 'from-blue-500 to-cyan-500',
      component: 'order',
      instruction: 'Click on menu items below to add them to your order'
    },
    {
      id: 'table',
      title: 'Assign to Table',
      description: 'Select a table and add customer details',
      icon: Users,
      color: 'from-purple-500 to-pink-500',
      component: 'table',
      instruction: 'Choose a table number and enter customer name'
    },
    {
      id: 'payment',
      title: 'Process Payment',
      description: 'See how easy it is to accept payments',
      icon: CreditCard,
      color: 'from-green-500 to-emerald-500',
      component: 'payment',
      instruction: 'Select a payment method to complete the order'
    },
    {
      id: 'analytics',
      title: 'View Analytics',
      description: 'Track your sales and performance in real-time',
      icon: BarChart3,
      color: 'from-orange-500 to-red-500',
      component: 'analytics',
      instruction: 'See how your sales data is visualized'
    },
    {
      id: 'whatsapp',
      title: 'WhatsApp Integration',
      description: 'Send receipts and updates to customers',
      icon: MessageCircle,
      color: 'from-green-600 to-teal-600',
      component: 'whatsapp',
      instruction: 'Try sending a receipt via WhatsApp'
    },
    {
      id: 'print',
      title: 'Print Receipt',
      description: 'Print professional receipts on thermal printers',
      icon: Printer,
      color: 'from-gray-600 to-slate-700',
      component: 'print',
      instruction: 'Preview and print your receipt'
    }
  ];

  const demoMenuItems = [
    { id: 1, name: 'Butter Chicken', price: 350, category: 'Main Course' },
    { id: 2, name: 'Naan', price: 40, category: 'Bread' },
    { id: 3, name: 'Dal Makhani', price: 250, category: 'Main Course' },
    { id: 4, name: 'Paneer Tikka', price: 280, category: 'Starter' },
    { id: 5, name: 'Mango Lassi', price: 80, category: 'Beverage' }
  ];

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  const addItemToOrder = (item) => {
    const existingItem = demoData.orderItems.find(i => i.id === item.id);
    if (existingItem) {
      setDemoData({
        ...demoData,
        orderItems: demoData.orderItems.map(i => 
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        ),
        totalAmount: demoData.totalAmount + item.price
      });
    } else {
      setDemoData({
        ...demoData,
        orderItems: [...demoData.orderItems, { ...item, quantity: 1 }],
        totalAmount: demoData.totalAmount + item.price
      });
    }
    toast.success(`Added ${item.name} to order!`);
  };

  const removeItemFromOrder = (itemId) => {
    const item = demoData.orderItems.find(i => i.id === itemId);
    if (item.quantity > 1) {
      setDemoData({
        ...demoData,
        orderItems: demoData.orderItems.map(i => 
          i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
        ),
        totalAmount: demoData.totalAmount - item.price
      });
    } else {
      setDemoData({
        ...demoData,
        orderItems: demoData.orderItems.filter(i => i.id !== itemId),
        totalAmount: demoData.totalAmount - item.price
      });
    }
  };

  const handleNext = () => {
    // Validation for each step
    if (currentStep === 1 && demoData.orderItems.length === 0) {
      toast.error('Please add at least one item to continue');
      return;
    }
    if (currentStep === 2 && !demoData.customerName) {
      toast.error('Please enter customer name to continue');
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      toast.success('Great! Moving to next step');
    } else {
      toast.success('🎉 Demo completed! You\'re ready to use BillByteKOT');
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStepData.component) {
      case 'welcome':
        return (
          <div className="text-center space-y-4">
            <div className="w-24 h-24 bg-gradient-to-br from-violet-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold">Welcome to BillByteKOT!</h2>
            <p className="text-gray-600 max-w-md mx-auto">
              This interactive demo will guide you through all features. 
              You'll actually use the system, not just watch!
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>Takes about 2 minutes</span>
            </div>
          </div>
        );

      case 'order':
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800 font-medium mb-2">
                👆 {currentStepData.instruction}
              </p>
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
              {demoMenuItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => addItemToOrder(item)}
                  className="p-3 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="font-semibold text-sm">{item.name}</div>
                  <div className="text-xs text-gray-500">{item.category}</div>
                  <div className="text-green-600 font-bold mt-1">₹{item.price}</div>
                </button>
              ))}
            </div>

            {/* Current Order */}
            {demoData.orderItems.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  Current Order
                </h4>
                <div className="space-y-2">
                  {demoData.orderItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span>{item.name} x{item.quantity}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">₹{item.price * item.quantity}</span>
                        <button
                          onClick={() => removeItemFromOrder(item.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-gray-300 flex justify-between font-bold">
                    <span>Total:</span>
                    <span className="text-green-600">₹{demoData.totalAmount}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'table':
        return (
          <div className="space-y-4">
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-800 font-medium">
                👆 {currentStepData.instruction}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2">Table Number</label>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <button
                      key={num}
                      onClick={() => setDemoData({ ...demoData, tableNumber: num })}
                      className={`p-3 rounded-lg border-2 font-semibold transition-all ${
                        demoData.tableNumber === num
                          ? 'border-purple-500 bg-purple-100 text-purple-700'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Customer Name</label>
                <Input
                  placeholder="Enter customer name"
                  value={demoData.customerName}
                  onChange={(e) => setDemoData({ ...demoData, customerName: e.target.value })}
                  className="h-12"
                />
              </div>

              {demoData.customerName && (
                <div className="bg-green-50 p-3 rounded-lg border border-green-200 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-green-800">
                    Order for <strong>{demoData.customerName}</strong> at Table <strong>{demoData.tableNumber}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>
        );

      case 'payment':
        return (
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-sm text-green-800 font-medium">
                👆 {currentStepData.instruction}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600">Total Amount:</span>
                <span className="text-2xl font-bold text-green-600">₹{demoData.totalAmount}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { method: 'Cash', icon: DollarSign, color: 'green' },
                { method: 'Card', icon: CreditCard, color: 'blue' },
                { method: 'UPI', icon: MessageCircle, color: 'purple' },
                { method: 'Online', icon: CreditCard, color: 'orange' }
              ].map(({ method, icon: PayIcon, color }) => (
                <button
                  key={method}
                  onClick={() => toast.success(`Payment via ${method} processed!`)}
                  className={`p-4 bg-white border-2 border-${color}-200 rounded-lg hover:border-${color}-400 hover:bg-${color}-50 transition-all`}
                >
                  <PayIcon className={`w-8 h-8 text-${color}-600 mx-auto mb-2`} />
                  <div className="font-semibold text-sm">{method}</div>
                </button>
              ))}
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-4">
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <p className="text-sm text-orange-800 font-medium">
                📊 {currentStepData.instruction}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-4 rounded-xl text-white">
                <div className="text-3xl font-bold">₹{demoData.totalAmount}</div>
                <div className="text-sm opacity-90">Today's Sales</div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-4 rounded-xl text-white">
                <div className="text-3xl font-bold">{demoData.orderItems.length}</div>
                <div className="text-sm opacity-90">Items Sold</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-xl text-white">
                <div className="text-3xl font-bold">1</div>
                <div className="text-sm opacity-90">Orders</div>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-red-500 p-4 rounded-xl text-white">
                <div className="text-3xl font-bold flex items-center gap-1">
                  <TrendingUp className="w-6 h-6" />
                  +25%
                </div>
                <div className="text-sm opacity-90">Growth</div>
              </div>
            </div>
          </div>
        );

      case 'whatsapp':
        return (
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-sm text-green-800 font-medium">
                💬 {currentStepData.instruction}
              </p>
            </div>

            <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-semibold">{demoData.customerName || 'Customer'}</div>
                  <div className="text-sm text-gray-500">+91 98765 43210</div>
                </div>
              </div>
              <div className="bg-green-100 p-3 rounded-lg text-sm">
                <p className="font-medium mb-1">Receipt from BillByteKOT</p>
                <p className="text-gray-700">
                  Thank you for dining with us! Your bill of ₹{demoData.totalAmount} has been paid.
                  Order #{Math.floor(Math.random() * 1000)}
                </p>
              </div>
            </div>

            <Button 
              onClick={() => toast.success('Receipt sent via WhatsApp!')}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Send Receipt via WhatsApp
            </Button>
          </div>
        );

      case 'print':
        return (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-800 font-medium">
                🖨️ {currentStepData.instruction}
              </p>
            </div>

            <div className="bg-white border-2 border-gray-300 rounded-lg p-6 font-mono text-xs max-h-64 overflow-y-auto">
              <div className="text-center mb-4">
                <div className="font-bold text-lg">BILLBYTEKOT</div>
                <div>Restaurant Management System</div>
                <div className="border-t border-b border-gray-400 my-2 py-1">
                  RECEIPT
                </div>
              </div>
              <div className="space-y-1">
                <div>Table: {demoData.tableNumber}</div>
                <div>Customer: {demoData.customerName || 'Guest'}</div>
                <div>Date: {new Date().toLocaleDateString()}</div>
                <div className="border-t border-gray-400 my-2"></div>
                {demoData.orderItems.map(item => (
                  <div key={item.id} className="flex justify-between">
                    <span>{item.name} x{item.quantity}</span>
                    <span>₹{item.price * item.quantity}</span>
                  </div>
                ))}
                <div className="border-t border-gray-400 my-2"></div>
                <div className="flex justify-between font-bold">
                  <span>TOTAL:</span>
                  <span>₹{demoData.totalAmount}</span>
                </div>
                <div className="text-center mt-4 border-t border-gray-400 pt-2">
                  Thank you for dining with us!
                </div>
              </div>
            </div>

            <Button 
              onClick={() => toast.success('Receipt sent to printer!')}
              className="w-full bg-gray-700 hover:bg-gray-800"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print Receipt
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <Card className="w-full max-w-3xl border-0 shadow-2xl relative my-8">
        {/* Skip button */}
        <button
          onClick={onSkip}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Progress bar */}
        <div className="h-2 bg-gray-200">
          <div 
            className="h-full bg-gradient-to-r from-violet-600 to-purple-600 transition-all duration-500"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        <CardContent className="p-8">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep 
                    ? 'w-12 bg-violet-600' 
                    : index < currentStep 
                    ? 'w-2 bg-green-500' 
                    : 'w-2 bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Step header */}
          <div className="text-center mb-6">
            <div className={`w-16 h-16 bg-gradient-to-br ${currentStepData.color} rounded-2xl flex items-center justify-center mx-auto mb-3`}>
              <Icon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-2">{currentStepData.title}</h3>
            <p className="text-gray-600">{currentStepData.description}</p>
          </div>

          {/* Step content */}
          <div className="mb-8">
            {renderStepContent()}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Step {currentStep + 1} of {steps.length}
            </div>

            <div className="flex gap-3">
              {currentStep > 0 && (
                <Button variant="outline" onClick={handlePrevious}>
                  Previous
                </Button>
              )}
              <Button 
                onClick={handleNext} 
                className="bg-gradient-to-r from-violet-600 to-purple-600"
              >
                {currentStep === steps.length - 1 ? (
                  <>
                    Complete Demo <CheckCircle className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    Next <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GuidedDemo;
