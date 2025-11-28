import { useState, useEffect } from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import MenuPage from './pages/MenuPage';
import OrdersPage from './pages/OrdersPage';
import TablesPage from './pages/TablesPage';
import KitchenPage from './pages/KitchenPage';
import InventoryPage from './pages/InventoryPage';
import ReportsPage from './pages/ReportsPage';
import BillingPage from './pages/BillingPage';
import SettingsPage from './pages/SettingsPage';
import SubscriptionPage from './pages/SubscriptionPage';
import BusinessSetupPage from './pages/BusinessSetupPage';
import StaffManagementPage from './pages/StaffManagementPage';
import LandingPage from './pages/LandingPage';
import TrackOrderPage from './pages/TrackOrderPage';
import CustomerOrderPage from './pages/CustomerOrderPage';
import DesktopInfo from './components/DesktopInfo';
import { Toaster } from './components/ui/sonner';

// Electron navigation handler component
const ElectronNavigator = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    if (window.electronAPI?.onNavigate) {
      window.electronAPI.onNavigate((path) => {
        navigate(path);
      });
    }
  }, [navigate]);
  
  return null;
};

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('token', token);
  } else {
    delete axios.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  }
};

const PrivateRoute = ({ children, requireSetup = true }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!token) return <Navigate to="/login" />;
  if (requireSetup && user.role === 'admin' && !user.setup_completed) {
    return <Navigate to="/setup" />;
  }
  return children;
};

const SetupRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setAuthToken(token);
      fetchUser();
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
    } catch (e) {
      console.error('Failed to fetch user', e);
      setAuthToken(null);
      localStorage.removeItem('user');
    }
  };

  return (
    <div className="App">
      <BrowserRouter>
        <ElectronNavigator />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage setUser={setUser} />} />
          <Route
            path="/setup"
            element={
              <SetupRoute>
                <BusinessSetupPage user={user} />
              </SetupRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard user={user} />
              </PrivateRoute>
            }
          />
          <Route
            path="/menu"
            element={
              <PrivateRoute>
                <MenuPage user={user} />
              </PrivateRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <PrivateRoute>
                <OrdersPage user={user} />
              </PrivateRoute>
            }
          />
          <Route
            path="/billing/:orderId"
            element={
              <PrivateRoute>
                <BillingPage user={user} />
              </PrivateRoute>
            }
          />
          <Route
            path="/tables"
            element={
              <PrivateRoute>
                <TablesPage user={user} />
              </PrivateRoute>
            }
          />
          <Route
            path="/kitchen"
            element={
              <PrivateRoute>
                <KitchenPage user={user} />
              </PrivateRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <PrivateRoute>
                <InventoryPage user={user} />
              </PrivateRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <PrivateRoute>
                <ReportsPage user={user} />
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <SettingsPage user={user} />
              </PrivateRoute>
            }
          />
          <Route
            path="/subscription"
            element={
              <PrivateRoute>
                <SubscriptionPage user={user} />
              </PrivateRoute>
            }
          />
          <Route
            path="/staff"
            element={
              <PrivateRoute>
                <StaffManagementPage user={user} />
              </PrivateRoute>
            }
          />
          {/* Public Routes - No Auth Required */}
          <Route path="/track/:trackingToken" element={<TrackOrderPage />} />
          <Route path="/order/:orgId" element={<CustomerOrderPage />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" richColors />
      <DesktopInfo />
    </div>
  );
}

export default App;
