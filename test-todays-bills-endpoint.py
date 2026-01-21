#!/usr/bin/env python3
"""
Test the Today's Bills endpoint directly to see what it returns
"""

import asyncio
import motor.motor_asyncio
from datetime import datetime, timezone, timedelta

# MongoDB connection
MONGO_URL = "mongodb+srv://shivshankarkumar281_db_user:RNdGNCCyBtj1d5Ar@retsro-ai.un0np9m.mongodb.net/restrobill?retryWrites=true&w=majority&authSource=admin&readPreference=primary&appName=retsro-ai"

async def test_todays_bills_query():
    """Test the Today's Bills query directly"""
    
    print("🧪 Testing Today's Bills Query")
    print("=" * 40)
    
    # Connect to MongoDB
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
    db = client.restrobill
    
    try:
        # Get a valid org_id
        user = await db.users.find_one({"role": "admin"}, {"_id": 0, "id": 1})
        if not user:
            print("❌ No admin users found")
            return False
            
        user_org_id = user["id"]
        print(f"📍 Testing for org: {user_org_id}")
        
        # Use IST (Indian Standard Time) for "today" calculation
        IST = timezone(timedelta(hours=5, minutes=30))
        
        # Get current time in IST and find start of today in IST
        now_ist = datetime.now(IST)
        today_ist = now_ist.replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Convert to UTC for database query
        today_utc = today_ist.astimezone(timezone.utc)
        
        print(f"📅 Today IST: {today_ist}")
        print(f"📅 Today UTC: {today_utc}")
        
        # Test the exact query from the Today's Bills endpoint (UPDATED)
        print(f"\n🔍 Testing Today's Bills Query...")
        
        query = {
            "organization_id": user_org_id,
            "created_at": {"$gte": today_utc.isoformat()},
            "status": {"$in": ["completed", "paid"]}  # ONLY completed or paid orders
        }
        
        print(f"📋 Query: {query}")
        
        orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).limit(500).to_list(500)
        
        print(f"\n📊 Found {len(orders)} orders in Today's Bills")
        
        # Check each order
        pending_orders_found = []
        
        for order in orders:
            order_id = order.get('id', 'Unknown')[:12]
            customer = order.get('customer_name', 'Unknown')
            status = order.get('status', 'Unknown')
            waiter_name = order.get('waiter_name', 'Unknown')
            payment_received = order.get('payment_received', 0)
            
            print(f"   {order_id}... | {status:10} | {waiter_name:10} | {customer:15} | Payment: {payment_received}")
            
            # Check if any pending orders are included (this is the bug)
            if status == 'pending':
                pending_orders_found.append({
                    'id': order_id,
                    'customer': customer,
                    'waiter_name': waiter_name,
                    'payment_received': payment_received
                })
        
        if pending_orders_found:
            print(f"\n❌ ISSUE FOUND: {len(pending_orders_found)} pending orders in Today's Bills!")
            print(f"   These should only be in Active Orders:")
            
            for order in pending_orders_found:
                print(f"   • {order['customer']} ({order['id']}...) - {order['waiter_name']}")
                
            print(f"\n🔍 Analyzing why pending orders are included...")
            
            # Test each condition in the $or clause
            for order in pending_orders_found:
                order_id = order['id']
                
                # Find the full order
                full_order = await db.orders.find_one(
                    {"id": {"$regex": f"^{order_id}"}},
                    {"_id": 0}
                )
                
                if full_order:
                    status = full_order.get('status')
                    payment_received = full_order.get('payment_received', 0)
                    
                    print(f"\n   Order {order['customer']} ({order_id}...):")
                    print(f"     Status: {status}")
                    print(f"     Payment Received: {payment_received}")
                    
                    # Check which condition matched
                    if status == "completed":
                        print(f"     ✅ Matched: status = 'completed'")
                    elif status == "paid":
                        print(f"     ✅ Matched: status = 'paid'")
                    elif status in ["completed", "paid"] and payment_received > 0:
                        print(f"     ✅ Matched: status in ['completed', 'paid'] AND payment > 0")
                    else:
                        print(f"     ❌ ERROR: No condition should match for pending order!")
                        print(f"     🐛 This indicates a bug in the query logic")
            
            return False
        else:
            print(f"\n✅ CORRECT: No pending orders found in Today's Bills")
            return True
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
        
    finally:
        client.close()

if __name__ == "__main__":
    print("🚀 Today's Bills Endpoint Test")
    print("Testing if pending orders are incorrectly included in Today's Bills")
    print()
    
    success = asyncio.run(test_todays_bills_query())
    
    print("\n" + "=" * 40)
    if success:
        print("✅ Today's Bills query is working correctly!")
    else:
        print("❌ Today's Bills query has issues - pending orders are included!")
        print("   This needs to be fixed immediately")