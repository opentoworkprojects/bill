/**
 * Unit Tests for Schema Generator
 * 
 * Basic unit tests to verify schema generation functionality
 * before running property-based tests.
 * 
 * @requirements 1.2, 1.4, 4.2, 5.4
 */

import SchemaGenerator from '../core/SchemaGenerator';
import { ContentType, SchemaType } from '../types';

describe('SchemaGenerator', () => {
  let schemaGenerator;

  beforeEach(() => {
    schemaGenerator = new SchemaGenerator();
  });

  describe('Basic Schema Generation', () => {
    test('should create SchemaGenerator instance', () => {
      expect(schemaGenerator).toBeInstanceOf(SchemaGenerator);
    });

    test('should generate Organization schema', () => {
      const orgData = {
        name: 'BillByteKOT',
        url: 'https://billbytekot.in',
        description: 'Restaurant billing software'
      };

      const schema = schemaGenerator.generateOrganizationSchema(orgData);

      expect(schema).toBeDefined();
      expect(schema['@type']).toBe('Organization');
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema.name).toBe('BillByteKOT');
      expect(schema.url).toBe('https://billbytekot.in');
    });

    test('should generate SoftwareApplication schema', () => {
      const appData = {
        name: 'BillByteKOT',
        description: 'Restaurant billing and KOT management software',
        applicationCategory: 'BusinessApplication'
      };

      const schema = schemaGenerator.generateSoftwareApplicationSchema(appData);

      expect(schema).toBeDefined();
      expect(schema['@type']).toBe('SoftwareApplication');
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema.name).toBe('BillByteKOT');
      expect(schema.applicationCategory).toBe('BusinessApplication');
    });

    test('should generate Article schema for blog posts', () => {
      const articleData = {
        headline: 'Restaurant Management Tips',
        description: 'Tips for managing restaurants effectively',
        publishedDate: '2024-01-01T10:00:00Z',
        author: 'BillByteKOT Team'
      };

      const schema = schemaGenerator.generateArticleSchema(articleData);

      expect(schema).toBeDefined();
      expect(schema['@type']).toBe('Article');
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema.headline).toBe('Restaurant Management Tips');
      expect(schema.datePublished).toBe('2024-01-01T10:00:00.000Z');
    });

    test('should generate FAQ schema', () => {
      const faqs = [
        {
          question: 'What is BillByteKOT?',
          answer: 'BillByteKOT is a restaurant billing software with KOT management.'
        },
        {
          question: 'How much does it cost?',
          answer: 'BillByteKOT starts at ₹1999 per month.'
        }
      ];

      const schema = schemaGenerator.generateFAQSchema(faqs);

      expect(schema).toBeDefined();
      expect(schema['@type']).toBe('FAQPage');
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema.mainEntity).toHaveLength(2);
      expect(schema.mainEntity[0]['@type']).toBe('Question');
      expect(schema.mainEntity[0].acceptedAnswer['@type']).toBe('Answer');
    });

    test('should generate Breadcrumb schema', () => {
      const breadcrumbs = [
        { name: 'Home', url: 'https://billbytekot.in' },
        { name: 'Features', url: 'https://billbytekot.in/features' },
        { name: 'Billing', url: 'https://billbytekot.in/features/billing' }
      ];

      const schema = schemaGenerator.generateBreadcrumbSchema(breadcrumbs);

      expect(schema).toBeDefined();
      expect(schema['@type']).toBe('BreadcrumbList');
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema.itemListElement).toHaveLength(3);
      expect(schema.itemListElement[0].position).toBe(1);
      expect(schema.itemListElement[0].name).toBe('Home');
    });
  });

  describe('Schema Validation', () => {
    test('should validate valid schema', () => {
      const validSchema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'BillByteKOT'
      };

      const validation = schemaGenerator.validateSchema(validSchema);

      expect(validation.isValid).toBe(true);
      expect(validation.issues).toHaveLength(0);
      expect(validation.score).toBeGreaterThan(50); // Adjusted for enhanced validation
    });

    test('should detect invalid schema', () => {
      const invalidSchema = {
        // Missing @context and @type
        name: 'BillByteKOT'
      };

      const validation = schemaGenerator.validateSchema(invalidSchema);

      expect(validation.isValid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
      expect(validation.score).toBeLessThan(100);
    });
  });

  describe('Content Type Integration', () => {
    test('should generate schema for homepage', () => {
      const pageData = {
        title: 'BillByteKOT - Restaurant Billing Software',
        description: 'Best restaurant billing software in India',
        url: 'https://billbytekot.in'
      };

      const result = schemaGenerator.generateSchema(ContentType.HOMEPAGE, pageData);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.data['@context']).toBe('https://schema.org');
      expect(result.pageUrl).toBe('https://billbytekot.in');
      expect(result.lastUpdated).toBeInstanceOf(Date);
    });

    test('should generate schema for blog post', () => {
      const pageData = {
        headline: 'Restaurant Management Tips',
        description: 'Expert tips for restaurant management',
        publishedDate: '2024-01-01T10:00:00Z',
        url: 'https://billbytekot.in/blog/restaurant-tips'
      };

      const result = schemaGenerator.generateSchema(ContentType.BLOG_POST, pageData);

      expect(result).toBeDefined();
      expect(result.data['@type']).toBe('Article');
      expect(result.data.headline).toBe('Restaurant Management Tips');
    });

    test('should handle invalid content type gracefully', () => {
      const pageData = {
        title: 'Test Page'
      };

      const result = schemaGenerator.generateSchema('invalid_type', pageData);

      expect(result).toBeNull();
    });
  });

  describe('Error Handling', () => {
    test('should handle missing required fields', () => {
      // Article without required headline and publishedDate
      const invalidArticleData = {
        description: 'Article without headline'
      };

      const schema = schemaGenerator.generateArticleSchema(invalidArticleData);

      expect(schema).toBeNull();
    });

    test('should handle empty FAQ data', () => {
      const schema = schemaGenerator.generateFAQSchema([]);

      expect(schema).toBeNull();
    });

    test('should handle invalid FAQ data', () => {
      const invalidFaqs = [
        { question: '', answer: 'Answer without question' },
        { question: 'Question without answer', answer: '' }
      ];

      const schema = schemaGenerator.generateFAQSchema(invalidFaqs);

      expect(schema).toBeNull();
    });

    test('should handle empty breadcrumb data', () => {
      const schema = schemaGenerator.generateBreadcrumbSchema([]);

      expect(schema).toBeNull();
    });
  });

  describe('Schema Types', () => {
    test('should generate schema by type', () => {
      const data = {
        name: 'BillByteKOT',
        description: 'Restaurant software'
      };

      const schema = schemaGenerator.getSchemaByType(SchemaType.ORGANIZATION, data);

      expect(schema).toBeDefined();
      expect(schema['@type']).toBe('Organization');
    });

    test('should handle unknown schema type', () => {
      const data = { name: 'Test' };
      const schema = schemaGenerator.getSchemaByType('UnknownType', data);

      expect(schema).toBeNull();
    });

    test('should generate Service schema', () => {
      const serviceData = {
        name: 'Restaurant Management Service',
        serviceType: 'Software as a Service',
        description: 'Complete restaurant management solution'
      };

      const schema = schemaGenerator.generateServiceSchema(serviceData);

      expect(schema).toBeDefined();
      expect(schema['@type']).toBe('Service');
      expect(schema.name).toBe('Restaurant Management Service');
      expect(schema.serviceType).toBe('Software as a Service');
    });

    test('should generate HowTo schema', () => {
      const howToData = {
        name: 'How to Set Up Restaurant Billing',
        description: 'Step-by-step guide to set up billing system',
        step: [
          { name: 'Install Software', text: 'Download and install the software' },
          { name: 'Configure Settings', text: 'Set up your restaurant details' }
        ]
      };

      const schema = schemaGenerator.generateHowToSchema(howToData);

      expect(schema).toBeDefined();
      expect(schema['@type']).toBe('HowTo');
      expect(schema.step).toHaveLength(2);
      expect(schema.step[0].position).toBe(1);
    });

    test('should generate VideoObject schema', () => {
      const videoData = {
        name: 'Restaurant Software Demo',
        description: 'Complete demo of BillByteKOT features',
        uploadDate: '2024-01-01T10:00:00Z',
        thumbnailUrl: 'https://example.com/thumbnail.jpg'
      };

      const schema = schemaGenerator.generateVideoObjectSchema(videoData);

      expect(schema).toBeDefined();
      expect(schema['@type']).toBe('VideoObject');
      expect(schema.name).toBe('Restaurant Software Demo');
      expect(schema.uploadDate).toBe('2024-01-01T10:00:00.000Z');
    });

    test('should generate Event schema', () => {
      const eventData = {
        name: 'Restaurant Management Webinar',
        description: 'Learn restaurant management best practices',
        startDate: '2024-06-01T14:00:00Z',
        location: 'https://zoom.us/webinar'
      };

      const schema = schemaGenerator.generateEventSchema(eventData);

      expect(schema).toBeDefined();
      expect(schema['@type']).toBe('Event');
      expect(schema.name).toBe('Restaurant Management Webinar');
      expect(schema.startDate).toBe('2024-06-01T14:00:00.000Z');
    });
  describe('Enhanced Functionality', () => {
    test('should export schema as JSON-LD string', () => {
      const schema = {
        data: {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'BillByteKOT'
        }
      };

      const jsonLD = schemaGenerator.exportSchemaAsJsonLD(schema);

      expect(jsonLD).toBeDefined();
      expect(typeof jsonLD).toBe('string');
      expect(JSON.parse(jsonLD)).toEqual(schema.data);
    });

    test('should import schema from JSON-LD string', () => {
      const jsonLDString = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'BillByteKOT'
      });

      const schema = schemaGenerator.importSchemaFromJsonLD(jsonLDString);

      expect(schema).toBeDefined();
      expect(schema.type).toBe('Organization');
      expect(schema.data.name).toBe('BillByteKOT');
    });

    test('should merge multiple schemas', () => {
      const schemas = [
        {
          data: {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'BillByteKOT'
          }
        },
        {
          data: {
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'Restaurant Software'
          }
        }
      ];

      const merged = schemaGenerator.mergeSchemas(schemas);

      expect(merged).toBeDefined();
      expect(merged.type).toBe('Graph');
      expect(merged.data['@graph']).toHaveLength(2);
    });

    test('should validate for Google Rich Results', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'Test Article',
        author: { '@type': 'Person', name: 'Author' },
        datePublished: '2024-01-01T10:00:00Z'
      };

      const validation = schemaGenerator.validateForGoogleRichResults(schema);

      expect(validation).toBeDefined();
      expect(validation.googleRichResults).toBeDefined();
      expect(validation.googleRichResults.supportedType).toBe(true);
    });

    test('should generate SEO optimized schema', () => {
      const pageData = {
        title: 'BillByteKOT - Restaurant Software',
        description: 'Best restaurant billing software',
        name: 'BillByteKOT'
      };

      const result = schemaGenerator.generateSEOOptimizedSchema(ContentType.HOMEPAGE, pageData);

      expect(result).toBeDefined();
      expect(result.seoOptimized).toBe(true);
      expect(result.optimizations).toBeDefined();
    });
  });
});