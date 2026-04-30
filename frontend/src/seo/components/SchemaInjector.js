/**
 * Schema Injector Component
 * 
 * React component that injects JSON-LD structured data into the page head.
 * Works with the useSchema hook to provide seamless schema integration.
 * 
 * @requirements 1.2, 4.2
 */

import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import PropTypes from 'prop-types';
import { useSchema } from '../hooks/useSchema';
import { ContentType, SchemaType } from '../types';

/**
 * Component that injects schema markup into page head
 */
const SchemaInjector = ({
  contentType,
  pageData,
  schemaTypes,
  customSchema,
  autoGenerate = true,
  validateSchema = true,
  onSchemaGenerated,
  onValidationComplete,
  onError,
  children
}) => {
  const {
    schema,
    isLoading,
    error,
    validation,
    generateSchema,
    generateMultipleSchemas,
    generateSchemaByType
  } = useSchema({
    contentType,
    pageData,
    autoGenerate: false, // We'll control generation manually
    validateSchema
  });

  // Generate schema based on props
  useEffect(() => {
    if (!autoGenerate) return;

    const generateSchemaData = async () => {
      try {
        let result = null;

        if (customSchema) {
          // Use custom schema if provided
          result = customSchema;
        } else if (schemaTypes && Array.isArray(schemaTypes)) {
          // Generate multiple schemas
          result = await generateMultipleSchemas(schemaTypes, pageData);
        } else if (contentType) {
          // Generate single schema based on content type
          result = await generateSchema(pageData);
        }

        if (result && onSchemaGenerated) {
          onSchemaGenerated(result);
        }
      } catch (err) {
        console.error('Schema generation failed:', err);
        if (onError) {
          onError(err);
        }
      }
    };

    generateSchemaData();
  }, [
    contentType,
    JSON.stringify(pageData),
    JSON.stringify(schemaTypes),
    JSON.stringify(customSchema),
    autoGenerate
  ]);

  // Handle validation completion
  useEffect(() => {
    if (validation && onValidationComplete) {
      onValidationComplete(validation);
    }
  }, [validation, onValidationComplete]);

  // Handle errors
  useEffect(() => {
    if (error && onError) {
      onError(new Error(error));
    }
  }, [error, onError]);

  // Render schema in head
  const renderSchema = () => {
    if (!schema?.data) return null;

    try {
      const jsonLD = JSON.stringify(schema.data, null, 0);
      
      return (
        <Helmet>
          <script type="application/ld+json">
            {jsonLD}
          </script>
        </Helmet>
      );
    } catch (err) {
      console.error('Failed to render schema:', err);
      return null;
    }
  };

  return (
    <>
      {renderSchema()}
      {children}
    </>
  );
};

SchemaInjector.propTypes = {
  contentType: PropTypes.oneOf(Object.values(ContentType)),
  pageData: PropTypes.object,
  schemaTypes: PropTypes.arrayOf(PropTypes.oneOf(Object.values(SchemaType))),
  customSchema: PropTypes.object,
  autoGenerate: PropTypes.bool,
  validateSchema: PropTypes.bool,
  onSchemaGenerated: PropTypes.func,
  onValidationComplete: PropTypes.func,
  onError: PropTypes.func,
  children: PropTypes.node
};

SchemaInjector.defaultProps = {
  pageData: {},
  autoGenerate: true,
  validateSchema: true
};

/**
 * Homepage Schema Injector
 */
export const HomepageSchemaInjector = ({ pageData = {}, ...props }) => (
  <SchemaInjector
    contentType={ContentType.HOMEPAGE}
    schemaTypes={[
      SchemaType.ORGANIZATION,
      SchemaType.SOFTWARE_APPLICATION,
      SchemaType.LOCAL_BUSINESS
    ]}
    pageData={pageData}
    {...props}
  />
);

/**
 * Product Page Schema Injector
 */
export const ProductPageSchemaInjector = ({ pageData = {}, ...props }) => (
  <SchemaInjector
    contentType={ContentType.PRODUCT_PAGE}
    schemaTypes={[
      SchemaType.SOFTWARE_APPLICATION,
      SchemaType.PRODUCT,
      SchemaType.ORGANIZATION
    ]}
    pageData={pageData}
    {...props}
  />
);

/**
 * Blog Post Schema Injector
 */
export const BlogPostSchemaInjector = ({ pageData = {}, ...props }) => (
  <SchemaInjector
    contentType={ContentType.BLOG_POST}
    schemaTypes={[
      SchemaType.ARTICLE,
      SchemaType.ORGANIZATION
    ]}
    pageData={pageData}
    {...props}
  />
);

/**
 * Landing Page Schema Injector
 */
export const LandingPageSchemaInjector = ({ pageData = {}, ...props }) => (
  <SchemaInjector
    contentType={ContentType.LANDING_PAGE}
    schemaTypes={[
      SchemaType.SOFTWARE_APPLICATION,
      SchemaType.ORGANIZATION,
      SchemaType.SERVICE
    ]}
    pageData={pageData}
    {...props}
  />
);

/**
 * FAQ Page Schema Injector
 */
export const FAQPageSchemaInjector = ({ faqs = [], pageData = {}, ...props }) => (
  <SchemaInjector
    schemaTypes={[SchemaType.FAQ_PAGE]}
    pageData={{ ...pageData, faqs }}
    {...props}
  />
);

/**
 * Breadcrumb Schema Injector
 */
export const BreadcrumbSchemaInjector = ({ breadcrumbs = [], pageData = {}, ...props }) => (
  <SchemaInjector
    schemaTypes={[SchemaType.BREADCRUMB_LIST]}
    pageData={{ ...pageData, breadcrumbs }}
    {...props}
  />
);

/**
 * HowTo Schema Injector for tutorial content
 */
export const HowToSchemaInjector = ({ steps = [], pageData = {}, ...props }) => (
  <SchemaInjector
    schemaTypes={[SchemaType.HOW_TO]}
    pageData={{ ...pageData, step: steps }}
    {...props}
  />
);

/**
 * Video Schema Injector
 */
export const VideoSchemaInjector = ({ videoData = {}, pageData = {}, ...props }) => (
  <SchemaInjector
    schemaTypes={[SchemaType.VIDEO_OBJECT]}
    pageData={{ ...pageData, ...videoData }}
    {...props}
  />
);

/**
 * Event Schema Injector
 */
export const EventSchemaInjector = ({ eventData = {}, pageData = {}, ...props }) => (
  <SchemaInjector
    schemaTypes={[SchemaType.EVENT]}
    pageData={{ ...pageData, ...eventData }}
    {...props}
  />
);

/**
 * Course Schema Injector
 */
export const CourseSchemaInjector = ({ courseData = {}, pageData = {}, ...props }) => (
  <SchemaInjector
    schemaTypes={[SchemaType.COURSE]}
    pageData={{ ...pageData, ...courseData }}
    {...props}
  />
);

export default SchemaInjector;