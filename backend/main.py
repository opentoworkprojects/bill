#!/usr/bin/env python3
"""
RestoBill AI - Production Server Runner
"""

import logging
import os
import sys
from pathlib import Path

import uvicorn
from dotenv import load_dotenv

# Add the current directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

# Load environment variables
env_path = Path(__file__).parent / ".env"
if env_path.exists():
    load_dotenv(env_path)
else:
    print("Warning: .env file not found. Using environment variables or defaults.")

# Import the FastAPI app
try:
    from server import app
except ImportError as e:
    print(f"Error importing server: {e}")
    sys.exit(1)

# Configuration
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 10000))  # Render uses port 10000 by default
DEBUG = os.getenv("DEBUG", "false").lower() == "true"
LOG_LEVEL = os.getenv("LOG_LEVEL", "info").lower()
ENVIRONMENT = os.getenv("ENVIRONMENT", "production")

# SSL Configuration
SSL_CERT_PATH = os.getenv("SSL_CERT_PATH")
SSL_KEY_PATH = os.getenv("SSL_KEY_PATH")


def setup_logging():
    """Setup logging configuration"""
    log_level = getattr(logging, LOG_LEVEL.upper(), logging.INFO)

    # Create logs directory if it doesn't exist
    logs_dir = Path(__file__).parent / "logs"
    logs_dir.mkdir(exist_ok=True)

    # Configure logging
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler(logs_dir / "app.log"),
        ],
    )

    # Suppress some verbose logs in production
    if ENVIRONMENT == "production":
        logging.getLogger("uvicorn.access").setLevel(logging.WARNING)


def validate_environment():
    """Validate required environment variables"""
    required_vars = ["MONGO_URL", "DB_NAME", "JWT_SECRET"]
    missing_vars = []

    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)

    if missing_vars:
        print(
            f"Error: Missing required environment variables: {', '.join(missing_vars)}"
        )
        print("Please create a .env file or set these environment variables.")
        sys.exit(1)


def create_directories():
    """Create necessary directories"""
    directories = [
        Path(__file__).parent / "logs",
        Path(__file__).parent / "uploads",
        Path(__file__).parent / "backups",
    ]

    for directory in directories:
        directory.mkdir(exist_ok=True)


def print_startup_info():
    """Print startup information"""
    print("=" * 60)
    print("🍽️  RestoBill AI Server Starting...")
    print("=" * 60)
    print(f"Environment: {ENVIRONMENT}")
    print(f"Host: {HOST}")
    print(f"Port: {PORT}")
    print(f"Debug: {DEBUG}")
    print(f"Log Level: {LOG_LEVEL}")
    print(f"MongoDB: {'Connected' if os.getenv('MONGO_URL') else 'Not configured'}")
    print(
        f"JWT Secret: {'Configured' if os.getenv('JWT_SECRET') else 'Not configured'}"
    )
    if SSL_CERT_PATH and SSL_KEY_PATH:
        print("SSL: Enabled")
    else:
        print("SSL: Disabled")
    print("=" * 60)


def run_server():
    """Run the server with appropriate configuration"""
    # Determine SSL configuration
    ssl_keyfile = SSL_KEY_PATH if SSL_KEY_PATH else None
    ssl_certfile = SSL_CERT_PATH if SSL_CERT_PATH else None

    # Server configuration
    config = {
        "app": "server:app",  # Import from server.py
        "host": HOST,
        "port": PORT,
        "log_level": LOG_LEVEL,
        "access_log": True,
        "reload": False,  # Never reload in production
        "workers": 1,  # Render free tier works better with 1 worker
    }

    # Add SSL configuration if provided
    if ssl_keyfile and ssl_certfile:
        config.update(
            {
                "ssl_keyfile": ssl_keyfile,
                "ssl_certfile": ssl_certfile,
            }
        )

    # Run the server
    uvicorn.run(**config)


def main():
    """Main function"""
    try:
        # Setup
        setup_logging()
        validate_environment()
        create_directories()
        print_startup_info()

        # Run server
        run_server()

    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
        sys.exit(0)
    except Exception as e:
        logging.error(f"Failed to start server: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
