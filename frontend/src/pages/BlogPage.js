import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ChefHat, Search, Calendar, User, ArrowRight, TrendingUp } from 'lucide-react';
import blogPostsData from '../data/blogPosts';

const BlogPage = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const blogPosts = blogPostsData.concat([
    {
      id: 1,
      title: 'Complete Guide to Restaurant Billing Software in India 2024',
      excerpt: 'Everything you need to know about choosing the right billing software for your restaurant. Compare features, pricing, and benefits. Includes ROI calculator and implementation guide.',
      author: 'BillByteKOT Team',
      date: '2024-12-09',
      category: 'Complete Guide',
      readTime: '15 min read',
      image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800',
      slug: 'restaurant-billing-software-guide-2024',
      featured: true
    },
    {
      id: 2,
      title: 'Free vs Paid Restaurant Billing Software: Complete Comparison',
      excerpt: 'Detailed comparison of free and paid restaurant billing software. Learn when to upgrade, hidden costs, and which option is right for your business size.',
      author: 'BillByteKOT Team',
      date: '2024-12-09',
      category: 'Comparison',
      readTime: '12 min read',
      image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800',
      slug: 'free-vs-paid-restaurant-software',
      featured: true
    },
    {
      id: 3,
      title: 'WhatsApp Integration for Restaurants: Send Bills & Updates Instantly',
      excerpt: 'Learn how to send digital receipts and order updates directly to customer WhatsApp using Meta\'s official Cloud API. No login required! Includes setup guide and cost analysis.',
      author: 'BillByteKOT Team',
      date: '2024-12-09',
      category: 'Features',
      readTime: '8 min read',
      image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800',
      slug: 'whatsapp-integration-restaurants',
      featured: true
    },
    {
      id: 4,
      title: 'Thermal Printing for Restaurants: Complete Guide to KOT & Receipt Printing',
      excerpt: 'Master thermal printing with our complete guide. Covers 6 professional receipt themes, printer selection, customization options, and ROI calculation. Save ₹24,000/year!',
      author: 'BillByteKOT Team',
      date: '2024-12-09',
      category: 'Hardware Guide',
      readTime: '10 min read',
      image: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=800',
      slug: 'thermal-printing-guide-restaurants',
      featured: true
    },
    {
      id: 5,
      title: 'Bulk Upload Menu & Inventory: Save 95% Time on Data Entry',
      excerpt: 'Import hundreds of menu items and inventory records in minutes using CSV files. Complete guide with templates, error handling, and best practices. Save hours of manual work!',
      author: 'BillByteKOT Team',
      date: '2024-12-09',
      category: 'Productivity',
      readTime: '7 min read',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
      slug: 'bulk-upload-menu-inventory',
      featured: false
    },
    {
      id: 6,
      title: 'What is KOT System? Benefits for Your Restaurant',
      excerpt: 'Learn how Kitchen Order Ticket (KOT) systems streamline restaurant operations, reduce errors by 80%, and improve kitchen efficiency. Real case studies included.',
      author: 'Restaurant Expert',
      date: '2024-12-05',
      category: 'KOT System',
      readTime: '6 min read',
      image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
      slug: 'kot-system-benefits-restaurants',
      featured: false
    },
    {
      id: 7,
      title: 'Multi-Currency Support: Serve International Customers',
      excerpt: 'Accept payments in multiple currencies with automatic conversion. Perfect for tourist areas and international chains. Supports INR, USD, EUR, GBP, and more.',
      author: 'BillByteKOT Team',
      date: '2024-12-03',
      category: 'Features',
      readTime: '5 min read',
      image: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800',
      slug: 'multi-currency-support-restaurants',
      featured: false
    },
    {
      id: 8,
      title: 'Restaurant Inventory Management: Never Run Out of Stock',
      excerpt: 'Master inventory management with proven strategies. Reduce waste by 40%, control costs, optimize stock levels, and get low-stock alerts automatically.',
      author: 'Operations Manager',
      date: '2024-12-01',
      category: 'Management',
      readTime: '9 min read',
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800',
      slug: 'restaurant-inventory-management',
      featured: false
    },
    {
      id: 9,
      title: 'Table Management & Reservations: Optimize Your Seating',
      excerpt: 'Maximize table turnover with smart table management. Handle reservations, waitlists, and optimize seating arrangements. Increase revenue by 30%.',
      author: 'BillByteKOT Team',
      date: '2024-11-28',
      category: 'Features',
      readTime: '7 min read',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
      slug: 'table-management-reservations',
      featured: false
    },
    {
      id: 10,
      title: 'Staff Management: Track Performance & Payroll',
      excerpt: 'Manage staff efficiently with attendance tracking, performance metrics, and automated payroll. Includes shift scheduling and commission tracking.',
      author: 'HR Expert',
      date: '2024-11-25',
      category: 'Management',
      readTime: '8 min read',
      image: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800',
      slug: 'staff-management-payroll',
      featured: false
    },
    {
      id: 11,
      title: 'Analytics & Reports: Data-Driven Restaurant Decisions',
      excerpt: 'Make smarter decisions with comprehensive analytics. Track sales, identify trends, analyze customer behavior, and optimize your menu for maximum profit.',
      author: 'Data Analyst',
      date: '2024-11-20',
      category: 'Analytics',
      readTime: '10 min read',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
      slug: 'restaurant-analytics-reports',
      featured: false
    },
    {
      id: 12,
      title: 'Payment Integration: Accept All Payment Methods',
      excerpt: 'Integrate Razorpay and accept UPI, cards, wallets, and more. Handle split bills, discounts, tips, and refunds seamlessly. PCI-DSS compliant.',
      author: 'Payment Expert',
      date: '2024-11-15',
      category: 'Payments',
      readTime: '6 min read',
      image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800',
      slug: 'payment-integration-razorpay',
      featured: false
    }
  ]);

  const filteredPosts = blogPosts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                BillByteKOT
              </span>
            </Link>
            <Link to="/login">
              <Button className="bg-gradient-to-r from-violet-600 to-purple-600">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">BillByteKOT Blog</h1>
            <p className="text-xl text-white/90 mb-8">
              Expert insights on restaurant management, billing systems, and industry trends
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      {!searchQuery && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <TrendingUp className="w-8 h-8 text-violet-600" />
              <h2 className="text-3xl font-bold">Featured Articles</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {blogPosts.filter(post => post.featured).slice(0, 4).map((post) => (
                <Card key={post.id} className="overflow-hidden hover:shadow-2xl transition-all border-2 border-violet-100">
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4 flex gap-2">
                      <span className="bg-violet-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                        {post.category}
                      </span>
                      <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        Featured
                      </span>
                    </div>
                  </div>
                  
                  <CardHeader>
                    <CardTitle className="text-2xl hover:text-violet-600 transition-colors">
                      <Link to={`/blog/${post.slug}`}>
                        {post.title}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-gray-600 line-clamp-2">{post.excerpt}</p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{post.author}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(post.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t">
                      <span className="text-sm font-medium text-violet-600">{post.readTime}</span>
                      <Link to={`/blog/${post.slug}`}>
                        <Button className="bg-gradient-to-r from-violet-600 to-purple-600">
                          Read Article <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Blog Posts Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {!searchQuery && (
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">All Articles</h2>
              <p className="text-gray-600">Explore our complete collection of restaurant management guides</p>
            </div>
          )}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <Card key={post.id} className="overflow-hidden hover:shadow-xl transition-shadow">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-violet-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {post.category}
                    </span>
                  </div>
                </div>
                
                <CardHeader>
                  <CardTitle className="text-xl hover:text-violet-600 transition-colors">
                    <Link to={`/blog/${post.slug}`}>
                      {post.title}
                    </Link>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-gray-600 line-clamp-3">{post.excerpt}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{post.author}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(post.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className="text-sm text-gray-500">{post.readTime}</span>
                    <Link to={`/blog/${post.slug}`}>
                      <Button variant="ghost" size="sm" className="text-violet-600">
                        Read More <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredPosts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No articles found matching your search.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-violet-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <TrendingUp className="w-16 h-16 mx-auto mb-6" />
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Restaurant?</h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join 500+ successful restaurants using BillByteKOT for billing, KOT management, and more.
          </p>
          <Link to="/login">
            <Button size="lg" className="bg-white text-violet-600 hover:bg-gray-100 h-14 px-8 text-lg">
              Start Free Trial
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">BillByteKOT</h3>
              <p className="text-gray-400">
                India's #1 restaurant billing and KOT management system.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/features" className="hover:text-white">Features</Link></li>
                <li><Link to="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link to="/download" className="hover:text-white">Download</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/blog" className="hover:text-white">Blog</Link></li>
                <li><Link to="/contact" className="hover:text-white">Contact Us</Link></li>
                <li><Link to="/docs" className="hover:text-white">Documentation</Link></li>
                <li><Link to="/support" className="hover:text-white">Support</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Follow Us</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="https://instagram.com/billbytekot" target="_blank" rel="noopener noreferrer" className="hover:text-white">Instagram</a></li>
                <li><a href="https://linkedin.com/company/billbytekot" target="_blank" rel="noopener noreferrer" className="hover:text-white">LinkedIn</a></li>
                <li><a href="https://twitter.com/billbytekot" target="_blank" rel="noopener noreferrer" className="hover:text-white">Twitter</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>© 2025 BillByteKOT by FinVerge Technologies. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BlogPage;
