#!/usr/bin/env python3
"""
Start local backend server for testing active orders fix
"""

import subprocess
import sys
import os
import time
import requests

def start_local_server():
    """Start the local backend server"""
    
    print("🚀 Starting Local Backend Server for Testing")
    print("=" * 50)
    
    # Check if we're in the right directory
    if not os.path.exists("backend"):
        print("❌ Error: backend directory not found")
        print("💡 Make sure you're running this from the project root directory")
        return False
    
    # Change to backend directory
    backend_dir = os.path.join(os.getcwd(), "backend")
    
    print(f"📁 Backend directory: {backend_dir}")
    
    # Check if virtual environment exists
    venv_path = os.path.join(backend_dir, "venv")
    if os.path.exists(venv_path):
        print("✅ Virtual environment found")
        if sys.platform == "win32":
            python_cmd = os.path.join(venv_path, "Scripts", "python.exe")
        else:
            python_cmd = os.path.join(venv_path, "bin", "python")
    else:
        print("⚠️ Virtual environment not found, using system Python")
        python_cmd = sys.executable
    
    # Check if server.py exists
    server_file = os.path.join(backend_dir, "server.py")
    if not os.path.exists(server_file):
        print("❌ Error: server.py not found in backend directory")
        return False
    
    print("✅ server.py found")
    
    # Start the server
    print("\n🚀 Starting server...")
    print("💡 Server will run on http://localhost:8000")
    print("💡 Press Ctrl+C to stop the server")
    print("💡 Open another terminal to run the test script")
    print()
    
    try:
        # Start server process
        cmd = [python_cmd, "server.py"]
        process = subprocess.Popen(
            cmd,
            cwd=backend_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True,
            bufsize=1
        )
        
        print("🔄 Server starting...")
        
        # Wait a bit for server to start
        time.sleep(3)
        
        # Check if server is running
        try:
            response = requests.get("http://localhost:8000/health", timeout=5)
            if response.status_code == 200:
                print("✅ Server is running successfully!")
                print("🌐 Server URL: http://localhost:8000")
                print("📊 Health check: ✅ Passed")
            else:
                print(f"⚠️ Server responded with status: {response.status_code}")
        except requests.exceptions.RequestException:
            print("⚠️ Server health check failed, but it might still be starting...")
        
        print("\n" + "=" * 50)
        print("🧪 NOW RUN THE TEST SCRIPT:")
        print("   python test_local_active_orders_fix.py")
        print("=" * 50)
        print()
        
        # Keep server running and show output
        for line in process.stdout:
            print(line.rstrip())
            
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
        process.terminate()
        return True
        
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        return False

def check_requirements():
    """Check if all requirements are met"""
    
    print("🔍 Checking requirements...")
    
    # Check Python version
    python_version = sys.version_info
    if python_version.major < 3 or (python_version.major == 3 and python_version.minor < 8):
        print(f"❌ Python 3.8+ required, found {python_version.major}.{python_version.minor}")
        return False
    
    print(f"✅ Python version: {python_version.major}.{python_version.minor}")
    
    # Check if requirements.txt exists
    req_file = os.path.join("backend", "requirements.txt")
    if not os.path.exists(req_file):
        print("❌ requirements.txt not found in backend directory")
        return False
    
    print("✅ requirements.txt found")
    
    # Check if .env file exists
    env_file = os.path.join("backend", ".env")
    if not os.path.exists(env_file):
        print("⚠️ .env file not found - server might not start properly")
        print("💡 Copy .env.example to .env and configure it")
    else:
        print("✅ .env file found")
    
    return True

if __name__ == "__main__":
    print("🧪 Local Backend Server Starter")
    print("This script will start the backend server for testing the active orders fix")
    print()
    
    if not check_requirements():
        print("\n❌ Requirements check failed")
        print("💡 Please fix the issues above before starting the server")
        sys.exit(1)
    
    print("\n📝 Before starting:")
    print("   1. Make sure MongoDB is running (local or Atlas)")
    print("   2. Configure .env file with correct database settings")
    print("   3. Install dependencies: pip install -r backend/requirements.txt")
    print()
    
    input("Press Enter to start the server (or Ctrl+C to cancel)...")
    
    start_local_server()