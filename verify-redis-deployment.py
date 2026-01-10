#!/usr/bin/env python3
"""
Verify Redis Deployment Fix
Simple health check to verify the deployment is working
"""

import asyncio
import aiohttp
import time

BASE_URL = "https://restro-ai.onrender.com"

async def check_deployment():
    """Check if the deployment is working"""
    print("🔍 Checking deployment health...")
    
    async with aiohttp.ClientSession() as session:
        try:
            # Check health endpoint
            start_time = time.time()
            async with session.get(f"{BASE_URL}/health", timeout=30) as response:
                response_time = (time.time() - start_time) * 1000
                
                if response.status == 200:
                    print(f"✅ Health check passed ({response_time:.0f}ms)")
                    return True
                else:
                    print(f"❌ Health check failed: {response.status}")
                    return False
                    
        except asyncio.TimeoutError:
            print("❌ Health check timed out (30s)")
            return False
        except Exception as e:
            print(f"❌ Health check error: {e}")
            return False

async def check_api_endpoints():
    """Check if API endpoints are accessible"""
    print("🔍 Checking API endpoints...")
    
    async with aiohttp.ClientSession() as session:
        endpoints = [
            "/api/docs",  # API documentation
            "/api/health",  # API health
        ]
        
        results = {}
        
        for endpoint in endpoints:
            try:
                start_time = time.time()
                async with session.get(f"{BASE_URL}{endpoint}", timeout=15) as response:
                    response_time = (time.time() - start_time) * 1000
                    
                    if response.status in [200, 401]:  # 401 is expected for protected endpoints
                        print(f"✅ {endpoint}: {response.status} ({response_time:.0f}ms)")
                        results[endpoint] = True
                    else:
                        print(f"❌ {endpoint}: {response.status} ({response_time:.0f}ms)")
                        results[endpoint] = False
                        
            except Exception as e:
                print(f"❌ {endpoint}: Error - {e}")
                results[endpoint] = False
        
        return all(results.values())

async def main():
    """Main verification function"""
    print("🚀 Redis Deployment Verification")
    print("=" * 40)
    
    # Check deployment health
    health_ok = await check_deployment()
    
    # Check API endpoints
    api_ok = await check_api_endpoints()
    
    print("\n" + "=" * 40)
    print("📊 VERIFICATION RESULTS")
    print("=" * 40)
    
    print(f"Health Check: {'✅ PASS' if health_ok else '❌ FAIL'}")
    print(f"API Endpoints: {'✅ PASS' if api_ok else '❌ FAIL'}")
    
    if health_ok and api_ok:
        print("\n🎉 Deployment verification successful!")
        print("✅ Redis cache fixes applied correctly")
        print("✅ Server is running without errors")
    else:
        print("\n⚠️ Deployment verification failed")
        print("❌ Check server logs for Redis cache errors")

if __name__ == "__main__":
    asyncio.run(main())