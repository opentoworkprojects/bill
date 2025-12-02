"""
Email Service for OTP delivery
Supports multiple email providers: SMTP, SendGrid, Mailgun, AWS SES
"""

import os
import smtplib
import httpx
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

# Email Configuration
EMAIL_PROVIDER = os.getenv("EMAIL_PROVIDER", "smtp")  # smtp, sendgrid, mailgun, ses
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", SMTP_USER)
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "BillByteKOT")

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
MAILGUN_API_KEY = os.getenv("MAILGUN_API_KEY")
MAILGUN_DOMAIN = os.getenv("MAILGUN_DOMAIN")
AWS_SES_REGION = os.getenv("AWS_SES_REGION", "us-east-1")


async def send_otp_email(email: str, otp: str, username: str = "User") -> dict:
    """
    Send OTP via configured email provider
    
    Args:
        email: Recipient email address
        otp: 6-digit OTP code
        username: User's name for personalization
    
    Returns:
        dict with success status and message
    """
    
    subject = f"Your BillByteKOT Login OTP: {otp}"
    
    # HTML email template
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #f5f5f5;
                margin: 0;
                padding: 0;
            }}
            .container {{
                max-width: 600px;
                margin: 40px auto;
                background-color: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }}
            .header {{
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 40px 20px;
                text-align: center;
            }}
            .header h1 {{
                color: #ffffff;
                margin: 0;
                font-size: 28px;
            }}
            .content {{
                padding: 40px 30px;
            }}
            .otp-box {{
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: #ffffff;
                font-size: 36px;
                font-weight: bold;
                letter-spacing: 8px;
                text-align: center;
                padding: 20px;
                border-radius: 8px;
                margin: 30px 0;
            }}
            .info {{
                background-color: #f8f9fa;
                border-left: 4px solid #667eea;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
            }}
            .footer {{
                background-color: #f8f9fa;
                padding: 20px;
                text-align: center;
                color: #6c757d;
                font-size: 14px;
            }}
            .button {{
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: #ffffff;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 6px;
                margin: 20px 0;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🍽️ BillByteKOT</h1>
                <p style="color: #ffffff; margin: 10px 0 0 0;">Restaurant Management System</p>
            </div>
            
            <div class="content">
                <h2 style="color: #333;">Hello {username}! 👋</h2>
                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                    You requested to log in to your BillByteKOT account. Use the OTP below to complete your login:
                </p>
                
                <div class="otp-box">
                    {otp}
                </div>
                
                <div class="info">
                    <p style="margin: 0; color: #666;">
                        <strong>⏰ Valid for 5 minutes</strong><br>
                        This OTP will expire in 5 minutes for security reasons.
                    </p>
                </div>
                
                <p style="color: #666; font-size: 14px; margin-top: 30px;">
                    If you didn't request this OTP, please ignore this email or contact support if you have concerns.
                </p>
                
                <div style="text-align: center; margin-top: 30px;">
                    <a href="https://finverge.tech" class="button">Visit BillByteKOT</a>
                </div>
            </div>
            
            <div class="footer">
                <p style="margin: 0;">
                    <strong>BillByteKOT</strong> - Smart Restaurant Management<br>
                    © 2025 FinVerge Technologies. All rights reserved.
                </p>
                <p style="margin: 10px 0 0 0; font-size: 12px;">
                    This is an automated email. Please do not reply.
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Plain text fallback
    text_body = f"""
    Hello {username}!
    
    Your BillByteKOT Login OTP is: {otp}
    
    This OTP is valid for 5 minutes.
    
    If you didn't request this OTP, please ignore this email.
    
    ---
    BillByteKOT - Smart Restaurant Management
    © 2025 FinVerge Technologies
    """
    
    try:
        if EMAIL_PROVIDER == "smtp":
            return await send_via_smtp(email, subject, html_body, text_body)
        elif EMAIL_PROVIDER == "sendgrid":
            return await send_via_sendgrid(email, subject, html_body, text_body)
        elif EMAIL_PROVIDER == "mailgun":
            return await send_via_mailgun(email, subject, html_body, text_body)
        elif EMAIL_PROVIDER == "ses":
            return await send_via_ses(email, subject, html_body, text_body)
        else:
            # Console mode for development
            print(f"\n{'='*60}")
            print(f"📧 EMAIL (Console Mode)")
            print(f"{'='*60}")
            print(f"To: {email}")
            print(f"Subject: {subject}")
            print(f"OTP: {otp}")
            print(f"{'='*60}\n")
            return {"success": True, "message": "OTP logged to console (dev mode)", "otp": otp}
    
    except Exception as e:
        print(f"Email sending failed: {e}")
        # Fallback to console
        print(f"\n[EMAIL FALLBACK] To: {email}, OTP: {otp}")
        return {"success": False, "message": str(e), "otp": otp if os.getenv("DEBUG_MODE") == "true" else None}


async def send_via_smtp(email: str, subject: str, html_body: str, text_body: str) -> dict:
    """Send email via SMTP (Gmail, Outlook, etc.)"""
    if not all([SMTP_USER, SMTP_PASSWORD]):
        raise ValueError("SMTP credentials not configured")
    
    # Create message
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
    msg['To'] = email
    
    # Attach both plain text and HTML versions
    part1 = MIMEText(text_body, 'plain')
    part2 = MIMEText(html_body, 'html')
    msg.attach(part1)
    msg.attach(part2)
    
    # Send email
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(msg)
    
    return {
        "success": True,
        "message": "OTP sent via SMTP",
        "provider": "smtp"
    }


async def send_via_sendgrid(email: str, subject: str, html_body: str, text_body: str) -> dict:
    """Send email via SendGrid API"""
    if not SENDGRID_API_KEY:
        raise ValueError("SendGrid API key not configured")
    
    async with httpx.AsyncClient() as client:
        url = "https://api.sendgrid.com/v3/mail/send"
        
        payload = {
            "personalizations": [{
                "to": [{"email": email}],
                "subject": subject
            }],
            "from": {
                "email": SMTP_FROM_EMAIL,
                "name": SMTP_FROM_NAME
            },
            "content": [
                {"type": "text/plain", "value": text_body},
                {"type": "text/html", "value": html_body}
            ]
        }
        
        headers = {
            "Authorization": f"Bearer {SENDGRID_API_KEY}",
            "Content-Type": "application/json"
        }
        
        response = await client.post(url, json=payload, headers=headers)
        response.raise_for_status()
        
        return {
            "success": True,
            "message": "OTP sent via SendGrid",
            "provider": "sendgrid"
        }


async def send_via_mailgun(email: str, subject: str, html_body: str, text_body: str) -> dict:
    """Send email via Mailgun API"""
    if not all([MAILGUN_API_KEY, MAILGUN_DOMAIN]):
        raise ValueError("Mailgun credentials not configured")
    
    async with httpx.AsyncClient() as client:
        url = f"https://api.mailgun.net/v3/{MAILGUN_DOMAIN}/messages"
        
        data = {
            "from": f"{SMTP_FROM_NAME} <mailgun@{MAILGUN_DOMAIN}>",
            "to": email,
            "subject": subject,
            "text": text_body,
            "html": html_body
        }
        
        auth = httpx.BasicAuth("api", MAILGUN_API_KEY)
        
        response = await client.post(url, data=data, auth=auth)
        response.raise_for_status()
        
        return {
            "success": True,
            "message": "OTP sent via Mailgun",
            "provider": "mailgun"
        }


async def send_via_ses(email: str, subject: str, html_body: str, text_body: str) -> dict:
    """Send email via AWS SES"""
    try:
        import boto3
        from botocore.exceptions import ClientError
        
        ses_client = boto3.client('ses', region_name=AWS_SES_REGION)
        
        response = ses_client.send_email(
            Source=f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>",
            Destination={'ToAddresses': [email]},
            Message={
                'Subject': {'Data': subject},
                'Body': {
                    'Text': {'Data': text_body},
                    'Html': {'Data': html_body}
                }
            }
        )
        
        return {
            "success": True,
            "message": "OTP sent via AWS SES",
            "provider": "ses",
            "message_id": response['MessageId']
        }
    
    except ImportError:
        raise ValueError("boto3 not installed. Run: pip install boto3")
    except ClientError as e:
        raise ValueError(f"AWS SES error: {e.response['Error']['Message']}")
