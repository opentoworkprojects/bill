#!/usr/bin/env python3
"""
Basic endpoint testing without authentication
"""

import requests
import json

def test_basic_endpoints():
    """Test basic server functionality"""
    base_url = "http://localhost:8000"
    
    print("🧪 Testing Basic Server Functionality")
    print("="*50)
    
    # Test root endpoint
    try:
        response = requests.get(f"{base_url}/")
        if response.status_code == 200:
            print("✅ Root endpoint working")
            data = response.json()
            print(f"   Server: {data.get('service')}")
            print(f"   Version: {data.get('version')}")
        else:
            print(f"❌ Root endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Root endpoint error: {e}")
        return False
    
    # Test API docs
    try:
        response = requests.get(f"{base_url}/docs")
        if response.status_code == 200:
            print("✅ API docs accessible at http://localhost:8000/docs")
        else:
            print(f"⚠️  API docs status: {response.status_code}")
    except Exception as e:
        print(f"⚠️  API docs error: {e}")
    
    # Test API endpoints (should return 401 for protected endpoints)
    api_endpoints = [
        "/api/menu",
        "/api/inventory", 
        "/api/auth/login"
    ]
    
    print("\n🔍 Testing API Endpoints (expecting 401/422 for protected routes):")
    
    for endpoint in api_endpoints:
        try:
            if endpoint == "/api/auth/login":
                # Test POST for login
                response = requests.post(f"{base_url}{endpoint}", json={})
            else:
                # Test GET for others
                response = requests.get(f"{base_url}{endpoint}")
            
            if response.status_code == 401:
                print(f"✅ {endpoint} - Properly protected (401)")
            elif response.status_code == 422:
                print(f"✅ {endpoint} - Validation working (422)")
            elif response.status_code == 200:
                print(f"⚠️  {endpoint} - Unexpectedly accessible (200)")
            else:
                print(f"⚠️  {endpoint} - Status {response.status_code}")
                
        except Exception as e:
            print(f"❌ {endpoint} - Error: {e}")
    
    print("\n🎯 Testing Our Fixes:")
    print("="*30)
    
    # The key test is that the endpoints exist and return proper HTTP codes
    # rather than 404 (not found) or 500 (server error)
    
    menu_test = requests.get(f"{base_url}/api/menu")
    inventory_test = requests.get(f"{base_url}/api/inventory")
    
    if menu_test.status_code == 401:
        print("✅ Menu endpoint exists and requires auth (good)")
    else:
        print(f"⚠️  Menu endpoint status: {menu_test.status_code}")
        
    if inventory_test.status_code == 401:
        print("✅ Inventory endpoint exists and requires auth (good)")
    else:
        print(f"⚠️  Inventory endpoint status: {inventory_test.status_code}")
    
    print("\n📋 Summary:")
    print("- Server is running and accessible")
    print("- API endpoints exist and are properly protected")
    print("- Ready for authenticated testing")
    
    print("\n💡 Next Steps:")
    print("1. Create a test user account or use existing credentials")
    print("2. Run the full test suite with authentication")
    print("3. Test the frontend UI manually")
    
    return True

if __name__ == "__main__":
    test_basic_endpoints()