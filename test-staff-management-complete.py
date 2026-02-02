#!/usr/bin/env python3
"""
Comprehensive Staff Management Test Script
Tests all staff management endpoints and identifies potential errors
"""
import requests
import json
import time
import random
import string

BACKEND_URL = "https://restro-ai.onrender.com"
API_BASE = f"{BACKEND_URL}/api"

# Test credentials (replace with actual admin credentials)
ADMIN_CREDENTIALS = {
    "username": "admin",  # Replace with actual admin username
    "password": "admin123"  # Replace with actual admin password
}

def generate_test_data():
    """Generate random test data for staff creation"""
    random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
    return {
        "username": f"teststaff_{random_suffix}",
        "email": f"teststaff_{random_suffix}@example.com",
        "password": "testpass123",
        "role": "waiter",
        "phone": f"+91987654{random.randint(1000, 9999)}",
        "salary": random.randint(15000, 35000)
    }

def login_admin():
    """Login as admin and get auth token"""
    try:
        print("🔐 Logging in as admin...")
        response = requests.post(f"{API_BASE}/auth/login", json=ADMIN_CREDENTIALS, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            user_data = data.get("user", {})
            print(f"✅ Admin login successful: {user_data.get('username')} (Role: {user_data.get('role')})")
            return token, user_data
        else:
            print(f"❌ Admin login failed: {response.status_code} - {response.text}")
            return None, None
    except Exception as e:
        print(f"❌ Admin login error: {e}")
        return None, None

def test_staff_list(token):
    """Test fetching staff list"""
    try:
        print("\n📋 Testing staff list endpoint...")
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{API_BASE}/staff", headers=headers, timeout=10)
        
        if response.status_code == 200:
            staff_list = response.json()
            print(f"✅ Staff list retrieved: {len(staff_list)} staff members")
            return True, staff_list
        else:
            print(f"❌ Staff list failed: {response.status_code} - {response.text}")
            return False, []
    except Exception as e:
        print(f"❌ Staff list error: {e}")
        return False, []

def test_staff_create_request(token, staff_data):
    """Test staff creation request (OTP sending)"""
    try:
        print(f"\n📧 Testing staff creation request for {staff_data['email']}...")
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(f"{API_BASE}/staff/create-request", json=staff_data, headers=headers, timeout=15)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Staff creation request successful: {result.get('message')}")
            return True, result
        else:
            print(f"❌ Staff creation request failed: {response.status_code} - {response.text}")
            return False, None
    except Exception as e:
        print(f"❌ Staff creation request error: {e}")
        return False, None

def test_staff_verify_create(token, email, otp):
    """Test staff OTP verification"""
    try:
        print(f"\n🔐 Testing staff OTP verification for {email}...")
        headers = {"Authorization": f"Bearer {token}"}
        data = {"email": email, "otp": otp}
        response = requests.post(f"{API_BASE}/staff/verify-create", json=data, headers=headers, timeout=15)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Staff verification successful: {result.get('message')}")
            return True, result
        else:
            print(f"❌ Staff verification failed: {response.status_code} - {response.text}")
            return False, None
    except Exception as e:
        print(f"❌ Staff verification error: {e}")
        return False, None

def test_staff_create_direct(token, staff_data):
    """Test direct staff creation (skip verification)"""
    try:
        print(f"\n👤 Testing direct staff creation for {staff_data['email']}...")
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(f"{API_BASE}/staff/create", json=staff_data, headers=headers, timeout=15)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Direct staff creation successful: {result.get('message')}")
            return True, result
        else:
            print(f"❌ Direct staff creation failed: {response.status_code} - {response.text}")
            return False, None
    except Exception as e:
        print(f"❌ Direct staff creation error: {e}")
        return False, None

def test_edge_cases(token):
    """Test edge cases and error scenarios"""
    print("\n🧪 Testing edge cases...")
    
    # Test 1: Duplicate username
    print("\n1️⃣ Testing duplicate username...")
    duplicate_data = generate_test_data()
    duplicate_data["username"] = "admin"  # Use existing admin username
    success, _ = test_staff_create_direct(token, duplicate_data)
    if not success:
        print("✅ Duplicate username properly rejected")
    else:
        print("❌ Duplicate username should be rejected")
    
    # Test 2: Invalid email format
    print("\n2️⃣ Testing invalid email format...")
    invalid_email_data = generate_test_data()
    invalid_email_data["email"] = "invalid-email"
    success, _ = test_staff_create_request(token, invalid_email_data)
    if not success:
        print("✅ Invalid email properly rejected")
    else:
        print("❌ Invalid email should be rejected")
    
    # Test 3: Empty required fields
    print("\n3️⃣ Testing empty required fields...")
    empty_data = {
        "username": "",
        "email": "",
        "password": "",
        "role": "waiter"
    }
    success, _ = test_staff_create_direct(token, empty_data)
    if not success:
        print("✅ Empty required fields properly rejected")
    else:
        print("❌ Empty required fields should be rejected")
    
    # Test 4: Invalid OTP verification
    print("\n4️⃣ Testing invalid OTP...")
    success, _ = test_staff_verify_create(token, "nonexistent@example.com", "123456")
    if not success:
        print("✅ Invalid OTP properly rejected")
    else:
        print("❌ Invalid OTP should be rejected")

def test_optional_fields(token):
    """Test staff creation with and without optional fields"""
    print("\n🔧 Testing optional fields...")
    
    # Test 1: Staff with all fields
    print("\n1️⃣ Testing staff with all fields...")
    full_data = generate_test_data()
    success, _ = test_staff_create_direct(token, full_data)
    if success:
        print("✅ Staff with all fields created successfully")
    else:
        print("❌ Staff with all fields should be created")
    
    # Test 2: Staff without phone and salary
    print("\n2️⃣ Testing staff without optional fields...")
    minimal_data = generate_test_data()
    del minimal_data["phone"]
    del minimal_data["salary"]
    success, _ = test_staff_create_direct(token, minimal_data)
    if success:
        print("✅ Staff without optional fields created successfully")
    else:
        print("❌ Staff without optional fields should be created")
    
    # Test 3: Staff with empty optional fields
    print("\n3️⃣ Testing staff with empty optional fields...")
    empty_optional_data = generate_test_data()
    empty_optional_data["phone"] = ""
    empty_optional_data["salary"] = None
    success, _ = test_staff_create_direct(token, empty_optional_data)
    if success:
        print("✅ Staff with empty optional fields created successfully")
    else:
        print("❌ Staff with empty optional fields should be created")

def test_authentication_scenarios(token):
    """Test authentication-related scenarios"""
    print("\n🔒 Testing authentication scenarios...")
    
    # Test 1: Request without token
    print("\n1️⃣ Testing request without authentication...")
    try:
        response = requests.get(f"{API_BASE}/staff", timeout=10)
        if response.status_code == 401 or response.status_code == 403:
            print("✅ Unauthenticated request properly rejected")
        else:
            print(f"❌ Unauthenticated request should be rejected: {response.status_code}")
    except Exception as e:
        print(f"❌ Authentication test error: {e}")
    
    # Test 2: Request with invalid token
    print("\n2️⃣ Testing request with invalid token...")
    try:
        headers = {"Authorization": "Bearer invalid_token_12345"}
        response = requests.get(f"{API_BASE}/staff", headers=headers, timeout=10)
        if response.status_code == 401 or response.status_code == 403:
            print("✅ Invalid token properly rejected")
        else:
            print(f"❌ Invalid token should be rejected: {response.status_code}")
    except Exception as e:
        print(f"❌ Invalid token test error: {e}")

def main():
    """Main test execution"""
    print("🧪 COMPREHENSIVE STAFF MANAGEMENT TEST")
    print("=" * 50)
    
    # Step 1: Login as admin
    token, user_data = login_admin()
    if not token:
        print("❌ Cannot proceed without admin authentication")
        return
    
    # Step 2: Test staff list
    list_success, current_staff = test_staff_list(token)
    
    # Step 3: Test authentication scenarios
    test_authentication_scenarios(token)
    
    # Step 4: Test edge cases
    test_edge_cases(token)
    
    # Step 5: Test optional fields
    test_optional_fields(token)
    
    # Step 6: Test OTP flow (if user wants to test manually)
    print("\n📧 OTP FLOW TEST (Manual)")
    print("-" * 30)
    test_data = generate_test_data()
    print(f"Generated test staff data: {json.dumps(test_data, indent=2)}")
    
    otp_success, otp_result = test_staff_create_request(token, test_data)
    if otp_success:
        print(f"\n🔐 OTP has been sent to {test_data['email']}")
        print("📝 To complete the test:")
        print(f"   1. Check the backend logs for the OTP")
        print(f"   2. Use this command to verify:")
        print(f"   curl -X POST {API_BASE}/staff/verify-create \\")
        print(f"        -H 'Authorization: Bearer {token}' \\")
        print(f"        -H 'Content-Type: application/json' \\")
        print(f"        -d '{{\"email\": \"{test_data['email']}\", \"otp\": \"YOUR_OTP_HERE\"}}'")
    
    # Step 7: Final staff list check
    print("\n📋 Final staff list check...")
    final_success, final_staff = test_staff_list(token)
    if final_success and list_success:
        new_count = len(final_staff) - len(current_staff)
        print(f"📊 Staff count change: +{new_count} new staff members")
    
    print("\n" + "=" * 50)
    print("🏁 TEST COMPLETE")
    print("Check the output above for any ❌ errors that need attention")

if __name__ == "__main__":
    main()