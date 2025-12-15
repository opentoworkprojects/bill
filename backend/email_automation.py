"""
Email Automation System for BillByteKOT
Handles all automated email workflows:
- Registration welcome emails
- Onboarding sequences
- Subscription notifications
- Marketing campaigns
- Trial reminders
"""

import os
import asyncio
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from email_service import send_via_smtp, send_via_sendgrid, send_via_mailgun, send_via_ses

# Email configuration
EMAIL_PROVIDER = os.getenv("EMAIL_PROVIDER", "console")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", "noreply@billbytekot.in")
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "BillByteKOT")


async def send_email(to_email: str, subject: str, html_body: str, text_body: str) -> Dict[str, Any]:
    """
    Send email using configured provider
    Handles all email sending with proper error handling
    """
    # Console mode for development
    if EMAIL_PROVIDER == "console" or EMAIL_PROVIDER == "":
        print(f"\n{'='*60}")
        print(f"📧 EMAIL (Console Mode)")
        print(f"{'='*60}")
        print(f"To: {to_email}")
        print(f"Subject: {subject}")
        print(f"{'='*60}\n")
        return {"success": True, "message": "Email logged to console"}
    
    # Send via configured provider
    try:
        if EMAIL_PROVIDER == "smtp":
            return await send_via_smtp(to_email, subject, html_body, text_body)
        elif EMAIL_PROVIDER == "sendgrid":
            return await send_via_sendgrid(to_email, subject, html_body, text_body)
        elif EMAIL_PROVIDER == "mailgun":
            return await send_via_mailgun(to_email, subject, html_body, text_body)
        elif EMAIL_PROVIDER == "ses":
            return await send_via_ses(to_email, subject, html_body, text_body)
    except Exception as e:
        print(f"Email sending failed: {e}")
        return {"success": False, "message": str(e)}


def get_email_template(content: str, title: str = "BillByteKOT") -> str:
    """Base email template with BillByteKOT branding"""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }}
            .container {{ max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }}
            .header h1 {{ color: #ffffff; margin: 0; font-size: 28px; }}
            .header p {{ color: #ffffff; margin: 10px 0 0 0; opacity: 0.9; }}
            .content {{ padding: 40px 30px; }}
            .button {{ display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }}
            .info-box {{ background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px; }}
            .footer {{ background-color: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }}
            .feature-list {{ list-style: none; padding: 0; }}
            .feature-list li {{ padding: 10px 0; border-bottom: 1px solid #eee; }}
            .feature-list li:last-child {{ border-bottom: none; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🍽️ {title}</h1>
                <p>Restaurant Management System</p>
            </div>
            <div class="content">
                {content}
            </div>
            <div class="footer">
                <p style="margin: 0;"><strong>BillByteKOT</strong> - Smart Restaurant Management<br>© 2025 FinVerge Technologies. All rights reserved.</p>
                <p style="margin: 10px 0 0 0; font-size: 12px;">This is an automated email. Please do not reply.</p>
            </div>
        </div>
    </body>
    </html>
    """


# ============ REGISTRATION & WELCOME EMAILS ============

async def send_welcome_email(email: str, username: str) -> Dict[str, Any]:
    """Send welcome email after registration"""
    subject = f"Welcome to BillByteKOT, {username}! 🎉"
    
    content = f"""
        <h2 style="color: #333;">Welcome aboard, {username}! 👋</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Thank you for joining BillByteKOT! We're excited to help you streamline your restaurant operations.
        </p>
        
        <div class="info-box">
            <p style="margin: 0; color: #666;">
                <strong>🎁 Your 7-Day Free Trial Starts Now!</strong><br>
                Explore all premium features with no credit card required.
            </p>
        </div>
        
        <h3 style="color: #333;">What's Next?</h3>
        <ul class="feature-list">
            <li><strong>✅ Complete Setup:</strong> Add your restaurant details and customize settings</li>
            <li><strong>📋 Add Menu Items:</strong> Build your digital menu in minutes</li>
            <li><strong>🍽️ Create Tables:</strong> Set up your table layout</li>
            <li><strong>👥 Invite Staff:</strong> Add team members with role-based access</li>
            <li><strong>📊 Start Billing:</strong> Process your first order and generate bills</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="https://billbytekot.in/dashboard" class="button">Get Started Now</a>
        </div>
        
        <h3 style="color: #333;">Need Help?</h3>
        <p style="color: #666;">
            • 📚 <a href="https://billbytekot.in/help" style="color: #667eea;">Help Center</a><br>
            • 💬 Email: support@billbytekot.in<br>
            • 📞 Phone: +91-XXXXXXXXXX
        </p>
    """
    
    text_body = f"""
    Welcome to BillByteKOT, {username}!
    
    Thank you for joining! Your 7-day free trial starts now.
    
    What's Next:
    1. Complete Setup - Add restaurant details
    2. Add Menu Items - Build your digital menu
    3. Create Tables - Set up table layout
    4. Invite Staff - Add team members
    5. Start Billing - Process your first order
    
    Get Started: https://billbytekot.in/dashboard
    
    Need Help?
    Help Center: https://billbytekot.in/help
    Email: support@billbytekot.in
    
    ---
    BillByteKOT - Smart Restaurant Management
    """
    
    html_body = get_email_template(content, "Welcome to BillByteKOT")
    return await send_email(email, subject, html_body, text_body)


# ============ ONBOARDING SEQUENCE ============

async def send_onboarding_day1(email: str, username: str) -> Dict[str, Any]:
    """Day 1: Getting Started Guide"""
    subject = "🚀 Day 1: Quick Start Guide for BillByteKOT"
    
    content = f"""
        <h2 style="color: #333;">Hi {username}! Let's Get You Started 🚀</h2>
        <p style="color: #666; font-size: 16px;">
            Welcome to Day 1 of your BillByteKOT journey! Let's set up the basics.
        </p>
        
        <h3 style="color: #333;">Today's Tasks (5 minutes):</h3>
        <div class="info-box">
            <ol style="margin: 0; padding-left: 20px; color: #666;">
                <li><strong>Business Setup:</strong> Add your restaurant name, address, and GST details</li>
                <li><strong>Add 5 Menu Items:</strong> Start with your most popular dishes</li>
                <li><strong>Create Tables:</strong> Set up at least 3 tables</li>
            </ol>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="https://billbytekot.in/settings" class="button">Complete Setup</a>
        </div>
        
        <p style="color: #666;">
            <strong>💡 Pro Tip:</strong> Use bulk upload to add multiple menu items at once!
        </p>
    """
    
    text_body = f"Hi {username}! Day 1: Quick Start Guide. Complete business setup, add menu items, and create tables. Visit: https://billbytekot.in/settings"
    
    html_body = get_email_template(content)
    return await send_email(email, subject, html_body, text_body)


async def send_onboarding_day3(email: str, username: str) -> Dict[str, Any]:
    """Day 3: Advanced Features"""
    subject = "📊 Day 3: Unlock Advanced Features"
    
    content = f"""
        <h2 style="color: #333;">Hi {username}! Ready for More? 📊</h2>
        <p style="color: #666; font-size: 16px;">
            You're doing great! Let's explore some powerful features.
        </p>
        
        <h3 style="color: #333;">Advanced Features to Try:</h3>
        <ul class="feature-list">
            <li><strong>📱 WhatsApp Integration:</strong> Send bills directly to customers</li>
            <li><strong>📊 Reports & Analytics:</strong> Track sales, best-sellers, and trends</li>
            <li><strong>👥 Staff Management:</strong> Add team members with different roles</li>
            <li><strong>💰 Payment Integration:</strong> Accept online payments with Razorpay</li>
            <li><strong>📦 Inventory Tracking:</strong> Monitor stock levels automatically</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="https://billbytekot.in/dashboard" class="button">Explore Features</a>
        </div>
    """
    
    text_body = f"Hi {username}! Day 3: Explore advanced features like WhatsApp integration, reports, staff management, and more. Visit: https://billbytekot.in/dashboard"
    
    html_body = get_email_template(content)
    return await send_email(email, subject, html_body, text_body)


async def send_onboarding_day5(email: str, username: str, trial_days_left: int) -> Dict[str, Any]:
    """Day 5: Trial Reminder"""
    subject = f"⏰ {trial_days_left} Days Left in Your Trial"
    
    content = f"""
        <h2 style="color: #333;">Hi {username}! Your Trial is Going Great! ⏰</h2>
        <p style="color: #666; font-size: 16px;">
            You have <strong>{trial_days_left} days</strong> left in your free trial.
        </p>
        
        <div class="info-box">
            <p style="margin: 0; color: #666;">
                <strong>🎯 Make the Most of Your Trial:</strong><br>
                Try all features before your trial ends!
            </p>
        </div>
        
        <h3 style="color: #333;">Have You Tried?</h3>
        <ul class="feature-list">
            <li>✅ Processing orders with KOT system</li>
            <li>✅ Generating GST-compliant bills</li>
            <li>✅ Viewing sales reports and analytics</li>
            <li>✅ Managing inventory and stock</li>
            <li>✅ Setting up staff accounts</li>
        </ul>
        
        <h3 style="color: #333;">Ready to Subscribe?</h3>
        <p style="color: #666;">
            Continue using BillByteKOT for just <strong>₹499/year</strong> with unlimited bills!
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="https://billbytekot.in/subscription" class="button">Subscribe Now</a>
        </div>
    """
    
    text_body = f"Hi {username}! {trial_days_left} days left in your trial. Subscribe for just ₹499/year. Visit: https://billbytekot.in/subscription"
    
    html_body = get_email_template(content)
    return await send_email(email, subject, html_body, text_body)


# ============ SUBSCRIPTION EMAILS ============

async def send_subscription_success(email: str, username: str, plan: str, amount: float, expires_at: str) -> Dict[str, Any]:
    """Send email after successful subscription purchase"""
    subject = "🎉 Subscription Activated - Welcome to Premium!"
    
    content = f"""
        <h2 style="color: #333;">Congratulations, {username}! 🎉</h2>
        <p style="color: #666; font-size: 16px;">
            Your subscription has been successfully activated!
        </p>
        
        <div class="info-box">
            <p style="margin: 0; color: #666;">
                <strong>📋 Subscription Details:</strong><br>
                Plan: <strong>{plan}</strong><br>
                Amount Paid: <strong>₹{amount}</strong><br>
                Valid Until: <strong>{expires_at}</strong><br>
                Status: <strong style="color: #28a745;">Active ✓</strong>
            </p>
        </div>
        
        <h3 style="color: #333;">What You Get:</h3>
        <ul class="feature-list">
            <li>✅ Unlimited Bills & Orders</li>
            <li>✅ All Premium Features</li>
            <li>✅ Priority Support</li>
            <li>✅ Regular Updates</li>
            <li>✅ Data Backup & Security</li>
            <li>✅ WhatsApp Integration</li>
            <li>✅ Advanced Reports</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="https://billbytekot.in/dashboard" class="button">Start Using Premium</a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
            <strong>Need Invoice?</strong> Download your invoice from the subscription page.
        </p>
    """
    
    text_body = f"""
    Congratulations {username}!
    
    Your subscription is now active!
    
    Plan: {plan}
    Amount: ₹{amount}
    Valid Until: {expires_at}
    
    You now have unlimited access to all premium features.
    
    Start Using: https://billbytekot.in/dashboard
    
    ---
    BillByteKOT - Smart Restaurant Management
    """
    
    html_body = get_email_template(content, "Subscription Activated")
    return await send_email(email, subject, html_body, text_body)


async def send_subscription_expiring(email: str, username: str, days_left: int) -> Dict[str, Any]:
    """Send reminder before subscription expires"""
    subject = f"⏰ Your Subscription Expires in {days_left} Days"
    
    content = f"""
        <h2 style="color: #333;">Hi {username}! ⏰</h2>
        <p style="color: #666; font-size: 16px;">
            Your BillByteKOT subscription will expire in <strong>{days_left} days</strong>.
        </p>
        
        <div class="info-box" style="border-left-color: #ffc107; background-color: #fff3cd;">
            <p style="margin: 0; color: #856404;">
                <strong>⚠️ Action Required:</strong><br>
                Renew now to continue using all premium features without interruption.
            </p>
        </div>
        
        <h3 style="color: #333;">Don't Lose Access To:</h3>
        <ul class="feature-list">
            <li>Unlimited billing and orders</li>
            <li>Advanced reports and analytics</li>
            <li>WhatsApp integration</li>
            <li>Staff management</li>
            <li>Inventory tracking</li>
            <li>Priority support</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="https://billbytekot.in/subscription" class="button">Renew Subscription</a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
            <strong>Special Offer:</strong> Renew now and get 10% off your next year!
        </p>
    """
    
    text_body = f"Hi {username}! Your subscription expires in {days_left} days. Renew now: https://billbytekot.in/subscription"
    
    html_body = get_email_template(content)
    return await send_email(email, subject, html_body, text_body)


async def send_subscription_expired(email: str, username: str) -> Dict[str, Any]:
    """Send email after subscription expires"""
    subject = "❌ Your Subscription Has Expired"
    
    content = f"""
        <h2 style="color: #333;">Hi {username},</h2>
        <p style="color: #666; font-size: 16px;">
            Your BillByteKOT subscription has expired.
        </p>
        
        <div class="info-box" style="border-left-color: #dc3545; background-color: #f8d7da;">
            <p style="margin: 0; color: #721c24;">
                <strong>⚠️ Limited Access:</strong><br>
                You can still view your data, but billing and orders are disabled.
            </p>
        </div>
        
        <h3 style="color: #333;">Reactivate Your Account:</h3>
        <p style="color: #666;">
            Subscribe now to restore full access and continue managing your restaurant seamlessly.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="https://billbytekot.in/subscription" class="button">Reactivate Now</a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
            <strong>Questions?</strong> Contact us at support@billbytekot.in
        </p>
    """
    
    text_body = f"Hi {username}! Your subscription has expired. Reactivate now: https://billbytekot.in/subscription"
    
    html_body = get_email_template(content)
    return await send_email(email, subject, html_body, text_body)


# ============ MARKETING & ENGAGEMENT EMAILS ============

async def send_feature_announcement(email: str, username: str, feature_name: str, feature_description: str) -> Dict[str, Any]:
    """Send email about new features"""
    subject = f"🎉 New Feature: {feature_name}"
    
    content = f"""
        <h2 style="color: #333;">Hi {username}! Exciting News! 🎉</h2>
        <p style="color: #666; font-size: 16px;">
            We've just launched a new feature: <strong>{feature_name}</strong>
        </p>
        
        <div class="info-box">
            <p style="margin: 0; color: #666;">
                {feature_description}
            </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="https://billbytekot.in/dashboard" class="button">Try It Now</a>
        </div>
        
        <p style="color: #666;">
            As always, we're committed to making BillByteKOT the best restaurant management solution for you.
        </p>
    """
    
    text_body = f"Hi {username}! New feature: {feature_name}. {feature_description} Try it: https://billbytekot.in/dashboard"
    
    html_body = get_email_template(content)
    return await send_email(email, subject, html_body, text_body)


async def send_tips_and_tricks(email: str, username: str, tip_title: str, tip_content: str) -> Dict[str, Any]:
    """Send helpful tips to users"""
    subject = f"💡 Pro Tip: {tip_title}"
    
    content = f"""
        <h2 style="color: #333;">Hi {username}! 💡</h2>
        <p style="color: #666; font-size: 16px;">
            Here's a quick tip to help you get more out of BillByteKOT:
        </p>
        
        <h3 style="color: #333;">{tip_title}</h3>
        <div class="info-box">
            <p style="margin: 0; color: #666;">
                {tip_content}
            </p>
        </div>
        
        <p style="color: #666;">
            <strong>Want more tips?</strong> Check out our <a href="https://billbytekot.in/help" style="color: #667eea;">Help Center</a> for guides and tutorials.
        </p>
    """
    
    text_body = f"Hi {username}! Pro Tip: {tip_title}. {tip_content} Learn more: https://billbytekot.in/help"
    
    html_body = get_email_template(content)
    return await send_email(email, subject, html_body, text_body)


async def send_inactive_user_reminder(email: str, username: str, days_inactive: int) -> Dict[str, Any]:
    """Re-engage inactive users"""
    subject = f"We Miss You, {username}! Come Back to BillByteKOT"
    
    content = f"""
        <h2 style="color: #333;">Hi {username}, We Miss You! 👋</h2>
        <p style="color: #666; font-size: 16px;">
            It's been {days_inactive} days since you last used BillByteKOT. We'd love to have you back!
        </p>
        
        <h3 style="color: #333;">What's New Since You Left:</h3>
        <ul class="feature-list">
            <li>🎨 New beautiful receipt themes</li>
            <li>📱 Enhanced WhatsApp integration</li>
            <li>📊 Improved analytics dashboard</li>
            <li>⚡ Faster performance</li>
            <li>🔒 Enhanced security features</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="https://billbytekot.in/login" class="button">Welcome Back</a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
            <strong>Need help getting started again?</strong> Our support team is here for you at support@billbytekot.in
        </p>
    """
    
    text_body = f"Hi {username}! We miss you! Come back to BillByteKOT and see what's new. Login: https://billbytekot.in/login"
    
    html_body = get_email_template(content)
    return await send_email(email, subject, html_body, text_body)


async def send_feedback_request(email: str, username: str) -> Dict[str, Any]:
    """Request feedback from users"""
    subject = "📝 We'd Love Your Feedback!"
    
    content = f"""
        <h2 style="color: #333;">Hi {username}! 📝</h2>
        <p style="color: #666; font-size: 16px;">
            Your opinion matters to us! Help us improve BillByteKOT by sharing your feedback.
        </p>
        
        <div class="info-box">
            <p style="margin: 0; color: #666;">
                <strong>Quick Survey (2 minutes):</strong><br>
                Tell us what you love and what we can improve.
            </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="https://billbytekot.in/contact" class="button">Share Feedback</a>
        </div>
        
        <p style="color: #666;">
            As a thank you, we'll give you <strong>1 month free</strong> when you complete the survey!
        </p>
    """
    
    text_body = f"Hi {username}! Share your feedback and get 1 month free! Survey: https://billbytekot.in/contact"
    
    html_body = get_email_template(content)
    return await send_email(email, subject, html_body, text_body)
