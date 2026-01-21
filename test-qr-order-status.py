#!/usr/bin/env python3
"""
Simple test to check QR order status after creation
"""

import requests
import json

# Test configuration
BACKEND_URL = "http://localhost:8000"

def test_qr_order_status():
    """Test QR order creation and check status"""
    
    print("🧪 Testing QR Order Status")
    print("=" * 40)
    
    # Test order data (similar to what CustomerOrderPage sends)
    order_data = {
        "org_id": "test-org-123",
        "table_id": "table-5",
        "table_number": 5,
        "customer_name": "Test Customer",
        "customer_phone": "+919876543210",
        "items": [
            {
                "menu_item_id": "item-1",
                "name": "Test Pizza",
                "price": 299.0,
                "quantity": 1
            }
        ],
        "frontend_origin": "http://localhost:3000"
    }
    
    print("📱 Creating QR order...")
    print(f"   Data: {json.dumps(order_data, indent=2)}")
    
    try:
        # Create QR order
        response = requests.post(f"{BACKEND_URL}/api/public/order", json=order_data)
        
        print(f"\n📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Order created successfully!")
            print(f"   Order ID: {result.get('order_id')}")
            print(f"   Tracking Token: {result.get('tracking_token')}")
            print(f"   Total: {result.get('total')}")
            
            # The key question: What status was the order created with?
            print(f"\n🔍 Expected Status: 'pending' (should appear in Active Orders)")
            print(f"🔍 Expected waiter_name: 'Self-Order' (identifies as QR order)")
            
            return True
            
        elif response.status_code == 404:
            print(f"❌ Restaurant not found (org_id: {order_data['org_id']})")
            print("   This is expected if testing with fake org_id")
            return False
            
        elif response.status_code == 403:
            print(f"❌ Self-ordering not enabled for this restaurant")
            return False
            
        else:
            print(f"❌ Unexpected error: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend server")
        print("   Make sure backend is running on http://localhost:8000")
        return False
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

def test_order_model_defaults():
    """Test what the Order model defaults should be"""
    
    print("\n🏗️ Testing Order Model Defaults")
    print("=" * 40)
    
    print("📋 Expected Order Model Defaults:")
    print("   status: 'pending'")
    print("   payment_method: 'cash'")
    print("   payment_received: 0")
    print("   is_credit: False")
    print("   balance_amount: 0")
    
    print("\n🎯 For QR Orders specifically:")
    print("   waiter_name: 'Self-Order'")
    print("   waiter_id: <org_id>")
    print("   status: 'pending' (should NOT be 'completed')")
    
    print("\n🔄 Expected Workflow:")
    print("   1. Customer places QR order → status='pending'")
    print("   2. Order appears in Active Orders")
    print("   3. Kitchen processes order")
    print("   4. Staff marks as 'completed' → moves to Today's Bills")

if __name__ == "__main__":
    print("🚀 QR Order Status Test")
    print("Testing the issue where QR orders bypass Active Orders")
    print()
    
    # Test order model expectations
    test_order_model_defaults()
    
    # Test actual order creation
    success = test_qr_order_status()
    
    print("\n" + "=" * 40)
    if success:
        print("✅ Test completed - check backend logs for order creation details")
    else:
        print("❌ Test failed - check backend server and configuration")
    
    print("\n💡 To debug further:")
    print("   1. Check backend logs during order creation")
    print("   2. Query database directly for order status")
    print("   3. Check if any post-processing is changing status")
    print("   4. Verify frontend Active Orders filtering logic")