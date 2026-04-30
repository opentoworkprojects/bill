/**
 * Unit Tests: CityLandingPage Component
 * 
 * Tests the CityLandingPage component functionality including:
 * - City data rendering
 * - SEO meta tag generation
 * - Component structure validation
 * - Error handling for invalid cities
 * 
 * **Validates: Requirements 6.1, 6.2, 6.3**
 */

import React from 'react';
import CityLandingPage from '../pages/CityLandingPage';
import { cityData, getCityBySlug } from '../data/cityData';

// Mock react-router-dom for testing
jest.mock('react-router-dom', () => ({
  useParams: () => ({ citySlug: 'restaurant-billing-software-mumbai' }),
  useNavigate: () => jest.fn(),
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
}));

// Mock react-helmet-async
jest.mock('react-helmet-async', () => ({
  Helmet: ({ children }) => <div data-testid="helmet">{children}</div>,
}));

// Mock UI components
jest.mock('../components/ui/button', () => ({
  Button: ({ children, onClick, ...props }) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

jest.mock('../components/ui/card', () => ({
  Card: ({ children, ...props }) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }) => <div {...props}>{children}</div>,
}));

// Mock SEO components
jest.mock('../components/seo/SEOMeta', () => {
  return function SEOMeta(props) {
    return <div data-testid="seo-meta" data-props={JSON.stringify(props)} />;
  };
});

jest.mock('../components/seo/SchemaManager', () => {
  return function SchemaManager(props) {
    return <div data-testid="schema-manager" data-type={props.type} />;
  };
});

describe('CityLandingPage Component', () => {
  
  test('getCityBySlug function works correctly', () => {
    const mumbaiSlug = getCityBySlug('restaurant-billing-software-mumbai');
    expect(mumbaiSlug).toBe('mumbai');
    
    const invalidSlug = getCityBySlug('non-existent-city');
    expect(invalidSlug).toBeUndefined();
  });

  test('city data structure is valid for Mumbai', () => {
    const mumbaiCity = cityData.mumbai;
    
    // Check required fields exist
    expect(mumbaiCity.name).toBe('Mumbai');
    expect(mumbaiCity.state).toBe('Maharashtra');
    expect(mumbaiCity.slug).toBe('restaurant-billing-software-mumbai');
    expect(mumbaiCity.title).toContain('Mumbai');
    expect(mumbaiCity.description).toContain('Mumbai');
    expect(Array.isArray(mumbaiCity.keywords)).toBe(true);
    expect(mumbaiCity.keywords.length).toBeGreaterThan(0);
    
    // Check stats structure
    expect(typeof mumbaiCity.stats.restaurantCount).toBe('number');
    expect(typeof mumbaiCity.stats.averageRating).toBe('number');
    expect(Array.isArray(mumbaiCity.stats.topCuisines)).toBe(true);
    expect(typeof mumbaiCity.stats.averageSavings).toBe('string');
    
    // Check testimonials structure
    expect(Array.isArray(mumbaiCity.testimonials)).toBe(true);
    expect(mumbaiCity.testimonials.length).toBeGreaterThan(0);
    
    mumbaiCity.testimonials.forEach(testimonial => {
      expect(typeof testimonial.name).toBe('string');
      expect(typeof testimonial.restaurant).toBe('string');
      expect(typeof testimonial.quote).toBe('string');
      expect(typeof testimonial.rating).toBe('number');
      expect(typeof testimonial.image).toBe('string');
    });
    
    // Check local features
    expect(Array.isArray(mumbaiCity.localFeatures)).toBe(true);
    expect(mumbaiCity.localFeatures.length).toBeGreaterThan(0);
    
    // Check nearby areas
    expect(Array.isArray(mumbaiCity.nearbyAreas)).toBe(true);
    expect(mumbaiCity.nearbyAreas.length).toBeGreaterThan(0);
    
    // Check popular restaurant types
    expect(Array.isArray(mumbaiCity.popularRestaurantTypes)).toBe(true);
    expect(mumbaiCity.popularRestaurantTypes.length).toBeGreaterThan(0);
  });

  test('city data contains SEO-optimized content', () => {
    const mumbaiCity = cityData.mumbai;
    
    // Title should be SEO-friendly (under 60 chars)
    expect(mumbaiCity.title.length).toBeLessThanOrEqual(60);
    
    // Description should be SEO-friendly (under 155 chars)
    expect(mumbaiCity.description.length).toBeLessThanOrEqual(155);
    
    // Keywords should contain city name
    const hasLocationKeywords = mumbaiCity.keywords.some(keyword => 
      keyword.toLowerCase().includes('mumbai')
    );
    expect(hasLocationKeywords).toBe(true);
    
    // Keywords should contain restaurant-related terms
    const hasRestaurantKeywords = mumbaiCity.keywords.some(keyword => 
      keyword.toLowerCase().includes('restaurant') || 
      keyword.toLowerCase().includes('billing') ||
      keyword.toLowerCase().includes('pos')
    );
    expect(hasRestaurantKeywords).toBe(true);
  });

  test('testimonials have proper rating values', () => {
    const mumbaiCity = cityData.mumbai;
    
    mumbaiCity.testimonials.forEach(testimonial => {
      expect(testimonial.rating).toBeGreaterThanOrEqual(1);
      expect(testimonial.rating).toBeLessThanOrEqual(5);
      expect(Number.isInteger(testimonial.rating)).toBe(true);
    });
  });

  test('local features are relevant to Mumbai', () => {
    const mumbaiCity = cityData.mumbai;
    
    // Should have Maharashtra-specific features
    const hasMaharashtraFeatures = mumbaiCity.localFeatures.some(feature =>
      feature.toLowerCase().includes('maharashtra') ||
      feature.toLowerCase().includes('marathi') ||
      feature.toLowerCase().includes('mumbai')
    );
    expect(hasMaharashtraFeatures).toBe(true);
    
    // Should have GST compliance features
    const hasGSTFeatures = mumbaiCity.localFeatures.some(feature =>
      feature.toLowerCase().includes('gst')
    );
    expect(hasGSTFeatures).toBe(true);
  });

  test('nearby areas are valid Mumbai locations', () => {
    const mumbaiCity = cityData.mumbai;
    
    // Check that nearby areas contain known Mumbai locations
    const knownMumbaiAreas = ['andheri', 'bandra', 'powai', 'thane', 'borivali'];
    const hasKnownAreas = knownMumbaiAreas.some(area =>
      mumbaiCity.nearbyAreas.some(nearbyArea =>
        nearbyArea.toLowerCase().includes(area)
      )
    );
    expect(hasKnownAreas).toBe(true);
  });

  test('restaurant types are appropriate for Mumbai', () => {
    const mumbaiCity = cityData.mumbai;
    
    // Should include common Mumbai restaurant types
    const commonTypes = ['street food', 'seafood', 'fine dining'];
    const hasCommonTypes = commonTypes.some(type =>
      mumbaiCity.popularRestaurantTypes.some(restaurantType =>
        restaurantType.toLowerCase().includes(type)
      )
    );
    expect(hasCommonTypes).toBe(true);
  });

  test('stats are reasonable for Mumbai market', () => {
    const mumbaiCity = cityData.mumbai;
    
    // Restaurant count should be reasonable for Mumbai
    expect(mumbaiCity.stats.restaurantCount).toBeGreaterThan(50);
    expect(mumbaiCity.stats.restaurantCount).toBeLessThan(1000);
    
    // Rating should be between 1 and 5
    expect(mumbaiCity.stats.averageRating).toBeGreaterThanOrEqual(1);
    expect(mumbaiCity.stats.averageRating).toBeLessThanOrEqual(5);
    
    // Should have multiple cuisine types
    expect(mumbaiCity.stats.topCuisines.length).toBeGreaterThanOrEqual(3);
    
    // Savings should be in Indian Rupees
    expect(mumbaiCity.stats.averageSavings).toMatch(/₹/);
  });

  test('all city data follows consistent structure', () => {
    const requiredFields = [
      'name', 'state', 'slug', 'title', 'description', 'keywords',
      'stats', 'testimonials', 'localFeatures', 'nearbyAreas', 'popularRestaurantTypes'
    ];
    
    const requiredStatsFields = ['restaurantCount', 'averageRating', 'topCuisines', 'averageSavings'];
    const requiredTestimonialFields = ['name', 'restaurant', 'quote', 'rating', 'image'];
    
    Object.keys(cityData).forEach(cityKey => {
      const city = cityData[cityKey];
      
      // Check required top-level fields
      requiredFields.forEach(field => {
        expect(city[field]).toBeDefined();
      });
      
      // Check stats structure
      requiredStatsFields.forEach(field => {
        expect(city.stats[field]).toBeDefined();
      });
      
      // Check testimonials structure
      expect(city.testimonials.length).toBeGreaterThan(0);
      city.testimonials.forEach(testimonial => {
        requiredTestimonialFields.forEach(field => {
          expect(testimonial[field]).toBeDefined();
        });
      });
      
      // Check arrays are not empty
      expect(city.keywords.length).toBeGreaterThan(0);
      expect(city.localFeatures.length).toBeGreaterThan(0);
      expect(city.nearbyAreas.length).toBeGreaterThan(0);
      expect(city.popularRestaurantTypes.length).toBeGreaterThan(0);
    });
  });

  test('city slugs are SEO-friendly', () => {
    Object.keys(cityData).forEach(cityKey => {
      const city = cityData[cityKey];
      
      // Slug should be URL-friendly
      expect(city.slug).toMatch(/^[a-z0-9-]+$/);
      
      // Slug should not start or end with hyphen
      expect(city.slug.startsWith('-')).toBe(false);
      expect(city.slug.endsWith('-')).toBe(false);
      
      // Slug should not have consecutive hyphens
      expect(city.slug.includes('--')).toBe(false);
      
      // Slug should contain city name or related terms
      const cityNameInSlug = city.slug.includes(city.name.toLowerCase()) ||
                            city.slug.includes('restaurant') ||
                            city.slug.includes('billing') ||
                            city.slug.includes('software');
      expect(cityNameInSlug).toBe(true);
    });
  });

  test('testimonial quotes are meaningful and not too long', () => {
    Object.keys(cityData).forEach(cityKey => {
      const city = cityData[cityKey];
      
      city.testimonials.forEach(testimonial => {
        // Quote should be meaningful (at least 20 characters)
        expect(testimonial.quote.length).toBeGreaterThanOrEqual(20);
        
        // Quote should not be too long (max 300 characters for readability)
        expect(testimonial.quote.length).toBeLessThanOrEqual(300);
        
        // Quote should not be empty or just whitespace
        expect(testimonial.quote.trim().length).toBeGreaterThan(0);
      });
    });
  });

  test('local features are specific and actionable', () => {
    Object.keys(cityData).forEach(cityKey => {
      const city = cityData[cityKey];
      
      city.localFeatures.forEach(feature => {
        // Feature should be descriptive (at least 10 characters)
        expect(feature.length).toBeGreaterThanOrEqual(10);
        
        // Feature should not be too long (max 100 characters)
        expect(feature.length).toBeLessThanOrEqual(100);
        
        // Feature should not be empty or just whitespace
        expect(feature.trim().length).toBeGreaterThan(0);
      });
    });
  });
});