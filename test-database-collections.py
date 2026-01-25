#!/usr/bin/env python3
# Test database collections and queries

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta

# Database configuration
MONGO_URL = "mongodb+srv://shivshankarkumar281_db_user:RNdGNCCyBtj1d5Ar@retsro-ai.un0np9m.mongodb.net/restrobill?retryWrites=true&w=majority&authSource=admin&readPreference=primary&appName=retsro-ai"
DB_NAME = "restrobill"

async def test_database():
    print("🔍 Testing Database Collections and Queries")
    print("=" * 50)
    
    try:
        # Connect to database
        client = AsyncIOMotorClient(MONGO_URL)
        db = client[DB_NAME]
        
        print("✅ Connected to MongoDB")
        
        # Test collections
        collections = await db.list_collection_names()
        print(f"📋 Available collections: {len(collections)}")
        for collection in sorted(collections):
            print(f"   • {collection}")
        
        print("\n🔍 Testing Collection Queries:")
        
        # Test users collection
        print("\n1. Testing users collection...")
        try:
            users_count = await db.users.count_documents({})
            print(f"   ✅ Users count: {users_count}")
            
            if users_count > 0:
                # Test users query with projection
                sample_user = await db.users.find_one(
                    {}, 
                    {"_id": 0, "password": 0, "orders": 0, "menu_items": 0, "tables": 0}
                )
                print(f"   ✅ Sample user query successful")
                print(f"   📊 Sample user fields: {list(sample_user.keys()) if sample_user else 'None'}")
            else:
                print("   ⚠️ No users found in database")
        except Exception as e:
            print(f"   ❌ Users query failed: {e}")
        
        # Test orders collection
        print("\n2. Testing orders collection...")
        try:
            orders_count = await db.orders.count_documents({})
            print(f"   ✅ Orders count: {orders_count}")
            
            # Test recent orders query
            thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
            recent_orders_count = await db.orders.count_documents({
                "created_at": {"$gte": thirty_days_ago}
            })
            print(f"   ✅ Recent orders (30 days): {recent_orders_count}")
        except Exception as e:
            print(f"   ❌ Orders query failed: {e}")
        
        # Test tickets collection
        print("\n3. Testing support_tickets collection...")
        try:
            tickets_count = await db.support_tickets.count_documents({})
            print(f"   ✅ Tickets count: {tickets_count}")
        except Exception as e:
            print(f"   ❌ Tickets query failed: {e}")
        
        # Test leads collection
        print("\n4. Testing leads collection...")
        try:
            leads_count = await db.leads.count_documents({})
            print(f"   ✅ Leads count: {leads_count}")
        except Exception as e:
            print(f"   ❌ Leads query failed: {e}")
        
        # Test team_members collection
        print("\n5. Testing team_members collection...")
        try:
            team_count = await db.team_members.count_documents({})
            print(f"   ✅ Team members count: {team_count}")
        except Exception as e:
            print(f"   ❌ Team members query failed: {e}")
        
        # Test aggregation queries (like dashboard uses)
        print("\n6. Testing aggregation queries...")
        try:
            # Test user aggregation
            user_stats = await db.users.aggregate([
                {
                    "$group": {
                        "_id": None,
                        "total_users": {"$sum": 1},
                        "active_subscriptions": {
                            "$sum": {"$cond": [{"$eq": ["$subscription_active", True]}, 1, 0]}
                        }
                    }
                }
            ]).to_list(1)
            print(f"   ✅ User aggregation successful: {user_stats}")
        except Exception as e:
            print(f"   ❌ User aggregation failed: {e}")
        
        print("\n🎯 Database Test Summary:")
        print(f"   • Database connection: ✅ Working")
        print(f"   • Collections available: {len(collections)}")
        print(f"   • Basic queries: Testing completed")
        
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
    
    finally:
        if 'client' in locals():
            client.close()

if __name__ == "__main__":
    asyncio.run(test_database())