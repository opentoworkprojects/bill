import requests
import sys
import json
from datetime import datetime
import time

class RestaurantAPITester:
    def __init__(self, base_url="http://localhost:5000/api"):
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

    def test_multi_tenancy_data_isolation(self):
        """CRITICAL TEST: Test multi-tenancy data isolation between businesses"""
        print("\n" + "="*60)
        print("🔒 CRITICAL TEST: Multi-Tenancy Data Isolation")
        print("="*60)

        # Step 1: Register two separate businesses
        print("\n📝 Step 1: Registering two separate businesses...")

        business1_data, business1_user = self.test_user_registration("restaurant_alpha")
        if not business1_data:
            self.critical_failures.append("Failed to register Business 1")
            return False

        business2_data, business2_user = self.test_user_registration("restaurant_beta")
        if not business2_data:
            self.critical_failures.append("Failed to register Business 2")
            return False

        # Step 2: Login both businesses
        print("\n🔑 Step 2: Logging in both businesses...")

        self.business1_token, self.business1_user = self.test_user_login(
            business1_data['username'], business1_data['password'], "Business 1"
        )
        if not self.business1_token:
            self.critical_failures.append("Failed to login Business 1")
            return False

        self.business2_token, self.business2_user = self.test_user_login(
            business2_data['username'], business2_data['password'], "Business 2"
        )
        if not self.business2_token:
            self.critical_failures.append("Failed to login Business 2")
            return False

        print(f"✅ Business 1 ID: {self.business1_user['id']}")
        print(f"✅ Business 2 ID: {self.business2_user['id']}")

        # Step 3: Setup business settings for both
        print("\n🏢 Step 3: Setting up business configurations...")
        self.test_business_setup_isolation()

        # Step 4: Create staff for both businesses
        print("\n👥 Step 4: Testing staff isolation...")
        self.test_staff_isolation()

        # Step 5: Create menu items for both businesses
        print("\n🍽️ Step 5: Testing menu isolation...")
        menu1_id, menu2_id = self.test_menu_isolation()

        # Step 6: Create tables for both businesses
        print("\n🪑 Step 6: Testing table isolation...")
        table1_id, table2_id = self.test_table_isolation()

        # Step 7: Create orders for both businesses
        print("\n📋 Step 7: Testing order isolation...")
        self.test_order_isolation(table1_id, menu1_id, table2_id, menu2_id)

        # Step 8: Create inventory for both businesses
        print("\n📦 Step 8: Testing inventory isolation...")
        self.test_inventory_isolation()

        # Step 9: Verify cross-business data access is blocked
        print("\n🚫 Step 9: Verifying cross-business access is blocked...")
        self.test_cross_business_access_blocked(menu1_id, menu2_id, table1_id, table2_id)

        return len(self.critical_failures) == 0

    def test_business_setup_isolation(self):
        """Test business setup isolation"""
        business1_settings = {
            "restaurant_name": "Alpha Restaurant",
            "address": "123 Alpha Street",
            "phone": "+1-555-0001",
            "email": "alpha@restaurant.com",
            "currency": "USD",
            "tax_rate": 8.5
        }

        business2_settings = {
            "restaurant_name": "Beta Bistro",
            "address": "456 Beta Avenue",
            "phone": "+1-555-0002",
            "email": "beta@bistro.com",
            "currency": "EUR",
            "tax_rate": 10.0
        }

        # Setup Business 1
        success1, _ = self.run_test(
            "Business 1 Setup",
            "POST",
            "business/setup",
            200,
            data=business1_settings,
            token=self.business1_token,
            critical=True
        )

        # Setup Business 2
        success2, _ = self.run_test(
            "Business 2 Setup",
            "POST",
            "business/setup",
            200,
            data=business2_settings,
            token=self.business2_token,
            critical=True
        )

        # Verify Business 1 can only see its settings
        success, response = self.run_test(
            "Business 1 Get Settings",
            "GET",
            "business/settings",
            200,
            token=self.business1_token,
            critical=True
        )

        if success and response.get('business_settings', {}).get('restaurant_name') != "Alpha Restaurant":
            self.critical_failures.append("Business 1 settings not isolated")

        # Verify Business 2 can only see its settings
        success, response = self.run_test(
            "Business 2 Get Settings",
            "GET",
            "business/settings",
            200,
            token=self.business2_token,
            critical=True
        )

        if success and response.get('business_settings', {}).get('restaurant_name') != "Beta Bistro":
            self.critical_failures.append("Business 2 settings not isolated")

    def test_staff_isolation(self):
        """Test staff management isolation"""
        # Business 1 creates staff
        staff1_data = {
            "username": "waiter_alpha",
            "email": "waiter@alpha.com",
            "password": "StaffPass123!",
            "role": "waiter",
            "phone": "+1-555-1001",
            "salary": 2500.0
        }

        success1, response1 = self.run_test(
            "Business 1 Create Staff",
            "POST",
            "staff/create",
            200,
            data=staff1_data,
            token=self.business1_token,
            critical=True
        )

        # Business 2 creates staff
        staff2_data = {
            "username": "waiter_beta",
            "email": "waiter@beta.com",
            "password": "StaffPass123!",
            "role": "cashier",
            "phone": "+1-555-2001",
            "salary": 3000.0
        }

        success2, response2 = self.run_test(
            "Business 2 Create Staff",
            "POST",
            "staff/create",
            200,
            data=staff2_data,
            token=self.business2_token,
            critical=True
        )

        # Verify Business 1 can only see its staff
        success, response = self.run_test(
            "Business 1 Get Staff",
            "GET",
            "staff",
            200,
            token=self.business1_token,
            critical=True
        )

        if success:
            staff_usernames = [staff['username'] for staff in response]
            if 'waiter_beta' in staff_usernames:
                self.critical_failures.append("Business 1 can see Business 2's staff - DATA LEAK!")
            if 'waiter_alpha' not in staff_usernames and len(response) > 0:
                print(f"   Business 1 staff: {staff_usernames}")

        # Verify Business 2 can only see its staff
        success, response = self.run_test(
            "Business 2 Get Staff",
            "GET",
            "staff",
            200,
            token=self.business2_token,
            critical=True
        )

        if success:
            staff_usernames = [staff['username'] for staff in response]
            if 'waiter_alpha' in staff_usernames:
                self.critical_failures.append("Business 2 can see Business 1's staff - DATA LEAK!")
            if 'waiter_beta' not in staff_usernames and len(response) > 0:
                print(f"   Business 2 staff: {staff_usernames}")

    def test_menu_isolation(self):
        """Test menu isolation between businesses"""
        # Business 1 creates menu items
        menu1_data = {
            "name": "Alpha Burger",
            "category": "Main Course",
            "price": 15.99,
            "description": "Alpha's signature burger",
            "available": True
        }

        success1, response1 = self.run_test(
            "Business 1 Create Menu Item",
            "POST",
            "menu",
            200,
            data=menu1_data,
            token=self.business1_token,
            critical=True
        )

        menu1_id = response1.get('id') if success1 else None

        # Business 2 creates menu items
        menu2_data = {
            "name": "Beta Pizza",
            "category": "Italian",
            "price": 22.50,
            "description": "Beta's wood-fired pizza",
            "available": True
        }

        success2, response2 = self.run_test(
            "Business 2 Create Menu Item",
            "POST",
            "menu",
            200,
            data=menu2_data,
            token=self.business2_token,
            critical=True
        )

        menu2_id = response2.get('id') if success2 else None

        # Verify Business 1 can only see its menu
        success, response = self.run_test(
            "Business 1 Get Menu",
            "GET",
            "menu",
            200,
            token=self.business1_token,
            critical=True
        )

        if success:
            menu_names = [item['name'] for item in response]
            if 'Beta Pizza' in menu_names:
                self.critical_failures.append("Business 1 can see Business 2's menu - DATA LEAK!")
            if 'Alpha Burger' not in menu_names and len(response) > 0:
                print(f"   Business 1 menu: {menu_names}")

        # Verify Business 2 can only see its menu
        success, response = self.run_test(
            "Business 2 Get Menu",
            "GET",
            "menu",
            200,
            token=self.business2_token,
            critical=True
        )

        if success:
            menu_names = [item['name'] for item in response]
            if 'Alpha Burger' in menu_names:
                self.critical_failures.append("Business 2 can see Business 1's menu - DATA LEAK!")
            if 'Beta Pizza' not in menu_names and len(response) > 0:
                print(f"   Business 2 menu: {menu_names}")

        return menu1_id, menu2_id

    def test_table_isolation(self):
        """Test table isolation between businesses"""
        # Business 1 creates tables
        table1_data = {
            "table_number": 101,
            "capacity": 4,
            "status": "available"
        }

        success1, response1 = self.run_test(
            "Business 1 Create Table",
            "POST",
            "tables",
            200,
            data=table1_data,
            token=self.business1_token,
            critical=True
        )

        table1_id = response1.get('id') if success1 else None

        # Business 2 creates tables
        table2_data = {
            "table_number": 201,
            "capacity": 6,
            "status": "available"
        }

        success2, response2 = self.run_test(
            "Business 2 Create Table",
            "POST",
            "tables",
            200,
            data=table2_data,
            token=self.business2_token,
            critical=True
        )

        table2_id = response2.get('id') if success2 else None

        # Verify Business 1 can only see its tables
        success, response = self.run_test(
            "Business 1 Get Tables",
            "GET",
            "tables",
            200,
            token=self.business1_token,
            critical=True
        )

        if success:
            table_numbers = [table['table_number'] for table in response]
            if 201 in table_numbers:
                self.critical_failures.append("Business 1 can see Business 2's tables - DATA LEAK!")
            if 101 not in table_numbers and len(response) > 0:
                print(f"   Business 1 tables: {table_numbers}")

        # Verify Business 2 can only see its tables
        success, response = self.run_test(
            "Business 2 Get Tables",
            "GET",
            "tables",
            200,
            token=self.business2_token,
            critical=True
        )

        if success:
            table_numbers = [table['table_number'] for table in response]
            if 101 in table_numbers:
                self.critical_failures.append("Business 2 can see Business 1's tables - DATA LEAK!")
            if 201 not in table_numbers and len(response) > 0:
                print(f"   Business 2 tables: {table_numbers}")

        return table1_id, table2_id

    def test_order_isolation(self, table1_id, menu1_id, table2_id, menu2_id):
        """Test order isolation between businesses"""
        if not all([table1_id, menu1_id, table2_id, menu2_id]):
            print("⚠️  Skipping order isolation test - missing prerequisites")
            return

        # Business 1 creates order
        order1_data = {
            "table_id": table1_id,
            "table_number": 101,
            "items": [{
                "menu_item_id": menu1_id,
                "name": "Alpha Burger",
                "quantity": 2,
                "price": 15.99
            }],
            "customer_name": "Alpha Customer"
        }

        success1, response1 = self.run_test(
            "Business 1 Create Order",
            "POST",
            "orders",
            200,
            data=order1_data,
            token=self.business1_token,
            critical=True
        )

        # Business 2 creates order
        order2_data = {
            "table_id": table2_id,
            "table_number": 201,
            "items": [{
                "menu_item_id": menu2_id,
                "name": "Beta Pizza",
                "quantity": 1,
                "price": 22.50
            }],
            "customer_name": "Beta Customer"
        }

        success2, response2 = self.run_test(
            "Business 2 Create Order",
            "POST",
            "orders",
            200,
            data=order2_data,
            token=self.business2_token,
            critical=True
        )

        # Verify Business 1 can only see its orders
        success, response = self.run_test(
            "Business 1 Get Orders",
            "GET",
            "orders",
            200,
            token=self.business1_token,
            critical=True
        )

        if success:
            customer_names = [order.get('customer_name') for order in response]
            if 'Beta Customer' in customer_names:
                self.critical_failures.append("Business 1 can see Business 2's orders - DATA LEAK!")
            if 'Alpha Customer' not in customer_names and len(response) > 0:
                print(f"   Business 1 orders: {customer_names}")

        # Verify Business 2 can only see its orders
        success, response = self.run_test(
            "Business 2 Get Orders",
            "GET",
            "orders",
            200,
            token=self.business2_token,
            critical=True
        )

        if success:
            customer_names = [order.get('customer_name') for order in response]
            if 'Alpha Customer' in customer_names:
                self.critical_failures.append("Business 2 can see Business 1's orders - DATA LEAK!")
            if 'Beta Customer' not in customer_names and len(response) > 0:
                print(f"   Business 2 orders: {customer_names}")

    def test_inventory_isolation(self):
        """Test inventory isolation between businesses"""
        # Business 1 creates inventory
        inventory1_data = {
            "name": "Alpha Beef Patties",
            "quantity": 50.0,
            "unit": "pieces",
            "min_quantity": 10.0,
            "price_per_unit": 2.50
        }

        success1, response1 = self.run_test(
            "Business 1 Create Inventory",
            "POST",
            "inventory",
            200,
            data=inventory1_data,
            token=self.business1_token,
            critical=True
        )

        # Business 2 creates inventory
        inventory2_data = {
            "name": "Beta Pizza Dough",
            "quantity": 25.0,
            "unit": "kg",
            "min_quantity": 5.0,
            "price_per_unit": 3.75
        }

        success2, response2 = self.run_test(
            "Business 2 Create Inventory",
            "POST",
            "inventory",
            200,
            data=inventory2_data,
            token=self.business2_token,
            critical=True
        )

        # Verify Business 1 can only see its inventory
        success, response = self.run_test(
            "Business 1 Get Inventory",
            "GET",
            "inventory",
            200,
            token=self.business1_token,
            critical=True
        )

        if success:
            inventory_names = [item['name'] for item in response]
            if 'Beta Pizza Dough' in inventory_names:
                self.critical_failures.append("Business 1 can see Business 2's inventory - DATA LEAK!")
            if 'Alpha Beef Patties' not in inventory_names and len(response) > 0:
                print(f"   Business 1 inventory: {inventory_names}")

        # Verify Business 2 can only see its inventory
        success, response = self.run_test(
            "Business 2 Get Inventory",
            "GET",
            "inventory",
            200,
            token=self.business2_token,
            critical=True
        )

        if success:
            inventory_names = [item['name'] for item in response]
            if 'Alpha Beef Patties' in inventory_names:
                self.critical_failures.append("Business 2 can see Business 1's inventory - DATA LEAK!")
            if 'Beta Pizza Dough' not in inventory_names and len(response) > 0:
                print(f"   Business 2 inventory: {inventory_names}")

    def test_cross_business_access_blocked(self, menu1_id, menu2_id, table1_id, table2_id):
        """Test that cross-business access to specific resources is blocked"""
        if not all([menu1_id, menu2_id, table1_id, table2_id]):
            print("⚠️  Skipping cross-business access test - missing IDs")
            return

        # Business 1 tries to access Business 2's menu item
        success, response = self.run_test(
            "Business 1 Access Business 2 Menu Item (Should Fail)",
            "GET",
            f"menu/{menu2_id}",
            404,  # Should return 404 (not found) due to organization filtering
            token=self.business1_token,
            critical=True
        )

        if not success:
            self.critical_failures.append("Business 1 can access Business 2's menu item - SECURITY BREACH!")

        # Business 2 tries to access Business 1's menu item
        success, response = self.run_test(
            "Business 2 Access Business 1 Menu Item (Should Fail)",
            "GET",
            f"menu/{menu1_id}",
            404,  # Should return 404 (not found) due to organization filtering
            token=self.business2_token,
            critical=True
        )

        if not success:
            self.critical_failures.append("Business 2 can access Business 1's menu item - SECURITY BREACH!")

        # Business 1 tries to update Business 2's table
        table_update = {"table_number": 999, "capacity": 10, "status": "occupied"}
        success, response = self.run_test(
            "Business 1 Update Business 2 Table (Should Fail)",
            "PUT",
            f"tables/{table2_id}",
            404,  # Should return 404 (not found) due to organization filtering
            data=table_update,
            token=self.business1_token,
            critical=True
        )

        if not success:
            self.critical_failures.append("Business 1 can update Business 2's table - SECURITY BREACH!")

        # Business 2 tries to update Business 1's table
        success, response = self.run_test(
            "Business 2 Update Business 1 Table (Should Fail)",
            "PUT",
            f"tables/{table1_id}",
            404,  # Should return 404 (not found) due to organization filtering
            data=table_update,
            token=self.business2_token,
            critical=True
        )

        if not success:
            self.critical_failures.append("Business 2 can update Business 1's table - SECURITY BREACH!")

def main():
    print("🏪 Starting Restaurant Billing API Tests...")
    print("=" * 50)

    tester = RestaurantAPITester()

    # PRIORITY 1: CRITICAL Multi-Tenancy Data Isolation Test
    print("\n🔒 PRIORITY 1: CRITICAL Multi-Tenancy Data Isolation Test")
    isolation_success = tester.test_multi_tenancy_data_isolation()

    if not isolation_success:
        print("\n" + "="*60)
        print("🚨 CRITICAL FAILURES DETECTED:")
        for failure in tester.critical_failures:
            print(f"   ❌ {failure}")
        print("="*60)

    # Continue with other tests using one of the created businesses
    if tester.business1_token:
        tester.token = tester.business1_token
        tester.user_id = tester.business1_user['id']

        print("\n📝 Testing Authentication Flow...")
        tester.test_get_current_user()

        # Test core functionality with Business 1
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
    print("\n" + "=" * 60)
    print("📊 FINAL TEST RESULTS")
    print("=" * 60)
    print(f"Total Tests: {tester.tests_run}")
    print(f"Passed: {tester.tests_passed}")
    print(f"Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")

    if tester.critical_failures:
        print(f"\n🚨 CRITICAL FAILURES: {len(tester.critical_failures)}")
        for failure in tester.critical_failures:
            print(f"   ❌ {failure}")
        print("\n⚠️  CRITICAL ISSUES FOUND - IMMEDIATE ATTENTION REQUIRED!")
        return 1
    elif tester.tests_passed == tester.tests_run:
        print("\n🎉 ALL TESTS PASSED! Backend is working correctly.")
        print("✅ Multi-tenancy data isolation is working properly.")
        return 0
    else:
        print(f"\n⚠️  {tester.tests_run - tester.tests_passed} non-critical tests failed.")
        print("✅ No critical data isolation issues found.")
        return 0

if __name__ == "__main__":
    sys.exit(main())
