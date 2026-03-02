"""
Billing Automation - WhatsApp Cloud API Integration
Automatically sends bills/receipts to customers via WhatsApp when sales are made
"""

import os
import asyncio
from typing import Dict, Any, Optional, List
from datetime import datetime

# Import WhatsApp Cloud API
from whatsapp_cloud_api import whatsapp_api


class BillingAutomation:
    """
    Handles automatic bill sending via WhatsApp Cloud API
    Triggered on sales entry with customer phone number
    """
    
    def __init__(self):
        self.whatsapp = whatsapp_api
        
    async def send_bill_on_sale(
        self,
        tenant_id: str,
        invoice_id: str,
        customer_phone: str,
        order_data: Dict[str, Any],
        business_data: Dict[str, Any],
        db: Any = None
    ) -> Dict[str, Any]:
        """
        Send bill receipt to customer via WhatsApp when sale is made
        """
        # Validate phone number
        is_valid, result = self.whatsapp.validate_phone_number(customer_phone)
        if not is_valid:
            return {
                "success": False,
                "error": result,
                "status": "validation_failed"
            }
        
        cleaned_phone = result
        
        # Format the bill message
        try:
            message = self.format_bill_message(order_data, business_data)
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to format bill message: {str(e)}",
                "status": "format_failed"
            }
        
        # Check if rate limiting is enabled and queue if needed
        if not await self.whatsapp.rate_limiter.can_send():
            await self.whatsapp.enqueue_message({
                'type': 'text',
                'to_phone': cleaned_phone,
                'message': message,
                'preview_url': True,
                'tenant_id': tenant_id,
                'invoice_id': invoice_id,
                'restaurant_name': business_data.get('restaurant_name', 'Restaurant')
            })
            
            return {
                "success": True,
                "status": "queued",
                "message": "Bill queued due to rate limiting",
                "queue_depth": self.whatsapp.get_queue_depth()
            }
        
        # Send the bill via WhatsApp Cloud API
        try:
            api_phone = cleaned_phone.replace("+", "")
            response = await self.whatsapp.send_text_message(api_phone, message, preview_url=True)
            
            message_id = response.get("messages", [{}])[0].get("id")
            await self.whatsapp.rate_limiter.record_send()
            
            # Store message record if database is available
            if db is not None:
                try:
                    message_record = {
                        "message_id": message_id,
                        "tenant_id": tenant_id,
                        "invoice_id": invoice_id,
                        "customer_phone": cleaned_phone,
                        "restaurant_name": business_data.get('restaurant_name', 'Restaurant'),
                        "message_type": "bill_receipt",
                        "status": "sent",
                        "sent_at": datetime.utcnow(),
                        "message_content": message,
                        "created_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    }
                    await db.whatsapp_messages.insert_one(message_record)
                except Exception as db_error:
                    print(f"Warning: Failed to store message record: {db_error}")
            
            return {
                "success": True,
                "message_id": message_id,
                "status": "sent",
                "customer_phone": cleaned_phone
            }
            
        except Exception as e:
            error_message = str(e)
            
            if db is not None:
                try:
                    failed_record = {
                        "message_id": None,
                        "tenant_id": tenant_id,
                        "invoice_id": invoice_id,
                        "customer_phone": cleaned_phone,
                        "restaurant_name": business_data.get('restaurant_name', 'Restaurant'),
                        "message_type": "bill_receipt",
                        "status": "failed",
                        "sent_at": None,
                        "failed_at": datetime.utcnow(),
                        "error_code": "send_failed",
                        "error_message": error_message,
                        "message_content": message,
                        "created_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    }
                    await db.whatsapp_messages.insert_one(failed_record)
                except Exception as db_error:
                    print(f"Warning: Failed to store failed message record: {db_error}")
            
            return {
                "success": False,
                "error": error_message,
                "status": "failed"
            }
    
    def format_bill_message(
        self,
        order_data: Dict[str, Any],
        business_data: Dict[str, Any]
    ) -> str:
        """Format order data into a WhatsApp bill message"""
        restaurant_name = business_data.get("restaurant_name", "Restaurant")
        currency = business_data.get("currency", "INR")
        currency_symbol = {
            "INR": "₹", "USD": "$", "EUR": "€", "GBP": "£", "AED": "د.إ", "SAR": "﷼"
        }.get(currency, "₹")
        
        order_id = order_data.get("id", "N/A")[:8].upper()
        table_number = order_data.get("table_number", "Counter")
        
        order_date = order_data.get("created_at")
        if isinstance(order_date, str):
            try:
                order_date = datetime.fromisoformat(order_date.replace("Z", "+00:00").replace("+00:00", ""))
            except:
                order_date = datetime.now()
        
        date_str = order_date.strftime('%d %b %Y, %I:%M %p') if isinstance(order_date, datetime) else datetime.now().strftime('%d %b %Y, %I:%M %p')
        
        message = f"🧾 *{restaurant_name}*\n"
        message += "━" * 20 + "\n\n"
        message += f"📋 Bill / Receipt\n"
        message += f"Order #{order_id}\n"
        message += f"📅 {date_str}\n"
        if table_number != 0:
            message += f"🍽️ Table: {table_number}\n"
        message += "\n"
        
        items = order_data.get("items", [])
        if items:
            message += "🍽️ *Order Details:*\n"
            for item in items:
                qty = item.get("quantity", 1)
                name = item.get("name", "Item")
                price = item.get("price", 0)
                line_total = qty * price
                message += f"  {qty}× {name}\n"
                message += f"     {currency_symbol}{line_total:.2f}\n"
            message += "\n"
        
        subtotal = order_data.get("subtotal", 0)
        tax = order_data.get("tax", 0)
        discount = order_data.get("discount", 0)
        total = order_data.get("total", 0)
        
        message += "💰 *Bill Summary:*\n"
        message += f"Subtotal: {currency_symbol}{subtotal:.2f}\n"
        
        if discount > 0:
            message += f"Discount: -{currency_symbol}{discount:.2f}\n"
        
        message += f"Tax: {currency_symbol}{tax:.2f}\n"
        message += "━" * 20 + "\n"
        message += f"*TOTAL: {currency_symbol}{total:.2f}*\n\n"
        
        payment_method = order_data.get("payment_method", "cash")
        is_credit = order_data.get("is_credit", False)
        
        if is_credit:
            message += "📌 *Payment: Credit*\n\n"
        else:
            message += f"💳 *Payment: {payment_method.title()}*\n\n"
        
        message += "✨ Thank you for your patronage!\n\n"
        
        if business_data.get("phone"):
            message += f"📞 {business_data['phone']}\n"
        if business_data.get("address"):
            message += f"📍 {business_data['address']}\n"
        
        message += f"\n_Powered by BillByteKOT_"
        
        if len(message) > 4096:
            items_section = ""
            for item in items:
                qty = item.get("quantity", 1)
                name = item.get("name", "Item")[:20]
                price = item.get("price", 0)
                line_total = qty * price
                item_line = f"  {qty}× {name} - {currency_symbol}{line_total:.2f}\n"
                
                if len(message) + len(items_section) + len(item_line) < 3500:
                    items_section += item_line
                else:
                    items_section += "  ...\n"
                    break
            
            message = f"🧾 *{restaurant_name}*\n"
            message += "━" * 20 + "\n\n"
            message += f"📋 Bill / Receipt\n"
            message += f"Order #{order_id}\n"
            message += f"📅 {date_str}\n\n"
            message += "🍽️ *Order Details:*\n" + items_section + "\n"
            message += "💰 *Bill Summary:*\n"
            message += f"Subtotal: {currency_symbol}{subtotal:.2f}\n"
            if discount > 0:
                message += f"Discount: -{currency_symbol}{discount:.2f}\n"
            message += f"Tax: {currency_symbol}{tax:.2f}\n"
            message += "━" * 20 + "\n"
            message += f"*TOTAL: {currency_symbol}{total:.2f}*\n\n"
            message += "✨ Thank you for your patronage!\n"
            message += f"\n_Powered by BillByteKOT_"
        
        return message


# Singleton instance
billing_automation = BillingAutomation()


async def send_bill_via_whatsapp(
    tenant_id: str,
    invoice_id: str,
    customer_phone: str,
    order_data: Dict[str, Any],
    business_data: Dict[str, Any],
    db: Any = None
) -> Dict[str, Any]:
    """Send bill receipt via WhatsApp Cloud API"""
    return await billing_automation.send_bill_on_sale(
        tenant_id=tenant_id,
        invoice_id=invoice_id,
        customer_phone=customer_phone,
        order_data=order_data,
        business_data=business_data,
        db=db
    )
