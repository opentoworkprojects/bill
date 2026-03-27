import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ChefHat, Search, Calendar, User, ArrowRight, TrendingUp, Flame, Clock, Tag, Zap } from 'lucide-react';
import { blogPosts as blogPostsData } from '../data/blogPosts';
import { CategoryPageSEO } from '../seo';
import AdSense from '../components/AdSense';

// Rolling 24h countdown hook
const useCountdown = () => {
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 59, seconds: 59 });
  useState(() => {
    const tick = () => {
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const diff = end - new Date();
      setTimeLeft({
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  });
  return timeLeft;
};

// Sticky sidebar ad + CTA widget
const Sidebar = ({ timeLeft }) => (
  <aside className="hidden lg:block w-80 flex-shrink-0">
    <div className="sticky top-24 space-y-6">

      {/* FOMO offer box */}
      <div className="bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 rounded-2xl p-5 text-white shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <Flame className="w-5 h-5 animate-pulse" />
          <span className="font-black text-sm tracking-widest">FLASH SALE — TODAY ONLY</span>
        </div>
        <div className="text-4xl font-black mb-1">40% OFF</div>
        <div className="flex items-center gap-2 mb-3">
          <span className="line-through text-white/60 text-lg">₹1999/yr</span>
          <span className="text-2xl font-black">₹1199/yr</span>
        </div>
        <div className="flex gap-1 mb-4">
          {[
            { v: timeLeft.hours, l: 'HRS' },
            { v: timeLeft.minutes, l: 'MIN' },
            { v: timeLeft.seconds, l: 'SEC' },
          ].map((item, i) => (
            <div key={i} className="flex-1 bg-black/30 rounded-lg py-1 text-center">
              <div className="font-mono font-black text-xl">{String(item.v).padStart(2, '0')}</div>
              <div className="text-[9px] text-white/70">{item.l}</div>
            </div>
          ))}
        </div>
        <Link to="/login">
          <button className="w-full bg-white text-orange-600 font-black py-2.5 rounded-xl hover:bg-yellow-50 transition-all text-sm">
            Claim 40% OFF Now →
          </button>
        </Link>
        <p className="text-[10px] text-white/60 text-center mt-2">Price resets at midnight • No credit card</p>
      </div>

      {/* Ad slot 1 */}
      <AdSense slot="1635338536" format="auto" responsive="true" />

      {/* Popular keywords / tags */}
      <div className="bg-white rounded-2xl p-5 shadow border">
        <div className="flex items-center gap-2 mb-3">
          <Tag className="w-4 h-4 text-violet-600" />
          <span className="font-bold text-gray-800">Popular Topics</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            'Restaurant Billing', 'KOT System', 'POS India', 'GST Billing',
            'Thermal Printer', 'WhatsApp Billing', 'Inventory Management',
            'Free Trial', 'Restaurant Software 2026', 'Billing Software',
            'Table Management', 'Cloud Kitchen', 'QSR Billing', 'UPI Payments',
          ].map(tag => (
            <span key={tag} className="bg-violet-50 text-violet-700 text-xs px-2 py-1 rounded-full border border-violet-100 hover:bg-violet-100 cursor-pointer transition-colors">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Ad slot 2 */}
      <AdSense slot="2847291650" format="auto" responsive="true" />

      {/* Quick stats */}
      <div className="bg-white rounded-2xl p-5 shadow border">
        <div className="font-bold text-gray-800 mb-3">Why BillByteKOT?</div>
        <ul className="space-y-2 text-sm text-gray-600">
          {[
            ['500+', 'Restaurants using it'],
            ['80%', 'Fewer kitchen errors'],
            ['3x', 'Faster table turnover'],
            ['₹100/mo', 'At 40% off yearly plan'],
            ['5 min', 'Setup time'],
            ['7 days', 'Free trial, no card'],
          ].map(([stat, label]) => (
            <li key={stat} className="flex items-center justify-between">
              <span className="font-black text-violet-600">{stat}</span>
              <span>{label}</span>
            </li>
          ))}
        </ul>
        <Link to="/login">
          <button className="w-full mt-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold py-2 rounded-xl text-sm hover:opacity-90 transition-all">
            Start Free Trial
          </button>
        </Link>
      </div>

      {/* Ad slot 3 */}
      <AdSense slot="3958402761" format="auto" responsive="true" />
    </div>
  </aside>
);

const BlogPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const timeLeft = useCountdown();

  const extraPosts = [
    {
      id: 0, title: 'Lightning-Fast Restaurant Billing: The Future is Here ⚡',
      excerpt: 'Discover how lightning-fast restaurant billing systems are transforming restaurants worldwide. Learn why 10,000+ restaurants switched to instant payment processing.',
      author: 'BillByteKOT Team', date: '2025-02-10', category: 'Business Strategy',
      readTime: '12 min read', image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800',
      slug: 'lightning-fast-restaurant-billing', featured: true,
    },
    {
      id: -1, title: 'How to 10X Your Restaurant Revenue Without Hiring More Staff 📈',
      excerpt: 'Discover how top restaurants are increasing revenue 10x without hiring more staff. The secret? Smart billing systems and automation.',
      author: 'BillByteKOT Team', date: '2025-02-10', category: 'Revenue Growth',
      readTime: '14 min read', image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800',
      slug: 'restaurant-revenue-10x-without-hiring', featured: true,
    },
    {
      id: -2, title: 'Why Your Restaurant Lost That Customer (And How to Get Them Back) 💔',
      excerpt: 'Did your restaurant lose a customer today? Find out the #1 reason customers leave and how simple fixes like instant billing can bring them back.',
      author: 'BillByteKOT Team', date: '2025-02-10', category: 'Customer Retention',
      readTime: '11 min read', image: 'https://images.unsplash.com/photo-1554224311-beee415c15c?w=800',
      slug: 'restaurant-lost-customer-recovery', featured: true,
    },
  ];

  const blogPosts = [...blogPostsData, ...extraPosts];

  const filteredPosts = blogPosts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const featuredPosts = blogPosts.filter(p => p.featured).slice(0, 4);

  return (
    <>
      <CategoryPageSEO
        title="Restaurant Billing Software Blog | Tips, Guides & Updates | BillByteKOT"
        description="Expert guides on restaurant billing software, KOT systems, thermal printing, inventory management, and restaurant technology. Free tips and tutorials for restaurant owners in India."
        keywords={[
          'restaurant billing software blog', 'KOT system guide', 'restaurant POS tips India',
          'thermal printer setup restaurant', 'restaurant management tips 2026',
          'restaurant software tutorials', 'billing software guides', 'restaurant technology blog',
          'POS system India 2026', 'restaurant business tips', 'GST billing software',
          'cloud kitchen billing', 'QSR POS system', 'restaurant inventory management',
          'WhatsApp billing restaurant', 'free restaurant software trial',
        ]}
        url="https://billbytekot.in/blog"
        image="https://billbytekot.in/og-blog.jpg"
        schemaData={{
          name: 'Restaurant Software Blog',
          description: 'Expert guides and tips on restaurant billing software, KOT systems, and restaurant technology.',
          items: filteredPosts.slice(0, 10).map(post => ({
            name: post.title, description: post.excerpt,
            url: `https://billbytekot.in/blog/${post.slug}`,
          })),
        }}
      />

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
              <div className="flex items-center gap-3">
                {/* Mini countdown in header */}
                <div className="hidden sm:flex items-center gap-1.5 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full">
                  <Flame className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                  <span className="text-xs font-bold text-red-600">40% OFF ends in</span>
                  <span className="font-mono text-xs font-black text-red-700">
                    {String(timeLeft.hours).padStart(2,'0')}:{String(timeLeft.minutes).padStart(2,'0')}:{String(timeLeft.seconds).padStart(2,'0')}
                  </span>
                </div>
                <Link to="/login">
                  <Button className="bg-gradient-to-r from-violet-600 to-purple-600">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Top banner ad */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-2">
            <AdSense slot="1635338536" format="auto" responsive="true" />
          </div>
        </div>

        {/* Hero */}
        <section className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 text-white py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full mb-4 text-sm font-bold">
                <Flame className="w-4 h-4 text-yellow-300 animate-pulse" />
                🔥 40% OFF — Restaurant Billing Software — Offer Ends Tonight
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">BillByteKOT Blog</h1>
              <p className="text-lg text-white/90 mb-6">
                Expert insights on restaurant billing software, KOT systems, POS India, GST billing, inventory management &amp; more
              </p>
              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search: KOT system, billing software, POS India..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-base"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Featured Posts */}
        {!searchQuery && (
          <section className="py-12 bg-white">
            <div className="container mx-auto px-4">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-7 h-7 text-violet-600" />
                <h2 className="text-2xl font-bold">Featured Articles</h2>
                <span className="ml-auto text-sm text-gray-500">Restaurant billing software guides &amp; tips</span>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {featuredPosts.map((post) => (
                  <Card key={post.id} className="overflow-hidden hover:shadow-2xl transition-all border-2 border-violet-100">
                    <div className="relative h-56 overflow-hidden">
                      <img src={post.image} alt={post.title} className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" />
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className="bg-violet-600 text-white px-2.5 py-0.5 rounded-full text-xs font-medium">{post.category}</span>
                        <span className="bg-yellow-500 text-white px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" /> Featured
                        </span>
                      </div>
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl hover:text-violet-600 transition-colors leading-snug">
                        <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-gray-600 text-sm line-clamp-2">{post.excerpt}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center gap-1"><User className="w-3 h-3" />{typeof post.author === 'string' ? post.author : post.author?.name || 'BillByteKOT Team'}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.readTime}</span>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t">
                        <span className="text-xs text-gray-400">{new Date(post.date).toLocaleDateString()}</span>
                        <Link to={`/blog/${post.slug}`}>
                          <Button size="sm" className="bg-gradient-to-r from-violet-600 to-purple-600 h-8 text-xs">
                            Read Article <ArrowRight className="w-3 h-3 ml-1" />
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

        {/* Main content + sidebar */}
        <section className="py-10">
          <div className="container mx-auto px-4">
            <div className="flex gap-8">

              {/* Posts grid */}
              <div className="flex-1 min-w-0">
                {!searchQuery && (
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-1">All Articles</h2>
                    <p className="text-gray-500 text-sm">Restaurant billing software guides, KOT system tips, POS India reviews &amp; more</p>
                  </div>
                )}

                {/* Ad between header and grid */}
                <div className="mb-6">
                  <AdSense slot="2847291650" format="auto" responsive="true" />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {filteredPosts.map((post, idx) => (
                    <>
                      <Card key={post.id} className="overflow-hidden hover:shadow-xl transition-shadow">
                        <div className="relative h-44 overflow-hidden">
                          <img src={post.image} alt={post.title} className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" />
                          <div className="absolute top-3 left-3">
                            <span className="bg-violet-600 text-white px-2.5 py-0.5 rounded-full text-xs font-medium">{post.category}</span>
                          </div>
                        </div>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base hover:text-violet-600 transition-colors leading-snug">
                            <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-gray-600 text-sm line-clamp-2">{post.excerpt}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span className="flex items-center gap-1"><User className="w-3 h-3" />{typeof post.author === 'string' ? post.author : post.author?.name || 'BillByteKOT Team'}</span>
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(post.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t">
                            <span className="text-xs text-gray-400">{post.readTime}</span>
                            <Link to={`/blog/${post.slug}`}>
                              <Button variant="ghost" size="sm" className="text-violet-600 h-7 text-xs">
                                Read More <ArrowRight className="w-3 h-3 ml-1" />
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Inject ad every 6 posts */}
                      {(idx + 1) % 6 === 0 && (
                        <div key={`ad-${idx}`} className="md:col-span-2">
                          <AdSense slot="3958402761" format="auto" responsive="true" />
                        </div>
                      )}

                      {/* Inject FOMO CTA every 10 posts */}
                      {(idx + 1) % 10 === 0 && (
                        <div key={`cta-${idx}`} className="md:col-span-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 text-white text-center">
                          <Zap className="w-8 h-8 mx-auto mb-2 text-yellow-300" />
                          <div className="font-black text-xl mb-1">🔥 40% OFF — Ends Tonight</div>
                          <div className="text-white/80 text-sm mb-3">₹1999/yr → ₹1199/yr • Save ₹800 • Offer resets at midnight</div>
                          <Link to="/login">
                            <button className="bg-white text-orange-600 font-black px-6 py-2 rounded-full text-sm hover:bg-yellow-50 transition-all">
                              Claim 40% OFF Now →
                            </button>
                          </Link>
                        </div>
                      )}
                    </>
                  ))}
                </div>

                {filteredPosts.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No articles found matching your search.</p>
                  </div>
                )}

                {/* Bottom ad */}
                <div className="mt-8">
                  <AdSense slot="1635338536" format="auto" responsive="true" />
                </div>
              </div>

              {/* Sidebar */}
              <Sidebar timeLeft={timeLeft} />
            </div>
          </div>
        </section>

        {/* SEO keyword-rich section */}
        <section className="bg-white py-10 border-t">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Restaurant Billing Software — Complete Resource Hub</h2>
            <div className="grid md:grid-cols-3 gap-6 text-sm text-gray-600">
              <div>
                <h3 className="font-bold text-gray-800 mb-2">Popular Guides</h3>
                <ul className="space-y-1">
                  {['Restaurant billing software India 2026', 'KOT system for restaurants', 'GST billing software free', 'Thermal printer for restaurant', 'WhatsApp billing integration', 'Restaurant POS system comparison'].map(t => (
                    <li key={t} className="flex items-center gap-1"><ArrowRight className="w-3 h-3 text-violet-400 flex-shrink-0" />{t}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-gray-800 mb-2">By Restaurant Type</h3>
                <ul className="space-y-1">
                  {['Cloud kitchen billing software', 'QSR POS system India', 'Fine dining billing system', 'Cafe billing software', 'Dhaba billing software', 'Food truck POS system'].map(t => (
                    <li key={t} className="flex items-center gap-1"><ArrowRight className="w-3 h-3 text-violet-400 flex-shrink-0" />{t}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-gray-800 mb-2">By City</h3>
                <ul className="space-y-1">
                  {['Restaurant billing software Mumbai', 'POS system Bangalore', 'Billing software Delhi', 'Restaurant software Hyderabad', 'POS system Chennai', 'Billing software Pune'].map(t => (
                    <li key={t} className="flex items-center gap-1"><ArrowRight className="w-3 h-3 text-violet-400 flex-shrink-0" />{t}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-violet-600 to-purple-600 text-white py-14">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full mb-4 text-sm font-bold">
              <Flame className="w-4 h-4 text-yellow-300 animate-pulse" />
              40% OFF — ₹1999 → ₹1199/year — Offer ends tonight
            </div>
            <h2 className="text-3xl font-bold mb-3">Ready to Transform Your Restaurant?</h2>
            <p className="text-lg text-white/90 mb-6 max-w-xl mx-auto">
              Join 500+ restaurants using BillByteKOT. KOT-first billing, GST invoices, thermal printing, WhatsApp integration — all in one.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/login">
                <Button size="lg" className="bg-white text-violet-600 hover:bg-gray-100 h-12 px-8 font-bold">
                  Start Free 7-Day Trial
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 h-12 px-8">
                  🔥 Claim 40% OFF — ₹1199/yr
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-10">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <h3 className="font-bold text-lg mb-3">BillByteKOT</h3>
                <p className="text-gray-400 text-sm">India's #1 KOT-first restaurant billing and automation system. GST compliant, WhatsApp integrated, offline ready.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Product</h4>
                <ul className="space-y-1.5 text-gray-400 text-sm">
                  <li><Link to="/features" className="hover:text-white">Features</Link></li>
                  <li><Link to="/pricing" className="hover:text-white">Pricing</Link></li>
                  <li><Link to="/download" className="hover:text-white">Download</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Resources</h4>
                <ul className="space-y-1.5 text-gray-400 text-sm">
                  <li><Link to="/blog" className="hover:text-white">Blog</Link></li>
                  <li><Link to="/contact" className="hover:text-white">Contact Us</Link></li>
                  <li><Link to="/support" className="hover:text-white">Support</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Popular Searches</h4>
                <ul className="space-y-1.5 text-gray-400 text-sm">
                  <li>Restaurant billing software India</li>
                  <li>KOT system for restaurants</li>
                  <li>GST billing software free</li>
                  <li>Restaurant POS system 2026</li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-6 text-center text-gray-400 text-sm">
              <p>© 2026 BillByteKOT by BillByte Innovations. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default BlogPage;
