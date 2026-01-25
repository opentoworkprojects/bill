#!/usr/bin/env python3
"""
Fix Anu Restaurant trial properly by setting trial_extension_days
Based on the backend logic in check_subscription function
"""

import asyncio
import os
from datetime import datetime, timedelta, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv("backend/.env")

# MongoDB connection
mongo_url = os.getenv("MONGO_URL")
client = AsyncIOMotorClient(mongo_url, tls=True, tlsInsecure=True, serverSelectionTimeoutMS=10000)
db = client[os.getenv("DB_NAME", "restrobill")]

async def fix_anu_trial_properly():
    """Fix Anu Restaurant trial using the correct backend logic"""
    print("🔧 Fixing Anu Restaurant trial using correct backend logic...")
    
    try:
        # Find the user
        user = await db.users.find_one({
            "id": "35fcf727-c166-45e2-ac87-1fdc1dd5c41e"
        })
        
        if not user:
            print("❌ User not found!")
            return
        
        username = user.get("username", "Unknown")
        email = user.get("email", "Unknown")
        restaurant_name = user.get("business_settings", {}).get("restaurant_name", "Not set")
        created_at = user.get("created_at")
        current_trial_extension = user.get("trial_extension_days", 0)
        
        print(f"✅ Found user: {username} ({email})")
        print(f"   Restaurant: {restaurant_name}")
        print(f"   Created at: {created_at}")
        print(f"   Current trial extension days: {current_trial_extension}")
        
        # Calculate how many days since account creation
        if isinstance(created_at, str):
            created_dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
        else:
            created_dt = created_at
        
        current_time = datetime.now(timezone.utc)
        days_since_creation = (current_time - created_dt).days
        
        print(f"   Days since account creation: {days_since_creation}")
        print(f"   Default trial period: 7 days")
        print(f"   Current total trial days: {7 + current_trial_extension}")
        
        # Backend logic: trial_end = created_at + timedelta(days=7 + trial_extension_days)
        # We want to extend by 100 days from now
        # So we need: trial_extension_days = (days_since_creation - 7) + 100
        
        needed_extension_days = max(0, days_since_creation - 7) + 100
        
        print(f"\n🔄 Calculating needed extension:")
        print(f"   Days already past default trial: {max(0, days_since_creation - 7)}")
        print(f"   Additional days requested: 100")
        print(f"   Total trial_extension_days needed: {needed_extension_days}")
        
        # Update the user with proper trial extension
        update_result = await db.users.update_one(
            {"id": "35fcf727-c166-45e2-ac87-1fdc1dd5c41e"},
            {
                "$set": {
                    "trial_extension_days": needed_extension_days,
                    "subscription_expires_at": None,  # Clear this as backend uses trial_extension_days
                    "subscription_active": False,  # Keep as trial
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )
        
        if update_result.modified_count > 0:
            # Calculate the new trial end date
            new_trial_end = created_dt + timedelta(days=7 + needed_extension_days)
            days_remaining = (new_trial_end - current_time).days
            
            print(f"\n✅ Successfully updated trial extension!")
            print(f"   trial_extension_days: {needed_extension_days}")
            print(f"   New trial end date: {new_trial_end.strftime('%Y-%m-%d %H:%M:%S UTC')}")
            print(f"   Days remaining: {days_remaining}")
            
            # Log the action
            await db.admin_actions.insert_one({
                "action": "fix_trial_extension",
                "user_id": "35fcf727-c166-45e2-ac87-1fdc1dd5c41e",
                "username": username,
                "email": email,
                "restaurant_name": restaurant_name,
                "trial_extension_days": needed_extension_days,
                "new_trial_end": new_trial_end,
                "days_remaining": days_remaining,
                "performed_by": "manual_script_fix",
                "performed_at": datetime.now(timezone.utc),
                "reason": "Fixed trial using correct backend logic (trial_extension_days)",
                "method": "local_database_script"
            })
            
            print(f"📝 Action logged in admin_actions collection")
            
            # Verify the fix by simulating backend logic
            print(f"\n🔍 Verifying fix with backend logic:")
            print(f"   created_at: {created_dt}")
            print(f"   trial_extension_days: {needed_extension_days}")
            print(f"   total_trial_days: {7 + needed_extension_days}")
            print(f"   trial_end: {new_trial_end}")
            print(f"   current_time: {current_time}")
            print(f"   is_trial_active: {current_time < new_trial_end}")
            
            if current_time < new_trial_end:
                print(f"   ✅ Backend should now allow access!")
            else:
                print(f"   ❌ Still expired - calculation error")
            
            print(f"\n🎉 Trial extension fix completed!")
            print(f"   Anu Restaurant should now have access for {days_remaining} more days")
            
        else:
            print(f"❌ Failed to update user")
        
    except Exception as e:
        print(f"❌ Error fixing trial: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        client.close()

if __name__ == "__main__":
    print("🔧 Anu Restaurant Trial Fix (Proper Method)")
    print("=" * 50)
    asyncio.run(fix_anu_trial_properly())