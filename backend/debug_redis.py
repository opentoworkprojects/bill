#!/usr/bin/env python3
"""
Debug Redis Connection
"""

import os
import asyncio
from dotenv import load_dotenv
import redis.asyncio as redis

load_dotenv()

async def debug_redis():
    """Debug Redis connection step by step"""
    
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    redis_password = os.getenv("REDIS_PASSWORD")
    
    print(f"🔍 Debug Redis Connection")
    print(f"   REDIS_URL: {redis_url}")
    print(f"   REDIS_PASSWORD: {'***' if redis_password else 'None'}")
    print()
    
    # Check if it's a cloud URL
    is_cloud_url = "cloud.redislabs.com" in redis_url
    print(f"   Is cloud URL: {is_cloud_url}")
    
    if is_cloud_url and redis_password:
        # Add password to URL
        if "://" in redis_url and "@" not in redis_url:
            protocol, rest = redis_url.split("://", 1)
            auth_url = f"{protocol}://:{redis_password}@{rest}"
            print(f"   Auth URL: {protocol}://:{redis_password[:5]}...@{rest}")
        else:
            auth_url = redis_url
            print(f"   Using original URL (already has auth)")
        
        try:
            print("🔌 Attempting connection...")
            r = redis.from_url(
                auth_url,
                decode_responses=True,
                socket_connect_timeout=10,
                socket_timeout=10
            )
            
            print("📡 Pinging Redis...")
            await r.ping()
            print("✅ Redis connection successful!")
            
            # Test basic operations
            await r.set("test_key", "test_value", ex=60)
            value = await r.get("test_key")
            print(f"✅ SET/GET test: {value}")
            
            await r.delete("test_key")
            print("✅ DELETE test: OK")
            
            await r.close()
            
        except Exception as e:
            print(f"❌ Connection failed: {e}")
    else:
        print("❌ Missing cloud URL or password")

if __name__ == "__main__":
    asyncio.run(debug_redis())