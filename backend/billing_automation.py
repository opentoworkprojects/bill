"""
Billing Automation — WhatsApp Cloud API Integration
Auto-sends invoice/receipt to customer after payment via WhatsApp Cloud API.
No wa.me redirects. Cloud API only.
"""

import os
from typing import Dict, Any, Optional
from datetime import datetime

from whatsapp_cloud_api import whatsapp_api


async def send_bill_via_whatsapp(
    tenant_id: str,
    invoice_id: str,
    customer_phone: str,
    order_data: Dict[str, Any],
    business_data: Dict[str, Any],
    db: Any = None
) -> Dict[str, Any]:
    """
    Send invoice/receipt to customer via WhatsApp Cloud API after payment.
    Called automatically on payment completion.
    """
    if not customer_phone:
        return {"success": False, "status": "skipped", "error": "no_phone"}

    if not whatsapp_api.is_configured():
        return {"success": False, "status": "not_configured", "error": "Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN"}

    # Validate and clean phone
    phone = "".join(c for c in customer_phone if c.isdigit())
    if len(phone) == 10:
        phone = "91" + phone
    elif len(phone) == 11 and phone.startswith("0"):
        phone = "91" + phone[1:]

    if len(phone) < 10:
        return {"success": False, "status": "invalid_phone", "error": f"Invalid phone: {customer_phone}"}

    try:
        response = await whatsapp_api.send_receipt(phone, order_data, business_data)
        message_id = response.get("messages", [{}])[0].get("id", "")

        print(f"✅ WA bill sent | invoice={invoice_id} | to={phone} | msg_id={message_id}")

        # Optionally log to DB (non-blocking, best-effort)
        if db is not None:
            try:
                await db.whatsapp_messages.insert_one({
                    "message_id": message_id,
                    "tenant_id": tenant_id,
                    "invoice_id": invoice_id,
                    "customer_phone": phone,
                    "message_type": "bill_receipt",
                    "status": "sent",
                    "sent_at": datetime.utcnow().isoformat(),
                    "created_at": datetime.utcnow().isoformat()
                })
            except Exception as db_err:
                print(f"⚠️ WA log DB error (non-blocking): {db_err}")

        return {"success": True, "message_id": message_id, "status": "sent", "customer_phone": phone}

    except Exception as e:
        error_msg = str(e)
        print(f"❌ WA bill failed | invoice={invoice_id} | to={phone} | error={error_msg}")

        if db is not None:
            try:
                await db.whatsapp_messages.insert_one({
                    "message_id": None,
                    "tenant_id": tenant_id,
                    "invoice_id": invoice_id,
                    "customer_phone": phone,
                    "message_type": "bill_receipt",
                    "status": "failed",
                    "error": error_msg,
                    "failed_at": datetime.utcnow().isoformat(),
                    "created_at": datetime.utcnow().isoformat()
                })
            except Exception as db_err:
                print(f"⚠️ WA fail-log DB error (non-blocking): {db_err}")

        return {"success": False, "status": "failed", "error": error_msg}
