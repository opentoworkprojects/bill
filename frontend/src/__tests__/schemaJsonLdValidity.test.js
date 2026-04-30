/**
 * Property Test: Schema JSON-LD Validity
 * 
 * **Property 4: Schema JSON-LD Validity**
 * *For any* schema type (SoftwareApplication, Organization, FAQPage, Article, 
 * BreadcrumbList, LocalBusiness, Product), the generated JSON-LD SHALL be valid 
 * JSON and contain all required fields as per schema.org specification.
 * 
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8**
 * 
 * Feature: seo-enhancement, Property 4: Schema JSON-LD Validity
 */

import * as fc from 'fast-check';
import { generateSchema, validateSchema } from '../components/seo/SchemaManager';

// Arbitraries for generating test data
const nonEmptyString = fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0);
const validUrl = fc.constantFrom(
  'https://example.com',
  'https://billbytekot.in',
  'https://billbytekot.in/blog/test',
  'https://example.com/image.jpg',
  'https://cdn.example.com/logo.png'
);
const validDate = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
  .filter(d => !isNaN(d.getTime()))
  .map(d => d.toISOString());
const positiveNumber = fc.integer({ min: 1, max: 10000 });
const rating = fc.float({ min: 1, max: 5, noNaN: true });
const reviewCount = fc.integer({ min: 1, max: 10000 });

// Arbitrary for SoftwareApplication data
const softwareApplicationArb = fc.record({
  name: nonEmptyString,
  description: nonEmptyString,
  applicationCategory: fc.constantFrom('BusinessApplication', 'UtilitiesApplication', 'WebApplication'),
  operatingSystem: fc.constantFrom('Web', 'Android', 'iOS', 'Windows', 'Web, Android, iOS'),
  offers: fc.option(fc.record({
    price: fc.integer({ min: 0, max: 99999 }).map(n => String(n)),
    priceCurrency: fc.constantFrom('INR', 'USD', 'EUR'),
    availability: fc.constantFrom('https://schema.org/InStock', 'https://schema.org/OutOfStock'),
  }), { nil: undefined }),
  aggregateRating: fc.option(fc.record({
    ratingValue: rating,
    reviewCount: reviewCount,
    bestRating: fc.constant(5),
    worstRating: fc.constant(1),
  }), { nil: undefined }),
  featureList: fc.option(fc.array(nonEmptyString, { minLength: 1, maxLength: 5 }), { nil: undefined }),
});

// Arbitrary for Organization data
const organizationArb = fc.record({
  name: nonEmptyString,
  legalName: fc.option(nonEmptyString, { nil: undefined }),
  url: fc.option(validUrl, { nil: undefined }),
  logo: fc.option(validUrl, { nil: undefined }),
  description: fc.option(nonEmptyString, { nil: undefined }),
  email: fc.option(fc.constantFrom('test@example.com', 'support@billbytekot.in'), { nil: undefined }),
  telephone: fc.option(fc.constantFrom('+91-1234567890', '+1-555-1234'), { nil: undefined }),
  address: fc.option(fc.record({
    street: nonEmptyString,
    city: nonEmptyString,
    state: nonEmptyString,
    postalCode: fc.integer({ min: 10000, max: 999999 }).map(n => String(n)),
    country: fc.constantFrom('IN', 'US', 'UK'),
  }), { nil: undefined }),
  sameAs: fc.option(fc.array(validUrl, { minLength: 1, maxLength: 3 }), { nil: undefined }),
});

// Arbitrary for FAQPage data
const faqPageArb = fc.record({
  questions: fc.array(
    fc.record({
      question: nonEmptyString,
      answer: fc.string({ minLength: 50, maxLength: 500 }).filter(s => s.trim().length >= 50),
    }),
    { minLength: 1, maxLength: 10 }
  ),
});

// Arbitrary for Article data
const articleArb = fc.record({
  headline: nonEmptyString,
  description: fc.option(nonEmptyString, { nil: undefined }),
  image: fc.option(validUrl, { nil: undefined }),
  datePublished: validDate,
  dateModified: fc.option(validDate, { nil: undefined }),
  author: fc.option(fc.oneof(
    nonEmptyString,
    fc.record({ name: nonEmptyString, url: fc.option(validUrl, { nil: undefined }) })
  ), { nil: undefined }),
  publisher: fc.option(fc.record({
    name: nonEmptyString,
    logo: fc.option(validUrl, { nil: undefined }),
  }), { nil: undefined }),
  wordCount: fc.option(positiveNumber, { nil: undefined }),
  mainEntityOfPage: fc.option(validUrl, { nil: undefined }),
});

// Arbitrary for BreadcrumbList data
const breadcrumbListArb = fc.record({
  items: fc.array(
    fc.record({
      name: nonEmptyString,
      url: validUrl,
    }),
    { minLength: 1, maxLength: 5 }
  ),
});

// Arbitrary for LocalBusiness data
const localBusinessArb = fc.record({
  name: nonEmptyString,
  businessType: fc.option(fc.constantFrom('LocalBusiness', 'Restaurant', 'Store', 'FoodEstablishment'), { nil: undefined }),
  description: fc.option(nonEmptyString, { nil: undefined }),
  image: fc.option(validUrl, { nil: undefined }),
  telephone: fc.option(fc.constantFrom('+91-1234567890', '+1-555-1234'), { nil: undefined }),
  email: fc.option(fc.constantFrom('test@example.com', 'support@billbytekot.in'), { nil: undefined }),
  url: fc.option(validUrl, { nil: undefined }),
  priceRange: fc.option(fc.constantFrom('₹', '₹₹', '₹₹₹', '$', '$$', '$$$'), { nil: undefined }),
  address: fc.option(fc.record({
    street: nonEmptyString,
    city: nonEmptyString,
    state: nonEmptyString,
    postalCode: fc.integer({ min: 10000, max: 999999 }).map(n => String(n)),
    country: fc.constantFrom('IN', 'US', 'UK'),
  }), { nil: undefined }),
  geo: fc.option(fc.record({
    latitude: fc.float({ min: -90, max: 90, noNaN: true }),
    longitude: fc.float({ min: -180, max: 180, noNaN: true }),
  }), { nil: undefined }),
  aggregateRating: fc.option(fc.record({
    ratingValue: rating,
    reviewCount: reviewCount,
  }), { nil: undefined }),
});

// Arbitrary for Product data
const productArb = fc.record({
  name: nonEmptyString,
  description: nonEmptyString,
  image: fc.option(validUrl, { nil: undefined }),
  brand: fc.option(nonEmptyString, { nil: undefined }),
  sku: fc.option(nonEmptyString, { nil: undefined }),
  offers: fc.option(fc.record({
    price: positiveNumber,
    priceCurrency: fc.constantFrom('INR', 'USD', 'EUR'),
    availability: fc.constantFrom('https://schema.org/InStock', 'https://schema.org/OutOfStock'),
    url: fc.option(validUrl, { nil: undefined }),
  }), { nil: undefined }),
  aggregateRating: fc.option(fc.record({
    ratingValue: rating,
    reviewCount: reviewCount,
    bestRating: fc.constant(5),
    worstRating: fc.constant(1),
  }), { nil: undefined }),
});

describe('Property 4: Schema JSON-LD Validity', () => {
  
  /**
   * Helper to validate JSON-LD structure
   */
  const isValidJsonLd = (schema) => {
    if (!schema) return false;
    
    // Must have @context
    if (schema['@context'] !== 'https://schema.org') return false;
    
    // Must have @type
    if (!schema['@type']) return false;
    
    // Must be valid JSON (can be stringified)
    try {
      JSON.stringify(schema);
      return true;
    } catch {
      return false;
    }
  };

  /**
   * Test SoftwareApplication schema generation
   * Validates: Requirement 4.1
   */
  it('should generate valid SoftwareApplication schema for any valid input', () => {
    fc.assert(
      fc.property(softwareApplicationArb, (data) => {
        const schema = generateSchema('SoftwareApplication', data);
        
        // Schema should be generated
        expect(schema).not.toBeNull();
        
        // Should be valid JSON-LD
        expect(isValidJsonLd(schema)).toBe(true);
        
        // Should have correct type
        expect(schema['@type']).toBe('SoftwareApplication');
        
        // Should have required fields
        expect(schema.name).toBe(data.name);
        expect(schema.description).toBe(data.description);
        
        // Optional fields should be present if provided
        if (data.applicationCategory) {
          expect(schema.applicationCategory).toBe(data.applicationCategory);
        }
        if (data.offers) {
          expect(schema.offers).toBeDefined();
          expect(schema.offers['@type']).toBe('Offer');
        }
        if (data.aggregateRating) {
          expect(schema.aggregateRating).toBeDefined();
          expect(schema.aggregateRating['@type']).toBe('AggregateRating');
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Test Organization schema generation
   * Validates: Requirement 4.2
   */
  it('should generate valid Organization schema for any valid input', () => {
    fc.assert(
      fc.property(organizationArb, (data) => {
        const schema = generateSchema('Organization', data);
        
        // Schema should be generated
        expect(schema).not.toBeNull();
        
        // Should be valid JSON-LD
        expect(isValidJsonLd(schema)).toBe(true);
        
        // Should have correct type
        expect(schema['@type']).toBe('Organization');
        
        // Should have required fields
        expect(schema.name).toBe(data.name);
        
        // Optional fields should be present if provided
        if (data.url) {
          expect(schema.url).toBe(data.url);
        }
        if (data.logo) {
          expect(schema.logo).toBeDefined();
          expect(schema.logo['@type']).toBe('ImageObject');
        }
        if (data.address) {
          expect(schema.address).toBeDefined();
          expect(schema.address['@type']).toBe('PostalAddress');
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Test FAQPage schema generation
   * Validates: Requirement 4.3
   */
  it('should generate valid FAQPage schema for any valid input', () => {
    fc.assert(
      fc.property(faqPageArb, (data) => {
        const schema = generateSchema('FAQPage', data);
        
        // Schema should be generated
        expect(schema).not.toBeNull();
        
        // Should be valid JSON-LD
        expect(isValidJsonLd(schema)).toBe(true);
        
        // Should have correct type
        expect(schema['@type']).toBe('FAQPage');
        
        // Should have mainEntity array
        expect(Array.isArray(schema.mainEntity)).toBe(true);
        expect(schema.mainEntity.length).toBeGreaterThan(0);
        
        // Each question should have correct structure
        schema.mainEntity.forEach((item, index) => {
          expect(item['@type']).toBe('Question');
          expect(item.name).toBe(data.questions[index].question);
          expect(item.acceptedAnswer['@type']).toBe('Answer');
          expect(item.acceptedAnswer.text).toBe(data.questions[index].answer);
        });
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Test Article schema generation
   * Validates: Requirement 4.8
   */
  it('should generate valid Article schema for any valid input', () => {
    fc.assert(
      fc.property(articleArb, (data) => {
        const schema = generateSchema('Article', data);
        
        // Schema should be generated
        expect(schema).not.toBeNull();
        
        // Should be valid JSON-LD
        expect(isValidJsonLd(schema)).toBe(true);
        
        // Should have correct type
        expect(schema['@type']).toBe('Article');
        
        // Should have required fields
        expect(schema.headline).toBeDefined();
        expect(schema.headline.length).toBeLessThanOrEqual(110); // Google recommendation
        expect(schema.datePublished).toBe(data.datePublished);
        
        // Optional fields should be present if provided
        if (data.author) {
          expect(schema.author).toBeDefined();
        }
        if (data.publisher) {
          expect(schema.publisher).toBeDefined();
          expect(schema.publisher['@type']).toBe('Organization');
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Test BreadcrumbList schema generation
   * Validates: Requirement 4.4
   */
  it('should generate valid BreadcrumbList schema for any valid input', () => {
    fc.assert(
      fc.property(breadcrumbListArb, (data) => {
        const schema = generateSchema('BreadcrumbList', data);
        
        // Schema should be generated
        expect(schema).not.toBeNull();
        
        // Should be valid JSON-LD
        expect(isValidJsonLd(schema)).toBe(true);
        
        // Should have correct type
        expect(schema['@type']).toBe('BreadcrumbList');
        
        // Should have itemListElement array
        expect(Array.isArray(schema.itemListElement)).toBe(true);
        expect(schema.itemListElement.length).toBe(data.items.length);
        
        // Each item should have correct structure with sequential positions
        schema.itemListElement.forEach((item, index) => {
          expect(item['@type']).toBe('ListItem');
          expect(item.position).toBe(index + 1);
          expect(item.name).toBe(data.items[index].name);
          expect(item.item).toBe(data.items[index].url);
        });
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Test LocalBusiness schema generation
   * Validates: Requirement 4.7
   */
  it('should generate valid LocalBusiness schema for any valid input', () => {
    fc.assert(
      fc.property(localBusinessArb, (data) => {
        const schema = generateSchema('LocalBusiness', data);
        
        // Schema should be generated
        expect(schema).not.toBeNull();
        
        // Should be valid JSON-LD
        expect(isValidJsonLd(schema)).toBe(true);
        
        // Should have correct type (or subtype)
        expect(['LocalBusiness', 'Restaurant', 'Store', 'FoodEstablishment']).toContain(schema['@type']);
        
        // Should have required fields
        expect(schema.name).toBe(data.name);
        
        // Optional fields should be present if provided
        if (data.address) {
          expect(schema.address).toBeDefined();
          expect(schema.address['@type']).toBe('PostalAddress');
        }
        if (data.geo) {
          expect(schema.geo).toBeDefined();
          expect(schema.geo['@type']).toBe('GeoCoordinates');
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Test Product schema generation
   * Validates: Requirement 4.5
   */
  it('should generate valid Product schema for any valid input', () => {
    fc.assert(
      fc.property(productArb, (data) => {
        const schema = generateSchema('Product', data);
        
        // Schema should be generated
        expect(schema).not.toBeNull();
        
        // Should be valid JSON-LD
        expect(isValidJsonLd(schema)).toBe(true);
        
        // Should have correct type
        expect(schema['@type']).toBe('Product');
        
        // Should have required fields
        expect(schema.name).toBe(data.name);
        expect(schema.description).toBe(data.description);
        
        // Optional fields should be present if provided
        if (data.brand) {
          expect(schema.brand).toBeDefined();
          expect(schema.brand['@type']).toBe('Brand');
        }
        if (data.offers) {
          expect(schema.offers).toBeDefined();
          expect(schema.offers['@type']).toBe('Offer');
        }
        if (data.aggregateRating) {
          expect(schema.aggregateRating).toBeDefined();
          expect(schema.aggregateRating['@type']).toBe('AggregateRating');
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Test that invalid data returns null
   */
  describe('Invalid data handling', () => {
    it('should return null for SoftwareApplication without required fields', () => {
      const invalidData = { description: 'Test' }; // Missing name
      const schema = generateSchema('SoftwareApplication', invalidData);
      expect(schema).toBeNull();
    });

    it('should return null for Organization without required fields', () => {
      const invalidData = { url: 'https://example.com' }; // Missing name
      const schema = generateSchema('Organization', invalidData);
      expect(schema).toBeNull();
    });

    it('should return null for FAQPage without questions', () => {
      const invalidData = { questions: [] };
      const schema = generateSchema('FAQPage', invalidData);
      expect(schema).toBeNull();
    });

    it('should return null for Article without required fields', () => {
      const invalidData = { headline: 'Test' }; // Missing datePublished
      const schema = generateSchema('Article', invalidData);
      expect(schema).toBeNull();
    });

    it('should return null for BreadcrumbList without items', () => {
      const invalidData = { items: [] };
      const schema = generateSchema('BreadcrumbList', invalidData);
      expect(schema).toBeNull();
    });

    it('should return null for Product without required fields', () => {
      const invalidData = { name: 'Test' }; // Missing description
      const schema = generateSchema('Product', invalidData);
      expect(schema).toBeNull();
    });

    it('should return null for unknown schema type', () => {
      const schema = generateSchema('UnknownType', { name: 'Test' });
      expect(schema).toBeNull();
    });
  });

  /**
   * Test validateSchema function
   */
  describe('validateSchema function', () => {
    it('should return true for valid schema data', () => {
      fc.assert(
        fc.property(softwareApplicationArb, (data) => {
          expect(validateSchema('SoftwareApplication', data)).toBe(true);
        }),
        { numRuns: 50 }
      );
    });

    it('should return false for invalid schema data', () => {
      expect(validateSchema('SoftwareApplication', {})).toBe(false);
      expect(validateSchema('Organization', {})).toBe(false);
      expect(validateSchema('FAQPage', { questions: [] })).toBe(false);
    });
  });

  /**
   * Test JSON stringification round-trip
   */
  it('should produce schemas that survive JSON round-trip', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          softwareApplicationArb.map(d => ({ type: 'SoftwareApplication', data: d })),
          organizationArb.map(d => ({ type: 'Organization', data: d })),
          faqPageArb.map(d => ({ type: 'FAQPage', data: d })),
          breadcrumbListArb.map(d => ({ type: 'BreadcrumbList', data: d })),
          localBusinessArb.map(d => ({ type: 'LocalBusiness', data: d })),
          productArb.map(d => ({ type: 'Product', data: d }))
        ),
        ({ type, data }) => {
          const schema = generateSchema(type, data);
          if (schema) {
            const jsonString = JSON.stringify(schema);
            const parsed = JSON.parse(jsonString);
            
            // Should be equal after round-trip
            expect(parsed['@context']).toBe(schema['@context']);
            expect(parsed['@type']).toBe(schema['@type']);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
