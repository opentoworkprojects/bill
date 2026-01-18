// Debug test to check what's being imported
import fs from 'fs';
import path from 'path';

describe('Debug Import Test', () => {
  it('should import blog posts correctly', async () => {
    // Read the file directly
    const filePath = path.join(__dirname, '../data/blogPosts.js');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    console.log('File exists:', fs.existsSync(filePath));
    console.log('File size:', fileContent.length);
    console.log('First 500 chars:', fileContent.substring(0, 500));
    
    // Dynamic import to bypass cache
    const module = await import('../data/blogPosts.js?t=' + Date.now());
    const { blogPosts, VALID_CATEGORIES, TOTAL_BLOG_POSTS } = module;
    
    console.log('blogPosts.length:', blogPosts?.length);
    console.log('VALID_CATEGORIES:', VALID_CATEGORIES);
    console.log('TOTAL_BLOG_POSTS:', TOTAL_BLOG_POSTS);
    console.log('First blog post:', JSON.stringify(blogPosts?.[0], null, 2));
    
    expect(blogPosts).toBeDefined();
    expect(Array.isArray(blogPosts)).toBe(true);
  });
});