"""
Database Migration: Add indexes for order creation performance optimization

This migration adds compound indexes to the orders collection to optimize:
1. Duplicate order checks (last 30 seconds)
2. Order consolidation checks (last 2 hours)

Expected performance improvement:
- Duplicate check: 300ms → <50ms
- Consolidation check: 500ms → <100ms
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def add_order_indexes():
    """Add compound indexes to orders collection"""
    
    # Connect to MongoDB
    mongo_url = os.getenv("MONGO_URL")
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.getenv("DB_NAME", "restrobill")]
    
    print("🔧 Adding indexes to orders collection...")
    
    try:
        # Index 1: For duplicate order checks (last 30 seconds)
        # Optimizes: db.orders.find({organization_id, table_id, created_at: {$gte: ...}})
        try:
            index1 = await db.orders.create_index([
                ("organization_id", 1),
                ("table_id", 1),
                ("created_at", -1)
            ], name="idx_org_table_created")
            print(f"✅ Created index: {index1}")
        except Exception as e:
            if "already exists" in str(e).lower():
                print(f"ℹ️  Index idx_org_table_created already exists")
            else:
                raise
        
        # Index 2: For order consolidation checks (last 2 hours, pending/preparing status)
        # Optimizes: db.orders.find({organization_id, table_id, status: {$in: [...]}, created_at: {$gte: ...}})
        try:
            index2 = await db.orders.create_index([
                ("organization_id", 1),
                ("table_id", 1),
                ("status", 1),
                ("created_at", -1)
            ], name="idx_org_table_status_created")
            print(f"✅ Created index: {index2}")
        except Exception as e:
            if "already exists" in str(e).lower():
                print(f"ℹ️  Index idx_org_table_status_created already exists")
            else:
                raise
        
        # Index 3: For waiter-specific duplicate checks
        # Optimizes: db.orders.find({organization_id, table_id, waiter_id, created_at: {$gte: ...}})
        try:
            index3 = await db.orders.create_index([
                ("organization_id", 1),
                ("table_id", 1),
                ("waiter_id", 1),
                ("created_at", -1)
            ], name="idx_org_table_waiter_created")
            print(f"✅ Created index: {index3}")
        except Exception as e:
            if "already exists" in str(e).lower():
                print(f"ℹ️  Index idx_org_table_waiter_created already exists")
            else:
                raise
        
        # Verify indexes
        indexes = await db.orders.list_indexes().to_list(None)
        print(f"\n📊 Total indexes on orders collection: {len(indexes)}")
        for idx in indexes:
            print(f"  - {idx.get('name')}: {idx.get('key')}")
        
        print("\n✅ Migration completed successfully!")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        raise
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(add_order_indexes())
