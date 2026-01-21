/**
 * Schema Integration Tests
 * 
 * Tests for React schema integration components and hooks.
 * Validates that schema markup is properly generated and injected.
 * 
 * @requirements 1.2, 4.2
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import '@testing-library/jest-dom';

import { useSchema } from '../hooks/useSchema';
import SchemaInjector, { HomepageSchemaInjector, ProductPageSchemaInjector } from '../components/SchemaInjector';
import { HomepageSEO, ProductPageSEO } from '../components/EnhancedSEOHead';
import { ContentType, SchemaType } from '../types';

// Mock component to test useSchema hook
const TestSchemaHook = ({ contentType, pageData, onSchemaGenerated }) => {
  const { schema, isLoading, error, generateSchema } = useSchema({
    contentType,
    pageData,
    autoGenerate: true
  });

  React.useEffect(() => {
    if (schema && onSchemaGenerated) {
      onSchemaGenerated(schema);
    }
  }, [schema, onSchemaGenerated]);

  if (isLoading) return <div>Loading schema...</div>;
  if (error) return <div>Error: {error}</div>;
  if (schema) return <div>Schema generated: {schema.type}</div>;
  return <div>No schema</div>;
};

// Wrapper component for Helmet tests
const HelmetWrapper = ({ children }) => (
  <HelmetProvider>
    {children}
  </HelmetProvider>
);

describe('Schema Integration', () => {
  describe('useSchema Hook', () => {
    it('should generate schema for homepage content', async () => {
      const mockOnSchemaGenerated = jest.fn();
      const pageData = {
        title: 'BillByteKOT - Restaurant Software',
        description: 'Best restaurant billing software',
        url: 'https://billbytekot.in'
      };

      render(
        <TestSchemaHook
          contentType={ContentType.HOMEPAGE}
          pageData={pageData}
          onSchemaGenerated={mockOnSchemaGenerated}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Schema generated/)).toBeInTheDocument();
      });

      expect(mockOnSchemaGenerated).toHaveBeenCalled();
      const generatedSchema = mockOnSchemaGenerated.mock.calls[0][0];
      expect(generatedSchema).toBeDefined();
      expect(generatedSchema.data).toBeDefined();
    });

    it('should generate schema for product page content', async () => {
      const mockOnSchemaGenerated = jest.fn();
      const pageData = {
        title: 'Restaurant Billing Software',
        description: 'Complete billing solution',
        price: '1999',
        currency: 'INR'
      };

      render(
        <TestSchemaHook
          contentType={ContentType.PRODUCT_PAGE}
          pageData={pageData}
          onSchemaGenerated={mockOnSchemaGenerated}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Schema generated/)).toBeInTheDocument();
      });

      expect(mockOnSchemaGenerated).toHaveBeenCalled();
    });

    it('should handle schema generation errors gracefully', async () => {
      const pageData = null; // Invalid data to trigger error

      render(
        <TestSchemaHook
          contentType={ContentType.HOMEPAGE}
          pageData={pageData}
        />
      );

      // Should not crash and should handle error state
      expect(screen.getByText(/No schema|Error/)).toBeInTheDocument();
    });
  });

  describe('SchemaInjector Component', () => {
    it('should inject schema markup into page head', async () => {
      const pageData = {
        title: 'Test Page',
        description: 'Test description'
      };

      render(
        <HelmetWrapper>
          <SchemaInjector
            contentType={ContentType.HOMEPAGE}
            pageData={pageData}
          />
        </HelmetWrapper>
      );

      // Wait for schema to be generated and injected
      await waitFor(() => {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        expect(scripts.length).toBeGreaterThan(0);
      });
    });

    it('should handle custom schema injection', async () => {
      const customSchema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Test Organization'
      };

      render(
        <HelmetWrapper>
          <SchemaInjector
            customSchema={{ data: customSchema }}
          />
        </HelmetWrapper>
      );

      await waitFor(() => {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        expect(scripts.length).toBeGreaterThan(0);
        
        const schemaScript = scripts[0];
        const schemaData = JSON.parse(schemaScript.textContent);
        expect(schemaData.name).toBe('Test Organization');
      });
    });
  });

  describe('Specialized Schema Injectors', () => {
    it('should render HomepageSchemaInjector with correct schema types', async () => {
      const pageData = {
        name: 'BillByteKOT',
        description: 'Restaurant software'
      };

      render(
        <HelmetWrapper>
          <HomepageSchemaInjector pageData={pageData} />
        </HelmetWrapper>
      );

      await waitFor(() => {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        expect(scripts.length).toBeGreaterThan(0);
      });
    });

    it('should render ProductPageSchemaInjector with product schema', async () => {
      const pageData = {
        name: 'Restaurant Billing Software',
        price: '1999',
        currency: 'INR'
      };

      render(
        <HelmetWrapper>
          <ProductPageSchemaInjector pageData={pageData} />
        </HelmetWrapper>
      );

      await waitFor(() => {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        expect(scripts.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Enhanced SEO Components', () => {
    it('should render HomepageSEO with meta tags and schema', async () => {
      render(
        <HelmetWrapper>
          <HomepageSEO
            title="Test Homepage"
            description="Test description"
            keywords={['test', 'homepage']}
          />
        </HelmetWrapper>
      );

      await waitFor(() => {
        // Check for meta tags
        expect(document.title).toBe('Test Homepage');
        
        // Check for schema scripts
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        expect(scripts.length).toBeGreaterThan(0);
      });
    });

    it('should render ProductPageSEO with product-specific schema', async () => {
      render(
        <HelmetWrapper>
          <ProductPageSEO
            title="Test Product"
            description="Test product description"
            schemaData={{
              name: 'Test Product',
              price: '999',
              currency: 'USD'
            }}
          />
        </HelmetWrapper>
      );

      await waitFor(() => {
        expect(document.title).toBe('Test Product');
        
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        expect(scripts.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Schema Validation', () => {
    it('should validate generated schema markup', async () => {
      const mockOnValidationComplete = jest.fn();
      
      render(
        <HelmetWrapper>
          <SchemaInjector
            contentType={ContentType.HOMEPAGE}
            pageData={{ title: 'Test', description: 'Test' }}
            onValidationComplete={mockOnValidationComplete}
          />
        </HelmetWrapper>
      );

      await waitFor(() => {
        expect(mockOnValidationComplete).toHaveBeenCalled();
      });

      const validation = mockOnValidationComplete.mock.calls[0][0];
      expect(validation).toBeDefined();
      expect(typeof validation.isValid).toBe('boolean');
      expect(Array.isArray(validation.issues)).toBe(true);
      expect(Array.isArray(validation.warnings)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle schema generation errors', async () => {
      const mockOnError = jest.fn();
      
      render(
        <HelmetWrapper>
          <SchemaInjector
            contentType="invalid_type"
            pageData={{}}
            onError={mockOnError}
          />
        </HelmetWrapper>
      );

      // Should not crash the component
      expect(document.body).toBeInTheDocument();
    });

    it('should handle invalid JSON-LD gracefully', async () => {
      const invalidSchema = {
        data: {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          // Circular reference to cause JSON.stringify to fail
          circular: {}
        }
      };
      invalidSchema.data.circular = invalidSchema.data;

      render(
        <HelmetWrapper>
          <SchemaInjector customSchema={invalidSchema} />
        </HelmetWrapper>
      );

      // Should not crash
      expect(document.body).toBeInTheDocument();
    });
  });
});

describe('Schema Integration Performance', () => {
  it('should cache schema generation results', async () => {
    const pageData = {
      title: 'Performance Test',
      description: 'Testing caching'
    };

    const { rerender } = render(
      <HelmetWrapper>
        <SchemaInjector
          contentType={ContentType.HOMEPAGE}
          pageData={pageData}
        />
      </HelmetWrapper>
    );

    await waitFor(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      expect(scripts.length).toBeGreaterThan(0);
    });

    const initialScriptCount = document.querySelectorAll('script[type="application/ld+json"]').length;

    // Re-render with same data should use cache
    rerender(
      <HelmetWrapper>
        <SchemaInjector
          contentType={ContentType.HOMEPAGE}
          pageData={pageData}
        />
      </HelmetWrapper>
    );

    // Should not duplicate scripts
    const finalScriptCount = document.querySelectorAll('script[type="application/ld+json"]').length;
    expect(finalScriptCount).toBe(initialScriptCount);
  });

  it('should handle multiple schema injectors on same page', async () => {
    render(
      <HelmetWrapper>
        <div>
          <HomepageSchemaInjector pageData={{ name: 'Test 1' }} />
          <ProductPageSchemaInjector pageData={{ name: 'Test 2' }} />
        </div>
      </HelmetWrapper>
    );

    await waitFor(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      expect(scripts.length).toBeGreaterThanOrEqual(2);
    });
  });
});