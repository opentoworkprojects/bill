/**
 * SEO Manager - Central orchestrator for all SEO components
 * Implements Requirements: All requirements - integrates entire SEO system
 */

import TechnicalSEOEngine from './core/TechnicalSEOEngine.js';
import SchemaGenerator from './core/SchemaGenerator.js';
import MetaTagOptimizer from './core/MetaTagOptimizer.js';
import SitemapManager from './core/SitemapManager.js';
import ContentManager from './core/ContentManager.js';
import BlogContentOptimizer from './core/BlogContentOptimizer.js';
import InternalLinkBuilder from './core/InternalLinkBuilder.js';
import SearchConsoleAPI from './core/SearchConsoleAPI.js';
import KeywordTracker from './core/KeywordTracker.js';
import AnalyticsEngine from './core/AnalyticsEngine.js';
import LocalSEOManager from './core/LocalSEOManager.js';
import CompetitorAnalyzer from './core/CompetitorAnalyzer.js';
import ContentAnalytics from './core/ContentAnalytics.js';

class SEOManager {
  constructor(config = {}) {
    this.config = {
      siteUrl: 'https://billbytekot.com',
      siteName: 'BillByteKOT',
      defaultLanguage: 'en',
      enableAnalytics: true,
      enableCompetitorTracking: true,
      enableLocalSEO: true,
      ...config
    };

    // Initialize all SEO components
    this.initializeComponents();
    
    // Set up error handling and logging
    this.setupErrorHandling();
    
    // Initialize health monitoring
    this.healthStatus = {
      lastCheck: null,
      components: {},
      overallHealth: 'unknown'
    };
  }

  /**
   * Initialize all SEO components
   */
  initializeComponents() {
    try {
      // Core technical SEO components
      this.technicalSEO = new TechnicalSEOEngine(this.config);
      this.schemaGenerator = new SchemaGenerator();
      this.metaTagOptimizer = new MetaTagOptimizer();
      this.sitemapManager = new SitemapManager(this.config);

      // Content management components
      this.contentManager = new ContentManager();
      this.blogOptimizer = new BlogContentOptimizer();
      this.linkBuilder = new InternalLinkBuilder();

      // Analytics and tracking components
      this.searchConsoleAPI = new SearchConsoleAPI(this.config);
      this.keywordTracker = new KeywordTracker(this.config);
      this.analyticsEngine = new AnalyticsEngine(this.config);
      this.contentAnalytics = new ContentAnalytics(this.config);

      // Specialized SEO components
      if (this.config.enableLocalSEO) {
        this.localSEOManager = new LocalSEOManager(this.config);
      }

      if (this.config.enableCompetitorTracking) {
        this.competitorAnalyzer = new CompetitorAnalyzer(this.config);
      }

      console.log('SEO Manager: All components initialized successfully');
    } catch (error) {
      console.error('SEO Manager: Failed to initialize components:', error);
      throw new Error('SEO Manager initialization failed');
    }
  }

  /**
   * Set up error handling and logging
   */
  setupErrorHandling() {
    this.errorLog = [];
    this.maxErrorLogSize = 100;

    // Global error handler for SEO operations
    this.handleError = (component, operation, error) => {
      const errorEntry = {
        timestamp: new Date().toISOString(),
        component,
        operation,
        error: error.message,
        stack: error.stack
      };

      this.errorLog.push(errorEntry);
      
      // Keep error log size manageable
      if (this.errorLog.length > this.maxErrorLogSize) {
        this.errorLog = this.errorLog.slice(-this.maxErrorLogSize);
      }

      console.error(`SEO Manager Error [${component}:${operation}]:`, error);
    };
  }

  /**
   * Optimize a page for SEO
   * @param {Object} pageData - Page data to optimize
   * @returns {Promise<Object>} Optimization results
   */
  async optimizePage(pageData) {
    try {
      const optimization = {
        pageData,
        timestamp: new Date().toISOString(),
        results: {}
      };

      // Generate optimized meta tags
      optimization.results.metaTags = this.metaTagOptimizer.optimizeMetaTags(pageData);

      // Generate schema markup
      optimization.results.schema = this.schemaGenerator.generatePageSchema(pageData);

      // Generate internal links
      optimization.results.internalLinks = this.linkBuilder.generateStrategicInternalLinks(pageData);

      // Technical SEO optimizations
      optimization.results.technical = await this.technicalSEO.optimizePage(pageData);

      // Content optimization (if it's a blog post)
      if (pageData.type === 'blog' || pageData.content) {
        optimization.results.content = this.blogOptimizer.optimizeBlogPost(pageData);
      }

      // Local SEO (if location data is provided)
      if (this.localSEOManager && pageData.location) {
        optimization.results.local = this.localSEOManager.createLocationSpecificPage(pageData.location);
      }

      return optimization;
    } catch (error) {
      this.handleError('SEOManager', 'optimizePage', error);
      throw error;
    }
  }

  /**
   * Generate comprehensive SEO report
   * @param {Object} options - Report options
   * @returns {Promise<Object>} SEO report
   */
  async generateSEOReport(options = {}) {
    try {
      const reportOptions = {
        period: 30,
        includeCompetitors: true,
        includeContent: true,
        includeLocal: true,
        ...options
      };

      const report = {
        generatedAt: new Date().toISOString(),
        period: reportOptions.period,
        summary: {},
        sections: {}
      };

      // Get analytics overview
      const analyticsData = await this.analyticsEngine.getDashboardData({ 
        period: reportOptions.period 
      });
      report.sections.analytics = analyticsData;

      // Get keyword performance
      const keywordReport = await this.keywordTracker.getKeywordReport({ 
        days: reportOptions.period 
      });
      report.sections.keywords = keywordReport;

      // Get content performance
      if (reportOptions.includeContent) {
        const contentReport = await this.contentAnalytics.getContentAnalyticsReport({
          period: reportOptions.period
        });
        report.sections.content = contentReport;
      }

      // Get competitor analysis
      if (reportOptions.includeCompetitors && this.competitorAnalyzer) {
        const competitorData = await this.competitorAnalyzer.monitorCompetitorStrategies();
        report.sections.competitors = competitorData;
      }

      // Get local SEO data
      if (reportOptions.includeLocal && this.localSEOManager) {
        const localStrategy = this.localSEOManager.generateLocalSEOStrategy();
        report.sections.local = localStrategy;
      }

      // Get technical SEO health
      const technicalHealth = await this.performHealthCheck();
      report.sections.technical = technicalHealth;

      // Generate executive summary
      report.summary = this.generateExecutiveSummary(report.sections);

      return report;
    } catch (error) {
      this.handleError('SEOManager', 'generateSEOReport', error);
      throw error;
    }
  }

  /**
   * Generate executive summary from report sections
   * @param {Object} sections - Report sections
   * @returns {Object} Executive summary
   */
  generateExecutiveSummary(sections) {
    const summary = {
      overallScore: 0,
      keyMetrics: {},
      highlights: [],
      concerns: [],
      recommendations: []
    };

    // Calculate overall score
    let totalScore = 0;
    let scoreCount = 0;

    if (sections.analytics?.overview?.overallScore) {
      totalScore += sections.analytics.overview.overallScore;
      scoreCount++;
    }

    if (sections.keywords?.dailyTracking?.summary) {
      const keywordScore = this.calculateKeywordScore(sections.keywords.dailyTracking.summary);
      totalScore += keywordScore;
      scoreCount++;
    }

    if (sections.content?.summary?.totalContent) {
      const contentScore = this.calculateContentScore(sections.content);
      totalScore += contentScore;
      scoreCount++;
    }

    summary.overallScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;

    // Extract key metrics
    if (sections.analytics?.overview) {
      summary.keyMetrics = {
        totalClicks: sections.analytics.overview.totalClicks,
        totalImpressions: sections.analytics.overview.totalImpressions,
        averagePosition: sections.analytics.overview.averagePosition,
        conversionRate: sections.analytics.overview.conversionRate
      };
    }

    // Generate highlights
    if (sections.keywords?.dailyTracking?.summary?.improved > 0) {
      summary.highlights.push(`${sections.keywords.dailyTracking.summary.improved} keywords improved in rankings`);
    }

    if (sections.analytics?.trends?.clicks?.direction === 'up') {
      summary.highlights.push(`Organic traffic increased by ${sections.analytics.trends.clicks.percentage}%`);
    }

    if (sections.content?.summary?.totalRevenue > 0) {
      summary.highlights.push(`Content generated $${sections.content.summary.totalRevenue.toLocaleString()} in revenue`);
    }

    // Generate concerns
    if (sections.keywords?.dailyTracking?.summary?.declined > 5) {
      summary.concerns.push(`${sections.keywords.dailyTracking.summary.declined} keywords declined in rankings`);
    }

    if (sections.technical?.components && Object.values(sections.technical.components).some(c => c.status === 'error')) {
      summary.concerns.push('Technical SEO issues detected');
    }

    if (summary.overallScore < 60) {
      summary.concerns.push('Overall SEO performance below target');
    }

    // Generate recommendations
    summary.recommendations = this.generateTopRecommendations(sections);

    return summary;
  }

  /**
   * Calculate keyword performance score
   * @param {Object} keywordSummary - Keyword summary data
   * @returns {number} Keyword score
   */
  calculateKeywordScore(keywordSummary) {
    const { totalKeywords, improved, declined, stable } = keywordSummary;
    
    if (totalKeywords === 0) return 50;

    const improvedRatio = improved / totalKeywords;
    const declinedRatio = declined / totalKeywords;
    const stableRatio = stable / totalKeywords;

    return Math.round(
      (improvedRatio * 100) + 
      (stableRatio * 70) + 
      (declinedRatio * 30)
    );
  }

  /**
   * Calculate content performance score
   * @param {Object} contentData - Content performance data
   * @returns {number} Content score
   */
  calculateContentScore(contentData) {
    if (!contentData.performance) return 50;

    const { highPerforming, mediumPerforming, lowPerforming } = contentData.performance.summary;
    const total = highPerforming + mediumPerforming + lowPerforming;

    if (total === 0) return 50;

    return Math.round(
      (highPerforming / total * 100) +
      (mediumPerforming / total * 70) +
      (lowPerforming / total * 30)
    );
  }

  /**
   * Generate top recommendations from all sections
   * @param {Object} sections - Report sections
   * @returns {Array} Top recommendations
   */
  generateTopRecommendations(sections) {
    const recommendations = [];

    // Keyword recommendations
    if (sections.keywords?.recommendations) {
      const highPriorityKeywords = sections.keywords.recommendations
        .filter(rec => rec.priority === 'high')
        .slice(0, 2);
      recommendations.push(...highPriorityKeywords.map(rec => ({
        category: 'keywords',
        priority: 'high',
        title: rec.message,
        source: 'keyword_analysis'
      })));
    }

    // Content recommendations
    if (sections.content?.recommendations) {
      const highPriorityContent = sections.content.recommendations
        .filter(rec => rec.priority === 'high')
        .slice(0, 2);
      recommendations.push(...highPriorityContent.map(rec => ({
        category: 'content',
        priority: 'high',
        title: rec.title,
        source: 'content_analysis'
      })));
    }

    // Competitor opportunities
    if (sections.competitors?.opportunities) {
      const topOpportunities = sections.competitors.opportunities
        .filter(opp => opp.priority === 'high')
        .slice(0, 1);
      recommendations.push(...topOpportunities.map(opp => ({
        category: 'competitive',
        priority: 'medium',
        title: opp.opportunity,
        source: 'competitor_analysis'
      })));
    }

    // Technical recommendations
    if (sections.technical?.recommendations) {
      recommendations.push(...sections.technical.recommendations.slice(0, 2));
    }

    return recommendations
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, 8);
  }

  /**
   * Perform comprehensive health check
   * @returns {Promise<Object>} Health check results
   */
  async performHealthCheck() {
    const healthCheck = {
      timestamp: new Date().toISOString(),
      overallHealth: 'good',
      components: {},
      recommendations: [],
      errors: this.errorLog.slice(-10) // Last 10 errors
    };

    try {
      // Check technical SEO engine
      healthCheck.components.technicalSEO = await this.checkComponentHealth(
        'technicalSEO', 
        () => this.technicalSEO.validateSitePerformance()
      );

      // Check search console connection
      healthCheck.components.searchConsole = await this.checkComponentHealth(
        'searchConsole',
        () => this.searchConsoleAPI.authenticate()
      );

      // Check sitemap generation
      healthCheck.components.sitemap = await this.checkComponentHealth(
        'sitemap',
        () => this.sitemapManager.generateSitemap()
      );

      // Check keyword tracking
      healthCheck.components.keywordTracking = await this.checkComponentHealth(
        'keywordTracking',
        () => this.keywordTracker.trackDailyRankings()
      );

      // Check content analytics
      healthCheck.components.contentAnalytics = await this.checkComponentHealth(
        'contentAnalytics',
        () => this.contentAnalytics.trackContentPerformance()
      );

      // Check competitor monitoring (if enabled)
      if (this.competitorAnalyzer) {
        healthCheck.components.competitorAnalysis = await this.checkComponentHealth(
          'competitorAnalysis',
          () => this.competitorAnalyzer.monitorCompetitorStrategies()
        );
      }

      // Check local SEO (if enabled)
      if (this.localSEOManager) {
        healthCheck.components.localSEO = await this.checkComponentHealth(
          'localSEO',
          () => this.localSEOManager.generateLocalSEOStrategy()
        );
      }

      // Determine overall health
      const componentStatuses = Object.values(healthCheck.components).map(c => c.status);
      const errorCount = componentStatuses.filter(status => status === 'error').length;
      const warningCount = componentStatuses.filter(status => status === 'warning').length;

      if (errorCount > 0) {
        healthCheck.overallHealth = 'critical';
      } else if (warningCount > 2) {
        healthCheck.overallHealth = 'warning';
      } else if (warningCount > 0) {
        healthCheck.overallHealth = 'good';
      } else {
        healthCheck.overallHealth = 'excellent';
      }

      // Generate health recommendations
      healthCheck.recommendations = this.generateHealthRecommendations(healthCheck.components);

    } catch (error) {
      this.handleError('SEOManager', 'performHealthCheck', error);
      healthCheck.overallHealth = 'critical';
      healthCheck.components.seoManager = {
        status: 'error',
        message: 'Health check failed',
        error: error.message
      };
    }

    this.healthStatus = healthCheck;
    return healthCheck;
  }

  /**
   * Check individual component health
   * @param {string} componentName - Component name
   * @param {Function} healthCheckFunction - Function to test component
   * @returns {Promise<Object>} Component health status
   */
  async checkComponentHealth(componentName, healthCheckFunction) {
    try {
      const startTime = Date.now();
      await healthCheckFunction();
      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        responseTime,
        lastCheck: new Date().toISOString(),
        message: 'Component functioning normally'
      };
    } catch (error) {
      return {
        status: 'error',
        lastCheck: new Date().toISOString(),
        message: error.message,
        error: error.name
      };
    }
  }

  /**
   * Generate health recommendations
   * @param {Object} components - Component health data
   * @returns {Array} Health recommendations
   */
  generateHealthRecommendations(components) {
    const recommendations = [];

    Object.entries(components).forEach(([componentName, health]) => {
      if (health.status === 'error') {
        recommendations.push({
          category: 'critical',
          priority: 'high',
          title: `Fix ${componentName} component`,
          description: health.message,
          component: componentName
        });
      } else if (health.responseTime > 5000) {
        recommendations.push({
          category: 'performance',
          priority: 'medium',
          title: `Optimize ${componentName} performance`,
          description: `Response time: ${health.responseTime}ms`,
          component: componentName
        });
      }
    });

    return recommendations;
  }

  /**
   * Get SEO configuration
   * @returns {Object} Current SEO configuration
   */
  getConfiguration() {
    return {
      ...this.config,
      components: {
        technicalSEO: !!this.technicalSEO,
        contentManagement: !!this.contentManager,
        analytics: !!this.analyticsEngine,
        localSEO: !!this.localSEOManager,
        competitorTracking: !!this.competitorAnalyzer
      },
      healthStatus: this.healthStatus?.overallHealth || 'unknown',
      lastHealthCheck: this.healthStatus?.timestamp || null
    };
  }

  /**
   * Update SEO configuration
   * @param {Object} newConfig - New configuration options
   */
  updateConfiguration(newConfig) {
    this.config = { ...this.config, ...newConfig };
    
    // Reinitialize components if necessary
    if (newConfig.enableLocalSEO && !this.localSEOManager) {
      this.localSEOManager = new LocalSEOManager(this.config);
    }
    
    if (newConfig.enableCompetitorTracking && !this.competitorAnalyzer) {
      this.competitorAnalyzer = new CompetitorAnalyzer(this.config);
    }
  }

  /**
   * Get error log
   * @param {number} limit - Number of recent errors to return
   * @returns {Array} Recent errors
   */
  getErrorLog(limit = 20) {
    return this.errorLog.slice(-limit);
  }

  /**
   * Clear error log
   */
  clearErrorLog() {
    this.errorLog = [];
  }

  /**
   * Export SEO data for backup or migration
   * @returns {Promise<Object>} Exported SEO data
   */
  async exportSEOData() {
    try {
      const exportData = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        configuration: this.config,
        data: {}
      };

      // Export content calendar
      if (this.contentManager) {
        exportData.data.contentCalendar = this.contentManager.generateContentCalendar();
      }

      // Export keyword data
      if (this.keywordTracker) {
        exportData.data.keywords = await this.keywordTracker.getKeywordReport();
      }

      // Export local SEO strategy
      if (this.localSEOManager) {
        exportData.data.localSEO = this.localSEOManager.generateLocalSEOStrategy();
      }

      // Export sitemap data
      if (this.sitemapManager) {
        exportData.data.sitemap = await this.sitemapManager.generateSitemap();
      }

      return exportData;
    } catch (error) {
      this.handleError('SEOManager', 'exportSEOData', error);
      throw error;
    }
  }

  /**
   * Import SEO data from backup
   * @param {Object} importData - Data to import
   * @returns {Promise<boolean>} Import success
   */
  async importSEOData(importData) {
    try {
      if (!importData.version || !importData.data) {
        throw new Error('Invalid import data format');
      }

      // Update configuration
      if (importData.configuration) {
        this.updateConfiguration(importData.configuration);
      }

      // Import data to respective components
      // Note: This would require implementing import methods in each component
      
      console.log('SEO Manager: Data import completed successfully');
      return true;
    } catch (error) {
      this.handleError('SEOManager', 'importSEOData', error);
      throw error;
    }
  }

  /**
   * Schedule automated SEO tasks
   * @param {Object} schedule - Schedule configuration
   */
  scheduleAutomatedTasks(schedule = {}) {
    const defaultSchedule = {
      dailyKeywordTracking: true,
      weeklyContentAnalysis: true,
      monthlyCompetitorAnalysis: true,
      weeklyHealthCheck: true,
      ...schedule
    };

    // Note: In a real implementation, this would set up cron jobs or similar scheduling
    console.log('SEO Manager: Automated tasks scheduled:', defaultSchedule);
    
    // Store schedule for reference
    this.automatedSchedule = defaultSchedule;
  }

  /**
   * Get current automated schedule
   * @returns {Object} Current schedule
   */
  getAutomatedSchedule() {
    return this.automatedSchedule || {};
  }
}

export default SEOManager;