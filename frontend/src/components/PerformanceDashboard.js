/**
 * Performance Dashboard Component
 * 
 * This component provides a real-time dashboard for monitoring active orders
 * display performance, cache efficiency, and system health metrics.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Activity, 
  Clock, 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw,
  Eye,
  EyeOff,
  Settings,
  Download
} from 'lucide-react';
import performanceMonitor from '../utils/performanceMonitor';
import activeOrdersCache from '../utils/activeOrdersCache';
import performanceAlertSystem from '../utils/performanceAlertSystem';

const PerformanceDashboard = ({ isVisible = true, onToggle }) => {
  const [performanceStats, setPerformanceStats] = useState(null);
  const [cacheStats, setCacheStats] = useState(null);
  const [alertStats, setAlertStats] = useState(null);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds
  const intervalRef = useRef(null);

  // Load initial data and set up auto-refresh
  useEffect(() => {
    loadPerformanceData();
    
    if (autoRefresh) {
      intervalRef.current = setInterval(loadPerformanceData, refreshInterval);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval]);

  // Listen for real-time alerts
  useEffect(() => {
    const handleAlert = (event) => {
      const alert = event.detail;
      setRecentAlerts(prev => [alert, ...prev.slice(0, 9)]); // Keep last 10 alerts
      
      // Refresh stats when new alert comes in
      loadPerformanceData();
    };

    window.addEventListener('performanceAlertSystemAlert', handleAlert);
    
    return () => {
      window.removeEventListener('performanceAlertSystemAlert', handleAlert);
    };
  }, []);

  /**
   * Load performance data from all monitoring systems
   */
  const loadPerformanceData = async () => {
    try {
      // Get performance stats
      const perfStats = performanceMonitor.getStats();
      const perfReport = performanceMonitor.generateReport();
      
      // Get cache stats
      const cachePerf = activeOrdersCache.getPerformanceStats();
      
      // Get alert system status
      const alertStatus = performanceAlertSystem.getStatus();
      const alerts = performanceAlertSystem.getAlertHistory({ timeRange: 3600000 }); // Last hour
      
      setPerformanceStats({
        ...perfStats,
        report: perfReport,
        trends: performanceMonitor.analyzeTrends()
      });
      
      setCacheStats(cachePerf);
      setAlertStats(alertStatus);
      setRecentAlerts(alerts.slice(0, 10)); // Keep last 10 alerts
      
    } catch (error) {
      console.error('Failed to load performance data:', error);
    }
  };

  /**
   * Manual refresh
   */
  const handleManualRefresh = () => {
    loadPerformanceData();
  };

  /**
   * Toggle auto-refresh
   */
  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  /**
   * Export performance report
   */
  const exportReport = () => {
    if (!performanceStats) return;
    
    const report = {
      timestamp: new Date().toISOString(),
      performance: performanceStats.report,
      cache: cacheStats,
      alerts: alertStats,
      recentAlerts: recentAlerts
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * Get performance status color
   */
  const getPerformanceStatus = () => {
    if (!performanceStats) return { color: 'gray', text: 'Loading...' };
    
    const avgTime = performanceStats.averageDisplayTime;
    
    if (avgTime <= 100) {
      return { color: 'green', text: 'Excellent' };
    } else if (avgTime <= 150) {
      return { color: 'yellow', text: 'Good' };
    } else if (avgTime <= 500) {
      return { color: 'orange', text: 'Warning' };
    } else {
      return { color: 'red', text: 'Critical' };
    }
  };

  /**
   * Get cache status color
   */
  const getCacheStatus = () => {
    if (!cacheStats) return { color: 'gray', text: 'Loading...' };
    
    const hitRate = cacheStats.hitRate;
    
    if (hitRate >= 90) {
      return { color: 'green', text: 'Excellent' };
    } else if (hitRate >= 70) {
      return { color: 'yellow', text: 'Good' };
    } else if (hitRate >= 50) {
      return { color: 'orange', text: 'Warning' };
    } else {
      return { color: 'red', text: 'Critical' };
    }
  };

  /**
   * Format time in milliseconds
   */
  const formatTime = (ms) => {
    if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  /**
   * Format percentage
   */
  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`;
  };

  /**
   * Get alert severity badge
   */
  const getAlertBadge = (severity) => {
    const variants = {
      critical: 'destructive',
      warning: 'secondary',
      info: 'outline'
    };
    
    return <Badge variant={variants[severity] || 'outline'}>{severity}</Badge>;
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={onToggle}
          variant="outline"
          size="sm"
          className="bg-white shadow-lg"
        >
          <Activity className="h-4 w-4 mr-2" />
          Performance
        </Button>
      </div>
    );
  }

  const perfStatus = getPerformanceStatus();
  const cacheStatus = getCacheStatus();

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Card className="bg-white shadow-xl border-2">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              Performance Monitor
            </CardTitle>
            <div className="flex items-center space-x-1">
              <Button
                onClick={toggleAutoRefresh}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                {autoRefresh ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              </Button>
              <Button
                onClick={handleManualRefresh}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
              <Button
                onClick={() => setIsExpanded(!isExpanded)}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                {isExpanded ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
              <Button
                onClick={onToggle}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {/* Quick Status Overview */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="text-center">
              <div className={`text-xs font-medium text-${perfStatus.color}-600`}>
                Display Time
              </div>
              <div className="text-lg font-bold">
                {performanceStats ? formatTime(performanceStats.averageDisplayTime) : '--'}
              </div>
              <Badge variant={perfStatus.color === 'green' ? 'default' : 'secondary'} className="text-xs">
                {perfStatus.text}
              </Badge>
            </div>
            
            <div className="text-center">
              <div className={`text-xs font-medium text-${cacheStatus.color}-600`}>
                Cache Hit Rate
              </div>
              <div className="text-lg font-bold">
                {cacheStats ? formatPercentage(cacheStats.hitRate) : '--'}
              </div>
              <Badge variant={cacheStatus.color === 'green' ? 'default' : 'secondary'} className="text-xs">
                {cacheStatus.text}
              </Badge>
            </div>
          </div>

          {/* Alert Summary */}
          {alertStats && (
            <div className="flex items-center justify-between mb-3 p-2 bg-gray-50 rounded">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span className="text-xs font-medium">Alerts (1h)</span>
              </div>
              <div className="flex items-center space-x-2">
                {alertStats.criticalAlerts > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {alertStats.criticalAlerts} Critical
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  {alertStats.recentAlerts} Total
                </Badge>
              </div>
            </div>
          )}

          {/* Expanded Details */}
          {isExpanded && (
            <div className="space-y-3">
              {/* Performance Details */}
              {performanceStats && (
                <div>
                  <h4 className="text-xs font-semibold mb-2 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    Performance Details
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-600">Median:</span>
                      <span className="ml-1 font-medium">{formatTime(performanceStats.medianDisplayTime)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">95th %:</span>
                      <span className="ml-1 font-medium">{formatTime(performanceStats.percentile95)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Operations:</span>
                      <span className="ml-1 font-medium">{performanceStats.totalOperations}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Errors:</span>
                      <span className="ml-1 font-medium">{formatPercentage(performanceStats.errorRate)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Cache Details */}
              {cacheStats && (
                <div>
                  <h4 className="text-xs font-semibold mb-2 flex items-center">
                    <Database className="h-3 w-3 mr-1" />
                    Cache Performance
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-600">Hits:</span>
                      <span className="ml-1 font-medium">{cacheStats.operationCounts.hits}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Misses:</span>
                      <span className="ml-1 font-medium">{cacheStats.operationCounts.misses}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Avg Hit:</span>
                      <span className="ml-1 font-medium">{formatTime(cacheStats.averageTimes.hit)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Cache Size:</span>
                      <span className="ml-1 font-medium">{cacheStats.cacheSize}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Performance Trends */}
              {performanceStats?.trends && (
                <div>
                  <h4 className="text-xs font-semibold mb-2 flex items-center">
                    {performanceStats.trends.trend === 'improving' ? (
                      <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                    ) : performanceStats.trends.trend === 'degrading' ? (
                      <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                    ) : (
                      <Activity className="h-3 w-3 mr-1 text-gray-500" />
                    )}
                    Trend Analysis
                  </h4>
                  <div className="text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <Badge 
                        variant={
                          performanceStats.trends.trend === 'improving' ? 'default' :
                          performanceStats.trends.trend === 'degrading' ? 'destructive' : 'outline'
                        }
                        className="text-xs"
                      >
                        {performanceStats.trends.trend}
                      </Badge>
                    </div>
                    {performanceStats.trends.percentageChange && (
                      <div className="flex justify-between mt-1">
                        <span className="text-gray-600">Change:</span>
                        <span className={`font-medium ${
                          performanceStats.trends.percentageChange > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {performanceStats.trends.percentageChange > 0 ? '+' : ''}
                          {performanceStats.trends.percentageChange.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Recent Alerts */}
              {recentAlerts.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold mb-2 flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Recent Alerts
                  </h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {recentAlerts.slice(0, 5).map((alert) => (
                      <div key={alert.id} className="flex items-center justify-between p-1 bg-gray-50 rounded text-xs">
                        <div className="flex-1 truncate">
                          <div className="font-medium truncate">{alert.type}</div>
                          <div className="text-gray-600 truncate">{alert.message}</div>
                        </div>
                        <div className="ml-2">
                          {getAlertBadge(alert.severity)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center space-x-1">
                  <Button
                    onClick={exportReport}
                    variant="outline"
                    size="sm"
                    className="text-xs h-6"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Export
                  </Button>
                </div>
                <div className="text-xs text-gray-500">
                  {autoRefresh ? `Auto-refresh: ${refreshInterval / 1000}s` : 'Manual refresh'}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceDashboard;