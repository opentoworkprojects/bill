import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { 
  Sparkles, TrendingUp, TrendingDown, Clock, Users, 
  Zap, AlertTriangle, CheckCircle, ArrowRight, RefreshCw,
  DollarSign, ShoppingCart, ChefHat, Target, Award, Flame
} from 'lucide-react';
import { Button } from './ui/button';

/**
 * AI-Powered Insights Dashboard Component
 * Provides intelligent business insights and recommendations
 */
const AIInsightsPanel = ({ stats, recentOrders, topItems, businessSettings }) => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    generateInsights();
  }, [stats, recentOrders, topItems]);

  const generateInsights = () => {
    setLoading(true);
    const newInsights = [];
    const currency = businessSettings?.currency === 'USD' ? '$' : '₹';

    // Sales Performance Insight
    if (stats?.todaySales > 0) {
      const avgOrderValue = stats.avgOrderValue || (stats.todaySales / Math.max(stats.todayOrders, 1));
      const performanceLevel = avgOrderValue > 500 ? 'excellent' : avgOrderValue > 300 ? 'good' : 'growing';
      
      newInsights.push({
        id: 'sales-performance',
        type: performanceLevel === 'excellent' ? 'success' : performanceLevel === 'good' ? 'info' : 'warning',
        icon: performanceLevel === 'excellent' ? Award : TrendingUp,
        title: performanceLevel === 'excellent' ? 'Excellent Sales Day!' : 'Sales Insight',
        message: `Average order value: ${currency}${avgOrderValue.toFixed(0)}. ${
          performanceLevel === 'excellent' 
            ? 'Your upselling strategy is working great!' 
            : 'Consider combo offers to increase order value.'
        }`,
        action: performanceLevel !== 'excellent' ? 'View Combos' : null,
        priority: 1
      });
    }

    // Peak Hours Prediction
    const hour = new Date().getHours();
    const isPeakHour = (hour >= 12 && hour <= 14) || (hour >= 19 && hour <= 21);
    
    if (isPeakHour) {
      newInsights.push({
        id: 'peak-hours',
        type: 'alert',
        icon: Flame,
        title: 'Peak Hour Alert',
        message: 'Rush hour expected! Ensure kitchen is prepared and staff is ready.',
        action: 'View Kitchen',
        priority: 0
      });
    }

    // Active Orders Alert
    if (stats?.activeOrders > 5) {
      newInsights.push({
        id: 'active-orders',
        type: 'warning',
        icon: ShoppingCart,
        title: 'High Order Volume',
        message: `${stats.activeOrders} orders in progress. Monitor kitchen workflow closely.`,
        action: 'View Orders',
        priority: 1
      });
    }

    // Top Selling Items Insight
    if (topItems && topItems.length > 0) {
      const topItem = topItems[0];
      newInsights.push({
        id: 'top-item',
        type: 'success',
        icon: Target,
        title: 'Best Seller Today',
        message: `"${topItem.name}" is your top performer with ${topItem.quantity || topItem.count || 'multiple'} orders.`,
        action: null,
        priority: 2
      });
    }

    // Smart Recommendations
    if (stats?.todayOrders > 0 && stats?.todayOrders < 10) {
      newInsights.push({
        id: 'slow-day',
        type: 'info',
        icon: Sparkles,
        title: 'AI Recommendation',
        message: 'Consider running a flash discount to boost orders during slow hours.',
        action: 'Create Offer',
        priority: 3
      });
    }

    // Kitchen Efficiency
    if (stats?.preparingOrders > 3) {
      newInsights.push({
        id: 'kitchen-load',
        type: 'warning',
        icon: ChefHat,
        title: 'Kitchen Load High',
        message: `${stats.preparingOrders} orders being prepared. Average wait time may increase.`,
        action: 'View Kitchen',
        priority: 1
      });
    }

    // Staff Performance (if waiter data available)
    if (recentOrders && recentOrders.length > 0) {
      const uniqueWaiters = [...new Set(recentOrders.map(o => o.waiter_name).filter(Boolean))];
      if (uniqueWaiters.length > 0) {
        newInsights.push({
          id: 'staff-active',
          type: 'success',
          icon: Users,
          title: 'Staff Active',
          message: `${uniqueWaiters.length} staff member(s) actively serving customers.`,
          action: null,
          priority: 4
        });
      }
    }

    // Sort by priority and limit
    newInsights.sort((a, b) => a.priority - b.priority);
    setInsights(newInsights.slice(0, 5));
    setLastUpdated(new Date());
    setLoading(false);
  };

  const getInsightStyle = (type) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/20',
          icon: 'text-emerald-400',
          text: 'text-emerald-300'
        };
      case 'warning':
        return {
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/20',
          icon: 'text-amber-400',
          text: 'text-amber-300'
        };
      case 'alert':
        return {
          bg: 'bg-red-500/10',
          border: 'border-red-500/20',
          icon: 'text-red-400',
          text: 'text-red-300'
        };
      case 'info':
      default:
        return {
          bg: 'bg-purple-500/10',
          border: 'border-purple-500/20',
          icon: 'text-purple-400',
          text: 'text-purple-300'
        };
    }
  };

  return (
    <Card className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-purple-300 transition-colors shadow-lg" data-testid="ai-insights-panel">
      <CardHeader className="pb-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-gray-900 font-['Chivo']">AI Insights</CardTitle>
              <p className="text-xs text-gray-500">Powered by BillByte AI</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={generateInsights}
            disabled={loading}
            className="h-8 text-gray-600 hover:text-purple-600 hover:bg-purple-50"
            data-testid="refresh-insights-btn"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 space-y-3">
        {insights.length === 0 ? (
          <div className="py-8 text-center">
            <Sparkles className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Analyzing your business data...</p>
          </div>
        ) : (
          insights.map((insight, index) => {
            const style = getInsightStyle(insight.type);
            const Icon = insight.icon;
            
            return (
              <div
                key={insight.id}
                className={`p-3 rounded-lg ${style.bg} border ${style.border} transition-all hover:scale-[1.01] animate-in fade-in slide-in-from-bottom-2`}
                style={{ animationDelay: `${index * 50}ms` }}
                data-testid={`insight-${insight.id}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg ${style.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${style.icon}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-semibold ${style.text}`}>{insight.title}</h4>
                    <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{insight.message}</p>
                    {insight.action && (
                      <button className={`text-xs ${style.icon} font-medium mt-2 flex items-center gap-1 hover:underline`}>
                        {insight.action}
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {lastUpdated && (
          <div className="text-center pt-2">
            <p className="text-[10px] text-gray-500">
              Updated {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIInsightsPanel;
