/**
 * Performance Dashboard Component
 * Real-time monitoring dashboard for fast order creation optimization
 * Requirements: 11.4 - Provide real-time dashboards showing system performance metrics
 */

import React, { useState, useEffect, useCallback } from 'react';
import { performanceMonitor } from '../utils/performanceMonitor';

const PerformanceDashboard = ({ isVisible = false, onClose }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');
  const [alertsEnabled, setAlertsEnabled] = useState(true);

  // Refresh dashboard data
  const refreshData = useCallback(() => {
    const data = performanceMonitor.getDashboardData();
    setDashboardData(data);
  }, []);

  // Set up auto-refresh
  useEffect(() => {
    if (!isVisible) return;

    refreshData();
    const interval = setInterval(refreshData, refreshInterval);
    return () => clearInterval(interval);
  }, [isVisible, refreshInterval, refreshData]);

  // Set up alert monitoring
  useEffect(() => {
    if (!alertsEnabled) return;

    const unsubscribe = performanceMonitor.onThresholdViolation((violation) => {
      // Show browser notification for critical violations
      if (violation.severity === 'critical' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('Performance Alert', {
            body: `Critical performance issue: ${violation.operationType} took ${violation.duration}ms (threshold: ${violation.threshold}ms)`,
            icon: '/favicon.ico'
          });
        }
      }
    });

    return unsubscribe;
  }, [alertsEnabled]);

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  if (!isVisible || !dashboardData) {
    return null;
  }

  const { summary, operationStats, recentViolations, responseTimeHistory, webVitals } = dashboardData;

  return (
    <div className="performance-dashboard-overlay">
      <div className="performance-dashboard">
        <div className="dashboard-header">
          <h2>🚀 Performance Dashboard</h2>
          <div className="dashboard-controls">
            <select 
              value={refreshInterval} 
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="refresh-select"
            >
              <option value={1000}>1s refresh</option>
              <option value={5000}>5s refresh</option>
              <option value={10000}>10s refresh</option>
              <option value={30000}>30s refresh</option>
            </select>
            <button 
              onClick={requestNotificationPermission}
              className="notification-btn"
              title="Enable notifications for critical alerts"
            >
              🔔
            </button>
            <button onClick={onClose} className="close-btn">✕</button>
          </div>
        </div>

        <div className="dashboard-content">
          {/* Summary Cards */}
          <div className="summary-cards">
            <div className="summary-card">
              <div className="card-header">
                <span className="card-title">System Health</span>
                <span className={`health-score ${getHealthScoreClass(summary.overallHealthScore)}`}>
                  {summary.overallHealthScore}%
                </span>
              </div>
              <div className="card-content">
                <div className="metric">
                  <span>Operations (1h):</span>
                  <span>{summary.totalOperations}</span>
                </div>
                <div className="metric">
                  <span>Avg Response:</span>
                  <span>{summary.averageResponseTime}ms</span>
                </div>
                <div className="metric">
                  <span>Violations:</span>
                  <span className={summary.thresholdViolations > 0 ? 'text-warning' : 'text-success'}>
                    {summary.thresholdViolations}
                  </span>
                </div>
              </div>
            </div>

            {/* Web Vitals Card */}
            <div className="summary-card">
              <div className="card-header">
                <span className="card-title">Core Web Vitals</span>
              </div>
              <div className="card-content">
                {webVitals.web_vital_lcp && (
                  <div className="metric">
                    <span>LCP:</span>
                    <span className={webVitals.web_vital_lcp.current > 2500 ? 'text-warning' : 'text-success'}>
                      {Math.round(webVitals.web_vital_lcp.current)}ms
                    </span>
                  </div>
                )}
                {webVitals.web_vital_fid && (
                  <div className="metric">
                    <span>FID:</span>
                    <span className={webVitals.web_vital_fid.current > 100 ? 'text-warning' : 'text-success'}>
                      {Math.round(webVitals.web_vital_fid.current)}ms
                    </span>
                  </div>
                )}
                {webVitals.web_vital_cls && (
                  <div className="metric">
                    <span>CLS:</span>
                    <span className={webVitals.web_vital_cls.current > 100 ? 'text-warning' : 'text-success'}>
                      {(webVitals.web_vital_cls.current / 1000).toFixed(3)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Operation Statistics */}
          <div className="operations-section">
            <h3>Operation Performance</h3>
            <div className="operations-grid">
              {Object.entries(operationStats).map(([operation, stats]) => (
                <div key={operation} className="operation-card">
                  <div className="operation-header">
                    <span className="operation-name">{formatOperationName(operation)}</span>
                    <span className={`trend-indicator ${getTrendClass(stats.recentTrend)}`}>
                      {getTrendIcon(stats.recentTrend)}
                    </span>
                  </div>
                  <div className="operation-stats">
                    <div className="stat">
                      <span>Avg:</span>
                      <span className={stats.averageDuration > stats.threshold ? 'text-warning' : 'text-success'}>
                        {stats.averageDuration}ms
                      </span>
                    </div>
                    <div className="stat">
                      <span>P95:</span>
                      <span>{Math.round(stats.p95Duration)}ms</span>
                    </div>
                    <div className="stat">
                      <span>Success:</span>
                      <span className={stats.successRate < 95 ? 'text-warning' : 'text-success'}>
                        {stats.successRate}%
                      </span>
                    </div>
                    <div className="stat">
                      <span>Count:</span>
                      <span>{stats.count}</span>
                    </div>
                  </div>
                  <div className="threshold-bar">
                    <div 
                      className="threshold-fill"
                      style={{ 
                        width: `${Math.min((stats.averageDuration / stats.threshold) * 100, 100)}%`,
                        backgroundColor: stats.averageDuration > stats.threshold ? '#ff6b6b' : '#51cf66'
                      }}
                    />
                    <span className="threshold-label">{stats.threshold}ms threshold</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Violations */}
          {recentViolations.length > 0 && (
            <div className="violations-section">
              <h3>Recent Performance Violations</h3>
              <div className="violations-list">
                {recentViolations.map((violation, index) => (
                  <div key={index} className={`violation-item severity-${violation.severity}`}>
                    <div className="violation-header">
                      <span className="violation-operation">{formatOperationName(violation.operationType)}</span>
                      <span className="violation-time">{formatTime(violation.violationTimestamp)}</span>
                    </div>
                    <div className="violation-details">
                      <span>Duration: {violation.duration}ms (threshold: {violation.threshold}ms)</span>
                      <span className={`severity-badge severity-${violation.severity}`}>
                        {violation.severity.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Response Time Chart */}
          <div className="chart-section">
            <h3>Response Time History</h3>
            <div className="chart-container">
              <ResponseTimeChart data={responseTimeHistory} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple response time chart component
const ResponseTimeChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="chart-placeholder">No data available</div>;
  }

  const maxDuration = Math.max(...data.map(d => d.duration));
  const chartHeight = 200;

  return (
    <div className="response-time-chart">
      <svg width="100%" height={chartHeight} className="chart-svg">
        {data.map((point, index) => {
          const x = (index / (data.length - 1)) * 100;
          const y = chartHeight - (point.duration / maxDuration) * (chartHeight - 20);
          const isViolation = point.duration > point.threshold;
          
          return (
            <g key={index}>
              <circle
                cx={`${x}%`}
                cy={y}
                r="3"
                fill={isViolation ? '#ff6b6b' : '#51cf66'}
                className="chart-point"
              />
              {index > 0 && (
                <line
                  x1={`${((index - 1) / (data.length - 1)) * 100}%`}
                  y1={chartHeight - (data[index - 1].duration / maxDuration) * (chartHeight - 20)}
                  x2={`${x}%`}
                  y2={y}
                  stroke="#666"
                  strokeWidth="1"
                />
              )}
            </g>
          );
        })}
      </svg>
      <div className="chart-legend">
        <span className="legend-item">
          <span className="legend-dot success"></span>
          Within Threshold
        </span>
        <span className="legend-item">
          <span className="legend-dot warning"></span>
          Threshold Violation
        </span>
      </div>
    </div>
  );
};

// Helper functions
const getHealthScoreClass = (score) => {
  if (score >= 95) return 'excellent';
  if (score >= 85) return 'good';
  if (score >= 70) return 'fair';
  return 'poor';
};

const getTrendClass = (trend) => {
  switch (trend) {
    case 'improving': return 'trend-improving';
    case 'degrading': return 'trend-degrading';
    default: return 'trend-stable';
  }
};

const getTrendIcon = (trend) => {
  switch (trend) {
    case 'improving': return '📈';
    case 'degrading': return '📉';
    default: return '➡️';
  }
};

const formatOperationName = (operation) => {
  return operation
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
};

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString();
};

export default PerformanceDashboard;