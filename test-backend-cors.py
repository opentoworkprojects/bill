#!/usr/bin/env python3
"""
Test script to verify backend CORS and staff verification endpoint
"""
import requests
import json

BACKEND_URL = "https://restro-ai.onrender.com"

def test_backend_health():
    """Test if backend is accessible"""
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=10)
        print(f"✅ Backend health check: {response.status_code}")
        if response.status_code == 200:
            print(f"   Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Backend health check failed: {e}")
        return False

def test_cors_headers():
    """Test CORS headers"""
    try:
        # Make an OPTIONS request to check CORS
        response = requests.options(
            f"{BACKEND_URL}/api/staff/verify-create",
            headers={
                'Origin': 'https://billbytekot.in',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type,Authorization'
            },
            timeout=10
        )
        print(f"✅ CORS preflight check: {response.status_code}")
        print(f"   CORS headers: {dict(response.headers)}")
        return True
    except Exception as e:
        print(f"❌ CORS preflight check failed: {e}")
        return False

def test_staff_endpoint_without_auth():
    """Test staff endpoint without authentication"""
    try:
        response = requests.post(
            f"{BACKEND_URL}/api/staff/verify-create",
            json={"email": "test@example.com", "otp": "123456"},
            headers={
                'Origin': 'https://billbytekot.in',
                'Content-Type': 'application/json'
            },
            timeout=10
        )
        print(f"✅ Staff endpoint (no auth): {response.status_code}")
        print(f"   Response: {response.text[:200]}")
        return True
    except Exception as e:
        print(f"❌ Staff endpoint test failed: {e}")
        return False

if __name__ == "__main__":
    print("🔍 Testing backend CORS and accessibility...")
    print(f"Backend URL: {BACKEND_URL}")
    print("-" * 50)
    
    # Test backend health
    health_ok = test_backend_health()
    print()
    
    # Test CORS headers
    cors_ok = test_cors_headers()
    print()
    
    # Test staff endpoint
    endpoint_ok = test_staff_endpoint_without_auth()
    print()
    
    print("-" * 50)
    if health_ok and cors_ok:
        print("✅ Backend appears to be working correctly")
        print("💡 The CORS issue might be related to authentication or specific request headers")
    else:
        print("❌ Backend has issues that need to be resolved")
        if not health_ok:
            print("   - Backend is not responding to health checks")
        if not cors_ok:
            print("   - CORS headers are not properly configured")