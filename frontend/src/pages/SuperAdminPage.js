import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { 
  Users, Ticket, TrendingUp, Database, Shield, 
  CheckCircle, Clock, XCircle, DollarSign, UserPlus 
} from 'lucide-react';

const SuperAdminPage = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [leads, setLeads] = useState([]);
  const [leadsStats, setLeadsStats] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.get(`${API}/super-admin/dashboard`, {
        params: credentials
      });
      setDashboard(response.data);
      setAuthenticated(true);
      toast.success('Super Admin access granted');
      fetchAllData();
    } catch (error) {
      toast.error('Invalid super admin credentials');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllData = async () => {
    try {
      // Fetch users
      const usersRes = await axios.get(`${API}/super-admin/users`, {
        params: credentials
      });
      setUsers(usersRes.data.users);

      // Fetch tickets
      const ticketsRes = await axios.get(`${API}/super-admin/tickets`, {
        params: credentials
      });
      setTickets(ticketsRes.data.tickets);

      // Fetch leads
      const leadsRes = await axios.get(`${API}/super-admin/leads`, {
        params: credentials
      });
      setLeads(leadsRes.data.leads);
      setLeadsStats(leadsRes.data.stats);

      // Fetch analytics
      const analyticsRes = await axios.get(`${API}/super-admin/analytics`, {
        params: { ...credentials, days: 30 }
      });
      setAnalytics(analyticsRes.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
    }
  };

  const updateSubscription = async (userId, active) => {
    try {
      await axios.put(
        `${API}/super-admin/users/${userId}/subscription`,
        { subscription_active: active },
        { params: credentials }
      );
      toast.success('Subscription updated');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to update subscription');
    }
  };

  const updateTicketStatus = async (ticketId, status) => {
    try {
      await axios.put(
        `${API}/super-admin/tickets/${ticketId}`,
        { status },
        { params: credentials }
      );
      toast.success('Ticket updated');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to update ticket');
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure? This will delete all user data!')) return;
    
    try {
      await axios.delete(`${API}/super-admin/users/${userId}`, {
        params: credentials
      });
      toast.success('User deleted');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const updateLeadStatus = async (leadId, status) => {
    try {
      await axios.put(
        `${API}/super-admin/leads/${leadId}`,
        { status, contacted: status !== 'new' },
        { params: credentials }
      );
      toast.success('Lead updated');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to update lead');
    }
  };

  const deleteLead = async (leadId) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return;
    
    try {
      await axios.delete(`${API}/super-admin/leads/${leadId}`, {
        params: credentials
      });
      toast.success('Lead deleted');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to delete lead');
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-purple-500/20 bg-gray-900/50 backdrop-blur">
          <CardHeader>
            <div className="flex items-center gap-2 justify-center">
              <Shield className="w-8 h-8 text-purple-400" />
              <CardTitle className="text-2xl text-white">Super Admin Access</CardTitle>
            </div>
            <p className="text-center text-gray-400 text-sm">Site Owner Only</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label className="text-white">Username</Label>
                <Input
                  type="text"
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>
              <div>
                <Label className="text-white">Password</Label>
                <Input
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={loading}
              >
                {loading ? 'Authenticating...' : 'Access Super Admin'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-8 h-8 text-purple-600" />
              Super Admin Panel
            </h1>
            <p className="text-gray-600">Site Owner Dashboard</p>
          </div>
          <Button 
            onClick={() => setAuthenticated(false)}
            variant="outline"
          >
            Logout
          </Button>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b">
          {['dashboard', 'users', 'leads', 'tickets', 'analytics'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium capitalize ${
                activeTab === tab
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && dashboard && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="w-4 h-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboard.overview.total_users}</div>
                <p className="text-xs text-gray-600">
                  {dashboard.overview.active_subscriptions} active subscriptions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
                <Ticket className="w-4 h-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboard.overview.open_tickets}</div>
                <p className="text-xs text-gray-600">
                  {dashboard.overview.pending_tickets} pending
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Orders (30d)</CardTitle>
                <TrendingUp className="w-4 h-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboard.overview.total_orders_30d}</div>
                <p className="text-xs text-gray-600">Last 30 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Leads</CardTitle>
                <UserPlus className="w-4 h-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboard.overview.total_leads || 0}</div>
                <p className="text-xs text-gray-600">
                  {dashboard.overview.new_leads || 0} new
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Username</th>
                      <th className="text-left p-2">Email</th>
                      <th className="text-left p-2">Role</th>
                      <th className="text-left p-2">Subscription</th>
                      <th className="text-left p-2">Bills</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">{user.username}</td>
                        <td className="p-2">{user.email}</td>
                        <td className="p-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {user.role}
                          </span>
                        </td>
                        <td className="p-2">
                          {user.subscription_active ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs flex items-center gap-1 w-fit">
                              <CheckCircle className="w-3 h-3" /> Active
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs flex items-center gap-1 w-fit">
                              <Clock className="w-3 h-3" /> Trial
                            </span>
                          )}
                        </td>
                        <td className="p-2">{user.bill_count || 0}</td>
                        <td className="p-2 space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateSubscription(user.id, !user.subscription_active)}
                          >
                            {user.subscription_active ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteUser(user.id)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leads Tab */}
        {activeTab === 'leads' && (
          <Card>
            <CardHeader>
              <CardTitle>Lead Management</CardTitle>
              {leadsStats && (
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="text-blue-600">New: {leadsStats.new}</span>
                  <span className="text-yellow-600">Contacted: {leadsStats.contacted}</span>
                  <span className="text-green-600">Converted: {leadsStats.converted}</span>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Email</th>
                      <th className="text-left p-2">Phone</th>
                      <th className="text-left p-2">Business</th>
                      <th className="text-left p-2">Source</th>
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map(lead => (
                      <tr key={lead.timestamp} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{lead.name}</td>
                        <td className="p-2">{lead.email}</td>
                        <td className="p-2">{lead.phone}</td>
                        <td className="p-2">{lead.businessName || '-'}</td>
                        <td className="p-2">
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                            {lead.source}
                          </span>
                        </td>
                        <td className="p-2 text-sm text-gray-600">
                          {new Date(lead.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-2">
                          <select
                            value={lead.status}
                            onChange={(e) => updateLeadStatus(lead.timestamp, e.target.value)}
                            className={`px-2 py-1 border rounded text-xs ${
                              lead.status === 'new' ? 'bg-blue-50 text-blue-800' :
                              lead.status === 'contacted' ? 'bg-yellow-50 text-yellow-800' :
                              'bg-green-50 text-green-800'
                            }`}
                          >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="converted">Converted</option>
                            <option value="not_interested">Not Interested</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteLead(lead.timestamp)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {leads.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No leads yet. They will appear here when visitors fill the "Get Started" form.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tickets Tab */}
        {activeTab === 'tickets' && (
          <Card>
            <CardHeader>
              <CardTitle>Support Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tickets.map(ticket => (
                  <div key={ticket.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{ticket.subject}</h3>
                        <p className="text-sm text-gray-600">{ticket.email}</p>
                      </div>
                      <select
                        value={ticket.status}
                        onChange={(e) => updateTicketStatus(ticket.id, e.target.value)}
                        className="px-3 py-1 border rounded"
                      >
                        <option value="open">Open</option>
                        <option value="pending">Pending</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{ticket.message}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Priority: {ticket.priority}</span>
                      <span>Created: {new Date(ticket.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Last 30 Days</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">New Users</span>
                    <span className="font-semibold">{analytics.new_users}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{width: '60%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">New Orders</span>
                    <span className="font-semibold">{analytics.new_orders}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{width: '80%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">Active Users</span>
                    <span className="font-semibold">{analytics.active_users}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{width: '70%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">New Tickets</span>
                    <span className="font-semibold">{analytics.new_tickets}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-red-600 h-2 rounded-full" style={{width: '40%'}}></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Database Status</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                      Healthy
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">API Status</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                      Online
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Email Service</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                      Active
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminPage;
