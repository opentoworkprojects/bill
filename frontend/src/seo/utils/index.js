/**
 * SEO Utilities
 * 
 * Common utility functions for the SEO Enhancement system.
 * Provides helper functions for URL manipulation, text processing,
 * and SEO-related calculations.
 * 
 * @requirements 4.1, 6.1
 */

/**
 * Slugify a string for URL use
 * @param {string} text - Text to slugify
 * @param {Object} options - Slugify options
 * @returns {string} URL-safe slug
 */
export const slugify = (text, options = {}) => {
  const {
    maxLength = 60,
    separator = '-',
    lowercase = true,
    strict = true
  } = options;

  if (!text || typeof text !== 'string') {
    return '';
  }

  let slug = text.trim();

  // Convert to lowercase if specified
  if (lowercase) {
    slug = slug.toLowerCase();
  }

  // Replace spaces and special characters
  if (strict) {
    slug = slug
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, separator) // Replace spaces with separator
      .replace(new RegExp(`${separator}+`, 'g'), separator) // Replace multiple separators
      .replace(new RegExp(`^${separator}|${separator}$`, 'g'), ''); // Remove leading/trailing separators
  } else {
    slug = slug
      .replace(/\s+/g, separator)
      .replace(new RegExp(`${separator}+`, 'g'), separator)
      .replace(new RegExp(`^${separator}|${separator}$`, 'g'), '');
  }

  // Limit length
  if (slug.length > maxLength) {
    slug = slug.substring(0, maxLength);
    // Avoid cutting words in half
    const lastSeparator = slug.lastIndexOf(separator);
    if (lastSeparator > maxLength * 0.8) {
      slug = slug.substring(0, lastSeparator);
    }
  }

  return slug;
};

/**
 * Extract keywords from text
 * @param {string} text - Text to analyze
 * @param {Object} options - Extraction options
 * @returns {Array} Array of extracted keywords
 */
export const extractKeywords = (text, options = {}) => {
  const {
    minLength = 3,
    maxLength = 50,
    maxKeywords = 20,
    stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'a', 'an']
  } = options;

  if (!text || typeof text !== 'string') {
    return [];
  }

  // Clean and split text
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => 
      word.length >= minLength && 
      word.length <= maxLength && 
      !stopWords.includes(word)
    );

  // Count word frequency
  const wordCount = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });

  // Sort by frequency and return top keywords
  return Object.entries(wordCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxKeywords)
    .map(([word]) => word);
};

/**
 * Calculate keyword density
 * @param {string} text - Text to analyze
 * @param {string} keyword - Keyword to check
 * @returns {number} Keyword density percentage
 */
export const calculateKeywordDensity = (text, keyword) => {
  if (!text || !keyword || typeof text !== 'string' || typeof keyword !== 'string') {
    return 0;
  }

  const cleanText = text.toLowerCase().replace(/[^\w\s]/g, ' ');
  const cleanKeyword = keyword.toLowerCase();
  const words = cleanText.split(/\s+/).filter(word => word.length > 0);
  const totalWords = words.length;

  if (totalWords === 0) {
    return 0;
  }

  // Count keyword occurrences (including partial matches in phrases)
  const keywordCount = cleanText.split(cleanKeyword).length - 1;
  
  return Math.round((keywordCount / totalWords) * 100 * 100) / 100; // Round to 2 decimal places
};

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {Object} Validation result
 */
export const validateURL = (url) => {
  const result = {
    isValid: false,
    protocol: null,
    domain: null,
    path: null,
    issues: []
  };

  if (!url || typeof url !== 'string') {
    result.issues.push('URL is required and must be a string');
    return result;
  }

  try {
    const urlObj = new URL(url);
    
    result.protocol = urlObj.protocol;
    result.domain = urlObj.hostname;
    result.path = urlObj.pathname;
    result.isValid = true;

    // Check for common issues
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      result.issues.push('URL should use HTTP or HTTPS protocol');
    }

    if (urlObj.hostname.length === 0) {
      result.issues.push('URL is missing domain name');
    }

    if (url.length > 2048) {
      result.issues.push('URL is too long (over 2048 characters)');
    }

    // Check for SEO-friendly characteristics
    if (urlObj.pathname.includes('_')) {
      result.issues.push('URL contains underscores (hyphens are preferred)');
    }

    if (urlObj.pathname !== urlObj.pathname.toLowerCase()) {
      result.issues.push('URL contains uppercase letters');
    }

    const depth = (urlObj.pathname.match(/\//g) || []).length - 1;
    if (depth > 4) {
      result.issues.push('URL is too deep (more than 4 levels)');
    }

  } catch (error) {
    result.issues.push('Invalid URL format');
  }

  return result;
};

/**
 * Clean and optimize text for SEO
 * @param {string} text - Text to clean
 * @param {Object} options - Cleaning options
 * @returns {string} Cleaned text
 */
export const cleanText = (text, options = {}) => {
  const {
    removeHtml = true,
    removeExtraSpaces = true,
    removeLineBreaks = true,
    maxLength = null
  } = options;

  if (!text || typeof text !== 'string') {
    return '';
  }

  let cleaned = text;

  // Remove HTML tags
  if (removeHtml) {
    cleaned = cleaned.replace(/<[^>]*>/g, '');
  }

  // Remove extra spaces
  if (removeExtraSpaces) {
    cleaned = cleaned.replace(/\s+/g, ' ');
  }

  // Remove line breaks
  if (removeLineBreaks) {
    cleaned = cleaned.replace(/[\r\n]+/g, ' ');
  }

  // Trim whitespace
  cleaned = cleaned.trim();

  // Limit length
  if (maxLength && cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength);
    // Avoid cutting words in half
    const lastSpace = cleaned.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.8) {
      cleaned = cleaned.substring(0, lastSpace);
    }
  }

  return cleaned;
};

/**
 * Generate meta description from content
 * @param {string} content - Content to extract description from
 * @param {Object} options - Generation options
 * @returns {string} Generated meta description
 */
export const generateMetaDescription = (content, options = {}) => {
  const {
    maxLength = 155,
    keywords = [],
    fallback = 'Quality content and information.'
  } = options;

  if (!content || typeof content !== 'string') {
    return fallback;
  }

  // Clean content
  let description = cleanText(content, { 
    removeHtml: true, 
    removeExtraSpaces: true, 
    removeLineBreaks: true 
  });

  // Try to find a sentence that includes keywords
  if (keywords.length > 0) {
    const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    for (const keyword of keywords) {
      const matchingSentence = sentences.find(sentence => 
        sentence.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (matchingSentence) {
        description = matchingSentence.trim();
        break;
      }
    }
  }

  // Limit length
  if (description.length > maxLength) {
    description = description.substring(0, maxLength - 3);
    const lastSpace = description.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.8) {
      description = description.substring(0, lastSpace);
    }
    description += '...';
  }

  // Ensure proper ending
  if (!/[.!?]$/.test(description)) {
    description += '.';
  }

  return description || fallback;
};

/**
 * Calculate reading time for content
 * @param {string} content - Content to analyze
 * @param {number} wordsPerMinute - Average reading speed
 * @returns {number} Reading time in minutes
 */
export const calculateReadingTime = (content, wordsPerMinute = 200) => {
  if (!content || typeof content !== 'string') {
    return 0;
  }

  const cleanContent = cleanText(content, { removeHtml: true });
  const wordCount = cleanContent.split(/\s+/).filter(word => word.length > 0).length;
  
  return Math.ceil(wordCount / wordsPerMinute);
};

/**
 * Generate breadcrumb data from URL path
 * @param {string} url - URL to generate breadcrumbs from
 * @param {Object} options - Generation options
 * @returns {Array} Breadcrumb data array
 */
export const generateBreadcrumbs = (url, options = {}) => {
  const {
    baseUrl = 'https://billbytekot.in',
    homeName = 'Home',
    titleCase = true
  } = options;

  const breadcrumbs = [];

  try {
    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split('/').filter(segment => segment.length > 0);

    // Add home breadcrumb
    breadcrumbs.push({
      name: homeName,
      url: baseUrl
    });

    // Add path segments
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += '/' + segment;
      
      let name = segment.replace(/-/g, ' ');
      if (titleCase) {
        name = name.replace(/\w\S*/g, (txt) => 
          txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
      }

      breadcrumbs.push({
        name,
        url: baseUrl + currentPath
      });
    });

    return breadcrumbs;

  } catch (error) {
    // Return just home breadcrumb if URL is invalid
    return [{
      name: homeName,
      url: baseUrl
    }];
  }
};

/**
 * Format date for schema markup
 * @param {Date|string} date - Date to format
 * @returns {string} ISO 8601 formatted date
 */
export const formatSchemaDate = (date) => {
  if (!date) {
    return new Date().toISOString();
  }

  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toISOString();
  } catch (error) {
    return new Date().toISOString();
  }
};

/**
 * Escape XML special characters
 * @param {string} str - String to escape
 * @returns {string} XML-safe string
 */
export const escapeXML = (str) => {
  if (!str || typeof str !== 'string') {
    return '';
  }

  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

/**
 * Generate hash for content caching
 * @param {string} content - Content to hash
 * @returns {string} Simple hash string
 */
export const generateContentHash = (content) => {
  if (!content || typeof content !== 'string') {
    return '0';
  }

  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
};

/**
 * Debounce function for performance optimization
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function for performance optimization
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};