#!/usr/bin/env python3
"""
Real-time Staff Management Debugging
Monitors backend logs and tests specific scenarios
"""
import requests
import json
import time

BACKEND_URL = "https://restro-ai.onrender.com"
API_BASE = f"{BACKEND_URL}/api"

def test_current_user_auth():
    """Test what happens when we try to access staff endpoints"""
    print("🔍 DEBUGGING CURRENT STAFF MANAGEMENT ISSUE")
    print("=" * 50)
    
    # Test 1: Check if we can access staff endpoint without auth
    print("\n1️⃣ Testing staff endpoint without authentication:")
    try:
        response = requests.get(f"{API_BASE}/staff", timeout=10)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")
        
        if response.status_code == 403:
            print("   ✅ Authentication required (expected)")
        elif response.status_code == 500:
            print("   ❌ INTERNAL SERVER ERROR - backend issue")
        else:
            print(f"   ⚠️  Unexpected status: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Connection error: {e}")
    
    # Test 2: Try to create staff without auth
    print("\n2️⃣ Testing staff creation without authentication:")
    test_data = {
        "username": "debugtest",
        "email": "debug@example.com",
        "password": "test123",
        "role": "waiter"
    }
    
    try:
        response = requests.post(f"{API_BASE}/staff/create-request", json=test_data, timeout=10)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")
        
        if response.status_code == 403:
            print("   ✅ Authentication required (expected)")
        elif response.status_code == 500:
            print("   ❌ INTERNAL SERVER ERROR - backend issue")
        else:
            print(f"   ⚠️  Unexpected status: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Connection error: {e}")
    
    # Test 3: Check backend health
    print("\n3️⃣ Testing backend health:")
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=10)
        if response.status_code == 200:
            health = response.json()
            print(f"   ✅ Backend healthy")
            print(f"   Database: {health.get('services', {}).get('database')}")
            print(f"   API: {health.get('services', {}).get('api')}")
        else:
            print(f"   ❌ Backend unhealthy: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Health check error: {e}")
    
    # Test 4: Check CORS for staff endpoints
    print("\n4️⃣ Testing CORS for staff endpoints:")
    try:
        response = requests.options(
            f"{API_BASE}/staff/create-request",
            headers={
                'Origin': 'https://billbytekot.in',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type,Authorization'
            },
            timeout=10
        )
        
        print(f"   Status: {response.status_code}")
        cors_origin = response.headers.get('access-control-allow-origin')
        cors_methods = response.headers.get('access-control-allow-methods')
        cors_headers = response.headers.get('access-control-allow-headers')
        
        print(f"   Allow-Origin: {cors_origin}")
        print(f"   Allow-Methods: {cors_methods}")
        print(f"   Allow-Headers: {cors_headers}")
        
        if cors_origin and 'billbytekot.in' in cors_origin:
            print("   ✅ CORS properly configured")
        else:
            print("   ❌ CORS issue detected")
    except Exception as e:
        print(f"   ❌ CORS test error: {e}")

def check_common_issues():
    """Check for common issues that prevent staff creation"""
    print("\n\n🔧 CHECKING COMMON ISSUES")
    print("=" * 30)
    
    issues_found = []
    
    # Check 1: Backend accessibility
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=5)
        if response.status_code != 200:
            issues_found.append("Backend not responding properly")
    except:
        issues_found.append("Backend not accessible")
    
    # Check 2: Staff endpoints returning 500
    try:
        response = requests.post(f"{API_BASE}/staff/create-request", json={
            "username": "test", "email": "test@example.com", "password": "test", "role": "waiter"
        }, timeout=5)
        if response.status_code == 500:
            issues_found.append("Staff endpoints returning 500 errors")
    except:
        pass
    
    # Check 3: CORS issues
    try:
        response = requests.options(f"{API_BASE}/staff", headers={'Origin': 'https://billbytekot.in'}, timeout=5)
        if not response.headers.get('access-control-allow-origin'):
            issues_found.append("CORS not configured properly")
    except:
        issues_found.append("CORS preflight failing")
    
    if issues_found:
        print("❌ Issues found:")
        for issue in issues_found:
            print(f"   - {issue}")
    else:
        print("✅ No obvious backend issues detected")
        print("   The issue might be in the frontend or authentication")

def provide_debugging_steps():
    """Provide debugging steps for the user"""
    print("\n\n🛠️  DEBUGGING STEPS FOR USER")
    print("=" * 35)
    
    print("1️⃣ Check Browser Console:")
    print("   - Open Developer Tools (F12)")
    print("   - Go to Console tab")
    print("   - Try to add staff and look for errors")
    print("   - Look for CORS, 500, or authentication errors")
    
    print("\n2️⃣ Check Network Tab:")
    print("   - Open Developer Tools (F12)")
    print("   - Go to Network tab")
    print("   - Try to add staff")
    print("   - Check if requests are being made")
    print("   - Check response status codes")
    
    print("\n3️⃣ Verify Login Status:")
    print("   - Make sure you're logged in as admin")
    print("   - Check if token is in localStorage")
    print("   - Try refreshing the page and logging in again")
    
    print("\n4️⃣ Test Different Scenarios:")
    print("   - Try with minimal data (just username, email, password)")
    print("   - Try with all fields filled")
    print("   - Try the 'Skip Verification' option")
    
    print("\n5️⃣ Check Backend Logs:")
    print("   - Look at the backend logs for any errors")
    print("   - Check if OTP emails are being sent")
    print("   - Look for database connection issues")

def main():
    """Main debugging function"""
    test_current_user_auth()
    check_common_issues()
    provide_debugging_steps()
    
    print("\n" + "=" * 50)
    print("🏁 DEBUGGING COMPLETE")
    print("\nPlease share:")
    print("1. Browser console errors when trying to add staff")
    print("2. Network tab showing the failed requests")
    print("3. What exactly happens when you click 'Add Staff'")
    print("4. Are you logged in as admin?")

if __name__ == "__main__":
    main()