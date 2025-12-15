"""
Keep-Alive Service to prevent server from sleeping
Pings the server periodically to keep it awake
"""

import requests
import time
import logging
from datetime import datetime
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
BACKEND_URL = os.getenv('BACKEND_URL', 'https://restro-ai.onrender.com')
PING_INTERVAL = 14 * 60  # 14 minutes (Render free tier sleeps after 15 min of inactivity)
HEALTH_ENDPOINT = f"{BACKEND_URL}/health"

def ping_server():
    """Ping the server to keep it awake"""
    try:
        response = requests.get(HEALTH_ENDPOINT, timeout=10)
        if response.status_code == 200:
            logger.info(f"✅ Server pinged successfully at {datetime.now()}")
            return True
        else:
            logger.warning(f"⚠️  Server responded with status {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Failed to ping server: {e}")
        return False

def run_keep_alive():
    """Main keep-alive loop"""
    logger.info(f"🚀 Keep-Alive service started")
    logger.info(f"📍 Target: {HEALTH_ENDPOINT}")
    logger.info(f"⏰ Ping interval: {PING_INTERVAL} seconds ({PING_INTERVAL/60} minutes)")
    
    while True:
        try:
            ping_server()
            time.sleep(PING_INTERVAL)
        except KeyboardInterrupt:
            logger.info("🛑 Keep-Alive service stopped by user")
            break
        except Exception as e:
            logger.error(f"❌ Unexpected error: {e}")
            time.sleep(60)  # Wait 1 minute before retrying

if __name__ == "__main__":
    run_keep_alive()
