"""
Database Migration: Add WhatsApp Template Collection

Creates the whatsapp_templates collection with proper indexes for
tracking Meta Business Manager template approval status and categories.

This migration supports the WhatsApp message delivery fix by replacing
name-pattern based template validation with actual Meta API verification.

Bug Fix Context:
- Templates were assumed UTILITY based on name patterns
- No verification of actual Meta approval status
- Caused 24-hour window restriction errors (131047/131026)
- Need to track actual Meta categories: UTILITY, MARKETING, AUTHENTICATION

Collection Schema:
- template_name: Unique template name from Meta Business Manager
- meta_category: Actual Meta category (UTILITY/MARKETING/AUTHENTICATION)  
- approval_status: Meta approval status (APPROVED/PENDING/REJECTED/DISABLED)
- last_verified: Timestamp of last Meta API verification
- created_at/updated_at: Standard timestamps
- organization_id: Multi-tenant support (optional)

Indexes:
- Unique index on template_name (prevent duplicates)
- Compound index on template_name + organization_id (multi-tenant queries)
- Index on meta_category + approval_status (validation queries)
- Index on last_verified (TTL cleanup queries)
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()


async def _safe_create_index(collection, keys, name, **kwargs):
    """Create an index, silently skip if it already exists."""
    try:
        result = await collection.create_index(keys, name=name, **kwargs)
        print(f"  ✅ {name}")
        return result
    except Exception as e:
        if "already exists" in str(e).lower() or "IndexOptionsConflict" in str(e):
            print(f"  ℹ️  {name} already exists")
        else:
            print(f"  ❌ {name} failed: {e}")
            raise


async def _safe_create_collection(db, collection_name):
    """Create a collection, silently skip if it already exists."""
    try:
        await db.create_collection(collection_name)
        print(f"  ✅ Collection '{collection_name}' created")
    except Exception as e:
        if "already exists" in str(e).lower():
            print(f"  ℹ️  Collection '{collection_name}' already exists")
        else:
            print(f"  ❌ Collection '{collection_name}' creation failed: {e}")
            raise


async def add_whatsapp_template_collection():
    """Add WhatsApp template collection with proper indexes."""
    mongo_url = os.getenv("MONGO_URL")
    if not mongo_url:
        print("❌ MONGO_URL environment variable not set")
        return
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.getenv("DB_NAME", "restrobill")]

    try:
        print("\n🔧 Creating WhatsApp Templates Collection")
        
        # Create the collection
        await _safe_create_collection(db, "whatsapp_templates")
        
        # Get collection reference
        collection = db.whatsapp_templates
        
        print("\n🔧 Adding indexes to whatsapp_templates collection")
        
        # Primary unique index on template_name
        # Prevents duplicate template entries
        await _safe_create_index(
            collection, 
            [("template_name", 1)],
            "idx_whatsapp_templates_name_unique",
            unique=True
        )
        
        # Compound index for multi-tenant template queries
        # Supports queries by template_name + organization_id
        await _safe_create_index(
            collection,
            [("template_name", 1), ("organization_id", 1)],
            "idx_whatsapp_templates_name_org"
        )
        
        # Index for template validation queries
        # Supports queries filtering by category and approval status
        await _safe_create_index(
            collection,
            [("meta_category", 1), ("approval_status", 1)],
            "idx_whatsapp_templates_category_status"
        )
        
        # Index for TTL cleanup and verification freshness queries
        # Supports queries finding stale templates that need re-verification
        await _safe_create_index(
            collection,
            [("last_verified", 1)],
            "idx_whatsapp_templates_last_verified"
        )
        
        # Index for organization-based queries (multi-tenant support)
        await _safe_create_index(
            collection,
            [("organization_id", 1)],
            "idx_whatsapp_templates_org",
            sparse=True  # Sparse because organization_id is optional
        )
        
        # Index for template ID lookups
        await _safe_create_index(
            collection,
            [("id", 1)],
            "idx_whatsapp_templates_id"
        )
        
        print("\n📊 WhatsApp Templates Collection Summary")
        indexes = await collection.list_indexes().to_list(None)
        print(f"  whatsapp_templates: {len(indexes)} indexes")
        
        # Display index details
        for idx in indexes:
            name = idx.get('name', 'unnamed')
            key = idx.get('key', {})
            unique = idx.get('unique', False)
            sparse = idx.get('sparse', False)
            flags = []
            if unique:
                flags.append('unique')
            if sparse:
                flags.append('sparse')
            flag_str = f" ({', '.join(flags)})" if flags else ""
            print(f"    - {name}: {dict(key)}{flag_str}")
        
        print("\n✅ WhatsApp Templates migration completed successfully!")
        print("\nNext steps:")
        print("  1. Update WhatsApp Cloud API to use database for template validation")
        print("  2. Implement Meta Business Manager API integration")
        print("  3. Add template synchronization job")

    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        raise
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(add_whatsapp_template_collection())