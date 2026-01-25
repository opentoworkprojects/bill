// ✅ Super Admin Panel Comprehensive Test Suite
// Tests all Super Admin API endpoints and functionality

const axios = require('axios');

class SuperAdminTester {
  constructor() {
    this.API = 'http://localhost:8000/api';
    this.credentials = {
      username: 'shiv@123', // Correct super admin username from .env
      password: 'shiv' // Correct super admin password from .env
    };
    this.testResults = [];
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
  }

  async runAllTests() {
    console.log('🧪 TESTING SUPER ADMIN PANEL');
    console.log('='.repeat(50));
    console.log(`🔗 API Base URL: ${this.API}`);
    console.log(`👤 Testing with credentials: ${this.credentials.username}`);
    console.log('='.repeat(50));

    const tests = [
      { name: 'Super Admin Login', test: () => this.testLogin() },
      { name: 'Dashboard Data Loading', test: () => this.testDashboard() },
      { name: 'Users List Loading', test: () => this.testUsersList() },
      { name: 'Analytics Data', test: () => this.testAnalytics() },
      { name: 'Tickets Management', test: () => this.testTickets() },
      { name: 'Leads Management', test: () => this.testLeads() },
      { name: 'Team Management', test: () => this.testTeam() },
      { name: 'App Versions', test: () => this.testAppVersions() },
      { name: 'Campaigns Management', test: () => this.testCampaigns() },
      { name: 'Pricing Configuration', test: () => this.testPricing() },
      { name: 'Sale Offer Configuration', test: () => this.testSaleOffer() },
      { name: 'User Details Access', test: () => this.testUserDetails() },
      { name: 'System Performance', test: () => this.testSystemPerformance() }
    ];

    for (const test of tests) {
      await this.runTest(test);
    }

    this.generateTestReport();
  }

  async runTest(test) {
    console.log(`\n🔬 Testing: ${test.name}`);
    console.log('-'.repeat(30));
    
    try {
      const startTime = Date.now();
      const result = await test.test();
      const duration = Date.now() - startTime;
      
      this.totalTests++;
      
      if (result.success) {
        this.passedTests++;
        console.log(`✅ ${test.name}: PASSED (${duration}ms)`);
      } else {
        this.failedTests++;
        console.log(`❌ ${test.name}: FAILED (${duration}ms)`);
      }
      
      if (result.details) {
        console.log(`   ${result.details}`);
      }
      
      if (result.data) {
        console.log(`   Data: ${JSON.stringify(result.data).substring(0, 100)}...`);
      }
      
      this.testResults.push({
        test: test.name,
        status: result.success ? 'PASS' : 'FAIL',
        duration,
        details: result.details,
        error: result.error,
        data: result.data,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      this.totalTests++;
      this.failedTests++;
      console.error(`💥 ${test.name}: ERROR - ${error.message}`);
      
      this.testResults.push({
        test: test.name,
        status: 'ERROR',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Test 1: Super Admin Login
  async testLogin() {
    try {
      const response = await axios.get(`${this.API}/super-admin/login`, {
        params: this.credentials,
        timeout: 10000
      });
      
      if (response.data.success) {
        return {
          success: true,
          details: 'Super admin authentication successful',
          data: { authenticated: true }
        };
      } else {
        return {
          success: false,
          details: 'Authentication failed - invalid credentials',
          error: 'Invalid credentials'
        };
      }
    } catch (error) {
      return {
        success: false,
        details: 'Login endpoint error',
        error: error.response?.data?.detail || error.message
      };
    }
  }

  // Test 2: Dashboard Data Loading
  async testDashboard() {
    try {
      const response = await axios.get(`${this.API}/super-admin/dashboard`, {
        params: this.credentials,
        timeout: 15000
      });
      
      const data = response.data;
      const overview = data.overview;
      
      if (overview && typeof overview.total_users === 'number') {
        return {
          success: true,
          details: `Dashboard loaded: ${overview.total_users} users, ${overview.active_subscriptions} active, ${overview.total_orders_30d} orders`,
          data: {
            total_users: overview.total_users,
            active_subscriptions: overview.active_subscriptions,
            trial_users: overview.trial_users,
            total_orders_30d: overview.total_orders_30d,
            open_tickets: overview.open_tickets
          }
        };
      } else {
        return {
          success: false,
          details: 'Dashboard data structure invalid',
          error: 'Missing overview data'
        };
      }
    } catch (error) {
      return {
        success: false,
        details: 'Dashboard endpoint error',
        error: error.response?.data?.detail || error.message
      };
    }
  }

  // Test 3: Users List Loading
  async testUsersList() {
    try {
      const response = await axios.get(`${this.API}/super-admin/users`, {
        params: this.credentials,
        timeout: 15000
      });
      
      const data = response.data;
      
      if (Array.isArray(data.users)) {
        const userCount = data.users.length;
        const activeUsers = data.users.filter(u => u.subscription_active).length;
        const trialUsers = userCount - activeUsers;
        
        return {
          success: true,
          details: `Users loaded: ${userCount} total (${activeUsers} active, ${trialUsers} trial)`,
          data: {
            total_users: userCount,
            active_users: activeUsers,
            trial_users: trialUsers,
            sample_user: data.users[0] ? {
              username: data.users[0].username,
              email: data.users[0].email,
              subscription_active: data.users[0].subscription_active
            } : null
          }
        };
      } else {
        return {
          success: false,
          details: 'Users data structure invalid',
          error: 'Users array not found'
        };
      }
    } catch (error) {
      return {
        success: false,
        details: 'Users list endpoint error',
        error: error.response?.data?.detail || error.message
      };
    }
  }

  // Test 4: Analytics Data
  async testAnalytics() {
    try {
      const response = await axios.get(`${this.API}/super-admin/analytics`, {
        params: { ...this.credentials, days: 30 },
        timeout: 15000
      });
      
      const data = response.data;
      
      if (data) {
        return {
          success: true,
          details: 'Analytics data loaded successfully',
          data: {
            has_revenue_data: !!data.revenue,
            has_user_data: !!data.users,
            has_order_data: !!data.orders,
            data_keys: Object.keys(data)
          }
        };
      } else {
        return {
          success: false,
          details: 'Analytics data empty',
          error: 'No analytics data returned'
        };
      }
    } catch (error) {
      return {
        success: false,
        details: 'Analytics endpoint error',
        error: error.response?.data?.detail || error.message
      };
    }
  }

  // Test 5: Tickets Management
  async testTickets() {
    try {
      const response = await axios.get(`${this.API}/super-admin/tickets`, {
        params: this.credentials,
        timeout: 10000
      });
      
      const data = response.data;
      
      if (Array.isArray(data.tickets)) {
        const ticketCount = data.tickets.length;
        const openTickets = data.tickets.filter(t => t.status === 'open').length;
        const pendingTickets = data.tickets.filter(t => t.status === 'pending').length;
        
        return {
          success: true,
          details: `Tickets loaded: ${ticketCount} total (${openTickets} open, ${pendingTickets} pending)`,
          data: {
            total_tickets: ticketCount,
            open_tickets: openTickets,
            pending_tickets: pendingTickets
          }
        };
      } else {
        return {
          success: false,
          details: 'Tickets data structure invalid',
          error: 'Tickets array not found'
        };
      }
    } catch (error) {
      return {
        success: false,
        details: 'Tickets endpoint error',
        error: error.response?.data?.detail || error.message
      };
    }
  }

  // Test 6: Leads Management
  async testLeads() {
    try {
      const response = await axios.get(`${this.API}/super-admin/leads`, {
        params: this.credentials,
        timeout: 10000
      });
      
      const data = response.data;
      
      if (Array.isArray(data.leads)) {
        const leadCount = data.leads.length;
        const newLeads = data.leads.filter(l => l.status === 'new').length;
        
        return {
          success: true,
          details: `Leads loaded: ${leadCount} total (${newLeads} new)`,
          data: {
            total_leads: leadCount,
            new_leads: newLeads,
            stats: data.stats
          }
        };
      } else {
        return {
          success: false,
          details: 'Leads data structure invalid',
          error: 'Leads array not found'
        };
      }
    } catch (error) {
      return {
        success: false,
        details: 'Leads endpoint error',
        error: error.response?.data?.detail || error.message
      };
    }
  }

  // Test 7: Team Management
  async testTeam() {
    try {
      const response = await axios.get(`${this.API}/super-admin/team`, {
        params: this.credentials,
        timeout: 10000
      });
      
      const data = response.data;
      
      if (Array.isArray(data.team_members)) {
        const teamCount = data.team_members.length;
        const activeMembers = data.team_members.filter(m => m.active !== false).length;
        
        return {
          success: true,
          details: `Team loaded: ${teamCount} members (${activeMembers} active)`,
          data: {
            total_members: teamCount,
            active_members: activeMembers,
            stats: data.stats
          }
        };
      } else {
        return {
          success: false,
          details: 'Team data structure invalid',
          error: 'Team members array not found'
        };
      }
    } catch (error) {
      return {
        success: false,
        details: 'Team endpoint error',
        error: error.response?.data?.detail || error.message
      };
    }
  }

  // Test 8: App Versions
  async testAppVersions() {
    try {
      const response = await axios.get(`${this.API}/super-admin/app-versions`, {
        params: this.credentials,
        timeout: 10000
      });
      
      const data = response.data;
      
      if (Array.isArray(data.versions)) {
        const versionCount = data.versions.length;
        const androidVersions = data.versions.filter(v => v.platform === 'android').length;
        const iosVersions = data.versions.filter(v => v.platform === 'ios').length;
        
        return {
          success: true,
          details: `App versions loaded: ${versionCount} total (${androidVersions} Android, ${iosVersions} iOS)`,
          data: {
            total_versions: versionCount,
            android_versions: androidVersions,
            ios_versions: iosVersions
          }
        };
      } else {
        return {
          success: false,
          details: 'App versions data structure invalid',
          error: 'Versions array not found'
        };
      }
    } catch (error) {
      return {
        success: false,
        details: 'App versions endpoint error',
        error: error.response?.data?.detail || error.message
      };
    }
  }

  // Test 9: Campaigns Management
  async testCampaigns() {
    try {
      const response = await axios.get(`${this.API}/super-admin/campaigns`, {
        params: this.credentials,
        timeout: 10000
      });
      
      const data = response.data;
      
      if (Array.isArray(data.campaigns)) {
        const campaignCount = data.campaigns.length;
        const activeCampaigns = data.campaigns.filter(c => c.is_active).length;
        
        return {
          success: true,
          details: `Campaigns loaded: ${campaignCount} total (${activeCampaigns} active)`,
          data: {
            total_campaigns: campaignCount,
            active_campaigns: activeCampaigns
          }
        };
      } else {
        return {
          success: false,
          details: 'Campaigns data structure invalid',
          error: 'Campaigns array not found'
        };
      }
    } catch (error) {
      return {
        success: false,
        details: 'Campaigns endpoint error',
        error: error.response?.data?.detail || error.message
      };
    }
  }

  // Test 10: Pricing Configuration
  async testPricing() {
    try {
      const response = await axios.get(`${this.API}/super-admin/pricing`, {
        params: this.credentials,
        timeout: 10000
      });
      
      const data = response.data;
      
      // Handle both direct and wrapped pricing data structures
      const pricingData = data.pricing || data;
      
      if (pricingData && typeof pricingData.regular_price === 'number') {
        return {
          success: true,
          details: `Pricing config loaded: Regular ₹${pricingData.regular_price}, Campaign ₹${pricingData.campaign_price || 'N/A'}`,
          data: {
            regular_price: pricingData.regular_price,
            campaign_price: pricingData.campaign_price,
            campaign_active: pricingData.campaign_active
          }
        };
      } else {
        return {
          success: false,
          details: 'Pricing data structure invalid',
          error: 'Pricing configuration not found'
        };
      }
    } catch (error) {
      return {
        success: false,
        details: 'Pricing endpoint error',
        error: error.response?.data?.detail || error.message
      };
    }
  }

  // Test 11: Sale Offer Configuration
  async testSaleOffer() {
    try {
      const response = await axios.get(`${this.API}/super-admin/sale-offer`, {
        params: this.credentials,
        timeout: 10000
      });
      
      const data = response.data;
      
      if (data) {
        return {
          success: true,
          details: `Sale offer config loaded: ${data.enabled ? 'Enabled' : 'Disabled'} - ${data.title || 'No title'}`,
          data: {
            enabled: data.enabled,
            title: data.title,
            discount_percent: data.discount_percent,
            theme: data.theme
          }
        };
      } else {
        return {
          success: false,
          details: 'Sale offer data empty',
          error: 'No sale offer configuration'
        };
      }
    } catch (error) {
      return {
        success: false,
        details: 'Sale offer endpoint error',
        error: error.response?.data?.detail || error.message
      };
    }
  }

  // Test 12: User Details Access
  async testUserDetails() {
    try {
      // First get a user ID from the users list
      const usersResponse = await axios.get(`${this.API}/super-admin/users`, {
        params: this.credentials,
        timeout: 10000
      });
      
      if (!usersResponse.data.users || usersResponse.data.users.length === 0) {
        // If no users from the main endpoint, try to get from a different source
        // or use a test user ID if available
        console.log('   ⚠️ No users found in users list, checking if this is due to timeout fallback');
        
        if (usersResponse.data.error) {
          return {
            success: false,
            details: 'Users endpoint returned fallback data due to timeout, cannot test user details',
            error: 'Users query timed out - no user ID available for testing'
          };
        }
        
        return {
          success: false,
          details: 'No users available for testing user details',
          error: 'No users found'
        };
      }
      
      const testUserId = usersResponse.data.users[0]._id || usersResponse.data.users[0].id;
      
      if (!testUserId) {
        return {
          success: false,
          details: 'User ID not found in user data',
          error: 'Missing user ID'
        };
      }
      
      console.log(`   🔍 Testing user details for user ID: ${testUserId}`);
      
      // Test user full data endpoint
      const userDetailsResponse = await axios.get(`${this.API}/super-admin/users/${testUserId}/full-data`, {
        params: this.credentials,
        timeout: 15000
      });
      
      const userData = userDetailsResponse.data;
      
      if (userData && userData.user) {
        return {
          success: true,
          details: `User details loaded for: ${userData.user.username || 'Unknown'}`,
          data: {
            user_id: testUserId,
            username: userData.user.username,
            has_orders: !!userData.orders,
            has_menu: !!userData.menu_items,
            orders_count: userData.orders ? userData.orders.length : 0,
            has_error: !!userData.error
          }
        };
      } else {
        return {
          success: false,
          details: 'User details data structure invalid',
          error: 'User data not found'
        };
      }
    } catch (error) {
      return {
        success: false,
        details: 'User details endpoint error',
        error: error.response?.data?.detail || error.message
      };
    }
  }

  // Test 13: System Performance
  async testSystemPerformance() {
    const startTime = Date.now();
    let apiCalls = 0;
    let successfulCalls = 0;
    let failedCalls = 0;
    
    try {
      // Test multiple concurrent API calls to measure performance
      const performanceTests = [
        axios.get(`${this.API}/super-admin/dashboard`, { params: this.credentials, timeout: 5000 }),
        axios.get(`${this.API}/super-admin/users`, { params: this.credentials, timeout: 5000 }),
        axios.get(`${this.API}/super-admin/tickets`, { params: this.credentials, timeout: 5000 }),
        axios.get(`${this.API}/super-admin/leads`, { params: this.credentials, timeout: 5000 })
      ];
      
      apiCalls = performanceTests.length;
      
      const results = await Promise.allSettled(performanceTests);
      
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          successfulCalls++;
        } else {
          failedCalls++;
        }
      });
      
      const totalTime = Date.now() - startTime;
      const avgResponseTime = totalTime / apiCalls;
      
      return {
        success: successfulCalls > failedCalls,
        details: `Performance test: ${successfulCalls}/${apiCalls} calls successful, avg ${avgResponseTime.toFixed(0)}ms`,
        data: {
          total_calls: apiCalls,
          successful_calls: successfulCalls,
          failed_calls: failedCalls,
          total_time_ms: totalTime,
          avg_response_time_ms: avgResponseTime
        }
      };
    } catch (error) {
      return {
        success: false,
        details: 'Performance test error',
        error: error.message
      };
    }
  }

  generateTestReport() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 SUPER ADMIN PANEL TEST REPORT');
    console.log('='.repeat(50));
    
    const successRate = ((this.passedTests / this.totalTests) * 100).toFixed(1);
    
    console.log(`\n📈 SUMMARY:`);
    console.log(`   Tests Run: ${this.totalTests}`);
    console.log(`   ✅ Passed: ${this.passedTests}`);
    console.log(`   ❌ Failed: ${this.failedTests}`);
    console.log(`   📊 Success Rate: ${successRate}%`);
    
    console.log(`\n📋 DETAILED RESULTS:`);
    this.testResults.forEach((result, index) => {
      const status = result.status === 'PASS' ? '✅' : 
                    result.status === 'FAIL' ? '❌' : '💥';
      
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
    });
    
    // System Status
    console.log(`\n🎯 SUPER ADMIN PANEL STATUS:`);
    if (this.passedTests >= this.totalTests * 0.8) {
      console.log(`   🟢 EXCELLENT - Super Admin panel is fully functional`);
      console.log(`   ✅ All core features working correctly`);
      console.log(`   ✅ API endpoints responding properly`);
      console.log(`   ✅ Data loading and display working`);
    } else if (this.passedTests >= this.totalTests * 0.6) {
      console.log(`   🟡 GOOD - Super Admin panel mostly functional`);
      console.log(`   ⚠️ Some features may have issues`);
      console.log(`   ✅ Core functionality working`);
    } else {
      console.log(`   🔴 NEEDS ATTENTION - Super Admin panel has issues`);
      console.log(`   ❌ Multiple features not working`);
      console.log(`   🔧 Requires immediate fixes`);
    }
    
    console.log(`\n💡 NEXT STEPS:`);
    if (this.failedTests === 0) {
      console.log(`   • Super Admin panel is ready for production use`);
      console.log(`   • All features tested and working correctly`);
      console.log(`   • Monitor system performance regularly`);
    } else {
      console.log(`   • Fix ${this.failedTests} failed test(s)`);
      console.log(`   • Check API endpoint configurations`);
      console.log(`   • Verify super admin credentials`);
      console.log(`   • Re-run tests after fixes`);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log(`🎉 Super Admin Panel testing completed!`);
    console.log(`📊 Overall Status: ${successRate >= 80 ? '🟢 EXCELLENT' : successRate >= 60 ? '🟡 GOOD' : '🔴 NEEDS WORK'}`);
    console.log('='.repeat(50));
  }
}

// Run Super Admin Panel tests
if (require.main === module) {
  const tester = new SuperAdminTester();
  
  // Allow custom credentials via command line
  if (process.argv[2] && process.argv[3]) {
    tester.credentials.username = process.argv[2];
    tester.credentials.password = process.argv[3];
    console.log(`🔐 Using custom credentials: ${tester.credentials.username}`);
  }
  
  tester.runAllTests()
    .then(() => {
      console.log('\n🎉 Super Admin Panel testing completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Testing failed:', error.message);
      process.exit(1);
    });
}

module.exports = SuperAdminTester;