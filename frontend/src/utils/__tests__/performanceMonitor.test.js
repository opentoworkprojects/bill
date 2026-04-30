/**
 * Performance Monitor Test Suite
 * Comprehensive tests for performance monitoring infrastructure
 * Requirements: 11.1, 11.2, 11.3, 11.4
 */

import { performanceMonitor } from '../performanceMonitor';
import { performanceAlerting } from '../performanceAlerting';
import { performanceReporting } from '../performanceReporting';

// Mock performance API
global.performance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(() => [])
};

// Mock PerformanceObserver
global.PerformanceObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  disconnect: jest.fn()
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
};
global.localStorage = localStorageMock;

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    performanceMonitor.clearStats();
    performance.now.mockReturnValue(1000);
  });

  describe('Basic Timing Operations', () => {
    test('should start and end timing correctly', () => {
      const operationId = 'test_operation';
      const operationType = 'ui_click';
      
      performanceMonitor.startTiming(operationId, operationType);
      
      // Simulate 50ms delay
      performance.now.mockReturnValue(1050);
      
      const result = performanceMonitor.endTiming(operationId, operationType);
      
      expect(result).toBeDefined();
      expect(result.duration).toBe(50);
      expect(result.operationType).toBe(operationType);
      expect(result.withinThreshold).toBe(false); // 50ms > 50ms threshold for ui_click
    });

    test('should handle missing start timing gracefully', () => {
      const result = performanceMonitor.endTiming('nonexistent', 'ui_click');
      expect(result).toBeNull();
    });

    test('should track multiple concurrent operations', () => {
      performanceMonitor.startTiming('op1', 'ui_click');
      performanceMonitor.startTiming('op2', 'api_response');
      
      performance.now.mockReturnValue(1030);
      const result1 = performanceMonitor.endTiming('op1', 'ui_click');
      
      performance.now.mockReturnValue(1100);
      const result2 = performanceMonitor.endTiming('op2', 'api_response');
      
      expect(result1.duration).toBe(30);
      expect(result2.duration).toBe(100);
    });
  });

  describe('Threshold Monitoring', () => {
    test('should correctly identify threshold violations', () => {
      const operationId = 'slow_operation';
      
      performanceMonitor.startTiming(operationId, 'ui_click');
      performance.now.mockReturnValue(1100); // 100ms > 50ms threshold
      
      const result = performanceMonitor.endTiming(operationId, 'ui_click');
      
      expect(result.withinThreshold).toBe(false);
      expect(result.threshold).toBe(50);
    });

    test('should handle operations within threshold', () => {
      const operationId = 'fast_operation';
      
      performanceMonitor.startTiming(operationId, 'ui_click');
      performance.now.mockReturnValue(1025); // 25ms < 50ms threshold
      
      const result = performanceMonitor.endTiming(operationId, 'ui_click');
      
      expect(result.withinThreshold).toBe(true);
    });
  });

  describe('Dashboard Data Generation', () => {
    test('should generate comprehensive dashboard data', () => {
      // Add some test metrics
      performanceMonitor.recordMetric('ui_click', 30, { success: true });
      performanceMonitor.recordMetric('ui_click', 70, { success: false });
      performanceMonitor.recordMetric('api_response', 200, { success: true });
      
      const dashboardData = performanceMonitor.getDashboardData();
      
      expect(dashboardData).toHaveProperty('summary');
      expect(dashboardData).toHaveProperty('operationStats');
      expect(dashboardData).toHaveProperty('responseTimeHistory');
      expect(dashboardData.summary).toHaveProperty('overallHealthScore');
    });

    test('should calculate health score correctly', () => {
      // Add metrics with known success rates
      for (let i = 0; i < 10; i++) {
        performanceMonitor.recordMetric('test_operation', 25, { success: true });
      }
      
      const dashboardData = performanceMonitor.getDashboardData();
      expect(dashboardData.summary.overallHealthScore).toBeGreaterThan(90);
    });
  });

  describe('Convenience Methods', () => {
    test('should track UI interactions correctly', () => {
      const tracker = performanceMonitor.trackUIInteraction('click', 'button1', async () => {
        performance.now.mockReturnValue(1030);
        return 'success';
      });
      
      return tracker().then(result => {
        expect(result).toBe('success');
      });
    });

    test('should track API calls correctly', () => {
      const tracker = performanceMonitor.trackAPICall('/api/test', 'GET');
      
      performance.now.mockReturnValue(1200);
      tracker.end(true, { status: 200 });
      
      // Verify the operation was recorded
      const dashboardData = performanceMonitor.getDashboardData();
      expect(dashboardData.operationStats).toHaveProperty('api_response');
    });

    test('should track cache operations correctly', () => {
      const tracker = performanceMonitor.trackCacheOperation('memory', 'get', 'test_key');
      
      performance.now.mockReturnValue(1005);
      tracker.hit({ cacheLevel: 'L1' });
      
      const dashboardData = performanceMonitor.getDashboardData();
      expect(dashboardData.operationStats).toHaveProperty('cache_memory');
    });
  });

  describe('Performance Alerting Integration', () => {
    test('should trigger alerts for threshold violations', () => {
      const alertCallback = jest.fn();
      performanceAlerting.onAlert(alertCallback);
      
      // Create a violation
      performanceMonitor.startTiming('slow_op', 'ui_click');
      performance.now.mockReturnValue(1200); // 200ms > 50ms threshold
      
      performanceMonitor.endTiming('slow_op', 'ui_click');
      
      // Alert should be triggered (though we can't easily test the async nature)
      expect(alertCallback).toHaveBeenCalled();
    });
  });

  describe('Data Persistence', () => {
    test('should persist metrics to localStorage', () => {
      performanceMonitor.recordMetric('test_operation', 100, { test: true });
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'performanceMetrics',
        expect.stringContaining('test_operation')
      );
    });

    test('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });
      
      // Should not throw
      expect(() => {
        performanceMonitor.recordMetric('test_operation', 100);
      }).not.toThrow();
    });
  });

  describe('Web Vitals Monitoring', () => {
    test('should initialize Web Vitals observers', () => {
      // Web Vitals initialization happens in constructor
      expect(global.PerformanceObserver).toHaveBeenCalled();
    });

    test('should record Web Vitals metrics', () => {
      performanceMonitor.recordMetric('web_vital_lcp', 1500, { element: 'IMG' });
      
      const dashboardData = performanceMonitor.getDashboardData();
      expect(dashboardData.webVitals).toHaveProperty('web_vital_lcp');
    });
  });
});

describe('PerformanceAlerting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    performanceAlerting.clearAlertHistory();
  });

  describe('Alert Rule Management', () => {
    test('should add custom alert rules', () => {
      performanceAlerting.addAlertRule('custom_operation', {
        threshold: 100,
        severity: 'high',
        message: 'Custom operation too slow'
      });
      
      const rules = performanceAlerting.getAlertRules();
      expect(rules).toHaveProperty('custom_operation');
      expect(rules.custom_operation.threshold).toBe(100);
    });

    test('should update existing alert rules', () => {
      performanceAlerting.updateAlertRule('ui_click', { threshold: 75 });
      
      const rules = performanceAlerting.getAlertRules();
      expect(rules.ui_click.threshold).toBe(75);
    });
  });

  describe('Violation Processing', () => {
    test('should process violations correctly', () => {
      const violation = {
        operationType: 'ui_click',
        operationId: 'test_click',
        duration: 100,
        threshold: 50,
        withinThreshold: false
      };
      
      const alertTriggered = performanceAlerting.processViolation(violation);
      expect(alertTriggered).toBe(true);
    });

    test('should respect suppression windows', () => {
      const violation = {
        operationType: 'ui_click',
        operationId: 'test_click_1',
        duration: 100,
        threshold: 50,
        withinThreshold: false
      };
      
      // First violation should trigger alert
      const firstAlert = performanceAlerting.processViolation(violation);
      expect(firstAlert).toBe(true);
      
      // Second violation within suppression window should not trigger
      const secondViolation = { ...violation, operationId: 'test_click_2' };
      const secondAlert = performanceAlerting.processViolation(secondViolation);
      expect(secondAlert).toBe(false);
    });
  });

  describe('Alert Statistics', () => {
    test('should generate alert statistics', () => {
      // Create some test alerts
      const violation = {
        operationType: 'ui_click',
        operationId: 'test_click',
        duration: 100,
        threshold: 50,
        withinThreshold: false
      };
      
      performanceAlerting.processViolation(violation);
      
      const stats = performanceAlerting.getAlertStats();
      expect(stats.total).toBeGreaterThan(0);
      expect(stats).toHaveProperty('bySeverity');
      expect(stats).toHaveProperty('byOperation');
    });
  });
});

describe('PerformanceReporting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Report Generation', () => {
    test('should generate executive report', () => {
      const report = performanceReporting.generateReport('executive', '1h');
      
      expect(report).toHaveProperty('id');
      expect(report).toHaveProperty('template', 'executive');
      expect(report).toHaveProperty('sections');
      expect(report.sections).toHaveProperty('summary');
    });

    test('should generate technical report', () => {
      const report = performanceReporting.generateReport('technical', '24h');
      
      expect(report.template).toBe('technical');
      expect(report.sections).toHaveProperty('detailed_metrics');
    });

    test('should handle invalid template names', () => {
      expect(() => {
        performanceReporting.generateReport('invalid_template');
      }).toThrow('Unknown report template: invalid_template');
    });
  });

  describe('Report Export', () => {
    test('should export report as JSON', () => {
      const report = performanceReporting.generateReport('executive', '1h');
      const exported = performanceReporting.exportReport(report, 'json');
      
      expect(typeof exported).toBe('string');
      expect(() => JSON.parse(exported)).not.toThrow();
    });

    test('should export report as CSV', () => {
      const report = performanceReporting.generateReport('executive', '1h');
      const exported = performanceReporting.exportReport(report, 'csv');
      
      expect(typeof exported).toBe('string');
      expect(exported).toContain('Metric,Value');
    });

    test('should export report as HTML', () => {
      const report = performanceReporting.generateReport('executive', '1h');
      const exported = performanceReporting.exportReport(report, 'html');
      
      expect(typeof exported).toBe('string');
      expect(exported).toContain('<html>');
    });
  });

  describe('Report Templates', () => {
    test('should return available templates', () => {
      const templates = performanceReporting.getReportTemplates();
      
      expect(templates).toHaveProperty('executive');
      expect(templates).toHaveProperty('technical');
      expect(templates).toHaveProperty('operations');
      expect(templates).toHaveProperty('ux');
    });
  });
});

describe('Integration Tests', () => {
  test('should work end-to-end for UI interaction tracking', async () => {
    const alertCallback = jest.fn();
    performanceAlerting.onAlert(alertCallback);
    
    // Simulate a slow UI interaction
    performanceMonitor.startTiming('slow_button_click', 'ui_click');
    performance.now.mockReturnValue(1200); // 200ms > 50ms threshold
    
    const result = performanceMonitor.endTiming('slow_button_click', 'ui_click');
    
    // Verify timing result
    expect(result.duration).toBe(200);
    expect(result.withinThreshold).toBe(false);
    
    // Verify alert was triggered
    expect(alertCallback).toHaveBeenCalled();
    
    // Generate report and verify it includes the data
    const report = performanceReporting.generateReport('executive', '1h');
    expect(report.sections.summary.keyFindings.length).toBeGreaterThan(0);
  });

  test('should handle multiple operation types correctly', () => {
    // Track various operations
    const operations = [
      { id: 'ui_op', type: 'ui_click', duration: 30 },
      { id: 'api_op', type: 'api_response', duration: 300 },
      { id: 'cache_op', type: 'cache_memory', duration: 5 },
      { id: 'menu_op', type: 'menu_load', duration: 400 }
    ];
    
    operations.forEach(op => {
      performanceMonitor.startTiming(op.id, op.type);
      performance.now.mockReturnValue(1000 + op.duration);
      performanceMonitor.endTiming(op.id, op.type);
    });
    
    const dashboardData = performanceMonitor.getDashboardData();
    
    // Verify all operation types are tracked
    expect(Object.keys(dashboardData.operationStats)).toContain('ui_click');
    expect(Object.keys(dashboardData.operationStats)).toContain('api_response');
    expect(Object.keys(dashboardData.operationStats)).toContain('cache_memory');
    expect(Object.keys(dashboardData.operationStats)).toContain('menu_load');
  });
});