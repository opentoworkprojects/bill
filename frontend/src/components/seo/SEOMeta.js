import React from 'react';
import { Helmet } from 'react-helmet-async';
import PropTypes from 'prop-types';

/**
 * SEOMeta Component
 * 
 * A reusable component for managing page-level SEO meta tags.
 * Implements title, description, keywords, canonical URL, Open Graph, and Twitter Cards.
 * Uses react-helmet-async for dynamic meta tag injection.
 * 
 * @requirements 3.1, 13.1
 */
const SEOMeta = ({
  // Basic SEO
  title,
  description,
  keywords = [],
  canonicalUrl,
  
  // Open Graph
  ogImage,
  ogType = 'website',
  
  // Article-specific (for blog posts)
  author,
  publishedDate,
  modifiedDate,
  
  // Indexing controls
  noIndex = false,
}) => {
  // Constants
  const SITE_NAME = 'BillByteKOT';
  const DEFAULT_DESCRIPTION = 'Best restaurant billing software in India with FREE KOT system, thermal printing, GST billing & WhatsApp integration. Trusted by 500+ restaurants.';
  const DEFAULT_IMAGE = 'https://billbytekot.in/og-default.jpg';
  const TWITTER_HANDLE = '@billbytekot';
  const BASE_URL = 'https://billbytekot.in';
  
  // Process title (max 60 chars as per requirements)
  const processedTitle = title 
    ? `${title.substring(0, 60)} | ${SITE_NAME}`
    : `${SITE_NAME} - Restaurant Billing Software`;
  
  // Process description (max 155 chars as per requirements)
  const processedDescription = description 
    ? description.substring(0, 155)
    : DEFAULT_DESCRIPTION;
  
  // Process keywords array to string
  const keywordsString = Array.isArray(keywords) && keywords.length > 0
    ? keywords.join(', ')
    : 'restaurant billing software, KOT system, GST billing, POS software, restaurant management system';
  
  // Generate canonical URL
  const canonical = canonicalUrl || (typeof window !== 'undefined' 
    ? `${BASE_URL}${window.location.pathname}`
    : BASE_URL);
  
  // Process OG image
  const ogImageUrl = ogImage || DEFAULT_IMAGE;
  
  // Robots directive
  const robotsContent = noIndex ? 'noindex, nofollow' : 'index, follow';

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{processedTitle}</title>
      <meta name="description" content={processedDescription} />
      <meta name="keywords" content={keywordsString} />
      <meta name="robots" content={robotsContent} />
      <meta name="author" content={author || SITE_NAME} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonical} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={processedTitle} />
      <meta property="og:description" content={processedDescription} />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_IN" />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:image:alt" content={`${SITE_NAME} - Restaurant Billing Software`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={TWITTER_HANDLE} />
      <meta name="twitter:creator" content={TWITTER_HANDLE} />
      <meta name="twitter:title" content={processedTitle} />
      <meta name="twitter:description" content={processedDescription} />
      <meta name="twitter:image" content={ogImageUrl} />
      <meta name="twitter:image:alt" content={`${SITE_NAME} - Restaurant Billing Software`} />
      
      {/* Article-specific meta tags (for blog posts) */}
      {ogType === 'article' && publishedDate && (
        <meta property="article:published_time" content={publishedDate} />
      )}
      {ogType === 'article' && modifiedDate && (
        <meta property="article:modified_time" content={modifiedDate} />
      )}
      {ogType === 'article' && author && (
        <meta property="article:author" content={author} />
      )}
    </Helmet>
  );
};

SEOMeta.propTypes = {
  // Page title (max 60 chars)
  title: PropTypes.string,
  // Meta description (max 155 chars)
  description: PropTypes.string,
  // Target keywords array
  keywords: PropTypes.arrayOf(PropTypes.string),
  // Canonical URL
  canonicalUrl: PropTypes.string,
  // Open Graph image URL
  ogImage: PropTypes.string,
  // og:type (website, article, product)
  ogType: PropTypes.oneOf(['website', 'article', 'product']),
  // Content author
  author: PropTypes.string,
  // Article publish date (ISO 8601)
  publishedDate: PropTypes.string,
  // Last modified date (ISO 8601)
  modifiedDate: PropTypes.string,
  // Prevent indexing
  noIndex: PropTypes.bool,
};

SEOMeta.defaultProps = {
  keywords: [],
  ogType: 'website',
  noIndex: false,
};

export default SEOMeta;
