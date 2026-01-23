#!/usr/bin/env python3
"""
Test script to verify backend-frontend connection
"""
import requests
import json

def test_backend_connection():
    """Test if backend is responding"""
    try:
        # Test backend health
        backend_url = "http://localhost:8000"
        response = requests.get(f"{backend_url}/api/health", timeout=5)
        
        if response.status_code == 200:
            print("✅ Backend is running and responding")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Backend responded with status {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend - is it running on port 8000?")
    except requests.exceptions.Timeout:
        print("❌ Backend connection timed out")
    except Exception as e:
        print(f"❌ Error testing backend: {e}")

def test_frontend_connection():
    """Test if frontend is responding"""
    try:
        frontend_url = "http://localhost:3000"
        response = requests.get(frontend_url, timeout=5)
        
        if response.status_code == 200:
            print("✅ Frontend is running and responding")
        else:
            print(f"❌ Frontend responded with status {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to frontend - is it running on port 3000?")
    except requests.exceptions.Timeout:
        print("❌ Frontend connection timed out")
    except Exception as e:
        print(f"❌ Error testing frontend: {e}")

def test_auth_endpoint():
    """Test authentication endpoint"""
    try:
        backend_url = "http://localhost:8000"
        
        # Test login endpoint
        login_data = {
            "username": "test@example.com",
            "password": "wrongpassword"
        }
        
        response = requests.post(f"{backend_url}/api/auth/login", 
                               json=login_data, 
                               timeout=5)
        
        if response.status_code in [400, 401, 422]:
            print("✅ Auth endpoint is responding (expected error for wrong credentials)")
        else:
            print(f"⚠️  Auth endpoint responded with unexpected status {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to auth endpoint")
    except Exception as e:
        print(f"❌ Error testing auth endpoint: {e}")

if __name__ == "__main__":
    print("🔍 Testing local development setup...")
    print()
    
    test_backend_connection()
    test_frontend_connection()
    test_auth_endpoint()
    
    print()
    print("📝 Summary:")
    print("   - Backend should be running on http://localhost:8000")
    print("   - Frontend should be running on http://localhost:3000")
    print("   - Frontend should connect to backend via REACT_APP_BACKEND_URL")