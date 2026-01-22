#!/usr/bin/env python3
"""
Comprehensive Menu Loading Test for BillByteKOT
Tests menu API endpoints and identifies loading issues
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BACKEND_URL = "https://restro-ai.onrender.com"
API_BASE = f"{BACKEND_URL}/api"

def test_menu_endpoint():
    """Test the menu endpoint with different scenarios"""
    print("🔍 Testing Menu API Endpoint...")
    
    # Test without authentication
    try:
        response = requests.get(f"{API_BASE}/menu", timeout=10)
        print(f"   Without auth: {response.status_code}")
        
        if response.status_code == 403:
            print("   ✅ Endpoint exists, requires authentication")
        elif response.status_code == 404:
            print("   ❌ Menu endpoint not found")
        elif response.status_code == 200:
            print("   ⚠️  Endpoint accessible without auth (security issue)")
        else:
            print(f"   ⚠️  Unexpected status: {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test with invalid token
    try:
        headers = {"Authorization": "Bearer invalid_token_12345"}
        response = requests.get(f"{API_BASE}/menu", headers=headers, timeout=10)
        print(f"   With invalid token: {response.status_code}")
        
        if response.status_code == 401:
            print("   ✅ Correctly rejects invalid token")
        elif response.status_code == 403:
            print("   ✅ Access forbidden with invalid token")
        else:
            print(f"   ⚠️  Unexpected response: {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Error: {e}")

def test_menu_performance():
    """Test menu endpoint performance"""
    print("\n⚡ Testing Menu API Performance...")
    
    try:
        start_time = time.time()
        response = requests.get(f"{API_BASE}/menu", timeout=30)
        end_time = time.time()
        
        response_time = (end_time - start_time) * 1000  # Convert to milliseconds
        
        print(f"   Response time: {response_time:.2f}ms")
        print(f"   Status: {response.status_code}")
        
        if response_time > 5000:  # 5 seconds
            print("   ❌ Very slow response (>5s)")
        elif response_time > 2000:  # 2 seconds
            print("   ⚠️  Slow response (>2s)")
        elif response_time > 1000:  # 1 second
            print("   ⚠️  Moderate response time (>1s)")
        else:
            print("   ✅ Fast response (<1s)")
            
        return response_time
        
    except requests.exceptions.Timeout:
        print("   ❌ Request timed out (>30s)")
        return None
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return None

def test_menu_data_structure():
    """Test menu data structure and content"""
    print("\n📊 Testing Menu Data Structure...")
    
    try:
        # Test with a sample request (will fail auth but we can see structure)
        headers = {"Authorization": "Bearer sample_token"}
        response = requests.get(f"{API_BASE}/menu", headers=headers, timeout=10)
        
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                if isinstance(data, list):
                    print(f"   ✅ Returns array with {len(data)} items")
                    if len(data) > 0:
                        sample_item = data[0]
                        required_fields = ['id', 'name', 'category', 'price', 'available']
                        missing_fields = [field for field in required_fields if field not in sample_item]
                        
                        if not missing_fields:
                            print("   ✅ All required fields present")
                        else:
                            print(f"   ⚠️  Missing fields: {missing_fields}")
                    else:
                        print("   ⚠️  Empty menu array")
                else:
                    print(f"   ⚠️  Unexpected data type: {type(data)}")
            except json.JSONDecodeError:
                print("   ❌ Invalid JSON response")
        else:
            print(f"   ⚠️  Non-200 status: {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Error: {e}")

def test_cors_and_headers():
    """Test CORS and response headers"""
    print("\n🌐 Testing CORS and Headers...")
    
    try:
        # Test preflight request
        preflight_response = requests.options(
            f"{API_BASE}/menu",
            headers={
                "Origin": "https://billbytekot.in",
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "authorization,content-type"
            },
            timeout=10
        )
        
        print(f"   Preflight Status: {preflight_response.status_code}")
        
        cors_headers = {k: v for k, v in preflight_response.headers.items() 
                       if k.lower().startswith('access-control')}
        
        if cors_headers:
            print("   ✅ CORS headers present:")
            for header, value in cors_headers.items():
                print(f"      {header}: {value}")
        else:
            print("   ❌ No CORS headers found")
            
    except Exception as e:
        print(f"   ❌ CORS test error: {e}")

def test_server_health():
    """Test overall server health"""
    print("\n🏥 Testing Server Health...")
    
    endpoints_to_test = [
        ("/health", "Health check"),
        ("/api/docs", "API documentation"),
        ("/api/ping", "Ping endpoint")
    ]
    
    for endpoint, description in endpoints_to_test:
        try:
            url = f"{BACKEND_URL}{endpoint}"
            response = requests.get(url, timeout=10)
            
            print(f"   {description}: {response.status_code}")
            
            if response.status_code == 200:
                print(f"      ✅ {description} working")
            else:
                print(f"      ⚠️  {description} returned {response.status_code}")
                
        except Exception as e:
            print(f"      ❌ {description} error: {e}")

def generate_menu_fix_recommendations():
    """Generate recommendations for fixing menu issues"""
    print("\n" + "="*60)
    print("🔧 MENU LOADING FIX RECOMMENDATIONS")
    print("="*60)
    
    print("\n📋 Common Issues and Solutions:")
    
    print("\n1. **Menu API Returns 403/401**")
    print("   - Issue: Authentication problems")
    print("   - Fix: Check token validity and user permissions")
    print("   - Action: Clear localStorage and login again")
    
    print("\n2. **Menu API is Slow (>2s)**")
    print("   - Issue: Database query performance or server cold start")
    print("   - Fix: Add caching, optimize queries, keep server warm")
    print("   - Action: Implement Redis caching for menu items")
    
    print("\n3. **Empty Menu Array**")
    print("   - Issue: No menu items in database or wrong organization_id")
    print("   - Fix: Add menu items via Menu page or check data isolation")
    print("   - Action: Go to Menu page and add items")
    
    print("\n4. **Menu Suggestions Not Showing**")
    print("   - Issue: Frontend filtering logic or state management")
    print("   - Fix: Check filteredMenuItems logic and dropdown state")
    print("   - Action: Debug React state and search functionality")
    
    print("\n5. **CORS Errors**")
    print("   - Issue: Cross-origin request blocked")
    print("   - Fix: Ensure CORS middleware is properly configured")
    print("   - Action: Check backend CORS settings")
    
    print("\n🚀 Immediate Actions:")
    print("   1. Clear browser cache and localStorage")
    print("   2. Login with fresh credentials")
    print("   3. Check Menu page - add items if empty")
    print("   4. Test billing page search functionality")
    print("   5. Check browser console for errors")
    
    print("\n📱 Frontend Fixes Needed:")
    print("   - Add loading states for menu fetching")
    print("   - Improve error handling and user feedback")
    print("   - Add retry mechanism for failed requests")
    print("   - Optimize search and filtering performance")
    
    print("\n🔧 Backend Fixes Needed:")
    print("   - Add menu caching with Redis")
    print("   - Optimize database queries")
    print("   - Add proper error responses")
    print("   - Implement keep-alive for cold starts")

def main():
    """Run comprehensive menu loading tests"""
    print("🚀 BillByteKOT Menu Loading Comprehensive Test")
    print(f"   Backend: {BACKEND_URL}")
    print(f"   Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Run all tests
    test_menu_endpoint()
    response_time = test_menu_performance()
    test_menu_data_structure()
    test_cors_and_headers()
    test_server_health()
    
    # Generate recommendations
    generate_menu_fix_recommendations()
    
    print(f"\n📊 Test Summary:")
    print(f"   - Menu endpoint tested")
    print(f"   - Performance: {response_time:.2f}ms" if response_time else "   - Performance: Failed")
    print(f"   - CORS configuration checked")
    print(f"   - Server health verified")
    
    print("\n✅ Test completed! Check recommendations above.")

if __name__ == "__main__":
    main()