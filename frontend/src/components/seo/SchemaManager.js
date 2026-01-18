import React from 'react';
import { Helmet } from 'react-helmet-async';
import PropTypes from 'prop-types';

/**
 * SchemaManager Component
 * 
 * Manages structured data (JSON-LD) for rich snippets in search results.
 * Implements schema.org types: SoftwareApplication, Organization, FAQPage,
 * Article, BreadcrumbList, LocalBusiness, Product.
 * 
 * @requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8
 */

// Schema validation helpers
const validateRequiredFields = (data, requiredFields, schemaType) => {
  const missingFields = requiredFields.filter(field => !data[field]);
  if (missingFields.length > 0) {
    console.warn(`SchemaManager: Missing required fields for ${schemaType}:`, missingFields);
    return false;
  }
  return true;
};

const isValidUrl = (url) => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const isValidDate = (dateString) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

// Schema generators
const generateSoftwareApplicationSchema = (data) => {
  const requiredFields = ['name', 'description'];
  if (!validateRequiredFields(data, requiredFields, 'SoftwareApplication')) {
    return null;
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: data.name,
    description: data.description,
    applicationCategory: data.applicationCategory || 'BusinessApplication',
    operatingSystem: data.operatingSystem || 'Web, Android, iOS, Windows',
    ...(data.offers && {
      offers: {
        '@type': 'Offer',
        price: data.offers.price || '1999',
        priceCurrency: data.offers.priceCurrency || 'INR',
        availability: data.offers.availability || 'https://schema.org/InStock',
      },
    }),
    ...(data.aggregateRating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: data.aggregateRating.ratingValue || 4.9,
        reviewCount: data.aggregateRating.reviewCount || 500,
        bestRating: data.aggregateRating.bestRating || 5,
        worstRating: data.aggregateRating.worstRating || 1,
      },
    }),
    ...(data.featureList && { featureList: data.featureList }),
    ...(data.screenshot && { screenshot: data.screenshot }),
    ...(data.softwareVersion && { softwareVersion: data.softwareVersion }),
  };
};

const generateOrganizationSchema = (data) => {
  const requiredFields = ['name'];
  if (!validateRequiredFields(data, requiredFields, 'Organization')) {
    return null;
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': data.id || 'https://billbytekot.in/#organization',
    name: data.name,
    ...(data.legalName && { legalName: data.legalName }),
    ...(isValidUrl(data.url) && { url: data.url }),
    ...(isValidUrl(data.logo) && {
      logo: {
        '@type': 'ImageObject',
        url: data.logo,
        width: data.logoWidth || 600,
        height: data.logoHeight || 60,
      },
    }),
    ...(data.description && { description: data.description }),
    ...(data.email && { email: data.email }),
    ...(data.telephone && { telephone: data.telephone }),
    ...(data.address && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: data.address.street,
        addressLocality: data.address.city,
        addressRegion: data.address.state,
        postalCode: data.address.postalCode,
        addressCountry: data.address.country || 'IN',
      },
    }),
    ...(data.sameAs && Array.isArray(data.sameAs) && { sameAs: data.sameAs }),
  };
};

const generateFAQPageSchema = (data) => {
  if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
    console.warn('SchemaManager: FAQPage requires at least one question');
    return null;
  }

  // Validate each question has required fields
  const validQuestions = data.questions.filter(q => 
    q.question && typeof q.question === 'string' && q.question.trim() &&
    q.answer && typeof q.answer === 'string' && q.answer.trim()
  );

  if (validQuestions.length === 0) {
    console.warn('SchemaManager: No valid questions found for FAQPage');
    return null;
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: validQuestions.map(q => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };
};

const generateArticleSchema = (data) => {
  const requiredFields = ['headline', 'datePublished'];
  if (!validateRequiredFields(data, requiredFields, 'Article')) {
    return null;
  }

  if (!isValidDate(data.datePublished)) {
    console.warn('SchemaManager: Invalid datePublished for Article');
    return null;
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: data.headline.substring(0, 110), // Google recommends max 110 chars
    ...(data.description && { description: data.description }),
    ...(isValidUrl(data.image) && { image: data.image }),
    datePublished: data.datePublished,
    ...(isValidDate(data.dateModified) && { dateModified: data.dateModified }),
    ...(data.author && {
      author: {
        '@type': 'Person',
        name: data.author.name || data.author,
        ...(data.author.url && { url: data.author.url }),
      },
    }),
    ...(data.publisher && {
      publisher: {
        '@type': 'Organization',
        name: data.publisher.name || 'BillByteKOT',
        ...(data.publisher.logo && {
          logo: {
            '@type': 'ImageObject',
            url: data.publisher.logo,
          },
        }),
      },
    }),
    ...(data.wordCount && { wordCount: data.wordCount }),
    ...(isValidUrl(data.mainEntityOfPage) && { mainEntityOfPage: data.mainEntityOfPage }),
  };
};

const generateBreadcrumbListSchema = (data) => {
  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    console.warn('SchemaManager: BreadcrumbList requires at least one item');
    return null;
  }

  // Validate each item has required fields
  const validItems = data.items.filter(item => 
    item.name && typeof item.name === 'string' &&
    item.url && isValidUrl(item.url)
  );

  if (validItems.length === 0) {
    console.warn('SchemaManager: No valid items found for BreadcrumbList');
    return null;
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: validItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
};

const generateLocalBusinessSchema = (data) => {
  const requiredFields = ['name'];
  if (!validateRequiredFields(data, requiredFields, 'LocalBusiness')) {
    return null;
  }

  return {
    '@context': 'https://schema.org',
    '@type': data.businessType || 'LocalBusiness',
    name: data.name,
    ...(data.description && { description: data.description }),
    ...(isValidUrl(data.image) && { image: data.image }),
    ...(data.telephone && { telephone: data.telephone }),
    ...(data.email && { email: data.email }),
    ...(isValidUrl(data.url) && { url: data.url }),
    ...(data.priceRange && { priceRange: data.priceRange }),
    ...(data.address && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: data.address.street,
        addressLocality: data.address.city,
        addressRegion: data.address.state,
        postalCode: data.address.postalCode,
        addressCountry: data.address.country || 'IN',
      },
    }),
    ...(data.geo && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: data.geo.latitude,
        longitude: data.geo.longitude,
      },
    }),
    ...(data.openingHours && { openingHoursSpecification: data.openingHours }),
    ...(data.aggregateRating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: data.aggregateRating.ratingValue,
        reviewCount: data.aggregateRating.reviewCount,
      },
    }),
  };
};

const generateProductSchema = (data) => {
  const requiredFields = ['name', 'description'];
  if (!validateRequiredFields(data, requiredFields, 'Product')) {
    return null;
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: data.name,
    description: data.description,
    ...(isValidUrl(data.image) && { image: data.image }),
    ...(data.brand && {
      brand: {
        '@type': 'Brand',
        name: data.brand,
      },
    }),
    ...(data.sku && { sku: data.sku }),
    ...(data.offers && {
      offers: {
        '@type': 'Offer',
        price: data.offers.price,
        priceCurrency: data.offers.priceCurrency || 'INR',
        availability: data.offers.availability || 'https://schema.org/InStock',
        ...(isValidUrl(data.offers.url) && { url: data.offers.url }),
        ...(isValidDate(data.offers.priceValidUntil) && { 
          priceValidUntil: data.offers.priceValidUntil 
        }),
      },
    }),
    ...(data.aggregateRating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: data.aggregateRating.ratingValue,
        reviewCount: data.aggregateRating.reviewCount,
        bestRating: data.aggregateRating.bestRating || 5,
        worstRating: data.aggregateRating.worstRating || 1,
      },
    }),
  };
};

// Schema type to generator mapping
const schemaGenerators = {
  SoftwareApplication: generateSoftwareApplicationSchema,
  Organization: generateOrganizationSchema,
  FAQPage: generateFAQPageSchema,
  Article: generateArticleSchema,
  BreadcrumbList: generateBreadcrumbListSchema,
  LocalBusiness: generateLocalBusinessSchema,
  Product: generateProductSchema,
};

/**
 * Generate schema JSON-LD for a given type and data
 * @param {string} type - Schema type
 * @param {object} data - Schema data
 * @returns {object|null} - Generated schema or null if invalid
 */
export const generateSchema = (type, data) => {
  const generator = schemaGenerators[type];
  if (!generator) {
    console.warn(`SchemaManager: Unknown schema type: ${type}`);
    return null;
  }
  return generator(data);
};

/**
 * Validate schema data for a given type
 * @param {string} type - Schema type
 * @param {object} data - Schema data
 * @returns {boolean} - Whether the schema is valid
 */
export const validateSchema = (type, data) => {
  const schema = generateSchema(type, data);
  return schema !== null;
};

const SchemaManager = ({ type, data }) => {
  // Generate the schema
  const schema = generateSchema(type, data);
  
  // Don't render if schema is invalid
  if (!schema) {
    return null;
  }

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

SchemaManager.propTypes = {
  type: PropTypes.oneOf([
    'SoftwareApplication',
    'Organization',
    'FAQPage',
    'Article',
    'BreadcrumbList',
    'LocalBusiness',
    'Product',
  ]).isRequired,
  data: PropTypes.object.isRequired,
};

export default SchemaManager;
