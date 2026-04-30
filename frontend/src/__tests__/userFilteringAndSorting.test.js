/**
 * Property Tests: User Filtering, Searching, and Sorting
 * 
 * **Property 5: User Filtering Correctness**
 * *For any* list of users and a status filter (active, trial, expired), the filtered result 
 * SHALL contain only users matching that status, and the count of filtered users SHALL be 
 * less than or equal to the total user count.
 * 
 * **Property 6: User Search Correctness**
 * *For any* list of users and a search query, the search result SHALL contain only users 
 * where username or email contains the search query (case-insensitive).
 * 
 * **Property 7: User Sorting Correctness**
 * *For any* list of users and a sort field (created_at, subscription_expires_at, username), 
 * the sorted result SHALL maintain the correct ascending or descending order based on the sort direction.
 * 
 * **Validates: Requirements 3.5, 3.6, 3.7**
 * 
 * Feature: platform-fixes-enhancements, Property 5, 6, 7: User Filtering, Search, and Sorting
 */

describe('User Filtering, Searching, and Sorting', () => {
  /**
   * Helper function to generate a random user
   */
  const generateRandomUser = (index) => {
    const subscriptionActive = Math.random() > 0.5;
    const now = new Date();
    
    // Generate random dates
    const createdAt = new Date(now.getTime() - Math.random() * 365 * 24 * 60 * 60 * 1000);
    
    // Subscription expires: past (expired), future (active), or null (trial)
    let subscriptionExpiresAt = null;
    if (Math.random() > 0.3) {
      const daysOffset = Math.floor(Math.random() * 730) - 365; // -365 to +365 days
      subscriptionExpiresAt = new Date(now.getTime() + daysOffset * 24 * 60 * 60 * 1000).toISOString();
    }
    
    return {
      id: `user_${index}_${Math.random().toString(36).substr(2, 9)}`,
      username: `user${index}_${Math.random().toString(36).substr(2, 5)}`,
      email: `user${index}_${Math.random().toString(36).substr(2, 5)}@example.com`,
      role: Math.random() > 0.8 ? 'admin' : 'user',
      subscription_active: subscriptionActive,
      subscription_expires_at: subscriptionExpiresAt,
      created_at: createdAt.toISOString(),
      bill_count: Math.floor(Math.random() * 1000),
      last_login: Math.random() > 0.3 ? new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : null
    };
  };

  /**
   * Helper function to generate a list of random users
   */
  const generateUserList = (count) => {
    return Array.from({ length: count }, (_, i) => generateRandomUser(i));
  };

  /**
   * Implementation of getFilteredUsers function (mirrors SuperAdminPage.js)
   * Requirements: 3.5, 3.6, 3.7
   */
  const getFilteredUsers = (users, searchQuery, filterStatus, sortBy, sortOrder) => {
    let filtered = users.filter(user => {
      // Search filter (Requirements 3.6)
      const matchesSearch = !searchQuery || 
        (user.username && user.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Status filter (Requirements 3.5)
      let matchesStatus = true;
      if (filterStatus === 'active') {
        matchesStatus = user.subscription_active === true;
      } else if (filterStatus === 'trial') {
        // Trial users: not active subscription and either no expiry or expiry in future
        matchesStatus = !user.subscription_active && 
          (!user.subscription_expires_at || new Date(user.subscription_expires_at) >= new Date());
      } else if (filterStatus === 'expired') {
        // Expired users: subscription has expired (expiry date in the past)
        matchesStatus = user.subscription_expires_at && 
          new Date(user.subscription_expires_at) < new Date();
      }
      // 'all' shows everything
      
      return matchesSearch && matchesStatus;
    });

    // Sort users (Requirements 3.7)
    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      // Handle date fields
      if (sortBy === 'created_at' || sortBy === 'subscription_expires_at') {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      }
      
      // Handle string fields (case-insensitive)
      if (sortBy === 'username' || sortBy === 'email') {
        aVal = (aVal || '').toLowerCase();
        bVal = (bVal || '').toLowerCase();
      }
      
      // Handle numeric fields
      if (sortBy === 'bill_count') {
        aVal = aVal || 0;
        bVal = bVal || 0;
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });

    return filtered;
  };

  /**
   * Property 5: User Filtering Correctness
   * For any list of users and a status filter (active, trial, expired), the filtered result 
   * SHALL contain only users matching that status.
   * 
   * Validates: Requirements 3.5
   */
  describe('Property 5: User Filtering Correctness', () => {
    const STATUS_FILTERS = ['all', 'active', 'trial', 'expired'];

    it('should filter users correctly for any status filter (100 iterations)', () => {
      for (let i = 0; i < 100; i++) {
        const users = generateUserList(Math.floor(Math.random() * 50) + 10);
        const randomFilter = STATUS_FILTERS[Math.floor(Math.random() * STATUS_FILTERS.length)];
        
        const filtered = getFilteredUsers(users, '', randomFilter, 'created_at', 'desc');
        
        // Filtered count should be <= total count
        expect(filtered.length).toBeLessThanOrEqual(users.length);
        
        // Verify each filtered user matches the filter criteria
        const now = Date.now();
        filtered.forEach(user => {
          if (randomFilter === 'active') {
            expect(user.subscription_active).toBe(true);
          } else if (randomFilter === 'trial') {
            expect(user.subscription_active).toBe(false);
            if (user.subscription_expires_at) {
              // Allow 1 second tolerance for timing issues
              expect(new Date(user.subscription_expires_at).getTime()).toBeGreaterThanOrEqual(now - 1000);
            }
          } else if (randomFilter === 'expired') {
            expect(user.subscription_expires_at).toBeTruthy();
            // Allow 1 second tolerance for timing issues
            expect(new Date(user.subscription_expires_at).getTime()).toBeLessThan(now + 1000);
          }
          // 'all' filter should include all users
        });
      }
    });

    it('should return all users when filter is "all"', () => {
      for (let i = 0; i < 100; i++) {
        const users = generateUserList(Math.floor(Math.random() * 50) + 10);
        const filtered = getFilteredUsers(users, '', 'all', 'created_at', 'desc');
        
        expect(filtered.length).toBe(users.length);
      }
    });

    it('should handle empty user list', () => {
      STATUS_FILTERS.forEach(filter => {
        const filtered = getFilteredUsers([], '', filter, 'created_at', 'desc');
        expect(filtered.length).toBe(0);
      });
    });
  });

  /**
   * Property 6: User Search Correctness
   * For any list of users and a search query, the search result SHALL contain only users 
   * where username or email contains the search query (case-insensitive).
   * 
   * Validates: Requirements 3.6
   */
  describe('Property 6: User Search Correctness', () => {
    it('should search users correctly by username or email (100 iterations)', () => {
      for (let i = 0; i < 100; i++) {
        const users = generateUserList(Math.floor(Math.random() * 50) + 10);
        
        // Pick a random user and use part of their username or email as search query
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const useUsername = Math.random() > 0.5;
        const sourceField = useUsername ? randomUser.username : randomUser.email;
        
        // Extract a random substring (at least 2 chars)
        const startIdx = Math.floor(Math.random() * Math.max(1, sourceField.length - 2));
        const endIdx = startIdx + Math.floor(Math.random() * (sourceField.length - startIdx - 1)) + 2;
        const searchQuery = sourceField.substring(startIdx, endIdx);
        
        const filtered = getFilteredUsers(users, searchQuery, 'all', 'created_at', 'desc');
        
        // All filtered users should contain the search query in username or email
        filtered.forEach(user => {
          const matchesUsername = user.username.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesEmail = user.email.toLowerCase().includes(searchQuery.toLowerCase());
          expect(matchesUsername || matchesEmail).toBe(true);
        });
        
        // The random user we picked should be in the results
        const foundUser = filtered.find(u => u.id === randomUser.id);
        expect(foundUser).toBeTruthy();
      }
    });

    it('should be case-insensitive in search', () => {
      const users = [
        { id: '1', username: 'JohnDoe', email: 'john@example.com', subscription_active: true, created_at: new Date().toISOString() },
        { id: '2', username: 'janedoe', email: 'JANE@EXAMPLE.COM', subscription_active: false, created_at: new Date().toISOString() }
      ];

      // Search with different cases
      const searchQueries = ['john', 'JOHN', 'John', 'JANE', 'jane', 'Jane', 'DOE', 'doe', 'Doe'];
      
      searchQueries.forEach(query => {
        const filtered = getFilteredUsers(users, query, 'all', 'created_at', 'desc');
        
        // Should find at least one user
        expect(filtered.length).toBeGreaterThan(0);
        
        // All results should match case-insensitively
        filtered.forEach(user => {
          const matchesUsername = user.username.toLowerCase().includes(query.toLowerCase());
          const matchesEmail = user.email.toLowerCase().includes(query.toLowerCase());
          expect(matchesUsername || matchesEmail).toBe(true);
        });
      });
    });

    it('should return all users when search query is empty', () => {
      for (let i = 0; i < 100; i++) {
        const users = generateUserList(Math.floor(Math.random() * 50) + 10);
        const filtered = getFilteredUsers(users, '', 'all', 'created_at', 'desc');
        
        expect(filtered.length).toBe(users.length);
      }
    });

    it('should return empty array when no users match search query', () => {
      const users = generateUserList(20);
      const filtered = getFilteredUsers(users, 'xyznonexistent123456789', 'all', 'created_at', 'desc');
      
      expect(filtered.length).toBe(0);
    });
  });

  /**
   * Property 7: User Sorting Correctness
   * For any list of users and a sort field, the sorted result SHALL maintain the correct 
   * ascending or descending order based on the sort direction.
   * 
   * Validates: Requirements 3.7
   */
  describe('Property 7: User Sorting Correctness', () => {
    const SORT_FIELDS = ['created_at', 'subscription_expires_at', 'username', 'bill_count'];
    const SORT_ORDERS = ['asc', 'desc'];

    it('should sort users correctly for any sort field and order (100 iterations)', () => {
      for (let i = 0; i < 100; i++) {
        const users = generateUserList(Math.floor(Math.random() * 50) + 10);
        const randomSortBy = SORT_FIELDS[Math.floor(Math.random() * SORT_FIELDS.length)];
        const randomSortOrder = SORT_ORDERS[Math.floor(Math.random() * SORT_ORDERS.length)];
        
        const sorted = getFilteredUsers(users, '', 'all', randomSortBy, randomSortOrder);
        
        // Verify sorting order
        for (let j = 0; j < sorted.length - 1; j++) {
          let aVal = sorted[j][randomSortBy];
          let bVal = sorted[j + 1][randomSortBy];
          
          // Handle date fields
          if (randomSortBy === 'created_at' || randomSortBy === 'subscription_expires_at') {
            aVal = aVal ? new Date(aVal).getTime() : 0;
            bVal = bVal ? new Date(bVal).getTime() : 0;
          }
          
          // Handle string fields
          if (randomSortBy === 'username' || randomSortBy === 'email') {
            aVal = (aVal || '').toLowerCase();
            bVal = (bVal || '').toLowerCase();
          }
          
          // Handle numeric fields
          if (randomSortBy === 'bill_count') {
            aVal = aVal || 0;
            bVal = bVal || 0;
          }
          
          // Use appropriate comparison based on type
          if (typeof aVal === 'string' && typeof bVal === 'string') {
            if (randomSortOrder === 'asc') {
              expect(aVal <= bVal).toBe(true);
            } else {
              expect(aVal >= bVal).toBe(true);
            }
          } else {
            if (randomSortOrder === 'asc') {
              expect(aVal).toBeLessThanOrEqual(bVal);
            } else {
              expect(aVal).toBeGreaterThanOrEqual(bVal);
            }
          }
        }
      }
    });

    it('should sort by created_at correctly', () => {
      const users = generateUserList(20);
      
      // Test ascending
      const sortedAsc = getFilteredUsers(users, '', 'all', 'created_at', 'asc');
      for (let i = 0; i < sortedAsc.length - 1; i++) {
        const aTime = new Date(sortedAsc[i].created_at).getTime();
        const bTime = new Date(sortedAsc[i + 1].created_at).getTime();
        expect(aTime).toBeLessThanOrEqual(bTime);
      }
      
      // Test descending
      const sortedDesc = getFilteredUsers(users, '', 'all', 'created_at', 'desc');
      for (let i = 0; i < sortedDesc.length - 1; i++) {
        const aTime = new Date(sortedDesc[i].created_at).getTime();
        const bTime = new Date(sortedDesc[i + 1].created_at).getTime();
        expect(aTime).toBeGreaterThanOrEqual(bTime);
      }
    });

    it('should sort by username correctly (case-insensitive)', () => {
      const users = [
        { id: '1', username: 'Zebra', email: 'z@test.com', subscription_active: true, created_at: new Date().toISOString() },
        { id: '2', username: 'apple', email: 'a@test.com', subscription_active: true, created_at: new Date().toISOString() },
        { id: '3', username: 'Banana', email: 'b@test.com', subscription_active: true, created_at: new Date().toISOString() }
      ];
      
      // Test ascending
      const sortedAsc = getFilteredUsers(users, '', 'all', 'username', 'asc');
      expect(sortedAsc[0].username.toLowerCase()).toBe('apple');
      expect(sortedAsc[1].username.toLowerCase()).toBe('banana');
      expect(sortedAsc[2].username.toLowerCase()).toBe('zebra');
      
      // Test descending
      const sortedDesc = getFilteredUsers(users, '', 'all', 'username', 'desc');
      expect(sortedDesc[0].username.toLowerCase()).toBe('zebra');
      expect(sortedDesc[1].username.toLowerCase()).toBe('banana');
      expect(sortedDesc[2].username.toLowerCase()).toBe('apple');
    });

    it('should sort by bill_count correctly', () => {
      const users = generateUserList(20);
      
      // Test ascending
      const sortedAsc = getFilteredUsers(users, '', 'all', 'bill_count', 'asc');
      for (let i = 0; i < sortedAsc.length - 1; i++) {
        expect(sortedAsc[i].bill_count || 0).toBeLessThanOrEqual(sortedAsc[i + 1].bill_count || 0);
      }
      
      // Test descending
      const sortedDesc = getFilteredUsers(users, '', 'all', 'bill_count', 'desc');
      for (let i = 0; i < sortedDesc.length - 1; i++) {
        expect(sortedDesc[i].bill_count || 0).toBeGreaterThanOrEqual(sortedDesc[i + 1].bill_count || 0);
      }
    });

    it('should handle null/undefined values in sorting', () => {
      const users = [
        { id: '1', username: 'user1', email: 'u1@test.com', subscription_active: true, subscription_expires_at: null, created_at: new Date().toISOString() },
        { id: '2', username: 'user2', email: 'u2@test.com', subscription_active: true, subscription_expires_at: new Date(Date.now() + 86400000).toISOString(), created_at: new Date().toISOString() },
        { id: '3', username: 'user3', email: 'u3@test.com', subscription_active: true, subscription_expires_at: undefined, created_at: new Date().toISOString() }
      ];
      
      // Should not throw error
      expect(() => {
        getFilteredUsers(users, '', 'all', 'subscription_expires_at', 'asc');
        getFilteredUsers(users, '', 'all', 'subscription_expires_at', 'desc');
      }).not.toThrow();
    });
  });

  /**
   * Combined Property Test: Filter + Search + Sort
   * For any combination of filter, search, and sort, the result should be correct
   */
  describe('Combined: Filter + Search + Sort', () => {
    it('should correctly apply filter, search, and sort together (100 iterations)', () => {
      const STATUS_FILTERS = ['all', 'active', 'trial', 'expired'];
      const SORT_FIELDS = ['created_at', 'subscription_expires_at', 'username', 'bill_count'];
      const SORT_ORDERS = ['asc', 'desc'];

      for (let i = 0; i < 100; i++) {
        const users = generateUserList(Math.floor(Math.random() * 50) + 10);
        const randomFilter = STATUS_FILTERS[Math.floor(Math.random() * STATUS_FILTERS.length)];
        const randomSortBy = SORT_FIELDS[Math.floor(Math.random() * SORT_FIELDS.length)];
        const randomSortOrder = SORT_ORDERS[Math.floor(Math.random() * SORT_ORDERS.length)];
        
        // Use a common search term that might match some users
        const searchQuery = Math.random() > 0.5 ? 'user' : '';
        
        const result = getFilteredUsers(users, searchQuery, randomFilter, randomSortBy, randomSortOrder);
        
        // Result count should be <= total
        expect(result.length).toBeLessThanOrEqual(users.length);
        
        // All results should match filter and search criteria
        result.forEach(user => {
          // Check search
          if (searchQuery) {
            const matchesUsername = user.username.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesEmail = user.email.toLowerCase().includes(searchQuery.toLowerCase());
            expect(matchesUsername || matchesEmail).toBe(true);
          }
          
          // Check filter
          if (randomFilter === 'active') {
            expect(user.subscription_active).toBe(true);
          } else if (randomFilter === 'trial') {
            expect(user.subscription_active).toBe(false);
          } else if (randomFilter === 'expired') {
            expect(user.subscription_expires_at).toBeTruthy();
            expect(new Date(user.subscription_expires_at).getTime()).toBeLessThan(Date.now());
          }
        });
        
        // Check sorting (if more than 1 result)
        if (result.length > 1) {
          for (let j = 0; j < result.length - 1; j++) {
            let aVal = result[j][randomSortBy];
            let bVal = result[j + 1][randomSortBy];
            
            if (randomSortBy === 'created_at' || randomSortBy === 'subscription_expires_at') {
              aVal = aVal ? new Date(aVal).getTime() : 0;
              bVal = bVal ? new Date(bVal).getTime() : 0;
            } else if (randomSortBy === 'username' || randomSortBy === 'email') {
              aVal = (aVal || '').toLowerCase();
              bVal = (bVal || '').toLowerCase();
            } else if (randomSortBy === 'bill_count') {
              aVal = aVal || 0;
              bVal = bVal || 0;
            }
            
            // Use appropriate comparison based on type
            if (typeof aVal === 'string' && typeof bVal === 'string') {
              if (randomSortOrder === 'asc') {
                expect(aVal <= bVal).toBe(true);
              } else {
                expect(aVal >= bVal).toBe(true);
              }
            } else {
              if (randomSortOrder === 'asc') {
                expect(aVal).toBeLessThanOrEqual(bVal);
              } else {
                expect(aVal).toBeGreaterThanOrEqual(bVal);
              }
            }
          }
        }
      }
    });
  });
});
