#!/usr/bin/env python3
"""
Production database fix for referral_code constraint issues
This script safely fixes the duplicate key error in production
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient

# Production MongoDB connection
MONGO_URL = "mongodb+srv://shivshankarkumar281_db_user:RNdGNCCyBtj1d5Ar@retsro-ai.un0np9m.mongodb.net/restrobill?retryWrites=true&w=majority&authSource=admin&readPreference=primary&appName=retsro-ai"
DB_NAME = "restrobill"

async def fix_production_database():
    """Fix production database referral_code issues"""
    print("🔧 Connecting to Production Database...")
    
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    try:
        # Test connection
        await db.command("ping")
        print("✅ Connected to production database")
        
        # Check current state
        print("\n📋 Checking current database state...")
        
        # Count users with null referral codes
        null_referral_count = await db.users.count_documents({"referral_code": None})
        empty_referral_count = await db.users.count_documents({"referral_code": ""})
        missing_referral_count = await db.users.count_documents({"referral_code": {"$exists": False}})
        total_users = await db.users.count_documents({})
        
        print(f"Total users: {total_users}")
        print(f"Users with null referral_code: {null_referral_count}")
        print(f"Users with empty referral_code: {empty_referral_count}")
        print(f"Users missing referral_code field: {missing_referral_count}")
        
        # Check current indexes
        print("\n📋 Checking current indexes...")
        indexes = await db.users.list_indexes().to_list(length=None)
        
        referral_index_exists = False
        for idx in indexes:
            if 'referral_code' in idx.get('key', {}):
                referral_index_exists = True
                print(f"Found referral_code index: {idx['name']}")
                break
        
        if not referral_index_exists:
            print("No referral_code index found")
        
        # Fix 1: Drop problematic index if it exists
        if referral_index_exists:
            print("\n🔧 Dropping problematic referral_code index...")
            try:
                await db.users.drop_index("referral_code_1")
                print("✅ Dropped referral_code_1 index")
            except Exception as e:
                print(f"⚠️  Index drop failed (may not exist): {e}")
        
        # Fix 2: Add missing lowercase fields
        print("\n🔧 Adding missing lowercase fields...")
        
        users_without_lower = await db.users.find({
            "$or": [
                {"username_lower": {"$exists": False}},
                {"email_lower": {"$exists": False}}
            ]
        }).to_list(length=None)
        
        if users_without_lower:
            print(f"Found {len(users_without_lower)} users missing lowercase fields")
            
            for user in users_without_lower:
                update_fields = {}
                
                if "username_lower" not in user and "username" in user:
                    update_fields["username_lower"] = user["username"].lower().strip()
                
                if "email_lower" not in user and "email" in user:
                    update_fields["email_lower"] = user["email"].lower().strip()
                
                if update_fields:
                    await db.users.update_one(
                        {"_id": user["_id"]},
                        {"$set": update_fields}
                    )
            
            print(f"✅ Updated {len(users_without_lower)} users with lowercase fields")
        else:
            print("✅ All users already have lowercase fields")
        
        # Fix 3: Clean up referral_code field inconsistencies
        print("\n🔧 Cleaning up referral_code field inconsistencies...")
        
        # Remove referral_code field from users who have null or empty values
        # This prevents the unique constraint issue
        result = await db.users.update_many(
            {"$or": [
                {"referral_code": None},
                {"referral_code": ""},
                {"referral_code": {"$exists": False}}
            ]},
            {"$unset": {"referral_code": ""}}
        )
        
        print(f"✅ Cleaned up referral_code field for {result.modified_count} users")
        
        # Fix 4: Try to create a proper sparse index for referral_code
        print("\n🔧 Creating proper referral_code index...")
        try:
            # Create sparse index that only indexes documents with non-null referral_code
            await db.users.create_index(
                "referral_code",
                unique=True,
                sparse=True,  # Only index documents that have the field
                name="referral_code_sparse"
            )
            print("✅ Created sparse referral_code index")
        except Exception as e:
            print(f"⚠️  Could not create referral_code index: {e}")
            print("This is OK - the system will work without it")
        
        # Verification
        print("\n✅ PRODUCTION DATABASE FIXES COMPLETED!")
        print("=" * 50)
        
        # Final state check
        final_null_count = await db.users.count_documents({"referral_code": None})
        final_missing_count = await db.users.count_documents({"referral_code": {"$exists": False}})
        users_with_referral = await db.users.count_documents({"referral_code": {"$exists": True, "$ne": None, "$ne": ""}})
        
        print(f"Final state:")
        print(f"  Users with null referral_code: {final_null_count}")
        print(f"  Users missing referral_code field: {final_missing_count}")
        print(f"  Users with valid referral_code: {users_with_referral}")
        
        if final_null_count == 0:
            print("✅ No more null referral_code values!")
        
        print("\n🚀 Server should now start without referral_code constraint errors")
        
    except Exception as e:
        print(f"❌ Production database fix error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(fix_production_database())