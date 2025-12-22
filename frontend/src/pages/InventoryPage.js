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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { 
  Plus, AlertTriangle, Package, Printer, QrCode, Download, FileSpreadsheet, 
  Search, Filter, TrendingUp, TrendingDown, Calendar, BarChart3, 
  ShoppingCart, Truck, Clock, DollarSign, Archive, RefreshCw,
  Eye, Edit, Trash2, History, Bell, Target, Zap, Package2,
  ArrowUpDown, ArrowUp, ArrowDown, CheckCircle, XCircle,
  Settings, Users, MapPin, Phone, Mail, Globe
} from 'lucide-react';
import BulkUpload from '../components/BulkUpload';

const InventoryPage = ({ user }) => {
  const [inventory, setInventory] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);
  const [analyticsDialogOpen, setAnalyticsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('grid'); // grid or table
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrData, setQrData] = useState({ upiId: '', amount: '', note: '' });
  const [businessSettings, setBusinessSettings] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    unit: '',
    min_quantity: '',
    max_quantity: '',
    price_per_unit: '',
    cost_price: '',
    category_id: '',
    supplier_id: '',
    sku: '',
    barcode: '',
    description: '',
    location: '',
    expiry_date: '',
    batch_number: '',
    reorder_point: '',
    reorder_quantity: ''
  });
  const [supplierFormData, setSupplierFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    website: '',
    payment_terms: '',
    notes: ''
  });
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    color: '#7c3aed'
  });
  const [movementFormData, setMovementFormData] = useState({
    item_id: '',
    type: 'in', // in, out, adjustment
    quantity: '',
    reason: '',
    reference: '',
    notes: ''
  });

  useEffect(() => {
    fetchInventory();
    fetchLowStock();
    fetchBusinessSettings();
    fetchSuppliers();
    fetchCategories();
    fetchStockMovements();
    fetchAnalytics();
  }, []);

  const fetchBusinessSettings = async () => {
    try {
      const response = await axios.get(`${API}/business/settings`);
      setBusinessSettings(response.data.business_settings);
    } catch (error) {
      console.error('Failed to fetch business settings', error);
    }
  };

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

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get(`${API}/inventory/suppliers`);
      setSuppliers(response.data || []);
    } catch (error) {
      console.error('Failed to fetch suppliers', error);
      setSuppliers([]);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/inventory/categories`);
      setCategories(response.data || []);
    } catch (error) {
      console.error('Failed to fetch categories', error);
      setCategories([]);
    }
  };

  const fetchStockMovements = async () => {
    try {
      const response = await axios.get(`${API}/inventory/movements`);
      setStockMovements(response.data || []);
    } catch (error) {
      console.error('Failed to fetch stock movements', error);
      setStockMovements([]);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API}/inventory/analytics`);
      setAnalytics(response.data || {});
    } catch (error) {
      console.error('Failed to fetch analytics', error);
      setAnalytics({});
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
      fetchAnalytics();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save inventory item');
    }
  };

  const handleSupplierSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await axios.put(`${API}/inventory/suppliers/${editingSupplier.id}`, supplierFormData);
        toast.success('Supplier updated!');
      } else {
        await axios.post(`${API}/inventory/suppliers`, supplierFormData);
        toast.success('Supplier created!');
      }
      setSupplierDialogOpen(false);
      fetchSuppliers();
      resetSupplierForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save supplier');
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await axios.put(`${API}/inventory/categories/${editingCategory.id}`, categoryFormData);
        toast.success('Category updated!');
      } else {
        await axios.post(`${API}/inventory/categories`, categoryFormData);
        toast.success('Category created!');
      }
      setCategoryDialogOpen(false);
      fetchCategories();
      resetCategoryForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save category');
    }
  };

  const handleMovementSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/inventory/movements`, movementFormData);
      toast.success('Stock movement recorded!');
      setMovementDialogOpen(false);
      fetchInventory();
      fetchStockMovements();
      fetchAnalytics();
      resetMovementForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to record movement');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      quantity: '',
      unit: '',
      min_quantity: '',
      max_quantity: '',
      price_per_unit: '',
      cost_price: '',
      category_id: '',
      supplier_id: '',
      sku: '',
      barcode: '',
      description: '',
      location: '',
      expiry_date: '',
      batch_number: '',
      reorder_point: '',
      reorder_quantity: ''
    });
    setEditingItem(null);
  };

  const resetSupplierForm = () => {
    setSupplierFormData({
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      website: '',
      payment_terms: '',
      notes: ''
    });
    setEditingSupplier(null);
  };

  const resetCategoryForm = () => {
    setCategoryFormData({
      name: '',
      description: '',
      color: '#7c3aed'
    });
    setEditingCategory(null);
  };

  const resetMovementForm = () => {
    setMovementFormData({
      item_id: '',
      type: 'in',
      quantity: '',
      reason: '',
      reference: '',
      notes: ''
    });
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      min_quantity: item.min_quantity,
      max_quantity: item.max_quantity || '',
      price_per_unit: item.price_per_unit,
      cost_price: item.cost_price || '',
      category_id: item.category_id || '',
      supplier_id: item.supplier_id || '',
      sku: item.sku || '',
      barcode: item.barcode || '',
      description: item.description || '',
      location: item.location || '',
      expiry_date: item.expiry_date || '',
      batch_number: item.batch_number || '',
      reorder_point: item.reorder_point || '',
      reorder_quantity: item.reorder_quantity || ''
    });
    setDialogOpen(true);
  };

  const handleEditSupplier = (supplier) => {
    setEditingSupplier(supplier);
    setSupplierFormData({
      name: supplier.name,
      contact_person: supplier.contact_person || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      website: supplier.website || '',
      payment_terms: supplier.payment_terms || '',
      notes: supplier.notes || ''
    });
    setSupplierDialogOpen(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      description: category.description || '',
      color: category.color || '#7c3aed'
    });
    setCategoryDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await axios.delete(`${API}/inventory/${id}`);
        toast.success('Item deleted successfully');
        fetchInventory();
        fetchLowStock();
        fetchAnalytics();
      } catch (error) {
        toast.error('Failed to delete item');
      }
    }
  };

  // Enhanced filtering and sorting
  const filteredAndSortedInventory = inventory
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (item.barcode && item.barcode.includes(searchTerm));
      const matchesLowStock = filterLowStock ? item.quantity <= item.min_quantity : true;
      const matchesCategory = filterCategory ? item.category_id === filterCategory : true;
      return matchesSearch && matchesLowStock && matchesCategory;
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'total_value') {
        aValue = a.quantity * a.price_per_unit;
        bValue = b.quantity * b.price_per_unit;
      }
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Print inventory report
  const handlePrintInventory = () => {
    const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * item.price_per_unit), 0);
    const lowStockItems = inventory.filter(item => item.quantity <= item.min_quantity);

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Inventory Report - ${businessSettings?.restaurant_name || 'Restaurant'}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: Arial, sans-serif; font-size: 12px; color: #333; }
          .header { text-align: center; padding: 20px; border-bottom: 2px solid #7c3aed; margin-bottom: 20px; }
          .header h1 { margin: 0; color: #7c3aed; font-size: 24px; }
          .header p { margin: 5px 0; color: #666; }
          .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 25px; }
          .summary-card { background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; }
          .summary-card h4 { margin: 0 0 5px 0; font-size: 11px; color: #666; text-transform: uppercase; }
          .summary-card p { margin: 0; font-size: 20px; font-weight: bold; color: #7c3aed; }
          .low-stock { background: #fef3c7 !important; }
          .low-stock p { color: #d97706 !important; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background: #7c3aed; color: white; font-weight: 600; }
          tr:nth-child(even) { background: #f9fafb; }
          .low { background: #fef3c7 !important; }
          .footer { text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; color: #666; font-size: 10px; }
          .no-print { margin-top: 20px; text-align: center; }
          .btn { padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; margin: 5px; }
          .btn-primary { background: #7c3aed; color: white; }
          .btn-secondary { background: #6b7280; color: white; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📦 ${businessSettings?.restaurant_name || 'Restaurant'}</h1>
          <p>Inventory Report</p>
          <p>Generated: ${new Date().toLocaleString()}</p>
        </div>

        <div class="summary">
          <div class="summary-card">
            <h4>Total Items</h4>
            <p>${inventory.length}</p>
          </div>
          <div class="summary-card">
            <h4>Total Value</h4>
            <p>₹${totalValue.toFixed(0)}</p>
          </div>
          <div class="summary-card low-stock">
            <h4>Low Stock</h4>
            <p>${lowStockItems.length}</p>
          </div>
          <div class="summary-card">
            <h4>Healthy Stock</h4>
            <p>${inventory.length - lowStockItems.length}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Item Name</th>
              <th>Current Stock</th>
              <th>Min Required</th>
              <th>Unit Price</th>
              <th>Total Value</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${inventory.map((item, idx) => {
              const isLow = item.quantity <= item.min_quantity;
              return `
                <tr class="${isLow ? 'low' : ''}">
                  <td>${idx + 1}</td>
                  <td><strong>${item.name}</strong></td>
                  <td>${item.quantity} ${item.unit}</td>
                  <td>${item.min_quantity} ${item.unit}</td>
                  <td>₹${item.price_per_unit}</td>
                  <td>₹${(item.quantity * item.price_per_unit).toFixed(2)}</td>
                  <td style="color: ${isLow ? '#d97706' : '#16a34a'}; font-weight: bold;">
                    ${isLow ? '⚠️ Low' : '✅ OK'}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
          <tfoot>
            <tr style="background: #f3f4f6; font-weight: bold;">
              <td colspan="5" style="text-align: right;">Total Inventory Value:</td>
              <td colspan="2">₹${totalValue.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        <div class="footer">
          <p>Generated by BillByteKOT - Restaurant Management System</p>
          <p>${businessSettings?.address || ''}</p>
        </div>

        <div class="no-print">
          <button class="btn btn-primary" onclick="window.print()">🖨️ Print Report</button>
          <button class="btn btn-secondary" onclick="window.close()">✕ Close</button>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    toast.success('Inventory report ready for printing!');
  };

  // Export inventory to CSV
  const handleExportCSV = () => {
    const csvContent = [
      ['Item Name', 'Quantity', 'Unit', 'Min Quantity', 'Price per Unit', 'Total Value', 'Status'],
      ...inventory.map(item => [
        item.name,
        item.quantity,
        item.unit,
        item.min_quantity,
        item.price_per_unit,
        (item.quantity * item.price_per_unit).toFixed(2),
        item.quantity <= item.min_quantity ? 'Low Stock' : 'OK'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Inventory exported to CSV!');
  };

  // Generate UPI QR Code
  const generateUPIQR = (amount, note) => {
    const upiId = qrData.upiId || businessSettings?.upi_id || '';
    if (!upiId) {
      toast.error('Please enter UPI ID');
      return null;
    }
    
    const merchantName = businessSettings?.restaurant_name || 'Restaurant';
    // UPI deep link format
    const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note || 'Payment')}`;
    
    // Use QR code API to generate image
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiLink)}`;
  };

  // Open QR Modal for payment
  const openQRModal = (amount = '', note = '') => {
    setQrData({
      upiId: businessSettings?.upi_id || '',
      amount: amount,
      note: note || 'Inventory Purchase'
    });
    setQrModalOpen(true);
  };

  // Print QR Code
  const handlePrintQR = () => {
    const qrUrl = generateUPIQR(qrData.amount, qrData.note);
    if (!qrUrl) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>UPI Payment QR - ${businessSettings?.restaurant_name || 'Restaurant'}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            justify-content: center; 
            min-height: 100vh; 
            margin: 0;
            padding: 20px;
            background: #f3f4f6;
          }
          .qr-card {
            background: white;
            padding: 30px;
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 350px;
          }
          .logo { font-size: 40px; margin-bottom: 10px; }
          h1 { margin: 0 0 5px 0; color: #7c3aed; font-size: 22px; }
          .subtitle { color: #666; margin-bottom: 20px; font-size: 14px; }
          .qr-container {
            background: white;
            padding: 15px;
            border-radius: 15px;
            border: 3px solid #7c3aed;
            display: inline-block;
            margin: 15px 0;
          }
          .qr-container img { display: block; }
          .amount {
            font-size: 32px;
            font-weight: bold;
            color: #16a34a;
            margin: 15px 0;
          }
          .note { color: #666; font-size: 14px; margin-bottom: 15px; }
          .upi-id {
            background: #f3f4f6;
            padding: 10px 20px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 14px;
            color: #374151;
          }
          .footer { margin-top: 20px; font-size: 11px; color: #9ca3af; }
          .apps { margin-top: 15px; font-size: 12px; color: #666; }
          .no-print { margin-top: 20px; }
          .btn { padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; margin: 5px; }
          .btn-primary { background: #7c3aed; color: white; }
          .btn-secondary { background: #6b7280; color: white; }
          @media print { 
            .no-print { display: none; } 
            body { background: white; }
            .qr-card { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="qr-card">
          <div class="logo">📱</div>
          <h1>${businessSettings?.restaurant_name || 'Restaurant'}</h1>
          <p class="subtitle">Scan to Pay with UPI</p>
          
          <div class="qr-container">
            <img src="${qrUrl}" alt="UPI QR Code" width="220" height="220" />
          </div>
          
          ${qrData.amount ? `<div class="amount">₹${qrData.amount}</div>` : ''}
          ${qrData.note ? `<p class="note">${qrData.note}</p>` : ''}
          
          <div class="upi-id">${qrData.upiId}</div>
          
          <p class="apps">Pay using GPay, PhonePe, Paytm, or any UPI app</p>
          <p class="footer">Powered by BillByteKOT</p>
        </div>

        <div class="no-print">
          <button class="btn btn-primary" onclick="window.print()">🖨️ Print QR</button>
          <button class="btn btn-secondary" onclick="window.close()">✕ Close</button>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
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

        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Inventory Management
            </h1>
            <p className="text-gray-600 mt-2">Track stock levels, suppliers, and analytics</p>
            
            {/* Quick Stats */}
            <div className="flex gap-4 mt-4 flex-wrap">
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                <Package className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">{inventory.length} Items</span>
              </div>
              <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">
                  ₹{inventory.reduce((sum, item) => sum + (item.quantity * item.price_per_unit), 0).toFixed(0)} Value
                </span>
              </div>
              {lowStock.length > 0 && (
                <div className="flex items-center gap-2 bg-orange-50 px-3 py-2 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium">{lowStock.length} Low Stock</span>
                </div>
              )}
              <div className="flex items-center gap-2 bg-purple-50 px-3 py-2 rounded-lg">
                <Users className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium">{suppliers.length} Suppliers</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {/* Analytics Button */}
            <Button 
              variant="outline" 
              onClick={() => setAnalyticsDialogOpen(true)}
              className="border-blue-500 text-blue-600 hover:bg-blue-50"
              title="View Analytics Dashboard"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </Button>

            {/* Stock Movement Button */}
            <Button 
              variant="outline" 
              onClick={() => setMovementDialogOpen(true)}
              className="border-purple-500 text-purple-600 hover:bg-purple-50"
              title="Record Stock Movement"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Movement
            </Button>

            {/* Suppliers Button */}
            <Button 
              variant="outline" 
              onClick={() => setSupplierDialogOpen(true)}
              className="border-indigo-500 text-indigo-600 hover:bg-indigo-50"
              title="Manage Suppliers"
            >
              <Truck className="w-4 h-4 mr-2" />
              Suppliers
            </Button>

            {/* Categories Button */}
            <Button 
              variant="outline" 
              onClick={() => setCategoryDialogOpen(true)}
              className="border-teal-500 text-teal-600 hover:bg-teal-50"
              title="Manage Categories"
            >
              <Archive className="w-4 h-4 mr-2" />
              Categories
            </Button>

            {/* Print & Export Buttons */}
            <Button variant="outline" onClick={handlePrintInventory} title="Print Inventory Report">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" onClick={handleExportCSV} title="Export to CSV">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button 
              variant="outline" 
              onClick={() => openQRModal()} 
              className="border-green-500 text-green-600 hover:bg-green-50"
              title="Generate UPI QR Code"
            >
              <QrCode className="w-4 h-4 mr-2" />
              UPI QR
            </Button>
            
            {['admin', 'cashier'].includes(user?.role) && (
              <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-violet-600 to-purple-600" data-testid="add-inventory-button">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="inventory-dialog">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      {editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Package2 className="w-4 h-4" />
                        Basic Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Item Name *</Label>
                          <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            data-testid="inventory-name-input"
                            placeholder="e.g., Tomatoes, Chicken Breast"
                          />
                        </div>
                        <div>
                          <Label>SKU (Stock Keeping Unit)</Label>
                          <Input
                            value={formData.sku}
                            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                            placeholder="e.g., TOM-001, CHK-BR-001"
                          />
                        </div>
                        <div>
                          <Label>Category</Label>
                          <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map(category => (
                                <SelectItem key={category.id} value={category.id.toString()}>
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }}></div>
                                    {category.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Supplier</Label>
                          <Select value={formData.supplier_id} onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select supplier" />
                            </SelectTrigger>
                            <SelectContent>
                              {suppliers.map(supplier => (
                                <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                  {supplier.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Stock Information */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Stock Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Current Quantity *</Label>
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
                          <Label>Unit *</Label>
                          <Input
                            value={formData.unit}
                            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                            placeholder="kg, liters, pieces, boxes"
                            required
                          />
                        </div>
                        <div>
                          <Label>Storage Location</Label>
                          <Input
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            placeholder="e.g., Freezer A, Shelf 2"
                          />
                        </div>
                        <div>
                          <Label>Minimum Quantity *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.min_quantity}
                            onChange={(e) => setFormData({ ...formData, min_quantity: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label>Maximum Quantity</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.max_quantity}
                            onChange={(e) => setFormData({ ...formData, max_quantity: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Reorder Point</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.reorder_point}
                            onChange={(e) => setFormData({ ...formData, reorder_point: e.target.value })}
                            placeholder="Auto-reorder when stock hits this level"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Pricing Information */}
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Pricing Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Cost Price (₹) *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.cost_price}
                            onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                            placeholder="Purchase price per unit"
                          />
                        </div>
                        <div>
                          <Label>Selling Price (₹) *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.price_per_unit}
                            onChange={(e) => setFormData({ ...formData, price_per_unit: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label>Reorder Quantity</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.reorder_quantity}
                            onChange={(e) => setFormData({ ...formData, reorder_quantity: e.target.value })}
                            placeholder="Quantity to order when restocking"
                          />
                        </div>
                      </div>
                      {formData.cost_price && formData.price_per_unit && (
                        <div className="mt-3 p-3 bg-white rounded border">
                          <div className="flex justify-between text-sm">
                            <span>Profit Margin:</span>
                            <span className="font-semibold text-green-600">
                              ₹{(parseFloat(formData.price_per_unit) - parseFloat(formData.cost_price)).toFixed(2)} 
                              ({(((parseFloat(formData.price_per_unit) - parseFloat(formData.cost_price)) / parseFloat(formData.cost_price)) * 100).toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Additional Details */}
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Additional Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Barcode</Label>
                          <Input
                            value={formData.barcode}
                            onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                            placeholder="Scan or enter barcode"
                          />
                        </div>
                        <div>
                          <Label>Batch Number</Label>
                          <Input
                            value={formData.batch_number}
                            onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                            placeholder="e.g., BATCH-2024-001"
                          />
                        </div>
                        <div>
                          <Label>Expiry Date</Label>
                          <Input
                            type="date"
                            value={formData.expiry_date}
                            onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label>Description</Label>
                          <Textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Additional notes about this item..."
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                      <Button type="submit" className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600" data-testid="save-inventory-button">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {editingItem ? 'Update Item' : 'Create Item'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Enhanced Search and Filter Bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex gap-4 flex-wrap items-center">
            {/* Search */}
            <div className="flex-1 min-w-[200px] relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by name, SKU, or barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }}></div>
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort Options */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="quantity">Quantity</SelectItem>
                <SelectItem value="price_per_unit">Price</SelectItem>
                <SelectItem value="total_value">Total Value</SelectItem>
                <SelectItem value="updated_at">Last Updated</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Order */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              {sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            </Button>

            {/* View Mode Toggle */}
            <div className="flex border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-none"
              >
                <Package className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="rounded-none"
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
            </div>

            {/* Low Stock Filter */}
            <Button
              variant={filterLowStock ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterLowStock(!filterLowStock)}
              className={filterLowStock ? "bg-orange-500 hover:bg-orange-600" : ""}
            >
              <Filter className="w-4 h-4 mr-2" />
              {filterLowStock ? 'Low Stock' : 'All Items'}
              {lowStock.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {lowStock.length}
                </Badge>
              )}
            </Button>
          </div>

          {/* Active Filters Display */}
          {(searchTerm || filterCategory || filterLowStock) && (
            <div className="flex gap-2 mt-3 flex-wrap">
              <span className="text-sm text-gray-500">Active filters:</span>
              {searchTerm && (
                <Badge variant="outline" className="gap-1">
                  Search: {searchTerm}
                  <button onClick={() => setSearchTerm('')} className="ml-1 hover:bg-gray-200 rounded-full p-0.5">
                    <XCircle className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {filterCategory && (
                <Badge variant="outline" className="gap-1">
                  Category: {categories.find(c => c.id.toString() === filterCategory)?.name}
                  <button onClick={() => setFilterCategory('')} className="ml-1 hover:bg-gray-200 rounded-full p-0.5">
                    <XCircle className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {filterLowStock && (
                <Badge variant="outline" className="gap-1">
                  Low Stock Only
                  <button onClick={() => setFilterLowStock(false)} className="ml-1 hover:bg-gray-200 rounded-full p-0.5">
                    <XCircle className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setFilterCategory('');
                  setFilterLowStock(false);
                }}
                className="text-xs h-6"
              >
                Clear All
              </Button>
            </div>
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
          {filteredAndSortedInventory.map((item) => {
            const isLowStock = item.quantity <= item.min_quantity;
            const category = categories.find(c => c.id === item.category_id);
            const supplier = suppliers.find(s => s.id === item.supplier_id);
            const totalValue = item.quantity * item.price_per_unit;
            const profitMargin = item.cost_price ? ((item.price_per_unit - item.cost_price) / item.cost_price * 100) : 0;
            
            return (
              <Card
                key={item.id}
                className={`card-hover border-0 shadow-lg transition-all hover:shadow-xl ${
                  isLowStock ? 'border-l-4 border-l-orange-500' : ''
                }`}
                data-testid={`inventory-item-${item.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <Package className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg leading-tight">{item.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          {item.sku && (
                            <Badge variant="outline" className="text-xs">
                              {item.sku}
                            </Badge>
                          )}
                          {category && (
                            <Badge 
                              variant="outline" 
                              className="text-xs"
                              style={{ borderColor: category.color, color: category.color }}
                            >
                              {category.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {isLowStock && (
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" title="Low Stock"></div>
                      )}
                      {item.expiry_date && new Date(item.expiry_date) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" title="Expiring Soon"></div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Stock Information */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-gray-600 text-xs">Current Stock</div>
                      <div className={`font-bold ${isLowStock ? 'text-orange-600' : 'text-green-600'}`}>
                        {item.quantity} {item.unit}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-gray-600 text-xs">Min Required</div>
                      <div className="font-medium">{item.min_quantity} {item.unit}</div>
                    </div>
                  </div>

                  {/* Pricing Information */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Unit Price:</span>
                      <span className="font-medium ml-1">₹{item.price_per_unit}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Value:</span>
                      <span className="font-bold text-green-600 ml-1">₹{totalValue.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Additional Information */}
                  {(item.location || supplier || item.batch_number) && (
                    <div className="text-xs text-gray-500 space-y-1">
                      {item.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {item.location}
                        </div>
                      )}
                      {supplier && (
                        <div className="flex items-center gap-1">
                          <Truck className="w-3 h-3" />
                          {supplier.name}
                        </div>
                      )}
                      {item.batch_number && (
                        <div className="flex items-center gap-1">
                          <Package2 className="w-3 h-3" />
                          Batch: {item.batch_number}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Expiry Warning */}
                  {item.expiry_date && (
                    <div className={`text-xs p-2 rounded ${
                      new Date(item.expiry_date) < new Date() 
                        ? 'bg-red-100 text-red-700' 
                        : new Date(item.expiry_date) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Expires: {new Date(item.expiry_date).toLocaleDateString()}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {['admin', 'cashier'].includes(user?.role) && (
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleEdit(item)}
                        data-testid={`edit-inventory-${item.id}`}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-green-500 text-green-600 hover:bg-green-50"
                        onClick={() => openQRModal(
                          item.reorder_quantity ? (item.reorder_quantity * (item.cost_price || item.price_per_unit)) : 
                          ((item.min_quantity - item.quantity) * (item.cost_price || item.price_per_unit)), 
                          `Restock: ${item.name}`
                        )}
                        title="Generate QR for restock payment"
                      >
                        <QrCode className="w-3 h-3" />
                      </Button>
                      {['admin'].includes(user?.role) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500 text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(item.id)}
                          title="Delete item"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {filteredAndSortedInventory.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || filterCategory || filterLowStock 
                  ? 'Try adjusting your search or filters' 
                  : 'Start by adding your first inventory item'
                }
              </p>
              {!searchTerm && !filterCategory && !filterLowStock && ['admin', 'cashier'].includes(user?.role) && (
                <Button 
                  onClick={() => setDialogOpen(true)}
                  className="bg-gradient-to-r from-violet-600 to-purple-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Item
                </Button>
              )}
            </div>
          )}
        </div>

        {/* UPI QR Code Modal */}
        {qrModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md border-0 shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  Generate UPI Payment QR
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <Label>UPI ID *</Label>
                  <Input
                    placeholder="yourname@upi or 9876543210@paytm"
                    value={qrData.upiId}
                    onChange={(e) => setQrData({ ...qrData, upiId: e.target.value })}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter your UPI ID (GPay, PhonePe, Paytm, etc.)</p>
                </div>

                <div>
                  <Label>Amount (₹)</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount (optional)"
                    value={qrData.amount}
                    onChange={(e) => setQrData({ ...qrData, amount: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Payment Note</Label>
                  <Input
                    placeholder="e.g., Inventory Purchase"
                    value={qrData.note}
                    onChange={(e) => setQrData({ ...qrData, note: e.target.value })}
                    className="mt-1"
                  />
                </div>

                {/* QR Preview */}
                {qrData.upiId && (
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-3">QR Code Preview</p>
                    <img 
                      src={generateUPIQR(qrData.amount, qrData.note)} 
                      alt="UPI QR Code" 
                      className="mx-auto rounded-lg border-4 border-green-500"
                      style={{ width: 180, height: 180 }}
                    />
                    {qrData.amount && (
                      <p className="text-2xl font-bold text-green-600 mt-3">₹{qrData.amount}</p>
                    )}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handlePrintQR}
                    disabled={!qrData.upiId}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Print QR
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setQrModalOpen(false)}
                  >
                    Close
                  </Button>
                </div>

                <p className="text-xs text-center text-gray-500">
                  Scan with any UPI app: GPay, PhonePe, Paytm, BHIM, etc.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default InventoryPage;