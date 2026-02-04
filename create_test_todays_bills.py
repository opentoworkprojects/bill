"""
Create test orders for today to populate Today's Bills
This will create completed orders for your organization
"""
import os
import asyncio
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import uuid

load_dotenv('backend/.env')

async def create_test_bills():
    # Connect to MongoDB
    mongo_url = os.getenv("MONGO_URL")
    db_name = os.getenv("DB_NAME", "restrobill")
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("=" * 80)
    print("🔧 Creating Test Today's Bills")
    print("=" * 80)
    
    # Get user email to find organization
    user_email = input("\n📧 Enter your email (e.g., billbytekot@gmail.com): ").strip()
    
    # Find user
    user = await db.users.find_one({"email": user_email}, {"_id": 0})
    
    if not user:
        print(f"\n❌ User not found with email: {user_email}")
        client.close()
        return
    
    org_id = user.get("organization_id")
    if not org_id:
        print(f"\n❌ User has no organization_id")
        client.close()
        return
    
    print(f"\n✅ Found user: {user.get('username')}")
    print(f"🏢 Organization ID: {org_id}")
    
    # Ask how many test bills to create
    num_bills = input("\n📊 How many test bills to create? (default: 5): ").strip()
    num_bills = int(num_bills) if num_bills else 5
    
    # Calculate today in IST
    IST = timezone(timedelta(hours=5, minutes=30))
    now_ist = datetime.now(IST)
    
    print(f"\n🕐 Current time (IST): {now_ist}")
    print(f"\n🚀 Creating {num_bills} test bills...")
    
    created_orders = []
    
    for i in range(num_bills):
        # Create order with random time today
        hours_ago = i * 2  # Spread orders throughout the day
        order_time = now_ist - timedelta(hours=hours_ago)
        order_time_utc = order_time.astimezone(timezone.utc)
        
        # Random order details
        table_number = (i % 10) + 1
        total = round(100 + (i * 50) + (i * 10.5), 2)
        
        order = {
            "id": str(uuid.uuid4()),
            "organization_id": org_id,
            "table_id": f"table_{table_number}",
            "table_number": table_number,
            "items": [
                {
                    "menu_item_id": str(uuid.uuid4()),
                    "name": f"Test Item {i+1}",
                    "quantity": i + 1,
                    "price": round(total / (i + 1), 2),
                    "notes": None
                }
            ],
            "subtotal": round(total / 1.05, 2),
            "tax": round(total * 0.05, 2),
            "tax_rate": 5.0,
            "discount": 0,
            "total": total,
            "status": "completed",  # COMPLETED status for Today's Bills
            "waiter_id": user.get("id"),
            "waiter_name": user.get("username", "Test Waiter"),
            "customer_name": f"Test Customer {i+1}",
            "customer_phone": None,
            "tracking_token": None,
            "order_type": "dine_in",
            "payment_method": "cash",
            "is_credit": False,
            "payment_received": total,
            "balance_amount": 0,
            "cash_amount": total,
            "card_amount": 0,
            "upi_amount": 0,
            "credit_amount": 0,
            "created_at": order_time_utc.isoformat(),  # ISO string format
            "updated_at": order_time_utc.isoformat()
        }
        
        # Insert order
        await db.orders.insert_one(order)
        created_orders.append(order)
        
        print(f"  ✅ Created order {i+1}/{num_bills}: ₹{total} at {order_time.strftime('%H:%M:%S')} IST")
    
    print(f"\n{'=' * 80}")
    print(f"✅ Successfully created {len(created_orders)} test bills!")
    print(f"{'=' * 80}")
    
    print(f"\n📊 Summary:")
    print(f"  • Organization: {org_id}")
    print(f"  • Total bills created: {len(created_orders)}")
    print(f"  • Total amount: ₹{sum(o['total'] for o in created_orders):.2f}")
    print(f"  • Date: {now_ist.strftime('%Y-%m-%d')}")
    
    print(f"\n🎯 Next Steps:")
    print(f"  1. Open your app at http://localhost:3000")
    print(f"  2. Login with: {user_email}")
    print(f"  3. Go to Orders page")
    print(f"  4. Click 'Today's Bills' tab")
    print(f"  5. You should see {len(created_orders)} bills!")
    
    print(f"\n💡 Tip: Refresh the page if bills don't appear immediately")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_test_bills())
