/**
 * Sitemap generator — runs at build time via "prebuild" npm script
 * Reads blogPosts data and writes public/sitemap.xml
 *
 * Add to package.json scripts:
 *   "prebuild": "node scripts/generate-sitemap.js"
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://billbytekot.in';

// Inline the published posts data (avoids ESM import issues in Node CJS)
// This script reads the blogPosts.js file and extracts slugs/dates via regex
const blogPostsPath = path.join(__dirname, '../src/data/blogPosts.js');
const blogPostsSource = fs.readFileSync(blogPostsPath, 'utf-8');

// Extract slug, date, contentType, status from each post object
const postMatches = [...blogPostsSource.matchAll(/slug:\s*["']([^"']+)["'][^}]*?date:\s*["']([^"']+)["'][^}]*?(?:contentType:\s*["']([^"']+)["'])?[^}]*?(?:status:\s*["']([^"']+)["'])?/gs)];

const posts = postMatches
  .map(m => ({
    slug: m[1],
    date: m[2],
    contentType: m[3] || 'standard',
    status: m[4] || 'published',
  }))
  .filter(p => p.status !== 'draft')
  // Deduplicate by slug
  .filter((p, i, arr) => arr.findIndex(x => x.slug === p.slug) === i);

// Static pages
const staticPages = [
  { url: '/', priority: '1.0', changefreq: 'daily' },
  { url: '/blog', priority: '0.9', changefreq: 'daily' },
  { url: '/login', priority: '0.8', changefreq: 'monthly' },
  { url: '/contact', priority: '0.7', changefreq: 'monthly' },
  { url: '/download', priority: '0.8', changefreq: 'monthly' },
];

const urlEntries = [
  ...staticPages.map(p => `
  <url>
    <loc>${BASE_URL}${p.url}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`),
  ...posts.map(p => `
  <url>
    <loc>${BASE_URL}/blog/${p.slug}</loc>
    <lastmod>${p.date}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${p.contentType === 'pillar' ? '0.8' : '0.6'}</priority>
  </url>`),
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.join('')}
</urlset>`;

const outputPath = path.join(__dirname, '../public/sitemap.xml');
fs.writeFileSync(outputPath, sitemap, 'utf-8');

console.log(`✅ Sitemap generated: ${outputPath}`);
console.log(`   ${posts.length} blog posts + ${staticPages.length} static pages`);
