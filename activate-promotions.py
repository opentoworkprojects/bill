#!/usr/bin/env python3
"""
Script to activate promotional banners in SuperAdmin
"""

import requests
import json
from datetime import datetime, timedelta

# Configuration
API_BASE = "http://localhost:8000"  # Change to your server URL
SUPER_ADMIN_CREDENTIALS = {
    "username": "admin",  # Change to your admin username
    "password": "admin123"  # Change to your admin password
}

def activate_early_adopter_banner():
    """Activate the early adopter promotional banner"""
    
    # Calculate end date (30 days from now)
    end_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%dT23:59:59")
    
    # Sale offer configuration for early adopter banner
    sale_offer_data = {
        "enabled": True,
        "title": "Early Adopter Special",
        "subtitle": "Limited Time Offer",
        "badge_text": "🔥 EARLY ADOPTER SPECIAL",
        "banner_design": "early-adopter",
        "discount_percent": 99,
        "original_price": 999,
        "sale_price": 9,
        "discount_text": "99% OFF",
        "cta_text": "Grab ₹9 Deal NOW!",
        "urgency_text": "⚡ Limited slots available. Offer ends soon!",
        "valid_until": end_date,
        "end_date": end_date.split('T')[0],  # Just the date part
        "bg_color": "from-orange-500 via-red-500 to-yellow-500"
    }
    
    try:
        # Update sale offer
        response = requests.put(
            f"{API_BASE}/super-admin/sale-offer",
            json=sale_offer_data,
            params=SUPER_ADMIN_CREDENTIALS
        )
        
        if response.status_code == 200:
            print("✅ Early Adopter banner activated successfully!")
            print(f"   - 99% OFF: ₹999 → ₹9/year")
            print(f"   - Valid until: {end_date}")
            print(f"   - Design: early-adopter with fire animations")
        else:
            print(f"❌ Failed to activate banner: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error activating banner: {e}")

def activate_pricing_campaign():
    """Activate pricing campaign"""
    
    # Calculate campaign dates
    start_date = datetime.now().strftime("%Y-%m-%d")
    end_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
    
    # Pricing configuration
    pricing_data = {
        "regular_price": 1999,
        "regular_price_display": "₹1999",
        "campaign_price": 9,
        "campaign_price_display": "₹9",
        "campaign_active": True,
        "campaign_name": "Early Adopter Special",
        "campaign_discount_percent": 99,
        "campaign_start_date": start_date,
        "campaign_end_date": end_date,
        "trial_expired_discount": 10,
        "trial_days": 7,
        "subscription_months": 12
    }
    
    try:
        # Update pricing
        response = requests.put(
            f"{API_BASE}/super-admin/pricing",
            json=pricing_data,
            params=SUPER_ADMIN_CREDENTIALS
        )
        
        if response.status_code == 200:
            print("✅ Pricing campaign activated successfully!")
            print(f"   - Campaign: {pricing_data['campaign_name']}")
            print(f"   - Price: ₹1999 → ₹9 (99% OFF)")
            print(f"   - Duration: {start_date} to {end_date}")
        else:
            print(f"❌ Failed to activate pricing: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error activating pricing: {e}")

def check_promotional_status():
    """Check current promotional banner status"""
    
    try:
        # Check sale offer status
        response = requests.get(f"{API_BASE}/sale-offer")
        if response.status_code == 200:
            data = response.data if hasattr(response, 'data') else response.json()
            print("📊 Current Sale Offer Status:")
            print(f"   - Enabled: {data.get('enabled', False)}")
            print(f"   - Title: {data.get('title', 'Not set')}")
            print(f"   - Design: {data.get('banner_design', 'default')}")
            print(f"   - Price: ₹{data.get('original_price', 0)} → ₹{data.get('sale_price', 0)}")
        
        # Check pricing status
        response = requests.get(f"{API_BASE}/pricing")
        if response.status_code == 200:
            data = response.data if hasattr(response, 'data') else response.json()
            print("💰 Current Pricing Status:")
            print(f"   - Campaign Active: {data.get('campaign_active', False)}")
            print(f"   - Campaign Name: {data.get('campaign_name', 'Not set')}")
            print(f"   - Price: ₹{data.get('regular_price', 0)} → ₹{data.get('campaign_price', 0)}")
            
    except Exception as e:
        print(f"❌ Error checking status: {e}")

if __name__ == "__main__":
    print("🎯 Activating Promotional Banners...")
    print("=" * 50)
    
    # Check current status
    print("1. Checking current status...")
    check_promotional_status()
    print()
    
    # Activate early adopter banner
    print("2. Activating Early Adopter Banner...")
    activate_early_adopter_banner()
    print()
    
    # Activate pricing campaign
    print("3. Activating Pricing Campaign...")
    activate_pricing_campaign()
    print()
    
    print("🎉 Promotional activation complete!")
    print()
    print("📱 How to see the banners:")
    print("   1. Go to SuperAdmin → Promotions tab")
    print("   2. Check Landing Page for top banner")
    print("   3. Visit any page to see promotional content")
    print()
    print("🔥 Early Adopter Banner Features:")
    print("   - Animated fire background")
    print("   - Glowing orbs and sparkles")
    print("   - MEGA ₹9/year price display")
    print("   - Scrolling urgency text")
    print("   - Professional CTA button")