import { useNavigate, Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { 
  ChefHat, CheckCircle, Star, ArrowRight, Printer, 
  Shield, Zap, Globe, Users, BarChart3, MessageCircle 
} from "lucide-react";
import { ProductPageSEO } from "../seo";

const RestaurantBillingSoftwarePage = () => {
  const navigate = useNavigate();

  const features = [
    { icon: Printer, title: "Thermal Printing", desc: "58mm & 80mm printer support" },
    { icon: Shield, title: "GST Compliant", desc: "Auto tax calculation" },
    { icon: MessageCircle, title: "WhatsApp Bills", desc: "Send digital receipts" },
    { icon: Globe, title: "Multi-Currency", desc: "10+ currencies supported" },
    { icon: Users, title: "Staff Management", desc: "Role-based access" },
    { icon: BarChart3, title: "Analytics", desc: "Real-time reports" },
  ];

  return (
    <>
      {/* SEO Meta Tags and Schema Markup */}
      <ProductPageSEO
        title="Best Restaurant Billing Software in India | BillByteKOT - Free KOT System"
        description="Complete restaurant billing software with FREE KOT system, thermal printing, GST billing, inventory management & WhatsApp integration. Trusted by 500+ restaurants in India."
        keywords={[
          'restaurant billing software India',
          'restaurant POS system',
          'KOT software',
          'GST billing software restaurants',
          'thermal printer billing software',
          'restaurant management software India',
          'restaurant software with KOT',
          'billing software for restaurants',
          'restaurant POS India',
          'restaurant billing system'
        ]}
        url="https://billbytekot.in/restaurant-billing-software"
        image="https://billbytekot.in/og-restaurant-billing.jpg"
        schemaData={{
          name: 'BillByteKOT Restaurant Billing Software',
          description: 'Complete restaurant billing software with FREE KOT system, thermal printing, GST billing, inventory management & WhatsApp integration.',
          applicationCategory: 'BusinessApplication',
          applicationSubCategory: 'Restaurant Billing Software',
          operatingSystem: ['Web Browser', 'Windows', 'macOS', 'Android', 'iOS'],
          featureList: [
            'Restaurant Billing & Invoicing',
            'Kitchen Order Ticket (KOT) System',
            'Thermal Printer Integration',
            'GST Compliance & Tax Management',
            'Inventory Management',
            'WhatsApp Bill Sharing',
            'Multi-Currency Support',
            'Staff Management',
            'Real-time Analytics',
            'Table Management'
          ],
          offers: {
            price: '1999',
            priceCurrency: 'INR',
            availability: 'InStock'
          },
          aggregateRating: {
            ratingValue: 4.9,
            reviewCount: 500
          }
        }}
      />
      
      <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              BillByteKOT
            </span>
          </Link>
          <Button onClick={() => navigate("/login")} className="bg-gradient-to-r from-violet-600 to-purple-600">
            Start Free Trial
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Best <span className="text-violet-600">Restaurant Billing Software</span> in India
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Complete restaurant billing solution with KOT system, thermal printing, GST billing, 
            inventory management & WhatsApp integration. Trusted by 500+ restaurants.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button size="lg" className="bg-gradient-to-r from-violet-600 to-purple-600 h-14 px-8" onClick={() => navigate("/login")}>
              Start 7-Day Free Trial <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8" onClick={() => navigate("/contact")}>
              Book Demo
            </Button>
          </div>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
            <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-500" /> No credit card</span>
            <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-500" /> ₹499/year only</span>
            <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-500" /> Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Restaurant Billing Software Features</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Card key={i} className="border-0 shadow-lg">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <f.icon className="w-6 h-6 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{f.title}</h3>
                    <p className="text-gray-600">{f.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SEO Content */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold mb-6">Why Choose BillByteKOT Restaurant Billing Software?</h2>
          <div className="prose prose-lg text-gray-700">
            <p>
              BillByteKOT is India's most affordable and feature-rich <strong>restaurant billing software</strong>. 
              Whether you run a small cafe, quick service restaurant, or fine dining establishment, our software 
              adapts to your needs.
            </p>
            <h3>Key Benefits:</h3>
            <ul>
              <li><strong>Easy to Use:</strong> Start billing in minutes with our intuitive interface</li>
              <li><strong>Affordable:</strong> Just ₹499/year - no hidden fees</li>
              <li><strong>Complete Solution:</strong> Billing, KOT, inventory, reports - all in one</li>
              <li><strong>Cloud-Based:</strong> Access from anywhere on any device</li>
              <li><strong>24/7 Support:</strong> We're always here to help</li>
            </ul>
            <p>
              Join 500+ restaurants across India who trust BillByteKOT for their daily billing operations. 
              Start your free trial today!
            </p>
          </div>
          <div className="mt-8 text-center">
            <Button size="lg" className="bg-gradient-to-r from-violet-600 to-purple-600" onClick={() => navigate("/login")}>
              Get Started Free
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">© 2025 BillByteKOT. Best Restaurant Billing Software in India.</p>
          <div className="mt-4 flex justify-center gap-6 text-sm">
            <Link to="/" className="text-gray-400 hover:text-white">Home</Link>
            <Link to="/blog" className="text-gray-400 hover:text-white">Blog</Link>
            <Link to="/contact" className="text-gray-400 hover:text-white">Contact</Link>
            <Link to="/privacy" className="text-gray-400 hover:text-white">Privacy</Link>
          </div>
        </div>
      </footer>
      </div>
    </>
  );
};

export default RestaurantBillingSoftwarePage;
