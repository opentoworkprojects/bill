#!/usr/bin/env python3
"""
Test Daily Reports - Check if today's bills are showing
"""

import sys
import os
sys.path.append('backend')

import asyncio
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

async def test_daily_reports():
    """Test if daily reports show today's orders correctly"""
    
    # Load environment
    load_dotenv(os.path.join('backend', '.env'))
    
    # Connect to MongoDB
    mongo_url = os.getenv("MONGO_URL")
    if not mongo_url:
        print("❌ MONGO_URL not found in .env")
        return False
    
    try:
        client = AsyncIOMotorClient(mongo_url)
        db = client[os.getenv("DB_NAME", "restrobill")]
        
        print("🔧 Testing Daily Reports")
        print("=" * 50)
        
        # Test IST timezone calculation (same as in server.py)
        IST = timezone(timedelta(hours=5, minutes=30))
        now_ist = datetime.now(IST)
        today_ist = now_ist.replace(hour=0, minute=0, second=0, microsecond=0)
        today_utc = today_ist.astimezone(timezone.utc)
        
        print(f"📅 Current IST time: {now_ist.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"📅 Today IST start: {today_ist.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"📅 Today UTC start: {today_utc.strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Count all orders from today
        all_today_orders = await db.orders.count_documents({
            "created_at": {"$gte": today_utc.isoformat()}
        })
        
        # Count completed orders from today (old logic)
        completed_today_orders = await db.orders.count_documents({
            "status": "completed",
            "created_at": {"$gte": today_utc.isoformat()}
        })
        
        # Count paid orders from today (new logic)
        paid_today_orders = await db.orders.count_documents({
            "$or": [
                {"status": "completed"},
                {"status": "paid"},
                {"payment_received": {"$gt": 0}},
                {"is_credit": False, "total": {"$gt": 0}}
            ],
            "created_at": {"$gte": today_utc.isoformat()}
        })
        
        print(f"\n📊 Today's Orders Summary:")
        print(f"   Total orders created today: {all_today_orders}")
        print(f"   Completed orders (old logic): {completed_today_orders}")
        print(f"   Paid orders (new logic): {paid_today_orders}")
        
        # Get sample orders to see their status
        sample_orders = await db.orders.find({
            "created_at": {"$gte": today_utc.isoformat()}
        }, {
            "_id": 0, 
            "id": 1, 
            "status": 1, 
            "payment_received": 1, 
            "total": 1, 
            "is_credit": 1,
            "created_at": 1
        }).limit(5).to_list(5)
        
        if sample_orders:
            print(f"\n📋 Sample Today's Orders:")
            for order in sample_orders:
                print(f"   Order {order.get('id', 'N/A')[:8]}: "
                      f"status={order.get('status', 'N/A')}, "
                      f"paid={order.get('payment_received', 0)}, "
                      f"total={order.get('total', 0)}, "
                      f"credit={order.get('is_credit', False)}")
        else:
            print(f"\n📋 No orders found for today")
        
        # Test if the issue is with the query
        if all_today_orders > 0 and paid_today_orders == 0:
            print(f"\n⚠️  Issue found: Orders exist but none match the paid criteria")
            print(f"   This means orders are not being marked as paid properly")
            return False
        elif all_today_orders == 0:
            print(f"\n💡 No orders created today - this is normal if no business activity")
            return True
        else:
            print(f"\n✅ Daily reports should show {paid_today_orders} orders")
            return True
            
    except Exception as e:
        print(f"❌ Error testing daily reports: {e}")
        return False
    finally:
        try:
            client.close()
        except:
            pass

def main():
    """Run the test"""
    success = asyncio.run(test_daily_reports())
    
    if success:
        print(f"\n🎉 Daily reports logic is working correctly!")
    else:
        print(f"\n⚠️ Daily reports need attention")
        print(f"\nPossible issues:")
        print(f"1. Orders are not being marked with proper payment status")
        print(f"2. Frontend might be caching old data")
        print(f"3. Timezone calculation might be off")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)