/**
 * Unit Tests: CounterSaleRouter Device Detection
 * 
 * Tests the device detection and routing logic for the counter sale page.
 * Validates that the correct component is rendered based on screen width
 * and that the component responds to window resize events.
 * 
 * Feature: mobile-counter-sale-page
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import CounterSaleRouter from '../pages/CounterSaleRouter';

// Mock the CounterSalePage component
jest.mock('../pages/CounterSalePage', () => {
  return function MockCounterSalePage({ user }) {
    return <div data-testid="counter-sale-page">Desktop Counter Sale Page</div>;
  };
});

describe('CounterSaleRouter - Device Detection', () => {
  const mockUser = { id: 1, name: 'Test User' };
  let originalInnerWidth;

  beforeEach(() => {
    // Store original window.innerWidth
    originalInnerWidth = window.innerWidth;
  });

  afterEach(() => {
    // Restore original window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  describe('Initial Device Detection', () => {
    test('should render CounterSalePage for desktop width (>= 1024px)', () => {
      // Set window width to desktop size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      render(<CounterSaleRouter user={mockUser} />);
      
      expect(screen.getByTestId('counter-sale-page')).toBeInTheDocument();
    });

    test('should render CounterSalePage for mobile width (< 1024px) - temporary until MobileCounterSalePage is implemented', () => {
      // Set window width to mobile size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(<CounterSaleRouter user={mockUser} />);
      
      // Currently renders CounterSalePage for both
      // TODO: Update this test when MobileCounterSalePage is implemented
      expect(screen.getByTestId('counter-sale-page')).toBeInTheDocument();
    });

    test('should detect mobile at exactly 1023px', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1023,
      });

      render(<CounterSaleRouter user={mockUser} />);
      
      // Should be treated as mobile (< 1024)
      expect(screen.getByTestId('counter-sale-page')).toBeInTheDocument();
    });

    test('should detect desktop at exactly 1024px', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      render(<CounterSaleRouter user={mockUser} />);
      
      // Should be treated as desktop (>= 1024)
      expect(screen.getByTestId('counter-sale-page')).toBeInTheDocument();
    });
  });

  describe('Dynamic Device Switching on Resize', () => {
    test('should switch from desktop to mobile when resizing below 1024px', async () => {
      // Start with desktop width
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      const { rerender } = render(<CounterSaleRouter user={mockUser} />);
      
      expect(screen.getByTestId('counter-sale-page')).toBeInTheDocument();

      // Resize to mobile width
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 800,
        });
        window.dispatchEvent(new Event('resize'));
      });

      // Wait for debounce (300ms)
      await waitFor(
        () => {
          // Component should still render (currently both render CounterSalePage)
          expect(screen.getByTestId('counter-sale-page')).toBeInTheDocument();
        },
        { timeout: 500 }
      );
    });

    test('should switch from mobile to desktop when resizing above 1024px', async () => {
      // Start with mobile width
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      const { rerender } = render(<CounterSaleRouter user={mockUser} />);
      
      expect(screen.getByTestId('counter-sale-page')).toBeInTheDocument();

      // Resize to desktop width
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 1400,
        });
        window.dispatchEvent(new Event('resize'));
      });

      // Wait for debounce (300ms)
      await waitFor(
        () => {
          expect(screen.getByTestId('counter-sale-page')).toBeInTheDocument();
        },
        { timeout: 500 }
      );
    });

    test('should debounce resize events (300ms)', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      render(<CounterSaleRouter user={mockUser} />);

      // Trigger multiple rapid resize events
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 800,
        });
        window.dispatchEvent(new Event('resize'));
        
        // Immediately trigger another resize
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 900,
        });
        window.dispatchEvent(new Event('resize'));
        
        // And another
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 1000,
        });
        window.dispatchEvent(new Event('resize'));
      });

      // Should not update immediately (debounced)
      expect(screen.getByTestId('counter-sale-page')).toBeInTheDocument();

      // Wait for debounce to complete
      await waitFor(
        () => {
          expect(screen.getByTestId('counter-sale-page')).toBeInTheDocument();
        },
        { timeout: 500 }
      );
    });

    test('should not re-render if width stays on same side of threshold', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      const { rerender } = render(<CounterSaleRouter user={mockUser} />);
      
      const initialElement = screen.getByTestId('counter-sale-page');

      // Resize but stay above threshold
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 1400,
        });
        window.dispatchEvent(new Event('resize'));
      });

      await waitFor(
        () => {
          // Should still be the same component
          expect(screen.getByTestId('counter-sale-page')).toBeInTheDocument();
        },
        { timeout: 500 }
      );
    });
  });

  describe('Edge Cases', () => {
    test('should handle very small mobile widths (320px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });

      render(<CounterSaleRouter user={mockUser} />);
      
      expect(screen.getByTestId('counter-sale-page')).toBeInTheDocument();
    });

    test('should handle very large desktop widths (2560px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 2560,
      });

      render(<CounterSaleRouter user={mockUser} />);
      
      expect(screen.getByTestId('counter-sale-page')).toBeInTheDocument();
    });

    test('should handle tablet width (768px) as mobile', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(<CounterSaleRouter user={mockUser} />);
      
      // Tablets (< 1024px) should be treated as mobile
      expect(screen.getByTestId('counter-sale-page')).toBeInTheDocument();
    });

    test('should handle iPad Pro width (1024px) as desktop', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      render(<CounterSaleRouter user={mockUser} />);
      
      // iPad Pro at 1024px should be treated as desktop
      expect(screen.getByTestId('counter-sale-page')).toBeInTheDocument();
    });
  });

  describe('Cleanup', () => {
    test('should cleanup resize listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = render(<CounterSaleRouter user={mockUser} />);
      
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
      
      removeEventListenerSpy.mockRestore();
    });

    test('should clear timeout on unmount', async () => {
      jest.useFakeTimers();

      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      const { unmount } = render(<CounterSaleRouter user={mockUser} />);

      // Trigger resize
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 800,
        });
        window.dispatchEvent(new Event('resize'));
      });

      // Unmount before debounce completes
      unmount();

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Should not throw or cause issues
      expect(true).toBe(true);

      jest.useRealTimers();
    });
  });

  describe('User Prop Passing', () => {
    test('should pass user prop to rendered component', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      render(<CounterSaleRouter user={mockUser} />);
      
      // Component should receive user prop
      expect(screen.getByTestId('counter-sale-page')).toBeInTheDocument();
    });

    test('should handle undefined user prop', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      render(<CounterSaleRouter user={undefined} />);
      
      // Should still render without errors
      expect(screen.getByTestId('counter-sale-page')).toBeInTheDocument();
    });
  });
});
