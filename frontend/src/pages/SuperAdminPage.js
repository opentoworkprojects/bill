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
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamStats, setTeamStats] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [showCreateLead, setShowCreateLead] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newLead, setNewLead] = useState({ name: '', email: '', phone: '', businessName: '', notes: '' });
  const [newTeamMember, setNewTeamMember] = useState({ 
    username: '', email: '', password: '', role: 'sales', 
    permissions: [], full_name: '', phone: '' 
  });

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

      // Fetch team members
      const teamRes = await axios.get(`${API}/super-admin/team`, {
        params: credentials
      });
      setTeamMembers(teamRes.data.members);
      setTeamStats(teamRes.data.stats);

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

  const createLead = async () => {
    if (!newLead.name || !newLead.email || !newLead.phone) {
      toast.error('Please fill required fields');
      return;
    }

    try {
      await axios.post(
        `${API}/super-admin/leads`,
        newLead,
        { params: credentials }
      );
      toast.success('Lead created successfully');
      setShowCreateLead(false);
      setNewLead({ name: '', email: '', phone: '', businessName: '', notes: '' });
      fetchAllData();
    } catch (error) {
      toast.error('Failed to create lead');
    }
  };

  const createTeamMember = async () => {
    if (!newTeamMember.username || !newTeamMember.email || !newTeamMember.password) {
      toast.error('Please fill required fields');
      return;
    }

    try {
      await axios.post(
        `${API}/super-admin/team`,
        newTeamMember,
        { params: credentials }
      );
      toast.success('Team member created successfully');
      setShowCreateTeam(false);
      setNewTeamMember({ 
        username: '', email: '', password: '', role: 'sales', 
        permissions: [], full_name: '', phone: '' 
      });
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create team member');
    }
  };

  const updateTeamMember = async (memberId, updates) => {
    try {
      await axios.put(
        `${API}/super-admin/team/${memberId}`,
        updates,
        { params: credentials }
      );
      toast.success('Team member updated');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to update team member');
    }
  };

  const deleteTeamMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to delete this team member?')) return;
    
    try {
      await axios.delete(`${API}/super-admin/team/${memberId}`, {
        params: credentials
      });
      toast.success('Team member deleted');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to delete team member');
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
        <div className="mb-6 flex gap-2 border-b overflow-x-auto">
          {['dashboard', 'users', 'leads', 'team', 'tickets', 'analytics'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium capitalize whitespace-nowrap ${
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Lead Management</CardTitle>
                  {leadsStats && (
                    <div className="flex gap-4 mt-2 text-sm">
                      <span className="text-blue-600">New: {leadsStats.new}</span>
                      <span className="text-yellow-600">Contacted: {leadsStats.contacted}</span>
                      <span className="text-green-600">Converted: {leadsStats.converted}</span>
                    </div>
                  )}
                </div>
                <Button onClick={() => setShowCreateLead(true)}>
                  + Add Lead
                </Button>
              </div>
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

        {/* Team Tab */}
        {activeTab === 'team' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team Management</CardTitle>
                  {teamStats && (
                    <div className="flex gap-4 mt-2 text-sm">
                      <span className="text-blue-600">Sales: {teamStats.sales}</span>
                      <span className="text-green-600">Support: {teamStats.support}</span>
                      <span className="text-purple-600">Admin: {teamStats.admin}</span>
                    </div>
                  )}
                </div>
                <Button onClick={() => setShowCreateTeam(true)}>
                  + Add Team Member
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Username</th>
                      <th className="text-left p-2">Email</th>
                      <th className="text-left p-2">Role</th>
                      <th className="text-left p-2">Permissions</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.map(member => (
                      <tr key={member.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{member.full_name || '-'}</td>
                        <td className="p-2">{member.username}</td>
                        <td className="p-2">{member.email}</td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            member.role === 'sales' ? 'bg-blue-100 text-blue-800' :
                            member.role === 'support' ? 'bg-green-100 text-green-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {member.role}
                          </span>
                        </td>
                        <td className="p-2 text-sm">
                          {member.permissions?.join(', ') || 'None'}
                        </td>
                        <td className="p-2">
                          <button
                            onClick={() => updateTeamMember(member.id, { active: !member.active })}
                            className={`px-2 py-1 rounded text-xs ${
                              member.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {member.active ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="p-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteTeamMember(member.id)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {teamMembers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No team members yet. Add sales or support team members to give them access.
                  </div>
                )}
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

      {/* Create Lead Modal */}
      {showCreateLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add New Lead</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    value={newLead.name}
                    onChange={(e) => setNewLead({...newLead, name: e.target.value})}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={newLead.email}
                    onChange={(e) => setNewLead({...newLead, email: e.target.value})}
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <Label>Phone *</Label>
                  <Input
                    value={newLead.phone}
                    onChange={(e) => setNewLead({...newLead, phone: e.target.value})}
                    placeholder="+91-9876543210"
                  />
                </div>
                <div>
                  <Label>Business Name</Label>
                  <Input
                    value={newLead.businessName}
                    onChange={(e) => setNewLead({...newLead, businessName: e.target.value})}
                    placeholder="Restaurant Name"
                  />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Input
                    value={newLead.notes}
                    onChange={(e) => setNewLead({...newLead, notes: e.target.value})}
                    placeholder="Additional notes..."
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={createLead} className="flex-1">Create Lead</Button>
                  <Button onClick={() => setShowCreateLead(false)} variant="outline" className="flex-1">Cancel</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Team Member Modal */}
      {showCreateTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <Card className="w-full max-w-md my-8">
            <CardHeader>
              <CardTitle>Add Team Member</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Full Name</Label>
                  <Input
                    value={newTeamMember.full_name}
                    onChange={(e) => setNewTeamMember({...newTeamMember, full_name: e.target.value})}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label>Username *</Label>
                  <Input
                    value={newTeamMember.username}
                    onChange={(e) => setNewTeamMember({...newTeamMember, username: e.target.value})}
                    placeholder="johndoe"
                  />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={newTeamMember.email}
                    onChange={(e) => setNewTeamMember({...newTeamMember, email: e.target.value})}
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <Label>Password *</Label>
                  <Input
                    type="password"
                    value={newTeamMember.password}
                    onChange={(e) => setNewTeamMember({...newTeamMember, password: e.target.value})}
                    placeholder="Secure password"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={newTeamMember.phone}
                    onChange={(e) => setNewTeamMember({...newTeamMember, phone: e.target.value})}
                    placeholder="+91-9876543210"
                  />
                </div>
                <div>
                  <Label>Role *</Label>
                  <select
                    value={newTeamMember.role}
                    onChange={(e) => setNewTeamMember({...newTeamMember, role: e.target.value})}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="sales">Sales</option>
                    <option value="support">Support</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <Label>Permissions</Label>
                  <div className="space-y-2 mt-2">
                    {['leads', 'tickets', 'users', 'analytics'].map(perm => (
                      <label key={perm} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newTeamMember.permissions.includes(perm)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewTeamMember({
                                ...newTeamMember,
                                permissions: [...newTeamMember.permissions, perm]
                              });
                            } else {
                              setNewTeamMember({
                                ...newTeamMember,
                                permissions: newTeamMember.permissions.filter(p => p !== perm)
                              });
                            }
                          }}
                        />
                        <span className="capitalize">{perm}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={createTeamMember} className="flex-1">Create Member</Button>
                  <Button onClick={() => setShowCreateTeam(false)} variant="outline" className="flex-1">Cancel</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SuperAdminPage;
