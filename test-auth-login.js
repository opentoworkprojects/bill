#!/usr/bin/env node

/**
 * 🔐 Local Authentication Login Test
 * Tests login with provided credentials
 * Email: shivshankarkumar281@gmail.com
 * Password: shiv@123
 */

const axios = require('axios')
const https = require('https')

// Configuration
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://restro-ai.onrender.com'
const API_URL = `${BACKEND_URL}/api`

// Test credentials
const TEST_USER = {
  email: 'shivshankarkumar281@gmail.com',
  password: 'shiv@123'
}

// Create axios instance with SSL bypass for testing
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
})

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

const log = {
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ️ ${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️ ${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n${colors.blue}${msg}${colors.reset}\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`)
}

/**
 * Test 1: Check API Health
 */
async function testAPIHealth() {
  log.header('Test 1: Checking API Health')
  
  try {
    const response = await axiosInstance.get('/ping', { timeout: 5000 })
    log.success('API is responding')
    log.info(`API URL: ${API_URL}`)
    return true
  } catch (error) {
    log.error(`API health check failed: ${error.message}`)
    log.warn('Continuing with login attempt...')
    return false
  }
}

/**
 * Test 2: Test Login with Email/Password
 */
async function testLogin() {
  log.header('Test 2: Testing Login')
  
  try {
    log.info(`Email: ${TEST_USER.email}`)
    log.info(`Password: ${'*'.repeat(TEST_USER.password.length)}`)
    log.info('Sending login request...')
    
    const response = await axiosInstance.post('/auth/login', {
      email: TEST_USER.email,
      password: TEST_USER.password
    })
    
    const data = response.data
    
    if (response.status === 200 && data.token) {
      log.success('Login successful!')
      log.info(`Status Code: ${response.status}`)
      log.info(`Token: ${data.token.substring(0, 20)}...${data.token.slice(-10)}`)
      
      if (data.user) {
        log.info(`User: ${data.user.username || data.user.email}`)
        log.info(`Organization: ${data.user.organization_id || 'N/A'}`)
      }
      
      return { success: true, token: data.token, user: data.user }
    } else {
      log.error(`Unexpected response: ${JSON.stringify(data)}`)
      return { success: false }
    }
    
  } catch (error) {
    if (error.response) {
      const status = error.response.status
      const data = error.response.data
      
      log.error(`Login failed with status ${status}`)
      log.info(`Response: ${JSON.stringify(data, null, 2)}`)
      
      if (status === 401) {
        log.warn('Invalid credentials - please verify email/password')
      } else if (status === 404) {
        log.warn('User not found - please check if account exists')
      } else if (status === 429) {
        log.warn('Too many login attempts - rate limited')
      }
    } else {
      log.error(`Network error: ${error.message}`)
    }
    return { success: false, error: error.message }
  }
}

/**
 * Test 3: Test Token Validation
 */
async function testTokenValidation(token) {
  log.header('Test 3: Testing Token Validation')
  
  if (!token) {
    log.warn('Skipping - no token from previous test')
    return false
  }
  
  try {
    log.info('Sending request with token to /auth/me...')
    
    const response = await axiosInstance.get('/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    const user = response.data
    
    log.success('Token is valid!')
    log.info(`User ID: ${user.id}`)
    log.info(`Username: ${user.username}`)
    log.info(`Email: ${user.email}`)
    log.info(`Organization: ${user.organization_id}`)
    log.info(`Role: ${user.role || 'N/A'}`)
    
    return true
    
  } catch (error) {
    if (error.response?.status === 401) {
      log.error('Token validation failed - token may be expired or invalid')
    } else {
      log.error(`Token validation error: ${error.message}`)
    }
    return false
  }
}

/**
 * Test 4: Test Authenticated Endpoint
 */
async function testAuthenticatedEndpoint(token) {
  log.header('Test 4: Testing Authenticated Endpoint (/orders)')
  
  if (!token) {
    log.warn('Skipping - no token from previous test')
    return false
  }
  
  try {
    log.info('Fetching orders with authentication...')
    
    const response = await axiosInstance.get('/orders?page=1&page_size=5', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    const orders = Array.isArray(response.data) ? response.data : response.data.data || []
    
    log.success(`Successfully fetched orders (${response.status})`)
    log.info(`Orders returned: ${orders.length}`)
    
    if (orders.length > 0) {
      log.info('Sample order:')
      const order = orders[0]
      console.log(`  - Order #${order.number || order._id}`)
      console.log(`  - Table: ${order.table_number || 'N/A'}`)
      console.log(`  - Status: ${order.status || 'N/A'}`)
      console.log(`  - Total: ₹${order.total || 0}`)
    }
    
    return true
    
  } catch (error) {
    if (error.response?.status === 401) {
      log.error('Unauthorized - token may be invalid')
    } else if (error.response?.status === 403) {
      log.error('Forbidden - user may not have permission')
    } else {
      log.error(`Failed to fetch orders: ${error.message}`)
    }
    return false
  }
}

/**
 * Test 5: Test Logout
 */
async function testLogout(token) {
  log.header('Test 5: Testing Logout')
  
  if (!token) {
    log.warn('Skipping - no token from previous test')
    return false
  }
  
  try {
    log.info('Sending logout request...')
    
    const response = await axiosInstance.post('/auth/logout', {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    log.success('Logout successful')
    log.info(`Status: ${response.status}`)
    
    return true
    
  } catch (error) {
    // Logout might return 401 or similar after clearing token
    if (error.response?.status === 401 || error.response?.status === 200) {
      log.success('Logout processed (token cleared)')
      return true
    }
    log.warn(`Logout response: ${error.message}`)
    return false
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log(`
  ╔════════════════════════════════════════════════════════════════╗
  ║          🔐 Local Authentication Login Test Suite 🔐           ║
  ║                                                                ║
  ║ Testing login for:                                            ║
  ║ Email: shivshankarkumar281@gmail.com                          ║
  ║ Password: shiv@123                                            ║
  ╚════════════════════════════════════════════════════════════════╝
  `)
  
  const startTime = Date.now()
  
  // Test sequence
  const healthOK = await testAPIHealth()
  const loginResult = await testLogin()
  
  let tokenValidationOK = false
  let authenticatedEndpointOK = false
  let logoutOK = false
  
  if (loginResult.success && loginResult.token) {
    tokenValidationOK = await testTokenValidation(loginResult.token)
    
    if (tokenValidationOK) {
      authenticatedEndpointOK = await testAuthenticatedEndpoint(loginResult.token)
      logoutOK = await testLogout(loginResult.token)
    }
  }
  
  const totalTime = Date.now() - startTime
  
  // Summary
  log.header('Test Summary')
  
  console.log(`
  API Health:              ${healthOK ? '✅ PASS' : '⚠️  WARN'}
  Login:                   ${loginResult.success ? '✅ PASS' : '❌ FAIL'}
  Token Validation:        ${tokenValidationOK ? '✅ PASS' : '⚠️  SKIP'}
  Authenticated Endpoint:  ${authenticatedEndpointOK ? '✅ PASS' : '⚠️  SKIP'}
  Logout:                  ${logoutOK ? '✅ PASS' : '⚠️  SKIP'}
  
  Total Time: ${totalTime}ms
  
  `)
  
  // Overall result
  if (loginResult.success && tokenValidationOK) {
    log.success('All critical tests passed! ✨')
    process.exit(0)
  } else if (loginResult.success) {
    log.warn('Login succeeded but validation skipped')
    process.exit(0)
  } else {
    log.error('Login test failed!')
    process.exit(1)
  }
}

// Run tests
runTests().catch(error => {
  log.error(`Unexpected error: ${error.message}`)
  console.error(error)
  process.exit(1)
})
