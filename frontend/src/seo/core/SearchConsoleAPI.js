/**
 * Google Search Console API Integration
 * Implements Requirements: 6.1
 */

class SearchConsoleAPI {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.REACT_APP_SEARCH_CONSOLE_API_KEY;
    this.siteUrl = config.siteUrl || 'https://billbytekot.com';
    this.baseUrl = 'https://www.googleapis.com/webmasters/v3';
    this.accessToken = null;
    this.refreshToken = config.refreshToken;
    this.clientId = config.clientId || process.env.REACT_APP_GOOGLE_CLIENT_ID;
    this.clientSecret = config.clientSecret || process.env.REACT_APP_GOOGLE_CLIENT_SECRET;
  }

  /**
   * Initialize authentication with Google Search Console
   * @returns {Promise<boolean>} Authentication success
   */
  async authenticate() {
    try {
      if (this.refreshToken) {
        return await this.refreshAccessToken();
      }
      
      // For demo purposes, return mock authentication
      console.warn('Search Console API: Using mock authentication for demo');
      this.accessToken = 'mock_access_token';
      return true;
    } catch (error) {
      console.error('Search Console authentication failed:', error);
      return false;
    }
  }

  /**
   * Refresh access token using refresh token
   * @returns {Promise<boolean>} Refresh success
   */
  async refreshAccessToken() {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: this.refreshToken,
          grant_type: 'refresh_token'
        })
      });

      if (response.ok) {
        const data = await response.json();
        this.accessToken = data.access_token;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  /**
   * Make authenticated API request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<Object>} API response
   */
  async makeRequest(endpoint, options = {}) {
    if (!this.accessToken) {
      const authenticated = await this.authenticate();
      if (!authenticated) {
        throw new Error('Authentication required');
      }
    }

    // For demo purposes, return mock data
    if (this.accessToken === 'mock_access_token') {
      return this.getMockData(endpoint, options);
    }

    const url = `${this.baseUrl}${endpoint}`;
    const requestOptions = {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const response = await fetch(url, requestOptions);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get mock data for demo purposes
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Object} Mock data
   */
  getMockData(endpoint, options) {
    const mockData = {
      '/sites/https%3A%2F%2Fbillbytekot.com/searchAnalytics/query': {
        rows: [
          {
            keys: ['restaurant billing software'],
            clicks: 145,
            impressions: 2340,
            ctr: 0.062,
            position: 8.5
          },
          {
            keys: ['restaurant pos system'],
            clicks: 89,
            impressions: 1890,
            ctr: 0.047,
            position: 12.3
          },
          {
            keys: ['billbytekot'],
            clicks: 234,
            impressions: 890,
            ctr: 0.263,
            position: 3.2
          },
          {
            keys: ['kot software'],
            clicks: 67,
            impressions: 1200,
            ctr: 0.056,
            position: 9.8
          },
          {
            keys: ['restaurant management software'],
            clicks: 78,
            impressions: 1560,
            ctr: 0.05,
            position: 11.2
          }
        ]
      },
      '/sites/https%3A%2F%2Fbillbytekot.com/sitemaps': [
        {
          path: 'https://billbytekot.com/sitemap.xml',
          type: 'sitemap',
          submitted: '2024-01-15T10:00:00Z',
          indexed: 45,
          warnings: 0,
          errors: 0
        }
      ],
      '/sites/https%3A%2F%2Fbillbytekot.com/urlCrawlErrorsCounts': {
        countDetails: [
          {
            category: 'serverError',
            platform: 'web',
            count: 2
          },
          {
            category: 'notFound',
            platform: 'web', 
            count: 5
          }
        ]
      }
    };

    return mockData[endpoint] || {};
  }

  /**
   * Get search performance data
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Search performance data
   */
  async getSearchPerformance(params = {}) {
    const defaultParams = {
      startDate: this.getDateString(-30), // Last 30 days
      endDate: this.getDateString(-1),
      dimensions: ['query'],
      rowLimit: 1000,
      startRow: 0
    };

    const queryParams = { ...defaultParams, ...params };
    const endpoint = `/sites/${encodeURIComponent(this.siteUrl)}/searchAnalytics/query`;

    try {
      const response = await this.makeRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(queryParams)
      });

      return this.processSearchPerformanceData(response);
    } catch (error) {
      console.error('Failed to fetch search performance data:', error);
      return null;
    }
  }

  /**
   * Process search performance data
   * @param {Object} rawData - Raw API response
   * @returns {Object} Processed data
   */
  processSearchPerformanceData(rawData) {
    if (!rawData.rows) {
      return {
        queries: [],
        totalClicks: 0,
        totalImpressions: 0,
        averageCTR: 0,
        averagePosition: 0
      };
    }

    const queries = rawData.rows.map(row => ({
      query: row.keys[0],
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      position: row.position || 0
    }));

    const totals = queries.reduce((acc, query) => ({
      clicks: acc.clicks + query.clicks,
      impressions: acc.impressions + query.impressions,
      ctr: acc.ctr + query.ctr,
      position: acc.position + query.position
    }), { clicks: 0, impressions: 0, ctr: 0, position: 0 });

    return {
      queries,
      totalClicks: totals.clicks,
      totalImpressions: totals.impressions,
      averageCTR: queries.length > 0 ? totals.ctr / queries.length : 0,
      averagePosition: queries.length > 0 ? totals.position / queries.length : 0,
      queryCount: queries.length
    };
  }

  /**
   * Get keyword performance for specific keywords
   * @param {Array} keywords - Target keywords
   * @param {Object} dateRange - Date range options
   * @returns {Promise<Array>} Keyword performance data
   */
  async getKeywordPerformance(keywords, dateRange = {}) {
    const params = {
      startDate: dateRange.startDate || this.getDateString(-30),
      endDate: dateRange.endDate || this.getDateString(-1),
      dimensions: ['query'],
      dimensionFilterGroups: [{
        filters: keywords.map(keyword => ({
          dimension: 'query',
          operator: 'contains',
          expression: keyword
        }))
      }]
    };

    try {
      const data = await this.getSearchPerformance(params);
      return data.queries || [];
    } catch (error) {
      console.error('Failed to fetch keyword performance:', error);
      return [];
    }
  }

  /**
   * Get page performance data
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Page performance data
   */
  async getPagePerformance(params = {}) {
    const queryParams = {
      startDate: params.startDate || this.getDateString(-30),
      endDate: params.endDate || this.getDateString(-1),
      dimensions: ['page'],
      rowLimit: 100
    };

    const endpoint = `/sites/${encodeURIComponent(this.siteUrl)}/searchAnalytics/query`;

    try {
      const response = await this.makeRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(queryParams)
      });

      return this.processPagePerformanceData(response);
    } catch (error) {
      console.error('Failed to fetch page performance data:', error);
      return null;
    }
  }

  /**
   * Process page performance data
   * @param {Object} rawData - Raw API response
   * @returns {Object} Processed page data
   */
  processPagePerformanceData(rawData) {
    if (!rawData.rows) {
      return { pages: [] };
    }

    const pages = rawData.rows.map(row => ({
      url: row.keys[0],
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      position: row.position || 0
    }));

    return { pages };
  }

  /**
   * Get sitemap status
   * @returns {Promise<Array>} Sitemap status data
   */
  async getSitemapStatus() {
    const endpoint = `/sites/${encodeURIComponent(this.siteUrl)}/sitemaps`;

    try {
      const response = await this.makeRequest(endpoint);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Failed to fetch sitemap status:', error);
      return [];
    }
  }

  /**
   * Submit sitemap to Google Search Console
   * @param {string} sitemapUrl - Sitemap URL
   * @returns {Promise<boolean>} Submission success
   */
  async submitSitemap(sitemapUrl) {
    const endpoint = `/sites/${encodeURIComponent(this.siteUrl)}/sitemaps/${encodeURIComponent(sitemapUrl)}`;

    try {
      await this.makeRequest(endpoint, {
        method: 'PUT'
      });
      return true;
    } catch (error) {
      console.error('Failed to submit sitemap:', error);
      return false;
    }
  }

  /**
   * Get crawl errors
   * @returns {Promise<Object>} Crawl error data
   */
  async getCrawlErrors() {
    const endpoint = `/sites/${encodeURIComponent(this.siteUrl)}/urlCrawlErrorsCounts`;

    try {
      const response = await this.makeRequest(endpoint);
      return this.processCrawlErrorData(response);
    } catch (error) {
      console.error('Failed to fetch crawl errors:', error);
      return null;
    }
  }

  /**
   * Process crawl error data
   * @param {Object} rawData - Raw crawl error data
   * @returns {Object} Processed crawl error data
   */
  processCrawlErrorData(rawData) {
    if (!rawData.countDetails) {
      return {
        totalErrors: 0,
        errorsByCategory: {},
        errorsByPlatform: {}
      };
    }

    const errorsByCategory = {};
    const errorsByPlatform = {};
    let totalErrors = 0;

    rawData.countDetails.forEach(detail => {
      const count = detail.count || 0;
      totalErrors += count;

      errorsByCategory[detail.category] = (errorsByCategory[detail.category] || 0) + count;
      errorsByPlatform[detail.platform] = (errorsByPlatform[detail.platform] || 0) + count;
    });

    return {
      totalErrors,
      errorsByCategory,
      errorsByPlatform,
      details: rawData.countDetails
    };
  }

  /**
   * Get indexing status
   * @returns {Promise<Object>} Indexing status data
   */
  async getIndexingStatus() {
    try {
      const sitemaps = await this.getSitemapStatus();
      const crawlErrors = await this.getCrawlErrors();

      return {
        sitemaps,
        crawlErrors,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to fetch indexing status:', error);
      return null;
    }
  }

  /**
   * Get comprehensive SEO report
   * @param {Object} options - Report options
   * @returns {Promise<Object>} Comprehensive SEO report
   */
  async getComprehensiveReport(options = {}) {
    const dateRange = {
      startDate: options.startDate || this.getDateString(-30),
      endDate: options.endDate || this.getDateString(-1)
    };

    try {
      const [searchPerformance, pagePerformance, indexingStatus] = await Promise.all([
        this.getSearchPerformance({ ...dateRange }),
        this.getPagePerformance(dateRange),
        this.getIndexingStatus()
      ]);

      return {
        dateRange,
        searchPerformance,
        pagePerformance,
        indexingStatus,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to generate comprehensive report:', error);
      return null;
    }
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

  /**
   * Monitor keyword rankings over time
   * @param {Array} keywords - Keywords to monitor
   * @param {number} days - Number of days to look back
   * @returns {Promise<Object>} Keyword ranking trends
   */
  async monitorKeywordTrends(keywords, days = 30) {
    const trends = {};
    
    // Get data for different time periods to show trends
    const periods = [
      { name: 'current', start: -7, end: -1 },
      { name: 'previous', start: -14, end: -8 },
      { name: 'baseline', start: -days, end: -(days - 7) }
    ];

    for (const period of periods) {
      const dateRange = {
        startDate: this.getDateString(period.start),
        endDate: this.getDateString(period.end)
      };

      const performance = await this.getKeywordPerformance(keywords, dateRange);
      trends[period.name] = performance;
    }

    return this.calculateKeywordTrends(trends, keywords);
  }

  /**
   * Calculate keyword ranking trends
   * @param {Object} trendsData - Trends data by period
   * @param {Array} keywords - Target keywords
   * @returns {Object} Calculated trends
   */
  calculateKeywordTrends(trendsData, keywords) {
    const trendAnalysis = {};

    keywords.forEach(keyword => {
      const current = trendsData.current.find(k => k.query.includes(keyword));
      const previous = trendsData.previous.find(k => k.query.includes(keyword));
      const baseline = trendsData.baseline.find(k => k.query.includes(keyword));

      trendAnalysis[keyword] = {
        current: current || { position: 0, clicks: 0, impressions: 0 },
        previous: previous || { position: 0, clicks: 0, impressions: 0 },
        baseline: baseline || { position: 0, clicks: 0, impressions: 0 },
        trends: {
          positionChange: current && previous ? previous.position - current.position : 0,
          clicksChange: current && previous ? current.clicks - previous.clicks : 0,
          impressionsChange: current && previous ? current.impressions - previous.impressions : 0
        }
      };
    });

    return trendAnalysis;
  }
}

export default SearchConsoleAPI;