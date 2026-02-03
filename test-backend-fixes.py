#!/usr/bin/env python3
"""
Test script to verify billing network error fixes
"""
import requests
import json
import time
import sys

# Configuration
API_BASE_URL = "http://localhost:10000/api"
TEST_ORDER_ID = "test-order-123"

def test_health_endpoint():
    """Test basic server health"""
    print("🔍 Testing server health...")
    try:
        response = requests.get(f"{API_BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Server health check passed")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def test_cors_headers():
    """Test CORS configuration"""
    print("🌐 Testing CORS headers...")
    try:
        # Test preflight request
        headers = {
            'Origin': 'http://localhost:3000',
            'Access-Control-Request-Method': 'PUT',
            'Access-Control-Request-Headers': 'Content-Type, Authorization'
        }
        response = requests.options(f"{API_BASE_URL}/orders", headers=headers, timeout=5)
        
        cors_headers = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
        }
        
        print(f"   Allow-Origin: {cors_headers['Access-Control-Allow-Origin']}")
        print(f"   Allow-Methods: {cors_headers['Access-Control-Allow-Methods']}")
        print(f"   Allow-Headers: {cors_headers['Access-Control-Allow-Headers']}")
        
        if all(cors_headers.values()):
            print("✅ CORS headers are properly configured")
            return True
        else:
            print("❌ CORS headers are missing or incomplete")
            return False
            
    except Exception as e:
        print(f"❌ CORS test error: {e}")
        return False

def test_error_handling():
    """Test error handling improvements"""
    print("🚨 Testing error handling...")
    try:
        # Test invalid order update (should return proper error, not 500)
        invalid_data = {
            "items": "invalid_items_format",  # Should be array
            "total": "invalid_number",        # Should be number
            "payment_method": None            # Should be string
        }
        
        response = requests.put(
            f"{API_BASE_URL}/orders/nonexistent-order",
            json=invalid_data,
            headers={'Content-Type': 'application/json'},
            timeout=5
        )
        
        print(f"   Response status: {response.status_code}")
        
        if response.status_code in [400, 404]:  # Should be client error, not 500
            print("✅ Error handling improved - no 500 errors for invalid data")
            return True
        elif response.status_code == 500:
            print("❌ Still getting 500 errors for invalid data")
            try:
                error_data = response.json()
                print(f"   Error details: {error_data}")
            except:
                print(f"   Raw response: {response.text}")
            return False
        else:
            print(f"⚠️ Unexpected status code: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error handling test error: {e}")
        return False

def test_payment_validation():
    """Test payment validation"""
    print("💳 Testing payment validation...")
    try:
        # Test payment completion with invalid data
        invalid_payment_data = {
            "status": "completed",
            "payment_received": -100,  # Invalid negative amount
            "payment_method": "",      # Invalid empty method
            "total": "not_a_number"    # Invalid total
        }
        
        response = requests.put(
            f"{API_BASE_URL}/orders/test-validation-order",
            json=invalid_payment_data,
            headers={'Content-Type': 'application/json'},
            timeout=5
        )
        
        print(f"   Response status: {response.status_code}")
        
        if response.status_code in [400, 404]:  # Should validate and reject
            print("✅ Payment validation working - invalid data rejected")
            return True
        elif response.status_code == 500:
            print("❌ Payment validation causing 500 errors")
            return False
        else:
            print(f"⚠️ Unexpected validation response: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Payment validation test error: {e}")
        return False

def run_all_tests():
    """Run all backend tests"""
    print("🚀 Starting backend fixes verification...\n")
    
    tests = [
        ("Server Health", test_health_endpoint),
        ("CORS Configuration", test_cors_headers),
        ("Error Handling", test_error_handling),
        ("Payment Validation", test_payment_validation)
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n{'='*50}")
        result = test_func()
        results.append((test_name, result))
        time.sleep(1)  # Small delay between tests
    
    print(f"\n{'='*50}")
    print("📊 TEST RESULTS SUMMARY")
    print(f"{'='*50}")
    
    passed = 0
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name:.<30} {status}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{len(results)} tests passed")
    
    if passed == len(results):
        print("🎉 All backend fixes are working correctly!")
        return True
    else:
        print("⚠️ Some tests failed - please review the issues above")
        return False

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)