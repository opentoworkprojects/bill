#!/usr/bin/env python3
"""
Test Redis Order Enhancements
Tests order consolidation, force refresh, and Redis caching enhancements
"""

import asyncio
import aiohttp
import json
import time
from datetime import datetime

# Test configuration
BASE_URL = "https://restro-ai.onrender.com/api"
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "test123"

class RedisOrderEnhancementTester:
    def __init__(self):
        self.session = None
        self.token = None
        self.user_data = None
        self.test_table_id = None
        self.test_menu_items = []
        
    async def setup(self):
        """Setup test session and authentication"""
        self.session = aiohttp.ClientSession()
        
        # Login to get token
        login_data = {
            "username": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
        
        async with self.session.post(f"{BASE_URL}/auth/login", json=login_data) as response:
            if response.status == 200:
                data = await response.json()
                self.token = data["access_token"]
                self.user_data = data["user"]
                print(f"✅ Logged in as {self.user_data['email']}")
            else:
                print(f"❌ Login failed: {response.status}")
                return False
        
        # Get headers with auth
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        # Get test data
        await self.get_test_data()
        return True
    
    async def get_test_data(self):
        """Get tables and menu items for testing"""
        try:
            # Get tables
            async with self.session.get(f"{BASE_URL}/tables", headers=self.headers) as response:
                if response.status == 200:
                    tables = await response.json()
                    if tables:
                        self.test_table_id = tables[0]["id"]
                        print(f"✅ Using test table: {tables[0]['table_number']}")
            
            # Get menu items
            async with self.session.get(f"{BASE_URL}/menu", headers=self.headers) as response:
                if response.status == 200:
                    menu_items = await response.json()
                    self.test_menu_items = menu_items[:3]  # Use first 3 items
                    print(f"✅ Got {len(self.test_menu_items)} test menu items")
                    
        except Exception as e:
            print(f"⚠️ Error getting test data: {e}")
    
    async def test_order_consolidation(self):
        """Test order consolidation when creating orders for same table"""
        print("\n🔄 Testing Order Consolidation...")
        
        if not self.test_table_id or not self.test_menu_items:
            print("❌ Missing test data for consolidation test")
            return False
        
        try:
            # Create first order
            order1_data = {
                "table_id": self.test_table_id,
                "table_number": 1,
                "items": [{
                    "menu_item_id": self.test_menu_items[0]["id"],
                    "name": self.test_menu_items[0]["name"],
                    "price": self.test_menu_items[0]["price"],
                    "quantity": 2,
                    "notes": "First order"
                }],
                "customer_name": "Test Customer",
                "customer_phone": "+91 9876543210"
            }
            
            start_time = time.time()
            async with self.session.post(f"{BASE_URL}/orders", json=order1_data, headers=self.headers) as response:
                response_time_1 = (time.time() - start_time) * 1000
                if response.status == 200:
                    order1 = await response.json()
                    print(f"✅ First order created: {order1['id'][:8]} ({response_time_1:.0f}ms)")
                else:
                    print(f"❌ First order failed: {response.status}")
                    return False
            
            # Wait a moment
            await asyncio.sleep(1)
            
            # Create second order for same table (should consolidate)
            order2_data = {
                "table_id": self.test_table_id,
                "table_number": 1,
                "items": [{
                    "menu_item_id": self.test_menu_items[1]["id"],
                    "name": self.test_menu_items[1]["name"],
                    "price": self.test_menu_items[1]["price"],
                    "quantity": 1,
                    "notes": "Second order - should consolidate"
                }],
                "customer_name": "Test Customer Updated",
                "customer_phone": "+91 9876543210"
            }
            
            start_time = time.time()
            async with self.session.post(f"{BASE_URL}/orders", json=order2_data, headers=self.headers) as response:
                response_time_2 = (time.time() - start_time) * 1000
                if response.status == 200:
                    order2 = await response.json()
                    print(f"✅ Second order processed: {order2['id'][:8]} ({response_time_2:.0f}ms)")
                    
                    # Check if consolidation happened
                    if order2.get("consolidated"):
                        print(f"🎉 Order consolidation SUCCESS: {order2.get('message', 'Items consolidated')}")
                        
                        # Verify consolidated order has both items
                        if len(order2.get("items", [])) >= 2:
                            print(f"✅ Consolidated order has {len(order2['items'])} items")
                        else:
                            print(f"⚠️ Expected 2+ items, got {len(order2.get('items', []))}")
                        
                        return True
                    else:
                        print(f"⚠️ No consolidation detected - created separate order")
                        return False
                else:
                    print(f"❌ Second order failed: {response.status}")
                    return False
                    
        except Exception as e:
            print(f"❌ Order consolidation test error: {e}")
            return False
    
    async def test_redis_caching_performance(self):
        """Test Redis caching performance improvements"""
        print("\n🚀 Testing Redis Caching Performance...")
        
        try:
            # Test orders endpoint performance
            print("Testing /orders endpoint...")
            times = []
            for i in range(3):
                start_time = time.time()
                async with self.session.get(f"{BASE_URL}/orders", headers=self.headers) as response:
                    response_time = (time.time() - start_time) * 1000
                    times.append(response_time)
                    if response.status == 200:
                        orders = await response.json()
                        print(f"  Request {i+1}: {response_time:.0f}ms ({len(orders)} orders)")
                    else:
                        print(f"  Request {i+1}: Failed ({response.status})")
                
                await asyncio.sleep(0.5)
            
            avg_time = sum(times) / len(times)
            print(f"📊 Orders endpoint average: {avg_time:.0f}ms")
            
            # Test menu endpoint performance
            print("Testing /menu endpoint...")
            times = []
            for i in range(3):
                start_time = time.time()
                async with self.session.get(f"{BASE_URL}/menu", headers=self.headers) as response:
                    response_time = (time.time() - start_time) * 1000
                    times.append(response_time)
                    if response.status == 200:
                        menu = await response.json()
                        print(f"  Request {i+1}: {response_time:.0f}ms ({len(menu)} items)")
                    else:
                        print(f"  Request {i+1}: Failed ({response.status})")
                
                await asyncio.sleep(0.5)
            
            avg_time = sum(times) / len(times)
            print(f"📊 Menu endpoint average: {avg_time:.0f}ms")
            
            # Test tables endpoint performance
            print("Testing /tables endpoint...")
            times = []
            for i in range(3):
                start_time = time.time()
                async with self.session.get(f"{BASE_URL}/tables", headers=self.headers) as response:
                    response_time = (time.time() - start_time) * 1000
                    times.append(response_time)
                    if response.status == 200:
                        tables = await response.json()
                        print(f"  Request {i+1}: {response_time:.0f}ms ({len(tables)} tables)")
                    else:
                        print(f"  Request {i+1}: Failed ({response.status})")
                
                await asyncio.sleep(0.5)
            
            avg_time = sum(times) / len(times)
            print(f"📊 Tables endpoint average: {avg_time:.0f}ms")
            
            return True
            
        except Exception as e:
            print(f"❌ Redis caching performance test error: {e}")
            return False
    
    async def test_force_refresh_functionality(self):
        """Test that force refresh works by checking data freshness"""
        print("\n🔄 Testing Force Refresh Functionality...")
        
        try:
            # Get initial orders
            async with self.session.get(f"{BASE_URL}/orders", headers=self.headers) as response:
                if response.status == 200:
                    initial_orders = await response.json()
                    print(f"✅ Initial fetch: {len(initial_orders)} orders")
                else:
                    print(f"❌ Initial fetch failed: {response.status}")
                    return False
            
            # Create a new order to test refresh
            if self.test_menu_items:
                new_order_data = {
                    "table_id": "counter",
                    "table_number": 0,
                    "items": [{
                        "menu_item_id": self.test_menu_items[0]["id"],
                        "name": self.test_menu_items[0]["name"],
                        "price": self.test_menu_items[0]["price"],
                        "quantity": 1,
                        "notes": "Force refresh test order"
                    }],
                    "customer_name": "Refresh Test",
                    "order_type": "takeaway"
                }
                
                async with self.session.post(f"{BASE_URL}/orders", json=new_order_data, headers=self.headers) as response:
                    if response.status == 200:
                        new_order = await response.json()
                        print(f"✅ Created test order: {new_order['id'][:8]}")
                    else:
                        print(f"❌ Test order creation failed: {response.status}")
                        return False
            
            # Fetch orders again (should include new order)
            async with self.session.get(f"{BASE_URL}/orders", headers=self.headers) as response:
                if response.status == 200:
                    refreshed_orders = await response.json()
                    print(f"✅ After refresh: {len(refreshed_orders)} orders")
                    
                    if len(refreshed_orders) > len(initial_orders):
                        print(f"🎉 Force refresh SUCCESS: New order detected")
                        return True
                    else:
                        print(f"⚠️ No new orders detected after refresh")
                        return False
                else:
                    print(f"❌ Refresh fetch failed: {response.status}")
                    return False
                    
        except Exception as e:
            print(f"❌ Force refresh test error: {e}")
            return False
    
    async def test_cache_invalidation(self):
        """Test that cache invalidation works when orders are updated"""
        print("\n🗑️ Testing Cache Invalidation...")
        
        try:
            # Get current orders
            async with self.session.get(f"{BASE_URL}/orders", headers=self.headers) as response:
                if response.status == 200:
                    orders = await response.json()
                    if not orders:
                        print("❌ No orders found for cache invalidation test")
                        return False
                    
                    test_order = orders[0]
                    print(f"✅ Testing with order: {test_order['id'][:8]}")
                else:
                    print(f"❌ Failed to get orders: {response.status}")
                    return False
            
            # Update order status to trigger cache invalidation
            original_status = test_order.get("status", "pending")
            new_status = "preparing" if original_status == "pending" else "ready"
            
            async with self.session.put(
                f"{BASE_URL}/orders/{test_order['id']}/status?status={new_status}",
                headers=self.headers
            ) as response:
                if response.status == 200:
                    print(f"✅ Updated order status: {original_status} → {new_status}")
                else:
                    print(f"❌ Status update failed: {response.status}")
                    return False
            
            # Fetch orders again to verify cache was invalidated
            async with self.session.get(f"{BASE_URL}/orders", headers=self.headers) as response:
                if response.status == 200:
                    updated_orders = await response.json()
                    
                    # Find the updated order
                    updated_order = next((o for o in updated_orders if o["id"] == test_order["id"]), None)
                    if updated_order and updated_order["status"] == new_status:
                        print(f"🎉 Cache invalidation SUCCESS: Status updated to {new_status}")
                        return True
                    else:
                        print(f"⚠️ Cache invalidation issue: Status not updated")
                        return False
                else:
                    print(f"❌ Failed to fetch updated orders: {response.status}")
                    return False
                    
        except Exception as e:
            print(f"❌ Cache invalidation test error: {e}")
            return False
    
    async def cleanup(self):
        """Cleanup test session"""
        if self.session:
            await self.session.close()
    
    async def run_all_tests(self):
        """Run all Redis order enhancement tests"""
        print("🧪 Starting Redis Order Enhancement Tests")
        print("=" * 50)
        
        if not await self.setup():
            print("❌ Setup failed")
            return
        
        results = {}
        
        # Test order consolidation
        results["consolidation"] = await self.test_order_consolidation()
        
        # Test Redis caching performance
        results["caching_performance"] = await self.test_redis_caching_performance()
        
        # Test force refresh functionality
        results["force_refresh"] = await self.test_force_refresh_functionality()
        
        # Test cache invalidation
        results["cache_invalidation"] = await self.test_cache_invalidation()
        
        # Summary
        print("\n" + "=" * 50)
        print("📊 TEST RESULTS SUMMARY")
        print("=" * 50)
        
        passed = 0
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{test_name.replace('_', ' ').title()}: {status}")
            if result:
                passed += 1
        
        print(f"\nOverall: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All Redis order enhancements working correctly!")
        else:
            print("⚠️ Some enhancements need attention")
        
        await self.cleanup()

async def main():
    """Main test function"""
    tester = RedisOrderEnhancementTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())