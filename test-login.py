#!/usr/bin/env python3
"""
Test login with actual credentials from .env
"""
import requests
import json

def test_super_admin_login():
    """Test login with super admin credentials"""
    try:
        backend_url = "http://localhost:8000"
        
        # Super admin credentials from .env
        login_data = {
            "username": "shiv@123",
            "password": "shiv"
        }
        
        print("🔐 Testing super admin login...")
        print(f"   Username: {login_data['username']}")
        print(f"   Password: {login_data['password']}")
        
        response = requests.post(f"{backend_url}/api/auth/login", 
                               json=login_data, 
                               timeout=10)
        
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Super admin login successful!")
            data = response.json()
            print(f"   Token received: {data.get('access_token', 'N/A')[:50]}...")
            print(f"   User: {data.get('user', {}).get('username', 'N/A')}")
        else:
            print("❌ Super admin login failed!")
            try:
                error_data = response.json()
                print(f"   Error: {error_data}")
            except:
                print(f"   Raw response: {response.text}")
                
    except Exception as e:
        print(f"❌ Error testing super admin login: {e}")

def test_regular_signup():
    """Test regular user signup"""
    try:
        backend_url = "http://localhost:8000"
        
        # Test user signup
        signup_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpass123"
        }
        
        print("\n📝 Testing regular user signup...")
        
        response = requests.post(f"{backend_url}/api/auth/signup", 
                               json=signup_data, 
                               timeout=10)
        
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code in [200, 201]:
            print("✅ Signup successful!")
            data = response.json()
            print(f"   Response: {data}")
        else:
            print("ℹ️  Signup response (may be expected if user exists):")
            try:
                error_data = response.json()
                print(f"   Response: {error_data}")
            except:
                print(f"   Raw response: {response.text}")
                
    except Exception as e:
        print(f"❌ Error testing signup: {e}")

if __name__ == "__main__":
    test_super_admin_login()
    test_regular_signup()