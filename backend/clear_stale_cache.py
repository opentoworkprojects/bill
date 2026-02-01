#!/usr/bin/env python3
"""
Clear all stale cache for the specific user to ensure fresh data
"""

import asyncio
import os
from datetime import datetime, timezone, timedelta
from redis_cache import RedisCache
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def clear_user_cache():
    """Clear all cache for the specific user"""
    
    # User details from the logs
    user_email = "yashrajkuradiya9@gmail.com"
    org_id = "b1b4ef04-8ab4-4a8b-b043-a3fd828b4941"
    
    print(f"🧹 Clearing all cache for user: {user_email}")
    print(f"🏢 Organization ID: {org_id}")
    
    try:
        # Initialize Redis cache
        cache = RedisCache()
        await cache.connect()
        
        if not cache.is_connected():
            print("❌ Redis not connected - cache might not be available")
            return False
        
        print("✅ Connected to Redis cache")
        
        # Get current date for date-aware cache keys
        today_key = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        yesterday_key = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d")
        
        # List of all possible cache keys for this user
        cache_keys_to_clear = [
            # Date-aware active orders cache
            f"active_orders:{org_id}:{today_key}",
            f"active_orders:{org_id}:{yesterday_key}",
            
            # Legacy active orders cache
            f"active_orders:{org_id}",
            
            # Today's bills cache
            f"todays_bills:{org_id}:{today_key}",
            f"todays_bills:{org_id}:{yesterday_key}",
            
            # Any other organization-specific caches
            f"tables:{org_id}",
            f"menu:{org_id}",
            f"business_profile:{org_id}",
        ]
        
        print(f"🗑️ Clearing {len(cache_keys_to_clear)} cache keys...")
        
        cleared_count = 0
        for key in cache_keys_to_clear:
            try:
                if await cache.delete(key):
                    cleared_count += 1
                    print(f"   ✅ Cleared: {key}")
                else:
                    print(f"   ⚪ Not found: {key}")
            except Exception as key_error:
                print(f"   ❌ Error clearing {key}: {key_error}")
        
        print(f"\n🎉 Cache clearing complete!")
        print(f"   ✅ Cleared {cleared_count} cache keys")
        print(f"   📊 User will now get fresh data from database")
        
        await cache.disconnect()
        return True
        
    except Exception as e:
        print(f"❌ Cache clearing failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting cache clearing for specific user...")
    success = asyncio.run(clear_user_cache())
    
    if success:
        print("\n✅ Cache clearing completed successfully!")
        print("🔧 User should now see only fresh data from database.")
    else:
        print("\n❌ Cache clearing failed!")