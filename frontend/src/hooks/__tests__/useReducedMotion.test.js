/**
 * useReducedMotion Hook Test Suite
 * Tests for detecting and responding to user's motion preferences
 * Requirements: 4.1
 */

import { renderHook, act } from '@testing-library/react';
import { useReducedMotion } from '../useReducedMotion';

describe('useReducedMotion Hook', () => {
  let mockMatchMedia;
  let mediaQueryListeners;
  let originalMatchMedia;

  beforeEach(() => {
    // Save original matchMedia
    originalMatchMedia = window.matchMedia;
    
    // Reset listeners before each test
    mediaQueryListeners = [];

    // Mock matchMedia
    mockMatchMedia = jest.fn((query) => {
      const listeners = [];
      mediaQueryListeners.push(listeners);

      return {
        matches: false,
        media: query,
        onchange: null,
        addEventListener: jest.fn((event, handler) => {
          if (event === 'change') {
            listeners.push(handler);
          }
        }),
        removeEventListener: jest.fn((event, handler) => {
          if (event === 'change') {
            const index = listeners.indexOf(handler);
            if (index > -1) {
              listeners.splice(index, 1);
            }
          }
        }),
        addListener: jest.fn((handler) => {
          listeners.push(handler);
        }),
        removeListener: jest.fn((handler) => {
          const index = listeners.indexOf(handler);
          if (index > -1) {
            listeners.splice(index, 1);
          }
        }),
        dispatchEvent: jest.fn(),
      };
    });

    window.matchMedia = mockMatchMedia;
  });

  afterEach(() => {
    // Restore original matchMedia
    window.matchMedia = originalMatchMedia;
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    test('should return false when prefers-reduced-motion is not set', () => {
      const { result } = renderHook(() => useReducedMotion());
      expect(result.current).toBe(false);
    });

    test('should return true when prefers-reduced-motion is set', () => {
      mockMatchMedia.mockImplementation((query) => {
        const listeners = [];
        mediaQueryListeners.push(listeners);

        return {
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          addEventListener: jest.fn((event, handler) => {
            if (event === 'change') {
              listeners.push(handler);
            }
          }),
          removeEventListener: jest.fn((event, handler) => {
            if (event === 'change') {
              const index = listeners.indexOf(handler);
              if (index > -1) {
                listeners.splice(index, 1);
              }
            }
          }),
          addListener: jest.fn(),
          removeListener: jest.fn(),
        };
      });

      const { result } = renderHook(() => useReducedMotion());
      expect(result.current).toBe(true);
    });

    test('should query the correct media query', () => {
      renderHook(() => useReducedMotion());
      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    });
  });

  describe('Media Query Changes', () => {
    test('should update when media query changes to true', () => {
      const { result } = renderHook(() => useReducedMotion());
      
      expect(result.current).toBe(false);

      // Simulate media query change
      act(() => {
        const listeners = mediaQueryListeners[0];
        listeners.forEach(listener => listener({ matches: true }));
      });

      expect(result.current).toBe(true);
    });

    test('should update when media query changes to false', () => {
      mockMatchMedia.mockImplementation((query) => {
        const listeners = [];
        mediaQueryListeners.push(listeners);

        return {
          matches: true,
          media: query,
          addEventListener: jest.fn((event, handler) => {
            if (event === 'change') {
              listeners.push(handler);
            }
          }),
          removeEventListener: jest.fn((event, handler) => {
            if (event === 'change') {
              const index = listeners.indexOf(handler);
              if (index > -1) {
                listeners.splice(index, 1);
              }
            }
          }),
          addListener: jest.fn(),
          removeListener: jest.fn(),
        };
      });

      const { result } = renderHook(() => useReducedMotion());
      
      expect(result.current).toBe(true);

      // Simulate media query change
      act(() => {
        const listeners = mediaQueryListeners[0];
        listeners.forEach(listener => listener({ matches: false }));
      });

      expect(result.current).toBe(false);
    });

    test('should handle multiple media query changes', () => {
      const { result } = renderHook(() => useReducedMotion());
      
      expect(result.current).toBe(false);

      // Change to true
      act(() => {
        const listeners = mediaQueryListeners[0];
        listeners.forEach(listener => listener({ matches: true }));
      });
      expect(result.current).toBe(true);

      // Change to false
      act(() => {
        const listeners = mediaQueryListeners[0];
        listeners.forEach(listener => listener({ matches: false }));
      });
      expect(result.current).toBe(false);

      // Change to true again
      act(() => {
        const listeners = mediaQueryListeners[0];
        listeners.forEach(listener => listener({ matches: true }));
      });
      expect(result.current).toBe(true);
    });
  });

  describe('Event Listener Management', () => {
    test('should add event listener on mount', () => {
      const mediaQueryList = window.matchMedia('(prefers-reduced-motion: reduce)');
      renderHook(() => useReducedMotion());

      expect(mediaQueryList.addEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    });

    test('should remove event listener on unmount', () => {
      const mediaQueryList = window.matchMedia('(prefers-reduced-motion: reduce)');
      const { unmount } = renderHook(() => useReducedMotion());

      unmount();

      expect(mediaQueryList.removeEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    });

    test('should use addListener fallback for older browsers', () => {
      mockMatchMedia.mockImplementation((query) => {
        const listeners = [];
        mediaQueryListeners.push(listeners);

        return {
          matches: false,
          media: query,
          addEventListener: undefined, // Simulate older browser
          removeEventListener: undefined,
          addListener: jest.fn((handler) => {
            listeners.push(handler);
          }),
          removeListener: jest.fn((handler) => {
            const index = listeners.indexOf(handler);
            if (index > -1) {
              listeners.splice(index, 1);
            }
          }),
        };
      });

      const mediaQueryList = window.matchMedia('(prefers-reduced-motion: reduce)');
      renderHook(() => useReducedMotion());

      expect(mediaQueryList.addListener).toHaveBeenCalledWith(expect.any(Function));
    });

    test('should use removeListener fallback on unmount for older browsers', () => {
      mockMatchMedia.mockImplementation((query) => {
        const listeners = [];
        mediaQueryListeners.push(listeners);

        return {
          matches: false,
          media: query,
          addEventListener: undefined,
          removeEventListener: undefined,
          addListener: jest.fn((handler) => {
            listeners.push(handler);
          }),
          removeListener: jest.fn((handler) => {
            const index = listeners.indexOf(handler);
            if (index > -1) {
              listeners.splice(index, 1);
            }
          }),
        };
      });

      const mediaQueryList = window.matchMedia('(prefers-reduced-motion: reduce)');
      const { unmount } = renderHook(() => useReducedMotion());

      unmount();

      expect(mediaQueryList.removeListener).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('Requirement 4.1 Validation', () => {
    test('should detect prefers-reduced-motion setting (Requirement 4.1)', () => {
      mockMatchMedia.mockImplementation((query) => {
        const listeners = [];
        mediaQueryListeners.push(listeners);

        return {
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          addEventListener: jest.fn((event, handler) => {
            if (event === 'change') {
              listeners.push(handler);
            }
          }),
          removeEventListener: jest.fn(),
          addListener: jest.fn(),
          removeListener: jest.fn(),
        };
      });

      const { result } = renderHook(() => useReducedMotion());
      
      // Should return true when user has enabled prefers-reduced-motion
      expect(result.current).toBe(true);
    });

    test('should respond to changes in motion preference (Requirement 4.1)', () => {
      const { result } = renderHook(() => useReducedMotion());
      
      // Initially false
      expect(result.current).toBe(false);

      // User enables reduced motion
      act(() => {
        const listeners = mediaQueryListeners[0];
        listeners.forEach(listener => listener({ matches: true }));
      });

      // Should update to true
      expect(result.current).toBe(true);

      // User disables reduced motion
      act(() => {
        const listeners = mediaQueryListeners[0];
        listeners.forEach(listener => listener({ matches: false }));
      });

      // Should update to false
      expect(result.current).toBe(false);
    });
  });

  describe('Integration Scenarios', () => {
    test('should work with animation components', () => {
      const { result } = renderHook(() => useReducedMotion());
      
      // Simulate animation component checking the preference
      const shouldAnimate = !result.current;
      expect(shouldAnimate).toBe(true);

      // User enables reduced motion
      act(() => {
        const listeners = mediaQueryListeners[0];
        listeners.forEach(listener => listener({ matches: true }));
      });

      // Animation should be disabled
      const shouldAnimateAfter = !result.current;
      expect(shouldAnimateAfter).toBe(false);
    });

    test('should provide consistent value across re-renders', () => {
      const { result, rerender } = renderHook(() => useReducedMotion());
      
      const initialValue = result.current;
      
      // Re-render multiple times
      rerender();
      rerender();
      rerender();

      // Value should remain consistent
      expect(result.current).toBe(initialValue);
    });
  });
});
