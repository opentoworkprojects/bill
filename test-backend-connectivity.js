// ✅ Backend Connectivity Test
// Tests if the backend server is running and accessible

const axios = require('axios');

class BackendConnectivityTester {
  constructor() {
    this.API = 'https://billbytekot-backend.onrender.com/api';
    this.testResults = [];
  }

  async runConnectivityTests() {
    console.log('🔗 TESTING BACKEND CONNECTIVITY');
    console.log('='.repeat(50));
    console.log(`🌐 API Base URL: ${this.API}`);
    console.log('='.repeat(50));

    const tests = [
      { name: 'Basic Server Health', test: () => this.testServerHealth() },
      { name: 'API Root Endpoint', test: () => this.testAPIRoot() },
      { name: 'Login Endpoint', test: () => this.testLoginEndpoint() },
      { name: 'Super Admin Login Endpoint', test: () => this.testSuperAdminLogin() },
      { name: 'Available Routes Discovery', test: () => this.discoverRoutes() }
    ];

    for (const test of tests) {
      await this.runTest(test);
    }

    this.generateConnectivityReport();
  }

  async runTest(test) {
    console.log(`\n🔬 Testing: ${test.name}`);
    console.log('-'.repeat(30));
    
    try {
      const startTime = Date.now();
      const result = await test.test();
      const duration = Date.now() - startTime;
      
      if (result.success) {
        console.log(`✅ ${test.name}: SUCCESS (${duration}ms)`);
      } else {
        console.log(`❌ ${test.name}: FAILED (${duration}ms)`);
      }
      
      if (result.details) {
        console.log(`   ${result.details}`);
      }
      
      this.testResults.push({
        test: test.name,
        status: result.success ? 'SUCCESS' : 'FAILED',
        duration,
        details: result.details,
        error: result.error,
        data: result.data
      });
      
    } catch (error) {
      console.error(`💥 ${test.name}: ERROR - ${error.message}`);
      this.testResults.push({
        test: test.name,
        status: 'ERROR',
        error: error.message
      });
    }
  }

  // Test 1: Basic Server Health
  async testServerHealth() {
    try {
      const response = await axios.get('https://billbytekot-backend.onrender.com', {
        timeout: 10000
      });
      
      return {
        success: true,
        details: `Server responding with status ${response.status}`,
        data: { status: response.status, statusText: response.statusText }
      };
    } catch (error) {
      return {
        success: false,
        details: 'Server not responding',
        error: error.message
      };
    }
  }

  // Test 2: API Root Endpoint
  async testAPIRoot() {
    try {
      const response = await axios.get(`${this.API}`, {
        timeout: 10000
      });
      
      return {
        success: true,
        details: `API root responding with status ${response.status}`,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        details: 'API root not accessible',
        error: error.response?.status === 404 ? 'API endpoint not found (404)' : error.message
      };
    }
  }

  // Test 3: Login Endpoint
  async testLoginEndpoint() {
    try {
      const response = await axios.post(`${this.API}/login`, {
        username: 'test',
        password: 'test'
      }, {
        timeout: 10000,
        validateStatus: (status) => status < 500 // Accept 4xx errors as valid responses
      });
      
      return {
        success: true,
        details: `Login endpoint responding with status ${response.status}`,
        data: { status: response.status, message: response.data?.detail || 'Login endpoint accessible' }
      };
    } catch (error) {
      return {
        success: false,
        details: 'Login endpoint not accessible',
        error: error.response?.status === 404 ? 'Login endpoint not found (404)' : error.message
      };
    }
  }

  // Test 4: Super Admin Login Endpoint
  async testSuperAdminLogin() {
    try {
      const response = await axios.get(`${this.API}/super-admin/login`, {
        params: { username: 'test', password: 'test' },
        timeout: 10000,
        validateStatus: (status) => status < 500
      });
      
      return {
        success: true,
        details: `Super admin login endpoint responding with status ${response.status}`,
        data: { status: response.status, message: response.data?.detail || 'Super admin endpoint accessible' }
      };
    } catch (error) {
      return {
        success: false,
        details: 'Super admin login endpoint not accessible',
        error: error.response?.status === 404 ? 'Super admin endpoint not found (404)' : error.message
      };
    }
  }

  // Test 5: Discover Available Routes
  async discoverRoutes() {
    const commonEndpoints = [
      '/health',
      '/status',
      '/docs',
      '/openapi.json',
      '/api/docs',
      '/api/health',
      '/api/status'
    ];

    let foundEndpoints = [];
    let checkedCount = 0;

    for (const endpoint of commonEndpoints) {
      try {
        checkedCount++;
        const response = await axios.get(`https://billbytekot-backend.onrender.com${endpoint}`, {
          timeout: 5000,
          validateStatus: (status) => status < 500
        });
        
        if (response.status < 400) {
          foundEndpoints.push({
            endpoint,
            status: response.status,
            contentType: response.headers['content-type']
          });
        }
      } catch (error) {
        // Ignore errors for route discovery
      }
    }

    return {
      success: foundEndpoints.length > 0,
      details: `Found ${foundEndpoints.length} accessible endpoints out of ${checkedCount} checked`,
      data: { foundEndpoints, checkedCount }
    };
  }

  generateConnectivityReport() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 BACKEND CONNECTIVITY REPORT');
    console.log('='.repeat(50));
    
    const successfulTests = this.testResults.filter(r => r.status === 'SUCCESS').length;
    const totalTests = this.testResults.length;
    
    console.log(`\n📈 CONNECTIVITY SUMMARY:`);
    console.log(`   Tests Run: ${totalTests}`);
    console.log(`   ✅ Successful: ${successfulTests}`);
    console.log(`   ❌ Failed: ${totalTests - successfulTests}`);
    
    console.log(`\n📋 DETAILED RESULTS:`);
    this.testResults.forEach((result, index) => {
      const status = result.status === 'SUCCESS' ? '✅' : '❌';
      console.log(`\n${index + 1}. ${status} ${result.test}`);
      console.log(`   Status: ${result.status}`);
      
      if (result.duration) {
        console.log(`   Duration: ${result.duration}ms`);
      }
      
      if (result.details) {
        console.log(`   Details: ${result.details}`);
      }
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      
      if (result.data && result.data.foundEndpoints) {
        console.log(`   Found Endpoints:`);
        result.data.foundEndpoints.forEach(ep => {
          console.log(`     • ${ep.endpoint} (${ep.status})`);
        });
      }
    });
    
    console.log(`\n🎯 BACKEND STATUS:`);
    if (successfulTests >= 3) {
      console.log(`   🟢 BACKEND IS ACCESSIBLE`);
      console.log(`   ✅ Server is responding`);
      console.log(`   ✅ API endpoints are reachable`);
    } else if (successfulTests >= 1) {
      console.log(`   🟡 PARTIAL CONNECTIVITY`);
      console.log(`   ⚠️ Some endpoints accessible`);
      console.log(`   🔧 Check API configuration`);
    } else {
      console.log(`   🔴 BACKEND NOT ACCESSIBLE`);
      console.log(`   ❌ Server may be down`);
      console.log(`   🔧 Check server status`);
    }
    
    console.log(`\n💡 RECOMMENDATIONS:`);
    if (successfulTests === 0) {
      console.log(`   • Check if backend server is running`);
      console.log(`   • Verify server URL: https://billbytekot-backend.onrender.com`);
      console.log(`   • Check network connectivity`);
      console.log(`   • Review server logs for errors`);
    } else if (successfulTests < totalTests) {
      console.log(`   • Some endpoints are working`);
      console.log(`   • Check API route configuration`);
      console.log(`   • Verify super admin endpoints exist`);
      console.log(`   • Review backend API documentation`);
    } else {
      console.log(`   • Backend connectivity is good`);
      console.log(`   • Super admin panel should work`);
      console.log(`   • Check authentication credentials`);
    }
    
    console.log('\n' + '='.repeat(50));
  }
}

// Run connectivity tests
if (require.main === module) {
  const tester = new BackendConnectivityTester();
  
  tester.runConnectivityTests()
    .then(() => {
      console.log('\n🎉 Backend connectivity testing completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Connectivity testing failed:', error.message);
      process.exit(1);
    });
}

module.exports = BackendConnectivityTester;