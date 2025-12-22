import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search, Phone } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* 404 Animation */}
        <div className="mb-8">
          <div className="text-9xl font-bold text-violet-600 mb-4 animate-bounce">
            404
          </div>
          <div className="w-32 h-1 bg-violet-600 mx-auto rounded-full"></div>
        </div>

        {/* Error Message */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Page Not Found
        </h1>
        <p className="text-xl text-gray-600 mb-8 leading-relaxed">
          Oops! The page you're looking for seems to have gone missing. 
          Don't worry, even the best restaurants sometimes run out of ingredients!
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700 transition-colors shadow-lg"
          >
            <Home className="w-5 h-5 mr-2" />
            Back to Home
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Go Back
          </button>
        </div>

        {/* Helpful Links */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Looking for something specific?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              to="/features"
              className="p-4 border border-gray-200 rounded-lg hover:border-violet-300 hover:bg-violet-50 transition-colors"
            >
              <div className="text-violet-600 mb-2">
                <Search className="w-8 h-8 mx-auto" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Features</h3>
              <p className="text-sm text-gray-600">Explore our restaurant management features</p>
            </Link>

            <Link
              to="/pricing"
              className="p-4 border border-gray-200 rounded-lg hover:border-violet-300 hover:bg-violet-50 transition-colors"
            >
              <div className="text-violet-600 mb-2">
                <div className="w-8 h-8 mx-auto flex items-center justify-center text-xl font-bold">₹</div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Pricing</h3>
              <p className="text-sm text-gray-600">Check our affordable pricing plans</p>
            </Link>

            <Link
              to="/contact"
              className="p-4 border border-gray-200 rounded-lg hover:border-violet-300 hover:bg-violet-50 transition-colors"
            >
              <div className="text-violet-600 mb-2">
                <Phone className="w-8 h-8 mx-auto" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Contact</h3>
              <p className="text-sm text-gray-600">Get in touch with our support team</p>
            </Link>
          </div>
        </div>

        {/* SEO Content */}
        <div className="text-left bg-gray-50 rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            About BillByteKOT Restaurant Billing Software
          </h2>
          <p className="text-gray-700 mb-4">
            BillByteKOT is India's leading restaurant billing software with comprehensive KOT (Kitchen Order Ticket) 
            management system. Our platform offers thermal printing, WhatsApp integration, inventory management, 
            and multi-currency support trusted by 500+ restaurants across India.
          </p>
          <p className="text-gray-700 mb-4">
            Key features include GST billing, table management, staff management, analytics & reports, 
            and seamless integration with payment gateways. Whether you run a small dhaba, cafe, 
            fine dining restaurant, or food court, BillByteKOT scales with your business needs.
          </p>
          <p className="text-gray-700">
            Start your free 7-day trial today and experience why thousands of restaurant owners 
            choose BillByteKOT for their billing and management needs. No setup fees, no hidden charges - 
            just ₹499/year for unlimited bills and premium features.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-sm text-gray-500">
          <p>Error Code: 404 | Page Not Found</p>
          <p>If you believe this is an error, please contact our support team.</p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;