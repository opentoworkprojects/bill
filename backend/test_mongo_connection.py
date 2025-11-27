#!/usr/bin/env python3
"""
MongoDB Connection Test Script
This script tests the MongoDB connection with various SSL/TLS configurations
to validate the fixes made to server.py
"""

import asyncio
import os
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")


async def test_mongo_connections():
    """Test MongoDB connection with different configurations"""

    mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017/restrobill")
    db_name = os.getenv("DB_NAME", "restrobill")

    print("🧪 MongoDB Connection Test")
    print("=" * 50)
    print(
        f"Testing connection to: {mongo_url.replace(mongo_url.split('@')[0].split('://')[1] + '@', '***:***@') if '@' in mongo_url else mongo_url}"
    )
    print(f"Database: {db_name}")
    print("=" * 50)

    # Add SSL/TLS parameters to Atlas URLs if not already present
    if "mongodb+srv://" in mongo_url and "?" not in mongo_url:
        mongo_url += "?retryWrites=true&w=majority&tls=true&tlsInsecure=true"
        print("✅ Added default SSL/TLS parameters to Atlas URL")
    elif "mongodb+srv://" in mongo_url and "tls=" not in mongo_url:
        separator = "&" if "?" in mongo_url else "?"
        mongo_url += f"{separator}tls=true&tlsInsecure=true"
        print("✅ Added SSL/TLS parameters to existing URL")

    test_results = []

    # Test 1: Standard connection with TLS settings
    print("\n🔧 Test 1: Standard TLS connection")
    try:
        if (
            "mongodb+srv://" in mongo_url
            or "ssl=true" in mongo_url
            or "tls=true" in mongo_url
        ):
            client = AsyncIOMotorClient(
                mongo_url,
                tls=True,
                tlsInsecure=True,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=10000,
                socketTimeoutMS=10000,
            )
        else:
            client = AsyncIOMotorClient(mongo_url)

        db = client[db_name]
        await db.command("ping")
        print("✅ Standard TLS connection successful")
        test_results.append("✅ Standard TLS")

        # Test a simple operation
        collections = await db.list_collection_names()
        print(
            f"📁 Found {len(collections)} collections: {collections[:5]}{'...' if len(collections) > 5 else ''}"
        )

        await client.close()

    except Exception as e:
        print(f"❌ Standard TLS connection failed: {e}")
        test_results.append("❌ Standard TLS")

    # Test 2: Alternative SSL configuration
    print("\n🔧 Test 2: Alternative SSL configuration")
    try:
        alt_client = AsyncIOMotorClient(
            mongo_url,
            ssl=True,
            tlsInsecure=True,
            serverSelectionTimeoutMS=3000,
            connectTimeoutMS=5000,
        )
        alt_db = alt_client[db_name]
        await alt_db.command("ping")
        print("✅ Alternative SSL connection successful")
        test_results.append("✅ Alternative SSL")
        await alt_client.close()

    except Exception as e:
        print(f"❌ Alternative SSL connection failed: {e}")
        test_results.append("❌ Alternative SSL")

    # Test 3: Minimal SSL settings
    print("\n🔧 Test 3: Minimal SSL settings")
    try:
        min_client = AsyncIOMotorClient(
            mongo_url,
            tls=True,
            tlsInsecure=True,
            serverSelectionTimeoutMS=3000,
            connectTimeoutMS=5000,
        )
        min_db = min_client[db_name]
        await min_db.command("ping")
        print("✅ Minimal SSL connection successful")
        test_results.append("✅ Minimal SSL")
        await min_client.close()

    except Exception as e:
        print(f"❌ Minimal SSL connection failed: {e}")
        test_results.append("❌ Minimal SSL")

    # Test 4: No SSL (for local connections only)
    if "localhost" in mongo_url or "127.0.0.1" in mongo_url:
        print("\n🔧 Test 4: Local connection without SSL")
        try:
            # Remove SSL parameters for local test
            local_url = mongo_url.split("?")[0] if "?" in mongo_url else mongo_url
            local_client = AsyncIOMotorClient(local_url, ssl=False)
            local_db = local_client[db_name]
            await local_db.command("ping")
            print("✅ Local connection without SSL successful")
            test_results.append("✅ Local no SSL")
            await local_client.close()

        except Exception as e:
            print(f"❌ Local connection without SSL failed: {e}")
            test_results.append("❌ Local no SSL")
    else:
        print("\n🔧 Test 4: Skipped (not a local connection)")
        test_results.append("⏭️ Local no SSL (skipped)")

    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    for result in test_results:
        print(f"   {result}")

    successful_tests = len([r for r in test_results if r.startswith("✅")])
    total_tests = len([r for r in test_results if not r.endswith("(skipped)")])

    print(f"\n🎯 Success Rate: {successful_tests}/{total_tests} tests passed")

    if successful_tests > 0:
        print("✅ At least one connection method works - deployment should succeed!")
    else:
        print("❌ All connection methods failed - check your MongoDB configuration")
        print("\n💡 Troubleshooting tips:")
        print("   1. Verify MONGO_URL environment variable is set correctly")
        print("   2. Check MongoDB Atlas cluster is running and accessible")
        print("   3. Verify IP whitelist includes 0.0.0.0/0 or your server's IP")
        print("   4. Ensure database user has proper permissions")
        print(
            "   5. Try adding ?retryWrites=true&w=majority&tls=true&tlsInsecure=true to your URL"
        )

    print("=" * 50)


def main():
    """Main function to run the tests"""
    try:
        asyncio.run(test_mongo_connections())
    except KeyboardInterrupt:
        print("\n🛑 Test interrupted by user")
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")


if __name__ == "__main__":
    main()
