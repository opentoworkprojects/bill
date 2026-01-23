#!/usr/bin/env python3
"""
Test referral code signup functionality
Tests signup with valid codes, invalid codes, and without codes
"""
import requests
import json
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

def create_referrer_user():
    """Create a user to get a valid referral code"""
    print("🎯 Creating referrer user to get valid referral code...")
    
    backend_url = "http://localhost:8000"
    user_data = generate_test_user()
    
    try:
        response = requests.post(f"{backend_url}/api/auth/register", 
                               json=user_data, 
                               timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            referral_code = data.get('referral_code')
            print(f"✅ Referrer created: {user_data['username']}")
            print(f"   Referral Code: {referral_code}")
            return referral_code, user_data
        else:
            print(f"❌ Failed to create referrer: {response.status_code}")
            return None, None
            
    except Exception as e:
        print(f"❌ Error creating referrer: {e}")
        return None, None

def test_signup_without_referral():
    """Test signup without any referral code"""
    print("\n🔐 Testing signup WITHOUT referral code...")
    
    backend_url = "http://localhost:8000"
    user_data = generate_test_user()
    
    print(f"   Username: {user_data['username']}")
    print(f"   Email: {user_data['email']}")
    print(f"   Referral Code: None")
    
    try:
        response = requests.post(f"{backend_url}/api/auth/register", 
                               json=user_data, 
                               timeout=10)
        
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Signup without referral code successful!")
            data = response.json()
            print(f"   User ID: {data.get('id', 'N/A')}")
            print(f"   Own Referral Code: {data.get('referral_code', 'N/A')}")
            print(f"   Referred By: {data.get('referred_by', 'None')}")
            return True
        else:
            print("❌ Signup failed!")
            try:
                error_data = response.json()
                print(f"   Error: {error_data}")
            except:
                print(f"   Raw response: {response.text}")
            return False
                
    except Exception as e:
        print(f"❌ Error testing signup without referral: {e}")
        return False

def test_signup_with_valid_referral(referral_code):
    """Test signup with a valid referral code"""
    print(f"\n🎁 Testing signup WITH valid referral code: {referral_code}")
    
    backend_url = "http://localhost:8000"
    user_data = generate_test_user()
    user_data['referral_code'] = referral_code
    
    print(f"   Username: {user_data['username']}")
    print(f"   Email: {user_data['email']}")
    print(f"   Referral Code: {referral_code}")
    
    try:
        response = requests.post(f"{backend_url}/api/auth/register", 
                               json=user_data, 
                               timeout=10)
        
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Signup with valid referral code successful!")
            data = response.json()
            print(f"   User ID: {data.get('id', 'N/A')}")
            print(f"   Own Referral Code: {data.get('referral_code', 'N/A')}")
            print(f"   Referred By: {data.get('referred_by', 'None')}")
            return True
        else:
            print("❌ Signup with referral failed!")
            try:
                error_data = response.json()
                print(f"   Error: {error_data}")
            except:
                print(f"   Raw response: {response.text}")
            return False
                
    except Exception as e:
        print(f"❌ Error testing signup with referral: {e}")
        return False

def test_signup_with_invalid_referral():
    """Test signup with an invalid referral code"""
    print("\n❌ Testing signup with INVALID referral code...")
    
    backend_url = "http://localhost:8000"
    user_data = generate_test_user()
    user_data['referral_code'] = 'INVALID1'  # Invalid code
    
    print(f"   Username: {user_data['username']}")
    print(f"   Email: {user_data['email']}")
    print(f"   Referral Code: INVALID1")
    
    try:
        response = requests.post(f"{backend_url}/api/auth/register", 
                               json=user_data, 
                               timeout=10)
        
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Signup completed (invalid referral ignored)")
            data = response.json()
            print(f"   User ID: {data.get('id', 'N/A')}")
            print(f"   Own Referral Code: {data.get('referral_code', 'N/A')}")
            print(f"   Referred By: {data.get('referred_by', 'None')}")
            return True
        else:
            print("ℹ️  Signup response:")
            try:
                error_data = response.json()
                print(f"   Response: {error_data}")
            except:
                print(f"   Raw response: {response.text}")
            return False
                
    except Exception as e:
        print(f"❌ Error testing signup with invalid referral: {e}")
        return False

def test_referral_validation_endpoint(referral_code):
    """Test the referral validation endpoint"""
    print(f"\n🔍 Testing referral validation endpoint...")
    
    backend_url = "http://localhost:8000"
    
    # Test valid code
    print(f"   Testing valid code: {referral_code}")
    try:
        response = requests.post(f"{backend_url}/api/referral/validate", 
                               json={
                                   "referral_code": referral_code,
                                   "new_user_email": "test@example.com"
                               }, 
                               timeout=10)
        
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Valid: {data.get('valid', False)}")
            print(f"   Discount: ₹{data.get('discount_amount', 0)}")
        else:
            print(f"   ❌ Validation failed: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Error validating referral: {e}")
    
    # Test invalid code
    print(f"   Testing invalid code: INVALID1")
    try:
        response = requests.post(f"{backend_url}/api/referral/validate", 
                               json={
                                   "referral_code": "INVALID1",
                                   "new_user_email": "test@example.com"
                               }, 
                               timeout=10)
        
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 400:
            data = response.json()
            print(f"   ✅ Correctly rejected invalid code")
            print(f"   Error: {data.get('detail', 'N/A')}")
        else:
            print(f"   ⚠️  Unexpected response: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Error validating invalid referral: {e}")

if __name__ == "__main__":
    print("🧪 Testing Referral Code Signup Functionality")
    print("=" * 60)
    
    # Step 1: Create a referrer to get a valid referral code
    valid_referral_code, referrer_data = create_referrer_user()
    
    # Step 2: Test signup without referral code
    success_no_ref = test_signup_without_referral()
    
    # Step 3: Test signup with valid referral code (if we have one)
    success_valid_ref = False
    if valid_referral_code:
        success_valid_ref = test_signup_with_valid_referral(valid_referral_code)
        test_referral_validation_endpoint(valid_referral_code)
    
    # Step 4: Test signup with invalid referral code
    success_invalid_ref = test_signup_with_invalid_referral()
    
    # Summary
    print("\n📝 SUMMARY:")
    print("=" * 60)
    print(f"✅ Signup WITHOUT referral code: {'WORKS' if success_no_ref else 'FAILED'}")
    print(f"✅ Signup WITH valid referral code: {'WORKS' if success_valid_ref else 'FAILED'}")
    print(f"✅ Signup WITH invalid referral code: {'WORKS' if success_invalid_ref else 'FAILED'}")
    
    print("\n🎯 KEY FEATURES:")
    print("   • Users can signup without any referral code")
    print("   • Users can signup with valid referral codes")
    print("   • Invalid referral codes are handled gracefully")
    print("   • All users get their own unique referral code")
    print("   • Referral validation endpoint available for frontend")