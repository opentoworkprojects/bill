# Requirements Document

## Introduction

BillByteKOT is a KOT-first restaurant automation platform priced at ₹1,999/year. The product currently has a React-based blog system with 58+ posts, AdSense integration (ca-pub-3519568544880293), and content targeting primarily the Indian restaurant market. This feature — the **SEO Blog Growth Engine** — expands the blog's global reach, improves organic search rankings worldwide, increases Google AdSense revenue, and drives more qualified leads through high-value content targeting restaurant operators in the US, UK, UAE, Southeast Asia, and other international markets, in addition to deepening India coverage.

---

## Glossary

- **Blog_Engine**: The React-based blog system at `frontend/src/data/blogPosts.js`, `BlogPage.js`, and `BlogPostPage.js`
- **AdSense_Component**: The existing `frontend/src/components/AdSense.js` component using client ID `ca-pub-3519568544880293`
- **Content_Calendar**: A structured schedule of planned blog posts mapped to target keywords and markets
- **Keyword_Cluster**: A group of semantically related search terms targeting the same user intent
- **Schema_Markup**: Structured data (JSON-LD) embedded in pages to improve search engine understanding
- **CTA**: Call-to-action element embedded in blog content to convert readers into trial signups or leads
- **Lead_Magnet**: A free resource (calculator, template, guide) offered in exchange for user engagement or signup
- **RPM**: Revenue Per Mille — AdSense earnings per 1,000 page views
- **SERP**: Search Engine Results Page
- **Sitemap**: An XML file listing all blog URLs for search engine crawling
- **Internal_Link**: A hyperlink from one page on billbytekot.in to another page on the same domain
- **Canonical_URL**: The preferred URL for a page, declared via `<link rel="canonical">` to prevent duplicate content
- **Content_Upgrade**: A piece of bonus content (checklist, PDF, template) offered within a blog post to capture leads
- **Global_Market**: Any restaurant market outside India, including US, UK, UAE, Singapore, Malaysia, Australia, Canada
- **Hreflang**: An HTML attribute signaling to search engines which language/region a page targets

---

## Requirements

### Requirement 1: Global Keyword Research and Targeting Strategy

**User Story:** As a marketing manager, I want the blog to target high-volume restaurant keywords in global markets, so that BillByteKOT ranks on Google worldwide and attracts international restaurant owners.

#### Acceptance Criteria

1. THE Blog_Engine SHALL support blog posts tagged with a `targetMarket` field accepting values: `["India", "US", "UK", "UAE", "Singapore", "Malaysia", "Australia", "Canada", "Global"]`
2. THE Blog_Engine SHALL support a `primaryKeyword` field and a `secondaryKeywords` array field on each blog post entry, enabling keyword tracking per post
3. WHEN a blog post has `targetMarket` values outside `["India"]`, THE Blog_Engine SHALL render the post's meta title and meta description using market-appropriate terminology (e.g., "POS system" for US/UK, "billing software" for India, "restaurant management app" for UAE)
4. THE Blog_Engine SHALL include at least 30 new blog posts targeting Global_Market Keyword_Clusters within the first content batch, covering markets: US (10 posts), UK (5 posts), UAE (5 posts), Southeast Asia (5 posts), and Global/English (5 posts)
5. WHEN a blog post targets a Global_Market, THE Blog_Engine SHALL render the post's currency references, pricing examples, and regulatory references appropriate to that market (e.g., USD for US posts, GBP for UK posts, AED for UAE posts)
6. THE Blog_Engine SHALL support a `keywordDifficulty` field (values: `"low"`, `"medium"`, `"high"`) and a `searchVolume` field (numeric, monthly searches) on each blog post to enable content prioritization

---

### Requirement 2: High-Value Blog Content for International Restaurant Markets

**User Story:** As a restaurant owner in the US, UK, or UAE, I want to find blog content relevant to my market, so that I can discover BillByteKOT as a solution to my restaurant management problems.

#### Acceptance Criteria

1. THE Blog_Engine SHALL contain blog posts targeting each of the following US-market Keyword_Clusters: "restaurant POS system USA", "best restaurant management software US", "restaurant billing app for small business", "cloud POS system restaurant", "restaurant inventory management software"
2. THE Blog_Engine SHALL contain blog posts targeting each of the following UAE-market Keyword_Clusters: "restaurant POS system Dubai", "restaurant billing software UAE", "restaurant management app Middle East", "cloud kitchen software UAE", "food delivery management software Dubai"
3. THE Blog_Engine SHALL contain blog posts targeting each of the following UK-market Keyword_Clusters: "restaurant POS system UK", "restaurant billing software UK", "best restaurant management software UK", "EPOS system restaurant UK", "restaurant stock management software UK"
4. THE Blog_Engine SHALL contain blog posts targeting each of the following Southeast Asia Keyword_Clusters: "restaurant POS system Singapore", "restaurant billing software Malaysia", "restaurant management app Philippines", "cloud POS restaurant Southeast Asia"
5. WHEN a new blog post is added to `blogPosts.js`, THE Blog_Engine SHALL require the post to include: `title`, `metaTitle`, `metaDescription`, `slug`, `primaryKeyword`, `targetMarket`, `category`, `content`, `date`, `readTime`, and `image` fields
6. THE Blog_Engine SHALL contain at least 10 "value-added content" posts per quarter, defined as posts containing one of: an embedded interactive calculator, a downloadable template reference, a step-by-step checklist, or a comparison table with 5+ rows

---

### Requirement 3: AdSense Revenue Optimization

**User Story:** As a product owner, I want AdSense ad placements to be optimized for maximum RPM, so that blog traffic generates meaningful ad revenue.

#### Acceptance Criteria

1. THE AdSense_Component SHALL render a minimum of 3 ad units per blog post page: one above the article fold (top), one mid-article (after the 3rd content section), and one below the article (bottom)
2. THE AdSense_Component SHALL render a minimum of 2 ad units on the blog listing page (`/blog`): one between the featured posts section and the all-posts grid, and one at the bottom of the page
3. WHEN a blog post page renders on a viewport wider than 1024px, THE AdSense_Component SHALL render an additional sticky sidebar ad unit using slot `2847291650`
4. THE AdSense_Component SHALL support an `adFormat` prop accepting values `"auto"`, `"rectangle"`, `"leaderboard"`, `"skyscraper"` to allow format-specific placement optimization
5. WHEN the Blog_Engine renders a blog post with `content` length exceeding 2000 words, THE AdSense_Component SHALL inject an additional in-content ad unit after every 800 words of content
6. IF the AdSense script fails to load within 5 seconds, THEN THE AdSense_Component SHALL render a fallback promotional unit linking to `/login` with the BillByteKOT free trial CTA, so that ad slot space is never wasted
7. THE AdSense_Component SHALL only activate on pages where `location.pathname.startsWith('/blog')` is true, preserving the existing behavior and preventing ads on product pages

---

### Requirement 4: Lead Generation Through Blog Content

**User Story:** As a sales team member, I want blog readers to convert into trial signups and demo requests, so that organic traffic generates qualified leads for BillByteKOT.

#### Acceptance Criteria

1. THE Blog_Engine SHALL render an inline CTA block within every blog post at a position between 40% and 60% of the article's total content length, containing a link to `/login` with a free trial offer
2. THE Blog_Engine SHALL render a sticky bottom CTA bar on mobile viewports (width < 768px) on all blog post pages, containing a "Start Free Trial" button linking to `/login`
3. WHEN a blog post has `leadMagnet: true` set in its data, THE Blog_Engine SHALL render a highlighted content upgrade box containing the lead magnet description and a CTA button before the article's conclusion section
4. THE Blog_Engine SHALL render a newsletter/lead capture form at the bottom of every blog post page, collecting at minimum: restaurant name, owner name, phone number, and restaurant type, with form submission sending data to the existing backend API
5. WHEN a user spends more than 60 seconds on a blog post page, THE Blog_Engine SHALL display an exit-intent or timed popup offering a free trial or demo booking, no more than once per browser session
6. THE Blog_Engine SHALL render "Related Articles" sections at the end of each post showing 3 posts from the same `targetMarket` or `category`, to increase pages-per-session and reduce bounce rate
7. WHEN a blog post targets a Global_Market other than India, THE Blog_Engine SHALL render CTAs with market-appropriate pricing (e.g., USD pricing for US posts, AED pricing for UAE posts) rather than INR pricing

---

### Requirement 5: Technical SEO Improvements

**User Story:** As a developer, I want the blog's technical SEO foundation to be solid, so that search engines can crawl, index, and rank all blog content effectively.

#### Acceptance Criteria

1. THE Blog_Engine SHALL generate a dynamic XML sitemap at `/sitemap.xml` listing all blog post URLs with `<lastmod>`, `<changefreq>`, and `<priority>` values
2. WHEN a blog post is rendered, THE Blog_Engine SHALL inject a JSON-LD `Article` schema markup block into the page `<head>` containing: `headline`, `description`, `author`, `datePublished`, `dateModified`, `image`, `publisher`, and `url` fields
3. THE Blog_Engine SHALL render a `<link rel="canonical">` tag on every blog post page pointing to `https://billbytekot.in/blog/{slug}`
4. WHEN a blog post has `targetMarket` set to a specific country, THE Blog_Engine SHALL render a `<meta name="geo.region">` tag with the appropriate ISO 3166-1 alpha-2 country code
5. THE Blog_Engine SHALL render Open Graph tags (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`) and Twitter Card tags on every blog post and blog listing page
6. THE Blog_Engine SHALL render a `<meta name="robots" content="index, follow">` tag on all published blog posts and a `<meta name="robots" content="noindex, nofollow">` tag on any draft or unpublished posts
7. WHEN a blog post page renders, THE Blog_Engine SHALL include a breadcrumb navigation component with JSON-LD `BreadcrumbList` schema: Home > Blog > [Category] > [Post Title]
8. THE Blog_Engine SHALL ensure all blog post images include descriptive `alt` text stored in the `imageAlt` field of the blog post data, and SHALL render that `alt` text on the hero image element
9. THE Blog_Engine SHALL render Internal_Link suggestions within blog post content, linking to at least 2 other blog posts on the same domain per article, using anchor text that matches the target post's `primaryKeyword`

---

### Requirement 6: Content Calendar and Publishing Cadence

**User Story:** As a content manager, I want a structured content publishing plan, so that the blog grows consistently and targets the right keywords at the right time.

#### Acceptance Criteria

1. THE Blog_Engine SHALL support a `status` field on blog post entries accepting values: `"published"`, `"draft"`, `"scheduled"`, with only `"published"` posts rendered on the public blog
2. WHEN a blog post has `status: "scheduled"` and a `scheduledDate` field set to a future date, THE Blog_Engine SHALL not render that post until the current date equals or exceeds the `scheduledDate`
3. THE Blog_Engine SHALL support a `contentType` field accepting values: `"standard"`, `"pillar"`, `"comparison"`, `"how-to"`, `"listicle"`, `"case-study"`, `"tool-page"`, `"city-guide"` to enable content type filtering and reporting
4. THE Blog_Engine SHALL render a "New" badge on blog posts published within the last 14 days, using the post's `date` field for calculation
5. THE Blog_Engine SHALL support filtering blog posts by `targetMarket` on the blog listing page, rendering a market filter UI component above the post grid when more than one `targetMarket` value exists across published posts
6. THE Blog_Engine SHALL render a `<meta name="article:published_time">` and `<meta name="article:modified_time">` tag on every blog post using the post's `date` and `lastModified` fields respectively

---

### Requirement 7: Value-Added Content and Interactive Tools

**User Story:** As a restaurant owner, I want access to free tools and resources within the blog, so that I find genuine value and am more likely to try BillByteKOT.

#### Acceptance Criteria

1. THE Blog_Engine SHALL render a "Restaurant Cost Calculator" interactive tool page at `/blog/restaurant-cost-calculator` that accepts inputs: monthly revenue, food cost percentage, labor cost percentage, and overhead percentage, and outputs: net profit, profit margin percentage, and a recommendation
2. THE Blog_Engine SHALL render a "KOT System ROI Calculator" interactive tool page at `/blog/kot-system-roi-calculator` that accepts inputs: number of tables, average covers per day, average order value, and current error rate percentage, and outputs: estimated monthly savings and payback period in months
3. WHEN a user completes a calculator on a tool page, THE Blog_Engine SHALL display a CTA offering to "Save Your Results" by entering their phone number, which submits the lead to the backend
4. THE Blog_Engine SHALL render downloadable resource pages for: restaurant menu templates, restaurant SOP checklist, KOT implementation guide, and restaurant inventory spreadsheet template — each page containing a download CTA that requires phone number submission
5. WHEN a downloadable resource page is accessed, THE Blog_Engine SHALL track the page view and resource download event using the existing analytics integration
6. THE Blog_Engine SHALL render "Pillar Content" pages for each major topic cluster: "Restaurant POS Systems", "KOT Systems Guide", "Restaurant Billing Software", "Restaurant Management Software" — each pillar page linking to all related blog posts in that cluster

---

### Requirement 8: Google Ads Integration for Additional Revenue

**User Story:** As a product owner, I want to optionally display Google Display Ads alongside AdSense on high-traffic blog pages, so that ad revenue is maximized beyond AdSense alone.

#### Acceptance Criteria

1. THE AdSense_Component SHALL support a `campaignType` prop accepting values `"adsense"` and `"display"` to differentiate between AdSense auto-ads and manually placed display ad units
2. WHERE Google Ads display campaigns are configured, THE Blog_Engine SHALL render display ad slots in the blog sidebar and between post sections using the existing AdSense_Component infrastructure
3. THE Blog_Engine SHALL not render more than 5 total ad units (AdSense + Display combined) on any single blog post page, to comply with Google's ad density policies and preserve user experience
4. WHEN a blog post page has fewer than 1000 words of content, THE Blog_Engine SHALL render no more than 2 ad units on that page to maintain content-to-ad ratio compliance
5. THE AdSense_Component SHALL log ad unit render events to the browser console in development mode, and SHALL suppress all console output in production mode

---

### Requirement 9: Blog Performance and Crawlability

**User Story:** As a developer, I want the blog to load fast and be fully crawlable, so that search engines rank it higher and users have a good experience.

#### Acceptance Criteria

1. THE Blog_Engine SHALL lazy-load all blog post hero images using the `loading="lazy"` attribute on `<img>` elements that appear below the fold
2. THE Blog_Engine SHALL render the first blog post hero image with `loading="eager"` and `fetchpriority="high"` to optimize Largest Contentful Paint (LCP)
3. WHEN the blog listing page renders more than 20 posts, THE Blog_Engine SHALL implement pagination or infinite scroll, loading posts in batches of 20, to reduce initial page load size
4. THE Blog_Engine SHALL render a `robots.txt` file accessible at `/robots.txt` that allows all crawlers on `/blog/*` paths and references the sitemap URL
5. WHEN a blog post slug does not match any entry in `blogPosts.js` or any markdown file, THE Blog_Engine SHALL render a 404 page with a "Back to Blog" link and 3 featured post recommendations, rather than a blank page
6. THE Blog_Engine SHALL preload the Google AdSense script using a `<link rel="preconnect">` tag to `https://pagead2.googlesyndication.com` in the document `<head>` to reduce ad load latency

---

### Requirement 10: Play Store App Promotion Through Blog

**User Story:** As a product owner, I want the blog to actively promote the BillByteKOT Android app on Google Play Store, so that blog traffic converts into more app downloads and increases the app's Play Store ranking.

#### Acceptance Criteria

1. THE Blog_Engine SHALL render an app download banner component on every blog post page containing: the BillByteKOT app name, a "GET IT ON Google Play" badge linking to the Play Store listing, a star rating display, and a short app description of no more than 20 words
2. WHEN a blog post page is accessed on a mobile viewport (width < 768px), THE Blog_Engine SHALL render a Smart App Banner or equivalent sticky CTA at the top of the page prompting the user to download the BillByteKOT Android app from Google Play Store
3. THE Blog_Engine SHALL contain at least 5 dedicated blog posts targeting app-download Keyword_Clusters, including: "restaurant billing app android", "restaurant POS app download", "KOT app for android", "free restaurant billing app android", and "best restaurant app India android"
4. WHEN a blog post belongs to the `contentType: "app-feature"` category, THE Blog_Engine SHALL render an app feature showcase section containing: a screenshot carousel, a feature list, and a Play Store download CTA button
5. THE Blog_Engine SHALL render a Play Store download CTA block within every blog post at the article's conclusion section, containing the Google Play badge, the app's average rating, and a link to the Play Store listing URL
6. THE Blog_Engine SHALL support an `appPromo: true` field on blog post entries, and WHEN `appPromo` is true, THE Blog_Engine SHALL render an inline app promotion card within the article body between the 2nd and 3rd content sections
7. WHEN a blog post targets `targetMarket: "India"`, THE Blog_Engine SHALL render the app download CTA with Hindi-language supporting text ("अभी डाउनलोड करें") alongside the English CTA to improve conversion for Indian users
8. THE Blog_Engine SHALL render a dedicated landing page at `/blog/restaurant-billing-app-android` targeting the keyword "restaurant billing app android free download", containing: app screenshots, feature list, Play Store download button, user reviews section, and FAQ schema markup
9. WHEN a user clicks any Play Store download link within the blog, THE Blog_Engine SHALL append UTM parameters `utm_source=blog&utm_medium=cta&utm_campaign=playstore` to the Play Store URL to enable download attribution tracking
10. THE Blog_Engine SHALL render the `AppPromoCard` component in the blog sidebar on all blog listing and blog post pages, ensuring the Play Store download option is always visible to desktop users browsing the blog
