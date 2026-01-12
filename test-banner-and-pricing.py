#!/usr/bin/env python3
"""
Test promotional banners and inventory pricing changes from frontend
"""

import requests
import json
from datetime import datetime, timedelta
import time

# Configuration
API_BASE = "http://localhost:8000"
SUPER_ADMIN_CREDENTIALS = {
    "username": "admin",
    "password": "admin123"
}

def test_super_admin_login():
    """Test SuperAdmin login"""
    
    print("🔐 Testing SuperAdmin Login")
    print("=" * 50)
    
    try:
        response = requests.post(f"{API_BASE}/super-admin/login", json=SUPER_ADMIN_CREDENTIALS)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ SuperAdmin login successful!")
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

def test_promotional_banner_endpoints():
    """Test promotional banner endpoints"""
    
    print("\n🎯 Testing Promotional Banner Endpoints")
    print("=" * 50)
    
    # Test public endpoints (what the frontend uses)
    public_endpoints = [
        ("/public/active-campaigns", "Active Campaigns"),
        ("/public/sale-offer", "Sale Offer"),
        ("/public/pricing", "Pricing Campaign")
    ]
    
    for endpoint, description in public_endpoints:
        try:
            response = requests.get(f"{API_BASE}{endpoint}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ {description}: Working")
                
                if endpoint == "/public/sale-offer":
                    print(f"   - Enabled: {data.get('enabled', False)}")
                    print(f"   - Title: {data.get('title', 'Not set')}")
                    print(f"   - Design: {data.get('banner_design', 'default')}")
                    print(f"   - Price: ₹{data.get('original_price', 0)} → ₹{data.get('sale_price', 0)}")
                    
                elif endpoint == "/public/pricing":
                    print(f"   - Campaign Active: {data.get('campaign_active', False)}")
                    print(f"   - Campaign Name: {data.get('campaign_name', 'Not set')}")
                    print(f"   - Regular Price: ₹{data.get('regular_price', 0)}")
                    print(f"   - Campaign Price: ₹{data.get('campaign_price', 0)}")
                    
                elif endpoint == "/public/active-campaigns":
                    campaigns = data.get('campaigns', [])
                    print(f"   - Active Campaigns: {len(campaigns)}")
                    for i, campaign in enumerate(campaigns[:3]):
                        print(f"     {i+1}. {campaign.get('title', 'Untitled')}")
                        
            else:
                print(f"❌ {description}: Failed ({response.status_code})")
                print(f"   Response: {response.text}")
                
        except Exception as e:
            print(f"❌ {description}: Error - {e}")

def activate_early_adopter_banner():
    """Activate early adopter promotional banner"""
    
    print("\n🔥 Activating Early Adopter Banner")
    print("=" * 50)
    
    # Calculate end date (30 days from now)
    end_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%dT23:59:59")
    
    # Early adopter sale offer configuration
    sale_offer_data = {
        "enabled": True,
        "title": "🔥 Early Adopter Special",
        "subtitle": "Limited Time Mega Deal",
        "badge_text": "🚀 EARLY ADOPTER SPECIAL",
        "banner_design": "early-adopter",
        "discount_percent": 99,
        "original_price": 999,
        "sale_price": 9,
        "discount_text": "99% OFF MEGA DEAL",
        "cta_text": "Grab ₹9 Deal NOW!",
        "urgency_text": "⚡ Only 100 slots left! Offer expires soon!",
        "valid_until": end_date,
        "end_date": end_date.split('T')[0],
        "bg_color": "from-orange-500 via-red-500 to-yellow-500"
    }
    
    try:
        response = requests.put(
            f"{API_BASE}/super-admin/sale-offer",
            json=sale_offer_data,
            params=SUPER_ADMIN_CREDENTIALS
        )
        
        if response.status_code == 200:
            print("✅ Early Adopter banner activated!")
            print(f"   - Title: {sale_offer_data['title']}")
            print(f"   - Discount: {sale_offer_data['discount_percent']}% OFF")
            print(f"   - Price: ₹{sale_offer_data['original_price']} → ₹{sale_offer_data['sale_price']}")
            print(f"   - Design: {sale_offer_data['banner_design']}")
            print(f"   - Valid Until: {end_date}")
            return True
        else:
            print(f"❌ Failed to activate banner: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error activating banner: {e}")
        return False

def activate_pricing_campaign():
    """Activate pricing campaign"""
    
    print("\n💰 Activating Pricing Campaign")
    print("=" * 50)
    
    # Calculate campaign dates
    start_date = datetime.now().strftime("%Y-%m-%d")
    end_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
    
    # Pricing campaign configuration
    pricing_data = {
        "regular_price": 1999,
        "regular_price_display": "₹1999/year",
        "campaign_price": 9,
        "campaign_price_display": "₹9/year",
        "campaign_active": True,
        "campaign_name": "Early Adopter Mega Sale",
        "campaign_discount_percent": 99,
        "campaign_start_date": start_date,
        "campaign_end_date": end_date,
        "trial_expired_discount": 10,
        "trial_days": 7,
        "subscription_months": 12
    }
    
    try:
        response = requests.put(
            f"{API_BASE}/super-admin/pricing",
            json=pricing_data,
            params=SUPER_ADMIN_CREDENTIALS
        )
        
        if response.status_code == 200:
            print("✅ Pricing campaign activated!")
            print(f"   - Campaign: {pricing_data['campaign_name']}")
            print(f"   - Regular Price: {pricing_data['regular_price_display']}")
            print(f"   - Campaign Price: {pricing_data['campaign_price_display']}")
            print(f"   - Discount: {pricing_data['campaign_discount_percent']}%")
            print(f"   - Duration: {start_date} to {end_date}")
            return True
        else:
            print(f"❌ Failed to activate pricing: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error activating pricing: {e}")
        return False

def test_inventory_pricing_update():
    """Test inventory pricing updates"""
    
    print("\n📦 Testing Inventory Pricing Updates")
    print("=" * 50)
    
    # First, get current inventory items
    try:
        # Try to get a token for inventory access
        login_response = requests.post(f"{API_BASE}/login", json={
            "username": "admin",
            "password": "admin123"
        })
        
        if login_response.status_code != 200:
            print("❌ Cannot login for inventory access")
            return False
            
        token = login_response.json().get('token')
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        # Get inventory items
        inventory_response = requests.get(f"{API_BASE}/inventory", headers=headers)
        
        if inventory_response.status_code == 200:
            items = inventory_response.json()
            print(f"✅ Found {len(items)} inventory items")
            
            if len(items) > 0:
                # Test updating the first item's price
                test_item = items[0]
                original_price = test_item.get('price_per_unit', 0)
                new_price = original_price * 1.1  # 10% increase
                
                update_data = {
                    **test_item,
                    'price_per_unit': new_price
                }
                
                update_response = requests.put(
                    f"{API_BASE}/inventory/{test_item['id']}", 
                    json=update_data, 
                    headers=headers
                )
                
                if update_response.status_code == 200:
                    print(f"✅ Price update successful!")
                    print(f"   - Item: {test_item['name']}")
                    print(f"   - Original Price: ₹{original_price}")
                    print(f"   - New Price: ₹{new_price}")
                    
                    # Revert the change
                    revert_data = {**test_item, 'price_per_unit': original_price}
                    revert_response = requests.put(
                        f"{API_BASE}/inventory/{test_item['id']}", 
                        json=revert_data, 
                        headers=headers
                    )
                    
                    if revert_response.status_code == 200:
                        print(f"✅ Price reverted successfully")
                    
                    return True
                else:
                    print(f"❌ Price update failed: {update_response.status_code}")
                    print(f"   Response: {update_response.text}")
                    return False
            else:
                print("⚠️ No inventory items found to test pricing")
                return True
                
        else:
            print(f"❌ Failed to get inventory: {inventory_response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing inventory pricing: {e}")
        return False

def create_test_inventory_item():
    """Create a test inventory item for pricing tests"""
    
    print("\n➕ Creating Test Inventory Item")
    print("=" * 50)
    
    try:
        # Login to get token
        login_response = requests.post(f"{API_BASE}/login", json={
            "username": "admin",
            "password": "admin123"
        })
        
        if login_response.status_code != 200:
            print("❌ Cannot login for inventory creation")
            return False
            
        token = login_response.json().get('token')
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        # Create test item
        test_item = {
            "name": f"Test Item {datetime.now().strftime('%H%M%S')}",
            "quantity": 100.0,
            "unit": "pieces",
            "min_quantity": 10.0,
            "price_per_unit": 25.50,
            "cost_price": 20.00,
            "description": "Test item for pricing functionality"
        }
        
        response = requests.post(f"{API_BASE}/inventory", json=test_item, headers=headers)
        
        if response.status_code == 200:
            created_item = response.json()
            print(f"✅ Test item created successfully!")
            print(f"   - ID: {created_item['id']}")
            print(f"   - Name: {created_item['name']}")
            print(f"   - Price: ₹{created_item['price_per_unit']}")
            return created_item['id']
        else:
            print(f"❌ Failed to create test item: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error creating test item: {e}")
        return None

def test_frontend_banner_display():
    """Test if banners are displayed on frontend"""
    
    print("\n🌐 Testing Frontend Banner Display")
    print("=" * 50)
    
    # Test the promotional banner endpoints that frontend uses
    try:
        # Test TopBanner component endpoint
        response = requests.get(f"{API_BASE}/public/sale-offer")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('enabled'):
                print("✅ Sale offer banner should be visible on frontend")
                print(f"   - Title: {data.get('title')}")
                print(f"   - Design: {data.get('banner_design')}")
                print(f"   - Background: {data.get('bg_color')}")
            else:
                print("⚠️ Sale offer banner is disabled")
        
        # Test PromotionalBanner component endpoints
        pricing_response = requests.get(f"{API_BASE}/public/pricing")
        if pricing_response.status_code == 200:
            pricing_data = pricing_response.json()
            if pricing_data.get('campaign_active'):
                print("✅ Pricing campaign banner should be visible")
                print(f"   - Campaign: {pricing_data.get('campaign_name')}")
                print(f"   - Price: {pricing_data.get('campaign_price_display')}")
            else:
                print("⚠️ Pricing campaign is inactive")
        
        campaigns_response = requests.get(f"{API_BASE}/public/active-campaigns")
        if campaigns_response.status_code == 200:
            campaigns_data = campaigns_response.json()
            campaigns = campaigns_data.get('campaigns', [])
            if campaigns:
                print(f"✅ {len(campaigns)} campaign banners should be visible")
                for campaign in campaigns:
                    print(f"   - {campaign.get('title')}")
            else:
                print("⚠️ No active campaigns")
                
    except Exception as e:
        print(f"❌ Error testing frontend display: {e}")

def verify_banner_activation():
    """Verify that banners are properly activated"""
    
    print("\n✅ Verifying Banner Activation")
    print("=" * 50)
    
    # Wait a moment for activation to take effect
    time.sleep(2)
    
    # Check sale offer
    try:
        response = requests.get(f"{API_BASE}/public/sale-offer")
        if response.status_code == 200:
            data = response.json()
            if data.get('enabled'):
                print("✅ Sale Offer Banner: ACTIVE")
                print(f"   🎯 Title: {data.get('title')}")
                print(f"   💰 Price: ₹{data.get('original_price')} → ₹{data.get('sale_price')}")
                print(f"   🎨 Design: {data.get('banner_design')}")
                print(f"   ⏰ Valid Until: {data.get('valid_until')}")
            else:
                print("❌ Sale Offer Banner: INACTIVE")
        
        # Check pricing campaign
        pricing_response = requests.get(f"{API_BASE}/public/pricing")
        if pricing_response.status_code == 200:
            pricing_data = pricing_response.json()
            if pricing_data.get('campaign_active'):
                print("✅ Pricing Campaign: ACTIVE")
                print(f"   🎯 Campaign: {pricing_data.get('campaign_name')}")
                print(f"   💰 Price: {pricing_data.get('regular_price_display')} → {pricing_data.get('campaign_price_display')}")
                print(f"   📊 Discount: {pricing_data.get('campaign_discount_percent')}%")
            else:
                print("❌ Pricing Campaign: INACTIVE")
                
    except Exception as e:
        print(f"❌ Error verifying activation: {e}")

def main():
    print("🧪 Promotional Banner & Inventory Pricing Test")
    print("=" * 60)
    
    # Test SuperAdmin login
    login_success = test_super_admin_login()
    
    if not login_success:
        print("\n❌ Cannot proceed without SuperAdmin access")
        return
    
    # Test promotional endpoints
    test_promotional_banner_endpoints()
    
    # Activate early adopter banner
    banner_activated = activate_early_adopter_banner()
    
    # Activate pricing campaign
    pricing_activated = activate_pricing_campaign()
    
    # Test inventory pricing updates
    inventory_success = test_inventory_pricing_update()
    
    # If no inventory items, create one
    if not inventory_success:
        test_item_id = create_test_inventory_item()
        if test_item_id:
            print(f"✅ Test item created with ID: {test_item_id}")
    
    # Test frontend banner display
    test_frontend_banner_display()
    
    # Verify activation
    if banner_activated or pricing_activated:
        verify_banner_activation()
    
    # Summary
    print("\n🎯 Test Summary")
    print("=" * 50)
    print(f"✅ SuperAdmin Login: {'Success' if login_success else 'Failed'}")
    print(f"✅ Banner Activation: {'Success' if banner_activated else 'Failed'}")
    print(f"✅ Pricing Campaign: {'Success' if pricing_activated else 'Failed'}")
    print(f"✅ Inventory Pricing: {'Success' if inventory_success else 'Failed'}")
    
    print("\n📱 Frontend Testing Steps:")
    print("1. Open your application in browser")
    print("2. Check landing page for promotional banners")
    print("3. Go to SuperAdmin → Promotions tab")
    print("4. Verify banner controls are working")
    print("5. Go to Inventory page")
    print("6. Test adding/editing items with pricing")
    print("7. Check that pricing updates reflect immediately")
    
    print("\n🔥 Expected Results:")
    if banner_activated:
        print("✅ Early Adopter banner should appear on landing page")
        print("   - Fire animation background")
        print("   - ₹999 → ₹9 pricing display")
        print("   - 99% OFF badge")
        print("   - Urgency text scrolling")
    
    if pricing_activated:
        print("✅ Pricing campaign should be active")
        print("   - SuperAdmin can manage campaigns")
        print("   - Pricing reflects in all components")
        print("   - Campaign end date tracking")
    
    print("\n🚀 Next Steps:")
    print("1. Test the frontend manually")
    print("2. Verify banners appear correctly")
    print("3. Test SuperAdmin promotional controls")
    print("4. Test inventory pricing changes")
    print("5. Monitor for any console errors")

if __name__ == "__main__":
    main()