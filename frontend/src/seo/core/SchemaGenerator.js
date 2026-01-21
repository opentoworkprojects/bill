/**
 * Schema Generator
 * 
 * Enhanced schema generation component that creates JSON-LD structured data
 * for various schema types with validation and optimization.
 * 
 * Features:
 * - Dynamic schema data population based on page context
 * - Schema validation against schema.org specifications
 * - Support for SoftwareApplication, Organization, LocalBusiness, and more
 * - Automatic schema type detection and optimization
 * - Error handling and graceful degradation
 * 
 * @requirements 1.2, 1.4, 4.2, 5.4
 */

import SEOConfig from '../config/SEOConfig';
import { SchemaType, ContentType } from '../types';

class SchemaGenerator {
  constructor(config = {}) {
    this.config = { ...SEOConfig, ...config };
    this.validationCache = new Map();
    this.schemaCache = new Map();
  }

  /**
   * Generate schema markup for content with enhanced dynamic population
   * @param {ContentType} contentType - Type of content
   * @param {Object} data - Content data
   * @param {Object} options - Generation options
   * @returns {JSONLDSchema} Generated schema markup
   */
  generateSchema(contentType, data, options = {}) {
    try {
      // Create cache key for performance optimization
      const cacheKey = this._createCacheKey(contentType, data, options);
      
      if (this.schemaCache.has(cacheKey) && !options.skipCache) {
        return this.schemaCache.get(cacheKey);
      }

      let schema = null;
      
      // Enhanced dynamic data population
      const enrichedData = this._enrichDataWithContext(data, contentType);
      
      switch (contentType) {
        case ContentType.HOMEPAGE:
          schema = this.generateHomepageSchema(enrichedData, options);
          break;
        case ContentType.PRODUCT_PAGE:
          schema = this.generateProductSchema(enrichedData, options);
          break;
        case ContentType.BLOG_POST:
          schema = this.generateArticleSchema(enrichedData, options);
          break;
        case ContentType.LANDING_PAGE:
          schema = this.generateLandingPageSchema(enrichedData, options);
          break;
        case ContentType.CATEGORY_PAGE:
          schema = this.generateCategorySchema(enrichedData, options);
          break;
        default:
          console.warn(`SchemaGenerator: Unknown content type: ${contentType}`);
          return null;
      }

      if (schema) {
        const result = {
          type: Array.isArray(schema['@graph']) ? 'Graph' : schema['@type'],
          context: schema['@context'],
          data: schema,
          pageUrl: enrichedData.url || this.config.site.baseUrl,
          lastUpdated: new Date(),
          contentType,
          validation: this.validateSchema(schema)
        };

        // Cache the result
        this.schemaCache.set(cacheKey, result);
        
        return result;
      }

      return null;
    } catch (error) {
      console.error('SchemaGenerator: Schema generation failed:', error);
      return this._createErrorSchema(error, contentType, data);
    }
  }

  /**
   * Enrich data with contextual information for dynamic population
   * @param {Object} data - Original data
   * @param {ContentType} contentType - Content type
   * @returns {Object} Enriched data
   */
  _enrichDataWithContext(data, contentType) {
    const enriched = { ...data };
    
    // Add default values from config
    enriched.siteName = enriched.siteName || this.config.site.name;
    enriched.siteUrl = enriched.siteUrl || this.config.site.baseUrl;
    enriched.logo = enriched.logo || this.config.site.logo;
    enriched.defaultImage = enriched.defaultImage || this.config.site.defaultImage;
    
    // Add contextual keywords based on content type
    if (!enriched.keywords || enriched.keywords.length === 0) {
      enriched.keywords = this._getContextualKeywords(contentType);
    }
    
    // Add structured contact information
    if (!enriched.contactInfo) {
      enriched.contactInfo = this._getContactInfo();
    }
    
    // Add business hours if applicable
    if (!enriched.businessHours && this.config.localSEO?.businessHours) {
      enriched.businessHours = this._formatBusinessHours(this.config.localSEO.businessHours);
    }
    
    // Add social media profiles
    if (!enriched.socialProfiles) {
      enriched.socialProfiles = this._getSocialProfiles();
    }
    
    // Add pricing information if available
    if (!enriched.pricing && contentType === ContentType.PRODUCT_PAGE) {
      enriched.pricing = this._getDefaultPricing();
    }
    
    return enriched;
  }

  /**
   * Get contextual keywords based on content type
   * @param {ContentType} contentType - Content type
   * @returns {Array} Contextual keywords
   */
  _getContextualKeywords(contentType) {
    const keywordMap = {
      [ContentType.HOMEPAGE]: ['restaurant software', 'billing system', 'POS system'],
      [ContentType.PRODUCT_PAGE]: ['restaurant billing', 'KOT system', 'GST billing'],
      [ContentType.BLOG_POST]: ['restaurant management', 'restaurant tips', 'food business'],
      [ContentType.LANDING_PAGE]: ['restaurant POS', 'billing software', 'restaurant technology'],
      [ContentType.CATEGORY_PAGE]: ['restaurant solutions', 'business software', 'restaurant tools']
    };
    
    return keywordMap[contentType] || ['restaurant software'];
  }

  /**
   * Get contact information from config
   * @returns {Object} Contact information
   */
  _getContactInfo() {
    return {
      email: 'support@billbytekot.in',
      phone: '+91-9876543210',
      address: {
        street: 'Tech Park',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        country: 'IN'
      }
    };
  }

  /**
   * Format business hours for schema
   * @param {Object} hours - Business hours config
   * @returns {Array} Formatted business hours
   */
  _formatBusinessHours(hours) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayMap = {
      monday: 'Mo', tuesday: 'Tu', wednesday: 'We', thursday: 'Th',
      friday: 'Fr', saturday: 'Sa', sunday: 'Su'
    };
    
    return days.map(day => {
      const dayHours = hours[day];
      if (dayHours?.closed) {
        return null;
      }
      
      return {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: dayMap[day],
        opens: dayHours?.open || '09:00',
        closes: dayHours?.close || '18:00'
      };
    }).filter(Boolean);
  }

  /**
   * Get social media profiles
   * @returns {Array} Social media URLs
   */
  _getSocialProfiles() {
    return [
      'https://www.facebook.com/billbytekot',
      'https://twitter.com/billbytekot',
      'https://www.linkedin.com/company/billbytekot',
      'https://www.instagram.com/billbytekot',
      'https://www.youtube.com/@billbytekot'
    ];
  }

  /**
   * Get default pricing information
   * @returns {Object} Pricing information
   */
  _getDefaultPricing() {
    return {
      price: '1999',
      currency: 'INR',
      billingPeriod: 'monthly',
      availability: 'InStock'
    };
  }

  /**
   * Create cache key for schema caching
   * @param {ContentType} contentType - Content type
   * @param {Object} data - Data object
   * @param {Object} options - Options object
   * @returns {string} Cache key
   */
  _createCacheKey(contentType, data, options) {
    const keyData = {
      contentType,
      url: data.url,
      title: data.title,
      lastModified: data.lastModified,
      options
    };
    return JSON.stringify(keyData);
  }

  /**
   * Create error schema for failed generation
   * @param {Error} error - Error object
   * @param {ContentType} contentType - Content type
   * @param {Object} data - Original data
   * @returns {Object} Error schema
   */
  _createErrorSchema(error, contentType, data) {
    return {
      type: 'Error',
      context: 'https://schema.org',
      data: null,
      pageUrl: data?.url || this.config.site.baseUrl,
      lastUpdated: new Date(),
      contentType,
      error: {
        message: error.message,
        stack: error.stack
      },
      validation: {
        isValid: false,
        issues: ['Schema generation failed'],
        warnings: [],
        score: 0
      }
    };
  }
  /**
   * Generate homepage schema (Organization + Website + SoftwareApplication)
   * @param {Object} data - Homepage data
   * @param {Object} options - Generation options
   * @returns {Object} Combined schema markup
   */
  generateHomepageSchema(data, options = {}) {
    const organizationSchema = this.generateOrganizationSchema(data, options);
    const websiteSchema = this.generateWebsiteSchema(data, options);
    const softwareSchema = this.generateSoftwareApplicationSchema(data, options);

    // Add additional schemas based on data
    const schemas = [organizationSchema, websiteSchema, softwareSchema];
    
    // Add LocalBusiness schema if location data is available
    if (data.contactInfo?.address || data.businessHours) {
      const localBusinessSchema = this.generateLocalBusinessSchema(data, options);
      schemas.push(localBusinessSchema);
    }
    
    // Add FAQ schema if FAQs are provided
    if (data.faqs && data.faqs.length > 0) {
      const faqSchema = this.generateFAQSchema(data.faqs, options);
      if (faqSchema) schemas.push(faqSchema);
    }
    
    // Add Breadcrumb schema if breadcrumbs are provided
    if (data.breadcrumbs && data.breadcrumbs.length > 0) {
      const breadcrumbSchema = this.generateBreadcrumbSchema(data.breadcrumbs, options);
      if (breadcrumbSchema) schemas.push(breadcrumbSchema);
    }

    // Return as a graph with multiple schemas
    return {
      '@context': 'https://schema.org',
      '@graph': schemas.filter(Boolean)
    };
  }

  /**
   * Generate Organization schema with enhanced data population
   * @param {Object} data - Organization data
   * @param {Object} options - Generation options
   * @returns {Object} Organization schema
   */
  generateOrganizationSchema(data = {}, options = {}) {
    const config = this.config.site;
    const contactInfo = data.contactInfo || this._getContactInfo();
    
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': `${config.baseUrl}/#organization`,
      name: data.name || config.name,
      legalName: data.legalName || 'BillByte Innovations',
      url: data.url || config.baseUrl,
      logo: {
        '@type': 'ImageObject',
        '@id': `${config.baseUrl}/#logo`,
        url: data.logo || config.logo,
        width: data.logoWidth || 600,
        height: data.logoHeight || 60,
        caption: data.name || config.name
      },
      image: {
        '@id': `${config.baseUrl}/#logo`
      },
      description: data.description || config.description,
      foundingDate: data.foundingDate || '2023-01-01',
      numberOfEmployees: data.numberOfEmployees || '10-50',
      industry: data.industry || 'Software Development',
      keywords: (data.keywords || this._getContextualKeywords('organization')).join(', ')
    };

    // Add address if available
    if (contactInfo.address) {
      schema.address = {
        '@type': 'PostalAddress',
        streetAddress: contactInfo.address.street,
        addressLocality: contactInfo.address.city,
        addressRegion: contactInfo.address.state,
        postalCode: contactInfo.address.postalCode,
        addressCountry: contactInfo.address.country || 'IN'
      };
    }

    // Add contact information
    if (contactInfo.phone || contactInfo.email) {
      schema.contactPoint = {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        ...(contactInfo.phone && { telephone: contactInfo.phone }),
        ...(contactInfo.email && { email: contactInfo.email }),
        availableLanguage: data.languages || ['English', 'Hindi'],
        areaServed: data.areaServed || 'IN'
      };
    }

    // Add social media profiles
    if (data.socialProfiles || this._getSocialProfiles().length > 0) {
      schema.sameAs = data.socialProfiles || this._getSocialProfiles();
    }

    // Add brand information
    schema.brand = {
      '@type': 'Brand',
      name: data.brandName || config.name,
      logo: {
        '@id': `${config.baseUrl}/#logo`
      },
      slogan: data.slogan || 'Simplifying Restaurant Management'
    };

    // Add products/services offered
    schema.makesOffer = [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'SoftwareApplication',
          name: 'Restaurant Billing Software',
          applicationCategory: 'BusinessApplication',
          description: 'Complete restaurant management solution with billing, KOT, and inventory management'
        },
        price: data.pricing?.price || '1999',
        priceCurrency: data.pricing?.currency || 'INR',
        availability: 'https://schema.org/InStock'
      }
    ];

    // Add awards or certifications if available
    if (data.awards && data.awards.length > 0) {
      schema.award = data.awards;
    }

    // Add parent organization if applicable
    if (data.parentOrganization) {
      schema.parentOrganization = {
        '@type': 'Organization',
        name: data.parentOrganization.name,
        url: data.parentOrganization.url
      };
    }

    return schema;
  }

  /**
   * Generate Website schema
   * @param {Object} data - Website data
   * @returns {Object} Website schema
   */
  generateWebsiteSchema(data) {
    const config = this.config.site;
    
    return {
      '@type': 'WebSite',
      '@id': `${config.baseUrl}/#website`,
      url: config.baseUrl,
      name: config.name,
      description: config.description,
      publisher: {
        '@id': `${config.baseUrl}/#organization`
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${config.baseUrl}/search?q={search_term_string}`
        },
        'query-input': 'required name=search_term_string'
      },
      inLanguage: config.language,
      copyrightYear: new Date().getFullYear(),
      copyrightHolder: {
        '@id': `${config.baseUrl}/#organization`
      }
    };
  }

  /**
   * Generate SoftwareApplication schema with enhanced features
   * @param {Object} data - Software data
   * @param {Object} options - Generation options
   * @returns {Object} SoftwareApplication schema
   */
  generateSoftwareApplicationSchema(data = {}, options = {}) {
    const config = this.config.site;
    const pricing = data.pricing || this._getDefaultPricing();
    
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      '@id': `${config.baseUrl}/#software`,
      name: data.name || config.name,
      description: data.description || config.description,
      applicationCategory: data.applicationCategory || 'BusinessApplication',
      applicationSubCategory: data.applicationSubCategory || 'Restaurant Management Software',
      operatingSystem: data.operatingSystem || ['Web Browser', 'Android', 'iOS', 'Windows', 'macOS'],
      url: data.url || config.baseUrl,
      downloadUrl: data.downloadUrl || `${config.baseUrl}/download`,
      installUrl: data.installUrl || `${config.baseUrl}/signup`,
      screenshot: data.screenshot || `${config.baseUrl}/images/screenshot.jpg`,
      softwareVersion: data.softwareVersion || '2.1.0',
      releaseNotes: data.releaseNotes || `${config.baseUrl}/changelog`,
      datePublished: data.datePublished || '2023-01-01',
      dateModified: data.dateModified || new Date().toISOString().split('T')[0],
      author: {
        '@id': `${config.baseUrl}/#organization`
      },
      publisher: {
        '@id': `${config.baseUrl}/#organization`
      },
      creator: {
        '@id': `${config.baseUrl}/#organization`
      }
    };

    // Enhanced pricing information
    schema.offers = {
      '@type': 'Offer',
      price: pricing.price,
      priceCurrency: pricing.currency,
      availability: `https://schema.org/${pricing.availability}`,
      validFrom: data.priceValidFrom || '2023-01-01',
      priceValidUntil: data.priceValidUntil || '2025-12-31',
      url: data.pricingUrl || `${config.baseUrl}/pricing`,
      seller: {
        '@id': `${config.baseUrl}/#organization`
      },
      eligibleRegion: data.eligibleRegion || 'IN',
      ...(pricing.billingPeriod && { billingDuration: `P1${pricing.billingPeriod.toUpperCase().charAt(0)}` })
    };

    // Enhanced rating information
    if (data.aggregateRating || options.includeRating !== false) {
      schema.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: data.ratingValue || 4.9,
        reviewCount: data.reviewCount || 500,
        bestRating: data.bestRating || 5,
        worstRating: data.worstRating || 1,
        ratingCount: data.ratingCount || data.reviewCount || 500
      };
    }

    // Enhanced feature list
    schema.featureList = data.featureList || [
      'Restaurant Billing & Invoicing',
      'Kitchen Order Ticket (KOT) Management',
      'Inventory & Stock Management',
      'GST Compliance & Tax Management',
      'Thermal Printer Integration',
      'WhatsApp Order Integration',
      'Staff & User Management',
      'Real-time Reports & Analytics',
      'Table Management System',
      'Multi-location Support',
      'Cloud Data Backup',
      'Mobile App Access'
    ];

    // System requirements
    schema.requirements = data.requirements || 'Web Browser or Mobile Device with Internet Connection';
    schema.memoryRequirements = data.memoryRequirements || '512MB RAM';
    schema.storageRequirements = data.storageRequirements || '100MB Storage';
    schema.permissions = data.permissions || 'Internet Access, Printer Access';

    // Software help and support
    schema.softwareHelp = {
      '@type': 'SoftwareSourceCode',
      name: 'BillByteKOT Documentation',
      url: `${config.baseUrl}/docs`,
      description: 'Complete documentation and help guides'
    };

    // Add software add-ons or integrations
    if (data.integrations && data.integrations.length > 0) {
      schema.softwareAddOn = data.integrations.map(integration => ({
        '@type': 'SoftwareApplication',
        name: integration.name,
        description: integration.description,
        url: integration.url
      }));
    }

    // Add supported file formats
    if (data.supportedFormats) {
      schema.supportedFormat = data.supportedFormats;
    }

    // Add accessibility features
    if (data.accessibilityFeatures) {
      schema.accessibilityFeature = data.accessibilityFeatures;
    }

    return schema;
  }

  /**
   * Generate Product schema
   * @param {Object} data - Product data
   * @returns {Object} Product schema
   */
  generateProductSchema(data) {
    const {
      name,
      description,
      image,
      price,
      currency = 'INR',
      availability = 'InStock',
      sku,
      brand = this.config.site.name
    } = data;

    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: name || 'BillByteKOT Restaurant Software',
      description: description || this.config.site.description,
      image: image || this.config.site.defaultImage,
      brand: {
        '@type': 'Brand',
        name: brand
      },
      sku: sku || 'BBKOT-2024',
      offers: {
        '@type': 'Offer',
        price: price || '1999',
        priceCurrency: currency,
        availability: `https://schema.org/${availability}`,
        url: `${this.config.site.baseUrl}/pricing`,
        seller: {
          '@type': 'Organization',
          name: this.config.site.name
        },
        validFrom: new Date().toISOString(),
        priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: 4.9,
        reviewCount: 500,
        bestRating: 5,
        worstRating: 1
      },
      category: 'Restaurant Software',
      manufacturer: {
        '@type': 'Organization',
        name: this.config.site.name
      }
    };
  }

  /**
   * Generate Article schema for blog posts
   * @param {Object} data - Article data
   * @returns {Object} Article schema
   */
  generateArticleSchema(data) {
    const {
      headline,
      description,
      image,
      author,
      publishedDate,
      modifiedDate,
      url,
      wordCount,
      keywords = []
    } = data;

    if (!headline || !publishedDate) {
      console.warn('SchemaGenerator: Article requires headline and publishedDate');
      return null;
    }

    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: headline.substring(0, 110), // Google limit
      description: description || this.config.site.description,
      image: image || this.config.site.defaultImage,
      author: {
        '@type': 'Person',
        name: author || 'BillByteKOT Team',
        url: this.config.site.baseUrl
      },
      publisher: {
        '@type': 'Organization',
        name: this.config.site.name,
        logo: {
          '@type': 'ImageObject',
          url: this.config.site.logo
        }
      },
      datePublished: new Date(publishedDate).toISOString(),
      dateModified: modifiedDate ? new Date(modifiedDate).toISOString() : new Date(publishedDate).toISOString(),
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': url || this.config.site.baseUrl
      },
      ...(wordCount && { wordCount }),
      ...(keywords.length > 0 && { keywords: keywords.join(', ') }),
      inLanguage: this.config.site.language,
      about: {
        '@type': 'Thing',
        name: 'Restaurant Management'
      },
      articleSection: 'Restaurant Management',
      articleBody: description
    };
  }

  /**
   * Generate landing page schema
   * @param {Object} data - Landing page data
   * @returns {Object} Landing page schema
   */
  generateLandingPageSchema(data) {
    // Combine WebPage and SoftwareApplication schemas
    const webPageSchema = {
      '@type': 'WebPage',
      '@id': data.url || this.config.site.baseUrl,
      url: data.url || this.config.site.baseUrl,
      name: data.title || 'Restaurant POS System',
      description: data.description || this.config.site.description,
      isPartOf: {
        '@id': `${this.config.site.baseUrl}/#website`
      },
      about: {
        '@id': `${this.config.site.baseUrl}/#software`
      },
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: data.image || this.config.site.defaultImage
      },
      datePublished: new Date().toISOString(),
      dateModified: new Date().toISOString()
    };

    const softwareSchema = this.generateSoftwareApplicationSchema(data);

    return {
      '@context': 'https://schema.org',
      '@graph': [webPageSchema, softwareSchema]
    };
  }

  /**
   * Generate category page schema
   * @param {Object} data - Category data
   * @returns {Object} Category schema
   */
  generateCategorySchema(data) {
    const {
      name,
      description,
      url,
      items = []
    } = data;

    return {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: name || 'Restaurant Software Solutions',
      description: description || 'Browse our restaurant software solutions',
      url: url || this.config.site.baseUrl,
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: items.length,
        itemListElement: items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'Product',
            name: item.name,
            description: item.description,
            url: item.url
          }
        }))
      },
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: this.config.site.baseUrl
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: name || 'Solutions',
            item: url || this.config.site.baseUrl
          }
        ]
      }
    };
  }

  /**
   * Generate FAQ schema
   * @param {Array} faqs - Array of FAQ objects
   * @returns {Object} FAQ schema
   */
  generateFAQSchema(faqs) {
    if (!faqs || !Array.isArray(faqs) || faqs.length === 0) {
      return null;
    }

    const validFAQs = faqs.filter(faq => 
      faq.question && faq.answer && 
      typeof faq.question === 'string' && 
      typeof faq.answer === 'string'
    );

    if (validFAQs.length === 0) {
      return null;
    }

    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: validFAQs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer
        }
      }))
    };
  }

  /**
   * Generate Breadcrumb schema
   * @param {Array} breadcrumbs - Array of breadcrumb objects
   * @returns {Object} Breadcrumb schema
   */
  generateBreadcrumbSchema(breadcrumbs) {
    if (!breadcrumbs || !Array.isArray(breadcrumbs) || breadcrumbs.length === 0) {
      return null;
    }

    const validBreadcrumbs = breadcrumbs.filter(item => 
      item.name && item.url && 
      typeof item.name === 'string' && 
      typeof item.url === 'string'
    );

    if (validBreadcrumbs.length === 0) {
      return null;
    }

    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: validBreadcrumbs.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url
      }))
    };
  }

  /**
   * Generate LocalBusiness schema with enhanced location data
   * @param {Object} data - Business data
   * @param {Object} options - Generation options
   * @returns {Object} LocalBusiness schema
   */
  generateLocalBusinessSchema(data = {}, options = {}) {
    const {
      name = this.config.site.name,
      description = this.config.site.description,
      address,
      telephone,
      email,
      openingHours,
      priceRange = '₹₹',
      geo,
      businessType = 'SoftwareCompany'
    } = data;

    const contactInfo = data.contactInfo || this._getContactInfo();
    const businessHours = data.businessHours || this._formatBusinessHours(this.config.localSEO?.businessHours || {});

    const schema = {
      '@context': 'https://schema.org',
      '@type': businessType,
      '@id': `${this.config.site.baseUrl}/#localbusiness`,
      name,
      description,
      url: this.config.site.baseUrl,
      image: data.image || this.config.site.logo,
      priceRange,
      currenciesAccepted: data.currenciesAccepted || 'INR',
      paymentAccepted: data.paymentAccepted || ['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Net Banking'],
      ...(telephone || contactInfo.phone && { telephone: telephone || contactInfo.phone }),
      ...(email || contactInfo.email && { email: email || contactInfo.email })
    };

    // Add address information
    if (address || contactInfo.address) {
      const addr = address || contactInfo.address;
      schema.address = {
        '@type': 'PostalAddress',
        streetAddress: addr.street,
        addressLocality: addr.city,
        addressRegion: addr.state,
        postalCode: addr.postalCode,
        addressCountry: addr.country || 'IN'
      };
    }

    // Add geographic coordinates
    if (geo) {
      schema.geo = {
        '@type': 'GeoCoordinates',
        latitude: geo.latitude,
        longitude: geo.longitude
      };
    }

    // Add opening hours
    if (openingHours || businessHours.length > 0) {
      schema.openingHoursSpecification = openingHours || businessHours;
    }

    // Add service areas
    if (data.serviceArea || this.config.localSEO?.serviceAreas) {
      schema.areaServed = data.serviceArea || this.config.localSEO.serviceAreas;
    }

    // Add business categories
    if (data.categories) {
      schema.category = data.categories;
    }

    // Add aggregate rating if available
    if (data.aggregateRating) {
      schema.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: data.aggregateRating.ratingValue,
        reviewCount: data.aggregateRating.reviewCount,
        bestRating: data.aggregateRating.bestRating || 5,
        worstRating: data.aggregateRating.worstRating || 1
      };
    }

    // Add reviews if available
    if (data.reviews && data.reviews.length > 0) {
      schema.review = data.reviews.map(review => ({
        '@type': 'Review',
        author: {
          '@type': 'Person',
          name: review.author
        },
        reviewRating: {
          '@type': 'Rating',
          ratingValue: review.rating,
          bestRating: 5,
          worstRating: 1
        },
        reviewBody: review.text,
        datePublished: review.date
      }));
    }

    // Add parent organization
    schema.parentOrganization = {
      '@id': `${this.config.site.baseUrl}/#organization`
    };

    // Add social media profiles
    if (data.socialProfiles || this._getSocialProfiles().length > 0) {
      schema.sameAs = data.socialProfiles || this._getSocialProfiles();
    }

    // Add additional business properties
    if (data.foundingDate) {
      schema.foundingDate = data.foundingDate;
    }

    if (data.numberOfEmployees) {
      schema.numberOfEmployees = data.numberOfEmployees;
    }

    if (data.slogan) {
      schema.slogan = data.slogan;
    }

    return schema;
  }

  /**
   * Generate Service schema for software services
   * @param {Object} data - Service data
   * @param {Object} options - Generation options
   * @returns {Object} Service schema
   */
  generateServiceSchema(data = {}, options = {}) {
    const {
      name = 'Restaurant Management Software Service',
      description = 'Complete restaurant billing and management software solution',
      serviceType = 'Software as a Service',
      provider = this.config.site.name,
      areaServed = 'IN',
      availableChannel
    } = data;

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Service',
      '@id': `${this.config.site.baseUrl}/#service`,
      name,
      description,
      serviceType,
      provider: {
        '@type': 'Organization',
        '@id': `${this.config.site.baseUrl}/#organization`,
        name: provider
      },
      areaServed,
      category: data.category || 'Business Software',
      audience: {
        '@type': 'Audience',
        audienceType: 'Restaurant Owners'
      }
    };

    // Add service offerings
    if (data.hasOfferCatalog || options.includeOfferCatalog !== false) {
      schema.hasOfferCatalog = {
        '@type': 'OfferCatalog',
        name: 'Restaurant Software Solutions',
        itemListElement: [
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'SoftwareApplication',
              name: 'Billing System',
              description: 'Complete restaurant billing solution'
            }
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'SoftwareApplication',
              name: 'KOT Management',
              description: 'Kitchen Order Ticket management system'
            }
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'SoftwareApplication',
              name: 'Inventory Management',
              description: 'Stock and inventory tracking system'
            }
          }
        ]
      };
    }

    // Add available channels
    if (availableChannel) {
      schema.availableChannel = availableChannel;
    }

    // Add service delivery
    schema.serviceOutput = {
      '@type': 'Thing',
      name: 'Restaurant Management Solution',
      description: 'Fully configured restaurant management software'
    };

    return schema;
  }

  /**
   * Generate HowTo schema for tutorial content
   * @param {Object} data - HowTo data
   * @param {Object} options - Generation options
   * @returns {Object} HowTo schema
   */
  generateHowToSchema(data = {}, options = {}) {
    const {
      name,
      description,
      image,
      totalTime,
      estimatedCost,
      supply = [],
      tool = [],
      step = []
    } = data;

    if (!name || !step || step.length === 0) {
      console.warn('SchemaGenerator: HowTo requires name and steps');
      return null;
    }

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name,
      description: description || `Learn how to ${name.toLowerCase()}`,
      image: image || this.config.site.defaultImage
    };

    // Add timing information
    if (totalTime) {
      schema.totalTime = totalTime;
    }

    if (estimatedCost) {
      schema.estimatedCost = {
        '@type': 'MonetaryAmount',
        currency: estimatedCost.currency || 'INR',
        value: estimatedCost.value
      };
    }

    // Add supplies needed
    if (supply.length > 0) {
      schema.supply = supply.map(item => ({
        '@type': 'HowToSupply',
        name: item.name || item,
        ...(item.image && { image: item.image })
      }));
    }

    // Add tools needed
    if (tool.length > 0) {
      schema.tool = tool.map(item => ({
        '@type': 'HowToTool',
        name: item.name || item,
        ...(item.image && { image: item.image })
      }));
    }

    // Add steps
    schema.step = step.map((stepItem, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: stepItem.name || `Step ${index + 1}`,
      text: stepItem.text || stepItem.description,
      ...(stepItem.image && { image: stepItem.image }),
      ...(stepItem.url && { url: stepItem.url })
    }));

    return schema;
  }

  /**
   * Generate VideoObject schema for video content
   * @param {Object} data - Video data
   * @param {Object} options - Generation options
   * @returns {Object} VideoObject schema
   */
  generateVideoObjectSchema(data = {}, options = {}) {
    const {
      name,
      description,
      thumbnailUrl,
      uploadDate,
      duration,
      contentUrl,
      embedUrl,
      interactionStatistic
    } = data;

    if (!name || !description || !uploadDate) {
      console.warn('SchemaGenerator: VideoObject requires name, description, and uploadDate');
      return null;
    }

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name,
      description,
      thumbnailUrl: thumbnailUrl || this.config.site.defaultImage,
      uploadDate: new Date(uploadDate).toISOString(),
      publisher: {
        '@type': 'Organization',
        '@id': `${this.config.site.baseUrl}/#organization`,
        name: this.config.site.name,
        logo: {
          '@type': 'ImageObject',
          url: this.config.site.logo
        }
      }
    };

    // Add video URLs
    if (contentUrl) {
      schema.contentUrl = contentUrl;
    }

    if (embedUrl) {
      schema.embedUrl = embedUrl;
    }

    // Add duration
    if (duration) {
      schema.duration = duration; // ISO 8601 format (PT1M30S)
    }

    // Add interaction statistics
    if (interactionStatistic) {
      schema.interactionStatistic = interactionStatistic.map(stat => ({
        '@type': 'InteractionCounter',
        interactionType: stat.type,
        userInteractionCount: stat.count
      }));
    }

    return schema;
  }

  /**
   * Generate Course schema for educational content
   * @param {Object} data - Course data
   * @param {Object} options - Generation options
   * @returns {Object} Course schema
   */
  generateCourseSchema(data = {}, options = {}) {
    const {
      name,
      description,
      provider,
      courseCode,
      hasCourseInstance,
      educationalLevel,
      teaches,
      coursePrerequisites
    } = data;

    if (!name || !description) {
      console.warn('SchemaGenerator: Course requires name and description');
      return null;
    }

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name,
      description,
      provider: provider || {
        '@type': 'Organization',
        '@id': `${this.config.site.baseUrl}/#organization`,
        name: this.config.site.name
      }
    };

    // Add course details
    if (courseCode) {
      schema.courseCode = courseCode;
    }

    if (educationalLevel) {
      schema.educationalLevel = educationalLevel;
    }

    if (teaches) {
      schema.teaches = teaches;
    }

    if (coursePrerequisites) {
      schema.coursePrerequisites = coursePrerequisites;
    }

    // Add course instances
    if (hasCourseInstance) {
      schema.hasCourseInstance = hasCourseInstance.map(instance => ({
        '@type': 'CourseInstance',
        courseMode: instance.courseMode || 'online',
        instructor: instance.instructor || {
          '@type': 'Person',
          name: 'BillByteKOT Expert'
        },
        ...(instance.startDate && { startDate: instance.startDate }),
        ...(instance.endDate && { endDate: instance.endDate })
      }));
    }

    return schema;
  }

  /**
   * Generate Event schema for events and webinars
   * @param {Object} data - Event data
   * @param {Object} options - Generation options
   * @returns {Object} Event schema
   */
  generateEventSchema(data = {}, options = {}) {
    const {
      name,
      description,
      startDate,
      endDate,
      location,
      organizer,
      performer,
      offers,
      eventStatus = 'EventScheduled',
      eventAttendanceMode = 'OnlineEventAttendanceMode'
    } = data;

    if (!name || !startDate) {
      console.warn('SchemaGenerator: Event requires name and startDate');
      return null;
    }

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name,
      description: description || `Join us for ${name}`,
      startDate: new Date(startDate).toISOString(),
      eventStatus: `https://schema.org/${eventStatus}`,
      eventAttendanceMode: `https://schema.org/${eventAttendanceMode}`,
      organizer: organizer || {
        '@type': 'Organization',
        '@id': `${this.config.site.baseUrl}/#organization`,
        name: this.config.site.name
      }
    };

    // Add end date
    if (endDate) {
      schema.endDate = new Date(endDate).toISOString();
    }

    // Add location
    if (location) {
      if (typeof location === 'string') {
        schema.location = {
          '@type': 'VirtualLocation',
          url: location
        };
      } else {
        schema.location = location;
      }
    }

    // Add performer
    if (performer) {
      schema.performer = performer;
    }

    // Add offers/tickets
    if (offers) {
      schema.offers = offers;
    }

    return schema;
  }

  /**
   * Enhanced schema validation against schema.org specifications
   * @param {Object} schema - Schema to validate
   * @returns {Object} Comprehensive validation result
   */
  validateSchema(schema) {
    const cacheKey = JSON.stringify(schema);
    
    if (this.validationCache.has(cacheKey)) {
      return this.validationCache.get(cacheKey);
    }

    const issues = [];
    const warnings = [];
    const suggestions = [];

    try {
      // Basic structure validation
      if (!schema) {
        issues.push('Schema is null or undefined');
        return this._createValidationResult(false, issues, warnings, suggestions, 0);
      }

      if (!schema['@context']) {
        issues.push('Missing required @context property');
      } else if (schema['@context'] !== 'https://schema.org') {
        warnings.push('@context should be "https://schema.org"');
      }

      if (!schema['@type']) {
        issues.push('Missing required @type property');
      }

      // Validate JSON structure
      try {
        JSON.stringify(schema);
      } catch (jsonError) {
        issues.push('Invalid JSON structure: ' + jsonError.message);
      }

      // Type-specific validation
      const schemaType = schema['@type'];
      if (schemaType) {
        this._validateSchemaType(schema, schemaType, issues, warnings, suggestions);
      }

      // Graph validation for multiple schemas
      if (schema['@graph']) {
        this._validateSchemaGraph(schema['@graph'], issues, warnings, suggestions);
      }

      // URL validation
      this._validateUrls(schema, issues, warnings);

      // Date validation
      this._validateDates(schema, issues, warnings);

      // Required properties validation
      this._validateRequiredProperties(schema, schemaType, issues, warnings);

      // Performance and SEO suggestions
      this._generateSEOSuggestions(schema, schemaType, suggestions);

      const score = this._calculateValidationScore(issues, warnings, suggestions);
      const result = this._createValidationResult(issues.length === 0, issues, warnings, suggestions, score);
      
      // Cache the result
      this.validationCache.set(cacheKey, result);
      
      return result;

    } catch (error) {
      const result = this._createValidationResult(false, ['Validation error: ' + error.message], [], [], 0, error);
      this.validationCache.set(cacheKey, result);
      return result;
    }
  }

  /**
   * Validate specific schema types
   * @param {Object} schema - Schema object
   * @param {string} schemaType - Schema type
   * @param {Array} issues - Issues array
   * @param {Array} warnings - Warnings array
   * @param {Array} suggestions - Suggestions array
   */
  _validateSchemaType(schema, schemaType, issues, warnings, suggestions) {
    switch (schemaType) {
      case 'Organization':
        this._validateOrganizationSchema(schema, issues, warnings, suggestions);
        break;
      case 'SoftwareApplication':
        this._validateSoftwareApplicationSchema(schema, issues, warnings, suggestions);
        break;
      case 'Article':
        this._validateArticleSchema(schema, issues, warnings, suggestions);
        break;
      case 'Product':
        this._validateProductSchema(schema, issues, warnings, suggestions);
        break;
      case 'LocalBusiness':
      case 'SoftwareCompany':
        this._validateLocalBusinessSchema(schema, issues, warnings, suggestions);
        break;
      case 'FAQPage':
        this._validateFAQSchema(schema, issues, warnings, suggestions);
        break;
      case 'BreadcrumbList':
        this._validateBreadcrumbSchema(schema, issues, warnings, suggestions);
        break;
      case 'Service':
        this._validateServiceSchema(schema, issues, warnings, suggestions);
        break;
      case 'HowTo':
        this._validateHowToSchema(schema, issues, warnings, suggestions);
        break;
      case 'VideoObject':
        this._validateVideoObjectSchema(schema, issues, warnings, suggestions);
        break;
      case 'Course':
        this._validateCourseSchema(schema, issues, warnings, suggestions);
        break;
      case 'Event':
        this._validateEventSchema(schema, issues, warnings, suggestions);
        break;
      default:
        warnings.push(`Unknown schema type: ${schemaType}`);
    }
  }

  /**
   * Validate Organization schema
   */
  _validateOrganizationSchema(schema, issues, warnings, suggestions) {
    if (!schema.name) issues.push('Organization missing required name property');
    if (!schema.url) warnings.push('Organization missing recommended url property');
    if (!schema.logo) warnings.push('Organization missing recommended logo property');
    if (!schema.description) warnings.push('Organization missing recommended description property');
    
    if (schema.logo && typeof schema.logo === 'object') {
      if (!schema.logo.url) warnings.push('Organization logo missing url property');
      if (!schema.logo.width || !schema.logo.height) {
        suggestions.push('Add logo dimensions for better SEO');
      }
    }
    
    if (schema.address && typeof schema.address === 'object') {
      if (!schema.address.addressCountry) {
        warnings.push('Organization address missing addressCountry');
      }
    }
    
    if (!schema.sameAs || !Array.isArray(schema.sameAs) || schema.sameAs.length === 0) {
      suggestions.push('Add social media profiles to sameAs property for better brand recognition');
    }
  }

  /**
   * Validate SoftwareApplication schema
   */
  _validateSoftwareApplicationSchema(schema, issues, warnings, suggestions) {
    if (!schema.name) issues.push('SoftwareApplication missing required name property');
    if (!schema.applicationCategory) warnings.push('SoftwareApplication missing applicationCategory');
    if (!schema.operatingSystem) warnings.push('SoftwareApplication missing operatingSystem');
    
    if (schema.offers) {
      if (!schema.offers.price) warnings.push('SoftwareApplication offer missing price');
      if (!schema.offers.priceCurrency) warnings.push('SoftwareApplication offer missing priceCurrency');
    } else {
      suggestions.push('Add pricing information to improve commercial visibility');
    }
    
    if (!schema.aggregateRating) {
      suggestions.push('Add aggregate rating to improve search visibility');
    }
    
    if (!schema.featureList || !Array.isArray(schema.featureList) || schema.featureList.length === 0) {
      suggestions.push('Add feature list to highlight software capabilities');
    }
  }

  /**
   * Validate Article schema
   */
  _validateArticleSchema(schema, issues, warnings, suggestions) {
    if (!schema.headline) issues.push('Article missing required headline property');
    if (!schema.datePublished) issues.push('Article missing required datePublished property');
    if (!schema.author) warnings.push('Article missing recommended author property');
    if (!schema.publisher) warnings.push('Article missing recommended publisher property');
    
    if (schema.headline && schema.headline.length > 110) {
      warnings.push('Article headline exceeds recommended 110 character limit');
    }
    
    if (!schema.image) {
      suggestions.push('Add featured image for better social media sharing');
    }
    
    if (!schema.wordCount) {
      suggestions.push('Add word count for better content analysis');
    }
  }

  /**
   * Validate Product schema
   */
  _validateProductSchema(schema, issues, warnings, suggestions) {
    if (!schema.name) issues.push('Product missing required name property');
    if (!schema.offers) warnings.push('Product missing offers property');
    
    if (schema.offers && !schema.offers.price) {
      warnings.push('Product offer missing price');
    }
    
    if (!schema.brand) {
      suggestions.push('Add brand information for better product identification');
    }
    
    if (!schema.aggregateRating) {
      suggestions.push('Add customer ratings to improve product credibility');
    }
  }

  /**
   * Validate LocalBusiness schema
   */
  _validateLocalBusinessSchema(schema, issues, warnings, suggestions) {
    if (!schema.name) issues.push('LocalBusiness missing required name property');
    if (!schema.address) warnings.push('LocalBusiness missing address property');
    
    if (schema.address && typeof schema.address === 'object') {
      if (!schema.address.addressLocality) warnings.push('LocalBusiness address missing city');
      if (!schema.address.addressRegion) warnings.push('LocalBusiness address missing state/region');
      if (!schema.address.addressCountry) warnings.push('LocalBusiness address missing country');
    }
    
    if (!schema.telephone && !schema.email) {
      warnings.push('LocalBusiness missing contact information (telephone or email)');
    }
    
    if (!schema.openingHoursSpecification) {
      suggestions.push('Add business hours for better local SEO');
    }
    
    if (!schema.geo) {
      suggestions.push('Add geographic coordinates for better local search visibility');
    }
  }

  /**
   * Validate FAQ schema
   */
  _validateFAQSchema(schema, issues, warnings, suggestions) {
    if (!schema.mainEntity || !Array.isArray(schema.mainEntity)) {
      issues.push('FAQPage missing required mainEntity array');
      return;
    }
    
    if (schema.mainEntity.length === 0) {
      warnings.push('FAQPage has empty mainEntity array');
    }
    
    schema.mainEntity.forEach((faq, index) => {
      if (!faq.name) issues.push(`FAQ item ${index + 1} missing question (name property)`);
      if (!faq.acceptedAnswer) issues.push(`FAQ item ${index + 1} missing acceptedAnswer`);
      if (faq.acceptedAnswer && !faq.acceptedAnswer.text) {
        issues.push(`FAQ item ${index + 1} acceptedAnswer missing text`);
      }
    });
  }

  /**
   * Validate Breadcrumb schema
   */
  _validateBreadcrumbSchema(schema, issues, warnings, suggestions) {
    if (!schema.itemListElement || !Array.isArray(schema.itemListElement)) {
      issues.push('BreadcrumbList missing required itemListElement array');
      return;
    }
    
    if (schema.itemListElement.length === 0) {
      warnings.push('BreadcrumbList has empty itemListElement array');
    }
    
    schema.itemListElement.forEach((item, index) => {
      if (!item.position) issues.push(`Breadcrumb item ${index + 1} missing position`);
      if (!item.name) issues.push(`Breadcrumb item ${index + 1} missing name`);
      if (!item.item) issues.push(`Breadcrumb item ${index + 1} missing item URL`);
      
      if (item.position !== index + 1) {
        warnings.push(`Breadcrumb item ${index + 1} position should be ${index + 1}`);
      }
    });
  }

  /**
   * Validate Service schema
   */
  _validateServiceSchema(schema, issues, warnings, suggestions) {
    if (!schema.name) issues.push('Service missing required name property');
    if (!schema.serviceType) warnings.push('Service missing serviceType property');
    if (!schema.provider) warnings.push('Service missing provider property');
    
    if (schema.provider && typeof schema.provider === 'object') {
      if (!schema.provider.name) warnings.push('Service provider missing name');
    }
    
    if (!schema.areaServed) {
      suggestions.push('Add areaServed to specify service coverage area');
    }
  }

  /**
   * Validate HowTo schema
   */
  _validateHowToSchema(schema, issues, warnings, suggestions) {
    if (!schema.name) issues.push('HowTo missing required name property');
    if (!schema.step || !Array.isArray(schema.step) || schema.step.length === 0) {
      issues.push('HowTo missing required step array');
    }
    
    if (schema.step && Array.isArray(schema.step)) {
      schema.step.forEach((step, index) => {
        if (!step.text && !step.name) {
          issues.push(`HowTo step ${index + 1} missing text or name`);
        }
        if (!step.position) {
          warnings.push(`HowTo step ${index + 1} missing position`);
        }
      });
    }
    
    if (!schema.totalTime) {
      suggestions.push('Add totalTime to help users understand time commitment');
    }
  }

  /**
   * Validate VideoObject schema
   */
  _validateVideoObjectSchema(schema, issues, warnings, suggestions) {
    if (!schema.name) issues.push('VideoObject missing required name property');
    if (!schema.description) issues.push('VideoObject missing required description property');
    if (!schema.uploadDate) issues.push('VideoObject missing required uploadDate property');
    
    if (!schema.thumbnailUrl) warnings.push('VideoObject missing thumbnailUrl');
    if (!schema.duration) warnings.push('VideoObject missing duration');
    if (!schema.contentUrl && !schema.embedUrl) {
      warnings.push('VideoObject missing contentUrl or embedUrl');
    }
    
    if (!schema.publisher) {
      suggestions.push('Add publisher information for better video SEO');
    }
  }

  /**
   * Validate Course schema
   */
  _validateCourseSchema(schema, issues, warnings, suggestions) {
    if (!schema.name) issues.push('Course missing required name property');
    if (!schema.description) issues.push('Course missing required description property');
    if (!schema.provider) warnings.push('Course missing provider property');
    
    if (schema.hasCourseInstance && Array.isArray(schema.hasCourseInstance)) {
      schema.hasCourseInstance.forEach((instance, index) => {
        if (!instance.courseMode) {
          warnings.push(`Course instance ${index + 1} missing courseMode`);
        }
      });
    }
    
    if (!schema.educationalLevel) {
      suggestions.push('Add educationalLevel to help learners assess course difficulty');
    }
  }

  /**
   * Validate Event schema
   */
  _validateEventSchema(schema, issues, warnings, suggestions) {
    if (!schema.name) issues.push('Event missing required name property');
    if (!schema.startDate) issues.push('Event missing required startDate property');
    
    if (!schema.location) warnings.push('Event missing location property');
    if (!schema.organizer) warnings.push('Event missing organizer property');
    
    if (schema.startDate && schema.endDate) {
      const start = new Date(schema.startDate);
      const end = new Date(schema.endDate);
      if (end <= start) {
        issues.push('Event endDate must be after startDate');
      }
    }
    
    if (!schema.offers) {
      suggestions.push('Add offers/pricing information for better event visibility');
    }
  }

  /**
   * Validate schema graph
   */
  _validateSchemaGraph(graph, issues, warnings, suggestions) {
    if (!Array.isArray(graph)) {
      issues.push('Schema @graph must be an array');
      return;
    }
    
    if (graph.length === 0) {
      warnings.push('Schema @graph is empty');
    }
    
    graph.forEach((item, index) => {
      if (!item['@type']) {
        issues.push(`Graph item ${index + 1} missing @type`);
      }
    });
    
    // Check for duplicate @id values
    const ids = graph.filter(item => item['@id']).map(item => item['@id']);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      warnings.push(`Duplicate @id values found: ${duplicateIds.join(', ')}`);
    }
  }

  /**
   * Validate URLs in schema
   */
  _validateUrls(schema, issues, warnings) {
    const urlFields = ['url', 'sameAs', 'image', 'logo'];
    
    const validateUrl = (url, fieldName) => {
      if (typeof url === 'string') {
        try {
          new URL(url);
          if (!url.startsWith('https://') && !url.startsWith('http://')) {
            warnings.push(`${fieldName} should use absolute URL with protocol`);
          }
        } catch (e) {
          issues.push(`Invalid URL in ${fieldName}: ${url}`);
        }
      }
    };
    
    const checkObject = (obj, prefix = '') => {
      Object.keys(obj).forEach(key => {
        const value = obj[key];
        const fieldName = prefix ? `${prefix}.${key}` : key;
        
        if (urlFields.includes(key)) {
          if (Array.isArray(value)) {
            value.forEach((url, index) => validateUrl(url, `${fieldName}[${index}]`));
          } else {
            validateUrl(value, fieldName);
          }
        } else if (typeof value === 'object' && value !== null) {
          checkObject(value, fieldName);
        }
      });
    };
    
    checkObject(schema);
  }

  /**
   * Validate dates in schema
   */
  _validateDates(schema, issues, warnings) {
    const dateFields = ['datePublished', 'dateModified', 'foundingDate', 'validFrom', 'priceValidUntil'];
    
    const validateDate = (dateStr, fieldName) => {
      if (typeof dateStr === 'string') {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          issues.push(`Invalid date format in ${fieldName}: ${dateStr}`);
        } else if (!dateStr.match(/^\d{4}-\d{2}-\d{2}/) && !dateStr.includes('T')) {
          warnings.push(`${fieldName} should use ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)`);
        }
      }
    };
    
    const checkObject = (obj, prefix = '') => {
      Object.keys(obj).forEach(key => {
        const value = obj[key];
        const fieldName = prefix ? `${prefix}.${key}` : key;
        
        if (dateFields.includes(key)) {
          validateDate(value, fieldName);
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          checkObject(value, fieldName);
        }
      });
    };
    
    checkObject(schema);
  }

  /**
   * Validate required properties for schema types
   */
  _validateRequiredProperties(schema, schemaType, issues, warnings) {
    const requiredProps = {
      'Organization': ['name'],
      'SoftwareApplication': ['name', 'applicationCategory'],
      'Article': ['headline', 'datePublished'],
      'Product': ['name'],
      'LocalBusiness': ['name'],
      'FAQPage': ['mainEntity'],
      'BreadcrumbList': ['itemListElement'],
      'Service': ['name', 'serviceType'],
      'HowTo': ['name', 'step'],
      'VideoObject': ['name', 'description', 'uploadDate'],
      'Course': ['name', 'description'],
      'Event': ['name', 'startDate']
    };
    
    const required = requiredProps[schemaType];
    if (required) {
      required.forEach(prop => {
        if (!schema[prop]) {
          issues.push(`${schemaType} missing required property: ${prop}`);
        }
      });
    }
  }

  /**
   * Generate SEO suggestions
   */
  _generateSEOSuggestions(schema, schemaType, suggestions) {
    // General suggestions
    if (!schema['@id']) {
      suggestions.push('Add @id property for better schema linking');
    }
    
    // Type-specific suggestions
    if (schemaType === 'Organization' && !schema.foundingDate) {
      suggestions.push('Add founding date to establish company credibility');
    }
    
    if (schemaType === 'SoftwareApplication' && !schema.screenshot) {
      suggestions.push('Add screenshot URLs to showcase the software');
    }
    
    if (schemaType === 'Article' && !schema.keywords) {
      suggestions.push('Add keywords property for better content categorization');
    }
    
    if (schemaType === 'Service' && !schema.hasOfferCatalog) {
      suggestions.push('Add service catalog to showcase available offerings');
    }
    
    if (schemaType === 'HowTo' && !schema.image) {
      suggestions.push('Add images to make tutorial more engaging');
    }
    
    if (schemaType === 'VideoObject' && !schema.interactionStatistic) {
      suggestions.push('Add interaction statistics (views, likes) for better engagement metrics');
    }
    
    if (schemaType === 'Course' && !schema.hasCourseInstance) {
      suggestions.push('Add course instances with specific dates and instructors');
    }
    
    if (schemaType === 'Event' && !schema.performer) {
      suggestions.push('Add performer/speaker information for better event details');
    }
  }

  /**
   * Calculate validation score
   */
  _calculateValidationScore(issues, warnings, suggestions) {
    let score = 100;
    score -= issues.length * 25; // Critical issues
    score -= warnings.length * 10; // Warnings
    score -= suggestions.length * 2; // Minor improvements
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Create validation result object
   */
  _createValidationResult(isValid, issues, warnings, suggestions, score, error = null) {
    return {
      isValid,
      issues,
      warnings,
      suggestions,
      score,
      timestamp: new Date(),
      ...(error && { error: error.message })
    };
  }

  /**
   * Get schema by type with enhanced options
   * @param {SchemaType} type - Schema type
   * @param {Object} data - Schema data
   * @param {Object} options - Generation options
   * @returns {Object} Generated schema
   */
  getSchemaByType(type, data, options = {}) {
    try {
      const enrichedData = this._enrichDataWithContext(data, type);
      
      switch (type) {
        case SchemaType.ORGANIZATION:
          return this.generateOrganizationSchema(enrichedData, options);
        case SchemaType.SOFTWARE_APPLICATION:
          return this.generateSoftwareApplicationSchema(enrichedData, options);
        case SchemaType.ARTICLE:
          return this.generateArticleSchema(enrichedData, options);
        case SchemaType.PRODUCT:
          return this.generateProductSchema(enrichedData, options);
        case SchemaType.FAQ_PAGE:
          return this.generateFAQSchema(enrichedData.faqs || enrichedData, options);
        case SchemaType.BREADCRUMB_LIST:
          return this.generateBreadcrumbSchema(enrichedData.breadcrumbs || enrichedData, options);
        case SchemaType.LOCAL_BUSINESS:
          return this.generateLocalBusinessSchema(enrichedData, options);
        case SchemaType.SERVICE:
          return this.generateServiceSchema(enrichedData, options);
        case SchemaType.HOW_TO:
          return this.generateHowToSchema(enrichedData, options);
        case SchemaType.VIDEO_OBJECT:
          return this.generateVideoObjectSchema(enrichedData, options);
        case SchemaType.COURSE:
          return this.generateCourseSchema(enrichedData, options);
        case SchemaType.EVENT:
          return this.generateEventSchema(enrichedData, options);
        default:
          console.warn(`SchemaGenerator: Unknown schema type: ${type}`);
          return null;
      }
    } catch (error) {
      console.error(`SchemaGenerator: Error generating schema type ${type}:`, error);
      return null;
    }
  }

  /**
   * Generate multiple schemas for a page
   * @param {Array} schemaTypes - Array of schema types to generate
   * @param {Object} data - Page data
   * @param {Object} options - Generation options
   * @returns {Object} Combined schema graph
   */
  generateMultipleSchemas(schemaTypes, data, options = {}) {
    const schemas = [];
    
    schemaTypes.forEach(type => {
      const schema = this.getSchemaByType(type, data, options);
      if (schema) {
        schemas.push(schema);
      }
    });
    
    if (schemas.length === 0) {
      return null;
    }
    
    if (schemas.length === 1) {
      return schemas[0];
    }
    
    return {
      '@context': 'https://schema.org',
      '@graph': schemas
    };
  }

  /**
   * Generate schema for specific page types with automatic type detection
   * @param {Object} pageData - Page data with type information
   * @param {Object} options - Generation options
   * @returns {Object} Generated schema
   */
  generatePageSchema(pageData, options = {}) {
    const { type, ...data } = pageData;
    
    // Auto-detect schema types based on page content
    const schemaTypes = this._detectSchemaTypes(pageData);
    
    if (schemaTypes.length > 1) {
      return this.generateMultipleSchemas(schemaTypes, data, options);
    } else if (schemaTypes.length === 1) {
      return this.getSchemaByType(schemaTypes[0], data, options);
    }
    
    // Fallback to content type mapping
    return this.generateSchema(type, data, options);
  }

  /**
   * Detect appropriate schema types based on page content
   * @param {Object} pageData - Page data
   * @returns {Array} Array of detected schema types
   */
  _detectSchemaTypes(pageData) {
    const types = [];
    
    // Always include Organization for brand pages
    if (pageData.type === ContentType.HOMEPAGE || pageData.includeOrganization) {
      types.push(SchemaType.ORGANIZATION);
    }
    
    // Software application for product pages
    if (pageData.type === ContentType.PRODUCT_PAGE || pageData.type === ContentType.HOMEPAGE) {
      types.push(SchemaType.SOFTWARE_APPLICATION);
    }
    
    // Article for blog posts
    if (pageData.type === ContentType.BLOG_POST && pageData.headline) {
      types.push(SchemaType.ARTICLE);
    }
    
    // Local business if location data is present
    if (pageData.address || pageData.businessHours || pageData.geo) {
      types.push(SchemaType.LOCAL_BUSINESS);
    }
    
    // FAQ if FAQ data is present
    if (pageData.faqs && pageData.faqs.length > 0) {
      types.push(SchemaType.FAQ_PAGE);
    }
    
    // Breadcrumbs if breadcrumb data is present
    if (pageData.breadcrumbs && pageData.breadcrumbs.length > 0) {
      types.push(SchemaType.BREADCRUMB_LIST);
    }
    
    // Service schema for service pages
    if (pageData.type === 'service_page' || pageData.serviceType) {
      types.push(SchemaType.SERVICE);
    }
    
    // HowTo schema for tutorial content
    if (pageData.type === 'tutorial' || (pageData.step && pageData.step.length > 0)) {
      types.push(SchemaType.HOW_TO);
    }
    
    // VideoObject schema for video content
    if (pageData.type === 'video' || pageData.contentUrl || pageData.embedUrl) {
      types.push(SchemaType.VIDEO_OBJECT);
    }
    
    // Course schema for educational content
    if (pageData.type === 'course' || pageData.courseCode || pageData.hasCourseInstance) {
      types.push(SchemaType.COURSE);
    }
    
    // Event schema for events and webinars
    if (pageData.type === 'event' || pageData.startDate) {
      types.push(SchemaType.EVENT);
    }
    
    return types;
  }

  /**
   * Validate and optimize schema for search engines
   * @param {Object} schema - Schema to optimize
   * @param {Object} options - Optimization options
   * @returns {Object} Optimized schema
   */
  optimizeSchema(schema, options = {}) {
    if (!schema) return null;
    
    const optimized = JSON.parse(JSON.stringify(schema)); // Deep clone
    
    // Remove empty properties
    this._removeEmptyProperties(optimized);
    
    // Optimize URLs
    this._optimizeUrls(optimized);
    
    // Optimize images
    this._optimizeImages(optimized, options);
    
    // Optimize text content
    this._optimizeTextContent(optimized);
    
    // Add missing recommended properties
    this._addRecommendedProperties(optimized, options);
    
    return optimized;
  }

  /**
   * Remove empty properties from schema
   */
  _removeEmptyProperties(obj) {
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      
      if (value === null || value === undefined || value === '') {
        delete obj[key];
      } else if (Array.isArray(value)) {
        if (value.length === 0) {
          delete obj[key];
        } else {
          value.forEach(item => {
            if (typeof item === 'object' && item !== null) {
              this._removeEmptyProperties(item);
            }
          });
        }
      } else if (typeof value === 'object') {
        this._removeEmptyProperties(value);
        if (Object.keys(value).length === 0) {
          delete obj[key];
        }
      }
    });
  }

  /**
   * Optimize URLs in schema
   */
  _optimizeUrls(obj) {
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      
      if (typeof value === 'string' && this._isUrl(value)) {
        // Ensure HTTPS
        if (value.startsWith('http://')) {
          obj[key] = value.replace('http://', 'https://');
        }
        
        // Remove trailing slashes
        obj[key] = obj[key].replace(/\/$/, '');
      } else if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(item => {
            if (typeof item === 'object' && item !== null) {
              this._optimizeUrls(item);
            }
          });
        } else {
          this._optimizeUrls(value);
        }
      }
    });
  }

  /**
   * Optimize images in schema
   */
  _optimizeImages(obj, options) {
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      
      if (key === 'image' && typeof value === 'string') {
        // Convert simple image URL to ImageObject
        obj[key] = {
          '@type': 'ImageObject',
          url: value,
          ...(options.imageWidth && { width: options.imageWidth }),
          ...(options.imageHeight && { height: options.imageHeight })
        };
      } else if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(item => {
            if (typeof item === 'object' && item !== null) {
              this._optimizeImages(item, options);
            }
          });
        } else {
          this._optimizeImages(value, options);
        }
      }
    });
  }

  /**
   * Optimize text content in schema
   */
  _optimizeTextContent(obj) {
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      
      if (typeof value === 'string') {
        // Trim whitespace
        obj[key] = value.trim();
        
        // Limit headline length for Article schema
        if (key === 'headline' && value.length > 110) {
          obj[key] = value.substring(0, 107) + '...';
        }
        
        // Limit description length
        if (key === 'description' && value.length > 160) {
          obj[key] = value.substring(0, 157) + '...';
        }
      } else if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(item => {
            if (typeof item === 'object' && item !== null) {
              this._optimizeTextContent(item);
            }
          });
        } else {
          this._optimizeTextContent(value);
        }
      }
    });
  }

  /**
   * Add recommended properties based on schema type
   */
  _addRecommendedProperties(obj, options) {
    const schemaType = obj['@type'];
    
    if (schemaType === 'Organization' && !obj.foundingDate && options.addFoundingDate !== false) {
      obj.foundingDate = '2023-01-01';
    }
    
    if (schemaType === 'SoftwareApplication' && !obj.dateModified) {
      obj.dateModified = new Date().toISOString().split('T')[0];
    }
    
    if (schemaType === 'Article' && !obj.dateModified && obj.datePublished) {
      obj.dateModified = obj.datePublished;
    }
  }

  /**
   * Check if string is a URL
   */
  _isUrl(string) {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear schema cache
   */
  clearCache() {
    this.schemaCache.clear();
    this.validationCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      schemaCache: {
        size: this.schemaCache.size,
        keys: Array.from(this.schemaCache.keys())
      },
      validationCache: {
        size: this.validationCache.size,
        keys: Array.from(this.validationCache.keys())
      }
    };
  }

  /**
   * Export schema as JSON-LD string
   * @param {Object} schema - Schema object
   * @param {Object} options - Export options
   * @returns {string} JSON-LD string
   */
  exportSchemaAsJsonLD(schema, options = {}) {
    if (!schema || !schema.data) {
      return null;
    }

    const { minify = false, validate = true } = options;

    // Validate schema before export if requested
    if (validate) {
      const validation = this.validateSchema(schema.data);
      if (!validation.isValid && validation.issues.length > 0) {
        console.warn('SchemaGenerator: Exporting invalid schema:', validation.issues);
      }
    }

    // Optimize schema before export
    const optimizedSchema = this.optimizeSchema(schema.data, options);

    try {
      if (minify) {
        return JSON.stringify(optimizedSchema);
      } else {
        return JSON.stringify(optimizedSchema, null, 2);
      }
    } catch (error) {
      console.error('SchemaGenerator: Failed to export schema as JSON-LD:', error);
      return null;
    }
  }

  /**
   * Import schema from JSON-LD string
   * @param {string} jsonLDString - JSON-LD string
   * @param {Object} options - Import options
   * @returns {Object} Schema object
   */
  importSchemaFromJsonLD(jsonLDString, options = {}) {
    const { validate = true } = options;

    try {
      const schemaData = JSON.parse(jsonLDString);
      
      const schema = {
        type: schemaData['@type'] || 'Unknown',
        context: schemaData['@context'] || 'https://schema.org',
        data: schemaData,
        pageUrl: options.pageUrl || this.config.site.baseUrl,
        lastUpdated: new Date(),
        imported: true
      };

      // Validate imported schema if requested
      if (validate) {
        schema.validation = this.validateSchema(schemaData);
      }

      return schema;
    } catch (error) {
      console.error('SchemaGenerator: Failed to import schema from JSON-LD:', error);
      return null;
    }
  }

  /**
   * Merge multiple schemas into a single graph
   * @param {Array} schemas - Array of schema objects
   * @param {Object} options - Merge options
   * @returns {Object} Merged schema graph
   */
  mergeSchemas(schemas, options = {}) {
    if (!Array.isArray(schemas) || schemas.length === 0) {
      return null;
    }

    const validSchemas = schemas.filter(schema => 
      schema && schema.data && schema.data['@type']
    );

    if (validSchemas.length === 0) {
      return null;
    }

    if (validSchemas.length === 1) {
      return validSchemas[0];
    }

    // Create merged graph
    const mergedSchema = {
      type: 'Graph',
      context: 'https://schema.org',
      data: {
        '@context': 'https://schema.org',
        '@graph': validSchemas.map(schema => schema.data)
      },
      pageUrl: options.pageUrl || this.config.site.baseUrl,
      lastUpdated: new Date(),
      merged: true,
      sourceSchemas: validSchemas.length
    };

    // Validate merged schema if requested
    if (options.validate !== false) {
      mergedSchema.validation = this.validateSchema(mergedSchema.data);
    }

    return mergedSchema;
  }

  /**
   * Generate schema for multiple content types on a single page
   * @param {Array} contentItems - Array of content items with types
   * @param {Object} options - Generation options
   * @returns {Object} Combined schema
   */
  generateMultiContentSchema(contentItems, options = {}) {
    if (!Array.isArray(contentItems) || contentItems.length === 0) {
      return null;
    }

    const schemas = [];

    contentItems.forEach(item => {
      const { type, data } = item;
      let schema = null;

      // Generate schema based on content type
      switch (type) {
        case 'organization':
          schema = this.generateOrganizationSchema(data, options);
          break;
        case 'software':
          schema = this.generateSoftwareApplicationSchema(data, options);
          break;
        case 'article':
          schema = this.generateArticleSchema(data, options);
          break;
        case 'faq':
          schema = this.generateFAQSchema(data, options);
          break;
        case 'howto':
          schema = this.generateHowToSchema(data, options);
          break;
        case 'video':
          schema = this.generateVideoObjectSchema(data, options);
          break;
        case 'event':
          schema = this.generateEventSchema(data, options);
          break;
        default:
          console.warn(`SchemaGenerator: Unknown content type: ${type}`);
      }

      if (schema) {
        schemas.push({
          type: schema['@type'],
          context: schema['@context'],
          data: schema,
          pageUrl: options.pageUrl || this.config.site.baseUrl,
          lastUpdated: new Date()
        });
      }
    });

    return this.mergeSchemas(schemas, options);
  }

  /**
   * Validate schema against Google's Rich Results Test
   * @param {Object} schema - Schema to validate
   * @returns {Object} Validation result with Google-specific checks
   */
  validateForGoogleRichResults(schema) {
    const validation = this.validateSchema(schema);
    const googleIssues = [];
    const googleWarnings = [];
    const googleSuggestions = [];

    // Google-specific validation rules
    const schemaType = schema['@type'];

    // Check for Google-supported schema types
    const googleSupportedTypes = [
      'Article', 'Organization', 'LocalBusiness', 'Product', 'SoftwareApplication',
      'FAQPage', 'HowTo', 'VideoObject', 'Event', 'Course', 'BreadcrumbList'
    ];

    if (!googleSupportedTypes.includes(schemaType)) {
      googleWarnings.push(`Schema type ${schemaType} may not be fully supported by Google Rich Results`);
    }

    // Article-specific Google requirements
    if (schemaType === 'Article') {
      if (!schema.author) googleIssues.push('Article missing author (required for Google Rich Results)');
      if (!schema.datePublished) googleIssues.push('Article missing datePublished (required for Google Rich Results)');
      if (!schema.headline) googleIssues.push('Article missing headline (required for Google Rich Results)');
      if (!schema.image) googleWarnings.push('Article missing image (recommended for Google Rich Results)');
    }

    // Product-specific Google requirements
    if (schemaType === 'Product') {
      if (!schema.offers) googleIssues.push('Product missing offers (required for Google Rich Results)');
      if (!schema.aggregateRating && !schema.review) {
        googleWarnings.push('Product missing rating or reviews (recommended for Google Rich Results)');
      }
    }

    // Organization-specific Google requirements
    if (schemaType === 'Organization') {
      if (!schema.logo) googleWarnings.push('Organization missing logo (recommended for Google Rich Results)');
      if (!schema.url) googleWarnings.push('Organization missing url (recommended for Google Rich Results)');
    }

    return {
      ...validation,
      googleRichResults: {
        isEligible: googleIssues.length === 0,
        issues: googleIssues,
        warnings: googleWarnings,
        suggestions: googleSuggestions,
        supportedType: googleSupportedTypes.includes(schemaType)
      }
    };
  }

  /**
   * Generate schema with SEO best practices applied
   * @param {string} contentType - Content type
   * @param {Object} data - Content data
   * @param {Object} options - Generation options
   * @returns {Object} SEO-optimized schema
   */
  generateSEOOptimizedSchema(contentType, data, options = {}) {
    // Apply SEO best practices
    const seoOptions = {
      ...options,
      includeRating: true,
      addFoundingDate: true,
      optimizeImages: true,
      includeOfferCatalog: true,
      validate: true
    };

    // Generate base schema
    const schema = this.generateSchema(contentType, data, seoOptions);

    if (!schema) {
      return null;
    }

    // Apply additional SEO optimizations
    const optimizedData = this.optimizeSchema(schema.data, {
      imageWidth: 1200,
      imageHeight: 630,
      ...seoOptions
    });

    // Validate for Google Rich Results
    const googleValidation = this.validateForGoogleRichResults(optimizedData);

    return {
      ...schema,
      data: optimizedData,
      validation: googleValidation,
      seoOptimized: true,
      optimizations: {
        imageOptimized: true,
        textOptimized: true,
        urlsOptimized: true,
        googleRichResultsReady: googleValidation.googleRichResults.isEligible
      }
    };
  }
}

export default SchemaGenerator;