import { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, 
  Clock, Users, Zap, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

/**
 * Real-time Performance Metrics Component
 * Shows live KPIs with animated counters
 */
const LiveMetricsBar = ({ stats, previousStats, currency = '₹' }) => {
  const [animatedStats, setAnimatedStats] = useState(stats);
  
  useEffect(() => {
    // Animate number changes
    setAnimatedStats(stats);
  }, [stats]);

  const calculateChange = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const metrics = [
    {
      id: 'revenue',
      label: "Today's Revenue",
      value: animatedStats?.todaySales || 0,
      format: 'currency',
      icon: DollarSign,
      change: calculateChange(animatedStats?.todaySales, previousStats?.todaySales),
      color: 'cyan'
    },
    {
      id: 'orders',
      label: 'Total Orders',
      value: animatedStats?.todayOrders || 0,
      format: 'number',
      icon: ShoppingCart,
      change: calculateChange(animatedStats?.todayOrders, previousStats?.todayOrders),
      color: 'emerald'
    },
    {
      id: 'avg-order',
      label: 'Avg Order Value',
      value: animatedStats?.avgOrderValue || 0,
      format: 'currency',
      icon: TrendingUp,
      change: calculateChange(animatedStats?.avgOrderValue, previousStats?.avgOrderValue),
      color: 'purple'
    },
    {
      id: 'active',
      label: 'Active Orders',
      value: animatedStats?.activeOrders || 0,
      format: 'number',
      icon: Clock,
      change: 0,
      color: 'amber',
      pulse: (animatedStats?.activeOrders || 0) > 0
    }
  ];

  const formatValue = (value, format) => {
    if (format === 'currency') {
      return `${currency}${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    }
    return value.toLocaleString();
  };

  const getColorClasses = (color) => {
    const colors = {
      cyan: {
        bg: 'bg-cyan-500/10',
        border: 'border-cyan-500/20',
        text: 'text-cyan-400',
        icon: 'text-cyan-400',
        glow: 'shadow-cyan-500/10'
      },
      emerald: {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        text: 'text-emerald-400',
        icon: 'text-emerald-400',
        glow: 'shadow-emerald-500/10'
      },
      purple: {
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/20',
        text: 'text-purple-400',
        icon: 'text-purple-400',
        glow: 'shadow-purple-500/10'
      },
      amber: {
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        text: 'text-amber-400',
        icon: 'text-amber-400',
        glow: 'shadow-amber-500/10'
      }
    };
    return colors[color] || colors.cyan;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="live-metrics-bar">
      {metrics.map((metric, index) => {
        const colors = getColorClasses(metric.color);
        const Icon = metric.icon;
        const isPositive = metric.change > 0;
        const isNegative = metric.change < 0;

        return (
          <Card 
            key={metric.id}
            className={`
              bg-zinc-900/80 border ${colors.border} rounded-xl overflow-hidden
              hover:${colors.border.replace('/20', '/40')} transition-all duration-300
              hover:-translate-y-0.5 hover:shadow-lg ${colors.glow}
              ${metric.pulse ? 'animate-pulse' : ''}
            `}
            style={{ animationDelay: `${index * 100}ms` }}
            data-testid={`metric-${metric.id}`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg ${colors.bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${colors.icon}`} />
                </div>
                
                {metric.change !== 0 && (
                  <div className={`flex items-center gap-0.5 text-xs font-medium ${
                    isPositive ? 'text-emerald-400' : isNegative ? 'text-red-400' : 'text-zinc-500'
                  }`}>
                    {isPositive ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : isNegative ? (
                      <ArrowDownRight className="w-3 h-3" />
                    ) : null}
                    <span>{Math.abs(metric.change).toFixed(1)}%</span>
                  </div>
                )}
              </div>
              
              <div>
                <p className={`text-2xl font-bold ${colors.text} font-mono tracking-tight`}>
                  {formatValue(metric.value, metric.format)}
                </p>
                <p className="text-xs text-zinc-500 mt-1 font-medium">{metric.label}</p>
              </div>
              
              {/* Mini progress bar */}
              <div className="mt-3 h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${colors.bg.replace('/10', '')} transition-all duration-1000 ease-out`}
                  style={{ 
                    width: `${Math.min(100, (metric.value / (metric.format === 'currency' ? 50000 : 50)) * 100)}%` 
                  }}
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default LiveMetricsBar;
