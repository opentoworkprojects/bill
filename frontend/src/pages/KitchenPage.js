import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { 
  Clock, CheckCircle, Printer, AlertTriangle, ChefHat, Timer, Bell,
  RefreshCw, Volume2, VolumeX, Filter, Flame, Eye, X, Play, Pause
} from 'lucide-react';

const KitchenPage = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [businessSettings, setBusinessSettings] = useState(null);
  const [stats, setStats] = useState({ pending: 0, preparing: 0, ready: 0 });
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchOrders();
    fetchBusinessSettings();
    const interval = autoRefresh ? setInterval(fetchOrders, 5000) : null;
    return () => interval && clearInterval(interval);
  }, [autoRefresh]);

  const fetchBusinessSettings = async () => {
    try {
      const response = await axios.get(`${API}/business/settings`);
      setBusinessSettings(response.data.business_settings);
    } catch (error) {
      console.error('Failed to fetch business settings', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API}/orders`);
      const activeOrders = response.data.filter(o => ['pending', 'preparing', 'ready'].includes(o.status));
      const sorted = activeOrders.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      
      // Check for new orders and play sound
      if (soundEnabled && orders.length > 0) {
        const newOrders = sorted.filter(o => o.status === 'pending' && !orders.find(old => old.id === o.id));
        if (newOrders.length > 0) playNotificationSound();
      }
      
      setOrders(sorted);
      setStats({
        pending: sorted.filter(o => o.status === 'pending').length,
        preparing: sorted.filter(o => o.status === 'preparing').length,
        ready: sorted.filter(o => o.status === 'ready').length
      });
    } catch (error) {
      console.error('Failed to fetch orders', error);
    }
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Onp6djHhxeYaRnZ2Ui3x0fIqWnpuPgXZ0gI2bnJaIe3V6h5OamZOGe3d8iZWZl5GEenh9i5aZlpCDeXl+jJeZlY+CeXl/jZeZlI6BeHmAjpeYk42Ad3mBj5eYko2AdnmCkJeXkYx/dnmDkZeXkIt+dnqEkpeWj4p9dXqFk5eVjol8dXuGlJeUjYh7dHuHlZeTjId6dHyIlpeSi4Z5dH2Jl5aRioV4dH6KmJaQiYR3dH+LmJWPiIN2dICMmZWOh4J1dIGNmZSNhoF0dIKOmpSMhYB0dIOPmpOLhH9zdISQm5KKg350dIWRm5GJgn1zdYaSm5CIgXxzdoeT');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (e) {}
  };

  const handleStatusChange = async (orderId, status) => {
    try {
      await axios.put(`${API}/orders/${orderId}/status?status=${status}`);
      toast.success(`Order ${status === 'preparing' ? 'started' : status === 'ready' ? 'ready for pickup' : 'completed'}!`);
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getTimeSince = (date) => {
    const minutes = Math.floor((new Date() - new Date(date)) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m ago`;
  };

  const getUrgencyLevel = (date) => {
    const minutes = Math.floor((new Date() - new Date(date)) / 60000);
    if (minutes > 20) return 'critical';
    if (minutes > 10) return 'warning';
    return 'normal';
  };

  const printKOT = (order) => {
    const width = 48;
    const sep = '='.repeat(width);
    const dash = '-'.repeat(width);
    
    let kot = `${sep}\n`;
    kot += '*** KITCHEN ORDER TICKET ***'.padStart((width + 28) / 2).padEnd(width) + '\n';
    kot += `${sep}\n\n`;
    kot += `ORDER #: ${order.id.slice(0, 8).toUpperCase()}\n`;
    kot += `TABLE: ${order.table_number}\n`;
    kot += `SERVER: ${order.waiter_name}\n`;
    kot += `TIME: ${new Date(order.created_at).toLocaleTimeString()}\n`;
    kot += `\n${dash}\nITEMS TO PREPARE:\n${dash}\n\n`;
    
    order.items.forEach(item => {
      kot += `>>> ${item.quantity}x ${item.name.toUpperCase()} <<<\n`;
      if (item.notes) kot += `    *** ${item.notes} ***\n`;
      kot += '\n';
    });
    
    kot += `${dash}\nTOTAL ITEMS: ${order.items.reduce((sum, i) => sum + i.quantity, 0)}\n${sep}`;

    const printWindow = window.open('', '', 'width=400,height=600');
    printWindow.document.write(`
      <html><head><title>KOT - Table ${order.table_number}</title>
      <style>
        @media print { @page { size: 80mm auto; margin: 0; } body { margin: 0; } .no-print { display: none; } }
        body { font-family: 'Courier New', monospace; font-size: 14px; padding: 10px; width: 80mm; }
        pre { margin: 0; white-space: pre-wrap; }
        .no-print { text-align: center; margin: 20px 0; }
        .btn { padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; margin: 5px; }
        .btn-print { background: linear-gradient(135deg, #f97316, #ea580c); color: white; }
        .btn-close { background: #6b7280; color: white; }
      </style></head><body>
      <pre>${kot}</pre>
      <div class="no-print">
        <button class="btn btn-print" onclick="window.print()">🖨️ Print KOT</button>
        <button class="btn btn-close" onclick="window.close()">✕ Close</button>
      </div></body></html>
    `);
    printWindow.document.close();
    toast.success('KOT ready for printing!');
  };
