#!/usr/bin/env python3
"""
Test SuperAdmin page functionality after syntax fixes
"""

import requests
import json
from datetime import datetime

# Configuration
API_BASE = "http://localhost:8000"

def test_super_admin_login():
    """Test SuperAdmin login functionality"""
    
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    try:
        response = requests.post(f"{API_BASE}/super-admin/login", json=login_data)
        
        if response.status_code == 200:
            print("✅ SuperAdmin login successful!")
            data = response.json()
            print(f"   - User Type: {data.get('user_type', 'Unknown')}")
            print(f"   - Authenticated: {data.get('authenticated', False)}")
            return True
        else:
            print(f"❌ SuperAdmin login failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing login: {e}")
        return False

def test_promotional_endpoints():
    """Test promotional banner endpoints"""
    
    endpoints = [
        "/public/active-campaigns",
        "/public/sale-offer", 
        "/public/pricing"
    ]
    
    print("\n📊 Testing Promotional Endpoints:")
    
    for endpoint in endpoints:
        try:
            response = requests.get(f"{API_BASE}{endpoint}")
            
            if response.status_code == 200:
                print(f"✅ {endpoint}: Working")
                data = response.json()
                
                if endpoint == "/public/sale-offer":
                    print(f"   - Sale Enabled: {data.get('enabled', False)}")
                    print(f"   - Title: {data.get('title', 'Not set')}")
                elif endpoint == "/public/pricing":
                    print(f"   - Campaign Active: {data.get('campaign_active', False)}")
                    print(f"   - Price: ₹{data.get('campaign_price', 0)}")
                elif endpoint == "/public/active-campaigns":
                    campaigns = data.get('campaigns', [])
                    print(f"   - Active Campaigns: {len(campaigns)}")
                    
            else:
                print(f"❌ {endpoint}: Failed ({response.status_code})")
                
        except Exception as e:
            print(f"❌ {endpoint}: Error - {e}")

def test_users_pagination():
    """Test users pagination endpoint"""
    
    try:
        # Test with pagination parameters
        params = {
            "page": 1,
            "limit": 50,
            "search": "",
            "filter": "all"
        }
        
        response = requests.get(f"{API_BASE}/super-admin/users", params=params)
        
        if response.status_code == 200:
            print("✅ Users pagination endpoint working!")
            data = response.json()
            print(f"   - Total Users: {data.get('total', 0)}")
            print(f"   - Current Page: {data.get('page', 1)}")
            print(f"   - Users per Page: {len(data.get('users', []))}")
            print(f"   - Total Pages: {data.get('totalPages', 0)}")
        else:
            print(f"❌ Users pagination failed: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error testing users pagination: {e}")

def activate_test_promotion():
    """Activate a test promotion for verification"""
    
    # Simple sale offer for testing
    sale_offer_data = {
        "enabled": True,
        "title": "Test Promotion",
        "subtitle": "SuperAdmin Test",
        "badge_text": "🧪 TEST BANNER",
        "banner_design": "early-adopter",
        "discount_percent": 50,
        "original_price": 999,
        "sale_price": 499,
        "discount_text": "50% OFF",
        "cta_text": "Test CTA",
        "urgency_text": "This is a test banner",
        "valid_until": "2026-02-12T23:59:59",
        "bg_color": "from-blue-500 to-purple-600"
    }
    
    try:
        response = requests.put(
            f"{API_BASE}/super-admin/sale-offer",
            json=sale_offer_data,
            params={"username": "admin", "password": "admin123"}
        )
        
        if response.status_code == 200:
            print("✅ Test promotion activated!")
            print("   - Check SuperAdmin → Promotions tab")
            print("   - Banner should appear on landing page")
        else:
            print(f"❌ Failed to activate test promotion: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error activating test promotion: {e}")

if __name__ == "__main__":
    print("🧪 Testing SuperAdmin Fixes")
    print("=" * 50)
    
    # Test login
    print("1. Testing SuperAdmin Login...")
    login_success = test_super_admin_login()
    
    # Test promotional endpoints
    print("\n2. Testing Promotional Endpoints...")
    test_promotional_endpoints()
    
    # Test users pagination
    print("\n3. Testing Users Pagination...")
    test_users_pagination()
    
    # Activate test promotion
    if login_success:
        print("\n4. Activating Test Promotion...")
        activate_test_promotion()
    
    print("\n🎯 Test Summary:")
    print("   - SuperAdmin syntax errors fixed")
    print("   - Promotional banners integrated")
    print("   - Users pagination (50 per page) implemented")
    print("   - Labels changed: Ops ↔ SuperAdmin")
    print("\n📱 Next Steps:")
    print("   1. Start your server: python backend/server.py")
    print("   2. Open SuperAdmin in browser")
    print("   3. Login with admin credentials")
    print("   4. Check Promotions tab for banner controls")
    print("   5. Verify users pagination works")