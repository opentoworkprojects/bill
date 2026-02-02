import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { 
  ChefHat, Star, ArrowRight,
  Award, TrendingUp, Clock, Heart
} from 'lucide-react';
import { EnhancedSEOHead, FAQPageSchemaInjector, HomepageSchemaInjector } from '../seo';

const BrandPage = () => {
  const navigate = useNavigate();

  const brandHighlights = [
    { icon: Award, title: "500+ Restaurants Trust Us", desc: "Leading restaurant software in India" },
    { icon: TrendingUp, title: "85% Cost Savings", desc: "₹2999/year vs competitors' ₹12,000+" },
    { icon: Clock, title: "7-Day Free Trial", desc: "Test all features before purchase" },
    { icon: Heart, title: "24/7 Support", desc: "Dedicated customer success team" },
  ];

  const competitorComparison = [
    { feature: "Annual Cost", billbytekot: "₹1,999", petpooja: "₹12,000+", posist: "₹15,000+" },
    { feature: "KOT System", billbytekot: "FREE", petpooja: "Paid Add-on", posist: "Paid Add-on" },
    { feature: "Thermal Themes", billbytekot: "6 Professional", petpooja: "Basic", posist: "Basic" },
    { feature: "WhatsApp Integration", billbytekot: "Cloud API", petpooja: "Limited", posist: "No" },
    { feature: "Offline Mode", billbytekot: "Yes", petpooja: "Limited", posist: "No" },
    { feature: "AI Features", billbytekot: "Yes", petpooja: "No", posist: "No" },
  ];

  const brandFAQs = [
    {
      question: "What is BillByteKOT and what makes it special?",
      answer: "BillByteKOT is India's most affordable and feature-rich KOT-first restaurant automation platform. What makes it special is the combination of comprehensive features (KOT system, thermal printing, GST billing, inventory management, WhatsApp integration) at just ₹2999/year - 75% cheaper than competitors like Petpooja while offering superior functionality."
    },
    {
      question: "How is BillByteKOT different from Petpooja and other restaurant software?",
      answer: "BillByteKOT offers significant advantages: 1) Much lower cost (₹2999 vs ₹12,000+), 2) FREE advanced KOT system (others charge extra), 3) 6 professional thermal receipt themes, 4) Modern WhatsApp Cloud API integration, 5) AI-powered recommendations, 6) Offline mode support, 7) Better user interface and customer support."
    },
    {
      question: "Is BillByteKOT suitable for my restaurant type?",
      answer: "Yes! BillByteKOT works for all types of food businesses: restaurants, cafes, dhabas, sweet shops, bakeries, cloud kitchens, food trucks, bars, canteens, and food courts. It's designed to scale from small single-location businesses to multi-location restaurant chains."
    },
    {
      question: "What does BillByteKOT include in the ₹2999/year package?",
      answer: "Everything! The ₹2999/year package includes: Complete restaurant billing system, FREE KOT (Kitchen Order Ticket) system, thermal printing with 6 themes, GST compliant invoicing, inventory management, staff management, WhatsApp integration, real-time reports, table management, multi-location support, mobile app access, and 24/7 customer support."
    },
    {
      question: "Can I try BillByteKOT before purchasing?",
      answer: "Absolutely! BillByteKOT offers a completely free 7-day trial with full access to all features. No credit card required. You can test the complete system including billing, KOT, inventory, reports, and all integrations before making any purchase decision."
    },
    {
      question: "How reliable is BillByteKOT for daily restaurant operations?",
      answer: "BillByteKOT is highly reliable with 99.9% uptime. It includes offline mode support, so your restaurant can continue operations even without internet. Data syncs automatically when connection is restored. Over 500+ restaurants trust BillByteKOT for their daily operations with an average rating of 4.9/5."
    }
  ];

  return (
    <>
      {/* Enhanced SEO for Brand Page */}
      <EnhancedSEOHead
        title="BillByteKOT - India's #1 KOT-First Restaurant Automation Platform | Better than Petpooja at ₹2999/year"
        description="BillByteKOT is India's leading KOT-first restaurant automation platform trusted by 500+ restaurants. Complete solution with FREE KOT system, thermal printing, GST billing & WhatsApp integration at just ₹2999/year - 75% cheaper than Petpooja!"
        keywords={[
          'BillByteKOT',
          'BillByte KOT',
          'Bill Byte KOT',
          'BillByteKOT restaurant software',
          'BillByteKOT vs Petpooja',
          'BillByteKOT vs POSist',
          'restaurant billing software India',
          'best restaurant software India',
          'affordable restaurant POS',
          'restaurant management software',
          'KOT software India',
          'restaurant billing system'
        ]}
        url="https://billbytekot.in/billbytekot"
        image="https://billbytekot.in/og-brand-page.jpg"
        contentType="brand"
      />

      {/* Organization Schema for Brand Disambiguation */}
      <HomepageSchemaInjector 
        pageData={{
          name: 'BillByteKOT',
          alternateName: ['BillByte KOT', 'Bill Byte KOT', 'BillByteKOT Software'],
          description: 'India\'s leading restaurant billing software provider, trusted by 500+ restaurants nationwide',
          url: 'https://billbytekot.in/billbytekot',
          logo: 'https://billbytekot.in/logo.png',
          industry: 'Restaurant Technology',
          contactInfo: {
            telephone: '+91-9876543210',
            email: 'support@billbytekot.in',
            address: {
              street: 'Tech Park',
              city: 'Mumbai',
              state: 'Maharashtra',
              postalCode: '400001',
              country: 'IN'
            }
          },
          socialProfiles: [
            'https://www.facebook.com/billbytekot',
            'https://twitter.com/billbytekot',
            'https://www.linkedin.com/company/billbytekot',
            'https://www.instagram.com/billbytekot'
          ],
          brand: {
            name: 'BillByteKOT',
            slogan: 'Simplifying Restaurant Management',
            description: 'Leading restaurant billing and management software provider in India'
          },
          aggregateRating: {
            ratingValue: 4.9,
            reviewCount: 500,
            bestRating: 5,
            worstRating: 1
          },
          offers: {
            price: '1999',
            priceCurrency: 'INR',
            availability: 'InStock'
          }
        }}
      />

      {/* FAQ Schema for Brand Queries */}
      <FAQPageSchemaInjector faqs={brandFAQs} />

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

        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50">
          <div className="container mx-auto px-4 text-center">
            <div className="mb-6">
              <span className="inline-block px-4 py-2 bg-violet-100 text-violet-700 rounded-full text-sm font-medium mb-4">
                India's #1 Restaurant Software
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="text-violet-600">BillByteKOT</span> - The Smart Choice for Restaurants
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-4xl mx-auto">
              India's most trusted restaurant billing software with <strong>FREE KOT system</strong>, 
              thermal printing, GST billing & WhatsApp integration. Trusted by <strong>500+ restaurants</strong> 
              at just <strong>₹2999/year</strong> - 75% cheaper than competitors!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button 
                size="lg" 
                onClick={() => navigate("/login")}
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-lg px-8 py-4"
              >
                Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => navigate("/contact")}
                className="text-lg px-8 py-4 border-violet-300 text-violet-600 hover:bg-violet-50"
              >
                Schedule Demo
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {brandHighlights.map((highlight, index) => (
                <div key={index} className="text-center">
                  <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <highlight.icon className="w-6 h-6 text-violet-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{highlight.title}</h3>
                  <p className="text-sm text-gray-600">{highlight.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why BillByteKOT Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Why Choose <span className="text-violet-600">BillByteKOT</span>?
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                See why 500+ restaurants switched from expensive alternatives to BillByteKOT
              </p>
            </div>

            {/* Comparison Table */}
            <div className="max-w-6xl mx-auto">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border">
                <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white p-6">
                  <h3 className="text-2xl font-bold text-center">BillByteKOT vs Competitors</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left font-semibold">Feature</th>
                        <th className="px-6 py-4 text-center font-semibold text-violet-600">BillByteKOT</th>
                        <th className="px-6 py-4 text-center font-semibold">Petpooja</th>
                        <th className="px-6 py-4 text-center font-semibold">POSist</th>
                      </tr>
                    </thead>
                    <tbody>
                      {competitorComparison.map((row, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="px-6 py-4 font-medium">{row.feature}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                              {row.billbytekot}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center text-gray-600">{row.petpooja}</td>
                          <td className="px-6 py-4 text-center text-gray-600">{row.posist}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Customer Success Stories */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                What Restaurant Owners Say About <span className="text-violet-600">BillByteKOT</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                {
                  name: "Rajesh Sharma",
                  restaurant: "Spice Garden, Mumbai",
                  rating: 5,
                  review: "Switched from Petpooja to BillByteKOT and saved ₹10,000+ annually. The KOT system is fantastic and WhatsApp integration is a game-changer!"
                },
                {
                  name: "Priya Patel",
                  restaurant: "Cafe Delight, Bangalore",
                  rating: 5,
                  review: "BillByteKOT's thermal printing themes look so professional. Customers love the detailed receipts. Best decision for our cafe!"
                },
                {
                  name: "Mohammed Ali",
                  restaurant: "Biryani House, Hyderabad",
                  rating: 5,
                  review: "The offline mode saved us during internet issues. BillByteKOT never stops working. Excellent support team too!"
                }
              ].map((testimonial, index) => (
                <Card key={index} className="bg-white shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-gray-600 mb-4 italic">"{testimonial.review}"</p>
                    <div>
                      <p className="font-semibold text-gray-900">{testimonial.name}</p>
                      <p className="text-sm text-gray-500">{testimonial.restaurant}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-violet-600 to-purple-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Transform Your Restaurant?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join 500+ successful restaurants using BillByteKOT. Start your free trial today!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate("/login")}
                className="bg-white text-violet-600 hover:bg-gray-100 text-lg px-8 py-4"
              >
                Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => navigate("/contact")}
                className="border-white text-white hover:bg-white hover:text-violet-600 text-lg px-8 py-4"
              >
                Schedule Demo
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default BrandPage;