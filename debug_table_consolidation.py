import requests

# Check the actual order data structure
login_data = {'username': 'testuser_i9k2vl', 'password': 'testpass123'}
login_response = requests.post('http://localhost:8000/api/auth/login', json=login_data)
token = login_response.json().get('token')
headers = {'Authorization': f'Bearer {token}'}

# Get the duplicate orders for table 1
orders_response = requests.get('http://localhost:8000/api/orders', headers=headers)
orders = orders_response.json()

table_1_orders = [order for order in orders if order.get('table_number') == 1]

print('Table 1 Orders Details:')
for i, order in enumerate(table_1_orders, 1):
    print(f'Order {i}:')
    print(f'  ID: {order.get("id", "Unknown")}')
    print(f'  Table ID: {order.get("table_id", "Unknown")}')
    print(f'  Table Number: {order.get("table_number", "Unknown")}')
    print(f'  Status: {order.get("status", "Unknown")}')
    print(f'  Created: {order.get("created_at", "Unknown")}')
    print(f'  Items: {len(order.get("items", []))}')
    print()

# Check what table_id is being used when creating orders
print('Creating a test order to see table_id assignment...')
order_data = {
    'table_id': 'counter',  # This is the default
    'table_number': 1,
    'items': [
        {
            'name': 'Test Item',
            'price': 100.0,
            'quantity': 1
        }
    ],
    'customer_name': 'Test Customer'
}

try:
    create_response = requests.post('http://localhost:8000/api/orders', json=order_data, headers=headers)
    if create_response.status_code == 200:
        new_order = create_response.json()
        print(f'New order created:')
        print(f'  Table ID: {new_order.get("table_id", "Unknown")}')
        print(f'  Table Number: {new_order.get("table_number", "Unknown")}')
        print(f'  Status: {new_order.get("status", "Unknown")}')
    else:
        print(f'Failed to create order: {create_response.status_code}')
except Exception as e:
    print(f'Error creating order: {e}')
