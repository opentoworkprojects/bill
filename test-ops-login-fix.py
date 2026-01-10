#!/usr/bin/env python3
"""
Test Ops Login Fix - Direct API Test
"""

import requests
import json
import sys

def test_super_admin_api():
    """Test the super admin API directly"""
    
    print("🔧 Testing Super Admin API")
    print("=" * 40)
    
    # Correct credentials
    username = "shiv@123"
    password = "shiv"
    
    # Test against production URL
    base_url = "https://restro-ai.onrender.com"
    
    print(f"🔐 Testing login with:")
    print(f"   Username: {username}")
    print(f"   Password: {'*' * len(password)}")
    print(f"   URL: {base_url}/api/super-admin/dashboard")
    
    try:
        response = requests.get(
            f"{base_url}/api/super-admin/dashboard",
            params={
                "username": username,
                "password": password
            },
            timeout=30,
            headers={
                'User-Agent': 'BillByteKOT-Test/1.0',
                'Accept': 'application/json',
                'Origin': 'https://billbytekot.in'
            }
        )
        
        print(f"\n📡 Response Status: {response.status_code}")
        print(f"📡 Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print("✅ Super admin login successful!")
            data = response.json()
            overview = data.get('overview', {})
            print(f"   Total users: {overview.get('total_users', 'N/A')}")
            print(f"   Active subscriptions: {overview.get('active_subscriptions', 'N/A')}")
            print(f"   Total orders (30d): {overview.get('total_orders_30d', 'N/A')}")
            return True
        elif response.status_code == 403:
            print("❌ Super admin login failed: Invalid credentials")
            try:
                error_data = response.json()
                print(f"   Error: {error_data.get('detail', 'Unknown error')}")
            except:
                print(f"   Raw response: {response.text}")
            return False
        elif response.status_code == 500:
            print("❌ Server error (500)")
            print(f"   Response: {response.text[:500]}...")
            return False
        else:
            print(f"❌ Unexpected status code: {response.status_code}")
            print(f"   Response: {response.text[:500]}...")
            return False
            
    except requests.exceptions.Timeout:
        print("❌ Request timeout - server might be slow")
        return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_cors_preflight():
    """Test CORS preflight request"""
    
    print("\n🌐 Testing CORS Configuration")
    print("=" * 40)
    
    base_url = "https://restro-ai.onrender.com"
    
    try:
        # Test OPTIONS request (CORS preflight)
        response = requests.options(
            f"{base_url}/api/super-admin/dashboard",
            headers={
                'Origin': 'https://billbytekot.in',
                'Access-Control-Request-Method': 'GET',
                'Access-Control-Request-Headers': 'Content-Type'
            },
            timeout=10
        )
        
        print(f"📡 CORS Preflight Status: {response.status_code}")
        cors_headers = {k: v for k, v in response.headers.items() if 'access-control' in k.lower()}
        print(f"📡 CORS Headers: {cors_headers}")
        
        if response.status_code in [200, 204]:
            print("✅ CORS preflight successful")
            return True
        else:
            print("⚠️ CORS preflight issues detected")
            return False
            
    except Exception as e:
        print(f"❌ CORS test error: {e}")
        return False

def main():
    print("🔧 BillByteKOT Ops Login Fix Test")
    print("=" * 50)
    
    # Test API directly
    api_success = test_super_admin_api()
    
    # Test CORS
    cors_success = test_cors_preflight()
    
    print("\n" + "=" * 50)
    print("📊 Test Results")
    print("=" * 50)
    
    print(f"Super Admin API: {'✅ WORKING' if api_success else '❌ FAILED'}")
    print(f"CORS Configuration: {'✅ OK' if cors_success else '⚠️ ISSUES'}")
    
    if api_success and cors_success:
        print("\n🎉 Backend is working correctly!")
        print("\n💡 If frontend still shows 'Authenticating...', try:")
        print("   1. Clear browser cache and cookies")
        print("   2. Try incognito/private browsing mode")
        print("   3. Check browser console for JavaScript errors")
        print("   4. Verify network connectivity")
        
        print(f"\n🔗 Direct test URL:")
        print(f"   https://restro-ai.onrender.com/api/super-admin/dashboard?username=shiv%40123&password=shiv")
        
    elif api_success and not cors_success:
        print("\n⚠️ API works but CORS might be blocking frontend")
        print("   Check browser console for CORS errors")
        
    else:
        print("\n❌ Backend API issues detected")
        print("   Check server logs and deployment status")
    
    return api_success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)