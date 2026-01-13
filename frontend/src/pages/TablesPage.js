import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import TrialBanner from '../components/TrialBanner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { 
  Plus, Users, QrCode, X, Edit, Trash2, Clock, Calendar,
  MapPin, BarChart3, TrendingUp, RefreshCw, Download,
  Search, Filter, CheckCircle, XCircle, Grid3X3, Phone, Utensils,
  Star, Award, Activity, Sparkles, Eye, Coffee, Sofa
} from 'lucide-react';

const TablesPage = ({ user }) => {
  const [tables, setTables] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reservationDialogOpen, setReservationDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [qrModal, setQrModal] = useState({ open: false, table: null });
  const [selfOrderEnabled, setSelfOrderEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('tables');
  const [formData, setFormData] = useState({
    table_number: '', capacity: '', status: 'available', location: '',
    section: '', table_type: 'regular', notes: ''
  });
  const [reservationFormData, setReservationFormData] = useState({
    table_id: '', customer_name: '', customer_phone: '', customer_email: '',
    party_size: '', reservation_date: '', reservation_time: '', duration: '120',
    notes: '', status: 'confirmed'
  });

  // Force refresh on mount to ensure fresh data (fixes stale table status after payment)
  useEffect(() => { fetchAllData(true); }, []);

  // Auto-refresh when window gains focus (user returns from BillingPage)
  useEffect(() => {
    const handleFocus = () => {
      console.log('🔄 Window focused - refreshing tables');
      fetchTables(true);
    };
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('🔄 Page visible - refreshing tables');
        fetchTables(true);
      }
    };
    
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchAllData = async (forceRefresh = false) => {
    setLoading(true);
    try {
      await Promise.all([fetchTables(forceRefresh), fetchReservations(), fetchWhatsappSettings()]);
    } catch (error) { console.error('Error fetching data:', error); }
    finally { setLoading(false); }
  };

  const fetchWhatsappSettings = async () => {
    try {
      const response = await axios.get(`${API}/whatsapp/settings`);
      setSelfOrderEnabled(response.data.customer_self_order_enabled || false);
    } catch (error) { console.error('Failed to fetch WhatsApp settings'); }
  };

  const fetchTables = async (forceRefresh = false) => {
    try {
      // Always use fresh=true parameter to bypass cache and get direct DB data
      // Add cache-busting timestamp when force refresh is requested
      const params = new URLSearchParams();
      params.append('fresh', 'true');  // Always bypass cache for table status
      if (forceRefresh) {
        params.append('_t', Date.now().toString());  // Cache-busting for browser
      }
      const url = `${API}/tables?${params.toString()}`;
      console.log(`🍽️ Fetching tables${forceRefresh ? ' (force refresh)' : ''} with fresh=true...`);
      const response = await axios.get(url);
      setTables(response.data.sort((a, b) => a.table_number - b.table_number));
      console.log(`✅ Fetched ${response.data.length} tables`);
    } catch (error) { 
      console.error('Failed to fetch tables:', error);
      toast.error('Failed to fetch tables'); 
    }
  };

  const fetchReservations = async () => {
    try {
      const response = await axios.get(`${API}/tables/reservations`);
      setReservations(response.data || []);
    } catch (error) { console.error('Failed to fetch reservations:', error); setReservations([]); }
  };

  const generateQRUrl = (tableNumber) => `${window.location.origin}/order/${user?.id}?table=${tableNumber}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTable) {
        await axios.put(`${API}/tables/${editingTable.id}`, formData);
        toast.success('Table updated!');
      } else {
        await axios.post(`${API}/tables`, formData);
        toast.success('Table created!');
      }
      setDialogOpen(false); fetchTables(); resetForm();
    } catch (error) { toast.error(error.response?.data?.detail || 'Failed to save table'); }
  };

  const handleReservationSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/tables/reservations`, reservationFormData);
      toast.success('Reservation created!');
      setReservationDialogOpen(false); fetchReservations(); resetReservationForm();
    } catch (error) { toast.error(error.response?.data?.detail || 'Failed to create reservation'); }
  };

  const resetForm = () => {
    setFormData({ table_number: '', capacity: '', status: 'available', location: '', section: '', table_type: 'regular', notes: '' });
    setEditingTable(null);
  };

  const resetReservationForm = () => {
    setReservationFormData({ table_id: '', customer_name: '', customer_phone: '', customer_email: '',
      party_size: '', reservation_date: '', reservation_time: '', duration: '120', notes: '', status: 'confirmed' });
  };

  const handleEdit = (table) => {
    setEditingTable(table);
    setFormData({ table_number: table.table_number, capacity: table.capacity, status: table.status,
      location: table.location || '', section: table.section || '', table_type: table.table_type || 'regular', notes: table.notes || '' });
    setDialogOpen(true);
  };

  const handleDelete = async (tableId) => {
    if (!window.confirm('Delete this table?')) return;
    try {
      await axios.delete(`${API}/tables/${tableId}`);
      toast.success('Table deleted!'); fetchTables();
    } catch (error) { toast.error('Failed to delete table'); }
  };

  const handleClearTable = async (table) => {
    if (!window.confirm(`Clear Table #${table.table_number}?`)) return;
    try {
      await axios.put(`${API}/tables/${table.id}`, { ...table, status: 'available' });
      toast.success(`Table #${table.table_number} cleared!`); fetchTables();
    } catch (error) { toast.error('Failed to clear table'); }
  };

  const getStatusColor = (status) => {
    const colors = { available: 'from-green-500 to-emerald-500', occupied: 'from-red-500 to-rose-500',
      reserved: 'from-yellow-500 to-amber-500', maintenance: 'from-gray-500 to-slate-500', cleaning: 'from-blue-500 to-cyan-500' };
    return colors[status] || 'from-gray-500 to-slate-500';
  };

  const getStatusBadgeColor = (status) => {
    const colors = { available: 'bg-green-100 text-green-700', occupied: 'bg-red-100 text-red-700',
      reserved: 'bg-yellow-100 text-yellow-700', maintenance: 'bg-gray-100 text-gray-700', cleaning: 'bg-blue-100 text-blue-700' };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getTableTypeIcon = (type) => {
    switch (type) {
      case 'vip': return Star;
      case 'outdoor': return MapPin;
      case 'booth': return Sofa;
      case 'bar': return Coffee;
      default: return Utensils;
    }
  };

  const filteredTables = useMemo(() => {
    return tables.filter(table => {
      const matchesSearch = table.table_number.toString().includes(searchTerm) ||
        (table.section && table.section.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (table.location && table.location.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = filterStatus === 'all' || table.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [tables, searchTerm, filterStatus]);

  const analytics = useMemo(() => {
    const totalTables = tables.length;
    const availableTables = tables.filter(t => t.status === 'available').length;
    const occupiedTables = tables.filter(t => t.status === 'occupied').length;
    const reservedTables = tables.filter(t => t.status === 'reserved').length;
    const totalCapacity = tables.reduce((sum, t) => sum + (t.capacity || 0), 0);
    const occupancyRate = totalTables > 0 ? ((occupiedTables + reservedTables) / totalTables) * 100 : 0;
    const sectionDistribution = tables.reduce((acc, t) => { const section = t.section || 'Main'; acc[section] = (acc[section] || 0) + 1; return acc; }, {});
    return { totalTables, availableTables, occupiedTables, reservedTables, totalCapacity, occupancyRate, sectionDistribution };
  }, [tables]);

  const handleExportTables = () => {
    const csvContent = [['Table Number', 'Capacity', 'Status', 'Section', 'Location', 'Type'],
      ...filteredTables.map(t => [t.table_number, t.capacity || '', t.status, t.section || '', t.location || '', t.table_type || 'regular'])
    ].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `tables-${new Date().toISOString().split('T')[0]}.csv`; a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Exported to CSV!');
  };

  if (loading) {
    return (
      <Layout user={user}>
        <div className="space-y-6">
          <TrialBanner user={user} />
          <div className="h-48 bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl animate-pulse"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="h-40 bg-gray-200 rounded-xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user}>
      <div className="space-y-6" data-testid="tables-page">
        <TrialBanner user={user} />
        
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <Grid3X3 className="w-8 h-8" />
                  Table Management
                </h1>
                <p className="text-white/80 mt-2">Manage tables, reservations, and floor plan</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="secondary" size="sm" onClick={handleExportTables}>
                  <Download className="w-4 h-4 mr-2" />Export
                </Button>
                <Button variant="secondary" size="sm" onClick={fetchAllData}>
                  <RefreshCw className="w-4 h-4 mr-2" />Refresh
                </Button>
              </div>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <Grid3X3 className="w-6 h-6 mb-2" />
                <div className="text-2xl font-bold">{analytics.totalTables}</div>
                <div className="text-sm text-white/70">Total Tables</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <CheckCircle className="w-6 h-6 mb-2 text-green-300" />
                <div className="text-2xl font-bold">{analytics.availableTables}</div>
                <div className="text-sm text-white/70">Available</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <Users className="w-6 h-6 mb-2" />
                <div className="text-2xl font-bold">{analytics.totalCapacity}</div>
                <div className="text-sm text-white/70">Total Seats</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <Activity className="w-6 h-6 mb-2" />
                <div className="text-2xl font-bold">{analytics.occupancyRate.toFixed(0)}%</div>
                <div className="text-sm text-white/70">Occupancy</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white shadow-sm">
            <TabsTrigger value="tables" className="flex items-center gap-2">
              <Grid3X3 className="w-4 h-4" />Tables
            </TabsTrigger>
            <TabsTrigger value="reservations" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />Reservations
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />Analytics
            </TabsTrigger>
          </TabsList>

          {/* Tables Tab */}
          <TabsContent value="tables" className="space-y-6">
            {/* Search and Filter Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border">
              <div className="flex gap-4 flex-wrap items-center">
                <div className="flex-1 min-w-[200px] relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input placeholder="Search by table number, section..." value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="reserved">Reserved</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="cleaning">Cleaning</SelectItem>
                  </SelectContent>
                </Select>
                {(searchTerm || filterStatus !== 'all') && (
                  <Button variant="outline" size="sm" onClick={() => { setSearchTerm(''); setFilterStatus('all'); }}>Clear</Button>
                )}
                {['admin', 'cashier'].includes(user?.role) && (
                  <>
                    <Button variant="outline" className="border-purple-500 text-purple-600" onClick={() => { resetReservationForm(); setReservationDialogOpen(true); }}>
                      <Calendar className="w-4 h-4 mr-2" />New Reservation
                    </Button>
                    <Button className="bg-gradient-to-r from-violet-600 to-purple-600" onClick={() => { resetForm(); setDialogOpen(true); }}>
                      <Plus className="w-4 h-4 mr-2" />Add Table
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Tables Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {filteredTables.map((table) => {
                const TableTypeIcon = getTableTypeIcon(table.table_type);
                return (
                  <Card key={table.id} className="border-0 shadow-lg hover:shadow-xl transition-all overflow-hidden group">
                    {/* Status Header */}
                    <div className={`h-2 bg-gradient-to-r ${getStatusColor(table.status)}`}></div>
                    
                    <CardHeader className="text-center pb-2 pt-4">
                      <div className="relative">
                        <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${getStatusColor(table.status)} flex items-center justify-center text-white shadow-lg`}>
                          <span className="text-2xl font-bold">{table.table_number}</span>
                        </div>
                        {table.table_type && table.table_type !== 'regular' && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                            <TableTypeIcon className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      {table.section && <p className="text-xs text-gray-500 mt-2">{table.section}</p>}
                    </CardHeader>
                    
                    <CardContent className="text-center space-y-3 pb-4">
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>{table.capacity} seats</span>
                      </div>
                      
                      <Badge className={getStatusBadgeColor(table.status)}>
                        {table.status.replace('_', ' ').toUpperCase()}
                      </Badge>

                      {table.location && (
                        <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" />{table.location}
                        </div>
                      )}

                      <div className="space-y-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-1 justify-center">
                          {selfOrderEnabled && table.status === 'available' && (
                            <Button size="sm" variant="outline" onClick={() => setQrModal({ open: true, table })} title="QR Code">
                              <QrCode className="w-3 h-3" />
                            </Button>
                          )}
                          {['admin', 'cashier'].includes(user?.role) && (
                            <Button size="sm" variant="outline" onClick={() => handleEdit(table)} title="Edit">
                              <Edit className="w-3 h-3" />
                            </Button>
                          )}
                          {['admin'].includes(user?.role) && (
                            <Button size="sm" variant="outline" className="border-red-500 text-red-600" onClick={() => handleDelete(table.id)} title="Delete">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                        {table.status === 'occupied' && ['admin', 'cashier', 'waiter'].includes(user?.role) && (
                          <Button size="sm" variant="destructive" className="w-full text-xs" onClick={() => handleClearTable(table)}>
                            Clear Table
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {filteredTables.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Grid3X3 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No tables found</h3>
                  <p className="text-gray-500 mb-4">{searchTerm || filterStatus !== 'all' ? 'Try adjusting filters' : 'Add your first table'}</p>
                  {!searchTerm && filterStatus === 'all' && ['admin', 'cashier'].includes(user?.role) && (
                    <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="bg-gradient-to-r from-violet-600 to-purple-600">
                      <Plus className="w-4 h-4 mr-2" />Add First Table
                    </Button>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Reservations Tab */}
          <TabsContent value="reservations" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Calendar className="w-6 h-6 text-violet-600" />Today's Reservations
              </h2>
              {['admin', 'cashier'].includes(user?.role) && (
                <Button className="bg-gradient-to-r from-violet-600 to-purple-600" onClick={() => { resetReservationForm(); setReservationDialogOpen(true); }}>
                  <Plus className="w-4 h-4 mr-2" />New Reservation
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reservations.map((reservation, index) => (
                <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
                        {reservation.table_number || 'T'}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{reservation.customer_name}</p>
                        <p className="text-sm text-gray-500">{reservation.party_size} guests • {reservation.reservation_time}</p>
                      </div>
                      <Badge className={reservation.status === 'confirmed' ? 'bg-green-100 text-green-700' : reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}>
                        {reservation.status}
                      </Badge>
                    </div>
                    {reservation.customer_phone && (
                      <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
                        <Phone className="w-4 h-4" />{reservation.customer_phone}
                      </div>
                    )}
                    {reservation.notes && (
                      <p className="text-xs text-gray-400 mt-2 italic">"{reservation.notes}"</p>
                    )}
                  </CardContent>
                </Card>
              ))}
              {reservations.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No reservations today</h3>
                  <p className="text-gray-500">Reservations will appear here</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-violet-600" />Section Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(analytics.sectionDistribution).map(([section, count]) => {
                    const percentage = (count / analytics.totalTables) * 100;
                    return (
                      <div key={section}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{section}</span>
                          <span className="text-gray-600">{count} tables ({percentage.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-gradient-to-r from-violet-500 to-purple-600 h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-violet-600" />Status Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-green-50 rounded-lg flex justify-between items-center">
                    <span className="text-gray-600">Available</span>
                    <span className="text-2xl font-bold text-green-600">{analytics.availableTables}</span>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg flex justify-between items-center">
                    <span className="text-gray-600">Occupied</span>
                    <span className="text-2xl font-bold text-red-600">{analytics.occupiedTables}</span>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg flex justify-between items-center">
                    <span className="text-gray-600">Reserved</span>
                    <span className="text-2xl font-bold text-yellow-600">{analytics.reservedTables}</span>
                  </div>
                  <div className="p-3 bg-violet-50 rounded-lg flex justify-between items-center">
                    <span className="text-gray-600">Occupancy Rate</span>
                    <span className="text-2xl font-bold text-violet-600">{analytics.occupancyRate.toFixed(1)}%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Add/Edit Table Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Utensils className="w-5 h-5" />{editingTable ? 'Edit Table' : 'Add New Table'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label>Table Number *</Label><Input type="number" value={formData.table_number} onChange={(e) => setFormData({ ...formData, table_number: e.target.value })} required placeholder="1" /></div>
                  <div><Label>Capacity *</Label><Input type="number" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} required placeholder="4" /></div>
                  <div><Label>Table Type</Label>
                    <Select value={formData.table_type} onValueChange={(value) => setFormData({ ...formData, table_type: value })}>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="regular">Regular</SelectItem>
                        <SelectItem value="booth">Booth</SelectItem>
                        <SelectItem value="vip">VIP</SelectItem>
                        <SelectItem value="outdoor">Outdoor</SelectItem>
                        <SelectItem value="bar">Bar Seating</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="reserved">Reserved</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="cleaning">Cleaning</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Location Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label>Section</Label><Input value={formData.section} onChange={(e) => setFormData({ ...formData, section: e.target.value })} placeholder="Main Hall, Patio, VIP Area" /></div>
                  <div><Label>Location</Label><Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="Near window, Corner" /></div>
                </div>
              </div>
              <div><Label>Notes</Label><Input value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Special features, accessibility notes" /></div>
              <div className="flex gap-3">
                <Button type="submit" className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600"><CheckCircle className="w-4 h-4 mr-2" />{editingTable ? 'Update' : 'Create'} Table</Button>
                <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}><XCircle className="w-4 h-4 mr-2" />Cancel</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Reservation Dialog */}
        <Dialog open={reservationDialogOpen} onOpenChange={(open) => { setReservationDialogOpen(open); if (!open) resetReservationForm(); }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />New Reservation
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleReservationSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Table</Label>
                  <Select value={reservationFormData.table_id} onValueChange={(value) => setReservationFormData({ ...reservationFormData, table_id: value })}>
                    <SelectTrigger><SelectValue placeholder="Select table" /></SelectTrigger>
                    <SelectContent>
                      {tables.filter(t => t.status === 'available').map(table => (
                        <SelectItem key={table.id} value={table.id}>Table {table.table_number} ({table.capacity} seats)</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Party Size</Label><Input type="number" value={reservationFormData.party_size} onChange={(e) => setReservationFormData({ ...reservationFormData, party_size: e.target.value })} required /></div>
                <div><Label>Customer Name *</Label><Input value={reservationFormData.customer_name} onChange={(e) => setReservationFormData({ ...reservationFormData, customer_name: e.target.value })} required /></div>
                <div><Label>Phone</Label><Input value={reservationFormData.customer_phone} onChange={(e) => setReservationFormData({ ...reservationFormData, customer_phone: e.target.value })} placeholder="+91 1234567890" /></div>
                <div><Label>Date *</Label><Input type="date" value={reservationFormData.reservation_date} onChange={(e) => setReservationFormData({ ...reservationFormData, reservation_date: e.target.value })} required /></div>
                <div><Label>Time *</Label><Input type="time" value={reservationFormData.reservation_time} onChange={(e) => setReservationFormData({ ...reservationFormData, reservation_time: e.target.value })} required /></div>
                <div><Label>Duration</Label>
                  <Select value={reservationFormData.duration} onValueChange={(value) => setReservationFormData({ ...reservationFormData, duration: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="90">1.5 hours</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                      <SelectItem value="180">3 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Email</Label><Input type="email" value={reservationFormData.customer_email} onChange={(e) => setReservationFormData({ ...reservationFormData, customer_email: e.target.value })} /></div>
              </div>
              <div><Label>Special Notes</Label><Input value={reservationFormData.notes} onChange={(e) => setReservationFormData({ ...reservationFormData, notes: e.target.value })} placeholder="Birthday, dietary restrictions..." /></div>
              <div className="flex gap-3">
                <Button type="submit" className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600">Create Reservation</Button>
                <Button type="button" variant="outline" onClick={() => { setReservationDialogOpen(false); resetReservationForm(); }}>Cancel</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* QR Code Modal */}
        {qrModal.open && qrModal.table && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md border-0 shadow-2xl">
              <CardHeader className="relative text-center bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-t-lg">
                <button onClick={() => setQrModal({ open: false, table: null })} className="absolute right-4 top-4 text-white/70 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
                <CardTitle className="flex items-center justify-center gap-2">
                  <QrCode className="w-5 h-5" />Table {qrModal.table.table_number} QR Code
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4 p-6">
                <div className="bg-white p-4 rounded-xl inline-block shadow-inner">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(generateQRUrl(qrModal.table.table_number))}`}
                    alt={`QR Code for Table ${qrModal.table.table_number}`} className="w-48 h-48 mx-auto" />
                </div>
                <div className="text-sm text-gray-600">
                  <p className="font-medium">Scan to order from Table {qrModal.table.table_number}</p>
                  <p className="text-xs mt-1 break-all text-gray-400">{generateQRUrl(qrModal.table.table_number)}</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => {
                    const printWindow = window.open('', '', 'width=400,height=500');
                    printWindow.document.write(`<html><head><title>Table ${qrModal.table.table_number} QR</title></head>
                      <body style="text-align:center;padding:20px;font-family:sans-serif;">
                      <h2>Table ${qrModal.table.table_number}</h2>
                      <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(generateQRUrl(qrModal.table.table_number))}" />
                      <p>Scan to view menu & order</p></body></html>`);
                    printWindow.document.close(); printWindow.print();
                  }} className="flex-1 bg-violet-600">Print QR</Button>
                  <Button variant="outline" onClick={() => { navigator.clipboard.writeText(generateQRUrl(qrModal.table.table_number)); toast.success('Link copied!'); }}>
                    Copy Link
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TablesPage;
