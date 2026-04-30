/**
 * SEO Enhancement System - Main Export
 * 
 * Central export point for all SEO components, hooks, and utilities.
 * Provides easy access to the complete SEO enhancement system.
 * 
 * @requirements 4.1, 4.2, 6.1
 */

// Main SEO Manager
export { default as SEOManager } from './SEOManager.js';

// Core SEO engines
export { default as SchemaGenerator } from './core/SchemaGenerator';
export { default as MetaTagOptimizer } from './core/MetaTagOptimizer';
export { default as TechnicalSEOEngine } from './core/TechnicalSEOEngine';
export { default as SitemapManager } from './core/SitemapManager';

// Content Management Components
export { default as ContentManager } from './core/ContentManager.js';
export { default as BlogContentOptimizer } from './core/BlogContentOptimizer.js';
export { default as InternalLinkBuilder } from './core/InternalLinkBuilder.js';
export { default as ContentAnalytics } from './core/ContentAnalytics.js';

// Analytics and Tracking Components
export { default as SearchConsoleAPI } from './core/SearchConsoleAPI.js';
export { default as KeywordTracker } from './core/KeywordTracker.js';
export { default as AnalyticsEngine } from './core/AnalyticsEngine.js';

// Specialized SEO Components
export { default as LocalSEOManager } from './core/LocalSEOManager.js';
export { default as CompetitorAnalyzer } from './core/CompetitorAnalyzer.js';

// Configuration
export { default as SEOConfig, getConfig, setConfig, getPrimaryKeywords, getSecondaryKeywords, getTargetLocations, getCompetitorDomains } from './config/SEOConfig';

// Types and constants
export * from './types';

// React Components
export { default as SEOHead } from './components/SEOHead';
export { default as EnhancedSEOHead } from './components/EnhancedSEOHead';
export { default as SchemaInjector } from './components/SchemaInjector';
export { default as SEODashboard } from './components/SEODashboard.js';
export { default as ContentOptimizer } from './components/ContentOptimizer.js';

// React Hooks
export { 
  useSchema, 
  useHomepageSchema, 
  useProductSchema, 
  useBlogPostSchema, 
  useLandingPageSchema, 
  useCategoryPageSchema 
} from './hooks/useSchema';

// Specialized SEO Components
export {
  HomepageSEO,
  ProductPageSEO,
  BlogPostSEO,
  LandingPageSEO,
  CategoryPageSEO
} from './components/EnhancedSEOHead';

// Schema Injector Components
export {
  HomepageSchemaInjector,
  ProductPageSchemaInjector,
  BlogPostSchemaInjector,
  LandingPageSchemaInjector,
  FAQPageSchemaInjector,
  BreadcrumbSchemaInjector,
  HowToSchemaInjector,
  VideoSchemaInjector,
  EventSchemaInjector,
  CourseSchemaInjector
} from './components/SchemaInjector';

// Utility functions
export * from './utils';

/**
 * Quick schema generation utility
 * @param {string} type - Content type
 * @param {Object} data - Page data
 * @returns {Object} Generated schema
 */
export const generateQuickSchema = (type, data) => {
  const generator = new SchemaGenerator();
  return generator.generateSchema(type, data);
};

/**
 * Quick meta tag optimization
 * @param {Object} pageData - Page data
 * @returns {Object} Optimized meta tags
 */
export const optimizeMetaTags = (pageData) => {
  const optimizer = new MetaTagOptimizer();
  return optimizer.optimizeMetaTags(pageData);
};

/**
 * Validate schema markup
 * @param {Object} schema - Schema to validate
 * @returns {Object} Validation result
 */
export const validateSchema = (schema) => {
  const generator = new SchemaGenerator();
  return generator.validateSchema(schema);
};

/**
 * Generate comprehensive SEO data for a page
 * @param {Object} pageData - Page data
 * @returns {Object} Complete SEO data including meta tags and schema
 */
export const generateCompleteSEO = (pageData) => {
  const metaOptimizer = new MetaTagOptimizer();
  const schemaGenerator = new SchemaGenerator();
  const seoEngine = new TechnicalSEOEngine();

  const metaTags = metaOptimizer.optimizeMetaTags(pageData);
  const schema = schemaGenerator.generateSchema(pageData.type, pageData);
  const structuredData = seoEngine.generateStructuredData(pageData.type, pageData);

  return {
    metaTags,
    schema,
    structuredData,
    validation: schema ? schemaGenerator.validateSchema(schema.data) : null
  };
};

/**
 * Initialize complete SEO system
 * @param {Object} config - SEO configuration
 * @returns {SEOManager} Initialized SEO manager
 */
export const initializeSEO = (config = {}) => {
  return new SEOManager(config);
};