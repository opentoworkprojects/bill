/**
 * SEO Testing Setup
 * 
 * Configuration and utilities for SEO module testing including
 * property-based testing setup with fast-check.
 * 
 * @requirements 4.1, 6.1
 */

// Mock DOM environment for testing
const { JSDOM } = require('jsdom');

// Setup DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', {
  url: 'https://billbytekot.in',
  pretendToBeVisual: true,
  resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;

// Mock performance API
global.performance = {
  getEntriesByType: jest.fn(() => []),
  now: jest.fn(() => Date.now())
};

// Mock URL constructor for Node.js environment
if (typeof URL === 'undefined') {
  global.URL = require('url').URL;
}

// Test utilities
export const createMockPageData = (overrides = {}) => ({
  url: 'https://billbytekot.in/test-page',
  title: 'Test Page Title',
  description: 'Test page description for SEO testing',
  content: 'Test page content with relevant keywords',
  keywords: ['restaurant software', 'billing system', 'POS'],
  type: 'homepage',
  lastModified: new Date(),
  ...overrides
});

export const createMockBlogPost = (overrides = {}) => ({
  id: 'test-blog-post',
  title: 'Restaurant Management Tips',
  slug: 'restaurant-management-tips',
  content: 'Comprehensive guide to restaurant management...',
  targetKeywords: ['restaurant management', 'restaurant tips'],
  internalLinks: [],
  publishDate: new Date(),
  seoMetrics: {
    organicTraffic: 0,
    averagePosition: 0,
    clickThroughRate: 0,
    engagementMetrics: {
      timeOnPage: 0,
      bounceRate: 0,
      pageViews: 0,
      socialShares: 0
    }
  },
  ...overrides
});

export const createMockKeyword = (overrides = {}) => ({
  term: 'restaurant billing software',
  searchVolume: 5000,
  difficulty: 65,
  intent: 'commercial',
  priority: 'high',
  ...overrides
});

export const createMockLocation = (overrides = {}) => ({
  city: 'Mumbai',
  state: 'Maharashtra',
  country: 'IN',
  latitude: 19.0760,
  longitude: 72.8777,
  ...overrides
});

// Property-based testing generators
export const generators = {
  // Generate valid page titles (1-60 characters)
  pageTitle: () => {
    const fc = require('fast-check');
    return fc.string({ minLength: 1, maxLength: 60 })
      .filter(s => s.trim().length > 0);
  },

  // Generate valid meta descriptions (1-155 characters)
  metaDescription: () => {
    const fc = require('fast-check');
    return fc.string({ minLength: 1, maxLength: 155 })
      .filter(s => s.trim().length > 0);
  },

  // Generate valid URLs
  validUrl: () => {
    const fc = require('fast-check');
    return fc.record({
      protocol: fc.constantFrom('http:', 'https:'),
      domain: fc.domain(),
      path: fc.option(fc.string().map(s => '/' + s.replace(/[^a-zA-Z0-9\-_]/g, '')))
    }).map(({ protocol, domain, path }) => 
      `${protocol}//${domain}${path || ''}`
    );
  },

  // Generate keyword arrays
  keywordArray: () => {
    const fc = require('fast-check');
    return fc.array(
      fc.string({ minLength: 2, maxLength: 50 })
        .filter(s => s.trim().length > 1),
      { minLength: 0, maxLength: 10 }
    );
  },

  // Generate page data objects
  pageData: () => {
    const fc = require('fast-check');
    return fc.record({
      url: generators.validUrl(),
      title: generators.pageTitle(),
      description: generators.metaDescription(),
      keywords: generators.keywordArray(),
      type: fc.constantFrom('homepage', 'product_page', 'blog_post', 'landing_page'),
      lastModified: fc.date()
    });
  },

  // Generate comprehensive page data for schema testing
  pageDataForSchema: () => {
    const fc = require('fast-check');
    return fc.record({
      url: generators.validUrl(),
      title: generators.pageTitle(),
      description: generators.metaDescription(),
      keywords: generators.keywordArray(),
      contentType: fc.constantFrom('homepage', 'product_page', 'blog_post', 'landing_page', 'category_page'),
      lastModified: fc.date(),
      // Add optional properties that might be present
      name: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
      headline: fc.option(fc.string({ minLength: 10, maxLength: 110 })),
      publishedDate: fc.option(fc.date().map(d => d.toISOString())),
      author: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
      image: fc.option(generators.validUrl()),
      price: fc.option(fc.integer({ min: 100, max: 10000 }).map(String)),
      currency: fc.option(fc.constantFrom('INR', 'USD', 'EUR')),
      availability: fc.option(fc.constantFrom('InStock', 'OutOfStock', 'PreOrder')),
      // Business/location data
      contactInfo: fc.option(fc.record({
        email: fc.emailAddress(),
        phone: fc.string({ minLength: 10, maxLength: 15 }),
        address: fc.record({
          street: fc.string({ minLength: 5, maxLength: 50 }),
          city: fc.string({ minLength: 2, maxLength: 30 }),
          state: fc.string({ minLength: 2, maxLength: 30 }),
          postalCode: fc.string({ minLength: 5, maxLength: 10 }),
          country: fc.constantFrom('IN', 'US', 'GB')
        })
      })),
      businessHours: fc.option(fc.array(
        fc.record({
          '@type': fc.constant('OpeningHoursSpecification'),
          dayOfWeek: fc.constantFrom('Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'),
          opens: fc.constantFrom('09:00', '10:00', '08:00'),
          closes: fc.constantFrom('17:00', '18:00', '19:00')
        }),
        { minLength: 1, maxLength: 7 }
      )),
      // FAQ data
      faqs: fc.option(generators.faqData()),
      // Breadcrumb data
      breadcrumbs: fc.option(generators.breadcrumbData())
    });
  },

  // Generate schema data
  schemaData: () => {
    const fc = require('fast-check');
    return fc.record({
      name: fc.string({ minLength: 1, maxLength: 100 }),
      description: fc.string({ minLength: 1, maxLength: 500 }),
      url: generators.validUrl(),
      image: generators.validUrl()
    });
  },

  // Generate FAQ data
  faqData: () => {
    const fc = require('fast-check');
    return fc.array(
      fc.record({
        question: fc.string({ minLength: 10, maxLength: 200 }),
        answer: fc.string({ minLength: 20, maxLength: 1000 })
      }),
      { minLength: 1, maxLength: 20 }
    );
  },

  // Generate breadcrumb data
  breadcrumbData: () => {
    const fc = require('fast-check');
    return fc.array(
      fc.record({
        name: fc.string({ minLength: 1, maxLength: 50 }),
        url: generators.validUrl()
      }),
      { minLength: 1, maxLength: 10 }
    );
  }
};

// Test assertions
export const assertions = {
  // Assert valid meta tags
  validMetaTags: (metaTags) => {
    expect(metaTags).toBeDefined();
    expect(metaTags.title).toBeDefined();
    expect(metaTags.description).toBeDefined();
    expect(typeof metaTags.title).toBe('string');
    expect(typeof metaTags.description).toBe('string');
    expect(metaTags.title.length).toBeLessThanOrEqual(60);
    expect(metaTags.description.length).toBeLessThanOrEqual(155);
  },

  // Assert valid schema markup
  validSchema: (schema) => {
    expect(schema).toBeDefined();
    expect(schema.data).toBeDefined();
    expect(schema.data['@context']).toBe('https://schema.org');
    expect(schema.data['@type']).toBeDefined();
    expect(typeof schema.data['@type']).toBe('string');
    
    // Validate JSON structure
    expect(() => JSON.stringify(schema.data)).not.toThrow();
  },

  // Assert schema has required properties based on content type
  schemaHasRequiredProperties: (schemaData, contentType) => {
    if (schemaData['@graph']) {
      // Multiple schemas - check each one
      schemaData['@graph'].forEach(schema => {
        assertions.validateSchemaTypeRequiredProperties(schema, schema['@type']);
      });
    } else {
      // Single schema
      assertions.validateSchemaTypeRequiredProperties(schemaData, schemaData['@type']);
    }
  },

  // Validate required properties for specific schema types
  validateSchemaTypeRequiredProperties: (schema, schemaType) => {
    // Common required properties
    expect(schema['@type']).toBeDefined();
    expect(typeof schema['@type']).toBe('string');
    
    // Type-specific required properties
    switch (schemaType) {
      case 'Organization':
        expect(schema.name).toBeDefined();
        expect(typeof schema.name).toBe('string');
        expect(schema.name.length).toBeGreaterThan(0);
        break;
        
      case 'SoftwareApplication':
        expect(schema.name).toBeDefined();
        expect(typeof schema.name).toBe('string');
        expect(schema.name.length).toBeGreaterThan(0);
        expect(schema.applicationCategory).toBeDefined();
        break;
        
      case 'Article':
        expect(schema.headline).toBeDefined();
        expect(typeof schema.headline).toBe('string');
        expect(schema.headline.length).toBeGreaterThan(0);
        expect(schema.datePublished).toBeDefined();
        break;
        
      case 'Product':
        expect(schema.name).toBeDefined();
        expect(typeof schema.name).toBe('string');
        expect(schema.name.length).toBeGreaterThan(0);
        break;
        
      case 'LocalBusiness':
        expect(schema.name).toBeDefined();
        expect(typeof schema.name).toBe('string');
        expect(schema.name.length).toBeGreaterThan(0);
        break;
        
      case 'FAQPage':
        expect(schema.mainEntity).toBeDefined();
        expect(Array.isArray(schema.mainEntity)).toBe(true);
        expect(schema.mainEntity.length).toBeGreaterThan(0);
        schema.mainEntity.forEach(faq => {
          expect(faq['@type']).toBe('Question');
          expect(faq.name).toBeDefined();
          expect(faq.acceptedAnswer).toBeDefined();
          expect(faq.acceptedAnswer['@type']).toBe('Answer');
          expect(faq.acceptedAnswer.text).toBeDefined();
        });
        break;
        
      case 'BreadcrumbList':
        expect(schema.itemListElement).toBeDefined();
        expect(Array.isArray(schema.itemListElement)).toBe(true);
        expect(schema.itemListElement.length).toBeGreaterThan(0);
        schema.itemListElement.forEach((item, index) => {
          expect(item['@type']).toBe('ListItem');
          expect(item.position).toBe(index + 1);
          expect(item.name).toBeDefined();
          expect(item.item).toBeDefined();
        });
        break;
        
      case 'WebSite':
        expect(schema.url).toBeDefined();
        expect(schema.name).toBeDefined();
        break;
        
      case 'WebPage':
        expect(schema.url || schema['@id']).toBeDefined();
        break;
    }
  },

  // Assert valid sitemap
  validSitemap: (sitemap) => {
    expect(sitemap).toBeDefined();
    expect(sitemap.success).toBe(true);
    expect(sitemap.urlCount).toBeGreaterThan(0);
    expect(sitemap.sitemapUrl).toMatch(/^https?:\/\/.+\/sitemap\.xml$/);
    expect(sitemap.lastModified).toBeInstanceOf(Date);
  },

  // Assert valid URL structure
  validUrlStructure: (url) => {
    expect(url).toBeDefined();
    expect(typeof url).toBe('string');
    expect(() => new URL(url)).not.toThrow();
    expect(url.length).toBeLessThanOrEqual(100);
    expect(url).not.toMatch(/[A-Z]/); // Should be lowercase
    expect(url).not.toMatch(/_/); // Should not contain underscores
  }
};

// Mock implementations
export const mocks = {
  // Mock Google Search Console API
  searchConsoleAPI: {
    getSearchAnalytics: jest.fn(() => Promise.resolve({
      rows: [
        { keys: ['restaurant billing software'], clicks: 100, impressions: 1000, ctr: 0.1, position: 5.5 }
      ]
    })),
    getSitemaps: jest.fn(() => Promise.resolve([
      { path: '/sitemap.xml', lastSubmitted: new Date(), isPending: false }
    ]))
  },

  // Mock performance measurement
  performanceAPI: {
    measureCoreWebVitals: jest.fn(() => Promise.resolve({
      lcp: 2000,
      fid: 50,
      cls: 0.05,
      fcp: 1500,
      ttfb: 300
    }))
  },

  // Mock analytics data
  analyticsAPI: {
    getOrganicTraffic: jest.fn(() => Promise.resolve(5000)),
    getKeywordRankings: jest.fn(() => Promise.resolve([
      { keyword: 'restaurant software', position: 3, url: 'https://billbytekot.in' }
    ]))
  }
};

// Test configuration
export const testConfig = {
  // Property-based test settings
  propertyTests: {
    numRuns: 20, // Reduced from 100 for faster execution
    timeout: 10000, // 10 second timeout (reduced from 30s)
    seed: 42, // Fixed seed for reproducible tests
    verbose: process.env.NODE_ENV === 'test'
  },

  // Mock data settings
  mockData: {
    baseUrl: 'https://billbytekot.in',
    siteName: 'BillByteKOT',
    defaultImage: 'https://billbytekot.in/og-default.jpg',
    twitterHandle: '@billbytekot'
  }
};

// Cleanup function
export const cleanup = () => {
  // Reset all mocks
  Object.values(mocks).forEach(mockGroup => {
    Object.values(mockGroup).forEach(mock => {
      if (jest.isMockFunction(mock)) {
        mock.mockReset();
      }
    });
  });

  // Clear DOM
  document.head.innerHTML = '';
  document.body.innerHTML = '';
};