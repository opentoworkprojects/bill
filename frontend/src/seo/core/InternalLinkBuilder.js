/**
 * Internal Link Builder - Handles strategic internal linking and navigation
 * Implements Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

class InternalLinkBuilder {
  constructor() {
    this.siteStructure = this.initializeSiteStructure();
    this.anchorTextVariations = this.initializeAnchorTextVariations();
    this.contentHubs = this.initializeContentHubs();
  }

  /**
   * Initialize site structure for internal linking
   * @returns {Object} Site structure mapping
   */
  initializeSiteStructure() {
    return {
      homepage: {
        url: '/',
        title: 'BillByteKOT - Restaurant Billing Software',
        keywords: ['restaurant billing software', 'restaurant management', 'billbytekot'],
        priority: 1.0,
        type: 'homepage'
      },
      features: {
        billing: {
          url: '/features/billing',
          title: 'Restaurant Billing System',
          keywords: ['restaurant billing', 'billing software', 'invoice management'],
          priority: 0.9,
          type: 'feature'
        },
        pos: {
          url: '/features/pos',
          title: 'Restaurant POS System',
          keywords: ['restaurant pos', 'point of sale', 'pos system'],
          priority: 0.9,
          type: 'feature'
        },
        kot: {
          url: '/features/kot',
          title: 'Kitchen Order Ticket System',
          keywords: ['kot software', 'kitchen order ticket', 'kitchen management'],
          priority: 0.8,
          type: 'feature'
        },
        inventory: {
          url: '/features/inventory',
          title: 'Restaurant Inventory Management',
          keywords: ['inventory management', 'stock control', 'restaurant inventory'],
          priority: 0.8,
          type: 'feature'
        },
        staff: {
          url: '/features/staff',
          title: 'Restaurant Staff Management',
          keywords: ['staff management', 'employee management', 'restaurant staff'],
          priority: 0.7,
          type: 'feature'
        },
        reporting: {
          url: '/features/reporting',
          title: 'Restaurant Analytics & Reporting',
          keywords: ['restaurant analytics', 'reporting', 'business insights'],
          priority: 0.7,
          type: 'feature'
        }
      },
      pricing: {
        url: '/pricing',
        title: 'Restaurant Software Pricing Plans',
        keywords: ['restaurant software pricing', 'billing software cost', 'pricing plans'],
        priority: 0.8,
        type: 'commercial'
      },
      blog: {
        url: '/blog',
        title: 'Restaurant Management Blog',
        keywords: ['restaurant management tips', 'industry insights', 'restaurant blog'],
        priority: 0.6,
        type: 'content'
      },
      support: {
        gettingStarted: {
          url: '/getting-started',
          title: 'Getting Started with BillByteKOT',
          keywords: ['setup guide', 'getting started', 'installation'],
          priority: 0.7,
          type: 'support'
        },
        documentation: {
          url: '/documentation',
          title: 'Software Documentation',
          keywords: ['documentation', 'user manual', 'help guide'],
          priority: 0.6,
          type: 'support'
        },
        support: {
          url: '/support',
          title: 'Customer Support',
          keywords: ['customer support', 'help', 'technical support'],
          priority: 0.5,
          type: 'support'
        }
      }
    };
  }

  /**
   * Initialize anchor text variations for natural linking
   * @returns {Object} Anchor text variations by keyword
   */
  initializeAnchorTextVariations() {
    return {
      'restaurant billing software': [
        'restaurant billing software',
        'billing system for restaurants',
        'restaurant billing solution',
        'professional billing software',
        'restaurant invoice system'
      ],
      'restaurant pos system': [
        'restaurant POS system',
        'point of sale system',
        'POS solution for restaurants',
        'restaurant checkout system',
        'modern POS system'
      ],
      'kot software': [
        'KOT software',
        'kitchen order ticket system',
        'digital KOT solution',
        'kitchen order management',
        'KOT system for restaurants'
      ],
      'restaurant management': [
        'restaurant management software',
        'restaurant management system',
        'comprehensive restaurant solution',
        'restaurant operations software',
        'restaurant management platform'
      ],
      'inventory management': [
        'inventory management system',
        'restaurant inventory software',
        'stock management solution',
        'inventory control system',
        'restaurant stock management'
      ],
      'staff management': [
        'staff management system',
        'employee management software',
        'restaurant staff tools',
        'workforce management',
        'staff scheduling system'
      ]
    };
  }

  /**
   * Initialize content hubs for topic clustering
   * @returns {Object} Content hub structure
   */
  initializeContentHubs() {
    return {
      'restaurant-management': {
        title: 'Restaurant Management Hub',
        description: 'Complete guide to restaurant management best practices',
        pillarPage: '/blog/complete-restaurant-management-guide',
        supportingContent: [
          '/blog/restaurant-operations-optimization',
          '/blog/restaurant-staff-management-tips',
          '/blog/restaurant-inventory-best-practices',
          '/blog/restaurant-customer-service-excellence'
        ],
        relatedFeatures: ['/features/staff', '/features/inventory', '/features/reporting'],
        keywords: ['restaurant management', 'restaurant operations', 'restaurant best practices']
      },
      'billing-and-payments': {
        title: 'Restaurant Billing & Payments Hub',
        description: 'Everything about restaurant billing and payment processing',
        pillarPage: '/blog/complete-restaurant-billing-guide',
        supportingContent: [
          '/blog/restaurant-payment-processing-guide',
          '/blog/restaurant-tax-compliance',
          '/blog/restaurant-receipt-management',
          '/blog/restaurant-billing-best-practices'
        ],
        relatedFeatures: ['/features/billing', '/features/pos'],
        keywords: ['restaurant billing', 'payment processing', 'restaurant payments']
      },
      'kitchen-operations': {
        title: 'Kitchen Operations Hub',
        description: 'Optimize your kitchen operations and order management',
        pillarPage: '/blog/kitchen-operations-optimization-guide',
        supportingContent: [
          '/blog/kot-system-benefits',
          '/blog/kitchen-order-management',
          '/blog/restaurant-kitchen-efficiency',
          '/blog/digital-kitchen-solutions'
        ],
        relatedFeatures: ['/features/kot'],
        keywords: ['kitchen operations', 'kot system', 'kitchen management']
      },
      'restaurant-technology': {
        title: 'Restaurant Technology Hub',
        description: 'Latest trends and technologies in restaurant management',
        pillarPage: '/blog/restaurant-technology-trends-2024',
        supportingContent: [
          '/blog/restaurant-software-selection-guide',
          '/blog/restaurant-pos-system-comparison',
          '/blog/restaurant-automation-benefits',
          '/blog/future-of-restaurant-technology'
        ],
        relatedFeatures: ['/features', '/pricing'],
        keywords: ['restaurant technology', 'restaurant software', 'restaurant automation']
      }
    };
  }

  /**
   * Generate strategic internal links for content
   * @param {Object} content - Content data (page, blog post, etc.)
   * @returns {Array} Strategic internal link suggestions
   */
  generateStrategicInternalLinks(content) {
    const links = [];
    const contentText = (content.content || '').toLowerCase();
    const contentKeywords = content.keywords || content.targetKeywords || [];

    // Generate contextual links based on content analysis
    const contextualLinks = this.findContextualLinkOpportunities(contentText, content.type);
    links.push(...contextualLinks);

    // Generate keyword-based links
    const keywordLinks = this.generateKeywordBasedLinks(contentKeywords, content.url);
    links.push(...keywordLinks);

    // Generate hub-based links
    const hubLinks = this.generateContentHubLinks(content);
    links.push(...hubLinks);

    // Generate hierarchical navigation links
    const navigationLinks = this.generateNavigationLinks(content);
    links.push(...navigationLinks);

    // Prioritize and deduplicate links
    return this.prioritizeAndDeduplicateLinks(links, content);
  }

  /**
   * Find contextual link opportunities in content
   * @param {string} contentText - Content text (lowercase)
   * @param {string} contentType - Type of content
   * @returns {Array} Contextual link opportunities
   */
  findContextualLinkOpportunities(contentText, contentType) {
    const opportunities = [];
    
    // Define contextual patterns and their corresponding links
    const patterns = [
      {
        phrases: ['restaurant billing', 'billing system', 'invoice management'],
        target: this.siteStructure.features.billing,
        relevance: 0.9
      },
      {
        phrases: ['pos system', 'point of sale', 'checkout system'],
        target: this.siteStructure.features.pos,
        relevance: 0.9
      },
      {
        phrases: ['kot', 'kitchen order ticket', 'kitchen order'],
        target: this.siteStructure.features.kot,
        relevance: 0.8
      },
      {
        phrases: ['inventory management', 'stock control', 'inventory system'],
        target: this.siteStructure.features.inventory,
        relevance: 0.8
      },
      {
        phrases: ['staff management', 'employee management', 'workforce'],
        target: this.siteStructure.features.staff,
        relevance: 0.7
      },
      {
        phrases: ['analytics', 'reporting', 'business insights'],
        target: this.siteStructure.features.reporting,
        relevance: 0.7
      },
      {
        phrases: ['pricing', 'cost', 'plans', 'subscription'],
        target: this.siteStructure.pricing,
        relevance: 0.6
      },
      {
        phrases: ['getting started', 'setup', 'installation'],
        target: this.siteStructure.support.gettingStarted,
        relevance: 0.5
      }
    ];

    patterns.forEach(pattern => {
      const matchedPhrases = pattern.phrases.filter(phrase => 
        contentText.includes(phrase)
      );

      if (matchedPhrases.length > 0) {
        opportunities.push({
          url: pattern.target.url,
          title: pattern.target.title,
          anchorText: this.selectOptimalAnchorText(pattern.target.keywords, matchedPhrases[0]),
          relevance: pattern.relevance,
          type: 'contextual',
          matchedPhrase: matchedPhrases[0]
        });
      }
    });

    return opportunities;
  }

  /**
   * Generate keyword-based internal links
   * @param {Array} keywords - Content keywords
   * @param {string} currentUrl - Current page URL
   * @returns {Array} Keyword-based links
   */
  generateKeywordBasedLinks(keywords, currentUrl) {
    const links = [];
    
    keywords.forEach(keyword => {
      const keywordTerm = typeof keyword === 'string' ? keyword : keyword.term;
      const relatedPages = this.findRelatedPagesByKeyword(keywordTerm, currentUrl);
      
      relatedPages.forEach(page => {
        links.push({
          url: page.url,
          title: page.title,
          anchorText: this.selectOptimalAnchorText(page.keywords, keywordTerm),
          relevance: this.calculateKeywordRelevance(keywordTerm, page.keywords),
          type: 'keyword-based',
          targetKeyword: keywordTerm
        });
      });
    });

    return links;
  }

  /**
   * Find related pages by keyword matching
   * @param {string} keyword - Target keyword
   * @param {string} currentUrl - Current page URL to exclude
   * @returns {Array} Related pages
   */
  findRelatedPagesByKeyword(keyword, currentUrl) {
    const relatedPages = [];
    const keywordLower = keyword.toLowerCase();

    // Search through all site structure
    this.traverseSiteStructure(this.siteStructure, (page) => {
      if (page.url === currentUrl) return; // Skip current page

      const isRelated = page.keywords.some(pageKeyword => 
        this.calculateKeywordSimilarity(keywordLower, pageKeyword.toLowerCase()) > 0.3
      );

      if (isRelated) {
        relatedPages.push(page);
      }
    });

    return relatedPages.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Traverse site structure recursively
   * @param {Object} structure - Site structure object
   * @param {Function} callback - Callback function for each page
   */
  traverseSiteStructure(structure, callback) {
    Object.values(structure).forEach(item => {
      if (item.url && item.title) {
        callback(item);
      } else if (typeof item === 'object') {
        this.traverseSiteStructure(item, callback);
      }
    });
  }

  /**
   * Calculate keyword similarity score
   * @param {string} keyword1 - First keyword
   * @param {string} keyword2 - Second keyword
   * @returns {number} Similarity score (0-1)
   */
  calculateKeywordSimilarity(keyword1, keyword2) {
    const words1 = keyword1.split(/\s+/);
    const words2 = keyword2.split(/\s+/);
    
    let matchCount = 0;
    words1.forEach(word1 => {
      words2.forEach(word2 => {
        if (word1.includes(word2) || word2.includes(word1)) {
          matchCount++;
        }
      });
    });

    return matchCount / Math.max(words1.length, words2.length);
  }

  /**
   * Generate content hub links
   * @param {Object} content - Content data
   * @returns {Array} Content hub links
   */
  generateContentHubLinks(content) {
    const links = [];
    const contentKeywords = content.keywords || content.targetKeywords || [];
    
    Object.entries(this.contentHubs).forEach(([hubKey, hub]) => {
      const relevance = this.calculateHubRelevance(contentKeywords, hub.keywords);
      
      if (relevance > 0.3) {
        // Link to pillar page
        links.push({
          url: hub.pillarPage,
          title: hub.title,
          anchorText: hub.title,
          relevance: relevance,
          type: 'hub-pillar',
          hubKey: hubKey
        });

        // Link to related features
        hub.relatedFeatures.forEach(featureUrl => {
          const feature = this.findPageByUrl(featureUrl);
          if (feature) {
            links.push({
              url: feature.url,
              title: feature.title,
              anchorText: this.selectOptimalAnchorText(feature.keywords),
              relevance: relevance * 0.8,
              type: 'hub-feature',
              hubKey: hubKey
            });
          }
        });
      }
    });

    return links;
  }

  /**
   * Calculate hub relevance to content
   * @param {Array} contentKeywords - Content keywords
   * @param {Array} hubKeywords - Hub keywords
   * @returns {number} Relevance score (0-1)
   */
  calculateHubRelevance(contentKeywords, hubKeywords) {
    if (!contentKeywords.length || !hubKeywords.length) return 0;

    let totalRelevance = 0;
    let keywordCount = 0;

    contentKeywords.forEach(contentKeyword => {
      const keywordTerm = typeof contentKeyword === 'string' ? contentKeyword : contentKeyword.term;
      
      hubKeywords.forEach(hubKeyword => {
        const similarity = this.calculateKeywordSimilarity(
          keywordTerm.toLowerCase(), 
          hubKeyword.toLowerCase()
        );
        totalRelevance += similarity;
        keywordCount++;
      });
    });

    return keywordCount > 0 ? totalRelevance / keywordCount : 0;
  }

  /**
   * Find page by URL in site structure
   * @param {string} url - Target URL
   * @returns {Object|null} Page object or null
   */
  findPageByUrl(url) {
    let foundPage = null;
    
    this.traverseSiteStructure(this.siteStructure, (page) => {
      if (page.url === url) {
        foundPage = page;
      }
    });

    return foundPage;
  }

  /**
   * Generate navigation links (breadcrumbs, related pages)
   * @param {Object} content - Content data
   * @returns {Array} Navigation links
   */
  generateNavigationLinks(content) {
    const links = [];
    
    // Generate breadcrumb links
    const breadcrumbs = this.generateBreadcrumbs(content.url);
    links.push(...breadcrumbs);

    // Generate related page links based on content type
    const relatedPages = this.generateRelatedPageLinks(content);
    links.push(...relatedPages);

    return links;
  }

  /**
   * Generate breadcrumb navigation
   * @param {string} url - Current page URL
   * @returns {Array} Breadcrumb links
   */
  generateBreadcrumbs(url) {
    const breadcrumbs = [];
    
    if (!url || url === '/') return breadcrumbs;

    // Always include homepage
    breadcrumbs.push({
      url: '/',
      title: 'Home',
      anchorText: 'Home',
      relevance: 0.3,
      type: 'breadcrumb',
      level: 0
    });

    // Parse URL path
    const pathSegments = url.split('/').filter(segment => segment.length > 0);
    let currentPath = '';

    pathSegments.forEach((segment, index) => {
      currentPath += '/' + segment;
      
      // Skip the last segment (current page)
      if (index === pathSegments.length - 1) return;

      const page = this.findPageByUrl(currentPath);
      if (page) {
        breadcrumbs.push({
          url: page.url,
          title: page.title,
          anchorText: page.title,
          relevance: 0.4,
          type: 'breadcrumb',
          level: index + 1
        });
      }
    });

    return breadcrumbs;
  }

  /**
   * Generate related page links based on content type
   * @param {Object} content - Content data
   * @returns {Array} Related page links
   */
  generateRelatedPageLinks(content) {
    const links = [];
    const contentType = content.type || 'page';

    switch (contentType) {
      case 'blog':
        // For blog posts, link to related features and other blog posts
        links.push(...this.generateBlogRelatedLinks(content));
        break;
      case 'feature':
        // For feature pages, link to related features and pricing
        links.push(...this.generateFeatureRelatedLinks(content));
        break;
      case 'support':
        // For support pages, link to related documentation and features
        links.push(...this.generateSupportRelatedLinks(content));
        break;
    }

    return links;
  }

  /**
   * Generate blog-related links
   * @param {Object} content - Blog content
   * @returns {Array} Blog-related links
   */
  generateBlogRelatedLinks(content) {
    const links = [];
    
    // Link to main blog page
    links.push({
      url: '/blog',
      title: 'Restaurant Management Blog',
      anchorText: 'restaurant management blog',
      relevance: 0.5,
      type: 'blog-navigation'
    });

    // Link to relevant features based on blog category
    const category = content.category;
    if (category) {
      const relatedFeatures = this.getRelatedFeaturesByCategory(category);
      links.push(...relatedFeatures);
    }

    return links;
  }

  /**
   * Get related features by blog category
   * @param {string} category - Blog category
   * @returns {Array} Related feature links
   */
  getRelatedFeaturesByCategory(category) {
    const categoryFeatureMap = {
      'restaurant-management-tips': ['staff', 'inventory', 'reporting'],
      'billing-best-practices': ['billing', 'pos'],
      'industry-trends': ['features'],
      'software-tutorials': ['kot', 'billing', 'pos']
    };

    const relatedFeatureKeys = categoryFeatureMap[category] || [];
    const links = [];

    relatedFeatureKeys.forEach(featureKey => {
      const feature = this.siteStructure.features[featureKey];
      if (feature) {
        links.push({
          url: feature.url,
          title: feature.title,
          anchorText: this.selectOptimalAnchorText(feature.keywords),
          relevance: 0.7,
          type: 'category-feature'
        });
      }
    });

    return links;
  }

  /**
   * Generate feature-related links
   * @param {Object} content - Feature content
   * @returns {Array} Feature-related links
   */
  generateFeatureRelatedLinks(content) {
    const links = [];
    
    // Link to pricing page
    links.push({
      url: '/pricing',
      title: 'Restaurant Software Pricing Plans',
      anchorText: 'view pricing plans',
      relevance: 0.8,
      type: 'feature-pricing'
    });

    // Link to getting started
    links.push({
      url: '/getting-started',
      title: 'Getting Started with BillByteKOT',
      anchorText: 'getting started guide',
      relevance: 0.6,
      type: 'feature-support'
    });

    return links;
  }

  /**
   * Generate support-related links
   * @param {Object} content - Support content
   * @returns {Array} Support-related links
   */
  generateSupportRelatedLinks(content) {
    const links = [];
    
    // Link to main features page
    links.push({
      url: '/features',
      title: 'Restaurant Software Features',
      anchorText: 'explore all features',
      relevance: 0.6,
      type: 'support-features'
    });

    // Link to documentation
    if (content.url !== '/documentation') {
      links.push({
        url: '/documentation',
        title: 'Software Documentation',
        anchorText: 'complete documentation',
        relevance: 0.5,
        type: 'support-docs'
      });
    }

    return links;
  }

  /**
   * Select optimal anchor text for a link
   * @param {Array} targetKeywords - Target page keywords
   * @param {string} contextKeyword - Context keyword (optional)
   * @returns {string} Optimal anchor text
   */
  selectOptimalAnchorText(targetKeywords, contextKeyword = null) {
    if (!targetKeywords || targetKeywords.length === 0) {
      return 'learn more';
    }

    const primaryKeyword = targetKeywords[0];
    
    // If context keyword is provided, try to find variations
    if (contextKeyword) {
      const variations = this.anchorTextVariations[contextKeyword.toLowerCase()];
      if (variations && variations.length > 0) {
        // Select a variation that's not the exact match to avoid over-optimization
        const nonExactVariations = variations.filter(v => 
          v.toLowerCase() !== contextKeyword.toLowerCase()
        );
        if (nonExactVariations.length > 0) {
          return nonExactVariations[0];
        }
      }
    }

    // Use variations for primary keyword if available
    const variations = this.anchorTextVariations[primaryKeyword.toLowerCase()];
    if (variations && variations.length > 0) {
      return variations[Math.floor(Math.random() * variations.length)];
    }

    return primaryKeyword;
  }

  /**
   * Calculate keyword relevance score
   * @param {string} sourceKeyword - Source keyword
   * @param {Array} targetKeywords - Target keywords
   * @returns {number} Relevance score (0-1)
   */
  calculateKeywordRelevance(sourceKeyword, targetKeywords) {
    if (!targetKeywords || targetKeywords.length === 0) return 0;

    let maxRelevance = 0;
    targetKeywords.forEach(targetKeyword => {
      const similarity = this.calculateKeywordSimilarity(
        sourceKeyword.toLowerCase(),
        targetKeyword.toLowerCase()
      );
      maxRelevance = Math.max(maxRelevance, similarity);
    });

    return maxRelevance;
  }

  /**
   * Prioritize and deduplicate links
   * @param {Array} links - All generated links
   * @param {Object} content - Source content
   * @returns {Array} Prioritized and deduplicated links
   */
  prioritizeAndDeduplicateLinks(links, content) {
    // Remove duplicates by URL
    const uniqueLinks = links.filter((link, index, self) => 
      index === self.findIndex(l => l.url === link.url)
    );

    // Sort by relevance and type priority
    const typePriority = {
      'contextual': 1.0,
      'keyword-based': 0.9,
      'hub-pillar': 0.8,
      'hub-feature': 0.7,
      'category-feature': 0.7,
      'feature-pricing': 0.6,
      'breadcrumb': 0.5,
      'blog-navigation': 0.4,
      'support-features': 0.3,
      'support-docs': 0.2
    };

    uniqueLinks.forEach(link => {
      const typeMultiplier = typePriority[link.type] || 0.5;
      link.finalScore = link.relevance * typeMultiplier;
    });

    // Sort by final score and return top links
    return uniqueLinks
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, 8); // Limit to top 8 internal links
  }

  /**
   * Generate breadcrumb navigation structure
   * @param {string} currentUrl - Current page URL
   * @returns {Object} Breadcrumb navigation structure
   */
  generateBreadcrumbNavigation(currentUrl) {
    const breadcrumbs = this.generateBreadcrumbs(currentUrl);
    
    return {
      items: breadcrumbs,
      jsonLd: this.generateBreadcrumbJsonLd(breadcrumbs, currentUrl),
      html: this.generateBreadcrumbHtml(breadcrumbs)
    };
  }

  /**
   * Generate JSON-LD for breadcrumb navigation
   * @param {Array} breadcrumbs - Breadcrumb items
   * @param {string} currentUrl - Current page URL
   * @returns {Object} JSON-LD breadcrumb schema
   */
  generateBreadcrumbJsonLd(breadcrumbs, currentUrl) {
    const items = breadcrumbs.map((breadcrumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": breadcrumb.title,
      "item": `https://billbytekot.com${breadcrumb.url}`
    }));

    // Add current page as final item
    const currentPage = this.findPageByUrl(currentUrl);
    if (currentPage) {
      items.push({
        "@type": "ListItem",
        "position": items.length + 1,
        "name": currentPage.title,
        "item": `https://billbytekot.com${currentUrl}`
      });
    }

    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": items
    };
  }

  /**
   * Generate HTML for breadcrumb navigation
   * @param {Array} breadcrumbs - Breadcrumb items
   * @returns {string} HTML breadcrumb navigation
   */
  generateBreadcrumbHtml(breadcrumbs) {
    if (breadcrumbs.length === 0) return '';

    const items = breadcrumbs.map(breadcrumb => 
      `<li><a href="${breadcrumb.url}">${breadcrumb.title}</a></li>`
    ).join('');

    return `
      <nav aria-label="Breadcrumb" class="breadcrumb-navigation">
        <ol class="breadcrumb-list">
          ${items}
        </ol>
      </nav>
    `;
  }

  /**
   * Optimize anchor text to avoid over-optimization
   * @param {Array} existingLinks - Existing links on the page
   * @param {Object} newLink - New link to optimize
   * @returns {Object} Optimized link
   */
  optimizeAnchorText(existingLinks, newLink) {
    const existingAnchors = existingLinks.map(link => link.anchorText.toLowerCase());
    
    // If anchor text is already used, find an alternative
    if (existingAnchors.includes(newLink.anchorText.toLowerCase())) {
      const targetKeywords = newLink.targetKeywords || [];
      if (targetKeywords.length > 0) {
        const variations = this.anchorTextVariations[targetKeywords[0].toLowerCase()];
        if (variations) {
          // Find unused variation
          const unusedVariation = variations.find(variation => 
            !existingAnchors.includes(variation.toLowerCase())
          );
          if (unusedVariation) {
            newLink.anchorText = unusedVariation;
          }
        }
      }
    }

    return newLink;
  }
}

export default InternalLinkBuilder;