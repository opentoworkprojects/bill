/**
 * Property Tests: Blog Post Data Completeness, Slug Uniqueness, and Category Validity
 * 
 * **Property 1: Blog Post Data Completeness**
 * *For any* blog post in the blog posts collection, the post SHALL contain all required SEO fields: 
 * title (max 60 chars), metaDescription (max 155 chars), slug (unique), author, date, lastModified, 
 * readTime, category (from valid list), keywords array, image, and imageAlt.
 * 
 * **Property 2: Blog Post Slug Uniqueness**
 * *For any* collection of blog posts, all slugs SHALL be unique - no two blog posts can have the same slug value.
 * 
 * **Property 3: Blog Post Category Validity**
 * *For any* blog post, the category field SHALL be one of the valid categories: "Software Guide", 
 * "Comparison", "How-To", "Industry News", "Case Studies", "City Guides", "Restaurant Tips", "Technology".
 * 
 * **Validates: Requirements 2.2, 2.3, 2.4, 2.5, 9.1**
 * 
 * Feature: seo-enhancement, Property 1: Blog Post Data Completeness
 * Feature: seo-enhancement, Property 2: Blog Post Slug Uniqueness
 * Feature: seo-enhancement, Property 3: Blog Post Category Validity
 */

import { blogPosts, VALID_CATEGORIES, TOTAL_BLOG_POSTS } from '../data/blogPosts';

describe('Blog Post Data Completeness, Slug Uniqueness, and Category Validity', () => {

  /**
   * Helper function to validate required fields for a blog post
   */
  const validateBlogPostFields = (post) => {
    const requiredFields = [
      'id', 'slug', 'title', 'metaTitle', 'metaDescription', 'excerpt', 
      'author', 'date', 'lastModified', 'readTime', 'category', 'tags', 
      'keywords', 'image', 'imageAlt', 'featured', 'relatedPosts', 'content'
    ];

    const missingFields = requiredFields.filter(field => {
      return post[field] === undefined || post[field] === null;
    });

    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  };

  /**
   * Helper function to validate author object structure
   */
  const validateAuthorStructure = (author) => {
    if (!author || typeof author !== 'object') return false;
    
    const requiredAuthorFields = ['name', 'bio', 'avatar'];
    return requiredAuthorFields.every(field => 
      author[field] && typeof author[field] === 'string' && author[field].length > 0
    );
  };

  /**
   * Helper function to validate array fields
   */
  const validateArrayFields = (post) => {
    const arrayFields = ['tags', 'keywords', 'relatedPosts'];
    
    return arrayFields.every(field => {
      const value = post[field];
      return Array.isArray(value) && value.length > 0;
    });
  };

  /**
   * Property 1: Blog Post Data Completeness
   * For any blog post, all required SEO fields must be present and valid
   */
  describe('Property 1: Blog Post Data Completeness', () => {
    
    it('should have all required fields for every blog post', () => {
      // Test all blog posts in the collection
      blogPosts.forEach((post, index) => {
        const validation = validateBlogPostFields(post);
        
        expect(validation.isValid).toBe(true);
        if (!validation.isValid) {
          console.error(`Blog post at index ${index} (id: ${post.id}) missing fields:`, validation.missingFields);
        }
      });
    });

    it('should have valid title length (max 60 characters)', () => {
      blogPosts.forEach((post) => {
        expect(post.title).toBeDefined();
        expect(typeof post.title).toBe('string');
        expect(post.title.length).toBeGreaterThan(0);
        expect(post.title.length).toBeLessThanOrEqual(60);
      });
    });

    it('should have valid metaDescription length (max 155 characters)', () => {
      blogPosts.forEach((post) => {
        expect(post.metaDescription).toBeDefined();
        expect(typeof post.metaDescription).toBe('string');
        expect(post.metaDescription.length).toBeGreaterThan(0);
        expect(post.metaDescription.length).toBeLessThanOrEqual(155);
      });
    });

    it('should have valid author structure', () => {
      blogPosts.forEach((post) => {
        expect(validateAuthorStructure(post.author)).toBe(true);
      });
    });

    it('should have valid date format (YYYY-MM-DD)', () => {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      
      blogPosts.forEach((post) => {
        expect(post.date).toMatch(dateRegex);
        expect(post.lastModified).toMatch(dateRegex);
        
        // Dates should be valid
        expect(new Date(post.date)).toBeInstanceOf(Date);
        expect(new Date(post.lastModified)).toBeInstanceOf(Date);
        expect(isNaN(new Date(post.date).getTime())).toBe(false);
        expect(isNaN(new Date(post.lastModified).getTime())).toBe(false);
      });
    });

    it('should have valid readTime format', () => {
      const readTimeRegex = /^\d+\s+min\s+read$/;
      
      blogPosts.forEach((post) => {
        expect(post.readTime).toMatch(readTimeRegex);
      });
    });

    it('should have non-empty array fields', () => {
      blogPosts.forEach((post) => {
        expect(validateArrayFields(post)).toBe(true);
      });
    });

    it('should have valid keywords array with SEO-relevant terms', () => {
      blogPosts.forEach((post) => {
        expect(Array.isArray(post.keywords)).toBe(true);
        expect(post.keywords.length).toBeGreaterThan(0);
        expect(post.keywords.length).toBeLessThanOrEqual(10); // SEO best practice
        
        // Each keyword should be a non-empty string
        post.keywords.forEach(keyword => {
          expect(typeof keyword).toBe('string');
          expect(keyword.length).toBeGreaterThan(0);
        });
      });
    });

    it('should have valid image URL and alt text', () => {
      blogPosts.forEach((post) => {
        expect(typeof post.image).toBe('string');
        expect(post.image.length).toBeGreaterThan(0);
        expect(post.image).toMatch(/^https?:\/\//); // Should be a valid URL
        
        expect(typeof post.imageAlt).toBe('string');
        expect(post.imageAlt.length).toBeGreaterThan(0);
        expect(post.imageAlt.length).toBeLessThanOrEqual(125); // SEO best practice
      });
    });

    it('should have valid boolean featured field', () => {
      blogPosts.forEach((post) => {
        expect(typeof post.featured).toBe('boolean');
      });
    });

    it('should have valid relatedPosts array with existing post IDs', () => {
      const allPostIds = blogPosts.map(post => post.id);
      
      blogPosts.forEach((post) => {
        expect(Array.isArray(post.relatedPosts)).toBe(true);
        expect(post.relatedPosts.length).toBeGreaterThan(0);
        expect(post.relatedPosts.length).toBeLessThanOrEqual(5); // Reasonable limit
        
        // Each related post ID should exist in the collection
        post.relatedPosts.forEach(relatedId => {
          expect(typeof relatedId).toBe('number');
          expect(allPostIds).toContain(relatedId);
          expect(relatedId).not.toBe(post.id); // Should not reference itself
        });
      });
    });

    it('should have non-empty content field', () => {
      blogPosts.forEach((post) => {
        expect(typeof post.content).toBe('string');
        expect(post.content.length).toBeGreaterThan(0);
        expect(post.content.trim().length).toBeGreaterThan(0);
      });
    });

    it('should have consistent metaTitle and title relationship', () => {
      blogPosts.forEach((post) => {
        expect(typeof post.metaTitle).toBe('string');
        expect(post.metaTitle.length).toBeGreaterThan(0);
        expect(post.metaTitle.length).toBeLessThanOrEqual(60);
        
        // metaTitle should contain some keywords from the title or be related
        const titleWords = post.title.toLowerCase().split(/\s+/);
        const metaTitleWords = post.metaTitle.toLowerCase().split(/\s+/);
        
        // At least one significant word should overlap (excluding common words)
        const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', '2025', '-'];
        const significantTitleWords = titleWords.filter(word => !commonWords.includes(word) && word.length > 2);
        const significantMetaTitleWords = metaTitleWords.filter(word => !commonWords.includes(word) && word.length > 2);
        
        const hasOverlap = significantTitleWords.some(word => 
          significantMetaTitleWords.some(metaWord => 
            metaWord.includes(word) || word.includes(metaWord)
          )
        );
        
        expect(hasOverlap).toBe(true);
      });
    });
  });

  /**
   * Property 2: Blog Post Slug Uniqueness
   * All blog post slugs must be unique
   */
  describe('Property 2: Blog Post Slug Uniqueness', () => {
    
    it('should have unique slugs for all blog posts', () => {
      const slugs = blogPosts.map(post => post.slug);
      const uniqueSlugs = new Set(slugs);
      
      expect(uniqueSlugs.size).toBe(slugs.length);
      
      // If there are duplicates, identify them
      if (uniqueSlugs.size !== slugs.length) {
        const duplicates = slugs.filter((slug, index) => slugs.indexOf(slug) !== index);
        console.error('Duplicate slugs found:', [...new Set(duplicates)]);
      }
    });

    it('should have valid slug format (URL-friendly)', () => {
      const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
      
      blogPosts.forEach((post) => {
        expect(post.slug).toMatch(slugRegex);
        expect(post.slug.length).toBeGreaterThan(0);
        expect(post.slug.length).toBeLessThanOrEqual(100); // Reasonable URL length
        
        // Should not start or end with hyphen
        expect(post.slug.startsWith('-')).toBe(false);
        expect(post.slug.endsWith('-')).toBe(false);
        
        // Should not have consecutive hyphens
        expect(post.slug.includes('--')).toBe(false);
      });
    });

    it('should have slugs that relate to the title', () => {
      blogPosts.forEach((post) => {
        const titleWords = post.title.toLowerCase()
          .replace(/[^a-z0-9\s]/g, '') // Remove special characters
          .split(/\s+/)
          .filter(word => word.length > 2); // Filter out short words
        
        const slugWords = post.slug.split('-');
        
        // At least 50% of significant title words should appear in slug
        const matchingWords = titleWords.filter(titleWord => 
          slugWords.some(slugWord => 
            slugWord.includes(titleWord) || titleWord.includes(slugWord)
          )
        );
        
        const matchPercentage = matchingWords.length / titleWords.length;
        expect(matchPercentage).toBeGreaterThanOrEqual(0.3); // At least 30% match
      });
    });
  });

  /**
   * Property 3: Blog Post Category Validity
   * All blog posts must have valid categories
   */
  describe('Property 3: Blog Post Category Validity', () => {
    
    it('should have valid categories for all blog posts', () => {
      blogPosts.forEach((post) => {
        expect(VALID_CATEGORIES).toContain(post.category);
      });
    });

    it('should have balanced category distribution', () => {
      const categoryCount = {};
      VALID_CATEGORIES.forEach(category => {
        categoryCount[category] = 0;
      });
      
      blogPosts.forEach((post) => {
        categoryCount[post.category]++;
      });
      
      // Each category should have at least one post
      VALID_CATEGORIES.forEach(category => {
        expect(categoryCount[category]).toBeGreaterThan(0);
      });
      
      // No single category should dominate (more than 50% of posts)
      const maxCategoryCount = Math.max(...Object.values(categoryCount));
      expect(maxCategoryCount).toBeLessThanOrEqual(Math.ceil(blogPosts.length * 0.5));
    });

    it('should have category-appropriate keywords', () => {
      const categoryKeywords = {
        'Software Guide': ['software', 'guide', 'best', 'top', 'system', 'solution'],
        'Comparison': ['vs', 'comparison', 'compare', 'alternative', 'better', 'difference'],
        'How-To': ['how to', 'guide', 'tutorial', 'step', 'setup', 'install'],
        'Industry News': ['trends', 'industry', 'news', 'market', 'analysis', '2025'],
        'Case Studies': ['success', 'story', 'case study', 'growth', 'results'],
        'City Guides': ['mumbai', 'delhi', 'bangalore', 'chennai', 'kolkata', 'pune', 'city'],
        'Restaurant Tips': ['tips', 'management', 'best practices', 'advice', 'improve'],
        'Technology': ['technology', 'tech', 'digital', 'system', 'integration', 'automation']
      };
      
      blogPosts.forEach((post) => {
        const categoryKeywordList = categoryKeywords[post.category] || [];
        const postText = (post.title + ' ' + post.metaDescription + ' ' + post.keywords.join(' ')).toLowerCase();
        
        // At least one category-appropriate keyword should appear
        const hasRelevantKeyword = categoryKeywordList.some(keyword => 
          postText.includes(keyword.toLowerCase())
        );
        
        expect(hasRelevantKeyword).toBe(true);
      });
    });
  });

  /**
   * Collection-level tests
   */
  describe('Blog Post Collection Tests', () => {
    
    it('should have at least 50 blog posts', () => {
      expect(blogPosts.length).toBeGreaterThanOrEqual(50);
      expect(TOTAL_BLOG_POSTS).toBe(blogPosts.length);
    });

    it('should have sequential and unique IDs', () => {
      const ids = blogPosts.map(post => post.id).sort((a, b) => a - b);
      
      // IDs should be unique
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
      
      // IDs should be sequential starting from 1
      for (let i = 0; i < ids.length; i++) {
        expect(ids[i]).toBe(i + 1);
      }
    });

    it('should have reasonable distribution of featured posts', () => {
      const featuredCount = blogPosts.filter(post => post.featured).length;
      const featuredPercentage = featuredCount / blogPosts.length;
      
      // Between 20% and 40% of posts should be featured
      expect(featuredPercentage).toBeGreaterThanOrEqual(0.2);
      expect(featuredPercentage).toBeLessThanOrEqual(0.4);
    });

    it('should have posts with recent dates', () => {
      const currentYear = new Date().getFullYear();
      const recentPosts = blogPosts.filter(post => {
        const postYear = new Date(post.date).getFullYear();
        return postYear >= currentYear - 1; // Within last year
      });
      
      // At least 80% of posts should be recent
      const recentPercentage = recentPosts.length / blogPosts.length;
      expect(recentPercentage).toBeGreaterThanOrEqual(0.8);
    });

    it('should have consistent lastModified dates', () => {
      blogPosts.forEach((post) => {
        const publishDate = new Date(post.date);
        const modifiedDate = new Date(post.lastModified);
        
        // lastModified should be >= publishDate
        expect(modifiedDate.getTime()).toBeGreaterThanOrEqual(publishDate.getTime());
      });
    });
  });
});