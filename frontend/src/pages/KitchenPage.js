import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import {
  Clock, CheckCircle, Printer, AlertTriangle, ChefHat, Timer, Bell,
  RefreshCw, Volume2, VolumeX, Flame, Eye, X, Play,
  Maximize, Minimize, Utensils, Coffee, AlertCircle, Grid3X3, List, Zap
} from 'lucide-react';
import { printKOT as printKOTUtil } from '../utils/printUtils';

const KitchenPage = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [businessSettings, setBusinessSettings] = useState(null);
  const [stats, setStats] = useState({ pending: 0, preparing: 0, ready: 0 });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchBusinessSettings();
    const interval = autoRefresh ? setInterval(fetchOrders, 5000) : null;
    // Update clock every second
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      interval && clearInterval(interval);
      clearInterval(clockInterval);
    };
  }, [autoRefresh]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

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

  // Manual refresh with animation
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchOrders();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const getUrgencyLevel = (date) => {
    const minutes = Math.floor((new Date() - new Date(date)) / 60000);
    if (minutes > 20) return 'critical';
    if (minutes > 10) return 'warning';
    return 'normal';
  };

  // Format wait time in a readable way
  const formatWaitTime = (date) => {
    const totalMinutes = Math.floor((new Date() - new Date(date)) / 60000);
    if (totalMinutes < 0) return '0m';
    if (totalMinutes < 60) return `${totalMinutes}m`;
    if (totalMinutes < 1440) { // Less than 24 hours
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`;
    }
    // More than 24 hours - show days
    const days = Math.floor(totalMinutes / 1440);
    return `${days}d+`;
  };

  const printKOT = (order) => {
    try {
      // Use centralized print utility with global settings
      printKOTUtil(order, businessSettings);
      toast.success('KOT ready for printing!');
    } catch (error) {
      console.error('Failed to print KOT:', error);
      toast.error('Failed to print KOT');
    }
  };

  const filteredOrders = orders.filter(o => filter === 'all' || o.status === filter);

  // Calculate enhanced wait time stats
  const waitTimeStats = (() => {
    if (orders.length === 0) return { avg: 0, min: 0, max: 0, oldest: null, status: 'good' };
    
    const waitTimes = orders.map(o => Math.floor((new Date() - new Date(o.created_at)) / 60000));
    const avg = Math.round(waitTimes.reduce((sum, t) => sum + t, 0) / waitTimes.length);
    const min = Math.min(...waitTimes);
    const max = Math.max(...waitTimes);
    const oldestOrder = orders.reduce((oldest, o) => 
      new Date(o.created_at) < new Date(oldest.created_at) ? o : oldest
    , orders[0]);
    
    // Determine status based on avg wait time
    let status = 'good'; // green - under 10 min
    if (avg > 20) status = 'critical'; // red - over 20 min
    else if (avg > 10) status = 'warning'; // orange - 10-20 min
    
    return { avg, min, max, oldest: oldestOrder, status };
  })();

  // Format time for display
  const formatTimeDisplay = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const OrderCard = ({ order }) => {
    const urgency = getUrgencyLevel(order.created_at);
    const waitTime = formatWaitTime(order.created_at);
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const minSwipeDistance = 50;

    const onTouchStart = (e) => {
      setTouchEnd(null);
      setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

    const onTouchEnd = () => {
      if (!touchStart || !touchEnd) return;
      const distance = touchStart - touchEnd;
      const isLeftSwipe = distance > minSwipeDistance;
      const isRightSwipe = distance < -minSwipeDistance;
      
      // Swipe left to advance status
      if (isLeftSwipe) {
        if (order.status === 'pending') handleStatusChange(order.id, 'preparing');
        else if (order.status === 'preparing') handleStatusChange(order.id, 'ready');
        else if (order.status === 'ready') handleStatusChange(order.id, 'completed');
      }
      // Swipe right to view details
      if (isRightSwipe) {
        setSelectedOrder(order);
      }
    };

    const urgencyStyles = {
      critical: {
        border: 'border-l-red-500',
        bg: 'bg-gradient-to-br from-red-50 to-red-100',
        pulse: 'animate-pulse',
        badge: 'bg-red-600 text-white',
        icon: <AlertCircle className="w-4 h-4 text-red-600" />
      },
      warning: {
        border: 'border-l-orange-500',
        bg: 'bg-gradient-to-br from-orange-50 to-amber-50',
        pulse: '',
        badge: 'bg-orange-500 text-white',
        icon: <AlertTriangle className="w-4 h-4 text-orange-500" />
      },
      normal: {
        border: order.status === 'pending' ? 'border-l-yellow-500' : order.status === 'preparing' ? 'border-l-blue-500' : 'border-l-green-500',
        bg: order.status === 'pending' ? 'bg-yellow-50' : order.status === 'preparing' ? 'bg-blue-50' : 'bg-green-50',
        pulse: '',
        badge: order.status === 'pending' ? 'bg-yellow-500 text-white' : order.status === 'preparing' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white',
        icon: null
      }
    };

    const style = urgencyStyles[urgency];

    // Get next action text for swipe hint
    const getNextAction = () => {
      if (order.status === 'pending') return 'Start';
      if (order.status === 'preparing') return 'Ready';
      if (order.status === 'ready') return 'Served';
      return '';
    };

    return (
      <Card 
        className={`border-0 shadow-lg border-l-4 ${style.border} ${style.bg} ${style.pulse} transition-all overflow-hidden w-full max-w-full touch-pan-y`}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <CardHeader className="pb-2 px-3 sm:px-4 pt-3">
          <div className="flex justify-between items-start gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
              <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${order.status === 'pending' ? 'bg-yellow-200' : order.status === 'preparing' ? 'bg-blue-200' : 'bg-green-200'}`}>
                <ChefHat className={`w-5 h-5 sm:w-7 sm:h-7 ${order.status === 'pending' ? 'text-yellow-700' : order.status === 'preparing' ? 'text-blue-700' : 'text-green-700'}`} />
              </div>
              <div className="min-w-0 flex-1 overflow-hidden">
                <CardTitle className="text-base sm:text-xl font-black tracking-tight truncate">
                  Table #{order.table_number}
                </CardTitle>
                <p className="text-[10px] sm:text-xs text-gray-500 font-mono truncate">#{order.id.slice(0, 8).toUpperCase()}</p>
              </div>
            </div>
            <div className="flex flex-col items-end flex-shrink-0">
              <span className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase whitespace-nowrap ${style.badge}`}>
                {order.status}
              </span>
              <div className={`mt-1 flex items-center gap-1 whitespace-nowrap ${urgency === 'critical' ? 'text-red-600' : urgency === 'warning' ? 'text-orange-600' : 'text-gray-500'}`}>
                {style.icon}
                <span className={`text-sm sm:text-base font-bold ${urgency === 'critical' ? 'animate-pulse' : ''}`}>
                  {waitTime}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 px-3 sm:px-4 pb-3">
          {/* Order Type Badge */}
          {order.order_type && (
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold ${
              order.order_type === 'dine_in' ? 'bg-blue-100 text-blue-800' :
              order.order_type === 'takeaway' ? 'bg-purple-100 text-purple-800' :
              'bg-pink-100 text-pink-800'
            }`}>
              {order.order_type === 'dine_in' && <><Utensils className="w-3 h-3" /> Dine In</>}
              {order.order_type === 'takeaway' && <><Coffee className="w-3 h-3" /> Takeaway</>}
              {order.order_type === 'delivery' && <><Bell className="w-3 h-3" /> Delivery</>}
            </div>
          )}

          {/* Items List - Compact on mobile */}
          <div className="space-y-1 max-h-[30vh] overflow-y-auto">
            {order.items.map((item, idx) => (
              <div key={idx} className={`p-1.5 sm:p-2 rounded-lg ${urgency === 'critical' ? 'bg-red-100 border border-red-200' : 'bg-white/70'} border border-gray-100`}>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-violet-600 text-white text-[10px] sm:text-xs font-bold flex-shrink-0">
                    {item.quantity}
                  </span>
                  <span className="font-semibold text-xs sm:text-sm text-gray-900 truncate flex-1">{item.name}</span>
                </div>
                {item.notes && (
                  <div className="mt-1 flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] sm:text-xs">
                    <Flame className="w-2.5 h-2.5 flex-shrink-0" />
                    <span className="font-medium truncate">{item.notes}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Total Items Count */}
          <div className="flex items-center justify-between pt-1.5 border-t border-gray-200">
            <span className="text-gray-600 font-medium text-[10px] sm:text-xs">Total Items:</span>
            <span className="text-base sm:text-lg font-black text-violet-600">
              {order.items.reduce((sum, i) => sum + i.quantity, 0)}
            </span>
          </div>

          {/* Action Buttons - Touch optimized */}
          <div className="flex gap-1.5 sm:gap-2 pt-1">
            {order.status === 'pending' && (
              <Button
                onClick={() => handleStatusChange(order.id, 'preparing')}
                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 h-11 sm:h-12 text-xs sm:text-sm font-bold active:scale-95 transition-transform"
              >
                <Play className="w-4 h-4 mr-1" /> START
              </Button>
            )}
            {order.status === 'preparing' && (
              <Button
                onClick={() => handleStatusChange(order.id, 'ready')}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 h-11 sm:h-12 text-xs sm:text-sm font-bold active:scale-95 transition-transform"
              >
                <CheckCircle className="w-4 h-4 mr-1" /> READY
              </Button>
            )}
            {order.status === 'ready' && (
              <Button
                onClick={() => handleStatusChange(order.id, 'completed')}
                className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 h-11 sm:h-12 text-xs sm:text-sm font-bold active:scale-95 transition-transform"
              >
                <CheckCircle className="w-4 h-4 mr-1" /> SERVED
              </Button>
            )}
            <Button variant="outline" onClick={() => printKOT(order)} className="h-11 sm:h-12 px-3 border active:scale-95 transition-transform">
              <Printer className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={() => setSelectedOrder(order)} className="h-11 sm:h-12 px-3 border active:scale-95 transition-transform">
              <Eye className="w-4 h-4" />
            </Button>
          </div>

          {/* Swipe hint - Mobile only */}
          <p className="text-[9px] text-gray-400 text-center sm:hidden">
            ← Swipe left to {getNextAction()} • Swipe right to view →
          </p>
        </CardContent>
      </Card>
    );
  };

  return (
    <Layout user={user}>
      <div className={`space-y-4 sm:space-y-6 overflow-x-hidden ${isFullscreen ? 'p-4 sm:p-6 bg-gray-900 min-h-screen' : ''}`} data-testid="kitchen-page">
        {/* Header - Mobile Responsive */}
        <div className={`flex flex-col gap-4 ${isFullscreen ? 'text-white' : ''}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className={`p-2 sm:p-4 rounded-xl sm:rounded-2xl ${isFullscreen ? 'bg-orange-600' : 'bg-gradient-to-br from-orange-500 to-red-500'} shadow-lg`}>
                <ChefHat className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
              </div>
              <div>
                <h1 className={`text-2xl sm:text-4xl font-black tracking-tight ${isFullscreen ? 'text-white' : ''}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Kitchen Display
                </h1>
                <p className={`text-xs sm:text-base mt-0.5 sm:mt-1 ${isFullscreen ? 'text-gray-400' : 'text-gray-600'}`}>
                  {currentTime.toLocaleTimeString()}
                </p>
              </div>
            </div>
            {/* Mobile Quick Actions */}
            <div className="flex items-center gap-1.5 sm:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 ${soundEnabled ? 'text-green-600' : 'text-gray-400'}`}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2"
              >
                {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
              </Button>
              <Button
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`p-2 ${autoRefresh ? "bg-green-600 hover:bg-green-700" : ""}`}
              >
                <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
                className={`p-2 ${isFullscreen ? 'border-gray-700 text-white hover:bg-gray-800 bg-violet-600' : 'bg-violet-100 border-violet-300 text-violet-700'}`}
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          
          {/* Desktop Controls */}
          <div className="hidden sm:flex items-center gap-3 flex-wrap">
            {/* View Mode Toggle */}
            <div className={`flex rounded-lg overflow-hidden border ${isFullscreen ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 text-sm font-medium transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-violet-600 text-white' 
                    : isFullscreen ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 text-sm font-medium transition-all ${
                  viewMode === 'list' 
                    ? 'bg-violet-600 text-white' 
                    : isFullscreen ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                List
              </button>
            </div>
            <Button 
              variant={autoRefresh ? "default" : "outline"} 
              onClick={() => setAutoRefresh(!autoRefresh)} 
              className={autoRefresh ? "bg-green-600 hover:bg-green-700" : ""}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'Live' : 'Paused'}
            </Button>
            <Button variant="outline" onClick={() => setSoundEnabled(!soundEnabled)} className={isFullscreen ? 'border-gray-700 text-white hover:bg-gray-800' : ''}>
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
            <Button variant="outline" onClick={fetchOrders} className={isFullscreen ? 'border-gray-700 text-white hover:bg-gray-800' : ''}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              onClick={toggleFullscreen}
              className={`${isFullscreen ? 'border-gray-700 text-white hover:bg-gray-800 bg-violet-600' : 'bg-violet-100 border-violet-300 text-violet-700 hover:bg-violet-200'}`}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Quick Stats Summary - Mobile Only */}
        <div className={`flex sm:hidden items-center justify-between px-2 py-2 rounded-lg ${
          waitTimeStats.status === 'critical' ? 'bg-gradient-to-r from-red-50 to-red-100' :
          waitTimeStats.status === 'warning' ? 'bg-gradient-to-r from-orange-50 to-amber-50' :
          'bg-gradient-to-r from-violet-50 to-purple-50'
        }`}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              <span className="text-xs font-bold">{stats.pending}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-xs font-bold">{stats.preparing}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs font-bold">{stats.ready}</span>
            </div>
            <div className="h-4 w-px bg-gray-300 mx-1"></div>
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
              waitTimeStats.status === 'critical' ? 'bg-red-500 text-white animate-pulse' :
              waitTimeStats.status === 'warning' ? 'bg-orange-500 text-white' :
              'bg-violet-500 text-white'
            }`}>
              <Clock className="w-3 h-3" />
              <span>{waitTimeStats.avg}m avg</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleManualRefresh}
            className="p-1.5 h-auto"
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-violet-600' : 'text-gray-500'}`} />
          </Button>
        </div>

        {/* Stats Bar - Desktop */}
        <div className="hidden sm:grid grid-cols-4 gap-4">
          <Card className={`border-0 shadow-lg bg-gradient-to-br from-yellow-500 to-orange-500 text-white ${stats.pending > 0 ? 'ring-2 ring-yellow-300 ring-opacity-50' : ''}`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">Pending</p>
                <p className="text-5xl font-black">{stats.pending}</p>
              </div>
              <Bell className={`w-14 h-14 opacity-50 ${stats.pending > 0 ? 'animate-bounce' : ''}`} />
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Preparing</p>
                <p className="text-5xl font-black">{stats.preparing}</p>
              </div>
              <Timer className="w-14 h-14 opacity-50" />
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-500 text-white">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Ready</p>
                <p className="text-5xl font-black">{stats.ready}</p>
              </div>
              <CheckCircle className="w-14 h-14 opacity-50" />
            </CardContent>
          </Card>
          <Card className={`border-0 shadow-lg ${
            waitTimeStats.status === 'critical' ? 'bg-gradient-to-br from-red-500 to-red-600 ring-2 ring-red-300 animate-pulse' :
            waitTimeStats.status === 'warning' ? 'bg-gradient-to-br from-orange-500 to-amber-500' :
            isFullscreen ? 'bg-gray-800' : 'bg-gradient-to-br from-violet-500 to-purple-500'
          } text-white`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${
                  waitTimeStats.status === 'critical' ? 'text-red-100' :
                  waitTimeStats.status === 'warning' ? 'text-orange-100' :
                  isFullscreen ? 'text-gray-400' : 'text-violet-100'
                }`}>
                  Avg Wait {waitTimeStats.status === 'critical' && '⚠️'}
                </p>
                <p className="text-5xl font-black">{waitTimeStats.avg}<span className="text-2xl">m</span></p>
                <div className="flex gap-2 mt-1 text-xs opacity-80">
                  <span>Min: {waitTimeStats.min}m</span>
                  <span>•</span>
                  <span>Max: {waitTimeStats.max}m</span>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <Clock className={`w-10 h-10 opacity-50 ${waitTimeStats.status === 'critical' ? 'animate-bounce' : ''}`} />
                {waitTimeStats.status === 'good' && <span className="text-xs mt-1 bg-white/20 px-2 py-0.5 rounded-full">On Track</span>}
                {waitTimeStats.status === 'warning' && <span className="text-xs mt-1 bg-white/20 px-2 py-0.5 rounded-full">Slow</span>}
                {waitTimeStats.status === 'critical' && <span className="text-xs mt-1 bg-white/20 px-2 py-0.5 rounded-full">Behind</span>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs - Mobile Optimized */}
        <div className={`flex gap-1 p-1 rounded-xl overflow-x-auto scrollbar-hide ${isFullscreen ? 'bg-gray-800' : 'bg-gray-100'}`}>
          {[
            { id: 'all', label: 'All', count: orders.length, color: 'violet', icon: <Zap className="w-3.5 h-3.5" /> },
            { id: 'pending', label: 'Pending', count: stats.pending, color: 'yellow', icon: <Bell className="w-3.5 h-3.5" /> },
            { id: 'preparing', label: 'Cooking', count: stats.preparing, color: 'blue', icon: <Timer className="w-3.5 h-3.5" /> },
            { id: 'ready', label: 'Ready', count: stats.ready, color: 'green', icon: <CheckCircle className="w-3.5 h-3.5" /> },
          ].map(tab => (
            <button key={tab.id} onClick={() => setFilter(tab.id)}
              className={`flex-1 min-w-[70px] px-2 sm:px-4 py-2.5 sm:py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1 sm:gap-2 whitespace-nowrap text-xs sm:text-sm active:scale-95 ${
                filter === tab.id
                  ? `bg-${tab.color}-600 text-white shadow-lg`
                  : isFullscreen ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-white'
              }`}>
              <span className="hidden sm:inline">{tab.icon}</span>
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black ${
                filter === tab.id ? 'bg-white/20' : isFullscreen ? 'bg-gray-700' : 'bg-gray-200'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Orders Grid/List - Mobile Responsive */}
        <div className={`${
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4' 
            : 'flex flex-col gap-3'
        } overflow-hidden`}>
          {filteredOrders.map(order => <OrderCard key={order.id} order={order} />)}
          {filteredOrders.length === 0 && (
            <div className={`col-span-full text-center py-12 sm:py-20 ${isFullscreen ? 'text-gray-500' : ''}`}>
              <div className={`w-16 h-16 sm:w-24 sm:h-24 mx-auto rounded-full flex items-center justify-center mb-4 sm:mb-6 ${isFullscreen ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <ChefHat className={`w-8 h-8 sm:w-12 sm:h-12 ${isFullscreen ? 'text-gray-600' : 'text-gray-300'}`} />
              </div>
              <p className={`text-xl sm:text-2xl font-bold ${isFullscreen ? 'text-gray-400' : 'text-gray-500'}`}>
                No {filter === 'all' ? 'active' : filter} orders
              </p>
              <p className={`mt-2 text-sm sm:text-base ${isFullscreen ? 'text-gray-600' : 'text-gray-400'}`}>
                Orders will appear here automatically
              </p>
            </div>
          )}
        </div>

        {/* Order Detail Modal - Mobile Responsive */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={() => setSelectedOrder(null)}>
            <Card className="w-full sm:max-w-lg border-0 shadow-2xl rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-white z-10 border-b">
                <CardTitle className="text-lg sm:text-xl">Order - Table #{selectedOrder.table_number}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(null)}><X className="w-4 h-4" /></Button>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-6">
                <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm">
                  <div><p className="text-gray-500 text-xs sm:text-sm">Order ID</p><p className="font-mono font-bold text-sm sm:text-base">#{selectedOrder.id.slice(0, 8)}</p></div>
                  <div><p className="text-gray-500 text-xs sm:text-sm">Server</p><p className="font-bold text-sm sm:text-base">{selectedOrder.waiter_name}</p></div>
                  <div><p className="text-gray-500 text-xs sm:text-sm">Customer</p><p className="font-bold text-sm sm:text-base">{selectedOrder.customer_name || 'Walk-in'}</p></div>
                  <div><p className="text-gray-500 text-xs sm:text-sm">Time</p><p className="font-bold text-sm sm:text-base">{new Date(selectedOrder.created_at).toLocaleString()}</p></div>
                </div>
                <div className="border-t pt-4">
                  <p className="font-bold mb-2">Items ({selectedOrder.items.length})</p>
                  <div className="max-h-[30vh] overflow-y-auto">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between py-2 border-b last:border-0">
                        <span className="font-medium">{item.quantity}× {item.name}</span>
                        {item.notes && <span className="text-orange-600 text-sm">{item.notes}</span>}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={() => printKOT(selectedOrder)} className="flex-1 bg-orange-500 hover:bg-orange-600">
                    <Printer className="w-4 h-4 mr-2" /> Print KOT
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedOrder(null)}>Close</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default KitchenPage;
