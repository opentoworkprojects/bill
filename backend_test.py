import requests
import sys
import json
from datetime import datetime
import time

class RestaurantAPITester:
    def __init__(self, base_url="https://resto-bill-hub.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.critical_failures = []
        self.created_items = {
            'users': [],
            'menu_items': [],
            'tables': [],
            'orders': [],
            'inventory': []
        }
        # For multi-tenancy testing
        self.business1_token = None
        self.business2_token = None
        self.business1_user = None
        self.business2_user = None

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None, token=None, critical=False):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        # Use provided token or default token
        auth_token = token or self.token
        if auth_token:
            headers['Authorization'] = f'Bearer {auth_token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                error_msg = f"❌ Failed - Expected {expected_status}, got {response.status_code}"
                print(error_msg)
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                    if critical:
                        self.critical_failures.append(f"{name}: {error_detail}")
                except:
                    print(f"   Response: {response.text}")
                    if critical:
                        self.critical_failures.append(f"{name}: Status {response.status_code}")
                return False, {}

        except Exception as e:
            error_msg = f"❌ Failed - Error: {str(e)}"
            print(error_msg)
            if critical:
                self.critical_failures.append(f"{name}: {str(e)}")
            return False, {}

    def test_user_registration(self, business_name="testbusiness"):
        """Test user registration"""
        timestamp = int(time.time())
        user_data = {
            "username": f"{business_name}_{timestamp}",
            "email": f"{business_name}_{timestamp}@example.com",
            "password": "TestPass123!",
            "role": "admin"
        }
        
        success, response = self.run_test(
            f"User Registration ({business_name})",
            "POST",
            "auth/register",
            200,
            data=user_data,
            critical=True
        )
        
        if success and 'id' in response:
            self.created_items['users'].append(response['id'])
            return user_data, response
        return None, None

    def test_user_login(self, username, password, business_name=""):
        """Test user login and get token"""
        success, response = self.run_test(
            f"User Login ({business_name})" if business_name else "User Login",
            "POST",
            "auth/login",
            200,
            data={"username": username, "password": password},
            critical=True
        )
        
        if success and 'token' in response:
            return response['token'], response['user']
        return None, None

    def test_get_current_user(self):
        """Test getting current user info"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_menu_operations(self):
        """Test menu CRUD operations"""
        # Create menu item
        menu_data = {
            "name": "Test Burger",
            "category": "Main Course",
            "price": 299.99,
            "description": "Delicious test burger",
            "available": True,
            "preparation_time": 20
        }
        
        success, response = self.run_test(
            "Create Menu Item",
            "POST",
            "menu",
            200,
            data=menu_data
        )
        
        menu_id = None
        if success and 'id' in response:
            menu_id = response['id']
            self.created_items['menu_items'].append(menu_id)
        
        # Get all menu items
        self.run_test(
            "Get Menu Items",
            "GET",
            "menu",
            200
        )
        
        # Get specific menu item
        if menu_id:
            self.run_test(
                "Get Menu Item by ID",
                "GET",
                f"menu/{menu_id}",
                200
            )
            
            # Update menu item
            update_data = {**menu_data, "price": 349.99}
            self.run_test(
                "Update Menu Item",
                "PUT",
                f"menu/{menu_id}",
                200,
                data=update_data
            )
        
        return menu_id

    def test_table_operations(self):
        """Test table CRUD operations"""
        # Create table
        table_data = {
            "table_number": 99,
            "capacity": 4,
            "status": "available"
        }
        
        success, response = self.run_test(
            "Create Table",
            "POST",
            "tables",
            200,
            data=table_data
        )
        
        table_id = None
        if success and 'id' in response:
            table_id = response['id']
            self.created_items['tables'].append(table_id)
        
        # Get all tables
        self.run_test(
            "Get Tables",
            "GET",
            "tables",
            200
        )
        
        return table_id

    def test_order_operations(self, table_id, menu_id):
        """Test order CRUD operations"""
        if not table_id or not menu_id:
            print("⚠️  Skipping order tests - missing table or menu item")
            return None
            
        # Create order
        order_data = {
            "table_id": table_id,
            "table_number": 99,
            "items": [
                {
                    "menu_item_id": menu_id,
                    "name": "Test Burger",
                    "quantity": 2,
                    "price": 299.99,
                    "notes": "Extra cheese"
                }
            ],
            "customer_name": "Test Customer"
        }
        
        success, response = self.run_test(
            "Create Order",
            "POST",
            "orders",
            200,
            data=order_data
        )
        
        order_id = None
        if success and 'id' in response:
            order_id = response['id']
            self.created_items['orders'].append(order_id)
        
        # Get all orders
        self.run_test(
            "Get Orders",
            "GET",
            "orders",
            200
        )
        
        # Get specific order
        if order_id:
            self.run_test(
                "Get Order by ID",
                "GET",
                f"orders/{order_id}",
                200
            )
            
            # Update order status
            self.run_test(
                "Update Order Status",
                "PUT",
                f"orders/{order_id}/status",
                200,
                params={"status": "preparing"}
            )
        
        return order_id

    def test_payment_operations(self, order_id):
        """Test payment operations"""
        if not order_id:
            print("⚠️  Skipping payment tests - missing order")
            return
            
        # Test cash payment
        payment_data = {
            "order_id": order_id,
            "amount": 629.98,  # 2 * 299.99 + tax
            "payment_method": "cash"
        }
        
        self.run_test(
            "Create Cash Payment",
            "POST",
            "payments/create-order",
            200,
            data=payment_data
        )
        
        # Test Razorpay payment creation (will fail with test keys but should return proper error)
        razorpay_data = {
            "order_id": order_id,
            "amount": 629.98,
            "payment_method": "razorpay"
        }
        
        success, response = self.run_test(
            "Create Razorpay Payment",
            "POST",
            "payments/create-order",
            200,
            data=razorpay_data
        )
        
        # Get payments
        self.run_test(
            "Get Payments",
            "GET",
            "payments",
            200
        )

    def test_inventory_operations(self):
        """Test inventory CRUD operations"""
        # Create inventory item
        inventory_data = {
            "name": "Test Ingredient",
            "quantity": 100.0,
            "unit": "kg",
            "min_quantity": 10.0,
            "price_per_unit": 50.0
        }
        
        success, response = self.run_test(
            "Create Inventory Item",
            "POST",
            "inventory",
            200,
            data=inventory_data
        )
        
        inventory_id = None
        if success and 'id' in response:
            inventory_id = response['id']
            self.created_items['inventory'].append(inventory_id)
        
        # Get all inventory
        self.run_test(
            "Get Inventory",
            "GET",
            "inventory",
            200
        )
        
        # Get low stock items
        self.run_test(
            "Get Low Stock Items",
            "GET",
            "inventory/low-stock",
            200
        )
        
        return inventory_id

    def test_ai_features(self):
        """Test AI-powered features"""
        # Test AI chat
        chat_data = {
            "message": "What are your popular menu items?"
        }
        
        print("\n🤖 Testing AI Chat (may take a few seconds)...")
        success, response = self.run_test(
            "AI Chat",
            "POST",
            "ai/chat",
            200,
            data=chat_data
        )
        
        if success and 'response' in response:
            print(f"   AI Response: {response['response'][:100]}...")
        
        # Test AI recommendations
        print("\n🤖 Testing AI Recommendations (may take a few seconds)...")
        self.run_test(
            "AI Recommendations",
            "POST",
            "ai/recommendations",
            200
        )
        
        # Test sales forecast
        print("\n🤖 Testing AI Sales Forecast (may take a few seconds)...")
        self.run_test(
            "AI Sales Forecast",
            "POST",
            "ai/sales-forecast",
            200
        )

    def test_reports(self):
        """Test reporting features"""
        # Daily report
        self.run_test(
            "Daily Report",
            "GET",
            "reports/daily",
            200
        )
        
        # Export report
        today = datetime.now().strftime('%Y-%m-%d')
        yesterday = datetime.now().replace(day=datetime.now().day-1).strftime('%Y-%m-%d')
        
        self.run_test(
            "Export Report",
            "GET",
            "reports/export",
            200,
            params={"start_date": yesterday, "end_date": today}
        )

    def test_print_functionality(self):
        """Test thermal printer functionality"""
        print_data = {
            "content": "Test receipt content\nItem 1: $10.00\nTotal: $10.00",
            "type": "bill"
        }
        
        self.run_test(
            "Print Receipt",
            "POST",
            "print",
            200,
            data=print_data
        )

def main():
    print("🏪 Starting Restaurant Billing API Tests...")
    print("=" * 50)
    
    tester = RestaurantAPITester()
    
    # Test user registration and authentication
    print("\n📝 Testing Authentication...")
    user_data = tester.test_user_registration()
    if not user_data:
        print("❌ Registration failed, stopping tests")
        return 1
    
    if not tester.test_user_login(user_data['username'], user_data['password']):
        print("❌ Login failed, stopping tests")
        return 1
    
    tester.test_get_current_user()
    
    # Test core functionality
    print("\n🍽️  Testing Menu Management...")
    menu_id = tester.test_menu_operations()
    
    print("\n🪑 Testing Table Management...")
    table_id = tester.test_table_operations()
    
    print("\n📋 Testing Order Management...")
    order_id = tester.test_order_operations(table_id, menu_id)
    
    print("\n💳 Testing Payment Processing...")
    tester.test_payment_operations(order_id)
    
    print("\n📦 Testing Inventory Management...")
    tester.test_inventory_operations()
    
    print("\n🤖 Testing AI Features...")
    tester.test_ai_features()
    
    print("\n📊 Testing Reports...")
    tester.test_reports()
    
    print("\n🖨️  Testing Print Functionality...")
    tester.test_print_functionality()
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    print(f"✅ Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed! Backend is working correctly.")
        return 0
    else:
        print("⚠️  Some tests failed. Check the output above for details.")
        return 1

if __name__ == "__main__":
    sys.exit(main())