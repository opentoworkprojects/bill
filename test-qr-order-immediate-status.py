#!/usr/bin/env python3
"""
Test to place a QR order and immediately check its status
"""

import asyncio
import motor.motor_asyncio
import requests
import json
import os
from datetime import datetime

# MongoDB connection
MONGO_URL = "mongodb+srv://shivshankarkumar281_db_user:RNdGNCCyBtj1d5Ar@retsro-ai.un0np9m.mongodb.net/restrobill?retryWrites=true&w=majority&authSource=admin&readPreference=primary&appName=retsro-ai"
BACKEND_URL = "http://localhost:8000"

async def test_qr_order_immediate_status():
    """Test QR order creation and check status immediately"""
    
    print("🧪 Testing QR Order Immediate Status")
    print("=" * 50)
    
    # Connect to MongoDB
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
    db = client.restrobill
    
    try:
        # First, find a valid org_id and table from the database
        print("🔍 Finding valid org_id and table...")
        
        # Get a user (restaurant)
        user = await db.users.find_one({"role": "admin"}, {"_id": 0, "id": 1, "business_settings": 1})
        if not user:
            print("❌ No admin users found in database")
            return False
            
        org_id = user["id"]
        print(f"   Found org_id: {org_id}")
        
        # Get a table for this org
        table = await db.tables.find_one({"organization_id": org_id}, {"_id": 0})
        if not table:
            print("❌ No tables found for this org")
            return False
            
        table_id = table["id"]
        table_number = table["table_number"]
        print(f"   Found table: {table_number} (ID: {table_id})")
        
        # Test order data
        order_data = {
            "org_id": org_id,
            "table_id": table_id,
            "table_number": table_number,
            "customer_name": "Test QR Customer",
            "customer_phone": "+919876543210",
            "items": [
                {
                    "menu_item_id": "test-item-1",
                    "name": "Test Pizza",
                    "price": 299.0,
                    "quantity": 1
                }
            ],
            "frontend_origin": "http://localhost:3000"
        }
        
        print(f"\n📱 Creating QR order...")
        print(f"   Customer: {order_data['customer_name']}")
        print(f"   Table: {table_number}")
        print(f"   Total: ₹{order_data['items'][0]['price']}")
        
        # Create QR order
        response = requests.post(f"{BACKEND_URL}/api/public/order", json=order_data)
        
        if response.status_code != 200:
            print(f"❌ Order creation failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
        result = response.json()
        order_id = result.get("order_id")
        tracking_token = result.get("tracking_token")
        
        print(f"✅ Order created successfully!")
        print(f"   Order ID: {order_id}")
        print(f"   Tracking Token: {tracking_token}")
        
        # Immediately check the order in the database
        print(f"\n🔍 Checking order status in database...")
        
        # Find the full order ID (we only get first 8 chars)
        full_order = await db.orders.find_one(
            {"id": {"$regex": f"^{order_id}"}, "organization_id": org_id},
            {"_id": 0}
        )
        
        if not full_order:
            print(f"❌ Order not found in database!")
            return False
            
        print(f"📊 Order Details:")
        print(f"   Full ID: {full_order['id']}")
        print(f"   Status: {full_order.get('status', 'N/A')}")
        print(f"   Waiter Name: {full_order.get('waiter_name', 'N/A')}")
        print(f"   Payment Method: {full_order.get('payment_method', 'N/A')}")
        print(f"   Payment Received: {full_order.get('payment_received', 0)}")
        print(f"   Is Credit: {full_order.get('is_credit', False)}")
        print(f"   Total: {full_order.get('total', 0)}")
        print(f"   Created At: {full_order.get('created_at', 'N/A')}")
        
        # Check if this is the issue
        if full_order.get('status') == 'completed':
            print(f"\n❌ ISSUE FOUND: QR order is immediately marked as COMPLETED!")
            print(f"   This should be 'pending' until kitchen marks it complete")
            
            # Check what might have caused this
            payment_received = full_order.get('payment_received', 0)
            total = full_order.get('total', 0)
            is_credit = full_order.get('is_credit', False)
            
            print(f"\n🔍 Analysis:")
            print(f"   Payment Received: {payment_received}")
            print(f"   Total: {total}")
            print(f"   Is Credit: {is_credit}")
            print(f"   Payment >= Total: {payment_received >= total}")
            
            if payment_received >= total and not is_credit:
                print(f"   💡 Likely cause: Auto-completion logic based on payment_received >= total")
            else:
                print(f"   💡 Likely cause: Unknown - order completed despite no payment")
                
            return False
            
        elif full_order.get('status') == 'pending':
            print(f"\n✅ CORRECT: QR order is PENDING (will show in Active Orders)")
            return True
            
        else:
            print(f"\n⚠️ UNEXPECTED: QR order has status '{full_order.get('status')}'")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend server")
        print("   Make sure backend is running on http://localhost:8000")
        return False
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False
        
    finally:
        client.close()

if __name__ == "__main__":
    print("🚀 QR Order Immediate Status Test")
    print("Testing if QR orders are auto-completed immediately after creation")
    print()
    
    success = asyncio.run(test_qr_order_immediate_status())
    
    print("\n" + "=" * 50)
    if success:
        print("✅ Test passed - QR order stays pending as expected")
    else:
        print("❌ Test failed - QR order is auto-completed")
    
    print("\n💡 Next steps:")
    print("   1. If test fails, check backend logs during order creation")
    print("   2. Look for any logic that auto-completes orders")
    print("   3. Check if payment processing is happening automatically")