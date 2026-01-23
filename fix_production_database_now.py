#!/usr/bin/env python3
"""
FIX PRODUCTION DATABASE IMMEDIATELY
Apply the same referral_code fixes to production database
"""

import asyncio
import os
import time
import random
import string
from motor.motor_asyncio import AsyncIOMotorClient

def generate_unique_code(user_id, index):
    """Generate a unique referral code for a user"""
    timestamp = str(int(time.time()))[-4:]
    random_chars = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"{timestamp}{random_chars}"

async def fix_production_database():
    """Fix production database referral_code issues"""
    
    print("🚨 FIXING PRODUCTION DATABASE")
    print("=" * 50)
    
    # Production MongoDB URL (same as in server.py)
    mongo_url = "mongodb+srv://shivshankarkumar281_db_user:RNdGNCCyBtj1d5Ar@retsro-ai.un0np9m.mongodb.net/?retryWrites=true&w=majority&authSource=admin&readPreference=primary&serverSelectionTimeoutMS=10000&connectTimeoutMS=15000&socketTimeoutMS=20000&appName=retsro-ai"
    
    client = AsyncIOMotorClient(mongo_url)
    db = client["restrobill"]
    
    try:
        print("1. Connected to production database")
        
        # Check current state
        total_users = await db.users.count_documents({})
        null_users = await db.users.find({
            "$or": [
                {"referral_code": None},
                {"referral_code": ""},
                {"referral_code": {"$exists": False}}
            ]
        }).to_list(length=None)
        
        print(f"   Total users: {total_users}")
        print(f"   Users needing referral codes: {len(null_users)}")
        
        if len(null_users) == 0:
            print("   ✅ All users already have referral codes!")
            return True
        
        print("\n2. Dropping problematic indexes...")
        
        # List and drop referral_code indexes
        indexes = await db.users.list_indexes().to_list(length=None)
        for index in indexes:
            index_name = index.get('name', '')
            index_key = index.get('key', {})
            
            if 'referral_code' in str(index_key):
                try:
                    await db.users.drop_index(index_name)
                    print(f"   ✅ Dropped: {index_name}")
                except Exception as e:
                    print(f"   ⚠️ Could not drop {index_name}: {e}")
        
        print("\n3. Updating users with unique referral codes...")
        
        updated_count = 0
        for i, user in enumerate(null_users):
            try:
                unique_code = generate_unique_code(user.get("id", "unknown"), i)
                
                result = await db.users.update_one(
                    {"_id": user["_id"]},
                    {"$set": {"referral_code": unique_code}}
                )
                
                if result.modified_count > 0:
                    username = user.get("username", "unknown")
                    print(f"   ✅ Updated {username}: {unique_code}")
                    updated_count += 1
                    
            except Exception as e:
                print(f"   ❌ Failed to update {user.get('username', 'unknown')}: {e}")
        
        print(f"\n4. Creating proper sparse index...")
        try:
            await db.users.create_index("referral_code", unique=True, sparse=True)
            print("   ✅ Created sparse unique index")
        except Exception as e:
            print(f"   ❌ Failed to create index: {e}")
        
        print(f"\n5. Verification...")
        
        remaining_null = await db.users.count_documents({
            "$or": [
                {"referral_code": None},
                {"referral_code": ""},
                {"referral_code": {"$exists": False}}
            ]
        })
        
        users_with_codes = await db.users.count_documents({
            "referral_code": {"$exists": True, "$ne": None, "$ne": ""}
        })
        
        print(f"   Total users: {total_users}")
        print(f"   Users with referral codes: {users_with_codes}")
        print(f"   Users still needing codes: {remaining_null}")
        
        if remaining_null == 0:
            print("   ✅ PRODUCTION DATABASE FIXED!")
            return True
        else:
            print(f"   ❌ {remaining_null} users still need codes")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    finally:
        client.close()

async def test_production_after_fix():
    """Test production signup after database fix"""
    
    print("\n6. Testing production signup after fix...")
    
    import requests
    
    timestamp = int(time.time())
    test_email = f"afterfix{timestamp}@example.com"
    test_username = f"afterfix{timestamp}"
    
    try:
        # Request OTP
        response = requests.post("https://restro-ai.onrender.com/api/auth/register-request", 
            json={
                "email": test_email,
                "username": test_username,
                "password": "test123",
                "role": "admin"
            },
            timeout=15
        )
        
        if response.status_code == 200:
            data = response.json()
            otp = data.get('otp')
            
            if otp:
                print(f"   ✅ OTP received: {otp}")
                
                # Verify OTP
                verify_response = requests.post("https://restro-ai.onrender.com/api/auth/verify-registration",
                    json={
                        "email": test_email,
                        "otp": otp
                    },
                    timeout=15
                )
                
                if verify_response.status_code == 200:
                    user_data = verify_response.json()
                    print(f"   ✅ PRODUCTION SIGNUP SUCCESS!")
                    print(f"   User: {user_data.get('username')}")
                    return True
                else:
                    print(f"   ❌ Verification failed: {verify_response.text}")
                    return False
            else:
                print(f"   ❌ No OTP in response")
                return False
        else:
            print(f"   ❌ Request failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ Test error: {e}")
        return False

async def main():
    """Main execution"""
    
    print("🌐 PRODUCTION DATABASE FIX")
    print("=" * 60)
    
    # Fix database
    db_fixed = await fix_production_database()
    
    if db_fixed:
        # Test signup
        signup_works = await test_production_after_fix()
        
        if signup_works:
            print("\n🎉 PRODUCTION FULLY FIXED!")
            print("✅ Database updated successfully")
            print("✅ Signup working on production")
            print("✅ Ready for users!")
            return True
        else:
            print("\n⚠️ Database fixed but signup still has issues")
            return False
    else:
        print("\n❌ Could not fix production database")
        return False

if __name__ == "__main__":
    success = asyncio.run(main())
    
    if success:
        print("\n🎯 PRODUCTION DEPLOYMENT COMPLETE!")
        print("   Users can now register on production!")
    else:
        print("\n❌ Production deployment needs more work")