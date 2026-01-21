/**
 * Sitemap Manager
 * 
 * Manages XML sitemap generation and maintenance for the website.
 * Handles dynamic content discovery and sitemap optimization.
 * 
 * @requirements 4.3
 */

import SEOConfig from '../config/SEOConfig';

class SitemapManager {
  constructor(config = {}) {
    this.config = { ...SEOConfig, ...config };
    this.sitemapCache = new Map();
    this.lastGenerated = null;
  }

  /**
   * Generate complete XML sitemap
   * @param {Object} options - Generation options
   * @returns {Promise<SitemapUpdateResult>} Sitemap generation result
   */
  async generateSitemap(options = {}) {
    try {
      const {
        includeImages = true,
        includeNews = false,
        maxUrls = 50000,
        changefreq = 'weekly',
        priority = 0.8
      } = options;

      // Discover all URLs
      const urls = await this.discoverUrls();
      
      // Filter and process URLs
      const processedUrls = this.processUrls(urls, { maxUrls, changefreq, priority });
      
      // Generate XML content
      const xmlContent = this.generateXMLContent(processedUrls, { includeImages, includeNews });
      
      // Generate sitemap index if needed
      const sitemapIndex = this.generateSitemapIndex(processedUrls);
      
      const result = {
        success: true,
        sitemapUrl: `${this.config.site.baseUrl}/sitemap.xml`,
        urlCount: processedUrls.length,
        lastModified: new Date(),
        xmlContent,
        sitemapIndex,
        errors: []
      };

      this.lastGenerated = new Date();
      this.sitemapCache.set('main', result);
      
      return result;

    } catch (error) {
      console.error('SitemapManager: Sitemap generation failed:', error);
      return {
        success: false,
        sitemapUrl: null,
        urlCount: 0,
        lastModified: new Date(),
        errors: [error.message]
      };
    }
  }

  /**
   * Discover all URLs in the website
   * @returns {Promise<Array>} Array of discovered URLs
   */
  async discoverUrls() {
    const urls = [];
    const baseUrl = this.config.site.baseUrl;

    try {
      // Static pages
      const staticPages = [
        { url: baseUrl, priority: 1.0, changefreq: 'daily' },
        { url: `${baseUrl}/features`, priority: 0.9, changefreq: 'weekly' },
        { url: `${baseUrl}/pricing`, priority: 0.9, changefreq: 'weekly' },
        { url: `${baseUrl}/download`, priority: 0.8, changefreq: 'weekly' },
        { url: `${baseUrl}/contact`, priority: 0.7, changefreq: 'monthly' },
        { url: `${baseUrl}/about`, priority: 0.6, changefreq: 'monthly' },
        { url: `${baseUrl}/help`, priority: 0.6, changefreq: 'weekly' },
        { url: `${baseUrl}/blog`, priority: 0.8, changefreq: 'daily' },
        { url: `${baseUrl}/privacy-policy`, priority: 0.3, changefreq: 'yearly' },
        { url: `${baseUrl}/terms-of-service`, priority: 0.3, changefreq: 'yearly' }
      ];

      urls.push(...staticPages);

      // Product/feature pages
      const productPages = [
        { url: `${baseUrl}/restaurant-billing-software`, priority: 0.9, changefreq: 'weekly' },
        { url: `${baseUrl}/kot-software`, priority: 0.9, changefreq: 'weekly' },
        { url: `${baseUrl}/pos-software`, priority: 0.9, changefreq: 'weekly' },
        { url: `${baseUrl}/restaurant-management-software`, priority: 0.8, changefreq: 'weekly' },
        { url: `${baseUrl}/inventory-management`, priority: 0.7, changefreq: 'weekly' },
        { url: `${baseUrl}/staff-management`, priority: 0.7, changefreq: 'weekly' },
        { url: `${baseUrl}/reports-analytics`, priority: 0.7, changefreq: 'weekly' }
      ];

      urls.push(...productPages);

      // Location-based pages
      const locationPages = this.generateLocationPages();
      urls.push(...locationPages);

      // Blog posts (would be dynamically loaded in real implementation)
      const blogPosts = await this.discoverBlogPosts();
      urls.push(...blogPosts);

      // Category pages
      const categoryPages = [
        { url: `${baseUrl}/solutions`, priority: 0.7, changefreq: 'weekly' },
        { url: `${baseUrl}/integrations`, priority: 0.6, changefreq: 'weekly' },
        { url: `${baseUrl}/resources`, priority: 0.6, changefreq: 'weekly' }
      ];

      urls.push(...categoryPages);

      return urls;

    } catch (error) {
      console.error('SitemapManager: URL discovery failed:', error);
      return urls; // Return what we have so far
    }
  }

  /**
   * Generate location-based pages
   * @returns {Array} Location page URLs
   */
  generateLocationPages() {
    const locationPages = [];
    const baseUrl = this.config.site.baseUrl;

    this.config.targetLocations.forEach(location => {
      const citySlug = location.city.toLowerCase().replace(/\s+/g, '-');
      const stateSlug = location.state.toLowerCase().replace(/\s+/g, '-');
      
      locationPages.push({
        url: `${baseUrl}/restaurant-software-${citySlug}`,
        priority: 0.6,
        changefreq: 'monthly',
        lastmod: new Date().toISOString()
      });

      locationPages.push({
        url: `${baseUrl}/pos-system-${citySlug}`,
        priority: 0.5,
        changefreq: 'monthly',
        lastmod: new Date().toISOString()
      });
    });

    return locationPages;
  }

  /**
   * Discover blog posts
   * @returns {Promise<Array>} Blog post URLs
   */
  async discoverBlogPosts() {
    const blogPosts = [];
    const baseUrl = this.config.site.baseUrl;

    try {
      // In a real implementation, this would query the CMS or database
      // For now, we'll generate some sample blog URLs
      const samplePosts = [
        {
          slug: 'restaurant-management-tips-2024',
          lastmod: '2024-01-15T10:00:00Z',
          priority: 0.6
        },
        {
          slug: 'gst-billing-guide-restaurants',
          lastmod: '2024-01-10T14:30:00Z',
          priority: 0.7
        },
        {
          slug: 'kot-system-benefits',
          lastmod: '2024-01-05T09:15:00Z',
          priority: 0.6
        },
        {
          slug: 'restaurant-inventory-management',
          lastmod: '2024-01-01T16:45:00Z',
          priority: 0.6
        }
      ];

      samplePosts.forEach(post => {
        blogPosts.push({
          url: `${baseUrl}/blog/${post.slug}`,
          priority: post.priority,
          changefreq: 'monthly',
          lastmod: post.lastmod
        });
      });

      return blogPosts;

    } catch (error) {
      console.error('SitemapManager: Blog post discovery failed:', error);
      return [];
    }
  }

  /**
   * Process and filter URLs
   * @param {Array} urls - Raw URLs
   * @param {Object} options - Processing options
   * @returns {Array} Processed URLs
   */
  processUrls(urls, options = {}) {
    const { maxUrls = 50000, changefreq = 'weekly', priority = 0.8 } = options;

    try {
      // Remove duplicates
      const uniqueUrls = urls.filter((url, index, self) => 
        index === self.findIndex(u => u.url === url.url)
      );

      // Sort by priority (highest first)
      uniqueUrls.sort((a, b) => (b.priority || 0) - (a.priority || 0));

      // Limit number of URLs
      const limitedUrls = uniqueUrls.slice(0, maxUrls);

      // Add default values
      return limitedUrls.map(url => ({
        url: url.url,
        lastmod: url.lastmod || new Date().toISOString(),
        changefreq: url.changefreq || changefreq,
        priority: url.priority || priority,
        images: url.images || []
      }));

    } catch (error) {
      console.error('SitemapManager: URL processing failed:', error);
      return urls.slice(0, maxUrls);
    }
  }

  /**
   * Generate XML content for sitemap
   * @param {Array} urls - Processed URLs
   * @param {Object} options - Generation options
   * @returns {string} XML content
   */
  generateXMLContent(urls, options = {}) {
    const { includeImages = true, includeNews = false } = options;

    try {
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"';
      
      if (includeImages) {
        xml += ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"';
      }
      
      if (includeNews) {
        xml += ' xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"';
      }
      
      xml += '>\n';

      urls.forEach(urlData => {
        xml += '  <url>\n';
        xml += `    <loc>${this.escapeXML(urlData.url)}</loc>\n`;
        xml += `    <lastmod>${urlData.lastmod}</lastmod>\n`;
        xml += `    <changefreq>${urlData.changefreq}</changefreq>\n`;
        xml += `    <priority>${urlData.priority}</priority>\n`;

        // Add image information if available
        if (includeImages && urlData.images && urlData.images.length > 0) {
          urlData.images.forEach(image => {
            xml += '    <image:image>\n';
            xml += `      <image:loc>${this.escapeXML(image.url)}</image:loc>\n`;
            if (image.caption) {
              xml += `      <image:caption>${this.escapeXML(image.caption)}</image:caption>\n`;
            }
            if (image.title) {
              xml += `      <image:title>${this.escapeXML(image.title)}</image:title>\n`;
            }
            xml += '    </image:image>\n';
          });
        }

        xml += '  </url>\n';
      });

      xml += '</urlset>';

      return xml;

    } catch (error) {
      console.error('SitemapManager: XML generation failed:', error);
      return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>';
    }
  }

  /**
   * Generate sitemap index for large sites
   * @param {Array} urls - All URLs
   * @returns {string} Sitemap index XML
   */
  generateSitemapIndex(urls) {
    if (urls.length <= 50000) {
      return null; // No need for index with small sitemaps
    }

    try {
      const baseUrl = this.config.site.baseUrl;
      const chunkSize = 50000;
      const chunks = Math.ceil(urls.length / chunkSize);

      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

      for (let i = 0; i < chunks; i++) {
        xml += '  <sitemap>\n';
        xml += `    <loc>${baseUrl}/sitemap-${i + 1}.xml</loc>\n`;
        xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
        xml += '  </sitemap>\n';
      }

      xml += '</sitemapindex>';

      return xml;

    } catch (error) {
      console.error('SitemapManager: Sitemap index generation failed:', error);
      return null;
    }
  }

  /**
   * Escape XML special characters
   * @param {string} str - String to escape
   * @returns {string} Escaped string
   */
  escapeXML(str) {
    if (!str) return '';
    
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Validate sitemap XML
   * @param {string} xml - XML content to validate
   * @returns {Object} Validation result
   */
  validateSitemap(xml) {
    const issues = [];
    const warnings = [];

    try {
      // Basic XML structure validation
      if (!xml.includes('<?xml version="1.0"')) {
        issues.push('Missing XML declaration');
      }

      if (!xml.includes('<urlset')) {
        issues.push('Missing urlset element');
      }

      // Count URLs
      const urlMatches = xml.match(/<url>/g);
      const urlCount = urlMatches ? urlMatches.length : 0;

      if (urlCount === 0) {
        issues.push('No URLs found in sitemap');
      } else if (urlCount > 50000) {
        warnings.push('Sitemap contains more than 50,000 URLs');
      }

      // Check file size (approximate)
      const sizeInBytes = new Blob([xml]).size;
      const sizeInMB = sizeInBytes / (1024 * 1024);

      if (sizeInMB > 50) {
        warnings.push('Sitemap file size exceeds 50MB');
      }

      // Validate URLs format
      const urlRegex = /<loc>(.*?)<\/loc>/g;
      let match;
      let invalidUrls = 0;

      while ((match = urlRegex.exec(xml)) !== null) {
        try {
          new URL(match[1]);
        } catch {
          invalidUrls++;
        }
      }

      if (invalidUrls > 0) {
        issues.push(`${invalidUrls} invalid URLs found`);
      }

      return {
        isValid: issues.length === 0,
        issues,
        warnings,
        urlCount,
        sizeInMB: Math.round(sizeInMB * 100) / 100,
        score: Math.max(0, 100 - (issues.length * 25) - (warnings.length * 10))
      };

    } catch (error) {
      return {
        isValid: false,
        issues: ['XML parsing failed'],
        warnings: [],
        urlCount: 0,
        sizeInMB: 0,
        score: 0,
        error: error.message
      };
    }
  }

  /**
   * Get cached sitemap
   * @param {string} type - Sitemap type
   * @returns {Object|null} Cached sitemap or null
   */
  getCachedSitemap(type = 'main') {
    return this.sitemapCache.get(type) || null;
  }

  /**
   * Clear sitemap cache
   */
  clearCache() {
    this.sitemapCache.clear();
    this.lastGenerated = null;
  }

  /**
   * Check if sitemap needs regeneration
   * @param {number} maxAgeHours - Maximum age in hours
   * @returns {boolean} Whether regeneration is needed
   */
  needsRegeneration(maxAgeHours = 24) {
    if (!this.lastGenerated) {
      return true;
    }

    const ageInHours = (Date.now() - this.lastGenerated.getTime()) / (1000 * 60 * 60);
    return ageInHours > maxAgeHours;
  }

  /**
   * Generate robots.txt content
   * @returns {string} Robots.txt content
   */
  generateRobotsTxt() {
    const baseUrl = this.config.site.baseUrl;
    
    let robotsTxt = 'User-agent: *\n';
    robotsTxt += 'Allow: /\n\n';
    
    // Disallow admin and private areas
    robotsTxt += 'Disallow: /admin/\n';
    robotsTxt += 'Disallow: /api/\n';
    robotsTxt += 'Disallow: /private/\n';
    robotsTxt += 'Disallow: /*?*\n'; // Disallow URLs with query parameters
    robotsTxt += 'Disallow: /search\n\n';
    
    // Sitemap location
    robotsTxt += `Sitemap: ${baseUrl}/sitemap.xml\n`;
    
    // Crawl delay for specific bots if needed
    robotsTxt += '\nUser-agent: Bingbot\n';
    robotsTxt += 'Crawl-delay: 1\n';
    
    return robotsTxt;
  }
}

export default SitemapManager;