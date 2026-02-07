import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import TrialBanner from '../components/TrialBanner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { 
  Plus, DollarSign, Calendar, Download, RefreshCw, Edit, Trash2, Search, 
  TrendingDown, PieChart, CreditCard, Wallet, Smartphone, Building, Receipt, 
  Zap, CheckCircle, AlertCircle, Clock, Filter, BarChart3, TrendingUp, 
  ArrowUpRight, ArrowDownRight, Eye, FileText, Target, Award, Users
} from 'lucide-react';

const EXPENSE_CATEGORIES = [
  "Rent", "Utilities", "Salaries", "Supplies", "Maintenance", "Marketing", 
  "Insurance", "Taxes", "Equipment", "Transportation", "Food & Ingredients", 
  "Cleaning", "Licenses", "Professional Services", "Other"
];

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash', icon: DollarSign, color: 'bg-green-500' },
  { value: 'card', label: 'Card', icon: CreditCard, color: 'bg-blue-500' },
  { value: 'upi', label: 'UPI', icon: Smartphone, color: 'bg-purple-500' },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: Building, color: 'bg-indigo-500' }
];

// 🚀 OPTIMIZED EXPENSE CACHE for instant loading
class ExpenseCache {
  constructor() {
    this.cache = new Map();
    this.summaryCache = new Map();
    this.TTL = 2 * 60 * 1000; // 2 minutes
  }

  getCacheKey(filters) {
    return JSON.stringify(filters);
  }

  get(filters) {
    const key = this.getCacheKey(filters);
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return cached.data;
    }
    return null;
  }

  set(filters, data) {
    const key = this.getCacheKey(filters);
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  getSummary(filters) {
    const key = this.getCacheKey(filters);
    const cached = this.summaryCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return cached.data;
    }
    return null;
  }

  setSummary(filters, data) {
    const key = this.getCacheKey(filters);
    this.summaryCache.set(key, { data, timestamp: Date.now() });
  }

  invalidate() {
    this.cache.clear();
    this.summaryCache.clear();
  }

  invalidatePattern(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        this.summaryCache.delete(key);
      }
    }
  }
}

const expenseCache = new ExpenseCache();

const ExpensePage = ({ user }) => {
  // Core state
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [summary, setSummary] = useState({ 
    total: 0, 
    count: 0, 
    by_category: {}, 
    by_payment_method: {},
    trend: { current: 0, previous: 0, change: 0 }
  });

  // New state for category management and reports
  const [customCategories, setCustomCategories] = useState([]);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [reportsDialogOpen, setReportsDialogOpen] = useState(false);
  const [reportDateRange, setReportDateRange] = useState({
    start_date: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });
  const [reportLoading, setReportLoading] = useState(false);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('month');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('all');

  // Form state with validation
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    category: '',
    description: '',
    payment_method: 'cash',
    vendor_name: '',
    notes: ''
  });

  // Advanced UI state
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [optimisticExpenses, setOptimisticExpenses] = useState([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [bulkSelection, setBulkSelection] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'grid', 'chart'

  // Performance refs
  const searchTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  // 🚀 OPTIMIZED DATA LOADING with caching
  const loadExpensesOptimized = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    
    const filters = { searchTerm, filterCategory, filterDateRange, filterPaymentMethod, sortBy, sortOrder };
    
    // Try cache first
    const cachedExpenses = expenseCache.get(filters);
    const cachedSummary = expenseCache.getSummary(filters);
    
    if (cachedExpenses && cachedSummary) {
      console.log('⚡ Using cached expense data');
      setExpenses(cachedExpenses);
      setSummary(cachedSummary);
      setLoading(false);
      return;
    }

    try {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const token = localStorage.getItem('token');
      const [expensesResponse, summaryResponse] = await Promise.all([
        axios.get(`${API}/expenses`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            search: searchTerm || undefined,
            category: filterCategory !== 'all' ? filterCategory : undefined,
            date_range: filterDateRange,
            payment_method: filterPaymentMethod !== 'all' ? filterPaymentMethod : undefined,
            sort_by: sortBy,
            sort_order: sortOrder
          },
          signal: abortControllerRef.current.signal
        }),
        axios.get(`${API}/expenses/summary`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            search: searchTerm || undefined,
            category: filterCategory !== 'all' ? filterCategory : undefined,
            date_range: filterDateRange,
            payment_method: filterPaymentMethod !== 'all' ? filterPaymentMethod : undefined
          },
          signal: abortControllerRef.current.signal
        })
      ]);

      const expensesData = expensesResponse.data || [];
      const summaryData = summaryResponse.data || { total: 0, count: 0, by_category: {}, by_payment_method: {}, trend: { current: 0, previous: 0, change: 0 } };

      // Cache the results
      expenseCache.set(filters, expensesData);
      expenseCache.setSummary(filters, summaryData);

      setExpenses(expensesData);
      setSummary(summaryData);
      
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Failed to load expenses:', error);
        toast.error('Failed to load expenses');
        setExpenses([]);
        setSummary({ total: 0, count: 0, by_category: {}, by_payment_method: {}, trend: { current: 0, previous: 0, change: 0 } });
      }
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterCategory, filterDateRange, filterPaymentMethod, sortBy, sortOrder]);

  // Load data on mount and filter changes
  useEffect(() => {
    loadExpensesOptimized();
  }, [loadExpensesOptimized]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      loadExpensesOptimized(false);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Filtered and sorted expenses
  const filteredExpenses = useMemo(() => {
    let filtered = [...expenses, ...optimisticExpenses];
    
    // Apply client-side filtering for instant feedback
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(expense => 
        expense.description?.toLowerCase().includes(term) ||
        expense.vendor_name?.toLowerCase().includes(term) ||
        expense.category?.toLowerCase().includes(term) ||
        expense.notes?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [expenses, optimisticExpenses, searchTerm]);

  // Form validation
  const validateForm = useCallback(() => {
    const errors = {};
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      errors.amount = 'Amount must be greater than 0';
    }
    
    if (!formData.category) {
      errors.category = 'Category is required';
    }
    
    if (!formData.description?.trim()) {
      errors.description = 'Description is required';
    }
    
    if (!formData.date) {
      errors.date = 'Date is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // Handle form submission with optimistic updates
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    setSubmitting(true);

    // Create optimistic expense
    const optimisticExpense = {
      id: `temp_${Date.now()}`,
      ...formData,
      amount: parseFloat(formData.amount),
      created_at: new Date().toISOString(),
      isOptimistic: true
    };

    // Add to optimistic list for instant feedback
    setOptimisticExpenses(prev => [optimisticExpense, ...prev]);
    
    // Show immediate success feedback
    toast.success(editingExpense ? 'Expense updated!' : 'Expense added!');
    
    // Close dialog immediately
    setDialogOpen(false);
    resetForm();

    try {
      const token = localStorage.getItem('token');
      
      if (editingExpense) {
        await axios.put(`${API}/expenses/${editingExpense.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API}/expenses`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      // Remove optimistic expense and invalidate cache
      setOptimisticExpenses(prev => prev.filter(exp => exp.id !== optimisticExpense.id));
      expenseCache.invalidate();
      
      // Reload data in background
      loadExpensesOptimized(false);
      
    } catch (error) {
      console.error('Failed to save expense:', error);
      
      // Remove optimistic expense on error
      setOptimisticExpenses(prev => prev.filter(exp => exp.id !== optimisticExpense.id));
      
      toast.error(editingExpense ? 'Failed to update expense' : 'Failed to add expense');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete with optimistic updates
  const handleDelete = async (expense) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    // Optimistic removal
    setExpenses(prev => prev.filter(exp => exp.id !== expense.id));
    toast.success('Expense deleted!');

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/expenses/${expense.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      expenseCache.invalidate();
      loadExpensesOptimized(false);
      
    } catch (error) {
      console.error('Failed to delete expense:', error);
      toast.error('Failed to delete expense');
      
      // Revert optimistic removal
      loadExpensesOptimized(false);
    }
  };

  // Handle edit
  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      date: expense.date,
      amount: expense.amount.toString(),
      category: expense.category,
      description: expense.description,
      payment_method: expense.payment_method,
      vendor_name: expense.vendor_name || '',
      notes: expense.notes || ''
    });
    setDialogOpen(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      amount: '',
      category: '',
      description: '',
      payment_method: 'cash',
      vendor_name: '',
      notes: ''
    });
    setFormErrors({});
    setEditingExpense(null);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const csvData = filteredExpenses.map(expense => ({
      Date: expense.date,
      Amount: expense.amount,
      Category: expense.category,
      Description: expense.description,
      'Payment Method': expense.payment_method,
      'Vendor Name': expense.vendor_name || '',
      Notes: expense.notes || ''
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Get payment method icon and color
  const getPaymentMethodInfo = (method) => {
    const info = PAYMENT_METHODS.find(pm => pm.value === method);
    return info || { icon: DollarSign, color: 'bg-gray-500', label: method };
  };

  // Get category color
  const getCategoryColor = (category) => {
    const colors = {
      'Rent': 'bg-blue-100 text-blue-800',
      'Utilities': 'bg-yellow-100 text-yellow-800',
      'Salaries': 'bg-green-100 text-green-800',
      'Supplies': 'bg-purple-100 text-purple-800',
      'Maintenance': 'bg-orange-100 text-orange-800',
      'Marketing': 'bg-pink-100 text-pink-800',
      'Insurance': 'bg-indigo-100 text-indigo-800',
      'Taxes': 'bg-red-100 text-red-800',
      'Equipment': 'bg-gray-100 text-gray-800',
      'Transportation': 'bg-cyan-100 text-cyan-800',
      'Food & Ingredients': 'bg-emerald-100 text-emerald-800',
      'Cleaning': 'bg-teal-100 text-teal-800',
      'Licenses': 'bg-violet-100 text-violet-800',
      'Professional Services': 'bg-rose-100 text-rose-800',
      'Other': 'bg-slate-100 text-slate-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  // Load custom categories
  const loadCustomCategories = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/expense-categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomCategories(response.data || []);
    } catch (error) {
      console.error('Failed to load custom categories:', error);
    }
  }, []);

  // Get all categories (default + custom)
  const getAllCategories = useMemo(() => {
    return [...EXPENSE_CATEGORIES, ...customCategories.map(cat => cat.name)];
  }, [customCategories]);

  // Add new category
  const handleAddCategory = async (e) => {
    e.preventDefault();
    
    if (!newCategoryName.trim()) {
      toast.error('Category name is required');
      return;
    }

    if (getAllCategories.includes(newCategoryName.trim())) {
      toast.error('Category already exists');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/expense-categories`, {
        name: newCategoryName.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Category added successfully!');
      setNewCategoryName('');
      setCategoryDialogOpen(false);
      loadCustomCategories();
    } catch (error) {
      console.error('Failed to add category:', error);
      toast.error('Failed to add category');
    }
  };

  // Generate expense report PDF
  const handleGenerateReportPDF = async () => {
    setReportLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/expenses/report`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          start_date: reportDateRange.start_date,
          end_date: reportDateRange.end_date,
          format: 'detailed'
        }
      });

      const reportData = response.data;
      
      // Check if running in Electron desktop app
      const isElectron = window.electronAPI?.isElectron || window.__ELECTRON__;
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Expense Report - ${reportDateRange.start_date} to ${reportDateRange.end_date}</title>
          <style>
            @page { size: A4; margin: 15mm; }
            * { box-sizing: border-box; }
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              font-size: 11px;
              line-height: 1.4;
              color: #1f2937;
              margin: 0;
              padding: 15px;
            }
            .header {
              text-align: center;
              padding: 20px;
              background: linear-gradient(135deg, #dc2626 0%, #ea580c 100%);
              color: white;
              border-radius: 12px;
              margin-bottom: 20px;
            }
            .header h1 { margin: 0 0 5px 0; font-size: 24px; }
            .header p { margin: 3px 0; opacity: 0.9; }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 12px;
              margin-bottom: 20px;
            }
            .summary-card {
              padding: 15px;
              border-radius: 10px;
              text-align: center;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
            }
            .summary-card h4 { margin: 0 0 5px 0; font-size: 10px; text-transform: uppercase; color: #666; }
            .summary-card p { margin: 0; font-size: 18px; font-weight: bold; color: #dc2626; }
            .section { margin-bottom: 20px; }
            .section-title { font-size: 14px; font-weight: bold; color: #dc2626; margin-bottom: 10px; border-bottom: 2px solid #dc2626; padding-bottom: 5px; }
            .breakdown-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .breakdown-item { display: flex; justify-content: space-between; padding: 8px 12px; border-radius: 6px; margin-bottom: 5px; background: #fef2f2; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #e5e7eb; padding: 8px 10px; text-align: left; font-size: 10px; }
            th { background: #dc2626; color: white; font-weight: 600; }
            tr:nth-child(even) { background: #f9fafb; }
            .total-row { background: #fee2e2; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 10px; color: #666; }
            @media print { body { padding: 0; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>💰 Expense Report</h1>
            <p>${user?.business_settings?.restaurant_name || 'Restaurant'}</p>
            <p>Period: ${new Date(reportDateRange.start_date).toLocaleDateString()} - ${new Date(reportDateRange.end_date).toLocaleDateString()}</p>
            <p>Generated: ${new Date().toLocaleString()}</p>
          </div>

          <div class="summary-grid">
            <div class="summary-card">
              <h4>Total Expenses</h4>
              <p>₹${reportData.total_amount?.toFixed(2) || '0.00'}</p>
            </div>
            <div class="summary-card">
              <h4>Total Transactions</h4>
              <p>${reportData.total_count || 0}</p>
            </div>
            <div class="summary-card">
              <h4>Categories</h4>
              <p>${Object.keys(reportData.by_category || {}).length}</p>
            </div>
            <div class="summary-card">
              <h4>Avg per Day</h4>
              <p>₹${reportData.daily_average?.toFixed(2) || '0.00'}</p>
            </div>
          </div>

          <div class="breakdown-grid">
            <div class="section">
              <div class="section-title">📊 Expenses by Category</div>
              ${Object.entries(reportData.by_category || {}).map(([category, amount]) => `
                <div class="breakdown-item">
                  <span>${category}</span>
                  <span>₹${amount.toFixed(2)}</span>
                </div>
              `).join('')}
            </div>
            <div class="section">
              <div class="section-title">💳 Expenses by Payment Method</div>
              ${Object.entries(reportData.by_payment_method || {}).map(([method, amount]) => `
                <div class="breakdown-item">
                  <span style="text-transform: capitalize;">${method}</span>
                  <span>₹${amount.toFixed(2)}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="section">
            <div class="section-title">📋 Detailed Expenses (${reportData.expenses?.length || 0} transactions)</div>
            ${reportData.expenses?.length > 0 ? `
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Vendor</th>
                    <th>Payment Method</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${reportData.expenses.map(expense => `
                    <tr>
                      <td>${new Date(expense.date).toLocaleDateString()}</td>
                      <td>${expense.description}</td>
                      <td>${expense.category}</td>
                      <td>${expense.vendor_name || '-'}</td>
                      <td style="text-transform: capitalize;">${expense.payment_method}</td>
                      <td>₹${expense.amount.toFixed(2)}</td>
                    </tr>
                  `).join('')}
                  <tr class="total-row">
                    <td colspan="5">TOTAL</td>
                    <td>₹${reportData.total_amount?.toFixed(2) || '0.00'}</td>
                  </tr>
                </tbody>
              </table>
            ` : '<p style="color: #666; text-align: center; padding: 20px;">No expenses found for this period</p>'}
          </div>

          <div class="footer">
            <p>Generated by BillByteKOT - Restaurant Management System</p>
            <p>${user?.business_settings?.address || ''} | ${user?.business_settings?.phone || ''}</p>
          </div>

          <div class="no-print" style="text-align: center; margin-top: 20px;">
            <button onclick="window.print(); setTimeout(() => window.close(), 100);" 
              style="padding: 12px 24px; background: #dc2626; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">
              Save as PDF
            </button>
            <button onclick="window.close()" 
              style="padding: 12px 24px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; margin-left: 10px;">
              Close
            </button>
            <p style="margin-top: 10px; font-size: 12px; color: #666;">
              Click "Save as PDF" and choose "Save as PDF" in the print dialog
            </p>
          </div>
        </body>
        </html>
      `;

      if (isElectron) {
        // DESKTOP FIX: Use blob URL instead of window.open for Electron
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        // Open with proper blob:// protocol that Windows can handle
        const printWindow = window.open(url, '_blank');
        
        // Cleanup blob URL after window opens
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 1000);
      } else {
        // WEB VERSION: Use traditional window.open approach
        const printWindow = window.open('', '_blank');
        printWindow.document.write(htmlContent);
        printWindow.document.close();
      }
      
      toast.success("Expense report ready! Click 'Save as PDF' to download");
    } catch (error) {
      console.error('Failed to generate expense report:', error);
      toast.error('Failed to generate expense report');
    } finally {
      setReportLoading(false);
    }
  };

  // Generate expense report Excel
  const handleGenerateReportExcel = async () => {
    setReportLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/expenses/report`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          start_date: reportDateRange.start_date,
          end_date: reportDateRange.end_date,
          format: 'excel'
        },
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expense-report-${reportDateRange.start_date}-to-${reportDateRange.end_date}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Excel report downloaded successfully!');
    } catch (error) {
      console.error('Failed to generate Excel report:', error);
      toast.error('Failed to generate Excel report');
    } finally {
      setReportLoading(false);
    }
  };

  // Load custom categories on mount
  useEffect(() => {
    loadCustomCategories();
  }, [loadCustomCategories]);

  // Calculate trend percentage
  const getTrendPercentage = () => {
    if (summary.trend.previous === 0) return 0;
    return ((summary.trend.current - summary.trend.previous) / summary.trend.previous * 100).toFixed(1);
  };

  const trendPercentage = getTrendPercentage();
  const isPositiveTrend = parseFloat(trendPercentage) > 0;

  return (
    <Layout user={user}>
      <div className="space-y-6">
        <TrialBanner />
        
        {/* Enhanced Header with Gradient Background */}
        <div className="relative overflow-hidden">
          <div className="bg-gradient-to-br from-red-600 via-orange-600 to-red-700 text-white rounded-2xl p-6 shadow-xl">
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                      <TrendingDown className="w-6 h-6" />
                    </div>
                    Expense Management
                  </h1>
                  <p className="text-red-100 mt-2">Track and manage your business expenses efficiently</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => setReportsDialogOpen(true)}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Reports
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => setCategoryDialogOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Category
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={handleExportCSV}
                    disabled={filteredExpenses.length === 0}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => loadExpensesOptimized()}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
              
              {/* Enhanced Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-white/10 backdrop-blur rounded-xl p-4 hover:bg-white/15 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">₹{summary.total.toLocaleString()}</div>
                      <div className="text-sm text-white/70">Total Expenses</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur rounded-xl p-4 hover:bg-white/15 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{summary.count}</div>
                      <div className="text-sm text-white/70">Transactions</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur rounded-xl p-4 hover:bg-white/15 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <PieChart className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{Object.keys(summary.by_category).length}</div>
                      <div className="text-sm text-white/70">Categories</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur rounded-xl p-4 hover:bg-white/15 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      {isPositiveTrend ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="text-2xl font-bold flex items-center gap-1">
                        {Math.abs(trendPercentage)}%
                        {isPositiveTrend ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      </div>
                      <div className="text-sm text-white/70">vs Last Period</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
          </div>
        </div>

        {/* Enhanced Filters */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
              {/* Search */}
              <div className="flex-1 min-w-[200px] relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input 
                  placeholder="Search expenses..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="pl-10 h-11" 
                />
              </div>
              
              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                <Select value={filterDateRange} onValueChange={setFilterDateRange}>
                  <SelectTrigger className="w-[150px] h-11">
                    <Calendar className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="quarter">This Quarter</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[180px] h-11">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {getAllCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={filterPaymentMethod} onValueChange={setFilterPaymentMethod}>
                  <SelectTrigger className="w-[160px] h-11">
                    <CreditCard className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Payment Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    {PAYMENT_METHODS.map(method => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Add Expense Button */}
              <Button 
                className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 h-11 px-6" 
                onClick={() => { resetForm(); setDialogOpen(true); }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Expense
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Expenses List */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-red-600" />
                Expenses ({filteredExpenses.length})
              </div>
              
              {/* View Mode Toggle */}
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <FileText className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <BarChart3 className="w-4 h-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <TrendingDown className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No expenses found</h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm || filterCategory !== 'all' || filterDateRange !== 'month' 
                    ? 'Try adjusting your filters to see more results'
                    : 'Add your first expense to start tracking your business costs'
                  }
                </p>
                <Button 
                  onClick={() => { resetForm(); setDialogOpen(true); }} 
                  className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Expense
                </Button>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
                {filteredExpenses.map(expense => {
                  const paymentInfo = getPaymentMethodInfo(expense.payment_method);
                  const PaymentIcon = paymentInfo.icon;
                  
                  return viewMode === 'grid' ? (
                    // Grid View
                    <Card key={expense.id} className={`hover:shadow-md transition-all duration-200 ${expense.isOptimistic ? 'opacity-70' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className={`w-10 h-10 ${paymentInfo.color} rounded-lg flex items-center justify-center text-white`}>
                            <PaymentIcon className="w-5 h-5" />
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-red-600">₹{expense.amount.toLocaleString()}</div>
                            <div className="text-xs text-gray-500">{expense.date}</div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-semibold text-gray-900 line-clamp-2">{expense.description}</h4>
                          <Badge className={getCategoryColor(expense.category)} variant="secondary">
                            {expense.category}
                          </Badge>
                          {expense.vendor_name && (
                            <p className="text-sm text-gray-600">{expense.vendor_name}</p>
                          )}
                        </div>
                        
                        <div className="flex gap-2 mt-4 pt-3 border-t">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(expense)} className="flex-1">
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(expense)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    // List View
                    <div key={expense.id} className={`flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors ${expense.isOptimistic ? 'opacity-70' : ''}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 ${paymentInfo.color} rounded-xl flex items-center justify-center text-white`}>
                          <PaymentIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{expense.description}</p>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span>{expense.date}</span>
                            {expense.vendor_name && (
                              <>
                                <span>•</span>
                                <span>{expense.vendor_name}</span>
                              </>
                            )}
                            <span>•</span>
                            <span>{paymentInfo.label}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <Badge className={getCategoryColor(expense.category)} variant="secondary">
                          {expense.category}
                        </Badge>
                        <span className="text-xl font-bold text-red-600">₹{expense.amount.toLocaleString()}</span>
                        
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(expense)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(expense)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Add/Edit Expense Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(open) => { 
          setDialogOpen(open); 
          if (!open) resetForm(); 
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg flex items-center justify-center text-white">
                  <TrendingDown className="w-4 h-4" />
                </div>
                {editingExpense ? 'Edit Expense' : 'Add New Expense'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Date and Amount */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Date *</Label>
                  <Input 
                    type="date" 
                    value={formData.date} 
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })} 
                    className={`mt-1 ${formErrors.date ? 'border-red-500' : ''}`}
                    required 
                  />
                  {formErrors.date && <p className="text-red-500 text-xs mt-1">{formErrors.date}</p>}
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Amount (₹) *</Label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    value={formData.amount} 
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })} 
                    className={`mt-1 ${formErrors.amount ? 'border-red-500' : ''}`}
                    required 
                    placeholder="0.00" 
                  />
                  {formErrors.amount && <p className="text-red-500 text-xs mt-1">{formErrors.amount}</p>}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Category *</Label>
                <div className="flex gap-2 mt-1">
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger className={`flex-1 ${formErrors.category ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAllCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCategoryDialogOpen(true)}
                    className="px-3"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {formErrors.category && <p className="text-red-500 text-xs mt-1">{formErrors.category}</p>}
              </div>

              {/* Description */}
              <div>
                <Label className="text-sm font-medium">Description *</Label>
                <Input 
                  value={formData.description} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                  className={`mt-1 ${formErrors.description ? 'border-red-500' : ''}`}
                  required 
                  placeholder="What was this expense for?" 
                />
                {formErrors.description && <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>}
              </div>

              {/* Payment Method and Vendor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Payment Method</Label>
                  <Select 
                    value={formData.payment_method} 
                    onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map(method => (
                        <SelectItem key={method.value} value={method.value}>
                          <div className="flex items-center gap-2">
                            <method.icon className="w-4 h-4" />
                            {method.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Vendor Name</Label>
                  <Input 
                    value={formData.vendor_name} 
                    onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })} 
                    className="mt-1"
                    placeholder="Optional" 
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label className="text-sm font-medium">Notes</Label>
                <Textarea 
                  value={formData.notes} 
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })} 
                  className="mt-1"
                  rows={3} 
                  placeholder="Additional notes..." 
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit" 
                  className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 h-11"
                  disabled={submitting}
                >
                  {submitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {editingExpense ? 'Updating...' : 'Adding...'}
                    </div>
                  ) : (
                    <>
                      {editingExpense ? <Edit className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                      {editingExpense ? 'Update' : 'Add'} Expense
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => { setDialogOpen(false); resetForm(); }}
                  className="h-11"
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Reports Dialog */}
        <Dialog open={reportsDialogOpen} onOpenChange={setReportsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg flex items-center justify-center text-white">
                  <FileText className="w-4 h-4" />
                </div>
                Expense Reports
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Date Range Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Start Date</Label>
                  <Input 
                    type="date" 
                    value={reportDateRange.start_date} 
                    onChange={(e) => setReportDateRange({ ...reportDateRange, start_date: e.target.value })} 
                    className="mt-1" 
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">End Date</Label>
                  <Input 
                    type="date" 
                    value={reportDateRange.end_date} 
                    onChange={(e) => setReportDateRange({ ...reportDateRange, end_date: e.target.value })} 
                    className="mt-1" 
                  />
                </div>
              </div>

              {/* Report Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={handleGenerateReportPDF}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">PDF Report</h3>
                      <p className="text-sm text-gray-600">Detailed expense report with charts</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={handleGenerateReportExcel}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Download className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Excel Export</h3>
                      <p className="text-sm text-gray-600">Spreadsheet format for analysis</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Report Preview Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">📊 Report Preview</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-blue-600 font-medium">Period:</span>
                    <p className="text-blue-800">{Math.ceil((new Date(reportDateRange.end_date) - new Date(reportDateRange.start_date)) / (1000 * 60 * 60 * 24))} days</p>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium">Total Expenses:</span>
                    <p className="text-blue-800">₹{summary.total.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium">Transactions:</span>
                    <p className="text-blue-800">{summary.count}</p>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium">Categories:</span>
                    <p className="text-blue-800">{Object.keys(summary.by_category).length}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={handleGenerateReportPDF}
                  className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 h-11"
                  disabled={reportLoading}
                >
                  {reportLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating...
                    </div>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Generate PDF Report
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setReportsDialogOpen(false)}
                  className="h-11"
                  disabled={reportLoading}
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Category Dialog */}
        <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center text-white">
                  <Plus className="w-4 h-4" />
                </div>
                Add New Category
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Category Name *</Label>
                <Input 
                  value={newCategoryName} 
                  onChange={(e) => setNewCategoryName(e.target.value)} 
                  className="mt-1"
                  placeholder="Enter category name" 
                  required
                />
              </div>

              {/* Existing Categories Preview */}
              <div>
                <Label className="text-sm font-medium text-gray-600">Existing Categories</Label>
                <div className="mt-2 flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {getAllCategories.map(cat => (
                    <Badge key={cat} variant="secondary" className="text-xs">
                      {cat}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit" 
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-11"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => { setCategoryDialogOpen(false); setNewCategoryName(''); }}
                  className="h-11"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default ExpensePage;