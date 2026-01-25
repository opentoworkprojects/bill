#!/usr/bin/env python3
"""
Test Backend Endpoints Directly
"""

import requests
import time

API_BASE = "http://localhost:8000/api"
CREDENTIALS = {"username": "shiv@123", "password": "shiv"}

def test_endpoint(endpoint, timeout=10):
    """Test a single endpoint with timing"""
    print(f"\n🔬 Testing: {endpoint}")
    print("-" * 30)
    
    start_time = time.time()
    try:
        response = requests.get(f"{API_BASE}/{endpoint}", params=CREDENTIALS, timeout=timeout)
        duration = (time.time() - start_time) * 1000
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ SUCCESS ({duration:.0f}ms)")
            
            # Show data structure
            if isinstance(data, dict):
                print(f"   📊 Keys: {list(data.keys())}")
                if 'overview' in data:
                    print(f"   📈 Overview: {data['overview']}")
                elif 'users' in data:
                    print(f"   👥 Users: {len(data['users'])} total")
                elif 'team_members' in data:
                    print(f"   👥 Team: {len(data['team_members'])} members")
                elif 'regular_price' in data:
                    print(f"   💰 Pricing: ₹{data['regular_price']}")
            
            return True, duration, data
        else:
            print(f"❌ FAILED ({duration:.0f}ms) - Status: {response.status_code}")
            print(f"   Error: {response.text[:200]}")
            return False, duration, None
            
    except requests.exceptions.Timeout:
        duration = (time.time() - start_time) * 1000
        print(f"⏰ TIMEOUT ({duration:.0f}ms)")
        return False, duration, None
    except Exception as e:
        duration = (time.time() - start_time) * 1000
        print(f"💥 ERROR ({duration:.0f}ms): {e}")
        return False, duration, None

def main():
    print("🧪 TESTING BACKEND ENDPOINTS DIRECTLY")
    print("=" * 50)
    print(f"🔗 API Base: {API_BASE}")
    print(f"👤 Credentials: {CREDENTIALS['username']}")
    print("=" * 50)
    
    endpoints = [
        ("super-admin/login", 5),
        ("super-admin/dashboard", 15),
        ("super-admin/users", 15),
        ("super-admin/analytics", 10),
        ("super-admin/tickets", 5),
        ("super-admin/leads", 5),
        ("super-admin/team", 5),
        ("super-admin/app-versions", 5),
        ("super-admin/campaigns", 5),
        ("super-admin/pricing", 5),
        ("super-admin/sale-offer", 5)
    ]
    
    results = []
    
    for endpoint, timeout in endpoints:
        success, duration, data = test_endpoint(endpoint, timeout)
        results.append({
            'endpoint': endpoint,
            'success': success,
            'duration': duration,
            'data': data
        })
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 ENDPOINT TEST SUMMARY")
    print("=" * 50)
    
    successful = sum(1 for r in results if r['success'])
    total = len(results)
    success_rate = (successful / total) * 100
    
    print(f"\n📈 Results: {successful}/{total} endpoints working ({success_rate:.1f}%)")
    
    print(f"\n✅ Working Endpoints:")
    for r in results:
        if r['success']:
            print(f"   • {r['endpoint']} ({r['duration']:.0f}ms)")
    
    print(f"\n❌ Failed Endpoints:")
    for r in results:
        if not r['success']:
            print(f"   • {r['endpoint']} ({r['duration']:.0f}ms)")
    
    # Performance analysis
    fast_endpoints = [r for r in results if r['success'] and r['duration'] < 1000]
    slow_endpoints = [r for r in results if r['success'] and r['duration'] >= 1000]
    
    print(f"\n⚡ Fast Endpoints (< 1s): {len(fast_endpoints)}")
    print(f"🐌 Slow Endpoints (≥ 1s): {len(slow_endpoints)}")
    
    if slow_endpoints:
        print("\n🐌 Slow Endpoints Details:")
        for r in slow_endpoints:
            print(f"   • {r['endpoint']}: {r['duration']:.0f}ms")

if __name__ == "__main__":
    main()