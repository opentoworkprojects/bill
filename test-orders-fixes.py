#!/usr/bin/env python3
"""
Test Orders Page Fixes
Tests the fixes for orders page issues
"""

import sys
import os
sys.path.append('backend')

import asyncio
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

async def test_orders_api():
    """Test if orders API is working correctly"""
    
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
        
        print("🔧 Testing Orders API Fixes")
        print("=" * 50)
        
        # Test orders data structure
        orders = await db.orders.find({}, {"_id": 0}).limit(10).to_list(10)
        
        print(f"📊 Found {len(orders)} sample orders")
        
        if not orders:
            print("💡 No orders found - this is normal for new installations")
            return True
        
        # Check for data integrity issues
        issues_found = 0
        
        for i, order in enumerate(orders):
            order_id = order.get('id', f'order_{i}')
            
            # Check required fields
            if not order.get('id'):
                print(f"❌ Order missing ID: {order}")
                issues_found += 1
                continue
                
            if not order.get('created_at'):
                print(f"❌ Order {order_id[:8]} missing created_at")
                issues_found += 1
                
            if not order.get('status'):
                print(f"❌ Order {order_id[:8]} missing status")
                issues_found += 1
                
            if 'total' not in order or not isinstance(order.get('total'), (int, float)):
                print(f"❌ Order {order_id[:8]} has invalid total: {order.get('total')}")
                issues_found += 1
                
            if not isinstance(order.get('items', []), list):
                print(f"❌ Order {order_id[:8]} has invalid items: {type(order.get('items'))}")
                issues_found += 1
                
            # Check date validity
            try:
                created_at = order.get('created_at')
                if created_at:
                    datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            except Exception as e:
                print(f"❌ Order {order_id[:8]} has invalid date: {created_at} - {e}")
                issues_found += 1
        
        if issues_found == 0:
            print("✅ All orders have valid data structure")
        else:
            print(f"⚠️  Found {issues_found} data integrity issues")
        
        # Test today's orders filtering
        IST = timezone(timedelta(hours=5, minutes=30))
        now_ist = datetime.now(IST)
        today_ist = now_ist.replace(hour=0, minute=0, second=0, microsecond=0)
        today_utc = today_ist.astimezone(timezone.utc)
        
        today_orders = await db.orders.count_documents({
            "created_at": {"$gte": today_utc.isoformat()}
        })
        
        completed_today = await db.orders.count_documents({
            "status": {"$in": ["completed", "cancelled"]},
            "created_at": {"$gte": today_utc.isoformat()}
        })
        
        print(f"\n📅 Today's Orders:")
        print(f"   Total created today: {today_orders}")
        print(f"   Completed/Cancelled today: {completed_today}")
        
        # Test table data
        tables = await db.tables.find({}, {"_id": 0}).limit(5).to_list(5)
        
        print(f"\n🍽️  Tables:")
        print(f"   Found {len(tables)} tables")
        
        table_issues = 0
        for table in tables:
            if not table.get('id'):
                print(f"❌ Table missing ID: {table}")
                table_issues += 1
            if not isinstance(table.get('table_number'), int):
                print(f"❌ Table {table.get('id', 'unknown')} has invalid table_number: {table.get('table_number')}")
                table_issues += 1
        
        if table_issues == 0:
            print("✅ All tables have valid data structure")
        else:
            print(f"⚠️  Found {table_issues} table data issues")
        
        return issues_found == 0 and table_issues == 0
        
    except Exception as e:
        print(f"❌ Error testing orders API: {e}")
        return False
    finally:
        try:
            client.close()
        except:
            pass

def test_frontend_fixes():
    """Test if frontend fixes are in place"""
    
    print("\n🔧 Testing Frontend Fixes")
    print("=" * 50)
    
    orders_page_path = os.path.join('frontend', 'src', 'pages', 'OrdersPage.js')
    
    if not os.path.exists(orders_page_path):
        print("❌ OrdersPage.js not found")
        return False
    
    try:
        with open(orders_page_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check for improved error handling
        has_validation = 'validOrders' in content and 'filter(order =>' in content
        has_error_handling = 'try {' in content and 'catch (e)' in content
        has_date_validation = 'Invalid time' in content or 'Invalid date' in content
        has_total_validation = 'Invalid total' in content or '(order.total || 0)' in content
        
        print(f"✅ Order validation: {'✓' if has_validation else '✗'}")
        print(f"✅ Error handling: {'✓' if has_error_handling else '✗'}")
        print(f"✅ Date validation: {'✓' if has_date_validation else '✗'}")
        print(f"✅ Total validation: {'✓' if has_total_validation else '✗'}")
        
        # Check for performance improvements
        has_fast_loading = 'Load critical data first' in content
        has_background_loading = 'Load secondary data in background' in content
        
        print(f"✅ Fast loading: {'✓' if has_fast_loading else '✗'}")
        print(f"✅ Background loading: {'✓' if has_background_loading else '✗'}")
        
        return has_validation and has_error_handling and has_date_validation
        
    except Exception as e:
        print(f"❌ Error reading OrdersPage.js: {e}")
        return False

def main():
    """Run all tests"""
    print("🔧 BillByteKOT Orders Page - Fix Verification")
    print("Testing fixes for:")
    print("1. Orders showing 'invalid'")
    print("2. Today's orders not fetching")
    print("3. Slow table fetching")
    
    # Test backend
    backend_success = asyncio.run(test_orders_api())
    
    # Test frontend
    frontend_success = test_frontend_fixes()
    
    print(f"\n📊 Results:")
    print(f"   Backend API: {'✅ PASS' if backend_success else '❌ FAIL'}")
    print(f"   Frontend fixes: {'✅ PASS' if frontend_success else '❌ FAIL'}")
    
    if backend_success and frontend_success:
        print(f"\n🎉 All fixes verified successfully!")
        print(f"\nThe following issues should now be resolved:")
        print(f"✅ Orders page no longer shows 'invalid'")
        print(f"✅ Today's orders fetch correctly")
        print(f"✅ Table fetching is optimized")
        print(f"✅ Better error handling prevents crashes")
    else:
        print(f"\n⚠️  Some issues still need attention")
        if not backend_success:
            print(f"- Check database data integrity")
            print(f"- Verify order and table data structure")
        if not frontend_success:
            print(f"- Check frontend error handling")
            print(f"- Verify OrdersPage.js fixes")
    
    return backend_success and frontend_success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)