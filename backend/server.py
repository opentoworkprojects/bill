from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
import razorpay
import base64
import json
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
JWT_SECRET = os.environ.get('JWT_SECRET')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')

# Razorpay client
razorpay_client = razorpay.Client(auth=(os.environ.get('RAZORPAY_KEY_ID', ''), os.environ.get('RAZORPAY_KEY_SECRET', '')))

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: str
    role: str  # admin, waiter, cashier, kitchen
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: str = "waiter"

class UserLogin(BaseModel):
    username: str
    password: str

class MenuItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str
    price: float
    description: Optional[str] = None
    image_url: Optional[str] = None
    available: bool = True
    ingredients: Optional[List[str]] = []
    preparation_time: Optional[int] = 15  # minutes
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MenuItemCreate(BaseModel):
    name: str
    category: str
    price: float
    description: Optional[str] = None
    image_url: Optional[str] = None
    available: bool = True
    ingredients: Optional[List[str]] = []
    preparation_time: Optional[int] = 15

class Table(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    table_number: int
    capacity: int
    status: str = "available"  # available, occupied, reserved
    current_order_id: Optional[str] = None

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
    status: str = "pending"  # pending, preparing, ready, completed, cancelled
    waiter_id: str
    waiter_name: str
    customer_name: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrderCreate(BaseModel):
    table_id: str
    table_number: int
    items: List[OrderItem]
    customer_name: Optional[str] = None

class Payment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_id: str
    amount: float
    payment_method: str  # cash, card, upi, razorpay
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    status: str = "pending"  # pending, completed, failed
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PaymentCreate(BaseModel):
    order_id: str
    amount: float
    payment_method: str

class InventoryItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    quantity: float
    unit: str
    min_quantity: float
    price_per_unit: float
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class InventoryItemCreate(BaseModel):
    name: str
    quantity: float
    unit: str
    min_quantity: float
    price_per_unit: float

class ChatMessage(BaseModel):
    message: str

class AIRecommendation(BaseModel):
    recommendations: List[str]

class PrintData(BaseModel):
    content: str
    type: str  # bill, kot

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

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Auth routes
@api_router.post("/auth/register", response_model=User)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"username": user_data.username}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    user_obj = User(
        username=user_data.username,
        email=user_data.email,
        role=user_data.role
    )
    doc = user_obj.model_dump()
    doc['password'] = hash_password(user_data.password)
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.users.insert_one(doc)
    return user_obj

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"username": credentials.username}, {"_id": 0})
    if not user or not verify_password(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"user_id": user['id'], "role": user['role']})
    return {"token": token, "user": {"id": user['id'], "username": user['username'], "role": user['role'], "email": user['email']}}

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

# Menu routes
@api_router.post("/menu", response_model=MenuItem)
async def create_menu_item(item: MenuItemCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['admin', 'cashier']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    menu_obj = MenuItem(**item.model_dump())
    doc = menu_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.menu_items.insert_one(doc)
    return menu_obj

@api_router.get("/menu", response_model=List[MenuItem])
async def get_menu():
    items = await db.menu_items.find({}, {"_id": 0}).to_list(1000)
    for item in items:
        if isinstance(item['created_at'], str):
            item['created_at'] = datetime.fromisoformat(item['created_at'])
    return items

@api_router.get("/menu/{item_id}", response_model=MenuItem)
async def get_menu_item(item_id: str):
    item = await db.menu_items.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if isinstance(item['created_at'], str):
        item['created_at'] = datetime.fromisoformat(item['created_at'])
    return item

@api_router.put("/menu/{item_id}", response_model=MenuItem)
async def update_menu_item(item_id: str, item: MenuItemCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['admin', 'cashier']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    existing = await db.menu_items.find_one({"id": item_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Item not found")
    
    update_data = item.model_dump()
    await db.menu_items.update_one({"id": item_id}, {"$set": update_data})
    
    updated = await db.menu_items.find_one({"id": item_id}, {"_id": 0})
    if isinstance(updated['created_at'], str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated

@api_router.delete("/menu/{item_id}")
async def delete_menu_item(item_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.menu_items.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item deleted"}

# Table routes
@api_router.post("/tables", response_model=Table)
async def create_table(table: TableCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['admin', 'cashier']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    table_obj = Table(**table.model_dump())
    await db.tables.insert_one(table_obj.model_dump())
    return table_obj

@api_router.get("/tables", response_model=List[Table])
async def get_tables():
    tables = await db.tables.find({}, {"_id": 0}).to_list(1000)
    return tables

@api_router.put("/tables/{table_id}", response_model=Table)
async def update_table(table_id: str, table: TableCreate, current_user: dict = Depends(get_current_user)):
    existing = await db.tables.find_one({"id": table_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Table not found")
    
    await db.tables.update_one({"id": table_id}, {"$set": table.model_dump()})
    updated = await db.tables.find_one({"id": table_id}, {"_id": 0})
    return updated

# Order routes
@api_router.post("/orders", response_model=Order)
async def create_order(order_data: OrderCreate, current_user: dict = Depends(get_current_user)):
    subtotal = sum(item.price * item.quantity for item in order_data.items)
    tax = subtotal * 0.05  # 5% tax
    total = subtotal + tax
    
    order_obj = Order(
        table_id=order_data.table_id,
        table_number=order_data.table_number,
        items=[item.model_dump() for item in order_data.items],
        subtotal=subtotal,
        tax=tax,
        total=total,
        waiter_id=current_user['id'],
        waiter_name=current_user['username'],
        customer_name=order_data.customer_name
    )
    
    doc = order_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.orders.insert_one(doc)
    await db.tables.update_one({"id": order_data.table_id}, {"$set": {"status": "occupied", "current_order_id": order_obj.id}})
    
    return order_obj

@api_router.get("/orders", response_model=List[Order])
async def get_orders(status: Optional[str] = None):
    query = {} if not status else {"status": status}
    orders = await db.orders.find(query, {"_id": 0}).to_list(1000)
    for order in orders:
        if isinstance(order['created_at'], str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
        if isinstance(order['updated_at'], str):
            order['updated_at'] = datetime.fromisoformat(order['updated_at'])
    return orders

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if isinstance(order['created_at'], str):
        order['created_at'] = datetime.fromisoformat(order['created_at'])
    if isinstance(order['updated_at'], str):
        order['updated_at'] = datetime.fromisoformat(order['updated_at'])
    return order

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str, current_user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    await db.orders.update_one({"id": order_id}, {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}})
    
    if status == "completed":
        await db.tables.update_one({"id": order['table_id']}, {"$set": {"status": "available", "current_order_id": None}})
    
    return {"message": "Order status updated"}

# Payment routes
@api_router.post("/payments/create-order")
async def create_payment_order(payment_data: PaymentCreate):
    order = await db.orders.find_one({"id": payment_data.order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if payment_data.payment_method == "razorpay":
        amount_paise = int(payment_data.amount * 100)
        razor_order = razorpay_client.order.create({
            "amount": amount_paise,
            "currency": "INR",
            "payment_capture": 1
        })
        
        payment_obj = Payment(
            order_id=payment_data.order_id,
            amount=payment_data.amount,
            payment_method=payment_data.payment_method,
            razorpay_order_id=razor_order['id']
        )
        
        doc = payment_obj.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.payments.insert_one(doc)
        
        return {"razorpay_order_id": razor_order['id'], "amount": amount_paise, "currency": "INR", "key_id": os.environ.get('RAZORPAY_KEY_ID')}
    else:
        payment_obj = Payment(
            order_id=payment_data.order_id,
            amount=payment_data.amount,
            payment_method=payment_data.payment_method,
            status="completed"
        )
        
        doc = payment_obj.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.payments.insert_one(doc)
        
        await db.orders.update_one({"id": payment_data.order_id}, {"$set": {"status": "completed"}})
        
        return {"payment_id": payment_obj.id, "status": "completed"}

@api_router.post("/payments/verify")
async def verify_payment(razorpay_payment_id: str, razorpay_order_id: str, order_id: str):
    payment = await db.payments.find_one({"razorpay_order_id": razorpay_order_id}, {"_id": 0})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    await db.payments.update_one(
        {"razorpay_order_id": razorpay_order_id},
        {"$set": {"razorpay_payment_id": razorpay_payment_id, "status": "completed"}}
    )
    
    await db.orders.update_one({"id": order_id}, {"$set": {"status": "completed"}})
    
    return {"status": "payment_verified"}

@api_router.get("/payments")
async def get_payments():
    payments = await db.payments.find({}, {"_id": 0}).to_list(1000)
    for payment in payments:
        if isinstance(payment['created_at'], str):
            payment['created_at'] = datetime.fromisoformat(payment['created_at'])
    return payments

# Inventory routes
@api_router.post("/inventory", response_model=InventoryItem)
async def create_inventory_item(item: InventoryItemCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['admin', 'cashier']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    inv_obj = InventoryItem(**item.model_dump())
    doc = inv_obj.model_dump()
    doc['last_updated'] = doc['last_updated'].isoformat()
    await db.inventory.insert_one(doc)
    return inv_obj

@api_router.get("/inventory", response_model=List[InventoryItem])
async def get_inventory():
    items = await db.inventory.find({}, {"_id": 0}).to_list(1000)
    for item in items:
        if isinstance(item['last_updated'], str):
            item['last_updated'] = datetime.fromisoformat(item['last_updated'])
    return items

@api_router.put("/inventory/{item_id}", response_model=InventoryItem)
async def update_inventory_item(item_id: str, item: InventoryItemCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['admin', 'cashier']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = item.model_dump()
    update_data['last_updated'] = datetime.now(timezone.utc).isoformat()
    
    await db.inventory.update_one({"id": item_id}, {"$set": update_data})
    updated = await db.inventory.find_one({"id": item_id}, {"_id": 0})
    if isinstance(updated['last_updated'], str):
        updated['last_updated'] = datetime.fromisoformat(updated['last_updated'])
    return updated

@api_router.get("/inventory/low-stock")
async def get_low_stock():
    items = await db.inventory.find({}, {"_id": 0}).to_list(1000)
    low_stock = [item for item in items if item['quantity'] <= item['min_quantity']]
    return low_stock

# AI routes
@api_router.post("/ai/chat")
async def ai_chat(message: ChatMessage):
    try:
        chat = LlmChat(
            api_key=os.environ.get('EMERGENT_LLM_KEY'),
            session_id=str(uuid.uuid4()),
            system_message="You are a helpful restaurant assistant. Answer customer queries about menu, orders, and restaurant services."
        ).with_model("openai", "gpt-4o-mini")
        
        user_msg = UserMessage(text=message.message)
        response = await chat.send_message(user_msg)
        
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/ai/recommendations")
async def get_recommendations():
    try:
        orders = await db.orders.find({"status": "completed"}, {"_id": 0}).limit(50).to_list(50)
        menu_items = await db.menu_items.find({}, {"_id": 0}).to_list(1000)
        
        order_items = []
        for order in orders:
            order_items.extend([item['name'] for item in order['items']])
        
        from collections import Counter
        popular_items = Counter(order_items).most_common(5)
        
        chat = LlmChat(
            api_key=os.environ.get('EMERGENT_LLM_KEY'),
            session_id=str(uuid.uuid4()),
            system_message="You are a restaurant menu analyst. Based on order history, suggest menu items that would pair well together."
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
        
        total_sales = sum(order['total'] for order in orders)
        avg_order_value = total_sales / len(orders) if orders else 0
        
        chat = LlmChat(
            api_key=os.environ.get('EMERGENT_LLM_KEY'),
            session_id=str(uuid.uuid4()),
            system_message="You are a sales analyst. Provide sales predictions based on historical data."
        ).with_model("openai", "gpt-4o-mini")
        
        prompt = f"Total orders: {len(orders)}, Total sales: ₹{total_sales:.2f}, Average order: ₹{avg_order_value:.2f}. Predict next week's sales."
        user_msg = UserMessage(text=prompt)
        response = await chat.send_message(user_msg)
        
        return {"forecast": response, "current_stats": {"total_orders": len(orders), "total_sales": total_sales, "avg_order": avg_order_value}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Reports
@api_router.get("/reports/daily")
async def daily_report():
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    orders = await db.orders.find({"status": "completed"}, {"_id": 0}).to_list(1000)
    
    today_orders = []
    for order in orders:
        order_date = order['created_at']
        if isinstance(order_date, str):
            order_date = datetime.fromisoformat(order_date)
        if order_date >= today:
            today_orders.append(order)
    
    total_sales = sum(order['total'] for order in today_orders)
    total_orders = len(today_orders)
    
    return {
        "date": today.isoformat(),
        "total_orders": total_orders,
        "total_sales": total_sales,
        "orders": today_orders
    }

@api_router.get("/reports/export")
async def export_report(start_date: str, end_date: str):
    start = datetime.fromisoformat(start_date)
    end = datetime.fromisoformat(end_date)
    
    orders = await db.orders.find({"status": "completed"}, {"_id": 0}).to_list(1000)
    filtered_orders = []
    
    for order in orders:
        order_date = order['created_at']
        if isinstance(order_date, str):
            order_date = datetime.fromisoformat(order_date)
        if start <= order_date <= end:
            filtered_orders.append(order)
    
    return {"orders": filtered_orders, "total_sales": sum(o['total'] for o in filtered_orders)}

# Thermal printer route
@api_router.post("/print")
async def print_receipt(print_data: PrintData):
    # ESC/POS commands for thermal printer
    escpos_commands = {
        'init': b'\x1b\x40',  # Initialize
        'bold_on': b'\x1b\x45\x01',  # Bold on
        'bold_off': b'\x1b\x45\x00',  # Bold off
        'center': b'\x1b\x61\x01',  # Center align
        'left': b'\x1b\x61\x00',  # Left align
        'cut': b'\x1d\x56\x00',  # Cut paper
        'newline': b'\n'
    }
    
    # Convert content to ESC/POS format
    print_content = print_data.content
    
    # For browser-based printing, return formatted content
    return {
        "print_ready": True,
        "content": print_content,
        "format": "text",
        "escpos_available": True
    }

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()