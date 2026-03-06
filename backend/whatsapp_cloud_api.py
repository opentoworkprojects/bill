"""
WhatsApp Cloud API Client — BillByteKOT
Sends messages via Meta WhatsApp Business API (Cloud API).
No wa.me redirects. Cloud API only.
"""

import os
import httpx
from typing import Optional, Dict, Any


class WhatsAppCloudAPI:
    """Lightweight async WhatsApp Cloud API client using httpx."""

    def __init__(self):
        self.phone_number_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
        self.access_token = os.getenv("WHATSAPP_ACCESS_TOKEN", "")
        self.api_version = os.getenv("WHATSAPP_API_VERSION", "v18.0")
        self.base_url = f"https://graph.facebook.com/{self.api_version}"
        self.template_name = os.getenv("WHATSAPP_TEMPLATE_NAME", "").strip()
        self.template_lang = os.getenv("WHATSAPP_TEMPLATE_LANG", "en_US").strip()
        # Transactional templates (defaults match approved names)
        self.template_bill_confirmation = os.getenv("WHATSAPP_TEMPLATE_BILL_CONFIRMATION", "bill_confirmation").strip()
        self.template_status_pending = os.getenv("WHATSAPP_TEMPLATE_STATUS_PENDING", "").strip() or self.template_bill_confirmation
        self.template_status_preparing = os.getenv("WHATSAPP_TEMPLATE_STATUS_PREPARING", "order_preparing").strip()
        self.template_status_ready = os.getenv("WHATSAPP_TEMPLATE_STATUS_READY", "order_ready").strip()
        self.template_status_completed = os.getenv("WHATSAPP_TEMPLATE_STATUS_COMPLETED", "payment_receipt").strip()
        self.template_status_cancelled = os.getenv("WHATSAPP_TEMPLATE_STATUS_CANCELLED", "").strip()

    def is_configured(self) -> bool:
        return bool(self.phone_number_id and self.access_token)

    def is_template_configured(self) -> bool:
        return bool(self.template_name and self.template_lang)

    def get_status_template_name(self, status: str) -> str:
        status = (status or "").lower()
        mapping = {
            "pending": self.template_status_pending,
            "preparing": self.template_status_preparing,
            "ready": self.template_status_ready,
            "completed": self.template_status_completed,
            "cancelled": self.template_status_cancelled,
        }
        return mapping.get(status, "")

    def get_bill_template_name(self) -> str:
        return self.template_bill_confirmation


    def clean_phone(self, phone: str) -> str:
        """Normalize phone to digits only with country code."""
        cleaned = "".join(c for c in phone if c.isdigit())
        if len(cleaned) == 10:
            cleaned = "91" + cleaned
        elif len(cleaned) == 11 and cleaned.startswith("0"):
            cleaned = "91" + cleaned[1:]
        return cleaned

    async def _post(self, payload: dict) -> dict:
        """Execute POST to WhatsApp Cloud API."""
        url = f"{self.base_url}/{self.phone_number_id}/messages"
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                resp = await client.post(url, headers=headers, json=payload)
                resp.raise_for_status()
                return resp.json()
            except httpx.HTTPStatusError as e:
                detail = e.response.json() if e.response.content else str(e)
                raise Exception(f"WhatsApp API error: {detail}")

    async def send_text_message(self, to_phone: str, message: str) -> Dict[str, Any]:
        """Send a plain text message."""
        if not self.is_configured():
            raise ValueError("WhatsApp Cloud API not configured. Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN.")

        phone = self.clean_phone(to_phone)
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": phone,
            "type": "text",
            "text": {"preview_url": False, "body": message}
        }
        result = await self._post(payload)
        msg_id = result.get("messages", [{}])[0].get("id", "")
        print(f"✅ WA sent | to={phone} | msg_id={msg_id}")
        return result

    async def send_template_message(self, to_phone: str, template_name: str, params: list, language: str = "en_US") -> Dict[str, Any]:
        """Send a template message (required for business-initiated messaging)."""
        if not self.is_configured():
            raise ValueError("WhatsApp Cloud API not configured. Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN.")

        phone = self.clean_phone(to_phone)
        components = [{
            "type": "body",
            "parameters": [{"type": "text", "text": str(p)} for p in params]
        }]
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": phone,
            "type": "template",
            "template": {
                "name": template_name,
                "language": {"code": language},
                "components": components
            }
        }
        result = await self._post(payload)
        msg_id = result.get("messages", [{}])[0].get("id", "")
        print(f"✅ WA template sent | to={phone} | template={template_name} | msg_id={msg_id}")
        return result

    async def send_receipt(self, to_phone: str, order: Dict[str, Any], business: Dict[str, Any]) -> Dict[str, Any]:
        """Send receipt using approved template only."""
        template_name = self.get_bill_template_name()
        if not template_name:
            raise ValueError("WhatsApp bill template not configured.")

        currency = business.get("currency", "INR")
        customer_name = (order.get("customer_name") or "Customer")
        order_id = str(order.get("id", ""))[:8].upper()
        total = order.get("total", 0)
        amount = f"{currency} {total:.2f}"

        return await self.send_template_message(
            to_phone,
            template_name,
            [customer_name, order_id, amount],
            self.template_lang
        )

    async def send_order_status(
        self,
        to_phone: str,
        order_id: str,
        status: str,
        restaurant_name: str,
        tracking_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send order status update via template only."""
        template_name = self.get_status_template_name(status)
        if not template_name:
            raise ValueError(f"WhatsApp status template not configured for status '{status}'.")

        oid = str(order_id)[:8].upper()
        name = restaurant_name or "Restaurant"
        return await self.send_template_message(
            to_phone,
            template_name,
            [name, oid],
            self.template_lang
        )

    async def send_otp(self, to_phone: str, otp: str, restaurant_name: str = "BillByteKOT") -> Dict[str, Any]:
        """Send OTP verification message."""
        msg = f"🔐 *{restaurant_name}*\n\nYour verification code is:\n\n*{otp}*\n\nValid for 5 minutes. Do not share this code.\n\n_Powered by BillByteKOT_"
        return await self.send_text_message(to_phone, msg)


# ─── Singleton ───────────────────────────────────────────────────────────────

whatsapp_api = WhatsAppCloudAPI()


# ─── Helper functions ────────────────────────────────────────────────────────

async def send_whatsapp_receipt(phone: str, order: Dict[str, Any], business: Dict[str, Any]) -> Dict[str, Any]:
    """Send receipt via WhatsApp Cloud API."""
    return await whatsapp_api.send_receipt(phone, order, business)


async def send_whatsapp_status(
    phone: str,
    order_id: str,
    status: str,
    restaurant_name: str,
    tracking_url: Optional[str] = None
) -> Dict[str, Any]:
    """Send order status update via WhatsApp Cloud API."""
    return await whatsapp_api.send_order_status(phone, order_id, status, restaurant_name, tracking_url)


async def send_whatsapp_otp(phone: str, otp: str, restaurant_name: str = "BillByteKOT") -> Dict[str, Any]:
    """Send OTP via WhatsApp Cloud API."""
    return await whatsapp_api.send_otp(phone, otp, restaurant_name)


async def test_whatsapp_connection() -> Dict[str, Any]:
    """Test WhatsApp Cloud API connectivity."""
    if not whatsapp_api.is_configured():
        return {"success": False, "configured": False, "error": "Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN"}

    test_phone = os.getenv("WHATSAPP_TEST_PHONE", "").strip()
    if not test_phone:
        return {"success": False, "configured": True, "error": "Set WHATSAPP_TEST_PHONE to run connection test"}

    try:
        result = await whatsapp_api.send_text_message(test_phone, "✅ WhatsApp Cloud API connection test successful!")
        return {
            "success": True,
            "configured": True,
            "message_id": result.get("messages", [{}])[0].get("id"),
            "phone_number_id": whatsapp_api.phone_number_id
        }
    except Exception as e:
        return {"success": False, "configured": True, "error": str(e)}
