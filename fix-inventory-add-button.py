#!/usr/bin/env python3
"""
Fix and test inventory add button functionality
"""

import requests
import json
from datetime import datetime

# Configuration
API_BASE = "http://localhost:8000"

def test_user_login_and_role():
    """Test user login and verify role assignment"""
    
    print("🔐 Testing User Login and Role Assignment")
    print("=" * 50)
    
    # Test admin login
    admin_credentials = {
        "username": "admin",
        "password": "admin123"
    }
    
    try:
        response = requests.post(f"{API_BASE}/auth/login", json=admin_credentials)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Admin login successful")
            print(f"   - User ID: {data['user']['id']}")
            print(f"   - Username: {data['user']['username']}")
            print(f"   - Role: {data['user']['role']}")
            print(f"   - Token: {'Present' if data.get('token') else 'Missing'}")
            
            # Check if role allows inventory operations
            user_role = data['user']['role']
            can_add_items = user_role in ['admin', 'cashier']
            print(f"   - Can Add Inventory: {'✅ Yes' if can_add_items else '❌ No'}")
            
            if can_add_items:
                return data['token'], data['user']
            else:
                print("❌ User role does not allow inventory operations")
                return None, None
                
        else:
            print(f"❌ Admin login failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return None, None
            
    except Exception as e:
        print(f"❌ Login error: {e}")
        return None, None

def test_inventory_endpoints(token, user):
    """Test inventory endpoints with authenticated user"""
    
    print(f"\n📦 Testing Inventory Endpoints for {user['username']}")
    print("=" * 50)
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    # Test GET /inventory
    try:
        response = requests.get(f"{API_BASE}/inventory", headers=headers)
        
        if response.status_code == 200:
            items = response.json()
            print(f"✅ GET /inventory: Success ({len(items)} items)")
        else:
            print(f"❌ GET /inventory: Failed ({response.status_code})")
            print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ GET /inventory: Error - {e}")
        return False
    
    # Test POST /inventory (what the add button does)
    test_item = {
        "name": f"Test Item {datetime.now().strftime('%H%M%S')}",
        "quantity": 10.0,
        "unit": "pieces",
        "min_quantity": 5.0,
        "price_per_unit": 25.50,
        "description": "Test item for add button functionality"
    }
    
    try:
        response = requests.post(f"{API_BASE}/inventory", json=test_item, headers=headers)
        
        if response.status_code == 200:
            created_item = response.json()
            print(f"✅ POST /inventory: Success (ID: {created_item['id']})")
            
            # Clean up - delete the test item
            delete_response = requests.delete(f"{API_BASE}/inventory/{created_item['id']}", headers=headers)
            if delete_response.status_code == 200:
                print(f"✅ Cleanup: Test item deleted")
            
            return True
            
        else:
            print(f"❌ POST /inventory: Failed ({response.status_code})")
            print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ POST /inventory: Error - {e}")
        return False

def create_frontend_debug_script():
    """Create a debug script for the frontend"""
    
    debug_script = '''
// Inventory Add Button Debug Script
// Paste this in your browser console while on the inventory page

console.log("🧪 INVENTORY ADD BUTTON DEBUG");
console.log("=" * 40);

// Check user object
console.log("1. User Object Check:");
if (window.user) {
    console.log("✅ User object exists:", window.user);
    console.log("   - Role:", window.user.role);
    console.log("   - Username:", window.user.username);
    console.log("   - Can add items:", ['admin', 'cashier'].includes(window.user.role));
} else {
    console.log("❌ User object not found");
    console.log("   Check if user is logged in");
}

// Check authentication token
console.log("\\n2. Authentication Token Check:");
const token = localStorage.getItem('token');
if (token) {
    console.log("✅ Token exists in localStorage");
    console.log("   Token preview:", token.substring(0, 20) + "...");
} else {
    console.log("❌ No token in localStorage");
    console.log("   User needs to login again");
}

// Check for add button
console.log("\\n3. Add Button Check:");
const addButtons = document.querySelectorAll('button');
let addButton = null;
for (let btn of addButtons) {
    if (btn.textContent.includes('Add Item')) {
        addButton = btn;
        break;
    }
}

if (addButton) {
    console.log("✅ Add Item button found");
    console.log("   - Text:", addButton.textContent);
    console.log("   - Disabled:", addButton.disabled);
    console.log("   - Visible:", !addButton.hidden && addButton.style.display !== 'none');
    
    // Test click handler
    console.log("\\n4. Testing Button Click:");
    try {
        addButton.click();
        console.log("✅ Button click executed");
    } catch (error) {
        console.log("❌ Button click failed:", error);
    }
} else {
    console.log("❌ Add Item button not found");
    console.log("   Possible reasons:");
    console.log("   - User role is not admin/cashier");
    console.log("   - Component not rendered");
    console.log("   - JavaScript error");
}

// Check for dialog
console.log("\\n5. Dialog Check:");
const dialogs = document.querySelectorAll('[role="dialog"], .dialog, [data-dialog]');
if (dialogs.length > 0) {
    console.log("✅ Dialog elements found:", dialogs.length);
    dialogs.forEach((dialog, i) => {
        console.log(`   Dialog ${i+1}:`, dialog.style.display !== 'none' ? 'Visible' : 'Hidden');
    });
} else {
    console.log("❌ No dialog elements found");
}

// Check for React errors
console.log("\\n6. React Error Check:");
const reactErrors = document.querySelectorAll('[data-reactroot] .error, .react-error');
if (reactErrors.length > 0) {
    console.log("❌ React errors found:", reactErrors.length);
    reactErrors.forEach(error => console.log("   Error:", error.textContent));
} else {
    console.log("✅ No visible React errors");
}

console.log("\\n🎯 Debug Complete");
console.log("If add button is not working:");
console.log("1. Verify user role is admin or cashier");
console.log("2. Check authentication token");
console.log("3. Look for JavaScript console errors");
console.log("4. Try refreshing the page");
'''
    
    return debug_script

def create_test_user():
    """Create a test user with cashier role"""
    
    print("\n👤 Creating Test Cashier User")
    print("=" * 50)
    
    test_user = {
        "username": "test_cashier",
        "password": "test123",
        "email": "test@example.com",
        "role": "cashier",
        "phone": "1234567890"
    }
    
    try:
        response = requests.post(f"{API_BASE}/auth/register", json=test_user)
        
        if response.status_code == 200:
            print("✅ Test cashier user created successfully")
            print(f"   - Username: {test_user['username']}")
            print(f"   - Password: {test_user['password']}")
            print(f"   - Role: {test_user['role']}")
            return True
        else:
            print(f"❌ Failed to create test user: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error creating test user: {e}")
        return False

def main():
    print("🧪 Inventory Add Button Fix & Test")
    print("=" * 60)
    
    # Test admin login
    token, user = test_user_login_and_role()
    
    if token and user:
        # Test inventory endpoints
        endpoints_working = test_inventory_endpoints(token, user)
        
        if endpoints_working:
            print("\n🎉 Backend Tests Passed!")
            print("✅ User authentication working")
            print("✅ Role authorization working")
            print("✅ Inventory endpoints working")
            print("✅ Add item functionality working")
            
            print("\n🔧 Frontend Debugging:")
            print("If the add button still doesn't work in the frontend:")
            print("1. Open browser developer tools (F12)")
            print("2. Go to Console tab")
            print("3. Paste the debug script below:")
            print("\n" + "="*50)
            print(create_frontend_debug_script())
            print("="*50)
            
        else:
            print("\n❌ Backend Issues Found")
            print("The inventory endpoints are not working properly")
            print("Check server logs for errors")
    
    else:
        print("\n❌ Authentication Issues Found")
        print("Cannot login with admin credentials")
        print("Check if the server is running and admin user exists")
    
    # Try creating a test cashier user
    print("\n" + "="*60)
    create_test_user()
    
    print("\n📋 Summary")
    print("=" * 50)
    print("Common issues and solutions:")
    print("1. ❌ User not logged in → Login again")
    print("2. ❌ Wrong user role → Use admin or cashier account")
    print("3. ❌ Token expired → Refresh page and login")
    print("4. ❌ Server not running → Start backend server")
    print("5. ❌ JavaScript errors → Check browser console")
    print("6. ❌ Component not rendered → Check React state")
    
    print("\n🚀 Quick Test Steps:")
    print("1. Start server: python backend/server.py")
    print("2. Open inventory page in browser")
    print("3. Login with admin/admin123")
    print("4. Look for 'Add Item' button")
    print("5. Click button to open dialog")
    print("6. Fill form and submit")

if __name__ == "__main__":
    main()