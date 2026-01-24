#!/usr/bin/env python3
"""
Test the daily report endpoint to see why dashboard amounts are not reflecting
"""
import requests
import json

def test_daily_report():
    """Test the daily report endpoint"""
    print("🧪 Testing Daily Report Endpoint")
    print("=" * 50)
    
    backend_url = "http://localhost:8000"
    
    # Use existing user credentials (from previous tests)
    login_data = {
        "username": "testuser_3ex872",  # From the last successful test
        "password": "testpass123"
    }
    
    try:
        # Login first
        print("🔐 Logging in...")
        login_response = requests.post(f"{backend_url}/api/auth/login", 
                                     json=login_data, 
                                     timeout=10)
        
        if login_response.status_code != 200:
            print(f"❌ Login failed: {login_response.status_code}")
            return
        
        login_result = login_response.json()
        token = login_result.get('token')
        print(f"✅ Login successful")
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test daily report endpoint
        print("\n📊 Testing /api/reports/daily endpoint...")
        daily_response = requests.get(f"{backend_url}/api/reports/daily", 
                                    headers=headers, 
                                    timeout=10)
        
        print(f"   Status Code: {daily_response.status_code}")
        
        if daily_response.status_code == 200:
            daily_data = daily_response.json()
            print("✅ Daily report endpoint working!")
            print(f"   Total Orders: {daily_data.get('total_orders', 'N/A')}")
            print(f"   Total Sales: ₹{daily_data.get('total_sales', 'N/A')}")
            print(f"   Raw Data: {json.dumps(daily_data, indent=2)}")
        else:
            print("❌ Daily report endpoint failed!")
            try:
                error_data = daily_response.json()
                print(f"   Error: {error_data}")
            except:
                print(f"   Raw response: {daily_response.text}")
        
        # Test new dashboard endpoint
        print("\n📊 Testing /api/dashboard endpoint...")
        dashboard_response = requests.get(f"{backend_url}/api/dashboard", 
                                        headers=headers, 
                                        timeout=10)
        
        print(f"   Status Code: {dashboard_response.status_code}")
        
        if dashboard_response.status_code == 200:
            dashboard_data = dashboard_response.json()
            print("✅ Dashboard endpoint working!")
            print(f"   Today's Revenue: ₹{dashboard_data.get('todaysRevenue', 'N/A')}")
            print(f"   Today's Orders: {dashboard_data.get('todaysOrders', 'N/A')}")
            print(f"   Total Orders: {dashboard_data.get('totalOrders', 'N/A')}")
            print(f"   Pending Orders: {dashboard_data.get('pendingOrders', 'N/A')}")
            print(f"   Raw Data: {json.dumps(dashboard_data, indent=2)}")
        else:
            print("❌ Dashboard endpoint failed!")
            try:
                error_data = dashboard_response.json()
                print(f"   Error: {error_data}")
            except:
                print(f"   Raw response: {dashboard_response.text}")
        
        # Test orders endpoint to see what orders exist
        print("\n📋 Testing /api/orders endpoint...")
        orders_response = requests.get(f"{backend_url}/api/orders", 
                                     headers=headers, 
                                     timeout=10)
        
        print(f"   Status Code: {orders_response.status_code}")
        
        if orders_response.status_code == 200:
            orders_data = orders_response.json()
            print(f"✅ Orders endpoint working! Found {len(orders_data)} orders")
            for order in orders_data[:3]:  # Show first 3 orders
                print(f"   Order: {order.get('id', 'N/A')[:8]}... Status: {order.get('status', 'N/A')} Total: ₹{order.get('total', 'N/A')}")
        else:
            print("❌ Orders endpoint failed!")
        
        # Test today's bills endpoint
        print("\n💰 Testing /api/orders/today-bills endpoint...")
        bills_response = requests.get(f"{backend_url}/api/orders/today-bills", 
                                    headers=headers, 
                                    timeout=10)
        
        print(f"   Status Code: {bills_response.status_code}")
        
        if bills_response.status_code == 200:
            bills_data = bills_response.json()
            print(f"✅ Today's bills endpoint working! Found {len(bills_data)} bills")
            total_bills = sum(bill.get('total', 0) for bill in bills_data)
            print(f"   Total from bills: ₹{total_bills}")
            for bill in bills_data[:3]:  # Show first 3 bills
                print(f"   Bill: {bill.get('id', 'N/A')[:8]}... Status: {bill.get('status', 'N/A')} Total: ₹{bill.get('total', 'N/A')}")
        else:
            print("❌ Today's bills endpoint failed!")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_daily_report()