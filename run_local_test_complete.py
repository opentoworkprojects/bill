#!/usr/bin/env python3
"""
Complete local testing script for active orders fix
This script will:
1. Start the backend server
2. Provide instructions for frontend testing
3. Run API tests
4. Verify the fix is working
"""

import subprocess
import sys
import os
import time
import requests
import threading
import json
from datetime import datetime

class LocalTestRunner:
    def __init__(self):
        self.backend_process = None
        self.frontend_process = None
        self.test_results = {}
        
    def check_prerequisites(self):
        """Check if all prerequisites are met"""
        print("🔍 Checking prerequisites...")
        
        issues = []
        
        # Check Python version
        if sys.version_info < (3, 8):
            issues.append(f"Python 3.8+ required, found {sys.version_info.major}.{sys.version_info.minor}")
        
        # Check if backend directory exists
        if not os.path.exists("backend"):
            issues.append("backend directory not found")
        
        # Check if frontend directory exists
        if not os.path.exists("frontend"):
            issues.append("frontend directory not found")
        
        # Check if server.py exists
        if not os.path.exists("backend/server.py"):
            issues.append("backend/server.py not found")
        
        # Check if package.json exists
        if not os.path.exists("frontend/package.json"):
            issues.append("frontend/package.json not found")
        
        # Check if .env file exists in backend
        if not os.path.exists("backend/.env"):
            issues.append("backend/.env not found (copy from .env.example)")
        
        if issues:
            print("❌ Prerequisites check failed:")
            for issue in issues:
                print(f"   - {issue}")
            return False
        
        print("✅ All prerequisites met")
        return True
    
    def start_backend_server(self):
        """Start the backend server"""
        print("\n🚀 Starting backend server...")
        
        backend_dir = os.path.join(os.getcwd(), "backend")
        
        # Check for virtual environment
        venv_path = os.path.join(backend_dir, "venv")
        if os.path.exists(venv_path):
            if sys.platform == "win32":
                python_cmd = os.path.join(venv_path, "Scripts", "python.exe")
            else:
                python_cmd = os.path.join(venv_path, "bin", "python")
        else:
            python_cmd = sys.executable
        
        try:
            # Start backend server
            self.backend_process = subprocess.Popen(
                [python_cmd, "server.py"],
                cwd=backend_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                universal_newlines=True
            )
            
            # Wait for server to start
            print("⏳ Waiting for backend server to start...")
            time.sleep(5)
            
            # Check if server is running
            try:
                response = requests.get("http://localhost:8000/health", timeout=5)
                if response.status_code == 200:
                    print("✅ Backend server started successfully!")
                    return True
                else:
                    print(f"⚠️ Backend server responded with status: {response.status_code}")
                    return False
            except requests.exceptions.RequestException:
                print("❌ Backend server health check failed")
                return False
                
        except Exception as e:
            print(f"❌ Failed to start backend server: {e}")
            return False
    
    def test_backend_api(self):
        """Test the backend API endpoints"""
        print("\n🧪 Testing backend API...")
        
        # Test credentials - you'll need to update these
        login_data = {
            "email": "test@billbyte.com",  # Update with your test email
            "password": "test123"          # Update with your test password
        }
        
        try:
            # Test login
            print("🔐 Testing login...")
            login_response = requests.post("http://localhost:8000/auth/login", json=login_data, timeout=10)
            
            if login_response.status_code != 200:
                print(f"❌ Login failed: {login_response.status_code}")
                print("💡 Update the login credentials in this script")
                return False
            
            token = login_response.json().get("access_token")
            headers = {"Authorization": f"Bearer {token}"}
            
            print("✅ Login successful")
            
            # Test debug endpoint
            print("🔍 Testing debug endpoint...")
            debug_response = requests.get("http://localhost:8000/orders/debug-active", headers=headers, timeout=10)
            
            if debug_response.status_code == 200:
                debug_data = debug_response.json()
                print(f"✅ Debug endpoint working - {debug_data.get('total_orders', 0)} orders found")
                self.test_results['debug_endpoint'] = True
            else:
                print(f"❌ Debug endpoint failed: {debug_response.status_code}")
                self.test_results['debug_endpoint'] = False
            
            # Test active orders endpoint
            print("📋 Testing active orders endpoint...")
            orders_response = requests.get("http://localhost:8000/orders", headers=headers, timeout=10)
            
            if orders_response.status_code == 200:
                orders = orders_response.json()
                print(f"✅ Active orders endpoint working - {len(orders)} orders found")
                
                # Check for problematic orders
                problematic = []
                for order in orders:
                    status = order.get('status', '').lower()
                    payment_received = order.get('payment_received', 0) or 0
                    total = order.get('total', 0) or 0
                    
                    if (status in ['completed', 'paid', 'cancelled', 'billed', 'settled'] or 
                        (payment_received >= total and total > 0)):
                        problematic.append(order)
                
                if problematic:
                    print(f"🚨 FILTERING ISSUE: {len(problematic)} completed orders in active list!")
                    self.test_results['filtering'] = False
                else:
                    print("✅ Filtering working correctly - no completed orders in active list")
                    self.test_results['filtering'] = True
                    
            else:
                print(f"❌ Active orders endpoint failed: {orders_response.status_code}")
                self.test_results['filtering'] = False
            
            return True
            
        except Exception as e:
            print(f"❌ API testing failed: {e}")
            return False
    
    def provide_frontend_instructions(self):
        """Provide instructions for frontend testing"""
        print("\n🌐 Frontend Testing Instructions")
        print("=" * 50)
        print("1. Open a new terminal window")
        print("2. Navigate to the frontend directory:")
        print("   cd frontend")
        print("3. Install dependencies (if not already done):")
        print("   npm install")
        print("4. Start the frontend development server:")
        print("   npm start")
        print("5. The frontend will open at http://localhost:3000")
        print("6. It will automatically connect to the local backend at http://localhost:8000")
        print()
        print("🧪 Manual Testing Steps:")
        print("1. Login to the application")
        print("2. Go to Orders page")
        print("3. Check Active Orders tab - should only show pending/preparing/ready orders")
        print("4. Check Today's Bills tab - should show completed/paid orders")
        print("5. Create a test order and complete payment")
        print("6. Verify the order moves from Active to Today's Bills")
        print("7. Verify it doesn't reappear in Active Orders")
        print()
    
    def cleanup(self):
        """Clean up processes"""
        print("\n🧹 Cleaning up...")
        
        if self.backend_process:
            self.backend_process.terminate()
            print("✅ Backend server stopped")
        
        if self.frontend_process:
            self.frontend_process.terminate()
            print("✅ Frontend server stopped")
    
    def run_complete_test(self):
        """Run the complete test suite"""
        print("🚀 Complete Local Testing - Active Orders Fix")
        print("=" * 60)
        
        try:
            # Check prerequisites
            if not self.check_prerequisites():
                return False
            
            # Start backend server
            if not self.start_backend_server():
                return False
            
            # Test backend API
            if not self.test_backend_api():
                return False
            
            # Provide frontend instructions
            self.provide_frontend_instructions()
            
            # Show test results
            self.show_test_results()
            
            # Keep server running
            print("🔄 Backend server is running...")
            print("💡 Press Ctrl+C to stop all servers and exit")
            
            # Wait for user to stop
            try:
                while True:
                    time.sleep(1)
            except KeyboardInterrupt:
                print("\n🛑 Stopping servers...")
                return True
                
        except Exception as e:
            print(f"❌ Test failed: {e}")
            return False
        finally:
            self.cleanup()
    
    def show_test_results(self):
        """Show test results summary"""
        print("\n📊 Test Results Summary")
        print("=" * 30)
        
        all_passed = True
        
        for test_name, result in self.test_results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{test_name}: {status}")
            if not result:
                all_passed = False
        
        if all_passed:
            print("\n🎉 All backend tests passed!")
            print("🚀 Ready for frontend testing and production deployment")
        else:
            print("\n⚠️ Some tests failed - please fix issues before deploying")

def main():
    """Main function"""
    print("🧪 Local Testing Suite - Active Orders Fix")
    print("This will test the active orders filtering fix locally")
    print()
    
    # Update credentials reminder
    print("⚠️ IMPORTANT: Update test credentials in this script before running")
    print("   Look for login_data in test_backend_api() method")
    print()
    
    response = input("Continue with testing? (y/n): ").lower().strip()
    if response != 'y':
        print("Testing cancelled")
        return
    
    runner = LocalTestRunner()
    success = runner.run_complete_test()
    
    if success:
        print("\n✅ Local testing completed successfully!")
    else:
        print("\n❌ Local testing failed - check errors above")

if __name__ == "__main__":
    main()