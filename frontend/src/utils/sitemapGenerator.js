import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { SitemapStream, streamToPromise } from 'sitemap';
import { createGzip } from 'zlib';
import { Readable } from 'stream';
import { SitemapAndIndexStream, SitemapStream as SitemapIndexStream } from 'sitemap';
import { createGzip as createGzipAsync } from 'zlib';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const readFile = promisify(fs.readFile);
const exists = promisify(fs.exists);

// Configuration
const SITE_URL = 'https://billbytekot.in';
const DEST_DIR = path.join(process.cwd(), 'public');
const PAGES_DIR = path.join(process.cwd(), 'src/pages');
const SITEMAP_LIMIT = 50000; // Maximum URLs per sitemap
const CHUNK_SIZE = 1000; // Number of URLs per sitemap chunk

// Priority and changefreq settings
const DEFAULT_PRIORITY = 0.5;
const DEFAULT_CHANGEFREQ = 'weekly';
const PRIORITY_MAP = {
  '/': 1.0,
  '/restaurant-billing-software': 0.95,
  '/kot-software': 0.9,
  '/pos-software': 0.9,
  '/pricing': 0.9,
  '/features': 0.9,
  '/about': 0.8,
  '/contact': 0.8,
  '/blog': 0.7,
  '/blog/': 0.7,
  '/docs': 0.7,
  '/docs/': 0.7,
  '/compare': 0.8,
  '/compare/': 0.8,
  '/city': 0.6,
  '/city/': 0.6,
  '/privacy': 0.3,
  '/terms': 0.3,
  '/sitemap.xml': 0.1,
};

const CHANGEFREQ_MAP = {
  '/': 'daily',
  '/restaurant-billing-software': 'weekly',
  '/kot-software': 'weekly',
  '/pos-software': 'weekly',
  '/blog': 'daily',
  '/blog/': 'daily',
  '/pricing': 'monthly',
  '/features': 'monthly',
  '/about': 'yearly',
  '/contact': 'monthly',
  '/docs': 'weekly',
  '/docs/': 'weekly',
  '/compare': 'monthly',
  '/compare/': 'monthly',
  '/city': 'monthly',
  '/city/': 'monthly',
  '/privacy': 'yearly',
  '/terms': 'yearly',
};

// Ignored paths and files
const IGNORED_PATHS = [
  // Next.js specific
  '/_app',
  '/_document',
  '/_error',
  '/_middleware',
  '/middleware',
  '/api',
  '/api-docs',
  '/graphql',
  '/swagger',
  
  // Authentication
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/auth',
  
  // User specific
  '/account',
  '/profile',
  '/settings',
  '/dashboard',
  '/admin',
  
  // E-commerce
  '/cart',
  '/checkout',
  '/checkout/success',
  '/checkout/cancel',
  '/orders',
  '/wishlist',
  
  // Other dynamic pages
  '/search',
  '/404',
  '/500',
  '/maintenance',
  '/coming-soon',
  '/under-construction',
  
  // Development and testing
  '/test',
  '/dev',
  '/staging',
  '/preview',
  
  // System files and directories
  '/.next',
  '/node_modules',
  '/public',
  '/src',
  '/.git',
  '/.github',
  '/.vscode',
  '/.idea',
  '/.gitignore',
  '/.env*',
  '/.eslint*',
  '/.prettier*',
  '/next.config.js',
  '/package*.json',
  '/yarn.lock',
  '/package-lock.json',
  '/tsconfig.json',
  '/jsconfig.json',
  '/sitemap*.xml',
  '/robots.txt',
  '/.eslintrc.json',
  '/.prettierrc',
  '/.prettierrc.js',
  '/.prettierrc.json',
  '/.babelrc',
  '/.babelrc.js',
  '/.babelrc.json',
  '/.gitignore',
  '/.npmrc',
  '/.nvmrc',
  '/.yarnrc',
  '/package-lock.json',
  '/yarn.lock',
  '/package.json',
  '/README.md',
  '/LICENSE',
  '/CHANGELOG.md',
  '/CONTRIBUTING.md',
  '/CODE_OF_CONDUCT.md',
  '/SECURITY.md',
  '/TROUBLESHOOTING.md',
  '/UPGRADE.md',
  '/vercel.json',
  '/now.json',
  '/next.config.js',
  '/next-env.d.ts',
  '/tsconfig.json',
  '/tsconfig.node.json',
  '/tsconfig.paths.json',
  '/tsconfig.webpack.json',
  '/webpack.config.js',
  '/webpack.prod.js',
  '/webpack.dev.js',
  '/webpack.common.js',
  '/jest.config.js',
  '/jest.setup.js',
  '/jest.config.ts',
  '/jest.setup.ts',
  '/cypress.json',
  '/cypress',
  '/coverage',
  '/.next',
  '/out',
  '/build',
  '/dist',
  '/node_modules',
  '/.vercel',
  '/.now',
  '/.github',
  '/.git',
  '/.vscode',
  '/.idea',
  '/.DS_Store',
  '/Thumbs.db',
  '/.env.local',
  '/.env.development.local',
  '/.env.test.local',
  '/.env.production.local',
  '/npm-debug.log*',
  '/yarn-debug.log*',
  '/yarn-error.log*',
  '/.env.test',
  '/.env.production',
  '/.env.development',
  '/.env.example',
  '/.env.sample',
  '/.env.template',
  '/.env.dist',
  '/.env.dev',
  '/.env.prod',
  '/.env.staging',
  '/.env.stage',
  '/.env.preview',
  '/.env.local.example',
  '/.env.development.example',
  '/.env.production.example',
  '/.env.test.example',
  '/.env.staging.example',
  '/.env.stage.example',
  '/.env.preview.example',
  '/.env.development.local.example',
  '/.env.production.local.example',
  '/.env.test.local.example',
  '/.env.staging.local.example',
  '/.env.stage.local.example',
  '/.env.preview.local.example',
  '/.env.development.local.example',
  '/.env.production.local.example',
  '/.env.test.local.example',
  '/.env.staging.local.example',
  '/.env.stage.local.example',
  '/.env.preview.local.example',
  '/.env.development.local.example',
  '/.env.production.local.example',
  '/.env.test.local.example',
  '/.env.staging.local.example',
  '/.env.stage.local.example',
  '/.env.preview.local.example',
];

// Get all page paths from the pages directory with additional metadata
async function getPagePaths() {
  const files = await glob('**/*.{js,jsx,ts,tsx,mdx}', { 
    cwd: PAGES_DIR,
    ignore: ['**/_*.{js,jsx,ts,tsx,mdx}', '**/api/**', '**/components/**']
  });
  
  const now = new Date().toISOString();
  
  return files
    .map(file => {
      // Remove file extensions and index
      let path = file
        .replace(/\.(jsx?|tsx?|mdx)$/, '')
        .replace(/\[/g, '[')
        .replace(/\]/g, ']')
        .replace(/\/index$/, ''); // Remove trailing /index
      
      // Handle dynamic routes (e.g., [id].js -> /*)
      if (path.includes('[') && path.includes(']')) {
        path = path.replace(/\[([^\]]+)\]/g, '*');
      }
      
      // Handle catch-all routes (e.g., [...slug].js -> /**)
      if (path.includes('[...')) {
        path = path.replace(/\[\.\.\.([^\]]+)\]/g, '**');
      }
      
      // Handle index files at root
      if (path === 'index') {
        path = '';
      }
      
      const urlPath = `/${path}`;
      
      // Skip ignored paths
      if (IGNORED_PATHS.some(ignored => 
        urlPath === ignored || 
        urlPath.startsWith(ignored + '/') ||
        (ignored.endsWith('*') && urlPath.startsWith(ignored.slice(0, -1)))
      )) {
        return null;
      }
      
      // Determine priority and changefreq
      let priority = DEFAULT_PRIORITY;
      let changefreq = DEFAULT_CHANGEFREQ;
      
      // Exact match takes highest precedence
      if (PRIORITY_MAP[urlPath] !== undefined) {
        priority = PRIORITY_MAP[urlPath];
      } 
      // Check for partial matches (e.g., /blog/*)
      else {
        const matchedPath = Object.keys(PRIORITY_MAP).find(p => 
          p.endsWith('*') && urlPath.startsWith(p.slice(0, -1))
        );
        if (matchedPath) {
          priority = PRIORITY_MAP[matchedPath];
        }
      }
      
      // Set changefreq
      changefreq = CHANGEFREQ_MAP[urlPath] || 
        Object.entries(CHANGEFREQ_MAP).find(([p]) => 
          p.endsWith('*') && urlPath.startsWith(p.slice(0, -1))
        )?.[1] || 
        DEFAULT_CHANGEFREQ;
      
      // Adjust priority based on URL depth
      const depth = urlPath.split('/').filter(Boolean).length;
      if (depth > 1 && priority === DEFAULT_PRIORITY) {
        priority = Math.max(0.1, 0.9 - (depth * 0.1));
      }
      
      return {
        url: urlPath,
        changefreq,
        priority: parseFloat(priority.toFixed(1)),
        lastmod: now,
        // Add more specific lastmod based on git history if available
        lastmodRealtime: true,
        lastmodISO: now,
        links: [
          { lang: 'en', url: urlPath },
          // Add hreflang links if you have multiple language versions
          // { lang: 'hi', url: `/hi${urlPath}` },
        ],
        img: urlPath === '/' ? [
          { url: `${SITE_URL}/og-image.jpg` },
          { url: `${SITE_URL}/logo.png` }
        ] : []
      };
    })
    .filter(Boolean); // Remove null entries
}

// Generate sitemap.xml with support for large sites (splits into multiple sitemaps)
async function generateSitemap() {
  try {
    console.log('Generating sitemap...');
    
    // Ensure public directory exists
    if (!await exists(DEST_DIR)) {
      await mkdir(DEST_DIR, { recursive: true });
    }
    
    // Get all pages with metadata
    const pages = await getPagePaths();
    
    // Add static URLs that might not be in the pages directory
    const staticUrls = [
      { 
        url: '/', 
        changefreq: 'daily', 
        priority: 1.0,
        lastmod: new Date().toISOString(),
        img: [
          { url: `${SITE_URL}/og-image.jpg` },
          { url: `${SITE_URL}/logo.png` }
        ]
      }
    ];
    
    const allUrls = [...staticUrls, ...pages];
    
    console.log(`Found ${allUrls.length} URLs to include in sitemap`);
    
    // If we have more than SITEMAP_LIMIT URLs, split into multiple sitemaps
    if (allUrls.length > SITEMAP_LIMIT) {
      console.log(`More than ${SITEMAP_LIMIT} URLs found, generating sitemap index...`);
      return generateSitemapIndex(allUrls);
    }
    
    // For smaller sites, generate a single sitemap
    const sitemapPath = path.join(DEST_DIR, 'sitemap.xml');
    const writeStream = fs.createWriteStream(sitemapPath);
    
    const sitemap = new SitemapStream({
      hostname: SITE_URL,
      lastmodDateOnly: false,
      xmlns: {
        news: false,
        xhtml: true,
        image: true,
        video: true,
        custom: [
          'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
          'xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd"',
        ],
      },
    });
    
    // Create a stream from the array of URLs
    const stream = Readable.from(allUrls);
    
    // Pipe the stream through the sitemap and then to the file
    const pipeline = stream
      .pipe(sitemap)
      .pipe(createGzip())
      .pipe(writeStream);
    
    return new Promise((resolve, reject) => {
      pipeline.on('finish', () => {
        console.log(`Sitemap generated at: ${sitemapPath} (${allUrls.length} URLs)`);
        resolve();
      });
      
      pipeline.on('error', (error) => {
        console.error('Error generating sitemap:', error);
        reject(error);
      });
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    throw error;
  }
}

// Generate sitemap index and multiple sitemap files for large sites
async function generateSitemapIndex(urls) {
  const sitemapDir = path.join(DEST_DIR, 'sitemaps');
  
  // Create sitemaps directory if it doesn't exist
  if (!await exists(sitemapDir)) {
    await mkdir(sitemapDir, { recursive: true });
  }
  
  // Split URLs into chunks
  const chunks = [];
  for (let i = 0; i < urls.length; i += CHUNK_SIZE) {
    chunks.push(urls.slice(i, i + CHUNK_SIZE));
  }
  
  console.log(`Split into ${chunks.length} sitemap files`);
  
  // Generate individual sitemap files
  const sitemapFiles = [];
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const sitemapPath = path.join(sitemapDir, `sitemap-${i + 1}.xml`);
    const sitemapUrl = `${SITE_URL}/sitemaps/sitemap-${i + 1}.xml`;
    
    const sitemap = new SitemapStream({
      hostname: SITE_URL,
      lastmodDateOnly: false,
      xmlns: {
        news: false,
        xhtml: true,
        image: true,
        video: true,
      },
    });
    
    const writeStream = fs.createWriteStream(sitemapPath);
    
    // Create a stream from the chunk of URLs
    const stream = Readable.from(chunk);
    
    // Pipe the stream through the sitemap and then to the file
    const pipeline = stream
      .pipe(sitemap)
      .pipe(createGzip())
      .pipe(writeStream);
    
    await new Promise((resolve, reject) => {
      pipeline.on('finish', () => {
        console.log(`Generated sitemap: ${sitemapPath} (${chunk.length} URLs)`);
        sitemapFiles.push(sitemapUrl);
        resolve();
      });
      
      pipeline.on('error', (error) => {
        console.error(`Error generating sitemap ${sitemapPath}:`, error);
        reject(error);
      });
    });
  }
  
  // Generate sitemap index
  const sitemapIndexPath = path.join(DEST_DIR, 'sitemap.xml');
  const sitemapIndexStream = new SitemapIndexStream({
    lastmodDateOnly: false,
  });
  
  const writeStream = fs.createWriteStream(sitemapIndexPath);
  
  // Add each sitemap to the index
  const stream = Readable.from(
    sitemapFiles.map((sitemapUrl, index) => ({
      url: sitemapUrl,
      lastmod: new Date().toISOString(),
      changefreq: 'daily',
    }))
  );
  
  const pipeline = stream
    .pipe(sitemapIndexStream)
    .pipe(createGzip())
    .pipe(writeStream);
  
  await new Promise((resolve, reject) => {
    pipeline.on('finish', () => {
      console.log(`Sitemap index generated at: ${sitemapIndexPath}`);
      console.log(`Total URLs: ${urls.length} across ${sitemapFiles.length} sitemaps`);
      resolve();
    });
    
    pipeline.on('error', (error) => {
      console.error('Error generating sitemap index:', error);
      reject(error);
    });
  });
  
  return sitemapIndexPath;
}

// Generate robots.txt file
async function generateRobotsTxt() {
  try {
    const robotsTxtPath = path.join(DEST_DIR, 'robots.txt');
    const sitemapUrl = `${SITE_URL}/sitemap.xml`;
    
    const content = `# https://www.robotstxt.org/robotstxt.html
User-agent: *
Allow: /

# Disallow admin and other sensitive areas
Disallow: /admin/
Disallow: /dashboard/
Disallow: /account/
Disallow: /api/
Disallow: /_next/
Disallow: /*.json$
Disallow: /*?

# Sitemap
Sitemap: ${sitemapUrl}
`;

    await writeFile(robotsTxtPath, content);
    console.log('robots.txt generated successfully!');
    return true;
  } catch (error) {
    console.error('Error generating robots.txt:', error);
    return false;
  }
}

// Generate news sitemap (stub implementation)
async function generateNewsSitemap() {
  // This is a stub - implement with actual news articles if needed
  console.log('No news sitemap to generate');
  return true;
}

/**
 * Main function to generate all sitemaps and robots.txt
 */
async function generateAll() {
  try {
    console.log('Starting sitemap generation...');
    
    // Generate main sitemap (or sitemap index if needed)
    await generateSitemap();
    
    // Generate news sitemap if there are news articles
    await generateNewsSitemap();
    
    // Generate robots.txt
    await generateRobotsTxt();
    
    console.log('Sitemap generation completed successfully!');
    return true;
  } catch (error) {
    console.error('Error during sitemap generation:', error);
    return false;
  }
}

// Export functions
module.exports = {
  generateSitemap,
  generateSitemapIndex,
  generateRobotsTxt,
  generateNewsSitemap,
  generateAll,
  getPagePaths,
};

// Run directly if this file is executed
if (require.main === module) {
  generateAll()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Unhandled error in sitemap generation:', error);
      process.exit(1);
    });
}
