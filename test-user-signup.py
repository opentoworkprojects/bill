#!/usr/bin/env python3
"""
Test script for user signup functionality
Tests all available signup methods and flows
"""
import requests
import json
import time
import random
import string

def generate_test_user():
    """Generate random test user data"""
    random_id = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
    return {
        "username": f"testuser_{random_id}",
        "email": f"test_{random_id}@example.com",
        "password": "testpass123",
        "role": "admin"
    }

def test_direct_registration():
    """Test direct registration without OTP"""
    print("🔐 Testing direct registration (no OTP)...")
    
    backend_url = "http://localhost:8000"
    user_data = generate_test_user()
    
    print(f"   Username: {user_data['username']}")
    print(f"   Email: {user_data['email']}")
    
    try:
        response = requests.post(f"{backend_url}/api/auth/register", 
                               json=user_data, 
                               timeout=10)
        
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code in [200, 201]:
            print("✅ Direct registration successful!")
            data = response.json()
            print(f"   User ID: {data.get('id', 'N/A')}")
            print(f"   Username: {data.get('username', 'N/A')}")
            print(f"   Email: {data.get('email', 'N/A')}")
            print(f"   Referral Code: {data.get('referral_code', 'N/A')}")
            return user_data
        else:
            print("❌ Direct registration failed!")
            try:
                error_data = response.json()
                print(f"   Error: {error_data}")
            except:
                print(f"   Raw response: {response.text}")
                
    except Exception as e:
        print(f"❌ Error testing direct registration: {e}")
    
    return None

def test_otp_registration():
    """Test OTP-based registration"""
    print("\n📧 Testing OTP-based registration...")
    
    backend_url = "http://localhost:8000"
    user_data = generate_test_user()
    
    print(f"   Username: {user_data['username']}")
    print(f"   Email: {user_data['email']}")
    
    try:
        # Step 1: Request OTP
        print("   Step 1: Requesting OTP...")
        response = requests.post(f"{backend_url}/api/auth/register-request", 
                               json=user_data, 
                               timeout=10)
        
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code in [200, 201]:
            print("✅ OTP request successful!")
            data = response.json()
            print(f"   Message: {data.get('message', 'N/A')}")
            
            # Check if debug OTP is provided
            if 'otp' in data:
                print(f"   Debug OTP: {data['otp']}")
                
                # Step 2: Verify OTP
                print("   Step 2: Verifying OTP...")
                verify_data = {
                    "email": user_data['email'],
                    "otp": data['otp']
                }
                
                verify_response = requests.post(f"{backend_url}/api/auth/verify-registration", 
                                              json=verify_data, 
                                              timeout=10)
                
                print(f"   Verify Status Code: {verify_response.status_code}")
                
                if verify_response.status_code in [200, 201]:
                    print("✅ OTP verification successful!")
                    verify_data = verify_response.json()
                    print(f"   Verify Message: {verify_data.get('message', 'N/A')}")
                    return user_data
                else:
                    print("❌ OTP verification failed!")
                    try:
                        error_data = verify_response.json()
                        print(f"   Verify Error: {error_data}")
                    except:
                        print(f"   Verify Raw response: {verify_response.text}")
            else:
                print("   No debug OTP provided - check email for OTP")
                
        else:
            print("❌ OTP request failed!")
            try:
                error_data = response.json()
                print(f"   Error: {error_data}")
            except:
                print(f"   Raw response: {response.text}")
                
    except Exception as e:
        print(f"❌ Error testing OTP registration: {e}")
    
    return None

def test_debug_registration():
    """Test debug registration endpoint"""
    print("\n🐛 Testing debug registration...")
    
    backend_url = "http://localhost:8000"
    user_data = generate_test_user()
    
    print(f"   Username: {user_data['username']}")
    print(f"   Email: {user_data['email']}")
    
    try:
        response = requests.post(f"{backend_url}/api/auth/register-debug", 
                               json=user_data, 
                               timeout=10)
        
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code in [200, 201]:
            print("✅ Debug registration successful!")
            data = response.json()
            print(f"   Message: {data.get('message', 'N/A')}")
            print(f"   Debug OTP: {data.get('otp', 'N/A')}")
            return user_data
        else:
            print("❌ Debug registration failed!")
            try:
                error_data = response.json()
                print(f"   Error: {error_data}")
            except:
                print(f"   Raw response: {response.text}")
                
    except Exception as e:
        print(f"❌ Error testing debug registration: {e}")
    
    return None

def test_login_after_signup(user_data):
    """Test login with newly created user"""
    if not user_data:
        print("\n⚠️  Skipping login test - no user data available")
        return
        
    print(f"\n🔑 Testing login with new user: {user_data['username']}")
    
    backend_url = "http://localhost:8000"
    login_data = {
        "username": user_data['username'],
        "password": user_data['password']
    }
    
    try:
        response = requests.post(f"{backend_url}/api/auth/login", 
                               json=login_data, 
                               timeout=10)
        
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Login successful!")
            data = response.json()
            print(f"   Token received: {data.get('access_token', 'N/A')[:50]}...")
            print(f"   User: {data.get('user', {}).get('username', 'N/A')}")
        else:
            print("❌ Login failed!")
            try:
                error_data = response.json()
                print(f"   Error: {error_data}")
            except:
                print(f"   Raw response: {response.text}")
                
    except Exception as e:
        print(f"❌ Error testing login: {e}")

def test_referral_code_signup():
    """Test signup with referral code"""
    print("\n🎁 Testing signup with referral code...")
    
    backend_url = "http://localhost:8000"
    user_data = generate_test_user()
    user_data['referral_code'] = 'TESTCODE'  # Use a test referral code
    
    print(f"   Username: {user_data['username']}")
    print(f"   Email: {user_data['email']}")
    print(f"   Referral Code: {user_data['referral_code']}")
    
    try:
        response = requests.post(f"{backend_url}/api/auth/register", 
                               json=user_data, 
                               timeout=10)
        
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code in [200, 201]:
            print("✅ Referral signup successful!")
            data = response.json()
            print(f"   User ID: {data.get('id', 'N/A')}")
            print(f"   Referred By: {data.get('referred_by', 'N/A')}")
        else:
            print("ℹ️  Referral signup response (may be expected if code is invalid):")
            try:
                error_data = response.json()
                print(f"   Response: {error_data}")
            except:
                print(f"   Raw response: {response.text}")
                
    except Exception as e:
        print(f"❌ Error testing referral signup: {e}")

def test_duplicate_signup():
    """Test duplicate user signup"""
    print("\n🔄 Testing duplicate user signup...")
    
    backend_url = "http://localhost:8000"
    user_data = {
        "username": "duplicate_test",
        "email": "duplicate@example.com",
        "password": "testpass123",
        "role": "admin"
    }
    
    print(f"   Username: {user_data['username']}")
    print(f"   Email: {user_data['email']}")
    
    try:
        # First signup
        print("   First signup attempt...")
        response1 = requests.post(f"{backend_url}/api/auth/register", 
                                json=user_data, 
                                timeout=10)
        
        print(f"   First Status Code: {response1.status_code}")
        
        # Second signup (should fail)
        print("   Second signup attempt (should fail)...")
        response2 = requests.post(f"{backend_url}/api/auth/register", 
                                json=user_data, 
                                timeout=10)
        
        print(f"   Second Status Code: {response2.status_code}")
        
        if response2.status_code in [400, 409, 422]:
            print("✅ Duplicate signup properly rejected!")
            try:
                error_data = response2.json()
                print(f"   Error message: {error_data}")
            except:
                print(f"   Raw response: {response2.text}")
        else:
            print("⚠️  Duplicate signup not properly handled")
                
    except Exception as e:
        print(f"❌ Error testing duplicate signup: {e}")

if __name__ == "__main__":
    print("🧪 Testing User Signup Functionality")
    print("=" * 50)
    
    # Test different signup methods
    user1 = test_direct_registration()
    user2 = test_otp_registration()
    user3 = test_debug_registration()
    
    # Test login with created users
    test_login_after_signup(user1)
    
    # Test edge cases
    test_referral_code_signup()
    test_duplicate_signup()
    
    print("\n📝 Summary:")
    print("   - Direct registration: /api/auth/register")
    print("   - OTP registration: /api/auth/register-request + /api/auth/verify-registration")
    print("   - Debug registration: /api/auth/register-debug")
    print("   - All methods should create users with referral codes")
    print("   - Users should be able to login after successful registration")