import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Users, Shield, UserCheck } from 'lucide-react';

const StaffManagementPage = ({ user }) => {
  const [staff, setStaff] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'waiter',
    phone: '',
    salary: ''
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await axios.get(`${API}/staff`);
      setStaff(response.data);
    } catch (error) {
      toast.error('Failed to fetch staff');
      console.error(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.username || !formData.email) {
      toast.error('Username and email are required');
      return;
    }
    
    if (!editingStaff && !formData.password) {
      toast.error('Password is required for new staff');
      return;
    }

    try {
      if (editingStaff) {
        // Only send fields that have values for update
        const updateData = {};
        if (formData.username) updateData.username = formData.username;
        if (formData.email) updateData.email = formData.email;
        if (formData.password) updateData.password = formData.password;
        if (formData.role) updateData.role = formData.role;
        if (formData.phone) updateData.phone = formData.phone;
        if (formData.salary) updateData.salary = parseFloat(formData.salary);
        
        await axios.put(`${API}/staff/${editingStaff.id}`, updateData);
        toast.success('Staff updated successfully!');
      } else {
        // Create new staff with all required fields
        const createData = {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: formData.role || 'waiter'
        };
        
        if (formData.phone) createData.phone = formData.phone;
        if (formData.salary) createData.salary = parseFloat(formData.salary);
        
        await axios.post(`${API}/staff/create`, createData);
        toast.success('Staff member added successfully!');
      }
      
      setDialogOpen(false);
      fetchStaff();
      resetForm();
    } catch (error) {
      const errorMsg = error.response?.data?.detail || error.message || 'Failed to save staff';
      toast.error(errorMsg);
      console.error('Staff save error:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this staff member?')) return;
    try {
      await axios.delete(`${API}/staff/${id}`);
      toast.success('Staff member removed');
      fetchStaff();
    } catch (error) {
      toast.error('Failed to delete staff');
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'waiter',
      phone: '',
      salary: ''
    });
    setEditingStaff(null);
  };

  const handleEdit = (member) => {
    setEditingStaff(member);
    setFormData({
      username: member.username,
      email: member.email,
      password: '',
      role: member.role,
      phone: member.phone || '',
      salary: member.salary || ''
    });
    setDialogOpen(true);
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-700',
      cashier: 'bg-green-100 text-green-700',
      waiter: 'bg-blue-100 text-blue-700',
      kitchen: 'bg-orange-100 text-orange-700'
    };
    return colors[role] || 'bg-gray-100 text-gray-700';
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return Shield;
      case 'cashier': return UserCheck;
      default: return Users;
    }
  };

  if (user?.role !== 'admin') {
    return (
      <Layout user={user}>
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500">Only admin can access staff management</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user}>
      <div className="space-y-6" data-testid="staff-management-page">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Staff Management</h1>
            <p className="text-gray-600 mt-2">Manage your restaurant staff and roles</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-violet-600 to-purple-600" data-testid="add-staff-button">
                <Plus className="w-4 h-4 mr-2" />
                Add Staff Member
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="staff-dialog">
              <DialogHeader>
                <DialogTitle>{editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Username *</Label>
                    <Input
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      required
                      data-testid="staff-username-input"
                    />
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      data-testid="staff-email-input"
                    />
                  </div>
                  <div>
                    <Label>{editingStaff ? 'New Password (leave empty to keep current)' : 'Password *'}</Label>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={!editingStaff}
                      data-testid="staff-password-input"
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 1234567890"
                    />
                  </div>
                  <div>
                    <Label>Role *</Label>
                    <select
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      data-testid="staff-role-select"
                    >
                      <option value="waiter">Waiter</option>
                      <option value="cashier">Cashier</option>
                      <option value="kitchen">Kitchen Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <Label>Monthly Salary (Optional)</Label>
                    <Input
                      type="number"
                      value={formData.salary}
                      onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                      placeholder="25000"
                    />
                  </div>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg text-sm">
                  <p className="font-medium text-blue-900 mb-1">Role Permissions:</p>
                  <ul className="text-blue-700 text-xs space-y-1">
                    {formData.role === 'admin' && (
                      <>
                        <li>✓ Full access to all features</li>
                        <li>✓ Manage staff, settings, and reports</li>
                      </>
                    )}
                    {formData.role === 'cashier' && (
                      <>
                        <li>✓ Manage orders, billing, and payments</li>
                        <li>✓ Manage menu and inventory</li>
                      </>
                    )}
                    {formData.role === 'waiter' && (
                      <>
                        <li>✓ Create and manage orders</li>
                        <li>✓ View menu and tables</li>
                      </>
                    )}
                    {formData.role === 'kitchen' && (
                      <>
                        <li>✓ View kitchen orders</li>
                        <li>✓ Update order status</li>
                      </>
                    )}
                  </ul>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600" data-testid="save-staff-button">
                    {editingStaff ? 'Update Staff' : 'Add Staff'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancel</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((member) => {
            const RoleIcon = getRoleIcon(member.role);
            return (
              <Card key={member.id} className="card-hover border-0 shadow-lg" data-testid={`staff-card-${member.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center">
                        <RoleIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{member.username}</CardTitle>
                        <p className="text-sm text-gray-500">{member.email}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Role:</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                        {member.role.toUpperCase()}
                      </span>
                    </div>
                    {member.phone && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Phone:</span>
                        <span className="text-sm font-medium">{member.phone}</span>
                      </div>
                    )}
                    {member.salary && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Salary:</span>
                        <span className="text-sm font-medium">₹{member.salary}/month</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Joined:</span>
                      <span>{new Date(member.created_at).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(member)}
                        className="flex-1"
                        data-testid={`edit-staff-${member.id}`}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      {member.role !== 'admin' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                          onClick={() => handleDelete(member.id)}
                          data-testid={`delete-staff-${member.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {staff.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No staff members added yet</p>
              <p className="text-sm text-gray-400 mt-1">Click 'Add Staff Member' to get started</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default StaffManagementPage;