"""
SMS Service for OTP delivery
Supports multiple SMS gateways: Twilio, MSG91, Fast2SMS, TextLocal
"""

import os
import httpx
from typing import Optional

# SMS Gateway Configuration
SMS_PROVIDER = os.getenv("SMS_PROVIDER", "console")  # console, twilio, msg91, fast2sms, textlocal
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_VERIFY_SERVICE_SID = os.getenv("TWILIO_VERIFY_SERVICE_SID")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")
MSG91_AUTH_KEY = os.getenv("MSG91_AUTH_KEY")
MSG91_SENDER_ID = os.getenv("MSG91_SENDER_ID", "BILLKT")
MSG91_TEMPLATE_ID = os.getenv("MSG91_TEMPLATE_ID")
FAST2SMS_API_KEY = os.getenv("FAST2SMS_API_KEY")
TEXTLOCAL_API_KEY = os.getenv("TEXTLOCAL_API_KEY")
TEXTLOCAL_SENDER = os.getenv("TEXTLOCAL_SENDER", "BILLKT")


async def send_otp_sms(phone: str, otp: str) -> dict:
    """
    Send OTP via configured SMS gateway
    
    Args:
        phone: Phone number with country code (e.g., +919876543210)
        otp: 6-digit OTP code
    
    Returns:
        dict with success status and message
    """
    
    message = f"Your BillByteKOT OTP is: {otp}. Valid for 5 minutes. Do not share this code."
    
    try:
        if SMS_PROVIDER == "twilio":
            return await send_via_twilio(phone, message)
        elif SMS_PROVIDER == "msg91":
            return await send_via_msg91(phone, otp)
        elif SMS_PROVIDER == "fast2sms":
            return await send_via_fast2sms(phone, otp)
        elif SMS_PROVIDER == "textlocal":
            return await send_via_textlocal(phone, message)
        else:
            # Console mode for development
            print(f"\n{'='*50}")
            print(f"📱 SMS (Console Mode)")
            print(f"{'='*50}")
            print(f"To: {phone}")
            print(f"Message: {message}")
            print(f"{'='*50}\n")
            return {"success": True, "message": "OTP logged to console (dev mode)", "otp": otp}
    
    except Exception as e:
        print(f"SMS sending failed: {e}")
        # Fallback to console
        print(f"\n[SMS FALLBACK] Phone: {phone}, OTP: {otp}")
        return {"success": False, "message": str(e), "otp": otp if os.getenv("DEBUG_MODE") == "true" else None}


async def send_via_twilio(phone: str, message: str) -> dict:
    """Send SMS via Twilio Verify API"""
    if not all([TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN]):
        raise ValueError("Twilio credentials not configured")
    
    # Using Twilio Verify API for OTP
    verify_sid = os.getenv("TWILIO_VERIFY_SERVICE_SID")
    if not verify_sid:
        raise ValueError("TWILIO_VERIFY_SERVICE_SID not configured")
    
    async with httpx.AsyncClient() as client:
        url = f"https://verify.twilio.com/v2/Services/{verify_sid}/Verifications"
        
        auth = httpx.BasicAuth(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        
        data = {
            "To": phone,
            "Channel": "sms"
        }
        
        response = await client.post(url, data=data, auth=auth)
        response.raise_for_status()
        
        result = response.json()
        
        return {
            "success": True,
            "message": "OTP sent via Twilio Verify",
            "sid": result.get("sid"),
            "status": result.get("status")
        }


async def send_via_msg91(phone: str, otp: str) -> dict:
    """Send SMS via MSG91 (India)"""
    if not MSG91_AUTH_KEY:
        raise ValueError("MSG91 API key not configured")
    
    # Remove + from phone number for MSG91
    phone_clean = phone.replace("+", "").replace(" ", "")
    
    async with httpx.AsyncClient() as client:
        if MSG91_TEMPLATE_ID:
            # Use template-based SMS (recommended for OTP)
            url = "https://control.msg91.com/api/v5/otp"
            payload = {
                "template_id": MSG91_TEMPLATE_ID,
                "mobile": phone_clean,
                "authkey": MSG91_AUTH_KEY,
                "otp": otp
            }
        else:
            # Use promotional SMS
            url = "https://control.msg91.com/api/v5/flow/"
            payload = {
                "sender": MSG91_SENDER_ID,
                "route": "4",  # Transactional route
                "country": "91",
                "sms": [
                    {
                        "message": f"Your BillByteKOT OTP is {otp}. Valid for 5 minutes.",
                        "to": [phone_clean]
                    }
                ]
            }
        
        headers = {
            "authkey": MSG91_AUTH_KEY,
            "content-type": "application/json"
        }
        
        response = await client.post(url, json=payload, headers=headers)
        response.raise_for_status()
        
        return {
            "success": True,
            "message": "OTP sent via MSG91",
            "response": response.json()
        }


async def send_via_fast2sms(phone: str, otp: str) -> dict:
    """Send SMS via Fast2SMS (India)"""
    if not FAST2SMS_API_KEY:
        raise ValueError("Fast2SMS API key not configured")
    
    # Remove +91 prefix for Fast2SMS
    phone_clean = phone.replace("+91", "").replace(" ", "")
    
    async with httpx.AsyncClient() as client:
        url = "https://www.fast2sms.com/dev/bulkV2"
        
        payload = {
            "route": "otp",
            "sender_id": "BILLKT",
            "message": f"Your BillByteKOT OTP is {otp}. Valid for 5 minutes.",
            "variables_values": otp,
            "flash": "0",
            "numbers": phone_clean
        }
        
        headers = {
            "authorization": FAST2SMS_API_KEY,
            "Content-Type": "application/json"
        }
        
        response = await client.post(url, json=payload, headers=headers)
        response.raise_for_status()
        
        return {
            "success": True,
            "message": "OTP sent via Fast2SMS",
            "response": response.json()
        }


async def send_via_textlocal(phone: str, message: str) -> dict:
    """Send SMS via TextLocal (UK/India)"""
    if not TEXTLOCAL_API_KEY:
        raise ValueError("TextLocal API key not configured")
    
    async with httpx.AsyncClient() as client:
        url = "https://api.textlocal.in/send/"
        
        payload = {
            "apikey": TEXTLOCAL_API_KEY,
            "numbers": phone.replace("+", ""),
            "sender": TEXTLOCAL_SENDER,
            "message": message
        }
        
        response = await client.post(url, data=payload)
        response.raise_for_status()
        
        return {
            "success": True,
            "message": "OTP sent via TextLocal",
            "response": response.json()
        }


async def verify_twilio_otp(phone: str, otp: str) -> dict:
    """
    Verify OTP using Twilio Verify API
    
    Args:
        phone: Phone number with country code
        otp: OTP code entered by user
    
    Returns:
        dict with verification status
    """
    if not all([TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN]):
        raise ValueError("Twilio credentials not configured")
    
    verify_sid = os.getenv("TWILIO_VERIFY_SERVICE_SID")
    if not verify_sid:
        raise ValueError("TWILIO_VERIFY_SERVICE_SID not configured")
    
    async with httpx.AsyncClient() as client:
        url = f"https://verify.twilio.com/v2/Services/{verify_sid}/VerificationCheck"
        
        auth = httpx.BasicAuth(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        
        data = {
            "To": phone,
            "Code": otp
        }
        
        response = await client.post(url, data=data, auth=auth)
        response.raise_for_status()
        
        result = response.json()
        
        return {
            "success": result.get("status") == "approved",
            "status": result.get("status"),
            "valid": result.get("valid", False)
        }


# WhatsApp OTP (using WhatsApp Business API)
async def send_otp_whatsapp(phone: str, otp: str) -> dict:
    """
    Send OTP via WhatsApp Business API
    Requires WhatsApp Business API setup
    """
    # This requires WhatsApp Business API credentials
    # For now, fallback to SMS
    print(f"[WhatsApp OTP] Phone: {phone}, OTP: {otp}")
    return {
        "success": True,
        "message": "WhatsApp OTP feature coming soon. OTP logged to console.",
        "otp": otp if os.getenv("DEBUG_MODE") == "true" else None
    }
