/**
 * SEO Enhancement Types and Interfaces
 * 
 * TypeScript-style interfaces defined as JSDoc for JavaScript compatibility
 * These define the data models and interfaces for the SEO system.
 * 
 * @requirements 4.1, 6.1
 */

/**
 * @typedef {Object} Keyword
 * @property {string} term - The keyword term
 * @property {number} searchVolume - Monthly search volume
 * @property {number} difficulty - Keyword difficulty (1-100)
 * @property {SearchIntent} intent - Search intent type
 * @property {KeywordPriority} priority - Keyword priority level
 */

/**
 * @typedef {Object} Location
 * @property {string} city - City name
 * @property {string} state - State name
 * @property {string} country - Country code
 * @property {number} latitude - Latitude coordinate
 * @property {number} longitude - Longitude coordinate
 */

/**
 * @typedef {Object} ContentPlan
 * @property {string} id - Unique identifier
 * @property {string} title - Content title
 * @property {string} slug - URL slug
 * @property {Keyword[]} targetKeywords - Target keywords
 * @property {ContentCategory} category - Content category
 * @property {Date} scheduledDate - Scheduled publish date
 * @property {ContentStatus} status - Content status
 */

/**
 * @typedef {Object} SEOTargets
 * @property {number} organicTrafficGrowth - Target organic traffic growth %
 * @property {number} averagePosition - Target average keyword position
 * @property {number} keywordRankings - Target number of ranking keywords
 * @property {number} conversionRate - Target conversion rate %
 */

/**
 * @typedef {Object} SEOConfig
 * @property {Keyword[]} primaryKeywords - Primary target keywords
 * @property {Keyword[]} secondaryKeywords - Secondary target keywords
 * @property {Location[]} targetLocations - Target geographic locations
 * @property {string[]} competitorDomains - Competitor domain names
 * @property {ContentPlan[]} contentCalendar - Content planning calendar
 * @property {SEOTargets} performanceTargets - Performance targets
 */

/**
 * @typedef {Object} MetaTagSet
 * @property {string} title - Page title (max 60 chars)
 * @property {string} description - Meta description (max 155 chars)
 * @property {string[]} keywords - Meta keywords array
 * @property {OpenGraphTags} openGraph - Open Graph tags
 * @property {TwitterCardTags} twitterCard - Twitter Card tags
 */

/**
 * @typedef {Object} OpenGraphTags
 * @property {string} title - OG title
 * @property {string} description - OG description
 * @property {string} image - OG image URL
 * @property {string} url - OG URL
 * @property {string} type - OG type (website, article, product)
 * @property {string} siteName - OG site name
 */

/**
 * @typedef {Object} TwitterCardTags
 * @property {string} card - Twitter card type
 * @property {string} site - Twitter site handle
 * @property {string} creator - Twitter creator handle
 * @property {string} title - Twitter title
 * @property {string} description - Twitter description
 * @property {string} image - Twitter image URL
 */

/**
 * @typedef {Object} JSONLDSchema
 * @property {string} context - Schema context URL
 * @property {string} type - Schema type
 * @property {Object} data - Schema data object
 * @property {string} pageUrl - Associated page URL
 * @property {Date} lastUpdated - Last update timestamp
 */

/**
 * @typedef {Object} BlogPost
 * @property {string} id - Unique identifier
 * @property {string} title - Post title
 * @property {string} slug - URL slug
 * @property {string} content - Post content
 * @property {Keyword[]} targetKeywords - Target keywords
 * @property {InternalLink[]} internalLinks - Internal links
 * @property {Date} publishDate - Publish date
 * @property {ContentMetrics} seoMetrics - SEO performance metrics
 */

/**
 * @typedef {Object} ContentMetrics
 * @property {number} organicTraffic - Organic traffic count
 * @property {number} averagePosition - Average keyword position
 * @property {number} clickThroughRate - Click-through rate %
 * @property {EngagementData} engagementMetrics - User engagement data
 */

/**
 * @typedef {Object} EngagementData
 * @property {number} timeOnPage - Average time on page (seconds)
 * @property {number} bounceRate - Bounce rate %
 * @property {number} pageViews - Total page views
 * @property {number} socialShares - Social media shares count
 */

/**
 * @typedef {Object} InternalLink
 * @property {string} sourceUrl - Source page URL
 * @property {string} targetUrl - Target page URL
 * @property {string} anchorText - Link anchor text
 * @property {LinkType} linkType - Type of internal link
 * @property {number} relevanceScore - Relevance score (1-10)
 */

/**
 * @typedef {Object} SchemaMarkup
 * @property {SchemaType} type - Schema type
 * @property {string} context - Schema context
 * @property {Object} data - Schema data
 * @property {string} pageUrl - Associated page URL
 * @property {Date} lastUpdated - Last update date
 */

/**
 * @typedef {Object} PerformanceReport
 * @property {Date} reportDate - Report generation date
 * @property {CoreWebVitals} coreWebVitals - Core Web Vitals metrics
 * @property {SEOMetrics} seoMetrics - SEO performance metrics
 * @property {TechnicalIssue[]} technicalIssues - Technical SEO issues
 */

/**
 * @typedef {Object} CoreWebVitals
 * @property {number} lcp - Largest Contentful Paint (ms)
 * @property {number} fid - First Input Delay (ms)
 * @property {number} cls - Cumulative Layout Shift
 * @property {number} fcp - First Contentful Paint (ms)
 * @property {number} ttfb - Time to First Byte (ms)
 */

/**
 * @typedef {Object} SEOMetrics
 * @property {number} organicTraffic - Organic traffic count
 * @property {number} keywordRankings - Number of ranking keywords
 * @property {number} averagePosition - Average keyword position
 * @property {number} clickThroughRate - Average CTR %
 * @property {number} conversionRate - Conversion rate %
 */

/**
 * @typedef {Object} TechnicalIssue
 * @property {string} type - Issue type
 * @property {string} description - Issue description
 * @property {string} severity - Issue severity (low, medium, high, critical)
 * @property {string} pageUrl - Affected page URL
 * @property {string} recommendation - Fix recommendation
 */

/**
 * @typedef {Object} SitemapUpdateResult
 * @property {boolean} success - Update success status
 * @property {string} sitemapUrl - Generated sitemap URL
 * @property {number} urlCount - Number of URLs included
 * @property {Date} lastModified - Last modification date
 * @property {string[]} errors - Any errors encountered
 */

/**
 * @typedef {Object} PageData
 * @property {string} url - Page URL
 * @property {string} title - Page title
 * @property {string} description - Page description
 * @property {string} content - Page content
 * @property {Keyword[]} keywords - Target keywords
 * @property {string} type - Page type (home, product, blog, etc.)
 * @property {Date} lastModified - Last modification date
 */

// Enums as constants
export const SearchIntent = {
  INFORMATIONAL: 'informational',
  NAVIGATIONAL: 'navigational',
  TRANSACTIONAL: 'transactional',
  COMMERCIAL: 'commercial'
};

export const KeywordPriority = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

export const ContentCategory = {
  MANAGEMENT_TIPS: 'management_tips',
  BILLING_PRACTICES: 'billing_practices',
  INDUSTRY_TRENDS: 'industry_trends',
  SOFTWARE_TUTORIALS: 'software_tutorials'
};

export const ContentStatus = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
};

export const SchemaType = {
  SOFTWARE_APPLICATION: 'SoftwareApplication',
  ORGANIZATION: 'Organization',
  LOCAL_BUSINESS: 'LocalBusiness',
  PRODUCT: 'Product',
  ARTICLE: 'Article',
  FAQ_PAGE: 'FAQPage',
  BREADCRUMB_LIST: 'BreadcrumbList',
  SERVICE: 'Service',
  HOW_TO: 'HowTo',
  VIDEO_OBJECT: 'VideoObject',
  COURSE: 'Course',
  EVENT: 'Event'
};

export const LinkType = {
  CONTEXTUAL: 'contextual',
  NAVIGATIONAL: 'navigational',
  RELATED_CONTENT: 'related_content',
  CALL_TO_ACTION: 'call_to_action'
};

export const ContentType = {
  HOMEPAGE: 'homepage',
  PRODUCT_PAGE: 'product_page',
  BLOG_POST: 'blog_post',
  LANDING_PAGE: 'landing_page',
  CATEGORY_PAGE: 'category_page'
};