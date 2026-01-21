const fs = require('fs');
const path = require('path');
const { SitemapStream } = require('sitemap');
const { Readable } = require('stream');

const pages = [
  // Brand-critical pages for search disambiguation
  { url: '/', changefreq: 'daily', priority: 1.0 },
  { url: '/billbytekot', changefreq: 'weekly', priority: 0.95 },
  { url: '/restaurant-billing-software', changefreq: 'weekly', priority: 0.95 },
  { url: '/kot-software', changefreq: 'weekly', priority: 0.9 },
  { url: '/pos-software', changefreq: 'weekly', priority: 0.9 },
  
  // Core product pages
  { url: '/pricing', changefreq: 'monthly', priority: 0.9 },
  { url: '/features', changefreq: 'monthly', priority: 0.9 },
  
  // Content and support
  { url: '/blog', changefreq: 'weekly', priority: 0.7 },
  { url: '/contact', changefreq: 'monthly', priority: 0.8 },
  
  // Comparison pages for competitive positioning
  { url: '/compare/billbytekot-vs-petpooja', changefreq: 'monthly', priority: 0.8 },
  { url: '/compare/billbytekot-vs-posist', changefreq: 'monthly', priority: 0.8 },
  
  // City pages for local SEO (top cities)
  { url: '/city/mumbai', changefreq: 'monthly', priority: 0.6 },
  { url: '/city/delhi', changefreq: 'monthly', priority: 0.6 },
  { url: '/city/bangalore', changefreq: 'monthly', priority: 0.6 },
  { url: '/city/hyderabad', changefreq: 'monthly', priority: 0.6 },
  { url: '/city/chennai', changefreq: 'monthly', priority: 0.6 },
  
  // User flow pages
  { url: '/login', changefreq: 'monthly', priority: 0.5 },
  { url: '/signup', changefreq: 'monthly', priority: 0.8 },
  
  // Legal pages
  { url: '/privacy', changefreq: 'yearly', priority: 0.3 },
  { url: '/terms', changefreq: 'yearly', priority: 0.3 },
];

const generateSitemap = () => {
  return new Promise((resolve, reject) => {
    try {
      const sitemapStream = new SitemapStream({
        hostname: 'https://billbytekot.in',
        lastmodDateOnly: true,
      });

      const writeStream = fs.createWriteStream(
        path.join('public', 'sitemap.xml')
      );

      // Pipe the sitemap to the file
      sitemapStream.pipe(writeStream);

      // Add URLs to the sitemap
      pages.forEach(page => {
        sitemapStream.write({
          url: page.url,
          changefreq: page.changefreq,
          priority: page.priority,
          lastmod: new Date(),
        });
      });

      // End the stream
      sitemapStream.end();

      // Handle stream events
      writeStream.on('finish', () => {
        console.log('Sitemap generated successfully!');
        resolve();
      });

      writeStream.on('error', (error) => {
        console.error('Error writing sitemap:', error);
        reject(error);
      });
    } catch (error) {
      console.error('Error generating sitemap:', error);
      reject(error);
    }
  });
};

// Run the sitemap generation
generateSitemap()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed to generate sitemap:', error);
    process.exit(1);
  });
