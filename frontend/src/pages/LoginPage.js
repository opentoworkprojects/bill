import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API, setAuthToken } from '../App';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { ChefHat, Utensils } from 'lucide-react';

const LoginPage = ({ setUser }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'waiter'
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const response = await axios.post(`${API}/auth/login`, {
          username: formData.username,
          password: formData.password
        });
        setAuthToken(response.data.token);
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        toast.success('Welcome back!');
        
        // Redirect to setup if admin hasn't completed setup
        if (response.data.user.role === 'admin' && !response.data.user.setup_completed) {
          navigate('/setup');
        } else {
          navigate('/dashboard');
        }
      } else {
        await axios.post(`${API}/auth/register`, formData);
        toast.success('Account created! Please login.');
        setIsLogin(true);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'An error occurred');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Card className="w-full max-w-md shadow-2xl" data-testid="login-card">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center transform rotate-3 hover:rotate-6 transition-all">
              <ChefHat className="w-12 h-12 text-white" />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>RestoBill AI</CardTitle>
            <CardDescription className="text-base mt-2">Smart Restaurant Billing System</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                data-testid="username-input"
                placeholder="Enter username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  data-testid="email-input"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                data-testid="password-input"
                placeholder="Enter password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  data-testid="role-select"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="waiter">Waiter</option>
                  <option value="cashier">Cashier</option>
                  <option value="kitchen">Kitchen</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}

            <Button type="submit" className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700" data-testid="submit-button">
              {isLogin ? 'Login' : 'Register'}
            </Button>

            <div className="text-center">
              <button
                type="button"
                className="text-sm text-violet-600 hover:underline"
                onClick={() => setIsLogin(!isLogin)}
                data-testid="toggle-auth-mode"
              >
                {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
