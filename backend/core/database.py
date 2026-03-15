import os
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from motor.core import AgnosticDatabase
from typing import Optional
from .config import settings

class Database:
    client: AsyncIOMotorClient = None
    db: AgnosticDatabase = None

db = Database()

async def get_database() -> AsyncIOMotorDatabase:
    """Get database connection"""
    if db.client is None:
        await connect_to_mongo()
    return db.db

async def connect_to_mongo():
    """Initialize MongoDB connection"""
    # Configure connection pooling for high-performance under load
    client_options = {
        "maxPoolSize": 100,           # Increased for high concurrent requests (was 10)
        "minPoolSize": 10,            # Keep more connections alive
        "maxIdleTimeMS": 30000,       # 30 seconds idle before closing
        "serverSelectionTimeoutMS": 10000,   # 10s server selection timeout
        "connectTimeoutMS": 15000,    # 15s connection timeout
        "socketTimeoutMS": 30000,     # 30s socket timeout
        "waitQueueTimeoutMS": 5000,   # 5s wait for connection from pool (reduced)
        "retryWrites": True,          # Automatic write retries
        "w": "majority",              # Write concern
        "readPreference": "primaryPreferred"  # Prefer primary for reads
    }
    
    db.client = AsyncIOMotorClient(settings.MONGODB_URI, **client_options)
    db.db = db.client[settings.MONGODB_NAME]
    
    # Test connection
    try:
        await db.db.command("ping")
        print("✅ Connected to MongoDB with optimized pooling")
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
        raise
    
    # Create indexes
    await create_indexes()

async def close_mongo_connection():
    """Close MongoDB connection"""
    if db.client is not None:
        db.client.close()
        print("✅ Closed MongoDB connection")

async def create_indexes():
    """Create necessary database indexes"""
    # Orders collection - Performance optimized indexes
    await db.db.orders.create_index([("organization_id", 1), ("created_at", -1)])
    await db.db.orders.create_index([("table_number", 1), ("status", 1)])
    await db.db.orders.create_index([("status", 1), ("organization_id", 1)])  # Critical for kitchen filtering
    await db.db.orders.create_index([("waiter_id", 1), ("created_at", -1)])  # For staff reports
    await db.db.orders.create_index([("customer_phone", 1)])  # For customer lookups
    await db.db.orders.create_index([("date", 1), ("organization_id", 1)])  # For date-range queries
    await db.db.orders.create_index("invoice_number", unique=True, sparse=True)
    
    # Users collection
    await db.db.users.create_index("email", unique=True)
    await db.db.users.create_index("organization_id")
    
    # Tables collection
    await db.db.tables.create_index(
        [("organization_id", 1), ("table_number", 1)], 
        unique=True
    )
    
    # Menu items collection - Performance optimized
    await db.db.menu_items.create_index(
        [("organization_id", 1), ("name", 1)],
        unique=True
    )
    await db.db.menu_items.create_index([("organization_id", 1), ("active", 1)])  # For active menu filtering
    
    print("✅ Created optimized database indexes for high performance")
