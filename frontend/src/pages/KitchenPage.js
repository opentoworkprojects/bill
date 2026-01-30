import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import {
  Clock, CheckCircle, Printer, AlertTriangle, ChefHat, Timer, Bell,
  RefreshCw, Volume2, VolumeX, Flame, Eye, X, Play,
  Maximize, Minimize, Utensils, Coffee, AlertCircle, Grid3X3, List, Zap, Truck,
  Phone, Vibrate, Settings, Speaker
} from 'lucide-react';
import { printKOT as printKOTUtil } from '../utils/printUtils';

const KitchenPage = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [phoneRingEnabled, setPhoneRingEnabled] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [businessSettings, setBusinessSettings] = useState(null);
  const [stats, setStats] = useState({ pending: 0, preparing: 0, ready: 0 });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingOrders, setProcessingOrders] = useState(new Set());
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    sound: true,
    vibration: true,
    phoneRing: true,
    volume: 0.8
  });
  
  // Audio refs for different sounds
  const newOrderAudioRef = useRef(null);
  const buttonClickAudioRef = useRef(null);
  const phoneRingAudioRef = useRef(null);
  const successAudioRef = useRef(null);

  useEffect(() => {
    fetchOrders();
    fetchBusinessSettings();
    initializeAudioElements();
    
    const interval = autoRefresh ? setInterval(() => {
      // COMPLETELY BLOCK polling if there are status changes in progress
      if (processingOrders.size > 0) {
        console.log('⏸️ Kitchen: BLOCKING polling - status changes in progress:', Array.from(processingOrders));
        return;
      }
      
      // Extended interaction blocking for kitchen page
      const lastInteraction = localStorage.getItem('lastUserInteraction');
      if (lastInteraction && (Date.now() - parseInt(lastInteraction)) < 3000) {
        console.log('⏸️ Kitchen: BLOCKING polling - recent user interaction');
        return;
      }
      
      fetchOrders();
    }, 4000) : null; // Increased to 4 seconds for kitchen stability
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    
    return () => {
      interval && clearInterval(interval);
      clearInterval(clockInterval);
    };
  }, [autoRefresh]);

  // Initialize audio elements for different notification sounds
  const initializeAudioElements = () => {
    try {
      // New order notification sound (kitchen bell) - using a more reliable base64 audio
      const kitchenBellSound = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Onp6djHhxeYaRnZ2Ui3x0fIqWnpuPgXZ0gI2bnJaIe3V6h5OamZOGe3d8iZWZl5GEenh9i5aZlpCDeXl+jJeZlY+CeXl/jZeZlI6BeHmAjpeYk42Ad3mBj5eYko2AdnmCkJeXkYx/dnmDkZeXkIt+dnqEkpeWj4p9dXqFk5eVjol8dXuGlJeUjYh7dHuHlZeTjId6dHyIlpeSi4Z5dH2Jl5aRioV4dH6KmJaQiYR3dH+LmJWPiIN2dICMmZWOh4J1dIGNmZSNhoF0dIKOmpSMhYB0dIOPmpOLhH9zdISQm5KKg350dIWRm5GJgn1zdYaSm5CIgXxzdoeT';
      newOrderAudioRef.current = new Audio(kitchenBellSound);
      newOrderAudioRef.current.volume = notificationSettings.volume;
      newOrderAudioRef.current.preload = 'auto';
      
      // Button click sound (short beep)
      const clickSound = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Onp6djHhxeYaRnZ2Ui3x0fIqWnpuPgXZ0gI2bnJaIe3V6h5OamZOGe3d8iZWZl5GEenh9i5aZlpCDeXl+jJeZlY+CeXl/jZeZlI6BeHmAjpeYk42Ad3mBj5eYko2AdnmCkJeXkYx/dnmDkZeXkIt+dnqEkpeWj4p9dXqFk5eVjol8dXuGlJeUjYh7dHuHlZeTjId6dHyIlpeSi4Z5dH2Jl5aRioV4dH6KmJaQiYR3dH+LmJWPiIN2dICMmZWOh4J1dIGNmZSNhoF0dIKOmpSMhYB0dIOPmpOLhH9zdISQm5KKg350dIWRm5GJgn1zdYaSm5CIgXxzdoeT';
      buttonClickAudioRef.current = new Audio(clickSound);
      buttonClickAudioRef.current.volume = 0.3;
      buttonClickAudioRef.current.preload = 'auto';
      
      // Phone ring sound (longer, more urgent) - Create a synthetic ring tone
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const createRingTone = () => {
        const duration = 0.5;
        const sampleRate = audioContext.sampleRate;
        const buffer = audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < buffer.length; i++) {
          const t = i / sampleRate;
          // Create a ring tone with two frequencies
          data[i] = Math.sin(2 * Math.PI * 800 * t) * 0.3 + Math.sin(2 * Math.PI * 1000 * t) * 0.3;
          // Add envelope
          data[i] *= Math.exp(-t * 2);
        }
        return buffer;
      };
      
      // Create phone ring audio element
      phoneRingAudioRef.current = new Audio();
      phoneRingAudioRef.current.volume = notificationSettings.volume;
      phoneRingAudioRef.current.loop = false; // We'll handle looping manually
      
      // Use a more reliable ring sound
      const ringSound = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Onp6djHhxeYaRnZ2Ui3x0fIqWnpuPgXZ0gI2bnJaIe3V6h5OamZOGe3d8iZWZl5GEenh9i5aZlpCDeXl+jJeZlY+CeXl/jZeZlI6BeHmAjpeYk42Ad3mBj5eYko2AdnmCkJeXkYx/dnmDkZeXkIt+dnqEkpeWj4p9dXqFk5eVjol8dXuGlJeUjYh7dHuHlZeTjId6dHyIlpeSi4Z5dH2Jl5aRioV4dH6KmJaQiYR3dH+LmJWPiIN2dICMmZWOh4J1dIGNmZSNhoF0dIKOmpSMhYB0dIOPmpOLhH9zdISQm5KKg350dIWRm5GJgn1zdYaSm5CIgXxzdoeT';
      phoneRingAudioRef.current.src = ringSound;
      
      // Success sound (ding)
      const successSound = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Onp6djHhxeYaRnZ2Ui3x0fIqWnpuPgXZ0gI2bnJaIe3V6h5OamZOGe3d8iZWZl5GEenh9i5aZlpCDeXl+jJeZlY+CeXl/jZeZlI6BeHmAjpeYk42Ad3mBj5eYko2AdnmCkJeXkYx/dnmDkZeXkIt+dnqEkpeWj4p9dXqFk5eVjol8dXuGlJeUjYh7dHuHlZeTjId6dHyIlpeSi4Z5dH2Jl5aRioV4dH6KmJaQiYR3dH+LmJWPiIN2dICMmZWOh4J1dIGNmZSNhoF0dIKOmpSMhYB0dIOPmpOLhH9zdISQm5KKg350dIWRm5GJgn1zdYaSm5CIgXxzdoeT';
      successAudioRef.current = new Audio(successSound);
      successAudioRef.current.volume = 0.5;
      successAudioRef.current.preload = 'auto';
      
      console.log('🔊 Audio elements initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize audio elements:', error);
      // Fallback to simple beep sounds
      try {
        newOrderAudioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Onp6djHhxeYaRnZ2Ui3x0fIqWnpuPgXZ0gI2bnJaIe3V6h5OamZOGe3d8iZWZl5GEenh9i5aZlpCDeXl+jJeZlY+CeXl/jZeZlI6BeHmAjpeYk42Ad3mBj5eYko2AdnmCkJeXkYx/dnmDkZeXkIt+dnqEkpeWj4p9dXqFk5eVjol8dXuGlJeUjYh7dHuHlZeTjId6dHyIlpeSi4Z5dH2Jl5aRioV4dH6KmJaQiYR3dH+LmJWPiIN2dICMmZWOh4J1dIGNmZSNhoF0dIKOmpSMhYB0dIOPmpOLhH9zdISQm5KKg350dIWRm5GJgn1zdYaSm5CIgXxzdoeT');
        buttonClickAudioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Onp6djHhxeYaRnZ2Ui3x0fIqWnpuPgXZ0gI2bnJaIe3V6h5OamZOGe3d8iZWZl5GEenh9i5aZlpCDeXl+jJeZlY+CeXl/jZeZlI6BeHmAjpeYk42Ad3mBj5eYko2AdnmCkJeXkYx/dnmDkZeXkIt+dnqEkpeWj4p9dXqFk5eVjol8dXuGlJeUjYh7dHuHlZeTjId6dHyIlpeSi4Z5dH2Jl5aRioV4dH6KmJaQiYR3dH+LmJWPiIN2dICMmZWOh4J1dIGNmZSNhoF0dIKOmpSMhYB0dIOPmpOLhH9zdISQm5KKg350dIWRm5GJgn1zdYaSm5CIgXxzdoeT');
        phoneRingAudioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Onp6djHhxeYaRnZ2Ui3x0fIqWnpuPgXZ0gI2bnJaIe3V6h5OamZOGe3d8iZWZl5GEenh9i5aZlpCDeXl+jJeZlY+CeXl/jZeZlI6BeHmAjpeYk42Ad3mBj5eYko2AdnmCkJeXkYx/dnmDkZeXkIt+dnqEkpeWj4p9dXqFk5eVjol8dXuGlJeUjYh7dHuHlZeTjId6dHyIlpeSi4Z5dH2Jl5aRioV4dH6KmJaQiYR3dH+LmJWPiIN2dICMmZWOh4J1dIGNmZSNhoF0dIKOmpSMhYB0dIOPmpOLhH9zdISQm5KKg350dIWRm5GJgn1zdYaSm5CIgXxzdoeT');
        successAudioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Onp6djHhxeYaRnZ2Ui3x0fIqWnpuPgXZ0gI2bnJaIe3V6h5OamZOGe3d8iZWZl5GEenh9i5aZlpCDeXl+jJeZlY+CeXl/jZeZlI6BeHmAjpeYk42Ad3mBj5eYko2AdnmCkJeXkYx/dnmDkZeXkIt+dnqEkpeWj4p9dXqFk5eVjol8dXuGlJeUjYh7dHuHlZeTjId6dHyIlpeSi4Z5dH2Jl5aRioV4dH6KmJaQiYR3dH+LmJWPiIN2dICMmZWOh4J1dIGNmZSNhoF0dIKOmpSMhYB0dIOPmpOLhH9zdISQm5KKg350dIWRm5GJgn1zdYaSm5CIgXxzdoeT');
        console.log('🔊 Fallback audio elements initialized');
      } catch (fallbackError) {
        console.error('❌ Even fallback audio initialization failed:', fallbackError);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
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
      const activeOrders = response.data.filter(o => {
        // Include pending, preparing, ready orders
        if (['pending', 'preparing', 'ready'].includes(o.status)) {
          return true;
        }
        
        // Also include recently completed orders (within last 30 seconds) for smooth transition
        if (o.status === 'completed') {
          const completedTime = new Date(o.updated_at || o.created_at);
          const now = new Date();
          const timeDiff = (now - completedTime) / 1000; // seconds
          return timeDiff <= 30; // Show completed orders for 30 seconds
        }
        
        return false;
      });
      
      const sorted = activeOrders.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      
      // 🚀 ULTRA-STRICT MERGE: Preserve optimistic updates and UI locks for kitchen
      setOrders(prevOrders => {
        // Get orders with optimistic updates or UI locks (status changes in progress)
        const lockedOrders = prevOrders.filter(order => order.optimistic_update || order.ui_locked);
        const lockedOrderIds = new Set(lockedOrders.map(order => order.id));
        
        // Get server orders that don't have optimistic updates or UI locks
        const nonLockedServerOrders = sorted.filter(order => !lockedOrderIds.has(order.id));
        
        // Merge: locked orders take absolute precedence over server data
        const mergedOrders = [...lockedOrders, ...nonLockedServerOrders];
        
        // Check for new orders and trigger notifications (only for non-locked orders)
        if (prevOrders.length > 0) {
          const newOrders = nonLockedServerOrders.filter(o => 
            o.status === 'pending' && !prevOrders.find(old => old.id === o.id)
          );
          if (newOrders.length > 0) {
            // Play new order sound
            playNewOrderSound();
            
            // Trigger vibration pattern (3 short bursts)
            triggerVibration([200, 100, 200, 100, 200]);
            
            // Play phone ring for urgent orders
            playPhoneRingSound();
            
            // Show browser notification
            showNotification(
              `🍽️ ${newOrders.length} New Order${newOrders.length > 1 ? 's' : ''}!`,
              newOrders.map(o => `Table ${o.table_number || 'Counter'}: ${o.items.length} items`).join('\n'),
              '🔔'
            );
            
            // Show toast notification
            toast.success(`🔔 ${newOrders.length} new order${newOrders.length > 1 ? 's' : ''} received!`, {
              duration: 5000,
              action: {
                label: 'View',
                onClick: () => setFilter('pending')
              }
            });
          }
        }
        
        return mergedOrders.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      });
      
      setStats({
        pending: sorted.filter(o => o.status === 'pending').length,
        preparing: sorted.filter(o => o.status === 'preparing').length,
        ready: sorted.filter(o => o.status === 'ready').length
      });
      
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      // Don't clear orders on error to prevent flickering
    }
  };

  // Enhanced notification and feedback functions
  const playNewOrderSound = () => {
    if (notificationSettings.sound && newOrderAudioRef.current) {
      newOrderAudioRef.current.currentTime = 0;
      newOrderAudioRef.current.play().catch(() => {});
    }
  };

  const playButtonClickSound = () => {
    if (notificationSettings.sound && buttonClickAudioRef.current) {
      buttonClickAudioRef.current.currentTime = 0;
      buttonClickAudioRef.current.play().catch(() => {});
    }
  };

  const playPhoneRingSound = () => {
    if (notificationSettings.phoneRing && phoneRingAudioRef.current) {
      try {
        phoneRingAudioRef.current.currentTime = 0;
        phoneRingAudioRef.current.volume = notificationSettings.volume;
        
        // Play the ring sound multiple times for urgency
        const playRing = () => {
          phoneRingAudioRef.current.play().catch(error => {
            console.warn('Phone ring audio play failed:', error);
            // Fallback to system beep
            if ('vibrate' in navigator) {
              navigator.vibrate([500, 200, 500, 200, 500]);
            }
          });
        };
        
        // Play immediately
        playRing();
        
        // Play again after 1 second and 2 seconds for urgency
        setTimeout(playRing, 1000);
        setTimeout(playRing, 2000);
        
        console.log('📞 Phone ring sound played');
      } catch (error) {
        console.error('❌ Phone ring sound failed:', error);
        // Fallback to vibration
        triggerVibration([500, 200, 500, 200, 500]);
      }
    }
  };

  const playSuccessSound = () => {
    if (notificationSettings.sound && successAudioRef.current) {
      successAudioRef.current.currentTime = 0;
      successAudioRef.current.play().catch(() => {});
    }
  };

  const triggerVibration = (pattern = [200]) => {
    if (notificationSettings.vibration && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  const showNotification = (title, body, icon = '🔔') => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'kitchen-order',
        requireInteraction: true
      });
    }
  };

  // Request notification permission on component mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleStatusChange = async (orderId, status) => {
    // Prevent double-clicks
    if (processingOrders.has(orderId)) {
      return;
    }
    
    // Instant feedback - add to processing set
    setProcessingOrders(prev => new Set([...prev, orderId]));
    
    // EXTENDED INTERACTION BLOCKING for kitchen
    localStorage.setItem('lastUserInteraction', Date.now().toString());
    
    // Play button click sound immediately
    playButtonClickSound();
    
    // Trigger haptic feedback
    triggerVibration([100]);
    
    // Optimistic UI update with ultra-stable state
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId 
          ? { 
              ...order, 
              status, 
              processing: true, 
              updated_at: new Date().toISOString(),
              optimistic_update: true, // Mark as optimistic to prevent polling conflicts
              ui_locked: true // Additional lock for kitchen display
            }
          : order
      )
    );
    
    try {
      await axios.put(`${API}/orders/${orderId}/status?status=${status}`);
      
      // Play success sound
      playSuccessSound();
      
      // Success vibration
      triggerVibration([50, 50, 100]);
      
      // Success toast with sound
      const statusMessages = {
        preparing: { message: '🔥 Cooking started!', sound: 'cooking' },
        ready: { message: '✅ Ready for pickup!', sound: 'ready' },
        completed: { message: '🎉 Order served!', sound: 'completed' }
      };
      
      const statusConfig = statusMessages[status] || { message: 'Status updated!', sound: 'default' };
      toast.success(statusConfig.message, {
        duration: 3000,
        className: 'font-bold'
      });
      
      // Update with server confirmation while maintaining visual stability
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { 
                ...order, 
                status, 
                processing: false, 
                optimistic_update: false, // Clear optimistic flag
                ui_locked: false // Clear UI lock
              }
            : order
        )
      );
      
      // For completed orders, show a brief success animation before removing
      if (status === 'completed') {
        // Keep the order visible for 3 seconds with completed status
        setTimeout(() => {
          setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
        }, 3000);
      }
      
      // NO immediate fetchOrders() call to prevent flickering
      
    } catch (error) {
      // Error feedback
      triggerVibration([200, 100, 200]);
      toast.error('Failed to update status', {
        duration: 4000,
        action: {
          label: 'Retry',
          onClick: () => handleStatusChange(orderId, status)
        }
      });
      
      // Revert optimistic update
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { 
                ...order, 
                processing: false,
                optimistic_update: false,
                ui_locked: false
              }
            : order
        )
      );
    } finally {
      // Remove from processing set after extended delay to prevent polling conflicts
      setTimeout(() => {
        setProcessingOrders(prev => {
          const newSet = new Set(prev);
          newSet.delete(orderId);
          return newSet;
        });
        
        // Extended interaction blocking
        localStorage.setItem('lastUserInteraction', Date.now().toString());
      }, 2000); // Extended to 2 seconds for kitchen stability
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    playButtonClickSound();
    triggerVibration([50]);
    await fetchOrders();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const toggleNotificationSetting = (setting) => {
    playButtonClickSound();
    triggerVibration([50]);
    
    setNotificationSettings(prev => {
      const newSettings = { ...prev, [setting]: !prev[setting] };
      
      // Save to localStorage
      localStorage.setItem('kitchenNotificationSettings', JSON.stringify(newSettings));
      
      // Update audio volumes
      if (newOrderAudioRef.current) newOrderAudioRef.current.volume = newSettings.sound ? newSettings.volume : 0;
      if (phoneRingAudioRef.current) phoneRingAudioRef.current.volume = newSettings.phoneRing ? newSettings.volume : 0;
      
      // Show feedback toast
      const settingNames = {
        sound: 'Sound notifications',
        vibration: 'Vibration',
        phoneRing: 'Phone ring alerts'
      };
      
      toast.success(`${settingNames[setting]} ${newSettings[setting] ? 'enabled' : 'disabled'}`, {
        duration: 2000
      });
      
      return newSettings;
    });
  };

  // Load notification settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('kitchenNotificationSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setNotificationSettings(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Failed to parse notification settings:', e);
      }
    }
  }, []);

  const getUrgencyLevel = (date) => {
    const minutes = Math.floor((new Date() - new Date(date)) / 60000);
    if (minutes > 20) return 'critical';
    if (minutes > 10) return 'warning';
    return 'normal';
  };

  const formatWaitTime = (date) => {
    const totalMinutes = Math.floor((new Date() - new Date(date)) / 60000);
    if (totalMinutes < 0) return '0m';
    if (totalMinutes < 60) return `${totalMinutes}m`;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`;
  };

  const printKOT = (order) => {
    try {
      printKOTUtil(order, businessSettings);
      toast.success('KOT printed!');
    } catch (error) {
      toast.error('Failed to print KOT');
    }
  };

  const filteredOrders = orders.filter(o => filter === 'all' || o.status === filter);

  const waitTimeStats = (() => {
    if (orders.length === 0) return { avg: 0, min: 0, max: 0, status: 'good' };
    const waitTimes = orders.map(o => Math.floor((new Date() - new Date(o.created_at)) / 60000));
    const avg = Math.round(waitTimes.reduce((sum, t) => sum + t, 0) / waitTimes.length);
    let status = 'good';
    if (avg > 20) status = 'critical';
    else if (avg > 10) status = 'warning';
    return { avg, min: Math.min(...waitTimes), max: Math.max(...waitTimes), status };
  })();

  // Enhanced Order Card Component
  const OrderCard = ({ order }) => {
    const urgency = getUrgencyLevel(order.created_at);
    const waitTime = formatWaitTime(order.created_at);
    const totalItems = order.items.reduce((sum, i) => sum + i.quantity, 0);

    const statusConfig = {
      pending: { bg: 'from-amber-500 to-orange-500', icon: Bell, label: 'NEW', glow: 'shadow-amber-500/30' },
      preparing: { bg: 'from-blue-500 to-cyan-500', icon: Flame, label: 'COOKING', glow: 'shadow-blue-500/30' },
      ready: { bg: 'from-emerald-500 to-green-500', icon: CheckCircle, label: 'READY', glow: 'shadow-emerald-500/30' },
      completed: { bg: 'from-gray-500 to-gray-600', icon: CheckCircle, label: 'SERVED', glow: 'shadow-gray-500/30' }
    };
    const config = statusConfig[order.status] || statusConfig.pending; // Fallback to pending if status not found
    const StatusIcon = config.icon;

    const orderTypeConfig = {
      dine_in: { icon: Utensils, label: 'Dine In', color: 'bg-blue-100 text-blue-700' },
      takeaway: { icon: Coffee, label: 'Takeaway', color: 'bg-purple-100 text-purple-700' },
      delivery: { icon: Truck, label: 'Delivery', color: 'bg-pink-100 text-pink-700' }
    };
    const orderType = orderTypeConfig[order.order_type] || orderTypeConfig.dine_in;
    const OrderTypeIcon = orderType.icon;

    return (
      <div className={`relative rounded-2xl overflow-hidden shadow-xl ${config.glow} shadow-lg transition-all hover:scale-[1.02] ${urgency === 'critical' ? 'animate-pulse ring-2 ring-red-500' : ''}`}>
        {/* Status Header */}
        <div className={`bg-gradient-to-r ${config.bg} px-4 py-3 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <StatusIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-black text-xl tracking-tight">
                {order.table_number ? `Table ${order.table_number}` : 'Counter'}
              </h3>
              <p className="text-white/70 text-xs font-mono">#{order.id.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs font-bold">
              {config.label}
            </span>
            <div className={`mt-1 flex items-center justify-end gap-1 ${urgency === 'critical' ? 'text-red-200' : 'text-white/80'}`}>
              <Clock className="w-3.5 h-3.5" />
              <span className="font-bold text-sm">{waitTime}</span>
              {urgency === 'critical' && <AlertCircle className="w-4 h-4 text-red-300 animate-bounce" />}
            </div>
          </div>
        </div>

        {/* Order Content */}
        <div className="bg-white p-4">
          {/* Order Type & Customer */}
          <div className="flex items-center justify-between mb-3">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${orderType.color}`}>
              <OrderTypeIcon className="w-3.5 h-3.5" />
              {orderType.label}
            </div>
            {order.customer_name && (
              <span className="text-gray-500 text-xs">👤 {order.customer_name}</span>
            )}
          </div>

          {/* Items List */}
          <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
            {order.items.map((item, idx) => (
              <div key={idx} className={`flex items-start gap-3 p-2.5 rounded-xl ${urgency === 'critical' ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 text-white flex items-center justify-center font-black text-sm">
                  {item.quantity}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                  {item.notes && (
                    <div className="flex items-center gap-1 mt-1 text-orange-600 text-xs">
                      <Flame className="w-3 h-3" />
                      <span className="font-medium">{item.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Stats */}
          <div className="flex items-center justify-between py-2 border-t border-gray-100">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-500">Items: <strong className="text-violet-600">{totalItems}</strong></span>
              {order.waiter_name && <span className="text-gray-500">Server: <strong>{order.waiter_name}</strong></span>}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-3">
            {order.status === 'pending' && (
              <Button 
                onClick={() => handleStatusChange(order.id, 'preparing')} 
                disabled={processingOrders.has(order.id)}
                className={`flex-1 h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 font-bold text-sm transition-all transform ${
                  processingOrders.has(order.id) ? 'scale-95 opacity-75' : 'hover:scale-105 active:scale-95'
                }`}
              >
                {processingOrders.has(order.id) ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> STARTING...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" /> START COOKING
                  </>
                )}
              </Button>
            )}
            {order.status === 'preparing' && (
              <Button 
                onClick={() => handleStatusChange(order.id, 'ready')} 
                disabled={processingOrders.has(order.id)}
                className={`flex-1 h-12 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 font-bold text-sm transition-all transform ${
                  processingOrders.has(order.id) ? 'scale-95 opacity-75' : 'hover:scale-105 active:scale-95'
                }`}
              >
                {processingOrders.has(order.id) ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> FINISHING...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" /> MARK READY
                  </>
                )}
              </Button>
            )}
            {order.status === 'ready' && (
              <Button 
                onClick={() => handleStatusChange(order.id, 'completed')} 
                disabled={processingOrders.has(order.id)}
                className={`flex-1 h-12 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 font-bold text-sm transition-all transform ${
                  processingOrders.has(order.id) ? 'scale-95 opacity-75' : 'hover:scale-105 active:scale-95'
                }`}
              >
                {processingOrders.has(order.id) ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> SERVING...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" /> SERVED
                  </>
                )}
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => {
                playButtonClickSound();
                triggerVibration([50]);
                printKOT(order);
              }} 
              className="h-12 px-4 border-2 hover:scale-105 active:scale-95 transition-transform"
            >
              <Printer className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                playButtonClickSound();
                triggerVibration([50]);
                setSelectedOrder(order);
              }} 
              className="h-12 px-4 border-2 hover:scale-105 active:scale-95 transition-transform"
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };


  return (
    <Layout user={user}>
      <div className={`space-y-4 ${isFullscreen ? 'p-4 bg-slate-900 min-h-screen' : ''}`} data-testid="kitchen-page">
        {/* Header */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isFullscreen ? 'text-white' : ''}`}>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${isFullscreen ? 'bg-orange-600' : 'bg-gradient-to-br from-orange-500 to-red-500'} shadow-lg`}>
              <ChefHat className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Kitchen Display
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-sm ${isFullscreen ? 'text-gray-400' : 'text-gray-500'}`}>
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                {autoRefresh && (
                  <span className="flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    LIVE
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`flex rounded-xl overflow-hidden border-2 ${isFullscreen ? 'border-gray-700' : 'border-gray-200'}`}>
              <button onClick={() => setViewMode('grid')} className={`px-3 py-2 text-sm font-medium ${viewMode === 'grid' ? 'bg-violet-600 text-white' : isFullscreen ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-600'}`}>
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('list')} className={`px-3 py-2 text-sm font-medium ${viewMode === 'list' ? 'bg-violet-600 text-white' : isFullscreen ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-600'}`}>
                <List className="w-4 h-4" />
              </button>
            </div>
            
            {/* Notification Controls */}
            <div className={`flex rounded-xl overflow-hidden border-2 ${isFullscreen ? 'border-gray-700' : 'border-gray-200'}`}>
              <button 
                onClick={() => toggleNotificationSetting('sound')} 
                className={`px-3 py-2 text-sm font-medium transition-all ${
                  notificationSettings.sound 
                    ? 'bg-green-600 text-white' 
                    : isFullscreen ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-600'
                }`}
                title="Toggle sound notifications"
              >
                {notificationSettings.sound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <button 
                onClick={() => toggleNotificationSetting('vibration')} 
                className={`px-3 py-2 text-sm font-medium transition-all ${
                  notificationSettings.vibration 
                    ? 'bg-blue-600 text-white' 
                    : isFullscreen ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-600'
                }`}
                title="Toggle vibration"
              >
                <Vibrate className="w-4 h-4" />
              </button>
              <button 
                onClick={() => toggleNotificationSetting('phoneRing')} 
                className={`px-3 py-2 text-sm font-medium transition-all ${
                  notificationSettings.phoneRing 
                    ? 'bg-red-600 text-white' 
                    : isFullscreen ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-600'
                }`}
                title="Toggle phone ring alerts"
              >
                <Phone className="w-4 h-4" />
              </button>
            </div>
            
            <Button variant={autoRefresh ? "default" : "outline"} size="sm" onClick={() => setAutoRefresh(!autoRefresh)} className={`h-9 ${autoRefresh ? 'bg-green-600 hover:bg-green-700' : ''}`}>
              <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            </Button>
            
            <Button variant="outline" size="sm" onClick={handleManualRefresh} className={`h-9 ${isFullscreen ? 'border-gray-700 text-white' : ''}`} disabled={isRefreshing}>
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-violet-600' : ''}`} />
            </Button>
            
            <Button variant="outline" size="sm" onClick={toggleFullscreen} className={`h-9 ${isFullscreen ? 'bg-violet-600 border-violet-600 text-white' : 'bg-violet-100 border-violet-300 text-violet-700'}`}>
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                playButtonClickSound();
                triggerVibration([50]);
                setShowNotificationSettings(!showNotificationSettings);
              }} 
              className={`h-9 ${isFullscreen ? 'border-gray-700 text-white' : ''} ${showNotificationSettings ? 'bg-orange-100 border-orange-300 text-orange-700' : ''}`}
              title="Notification Settings"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Notification Settings Panel */}
        {showNotificationSettings && (
          <div className={`rounded-2xl p-4 border-2 ${isFullscreen ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-lg`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-bold text-lg flex items-center gap-2 ${isFullscreen ? 'text-white' : 'text-gray-900'}`}>
                <Bell className="w-5 h-5" />
                Notification Settings
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowNotificationSettings(false)}
                className={isFullscreen ? 'text-gray-400 hover:text-white' : ''}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Sound Settings */}
              <div className={`p-4 rounded-xl border ${isFullscreen ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Volume2 className={`w-5 h-5 ${notificationSettings.sound ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className={`font-semibold ${isFullscreen ? 'text-white' : 'text-gray-900'}`}>Sound</span>
                  </div>
                  <button
                    onClick={() => toggleNotificationSetting('sound')}
                    className={`w-12 h-6 rounded-full transition-all ${
                      notificationSettings.sound ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      notificationSettings.sound ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
                <p className={`text-sm ${isFullscreen ? 'text-gray-400' : 'text-gray-600'}`}>
                  Kitchen bell sounds for new orders
                </p>
              </div>

              {/* Vibration Settings */}
              <div className={`p-4 rounded-xl border ${isFullscreen ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Vibrate className={`w-5 h-5 ${notificationSettings.vibration ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className={`font-semibold ${isFullscreen ? 'text-white' : 'text-gray-900'}`}>Vibration</span>
                  </div>
                  <button
                    onClick={() => toggleNotificationSetting('vibration')}
                    className={`w-12 h-6 rounded-full transition-all ${
                      notificationSettings.vibration ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      notificationSettings.vibration ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
                <p className={`text-sm ${isFullscreen ? 'text-gray-400' : 'text-gray-600'}`}>
                  Haptic feedback for actions
                </p>
              </div>

              {/* Phone Ring Settings */}
              <div className={`p-4 rounded-xl border ${isFullscreen ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Phone className={`w-5 h-5 ${notificationSettings.phoneRing ? 'text-red-600' : 'text-gray-400'}`} />
                    <span className={`font-semibold ${isFullscreen ? 'text-white' : 'text-gray-900'}`}>Phone Ring</span>
                  </div>
                  <button
                    onClick={() => toggleNotificationSetting('phoneRing')}
                    className={`w-12 h-6 rounded-full transition-all ${
                      notificationSettings.phoneRing ? 'bg-red-600' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      notificationSettings.phoneRing ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
                <p className={`text-sm ${isFullscreen ? 'text-gray-400' : 'text-gray-600'}`}>
                  Urgent ring alerts for new orders
                </p>
              </div>
            </div>

            {/* Volume Control */}
            <div className="mt-4">
              <label className={`block text-sm font-medium mb-2 ${isFullscreen ? 'text-white' : 'text-gray-900'}`}>
                Volume: {Math.round(notificationSettings.volume * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={notificationSettings.volume}
                onChange={(e) => {
                  const newVolume = parseFloat(e.target.value);
                  setNotificationSettings(prev => {
                    const newSettings = { ...prev, volume: newVolume };
                    localStorage.setItem('kitchenNotificationSettings', JSON.stringify(newSettings));
                    
                    // Update audio volumes
                    if (newOrderAudioRef.current) newOrderAudioRef.current.volume = newSettings.sound ? newVolume : 0;
                    if (phoneRingAudioRef.current) phoneRingAudioRef.current.volume = newSettings.phoneRing ? newVolume : 0;
                    
                    return newSettings;
                  });
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            {/* Test Buttons */}
            <div className="flex gap-2 mt-4">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  playNewOrderSound();
                  triggerVibration([200, 100, 200]);
                }}
                className="flex-1"
              >
                <Speaker className="w-4 h-4 mr-2" />
                Test Sound
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  playPhoneRingSound();
                  triggerVibration([200, 100, 200, 100, 200]);
                }}
                className="flex-1"
              >
                <Phone className="w-4 h-4 mr-2" />
                Test Ring
              </Button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className={`rounded-2xl p-4 ${stats.pending > 0 ? 'bg-gradient-to-br from-amber-500 to-orange-500 ring-2 ring-amber-300/50' : 'bg-gradient-to-br from-amber-500 to-orange-500'} text-white shadow-lg`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-xs font-medium uppercase tracking-wide">Pending</p>
                <p className="text-4xl sm:text-5xl font-black mt-1">{stats.pending}</p>
              </div>
              <Bell className={`w-10 h-10 sm:w-12 sm:h-12 opacity-40 ${stats.pending > 0 ? 'animate-bounce' : ''}`} />
            </div>
          </div>
          <div className="rounded-2xl p-4 bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs font-medium uppercase tracking-wide">Cooking</p>
                <p className="text-4xl sm:text-5xl font-black mt-1">{stats.preparing}</p>
              </div>
              <Flame className="w-10 h-10 sm:w-12 sm:h-12 opacity-40" />
            </div>
          </div>
          <div className="rounded-2xl p-4 bg-gradient-to-br from-emerald-500 to-green-500 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-xs font-medium uppercase tracking-wide">Ready</p>
                <p className="text-4xl sm:text-5xl font-black mt-1">{stats.ready}</p>
              </div>
              <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 opacity-40" />
            </div>
          </div>
          <div className={`rounded-2xl p-4 ${waitTimeStats.status === 'critical' ? 'bg-gradient-to-br from-red-500 to-red-600 ring-2 ring-red-300 animate-pulse' : waitTimeStats.status === 'warning' ? 'bg-gradient-to-br from-orange-500 to-amber-500' : 'bg-gradient-to-br from-violet-500 to-purple-500'} text-white shadow-lg`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs font-medium uppercase tracking-wide ${waitTimeStats.status === 'critical' ? 'text-red-100' : waitTimeStats.status === 'warning' ? 'text-orange-100' : 'text-violet-100'}`}>
                  Avg Wait {waitTimeStats.status === 'critical' && '⚠️'}
                </p>
                <p className="text-4xl sm:text-5xl font-black mt-1">{waitTimeStats.avg}<span className="text-xl">m</span></p>
              </div>
              <Clock className={`w-10 h-10 sm:w-12 sm:h-12 opacity-40 ${waitTimeStats.status === 'critical' ? 'animate-bounce' : ''}`} />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className={`flex gap-1 p-1.5 rounded-2xl ${isFullscreen ? 'bg-gray-800' : 'bg-gray-100'}`}>
          {[
            { id: 'all', label: 'All Orders', count: orders.length, color: 'violet' },
            { id: 'pending', label: 'Pending', count: stats.pending, color: 'amber' },
            { id: 'preparing', label: 'Cooking', count: stats.preparing, color: 'blue' },
            { id: 'ready', label: 'Ready', count: stats.ready, color: 'emerald' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setFilter(tab.id)}
              className={`flex-1 px-3 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm ${
                filter === tab.id
                  ? `bg-${tab.color}-600 text-white shadow-lg`
                  : isFullscreen ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-white'
              }`}>
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.id === 'all' ? 'All' : tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-black ${filter === tab.id ? 'bg-white/20' : isFullscreen ? 'bg-gray-700' : 'bg-gray-200'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Orders Grid */}
        <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4' : 'flex flex-col gap-4'}`}>
          {filteredOrders.map(order => <OrderCard key={order.id} order={order} />)}
          {filteredOrders.length === 0 && (
            <div className={`col-span-full text-center py-16 ${isFullscreen ? 'text-gray-500' : ''}`}>
              <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${isFullscreen ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <ChefHat className={`w-10 h-10 ${isFullscreen ? 'text-gray-600' : 'text-gray-300'}`} />
              </div>
              <p className={`text-xl font-bold ${isFullscreen ? 'text-gray-400' : 'text-gray-500'}`}>
                No {filter === 'all' ? 'active' : filter} orders
              </p>
              <p className={`mt-2 ${isFullscreen ? 'text-gray-600' : 'text-gray-400'}`}>
                Orders will appear here automatically
              </p>
            </div>
          )}
        </div>

        {/* Order Detail Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={() => setSelectedOrder(null)}>
            <Card className="w-full sm:max-w-lg border-0 shadow-2xl rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
              <CardHeader className="bg-gradient-to-r from-violet-600 to-purple-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-black">
                      {selectedOrder.table_number ? `Table ${selectedOrder.table_number}` : 'Counter Order'}
                    </CardTitle>
                    <p className="text-violet-200 text-sm font-mono">#{selectedOrder.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(null)} className="text-white hover:bg-white/20">
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-gray-500 text-xs">Server</p>
                    <p className="font-bold">{selectedOrder.waiter_name || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-gray-500 text-xs">Customer</p>
                    <p className="font-bold">{selectedOrder.customer_name || 'Walk-in'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-gray-500 text-xs">Time</p>
                    <p className="font-bold">{new Date(selectedOrder.created_at).toLocaleTimeString()}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-gray-500 text-xs">Wait Time</p>
                    <p className="font-bold text-violet-600">{formatWaitTime(selectedOrder.created_at)}</p>
                  </div>
                </div>
                <div>
                  <p className="font-bold mb-3 flex items-center gap-2">
                    <Utensils className="w-4 h-4" /> Items ({selectedOrder.items.length})
                  </p>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <span className="w-8 h-8 rounded-lg bg-violet-600 text-white flex items-center justify-center font-bold text-sm">{item.quantity}</span>
                        <div className="flex-1">
                          <p className="font-semibold">{item.name}</p>
                          {item.notes && <p className="text-orange-600 text-sm flex items-center gap-1"><Flame className="w-3 h-3" />{item.notes}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={() => printKOT(selectedOrder)} className="flex-1 h-12 bg-gradient-to-r from-orange-500 to-red-500">
                    <Printer className="w-4 h-4 mr-2" /> Print KOT
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedOrder(null)} className="h-12 px-6">Close</Button>
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
