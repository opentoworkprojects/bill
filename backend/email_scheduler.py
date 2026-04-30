"""
Email Scheduler - Automated Email Workflows
Runs background tasks to send automated emails at the right time
"""

import asyncio
from datetime import datetime, timedelta, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import os
from email_automation import (
    send_welcome_email,
    send_onboarding_day1,
    send_onboarding_day3,
    send_onboarding_day5,
    send_subscription_expiring,
    send_subscription_expired,
    send_inactive_user_reminder
)

# MongoDB connection
mongo_url = os.getenv("MONGO_URL")
client = AsyncIOMotorClient(mongo_url)
db = client[os.getenv("DB_NAME", "restrobill")]


async def check_and_send_onboarding_emails():
    """Check for users who need onboarding emails"""
    now = datetime.now(timezone.utc)
    
    # Find users registered 1 day ago (Day 1 email)
    day1_start = now - timedelta(days=1, hours=1)
    day1_end = now - timedelta(days=1)
    
    users_day1 = await db.users.find({
        "created_at": {"$gte": day1_start.isoformat(), "$lt": day1_end.isoformat()},
        "onboarding_day1_sent": {"$ne": True}
    }).to_list(length=100)
    
    for user in users_day1:
        try:
            await send_onboarding_day1(user["email"], user["username"])
            await db.users.update_one(
                {"id": user["id"]},
                {"$set": {"onboarding_day1_sent": True}}
            )
            print(f"✅ Sent Day 1 onboarding to {user['email']}")
        except Exception as e:
            print(f"❌ Failed to send Day 1 email to {user['email']}: {e}")
    
    # Find users registered 3 days ago (Day 3 email)
    day3_start = now - timedelta(days=3, hours=1)
    day3_end = now - timedelta(days=3)
    
    users_day3 = await db.users.find({
        "created_at": {"$gte": day3_start.isoformat(), "$lt": day3_end.isoformat()},
        "onboarding_day3_sent": {"$ne": True}
    }).to_list(length=100)
    
    for user in users_day3:
        try:
            await send_onboarding_day3(user["email"], user["username"])
            await db.users.update_one(
                {"id": user["id"]},
                {"$set": {"onboarding_day3_sent": True}}
            )
            print(f"✅ Sent Day 3 onboarding to {user['email']}")
        except Exception as e:
            print(f"❌ Failed to send Day 3 email to {user['email']}: {e}")
    
    # Find users registered 5 days ago (Day 5 email - trial reminder)
    day5_start = now - timedelta(days=5, hours=1)
    day5_end = now - timedelta(days=5)
    
    users_day5 = await db.users.find({
        "created_at": {"$gte": day5_start.isoformat(), "$lt": day5_end.isoformat()},
        "onboarding_day5_sent": {"$ne": True},
        "subscription_active": {"$ne": True}
    }).to_list(length=100)
    
    for user in users_day5:
        try:
            trial_days_left = 2  # 7 - 5 = 2 days left
            await send_onboarding_day5(user["email"], user["username"], trial_days_left)
            await db.users.update_one(
                {"id": user["id"]},
                {"$set": {"onboarding_day5_sent": True}}
            )
            print(f"✅ Sent Day 5 trial reminder to {user['email']}")
        except Exception as e:
            print(f"❌ Failed to send Day 5 email to {user['email']}: {e}")



async def check_subscription_expiry():
    """Check for expiring and expired subscriptions"""
    now = datetime.now(timezone.utc)
    
    # Find subscriptions expiring in 3 days
    expiry_3days = now + timedelta(days=3)
    expiry_3days_end = now + timedelta(days=3, hours=1)
    
    users_expiring = await db.users.find({
        "subscription_active": True,
        "subscription_expires_at": {
            "$gte": expiry_3days.isoformat(),
            "$lt": expiry_3days_end.isoformat()
        },
        "expiry_reminder_sent": {"$ne": True}
    }).to_list(length=100)
    
    for user in users_expiring:
        try:
            await send_subscription_expiring(user["email"], user["username"], 3)
            await db.users.update_one(
                {"id": user["id"]},
                {"$set": {"expiry_reminder_sent": True}}
            )
            print(f"✅ Sent expiry reminder to {user['email']}")
        except Exception as e:
            print(f"❌ Failed to send expiry reminder to {user['email']}: {e}")
    
    # Find expired subscriptions
    expired_users = await db.users.find({
        "subscription_active": True,
        "subscription_expires_at": {"$lt": now.isoformat()},
        "expired_email_sent": {"$ne": True}
    }).to_list(length=100)
    
    for user in expired_users:
        try:
            # Deactivate subscription
            await db.users.update_one(
                {"id": user["id"]},
                {"$set": {
                    "subscription_active": False,
                    "expired_email_sent": True
                }}
            )
            await send_subscription_expired(user["email"], user["username"])
            print(f"✅ Sent expiry notification to {user['email']}")
        except Exception as e:
            print(f"❌ Failed to send expiry notification to {user['email']}: {e}")


async def check_inactive_users():
    """Re-engage users who haven't logged in for 30 days"""
    now = datetime.now(timezone.utc)
    inactive_date = now - timedelta(days=30)
    
    inactive_users = await db.users.find({
        "last_login": {"$lt": inactive_date.isoformat()},
        "inactive_reminder_sent": {"$ne": True}
    }).to_list(length=50)
    
    for user in inactive_users:
        try:
            days_inactive = (now - datetime.fromisoformat(user.get("last_login", now.isoformat()))).days
            await send_inactive_user_reminder(user["email"], user["username"], days_inactive)
            await db.users.update_one(
                {"id": user["id"]},
                {"$set": {"inactive_reminder_sent": True}}
            )
            print(f"✅ Sent inactive reminder to {user['email']}")
        except Exception as e:
            print(f"❌ Failed to send inactive reminder to {user['email']}: {e}")


async def run_email_scheduler():
    """Main scheduler loop - runs every hour"""
    print("📧 Email Scheduler Started")
    
    while True:
        try:
            print(f"\n{'='*60}")
            print(f"🔄 Running Email Automation - {datetime.now()}")
            print(f"{'='*60}\n")
            
            # Run all checks
            await check_and_send_onboarding_emails()
            await check_subscription_expiry()
            await check_inactive_users()
            
            print(f"\n✅ Email automation cycle complete")
            print(f"⏰ Next run in 1 hour\n")
            
        except Exception as e:
            print(f"❌ Error in email scheduler: {e}")
        
        # Wait 1 hour before next run
        await asyncio.sleep(3600)


if __name__ == "__main__":
    # Run scheduler
    asyncio.run(run_email_scheduler())
