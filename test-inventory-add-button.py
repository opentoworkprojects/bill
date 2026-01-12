#!/usr/bin/env python3
"""
Test script to debug inventory page add button issues
"""

import requests
import json
from datetime import datetime

# Configuration
API_BASE = "http://localhost:8000"

def test_user_authentication():
    """Test user authentication and role"""
    
    # Test different user types
    test_users = [
        {"username": "admin", "password": "admin123", "expected_role": "admin"},
        {"username": "cashier", "password": "cashier123", "expected_role": "cashier"},
        {"username": "manager", "password": "manager123", "expected_role": "manager"}
    ]
    
    print("🔐 Testing User Authentication & Roles")
    print("=" * 50)
    
    for user_data in test_users:
        try:
            # Test login
            response = requests.post(f"{API_BASE}/login", json={
                "username": user_data["username"],
                "password": user_data["password"]
            })
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ {user_data['username']} login successful")
                print(f"   - Role: {data.get('role', 'Unknown')}")
                print(f"   - Token: {'Present' if data.get('token') else 'Missing'}")
                
                # Check if role allows inventory add button
                user_role = data.get('role')
                can_add_items = user_role in ['admin', 'cashier']
                print(f"   - Can Add Items: {'✅ Yes' if can_add_items else '❌ No'}")
                
                if can_add_items:
                    # Test inventory access with this user
                    token = data.get('token')
                    if token:
                        test_inventory_access(token, user_data['username'])
                
            else:
                print(f"❌ {user_data['username']} login failed: {response.status_code}")
                print(f"   Response: {response.text}")
                
        except Exception as e:
            print(f"❌ Error testing {user_data['username']}: {e}")
        
        print()

def test_inventory_access(token, username):
    """Test inventory access with authenticated user"""
    
    try:
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        # Test inventory fetch
        response = requests.get(f"{API_BASE}/inventory", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            print(f"   - Inventory Access: ✅ Success ({len(data)} items)")
            
            # Test inventory creation (what the add button does)
            test_item = {
                "name": f"Test Item {datetime.now().strftime('%H%M%S')}",
                "quantity": 10,
                "unit": "pieces",
                "min_quantity": 5,
                "price_per_unit": 25.50,
                "description": "Test item for add button functionality"
            }
            
            create_response = requests.post(f"{API_BASE}/inventory", 
                                          json=test_item, 
                                          headers=headers)
            
            if create_response.status_code in [200, 201]:
                print(f"   - Add Item Test: ✅ Success")
                created_item = create_response.json()
                item_id = created_item.get('id')
                
                # Clean up - delete the test item
                if item_id:
                    delete_response = requests.delete(f"{API_BASE}/inventory/{item_id}", 
                                                    headers=headers)
                    if delete_response.status_code == 200:
                        print(f"   - Cleanup: ✅ Test item deleted")
                    
            else:
                print(f"   - Add Item Test: ❌ Failed ({create_response.status_code})")
                print(f"     Error: {create_response.text}")
                
        else:
            print(f"   - Inventory Access: ❌ Failed ({response.status_code})")
            print(f"     Error: {response.text}")
            
    except Exception as e:
        print(f"   - Inventory Test Error: {e}")

def test_inventory_endpoints():
    """Test all inventory-related endpoints"""
    
    print("📦 Testing Inventory Endpoints")
    print("=" * 50)
    
    endpoints = [
        ("/inventory", "GET", "Fetch inventory items"),
        ("/inventory/categories", "GET", "Fetch categories"),
        ("/inventory/suppliers", "GET", "Fetch suppliers"),
        ("/inventory/low-stock", "GET", "Fetch low stock items"),
        ("/inventory/movements", "GET", "Fetch stock movements"),
        ("/inventory/analytics", "GET", "Fetch analytics")
    ]
    
    for endpoint, method, description in endpoints:
        try:
            if method == "GET":
                response = requests.get(f"{API_BASE}{endpoint}")
            
            if response.status_code == 200:
                print(f"✅ {endpoint}: {description} - Working")
                data = response.json()
                if isinstance(data, list):
                    print(f"   - Items: {len(data)}")
                elif isinstance(data, dict):
                    print(f"   - Data keys: {list(data.keys())}")
            else:
                print(f"❌ {endpoint}: {description} - Failed ({response.status_code})")
                
        except Exception as e:
            print(f"❌ {endpoint}: Error - {e}")

def check_frontend_console_issues():
    """Check for common frontend issues that could affect the add button"""
    
    print("🖥️  Frontend Issues Checklist")
    print("=" * 50)
    
    issues_to_check = [
        "1. User object is properly passed to InventoryPage component",
        "2. User role is correctly set (admin or cashier)",
        "3. Dialog state management is working",
        "4. Form data state is properly initialized",
        "5. API endpoints are accessible",
        "6. Authentication token is present and valid",
        "7. No JavaScript console errors",
        "8. Button click handler is properly bound"
    ]
    
    for issue in issues_to_check:
        print(f"📋 {issue}")
    
    print("\n🔧 Debugging Steps:")
    print("1. Open browser developer tools (F12)")
    print("2. Go to Console tab")
    print("3. Click the Add Item button")
    print("4. Check for any error messages")
    print("5. Verify user object in console: console.log(user)")
    print("6. Check if dialog opens: console.log('Dialog state:', dialogOpen)")

def create_debug_inventory_component():
    """Create a debug version of the inventory add button"""
    
    debug_component = '''
// Debug version of Add Item button - paste in browser console
const debugAddButton = () => {
  console.log('=== INVENTORY ADD BUTTON DEBUG ===');
  console.log('User object:', window.user || 'Not found');
  console.log('User role:', window.user?.role || 'Not found');
  console.log('Role check result:', ['admin', 'cashier'].includes(window.user?.role));
  console.log('Dialog open state:', window.dialogOpen || 'Not accessible');
  
  // Try to find the add button
  const addButton = document.querySelector('button:has(svg + text)');
  console.log('Add button found:', !!addButton);
  
  if (addButton) {
    console.log('Button text:', addButton.textContent);
    console.log('Button disabled:', addButton.disabled);
    console.log('Button click handler:', addButton.onclick);
  }
  
  // Check for form dialog
  const dialog = document.querySelector('[role="dialog"]');
  console.log('Dialog element found:', !!dialog);
  
  return {
    user: window.user,
    hasAddButton: !!addButton,
    hasDialog: !!dialog
  };
};

// Run debug
debugAddButton();
'''
    
    print("🐛 Debug Script for Browser Console")
    print("=" * 50)
    print("Copy and paste this in your browser console while on inventory page:")
    print()
    print(debug_component)

if __name__ == "__main__":
    print("🧪 Inventory Add Button Debug Test")
    print("=" * 60)
    
    # Test user authentication and roles
    test_user_authentication()
    
    # Test inventory endpoints
    test_inventory_endpoints()
    
    # Frontend debugging checklist
    check_frontend_console_issues()
    
    # Create debug script
    create_debug_inventory_component()
    
    print("\n🎯 Summary")
    print("=" * 50)
    print("Common reasons why Add Item button might not work:")
    print("1. ❌ User role is not 'admin' or 'cashier'")
    print("2. ❌ User object is null/undefined")
    print("3. ❌ Dialog state management issue")
    print("4. ❌ JavaScript error preventing click handler")
    print("5. ❌ Authentication token missing/expired")
    print("6. ❌ API endpoint not responding")
    print()
    print("🔧 Quick Fixes:")
    print("1. Check user login and role assignment")
    print("2. Verify token in localStorage")
    print("3. Check browser console for errors")
    print("4. Test with admin user account")
    print("5. Refresh page and try again")