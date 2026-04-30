#!/usr/bin/env python3
"""
MongoDB Atlas Connection Bypass Strategy for RestoBill AI
=========================================================

This module provides specialized connection strategies to bypass SSL/TLS issues
with MongoDB Atlas clusters that have strict SSL requirements causing
TLSV1_ALERT_INTERNAL_ERROR in certain deployment environments like Render.

The module implements multiple connection fallback strategies and SSL bypass
techniques specifically designed for production deployment scenarios where
standard SSL/TLS negotiation fails.

Usage:
    from mongo_atlas_bypass import get_atlas_client

    client, db = await get_atlas_client()
    if client:
        # Use client and db normally
        result = await db.collection.find_one()

Author: RestoBill AI Team
Date: November 2024
Version: 1.0.0
"""

import asyncio
import os
import socket
import ssl
import warnings
from datetime import datetime
from typing import Any, Dict, Optional, Tuple
from urllib.parse import parse_qs, quote_plus, urlencode, urlparse

try:
    import pymongo
    from motor.motor_asyncio import AsyncIOMotorClient
except ImportError as e:
    print(f"❌ Required packages missing: {e}")
    print("Install with: pip install motor pymongo")
    raise

# Suppress SSL warnings for bypass strategies
warnings.filterwarnings("ignore", category=UserWarning, module="pymongo")

# Atlas connection details
ATLAS_CLUSTER = "crm.hn5ito0.mongodb.net"
ATLAS_USERNAME = "shivshankarkumar281_db_user"
ATLAS_PASSWORD = "Go4fsErNtRJyPMOp"
DEFAULT_DATABASE = "restrobill"

# Connection timeout settings
TIMEOUTS = {
    "server_selection": 15000,
    "connect": 20000,
    "socket": 30000,
}


class AtlasConnectionError(Exception):
    """Custom exception for Atlas connection failures"""

    pass


def log_connection_attempt(strategy_name: str, status: str, details: str = ""):
    """Log connection attempts with timestamps"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    status_emoji = "✅" if status == "success" else "❌" if status == "error" else "🔄"
    print(f"[{timestamp}] {status_emoji} {strategy_name}: {details}")


def build_connection_string(
    username: str,
    password: str,
    cluster: str,
    database: str,
    ssl_params: Dict[str, str] = None,
) -> str:
    """Build optimized MongoDB Atlas connection string"""

    # URL encode credentials to handle special characters
    encoded_username = quote_plus(username)
    encoded_password = quote_plus(password)

    # Base connection string
    base_url = (
        f"mongodb+srv://{encoded_username}:{encoded_password}@{cluster}/{database}"
    )

    # Default parameters for Atlas
    default_params = {
        "retryWrites": "true",
        "w": "majority",
        "authSource": "admin",
        "readPreference": "primary",
    }

    # Add SSL parameters if provided
    if ssl_params:
        default_params.update(ssl_params)

    # Build query string
    query_string = urlencode(default_params)
    return f"{base_url}?{query_string}"


async def test_connection_strategy(
    strategy_name: str,
    connection_string: str,
    client_options: Dict[str, Any],
    database_name: str,
) -> Tuple[bool, Optional[AsyncIOMotorClient], Optional[Any]]:
    """Test a specific connection strategy"""

    log_connection_attempt(strategy_name, "attempting", "Connecting...")

    client = None
    try:
        # Create client with options
        client = AsyncIOMotorClient(connection_string, **client_options)
        db = client[database_name]

        # Test connection with ping command
        await asyncio.wait_for(db.command("ping"), timeout=10.0)

        # Test basic database access
        try:
            collections = await db.list_collection_names()
            collection_count = len(collections)
        except Exception:
            collection_count = "unknown"

        log_connection_attempt(
            strategy_name,
            "success",
            f"Connected to {database_name}, collections: {collection_count}",
        )

        return True, client, db

    except asyncio.TimeoutError:
        log_connection_attempt(strategy_name, "error", "Connection timeout")
        if client:
            client.close()
        return False, None, None

    except Exception as e:
        error_msg = str(e)
        # Truncate very long error messages
        if len(error_msg) > 100:
            error_msg = error_msg[:100] + "..."

        log_connection_attempt(strategy_name, "error", error_msg)
        if client:
            client.close()
        return False, None, None


class AtlasConnectionStrategies:
    """Collection of MongoDB Atlas connection strategies"""

    @staticmethod
    def get_bypass_ssl_strategy() -> Tuple[str, str, Dict[str, Any]]:
        """Strategy 1: Bypass SSL validation completely"""
        connection_string = build_connection_string(
            ATLAS_USERNAME,
            ATLAS_PASSWORD,
            ATLAS_CLUSTER,
            DEFAULT_DATABASE,
            {"ssl": "false"},  # Try without SSL
        )

        client_options = {
            "serverSelectionTimeoutMS": TIMEOUTS["server_selection"],
            "connectTimeoutMS": TIMEOUTS["connect"],
            "socketTimeoutMS": TIMEOUTS["socket"],
            "maxPoolSize": 5,
            "minPoolSize": 1,
        }

        return "Bypass SSL", connection_string, client_options

    @staticmethod
    def get_legacy_ssl_strategy() -> Tuple[str, str, Dict[str, Any]]:
        """Strategy 2: Use legacy SSL settings"""
        connection_string = build_connection_string(
            ATLAS_USERNAME,
            ATLAS_PASSWORD,
            ATLAS_CLUSTER,
            DEFAULT_DATABASE,
            {"ssl": "true"},
        )

        client_options = {
            "ssl": True,
            "ssl_cert_reqs": ssl.CERT_NONE,
            "ssl_check_hostname": False,
            "ssl_match_hostname": False,
            "serverSelectionTimeoutMS": TIMEOUTS["server_selection"],
            "connectTimeoutMS": TIMEOUTS["connect"],
            "socketTimeoutMS": TIMEOUTS["socket"],
            "maxPoolSize": 3,
        }

        return "Legacy SSL", connection_string, client_options

    @staticmethod
    def get_minimal_tls_strategy() -> Tuple[str, str, Dict[str, Any]]:
        """Strategy 3: Minimal TLS configuration"""
        connection_string = build_connection_string(
            ATLAS_USERNAME,
            ATLAS_PASSWORD,
            ATLAS_CLUSTER,
            DEFAULT_DATABASE,
            {"tls": "true", "tlsInsecure": "true"},
        )

        client_options = {
            "tls": True,
            "tlsInsecure": True,
            "serverSelectionTimeoutMS": TIMEOUTS["server_selection"],
            "connectTimeoutMS": TIMEOUTS["connect"],
            "socketTimeoutMS": TIMEOUTS["socket"],
            "maxPoolSize": 5,
        }

        return "Minimal TLS", connection_string, client_options

    @staticmethod
    def get_pymongo_direct_strategy() -> Tuple[str, str, Dict[str, Any]]:
        """Strategy 4: Direct PyMongo approach with custom SSL context"""
        connection_string = build_connection_string(
            ATLAS_USERNAME,
            ATLAS_PASSWORD,
            ATLAS_CLUSTER,
            DEFAULT_DATABASE,
            {"ssl": "true", "ssl_cert_reqs": "CERT_NONE"},
        )

        # Create custom SSL context that's more permissive
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        ssl_context.set_ciphers("DEFAULT:@SECLEVEL=1")  # Lower security level

        client_options = {
            "ssl_context": ssl_context,
            "serverSelectionTimeoutMS": TIMEOUTS["server_selection"],
            "connectTimeoutMS": TIMEOUTS["connect"],
            "socketTimeoutMS": TIMEOUTS["socket"],
            "maxPoolSize": 3,
        }

        return "PyMongo Direct", connection_string, client_options

    @staticmethod
    def get_render_optimized_strategy() -> Tuple[str, str, Dict[str, Any]]:
        """Strategy 5: Render deployment optimized"""
        connection_string = build_connection_string(
            ATLAS_USERNAME,
            ATLAS_PASSWORD,
            ATLAS_CLUSTER,
            DEFAULT_DATABASE,
            {
                "retryWrites": "true",
                "w": "majority",
                "authSource": "admin",
                "readPreference": "primaryPreferred",
                "maxIdleTimeMS": "120000",
                "serverSelectionTimeoutMS": "10000",
            },
        )

        client_options = {
            "serverSelectionTimeoutMS": 10000,
            "connectTimeoutMS": 15000,
            "socketTimeoutMS": 20000,
            "maxPoolSize": 2,
            "minPoolSize": 1,
            "maxIdleTimeMS": 120000,
        }

        return "Render Optimized", connection_string, client_options

    @staticmethod
    def get_connection_pool_strategy() -> Tuple[str, str, Dict[str, Any]]:
        """Strategy 6: Optimized connection pooling"""
        connection_string = build_connection_string(
            ATLAS_USERNAME,
            ATLAS_PASSWORD,
            ATLAS_CLUSTER,
            DEFAULT_DATABASE,
            {
                "tls": "true",
                "tlsInsecure": "true",
                "maxPoolSize": "1",
                "minPoolSize": "1",
                "maxIdleTimeMS": "30000",
                "waitQueueTimeoutMS": "5000",
            },
        )

        client_options = {
            "tls": True,
            "tlsInsecure": True,
            "serverSelectionTimeoutMS": 8000,
            "connectTimeoutMS": 10000,
            "socketTimeoutMS": 15000,
            "maxPoolSize": 1,
            "minPoolSize": 1,
            "maxIdleTimeMS": 30000,
            "waitQueueTimeoutMS": 5000,
        }

        return "Connection Pool", connection_string, client_options


async def get_atlas_client(
    database_name: str = None,
    custom_username: str = None,
    custom_password: str = None,
    custom_cluster: str = None,
) -> Tuple[Optional[AsyncIOMotorClient], Optional[Any]]:
    """
    Get MongoDB Atlas client using multiple fallback strategies

    Args:
        database_name: Database name to connect to
        custom_username: Custom Atlas username
        custom_password: Custom Atlas password
        custom_cluster: Custom Atlas cluster

    Returns:
        Tuple of (client, database) or (None, None) if all strategies fail
    """

    # Use environment variables or defaults
    db_name = database_name or os.getenv("DB_NAME", DEFAULT_DATABASE)

    # Override credentials if provided
    global ATLAS_USERNAME, ATLAS_PASSWORD, ATLAS_CLUSTER
    if custom_username:
        ATLAS_USERNAME = custom_username
    if custom_password:
        ATLAS_PASSWORD = custom_password
    if custom_cluster:
        ATLAS_CLUSTER = custom_cluster

    print(f"🔄 Attempting MongoDB Atlas connection to {ATLAS_CLUSTER}/{db_name}")
    print("=" * 60)

    # Define all connection strategies
    strategies = [
        AtlasConnectionStrategies.get_render_optimized_strategy,
        AtlasConnectionStrategies.get_minimal_tls_strategy,
        AtlasConnectionStrategies.get_connection_pool_strategy,
        AtlasConnectionStrategies.get_legacy_ssl_strategy,
        AtlasConnectionStrategies.get_pymongo_direct_strategy,
        AtlasConnectionStrategies.get_bypass_ssl_strategy,
    ]

    # Try each strategy in order
    for strategy_func in strategies:
        try:
            strategy_name, connection_string, client_options = strategy_func()

            success, client, db = await test_connection_strategy(
                strategy_name, connection_string, client_options, db_name
            )

            if success:
                print(f"✅ Successfully connected using {strategy_name} strategy!")
                return client, db

        except Exception as e:
            log_connection_attempt(strategy_name, "error", f"Strategy failed: {e}")
            continue

    # All strategies failed
    print("❌ All connection strategies failed!")
    print("\n🔍 Troubleshooting suggestions:")
    print("1. Check MongoDB Atlas Network Access (IP Whitelist)")
    print("2. Verify database user credentials and permissions")
    print("3. Ensure cluster is running and accessible")
    print("4. Check if cluster requires specific SSL/TLS settings")

    return None, None


async def test_database_operations(db) -> bool:
    """Test basic database operations"""
    try:
        print("\n🧪 Testing database operations...")

        # Test 1: List collections
        collections = await db.list_collection_names()
        print(f"✅ Collections found: {len(collections)}")

        # Test 2: Try to access/create a test collection
        test_collection = db.connection_test

        # Insert a test document
        test_doc = {
            "test": True,
            "timestamp": datetime.utcnow(),
            "message": "Connection test successful",
        }

        result = await test_collection.insert_one(test_doc)
        print(f"✅ Test document inserted: {result.inserted_id}")

        # Query the test document
        found_doc = await test_collection.find_one({"_id": result.inserted_id})
        if found_doc:
            print("✅ Test document retrieved successfully")

        # Clean up test document
        await test_collection.delete_one({"_id": result.inserted_id})
        print("✅ Test document cleaned up")

        return True

    except Exception as e:
        print(f"❌ Database operations test failed: {e}")
        return False


def get_optimized_mongo_url() -> str:
    """Get the optimized MongoDB URL for environment variables"""
    return build_connection_string(
        ATLAS_USERNAME,
        ATLAS_PASSWORD,
        ATLAS_CLUSTER,
        DEFAULT_DATABASE,
        {
            "retryWrites": "true",
            "w": "majority",
            "authSource": "admin",
            "readPreference": "primaryPreferred",
            "maxIdleTimeMS": "120000",
        },
    )


async def main():
    """Main function for testing the bypass strategies"""
    print("🍽️  RestoBill AI - MongoDB Atlas Connection Bypass Test")
    print("=" * 60)

    # Test connection
    client, db = await get_atlas_client()

    if client and db:
        # Test database operations
        ops_success = await test_database_operations(db)

        if ops_success:
            print("\n🎉 All tests passed! Connection is working properly.")

            # Show optimized connection string for environment variables
            print(f"\n🔧 Optimized connection string for environment variables:")
            print(f"MONGO_URL={get_optimized_mongo_url()}")
            print(f"DB_NAME={DEFAULT_DATABASE}")

        else:
            print("\n⚠️  Connection established but database operations failed.")

        # Close connection
        client.close()

    else:
        print("\n💡 Consider these additional troubleshooting steps:")
        print("1. Contact MongoDB Atlas support")
        print("2. Try creating a new database user")
        print("3. Check if your cluster version supports the connection method")
        print("4. Consider migrating to a different Atlas cluster")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n⚠️  Test interrupted by user")
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
