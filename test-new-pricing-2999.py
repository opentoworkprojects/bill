#!/usr/bin/env python3
"""
Test script for new ₹2999 pricing with early adopter benefits
"""

import asyncio
import httpx
import json
from datetime import datetime

# Configuration
BACKEND_URL = "https://restro-ai.onrender.com"

async def test_pricing_endpoints():
    """Test all pricing-related endpoints"""
    print("🧪 Testing New ₹2999 Pricing Strategy")
    print("=" * 50)
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            # Test 1: Public pricing endpoint
            print("\n1️⃣ Testing Public Pricing Endpoint...")
            pricing_response = await client.get(f"{BACKEND_URL}/api/public/pricing")
            
            if pricing_response.status_code == 200:
                pricing_data = pricing_response.json()
                print(f"✅ Pricing endpoint working")
                print(f"   Regular Price: {pricing_data.get('regular_price_display', 'N/A')}")
                print(f"   Campaign Price: {pricing_data.get('campaign_price_display', 'N/A')}")
                print(f"   Campaign Active: {pricing_data.get('campaign_active', False)}")
                print(f"   Early Adopter: {pricing_data.get('early_adopter', False)}")
                print(f"   Spots Left: {pricing_data.get('early_adopter_spots_left', 'N/A')}")
                
                if pricing_data.get('early_adopter'):
                    print(f"   🎉 Early Adopter Pricing Active!")
                    print(f"   💰 Savings: ₹{pricing_data.get('early_adopter_savings', 0)}")
                    print(f"   ⏰ Urgency: {pricing_data.get('urgency_message', 'N/A')}")
            else:
                print(f"❌ Pricing endpoint failed: {pricing_response.status_code}")
                print(f"   Response: {pricing_response.text}")
            
            # Test 2: Subscription pricing endpoint
            print("\n2️⃣ Testing Subscription Pricing Endpoint...")
            sub_pricing_response = await client.get(f"{BACKEND_URL}/api/subscription/pricing")
            
            if sub_pricing_response.status_code == 200:
                sub_data = sub_pricing_response.json()
                print(f"✅ Subscription pricing working")
                print(f"   Price Display: {sub_data.get('price_display', 'N/A')}")
                print(f"   Original Price: {sub_data.get('original_price_display', 'N/A')}")
                print(f"   Discount: {sub_data.get('discount_percent', 0)}%")
                print(f"   Campaign: {sub_data.get('campaign_name', 'None')}")
            else:
                print(f"❌ Subscription pricing failed: {sub_pricing_response.status_code}")
            
            # Test 3: Check if early adopter logic is working
            print("\n3️⃣ Testing Early Adopter Logic...")
            
            # Expected values
            expected_regular = 2999
            expected_early_adopter = 2549
            expected_discount = 15
            
            if pricing_data.get('regular_price') == expected_regular:
                print(f"✅ Regular price correct: ₹{expected_regular}")
            else:
                print(f"❌ Regular price incorrect: expected ₹{expected_regular}, got ₹{pricing_data.get('regular_price')}")
            
            if pricing_data.get('early_adopter') and pricing_data.get('campaign_price'):
                actual_early_price = pricing_data.get('campaign_price')
                if abs(actual_early_price - expected_early_adopter) < 1:  # Allow small rounding differences
                    print(f"✅ Early adopter price correct: ₹{actual_early_price}")
                else:
                    print(f"❌ Early adopter price incorrect: expected ₹{expected_early_adopter}, got ₹{actual_early_price}")
            
            # Test 4: Validate pricing calculations
            print("\n4️⃣ Testing Pricing Calculations...")
            
            if pricing_data.get('early_adopter'):
                regular = pricing_data.get('regular_price', 0)
                campaign = pricing_data.get('campaign_price', 0)
                discount_percent = pricing_data.get('campaign_discount_percent', 0)
                
                expected_campaign = regular * (1 - discount_percent / 100)
                
                if abs(campaign - expected_campaign) < 1:
                    print(f"✅ Discount calculation correct: {discount_percent}% off ₹{regular} = ₹{campaign}")
                else:
                    print(f"❌ Discount calculation incorrect: expected ₹{expected_campaign}, got ₹{campaign}")
            
            # Test 5: Check urgency messaging
            print("\n5️⃣ Testing Urgency Messaging...")
            
            if pricing_data.get('urgency_message'):
                print(f"✅ Urgency message present: {pricing_data.get('urgency_message')}")
            else:
                print(f"⚠️ No urgency message found")
            
            if pricing_data.get('badge_text'):
                print(f"✅ Badge text present: {pricing_data.get('badge_text')}")
            else:
                print(f"⚠️ No badge text found")
            
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
            import traceback
            traceback.print_exc()

def print_pricing_summary():
    """Print summary of new pricing strategy"""
    print("\n💰 NEW PRICING STRATEGY SUMMARY")
    print("=" * 40)
    print()
    print("🎯 Base Pricing:")
    print("   • Regular Price: ₹2999/year (₹250/month)")
    print("   • Early Adopter: ₹2549/year (₹212/month)")
    print("   • Savings: ₹450/year (15% OFF)")
    print()
    print("🚀 Early Adopter Benefits:")
    print("   • Limited to first 1000 users")
    print("   • Valid until March 31, 2026")
    print("   • Exclusive 'EARLY ADOPTER' badge")
    print("   • Priority support access")
    print("   • Lifetime discount (as long as subscribed)")
    print()
    print("📊 Revenue Optimization:")
    print("   • Psychological pricing (under ₹3000)")
    print("   • Scarcity marketing (limited spots)")
    print("   • Urgency messaging (countdown timer)")
    print("   • Value stacking (₹8.33/day)")
    print()
    print("🎨 UI/UX Enhancements:")
    print("   • Early adopter banner with gradient design")
    print("   • Real-time spots counter")
    print("   • Countdown timer")
    print("   • Enhanced pricing page")
    print()
    print("📈 Expected Outcomes:")
    print("   • 1000+ early adopters in 6 months")
    print("   • ₹25L+ annual recurring revenue")
    print("   • 40%+ trial to paid conversion")
    print("   • Strong word-of-mouth marketing")

if __name__ == "__main__":
    print("🧪 BillByteKOT New Pricing Test Suite")
    print("=" * 50)
    
    # Run pricing tests
    asyncio.run(test_pricing_endpoints())
    
    # Print strategy summary
    print_pricing_summary()
    
    print("\n✅ Pricing strategy test completed!")
    print("\n🎉 Ready to launch ₹2999 pricing with early adopter benefits!")