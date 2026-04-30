"""
Firebase Cloud Messaging (FCM) Push Notifications
This enables real push notifications like WhatsApp/Zomato that work even when app is closed.

Setup:
1. Go to Firebase Console (https://console.firebase.google.com)
2. Create a project or use existing
3. Go to Project Settings > Service Accounts
4. Generate new private key (downloads JSON file)
5. Add to .env:
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY=your-private-key
   FIREBASE_CLIENT_EMAIL=your-client-email
   
   OR set FIREBASE_CREDENTIALS_JSON with the full JSON content
"""

import os
import json
import httpx
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

# Firebase credentials from environment
FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID")
FIREBASE_PRIVATE_KEY = os.getenv("FIREBASE_PRIVATE_KEY", "").replace("\\n", "\n")
FIREBASE_CLIENT_EMAIL = os.getenv("FIREBASE_CLIENT_EMAIL")
FIREBASE_CREDENTIALS_JSON = os.getenv("FIREBASE_CREDENTIALS_JSON")


def get_firebase_credentials():
    """Get Firebase credentials from environment"""
    if FIREBASE_CREDENTIALS_JSON:
        try:
            return json.loads(FIREBASE_CREDENTIALS_JSON)
        except:
            pass
    
    if FIREBASE_PROJECT_ID and FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL:
        return {
            "type": "service_account",
            "project_id": FIREBASE_PROJECT_ID,
            "private_key": FIREBASE_PRIVATE_KEY,
            "client_email": FIREBASE_CLIENT_EMAIL,
            "token_uri": "https://oauth2.googleapis.com/token"
        }
    
    return None


def is_firebase_configured():
    """Check if Firebase is configured"""
    return get_firebase_credentials() is not None


async def get_access_token():
    """Get OAuth2 access token for FCM API"""
    credentials = get_firebase_credentials()
    if not credentials:
        return None
    
    try:
        import jwt
        import time
        
        now = int(time.time())
        payload = {
            "iss": credentials["client_email"],
            "sub": credentials["client_email"],
            "aud": "https://oauth2.googleapis.com/token",
            "iat": now,
            "exp": now + 3600,
            "scope": "https://www.googleapis.com/auth/firebase.messaging"
        }
        
        token = jwt.encode(payload, credentials["private_key"], algorithm="RS256")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
                    "assertion": token
                }
            )
            
            if response.status_code == 200:
                return response.json().get("access_token")
    except Exception as e:
        print(f"FCM token error: {e}")
    
    return None


async def send_fcm_notification(
    token: str,
    title: str,
    body: str,
    image: Optional[str] = None,
    data: Optional[Dict[str, str]] = None,
    click_action: Optional[str] = None
) -> Dict[str, Any]:
    """
    Send push notification to a single device via FCM
    
    Args:
        token: FCM device token
        title: Notification title
        body: Notification body/message
        image: Optional image URL
        data: Optional custom data payload
        click_action: URL to open when notification is clicked
    """
    credentials = get_firebase_credentials()
    if not credentials:
        return {"success": False, "error": "Firebase not configured"}
    
    access_token = await get_access_token()
    if not access_token:
        return {"success": False, "error": "Failed to get access token"}
    
    project_id = credentials.get("project_id")
    
    # Build notification payload
    message = {
        "message": {
            "token": token,
            "notification": {
                "title": title,
                "body": body
            },
            "android": {
                "priority": "high",
                "notification": {
                    "sound": "default",
                    "click_action": click_action or "OPEN_APP",
                    "channel_id": "billbytekot_marketing"
                }
            },
            "webpush": {
                "notification": {
                    "title": title,
                    "body": body,
                    "icon": "/icon-192.png",
                    "badge": "/icon-192.png"
                },
                "fcm_options": {
                    "link": click_action or "https://billbytekot.in"
                }
            }
        }
    }
    
    if image:
        message["message"]["notification"]["image"] = image
        message["message"]["android"]["notification"]["image"] = image
    
    if data:
        message["message"]["data"] = {k: str(v) for k, v in data.items()}
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://fcm.googleapis.com/v1/projects/{project_id}/messages:send",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json"
                },
                json=message
            )
            
            if response.status_code == 200:
                return {"success": True, "response": response.json()}
            else:
                return {"success": False, "error": response.text, "status": response.status_code}
    except Exception as e:
        return {"success": False, "error": str(e)}


async def send_fcm_to_topic(
    topic: str,
    title: str,
    body: str,
    image: Optional[str] = None,
    data: Optional[Dict[str, str]] = None,
    click_action: Optional[str] = None
) -> Dict[str, Any]:
    """
    Send push notification to all devices subscribed to a topic
    
    Args:
        topic: Topic name (e.g., 'all_users', 'marketing', 'promotions')
        title: Notification title
        body: Notification body/message
    """
    credentials = get_firebase_credentials()
    if not credentials:
        return {"success": False, "error": "Firebase not configured"}
    
    access_token = await get_access_token()
    if not access_token:
        return {"success": False, "error": "Failed to get access token"}
    
    project_id = credentials.get("project_id")
    
    message = {
        "message": {
            "topic": topic,
            "notification": {
                "title": title,
                "body": body
            },
            "android": {
                "priority": "high",
                "notification": {
                    "sound": "default",
                    "channel_id": "billbytekot_marketing"
                }
            },
            "webpush": {
                "notification": {
                    "title": title,
                    "body": body,
                    "icon": "/icon-192.png"
                },
                "fcm_options": {
                    "link": click_action or "https://billbytekot.in"
                }
            }
        }
    }
    
    if image:
        message["message"]["notification"]["image"] = image
    
    if data:
        message["message"]["data"] = {k: str(v) for k, v in data.items()}
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://fcm.googleapis.com/v1/projects/{project_id}/messages:send",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json"
                },
                json=message
            )
            
            if response.status_code == 200:
                return {"success": True, "response": response.json()}
            else:
                return {"success": False, "error": response.text, "status": response.status_code}
    except Exception as e:
        return {"success": False, "error": str(e)}


async def send_fcm_to_multiple(
    tokens: List[str],
    title: str,
    body: str,
    image: Optional[str] = None,
    data: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    """Send notification to multiple devices"""
    results = {"success": 0, "failed": 0, "errors": []}
    
    for token in tokens:
        result = await send_fcm_notification(token, title, body, image, data)
        if result.get("success"):
            results["success"] += 1
        else:
            results["failed"] += 1
            results["errors"].append(result.get("error"))
    
    return results
