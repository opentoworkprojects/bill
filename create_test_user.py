#!/usr/bin/env python3
"""
Quick script to create a test user and get authentication token
"""
import requests
import json
import sys

API_BASE = "http://localhost:10000/api"

def create_test_user():
    """Create a test user for development"""
    user_data = {
        "username": "testuser",
        "email": "test@example.com", 
        "password": "testpass123",
        "business_name": "Test Restaurant"
    }
    
    try:
        print("🔄 Creating test user...")
        response = requests.post(f"{API_BASE}/auth/register", json=user_data, timeout=10)
        
        if response.status_code == 201:
            print("✅ Test user created successfully!")
            return user_data
        elif response.status_code == 400 and "already exists" in response.text.lower():
            print("ℹ️ Test user already exists, proceeding with login...")
            return user_data
        else:
            print(f"❌ Failed to create user: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error creating user: {e}")
        return None

def login_test_user(user_data):
    """Login with test user and get token"""
    login_data = {
        "username": user_data["username"],
        "password": user_data["password"]
    }
    
    try:
        print("🔄 Logging in test user...")
        response = requests.post(f"{API_BASE}/auth/login", json=login_data, timeout=10)
        
        if response.status_code == 200:
            token_data = response.json()
            token = token_data.get("access_token")
            print(f"✅ Login successful!")
            print(f"🔑 Token: {token[:50]}...")
            return token
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error logging in: {e}")
        return None

def test_authenticated_request(token):
    """Test an authenticated request"""
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        print("🔄 Testing authenticated request...")
        response = requests.get(f"{API_BASE}/auth/me", headers=headers, timeout=10)
        
        if response.status_code == 200:
            user_info = response.json()
            print(f"✅ Authenticated request successful!")
            print(f"👤 User: {user_info.get('username')} ({user_info.get('email')})")
            return True
        else:
            print(f"❌ Authenticated request failed: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing authenticated request: {e}")
        return False

def main():
    print("🚀 Setting up test authentication...")
    
    # Step 1: Create test user
    user_data = create_test_user()
    if not user_data:
        print("❌ Failed to create test user")
        sys.exit(1)
    
    # Step 2: Login and get token
    token = login_test_user(user_data)
    if not token:
        print("❌ Failed to get authentication token")
        sys.exit(1)
    
    # Step 3: Test authenticated request
    if test_authenticated_request(token):
        print("\n✅ Authentication setup complete!")
        print(f"📋 Test credentials:")
        print(f"   Username: {user_data['username']}")
        print(f"   Password: {user_data['password']}")
        print(f"   Email: {user_data['email']}")
        print(f"\n🔑 Token for manual testing:")
        print(f"   {token}")
        
        # Save token to file for easy access
        with open("test_token.txt", "w") as f:
            f.write(token)
        print(f"\n💾 Token saved to test_token.txt")
        
    else:
        print("❌ Authentication test failed")
        sys.exit(1)

if __name__ == "__main__":
    main()