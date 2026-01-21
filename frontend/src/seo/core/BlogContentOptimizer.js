/**
 * Blog Content Optimizer - Handles automatic keyword targeting and optimization
 * Implements Requirements: 3.2, 3.4, 3.5
 */

import MetaTagOptimizer from './MetaTagOptimizer.js';

class BlogContentOptimizer {
  constructor() {
    this.metaTagOptimizer = new MetaTagOptimizer();
    this.keywordDensityTarget = 0.015; // 1.5% keyword density target
    this.maxKeywordDensity = 0.025; // 2.5% maximum keyword density
    this.minContentLength = 800; // Minimum content length for SEO
    this.optimalContentLength = 1500; // Optimal content length
  }

  /**
   * Optimize blog post for target keywords
   * @param {Object} blogPost - Blog post data
   * @returns {Object} Optimized blog post
   */
  optimizeBlogPost(blogPost) {
    const optimized = { ...blogPost };

    // Optimize meta tags
    optimized.metaTags = this.generateOptimizedMetaTags(blogPost);

    // Analyze and optimize keyword targeting
    optimized.keywordAnalysis = this.analyzeKeywordTargeting(blogPost);

    // Generate internal links
    optimized.internalLinks = this.generateInternalLinks(blogPost);

    // Optimize content structure
    optimized.contentStructure = this.optimizeContentStructure(blogPost);

    // Generate SEO recommendations
    optimized.seoRecommendations = this.generateSEORecommendations(blogPost);

    return optimized;
  }

  /**
   * Generate optimized meta tags for blog content
   * @param {Object} blogPost - Blog post data
   * @returns {Object} Optimized meta tags
   */
  generateOptimizedMetaTags(blogPost) {
    const pageData = {
      title: blogPost.title,
      content: blogPost.content,
      keywords: blogPost.targetKeywords || [],
      type: 'blog',
      category: blogPost.category
    };

    return this.metaTagOptimizer.optimizeMetaTags(pageData);
  }

  /**
   * Analyze keyword targeting in blog content
   * @param {Object} blogPost - Blog post data
   * @returns {Object} Keyword analysis results
   */
  analyzeKeywordTargeting(blogPost) {
    const content = blogPost.content || '';
    const title = blogPost.title || '';
    const targetKeywords = blogPost.targetKeywords || [];

    const analysis = {
      primaryKeyword: null,
      keywordDensities: {},
      keywordPlacements: {},
      recommendations: []
    };

    // Analyze each target keyword
    targetKeywords.forEach((keyword, index) => {
      const keywordData = typeof keyword === 'string' ? { term: keyword } : keyword;
      const term = keywordData.term.toLowerCase();
      
      if (index === 0) {
        analysis.primaryKeyword = term;
      }

      // Calculate keyword density
      const density = this.calculateKeywordDensity(content, term);
      analysis.keywordDensities[term] = density;

      // Analyze keyword placement
      analysis.keywordPlacements[term] = this.analyzeKeywordPlacement(title, content, term);

      // Generate recommendations
      if (density < this.keywordDensityTarget) {
        analysis.recommendations.push({
          type: 'keyword_density_low',
          keyword: term,
          current: density,
          target: this.keywordDensityTarget,
          message: `Increase usage of "${term}" to reach target density of ${(this.keywordDensityTarget * 100).toFixed(1)}%`
        });
      } else if (density > this.maxKeywordDensity) {
        analysis.recommendations.push({
          type: 'keyword_density_high',
          keyword: term,
          current: density,
          target: this.keywordDensityTarget,
          message: `Reduce usage of "${term}" to avoid keyword stuffing (current: ${(density * 100).toFixed(1)}%)`
        });
      }
    });

    return analysis;
  }

  /**
   * Calculate keyword density in content
   * @param {string} content - Content text
   * @param {string} keyword - Target keyword
   * @returns {number} Keyword density (0-1)
   */
  calculateKeywordDensity(content, keyword) {
    if (!content || !keyword) return 0;

    const contentLower = content.toLowerCase();
    const keywordLower = keyword.toLowerCase();
    
    // Count keyword occurrences (including partial matches in phrases)
    const keywordCount = (contentLower.match(new RegExp(keywordLower, 'g')) || []).length;
    
    // Count total words
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
    
    return wordCount > 0 ? keywordCount / wordCount : 0;
  }

  /**
   * Analyze keyword placement in title and content
   * @param {string} title - Blog post title
   * @param {string} content - Blog post content
   * @param {string} keyword - Target keyword
   * @returns {Object} Placement analysis
   */
  analyzeKeywordPlacement(title, content, keyword) {
    const keywordLower = keyword.toLowerCase();
    const titleLower = (title || '').toLowerCase();
    const contentLower = (content || '').toLowerCase();

    // Split content into sections (first 100 words, middle, last 100 words)
    const words = content.split(/\s+/);
    const firstSection = words.slice(0, 100).join(' ').toLowerCase();
    const lastSection = words.slice(-100).join(' ').toLowerCase();

    return {
      inTitle: titleLower.includes(keywordLower),
      inFirstParagraph: firstSection.includes(keywordLower),
      inLastParagraph: lastSection.includes(keywordLower),
      inHeadings: this.findKeywordInHeadings(content, keyword),
      totalOccurrences: (contentLower.match(new RegExp(keywordLower, 'g')) || []).length
    };
  }

  /**
   * Find keyword occurrences in headings
   * @param {string} content - Content text
   * @param {string} keyword - Target keyword
   * @returns {Array} Heading matches
   */
  findKeywordInHeadings(content, keyword) {
    const headingRegex = /^#{1,6}\s+(.+)$/gm;
    const matches = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      if (match[1].toLowerCase().includes(keyword.toLowerCase())) {
        matches.push({
          level: match[0].match(/^#+/)[0].length,
          text: match[1],
          position: match.index
        });
      }
    }

    return matches;
  }

  /**
   * Generate internal links for blog content
   * @param {Object} blogPost - Blog post data
   * @returns {Array} Internal link suggestions
   */
  generateInternalLinks(blogPost) {
    const category = blogPost.category;
    const targetKeywords = blogPost.targetKeywords || [];
    const content = blogPost.content || '';

    // Define internal link opportunities based on content category
    const linkOpportunities = this.getInternalLinkOpportunities(category);

    const suggestions = [];

    // Generate keyword-based internal links
    targetKeywords.forEach(keyword => {
      const keywordTerm = typeof keyword === 'string' ? keyword : keyword.term;
      const relatedLinks = this.findRelatedInternalLinks(keywordTerm, linkOpportunities);
      suggestions.push(...relatedLinks);
    });

    // Generate contextual internal links based on content
    const contextualLinks = this.generateContextualLinks(content, category);
    suggestions.push(...contextualLinks);

    // Remove duplicates and limit to top 5 suggestions
    const uniqueLinks = suggestions.filter((link, index, self) => 
      index === self.findIndex(l => l.url === link.url)
    );

    return uniqueLinks.slice(0, 5);
  }

  /**
   * Get internal link opportunities by category
   * @param {string} category - Content category
   * @returns {Array} Link opportunities
   */
  getInternalLinkOpportunities(category) {
    const opportunities = {
      'restaurant-management-tips': [
        { url: '/features/inventory-management', anchor: 'inventory management system', keywords: ['inventory', 'stock', 'management'] },
        { url: '/features/staff-management', anchor: 'staff management tools', keywords: ['staff', 'employee', 'team'] },
        { url: '/features/reporting', anchor: 'restaurant analytics', keywords: ['analytics', 'reports', 'insights'] },
        { url: '/pricing', anchor: 'restaurant software pricing', keywords: ['pricing', 'cost', 'plans'] }
      ],
      'billing-best-practices': [
        { url: '/features/billing', anchor: 'restaurant billing software', keywords: ['billing', 'invoice', 'payment'] },
        { url: '/features/pos', anchor: 'POS system features', keywords: ['pos', 'point of sale', 'checkout'] },
        { url: '/features/receipts', anchor: 'receipt management', keywords: ['receipt', 'transaction', 'record'] },
        { url: '/compliance', anchor: 'tax compliance tools', keywords: ['tax', 'compliance', 'regulation'] }
      ],
      'industry-trends': [
        { url: '/blog/category/trends', anchor: 'restaurant industry trends', keywords: ['trends', 'industry', 'future'] },
        { url: '/features', anchor: 'restaurant software features', keywords: ['features', 'capabilities', 'tools'] },
        { url: '/case-studies', anchor: 'restaurant success stories', keywords: ['case study', 'success', 'results'] }
      ],
      'software-tutorials': [
        { url: '/getting-started', anchor: 'getting started guide', keywords: ['setup', 'installation', 'start'] },
        { url: '/features/kot', anchor: 'KOT system tutorial', keywords: ['kot', 'kitchen order', 'ticket'] },
        { url: '/support', anchor: 'customer support', keywords: ['support', 'help', 'assistance'] },
        { url: '/documentation', anchor: 'software documentation', keywords: ['documentation', 'manual', 'guide'] }
      ]
    };

    return opportunities[category] || [];
  }

  /**
   * Find related internal links for a keyword
   * @param {string} keyword - Target keyword
   * @param {Array} opportunities - Available link opportunities
   * @returns {Array} Related links
   */
  findRelatedInternalLinks(keyword, opportunities) {
    const keywordLower = keyword.toLowerCase();
    const relatedLinks = [];

    opportunities.forEach(opportunity => {
      const isRelated = opportunity.keywords.some(k => 
        keywordLower.includes(k.toLowerCase()) || k.toLowerCase().includes(keywordLower)
      );

      if (isRelated) {
        relatedLinks.push({
          url: opportunity.url,
          anchorText: opportunity.anchor,
          relevanceScore: this.calculateRelevanceScore(keyword, opportunity.keywords),
          type: 'keyword-based'
        });
      }
    });

    return relatedLinks;
  }

  /**
   * Generate contextual internal links based on content
   * @param {string} content - Blog post content
   * @param {string} category - Content category
   * @returns {Array} Contextual links
   */
  generateContextualLinks(content, category) {
    const contextualLinks = [];
    const contentLower = content.toLowerCase();

    // Common contextual link patterns
    const patterns = [
      { phrase: 'restaurant billing', url: '/features/billing', anchor: 'restaurant billing system' },
      { phrase: 'pos system', url: '/features/pos', anchor: 'POS system' },
      { phrase: 'inventory management', url: '/features/inventory', anchor: 'inventory management' },
      { phrase: 'kitchen order', url: '/features/kot', anchor: 'kitchen order ticket system' },
      { phrase: 'staff management', url: '/features/staff', anchor: 'staff management tools' },
      { phrase: 'restaurant software', url: '/features', anchor: 'restaurant management software' }
    ];

    patterns.forEach(pattern => {
      if (contentLower.includes(pattern.phrase)) {
        contextualLinks.push({
          url: pattern.url,
          anchorText: pattern.anchor,
          relevanceScore: 0.8,
          type: 'contextual',
          matchedPhrase: pattern.phrase
        });
      }
    });

    return contextualLinks;
  }

  /**
   * Calculate relevance score between keyword and opportunity keywords
   * @param {string} keyword - Target keyword
   * @param {Array} opportunityKeywords - Opportunity keywords
   * @returns {number} Relevance score (0-1)
   */
  calculateRelevanceScore(keyword, opportunityKeywords) {
    const keywordWords = keyword.toLowerCase().split(/\s+/);
    let matchCount = 0;

    opportunityKeywords.forEach(oppKeyword => {
      const oppWords = oppKeyword.toLowerCase().split(/\s+/);
      oppWords.forEach(oppWord => {
        if (keywordWords.some(kw => kw.includes(oppWord) || oppWord.includes(kw))) {
          matchCount++;
        }
      });
    });

    return Math.min(matchCount / keywordWords.length, 1);
  }

  /**
   * Optimize content structure for SEO
   * @param {Object} blogPost - Blog post data
   * @returns {Object} Content structure analysis
   */
  optimizeContentStructure(blogPost) {
    const content = blogPost.content || '';
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;

    return {
      wordCount,
      readabilityScore: this.calculateReadabilityScore(content),
      headingStructure: this.analyzeHeadingStructure(content),
      paragraphAnalysis: this.analyzeParagraphs(content),
      recommendations: this.generateStructureRecommendations(content, wordCount)
    };
  }

  /**
   * Calculate basic readability score
   * @param {string} content - Content text
   * @returns {number} Readability score
   */
  calculateReadabilityScore(content) {
    if (!content) return 0;

    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.split(/\s+/).filter(w => w.length > 0);
    const syllables = words.reduce((count, word) => count + this.countSyllables(word), 0);

    if (sentences.length === 0 || words.length === 0) return 0;

    // Simplified Flesch Reading Ease formula
    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;
    
    const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Count syllables in a word (simplified)
   * @param {string} word - Word to analyze
   * @returns {number} Syllable count
   */
  countSyllables(word) {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    
    const vowels = 'aeiouy';
    let count = 0;
    let previousWasVowel = false;

    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i]);
      if (isVowel && !previousWasVowel) {
        count++;
      }
      previousWasVowel = isVowel;
    }

    // Adjust for silent 'e'
    if (word.endsWith('e')) count--;
    
    return Math.max(1, count);
  }

  /**
   * Analyze heading structure
   * @param {string} content - Content text
   * @returns {Object} Heading analysis
   */
  analyzeHeadingStructure(content) {
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const headings = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      headings.push({
        level: match[1].length,
        text: match[2],
        position: match.index
      });
    }

    return {
      headings,
      hasH1: headings.some(h => h.level === 1),
      hasH2: headings.some(h => h.level === 2),
      properHierarchy: this.checkHeadingHierarchy(headings),
      count: headings.length
    };
  }

  /**
   * Check if heading hierarchy is proper
   * @param {Array} headings - Heading data
   * @returns {boolean} Whether hierarchy is proper
   */
  checkHeadingHierarchy(headings) {
    for (let i = 1; i < headings.length; i++) {
      const current = headings[i];
      const previous = headings[i - 1];
      
      // Check if heading level jumps more than 1
      if (current.level > previous.level + 1) {
        return false;
      }
    }
    return true;
  }

  /**
   * Analyze paragraph structure
   * @param {string} content - Content text
   * @returns {Object} Paragraph analysis
   */
  analyzeParagraphs(content) {
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const wordCounts = paragraphs.map(p => p.split(/\s+/).length);

    return {
      count: paragraphs.length,
      averageLength: wordCounts.reduce((sum, count) => sum + count, 0) / wordCounts.length || 0,
      longestParagraph: Math.max(...wordCounts, 0),
      shortestParagraph: Math.min(...wordCounts, 0)
    };
  }

  /**
   * Generate structure recommendations
   * @param {string} content - Content text
   * @param {number} wordCount - Total word count
   * @returns {Array} Recommendations
   */
  generateStructureRecommendations(content, wordCount) {
    const recommendations = [];

    if (wordCount < this.minContentLength) {
      recommendations.push({
        type: 'content_length',
        priority: 'high',
        message: `Content is too short (${wordCount} words). Aim for at least ${this.minContentLength} words for better SEO.`
      });
    }

    const headingStructure = this.analyzeHeadingStructure(content);
    if (!headingStructure.hasH2) {
      recommendations.push({
        type: 'heading_structure',
        priority: 'medium',
        message: 'Add H2 headings to improve content structure and readability.'
      });
    }

    if (!headingStructure.properHierarchy) {
      recommendations.push({
        type: 'heading_hierarchy',
        priority: 'medium',
        message: 'Fix heading hierarchy - avoid skipping heading levels (e.g., H1 to H3).'
      });
    }

    const readabilityScore = this.calculateReadabilityScore(content);
    if (readabilityScore < 60) {
      recommendations.push({
        type: 'readability',
        priority: 'medium',
        message: 'Improve readability by using shorter sentences and simpler words.'
      });
    }

    return recommendations;
  }

  /**
   * Generate comprehensive SEO recommendations
   * @param {Object} blogPost - Blog post data
   * @returns {Array} SEO recommendations
   */
  generateSEORecommendations(blogPost) {
    const recommendations = [];
    const content = blogPost.content || '';
    const title = blogPost.title || '';
    const targetKeywords = blogPost.targetKeywords || [];

    // Title optimization
    if (title.length < 30) {
      recommendations.push({
        type: 'title_length',
        priority: 'high',
        message: 'Title is too short. Aim for 30-60 characters for better SEO.'
      });
    } else if (title.length > 60) {
      recommendations.push({
        type: 'title_length',
        priority: 'medium',
        message: 'Title may be too long. Keep it under 60 characters to avoid truncation in search results.'
      });
    }

    // Keyword in title
    if (targetKeywords.length > 0) {
      const primaryKeyword = typeof targetKeywords[0] === 'string' ? targetKeywords[0] : targetKeywords[0].term;
      if (!title.toLowerCase().includes(primaryKeyword.toLowerCase())) {
        recommendations.push({
          type: 'keyword_in_title',
          priority: 'high',
          message: `Include primary keyword "${primaryKeyword}" in the title.`
        });
      }
    }

    // Content length
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
    if (wordCount < this.minContentLength) {
      recommendations.push({
        type: 'content_length',
        priority: 'high',
        message: `Increase content length to at least ${this.minContentLength} words (current: ${wordCount}).`
      });
    }

    // Meta description
    if (!blogPost.metaDescription || blogPost.metaDescription.length < 120) {
      recommendations.push({
        type: 'meta_description',
        priority: 'medium',
        message: 'Add a compelling meta description (120-160 characters) that includes your target keyword.'
      });
    }

    return recommendations;
  }
}

export default BlogContentOptimizer;