/**
 * SEO Head Component
 * 
 * React component that integrates with the existing SEO infrastructure
 * to provide comprehensive SEO meta tags and structured data.
 * 
 * @requirements 4.1, 4.2
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';
import PropTypes from 'prop-types';
import TechnicalSEOEngine from '../core/TechnicalSEOEngine';
import { ContentType } from '../types';

const SEOHead = ({
  // Page data
  title,
  description,
  keywords = [],
  url,
  image,
  type = ContentType.HOMEPAGE,
  
  // Article-specific
  author,
  publishedDate,
  modifiedDate,
  
  // Schema data
  schemaData = {},
  
  // Control flags
  noIndex = false,
  noFollow = false,
  
  // Custom overrides
  customMeta = {},
  customSchema = null
}) => {
  // Initialize SEO engine
  const seoEngine = new TechnicalSEOEngine();
  
  // Prepare page data
  const pageData = {
    title,
    description,
    keywords,
    url,
    image,
    type,
    author,
    publishedDate,
    modifiedDate,
    noIndex,
    noFollow,
    ...customMeta
  };

  // Generate optimized meta tags
  const metaTags = seoEngine.optimizeMetaTags(pageData);
  
  // Generate structured data
  const structuredData = customSchema || seoEngine.generateStructuredData(type, {
    ...pageData,
    ...schemaData
  });

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{metaTags.title}</title>
      <meta name="description" content={metaTags.description} />
      {metaTags.keywords && <meta name="keywords" content={metaTags.keywords} />}
      <meta name="robots" content={metaTags.robots} />
      <meta name="author" content={metaTags.author} />
      <meta name="viewport" content={metaTags.viewport} />
      <meta charSet={metaTags.charset} />
      <meta httpEquiv="Content-Language" content={metaTags.language} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={metaTags.canonical} />
      
      {/* Open Graph Tags */}
      <meta property="og:type" content={metaTags.openGraph.type} />
      <meta property="og:title" content={metaTags.openGraph.title} />
      <meta property="og:description" content={metaTags.openGraph.description} />
      <meta property="og:url" content={metaTags.openGraph.url} />
      <meta property="og:site_name" content={metaTags.openGraph.siteName} />
      <meta property="og:locale" content={metaTags.openGraph.locale} />
      
      {metaTags.openGraph.image && (
        <>
          <meta property="og:image" content={metaTags.openGraph.image} />
          <meta property="og:image:alt" content={metaTags.openGraph.imageAlt} />
          <meta property="og:image:width" content={metaTags.openGraph.imageWidth} />
          <meta property="og:image:height" content={metaTags.openGraph.imageHeight} />
        </>
      )}
      
      {/* Article-specific Open Graph */}
      {metaTags.openGraph.type === 'article' && (
        <>
          {metaTags.openGraph.articleAuthor && (
            <meta property="article:author" content={metaTags.openGraph.articleAuthor} />
          )}
          {metaTags.openGraph.articlePublishedTime && (
            <meta property="article:published_time" content={metaTags.openGraph.articlePublishedTime} />
          )}
          {metaTags.openGraph.articleModifiedTime && (
            <meta property="article:modified_time" content={metaTags.openGraph.articleModifiedTime} />
          )}
          {metaTags.openGraph.articleSection && (
            <meta property="article:section" content={metaTags.openGraph.articleSection} />
          )}
        </>
      )}
      
      {/* Twitter Card Tags */}
      <meta name="twitter:card" content={metaTags.twitterCard.card} />
      <meta name="twitter:site" content={metaTags.twitterCard.site} />
      <meta name="twitter:creator" content={metaTags.twitterCard.creator} />
      <meta name="twitter:title" content={metaTags.twitterCard.title} />
      <meta name="twitter:description" content={metaTags.twitterCard.description} />
      <meta name="twitter:url" content={metaTags.twitterCard.url} />
      
      {metaTags.twitterCard.image && (
        <>
          <meta name="twitter:image" content={metaTags.twitterCard.image} />
          <meta name="twitter:image:alt" content={metaTags.twitterCard.imageAlt} />
        </>
      )}
      
      {/* Additional SEO Meta Tags */}
      <meta name="theme-color" content="#1a365d" />
      <meta name="msapplication-TileColor" content="#1a365d" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="format-detection" content="telephone=no" />
      
      {/* Preconnect to external domains for performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://www.google-analytics.com" />
      
      {/* DNS Prefetch for performance */}
      <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      <link rel="dns-prefetch" href="https://www.google-analytics.com" />
      <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      
      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData.data, null, 0)}
        </script>
      )}
      
      {/* Custom meta tags */}
      {Object.entries(customMeta).map(([key, value]) => {
        if (key.startsWith('og:')) {
          return <meta key={key} property={key} content={value} />;
        } else if (key.startsWith('twitter:')) {
          return <meta key={key} name={key} content={value} />;
        } else {
          return <meta key={key} name={key} content={value} />;
        }
      })}
    </Helmet>
  );
};

SEOHead.propTypes = {
  // Basic page data
  title: PropTypes.string,
  description: PropTypes.string,
  keywords: PropTypes.arrayOf(PropTypes.string),
  url: PropTypes.string,
  image: PropTypes.string,
  type: PropTypes.oneOf(Object.values(ContentType)),
  
  // Article-specific
  author: PropTypes.string,
  publishedDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  modifiedDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  
  // Schema data
  schemaData: PropTypes.object,
  
  // Control flags
  noIndex: PropTypes.bool,
  noFollow: PropTypes.bool,
  
  // Custom overrides
  customMeta: PropTypes.object,
  customSchema: PropTypes.object
};

SEOHead.defaultProps = {
  keywords: [],
  type: ContentType.HOMEPAGE,
  noIndex: false,
  noFollow: false,
  schemaData: {},
  customMeta: {}
};

export default SEOHead;