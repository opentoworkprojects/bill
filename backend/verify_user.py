"""
Verify BillbyteKOT user details
"""
import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def verify_user():
    # Connect to MongoDB
    mongo_url = os.getenv("MONGO_URL")
    client = AsyncIOMotorClient(mongo_url, tls=True, tlsInsecure=True)
    db = client[os.getenv("DB_NAME", "restrobill")]
    
    print("=" * 80)
    print("VERIFYING BILLBYTEKOT USER")
    print("=" * 80)
    
    # Find user by username (case-insensitive)
    user = await db.users.find_one({"username": {"$regex": "^billbytekot$", "$options": "i"}})
    
    if not user:
        print("\n❌ User 'BillbyteKOT' not found!")
        print("\nSearching for similar usernames...")
        users = await db.users.find({}).to_list(100)
        for u in users:
            if "bill" in u.get("username", "").lower():
                print(f"  - {u.get('username')} ({u.get('email')})")
        client.close()
        return
    
    print(f"\n✅ User found!")
    print(f"   Username: {user.get('username')}")
    print(f"   Email: {user.get('email')}")
    print(f"   User ID: {user.get('id')}")
    print(f"   Organization ID: {user.get('organization_id', 'SAME AS USER ID')}")
    print(f"   Role: {user.get('role')}")
    
    # The organization_id for orders should match user's id
    org_id = user.get('id')
    
    print(f"\n🔍 Checking orders for organization: {org_id}")
    
    # Find orders with balance for this organization
    orders_with_balance = await db.orders.find({
        "organization_id": org_id,
        "balance_amount": {"$gt": 0}
    }).to_list(100)
    
    print(f"\n💰 Orders with balance: {len(orders_with_balance)}")
    
    if orders_with_balance:
        print("\n📋 Sample orders:")
        for i, order in enumerate(orders_with_balance[:5], 1):
            print(f"\n{i}. Order {order.get('id', 'N/A')[:8]}...")
            print(f"   Customer: {order.get('customer_name', 'Unknown')} | Phone: {order.get('customer_phone', 'No phone')}")
            print(f"   Total: ₹{order.get('total', 0):.2f}")
            print(f"   Paid: ₹{order.get('payment_received', 0):.2f}")
            print(f"   Balance: ₹{order.get('balance_amount', 0):.2f}")
            print(f"   Status: {order.get('status')}")
            print(f"   Is Credit: {order.get('is_credit')}")
    else:
        print("\n⚠️  NO ORDERS WITH BALANCE FOUND FOR THIS USER!")
        
        # Check if there are ANY orders for this user
        all_orders = await db.orders.find({"organization_id": org_id}).to_list(10)
        print(f"\n📊 Total orders for this user: {len(all_orders)}")
        
        if all_orders:
            print("\nSample orders (checking balance_amount field):")
            for order in all_orders[:3]:
                print(f"  - Order {order.get('id', 'N/A')[:8]}... | Balance: {order.get('balance_amount', 'MISSING')} | Is Credit: {order.get('is_credit', 'MISSING')}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(verify_user())
