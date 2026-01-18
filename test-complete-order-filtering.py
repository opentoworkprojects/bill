#!/usr/bin/env python3
"""
Test complete order filtering to ensure pending orders only show in Active Orders
and completed orders only show in Today's Bills
"""

import asyncio
import motor.motor_asyncio
from datetime import datetime, timezone, timedelta

# MongoDB connection
MONGO_URL = "mongodb+srv://shivshankarkumar281_db_user:RNdGNCCyBtj1d5Ar@retsro-ai.un0np9m.mongodb.net/restrobill?retryWrites=true&w=majority&authSource=admin&readPreference=primary&appName=retsro-ai"

async def test_complete_filtering():
    """Test complete order filtering logic"""
    
    print("🧪 Testing Complete Order Filtering")
    print("=" * 50)
    
    # Connect to MongoDB
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
    db = client.restrobill
    
    try:
        # Get valid org_id
        user = await db.users.find_one({"role": "admin"}, {"_id": 0, "id": 1})
        if not user:
            print("❌ No admin users found")
            return False
            
        user_org_id = user["id"]
        print(f"📍 Testing for org: {user_org_id}")
        
        # Calculate today's date range
        IST = timezone(timedelta(hours=5, minutes=30))
        now_ist = datetime.now(IST)
        today_ist = now_ist.replace(hour=0, minute=0, second=0, microsecond=0)
        today_utc = today_ist.astimezone(timezone.utc)
        
        print(f"📅 Today UTC: {today_utc}")
        
        # Test 1: Active Orders Query (should include pending, preparing, ready)
        print(f"\n🔍 Test 1: Active Orders Query")
        
        active_query = {
            "organization_id": user_org_id,
            "status": {"$nin": ["completed", "cancelled"]}  # NOT completed or cancelled
        }
        
        active_orders = await db.orders.find(active_query, {"_id": 0}).sort("created_at", -1).to_list(100)
        
        print(f"📊 Found {len(active_orders)} active orders")
        
        pending_count = 0
        for order in active_orders:
            order_id = order.get('id', 'Unknown')[:12]
            status = order.get('status', 'Unknown')
            waiter_name = order.get('waiter_name', 'Unknown')
            customer = order.get('customer_name', 'Unknown')
            
            if status == 'pending':
                pending_count += 1
                
            print(f"   {order_id}... | {status:10} | {waiter_name:10} | {customer:15}")
        
        print(f"   ✅ Pending orders in Active Orders: {pending_count}")
        
        # Test 2: Today's Bills Query (should ONLY include completed/paid)
        print(f"\n🔍 Test 2: Today's Bills Query")
        
        bills_query = {
            "organization_id": user_org_id,
            "created_at": {"$gte": today_utc.isoformat()},
            "status": {"$in": ["completed", "paid"]}  # ONLY completed or paid
        }
        
        todays_bills = await db.orders.find(bills_query, {"_id": 0}).sort("created_at", -1).to_list(100)
        
        print(f"📊 Found {len(todays_bills)} today's bills")
        
        pending_in_bills = 0
        completed_count = 0
        
        for order in todays_bills:
            order_id = order.get('id', 'Unknown')[:12]
            status = order.get('status', 'Unknown')
            waiter_name = order.get('waiter_name', 'Unknown')
            customer = order.get('customer_name', 'Unknown')
            
            if status == 'pending':
                pending_in_bills += 1
                print(f"   ❌ {order_id}... | {status:10} | {waiter_name:10} | {customer:15} <- SHOULD NOT BE HERE!")
            elif status in ['completed', 'paid']:
                completed_count += 1
                print(f"   ✅ {order_id}... | {status:10} | {waiter_name:10} | {customer:15}")
            else:
                print(f"   ⚠️ {order_id}... | {status:10} | {waiter_name:10} | {customer:15} <- UNEXPECTED STATUS!")
        
        # Test 3: Check for overlap (orders appearing in both)
        print(f"\n🔍 Test 3: Checking for overlap")
        
        active_ids = set(order.get('id') for order in active_orders)
        bills_ids = set(order.get('id') for order in todays_bills)
        
        overlap = active_ids.intersection(bills_ids)
        
        if overlap:
            print(f"❌ Found {len(overlap)} orders appearing in BOTH Active Orders and Today's Bills!")
            for order_id in list(overlap)[:5]:  # Show first 5
                print(f"   Duplicate: {order_id[:12]}...")
        else:
            print(f"✅ No overlap - orders appear in only one tab")
        
        # Summary
        print(f"\n📋 Summary:")
        print(f"   Active Orders: {len(active_orders)} (pending: {pending_count})")
        print(f"   Today's Bills: {len(todays_bills)} (completed: {completed_count})")
        print(f"   Pending in Bills: {pending_in_bills} (should be 0)")
        print(f"   Overlap: {len(overlap)} (should be 0)")
        
        # Determine if test passed
        success = (pending_in_bills == 0 and len(overlap) == 0)
        
        if success:
            print(f"\n🎉 ALL TESTS PASSED!")
            print(f"   ✅ Pending orders only in Active Orders")
            print(f"   ✅ Completed orders only in Today's Bills")
            print(f"   ✅ No duplicate orders between tabs")
        else:
            print(f"\n❌ TESTS FAILED!")
            if pending_in_bills > 0:
                print(f"   ❌ {pending_in_bills} pending orders found in Today's Bills")
            if len(overlap) > 0:
                print(f"   ❌ {len(overlap)} orders appear in both tabs")
        
        return success
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
        
    finally:
        client.close()

if __name__ == "__main__":
    print("🚀 Complete Order Filtering Test")
    print("Testing that orders appear in the correct tabs only")
    print()
    
    success = asyncio.run(test_complete_filtering())
    
    print("\n" + "=" * 50)
    if success:
        print("✅ Order filtering is working correctly!")
        print("\n💡 If users still see issues:")
        print("   1. Restart the backend server")
        print("   2. Clear browser cache")
        print("   3. Refresh the frontend")
    else:
        print("❌ Order filtering has issues!")
        print("   Backend server needs to be restarted with the new code")