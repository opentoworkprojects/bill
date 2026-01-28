#!/usr/bin/env python3
"""
Test script for customer balance endpoint
"""
import requests
import json

# Test the customer balance endpoint
def test_customer_balance():
    base_url = "http://localhost:8000"
    
    # First, let's test if the endpoint exists
    try:
        response = requests.get(f"{base_url}/reports/customer-balances")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Customer Balance Endpoint Working!")
            print(f"📊 Found {len(data)} customers with outstanding balances")
            
            if data:
                print("\n🔍 Sample Customer Data:")
                for i, customer in enumerate(data[:3]):  # Show first 3 customers
                    print(f"\n{i+1}. {customer.get('customer_name', 'Unknown')}")
                    print(f"   📞 Phone: {customer.get('customer_phone', 'N/A')}")
                    print(f"   💰 Balance: ₹{customer.get('balance_amount', 0)}")
                    print(f"   🛒 Total Orders: {customer.get('total_orders', 0)}")
                    print(f"   📅 Last Order: {customer.get('last_order_date', 'N/A')}")
            else:
                print("ℹ️  No customers with outstanding balances found")
                
        elif response.status_code == 401:
            print("❌ Authentication required - endpoint exists but needs login")
        else:
            print(f"❌ Endpoint error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend server")
        print("Make sure the backend is running on http://localhost:8000")
    except Exception as e:
        print(f"❌ Error testing endpoint: {e}")

if __name__ == "__main__":
    print("🧪 Testing Customer Balance Endpoint...")
    test_customer_balance()