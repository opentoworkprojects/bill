/**
 * Content Optimizer - Interface for page content optimization
 * Implements Requirements: 2.5
 */

import React, { useState, useEffect } from 'react';
import BlogContentOptimizer from '../core/BlogContentOptimizer.js';
import MetaTagOptimizer from '../core/MetaTagOptimizer.js';
import InternalLinkBuilder from '../core/InternalLinkBuilder.js';

const ContentOptimizer = ({ contentId, initialContent = null }) => {
  const [content, setContent] = useState(initialContent || {
    title: '',
    content: '',
    metaDescription: '',
    targetKeywords: [],
    category: 'restaurant-management-tips',
    url: ''
  });
  
  const [optimization, setOptimization] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const [seoScore, setSeoScore] = useState(0);

  // Initialize optimizers
  const [blogOptimizer] = useState(() => new BlogContentOptimizer());
  const [metaOptimizer] = useState(() => new MetaTagOptimizer());
  const [linkBuilder] = useState(() => new InternalLinkBuilder());

  useEffect(() => {
    if (content.title || content.content) {
      optimizeContent();
    }
  }, [content.title, content.content, content.targetKeywords]);

  const optimizeContent = async () => {
    if (!content.title && !content.content) return;

    setLoading(true);
    try {
      const optimizedResult = blogOptimizer.optimizeBlogPost(content);
      setOptimization(optimizedResult);
      setSeoScore(calculateOverallSEOScore(optimizedResult));
    } catch (error) {
      console.error('Failed to optimize content:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateOverallSEOScore = (optimizedResult) => {
    if (!optimizedResult) return 0;

    let score = 50; // Base score

    // Title optimization
    if (optimizedResult.metaTags?.title) {
      const titleLength = optimizedResult.metaTags.title.length;
      if (titleLength >= 30 && titleLength <= 60) score += 10;
      else if (titleLength >= 20 && titleLength <= 70) score += 5;
    }

    // Meta description
    if (optimizedResult.metaTags?.description) {
      const descLength = optimizedResult.metaTags.description.length;
      if (descLength >= 120 && descLength <= 160) score += 10;
      else if (descLength >= 100 && descLength <= 180) score += 5;
    }

    // Content length
    if (optimizedResult.contentStructure?.wordCount) {
      const wordCount = optimizedResult.contentStructure.wordCount;
      if (wordCount >= 800) score += 10;
      else if (wordCount >= 500) score += 5;
    }

    // Keyword optimization
    if (optimizedResult.keywordAnalysis?.primaryKeyword) {
      const keywordData = optimizedResult.keywordAnalysis.keywordDensities;
      const primaryKeyword = optimizedResult.keywordAnalysis.primaryKeyword;
      const density = keywordData[primaryKeyword];
      
      if (density >= 0.01 && density <= 0.025) score += 15;
      else if (density >= 0.005 && density <= 0.035) score += 10;
    }

    // Internal links
    if (optimizedResult.internalLinks?.length > 0) {
      score += Math.min(10, optimizedResult.internalLinks.length * 2);
    }

    // Readability
    if (optimizedResult.contentStructure?.readabilityScore) {
      const readability = optimizedResult.contentStructure.readabilityScore;
      if (readability >= 60) score += 10;
      else if (readability >= 40) score += 5;
    }

    return Math.min(100, Math.max(0, score));
  };

  const handleContentChange = (field, value) => {
    setContent(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleKeywordAdd = (keyword) => {
    if (keyword && !content.targetKeywords.includes(keyword)) {
      setContent(prev => ({
        ...prev,
        targetKeywords: [...prev.targetKeywords, keyword]
      }));
    }
  };

  const handleKeywordRemove = (keyword) => {
    setContent(prev => ({
      ...prev,
      targetKeywords: prev.targetKeywords.filter(k => k !== keyword)
    }));
  };

  const applyOptimization = (type, suggestion) => {
    switch (type) {
      case 'title':
        handleContentChange('title', suggestion);
        break;
      case 'meta_description':
        handleContentChange('metaDescription', suggestion);
        break;
      case 'keyword_density':
        // This would require content modification suggestions
        break;
      default:
        break;
    }
  };

  return (
    <div className="content-optimizer">
      <div className="optimizer-header">
        <h2>Content Optimization</h2>
        <div className="seo-score-badge">
          <span className="score-label">SEO Score</span>
          <span className={`score-value score-${getScoreClass(seoScore)}`}>
            {seoScore}/100
          </span>
        </div>
      </div>

      <div className="optimizer-tabs">
        <button 
          className={`tab ${activeTab === 'content' ? 'active' : ''}`}
          onClick={() => setActiveTab('content')}
        >
          Content Editor
        </button>
        <button 
          className={`tab ${activeTab === 'seo' ? 'active' : ''}`}
          onClick={() => setActiveTab('seo')}
        >
          SEO Analysis
        </button>
        <button 
          className={`tab ${activeTab === 'suggestions' ? 'active' : ''}`}
          onClick={() => setActiveTab('suggestions')}
        >
          Suggestions
        </button>
        <button 
          className={`tab ${activeTab === 'preview' ? 'active' : ''}`}
          onClick={() => setActiveTab('preview')}
        >
          Preview
        </button>
      </div>

      <div className="optimizer-content">
        {activeTab === 'content' && (
          <ContentEditorTab 
            content={content}
            onContentChange={handleContentChange}
            onKeywordAdd={handleKeywordAdd}
            onKeywordRemove={handleKeywordRemove}
          />
        )}
        
        {activeTab === 'seo' && (
          <SEOAnalysisTab 
            optimization={optimization}
            loading={loading}
          />
        )}
        
        {activeTab === 'suggestions' && (
          <SuggestionsTab 
            optimization={optimization}
            onApplyOptimization={applyOptimization}
          />
        )}
        
        {activeTab === 'preview' && (
          <PreviewTab 
            content={content}
            optimization={optimization}
          />
        )}
      </div>
    </div>
  );
};

// Content Editor Tab
const ContentEditorTab = ({ content, onContentChange, onKeywordAdd, onKeywordRemove }) => {
  const [newKeyword, setNewKeyword] = useState('');

  const handleKeywordSubmit = (e) => {
    e.preventDefault();
    if (newKeyword.trim()) {
      onKeywordAdd(newKeyword.trim());
      setNewKeyword('');
    }
  };

  return (
    <div className="content-editor-tab">
      <div className="editor-section">
        <label className="field-label">Title</label>
        <input
          type="text"
          value={content.title}
          onChange={(e) => onContentChange('title', e.target.value)}
          placeholder="Enter your content title..."
          className="title-input"
          maxLength="70"
        />
        <div className="field-hint">
          {content.title.length}/70 characters
          {content.title.length < 30 && <span className="warning"> (Too short)</span>}
          {content.title.length > 60 && <span className="warning"> (May be truncated)</span>}
        </div>
      </div>

      <div className="editor-section">
        <label className="field-label">Meta Description</label>
        <textarea
          value={content.metaDescription}
          onChange={(e) => onContentChange('metaDescription', e.target.value)}
          placeholder="Enter meta description..."
          className="meta-description-input"
          rows="3"
          maxLength="180"
        />
        <div className="field-hint">
          {content.metaDescription.length}/180 characters
          {content.metaDescription.length < 120 && <span className="warning"> (Too short)</span>}
          {content.metaDescription.length > 160 && <span className="warning"> (May be truncated)</span>}
        </div>
      </div>

      <div className="editor-section">
        <label className="field-label">Category</label>
        <select
          value={content.category}
          onChange={(e) => onContentChange('category', e.target.value)}
          className="category-select"
        >
          <option value="restaurant-management-tips">Restaurant Management Tips</option>
          <option value="billing-best-practices">Billing Best Practices</option>
          <option value="industry-trends">Industry Trends</option>
          <option value="software-tutorials">Software Tutorials</option>
        </select>
      </div>

      <div className="editor-section">
        <label className="field-label">Target Keywords</label>
        <div className="keywords-container">
          <div className="keywords-list">
            {content.targetKeywords.map((keyword, index) => (
              <div key={index} className="keyword-tag">
                <span>{keyword}</span>
                <button 
                  onClick={() => onKeywordRemove(keyword)}
                  className="keyword-remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <form onSubmit={handleKeywordSubmit} className="keyword-form">
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="Add target keyword..."
              className="keyword-input"
            />
            <button type="submit" className="keyword-add-btn">Add</button>
          </form>
        </div>
      </div>

      <div className="editor-section">
        <label className="field-label">Content</label>
        <textarea
          value={content.content}
          onChange={(e) => onContentChange('content', e.target.value)}
          placeholder="Write your content here..."
          className="content-textarea"
          rows="20"
        />
        <div className="field-hint">
          {content.content.split(/\s+/).filter(word => word.length > 0).length} words
          {content.content.split(/\s+/).length < 300 && <span className="warning"> (Too short for SEO)</span>}
        </div>
      </div>

      <div className="editor-section">
        <label className="field-label">URL Slug</label>
        <input
          type="text"
          value={content.url}
          onChange={(e) => onContentChange('url', e.target.value)}
          placeholder="/blog/your-url-slug"
          className="url-input"
        />
        <div className="field-hint">
          SEO-friendly URL for this content
        </div>
      </div>
    </div>
  );
};

// SEO Analysis Tab
const SEOAnalysisTab = ({ optimization, loading }) => {
  if (loading) {
    return <div className="loading-state">Analyzing content...</div>;
  }

  if (!optimization) {
    return <div className="empty-state">Enter content to see SEO analysis</div>;
  }

  return (
    <div className="seo-analysis-tab">
      <div className="analysis-section">
        <h3>Keyword Analysis</h3>
        <div className="keyword-analysis">
          {optimization.keywordAnalysis?.primaryKeyword && (
            <div className="primary-keyword">
              <strong>Primary Keyword:</strong> {optimization.keywordAnalysis.primaryKeyword}
            </div>
          )}
          
          <div className="keyword-densities">
            <h4>Keyword Densities</h4>
            {Object.entries(optimization.keywordAnalysis?.keywordDensities || {}).map(([keyword, density]) => (
              <div key={keyword} className="density-item">
                <span className="keyword">{keyword}</span>
                <span className="density">{(density * 100).toFixed(2)}%</span>
                <div className="density-bar">
                  <div 
                    className={`density-fill ${getDensityClass(density)}`}
                    style={{ width: `${Math.min(100, density * 4000)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="keyword-placements">
            <h4>Keyword Placement</h4>
            {Object.entries(optimization.keywordAnalysis?.keywordPlacements || {}).map(([keyword, placement]) => (
              <div key={keyword} className="placement-item">
                <div className="placement-keyword">{keyword}</div>
                <div className="placement-checks">
                  <div className={`check ${placement.inTitle ? 'success' : 'warning'}`}>
                    {placement.inTitle ? '✓' : '✗'} In Title
                  </div>
                  <div className={`check ${placement.inFirstParagraph ? 'success' : 'warning'}`}>
                    {placement.inFirstParagraph ? '✓' : '✗'} First Paragraph
                  </div>
                  <div className={`check ${placement.inLastParagraph ? 'success' : 'warning'}`}>
                    {placement.inLastParagraph ? '✓' : '✗'} Last Paragraph
                  </div>
                  <div className={`check ${placement.inHeadings?.length > 0 ? 'success' : 'warning'}`}>
                    {placement.inHeadings?.length > 0 ? '✓' : '✗'} In Headings ({placement.inHeadings?.length || 0})
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="analysis-section">
        <h3>Content Structure</h3>
        <div className="content-structure">
          <div className="structure-metrics">
            <div className="metric">
              <span className="metric-label">Word Count</span>
              <span className="metric-value">{optimization.contentStructure?.wordCount || 0}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Readability Score</span>
              <span className="metric-value">{optimization.contentStructure?.readabilityScore?.toFixed(1) || 0}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Headings</span>
              <span className="metric-value">{optimization.contentStructure?.headingStructure?.count || 0}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Paragraphs</span>
              <span className="metric-value">{optimization.contentStructure?.paragraphAnalysis?.count || 0}</span>
            </div>
          </div>

          <div className="heading-structure">
            <h4>Heading Structure</h4>
            {optimization.contentStructure?.headingStructure?.headings?.map((heading, index) => (
              <div key={index} className="heading-item">
                <span className={`heading-level h${heading.level}`}>
                  H{heading.level}
                </span>
                <span className="heading-text">{heading.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="analysis-section">
        <h3>Internal Links</h3>
        <div className="internal-links">
          {optimization.internalLinks?.length > 0 ? (
            <div className="links-list">
              {optimization.internalLinks.map((link, index) => (
                <div key={index} className="link-item">
                  <div className="link-anchor">{link.anchorText}</div>
                  <div className="link-url">{link.url}</div>
                  <div className="link-relevance">
                    Relevance: {(link.relevanceScore * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-links">No internal link suggestions available</div>
          )}
        </div>
      </div>

      <div className="analysis-section">
        <h3>Meta Tags</h3>
        <div className="meta-tags">
          <div className="meta-item">
            <label>Title Tag</label>
            <div className="meta-preview title-preview">
              {optimization.metaTags?.title || 'No title generated'}
            </div>
            <div className="meta-length">
              Length: {optimization.metaTags?.title?.length || 0} characters
            </div>
          </div>
          <div className="meta-item">
            <label>Meta Description</label>
            <div className="meta-preview description-preview">
              {optimization.metaTags?.description || 'No description generated'}
            </div>
            <div className="meta-length">
              Length: {optimization.metaTags?.description?.length || 0} characters
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Suggestions Tab
const SuggestionsTab = ({ optimization, onApplyOptimization }) => {
  if (!optimization) {
    return <div className="empty-state">Enter content to see optimization suggestions</div>;
  }

  const recommendations = optimization.seoRecommendations || [];

  return (
    <div className="suggestions-tab">
      <div className="suggestions-header">
        <h3>Optimization Suggestions</h3>
        <div className="suggestions-count">
          {recommendations.length} suggestions available
        </div>
      </div>

      <div className="suggestions-list">
        {recommendations.map((suggestion, index) => (
          <div key={index} className={`suggestion-item priority-${suggestion.priority}`}>
            <div className="suggestion-header">
              <div className="suggestion-type">{suggestion.type.replace('_', ' ')}</div>
              <div className={`suggestion-priority priority-${suggestion.priority}`}>
                {suggestion.priority}
              </div>
            </div>
            <div className="suggestion-message">{suggestion.message}</div>
            {suggestion.type === 'title_length' && (
              <button 
                className="apply-btn"
                onClick={() => onApplyOptimization('title', generateOptimizedTitle(optimization))}
              >
                Generate Optimized Title
              </button>
            )}
            {suggestion.type === 'meta_description' && (
              <button 
                className="apply-btn"
                onClick={() => onApplyOptimization('meta_description', generateOptimizedDescription(optimization))}
              >
                Generate Meta Description
              </button>
            )}
          </div>
        ))}
      </div>

      {optimization.keywordAnalysis?.recommendations?.length > 0 && (
        <div className="keyword-recommendations">
          <h4>Keyword Recommendations</h4>
          <div className="keyword-suggestions-list">
            {optimization.keywordAnalysis.recommendations.map((rec, index) => (
              <div key={index} className={`keyword-suggestion ${rec.type}`}>
                <div className="suggestion-icon">
                  {rec.type === 'keyword_density_low' ? '📈' : '📉'}
                </div>
                <div className="suggestion-content">
                  <div className="suggestion-keyword">{rec.keyword}</div>
                  <div className="suggestion-text">{rec.message}</div>
                  <div className="suggestion-details">
                    Current: {(rec.current * 100).toFixed(2)}% | Target: {(rec.target * 100).toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {optimization.contentStructure?.recommendations?.length > 0 && (
        <div className="structure-recommendations">
          <h4>Content Structure Recommendations</h4>
          <div className="structure-suggestions-list">
            {optimization.contentStructure.recommendations.map((rec, index) => (
              <div key={index} className={`structure-suggestion priority-${rec.priority}`}>
                <div className="suggestion-icon">
                  {rec.type === 'content_length' ? '📝' : 
                   rec.type === 'heading_structure' ? '📋' : '📊'}
                </div>
                <div className="suggestion-content">
                  <div className="suggestion-type">{rec.type.replace('_', ' ')}</div>
                  <div className="suggestion-text">{rec.message}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Preview Tab
const PreviewTab = ({ content, optimization }) => {
  return (
    <div className="preview-tab">
      <div className="preview-section">
        <h3>Search Result Preview</h3>
        <div className="serp-preview">
          <div className="serp-title">
            {optimization?.metaTags?.title || content.title || 'Your Page Title'}
          </div>
          <div className="serp-url">
            https://billbytekot.com{content.url || '/blog/your-content'}
          </div>
          <div className="serp-description">
            {optimization?.metaTags?.description || content.metaDescription || 'Your meta description will appear here...'}
          </div>
        </div>
      </div>

      <div className="preview-section">
        <h3>Social Media Preview</h3>
        <div className="social-preview">
          <div className="social-image-placeholder">
            📷 Featured Image
          </div>
          <div className="social-content">
            <div className="social-title">
              {content.title || 'Your Content Title'}
            </div>
            <div className="social-description">
              {content.metaDescription || 'Your meta description...'}
            </div>
            <div className="social-domain">billbytekot.com</div>
          </div>
        </div>
      </div>

      <div className="preview-section">
        <h3>Content Preview</h3>
        <div className="content-preview">
          <h1>{content.title}</h1>
          <div className="content-meta">
            <span>Category: {content.category.replace('-', ' ')}</span>
            <span>Keywords: {content.targetKeywords.join(', ')}</span>
          </div>
          <div className="content-body">
            {content.content.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>
      </div>

      {optimization?.internalLinks?.length > 0 && (
        <div className="preview-section">
          <h3>Suggested Internal Links</h3>
          <div className="internal-links-preview">
            {optimization.internalLinks.map((link, index) => (
              <div key={index} className="link-preview">
                <a href={link.url} className="internal-link">
                  {link.anchorText}
                </a>
                <span className="link-type">({link.type})</span>
              </div>
            ))}
          </div>
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

const getDensityClass = (density) => {
  if (density >= 0.01 && density <= 0.025) return 'optimal';
  if (density >= 0.005 && density <= 0.035) return 'good';
  if (density > 0.035) return 'high';
  return 'low';
};

const generateOptimizedTitle = (optimization) => {
  const primaryKeyword = optimization.keywordAnalysis?.primaryKeyword;
  if (primaryKeyword) {
    return `Complete Guide to ${primaryKeyword} | BillByteKOT`;
  }
  return 'Optimized Title | BillByteKOT';
};

const generateOptimizedDescription = (optimization) => {
  const primaryKeyword = optimization.keywordAnalysis?.primaryKeyword;
  if (primaryKeyword) {
    return `Learn everything about ${primaryKeyword} with our comprehensive guide. Expert tips, best practices, and actionable insights for restaurant owners.`;
  }
  return 'Comprehensive guide with expert tips and best practices for restaurant owners. Get actionable insights to improve your business operations.';
};

export default ContentOptimizer;