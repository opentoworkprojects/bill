# Design Document: SEO Blog Growth Engine

## Overview

This design covers the technical implementation of the SEO Blog Growth Engine for BillByteKOT. The existing React frontend (`frontend/src/`) already has `BlogPage.js`, `BlogPostPage.js`, `blogPosts.js`, and `AdSense.js`. All new work extends these files and adds new components — no backend changes are required except for the lead capture form submission endpoint.

---

## Architecture

### Data Layer — `blogPosts.js` Schema Extension

Each blog post entry in `blogPosts.js` is extended with the following optional fields:

```js
{
  // Existing fields (unchanged)
  id, slug, title, metaTitle, metaDescription, excerpt,
  author, date, lastModified, readTime, category, tags,
  keywords, image, imageAlt, featured, content,

  // New fields
  targetMarket: ["India"],           // string[] — see Req 1
  primaryKeyword: "restaurant POS",  // string
  secondaryKeywords: [],             // string[]
  searchVolume: 12000,               // number (monthly)
  keywordDifficulty: "medium",       // "low" | "medium" | "high"
  status: "published",               // "published" | "draft" | "scheduled"
  scheduledDate: null,               // ISO date string or null
  contentType: "standard",           // "standard"|"pillar"|"comparison"|"how-to"|"listicle"|"case-study"|"tool-page"|"city-guide"|"app-feature"
  leadMagnet: false,                 // boolean
  appPromo: false,                   // boolean
  relatedPosts: [],                  // number[] (post IDs)
}
```

The `blogPosts` export already filters by `status` — we add a runtime filter:

```js
export const publishedPosts = blogPosts.filter(p => {
  if (!p.status || p.status === 'published') return true;
  if (p.status === 'scheduled' && p.scheduledDate) {
    return new Date(p.scheduledDate) <= new Date();
  }
  return false;
});
```

---

## New React Components

All new components live in `frontend/src/components/blog/`.

### `AppDownloadBanner.js`

Renders on every blog post page. Contains the Google Play badge, star rating, and ≤20-word description. On mobile, renders as a sticky top bar.

```jsx
// Props: { mobile?: boolean, utmCampaign?: string }
// mobile=true → sticky top bar (Smart App Banner equivalent)
// mobile=false (default) → inline banner card
```

Play Store URL pattern:
```
https://play.google.com/store/apps/details?id=com.billbytekot&utm_source=blog&utm_medium=cta&utm_campaign=playstore
```

### `AppPromoCard.js`

Already exists inline in `BlogPage.js`. Extract it to `frontend/src/components/blog/AppPromoCard.js` and import it in both `BlogPage.js` and `BlogPostPage.js`. Accepts `compact` prop (existing behavior).

### `InlineCTA.js`

Renders between 40–60% of article content. Links to `/login`. Accepts `market` prop to switch currency display (INR / USD / AED / GBP).

### `StickyMobileCTA.js`

Fixed bottom bar on mobile (`< 768px`). "Start Free Trial" button. Dismissed via close icon, stored in `sessionStorage`.

### `LeadCaptureForm.js`

Collects: restaurant name, owner name, phone, restaurant type. POSTs to existing backend. Renders at bottom of every blog post.

### `TimedPopup.js`

Triggers after 60s on page. Shows once per session (`sessionStorage` flag). Offers free trial or demo booking.

### `RelatedArticles.js`

Shows 3 posts matching same `targetMarket` or `category`. Renders at article end.

### `BreadcrumbNav.js`

Renders: Home > Blog > [Category] > [Post Title]. Injects JSON-LD `BreadcrumbList` schema via `react-helmet`.

### `MarketFilter.js`

Renders above post grid on `/blog` when multiple `targetMarket` values exist. Pill-style filter buttons. Controls a `selectedMarket` state in `BlogPage.js`.

### `PillarPage.js`

Reusable layout for pillar content pages. Accepts `topic`, `description`, and `posts[]`. Renders at `/blog/pillar/[topic-slug]`.

### `RestaurantCostCalculator.js`

Inputs: monthly revenue, food cost %, labor cost %, overhead %. Outputs: net profit, profit margin %, recommendation text. On completion, shows `LeadCaptureForm` with "Save Your Results" prompt.

### `KOTROICalculator.js`

Inputs: tables, covers/day, avg order value, error rate %. Outputs: monthly savings, payback period. Same lead capture on completion.

---

## AdSense Component Enhancements

`frontend/src/components/AdSense.js` additions:

```jsx
const AdSense = ({
  slot,
  format = 'auto',        // "auto" | "rectangle" | "leaderboard" | "skyscraper"
  responsive = 'true',
  style = { display: 'block' },
  className = '',
  campaignType = 'adsense', // "adsense" | "display"
}) => { ... }
```

- Add 5-second timeout fallback: if `window.adsbygoogle` hasn't loaded after 5s, render a fallback `<div>` with a `/login` CTA.
- In dev mode, log `[AdSense] slot={slot} rendered` to console. Suppress in production.
- The existing `isBlogPage` guard is preserved.

### In-content ad injection

In `BlogPostPage.js`, after splitting content into paragraphs, inject an `<AdSense>` unit after every ~800 words (approximately every 5–6 paragraph blocks) when total word count > 2000. Max 5 total ad units per page.

---

## SEO Infrastructure

### JSON-LD Schema

`BlogPostPage.js` already uses `BlogPostSEO` from `../seo`. Extend `BlogPostSEO` to also inject:

- `Article` schema (already partially done)
- `BreadcrumbList` schema (via `BreadcrumbNav` component)
- `FAQPage` schema on app landing page (`/blog/restaurant-billing-app-android`)

### Canonical + Open Graph

Already implemented in `BlogPostSEO`. Ensure `<link rel="canonical">` uses `https://billbytekot.in/blog/{slug}` consistently.

### Geo Meta Tags

In `BlogPostPage.js`, map `targetMarket` → ISO code and inject:

```jsx
const geoMap = {
  US: 'US', UK: 'GB', UAE: 'AE',
  Singapore: 'SG', Malaysia: 'MY', India: 'IN',
};
// <meta name="geo.region" content={geoMap[market]} />
```

### Sitemap

Add a `public/sitemap.xml` generation script (`scripts/generate-sitemap.js`) that reads `blogPosts.js` and writes the XML. Run as part of the build step. Each entry includes `<loc>`, `<lastmod>`, `<changefreq>weekly</changefreq>`, and `<priority>` (0.8 for pillar, 0.6 for standard).

### robots.txt

`public/robots.txt`:
```
User-agent: *
Allow: /blog/
Disallow: /api/
Sitemap: https://billbytekot.in/sitemap.xml
```

### AdSense Preconnect

In `public/index.html` `<head>`:
```html
<link rel="preconnect" href="https://pagead2.googlesyndication.com" crossorigin>
```

---

## Play Store Promotion

### UTM-tagged Play Store URL (shared constant)

```js
// frontend/src/utils/playStoreUrl.js
export const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.billbytekot' +
  '&utm_source=blog&utm_medium=cta&utm_campaign=playstore';
```

All Play Store links across blog components import from this constant.

### AppDownloadBanner placement

- `BlogPostPage.js`: render `<AppDownloadBanner />` just before the article conclusion CTA block.
- On mobile (`< 768px`): render `<AppDownloadBanner mobile />` as sticky top bar (below the sticky header).

### Smart App Banner (mobile)

`AppDownloadBanner` with `mobile={true}` renders a fixed top strip:
```
[Play Store icon] BillByteKOT — Restaurant Billing App  [GET IT ON Google Play →]  [✕]
```
Dismissed via `sessionStorage`. Does not overlap the sticky nav header (uses `top: 64px`).

### AppPromoCard in sidebar

`BlogPage.js` and `BlogPostPage.js` sidebars both render `<AppPromoCard />`. The component is extracted to `frontend/src/components/blog/AppPromoCard.js`.

### Hindi CTA for India posts

In `AppDownloadBanner` and the conclusion CTA block, when `targetMarket` includes `"India"`:
```jsx
<span className="text-xs text-gray-400">अभी डाउनलोड करें</span>
```

### Dedicated landing page

Route: `/blog/restaurant-billing-app-android`

A new blog post entry in `blogPosts.js` with `slug: "restaurant-billing-app-android"`, `contentType: "app-feature"`, `appPromo: true`. The `BlogPostPage.js` detects `contentType === "app-feature"` and renders the `AppFeatureShowcase` section (screenshot carousel + feature list + Play Store CTA) before the standard content.

---

## Content Strategy

### 5 App-Download Posts (new entries in `blogPosts.js`)

| Slug | Primary Keyword | Market |
|------|----------------|--------|
| `restaurant-billing-app-android` | restaurant billing app android | India |
| `restaurant-pos-app-download` | restaurant POS app download | India/Global |
| `kot-app-for-android` | KOT app for android | India |
| `free-restaurant-billing-app-android` | free restaurant billing app android | India |
| `best-restaurant-app-india-android` | best restaurant app India android | India |

### 30+ International Posts

Distributed across:
- US (10): cloud POS, restaurant management software, small business POS, etc.
- UK (5): EPOS system, restaurant stock management, etc.
- UAE (5): Dubai POS, cloud kitchen UAE, etc.
- SEA (5): Singapore POS, Malaysia billing, etc.
- Global (5): multilingual, worldwide restaurant software

All posts include `targetMarket`, `primaryKeyword`, `searchVolume`, `keywordDifficulty`, `status: "published"`.

---

## Blog Listing Page Changes (`BlogPage.js`)

1. Import `publishedPosts` instead of raw `blogPosts` for rendering.
2. Add `MarketFilter` component above the post grid.
3. Filter `filteredPosts` by `selectedMarket` when set.
4. Render `<AppPromoCard />` in sidebar (already present — extract to shared component).
5. Add "New" badge on `PostCard` when `post.date` is within 14 days of today.
6. Implement pagination: show 20 posts per page, render page controls below the grid.

---

## Blog Post Page Changes (`BlogPostPage.js`)

1. Import `publishedPosts` for post lookup.
2. Add `<BreadcrumbNav>` below the article header.
3. Add `<AppDownloadBanner>` before the conclusion CTA.
4. Add `<AppDownloadBanner mobile>` on mobile (conditional render via `window.innerWidth < 768` or a CSS-only approach using a hidden/visible class).
5. Add `<LeadCaptureForm>` after the bottom AdSense slot.
6. Add `<TimedPopup>` mounted once per page.
7. Add `<RelatedArticles>` before the final ad.
8. Inject geo meta tag when `targetMarket` is set.
9. Inject in-content ads every ~800 words when content > 2000 words.
10. When `appPromo: true`, inject `<AppPromoCard compact />` between 2nd and 3rd content sections.
11. When `contentType === "app-feature"`, render `AppFeatureShowcase` section.

---

## File Structure

```
frontend/src/
  components/
    blog/
      AppDownloadBanner.js    (new)
      AppPromoCard.js         (extracted from BlogPage.js)
      InlineCTA.js            (new)
      StickyMobileCTA.js      (new)
      LeadCaptureForm.js      (new)
      TimedPopup.js           (new)
      RelatedArticles.js      (new)
      BreadcrumbNav.js        (new)
      MarketFilter.js         (new)
      PillarPage.js           (new)
      RestaurantCostCalculator.js  (new)
      KOTROICalculator.js     (new)
    AdSense.js                (modified — adFormat, campaignType, fallback)
  pages/
    BlogPage.js               (modified)
    BlogPostPage.js           (modified)
  data/
    blogPosts.js              (modified — schema + 35+ new posts)
  utils/
    playStoreUrl.js           (new)
  seo/
    index.js                  (modified — geo meta, BreadcrumbList schema)

public/
  robots.txt                  (new)
  sitemap.xml                 (generated by build script)

scripts/
  generate-sitemap.js         (new)
```

---

## Implementation Notes

- All new components use Tailwind CSS classes consistent with the existing codebase.
- No new npm dependencies are required — `react-helmet` is already used via `BlogPostSEO`.
- The `LeadCaptureForm` POSTs to the existing backend contact/lead endpoint (same as the demo booking form).
- The `TimedPopup` and `StickyMobileCTA` both use `sessionStorage` to prevent repeat shows.
- The `AppDownloadBanner` mobile sticky bar uses `position: fixed; top: 64px; z-index: 40` to sit below the sticky nav.
- Pagination in `BlogPage.js` uses local `useState` — no router changes needed.
- The sitemap generation script runs at build time (`npm run build` pre-hook) and writes to `public/sitemap.xml`.
