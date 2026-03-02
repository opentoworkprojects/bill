"""
WhatsApp Cloud API Integration for BillByteKOT
Sends receipts and notifications directly via Meta's WhatsApp Business API
No user login required - fully automated
"""

import os
import httpx
import json
import asyncio
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from collections import deque


class RateLimiter:
    """Rate limiter for WhatsApp API to prevent hitting limits"""
    
    def __init__(self, max_requests: int = 100, window_seconds: int = 24*60*60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = deque()
        self._lock = asyncio.Lock()
    
    async def can_send(self) -> bool:
        """Check if we can send a message without hitting rate limit"""
        async with self._lock:
            now = datetime.now()
            cutoff = now - timedelta(seconds=self.window_seconds)
            
            # Remove old requests outside the window
            while self.requests and self.requests[0] < cutoff:
                self.requests.popleft()
            
            return len(self.requests) < self.max_requests
    
    async def record_send(self):
        """Record a send attempt"""
        async with self._lock:
            self.requests.append(datetime.now())


class MessageQueue:
    """Queue for messages when rate limited"""
    
    def __init__(self):
        self._queue: List[Dict[str, Any]] = []
        self._lock = asyncio.Lock()
    
    async def enqueue_message(self, message_data: Dict[str, Any]):
        """Add a message to the queue"""
        async with self._lock:
            self._queue.append(message_data)
    
    async def dequeue_message(self) -> Optional[Dict[str, Any]]:
        """Get the next message from the queue"""
        async with self._lock:
            if self._queue:
                return self._queue.pop(0)
            return None
    
    def get_queue_depth(self) -> int:
        """Get current queue size"""
        return len(self._queue)


class WhatsAppCloudAPI:
    """WhatsApp Cloud API client for sending messages"""
    
    def __init__(self):
        self.phone_number_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
        self.access_token = os.getenv("WHATSAPP_ACCESS_TOKEN")
        self.business_account_id = os.getenv("WHATSAPP_BUSINESS_ACCOUNT_ID")
        self.api_version = os.getenv("WHATSAPP_API_VERSION", "v18.0")
        self.base_url = f"https://graph.facebook.com/{self.api_version}"
        
        # Initialize rate limiter and message queue
        self.rate_limiter = RateLimiter(max_requests=100, window_seconds=24*60*60)  # 100 messages per day
        self.message_queue = MessageQueue()
        
    def is_configured(self) -> bool:
        """Check if WhatsApp Cloud API is properly configured"""
        return bool(self.phone_number_id and self.access_token)
    
    def validate_phone_number(self, phone: str) -> tuple:
        """
        Validate and clean phone number for WhatsApp API
        
        Args:
            phone: Raw phone number (may include +, spaces, dashes)
            
        Returns:
            Tuple of (is_valid, cleaned_phone_or_error_message)
        """
        if not phone:
            return (False, "Phone number is required")
        
        # Remove common formatting characters
        cleaned = phone.replace("+", "").replace(" ", "").replace("-", "").replace("(", "").replace(")", "").replace(".", "")
        
        # Remove any non-digit characters
        cleaned = ''.join(c for c in cleaned if c.isdigit())
        
        # Validate length
        if len(cleaned) < 10:
            return (False, f"Phone number too short: {cleaned}")
        
        # If it starts with 91 (India) and has 12 digits, keep as is
        # If it doesn't have country code, assume India (+91)
        if len(cleaned) == 10:
            cleaned = "91" + cleaned
        elif len(cleaned) == 11 and cleaned.startswith("0"):
            cleaned = "91" + cleaned[1:]
        elif len(cleaned) == 12 and cleaned.startswith("91"):
            pass  # Already has country code
        elif len(cleaned) == 13 and cleaned.startswith("+91"):
            cleaned = cleaned[1:]
        else:
            # Try to use as-is if longer than 12
            if len(cleaned) > 12:
                pass  # Use as-is for other countries
            else:
                return (False, f"Invalid phone number format: {phone}")
        
        return (True, cleaned)  # Return without + prefix for direct API use
    
    async def enqueue_message(self, message_data: Dict[str, Any]):
        """Add a message to the queue when rate limited"""
        await self.message_queue.enqueue_message(message_data)
    
    def get_queue_depth(self) -> int:
        """Get current queue depth"""
        return self.message_queue.get_queue_depth()
    
    async def process_queue(self):
        """Process queued messages (call periodically)"""
        while True:
            msg = await self.message_queue.dequeue_message()
            if not msg:
                break
            try:
                to_phone = msg.get('to_phone', '')
                message = msg.get('message', '')
                preview_url = msg.get('preview_url', True)
                
                if to_phone and message:
                    await self.send_text_message(to_phone, message, preview_url)
            except Exception as e:
                print(f"Error processing queued message: {e}")
    
    async def send_text_message(
        self, 
        to_phone: str, 
        message: str,
        preview_url: bool = True
    ) -> Dict[str, Any]:
        """
        Send a text message via WhatsApp Cloud API
        
        Args:
            to_phone: Recipient phone number (with country code, no + sign)
            message: Message text to send
            preview_url: Enable URL preview in message
            
        Returns:
            API response dict with message_id if successful
        """
        if not self.is_configured():
            raise ValueError("WhatsApp Cloud API not configured. Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN")
        
        # Clean phone number (remove spaces, dashes, plus signs)
        to_phone = to_phone.replace("+", "").replace(" ", "").replace("-", "")
        
        url = f"{self.base_url}/{self.phone_number_id}/messages"
        
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to_phone,
            "type": "text",
            "text": {
                "preview_url": preview_url,
                "body": message
            }
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                error_detail = e.response.json() if e.response.text else str(e)
                raise Exception(f"WhatsApp API error: {error_detail}")
            except Exception as e:
                raise Exception(f"Failed to send WhatsApp message: {str(e)}")
    
    async def send_template_message(
        self,
        to_phone: str,
        template_name: str,
        language_code: str = "en",
        components: Optional[list] = None
    ) -> Dict[str, Any]:
        """
        Send a pre-approved template message
        
        Args:
            to_phone: Recipient phone number
            template_name: Name of approved template
            language_code: Template language (en, hi, etc.)
            components: Template parameters
            
        Returns:
            API response dict
        """
        if not self.is_configured():
            raise ValueError("WhatsApp Cloud API not configured")
        
        to_phone = to_phone.replace("+", "").replace(" ", "").replace("-", "")
        
        url = f"{self.base_url}/{self.phone_number_id}/messages"
        
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "messaging_product": "whatsapp",
            "to": to_phone,
            "type": "template",
            "template": {
                "name": template_name,
                "language": {
                    "code": language_code
                }
            }
        }
        
        if components:
            payload["template"]["components"] = components
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                error_detail = e.response.json() if e.response.text else str(e)
                raise Exception(f"WhatsApp API error: {error_detail}")
            except Exception as e:
                raise Exception(f"Failed to send template: {str(e)}")
    
    async def send_receipt(
        self,
        to_phone: str,
        order_data: Dict[str, Any],
        business_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Send a formatted receipt via WhatsApp
        
        Args:
            to_phone: Customer phone number
            order_data: Order details dict
            business_data: Business settings dict
            
        Returns:
            API response dict
        """
        # Format receipt message
        restaurant_name = business_data.get("restaurant_name", "Restaurant")
        currency = business_data.get("currency", "INR")
        currency_symbol = {"INR": "₹", "USD": "$", "EUR": "€", "GBP": "£"}.get(currency, "₹")
        
        message = f"""🧾 *{restaurant_name}*
━━━━━━━━━━━━━━━━━━━━

📋 Order #{order_data['id'][:8].upper()}
📅 {datetime.now().strftime('%d %b %Y, %I:%M %p')}

"""
        
        # Add items
        if order_data.get('items'):
            message += "🍽️ *Items:*\n"
            for item in order_data['items']:
                qty = item['quantity']
                name = item['name']
                price = item['price'] * qty
                message += f"  {qty}× {name} - {currency_symbol}{price:.2f}\n"
            message += "\n"
        
        # Add totals
        subtotal = order_data.get('subtotal', 0)
        tax = order_data.get('tax', 0)
        discount = order_data.get('discount', 0)
        total = order_data.get('total', 0)
        
        message += f"💰 *Bill Summary:*\n"
        message += f"Subtotal: {currency_symbol}{subtotal:.2f}\n"
        if discount > 0:
            message += f"Discount: -{currency_symbol}{discount:.2f}\n"
        message += f"Tax: {currency_symbol}{tax:.2f}\n"
        message += f"━━━━━━━━━━━━━━━━━━━━\n"
        message += f"*Total: {currency_symbol}{total:.2f}*\n\n"
        
        # Add footer
        message += f"✨ Thank you for dining with us!\n"
        if business_data.get('website'):
            message += f"🌐 {business_data['website']}\n"
        if business_data.get('phone'):
            message += f"📞 {business_data['phone']}\n"
        
        message += f"\n_Powered by BillByteKOT_"
        
        return await self.send_text_message(to_phone, message, preview_url=True)
    
    async def send_order_status(
        self,
        to_phone: str,
        order_id: str,
        status: str,
        restaurant_name: str,
        tracking_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send order status update notification
        
        Args:
            to_phone: Customer phone number
            order_id: Order ID
            status: Order status (pending, preparing, ready, completed)
            restaurant_name: Restaurant name
            tracking_url: Optional tracking URL
            
        Returns:
            API response dict
        """
        status_emojis = {
            "pending": "⏳",
            "preparing": "👨‍🍳",
            "ready": "✅",
            "completed": "🎉",
            "cancelled": "❌"
        }
        
        status_messages = {
            "pending": "Your order has been received!",
            "preparing": "Your order is being prepared!",
            "ready": "Your order is ready for pickup!",
            "completed": "Order completed. Thank you!",
            "cancelled": "Your order has been cancelled."
        }
        
        emoji = status_emojis.get(status, "📋")
        status_msg = status_messages.get(status, "Order status updated")
        
        message = f"""{emoji} *{restaurant_name}*

{status_msg}

📋 Order #{order_id[:8].upper()}
🕐 {datetime.now().strftime('%I:%M %p')}
"""
        
        if tracking_url:
            message += f"\n🔗 Track your order:\n{tracking_url}"
        
        message += f"\n\n_Powered by BillByteKOT_"
        
        return await self.send_text_message(to_phone, message, preview_url=True)
    
    async def send_otp(
        self,
        to_phone: str,
        otp: str,
        restaurant_name: str = "BillByteKOT"
    ) -> Dict[str, Any]:
        """
        Send OTP for login verification
        
        Args:
            to_phone: Phone number
            otp: OTP code
            restaurant_name: Restaurant name
            
        Returns:
            API response dict
        """
        message = f"""🔐 *{restaurant_name}*

Your verification code is:

*{otp}*

Valid for 5 minutes.
Do not share this code with anyone.

_Powered by BillByteKOT_"""
        
        return await self.send_text_message(to_phone, message, preview_url=False)


# Singleton instance
whatsapp_api = WhatsAppCloudAPI()


# Helper functions for easy use
async def send_whatsapp_receipt(
    phone: str,
    order: Dict[str, Any],
    business: Dict[str, Any]
) -> Dict[str, Any]:
    """Send receipt via WhatsApp Cloud API"""
    return await whatsapp_api.send_receipt(phone, order, business)


async def send_whatsapp_status(
    phone: str,
    order_id: str,
    status: str,
    restaurant_name: str,
    tracking_url: Optional[str] = None
) -> Dict[str, Any]:
    """Send order status update via WhatsApp"""
    return await whatsapp_api.send_order_status(
        phone, order_id, status, restaurant_name, tracking_url
    )


async def send_whatsapp_otp(
    phone: str,
    otp: str,
    restaurant_name: str = "BillByteKOT"
) -> Dict[str, Any]:
    """Send OTP via WhatsApp"""
    return await whatsapp_api.send_otp(phone, otp, restaurant_name)


async def test_whatsapp_connection() -> Dict[str, Any]:
    """Test WhatsApp Cloud API connection"""
    if not whatsapp_api.is_configured():
        return {
            "success": False,
            "error": "WhatsApp Cloud API not configured",
            "configured": False
        }
    
    try:
        # Send a test message to a real phone number
        test_phone = os.getenv("WHATSAPP_TEST_PHONE", "").strip()
        if not test_phone:
            return {
                "success": False,
                "configured": True,
                "error": "WHATSAPP_TEST_PHONE not set"
            }
        result = await whatsapp_api.send_text_message(
            test_phone,
            "✅ WhatsApp Cloud API connection test successful!"
        )
        return {
            "success": True,
            "configured": True,
            "message_id": result.get("messages", [{}])[0].get("id"),
            "phone_number_id": whatsapp_api.phone_number_id
        }
    except Exception as e:
        return {
            "success": False,
            "configured": True,
            "error": str(e)
        }
