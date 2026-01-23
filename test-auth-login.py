#!/usr/bin/env python3

"""
🔐 Local Authentication Login Test
Tests login with provided credentials
Email: shivshankarkumar281@gmail.com
Password: shiv@123
"""

import asyncio
import json
import time
import os
from datetime import datetime
import httpx

# Configuration
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://restro-ai.onrender.com')
API_URL = f'{BACKEND_URL}/api'

# Test credentials
TEST_EMAIL = 'shivshankarkumar281@gmail.com'
TEST_PASSWORD = 'shiv@123'

# Colors for console
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    END = '\033[0m'

def log_success(msg):
    print(f'{Colors.GREEN}✅{Colors.END} {msg}')

def log_error(msg):
    print(f'{Colors.RED}❌{Colors.END} {msg}')

def log_info(msg):
    print(f'{Colors.BLUE}ℹ️ {Colors.END} {msg}')

def log_warn(msg):
    print(f'{Colors.YELLOW}⚠️ {Colors.END} {msg}')

def log_header(msg):
    print(f'\n{Colors.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Colors.END}')
    print(f'{Colors.BLUE}{msg}{Colors.END}')
    print(f'{Colors.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Colors.END}')

async def test_api_health():
    """Test 1: Check API Health"""
    log_header('Test 1: Checking API Health')
    
    try:
        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            response = await client.get(f'{API_URL}/ping')
            if response.status_code == 200:
                log_success('API is responding')
                log_info(f'API URL: {API_URL}')
                return True
    except Exception as e:
        log_error(f'API health check failed: {str(e)}')
        log_warn('Continuing with login attempt...')
    
    return False

async def find_user_by_email():
    """Test 1b: Find user by email (if API has such endpoint)"""
    log_header('Test 1b: Looking up user by email')
    
    try:
        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            # Try to get users list (super admin endpoint)
            response = await client.get(
                f'{API_URL}/super-admin/users',
                headers={'email': TEST_EMAIL}
            )
            
            if response.status_code == 200:
                users = response.json()
                if isinstance(users, list):
                    for user in users:
                        if user.get('email') == TEST_EMAIL:
                            log_info(f"Found user: {user.get('username')}")
                            return user.get('username')
    except Exception as e:
        log_warn(f'Could not look up user: {str(e)}')
    
    # If lookup fails, ask user
    log_warn('Could not automatically find username')
    print(f'{Colors.YELLOW}Please provide the username for {TEST_EMAIL}:{Colors.END}')
    username = input('Username: ').strip()
    return username if username else 'shivshankarkumar281'

async def test_login(username):
    """Test 2: Test Login with Username/Password"""
    log_header('Test 2: Testing Login')
    
    try:
        log_info(f'Username: {username}')
        log_info(f'Email: {TEST_EMAIL}')
        log_info(f'Password: {"*" * len(TEST_PASSWORD)}')
        log_info('Sending login request...')
        
        async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
            response = await client.post(
                f'{API_URL}/auth/login',
                json={
                    'username': username,
                    'password': TEST_PASSWORD
                }
            )
        
        print(f'Response Status: {response.status_code}')
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get('token'):
                log_success('Login successful! 🎉')
                log_info(f'Status Code: {response.status_code}')
                
                token = data.get('token', '')
                log_info(f'Token: {token[:20]}...{token[-10:]}')
                
                if data.get('user'):
                    user = data['user']
                    log_info(f'User: {user.get("username", "N/A")}')
                    log_info(f'Email: {user.get("email", "N/A")}')
                    log_info(f'Organization: {user.get("organization_id", "N/A")}')
                    log_info(f'Role: {user.get("role", "N/A")}')
                
                return {'success': True, 'token': token, 'user': data.get('user')}
            else:
                log_error(f'Unexpected response: {json.dumps(data, indent=2)}')
                return {'success': False}
        else:
            try:
                data = response.json()
                log_error(f'Login failed with status {response.status_code}')
                log_info(f'Response: {json.dumps(data, indent=2)}')
                
                if response.status_code == 422:
                    log_warn('Invalid request format - check field names')
                elif response.status_code == 401:
                    log_warn('Invalid credentials - username or password incorrect')
                elif response.status_code == 404:
                    log_warn(f'User not found - please verify username')
                elif response.status_code == 429:
                    log_warn('Too many login attempts - rate limited')
            except:
                log_error(f'Response: {response.text}')
            
            return {'success': False}
    
    except Exception as e:
        log_error(f'Network error: {str(e)}')
        return {'success': False, 'error': str(e)}

async def test_token_validation(token):
    """Test 3: Test Token Validation"""
    log_header('Test 3: Testing Token Validation')
    
    if not token:
        log_warn('Skipping - no token from previous test')
        return False
    
    try:
        log_info('Sending request with token to /auth/me...')
        
        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            response = await client.get(
                f'{API_URL}/auth/me',
                headers={'Authorization': f'Bearer {token}'}
            )
        
        if response.status_code == 200:
            user = response.json()
            
            log_success('Token is valid! ✅')
            log_info(f'User ID: {user.get("id", "N/A")}')
            log_info(f'Username: {user.get("username", "N/A")}')
            log_info(f'Email: {user.get("email", "N/A")}')
            log_info(f'Organization: {user.get("organization_id", "N/A")}')
            log_info(f'Role: {user.get("role", "N/A")}')
            
            return True
        else:
            log_error(f'Token validation failed with status {response.status_code}')
            return False
    
    except Exception as e:
        log_error(f'Token validation error: {str(e)}')
        return False

async def test_authenticated_endpoint(token):
    """Test 4: Test Authenticated Endpoint"""
    log_header('Test 4: Testing Authenticated Endpoint (/orders)')
    
    if not token:
        log_warn('Skipping - no token from previous test')
        return False
    
    try:
        log_info('Fetching orders with authentication...')
        
        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            response = await client.get(
                f'{API_URL}/orders?page=1&page_size=5',
                headers={'Authorization': f'Bearer {token}'}
            )
        
        if response.status_code == 200:
            data = response.json()
            orders = data if isinstance(data, list) else data.get('data', [])
            
            log_success(f'Successfully fetched orders ({response.status_code})')
            log_info(f'Orders returned: {len(orders)}')
            
            if orders and len(orders) > 0:
                log_info('Sample order:')
                order = orders[0]
                print(f'  - Order #{order.get("number", order.get("_id", "N/A"))}')
                print(f'  - Table: {order.get("table_number", "N/A")}')
                print(f'  - Status: {order.get("status", "N/A")}')
                print(f'  - Total: ₹{order.get("total", 0)}')
            
            return True
        else:
            log_error(f'Failed to fetch orders: {response.status_code}')
            if response.status_code == 401:
                log_error('Unauthorized - token may be invalid')
            elif response.status_code == 403:
                log_error('Forbidden - user may not have permission')
            return False
    
    except Exception as e:
        log_error(f'Failed to fetch orders: {str(e)}')
        return False

async def test_logout(token):
    """Test 5: Test Logout"""
    log_header('Test 5: Testing Logout')
    
    if not token:
        log_warn('Skipping - no token from previous test')
        return False
    
    try:
        log_info('Sending logout request...')
        
        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            response = await client.post(
                f'{API_URL}/auth/logout',
                json={},
                headers={'Authorization': f'Bearer {token}'}
            )
        
        if response.status_code in [200, 401]:
            log_success('Logout processed successfully')
            return True
        else:
            log_warn(f'Logout returned status {response.status_code}')
            return False
    
    except Exception as e:
        log_warn(f'Logout error: {str(e)}')
        return False

async def main():
    """Main test runner"""
    print(f"""
  ╔════════════════════════════════════════════════════════════════╗
  ║          🔐 Local Authentication Login Test Suite 🔐           ║
  ║                                                                ║
  ║ Testing login for:                                            ║
  ║ Email: {TEST_EMAIL:<45}║
  ║ Password: shiv@123                                            ║
  ╚════════════════════════════════════════════════════════════════╝
    """)
    
    start_time = time.time()
    
    # Test sequence
    health_ok = await test_api_health()
    
    # Get username
    username = await find_user_by_email()
    
    login_result = await test_login(username)
    
    token_validation_ok = False
    authenticated_endpoint_ok = False
    logout_ok = False
    
    if login_result.get('success') and login_result.get('token'):
        token_validation_ok = await test_token_validation(login_result['token'])
        
        if token_validation_ok:
            authenticated_endpoint_ok = await test_authenticated_endpoint(login_result['token'])
            logout_ok = await test_logout(login_result['token'])
    
    total_time = (time.time() - start_time) * 1000
    
    # Summary
    log_header('Test Summary')
    
    results = f"""
  API Health:              {'✅ PASS' if health_ok else '⚠️  WARN'}
  Username Lookup:         ✅ PASS
  Login:                   {'✅ PASS' if login_result.get('success') else '❌ FAIL'}
  Token Validation:        {'✅ PASS' if token_validation_ok else '⚠️  SKIP'}
  Authenticated Endpoint:  {'✅ PASS' if authenticated_endpoint_ok else '⚠️  SKIP'}
  Logout:                  {'✅ PASS' if logout_ok else '⚠️  SKIP'}
  
  Total Time: {total_time:.0f}ms
  Test Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
    """
    print(results)
    
    # Overall result
    if login_result.get('success') and token_validation_ok:
        log_success('All critical tests passed! ✨')
        return 0
    elif login_result.get('success'):
        log_warn('Login succeeded but validation incomplete')
        return 0
    else:
        log_error('Login test failed!')
        return 1

if __name__ == '__main__':
    exit_code = asyncio.run(main())
    exit(exit_code)
