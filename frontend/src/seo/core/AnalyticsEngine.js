/**
 * Analytics Engine - Handles performance monitoring and reporting
 * Implements Requirements: 6.4, 6.5, 6.6
 */

import SearchConsoleAPI from './SearchConsoleAPI.js';
import KeywordTracker from './KeywordTracker.js';

class AnalyticsEngine {
  constructor(config = {}) {
    this.searchConsoleAPI = new SearchConsoleAPI(config);
    this.keywordTracker = new KeywordTracker(config);
    this.reportingConfig = {
      reportFrequency: 'monthly',
      alertThresholds: {
        organicTrafficDrop: 0.15, // 15% drop
        conversionRateDrop: 0.10, // 10% drop
        crawlErrorIncrease: 5, // 5 new errors
        indexingIssues: 10 // 10 pages not indexed
      }
    };
    this.performanceHistory = new Map();
  }

  /**
   * Track organic traffic and conversion metrics
   * @param {Object} dateRange - Date range for tracking
   * @returns {Promise<Object>} Traffic and conversion data
   */
  async trackOrganicTrafficAndConversions(dateRange = {}) {
    const endDate = dateRange.endDate || this.getDateString(-1);
    const startDate = dateRange.startDate || this.getDateString(-30);

    try {
      // Get search performance data
      const searchData = await this.searchConsoleAPI.getSearchPerformance({
        startDate,
        endDate
      });

      // Get page performance data
      const pageData = await this.searchConsoleAPI.getPagePerformance({
        startDate,
        endDate
      });

      // Calculate traffic metrics
      const trafficMetrics = this.calculateTrafficMetrics(searchData, pageData);

      // Get conversion data (mock for demo)
      const conversionMetrics = this.getConversionMetrics(startDate, endDate);

      // Combine and analyze
      const organicPerformance = {
        dateRange: { startDate, endDate },
        traffic: trafficMetrics,
        conversions: conversionMetrics,
        performance: this.calculatePerformanceScores(trafficMetrics, conversionMetrics),
        trends: await this.calculateTrafficTrends(startDate, endDate),
        generatedAt: new Date().toISOString()
      };

      // Store in performance history
      this.performanceHistory.set(endDate, organicPerformance);

      return organicPerformance;
    } catch (error) {
      console.error('Failed to track organic traffic and conversions:', error);
      return null;
    }
  }

  /**
   * Calculate traffic metrics from search data
   * @param {Object} searchData - Search Console data
   * @param {Object} pageData - Page performance data
   * @returns {Object} Traffic metrics
   */
  calculateTrafficMetrics(searchData, pageData) {
    const metrics = {
      totalClicks: searchData.totalClicks || 0,
      totalImpressions: searchData.totalImpressions || 0,
      averageCTR: searchData.averageCTR || 0,
      averagePosition: searchData.averagePosition || 0,
      totalQueries: searchData.queryCount || 0,
      topPages: [],
      topQueries: [],
      deviceBreakdown: this.getMockDeviceBreakdown(),
      countryBreakdown: this.getMockCountryBreakdown()
    };

    // Process top performing pages
    if (pageData && pageData.pages) {
      metrics.topPages = pageData.pages
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10)
        .map(page => ({
          url: page.url,
          clicks: page.clicks,
          impressions: page.impressions,
          ctr: page.ctr,
          position: page.position
        }));
    }

    // Process top performing queries
    if (searchData.queries) {
      metrics.topQueries = searchData.queries
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10)
        .map(query => ({
          query: query.query,
          clicks: query.clicks,
          impressions: query.impressions,
          ctr: query.ctr,
          position: query.position
        }));
    }

    return metrics;
  }

  /**
   * Get mock device breakdown for demo
   * @returns {Object} Device breakdown data
   */
  getMockDeviceBreakdown() {
    return {
      desktop: { clicks: 450, impressions: 7200, ctr: 0.0625 },
      mobile: { clicks: 380, impressions: 6800, ctr: 0.0559 },
      tablet: { clicks: 85, impressions: 1500, ctr: 0.0567 }
    };
  }

  /**
   * Get mock country breakdown for demo
   * @returns {Object} Country breakdown data
   */
  getMockCountryBreakdown() {
    return {
      'India': { clicks: 520, impressions: 8900, ctr: 0.0584 },
      'United States': { clicks: 180, impressions: 3200, ctr: 0.0563 },
      'United Kingdom': { clicks: 95, impressions: 1800, ctr: 0.0528 },
      'Canada': { clicks: 67, impressions: 1200, ctr: 0.0558 },
      'Australia': { clicks: 53, impressions: 900, ctr: 0.0589 }
    };
  }

  /**
   * Get conversion metrics (mock for demo)
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {Object} Conversion metrics
   */
  getConversionMetrics(startDate, endDate) {
    // Mock conversion data for demo
    return {
      totalConversions: 45,
      conversionRate: 0.049, // 4.9%
      organicConversions: 38,
      organicConversionRate: 0.041, // 4.1%
      goalCompletions: {
        signups: 28,
        demoRequests: 12,
        contactForms: 5
      },
      conversionsBySource: {
        organic: 38,
        direct: 4,
        referral: 3
      },
      averageSessionDuration: 185, // seconds
      bounceRate: 0.34, // 34%
      pagesPerSession: 2.8
    };
  }

  /**
   * Calculate performance scores
   * @param {Object} trafficMetrics - Traffic metrics
   * @param {Object} conversionMetrics - Conversion metrics
   * @returns {Object} Performance scores
   */
  calculatePerformanceScores(trafficMetrics, conversionMetrics) {
    const scores = {
      overall: 0,
      traffic: 0,
      engagement: 0,
      conversion: 0,
      technical: 0
    };

    // Traffic score (based on clicks and CTR)
    const trafficScore = Math.min(100, (trafficMetrics.totalClicks / 1000) * 50 + 
                                       (trafficMetrics.averageCTR * 1000));
    scores.traffic = Math.round(trafficScore);

    // Engagement score (based on session metrics)
    const engagementScore = Math.min(100, 
      (conversionMetrics.averageSessionDuration / 300) * 30 +
      ((1 - conversionMetrics.bounceRate) * 40) +
      (conversionMetrics.pagesPerSession / 5) * 30
    );
    scores.engagement = Math.round(engagementScore);

    // Conversion score
    const conversionScore = Math.min(100, conversionMetrics.conversionRate * 2000);
    scores.conversion = Math.round(conversionScore);

    // Technical score (based on position and indexing)
    const technicalScore = Math.min(100, 
      (20 - Math.min(20, trafficMetrics.averagePosition)) * 5
    );
    scores.technical = Math.round(technicalScore);

    // Overall score (weighted average)
    scores.overall = Math.round(
      scores.traffic * 0.3 +
      scores.engagement * 0.25 +
      scores.conversion * 0.25 +
      scores.technical * 0.2
    );

    return scores;
  }

  /**
   * Calculate traffic trends compared to previous period
   * @param {string} startDate - Current period start
   * @param {string} endDate - Current period end
   * @returns {Promise<Object>} Traffic trends
   */
  async calculateTrafficTrends(startDate, endDate) {
    try {
      // Calculate previous period dates
      const currentStart = new Date(startDate);
      const currentEnd = new Date(endDate);
      const periodLength = currentEnd - currentStart;
      
      const previousEnd = new Date(currentStart.getTime() - 1);
      const previousStart = new Date(previousEnd.getTime() - periodLength);

      // Get previous period data
      const previousData = await this.searchConsoleAPI.getSearchPerformance({
        startDate: previousStart.toISOString().split('T')[0],
        endDate: previousEnd.toISOString().split('T')[0]
      });

      // Get current period data
      const currentData = await this.searchConsoleAPI.getSearchPerformance({
        startDate,
        endDate
      });

      // Calculate trends
      const trends = {
        clicks: this.calculateTrendPercentage(currentData.totalClicks, previousData.totalClicks),
        impressions: this.calculateTrendPercentage(currentData.totalImpressions, previousData.totalImpressions),
        ctr: this.calculateTrendPercentage(currentData.averageCTR, previousData.averageCTR),
        position: this.calculatePositionTrend(currentData.averagePosition, previousData.averagePosition),
        queries: this.calculateTrendPercentage(currentData.queryCount, previousData.queryCount)
      };

      return trends;
    } catch (error) {
      console.error('Failed to calculate traffic trends:', error);
      return null;
    }
  }

  /**
   * Calculate trend percentage
   * @param {number} current - Current value
   * @param {number} previous - Previous value
   * @returns {Object} Trend data
   */
  calculateTrendPercentage(current, previous) {
    if (!previous || previous === 0) {
      return { change: 0, percentage: 0, direction: 'stable' };
    }

    const change = current - previous;
    const percentage = (change / previous) * 100;
    const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';

    return {
      change: Math.round(change),
      percentage: Math.round(percentage * 100) / 100,
      direction
    };
  }

  /**
   * Calculate position trend (lower is better for positions)
   * @param {number} current - Current position
   * @param {number} previous - Previous position
   * @returns {Object} Position trend data
   */
  calculatePositionTrend(current, previous) {
    if (!previous || previous === 0) {
      return { change: 0, percentage: 0, direction: 'stable' };
    }

    const change = previous - current; // Reversed for positions
    const percentage = (change / previous) * 100;
    const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';

    return {
      change: Math.round(change * 100) / 100,
      percentage: Math.round(percentage * 100) / 100,
      direction
    };
  }

  /**
   * Generate monthly SEO performance report
   * @param {Object} options - Report options
   * @returns {Promise<Object>} Monthly report
   */
  async generateMonthlyReport(options = {}) {
    const reportDate = options.date || new Date();
    const year = reportDate.getFullYear();
    const month = reportDate.getMonth();

    // Calculate date range for the month
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

    try {
      // Gather all performance data
      const [
        organicPerformance,
        keywordReport,
        indexingStatus,
        crawlErrors
      ] = await Promise.all([
        this.trackOrganicTrafficAndConversions({ startDate, endDate }),
        this.keywordTracker.getKeywordReport({ days: 30 }),
        this.searchConsoleAPI.getIndexingStatus(),
        this.searchConsoleAPI.getCrawlErrors()
      ]);

      // Generate executive summary
      const executiveSummary = this.generateExecutiveSummary(
        organicPerformance,
        keywordReport,
        indexingStatus
      );

      // Generate recommendations
      const recommendations = this.generateMonthlyRecommendations(
        organicPerformance,
        keywordReport,
        crawlErrors
      );

      const report = {
        reportType: 'monthly',
        reportDate: reportDate.toISOString(),
        period: { startDate, endDate },
        executiveSummary,
        organicPerformance,
        keywordAnalysis: keywordReport,
        technicalSEO: {
          indexingStatus,
          crawlErrors
        },
        recommendations,
        generatedAt: new Date().toISOString()
      };

      return report;
    } catch (error) {
      console.error('Failed to generate monthly report:', error);
      return null;
    }
  }

  /**
   * Generate executive summary for report
   * @param {Object} organicPerformance - Organic performance data
   * @param {Object} keywordReport - Keyword report data
   * @param {Object} indexingStatus - Indexing status data
   * @returns {Object} Executive summary
   */
  generateExecutiveSummary(organicPerformance, keywordReport, indexingStatus) {
    const summary = {
      highlights: [],
      concerns: [],
      keyMetrics: {},
      overallHealth: 'good'
    };

    if (organicPerformance) {
      // Key metrics
      summary.keyMetrics = {
        totalClicks: organicPerformance.traffic.totalClicks,
        totalImpressions: organicPerformance.traffic.totalImpressions,
        averageCTR: organicPerformance.traffic.averageCTR,
        averagePosition: organicPerformance.traffic.averagePosition,
        conversionRate: organicPerformance.conversions.organicConversionRate,
        overallScore: organicPerformance.performance.overall
      };

      // Highlights
      if (organicPerformance.trends) {
        if (organicPerformance.trends.clicks.direction === 'up') {
          summary.highlights.push(`Organic clicks increased by ${organicPerformance.trends.clicks.percentage}%`);
        }
        if (organicPerformance.trends.position.direction === 'up') {
          summary.highlights.push(`Average position improved by ${Math.abs(organicPerformance.trends.position.change)} positions`);
        }
      }

      // Concerns
      if (organicPerformance.performance.overall < 60) {
        summary.concerns.push('Overall SEO performance score is below target (60+)');
        summary.overallHealth = 'needs-attention';
      }
    }

    if (keywordReport && keywordReport.dailyTracking) {
      const declined = keywordReport.dailyTracking.summary.declined;
      if (declined > 5) {
        summary.concerns.push(`${declined} keywords experienced ranking declines`);
      }

      const improved = keywordReport.dailyTracking.summary.improved;
      if (improved > 0) {
        summary.highlights.push(`${improved} keywords improved in rankings`);
      }
    }

    if (indexingStatus && indexingStatus.crawlErrors) {
      const totalErrors = indexingStatus.crawlErrors.totalErrors;
      if (totalErrors > 10) {
        summary.concerns.push(`${totalErrors} crawl errors detected`);
        summary.overallHealth = 'needs-attention';
      }
    }

    return summary;
  }

  /**
   * Generate monthly recommendations
   * @param {Object} organicPerformance - Organic performance data
   * @param {Object} keywordReport - Keyword report data
   * @param {Object} crawlErrors - Crawl error data
   * @returns {Array} Recommendations
   */
  generateMonthlyRecommendations(organicPerformance, keywordReport, crawlErrors) {
    const recommendations = [];

    // Performance-based recommendations
    if (organicPerformance) {
      if (organicPerformance.performance.traffic < 70) {
        recommendations.push({
          category: 'traffic',
          priority: 'high',
          title: 'Improve Organic Traffic',
          description: 'Focus on content optimization and keyword targeting to increase organic clicks',
          actions: [
            'Optimize underperforming pages for target keywords',
            'Create new content for high-volume keywords',
            'Improve meta titles and descriptions for better CTR'
          ]
        });
      }

      if (organicPerformance.performance.conversion < 60) {
        recommendations.push({
          category: 'conversion',
          priority: 'high',
          title: 'Optimize Conversion Rate',
          description: 'Improve landing page experience and conversion funnel',
          actions: [
            'A/B test landing page elements',
            'Improve call-to-action placement and copy',
            'Optimize page load speed and user experience'
          ]
        });
      }
    }

    // Keyword-based recommendations
    if (keywordReport && keywordReport.recommendations) {
      const highPriorityKeywords = keywordReport.recommendations
        .filter(rec => rec.priority === 'high')
        .slice(0, 3);

      if (highPriorityKeywords.length > 0) {
        recommendations.push({
          category: 'keywords',
          priority: 'high',
          title: 'Address High-Priority Keyword Issues',
          description: 'Focus on keywords with significant ranking changes or opportunities',
          actions: highPriorityKeywords.map(rec => rec.message)
        });
      }
    }

    // Technical recommendations
    if (crawlErrors && crawlErrors.totalErrors > 5) {
      recommendations.push({
        category: 'technical',
        priority: 'medium',
        title: 'Fix Technical SEO Issues',
        description: 'Address crawl errors and indexing issues',
        actions: [
          'Fix 404 errors and broken links',
          'Resolve server errors',
          'Update and resubmit sitemap',
          'Monitor indexing status regularly'
        ]
      });
    }

    // Content recommendations
    recommendations.push({
      category: 'content',
      priority: 'medium',
      title: 'Content Strategy Enhancement',
      description: 'Expand content coverage and improve existing content',
      actions: [
        'Create content for identified keyword opportunities',
        'Update and refresh existing high-performing content',
        'Improve internal linking between related content',
        'Add more comprehensive guides and tutorials'
      ]
    });

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Monitor crawl errors and indexing status
   * @returns {Promise<Object>} Crawl and indexing monitoring results
   */
  async monitorCrawlErrorsAndIndexing() {
    try {
      const [crawlErrors, sitemapStatus] = await Promise.all([
        this.searchConsoleAPI.getCrawlErrors(),
        this.searchConsoleAPI.getSitemapStatus()
      ]);

      const monitoring = {
        crawlErrors,
        sitemapStatus,
        alerts: [],
        recommendations: [],
        lastChecked: new Date().toISOString()
      };

      // Check for alerts
      if (crawlErrors && crawlErrors.totalErrors > this.reportingConfig.alertThresholds.crawlErrorIncrease) {
        monitoring.alerts.push({
          type: 'crawl_errors',
          severity: 'high',
          message: `High number of crawl errors detected: ${crawlErrors.totalErrors}`,
          threshold: this.reportingConfig.alertThresholds.crawlErrorIncrease
        });
      }

      // Check sitemap status
      if (sitemapStatus && sitemapStatus.length > 0) {
        sitemapStatus.forEach(sitemap => {
          if (sitemap.errors && sitemap.errors > 0) {
            monitoring.alerts.push({
              type: 'sitemap_errors',
              severity: 'medium',
              message: `Sitemap errors detected in ${sitemap.path}: ${sitemap.errors} errors`,
              sitemapPath: sitemap.path
            });
          }
        });
      }

      // Generate recommendations
      if (crawlErrors && crawlErrors.totalErrors > 0) {
        monitoring.recommendations.push({
          type: 'technical',
          priority: 'high',
          message: 'Review and fix crawl errors to improve site indexing',
          action: 'fix_crawl_errors'
        });
      }

      return monitoring;
    } catch (error) {
      console.error('Failed to monitor crawl errors and indexing:', error);
      return null;
    }
  }

  /**
   * Get comprehensive analytics dashboard data
   * @param {Object} options - Dashboard options
   * @returns {Promise<Object>} Dashboard data
   */
  async getDashboardData(options = {}) {
    const period = options.period || 30; // days

    try {
      const [
        organicPerformance,
        keywordSummary,
        technicalHealth,
        recentAlerts
      ] = await Promise.all([
        this.trackOrganicTrafficAndConversions({
          startDate: this.getDateString(-period),
          endDate: this.getDateString(-1)
        }),
        this.keywordTracker.trackDailyRankings(),
        this.monitorCrawlErrorsAndIndexing(),
        this.getRecentAlerts(7) // Last 7 days of alerts
      ]);

      return {
        overview: {
          totalClicks: organicPerformance?.traffic.totalClicks || 0,
          totalImpressions: organicPerformance?.traffic.totalImpressions || 0,
          averagePosition: organicPerformance?.traffic.averagePosition || 0,
          conversionRate: organicPerformance?.conversions.organicConversionRate || 0,
          overallScore: organicPerformance?.performance.overall || 0
        },
        keywords: {
          totalTracked: keywordSummary?.summary.totalKeywords || 0,
          improved: keywordSummary?.summary.improved || 0,
          declined: keywordSummary?.summary.declined || 0,
          stable: keywordSummary?.summary.stable || 0
        },
        technical: {
          crawlErrors: technicalHealth?.crawlErrors?.totalErrors || 0,
          indexedPages: technicalHealth?.sitemapStatus?.reduce((sum, sitemap) => sum + (sitemap.indexed || 0), 0) || 0,
          sitemapStatus: technicalHealth?.sitemapStatus?.length || 0
        },
        alerts: recentAlerts,
        trends: organicPerformance?.trends || {},
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to get dashboard data:', error);
      return null;
    }
  }

  /**
   * Get recent alerts
   * @param {number} days - Number of days to look back
   * @returns {Array} Recent alerts
   */
  getRecentAlerts(days) {
    // Mock recent alerts for demo
    return [
      {
        type: 'keyword_improvement',
        severity: 'positive',
        message: 'Keyword "restaurant billing software" improved by 3 positions',
        date: this.getDateString(-2)
      },
      {
        type: 'traffic_increase',
        severity: 'positive',
        message: 'Organic traffic increased by 15% this week',
        date: this.getDateString(-1)
      }
    ];
  }

  /**
   * Get date string for calculations
   * @param {number} daysAgo - Days ago from today
   * @returns {string} Date string in YYYY-MM-DD format
   */
  getDateString(daysAgo) {
    const date = new Date();
    date.setDate(date.getDate() + daysAgo);
    return date.toISOString().split('T')[0];
  }
}

export default AnalyticsEngine;