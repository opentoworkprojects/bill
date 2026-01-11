#!/usr/bin/env python3
"""
Simple script to check if the server is running and accessible
"""

import requests
import sys

def check_server():
    """Check if server is running"""
    try:
        print("🔍 Checking server status...")
        
        # Test root endpoint
        response = requests.get("http://localhost:8000/", timeout=5)
        print(f"✅ Server is running! Status: {response.status_code}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"📊 Server response: {data}")
            except:
                print(f"📊 Server response: {response.text[:200]}...")
        
        return True
        
    except requests.exceptions.ConnectionError:
        print("❌ Server is not running or not accessible on http://localhost:8000")
        print("\n💡 To start the server:")
        print("   cd backend")
        print("   python server.py")
        return False
        
    except requests.exceptions.Timeout:
        print("⏰ Server is running but responding slowly")
        return False
        
    except Exception as e:
        print(f"❌ Error checking server: {e}")
        return False

def check_endpoints():
    """Check key endpoints"""
    endpoints = [
        "/",
        "/docs", 
        "/auth/login",
        "/menu",
        "/inventory"
    ]
    
    print("\n🔍 Checking key endpoints...")
    
    for endpoint in endpoints:
        try:
            url = f"http://localhost:8000{endpoint}"
            response = requests.get(url, timeout=3)
            
            if response.status_code == 200:
                print(f"✅ {endpoint} - OK")
            elif response.status_code == 401:
                print(f"🔒 {endpoint} - Requires authentication (expected)")
            elif response.status_code == 422:
                print(f"📝 {endpoint} - Requires parameters (expected)")
            else:
                print(f"⚠️  {endpoint} - Status {response.status_code}")
                
        except Exception as e:
            print(f"❌ {endpoint} - Error: {e}")

if __name__ == "__main__":
    print("🧪 Server Connectivity Check")
    print("="*40)
    
    if check_server():
        check_endpoints()
        print("\n✅ Server is accessible! You can now run the full test suite.")
    else:
        print("\n❌ Please start the server first before running tests.")
        sys.exit(1)