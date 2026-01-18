/**
 * Test setup for QR Order Workflow Fix
 * 
 * This file configures the testing environment for property-based testing
 * using fast-check library as specified in the design document.
 */

import * as fc from 'fast-check';

// ============================================================================
// Test Configuration
// ============================================================================

/**
 * Default configuration for property-based tests
 * Minimum 100 iterations as specified in the design document
 */
export const DEFAULT_PBT_CONFIG: fc.Parameters<unknown> = {
  numRuns: 100,
  verbose: true,
  seed: 42, // Fixed seed for reproducible tests
  endOnFailure: true,
};

/**
 * Extended configuration for comprehensive property tests
 */
export const COMPREHENSIVE_PBT_CONFIG: fc.Parameters<unknown> = {
  numRuns: 1000,
  verbose: true,
  endOnFailure: true,
};

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Helper function to run property tests with consistent configuration
 */
export function runPropertyTest<T>(
  property: fc.property<T>,
  config: fc.Parameters<unknown> = DEFAULT_PBT_CONFIG
): void {
  fc.assert(property, config);
}

/**
 * Helper function to create a test suite for a specific feature
 */
export function createPropertyTestSuite(
  suiteName: string,
  tests: Array<{ name: string; property: fc.property<unknown> }>
): void {
  describe(`Property Tests: ${suiteName}`, () => {
    tests.forEach(({ name, property }) => {
      test(name, () => {
        runPropertyTest(property);
      });
    });
  });
}

// ============================================================================
// Mock Data Helpers
// ============================================================================

/**
 * Helper to create consistent test data
 */
export const TestHelpers = {
  /**
   * Generate a random timestamp within the last 24 hours
   */
  recentTimestamp: (): Date => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return new Date(oneDayAgo.getTime() + Math.random() * (now.getTime() - oneDayAgo.getTime()));
  },

  /**
   * Generate a random table number
   */
  tableNumber: (): string => {
    return `T${Math.floor(Math.random() * 50) + 1}`;
  },

  /**
   * Generate a random order ID
   */
  orderId: (): string => {
    return `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  },
};

// ============================================================================
// Test Environment Setup
// ============================================================================

/**
 * Setup function to be called before running tests
 */
export function setupTestEnvironment(): void {
  // Configure Jest timeout for property-based tests
  jest.setTimeout(30000); // 30 seconds for comprehensive tests

  // Setup global test utilities
  (global as any).fc = fc;
  (global as any).runPropertyTest = runPropertyTest;
  (global as any).createPropertyTestSuite = createPropertyTestSuite;
}

// ============================================================================
// Type Declarations for Global Test Utilities
// ============================================================================

declare global {
  var fc: typeof import('fast-check');
  var runPropertyTest: <T>(property: fc.property<T>, config?: fc.Parameters<unknown>) => void;
  var createPropertyTestSuite: (suiteName: string, tests: Array<{ name: string; property: fc.property<unknown> }>) => void;
}