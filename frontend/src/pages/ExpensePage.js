import { useState, useEffect, useMemo } from 'react';
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
  Plus, DollarSign, Calendar, Filter, Download, RefreshCw,
  Edit, Trash2, Search, TrendingDown, PieChart, CreditCard,
  Wallet, Smartphone, Building, Receipt, FileText
} from 'lucide-react';

const EXPENSE_CATEGORIES = [
  "Rent", "Utilities", "Salaries", "Supplies", "Maintenance", 
  "Marketing", "Insurance", "Taxes", "Equipment", "Transportation",
  "Food & Ingredients", "Cleaning", "Licenses", "Professional Services", "Other"
];

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash', icon: Wallet },
  { value: 'card', label: 'Card', icon: CreditCard },
  { value: 'upi', label: 'UPI', icon: Smartphone },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: Building }
];

const ExpensePage = ({ user }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [summary, setSummary] = useState({ total: 0, count: 0, by_category: {}, by_payment_method: {} });
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    category: '',
    description: '',
    payment_method: 'cash',
    vendor_name: '',
    notes: ''
  });

  useEffect(() => {
    fetchExpenses();
    fetchSummary();
  }, [filterDateRange, startDate, endDate]);


  const getDateRange = () => {
    const today = new Date();
    let start, end;
    
    switch (filterDateRange) {
      case 'today':
        start = end = today.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 7);
        start = weekStart.toISOString().split('T')[0];
        end = today.toISOString().split('T')[0];
        break;
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        start = monthStart.toISOString().split('T')[0];
        end = today.toISOString().split('T')[0];
        break;
      case 'year':
        const yearStart = new Date(today.getFullYear(), 0, 1);
        start = yearStart.toISOString().split('T')[0];
        end = today.toISOString().split('T')[0];
        break;
      case 'custom':
        start = startDate;
        end = endDate;
        break;
      default:
        start = '';
        end = '';
    }
    
    return { start, end };
  };

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();
      const params = new URLSearchParams();
      if (start) params.append('start_date', start);
      if (end) params.append('end_date', end);
      if (filterCategory && filterCategory !== 'all') params.append('category', filterCategory);
      
      const response = await axios.get(`${API}/expenses?${params.toString()}`);
      setExpenses(response.data || []);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
      toast.error('Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const { start, end } = getDateRange();
      const params = new URLSearchParams();
      if (start) params.append('start_date', start);
      if (end) params.append('end_date', end);
      
      const response = await axios.get(`${API}/expenses/summary?${params.toString()}`);
      setSummary(response.data || { total: 0, count: 0, by_category: {}, by_payment_method: {} });
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Please enter a description');
      return;
    }
    
    try {
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount)
      };
      
      if (editingExpense) {
        await axios.put(`${API}/expenses/${editingExpense.id}`, submitData);
        toast.success('Expense updated!');
      } else {
        await axios.post(`${API}/expenses`, submitData);
        toast.success('Expense added!');
      }
      
      setDialogOpen(false);
      resetForm();
      fetchExpenses();
      fetchSummary();
    } catch (error) {
      console.error('Failed to save expense:', error);
      toast.error(error.response?.data?.detail || 'Failed to save expense');
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      date: expense.date,
      amount: expense.amount.toString(),
      category: expense.category,
      description: expense.description,
      payment_method: expense.payment_method || 'cash',
      vendor_name: expense.vendor_name || '',
      notes: expense.notes || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (expense) => {
    if (!window.confirm(`Delete expense: ${expense.description}?`)) return;
    
    try {
      await axios.delete(`${API}/expenses/${expense.id}`);
      toast.success('Expense deleted!');
      fetchExpenses();
      fetchSummary();
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };

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
    setEditingExpense(null);
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (expense.vendor_name && expense.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesSearch;
    });
  }, [expenses, searchTerm]);

  const handleExportCSV = () => {
    const csvContent = [
      ['Date', 'Category', 'Description', 'Amount', 'Payment Method', 'Vendor'],
      ...filteredExpenses.map(e => [
        e.date, e.category, e.description, e.amount, e.payment_method, e.vendor_name || ''
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Exported to CSV!');
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Rent': 'bg-red-100 text-red-700',
      'Utilities': 'bg-yellow-100 text-yellow-700',
      'Salaries': 'bg-blue-100 text-blue-700',
      'Supplies': 'bg-green-100 text-green-700',
      'Maintenance': 'bg-orange-100 text-orange-700',
      'Marketing': 'bg-purple-100 text-purple-700',
      'Food & Ingredients': 'bg-emerald-100 text-emerald-700',
      'Other': 'bg-gray-100 text-gray-700'
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  const getPaymentIcon = (method) => {
    const icons = { cash: Wallet, card: CreditCard, upi: Smartphone, bank_transfer: Building };
    return icons[method] || Wallet;
  };
