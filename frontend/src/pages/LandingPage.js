import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "../App";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { toast } from "sonner";
import LeadCapturePopup from "../components/LeadCapturePopup";
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
  Mail,
} from "lucide-react";

// Custom hook for scroll animations
const useScrollAnimation = () => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            entry.target.classList.add('animate-fade-in-up');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);
};

// Animated Counter Component
const AnimatedCounter = ({ end, duration = 2000, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );

    if (countRef.current) {
      observer.observe(countRef.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    let startTime;
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [isVisible, end, duration]);

  return <span ref={countRef}>{count}{suffix}</span>;
};

// Desktop App Download Section Component
const DesktopDownloadSection = () => {
  const navigate = useNavigate();
  const [appVersions, setAppVersions] = useState({ android: null, windows: null });
  
  // Fetch latest app versions from API
  useEffect(() => {
    const fetchAppVersions = async () => {
      try {
        const [androidRes, windowsRes] = await Promise.allSettled([
          axios.get(`${API}/app/latest/android`),
          axios.get(`${API}/app/latest/windows`)
        ]);
        
        setAppVersions({
          android: androidRes.status === 'fulfilled' ? androidRes.value.data : null,
          windows: windowsRes.status === 'fulfilled' ? windowsRes.value.data : null
        });
      } catch (error) {
        console.error('Failed to fetch app versions', error);
      }
    };
    fetchAppVersions();
  }, []);
  
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
  
  const handleGetStarted = () => {
    navigate("/login");
    toast.success("Get started with BillByteKOT!");
  };
  
  const handleDownloadWindows = () => {
    if (appVersions.windows?.download_url) {
      // Handle both relative and absolute URLs
      let downloadUrl = appVersions.windows.download_url;
      if (downloadUrl.startsWith('/api/')) {
        // Relative URL - prepend backend URL
        const backendUrl = API.replace('/api', '');
        downloadUrl = backendUrl + downloadUrl;
      }
      window.open(downloadUrl, '_blank');
      toast.success("Downloading BillByteKOT for Windows...");
    } else {
      toast.error("Windows app not available yet");
    }
  };
  
  const handleDownloadAndroid = () => {
    if (appVersions.android?.download_url) {
      // Handle both relative and absolute URLs
      let downloadUrl = appVersions.android.download_url;
      if (downloadUrl.startsWith('/api/')) {
        // Relative URL - prepend backend URL
        const backendUrl = API.replace('/api', '');
        downloadUrl = backendUrl + downloadUrl;
      }
      window.open(downloadUrl, '_blank');
      toast.success("Downloading BillByteKOT for Android...");
    } else {
      toast.error("Android app not available yet");
    }
  };
  
  return (
    <section id="desktop-app" className="py-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full mb-4">
              <Monitor className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">Desktop & Mobile Apps Available</span>
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
                    {os === "windows" ? (
                      <>
                        <Button 
                          className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-lg mb-2"
                          onClick={handleDownloadWindows}
                        >
                          <Download className="w-5 h-5 mr-2" />
                          Download for Windows
                        </Button>
                        <Button 
                          variant="outline"
                          className="w-full h-10"
                          onClick={handleGetStarted}
                        >
                          <Globe className="w-4 h-4 mr-2" />
                          Or use Web App
                        </Button>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          Desktop app: ~80MB • Web app: No download needed
                        </p>
                      </>
                    ) : (
                      <>
                        <Button 
                          className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-lg"
                          onClick={handleGetStarted}
                        >
                          <Rocket className="w-5 h-5 mr-2" />
                          Get Started on {os === "mac" ? "macOS" : "Linux"}
                        </Button>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          Works in any browser • No download required • Instant access
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
              
              {/* Platform Support */}
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-3 text-center">Available on:</p>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={handleDownloadWindows}
                    className="text-center p-2 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <Monitor className="w-7 h-7 mx-auto mb-1 text-blue-600" />
                    <p className="text-xs font-medium">Windows</p>
                    <p className="text-[10px] text-blue-600">{appVersions.windows ? `v${appVersions.windows.version}` : 'Download'}</p>
                  </button>
                  <button
                    onClick={handleDownloadAndroid}
                    className="text-center p-2 rounded-lg hover:bg-green-50 transition-colors"
                  >
                    <Smartphone className="w-7 h-7 mx-auto mb-1 text-green-600" />
                    <p className="text-xs font-medium">Android</p>
                    <p className="text-[10px] text-green-600">{appVersions.android ? `v${appVersions.android.version}` : 'APK'}</p>
                  </button>
                  <button
                    onClick={handleGetStarted}
                    className="text-center p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Apple className="w-7 h-7 mx-auto mb-1 text-gray-700" />
                    <p className="text-xs font-medium">macOS</p>
                    <p className="text-[10px] text-gray-600">Web App</p>
                  </button>
                  <button
                    onClick={handleGetStarted}
                    className="text-center p-2 rounded-lg hover:bg-orange-50 transition-colors"
                  >
                    <Globe className="w-7 h-7 mx-auto mb-1 text-orange-600" />
                    <p className="text-xs font-medium">Web</p>
                    <p className="text-[10px] text-gray-600">Any Device</p>
                  </button>
                </div>
                <p className="text-xs text-gray-500 text-center mt-3">Windows & Android: Native apps • Others: Use web app</p>
              </div>
              
              {/* Quick Start Button */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white text-center">
                <h3 className="text-xl font-bold mb-2">Ready to Get Started?</h3>
                <p className="text-blue-100 mb-4">Use BillByteKOT web app on any device - no download needed!</p>
                <Button 
                  onClick={handleGetStarted}
                  className="w-full bg-white text-blue-600 hover:bg-blue-50 font-semibold h-12"
                >
                  <Rocket className="w-5 h-5 mr-2" />
                  Start Free Trial Now
                </Button>
                <p className="text-xs text-blue-200 mt-3">7-day free trial • No credit card required</p>
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
                  Connects to billbytekot.in • Auto-updates enabled
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// New Year Special Section Component with working countdown
const NewYearSpecialSection = ({ navigate }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  
  useEffect(() => {
    const calculateTimeLeft = () => {
      const endDate = new Date('2026-01-01T23:59:59');
      const now = new Date();
      const difference = endDate - now;
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };
    
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="new-year-offer" className="py-16 bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left Content */}
            <div className="text-white space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur rounded-full animate-bounce">
                <span className="text-2xl">🎉</span>
                <span className="font-bold">NEW YEAR SPECIAL</span>
                <span className="text-2xl">🎉</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-black leading-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                New Year 2026
                <span className="block text-yellow-200">Special Deal!</span>
              </h2>
              
              <p className="text-xl text-white/90">
                Start 2026 with the best restaurant management system at an amazing price!
              </p>
              
              <div className="flex items-center gap-4 flex-wrap">
                <div className="text-center">
                  <div className="text-sm text-white/70 line-through">Regular Price</div>
                  <div className="text-2xl font-bold text-white/70">₹999/year</div>
                </div>
                <ArrowRight className="w-8 h-8 text-yellow-200 animate-pulse hidden sm:block" />
                <div className="text-center bg-white/20 backdrop-blur rounded-xl p-4">
                  <div className="text-sm text-yellow-200 font-bold">New Year Price</div>
                  <div className="text-5xl font-black text-white">₹599</div>
                  <div className="text-sm text-white/80">per year</div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {["Unlimited Bills", "All Features", "Priority Support", "40% OFF"].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white/10 backdrop-blur px-3 py-2 rounded-full">
                    <CheckCircle className="w-4 h-4 text-yellow-200" />
                    <span className="text-sm font-medium">{item}</span>
                  </div>
                ))}
              </div>
              
              <Button
                size="lg"
                className="bg-white text-red-600 hover:bg-yellow-100 font-bold h-14 px-8 text-lg shadow-2xl hover-lift w-full sm:w-auto"
                onClick={() => navigate("/login")}
              >
                <Gift className="w-5 h-5 mr-2" />
                Get ₹599/Year Deal Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              <p className="text-sm text-white/70">
                ⏰ Offer valid on January 1, 2026 ONLY • No hidden charges • Cancel anytime
              </p>
            </div>
            
            {/* Right Content - Countdown & Benefits */}
            <div className="space-y-6">
              {/* Countdown Card */}
              <Card className="bg-white/10 backdrop-blur border-white/20 text-white overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-center text-xl">⏰ Offer Ends In</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-black/30 rounded-lg p-2 sm:p-3">
                      <div className="text-2xl sm:text-3xl md:text-4xl font-mono font-black">
                        {String(timeLeft.days).padStart(2, '0')}
                      </div>
                      <div className="text-xs text-white/70">Days</div>
                    </div>
                    <div className="bg-black/30 rounded-lg p-2 sm:p-3">
                      <div className="text-2xl sm:text-3xl md:text-4xl font-mono font-black">
                        {String(timeLeft.hours).padStart(2, '0')}
                      </div>
                      <div className="text-xs text-white/70">Hours</div>
                    </div>
                    <div className="bg-black/30 rounded-lg p-2 sm:p-3">
                      <div className="text-2xl sm:text-3xl md:text-4xl font-mono font-black">
                        {String(timeLeft.minutes).padStart(2, '0')}
                      </div>
                      <div className="text-xs text-white/70">Minutes</div>
                    </div>
                    <div className="bg-black/30 rounded-lg p-2 sm:p-3">
                      <div className="text-2xl sm:text-3xl md:text-4xl font-mono font-black animate-pulse">
                        {String(timeLeft.seconds).padStart(2, '0')}
                      </div>
                      <div className="text-xs text-white/70">Seconds</div>
                    </div>
                  </div>
                  <p className="text-center text-sm text-white/80 mt-4">
                    🎯 Limited time New Year offer!
                  </p>
                </CardContent>
              </Card>
              
              {/* What You Get Card */}
              <Card className="bg-white shadow-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Gift className="w-5 h-5 text-red-500" />
                    What You Get for ₹599/Year
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3">
                  {[
                    { icon: "📊", text: "Unlimited Bills & Orders" },
                    { icon: "🖨️", text: "6 Thermal Printer Themes" },
                    { icon: "📱", text: "WhatsApp Integration" },
                    { icon: "🤖", text: "AI-Powered Analytics" },
                    { icon: "👥", text: "Multi-Staff Management" },
                    { icon: "🎉", text: "New Year Special Badge" },
                    { icon: "📞", text: "Priority 24/7 Support" },
                    { icon: "🔄", text: "Free Updates Forever" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                      <span className="text-lg sm:text-xl">{item.icon}</span>
                      <span className="font-medium text-gray-800 text-sm sm:text-base">{item.text}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// New Year Campaign Banner Component
const NewYearBanner = () => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  
  useEffect(() => {
    const calculateTimeLeft = () => {
      const endDate = new Date('2026-01-01T23:59:59');
      const now = new Date();
      const difference = endDate - now;
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };
    
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white py-3 animate-gradient" style={{ backgroundSize: '200% 200%' }}>
      {/* Animated sparkles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: Math.random() * 0.7 + 0.3
            }}
          />
        ))}
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6 text-center">
          {/* Fire emoji with animation */}
          <div className="flex items-center gap-2 animate-bounce">
            <span className="text-2xl">🎉</span>
            <span className="font-bold text-lg md:text-xl tracking-wide">NEW YEAR SPECIAL</span>
            <span className="text-2xl">🎉</span>
          </div>
          
          {/* Price highlight */}
          <div className="flex items-center gap-2">
            <span className="text-sm md:text-base line-through opacity-70">₹999/year</span>
            <div className="relative">
              <span className="text-2xl md:text-3xl font-black animate-pulse-glow px-3 py-1 bg-white/20 rounded-lg">
                ₹599/year
              </span>
              <span className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-bold px-2 py-0.5 rounded-full animate-bounce">
                40% OFF
              </span>
            </div>
          </div>
          
          {/* Countdown timer */}
          <div className="flex items-center gap-1 text-sm md:text-base">
            <span className="opacity-80">Ends in:</span>
            <div className="flex gap-1">
              <span className="bg-black/30 px-2 py-1 rounded font-mono font-bold">{String(timeLeft.days).padStart(2, '0')}d</span>
              <span className="bg-black/30 px-2 py-1 rounded font-mono font-bold">{String(timeLeft.hours).padStart(2, '0')}h</span>
              <span className="bg-black/30 px-2 py-1 rounded font-mono font-bold">{String(timeLeft.minutes).padStart(2, '0')}m</span>
              <span className="bg-black/30 px-2 py-1 rounded font-mono font-bold animate-pulse">{String(timeLeft.seconds).padStart(2, '0')}s</span>
            </div>
          </div>
          
          {/* CTA Button */}
          <Button
            size="sm"
            className="bg-white text-red-600 hover:bg-yellow-100 font-bold px-4 py-2 shadow-lg hover-lift"
            onClick={() => navigate("/login")}
          >
            <Gift className="w-4 h-4 mr-1" />
            Claim Now
          </Button>
        </div>
        
        {/* Scrolling text */}
        <div className="mt-2 overflow-hidden">
          <div className="animate-marquee whitespace-nowrap text-xs opacity-80">
            <span className="mx-4">🎉 Limited Time Offer</span>
            <span className="mx-4">✨ Full Premium Features</span>
            <span className="mx-4">🚀 Unlimited Bills</span>
            <span className="mx-4">💳 All Payment Methods</span>
            <span className="mx-4">🖨️ Thermal Printing</span>
            <span className="mx-4">📊 Advanced Analytics</span>
            <span className="mx-4">🎉 Limited Time Offer</span>
            <span className="mx-4">✨ Full Premium Features</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [saleOffer, setSaleOffer] = useState(null);
  
  // Initialize scroll animations
  useScrollAnimation();

  // Fetch sale offer
  useEffect(() => {
    const fetchSaleOffer = async () => {
      try {
        const response = await axios.get(`${API}/sale-offer`);
        if (response.data?.enabled) {
          setSaleOffer(response.data);
        }
      } catch (error) {
        // No sale offer active
      }
    };
    fetchSaleOffer();
  }, []);

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
      name: "New Year Special",
      price: "₹599",
      period: "per year",
      originalPrice: "₹999",
      badge: "40% OFF - Jan 1 Only",
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
        "WhatsApp integration",
        "New Year special badge",
      ],
      cta: "🎉 Get ₹599/Year Deal",
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
      {/* Dynamic Sale Offer Banner */}
      {saleOffer && saleOffer.enabled && (
        <div className={`relative overflow-hidden bg-gradient-to-r ${saleOffer.bg_color || 'from-red-500 to-orange-500'} text-white py-3`}>
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center gap-4 flex-wrap">
              {saleOffer.badge_text && (
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold animate-pulse">
                  {saleOffer.badge_text}
                </span>
              )}
              <div className="flex items-center gap-3">
                <Gift className="w-5 h-5" />
                <span className="font-semibold">{saleOffer.title}</span>
                {saleOffer.subtitle && (
                  <span className="text-white/90 hidden sm:inline">- {saleOffer.subtitle}</span>
                )}
              </div>
              {saleOffer.discount_text && (
                <span className="px-3 py-1 bg-white text-red-600 rounded-full text-sm font-bold">
                  {saleOffer.discount_text}
                </span>
              )}
              <Button
                size="sm"
                onClick={() => navigate('/login')}
                className="bg-white text-gray-900 hover:bg-gray-100 text-xs"
              >
                Get Offer <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* New Year Campaign Banner - Removed, now controlled from Ops Controls */}
      {/* To show a banner, enable it from Ops Controls > Promotions */}
      
      {/* Lead Capture Popup */}
      <LeadCapturePopup />
      
      {/* Header/Navbar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <nav className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-white" aria-hidden="true" />
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
        {/* Animated background elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-violet-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float-slow"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float-slow" style={{animationDelay: '2s'}}></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-100 rounded-full mb-6 animate-fade-in-down">
              <Sparkles className="w-4 h-4 text-violet-600 animate-pulse" aria-hidden="true" />
              <span className="text-sm font-medium text-violet-600">
                AI-Powered Restaurant Management
              </span>
            </div>

            <h1
              className="text-5xl md:text-7xl font-bold mb-6 leading-tight animate-fade-in-up"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              Smart Restaurant
              <span className="block bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-transparent text-gradient-animate">
                Billing Made Simple
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto font-light animate-fade-in-up delay-200">
              AI-powered POS system trusted by 500+ restaurants. 
              <span className="font-semibold text-red-600"> New Year Special: ₹599/year (40% OFF)!</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in-up delay-400">
              <Button
                size="lg"
                className="bg-gradient-to-r from-red-500 to-orange-500 h-14 px-8 text-lg btn-animate hover-lift animate-pulse-glow"
                onClick={handleGetStarted}
              >
                <Gift className="w-5 h-5 mr-2" />
                Get ₹599/Year Deal
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-8 text-lg hover-lift"
                onClick={() => navigate("/contact")}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Book a Demo
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-8 text-lg hover-lift"
                onClick={() =>
                  document
                    .getElementById("demo")
                    .scrollIntoView({ behavior: "smooth" })
                }
              >
                Watch Demo
              </Button>
            </div>



            {/* Stats with animated counters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto animate-fade-in-up delay-600">
              {stats.map((stat, index) => (
                <div key={index} className="text-center hover-scale">
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

      {/* Quick Links Section for Internal Linking */}
      <section className="py-12 bg-gray-50 border-y border-gray-200">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8 text-gray-900">
              Explore BillByteKOT Restaurant Solutions
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <a href="/blog" className="flex flex-col items-center p-4 bg-white rounded-lg hover:shadow-md transition-shadow">
                <Package className="w-8 h-8 text-violet-600 mb-2" />
                <span className="text-sm font-medium text-gray-900 text-center">Restaurant Blog</span>
              </a>
              <a href="/download" className="flex flex-col items-center p-4 bg-white rounded-lg hover:shadow-md transition-shadow">
                <Download className="w-8 h-8 text-blue-600 mb-2" />
                <span className="text-sm font-medium text-gray-900 text-center">Download App</span>
              </a>
              <a href="/contact" className="flex flex-col items-center p-4 bg-white rounded-lg hover:shadow-md transition-shadow">
                <MessageCircle className="w-8 h-8 text-green-600 mb-2" />
                <span className="text-sm font-medium text-gray-900 text-center">Contact Sales</span>
              </a>
              <a href="/login" className="flex flex-col items-center p-4 bg-white rounded-lg hover:shadow-md transition-shadow">
                <Users className="w-8 h-8 text-orange-600 mb-2" />
                <span className="text-sm font-medium text-gray-900 text-center">Login / Signup</span>
              </a>
              <a href="/privacy" className="flex flex-col items-center p-4 bg-white rounded-lg hover:shadow-md transition-shadow">
                <Shield className="w-8 h-8 text-purple-600 mb-2" />
                <span className="text-sm font-medium text-gray-900 text-center">Privacy Policy</span>
              </a>
              <a href="#pricing" className="flex flex-col items-center p-4 bg-white rounded-lg hover:shadow-md transition-shadow">
                <DollarSign className="w-8 h-8 text-pink-600 mb-2" />
                <span className="text-sm font-medium text-gray-900 text-center">View Pricing</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Special Offer Section - Only show if sale offer is enabled */}
      {saleOffer && saleOffer.enabled && <NewYearSpecialSection navigate={navigate} />}

      {/* SEO Content Section - Main Homepage Content */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="my-8 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Related Resources</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <a href="/blog" className="flex items-center gap-3 p-3 bg-white rounded-lg hover:shadow-md transition-shadow">
                  <Package className="w-6 h-6 text-violet-600 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900">Restaurant Management Blog</div>
                    <div className="text-sm text-gray-600">Tips & guides for restaurants</div>
                  </div>
                </a>
                <a href="/download" className="flex items-center gap-3 p-3 bg-white rounded-lg hover:shadow-md transition-shadow">
                  <Download className="w-6 h-6 text-blue-600 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900">Download Desktop App</div>
                    <div className="text-sm text-gray-600">Windows, Mac & Linux</div>
                  </div>
                </a>
                <a href="/contact" className="flex items-center gap-3 p-3 bg-white rounded-lg hover:shadow-md transition-shadow">
                  <MessageCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900">Contact Support</div>
                    <div className="text-sm text-gray-600">Get help from our team</div>
                  </div>
                </a>
                <a href="/privacy" className="flex items-center gap-3 p-3 bg-white rounded-lg hover:shadow-md transition-shadow">
                  <Shield className="w-6 h-6 text-purple-600 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900">Privacy & Security</div>
                    <div className="text-sm text-gray-600">Your data is safe with us</div>
                  </div>
                </a>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mt-8 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-violet-600 to-purple-600 h-12 px-6"
                onClick={handleGetStarted}
              >
                Start Free Trial Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-6"
                onClick={() => navigate("/pricing")}
              >
                View Pricing
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-6"
                onClick={() => navigate("/contact")}
              >
                Contact Sales
              </Button>
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
              <div 
                key={i} 
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center hover:bg-white/20 transition-all card-hover animate-on-scroll"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl hover-bounce`}>
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
              <div className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-all card-hover animate-on-scroll">
                <div className="aspect-video bg-gradient-to-br from-violet-600/30 to-purple-600/30 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                  <img 
                    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 225'%3E%3Crect fill='%237c3aed' width='400' height='225'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='20' fill='white'%3EDashboard%3C/text%3E%3C/svg%3E"
                    alt="Restaurant billing software dashboard with real-time sales analytics and order tracking"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <h4 className="font-semibold mb-1">Real-time Dashboard</h4>
                <p className="text-sm text-gray-400">Track sales, orders, and revenue at a glance</p>
              </div>
              
              <div className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-all card-hover animate-on-scroll" style={{animationDelay: '100ms'}}>
                <div className="aspect-video bg-gradient-to-br from-green-600/30 to-emerald-600/30 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                  <img 
                    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 225'%3E%3Crect fill='%2310b981' width='400' height='225'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='20' fill='white'%3EMenu%3C/text%3E%3C/svg%3E"
                    alt="Restaurant menu management system with categories and pricing for Indian restaurants"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <h4 className="font-semibold mb-1">Menu Management</h4>
                <p className="text-sm text-gray-400">Organize items by category with images</p>
              </div>
              
              <div className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-all card-hover animate-on-scroll" style={{animationDelay: '200ms'}}>
                <div className="aspect-video bg-gradient-to-br from-orange-600/30 to-amber-600/30 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                  <img 
                    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 225'%3E%3Crect fill='%23f97316' width='400' height='225'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='20' fill='white'%3EThermal Print%3C/text%3E%3C/svg%3E"
                    alt="Thermal printer receipt templates for restaurant billing with GST compliance"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
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
              Why Choose BillByteKOT Restaurant POS System?
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

      {/* Comparison Section - Target Comparison Keywords */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                BillByteKOT vs Traditional POS Systems
              </h2>
              <p className="text-xl text-gray-600">
                See why restaurants are switching to BillByteKOT
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* BillByteKOT Column */}
              <Card className="border-2 border-violet-600 shadow-2xl">
                <CardHeader className="bg-gradient-to-r from-violet-600 to-purple-600 text-white">
                  <CardTitle className="text-2xl text-center">BillByteKOT</CardTitle>
                  <p className="text-center text-violet-100">Modern Cloud-Based Solution</p>
                </CardHeader>
                <CardContent className="pt-6">
                  <ul className="space-y-4">
                    {[
                      "₹599/year - New Year Special (40% OFF)",
                      "7-day free trial, no credit card",
                      "Cloud-based - Access anywhere",
                      "Automatic updates included",
                      "WhatsApp integration built-in",
                      "Multi-currency support",
                      "6 thermal printer themes",
                      "AI-powered analytics",
                      "24/7 online support",
                      "No hardware lock-in",
                      "Works on any device",
                      "GST compliant billing"
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Traditional POS Column */}
              <Card className="border-2 border-gray-300 shadow-xl opacity-90">
                <CardHeader className="bg-gray-600 text-white">
                  <CardTitle className="text-2xl text-center">Traditional POS</CardTitle>
                  <p className="text-center text-gray-200">Legacy Systems</p>
                </CardHeader>
                <CardContent className="pt-6">
                  <ul className="space-y-4">
                    {[
                      "₹50,000+ upfront cost",
                      "No trial period available",
                      "Hardware-dependent system",
                      "Paid updates & maintenance",
                      "Limited integrations",
                      "Single currency only",
                      "Basic receipt printing",
                      "Manual reporting only",
                      "Limited support hours",
                      "Locked to specific hardware",
                      "Desktop-only access",
                      "Complex GST setup"
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="text-center mt-12">
              <Button
                size="lg"
                className="bg-gradient-to-r from-violet-600 to-purple-600 h-14 px-8 text-lg"
                onClick={handleGetStarted}
              >
                Switch to BillByteKOT Today
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <p className="text-sm text-gray-600 mt-4">
                Join 500+ restaurants who made the smart switch
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-20 bg-gradient-to-br from-gray-50 to-gray-100"
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-on-scroll">
            <h2
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              Restaurant Billing Software Features
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to run your restaurant efficiently
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className={`border-0 shadow-lg card-hover animate-on-scroll`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader>
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 hover-rotate`}
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

      {/* Invoice/Receipt Showcase Section */}
      <section className="py-20 bg-white overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-on-scroll">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full mb-4 animate-bounce-in">
              <Printer className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">Professional Invoices</span>
            </div>
            <h2
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              Beautiful Invoice & Receipt
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent"> Templates</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose from multiple professional receipt themes. Print on thermal printers or send digitally via WhatsApp.
            </p>
          </div>

          {/* Invoice Cards Showcase */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Classic Invoice */}
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transform hover:scale-105 transition-transform">
              <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white text-center py-2 text-sm font-medium">
                Classic Theme
              </div>
              <div className="p-4 font-mono text-xs bg-gray-50">
                <div className="text-center border-b border-dashed border-gray-300 pb-3 mb-3">
                  <div className="font-bold text-sm">🍽️ SPICE GARDEN</div>
                  <div className="text-gray-600">123 Food Street, Mumbai</div>
                  <div className="text-gray-600">Tel: +91 98765 43210</div>
                  <div className="text-gray-500 mt-1">GSTIN: 27XXXXX1234X1Z5</div>
                </div>
                <div className="text-center text-gray-500 mb-2">
                  <div>Bill No: #1234</div>
                  <div>20/12/2025 14:30</div>
                </div>
                <div className="border-t border-b border-dashed border-gray-300 py-2 my-2">
                  <div className="flex justify-between"><span>Butter Chicken x2</span><span>₹560</span></div>
                  <div className="flex justify-between"><span>Naan x4</span><span>₹120</span></div>
                  <div className="flex justify-between"><span>Dal Makhani x1</span><span>₹220</span></div>
                  <div className="flex justify-between"><span>Lassi x2</span><span>₹100</span></div>
                </div>
                <div className="border-b border-dashed border-gray-300 pb-2 mb-2">
                  <div className="flex justify-between"><span>Subtotal</span><span>₹1,000</span></div>
                  <div className="flex justify-between text-gray-500"><span>GST (5%)</span><span>₹50</span></div>
                </div>
                <div className="flex justify-between font-bold text-sm">
                  <span>TOTAL</span><span>₹1,050</span>
                </div>
                <div className="text-center text-gray-500 mt-3 text-xs">
                  Thank you for dining with us! 🙏
                </div>
              </div>
            </div>

            {/* Modern Invoice */}
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transform hover:scale-105 transition-transform">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-center py-2 text-sm font-medium">
                Modern Theme
              </div>
              <div className="p-4 text-xs">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">UC</div>
                  <div>
                    <div className="font-bold text-sm">Urban Cafe</div>
                    <div className="text-gray-500 text-xs">Premium Dining</div>
                  </div>
                </div>
                <div className="bg-gray-100 rounded-lg p-3 mb-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Invoice #2456</span>
                    <span>Table 5</span>
                  </div>
                </div>
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">Margherita Pizza</div>
                      <div className="text-gray-500">x1</div>
                    </div>
                    <span className="font-medium">₹450</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">Pasta Alfredo</div>
                      <div className="text-gray-500">x1</div>
                    </div>
                    <span className="font-medium">₹380</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">Cold Coffee</div>
                      <div className="text-gray-500">x2</div>
                    </div>
                    <span className="font-medium">₹240</span>
                  </div>
                </div>
                <div className="border-t pt-2 space-y-1">
                  <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₹1,070</span></div>
                  <div className="flex justify-between text-gray-500"><span>GST 5%</span><span>₹53.50</span></div>
                  <div className="flex justify-between font-bold text-blue-600 text-sm pt-1">
                    <span>Total</span><span>₹1,123.50</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Minimal Invoice */}
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transform hover:scale-105 transition-transform">
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white text-center py-2 text-sm font-medium">
                Minimal Theme
              </div>
              <div className="p-4 text-xs">
                <div className="text-center mb-4">
                  <div className="text-lg font-light tracking-widest">BREW & BITE</div>
                  <div className="text-gray-400 text-xs">Coffee • Food • Vibes</div>
                </div>
                <div className="h-px bg-gray-200 my-3"></div>
                <div className="space-y-2 text-gray-700">
                  <div className="flex justify-between">
                    <span>Cappuccino</span>
                    <span>₹180</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Croissant</span>
                    <span>₹120</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avocado Toast</span>
                    <span>₹280</span>
                  </div>
                </div>
                <div className="h-px bg-gray-200 my-3"></div>
                <div className="flex justify-between text-gray-500">
                  <span>Tax</span>
                  <span>₹29</span>
                </div>
                <div className="h-px bg-gray-900 my-2"></div>
                <div className="flex justify-between font-medium text-sm">
                  <span>Total</span>
                  <span>₹609</span>
                </div>
                <div className="text-center text-gray-400 mt-4 text-xs">
                  #3789 • 20 Dec 2025
                </div>
              </div>
            </div>

            {/* Elegant Invoice */}
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transform hover:scale-105 transition-transform">
              <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white text-center py-2 text-sm font-medium">
                Elegant Theme
              </div>
              <div className="p-4 text-xs">
                <div className="text-center mb-3">
                  <div className="text-sm font-serif font-bold text-amber-800">✦ THE ROYAL KITCHEN ✦</div>
                  <div className="text-gray-500 text-xs">Fine Dining Experience</div>
                </div>
                <div className="border border-amber-200 rounded-lg p-2 mb-3 bg-amber-50">
                  <div className="text-center text-amber-800">
                    <div className="font-medium">Invoice #5678</div>
                    <div className="text-xs">December 20, 2025</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between border-b border-dotted border-gray-300 pb-1">
                    <span>Paneer Tikka</span>
                    <span>₹320</span>
                  </div>
                  <div className="flex justify-between border-b border-dotted border-gray-300 pb-1">
                    <span>Biryani Special</span>
                    <span>₹450</span>
                  </div>
                  <div className="flex justify-between border-b border-dotted border-gray-300 pb-1">
                    <span>Gulab Jamun</span>
                    <span>₹150</span>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t-2 border-amber-300">
                  <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₹920</span></div>
                  <div className="flex justify-between text-gray-500"><span>Service (10%)</span><span>₹92</span></div>
                  <div className="flex justify-between font-bold text-amber-800 text-sm mt-1">
                    <span>Grand Total</span><span>₹1,012</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features List */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Printer className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="font-semibold">Thermal Printing</div>
                <div className="text-sm text-gray-600">58mm & 80mm support</div>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold">WhatsApp Bills</div>
                <div className="text-sm text-gray-600">Send digital receipts</div>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="font-semibold">GST Compliant</div>
                <div className="text-sm text-gray-600">Auto tax calculation</div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <Button
              size="lg"
              className="bg-gradient-to-r from-green-600 to-emerald-600 h-14 px-8 text-lg"
              onClick={() => navigate("/login")}
            >
              <Printer className="w-5 h-5 mr-2" />
              Try Invoice Templates Free
            </Button>
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
              Restaurant Billing Software Reviews & Testimonials
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
              Restaurant POS Software Pricing India
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
              Restaurant Billing Software FAQ
            </h2>
          </div>

          <div className="space-y-6">
            {[
              {
                q: "How does the free trial work?",
                a: "You get 7 days of full access to all premium features, completely free. No credit card required. After the trial, upgrade to Premium for just ₹599/year with our New Year Special (40% OFF on January 1, 2026 only)!",
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
                a: "Unlimited bills, 6 thermal print formats, advanced AI analytics, priority 24/7 support, multi-currency, WhatsApp integration, and all future features. New Year Special: Just ₹599/year (40% OFF) on January 1, 2026 only!",
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
                      <h4 className="font-semibold text-gray-900">New Year Special Badge</h4>
                      <p className="text-gray-600 text-sm">Special recognition in the app</p>
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

      {/* Coming Soon - Integrations Section */}
      <section className="py-20 bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white px-6 py-2 rounded-full mb-4">
              <Rocket className="w-5 h-5" />
              <span className="font-semibold">Coming Soon</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Exciting Integrations on the Way! 🚀
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're working hard to bring you seamless integrations with India's leading food delivery platforms
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
            {/* Zomato Integration */}
            <Card className="border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </div>
                  <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
                    Q1 2025
                  </span>
                </div>
                <CardTitle className="text-2xl">Zomato Integration</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <p className="text-gray-600 mb-6">
                  Sync your menu, receive orders directly, and manage everything from one dashboard
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Auto-sync menu items and prices</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Real-time order notifications</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Unified order management</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Automatic inventory updates</span>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t">
                  <Button 
                    variant="outline" 
                    className="w-full border-red-500 text-red-600 hover:bg-red-50"
                    onClick={() => {
                      toast.success("We'll notify you when Zomato integration is ready!");
                    }}
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Notify Me
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Swiggy Integration */}
            <Card className="border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                    </svg>
                  </div>
                  <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-semibold">
                    Q1 2025
                  </span>
                </div>
                <CardTitle className="text-2xl">Swiggy Integration</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <p className="text-gray-600 mb-6">
                  Connect with Swiggy and streamline your delivery operations effortlessly
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Seamless menu synchronization</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Instant order alerts</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Centralized dashboard</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Smart inventory tracking</span>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t">
                  <Button 
                    variant="outline" 
                    className="w-full border-orange-500 text-orange-600 hover:bg-orange-50"
                    onClick={() => {
                      toast.success("We'll notify you when Swiggy integration is ready!");
                    }}
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Notify Me
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Benefits Section */}
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 max-w-4xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold text-center mb-8">
              Why These Integrations Matter 💡
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-semibold text-lg mb-2">Save Time</h4>
                <p className="text-gray-600 text-sm">
                  No more manual order entry. Orders flow directly into your system
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-semibold text-lg mb-2">Increase Revenue</h4>
                <p className="text-gray-600 text-sm">
                  Reach millions of customers on India's top food delivery platforms
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-semibold text-lg mb-2">Better Insights</h4>
                <p className="text-gray-600 text-sm">
                  Unified analytics across all channels in one dashboard
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              Want early access? Join our waitlist!
            </p>
            <Button 
              size="lg"
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white px-8"
              onClick={() => {
                document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Join Waitlist
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
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
                <li>
                  <a href="/login" className="hover:text-white">
                    Login / Sign Up
                  </a>
                </li>
                <li>
                  <a href="/download" className="hover:text-white">
                    Download
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
              <div className="mt-6 space-y-2">
                <h4 className="font-semibold mb-2">Contact Us</h4>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Mail className="w-4 h-4" />
                  <a href="mailto:support@billbytekot.in" className="hover:text-white">
                    support@billbytekot.in
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Mail className="w-4 h-4" />
                  <a href="mailto:contact@billbytekot.in" className="hover:text-white">
                    contact@billbytekot.in
                  </a>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="/privacy" className="hover:text-white">
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
                    Refund Policy
                  </a>
                </li>
              </ul>
              
              {/* Social Media Links */}
              <div className="mt-6">
                <h4 className="font-semibold mb-3">Follow Us</h4>
                <div className="flex gap-4">
                  <a 
                    href="https://www.instagram.com/billbytekot" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity"
                    aria-label="Follow us on Instagram"
                  >
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                  <a 
                    href="https://www.youtube.com/@billbytekot" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity"
                    aria-label="Subscribe on YouTube"
                  >
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                  <a 
                    href="https://twitter.com/billbytekot" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-black rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity"
                    aria-label="Follow us on X (Twitter)"
                  >
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>
                  <a 
                    href="https://www.linkedin.com/company/billbytekot" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity"
                    aria-label="Connect on LinkedIn"
                  >
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                </div>
              </div>
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
