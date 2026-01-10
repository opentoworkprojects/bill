#!/usr/bin/env python3
"""
Test Super Admin Login
"""

import requests
import os
import sys

def test_super_admin_login():
    """Test super admin login with correct credentials"""
    
    # Use the correct credentials from .env file
    username = "shiv@123"
    password = "shiv"
    
    print(f"🔐 Testing super admin login...")
    print(f"   Username: {username}")
    print(f"   Password: {'*' * len(password)}")
    
    # Test the endpoint
    try:
        # Assuming server is running on localhost:8000
        base_url = "http://localhost:8000"
        
        response = requests.get(
            f"{base_url}/api/super-admin/dashboard",
            params={
                "username": username,
                "password": password
            },
            timeout=10
        )
        
        if response.status_code == 200:
            print("✅ Super admin login successful!")
            data = response.json()
            print(f"   Total users: {data.get('overview', {}).get('total_users', 'N/A')}")
            return True
        elif response.status_code == 403:
            print("❌ Super admin login failed: Invalid credentials")
            print(f"   Response: {response.text}")
            return False
        else:
            print(f"❌ Super admin login failed: HTTP {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server. Is the backend running?")
        print("   Start server with: cd backend && python server.py")
        return False
    except Exception as e:
        print(f"❌ Error testing super admin login: {e}")
        return False

def main():
    print("🔧 BillByteKOT Super Admin Login Test")
    print("=" * 50)
    
    success = test_super_admin_login()
    
    if success:
        print("\n🎉 Super admin login is working correctly!")
        print("\nTo access super admin panel:")
        print("1. Go to the frontend application")
        print("2. Navigate to /ops or super admin page")
        print("3. Use the credentials from .env file")
    else:
        print("\n⚠️ Super admin login needs attention")
        print("\nTroubleshooting:")
        print("1. Make sure backend server is running")
        print("2. Check .env file has correct credentials")
        print("3. Verify super admin router is included")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)