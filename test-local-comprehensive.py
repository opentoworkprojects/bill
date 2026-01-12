#!/usr/bin/env python3
"""
Comprehensive local testing script for inventory and menu system fixes
"""

import asyncio
import aiohttp
import json
import sys
import time
from datetime import datetime

# Test configuration
BASE_URL = "http://localhost:8000/api"
TEST_USER_TOKEN = None  # Will be set after login

class LocalTester:
    def __init__(self):
        self.session = None
        self.headers = {}
        self.test_results = []
        
    async def setup(self):
        """Setup test session"""
        self.session = aiohttp.ClientSession()
        print("🚀 Starting local testing...")
        
    async def cleanup(self):
        """Cleanup test session"""
        if self.session:
            await self.session.close()
            
    def log_result(self, test_name, success, message="", data=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        self.test_results.append({
            "test": test_name,
            "success": success,
            "message": message,
            "data": data,
            "timestamp": datetime.now().isoformat()
        })
        
    async def test_server_health(self):
        """Test if server is running"""
        try:
            async with self.session.get("http://localhost:8000/") as response:
                if response.status == 200:
                    self.log_result("Server Health", True, "Server is running")
                    return True
                else:
                    self.log_result("Server Health", False, f"Server returned {response.status}")
                    return False
        except Exception as e:
            self.log_result("Server Health", False, f"Server not accessible: {e}")
            return False
            
    async def test_login(self, username="admin", password="admin123"):
        """Test login and get auth token"""
        try:
            login_data = {
                "username": username,
                "password": password
            }
            
            async with self.session.post(f"{BASE_URL}/auth/login", json=login_data) as response:
                if response.status == 200:
                    data = await response.json()
                    token = data.get("access_token")
                    if token:
                        self.headers["Authorization"] = f"Bearer {token}"
                        self.log_result("Login", True, f"Successfully logged in as {username}")
                        return True
                    else:
                        self.log_result("Login", False, "No token in response")
                        return False
                else:
                    error_data = await response.text()
                    self.log_result("Login", False, f"Login failed: {response.status} - {error_data}")
                    return False
        except Exception as e:
            self.log_result("Login", False, f"Login error: {e}")
            return False
            
    async def test_menu_fetch(self):
        """Test menu items fetching"""
        try:
            async with self.session.get(f"{BASE_URL}/menu", headers=self.headers) as response:
                if response.status == 200:
                    data = await response.json()
                    menu_count = len(data) if isinstance(data, list) else 0
                    self.log_result("Menu Fetch", True, f"Retrieved {menu_count} menu items", {"count": menu_count})
                    return data
                else:
                    error_data = await response.text()
                    self.log_result("Menu Fetch", False, f"Failed: {response.status} - {error_data}")
                    return []
        except Exception as e:
            self.log_result("Menu Fetch", False, f"Error: {e}")
            return []
            
    async def test_inventory_fetch(self):
        """Test inventory items fetching"""
        try:
            async with self.session.get(f"{BASE_URL}/inventory", headers=self.headers) as response:
                if response.status == 200:
                    data = await response.json()
                    inventory_count = len(data) if isinstance(data, list) else 0
                    self.log_result("Inventory Fetch", True, f"Retrieved {inventory_count} inventory items", {"count": inventory_count})
                    return data
                else:
                    error_data = await response.text()
                    self.log_result("Inventory Fetch", False, f"Failed: {response.status} - {error_data}")
                    return []
        except Exception as e:
            self.log_result("Inventory Fetch", False, f"Error: {e}")
            return []
            
    async def test_inventory_create(self):
        """Test creating a new inventory item"""
        try:
            test_item = {
                "name": f"Test Item {int(time.time())}",
                "quantity": 100.0,
                "unit": "pieces",
                "min_quantity": 10.0,
                "price_per_unit": 25.50,
                "description": "Test inventory item created by automated test"
            }
            
            async with self.session.post(f"{BASE_URL}/inventory", json=test_item, headers=self.headers) as response:
                if response.status == 200:
                    data = await response.json()
                    item_id = data.get("id")
                    self.log_result("Inventory Create", True, f"Created item with ID: {item_id}", {"item_id": item_id})
                    return item_id
                else:
                    error_data = await response.text()
                    self.log_result("Inventory Create", False, f"Failed: {response.status} - {error_data}")
                    return None
        except Exception as e:
            self.log_result("Inventory Create", False, f"Error: {e}")
            return None
            
    async def test_menu_create(self):
        """Test creating a new menu item"""
        try:
            test_item = {
                "name": f"Test Menu Item {int(time.time())}",
                "category": "Test Category",
                "price": 15.99,
                "description": "Test menu item created by automated test",
                "available": True
            }
            
            async with self.session.post(f"{BASE_URL}/menu", json=test_item, headers=self.headers) as response:
                if response.status == 200:
                    data = await response.json()
                    item_id = data.get("id")
                    self.log_result("Menu Create", True, f"Created menu item with ID: {item_id}", {"item_id": item_id})
                    return item_id
                else:
                    error_data = await response.text()
                    self.log_result("Menu Create", False, f"Failed: {response.status} - {error_data}")
                    return None
        except Exception as e:
            self.log_result("Menu Create", False, f"Error: {e}")
            return None
            
    async def test_cache_performance(self):
        """Test caching performance by making multiple requests"""
        try:
            print("🔄 Testing cache performance...")
            
            # First request (cache miss)
            start_time = time.time()
            await self.test_menu_fetch()
            first_request_time = time.time() - start_time
            
            # Second request (should be cached)
            start_time = time.time()
            await self.test_menu_fetch()
            second_request_time = time.time() - start_time
            
            # Third request (should still be cached)
            start_time = time.time()
            await self.test_inventory_fetch()
            third_request_time = time.time() - start_time
            
            performance_data = {
                "first_menu_request": first_request_time,
                "second_menu_request": second_request_time,
                "inventory_request": third_request_time
            }
            
            if second_request_time < first_request_time:
                self.log_result("Cache Performance", True, 
                              f"Cache working - 2nd request faster ({second_request_time:.3f}s vs {first_request_time:.3f}s)", 
                              performance_data)
            else:
                self.log_result("Cache Performance", False, 
                              f"Cache may not be working - times: {first_request_time:.3f}s, {second_request_time:.3f}s", 
                              performance_data)
                              
        except Exception as e:
            self.log_result("Cache Performance", False, f"Error: {e}")
            
    async def test_error_handling(self):
        """Test error handling for invalid requests"""
        try:
            # Test invalid inventory item
            invalid_item = {"name": ""}  # Missing required fields
            
            async with self.session.post(f"{BASE_URL}/inventory", json=invalid_item, headers=self.headers) as response:
                if response.status in [400, 422]:  # Expected error codes
                    self.log_result("Error Handling", True, f"Properly rejected invalid data with status {response.status}")
                else:
                    self.log_result("Error Handling", False, f"Unexpected status for invalid data: {response.status}")
                    
        except Exception as e:
            self.log_result("Error Handling", False, f"Error: {e}")
            
    async def run_all_tests(self):
        """Run all tests"""
        await self.setup()
        
        try:
            # Basic connectivity
            if not await self.test_server_health():
                print("❌ Server is not running. Please start the backend server first.")
                return False
                
            # Authentication
            if not await self.test_login():
                print("❌ Login failed. Please check credentials or user setup.")
                return False
                
            # Core functionality tests
            await self.test_menu_fetch()
            await self.test_inventory_fetch()
            
            # Create operations
            await self.test_inventory_create()
            await self.test_menu_create()
            
            # Performance and caching
            await self.test_cache_performance()
            
            # Error handling
            await self.test_error_handling()
            
            # Summary
            self.print_summary()
            
        finally:
            await self.cleanup()
            
    def print_summary(self):
        """Print test summary"""
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print("\n" + "="*60)
        print("🧪 TEST SUMMARY")
        print("="*60)
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['message']}")
                    
        print("\n" + "="*60)
        
        return failed_tests == 0

async def main():
    """Main test function"""
    print("🧪 Local Testing for Inventory & Menu System Fixes")
    print("="*60)
    
    tester = LocalTester()
    success = await tester.run_all_tests()
    
    if success:
        print("🎉 All tests passed! The fixes are working correctly.")
        sys.exit(0)
    else:
        print("⚠️  Some tests failed. Please check the issues above.")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())