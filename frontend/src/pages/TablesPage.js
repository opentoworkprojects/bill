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
import { Plus, Users, QrCode, X } from 'lucide-react';

const TablesPage = ({ user }) => {
  const [tables, setTables] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [qrModal, setQrModal] = useState({ open: false, table: null });
  const [selfOrderEnabled, setSelfOrderEnabled] = useState(false);
  const [formData, setFormData] = useState({
    table_number: '',
    capacity: '',
    status: 'available'
  });

  useEffect(() => {
    fetchTables();
    fetchWhatsappSettings();
  }, []);

  const fetchWhatsappSettings = async () => {
    try {
      const response = await axios.get(`${API}/whatsapp/settings`);
      setSelfOrderEnabled(response.data.customer_self_order_enabled || false);
    } catch (error) {
      console.error('Failed to fetch WhatsApp settings');
    }
  };

  // Auto-generate QR URL using current window location
  const generateQRUrl = (tableNumber) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/order/${user?.id}?table=${tableNumber}`;
  };
  
  // Generate tracking URL
  const generateTrackingUrl = (trackingToken) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/track/${trackingToken}`;
  };

  const fetchTables = async () => {
    try {
      const response = await axios.get(`${API}/tables`);
      setTables(response.data.sort((a, b) => a.table_number - b.table_number));
    } catch (error) {
      toast.error('Failed to fetch tables');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/tables`, formData);
      toast.success('Table created!');
      setDialogOpen(false);
      fetchTables();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create table');
    }
  };

  const resetForm = () => {
    setFormData({
      table_number: '',
      capacity: '',
      status: 'available'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      available: 'bg-green-500',
      occupied: 'bg-red-500',
      reserved: 'bg-yellow-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  return (
    <Layout user={user}>
      <div className="space-y-6" data-testid="tables-page">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Table Management</h1>
            <p className="text-gray-600 mt-2">Manage restaurant tables</p>
          </div>
          {['admin', 'cashier'].includes(user?.role) && (
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-violet-600 to-purple-600" data-testid="add-table-button">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Table
                </Button>
              </DialogTrigger>
              <DialogContent data-testid="table-dialog">
                <DialogHeader>
                  <DialogTitle>Add New Table</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Table Number</Label>
                    <Input
                      type="number"
                      value={formData.table_number}
                      onChange={(e) => setFormData({ ...formData, table_number: e.target.value })}
                      required
                      data-testid="table-number-input"
                    />
                  </div>
                  <div>
                    <Label>Capacity</Label>
                    <Input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                      required
                      data-testid="table-capacity-input"
                    />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <select
                      className="w-full px-3 py-2 border rounded-md"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="available">Available</option>
                      <option value="reserved">Reserved</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600" data-testid="save-table-button">Create</Button>
                    <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancel</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {tables.map((table) => (
            <Card
              key={table.id}
              className={`card-hover border-0 shadow-lg relative overflow-hidden`}
              data-testid={`table-card-${table.id}`}
            >
              <div className={`absolute top-0 right-0 w-3 h-3 rounded-full m-3 ${getStatusColor(table.status)}`}></div>
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-3xl font-bold text-violet-600">#{table.table_number}</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{table.capacity} seats</span>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${
                  table.status === 'available' ? 'bg-green-100 text-green-700' :
                  table.status === 'occupied' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {table.status}
                </div>
                {selfOrderEnabled && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setQrModal({ open: true, table })}
                    className="mt-2 w-full"
                  >
                    <QrCode className="w-4 h-4 mr-1" />
                    QR Code
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}

          {tables.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">No tables found</p>
            </div>
          )}
        </div>

        {/* QR Code Modal */}
        {qrModal.open && qrModal.table && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md border-0 shadow-2xl">
              <CardHeader className="relative text-center">
                <button
                  onClick={() => setQrModal({ open: false, table: null })}
                  className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
                <CardTitle>Table {qrModal.table.table_number} QR Code</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="bg-white p-4 rounded-lg inline-block">
                  {/* QR Code using Google Charts API */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(generateQRUrl(qrModal.table.table_number))}`}
                    alt={`QR Code for Table ${qrModal.table.table_number}`}
                    className="w-48 h-48 mx-auto"
                  />
                </div>
                <div className="text-sm text-gray-600">
                  <p className="font-medium">Scan to order from Table {qrModal.table.table_number}</p>
                  <p className="text-xs mt-1 break-all">{generateQRUrl(qrModal.table.table_number)}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      const printWindow = window.open('', '', 'width=400,height=500');
                      printWindow.document.write(`
                        <html>
                          <head><title>Table ${qrModal.table.table_number} QR</title></head>
                          <body style="text-align:center;padding:20px;font-family:sans-serif;">
                            <h2>Table ${qrModal.table.table_number}</h2>
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(generateQRUrl(qrModal.table.table_number))}" />
                            <p>Scan to view menu & order</p>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                      printWindow.print();
                    }}
                    className="flex-1 bg-violet-600"
                  >
                    Print QR
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(generateQRUrl(qrModal.table.table_number));
                      toast.success('Link copied!');
                    }}
                  >
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
