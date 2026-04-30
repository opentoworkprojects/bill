/**
 * Competitor Analyzer - Handles competitor monitoring and analysis
 * Implements Requirements: 8.1, 8.2, 8.4, 8.5
 */

class CompetitorAnalyzer {
  constructor(config = {}) {
    this.competitors = this.initializeCompetitors();
    this.targetKeywords = this.initializeTargetKeywords();
    this.analysisHistory = new Map();
    this.monitoringConfig = {
      updateFrequency: 'weekly',
      alertThresholds: {
        newCompetitor: 0.05, // 5% market share
        rankingImprovement: 5, // 5 position improvement
        contentGap: 10, // 10 new content pieces
        keywordVulnerability: 3 // 3 position drop
      }
    };
  }

  /**
   * Initialize competitor data
   * @returns {Array} Competitor information
   */
  initializeCompetitors() {
    return [
      {
        id: 'toast-pos',
        name: 'Toast POS',
        domain: 'pos.toasttab.com',
        description: 'Cloud-based restaurant management platform',
        marketShare: 0.15,
        founded: 2012,
        headquarters: 'Boston, MA, USA',
        employees: '5000+',
        funding: '$900M+',
        strengths: [
          'Strong brand recognition',
          'Comprehensive feature set',
          'Large customer base',
          'Extensive integrations'
        ],
        weaknesses: [
          'High pricing',
          'Complex setup',
          'US-focused',
          'Limited customization'
        ],
        targetMarkets: ['United States', 'Canada'],
        primaryKeywords: [
          'restaurant pos system',
          'restaurant management software',
          'cloud pos system',
          'restaurant technology'
        ],
        contentStrategy: 'thought-leadership',
        socialPresence: {
          linkedin: 45000,
          twitter: 12000,
          facebook: 8500
        }
      },
      {
        id: 'square-restaurants',
        name: 'Square for Restaurants',
        domain: 'squareup.com',
        description: 'Payment and restaurant management solutions',
        marketShare: 0.12,
        founded: 2009,
        headquarters: 'San Francisco, CA, USA',
        employees: '8000+',
        funding: 'Public (NYSE: SQ)',
        strengths: [
          'Payment processing integration',
          'Easy setup and use',
          'Competitive pricing',
          'Strong mobile presence'
        ],
        weaknesses: [
          'Limited advanced features',
          'Basic reporting',
          'US-centric',
          'Less customization'
        ],
        targetMarkets: ['United States', 'Canada', 'Australia', 'UK'],
        primaryKeywords: [
          'restaurant pos system',
          'restaurant payment processing',
          'square pos',
          'restaurant billing software'
        ],
        contentStrategy: 'educational',
        socialPresence: {
          linkedin: 180000,
          twitter: 85000,
          facebook: 120000
        }
      },
      {
        id: 'lightspeed-restaurant',
        name: 'Lightspeed Restaurant',
        domain: 'lightspeedhq.com',
        description: 'Retail and restaurant POS solutions',
        marketShare: 0.10,
        founded: 2005,
        headquarters: 'Montreal, QC, Canada',
        employees: '1000+',
        funding: 'Public (TSX: LSPD)',
        strengths: [
          'International presence',
          'Scalable solutions',
          'Good analytics',
          'Multi-location support'
        ],
        weaknesses: [
          'Complex pricing',
          'Steep learning curve',
          'Limited integrations',
          'Customer service issues'
        ],
        targetMarkets: ['North America', 'Europe', 'Asia-Pacific'],
        primaryKeywords: [
          'restaurant pos system',
          'retail pos system',
          'restaurant management software',
          'multi-location pos'
        ],
        contentStrategy: 'case-studies',
        socialPresence: {
          linkedin: 25000,
          twitter: 8000,
          facebook: 5500
        }
      },
      {
        id: 'resy',
        name: 'Resy',
        domain: 'resy.com',
        description: 'Restaurant reservation and management platform',
        marketShare: 0.08,
        founded: 2014,
        headquarters: 'New York, NY, USA',
        employees: '500+',
        funding: 'Acquired by American Express',
        strengths: [
          'Strong reservation system',
          'Customer experience focus',
          'Brand partnerships',
          'Mobile-first approach'
        ],
        weaknesses: [
          'Limited POS features',
          'Narrow focus',
          'High-end market only',
          'Limited global presence'
        ],
        targetMarkets: ['United States', 'Select international cities'],
        primaryKeywords: [
          'restaurant reservations',
          'restaurant management',
          'table booking system',
          'restaurant customer management'
        ],
        contentStrategy: 'lifestyle-focused',
        socialPresence: {
          linkedin: 15000,
          twitter: 45000,
          facebook: 35000
        }
      },
      {
        id: 'opentable',
        name: 'OpenTable',
        domain: 'opentable.com',
        description: 'Restaurant reservation and management network',
        marketShare: 0.20,
        founded: 1998,
        headquarters: 'San Francisco, CA, USA',
        employees: '2000+',
        funding: 'Public (part of Booking Holdings)',
        strengths: [
          'Market leader in reservations',
          'Extensive restaurant network',
          'Strong consumer brand',
          'Global presence'
        ],
        weaknesses: [
          'High commission fees',
          'Limited POS integration',
          'Expensive for small restaurants',
          'Dependency on their platform'
        ],
        targetMarkets: ['Global', 'Focus on major cities'],
        primaryKeywords: [
          'restaurant reservations',
          'restaurant management',
          'online booking system',
          'restaurant software'
        ],
        contentStrategy: 'data-driven',
        socialPresence: {
          linkedin: 85000,
          twitter: 125000,
          facebook: 450000
        }
      },
      {
        id: 'petpooja',
        name: 'PetPooja',
        domain: 'petpooja.com',
        description: 'Indian restaurant management software',
        marketShare: 0.06,
        founded: 2012,
        headquarters: 'Ahmedabad, Gujarat, India',
        employees: '500+',
        funding: '$5M+',
        strengths: [
          'India market focus',
          'Local language support',
          'Affordable pricing',
          'Good customer support'
        ],
        weaknesses: [
          'Limited international presence',
          'Basic features',
          'Limited integrations',
          'Outdated interface'
        ],
        targetMarkets: ['India', 'South Asia'],
        primaryKeywords: [
          'restaurant software india',
          'restaurant pos system india',
          'restaurant billing software',
          'kot software india'
        ],
        contentStrategy: 'local-focused',
        socialPresence: {
          linkedin: 5000,
          twitter: 2000,
          facebook: 8000
        }
      }
    ];
  }

  /**
   * Initialize target keywords for competitor analysis
   * @returns {Array} Target keywords
   */
  initializeTargetKeywords() {
    return [
      // Primary commercial keywords
      { keyword: 'restaurant billing software', priority: 'high', volume: 2400 },
      { keyword: 'restaurant pos system', priority: 'high', volume: 8100 },
      { keyword: 'restaurant management software', priority: 'high', volume: 3600 },
      { keyword: 'kot software', priority: 'medium', volume: 880 },
      { keyword: 'kitchen order ticket software', priority: 'medium', volume: 590 },
      
      // Secondary keywords
      { keyword: 'restaurant inventory management', priority: 'medium', volume: 1900 },
      { keyword: 'restaurant staff management software', priority: 'medium', volume: 720 },
      { keyword: 'restaurant payment processing', priority: 'medium', volume: 2200 },
      
      // Long-tail keywords
      { keyword: 'best restaurant billing software', priority: 'medium', volume: 480 },
      { keyword: 'restaurant pos system price', priority: 'low', volume: 320 },
      { keyword: 'cloud restaurant management software', priority: 'medium', volume: 650 },
      
      // Local keywords
      { keyword: 'restaurant software india', priority: 'high', volume: 1200 },
      { keyword: 'restaurant pos system india', priority: 'high', volume: 890 },
      { keyword: 'restaurant billing software india', priority: 'medium', volume: 560 }
    ];
  }

  /**
   * Monitor competitor keyword rankings and strategies
   * @param {Array} competitors - Competitors to monitor (optional)
   * @returns {Promise<Object>} Competitor monitoring results
   */
  async monitorCompetitorStrategies(competitors = null) {
    const targetCompetitors = competitors || this.competitors;
    const monitoringResults = {
      date: new Date().toISOString(),
      competitors: {},
      keywordAnalysis: {},
      contentGaps: [],
      opportunities: [],
      threats: []
    };

    for (const competitor of targetCompetitors) {
      try {
        const competitorAnalysis = await this.analyzeCompetitor(competitor);
        monitoringResults.competitors[competitor.id] = competitorAnalysis;

        // Analyze keyword performance
        const keywordPerformance = this.analyzeCompetitorKeywords(competitor, competitorAnalysis);
        monitoringResults.keywordAnalysis[competitor.id] = keywordPerformance;

        // Identify opportunities and threats
        const opportunities = this.identifyOpportunities(competitor, competitorAnalysis);
        const threats = this.identifyThreats(competitor, competitorAnalysis);
        
        monitoringResults.opportunities.push(...opportunities);
        monitoringResults.threats.push(...threats);

      } catch (error) {
        console.error(`Failed to analyze competitor ${competitor.name}:`, error);
      }
    }

    // Identify content gaps
    monitoringResults.contentGaps = this.identifyContentGaps(monitoringResults.competitors);

    // Store analysis history
    this.analysisHistory.set(new Date().toISOString().split('T')[0], monitoringResults);

    return monitoringResults;
  }

  /**
   * Analyze individual competitor
   * @param {Object} competitor - Competitor data
   * @returns {Promise<Object>} Competitor analysis
   */
  async analyzeCompetitor(competitor) {
    // For demo purposes, generate mock analysis data
    const analysis = {
      basicInfo: {
        name: competitor.name,
        domain: competitor.domain,
        marketShare: competitor.marketShare,
        lastAnalyzed: new Date().toISOString()
      },
      seoMetrics: this.generateMockSEOMetrics(competitor),
      contentAnalysis: this.generateMockContentAnalysis(competitor),
      keywordRankings: this.generateMockKeywordRankings(competitor),
      backlinks: this.generateMockBacklinkData(competitor),
      socialMetrics: competitor.socialPresence,
      technicalSEO: this.generateMockTechnicalSEO(competitor),
      contentStrategy: this.analyzeContentStrategy(competitor)
    };

    return analysis;
  }

  /**
   * Generate mock SEO metrics for competitor
   * @param {Object} competitor - Competitor data
   * @returns {Object} SEO metrics
   */
  generateMockSEOMetrics(competitor) {
    const baseScore = Math.floor(competitor.marketShare * 400 + Math.random() * 200);
    
    return {
      domainAuthority: Math.min(100, baseScore / 10),
      organicKeywords: Math.floor(competitor.marketShare * 10000 + Math.random() * 5000),
      organicTraffic: Math.floor(competitor.marketShare * 500000 + Math.random() * 200000),
      backlinks: Math.floor(competitor.marketShare * 50000 + Math.random() * 25000),
      referringDomains: Math.floor(competitor.marketShare * 2000 + Math.random() * 1000),
      topKeywords: this.generateTopKeywordsForCompetitor(competitor)
    };
  }

  /**
   * Generate top keywords for competitor
   * @param {Object} competitor - Competitor data
   * @returns {Array} Top keywords
   */
  generateTopKeywordsForCompetitor(competitor) {
    const relevantKeywords = this.targetKeywords.filter(k => 
      competitor.primaryKeywords.some(pk => 
        k.keyword.toLowerCase().includes(pk.toLowerCase()) || 
        pk.toLowerCase().includes(k.keyword.toLowerCase())
      )
    );

    return relevantKeywords.slice(0, 10).map(keyword => ({
      keyword: keyword.keyword,
      position: Math.floor(Math.random() * 20) + 1,
      volume: keyword.volume,
      traffic: Math.floor(keyword.volume * (Math.random() * 0.1 + 0.02)),
      difficulty: Math.floor(Math.random() * 40) + 30
    }));
  }

  /**
   * Generate mock content analysis
   * @param {Object} competitor - Competitor data
   * @returns {Object} Content analysis
   */
  generateMockContentAnalysis(competitor) {
    const contentMultiplier = {
      'thought-leadership': 1.5,
      'educational': 1.3,
      'case-studies': 1.1,
      'lifestyle-focused': 0.9,
      'data-driven': 1.4,
      'local-focused': 0.8
    };

    const baseContent = Math.floor(competitor.marketShare * 500);
    const multiplier = contentMultiplier[competitor.contentStrategy] || 1;

    return {
      totalPages: Math.floor(baseContent * multiplier),
      blogPosts: Math.floor(baseContent * multiplier * 0.3),
      productPages: Math.floor(baseContent * multiplier * 0.2),
      resourcePages: Math.floor(baseContent * multiplier * 0.15),
      contentFrequency: this.estimateContentFrequency(competitor),
      topPerformingContent: this.generateTopContent(competitor),
      contentGaps: this.identifyCompetitorContentGaps(competitor)
    };
  }

  /**
   * Estimate content publishing frequency
   * @param {Object} competitor - Competitor data
   * @returns {Object} Content frequency data
   */
  estimateContentFrequency(competitor) {
    const frequencies = {
      'thought-leadership': { blog: 8, resources: 2, updates: 4 },
      'educational': { blog: 12, resources: 4, updates: 6 },
      'case-studies': { blog: 4, resources: 6, updates: 2 },
      'lifestyle-focused': { blog: 15, resources: 1, updates: 8 },
      'data-driven': { blog: 6, resources: 8, updates: 3 },
      'local-focused': { blog: 10, resources: 2, updates: 5 }
    };

    return frequencies[competitor.contentStrategy] || { blog: 6, resources: 2, updates: 3 };
  }

  /**
   * Generate top performing content for competitor
   * @param {Object} competitor - Competitor data
   * @returns {Array} Top content pieces
   */
  generateTopContent(competitor) {
    const contentTypes = {
      'thought-leadership': [
        'Future of Restaurant Technology',
        'Industry Trends and Predictions',
        'Leadership Insights and Vision'
      ],
      'educational': [
        'How to Choose Restaurant Software',
        'Restaurant Management Best Practices',
        'Setup and Implementation Guides'
      ],
      'case-studies': [
        'Customer Success Stories',
        'ROI Case Studies',
        'Implementation Examples'
      ],
      'lifestyle-focused': [
        'Restaurant Culture and Trends',
        'Dining Experience Enhancement',
        'Customer Journey Stories'
      ],
      'data-driven': [
        'Industry Reports and Analytics',
        'Market Research Findings',
        'Performance Benchmarks'
      ],
      'local-focused': [
        'Local Market Insights',
        'Regional Success Stories',
        'Local Partnership Announcements'
      ]
    };

    const topics = contentTypes[competitor.contentStrategy] || contentTypes['educational'];
    
    return topics.map((topic, index) => ({
      title: topic,
      estimatedTraffic: Math.floor(Math.random() * 5000) + 1000,
      socialShares: Math.floor(Math.random() * 500) + 50,
      backlinks: Math.floor(Math.random() * 100) + 10,
      publishDate: this.getRandomDate(-365, -30)
    }));
  }

  /**
   * Generate mock keyword rankings for competitor
   * @param {Object} competitor - Competitor data
   * @returns {Object} Keyword rankings
   */
  generateMockKeywordRankings(competitor) {
    const rankings = {};
    
    this.targetKeywords.forEach(keyword => {
      const isRelevant = competitor.primaryKeywords.some(pk => 
        keyword.keyword.toLowerCase().includes(pk.toLowerCase()) || 
        pk.toLowerCase().includes(keyword.keyword.toLowerCase())
      );

      if (isRelevant || Math.random() > 0.7) {
        const basePosition = Math.floor(1 / competitor.marketShare);
        const randomFactor = Math.random() * 15;
        const position = Math.max(1, Math.min(50, Math.floor(basePosition + randomFactor)));

        rankings[keyword.keyword] = {
          position: position,
          previousPosition: position + Math.floor(Math.random() * 6) - 3,
          trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
          estimatedTraffic: Math.floor(keyword.volume * this.getCTRForPosition(position))
        };
      }
    });

    return rankings;
  }

  /**
   * Get CTR for search position
   * @param {number} position - Search position
   * @returns {number} CTR estimate
   */
  getCTRForPosition(position) {
    const ctrByPosition = {
      1: 0.284, 2: 0.147, 3: 0.094, 4: 0.067, 5: 0.051,
      6: 0.041, 7: 0.034, 8: 0.029, 9: 0.025, 10: 0.022
    };
    
    return ctrByPosition[position] || 0.01;
  }

  /**
   * Generate mock backlink data
   * @param {Object} competitor - Competitor data
   * @returns {Object} Backlink data
   */
  generateMockBacklinkData(competitor) {
    const baseBacklinks = Math.floor(competitor.marketShare * 50000);
    
    return {
      totalBacklinks: baseBacklinks,
      referringDomains: Math.floor(baseBacklinks * 0.1),
      domainAuthority: Math.floor(competitor.marketShare * 400 + 20),
      topReferrers: [
        { domain: 'techcrunch.com', links: Math.floor(Math.random() * 50) + 10 },
        { domain: 'forbes.com', links: Math.floor(Math.random() * 30) + 5 },
        { domain: 'restaurantbusinessonline.com', links: Math.floor(Math.random() * 40) + 8 },
        { domain: 'nrn.com', links: Math.floor(Math.random() * 25) + 3 },
        { domain: 'qsrmagazine.com', links: Math.floor(Math.random() * 35) + 6 }
      ],
      linkGrowth: {
        monthly: Math.floor(Math.random() * 1000) + 200,
        trend: Math.random() > 0.3 ? 'growing' : 'stable'
      }
    };
  }

  /**
   * Generate mock technical SEO data
   * @param {Object} competitor - Competitor data
   * @returns {Object} Technical SEO data
   */
  generateMockTechnicalSEO(competitor) {
    return {
      pageSpeed: {
        desktop: Math.floor(Math.random() * 30) + 70,
        mobile: Math.floor(Math.random() * 25) + 65
      },
      coreWebVitals: {
        lcp: Math.random() * 2 + 1.5, // Largest Contentful Paint
        fid: Math.random() * 100 + 50, // First Input Delay
        cls: Math.random() * 0.1 + 0.05 // Cumulative Layout Shift
      },
      indexedPages: Math.floor(competitor.marketShare * 10000 + Math.random() * 5000),
      crawlErrors: Math.floor(Math.random() * 50),
      httpsUsage: Math.random() > 0.1 ? 100 : Math.floor(Math.random() * 20) + 80,
      mobileOptimization: Math.floor(Math.random() * 20) + 80
    };
  }

  /**
   * Analyze competitor content strategy
   * @param {Object} competitor - Competitor data
   * @returns {Object} Content strategy analysis
   */
  analyzeContentStrategy(competitor) {
    return {
      strategy: competitor.contentStrategy,
      strengths: this.getContentStrategyStrengths(competitor.contentStrategy),
      weaknesses: this.getContentStrategyWeaknesses(competitor.contentStrategy),
      opportunities: this.getContentOpportunities(competitor),
      recommendedCounterStrategy: this.getCounterStrategy(competitor.contentStrategy)
    };
  }

  /**
   * Get content strategy strengths
   * @param {string} strategy - Content strategy type
   * @returns {Array} Strategy strengths
   */
  getContentStrategyStrengths(strategy) {
    const strengths = {
      'thought-leadership': ['Authority building', 'Industry influence', 'Media coverage'],
      'educational': ['User value', 'SEO benefits', 'Lead generation'],
      'case-studies': ['Social proof', 'Conversion optimization', 'Trust building'],
      'lifestyle-focused': ['Brand engagement', 'Social sharing', 'Community building'],
      'data-driven': ['Credibility', 'Media pickup', 'Industry authority'],
      'local-focused': ['Local relevance', 'Community connection', 'Regional authority']
    };

    return strengths[strategy] || ['Content consistency', 'Brand awareness'];
  }

  /**
   * Get content strategy weaknesses
   * @param {string} strategy - Content strategy type
   * @returns {Array} Strategy weaknesses
   */
  getContentStrategyWeaknesses(strategy) {
    const weaknesses = {
      'thought-leadership': ['High resource requirement', 'Slow ROI', 'Expertise dependency'],
      'educational': ['High competition', 'Content saturation', 'Maintenance overhead'],
      'case-studies': ['Limited scalability', 'Customer dependency', 'Narrow appeal'],
      'lifestyle-focused': ['Low conversion', 'Trend dependency', 'Measurement difficulty'],
      'data-driven': ['Resource intensive', 'Technical complexity', 'Update frequency'],
      'local-focused': ['Limited reach', 'Scalability issues', 'Local competition']
    };

    return weaknesses[strategy] || ['Resource constraints', 'Measurement challenges'];
  }

  /**
   * Get content opportunities against competitor
   * @param {Object} competitor - Competitor data
   * @returns {Array} Content opportunities
   */
  getContentOpportunities(competitor) {
    const opportunities = [];

    // Identify gaps in their content strategy
    if (competitor.contentStrategy === 'thought-leadership') {
      opportunities.push('Create practical, actionable content to complement their high-level insights');
    }
    
    if (competitor.contentStrategy === 'educational') {
      opportunities.push('Develop advanced, specialized content for experienced users');
    }

    if (competitor.contentStrategy === 'case-studies') {
      opportunities.push('Create broader industry insights and trend analysis');
    }

    // Add market-specific opportunities
    if (!competitor.targetMarkets.includes('India')) {
      opportunities.push('Focus on India-specific content and local market insights');
    }

    return opportunities;
  }

  /**
   * Get recommended counter strategy
   * @param {string} competitorStrategy - Competitor's content strategy
   * @returns {string} Recommended counter strategy
   */
  getCounterStrategy(competitorStrategy) {
    const counterStrategies = {
      'thought-leadership': 'practical-educational',
      'educational': 'advanced-technical',
      'case-studies': 'data-driven-insights',
      'lifestyle-focused': 'business-focused',
      'data-driven': 'story-driven',
      'local-focused': 'global-perspective'
    };

    return counterStrategies[competitorStrategy] || 'differentiated-value';
  }

  /**
   * Analyze competitor keywords for opportunities
   * @param {Object} competitor - Competitor data
   * @param {Object} analysis - Competitor analysis
   * @returns {Object} Keyword analysis
   */
  analyzeCompetitorKeywords(competitor, analysis) {
    const keywordAnalysis = {
      strongKeywords: [],
      weakKeywords: [],
      opportunities: [],
      threats: []
    };

    Object.entries(analysis.keywordRankings).forEach(([keyword, data]) => {
      if (data.position <= 5) {
        keywordAnalysis.strongKeywords.push({
          keyword,
          position: data.position,
          estimatedTraffic: data.estimatedTraffic
        });
        
        if (data.position <= 3) {
          keywordAnalysis.threats.push({
            keyword,
            competitor: competitor.name,
            position: data.position,
            threat: 'high'
          });
        }
      } else if (data.position > 10) {
        keywordAnalysis.weakKeywords.push({
          keyword,
          position: data.position,
          opportunity: 'medium'
        });
        
        keywordAnalysis.opportunities.push({
          keyword,
          competitor: competitor.name,
          theirPosition: data.position,
          opportunity: 'outrank'
        });
      }
    });

    return keywordAnalysis;
  }

  /**
   * Identify opportunities against competitor
   * @param {Object} competitor - Competitor data
   * @param {Object} analysis - Competitor analysis
   * @returns {Array} Opportunities
   */
  identifyOpportunities(competitor, analysis) {
    const opportunities = [];

    // Keyword opportunities
    Object.entries(analysis.keywordRankings).forEach(([keyword, data]) => {
      if (data.position > 10 && data.position <= 20) {
        opportunities.push({
          type: 'keyword',
          competitor: competitor.name,
          keyword: keyword,
          theirPosition: data.position,
          opportunity: `Target "${keyword}" - competitor ranks at position ${data.position}`,
          priority: 'medium',
          estimatedTraffic: data.estimatedTraffic
        });
      }
    });

    // Content gaps
    const contentGaps = this.identifyCompetitorContentGaps(competitor);
    contentGaps.forEach(gap => {
      opportunities.push({
        type: 'content',
        competitor: competitor.name,
        opportunity: gap.opportunity,
        priority: gap.priority,
        topic: gap.topic
      });
    });

    // Technical opportunities
    if (analysis.technicalSEO.pageSpeed.mobile < 70) {
      opportunities.push({
        type: 'technical',
        competitor: competitor.name,
        opportunity: 'Outperform on mobile page speed',
        priority: 'high',
        details: `Their mobile speed score: ${analysis.technicalSEO.pageSpeed.mobile}`
      });
    }

    return opportunities;
  }

  /**
   * Identify threats from competitor
   * @param {Object} competitor - Competitor data
   * @param {Object} analysis - Competitor analysis
   * @returns {Array} Threats
   */
  identifyThreats(competitor, analysis) {
    const threats = [];

    // Strong keyword positions
    Object.entries(analysis.keywordRankings).forEach(([keyword, data]) => {
      if (data.position <= 3) {
        threats.push({
          type: 'keyword_dominance',
          competitor: competitor.name,
          keyword: keyword,
          position: data.position,
          threat: `Strong position in "${keyword}"`,
          severity: 'high',
          estimatedTraffic: data.estimatedTraffic
        });
      }
    });

    // Market share threats
    if (competitor.marketShare > 0.10) {
      threats.push({
        type: 'market_dominance',
        competitor: competitor.name,
        threat: `High market share (${(competitor.marketShare * 100).toFixed(1)}%)`,
        severity: 'high',
        details: 'Strong brand recognition and customer base'
      });
    }

    // Content volume threats
    if (analysis.contentAnalysis.totalPages > 1000) {
      threats.push({
        type: 'content_volume',
        competitor: competitor.name,
        threat: `Large content library (${analysis.contentAnalysis.totalPages} pages)`,
        severity: 'medium',
        details: 'Extensive content coverage and SEO authority'
      });
    }

    return threats;
  }

  /**
   * Identify content gaps for competitor
   * @param {Object} competitor - Competitor data
   * @returns {Array} Content gaps
   */
  identifyCompetitorContentGaps(competitor) {
    const gaps = [];

    // Based on their target markets
    if (!competitor.targetMarkets.includes('India')) {
      gaps.push({
        topic: 'India market content',
        opportunity: 'Create India-specific restaurant management content',
        priority: 'high',
        reason: 'Competitor has no India market focus'
      });
    }

    // Based on their content strategy
    if (competitor.contentStrategy !== 'educational') {
      gaps.push({
        topic: 'Educational content',
        opportunity: 'Develop comprehensive how-to guides and tutorials',
        priority: 'medium',
        reason: 'Competitor focuses less on educational content'
      });
    }

    // Technical content gaps
    if (competitor.contentStrategy !== 'data-driven') {
      gaps.push({
        topic: 'Industry data and insights',
        opportunity: 'Create data-driven industry reports and benchmarks',
        priority: 'medium',
        reason: 'Competitor lacks data-driven content approach'
      });
    }

    return gaps;
  }

  /**
   * Identify content gaps across all competitors
   * @param {Object} competitorAnalyses - All competitor analyses
   * @returns {Array} Content gaps
   */
  identifyContentGaps(competitorAnalyses) {
    const contentGaps = [];
    const coveredTopics = new Set();

    // Collect all topics covered by competitors
    Object.values(competitorAnalyses).forEach(analysis => {
      if (analysis.contentAnalysis && analysis.contentAnalysis.topPerformingContent) {
        analysis.contentAnalysis.topPerformingContent.forEach(content => {
          coveredTopics.add(content.title.toLowerCase());
        });
      }
    });

    // Identify potential topics not well covered
    const potentialTopics = [
      'Restaurant KOT System Implementation',
      'Indian Restaurant Management Challenges',
      'Small Restaurant Technology Solutions',
      'Restaurant Billing Compliance India',
      'Cloud vs On-Premise Restaurant Software',
      'Restaurant Staff Training Technology',
      'Restaurant Inventory Optimization',
      'Restaurant Customer Analytics',
      'Restaurant Multi-Location Management',
      'Restaurant Technology ROI Analysis'
    ];

    potentialTopics.forEach(topic => {
      const isWellCovered = Array.from(coveredTopics).some(covered => 
        covered.includes(topic.toLowerCase().split(' ')[0]) ||
        topic.toLowerCase().includes(covered.split(' ')[0])
      );

      if (!isWellCovered) {
        contentGaps.push({
          topic: topic,
          opportunity: `Create comprehensive content about ${topic}`,
          priority: 'medium',
          competitorCoverage: 'low',
          estimatedSearchVolume: Math.floor(Math.random() * 500) + 100
        });
      }
    });

    return contentGaps;
  }

  /**
   * Identify keyword vulnerabilities across competitors
   * @returns {Promise<Array>} Keyword vulnerabilities
   */
  async identifyKeywordVulnerabilities() {
    const vulnerabilities = [];
    
    // Analyze each target keyword across all competitors
    for (const keyword of this.targetKeywords) {
      const competitorPositions = [];
      
      for (const competitor of this.competitors) {
        const analysis = await this.analyzeCompetitor(competitor);
        const keywordData = analysis.keywordRankings[keyword.keyword];
        
        if (keywordData) {
          competitorPositions.push({
            competitor: competitor.name,
            position: keywordData.position,
            trend: keywordData.trend
          });
        }
      }

      // Identify vulnerabilities
      const vulnerableCompetitors = competitorPositions.filter(cp => 
        cp.position > 10 || cp.trend === 'down'
      );

      if (vulnerableCompetitors.length > 0) {
        vulnerabilities.push({
          keyword: keyword.keyword,
          searchVolume: keyword.volume,
          vulnerableCompetitors: vulnerableCompetitors,
          opportunity: `Target "${keyword.keyword}" - ${vulnerableCompetitors.length} competitors showing weakness`,
          priority: keyword.priority,
          estimatedDifficulty: this.calculateKeywordDifficulty(competitorPositions)
        });
      }
    }

    return vulnerabilities.sort((a, b) => b.searchVolume - a.searchVolume);
  }

  /**
   * Calculate keyword difficulty based on competitor positions
   * @param {Array} competitorPositions - Competitor position data
   * @returns {number} Difficulty score (1-100)
   */
  calculateKeywordDifficulty(competitorPositions) {
    if (competitorPositions.length === 0) return 30;

    const topPositions = competitorPositions.filter(cp => cp.position <= 10);
    const averagePosition = competitorPositions.reduce((sum, cp) => sum + cp.position, 0) / competitorPositions.length;

    let difficulty = 50; // Base difficulty

    // Adjust based on top positions
    difficulty += topPositions.length * 10;

    // Adjust based on average position
    if (averagePosition < 5) difficulty += 20;
    else if (averagePosition < 10) difficulty += 10;
    else difficulty -= 10;

    return Math.max(10, Math.min(100, difficulty));
  }

  /**
   * Generate competitive insights for content strategy
   * @param {Object} monitoringResults - Competitor monitoring results
   * @returns {Object} Competitive insights
   */
  generateCompetitiveInsights(monitoringResults) {
    const insights = {
      marketOverview: this.generateMarketOverview(monitoringResults),
      keywordInsights: this.generateKeywordInsights(monitoringResults),
      contentInsights: this.generateContentInsights(monitoringResults),
      technicalInsights: this.generateTechnicalInsights(monitoringResults),
      strategicRecommendations: this.generateStrategicRecommendations(monitoringResults)
    };

    return insights;
  }

  /**
   * Generate market overview insights
   * @param {Object} monitoringResults - Monitoring results
   * @returns {Object} Market overview
   */
  generateMarketOverview(monitoringResults) {
    const competitors = Object.values(monitoringResults.competitors);
    
    return {
      totalCompetitors: competitors.length,
      marketLeader: competitors.reduce((leader, comp) => 
        comp.basicInfo.marketShare > leader.basicInfo.marketShare ? comp : leader
      ),
      averageMarketShare: competitors.reduce((sum, comp) => 
        sum + comp.basicInfo.marketShare, 0) / competitors.length,
      competitionLevel: competitors.length > 5 ? 'high' : competitors.length > 3 ? 'medium' : 'low',
      marketGaps: monitoringResults.opportunities.filter(opp => opp.type === 'market_gap')
    };
  }

  /**
   * Generate keyword insights
   * @param {Object} monitoringResults - Monitoring results
   * @returns {Object} Keyword insights
   */
  generateKeywordInsights(monitoringResults) {
    const keywordOpportunities = monitoringResults.opportunities.filter(opp => opp.type === 'keyword');
    const keywordThreats = monitoringResults.threats.filter(threat => threat.type === 'keyword_dominance');

    return {
      totalOpportunities: keywordOpportunities.length,
      highPriorityOpportunities: keywordOpportunities.filter(opp => opp.priority === 'high').length,
      totalThreats: keywordThreats.length,
      mostVulnerableKeywords: keywordOpportunities
        .sort((a, b) => b.estimatedTraffic - a.estimatedTraffic)
        .slice(0, 5),
      strongestCompetitorKeywords: keywordThreats
        .sort((a, b) => a.position - b.position)
        .slice(0, 5)
    };
  }

  /**
   * Generate content insights
   * @param {Object} monitoringResults - Monitoring results
   * @returns {Object} Content insights
   */
  generateContentInsights(monitoringResults) {
    const contentOpportunities = monitoringResults.opportunities.filter(opp => opp.type === 'content');
    
    return {
      contentGaps: monitoringResults.contentGaps.length,
      highPriorityGaps: monitoringResults.contentGaps.filter(gap => gap.priority === 'high').length,
      contentOpportunities: contentOpportunities.length,
      recommendedContentTypes: this.getRecommendedContentTypes(monitoringResults),
      competitorContentStrategies: Object.values(monitoringResults.competitors)
        .map(comp => comp.contentStrategy?.strategy)
        .filter(Boolean)
    };
  }

  /**
   * Get recommended content types based on competitor analysis
   * @param {Object} monitoringResults - Monitoring results
   * @returns {Array} Recommended content types
   */
  getRecommendedContentTypes(monitoringResults) {
    const strategies = Object.values(monitoringResults.competitors)
      .map(comp => comp.contentStrategy?.strategy)
      .filter(Boolean);

    const underrepresented = ['educational', 'case-studies', 'data-driven', 'local-focused']
      .filter(strategy => !strategies.includes(strategy));

    return underrepresented.map(strategy => ({
      type: strategy,
      reason: `Underrepresented in competitor landscape`,
      priority: 'medium'
    }));
  }

  /**
   * Generate technical insights
   * @param {Object} monitoringResults - Monitoring results
   * @returns {Object} Technical insights
   */
  generateTechnicalInsights(monitoringResults) {
    const technicalOpportunities = monitoringResults.opportunities.filter(opp => opp.type === 'technical');
    
    return {
      technicalOpportunities: technicalOpportunities.length,
      averagePageSpeed: this.calculateAveragePageSpeed(monitoringResults),
      mobileOptimizationGaps: this.identifyMobileGaps(monitoringResults),
      technicalAdvantages: technicalOpportunities.map(opp => opp.opportunity)
    };
  }

  /**
   * Calculate average page speed across competitors
   * @param {Object} monitoringResults - Monitoring results
   * @returns {Object} Average page speed data
   */
  calculateAveragePageSpeed(monitoringResults) {
    const competitors = Object.values(monitoringResults.competitors);
    const speeds = competitors.map(comp => comp.technicalSEO?.pageSpeed).filter(Boolean);

    if (speeds.length === 0) return { desktop: 0, mobile: 0 };

    return {
      desktop: speeds.reduce((sum, speed) => sum + speed.desktop, 0) / speeds.length,
      mobile: speeds.reduce((sum, speed) => sum + speed.mobile, 0) / speeds.length
    };
  }

  /**
   * Identify mobile optimization gaps
   * @param {Object} monitoringResults - Monitoring results
   * @returns {Array} Mobile optimization gaps
   */
  identifyMobileGaps(monitoringResults) {
    const competitors = Object.values(monitoringResults.competitors);
    
    return competitors
      .filter(comp => comp.technicalSEO?.mobileOptimization < 80)
      .map(comp => ({
        competitor: comp.basicInfo.name,
        mobileScore: comp.technicalSEO.mobileOptimization,
        opportunity: 'Outperform on mobile optimization'
      }));
  }

  /**
   * Generate strategic recommendations
   * @param {Object} monitoringResults - Monitoring results
   * @returns {Array} Strategic recommendations
   */
  generateStrategicRecommendations(monitoringResults) {
    const recommendations = [];

    // Keyword strategy recommendations
    const keywordOpps = monitoringResults.opportunities.filter(opp => opp.type === 'keyword');
    if (keywordOpps.length > 0) {
      recommendations.push({
        category: 'keyword_strategy',
        priority: 'high',
        title: 'Target Competitor Keyword Weaknesses',
        description: `Focus on ${keywordOpps.length} keyword opportunities where competitors are weak`,
        actions: keywordOpps.slice(0, 5).map(opp => `Target "${opp.keyword}"`)
      });
    }

    // Content strategy recommendations
    if (monitoringResults.contentGaps.length > 0) {
      recommendations.push({
        category: 'content_strategy',
        priority: 'medium',
        title: 'Fill Content Gaps',
        description: `Create content for ${monitoringResults.contentGaps.length} underserved topics`,
        actions: monitoringResults.contentGaps.slice(0, 3).map(gap => gap.opportunity)
      });
    }

    // Technical recommendations
    const technicalOpps = monitoringResults.opportunities.filter(opp => opp.type === 'technical');
    if (technicalOpps.length > 0) {
      recommendations.push({
        category: 'technical_seo',
        priority: 'medium',
        title: 'Leverage Technical Advantages',
        description: 'Outperform competitors on technical SEO factors',
        actions: technicalOpps.map(opp => opp.opportunity)
      });
    }

    return recommendations;
  }

  /**
   * Get random date within range
   * @param {number} startDaysAgo - Start days ago
   * @param {number} endDaysAgo - End days ago
   * @returns {string} Random date string
   */
  getRandomDate(startDaysAgo, endDaysAgo) {
    const start = new Date();
    start.setDate(start.getDate() + startDaysAgo);
    
    const end = new Date();
    end.setDate(end.getDate() + endDaysAgo);
    
    const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
    return new Date(randomTime).toISOString().split('T')[0];
  }
}

export default CompetitorAnalyzer;