import requests
import json

# Create a test order for the current user
def create_test_order():
    # First, let's see what user is actually logged in by checking localStorage
    # But since we can't access that, let's create a fresh test
    
    # Register and login as testuser_i9k2vl (the user you're trying to use)
    user_data = {
        'username': 'testuser_i9k2vl',
        'email': 'testuser_i9k2vl@example.com', 
        'password': 'testpass123'
    }
    
    try:
        response = requests.post('http://localhost:8000/api/auth/register', json=user_data)
        result = response.json()
        print('Registration response:', result.get('username', 'User already exists'))
    except:
        print('User might already exist')
    
    # Login
    login_data = {'username': 'testuser_i9k2vl', 'password': 'testpass123'}
    login_response = requests.post('http://localhost:8000/api/auth/login', json=login_data)
    login_result = login_response.json()
    token = login_result.get('token')
    
    if not token:
        print('Login failed:', login_result)
        return
    
    print('✅ Logged in successfully')
    
    # Create a menu item
    menu_data = {
        'name': 'Test Burger',
        'price': 150.0,
        'category': 'Food',
        'description': 'Test burger for dashboard'
    }
    
    headers = {'Authorization': f'Bearer {token}'}
    menu_response = requests.post('http://localhost:8000/api/menu', json=menu_data, headers=headers)
    menu_item = menu_response.json()
    print(f'✅ Created menu item: {menu_item.get("name", "Unknown")}')
    
    # Create an order
    order_data = {
        'items': [
            {
                'menu_item_id': menu_item['id'],
                'name': menu_item['name'],  # Add required name field
                'quantity': 2,
                'price': 150.0
            }
        ],
        'table_number': '1',
        'customer_name': 'Test Customer'
    }
    
    order_response = requests.post('http://localhost:8000/api/orders', json=order_data, headers=headers)
    order = order_response.json()
    print(f'Order response:', order)
    
    if 'id' not in order:
        print('❌ Order creation failed - no ID in response')
        return
        
    print(f'✅ Created order: {order.get("id", "Unknown")} - Total: ₹{order.get("total", 0)}')
    
    # Complete the order
    complete_response = requests.put(f'http://localhost:8000/api/orders/{order["id"]}/complete', headers=headers)
    print(f'Order completion response:', complete_response.status_code)
    if complete_response.status_code != 200:
        print(f'Completion failed: {complete_response.text}')
    else:
        print(f'✅ Order completed: {complete_response.status_code == 200}')
    
    # Check today's bills
    bills_response = requests.get('http://localhost:8000/api/orders/today-bills', headers=headers)
    bills_data = bills_response.json()
    print(f'📊 Today\'s bills: {len(bills_data)} bills')
    if bills_data:
        total = sum(bill.get('total', 0) for bill in bills_data)
        print(f'💰 Total revenue: ₹{total}')
    
    print('\n🎯 Dashboard should now show:')
    print(f'   Today\'s Sales: ₹{total}')
    print(f'   Today\'s Orders: {len(bills_data)}')

if __name__ == '__main__':
    create_test_order()
