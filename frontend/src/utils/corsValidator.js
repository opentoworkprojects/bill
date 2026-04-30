/**
 * CORS Validation Utility
 * Tests and validates CORS configuration for payment endpoints
 */

class CorsValidator {
  constructor() {
    this.testEndpoints = [
      '/api/orders',
      '/api/auth/login',
      '/api/business-settings',
      '/api/menu-items'
    ];
    this.requiredHeaders = [
      'Content-Type',
      'Authorization',
      'X-Requested-With'
    ];
    this.requiredMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
  }

  /**
   * Test CORS configuration for a specific endpoint
   * @param {string} endpoint - API endpoint to test
   * @param {string} baseUrl - Base API URL
   * @returns {Promise<Object>} - Test results
   */
  async testEndpointCors(endpoint, baseUrl) {
    const fullUrl = `${baseUrl}${endpoint}`;
    const results = {
      endpoint,
      url: fullUrl,
      preflightSupported: false,
      allowedMethods: [],
      allowedHeaders: [],
      allowCredentials: false,
      maxAge: null,
      errors: [],
      warnings: []
    };

    try {
      // Test preflight request (OPTIONS)
      const preflightResponse = await fetch(fullUrl, {
        method: 'OPTIONS',
        headers: {
          'Origin': window.location.origin,
          'Access-Control-Request-Method': 'PUT',
          'Access-Control-Request-Headers': 'Content-Type, Authorization'
        }
      });

      results.preflightSupported = preflightResponse.ok;

      if (preflightResponse.ok) {
        // Parse CORS headers
        const allowMethods = preflightResponse.headers.get('Access-Control-Allow-Methods');
        const allowHeaders = preflightResponse.headers.get('Access-Control-Allow-Headers');
        const allowCredentials = preflightResponse.headers.get('Access-Control-Allow-Credentials');
        const maxAge = preflightResponse.headers.get('Access-Control-Max-Age');
        const allowOrigin = preflightResponse.headers.get('Access-Control-Allow-Origin');

        results.allowedMethods = allowMethods ? allowMethods.split(',').map(m => m.trim()) : [];
        results.allowedHeaders = allowHeaders ? allowHeaders.split(',').map(h => h.trim()) : [];
        results.allowCredentials = allowCredentials === 'true';
        results.maxAge = maxAge ? parseInt(maxAge) : null;
        results.allowOrigin = allowOrigin;

        // Validate required methods
        const missingMethods = this.requiredMethods.filter(method => 
          !results.allowedMethods.includes(method)
        );
        if (missingMethods.length > 0) {
          results.warnings.push(`Missing required methods: ${missingMethods.join(', ')}`);
        }

        // Validate required headers
        const missingHeaders = this.requiredHeaders.filter(header => 
          !results.allowedHeaders.some(allowed => 
            allowed.toLowerCase() === header.toLowerCase()
          )
        );
        if (missingHeaders.length > 0) {
          results.warnings.push(`Missing required headers: ${missingHeaders.join(', ')}`);
        }

        // Check origin configuration
        if (!allowOrigin) {
          results.errors.push('Access-Control-Allow-Origin header missing');
        } else if (allowOrigin !== '*' && allowOrigin !== window.location.origin) {
          results.warnings.push(`Origin mismatch: expected ${window.location.origin}, got ${allowOrigin}`);
        }

      } else {
        results.errors.push(`Preflight request failed: ${preflightResponse.status} ${preflightResponse.statusText}`);
      }

    } catch (error) {
      results.errors.push(`CORS test failed: ${error.message}`);
    }

    return results;
  }

  /**
   * Test actual request to see if CORS works in practice
   * @param {string} endpoint - API endpoint to test
   * @param {string} baseUrl - Base API URL
   * @returns {Promise<Object>} - Test results
   */
  async testActualRequest(endpoint, baseUrl) {
    const fullUrl = `${baseUrl}${endpoint}`;
    const results = {
      endpoint,
      url: fullUrl,
      requestSuccessful: false,
      corsError: false,
      responseHeaders: {},
      error: null
    };

    try {
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'test-token'}`
        },
        credentials: 'include'
      });

      results.requestSuccessful = response.ok || response.status === 401; // 401 is OK for auth test
      
      // Capture response headers
      response.headers.forEach((value, key) => {
        if (key.toLowerCase().startsWith('access-control-')) {
          results.responseHeaders[key] = value;
        }
      });

    } catch (error) {
      results.error = error.message;
      
      // Check if it's a CORS error
      if (error.message.includes('CORS') || 
          error.message.includes('Cross-Origin') ||
          error.message.includes('Access-Control-Allow-Origin')) {
        results.corsError = true;
      }
    }

    return results;
  }

  /**
   * Run comprehensive CORS validation
   * @param {string} baseUrl - Base API URL
   * @returns {Promise<Object>} - Complete validation results
   */
  async validateCorsConfiguration(baseUrl) {
    const results = {
      timestamp: new Date().toISOString(),
      baseUrl,
      origin: window.location.origin,
      userAgent: navigator.userAgent,
      overallStatus: 'unknown',
      endpoints: [],
      summary: {
        totalEndpoints: this.testEndpoints.length,
        passedEndpoints: 0,
        failedEndpoints: 0,
        warningEndpoints: 0
      },
      recommendations: []
    };

    console.log('🔍 Starting CORS validation...');

    // Test each endpoint
    for (const endpoint of this.testEndpoints) {
      console.log(`Testing CORS for ${endpoint}...`);
      
      try {
        const [preflightResults, actualResults] = await Promise.all([
          this.testEndpointCors(endpoint, baseUrl),
          this.testActualRequest(endpoint, baseUrl)
        ]);

        const endpointResult = {
          ...preflightResults,
          actualRequest: actualResults,
          status: 'unknown'
        };

        // Determine endpoint status
        if (preflightResults.errors.length > 0 || actualResults.corsError) {
          endpointResult.status = 'failed';
          results.summary.failedEndpoints++;
        } else if (preflightResults.warnings.length > 0) {
          endpointResult.status = 'warning';
          results.summary.warningEndpoints++;
        } else {
          endpointResult.status = 'passed';
          results.summary.passedEndpoints++;
        }

        results.endpoints.push(endpointResult);

      } catch (error) {
        console.error(`CORS test failed for ${endpoint}:`, error);
        
        results.endpoints.push({
          endpoint,
          status: 'failed',
          errors: [`Test execution failed: ${error.message}`],
          warnings: [],
          actualRequest: { error: error.message }
        });
        
        results.summary.failedEndpoints++;
      }
    }

    // Determine overall status
    if (results.summary.failedEndpoints === 0) {
      results.overallStatus = results.summary.warningEndpoints > 0 ? 'warning' : 'passed';
    } else {
      results.overallStatus = 'failed';
    }

    // Generate recommendations
    this.generateRecommendations(results);

    console.log('✅ CORS validation completed:', results.overallStatus);
    return results;
  }

  /**
   * Generate recommendations based on test results
   * @param {Object} results - Validation results
   */
  generateRecommendations(results) {
    const failedEndpoints = results.endpoints.filter(e => e.status === 'failed');
    const warningEndpoints = results.endpoints.filter(e => e.status === 'warning');

    if (failedEndpoints.length > 0) {
      results.recommendations.push({
        type: 'critical',
        message: `${failedEndpoints.length} endpoint(s) have CORS failures that will block requests`,
        action: 'Check server CORS configuration and ensure all required headers are present'
      });
    }

    if (warningEndpoints.length > 0) {
      results.recommendations.push({
        type: 'warning',
        message: `${warningEndpoints.length} endpoint(s) have CORS warnings that may cause issues`,
        action: 'Review CORS configuration for missing methods or headers'
      });
    }

    // Check for common issues
    const missingOriginEndpoints = results.endpoints.filter(e => 
      e.errors?.some(err => err.includes('Access-Control-Allow-Origin'))
    );
    
    if (missingOriginEndpoints.length > 0) {
      results.recommendations.push({
        type: 'critical',
        message: 'Missing Access-Control-Allow-Origin header',
        action: 'Add CORS middleware to server with proper origin configuration'
      });
    }

    const preflightFailures = results.endpoints.filter(e => !e.preflightSupported);
    if (preflightFailures.length > 0) {
      results.recommendations.push({
        type: 'warning',
        message: 'Some endpoints do not support preflight requests',
        action: 'Ensure server handles OPTIONS requests for all endpoints'
      });
    }

    if (results.recommendations.length === 0) {
      results.recommendations.push({
        type: 'success',
        message: 'CORS configuration appears to be working correctly',
        action: 'No action required'
      });
    }
  }

  /**
   * Quick CORS health check for critical endpoints
   * @param {string} baseUrl - Base API URL
   * @returns {Promise<boolean>} - True if CORS is working
   */
  async quickHealthCheck(baseUrl) {
    const criticalEndpoints = ['/api/orders', '/api/auth/login'];
    
    try {
      const results = await Promise.all(
        criticalEndpoints.map(endpoint => this.testActualRequest(endpoint, baseUrl))
      );
      
      return results.every(result => !result.corsError);
    } catch (error) {
      console.error('CORS health check failed:', error);
      return false;
    }
  }

  /**
   * Export validation results for support
   * @param {Object} results - Validation results
   */
  exportResults(results) {
    const exportData = {
      ...results,
      exportedAt: new Date().toISOString(),
      browserInfo: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cors-validation-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('📁 CORS validation results exported');
  }
}

// Create singleton instance
export const corsValidator = new CorsValidator();

// Export convenience functions
export const validateCors = (baseUrl) => corsValidator.validateCorsConfiguration(baseUrl);
export const quickCorsCheck = (baseUrl) => corsValidator.quickHealthCheck(baseUrl);
export const testEndpointCors = (endpoint, baseUrl) => corsValidator.testEndpointCors(endpoint, baseUrl);

export default corsValidator;