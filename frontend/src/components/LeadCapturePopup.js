import { useState, useEffect } from "react";
import { X, Phone, Mail, CheckCircle, Download } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import axios from "axios";
import { toast } from "sonner";

const LeadCapturePopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1); // 1: form, 2: success
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    businessName: "",
  });
  const [loading, setLoading] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    // Check if user has already seen the popup
    const hasSeenPopup = localStorage.getItem("leadCaptureShown");
    const lastShown = localStorage.getItem("leadCaptureLastShown");
    const now = Date.now();
    const oneDayInMs = 24 * 60 * 60 * 1000;

    // Show popup if:
    // 1. Never shown before, OR
    // 2. Last shown more than 1 day ago
    if (!hasSeenPopup || (lastShown && now - parseInt(lastShown) > oneDayInMs)) {
      // Show popup after 3 seconds
      const timer = setTimeout(() => {
        setIsOpen(true);
        localStorage.setItem("leadCaptureShown", "true");
        localStorage.setItem("leadCaptureLastShown", now.toString());
      }, 3000);

      return () => clearTimeout(timer);
    }

    // Listen for PWA install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    // Trigger PWA install prompt after closing
    triggerPWAInstall();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Submit lead to backend
      await axios.post(`${process.env.REACT_APP_BACKEND_URL || 'https://restro-ai.onrender.com'}/api/leads`, {
        ...formData,
        source: "landing_page_popup",
        timestamp: new Date().toISOString(),
      });

      setStep(2);
      toast.success("Thank you! Our team will contact you soon.");

      // Trigger PWA install after successful submission
      setTimeout(() => {
        triggerPWAInstall();
      }, 2000);
    } catch (error) {
      console.error("Error submitting lead:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const triggerPWAInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          console.log("User accepted the install prompt");
          toast.success("App installed successfully!");
        } else {
          console.log("User dismissed the install prompt");
          // Show alternative download options
          showAlternativeDownload();
        }
        setDeferredPrompt(null);
      });
    } else {
      // PWA not available, show alternative download
      showAlternativeDownload();
    }
  };

  const showAlternativeDownload = () => {
    // Check if on mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Show instructions for adding to home screen
      toast.info("Add to Home Screen: Tap the share button and select 'Add to Home Screen'", {
        duration: 5000,
      });
    } else {
      // Desktop - show download button
      const isWindows = navigator.platform.toLowerCase().includes('win');
      if (isWindows) {
        toast.info("Download our Windows app for the best experience!", {
          duration: 5000,
          action: {
            label: "Download",
            onClick: () => {
              window.open("https://github.com/shivshankar9/restro-ai/releases/download/v1.3.0/RestoBill-Setup-1.3.0-win.exe", "_blank");
            }
          }
        });
      }
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-in zoom-in duration-300">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {step === 1 ? (
          // Step 1: Lead Capture Form
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full mb-4">
                <Download className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Get BillByteKOT Free!
              </h2>
              <p className="text-gray-600">
                Start your 7-day free trial. Our team will help you get started.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name *
                </label>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  required
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    required
                    className="w-full pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    required
                    className="w-full pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Restaurant Name (Optional)
                </label>
                <Input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  placeholder="Your restaurant name"
                  className="w-full"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-violet-600 to-purple-600 text-lg"
              >
                {loading ? "Submitting..." : "Get Started Free"}
              </Button>

              <p className="text-xs text-center text-gray-500">
                By submitting, you agree to our{" "}
                <a href="/privacy" className="text-violet-600 hover:underline">
                  Privacy Policy
                </a>
              </p>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={handleClose}
                className="w-full text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Skip for now
              </button>
            </div>
          </div>
        ) : (
          // Step 2: Success Message
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Thank You!
            </h2>
            <p className="text-gray-600 mb-6">
              Our team will contact you within 24 hours to help you get started with BillByteKOT.
            </p>

            <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-4 mb-6">
              <p className="text-sm font-medium text-gray-900 mb-2">
                What happens next?
              </p>
              <ul className="text-sm text-gray-600 space-y-2 text-left">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Our team will call you to understand your needs</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>We'll help you set up your restaurant</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Start your 7-day free trial</span>
                </li>
              </ul>
            </div>

            <Button
              onClick={handleClose}
              className="w-full h-12 bg-gradient-to-r from-violet-600 to-purple-600"
            >
              Continue Exploring
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadCapturePopup;
