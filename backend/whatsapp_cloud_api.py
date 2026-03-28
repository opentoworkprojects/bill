"""
WhatsApp Cloud API Client — BillByteKOT
Sends messages via Meta WhatsApp Business API (Cloud API).
No wa.me redirects. Cloud API only.
"""

import os
import httpx
import asyncio
import json
from typing import Optional, Dict, Any


class WhatsAppCloudAPI:
    """Lightweight async WhatsApp Cloud API client using httpx."""

    # Template category mapping for WhatsApp Cloud API
    # UTILITY templates bypass the 24-hour messaging window restriction
    UTILITY_TEMPLATES = {
        "bill_confirmation",
        "payment_receipt",
        "order_preparing",
        "order_ready"
    }
    
    # Error codes for classification
    ERROR_CODE_WINDOW_RESTRICTION = {131047, 131026}  # 24-hour window restriction
    ERROR_CODE_INVALID_TEMPLATE = {131031}  # Invalid template
    ERROR_CODE_RATE_LIMIT = {131051}  # Rate limit exceeded
    
    # Retry configuration
    MAX_RETRY_ATTEMPTS = 3
    RETRY_DELAYS = [1.0, 2.0, 4.0]  # Exponential backoff: 1s, 2s, 4s

    def __init__(self):
        self.phone_number_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
        self.access_token = os.getenv("WHATSAPP_ACCESS_TOKEN", "")
        self.api_version = os.getenv("WHATSAPP_API_VERSION", "v18.0")
        self.base_url = f"https://graph.facebook.com/{self.api_version}"
        self.template_name = os.getenv("WHATSAPP_TEMPLATE_NAME", "").strip()
        self.template_lang = os.getenv("WHATSAPP_TEMPLATE_LANG", "en_US").strip()
        # Transactional templates (defaults match approved names)
        self.template_bill_confirmation = os.getenv("WHATSAPP_TEMPLATE_BILL_CONFIRMATION", "bill_confirmation").strip()
        self.template_bill_uses_receipt_url = os.getenv("WHATSAPP_TEMPLATE_BILL_USES_RECEIPT_URL", "false").strip().lower() in ("1", "true", "yes", "on")
        self.template_bill_use_url_button = os.getenv("WHATSAPP_TEMPLATE_BILL_USE_URL_BUTTON", "false").strip().lower() in ("1", "true", "yes", "on")
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

    def _is_utility_template(self, template_name: str) -> bool:
        """Check if template is a utility template that bypasses 24-hour window."""
        return template_name in self.UTILITY_TEMPLATES

    def _classify_error(self, error_response: dict) -> Dict[str, Any]:
        """Classify WhatsApp API error and determine if it's retryable."""
        error_data = error_response.get("error", {})
        error_code = error_data.get("code")
        error_message = error_data.get("message", "")
        
        classification = {
            "code": error_code,
            "message": error_message,
            "is_window_restriction": error_code in self.ERROR_CODE_WINDOW_RESTRICTION,
            "is_invalid_template": error_code in self.ERROR_CODE_INVALID_TEMPLATE,
            "is_rate_limit": error_code in self.ERROR_CODE_RATE_LIMIT,
            "is_retryable": False
        }
        
        # Determine if error is retryable
        # Retry on rate limits and transient failures, but NOT on permanent failures
        if error_code in self.ERROR_CODE_RATE_LIMIT:
            classification["is_retryable"] = True
        elif error_code in self.ERROR_CODE_WINDOW_RESTRICTION:
            classification["is_retryable"] = False  # Permanent failure
        elif error_code in self.ERROR_CODE_INVALID_TEMPLATE:
            classification["is_retryable"] = False  # Permanent failure
        
        return classification

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

    async def send_template_message(
        self,
        to_phone: str,
        template_name: str,
        params: list,
        language: str = "en_US",
        button_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send a template message (required for business-initiated messaging)."""
        if not self.is_configured():
            raise ValueError("WhatsApp Cloud API not configured. Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN.")

        phone = self.clean_phone(to_phone)
        components = [{
            "type": "body",
            "parameters": [{"type": "text", "text": str(p)} for p in params]
        }]
        if button_url:
            components.append({
                "type": "button",
                "sub_type": "url",
                "index": "0",
                "parameters": [{"type": "text", "text": str(button_url)}]
            })

        # Build template object
        # NOTE: Category is set when creating the template in Meta Business Manager,
        # NOT when sending the message. The API does not accept "category" parameter.
        template_obj = {
            "name": template_name,
            "language": {"code": language},
            "components": components
        }

        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": phone,
            "type": "template",
            "template": template_obj
        }

        # Implement retry logic with exponential backoff
        last_error = None
        for attempt in range(self.MAX_RETRY_ATTEMPTS):
            try:
                result = await self._post(payload)
                msg_id = result.get("messages", [{}])[0].get("id", "")

                # Enhanced logging
                is_utility = self._is_utility_template(template_name)
                category_label = "UTILITY" if is_utility else "STANDARD"
                print(f"✅ WA template sent | to={phone} | template={template_name} | category={category_label} | msg_id={msg_id}")

                return result

            except Exception as e:
                error_msg = str(e)
                last_error = e

                # Try to parse error response for classification
                error_response = {}
                try:
                    # Extract JSON from error message if present
                    if "WhatsApp API error:" in error_msg:
                        json_str = error_msg.replace("WhatsApp API error:", "").strip()
                        error_response = json.loads(json_str)
                except:
                    pass

                # Classify error
                classification = self._classify_error(error_response)
                error_code = classification.get("code")
                is_retryable = classification.get("is_retryable")

                # Enhanced error logging
                is_utility = self._is_utility_template(template_name)
                category_label = "UTILITY" if is_utility else "STANDARD"
                print(f"❌ WA template failed | to={phone} | template={template_name} | category={category_label} | "
                      f"error_code={error_code} | attempt={attempt + 1}/{self.MAX_RETRY_ATTEMPTS} | "
                      f"retryable={is_retryable} | error={error_msg}")

                # Check if error is retryable
                if not is_retryable:
                    # Permanent failure - don't retry
                    print(f"⚠️ Permanent failure detected (error_code={error_code}), not retrying")
                    raise

                # Check if we have more attempts
                if attempt < self.MAX_RETRY_ATTEMPTS - 1:
                    # Wait before retry with exponential backoff
                    delay = self.RETRY_DELAYS[attempt]
                    print(f"⏳ Retrying in {delay}s...")
                    await asyncio.sleep(delay)
                else:
                    # Max retries reached
                    print(f"❌ Max retries ({self.MAX_RETRY_ATTEMPTS}) reached, giving up")
                    raise

        # Should not reach here, but just in case
        if last_error:
            raise last_error
        raise Exception("Unknown error in send_template_message")


    async def send_receipt(
        self,
        to_phone: str,
        order: Dict[str, Any],
        business: Dict[str, Any],
        receipt_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send receipt using approved template only."""
        template_name = self.get_bill_template_name()
        if not template_name:
            raise ValueError("WhatsApp bill template not configured.")

        currency = business.get("currency", "INR")
        customer_name = (order.get("customer_name") or "Customer")
        invoice_number = order.get("invoice_number")
        order_id = str(invoice_number or order.get("id", ""))[:8].upper()
        total = order.get("total", 0)
        amount = f"{currency} {total:.2f}"
        body_params = [customer_name, order_id, amount]
        if receipt_url and self.template_bill_uses_receipt_url:
            body_params.append(receipt_url)

        return await self.send_template_message(
            to_phone,
            template_name,
            body_params,
            self.template_lang,
            button_url=receipt_url if receipt_url and self.template_bill_use_url_button else None
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

async def send_whatsapp_receipt(
    phone: str,
    order: Dict[str, Any],
    business: Dict[str, Any],
    receipt_url: Optional[str] = None
) -> Dict[str, Any]:
    """Send receipt via WhatsApp Cloud API."""
    return await whatsapp_api.send_receipt(phone, order, business, receipt_url=receipt_url)


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
