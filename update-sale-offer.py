#!/usr/bin/env python3
"""
Script to update the sale offer in the database with Early Adopter settings.
This will set up the sale offer with:
- 5% discount
- Original price: ₹1999
- Sale price: ₹1899 (5% off)
- End date: January 31, 2026
- Theme: early_adopter
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import os

# MongoDB connection
MONGO_URL = os.getenv(
    "MONGO_URL",
    "mongodb+srv://shivshankarkumar281_db_user:RNdGNCCyBtj1d5Ar@retsro-ai.un0np9m.mongodb.net/?retryWrites=true&w=majority"
)

async def update_sale_offer():
    print("🔄 Connecting to MongoDB...")
    
    try:
        client = AsyncIOMotorClient(
            MONGO_URL,
            tls=True,
            tlsInsecure=True,
            serverSelectionTimeoutMS=10000
        )
        db = client["restrobill"]
        
        # Test connection
        await client.admin.command('ping')
        print("✅ Connected to MongoDB")
        
        # Early Adopter sale offer configuration - 5% OFF
        sale_offer = {
            "enabled": True,
            "title": "🚀 Early Adopter Special",
            "subtitle": "Be among the first to experience BillByteKOT!",
            "discount_text": "5% OFF",
            "badge_text": "🔥 EARLY ADOPTER SPECIAL",
            "bg_color": "from-orange-500 to-red-500",
            "theme": "early_adopter",
            "banner_design": "early-adopter",
            "discount_percent": 5,
            "original_price": 1999,
            "sale_price": 1899,
            "cta_text": "Grab This Deal Now!",
            "urgency_text": "⚡ Limited early adopter slots available!",
            "end_date": "2026-01-31",
            "valid_until": "2026-01-31T23:59:59+00:00",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        print("\n📝 Sale Offer Configuration:")
        print(f"   Theme: {sale_offer['theme']}")
        print(f"   Discount: {sale_offer['discount_percent']}%")
        print(f"   Original Price: ₹{sale_offer['original_price']}")
        print(f"   Sale Price: ₹{sale_offer['sale_price']}")
        print(f"   End Date: {sale_offer['end_date']}")
        print(f"   Enabled: {sale_offer['enabled']}")
        
        # Update in sale_offers collection (new)
        print("\n🔄 Updating sale_offers collection...")
        result1 = await db.sale_offers.replace_one(
            {},
            sale_offer,
            upsert=True
        )
        print(f"   ✅ sale_offers: {'Updated' if result1.modified_count else 'Inserted'}")
        
        # Also update in site_settings collection (legacy) for backwards compatibility
        print("🔄 Updating site_settings collection...")
        legacy_offer = {**sale_offer, "type": "sale_offer"}
        result2 = await db.site_settings.replace_one(
            {"type": "sale_offer"},
            legacy_offer,
            upsert=True
        )
        print(f"   ✅ site_settings: {'Updated' if result2.modified_count else 'Inserted'}")
        
        # Verify the update
        print("\n🔍 Verifying updates...")
        
        # Check sale_offers
        saved_offer = await db.sale_offers.find_one({}, {"_id": 0})
        if saved_offer:
            print(f"   sale_offers: enabled={saved_offer.get('enabled')}, theme={saved_offer.get('theme')}, price=₹{saved_offer.get('sale_price')}")
        
        # Check site_settings
        saved_legacy = await db.site_settings.find_one({"type": "sale_offer"}, {"_id": 0})
        if saved_legacy:
            print(f"   site_settings: enabled={saved_legacy.get('enabled')}, theme={saved_legacy.get('theme')}, price=₹{saved_legacy.get('sale_price')}")
        
        print("\n✅ Sale offer updated successfully!")
        print("   The Early Adopter offer is now LIVE until January 31, 2026")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(update_sale_offer())
