import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { setAuthToken } from '../App';
import { Home, UtensilsCrossed, ShoppingBag, Table, ChefHat, Package, FileText, LogOut, Menu, X, Settings as SettingsIcon, Crown } from 'lucide-react';

const Layout = ({ user, children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    setAuthToken(null);
    navigate('/login');
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/menu', icon: UtensilsCrossed, label: 'Menu' },
    { path: '/orders', icon: ShoppingBag, label: 'Orders' },
    { path: '/tables', icon: Table, label: 'Tables' },
    { path: '/kitchen', icon: ChefHat, label: 'Kitchen' },
    { path: '/inventory', icon: Package, label: 'Inventory' },
    { path: '/reports', icon: FileText, label: 'Reports' },
    { path: '/subscription', icon: Crown, label: 'Subscription' },
    { path: '/settings', icon: SettingsIcon, label: 'Settings', adminOnly: true }
  ];

  return (
    <div className="min-h-screen flex" data-testid="layout">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-white shadow-xl border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>RestoBill AI</h1>
          <p className="text-xs text-gray-500 mt-1">{user?.role?.toUpperCase()}</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            if (item.adminOnly && user?.role !== 'admin') return null;
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} data-testid={`nav-${item.label.toLowerCase()}`}>
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="px-4 py-3 bg-gray-50 rounded-xl mb-3">
            <p className="text-sm font-medium text-gray-700">{user?.username}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
          <Button onClick={handleLogout} variant="outline" className="w-full" data-testid="logout-button">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-md z-50 border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>RestoBill AI</h1>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2" data-testid="mobile-menu-toggle">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-gray-200 bg-white" data-testid="mobile-menu">
            <nav className="p-4 space-y-2">
              {navItems.map((item) => {
                if (item.adminOnly && user?.role !== 'admin') return null;
                return (
                  <Link key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)}>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-100">
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                );
              })}
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-100">
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-8 bg-gray-50 overflow-auto" style={{ marginTop: mobileMenuOpen ? '0' : '0' }}>
        <div className="lg:hidden h-16"></div>
        {children}
      </main>
    </div>
  );
};

export default Layout;
