#!/usr/bin/env python3
"""
Generate VAPID keys for Web Push Notifications

Run this script once to generate your VAPID keys, then add them to your .env file:
  VAPID_PUBLIC_KEY=<public_key>
  VAPID_PRIVATE_KEY=<private_key>
  VAPID_EMAIL=mailto:support@billbytekot.in

Also add the public key to frontend/.env:
  REACT_APP_VAPID_PUBLIC_KEY=<public_key>
"""

try:
    from py_vapid import Vapid
    
    vapid = Vapid()
    vapid.generate_keys()
    
    print("\n=== VAPID Keys Generated ===\n")
    print(f"VAPID_PUBLIC_KEY={vapid.public_key.public_bytes_raw().hex()}")
    print(f"VAPID_PRIVATE_KEY={vapid.private_key.private_bytes_raw().hex()}")
    print(f"VAPID_EMAIL=mailto:support@billbytekot.in")
    print("\n=== Add these to your .env files ===\n")
    
except ImportError:
    print("py_vapid not installed. Using pywebpush instead...")
    
    try:
        from pywebpush import webpush
        import base64
        import os
        from cryptography.hazmat.primitives.asymmetric import ec
        from cryptography.hazmat.backends import default_backend
        from cryptography.hazmat.primitives import serialization
        
        # Generate EC key pair
        private_key = ec.generate_private_key(ec.SECP256R1(), default_backend())
        public_key = private_key.public_key()
        
        # Get raw bytes
        private_bytes = private_key.private_numbers().private_value.to_bytes(32, 'big')
        public_bytes = public_key.public_bytes(
            serialization.Encoding.X962,
            serialization.PublicFormat.UncompressedPoint
        )
        
        # Base64 URL encode
        private_b64 = base64.urlsafe_b64encode(private_bytes).decode('utf-8').rstrip('=')
        public_b64 = base64.urlsafe_b64encode(public_bytes).decode('utf-8').rstrip('=')
        
        print("\n=== VAPID Keys Generated ===\n")
        print(f"VAPID_PUBLIC_KEY={public_b64}")
        print(f"VAPID_PRIVATE_KEY={private_b64}")
        print(f"VAPID_EMAIL=mailto:support@billbytekot.in")
        print("\n=== Add these to your .env files ===\n")
        print("Backend .env:")
        print(f"  VAPID_PUBLIC_KEY={public_b64}")
        print(f"  VAPID_PRIVATE_KEY={private_b64}")
        print(f"  VAPID_EMAIL=mailto:support@billbytekot.in")
        print("\nFrontend .env (or environment variable):")
        print(f"  REACT_APP_VAPID_PUBLIC_KEY={public_b64}")
        
    except Exception as e:
        print(f"Error generating keys: {e}")
        print("\nManual generation:")
        print("Run: npx web-push generate-vapid-keys")
