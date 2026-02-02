#!/usr/bin/env python3
"""
Diagnostic script to check table-order synchronization issues
This will help identify why active orders count doesn't match occupied tables count
"""

import requests
import json
from datetime import datetime

# Production API configuration
API_BASE = "https://restro-ai.onrender.com"

def diagnose_table_order_sync():
    """Diagnose table-order synchronization issues"""
    
    print("🔍 Diagnosing Table-Order Synchronization Issues")
    print("=" * 60)
    
    # Login credentials for Yashraj's account
    login_data = {
        "email": "yashraj@example.com",  # Update with Yashraj's actual email
        "password": "password123"        # Update with actual password
    }
    
    try:
        print("🔐 Logging in...")
        login_response = requests.post(f"{API_BASE}/auth/login", json=login_data, timeout=10)
        
        if login_response.status_code != 200:
            print(f"❌ Login failed: {login_response.status_code}")
            print("💡 Update the login credentials in this script with Yashraj's actual credentials")
            return
        
        token = login_response.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        
        print("✅ Login successful")
        
        # Get active orders
        print("\n📋 Fetching active orders...")
        orders_response = requests.get(f"{API_BASE}/orders", headers=headers, timeout=15)
        
        if orders_response.status_code != 200:
            print(f"❌ Failed to get orders: {orders_response.status_code}")
            return
        
        active_orders = orders_response.json()
        print(f"📊 Found {len(active_orders)} active orders")
        
        # Get tables
        print("\n🏠 Fetching tables...")
        tables_response = requests.get(f"{API_BASE}/tables", headers=headers, timeout=15)
        
        if tables_response.status_code != 200:
            print(f"❌ Failed to get tables: {tables_response.status_code}")
            return
        
        tables = tables_response.json()
        print(f"📊 Found {len(tables)} tables")
        
        # Analyze the synchronization
        print("\n🔍 SYNCHRONIZATION ANALYSIS")
        print("=" * 40)
        
        # Count occupied tables
        occupied_tables = [table for table in tables if table.get('status') == 'occupied']
        available_tables = [table for table in tables if table.get('status') == 'available']
        
        print(f"📈 Table Status Summary:")
        print(f"   Total tables: {len(tables)}")
        print(f"   Occupied tables: {len(occupied_tables)}")
        print(f"   Available tables: {len(available_tables)}")
        
        print(f"\n📈 Order Status Summary:")
        print(f"   Active orders: {len(active_orders)}")
        
        # Analyze orders by table
        orders_with_tables = [order for order in active_orders if order.get('table_id')]
        orders_without_tables = [order for order in active_orders if not order.get('table_id')]
        
        print(f"   Orders with tables: {len(orders_with_tables)}")
        print(f"   Orders without tables (counter): {len(orders_without_tables)}")
        
        # Check for mismatches
        print(f"\n🚨 MISMATCH ANALYSIS:")
        
        if len(orders_with_tables) != len(occupied_tables):
            print(f"❌ MISMATCH FOUND!")
            print(f"   Orders with tables: {len(orders_with_tables)}")
            print(f"   Occupied tables: {len(occupied_tables)}")
            print(f"   Difference: {abs(len(orders_with_tables) - len(occupied_tables))}")
        else:
            print(f"✅ Orders and occupied tables count matches!")
        
        # Detailed analysis
        print(f"\n📋 DETAILED ANALYSIS:")
        
        # Map orders to tables
        order_table_map = {}
        for order in orders_with_tables:
            table_id = order.get('table_id')
            if table_id:
                if table_id not in order_table_map:
                    order_table_map[table_id] = []
                order_table_map[table_id].append(order)
        
        # Map tables to orders
        table_order_map = {}
        for table in occupied_tables:
            table_id = table.get('id')
            current_order_id = table.get('current_order_id')
            table_order_map[table_id] = current_order_id
        
        print(f"📊 Orders by Table:")
        for table_id, orders in order_table_map.items():
            table_info = next((t for t in tables if t.get('id') == table_id), None)
            table_number = table_info.get('table_number', 'Unknown') if table_info else 'Unknown'
            table_status = table_info.get('status', 'Unknown') if table_info else 'Unknown'
            
            print(f"   Table {table_number} (ID: {table_id}, Status: {table_status}):")
            for order in orders:
                print(f"      - Order {order.get('id')}: {order.get('status')} (₹{order.get('total', 0)})")
        
        print(f"\n📊 Occupied Tables Details:")
        for table in occupied_tables:
            table_id = table.get('id')
            table_number = table.get('table_number')
            current_order_id = table.get('current_order_id')
            
            # Find the order for this table
            matching_order = next((o for o in active_orders if o.get('id') == current_order_id), None)
            
            print(f"   Table {table_number} (ID: {table_id}):")
            print(f"      Current Order ID: {current_order_id}")
            if matching_order:
                print(f"      Order Status: {matching_order.get('status')}")
                print(f"      Order Total: ₹{matching_order.get('total', 0)}")
                print(f"      ✅ Order found in active orders")
            else:
                print(f"      ❌ Order NOT found in active orders!")
                print(f"      🚨 This table should be available!")
        
        # Check for orphaned orders (orders with table_id but table not occupied)
        print(f"\n🔍 ORPHANED ORDERS CHECK:")
        orphaned_orders = []
        for order in orders_with_tables:
            table_id = order.get('table_id')
            table_info = next((t for t in tables if t.get('id') == table_id), None)
            
            if not table_info:
                print(f"❌ Order {order.get('id')} references non-existent table {table_id}")
                orphaned_orders.append(order)
            elif table_info.get('status') != 'occupied':
                print(f"❌ Order {order.get('id')} references table {table_id} but table status is '{table_info.get('status')}'")
                orphaned_orders.append(order)
            elif table_info.get('current_order_id') != order.get('id'):
                print(f"❌ Order {order.get('id')} references table {table_id} but table's current_order_id is '{table_info.get('current_order_id')}'")
                orphaned_orders.append(order)
        
        if not orphaned_orders:
            print("✅ No orphaned orders found")
        
        # Check for orphaned tables (occupied tables with no matching active order)
        print(f"\n🔍 ORPHANED TABLES CHECK:")
        orphaned_tables = []
        for table in occupied_tables:
            current_order_id = table.get('current_order_id')
            if current_order_id:
                matching_order = next((o for o in active_orders if o.get('id') == current_order_id), None)
                if not matching_order:
                    print(f"❌ Table {table.get('table_number')} (ID: {table.get('id')}) is occupied but order {current_order_id} not found in active orders")
                    orphaned_tables.append(table)
            else:
                print(f"❌ Table {table.get('table_number')} (ID: {table.get('id')}) is occupied but has no current_order_id")
                orphaned_tables.append(table)
        
        if not orphaned_tables:
            print("✅ No orphaned tables found")
        
        # Summary and recommendations
        print(f"\n" + "=" * 60)
        print(f"📊 DIAGNOSIS SUMMARY:")
        print(f"   Active Orders: {len(active_orders)}")
        print(f"   Orders with Tables: {len(orders_with_tables)}")
        print(f"   Occupied Tables: {len(occupied_tables)}")
        print(f"   Orphaned Orders: {len(orphaned_orders)}")
        print(f"   Orphaned Tables: {len(orphaned_tables)}")
        
        if orphaned_orders or orphaned_tables:
            print(f"\n🔧 RECOMMENDED FIXES:")
            if orphaned_tables:
                print(f"   1. Clear orphaned tables (set to available)")
                print(f"   2. Update table status synchronization logic")
            if orphaned_orders:
                print(f"   3. Fix order-table relationship consistency")
                print(f"   4. Add validation for table references")
        else:
            print(f"\n✅ No synchronization issues found!")
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    print("🔍 Table-Order Synchronization Diagnostic Tool")
    print("This will help identify why active orders count doesn't match occupied tables")
    print()
    print("⚠️ IMPORTANT: Update the login credentials in this script")
    print("   Look for login_data and update with Yashraj's actual credentials")
    print()
    
    response = input("Continue with diagnosis? (y/n): ").lower().strip()
    if response == 'y':
        diagnose_table_order_sync()
    else:
        print("Diagnosis cancelled")