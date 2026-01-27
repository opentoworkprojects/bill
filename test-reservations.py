#!/usr/bin/env python3
"""
Test script to check reservations API and data
"""
import requests
import json
from datetime import date

# API base URL
API_BASE = "http://localhost:10000/api"

def test_reservations():
    print("🧪 Testing Reservations API...")
    
    # You'll need to get a valid token from the browser's localStorage
    # For now, let's test without auth to see the structure
    
    try:
        # Test GET reservations
        print("\n📋 Testing GET /tables/reservations...")
        response = requests.get(f"{API_BASE}/tables/reservations")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Found {len(data)} reservations")
            for i, reservation in enumerate(data):
                print(f"  {i+1}. Table {reservation.get('table_number', 'N/A')} - {reservation.get('customer_name', 'N/A')} - {reservation.get('reservation_date', 'N/A')} {reservation.get('reservation_time', 'N/A')}")
        else:
            print(f"❌ Error: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error testing reservations: {e}")

def test_tables():
    print("\n🍽️ Testing Tables API...")
    
    try:
        # Test GET tables
        response = requests.get(f"{API_BASE}/tables?fresh=true")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Found {len(data)} tables")
            for table in data:
                print(f"  Table {table.get('table_number', 'N/A')}: {table.get('status', 'N/A')}")
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error testing tables: {e}")

if __name__ == "__main__":
    test_tables()
    test_reservations()