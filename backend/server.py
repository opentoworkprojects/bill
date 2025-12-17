import base64
import json
import logging
import os
import ssl
import uuid
import httpx
import asyncio
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

import jwt
import razorpay
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, FastAPI, File, HTTPException, UploadFile, status
from fastapi.responses import Response
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from pydantic import BaseModel, ConfigDict, Field
from starlette.middleware.cors import CORSMiddleware

try:
    from emergentintegrations.llm.chat import LlmChat, UserMessage

    _LLM_AVAILABLE = True
except Exception:
    _LLM_AVAILABLE = False

# Automation features - no external dependencies needed

    class LlmChat:
        def __init__(self, *args, **kwargs):
            pass

        def with_model(self, *args, **kwargs):
            return self

        async def send_message(self, *args, **kwargs):
            raise RuntimeError("LLM integration unavailable")

    class UserMessage:
        def __init__(self, text):
            self.text = text


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# MongoDB connection with SSL configuration
mongo_url = os.getenv(
    "MONGO_URL",
    "mongodb+srv://shivshankarkumar281_db_user:RNdGNCCyBtj1d5Ar@retsro-ai.un0np9m.mongodb.net/?retryWrites=true&w=majority&authSource=admin&readPreference=primary&serverSelectionTimeoutMS=10000&connectTimeoutMS=15000&socketTimeoutMS=20000&appName=retsro-ai",
)

# Clean up and optimize MongoDB Atlas connection string
if "mongodb+srv://" in mongo_url:
    # Remove duplicate parameters and optimize for Atlas
    base_url = mongo_url.split("?")[0] if "?" in mongo_url else mongo_url

    # Standard Atlas parameters for optimal connection
    params = [
        "retryWrites=true",
        "w=majority",
        "tls=true",
        "tlsInsecure=true",
        "authSource=admin",
        "readPreference=primary",
    ]

    mongo_url = f"{base_url}?{'&'.join(params)}"

# Configure MongoDB client with OPTIMIZED settings for speed
try:
    if (
        "mongodb+srv://" in mongo_url
        or "ssl=true" in mongo_url
        or "tls=true" in mongo_url
    ):
        # OPTIMIZED MongoDB Atlas connection with connection pooling
        client = AsyncIOMotorClient(
            mongo_url,
            tls=True,
            tlsInsecure=True,
            # Performance optimizations
            maxPoolSize=50,  # Increased connection pool
            minPoolSize=10,  # Keep connections warm
            maxIdleTimeMS=45000,  # Keep connections alive
            serverSelectionTimeoutMS=3000,  # Faster timeout
            connectTimeoutMS=5000,  # Faster connection
            socketTimeoutMS=20000,  # Socket timeout
            retryWrites=True,  # Auto-retry failed writes
            retryReads=True,  # Auto-retry failed reads
            # Compression for faster data transfer
            compressors="snappy,zlib",
        )
    else:
        # For local or non-SSL connections
        client = AsyncIOMotorClient(
            mongo_url,
            maxPoolSize=50,
            minPoolSize=10,
            maxIdleTimeMS=45000,
        )
except Exception as e:
    print(f"MongoDB client creation failed: {e}")
    # Fallback to basic client with minimal TLS settings
    try:
        client = AsyncIOMotorClient(
            mongo_url, 
            tls=True, 
            tlsInsecure=True, 
            serverSelectionTimeoutMS=3000,
            maxPoolSize=50
        )
    except Exception as e2:
        print(f"Fallback client creation failed: {e2}")
        client = AsyncIOMotorClient(mongo_url)

db = client[os.getenv("DB_NAME", "restrobill")]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
JWT_SECRET = os.getenv("JWT_SECRET", "default-jwt-secret-please-change-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

app = FastAPI(
    title="BillByteKOT API",
    description="Restaurant Billing & KOT Management System",
    version="1.3.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    # Performance optimizations
    swagger_ui_parameters={"defaultModelsExpandDepth": -1},
)
api_router = APIRouter(prefix="/api")

# In-memory cache for frequently accessed data
from functools import lru_cache
from time import time

# Simple cache decorator
_cache = {}
_cache_ttl = {}

def cache_response(ttl_seconds=60):
    """Cache decorator for API responses"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Create cache key from function name and args
            cache_key = f"{func.__name__}:{str(args)}:{str(kwargs)}"
            current_time = time()
            
            # Check if cached and not expired
            if cache_key in _cache and cache_key in _cache_ttl:
                if current_time < _cache_ttl[cache_key]:
                    return _cache[cache_key]
            
            # Execute function and cache result
            result = await func(*args, **kwargs)
            _cache[cache_key] = result
            _cache_ttl[cache_key] = current_time + ttl_seconds
            
            return result
        return wrapper
    return decorator


# Dynamic CORS origin checker
def is_allowed_origin(origin: str) -> bool:
    """Check if the origin is allowed for CORS"""
    allowed_patterns = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://restro-ai.onrender.com",
        "https://restro-ai-u9kz.vercel.app",
        "https://billbytekot.in",
        "https://www.billbytekot.in",
    ]

    # Check exact matches
    if origin in allowed_patterns:
        return True

    # Check pattern matches
    domain_patterns = [".vercel.app", ".netlify.app", ".onrender.com", ".render.com", ".billbytekot.in"]

    for pattern in domain_patterns:
        if origin.endswith(pattern):
            return True

    # Allow localhost with any port for development
    if origin.startswith("http://localhost:") or origin.startswith("http://127.0.0.1:"):
        return True

    return False


# Add CORS middleware to allow frontend connections
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://restro-ai.onrender.com",
    "https://billbytekot.in",
    "https://www.billbytekot.in",
    # exact current frontend origin:
    "https://restro-ai-u9kz-ed0v8idw3-shivs-projects-db2d52eb.vercel.app",
]

# CRITICAL: Add CORS middleware BEFORE any routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins temporarily to fix CORS
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# Currency symbols mapping
CURRENCY_SYMBOLS = {
    "INR": "₹",
    "USD": "$",
    "EUR": "€",
    "GBP": "£",
    "AED": "د.إ",
    "SAR": "﷼",
    "JPY": "¥",
    "CNY": "¥",
    "AUD": "A$",
    "CAD": "C$",
}


# Models
class PrintCustomization(BaseModel):
    """Print customization settings"""
    paper_width: str = "80mm"  # 58mm, 80mm, 110mm, custom
    custom_width: Optional[int] = None  # in mm if paper_width is "custom"
    font_size: int = 12  # 8-16px
    line_spacing: float = 1.3  # 1.0-2.0
    margin_top: int = 5  # in mm
    margin_bottom: int = 5  # in mm
    margin_left: int = 5  # in mm
    margin_right: int = 5  # in mm
    show_logo: bool = True
    show_qr_code: bool = False
    qr_code_content: str = "website"  # website, order_id, custom
    custom_qr_text: Optional[str] = None
    header_style: str = "centered"  # centered, left, right
    item_layout: str = "detailed"  # detailed, compact, minimal
    show_item_notes: bool = True
    show_preparation_time: bool = False
    show_server_name: bool = True
    show_table_number: bool = True
    show_customer_name: bool = True
    show_order_date: bool = True
    show_order_time: bool = True
    date_format: str = "DD-MM-YYYY"  # DD-MM-YYYY, MM-DD-YYYY, YYYY-MM-DD
    time_format: str = "12h"  # 12h, 24h
    separator_style: str = "dash"  # dash, equal, heavy, light, none
    total_style: str = "bold"  # bold, boxed, highlighted
    print_copies: int = 1  # 1-5
    auto_cut: bool = True
    beep_on_print: bool = False


class BusinessSettings(BaseModel):
    restaurant_name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    gstin: Optional[str] = None
    fssai: Optional[str] = None
    currency: str = "INR"
    tax_rate: float = 5.0
    receipt_theme: str = "classic"
    logo_url: Optional[str] = None
    website: Optional[str] = None
    tagline: Optional[str] = None
    footer_message: Optional[str] = "Thank you for dining with us!"
    print_customization: Optional[PrintCustomization] = None
    # WhatsApp Settings
    whatsapp_enabled: bool = False
    whatsapp_business_number: Optional[str] = None
    whatsapp_message_template: Optional[str] = "Thank you for dining at {restaurant_name}! Your bill of {currency}{total} has been paid. Order #{order_id}"
    # Auto WhatsApp Notifications
    whatsapp_auto_notify: bool = False
    whatsapp_notify_on_placed: bool = True
    whatsapp_notify_on_preparing: bool = True
    whatsapp_notify_on_ready: bool = True
    whatsapp_notify_on_completed: bool = True
    # Customer Self-Order Settings
    customer_self_order_enabled: bool = False
    frontend_url: Optional[str] = None  # For generating QR codes


class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: str
    role: str
    phone: Optional[str] = None
    login_method: str = "password"  # password, whatsapp
    organization_id: Optional[str] = None  # Links staff to their admin/organization
    business_settings: Optional[BusinessSettings] = None
    razorpay_key_id: Optional[str] = None
    razorpay_key_secret: Optional[str] = None
    subscription_active: bool = False
    bill_count: int = 0
    subscription_expires_at: Optional[datetime] = None
    setup_completed: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: str = "admin"


class RegisterOTPRequest(BaseModel):
    email: str
    username: str
    password: str
    role: str = "admin"


class VerifyRegistrationOTP(BaseModel):
    email: str
    otp: str


class UserLogin(BaseModel):
    username: str
    password: str


class WhatsAppOTPRequest(BaseModel):
    phone: str
    country_code: str = "+91"


class WhatsAppOTPVerify(BaseModel):
    phone: str
    otp: str
    country_code: str = "+91"


class RazorpaySettings(BaseModel):
    razorpay_key_id: str
    razorpay_key_secret: str


class StaffCreate(BaseModel):
    username: str
    email: str
    password: str
    role: str
    phone: Optional[str] = None
    salary: Optional[float] = None


class StaffUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None
    phone: Optional[str] = None
    salary: Optional[float] = None


class MenuItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str
    price: float
    description: Optional[str] = None
    image_url: Optional[str] = None
    image_data: Optional[str] = None
    available: bool = True
    ingredients: Optional[List[str]] = []
    preparation_time: Optional[int] = 15
    organization_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class MenuItemCreate(BaseModel):
    name: str
    category: str
    price: float
    description: Optional[str] = None
    image_url: Optional[str] = None
    image_data: Optional[str] = None
    available: bool = True
    ingredients: Optional[List[str]] = []
    preparation_time: Optional[int] = 15


class Table(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    table_number: int
    capacity: int
    status: str = "available"
    current_order_id: Optional[str] = None
    organization_id: Optional[str] = None


class TableCreate(BaseModel):
    table_number: int
    capacity: int
    status: str = "available"


class OrderItem(BaseModel):
    menu_item_id: str
    name: str
    quantity: int
    price: float
    notes: Optional[str] = None


class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    table_id: str
    table_number: int
    items: List[OrderItem]
    subtotal: float
    tax: float
    discount: float = 0
    total: float
    status: str = "pending"
    waiter_id: str
    waiter_name: str
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None  # For WhatsApp notifications
    tracking_token: Optional[str] = None  # For customer live tracking
    order_type: Optional[str] = "dine_in"  # dine_in, takeaway, delivery
    organization_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class OrderCreate(BaseModel):
    table_id: str
    table_number: int
    items: List[OrderItem]
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None  # For WhatsApp notifications
    frontend_origin: Optional[str] = None  # For generating tracking links
    order_type: Optional[str] = "dine_in"  # dine_in, takeaway, delivery


class Payment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_id: str
    amount: float
    payment_method: str
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    status: str = "pending"
    organization_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class PaymentCreate(BaseModel):
    order_id: str
    amount: float
    payment_method: str


class SubscriptionPayment(BaseModel):
    amount: float = 999.0  # ₹999/year


class InventoryItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    quantity: float
    unit: str
    min_quantity: float
    price_per_unit: float
    organization_id: Optional[str] = None
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class InventoryItemCreate(BaseModel):
    name: str
    quantity: float
    unit: str
    min_quantity: float
    price_per_unit: float


class ChatMessage(BaseModel):
    message: str


class PrintData(BaseModel):
    content: str
    type: str
    theme: Optional[str] = "classic"


# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def send_registration_otp_email(email: str, otp: str, username: str = "User"):
    """Send OTP email for registration verification"""
    import os
    
    # Get email configuration
    EMAIL_PROVIDER = os.getenv("EMAIL_PROVIDER", "console")
    
    subject = "Verify Your Email - BillByteKOT Registration"
    
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
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🍽️ BillByteKOT</h1>
                <p style="color: #ffffff; margin: 10px 0 0 0;">Restaurant Management System</p>
            </div>
            
            <div class="content">
                <h2 style="color: #333;">Welcome, {username}! 👋</h2>
                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                    Thank you for registering with BillByteKOT! Please verify your email address to complete your registration.
                </p>
                
                <div class="otp-box">
                    {otp}
                </div>
                
                <div class="info">
                    <p style="margin: 0; color: #666;">
                        <strong>⏰ Valid for 10 minutes</strong><br>
                        This OTP will expire in 10 minutes for security reasons.
                    </p>
                </div>
                
                <p style="color: #666; font-size: 14px; margin-top: 30px;">
                    If you didn't request this registration, please ignore this email.
                </p>
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
    
    text_body = f"""
    Welcome {username}!
    
    Your BillByteKOT Registration OTP is: {otp}
    
    This OTP is valid for 10 minutes.
    
    If you didn't request this registration, please ignore this email.
    
    ---
    BillByteKOT - Smart Restaurant Management
    © 2025 FinVerge Technologies
    """
    
    # Console mode for development
    if EMAIL_PROVIDER == "console" or EMAIL_PROVIDER == "":
        print(f"\n{'='*60}")
        print(f"📧 REGISTRATION OTP EMAIL (Console Mode)")
        print(f"{'='*60}")
        print(f"To: {email}")
        print(f"Subject: {subject}")
        print(f"OTP: {otp}")
        print(f"{'='*60}\n")
        return {"success": True, "message": "OTP logged to console (dev mode)"}
    
    # Try to use email_service if configured
    try:
        from email_service import send_via_smtp, send_via_sendgrid, send_via_mailgun, send_via_ses
        
        if EMAIL_PROVIDER == "smtp":
            return await send_via_smtp(email, subject, html_body, text_body)
        elif EMAIL_PROVIDER == "sendgrid":
            return await send_via_sendgrid(email, subject, html_body, text_body)
        elif EMAIL_PROVIDER == "mailgun":
            return await send_via_mailgun(email, subject, html_body, text_body)
        elif EMAIL_PROVIDER == "ses":
            return await send_via_ses(email, subject, html_body, text_body)
    except Exception as e:
        print(f"Email service error: {e}")
        # Fallback to console
        print(f"\n[EMAIL FALLBACK] To: {email}, OTP: {otp}")
        return {"success": False, "message": str(e)}


async def send_password_reset_otp_email(email: str, otp: str, username: str = "User"):
    """Send password reset OTP email"""
    import os
    
    # Get email configuration
    EMAIL_PROVIDER = os.getenv("EMAIL_PROVIDER", "console")
    
    subject = "Your BillByteKOT Password Reset OTP"
    
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
                    We received a request to reset your password. Use the OTP below to continue:
                </p>
                
                <div class="otp-box">
                    {otp}
                </div>
                
                <div class="info">
                    <p style="margin: 0; color: #666;">
                        <strong>⏰ Valid for 10 minutes</strong><br>
                        This OTP will expire in 10 minutes for security reasons.
                    </p>
                </div>
                
                <p style="color: #666; font-size: 14px; margin-top: 30px;">
                    If you didn't request a password reset, please ignore this email or contact support if you have concerns.
                </p>
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
    
    text_body = f"""
    Hello {username}!
    
    Your BillByteKOT Password Reset OTP is: {otp}
    
    This OTP is valid for 10 minutes.
    
    If you didn't request a password reset, please ignore this email.
    
    ---
    BillByteKOT - Smart Restaurant Management
    © 2025 FinVerge Technologies
    """
    
    # Console mode for development
    if EMAIL_PROVIDER == "console" or EMAIL_PROVIDER == "":
        print(f"\n{'='*60}")
        print(f"📧 PASSWORD RESET OTP EMAIL (Console Mode)")
        print(f"{'='*60}")
        print(f"To: {email}")
        print(f"Subject: {subject}")
        print(f"OTP: {otp}")
        print(f"{'='*60}\n")
        return {"success": True, "message": "OTP logged to console (dev mode)"}
    
    # Try to use email_service if configured
    try:
        from email_service import send_via_smtp, send_via_sendgrid, send_via_mailgun, send_via_ses
        
        if EMAIL_PROVIDER == "smtp":
            return await send_via_smtp(email, subject, html_body, text_body)
        elif EMAIL_PROVIDER == "sendgrid":
            return await send_via_sendgrid(email, subject, html_body, text_body)
        elif EMAIL_PROVIDER == "mailgun":
            return await send_via_mailgun(email, subject, html_body, text_body)
        elif EMAIL_PROVIDER == "ses":
            return await send_via_ses(email, subject, html_body, text_body)
    except Exception as e:
        print(f"Email service error: {e}")
        # Fallback to console
        print(f"\n[EMAIL FALLBACK] To: {email}, OTP: {otp}")
        return {"success": False, "message": str(e)}


async def send_password_reset_email(email: str, reset_link: str, username: str = "User"):
    """Send password reset email with reset link"""
    import os
    
    # Get email configuration
    EMAIL_PROVIDER = os.getenv("EMAIL_PROVIDER", "console")
    
    subject = "Reset Your BillByteKOT Password"
    
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
            .button {{
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: #ffffff;
                padding: 15px 40px;
                text-decoration: none;
                border-radius: 8px;
                margin: 20px 0;
                font-weight: bold;
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
                    We received a request to reset your password for your BillByteKOT account.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_link}" class="button">Reset Password</a>
                </div>
                
                <div class="info">
                    <p style="margin: 0; color: #666;">
                        <strong>⏰ Valid for 1 hour</strong><br>
                        This reset link will expire in 1 hour for security reasons.
                    </p>
                </div>
                
                <p style="color: #666; font-size: 14px; margin-top: 30px;">
                    If you didn't request a password reset, please ignore this email or contact support if you have concerns.
                </p>
                
                <p style="color: #999; font-size: 12px; margin-top: 20px;">
                    If the button doesn't work, copy and paste this link into your browser:<br>
                    <a href="{reset_link}" style="color: #667eea;">{reset_link}</a>
                </p>
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
    
    text_body = f"""
    Hello {username}!
    
    We received a request to reset your password for your BillByteKOT account.
    
    Click the link below to reset your password:
    {reset_link}
    
    This link is valid for 1 hour.
    
    If you didn't request a password reset, please ignore this email.
    
    ---
    BillByteKOT - Smart Restaurant Management
    © 2025 FinVerge Technologies
    """
    
    # Console mode for development
    if EMAIL_PROVIDER == "console" or EMAIL_PROVIDER == "":
        print(f"\n{'='*60}")
        print(f"📧 PASSWORD RESET EMAIL (Console Mode)")
        print(f"{'='*60}")
        print(f"To: {email}")
        print(f"Subject: {subject}")
        print(f"Reset Link: {reset_link}")
        print(f"{'='*60}\n")
        return {"success": True, "message": "Email logged to console (dev mode)"}
    
    # Try to use email_service if configured
    try:
        from email_service import send_via_smtp, send_via_sendgrid, send_via_mailgun, send_via_ses
        
        if EMAIL_PROVIDER == "smtp":
            return await send_via_smtp(email, subject, html_body, text_body)
        elif EMAIL_PROVIDER == "sendgrid":
            return await send_via_sendgrid(email, subject, html_body, text_body)
        elif EMAIL_PROVIDER == "mailgun":
            return await send_via_mailgun(email, subject, html_body, text_body)
        elif EMAIL_PROVIDER == "ses":
            return await send_via_ses(email, subject, html_body, text_body)
    except Exception as e:
        print(f"Email service error: {e}")
        # Fallback to console
        print(f"\n[EMAIL FALLBACK] To: {email}, Link: {reset_link}")
        return {"success": False, "message": str(e)}


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if user_id is None:
            print(f"❌ Invalid token: no user_id in payload")
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            print(f"❌ User not found: {user_id}")
            raise HTTPException(status_code=401, detail="User not found")

        # Ensure all required fields exist with defaults
        user.setdefault("subscription_active", False)
        user.setdefault("bill_count", 0)
        user.setdefault("setup_completed", False)
        user.setdefault("business_settings", None)
        user.setdefault("razorpay_key_id", None)
        user.setdefault("razorpay_key_secret", None)
        user.setdefault("subscription_expires_at", None)
        user.setdefault(
            "organization_id", user["id"] if user["role"] == "admin" else None
        )

        return user
    except jwt.ExpiredSignatureError:
        print(f"❌ Token expired")
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError as e:
        print(f"❌ JWT Error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        print(f"❌ Auth error: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")


async def check_subscription(user: dict):
    """
    Strict 7-day trial enforcement
    - Trial: 7 days from account creation
    - After trial: Must have active paid subscription
    - No bill count limit during trial
    """
    
    # Check if user has active paid subscription
    if user.get("subscription_active"):
        # Check if subscription has expired
        expires_at = user.get("subscription_expires_at")
        if expires_at:
            if isinstance(expires_at, str):
                try:
                    expires_at = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
                except:
                    expires_at = None
            
            if expires_at and expires_at < datetime.now(timezone.utc):
                # Subscription expired - deactivate it
                await db.users.update_one(
                    {"id": user["id"]}, 
                    {"$set": {"subscription_active": False}}
                )
                # Fall through to check trial
            else:
                # Active subscription - allow access
                return True
    
    # No active subscription - check trial period
    created_at = user.get("created_at")
    if isinstance(created_at, str):
        try:
            created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
        except:
            created_at = None
    
    if created_at:
        trial_end = created_at + timedelta(days=7)
        now = datetime.now(timezone.utc)
        
        if now < trial_end:
            # Still in trial period - allow access
            return True
        else:
            # Trial expired and no active subscription - block access
            return False
    
    # No created_at date (shouldn't happen) - block access for safety
    return False


def get_paper_width_chars(paper_width: str, custom_width: Optional[int] = None) -> int:
    """Calculate character width based on paper size"""
    width_map = {
        "58mm": 32,
        "80mm": 48,
        "110mm": 64,
        "custom": custom_width // 2 if custom_width else 48
    }
    return width_map.get(paper_width, 48)


def format_date_time(dt: datetime, date_format: str, time_format: str) -> tuple:
    """Format date and time based on settings"""
    date_formats = {
        "DD-MM-YYYY": "%d-%m-%Y",
        "MM-DD-YYYY": "%m-%d-%Y",
        "YYYY-MM-DD": "%Y-%m-%d"
    }
    time_formats = {
        "12h": "%I:%M %p",
        "24h": "%H:%M"
    }
    
    date_str = dt.strftime(date_formats.get(date_format, "%d-%m-%Y"))
    time_str = dt.strftime(time_formats.get(time_format, "%I:%M %p"))
    return date_str, time_str


def get_separator(style: str, width: int) -> str:
    """Get separator based on style and width"""
    separators = {
        "dash": "-" * width,
        "equal": "=" * width,
        "heavy": "═" * width,
        "light": "─" * width,
        "none": ""
    }
    return separators.get(style, "-" * width)


def get_receipt_template(
    theme: str, business: dict, order: dict, currency_symbol: str, customization: Optional[dict] = None
) -> str:
    # Get customization settings or use defaults
    custom = customization or {}
    paper_width = custom.get("paper_width", "80mm")
    custom_width_mm = custom.get("custom_width")
    font_size = custom.get("font_size", 12)
    separator_style = custom.get("separator_style", "dash")
    show_logo = custom.get("show_logo", True)
    show_server = custom.get("show_server_name", True)
    show_table = custom.get("show_table_number", True)
    show_customer = custom.get("show_customer_name", True)
    show_date = custom.get("show_order_date", True)
    show_time = custom.get("show_order_time", True)
    date_format = custom.get("date_format", "DD-MM-YYYY")
    time_format = custom.get("time_format", "12h")
    item_layout = custom.get("item_layout", "detailed")
    show_notes = custom.get("show_item_notes", True)
    header_style = custom.get("header_style", "centered")
    
    # Calculate character width
    char_width = get_paper_width_chars(paper_width, custom_width_mm)
    
    # Get separators
    sep_main = get_separator(separator_style, char_width)
    sep_light = get_separator("light", char_width)
    
    # Format date and time
    now = datetime.now()
    date_str, time_str = format_date_time(now, date_format, time_format)
    
    # Legacy separators for backward compatibility
    sep_eq = "=" * 48
    sep_dash = "-" * 48
    sep_heavy = "═" * 48
    sep_light_48 = "─" * 48

    items_text = "".join(
        [
            f"{item['quantity']}x {item['name']:<30} {currency_symbol}{item['price'] * item['quantity']:.2f}\n"
            for item in order["items"]
        ]
    )
    items_modern = "".join(
        [
            f"  {item['quantity']}× {item['name']:<28} {currency_symbol}{item['price'] * item['quantity']:.2f}\n"
            for item in order["items"]
        ]
    )
    items_minimal = "".join(
        [
            f"{item['quantity']}× {item['name']}: {currency_symbol}{item['price'] * item['quantity']:.2f}\n"
            for item in order["items"]
        ]
    )
    items_elegant = "".join(
        [
            f"{item['quantity']:>3} × {item['name']:<28} {currency_symbol}{item['price'] * item['quantity']:>8.2f}\n"
            for item in order["items"]
        ]
    )
    items_compact = "".join(
        [
            f"{item['quantity']}x {item['name'][:20]:<20} {currency_symbol}{item['price'] * item['quantity']:.2f}\n"
            for item in order["items"]
        ]
    )

    now_str = datetime.now().strftime("%d-%m-%Y %I:%M %p")
    now_elegant = datetime.now().strftime("%d %B %Y, %I:%M %p")
    now_compact = datetime.now().strftime("%d/%m/%y %H:%M")

    # Pre-compute centered text
    rest_name = business.get("restaurant_name", "RESTAURANT")
    rest_name_48 = rest_name.center(48)
    rest_name_44 = rest_name.center(44)
    rest_name_32 = rest_name.center(32) if len(rest_name) <= 32 else rest_name[:32]
    address = business.get("address", "")
    address_48 = address.center(48) if len(address) <= 48 else address[:48]
    address_44 = address.center(44) if len(address) <= 44 else address[:44]
    address_32 = address.center(32) if len(address) <= 32 else address[:32]
    phone = business.get("phone", "N/A")
    email = business.get("email", "")
    gstin = business.get("gstin", "N/A")
    fssai = business.get("fssai", "")
    website = business.get("website", "")
    tagline = business.get("tagline", "")
    footer_msg = business.get("footer_message", "Thank you for dining with us!")

    tax_rate = business.get("tax_rate", 5)

    templates = {
        "classic": f"""

{sep_eq}
{rest_name_48}
{sep_eq}
{address_48}
Phone: {phone}
{f"Email: {email}" if email else ""}
{f"GSTIN: {gstin}" if gstin != "N/A" else ""}
{f"FSSAI: {fssai}" if fssai else ""}
{sep_eq}

BILL #{order["id"][:8]}
{sep_dash}
Table: {order["table_number"]:<20} Waiter: {order["waiter_name"]}
Customer: {order.get("customer_name", "Guest")}
Date: {now_str}
{sep_dash}

ITEMS
{sep_dash}
{"Item":<25} {"Qty":>3} {"Amount":>12}
{sep_dash}
{items_text}{sep_dash}

Subtotal:                 {currency_symbol}{order["subtotal"]:>10.2f}
Tax ({tax_rate}%):                   {currency_symbol}{order["tax"]:>10.2f}
{sep_eq}
TOTAL:                    {currency_symbol}{order["total"]:>10.2f}
{sep_eq}

{footer_msg.center(48)}
{f"{website.center(48)}" if website else ""}

{sep_dash}
Thank you! Visit again!
{sep_eq}

""",
        "modern": f"""

┌{"─" * 46}┐
│ {rest_name_44} │
{f"│ {tagline.center(44)} │" if tagline else ""}
├{"─" * 46}┤
│ {address_44} │
│ ☎  {phone:<43} │
{f"│ 🌐 {website:<43} │" if website else ""}
└{"─" * 46}┘

🧾 BILL #{order["id"][:8]}
{"─" * 48}
🍽️  Table {order["table_number"]}  |  👤 {order["waiter_name"]}
👥 {order.get("customer_name", "Guest")}
📅 {now_str}
{"─" * 48}

ORDER ITEMS
{"─" * 48}
{items_modern}{"─" * 48}

Subtotal                  {currency_symbol}{order["subtotal"]:>10.2f}
Tax ({tax_rate}%)                    {currency_symbol}{order["tax"]:>10.2f}
{"═" * 48}
💰 TOTAL                  {currency_symbol}{order["total"]:>10.2f}
{"═" * 48}

✨ {footer_msg.center(44)} ✨
{f"GSTIN: {gstin}" if gstin != "N/A" else ""}

{"─" * 48}
Thank you for dining with us!
{"─" * 48}

""",
        "minimal": f"""

{rest_name.center(48)}
{address.center(48)}
{phone.center(48)}
{"─" * 48}

Bill: {order["id"][:8]}
Table: {order["table_number"]} | {order["waiter_name"]}
Customer: {order.get("customer_name", "Guest")}
{now_str}
{"─" * 48}

{items_minimal}
{"─" * 48}
Subtotal:             {currency_symbol}{order["subtotal"]:>10.2f}
Tax ({tax_rate}%):               {currency_symbol}{order["tax"]:>10.2f}
{"─" * 48}
TOTAL:                {currency_symbol}{order["total"]:>10.2f}
{"─" * 48}

{footer_msg.center(48)}

""",
        "elegant": f"""
╔{sep_heavy}╗
║ {rest_name_44} ║
{f"║ {tagline.center(44)} ║" if tagline else ""}
╠{sep_heavy}╣
║ {address_44} ║
║ Tel: {phone:<40} ║
{f"║ Email: {email:<38} ║" if email else ""}
║ GSTIN: {gstin:<38} ║
{f"║ FSSAI: {fssai:<38} ║" if fssai else ""}
╚{sep_heavy}╝

Invoice: {order["id"][:8]}
Table: {order["table_number"]} | Server: {order["waiter_name"]}
Guest: {order.get("customer_name", "Walk-in")}
Date: {now_elegant}

{sep_dash}
{items_elegant}{sep_dash}
                    Subtotal: {currency_symbol}{order["subtotal"]:>8.2f}
               Tax ({tax_rate}%): {currency_symbol}{order["tax"]:>8.2f}
{sep_heavy}
                       TOTAL: {currency_symbol}{order["total"]:>8.2f}
{sep_heavy}

        {footer_msg}
{f"          {website}" if website else "          Please visit us again"}
""",
        "compact": f"""
{rest_name_32}
{address_32}
Ph: {phone}
{sep_dash[:32]}
Bill: {order["id"][:8]}
Table: {order["table_number"]} | {order["waiter_name"]}
{now_compact}
{sep_dash[:32]}
{items_compact}{sep_dash[:32]}
Subtotal: {currency_symbol}{order["subtotal"]:.2f}
Tax ({tax_rate}%): {currency_symbol}{order["tax"]:.2f}
TOTAL: {currency_symbol}{order["total"]:.2f}
{sep_dash[:32]}
{footer_msg[:32]}
GSTIN: {gstin}
""",
        "detailed": f"""
{sep_eq}
{rest_name_48}
{f"{tagline.center(48)}" if tagline else ""}
{sep_eq}
Address: {address}
Phone: {phone}
{f"Email: {email}" if email else ""}
{f"Website: {website}" if website else ""}
GSTIN: {gstin}
{f"FSSAI License: {fssai}" if fssai else ""}
{sep_eq}

INVOICE DETAILS
{sep_dash}
Invoice No: {order["id"][:8]}
Table Number: {order["table_number"]}
Server: {order["waiter_name"]}
Customer: {order.get("customer_name", "Walk-in Guest")}
Date & Time: {now_str}
{sep_dash}

ORDER ITEMS
{sep_dash}
{"Item":<30} {"Qty":>4} {"Price":>10}
{sep_dash}
{items_text}{sep_dash}

PAYMENT SUMMARY
{sep_dash}
Subtotal:                 {currency_symbol}{order["subtotal"]:.2f}
Tax ({tax_rate}%):                  {currency_symbol}{order["tax"]:.2f}
{sep_eq}
GRAND TOTAL:              {currency_symbol}{order["total"]:.2f}
{sep_eq}

{footer_msg}
{f"Visit us at: {website}" if website else ""}

{sep_dash}
This is a computer generated receipt
{sep_eq}
""",
    }
    return templates.get(theme, templates["classic"])


# Auth routes
@api_router.post("/auth/register-request")
async def register_request(user_data: RegisterOTPRequest):
    """Step 1: Request registration - Send OTP to email"""
    # Check if username already exists
    existing_username = await db.users.find_one({"username": user_data.username}, {"_id": 0})
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Check if email already exists
    existing_email = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Generate 6-digit OTP
    otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    # Store OTP and user data temporarily
    registration_otp_storage[user_data.email] = {
        "otp": otp,
        "expires": expires_at,
        "user_data": {
            "username": user_data.username,
            "email": user_data.email,
            "password": user_data.password,
            "role": user_data.role
        }
    }
    
    # Send OTP email asynchronously (non-blocking)
    asyncio.create_task(send_registration_otp_email(user_data.email, otp, user_data.username))
    
    return {
        "message": "OTP sent to your email. Please verify to complete registration.",
        "email": user_data.email,
        "success": True,
        "otp": otp if os.getenv("DEBUG_MODE", "false").lower() == "true" else None  # Only in debug mode
    }


@api_router.post("/auth/verify-registration", response_model=User)
async def verify_registration(verify_data: VerifyRegistrationOTP):
    """Step 2: Verify OTP and complete registration"""
    # Get OTP data
    otp_data = registration_otp_storage.get(verify_data.email)
    if not otp_data:
        raise HTTPException(status_code=400, detail="No registration request found. Please request OTP again.")
    
    # Check if OTP expired
    if datetime.now(timezone.utc) > otp_data["expires"]:
        del registration_otp_storage[verify_data.email]
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")
    
    # Verify OTP
    if otp_data["otp"] != verify_data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP. Please check and try again.")
    
    # Get user data from storage
    user_data = otp_data["user_data"]
    
    # Create user object
    user_obj = User(
        username=user_data["username"],
        email=user_data["email"],
        role=user_data["role"]
    )
    
    # If admin, they are their own organization
    if user_data["role"] == "admin":
        user_obj.organization_id = user_obj.id
    
    # Add email_verified flag
    doc = user_obj.model_dump()
    doc["password"] = hash_password(user_data["password"])
    doc["created_at"] = doc["created_at"].isoformat()
    doc["email_verified"] = True
    doc["email_verified_at"] = datetime.now(timezone.utc).isoformat()
    
    # Insert user into database
    await db.users.insert_one(doc)
    
    # Remove used OTP
    del registration_otp_storage[verify_data.email]
    
    # Send welcome email asynchronously
    try:
        from email_automation import send_welcome_email
        asyncio.create_task(send_welcome_email(user_data["email"], user_data["username"]))
    except Exception as e:
        print(f"Failed to send welcome email: {e}")
    
    return user_obj


@api_router.post("/auth/register", response_model=User)
async def register_legacy(user_data: UserCreate):
    """Legacy registration endpoint (deprecated - use register-request + verify-registration)"""
    # Redirect to new OTP-based flow
    raise HTTPException(
        status_code=400,
        detail="Please use the new registration flow: /auth/register-request followed by /auth/verify-registration"
    )


@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"username": credentials.username}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"user_id": user["id"], "role": user["role"]})
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "role": user["role"],
            "email": user["email"],
            "phone": user.get("phone"),
            "login_method": user.get("login_method", "password"),
            "subscription_active": user.get("subscription_active", False),
            "bill_count": user.get("bill_count", 0),
            "setup_completed": user.get("setup_completed", False),
            "onboarding_completed": user.get("onboarding_completed", False),
            "business_settings": user.get("business_settings"),
        },
    }


@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user with trial/subscription status"""
    
    # Calculate trial info
    created_at = current_user.get("created_at")
    trial_info = {
        "is_trial": False,
        "trial_days_left": 0,
        "trial_expired": False,
        "trial_end_date": None
    }
    
    if isinstance(created_at, str):
        try:
            created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
        except:
            created_at = None
    
    if created_at:
        trial_end = created_at + timedelta(days=7)
        now = datetime.now(timezone.utc)
        days_left = (trial_end - now).days
        
        trial_info = {
            "is_trial": not current_user.get("subscription_active", False),
            "trial_days_left": max(0, days_left),
            "trial_expired": days_left < 0 and not current_user.get("subscription_active", False),
            "trial_end_date": trial_end.isoformat()
        }
    
    # Add trial info to response
    user_data = {**current_user, "trial_info": trial_info}
    
    return user_data


@api_router.put("/users/me/onboarding")
async def complete_onboarding(
    data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Mark onboarding as completed"""
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"onboarding_completed": data.get("onboarding_completed", True)}}
    )
    return {"message": "Onboarding status updated"}


# ============ PASSWORD RESET ============
# In-memory reset token storage (use Redis in production)
reset_tokens = {}  # {token: {"email": "user@example.com", "expires": timestamp}}


class ForgotPasswordRequest(BaseModel):
    email: str


class VerifyOTPRequest(BaseModel):
    email: str
    otp: str


class ResetPasswordRequest(BaseModel):
    email: str
    otp: str
    new_password: str


@api_router.post("/auth/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """Verify account exists and send OTP for password reset"""
    # Find user by email
    user = await db.users.find_one({"email": request.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email address")
    
    # Generate 6-digit OTP
    otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)  # OTP valid for 10 minutes
    
    # Store OTP
    reset_tokens[request.email] = {
        "otp": otp,
        "expires": expires_at,
        "verified": False
    }
    
    # Send OTP email asynchronously (non-blocking)
    asyncio.create_task(send_password_reset_otp_email(request.email, otp, user.get("username", "User")))
    
    return {
        "message": "OTP sent to your email. Please check your inbox.",
        "success": True,
        "otp": otp if os.getenv("DEBUG_MODE", "false").lower() == "true" else None  # Only in debug mode
    }


@api_router.post("/auth/verify-reset-otp")
async def verify_reset_otp(request: VerifyOTPRequest):
    """Verify OTP for password reset"""
    # Get OTP data
    otp_data = reset_tokens.get(request.email)
    if not otp_data:
        raise HTTPException(status_code=400, detail="No OTP found. Please request a new one.")
    
    # Check if OTP expired
    if datetime.now(timezone.utc) > otp_data["expires"]:
        # Remove expired OTP
        del reset_tokens[request.email]
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")
    
    # Verify OTP
    if otp_data["otp"] != request.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP. Please check and try again.")
    
    # Mark OTP as verified
    reset_tokens[request.email]["verified"] = True
    
    return {
        "message": "OTP verified successfully. You can now reset your password.",
        "success": True
    }


@api_router.post("/auth/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """Reset user password using verified OTP"""
    # Get OTP data
    otp_data = reset_tokens.get(request.email)
    if not otp_data:
        raise HTTPException(status_code=400, detail="No OTP found. Please request a new one.")
    
    # Check if OTP expired
    if datetime.now(timezone.utc) > otp_data["expires"]:
        # Remove expired OTP
        del reset_tokens[request.email]
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")
    
    # Verify OTP again
    if otp_data["otp"] != request.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP. Please check and try again.")
    
    # Check if OTP was verified
    if not otp_data.get("verified", False):
        raise HTTPException(status_code=400, detail="Please verify OTP first.")
    
    # Find user
    user = await db.users.find_one({"email": request.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update password
    hashed_password = hash_password(request.new_password)
    await db.users.update_one(
        {"email": request.email},
        {"$set": {"password": hashed_password}}
    )
    
    # Remove used OTP
    del reset_tokens[request.email]
    
    return {
        "message": "Password reset successful. You can now login with your new password.",
        "success": True
    }

# Lead Capture (Public endpoint - no auth required)
import random
import string

# In-memory storage for registration OTP
registration_otp_storage = {}  # {email: {"otp": "123456", "expires": timestamp, "user_data": {...}}}


class LeadCapture(BaseModel):
    name: str
    phone: str
    email: str
    businessName: Optional[str] = None
    source: str = "landing_page"
    timestamp: str


# Lead Capture (Public endpoint - no auth required)
@api_router.post("/leads")
async def capture_lead(lead: LeadCapture):
    """Capture lead from landing page popup"""
    try:
        # Store lead in database
        lead_data = lead.dict()
        lead_data["created_at"] = datetime.now(timezone.utc).isoformat()
        lead_data["status"] = "new"
        lead_data["contacted"] = False
        
        result = await db.leads.insert_one(lead_data)
        
        # TODO: Send notification to admin (email/SMS)
        # TODO: Add to CRM system if integrated
        
        return {
            "success": True,
            "message": "Lead captured successfully",
            "lead_id": str(result.inserted_id)
        }
    except Exception as e:
        logging.error(f"Error capturing lead: {e}")
        raise HTTPException(status_code=500, detail="Failed to capture lead")


# Staff Management
@api_router.post("/staff/create")
async def create_staff(
    staff_data: StaffCreate, current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admin can create staff")

    existing = await db.users.find_one({"username": staff_data.username}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    # Get admin's organization_id
    admin_org_id = current_user.get("organization_id") or current_user["id"]

    user_obj = User(
        username=staff_data.username,
        email=staff_data.email,
        role=staff_data.role,
        organization_id=admin_org_id,  # Link staff to this organization
    )

    doc = user_obj.model_dump()
    doc["password"] = hash_password(staff_data.password)
    doc["phone"] = staff_data.phone
    doc["salary"] = staff_data.salary
    doc["created_at"] = doc["created_at"].isoformat()

    await db.users.insert_one(doc)
    return {"message": "Staff member created", "id": user_obj.id}


@api_router.get("/staff")
async def get_staff(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admin can view staff")

    # Get admin's organization_id
    admin_org_id = current_user.get("organization_id") or current_user["id"]

    # Only fetch staff belonging to this organization
    staff = await db.users.find(
        {"organization_id": admin_org_id}, {"_id": 0, "password": 0}
    ).to_list(1000)
    return staff


@api_router.put("/staff/{staff_id}")
async def update_staff(
    staff_id: str,
    staff_data: StaffUpdate,
    current_user: dict = Depends(get_current_user),
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admin can update staff")

    # Get admin's organization_id
    admin_org_id = current_user.get("organization_id") or current_user["id"]

    # Only allow updating staff from same organization
    existing = await db.users.find_one(
        {"id": staff_id, "organization_id": admin_org_id}, {"_id": 0}
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Staff not found or access denied")

    update_data = {}
    if staff_data.username:
        update_data["username"] = staff_data.username
    if staff_data.email:
        update_data["email"] = staff_data.email
    if staff_data.password:
        update_data["password"] = hash_password(staff_data.password)
    if staff_data.role:
        update_data["role"] = staff_data.role
    if staff_data.phone is not None:
        update_data["phone"] = staff_data.phone
    if staff_data.salary is not None:
        update_data["salary"] = staff_data.salary

    await db.users.update_one({"id": staff_id}, {"$set": update_data})
    return {"message": "Staff updated"}


@api_router.delete("/staff/{staff_id}")
async def delete_staff(staff_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admin can delete staff")

    # Get admin's organization_id
    admin_org_id = current_user.get("organization_id") or current_user["id"]

    # Only allow deleting staff from same organization
    staff = await db.users.find_one(
        {"id": staff_id, "organization_id": admin_org_id}, {"_id": 0}
    )
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found or access denied")

    if staff["role"] == "admin":
        raise HTTPException(status_code=400, detail="Cannot delete admin user")

    await db.users.delete_one({"id": staff_id})
    return {"message": "Staff deleted"}


# Database Migration (Run once to fix existing data)
@api_router.post("/admin/migrate-organizations")
async def migrate_organizations(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    # Update all admin users to have their own organization_id
    admins = await db.users.find({"role": "admin"}, {"_id": 0}).to_list(1000)
    for admin in admins:
        if not admin.get("organization_id"):
            await db.users.update_one(
                {"id": admin["id"]}, {"$set": {"organization_id": admin["id"]}}
            )

    # Update all non-admin users without organization_id to set it to null
    await db.users.update_many(
        {"role": {"$ne": "admin"}, "organization_id": {"$exists": False}},
        {"$set": {"organization_id": None}},
    )

    return {"message": "Migration completed", "admins_updated": len(admins)}


# Business Setup
@api_router.post("/business/setup")
async def setup_business(
    settings: BusinessSettings, current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admin can setup business")

    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"business_settings": settings.model_dump(), "setup_completed": True}},
    )
    return {"message": "Business setup completed", "settings": settings.model_dump()}


@api_router.put("/business/settings")
async def update_business_settings(
    settings: BusinessSettings, current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admin can update business settings")

    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"business_settings": settings.model_dump()}},
    )
    return {"message": "Business settings updated successfully", "settings": settings.model_dump()}


@api_router.get("/business/settings")
async def get_business_settings(current_user: dict = Depends(get_current_user)):
    return {
        "business_settings": current_user.get("business_settings"),
        "setup_completed": current_user.get("setup_completed", False),
    }


@api_router.get("/currencies")
async def get_currencies():
    return [
        {"code": code, "symbol": symbol} for code, symbol in CURRENCY_SYMBOLS.items()
    ]


@api_router.get("/receipt-themes")
async def get_receipt_themes():
    return [
        {
            "id": "classic",
            "name": "Classic",
            "description": "Traditional receipt format",
            "recommended_width": "80mm",
            "supports_logo": True,
            "supports_qr": True
        },
        {
            "id": "modern",
            "name": "Modern",
            "description": "Modern with emojis and borders",
            "recommended_width": "80mm",
            "supports_logo": True,
            "supports_qr": True
        },
        {
            "id": "minimal",
            "name": "Minimal",
            "description": "Clean and simple design",
            "recommended_width": "80mm",
            "supports_logo": False,
            "supports_qr": False
        },
        {
            "id": "elegant",
            "name": "Elegant",
            "description": "Professional and elegant",
            "recommended_width": "80mm",
            "supports_logo": True,
            "supports_qr": True
        },
        {
            "id": "compact",
            "name": "Compact",
            "description": "Space-saving 58mm format",
            "recommended_width": "58mm",
            "supports_logo": False,
            "supports_qr": False
        },
        {
            "id": "detailed",
            "name": "Detailed",
            "description": "Comprehensive invoice format",
            "recommended_width": "80mm",
            "supports_logo": True,
            "supports_qr": True
        },
    ]


@api_router.get("/paper-sizes")
async def get_paper_sizes():
    return [
        {
            "id": "58mm",
            "name": "58mm (2.28 inches)",
            "width_mm": 58,
            "width_inches": 2.28,
            "char_width": 32,
            "description": "Compact thermal paper for small printers",
            "common_use": "Food trucks, kiosks, mobile POS"
        },
        {
            "id": "80mm",
            "name": "80mm (3.15 inches)",
            "width_mm": 80,
            "width_inches": 3.15,
            "char_width": 48,
            "description": "Standard thermal paper size",
            "common_use": "Most restaurants, retail stores"
        },
        {
            "id": "110mm",
            "name": "110mm (4.33 inches)",
            "width_mm": 110,
            "width_inches": 4.33,
            "char_width": 64,
            "description": "Wide format for detailed receipts",
            "common_use": "Fine dining, detailed invoices"
        },
        {
            "id": "custom",
            "name": "Custom Size",
            "width_mm": None,
            "width_inches": None,
            "char_width": None,
            "description": "Specify custom paper width",
            "common_use": "Special printer requirements"
        }
    ]


@api_router.get("/print-customization-options")
async def get_print_customization_options():
    return {
        "paper_widths": ["58mm", "80mm", "110mm", "custom"],
        "font_sizes": [8, 9, 10, 11, 12, 13, 14, 15, 16],
        "line_spacing": [1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0],
        "date_formats": ["DD-MM-YYYY", "MM-DD-YYYY", "YYYY-MM-DD"],
        "time_formats": ["12h", "24h"],
        "separator_styles": ["dash", "equal", "heavy", "light", "none"],
        "header_styles": ["centered", "left", "right"],
        "item_layouts": ["detailed", "compact", "minimal"],
        "total_styles": ["bold", "boxed", "highlighted"],
        "qr_code_content": ["website", "order_id", "custom"],
        "print_copies": [1, 2, 3, 4, 5]
    }


# Razorpay Settings
@api_router.post("/settings/razorpay")
async def update_razorpay_settings(
    settings: RazorpaySettings, current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admin can update settings")

    await db.users.update_one(
        {"id": current_user["id"]},
        {
            "$set": {
                "razorpay_key_id": settings.razorpay_key_id,
                "razorpay_key_secret": settings.razorpay_key_secret,
            }
        },
    )
    return {"message": "Razorpay settings updated successfully"}


@api_router.get("/settings/razorpay")
async def get_razorpay_settings(current_user: dict = Depends(get_current_user)):
    return {
        "razorpay_key_id": current_user.get("razorpay_key_id", ""),
        "razorpay_configured": bool(current_user.get("razorpay_key_id")),
    }


# Subscription - ₹999/year with 7-day free trial
SUBSCRIPTION_PRICE_PAISE = 99900  # ₹999 in paise
TRIAL_DAYS = 7
SUBSCRIPTION_DAYS = 365

# Coupon codes for discounts
COUPON_CODES = {
    "LAUNCH50": {"discount_percent": 50, "description": "50% Launch Discount", "active": True},
    "WELCOME25": {"discount_percent": 25, "description": "25% Welcome Discount", "active": True},
    "SAVE100": {"discount_amount": 10000, "description": "₹100 Off", "active": True},  # 10000 paise = ₹100
    "EARLYBIRD": {"discount_percent": 30, "description": "30% Early Bird Discount", "active": True},
    "FIRSTYEAR": {"discount_percent": 40, "description": "40% First Year Discount", "active": True},
    "TEST1RS": {"discount_amount": 99800, "description": "₹1 Testing Coupon (Dev Only)", "active": True},  # Reduces to ₹1 (100 paise)
}


@api_router.get("/subscription/status")
async def get_subscription_status(current_user: dict = Depends(get_current_user)):
    is_active = await check_subscription(current_user)
    
    # Check trial status
    created_at = current_user.get("created_at")
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
    
    trial_end = created_at + timedelta(days=TRIAL_DAYS) if created_at else None
    is_trial = trial_end and datetime.now(timezone.utc) < trial_end if trial_end else False
    trial_days_left = max(0, (trial_end - datetime.now(timezone.utc)).days) if trial_end else 0
    
    return {
        "subscription_active": current_user.get("subscription_active", False),
        "bill_count": current_user.get("bill_count", 0),
        "needs_subscription": not is_trial and current_user.get("bill_count", 0) >= 50
        and not current_user.get("subscription_active", False),
        "subscription_expires_at": current_user.get("subscription_expires_at"),
        "is_trial": is_trial,
        "trial_days_left": trial_days_left,
        "trial_end": trial_end.isoformat() if trial_end else None,
        "price": 999,
        "price_display": "₹999/year"
    }


@api_router.post("/subscription/start-trial")
async def start_trial(current_user: dict = Depends(get_current_user)):
    """Start 7-day free trial"""
    # Trial is automatic based on account creation date
    created_at = current_user.get("created_at")
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
    
    trial_end = created_at + timedelta(days=TRIAL_DAYS) if created_at else None
    
    return {
        "trial_started": True,
        "trial_end": trial_end.isoformat() if trial_end else None,
        "trial_days": TRIAL_DAYS
    }


class CouponValidateRequest(BaseModel):
    coupon_code: str


@api_router.post("/subscription/validate-coupon")
async def validate_coupon(data: CouponValidateRequest):
    """Validate coupon code and return discount details"""
    coupon_code = data.coupon_code.upper().strip()
    
    if coupon_code not in COUPON_CODES:
        raise HTTPException(status_code=404, detail="Invalid coupon code")
    
    coupon = COUPON_CODES[coupon_code]
    
    if not coupon.get("active", True):
        raise HTTPException(status_code=400, detail="This coupon code has expired")
    
    # Calculate discount
    original_price = SUBSCRIPTION_PRICE_PAISE
    discount_amount = 0
    
    if "discount_percent" in coupon:
        discount_amount = int(original_price * coupon["discount_percent"] / 100)
    elif "discount_amount" in coupon:
        discount_amount = coupon["discount_amount"]
    
    final_price = max(0, original_price - discount_amount)
    
    return {
        "valid": True,
        "coupon_code": coupon_code,
        "description": coupon["description"],
        "original_price": original_price,
        "discount_amount": discount_amount,
        "final_price": final_price,
        "original_price_display": f"₹{original_price / 100:.0f}",
        "discount_display": f"₹{discount_amount / 100:.0f}",
        "final_price_display": f"₹{final_price / 100:.0f}",
        "discount_percent": coupon.get("discount_percent", 0)
    }


class CreateOrderRequest(BaseModel):
    coupon_code: Optional[str] = None


@api_router.post("/subscription/create-order")
async def create_subscription_order(
    data: CreateOrderRequest = None,
    current_user: dict = Depends(get_current_user)
):
    # IMPORTANT: These are YOUR (platform owner's) Razorpay keys for subscription payments
    # Money from subscriptions comes to YOU, not to individual restaurants
    DEFAULT_RAZORPAY_KEY_ID = "rzp_live_RmGqVf5JPGOT6G"
    DEFAULT_RAZORPAY_KEY_SECRET = "SKYS5tgjwU3H3Pf2ch3ZFtuH"
    
    # Calculate price with coupon if provided
    final_price = SUBSCRIPTION_PRICE_PAISE
    coupon_applied = None
    discount_amount = 0
    
    if data and data.coupon_code:
        coupon_code = data.coupon_code.upper().strip()
        if coupon_code in COUPON_CODES:
            coupon = COUPON_CODES[coupon_code]
            if coupon.get("active", True):
                if "discount_percent" in coupon:
                    discount_amount = int(SUBSCRIPTION_PRICE_PAISE * coupon["discount_percent"] / 100)
                elif "discount_amount" in coupon:
                    discount_amount = coupon["discount_amount"]
                
                final_price = max(0, SUBSCRIPTION_PRICE_PAISE - discount_amount)
                coupon_applied = {
                    "code": coupon_code,
                    "description": coupon["description"],
                    "discount_amount": discount_amount,
                    "discount_display": f"₹{discount_amount / 100:.0f}"
                }
    
    # Use platform owner's keys (YOUR account)
    razorpay_key_id = os.environ.get("RAZORPAY_KEY_ID") or DEFAULT_RAZORPAY_KEY_ID
    razorpay_key_secret = os.environ.get("RAZORPAY_KEY_SECRET") or DEFAULT_RAZORPAY_KEY_SECRET

    try:
        razorpay_client = razorpay.Client(auth=(razorpay_key_id, razorpay_key_secret))

        razor_order = razorpay_client.order.create(
            {"amount": final_price, "currency": "INR", "payment_capture": 1}
        )

        return {
            "razorpay_order_id": razor_order["id"],
            "amount": final_price,
            "original_amount": SUBSCRIPTION_PRICE_PAISE,
            "discount_amount": discount_amount,
            "currency": "INR",
            "key_id": razorpay_key_id,
            "price_display": f"₹{final_price / 100:.0f}",
            "original_price_display": f"₹{SUBSCRIPTION_PRICE_PAISE / 100:.0f}",
            "coupon_applied": coupon_applied
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create payment order: {str(e)}"
        )


class SubscriptionVerifyRequest(BaseModel):
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: Optional[str] = None


@api_router.post("/subscription/verify")
async def verify_subscription_payment(
    data: SubscriptionVerifyRequest,
    current_user: dict = Depends(get_current_user),
):
    DEFAULT_RAZORPAY_KEY_ID = "rzp_live_RmGqVf5JPGOT6G"
    DEFAULT_RAZORPAY_KEY_SECRET = "SKYS5tgjwU3H3Pf2ch3ZFtuH"
    
    razorpay_key_id = os.environ.get("RAZORPAY_KEY_ID") or DEFAULT_RAZORPAY_KEY_ID
    razorpay_key_secret = os.environ.get("RAZORPAY_KEY_SECRET") or DEFAULT_RAZORPAY_KEY_SECRET
    
    try:
        razorpay_client = razorpay.Client(auth=(razorpay_key_id, razorpay_key_secret))
        
        # Fetch payment details first
        payment = None
        try:
            payment = razorpay_client.payment.fetch(data.razorpay_payment_id)
            print(f"Payment fetched: {payment}")
        except Exception as fetch_error:
            print(f"Error fetching payment: {fetch_error}")
        
        # Verify signature if provided (optional for some payment methods)
        signature_valid = False
        if data.razorpay_signature:
            try:
                razorpay_client.utility.verify_payment_signature({
                    'razorpay_order_id': data.razorpay_order_id,
                    'razorpay_payment_id': data.razorpay_payment_id,
                    'razorpay_signature': data.razorpay_signature
                })
                signature_valid = True
                print("Signature verified successfully")
            except razorpay.errors.SignatureVerificationError as sig_error:
                print(f"Signature verification failed: {sig_error}")
        
        # Check payment status
        payment_captured = False
        if payment:
            payment_captured = payment.get('status') in ['captured', 'authorized']
            print(f"Payment status: {payment.get('status')}, captured: {payment_captured}")
        
        # Accept payment if either signature is valid OR payment is captured OR amount matches
        if not signature_valid and not payment_captured:
            if payment and payment.get('amount') == 99900:
                print("Payment amount matches, accepting")
                payment_captured = True
            else:
                raise HTTPException(
                    status_code=400, 
                    detail="Payment verification failed. Contact support with payment ID: " + data.razorpay_payment_id
                )
        
        # Activate subscription
        expires_at = datetime.now(timezone.utc) + timedelta(days=SUBSCRIPTION_DAYS)

        await db.users.update_one(
            {"id": current_user["id"]},
            {
                "$set": {
                    "subscription_active": True,
                    "subscription_expires_at": expires_at.isoformat(),
                    "subscription_payment_id": data.razorpay_payment_id,
                    "subscription_order_id": data.razorpay_order_id,
                    "subscription_verified_at": datetime.now(timezone.utc).isoformat(),
                }
            },
        )
        
        print(f"Subscription activated for user: {current_user['id']}")

        return {
            "status": "subscription_activated", 
            "expires_at": expires_at.isoformat(),
            "days": SUBSCRIPTION_DAYS,
            "message": "🎉 Premium subscription activated successfully!",
            "payment_id": data.razorpay_payment_id
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Verification error: {str(e)}")
        # Try to activate anyway if payment ID exists
        try:
            expires_at = datetime.now(timezone.utc) + timedelta(days=SUBSCRIPTION_DAYS)
            await db.users.update_one(
                {"id": current_user["id"]},
                {
                    "$set": {
                        "subscription_active": True,
                        "subscription_expires_at": expires_at.isoformat(),
                        "subscription_payment_id": data.razorpay_payment_id,
                        "subscription_order_id": data.razorpay_order_id,
                        "subscription_verified_at": datetime.now(timezone.utc).isoformat(),
                    }
                },
            )
            return {
                "status": "subscription_activated", 
                "expires_at": expires_at.isoformat(),
                "days": SUBSCRIPTION_DAYS,
                "message": "🎉 Premium subscription activated successfully!"
            }
        except:
            raise HTTPException(
                status_code=500, 
                detail=f"Verification failed: {str(e)}. Contact support with payment ID: {data.razorpay_payment_id}"
            )


# Image Upload
@api_router.post("/upload/image")
async def upload_image(
    file: UploadFile = File(...), current_user: dict = Depends(get_current_user)
):
    if file.content_type not in ["image/jpeg", "image/png", "image/jpg", "image/webp"]:
        raise HTTPException(status_code=400, detail="Only image files allowed")

    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 5MB")

    image_data = base64.b64encode(contents).decode("utf-8")
    image_url = f"data:{file.content_type};base64,{image_data}"

    return {"image_url": image_url}


# Menu routes
@api_router.post("/menu", response_model=MenuItem)
async def create_menu_item(
    item: MenuItemCreate, current_user: dict = Depends(get_current_user)
):
    if current_user["role"] not in ["admin", "cashier"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Get user's organization_id
    user_org_id = current_user.get("organization_id") or current_user["id"]

    menu_obj = MenuItem(**item.model_dump(), organization_id=user_org_id)
    doc = menu_obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.menu_items.insert_one(doc)
    return menu_obj


@api_router.get("/menu", response_model=List[MenuItem])
async def get_menu(current_user: dict = Depends(get_current_user)):
    # Get user's organization_id
    user_org_id = current_user.get("organization_id") or current_user["id"]

    items = await db.menu_items.find(
        {"organization_id": user_org_id}, {"_id": 0}
    ).to_list(1000)
    for item in items:
        if isinstance(item["created_at"], str):
            item["created_at"] = datetime.fromisoformat(item["created_at"])
    return items


@api_router.get("/menu/{item_id}", response_model=MenuItem)
async def get_menu_item(item_id: str, current_user: dict = Depends(get_current_user)):
    # Get user's organization_id
    user_org_id = current_user.get("organization_id") or current_user["id"]

    item = await db.menu_items.find_one(
        {"id": item_id, "organization_id": user_org_id}, {"_id": 0}
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if isinstance(item["created_at"], str):
        item["created_at"] = datetime.fromisoformat(item["created_at"])
    return item


@api_router.put("/menu/{item_id}", response_model=MenuItem)
async def update_menu_item(
    item_id: str, item: MenuItemCreate, current_user: dict = Depends(get_current_user)
):
    if current_user["role"] not in ["admin", "cashier"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Get user's organization_id
    user_org_id = current_user.get("organization_id") or current_user["id"]

    existing = await db.menu_items.find_one(
        {"id": item_id, "organization_id": user_org_id}, {"_id": 0}
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Item not found")

    update_data = item.model_dump()
    await db.menu_items.update_one(
        {"id": item_id, "organization_id": user_org_id}, {"$set": update_data}
    )

    updated = await db.menu_items.find_one(
        {"id": item_id, "organization_id": user_org_id}, {"_id": 0}
    )
    if isinstance(updated["created_at"], str):
        updated["created_at"] = datetime.fromisoformat(updated["created_at"])
    return updated


@api_router.delete("/menu/{item_id}")
async def delete_menu_item(
    item_id: str, current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    # Get user's organization_id
    user_org_id = current_user.get("organization_id") or current_user["id"]

    result = await db.menu_items.delete_one(
        {"id": item_id, "organization_id": user_org_id}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item deleted"}


# Table routes
@api_router.post("/tables", response_model=Table)
async def create_table(
    table: TableCreate, current_user: dict = Depends(get_current_user)
):
    if current_user["role"] not in ["admin", "cashier"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Get user's organization_id
    user_org_id = current_user.get("organization_id") or current_user["id"]

    table_obj = Table(**table.model_dump(), organization_id=user_org_id)
    await db.tables.insert_one(table_obj.model_dump())
    return table_obj


@api_router.get("/tables", response_model=List[Table])
async def get_tables(current_user: dict = Depends(get_current_user)):
    # Get user's organization_id
    user_org_id = current_user.get("organization_id") or current_user["id"]

    tables = await db.tables.find({"organization_id": user_org_id}, {"_id": 0}).to_list(
        1000
    )
    return tables


@api_router.put("/tables/{table_id}", response_model=Table)
async def update_table(
    table_id: str, table: TableCreate, current_user: dict = Depends(get_current_user)
):
    # Get user's organization_id
    user_org_id = current_user.get("organization_id") or current_user["id"]

    existing = await db.tables.find_one(
        {"id": table_id, "organization_id": user_org_id}, {"_id": 0}
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Table not found")

    await db.tables.update_one(
        {"id": table_id, "organization_id": user_org_id}, {"$set": table.model_dump()}
    )
    updated = await db.tables.find_one(
        {"id": table_id, "organization_id": user_org_id}, {"_id": 0}
    )
    return updated


# Helper function to generate WhatsApp notification link
def generate_whatsapp_notification(phone: str, message: str) -> str:
    """Generate WhatsApp link for notification"""
    import urllib.parse
    
    # Clean phone number
    phone_clean = phone.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
    if not phone_clean.startswith("+"):
        if phone_clean.startswith("0"):
            phone_clean = "+91" + phone_clean[1:]
        elif len(phone_clean) == 10:
            phone_clean = "+91" + phone_clean
        else:
            phone_clean = "+" + phone_clean
    
    phone_clean = phone_clean.replace("+", "")
    encoded_message = urllib.parse.quote(message)
    return f"https://wa.me/{phone_clean}?text={encoded_message}"


def get_status_message(status: str, order: dict, business: dict, frontend_url: str = "") -> str:
    """Generate status-specific WhatsApp message"""
    restaurant_name = business.get("restaurant_name", "Restaurant")
    currency = CURRENCY_SYMBOLS.get(business.get("currency", "INR"), "₹")
    order_id = order["id"][:8]
    tracking_token = order.get("tracking_token", "")
    
    # Use provided frontend_url or fall back to business settings
    base_url = frontend_url or business.get("frontend_url", "")
    tracking_link = f"{base_url}/track/{tracking_token}" if base_url and tracking_token else ""
    
    messages = {
        "pending": f"""🍽️ *{restaurant_name}*

✅ *Order Confirmed!*
Order #{order_id}
Table: {order.get('table_number', 'N/A')}

Your order has been received and will be prepared shortly.

{f'📍 Track your order: {tracking_link}' if tracking_link else ''}

Thank you for your order! 🙏""",
        
        "preparing": f"""🍽️ *{restaurant_name}*

👨‍🍳 *Order Being Prepared*
Order #{order_id}

Great news! Our chef is now preparing your delicious meal.

Estimated time: 15-20 minutes

{f'📍 Track live: {tracking_link}' if tracking_link else ''}""",
        
        "ready": f"""🍽️ *{restaurant_name}*

🔔 *Order Ready!*
Order #{order_id}
Table: {order.get('table_number', 'N/A')}

Your order is ready and will be served shortly!

Enjoy your meal! 😋""",
        
        "completed": f"""🍽️ *{restaurant_name}*

✅ *Payment Completed*
Order #{order_id}

Amount: {currency}{order.get('total', 0):.2f}

Thank you for dining with us!
We hope to see you again soon! 🙏

{business.get('footer_message', '')}"""
    }
    
    return messages.get(status, f"Order #{order_id} status: {status}")


# Order routes
@api_router.post("/orders", response_model=Order)
async def create_order(
    order_data: OrderCreate, current_user: dict = Depends(get_current_user)
):
    if not await check_subscription(current_user):
        # Check if trial expired or subscription expired
        created_at = current_user.get("created_at")
        if isinstance(created_at, str):
            try:
                created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
                trial_end = created_at + timedelta(days=7)
                if datetime.now(timezone.utc) > trial_end:
                    raise HTTPException(
                        status_code=402,
                        detail="Your 7-day free trial has expired. Please subscribe to continue using BillByteKOT. Only ₹999/year for unlimited bills!",
                    )
            except:
                pass
        
        raise HTTPException(
            status_code=402,
            detail="Subscription required. Please subscribe to continue using BillByteKOT.",
        )

    # Get user's organization_id
    user_org_id = current_user.get("organization_id") or current_user["id"]

    business = current_user.get("business_settings", {})
    tax_rate = business.get("tax_rate", 5.0) / 100

    subtotal = sum(item.price * item.quantity for item in order_data.items)
    tax = subtotal * tax_rate
    total = subtotal + tax
    
    # Generate tracking token for customer live tracking
    tracking_token = str(uuid.uuid4())[:12]

    order_obj = Order(
        table_id=order_data.table_id,
        table_number=order_data.table_number,
        items=[item.model_dump() for item in order_data.items],
        subtotal=subtotal,
        tax=tax,
        total=total,
        waiter_id=current_user["id"],
        waiter_name=current_user["username"],
        customer_name=order_data.customer_name,
        customer_phone=order_data.customer_phone,
        tracking_token=tracking_token,
        order_type=order_data.order_type or "dine_in",
        organization_id=user_org_id,
    )

    doc = order_obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["updated_at"] = doc["updated_at"].isoformat()

    await db.orders.insert_one(doc)
    await db.tables.update_one(
        {"id": order_data.table_id, "organization_id": user_org_id},
        {"$set": {"status": "occupied", "current_order_id": order_obj.id}},
    )
    
    # Generate WhatsApp notification if enabled and phone provided
    whatsapp_link = None
    frontend_url = order_data.frontend_origin or ""
    if order_data.customer_phone and business.get("whatsapp_auto_notify") and business.get("whatsapp_notify_on_placed"):
        message = get_status_message("pending", doc, business, frontend_url)
        whatsapp_link = generate_whatsapp_notification(order_data.customer_phone, message)

    return {
        **order_obj.model_dump(),
        "whatsapp_link": whatsapp_link,
        "tracking_token": tracking_token,
        "tracking_url": f"{frontend_url}/track/{tracking_token}" if frontend_url else ""
    }


@api_router.get("/orders", response_model=List[Order])
async def get_orders(
    status: Optional[str] = None, current_user: dict = Depends(get_current_user)
):
    # Get user's organization_id
    user_org_id = current_user.get("organization_id") or current_user["id"]

    query = {"organization_id": user_org_id}
    if status:
        query["status"] = status

    # Security log
    print(f"🔒 User {current_user['email']} (org: {user_org_id}) fetching orders with query: {query}")

    orders = await db.orders.find(query, {"_id": 0}).to_list(1000)
    for order in orders:
        if isinstance(order["created_at"], str):
            order["created_at"] = datetime.fromisoformat(order["created_at"])
        if isinstance(order["updated_at"], str):
            order["updated_at"] = datetime.fromisoformat(order["updated_at"])
    return orders


@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str, current_user: dict = Depends(get_current_user)):
    # Get user's organization_id
    user_org_id = current_user.get("organization_id") or current_user["id"]

    order = await db.orders.find_one(
        {"id": order_id, "organization_id": user_org_id}, {"_id": 0}
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if isinstance(order["created_at"], str):
        order["created_at"] = datetime.fromisoformat(order["created_at"])
    if isinstance(order["updated_at"], str):
        order["updated_at"] = datetime.fromisoformat(order["updated_at"])
    return order


@api_router.put("/orders/{order_id}/status")
async def update_order_status(
    order_id: str, 
    status: str, 
    frontend_origin: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    # Get user's organization_id
    user_org_id = current_user.get("organization_id") or current_user["id"]

    order = await db.orders.find_one(
        {"id": order_id, "organization_id": user_org_id}, {"_id": 0}
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    await db.orders.update_one(
        {"id": order_id, "organization_id": user_org_id},
        {
            "$set": {
                "status": status,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        },
    )

    if status == "completed":
        await db.tables.update_one(
            {"id": order["table_id"], "organization_id": user_org_id},
            {"$set": {"status": "available", "current_order_id": None}},
        )
    
    # Generate WhatsApp notification if enabled
    business = current_user.get("business_settings", {})
    whatsapp_link = None
    customer_phone = order.get("customer_phone")
    
    if customer_phone and business.get("whatsapp_auto_notify"):
        should_notify = False
        if status == "preparing" and business.get("whatsapp_notify_on_preparing"):
            should_notify = True
        elif status == "ready" and business.get("whatsapp_notify_on_ready"):
            should_notify = True
        elif status == "completed" and business.get("whatsapp_notify_on_completed"):
            should_notify = True
        
        if should_notify:
            # Update order with current status for message generation
            order["status"] = status
            message = get_status_message(status, order, business, frontend_origin or "")
            whatsapp_link = generate_whatsapp_notification(customer_phone, message)

    return {
        "message": "Order status updated",
        "whatsapp_link": whatsapp_link,
        "customer_phone": customer_phone
    }


# Order Management - Edit/Cancel/Delete
@api_router.put("/orders/{order_id}")
async def update_order(
    order_id: str,
    order_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update an existing order"""
    user_org_id = current_user.get("organization_id") or current_user["id"]
    
    # Verify order belongs to user's organization
    existing_order = await db.orders.find_one(
        {"id": order_id, "organization_id": user_org_id}
    )
    
    if not existing_order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Don't allow editing completed orders
    if existing_order.get("status") == "completed":
        raise HTTPException(status_code=400, detail="Cannot edit completed orders")
    
    # Update order
    update_data = {
        "items": order_data.get("items", existing_order["items"]),
        "subtotal": order_data.get("subtotal", existing_order["subtotal"]),
        "tax": order_data.get("tax", existing_order["tax"]),
        "total": order_data.get("total", existing_order["total"]),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.orders.update_one(
        {"id": order_id, "organization_id": user_org_id},
        {"$set": update_data}
    )
    
    return {"message": "Order updated successfully"}


@api_router.put("/orders/{order_id}/cancel")
async def cancel_order(
    order_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Cancel an order"""
    user_org_id = current_user.get("organization_id") or current_user["id"]
    
    order = await db.orders.find_one(
        {"id": order_id, "organization_id": user_org_id}
    )
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.get("status") == "completed":
        raise HTTPException(status_code=400, detail="Cannot cancel completed orders")
    
    # Update order status to cancelled
    await db.orders.update_one(
        {"id": order_id, "organization_id": user_org_id},
        {
            "$set": {
                "status": "cancelled",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    # Release table if order had one
    if order.get("table_id"):
        await db.tables.update_one(
            {"id": order["table_id"], "organization_id": user_org_id},
            {"$set": {"status": "available", "current_order_id": None}}
        )
    
    return {"message": "Order cancelled successfully"}


@api_router.delete("/orders/{order_id}")
async def delete_order(
    order_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete an order (admin only)"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admin can delete orders")
    
    user_org_id = current_user.get("organization_id") or current_user["id"]
    
    order = await db.orders.find_one(
        {"id": order_id, "organization_id": user_org_id}
    )
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Release table if order had one
    if order.get("table_id"):
        await db.tables.update_one(
            {"id": order["table_id"], "organization_id": user_org_id},
            {"$set": {"status": "available", "current_order_id": None}}
        )
    
    # Delete order
    await db.orders.delete_one(
        {"id": order_id, "organization_id": user_org_id}
    )
    
    return {"message": "Order deleted successfully"}


# Payment routes
@api_router.post("/payments/create-order")
async def create_payment_order(
    payment_data: PaymentCreate, current_user: dict = Depends(get_current_user)
):
    # Get user's organization_id
    user_org_id = current_user.get("organization_id") or current_user["id"]

    order = await db.orders.find_one(
        {"id": payment_data.order_id, "organization_id": user_org_id}, {"_id": 0}
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if payment_data.payment_method == "razorpay":
        # IMPORTANT: Use restaurant's own Razorpay keys for billing payments
        # NOT the platform subscription keys
        razorpay_key_id = current_user.get("razorpay_key_id")
        razorpay_key_secret = current_user.get("razorpay_key_secret")

        if not razorpay_key_id or not razorpay_key_secret:
            raise HTTPException(
                status_code=400, 
                detail="Razorpay not configured. Please add your Razorpay API keys in Settings > Payment Gateway to accept online payments."
            )

        razorpay_client = razorpay.Client(auth=(razorpay_key_id, razorpay_key_secret))

        amount_paise = int(payment_data.amount * 100)
        razor_order = razorpay_client.order.create(
            {"amount": amount_paise, "currency": "INR", "payment_capture": 1}
        )

        payment_obj = Payment(
            order_id=payment_data.order_id,
            amount=payment_data.amount,
            payment_method=payment_data.payment_method,
            razorpay_order_id=razor_order["id"],
            organization_id=user_org_id,
        )

        doc = payment_obj.model_dump()
        doc["created_at"] = doc["created_at"].isoformat()
        await db.payments.insert_one(doc)

        return {
            "razorpay_order_id": razor_order["id"],
            "amount": amount_paise,
            "currency": "INR",
            "key_id": razorpay_key_id,
        }
    else:
        payment_obj = Payment(
            order_id=payment_data.order_id,
            amount=payment_data.amount,
            payment_method=payment_data.payment_method,
            status="completed",
            organization_id=user_org_id,
        )

        doc = payment_obj.model_dump()
        doc["created_at"] = doc["created_at"].isoformat()
        await db.payments.insert_one(doc)

        await db.orders.update_one(
            {"id": payment_data.order_id, "organization_id": user_org_id},
            {"$set": {"status": "completed"}},
        )
        await db.users.update_one(
            {"id": current_user["id"]}, {"$inc": {"bill_count": 1}}
        )

        return {"payment_id": payment_obj.id, "status": "completed"}


@api_router.post("/payments/verify")
async def verify_payment(
    razorpay_payment_id: str,
    razorpay_order_id: str,
    order_id: str,
    current_user: dict = Depends(get_current_user),
):
    # Get user's organization_id
    user_org_id = current_user.get("organization_id") or current_user["id"]

    payment = await db.payments.find_one(
        {"razorpay_order_id": razorpay_order_id, "organization_id": user_org_id},
        {"_id": 0},
    )
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    await db.payments.update_one(
        {"razorpay_order_id": razorpay_order_id, "organization_id": user_org_id},
        {"$set": {"razorpay_payment_id": razorpay_payment_id, "status": "completed"}},
    )

    await db.orders.update_one(
        {"id": order_id, "organization_id": user_org_id},
        {"$set": {"status": "completed"}},
    )
    await db.users.update_one({"id": current_user["id"]}, {"$inc": {"bill_count": 1}})

    return {"status": "payment_verified"}


@api_router.get("/payments")
async def get_payments(current_user: dict = Depends(get_current_user)):
    # Get user's organization_id
    user_org_id = current_user.get("organization_id") or current_user["id"]

    payments = await db.payments.find(
        {"organization_id": user_org_id}, {"_id": 0}
    ).to_list(1000)
    for payment in payments:
        if isinstance(payment["created_at"], str):
            payment["created_at"] = datetime.fromisoformat(payment["created_at"])
    return payments


# Inventory routes
@api_router.post("/inventory", response_model=InventoryItem)
async def create_inventory_item(
    item: InventoryItemCreate, current_user: dict = Depends(get_current_user)
):
    if current_user["role"] not in ["admin", "cashier"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Get user's organization_id
    user_org_id = current_user.get("organization_id") or current_user["id"]

    inv_obj = InventoryItem(**item.model_dump(), organization_id=user_org_id)
    doc = inv_obj.model_dump()
    doc["last_updated"] = doc["last_updated"].isoformat()
    await db.inventory.insert_one(doc)
    return inv_obj


@api_router.get("/inventory", response_model=List[InventoryItem])
async def get_inventory(current_user: dict = Depends(get_current_user)):
    # Get user's organization_id
    user_org_id = current_user.get("organization_id") or current_user["id"]

    items = await db.inventory.find(
        {"organization_id": user_org_id}, {"_id": 0}
    ).to_list(1000)
    for item in items:
        if isinstance(item["last_updated"], str):
            item["last_updated"] = datetime.fromisoformat(item["last_updated"])
    return items


@api_router.put("/inventory/{item_id}", response_model=InventoryItem)
async def update_inventory_item(
    item_id: str,
    item: InventoryItemCreate,
    current_user: dict = Depends(get_current_user),
):
    if current_user["role"] not in ["admin", "cashier"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Get user's organization_id
    user_org_id = current_user.get("organization_id") or current_user["id"]

    update_data = item.model_dump()
    update_data["last_updated"] = datetime.now(timezone.utc).isoformat()

    await db.inventory.update_one(
        {"id": item_id, "organization_id": user_org_id}, {"$set": update_data}
    )
    updated = await db.inventory.find_one(
        {"id": item_id, "organization_id": user_org_id}, {"_id": 0}
    )
    if isinstance(updated["last_updated"], str):
        updated["last_updated"] = datetime.fromisoformat(updated["last_updated"])
    return updated


@api_router.get("/inventory/low-stock")
async def get_low_stock(current_user: dict = Depends(get_current_user)):
    # Get user's organization_id
    user_org_id = current_user.get("organization_id") or current_user["id"]

    items = await db.inventory.find(
        {"organization_id": user_org_id}, {"_id": 0}
    ).to_list(1000)
    low_stock = [item for item in items if item["quantity"] <= item["min_quantity"]]
    return low_stock


class InventoryDeduction(BaseModel):
    menu_item_id: str
    quantity: int


@api_router.post("/inventory/deduct")
async def deduct_inventory(
    deduction: InventoryDeduction,
    current_user: dict = Depends(get_current_user)
):
    """Deduct inventory when items are sold"""
    user_org_id = current_user.get("organization_id") or current_user["id"]
    
    # Find menu item to get ingredients
    menu_item = await db.menu_items.find_one(
        {"id": deduction.menu_item_id, "organization_id": user_org_id},
        {"_id": 0}
    )
    
    if not menu_item:
        return {"success": False, "message": "Menu item not found"}
    
    # Deduct ingredients from inventory
    ingredients = menu_item.get("ingredients", [])
    deducted_items = []
    
    for ingredient_name in ingredients:
        # Find inventory item by name (case-insensitive)
        inventory_item = await db.inventory.find_one(
            {
                "name": {"$regex": f"^{ingredient_name}$", "$options": "i"},
                "organization_id": user_org_id
            },
            {"_id": 0}
        )
        
        if inventory_item:
            # Deduct quantity (1 unit per item sold)
            new_quantity = max(0, inventory_item["quantity"] - (1 * deduction.quantity))
            
            await db.inventory.update_one(
                {"id": inventory_item["id"]},
                {
                    "$set": {
                        "quantity": new_quantity,
                        "last_updated": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
            
            deducted_items.append({
                "name": ingredient_name,
                "old_quantity": inventory_item["quantity"],
                "new_quantity": new_quantity,
                "low_stock": new_quantity <= inventory_item["min_quantity"]
            })
    
    return {
        "success": True,
        "deducted_items": deducted_items,
        "message": f"Inventory updated for {len(deducted_items)} ingredients"
    }


# AI routes
@api_router.post("/ai/chat")
async def ai_chat(message: ChatMessage):
    if not _LLM_AVAILABLE:
        raise HTTPException(status_code=503, detail="LLM integration unavailable")
    try:
        chat = LlmChat(
            api_key=os.environ.get("LLM_API_KEY"),
            session_id=str(uuid.uuid4()),
            system_message="You are a helpful restaurant assistant. Answer customer queries about menu, orders, and restaurant services.",
        ).with_model("openai", "gpt-4o-mini")

        user_msg = UserMessage(text=message.message)
        response = await chat.send_message(user_msg)

        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/ai/recommendations")
async def get_recommendations(current_user: dict = Depends(get_current_user)):
    try:
        user_org_id = current_user.get("organization_id") or current_user["id"]
        
        orders = await db.orders.find({
            "status": "completed",
            "organization_id": user_org_id
        }, {"_id": 0}).limit(50).to_list(50)
        
        menu_items = await db.menu_items.find({
            "organization_id": user_org_id
        }, {"_id": 0}).to_list(1000)

        if not orders or not menu_items:
            return {
                "recommendations": "Not enough data yet. Start taking orders to get AI recommendations!"
            }

        order_items = []
        for order in orders:
            order_items.extend([item["name"] for item in order["items"]])

        from collections import Counter
        popular_items = Counter(order_items).most_common(5)

        if not _LLM_AVAILABLE:
            # Fallback without AI
            return {
                "recommendations": f"Top selling items: {', '.join([item[0] for item in popular_items])}. Consider promoting these items!"
            }

        chat = LlmChat(
            api_key=os.environ.get("LLM_API_KEY"),
            session_id=str(uuid.uuid4()),
            system_message="You are a restaurant menu analyst. Based on order history, suggest menu items that would pair well together.",
        ).with_model("openai", "gpt-4o-mini")

        prompt = f"Popular items: {popular_items}. Menu: {[item['name'] for item in menu_items[:20]]}. Suggest 5 complementary items."
        user_msg = UserMessage(text=prompt)
        response = await chat.send_message(user_msg)

        return {"recommendations": response}
    except Exception as e:
        print(f"AI recommendations error: {str(e)}")
        return {
            "recommendations": "AI recommendations temporarily unavailable. Please try again later."
        }


@api_router.post("/ai/sales-forecast")
async def sales_forecast(current_user: dict = Depends(get_current_user)):
    try:
        user_org_id = current_user.get("organization_id") or current_user["id"]
        
        orders = await db.orders.find({
            "status": "completed",
            "organization_id": user_org_id
        }, {"_id": 0}).to_list(1000)

        if not orders:
            return {
                "forecast": "Not enough data yet. Complete some orders to get sales forecasts!",
                "current_stats": {
                    "total_orders": 0,
                    "total_sales": 0,
                    "avg_order": 0,
                },
            }

        total_sales = sum(order["total"] for order in orders)
        avg_order_value = total_sales / len(orders) if orders else 0

        if not _LLM_AVAILABLE:
            # Fallback without AI
            return {
                "forecast": f"Based on {len(orders)} orders with ₹{total_sales:.2f} total sales, your average order value is ₹{avg_order_value:.2f}. Keep up the good work!",
                "current_stats": {
                    "total_orders": len(orders),
                    "total_sales": total_sales,
                    "avg_order": avg_order_value,
                },
            }

        chat = LlmChat(
            api_key=os.environ.get("LLM_API_KEY"),
            session_id=str(uuid.uuid4()),
            system_message="You are a sales analyst. Provide sales predictions based on historical data.",
        ).with_model("openai", "gpt-4o-mini")

        prompt = f"Total orders: {len(orders)}, Total sales: ₹{total_sales:.2f}, Average order: ₹{avg_order_value:.2f}. Predict next week's sales."
        user_msg = UserMessage(text=prompt)
        response = await chat.send_message(user_msg)

        return {
            "forecast": response,
            "current_stats": {
                "total_orders": len(orders),
                "total_sales": total_sales,
                "avg_order": avg_order_value,
            },
        }
    except Exception as e:
        print(f"AI forecast error: {str(e)}")
        return {
            "forecast": "AI forecast temporarily unavailable. Please try again later.",
            "current_stats": {
                "total_orders": 0,
                "total_sales": 0,
                "avg_order": 0,
            },
        }


# Reports
@api_router.get("/reports/daily")
async def daily_report(current_user: dict = Depends(get_current_user)):
    user_org_id = current_user.get("organization_id") or current_user["id"]
    today = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    orders = await db.orders.find({
        "status": "completed",
        "organization_id": user_org_id
    }, {"_id": 0}).to_list(1000)

    today_orders = []
    for order in orders:
        order_date = order["created_at"]
        if isinstance(order_date, str):
            order_date = datetime.fromisoformat(order_date.replace("Z", "+00:00"))
        if order_date >= today:
            today_orders.append(order)

    total_sales = sum(order["total"] for order in today_orders)
    total_orders = len(today_orders)

    return {
        "date": today.isoformat(),
        "total_orders": total_orders,
        "total_sales": total_sales,
        "orders": today_orders,
    }


@api_router.get("/reports/export")
async def export_report(
    start_date: str, 
    end_date: str,
    current_user: dict = Depends(get_current_user)
):
    user_org_id = current_user.get("organization_id") or current_user["id"]
    start = datetime.fromisoformat(start_date)
    end = datetime.fromisoformat(end_date).replace(hour=23, minute=59, second=59)

    orders = await db.orders.find({
        "status": "completed",
        "organization_id": user_org_id
    }, {"_id": 0}).to_list(1000)
    
    filtered_orders = []

    for order in orders:
        order_date = order["created_at"]
        if isinstance(order_date, str):
            order_date = datetime.fromisoformat(order_date.replace("Z", "+00:00"))
        if start <= order_date <= end:
            filtered_orders.append(order)

    return {
        "orders": filtered_orders,
        "total_sales": sum(o["total"] for o in filtered_orders),
    }


@api_router.get("/reports/weekly")
async def weekly_report(current_user: dict = Depends(get_current_user)):
    user_org_id = current_user.get("organization_id") or current_user["id"]
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    
    orders = await db.orders.find({
        "status": "completed", 
        "organization_id": user_org_id
    }, {"_id": 0}).to_list(1000)
    
    weekly_orders = []
    for order in orders:
        order_date = order["created_at"]
        if isinstance(order_date, str):
            order_date = datetime.fromisoformat(order_date.replace("Z", "+00:00"))
        if order_date >= week_ago:
            weekly_orders.append(order)
    
    total_sales = sum(order["total"] for order in weekly_orders)
    total_orders = len(weekly_orders)
    avg_order_value = total_sales / total_orders if total_orders > 0 else 0
    
    return {
        "total_orders": total_orders,
        "total_sales": total_sales,
        "avg_order_value": avg_order_value,
        "period": "last_7_days"
    }


@api_router.get("/reports/monthly")
async def monthly_report(current_user: dict = Depends(get_current_user)):
    user_org_id = current_user.get("organization_id") or current_user["id"]
    month_ago = datetime.now(timezone.utc) - timedelta(days=30)
    
    orders = await db.orders.find({
        "status": "completed",
        "organization_id": user_org_id
    }, {"_id": 0}).to_list(1000)
    
    monthly_orders = []
    for order in orders:
        order_date = order["created_at"]
        if isinstance(order_date, str):
            order_date = datetime.fromisoformat(order_date.replace("Z", "+00:00"))
        if order_date >= month_ago:
            monthly_orders.append(order)
    
    total_sales = sum(order["total"] for order in monthly_orders)
    total_orders = len(monthly_orders)
    avg_order_value = total_sales / total_orders if total_orders > 0 else 0
    
    return {
        "total_orders": total_orders,
        "total_sales": total_sales,
        "avg_order_value": avg_order_value,
        "period": "last_30_days"
    }


@api_router.get("/reports/best-selling")
async def best_selling_report(current_user: dict = Depends(get_current_user)):
    user_org_id = current_user.get("organization_id") or current_user["id"]
    
    orders = await db.orders.find({
        "status": "completed",
        "organization_id": user_org_id
    }, {"_id": 0}).to_list(1000)
    
    from collections import defaultdict
    item_stats = defaultdict(lambda: {
        "total_quantity": 0, 
        "total_revenue": 0, 
        "name": "", 
        "category": "Uncategorized",
        "price": 0
    })
    
    for order in orders:
        for item in order["items"]:
            item_id = item.get("menu_item_id", item["name"])
            item_stats[item_id]["name"] = item["name"]
            item_stats[item_id]["total_quantity"] += item["quantity"]
            item_stats[item_id]["total_revenue"] += item["price"] * item["quantity"]
            item_stats[item_id]["price"] = item["price"]  # Store price
    
    # Get category info from menu
    for item_id, stats in item_stats.items():
        menu_item = await db.menu_items.find_one({
            "name": stats["name"], 
            "organization_id": user_org_id
        }, {"_id": 0})
        if menu_item:
            stats["category"] = menu_item.get("category", "Uncategorized")
            if not stats["price"]:
                stats["price"] = menu_item.get("price", 0)
    
    sorted_items = sorted(
        item_stats.values(), 
        key=lambda x: x["total_quantity"], 
        reverse=True
    )[:10]
    
    return sorted_items


@api_router.get("/reports/staff-performance")
async def staff_performance_report(current_user: dict = Depends(get_current_user)):
    user_org_id = current_user.get("organization_id") or current_user["id"]
    
    orders = await db.orders.find({
        "status": "completed",
        "organization_id": user_org_id
    }, {"_id": 0}).to_list(1000)
    
    from collections import defaultdict
    staff_stats = defaultdict(lambda: {"total_orders": 0, "total_sales": 0, "waiter_name": ""})
    
    for order in orders:
        waiter_id = order["waiter_id"]
        staff_stats[waiter_id]["waiter_name"] = order["waiter_name"]
        staff_stats[waiter_id]["total_orders"] += 1
        staff_stats[waiter_id]["total_sales"] += order["total"]
    
    # Calculate average order value
    for staff_id, stats in staff_stats.items():
        stats["avg_order_value"] = stats["total_sales"] / stats["total_orders"] if stats["total_orders"] > 0 else 0
        # Get role from users collection
        staff_user = await db.users.find_one({"id": staff_id}, {"_id": 0})
        if staff_user:
            stats["role"] = staff_user.get("role", "waiter")
    
    sorted_staff = sorted(staff_stats.values(), key=lambda x: x["total_orders"], reverse=True)
    return sorted_staff


@api_router.get("/reports/peak-hours")
async def peak_hours_report(current_user: dict = Depends(get_current_user)):
    user_org_id = current_user.get("organization_id") or current_user["id"]
    
    orders = await db.orders.find({
        "status": "completed",
        "organization_id": user_org_id
    }, {"_id": 0}).to_list(1000)
    
    from collections import defaultdict
    hour_stats = defaultdict(int)
    
    for order in orders:
        order_date = order["created_at"]
        if isinstance(order_date, str):
            order_date = datetime.fromisoformat(order_date)
        hour = order_date.hour
        hour_stats[hour] += 1
    
    # Format hours
    formatted_hours = []
    for hour, count in sorted(hour_stats.items()):
        formatted_hours.append({
            "hour": f"{hour:02d}:00 - {hour:02d}:59",
            "order_count": count
        })
    
    return sorted(formatted_hours, key=lambda x: x["order_count"], reverse=True)[:12]


@api_router.get("/reports/category-analysis")
async def category_analysis_report(current_user: dict = Depends(get_current_user)):
    user_org_id = current_user.get("organization_id") or current_user["id"]
    
    orders = await db.orders.find({
        "status": "completed",
        "organization_id": user_org_id
    }, {"_id": 0}).to_list(1000)
    
    from collections import defaultdict
    category_stats = defaultdict(lambda: {"total_sold": 0, "total_revenue": 0})
    
    for order in orders:
        for item in order["items"]:
            # Get category from menu
            menu_item = await db.menu_items.find_one({
                "name": item["name"],
                "organization_id": user_org_id
            }, {"_id": 0})
            
            category = "Uncategorized"
            if menu_item:
                category = menu_item.get("category", "Uncategorized")
            
            category_stats[category]["total_sold"] += item["quantity"]
            category_stats[category]["total_revenue"] += item["price"] * item["quantity"]
    
    # Calculate percentages
    total_revenue = sum(stats["total_revenue"] for stats in category_stats.values())
    
    result = []
    for category, stats in category_stats.items():
        percentage = (stats["total_revenue"] / total_revenue * 100) if total_revenue > 0 else 0
        result.append({
            "category": category,
            "total_sold": stats["total_sold"],
            "total_revenue": stats["total_revenue"],
            "percentage": percentage
        })
    
    return sorted(result, key=lambda x: x["total_revenue"], reverse=True)


# Thermal printer route
@api_router.post("/print")
async def print_receipt(
    print_data: PrintData, current_user: dict = Depends(get_current_user)
):
    business = current_user.get("business_settings", {})
    currency_code = business.get("currency", "INR")
    currency_symbol = CURRENCY_SYMBOLS.get(currency_code, "₹")
    theme = print_data.theme or business.get("receipt_theme", "classic")

    return {
        "print_ready": True,
        "content": print_data.content,
        "format": "text",
        "escpos_available": True,
        "theme": theme,
    }


@api_router.post("/print/bill/{order_id}")
async def print_bill(
    order_id: str,
    theme: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    # Get user's organization_id
    user_org_id = current_user.get("organization_id") or current_user["id"]

    order = await db.orders.find_one(
        {"id": order_id, "organization_id": user_org_id}, {"_id": 0}
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    business = current_user.get("business_settings", {})
    currency_code = business.get("currency", "INR")
    currency_symbol = CURRENCY_SYMBOLS.get(currency_code, "₹")
    receipt_theme = theme or business.get("receipt_theme", "classic")
    
    # Get print customization settings
    customization = business.get("print_customization")

    receipt_content = get_receipt_template(
        receipt_theme, business, order, currency_symbol, customization
    )
    
    # Get paper width for response
    paper_width = "80mm"
    if customization:
        paper_width = customization.get("paper_width", "80mm")
        if paper_width == "custom" and customization.get("custom_width"):
            paper_width = f"{customization.get('custom_width')}mm"

    return {
        "print_ready": True,
        "content": receipt_content,
        "paper_width": paper_width,
        "font_size": customization.get("font_size", 12) if customization else 12,
        "copies": customization.get("print_copies", 1) if customization else 1,
        "format": "text",
        "theme": receipt_theme,
    }


# WhatsApp Integration
class WhatsAppMessage(BaseModel):
    phone_number: str
    customer_name: Optional[str] = None


@api_router.post("/whatsapp/send-receipt/{order_id}")
async def send_whatsapp_receipt(
    order_id: str,
    message_data: WhatsAppMessage,
    current_user: dict = Depends(get_current_user),
):
    """Generate WhatsApp share link for order receipt"""
    # Get user's organization_id
    user_org_id = current_user.get("organization_id") or current_user["id"]

    order = await db.orders.find_one(
        {"id": order_id, "organization_id": user_org_id}, {"_id": 0}
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    business = current_user.get("business_settings", {})
    currency_code = business.get("currency", "INR")
    currency_symbol = CURRENCY_SYMBOLS.get(currency_code, "₹")
    
    # Get WhatsApp settings
    whatsapp_enabled = business.get("whatsapp_enabled", False)
    message_template = business.get("whatsapp_message_template", 
        "Thank you for dining at {restaurant_name}! Your bill of {currency}{total} has been paid. Order #{order_id}")
    
    restaurant_name = business.get("restaurant_name", "Our Restaurant")
    
    # Build items list for message
    items_list = "\n".join([
        f"• {item['quantity']}x {item['name']} - {currency_symbol}{item['price'] * item['quantity']:.2f}"
        for item in order["items"]
    ])
    
    # Format the message
    message = message_template.format(
        restaurant_name=restaurant_name,
        currency=currency_symbol,
        total=f"{order['total']:.2f}",
        order_id=order_id[:8],
        customer_name=message_data.customer_name or order.get("customer_name", "Guest"),
        subtotal=f"{order['subtotal']:.2f}",
        tax=f"{order['tax']:.2f}",
        table_number=order.get("table_number", "N/A"),
        waiter_name=order.get("waiter_name", "Staff"),
        items=items_list
    )
    
    # Add detailed receipt if template doesn't include items
    if "{items}" not in message_template:
        detailed_message = f"""
🧾 *{restaurant_name}*
━━━━━━━━━━━━━━━━━━━━

📋 *Order #{order_id[:8]}*
🍽️ Table: {order.get("table_number", "N/A")}
👤 Customer: {message_data.customer_name or order.get("customer_name", "Guest")}

*Items:*
{items_list}

━━━━━━━━━━━━━━━━━━━━
Subtotal: {currency_symbol}{order['subtotal']:.2f}
Tax: {currency_symbol}{order['tax']:.2f}
*Total: {currency_symbol}{order['total']:.2f}*
━━━━━━━━━━━━━━━━━━━━

✅ Payment Completed

{business.get('footer_message', 'Thank you for dining with us!')}
"""
        message = detailed_message
    
    # Clean phone number (remove spaces, dashes, etc.)
    phone = message_data.phone_number.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
    if not phone.startswith("+"):
        # Assume Indian number if no country code
        if phone.startswith("0"):
            phone = "+91" + phone[1:]
        elif len(phone) == 10:
            phone = "+91" + phone
        else:
            phone = "+" + phone
    
    # Remove the + for WhatsApp API
    phone_clean = phone.replace("+", "")
    
    # URL encode the message
    import urllib.parse
    encoded_message = urllib.parse.quote(message)
    
    # Generate WhatsApp link
    whatsapp_link = f"https://wa.me/{phone_clean}?text={encoded_message}"
    
    return {
        "success": True,
        "whatsapp_link": whatsapp_link,
        "message": message,
        "phone_number": phone,
        "order_id": order_id,
        "whatsapp_enabled": whatsapp_enabled
    }


@api_router.get("/whatsapp/settings")
async def get_whatsapp_settings(current_user: dict = Depends(get_current_user)):
    """Get WhatsApp settings for the business"""
    business = current_user.get("business_settings", {})
    return {
        "whatsapp_enabled": business.get("whatsapp_enabled", False),
        "whatsapp_business_number": business.get("whatsapp_business_number", ""),
        "whatsapp_message_template": business.get("whatsapp_message_template", 
            "Thank you for dining at {restaurant_name}! Your bill of {currency}{total} has been paid. Order #{order_id}"),
        "whatsapp_auto_notify": business.get("whatsapp_auto_notify", False),
        "whatsapp_notify_on_placed": business.get("whatsapp_notify_on_placed", True),
        "whatsapp_notify_on_preparing": business.get("whatsapp_notify_on_preparing", True),
        "whatsapp_notify_on_ready": business.get("whatsapp_notify_on_ready", True),
        "whatsapp_notify_on_completed": business.get("whatsapp_notify_on_completed", True),
        "customer_self_order_enabled": business.get("customer_self_order_enabled", False),
        "frontend_url": business.get("frontend_url", "")
    }


class WhatsAppSettings(BaseModel):
    whatsapp_enabled: bool = False
    whatsapp_business_number: Optional[str] = None
    whatsapp_message_template: Optional[str] = None
    whatsapp_auto_notify: bool = False
    whatsapp_notify_on_placed: bool = True
    whatsapp_notify_on_preparing: bool = True
    whatsapp_notify_on_ready: bool = True
    whatsapp_notify_on_completed: bool = True
    customer_self_order_enabled: bool = False
    frontend_url: Optional[str] = None


@api_router.put("/whatsapp/settings")
async def update_whatsapp_settings(
    settings: WhatsAppSettings,
    current_user: dict = Depends(get_current_user)
):
    """Update WhatsApp settings for the business"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admin can update WhatsApp settings")
    
    # Get current business settings
    business = current_user.get("business_settings", {}) or {}
    
    # Update WhatsApp specific settings
    business["whatsapp_enabled"] = settings.whatsapp_enabled
    business["whatsapp_auto_notify"] = settings.whatsapp_auto_notify
    business["whatsapp_notify_on_placed"] = settings.whatsapp_notify_on_placed
    business["whatsapp_notify_on_preparing"] = settings.whatsapp_notify_on_preparing
    business["whatsapp_notify_on_ready"] = settings.whatsapp_notify_on_ready
    business["whatsapp_notify_on_completed"] = settings.whatsapp_notify_on_completed
    business["customer_self_order_enabled"] = settings.customer_self_order_enabled
    
    if settings.whatsapp_business_number:
        business["whatsapp_business_number"] = settings.whatsapp_business_number
    if settings.whatsapp_message_template:
        business["whatsapp_message_template"] = settings.whatsapp_message_template
    if settings.frontend_url:
        business["frontend_url"] = settings.frontend_url
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"business_settings": business}}
    )
    
    return {"message": "WhatsApp settings updated successfully", "settings": settings.model_dump()}


# ============ WHATSAPP CLOUD API ENDPOINTS ============

@api_router.post("/whatsapp/cloud/send-receipt/{order_id}")
async def send_receipt_via_cloud_api(
    order_id: str,
    message_data: WhatsAppMessage,
    current_user: dict = Depends(get_current_user),
):
    """Send receipt directly via WhatsApp Cloud API (no user login required)"""
    if not _WHATSAPP_CLOUD_AVAILABLE:
        raise HTTPException(
            status_code=503, 
            detail="WhatsApp Cloud API not configured. Please set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN in environment variables."
        )
    
    # Get user's organization_id
    user_org_id = current_user.get("organization_id") or current_user["id"]

    order = await db.orders.find_one(
        {"id": order_id, "organization_id": user_org_id}, {"_id": 0}
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    business = current_user.get("business_settings", {})
    
    try:
        # Send via WhatsApp Cloud API
        result = await send_whatsapp_receipt(
            phone=message_data.phone_number,
            order=order,
            business=business
        )
        
        return {
            "success": True,
            "message": "Receipt sent via WhatsApp",
            "message_id": result.get("messages", [{}])[0].get("id"),
            "phone_number": message_data.phone_number,
            "order_id": order_id,
            "method": "cloud_api"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send WhatsApp message: {str(e)}"
        )


@api_router.post("/whatsapp/cloud/send-status")
async def send_status_via_cloud_api(
    order_id: str,
    status: str,
    phone_number: str,
    current_user: dict = Depends(get_current_user),
):
    """Send order status update via WhatsApp Cloud API"""
    if not _WHATSAPP_CLOUD_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="WhatsApp Cloud API not configured"
        )
    
    business = current_user.get("business_settings", {})
    restaurant_name = business.get("restaurant_name", "Restaurant")
    frontend_url = business.get("frontend_url", "")
    
    # Get order for tracking URL
    user_org_id = current_user.get("organization_id") or current_user["id"]
    order = await db.orders.find_one(
        {"id": order_id, "organization_id": user_org_id},
        {"_id": 0, "tracking_token": 1}
    )
    
    tracking_url = None
    if order and order.get("tracking_token") and frontend_url:
        tracking_url = f"{frontend_url}/track/{order['tracking_token']}"
    
    try:
        result = await send_whatsapp_status(
            phone=phone_number,
            order_id=order_id,
            status=status,
            restaurant_name=restaurant_name,
            tracking_url=tracking_url
        )
        
        return {
            "success": True,
            "message": "Status update sent via WhatsApp",
            "message_id": result.get("messages", [{}])[0].get("id"),
            "phone_number": phone_number,
            "status": status
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send status update: {str(e)}"
        )


@api_router.post("/whatsapp/cloud/send-otp")
async def send_otp_via_cloud_api(
    phone_number: str,
    otp: str,
    restaurant_name: str = "BillByteKOT"
):
    """Send OTP via WhatsApp Cloud API (public endpoint)"""
    if not _WHATSAPP_CLOUD_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="WhatsApp Cloud API not configured"
        )
    
    try:
        result = await send_whatsapp_otp(
            phone=phone_number,
            otp=otp,
            restaurant_name=restaurant_name
        )
        
        return {
            "success": True,
            "message": "OTP sent via WhatsApp",
            "message_id": result.get("messages", [{}])[0].get("id"),
            "phone_number": phone_number
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send OTP: {str(e)}"
        )


@api_router.get("/whatsapp/cloud/test")
async def test_cloud_api(current_user: dict = Depends(get_current_user)):
    """Test WhatsApp Cloud API connection"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    if not _WHATSAPP_CLOUD_AVAILABLE:
        return {
            "success": False,
            "configured": False,
            "error": "WhatsApp Cloud API module not available"
        }
    
    result = await test_whatsapp_connection()
    return result


@api_router.get("/whatsapp/cloud/status")
async def get_cloud_api_status():
    """Get WhatsApp Cloud API configuration status (public)"""
    if not _WHATSAPP_CLOUD_AVAILABLE:
        return {
            "available": False,
            "configured": False,
            "message": "WhatsApp Cloud API module not loaded"
        }
    
    is_configured = whatsapp_api.is_configured()
    return {
        "available": True,
        "configured": is_configured,
        "message": "WhatsApp Cloud API is configured and ready" if is_configured else "WhatsApp Cloud API credentials not set",
        "phone_number_id": whatsapp_api.phone_number_id if is_configured else None
    }


# These endpoints are for customer-facing features like order tracking and self-ordering

@app.get("/api/public/track/{tracking_token}")
async def track_order_public(tracking_token: str):
    """Public endpoint for customers to track their order status"""
    order = await db.orders.find_one(
        {"tracking_token": tracking_token}, 
        {"_id": 0, "waiter_id": 0, "organization_id": 0}
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Get business info for display
    admin = await db.users.find_one(
        {"id": order.get("organization_id") or order.get("waiter_id")},
        {"_id": 0, "business_settings": 1}
    )
    business = admin.get("business_settings", {}) if admin else {}
    
    return {
        "order_id": order["id"][:8],
        "status": order["status"],
        "table_number": order.get("table_number"),
        "customer_name": order.get("customer_name"),
        "items": order["items"],
        "subtotal": order["subtotal"],
        "tax": order["tax"],
        "total": order["total"],
        "created_at": order["created_at"],
        "updated_at": order["updated_at"],
        "restaurant_name": business.get("restaurant_name", "Restaurant"),
        "restaurant_phone": business.get("phone", ""),
        "currency": business.get("currency", "INR")
    }


@app.get("/api/public/menu/{org_id}")
async def get_public_menu(org_id: str):
    """Public endpoint for customers to view menu (for self-ordering)"""
    # Check if self-ordering is enabled
    admin = await db.users.find_one({"id": org_id}, {"_id": 0})
    if not admin:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    business = admin.get("business_settings", {})
    if not business.get("customer_self_order_enabled"):
        raise HTTPException(status_code=403, detail="Self-ordering not enabled")
    
    # Get available menu items
    items = await db.menu_items.find(
        {"organization_id": org_id, "available": True},
        {"_id": 0, "organization_id": 0}
    ).to_list(1000)
    
    # Group by category
    categories = {}
    for item in items:
        cat = item.get("category", "Other")
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(item)
    
    return {
        "restaurant_name": business.get("restaurant_name", "Restaurant"),
        "currency": business.get("currency", "INR"),
        "tax_rate": business.get("tax_rate", 5.0),
        "categories": categories,
        "items": items
    }


@app.get("/api/public/tables/{org_id}")
async def get_public_tables(org_id: str):
    """Public endpoint to get available tables for self-ordering"""
    admin = await db.users.find_one({"id": org_id}, {"_id": 0})
    if not admin:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    business = admin.get("business_settings", {})
    if not business.get("customer_self_order_enabled"):
        raise HTTPException(status_code=403, detail="Self-ordering not enabled")
    
    tables = await db.tables.find(
        {"organization_id": org_id},
        {"_id": 0, "organization_id": 0}
    ).to_list(100)
    
    return {
        "restaurant_name": business.get("restaurant_name", "Restaurant"),
        "tables": tables
    }


class CustomerOrderCreate(BaseModel):
    table_id: str
    table_number: int
    items: List[OrderItem]
    customer_name: str
    customer_phone: str
    org_id: str
    frontend_origin: Optional[str] = None  # For generating tracking links


@app.post("/api/public/order")
async def create_customer_order(order_data: CustomerOrderCreate):
    """Public endpoint for customers to place orders (self-ordering)"""
    # Verify restaurant and self-ordering enabled
    admin = await db.users.find_one({"id": order_data.org_id}, {"_id": 0})
    if not admin:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    business = admin.get("business_settings", {})
    if not business.get("customer_self_order_enabled"):
        raise HTTPException(status_code=403, detail="Self-ordering not enabled")
    
    # Calculate totals
    tax_rate = business.get("tax_rate", 5.0) / 100
    subtotal = sum(item.price * item.quantity for item in order_data.items)
    tax = subtotal * tax_rate
    total = subtotal + tax
    
    # Generate tracking token
    tracking_token = str(uuid.uuid4())[:12]
    
    order_obj = Order(
        table_id=order_data.table_id,
        table_number=order_data.table_number,
        items=[item.model_dump() for item in order_data.items],
        subtotal=subtotal,
        tax=tax,
        total=total,
        waiter_id=order_data.org_id,  # Use org_id as waiter for self-orders
        waiter_name="Self-Order",
        customer_name=order_data.customer_name,
        customer_phone=order_data.customer_phone,
        tracking_token=tracking_token,
        organization_id=order_data.org_id,
    )
    
    doc = order_obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["updated_at"] = doc["updated_at"].isoformat()
    
    await db.orders.insert_one(doc)
    await db.tables.update_one(
        {"id": order_data.table_id, "organization_id": order_data.org_id},
        {"$set": {"status": "occupied", "current_order_id": order_obj.id}},
    )
    
    # Use frontend_origin from request for tracking links
    frontend_url = order_data.frontend_origin or ""
    
    # Generate WhatsApp notification
    whatsapp_link = None
    if business.get("whatsapp_auto_notify") and business.get("whatsapp_notify_on_placed"):
        message = get_status_message("pending", doc, business, frontend_url)
        whatsapp_link = generate_whatsapp_notification(order_data.customer_phone, message)
    
    tracking_url = f"{frontend_url}/track/{tracking_token}" if frontend_url else ""
    
    return {
        "success": True,
        "order_id": order_obj.id[:8],
        "tracking_token": tracking_token,
        "tracking_url": tracking_url,
        "whatsapp_link": whatsapp_link,
        "total": total,
        "message": "Order placed successfully! You will receive updates on WhatsApp."
    }


@app.get("/api/public/qr/{org_id}/{table_number}")
async def get_table_qr_data(org_id: str, table_number: int):
    """Get data for generating table QR code"""
    admin = await db.users.find_one({"id": org_id}, {"_id": 0})
    if not admin:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    business = admin.get("business_settings", {})
    frontend_url = business.get("frontend_url", "")
    
    # Find table
    table = await db.tables.find_one(
        {"organization_id": org_id, "table_number": table_number},
        {"_id": 0}
    )
    
    return {
        "restaurant_name": business.get("restaurant_name", "Restaurant"),
        "table_number": table_number,
        "table_id": table["id"] if table else None,
        "org_id": org_id,
        "self_order_enabled": business.get("customer_self_order_enabled", False),
        "menu_url": f"{frontend_url}/order/{org_id}?table={table_number}" if frontend_url else "",
        "qr_content": f"{frontend_url}/order/{org_id}?table={table_number}" if frontend_url else f"Order at Table {table_number}"
    }


# Support Ticket System
class SupportTicket(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    subject: str
    message: str
    priority: str = "medium"
    requestType: Optional[str] = "support"  # support, demo, inquiry
    preferredDate: Optional[str] = None
    preferredTime: Optional[str] = None


@api_router.post("/support/ticket")
async def create_support_ticket(ticket: SupportTicket):
    """Create a support ticket or demo booking"""
    ticket_id = str(uuid.uuid4())[:12]
    
    ticket_doc = {
        "id": ticket_id,
        "name": ticket.name,
        "email": ticket.email,
        "phone": ticket.phone,
        "subject": ticket.subject,
        "message": ticket.message,
        "priority": ticket.priority,
        "request_type": ticket.requestType,
        "preferred_date": ticket.preferredDate,
        "preferred_time": ticket.preferredTime,
        "status": "open",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.support_tickets.insert_one(ticket_doc)
    
    # Log for admin notification
    if ticket.requestType == "demo":
        print(f"📅 New demo booking #{ticket_id}: {ticket.name} ({ticket.email}) - {ticket.preferredDate} at {ticket.preferredTime}")
    else:
        print(f"📧 New support ticket #{ticket_id}: {ticket.subject} from {ticket.name} ({ticket.email})")
    
    response_message = "Support ticket created successfully. We'll contact you within 24 hours."
    if ticket.requestType == "demo":
        response_message = f"Demo booking confirmed for {ticket.preferredDate} at {ticket.preferredTime}. We'll send you a confirmation email shortly!"
    
    return {
        "success": True,
        "ticket_id": ticket_id,
        "message": response_message
    }


class AIChatRequest(BaseModel):
    message: str
    history: Optional[List[Dict[str, str]]] = []


@api_router.get("/support/tickets")
async def get_support_tickets(
    status: Optional[str] = None,
    request_type: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get all support tickets (admin only)"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admin can view tickets")
    
    # Build query
    query = {}
    if status:
        query["status"] = status
    if request_type:
        query["request_type"] = request_type
    
    # Fetch tickets
    tickets = await db.support_tickets.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    
    return {
        "success": True,
        "count": len(tickets),
        "tickets": tickets
    }


@api_router.put("/support/ticket/{ticket_id}/status")
async def update_ticket_status(
    ticket_id: str,
    status: str,
    current_user: dict = Depends(get_current_user)
):
    """Update ticket status (admin only)"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admin can update tickets")
    
    result = await db.support_tickets.update_one(
        {"id": ticket_id},
        {
            "$set": {
                "status": status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    return {
        "success": True,
        "message": f"Ticket status updated to {status}"
    }


@api_router.post("/ai/support-chat")
async def ai_support_chat(chat_request: AIChatRequest):
    """AI-powered support chat"""
    
    # Predefined responses for common questions
    common_responses = {
        "pricing": "BillByteKOT offers a 7-day free trial with all features. After that, it's just ₹999/year. You get unlimited bills, thermal printing, AI analytics, and priority support!",
        "thermal": "To setup thermal printer: 1) Connect your ESC/POS compatible printer (58mm or 80mm), 2) Go to Settings > Printer, 3) Select your printer and choose from 6 beautiful themes. Need help? Contact us!",
        "kot": "KOT (Kitchen Order Ticket) system sends orders directly to the kitchen. When you create an order, it automatically prints in the kitchen with item details, table number, and timing. This reduces errors and speeds up service!",
        "payment": "We support multiple payment methods: Cash, Card, UPI, and Razorpay integration. You can configure your own Razorpay account in Settings to receive payments directly.",
        "whatsapp": "WhatsApp integration lets you send bills, order updates, and promotional messages to customers. Setup: Go to Settings > WhatsApp, enable it, and add your business number. You can auto-notify customers on order status changes!",
        "mobile": "Yes! BillByteKOT works on any device - desktop, tablet, or mobile. We also have a native Android app coming soon. Join our early access program to be notified!",
        "desktop": "Download our desktop app for Windows, Mac, or Linux from the Download page. It offers offline support, direct thermal printing, and faster performance!",
        "support": "We offer 24/7 support! Email us at support@billbytekot.in, call +91-98765-43210 (Mon-Sat, 9 AM-6 PM IST), or use this chat. Premium users get priority support with faster response times.",
        "trial": "Start your 7-day free trial now! No credit card required. You get full access to all premium features including AI analytics, thermal printing, and unlimited bills. After trial, upgrade for just ₹999/year!",
        "features": "Key features: AI-powered billing, KOT system, thermal printing (6 themes), multi-currency support, inventory management, staff management, real-time analytics, WhatsApp integration, table management, and more!",
        "inventory": "Inventory management helps track stock levels, get low-stock alerts, manage suppliers, and auto-deduct items when sold. Go to Inventory page to add items and set minimum quantities.",
        "staff": "Add unlimited staff with roles: Admin (full access), Cashier (billing only), Waiter (orders & tables), Kitchen (KOT view). Each role has specific permissions. Go to Staff Management to add team members.",
        "reports": "Access detailed reports: daily/monthly sales, top-selling items, revenue trends, tax summaries, and more. Export to CSV/PDF. Go to Reports page for analytics dashboard.",
        "currency": "We support 10+ currencies: INR, USD, EUR, GBP, AED, SGD, MYR, and more. Change currency in Settings > Business Settings. All prices and reports will update automatically!",
        "table": "Table management lets you track occupancy, assign orders to tables, and manage seating. Tables auto-release after payment. Add tables in Tables page with capacity and status.",
        "offline": "Desktop app works offline! Your data syncs when internet is back. Web version requires internet connection. Download desktop app for offline billing capability.",
        "security": "Your data is 100% secure with bank-grade encryption, HTTPS, secure MongoDB storage, and 99.9% uptime. We never share your data with third parties.",
        "setup": "Quick setup: 1) Sign up (30 seconds), 2) Add your restaurant details, 3) Create menu items, 4) Add tables, 5) Start billing! Takes less than 5 minutes total.",
        "demo": "Try our interactive demo! Login and you'll see a guided walkthrough showing how to create orders, assign tables, and process payments. It's hands-on and takes just 2 minutes!",
        "contact": "Contact us: Email: support@billbytekot.in or contact@billbytekot.in | Phone: +91-98765-43210 (Mon-Sat, 9-6 PM IST) | Office: FinVerge Technologies, Bangalore, India. Or submit a ticket using the contact form!"
    }
    
    # Simple keyword matching for responses
    message_lower = chat_request.message.lower()
    response = None
    
    for keyword, answer in common_responses.items():
        if keyword in message_lower:
            response = answer
            break
    
    # Default response if no match
    if not response:
        if "?" in chat_request.message:
            response = "Great question! I can help you with: pricing, thermal printer setup, KOT system, payments, WhatsApp integration, mobile/desktop apps, support options, free trial, features, inventory, staff management, reports, currency, tables, offline mode, security, setup guide, demo, or contact info. What would you like to know?"
        else:
            response = "Thanks for reaching out! I'm here to help with BillByteKOT. You can ask me about features, pricing, setup, technical support, or anything else. Or submit a support ticket for personalized assistance!"
    
    return {
        "success": True,
        "response": response,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring and load balancers"""
    try:
        # Check database connection with timeout
        await db.users.find_one({}, {"_id": 1})
        return {
            "status": "healthy",
            "message": "RestoBill AI Server is running",
            "version": "1.0.0",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "services": {"database": "connected", "api": "operational"},
            "database": db.name,
            "connection": "active",
        }
    except Exception as e:
        # Try a simple ping command as fallback
        try:
            await db.command("ping")
            return {
                "status": "degraded",
                "message": "Database ping successful but query failed",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "services": {"database": "limited", "api": "operational"},
                "database": db.name,
                "connection": "limited",
            }
        except Exception as ping_error:
            return {
                "status": "unhealthy",
                "message": f"Database connection failed: {str(e)}",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "services": {"database": "disconnected", "api": "operational"},
                "troubleshooting": "Check MongoDB Atlas connection string and network access",
            }


@app.get("/api/health")
async def api_health_check():
    """API health check endpoint"""
    return await health_check()


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint - basic server info"""
    return {
        "service": "RestoBill AI Server",
        "version": "1.0.0",
        "status": "running",
        "message": "Welcome to RestoBill AI - Restaurant Management System",
        "endpoints": {
            "health": "/health",
            "api_health": "/api/health",
            "api_docs": "/docs",
            "api_base": "/api",
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# Startup validation
@app.on_event("startup")
async def startup_validation():
    """Validate configuration and database connection on startup"""
    global client, db

    print("🍽️  Starting RestoBill AI Server...")

    # Check required environment variables
    required_vars = {
        "MONGO_URL": mongo_url,
        "DB_NAME": os.getenv("DB_NAME", "restrobill"),
        "JWT_SECRET": JWT_SECRET,
    }

    missing_vars = []
    for var, value in required_vars.items():
        if not value or (
            var == "JWT_SECRET"
            and value == "default-jwt-secret-please-change-in-production"
        ):
            missing_vars.append(var)

    if missing_vars:
        print(f"⚠️  Warning: Missing or default values for: {', '.join(missing_vars)}")
        if "MONGO_URL" in missing_vars:
            print(
                "💡 Set MONGO_URL environment variable with your MongoDB connection string"
            )
        if "JWT_SECRET" in missing_vars:
            print(
                "💡 Set JWT_SECRET environment variable with a secure 32+ character secret"
            )

    # Test database connection with multiple strategies
    connection_successful = False
    last_error = None

    # Strategy 1: Try current connection
    try:
        await db.command("ping")
        print(f"✅ Database connected: {db.name}")
        connection_successful = True
    except Exception as e:
        last_error = e
        print(f"❌ Primary connection failed: {e}")

        # Strategy 2: Try alternative client with different SSL settings
        try:
            print("🔄 Trying alternative SSL configuration...")
            alt_client = AsyncIOMotorClient(
                mongo_url,
                tls=True,
                tlsInsecure=True,
                tlsAllowInvalidCertificates=True,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=8000,
                maxPoolSize=50,
            )
            alt_db = alt_client[os.getenv("DB_NAME", "restrobill")]
            await alt_db.command("ping")

            # Replace global client with working one
            client = alt_client
            db = alt_db
            print(f"✅ Alternative connection successful: {db.name}")
            connection_successful = True

        except Exception as e2:
            last_error = e2
    
    # Create database indexes for faster queries (PERFORMANCE BOOST)
    if connection_successful:
        try:
            print("⚡ Creating database indexes for performance...")
            
            # Users collection indexes
            await db.users.create_index("id", unique=True)
            await db.users.create_index("username")
            await db.users.create_index("email")
            await db.users.create_index("organization_id")
            
            # Menu items indexes
            await db.menu_items.create_index("organization_id")
            await db.menu_items.create_index([("organization_id", 1), ("category", 1)])
            await db.menu_items.create_index([("organization_id", 1), ("available", 1)])
            
            # Orders indexes
            await db.orders.create_index("organization_id")
            await db.orders.create_index([("organization_id", 1), ("status", 1)])
            await db.orders.create_index([("organization_id", 1), ("created_at", -1)])
            await db.orders.create_index("table_id")
            
            # Tables indexes
            await db.tables.create_index("organization_id")
            await db.tables.create_index([("organization_id", 1), ("status", 1)])
            
            # Payments indexes
            await db.payments.create_index("organization_id")
            await db.payments.create_index([("organization_id", 1), ("created_at", -1)])
            await db.payments.create_index("order_id")
            
            # Inventory indexes
            await db.inventory.create_index("organization_id")
            await db.inventory.create_index([("organization_id", 1), ("quantity", 1)])
            
            print("✅ Database indexes created successfully")
        except Exception as e:
            print(f"⚠️  Index creation warning: {e}")
            print(f"❌ Alternative connection failed: {e2}")

            # Strategy 3: Try with pymongo legacy SSL options
            try:
                print("🔄 Trying with legacy SSL settings...")
                min_client = AsyncIOMotorClient(
                    mongo_url,
                    ssl=True,
                    ssl_cert_reqs=ssl.CERT_NONE,
                    serverSelectionTimeoutMS=8000,
                    connectTimeoutMS=10000,
                    socketTimeoutMS=20000,
                )
                min_db = min_client[os.getenv("DB_NAME", "restrobill")]
                await min_db.command("ping")

                client = min_client
                db = min_db
                print(f"✅ Legacy SSL connection successful: {db.name}")
                connection_successful = True

            except Exception as e3:
                last_error = e3
                print(f"❌ Legacy SSL connection failed: {e3}")

                # Strategy 4: Try with different connection approach
                try:
                    print("🔄 Trying direct connection without TLS validation...")
                    # Use base URL without TLS parameters for this attempt
                    base_mongo_url = (
                        mongo_url.split("?")[0] if "?" in mongo_url else mongo_url
                    )
                    direct_url = f"{base_mongo_url}?retryWrites=true&w=majority"

                    direct_client = AsyncIOMotorClient(
                        direct_url,
                        serverSelectionTimeoutMS=10000,
                        connectTimeoutMS=15000,
                        socketTimeoutMS=20000,
                    )
                    direct_db = direct_client[os.getenv("DB_NAME", "restrobill")]
                    await direct_db.command("ping")

                    client = direct_client
                    db = direct_db
                    print(f"✅ Direct connection successful: {db.name}")
                    connection_successful = True

                except Exception as e4:
                    last_error = e4
                    print(f"❌ Direct connection failed: {e4}")

    if not connection_successful:
        print(
            f"🔗 MongoDB URL: {mongo_url.replace(mongo_url.split('@')[0].split('://')[1] + '@', '***:***@') if '@' in mongo_url else mongo_url}"
        )

        # Provide specific troubleshooting for SSL errors
        if last_error:
            error_str = str(last_error)
            if "SSL" in error_str or "TLS" in error_str:
                print("💡 SSL/TLS Connection Issue Detected:")
                print("   Try setting these environment variables:")
                print("   MONGO_TLS_INSECURE=true")
                print("   Or update your MongoDB connection string with:")
                print(
                    "   mongodb+srv://user:pass@cluster.net/db?retryWrites=true&w=majority&tls=true&tlsInsecure=true"
                )
                print("   Contact your MongoDB Atlas admin for proper SSL certificates")
            elif "authentication" in error_str.lower():
                print("💡 Authentication Issue Detected:")
                print("   1. Verify username and password in connection string")
                print("   2. Check database user permissions in MongoDB Atlas")
            elif "timeout" in error_str.lower():
                print("💡 Connection Timeout Issue:")
                print("   1. Check network connectivity")
                print("   2. Verify MongoDB Atlas cluster is running")
                print("   3. Check if IP whitelist includes 0.0.0.0/0")
        else:
            print("💡 Unknown connection issue occurred")

        print("🔄 Server will continue running with degraded functionality")

    print(f"🚀 Server starting on port {os.getenv('PORT', '5000')}")


# ============ BULK UPLOAD ENDPOINTS ============

@api_router.post("/menu/bulk-upload")
async def bulk_upload_menu(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Bulk upload menu items from CSV"""
    if current_user["role"] not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files allowed")
    
    try:
        contents = await file.read()
        decoded = contents.decode('utf-8').splitlines()
        
        import csv
        reader = csv.DictReader(decoded)
        
        user_org_id = current_user.get("organization_id") or current_user["id"]
        items_added = 0
        errors = []
        
        for row_num, row in enumerate(reader, start=2):
            try:
                # Expected columns: name, category, price, description, available
                item = {
                    "id": str(uuid.uuid4()),
                    "name": row.get('name', '').strip(),
                    "category": row.get('category', 'Uncategorized').strip(),
                    "price": float(row.get('price', 0)),
                    "description": row.get('description', '').strip(),
                    "available": row.get('available', 'true').lower() == 'true',
                    "organization_id": user_org_id,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                
                if not item['name']:
                    errors.append(f"Row {row_num}: Name is required")
                    continue
                
                if item['price'] <= 0:
                    errors.append(f"Row {row_num}: Invalid price")
                    continue
                
                await db.menu_items.insert_one(item)
                items_added += 1
                
            except Exception as e:
                errors.append(f"Row {row_num}: {str(e)}")
        
        return {
            "message": f"Bulk upload completed",
            "items_added": items_added,
            "errors": errors if errors else None
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@api_router.post("/inventory/bulk-upload")
async def bulk_upload_inventory(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Bulk upload inventory items from CSV"""
    if current_user["role"] not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files allowed")
    
    try:
        contents = await file.read()
        decoded = contents.decode('utf-8').splitlines()
        
        import csv
        reader = csv.DictReader(decoded)
        
        user_org_id = current_user.get("organization_id") or current_user["id"]
        items_added = 0
        errors = []
        
        for row_num, row in enumerate(reader, start=2):
            try:
                # Expected columns: item_name, quantity, unit, min_quantity, supplier
                item = {
                    "id": str(uuid.uuid4()),
                    "name": row.get('item_name', '').strip(),
                    "quantity": float(row.get('quantity', 0)),
                    "unit": row.get('unit', 'pcs').strip(),
                    "min_quantity": float(row.get('min_quantity', 0)),
                    "price_per_unit": float(row.get('price_per_unit', 0)),
                    "organization_id": user_org_id,
                    "last_updated": datetime.now(timezone.utc).isoformat()
                }
                
                if not item['name']:
                    errors.append(f"Row {row_num}: Item name is required")
                    continue
                
                if item['quantity'] < 0:
                    errors.append(f"Row {row_num}: Invalid quantity")
                    continue
                
                # Check if item exists, update or insert
                existing = await db.inventory.find_one({
                    "name": item['name'],
                    "organization_id": user_org_id
                })
                
                if existing:
                    await db.inventory.update_one(
                        {"id": existing["id"]},
                        {"$set": item}
                    )
                else:
                    await db.inventory.insert_one(item)
                
                items_added += 1
                
            except Exception as e:
                errors.append(f"Row {row_num}: {str(e)}")
        
        return {
            "message": f"Bulk upload completed",
            "items_added": items_added,
            "errors": errors if errors else None
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@api_router.get("/templates/menu-csv")
async def download_menu_template():
    """Download menu CSV template"""
    csv_content = "name,category,price,description,available\n"
    csv_content += "Margherita Pizza,Pizza,299,Classic cheese pizza,true\n"
    csv_content += "Chicken Burger,Burgers,199,Grilled chicken burger,true\n"
    csv_content += "Coke,Beverages,50,Chilled coke,true\n"
    
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=menu_template.csv"}
    )


@api_router.get("/templates/inventory-csv")
async def download_inventory_template():
    """Download inventory CSV template"""
    csv_content = "item_name,quantity,unit,min_quantity,price_per_unit\n"
    csv_content += "Tomatoes,50,kg,10,80\n"
    csv_content += "Cheese,20,kg,5,400\n"
    csv_content += "Chicken,30,kg,10,250\n"
    
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=inventory_template.csv"}
    )


# ============ EXPORT & CUSTOMER MANAGEMENT ============

@api_router.get("/orders/export/excel")
async def export_orders_to_excel(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Export all orders to Excel file"""
    user_org_id = current_user.get("organization_id") or current_user["id"]
    
    # Build query
    query = {"organization_id": user_org_id}
    
    # Add date filters if provided
    if start_date or end_date:
        query["created_at"] = {}
        if start_date:
            query["created_at"]["$gte"] = start_date
        if end_date:
            query["created_at"]["$lte"] = end_date
    
    # Fetch orders
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(length=10000)
    
    if not orders:
        raise HTTPException(status_code=404, detail="No orders found")
    
    # Create CSV content
    csv_content = "Order ID,Date,Time,Table,Customer Name,Customer Phone,Waiter,Items,Subtotal,Tax,Discount,Total,Payment Method,Status\n"
    
    for order in orders:
        order_id = order.get("id", "")[:8]
        created_at = order.get("created_at", "")
        
        # Parse date and time
        try:
            dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            date_str = dt.strftime("%Y-%m-%d")
            time_str = dt.strftime("%H:%M:%S")
        except:
            date_str = created_at
            time_str = ""
        
        table_number = order.get("table_number", "")
        customer_name = order.get("customer_name", "")
        customer_phone = order.get("customer_phone", "")
        waiter_name = order.get("waiter_name", "")
        
        # Format items
        items = order.get("items", [])
        items_str = "; ".join([f"{item['quantity']}x {item['name']}" for item in items])
        
        subtotal = order.get("subtotal", 0)
        tax = order.get("tax", 0)
        discount = order.get("discount", 0)
        total = order.get("total", 0)
        payment_method = order.get("payment_method", "")
        status = order.get("status", "")
        
        # Escape commas in text fields
        items_str = items_str.replace(",", ";")
        customer_name = customer_name.replace(",", " ")
        
        csv_content += f'"{order_id}","{date_str}","{time_str}","{table_number}","{customer_name}","{customer_phone}","{waiter_name}","{items_str}",{subtotal},{tax},{discount},{total},"{payment_method}","{status}"\n'
    
    # Return as downloadable file
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=orders_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"}
    )


# Customer Management Models
class Customer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    total_orders: int = 0
    total_spent: float = 0.0
    last_visit: Optional[str] = None
    organization_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CustomerCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None


@api_router.post("/customers")
async def create_customer(
    customer_data: CustomerCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create or update customer record"""
    user_org_id = current_user.get("organization_id") or current_user["id"]
    
    # Check if customer already exists by phone
    existing = await db.customers.find_one({
        "phone": customer_data.phone,
        "organization_id": user_org_id
    })
    
    if existing:
        # Update existing customer
        await db.customers.update_one(
            {"id": existing["id"]},
            {
                "$set": {
                    "name": customer_data.name,
                    "email": customer_data.email,
                    "address": customer_data.address,
                    "notes": customer_data.notes,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        return {"message": "Customer updated", "customer_id": existing["id"]}
    
    # Create new customer
    customer = Customer(
        name=customer_data.name,
        phone=customer_data.phone,
        email=customer_data.email,
        address=customer_data.address,
        notes=customer_data.notes,
        organization_id=user_org_id
    )
    
    doc = customer.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    
    await db.customers.insert_one(doc)
    
    return {"message": "Customer created", "customer_id": customer.id}


@api_router.get("/customers")
async def get_customers(
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get all customers"""
    user_org_id = current_user.get("organization_id") or current_user["id"]
    
    query = {"organization_id": user_org_id}
    
    # Add search filter
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
    
    customers = await db.customers.find(query, {"_id": 0}).sort("created_at", -1).to_list(length=1000)
    
    return customers


@api_router.get("/customers/{customer_id}")
async def get_customer(
    customer_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get customer details with order history"""
    user_org_id = current_user.get("organization_id") or current_user["id"]
    
    customer = await db.customers.find_one({
        "id": customer_id,
        "organization_id": user_org_id
    }, {"_id": 0})
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Get customer's orders
    orders = await db.orders.find({
        "customer_phone": customer["phone"],
        "organization_id": user_org_id
    }, {"_id": 0}).sort("created_at", -1).to_list(length=100)
    
    # Calculate stats
    total_orders = len(orders)
    total_spent = sum(order.get("total", 0) for order in orders)
    last_visit = orders[0].get("created_at") if orders else None
    
    # Update customer stats
    await db.customers.update_one(
        {"id": customer_id},
        {
            "$set": {
                "total_orders": total_orders,
                "total_spent": total_spent,
                "last_visit": last_visit
            }
        }
    )
    
    customer["total_orders"] = total_orders
    customer["total_spent"] = total_spent
    customer["last_visit"] = last_visit
    customer["orders"] = orders
    
    return customer


@api_router.get("/customers/phone/{phone}")
async def get_customer_by_phone(
    phone: str,
    current_user: dict = Depends(get_current_user)
):
    """Get customer by phone number"""
    user_org_id = current_user.get("organization_id") or current_user["id"]
    
    customer = await db.customers.find_one({
        "phone": phone,
        "organization_id": user_org_id
    }, {"_id": 0})
    
    if not customer:
        return {"found": False}
    
    return {"found": True, "customer": customer}


@api_router.put("/customers/{customer_id}")
async def update_customer(
    customer_id: str,
    customer_data: CustomerCreate,
    current_user: dict = Depends(get_current_user)
):
    """Update customer details"""
    user_org_id = current_user.get("organization_id") or current_user["id"]
    
    result = await db.customers.update_one(
        {"id": customer_id, "organization_id": user_org_id},
        {
            "$set": {
                "name": customer_data.name,
                "phone": customer_data.phone,
                "email": customer_data.email,
                "address": customer_data.address,
                "notes": customer_data.notes,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    return {"message": "Customer updated"}


@api_router.delete("/customers/{customer_id}")
async def delete_customer(
    customer_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete customer"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admin can delete customers")
    
    user_org_id = current_user.get("organization_id") or current_user["id"]
    
    result = await db.customers.delete_one({
        "id": customer_id,
        "organization_id": user_org_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    return {"message": "Customer deleted"}


# ============================================================================
# Twilio WhatsApp Integration (Easy Setup)
# ============================================================================

@api_router.post("/twilio/whatsapp/send")
async def twilio_send_whatsapp(
    to_number: str,
    message: str,
    user: dict = Depends(get_current_user)
):
    """Send WhatsApp message via Twilio"""
    if not _TWILIO_WHATSAPP_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="Twilio WhatsApp not configured. Please add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to .env"
        )
    
    result = twilio_whatsapp.send_message(to_number, message)
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    
    return result

@api_router.post("/twilio/whatsapp/send-receipt")
async def twilio_send_receipt(
    to_number: str,
    order_id: str,
    user: dict = Depends(get_current_user)
):
    """Send order receipt via Twilio WhatsApp"""
    if not _TWILIO_WHATSAPP_AVAILABLE:
        raise HTTPException(status_code=503, detail="Twilio WhatsApp not configured")
    
    # Get order details
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Format order data
    order_data = {
        "order_id": order.get("id"),
        "restaurant_name": user.get("username", "BillByteKOT"),
        "date": order.get("created_at", datetime.now()).strftime("%Y-%m-%d %H:%M"),
        "items": order.get("items", []),
        "subtotal": order.get("subtotal", 0),
        "tax": order.get("tax", 0),
        "total": order.get("total", 0),
        "payment_method": order.get("payment_method", "Cash"),
        "status": order.get("status", "completed")
    }
    
    result = twilio_whatsapp.send_receipt(to_number, order_data)
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    
    return result

@api_router.post("/twilio/whatsapp/send-confirmation")
async def twilio_send_confirmation(
    to_number: str,
    order_id: str,
    user: dict = Depends(get_current_user)
):
    """Send order confirmation via Twilio WhatsApp"""
    if not _TWILIO_WHATSAPP_AVAILABLE:
        raise HTTPException(status_code=503, detail="Twilio WhatsApp not configured")
    
    # Get order details
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order_data = {
        "order_id": order.get("id"),
        "restaurant_name": user.get("username", "BillByteKOT"),
        "total": order.get("total", 0),
        "tracking_url": f"https://billbytekot.in/track/{order.get('tracking_token', '')}"
    }
    
    result = twilio_whatsapp.send_order_confirmation(to_number, order_data)
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    
    return result

@api_router.get("/twilio/whatsapp/status")
async def twilio_whatsapp_status(user: dict = Depends(get_current_user)):
    """Check Twilio WhatsApp configuration status"""
    if not _TWILIO_WHATSAPP_AVAILABLE:
        return {
            "configured": False,
            "message": "Twilio WhatsApp not available. Install twilio package: pip install twilio"
        }
    
    if not twilio_whatsapp.is_configured():
        return {
            "configured": False,
            "message": "Twilio credentials not set. Add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to .env"
        }
    
    account_info = twilio_whatsapp.get_account_info()
    
    return {
        "configured": True,
        "account_info": account_info,
        "from_number": twilio_whatsapp.from_number
    }


# ============================================================================
# Simple WhatsApp Integration (Free, No API Keys Required)
# ============================================================================

@api_router.post("/whatsapp/create-receipt-link")
async def create_whatsapp_receipt_link(
    phone_number: str,
    order_id: str,
    user: dict = Depends(get_current_user)
):
    """
    Create WhatsApp link to send receipt
    Opens WhatsApp with pre-filled receipt message
    No API keys needed!
    """
    # Get order details
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Format order data
    order_data = {
        "order_id": order.get("id"),
        "restaurant_name": user.get("username", "BillByteKOT"),
        "date": order.get("created_at", datetime.now()).strftime("%Y-%m-%d %H:%M"),
        "items": order.get("items", []),
        "subtotal": order.get("subtotal", 0),
        "tax": order.get("tax", 0),
        "total": order.get("total", 0),
        "payment_method": order.get("payment_method", "Cash"),
        "status": order.get("status", "completed")
    }
    
    # Create WhatsApp link
    link = simple_whatsapp.create_receipt_link(phone_number, order_data)
    
    return {
        "success": True,
        "whatsapp_link": link,
        "phone_number": phone_number,
        "message": "Click the link to open WhatsApp and send receipt"
    }

@api_router.post("/whatsapp/create-confirmation-link")
async def create_whatsapp_confirmation_link(
    phone_number: str,
    order_id: str,
    user: dict = Depends(get_current_user)
):
    """Create WhatsApp link to send order confirmation"""
    # Get order details
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order_data = {
        "order_id": order.get("id"),
        "restaurant_name": user.get("username", "BillByteKOT"),
        "total": order.get("total", 0),
        "tracking_url": f"https://billbytekot.in/track/{order.get('tracking_token', '')}"
    }
    
    link = simple_whatsapp.create_confirmation_link(phone_number, order_data)
    
    return {
        "success": True,
        "whatsapp_link": link,
        "phone_number": phone_number
    }

@api_router.post("/whatsapp/create-message-link")
async def create_whatsapp_message_link(
    phone_number: str,
    message: str,
    user: dict = Depends(get_current_user)
):
    """Create WhatsApp link with custom message"""
    link = simple_whatsapp.create_message_link(phone_number, message)
    
    return {
        "success": True,
        "whatsapp_link": link,
        "phone_number": phone_number
    }

@api_router.get("/whatsapp/business-link")
async def get_business_whatsapp_link(user: dict = Depends(get_current_user)):
    """Get business WhatsApp chat link"""
    link = simple_whatsapp.get_business_chat_link()
    
    return {
        "success": True,
        "whatsapp_link": link,
        "business_number": simple_whatsapp.business_number or "Not configured"
    }


# ============ SUPER ADMIN PANEL (Site Owner Only) ============
SUPER_ADMIN_USERNAME = os.getenv("SUPER_ADMIN_USERNAME", "shiv")
SUPER_ADMIN_PASSWORD = os.getenv("SUPER_ADMIN_PASSWORD", "shiv@123")

def verify_super_admin(username: str, password: str) -> bool:
    """Verify super admin credentials"""
    return username == SUPER_ADMIN_USERNAME and password == SUPER_ADMIN_PASSWORD

@api_router.get("/super-admin/dashboard")
async def get_super_admin_dashboard(username: str, password: str):
    """Get complete system overview - Site Owner Only"""
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    # Get all users
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    
    # Get all tickets
    tickets = await db.support_tickets.find({}, {"_id": 0}).to_list(1000)
    
    # Get recent orders (last 30 days)
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    recent_orders = await db.orders.find(
        {"created_at": {"$gte": thirty_days_ago}},
        {"_id": 0}
    ).to_list(10000)
    
    # Calculate statistics
    total_users = len(users)
    active_subscriptions = sum(1 for u in users if u.get("subscription_active"))
    trial_users = sum(1 for u in users if not u.get("subscription_active"))
    
    # Ticket statistics
    open_tickets = sum(1 for t in tickets if t.get("status") == "open")
    pending_tickets = sum(1 for t in tickets if t.get("status") == "pending")
    resolved_tickets = sum(1 for t in tickets if t.get("status") == "resolved")
    
    # Lead statistics
    total_leads = await db.leads.count_documents({})
    new_leads = await db.leads.count_documents({"status": "new"})
    
    return {
        "overview": {
            "total_users": total_users,
            "active_subscriptions": active_subscriptions,
            "trial_users": trial_users,
            "total_orders_30d": len(recent_orders),
            "open_tickets": open_tickets,
            "pending_tickets": pending_tickets,
            "resolved_tickets": resolved_tickets,
            "total_leads": total_leads,
            "new_leads": new_leads
        },
        "users": users,
        "tickets": tickets,
        "recent_orders": recent_orders[:100]
    }

@api_router.get("/super-admin/users")
async def get_all_users_admin(username: str, password: str, skip: int = 0, limit: int = 100):
    """Get all users - Site Owner Only"""
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    users = await db.users.find({}, {"_id": 0, "password": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.users.count_documents({})
    
    return {"users": users, "total": total, "skip": skip, "limit": limit}

class SubscriptionUpdate(BaseModel):
    subscription_active: bool
    subscription_expires_at: Optional[str] = None

@api_router.put("/super-admin/users/{user_id}/subscription")
async def update_user_subscription_admin(
    user_id: str,
    subscription_update: SubscriptionUpdate,
    username: str,
    password: str
):
    """Manually update user subscription - Site Owner Only"""
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    update_data = {"subscription_active": subscription_update.subscription_active}
    if subscription_update.subscription_expires_at:
        update_data["subscription_expires_at"] = subscription_update.subscription_expires_at
    
    result = await db.users.update_one({"id": user_id}, {"$set": update_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "message": "Subscription updated successfully",
        "user_id": user_id,
        "subscription_active": subscription_update.subscription_active
    }

@api_router.delete("/super-admin/users/{user_id}")
async def delete_user_admin(user_id: str, username: str, password: str):
    """Delete user and all their data - Site Owner Only"""
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    # Delete user and all data
    await db.users.delete_one({"id": user_id})
    await db.orders.delete_many({"organization_id": user_id})
    await db.menu_items.delete_many({"organization_id": user_id})
    await db.tables.delete_many({"organization_id": user_id})
    await db.payments.delete_many({"organization_id": user_id})
    await db.inventory.delete_many({"organization_id": user_id})
    
    return {"message": "User and all data deleted successfully", "user_id": user_id}

@api_router.get("/super-admin/tickets")
async def get_all_tickets_admin(
    username: str,
    password: str,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    """Get all support tickets - Site Owner Only"""
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    query = {}
    if status:
        query["status"] = status
    
    tickets = await db.support_tickets.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.support_tickets.count_documents(query)
    
    return {"tickets": tickets, "total": total, "skip": skip, "limit": limit}

class TicketUpdate(BaseModel):
    status: str
    admin_notes: Optional[str] = None

@api_router.put("/super-admin/tickets/{ticket_id}")
async def update_ticket_admin(
    ticket_id: str,
    ticket_update: TicketUpdate,
    username: str,
    password: str
):
    """Update ticket status - Site Owner Only"""
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    update_data = {
        "status": ticket_update.status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    if ticket_update.admin_notes:
        update_data["admin_notes"] = ticket_update.admin_notes
    
    result = await db.support_tickets.update_one({"id": ticket_id}, {"$set": update_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    return {"message": "Ticket updated successfully", "ticket_id": ticket_id, "status": ticket_update.status}

@api_router.get("/super-admin/analytics")
async def get_analytics_admin(username: str, password: str, days: int = 30):
    """Get system analytics - Site Owner Only"""
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    start_date = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    
    new_users = await db.users.count_documents({"created_at": {"$gte": start_date}})
    new_orders = await db.orders.count_documents({"created_at": {"$gte": start_date}})
    new_tickets = await db.support_tickets.count_documents({"created_at": {"$gte": start_date}})
    
    return {
        "period_days": days,
        "new_users": new_users,
        "new_orders": new_orders,
        "new_tickets": new_tickets,
        "start_date": start_date
    }

@api_router.get("/super-admin/leads")
async def get_all_leads_admin(
    username: str,
    password: str,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None
):
    """Get all leads from landing page - Site Owner Only"""
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    # Build query
    query = {}
    if status:
        query["status"] = status
    
    leads = await db.leads.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.leads.count_documents(query)
    
    # Count by status
    new_count = await db.leads.count_documents({"status": "new"})
    contacted_count = await db.leads.count_documents({"status": "contacted"})
    converted_count = await db.leads.count_documents({"status": "converted"})
    
    return {
        "leads": leads,
        "total": total,
        "skip": skip,
        "limit": limit,
        "stats": {
            "new": new_count,
            "contacted": contacted_count,
            "converted": converted_count
        }
    }

class LeadUpdate(BaseModel):
    status: str
    notes: Optional[str] = None
    contacted: Optional[bool] = None

@api_router.put("/super-admin/leads/{lead_id}")
async def update_lead_admin(
    lead_id: str,
    lead_update: LeadUpdate,
    username: str,
    password: str
):
    """Update lead status - Site Owner Only"""
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    update_data = {
        "status": lead_update.status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    if lead_update.notes:
        update_data["notes"] = lead_update.notes
    if lead_update.contacted is not None:
        update_data["contacted"] = lead_update.contacted
    
    # Find by timestamp (used as ID in leads)
    result = await db.leads.update_one({"timestamp": lead_id}, {"$set": update_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    return {"message": "Lead updated successfully", "lead_id": lead_id, "status": lead_update.status}

@api_router.delete("/super-admin/leads/{lead_id}")
async def delete_lead_admin(lead_id: str, username: str, password: str):
    """Delete lead - Site Owner Only"""
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    result = await db.leads.delete_one({"timestamp": lead_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    return {"message": "Lead deleted successfully", "lead_id": lead_id}


# Include all API routes
app.include_router(api_router)


# Serve Windows app download
from fastapi.responses import FileResponse, JSONResponse

@app.get("/downloads/windows")
async def download_windows_app():
    """Serve Windows desktop app for download"""
    file_path = ROOT_DIR / "downloads" / "BillByteKOT-Setup.exe"
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Windows app not found")
    
    return FileResponse(
        path=str(file_path),
        media_type="application/octet-stream",
        filename="BillByteKOT-Setup.exe"
    )


# Serve Digital Asset Links for Android TWA
@app.get("/.well-known/assetlinks.json")
async def get_assetlinks():
    """Serve assetlinks.json for Android TWA verification"""
    assetlinks = [{
        "relation": ["delegate_permission/common.handle_all_urls"],
        "target": {
            "namespace": "android_app",
            "package_name": "in.billbytekot.twa",
            "sha256_cert_fingerprints": [
                "4F:84:00:E3:DE:51:70:1A:88:78:82:B9:3F:1E:48:91:18:73:1E:E5:22:6F:D4:92:06:A1:8C:99:7A:CD:7C:6D"
            ]
        }
    }]
    
    return JSONResponse(
        content=assetlinks,
        media_type="application/json",
        headers={
            "Cache-Control": "public, max-age=3600",
            "Access-Control-Allow-Origin": "*"
        }
    )


logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
