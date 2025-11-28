import base64
import json
import logging
import os
import ssl
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

import jwt
import razorpay
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, FastAPI, File, HTTPException, UploadFile, status
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

# Configure MongoDB client with SSL settings for Atlas compatibility
try:
    if (
        "mongodb+srv://" in mongo_url
        or "ssl=true" in mongo_url
        or "tls=true" in mongo_url
    ):
        # For MongoDB Atlas, use TLS with proper certificate handling
        client = AsyncIOMotorClient(
            mongo_url,
            tls=True,
            tlsInsecure=True,  # Allow invalid certificates for Render compatibility
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=10000,
            socketTimeoutMS=10000,
        )
    else:
        # For local or non-SSL connections
        client = AsyncIOMotorClient(mongo_url)
except Exception as e:
    print(f"MongoDB client creation failed: {e}")
    # Fallback to basic client with minimal TLS settings
    try:
        client = AsyncIOMotorClient(
            mongo_url, tls=True, tlsInsecure=True, serverSelectionTimeoutMS=5000
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

app = FastAPI()
api_router = APIRouter(prefix="/api")


# Dynamic CORS origin checker
def is_allowed_origin(origin: str) -> bool:
    """Check if the origin is allowed for CORS"""
    allowed_patterns = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://restro-ai.onrender.com",
        "https://restro-ai-u9kz.vercel.app",
        "https://finverge.tech",
        "https://www.finverge.tech",
    ]

    # Check exact matches
    if origin in allowed_patterns:
        return True

    # Check pattern matches
    domain_patterns = [".vercel.app", ".netlify.app", ".onrender.com", ".render.com", ".finverge.tech"]

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
    "https://finverge.tech",
    "https://www.finverge.tech",
    # exact current frontend origin:
    "https://restro-ai-u9kz-ed0v8idw3-shivs-projects-db2d52eb.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    # if you want to allow all your future Vercel previews:
    allow_origin_regex=r"https://.*\.vercel\.app$",
    allow_credentials=True,  # keep this if you ever use cookies/auth headers
    allow_methods=["*"],
    allow_headers=["*"],
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


class UserLogin(BaseModel):
    username: str
    password: str


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
    organization_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class OrderCreate(BaseModel):
    table_id: str
    table_number: int
    items: List[OrderItem]
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None  # For WhatsApp notifications


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
    amount: float = 499.0  # ₹499/year


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


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
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
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def check_subscription(user: dict):
    # Check if user is in trial period (7 days from account creation)
    created_at = user.get("created_at")
    if isinstance(created_at, str):
        try:
            created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
        except:
            created_at = None
    
    if created_at:
        trial_end = created_at + timedelta(days=7)
        if datetime.now(timezone.utc) < trial_end:
            return True  # Still in trial period
    
    # Check subscription status
    if user["bill_count"] >= 50 and not user["subscription_active"]:
        return False
    if user["subscription_active"] and user.get("subscription_expires_at"):
        expires = user["subscription_expires_at"]
        if isinstance(expires, str):
            expires = datetime.fromisoformat(expires.replace("Z", "+00:00"))
        if expires < datetime.now(timezone.utc):
            await db.users.update_one(
                {"id": user["id"]}, {"$set": {"subscription_active": False}}
            )
            return False
    return True


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
GSTIN: {gstin}
{f"FSSAI: {fssai}" if fssai else ""}
{sep_dash}
Bill #: {order["id"][:8]}
Table: {order["table_number"]}
Waiter: {order["waiter_name"]}
Customer: {order.get("customer_name", "Guest")}
Date: {now_str}
{sep_dash}
ITEMS:
{items_text}{sep_dash}
Subtotal:         {currency_symbol}{order["subtotal"]:.2f}
Tax ({tax_rate}%):          {currency_symbol}{order["tax"]:.2f}
{sep_dash}
TOTAL:            {currency_symbol}{order["total"]:.2f}
{sep_dash}
{footer_msg}
{f"Visit: {website}" if website else "Visit again soon!"}
{sep_eq}
""",
        "modern": f"""
┌{sep_light}┐
│ {rest_name_44} │
{f"│ {tagline.center(44)} │" if tagline else ""}
├{sep_light}┤
│ {address_44} │
│ ☎ {phone:<42} │
{f"│ 🌐 {website:<42} │" if website else ""}
└{sep_light}┘

🧾 Bill #{order["id"][:8]}
🍽️  Table {order["table_number"]} | 👤 {order["waiter_name"]}
👥 {order.get("customer_name", "Guest")}
📅 {now_str}

{sep_light}
{items_modern}{sep_light}
Subtotal                      {currency_symbol}{order["subtotal"]:.2f}
Tax ({tax_rate}%)                        {currency_symbol}{order["tax"]:.2f}
{sep_heavy}
💰 TOTAL                      {currency_symbol}{order["total"]:.2f}
{sep_heavy}

✨ {footer_msg} ✨
{f"GSTIN: {gstin}" if gstin != "N/A" else ""}
""",
        "minimal": f"""
{rest_name}
{address}
{phone}

Bill: {order["id"][:8]} | Table: {order["table_number"]}
{now_str}

{items_minimal}
Subtotal: {currency_symbol}{order["subtotal"]:.2f}
Tax ({tax_rate}%): {currency_symbol}{order["tax"]:.2f}
Total: {currency_symbol}{order["total"]:.2f}

{footer_msg}
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
@api_router.post("/auth/register", response_model=User)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"username": user_data.username}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    # Create user object
    user_obj = User(
        username=user_data.username, email=user_data.email, role=user_data.role
    )

    # If admin, they are their own organization
    if user_data.role == "admin":
        user_obj.organization_id = user_obj.id

    doc = user_obj.model_dump()
    doc["password"] = hash_password(user_data.password)
    doc["created_at"] = doc["created_at"].isoformat()

    await db.users.insert_one(doc)
    return user_obj


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
            "subscription_active": user.get("subscription_active", False),
            "bill_count": user.get("bill_count", 0),
            "setup_completed": user.get("setup_completed", False),
            "business_settings": user.get("business_settings"),
        },
    }


@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user


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


# Subscription - ₹499/year with 7-day free trial
SUBSCRIPTION_PRICE_PAISE = 49900  # ₹499 in paise
TRIAL_DAYS = 7
SUBSCRIPTION_DAYS = 365


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
        "price": 499,
        "price_display": "₹499/year"
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


@api_router.post("/subscription/create-order")
async def create_subscription_order(current_user: dict = Depends(get_current_user)):
    razorpay_key_id = current_user.get("razorpay_key_id") or os.environ.get(
        "RAZORPAY_KEY_ID"
    )
    razorpay_key_secret = current_user.get("razorpay_key_secret") or os.environ.get(
        "RAZORPAY_KEY_SECRET"
    )

    if not razorpay_key_id or not razorpay_key_secret:
        raise HTTPException(
            status_code=400,
            detail="Razorpay not configured. Please configure in settings.",
        )

    razorpay_client = razorpay.Client(auth=(razorpay_key_id, razorpay_key_secret))

    razor_order = razorpay_client.order.create(
        {"amount": SUBSCRIPTION_PRICE_PAISE, "currency": "INR", "payment_capture": 1}
    )

    return {
        "razorpay_order_id": razor_order["id"],
        "amount": SUBSCRIPTION_PRICE_PAISE,
        "currency": "INR",
        "key_id": razorpay_key_id,
        "price_display": "₹499"
    }


@api_router.post("/subscription/verify")
async def verify_subscription_payment(
    razorpay_payment_id: str,
    razorpay_order_id: str,
    current_user: dict = Depends(get_current_user),
):
    expires_at = datetime.now(timezone.utc) + timedelta(days=SUBSCRIPTION_DAYS)

    await db.users.update_one(
        {"id": current_user["id"]},
        {
            "$set": {
                "subscription_active": True,
                "subscription_expires_at": expires_at.isoformat(),
            }
        },
    )

    return {
        "status": "subscription_activated", 
        "expires_at": expires_at.isoformat(),
        "days": SUBSCRIPTION_DAYS
    }


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


def get_status_message(status: str, order: dict, business: dict) -> str:
    """Generate status-specific WhatsApp message"""
    restaurant_name = business.get("restaurant_name", "Restaurant")
    currency = CURRENCY_SYMBOLS.get(business.get("currency", "INR"), "₹")
    order_id = order["id"][:8]
    tracking_token = order.get("tracking_token", "")
    frontend_url = business.get("frontend_url", "")
    
    tracking_link = f"{frontend_url}/track/{tracking_token}" if frontend_url and tracking_token else ""
    
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
        raise HTTPException(
            status_code=402,
            detail="Subscription required. You have reached 50 bills. Please subscribe to continue.",
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
    if order_data.customer_phone and business.get("whatsapp_auto_notify") and business.get("whatsapp_notify_on_placed"):
        message = get_status_message("pending", doc, business)
        whatsapp_link = generate_whatsapp_notification(order_data.customer_phone, message)

    return {
        **order_obj.model_dump(),
        "whatsapp_link": whatsapp_link,
        "tracking_token": tracking_token
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
    order_id: str, status: str, current_user: dict = Depends(get_current_user)
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
            message = get_status_message(status, order, business)
            whatsapp_link = generate_whatsapp_notification(customer_phone, message)

    return {
        "message": "Order status updated",
        "whatsapp_link": whatsapp_link,
        "customer_phone": customer_phone
    }


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
        razorpay_key_id = current_user.get("razorpay_key_id") or os.environ.get(
            "RAZORPAY_KEY_ID"
        )
        razorpay_key_secret = current_user.get("razorpay_key_secret") or os.environ.get(
            "RAZORPAY_KEY_SECRET"
        )

        if not razorpay_key_id or not razorpay_key_secret:
            raise HTTPException(status_code=400, detail="Razorpay not configured")

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
async def get_recommendations():
    try:
        orders = (
            await db.orders.find({"status": "completed"}, {"_id": 0})
            .limit(50)
            .to_list(50)
        )
        menu_items = await db.menu_items.find({}, {"_id": 0}).to_list(1000)

        order_items = []
        for order in orders:
            order_items.extend([item["name"] for item in order["items"]])

        from collections import Counter

        popular_items = Counter(order_items).most_common(5)

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
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/ai/sales-forecast")
async def sales_forecast():
    try:
        orders = await db.orders.find({"status": "completed"}, {"_id": 0}).to_list(1000)

        total_sales = sum(order["total"] for order in orders)
        avg_order_value = total_sales / len(orders) if orders else 0

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
        raise HTTPException(status_code=500, detail=str(e))


# Reports
@api_router.get("/reports/daily")
async def daily_report():
    today = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    orders = await db.orders.find({"status": "completed"}, {"_id": 0}).to_list(1000)

    today_orders = []
    for order in orders:
        order_date = order["created_at"]
        if isinstance(order_date, str):
            order_date = datetime.fromisoformat(order_date)
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
async def export_report(start_date: str, end_date: str):
    start = datetime.fromisoformat(start_date)
    end = datetime.fromisoformat(end_date)

    orders = await db.orders.find({"status": "completed"}, {"_id": 0}).to_list(1000)
    filtered_orders = []

    for order in orders:
        order_date = order["created_at"]
        if isinstance(order_date, str):
            order_date = datetime.fromisoformat(order_date)
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
            order_date = datetime.fromisoformat(order_date)
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
            order_date = datetime.fromisoformat(order_date)
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
    item_stats = defaultdict(lambda: {"total_sold": 0, "total_revenue": 0, "name": "", "category": ""})
    
    for order in orders:
        for item in order["items"]:
            item_id = item.get("menu_item_id", item["name"])
            item_stats[item_id]["name"] = item["name"]
            item_stats[item_id]["total_sold"] += item["quantity"]
            item_stats[item_id]["total_revenue"] += item["price"] * item["quantity"]
    
    # Get category info from menu
    for item_id, stats in item_stats.items():
        menu_item = await db.menu_items.find_one({"name": stats["name"], "organization_id": user_org_id}, {"_id": 0})
        if menu_item:
            stats["category"] = menu_item.get("category", "Uncategorized")
    
    sorted_items = sorted(item_stats.values(), key=lambda x: x["total_sold"], reverse=True)[:10]
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


# ============ PUBLIC ENDPOINTS (No Auth Required) ============
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
    
    # Generate WhatsApp notification
    whatsapp_link = None
    if business.get("whatsapp_auto_notify") and business.get("whatsapp_notify_on_placed"):
        message = get_status_message("pending", doc, business)
        whatsapp_link = generate_whatsapp_notification(order_data.customer_phone, message)
    
    frontend_url = business.get("frontend_url", "")
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


app.include_router(api_router)


logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
