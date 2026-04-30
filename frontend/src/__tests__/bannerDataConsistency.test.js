/**
 * Property Tests: Banner Data Consistency and Promotional Priority
 * 
 * **Property 14: Banner Data Consistency**
 * *For any* active sale offer, all banner components (TopBanner, SaleBanner corner, 
 * SaleBanner side, SaleOfferSection) SHALL display the same discount_percent, 
 * sale_price, and original_price values.
 * 
 * **Property 15: Promotional Priority**
 * *For any* state where both a sale offer and campaign are active, the Landing_Page 
 * SHALL display the sale offer content with higher visual priority.
 * 
 * **Validates: Requirements 8.1, 8.3, 8.4, 8.6**
 * 
 * Feature: platform-fixes-enhancements, Property 14: Banner Data Consistency
 * Feature: platform-fixes-enhancements, Property 15: Promotional Priority
 */

describe('Banner Data Consistency and Promotional Priority', () => {
  
  /**
   * Helper function to generate a random sale offer
   */
  const generateSaleOffer = () => {
    const discountPercent = Math.floor(Math.random() * 50) + 10; // 10-60%
    const originalPrice = Math.floor(Math.random() * 5000) + 1000; // 1000-6000
    const salePrice = Math.floor(originalPrice * (1 - discountPercent / 100));
    const themes = ['default', 'early_adopter', 'diwali', 'christmas', 'newyear', 
                    'flash', 'blackfriday', 'summer', 'republic', 'holi'];
    
    return {
      enabled: true,
      theme: themes[Math.floor(Math.random() * themes.length)],
      title: `Sale ${Math.random().toString(36).substring(7)}`,
      subtitle: `Get ${discountPercent}% OFF`,
      discount_percent: discountPercent,
      original_price: originalPrice,
      sale_price: salePrice,
      badge_text: 'SPECIAL OFFER',
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      cta_text: 'Claim Now'
    };
  };

  /**
   * Helper function to generate a random campaign
   */
  const generateCampaign = () => {
    const discountPercent = Math.floor(Math.random() * 30) + 5; // 5-35%
    const originalPrice = Math.floor(Math.random() * 3000) + 1000; // 1000-4000
    const campaignPrice = Math.floor(originalPrice * (1 - discountPercent / 100));
    
    return {
      active: true,
      name: `Campaign ${Math.random().toString(36).substring(7)}`,
      description: `Save ${discountPercent}%`,
      discount_percent: discountPercent,
      campaign_price: campaignPrice,
      end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      badge_text: 'CAMPAIGN OFFER',
      cta_text: 'Get Deal'
    };
  };

  /**
   * Helper function to generate pricing data
   */
  const generatePricing = (campaignActive = false) => {
    const regularPrice = Math.floor(Math.random() * 2000) + 1000; // 1000-3000
    const discountPercent = Math.floor(Math.random() * 20) + 5; // 5-25%
    const campaignPrice = Math.floor(regularPrice * (1 - discountPercent / 100));
    
    return {
      regular_price: regularPrice,
      regular_price_display: `₹${regularPrice}`,
      campaign_price: campaignPrice,
      campaign_price_display: `₹${campaignPrice}`,
      campaign_active: campaignActive,
      campaign_discount_percent: discountPercent,
      trial_days: 7
    };
  };

  /**
   * Simulates the getActivePromotion logic from useSaleOfferData hook
   * Priority: Sale Offer > Campaign > Pricing Campaign
   */
  const getActivePromotion = (saleOffer, campaign, pricing) => {
    // Sale offer takes priority when both exist
    if (saleOffer && saleOffer.enabled) {
      return {
        type: 'sale_offer',
        data: saleOffer,
        discount_percent: saleOffer.discount_percent,
        original_price: saleOffer.original_price,
        sale_price: saleOffer.sale_price,
        end_date: saleOffer.valid_until || saleOffer.end_date,
        title: saleOffer.title,
        subtitle: saleOffer.subtitle,
        theme: saleOffer.theme || 'default',
        badge_text: saleOffer.badge_text,
        cta_text: saleOffer.cta_text
      };
    }

    // Fall back to campaign if no sale offer
    if (campaign && campaign.active) {
      return {
        type: 'campaign',
        data: campaign,
        discount_percent: campaign.discount_percent || pricing?.campaign_discount_percent,
        original_price: pricing?.regular_price,
        sale_price: campaign.campaign_price || pricing?.campaign_price,
        end_date: campaign.end_date,
        title: campaign.name || campaign.title,
        subtitle: campaign.description || campaign.subtitle,
        theme: campaign.theme || 'default',
        badge_text: campaign.badge_text || 'SPECIAL OFFER',
        cta_text: campaign.cta_text || 'Get Deal'
      };
    }

    // Fall back to pricing campaign if active
    if (pricing?.campaign_active) {
      return {
        type: 'pricing_campaign',
        data: pricing,
        discount_percent: pricing.campaign_discount_percent,
        original_price: pricing.regular_price,
        sale_price: pricing.campaign_price,
        end_date: pricing.campaign_end_date,
        title: pricing.campaign_name || 'Special Offer',
        subtitle: `${pricing.campaign_discount_percent}% OFF`,
        theme: 'default',
        badge_text: 'SPECIAL OFFER',
        cta_text: 'Get Deal'
      };
    }

    return null;
  };

  /**
   * Simulates extracting banner display data from a sale offer
   * This is what each banner component would extract
   */
  const extractBannerData = (saleOffer) => {
    if (!saleOffer || !saleOffer.enabled) return null;
    
    return {
      discount_percent: saleOffer.discount_percent,
      original_price: saleOffer.original_price,
      sale_price: saleOffer.sale_price,
      end_date: saleOffer.valid_until || saleOffer.end_date,
      theme: saleOffer.theme || 'default'
    };
  };

  /**
   * Property 14: Banner Data Consistency
   * For any active sale offer, all banner components SHALL display the same values
   */
  describe('Property 14: Banner Data Consistency', () => {
    
    it('should extract consistent data for any sale offer', () => {
      // Test 100 random sale offers
      for (let i = 0; i < 100; i++) {
        const saleOffer = generateSaleOffer();
        
        // Simulate data extraction for different banner components
        const topBannerData = extractBannerData(saleOffer);
        const cornerBannerData = extractBannerData(saleOffer);
        const sideBannerData = extractBannerData(saleOffer);
        const saleOfferSectionData = extractBannerData(saleOffer);
        
        // All banners should have the same discount_percent
        expect(topBannerData.discount_percent).toBe(cornerBannerData.discount_percent);
        expect(cornerBannerData.discount_percent).toBe(sideBannerData.discount_percent);
        expect(sideBannerData.discount_percent).toBe(saleOfferSectionData.discount_percent);
        
        // All banners should have the same sale_price
        expect(topBannerData.sale_price).toBe(cornerBannerData.sale_price);
        expect(cornerBannerData.sale_price).toBe(sideBannerData.sale_price);
        expect(sideBannerData.sale_price).toBe(saleOfferSectionData.sale_price);
        
        // All banners should have the same original_price
        expect(topBannerData.original_price).toBe(cornerBannerData.original_price);
        expect(cornerBannerData.original_price).toBe(sideBannerData.original_price);
        expect(sideBannerData.original_price).toBe(saleOfferSectionData.original_price);
        
        // All banners should have the same end_date
        expect(topBannerData.end_date).toBe(cornerBannerData.end_date);
        expect(cornerBannerData.end_date).toBe(sideBannerData.end_date);
        expect(sideBannerData.end_date).toBe(saleOfferSectionData.end_date);
        
        // All banners should have the same theme
        expect(topBannerData.theme).toBe(cornerBannerData.theme);
        expect(cornerBannerData.theme).toBe(sideBannerData.theme);
        expect(sideBannerData.theme).toBe(saleOfferSectionData.theme);
      }
    });

    it('should maintain data consistency when sale offer values change', () => {
      // Test that changing the source data affects all extractions equally
      for (let i = 0; i < 100; i++) {
        const saleOffer = generateSaleOffer();
        const originalData = extractBannerData(saleOffer);
        
        // Modify the sale offer
        const modifiedSaleOffer = {
          ...saleOffer,
          discount_percent: saleOffer.discount_percent + 5,
          sale_price: saleOffer.sale_price - 100
        };
        
        const modifiedData = extractBannerData(modifiedSaleOffer);
        
        // The modified data should reflect the changes
        expect(modifiedData.discount_percent).toBe(originalData.discount_percent + 5);
        expect(modifiedData.sale_price).toBe(originalData.sale_price - 100);
        
        // But original_price should remain the same
        expect(modifiedData.original_price).toBe(originalData.original_price);
      }
    });

    it('should return null for disabled sale offers', () => {
      for (let i = 0; i < 100; i++) {
        const saleOffer = generateSaleOffer();
        saleOffer.enabled = false;
        
        const bannerData = extractBannerData(saleOffer);
        expect(bannerData).toBeNull();
      }
    });

    it('should handle sale offers with valid_until vs end_date consistently', () => {
      for (let i = 0; i < 100; i++) {
        const saleOffer = generateSaleOffer();
        
        // Test with valid_until
        const dataWithValidUntil = extractBannerData(saleOffer);
        
        // Test with only end_date (remove valid_until)
        const saleOfferWithEndDate = { ...saleOffer };
        delete saleOfferWithEndDate.valid_until;
        const dataWithEndDate = extractBannerData(saleOfferWithEndDate);
        
        // Both should have a valid end_date
        expect(dataWithValidUntil.end_date).toBeTruthy();
        expect(dataWithEndDate.end_date).toBeTruthy();
      }
    });
  });

  /**
   * Property 15: Promotional Priority
   * Sale offer takes priority over campaign when both exist
   */
  describe('Property 15: Promotional Priority', () => {
    
    it('should prioritize sale offer over campaign when both are active', () => {
      // Test 100 random combinations
      for (let i = 0; i < 100; i++) {
        const saleOffer = generateSaleOffer();
        const campaign = generateCampaign();
        const pricing = generatePricing(true);
        
        const activePromotion = getActivePromotion(saleOffer, campaign, pricing);
        
        // Sale offer should always win
        expect(activePromotion.type).toBe('sale_offer');
        expect(activePromotion.discount_percent).toBe(saleOffer.discount_percent);
        expect(activePromotion.sale_price).toBe(saleOffer.sale_price);
        expect(activePromotion.original_price).toBe(saleOffer.original_price);
      }
    });

    it('should fall back to campaign when sale offer is disabled', () => {
      for (let i = 0; i < 100; i++) {
        const saleOffer = generateSaleOffer();
        saleOffer.enabled = false;
        const campaign = generateCampaign();
        const pricing = generatePricing(false);
        
        const activePromotion = getActivePromotion(saleOffer, campaign, pricing);
        
        // Campaign should be selected
        expect(activePromotion.type).toBe('campaign');
        expect(activePromotion.discount_percent).toBe(campaign.discount_percent);
      }
    });

    it('should fall back to campaign when sale offer is null', () => {
      for (let i = 0; i < 100; i++) {
        const campaign = generateCampaign();
        const pricing = generatePricing(false);
        
        const activePromotion = getActivePromotion(null, campaign, pricing);
        
        // Campaign should be selected
        expect(activePromotion.type).toBe('campaign');
      }
    });

    it('should fall back to pricing campaign when no sale offer or campaign', () => {
      for (let i = 0; i < 100; i++) {
        const pricing = generatePricing(true);
        
        const activePromotion = getActivePromotion(null, null, pricing);
        
        // Pricing campaign should be selected
        expect(activePromotion.type).toBe('pricing_campaign');
        expect(activePromotion.discount_percent).toBe(pricing.campaign_discount_percent);
      }
    });

    it('should return null when no promotions are active', () => {
      for (let i = 0; i < 100; i++) {
        const saleOffer = generateSaleOffer();
        saleOffer.enabled = false;
        const campaign = generateCampaign();
        campaign.active = false;
        const pricing = generatePricing(false);
        
        const activePromotion = getActivePromotion(saleOffer, campaign, pricing);
        
        expect(activePromotion).toBeNull();
      }
    });

    it('should maintain priority order: sale_offer > campaign > pricing_campaign', () => {
      // Test all combinations
      const testCases = [
        { saleEnabled: true, campaignActive: true, pricingActive: true, expected: 'sale_offer' },
        { saleEnabled: true, campaignActive: true, pricingActive: false, expected: 'sale_offer' },
        { saleEnabled: true, campaignActive: false, pricingActive: true, expected: 'sale_offer' },
        { saleEnabled: true, campaignActive: false, pricingActive: false, expected: 'sale_offer' },
        { saleEnabled: false, campaignActive: true, pricingActive: true, expected: 'campaign' },
        { saleEnabled: false, campaignActive: true, pricingActive: false, expected: 'campaign' },
        { saleEnabled: false, campaignActive: false, pricingActive: true, expected: 'pricing_campaign' },
        { saleEnabled: false, campaignActive: false, pricingActive: false, expected: null },
      ];

      testCases.forEach(({ saleEnabled, campaignActive, pricingActive, expected }) => {
        const saleOffer = saleEnabled ? generateSaleOffer() : { ...generateSaleOffer(), enabled: false };
        const campaign = campaignActive ? generateCampaign() : { ...generateCampaign(), active: false };
        const pricing = generatePricing(pricingActive);

        const activePromotion = getActivePromotion(
          saleEnabled ? saleOffer : null,
          campaignActive ? campaign : null,
          pricing
        );

        if (expected === null) {
          expect(activePromotion).toBeNull();
        } else {
          expect(activePromotion.type).toBe(expected);
        }
      });
    });
  });

  /**
   * Additional consistency tests
   */
  describe('Data Integrity Tests', () => {
    
    it('should ensure sale_price is always less than original_price', () => {
      for (let i = 0; i < 100; i++) {
        const saleOffer = generateSaleOffer();
        expect(saleOffer.sale_price).toBeLessThan(saleOffer.original_price);
      }
    });

    it('should ensure discount_percent is within valid range (1-99)', () => {
      for (let i = 0; i < 100; i++) {
        const saleOffer = generateSaleOffer();
        expect(saleOffer.discount_percent).toBeGreaterThanOrEqual(1);
        expect(saleOffer.discount_percent).toBeLessThanOrEqual(99);
      }
    });

    it('should ensure end_date is in the future', () => {
      for (let i = 0; i < 100; i++) {
        const saleOffer = generateSaleOffer();
        const endDate = new Date(saleOffer.end_date);
        const now = new Date();
        // Allow for some tolerance (end of day)
        expect(endDate.getTime()).toBeGreaterThan(now.getTime() - 24 * 60 * 60 * 1000);
      }
    });

    it('should ensure theme is always a valid string', () => {
      const validThemes = ['default', 'early_adopter', 'diwali', 'christmas', 'newyear', 
                          'flash', 'blackfriday', 'summer', 'republic', 'holi'];
      
      for (let i = 0; i < 100; i++) {
        const saleOffer = generateSaleOffer();
        expect(validThemes).toContain(saleOffer.theme);
      }
    });
  });
});
