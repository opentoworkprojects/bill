#!/usr/bin/env python3
"""
Test the live backend endpoint to see what it's actually returning
"""

import requests
import json

BACKEND_URL = "http://localhost:8000"

def test_live_backend():
    """Test the live backend endpoints"""
    
    print("🧪 Testing Live Backend Endpoints")
    print("=" * 40)
    
    # Test if backend is running
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=5)
        print(f"✅ Backend is running: {response.status_code}")
    except:
        print(f"❌ Backend is not running on {BACKEND_URL}")
        return False
    
    # We need to authenticate to test the orders endpoints
    # Let's try to get some basic info first
    
    print(f"\n🔍 Testing public endpoints...")
    
    # Test a public endpoint to see if backend is responding
    try:
        # Try to get QR data for a table (this is public)
        response = requests.get(f"{BACKEND_URL}/api/public/qr/test-org/1", timeout=5)
        print(f"📊 QR endpoint response: {response.status_code}")
        
        if response.status_code == 404:
            print(f"   Expected 404 for test org - backend is responding")
        
    except Exception as e:
        print(f"❌ Error testing backend: {e}")
        return False
    
    print(f"\n💡 Backend is running, but we need authentication to test order endpoints")
    print(f"   The issue might be:")
    print(f"   1. Frontend is using cached data")
    print(f"   2. Backend server needs restart to load new code")
    print(f"   3. Browser cache needs to be cleared")
    
    return True

if __name__ == "__main__":
    print("🚀 Live Backend Test")
    print("Testing if the backend is running with updated code")
    print()
    
    success = test_live_backend()
    
    print("\n" + "=" * 40)
    if success:
        print("✅ Backend is responding")
        print("\n🔧 Next steps to fix the issue:")
        print("   1. Restart the backend server to load new code")
        print("   2. Clear browser cache and refresh the frontend")
        print("   3. Check if the user is looking at cached data")
    else:
        print("❌ Backend is not responding")
        print("   Start the backend server first")