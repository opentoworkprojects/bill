#!/bin/bash

# BillByteKOT Production Startup Script
# Handles graceful startup, health checks, and monitoring

set -e

echo "🚀 Starting BillByteKOT Production Server..."

# Environment validation
if [ -z "$MONGO_URL" ]; then
    echo "❌ ERROR: MONGO_URL environment variable is required"
    exit 1
fi

if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "default-jwt-secret-please-change-in-production" ]; then
    echo "❌ ERROR: JWT_SECRET must be set to a secure value in production"
    exit 1
fi

# Set default values
export PORT=${PORT:-8000}
export WORKERS=${WORKERS:-4}
export SERVER_INSTANCE=${SERVER_INSTANCE:-1}

# Log configuration
export LOG_LEVEL=${LOG_LEVEL:-info}
export ACCESS_LOG=${ACCESS_LOG:-/app/logs/access.log}
export ERROR_LOG=${ERROR_LOG:-/app/logs/error.log}

# Create log directory if it doesn't exist
mkdir -p /app/logs

echo "📊 Configuration:"
echo "  - Port: $PORT"
echo "  - Workers: $WORKERS"
echo "  - Instance: $SERVER_INSTANCE"
echo "  - Log Level: $LOG_LEVEL"

# Pre-flight checks
echo "🔍 Running pre-flight checks..."

# Check MongoDB connectivity
echo "  - Testing MongoDB connection..."
python3 -c "
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient

async def test_mongo():
    try:
        client = AsyncIOMotorClient(os.getenv('MONGO_URL'), serverSelectionTimeoutMS=5000)
        await client.admin.command('ping')
        print('    ✅ MongoDB connection successful')
        client.close()
        return True
    except Exception as e:
        print(f'    ❌ MongoDB connection failed: {e}')
        return False

result = asyncio.run(test_mongo())
exit(0 if result else 1)
"

if [ $? -ne 0 ]; then
    echo "❌ MongoDB connection failed. Exiting..."
    exit 1
fi

# Check Redis connectivity (optional)
if [ -n "$REDIS_URL" ]; then
    echo "  - Testing Redis connection..."
    python3 -c "
import asyncio
import os
import redis.asyncio as redis

async def test_redis():
    try:
        r = redis.from_url(os.getenv('REDIS_URL'), decode_responses=True, socket_connect_timeout=5)
        await r.ping()
        print('    ✅ Redis connection successful')
        await r.aclose()
        return True
    except Exception as e:
        print(f'    ⚠️ Redis connection failed: {e}')
        print('    📝 Continuing without Redis cache')
        return True  # Redis is optional

result = asyncio.run(test_redis())
"
fi

echo "✅ Pre-flight checks completed"

# Start the application with Gunicorn for production
echo "🚀 Starting Gunicorn server..."

exec gunicorn server:app \
    --bind 0.0.0.0:$PORT \
    --workers $WORKERS \
    --worker-class uvicorn.workers.UvicornWorker \
    --worker-connections 1000 \
    --max-requests 1000 \
    --max-requests-jitter 100 \
    --timeout 120 \
    --keep-alive 5 \
    --log-level $LOG_LEVEL \
    --access-logfile $ACCESS_LOG \
    --error-logfile $ERROR_LOG \
    --capture-output \
    --enable-stdio-inheritance \
    --preload \
    --worker-tmp-dir /dev/shm