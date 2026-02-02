#!/usr/bin/env python3
"""
Direct Staff Management Endpoint Test
Tests staff endpoints without requiring login credentials
"""
import requests
import json

BACKEND_URL = "https://restro-ai.onrender.com"
API_BASE = f"{BACKEND_URL}/api"

def test_endpoint_accessibility():
    """Test if staff endpoints are accessible and return proper error codes"""
    print("🔍 TESTING STAFF ENDPOINT ACCESSIBILITY")
    print("=" * 50)
    
    endpoints = [
        ("GET", "/staff", "Staff list"),
        ("POST", "/staff/create-request", "Staff creation request"),
        ("POST", "/staff/verify-create", "Staff OTP verification"),
        ("POST", "/staff/create", "Direct staff creation")
    ]
    
    for method, endpoint, description in endpoints:
        try:
            print(f"\n📡 Testing {method} {endpoint} ({description})")
            
            if method == "GET":
                response = requests.get(f"{API_BASE}{endpoint}", timeout=10)
            else:
                # Send minimal test data
                test_data = {
                    "username": "test",
                    "email": "test@example.com",
                    "password": "test123",
                    "role": "waiter"
                }
                if endpoint == "/staff/verify-create":
                    test_data = {"email": "test@example.com", "otp": "123456"}
                
                response = requests.post(f"{API_BASE}{endpoint}", json=test_data, timeout=10)
            
            print(f"   Status: {response.status_code}")
            print(f"   Response: {response.text[:200]}...")
            
            # Check if we get expected authentication errors (not 500 errors)
            if response.status_code in [401, 403]:
                print("   ✅ Endpoint accessible - returns proper auth error")
            elif response.status_code == 500:
                print("   ❌ INTERNAL SERVER ERROR - endpoint has bugs")
            elif response.status_code == 422:
                print("   ✅ Endpoint accessible - returns validation error")
            elif response.status_code == 400:
                print("   ✅ Endpoint accessible - returns bad request error")
            else:
                print(f"   ⚠️  Unexpected status code: {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ Connection error: {e}")

def test_cors_headers():
    """Test CORS headers for staff endpoints"""
    print("\n\n🌐 TESTING CORS HEADERS")
    print("=" * 30)
    
    endpoints = ["/staff", "/staff/create-request", "/staff/verify-create", "/staff/create"]
    
    for endpoint in endpoints:
        try:
            print(f"\n🔗 Testing CORS for {endpoint}")
            
            # Make OPTIONS request to check CORS
            response = requests.options(
                f"{API_BASE}{endpoint}",
                headers={
                    'Origin': 'https://billbytekot.in',
                    'Access-Control-Request-Method': 'POST',
                    'Access-Control-Request-Headers': 'Content-Type,Authorization'
                },
                timeout=10
            )
            
            print(f"   Status: {response.status_code}")
            
            # Check CORS headers
            cors_headers = {
                'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
                'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
                'access-control-allow-headers': response.headers.get('access-control-allow-headers'),
                'access-control-allow-credentials': response.headers.get('access-control-allow-credentials')
            }
            
            print(f"   CORS Headers: {json.dumps(cors_headers, indent=6)}")
            
            if response.status_code == 200 and cors_headers['access-control-allow-origin']:
                print("   ✅ CORS properly configured")
            else:
                print("   ❌ CORS issues detected")
                
        except Exception as e:
            print(f"   ❌ CORS test error: {e}")

def test_data_validation():
    """Test data validation on staff endpoints"""
    print("\n\n📝 TESTING DATA VALIDATION")
    print("=" * 30)
    
    test_cases = [
        {
            "name": "Empty data",
            "data": {},
            "expected": [400, 422]
        },
        {
            "name": "Invalid email format",
            "data": {
                "username": "test",
                "email": "invalid-email",
                "password": "test123",
                "role": "waiter"
            },
            "expected": [400, 422]
        },
        {
            "name": "Missing required fields",
            "data": {
                "username": "test"
            },
            "expected": [400, 422]
        },
        {
            "name": "Valid data structure (should fail on auth, not validation)",
            "data": {
                "username": "testuser123",
                "email": "test@example.com",
                "password": "test123",
                "role": "waiter",
                "phone": "+91987654321",
                "salary": 25000
            },
            "expected": [401, 403]
        }
    ]
    
    for test_case in test_cases:
        try:
            print(f"\n🧪 Testing: {test_case['name']}")
            
            response = requests.post(
                f"{API_BASE}/staff/create-request",
                json=test_case['data'],
                timeout=10
            )
            
            print(f"   Status: {response.status_code}")
            print(f"   Response: {response.text[:150]}...")
            
            if response.status_code in test_case['expected']:
                print("   ✅ Validation working as expected")
            elif response.status_code == 500:
                print("   ❌ INTERNAL SERVER ERROR - validation issue")
            else:
                print(f"   ⚠️  Unexpected response: {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ Validation test error: {e}")

def test_backend_health():
    """Test overall backend health"""
    print("\n\n❤️  TESTING BACKEND HEALTH")
    print("=" * 30)
    
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=10)
        if response.status_code == 200:
            health_data = response.json()
            print("✅ Backend is healthy")
            print(f"   Database: {health_data.get('services', {}).get('database', 'unknown')}")
            print(f"   API: {health_data.get('services', {}).get('api', 'unknown')}")
            return True
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend health check error: {e}")
        return False

def main():
    """Main test execution"""
    print("🧪 STAFF MANAGEMENT ENDPOINT TESTING")
    print("=" * 50)
    print("This test checks staff endpoints without requiring authentication")
    print("It identifies 500 errors, CORS issues, and validation problems")
    print()
    
    # Test backend health first
    if not test_backend_health():
        print("❌ Backend is not healthy - stopping tests")
        return
    
    # Test endpoint accessibility
    test_endpoint_accessibility()
    
    # Test CORS headers
    test_cors_headers()
    
    # Test data validation
    test_data_validation()
    
    print("\n" + "=" * 50)
    print("🏁 ENDPOINT TESTING COMPLETE")
    print()
    print("📊 SUMMARY:")
    print("✅ = Working correctly")
    print("❌ = Needs attention")
    print("⚠️  = Unexpected behavior")
    print()
    print("🔍 Look for:")
    print("- Any 500 Internal Server Errors (these are bugs)")
    print("- CORS configuration issues")
    print("- Validation not working properly")
    print("- Authentication errors (401/403) are expected and good")

if __name__ == "__main__":
    main()