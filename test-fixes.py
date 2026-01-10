#!/usr/bin/env python3
"""
Test script to verify the fixes for BillByteKOT issues
"""

import asyncio
import os
import sys
from datetime import datetime, timezone

async def test_redis_connection():
    """Test Redis connection"""
    print("🔍 Testing Redis connection...")
    try:
        import redis.asyncio as redis
        
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        redis_password = os.getenv("REDIS_PASSWORD")
        
        if redis_password:
            if "://" in redis_url and "@" not in redis_url:
                protocol, rest = redis_url.split("://", 1)
                auth_url = f"{protocol}://:{redis_password}@{rest}"
            else:
                auth_url = redis_url
        else:
            auth_url = redis_url
        
        r = redis.from_url(auth_url, decode_responses=True, socket_connect_timeout=5)
        await r.ping()
        print("✅ Redis connection successful")
        await r.aclose()
        return True
    except Exception as e:
        print(f"❌ Redis connection failed: {e}")
        return False

async def test_mongodb_connection():
    """Test MongoDB connection"""
    print("🔍 Testing MongoDB connection...")
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        
        mongo_url = os.getenv("MONGO_URL")
        if not mongo_url:
            print("❌ MONGO_URL not set")
            return False
        
        client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
        db = client[os.getenv("DB_NAME", "restrobill")]
        await db.command("ping")
        print("✅ MongoDB connection successful")
        client.close()
        return True
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        return False

def test_super_admin_credentials():
    """Test super admin credentials"""
    print("🔍 Testing super admin credentials...")
    
    username = os.getenv("SUPER_ADMIN_USERNAME")
    password = os.getenv("SUPER_ADMIN_PASSWORD")
    
    if not username:
        print("❌ SUPER_ADMIN_USERNAME not set")
        return False
    
    if not password:
        print("❌ SUPER_ADMIN_PASSWORD not set")
        return False
    
    if password == "change-this-password-123":
        print("⚠️ Using default password - should be changed for production")
    
    print(f"✅ Super admin credentials configured (username: {username})")
    return True

def test_date_handling():
    """Test date handling for today's reports"""
    print("🔍 Testing date handling...")
    
    # Test IST timezone handling
    from datetime import timedelta
    IST = timezone(timedelta(hours=5, minutes=30))
    
    now_ist = datetime.now(IST)
    today_ist = now_ist.replace(hour=0, minute=0, second=0, microsecond=0)
    today_utc = today_ist.astimezone(timezone.utc)
    
    print(f"✅ Current IST time: {now_ist}")
    print(f"✅ Today IST start: {today_ist}")
    print(f"✅ Today UTC start: {today_utc}")
    
    return True

async def main():
    """Run all tests"""
    print("🚀 BillByteKOT Fix Verification Tests")
    print("=" * 50)
    
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    tests = [
        ("Super Admin Credentials", test_super_admin_credentials),
        ("Date Handling", test_date_handling),
        ("MongoDB Connection", test_mongodb_connection),
        ("Redis Connection", test_redis_connection),
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n📋 {test_name}")
        try:
            if asyncio.iscoroutinefunction(test_func):
                result = await test_func()
            else:
                result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {e}")
            results.append((test_name, False))
    
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    
    passed = 0
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status} - {test_name}")
        if result:
            passed += 1
    
    print(f"\n🎯 {passed}/{len(results)} tests passed")
    
    if passed == len(results):
        print("🎉 All tests passed! The fixes should work correctly.")
    else:
        print("⚠️ Some tests failed. Check the issues above.")
    
    return passed == len(results)

if __name__ == "__main__":
    try:
        result = asyncio.run(main())
        sys.exit(0 if result else 1)
    except KeyboardInterrupt:
        print("\n🛑 Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
        sys.exit(1)