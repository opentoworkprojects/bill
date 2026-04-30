import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { 
  ChefHat, 
  ArrowRight, 
  Package, 
  Download, 
  MessageCircle, 
  Shield, 
  DollarSign,
  Users,
  TrendingUp,
  Zap
} from "lucide-react";

const SEOPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <nav className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                BillByteKOT
              </span>
            </div>
            <Button onClick={() => navigate("/login")}>Get Started</Button>
          </div>
        </nav>
      </header>

      {/* SEO Content Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              Restaurant Billing Software India – BillByteKOT KOT System
            </h1>
            
            <div className="prose prose-lg max-w-none">
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                BillByteKOT is India's most trusted <strong>restaurant billing software</strong> designed specifically for Indian restaurants, cafes, and food businesses. Our comprehensive <strong>KOT (Kitchen Order Ticket) system</strong> streamlines your entire restaurant operations from order taking to billing, making it the perfect solution for restaurants of all sizes across India.
              </p>

              <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">
                Complete Restaurant Billing Software with KOT System
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Whether you run a small cafe, quick service restaurant, or fine dining establishment, BillByteKOT provides everything you need in one powerful platform. Our <strong>restaurant billing software</strong> includes advanced features like <strong>GST billing</strong>, inventory management, thermal printing, table management, and real-time analytics. With support for multiple payment methods including cash, card, UPI, and online payments through Razorpay integration, you can accept payments seamlessly from your customers.
              </p>

              <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">
                Best Restaurant Billing Software Features in India
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                Our <strong>KOT system</strong> is specifically designed for Indian restaurants with features that matter most to your business. Generate professional bills with <strong>GST compliance</strong>, manage your inventory with low-stock alerts, track sales with detailed reports, and print receipts on thermal printers with 6 beautiful themes. BillByteKOT supports multi-currency operations, making it perfect for restaurants serving international customers or operating in tourist areas.
              </p>

              <ul className="list-disc pl-6 mb-6 text-lg text-gray-700 space-y-2">
                <li><strong>Easy to Use:</strong> Intuitive interface designed for restaurant staff with minimal training required</li>
                <li><strong>GST Billing:</strong> Fully compliant with Indian GST regulations, automatic tax calculations</li>
                <li><strong>Inventory Management:</strong> Track stock levels, get alerts, manage suppliers efficiently</li>
                <li><strong>Thermal Printing:</strong> Support for all ESC/POS thermal printers with professional receipt themes</li>
                <li><strong>Multi-Currency Support:</strong> Accept payments in INR, USD, EUR, GBP, AED, and 10+ currencies</li>
                <li><strong>WhatsApp Integration:</strong> Send bills and order updates directly to customers via WhatsApp</li>
                <li><strong>Real-Time Reports:</strong> Track sales, revenue, popular items, and business performance instantly</li>
                <li><strong>Staff Management:</strong> Role-based access for admin, cashiers, waiters, and kitchen staff</li>
              </ul>

              <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">
                Free Restaurant Billing Software Trial – No Credit Card
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Start with our <strong>7-day free trial</strong> and experience all premium features without any credit card requirement. Process unlimited bills during your trial period and see how BillByteKOT can transform your restaurant operations. After the trial, continue with our affordable pricing at just <strong>₹499 per year</strong> with unlimited bills and all features included. No hidden fees, no per-transaction charges – just straightforward pricing that works for your business.
              </p>

              <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">
                Trusted Restaurant POS Software Across India
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                BillByteKOT is the preferred <strong>restaurant billing software</strong> for businesses across major Indian cities including Mumbai, Delhi, Bangalore, Hyderabad, Chennai, Kolkata, Pune, Ahmedabad, Jaipur, and Surat. Whether you operate a small cafe in Bangalore, a fine dining restaurant in Mumbai, or a quick service restaurant in Delhi, our software adapts to your specific needs. With cloud-based access, manage your restaurant from anywhere in India with just an internet connection.
              </p>

              <div className="bg-violet-50 border-l-4 border-violet-600 p-6 my-8 rounded-r-lg">
                <p className="text-lg text-gray-800 font-semibold mb-2">
                  Join 500+ Successful Restaurants Using BillByteKOT
                </p>
                <p className="text-gray-700">
                  Trusted by restaurants across India for reliable billing, efficient KOT management, and comprehensive business insights. Get started today and take your restaurant to the next level!
                </p>
              </div>

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
                  onClick={() => navigate("/login")}
                >
                  Start Free Trial Now
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
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-12 bg-gradient-to-br from-violet-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
            {[
              { icon: Users, value: "500+", label: "Restaurants" },
              { icon: TrendingUp, value: "1M+", label: "Bills Generated" },
              { icon: Zap, value: "99.9%", label: "Uptime" },
              { icon: DollarSign, value: "₹499", label: "Per Year" },
            ].map((stat, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-lg">
                <stat.icon className="w-8 h-8 text-violet-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-violet-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Restaurant?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Start your 7-day free trial today!
          </p>
          <Button
            size="lg"
            className="bg-white text-violet-600 hover:bg-gray-100 h-14 px-8"
            onClick={() => navigate("/login")}
          >
            Get Started Free
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            © 2024 BillByteKOT. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default SEOPage;
