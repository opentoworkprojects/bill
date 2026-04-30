/**
 * Content Analytics - Handles blog content performance tracking
 * Implements Requirements: 3.6
 */

import SearchConsoleAPI from './SearchConsoleAPI.js';

class ContentAnalytics {
  constructor(config = {}) {
    this.searchConsoleAPI = new SearchConsoleAPI(config);
    this.contentDatabase = new Map();
    this.performanceHistory = new Map();
    this.analyticsConfig = {
      trackingPeriod: 90, // days
      performanceThresholds: {
        highPerforming: {
          organicTraffic: 1000,
          averagePosition: 10,
          engagementRate: 0.6,
          conversionRate: 0.02
        },
        lowPerforming: {
          organicTraffic: 50,
          averagePosition: 30,
          engagementRate: 0.2,
          conversionRate: 0.005
        }
      }
    };
  }

  /**
   * Track content performance metrics
   * @param {Array} contentList - List of content to track
   * @returns {Promise<Object>} Content performance data
   */
  async trackContentPerformance(contentList = null) {
    const content = contentList || this.getDefaultContentList();
    const performanceData = {
      date: new Date().toISOString(),
      totalContent: content.length,
      performanceMetrics: {},
      summary: {
        highPerforming: 0,
        mediumPerforming: 0,
        lowPerforming: 0,
        totalTraffic: 0,
        averageEngagement: 0
      },
      topPerformers: [],
      underperformers: [],
      recommendations: []
    };

    for (const contentItem of content) {
      try {
        const metrics = await this.analyzeContentItem(contentItem);
        performanceData.performanceMetrics[contentItem.id] = metrics;

        // Update summary
        performanceData.summary.totalTraffic += metrics.organicTraffic;
        
        // Categorize performance
        const category = this.categorizePerformance(metrics);
        performanceData.summary[category]++;

        // Track top performers and underperformers
        if (category === 'highPerforming') {
          performanceData.topPerformers.push({
            id: contentItem.id,
            title: contentItem.title,
            metrics: metrics
          });
        } else if (category === 'lowPerforming') {
          performanceData.underperformers.push({
            id: contentItem.id,
            title: contentItem.title,
            metrics: metrics
          });
        }

      } catch (error) {
        console.error(`Failed to analyze content ${contentItem.id}:`, error);
      }
    }

    // Calculate averages
    performanceData.summary.averageEngagement = 
      Object.values(performanceData.performanceMetrics)
        .reduce((sum, metrics) => sum + metrics.engagementRate, 0) / content.length;

    // Generate recommendations
    performanceData.recommendations = this.generateContentRecommendations(performanceData);

    // Store performance history
    this.performanceHistory.set(new Date().toISOString().split('T')[0], performanceData);

    return performanceData;
  }

  /**
   * Get default content list for tracking
   * @returns {Array} Default content list
   */
  getDefaultContentList() {
    return [
      {
        id: 'restaurant-billing-guide',
        title: 'Complete Guide to Restaurant Billing Software',
        url: '/blog/restaurant-billing-software-guide',
        publishDate: '2024-01-15',
        category: 'billing-best-practices',
        targetKeywords: ['restaurant billing software', 'restaurant billing system'],
        author: 'Content Team'
      },
      {
        id: 'pos-system-comparison',
        title: 'Restaurant POS System Comparison 2024',
        url: '/blog/restaurant-pos-system-comparison',
        publishDate: '2024-01-20',
        category: 'industry-trends',
        targetKeywords: ['restaurant pos system', 'pos system comparison'],
        author: 'Content Team'
      },
      {
        id: 'kot-system-benefits',
        title: 'Benefits of Digital KOT System for Restaurants',
        url: '/blog/kot-system-benefits',
        publishDate: '2024-01-25',
        category: 'software-tutorials',
        targetKeywords: ['kot system', 'kitchen order ticket', 'digital kot'],
        author: 'Content Team'
      },
      {
        id: 'restaurant-management-tips',
        title: '10 Essential Restaurant Management Tips for 2024',
        url: '/blog/restaurant-management-tips-2024',
        publishDate: '2024-02-01',
        category: 'restaurant-management-tips',
        targetKeywords: ['restaurant management', 'restaurant tips', 'restaurant operations'],
        author: 'Content Team'
      },
      {
        id: 'inventory-management-guide',
        title: 'Restaurant Inventory Management Best Practices',
        url: '/blog/restaurant-inventory-management',
        publishDate: '2024-02-05',
        category: 'restaurant-management-tips',
        targetKeywords: ['restaurant inventory management', 'inventory control'],
        author: 'Content Team'
      },
      {
        id: 'staff-management-software',
        title: 'How Restaurant Staff Management Software Improves Efficiency',
        url: '/blog/restaurant-staff-management-software',
        publishDate: '2024-02-10',
        category: 'software-tutorials',
        targetKeywords: ['restaurant staff management', 'staff management software'],
        author: 'Content Team'
      }
    ];
  }

  /**
   * Analyze individual content item performance
   * @param {Object} contentItem - Content item to analyze
   * @returns {Promise<Object>} Content performance metrics
   */
  async analyzeContentItem(contentItem) {
    // Get search performance data for the content URL
    const searchData = await this.getContentSearchPerformance(contentItem.url);
    
    // Get engagement metrics (mock for demo)
    const engagementData = this.getContentEngagementMetrics(contentItem);
    
    // Get conversion data (mock for demo)
    const conversionData = this.getContentConversionMetrics(contentItem);

    // Calculate performance scores
    const performanceScores = this.calculateContentPerformanceScores(
      searchData, 
      engagementData, 
      conversionData
    );

    return {
      contentId: contentItem.id,
      title: contentItem.title,
      url: contentItem.url,
      publishDate: contentItem.publishDate,
      category: contentItem.category,
      
      // Search performance
      organicTraffic: searchData.clicks,
      impressions: searchData.impressions,
      averagePosition: searchData.averagePosition,
      clickThroughRate: searchData.ctr,
      
      // Engagement metrics
      pageViews: engagementData.pageViews,
      uniqueVisitors: engagementData.uniqueVisitors,
      averageTimeOnPage: engagementData.averageTimeOnPage,
      bounceRate: engagementData.bounceRate,
      engagementRate: engagementData.engagementRate,
      socialShares: engagementData.socialShares,
      
      // Conversion metrics
      conversions: conversionData.conversions,
      conversionRate: conversionData.conversionRate,
      leadGeneration: conversionData.leadGeneration,
      
      // Performance scores
      performanceScores: performanceScores,
      overallScore: performanceScores.overall,
      
      // Trends
      trends: await this.calculateContentTrends(contentItem),
      
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Get search performance data for content URL
   * @param {string} url - Content URL
   * @returns {Promise<Object>} Search performance data
   */
  async getContentSearchPerformance(url) {
    try {
      // Get page-specific performance data
      const pageData = await this.searchConsoleAPI.getPagePerformance({
        startDate: this.getDateString(-30),
        endDate: this.getDateString(-1)
      });

      // Find data for specific URL
      const urlData = pageData.pages?.find(page => page.url.includes(url)) || {
        clicks: Math.floor(Math.random() * 500) + 50,
        impressions: Math.floor(Math.random() * 2000) + 200,
        ctr: Math.random() * 0.05 + 0.02,
        position: Math.random() * 20 + 5
      };

      return {
        clicks: urlData.clicks,
        impressions: urlData.impressions,
        ctr: urlData.ctr,
        averagePosition: urlData.position
      };
    } catch (error) {
      console.error('Failed to get search performance:', error);
      // Return mock data for demo
      return {
        clicks: Math.floor(Math.random() * 500) + 50,
        impressions: Math.floor(Math.random() * 2000) + 200,
        ctr: Math.random() * 0.05 + 0.02,
        averagePosition: Math.random() * 20 + 5
      };
    }
  }

  /**
   * Get engagement metrics for content (mock for demo)
   * @param {Object} contentItem - Content item
   * @returns {Object} Engagement metrics
   */
  getContentEngagementMetrics(contentItem) {
    // Mock engagement data based on content category and age
    const contentAge = this.getContentAgeInDays(contentItem.publishDate);
    const categoryMultiplier = this.getCategoryEngagementMultiplier(contentItem.category);
    
    const basePageViews = Math.floor(Math.random() * 1000) + 200;
    const pageViews = Math.floor(basePageViews * categoryMultiplier);
    
    return {
      pageViews: pageViews,
      uniqueVisitors: Math.floor(pageViews * 0.7),
      averageTimeOnPage: Math.floor(Math.random() * 180) + 120, // 2-5 minutes
      bounceRate: Math.random() * 0.4 + 0.3, // 30-70%
      engagementRate: Math.random() * 0.4 + 0.4, // 40-80%
      socialShares: Math.floor(Math.random() * 50) + 5,
      comments: Math.floor(Math.random() * 20),
      emailSignups: Math.floor(Math.random() * 10) + 1
    };
  }

  /**
   * Get content age in days
   * @param {string} publishDate - Publish date string
   * @returns {number} Age in days
   */
  getContentAgeInDays(publishDate) {
    const published = new Date(publishDate);
    const now = new Date();
    return Math.floor((now - published) / (1000 * 60 * 60 * 24));
  }

  /**
   * Get engagement multiplier by category
   * @param {string} category - Content category
   * @returns {number} Engagement multiplier
   */
  getCategoryEngagementMultiplier(category) {
    const multipliers = {
      'restaurant-management-tips': 1.2,
      'billing-best-practices': 1.0,
      'industry-trends': 1.3,
      'software-tutorials': 0.9
    };
    
    return multipliers[category] || 1.0;
  }

  /**
   * Get conversion metrics for content (mock for demo)
   * @param {Object} contentItem - Content item
   * @returns {Object} Conversion metrics
   */
  getContentConversionMetrics(contentItem) {
    const categoryConversionRate = this.getCategoryConversionRate(contentItem.category);
    const baseConversions = Math.floor(Math.random() * 20) + 2;
    
    return {
      conversions: baseConversions,
      conversionRate: categoryConversionRate + (Math.random() * 0.01),
      leadGeneration: Math.floor(baseConversions * 0.6),
      demoRequests: Math.floor(baseConversions * 0.3),
      contactFormSubmissions: Math.floor(baseConversions * 0.1),
      revenue: baseConversions * (Math.random() * 500 + 200) // $200-700 per conversion
    };
  }

  /**
   * Get conversion rate by category
   * @param {string} category - Content category
   * @returns {number} Base conversion rate
   */
  getCategoryConversionRate(category) {
    const rates = {
      'restaurant-management-tips': 0.015,
      'billing-best-practices': 0.025,
      'industry-trends': 0.010,
      'software-tutorials': 0.030
    };
    
    return rates[category] || 0.015;
  }

  /**
   * Calculate content performance scores
   * @param {Object} searchData - Search performance data
   * @param {Object} engagementData - Engagement data
   * @param {Object} conversionData - Conversion data
   * @returns {Object} Performance scores
   */
  calculateContentPerformanceScores(searchData, engagementData, conversionData) {
    const scores = {
      search: 0,
      engagement: 0,
      conversion: 0,
      overall: 0
    };

    // Search performance score (40% weight)
    const searchScore = Math.min(100, 
      (searchData.clicks / 100) * 30 + 
      (Math.max(0, 21 - searchData.averagePosition) / 20) * 40 +
      (searchData.ctr * 1000) * 30
    );
    scores.search = Math.round(searchScore);

    // Engagement score (35% weight)
    const engagementScore = Math.min(100,
      (engagementData.pageViews / 500) * 30 +
      (engagementData.averageTimeOnPage / 300) * 25 +
      ((1 - engagementData.bounceRate) * 100) * 25 +
      (engagementData.socialShares / 20) * 20
    );
    scores.engagement = Math.round(engagementScore);

    // Conversion score (25% weight)
    const conversionScore = Math.min(100,
      (conversionData.conversionRate * 2000) * 60 +
      (conversionData.conversions / 10) * 40
    );
    scores.conversion = Math.round(conversionScore);

    // Overall score (weighted average)
    scores.overall = Math.round(
      scores.search * 0.4 +
      scores.engagement * 0.35 +
      scores.conversion * 0.25
    );

    return scores;
  }

  /**
   * Calculate content performance trends
   * @param {Object} contentItem - Content item
   * @returns {Promise<Object>} Content trends
   */
  async calculateContentTrends(contentItem) {
    // Get historical performance data
    const currentPeriod = await this.getContentSearchPerformance(contentItem.url);
    
    // Mock previous period data for demo
    const previousPeriod = {
      clicks: currentPeriod.clicks + Math.floor(Math.random() * 100) - 50,
      impressions: currentPeriod.impressions + Math.floor(Math.random() * 500) - 250,
      ctr: currentPeriod.ctr + (Math.random() * 0.02) - 0.01,
      averagePosition: currentPeriod.averagePosition + Math.floor(Math.random() * 6) - 3
    };

    return {
      traffic: this.calculateTrendPercentage(currentPeriod.clicks, previousPeriod.clicks),
      impressions: this.calculateTrendPercentage(currentPeriod.impressions, previousPeriod.impressions),
      ctr: this.calculateTrendPercentage(currentPeriod.ctr, previousPeriod.ctr),
      position: this.calculatePositionTrend(currentPeriod.averagePosition, previousPeriod.averagePosition)
    };
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
   * Calculate position trend (lower is better)
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
   * Categorize content performance
   * @param {Object} metrics - Content metrics
   * @returns {string} Performance category
   */
  categorizePerformance(metrics) {
    const thresholds = this.analyticsConfig.performanceThresholds;
    
    if (metrics.organicTraffic >= thresholds.highPerforming.organicTraffic &&
        metrics.averagePosition <= thresholds.highPerforming.averagePosition &&
        metrics.engagementRate >= thresholds.highPerforming.engagementRate) {
      return 'highPerforming';
    } else if (metrics.organicTraffic <= thresholds.lowPerforming.organicTraffic ||
               metrics.averagePosition >= thresholds.lowPerforming.averagePosition ||
               metrics.engagementRate <= thresholds.lowPerforming.engagementRate) {
      return 'lowPerforming';
    } else {
      return 'mediumPerforming';
    }
  }

  /**
   * Generate content optimization recommendations
   * @param {Object} performanceData - Content performance data
   * @returns {Array} Recommendations
   */
  generateContentRecommendations(performanceData) {
    const recommendations = [];

    // Analyze underperformers
    performanceData.underperformers.forEach(content => {
      const metrics = content.metrics;
      
      if (metrics.averagePosition > 20) {
        recommendations.push({
          contentId: content.id,
          type: 'seo_optimization',
          priority: 'high',
          title: `Improve SEO for "${content.title}"`,
          description: `Currently ranking at position ${metrics.averagePosition}`,
          actions: [
            'Optimize title and meta description',
            'Improve keyword targeting',
            'Add internal links',
            'Update and refresh content'
          ]
        });
      }

      if (metrics.bounceRate > 0.7) {
        recommendations.push({
          contentId: content.id,
          type: 'engagement_optimization',
          priority: 'medium',
          title: `Reduce bounce rate for "${content.title}"`,
          description: `High bounce rate: ${(metrics.bounceRate * 100).toFixed(1)}%`,
          actions: [
            'Improve content structure and readability',
            'Add engaging visuals and media',
            'Include clear call-to-actions',
            'Optimize page loading speed'
          ]
        });
      }

      if (metrics.conversionRate < 0.01) {
        recommendations.push({
          contentId: content.id,
          type: 'conversion_optimization',
          priority: 'medium',
          title: `Improve conversions for "${content.title}"`,
          description: `Low conversion rate: ${(metrics.conversionRate * 100).toFixed(2)}%`,
          actions: [
            'Add compelling call-to-actions',
            'Include lead magnets and offers',
            'Optimize conversion funnel',
            'A/B test different approaches'
          ]
        });
      }
    });

    // Analyze top performers for scaling opportunities
    performanceData.topPerformers.forEach(content => {
      recommendations.push({
        contentId: content.id,
        type: 'scaling_opportunity',
        priority: 'low',
        title: `Scale success of "${content.title}"`,
        description: 'High-performing content with scaling potential',
        actions: [
          'Create related content on similar topics',
          'Expand content with additional sections',
          'Promote on social media and other channels',
          'Use as template for future content'
        ]
      });
    });

    // Content gap analysis
    const categories = [...new Set(Object.values(performanceData.performanceMetrics).map(m => m.category))];
    const categoryPerformance = {};
    
    categories.forEach(category => {
      const categoryContent = Object.values(performanceData.performanceMetrics)
        .filter(m => m.category === category);
      
      categoryPerformance[category] = {
        count: categoryContent.length,
        averageTraffic: categoryContent.reduce((sum, m) => sum + m.organicTraffic, 0) / categoryContent.length,
        averageScore: categoryContent.reduce((sum, m) => sum + m.overallScore, 0) / categoryContent.length
      };
    });

    // Recommend content creation for underrepresented categories
    Object.entries(categoryPerformance).forEach(([category, performance]) => {
      if (performance.count < 3) {
        recommendations.push({
          type: 'content_creation',
          priority: 'medium',
          title: `Create more content for ${category}`,
          description: `Only ${performance.count} pieces in this category`,
          actions: [
            `Research trending topics in ${category}`,
            'Identify keyword opportunities',
            'Create content calendar for this category',
            'Analyze competitor content in this space'
          ]
        });
      }
    });

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Generate content ROI analysis
   * @param {Object} performanceData - Content performance data
   * @returns {Object} ROI analysis
   */
  generateContentROIAnalysis(performanceData) {
    const roiAnalysis = {
      totalInvestment: 0,
      totalRevenue: 0,
      roi: 0,
      contentROI: {},
      topROIContent: [],
      recommendations: []
    };

    // Estimate content creation costs (mock)
    const estimatedCostPerContent = 500; // $500 per content piece
    roiAnalysis.totalInvestment = Object.keys(performanceData.performanceMetrics).length * estimatedCostPerContent;

    // Calculate revenue from conversions
    Object.entries(performanceData.performanceMetrics).forEach(([contentId, metrics]) => {
      const contentRevenue = metrics.conversions * 300; // $300 average revenue per conversion
      const contentInvestment = estimatedCostPerContent;
      const contentROI = ((contentRevenue - contentInvestment) / contentInvestment) * 100;

      roiAnalysis.contentROI[contentId] = {
        investment: contentInvestment,
        revenue: contentRevenue,
        roi: contentROI,
        title: metrics.title
      };

      roiAnalysis.totalRevenue += contentRevenue;

      if (contentROI > 100) {
        roiAnalysis.topROIContent.push({
          contentId,
          title: metrics.title,
          roi: contentROI,
          revenue: contentRevenue
        });
      }
    });

    // Calculate overall ROI
    roiAnalysis.roi = ((roiAnalysis.totalRevenue - roiAnalysis.totalInvestment) / roiAnalysis.totalInvestment) * 100;

    // Sort top ROI content
    roiAnalysis.topROIContent.sort((a, b) => b.roi - a.roi);

    // Generate ROI recommendations
    if (roiAnalysis.roi < 50) {
      roiAnalysis.recommendations.push({
        type: 'roi_improvement',
        priority: 'high',
        message: 'Overall content ROI is below target. Focus on conversion optimization.',
        actions: [
          'Improve call-to-actions across all content',
          'Optimize conversion funnels',
          'Focus on high-converting content types',
          'Reduce content creation costs through efficiency'
        ]
      });
    }

    if (roiAnalysis.topROIContent.length > 0) {
      roiAnalysis.recommendations.push({
        type: 'scale_success',
        priority: 'medium',
        message: `${roiAnalysis.topROIContent.length} pieces showing strong ROI. Scale these approaches.`,
        actions: [
          'Analyze common elements of high-ROI content',
          'Create more content in successful categories',
          'Replicate successful content formats',
          'Increase promotion of high-ROI content'
        ]
      });
    }

    return roiAnalysis;
  }

  /**
   * Get comprehensive content analytics report
   * @param {Object} options - Report options
   * @returns {Promise<Object>} Comprehensive analytics report
   */
  async getContentAnalyticsReport(options = {}) {
    const reportPeriod = options.period || 30;
    
    try {
      const performanceData = await this.trackContentPerformance();
      const roiAnalysis = this.generateContentROIAnalysis(performanceData);
      const contentInsights = this.generateContentInsights(performanceData);

      return {
        reportDate: new Date().toISOString(),
        period: reportPeriod,
        summary: {
          totalContent: performanceData.totalContent,
          totalTraffic: performanceData.summary.totalTraffic,
          averageEngagement: performanceData.summary.averageEngagement,
          totalRevenue: roiAnalysis.totalRevenue,
          overallROI: roiAnalysis.roi
        },
        performance: performanceData,
        roi: roiAnalysis,
        insights: contentInsights,
        recommendations: [
          ...performanceData.recommendations,
          ...roiAnalysis.recommendations
        ]
      };
    } catch (error) {
      console.error('Failed to generate content analytics report:', error);
      return null;
    }
  }

  /**
   * Generate content insights
   * @param {Object} performanceData - Performance data
   * @returns {Object} Content insights
   */
  generateContentInsights(performanceData) {
    const insights = {
      topCategories: this.analyzeTopCategories(performanceData),
      contentTrends: this.analyzeContentTrends(performanceData),
      engagementPatterns: this.analyzeEngagementPatterns(performanceData),
      conversionPatterns: this.analyzeConversionPatterns(performanceData)
    };

    return insights;
  }

  /**
   * Analyze top performing categories
   * @param {Object} performanceData - Performance data
   * @returns {Array} Top categories analysis
   */
  analyzeTopCategories(performanceData) {
    const categoryStats = {};
    
    Object.values(performanceData.performanceMetrics).forEach(metrics => {
      if (!categoryStats[metrics.category]) {
        categoryStats[metrics.category] = {
          count: 0,
          totalTraffic: 0,
          totalConversions: 0,
          averageScore: 0
        };
      }
      
      categoryStats[metrics.category].count++;
      categoryStats[metrics.category].totalTraffic += metrics.organicTraffic;
      categoryStats[metrics.category].totalConversions += metrics.conversions;
      categoryStats[metrics.category].averageScore += metrics.overallScore;
    });

    return Object.entries(categoryStats)
      .map(([category, stats]) => ({
        category,
        count: stats.count,
        averageTraffic: Math.round(stats.totalTraffic / stats.count),
        averageConversions: Math.round(stats.totalConversions / stats.count),
        averageScore: Math.round(stats.averageScore / stats.count),
        totalTraffic: stats.totalTraffic
      }))
      .sort((a, b) => b.totalTraffic - a.totalTraffic);
  }

  /**
   * Analyze content trends
   * @param {Object} performanceData - Performance data
   * @returns {Object} Content trends analysis
   */
  analyzeContentTrends(performanceData) {
    const trends = {
      trafficTrend: 'stable',
      engagementTrend: 'stable',
      conversionTrend: 'stable',
      insights: []
    };

    const metrics = Object.values(performanceData.performanceMetrics);
    
    // Analyze traffic trends
    const improvingTraffic = metrics.filter(m => m.trends?.traffic?.direction === 'up').length;
    const decliningTraffic = metrics.filter(m => m.trends?.traffic?.direction === 'down').length;
    
    if (improvingTraffic > decliningTraffic * 1.5) {
      trends.trafficTrend = 'improving';
      trends.insights.push('Overall content traffic is trending upward');
    } else if (decliningTraffic > improvingTraffic * 1.5) {
      trends.trafficTrend = 'declining';
      trends.insights.push('Content traffic needs attention - declining trend detected');
    }

    return trends;
  }

  /**
   * Analyze engagement patterns
   * @param {Object} performanceData - Performance data
   * @returns {Object} Engagement patterns
   */
  analyzeEngagementPatterns(performanceData) {
    const metrics = Object.values(performanceData.performanceMetrics);
    
    return {
      averageTimeOnPage: metrics.reduce((sum, m) => sum + m.averageTimeOnPage, 0) / metrics.length,
      averageBounceRate: metrics.reduce((sum, m) => sum + m.bounceRate, 0) / metrics.length,
      averageEngagementRate: metrics.reduce((sum, m) => sum + m.engagementRate, 0) / metrics.length,
      topEngagingContent: metrics
        .sort((a, b) => b.engagementRate - a.engagementRate)
        .slice(0, 3)
        .map(m => ({ title: m.title, engagementRate: m.engagementRate }))
    };
  }

  /**
   * Analyze conversion patterns
   * @param {Object} performanceData - Performance data
   * @returns {Object} Conversion patterns
   */
  analyzeConversionPatterns(performanceData) {
    const metrics = Object.values(performanceData.performanceMetrics);
    
    return {
      averageConversionRate: metrics.reduce((sum, m) => sum + m.conversionRate, 0) / metrics.length,
      totalConversions: metrics.reduce((sum, m) => sum + m.conversions, 0),
      topConvertingContent: metrics
        .sort((a, b) => b.conversionRate - a.conversionRate)
        .slice(0, 3)
        .map(m => ({ title: m.title, conversionRate: m.conversionRate, conversions: m.conversions }))
    };
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

export default ContentAnalytics;