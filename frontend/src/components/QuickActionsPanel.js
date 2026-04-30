import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Printer, Receipt, ChefHat, Users, Settings, 
  BarChart3, QrCode, Zap, Table, ShoppingBag, Calculator,
  Bell, Wifi, WifiOff, RefreshCw
} from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

/**
 * Quick Actions Panel - Futuristic Speed-Optimized Controls
 * One-click access to common POS operations
 */
const QuickActionsPanel = ({ 
  user, 
  businessSettings,
  onNewOrder,
  onOpenKitchen,
  onOpenBilling,
  className = ''
}) => {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastAction, setLastAction] = useState(null);

  // Monitor online status
  useState(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const quickActions = [
    {
      id: 'new-order',
      label: 'New Order',
      icon: Plus,
      color: 'from-cyan-500 to-cyan-600',
      shadow: 'shadow-cyan-500/20',
      onClick: () => {
        if (onNewOrder) {
          onNewOrder();
        } else {
          navigate('/orders');
        }
        toast.success('Creating new order...', { icon: <Plus className="w-4 h-4" /> });
      },
      shortcut: 'N'
    },
    {
      id: 'kitchen',
      label: 'Kitchen',
      icon: ChefHat,
      color: 'from-orange-500 to-red-500',
      shadow: 'shadow-orange-500/20',
      onClick: () => {
        if (onOpenKitchen) {
          onOpenKitchen();
        } else {
          navigate('/kitchen');
        }
      },
      shortcut: 'K'
    },
    {
      id: 'billing',
      label: 'Billing',
      icon: Calculator,
      color: 'from-emerald-500 to-emerald-600',
      shadow: 'shadow-emerald-500/20',
      onClick: () => {
        if (onOpenBilling) {
          onOpenBilling();
        } else {
          navigate('/orders');
        }
      },
      shortcut: 'B'
    },
    {
      id: 'tables',
      label: 'Tables',
      icon: Table,
      color: 'from-purple-500 to-purple-600',
      shadow: 'shadow-purple-500/20',
      onClick: () => navigate('/tables'),
      shortcut: 'T'
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: BarChart3,
      color: 'from-blue-500 to-blue-600',
      shadow: 'shadow-blue-500/20',
      onClick: () => navigate('/reports'),
      shortcut: 'R'
    },
    {
      id: 'menu',
      label: 'Menu',
      icon: ShoppingBag,
      color: 'from-pink-500 to-pink-600',
      shadow: 'shadow-pink-500/20',
      onClick: () => navigate('/menu'),
      shortcut: 'M'
    }
  ];

  const handleActionClick = (action) => {
    setLastAction(action.id);
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    // Sound feedback
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ4AAAB/f39/f39/f39/f38A');
      audio.volume = 0.2;
      audio.play().catch(() => {});
    } catch (e) {}
    
    action.onClick();
    
    setTimeout(() => setLastAction(null), 200);
  };

  return (
    <div className={`${className}`} data-testid="quick-actions-panel">
      {/* Status Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-semibold text-white font-['Chivo']">Quick Actions</span>
        </div>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs">
              <Wifi className="w-3.5 h-3.5" />
              <span>Online</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-amber-400 text-xs">
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Grid */}
      <div className="grid grid-cols-3 gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          const isActive = lastAction === action.id;
          
          return (
            <button
              key={action.id}
              onClick={() => handleActionClick(action)}
              className={`
                relative group flex flex-col items-center justify-center p-4 rounded-xl
                bg-zinc-800/50 border border-zinc-700/50
                hover:border-zinc-600 hover:bg-zinc-800
                transition-all duration-200
                hover:-translate-y-1 hover:shadow-lg
                active:scale-95 active:translate-y-0
                ${isActive ? 'scale-95 bg-zinc-700' : ''}
              `}
              data-testid={`quick-action-${action.id}`}
            >
              {/* Glow Effect */}
              <div 
                className={`absolute inset-0 rounded-xl bg-gradient-to-r ${action.color} opacity-0 group-hover:opacity-10 transition-opacity`}
              />
              
              {/* Icon */}
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${action.color} ${action.shadow} shadow-lg flex items-center justify-center mb-2 transition-transform group-hover:scale-110`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              
              {/* Label */}
              <span className="text-xs font-medium text-zinc-300 group-hover:text-white transition-colors">
                {action.label}
              </span>
              
              {/* Keyboard Shortcut */}
              <span className="absolute top-2 right-2 text-[10px] text-zinc-600 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                {action.shortcut}
              </span>
            </button>
          );
        })}
      </div>

      {/* Quick Stats Bar */}
      <div className="mt-4 p-3 rounded-lg bg-zinc-800/30 border border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-lg font-bold text-cyan-400 font-mono">{businessSettings?.active_tables || 0}</p>
            <p className="text-[10px] text-zinc-500 uppercase">Tables</p>
          </div>
          <div className="w-px h-8 bg-zinc-700" />
          <div className="text-center">
            <p className="text-lg font-bold text-emerald-400 font-mono">{businessSettings?.active_staff || 0}</p>
            <p className="text-[10px] text-zinc-500 uppercase">Staff</p>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/settings')}
          className="h-8 text-zinc-400 hover:text-white"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="mt-3 text-center">
        <p className="text-[10px] text-zinc-600">
          Press <kbd className="px-1 bg-zinc-800 rounded text-zinc-500">Alt</kbd> + letter for quick access
        </p>
      </div>
    </div>
  );
};

export default QuickActionsPanel;
