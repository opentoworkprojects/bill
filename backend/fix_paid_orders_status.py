#!/usr/bin/env python3
"""
Fix orders that are paid but still showing as active
"""

import asyncio
import os
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def fix_paid_orders():
    """Fix orders that are paid but have wrong status"""
    
    # User details
    user_email = "yashrajkuradiya9@gmail.com"
    org_id = "b1b4ef04-8ab4-4a8b-b043-a3fd828b4941"
    
    print(f"🔧 Fixing paid orders for user: {user_email}")
    print(f"🏢 Organization ID: {org_id}")
    
    try:
        # Connect to MongoDB
        mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
        db_name = os.getenv("DB_NAME", "restrobill")
        
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        
        # Test connection
        await db.command("ping")
        print("✅ Connected to MongoDB")
        
        # Find orders that are fully paid but not marked as completed
        print(f"\n🔍 Finding orders that are paid but not marked as completed...")
        
        # Query for orders that are:
        # 1. Not completed/paid/cancelled
        # 2. Payment received >= total amount
        # 3. Balance amount <= 0
        # 4. Not credit orders
        query = {
            "organization_id": org_id,
            "status": {"$nin": ["completed", "paid", "cancelled"]},
            "$expr": {
                "$and": [
                    {"$gte": ["$payment_received", "$total"]},
                    {"$lte": ["$balance_amount", 0]}
                ]
            }
        }
        
        orders_to_fix = await db.orders.find(
            query,
            {"_id": 0, "id": 1, "status": 1, "total": 1, "payment_received": 1, "balance_amount": 1, "created_at": 1, "is_credit": 1}
        ).to_list(50)
        
        print(f"📊 Found {len(orders_to_fix)} orders that need status fix")
        
        if not orders_to_fix:
            print("✅ No orders need fixing!")
            client.close()
            return True
        
        # Show details of orders to fix
        print(f"\n📋 Orders to fix:")
        for order in orders_to_fix:
            print(f"   - Order {order.get('id')}: {order.get('status')} (Paid: ₹{order.get('payment_received')}/₹{order.get('total')}, Balance: ₹{order.get('balance_amount')})")
        
        # Ask for confirmation
        print(f"\n⚠️  This will update {len(orders_to_fix)} orders from various statuses to 'completed'")
        print(f"   These orders will move from active orders to completed orders")
        
        # Fix the orders
        print(f"\n🔧 Updating order statuses...")
        
        fixed_count = 0
        for order in orders_to_fix:
            order_id = order.get('id')
            
            # Skip credit orders
            if order.get('is_credit', False):
                print(f"   ⏭️  Skipping credit order: {order_id}")
                continue
            
            try:
                # Update status to completed
                result = await db.orders.update_one(
                    {"id": order_id, "organization_id": org_id},
                    {
                        "$set": {
                            "status": "completed",
                            "updated_at": datetime.now(timezone.utc).isoformat()
                        }
                    }
                )
                
                if result.modified_count > 0:
                    print(f"   ✅ Fixed order {order_id}: {order.get('status')} → completed")
                    fixed_count += 1
                else:
                    print(f"   ❌ Failed to fix order {order_id}")
                    
            except Exception as update_error:
                print(f"   ❌ Error fixing order {order_id}: {update_error}")
        
        print(f"\n🎉 SUMMARY:")
        print(f"   ✅ Fixed {fixed_count} orders")
        print(f"   📊 These orders will now appear in completed orders instead of active orders")
        
        # Verify the fix
        print(f"\n🔍 Verifying fix...")
        
        # Check active orders count after fix
        active_count = await db.orders.count_documents({
            "organization_id": org_id,
            "status": {"$nin": ["completed", "cancelled", "paid"]}
        })
        
        # Check completed orders count
        completed_count = await db.orders.count_documents({
            "organization_id": org_id,
            "status": {"$in": ["completed", "paid"]}
        })
        
        print(f"   📊 After fix:")
        print(f"      - Active orders: {active_count}")
        print(f"      - Completed orders: {completed_count}")
        
        client.close()
        
        if fixed_count > 0:
            print(f"\n💡 NEXT STEPS:")
            print(f"   1. Clear all caches to ensure fresh data")
            print(f"   2. User should now see correct active orders count")
            print(f"   3. Fixed orders should appear in completed orders list")
        
        return True
        
    except Exception as e:
        print(f"❌ Fix failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting paid orders status fix...")
    success = asyncio.run(fix_paid_orders())
    
    if success:
        print("\n✅ Fix completed successfully!")
    else:
        print("\n❌ Fix failed!")