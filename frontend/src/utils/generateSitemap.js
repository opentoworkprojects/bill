const fs = require('fs');
const path = require('path');
const { SitemapStream } = require('sitemap');
const { Readable } = require('stream');

const pages = [
  { url: '/', changefreq: 'daily', priority: 1.0 },
  { url: '/pricing', changefreq: 'monthly', priority: 0.8 },
  { url: '/features', changefreq: 'monthly', priority: 0.8 },
  { url: '/blog', changefreq: 'weekly', priority: 0.7 },
  { url: '/contact', changefreq: 'monthly', priority: 0.6 },
  { url: '/login', changefreq: 'monthly', priority: 0.5 },
  { url: '/signup', changefreq: 'monthly', priority: 0.8 },
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
