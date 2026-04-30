/**
 * SEO Configuration
 * 
 * Central configuration for the SEO Enhancement system.
 * Contains default settings, keyword lists, and system parameters.
 * 
 * @requirements 4.1, 6.1
 */

import { SearchIntent, KeywordPriority, ContentCategory } from '../types';

/**
 * Default SEO Configuration
 */
const SEOConfig = {
  // Site Information
  site: {
    name: 'BillByteKOT',
    domain: 'billbytekot.in',
    baseUrl: 'https://billbytekot.in',
    description: 'Best restaurant billing software in India with FREE KOT system, thermal printing, GST billing & WhatsApp integration. Trusted by 500+ restaurants.',
    logo: 'https://billbytekot.in/logo.png',
    defaultImage: 'https://billbytekot.in/og-default.jpg',
    twitterHandle: '@billbytekot',
    language: 'en-IN',
    locale: 'en_IN'
  },

  // Primary Keywords (Brand and Core Business)
  primaryKeywords: [
    {
      term: 'billbytekot',
      searchVolume: 1000,
      difficulty: 20,
      intent: SearchIntent.NAVIGATIONAL,
      priority: KeywordPriority.HIGH
    },
    {
      term: 'restaurant billing software',
      searchVolume: 8100,
      difficulty: 65,
      intent: SearchIntent.COMMERCIAL,
      priority: KeywordPriority.HIGH
    },
    {
      term: 'restaurant POS system',
      searchVolume: 6600,
      difficulty: 70,
      intent: SearchIntent.COMMERCIAL,
      priority: KeywordPriority.HIGH
    },
    {
      term: 'KOT software',
      searchVolume: 2400,
      difficulty: 45,
      intent: SearchIntent.COMMERCIAL,
      priority: KeywordPriority.HIGH
    },
    {
      term: 'kitchen order ticket system',
      searchVolume: 1300,
      difficulty: 40,
      intent: SearchIntent.COMMERCIAL,
      priority: KeywordPriority.HIGH
    },
    {
      term: 'restaurant management software',
      searchVolume: 5400,
      difficulty: 68,
      intent: SearchIntent.COMMERCIAL,
      priority: KeywordPriority.HIGH
    }
  ],

  // Secondary Keywords (Supporting and Long-tail)
  secondaryKeywords: [
    {
      term: 'GST billing software for restaurants',
      searchVolume: 1900,
      difficulty: 55,
      intent: SearchIntent.COMMERCIAL,
      priority: KeywordPriority.MEDIUM
    },
    {
      term: 'thermal printer billing software',
      searchVolume: 880,
      difficulty: 50,
      intent: SearchIntent.COMMERCIAL,
      priority: KeywordPriority.MEDIUM
    },
    {
      term: 'restaurant inventory management',
      searchVolume: 3600,
      difficulty: 60,
      intent: SearchIntent.COMMERCIAL,
      priority: KeywordPriority.MEDIUM
    },
    {
      term: 'food delivery management system',
      searchVolume: 2200,
      difficulty: 58,
      intent: SearchIntent.COMMERCIAL,
      priority: KeywordPriority.MEDIUM
    },
    {
      term: 'restaurant table management',
      searchVolume: 1600,
      difficulty: 52,
      intent: SearchIntent.COMMERCIAL,
      priority: KeywordPriority.MEDIUM
    },
    {
      term: 'WhatsApp restaurant ordering',
      searchVolume: 1100,
      difficulty: 48,
      intent: SearchIntent.COMMERCIAL,
      priority: KeywordPriority.MEDIUM
    },
    {
      term: 'restaurant staff management software',
      searchVolume: 720,
      difficulty: 45,
      intent: SearchIntent.COMMERCIAL,
      priority: KeywordPriority.LOW
    },
    {
      term: 'restaurant expense tracking',
      searchVolume: 590,
      difficulty: 42,
      intent: SearchIntent.COMMERCIAL,
      priority: KeywordPriority.LOW
    },
    {
      term: 'restaurant analytics dashboard',
      searchVolume: 480,
      difficulty: 40,
      intent: SearchIntent.COMMERCIAL,
      priority: KeywordPriority.LOW
    },
    {
      term: 'cloud restaurant software',
      searchVolume: 1400,
      difficulty: 55,
      intent: SearchIntent.COMMERCIAL,
      priority: KeywordPriority.MEDIUM
    }
  ],

  // Target Locations for Local SEO
  targetLocations: [
    { city: 'Mumbai', state: 'Maharashtra', country: 'IN', latitude: 19.0760, longitude: 72.8777 },
    { city: 'Delhi', state: 'Delhi', country: 'IN', latitude: 28.6139, longitude: 77.2090 },
    { city: 'Bangalore', state: 'Karnataka', country: 'IN', latitude: 12.9716, longitude: 77.5946 },
    { city: 'Hyderabad', state: 'Telangana', country: 'IN', latitude: 17.3850, longitude: 78.4867 },
    { city: 'Chennai', state: 'Tamil Nadu', country: 'IN', latitude: 13.0827, longitude: 80.2707 },
    { city: 'Kolkata', state: 'West Bengal', country: 'IN', latitude: 22.5726, longitude: 88.3639 },
    { city: 'Pune', state: 'Maharashtra', country: 'IN', latitude: 18.5204, longitude: 73.8567 },
    { city: 'Ahmedabad', state: 'Gujarat', country: 'IN', latitude: 23.0225, longitude: 72.5714 },
    { city: 'Jaipur', state: 'Rajasthan', country: 'IN', latitude: 26.9124, longitude: 75.7873 },
    { city: 'Surat', state: 'Gujarat', country: 'IN', latitude: 21.1702, longitude: 72.8311 }
  ],

  // Competitor Domains for Analysis
  competitorDomains: [
    'petpooja.com',
    'easyeats.in',
    'restroapp.com',
    'posist.com',
    'gofrugal.com',
    'dineout.co.in',
    'zomato.com/business',
    'swiggy.com/restaurant-partner'
  ],

  // Content Calendar Template
  contentCategories: {
    [ContentCategory.MANAGEMENT_TIPS]: {
      name: 'Restaurant Management Tips',
      description: 'Operational efficiency, staff management, customer service',
      targetKeywords: ['restaurant management', 'restaurant operations', 'staff management'],
      monthlyQuota: 6
    },
    [ContentCategory.BILLING_PRACTICES]: {
      name: 'Billing Best Practices',
      description: 'Payment processing, GST compliance, receipt management',
      targetKeywords: ['restaurant billing', 'GST billing', 'payment processing'],
      monthlyQuota: 6
    },
    [ContentCategory.INDUSTRY_TRENDS]: {
      name: 'Industry Trends',
      description: 'Restaurant technology, market analysis, regulatory updates',
      targetKeywords: ['restaurant technology', 'food industry trends', 'restaurant software'],
      monthlyQuota: 6
    },
    [ContentCategory.SOFTWARE_TUTORIALS]: {
      name: 'Software Tutorials',
      description: 'Feature guides, setup instructions, troubleshooting',
      targetKeywords: ['restaurant software tutorial', 'POS system setup', 'KOT system guide'],
      monthlyQuota: 6
    }
  },

  // Performance Targets
  performanceTargets: {
    organicTrafficGrowth: 150, // 150% growth target
    averagePosition: 15, // Target average position for tracked keywords
    keywordRankings: 100, // Target number of ranking keywords
    conversionRate: 3.5, // Target conversion rate %
    coreWebVitals: {
      lcp: 2500, // Largest Contentful Paint target (ms)
      fid: 100, // First Input Delay target (ms)
      cls: 0.1, // Cumulative Layout Shift target
      fcp: 1800, // First Contentful Paint target (ms)
      ttfb: 600 // Time to First Byte target (ms)
    }
  },

  // Technical SEO Settings
  technical: {
    maxTitleLength: 60,
    maxDescriptionLength: 155,
    maxKeywords: 10,
    canonicalEnabled: true,
    robotsEnabled: true,
    sitemapEnabled: true,
    schemaEnabled: true,
    openGraphEnabled: true,
    twitterCardEnabled: true
  },

  // Analytics Configuration
  analytics: {
    googleSearchConsole: {
      enabled: true,
      siteUrl: 'https://billbytekot.in',
      propertyId: null // To be configured
    },
    keywordTracking: {
      enabled: true,
      trackingInterval: 24, // hours
      maxKeywords: 200
    },
    competitorMonitoring: {
      enabled: true,
      checkInterval: 168, // hours (weekly)
      maxCompetitors: 10
    }
  },

  // Local SEO Settings
  localSEO: {
    enabled: true,
    businessType: 'SoftwareApplication',
    serviceAreas: ['India'],
    languages: ['English', 'Hindi'],
    businessHours: {
      monday: { open: '09:00', close: '18:00' },
      tuesday: { open: '09:00', close: '18:00' },
      wednesday: { open: '09:00', close: '18:00' },
      thursday: { open: '09:00', close: '18:00' },
      friday: { open: '09:00', close: '18:00' },
      saturday: { open: '10:00', close: '16:00' },
      sunday: { closed: true }
    }
  },

  // Content Optimization Rules
  contentOptimization: {
    keywordDensity: {
      primary: { min: 1.0, max: 3.0 }, // 1-3% for primary keywords
      secondary: { min: 0.5, max: 2.0 } // 0.5-2% for secondary keywords
    },
    internalLinking: {
      minLinksPerPost: 3,
      maxLinksPerPost: 8,
      contextualLinkRatio: 0.7 // 70% should be contextual links
    },
    contentLength: {
      blogPost: { min: 800, recommended: 1500 },
      landingPage: { min: 500, recommended: 1000 },
      productPage: { min: 300, recommended: 600 }
    }
  }
};

/**
 * Get configuration value by path
 * @param {string} path - Dot-separated path to config value
 * @param {*} defaultValue - Default value if path not found
 * @returns {*} Configuration value
 */
export const getConfig = (path, defaultValue = null) => {
  const keys = path.split('.');
  let value = SEOConfig;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return defaultValue;
    }
  }
  
  return value;
};

/**
 * Update configuration value by path
 * @param {string} path - Dot-separated path to config value
 * @param {*} newValue - New value to set
 */
export const setConfig = (path, newValue) => {
  const keys = path.split('.');
  const lastKey = keys.pop();
  let target = SEOConfig;
  
  for (const key of keys) {
    if (!target[key] || typeof target[key] !== 'object') {
      target[key] = {};
    }
    target = target[key];
  }
  
  target[lastKey] = newValue;
};

/**
 * Get all primary keywords
 * @returns {Array} Primary keywords array
 */
export const getPrimaryKeywords = () => SEOConfig.primaryKeywords;

/**
 * Get all secondary keywords
 * @returns {Array} Secondary keywords array
 */
export const getSecondaryKeywords = () => SEOConfig.secondaryKeywords;

/**
 * Get all target locations
 * @returns {Array} Target locations array
 */
export const getTargetLocations = () => SEOConfig.targetLocations;

/**
 * Get competitor domains
 * @returns {Array} Competitor domains array
 */
export const getCompetitorDomains = () => SEOConfig.competitorDomains;

export default SEOConfig;