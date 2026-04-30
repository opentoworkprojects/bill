/**
 * Performance Reporting System
 * Generates comprehensive performance reports and analytics
 * Requirements: 11.4 - Generate performance reports with recommendations for optimization
 */

import { performanceMonitor } from './performanceMonitor';
import { performanceAlerting } from './performanceAlerting';

class PerformanceReportingSystem {
  constructor() {
    this.reportHistory = [];
    this.reportTemplates = new Map();
    this.initializeReportTemplates();
  }

  /**
   * Initialize default report templates
   */
  initializeReportTemplates() {
    // Executive Summary Report
    this.reportTemplates.set('executive', {
      name: 'Executive Performance Summary',
      sections: ['summary', 'health_score', 'key_metrics', 'recommendations'],
      timeRanges: ['1h', '24h', '7d'],
      format: 'summary'
    });

    // Technical Deep Dive Report
    this.reportTemplates.set('technical', {
      name: 'Technical Performance Analysis',
      sections: ['detailed_metrics', 'threshold_analysis', 'trend_analysis', 'bottlenecks'],
      timeRanges: ['1h', '24h', '7d', '30d'],
      format: 'detailed'
    });

    // Real-time Operations Report
    this.reportTemplates.set('operations', {
      name: 'Operations Performance Report',
      sections: ['current_status', 'alerts', 'system_health', 'capacity_analysis'],
      timeRanges: ['15m', '1h', '4h'],
      format: 'operational'
    });

    // User Experience Report
    this.reportTemplates.set('ux', {
      name: 'User Experience Performance Report',
      sections: ['ui_responsiveness', 'page_load_times', 'user_journey_analysis', 'satisfaction_metrics'],
      timeRanges: ['1h', '24h', '7d'],
      format: 'user_focused'
    });
  }

  /**
   * Generate a comprehensive performance report
   */
  generateReport(templateName = 'executive', timeRange = '1h', options = {}) {
    const template = this.reportTemplates.get(templateName);
    if (!template) {
      throw new Error(`Unknown report template: ${templateName}`);
    }

    const reportId = `report_${templateName}_${Date.now()}`;
    const timeRangeMs = this.parseTimeRange(timeRange);
    const dashboardData = performanceMonitor.getDashboardData();
    const alertStats = performanceAlerting.getAlertStats(timeRangeMs);

    const report = {
      id: reportId,
      template: templateName,
      templateName: template.name,
      timeRange: timeRange,
      generatedAt: new Date().toISOString(),
      generatedBy: options.generatedBy || 'system',
      sections: {},
      metadata: {
        dataPoints: dashboardData.summary.totalOperations,
        alertCount: alertStats.total,
        healthScore: dashboardData.summary.overallHealthScore
      }
    };

    // Generate each section based on template
    template.sections.forEach(sectionName => {
      report.sections[sectionName] = this.generateSection(sectionName, dashboardData, alertStats, timeRangeMs);
    });

    // Add executive summary if not already included
    if (!report.sections.summary && templateName !== 'operations') {
      report.sections.summary = this.generateExecutiveSummary(dashboardData, alertStats);
    }

    // Store report in history
    this.reportHistory.push(report);
    if (this.reportHistory.length > 50) {
      this.reportHistory.splice(0, this.reportHistory.length - 50);
    }

    return report;
  }

  /**
   * Generate a specific report section
   */
  generateSection(sectionName, dashboardData, alertStats, timeRangeMs) {
    switch (sectionName) {
      case 'summary':
        return this.generateExecutiveSummary(dashboardData, alertStats);
      
      case 'health_score':
        return this.generateHealthScoreSection(dashboardData);
      
      case 'key_metrics':
        return this.generateKeyMetricsSection(dashboardData);
      
      case 'recommendations':
        return this.generateRecommendationsSection(dashboardData, alertStats);
      
      case 'detailed_metrics':
        return this.generateDetailedMetricsSection(dashboardData);
      
      case 'threshold_analysis':
        return this.generateThresholdAnalysisSection(dashboardData, alertStats);
      
      case 'trend_analysis':
        return this.generateTrendAnalysisSection(dashboardData);
      
      case 'bottlenecks':
        return this.generateBottlenecksSection(dashboardData);
      
      case 'current_status':
        return this.generateCurrentStatusSection(dashboardData);
      
      case 'alerts':
        return this.generateAlertsSection(alertStats);
      
      case 'system_health':
        return this.generateSystemHealthSection(dashboardData);
      
      case 'capacity_analysis':
        return this.generateCapacityAnalysisSection(dashboardData);
      
      case 'ui_responsiveness':
        return this.generateUIResponsivenessSection(dashboardData);
      
      case 'page_load_times':
        return this.generatePageLoadTimesSection(dashboardData);
      
      case 'user_journey_analysis':
        return this.generateUserJourneySection(dashboardData);
      
      case 'satisfaction_metrics':
        return this.generateSatisfactionMetricsSection(dashboardData);
      
      default:
        return { error: `Unknown section: ${sectionName}` };
    }
  }

  /**
   * Generate executive summary section
   */
  generateExecutiveSummary(dashboardData, alertStats) {
    const { summary } = dashboardData;
    
    return {
      title: 'Executive Summary',
      healthScore: summary.overallHealthScore,
      status: this.getOverallStatus(summary.overallHealthScore, alertStats.total),
      keyFindings: [
        `System processed ${summary.totalOperations} operations with ${summary.averageResponseTime}ms average response time`,
        `Overall health score: ${summary.overallHealthScore}% (${this.getHealthScoreDescription(summary.overallHealthScore)})`,
        `${alertStats.total} performance alerts generated (${alertStats.bySeverity.critical} critical, ${alertStats.bySeverity.high} high priority)`,
        summary.thresholdViolations === 0 
          ? 'All operations within performance thresholds' 
          : `${summary.thresholdViolations} threshold violations detected`
      ],
      recommendations: this.getTopRecommendations(dashboardData, alertStats, 3)
    };
  }

  /**
   * Generate health score section
   */
  generateHealthScoreSection(dashboardData) {
    const { summary, operationStats } = dashboardData;
    
    const operationHealth = Object.entries(operationStats).map(([operation, stats]) => ({
      operation,
      successRate: stats.successRate,
      averageResponseTime: stats.averageDuration,
      trend: stats.recentTrend,
      status: stats.successRate >= 95 ? 'healthy' : stats.successRate >= 85 ? 'warning' : 'critical'
    }));

    return {
      title: 'System Health Analysis',
      overallScore: summary.overallHealthScore,
      scoreBreakdown: {
        responseTime: this.calculateResponseTimeScore(summary.averageResponseTime),
        successRate: this.calculateSuccessRateScore(operationStats),
        stability: this.calculateStabilityScore(operationStats),
        availability: this.calculateAvailabilityScore(operationStats)
      },
      operationHealth,
      healthTrend: this.calculateHealthTrend(dashboardData)
    };
  }

  /**
   * Generate key metrics section
   */
  generateKeyMetricsSection(dashboardData) {
    const { summary, operationStats, webVitals } = dashboardData;
    
    return {
      title: 'Key Performance Metrics',
      coreMetrics: {
        totalOperations: summary.totalOperations,
        averageResponseTime: `${summary.averageResponseTime}ms`,
        thresholdViolations: summary.thresholdViolations,
        healthScore: `${summary.overallHealthScore}%`
      },
      operationMetrics: Object.entries(operationStats).map(([operation, stats]) => ({
        operation: this.formatOperationName(operation),
        averageTime: `${stats.averageDuration}ms`,
        p95Time: `${Math.round(stats.p95Duration)}ms`,
        successRate: `${stats.successRate}%`,
        count: stats.count,
        trend: stats.recentTrend
      })),
      webVitals: {
        lcp: webVitals.web_vital_lcp ? `${Math.round(webVitals.web_vital_lcp.current)}ms` : 'N/A',
        fid: webVitals.web_vital_fid ? `${Math.round(webVitals.web_vital_fid.current)}ms` : 'N/A',
        cls: webVitals.web_vital_cls ? (webVitals.web_vital_cls.current / 1000).toFixed(3) : 'N/A'
      }
    };
  }

  /**
   * Generate recommendations section
   */
  generateRecommendationsSection(dashboardData, alertStats) {
    const recommendations = [];
    const { summary, operationStats } = dashboardData;

    // Health score recommendations
    if (summary.overallHealthScore < 85) {
      recommendations.push({
        priority: 'high',
        category: 'system_health',
        title: 'Improve Overall System Health',
        description: `System health score is ${summary.overallHealthScore}%, below the recommended 85% threshold`,
        actions: [
          'Investigate operations with low success rates',
          'Optimize slow-performing operations',
          'Review and adjust performance thresholds'
        ]
      });
    }

    // Response time recommendations
    if (summary.averageResponseTime > 300) {
      recommendations.push({
        priority: 'medium',
        category: 'response_time',
        title: 'Optimize Response Times',
        description: `Average response time of ${summary.averageResponseTime}ms exceeds optimal range`,
        actions: [
          'Implement caching for frequently accessed data',
          'Optimize database queries',
          'Consider CDN for static assets'
        ]
      });
    }

    // Operation-specific recommendations
    Object.entries(operationStats).forEach(([operation, stats]) => {
      if (stats.successRate < 95) {
        recommendations.push({
          priority: stats.successRate < 85 ? 'high' : 'medium',
          category: 'operation_reliability',
          title: `Improve ${this.formatOperationName(operation)} Reliability`,
          description: `Success rate of ${stats.successRate}% is below target`,
          actions: [
            'Investigate failure causes',
            'Implement retry mechanisms',
            'Add error handling and recovery'
          ]
        });
      }

      if (stats.recentTrend === 'degrading') {
        recommendations.push({
          priority: 'medium',
          category: 'performance_trend',
          title: `Address ${this.formatOperationName(operation)} Performance Degradation`,
          description: 'Recent performance trend shows degradation',
          actions: [
            'Monitor resource usage',
            'Check for memory leaks',
            'Review recent code changes'
          ]
        });
      }
    });

    // Alert-based recommendations
    if (alertStats.bySeverity.critical > 0) {
      recommendations.push({
        priority: 'critical',
        category: 'alerts',
        title: 'Address Critical Performance Alerts',
        description: `${alertStats.bySeverity.critical} critical alerts require immediate attention`,
        actions: [
          'Review critical alert details',
          'Implement immediate fixes',
          'Set up monitoring for early detection'
        ]
      });
    }

    return {
      title: 'Performance Recommendations',
      summary: `${recommendations.length} recommendations identified`,
      recommendations: recommendations.sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
    };
  }

  /**
   * Generate detailed metrics section
   */
  generateDetailedMetricsSection(dashboardData) {
    const { operationStats, responseTimeHistory } = dashboardData;
    
    return {
      title: 'Detailed Performance Metrics',
      operationDetails: Object.entries(operationStats).map(([operation, stats]) => ({
        operation: this.formatOperationName(operation),
        statistics: {
          count: stats.count,
          averageDuration: stats.averageDuration,
          minDuration: stats.minDuration,
          maxDuration: stats.maxDuration,
          p95Duration: Math.round(stats.p95Duration),
          successRate: stats.successRate,
          threshold: stats.threshold
        },
        performance: {
          withinThreshold: ((stats.count * stats.successRate / 100) / stats.count * 100).toFixed(1) + '%',
          averageOverhead: Math.max(0, stats.averageDuration - stats.threshold),
          trend: stats.recentTrend
        }
      })),
      timeSeriesData: this.analyzeTimeSeriesData(responseTimeHistory),
      distributionAnalysis: this.analyzeResponseTimeDistribution(operationStats)
    };
  }

  /**
   * Generate UI responsiveness section
   */
  generateUIResponsivenessSection(dashboardData) {
    const { operationStats } = dashboardData;
    
    const uiOperations = Object.entries(operationStats).filter(([operation]) => 
      operation.startsWith('ui_')
    );

    return {
      title: 'UI Responsiveness Analysis',
      summary: {
        totalUIOperations: uiOperations.reduce((sum, [, stats]) => sum + stats.count, 0),
        averageUIResponseTime: uiOperations.length > 0 
          ? Math.round(uiOperations.reduce((sum, [, stats]) => sum + stats.averageDuration, 0) / uiOperations.length)
          : 0
      },
      operationBreakdown: uiOperations.map(([operation, stats]) => ({
        interaction: this.formatOperationName(operation),
        averageTime: `${stats.averageDuration}ms`,
        threshold: `${stats.threshold}ms`,
        successRate: `${stats.successRate}%`,
        userImpact: this.assessUserImpact(operation, stats.averageDuration, stats.threshold)
      })),
      recommendations: this.generateUIRecommendations(uiOperations)
    };
  }

  /**
   * Helper methods
   */
  parseTimeRange(timeRange) {
    const units = {
      'm': 60 * 1000,
      'h': 60 * 60 * 1000,
      'd': 24 * 60 * 60 * 1000
    };
    
    const match = timeRange.match(/^(\d+)([mhd])$/);
    if (!match) return 60 * 60 * 1000; // Default 1 hour
    
    const [, amount, unit] = match;
    return parseInt(amount) * units[unit];
  }

  getOverallStatus(healthScore, alertCount) {
    if (alertCount > 0 && healthScore < 70) return 'critical';
    if (healthScore < 85) return 'warning';
    return 'healthy';
  }

  getHealthScoreDescription(score) {
    if (score >= 95) return 'Excellent';
    if (score >= 85) return 'Good';
    if (score >= 70) return 'Fair';
    return 'Poor';
  }

  formatOperationName(operation) {
    return operation
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  getTopRecommendations(dashboardData, alertStats, count = 3) {
    const recommendations = this.generateRecommendationsSection(dashboardData, alertStats).recommendations;
    return recommendations.slice(0, count).map(r => r.title);
  }

  calculateResponseTimeScore(avgResponseTime) {
    if (avgResponseTime <= 200) return 100;
    if (avgResponseTime <= 500) return 85;
    if (avgResponseTime <= 1000) return 70;
    return 50;
  }

  calculateSuccessRateScore(operationStats) {
    const operations = Object.values(operationStats);
    if (operations.length === 0) return 100;
    
    const avgSuccessRate = operations.reduce((sum, op) => sum + op.successRate, 0) / operations.length;
    return Math.round(avgSuccessRate);
  }

  calculateStabilityScore(operationStats) {
    const operations = Object.values(operationStats);
    const stableOperations = operations.filter(op => op.recentTrend === 'stable' || op.recentTrend === 'improving').length;
    return operations.length > 0 ? Math.round((stableOperations / operations.length) * 100) : 100;
  }

  calculateAvailabilityScore(operationStats) {
    // Simplified availability calculation based on success rates
    return this.calculateSuccessRateScore(operationStats);
  }

  calculateHealthTrend(dashboardData) {
    // Simplified trend calculation
    const { operationStats } = dashboardData;
    const operations = Object.values(operationStats);
    const improvingCount = operations.filter(op => op.recentTrend === 'improving').length;
    const degradingCount = operations.filter(op => op.recentTrend === 'degrading').length;
    
    if (improvingCount > degradingCount) return 'improving';
    if (degradingCount > improvingCount) return 'degrading';
    return 'stable';
  }

  analyzeTimeSeriesData(responseTimeHistory) {
    if (!responseTimeHistory || responseTimeHistory.length === 0) {
      return { message: 'No time series data available' };
    }

    const durations = responseTimeHistory.map(point => point.duration);
    return {
      dataPoints: durations.length,
      trend: this.calculateTrendFromSeries(durations),
      volatility: this.calculateVolatility(durations),
      peaks: this.findPeaks(responseTimeHistory)
    };
  }

  analyzeResponseTimeDistribution(operationStats) {
    const operations = Object.entries(operationStats);
    return operations.map(([operation, stats]) => ({
      operation: this.formatOperationName(operation),
      distribution: {
        fast: stats.successRate, // Simplified - operations within threshold
        slow: 100 - stats.successRate,
        average: stats.averageDuration,
        p95: Math.round(stats.p95Duration)
      }
    }));
  }

  assessUserImpact(operation, duration, threshold) {
    const ratio = duration / threshold;
    if (ratio <= 1) return 'minimal';
    if (ratio <= 1.5) return 'noticeable';
    if (ratio <= 2) return 'significant';
    return 'severe';
  }

  generateUIRecommendations(uiOperations) {
    const recommendations = [];
    
    uiOperations.forEach(([operation, stats]) => {
      if (stats.averageDuration > stats.threshold) {
        recommendations.push(`Optimize ${this.formatOperationName(operation)} - currently ${stats.averageDuration}ms (target: ${stats.threshold}ms)`);
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('UI performance is within acceptable thresholds');
    }

    return recommendations;
  }

  calculateTrendFromSeries(values) {
    if (values.length < 2) return 'stable';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;
    
    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (change > 10) return 'degrading';
    if (change < -10) return 'improving';
    return 'stable';
  }

  calculateVolatility(values) {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  findPeaks(responseTimeHistory) {
    const peaks = [];
    for (let i = 1; i < responseTimeHistory.length - 1; i++) {
      const current = responseTimeHistory[i];
      const prev = responseTimeHistory[i - 1];
      const next = responseTimeHistory[i + 1];
      
      if (current.duration > prev.duration && current.duration > next.duration && current.duration > current.threshold) {
        peaks.push({
          timestamp: current.timestamp,
          duration: current.duration,
          operationType: current.operationType
        });
      }
    }
    return peaks.slice(-5); // Return last 5 peaks
  }

  /**
   * Export report to different formats
   */
  exportReport(report, format = 'json') {
    switch (format) {
      case 'json':
        return JSON.stringify(report, null, 2);
      
      case 'csv':
        return this.convertToCSV(report);
      
      case 'html':
        return this.convertToHTML(report);
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  convertToCSV(report) {
    // Simplified CSV export for key metrics
    const lines = ['Metric,Value,Threshold,Status'];
    
    if (report.sections.key_metrics) {
      const metrics = report.sections.key_metrics.operationMetrics;
      metrics.forEach(metric => {
        lines.push(`${metric.operation},${metric.averageTime},${metric.threshold || 'N/A'},${metric.successRate}`);
      });
    }
    
    return lines.join('\n');
  }

  convertToHTML(report) {
    // Simplified HTML export
    let html = `
      <html>
        <head><title>${report.templateName} - ${report.generatedAt}</title></head>
        <body>
          <h1>${report.templateName}</h1>
          <p>Generated: ${new Date(report.generatedAt).toLocaleString()}</p>
          <p>Health Score: ${report.metadata.healthScore}%</p>
    `;
    
    Object.entries(report.sections).forEach(([sectionName, section]) => {
      html += `<h2>${section.title || sectionName}</h2>`;
      html += `<pre>${JSON.stringify(section, null, 2)}</pre>`;
    });
    
    html += '</body></html>';
    return html;
  }

  /**
   * Get report history
   */
  getReportHistory() {
    return this.reportHistory;
  }

  /**
   * Get available report templates
   */
  getReportTemplates() {
    return Object.fromEntries(this.reportTemplates);
  }
}

// Singleton instance
export const performanceReporting = new PerformanceReportingSystem();

// Convenience functions
export const generateReport = (template, timeRange, options) => 
  performanceReporting.generateReport(template, timeRange, options);

export const exportReport = (report, format) => 
  performanceReporting.exportReport(report, format);

export const getReportHistory = () => 
  performanceReporting.getReportHistory();

export const getReportTemplates = () => 
  performanceReporting.getReportTemplates();

// Global access for debugging
if (typeof window !== 'undefined') {
  window.performanceReporting = {
    generate: generateReport,
    export: exportReport,
    history: getReportHistory,
    templates: getReportTemplates,
    reporting: performanceReporting
  };
}

export default performanceReporting;