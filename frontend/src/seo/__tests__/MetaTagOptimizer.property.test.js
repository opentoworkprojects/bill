/**
 * Property-Based Tests for Meta Tag Optimizer
 * 
 * Tests universal properties of meta tag optimization using fast-check
 * to ensure correctness across all possible inputs.
 * 
 * **Feature: seo-enhancement-comprehensive, Property 2: Meta Tag Optimization Consistency**
 * **Validates: Requirements 1.5, 4.1**
 */

import fc from 'fast-check';
import MetaTagOptimizer from '../core/MetaTagOptimizer';
import { ContentType } from '../types';
import { generators, assertions, testConfig, cleanup } from './setup';

describe('MetaTagOptimizer Property Tests', () => {
  let metaTagOptimizer;

  beforeEach(() => {
    metaTagOptimizer = new MetaTagOptimizer();
  });

  afterEach(() => {
    cleanup();
  });

  /**
   * Property 2: Meta Tag Optimization Consistency
   * For any page on the site, the Technical_SEO_Engine should generate optimized 
   * title tags and meta descriptions that include relevant restaurant software keywords 
   * and follow SEO best practices for length and format
   */
  describe('Property 2: Meta Tag Optimization Consistency', () => {
    test('should generate valid meta tags for any page data', () => {
      fc.assert(
        fc.property(
          generators.pageData(),
          (pageData) => {
            const metaTags = metaTagOptimizer.generateMetaTags(pageData);
            
            // Assert basic meta tag structure
            assertions.validMetaTags(metaTags);
            
            // Verify title optimization
            expect(metaTags.title).toBeDefined();
            expect(typeof metaTags.title).toBe('string');
            expect(metaTags.title.length).toBeGreaterThan(0);
            expect(metaTags.title.length).toBeLessThanOrEqual(60);
            
            // Verify description optimization
            expect(metaTags.description).toBeDefined();
            expect(typeof metaTags.description).toBe('string');
            expect(metaTags.description.length).toBeGreaterThan(0);
            expect(metaTags.description.length).toBeLessThanOrEqual(155);
            
            // Verify canonical URL
            expect(metaTags.canonical).toBeDefined();
            expect(typeof metaTags.canonical).toBe('string');
            expect(() => new URL(metaTags.canonical)).not.toThrow();
            
            // Verify Open Graph tags
            expect(metaTags.openGraph).toBeDefined();
            expect(metaTags.openGraph.title).toBeDefined();
            expect(metaTags.openGraph.description).toBeDefined();
            expect(metaTags.openGraph.url).toBeDefined();
            
            // Verify Twitter Card tags
            expect(metaTags.twitterCard).toBeDefined();
            expect(metaTags.twitterCard.title).toBeDefined();
            expect(metaTags.twitterCard.description).toBeDefined();
          }
        ),
        { 
          numRuns: testConfig.propertyTests.numRuns,
          seed: testConfig.propertyTests.seed,
          timeout: testConfig.propertyTests.timeout
        }
      );
    });

    test('should optimize title length consistently', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 200 }), // Test with various title lengths
          fc.constantFrom(...Object.values(ContentType)),
          (title, contentType) => {
            const optimizedTitle = metaTagOptimizer.optimizeTitle(title, contentType);
            
            // Title should never exceed 60 characters
            expect(optimizedTitle.length).toBeLessThanOrEqual(60);
            
            // Title should not be empty
            expect(optimizedTitle.length).toBeGreaterThan(0);
            
            // Title should include site name (BillByteKOT)
            expect(optimizedTitle.toLowerCase()).toContain('billbytekot');
            
            // If original title was short enough, it should be preserved (with site name)
            if (title.trim().length <= 40) {
              expect(optimizedTitle.toLowerCase()).toContain(title.trim().toLowerCase());
            }
          }
        ),
        { numRuns: testConfig.propertyTests.numRuns }
      );
    });

    test('should optimize description length consistently', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 500 }), // Test with various description lengths
          fc.constantFrom(...Object.values(ContentType)),
          (description, contentType) => {
            const optimizedDescription = metaTagOptimizer.optimizeDescription(description, contentType);
            
            // Description should never exceed 155 characters
            expect(optimizedDescription.length).toBeLessThanOrEqual(155);
            
            // Description should not be empty
            expect(optimizedDescription.length).toBeGreaterThan(0);
            
            // Description should end with proper punctuation
            expect(optimizedDescription).toMatch(/[.!?]$/);
            
            // If original description was short enough, it should be preserved
            if (description.trim().length <= 155) {
              expect(optimizedDescription).toContain(description.trim().substring(0, 100));
            }
          }
        ),
        { numRuns: testConfig.propertyTests.numRuns }
      );
    });

    test('should generate valid canonical URLs', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            generators.validUrl(),
            fc.constant(null),
            fc.constant(undefined),
            fc.string() // Invalid URL strings
          ),
          (inputUrl) => {
            const canonicalUrl = metaTagOptimizer.generateCanonicalURL(inputUrl);
            
            // Should always return a valid URL
            expect(() => new URL(canonicalUrl)).not.toThrow();
            
            // Should be lowercase
            const urlObj = new URL(canonicalUrl);
            expect(urlObj.pathname).toBe(urlObj.pathname.toLowerCase());
            
            // Should not have trailing slash (except root)
            if (urlObj.pathname.length > 1) {
              expect(urlObj.pathname).not.toMatch(/\/$/);
            }
            
            // Should not contain tracking parameters
            const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'fbclid', 'gclid'];
            trackingParams.forEach(param => {
              expect(urlObj.searchParams.has(param)).toBe(false);
            });
          }
        ),
        { numRuns: testConfig.propertyTests.numRuns }
      );
    });

    test('should include restaurant software keywords', () => {
      fc.assert(
        fc.property(
          generators.pageData(),
          (pageData) => {
            const metaTags = metaTagOptimizer.generateMetaTags(pageData);
            
            // Keywords should be present in title, description, or keywords field
            const allText = `${metaTags.title} ${metaTags.description} ${metaTags.keywords}`.toLowerCase();
            
            // Should contain at least one restaurant-related keyword
            const restaurantKeywords = [
              'restaurant', 'billing', 'pos', 'kot', 'management', 'software', 'billbytekot'
            ];
            
            const hasRestaurantKeyword = restaurantKeywords.some(keyword => 
              allText.includes(keyword)
            );
            
            expect(hasRestaurantKeyword).toBe(true);
          }
        ),
        { numRuns: testConfig.propertyTests.numRuns }
      );
    });

    test('should generate consistent Open Graph tags', () => {
      fc.assert(
        fc.property(
          generators.pageData(),
          (pageData) => {
            const metaTags = metaTagOptimizer.generateMetaTags(pageData);
            const og = metaTags.openGraph;
            
            // Open Graph title should not exceed recommended length
            expect(og.title.length).toBeLessThanOrEqual(60);
            
            // Open Graph description should not exceed recommended length
            expect(og.description.length).toBeLessThanOrEqual(155);
            
            // URL should be valid
            expect(() => new URL(og.url)).not.toThrow();
            
            // Image should be valid URL if present
            if (og.image) {
              expect(() => new URL(og.image)).not.toThrow();
            }
            
            // Type should be valid
            expect(['website', 'article', 'product']).toContain(og.type);
            
            // Site name should be consistent
            expect(og.siteName).toBe('BillByteKOT');
            
            // Locale should be set
            expect(og.locale).toBeDefined();
          }
        ),
        { numRuns: testConfig.propertyTests.numRuns }
      );
    });

    test('should generate consistent Twitter Card tags', () => {
      fc.assert(
        fc.property(
          generators.pageData(),
          (pageData) => {
            const metaTags = metaTagOptimizer.generateMetaTags(pageData);
            const twitter = metaTags.twitterCard;
            
            // Card type should be valid
            expect(['summary', 'summary_large_image']).toContain(twitter.card);
            
            // Site handle should be consistent
            expect(twitter.site).toBe('@billbytekot');
            expect(twitter.creator).toBe('@billbytekot');
            
            // Title and description should not exceed Twitter limits
            expect(twitter.title.length).toBeLessThanOrEqual(70);
            expect(twitter.description.length).toBeLessThanOrEqual(200);
            
            // URL should be valid
            expect(() => new URL(twitter.url)).not.toThrow();
            
            // Image should be valid URL if present
            if (twitter.image) {
              expect(() => new URL(twitter.image)).not.toThrow();
            }
          }
        ),
        { numRuns: testConfig.propertyTests.numRuns }
      );
    });

    test('should handle empty or invalid input gracefully', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant({}),
            fc.constant(null),
            fc.constant(undefined),
            fc.record({
              title: fc.oneof(fc.constant(''), fc.constant(null), fc.constant(undefined)),
              description: fc.oneof(fc.constant(''), fc.constant(null), fc.constant(undefined)),
              url: fc.oneof(fc.constant(''), fc.constant('invalid-url'), fc.constant(null))
            })
          ),
          (invalidPageData) => {
            // Should not throw with invalid input
            expect(() => {
              const metaTags = metaTagOptimizer.generateMetaTags(invalidPageData || {});
              
              // Should still generate valid meta tags with defaults
              expect(metaTags.title).toBeDefined();
              expect(metaTags.description).toBeDefined();
              expect(metaTags.canonical).toBeDefined();
              
              // Generated tags should still be valid
              expect(metaTags.title.length).toBeLessThanOrEqual(60);
              expect(metaTags.description.length).toBeLessThanOrEqual(155);
              expect(() => new URL(metaTags.canonical)).not.toThrow();
            }).not.toThrow();
          }
        ),
        { numRuns: testConfig.propertyTests.numRuns }
      );
    });
  });

  /**
   * Keyword Optimization Properties
   */
  describe('Keyword Optimization Properties', () => {
    test('should optimize keywords consistently', () => {
      fc.assert(
        fc.property(
          generators.keywordArray(),
          fc.constantFrom(...Object.values(ContentType)),
          (keywords, contentType) => {
            const optimizedKeywords = metaTagOptimizer.optimizeKeywords(keywords, contentType);
            
            // Should return a string
            expect(typeof optimizedKeywords).toBe('string');
            
            // Should not exceed maximum number of keywords
            const keywordArray = optimizedKeywords.split(',').map(k => k.trim()).filter(k => k);
            expect(keywordArray.length).toBeLessThanOrEqual(10);
            
            // Should include default keywords for content type
            expect(optimizedKeywords.toLowerCase()).toContain('restaurant');
          }
        ),
        { numRuns: testConfig.propertyTests.numRuns }
      );
    });
  });

  /**
   * URL Structure Properties
   */
  describe('URL Structure Properties', () => {
    test('should validate URL structure consistently', () => {
      fc.assert(
        fc.property(
          generators.validUrl(),
          (url) => {
            const validation = metaTagOptimizer.validateURLStructure(url);
            
            expect(validation).toBeDefined();
            expect(typeof validation.isValid).toBe('boolean');
            expect(Array.isArray(validation.issues)).toBe(true);
            expect(Array.isArray(validation.recommendations)).toBe(true);
            expect(typeof validation.score).toBe('number');
            expect(validation.score).toBeGreaterThanOrEqual(0);
            expect(validation.score).toBeLessThanOrEqual(100);
          }
        ),
        { numRuns: testConfig.propertyTests.numRuns }
      );
    });

    test('should generate SEO-friendly URLs consistently', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.option(fc.string({ minLength: 1, maxLength: 20 })),
          (title, category) => {
            const seoUrl = metaTagOptimizer.generateSEOFriendlyURL(title, category);
            
            // Should be a valid URL slug
            expect(typeof seoUrl).toBe('string');
            expect(seoUrl.length).toBeGreaterThan(0);
            
            // Should not exceed reasonable length
            expect(seoUrl.length).toBeLessThanOrEqual(100);
            
            // Should be lowercase
            expect(seoUrl).toBe(seoUrl.toLowerCase());
            
            // Should not contain spaces or special characters
            expect(seoUrl).not.toMatch(/\s/);
            expect(seoUrl).not.toMatch(/[^a-z0-9\-\/]/);
            
            // Should not have consecutive hyphens
            expect(seoUrl).not.toMatch(/--/);
            
            // Should not start or end with hyphens
            expect(seoUrl).not.toMatch(/^-|-$/);
          }
        ),
        { numRuns: testConfig.propertyTests.numRuns }
      );
    });
  });

  /**
   * Meta Tag Validation Properties
   */
  describe('Meta Tag Validation Properties', () => {
    test('should validate any generated meta tags', () => {
      fc.assert(
        fc.property(
          generators.pageData(),
          (pageData) => {
            const metaTags = metaTagOptimizer.generateMetaTags(pageData);
            const validation = metaTagOptimizer.validateMetaTags(metaTags);
            
            expect(validation).toBeDefined();
            expect(typeof validation.isValid).toBe('boolean');
            expect(Array.isArray(validation.issues)).toBe(true);
            expect(Array.isArray(validation.warnings)).toBe(true);
            expect(typeof validation.score).toBe('number');
            expect(validation.score).toBeGreaterThanOrEqual(0);
            expect(validation.score).toBeLessThanOrEqual(100);
            
            // Generated meta tags should generally be valid
            // (may have warnings but should not have critical issues)
            expect(validation.issues.length).toBeLessThanOrEqual(1);
          }
        ),
        { numRuns: testConfig.propertyTests.numRuns }
      );
    });
  });

  /**
   * Content Type Specific Properties
   */
  describe('Content Type Specific Properties', () => {
    test('should generate appropriate defaults for each content type', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.values(ContentType)),
          (contentType) => {
            const defaultTitle = metaTagOptimizer.getDefaultTitle(contentType);
            const defaultDescription = metaTagOptimizer.getDefaultDescription(contentType);
            const defaultKeywords = metaTagOptimizer.getDefaultKeywords(contentType);
            
            // Defaults should be appropriate for content type
            expect(typeof defaultTitle).toBe('string');
            expect(defaultTitle.length).toBeGreaterThan(0);
            expect(defaultTitle.length).toBeLessThanOrEqual(60);
            
            expect(typeof defaultDescription).toBe('string');
            expect(defaultDescription.length).toBeGreaterThan(0);
            expect(defaultDescription.length).toBeLessThanOrEqual(155);
            
            expect(Array.isArray(defaultKeywords)).toBe(true);
            expect(defaultKeywords.length).toBeGreaterThan(0);
            
            // Should contain relevant keywords for the content type
            const allText = `${defaultTitle} ${defaultDescription} ${defaultKeywords.join(' ')}`.toLowerCase();
            expect(allText).toContain('restaurant');
          }
        ),
        { numRuns: testConfig.propertyTests.numRuns }
      );
    });
  });
});