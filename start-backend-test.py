#!/usr/bin/env python3
"""
Helper script to start backend and test customer balance functionality
"""
import subprocess
import time
import requests
import os
import sys
from pathlib import Path

def find_backend_directory():
    """Find the backend directory"""
    possible_paths = [
        "backend",
        "./backend", 
        "../backend",
        "../../backend"
    ]
    
    for path in possible_paths:
        if os.path.exists(os.path.join(path, "server.py")):
            return path
    
    return None

def check_backend_running():
    """Check if backend is already running"""
    try:
        response = requests.get("http://localhost:8000/health", timeout=2)
        return response.status_code == 200
    except:
        return False

def start_backend():
    """Start the backend server"""
    backend_dir = find_backend_directory()
    
    if not backend_dir:
        print("❌ Backend directory not found!")
        print("Please make sure you're running this from the project root directory")
        return None
    
    print(f"📁 Found backend directory: {backend_dir}")
    
    # Check if server.py exists
    server_path = os.path.join(backend_dir, "server.py")
    if not os.path.exists(server_path):
        print(f"❌ server.py not found in {backend_dir}")
        return None
    
    print("🚀 Starting backend server...")
    
    try:
        # Start the backend server
        process = subprocess.Popen([
            sys.executable, "server.py"
        ], cwd=backend_dir, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        # Wait a bit for server to start
        print("⏳ Waiting for server to start...")
        time.sleep(3)
        
        # Check if it's running
        if check_backend_running():
            print("✅ Backend server started successfully!")
            return process
        else:
            print("❌ Backend server failed to start")
            stdout, stderr = process.communicate(timeout=1)
            print(f"STDOUT: {stdout.decode()}")
            print(f"STDERR: {stderr.decode()}")
            return None
            
    except Exception as e:
        print(f"❌ Error starting backend: {e}")
        return None

def test_customer_balance_endpoint():
    """Test the customer balance endpoint"""
    print("\n🧪 Testing customer balance endpoint...")
    
    try:
        response = requests.get("http://localhost:8000/reports/customer-balances", timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Customer balance endpoint working!")
            print(f"📊 Found {len(data)} customers with outstanding balances")
            
            if data:
                print("\n📋 Customer balance data:")
                for i, customer in enumerate(data[:3]):
                    print(f"  {i+1}. {customer.get('customer_name', 'Unknown')}")
                    print(f"     Phone: {customer.get('customer_phone', 'N/A')}")
                    print(f"     Balance: ₹{customer.get('balance_amount', 0)}")
            else:
                print("ℹ️  No customers with outstanding balances")
                print("💡 Create some credit orders to see customer balances")
            
            return True
            
        elif response.status_code == 401:
            print("🔐 Authentication required")
            print("💡 You may need to login first")
            return False
        else:
            print(f"❌ Endpoint returned status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing endpoint: {e}")
        return False

def main():
    print("🏪 RESTAURANT BACKEND STARTER & CUSTOMER BALANCE TESTER")
    print("=" * 60)
    
    # Check if backend is already running
    if check_backend_running():
        print("✅ Backend server is already running!")
    else:
        print("🔍 Backend server not running, attempting to start...")
        process = start_backend()
        
        if not process:
            print("\n❌ Failed to start backend server")
            print("\n💡 Manual steps:")
            print("1. Navigate to the backend directory")
            print("2. Install dependencies: pip install -r requirements.txt")
            print("3. Start server: python server.py")
            return
    
    # Test the customer balance endpoint
    success = test_customer_balance_endpoint()
    
    if success:
        print("\n🎉 Customer balance functionality is working!")
        print("\n📱 Next steps:")
        print("1. Open the frontend application")
        print("2. Navigate to Reports > Customer Balance tab")
        print("3. You should see customer balance data")
        print("4. Create credit orders to test with real data")
    else:
        print("\n❌ Customer balance endpoint not working properly")
        print("\n🔧 Troubleshooting:")
        print("1. Check if the backend server is running properly")
        print("2. Verify the endpoint exists in server.py")
        print("3. Check authentication requirements")
    
    print(f"\n📅 Test completed at: {time.strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⏹️  Test interrupted by user")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)