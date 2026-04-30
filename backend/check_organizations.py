"""
Check which organizations have credit orders
"""
import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from collections import defaultdict

# Load environment variables
load_dotenv()

async def check_organizations():
    # Connect to MongoDB
    mongo_url = os.getenv("MONGO_URL")
    client = AsyncIOMotorClient(mongo_url, tls=True, tlsInsecure=True)
    db = client[os.getenv("DB_NAME", "restrobill")]
    
    print("=" * 80)
    print("CHECKING ORGANIZATIONS WITH CREDIT ORDERS")
    print("=" * 80)
    
    # Get all orders with balance
    orders_with_balance = await db.orders.find({
        "balance_amount": {"$gt": 0}
    }).to_list(1000)
    
    print(f"\n💰 Total orders with balance: {len(orders_with_balance)}")
    
    # Group by organization
    org_balances = defaultdict(lambda: {"count": 0, "total_balance": 0, "orders": []})
    
    for order in orders_with_balance:
        org_id = order.get("organization_id", "NO_ORG")
        org_balances[org_id]["count"] += 1
        org_balances[org_id]["total_balance"] += order.get("balance_amount", 0)
        org_balances[org_id]["orders"].append({
            "id": order.get("id", "N/A")[:8],
            "customer": order.get("customer_name", "Unknown"),
            "phone": order.get("customer_phone", "No phone"),
            "balance": order.get("balance_amount", 0)
        })
    
    print(f"\n🏢 Organizations with credit orders: {len(org_balances)}")
    
    print("\n" + "=" * 80)
    print("ORGANIZATIONS:")
    print("=" * 80)
    
    for org_id, data in sorted(org_balances.items(), key=lambda x: x[1]["total_balance"], reverse=True):
        print(f"\n📍 Organization: {org_id}")
        print(f"   Orders with balance: {data['count']}")
        print(f"   Total outstanding: ₹{data['total_balance']:.2f}")
        print(f"   Sample orders:")
        for order in data["orders"][:3]:
            print(f"     - {order['id']}... | {order['customer']} | ₹{order['balance']:.2f}")
    
    # Check users table to see which user owns these organizations
    print("\n" + "=" * 80)
    print("CHECKING USERS:")
    print("=" * 80)
    
    for org_id in org_balances.keys():
        if org_id == "NO_ORG":
            print(f"\n⚠️  Orders without organization_id found!")
            continue
            
        # Find user with this org_id
        user = await db.users.find_one({"id": org_id})
        if user:
            print(f"\n👤 User: {user.get('username', 'N/A')} ({user.get('email', 'N/A')})")
            print(f"   Organization ID: {org_id}")
            print(f"   Role: {user.get('role', 'N/A')}")
            print(f"   Credit orders: {org_balances[org_id]['count']}")
            print(f"   Total balance: ₹{org_balances[org_id]['total_balance']:.2f}")
        else:
            print(f"\n⚠️  No user found for organization: {org_id}")
    
    print("\n" + "=" * 80)
    print("SOLUTION:")
    print("=" * 80)
    print("The credit orders exist but belong to a different user/organization.")
    print("You need to login as the user who created those credit orders to see them.")
    print("\nOR create new credit orders with your current logged-in user.")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_organizations())
