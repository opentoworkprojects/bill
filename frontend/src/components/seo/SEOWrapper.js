import React from 'react';
import { Helmet } from 'react-helmet';
import PropTypes from 'prop-types';
import { 
  WebsiteSchema, 
  OrganizationSchema, 
  BreadcrumbSchema, 
  FAQSchema, 
  LocalBusinessSchema,
  ProductSchema,
  ArticleSchema
} from './StructuredData';

const SEOWrapper = ({
  // Basic SEO
  title,
  description,
  keywords = 'restaurant billing software, KOT system, GST billing, POS software, restaurant management system',
  
  // URL & Canonical
  canonicalUrl,
  
  // Open Graph / Facebook
  ogType = 'website',
  ogImage = 'https://billbytekot.in/og-default.jpg',
  ogImageAlt = 'BillByteKOT - Restaurant Billing Software',
  ogImageWidth = 1200,
  ogImageHeight = 630,
  
  // Twitter Card
  twitterCard = 'summary_large_image',
  twitterSite = '@billbytekot',
  twitterCreator = '@billbytekot',
  
  // Structured Data
  structuredData = {},
  breadcrumbs = [],
  faqs = [],
  
  // Schema.org Toggles
  showOrganizationSchema = true,
  showLocalBusinessSchema = false,
  showProductSchema = false,
  showArticleSchema = false,
  
  // Indexing Controls
  noindex = false,
  nofollow = false,
  
  // Additional Meta Tags
  meta = [],
  
  // Article Specific (if ogType is 'article')
  article = null,
  
  // Product Specific (if showing product schema)
  product = null
}) => {
  // Default values
  const metaDescription = description || 
    'Best restaurant billing software in India with FREE KOT system, thermal printing, GST billing & WhatsApp integration. Trusted by 500+ restaurants.';
    
  const pageTitle = title ? `${title} | BillByteKOT` : 'BillByteKOT - Restaurant Billing Software';
  const canonical = typeof window !== 'undefined' 
    ? canonicalUrl || 'https://billbytekot.in' + window.location.pathname 
    : 'https://billbytekot.in';
  
  // Robots meta
  const robots = [];
  if (noindex) robots.push('noindex');
  if (nofollow) robots.push('nofollow');
  if (robots.length === 0) robots.push('index, follow');
  
  // Additional meta tags
  const defaultMeta = [
    { name: 'description', content: metaDescription },
    { name: 'keywords', content: keywords },
    { name: 'robots', content: robots.join(', ') },
    { name: 'author', content: 'BillByteKOT' },
    { name: 'copyright', content: `© ${new Date().getFullYear()} BillByteKOT` },
    
    // Open Graph
    { property: 'og:title', content: pageTitle },
    { property: 'og:description', content: metaDescription },
    { property: 'og:url', content: canonical },
    { property: 'og:type', content: ogType },
    { property: 'og:site_name', content: 'BillByteKOT' },
    { property: 'og:locale', content: 'en_IN' },
    { property: 'og:image', content: ogImage },
    { property: 'og:image:alt', content: ogImageAlt },
    { property: 'og:image:width', content: ogImageWidth.toString() },
    { property: 'og:image:height', content: ogImageHeight.toString() },
    
    // Twitter Card
    { name: 'twitter:card', content: twitterCard },
    { name: 'twitter:title', content: pageTitle },
    { name: 'twitter:description', content: metaDescription },
    { name: 'twitter:image', content: ogImage },
    { name: 'twitter:image:alt', content: ogImageAlt },
    { name: 'twitter:site', content: twitterSite },
    { name: 'twitter:creator', content: twitterCreator },
    
    // Canonical URL
    { rel: 'canonical', href: canonical }
  ];
  
  // Add article specific meta tags
  if (ogType === 'article' && article) {
    defaultMeta.push(
      { property: 'article:published_time', content: article.publishedTime },
      { property: 'article:modified_time', content: article.modifiedTime || article.publishedTime },
      { property: 'article:author', content: article.author || 'BillByteKOT' },
      { property: 'article:section', content: article.section || 'Technology' },
      ...(article.tags ? article.tags.map(tag => 
        ({ property: 'article:tag', content: tag })) : [])
    );
  }

  return (
    <>
      <Helmet>
        {/* Title */}
        <title>{pageTitle}</title>
        
        {/* Meta Tags */}
        {[...defaultMeta, ...meta].map((tag, index) => {
          if (tag.property) {
            return <meta key={`prop-${index}`} property={tag.property} content={tag.content} />;
          } else if (tag.name) {
            return <meta key={`name-${index}`} name={tag.name} content={tag.content} />;
          } else if (tag.rel) {
            return <link key={`rel-${index}`} rel={tag.rel} href={tag.href} />;
          }
          return null;
        })}
        
        {/* Additional structured data */}
        {JSON.stringify(structuredData) !== '{}' && (
          <script type="application/ld+json">
            {JSON.stringify(structuredData)}
          </script>
        )}
      </Helmet>
      
      {/* Schema.org Markup */}
      <WebsiteSchema />
      {showOrganizationSchema && <OrganizationSchema />}
      {showLocalBusinessSchema && <LocalBusinessSchema />}
      {showProductSchema && product && <ProductSchema product={product} />}
      {showArticleSchema && article && <ArticleSchema article={article} />}
      {breadcrumbs.length > 0 && <BreadcrumbSchema items={breadcrumbs} />}
      {faqs.length > 0 && <FAQSchema faqs={faqs} />}
    </>
  );
};

SEOWrapper.propTypes = {
  // Basic SEO
  title: PropTypes.string,
  description: PropTypes.string,
  keywords: PropTypes.string,
  
  // URL & Canonical
  canonicalUrl: PropTypes.string,
  
  // Open Graph / Facebook
  ogType: PropTypes.oneOf(['website', 'article', 'product', 'book', 'profile']),
  ogImage: PropTypes.string,
  ogImageAlt: PropTypes.string,
  ogImageWidth: PropTypes.number,
  ogImageHeight: PropTypes.number,
  
  // Twitter Card
  twitterCard: PropTypes.oneOf(['summary', 'summary_large_image', 'app', 'player']),
  twitterSite: PropTypes.string,
  twitterCreator: PropTypes.string,
  
  // Structured Data
  structuredData: PropTypes.object,
  breadcrumbs: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired
  })),
  faqs: PropTypes.arrayOf(PropTypes.shape({
    question: PropTypes.string.isRequired,
    answer: PropTypes.string.isRequired
  })),
  
  // Schema.org Toggles
  showOrganizationSchema: PropTypes.bool,
  showLocalBusinessSchema: PropTypes.bool,
  showProductSchema: PropTypes.bool,
  showArticleSchema: PropTypes.bool,
  
  // Indexing Controls
  noindex: PropTypes.bool,
  nofollow: PropTypes.bool,
  
  // Additional Meta Tags
  meta: PropTypes.arrayOf(PropTypes.object),
  
  // Article Specific
  article: PropTypes.shape({
    publishedTime: PropTypes.string.isRequired,
    modifiedTime: PropTypes.string,
    author: PropTypes.string,
    section: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string)
  }),
  
  // Product Specific
  product: PropTypes.shape({
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    image: PropTypes.string.isRequired,
    brand: PropTypes.string,
    price: PropTypes.number,
    priceCurrency: PropTypes.string,
    availability: PropTypes.oneOf([
      'https://schema.org/InStock',
      'https://schema.org/OutOfStock',
      'https://schema.org/PreOrder',
      'https://schema.org/InStoreOnly',
      'https://schema.org/OnlineOnly',
      'https://schema.org/PreSale',
      'https://schema.org/SoldOut'
    ]),
    rating: PropTypes.shape({
      ratingValue: PropTypes.number.isRequired,
      reviewCount: PropTypes.number.isRequired,
      bestRating: PropTypes.number,
      worstRating: PropTypes.number
    })
  })
};

SEOWrapper.defaultProps = {
  meta: [],
  breadcrumbs: [],
  faqs: [],
  keywords: 'restaurant billing software, KOT system, GST billing, POS software, restaurant management system',
  ogType: 'website',
  ogImage: 'https://billbytekot.in/og-default.jpg',
  ogImageAlt: 'BillByteKOT - Restaurant Billing Software',
  ogImageWidth: 1200,
  ogImageHeight: 630,
  twitterCard: 'summary_large_image',
  twitterSite: '@billbytekot',
  twitterCreator: '@billbytekot',
  showOrganizationSchema: true,
  showLocalBusinessSchema: false,
  showProductSchema: false,
  showArticleSchema: false,
  noindex: false,
  nofollow: false
};

export default SEOWrapper;
