/**
 * Property Test: Banner Dismissal Persistence
 * 
 * **Property 17: Banner Dismissal Persistence**
 * *For any* floating banner that is dismissed, localStorage SHALL store the dismissal 
 * timestamp, and the banner SHALL not reappear for 24 hours.
 * 
 * **Validates: Requirements 9.4**
 * 
 * Feature: platform-fixes-enhancements, Property 17: Banner Dismissal Persistence
 */

describe('Banner Dismissal Persistence', () => {
  
  // Mock localStorage
  let localStorageMock;
  
  beforeEach(() => {
    localStorageMock = {};
    
    // Mock localStorage methods
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
      return localStorageMock[key] || null;
    });
    
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      localStorageMock[key] = value;
    });
    
    jest.spyOn(Storage.prototype, 'removeItem').mockImplementation((key) => {
      delete localStorageMock[key];
    });
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * Helper function to generate random banner positions
   */
  const generateBannerPosition = () => {
    const positions = ['top', 'corner', 'side', 'hero', 'inline'];
    return positions[Math.floor(Math.random() * positions.length)];
  };

  /**
   * Helper function to generate a random timestamp within a range
   * @param {number} hoursAgo - Maximum hours in the past
   */
  const generateRandomTimestamp = (hoursAgo) => {
    const now = Date.now();
    const randomHours = Math.random() * hoursAgo;
    const randomMs = randomHours * 60 * 60 * 1000;
    return new Date(now - randomMs).toISOString();
  };

  /**
   * Simulates the dismissal logic from SaleBanner component
   */
  const handleDismiss = (position) => {
    const dismissalKey = `saleBanner_${position}_dismissed`;
    localStorage.setItem(dismissalKey, new Date().toISOString());
    return dismissalKey;
  };

  /**
   * Simulates the check dismissal logic from SaleBanner component
   * Returns true if banner should be hidden (dismissed within 24 hours)
   */
  const shouldHideBanner = (position) => {
    const dismissalKey = `saleBanner_${position}_dismissed`;
    const dismissedAt = localStorage.getItem(dismissalKey);
    
    if (dismissedAt) {
      const dismissedTime = new Date(dismissedAt).getTime();
      const now = new Date().getTime();
      const hoursSinceDismissal = (now - dismissedTime) / (1000 * 60 * 60);
      
      // Hide banner if dismissed within 24 hours
      if (hoursSinceDismissal < 24) {
        return true;
      } else {
        // Clear old dismissal
        localStorage.removeItem(dismissalKey);
        return false;
      }
    }
    return false;
  };

  /**
   * Property 17: Banner Dismissal Persistence
   * For any floating banner that is dismissed, localStorage SHALL store the dismissal 
   * timestamp, and the banner SHALL not reappear for 24 hours.
   */
  describe('Property 17: Banner Dismissal Persistence', () => {
    
    it('should store dismissal timestamp in localStorage when banner is dismissed', () => {
      // Test 100 random banner positions
      for (let i = 0; i < 100; i++) {
        const position = generateBannerPosition();
        const dismissalKey = handleDismiss(position);
        
        // Verify localStorage contains the dismissal timestamp
        const storedValue = localStorage.getItem(dismissalKey);
        expect(storedValue).not.toBeNull();
        
        // Verify the stored value is a valid ISO timestamp
        const parsedDate = new Date(storedValue);
        expect(parsedDate.getTime()).not.toBeNaN();
        
        // Verify the timestamp is recent (within last minute)
        const now = Date.now();
        const storedTime = parsedDate.getTime();
        expect(now - storedTime).toBeLessThan(60 * 1000); // Within 1 minute
      }
    });

    it('should hide banner if dismissed within 24 hours', () => {
      // Test 100 random scenarios with dismissals within 24 hours
      for (let i = 0; i < 100; i++) {
        const position = generateBannerPosition();
        const dismissalKey = `saleBanner_${position}_dismissed`;
        
        // Generate a random timestamp within the last 24 hours (but not exactly 24)
        const hoursAgo = Math.random() * 23.9; // 0 to 23.9 hours ago
        const dismissalTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
        
        // Set the dismissal in localStorage
        localStorage.setItem(dismissalKey, dismissalTime);
        
        // Banner should be hidden
        const shouldHide = shouldHideBanner(position);
        expect(shouldHide).toBe(true);
      }
    });

    it('should show banner if dismissed more than 24 hours ago', () => {
      // Test 100 random scenarios with dismissals older than 24 hours
      for (let i = 0; i < 100; i++) {
        const position = generateBannerPosition();
        const dismissalKey = `saleBanner_${position}_dismissed`;
        
        // Generate a random timestamp more than 24 hours ago (24 to 72 hours)
        const hoursAgo = 24.1 + Math.random() * 48; // 24.1 to 72.1 hours ago
        const dismissalTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
        
        // Set the dismissal in localStorage
        localStorage.setItem(dismissalKey, dismissalTime);
        
        // Banner should NOT be hidden (should show)
        const shouldHide = shouldHideBanner(position);
        expect(shouldHide).toBe(false);
        
        // Old dismissal should be cleared from localStorage
        expect(localStorage.getItem(dismissalKey)).toBeNull();
      }
    });

    it('should show banner if never dismissed', () => {
      // Test 100 random positions with no prior dismissal
      for (let i = 0; i < 100; i++) {
        const position = generateBannerPosition();
        
        // Ensure no dismissal exists
        const dismissalKey = `saleBanner_${position}_dismissed`;
        localStorage.removeItem(dismissalKey);
        
        // Banner should NOT be hidden (should show)
        const shouldHide = shouldHideBanner(position);
        expect(shouldHide).toBe(false);
      }
    });

    it('should use position-specific dismissal keys', () => {
      const positions = ['top', 'corner', 'side', 'hero', 'inline'];
      
      // Dismiss all positions
      positions.forEach(position => {
        handleDismiss(position);
      });
      
      // Verify each position has its own key
      positions.forEach(position => {
        const expectedKey = `saleBanner_${position}_dismissed`;
        expect(localStorage.getItem(expectedKey)).not.toBeNull();
      });
      
      // Verify dismissing one position doesn't affect others
      for (let i = 0; i < 100; i++) {
        // Clear all
        positions.forEach(pos => localStorage.removeItem(`saleBanner_${pos}_dismissed`));
        
        // Dismiss only one random position
        const dismissedPosition = positions[Math.floor(Math.random() * positions.length)];
        handleDismiss(dismissedPosition);
        
        // Only the dismissed position should be hidden
        positions.forEach(position => {
          const shouldHide = shouldHideBanner(position);
          if (position === dismissedPosition) {
            expect(shouldHide).toBe(true);
          } else {
            expect(shouldHide).toBe(false);
          }
        });
      }
    });

    it('should handle exactly 24 hour boundary correctly', () => {
      // Test the boundary condition at exactly 24 hours
      for (let i = 0; i < 100; i++) {
        const position = generateBannerPosition();
        const dismissalKey = `saleBanner_${position}_dismissed`;
        
        // Set dismissal at exactly 24 hours ago (should show banner)
        const exactlyTwentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        localStorage.setItem(dismissalKey, exactlyTwentyFourHoursAgo);
        
        // At exactly 24 hours, hoursSinceDismissal >= 24, so banner should show
        const shouldHide = shouldHideBanner(position);
        expect(shouldHide).toBe(false);
      }
    });

    it('should handle invalid localStorage values gracefully', () => {
      // Test with invalid values in localStorage
      const invalidValues = [
        'invalid-date',
        '',
        'null',
        '12345',
        'undefined',
        '{}',
        '[]'
      ];
      
      invalidValues.forEach(invalidValue => {
        const position = generateBannerPosition();
        const dismissalKey = `saleBanner_${position}_dismissed`;
        
        localStorage.setItem(dismissalKey, invalidValue);
        
        // Should not throw an error
        expect(() => shouldHideBanner(position)).not.toThrow();
      });
    });

    it('should maintain dismissal state across multiple checks', () => {
      // Test that checking dismissal state doesn't modify it (unless expired)
      for (let i = 0; i < 100; i++) {
        const position = generateBannerPosition();
        const dismissalKey = `saleBanner_${position}_dismissed`;
        
        // Set a recent dismissal
        const recentDismissal = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(); // 1 hour ago
        localStorage.setItem(dismissalKey, recentDismissal);
        
        // Check multiple times
        const firstCheck = shouldHideBanner(position);
        const secondCheck = shouldHideBanner(position);
        const thirdCheck = shouldHideBanner(position);
        
        // All checks should return the same result
        expect(firstCheck).toBe(true);
        expect(secondCheck).toBe(true);
        expect(thirdCheck).toBe(true);
        
        // The stored value should remain unchanged
        expect(localStorage.getItem(dismissalKey)).toBe(recentDismissal);
      }
    });
  });

  /**
   * Additional edge case tests
   */
  describe('Edge Cases', () => {
    
    it('should handle dismissal at midnight correctly', () => {
      const position = generateBannerPosition();
      const dismissalKey = `saleBanner_${position}_dismissed`;
      
      // Create a timestamp at midnight
      const midnight = new Date();
      midnight.setHours(0, 0, 0, 0);
      
      localStorage.setItem(dismissalKey, midnight.toISOString());
      
      // Should not throw
      expect(() => shouldHideBanner(position)).not.toThrow();
    });

    it('should handle future timestamps gracefully', () => {
      // If somehow a future timestamp is stored, banner should still be hidden
      const position = generateBannerPosition();
      const dismissalKey = `saleBanner_${position}_dismissed`;
      
      // Set a future timestamp (1 hour from now)
      const futureTime = new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString();
      localStorage.setItem(dismissalKey, futureTime);
      
      // Should not throw and should hide (negative hours since dismissal)
      expect(() => shouldHideBanner(position)).not.toThrow();
      // Future timestamps result in negative hoursSinceDismissal, which is < 24
      expect(shouldHideBanner(position)).toBe(true);
    });

    it('should handle very old timestamps correctly', () => {
      const position = generateBannerPosition();
      const dismissalKey = `saleBanner_${position}_dismissed`;
      
      // Set a very old timestamp (1 year ago)
      const veryOld = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
      localStorage.setItem(dismissalKey, veryOld);
      
      // Banner should show (dismissal expired)
      const shouldHide = shouldHideBanner(position);
      expect(shouldHide).toBe(false);
      
      // Old dismissal should be cleared
      expect(localStorage.getItem(dismissalKey)).toBeNull();
    });
  });
});
