"""
Email Service for OTP delivery
Supports: Resend (free), SMTP, SendGrid, Mailgun, AWS SES
"""

import os
import ssl
import smtplib
import httpx
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Email Configuration - Read fresh each time
def get_config():
    return {
        "provider": os.getenv("EMAIL_PROVIDER", "resend"),
        "resend_api_key": os.getenv("RESEND_API_KEY"),
        "smtp_host": os.getenv("SMTP_HOST", "smtp.gmail.com"),
        "smtp_port": int(os.getenv("SMTP_PORT", "587")),
        "smtp_user": os.getenv("SMTP_USER"),
        "smtp_password": os.getenv("SMTP_PASSWORD"),
        "smtp_from_email": os.getenv("SMTP_FROM_EMAIL", os.getenv("SMTP_USER", "noreply@billbytekot.in")),
        "smtp_from_name": os.getenv("SMTP_FROM_NAME", "BillByteKOT"),
    }


async def send_via_resend(email: str, subject: str, html_body: str, text_body: str, from_email: str = None, reply_to: str = None) -> dict:
    """Send email via Resend API (Free - 100 emails/day)
    
    Args:
        email: Recipient email address
        subject: Email subject
        html_body: HTML content
        text_body: Plain text content
        from_email: Sender email (default: support@billbytekot.in)
        reply_to: Reply-to email address for receiving replies
    """
    config = get_config()
    api_key = config["resend_api_key"]
    
    if not api_key:
        raise ValueError("RESEND_API_KEY not configured")
    
    print(f"📧 Sending email via Resend to {email}")
    
    # Use custom from_email if provided, otherwise default to support@billbytekot.in
    sender = from_email or "BillByteKOT <support@billbytekot.in>"
    
    async with httpx.AsyncClient() as client:
        url = "https://api.resend.com/emails"
        
        payload = {
            "from": sender,
            "to": [email],
            "subject": subject,
            "html": html_body,
            "text": text_body
        }
        
        # Add reply_to if specified (enables receiving replies at support@billbytekot.in)
        if reply_to:
            payload["reply_to"] = reply_to
        else:
            # Default reply-to for all emails
            payload["reply_to"] = "support@billbytekot.in"
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        try:
            response = await client.post(url, json=payload, headers=headers, timeout=30)
            response_data = response.json() if response.text else {}
            
            print(f"📧 Resend response: {response.status_code} - {response_data}")
            
            if response.status_code in [200, 201]:
                print(f"✅ Email sent via Resend to {email}")
                return {
                    "success": True,
                    "message": "Email sent via Resend",
                    "provider": "resend",
                    "id": response_data.get("id")
                }
            else:
                error_msg = response_data.get("message", response.text)
                print(f"❌ Resend error: {error_msg}")
                raise Exception(f"Resend API error: {error_msg}")
                
        except httpx.TimeoutException:
            print("❌ Resend timeout")
            raise Exception("Resend API timeout")
        except Exception as e:
            print(f"❌ Resend exception: {e}")
            raise


async def send_via_smtp(email: str, subject: str, html_body: str, text_body: str) -> dict:
    """Send email via SMTP"""
    config = get_config()
    
    if not all([config["smtp_user"], config["smtp_password"]]):
        raise ValueError("SMTP credentials not configured")
    
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = f"{config['smtp_from_name']} <{config['smtp_from_email']}>"
    msg['To'] = email
    msg.attach(MIMEText(text_body, 'plain'))
    msg.attach(MIMEText(html_body, 'html'))
    
    # Try SSL first (port 465), then TLS (port 587)
    for port, use_ssl in [(465, True), (587, False)]:
        try:
            if use_ssl:
                context = ssl.create_default_context()
                with smtplib.SMTP_SSL(config["smtp_host"], port, context=context, timeout=10) as server:
                    server.login(config["smtp_user"], config["smtp_password"])
                    server.send_message(msg)
            else:
                with smtplib.SMTP(config["smtp_host"], port, timeout=10) as server:
                    server.starttls()
                    server.login(config["smtp_user"], config["smtp_password"])
                    server.send_message(msg)
            
            print(f"✅ Email sent via SMTP (port {port})")
            return {"success": True, "message": f"Email sent via SMTP (port {port})", "provider": "smtp"}
        except Exception as e:
            print(f"❌ SMTP port {port} failed: {e}")
            continue
    
    raise Exception("All SMTP ports failed")


async def send_email(email: str, subject: str, html_body: str, text_body: str, from_email: str = None, reply_to: str = None) -> dict:
    """Send email using configured provider with fallback
    
    Args:
        email: Recipient email address
        subject: Email subject
        html_body: HTML content
        text_body: Plain text content
        from_email: Sender email (default: support@billbytekot.in)
        reply_to: Reply-to email address for receiving replies
    """
    config = get_config()
    provider = config["provider"].lower()
    
    print(f"📧 Email provider: {provider}")
    
    # Try primary provider first
    try:
        if provider == "resend":
            return await send_via_resend(email, subject, html_body, text_body, from_email, reply_to)
        elif provider == "smtp":
            return await send_via_smtp(email, subject, html_body, text_body)
        else:
            return await send_via_resend(email, subject, html_body, text_body, from_email, reply_to)
    except Exception as e:
        print(f"❌ Primary email failed ({provider}): {e}")
        
        # Fallback to SMTP if Resend fails
        if provider == "resend" and config["smtp_user"] and config["smtp_password"]:
            print("📧 Trying SMTP fallback...")
            try:
                return await send_via_smtp(email, subject, html_body, text_body)
            except Exception as smtp_error:
                print(f"❌ SMTP fallback also failed: {smtp_error}")
        
        return {"success": False, "message": str(e)}


async def send_support_email(email: str, subject: str, html_body: str, text_body: str) -> dict:
    """Send email from support@billbytekot.in with reply-to enabled"""
    return await send_email(
        email, 
        subject, 
        html_body, 
        text_body, 
        from_email="BillByteKOT Support <support@billbytekot.in>",
        reply_to="support@billbytekot.in"
    )


async def send_otp_email(email: str, subject: str, html_body: str, text_body: str) -> dict:
    """Send OTP email from support@billbytekot.in"""
    return await send_email(
        email, 
        subject, 
        html_body, 
        text_body, 
        from_email="BillByteKOT <support@billbytekot.in>",
        reply_to="support@billbytekot.in"
    )


async def send_receipt_email_with_html(
    to_email: str,
    user_name: str,
    business_name: str,
    receipt_number: str,
    amount: float,
    valid_from: str,
    valid_until: str,
    payment_id: str,
    payment_method: str,
    html_content: str
) -> dict:
    """Send receipt PDF as HTML email"""
    
    subject = f"BillByteKOT Payment Receipt - {receipt_number}"
    
    # Create a wrapper email with the receipt HTML embedded
    email_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }}
            .email-container {{ max-width: 700px; margin: 0 auto; }}
            .email-header {{ background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 25px; text-align: center; border-radius: 12px 12px 0 0; }}
            .email-header h1 {{ margin: 0; font-size: 24px; }}
            .email-header p {{ margin: 8px 0 0; opacity: 0.9; font-size: 14px; }}
            .email-body {{ background: white; padding: 25px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }}
            .greeting {{ font-size: 16px; color: #333; margin-bottom: 15px; }}
            .summary-box {{ background: #f8f5ff; border: 1px solid #e9d5ff; border-radius: 8px; padding: 20px; margin: 20px 0; }}
            .summary-row {{ display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e9d5ff; }}
            .summary-row:last-child {{ border-bottom: none; }}
            .summary-label {{ color: #666; font-size: 14px; }}
            .summary-value {{ color: #333; font-weight: 600; font-size: 14px; }}
            .summary-value.highlight {{ color: #7c3aed; }}
            .summary-value.amount {{ color: #10b981; font-size: 18px; }}
            .cta-section {{ text-align: center; margin: 25px 0; }}
            .cta-button {{ display: inline-block; background: #7c3aed; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; }}
            .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
            .receipt-section {{ margin-top: 30px; padding-top: 20px; border-top: 2px solid #eee; }}
            .receipt-title {{ font-size: 14px; color: #666; margin-bottom: 15px; text-align: center; }}
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="email-header">
                <h1>🍽️ Payment Receipt</h1>
                <p>Thank you for your subscription!</p>
            </div>
            
            <div class="email-body">
                <p class="greeting">Dear {user_name},</p>
                <p style="color: #666; font-size: 14px; line-height: 1.6;">
                    Thank you for subscribing to BillByteKOT Premium! Your payment has been successfully received. 
                    Below is your payment receipt for your records.
                </p>
                
                <div class="summary-box">
                    <div class="summary-row">
                        <span class="summary-label">Receipt Number</span>
                        <span class="summary-value highlight">{receipt_number}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Business Name</span>
                        <span class="summary-value">{business_name}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Payment ID</span>
                        <span class="summary-value">{payment_id}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Payment Method</span>
                        <span class="summary-value">{payment_method.upper()}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Valid From</span>
                        <span class="summary-value">{valid_from}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Valid Until</span>
                        <span class="summary-value" style="color: #10b981;">{valid_until}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Amount Paid</span>
                        <span class="summary-value amount">₹{amount:.2f}</span>
                    </div>
                </div>
                
                <div class="cta-section">
                    <a href="https://billbytekot.in/login" class="cta-button">Login to Dashboard</a>
                </div>
                
                <p style="color: #666; font-size: 13px; text-align: center;">
                    Your subscription is now active. Enjoy all premium features!
                </p>
            </div>
            
            <div class="footer">
                <p><strong>BillByteKOT</strong> - Smart Restaurant Management System</p>
                <p>support@billbytekot.in | +91-8310832669</p>
                <p>www.billbytekot.in</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    text_body = f"""
BillByteKOT Payment Receipt

Dear {user_name},

Thank you for subscribing to BillByteKOT Premium! Your payment has been successfully received.

Receipt Details:
- Receipt Number: {receipt_number}
- Business Name: {business_name}
- Payment ID: {payment_id}
- Payment Method: {payment_method.upper()}
- Valid From: {valid_from}
- Valid Until: {valid_until}
- Amount Paid: ₹{amount:.2f}

Your subscription is now active. Login at https://billbytekot.in/login to access all premium features.

Thank you for choosing BillByteKOT!

Best regards,
BillByteKOT Team
support@billbytekot.in | +91-8310832669
    """
    
    return await send_email(
        to_email,
        subject,
        email_html,
        text_body,
        from_email="BillByteKOT <support@billbytekot.in>",
        reply_to="support@billbytekot.in"
    )
