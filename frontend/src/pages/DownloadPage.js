import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { toast } from "sonner";
import {
  ChefHat,
  Monitor,
  Apple,
  Download,
  ArrowLeft,
  Zap,
  Printer,
  Shield,
  Globe,
  Bell,
  Smartphone,
} from "lucide-react";

const DownloadPage = () => {
  const navigate = useNavigate();

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

  // Download instructions - Use web app instead
  const downloadUrls = {
    windows: "web",
    mac: "web",
    linux: "web",
    android: "https://play.google.com/store/apps/details?id=com.billbytekot.app",
  };

  const handleDownload = (platform) => {
    if (platform === "android") {
      window.open(downloadUrls.android, '_blank');
      toast.success("Opening Google Play Store...");
    } else {
      // For desktop, show instructions to use web app
      toast.info("Use the web app for best experience! Click 'Get Started' to begin.", {
        duration: 5000
      });
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    }
  };

  const features = [
    { icon: Zap, title: "Lightning Fast", desc: "Native performance, instant startup" },
    { icon: Printer, title: "Direct Printing", desc: "Print receipts directly to thermal printer" },
    { icon: Shield, title: "Secure", desc: "Your data stays on your computer" },
    { icon: Globe, title: "Works Offline", desc: "Continue billing even without internet" },
    { icon: Bell, title: "Notifications", desc: "Get alerts for new orders" },
    { icon: Monitor, title: "Multi-Monitor", desc: "Use on multiple screens" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Home
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg">BillByteKOT</span>
            </div>
            <Button onClick={() => navigate("/login")} variant="outline">
              Login
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full mb-4">
              <Download className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">Download Center</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              Get Started with
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> BillByteKOT</span>
            </h1>
            <p className="text-xl text-gray-600">
              Use our powerful web app on any device - no download required!
            </p>
          </div>

          {/* Download Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {/* Windows */}
            <Card className={`border-2 transition-all hover:shadow-xl ${os === "windows" ? "border-blue-500 bg-blue-50/50" : "border-gray-200"}`}>
              <CardContent className="p-6 text-center">
                {os === "windows" && (
                  <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full inline-block mb-3">
                    Recommended
                  </div>
                )}
                <Monitor className="w-16 h-16 mx-auto mb-4 text-blue-600" />
                <h3 className="text-xl font-bold mb-2">Windows</h3>
                <p className="text-sm text-gray-500 mb-4">Windows 10/11 • 64-bit</p>
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => handleDownload("windows")}
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Use Web App
                </Button>
                <p className="text-xs text-gray-400 mt-2">Works in any browser</p>
              </CardContent>
            </Card>

            {/* macOS */}
            <Card className={`border-2 transition-all hover:shadow-xl ${os === "mac" ? "border-blue-500 bg-blue-50/50" : "border-gray-200"}`}>
              <CardContent className="p-6 text-center">
                {os === "mac" && (
                  <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full inline-block mb-3">
                    Recommended
                  </div>
                )}
                <Apple className="w-16 h-16 mx-auto mb-4 text-gray-700" />
                <h3 className="text-xl font-bold mb-2">macOS</h3>
                <p className="text-sm text-gray-500 mb-4">macOS 10.15+ • Intel & M1/M2</p>
                <Button
                  className="w-full bg-gray-800 hover:bg-gray-900"
                  onClick={() => handleDownload("mac")}
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Use Web App
                </Button>
                <p className="text-xs text-gray-400 mt-2">Works in any browser</p>
              </CardContent>
            </Card>

            {/* Linux */}
            <Card className={`border-2 transition-all hover:shadow-xl ${os === "linux" ? "border-blue-500 bg-blue-50/50" : "border-gray-200"}`}>
              <CardContent className="p-6 text-center">
                {os === "linux" && (
                  <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full inline-block mb-3">
                    Recommended
                  </div>
                )}
                <Monitor className="w-16 h-16 mx-auto mb-4 text-orange-600" />
                <h3 className="text-xl font-bold mb-2">Linux</h3>
                <p className="text-sm text-gray-500 mb-4">Ubuntu 20.04+ • AppImage</p>
                <Button
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  onClick={() => handleDownload("linux")}
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Use Web App
                </Button>
                <p className="text-xs text-gray-400 mt-2">Works in any browser</p>
              </CardContent>
            </Card>
          </div>

          {/* Mobile Notice */}
          {isMobile && (
            <Card className="border-2 border-green-200 bg-green-50 mb-8">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Smartphone className="w-10 h-10 text-green-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-lg mb-2">On Mobile?</h3>
                    <p className="text-gray-600 mb-4">
                      The desktop app is for Windows, Mac, and Linux computers. 
                      You can use BillByteKOT on mobile through our web app.
                    </p>
                    <Button onClick={() => navigate("/login")} className="bg-green-600">
                      Use Web App
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Features */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-center mb-8">Desktop App Features</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {features.map((feature, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-white rounded-xl shadow-sm">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{feature.title}</h4>
                    <p className="text-sm text-gray-600">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Version Info */}
          <div className="text-center text-gray-500 text-sm">
            <p>Version 1.0.0 • Released November 2024</p>
            <p className="mt-1">Connects to billbytekot.in • Auto-updates enabled</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadPage;
