#!/usr/bin/env python3
"""
Payment Processing Debug Script
Identifies issues with payment completion in billing page
"""

import requests
import json
import time
from datetime import datetime

# Configuration
API_BASE = "https://restro-ai.onrender.com/api"
# API_BASE = "http://localhost:8000"  # Use for local testing

def test_payment_endpoints():
    """Test payment-related API endpoints"""
    print("🔍 Testing Payment API Endpoints")
    print("=" * 50)
    
    # Test endpoints that are used in payment processing
    endpoints_to_test = [
        "/payments/create-order",
        "/orders",
        "/tables",
        "/business/settings"
    ]
    
    for endpoint in endpoints_to_test:
        try:
            url = f"{API_BASE}{endpoint}"
            print(f"\n📡 Testing: {endpoint}")
            
            if endpoint == "/payments/create-order":
                # Test POST request (this is what fails in payment processing)
                response = requests.post(url, 
                    json={
                        "order_id": "test_order_123",
                        "amount": 100.0,
                        "payment_method": "cash"
                    },
                    timeout=5
                )
            else:
                # Test GET request
                response = requests.get(url, timeout=5)
            
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                print("   ✅ Endpoint is working")
            elif response.status_code == 401:
                print("   🔐 Authentication required (expected)")
            elif response.status_code == 404:
                print("   ❌ Endpoint not found")
            elif response.status_code == 405:
                print("   ⚠️ Method not allowed")
            else:
                print(f"   ⚠️ Unexpected status: {response.status_code}")
                if response.text:
                    print(f"   Response: {response.text[:200]}")
                    
        except requests.exceptions.Timeout:
            print(f"   ⏰ Timeout - endpoint is slow")
        except requests.exceptions.ConnectionError:
            print(f"   🔌 Connection error - endpoint unreachable")
        except Exception as e:
            print(f"   ❌ Error: {e}")

def test_payment_flow_simulation():
    """Simulate the payment flow to identify issues"""
    print("\n\n💳 Simulating Payment Flow")
    print("=" * 50)
    
    # Step 1: Test order creation/update
    print("\n1️⃣ Testing Order Update...")
    try:
        url = f"{API_BASE}/orders/test_order_123"
        response = requests.put(url, 
            json={
                "status": "completed",
                "payment_method": "cash",
                "payment_received": 100.0,
                "total": 100.0
            },
            timeout=5
        )
        print(f"   Order Update Status: {response.status_code}")
        if response.status_code != 200:
            print(f"   ❌ Order update failed: {response.text[:200]}")
    except Exception as e:
        print(f"   ❌ Order update error: {e}")
    
    # Step 2: Test payment record creation
    print("\n2️⃣ Testing Payment Record Creation...")
    try:
        url = f"{API_BASE}/payments/create-order"
        response = requests.post(url, 
            json={
                "order_id": "test_order_123",
                "amount": 100.0,
                "payment_method": "cash"
            },
            timeout=5
        )
        print(f"   Payment Creation Status: {response.status_code}")
        if response.status_code != 200:
            print(f"   ❌ Payment creation failed: {response.text[:200]}")
    except Exception as e:
        print(f"   ❌ Payment creation error: {e}")

def check_cors_issues():
    """Check for CORS issues that might affect frontend"""
    print("\n\n🌐 Checking CORS Configuration")
    print("=" * 50)
    
    try:
        url = f"{API_BASE}/orders"
        response = requests.options(url, timeout=5)
        print(f"OPTIONS request status: {response.status_code}")
        
        cors_headers = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
        }
        
        print("CORS Headers:")
        for header, value in cors_headers.items():
            if value:
                print(f"   ✅ {header}: {value}")
            else:
                print(f"   ❌ {header}: Not set")
                
    except Exception as e:
        print(f"❌ CORS check failed: {e}")

def check_server_health():
    """Check overall server health"""
    print("\n\n🏥 Server Health Check")
    print("=" * 50)
    
    try:
        # Test basic connectivity
        start_time = time.time()
        response = requests.get(f"{API_BASE}/", timeout=10)
        end_time = time.time()
        
        response_time = (end_time - start_time) * 1000
        
        print(f"Server Response Time: {response_time:.0f}ms")
        print(f"Server Status: {response.status_code}")
        
        if response_time > 5000:
            print("⚠️ Server is very slow (>5s)")
        elif response_time > 2000:
            print("⚠️ Server is slow (>2s)")
        else:
            print("✅ Server response time is good")
            
    except Exception as e:
        print(f"❌ Server health check failed: {e}")

def identify_payment_issues():
    """Identify specific payment processing issues"""
    print("\n\n🔧 Payment Issue Analysis")
    print("=" * 50)
    
    issues_found = []
    
    # Check if payment endpoints exist
    try:
        response = requests.post(f"{API_BASE}/payments/create-order", 
            json={"test": "data"}, timeout=5)
        if response.status_code == 404:
            issues_found.append("❌ Payment creation endpoint not found")
        elif response.status_code == 500:
            issues_found.append("❌ Payment creation endpoint has server error")
    except:
        issues_found.append("❌ Payment creation endpoint unreachable")
    
    # Check if order update works
    try:
        response = requests.put(f"{API_BASE}/orders/test", 
            json={"test": "data"}, timeout=5)
        if response.status_code == 404:
            issues_found.append("❌ Order update endpoint not found")
        elif response.status_code == 500:
            issues_found.append("❌ Order update endpoint has server error")
    except:
        issues_found.append("❌ Order update endpoint unreachable")
    
    if issues_found:
        print("Issues Found:")
        for issue in issues_found:
            print(f"   {issue}")
    else:
        print("✅ No obvious endpoint issues found")
    
    print("\n🔍 Possible Causes of Payment Failure:")
    print("   1. Authentication token issues")
    print("   2. Network timeout (>3 seconds)")
    print("   3. Server overload or cold start")
    print("   4. Database connection issues")
    print("   5. Missing required fields in payment data")
    print("   6. CORS configuration problems")

def main():
    """Main debug process"""
    print("🐛 BillByteKOT Payment Processing Debug")
    print("=" * 60)
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Testing API: {API_BASE}")
    print()
    
    # Run all tests
    check_server_health()
    test_payment_endpoints()
    test_payment_flow_simulation()
    check_cors_issues()
    identify_payment_issues()
    
    print("\n" + "=" * 60)
    print("🔧 RECOMMENDED FIXES:")
    print("1. Check server logs for payment endpoint errors")
    print("2. Verify authentication tokens are valid")
    print("3. Increase timeout values if server is slow")
    print("4. Add better error handling in frontend")
    print("5. Implement retry logic for failed payments")
    print("6. Add loading states to prevent multiple clicks")

if __name__ == "__main__":
    main()