#!/usr/bin/env python3
"""
Revert the orders back to completed status - URGENT FIX
"""

import asyncio
import motor.motor_asyncio
from datetime import datetime, timezone

# MongoDB connection
MONGO_URL = "mongodb+srv://shivshankarkumar281_db_user:RNdGNCCyBtj1d5Ar@retsro-ai.un0np9m.mongodb.net/restrobill?retryWrites=true&w=majority&authSource=admin&readPreference=primary&appName=retsro-ai"

async def revert_orders_to_completed():
    """Revert the orders back to completed status"""
    
    print("🚨 URGENT: Reverting Orders Back to Completed")
    print("=" * 50)
    
    # Connect to MongoDB
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
    db = client.restrobill
    
    try:
        # The orders that were incorrectly reverted to pending
        order_ids_to_fix = [
            "b7a880f4-fea",  # 777
            "b1b2af21-843",  # Hariprakash Nagar
            "5e64729c-c26",  # twetq
            "c713de71-a9a",  # 8675654
            "3552f5d7-3b7",  # SHIV
            "88b1254e-783"   # Demo order onlin
        ]
        
        print(f"🔧 Reverting {len(order_ids_to_fix)} orders back to completed...")
        
        fixed_count = 0
        for order_id_prefix in order_ids_to_fix:
            try:
                # Find the full order
                order = await db.orders.find_one(
                    {"id": {"$regex": f"^{order_id_prefix}"}},
                    {"_id": 0, "id": 1, "customer_name": 1, "status": 1}
                )
                
                if not order:
                    print(f"   ❌ Order not found: {order_id_prefix}")
                    continue
                    
                current_status = order.get('status')
                customer_name = order.get('customer_name', 'Unknown')
                
                if current_status == 'completed':
                    print(f"   ✅ Already completed: {customer_name} ({order_id_prefix})")
                    continue
                
                # Revert to completed
                result = await db.orders.update_one(
                    {"id": order['id']},
                    {
                        "$set": {
                            "status": "completed",
                            "updated_at": datetime.now(timezone.utc).isoformat()
                        }
                    }
                )
                
                if result.modified_count > 0:
                    print(f"   ✅ Reverted: {customer_name} ({order_id_prefix}) -> completed")
                    fixed_count += 1
                else:
                    print(f"   ❌ Failed: {customer_name} ({order_id_prefix})")
                    
            except Exception as e:
                print(f"   ❌ Error fixing {order_id_prefix}: {e}")
        
        print(f"\n🎉 Successfully reverted {fixed_count} orders back to completed")
        
        # Verify the fix
        print(f"\n🔍 Verifying the revert...")
        
        for order_id_prefix in order_ids_to_fix:
            order = await db.orders.find_one(
                {"id": {"$regex": f"^{order_id_prefix}"}},
                {"_id": 0, "customer_name": 1, "status": 1}
            )
            
            if order:
                customer_name = order.get('customer_name', 'Unknown')
                status = order.get('status')
                print(f"   {customer_name}: {status}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
        
    finally:
        client.close()

if __name__ == "__main__":
    print("🚨 URGENT FIX: Reverting Orders Back to Completed Status")
    print("This will restore the orders that were incorrectly changed to pending")
    print()
    
    success = asyncio.run(revert_orders_to_completed())
    
    if success:
        print("\n✅ Orders successfully reverted back to completed!")
        print("   User data has been restored to correct state")
    else:
        print("\n❌ Failed to revert orders")