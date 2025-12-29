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


async def send_via_resend(email: str, subject: str, html_body: str, text_body: str) -> dict:
    """Send email via Resend API (Free - 100 emails/day)"""
    config = get_config()
    api_key = config["resend_api_key"]
    
    if not api_key:
        raise ValueError("RESEND_API_KEY not configured")
    
    print(f"📧 Sending email via Resend to {email}")
    
    async with httpx.AsyncClient() as client:
        url = "https://api.resend.com/emails"
        
        payload = {
            "from": "BillByteKOT <shiv@billbytekot.in>",
            "to": [email],
            "subject": subject,
            "html": html_body,
            "text": text_body
        }
        
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


async def send_email(email: str, subject: str, html_body: str, text_body: str) -> dict:
    """Send email using configured provider with fallback"""
    config = get_config()
    provider = config["provider"].lower()
    
    print(f"📧 Email provider: {provider}")
    
    # Try primary provider first
    try:
        if provider == "resend":
            return await send_via_resend(email, subject, html_body, text_body)
        elif provider == "smtp":
            return await send_via_smtp(email, subject, html_body, text_body)
        else:
            return await send_via_resend(email, subject, html_body, text_body)
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
