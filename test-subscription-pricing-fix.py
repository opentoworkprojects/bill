#!/usr/bin/env python3
"""
Test script for subscription pricing fix
Tests different plan types to ensure correct pricing is used
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "https://billbytekot-backend.onrender.com"
# BASE_URL = "http://localhost:8000"  # For local testing

# Test credentials (use a test account)
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "testpassword"

def get_auth_token():
    """Get authentication token for testing"""
    try:
        login_data = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
        
        response = requests.post(f"{BASE_URL}/api/login", json=login_data, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token")
        else:
            print(f"⚠️  Login failed: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"⚠️  Could not get auth token: {e}")
        return None

def test_subscription_pricing():
    """Test subscription pricing for different plans"""
    
    print("🧪 Testing Subscription Pricing Fix")
    print("=" * 50)
    
    # Get auth token
    print("🔐 Getting authentication token...")
    token = get_auth_token()
    
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
        print("✅ Authentication token obtained")
    else:
        print("⚠️  No authentication token - testing without auth")
    
    # Define test plans
    test_plans = [
        {"plan_type": "monthly", "months": 1, "amount": 199, "label": "1 Month"},
        {"plan_type": "quarterly", "months": 3, "amount": 549, "label": "3 Months"},
        {"plan_type": "halfYearly", "months": 6, "amount": 999, "label": "6 Months"},
        {"plan_type": "yearly", "months": 12, "amount": 1899, "label": "1 Year"}
    ]
    
    print("\n🎯 Testing Different Subscription Plans")
    print("-" * 50)
    
    for plan in test_plans:
        print(f"\n📋 Testing {plan['label']} Plan (₹{plan['amount']})")
        print("-" * 30)
        
        try:
            # Test create order endpoint
            order_data = {
                "plan_type": plan["plan_type"],
                "months": plan["months"],
                "amount": plan["amount"]
            }
            
            response = requests.post(
                f"{BASE_URL}/api/subscription/create-order",
                json=order_data,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Order created successfully")
                print(f"💰 Amount: ₹{data.get('amount', 0) / 100:.0f}")
                print(f"📦 Plan: {data.get('plan_label', 'Unknown')}")
                print(f"📅 Duration: {data.get('plan_months', 'Unknown')} months")
                print(f"🏷️  Plan Type: {data.get('plan_type', 'Unknown')}")
                
                # Verify the amount matches expected
                expected_amount_paise = plan["amount"] * 100
                actual_amount_paise = data.get("amount", 0)
                
                if abs(actual_amount_paise - expected_amount_paise) <= 100:  # Allow small differences
                    print(f"✅ Pricing correct: Expected ₹{plan['amount']}, Got ₹{actual_amount_paise/100:.0f}")
                else:
                    print(f"❌ Pricing mismatch: Expected ₹{plan['amount']}, Got ₹{actual_amount_paise/100:.0f}")
                
            elif response.status_code == 401:
                print(f"🔒 Authentication required (401)")
            elif response.status_code == 404:
                print(f"❌ Endpoint not found (404)")
            else:
                print(f"❌ Request failed: {response.status_code}")
                print(f"📝 Response: {response.text[:200]}")
                
        except Exception as e:
            print(f"❌ Error testing {plan['label']}: {e}")
    
    # Test endpoint availability
    print("\n🔍 Testing Endpoint Availability")
    print("-" * 40)
    
    endpoints_to_test = [
        "/api/subscription/create-order",
        "/api/subscription/verify",
        "/api/subscription/status"
    ]
    
    for endpoint in endpoints_to_test:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", headers=headers, timeout=5)
            if response.status_code in [200, 401, 422, 405]:  # 405 for POST-only endpoints
                print(f"✅ {endpoint} - Available")
            elif response.status_code == 404:
                print(f"❌ {endpoint} - Not Found")
            else:
                print(f"⚠️  {endpoint} - Status: {response.status_code}")
        except Exception as e:
            print(f"❌ {endpoint} - Error: {e}")
    
    print("\n" + "=" * 50)
    print("🏁 Subscription Pricing Test Complete")
    print(f"📅 Test completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Summary
    print("\n📋 FIX SUMMARY:")
    print("• Backend: Updated CreateOrderRequest to accept plan_type, months, amount")
    print("• Backend: Modified create-order endpoint to use plan-specific pricing")
    print("• Backend: Updated SubscriptionVerifyRequest to include plan info")
    print("• Backend: Modified verify endpoint to use plan-specific duration")
    print("• Frontend: Already sending correct plan data")
    
    print("\n🎯 EXPECTED BEHAVIOR:")
    print("• Monthly plan: ₹199 for 1 month")
    print("• Quarterly plan: ₹549 for 3 months")
    print("• Half-yearly plan: ₹999 for 6 months")
    print("• Yearly plan: ₹1899 for 12 months")

if __name__ == "__main__":
    test_subscription_pricing()