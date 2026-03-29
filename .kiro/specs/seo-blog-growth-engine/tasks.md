# Implementation Plan: SEO Blog Growth Engine

## Overview

Extend the existing React blog system to support global SEO targeting, AdSense revenue optimization, Play Store app promotion, lead generation components, and technical SEO infrastructure. All work is in `frontend/src/` plus `public/` and `scripts/`. No backend changes except the lead capture form POST.

## Tasks

- [x] 1. Extend `blogPosts.js` schema and add `publishedPosts` export
  - Add optional fields to existing post entries: `targetMarket`, `primaryKeyword`, `secondaryKeywords`, `searchVolume`, `keywordDifficulty`, `status`, `scheduledDate`, `contentType`, `leadMagnet`, `appPromo`
  - Add `publishedPosts` named export that filters by `status === 'published'` and respects `scheduledDate` for scheduled posts
  - Backfill existing posts with `status: "published"` and `targetMarket: ["India"]` where missing
  - _Requirements: 1.1, 1.2, 1.6, 6.1, 6.2, 6.3_

  - [ ]* 1.1 Write property test for `publishedPosts` filter correctness
    - **Property 1: publishedPosts never contains draft posts** — for any post array containing entries with `status: "draft"`, `publishedPosts` must exclude them
    - **Property 2: publishedPosts excludes scheduled posts with future scheduledDate** — for any post with `status: "scheduled"` and `scheduledDate` in the future, it must not appear in `publishedPosts`
    - **Property 3: publishedPosts includes scheduled posts whose scheduledDate ≤ now** — for any post with `status: "scheduled"` and `scheduledDate` ≤ current date, it must appear in `publishedPosts`
    - **Validates: Requirements 6.1, 6.2**

- [x] 2. Create `frontend/src/utils/playStoreUrl.js`
  - Export `PLAY_STORE_URL` constant with UTM parameters: `utm_source=blog&utm_medium=cta&utm_campaign=playstore`
  - _Requirements: 10.9_

- [x] 3. Enhance `AdSense.js` with `adFormat`, `campaignType`, 5s fallback CTA, and dev logging
  - Add `adFormat` prop (values: `"auto"`, `"rectangle"`, `"leaderboard"`, `"skyscraper"`) passed as `data-ad-format`
  - Add `campaignType` prop (values: `"adsense"`, `"display"`) for differentiating ad types
  - Add 5-second timeout: if `window.adsbygoogle` hasn't loaded after 5s, render a fallback `<div>` with a `/login` free trial CTA
  - In dev mode (`process.env.NODE_ENV !== 'production'`), log `[AdSense] slot={slot} rendered` to console; suppress in production
  - Preserve existing `isBlogPage` guard and all existing props
  - _Requirements: 3.4, 3.6, 8.1, 8.5_

  - [ ]* 3.1 Write unit tests for AdSense fallback and dev logging
    - Test that fallback CTA renders when adsbygoogle fails to load within 5s
    - Test that console.log fires in dev mode and not in production
    - _Requirements: 3.6, 8.5_

- [x] 4. Create blog component directory and `AppPromoCard.js`
  - Create `frontend/src/components/blog/` directory
  - Extract the `AppPromoCard` component from `BlogPage.js` into `frontend/src/components/blog/AppPromoCard.js`
  - Accept `compact` prop (existing behavior)
  - Update `BlogPage.js` to import from the new location
  - _Requirements: 10.10_

- [x] 5. Create `frontend/src/components/blog/AppDownloadBanner.js`
  - Props: `{ mobile?: boolean, utmCampaign?: string, targetMarket?: string[] }`
  - Default (inline) mode: card with Google Play badge, star rating, ≤20-word description, and Play Store link using `PLAY_STORE_URL`
  - `mobile={true}` mode: fixed top strip at `top: 64px; z-index: 40` with app name, "GET IT ON Google Play" badge, and dismiss button (stored in `sessionStorage`)
  - When `targetMarket` includes `"India"`, render Hindi supporting text `"अभी डाउनलोड करें"` alongside English CTA
  - _Requirements: 10.1, 10.2, 10.7_

- [x] 6. Create `frontend/src/components/blog/InlineCTA.js`
  - Renders a highlighted CTA block linking to `/login`
  - Accepts `market` prop to switch currency display: `"India"` → INR, `"US"` → USD, `"UK"` → GBP, `"UAE"` → AED
  - _Requirements: 4.1, 4.7_

  - [ ]* 6.1 Write property test for market-appropriate CTA rendering
    - **Property 4: InlineCTA always renders a currency symbol matching the market prop** — for any valid market value, the rendered output must contain the corresponding currency symbol and never a currency from a different market
    - **Validates: Requirements 4.7**

- [x] 7. Create `frontend/src/components/blog/StickyMobileCTA.js`
  - Fixed bottom bar on mobile (`< 768px`) with "Start Free Trial" button linking to `/login`
  - Dismiss via close icon; store dismissed state in `sessionStorage` so it doesn't reappear in the same session
  - _Requirements: 4.2_

- [x] 8. Create `frontend/src/components/blog/LeadCaptureForm.js`
  - Fields: restaurant name, owner name, phone number, restaurant type (select)
  - POST to existing backend contact/lead endpoint (same as demo booking form)
  - Show success state after submission
  - _Requirements: 4.4_

- [x] 9. Create `frontend/src/components/blog/TimedPopup.js`
  - Triggers after 60 seconds on page using `setTimeout`
  - Shows once per browser session via `sessionStorage` flag
  - Offers free trial or demo booking with links to `/login` and `/contact?demo=true`
  - _Requirements: 4.5_

- [x] 10. Create `frontend/src/components/blog/RelatedArticles.js`
  - Accepts `posts[]`, `currentSlug`, `targetMarket`, `category`
  - Shows 3 posts: prefer same `targetMarket`, fall back to same `category`
  - _Requirements: 4.6_

- [x] 11. Create `frontend/src/components/blog/BreadcrumbNav.js`
  - Renders: Home > Blog > [Category] > [Post Title]
  - Injects JSON-LD `BreadcrumbList` schema via `react-helmet`
  - _Requirements: 5.7_

- [x] 12. Create `frontend/src/components/blog/MarketFilter.js`
  - Pill-style filter buttons for each unique `targetMarket` value across published posts
  - Accepts `markets[]`, `selected`, `onChange` props
  - Only renders when more than one `targetMarket` value exists
  - _Requirements: 6.5_

- [x] 13. Create `frontend/src/components/blog/PillarPage.js`
  - Accepts `topic`, `description`, `posts[]` props
  - Renders topic header, description, and a grid of linked post cards
  - _Requirements: 7.6_

- [x] 14. Create `frontend/src/components/blog/RestaurantCostCalculator.js`
  - Inputs: monthly revenue, food cost %, labor cost %, overhead %
  - Outputs: net profit, profit margin %, recommendation text
  - On completion, renders `LeadCaptureForm` with "Save Your Results" prompt
  - _Requirements: 7.1, 7.3_

- [x] 15. Create `frontend/src/components/blog/KOTROICalculator.js`
  - Inputs: number of tables, average covers/day, average order value, current error rate %
  - Outputs: estimated monthly savings, payback period in months
  - On completion, renders `LeadCaptureForm` with "Save Your Results" prompt
  - _Requirements: 7.2, 7.3_

- [x] 16. Extend SEO infrastructure in `frontend/src/seo/index.js`
  - Ensure `BlogPostSEO` injects `Article` JSON-LD schema with all required fields: `headline`, `description`, `author`, `datePublished`, `dateModified`, `image`, `publisher`, `url`
  - Add `BreadcrumbList` JSON-LD schema support (consumed by `BreadcrumbNav`)
  - Add geo meta tag injection: map `targetMarket` → ISO 3166-1 alpha-2 code and render `<meta name="geo.region">`
  - Ensure `<link rel="canonical">` uses `https://billbytekot.in/blog/{slug}` consistently
  - Ensure Open Graph and Twitter Card tags are present on all blog pages
  - Add `<meta name="robots" content="index, follow">` for published posts and `noindex, nofollow` for drafts
  - Add `<meta property="article:published_time">` and `<meta property="article:modified_time">` tags
  - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 6.6_

- [x] 17. Update `BlogPage.js`
  - Import `publishedPosts` from `blogPosts.js` instead of raw `blogPosts` for all rendering
  - Import and render `<MarketFilter>` above the post grid; wire `selectedMarket` state
  - Filter `filteredPosts` by `selectedMarket` when set
  - Import `AppPromoCard` from `frontend/src/components/blog/AppPromoCard.js`
  - Add "New" badge on `PostCard` when `post.date` is within 14 days of today
  - Implement pagination: show 20 posts per page with page controls below the grid
  - _Requirements: 6.4, 6.5, 9.3_

  - [ ]* 17.1 Write unit tests for "New" badge logic and pagination
    - Test that "New" badge appears only for posts dated within 14 days
    - Test that pagination slices posts correctly at 20 per page
    - _Requirements: 6.4, 9.3_

- [x] 18. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 19. Update `BlogPostPage.js` — core structural changes
  - Import `publishedPosts` for post lookup instead of raw `blogPosts`
  - Import and render `<BreadcrumbNav>` below the article header
  - Import and render `<AppDownloadBanner>` before the conclusion CTA block
  - Import and render `<AppDownloadBanner mobile>` conditionally for mobile (use CSS class `md:hidden` or check `window.innerWidth < 768`)
  - Import and render `<LeadCaptureForm>` after the bottom AdSense slot
  - Import and mount `<TimedPopup>` once per page
  - Import and render `<RelatedArticles>` before the final ad
  - Inject `<meta name="geo.region">` when `targetMarket` is set on the post
  - _Requirements: 4.4, 4.5, 4.6, 5.4, 10.1, 10.2_

- [x] 20. Update `BlogPostPage.js` — in-content ad injection and app promo
  - After splitting content into paragraph blocks, inject an `<AdSense>` unit after every ~800 words when total word count > 2000, capped at 5 total ad units per page
  - When `post.appPromo === true`, inject `<AppPromoCard compact />` between the 2nd and 3rd content sections
  - When `post.contentType === "app-feature"`, render an `AppFeatureShowcase` section (screenshot carousel placeholder + feature list + Play Store CTA using `PLAY_STORE_URL`) before the standard content
  - Render `<InlineCTA market={post.targetMarket?.[0]}>` at the 40–60% content position
  - Enforce max 5 total ad units per page (AdSense + display combined)
  - _Requirements: 3.1, 3.5, 3.3, 4.1, 8.3, 10.4, 10.6_

  - [ ]* 20.1 Write property test for in-content ad injection word count logic
    - **Property 5: ad injection never exceeds 5 units** — for any content string of any length, the number of injected ad units must be ≤ 5
    - **Property 6: no ads injected when word count ≤ 2000** — for any content with ≤ 2000 words, zero in-content ads are injected
    - **Property 7: ad spacing is at least 800 words apart** — for any content > 2000 words, consecutive ad injection points are separated by ≥ 800 words
    - **Validates: Requirements 3.5, 8.3**

- [x] 21. Add `public/robots.txt`
  - Content: `User-agent: *`, `Allow: /blog/`, `Disallow: /api/`, `Sitemap: https://billbytekot.in/sitemap.xml`
  - _Requirements: 9.4_

- [x] 22. Add AdSense preconnect to `public/index.html`
  - Add `<link rel="preconnect" href="https://pagead2.googlesyndication.com" crossorigin>` in `<head>`
  - _Requirements: 9.6_

- [x] 23. Create `scripts/generate-sitemap.js`
  - Node.js script that imports `publishedPosts` from `blogPosts.js` (via require/dynamic import)
  - Writes `public/sitemap.xml` with `<loc>`, `<lastmod>`, `<changefreq>weekly</changefreq>`, and `<priority>` (0.8 for `contentType: "pillar"`, 0.6 for all others)
  - Add as a pre-build step in `package.json` (`"prebuild": "node scripts/generate-sitemap.js"`)
  - _Requirements: 5.1_

- [x] 24. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 25. Add 35+ new blog posts to `blogPosts.js`
  - Add 10 US-market posts targeting: "restaurant POS system USA", "best restaurant management software US", "restaurant billing app for small business", "cloud POS system restaurant", "restaurant inventory management software", and 5 additional US clusters; include `targetMarket: ["US"]`, USD pricing, `status: "published"`
  - Add 5 UK-market posts targeting: "restaurant POS system UK", "EPOS system restaurant UK", "restaurant stock management software UK", "restaurant billing software UK", "best restaurant management software UK"; include `targetMarket: ["UK"]`, GBP pricing
  - Add 5 UAE-market posts targeting: "restaurant POS system Dubai", "restaurant billing software UAE", "cloud kitchen software UAE", "food delivery management software Dubai", "restaurant management app Middle East"; include `targetMarket: ["UAE"]`, AED pricing
  - Add 5 SEA-market posts targeting: "restaurant POS system Singapore", "restaurant billing software Malaysia", "restaurant management app Philippines", "cloud POS restaurant Southeast Asia", and one additional SEA cluster; include `targetMarket: ["Singapore"]` / `["Malaysia"]` etc.
  - Add 5 Global/English posts with `targetMarket: ["Global"]`
  - Add 5 app-download posts with `targetMarket: ["India"]`, `contentType: "app-feature"` or `appPromo: true`: slugs `restaurant-billing-app-android`, `restaurant-pos-app-download`, `kot-app-for-android`, `free-restaurant-billing-app-android`, `best-restaurant-app-india-android`
  - All new posts must include: `title`, `metaTitle`, `metaDescription`, `slug`, `primaryKeyword`, `targetMarket`, `category`, `content`, `date`, `readTime`, `image`, `imageAlt`, `status: "published"`, `searchVolume`, `keywordDifficulty`
  - _Requirements: 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 10.3, 10.8_

- [x] 26. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests (tasks 1.1, 6.1, 20.1) use fast-check or a similar JS property-based testing library
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation before moving to the next phase
- The `publishedPosts` filter is the single source of truth for all public-facing post rendering
- All Play Store links must import `PLAY_STORE_URL` from `utils/playStoreUrl.js` — no hardcoded URLs
- The 5-ad-unit cap (Requirement 8.3) applies across all ad types combined per page
