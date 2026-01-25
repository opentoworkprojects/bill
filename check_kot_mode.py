import requests

# Check business settings for KOT mode
login_data = {'username': 'testuser_i9k2vl', 'password': 'testpass123'}
login_response = requests.post('http://localhost:8000/api/auth/login', json=login_data)
token = login_response.json().get('token')
headers = {'Authorization': f'Bearer {token}'}

# Get business settings
settings_response = requests.get('http://localhost:8000/api/business/settings', headers=headers)
settings = settings_response.json()

print('Business Settings:')
print(f'  KOT Mode Enabled: {settings.get("business_settings", {}).get("kot_mode_enabled", False)}')
print(f'  Restaurant Name: {settings.get("business_settings", {}).get("restaurant_name", "N/A")}')

# Check if there are multiple pending orders for same table
orders_response = requests.get('http://localhost:8000/api/orders', headers=headers)
orders = orders_response.json()

# Group by table number
table_orders = {}
for order in orders:
    table = order.get('table_number', 'Unknown')
    if table not in table_orders:
        table_orders[table] = []
    table_orders[table].append(order)

print('\nOrders by Table:')
for table, table_order_list in table_orders.items():
    if len(table_order_list) > 1:
        print(f'  ⚠️  Table {table}: {len(table_order_list)} orders (DUPLICATE!)')
        for order in table_order_list:
            print(f'    - {order.get("id", "Unknown")[:8]}: {order.get("status", "Unknown")}')
    else:
        print(f'  ✅ Table {table}: {len(table_order_list)} order')
