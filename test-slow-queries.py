#!/usr/bin/env python3
# Test the specific slow queries from Super Admin endpoints

import asyncio
import time
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta

# Database configuration
MONGO_URL = "mongodb+srv://shivshankarkumar281_db_user:RNdGNCCyBtj1d5Ar@retsro-ai.un0np9m.mongodb.net/restrobill?retryWrites=true&w=majority&authSource=admin&readPreference=primary&appName=retsro-ai"
DB_NAME = "restrobill"

async def test_slow_queries():
    print("🐌 Testing Slow Super Admin Queries")
    print("=" * 50)
    
    try:
        client = AsyncIOMotorClient(MONGO_URL)
        db = client[DB_NAME]
        
        print("✅ Connected to MongoDB")
        
        # Test 1: Users query (the one that's timing out)
        print("\n1. Testing Users Query (Original)...")
        start_time = time.time()
        try:
            users = await db.users.find({}, {"_id": 0, "password": 0}).skip(0).limit(50).to_list(50)
            duration = time.time() - start_time
            print(f"   ✅ Users query completed in {duration:.2f}s")
            print(f"   📊 Retrieved {len(users)} users")
        except Exception as e:
            duration = time.time() - start_time
            print(f"   ❌ Users query failed after {duration:.2f}s: {e}")
        
        # Test 2: Optimized Users query
        print("\n2. Testing Optimized Users Query...")
        start_time = time.time()
        try:
            users = await db.users.find(
                {}, 
                {
                    "_id": 0, 
                    "password": 0,
                    "orders": 0,
                    "menu_items": 0,
                    "tables": 0,
                    "business_data": 0
                }
            ).skip(0).limit(50).to_list(50)
            duration = time.time() - start_time
            print(f"   ✅ Optimized users query completed in {duration:.2f}s")
            print(f"   📊 Retrieved {len(users)} users")
        except Exception as e:
            duration = time.time() - start_time
            print(f"   ❌ Optimized users query failed after {duration:.2f}s: {e}")
        
        # Test 3: Dashboard aggregation query
        print("\n3. Testing Dashboard Aggregation Query...")
        start_time = time.time()
        try:
            user_stats = await db.users.aggregate([
                {
                    "$group": {
                        "_id": None,
                        "total_users": {"$sum": 1},
                        "active_subscriptions": {
                            "$sum": {"$cond": [{"$eq": ["$subscription_active", True]}, 1, 0]}
                        },
                        "trial_users": {
                            "$sum": {"$cond": [{"$eq": ["$subscription_active", True]}, 0, 1]}
                        }
                    }
                }
            ]).to_list(1)
            duration = time.time() - start_time
            print(f"   ✅ Dashboard aggregation completed in {duration:.2f}s")
            print(f"   📊 Stats: {user_stats[0] if user_stats else 'No data'}")
        except Exception as e:
            duration = time.time() - start_time
            print(f"   ❌ Dashboard aggregation failed after {duration:.2f}s: {e}")
        
        # Test 4: Orders count query
        print("\n4. Testing Orders Count Query...")
        start_time = time.time()
        try:
            thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
            orders_count = await db.orders.count_documents({
                "created_at": {"$gte": thirty_days_ago}
            })
            duration = time.time() - start_time
            print(f"   ✅ Orders count completed in {duration:.2f}s")
            print(f"   📊 Recent orders: {orders_count}")
        except Exception as e:
            duration = time.time() - start_time
            print(f"   ❌ Orders count failed after {duration:.2f}s: {e}")
        
        # Test 5: User details query (the other slow one)
        print("\n5. Testing User Details Query...")
        start_time = time.time()
        try:
            # Get first user ID
            first_user = await db.users.find_one({}, {"id": 1})
            if first_user and "id" in first_user:
                user_id = first_user["id"]
                print(f"   🔍 Testing with user ID: {user_id}")
                
                # Test the slow user details query
                user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
                orders_count = await db.orders.count_documents({"organization_id": user_id})
                
                duration = time.time() - start_time
                print(f"   ✅ User details query completed in {duration:.2f}s")
                print(f"   📊 User found: {user is not None}, Orders: {orders_count}")
            else:
                print("   ⚠️ No user found to test with")
        except Exception as e:
            duration = time.time() - start_time
            print(f"   ❌ User details query failed after {duration:.2f}s: {e}")
        
        # Test 6: Check indexes
        print("\n6. Checking Database Indexes...")
        try:
            users_indexes = await db.users.index_information()
            orders_indexes = await db.orders.index_information()
            
            print(f"   📊 Users collection indexes: {list(users_indexes.keys())}")
            print(f"   📊 Orders collection indexes: {list(orders_indexes.keys())}")
            
            # Check if we have the right indexes
            has_users_id_index = any("id" in str(idx) for idx in users_indexes.keys())
            has_orders_org_index = any("organization_id" in str(idx) for idx in orders_indexes.keys())
            has_orders_date_index = any("created_at" in str(idx) for idx in orders_indexes.keys())
            
            print(f"   ✅ Users ID index: {'✅' if has_users_id_index else '❌'}")
            print(f"   ✅ Orders org_id index: {'✅' if has_orders_org_index else '❌'}")
            print(f"   ✅ Orders date index: {'✅' if has_orders_date_index else '❌'}")
            
        except Exception as e:
            print(f"   ❌ Index check failed: {e}")
        
        print("\n🎯 Query Performance Summary:")
        print("   • Database connection: ✅ Working")
        print("   • Query optimization needed for large datasets")
        print("   • Consider adding database indexes for better performance")
        
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
    
    finally:
        if 'client' in locals():
            client.close()

if __name__ == "__main__":
    asyncio.run(test_slow_queries())