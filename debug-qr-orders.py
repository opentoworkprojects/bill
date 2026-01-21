#!/usr/bin/env python3
"""
Debug script to check QR order status in the database
"""

import asyncio
import motor.motor_asyncio
from datetime import datetime, timezone
import os

# MongoDB connection
MONGODB_URL = os.getenv("MONGO_URL", "mongodb+srv://shivshankarkumar281_db_user:RNdGNCCyBtj1d5Ar@retsro-ai.un0np9m.mongodb.net/restrobill?retryWrites=true&w=majority&authSource=admin&readPreference=primary&appName=retsro-ai")

async def debug_qr_orders():
    """Check QR orders in the database"""
    
    print("🔍 Debugging QR Orders in Database")
    print("=" * 50)
    
    # Connect to MongoDB
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URL)
    db = client.restrobill
    
    try:
        # Find all orders with waiter_name = "Self-Order"
        qr_orders = await db.orders.find(
            {"waiter_name": "Self-Order"},
            {"_id": 0}
        ).sort("created_at", -1).limit(10).to_list(10)
        
        print(f"📱 Found {len(qr_orders)} QR orders (Self-Order)")
        
        for i, order in enumerate(qr_orders, 1):
            print(f"\n🔸 QR Order {i}:")
            print(f"   ID: {order.get('id', 'N/A')[:12]}...")
            print(f"   Status: {order.get('status', 'N/A')}")
            print(f"   Table: {order.get('table_number', 'N/A')}")
            print(f"   Customer: {order.get('customer_name', 'N/A')}")
            print(f"   Total: {order.get('total', 0)}")
            print(f"   Payment Method: {order.get('payment_method', 'N/A')}")
            print(f"   Payment Received: {order.get('payment_received', 0)}")
            print(f"   Is Credit: {order.get('is_credit', False)}")
            print(f"   Created: {order.get('created_at', 'N/A')}")
            
            # Check if this order should be completed
            if order.get('status') == 'completed':
                print(f"   ❌ ISSUE: QR order is marked as COMPLETED!")
                print(f"   🔍 This should be PENDING until kitchen marks it complete")
            elif order.get('status') == 'pending':
                print(f"   ✅ CORRECT: QR order is PENDING (will show in Active Orders)")
            else:
                print(f"   ⚠️ UNEXPECTED: QR order has status '{order.get('status')}'")
        
        # Check recent orders by creation time
        print(f"\n📊 Recent Orders (last 10, all types):")
        recent_orders = await db.orders.find(
            {},
            {"_id": 0, "id": 1, "waiter_name": 1, "status": 1, "created_at": 1, "customer_name": 1}
        ).sort("created_at", -1).limit(10).to_list(10)
        
        for order in recent_orders:
            order_type = "QR" if order.get('waiter_name') == 'Self-Order' else "STAFF"
            print(f"   {order_type:5} | {order.get('status', 'N/A'):10} | {order.get('customer_name', 'N/A')[:15]:15} | {order.get('created_at', 'N/A')}")
        
        # Summary statistics
        print(f"\n📈 QR Order Statistics:")
        
        total_qr = await db.orders.count_documents({"waiter_name": "Self-Order"})
        pending_qr = await db.orders.count_documents({"waiter_name": "Self-Order", "status": "pending"})
        completed_qr = await db.orders.count_documents({"waiter_name": "Self-Order", "status": "completed"})
        
        print(f"   Total QR Orders: {total_qr}")
        print(f"   Pending QR Orders: {pending_qr}")
        print(f"   Completed QR Orders: {completed_qr}")
        
        if completed_qr > 0:
            print(f"   ⚠️ WARNING: {completed_qr} QR orders are marked as completed!")
            print(f"   🔍 These should only be completed by kitchen staff, not automatically")
        
        if pending_qr > 0:
            print(f"   ✅ GOOD: {pending_qr} QR orders are pending (will show in Active Orders)")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(debug_qr_orders())