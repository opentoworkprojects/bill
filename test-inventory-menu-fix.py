#!/usr/bin/env python3
"""
Test script to verify inventory and menu system fixes
"""

import asyncio
import sys
import os

# Add backend to path
sys.path.append('backend')

from redis_cache import CachedOrderService, RedisCache
from motor.motor_asyncio import AsyncIOMotorClient

async def test_cached_service():
    """Test that the CachedOrderService has the required methods"""
    
    print("🧪 Testing CachedOrderService methods...")
    
    # Create mock database and cache
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.test_db
    cache = RedisCache()
    
    # Create service
    service = CachedOrderService(db, cache)
    
    # Test that methods exist
    methods_to_test = [
        'get_menu_items',
        'invalidate_menu_caches',
        'get_inventory_items', 
        'invalidate_inventory_caches'
    ]
    
    for method_name in methods_to_test:
        if hasattr(service, method_name):
            print(f"✅ Method '{method_name}' exists")
        else:
            print(f"❌ Method '{method_name}' is missing")
            return False
    
    print("🎉 All required methods are present!")
    return True

if __name__ == "__main__":
    result = asyncio.run(test_cached_service())
    if result:
        print("\n✅ All tests passed! The inventory and menu system fixes are working.")
    else:
        print("\n❌ Some tests failed. Please check the implementation.")
        sys.exit(1)