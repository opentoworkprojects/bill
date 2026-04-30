import { useNavigate, Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { 
  ChefHat, CheckCircle, ArrowRight, Printer, 
  Clock, Zap, Bell, Monitor, Smartphone 
} from "lucide-react";
import { ProductPageSEO } from "../seo";

const KOTSoftwarePage = () => {
  const navigate = useNavigate();

  const features = [
    { icon: Zap, title: "Instant Orders", desc: "Orders reach kitchen in seconds" },
    { icon: Monitor, title: "Kitchen Display", desc: "Real-time order tracking" },
    { icon: Printer, title: "KOT Printing", desc: "Auto-print to kitchen printer" },
    { icon: Bell, title: "Order Alerts", desc: "Sound notifications for new orders" },
    { icon: Clock, title: "Priority Queue", desc: "Manage order priorities" },
    { icon: Smartphone, title: "Mobile Access", desc: "Works on any device" },
  ];

  return (
    <>
      {/* SEO Meta Tags and Schema Markup */}
      <ProductPageSEO
        title="Best KOT Software for Restaurants | Kitchen Order Ticket System - BillByteKOT"
        description="Advanced KOT (Kitchen Order Ticket) software for restaurants with instant order transmission, real-time tracking, thermal printing & kitchen display system. Free trial available!"
        keywords={[
          'KOT software',
          'Kitchen Order Ticket system',
          'KOT system for restaurants',
          'restaurant KOT software India',
          'kitchen order management',
          'restaurant order system',
          'KOT printing software',
          'kitchen display system',
          'restaurant order tracking',
          'BillByteKOT KOT system'
        ]}
        url="https://billbytekot.in/kot-software"
        image="https://billbytekot.in/og-kot-software.jpg"
        schemaData={{
          name: 'BillByteKOT KOT Software',
          description: 'Advanced KOT (Kitchen Order Ticket) software for restaurants with instant order transmission, real-time tracking, thermal printing & kitchen display system.',
          applicationCategory: 'BusinessApplication',
          applicationSubCategory: 'Kitchen Order Ticket Software',
          operatingSystem: ['Web Browser', 'Windows', 'macOS', 'Android', 'iOS'],
          featureList: [
            'Kitchen Order Ticket (KOT) Management',
            'Instant Order Transmission to Kitchen',
            'Real-time Order Tracking',
            'Thermal KOT Printing',
            'Kitchen Display System',
            'Order Priority Management',
            'Sound Notifications for New Orders',
            'Mobile Kitchen Access',
            'Order Status Updates',
            'Kitchen Performance Analytics'
          ],
          aggregateRating: {
            ratingValue: 4.9,
            reviewCount: 500,
            bestRating: 5,
            worstRating: 1
          },
          offers: {
            name: 'BillByteKOT KOT Software License',
            price: '1999',
            priceCurrency: 'INR',
            availability: 'InStock',
            description: 'Complete KOT system included with BillByteKOT restaurant software'
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
      <section className="py-20 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Best <span className="text-orange-600">KOT Software</span> for Restaurants
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Kitchen Order Ticket (KOT) system that streamlines your restaurant operations. 
            Instant order transmission, real-time tracking & thermal printing support.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button size="lg" className="bg-gradient-to-r from-orange-600 to-amber-600 h-14 px-8" onClick={() => navigate("/login")}>
              Try KOT System Free <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8" onClick={() => navigate("/contact")}>
              See Demo
            </Button>
          </div>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
            <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-500" /> 7-day free trial</span>
            <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-500" /> No setup fees</span>
            <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-500" /> Instant setup</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">KOT Software Features</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Card key={i} className="border-0 shadow-lg">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <f.icon className="w-6 h-6 text-orange-600" />
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
          <h2 className="text-3xl font-bold mb-6">What is KOT Software?</h2>
          <div className="prose prose-lg text-gray-700">
            <p>
              <strong>KOT (Kitchen Order Ticket) software</strong> is a digital system that transmits orders 
              from the front-of-house directly to the kitchen. It eliminates manual order slips, reduces errors, 
              and speeds up service.
            </p>
            <h3>How BillByteKOT's KOT System Works:</h3>
            <ol>
              <li>Waiter takes order on tablet or POS</li>
              <li>Order instantly appears on kitchen display</li>
              <li>KOT auto-prints on thermal printer</li>
              <li>Kitchen marks items as preparing/ready</li>
              <li>Waiter gets notification when food is ready</li>
            </ol>
            <h3>Benefits of Digital KOT:</h3>
            <ul>
              <li><strong>80% fewer errors</strong> - No handwriting issues</li>
              <li><strong>Faster service</strong> - Orders reach kitchen instantly</li>
              <li><strong>Better tracking</strong> - Know order status in real-time</li>
              <li><strong>Cost savings</strong> - Less paper, fewer mistakes</li>
            </ul>
          </div>
          <div className="mt-8 text-center">
            <Button size="lg" className="bg-gradient-to-r from-orange-600 to-amber-600" onClick={() => navigate("/login")}>
              Start Using KOT System
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">© 2025 BillByteKOT. Best KOT Software for Restaurants in India.</p>
          <div className="mt-4 flex justify-center gap-6 text-sm">
            <Link to="/" className="text-gray-400 hover:text-white">Home</Link>
            <Link to="/restaurant-billing-software" className="text-gray-400 hover:text-white">Billing Software</Link>
            <Link to="/contact" className="text-gray-400 hover:text-white">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
};

export default KOTSoftwarePage;
