#!/usr/bin/env python3
"""
Test Menu Items Loading for BillByteKOT Billing Page
This script tests if menu items are loading properly for the dropdown suggestions.
"""

import requests
import json
import sys

def test_menu_items_loading():
    """Test if menu items are loading from the API"""
    
    # Test the menu endpoint
    base_url = "https://billbytekot.in/api"  # Update if different
    
    print("🧪 Testing Menu Items Loading...")
    print("=" * 50)
    
    # Test 1: Check if menu endpoint is accessible
    try:
        response = requests.get(f"{base_url}/menu", timeout=10)
        print(f"✅ Menu endpoint status: {response.status_code}")
        
        if response.status_code == 200:
            menu_data = response.json()
            print(f"✅ Menu items count: {len(menu_data) if isinstance(menu_data, list) else 'Not a list'}")
            
            if isinstance(menu_data, list) and len(menu_data) > 0:
                print("✅ Sample menu items:")
                for i, item in enumerate(menu_data[:3]):  # Show first 3 items
                    print(f"   {i+1}. {item.get('name', 'No name')} - ₹{item.get('price', 0)}")
                    
                # Check if items have required fields
                required_fields = ['id', 'name', 'price', 'available']
                sample_item = menu_data[0]
                missing_fields = [field for field in required_fields if field not in sample_item]
                
                if missing_fields:
                    print(f"⚠️  Missing fields in menu items: {missing_fields}")
                else:
                    print("✅ All required fields present in menu items")
                    
                # Check available items
                available_items = [item for item in menu_data if item.get('available', True)]
                print(f"✅ Available items: {len(available_items)} out of {len(menu_data)}")
                
            else:
                print("❌ No menu items found or invalid format")
                
        elif response.status_code == 401:
            print("❌ Authentication required - menu endpoint needs login")
        elif response.status_code == 404:
            print("❌ Menu endpoint not found")
        else:
            print(f"❌ Menu endpoint error: {response.status_code}")
            print(f"Response: {response.text[:200]}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error accessing menu endpoint: {e}")
    
    print("\n" + "=" * 50)
    
    # Test 2: Check frontend menu loading
    print("🔍 Frontend Menu Loading Analysis:")
    print("1. Check browser console for errors when typing in search box")
    print("2. Verify that fetchMenuItems() is called on page load")
    print("3. Check if menuItems state is populated")
    print("4. Verify showMenuDropdown state changes when typing")
    
    print("\n📋 Debugging Steps:")
    print("1. Open browser DevTools (F12)")
    print("2. Go to Console tab")
    print("3. Type in the search box on billing page")
    print("4. Look for these console messages:")
    print("   - 'Fetching menu items...'")
    print("   - 'Menu fetch successful: X available items'")
    print("   - Any error messages")
    
    print("\n🔧 Common Issues & Solutions:")
    print("1. No menu items in database:")
    print("   - Add menu items via Settings > Menu page")
    print("2. Authentication issues:")
    print("   - Check if user is logged in properly")
    print("3. API endpoint issues:")
    print("   - Verify backend is running and accessible")
    print("4. Frontend state issues:")
    print("   - Check if menuItems state is being set")
    print("   - Verify dropdown visibility logic")

if __name__ == "__main__":
    test_menu_items_loading()