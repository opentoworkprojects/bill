import requests

# Check tables data structure
login_data = {'username': 'testuser_i9k2vl', 'password': 'testpass123'}
login_response = requests.post('http://localhost:8000/api/auth/login', json=login_data)
token = login_response.json().get('token')
headers = {'Authorization': f'Bearer {token}'}

# Get tables
tables_response = requests.get('http://localhost:8000/api/tables', headers=headers)
tables = tables_response.json()

print('Tables Data Structure:')
for i, table in enumerate(tables, 1):
    print(f'Table {i}:')
    for key, value in table.items():
        print(f'  {key}: {value}')
    print()

# Create a proper table to test
print('Creating a test table...')
table_data = {
    'table_number': 1,
    'capacity': 4,
    'status': 'available'
}

try:
    create_response = requests.post('http://localhost:8000/api/tables', json=table_data, headers=headers)
    if create_response.status_code == 200:
        new_table = create_response.json()
        print(f'New table created:')
        for key, value in new_table.items():
            print(f'  {key}: {value}')
    else:
        print(f'Failed to create table: {create_response.status_code} - {create_response.text}')
except Exception as e:
    print(f'Error creating table: {e}')
