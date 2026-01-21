/**
 * Schema Integration Example
 * 
 * Demonstrates how to integrate schema markup into React components
 * using the enhanced SEO system.
 * 
 * @requirements 1.2, 4.2
 */

import React from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { 
  HomepageSEO, 
  ProductPageSEO, 
  BlogPostSEO,
  HomepageSchemaInjector,
  ProductPageSchemaInjector,
  FAQPageSchemaInjector
} from '../index';

/**
 * Example Homepage with integrated SEO and Schema
 */
export const HomepageExample = () => {
  const pageData = {
    name: 'BillByteKOT',
    description: 'Best restaurant billing software in India with FREE KOT system',
    applicationCategory: 'BusinessApplication',
    featureList: [
      'Restaurant Billing & Invoicing',
      'Kitchen Order Ticket (KOT) Management',
      'Inventory & Stock Management',
      'GST Compliance & Tax Management',
      'Thermal Printer Integration',
      'WhatsApp Order Integration'
    ],
    aggregateRating: {
      ratingValue: 4.9,
      reviewCount: 500,
      bestRating: 5,
      worstRating: 1
    },
    offers: {
      price: '1999',
      priceCurrency: 'INR',
      availability: 'InStock'
    }
  };

  return (
    <HelmetProvider>
      <div>
        {/* Comprehensive SEO with Meta Tags and Schema */}
        <HomepageSEO
          title="BillByteKOT - Best Restaurant Billing Software in India"
          description="Best restaurant billing software in India with FREE KOT system, thermal printing, GST billing & WhatsApp integration. Trusted by 500+ restaurants."
          keywords={[
            'restaurant billing software',
            'POS system',
            'KOT software',
            'restaurant management software',
            'GST billing software',
            'thermal printer billing'
          ]}
          url="https://billbytekot.in"
          image="https://billbytekot.in/og-homepage.jpg"
          schemaData={pageData}
        />
        
        {/* Page Content */}
        <main>
          <h1>BillByteKOT - Restaurant Billing Software</h1>
          <p>Complete restaurant management solution with advanced features.</p>
          
          {/* Features Section */}
          <section>
            <h2>Key Features</h2>
            <ul>
              {pageData.featureList.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
          </section>
        </main>
      </div>
    </HelmetProvider>
  );
};

/**
 * Example Product Page with Schema
 */
export const ProductPageExample = () => {
  const productData = {
    name: 'Restaurant Billing Software',
    description: 'Complete billing solution for restaurants',
    price: '1999',
    currency: 'INR',
    availability: 'InStock',
    brand: 'BillByteKOT',
    sku: 'BBKOT-2024',
    aggregateRating: {
      ratingValue: 4.9,
      reviewCount: 500
    }
  };

  return (
    <HelmetProvider>
      <div>
        <ProductPageSEO
          title="Restaurant Billing Software | BillByteKOT"
          description="Complete restaurant billing software with KOT system, thermal printing, and GST compliance."
          keywords={['restaurant billing', 'POS system', 'KOT software']}
          url="https://billbytekot.in/restaurant-billing-software"
          schemaData={productData}
        />
        
        <main>
          <h1>{productData.name}</h1>
          <p>{productData.description}</p>
          <p>Price: {productData.currency} {productData.price}</p>
          <p>Rating: {productData.aggregateRating.ratingValue}/5 ({productData.aggregateRating.reviewCount} reviews)</p>
        </main>
      </div>
    </HelmetProvider>
  );
};

/**
 * Example Blog Post with Article Schema
 */
export const BlogPostExample = () => {
  const articleData = {
    headline: 'Complete Guide to Restaurant Billing Software',
    description: 'Everything you need to know about choosing the right billing software for your restaurant.',
    author: 'BillByteKOT Team',
    publishedDate: '2024-12-09',
    modifiedDate: '2024-12-09',
    image: 'https://billbytekot.in/blog-image.jpg',
    wordCount: 1500,
    keywords: ['restaurant billing', 'software guide', 'restaurant management']
  };

  return (
    <HelmetProvider>
      <div>
        <BlogPostSEO
          title={`${articleData.headline} | BillByteKOT Blog`}
          description={articleData.description}
          author={articleData.author}
          publishedDate={articleData.publishedDate}
          modifiedDate={articleData.modifiedDate}
          keywords={articleData.keywords}
          url="https://billbytekot.in/blog/restaurant-billing-software-guide"
          image={articleData.image}
          schemaData={articleData}
        />
        
        <article>
          <header>
            <h1>{articleData.headline}</h1>
            <p>By {articleData.author} | {articleData.publishedDate}</p>
          </header>
          <main>
            <p>{articleData.description}</p>
            <p>Reading time: {Math.ceil(articleData.wordCount / 200)} minutes</p>
          </main>
        </article>
      </div>
    </HelmetProvider>
  );
};

/**
 * Example with Multiple Schema Types
 */
export const MultiSchemaExample = () => {
  const faqs = [
    {
      question: 'What is BillByteKOT?',
      answer: 'BillByteKOT is a comprehensive restaurant billing software with KOT system, thermal printing, and GST compliance.'
    },
    {
      question: 'How much does it cost?',
      answer: 'BillByteKOT starts at ₹1999 per month with all features included.'
    },
    {
      question: 'Is there a free trial?',
      answer: 'Yes, we offer a 14-day free trial with full access to all features.'
    }
  ];

  return (
    <HelmetProvider>
      <div>
        {/* Homepage Schema */}
        <HomepageSchemaInjector 
          pageData={{
            name: 'BillByteKOT',
            description: 'Restaurant billing software'
          }}
        />
        
        {/* FAQ Schema */}
        <FAQPageSchemaInjector faqs={faqs} />
        
        <main>
          <h1>BillByteKOT - Restaurant Software</h1>
          
          <section>
            <h2>Frequently Asked Questions</h2>
            {faqs.map((faq, index) => (
              <div key={index}>
                <h3>{faq.question}</h3>
                <p>{faq.answer}</p>
              </div>
            ))}
          </section>
        </main>
      </div>
    </HelmetProvider>
  );
};

/**
 * Example with Custom Schema
 */
export const CustomSchemaExample = () => {
  const customSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'BillByteKOT Custom',
    description: 'Custom restaurant software solution',
    applicationCategory: 'BusinessApplication',
    offers: {
      '@type': 'Offer',
      price: '2999',
      priceCurrency: 'INR'
    }
  };

  return (
    <HelmetProvider>
      <div>
        {/* Using custom schema directly */}
        <ProductPageSchemaInjector 
          customSchema={{ data: customSchema }}
        />
        
        <main>
          <h1>Custom Restaurant Software</h1>
          <p>Tailored solution for your restaurant needs.</p>
        </main>
      </div>
    </HelmetProvider>
  );
};

/**
 * Usage Examples Documentation
 */
export const UsageExamples = {
  // Basic usage with SEO components
  basicHomepage: `
import { HomepageSEO } from '../seo';

const HomePage = () => (
  <div>
    <HomepageSEO
      title="Your Restaurant Software"
      description="Complete restaurant management solution"
      keywords={['restaurant', 'billing', 'POS']}
    />
    <main>Your content here</main>
  </div>
);`,

  // Advanced usage with custom schema data
  advancedProduct: `
import { ProductPageSEO } from '../seo';

const ProductPage = () => {
  const schemaData = {
    name: 'Restaurant POS System',
    price: '1999',
    currency: 'INR',
    features: ['Billing', 'KOT', 'Inventory'],
    rating: { value: 4.8, count: 300 }
  };

  return (
    <div>
      <ProductPageSEO
        title="Restaurant POS System"
        description="Advanced POS system for restaurants"
        schemaData={schemaData}
      />
      <main>Product details here</main>
    </div>
  );
};`,

  // Schema-only injection
  schemaOnly: `
import { HomepageSchemaInjector } from '../seo';

const Component = () => (
  <div>
    <HomepageSchemaInjector 
      pageData={{ name: 'My Restaurant App' }}
    />
    <main>Content with schema markup</main>
  </div>
);`,

  // Multiple schemas on one page
  multipleSchemas: `
import { 
  HomepageSchemaInjector, 
  FAQPageSchemaInjector,
  BreadcrumbSchemaInjector 
} from '../seo';

const ComplexPage = () => {
  const faqs = [{ question: 'Q?', answer: 'A.' }];
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Products', url: '/products' }
  ];

  return (
    <div>
      <HomepageSchemaInjector pageData={{ name: 'App' }} />
      <FAQPageSchemaInjector faqs={faqs} />
      <BreadcrumbSchemaInjector breadcrumbs={breadcrumbs} />
      <main>Rich content with multiple schemas</main>
    </div>
  );
};`
};

export default {
  HomepageExample,
  ProductPageExample,
  BlogPostExample,
  MultiSchemaExample,
  CustomSchemaExample,
  UsageExamples
};