#!/usr/bin/env python3
"""
Check the specific orders that are showing as active but were actually paid
"""

import asyncio
import os
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def check_paid_orders():
    """Check the specific orders that should be paid but showing as active"""
    
    # User details from the logs
    user_email = "yashrajkuradiya9@gmail.com"
    org_id = "b1b4ef04-8ab4-4a8b-b043-a3fd828b4941"
    
    # Specific order IDs from the test results
    problem_order_ids = [
        "366bbec5-0d78-447b-bd9a-8d68ea28a004",  # Yesterday - ready
        "e9d34649-a15a-4e13-b695-b5232912bdf1",  # Yesterday - ready
        "f0eb8318-9e2d-49bd-8a7c-ede1f0cde248",  # Today - ready
        "8cbcce1f-1872-4a93-a04a-bc1721581a4c",  # Today - ready
        "4e6d251b-cf45-42b2-9631-b5cc27766456",  # Today - ready
    ]
    
    print(f"🔍 Checking paid orders issue for user: {user_email}")
    print(f"🏢 Organization ID: {org_id}")
    print(f"📋 Checking {len(problem_order_ids)} specific orders")
    
    try:
        # Connect to MongoDB
        mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
        db_name = os.getenv("DB_NAME", "restrobill")
        
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        
        # Test connection
        await db.command("ping")
        print("✅ Connected to MongoDB")
        
        print(f"\n🔍 DETAILED ORDER ANALYSIS:")
        
        for order_id in problem_order_ids:
            print(f"\n📋 Order ID: {order_id}")
            
            # Get full order details
            order = await db.orders.find_one(
                {"id": order_id, "organization_id": org_id},
                {"_id": 0}
            )
            
            if not order:
                print(f"   ❌ Order not found!")
                continue
            
            # Extract key fields
            status = order.get("status", "unknown")
            created_at = order.get("created_at")
            updated_at = order.get("updated_at")
            total = order.get("total", 0)
            payment_received = order.get("payment_received", 0)
            balance_amount = order.get("balance_amount", 0)
            payment_method = order.get("payment_method", "unknown")
            is_credit = order.get("is_credit", False)
            
            print(f"   📊 Status: {status}")
            print(f"   📅 Created: {created_at}")
            print(f"   📅 Updated: {updated_at}")
            print(f"   💰 Total: ₹{total}")
            print(f"   💳 Payment Received: ₹{payment_received}")
            print(f"   💸 Balance Amount: ₹{balance_amount}")
            print(f"   💳 Payment Method: {payment_method}")
            print(f"   🏦 Is Credit: {is_credit}")
            
            # Check if order is actually paid
            is_fully_paid = (payment_received >= total) and (balance_amount <= 0)
            should_be_completed = is_fully_paid and not is_credit
            
            print(f"   🔍 Analysis:")
            print(f"      - Fully Paid: {is_fully_paid}")
            print(f"      - Should be Completed: {should_be_completed}")
            
            if should_be_completed and status not in ["completed", "paid"]:
                print(f"   ⚠️  ISSUE FOUND: Order is fully paid but status is '{status}' instead of 'completed'!")
                print(f"      - This order should NOT appear in active orders")
                print(f"      - Status should be updated to 'completed' or 'paid'")
            elif status in ["completed", "paid"]:
                print(f"   ❓ MYSTERY: Order status is '{status}' but still showing in active orders")
                print(f"      - This suggests a caching or query issue")
            else:
                print(f"   ✅ Order status is correct for its payment state")
        
        # Check for any other orders with payment inconsistencies
        print(f"\n🔍 CHECKING FOR OTHER PAYMENT INCONSISTENCIES:")
        
        # Find orders that are fully paid but not marked as completed
        inconsistent_orders = await db.orders.find({
            "organization_id": org_id,
            "status": {"$nin": ["completed", "paid", "cancelled"]},
            "$expr": {
                "$and": [
                    {"$gte": ["$payment_received", "$total"]},
                    {"$lte": ["$balance_amount", 0]},
                    {"$ne": ["$is_credit", True]}
                ]
            }
        }, {"_id": 0, "id": 1, "status": 1, "total": 1, "payment_received": 1, "balance_amount": 1, "created_at": 1}).to_list(20)
        
        if inconsistent_orders:
            print(f"   ⚠️  Found {len(inconsistent_orders)} orders with payment inconsistencies:")
            for order in inconsistent_orders:
                print(f"      - Order {order.get('id')}: {order.get('status')} (Paid: ₹{order.get('payment_received')}/₹{order.get('total')})")
        else:
            print(f"   ✅ No other payment inconsistencies found")
        
        # Suggest fixes
        print(f"\n🔧 SUGGESTED FIXES:")
        
        paid_but_not_completed = []
        for order_id in problem_order_ids:
            order = await db.orders.find_one(
                {"id": order_id, "organization_id": org_id},
                {"_id": 0, "id": 1, "status": 1, "total": 1, "payment_received": 1, "balance_amount": 1}
            )
            
            if order:
                is_fully_paid = (order.get("payment_received", 0) >= order.get("total", 0)) and (order.get("balance_amount", 0) <= 0)
                if is_fully_paid and order.get("status") not in ["completed", "paid"]:
                    paid_but_not_completed.append(order_id)
        
        if paid_but_not_completed:
            print(f"   1. Update status to 'completed' for {len(paid_but_not_completed)} fully paid orders:")
            for order_id in paid_but_not_completed:
                print(f"      - {order_id}")
            
            print(f"   💡 SQL-like update command:")
            print(f"      UPDATE orders SET status='completed', updated_at=NOW()")
            order_ids_str = "', '".join(paid_but_not_completed)
            print(f"      WHERE id IN ('{order_ids_str}')")
            print(f"      AND organization_id='{org_id}'")
        
        print(f"   2. Clear all caches after status updates")
        print(f"   3. Verify orders move from active to completed list")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ Check failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Checking paid orders issue...")
    success = asyncio.run(check_paid_orders())
    
    if success:
        print("\n✅ Check completed successfully!")
    else:
        print("\n❌ Check failed!")