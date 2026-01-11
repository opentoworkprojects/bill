import { useState, useEffect, useMemo, useCallback } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { 
  Plus, AlertTriangle, Package, Printer, Download, FileSpreadsheet, 
  Search, Filter, TrendingUp, TrendingDown, Calendar, BarChart3, 
  ShoppingCart, Truck, Clock, DollarSign, Archive, RefreshCw,
  Eye, Edit, Trash2, History, Bell, Target, Zap, Package2,
  ArrowUpDown, ArrowUp, ArrowDown, CheckCircle, XCircle,
  Settings, Users, MapPin, Phone, Mail, Globe, Minus, X,
  Sparkles, Activity, PieChart, Layers
} from 'lucide-react';
import BulkUpload from '../components/BulkUpload';

const InventoryPage = ({ user }) => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('grid');
  const [activeTab, setActiveTab] = useState('inventory');
  const [stockAdjustOpen, setStockAdjustOpen] = useState(false);
  const [stockAdjustItem, setStockAdjustItem] = useState(null);
  const [stockAdjustType, setStockAdjustType] = useState('add');
  const [stockAdjustQty, setStockAdjustQty] = useState('');
  const [stockAdjustReason, setStockAdjustReason] = useState('');
  const [businessSettings, setBusinessSettings] = useState(null);
  const [formData, setFormData] = useState({
    name: '', quantity: '', unit: '', min_quantity: '', max_quantity: '',
    price_per_unit: '', cost_price: '', category_id: '', supplier_id: '',
    sku: '', barcode: '', description: '', location: '', expiry_date: '',
    batch_number: '', reorder_point: '', reorder_quantity: ''
  });
  const [supplierFormData, setSupplierFormData] = useState({
    name: '', contact_person: '', phone: '', email: '', address: '',
    website: '', payment_terms: '', notes: ''
  });
  const [categoryFormData, setCategoryFormData] = useState({
    name: '', description: '', color: '#7c3aed'
  });
  const [movementFormData, setMovementFormData] = useState({
    item_id: '', type: 'in', quantity: '', reason: '', reference: '', notes: ''
  });

  useEffect(() => {
    console.log('InventoryPage mounted, user:', user);
    console.log('User role:', user?.role);
    console.log('Auth token exists:', !!localStorage.getItem('token'));
    
    const loadData = async () => {
      await fetchInventory();
      Promise.all([fetchCategories(), fetchSuppliers(), fetchBusinessSettings()]);
      setTimeout(() => { fetchLowStock(); fetchStockMovements(); fetchAnalytics(); }, 100);
    };
    loadData();
  }, []);

  const fetchBusinessSettings = async () => {
    try {
      const response = await axios.get(`${API}/business/settings`);
      setBusinessSettings(response.data.business_settings);
    } catch (error) { console.error('Failed to fetch business settings', error); }
  };

  const fetchInventory = async () => {
    try {
      console.log('Fetching inventory...');
      setLoading(true); setError(null);
      
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please login again.');
      }
      
      const response = await axios.get(`${API}/inventory`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Inventory fetch successful:', response.data.length, 'items');
      setInventory(response.data);
      return response.data;
    } catch (error) {
      console.error('Inventory fetch error:', error);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      let errorMessage = 'Failed to fetch inventory';
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication required. Please login again.';
        // Optionally redirect to login
        // window.location.href = '/login';
      } else if (error.response?.status === 403) {
        errorMessage = 'Not authorized to view inventory.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      return [];
    } finally { 
      setLoading(false); 
    }
  };

  const fetchLowStock = async () => {
    try {
      const response = await axios.get(`${API}/inventory/low-stock`);
      setLowStock(response.data);
    } catch (error) { console.error('Failed to fetch low stock', error); }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get(`${API}/inventory/suppliers`);
      setSuppliers(response.data || []);
    } catch (error) { console.error('Failed to fetch suppliers', error); setSuppliers([]); }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/inventory/categories`);
      setCategories(response.data || []);
    } catch (error) { console.error('Failed to fetch categories', error); setCategories([]); }
  };

  const fetchStockMovements = async () => {
    try {
      const response = await axios.get(`${API}/inventory/movements`);
      setStockMovements(response.data || []);
    } catch (error) { console.error('Failed to fetch stock movements', error); setStockMovements([]); }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API}/inventory/analytics`);
      setAnalytics(response.data || {});
    } catch (error) { console.error('Failed to fetch analytics', error); setAnalytics({}); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('Form submission started', formData);
    console.log('User role:', user?.role);
    
    // Validate required fields
    if (!formData.name?.trim()) {
      toast.error('Item name is required');
      return;
    }
    if (!formData.quantity || parseFloat(formData.quantity) < 0) {
      toast.error('Valid quantity is required');
      return;
    }
    if (!formData.unit?.trim()) {
      toast.error('Unit is required');
      return;
    }
    if (!formData.min_quantity || parseFloat(formData.min_quantity) < 0) {
      toast.error('Valid minimum quantity is required');
      return;
    }
    if (!formData.price_per_unit || parseFloat(formData.price_per_unit) <= 0) {
      toast.error('Valid selling price is required');
      return;
    }

    try {
      // Check authentication
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required. Please login again.');
        return;
      }

      // Prepare data with proper type conversion
      const submitData = {
        name: formData.name.trim(),
        quantity: parseFloat(formData.quantity) || 0,
        unit: formData.unit.trim(),
        min_quantity: parseFloat(formData.min_quantity) || 0,
        max_quantity: formData.max_quantity ? parseFloat(formData.max_quantity) : null,
        price_per_unit: parseFloat(formData.price_per_unit) || 0,
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
        reorder_point: formData.reorder_point ? parseFloat(formData.reorder_point) : null,
        reorder_quantity: formData.reorder_quantity ? parseFloat(formData.reorder_quantity) : null,
        category_id: formData.category_id || null,
        supplier_id: formData.supplier_id || null,
        sku: formData.sku?.trim() || null,
        barcode: formData.barcode?.trim() || null,
        description: formData.description?.trim() || null,
        location: formData.location?.trim() || null,
        expiry_date: formData.expiry_date || null,
        batch_number: formData.batch_number?.trim() || null,
      };

      console.log('Submitting data:', submitData);

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      if (editingItem) {
        const response = await axios.put(`${API}/inventory/${editingItem.id}`, submitData, config);
        console.log('Update response:', response.data);
        toast.success('Inventory item updated successfully!');
      } else {
        const response = await axios.post(`${API}/inventory`, submitData, config);
        console.log('Create response:', response.data);
        toast.success('Inventory item created successfully!');
      }
      
      setDialogOpen(false);
      const updatedInventory = await fetchInventory();
      const lowStockItems = updatedInventory.filter(item => item.quantity <= item.min_quantity);
      setLowStock(lowStockItems);
      resetForm();
      
    } catch (error) { 
      console.error('Inventory save error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Failed to save inventory item';
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication required. Please login again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Not authorized to perform this action. Check your user role.';
      } else if (error.response?.status === 422) {
        errorMessage = 'Invalid data provided. Please check all fields.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
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
    } catch (error) { toast.error(error.response?.data?.detail || 'Failed to save supplier'); }
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
    } catch (error) { toast.error(error.response?.data?.detail || 'Failed to save category'); }
  };

  const handleMovementSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/inventory/movements`, movementFormData);
      toast.success('Stock movement recorded!');
      setMovementDialogOpen(false);
      fetchInventory(); fetchStockMovements(); fetchAnalytics();
      resetMovementForm();
    } catch (error) { toast.error(error.response?.data?.detail || 'Failed to record movement'); }
  };

  const resetForm = () => {
    setFormData({ name: '', quantity: '', unit: '', min_quantity: '', max_quantity: '',
      price_per_unit: '', cost_price: '', category_id: '', supplier_id: '', sku: '',
      barcode: '', description: '', location: '', expiry_date: '', batch_number: '',
      reorder_point: '', reorder_quantity: '' });
    setEditingItem(null);
  };

  const resetSupplierForm = () => {
    setSupplierFormData({ name: '', contact_person: '', phone: '', email: '', address: '',
      website: '', payment_terms: '', notes: '' });
    setEditingSupplier(null);
  };

  const resetCategoryForm = () => {
    setCategoryFormData({ name: '', description: '', color: '#7c3aed' });
    setEditingCategory(null);
  };

  const resetMovementForm = () => {
    setMovementFormData({ item_id: '', type: 'in', quantity: '', reason: '', reference: '', notes: '' });
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({ name: item.name, quantity: item.quantity, unit: item.unit,
      min_quantity: item.min_quantity, max_quantity: item.max_quantity || '',
      price_per_unit: item.price_per_unit, cost_price: item.cost_price || '',
      category_id: item.category_id ? String(item.category_id) : '', 
      supplier_id: item.supplier_id ? String(item.supplier_id) : '',
      sku: item.sku || '', barcode: item.barcode || '', description: item.description || '',
      location: item.location || '', expiry_date: item.expiry_date || '',
      batch_number: item.batch_number || '', reorder_point: item.reorder_point || '',
      reorder_quantity: item.reorder_quantity || '' });
    setDialogOpen(true);
  };

  const handleEditSupplier = (supplier) => {
    setEditingSupplier(supplier);
    setSupplierFormData({ name: supplier.name, contact_person: supplier.contact_person || '',
      phone: supplier.phone || '', email: supplier.email || '', address: supplier.address || '',
      website: supplier.website || '', payment_terms: supplier.payment_terms || '',
      notes: supplier.notes || '' });
    setSupplierDialogOpen(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryFormData({ name: category.name, description: category.description || '',
      color: category.color || '#7c3aed' });
    setCategoryDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await axios.delete(`${API}/inventory/${id}`);
        toast.success('Item deleted successfully');
        const updatedInventory = inventory.filter(item => item.id !== id);
        setInventory(updatedInventory);
        setLowStock(updatedInventory.filter(item => item.quantity <= item.min_quantity));
      } catch (error) { toast.error('Failed to delete item'); }
    }
  };

  const handleDeleteSupplier = async (id) => {
    if (window.confirm('Delete this supplier?')) {
      try {
        await axios.delete(`${API}/inventory/suppliers/${id}`);
        toast.success('Supplier deleted!');
        fetchSuppliers();
      } catch (error) { toast.error('Failed to delete supplier'); }
    }
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm('Delete this category?')) {
      try {
        await axios.delete(`${API}/inventory/categories/${id}`);
        toast.success('Category deleted!');
        fetchCategories();
      } catch (error) { toast.error('Failed to delete category'); }
    }
  };

  const filteredAndSortedInventory = useMemo(() => {
    return inventory
      .filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (item.barcode && item.barcode.includes(searchTerm));
        const matchesLowStock = filterLowStock ? item.quantity <= item.min_quantity : true;
        // Compare as strings to handle type mismatches
        const matchesCategory = filterCategory && filterCategory !== 'all' 
          ? String(item.category_id) === String(filterCategory) 
          : true;
        return matchesSearch && matchesLowStock && matchesCategory;
      })
      .sort((a, b) => {
        let aValue = a[sortBy], bValue = b[sortBy];
        if (sortBy === 'total_value') { aValue = a.quantity * a.price_per_unit; bValue = b.quantity * b.price_per_unit; }
        if (typeof aValue === 'string') { aValue = aValue.toLowerCase(); bValue = bValue.toLowerCase(); }
        return sortOrder === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
      });
  }, [inventory, searchTerm, filterLowStock, filterCategory, sortBy, sortOrder]);

  const handlePrintInventory = () => {
    const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * item.price_per_unit), 0);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Inventory Report</title>
      <style>body{font-family:Arial;font-size:12px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px}th{background:#7c3aed;color:white}.low{background:#fef3c7}</style></head>
      <body><h1>📦 Inventory Report</h1><p>Generated: ${new Date().toLocaleString()}</p>
      <table><tr><th>#</th><th>Item</th><th>Stock</th><th>Min</th><th>Price</th><th>Value</th><th>Status</th></tr>
      ${inventory.map((item, i) => `<tr class="${item.quantity <= item.min_quantity ? 'low' : ''}">
        <td>${i+1}</td><td>${item.name}</td><td>${item.quantity} ${item.unit}</td><td>${item.min_quantity}</td>
        <td>₹${item.price_per_unit}</td><td>₹${(item.quantity * item.price_per_unit).toFixed(2)}</td>
        <td>${item.quantity <= item.min_quantity ? '⚠️ Low' : '✅ OK'}</td></tr>`).join('')}
      <tr style="font-weight:bold"><td colspan="5">Total Value:</td><td colspan="2">₹${totalValue.toFixed(2)}</td></tr></table>
      <button onclick="window.print()">Print</button></body></html>`);
    printWindow.document.close();
    toast.success('Report ready!');
  };

  const handleExportCSV = () => {
    const csvContent = [['Item Name', 'Quantity', 'Unit', 'Min Quantity', 'Price', 'Total Value', 'Status'],
      ...inventory.map(item => [item.name, item.quantity, item.unit, item.min_quantity, item.price_per_unit,
        (item.quantity * item.price_per_unit).toFixed(2), item.quantity <= item.min_quantity ? 'Low Stock' : 'OK'])
    ].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`; a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Exported to CSV!');
  };

  const openStockAdjust = (item, type) => {
    setStockAdjustItem(item); setStockAdjustType(type);
    setStockAdjustQty(''); setStockAdjustReason(''); setStockAdjustOpen(true);
  };

  const handleStockAdjust = async () => {
    if (!stockAdjustQty || parseFloat(stockAdjustQty) <= 0) { toast.error('Enter valid quantity'); return; }
    const qty = parseFloat(stockAdjustQty);
    const newQty = stockAdjustType === 'add' ? stockAdjustItem.quantity + qty : stockAdjustItem.quantity - qty;
    if (newQty < 0) { toast.error('Cannot reduce below 0'); return; }
    try {
      await axios.put(`${API}/inventory/${stockAdjustItem.id}`, { ...stockAdjustItem, quantity: newQty });
      await axios.post(`${API}/inventory/movements`, { item_id: stockAdjustItem.id,
        type: stockAdjustType === 'add' ? 'in' : 'out', quantity: qty,
        reason: stockAdjustReason || (stockAdjustType === 'add' ? 'Stock Added' : 'Stock Reduced'),
        reference: `Manual ${stockAdjustType === 'add' ? 'Addition' : 'Reduction'}`,
        notes: `${stockAdjustType === 'add' ? 'Added' : 'Reduced'} ${qty}. Previous: ${stockAdjustItem.quantity}, New: ${newQty}` });
      toast.success(`Stock ${stockAdjustType === 'add' ? 'added' : 'reduced'}!`);
      setStockAdjustOpen(false);
      const updatedInventory = await fetchInventory();
      setLowStock(updatedInventory.filter(item => item.quantity <= item.min_quantity));
      fetchStockMovements();
    } catch (error) { toast.error(error.response?.data?.detail || 'Failed to adjust stock'); }
  };

  // Calculate analytics
  const inventoryStats = useMemo(() => {
    const totalItems = inventory.length;
    const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * item.price_per_unit), 0);
    const lowStockCount = inventory.filter(item => item.quantity <= item.min_quantity).length;
    const healthyStock = totalItems - lowStockCount;
    const categoryBreakdown = categories.map(cat => ({
      ...cat, count: inventory.filter(i => String(i.category_id) === String(cat.id)).length,
      value: inventory.filter(i => String(i.category_id) === String(cat.id)).reduce((s, i) => s + (i.quantity * i.price_per_unit), 0)
    }));
    return { totalItems, totalValue, lowStockCount, healthyStock, categoryBreakdown };
  }, [inventory, categories]);

  return (
    <Layout user={user}>
      <div className="space-y-6" data-testid="inventory-page">
        <TrialBanner user={user} />
        
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <Package className="w-8 h-8" />
                  Inventory Management
                </h1>
                <p className="text-white/80 mt-2">Track stock, suppliers, and categories</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="secondary" size="sm" onClick={handlePrintInventory}>
                  <Printer className="w-4 h-4 mr-2" />Print
                </Button>
                <Button variant="secondary" size="sm" onClick={handleExportCSV}>
                  <Download className="w-4 h-4 mr-2" />Export
                </Button>
                <Button variant="secondary" size="sm" onClick={() => { fetchInventory(); fetchSuppliers(); fetchCategories(); }}>
                  <RefreshCw className="w-4 h-4 mr-2" />Refresh
                </Button>
              </div>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <Package className="w-6 h-6 mb-2" />
                <div className="text-2xl font-bold">{inventoryStats.totalItems}</div>
                <div className="text-sm text-white/70">Total Items</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <DollarSign className="w-6 h-6 mb-2" />
                <div className="text-2xl font-bold">₹{inventoryStats.totalValue.toFixed(0)}</div>
                <div className="text-sm text-white/70">Total Value</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <AlertTriangle className="w-6 h-6 mb-2" />
                <div className="text-2xl font-bold">{inventoryStats.lowStockCount}</div>
                <div className="text-sm text-white/70">Low Stock</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <Truck className="w-6 h-6 mb-2" />
                <div className="text-2xl font-bold">{suppliers.length}</div>
                <div className="text-sm text-white/70">Suppliers</div>
              </div>
            </div>
          </div>
        </div>

        {/* Low Stock Alert */}
        {lowStock.length > 0 && (
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-500 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900">Low Stock Alert!</h3>
                <p className="text-sm text-orange-800">{lowStock.length} items running low</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {lowStock.slice(0, 3).map(item => (
                    <span key={item.id} className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                      {item.name}: {item.quantity} {item.unit}
                    </span>
                  ))}
                  {lowStock.length > 3 && <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">+{lowStock.length - 3} more</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm">
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Package className="w-4 h-4" />Inventory
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="flex items-center gap-2">
              <Truck className="w-4 h-4" />Suppliers
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <Layers className="w-4 h-4" />Categories
            </TabsTrigger>
            <TabsTrigger value="movements" className="flex items-center gap-2">
              <History className="w-4 h-4" />Movements
            </TabsTrigger>
          </TabsList>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-6">
            {/* Search and Filter Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border">
              <div className="flex gap-4 flex-wrap items-center">
                <div className="flex-1 min-w-[200px] relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input placeholder="Search by name, SKU, or barcode..." value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="quantity">Quantity</SelectItem>
                    <SelectItem value="price_per_unit">Price</SelectItem>
                    <SelectItem value="total_value">Total Value</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
                  {sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                </Button>
                <Button variant={filterLowStock ? "default" : "outline"} size="sm" onClick={() => setFilterLowStock(!filterLowStock)}
                  className={filterLowStock ? "bg-orange-500 hover:bg-orange-600" : ""}>
                  <Filter className="w-4 h-4 mr-2" />{filterLowStock ? 'Low Stock' : 'All Items'}
                </Button>
                {['admin', 'cashier'].includes(user?.role) && (
                  <Button className="bg-gradient-to-r from-violet-600 to-purple-600" onClick={() => { 
                    console.log('Add Item button clicked');
                    resetForm(); 
                    setDialogOpen(true); 
                  }}>
                    <Plus className="w-4 h-4 mr-2" />Add Item
                  </Button>
                )}
              </div>
            </div>

            {/* Bulk Upload */}
            {['admin', 'manager'].includes(user?.role) && (
              <BulkUpload type="inventory" onSuccess={() => { fetchInventory(); fetchLowStock(); }} />
            )}

            {/* Inventory Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="border-0 shadow-lg animate-pulse">
                    <CardContent className="p-6"><div className="h-32 bg-gray-200 rounded"></div></CardContent>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertTriangle className="w-16 h-16 mx-auto text-red-500 mb-4" />
                <h3 className="text-lg font-medium mb-2">Failed to load inventory</h3>
                <Button onClick={fetchInventory}><RefreshCw className="w-4 h-4 mr-2" />Try Again</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAndSortedInventory.map((item) => {
                  const isLowStock = item.quantity <= item.min_quantity;
                  const category = categories.find(c => String(c.id) === String(item.category_id));
                  const supplier = suppliers.find(s => String(s.id) === String(item.supplier_id));
                  const totalValue = item.quantity * item.price_per_unit;
                  return (
                    <Card key={item.id} className={`border-0 shadow-lg hover:shadow-xl transition-all ${isLowStock ? 'border-l-4 border-l-orange-500' : ''}`}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isLowStock ? 'bg-gradient-to-br from-orange-500 to-red-500' : 'bg-gradient-to-br from-violet-500 to-purple-600'}`}>
                              <Package className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{item.name}</CardTitle>
                              <div className="flex gap-1 mt-1">
                                {item.sku && <Badge variant="outline" className="text-xs">{item.sku}</Badge>}
                                {category && <Badge variant="outline" className="text-xs" style={{ borderColor: category.color, color: category.color }}>{category.name}</Badge>}
                              </div>
                            </div>
                          </div>
                          {isLowStock && <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-gray-50 p-2 rounded">
                            <div className="text-gray-600 text-xs">Current Stock</div>
                            <div className={`font-bold ${isLowStock ? 'text-orange-600' : 'text-green-600'}`}>{item.quantity} {item.unit}</div>
                          </div>
                          <div className="bg-gray-50 p-2 rounded">
                            <div className="text-gray-600 text-xs">Min Required</div>
                            <div className="font-medium">{item.min_quantity} {item.unit}</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div><span className="text-gray-600">Unit Price:</span><span className="font-medium ml-1">₹{item.price_per_unit}</span></div>
                          <div><span className="text-gray-600">Total:</span><span className="font-bold text-green-600 ml-1">₹{totalValue.toFixed(2)}</span></div>
                        </div>
                        {(item.location || supplier) && (
                          <div className="text-xs text-gray-500 space-y-1">
                            {item.location && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{item.location}</div>}
                            {supplier && <div className="flex items-center gap-1"><Truck className="w-3 h-3" />{supplier.name}</div>}
                          </div>
                        )}
                        {['admin', 'cashier'].includes(user?.role) && (
                          <div className="flex gap-2 pt-2 border-t">
                            <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEdit(item)}><Edit className="w-3 h-3 mr-1" />Edit</Button>
                            <Button size="sm" variant="outline" className="border-green-500 text-green-600" onClick={() => openStockAdjust(item, 'add')}><Plus className="w-3 h-3" /></Button>
                            <Button size="sm" variant="outline" className="border-orange-500 text-orange-600" onClick={() => openStockAdjust(item, 'reduce')}><Minus className="w-3 h-3" /></Button>
                            {['admin'].includes(user?.role) && (
                              <Button size="sm" variant="outline" className="border-red-500 text-red-600" onClick={() => handleDelete(item.id)}><Trash2 className="w-3 h-3" /></Button>
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
                    <h3 className="text-lg font-medium mb-2">No items found</h3>
                    <p className="text-gray-500 mb-4">{searchTerm || filterCategory !== 'all' || filterLowStock ? 'Try adjusting filters' : 'Add your first item'}</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Suppliers Tab */}
          <TabsContent value="suppliers" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Truck className="w-6 h-6 text-violet-600" />Suppliers ({suppliers.length})
              </h2>
              {['admin', 'cashier'].includes(user?.role) && (
                <Button className="bg-gradient-to-r from-violet-600 to-purple-600" onClick={() => { resetSupplierForm(); setSupplierDialogOpen(true); }}>
                  <Plus className="w-4 h-4 mr-2" />Add Supplier
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suppliers.map((supplier) => (
                <Card key={supplier.id} className="border-0 shadow-lg hover:shadow-xl transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <Truck className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{supplier.name}</CardTitle>
                        {supplier.contact_person && <p className="text-sm text-gray-500">{supplier.contact_person}</p>}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {supplier.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{supplier.phone}</span>
                      </div>
                    )}
                    {supplier.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="truncate">{supplier.email}</span>
                      </div>
                    )}
                    {supplier.address && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="truncate">{supplier.address}</span>
                      </div>
                    )}
                    {supplier.payment_terms && (
                      <Badge variant="outline" className="text-xs">{supplier.payment_terms}</Badge>
                    )}
                    {['admin', 'cashier'].includes(user?.role) && (
                      <div className="flex gap-2 pt-2 border-t">
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEditSupplier(supplier)}>
                          <Edit className="w-3 h-3 mr-1" />Edit
                        </Button>
                        {['admin'].includes(user?.role) && (
                          <Button size="sm" variant="outline" className="border-red-500 text-red-600" onClick={() => handleDeleteSupplier(supplier.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {suppliers.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Truck className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No suppliers yet</h3>
                  <p className="text-gray-500 mb-4">Add your first supplier to track inventory sources</p>
                  {['admin', 'cashier'].includes(user?.role) && (
                    <Button onClick={() => { resetSupplierForm(); setSupplierDialogOpen(true); }} className="bg-gradient-to-r from-violet-600 to-purple-600">
                      <Plus className="w-4 h-4 mr-2" />Add First Supplier
                    </Button>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Layers className="w-6 h-6 text-violet-600" />Categories ({categories.length})
              </h2>
              {['admin', 'cashier'].includes(user?.role) && (
                <Button className="bg-gradient-to-r from-violet-600 to-purple-600" onClick={() => { resetCategoryForm(); setCategoryDialogOpen(true); }}>
                  <Plus className="w-4 h-4 mr-2" />Add Category
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => {
                const itemCount = inventory.filter(i => String(i.category_id) === String(category.id)).length;
                const categoryValue = inventory.filter(i => String(i.category_id) === String(category.id))
                  .reduce((sum, i) => sum + (i.quantity * i.price_per_unit), 0);
                return (
                  <Card key={category.id} className="border-0 shadow-lg hover:shadow-xl transition-all">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: category.color + '20' }}>
                          <Layers className="w-6 h-6" style={{ color: category.color }} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{category.name}</CardTitle>
                          {category.description && <p className="text-sm text-gray-500">{category.description}</p>}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                          <div className="text-2xl font-bold" style={{ color: category.color }}>{itemCount}</div>
                          <div className="text-xs text-gray-500">Items</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                          <div className="text-lg font-bold text-green-600">₹{categoryValue.toFixed(0)}</div>
                          <div className="text-xs text-gray-500">Value</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }}></div>
                        <span className="text-sm text-gray-500">Color: {category.color}</span>
                      </div>
                      {['admin', 'cashier'].includes(user?.role) && (
                        <div className="flex gap-2 pt-2 border-t">
                          <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEditCategory(category)}>
                            <Edit className="w-3 h-3 mr-1" />Edit
                          </Button>
                          {['admin'].includes(user?.role) && (
                            <Button size="sm" variant="outline" className="border-red-500 text-red-600" onClick={() => handleDeleteCategory(category.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
              {categories.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Layers className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No categories yet</h3>
                  <p className="text-gray-500 mb-4">Create categories to organize your inventory</p>
                  {['admin', 'cashier'].includes(user?.role) && (
                    <Button onClick={() => { resetCategoryForm(); setCategoryDialogOpen(true); }} className="bg-gradient-to-r from-violet-600 to-purple-600">
                      <Plus className="w-4 h-4 mr-2" />Add First Category
                    </Button>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Movements Tab */}
          <TabsContent value="movements" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <History className="w-6 h-6 text-violet-600" />Stock Movements
              </h2>
              {['admin', 'cashier'].includes(user?.role) && (
                <Button className="bg-gradient-to-r from-violet-600 to-purple-600" onClick={() => { resetMovementForm(); setMovementDialogOpen(true); }}>
                  <Plus className="w-4 h-4 mr-2" />Record Movement
                </Button>
              )}
            </div>
            
            <Card className="border-0 shadow-lg">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {stockMovements.slice(0, 20).map((movement, i) => {
                        const item = inventory.find(inv => String(inv.id) === String(movement.item_id));
                        return (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">{new Date(movement.created_at).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-sm font-medium">{item?.name || 'Unknown'}</td>
                            <td className="px-4 py-3">
                              <Badge className={movement.type === 'in' ? 'bg-green-100 text-green-700' : movement.type === 'out' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}>
                                {movement.type === 'in' ? '↑ In' : movement.type === 'out' ? '↓ Out' : '⟳ Adjust'}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm font-medium">{movement.quantity}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{movement.reason || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {stockMovements.length === 0 && (
                    <div className="text-center py-12">
                      <History className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No movements recorded</h3>
                      <p className="text-gray-500">Stock movements will appear here</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add/Edit Item Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(open) => { 
          console.log('Dialog open state changed:', open);
          setDialogOpen(open); 
          if (!open) resetForm(); 
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />{editingItem ? 'Edit Item' : 'Add New Item'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label>Item Name *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="e.g., Tomatoes" /></div>
                  <div><Label>SKU</Label><Input value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} placeholder="e.g., TOM-001" /></div>
                  <div><Label>Category</Label>
                    <Select value={formData.category_id || ''} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {categories.map(cat => (<SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Supplier</Label>
                    <Select value={formData.supplier_id || ''} onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}>
                      <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {suppliers.map(sup => (<SelectItem key={sup.id} value={String(sup.id)}>{sup.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Stock Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><Label>Current Quantity *</Label><Input type="number" step="0.01" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} required /></div>
                  <div><Label>Unit *</Label><Input value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} placeholder="kg, liters, pieces" required /></div>
                  <div><Label>Storage Location</Label><Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="e.g., Freezer A" /></div>
                  <div><Label>Minimum Quantity *</Label><Input type="number" step="0.01" value={formData.min_quantity} onChange={(e) => setFormData({ ...formData, min_quantity: e.target.value })} required /></div>
                  <div><Label>Maximum Quantity</Label><Input type="number" step="0.01" value={formData.max_quantity} onChange={(e) => setFormData({ ...formData, max_quantity: e.target.value })} /></div>
                  <div><Label>Reorder Point</Label><Input type="number" step="0.01" value={formData.reorder_point} onChange={(e) => setFormData({ ...formData, reorder_point: e.target.value })} /></div>
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Pricing</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><Label>Cost Price (₹)</Label><Input type="number" step="0.01" value={formData.cost_price} onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })} /></div>
                  <div><Label>Selling Price (₹) *</Label><Input type="number" step="0.01" value={formData.price_per_unit} onChange={(e) => setFormData({ ...formData, price_per_unit: e.target.value })} required /></div>
                  <div><Label>Reorder Quantity</Label><Input type="number" step="0.01" value={formData.reorder_quantity} onChange={(e) => setFormData({ ...formData, reorder_quantity: e.target.value })} /></div>
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Additional Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label>Barcode</Label><Input value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} /></div>
                  <div><Label>Batch Number</Label><Input value={formData.batch_number} onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })} /></div>
                  <div><Label>Expiry Date</Label><Input type="date" value={formData.expiry_date} onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })} /></div>
                  <div className="md:col-span-2"><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} /></div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="submit" className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600"><CheckCircle className="w-4 h-4 mr-2" />{editingItem ? 'Update' : 'Create'}</Button>
                <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}><XCircle className="w-4 h-4 mr-2" />Cancel</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Supplier Dialog */}
        <Dialog open={supplierDialogOpen} onOpenChange={(open) => { setSupplierDialogOpen(open); if (!open) resetSupplierForm(); }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSupplierSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Supplier Name *</Label><Input value={supplierFormData.name} onChange={(e) => setSupplierFormData({ ...supplierFormData, name: e.target.value })} required placeholder="e.g., Fresh Farms Ltd" /></div>
                <div><Label>Contact Person</Label><Input value={supplierFormData.contact_person} onChange={(e) => setSupplierFormData({ ...supplierFormData, contact_person: e.target.value })} placeholder="e.g., John Doe" /></div>
                <div><Label>Phone</Label><Input value={supplierFormData.phone} onChange={(e) => setSupplierFormData({ ...supplierFormData, phone: e.target.value })} placeholder="+91 9876543210" /></div>
                <div><Label>Email</Label><Input type="email" value={supplierFormData.email} onChange={(e) => setSupplierFormData({ ...supplierFormData, email: e.target.value })} placeholder="supplier@example.com" /></div>
                <div className="md:col-span-2"><Label>Address</Label><Input value={supplierFormData.address} onChange={(e) => setSupplierFormData({ ...supplierFormData, address: e.target.value })} placeholder="Full address" /></div>
                <div><Label>Website</Label><Input value={supplierFormData.website} onChange={(e) => setSupplierFormData({ ...supplierFormData, website: e.target.value })} placeholder="https://example.com" /></div>
                <div><Label>Payment Terms</Label>
                  <Select value={supplierFormData.payment_terms} onValueChange={(value) => setSupplierFormData({ ...supplierFormData, payment_terms: value })}>
                    <SelectTrigger><SelectValue placeholder="Select terms" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="net15">Net 15</SelectItem>
                      <SelectItem value="net30">Net 30</SelectItem>
                      <SelectItem value="net60">Net 60</SelectItem>
                      <SelectItem value="cod">Cash on Delivery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2"><Label>Notes</Label><Textarea value={supplierFormData.notes} onChange={(e) => setSupplierFormData({ ...supplierFormData, notes: e.target.value })} rows={2} placeholder="Additional notes..." /></div>
              </div>
              <div className="flex gap-3">
                <Button type="submit" className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600"><CheckCircle className="w-4 h-4 mr-2" />{editingSupplier ? 'Update' : 'Create'} Supplier</Button>
                <Button type="button" variant="outline" onClick={() => { setSupplierDialogOpen(false); resetSupplierForm(); }}>Cancel</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Category Dialog */}
        <Dialog open={categoryDialogOpen} onOpenChange={(open) => { setCategoryDialogOpen(open); if (!open) resetCategoryForm(); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5" />{editingCategory ? 'Edit Category' : 'Add New Category'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div><Label>Category Name *</Label><Input value={categoryFormData.name} onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })} required placeholder="e.g., Vegetables, Dairy" /></div>
              <div><Label>Description</Label><Textarea value={categoryFormData.description} onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })} rows={2} placeholder="Category description..." /></div>
              <div>
                <Label>Color</Label>
                <div className="flex gap-2 items-center mt-2">
                  <Input type="color" value={categoryFormData.color} onChange={(e) => setCategoryFormData({ ...categoryFormData, color: e.target.value })} className="w-16 h-10 p-1 cursor-pointer" />
                  <Input value={categoryFormData.color} onChange={(e) => setCategoryFormData({ ...categoryFormData, color: e.target.value })} className="flex-1" />
                  <div className="w-10 h-10 rounded-lg" style={{ backgroundColor: categoryFormData.color }}></div>
                </div>
                <div className="flex gap-2 mt-2">
                  {['#7c3aed', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#06b6d4'].map(color => (
                    <button key={color} type="button" onClick={() => setCategoryFormData({ ...categoryFormData, color })}
                      className={`w-8 h-8 rounded-full border-2 ${categoryFormData.color === color ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="submit" className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600"><CheckCircle className="w-4 h-4 mr-2" />{editingCategory ? 'Update' : 'Create'} Category</Button>
                <Button type="button" variant="outline" onClick={() => { setCategoryDialogOpen(false); resetCategoryForm(); }}>Cancel</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Movement Dialog */}
        <Dialog open={movementDialogOpen} onOpenChange={(open) => { setMovementDialogOpen(open); if (!open) resetMovementForm(); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />Record Stock Movement
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleMovementSubmit} className="space-y-4">
              <div><Label>Item *</Label>
                <Select value={movementFormData.item_id || ''} onValueChange={(value) => setMovementFormData({ ...movementFormData, item_id: value })}>
                  <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                  <SelectContent>
                    {inventory.map(item => (<SelectItem key={item.id} value={String(item.id)}>{item.name} ({item.quantity} {item.unit})</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Movement Type *</Label>
                <Select value={movementFormData.type} onValueChange={(value) => setMovementFormData({ ...movementFormData, type: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">Stock In (Purchase/Return)</SelectItem>
                    <SelectItem value="out">Stock Out (Usage/Sale)</SelectItem>
                    <SelectItem value="adjustment">Adjustment (Correction)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Quantity *</Label><Input type="number" step="0.01" value={movementFormData.quantity} onChange={(e) => setMovementFormData({ ...movementFormData, quantity: e.target.value })} required /></div>
              <div><Label>Reason</Label><Input value={movementFormData.reason} onChange={(e) => setMovementFormData({ ...movementFormData, reason: e.target.value })} placeholder="e.g., Purchase, Used in cooking" /></div>
              <div><Label>Reference</Label><Input value={movementFormData.reference} onChange={(e) => setMovementFormData({ ...movementFormData, reference: e.target.value })} placeholder="e.g., Invoice #123" /></div>
              <div><Label>Notes</Label><Textarea value={movementFormData.notes} onChange={(e) => setMovementFormData({ ...movementFormData, notes: e.target.value })} rows={2} /></div>
              <div className="flex gap-3">
                <Button type="submit" className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600"><CheckCircle className="w-4 h-4 mr-2" />Record Movement</Button>
                <Button type="button" variant="outline" onClick={() => { setMovementDialogOpen(false); resetMovementForm(); }}>Cancel</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Stock Adjustment Modal */}
        {stockAdjustOpen && stockAdjustItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md border-0 shadow-2xl">
              <CardHeader className={`${stockAdjustType === 'add' ? 'bg-gradient-to-r from-green-600 to-emerald-600' : 'bg-gradient-to-r from-orange-500 to-red-500'} text-white rounded-t-lg`}>
                <CardTitle className="flex items-center gap-2">
                  {stockAdjustType === 'add' ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                  {stockAdjustType === 'add' ? 'Add Stock' : 'Reduce Stock'} - {stockAdjustItem.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between"><span className="text-gray-600">Current Stock:</span><span className="font-bold text-lg">{stockAdjustItem.quantity} {stockAdjustItem.unit}</span></div>
                  <div className="flex justify-between mt-2"><span className="text-gray-600">Min Required:</span><span className="font-medium">{stockAdjustItem.min_quantity} {stockAdjustItem.unit}</span></div>
                </div>
                <div><Label>Quantity to {stockAdjustType === 'add' ? 'Add' : 'Reduce'} *</Label>
                  <Input type="number" step="0.01" min="0.01" placeholder={`Enter quantity in ${stockAdjustItem.unit}`} value={stockAdjustQty} onChange={(e) => setStockAdjustQty(e.target.value)} className="mt-1" />
                </div>
                <div><Label>Reason (optional)</Label>
                  <Input placeholder={stockAdjustType === 'add' ? 'e.g., New purchase' : 'e.g., Used in cooking'} value={stockAdjustReason} onChange={(e) => setStockAdjustReason(e.target.value)} className="mt-1" />
                </div>
                {stockAdjustQty && parseFloat(stockAdjustQty) > 0 && (
                  <div className={`p-3 rounded-lg ${stockAdjustType === 'add' ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'}`}>
                    <div className="flex justify-between"><span className="text-gray-600">New Stock Level:</span>
                      <span className={`font-bold text-lg ${stockAdjustType === 'add' ? 'text-green-600' : 'text-orange-600'}`}>
                        {stockAdjustType === 'add' ? (stockAdjustItem.quantity + parseFloat(stockAdjustQty || 0)).toFixed(2) : (stockAdjustItem.quantity - parseFloat(stockAdjustQty || 0)).toFixed(2)} {stockAdjustItem.unit}
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex gap-3">
                  <Button onClick={handleStockAdjust} disabled={!stockAdjustQty || parseFloat(stockAdjustQty) <= 0}
                    className={`flex-1 ${stockAdjustType === 'add' ? 'bg-gradient-to-r from-green-600 to-emerald-600' : 'bg-gradient-to-r from-orange-500 to-red-500'}`}>
                    {stockAdjustType === 'add' ? <Plus className="w-4 h-4 mr-2" /> : <Minus className="w-4 h-4 mr-2" />}
                    {stockAdjustType === 'add' ? 'Add Stock' : 'Reduce Stock'}
                  </Button>
                  <Button variant="outline" onClick={() => setStockAdjustOpen(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default InventoryPage;
