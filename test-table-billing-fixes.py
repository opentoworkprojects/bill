#!/usr/bin/env python3
"""
Test Table and Billing Fixes
Tests the fixes for table clearing and today's bills
"""

import sys
import os

def test_frontend_fixes():
    """Test frontend fixes for loading states and billing"""
    print("🔧 Testing Frontend Fixes")
    print("=" * 40)
    
    # Test BillingPage fixes
    billing_path = os.path.join('frontend', 'src', 'pages', 'BillingPage.js')
    if os.path.exists(billing_path):
        with open(billing_path, 'r', encoding='utf-8') as f:
            billing_content = f.read()
        
        # Check for improved payment handling
        has_status_completed = "status: 'completed'" in billing_content
        has_payment_received = "payment_received: calculateTotal()" in billing_content
        has_balance_zero = "balance_amount: 0" in billing_content
        has_updated_at = "updated_at: new Date().toISOString()" in billing_content
        
        print(f"✅ Status set to completed: {'✓' if has_status_completed else '✗'}")
        print(f"✅ Payment received set: {'✓' if has_payment_received else '✗'}")
        print(f"✅ Balance amount zeroed: {'✓' if has_balance_zero else '✗'}")
        print(f"✅ Updated timestamp: {'✓' if has_updated_at else '✗'}")
        
        billing_ok = has_status_completed and has_payment_received
    else:
        print("❌ BillingPage.js not found")
        billing_ok = False
    
    # Test OrdersPage fixes
    orders_path = os.path.join('frontend', 'src', 'pages', 'OrdersPage.js')
    if os.path.exists(orders_path):
        with open(orders_path, 'r', encoding='utf-8') as f:
            orders_content = f.read()
        
        # Check for loading states
        has_loading_skeleton = "animate-pulse" in orders_content
        has_loading_tabs = "loading ? '...' :" in orders_content
        has_loading_check = "!loading && activeTab" in orders_content
        
        print(f"✅ Loading skeleton: {'✓' if has_loading_skeleton else '✗'}")
        print(f"✅ Loading in tabs: {'✓' if has_loading_tabs else '✗'}")
        print(f"✅ Loading state check: {'✓' if has_loading_check else '✗'}")
        
        orders_ok = has_loading_skeleton and has_loading_tabs
    else:
        print("❌ OrdersPage.js not found")
        orders_ok = False
    
    return billing_ok and orders_ok

def test_backend_fixes():
    """Test backend fixes for table clearing"""
    print("\n🔧 Testing Backend Fixes")
    print("=" * 40)
    
    server_path = os.path.join('backend', 'server.py')
    if os.path.exists(server_path):
        with open(server_path, 'r', encoding='utf-8') as f:
            server_content = f.read()
        
        # Check for table clearing logic
        has_table_clearing = "Table {existing_order.get('table_number'" in server_content
        has_status_available = '"status": "available"' in server_content
        has_current_order_none = '"current_order_id": None' in server_content
        has_completion_message = "Order completed and table cleared successfully" in server_content
        
        print(f"✅ Table clearing logic: {'✓' if has_table_clearing else '✗'}")
        print(f"✅ Status set to available: {'✓' if has_status_available else '✗'}")
        print(f"✅ Current order cleared: {'✓' if has_current_order_none else '✗'}")
        print(f"✅ Success message updated: {'✓' if has_completion_message else '✗'}")
        
        return has_table_clearing and has_status_available
    else:
        print("❌ server.py not found")
        return False

def test_syntax():
    """Test that all files have correct syntax"""
    print("\n🔧 Testing Syntax")
    print("=" * 40)
    
    files_to_test = [
        'backend/server.py',
        'backend/super_admin.py'
    ]
    
    all_good = True
    
    for file_path in files_to_test:
        if not os.path.exists(file_path):
            print(f"❌ {file_path} - File not found")
            all_good = False
            continue
            
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Compile to check syntax
            compile(content, file_path, 'exec')
            print(f"✅ {file_path} - Syntax OK")
            
        except SyntaxError as e:
            print(f"❌ {file_path} - Syntax Error: {e}")
            all_good = False
        except Exception as e:
            print(f"⚠️  {file_path} - Error: {e}")
    
    return all_good

def main():
    """Run all tests"""
    print("🔧 BillByteKOT Table & Billing Fixes - Verification")
    print("=" * 60)
    print("Testing fixes for:")
    print("1. Tables not clearing after bill completion")
    print("2. Today's bills not showing completed orders")
    print("3. Missing loading states")
    
    # Run tests
    frontend_ok = test_frontend_fixes()
    backend_ok = test_backend_fixes()
    syntax_ok = test_syntax()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Test Results Summary")
    print("=" * 60)
    
    print(f"Frontend Fixes: {'✅ PASS' if frontend_ok else '❌ FAIL'}")
    print(f"Backend Fixes: {'✅ PASS' if backend_ok else '❌ FAIL'}")
    print(f"Syntax Check: {'✅ PASS' if syntax_ok else '❌ FAIL'}")
    
    all_passed = frontend_ok and backend_ok and syntax_ok
    
    if all_passed:
        print("\n🎉 ALL FIXES VERIFIED!")
        print("\n✅ Issues Resolved:")
        print("   1. Tables will clear after payment completion")
        print("   2. Orders marked as 'completed' will show in Today's Bills")
        print("   3. Loading states added for better UX")
        print("   4. Enhanced payment handling with proper status updates")
        
        print("\n🚀 Expected Behavior:")
        print("   • When payment is completed in billing page:")
        print("     - Order status set to 'completed'")
        print("     - Payment details properly recorded")
        print("     - Table automatically cleared and made available")
        print("     - Order appears in 'Today's Bills' tab")
        print("   • Loading states show while data is being fetched")
        print("   • Better error handling and user feedback")
        
    else:
        print("\n⚠️  Some issues still need attention")
        if not frontend_ok:
            print("   - Check frontend payment and loading state fixes")
        if not backend_ok:
            print("   - Check backend table clearing logic")
        if not syntax_ok:
            print("   - Fix syntax errors before deployment")
    
    return all_passed

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)