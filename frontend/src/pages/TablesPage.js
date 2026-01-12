import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import TrialBanner from '../components/TrialBanner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';
import { 
  Users, Clock, DollarSign, CheckCircle, XCircle, 
  RefreshCw, Eye, Trash2, AlertTriangle, QrCode,
  Smartphone, Wifi, WifiOff, Copy, ExternalLink,
  Settings, ToggleLeft, ToggleRight, Download, Share2
} from 'lucide-react';

const TablesPage = ({ user }) => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selfOrderingEnabled, setSelfOrderingEnabled] = useState(true);
  const [selectedTable, setSelectedTable] = useState(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);

  useEffect(() => {
    fetchTables();
    fetchSettings();
    
    // Enhanced auto-refresh with exponential backoff on errors
    let refreshInterval = 15000; // Start with 15 seconds
    let errorCount = 0;
    
    const setupRefresh = () => {
      const interval = setInterval(async () => {
        try {
          await fetchTables();
          // Reset interval and error count on success
          if (errorCount > 0) {
            errorCount = 0;
            refreshInterval = 15000;
            clearInterval(interval);
            setupRefresh();
          }
        } catch (error) {
          errorCount++;
          // Exponential backoff: 15s, 30s, 60s, max 120s
          refreshInterval = Math.min(15000 * Math.pow(2, errorCount), 120000);
          clearInterval(interval);
          setTimeout(setupRefresh, refreshInterval);
        }
      }, refreshInterval);
      
      return interval;
    };
    
    const interval = setupRefresh();
    
    // Listen for visibility changes to refresh when tab becomes active
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchTables();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Listen for focus events to refresh when window gets focus
    const handleFocus = () => {
      fetchTables();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/tables`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setTables(response.data || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching tables:', error);
      if (error.response?.status === 401) {
        setError('Please login to access tables');
        toast.error('Session expired. Please login again.');
      } else {
        setError('Failed to load tables');
        toast.error('Failed to load tables');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSelfOrderingEnabled(response.data?.self_ordering_enabled ?? true);
    } catch (error) {
      console.log('Settings not available, using defaults');
    }
  };

  const toggleSelfOrdering = async () => {
    try {
      const newValue = !selfOrderingEnabled;
      await axios.put(`${API}/settings`, 
        { self_ordering_enabled: newValue },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setSelfOrderingEnabled(newValue);
      toast.success(`Self-ordering ${newValue ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };

  const markTableOccupied = async (tableId, orderId) => {
    try {
      await axios.post(`${API}/tables/${tableId}/occupy`, 
        { order_id: orderId },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      // Immediately refresh tables to show updated status
      fetchTables();
    } catch (error) {
      console.error('Error marking table as occupied:', error);
    }
  };

  const clearTable = async (tableId) => {
    if (!window.confirm('Are you sure you want to clear this table? This will remove any pending orders.')) return;

    try {
      await axios.post(`${API}/tables/${tableId}/clear`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success('Table cleared successfully');
      fetchTables(); // Refresh immediately after clearing
    } catch (error) {
      console.error('Error clearing table:', error);
      toast.error('Failed to clear table');
    }
  };

  const getTableStatus = (table) => {
    // Enhanced status detection with better real-time handling
    if (table.current_order) {
      const order = table.current_order;
      
      // Check if order is completed and paid - needs clearing
      if (order.status === 'completed' && order.payment_status === 'paid') {
        return 'needs_clearing';
      }
      // Partial payment - customer still at table
      else if (order.payment_status === 'partial') {
        return 'partial_payment';
      }
      // Unpaid but completed order - waiting for payment
      else if (order.status === 'completed' && order.payment_status === 'unpaid') {
        return 'unpaid';
      }
      // Order in progress (pending, preparing, ready)
      else if (['pending', 'preparing', 'ready'].includes(order.status)) {
        return 'occupied';
      }
      // Any other order state - consider occupied
      else {
        return 'occupied';
      }
    }
    
    // Check if table is manually marked as occupied (reserved)
    if (table.is_occupied) {
      return 'reserved';
    }
    
    // Check if table has recent activity (within last 5 minutes)
    if (table.last_activity) {
      const lastActivity = new Date(table.last_activity);
      const now = new Date();
      const timeDiff = (now - lastActivity) / (1000 * 60); // minutes
      
      if (timeDiff < 5) {
        return 'reserved'; // Recently used, might be getting ready
      }
    }
    
    // Table is available for new orders
    return 'available';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'occupied': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'reserved': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'needs_clearing': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'partial_payment': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'unpaid': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available': return <CheckCircle className="w-4 h-4" />;
      case 'occupied': return <Users className="w-4 h-4" />;
      case 'reserved': return <Clock className="w-4 h-4" />;
      case 'needs_clearing': return <AlertTriangle className="w-4 h-4" />;
      case 'partial_payment': return <DollarSign className="w-4 h-4" />;
      case 'unpaid': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'available': return 'Available';
      case 'occupied': return 'Occupied';
      case 'reserved': return 'Reserved';
      case 'needs_clearing': return 'Needs Clearing';
      case 'partial_payment': return 'Partial Payment';
      case 'unpaid': return 'Unpaid';
      default: return 'Unknown';
    }
  };

  const generateQRUrl = (tableNumber) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/menu?table=${tableNumber}&source=qr`;
  };

  const copyQRUrl = (tableNumber) => {
    const url = generateQRUrl(tableNumber);
    navigator.clipboard.writeText(url);
    toast.success('QR URL copied to clipboard');
  };

  const openQRDialog = (table) => {
    setSelectedTable(table);
    setQrDialogOpen(true);
  };

  const occupiedTables = tables.filter(table => getTableStatus(table) !== 'available');
  const availableTables = tables.filter(table => getTableStatus(table) === 'available');

  if (loading && tables.length === 0) {
    return (
      <Layout user={user}>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user}>
      <div className="space-y-6">
        <TrialBanner user={user} />
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <Users className="w-8 h-8" />
                  Tables Management
                </h1>
                <p className="text-white/80 mt-2">
                  Monitor table status, manage orders, and track occupancy
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2">
                    {selfOrderingEnabled ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                    <span className="text-sm">
                      Self-ordering: {selfOrderingEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="text-sm opacity-75">
                    Auto-refresh: 15s
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  onClick={toggleSelfOrdering}
                  variant="outline" 
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  {selfOrderingEnabled ? <ToggleRight className="w-4 h-4 mr-2" /> : <ToggleLeft className="w-4 h-4 mr-2" />}
                  {selfOrderingEnabled ? 'Disable' : 'Enable'} QR
                </Button>
                <Button 
                  onClick={fetchTables}
                  variant="outline" 
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Tables</p>
                  <p className="text-2xl font-bold">{tables.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Available</p>
                  <p className="text-2xl font-bold text-green-600">{availableTables.length}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Occupied</p>
                  <p className="text-2xl font-bold text-blue-600">{occupiedTables.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Self-Ordering</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {selfOrderingEnabled ? 'ON' : 'OFF'}
                  </p>
                </div>
                {selfOrderingEnabled ? <QrCode className="w-8 h-8 text-purple-600" /> : <WifiOff className="w-8 h-8 text-gray-400" />}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Occupancy Rate</p>
                  <p className="text-2xl font-bold">
                    {tables.length > 0 ? Math.round((occupiedTables.length / tables.length) * 100) : 0}%
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tables Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Tables Overview ({tables.length} tables)</CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center py-8 text-red-600">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
                <p>{error}</p>
                <Button onClick={fetchTables} className="mt-4">
                  Try Again
                </Button>
              </div>
            ) : tables.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4" />
                <p>No tables found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {tables.map((table) => {
                  const status = getTableStatus(table);
                  const order = table.current_order;
                  
                  return (
                    <Card key={table.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-bold text-lg">Table {table.number}</h3>
                          <Badge className={getStatusColor(status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(status)}
                              <span className="capitalize">{status}</span>
                            </div>
                          </Badge>
                        </div>
                        
                        {table.capacity && (
                          <p className="text-sm text-gray-600 mb-2">
                            <Users className="w-4 h-4 inline mr-1" />
                            Capacity: {table.capacity} people
                          </p>
                        )}
                        
                        {/* Enhanced QR Code Display for Available Tables */}
                        {status === 'available' && selfOrderingEnabled && (
                          <div className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                                  <QrCode className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-sm font-medium text-blue-700">Self-Order Ready</span>
                              </div>
                              <Badge className="bg-green-100 text-green-700 border-green-200">
                                <Wifi className="w-3 h-3 mr-1" />
                                Active
                              </Badge>
                            </div>
                            <div className="flex gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                                  >
                                    <QrCode className="w-4 h-4 mr-1" />
                                    Show QR
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                  <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                      <QrCode className="w-5 h-5" />
                                      Table {table.number} - QR Code
                                    </DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="text-center">
                                      <div className="w-64 h-64 mx-auto bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center">
                                        <img 
                                          src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(generateQRUrl(table.number))}`}
                                          alt={`QR Code for Table ${table.number}`}
                                          className="w-full h-full object-contain"
                                        />
                                      </div>
                                      <p className="text-sm text-gray-600 mt-2">
                                        Scan to order from Table {table.number}
                                      </p>
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                                        <ExternalLink className="w-4 h-4 text-gray-500" />
                                        <span className="font-mono text-xs flex-1 truncate">
                                          {generateQRUrl(table.number)}
                                        </span>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => copyQRUrl(table.number)}
                                        >
                                          <Copy className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => window.open(generateQRUrl(table.number), '_blank')}
                                      >
                                        <Smartphone className="w-4 h-4 mr-2" />
                                        Test Menu
                                      </Button>
                                      <Button
                                        variant="outline"
                                        onClick={() => {
                                          const link = document.createElement('a');
                                          link.href = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(generateQRUrl(table.number))}`;
                                          link.download = `table-${table.number}-qr.png`;
                                          link.click();
                                          toast.success('QR code downloaded');
                                        }}
                                      >
                                        <Download className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyQRUrl(table.number)}
                                className="text-purple-600 border-purple-200 hover:bg-purple-50"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {/* Self-ordering disabled message */}
                        {status === 'available' && !selfOrderingEnabled && (
                          <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2 text-gray-500">
                              <WifiOff className="w-4 h-4" />
                              <span className="text-sm">Self-ordering disabled</span>
                            </div>
                          </div>
                        )}
                        
                        {order && (
                          <div className="space-y-2 text-sm bg-gray-50 p-3 rounded-lg">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">Order Details:</span>
                              <Badge variant="outline" className="text-xs">
                                #{order.id}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span>Total Amount:</span>
                              <span className="font-bold text-green-600">₹{order.total_amount}</span>
                            </div>
                            {order.payment_status && (
                              <div className="flex justify-between">
                                <span>Payment Status:</span>
                                <Badge 
                                  variant={order.payment_status === 'paid' ? 'default' : 'destructive'}
                                  className="text-xs"
                                >
                                  {order.payment_status}
                                </Badge>
                              </div>
                            )}
                            {order.status && (
                              <div className="flex justify-between">
                                <span>Order Status:</span>
                                <Badge variant="outline" className="text-xs">
                                  {order.status}
                                </Badge>
                              </div>
                            )}
                            {order.created_at && (
                              <div className="flex justify-between">
                                <span>Started:</span>
                                <span className="text-xs text-gray-600">
                                  {new Date(order.created_at).toLocaleTimeString()}
                                </span>
                              </div>
                            )}
                            {order.items && order.items.length > 0 && (
                              <div className="pt-2 border-t border-gray-200">
                                <span className="text-xs text-gray-600">
                                  {order.items.length} item(s) ordered
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-4">
                          {status !== 'available' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => clearTable(table.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Clear Table
                              </Button>
                              {order && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(`/billing?table=${table.id}`, '_blank')}
                                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  View Bill
                                </Button>
                              )}
                            </>
                          )}
                          
                          {status === 'available' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => window.open(`/menu?table=${table.number}&source=staff`, '_blank')}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Take Order
                              </Button>
                              {selfOrderingEnabled && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const qrUrl = generateQRUrl(table.number);
                                    if (navigator.share) {
                                      navigator.share({
                                        title: `Table ${table.number} - Order Menu`,
                                        text: `Scan QR or visit link to order from Table ${table.number}`,
                                        url: qrUrl
                                      });
                                    } else {
                                      copyQRUrl(table.number);
                                    }
                                  }}
                                  className="text-purple-600 border-purple-200 hover:bg-purple-50"
                                >
                                  <Share2 className="w-4 h-4" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default TablesPage;
