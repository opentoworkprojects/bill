/**
 * SEO Dashboard - Main dashboard component for SEO management
 * Implements Requirements: 6.5, 8.1
 */

import React, { useState, useEffect } from 'react';
import AnalyticsEngine from '../core/AnalyticsEngine.js';
import KeywordTracker from '../core/KeywordTracker.js';
import CompetitorAnalyzer from '../core/CompetitorAnalyzer.js';
import ContentAnalytics from '../core/ContentAnalytics.js';

const SEODashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('30d');

  // Initialize SEO engines
  const [analyticsEngine] = useState(() => new AnalyticsEngine());
  const [keywordTracker] = useState(() => new KeywordTracker());
  const [competitorAnalyzer] = useState(() => new CompetitorAnalyzer());
  const [contentAnalytics] = useState(() => new ContentAnalytics());

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const period = parseInt(timeRange.replace('d', ''));
      const data = await analyticsEngine.getDashboardData({ period });
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="seo-dashboard loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading SEO Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="seo-dashboard">
      <div className="dashboard-header">
        <h1>SEO Management Dashboard</h1>
        <div className="dashboard-controls">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-range-selector"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button onClick={loadDashboardData} className="refresh-btn">
            Refresh Data
          </button>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'keywords' ? 'active' : ''}`}
          onClick={() => setActiveTab('keywords')}
        >
          Keywords
        </button>
        <button 
          className={`tab ${activeTab === 'content' ? 'active' : ''}`}
          onClick={() => setActiveTab('content')}
        >
          Content
        </button>
        <button 
          className={`tab ${activeTab === 'competitors' ? 'active' : ''}`}
          onClick={() => setActiveTab('competitors')}
        >
          Competitors
        </button>
        <button 
          className={`tab ${activeTab === 'technical' ? 'active' : ''}`}
          onClick={() => setActiveTab('technical')}
        >
          Technical
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <OverviewTab dashboardData={dashboardData} />
        )}
        {activeTab === 'keywords' && (
          <KeywordsTab keywordTracker={keywordTracker} />
        )}
        {activeTab === 'content' && (
          <ContentTab contentAnalytics={contentAnalytics} />
        )}
        {activeTab === 'competitors' && (
          <CompetitorsTab competitorAnalyzer={competitorAnalyzer} />
        )}
        {activeTab === 'technical' && (
          <TechnicalTab dashboardData={dashboardData} />
        )}
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ dashboardData }) => {
  if (!dashboardData) return <div>No data available</div>;

  const { overview, trends, alerts } = dashboardData;

  return (
    <div className="overview-tab">
      <div className="metrics-grid">
        <MetricCard
          title="Total Clicks"
          value={overview.totalClicks}
          trend={trends.clicks}
          icon="📊"
        />
        <MetricCard
          title="Total Impressions"
          value={overview.totalImpressions}
          trend={trends.impressions}
          icon="👁️"
        />
        <MetricCard
          title="Average Position"
          value={overview.averagePosition?.toFixed(1)}
          trend={trends.position}
          icon="📍"
          isPosition={true}
        />
        <MetricCard
          title="Conversion Rate"
          value={`${(overview.conversionRate * 100).toFixed(2)}%`}
          trend={trends.conversions}
          icon="🎯"
        />
      </div>

      <div className="dashboard-widgets">
        <div className="widget performance-score">
          <h3>Overall SEO Score</h3>
          <div className="score-display">
            <div className={`score-circle score-${getScoreClass(overview.overallScore)}`}>
              <span className="score-value">{overview.overallScore}</span>
              <span className="score-label">/ 100</span>
            </div>
          </div>
          <div className="score-breakdown">
            <div className="score-item">
              <span>Traffic Performance</span>
              <span>{Math.floor(overview.overallScore * 0.8)}</span>
            </div>
            <div className="score-item">
              <span>Technical SEO</span>
              <span>{Math.floor(overview.overallScore * 0.9)}</span>
            </div>
            <div className="score-item">
              <span>Content Quality</span>
              <span>{Math.floor(overview.overallScore * 0.85)}</span>
            </div>
          </div>
        </div>

        <div className="widget alerts-panel">
          <h3>Recent Alerts</h3>
          <div className="alerts-list">
            {alerts && alerts.length > 0 ? (
              alerts.map((alert, index) => (
                <div key={index} className={`alert alert-${alert.severity}`}>
                  <div className="alert-icon">
                    {alert.severity === 'positive' ? '✅' : '⚠️'}
                  </div>
                  <div className="alert-content">
                    <div className="alert-message">{alert.message}</div>
                    <div className="alert-date">{formatDate(alert.date)}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-alerts">No recent alerts</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Keywords Tab Component
const KeywordsTab = ({ keywordTracker }) => {
  const [keywordData, setKeywordData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKeywordData();
  }, []);

  const loadKeywordData = async () => {
    setLoading(true);
    try {
      const data = await keywordTracker.trackDailyRankings();
      setKeywordData(data);
    } catch (error) {
      console.error('Failed to load keyword data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading keyword data...</div>;
  if (!keywordData) return <div>No keyword data available</div>;

  return (
    <div className="keywords-tab">
      <div className="keywords-summary">
        <div className="summary-cards">
          <div className="summary-card">
            <h4>Total Keywords</h4>
            <span className="summary-value">{keywordData.summary.totalKeywords}</span>
          </div>
          <div className="summary-card improved">
            <h4>Improved</h4>
            <span className="summary-value">{keywordData.summary.improved}</span>
          </div>
          <div className="summary-card declined">
            <h4>Declined</h4>
            <span className="summary-value">{keywordData.summary.declined}</span>
          </div>
          <div className="summary-card stable">
            <h4>Stable</h4>
            <span className="summary-value">{keywordData.summary.stable}</span>
          </div>
        </div>
      </div>

      <div className="keywords-table-container">
        <h3>Keyword Rankings</h3>
        <div className="keywords-table">
          <div className="table-header">
            <div className="header-cell">Keyword</div>
            <div className="header-cell">Position</div>
            <div className="header-cell">Change</div>
            <div className="header-cell">Clicks</div>
            <div className="header-cell">Impressions</div>
            <div className="header-cell">CTR</div>
            <div className="header-cell">Trend</div>
          </div>
          <div className="table-body">
            {keywordData.keywords.map((keyword, index) => (
              <div key={index} className="table-row">
                <div className="table-cell keyword-cell">
                  <span className="keyword-text">{keyword.keyword}</span>
                  <span className={`priority-badge priority-${keyword.priority}`}>
                    {keyword.priority}
                  </span>
                </div>
                <div className="table-cell position-cell">
                  {keyword.position ? Math.round(keyword.position) : '-'}
                </div>
                <div className="table-cell change-cell">
                  {keyword.positionChange ? (
                    <span className={`change ${keyword.positionChange > 0 ? 'positive' : 'negative'}`}>
                      {keyword.positionChange > 0 ? '+' : ''}{keyword.positionChange}
                    </span>
                  ) : '-'}
                </div>
                <div className="table-cell">{keyword.clicks}</div>
                <div className="table-cell">{keyword.impressions}</div>
                <div className="table-cell">{(keyword.ctr * 100).toFixed(2)}%</div>
                <div className="table-cell trend-cell">
                  <span className={`trend trend-${keyword.trend}`}>
                    {getTrendIcon(keyword.trend)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {keywordData.alerts && keywordData.alerts.length > 0 && (
        <div className="keyword-alerts">
          <h3>Keyword Alerts</h3>
          <div className="alerts-grid">
            {keywordData.alerts.map((alert, index) => (
              <div key={index} className={`alert-card alert-${alert.severity}`}>
                <div className="alert-header">
                  <span className="alert-type">{alert.type.replace('_', ' ')}</span>
                  <span className="alert-keyword">{alert.keyword}</span>
                </div>
                <div className="alert-message">{alert.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Content Tab Component
const ContentTab = ({ contentAnalytics }) => {
  const [contentData, setContentData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContentData();
  }, []);

  const loadContentData = async () => {
    setLoading(true);
    try {
      const data = await contentAnalytics.getContentAnalyticsReport();
      setContentData(data);
    } catch (error) {
      console.error('Failed to load content data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading content analytics...</div>;
  if (!contentData) return <div>No content data available</div>;

  return (
    <div className="content-tab">
      <div className="content-summary">
        <div className="summary-grid">
          <div className="summary-item">
            <h4>Total Content</h4>
            <span className="summary-number">{contentData.summary.totalContent}</span>
          </div>
          <div className="summary-item">
            <h4>Total Traffic</h4>
            <span className="summary-number">{contentData.summary.totalTraffic.toLocaleString()}</span>
          </div>
          <div className="summary-item">
            <h4>Avg Engagement</h4>
            <span className="summary-number">{(contentData.summary.averageEngagement * 100).toFixed(1)}%</span>
          </div>
          <div className="summary-item">
            <h4>Total Revenue</h4>
            <span className="summary-number">${contentData.summary.totalRevenue.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="content-performance">
        <h3>Content Performance Distribution</h3>
        <div className="performance-chart">
          <div className="chart-bar">
            <div className="bar-section high" style={{width: `${(contentData.performance.summary.highPerforming / contentData.summary.totalContent) * 100}%`}}>
              <span>High ({contentData.performance.summary.highPerforming})</span>
            </div>
            <div className="bar-section medium" style={{width: `${(contentData.performance.summary.mediumPerforming / contentData.summary.totalContent) * 100}%`}}>
              <span>Medium ({contentData.performance.summary.mediumPerforming})</span>
            </div>
            <div className="bar-section low" style={{width: `${(contentData.performance.summary.lowPerforming / contentData.summary.totalContent) * 100}%`}}>
              <span>Low ({contentData.performance.summary.lowPerforming})</span>
            </div>
          </div>
        </div>
      </div>

      <div className="content-lists">
        <div className="top-performers">
          <h3>Top Performing Content</h3>
          <div className="content-list">
            {contentData.performance.topPerformers.map((content, index) => (
              <div key={index} className="content-item">
                <div className="content-title">{content.title}</div>
                <div className="content-metrics">
                  <span>Traffic: {content.metrics.organicTraffic}</span>
                  <span>Score: {content.metrics.overallScore}</span>
                  <span>Conversions: {content.metrics.conversions}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="underperformers">
          <h3>Needs Improvement</h3>
          <div className="content-list">
            {contentData.performance.underperformers.map((content, index) => (
              <div key={index} className="content-item underperformer">
                <div className="content-title">{content.title}</div>
                <div className="content-metrics">
                  <span>Traffic: {content.metrics.organicTraffic}</span>
                  <span>Position: {Math.round(content.metrics.averagePosition)}</span>
                  <span>Bounce: {(content.metrics.bounceRate * 100).toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="content-recommendations">
        <h3>Content Recommendations</h3>
        <div className="recommendations-list">
          {contentData.recommendations.slice(0, 5).map((rec, index) => (
            <div key={index} className={`recommendation recommendation-${rec.priority}`}>
              <div className="rec-header">
                <span className="rec-type">{rec.type.replace('_', ' ')}</span>
                <span className={`rec-priority priority-${rec.priority}`}>{rec.priority}</span>
              </div>
              <div className="rec-title">{rec.title}</div>
              <div className="rec-description">{rec.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Competitors Tab Component
const CompetitorsTab = ({ competitorAnalyzer }) => {
  const [competitorData, setCompetitorData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompetitorData();
  }, []);

  const loadCompetitorData = async () => {
    setLoading(true);
    try {
      const data = await competitorAnalyzer.monitorCompetitorStrategies();
      setCompetitorData(data);
    } catch (error) {
      console.error('Failed to load competitor data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading competitor analysis...</div>;
  if (!competitorData) return <div>No competitor data available</div>;

  return (
    <div className="competitors-tab">
      <div className="competitors-overview">
        <h3>Competitor Landscape</h3>
        <div className="competitors-grid">
          {Object.entries(competitorData.competitors).map(([id, competitor]) => (
            <div key={id} className="competitor-card">
              <div className="competitor-header">
                <h4>{competitor.basicInfo.name}</h4>
                <span className="market-share">
                  {(competitor.basicInfo.marketShare * 100).toFixed(1)}% market share
                </span>
              </div>
              <div className="competitor-metrics">
                <div className="metric">
                  <span>Domain Authority</span>
                  <span>{competitor.seoMetrics.domainAuthority}</span>
                </div>
                <div className="metric">
                  <span>Organic Keywords</span>
                  <span>{competitor.seoMetrics.organicKeywords.toLocaleString()}</span>
                </div>
                <div className="metric">
                  <span>Organic Traffic</span>
                  <span>{competitor.seoMetrics.organicTraffic.toLocaleString()}</span>
                </div>
                <div className="metric">
                  <span>Backlinks</span>
                  <span>{competitor.seoMetrics.backlinks.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="opportunities-threats">
        <div className="opportunities">
          <h3>Opportunities</h3>
          <div className="items-list">
            {competitorData.opportunities.slice(0, 5).map((opp, index) => (
              <div key={index} className={`opportunity-item priority-${opp.priority}`}>
                <div className="item-header">
                  <span className="item-type">{opp.type}</span>
                  <span className="item-competitor">{opp.competitor}</span>
                </div>
                <div className="item-description">{opp.opportunity}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="threats">
          <h3>Threats</h3>
          <div className="items-list">
            {competitorData.threats.slice(0, 5).map((threat, index) => (
              <div key={index} className={`threat-item severity-${threat.severity}`}>
                <div className="item-header">
                  <span className="item-type">{threat.type}</span>
                  <span className="item-competitor">{threat.competitor}</span>
                </div>
                <div className="item-description">{threat.threat}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="content-gaps">
        <h3>Content Gap Analysis</h3>
        <div className="gaps-grid">
          {competitorData.contentGaps.slice(0, 6).map((gap, index) => (
            <div key={index} className="gap-item">
              <div className="gap-topic">{gap.topic}</div>
              <div className="gap-opportunity">{gap.opportunity}</div>
              <div className="gap-meta">
                <span className={`gap-priority priority-${gap.priority}`}>{gap.priority}</span>
                <span className="gap-coverage">Coverage: {gap.competitorCoverage}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Technical Tab Component
const TechnicalTab = ({ dashboardData }) => {
  if (!dashboardData) return <div>No technical data available</div>;

  const { technical } = dashboardData;

  return (
    <div className="technical-tab">
      <div className="technical-overview">
        <h3>Technical SEO Health</h3>
        <div className="technical-metrics">
          <div className="metric-card">
            <div className="metric-icon">🚨</div>
            <div className="metric-content">
              <div className="metric-value">{technical.crawlErrors}</div>
              <div className="metric-label">Crawl Errors</div>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon">📄</div>
            <div className="metric-content">
              <div className="metric-value">{technical.indexedPages}</div>
              <div className="metric-label">Indexed Pages</div>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon">🗺️</div>
            <div className="metric-content">
              <div className="metric-value">{technical.sitemapStatus}</div>
              <div className="metric-label">Sitemaps</div>
            </div>
          </div>
        </div>
      </div>

      <div className="technical-checklist">
        <h3>Technical SEO Checklist</h3>
        <div className="checklist-items">
          <div className="checklist-item completed">
            <span className="check-icon">✅</span>
            <span className="check-text">HTTPS Implementation</span>
          </div>
          <div className="checklist-item completed">
            <span className="check-icon">✅</span>
            <span className="check-text">Mobile Responsiveness</span>
          </div>
          <div className="checklist-item completed">
            <span className="check-icon">✅</span>
            <span className="check-text">XML Sitemap</span>
          </div>
          <div className="checklist-item warning">
            <span className="check-icon">⚠️</span>
            <span className="check-text">Page Speed Optimization</span>
          </div>
          <div className="checklist-item pending">
            <span className="check-icon">⏳</span>
            <span className="check-text">Core Web Vitals</span>
          </div>
          <div className="checklist-item completed">
            <span className="check-icon">✅</span>
            <span className="check-text">Structured Data</span>
          </div>
        </div>
      </div>

      <div className="technical-recommendations">
        <h3>Technical Recommendations</h3>
        <div className="recommendations">
          <div className="recommendation high-priority">
            <div className="rec-priority">High Priority</div>
            <div className="rec-title">Improve Page Speed</div>
            <div className="rec-description">
              Optimize images and reduce JavaScript bundle size to improve Core Web Vitals scores.
            </div>
          </div>
          <div className="recommendation medium-priority">
            <div className="rec-priority">Medium Priority</div>
            <div className="rec-title">Fix Crawl Errors</div>
            <div className="rec-description">
              Address {technical.crawlErrors} crawl errors to improve site indexing.
            </div>
          </div>
          <div className="recommendation low-priority">
            <div className="rec-priority">Low Priority</div>
            <div className="rec-title">Enhance Schema Markup</div>
            <div className="rec-description">
              Add more detailed structured data for better search result appearance.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Utility Components
const MetricCard = ({ title, value, trend, icon, isPosition = false }) => {
  const getTrendClass = () => {
    if (!trend) return '';
    if (isPosition) {
      return trend.direction === 'up' ? 'trend-positive' : trend.direction === 'down' ? 'trend-negative' : '';
    }
    return trend.direction === 'up' ? 'trend-positive' : trend.direction === 'down' ? 'trend-negative' : '';
  };

  const getTrendText = () => {
    if (!trend) return '';
    const sign = trend.percentage > 0 ? '+' : '';
    return `${sign}${trend.percentage}%`;
  };

  return (
    <div className="metric-card">
      <div className="metric-header">
        <span className="metric-icon">{icon}</span>
        <span className="metric-title">{title}</span>
      </div>
      <div className="metric-value">{value}</div>
      {trend && (
        <div className={`metric-trend ${getTrendClass()}`}>
          <span className="trend-arrow">
            {trend.direction === 'up' ? '↗️' : trend.direction === 'down' ? '↘️' : '➡️'}
          </span>
          <span className="trend-text">{getTrendText()}</span>
        </div>
      )}
    </div>
  );
};

// Utility Functions
const getScoreClass = (score) => {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'poor';
};

const getTrendIcon = (trend) => {
  switch (trend) {
    case 'improved': return '📈';
    case 'declined': return '📉';
    case 'stable': return '➡️';
    default: return '❓';
  }
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default SEODashboard;