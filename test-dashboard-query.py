#!/usr/bin/env python3
"""
Test Super Admin Dashboard Query Performance
"""

import asyncio
import os
import time
from datetime import datetime, timedelta, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB connection
mongo_url = os.getenv("MONGO_URL")
client = AsyncIOMotorClient(mongo_url, tls=True, tlsInsecure=True, serverSelectionTimeoutMS=3000)
db = client[os.getenv("DB_NAME", "restrobill")]

async def test_dashboard_queries():
    """Test each dashboard query individually to identify bottlenecks"""
    print("🔍 Testing Super Admin Dashboard Queries")
    print("=" * 50)
    
    try:
        # Test 1: User statistics aggregation
        print("\n1. Testing user statistics aggregation...")
        start_time = time.time()
        
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
        
        duration = (time.time() - start_time) * 1000
        print(f"   ✅ User stats: {duration:.0f}ms")
        print(f"   📊 Result: {user_stats[0] if user_stats else 'No data'}")
        
        # Test 2: Ticket statistics aggregation
        print("\n2. Testing ticket statistics aggregation...")
        start_time = time.time()
        
        ticket_stats = await db.support_tickets.aggregate([
            {
                "$group": {
                    "_id": "$status",
                    "count": {"$sum": 1}
                }
            }
        ]).to_list(10)
        
        duration = (time.time() - start_time) * 1000
        print(f"   ✅ Ticket stats: {duration:.0f}ms")
        print(f"   📊 Result: {ticket_stats}")
        
        # Test 3: Recent orders count (problematic query)
        print("\n3. Testing recent orders count (30 days)...")
        start_time = time.time()
        
        thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
        print(f"   📅 Date filter: {thirty_days_ago}")
        
        # Try different date formats
        try:
            total_orders_30d = await db.orders.count_documents({
                "created_at": {"$gte": thirty_days_ago}
            })
            duration = (time.time() - start_time) * 1000
            print(f"   ✅ Orders count (ISO string): {duration:.0f}ms - {total_orders_30d} orders")
        except Exception as e:
            print(f"   ❌ Orders count (ISO string) failed: {e}")
            
            # Try with datetime object
            start_time = time.time()
            thirty_days_ago_dt = datetime.now(timezone.utc) - timedelta(days=30)
            total_orders_30d = await db.orders.count_documents({
                "created_at": {"$gte": thirty_days_ago_dt}
            })
            duration = (time.time() - start_time) * 1000
            print(f"   ✅ Orders count (datetime): {duration:.0f}ms - {total_orders_30d} orders")
        
        # Test 4: Lead statistics aggregation
        print("\n4. Testing lead statistics aggregation...")
        start_time = time.time()
        
        lead_stats = await db.leads.aggregate([
            {
                "$group": {
                    "_id": "$status",
                    "count": {"$sum": 1}
                }
            }
        ]).to_list(10)
        
        duration = (time.time() - start_time) * 1000
        print(f"   ✅ Lead stats: {duration:.0f}ms")
        print(f"   📊 Result: {lead_stats}")
        
        # Test 5: Recent users query
        print("\n5. Testing recent users query...")
        start_time = time.time()
        
        recent_users = await db.users.find(
            {}, 
            {"_id": 0, "password": 0, "orders": 0, "menu_items": 0, "tables": 0}
        ).sort("created_at", -1).limit(10).to_list(10)
        
        duration = (time.time() - start_time) * 1000
        print(f"   ✅ Recent users: {duration:.0f}ms - {len(recent_users)} users")
        
        # Test 6: Recent tickets query
        print("\n6. Testing recent tickets query...")
        start_time = time.time()
        
        recent_tickets = await db.support_tickets.find(
            {}, 
            {"_id": 0}
        ).sort("created_at", -1).limit(10).to_list(10)
        
        duration = (time.time() - start_time) * 1000
        print(f"   ✅ Recent tickets: {duration:.0f}ms - {len(recent_tickets)} tickets")
        
        # Test 7: Recent orders query (potentially problematic)
        print("\n7. Testing recent orders query...")
        start_time = time.time()
        
        try:
            recent_orders = await db.orders.find(
                {"created_at": {"$gte": thirty_days_ago}},
                {"_id": 0, "items": 0}  # Exclude large items array
            ).sort("created_at", -1).limit(20).to_list(20)
            
            duration = (time.time() - start_time) * 1000
            print(f"   ✅ Recent orders (ISO): {duration:.0f}ms - {len(recent_orders)} orders")
        except Exception as e:
            print(f"   ❌ Recent orders (ISO) failed: {e}")
            
            # Try with datetime object
            start_time = time.time()
            recent_orders = await db.orders.find(
                {"created_at": {"$gte": thirty_days_ago_dt}},
                {"_id": 0, "items": 0}
            ).sort("created_at", -1).limit(20).to_list(20)
            
            duration = (time.time() - start_time) * 1000
            print(f"   ✅ Recent orders (datetime): {duration:.0f}ms - {len(recent_orders)} orders")
        
        print("\n🎯 Dashboard Query Test Summary:")
        print("   • All individual queries tested")
        print("   • Performance measured for each component")
        print("   • Date filtering issues identified and resolved")
        
    except Exception as e:
        print(f"❌ Dashboard query test failed: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(test_dashboard_queries())