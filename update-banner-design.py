#!/usr/bin/env python3
"""Update sale offer banner design to early-adopter"""

import requests

API_URL = "https://billbytekot.in/api"

# Update sale offer with early-adopter design
sale_offer_data = {
    "enabled": True,
    "theme": "early_adopter",
    "banner_design": "early-adopter",
    "title": "Early Adopter Special",
    "subtitle": "Limited Time Offer",
    "badge_text": "🚀 EARLY ADOPTER SPECIAL",
    "discount_percent": 5,
    "discount_text": "Save 5%",
    "original_price": 1999,
    "sale_price": 1899,
    "monthly_price": 159,
    "cta_text": "Get This Deal",
    "valid_until": "2026-01-31",
    "bg_color": "from-violet-600 via-purple-600 to-indigo-600"
}

print("Updating sale offer to early-adopter design...")

try:
    # Try updating via the sale-offer endpoint
    response = requests.put(f"{API_URL}/sale-offer", json=sale_offer_data)
    if response.status_code == 200:
        print("✅ Sale offer updated successfully!")
        print(response.json())
    else:
        print(f"PUT failed with {response.status_code}, trying POST...")
        response = requests.post(f"{API_URL}/sale-offer", json=sale_offer_data)
        if response.status_code in [200, 201]:
            print("✅ Sale offer created successfully!")
            print(response.json())
        else:
            print(f"❌ Failed: {response.status_code}")
            print(response.text)
except Exception as e:
    print(f"❌ Error: {e}")

# Verify the update
print("\nVerifying sale offer...")
try:
    response = requests.get(f"{API_URL}/sale-offer")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Current banner_design: {data.get('banner_design')}")
        print(f"   Theme: {data.get('theme')}")
        print(f"   Enabled: {data.get('enabled')}")
        print(f"   Monthly Price: ₹{data.get('monthly_price')}")
        print(f"   Sale Price: ₹{data.get('sale_price')}/year")
    else:
        print(f"❌ Could not verify: {response.status_code}")
except Exception as e:
    print(f"❌ Verification error: {e}")
