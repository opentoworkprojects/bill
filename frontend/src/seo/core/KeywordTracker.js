/**
 * Keyword Tracker - Handles daily ranking monitoring and competitor tracking
 * Implements Requirements: 2.4, 6.2, 6.3, 8.3
 */

import SearchConsoleAPI from './SearchConsoleAPI.js';

class KeywordTracker {
  constructor(config = {}) {
    this.searchConsoleAPI = new SearchConsoleAPI(config);
    this.targetKeywords = this.initializeTargetKeywords();
    this.competitors = this.initializeCompetitors();
    this.trackingHistory = new Map();
    this.alertThresholds = {
      positionDrop: 3, // Alert if position drops by 3 or more
      positionImprovement: 5, // Alert if position improves by 5 or more
      clicksDrop: 0.2, // Alert if clicks drop by 20%
      impressionsDrop: 0.3 // Alert if impressions drop by 30%
    };
  }

  /**
   * Initialize target keywords for tracking
   * @returns {Array} Target keywords with metadata
   */
  initializeTargetKeywords() {
    return [
      // Primary brand keywords
      {
        keyword: 'billbytekot',
        category: 'brand',
        priority: 'high',
        targetPosition: 1,
        searchVolume: 890,
        difficulty: 25,
        intent: 'navigational'
      },
      {
        keyword: 'bill byte kot',
        category: 'brand',
        priority: 'high',
        targetPosition: 1,
        searchVolume: 320,
        difficulty: 20,
        intent: 'navigational'
      },
      
      // Primary commercial keywords
      {
        keyword: 'restaurant billing software',
        category: 'commercial',
        priority: 'high',
        targetPosition: 5,
        searchVolume: 2400,
        difficulty: 65,
        intent: 'commercial'
      },
      {
        keyword: 'restaurant pos system',
        category: 'commercial',
        priority: 'high',
        targetPosition: 8,
        searchVolume: 8100,
        difficulty: 78,
        intent: 'commercial'
      },
      {
        keyword: 'restaurant management software',
        category: 'commercial',
        priority: 'high',
        targetPosition: 10,
        searchVolume: 3600,
        difficulty: 72,
        intent: 'commercial'
      },
      {
        keyword: 'kot software',
        category: 'commercial',
        priority: 'medium',
        targetPosition: 5,
        searchVolume: 880,
        difficulty: 45,
        intent: 'commercial'
      },
      {
        keyword: 'kitchen order ticket software',
        category: 'commercial',
        priority: 'medium',
        targetPosition: 8,
        searchVolume: 590,
        difficulty: 38,
        intent: 'commercial'
      },

      // Secondary commercial keywords
      {
        keyword: 'restaurant inventory management',
        category: 'commercial',
        priority: 'medium',
        targetPosition: 12,
        searchVolume: 1900,
        difficulty: 68,
        intent: 'commercial'
      },
      {
        keyword: 'restaurant staff management software',
        category: 'commercial',
        priority: 'medium',
        targetPosition: 15,
        searchVolume: 720,
        difficulty: 55,
        intent: 'commercial'
      },
      {
        keyword: 'restaurant payment processing',
        category: 'commercial',
        priority: 'medium',
        targetPosition: 15,
        searchVolume: 2200,
        difficulty: 82,
        intent: 'commercial'
      },

      // Long-tail keywords
      {
        keyword: 'best restaurant billing software for small business',
        category: 'long-tail',
        priority: 'medium',
        targetPosition: 8,
        searchVolume: 210,
        difficulty: 28,
        intent: 'commercial'
      },
      {
        keyword: 'restaurant pos system with inventory management',
        category: 'long-tail',
        priority: 'medium',
        targetPosition: 10,
        searchVolume: 320,
        difficulty: 45,
        intent: 'commercial'
      },
      {
        keyword: 'kot system for restaurants india',
        category: 'long-tail',
        priority: 'low',
        targetPosition: 5,
        searchVolume: 170,
        difficulty: 25,
        intent: 'commercial'
      },

      // Informational keywords
      {
        keyword: 'what is kot in restaurant',
        category: 'informational',
        priority: 'low',
        targetPosition: 8,
        searchVolume: 480,
        difficulty: 15,
        intent: 'informational'
      },
      {
        keyword: 'restaurant management tips',
        category: 'informational',
        priority: 'medium',
        targetPosition: 12,
        searchVolume: 1100,
        difficulty: 35,
        intent: 'informational'
      },
      {
        keyword: 'restaurant billing best practices',
        category: 'informational',
        priority: 'medium',
        targetPosition: 10,
        searchVolume: 390,
        difficulty: 28,
        intent: 'informational'
      }
    ];
  }

  /**
   * Initialize competitor data for tracking
   * @returns {Array} Competitor information
   */
  initializeCompetitors() {
    return [
      {
        name: 'Toast POS',
        domain: 'pos.toasttab.com',
        targetKeywords: ['restaurant pos system', 'restaurant management software'],
        marketShare: 0.15,
        strengths: ['Brand recognition', 'Feature completeness']
      },
      {
        name: 'Square for Restaurants',
        domain: 'squareup.com',
        targetKeywords: ['restaurant pos system', 'restaurant billing software'],
        marketShare: 0.12,
        strengths: ['Payment processing', 'Ease of use']
      },
      {
        name: 'Resy',
        domain: 'resy.com',
        targetKeywords: ['restaurant management software'],
        marketShare: 0.08,
        strengths: ['Reservation management', 'Customer experience']
      },
      {
        name: 'OpenTable',
        domain: 'opentable.com',
        targetKeywords: ['restaurant management software'],
        marketShare: 0.20,
        strengths: ['Market dominance', 'Network effects']
      },
      {
        name: 'Lightspeed Restaurant',
        domain: 'lightspeedhq.com',
        targetKeywords: ['restaurant pos system', 'restaurant management software'],
        marketShare: 0.10,
        strengths: ['International presence', 'Scalability']
      }
    ];
  }

  /**
   * Track daily keyword rankings
   * @returns {Promise<Object>} Daily tracking results
   */
  async trackDailyRankings() {
    const today = new Date().toISOString().split('T')[0];
    const trackingResults = {
      date: today,
      keywords: [],
      summary: {
        totalKeywords: this.targetKeywords.length,
        improved: 0,
        declined: 0,
        stable: 0,
        newRankings: 0
      },
      alerts: []
    };

    try {
      // Get current performance data from Search Console
      const performanceData = await this.searchConsoleAPI.getSearchPerformance({
        startDate: this.getDateString(-7),
        endDate: this.getDateString(-1)
      });

      // Process each target keyword
      for (const targetKeyword of this.targetKeywords) {
        const keywordResult = await this.trackKeywordRanking(
          targetKeyword, 
          performanceData,
          today
        );
        
        trackingResults.keywords.push(keywordResult);
        
        // Update summary
        if (keywordResult.trend === 'improved') {
          trackingResults.summary.improved++;
        } else if (keywordResult.trend === 'declined') {
          trackingResults.summary.declined++;
        } else {
          trackingResults.summary.stable++;
        }

        // Check for alerts
        const alerts = this.checkForAlerts(keywordResult, targetKeyword);
        trackingResults.alerts.push(...alerts);
      }

      // Store tracking history
      this.trackingHistory.set(today, trackingResults);

      return trackingResults;
    } catch (error) {
      console.error('Daily ranking tracking failed:', error);
      return null;
    }
  }

  /**
   * Track individual keyword ranking
   * @param {Object} targetKeyword - Target keyword data
   * @param {Object} performanceData - Search Console performance data
   * @param {string} date - Tracking date
   * @returns {Object} Keyword tracking result
   */
  async trackKeywordRanking(targetKeyword, performanceData, date) {
    const keyword = targetKeyword.keyword;
    
    // Find keyword in performance data
    const keywordData = performanceData.queries.find(q => 
      q.query.toLowerCase().includes(keyword.toLowerCase()) ||
      keyword.toLowerCase().includes(q.query.toLowerCase())
    );

    const currentRanking = {
      keyword: keyword,
      category: targetKeyword.category,
      priority: targetKeyword.priority,
      date: date,
      position: keywordData ? keywordData.position : null,
      clicks: keywordData ? keywordData.clicks : 0,
      impressions: keywordData ? keywordData.impressions : 0,
      ctr: keywordData ? keywordData.ctr : 0,
      targetPosition: targetKeyword.targetPosition,
      searchVolume: targetKeyword.searchVolume,
      difficulty: targetKeyword.difficulty
    };

    // Calculate trend compared to previous tracking
    const previousRanking = this.getPreviousRanking(keyword);
    if (previousRanking) {
      currentRanking.previousPosition = previousRanking.position;
      currentRanking.positionChange = previousRanking.position ? 
        (previousRanking.position - currentRanking.position) : 0;
      currentRanking.clicksChange = currentRanking.clicks - previousRanking.clicks;
      currentRanking.impressionsChange = currentRanking.impressions - previousRanking.impressions;
      
      // Determine trend
      if (currentRanking.positionChange > 0) {
        currentRanking.trend = 'improved';
      } else if (currentRanking.positionChange < 0) {
        currentRanking.trend = 'declined';
      } else {
        currentRanking.trend = 'stable';
      }
    } else {
      currentRanking.trend = 'new';
    }

    // Calculate performance score
    currentRanking.performanceScore = this.calculatePerformanceScore(currentRanking, targetKeyword);

    return currentRanking;
  }

  /**
   * Get previous ranking for keyword
   * @param {string} keyword - Keyword to look up
   * @returns {Object|null} Previous ranking data
   */
  getPreviousRanking(keyword) {
    // Get the most recent tracking data
    const dates = Array.from(this.trackingHistory.keys()).sort().reverse();
    
    for (const date of dates) {
      const trackingData = this.trackingHistory.get(date);
      const keywordData = trackingData.keywords.find(k => k.keyword === keyword);
      if (keywordData && keywordData.position) {
        return keywordData;
      }
    }
    
    return null;
  }

  /**
   * Calculate performance score for keyword
   * @param {Object} ranking - Current ranking data
   * @param {Object} target - Target keyword data
   * @returns {number} Performance score (0-100)
   */
  calculatePerformanceScore(ranking, target) {
    let score = 0;
    
    // Position score (40% weight)
    if (ranking.position) {
      const positionScore = Math.max(0, 100 - (ranking.position - 1) * 5);
      const targetBonus = ranking.position <= target.targetPosition ? 20 : 0;
      score += (positionScore + targetBonus) * 0.4;
    }

    // CTR score (30% weight)
    if (ranking.ctr > 0) {
      const expectedCTR = this.getExpectedCTR(ranking.position);
      const ctrScore = Math.min(100, (ranking.ctr / expectedCTR) * 100);
      score += ctrScore * 0.3;
    }

    // Trend score (20% weight)
    if (ranking.trend === 'improved') {
      score += 80 * 0.2;
    } else if (ranking.trend === 'stable') {
      score += 60 * 0.2;
    } else if (ranking.trend === 'declined') {
      score += 20 * 0.2;
    }

    // Volume score (10% weight)
    if (ranking.impressions > 0) {
      const volumeScore = Math.min(100, (ranking.impressions / target.searchVolume) * 100);
      score += volumeScore * 0.1;
    }

    return Math.round(Math.max(0, Math.min(100, score)));
  }

  /**
   * Get expected CTR for position
   * @param {number} position - Search result position
   * @returns {number} Expected CTR
   */
  getExpectedCTR(position) {
    const ctrByPosition = {
      1: 0.284, 2: 0.147, 3: 0.094, 4: 0.067, 5: 0.051,
      6: 0.041, 7: 0.034, 8: 0.029, 9: 0.025, 10: 0.022
    };
    
    return ctrByPosition[Math.floor(position)] || 0.01;
  }

  /**
   * Check for ranking alerts
   * @param {Object} ranking - Current ranking data
   * @param {Object} target - Target keyword data
   * @returns {Array} Alert objects
   */
  checkForAlerts(ranking, target) {
    const alerts = [];
    
    // Position drop alert
    if (ranking.positionChange && ranking.positionChange <= -this.alertThresholds.positionDrop) {
      alerts.push({
        type: 'position_drop',
        severity: 'high',
        keyword: ranking.keyword,
        message: `Position dropped by ${Math.abs(ranking.positionChange)} positions`,
        currentPosition: ranking.position,
        previousPosition: ranking.previousPosition,
        date: ranking.date
      });
    }

    // Position improvement alert
    if (ranking.positionChange && ranking.positionChange >= this.alertThresholds.positionImprovement) {
      alerts.push({
        type: 'position_improvement',
        severity: 'positive',
        keyword: ranking.keyword,
        message: `Position improved by ${ranking.positionChange} positions`,
        currentPosition: ranking.position,
        previousPosition: ranking.previousPosition,
        date: ranking.date
      });
    }

    // Target position achieved
    if (ranking.position && ranking.position <= target.targetPosition) {
      alerts.push({
        type: 'target_achieved',
        severity: 'positive',
        keyword: ranking.keyword,
        message: `Target position achieved (${ranking.position} <= ${target.targetPosition})`,
        currentPosition: ranking.position,
        targetPosition: target.targetPosition,
        date: ranking.date
      });
    }

    // Clicks drop alert
    if (ranking.clicksChange && ranking.previousPosition) {
      const clicksDropPercentage = Math.abs(ranking.clicksChange) / Math.max(ranking.clicks + Math.abs(ranking.clicksChange), 1);
      if (ranking.clicksChange < 0 && clicksDropPercentage >= this.alertThresholds.clicksDrop) {
        alerts.push({
          type: 'clicks_drop',
          severity: 'medium',
          keyword: ranking.keyword,
          message: `Clicks dropped by ${Math.round(clicksDropPercentage * 100)}%`,
          currentClicks: ranking.clicks,
          clicksChange: ranking.clicksChange,
          date: ranking.date
        });
      }
    }

    return alerts;
  }

  /**
   * Track competitor keyword performance
   * @param {Array} keywords - Keywords to track for competitors
   * @returns {Promise<Object>} Competitor tracking results
   */
  async trackCompetitorPerformance(keywords = null) {
    const targetKeywords = keywords || this.targetKeywords.map(k => k.keyword);
    const competitorResults = {};

    // For demo purposes, generate mock competitor data
    for (const competitor of this.competitors) {
      competitorResults[competitor.name] = {
        domain: competitor.domain,
        keywords: {},
        summary: {
          averagePosition: 0,
          totalKeywords: 0,
          topPositions: 0
        }
      };

      let totalPosition = 0;
      let keywordCount = 0;

      for (const keyword of targetKeywords) {
        // Generate mock competitor ranking data
        const mockPosition = this.generateMockCompetitorPosition(competitor, keyword);
        
        competitorResults[competitor.name].keywords[keyword] = {
          position: mockPosition,
          estimatedTraffic: this.estimateTrafficFromPosition(mockPosition, keyword),
          lastUpdated: new Date().toISOString()
        };

        if (mockPosition > 0) {
          totalPosition += mockPosition;
          keywordCount++;
          
          if (mockPosition <= 3) {
            competitorResults[competitor.name].summary.topPositions++;
          }
        }
      }

      competitorResults[competitor.name].summary.averagePosition = 
        keywordCount > 0 ? totalPosition / keywordCount : 0;
      competitorResults[competitor.name].summary.totalKeywords = keywordCount;
    }

    return competitorResults;
  }

  /**
   * Generate mock competitor position for demo
   * @param {Object} competitor - Competitor data
   * @param {string} keyword - Target keyword
   * @returns {number} Mock position
   */
  generateMockCompetitorPosition(competitor, keyword) {
    // Use competitor market share and keyword relevance to generate realistic positions
    const basePosition = Math.floor(1 / competitor.marketShare);
    const keywordRelevance = competitor.targetKeywords.includes(keyword) ? 0.8 : 0.3;
    const randomFactor = Math.random() * 10;
    
    const position = Math.floor(basePosition * (1 - keywordRelevance) + randomFactor);
    return Math.max(1, Math.min(50, position));
  }

  /**
   * Estimate traffic from position
   * @param {number} position - Search position
   * @param {string} keyword - Keyword
   * @returns {number} Estimated monthly traffic
   */
  estimateTrafficFromPosition(position, keyword) {
    const keywordData = this.targetKeywords.find(k => k.keyword === keyword);
    const searchVolume = keywordData ? keywordData.searchVolume : 100;
    const ctr = this.getExpectedCTR(position);
    
    return Math.floor(searchVolume * ctr);
  }

  /**
   * Generate keyword ranking change detection
   * @param {number} days - Number of days to analyze
   * @returns {Promise<Object>} Ranking change analysis
   */
  async detectRankingChanges(days = 7) {
    const changes = {
      significant: [],
      moderate: [],
      minor: [],
      summary: {
        totalChanges: 0,
        improvements: 0,
        declines: 0
      }
    };

    // Get tracking data for the specified period
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

    for (const keyword of this.targetKeywords) {
      const changeAnalysis = this.analyzeKeywordChange(keyword.keyword, startDate, endDate);
      
      if (changeAnalysis) {
        changes.summary.totalChanges++;
        
        if (changeAnalysis.positionChange > 0) {
          changes.summary.improvements++;
        } else if (changeAnalysis.positionChange < 0) {
          changes.summary.declines++;
        }

        // Categorize change significance
        const absChange = Math.abs(changeAnalysis.positionChange);
        if (absChange >= 5) {
          changes.significant.push(changeAnalysis);
        } else if (absChange >= 2) {
          changes.moderate.push(changeAnalysis);
        } else if (absChange > 0) {
          changes.minor.push(changeAnalysis);
        }
      }
    }

    return changes;
  }

  /**
   * Analyze keyword change over period
   * @param {string} keyword - Keyword to analyze
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Object|null} Change analysis
   */
  analyzeKeywordChange(keyword, startDate, endDate) {
    const relevantData = [];
    
    // Collect tracking data within date range
    for (const [date, trackingData] of this.trackingHistory.entries()) {
      const trackingDate = new Date(date);
      if (trackingDate >= startDate && trackingDate <= endDate) {
        const keywordData = trackingData.keywords.find(k => k.keyword === keyword);
        if (keywordData && keywordData.position) {
          relevantData.push(keywordData);
        }
      }
    }

    if (relevantData.length < 2) {
      return null;
    }

    // Sort by date
    relevantData.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const firstEntry = relevantData[0];
    const lastEntry = relevantData[relevantData.length - 1];

    return {
      keyword: keyword,
      startDate: firstEntry.date,
      endDate: lastEntry.date,
      startPosition: firstEntry.position,
      endPosition: lastEntry.position,
      positionChange: firstEntry.position - lastEntry.position,
      clicksChange: lastEntry.clicks - firstEntry.clicks,
      impressionsChange: lastEntry.impressions - firstEntry.impressions,
      dataPoints: relevantData.length
    };
  }

  /**
   * Get comprehensive keyword report
   * @param {Object} options - Report options
   * @returns {Promise<Object>} Comprehensive keyword report
   */
  async getKeywordReport(options = {}) {
    const reportPeriod = options.days || 30;
    
    try {
      const [dailyTracking, competitorData, rankingChanges] = await Promise.all([
        this.trackDailyRankings(),
        this.trackCompetitorPerformance(),
        this.detectRankingChanges(reportPeriod)
      ]);

      return {
        reportDate: new Date().toISOString(),
        period: reportPeriod,
        dailyTracking,
        competitorAnalysis: competitorData,
        rankingChanges,
        recommendations: this.generateKeywordRecommendations(dailyTracking, rankingChanges)
      };
    } catch (error) {
      console.error('Failed to generate keyword report:', error);
      return null;
    }
  }

  /**
   * Generate keyword optimization recommendations
   * @param {Object} dailyTracking - Daily tracking data
   * @param {Object} rankingChanges - Ranking changes data
   * @returns {Array} Recommendations
   */
  generateKeywordRecommendations(dailyTracking, rankingChanges) {
    const recommendations = [];

    // Analyze underperforming keywords
    const underperforming = dailyTracking.keywords.filter(k => 
      k.position && k.position > k.targetPosition + 5
    );

    underperforming.forEach(keyword => {
      recommendations.push({
        type: 'optimization',
        priority: keyword.priority === 'high' ? 'high' : 'medium',
        keyword: keyword.keyword,
        message: `Optimize content for "${keyword.keyword}" - currently at position ${keyword.position}, target is ${keyword.targetPosition}`,
        action: 'content_optimization',
        currentPosition: keyword.position,
        targetPosition: keyword.targetPosition
      });
    });

    // Analyze declining keywords
    const declining = rankingChanges.significant.filter(change => change.positionChange < 0);
    declining.forEach(change => {
      recommendations.push({
        type: 'urgent',
        priority: 'high',
        keyword: change.keyword,
        message: `Urgent: "${change.keyword}" dropped ${Math.abs(change.positionChange)} positions`,
        action: 'investigate_decline',
        positionChange: change.positionChange,
        timeframe: `${change.startDate} to ${change.endDate}`
      });
    });

    // Identify opportunity keywords
    const opportunities = dailyTracking.keywords.filter(k => 
      k.position && k.position > 10 && k.position <= 20 && k.searchVolume > 500
    );

    opportunities.forEach(keyword => {
      recommendations.push({
        type: 'opportunity',
        priority: 'medium',
        keyword: keyword.keyword,
        message: `Opportunity: "${keyword.keyword}" at position ${keyword.position} with high search volume`,
        action: 'content_expansion',
        currentPosition: keyword.position,
        searchVolume: keyword.searchVolume
      });
    });

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Get date string for API queries
   * @param {number} daysAgo - Days ago from today
   * @returns {string} Date string in YYYY-MM-DD format
   */
  getDateString(daysAgo) {
    const date = new Date();
    date.setDate(date.getDate() + daysAgo);
    return date.toISOString().split('T')[0];
  }
}

export default KeywordTracker;