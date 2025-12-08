import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import TrialBanner from '../components/TrialBanner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Plus, AlertTriangle, Package } from 'lucide-react';
import BulkUpload from '../components/BulkUpload';

const InventoryPage = ({ user }) => {
  const [inventory, setInventory] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    unit: '',
    min_quantity: '',
    price_per_unit: ''
  });

  useEffect(() => {
    fetchInventory();
    fetchLowStock();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await axios.get(`${API}/inventory`);
      setInventory(response.data);
    } catch (error) {
      toast.error('Failed to fetch inventory');
    }
  };

  const fetchLowStock = async () => {
    try {
      const response = await axios.get(`${API}/inventory/low-stock`);
      setLowStock(response.data);
    } catch (error) {
      console.error('Failed to fetch low stock', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await axios.put(`${API}/inventory/${editingItem.id}`, formData);
        toast.success('Inventory item updated!');
      } else {
        await axios.post(`${API}/inventory`, formData);
        toast.success('Inventory item created!');
      }
      setDialogOpen(false);
      fetchInventory();
      fetchLowStock();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save inventory item');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      quantity: '',
      unit: '',
      min_quantity: '',
      price_per_unit: ''
    });
    setEditingItem(null);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      min_quantity: item.min_quantity,
      price_per_unit: item.price_per_unit
    });
    setDialogOpen(true);
  };

  return (
    <Layout user={user}>
      <div className="space-y-6" data-testid="inventory-page">
        <TrialBanner user={user} />
        {/* Low Stock Alert Banner */}
        {lowStock.length > 0 && (
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-500 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900">Low Stock Alert!</h3>
                <p className="text-sm text-orange-800 mt-1">
                  {lowStock.length} item{lowStock.length > 1 ? 's' : ''} running low on stock. Restock soon to avoid shortages.
                </p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {lowStock.slice(0, 3).map(item => (
                    <span key={item.id} className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                      {item.name}: {item.quantity} {item.unit}
                    </span>
                  ))}
                  {lowStock.length > 3 && (
                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                      +{lowStock.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Inventory Management</h1>
            <p className="text-gray-600 mt-2">Track stock levels and supplies</p>
          </div>
          {['admin', 'cashier'].includes(user?.role) && (
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-violet-600 to-purple-600" data-testid="add-inventory-button">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent data-testid="inventory-dialog">
                <DialogHeader>
                  <DialogTitle>{editingItem ? 'Edit Inventory Item' : 'Add Inventory Item'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Item Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      data-testid="inventory-name-input"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        required
                        data-testid="inventory-quantity-input"
                      />
                    </div>
                    <div>
                      <Label>Unit</Label>
                      <Input
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        placeholder="kg, liters, pieces"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Min Quantity</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.min_quantity}
                        onChange={(e) => setFormData({ ...formData, min_quantity: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>Price per Unit (₹)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.price_per_unit}
                        onChange={(e) => setFormData({ ...formData, price_per_unit: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600" data-testid="save-inventory-button">
                      {editingItem ? 'Update' : 'Create'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancel</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Bulk Upload Component */}
        {['admin', 'manager'].includes(user?.role) && (
          <BulkUpload 
            type="inventory" 
            onSuccess={() => {
              fetchInventory();
              fetchLowStock();
            }}
          />
        )}

        {lowStock.length > 0 && (
          <Card className="border-0 shadow-lg border-l-4 border-l-orange-500" data-testid="low-stock-alert">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="w-5 h-5" />
                Low Stock Alert
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {lowStock.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-2 bg-orange-50 rounded-md">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-sm text-orange-700">{item.quantity} {item.unit} (Min: {item.min_quantity})</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {inventory.map((item) => {
            const isLowStock = item.quantity <= item.min_quantity;
            return (
              <Card
                key={item.id}
                className={`card-hover border-0 shadow-lg ${isLowStock ? 'border-l-4 border-l-orange-500' : ''}`}
                data-testid={`inventory-item-${item.id}`}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        <p className="text-xs text-gray-500">₹{item.price_per_unit}/{item.unit}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Current Stock:</span>
                      <span className={`font-bold ${isLowStock ? 'text-orange-600' : 'text-green-600'}`}>
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Min Required:</span>
                      <span className="text-sm">{item.min_quantity} {item.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Value:</span>
                      <span className="text-sm font-medium">₹{(item.quantity * item.price_per_unit).toFixed(2)}</span>
                    </div>
                    {['admin', 'cashier'].includes(user?.role) && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-2"
                        onClick={() => handleEdit(item)}
                        data-testid={`edit-inventory-${item.id}`}
                      >
                        Update Stock
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {inventory.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">No inventory items found</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default InventoryPage;
