import requests

# Check current dashboard data
login_data = {'username': 'testuser_i9k2vl', 'password': 'testpass123'}
login_response = requests.post('http://localhost:8000/api/auth/login', json=login_data)
token = login_response.json().get('token')
headers = {'Authorization': f'Bearer {token}'}

print('🔍 Current Dashboard Data Check:')
print('=' * 40)

# Check dashboard endpoint
dashboard_response = requests.get('http://localhost:8000/api/dashboard', headers=headers)
dashboard = dashboard_response.json()
print('Dashboard API Response:')
for key, value in dashboard.items():
    print(f'  {key}: {value}')

# Check orders endpoint  
orders_response = requests.get('http://localhost:8000/api/orders', headers=headers)
orders = orders_response.json()
print(f'\nOrders API Response: {len(orders)} orders')

# Check today's bills endpoint
bills_response = requests.get('http://localhost:8000/api/orders/today-bills', headers=headers)
bills = bills_response.json()
print(f'Today\'s Bills API Response: {len(bills)} bills')

# Check reports/daily endpoint
daily_response = requests.get('http://localhost:8000/api/reports/daily', headers=headers)
daily = daily_response.json()
print('Daily Reports API Response:')
for key, value in daily.items():
    print(f'  {key}: {value}')
