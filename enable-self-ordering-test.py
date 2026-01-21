#!/usr/bin/env python3
"""
Enable self-ordering for a restaurant to test QR orders
"""

import asyncio
import motor.motor_asyncio
import os

# MongoDB connection
MONGO_URL = "mongodb+srv://shivshankarkumar281_db_user:RNdGNCCyBtj1d5Ar@retsro-ai.un0np9m.mongodb.net/restrobill?retryWrites=true&w=majority&authSource=admin&readPreference=primary&appName=retsro-ai"

async def enable_self_ordering():
    """Enable self-ordering for a restaurant"""
    
    print("🔧 Enabling Self-Ordering for Testing")
    print("=" * 40)
    
    # Connect to MongoDB
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
    db = client.restrobill
    
    try:
        # Find a restaurant (admin user)
        user = await db.users.find_one({"role": "admin"}, {"_id": 0})
        if not user:
            print("❌ No admin users found")
            return False
            
        org_id = user["id"]
        restaurant_name = user.get("business_settings", {}).get("restaurant_name", "Unknown")
        
        print(f"📍 Found restaurant: {restaurant_name}")
        print(f"   Org ID: {org_id}")
        
        # Check current self-ordering status
        current_enabled = user.get("business_settings", {}).get("customer_self_order_enabled", False)
        print(f"   Current self-ordering status: {current_enabled}")
        
        if current_enabled:
            print("✅ Self-ordering is already enabled!")
            return True
            
        # Enable self-ordering
        print("🔧 Enabling self-ordering...")
        
        result = await db.users.update_one(
            {"id": org_id},
            {"$set": {"business_settings.customer_self_order_enabled": True}}
        )
        
        if result.modified_count > 0:
            print("✅ Self-ordering enabled successfully!")
            
            # Verify the change
            updated_user = await db.users.find_one({"id": org_id}, {"_id": 0, "business_settings": 1})
            enabled = updated_user.get("business_settings", {}).get("customer_self_order_enabled", False)
            print(f"   Verified: customer_self_order_enabled = {enabled}")
            
            return True
        else:
            print("❌ Failed to enable self-ordering")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
        
    finally:
        client.close()

if __name__ == "__main__":
    success = asyncio.run(enable_self_ordering())
    
    if success:
        print("\n🎉 Self-ordering is now enabled!")
        print("You can now test QR order creation.")
    else:
        print("\n❌ Failed to enable self-ordering")