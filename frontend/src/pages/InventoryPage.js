import { useState, useEffect, useMemo, useCallback } from 'react';
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
  Sparkles, Activity, PieChart, Layers, Grid, List, Star,
  ExternalLink, Copy, QrCode, Warehouse, ShoppingBag
} from 'lucide-react';
import BulkUpload from '../components/BulkUpload';
import { apiWithRetry, apiSilent } from '../utils/apiClient';

const InventoryPage = ({ user }) => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);
  const [analyticsDialogOpen, setAnalyticsDialogOpen] = useState(false);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [purchaseDetailOpen, setPurchaseDetailOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
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
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [expiryFilter, setExpiryFilter] = useState('all'); // 'all', 'expiring', 'expired'
  const [stockLevelFilter, setStockLevelFilter] = useState('all'); // 'all', 'low', 'out', 'healthy'
  const [formData, setFormData] = useState({
    name: '', quantity: '', unit: '', min_quantity: '', max_quantity: '',
    price_per_unit: '', cost_price: '', category_id: '', supplier_id: '',
    sku: '', barcode: '', description: '', location: '', expiry_date: '',
    batch_number: '', reorder_point: '', reorder_quantity: '', is_perishable: false,
    storage_temperature: '', shelf_life_days: '', alert_before_expiry: 7
  });
  const [supplierFormData, setSupplierFormData] = useState({
    name: '', contact_person: '', phone: '', email: '', address: '',
    website: '', payment_terms: '', notes: '', tax_id: '', credit_limit: ''
  });
  const [categoryFormData, setCategoryFormData] = useState({
    name: '', description: '', color: '#7c3aed', is_perishable: false, default_shelf_life: ''
  });
  const [movementFormData, setMovementFormData] = useState({
    item_id: '', type: 'in', quantity: '', reason: '', reference: '', notes: ''
  });
  const [purchaseFormData, setPurchaseFormData] = useState({
    supplier_id: '',
    purchase_date: new Date().toISOString().split('T')[0],
    expected_delivery: '',
    notes: '',
    items: [{ inventory_item_id: '', item_name: '', quantity: '', unit_cost: '', expiry_date: '', discount_percent: 0, discount_amount: 0, tax_percent: 0, tax_amount: 0 }],
    // Additional charges and discounts
    additional_charges: [{ description: '', amount: 0, tax_percent: 0 }],
    overall_discount_percent: 0,
    overall_discount_amount: 0,
    shipping_charges: 0,
    handling_charges: 0,
    other_charges: 0,
    // Tax settings
    tax_inclusive: false,
    round_off: 0,
    payment_terms: '',
    reference_number: ''
  });

  // Debounced search for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (!user) {
      setError('Please login to access inventory');
      setLoading(false);
      return;
    }
    
    const loadData = async () => {
      try {
        await fetchInventory();
        Promise.all([fetchCategories(), fetchSuppliers(), fetchBusinessSettings()]);
        setTimeout(() => { fetchLowStock(); fetchStockMovements(); fetchAnalytics(); fetchPurchases(); }, 100);
      } catch (err) {
        setError('Failed to load inventory data');
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const fetchBusinessSettings = async () => {
    try {
      const response = await apiWithRetry({
        method: 'get',
        url: `${API}/business/settings`,
        timeout: 10000
      });
      setBusinessSettings(response.data.business_settings);
    } catch (error) {
      // Business settings are optional
    }
  };

  const fetchInventory = async (showRefreshIndicator = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiWithRetry({
        method: 'get',
        url: `${API}/inventory`,
        timeout: 15000
      });
      
      setInventory(response.data);
      
      if (showRefreshIndicator) {
        toast.success('Inventory refreshed successfully!');
      }
      
      return response.data;
    } catch (error) {
      let errorMessage = 'Failed to fetch inventory';
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication required. Please login again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Not authorized to view inventory.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
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
      const response = await apiSilent({
        method: 'get',
        url: `${API}/inventory/low-stock`,
        timeout: 10000
      });
      setLowStock(response.data);
    } catch (error) {
      // Low stock is optional data
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await apiSilent({
        method: 'get',
        url: `${API}/inventory/suppliers`,
        timeout: 10000
      });
      setSuppliers(response.data || []);
    } catch (error) {
      setSuppliers([]); 
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiSilent({
        method: 'get',
        url: `${API}/inventory/categories`,
        timeout: 10000
      });
      setCategories(response.data || []);
    } catch (error) {
      setCategories([]); 
    }
  };

  const fetchStockMovements = async () => {
    try {
      const response = await apiSilent({
        method: 'get',
        url: `${API}/inventory/movements`,
        timeout: 10000
      });
      setStockMovements(response.data || []);
    } catch (error) {
      setStockMovements([]); 
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await apiSilent({
        method: 'get',
        url: `${API}/inventory/analytics`,
        timeout: 10000
      });
      setAnalytics(response.data || {});
    } catch (error) {
      setAnalytics({}); 
    }
  };

  const fetchPurchases = async () => {
    try {
      const response = await apiSilent({
        method: 'get',
        url: `${API}/inventory/purchases`,
        timeout: 10000
      });
      setPurchases(response.data || []);
    } catch (error) {
      setPurchases([]); 
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Enhanced validation
    const validationErrors = [];
    
    if (!formData.name?.trim()) {
      validationErrors.push('Item name is required');
    } else if (formData.name.trim().length < 2) {
      validationErrors.push('Item name must be at least 2 characters');
    }
    
    const quantity = parseFloat(formData.quantity);
    if (formData.quantity === '' || isNaN(quantity) || quantity < 0) {
      validationErrors.push('Valid quantity is required');
    }
    
    if (!formData.unit?.trim()) {
      validationErrors.push('Unit is required (e.g., kg, liters, pieces)');
    }
    
    const minQuantity = parseFloat(formData.min_quantity);
    if (formData.min_quantity === '' || isNaN(minQuantity) || minQuantity < 0) {
      validationErrors.push('Valid minimum quantity is required');
    }
    
    const pricePerUnit = parseFloat(formData.price_per_unit);
    if (formData.price_per_unit === '' || isNaN(pricePerUnit) || pricePerUnit <= 0) {
      validationErrors.push('Valid selling price is required');
    }
    
    // Validate optional numeric fields
    if (formData.max_quantity && isNaN(parseFloat(formData.max_quantity))) {
      validationErrors.push('Maximum quantity must be a valid number');
    }
    if (formData.cost_price && isNaN(parseFloat(formData.cost_price))) {
      validationErrors.push('Cost price must be a valid number');
    }
    
    if (validationErrors.length > 0) {
      validationErrors.forEach(error => toast.error(error));
      return;
    }

    try {
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
        is_perishable: formData.is_perishable || false,
        storage_temperature: formData.storage_temperature?.trim() || null,
        shelf_life_days: formData.shelf_life_days ? parseInt(formData.shelf_life_days) : null,
        alert_before_expiry: formData.alert_before_expiry ? parseInt(formData.alert_before_expiry) : 7
      };

      if (editingItem) {
        await apiWithRetry({
          method: 'put',
          url: `${API}/inventory/${editingItem.id}`,
          data: submitData,
          timeout: 15000
        });
        toast.success('Inventory item updated successfully!');
      } else {
        await apiWithRetry({
          method: 'post',
          url: `${API}/inventory`,
          data: submitData,
          timeout: 15000
        });
        toast.success('Inventory item created successfully!');
      }
      
      setDialogOpen(false);
      const updatedInventory = await fetchInventory();
      const lowStockItems = updatedInventory.filter(item => item.quantity <= item.min_quantity);
      setLowStock(lowStockItems);
      resetForm();
      
    } catch (error) {
      let errorMessage = 'Failed to save inventory item';
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication required. Please login again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Not authorized to perform this action.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      toast.error(errorMessage);
    }
  };

  const handleSupplierSubmit = async (e) => {
    e.preventDefault();
    
    // Enhanced validation
    if (!supplierFormData.name?.trim()) {
      toast.error('Supplier name is required');
      return;
    }
    
    try {
      const submitData = {
        name: supplierFormData.name.trim(),
        contact_person: supplierFormData.contact_person?.trim() || null,
        phone: supplierFormData.phone?.trim() || null,
        email: supplierFormData.email?.trim() || null,
        address: supplierFormData.address?.trim() || null,
        website: supplierFormData.website?.trim() || null,
        payment_terms: supplierFormData.payment_terms || null,
        notes: supplierFormData.notes?.trim() || null,
        tax_id: supplierFormData.tax_id?.trim() || null,
        credit_limit: supplierFormData.credit_limit ? parseFloat(supplierFormData.credit_limit) : null
      };
      
      if (editingSupplier) {
        await apiWithRetry({
          method: 'put',
          url: `${API}/inventory/suppliers/${editingSupplier.id}`,
          data: submitData,
          timeout: 15000
        });
        toast.success('Supplier updated successfully!');
      } else {
        await apiWithRetry({
          method: 'post',
          url: `${API}/inventory/suppliers`,
          data: submitData,
          timeout: 15000
        });
        toast.success('Supplier created successfully!');
      }
      
      setSupplierDialogOpen(false);
      fetchSuppliers();
      resetSupplierForm();
    } catch (error) { 
      let errorMessage = 'Failed to save supplier';
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication required. Please login again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Not authorized to perform this action.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      toast.error(errorMessage);
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    
    // Enhanced validation
    if (!categoryFormData.name?.trim()) {
      toast.error('Category name is required');
      return;
    }
    
    try {
      const submitData = {
        name: categoryFormData.name.trim(),
        description: categoryFormData.description?.trim() || null,
        color: categoryFormData.color || '#7c3aed',
        is_perishable: categoryFormData.is_perishable || false,
        default_shelf_life: categoryFormData.default_shelf_life ? parseInt(categoryFormData.default_shelf_life) : null
      };
      
      if (editingCategory) {
        await apiWithRetry({
          method: 'put',
          url: `${API}/inventory/categories/${editingCategory.id}`,
          data: submitData,
          timeout: 15000
        });
        toast.success('Category updated successfully!');
      } else {
        await apiWithRetry({
          method: 'post',
          url: `${API}/inventory/categories`,
          data: submitData,
          timeout: 15000
        });
        toast.success('Category created successfully!');
      }
      
      setCategoryDialogOpen(false);
      fetchCategories();
      resetCategoryForm();
    } catch (error) { 
      let errorMessage = 'Failed to save category';
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication required. Please login again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Not authorized to perform this action.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      toast.error(errorMessage);
    }
  };

  const handleMovementSubmit = async (e) => {
    e.preventDefault();
    
    // Enhanced validation
    if (!movementFormData.item_id) {
      toast.error('Please select an item');
      return;
    }
    
    if (!movementFormData.quantity || parseFloat(movementFormData.quantity) <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }
    
    try {
      const submitData = {
        item_id: movementFormData.item_id,
        type: movementFormData.type,
        quantity: parseFloat(movementFormData.quantity),
        reason: movementFormData.reason?.trim() || null,
        reference: movementFormData.reference?.trim() || null,
        notes: movementFormData.notes?.trim() || null
      };
      
      await apiWithRetry({
        method: 'post',
        url: `${API}/inventory/movements`,
        data: submitData,
        timeout: 15000
      });
      
      toast.success('Stock movement recorded successfully!');
      setMovementDialogOpen(false);
      fetchInventory(); 
      fetchStockMovements(); 
      fetchAnalytics();
      resetMovementForm();
    } catch (error) { 
      let errorMessage = 'Failed to record movement';
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication required. Please login again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Not authorized to perform this action.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      toast.error(errorMessage);
    }
  };

  const handlePurchaseSubmit = async (e) => {
    e.preventDefault();
    
    // Enhanced validation
    if (!purchaseFormData.supplier_id) {
      toast.error('Please select a supplier');
      return;
    }
    
    if (!purchaseFormData.purchase_date) {
      toast.error('Please select a purchase date');
      return;
    }
    
    // Validate items
    const validItems = purchaseFormData.items.filter(item => 
      item.inventory_item_id && item.quantity && item.unit_cost
    );
    
    if (validItems.length === 0) {
      toast.error('Please add at least one item with quantity and unit cost');
      return;
    }
    
    try {
      // Calculate totals
      const calculations = calculatePurchaseTotal();
      
      // Prepare submission data
      const submitData = {
        supplier_id: purchaseFormData.supplier_id,
        purchase_date: purchaseFormData.purchase_date,
        expected_delivery: purchaseFormData.expected_delivery || null,
        reference_number: purchaseFormData.reference_number?.trim() || null,
        payment_terms: purchaseFormData.payment_terms || null,
        tax_inclusive: purchaseFormData.tax_inclusive || false,
        notes: purchaseFormData.notes?.trim() || null,
        
        // Financial details
        items_subtotal: calculations.itemsSubtotal,
        total_item_discounts: calculations.totalItemDiscounts,
        overall_discount_percent: parseFloat(purchaseFormData.overall_discount_percent) || 0,
        overall_discount_amount: calculations.overallDiscount,
        total_taxes: calculations.totalItemTaxes,
        shipping_charges: parseFloat(purchaseFormData.shipping_charges) || 0,
        handling_charges: parseFloat(purchaseFormData.handling_charges) || 0,
        other_charges: parseFloat(purchaseFormData.other_charges) || 0,
        additional_charges_total: calculations.totalAdditionalCharges,
        round_off: parseFloat(purchaseFormData.round_off) || 0,
        final_total: calculations.finalTotal,
        
        // Items with detailed calculations
        items: validItems.map(item => ({
          inventory_item_id: item.inventory_item_id,
          item_name: item.item_name,
          quantity: parseFloat(item.quantity),
          unit_cost: parseFloat(item.unit_cost),
          subtotal: parseFloat(item.quantity) * parseFloat(item.unit_cost),
          discount_percent: parseFloat(item.discount_percent) || 0,
          discount_amount: parseFloat(item.discount_amount) || 0,
          tax_percent: parseFloat(item.tax_percent) || 0,
          tax_amount: parseFloat(item.tax_amount) || 0,
          taxable_amount: (parseFloat(item.quantity) * parseFloat(item.unit_cost)) - (parseFloat(item.discount_amount) || 0),
          line_total: (parseFloat(item.quantity) * parseFloat(item.unit_cost)) - (parseFloat(item.discount_amount) || 0) + (parseFloat(item.tax_amount) || 0),
          expiry_date: item.expiry_date || null
        })),
        
        // Additional charges
        additional_charges: purchaseFormData.additional_charges.filter(charge => charge.description && charge.amount).map(charge => ({
          description: charge.description.trim(),
          amount: parseFloat(charge.amount),
          tax_percent: parseFloat(charge.tax_percent) || 0,
          tax_amount: (parseFloat(charge.amount) * (parseFloat(charge.tax_percent) || 0)) / 100,
          total_amount: parseFloat(charge.amount) + ((parseFloat(charge.amount) * (parseFloat(charge.tax_percent) || 0)) / 100)
        }))
      };
      
      const response = await apiWithRetry({
        method: 'post',
        url: `${API}/inventory/purchases`,
        data: submitData,
        timeout: 20000
      });
      
      toast.success('Purchase order created successfully! Stock quantities updated.');
      setPurchaseDialogOpen(false);
      resetPurchaseForm();
      
      // Refresh data
      await fetchInventory();
      await fetchPurchases();
      fetchLowStock();
      fetchStockMovements();
      
    } catch (error) {
      let errorMessage = 'Failed to create purchase order';
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication required. Please login again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Not authorized to create purchase orders.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      toast.error(errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({ 
      name: '', quantity: '', unit: '', min_quantity: '', max_quantity: '',
      price_per_unit: '', cost_price: '', category_id: '', supplier_id: '', sku: '',
      barcode: '', description: '', location: '', expiry_date: '', batch_number: '',
      reorder_point: '', reorder_quantity: '', is_perishable: false,
      storage_temperature: '', shelf_life_days: '', alert_before_expiry: 7
    });
    setEditingItem(null);
  };

  const resetSupplierForm = () => {
    setSupplierFormData({ 
      name: '', contact_person: '', phone: '', email: '', address: '',
      website: '', payment_terms: '', notes: '', tax_id: '', credit_limit: ''
    });
    setEditingSupplier(null);
  };

  const resetCategoryForm = () => {
    setCategoryFormData({ 
      name: '', description: '', color: '#7c3aed', is_perishable: false, default_shelf_life: ''
    });
    setEditingCategory(null);
  };

  const resetMovementForm = () => {
    setMovementFormData({ item_id: '', type: 'in', quantity: '', reason: '', reference: '', notes: '' });
  };

  const resetPurchaseForm = () => {
    setPurchaseFormData({
      supplier_id: '',
      purchase_date: new Date().toISOString().split('T')[0],
      expected_delivery: '',
      notes: '',
      items: [{ inventory_item_id: '', item_name: '', quantity: '', unit_cost: '', expiry_date: '', discount_percent: 0, discount_amount: 0, tax_percent: 0, tax_amount: 0 }],
      additional_charges: [{ description: '', amount: 0, tax_percent: 0 }],
      overall_discount_percent: 0,
      overall_discount_amount: 0,
      shipping_charges: 0,
      handling_charges: 0,
      other_charges: 0,
      tax_inclusive: false,
      round_off: 0,
      payment_terms: '',
      reference_number: ''
    });
  };

  const addPurchaseItem = () => {
    setPurchaseFormData({
      ...purchaseFormData,
      items: [...purchaseFormData.items, { inventory_item_id: '', item_name: '', quantity: '', unit_cost: '', expiry_date: '', discount_percent: 0, discount_amount: 0, tax_percent: 0, tax_amount: 0 }]
    });
  };

  const addAdditionalCharge = () => {
    setPurchaseFormData({
      ...purchaseFormData,
      additional_charges: [...purchaseFormData.additional_charges, { description: '', amount: 0, tax_percent: 0 }]
    });
  };

  const removeAdditionalCharge = (index) => {
    if (purchaseFormData.additional_charges.length > 1) {
      const newCharges = purchaseFormData.additional_charges.filter((_, i) => i !== index);
      setPurchaseFormData({ ...purchaseFormData, additional_charges: newCharges });
    }
  };

  const updateAdditionalCharge = (index, field, value) => {
    const newCharges = [...purchaseFormData.additional_charges];
    newCharges[index] = { ...newCharges[index], [field]: value };
    setPurchaseFormData({ ...purchaseFormData, additional_charges: newCharges });
  };

  const removePurchaseItem = (index) => {
    if (purchaseFormData.items.length > 1) {
      const newItems = purchaseFormData.items.filter((_, i) => i !== index);
      setPurchaseFormData({ ...purchaseFormData, items: newItems });
    }
  };

  const updatePurchaseItem = (index, field, value) => {
    const newItems = [...purchaseFormData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-fill item name when inventory item is selected
    if (field === 'inventory_item_id') {
      const selectedItem = inventory.find(item => String(item.id) === String(value));
      if (selectedItem) {
        newItems[index].item_name = selectedItem.name;
        // Auto-fill tax rate if available
        newItems[index].tax_percent = selectedItem.tax_rate || 0;
      }
    }
    
    // Calculate item-wise discount and tax
    if (field === 'quantity' || field === 'unit_cost' || field === 'discount_percent' || field === 'discount_amount' || field === 'tax_percent') {
      const item = newItems[index];
      const quantity = parseFloat(item.quantity) || 0;
      const unitCost = parseFloat(item.unit_cost) || 0;
      const subtotal = quantity * unitCost;
      
      // Calculate discount
      if (field === 'discount_percent') {
        item.discount_amount = (subtotal * parseFloat(value)) / 100;
      } else if (field === 'discount_amount') {
        item.discount_percent = subtotal > 0 ? (parseFloat(value) / subtotal) * 100 : 0;
      }
      
      const discountAmount = parseFloat(item.discount_amount) || 0;
      const taxableAmount = subtotal - discountAmount;
      
      // Calculate tax
      const taxPercent = parseFloat(item.tax_percent) || 0;
      item.tax_amount = (taxableAmount * taxPercent) / 100;
    }
    
    setPurchaseFormData({ ...purchaseFormData, items: newItems });
  };

  const calculatePurchaseTotal = () => {
    // Calculate items subtotal
    const itemsSubtotal = purchaseFormData.items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const cost = parseFloat(item.unit_cost) || 0;
      return sum + (qty * cost);
    }, 0);
    
    // Calculate total item discounts
    const totalItemDiscounts = purchaseFormData.items.reduce((sum, item) => {
      return sum + (parseFloat(item.discount_amount) || 0);
    }, 0);
    
    // Calculate taxable amount after item discounts
    const taxableAmountAfterItemDiscounts = itemsSubtotal - totalItemDiscounts;
    
    // Apply overall discount
    const overallDiscountPercent = parseFloat(purchaseFormData.overall_discount_percent) || 0;
    const overallDiscountAmount = parseFloat(purchaseFormData.overall_discount_amount) || 0;
    
    let finalOverallDiscount = 0;
    if (overallDiscountPercent > 0) {
      finalOverallDiscount = (taxableAmountAfterItemDiscounts * overallDiscountPercent) / 100;
    } else {
      finalOverallDiscount = overallDiscountAmount;
    }
    
    const taxableAmountAfterAllDiscounts = taxableAmountAfterItemDiscounts - finalOverallDiscount;
    
    // Calculate total item taxes
    const totalItemTaxes = purchaseFormData.items.reduce((sum, item) => {
      return sum + (parseFloat(item.tax_amount) || 0);
    }, 0);
    
    // Calculate additional charges
    const shippingCharges = parseFloat(purchaseFormData.shipping_charges) || 0;
    const handlingCharges = parseFloat(purchaseFormData.handling_charges) || 0;
    const otherCharges = parseFloat(purchaseFormData.other_charges) || 0;
    
    const additionalChargesTotal = purchaseFormData.additional_charges.reduce((sum, charge) => {
      const amount = parseFloat(charge.amount) || 0;
      const taxPercent = parseFloat(charge.tax_percent) || 0;
      const taxAmount = (amount * taxPercent) / 100;
      return sum + amount + taxAmount;
    }, 0);
    
    const totalAdditionalCharges = shippingCharges + handlingCharges + otherCharges + additionalChargesTotal;
    
    // Calculate round off
    const roundOff = parseFloat(purchaseFormData.round_off) || 0;
    
    // Final total
    const finalTotal = taxableAmountAfterAllDiscounts + totalItemTaxes + totalAdditionalCharges + roundOff;
    
    return {
      itemsSubtotal,
      totalItemDiscounts,
      overallDiscount: finalOverallDiscount,
      taxableAmount: taxableAmountAfterAllDiscounts,
      totalItemTaxes,
      totalAdditionalCharges,
      roundOff,
      finalTotal
    };
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
      category_id: item.category_id ? String(item.category_id) : '', 
      supplier_id: item.supplier_id ? String(item.supplier_id) : '',
      sku: item.sku || '', 
      barcode: item.barcode || '', 
      description: item.description || '',
      location: item.location || '', 
      expiry_date: item.expiry_date || '',
      batch_number: item.batch_number || '', 
      reorder_point: item.reorder_point || '',
      reorder_quantity: item.reorder_quantity || '',
      is_perishable: item.is_perishable || false,
      storage_temperature: item.storage_temperature || '',
      shelf_life_days: item.shelf_life_days || '',
      alert_before_expiry: item.alert_before_expiry || 7
    });
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
        await apiWithRetry({
          method: 'delete',
          url: `${API}/inventory/${id}`,
          timeout: 15000
        });
        
        toast.success('Item deleted successfully');
        const updatedInventory = inventory.filter(item => item.id !== id);
        setInventory(updatedInventory);
        setLowStock(updatedInventory.filter(item => item.quantity <= item.min_quantity));
      } catch (error) { 
        let errorMessage = 'Failed to delete item';
        
        if (error.response?.status === 401) {
          errorMessage = 'Authentication required. Please login again.';
        } else if (error.response?.status === 403) {
          errorMessage = 'Not authorized to delete this item.';
        } else if (error.response?.data?.detail) {
          errorMessage = error.response.data.detail;
        }
        
        toast.error(errorMessage);
      }
    }
  };

  const handleDeleteSupplier = async (id) => {
    if (window.confirm('Delete this supplier?')) {
      try {
        await apiWithRetry({
          method: 'delete',
          url: `${API}/inventory/suppliers/${id}`,
          timeout: 15000
        });
        
        toast.success('Supplier deleted successfully!');
        fetchSuppliers();
      } catch (error) { 
        let errorMessage = 'Failed to delete supplier';
        
        if (error.response?.status === 401) {
          errorMessage = 'Authentication required. Please login again.';
        } else if (error.response?.status === 403) {
          errorMessage = 'Not authorized to delete this supplier.';
        } else if (error.response?.data?.detail) {
          errorMessage = error.response.data.detail;
        }
        
        toast.error(errorMessage);
      }
    }
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm('Delete this category?')) {
      try {
        await apiWithRetry({
          method: 'delete',
          url: `${API}/inventory/categories/${id}`,
          timeout: 15000
        });
        
        toast.success('Category deleted successfully!');
        fetchCategories();
      } catch (error) { 
        let errorMessage = 'Failed to delete category';
        
        if (error.response?.status === 401) {
          errorMessage = 'Authentication required. Please login again.';
        } else if (error.response?.status === 403) {
          errorMessage = 'Not authorized to delete this category.';
        } else if (error.response?.data?.detail) {
          errorMessage = error.response.data.detail;
        }
        
        toast.error(errorMessage);
      }
    }
  };

  // Enhanced filtered and sorted inventory with multiple filters
  const filteredAndSortedInventory = useMemo(() => {
    let filtered = inventory;

    // Search filter
    if (debouncedSearchTerm.trim()) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchLower) ||
        (item.sku && item.sku.toLowerCase().includes(searchLower)) ||
        (item.barcode && item.barcode.includes(searchLower)) ||
        (item.description && item.description.toLowerCase().includes(searchLower)) ||
        (item.location && item.location.toLowerCase().includes(searchLower))
      );
    }

    // Category filter
    if (filterCategory && filterCategory !== 'all') {
      filtered = filtered.filter(item => String(item.category_id) === String(filterCategory));
    }

    // Stock level filter
    if (stockLevelFilter !== 'all') {
      filtered = filtered.filter(item => {
        switch (stockLevelFilter) {
          case 'low':
            return item.quantity <= item.min_quantity && item.quantity > 0;
          case 'out':
            return item.quantity <= 0;
          case 'healthy':
            return item.quantity > item.min_quantity;
          default:
            return true;
        }
      });
    }

    // Legacy low stock filter (for backward compatibility)
    if (filterLowStock) {
      filtered = filtered.filter(item => item.quantity <= item.min_quantity);
    }

    // Price range filter
    if (priceRange.min !== '') {
      filtered = filtered.filter(item => parseFloat(item.price_per_unit) >= parseFloat(priceRange.min));
    }
    if (priceRange.max !== '') {
      filtered = filtered.filter(item => parseFloat(item.price_per_unit) <= parseFloat(priceRange.max));
    }

    // Expiry filter
    if (expiryFilter !== 'all') {
      const today = new Date();
      const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
      
      filtered = filtered.filter(item => {
        if (!item.expiry_date) return expiryFilter === 'all';
        const expiryDate = new Date(item.expiry_date);
        
        switch (expiryFilter) {
          case 'expiring':
            return expiryDate > today && expiryDate <= thirtyDaysFromNow;
          case 'expired':
            return expiryDate <= today;
          default:
            return true;
        }
      });
    }

    // Sort items
    const sorted = [...filtered].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'price_per_unit':
          aValue = parseFloat(a.price_per_unit) || 0;
          bValue = parseFloat(b.price_per_unit) || 0;
          break;
        case 'quantity':
          aValue = parseFloat(a.quantity) || 0;
          bValue = parseFloat(b.quantity) || 0;
          break;
        case 'total_value':
          aValue = (parseFloat(a.quantity) || 0) * (parseFloat(a.price_per_unit) || 0);
          bValue = (parseFloat(b.quantity) || 0) * (parseFloat(b.price_per_unit) || 0);
          break;
        case 'expiry_date':
          aValue = a.expiry_date ? new Date(a.expiry_date) : new Date('9999-12-31');
          bValue = b.expiry_date ? new Date(b.expiry_date) : new Date('9999-12-31');
          break;
        case 'created_at':
          aValue = new Date(a.created_at || 0);
          bValue = new Date(b.created_at || 0);
          break;
        case 'stock_status':
          aValue = a.quantity <= 0 ? 0 : a.quantity <= a.min_quantity ? 1 : 2;
          bValue = b.quantity <= 0 ? 0 : b.quantity <= b.min_quantity ? 1 : 2;
          break;
        default: // name
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [inventory, debouncedSearchTerm, filterLowStock, filterCategory, sortBy, sortOrder, stockLevelFilter, priceRange, expiryFilter]);

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
    if (!stockAdjustQty || parseFloat(stockAdjustQty) <= 0) { 
      toast.error('Enter valid quantity'); 
      return; 
    }
    
    const qty = parseFloat(stockAdjustQty);
    const newQty = stockAdjustType === 'add' ? stockAdjustItem.quantity + qty : stockAdjustItem.quantity - qty;
    
    if (newQty < 0) { 
      toast.error('Cannot reduce below 0'); 
      return; 
    }
    
    try {
      // Update inventory item quantity
      await apiWithRetry({
        method: 'put',
        url: `${API}/inventory/${stockAdjustItem.id}`,
        data: { ...stockAdjustItem, quantity: newQty },
        timeout: 15000
      });
      
      // Record stock movement
      await apiWithRetry({
        method: 'post',
        url: `${API}/inventory/movements`,
        data: { 
          item_id: stockAdjustItem.id,
          type: stockAdjustType === 'add' ? 'in' : 'out', 
          quantity: qty,
          reason: stockAdjustReason || (stockAdjustType === 'add' ? 'Stock Added' : 'Stock Reduced'),
          reference: `Manual ${stockAdjustType === 'add' ? 'Addition' : 'Reduction'}`,
          notes: `${stockAdjustType === 'add' ? 'Added' : 'Reduced'} ${qty}. Previous: ${stockAdjustItem.quantity}, New: ${newQty}` 
        },
        timeout: 15000
      });
      
      toast.success(`Stock ${stockAdjustType === 'add' ? 'added' : 'reduced'} successfully!`);
      setStockAdjustOpen(false);
      const updatedInventory = await fetchInventory();
      setLowStock(updatedInventory.filter(item => item.quantity <= item.min_quantity));
      fetchStockMovements();
    } catch (error) { 
      let errorMessage = 'Failed to adjust stock';
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication required. Please login again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Not authorized to adjust stock.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      toast.error(errorMessage);
    }
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
          <TabsList className="grid w-full grid-cols-5 bg-white shadow-sm">
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
            <TabsTrigger value="purchases" className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />Purchases
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
                <Select value={stockLevelFilter} onValueChange={setStockLevelFilter}>
                  <SelectTrigger className="w-[150px]"><SelectValue placeholder="Stock Level" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stock</SelectItem>
                    <SelectItem value="healthy">Healthy Stock</SelectItem>
                    <SelectItem value="low">Low Stock</SelectItem>
                    <SelectItem value="out">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="quantity">Quantity</SelectItem>
                    <SelectItem value="price_per_unit">Price</SelectItem>
                    <SelectItem value="total_value">Total Value</SelectItem>
                    <SelectItem value="expiry_date">Expiry Date</SelectItem>
                    <SelectItem value="stock_status">Stock Status</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
                  {sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                  <Filter className="w-4 h-4 mr-2" />
                  {showFilters ? 'Hide Filters' : 'More Filters'}
                </Button>
                {['admin', 'cashier'].includes(user?.role) && (
                  <Button className="bg-gradient-to-r from-violet-600 to-purple-600" onClick={() => { 
                    resetForm(); 
                    setDialogOpen(true); 
                  }}>
                    <Plus className="w-4 h-4 mr-2" />Add Item
                  </Button>
                )}
              </div>
              
              {/* Advanced Filters */}
              {showFilters && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border-t">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Price Range (₹)</Label>
                      <div className="flex gap-2 mt-1">
                        <Input 
                          type="number" 
                          placeholder="Min" 
                          value={priceRange.min} 
                          onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
                          className="h-8"
                        />
                        <Input 
                          type="number" 
                          placeholder="Max" 
                          value={priceRange.max} 
                          onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
                          className="h-8"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Expiry Status</Label>
                      <Select value={expiryFilter} onValueChange={setExpiryFilter}>
                        <SelectTrigger className="h-8 mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Items</SelectItem>
                          <SelectItem value="expiring">Expiring Soon (30 days)</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setPriceRange({ min: '', max: '' });
                          setExpiryFilter('all');
                          setStockLevelFilter('all');
                          setFilterCategory('all');
                          setSearchTerm('');
                        }}
                        className="h-8"
                      >
                        <X className="w-4 h-4 mr-1" />Clear Filters
                      </Button>
                    </div>
                  </div>
                </div>
              )}
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
                  const isOutOfStock = item.quantity <= 0;
                  const category = categories.find(c => String(c.id) === String(item.category_id));
                  const supplier = suppliers.find(s => String(s.id) === String(item.supplier_id));
                  const totalValue = item.quantity * item.price_per_unit;
                  
                  // Check expiry status
                  const today = new Date();
                  const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
                  const expiryDate = item.expiry_date ? new Date(item.expiry_date) : null;
                  const isExpired = expiryDate && expiryDate <= today;
                  const isExpiringSoon = expiryDate && expiryDate > today && expiryDate <= thirtyDaysFromNow;
                  
                  // Determine card border color based on status
                  let borderColor = '';
                  if (isExpired) borderColor = 'border-l-4 border-l-red-600';
                  else if (isOutOfStock) borderColor = 'border-l-4 border-l-red-500';
                  else if (isExpiringSoon) borderColor = 'border-l-4 border-l-yellow-500';
                  else if (isLowStock) borderColor = 'border-l-4 border-l-orange-500';
                  
                  return (
                    <Card key={item.id} className={`border-0 shadow-lg hover:shadow-xl transition-all ${borderColor}`}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              isExpired ? 'bg-gradient-to-br from-red-600 to-red-700' :
                              isOutOfStock ? 'bg-gradient-to-br from-red-500 to-red-600' :
                              isExpiringSoon ? 'bg-gradient-to-br from-yellow-500 to-orange-500' :
                              isLowStock ? 'bg-gradient-to-br from-orange-500 to-red-500' : 
                              'bg-gradient-to-br from-violet-500 to-purple-600'
                            }`}>
                              <Package className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{item.name}</CardTitle>
                              <div className="flex gap-1 mt-1 flex-wrap">
                                {item.sku && <Badge variant="outline" className="text-xs">{item.sku}</Badge>}
                                {category && (
                                  <Badge variant="outline" className="text-xs" style={{ borderColor: category.color, color: category.color }}>
                                    {category.name}
                                  </Badge>
                                )}
                                {item.is_perishable && <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600">Perishable</Badge>}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {isExpired && <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" title="Expired"></div>}
                            {isExpiringSoon && <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" title="Expiring Soon"></div>}
                            {isLowStock && !isExpired && !isExpiringSoon && <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" title="Low Stock"></div>}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Status Alerts */}
                        {(isExpired || isExpiringSoon || isOutOfStock) && (
                          <div className={`p-2 rounded-lg text-xs font-medium ${
                            isExpired ? 'bg-red-50 text-red-700 border border-red-200' :
                            isExpiringSoon ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                            'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {isExpired ? `⚠️ Expired on ${expiryDate.toLocaleDateString()}` :
                             isExpiringSoon ? `⏰ Expires on ${expiryDate.toLocaleDateString()}` :
                             '🚫 Out of Stock'}
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-gray-50 p-2 rounded">
                            <div className="text-gray-600 text-xs">Current Stock</div>
                            <div className={`font-bold ${
                              isOutOfStock ? 'text-red-600' :
                              isLowStock ? 'text-orange-600' : 'text-green-600'
                            }`}>
                              {item.quantity} {item.unit}
                            </div>
                          </div>
                          <div className="bg-gray-50 p-2 rounded">
                            <div className="text-gray-600 text-xs">Min Required</div>
                            <div className="font-medium">{item.min_quantity} {item.unit}</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-600">Unit Price:</span>
                            <span className="font-medium ml-1">₹{item.price_per_unit}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Total:</span>
                            <span className="font-bold text-green-600 ml-1">₹{totalValue.toFixed(2)}</span>
                          </div>
                        </div>
                        
                        {/* Additional Info */}
                        {(item.location || supplier || item.batch_number || expiryDate) && (
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
                            {expiryDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Expires: {expiryDate.toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {['admin', 'cashier'].includes(user?.role) && (
                          <div className="flex gap-2 pt-2 border-t">
                            <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEdit(item)}>
                              <Edit className="w-3 h-3 mr-1" />Edit
                            </Button>
                            <Button size="sm" variant="outline" className="border-green-500 text-green-600" onClick={() => openStockAdjust(item, 'add')}>
                              <Plus className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" className="border-orange-500 text-orange-600" onClick={() => openStockAdjust(item, 'reduce')}>
                              <Minus className="w-3 h-3" />
                            </Button>
                            {['admin'].includes(user?.role) && (
                              <Button size="sm" variant="outline" className="border-red-500 text-red-600" onClick={() => handleDelete(item.id)}>
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

          {/* Purchases Tab */}
          <TabsContent value="purchases" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <ShoppingCart className="w-6 h-6 text-violet-600" />Purchase Orders ({purchases.length})
              </h2>
              {['admin', 'cashier'].includes(user?.role) && (
                <Button className="bg-gradient-to-r from-violet-600 to-purple-600" onClick={() => { setActiveTab('purchases'); setPurchaseDialogOpen(true); }}>
                  <Plus className="w-4 h-4 mr-2" />New Purchase
                </Button>
              )}
            </div>
            
            {/* Purchase Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-700">
                        ₹{purchases.reduce((sum, p) => sum + (p.total_amount || 0), 0).toFixed(0)}
                      </div>
                      <div className="text-sm text-green-600">Total Purchases</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                      <ShoppingCart className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-700">{purchases.length}</div>
                      <div className="text-sm text-blue-600">Total Orders</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                      <Truck className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-700">
                        {[...new Set(purchases.map(p => p.supplier_id))].length}
                      </div>
                      <div className="text-sm text-purple-600">Suppliers Used</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Purchase Orders Table */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {purchases.map((purchase, i) => (
                        <tr key={purchase.id || i} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">
                            {purchase.purchase_date ? new Date(purchase.purchase_date).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">{purchase.supplier_name || 'Unknown'}</td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex flex-wrap gap-1">
                              {(purchase.items || []).slice(0, 2).map((item, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {item.item_name} ({item.quantity})
                                </Badge>
                              ))}
                              {(purchase.items || []).length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{purchase.items.length - 2} more
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-green-600">
                            ₹{(purchase.total_amount || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={
                              purchase.status === 'received' ? 'bg-green-100 text-green-700' :
                              purchase.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }>
                              {purchase.status === 'received' ? '✓ Received' :
                               purchase.status === 'pending' ? '⏳ Pending' : '✗ Cancelled'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Button size="sm" variant="outline" onClick={() => {
                              setSelectedPurchase(purchase);
                              setPurchaseDetailOpen(true);
                            }}>
                              <Eye className="w-3 h-3 mr-1" />View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {purchases.length === 0 && (
                    <div className="text-center py-12">
                      <ShoppingCart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No purchase orders yet</h3>
                      <p className="text-gray-500 mb-4">Record your first purchase to track inventory procurement</p>
                      {['admin', 'cashier'].includes(user?.role) && (
                        <Button onClick={() => setPurchaseDialogOpen(true)} className="bg-gradient-to-r from-violet-600 to-purple-600">
                          <Plus className="w-4 h-4 mr-2" />Create First Purchase
                        </Button>
                      )}
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
                    <Select value={formData.category_id || 'none'} onValueChange={(value) => setFormData({ ...formData, category_id: value === 'none' ? '' : value })}>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {categories.map(cat => (<SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Supplier</Label>
                    <Select value={formData.supplier_id || 'none'} onValueChange={(value) => setFormData({ ...formData, supplier_id: value === 'none' ? '' : value })}>
                      <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
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
                  <div>
                    <Label>Alert Before Expiry (days)</Label>
                    <Input type="number" min="1" value={formData.alert_before_expiry} onChange={(e) => setFormData({ ...formData, alert_before_expiry: e.target.value })} />
                  </div>
                  <div className="md:col-span-2">
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="is_perishable" 
                        checked={formData.is_perishable} 
                        onChange={(e) => setFormData({ ...formData, is_perishable: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="is_perishable">This is a perishable item</Label>
                    </div>
                  </div>
                  {formData.is_perishable && (
                    <>
                      <div>
                        <Label>Storage Temperature</Label>
                        <Input value={formData.storage_temperature} onChange={(e) => setFormData({ ...formData, storage_temperature: e.target.value })} placeholder="e.g., 2-8°C, Room temperature" />
                      </div>
                      <div>
                        <Label>Shelf Life (days)</Label>
                        <Input type="number" min="1" value={formData.shelf_life_days} onChange={(e) => setFormData({ ...formData, shelf_life_days: e.target.value })} />
                      </div>
                    </>
                  )}
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

        {/* Purchase Order Dialog */}
        <Dialog open={purchaseDialogOpen} onOpenChange={(open) => { setPurchaseDialogOpen(open); if (!open) resetPurchaseForm(); }}>
          <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />Create Purchase Order
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handlePurchaseSubmit} className="space-y-6">
              {/* Basic Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Order Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Supplier *</Label>
                    <Select value={purchaseFormData.supplier_id || ''} onValueChange={(value) => setPurchaseFormData({ ...purchaseFormData, supplier_id: value })}>
                      <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                      <SelectContent>
                        {suppliers.map(sup => (<SelectItem key={sup.id} value={String(sup.id)}>{sup.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Purchase Date *</Label>
                    <Input type="date" value={purchaseFormData.purchase_date} onChange={(e) => setPurchaseFormData({ ...purchaseFormData, purchase_date: e.target.value })} required />
                  </div>
                  <div>
                    <Label>Expected Delivery</Label>
                    <Input type="date" value={purchaseFormData.expected_delivery} onChange={(e) => setPurchaseFormData({ ...purchaseFormData, expected_delivery: e.target.value })} />
                  </div>
                  <div>
                    <Label>Reference Number</Label>
                    <Input value={purchaseFormData.reference_number} onChange={(e) => setPurchaseFormData({ ...purchaseFormData, reference_number: e.target.value })} placeholder="PO-001" />
                  </div>
                  <div>
                    <Label>Payment Terms</Label>
                    <Select value={purchaseFormData.payment_terms} onValueChange={(value) => setPurchaseFormData({ ...purchaseFormData, payment_terms: value })}>
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
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="tax_inclusive" 
                      checked={purchaseFormData.tax_inclusive} 
                      onChange={(e) => setPurchaseFormData({ ...purchaseFormData, tax_inclusive: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="tax_inclusive">Tax Inclusive Pricing</Label>
                  </div>
                </div>
              </div>
              
              {/* Line Items */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold">Line Items</h3>
                  <Button type="button" size="sm" variant="outline" onClick={addPurchaseItem}>
                    <Plus className="w-4 h-4 mr-1" />Add Item
                  </Button>
                </div>
                <div className="space-y-3">
                  {purchaseFormData.items.map((item, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg border">
                      <div className="grid grid-cols-12 gap-2 items-end mb-3">
                        <div className="col-span-3">
                          <Label className="text-xs">Item *</Label>
                          <Select value={item.inventory_item_id || ''} onValueChange={(value) => updatePurchaseItem(index, 'inventory_item_id', value)}>
                            <SelectTrigger className="h-9"><SelectValue placeholder="Select item" /></SelectTrigger>
                            <SelectContent>
                              {inventory.map(inv => (<SelectItem key={inv.id} value={String(inv.id)}>{inv.name} ({inv.quantity} {inv.unit})</SelectItem>))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Quantity *</Label>
                          <Input type="number" step="0.01" min="0.01" className="h-9" placeholder="Qty" value={item.quantity} onChange={(e) => updatePurchaseItem(index, 'quantity', e.target.value)} />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Unit Cost (₹) *</Label>
                          <Input type="number" step="0.01" min="0" className="h-9" placeholder="Cost" value={item.unit_cost} onChange={(e) => updatePurchaseItem(index, 'unit_cost', e.target.value)} />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Discount %</Label>
                          <Input type="number" step="0.01" min="0" max="100" className="h-9" placeholder="0" value={item.discount_percent} onChange={(e) => updatePurchaseItem(index, 'discount_percent', e.target.value)} />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Tax %</Label>
                          <Input type="number" step="0.01" min="0" className="h-9" placeholder="0" value={item.tax_percent} onChange={(e) => updatePurchaseItem(index, 'tax_percent', e.target.value)} />
                        </div>
                        <div className="col-span-1">
                          {purchaseFormData.items.length > 1 && (
                            <Button type="button" size="sm" variant="outline" className="h-9 w-9 p-0 border-red-300 text-red-500" onClick={() => removePurchaseItem(index)}>
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {/* Item calculations display */}
                      <div className="grid grid-cols-6 gap-2 text-xs bg-gray-50 p-2 rounded">
                        <div>
                          <span className="text-gray-600">Subtotal:</span>
                          <div className="font-medium">₹{((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_cost) || 0)).toFixed(2)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Discount:</span>
                          <div className="font-medium text-orange-600">₹{(parseFloat(item.discount_amount) || 0).toFixed(2)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Taxable:</span>
                          <div className="font-medium">₹{(((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_cost) || 0)) - (parseFloat(item.discount_amount) || 0)).toFixed(2)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Tax:</span>
                          <div className="font-medium text-blue-600">₹{(parseFloat(item.tax_amount) || 0).toFixed(2)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Total:</span>
                          <div className="font-bold text-green-600">₹{(((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_cost) || 0)) - (parseFloat(item.discount_amount) || 0) + (parseFloat(item.tax_amount) || 0)).toFixed(2)}</div>
                        </div>
                        <div>
                          <Label className="text-xs">Expiry</Label>
                          <Input type="date" className="h-7 text-xs" value={item.expiry_date} onChange={(e) => updatePurchaseItem(index, 'expiry_date', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Overall Discounts */}
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Overall Discounts</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Overall Discount %</Label>
                    <Input type="number" step="0.01" min="0" max="100" value={purchaseFormData.overall_discount_percent} onChange={(e) => setPurchaseFormData({ ...purchaseFormData, overall_discount_percent: e.target.value, overall_discount_amount: 0 })} />
                  </div>
                  <div>
                    <Label>Overall Discount Amount (₹)</Label>
                    <Input type="number" step="0.01" min="0" value={purchaseFormData.overall_discount_amount} onChange={(e) => setPurchaseFormData({ ...purchaseFormData, overall_discount_amount: e.target.value, overall_discount_percent: 0 })} />
                  </div>
                </div>
              </div>

              {/* Additional Charges */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold">Additional Charges</h3>
                  <Button type="button" size="sm" variant="outline" onClick={addAdditionalCharge}>
                    <Plus className="w-4 h-4 mr-1" />Add Charge
                  </Button>
                </div>
                
                {/* Standard charges */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <Label>Shipping Charges (₹)</Label>
                    <Input type="number" step="0.01" min="0" value={purchaseFormData.shipping_charges} onChange={(e) => setPurchaseFormData({ ...purchaseFormData, shipping_charges: e.target.value })} />
                  </div>
                  <div>
                    <Label>Handling Charges (₹)</Label>
                    <Input type="number" step="0.01" min="0" value={purchaseFormData.handling_charges} onChange={(e) => setPurchaseFormData({ ...purchaseFormData, handling_charges: e.target.value })} />
                  </div>
                  <div>
                    <Label>Other Charges (₹)</Label>
                    <Input type="number" step="0.01" min="0" value={purchaseFormData.other_charges} onChange={(e) => setPurchaseFormData({ ...purchaseFormData, other_charges: e.target.value })} />
                  </div>
                </div>

                {/* Custom additional charges */}
                <div className="space-y-2">
                  {purchaseFormData.additional_charges.map((charge, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end bg-white p-2 rounded border">
                      <div className="col-span-6">
                        <Label className="text-xs">Description</Label>
                        <Input className="h-8" placeholder="e.g., Insurance, Packaging" value={charge.description} onChange={(e) => updateAdditionalCharge(index, 'description', e.target.value)} />
                      </div>
                      <div className="col-span-3">
                        <Label className="text-xs">Amount (₹)</Label>
                        <Input type="number" step="0.01" min="0" className="h-8" value={charge.amount} onChange={(e) => updateAdditionalCharge(index, 'amount', e.target.value)} />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Tax %</Label>
                        <Input type="number" step="0.01" min="0" className="h-8" value={charge.tax_percent} onChange={(e) => updateAdditionalCharge(index, 'tax_percent', e.target.value)} />
                      </div>
                      <div className="col-span-1">
                        {purchaseFormData.additional_charges.length > 1 && (
                          <Button type="button" size="sm" variant="outline" className="h-8 w-8 p-0 border-red-300 text-red-500" onClick={() => removeAdditionalCharge(index)}>
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Round Off */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Round Off (₹)</Label>
                    <Input type="number" step="0.01" value={purchaseFormData.round_off} onChange={(e) => setPurchaseFormData({ ...purchaseFormData, round_off: e.target.value })} placeholder="0.00" />
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea value={purchaseFormData.notes} onChange={(e) => setPurchaseFormData({ ...purchaseFormData, notes: e.target.value })} rows={2} placeholder="Additional notes about this purchase..." />
                  </div>
                </div>
              </div>
              
              {/* Purchase Summary */}
              <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                <h3 className="font-semibold mb-3 text-green-800">Purchase Summary</h3>
                {(() => {
                  const calculations = calculatePurchaseTotal();
                  return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-sm text-gray-600">Items Subtotal</div>
                        <div className="text-lg font-bold">₹{calculations.itemsSubtotal.toFixed(2)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600">Total Discounts</div>
                        <div className="text-lg font-bold text-orange-600">-₹{(calculations.totalItemDiscounts + calculations.overallDiscount).toFixed(2)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600">Total Taxes</div>
                        <div className="text-lg font-bold text-blue-600">₹{calculations.totalItemTaxes.toFixed(2)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600">Additional Charges</div>
                        <div className="text-lg font-bold text-purple-600">₹{calculations.totalAdditionalCharges.toFixed(2)}</div>
                      </div>
                      <div className="col-span-2 md:col-span-4 text-center border-t pt-3 mt-3">
                        <div className="text-lg text-gray-600">Final Total Amount</div>
                        <div className="text-3xl font-bold text-green-600">₹{calculations.finalTotal.toFixed(2)}</div>
                      </div>
                    </div>
                  );
                })()}
              </div>
              
              <div className="flex gap-3">
                <Button type="submit" className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600" disabled={!purchaseFormData.supplier_id || purchaseFormData.items.some(i => !i.inventory_item_id || !i.quantity || !i.unit_cost)}>
                  <CheckCircle className="w-4 h-4 mr-2" />Create Purchase Order
                </Button>
                <Button type="button" variant="outline" onClick={() => { setPurchaseDialogOpen(false); resetPurchaseForm(); }}>Cancel</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Purchase Detail Dialog */}
        <Dialog open={purchaseDetailOpen} onOpenChange={(open) => { setPurchaseDetailOpen(open); if (!open) setSelectedPurchase(null); }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />Purchase Order Details
              </DialogTitle>
            </DialogHeader>
            {selectedPurchase && (
              <div className="space-y-6">
                {/* Header Information */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-500">Supplier</div>
                    <div className="font-semibold">{selectedPurchase.supplier_name || 'Unknown'}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-500">Purchase Date</div>
                    <div className="font-semibold">{selectedPurchase.purchase_date ? new Date(selectedPurchase.purchase_date).toLocaleDateString() : '-'}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-500">Reference</div>
                    <div className="font-semibold">{selectedPurchase.reference_number || 'N/A'}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-500">Status</div>
                    <Badge className={
                      selectedPurchase.status === 'received' ? 'bg-green-100 text-green-700' :
                      selectedPurchase.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }>
                      {selectedPurchase.status === 'received' ? '✓ Received' :
                       selectedPurchase.status === 'pending' ? '⏳ Pending' : '✗ Cancelled'}
                    </Badge>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-semibold mb-3 text-green-800">Financial Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Items Subtotal</div>
                      <div className="text-lg font-bold">₹{(selectedPurchase.items_subtotal || 0).toFixed(2)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Total Discounts</div>
                      <div className="text-lg font-bold text-orange-600">-₹{((selectedPurchase.total_item_discounts || 0) + (selectedPurchase.overall_discount_amount || 0)).toFixed(2)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Total Taxes</div>
                      <div className="text-lg font-bold text-blue-600">₹{(selectedPurchase.total_taxes || 0).toFixed(2)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Additional Charges</div>
                      <div className="text-lg font-bold text-purple-600">₹{(selectedPurchase.additional_charges_total || 0).toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="text-center border-t pt-3 mt-3">
                    <div className="text-lg text-gray-600">Final Total</div>
                    <div className="text-3xl font-bold text-green-600">₹{(selectedPurchase.final_total || selectedPurchase.total_amount || 0).toFixed(2)}</div>
                  </div>
                </div>
                
                {/* Items Table */}
                <div>
                  <h4 className="font-semibold mb-2">Items</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Item</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Qty</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Unit Cost</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Discount</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Tax</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {(selectedPurchase.items || []).map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2 text-sm">
                              <div className="font-medium">{item.item_name}</div>
                              {item.expiry_date && (
                                <div className="text-xs text-gray-500">Expires: {new Date(item.expiry_date).toLocaleDateString()}</div>
                              )}
                            </td>
                            <td className="px-3 py-2 text-sm text-right">{item.quantity}</td>
                            <td className="px-3 py-2 text-sm text-right">₹{(item.unit_cost || 0).toFixed(2)}</td>
                            <td className="px-3 py-2 text-sm text-right">
                              {item.discount_amount > 0 ? (
                                <div>
                                  <div className="text-orange-600">₹{item.discount_amount.toFixed(2)}</div>
                                  <div className="text-xs text-gray-500">({item.discount_percent}%)</div>
                                </div>
                              ) : '-'}
                            </td>
                            <td className="px-3 py-2 text-sm text-right">
                              {item.tax_amount > 0 ? (
                                <div>
                                  <div className="text-blue-600">₹{item.tax_amount.toFixed(2)}</div>
                                  <div className="text-xs text-gray-500">({item.tax_percent}%)</div>
                                </div>
                              ) : '-'}
                            </td>
                            <td className="px-3 py-2 text-sm text-right font-medium">₹{(item.line_total || item.total_cost || item.quantity * item.unit_cost).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Additional Charges */}
                {selectedPurchase.additional_charges && selectedPurchase.additional_charges.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Additional Charges</h4>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Description</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Amount</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Tax</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {selectedPurchase.additional_charges.map((charge, idx) => (
                            <tr key={idx}>
                              <td className="px-3 py-2 text-sm">{charge.description}</td>
                              <td className="px-3 py-2 text-sm text-right">₹{charge.amount.toFixed(2)}</td>
                              <td className="px-3 py-2 text-sm text-right">
                                {charge.tax_amount > 0 ? `₹${charge.tax_amount.toFixed(2)} (${charge.tax_percent}%)` : '-'}
                              </td>
                              <td className="px-3 py-2 text-sm text-right font-medium">₹{charge.total_amount.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Standard Charges */}
                {(selectedPurchase.shipping_charges > 0 || selectedPurchase.handling_charges > 0 || selectedPurchase.other_charges > 0) && (
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Standard Charges</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {selectedPurchase.shipping_charges > 0 && (
                        <div className="text-center">
                          <div className="text-sm text-gray-600">Shipping</div>
                          <div className="font-bold">₹{selectedPurchase.shipping_charges.toFixed(2)}</div>
                        </div>
                      )}
                      {selectedPurchase.handling_charges > 0 && (
                        <div className="text-center">
                          <div className="text-sm text-gray-600">Handling</div>
                          <div className="font-bold">₹{selectedPurchase.handling_charges.toFixed(2)}</div>
                        </div>
                      )}
                      {selectedPurchase.other_charges > 0 && (
                        <div className="text-center">
                          <div className="text-sm text-gray-600">Other</div>
                          <div className="font-bold">₹{selectedPurchase.other_charges.toFixed(2)}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Additional Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedPurchase.payment_terms && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-500">Payment Terms</div>
                      <div className="font-semibold capitalize">{selectedPurchase.payment_terms}</div>
                    </div>
                  )}
                  {selectedPurchase.expected_delivery && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-500">Expected Delivery</div>
                      <div className="font-semibold">{new Date(selectedPurchase.expected_delivery).toLocaleDateString()}</div>
                    </div>
                  )}
                </div>

                {selectedPurchase.notes && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-500">Notes</div>
                    <div>{selectedPurchase.notes}</div>
                  </div>
                )}
                
                <div className="text-xs text-gray-400">
                  Created: {selectedPurchase.created_at ? new Date(selectedPurchase.created_at).toLocaleString() : '-'}
                  {selectedPurchase.created_by && ` by ${selectedPurchase.created_by}`}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default InventoryPage;
