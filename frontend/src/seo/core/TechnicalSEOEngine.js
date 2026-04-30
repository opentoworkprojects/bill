/**
 * Technical SEO Engine
 * 
 * Core component for managing technical SEO aspects including
 * meta tag optimization, performance monitoring, and technical validation.
 * 
 * @requirements 4.1, 4.4, 4.5, 4.6, 4.7
 */

import SEOConfig from '../config/SEOConfig';
import MetaTagOptimizer from './MetaTagOptimizer';
import SchemaGenerator from './SchemaGenerator';
import { ContentType } from '../types';

class TechnicalSEOEngine {
  constructor(config = {}) {
    this.config = { ...SEOConfig, ...config };
    this.metaTagOptimizer = new MetaTagOptimizer(this.config);
    this.schemaGenerator = new SchemaGenerator(this.config);
  }

  /**
   * Optimize meta tags for a given page
   * @param {PageData} pageData - Page data object
   * @returns {MetaTagSet} Optimized meta tags
   */
  optimizeMetaTags(pageData) {
    return this.metaTagOptimizer.generateMetaTags(pageData);
  }

  /**
   * Generate structured data for a page
   * @param {ContentType} contentType - Type of content
   * @param {Object} data - Content data
   * @returns {JSONLDSchema} Generated schema markup
   */
  generateStructuredData(contentType, data) {
    return this.schemaGenerator.generateSchema(contentType, data);
  }

  /**
   * Validate site performance and technical SEO
   * @param {string} url - URL to validate
   * @returns {Promise<PerformanceReport>} Performance report
   */
  async validateSitePerformance(url = null) {
    const targetUrl = url || this.config.site.baseUrl;
    
    try {
      const report = {
        reportDate: new Date(),
        url: targetUrl,
        coreWebVitals: await this.measureCoreWebVitals(targetUrl),
        seoMetrics: await this.analyzeSEOMetrics(targetUrl),
        technicalIssues: await this.detectTechnicalIssues(targetUrl)
      };

      return report;
    } catch (error) {
      console.error('TechnicalSEOEngine: Performance validation failed:', error);
      return {
        reportDate: new Date(),
        url: targetUrl,
        error: error.message,
        coreWebVitals: null,
        seoMetrics: null,
        technicalIssues: []
      };
    }
  }

  /**
   * Measure Core Web Vitals using Performance API
   * @param {string} url - URL to measure
   * @returns {Promise<CoreWebVitals>} Core Web Vitals metrics
   */
  async measureCoreWebVitals(url) {
    // In a real implementation, this would use tools like Lighthouse API
    // For now, we'll simulate the measurement
    
    if (typeof window === 'undefined') {
      // Server-side or testing environment
      return {
        lcp: 0,
        fid: 0,
        cls: 0,
        fcp: 0,
        ttfb: 0,
        timestamp: new Date()
      };
    }

    try {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      
      const fcp = paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
      const ttfb = navigation?.responseStart - navigation?.requestStart || 0;

      // LCP and FID would need more sophisticated measurement
      // This is a simplified version for the infrastructure setup
      return {
        lcp: fcp + 500, // Estimated LCP
        fid: Math.random() * 100, // Simulated FID
        cls: Math.random() * 0.2, // Simulated CLS
        fcp: fcp,
        ttfb: ttfb,
        timestamp: new Date()
      };
    } catch (error) {
      console.warn('TechnicalSEOEngine: Core Web Vitals measurement failed:', error);
      return {
        lcp: 0,
        fid: 0,
        cls: 0,
        fcp: 0,
        ttfb: 0,
        timestamp: new Date(),
        error: error.message
      };
    }
  }

  /**
   * Analyze SEO metrics for a page
   * @param {string} url - URL to analyze
   * @returns {Promise<SEOMetrics>} SEO metrics
   */
  async analyzeSEOMetrics(url) {
    // This would integrate with analytics APIs in a real implementation
    return {
      organicTraffic: 0, // Would come from Google Analytics
      keywordRankings: 0, // Would come from rank tracking tools
      averagePosition: 0, // Would come from Search Console
      clickThroughRate: 0, // Would come from Search Console
      conversionRate: 0, // Would come from Analytics
      timestamp: new Date()
    };
  }

  /**
   * Detect technical SEO issues
   * @param {string} url - URL to check
   * @returns {Promise<TechnicalIssue[]>} Array of technical issues
   */
  async detectTechnicalIssues(url) {
    const issues = [];

    try {
      // Check if we're in browser environment
      if (typeof window === 'undefined') {
        return issues;
      }

      // Check for missing meta tags
      const metaIssues = this.checkMetaTags();
      issues.push(...metaIssues);

      // Check for missing structured data
      const schemaIssues = this.checkStructuredData();
      issues.push(...schemaIssues);

      // Check for canonical issues
      const canonicalIssues = this.checkCanonicalTags();
      issues.push(...canonicalIssues);

      // Check for image optimization
      const imageIssues = this.checkImageOptimization();
      issues.push(...imageIssues);

      return issues;
    } catch (error) {
      console.error('TechnicalSEOEngine: Issue detection failed:', error);
      return [{
        type: 'system_error',
        description: 'Failed to detect technical issues',
        severity: 'medium',
        pageUrl: url,
        recommendation: 'Check system logs for detailed error information'
      }];
    }
  }

  /**
   * Check meta tags for issues
   * @returns {TechnicalIssue[]} Meta tag issues
   */
  checkMetaTags() {
    const issues = [];
    
    try {
      // Check title tag
      const titleTag = document.querySelector('title');
      if (!titleTag || !titleTag.textContent.trim()) {
        issues.push({
          type: 'missing_title',
          description: 'Page is missing a title tag',
          severity: 'high',
          pageUrl: window.location.href,
          recommendation: 'Add a descriptive title tag (50-60 characters)'
        });
      } else if (titleTag.textContent.length > 60) {
        issues.push({
          type: 'long_title',
          description: 'Title tag is too long (over 60 characters)',
          severity: 'medium',
          pageUrl: window.location.href,
          recommendation: 'Shorten title tag to 50-60 characters'
        });
      }

      // Check meta description
      const metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc || !metaDesc.getAttribute('content')?.trim()) {
        issues.push({
          type: 'missing_description',
          description: 'Page is missing a meta description',
          severity: 'high',
          pageUrl: window.location.href,
          recommendation: 'Add a compelling meta description (150-155 characters)'
        });
      } else if (metaDesc.getAttribute('content').length > 155) {
        issues.push({
          type: 'long_description',
          description: 'Meta description is too long (over 155 characters)',
          severity: 'medium',
          pageUrl: window.location.href,
          recommendation: 'Shorten meta description to 150-155 characters'
        });
      }

      // Check for duplicate meta tags
      const titles = document.querySelectorAll('title');
      if (titles.length > 1) {
        issues.push({
          type: 'duplicate_title',
          description: 'Multiple title tags found on page',
          severity: 'high',
          pageUrl: window.location.href,
          recommendation: 'Remove duplicate title tags, keep only one'
        });
      }

    } catch (error) {
      console.warn('TechnicalSEOEngine: Meta tag check failed:', error);
    }

    return issues;
  }

  /**
   * Check structured data for issues
   * @returns {TechnicalIssue[]} Structured data issues
   */
  checkStructuredData() {
    const issues = [];
    
    try {
      const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
      
      if (jsonLdScripts.length === 0) {
        issues.push({
          type: 'missing_structured_data',
          description: 'Page is missing structured data markup',
          severity: 'medium',
          pageUrl: window.location.href,
          recommendation: 'Add relevant JSON-LD structured data for better search visibility'
        });
      } else {
        // Validate JSON-LD syntax
        jsonLdScripts.forEach((script, index) => {
          try {
            JSON.parse(script.textContent);
          } catch (parseError) {
            issues.push({
              type: 'invalid_structured_data',
              description: `Invalid JSON-LD syntax in script ${index + 1}`,
              severity: 'high',
              pageUrl: window.location.href,
              recommendation: 'Fix JSON-LD syntax errors'
            });
          }
        });
      }
    } catch (error) {
      console.warn('TechnicalSEOEngine: Structured data check failed:', error);
    }

    return issues;
  }

  /**
   * Check canonical tags for issues
   * @returns {TechnicalIssue[]} Canonical tag issues
   */
  checkCanonicalTags() {
    const issues = [];
    
    try {
      const canonicalTags = document.querySelectorAll('link[rel="canonical"]');
      
      if (canonicalTags.length === 0) {
        issues.push({
          type: 'missing_canonical',
          description: 'Page is missing a canonical tag',
          severity: 'medium',
          pageUrl: window.location.href,
          recommendation: 'Add a canonical tag to prevent duplicate content issues'
        });
      } else if (canonicalTags.length > 1) {
        issues.push({
          type: 'multiple_canonical',
          description: 'Multiple canonical tags found on page',
          severity: 'high',
          pageUrl: window.location.href,
          recommendation: 'Remove duplicate canonical tags, keep only one'
        });
      }
    } catch (error) {
      console.warn('TechnicalSEOEngine: Canonical tag check failed:', error);
    }

    return issues;
  }

  /**
   * Check image optimization
   * @returns {TechnicalIssue[]} Image optimization issues
   */
  checkImageOptimization() {
    const issues = [];
    
    try {
      const images = document.querySelectorAll('img');
      let missingAltCount = 0;
      
      images.forEach((img, index) => {
        if (!img.getAttribute('alt')) {
          missingAltCount++;
        }
      });

      if (missingAltCount > 0) {
        issues.push({
          type: 'missing_alt_text',
          description: `${missingAltCount} images are missing alt text`,
          severity: 'medium',
          pageUrl: window.location.href,
          recommendation: 'Add descriptive alt text to all images for accessibility and SEO'
        });
      }
    } catch (error) {
      console.warn('TechnicalSEOEngine: Image optimization check failed:', error);
    }

    return issues;
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
   * Update sitemaps
   * @returns {Promise<SitemapUpdateResult>} Sitemap update result
   */
  async updateSitemaps() {
    // This would be implemented by the SitemapManager
    // For now, return a placeholder result
    return {
      success: true,
      sitemapUrl: `${this.config.site.baseUrl}/sitemap.xml`,
      urlCount: 0,
      lastModified: new Date(),
      errors: []
    };
  }
}

export default TechnicalSEOEngine;