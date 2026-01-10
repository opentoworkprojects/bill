#!/usr/bin/env python3
"""
Test Super Admin Redis Caching Performance
Tests the enhanced Super Admin endpoints with Redis caching
"""

import requests
import time
import json
from datetime import datetime

# Configuration
BASE_URL = "https://billbytekot.onrender.com"
SUPER_ADMIN_CREDENTIALS = {
    "username": "shiv@123",
    "password": "shiv"
}

def test_endpoint(endpoint, params=None, description=""):
    """Test an endpoint and measure response time"""
    if params is None:
        params = {}
    
    # Add credentials to params
    params.update(SUPER_ADMIN_CREDENTIALS)
    
    print(f"\n🧪 Testing: {description}")
    print(f"📡 Endpoint: {endpoint}")
    
    start_time = time.time()
    
    try:
        response = requests.get(f"{BASE_URL}{endpoint}", params=params, timeout=30)
        end_time = time.time()
        
        response_time = (end_time - start_time) * 1000  # Convert to milliseconds
        
        if response.status_code == 200:
            data = response.json()
            
            # Check if response includes cache info
            cached_at = data.get('cached_at')
            cache_indicator = " 🚀 (CACHED)" if cached_at else " 💾 (FRESH)"
            
            print(f"✅ Success: {response.status_code}")
            print(f"⏱️  Response Time: {response_time:.0f}ms{cache_indicator}")
            
            # Show relevant data counts
            if 'overview' in data:
                overview = data['overview']
                print(f"📊 Users: {overview.get('total_users', 0)}, Active: {overview.get('active_subscriptions', 0)}")
                print(f"🎫 Tickets: {overview.get('open_tickets', 0)} open, {overview.get('pending_tickets', 0)} pending")
                print(f"📦 Orders (30d): {overview.get('total_orders_30d', 0)}")
            
            if 'users' in data and isinstance(data['users'], list):
                print(f"👥 Users loaded: {len(data['users'])}/{data.get('total', 0)}")
            
            if 'tickets' in data and isinstance(data['tickets'], list):
                print(f"🎫 Tickets loaded: {len(data['tickets'])}")
            
            if 'orders' in data and isinstance(data['orders'], list):
                print(f"📦 Orders loaded: {len(data['orders'])}")
            
            if 'leads' in data and isinstance(data['leads'], list):
                print(f"🎯 Leads loaded: {len(data['leads'])}")
            
            if 'members' in data and isinstance(data['members'], list):
                print(f"👨‍💼 Team members loaded: {len(data['members'])}")
            
            if cached_at:
                print(f"💾 Cached at: {cached_at}")
            
            return response_time, True
            
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"📄 Response: {response.text[:200]}...")
            return response_time, False
            
    except requests.exceptions.Timeout:
        print("⏰ Request timed out (30s)")
        return 30000, False
    except Exception as e:
        print(f"💥 Exception: {e}")
        return 0, False

def test_cache_status():
    """Test cache status endpoint"""
    print("\n" + "="*60)
    print("🔍 CHECKING REDIS CACHE STATUS")
    print("="*60)
    
    response_time, success = test_endpoint(
        "/api/super-admin/cache/status",
        description="Redis Cache Status Check"
    )
    
    return success

def test_login_flow():
    """Test the lightweight login flow"""
    print("\n" + "="*60)
    print("🔐 TESTING LIGHTWEIGHT LOGIN FLOW")
    print("="*60)
    
    # Test lightweight login
    response_time, success = test_endpoint(
        "/api/super-admin/login",
        description="Lightweight Login (No DB queries)"
    )
    
    if success:
        print(f"🎉 Login successful in {response_time:.0f}ms")
    
    return success

def test_dashboard_performance():
    """Test dashboard performance with caching"""
    print("\n" + "="*60)
    print("📊 TESTING DASHBOARD PERFORMANCE")
    print("="*60)
    
    # First call (should be fresh from DB)
    print("\n🔄 First call (fresh data):")
    time1, success1 = test_endpoint(
        "/api/super-admin/dashboard",
        description="Dashboard - First Call (Fresh)"
    )
    
    if not success1:
        return False
    
    # Second call (should be cached)
    print("\n🔄 Second call (should be cached):")
    time2, success2 = test_endpoint(
        "/api/super-admin/dashboard",
        description="Dashboard - Second Call (Cached)"
    )
    
    if success1 and success2:
        improvement = ((time1 - time2) / time1) * 100
        print(f"\n🚀 Performance improvement: {improvement:.1f}%")
        print(f"📈 Speed increase: {time1/time2:.1f}x faster")
    
    return success2

def test_data_endpoints():
    """Test all data endpoints with caching"""
    print("\n" + "="*60)
    print("📋 TESTING DATA ENDPOINTS WITH CACHING")
    print("="*60)
    
    endpoints = [
        ("/api/super-admin/users", {"limit": 20}, "Users List (Paginated)"),
        ("/api/super-admin/tickets/recent", {"limit": 10}, "Recent Tickets"),
        ("/api/super-admin/orders/recent", {"days": 7, "limit": 10}, "Recent Orders"),
        ("/api/super-admin/leads", {}, "Leads Management"),
        ("/api/super-admin/team", {}, "Team Members"),
        ("/api/super-admin/analytics", {"days": 30}, "Analytics Data")
    ]
    
    results = []
    
    for endpoint, params, description in endpoints:
        # First call
        print(f"\n🔄 Testing {description} (first call):")
        time1, success1 = test_endpoint(endpoint, params, f"{description} - Fresh")
        
        if success1:
            # Second call (should be cached)
            print(f"🔄 Testing {description} (second call - cached):")
            time2, success2 = test_endpoint(endpoint, params, f"{description} - Cached")
            
            if success2:
                improvement = ((time1 - time2) / time1) * 100 if time1 > 0 else 0
                results.append({
                    'endpoint': description,
                    'fresh_time': time1,
                    'cached_time': time2,
                    'improvement': improvement
                })
    
    # Summary
    if results:
        print("\n" + "="*60)
        print("📈 PERFORMANCE SUMMARY")
        print("="*60)
        
        total_fresh = sum(r['fresh_time'] for r in results)
        total_cached = sum(r['cached_time'] for r in results)
        overall_improvement = ((total_fresh - total_cached) / total_fresh) * 100 if total_fresh > 0 else 0
        
        print(f"\n🎯 Overall Performance:")
        print(f"   Fresh data total: {total_fresh:.0f}ms")
        print(f"   Cached data total: {total_cached:.0f}ms")
        print(f"   Overall improvement: {overall_improvement:.1f}%")
        print(f"   Speed multiplier: {total_fresh/total_cached:.1f}x faster")
        
        print(f"\n📊 Individual Endpoints:")
        for result in results:
            print(f"   {result['endpoint']}: {result['improvement']:.1f}% faster")
    
    return len(results) > 0

def test_cache_invalidation():
    """Test cache invalidation functionality"""
    print("\n" + "="*60)
    print("🗑️  TESTING CACHE INVALIDATION")
    print("="*60)
    
    try:
        # Test cache invalidation
        params = SUPER_ADMIN_CREDENTIALS.copy()
        params['cache_type'] = 'dashboard'
        
        response = requests.post(
            f"{BASE_URL}/api/super-admin/cache/invalidate",
            params=params,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Cache invalidation: {data.get('message', 'Success')}")
            print(f"🗑️  Invalidated: {data.get('invalidated', False)}")
            return True
        else:
            print(f"❌ Cache invalidation failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"💥 Cache invalidation error: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 SUPER ADMIN REDIS CACHING PERFORMANCE TEST")
    print("=" * 60)
    print(f"🌐 Testing against: {BASE_URL}")
    print(f"👤 Super Admin: {SUPER_ADMIN_CREDENTIALS['username']}")
    print(f"🕐 Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Run tests
    tests = [
        ("Cache Status Check", test_cache_status),
        ("Login Flow", test_login_flow),
        ("Dashboard Performance", test_dashboard_performance),
        ("Data Endpoints", test_data_endpoints),
        ("Cache Invalidation", test_cache_invalidation)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n🧪 Running: {test_name}")
        try:
            success = test_func()
            results.append((test_name, success))
            print(f"{'✅' if success else '❌'} {test_name}: {'PASSED' if success else 'FAILED'}")
        except Exception as e:
            print(f"💥 {test_name} crashed: {e}")
            results.append((test_name, False))
    
    # Final summary
    print("\n" + "="*60)
    print("🏁 FINAL TEST RESULTS")
    print("="*60)
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    for test_name, success in results:
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"   {test_name}: {status}")
    
    print(f"\n📊 Summary: {passed}/{total} tests passed ({(passed/total)*100:.1f}%)")
    
    if passed == total:
        print("🎉 All tests passed! Redis caching is working optimally.")
    elif passed > total // 2:
        print("⚠️  Most tests passed. Some Redis features may not be available.")
    else:
        print("🚨 Multiple test failures. Check Redis connection and configuration.")
    
    print(f"\n🕐 Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    main()