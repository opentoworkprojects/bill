import { useNavigate, Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { 
  ChefHat, CheckCircle, ArrowRight, CreditCard, 
  Shield, Globe, Package, BarChart3, Users 
} from "lucide-react";
import { ProductPageSEO } from "../seo";

const POSSoftwarePage = () => {
  const navigate = useNavigate();

  const features = [
    { icon: CreditCard, title: "All Payments", desc: "Cash, Card, UPI, Online" },
    { icon: Shield, title: "GST Billing", desc: "Compliant invoices" },
    { icon: Package, title: "Inventory", desc: "Stock management" },
    { icon: Globe, title: "Cloud-Based", desc: "Access anywhere" },
    { icon: BarChart3, title: "Reports", desc: "Sales analytics" },
    { icon: Users, title: "Multi-User", desc: "Staff management" },
  ];

  return (
    <>
      {/* SEO Meta Tags and Schema Markup */}
      <ProductPageSEO
        title="Best POS Software for Restaurants | Point of Sale System India - BillByteKOT"
        description="Complete restaurant POS software with payment processing, inventory management, sales tracking & GST billing. Cloud-based system works on any device. Free trial available!"
        keywords={[
          'POS software for restaurants',
          'restaurant POS system India',
          'point of sale software',
          'restaurant POS system',
          'POS software India',
          'restaurant point of sale',
          'cloud POS software',
          'restaurant payment system',
          'POS system for restaurants',
          'BillByteKOT POS software'
        ]}
        url="https://billbytekot.in/pos-software"
        image="https://billbytekot.in/og-pos-software.jpg"
        schemaData={{
          name: 'BillByteKOT POS Software',
          description: 'Complete restaurant POS software with payment processing, inventory management, sales tracking & GST billing. Cloud-based system works on any device.',
          applicationCategory: 'BusinessApplication',
          applicationSubCategory: 'Point of Sale Software',
          operatingSystem: ['Web Browser', 'Windows', 'macOS', 'Android', 'iOS'],
          featureList: [
            'Complete Point of Sale System',
            'All Payment Methods (Cash, Card, UPI, Online)',
            'GST Compliant Billing & Invoicing',
            'Inventory & Stock Management',
            'Cloud-Based Access Anywhere',
            'Real-time Sales Analytics & Reports',
            'Multi-User Staff Management',
            'Customer Management System',
            'Barcode Scanning Support',
            'Offline Mode Support'
          ],
          aggregateRating: {
            ratingValue: 4.9,
            reviewCount: 500,
            bestRating: 5,
            worstRating: 1
          },
          offers: {
            name: 'BillByteKOT POS Software License',
            price: '1999',
            priceCurrency: 'INR',
            availability: 'InStock',
            description: 'Complete POS system included with BillByteKOT restaurant software'
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
      <section className="py-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Best <span className="text-blue-600">POS Software for Restaurants</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Complete Point of Sale system for restaurants. Accept all payments, manage inventory, 
            track sales & grow your business. Cloud-based, works on any device.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 h-14 px-8" onClick={() => navigate("/login")}>
              Try POS System Free <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8" onClick={() => navigate("/contact")}>
              Request Demo
            </Button>
          </div>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
            <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-500" /> Free 7-day trial</span>
            <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-500" /> ₹499/year</span>
            <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-500" /> No hardware needed</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Restaurant POS Software Features</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Card key={i} className="border-0 shadow-lg">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <f.icon className="w-6 h-6 text-blue-600" />
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

      {/* Comparison */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold mb-6 text-center">BillByteKOT vs Traditional POS</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-2 border-blue-500">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-blue-600 mb-4">BillByteKOT POS</h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-500" /> ₹499/year</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-500" /> No hardware needed</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-500" /> Cloud-based</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-500" /> Auto updates</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-500" /> 24/7 support</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border border-gray-300">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-gray-600 mb-4">Traditional POS</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center gap-2">❌ ₹50,000+ upfront</li>
                  <li className="flex items-center gap-2">❌ Expensive hardware</li>
                  <li className="flex items-center gap-2">❌ Local only</li>
                  <li className="flex items-center gap-2">❌ Paid updates</li>
                  <li className="flex items-center gap-2">❌ Limited support</li>
                </ul>
              </CardContent>
            </Card>
          </div>
          <div className="mt-8 text-center">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600" onClick={() => navigate("/login")}>
              Switch to BillByteKOT POS
            </Button>
          </div>
        </div>
      </section>

      {/* SEO Content */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold mb-6">Why BillByteKOT is the Best POS for Restaurants</h2>
          <div className="prose prose-lg text-gray-700">
            <p>
              Looking for the <strong>best POS software for restaurants</strong> in India? BillByteKOT offers 
              a complete point-of-sale solution at just ₹499/year - 100x cheaper than traditional POS systems.
            </p>
            <h3>What Makes Our POS Different:</h3>
            <ul>
              <li><strong>No Hardware Lock-in:</strong> Works on any computer, tablet, or phone</li>
              <li><strong>Cloud-Based:</strong> Access your data from anywhere</li>
              <li><strong>All-in-One:</strong> Billing, KOT, inventory, reports included</li>
              <li><strong>Easy Setup:</strong> Start in 5 minutes, no technical knowledge needed</li>
              <li><strong>Indian-Made:</strong> Built for Indian restaurants with GST, UPI support</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">© 2025 BillByteKOT. Best POS Software for Restaurants in India.</p>
          <div className="mt-4 flex justify-center gap-6 text-sm">
            <Link to="/" className="text-gray-400 hover:text-white">Home</Link>
            <Link to="/restaurant-billing-software" className="text-gray-400 hover:text-white">Billing Software</Link>
            <Link to="/kot-software" className="text-gray-400 hover:text-white">KOT Software</Link>
            <Link to="/contact" className="text-gray-400 hover:text-white">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
};

export default POSSoftwarePage;
