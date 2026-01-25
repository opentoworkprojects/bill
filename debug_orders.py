import requests

# Check what orders exist
login_data = {'username': 'testuser_i9k2vl', 'password': 'testpass123'}
login_response = requests.post('http://localhost:8000/api/auth/login', json=login_data)
token = login_response.json().get('token')
headers = {'Authorization': f'Bearer {token}'}

# Get active orders
orders_response = requests.get('http://localhost:8000/api/orders', headers=headers)
orders = orders_response.json()

print(f'Active orders: {len(orders)}')
for order in orders:
    order_id = order.get('id', 'Unknown')[:8]
    table = order.get('table_number', 'N/A')
    status = order.get('status', 'Unknown')
    total = order.get('total', 0)
    print(f'  Order {order_id}: Table {table} - Status: {status} - Total: ₹{total}')

# Get tables
tables_response = requests.get('http://localhost:8000/api/tables', headers=headers)
tables = tables_response.json()

print(f'\nTables: {len(tables)}')
for table in tables:
    number = table.get('number', 'N/A')
    status = table.get('status', 'Unknown')
    capacity = table.get('capacity', 'N/A')
    print(f'  Table {number}: Status: {status} - Capacity: {capacity}')

# Get dashboard data
dashboard_response = requests.get('http://localhost:8000/api/dashboard', headers=headers)
dashboard = dashboard_response.json()

print(f'\nDashboard data:')
print(f'  Today orders: {dashboard.get("todaysOrders", 0)}')
print(f'  Today revenue: ₹{dashboard.get("todaysRevenue", 0)}')
