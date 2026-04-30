/**
 * Property-Based Tests for Schema Generator
 * 
 * Tests universal properties of schema generation using fast-check
 * to ensure correctness across all possible inputs.
 * 
 * **Feature: seo-enhancement-comprehensive, Property 1: Schema Generation Completeness**
 * **Validates: Requirements 1.2, 1.4, 4.2, 5.4**
 */

import fc from 'fast-check';
import SchemaGenerator from '../core/SchemaGenerator';
import { ContentType, SchemaType } from '../types';
import { generators, assertions, testConfig, cleanup } from './setup';

describe('SchemaGenerator Property Tests', () => {
  let schemaGenerator;

  beforeEach(() => {
    schemaGenerator = new SchemaGenerator();
  });

  afterEach(() => {
    cleanup();
  });

  /**
   * Property 1: Schema Generation Completeness
   * **Feature: seo-enhancement-comprehensive, Property 1: Schema Generation Completeness**
   * **Validates: Requirements 1.2, 1.4, 4.2, 5.4**
   * 
   * For any page requiring structured data, the Schema_Generator should produce 
   * valid JSON-LD markup containing the appropriate schema type (SoftwareApplication, 
   * Organization, LocalBusiness) with all required properties populated
   */
  describe('Property 1: Schema Generation Completeness', () => {
    test('**Feature: seo-enhancement-comprehensive, Property 1: Schema Generation Completeness** - should generate complete valid JSON-LD for any page requiring structured data', () => {
      fc.assert(
        fc.property(
          generators.pageDataForSchema(),
          (pageData) => {
            // Generate schema for the page
            const result = schemaGenerator.generateSchema(pageData.contentType, pageData);
            
            // Schema should be generated for pages requiring structured data
            expect(result).not.toBeNull();
            
            // Assert basic schema structure completeness
            assertions.validSchema(result);
            
            // Verify schema contains required JSON-LD properties
            expect(result.data).toHaveProperty('@context', 'https://schema.org');
            expect(result.data).toHaveProperty('@type');
            expect(result.pageUrl).toBeDefined();
            expect(result.lastUpdated).toBeInstanceOf(Date);
            expect(result.contentType).toBeDefined();
            
            // Verify JSON-LD is valid and serializable
            expect(() => JSON.stringify(result.data)).not.toThrow();
            const serialized = JSON.stringify(result.data);
            expect(() => JSON.parse(serialized)).not.toThrow();
            
            // Verify appropriate schema type is generated based on content type
            const schemaData = result.data;
            const schemaType = schemaData['@type'];
            
            if (schemaData['@graph']) {
              // Multiple schemas in graph - verify each has appropriate type
              expect(Array.isArray(schemaData['@graph'])).toBe(true);
              expect(schemaData['@graph'].length).toBeGreaterThan(0);
              
              schemaData['@graph'].forEach(schema => {
                expect(schema['@type']).toBeDefined();
                expect(typeof schema['@type']).toBe('string');
                expect(schema['@type'].length).toBeGreaterThan(0);
              });
              
              // Verify required schema types are present for homepage
              if (pageData.contentType === ContentType.HOMEPAGE) {
                const schemaTypes = schemaData['@graph'].map(s => s['@type']);
                expect(schemaTypes).toContain('Organization');
                expect(schemaTypes).toContain('SoftwareApplication');
              }
            } else {
              // Single schema - verify type is appropriate
              expect(typeof schemaType).toBe('string');
              expect(schemaType.length).toBeGreaterThan(0);
              
              // Verify schema type matches content type expectations
              switch (pageData.contentType) {
                case ContentType.BLOG_POST:
                  expect(schemaType).toBe('Article');
                  break;
                case ContentType.PRODUCT_PAGE:
                  expect(schemaType).toBe('Product');
                  break;
                case ContentType.LANDING_PAGE:
                  expect(['WebPage', 'SoftwareApplication']).toContain(schemaType);
                  break;
              }
            }
            
            // Verify all required properties are populated for the schema type
            assertions.schemaHasRequiredProperties(schemaData, pageData.contentType);
          }
        ),
        { 
          numRuns: 100, // Minimum 100 iterations as specified
          seed: testConfig.propertyTests.seed,
          timeout: testConfig.propertyTests.timeout
        }
      );
    });

    test('should generate Organization schema with all required properties for brand disambiguation', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            url: generators.validUrl(),
            description: fc.option(fc.string({ minLength: 1, maxLength: 500 })),
            logo: fc.option(generators.validUrl()),
            contactInfo: fc.option(fc.record({
              email: fc.emailAddress(),
              phone: fc.string({ minLength: 10, maxLength: 15 }),
              address: fc.record({
                street: fc.string({ minLength: 5, maxLength: 50 }),
                city: fc.string({ minLength: 2, maxLength: 30 }),
                state: fc.string({ minLength: 2, maxLength: 30 }),
                postalCode: fc.string({ minLength: 5, max: 10 }),
                country: fc.constantFrom('IN', 'US', 'GB')
              })
            }))
          }),
          (orgData) => {
            const schema = schemaGenerator.generateOrganizationSchema(orgData);
            
            expect(schema).toBeDefined();
            expect(schema['@type']).toBe('Organization');
            expect(schema['@context']).toBe('https://schema.org');
            
            // Verify required properties for brand disambiguation (Req 1.2, 1.4)
            expect(schema.name).toBeDefined();
            expect(typeof schema.name).toBe('string');
            expect(schema.name.length).toBeGreaterThan(0);
            expect(schema.url).toBeDefined();
            expect(schema['@id']).toBeDefined();
            
            // Verify brand information is present
            expect(schema.brand).toBeDefined();
            expect(schema.brand['@type']).toBe('Brand');
            expect(schema.brand.name).toBeDefined();
            
            // Verify logo structure if present
            if (schema.logo) {
              expect(schema.logo['@type']).toBe('ImageObject');
              expect(schema.logo.url).toBeDefined();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should generate SoftwareApplication schema with all required properties', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 1, maxLength: 500 }),
            applicationCategory: fc.option(fc.constantFrom('BusinessApplication', 'FinanceApplication')),
            operatingSystem: fc.option(fc.array(fc.constantFrom('Web Browser', 'Android', 'iOS', 'Windows'))),
            pricing: fc.option(fc.record({
              price: fc.integer({ min: 100, max: 10000 }).map(String),
              currency: fc.constantFrom('INR', 'USD'),
              billingPeriod: fc.constantFrom('monthly', 'yearly')
            }))
          }),
          (appData) => {
            const schema = schemaGenerator.generateSoftwareApplicationSchema(appData);
            
            expect(schema).toBeDefined();
            expect(schema['@type']).toBe('SoftwareApplication');
            expect(schema['@context']).toBe('https://schema.org');
            
            // Verify required properties (Req 4.2)
            expect(schema.name).toBeDefined();
            expect(typeof schema.name).toBe('string');
            expect(schema.name.length).toBeGreaterThan(0);
            expect(schema.description).toBeDefined();
            expect(schema.applicationCategory).toBeDefined();
            
            // Verify pricing information structure
            if (schema.offers) {
              expect(schema.offers['@type']).toBe('Offer');
              expect(schema.offers.price).toBeDefined();
              expect(schema.offers.priceCurrency).toBeDefined();
            }
            
            // Verify feature list is present
            expect(schema.featureList).toBeDefined();
            expect(Array.isArray(schema.featureList)).toBe(true);
            expect(schema.featureList.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should generate LocalBusiness schema with all required properties for local SEO', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.option(fc.string({ minLength: 1, maxLength: 500 })),
            address: fc.option(fc.record({
              street: fc.string({ minLength: 5, maxLength: 50 }),
              city: fc.string({ minLength: 2, maxLength: 30 }),
              state: fc.string({ minLength: 2, maxLength: 30 }),
              postalCode: fc.string({ minLength: 5, maxLength: 10 }),
              country: fc.constantFrom('IN', 'US', 'GB')
            })),
            telephone: fc.option(fc.string({ minLength: 10, maxLength: 15 })),
            email: fc.option(fc.emailAddress()),
            businessHours: fc.option(fc.array(
              fc.record({
                '@type': fc.constant('OpeningHoursSpecification'),
                dayOfWeek: fc.constantFrom('Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'),
                opens: fc.constantFrom('09:00', '10:00', '08:00'),
                closes: fc.constantFrom('17:00', '18:00', '19:00')
              }),
              { minLength: 1, maxLength: 7 }
            ))
          }),
          (businessData) => {
            const schema = schemaGenerator.generateLocalBusinessSchema(businessData);
            
            expect(schema).toBeDefined();
            expect(schema['@type']).toBe('LocalBusiness');
            expect(schema['@context']).toBe('https://schema.org');
            
            // Verify required properties for local SEO (Req 5.4)
            expect(schema.name).toBeDefined();
            expect(typeof schema.name).toBe('string');
            expect(schema.name.length).toBeGreaterThan(0);
            expect(schema.url).toBeDefined();
            expect(schema['@id']).toBeDefined();
            
            // Verify address structure if present
            if (schema.address) {
              expect(schema.address['@type']).toBe('PostalAddress');
              expect(schema.address.addressLocality).toBeDefined();
              expect(schema.address.addressCountry).toBeDefined();
            }
            
            // Verify business hours structure if present
            if (schema.openingHoursSpecification) {
              expect(Array.isArray(schema.openingHoursSpecification)).toBe(true);
              schema.openingHoursSpecification.forEach(hours => {
                expect(hours['@type']).toBe('OpeningHoursSpecification');
                expect(hours.dayOfWeek).toBeDefined();
              });
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should generate complete homepage schema with multiple required schema types', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 1, maxLength: 500 }),
            url: generators.validUrl(),
            logo: fc.option(generators.validUrl()),
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
            faqs: fc.option(generators.faqData()),
            breadcrumbs: fc.option(generators.breadcrumbData())
          }),
          (homepageData) => {
            const schema = schemaGenerator.generateHomepageSchema(homepageData);
            
            expect(schema).toBeDefined();
            expect(schema['@context']).toBe('https://schema.org');
            expect(schema['@graph']).toBeDefined();
            expect(Array.isArray(schema['@graph'])).toBe(true);
            expect(schema['@graph'].length).toBeGreaterThan(0);
            
            // Verify required schema types are present (Req 1.2, 1.4, 4.2)
            const schemaTypes = schema['@graph'].map(s => s['@type']);
            expect(schemaTypes).toContain('Organization');
            expect(schemaTypes).toContain('WebSite');
            expect(schemaTypes).toContain('SoftwareApplication');
            
            // Verify each schema in the graph has required properties
            schema['@graph'].forEach(schemaItem => {
              assertions.validateSchemaTypeRequiredProperties(schemaItem, schemaItem['@type']);
            });
            
            // If FAQs provided, verify FAQ schema is included
            if (homepageData.faqs && homepageData.faqs.length > 0) {
              expect(schemaTypes).toContain('FAQPage');
            }
            
            // If breadcrumbs provided, verify breadcrumb schema is included
            if (homepageData.breadcrumbs && homepageData.breadcrumbs.length > 0) {
              expect(schemaTypes).toContain('BreadcrumbList');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should generate Article schema with required properties for blog posts', () => {
      fc.assert(
        fc.property(
          fc.record({
            headline: fc.string({ minLength: 1, maxLength: 110 }),
            description: fc.string({ minLength: 1, maxLength: 500 }),
            publishedDate: fc.date(),
            author: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
            image: fc.option(generators.validUrl())
          }),
          (articleData) => {
            const schema = schemaGenerator.generateArticleSchema({
              ...articleData,
              publishedDate: articleData.publishedDate.toISOString()
            });
            
            if (schema !== null) {
              expect(schema['@type']).toBe('Article');
              expect(schema['@context']).toBe('https://schema.org');
              expect(schema.headline).toBeDefined();
              expect(schema.datePublished).toBeDefined();
              
              // Verify Article specific properties
              expect(typeof schema.headline).toBe('string');
              expect(schema.headline.length).toBeLessThanOrEqual(110);
              expect(schema.datePublished).toMatch(/^\d{4}-\d{2}-\d{2}T/);
            }
          }
        ),
        { numRuns: testConfig.propertyTests.numRuns }
      );
    });

    test('should generate LocalBusiness schema with required properties', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.option(fc.string({ minLength: 1, maxLength: 500 })),
            address: fc.option(fc.record({
              street: fc.string(),
              city: fc.string(),
              state: fc.string(),
              postalCode: fc.string(),
              country: fc.string()
            })),
            telephone: fc.option(fc.string()),
            email: fc.option(fc.string())
          }),
          (businessData) => {
            const schema = schemaGenerator.generateLocalBusinessSchema(businessData);
            
            expect(schema).toBeDefined();
            expect(schema['@type']).toBe('LocalBusiness');
            expect(schema['@context']).toBe('https://schema.org');
            expect(schema.name).toBeDefined();
            
            // Verify LocalBusiness properties
            expect(typeof schema.name).toBe('string');
            expect(schema.name.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: testConfig.propertyTests.numRuns }
      );
    });

    test('should generate FAQ schema with valid structure', () => {
      fc.assert(
        fc.property(
          generators.faqData(),
          (faqs) => {
            const schema = schemaGenerator.generateFAQSchema(faqs);
            
            if (schema !== null) {
              expect(schema['@type']).toBe('FAQPage');
              expect(schema['@context']).toBe('https://schema.org');
              expect(schema.mainEntity).toBeDefined();
              expect(Array.isArray(schema.mainEntity)).toBe(true);
              
              // Verify each FAQ item
              schema.mainEntity.forEach(faq => {
                expect(faq['@type']).toBe('Question');
                expect(faq.name).toBeDefined();
                expect(faq.acceptedAnswer).toBeDefined();
                expect(faq.acceptedAnswer['@type']).toBe('Answer');
                expect(faq.acceptedAnswer.text).toBeDefined();
              });
            }
          }
        ),
        { numRuns: testConfig.propertyTests.numRuns }
      );
    });

    test('should generate Breadcrumb schema with valid structure', () => {
      fc.assert(
        fc.property(
          generators.breadcrumbData(),
          (breadcrumbs) => {
            const schema = schemaGenerator.generateBreadcrumbSchema(breadcrumbs);
            
            if (schema !== null) {
              expect(schema['@type']).toBe('BreadcrumbList');
              expect(schema['@context']).toBe('https://schema.org');
              expect(schema.itemListElement).toBeDefined();
              expect(Array.isArray(schema.itemListElement)).toBe(true);
              
              // Verify breadcrumb structure
              schema.itemListElement.forEach((item, index) => {
                expect(item['@type']).toBe('ListItem');
                expect(item.position).toBe(index + 1);
                expect(item.name).toBeDefined();
                expect(item.item).toBeDefined();
                expect(typeof item.name).toBe('string');
                expect(typeof item.item).toBe('string');
              });
            }
          }
        ),
        { numRuns: testConfig.propertyTests.numRuns }
      );
    });
  });

  /**
   * Schema Validation Property Tests
   */
  describe('Schema Validation Properties', () => {
    test('should validate any generated schema successfully', () => {
      fc.assert(
        fc.property(
          generators.schemaData(),
          fc.constantFrom(...Object.values(SchemaType)),
          (data, schemaType) => {
            const schema = schemaGenerator.getSchemaByType(schemaType, data);
            
            if (schema !== null) {
              const validation = schemaGenerator.validateSchema(schema);
              
              // Schema should be valid if it was generated successfully
              expect(validation).toBeDefined();
              expect(typeof validation.isValid).toBe('boolean');
              expect(Array.isArray(validation.issues)).toBe(true);
              expect(Array.isArray(validation.warnings)).toBe(true);
              expect(typeof validation.score).toBe('number');
              expect(validation.score).toBeGreaterThanOrEqual(0);
              expect(validation.score).toBeLessThanOrEqual(100);
            }
          }
        ),
        { numRuns: testConfig.propertyTests.numRuns }
      );
    });

    test('should handle invalid schema data gracefully', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(null),
            fc.constant(undefined),
            fc.constant({}),
            fc.record({
              invalidField: fc.string()
            })
          ),
          fc.constantFrom(...Object.values(SchemaType)),
          (invalidData, schemaType) => {
            // Should not throw errors with invalid data
            expect(() => {
              const schema = schemaGenerator.getSchemaByType(schemaType, invalidData);
              if (schema !== null) {
                schemaGenerator.validateSchema(schema);
              }
            }).not.toThrow();
          }
        ),
        { numRuns: testConfig.propertyTests.numRuns }
      );
    });
  });

  /**
   * Content Type Mapping Properties
   */
  describe('Content Type Mapping Properties', () => {
    test('should generate appropriate schema for each content type', () => {
      fc.assert(
        fc.property(
          generators.pageData(),
          (pageData) => {
            const result = schemaGenerator.generateSchema(pageData.type, pageData);
            
            if (result !== null) {
              // Verify schema type matches content type expectations
              const schemaType = result.data['@type'];
              
              switch (pageData.type) {
                case ContentType.HOMEPAGE:
                  // Homepage should generate multiple schemas in a graph
                  expect(result.data['@graph'] || schemaType).toBeDefined();
                  break;
                case ContentType.BLOG_POST:
                  expect(schemaType).toBe('Article');
                  break;
                case ContentType.PRODUCT_PAGE:
                  expect(schemaType).toBe('Product');
                  break;
                default:
                  expect(schemaType).toBeDefined();
              }
            }
          }
        ),
        { numRuns: testConfig.propertyTests.numRuns }
      );
    });
  });

  /**
   * JSON-LD Structure Properties
   */
  describe('JSON-LD Structure Properties', () => {
    test('should always produce valid JSON structure', () => {
      fc.assert(
        fc.property(
          generators.schemaData(),
          fc.constantFrom(...Object.values(ContentType)),
          (data, contentType) => {
            const result = schemaGenerator.generateSchema(contentType, data);
            
            if (result !== null) {
              // Should be serializable to JSON
              expect(() => JSON.stringify(result.data)).not.toThrow();
              
              // Should be parseable back from JSON
              const jsonString = JSON.stringify(result.data);
              expect(() => JSON.parse(jsonString)).not.toThrow();
              
              const parsed = JSON.parse(jsonString);
              expect(parsed).toEqual(result.data);
            }
          }
        ),
        { numRuns: testConfig.propertyTests.numRuns }
      );
    });

    test('should maintain schema.org context in all schemas', () => {
      fc.assert(
        fc.property(
          generators.schemaData(),
          fc.constantFrom(...Object.values(ContentType)),
          (data, contentType) => {
            const result = schemaGenerator.generateSchema(contentType, data);
            
            if (result !== null) {
              const schema = result.data;
              
              // Check for @context in main schema or graph items
              if (schema['@graph']) {
                schema['@graph'].forEach(item => {
                  expect(item['@context'] || schema['@context']).toBe('https://schema.org');
                });
              } else {
                expect(schema['@context']).toBe('https://schema.org');
              }
            }
          }
        ),
        { numRuns: testConfig.propertyTests.numRuns }
      );
    });
  });
});