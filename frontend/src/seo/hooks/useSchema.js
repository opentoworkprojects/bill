/**
 * React Hook for Schema Integration
 * 
 * Custom hook that provides schema generation and injection functionality
 * for React components. Integrates with the enhanced SchemaGenerator.
 * 
 * @requirements 1.2, 4.2
 */

import { useState, useEffect, useMemo } from 'react';
import SchemaGenerator from '../core/SchemaGenerator';
import { ContentType, SchemaType } from '../types';

/**
 * Custom hook for schema generation and management
 * @param {Object} options - Hook configuration options
 * @returns {Object} Schema utilities and state
 */
export const useSchema = (options = {}) => {
  const {
    contentType = ContentType.HOMEPAGE,
    pageData = {},
    autoGenerate = true,
    cacheEnabled = true,
    validateSchema = true
  } = options;

  const [schema, setSchema] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validation, setValidation] = useState(null);

  // Initialize schema generator with caching
  const schemaGenerator = useMemo(() => {
    return new SchemaGenerator();
  }, []);

  /**
   * Generate schema for the current page
   * @param {Object} data - Page data for schema generation
   * @param {Object} generateOptions - Generation options
   * @returns {Promise<Object>} Generated schema
   */
  const generateSchema = async (data = {}, generateOptions = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const mergedData = { ...pageData, ...data };
      const mergedOptions = { 
        skipCache: !cacheEnabled,
        validate: validateSchema,
        ...generateOptions 
      };

      const generatedSchema = schemaGenerator.generateSchema(
        contentType,
        mergedData,
        mergedOptions
      );

      if (generatedSchema) {
        setSchema(generatedSchema);
        setValidation(generatedSchema.validation);
        return generatedSchema;
      } else {
        throw new Error('Schema generation returned null');
      }
    } catch (err) {
      console.error('Schema generation failed:', err);
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Generate multiple schemas for complex pages
   * @param {Array} schemaTypes - Array of schema types to generate
   * @param {Object} data - Page data
   * @param {Object} generateOptions - Generation options
   * @returns {Promise<Object>} Combined schema graph
   */
  const generateMultipleSchemas = async (schemaTypes, data = {}, generateOptions = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const mergedData = { ...pageData, ...data };
      const mergedOptions = { 
        skipCache: !cacheEnabled,
        validate: validateSchema,
        ...generateOptions 
      };

      const generatedSchema = schemaGenerator.generateMultipleSchemas(
        schemaTypes,
        mergedData,
        mergedOptions
      );

      if (generatedSchema) {
        setSchema(generatedSchema);
        if (generatedSchema.validation) {
          setValidation(generatedSchema.validation);
        }
        return generatedSchema;
      } else {
        throw new Error('Multiple schema generation returned null');
      }
    } catch (err) {
      console.error('Multiple schema generation failed:', err);
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Generate schema by specific type
   * @param {SchemaType} schemaType - Specific schema type
   * @param {Object} data - Schema data
   * @param {Object} generateOptions - Generation options
   * @returns {Promise<Object>} Generated schema
   */
  const generateSchemaByType = async (schemaType, data = {}, generateOptions = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const mergedData = { ...pageData, ...data };
      const mergedOptions = { 
        skipCache: !cacheEnabled,
        validate: validateSchema,
        ...generateOptions 
      };

      const generatedSchema = schemaGenerator.getSchemaByType(
        schemaType,
        mergedData,
        mergedOptions
      );

      if (generatedSchema) {
        const schemaResult = {
          type: schemaType,
          context: 'https://schema.org',
          data: generatedSchema,
          pageUrl: mergedData.url || window.location.href,
          lastUpdated: new Date(),
          contentType
        };

        // Validate if requested
        if (validateSchema) {
          schemaResult.validation = schemaGenerator.validateSchema(generatedSchema);
          setValidation(schemaResult.validation);
        }

        setSchema(schemaResult);
        return schemaResult;
      } else {
        throw new Error(`Schema generation failed for type: ${schemaType}`);
      }
    } catch (err) {
      console.error('Schema generation by type failed:', err);
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update schema data without regenerating
   * @param {Object} newData - New data to merge
   */
  const updateSchemaData = (newData) => {
    if (schema && newData) {
      const updatedSchema = {
        ...schema,
        data: {
          ...schema.data,
          ...newData
        },
        lastUpdated: new Date()
      };
      setSchema(updatedSchema);
    }
  };

  /**
   * Clear current schema
   */
  const clearSchema = () => {
    setSchema(null);
    setValidation(null);
    setError(null);
  };

  /**
   * Export schema as JSON-LD string
   * @param {Object} exportOptions - Export options
   * @returns {string|null} JSON-LD string
   */
  const exportSchemaAsJsonLD = (exportOptions = {}) => {
    if (!schema) return null;
    return schemaGenerator.exportSchemaAsJsonLD(schema, exportOptions);
  };

  /**
   * Validate current schema
   * @returns {Object|null} Validation result
   */
  const validateCurrentSchema = () => {
    if (!schema?.data) return null;
    const validationResult = schemaGenerator.validateSchema(schema.data);
    setValidation(validationResult);
    return validationResult;
  };

  /**
   * Get schema for Google Rich Results validation
   * @returns {Object|null} Google-specific validation
   */
  const validateForGoogleRichResults = () => {
    if (!schema?.data) return null;
    return schemaGenerator.validateForGoogleRichResults(schema.data);
  };

  // Auto-generate schema on mount or when dependencies change
  useEffect(() => {
    if (autoGenerate && Object.keys(pageData).length > 0) {
      generateSchema();
    }
  }, [contentType, JSON.stringify(pageData), autoGenerate]);

  return {
    // State
    schema,
    isLoading,
    error,
    validation,
    
    // Actions
    generateSchema,
    generateMultipleSchemas,
    generateSchemaByType,
    updateSchemaData,
    clearSchema,
    
    // Utilities
    exportSchemaAsJsonLD,
    validateCurrentSchema,
    validateForGoogleRichResults,
    
    // Schema generator instance (for advanced usage)
    schemaGenerator
  };
};

/**
 * Hook for homepage schema generation
 * @param {Object} pageData - Homepage data
 * @returns {Object} Schema utilities
 */
export const useHomepageSchema = (pageData = {}) => {
  return useSchema({
    contentType: ContentType.HOMEPAGE,
    pageData,
    autoGenerate: true
  });
};

/**
 * Hook for product page schema generation
 * @param {Object} pageData - Product page data
 * @returns {Object} Schema utilities
 */
export const useProductSchema = (pageData = {}) => {
  return useSchema({
    contentType: ContentType.PRODUCT_PAGE,
    pageData,
    autoGenerate: true
  });
};

/**
 * Hook for blog post schema generation
 * @param {Object} pageData - Blog post data
 * @returns {Object} Schema utilities
 */
export const useBlogPostSchema = (pageData = {}) => {
  return useSchema({
    contentType: ContentType.BLOG_POST,
    pageData,
    autoGenerate: true
  });
};

/**
 * Hook for landing page schema generation
 * @param {Object} pageData - Landing page data
 * @returns {Object} Schema utilities
 */
export const useLandingPageSchema = (pageData = {}) => {
  return useSchema({
    contentType: ContentType.LANDING_PAGE,
    pageData,
    autoGenerate: true
  });
};

/**
 * Hook for category page schema generation
 * @param {Object} pageData - Category page data
 * @returns {Object} Schema utilities
 */
export const useCategoryPageSchema = (pageData = {}) => {
  return useSchema({
    contentType: ContentType.CATEGORY_PAGE,
    pageData,
    autoGenerate: true
  });
};

export default useSchema;