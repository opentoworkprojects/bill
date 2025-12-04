import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { toast } from "sonner";
import {
  ChefHat,
  Sparkles,
  CreditCard,
  Printer,
  TrendingUp,
  Users,
  Shield,
  Zap,
  CheckCircle,
  Star,
  ArrowRight,
  Menu,
  X,
  Globe,
  BarChart3,
  Smartphone,
  Clock,
  DollarSign,
  Package,
  Download,
  Bell,
  Rocket,
  Gift,
  Monitor,
  Apple,
  MessageCircle,
} from "lucide-react";

// Desktop App Download Section Component
const DesktopDownloadSection = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  
  // Detect user's operating system
  const getOS = () => {
    const userAgent = window.navigator.userAgent;
    if (userAgent.indexOf("Win") !== -1) return "windows";
    if (userAgent.indexOf("Mac") !== -1) return "mac";
    if (userAgent.indexOf("Linux") !== -1) return "linux";
    if (/Android/i.test(userAgent)) return "android";
    if (/iPhone|iPad|iPod/i.test(userAgent)) return "ios";
    return "unknown";
  };
  
  const os = getOS();
  const isMobile = os === "android" || os === "ios";
  
  // Download URLs - GitHub Releases
  const downloadUrls = {
    windows: "https://github.com/shivshankar9/restro-ai/releases/download/v1-desktop-win-exe/BillByteKOT-Setup-1.0.0-win.exe",
    mac: "https://github.com/shivshankar9/restro-ai/releases/download/v1-desktop-win-exe/BillByteKOT-1.0.0-mac.dmg",
    linux: "https://github.com/shivshankar9/restro-ai/releases/download/v1-desktop-win-exe/BillByteKOT-1.0.0-linux.AppImage",
  };
  
  const handleDownload = (platform) => {
    const url = downloadUrls[platform];
    if (url) {
      window.open(url, "_blank");
      toast.success(`Downloading BillByteKOT for ${platform.charAt(0).toUpperCase() + platform.slice(1)}...`);
    } else {
      toast.error("Download not available yet. Please try again later.");
    }
  };
  
  const handleSendLink = (e) => {
    e.preventDefault();
    if (phoneNumber) {
      // Generate WhatsApp link with download info
      const message = encodeURIComponent(
        `🖥️ Download BillByteKOT Desktop App:\n\n` +
        `Windows: ${downloadUrls.windows}\n\n` +
        `Mac: ${downloadUrls.mac}\n\n` +
        `Or visit: https://finverge.tech/download`
      );
      window.open(`https://wa.me/${phoneNumber.replace(/\D/g, "")}?text=${message}`, "_blank");
      toast.success("Opening WhatsApp to send download link!");
      setPhoneNumber("");
      setShowPhoneInput(false);
    }
  };
  
  return (
    <section id="desktop-app" className="py-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full mb-4">
              <Monitor className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">Desktop App Available</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              Get BillByteKOT for
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Desktop</span>
            </h2>
            
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Download the native desktop app for the best experience. 
              Works offline and integrates with your thermal printer.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Download Options */}
            <div className="space-y-6">
              {/* Auto-detected OS */}
              {!isMobile && (
                <Card className="border-2 border-blue-200 bg-blue-50/50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                        {os === "windows" && <Monitor className="w-7 h-7 text-white" />}
                        {os === "mac" && <Apple className="w-7 h-7 text-white" />}
                        {os === "linux" && <Monitor className="w-7 h-7 text-white" />}
                      </div>
                      <div>
                        <p className="text-sm text-blue-600 font-medium">Recommended for you</p>
                        <h3 className="text-xl font-bold">
                          {os === "windows" && "Windows"}
                          {os === "mac" && "macOS"}
                          {os === "linux" && "Linux"}
                        </h3>
                      </div>
                    </div>
                    <Button 
                      className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-lg"
                      onClick={() => handleDownload(os)}
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Download for {os === "windows" ? "Windows" : os === "mac" ? "macOS" : "Linux"}
                    </Button>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      {os === "windows" && "Windows 10/11 • 64-bit • ~80MB"}
                      {os === "mac" && "macOS 10.15+ • Intel & Apple Silicon • ~90MB"}
                      {os === "linux" && "Ubuntu 20.04+ • AppImage • ~85MB"}
                    </p>
                  </CardContent>
                </Card>
              )}
              
              {/* Other platforms */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleDownload("windows")}
                  className={`p-4 rounded-xl border-2 transition-all hover:border-blue-400 hover:bg-blue-50 ${os === "windows" && !isMobile ? "border-blue-200 bg-blue-50/30" : "border-gray-200"}`}
                >
                  <Monitor className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-sm font-medium">Windows</p>
                  <p className="text-xs text-gray-500">.exe</p>
                </button>
                
                <button
                  onClick={() => handleDownload("mac")}
                  className={`p-4 rounded-xl border-2 transition-all hover:border-blue-400 hover:bg-blue-50 ${os === "mac" && !isMobile ? "border-blue-200 bg-blue-50/30" : "border-gray-200"}`}
                >
                  <Apple className="w-8 h-8 mx-auto mb-2 text-gray-700" />
                  <p className="text-sm font-medium">macOS</p>
                  <p className="text-xs text-gray-500">.dmg</p>
                </button>
                
                <button
                  onClick={() => handleDownload("linux")}
                  className={`p-4 rounded-xl border-2 transition-all hover:border-blue-400 hover:bg-blue-50 ${os === "linux" && !isMobile ? "border-blue-200 bg-blue-50/30" : "border-gray-200"}`}
                >
                  <Monitor className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                  <p className="text-sm font-medium">Linux</p>
                  <p className="text-xs text-gray-500">.AppImage</p>
                </button>
              </div>
              
              {/* Send link via WhatsApp */}
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                {!showPhoneInput ? (
                  <button
                    onClick={() => setShowPhoneInput(true)}
                    className="w-full flex items-center justify-center gap-2 text-green-600 hover:text-green-700 font-medium"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Send download link via WhatsApp
                  </button>
                ) : (
                  <form onSubmit={handleSendLink} className="space-y-3">
                    <p className="text-sm text-gray-600 mb-2">Enter phone number to receive download link:</p>
                    <div className="flex gap-2">
                      <Input
                        type="tel"
                        placeholder="+91 9876543210"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="h-10"
                        required
                      />
                      <Button type="submit" className="bg-green-600 hover:bg-green-700 h-10 px-4">
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPhoneInput(false)}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </form>
                )}
              </div>
            </div>
            
            {/* Features */}
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
              <h3 className="text-lg font-bold mb-4">Desktop App Features</h3>
              <div className="space-y-4">
                {[
                  { icon: Zap, title: "Lightning Fast", desc: "Native performance, instant startup" },
                  { icon: Printer, title: "Direct Printing", desc: "Print receipts directly to thermal printer" },
                  { icon: Shield, title: "Secure", desc: "Your data stays on your computer" },
                  { icon: Globe, title: "Works Offline", desc: "Continue billing even without internet" },
                  { icon: Bell, title: "Notifications", desc: "Get alerts for new orders" },
                  { icon: Monitor, title: "Multi-Monitor", desc: "Use on multiple screens" },
                ].map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{feature.title}</h4>
                      <p className="text-sm text-gray-600">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                <p className="text-sm text-gray-700">
                  <strong>Version 1.0.0</strong> • Released Nov 2024
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Connects to finverge.tech • Auto-updates enabled
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [email, setEmail] = useState("");

  const handleGetStarted = () => {
    navigate("/login");
  };

  const handleWaitlist = (e) => {
    e.preventDefault();
    if (email) {
      toast.success("Thanks for joining! We'll be in touch soon.");
      setEmail("");
    }
  };

  const features = [
    {
      icon: Sparkles,
      title: "AI-Powered Intelligence",
      description:
        "Smart recommendations, sales forecasting, and automated insights powered by GPT-4",
      color: "from-violet-500 to-purple-600",
    },
    {
      icon: CreditCard,
      title: "Multiple Payment Options",
      description:
        "Accept cash, cards, UPI, and Razorpay. EDC machine support included",
      color: "from-blue-500 to-cyan-600",
    },
    {
      icon: Printer,
      title: "Thermal Printer Support",
      description:
        "4 professional receipt themes. ESC/POS compatible thermal printing",
      color: "from-green-500 to-emerald-600",
    },
    {
      icon: Globe,
      title: "Multi-Currency Support",
      description:
        "Support 10+ currencies including INR, USD, EUR, GBP, AED, and more",
      color: "from-orange-500 to-amber-600",
    },
    {
      icon: Users,
      title: "Staff Management",
      description:
        "Role-based access for admin, cashiers, waiters, and kitchen staff",
      color: "from-pink-500 to-rose-600",
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Real-time reports, sales trends, and export to CSV/PDF",
      color: "from-indigo-500 to-blue-600",
    },
    {
      icon: Package,
      title: "Inventory Management",
      description:
        "Track stock levels, get low-stock alerts, and manage suppliers",
      color: "from-teal-500 to-cyan-600",
    },
    {
      icon: Smartphone,
      title: "Mobile & PWA Ready",
      description:
        "Works on any device. Install as Android app from Play Store",
      color: "from-purple-500 to-pink-600",
    },
    {
      icon: MessageCircle,
      title: "WhatsApp Integration",
      description:
        "Send bills, order updates, and promotional messages via WhatsApp",
      color: "from-green-500 to-emerald-600",
    },
  ];

  const benefits = [
    {
      icon: Clock,
      title: "10x Faster Billing",
      description:
        "Process orders in seconds with smart menu and quick billing",
    },
    {
      icon: DollarSign,
      title: "Increase Revenue",
      description: "AI recommendations boost average order value by 25%",
    },
    {
      icon: TrendingUp,
      title: "Data-Driven Insights",
      description: "Make informed decisions with real-time analytics",
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Bank-grade security with 99.9% uptime guarantee",
    },
  ];

  const testimonials = [
    {
      name: "Rajesh Kumar",
      role: "Owner, Spice Garden",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rajesh",
      rating: 5,
      text: "BillByteKOT AI transformed our restaurant! The AI recommendations increased our sales by 30%. Best investment ever!",
    },
    {
      name: "Priya Sharma",
      role: "Manager, Urban Bistro",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya",
      rating: 5,
      text: "Love the thermal printer themes and multi-currency support. Perfect for our international clientele!",
    },
    {
      name: "Amit Patel",
      role: "Owner, Cafe Delight",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Amit",
      rating: 5,
      text: "Staff management with roles is a game-changer. Now I can track everything from anywhere!",
    },
  ];

  const pricingPlans = [
    {
      name: "Free Trial",
      price: "₹0",
      period: "7 Days Free",
      features: [
        "7 days full access",
        "All premium features",
        "AI recommendations",
        "Unlimited bills (trial)",
        "Single restaurant",
        "Email support",
      ],
      cta: "Start Free Trial",
      popular: false,
    },
    {
      name: "Premium",
      price: "₹499",
      period: "per year",
      originalPrice: "₹999",
      features: [
        "Unlimited bills forever",
        "All premium features",
        "Advanced AI analytics",
        "Priority 24/7 support",
        "Multiple restaurants",
        "Phone & chat support",
        "Custom integrations",
        "Export to CSV/PDF",
        "Multi-currency",
        "6 thermal printer themes",
      ],
      cta: "Get Premium - 50% OFF",
      popular: true,
    },
  ];

  const [earlyAccessEmail, setEarlyAccessEmail] = useState("");

  const stats = [
    { value: "10,000+", label: "Active Restaurants" },
    { value: "1M+", label: "Bills Generated" },
    { value: "99.9%", label: "Uptime" },
    { value: "4.9/5", label: "User Rating" },
  ];

  return (
    <div className="min-h-screen bg-white" data-testid="landing-page">
      {/* Header/Navbar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <nav className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              <span
                className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              >
                BillByteKOT AI
              </span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <a
                href="#features"
                className="text-gray-600 hover:text-violet-600 transition-colors"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="text-gray-600 hover:text-violet-600 transition-colors"
              >
                Pricing
              </a>

              <a
                href="#desktop-app"
                className="text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-1"
              >
                <Monitor className="w-4 h-4" />
                Desktop
              </a>
              <a
                href="#app"
                className="text-gray-600 hover:text-violet-600 transition-colors flex items-center gap-1"
              >
                <Smartphone className="w-4 h-4" />
                Mobile
                <span className="bg-green-100 text-green-600 text-xs px-1.5 py-0.5 rounded-full font-medium">NEW</span>
              </a>
              <a
                href="#testimonials"
                className="text-gray-600 hover:text-violet-600 transition-colors"
              >
                Reviews
              </a>
              <a
                href="/contact"
                className="text-gray-600 hover:text-violet-600 transition-colors"
              >
                Contact
              </a>
              <Button variant="outline" onClick={() => navigate("/login")}>
                Login
              </Button>
              <Button
                className="bg-gradient-to-r from-violet-600 to-purple-600"
                onClick={handleGetStarted}
              >
                Start Free Trial
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-4">
              <a
                href="#features"
                className="block text-gray-600 hover:text-violet-600"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="block text-gray-600 hover:text-violet-600"
              >
                Pricing
              </a>
              <a
                href="#desktop-app"
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
              >
                <Monitor className="w-4 h-4" />
                Desktop App
              </a>
              <a
                href="#app"
                className="flex items-center gap-2 text-gray-600 hover:text-violet-600"
              >
                <Smartphone className="w-4 h-4" />
                Mobile App
                <span className="bg-green-100 text-green-600 text-xs px-1.5 py-0.5 rounded-full font-medium">NEW</span>
              </a>
              <a
                href="#testimonials"
                className="block text-gray-600 hover:text-violet-600"
              >
                Reviews
              </a>
              <a
                href="/contact"
                className="block text-gray-600 hover:text-violet-600"
              >
                Contact
              </a>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/login")}
              >
                Login
              </Button>
              <Button
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600"
                onClick={handleGetStarted}
              >
                Start Free Trial
              </Button>
            </div>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 py-20 md:py-32">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-100 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-violet-600" />
              <span className="text-sm font-medium text-violet-600">
                AI-Powered Restaurant Management
              </span>
            </div>

            <h1
              className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              Smart Billing,
              <br />
              <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Smarter Business
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Transform your restaurant with AI-powered billing, multi-currency
              support, and thermal printing. Try free for 50 bills!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                size="lg"
                className="bg-gradient-to-r from-violet-600 to-purple-600 h-14 px-8 text-lg"
                onClick={handleGetStarted}
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-8 text-lg"
                onClick={() => navigate("/contact")}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Book a Demo
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-8 text-lg"
                onClick={() =>
                  document
                    .getElementById("demo")
                    .scrollIntoView({ behavior: "smooth" })
                }
              >
                Watch Demo
              </Button>
            </div>

            {/* Product Hunt Badge */}
            <div className="flex justify-center mb-8">
              <a href="https://www.producthunt.com/products/restro-ai?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-restro-ai" target="_blank" rel="noopener noreferrer">
                <img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1043247&theme=light&t=1764436989519" alt="RESTRO AI - RESTAURANT KOT | Product Hunt" style={{width: '250px', height: '54px'}} width="250" height="54" />
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-violet-600 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>



      {/* Demo Section - Screenshot Tutorial */}
      <section id="demo" className="py-20 bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-4">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-yellow-400">See It In Action</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              How BillByteKOT Works
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Simple, powerful, and designed for busy restaurants. Get started in minutes.
            </p>
          </div>

          {/* Demo Steps */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              {
                step: "1",
                title: "Create Account",
                desc: "Sign up in 30 seconds. No credit card required.",
                icon: "👤",
                color: "from-blue-500 to-cyan-500"
              },
              {
                step: "2", 
                title: "Setup Menu",
                desc: "Add your dishes with prices, categories & images.",
                icon: "🍽️",
                color: "from-green-500 to-emerald-500"
              },
              {
                step: "3",
                title: "Take Orders",
                desc: "Quick order entry with table management & KOT.",
                icon: "📝",
                color: "from-orange-500 to-amber-500"
              },
              {
                step: "4",
                title: "Print & Pay",
                desc: "Generate bills, print receipts, accept payments.",
                icon: "🧾",
                color: "from-purple-500 to-pink-500"
              }
            ].map((item, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center hover:bg-white/20 transition-all">
                <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl`}>
                  {item.icon}
                </div>
                <div className="text-xs font-bold text-violet-300 mb-2">STEP {item.step}</div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-gray-300 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Feature Screenshots */}
          <div className="mt-16 max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-all">
                <div className="aspect-video bg-gradient-to-br from-violet-600/30 to-purple-600/30 rounded-lg mb-4 flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 text-violet-300" />
                    <span className="text-sm text-violet-200">Dashboard</span>
                  </div>
                </div>
                <h4 className="font-semibold mb-1">Real-time Dashboard</h4>
                <p className="text-sm text-gray-400">Track sales, orders, and revenue at a glance</p>
              </div>
              
              <div className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-all">
                <div className="aspect-video bg-gradient-to-br from-green-600/30 to-emerald-600/30 rounded-lg mb-4 flex items-center justify-center">
                  <div className="text-center">
                    <Package className="w-12 h-12 mx-auto mb-2 text-green-300" />
                    <span className="text-sm text-green-200">Menu</span>
                  </div>
                </div>
                <h4 className="font-semibold mb-1">Menu Management</h4>
                <p className="text-sm text-gray-400">Organize items by category with images</p>
              </div>
              
              <div className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-all">
                <div className="aspect-video bg-gradient-to-br from-orange-600/30 to-amber-600/30 rounded-lg mb-4 flex items-center justify-center">
                  <div className="text-center">
                    <Printer className="w-12 h-12 mx-auto mb-2 text-orange-300" />
                    <span className="text-sm text-orange-200">Billing</span>
                  </div>
                </div>
                <h4 className="font-semibold mb-1">Thermal Printing</h4>
                <p className="text-sm text-gray-400">6 professional receipt themes</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <Button size="lg" onClick={handleGetStarted} className="bg-white text-violet-900 hover:bg-gray-100 h-14 px-8 text-lg font-semibold">
              Try Free for 50 Bills
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-sm text-gray-400 mt-4">No credit card required • Setup in 2 minutes</p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              Why BillByteKOT AI?
            </h2>
            <p className="text-xl text-gray-600">
              The complete solution for modern restaurants
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <Card
                key={index}
                className="border-0 shadow-xl hover:shadow-2xl transition-shadow"
              >
                <CardHeader>
                  <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
                    <benefit.icon className="w-7 h-7 text-white" />
                  </div>
                  <CardTitle className="text-xl">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-20 bg-gradient-to-br from-gray-50 to-gray-100"
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to run your restaurant efficiently
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <CardHeader>
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4`}
                  >
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              Loved by Restaurants
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of happy restaurant owners
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-xl">
                <CardHeader>
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-16 h-16 rounded-full"
                    />
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-gray-600">
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 italic">"{testimonial.text}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        id="pricing"
        className="py-20 bg-gradient-to-br from-violet-50 to-purple-50"
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              Simple Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Start free, upgrade when you grow
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card
                key={index}
                className={`border-0 shadow-2xl relative ${plan.popular ? "ring-2 ring-violet-600" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl mb-4">{plan.name}</CardTitle>
                  <div className="mb-2">
                    {plan.originalPrice && (
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <span className="text-xl text-gray-400 line-through">{plan.originalPrice}</span>
                        <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded text-sm font-bold">50% OFF</span>
                      </div>
                    )}
                    <span className="text-5xl font-bold">{plan.price}</span>
                    <span className="text-gray-600 ml-2">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full h-12 ${plan.popular ? "bg-gradient-to-r from-violet-600 to-purple-600" : ""}`}
                    variant={plan.popular ? "default" : "outline"}
                    onClick={handleGetStarted}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-16">
            <h2
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-6">
            {[
              {
                q: "How does the free trial work?",
                a: "You get 7 days of full access to all premium features, completely free. No credit card required. After the trial, upgrade to Premium for just ₹499/year (50% off!).",
              },
              {
                q: "Can I use my own Razorpay account?",
                a: "Yes! You can configure your own Razorpay keys in Settings. This means payments go directly to your account.",
              },
              {
                q: "Which thermal printers are supported?",
                a: "We support all ESC/POS standard thermal printers (58mm & 80mm). Choose from 6 professional receipt themes including Classic, Modern, Elegant, and more.",
              },
              {
                q: "Can I add multiple staff members?",
                a: "Yes! Add unlimited staff with roles: Admin, Cashier, Waiter, and Kitchen. Each role has specific permissions.",
              },
              {
                q: "Is my data secure?",
                a: "Absolutely! We use bank-grade encryption, secure MongoDB storage, and HTTPS. Your data is completely safe with 99.9% uptime guarantee.",
              },
              {
                q: "Can I use BillByteKOT AI on mobile?",
                a: "Yes! It works on any device. Join our early access program to get the Android app from Google Play Store when it launches!",
              },
              {
                q: "What's included in the Premium plan?",
                a: "Unlimited bills, 6 thermal print formats, advanced AI analytics, priority 24/7 support, multi-currency, and all future features. Just ₹499/year!",
              },
            ].map((faq, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">{faq.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Early Access Android App Section */}
      <section id="app" className="py-20 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full">
                  <Rocket className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">Early Access Program</span>
                </div>
                
                <h2 className="text-4xl md:text-5xl font-bold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                  Get the
                  <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent"> Android App</span>
                </h2>
                
                <p className="text-xl text-gray-600">
                  Be among the first to experience BillByteKOT AI on your Android device. 
                  Join our early access program and get exclusive benefits!
                </p>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Gift className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Exclusive Early Bird Pricing</h4>
                      <p className="text-gray-600 text-sm">Get 50% off on your first year subscription</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Bell className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Priority Feature Requests</h4>
                      <p className="text-gray-600 text-sm">Your feedback shapes the app's future</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Lifetime Early Adopter Badge</h4>
                      <p className="text-gray-600 text-sm">Special recognition in the app forever</p>
                    </div>
                  </div>
                </div>

                {/* Early Access Form */}
                <div className="bg-white p-6 rounded-2xl shadow-xl border border-green-100">
                  <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-green-600" />
                    Join Early Access Waitlist
                  </h4>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (earlyAccessEmail) {
                      toast.success("🎉 You're on the list! We'll notify you when the app launches.");
                      setEarlyAccessEmail("");
                    }
                  }} className="space-y-3">
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      value={earlyAccessEmail}
                      onChange={(e) => setEarlyAccessEmail(e.target.value)}
                      className="h-12"
                      required
                    />
                    <Button type="submit" className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 text-lg">
                      <Download className="w-5 h-5 mr-2" />
                      Join Early Access
                    </Button>
                  </form>
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    🔒 No spam. We'll only notify you about the app launch.
                  </p>
                </div>
              </div>

              {/* Right Content - Phone Mockup */}
              <div className="relative">
                <div className="relative mx-auto w-72 md:w-80">
                  {/* Phone Frame */}
                  <div className="bg-gray-900 rounded-[3rem] p-3 shadow-2xl">
                    <div className="bg-gray-800 rounded-[2.5rem] p-2">
                      {/* Screen */}
                      <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-[2rem] overflow-hidden aspect-[9/19]">
                        {/* Status Bar */}
                        <div className="bg-black/20 px-6 py-2 flex justify-between items-center text-white text-xs">
                          <span>9:41</span>
                          <div className="flex gap-1">
                            <div className="w-4 h-2 bg-white/80 rounded-sm"></div>
                            <div className="w-4 h-2 bg-white/80 rounded-sm"></div>
                            <div className="w-6 h-3 bg-white/80 rounded-sm"></div>
                          </div>
                        </div>
                        
                        {/* App Content Preview */}
                        <div className="p-4 space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                              <ChefHat className="w-7 h-7 text-white" />
                            </div>
                            <div>
                              <h3 className="text-white font-bold text-lg">BillByteKOT AI</h3>
                              <p className="text-white/70 text-xs">Smart Restaurant Billing</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/10 backdrop-blur rounded-xl p-3">
                              <p className="text-white/70 text-xs">Today's Sales</p>
                              <p className="text-white font-bold text-xl">₹24,500</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur rounded-xl p-3">
                              <p className="text-white/70 text-xs">Orders</p>
                              <p className="text-white font-bold text-xl">47</p>
                            </div>
                          </div>
                          
                          <div className="bg-white/10 backdrop-blur rounded-xl p-3">
                            <p className="text-white/70 text-xs mb-2">Quick Actions</p>
                            <div className="grid grid-cols-4 gap-2">
                              {['New Order', 'Menu', 'Tables', 'Reports'].map((item, i) => (
                                <div key={i} className="bg-white/20 rounded-lg p-2 text-center">
                                  <div className="w-6 h-6 bg-white/30 rounded-lg mx-auto mb-1"></div>
                                  <p className="text-white text-[8px]">{item}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="bg-white/10 backdrop-blur rounded-xl p-3">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-white/70 text-xs">Active Orders</p>
                              <span className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full">3 pending</span>
                            </div>
                            <div className="space-y-2">
                              {[1, 2].map((_, i) => (
                                <div key={i} className="bg-white/10 rounded-lg p-2 flex justify-between items-center">
                                  <div>
                                    <p className="text-white text-xs font-medium">Table {i + 1}</p>
                                    <p className="text-white/60 text-[10px]">2 items</p>
                                  </div>
                                  <span className="text-white text-xs">₹450</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Floating Elements */}
                  <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl p-3 animate-bounce">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">Coming Soon</p>
                        <p className="text-[10px] text-gray-500">Play Store</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center">
                        <Star className="w-5 h-5 text-violet-600 fill-violet-600" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">4.9 Rating</p>
                        <p className="text-[10px] text-gray-500">Beta Testers</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Desktop App Download Section */}
      <DesktopDownloadSection />

      {/* CTA Section */}
      <section
        id="demo"
        className="py-20 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 text-white"
      >
        <div className="container mx-auto px-4 text-center">
          <h2
            className="text-4xl md:text-5xl font-bold mb-6"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            Ready to Transform Your Restaurant?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join 10,000+ restaurants using BillByteKOT AI. Start your 7-day free trial today!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              size="lg"
              className="bg-white text-violet-600 hover:bg-gray-100 h-14 px-8 text-lg"
              onClick={handleGetStarted}
            >
              Start 7-Day Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-8 text-lg border-white text-white hover:bg-white/10"
              onClick={() => document.getElementById("app").scrollIntoView({ behavior: "smooth" })}
            >
              <Smartphone className="w-5 h-5 mr-2" />
              Get Android App
            </Button>
          </div>

          <form onSubmit={handleWaitlist} className="max-w-md mx-auto">
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/60"
                required
              />
              <Button
                type="submit"
                className="bg-white text-violet-600 hover:bg-gray-100 h-12 px-6"
              >
                Join Waitlist
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <ChefHat className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">BillByteKOT AI</span>
              </div>
              <p className="text-gray-400 text-sm">
                AI-powered restaurant billing system trusted by 10,000+
                restaurants worldwide.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#features" className="hover:text-white">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-white">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#testimonials" className="hover:text-white">
                    Reviews
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-white">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="/blog" className="hover:text-white">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="/contact" className="hover:text-white">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="./PrivacyPolicy" className="hover:text-white">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Cookie Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    GDPR
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>
              © 2024 BillByteKOT AI. All rights reserved. Made with ❤️ in India
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
