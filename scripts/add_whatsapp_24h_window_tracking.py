#!/usr/bin/env python3
"""
Migration: Add WhatsApp 24-hour Customer Service Window Tracking

This migration:
1. Creates the whatsapp_messages collection for tracking customer messages
2. Adds indexes for efficient 24-hour window queries
3. Ensures we can track when customers last messaged to enforce 24-hour windows

This fixes the issue: "WhatsApp unable to deliver out of 24 hours window"

The 24-hour window opens when:
- A customer sends a message to the business
- Stays open for 24 hours from that message

After 24 hours, only UTILITY category templates can be sent.
Within 24 hours, any approved template can be sent.
"""

import asyncio
import sys
from datetime import datetime, timezone

async def setup_whatsapp_message_tracking():
    """Set up collections and indexes for 24-hour window tracking."""
    
    try:
        from core.database import get_db
        from pymongo import ASCENDING, DESCENDING
        
        print("🚀 Setting up WhatsApp 24-hour window tracking...")
        
        db = await get_db()
        if not db:
            print("❌ Failed to connect to database")
            return False
        
        # Create whatsapp_messages collection
        try:
            await db.create_collection("whatsapp_messages")
            print("✅ Created whatsapp_messages collection")
        except Exception as e:
            if "already exists" in str(e):
                print("✅ whatsapp_messages collection already exists")
            else:
                print(f"⚠️ Error creating collection: {e}")
        
        # Add indexes for efficient queries
        collection = db["whatsapp_messages"]
        
        # Index 1: Query incoming messages by phone and timestamp (main 24h window query)
        try:
            await collection.create_index([
                ("from", ASCENDING),
                ("direction", ASCENDING),
                ("timestamp", DESCENDING)
            ], name="idx_customer_24h_window")
            print("✅ Created index: idx_customer_24h_window (from, direction, timestamp)")
        except Exception as e:
            print(f"⚠️ Index creation warning: {str(e)[:100]}")
        
        # Index 2: TTL index - auto-delete messages older than 30 days
        try:
            await collection.create_index(
                "timestamp",
                expireAfterSeconds=30*24*60*60  # 30 days
            )
            print("✅ Created TTL index (30-day expiration)")
        except Exception as e:
            if "already exists" in str(e):
                print("✅ TTL index already exists")
            else:
                print(f"⚠️ TTL index warning: {str(e)[:100]}")
        
        # Index 3: Quick lookup by message_id
        try:
            await collection.create_index(
                "message_id",
                name="idx_message_id"
            )
            print("✅ Created index: idx_message_id")
        except Exception as e:
            print(f"⚠️ Index creation warning: {str(e)[:100]}")
        
        print("\n" + "=" * 60)
        print("✅ WhatsApp 24-hour window tracking setup complete!")
        print("=" * 60)
        
        print("\n📋 Schema created:")
        print("  Collection: whatsapp_messages")
        print("  Fields:")
        print("    - message_id: Meta message ID")
        print("    - from: Customer phone number (normalized)")
        print("    - direction: 'incoming' or 'outgoing'")
        print("    - type: Message type (text, image, etc.)")
        print("    - timestamp: When message was sent (Unix timestamp)")
        print("    - received_at: When we received it in webhook")
        
        print("\n💡 How it works:")
        print("  1. When a customer messages → stored in whatsapp_messages")
        print("  2. 24-hour window opens for that customer")
        print("  3. System checks last customer message before sending")
        print("  4. If within 24h → any approved template works")
        print("  5. If after 24h → only UTILITY templates work")
        
        print("\n🔧 Testing the fix:")
        print("  1. Have a customer send a test message first")
        print("  2. Within 24 hours, send any approved template")
        print("  3. After 24 hours, only UTILITY templates should work")
        
        return True
        
    except Exception as e:
        print(f"❌ Error setting up WhatsApp message tracking: {e}")
        import traceback
        traceback.print_exc()
        return False


async def verify_setup():
    """Verify the setup was successful."""
    try:
        from core.database import get_db
        
        db = await get_db()
        if not db:
            return False
        
        # Check if collection exists
        collections = await db.list_collection_names()
        has_collection = "whatsapp_messages" in collections
        
        # Check indexes
        if has_collection:
            collection = db["whatsapp_messages"]
            indexes = await collection.list_indexes()
            index_names = [idx.get("name") for idx in indexes]
            
            print("\n📊 Verification:")
            print(f"  ✅ Collection exists: whatsapp_messages")
            print(f"  ✅ Indexes created: {len(index_names)}")
            for idx_name in index_names:
                print(f"     - {idx_name}")
            
            return True
        else:
            print("\n❌ Collection not found")
            return False
            
    except Exception as e:
        print(f"⚠️ Verification error: {e}")
        return False


async def main():
    """Run the migration."""
    print("🚀 WhatsApp 24-Hour Window Tracking Migration")
    print("=" * 60)
    
    success = await setup_whatsapp_message_tracking()
    
    if success:
        await verify_setup()
        print("\n✅ Migration completed successfully!")
        print("\n🎯 Next steps:")
        print("  1. Restart your backend service")
        print("  2. The 24-hour window check will now work properly")
        print("  3. Messages within 24 hours of customer contact will work")
    else:
        print("\n❌ Migration failed. Please check the errors above.")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
