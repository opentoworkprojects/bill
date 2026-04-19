"""
WhatsApp Cloud API Client — BillByteKOT
Sends messages via Meta WhatsApp Business API (Cloud API).
No wa.me redirects. Cloud API only.
"""

import os
import httpx
import asyncio
import json
import logging
from typing import Optional, Dict, Any


class WhatsAppCloudAPI:
    """Lightweight async WhatsApp Cloud API client using httpx."""

    # Error codes for classification
    ERROR_CODE_WINDOW_RESTRICTION = {131047, 131026}  # 24-hour window restriction
    ERROR_CODE_INVALID_TEMPLATE = {131031, 132001}  # Invalid/missing template or translation
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
        self.template_status_pending = os.getenv("WHATSAPP_TEMPLATE_STATUS_PENDING", "order_pending").strip()
        self.template_status_preparing = os.getenv("WHATSAPP_TEMPLATE_STATUS_PREPARING", "order_preparing").strip()
        self.template_status_ready = os.getenv("WHATSAPP_TEMPLATE_STATUS_READY", "order_ready").strip()
        self.template_status_completed = os.getenv("WHATSAPP_TEMPLATE_STATUS_COMPLETED", "payment_receipt").strip()
        self.template_status_cancelled = os.getenv("WHATSAPP_TEMPLATE_STATUS_CANCELLED", "").strip()
        self._log_template_configuration()

    def _log_template_configuration(self) -> None:
        """Log the effective template mapping used by the running process."""
        logging.warning(
            "WhatsApp template config | lang=%s | bill=%s | pending=%s | preparing=%s | ready=%s | completed=%s | cancelled=%s",
            self.template_lang or "<empty>",
            self.template_bill_confirmation or "<empty>",
            self.template_status_pending or "<empty>",
            self.template_status_preparing or "<empty>",
            self.template_status_ready or "<empty>",
            self.template_status_completed or "<empty>",
            self.template_status_cancelled or "<empty>",
        )

    def is_configured(self) -> bool:
        return bool(self.phone_number_id and self.access_token)

    def is_template_configured(self) -> bool:
        return bool(self.template_name and self.template_lang)

    def get_status_template_name(self, status: str) -> str:
        """Get status template name with emergency safety check."""
        status = (status or "").lower()
        mapping = {
            "pending": self.template_status_pending,
            "preparing": self.template_status_preparing,
            "ready": self.template_status_ready,
            "completed": self.template_status_completed,
            "cancelled": self.template_status_cancelled,
        }
        configured_template = mapping.get(status, "")
        
        # EMERGENCY SAFETY CHECK: Warn if template is risky
        if configured_template and not self._is_utility_template(configured_template):
            print(f"⚠️ EMERGENCY WARNING: Status template '{configured_template}' for '{status}' may be risky")
            print(f"   This may fail outside 24-hour customer service window")
            # Don't override status templates as they have specific meanings
            # But provide clear warning
        
        return configured_template

    def get_bill_template_name(self) -> str:
        """Get bill template name with emergency safety override."""
        configured_template = self.template_bill_confirmation
        
        # EMERGENCY OVERRIDE: Force safe template if configured template is risky
        if not self._is_utility_template(configured_template):
            print(f"🚨 EMERGENCY OVERRIDE: Bill template '{configured_template}' is risky")
            print(f"   Forcing use of 'payment_receipt' (verified UTILITY template)")
            return "payment_receipt"
        
        return configured_template

    def _is_utility_template(self, template_name: str) -> bool:
        """Check if template is UTILITY category (required for outside 24h window).
        
        UTILITY templates: order updates, receipts, alerts
        MARKETING templates: promotions (require 24h window)
        
        EMERGENCY FIX: More conservative validation to prevent 24h window errors
        """
        # More conservative utility template patterns - only truly transactional templates
        strict_utility_patterns = [
            "payment_receipt", "order_preparing", "order_ready", "order_completed"
        ]
        
        # Templates that might contain marketing content (be more cautious)
        potentially_marketing = [
            "bill_confirmation"  # Often contains promotional content
        ]
        
        template_lower = template_name.lower()
        
        # If template might be marketing, be conservative
        if any(pattern in template_lower for pattern in potentially_marketing):
            print(f"⚠️ CONSERVATIVE: Template '{template_name}' may contain marketing content")
            print(f"   Treating as potentially MARKETING to avoid 24h window errors")
            return False
        
        # Only allow clearly transactional templates
        is_utility = any(pattern in template_lower for pattern in strict_utility_patterns)
        
        if not is_utility:
            print(f"⚠️ Template '{template_name}' not in strict UTILITY list")
            print(f"   Strict UTILITY patterns: {strict_utility_patterns}")
        
        return is_utility

    def clean_phone(self, phone: str) -> str:
        """Normalize phone to digits only with country code."""
        cleaned = "".join(c for c in phone if c.isdigit())
        if len(cleaned) == 10:
            cleaned = "91" + cleaned
        elif len(cleaned) == 11 and cleaned.startswith("0"):
            cleaned = "91" + cleaned[1:]
        return cleaned

    async def check_customer_service_window(self, phone: str) -> bool:
        """
        Check if customer service window is open for this phone number.
        
        EMERGENCY FIX: Basic implementation - in production this should
        check actual conversation history from database.
        """
        # TODO: Implement proper customer service window checking
        # This would require checking when customer last messaged us
        # For now, return False to be conservative
        print(f"⚠️ Customer service window check not implemented for {phone}")
        print(f"   Assuming window is CLOSED - only UTILITY templates will work")
        return False

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
                detail = e.response.json() if e.response.content else {"error": {"message": str(e)}}
                raise Exception(f"WhatsApp API error: {json.dumps(detail)}")

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

        # EMERGENCY FIX: Check customer service window status
        window_open = await self.check_customer_service_window(phone)
        is_utility = self._is_utility_template(template_name)

        # Validate and log parameters
        print(f"📨 WA template prep | to={phone} | template={template_name} | params_count={len(params)} | params={params}")
        print(f"🕐 Customer service window open: {window_open}")
        print(f"🏷️ Template appears UTILITY: {is_utility}")
        
        # EMERGENCY FIX: Validate template compatibility with window status
        if not window_open and not is_utility:
            print(f"🚨 CRITICAL: Template '{template_name}' is not UTILITY and window is closed!")
            print(f"   This will likely fail with 131047/131026 error")
            print(f"   Consider using a verified UTILITY template instead")
        elif window_open:
            print(f"✅ Customer service window is open - any template should work")
        elif is_utility:
            print(f"✅ Template appears UTILITY - should work outside 24h window")
        
        # Check if template appears to be UTILITY category (required for outside 24h window)
        if not is_utility:
            print(f"⚠️ WARNING: Template '{template_name}' may not be UTILITY category!")
            print(f"   Only UTILITY templates work outside 24h window. MARKETING templates require 24h.")
            print(f"   Check Meta Business Manager: Template must be category=UTILITY")
            print(f"   EMERGENCY FIX: This template will be treated as MARKETING - may fail outside 24h window")
        else:
            print(f"✅ Template '{template_name}' appears to be UTILITY category - should work outside 24h window")

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

        print(f"📦 Payload: {json.dumps(payload, indent=2)}")

        last_error = None
        for attempt in range(self.MAX_RETRY_ATTEMPTS):
            try:
                result = await self._post(payload)
                msg_id = result.get("messages", [{}])[0].get("id", "")
                print(f"✅ WA template sent | to={phone} | template={template_name} | params={len(params)} | msg_id={msg_id}")
                return result

            except Exception as e:
                error_msg = str(e)
                last_error = e

                error_response = {}
                try:
                    if "WhatsApp API error:" in error_msg:
                        json_str = error_msg.replace("WhatsApp API error:", "").strip()
                        error_response = json.loads(json_str)
                except Exception:
                    pass

                classification = self._classify_error(error_response)
                error_code = classification.get("code")
                is_retryable = classification.get("is_retryable")

                print(
                    f"❌ WA template failed | to={phone} | template={template_name} | "
                    f"error_code={error_code} | attempt={attempt + 1}/{self.MAX_RETRY_ATTEMPTS} | "
                    f"retryable={is_retryable} | error={error_msg}"
                )

                if error_code in {131047, 131026}:
                    print("\n" + "=" * 60)
                    print("🚨 24-HOUR MESSAGING WINDOW RESTRICTION (Error 131047/131026)")
                    print("=" * 60)
                    print(f"Template: {template_name}")
                    print(f"Parameters Sent: {len(params)} → {params}")
                    print(f"Template assumed UTILITY: {self._is_utility_template(template_name)}")
                    print("\n💡 EMERGENCY FIX ANALYSIS:")
                    print("1. Template may be classified as MARKETING by Meta (not UTILITY)")
                    print("2. MARKETING templates require 24-hour customer service window")
                    print("3. Customer must message you first to open the window")
                    print("\n🔧 IMMEDIATE SOLUTIONS:")
                    print("- Use only verified UTILITY templates (payment_receipt, order_preparing, order_ready, order_completed)")
                    print("- Check Meta Business Manager for actual template category")
                    print("- Wait for customer to message you first, then respond within 24 hours")
                    print("=" * 60 + "\n")
                    
                    # Don't retry 24-hour window errors - they won't succeed
                    break
                elif error_code in {131031, 132001}:
                    print("\n" + "=" * 60)
                    print("🚨 INVALID TEMPLATE NAME / LANGUAGE (Error 131031/132001)")
                    print("=" * 60)
                    print(f"Template: '{template_name}' not found in the requested language or not approved")
                    print("💡 SOLUTIONS:")
                    print("1. Check exact template name in Meta Business Manager")
                    print("2. Ensure template is APPROVED and available in the requested language")
                    print("3. Check the language code matches the template translation exactly")
                    print("=" * 60 + "\n")

                if not is_retryable:
                    print(f"⚠️ Permanent failure detected (error_code={error_code}), not retrying")
                    raise

                if attempt < self.MAX_RETRY_ATTEMPTS - 1:
                    delay = self.RETRY_DELAYS[attempt]
                    print(f"⏳ Retrying in {delay}s...")
                    await asyncio.sleep(delay)
                else:
                    print(f"❌ Max retries ({self.MAX_RETRY_ATTEMPTS}) reached, giving up")
                    raise

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
        # EMERGENCY FIX: Use safe template instead of bill_confirmation
        template_name = self.get_bill_template_name()
        
        # Check if the configured template is safe
        if not self._is_utility_template(template_name):
            print(f"🚨 EMERGENCY FIX: Template '{template_name}' is not safe for business-initiated messaging")
            print(f"   Switching to 'payment_receipt' (verified UTILITY template)")
            template_name = "payment_receipt"
        
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

        print(f"📧 EMERGENCY FIX: Using template '{template_name}' for receipt to {to_phone}")
        
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
        tracking_url: Optional[str] = None,
        amount: str = "",
        customer_name: str = ""
    ) -> Dict[str, Any]:
        """Send order status update via template only."""
        template_name = self.get_status_template_name(status)
        if not template_name:
            raise ValueError(f"WhatsApp status template not configured for status '{status}'.")

        # EMERGENCY FIX: Check if template is safe for business-initiated messaging
        if not self._is_utility_template(template_name):
            print(f"🚨 EMERGENCY FIX: Status template '{template_name}' for status '{status}' is not safe")
            print(f"   This may fail outside 24-hour customer service window")
            # Don't auto-replace status templates as they have specific meanings
            # Just warn and proceed - user should fix template configuration

        oid = str(order_id)[:8].upper()
        name = restaurant_name or "Restaurant"

        params = [name, oid]
        if amount:
            params.append(amount)

        print(f"📱 Sending order status '{status}' using template '{template_name}' to {to_phone}")

        return await self.send_template_message(
            to_phone,
            template_name,
            params,
            self.template_lang
        )

    async def send_otp(self, to_phone: str, otp: str, restaurant_name: str = "BillByteKOT") -> Dict[str, Any]:
        """Send OTP verification message."""
        msg = f"🔐 *{restaurant_name}*\n\nYour verification code is:\n\n*{otp}*\n\nValid for 5 minutes. Do not share this code.\n\n_Powered by BillByteKOT_"
        return await self.send_text_message(to_phone, msg)


whatsapp_api = WhatsAppCloudAPI()


async def send_whatsapp_receipt(
    phone: str,
    order: Dict[str, Any],
    business: Dict[str, Any],
    receipt_url: Optional[str] = None
) -> Dict[str, Any]:
    """Send receipt via WhatsApp Cloud API."""
    print(f"🔍 EMERGENCY DEBUG: send_whatsapp_receipt called for phone {phone}")
    print(f"   Order ID: {order.get('id', 'unknown')}")
    print(f"   Receipt URL: {receipt_url}")
    
    try:
        result = await whatsapp_api.send_receipt(phone, order, business, receipt_url=receipt_url)
        print(f"✅ EMERGENCY DEBUG: send_receipt succeeded for {phone}")
        return result
    except Exception as e:
        print(f"❌ EMERGENCY DEBUG: send_receipt failed for {phone}: {e}")
        
        # Check if it's a 24-hour window error
        error_str = str(e)
        if "131047" in error_str or "131026" in error_str:
            print(f"🚨 EMERGENCY DEBUG: 24-hour window error detected for {phone}")
            print(f"   Error: {error_str}")
            print(f"   This confirms the template category issue")
        
        raise


async def send_whatsapp_status(
    phone: str,
    order_id: str,
    status: str,
    restaurant_name: str,
    tracking_url: Optional[str] = None,
    amount: str = ""
) -> Dict[str, Any]:
    """Send order status update via WhatsApp Cloud API."""
    return await whatsapp_api.send_order_status(
        phone,
        order_id,
        status,
        restaurant_name,
        tracking_url,
        amount=amount
    )


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
