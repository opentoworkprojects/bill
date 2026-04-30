/**
 * Unit Tests for Meta Tag Optimizer
 * 
 * Basic unit tests to verify meta tag optimization functionality
 * before running property-based tests.
 * 
 * @requirements 1.5, 4.1
 */

import MetaTagOptimizer from '../core/MetaTagOptimizer';
import { ContentType } from '../types';

describe('MetaTagOptimizer', () => {
  let metaTagOptimizer;

  beforeEach(() => {
    metaTagOptimizer = new MetaTagOptimizer();
  });

  describe('Basic Meta Tag Generation', () => {
    test('should create MetaTagOptimizer instance', () => {
      expect(metaTagOptimizer).toBeInstanceOf(MetaTagOptimizer);
    });

    test('should generate complete meta tags for page data', () => {
      const pageData = {
        title: 'Restaurant Billing Software',
        description: 'Best restaurant billing software in India with KOT system',
        keywords: ['restaurant software', 'billing system', 'POS'],
        url: 'https://billbytekot.in/features',
        type: ContentType.PRODUCT_PAGE
      };

      const metaTags = metaTagOptimizer.generateMetaTags(pageData);

      expect(metaTags).toBeDefined();
      expect(metaTags.title).toBeDefined();
      expect(metaTags.description).toBeDefined();
      expect(metaTags.keywords).toBeDefined();
      expect(metaTags.canonical).toBeDefined();
      expect(metaTags.openGraph).toBeDefined();
      expect(metaTags.twitterCard).toBeDefined();
    });

    test('should optimize title length', () => {
      const longTitle = 'This is a very long title that exceeds the recommended 60 character limit for SEO optimization';
      
      const optimizedTitle = metaTagOptimizer.optimizeTitle(longTitle, ContentType.HOMEPAGE);

      expect(optimizedTitle.length).toBeLessThanOrEqual(60);
      expect(optimizedTitle).toContain('BillByteKOT');
    });

    test('should optimize description length', () => {
      const longDescription = 'This is a very long description that exceeds the recommended 155 character limit for meta descriptions in search engine optimization and should be truncated appropriately while maintaining readability and meaning for users and search engines.';
      
      const optimizedDescription = metaTagOptimizer.optimizeDescription(longDescription, ContentType.HOMEPAGE);

      expect(optimizedDescription.length).toBeLessThanOrEqual(155);
      expect(optimizedDescription).toMatch(/[.!?]$/); // Should end with punctuation
    });

    test('should generate canonical URL', () => {
      const testUrl = 'https://billbytekot.in/Features?utm_source=google&utm_medium=cpc';
      
      const canonicalUrl = metaTagOptimizer.generateCanonicalURL(testUrl);

      expect(canonicalUrl).toBe('https://billbytekot.in/features');
      expect(() => new URL(canonicalUrl)).not.toThrow();
    });
  });

  describe('Title Optimization', () => {
    test('should add site name to title', () => {
      const title = 'Restaurant Features';
      
      const optimizedTitle = metaTagOptimizer.optimizeTitle(title, ContentType.PRODUCT_PAGE);

      expect(optimizedTitle).toContain('BillByteKOT');
      expect(optimizedTitle).toContain('Restaurant Features');
    });

    test('should not duplicate site name', () => {
      const title = 'BillByteKOT Restaurant Software';
      
      const optimizedTitle = metaTagOptimizer.optimizeTitle(title, ContentType.HOMEPAGE);

      const billByteKOTCount = (optimizedTitle.match(/BillByteKOT/gi) || []).length;
      expect(billByteKOTCount).toBe(1);
    });

    test('should provide default title for empty input', () => {
      const optimizedTitle = metaTagOptimizer.optimizeTitle('', ContentType.HOMEPAGE);

      expect(optimizedTitle).toBeDefined();
      expect(optimizedTitle.length).toBeGreaterThan(0);
      expect(optimizedTitle).toContain('BillByteKOT');
    });
  });

  describe('Description Optimization', () => {
    test('should ensure proper punctuation', () => {
      const description = 'Restaurant billing software without punctuation';
      
      const optimizedDescription = metaTagOptimizer.optimizeDescription(description, ContentType.HOMEPAGE);

      expect(optimizedDescription).toMatch(/[.!?]$/);
    });

    test('should remove extra whitespace', () => {
      const description = 'Restaurant   billing    software   with   extra   spaces';
      
      const optimizedDescription = metaTagOptimizer.optimizeDescription(description, ContentType.HOMEPAGE);

      expect(optimizedDescription).not.toMatch(/\s{2,}/);
    });

    test('should provide default description for empty input', () => {
      const optimizedDescription = metaTagOptimizer.optimizeDescription('', ContentType.HOMEPAGE);

      expect(optimizedDescription).toBeDefined();
      expect(optimizedDescription.length).toBeGreaterThan(0);
      expect(optimizedDescription).toContain('restaurant');
    });
  });

  describe('Keyword Optimization', () => {
    test('should optimize keywords array', () => {
      const keywords = ['restaurant software', 'billing system', 'POS system'];
      
      const optimizedKeywords = metaTagOptimizer.optimizeKeywords(keywords, ContentType.PRODUCT_PAGE);

      expect(typeof optimizedKeywords).toBe('string');
      expect(optimizedKeywords).toContain('restaurant software');
      expect(optimizedKeywords).toContain('billing system');
    });

    test('should add default keywords', () => {
      const keywords = [];
      
      const optimizedKeywords = metaTagOptimizer.optimizeKeywords(keywords, ContentType.HOMEPAGE);

      expect(optimizedKeywords).toContain('restaurant');
      expect(optimizedKeywords).toContain('billing');
    });

    test('should limit number of keywords', () => {
      const manyKeywords = Array.from({ length: 20 }, (_, i) => `keyword${i}`);
      
      const optimizedKeywords = metaTagOptimizer.optimizeKeywords(manyKeywords, ContentType.HOMEPAGE);
      const keywordArray = optimizedKeywords.split(',').map(k => k.trim());

      expect(keywordArray.length).toBeLessThanOrEqual(10);
    });
  });

  describe('URL Processing', () => {
    test('should clean tracking parameters', () => {
      const urlWithTracking = 'https://billbytekot.in/page?utm_source=google&utm_medium=cpc&fbclid=123&gclid=456&normal_param=value';
      
      const canonicalUrl = metaTagOptimizer.generateCanonicalURL(urlWithTracking);

      expect(canonicalUrl).not.toContain('utm_source');
      expect(canonicalUrl).not.toContain('fbclid');
      expect(canonicalUrl).not.toContain('gclid');
      expect(canonicalUrl).toContain('normal_param=value');
    });

    test('should convert to lowercase', () => {
      const mixedCaseUrl = 'https://billbytekot.in/Features/Billing';
      
      const canonicalUrl = metaTagOptimizer.generateCanonicalURL(mixedCaseUrl);

      expect(canonicalUrl).toBe('https://billbytekot.in/features/billing');
    });

    test('should remove trailing slash', () => {
      const urlWithSlash = 'https://billbytekot.in/features/';
      
      const canonicalUrl = metaTagOptimizer.generateCanonicalURL(urlWithSlash);

      expect(canonicalUrl).toBe('https://billbytekot.in/features');
    });

    test('should keep root trailing slash', () => {
      const rootUrl = 'https://billbytekot.in/';
      
      const canonicalUrl = metaTagOptimizer.generateCanonicalURL(rootUrl);

      expect(canonicalUrl).toBe('https://billbytekot.in/');
    });
  });

  describe('Open Graph Tags', () => {
    test('should generate Open Graph tags', () => {
      const data = {
        title: 'Restaurant Software',
        description: 'Best restaurant billing software',
        url: 'https://billbytekot.in',
        image: 'https://billbytekot.in/og-image.jpg'
      };

      const ogTags = metaTagOptimizer.generateOpenGraphTags(data);

      expect(ogTags.title).toBe('Restaurant Software');
      expect(ogTags.description).toBe('Best restaurant billing software');
      expect(ogTags.url).toBe('https://billbytekot.in');
      expect(ogTags.image).toBe('https://billbytekot.in/og-image.jpg');
      expect(ogTags.siteName).toBe('BillByteKOT');
      expect(ogTags.type).toBe('website');
    });

    test('should generate article-specific OG tags', () => {
      const data = {
        title: 'Restaurant Tips',
        description: 'Tips for restaurant management',
        type: 'article',
        author: 'John Doe',
        publishedDate: '2024-01-01T10:00:00Z'
      };

      const ogTags = metaTagOptimizer.generateOpenGraphTags(data);

      expect(ogTags.type).toBe('article');
      expect(ogTags.articleAuthor).toBe('John Doe');
      expect(ogTags.articlePublishedTime).toBe('2024-01-01T10:00:00.000Z');
    });
  });

  describe('Twitter Card Tags', () => {
    test('should generate Twitter Card tags', () => {
      const data = {
        title: 'Restaurant Software',
        description: 'Best restaurant billing software',
        image: 'https://billbytekot.in/twitter-image.jpg',
        url: 'https://billbytekot.in'
      };

      const twitterTags = metaTagOptimizer.generateTwitterCardTags(data);

      expect(twitterTags.card).toBe('summary_large_image');
      expect(twitterTags.site).toBe('@billbytekot');
      expect(twitterTags.creator).toBe('@billbytekot');
      expect(twitterTags.title).toBe('Restaurant Software');
      expect(twitterTags.description).toBe('Best restaurant billing software');
      expect(twitterTags.image).toBe('https://billbytekot.in/twitter-image.jpg');
    });

    test('should use summary card when no image', () => {
      const data = {
        title: 'Restaurant Software',
        description: 'Best restaurant billing software'
      };

      const twitterTags = metaTagOptimizer.generateTwitterCardTags(data);

      expect(twitterTags.card).toBe('summary');
    });
  });

  describe('URL Structure Validation', () => {
    test('should validate good URL structure', () => {
      const goodUrl = 'https://billbytekot.in/restaurant-billing-software';
      
      const validation = metaTagOptimizer.validateURLStructure(goodUrl);

      expect(validation.isValid).toBe(true);
      expect(validation.issues).toHaveLength(0);
      expect(validation.score).toBeGreaterThan(80);
    });

    test('should detect URL issues', () => {
      const badUrl = 'https://billbytekot.in/Restaurant_Billing_Software/Very/Deep/URL/Structure/That/Is/Too/Deep';
      
      const validation = metaTagOptimizer.validateURLStructure(badUrl);

      expect(validation.isValid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
      expect(validation.score).toBeLessThan(100);
    });
  });

  describe('SEO-Friendly URL Generation', () => {
    test('should generate SEO-friendly URL slug', () => {
      const title = 'Restaurant Management Tips & Best Practices!';
      
      const slug = metaTagOptimizer.generateSEOFriendlyURL(title);

      expect(slug).toBe('restaurant-management-tips-best-practices');
      expect(slug).not.toMatch(/[^a-z0-9\-]/);
    });

    test('should handle category prefix', () => {
      const title = 'Billing Software Features';
      const category = 'Restaurant Software';
      
      const slug = metaTagOptimizer.generateSEOFriendlyURL(title, category);

      expect(slug).toContain('restaurant-software');
      expect(slug).toContain('billing-software-features');
    });

    test('should limit slug length', () => {
      const longTitle = 'This is a very long title that should be truncated to maintain reasonable URL length for SEO purposes and user experience';
      
      const slug = metaTagOptimizer.generateSEOFriendlyURL(longTitle);

      expect(slug.length).toBeLessThanOrEqual(60);
    });
  });

  describe('Meta Tag Validation', () => {
    test('should validate complete meta tags', () => {
      const metaTags = {
        title: 'Restaurant Software | BillByteKOT',
        description: 'Best restaurant billing software in India with KOT system, GST billing, and inventory management.',
        keywords: 'restaurant software, billing system, POS',
        openGraph: {
          title: 'Restaurant Software',
          description: 'Best restaurant billing software',
          url: 'https://billbytekot.in',
          image: 'https://billbytekot.in/og-image.jpg'
        }
      };

      const validation = metaTagOptimizer.validateMetaTags(metaTags);

      expect(validation.isValid).toBe(true);
      expect(validation.score).toBeGreaterThan(80);
    });

    test('should detect missing required fields', () => {
      const incompleteTags = {
        // Missing title and description
        keywords: 'restaurant software'
      };

      const validation = metaTagOptimizer.validateMetaTags(incompleteTags);

      expect(validation.isValid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
    });
  });

  describe('Content Type Defaults', () => {
    test('should provide appropriate defaults for each content type', () => {
      Object.values(ContentType).forEach(contentType => {
        const defaultTitle = metaTagOptimizer.getDefaultTitle(contentType);
        const defaultDescription = metaTagOptimizer.getDefaultDescription(contentType);
        const defaultKeywords = metaTagOptimizer.getDefaultKeywords(contentType);

        expect(defaultTitle).toBeDefined();
        expect(defaultTitle.length).toBeGreaterThan(0);
        expect(defaultTitle.length).toBeLessThanOrEqual(60);

        expect(defaultDescription).toBeDefined();
        expect(defaultDescription.length).toBeGreaterThan(0);
        expect(defaultDescription.length).toBeLessThanOrEqual(155);

        expect(Array.isArray(defaultKeywords)).toBe(true);
        expect(defaultKeywords.length).toBeGreaterThan(0);
      });
    });
  });
});