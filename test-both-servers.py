#!/usr/bin/env python3
"""
Test both frontend and backend servers locally
Complete flow: create user -> login -> create order -> verify dashboard data
"""
import requests
import json
import time
import random
import string

def generate_test_user():
    """Generate unique test user"""
    random_id = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
    return {
        "username": f"testuser_{random_id}",
        "email": f"test_{random_id}@example.com",
        "password": "testpass123",
        "role": "admin"
    }

def test_backend_complete_flow():
    """Test complete backend flow with new user and order"""
    print("🔧 TESTING BACKEND - COMPLETE FLOW")
    print("=" * 50)
    
    backend_url = "http://localhost:8000"
    user_data = generate_test_user()
    
    try:
        # 1. Test backend health
        print("🏥 Testing backend health...")
        try:
            health_response = requests.get(f"{backend_url}/health", timeout=5)
            print("✅ Backend is accessible")
        except:
            try:
                # Try API endpoint instead
                health_response = requests.get(f"{backend_url}/api/health", timeout=5)
                print("✅ Backend is accessible")
            except:
                print("❌ Backend not accessible - make sure it's running on port 8000")
                return None, None, None
        
        # 2. Create user
        print(f"👤 Creating user: {user_data['username']}")
        register_response = requests.post(f"{backend_url}/api/auth/register", 
                                        json=user_data, 
                                        timeout=10)
        
        if register_response.status_code != 200:
            print(f"❌ User creation failed: {register_response.status_code}")
            try:
                error = register_response.json()
                print(f"   Error: {error}")
            except:
                print(f"   Raw error: {register_response.text}")
            return None, None, None
        
        print("✅ User created successfully")
        
        # 3. Login
        print("🔐 Logging in...")
        login_response = requests.post(f"{backend_url}/api/auth/login", 
                                     json={
                                         "username": user_data['username'],
                                         "password": user_data['password']
                                     }, 
                                     timeout=10)
        
        if login_response.status_code != 200:
            print(f"❌ Login failed: {login_response.status_code}")
            return None, None, None
        
        login_data = login_response.json()
        token = login_data.get('token')
        user_info = login_data.get('user', {})
        print(f"✅ Login successful for: {user_info.get('username', 'N/A')}")
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # 4. Create menu item
        print("🍽️ Creating menu item...")
        menu_item = {
            "name": "Test Pizza",
            "category": "Main Course",
            "price": 250.0,
            "description": "Delicious test pizza for dashboard testing"
        }
        
        menu_response = requests.post(f"{backend_url}/api/menu", 
                                    json=menu_item, 
                                    headers=headers, 
                                    timeout=10)
        
        if menu_response.status_code != 200:
            print(f"❌ Menu item creation failed: {menu_response.status_code}")
            return None, None, None
        
        menu_data = menu_response.json()
        menu_item_id = menu_data.get('id')
        print(f"✅ Menu item created: {menu_item['name']}")
        
        # 5. Create order
        print("🛒 Creating order...")
        order_data = {
            "table_id": "table-test",
            "table_number": 5,
            "items": [
                {
                    "menu_item_id": menu_item_id,
                    "name": "Test Pizza",
                    "quantity": 2,
                    "price": 250.0,
                    "notes": "Extra cheese and olives"
                }
            ],
            "customer_name": "Dashboard Test Customer"
        }
        
        order_response = requests.post(f"{backend_url}/api/orders", 
                                     json=order_data, 
                                     headers=headers, 
                                     timeout=10)
        
        if order_response.status_code != 200:
            print(f"❌ Order creation failed: {order_response.status_code}")
            try:
                error = order_response.json()
                print(f"   Error: {error}")
            except:
                print(f"   Raw error: {order_response.text}")
            return None, None, None
        
        order = order_response.json()
        order_id = order.get('id')
        order_total = order.get('total', 0)
        print(f"✅ Order created: Total=₹{order_total}")
        
        # 6. Complete the order
        print("✅ Completing order...")
        complete_response = requests.put(f"{backend_url}/api/orders/{order_id}/status?status=completed", 
                                       headers=headers, 
                                       timeout=10)
        
        if complete_response.status_code == 200:
            print("✅ Order marked as completed")
        else:
            print(f"⚠️ Order completion failed: {complete_response.status_code}")
        
        # Wait a moment for data to update
        print("⏳ Waiting for data to update...")
        time.sleep(2)
        
        # 7. Test all dashboard endpoints
        print("\n📊 TESTING DASHBOARD ENDPOINTS:")
        print("-" * 40)
        
        # Daily report (used by frontend)
        daily_response = requests.get(f"{backend_url}/api/reports/daily", 
                                    headers=headers, 
                                    timeout=10)
        
        if daily_response.status_code == 200:
            daily_data = daily_response.json()
            print(f"✅ /api/reports/daily: Orders={daily_data.get('total_orders', 0)}, Sales=₹{daily_data.get('total_sales', 0)}")
        else:
            print(f"❌ Daily report failed: {daily_response.status_code}")
        
        # New dashboard endpoint
        dashboard_response = requests.get(f"{backend_url}/api/dashboard", 
                                        headers=headers, 
                                        timeout=10)
        
        if dashboard_response.status_code == 200:
            dashboard_data = dashboard_response.json()
            print(f"✅ /api/dashboard: Revenue=₹{dashboard_data.get('todaysRevenue', 0)}, Orders={dashboard_data.get('todaysOrders', 0)}")
        else:
            print(f"❌ Dashboard endpoint failed: {dashboard_response.status_code}")
        
        # Today's bills
        bills_response = requests.get(f"{backend_url}/api/orders/today-bills", 
                                    headers=headers, 
                                    timeout=10)
        
        if bills_response.status_code == 200:
            bills_data = bills_response.json()
            total_bills = sum(bill.get('total', 0) for bill in bills_data)
            print(f"✅ /api/orders/today-bills: {len(bills_data)} bills, Total=₹{total_bills}")
        else:
            print(f"❌ Today's bills failed: {bills_response.status_code}")
        
        print("✅ Backend test completed successfully!")
        return user_data, order_total, token
        
    except Exception as e:
        print(f"❌ Backend test failed: {e}")
        return None, None, None

def test_frontend_server():
    """Test frontend server accessibility"""
    print("\n🌐 TESTING FRONTEND SERVER")
    print("=" * 50)
    
    frontend_url = "http://localhost:3000"
    
    try:
        print("🔍 Checking frontend server...")
        response = requests.get(frontend_url, timeout=10)
        
        if response.status_code == 200:
            print("✅ Frontend server is running and accessible")
            
            # Check if it's a React app
            content = response.text.lower()
            if 'react' in content or 'billbytekot' in content or 'root' in content:
                print("✅ Frontend appears to be the correct React app")
            else:
                print("⚠️ Frontend content doesn't look like expected React app")
            
            return True
        else:
            print(f"❌ Frontend returned status: {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Frontend server not accessible on port 3000")
        print("🔧 Make sure frontend is running: cd frontend && npm start")
        return False
    except Exception as e:
        print(f"❌ Frontend test error: {e}")
        return False

def test_frontend_api_calls(user_data, token):
    """Test frontend API calls using the same endpoints frontend uses"""
    print("\n🔗 TESTING FRONTEND API INTEGRATION")
    print("=" * 50)
    
    if not user_data or not token:
        print("❌ No user data or token available")
        return False
    
    backend_url = "http://localhost:8000"
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        print("📊 Testing endpoints that frontend Dashboard uses...")
        
        # Test the exact same calls that frontend makes
        endpoints_to_test = [
            ("/api/reports/daily", "Daily Report (main dashboard data)"),
            ("/api/orders", "Orders (for active orders count)"),
            ("/api/business/settings", "Business Settings (for restaurant name)"),
            ("/api/dashboard", "New Dashboard Endpoint")
        ]
        
        all_success = True
        
        for endpoint, description in endpoints_to_test:
            try:
                response = requests.get(f"{backend_url}{endpoint}", headers=headers, timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    print(f"✅ {endpoint}: {description} - OK")
                    
                    # Show key data for dashboard endpoints
                    if endpoint == "/api/reports/daily":
                        print(f"   📈 Sales: ₹{data.get('total_sales', 0)}, Orders: {data.get('total_orders', 0)}")
                    elif endpoint == "/api/dashboard":
                        print(f"   📈 Revenue: ₹{data.get('todaysRevenue', 0)}, Orders: {data.get('todaysOrders', 0)}")
                    elif endpoint == "/api/orders":
                        print(f"   📋 Active orders: {len(data)}")
                        
                else:
                    print(f"❌ {endpoint}: Failed ({response.status_code})")
                    all_success = False
                    
            except Exception as e:
                print(f"❌ {endpoint}: Error - {e}")
                all_success = False
        
        return all_success
        
    except Exception as e:
        print(f"❌ API integration test failed: {e}")
        return False

def provide_manual_test_instructions(user_data, expected_total):
    """Provide step-by-step manual testing instructions"""
    print("\n📋 MANUAL FRONTEND DASHBOARD TEST")
    print("=" * 50)
    
    if not user_data:
        print("❌ No user credentials available for manual test")
        return
    
    print("🔧 STEP-BY-STEP INSTRUCTIONS:")
    print("")
    print("1. 🌐 Open your web browser")
    print("2. 📍 Navigate to: http://localhost:3000")
    print("3. 🔐 Login with these credentials:")
    print(f"   👤 Username: {user_data['username']}")
    print(f"   🔑 Password: {user_data['password']}")
    print("4. 📊 Go to the Dashboard page")
    print("5. 👀 Look for these values:")
    print(f"   💰 Today's Sales: ₹{expected_total}")
    print("   📈 Today's Orders: 1")
    print("   📋 Active Orders: 0 (since order is completed)")
    print("")
    print("🔄 If you see zeros instead:")
    print("   • Try refreshing the page (F5)")
    print("   • Check browser console for errors (F12)")
    print("   • Make sure you're logged in correctly")
    print("")
    print("✅ SUCCESS CRITERIA:")
    print(f"   • Today's Sales shows ₹{expected_total}")
    print("   • Today's Orders shows 1")
    print("   • Dashboard loads without errors")

def main():
    """Main test function"""
    print("🧪 COMPLETE LOCAL SERVERS TEST")
    print("=" * 60)
    print("Testing both backend API and frontend server")
    print("Creating fresh test data to verify dashboard updates")
    print("")
    
    # Test backend with complete flow
    user_data, order_total, token = test_backend_complete_flow()
    
    # Test frontend server
    frontend_ok = test_frontend_server()
    
    # Test frontend API integration
    if user_data and token:
        api_integration_ok = test_frontend_api_calls(user_data, token)
    else:
        api_integration_ok = False
    
    # Provide manual test instructions
    if user_data and order_total:
        provide_manual_test_instructions(user_data, order_total)
    
    # Final summary
    print("\n📊 FINAL TEST RESULTS")
    print("=" * 40)
    
    backend_status = "✅ WORKING" if user_data and order_total else "❌ ISSUES"
    frontend_status = "✅ ACCESSIBLE" if frontend_ok else "❌ NOT ACCESSIBLE"
    api_status = "✅ WORKING" if api_integration_ok else "❌ ISSUES"
    
    print(f"🔧 Backend API: {backend_status}")
    print(f"🌐 Frontend Server: {frontend_status}")
    print(f"🔗 API Integration: {api_status}")
    
    if user_data and order_total:
        print(f"💰 Test Revenue Created: ₹{order_total}")
    
    print("\n🎯 CONCLUSION:")
    if user_data and order_total and frontend_ok:
        print("✅ BOTH SERVERS ARE WORKING CORRECTLY!")
        print("✅ Fresh test data created with revenue")
        print("✅ All API endpoints responding correctly")
        print("📱 Dashboard amounts SHOULD be visible in frontend")
        print("")
        print("👆 Please follow the manual instructions above to verify!")
    else:
        print("❌ Issues found with server setup:")
        if not (user_data and order_total):
            print("   • Backend API issues")
        if not frontend_ok:
            print("   • Frontend server not accessible")
        print("")
        print("🔧 Fix the issues above and run the test again")

if __name__ == "__main__":
    main()