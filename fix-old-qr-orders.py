#!/usr/bin/env python3
"""
Fix old QR orders that were incorrectly auto-completed
"""

import asyncio
import motor.motor_asyncio
from datetime import datetime, timezone

# MongoDB connection
MONGO_URL = "mongodb+srv://shivshankarkumar281_db_user:RNdGNCCyBtj1d5Ar@retsro-ai.un0np9m.mongodb.net/restrobill?retryWrites=true&w=majority&authSource=admin&readPreference=primary&appName=retsro-ai"

async def fix_old_qr_orders():
    """Fix old QR orders that were incorrectly auto-completed"""
    
    print("🔧 Fixing Old QR Orders")
    print("=" * 40)
    
    # Connect to MongoDB
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
    db = client.restrobill
    
    try:
        # Find QR orders that are completed but shouldn't be
        # These are orders with waiter_name="Self-Order" and status="completed"
        # but were likely auto-completed by the old logic
        
        print("🔍 Finding incorrectly completed QR orders...")
        
        qr_orders = await db.orders.find({
            "waiter_name": "Self-Order",
            "status": "completed"
        }, {"_id": 0}).to_list(100)
        
        print(f"📱 Found {len(qr_orders)} completed QR orders")
        
        if len(qr_orders) == 0:
            print("✅ No QR orders need fixing!")
            return True
            
        # Analyze each order to determine if it should be reverted
        orders_to_fix = []
        
        for order in qr_orders:
            order_id = order.get('id', 'Unknown')[:12]
            customer = order.get('customer_name', 'Unknown')
            total = order.get('total', 0)
            payment_received = order.get('payment_received', 0)
            is_credit = order.get('is_credit', False)
            created_at = order.get('created_at', '')
            
            print(f"\n🔸 Order {order_id}... ({customer})")
            print(f"   Total: {total}, Received: {payment_received}, Credit: {is_credit}")
            print(f"   Created: {created_at}")
            
            # Determine if this order should be reverted to pending
            should_revert = False
            reason = ""
            
            # Case 1: QR orders should generally stay pending until kitchen marks complete
            # Unless they were explicitly completed by staff through proper workflow
            
            # For now, let's be conservative and only revert orders that clearly
            # were auto-completed (payment_received = 0 or payment_received < total)
            if payment_received == 0:
                should_revert = True
                reason = "No payment received - likely auto-completed"
            elif payment_received < total and not is_credit:
                should_revert = True
                reason = "Partial payment but not marked as credit - likely auto-completed"
            elif payment_received >= total and not is_credit:
                # This could be legitimate - customer paid and staff completed
                # But for QR orders, they should stay pending until kitchen completes
                # Let's ask the user
                print(f"   ⚠️ This order has full payment - might be legitimately completed")
                print(f"   💭 However, QR orders should stay pending until kitchen marks complete")
                should_revert = True
                reason = "QR orders should stay pending until kitchen completion"
            
            if should_revert:
                print(f"   🔄 WILL REVERT: {reason}")
                orders_to_fix.append({
                    'id': order.get('id'),
                    'customer': customer,
                    'reason': reason
                })
            else:
                print(f"   ✅ KEEP AS IS: Appears legitimately completed")
        
        if len(orders_to_fix) == 0:
            print(f"\n✅ No orders need to be reverted!")
            return True
            
        print(f"\n📋 Summary: {len(orders_to_fix)} orders will be reverted to pending")
        
        # Ask for confirmation
        print(f"\n⚠️ This will change the status of {len(orders_to_fix)} QR orders from 'completed' to 'pending'")
        print(f"   These orders will then appear in Active Orders instead of Today's Bills")
        
        confirm = input("   Continue? (y/N): ").strip().lower()
        if confirm != 'y':
            print("❌ Operation cancelled")
            return False
            
        # Fix the orders
        print(f"\n🔧 Reverting {len(orders_to_fix)} orders to pending...")
        
        fixed_count = 0
        for order_info in orders_to_fix:
            order_id = order_info['id']
            customer = order_info['customer']
            
            try:
                result = await db.orders.update_one(
                    {"id": order_id},
                    {
                        "$set": {
                            "status": "pending",
                            "updated_at": datetime.now(timezone.utc).isoformat()
                        }
                    }
                )
                
                if result.modified_count > 0:
                    print(f"   ✅ Fixed: {customer} ({order_id[:8]}...)")
                    fixed_count += 1
                else:
                    print(f"   ❌ Failed: {customer} ({order_id[:8]}...)")
                    
            except Exception as e:
                print(f"   ❌ Error fixing {customer}: {e}")
        
        print(f"\n🎉 Successfully fixed {fixed_count} out of {len(orders_to_fix)} orders")
        
        if fixed_count > 0:
            print(f"\n📊 Result:")
            print(f"   • {fixed_count} QR orders are now 'pending' (will show in Active Orders)")
            print(f"   • These orders can now be properly processed by kitchen staff")
            print(f"   • Kitchen can mark them as 'completed' when food is ready")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
        
    finally:
        client.close()

if __name__ == "__main__":
    print("🚀 QR Order Fix Tool")
    print("This tool will revert incorrectly auto-completed QR orders back to pending status")
    print()
    
    success = asyncio.run(fix_old_qr_orders())
    
    if success:
        print("\n✅ Fix completed successfully!")
        print("\n💡 Going forward:")
        print("   • New QR orders will stay 'pending' until kitchen marks complete")
        print("   • The BillingPage fix prevents auto-completion of QR orders")
        print("   • Kitchen staff should use Active Orders to manage QR orders")
    else:
        print("\n❌ Fix failed or was cancelled")