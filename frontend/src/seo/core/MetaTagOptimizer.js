/**
 * Meta Tag Optimizer
 * 
 * Handles generation and optimization of meta tags including title,
 * description, keywords, Open Graph, and Twitter Card tags.
 * Enhanced with keyword density analysis and advanced template systems.
 * 
 * @requirements 1.5, 4.1, 2.5
 */

import SEOConfig from '../config/SEOConfig';
import { ContentType, KeywordPriority } from '../types';

class MetaTagOptimizer {
  constructor(config = {}) {
    this.config = { ...SEOConfig, ...config };
    this.templateCache = new Map();
    this.keywordAnalysisCache = new Map();
  }

  /**
   * Generate optimized meta tags for a page
   * @param {PageData} pageData - Page data object
   * @returns {MetaTagSet} Complete set of optimized meta tags
   */
  generateMetaTags(pageData) {
    const {
      title,
      description,
      keywords = [],
      type = ContentType.HOMEPAGE,
      url,
      image,
      author,
      publishedDate,
      modifiedDate,
      content = ''
    } = pageData;

    // Perform keyword density analysis on content
    const keywordAnalysis = this.analyzeKeywordDensity(content, keywords, type);
    
    // Generate optimized title using advanced template system
    const optimizedTitle = this.optimizeTitle(title, type, keywordAnalysis);
    
    // Generate optimized description using advanced template system
    const optimizedDescription = this.optimizeDescription(description, type, keywordAnalysis, content);
    
    // Generate keyword string with density optimization
    const keywordString = this.optimizeKeywords(keywords, type, keywordAnalysis);
    
    // Generate canonical URL
    const canonicalUrl = this.generateCanonicalURL(url);
    
    // Generate Open Graph tags
    const openGraph = this.generateOpenGraphTags({
      title: optimizedTitle,
      description: optimizedDescription,
      url: canonicalUrl,
      image,
      type: this.mapContentTypeToOGType(type),
      author,
      publishedDate,
      modifiedDate
    });
    
    // Generate Twitter Card tags
    const twitterCard = this.generateTwitterCardTags({
      title: optimizedTitle,
      description: optimizedDescription,
      image,
      url: canonicalUrl
    });

    return {
      title: optimizedTitle,
      description: optimizedDescription,
      keywords: keywordString,
      canonical: canonicalUrl,
      openGraph,
      twitterCard,
      robots: this.generateRobotsDirective(pageData),
      author: author || this.config.site.name,
      viewport: 'width=device-width, initial-scale=1.0',
      charset: 'utf-8',
      language: this.config.site.language,
      keywordAnalysis: keywordAnalysis // Include analysis for debugging/optimization
    };
  }

  /**
   * Analyze keyword density in content
   * @param {string} content - Page content to analyze
   * @param {string[]} targetKeywords - Target keywords to analyze
   * @param {ContentType} type - Content type for context
   * @returns {Object} Keyword density analysis results
   */
  analyzeKeywordDensity(content, targetKeywords = [], type) {
    const cacheKey = `${type}-${content.substring(0, 100)}-${targetKeywords.join(',')}`;
    
    if (this.keywordAnalysisCache.has(cacheKey)) {
      return this.keywordAnalysisCache.get(cacheKey);
    }

    if (!content || typeof content !== 'string') {
      const emptyAnalysis = {
        totalWords: 0,
        keywordDensities: {},
        recommendations: [],
        score: 0,
        primaryKeywords: [],
        secondaryKeywords: []
      };
      this.keywordAnalysisCache.set(cacheKey, emptyAnalysis);
      return emptyAnalysis;
    }

    // Clean and prepare content for analysis
    const cleanContent = content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const words = cleanContent.split(' ').filter(word => word.length > 2);
    const totalWords = words.length;

    // Get all relevant keywords (target + default for content type)
    const allKeywords = [
      ...targetKeywords,
      ...this.getDefaultKeywords(type),
      ...this.config.primaryKeywords.map(k => k.term),
      ...this.config.secondaryKeywords.map(k => k.term)
    ];

    const keywordDensities = {};
    const recommendations = [];
    let totalScore = 0;

    // Analyze each keyword
    allKeywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      const keywordWords = keywordLower.split(' ');
      
      // Count exact matches and partial matches
      let exactMatches = 0;
      let partialMatches = 0;

      if (keywordWords.length === 1) {
        // Single word keyword
        exactMatches = words.filter(word => word === keywordLower).length;
      } else {
        // Multi-word keyword - look for phrase matches
        const contentText = cleanContent;
        const regex = new RegExp(`\\b${keywordLower.replace(/\s+/g, '\\s+')}\\b`, 'g');
        const matches = contentText.match(regex);
        exactMatches = matches ? matches.length : 0;
        
        // Count partial matches (individual words present)
        keywordWords.forEach(word => {
          partialMatches += words.filter(w => w === word).length;
        });
      }

      const density = totalWords > 0 ? (exactMatches / totalWords) * 100 : 0;
      const partialDensity = totalWords > 0 ? (partialMatches / totalWords) * 100 : 0;

      keywordDensities[keyword] = {
        exactMatches,
        partialMatches,
        density: parseFloat(density.toFixed(2)),
        partialDensity: parseFloat(partialDensity.toFixed(2)),
        isTarget: targetKeywords.includes(keyword),
        isPrimary: this.config.primaryKeywords.some(k => k.term === keyword),
        isSecondary: this.config.secondaryKeywords.some(k => k.term === keyword)
      };

      // Generate recommendations based on density
      const isTargetKeyword = targetKeywords.includes(keyword);
      const isPrimaryKeyword = this.config.primaryKeywords.some(k => k.term === keyword);
      
      if (isTargetKeyword || isPrimaryKeyword) {
        const optimalRange = isPrimaryKeyword 
          ? this.config.contentOptimization.keywordDensity.primary
          : this.config.contentOptimization.keywordDensity.secondary;

        if (density < optimalRange.min) {
          recommendations.push({
            type: 'increase',
            keyword,
            current: density,
            target: optimalRange.min,
            message: `Increase "${keyword}" density to at least ${optimalRange.min}%`
          });
        } else if (density > optimalRange.max) {
          recommendations.push({
            type: 'decrease',
            keyword,
            current: density,
            target: optimalRange.max,
            message: `Reduce "${keyword}" density to below ${optimalRange.max}%`
          });
        } else {
          totalScore += 10; // Good density
        }
      }
    });

    // Identify primary and secondary keywords based on density and importance
    const sortedKeywords = Object.entries(keywordDensities)
      .filter(([_, data]) => data.density > 0)
      .sort((a, b) => {
        // Sort by importance (target > primary > secondary) then by density
        const aImportance = a[1].isTarget ? 3 : (a[1].isPrimary ? 2 : 1);
        const bImportance = b[1].isTarget ? 3 : (b[1].isPrimary ? 2 : 1);
        
        if (aImportance !== bImportance) {
          return bImportance - aImportance;
        }
        return b[1].density - a[1].density;
      });

    const primaryKeywords = sortedKeywords.slice(0, 3).map(([keyword]) => keyword);
    const secondaryKeywords = sortedKeywords.slice(3, 8).map(([keyword]) => keyword);

    // Calculate overall score
    const maxScore = Math.max(100, allKeywords.length * 10);
    const finalScore = Math.min(100, (totalScore / maxScore) * 100);

    const analysis = {
      totalWords,
      keywordDensities,
      recommendations,
      score: Math.round(finalScore),
      primaryKeywords,
      secondaryKeywords,
      analysisDate: new Date()
    };

    this.keywordAnalysisCache.set(cacheKey, analysis);
    return analysis;
  }

  /**
   * Get keyword suggestions based on content analysis
   * @param {string} content - Content to analyze
   * @param {ContentType} type - Content type
   * @returns {Object} Keyword suggestions
   */
  getKeywordSuggestions(content, type) {
    if (!content) return { suggestions: [], confidence: 0 };

    const analysis = this.analyzeKeywordDensity(content, [], type);
    const suggestions = [];

    // Suggest keywords based on content type and current usage
    const typeKeywords = this.getDefaultKeywords(type);
    const primaryKeywords = this.config.primaryKeywords.map(k => k.term);
    const secondaryKeywords = this.config.secondaryKeywords.map(k => k.term);

    // Find underutilized keywords
    [...primaryKeywords, ...secondaryKeywords, ...typeKeywords].forEach(keyword => {
      const density = analysis.keywordDensities[keyword];
      if (!density || density.density < 0.5) {
        suggestions.push({
          keyword,
          reason: 'underutilized',
          currentDensity: density ? density.density : 0,
          recommendedDensity: 1.5,
          priority: primaryKeywords.includes(keyword) ? 'high' : 'medium'
        });
      }
    });

    // Calculate confidence based on content length and keyword coverage
    const confidence = Math.min(100, 
      (analysis.totalWords / 500) * 50 + 
      (suggestions.length > 0 ? 50 : 0)
    );

    return {
      suggestions: suggestions.slice(0, 5), // Limit to top 5 suggestions
      confidence: Math.round(confidence),
      totalWords: analysis.totalWords
    };
  }

  /**
   * Optimize title using advanced template system and keyword analysis
   * @param {string} title - Original title
   * @param {ContentType} type - Content type
   * @param {Object} keywordAnalysis - Keyword analysis results
   * @returns {string} Optimized title
   */
  optimizeTitle(title, type, keywordAnalysis = null) {
    if (!title) {
      return this.getTemplateTitle(type, keywordAnalysis);
    }

    const siteName = this.config.site.name;
    const maxLength = this.config.technical.maxTitleLength;
    
    // Clean and trim title
    let optimizedTitle = title.trim();
    
    // Apply keyword optimization if analysis is available
    if (keywordAnalysis && keywordAnalysis.primaryKeywords.length > 0) {
      optimizedTitle = this.enhanceTitleWithKeywords(optimizedTitle, keywordAnalysis.primaryKeywords, type);
    }
    
    // Add site name if not already present
    if (!optimizedTitle.toLowerCase().includes(siteName.toLowerCase())) {
      const separator = this.getTitleSeparator(type);
      const availableLength = maxLength - siteName.length - separator.length;
      
      if (optimizedTitle.length > availableLength) {
        optimizedTitle = optimizedTitle.substring(0, availableLength).trim();
        // Avoid cutting words in half
        const lastSpace = optimizedTitle.lastIndexOf(' ');
        if (lastSpace > availableLength * 0.8) {
          optimizedTitle = optimizedTitle.substring(0, lastSpace);
        }
      }
      
      optimizedTitle = `${optimizedTitle}${separator}${siteName}`;
    }

    // Ensure title doesn't exceed max length
    if (optimizedTitle.length > maxLength) {
      optimizedTitle = optimizedTitle.substring(0, maxLength - 3) + '...';
    }

    return optimizedTitle;
  }

  /**
   * Get template-based title for content type
   * @param {ContentType} type - Content type
   * @param {Object} keywordAnalysis - Keyword analysis results
   * @returns {string} Template-generated title
   */
  getTemplateTitle(type, keywordAnalysis = null) {
    const cacheKey = `title-${type}-${keywordAnalysis ? keywordAnalysis.primaryKeywords.join(',') : 'default'}`;
    
    if (this.templateCache.has(cacheKey)) {
      return this.templateCache.get(cacheKey);
    }

    const siteName = this.config.site.name;
    const templates = this.getTitleTemplates();
    const typeTemplates = templates[type] || templates[ContentType.HOMEPAGE];
    
    let selectedTemplate = typeTemplates[0]; // Default template
    
    // Select template based on keyword analysis
    if (keywordAnalysis && keywordAnalysis.primaryKeywords.length > 0) {
      const primaryKeyword = keywordAnalysis.primaryKeywords[0];
      
      // Find template that best matches the primary keyword
      const matchingTemplate = typeTemplates.find(template => 
        template.keywords.some(keyword => 
          primaryKeyword.toLowerCase().includes(keyword.toLowerCase())
        )
      );
      
      if (matchingTemplate) {
        selectedTemplate = matchingTemplate;
      }
    }
    
    // Replace template variables
    let title = selectedTemplate.template
      .replace('{siteName}', siteName)
      .replace('{primaryKeyword}', keywordAnalysis?.primaryKeywords[0] || 'restaurant software')
      .replace('{secondaryKeyword}', keywordAnalysis?.secondaryKeywords[0] || 'billing system');
    
    this.templateCache.set(cacheKey, title);
    return title;
  }

  /**
   * Get title templates for different content types
   * @returns {Object} Title templates by content type
   */
  getTitleTemplates() {
    return {
      [ContentType.HOMEPAGE]: [
        {
          template: '{siteName} - Restaurant Billing Software | Free KOT System',
          keywords: ['restaurant', 'billing', 'software'],
          priority: 1
        },
        {
          template: '{primaryKeyword} - {siteName} | Best Restaurant POS',
          keywords: ['pos', 'system', 'management'],
          priority: 2
        },
        {
          template: 'Best {primaryKeyword} in India | {siteName}',
          keywords: ['india', 'best', 'top'],
          priority: 3
        }
      ],
      [ContentType.PRODUCT_PAGE]: [
        {
          template: '{primaryKeyword} Features | {siteName}',
          keywords: ['features', 'functionality', 'capabilities'],
          priority: 1
        },
        {
          template: '{siteName} {primaryKeyword} - Complete Solution',
          keywords: ['solution', 'complete', 'comprehensive'],
          priority: 2
        },
        {
          template: 'Advanced {primaryKeyword} | {siteName}',
          keywords: ['advanced', 'professional', 'enterprise'],
          priority: 3
        }
      ],
      [ContentType.BLOG_POST]: [
        {
          template: '{primaryKeyword} Guide | {siteName} Blog',
          keywords: ['guide', 'tutorial', 'how-to'],
          priority: 1
        },
        {
          template: '{primaryKeyword} Tips & Best Practices | {siteName}',
          keywords: ['tips', 'best practices', 'advice'],
          priority: 2
        },
        {
          template: 'Complete {primaryKeyword} Guide | {siteName}',
          keywords: ['complete', 'comprehensive', 'ultimate'],
          priority: 3
        }
      ],
      [ContentType.LANDING_PAGE]: [
        {
          template: '{primaryKeyword} - Free Trial | {siteName}',
          keywords: ['free', 'trial', 'demo'],
          priority: 1
        },
        {
          template: 'Get {primaryKeyword} | {siteName}',
          keywords: ['get', 'start', 'begin'],
          priority: 2
        },
        {
          template: '{primaryKeyword} Pricing & Plans | {siteName}',
          keywords: ['pricing', 'plans', 'cost'],
          priority: 3
        }
      ],
      [ContentType.CATEGORY_PAGE]: [
        {
          template: '{primaryKeyword} Solutions | {siteName}',
          keywords: ['solutions', 'products', 'services'],
          priority: 1
        },
        {
          template: 'Browse {primaryKeyword} | {siteName}',
          keywords: ['browse', 'explore', 'discover'],
          priority: 2
        },
        {
          template: '{primaryKeyword} Category | {siteName}',
          keywords: ['category', 'section', 'area'],
          priority: 3
        }
      ]
    };
  }

  /**
   * Enhance title with primary keywords
   * @param {string} title - Original title
   * @param {string[]} primaryKeywords - Primary keywords to include
   * @param {ContentType} type - Content type
   * @returns {string} Enhanced title
   */
  enhanceTitleWithKeywords(title, primaryKeywords, type) {
    if (!primaryKeywords || primaryKeywords.length === 0) {
      return title;
    }

    const maxLength = this.config.technical.maxTitleLength - this.config.site.name.length - 3; // Account for separator and site name
    let enhancedTitle = title;
    
    // Check if title already contains primary keywords
    const titleLower = title.toLowerCase();
    const missingKeywords = primaryKeywords.filter(keyword => 
      !titleLower.includes(keyword.toLowerCase())
    );
    
    if (missingKeywords.length > 0 && enhancedTitle.length < maxLength * 0.7) {
      // Add the most important missing keyword
      const keywordToAdd = missingKeywords[0];
      const keywordPhrase = this.getKeywordPhrase(keywordToAdd, type);
      
      if (enhancedTitle.length + keywordPhrase.length + 3 <= maxLength) {
        enhancedTitle = `${enhancedTitle} - ${keywordPhrase}`;
      }
    }
    
    return enhancedTitle;
  }

  /**
   * Get contextual keyword phrase for title enhancement
   * @param {string} keyword - Base keyword
   * @param {ContentType} type - Content type
   * @returns {string} Contextual keyword phrase
   */
  getKeywordPhrase(keyword, type) {
    const phrases = {
      [ContentType.HOMEPAGE]: {
        'restaurant': 'Restaurant Software',
        'billing': 'Billing System',
        'pos': 'POS Solution',
        'kot': 'KOT System'
      },
      [ContentType.PRODUCT_PAGE]: {
        'restaurant': 'Restaurant Features',
        'billing': 'Billing Features',
        'pos': 'POS Features',
        'kot': 'KOT Features'
      },
      [ContentType.BLOG_POST]: {
        'restaurant': 'Restaurant Tips',
        'billing': 'Billing Guide',
        'pos': 'POS Tutorial',
        'kot': 'KOT Guide'
      },
      [ContentType.LANDING_PAGE]: {
        'restaurant': 'Restaurant Solution',
        'billing': 'Billing Software',
        'pos': 'POS System',
        'kot': 'KOT Software'
      },
      [ContentType.CATEGORY_PAGE]: {
        'restaurant': 'Restaurant Solutions',
        'billing': 'Billing Products',
        'pos': 'POS Systems',
        'kot': 'KOT Solutions'
      }
    };
    
    const typePhrases = phrases[type] || phrases[ContentType.HOMEPAGE];
    
    // Find matching phrase or return capitalized keyword
    for (const [key, phrase] of Object.entries(typePhrases)) {
      if (keyword.toLowerCase().includes(key)) {
        return phrase;
      }
    }
    
    return keyword.charAt(0).toUpperCase() + keyword.slice(1);
  }

  /**
   * Get title separator based on content type
   * @param {ContentType} type - Content type
   * @returns {string} Title separator
   */
  getTitleSeparator(type) {
    const separators = {
      [ContentType.HOMEPAGE]: ' | ',
      [ContentType.PRODUCT_PAGE]: ' - ',
      [ContentType.BLOG_POST]: ' | ',
      [ContentType.LANDING_PAGE]: ' - ',
      [ContentType.CATEGORY_PAGE]: ' | '
    };
    
    return separators[type] || ' | ';
  }

  /**
   * Optimize meta description
   * @param {string} description - Original description
   * @param {ContentType} type - Content type
   * @returns {string} Optimized description
   */
  optimizeDescription(description, type) {
    if (!description) {
      return this.getDefaultDescription(type);
    }

    const maxLength = this.config.technical.maxDescriptionLength;
    let optimizedDescription = description.trim();

    // Remove extra whitespace and line breaks
    optimizedDescription = optimizedDescription.replace(/\s+/g, ' ');

    // Ensure description doesn't exceed max length
    if (optimizedDescription.length > maxLength) {
      optimizedDescription = optimizedDescription.substring(0, maxLength - 3);
      // Avoid cutting words in half
      const lastSpace = optimizedDescription.lastIndexOf(' ');
      if (lastSpace > maxLength * 0.8) {
        optimizedDescription = optimizedDescription.substring(0, lastSpace);
      }
      optimizedDescription += '...';
    }

    // Ensure description ends with proper punctuation
    if (!/[.!?]$/.test(optimizedDescription)) {
      optimizedDescription += '.';
    }

    return optimizedDescription;
  }

  /**
   * Optimize keywords
   * @param {string[]} keywords - Array of keywords
   * @param {ContentType} type - Content type
   * @returns {string} Optimized keyword string
   */
  optimizeKeywords(keywords, type) {
    let allKeywords = [...keywords];
    
    // Add default keywords based on content type
    const defaultKeywords = this.getDefaultKeywords(type);
    allKeywords = [...allKeywords, ...defaultKeywords];
    
    // Remove duplicates and empty values
    allKeywords = [...new Set(allKeywords.filter(k => k && k.trim()))];
    
    // Limit number of keywords
    const maxKeywords = this.config.technical.maxKeywords;
    if (allKeywords.length > maxKeywords) {
      allKeywords = allKeywords.slice(0, maxKeywords);
    }
    
    return allKeywords.join(', ');
  }

  /**
   * Generate canonical URL
   * @param {string} url - Original URL
   * @returns {string} Canonical URL
   */
  generateCanonicalURL(url) {
    if (!url) {
      return this.config.site.baseUrl;
    }

    try {
      const urlObj = new URL(url, this.config.site.baseUrl);
      
      // Remove query parameters that don't affect content
      const paramsToRemove = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'];
      paramsToRemove.forEach(param => {
        urlObj.searchParams.delete(param);
      });
      
      // Ensure lowercase
      urlObj.pathname = urlObj.pathname.toLowerCase();
      
      // Remove trailing slash (except for root)
      if (urlObj.pathname.length > 1 && urlObj.pathname.endsWith('/')) {
        urlObj.pathname = urlObj.pathname.slice(0, -1);
      }
      
      return urlObj.toString();
    } catch (error) {
      console.warn('MetaTagOptimizer: Invalid URL provided, using base URL:', error);
      return this.config.site.baseUrl;
    }
  }

  /**
   * Generate Open Graph tags
   * @param {Object} data - OG data
   * @returns {OpenGraphTags} Open Graph tags object
   */
  generateOpenGraphTags(data) {
    const {
      title,
      description,
      url,
      image,
      type = 'website',
      author,
      publishedDate,
      modifiedDate
    } = data;

    const ogTags = {
      title: title || this.config.site.name,
      description: description || this.config.site.description,
      url: url || this.config.site.baseUrl,
      type,
      siteName: this.config.site.name,
      locale: this.config.site.locale,
      image: image || this.config.site.defaultImage
    };

    // Add article-specific tags
    if (type === 'article') {
      if (author) {
        ogTags.articleAuthor = author;
      }
      if (publishedDate) {
        ogTags.articlePublishedTime = new Date(publishedDate).toISOString();
      }
      if (modifiedDate) {
        ogTags.articleModifiedTime = new Date(modifiedDate).toISOString();
      }
      ogTags.articleSection = 'Restaurant Management';
      ogTags.articleTag = this.getDefaultKeywords(ContentType.BLOG_POST);
    }

    // Add image dimensions if available
    if (ogTags.image) {
      ogTags.imageWidth = 1200;
      ogTags.imageHeight = 630;
      ogTags.imageAlt = `${this.config.site.name} - ${title}`;
    }

    return ogTags;
  }

  /**
   * Generate Twitter Card tags
   * @param {Object} data - Twitter card data
   * @returns {TwitterCardTags} Twitter Card tags object
   */
  generateTwitterCardTags(data) {
    const { title, description, image, url } = data;

    return {
      card: image ? 'summary_large_image' : 'summary',
      site: this.config.site.twitterHandle,
      creator: this.config.site.twitterHandle,
      title: title || this.config.site.name,
      description: description || this.config.site.description,
      image: image || this.config.site.defaultImage,
      imageAlt: `${this.config.site.name} - ${title}`,
      url: url || this.config.site.baseUrl
    };
  }

  /**
   * Generate robots directive
   * @param {PageData} pageData - Page data
   * @returns {string} Robots directive
   */
  generateRobotsDirective(pageData) {
    const { noIndex = false, noFollow = false, noCache = false } = pageData;
    
    const directives = [];
    
    if (noIndex) {
      directives.push('noindex');
    } else {
      directives.push('index');
    }
    
    if (noFollow) {
      directives.push('nofollow');
    } else {
      directives.push('follow');
    }
    
    if (noCache) {
      directives.push('noarchive');
    }
    
    // Add additional directives
    directives.push('max-snippet:-1');
    directives.push('max-image-preview:large');
    directives.push('max-video-preview:-1');
    
    return directives.join(', ');
  }

  /**
   * Get default title for content type
   * @param {ContentType} type - Content type
   * @returns {string} Default title
   */
  getDefaultTitle(type) {
    const siteName = this.config.site.name;
    
    const defaultTitles = {
      [ContentType.HOMEPAGE]: `${siteName} - Restaurant Billing Software`,
      [ContentType.PRODUCT_PAGE]: `Restaurant Software Features - ${siteName}`,
      [ContentType.BLOG_POST]: `Restaurant Management Tips - ${siteName}`,
      [ContentType.LANDING_PAGE]: `Restaurant POS System - ${siteName}`,
      [ContentType.CATEGORY_PAGE]: `Restaurant Software Solutions - ${siteName}`
    };
    
    return defaultTitles[type] || `${siteName} - Restaurant Billing Software`;
  }

  /**
   * Get default description for content type
   * @param {ContentType} type - Content type
   * @returns {string} Default description
   */
  getDefaultDescription(type) {
    const baseDescription = this.config.site.description;
    
    const defaultDescriptions = {
      [ContentType.HOMEPAGE]: baseDescription,
      [ContentType.PRODUCT_PAGE]: 'Discover powerful restaurant management features including KOT system, GST billing, inventory management, and WhatsApp integration.',
      [ContentType.BLOG_POST]: 'Expert tips and insights for restaurant management, billing best practices, and industry trends to help grow your restaurant business.',
      [ContentType.LANDING_PAGE]: 'Complete restaurant POS system with billing, KOT management, inventory tracking, and customer management. Free trial available.',
      [ContentType.CATEGORY_PAGE]: 'Browse our comprehensive restaurant software solutions designed to streamline operations and increase profitability.'
    };
    
    return defaultDescriptions[type] || baseDescription;
  }

  /**
   * Get default keywords for content type
   * @param {ContentType} type - Content type
   * @returns {string[]} Default keywords array
   */
  getDefaultKeywords(type) {
    const baseKeywords = ['restaurant billing software', 'KOT system', 'restaurant management'];
    
    const typeKeywords = {
      [ContentType.HOMEPAGE]: ['restaurant POS', 'billing software India', 'restaurant software'],
      [ContentType.PRODUCT_PAGE]: ['restaurant features', 'POS system features', 'restaurant tools'],
      [ContentType.BLOG_POST]: ['restaurant tips', 'restaurant management', 'food business'],
      [ContentType.LANDING_PAGE]: ['restaurant POS system', 'billing solution', 'restaurant technology'],
      [ContentType.CATEGORY_PAGE]: ['restaurant solutions', 'restaurant software category', 'POS solutions']
    };
    
    return [...baseKeywords, ...(typeKeywords[type] || [])];
  }

  /**
   * Map content type to Open Graph type
   * @param {ContentType} contentType - Content type
   * @returns {string} Open Graph type
   */
  mapContentTypeToOGType(contentType) {
    const mapping = {
      [ContentType.HOMEPAGE]: 'website',
      [ContentType.PRODUCT_PAGE]: 'product',
      [ContentType.BLOG_POST]: 'article',
      [ContentType.LANDING_PAGE]: 'website',
      [ContentType.CATEGORY_PAGE]: 'website'
    };
    
    return mapping[contentType] || 'website';
  }

  /**
   * Generate SEO-friendly URL structure
   * @param {string} title - Page title
   * @param {string} category - Content category (optional)
   * @returns {string} SEO-friendly URL slug
   */
  generateSEOFriendlyURL(title, category = null) {
    let slug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

    // Limit slug length
    if (slug.length > 60) {
      slug = slug.substring(0, 60).replace(/-[^-]*$/, '');
    }

    // Add category prefix if provided
    if (category) {
      const categorySlug = category.toLowerCase().replace(/[^\w]/g, '-');
      slug = `${categorySlug}/${slug}`;
    }

    return slug;
  }

  /**
   * Validate URL structure
   * @param {string} url - URL to validate
   * @returns {Object} Validation result
   */
  validateURLStructure(url) {
    const issues = [];
    const recommendations = [];

    try {
      const urlObj = new URL(url);
      
      // Check URL length
      if (url.length > 100) {
        issues.push('URL is too long (over 100 characters)');
        recommendations.push('Shorten URL to under 100 characters');
      }

      // Check for underscores
      if (urlObj.pathname.includes('_')) {
        issues.push('URL contains underscores');
        recommendations.push('Replace underscores with hyphens in URL');
      }

      // Check for uppercase letters
      if (urlObj.pathname !== urlObj.pathname.toLowerCase()) {
        issues.push('URL contains uppercase letters');
        recommendations.push('Use lowercase letters in URL');
      }

      // Check for special characters
      const specialChars = /[^a-z0-9\-\/]/;
      if (specialChars.test(urlObj.pathname)) {
        issues.push('URL contains special characters');
        recommendations.push('Remove special characters from URL');
      }

      // Check depth (number of slashes)
      const depth = (urlObj.pathname.match(/\//g) || []).length - 1;
      if (depth > 3) {
        issues.push('URL is too deep (more than 3 levels)');
        recommendations.push('Reduce URL depth to 3 levels or less');
      }

      return {
        isValid: issues.length === 0,
        issues,
        recommendations,
        score: Math.max(0, 100 - (issues.length * 20))
      };

    } catch (error) {
      return {
        isValid: false,
        issues: ['Invalid URL format'],
        recommendations: ['Provide a valid URL'],
        score: 0
      };
    }
  }

  /**
   * Validate meta tags
   * @param {MetaTagSet} metaTags - Meta tags to validate
   * @returns {Object} Validation result
   */
  validateMetaTags(metaTags) {
    const issues = [];
    const warnings = [];
    
    // Validate title
    if (!metaTags.title) {
      issues.push('Title is required');
    } else if (metaTags.title.length > 60) {
      warnings.push('Title is longer than 60 characters');
    } else if (metaTags.title.length < 30) {
      warnings.push('Title is shorter than 30 characters');
    }
    
    // Validate description
    if (!metaTags.description) {
      issues.push('Description is required');
    } else if (metaTags.description.length > 155) {
      warnings.push('Description is longer than 155 characters');
    } else if (metaTags.description.length < 120) {
      warnings.push('Description is shorter than 120 characters');
    }
    
    // Validate keywords
    if (metaTags.keywords) {
      const keywordArray = metaTags.keywords.split(',').map(k => k.trim());
      if (keywordArray.length > 10) {
        warnings.push('Too many keywords (more than 10)');
      }
    }
    
    // Validate Open Graph
    if (metaTags.openGraph) {
      if (!metaTags.openGraph.image) {
        warnings.push('Open Graph image is missing');
      }
      if (!metaTags.openGraph.url) {
        issues.push('Open Graph URL is required');
      }
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      warnings,
      score: Math.max(0, 100 - (issues.length * 25) - (warnings.length * 10))
    };
  }
}

export default MetaTagOptimizer;