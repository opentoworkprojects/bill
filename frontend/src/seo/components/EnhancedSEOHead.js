/**
 * Enhanced SEO Head Component
 * 
 * Comprehensive SEO component that combines meta tag optimization
 * with schema markup injection for complete SEO coverage.
 * 
 * @requirements 1.2, 1.5, 4.1, 4.2
 */

import React from 'react';
import PropTypes from 'prop-types';
import SEOHead from './SEOHead';
import SchemaInjector from './SchemaInjector';
import { ContentType, SchemaType } from '../types';

/**
 * Enhanced SEO component with meta tags and schema markup
 */
const EnhancedSEOHead = ({
  // Page data
  title,
  description,
  keywords = [],
  url,
  image,
  contentType = ContentType.HOMEPAGE,
  
  // Article-specific
  author,
  publishedDate,
  modifiedDate,
  
  // Schema configuration
  schemaTypes,
  schemaData = {},
  customSchema = null,
  includeDefaultSchemas = true,
  
  // SEO control flags
  noIndex = false,
  noFollow = false,
  
  // Custom overrides
  customMeta = {},
  
  // Callbacks
  onSchemaGenerated,
  onValidationComplete,
  onError,
  
  // Children
  children
}) => {
  // Prepare page data for both meta tags and schema
  const pageData = {
    title,
    description,
    keywords,
    url: url || (typeof window !== 'undefined' ? window.location.href : ''),
    image,
    author,
    publishedDate,
    modifiedDate,
    ...schemaData
  };

  // Determine schema types based on content type if not explicitly provided
  const getDefaultSchemaTypes = () => {
    if (!includeDefaultSchemas) return [];
    
    switch (contentType) {
      case ContentType.HOMEPAGE:
        return [
          SchemaType.ORGANIZATION,
          SchemaType.SOFTWARE_APPLICATION,
          SchemaType.LOCAL_BUSINESS
        ];
      case ContentType.PRODUCT_PAGE:
        return [
          SchemaType.SOFTWARE_APPLICATION,
          SchemaType.PRODUCT,
          SchemaType.ORGANIZATION
        ];
      case ContentType.BLOG_POST:
        return [
          SchemaType.ARTICLE,
          SchemaType.ORGANIZATION
        ];
      case ContentType.LANDING_PAGE:
        return [
          SchemaType.SOFTWARE_APPLICATION,
          SchemaType.ORGANIZATION,
          SchemaType.SERVICE
        ];
      case ContentType.CATEGORY_PAGE:
        return [
          SchemaType.ORGANIZATION
        ];
      default:
        return [SchemaType.ORGANIZATION];
    }
  };

  const finalSchemaTypes = schemaTypes || getDefaultSchemaTypes();

  return (
    <>
      {/* Meta Tags */}
      <SEOHead
        title={title}
        description={description}
        keywords={keywords}
        url={url}
        image={image}
        type={contentType}
        author={author}
        publishedDate={publishedDate}
        modifiedDate={modifiedDate}
        noIndex={noIndex}
        noFollow={noFollow}
        customMeta={customMeta}
        customSchema={null} // We handle schema separately
      />
      
      {/* Schema Markup */}
      <SchemaInjector
        contentType={contentType}
        pageData={pageData}
        schemaTypes={finalSchemaTypes}
        customSchema={customSchema}
        onSchemaGenerated={onSchemaGenerated}
        onValidationComplete={onValidationComplete}
        onError={onError}
      />
      
      {children}
    </>
  );
};

EnhancedSEOHead.propTypes = {
  // Basic page data
  title: PropTypes.string,
  description: PropTypes.string,
  keywords: PropTypes.arrayOf(PropTypes.string),
  url: PropTypes.string,
  image: PropTypes.string,
  contentType: PropTypes.oneOf(Object.values(ContentType)),
  
  // Article-specific
  author: PropTypes.string,
  publishedDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  modifiedDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  
  // Schema configuration
  schemaTypes: PropTypes.arrayOf(PropTypes.oneOf(Object.values(SchemaType))),
  schemaData: PropTypes.object,
  customSchema: PropTypes.object,
  includeDefaultSchemas: PropTypes.bool,
  
  // SEO control flags
  noIndex: PropTypes.bool,
  noFollow: PropTypes.bool,
  
  // Custom overrides
  customMeta: PropTypes.object,
  
  // Callbacks
  onSchemaGenerated: PropTypes.func,
  onValidationComplete: PropTypes.func,
  onError: PropTypes.func,
  
  // Children
  children: PropTypes.node
};

EnhancedSEOHead.defaultProps = {
  keywords: [],
  contentType: ContentType.HOMEPAGE,
  schemaData: {},
  includeDefaultSchemas: true,
  noIndex: false,
  noFollow: false,
  customMeta: {}
};

/**
 * Homepage SEO Component
 */
export const HomepageSEO = ({ 
  title = 'BillByteKOT - Best Restaurant Billing Software in India',
  description = 'Best restaurant billing software in India with FREE KOT system, thermal printing, GST billing & WhatsApp integration. Trusted by 500+ restaurants.',
  keywords = ['restaurant billing software', 'POS system', 'KOT software', 'restaurant management'],
  ...props 
}) => (
  <EnhancedSEOHead
    title={title}
    description={description}
    keywords={keywords}
    contentType={ContentType.HOMEPAGE}
    {...props}
  />
);

/**
 * Product Page SEO Component
 */
export const ProductPageSEO = ({ 
  title,
  description,
  keywords = ['restaurant software', 'billing system', 'POS system'],
  ...props 
}) => (
  <EnhancedSEOHead
    title={title}
    description={description}
    keywords={keywords}
    contentType={ContentType.PRODUCT_PAGE}
    {...props}
  />
);

/**
 * Blog Post SEO Component
 */
export const BlogPostSEO = ({ 
  title,
  description,
  author = 'BillByteKOT Team',
  keywords = ['restaurant management', 'restaurant tips', 'food business'],
  ...props 
}) => (
  <EnhancedSEOHead
    title={title}
    description={description}
    author={author}
    keywords={keywords}
    contentType={ContentType.BLOG_POST}
    {...props}
  />
);

/**
 * Landing Page SEO Component
 */
export const LandingPageSEO = ({ 
  title,
  description,
  keywords = ['restaurant POS', 'billing software', 'restaurant technology'],
  ...props 
}) => (
  <EnhancedSEOHead
    title={title}
    description={description}
    keywords={keywords}
    contentType={ContentType.LANDING_PAGE}
    {...props}
  />
);

/**
 * Category Page SEO Component
 */
export const CategoryPageSEO = ({ 
  title,
  description,
  keywords = ['restaurant solutions', 'business software', 'restaurant tools'],
  ...props 
}) => (
  <EnhancedSEOHead
    title={title}
    description={description}
    keywords={keywords}
    contentType={ContentType.CATEGORY_PAGE}
    {...props}
  />
);

export default EnhancedSEOHead;