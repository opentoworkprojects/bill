"""
Super Admin Panel - Optimized with Split APIs
Split large data fetches into smaller, focused endpoints
"""

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from pydantic import BaseModel, Field
import os
import io
import csv
import uuid


# ============ PRICING CONFIGURATION MODEL (Requirements 8.2) ============

class PricingConfig(BaseModel):
    """
    Pricing configuration model for subscription pricing management.
    
    Stores regular_price, campaign_price, referral settings, and other pricing parameters.
    
    Requirements: 8.2
    """
    id: Optional[str] = Field(default=None, description="Unique identifier")
    regular_price: float = Field(default=1999.0, description="Regular subscription price in INR")
    campaign_price: float = Field(default=1799.0, description="Campaign/promotional price in INR")
    referral_discount: float = Field(default=200.0, description="Discount for new users using referral code in INR")
    referral_reward: float = Field(default=300.0, description="Reward for referrer when referee completes payment in INR")
    trial_days: int = Field(default=7, description="Number of trial days for new users")
    subscription_months: int = Field(default=12, description="Subscription duration in months")
    campaign_active: bool = Field(default=False, description="Whether campaign pricing is currently active")
    campaign_name: Optional[str] = Field(default=None, description="Name of the active campaign")
    campaign_start_date: Optional[datetime] = Field(default=None, description="Campaign start date")
    campaign_end_date: Optional[datetime] = Field(default=None, description="Campaign end date")
    updated_at: Optional[datetime] = Field(default=None, description="Last update timestamp")
    updated_by: Optional[str] = Field(default=None, description="Admin who last updated the config")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }


# ============ CAMPAIGN MODEL (Requirements 9.2) ============

class Campaign(BaseModel):
    """
    Campaign model for promotional campaigns.
    
    Stores title, discount, dates, and theme for promotional campaigns.
    
    Requirements: 9.2
    """
    id: Optional[str] = Field(default=None, description="Unique identifier")
    title: str = Field(..., description="Campaign title")
    description: Optional[str] = Field(default=None, description="Campaign description")
    discount_percentage: float = Field(default=0.0, ge=0, le=100, description="Discount percentage")
    discount_amount: Optional[float] = Field(default=None, ge=0, description="Fixed discount amount in INR")
    start_date: datetime = Field(..., description="Campaign start date")
    end_date: datetime = Field(..., description="Campaign end date")
    theme: Optional[str] = Field(default=None, description="Campaign theme (e.g., 'new_year', 'diwali', 'summer')")
    banner_text: Optional[str] = Field(default=None, description="Banner text to display")
    banner_color: Optional[str] = Field(default="#FF6B35", description="Banner background color")
    is_active: bool = Field(default=True, description="Whether campaign is enabled")
    created_at: Optional[datetime] = Field(default=None, description="Creation timestamp")
    created_by: Optional[str] = Field(default=None, description="Admin who created the campaign")
    updated_at: Optional[datetime] = Field(default=None, description="Last update timestamp")
    updated_by: Optional[str] = Field(default=None, description="Admin who last updated the campaign")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }


class CampaignCreateRequest(BaseModel):
    """Request model for creating a new campaign"""
    title: str = Field(..., min_length=1, max_length=200, description="Campaign title")
    description: Optional[str] = Field(default=None, max_length=1000, description="Campaign description")
    discount_percentage: float = Field(default=0.0, ge=0, le=100, description="Discount percentage")
    discount_amount: Optional[float] = Field(default=None, ge=0, description="Fixed discount amount in INR")
    start_date: datetime = Field(..., description="Campaign start date")
    end_date: datetime = Field(..., description="Campaign end date")
    theme: Optional[str] = Field(default=None, description="Campaign theme")
    banner_text: Optional[str] = Field(default=None, description="Banner text to display")
    banner_color: Optional[str] = Field(default="#FF6B35", description="Banner background color")


class CampaignUpdateRequest(BaseModel):
    """Request model for updating a campaign"""
    title: Optional[str] = Field(default=None, min_length=1, max_length=200, description="Campaign title")
    description: Optional[str] = Field(default=None, max_length=1000, description="Campaign description")
    discount_percentage: Optional[float] = Field(default=None, ge=0, le=100, description="Discount percentage")
    discount_amount: Optional[float] = Field(default=None, ge=0, description="Fixed discount amount in INR")
    start_date: Optional[datetime] = Field(default=None, description="Campaign start date")
    end_date: Optional[datetime] = Field(default=None, description="Campaign end date")
    theme: Optional[str] = Field(default=None, description="Campaign theme")
    banner_text: Optional[str] = Field(default=None, description="Banner text to display")
    banner_color: Optional[str] = Field(default=None, description="Banner background color")
    is_active: Optional[bool] = Field(default=None, description="Whether campaign is enabled")


class PricingHistoryEntry(BaseModel):
    """
    Pricing history entry for audit trail.
    
    Requirements: 8.4
    """
    id: str = Field(description="Unique identifier for history entry")
    pricing_config_id: str = Field(description="Reference to pricing config")
    regular_price: float
    campaign_price: float
    referral_discount: float
    referral_reward: float
    trial_days: int
    subscription_months: int
    campaign_active: bool
    campaign_name: Optional[str]
    campaign_start_date: Optional[datetime]
    campaign_end_date: Optional[datetime]
    changed_at: datetime = Field(description="When this change was made")
    changed_by: str = Field(description="Admin who made the change")
    change_reason: Optional[str] = Field(default=None, description="Reason for the change")


class PricingUpdateRequest(BaseModel):
    """Request model for updating pricing configuration"""
    regular_price: Optional[float] = Field(default=None, ge=0, description="Regular subscription price in INR")
    campaign_price: Optional[float] = Field(default=None, ge=0, description="Campaign/promotional price in INR")
    referral_discount: Optional[float] = Field(default=None, ge=0, description="Discount for new users using referral code in INR")
    referral_reward: Optional[float] = Field(default=None, ge=0, description="Reward for referrer in INR")
    trial_days: Optional[int] = Field(default=None, ge=0, description="Number of trial days")
    subscription_months: Optional[int] = Field(default=None, ge=1, description="Subscription duration in months")
    campaign_active: Optional[bool] = Field(default=None, description="Whether campaign pricing is active")
    campaign_name: Optional[str] = Field(default=None, description="Name of the campaign")
    campaign_start_date: Optional[datetime] = Field(default=None, description="Campaign start date")
    campaign_end_date: Optional[datetime] = Field(default=None, description="Campaign end date")
    change_reason: Optional[str] = Field(default=None, description="Reason for the change")

super_admin_router = APIRouter(prefix="/api/super-admin", tags=["Super Admin"])

# Super admin credentials
SUPER_ADMIN_USERNAME = os.getenv("SUPER_ADMIN_USERNAME", "superadmin")
SUPER_ADMIN_PASSWORD = os.getenv("SUPER_ADMIN_PASSWORD", "change-this-password-123")

# Database and cache references
_db = None
_redis_cache = None

def set_database(database):
    """Set the database reference from server.py"""
    global _db
    _db = database

def set_redis_cache(redis_cache):
    """Set the Redis cache reference from server.py"""
    global _redis_cache
    _redis_cache = redis_cache

def get_db():
    """Get the database reference"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    return _db

def get_cache():
    """Get the Redis cache reference"""
    return _redis_cache

def verify_super_admin(username: str, password: str) -> bool:
    """Verify super admin credentials"""
    return username == SUPER_ADMIN_USERNAME and password == SUPER_ADMIN_PASSWORD


# ============ PRICING CONFIGURATION HELPERS ============

# Default pricing configuration
DEFAULT_PRICING_CONFIG = {
    "id": "default_pricing",
    "regular_price": 1999.0,
    "campaign_price": 1799.0,
    "referral_discount": 200.0,
    "referral_reward": 300.0,
    "trial_days": 7,
    "subscription_months": 12,
    "campaign_active": False,
    "campaign_name": None,
    "campaign_start_date": None,
    "campaign_end_date": None,
    "updated_at": None,
    "updated_by": None
}


async def get_or_create_pricing_config(db) -> dict:
    """
    Get the current pricing configuration or create default if not exists.
    
    Requirements: 8.1, 8.2
    """
    # Try to get existing config
    config = await db.pricing_config.find_one({"id": "default_pricing"})
    
    if config is None:
        # Create default config
        config = DEFAULT_PRICING_CONFIG.copy()
        config["updated_at"] = datetime.now(timezone.utc)
        await db.pricing_config.insert_one(config)
        print("📊 Created default pricing configuration")
    
    # Remove MongoDB _id field for response
    if "_id" in config:
        del config["_id"]
    
    return config


async def save_pricing_history(db, old_config: dict, new_config: dict, changed_by: str, change_reason: str = None):
    """
    Save pricing configuration change to history for audit trail.
    
    Requirements: 8.4
    """
    history_entry = {
        "id": str(uuid.uuid4()),
        "pricing_config_id": old_config.get("id", "default_pricing"),
        "regular_price": old_config.get("regular_price"),
        "campaign_price": old_config.get("campaign_price"),
        "referral_discount": old_config.get("referral_discount"),
        "referral_reward": old_config.get("referral_reward"),
        "trial_days": old_config.get("trial_days"),
        "subscription_months": old_config.get("subscription_months"),
        "campaign_active": old_config.get("campaign_active"),
        "campaign_name": old_config.get("campaign_name"),
        "campaign_start_date": old_config.get("campaign_start_date"),
        "campaign_end_date": old_config.get("campaign_end_date"),
        "changed_at": datetime.now(timezone.utc),
        "changed_by": changed_by,
        "change_reason": change_reason
    }
    
    await db.pricing_history.insert_one(history_entry)
    print(f"📊 Saved pricing history entry: {history_entry['id']}")
    return history_entry


def validate_pricing_config(config: dict) -> List[str]:
    """
    Validate pricing configuration values.
    
    Returns list of validation errors (empty if valid).
    """
    errors = []
    
    # Validate prices are non-negative
    if config.get("regular_price", 0) < 0:
        errors.append("regular_price must be non-negative")
    if config.get("campaign_price", 0) < 0:
        errors.append("campaign_price must be non-negative")
    if config.get("referral_discount", 0) < 0:
        errors.append("referral_discount must be non-negative")
    if config.get("referral_reward", 0) < 0:
        errors.append("referral_reward must be non-negative")
    
    # Validate trial days
    if config.get("trial_days", 0) < 0:
        errors.append("trial_days must be non-negative")
    
    # Validate subscription months
    if config.get("subscription_months", 1) < 1:
        errors.append("subscription_months must be at least 1")
    
    # Validate campaign dates if campaign is active
    if config.get("campaign_active"):
        start_date = config.get("campaign_start_date")
        end_date = config.get("campaign_end_date")
        
        if start_date and end_date:
            if start_date > end_date:
                errors.append("campaign_start_date must be before campaign_end_date")
    
    # Validate campaign price is less than or equal to regular price
    if config.get("campaign_price", 0) > config.get("regular_price", 0):
        errors.append("campaign_price should not exceed regular_price")
    
    return errors


# ============ CAMPAIGN HELPERS (Requirements 9.2, 9.3, 9.4) ============

def check_campaign_date_overlap(
    start_date: datetime, 
    end_date: datetime, 
    existing_campaigns: list,
    exclude_campaign_id: str = None
) -> tuple[bool, Optional[str]]:
    """
    Check if a campaign's date range overlaps with existing active campaigns.
    
    Returns (has_overlap, overlapping_campaign_title).
    
    Property 15: Campaign Date Overlap Prevention
    Requirements: 9.3
    """
    for campaign in existing_campaigns:
        # Skip the campaign being updated
        if exclude_campaign_id and campaign.get("id") == exclude_campaign_id:
            continue
        
        # Skip inactive campaigns
        if not campaign.get("is_active", True):
            continue
        
        existing_start = campaign.get("start_date")
        existing_end = campaign.get("end_date")
        
        if existing_start is None or existing_end is None:
            continue
        
        # Ensure datetime objects have timezone info
        if existing_start.tzinfo is None:
            existing_start = existing_start.replace(tzinfo=timezone.utc)
        if existing_end.tzinfo is None:
            existing_end = existing_end.replace(tzinfo=timezone.utc)
        if start_date.tzinfo is None:
            start_date = start_date.replace(tzinfo=timezone.utc)
        if end_date.tzinfo is None:
            end_date = end_date.replace(tzinfo=timezone.utc)
        
        # Check for overlap: two ranges overlap if start1 <= end2 AND start2 <= end1
        if start_date <= existing_end and existing_start <= end_date:
            return True, campaign.get("title", "Unknown Campaign")
    
    return False, None


def is_campaign_currently_active(campaign: dict) -> bool:
    """
    Check if a campaign is currently active based on dates and is_active flag.
    
    A campaign is active if:
    1. is_active flag is True
    2. Current date is between start_date and end_date (inclusive)
    
    Property 16: Campaign Activation Logic
    Requirements: 9.4
    """
    if not campaign.get("is_active", True):
        return False
    
    start_date = campaign.get("start_date")
    end_date = campaign.get("end_date")
    
    if start_date is None or end_date is None:
        return False
    
    now = datetime.now(timezone.utc)
    
    # Ensure datetime objects have timezone info
    if start_date.tzinfo is None:
        start_date = start_date.replace(tzinfo=timezone.utc)
    if end_date.tzinfo is None:
        end_date = end_date.replace(tzinfo=timezone.utc)
    
    return start_date <= now <= end_date


def get_campaign_status(campaign: dict) -> str:
    """
    Get the status of a campaign based on dates and is_active flag.
    
    Returns: 'active', 'scheduled', 'ended', or 'disabled'
    """
    if not campaign.get("is_active", True):
        return "disabled"
    
    start_date = campaign.get("start_date")
    end_date = campaign.get("end_date")
    
    if start_date is None or end_date is None:
        return "disabled"
    
    now = datetime.now(timezone.utc)
    
    # Ensure datetime objects have timezone info
    if start_date.tzinfo is None:
        start_date = start_date.replace(tzinfo=timezone.utc)
    if end_date.tzinfo is None:
        end_date = end_date.replace(tzinfo=timezone.utc)
    
    if now < start_date:
        return "scheduled"
    elif now > end_date:
        return "ended"
    else:
        return "active"


def validate_campaign(campaign_data: dict) -> List[str]:
    """
    Validate campaign data.
    
    Returns list of validation errors (empty if valid).
    """
    errors = []
    
    # Validate title
    title = campaign_data.get("title")
    if not title or not title.strip():
        errors.append("title is required and cannot be empty")
    
    # Validate dates
    start_date = campaign_data.get("start_date")
    end_date = campaign_data.get("end_date")
    
    if start_date is None:
        errors.append("start_date is required")
    if end_date is None:
        errors.append("end_date is required")
    
    if start_date and end_date:
        # Ensure datetime objects have timezone info for comparison
        if hasattr(start_date, 'tzinfo') and start_date.tzinfo is None:
            start_date = start_date.replace(tzinfo=timezone.utc)
        if hasattr(end_date, 'tzinfo') and end_date.tzinfo is None:
            end_date = end_date.replace(tzinfo=timezone.utc)
        
        if start_date > end_date:
            errors.append("start_date must be before or equal to end_date")
    
    # Validate discount
    discount_percentage = campaign_data.get("discount_percentage", 0)
    if discount_percentage < 0 or discount_percentage > 100:
        errors.append("discount_percentage must be between 0 and 100")
    
    discount_amount = campaign_data.get("discount_amount")
    if discount_amount is not None and discount_amount < 0:
        errors.append("discount_amount must be non-negative")
    
    return errors


# ============ AUTHENTICATION ============

@super_admin_router.get("/login")
async def super_admin_login(
    username: str = Query(...),
    password: str = Query(...)
):
    """Super admin login verification"""
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    return {
        "success": True,
        "message": "Super admin authenticated",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

# ============ BASIC STATS (FAST) ============

@super_admin_router.get("/stats/basic")
async def get_basic_stats(
    username: str = Query(...),
    password: str = Query(...)
):
    """Get basic system stats - FAST endpoint"""
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    db = get_db()
    
    try:
        print("📊 Fetching basic stats...")
        
        # Use count_documents for fast counts
        total_users = await db.users.count_documents({})
        total_orders = await db.orders.count_documents({})
        active_users = await db.users.count_documents({"subscription_active": True})
        
        # Recent activity (last 24 hours)
        yesterday = datetime.now(timezone.utc) - timedelta(days=1)
        recent_orders = await db.orders.count_documents({
            "created_at": {"$gte": yesterday}
        })
        
        stats = {
            "total_users": total_users,
            "total_orders": total_orders,
            "active_users": active_users,
            "recent_orders": recent_orders,
            "cached_at": datetime.now(timezone.utc).isoformat()
        }
        
        print(f"✅ Basic stats: {total_users} users, {total_orders} orders")
        return stats
        
    except Exception as e:
        print(f"❌ Basic stats error: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# ============ USER LIST (PAGINATED) ============

@super_admin_router.get("/users/list")
async def get_users_list(
    username: str = Query(...),
    password: str = Query(...),
    skip: int = Query(0),
    limit: int = Query(100)  # Increased limit for better user management
):
    """
    Get users list - Returns all users with essential fields for user management.
    
    Returns user id, email, username, role, subscription status, activity metrics,
    and business settings for display in the SuperAdmin user list.
    
    Requirements: 3.1, 3.2
    
    Property 4: User List Field Completeness
    For any user in the users list, the rendered row SHALL display: username, email, 
    role, subscription_status, subscription_expires_at, and activity metrics.
    """
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    db = get_db()
    
    # Allow larger limit for user management (Requirements 3.1)
    limit = min(limit, 500)
    
    try:
        print(f"📊 Fetching users list (skip={skip}, limit={limit})...")
        
        # Get users with all fields needed for list view (Requirements 3.2)
        users = await db.users.find(
            {},
            {
                "_id": 0,
                "id": 1,  # Essential for actions and navigation
                "email": 1,
                "username": 1,
                "role": 1,
                "subscription_active": 1,
                "subscription_expires_at": 1,  # For subscription status display
                "subscription_amount": 1,  # For subscription info
                "subscription_months": 1,  # For subscription duration
                "trial_extension_days": 1,  # For trial info
                "created_at": 1,
                "bill_count": 1,
                "last_login": 1,  # For activity metrics
                "business_settings": 1,  # For restaurant name display
                "organization_id": 1  # For calculating actual bill count
            }
        ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        
        # Get bill counts for all users in this batch using aggregation (more efficient)
        user_ids = [user.get("id") for user in users]
        if user_ids:
            bill_counts_pipeline = [
                {
                    "$match": {
                        "organization_id": {"$in": [user.get("organization_id") for user in users if user.get("organization_id")]}
                    }
                },
                {
                    "$group": {
                        "_id": "$organization_id",
                        "count": {"$sum": 1}
                    }
                }
            ]
            
            bill_counts_result = await db.orders.aggregate(bill_counts_pipeline).to_list(None)
            bill_counts_map = {item["_id"]: item["count"] for item in bill_counts_result}
            
            # Update bill count for each user
            for user in users:
                org_id = user.get("organization_id")
                if org_id and org_id in bill_counts_map:
                    user["bill_count"] = bill_counts_map[org_id]
                else:
                    user["bill_count"] = 0
        
        # Get total count for pagination
        total = await db.users.count_documents({})
        
        result = {
            "users": users,
            "total": total,
            "skip": skip,
            "limit": limit,
            "has_more": skip + len(users) < total,
            "cached_at": datetime.now(timezone.utc).isoformat()
        }
        
        print(f"✅ Users list: {len(users)} users returned (total: {total})")
        return result
        
    except Exception as e:
        print(f"❌ Users list error: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# ============ REFRESH BILL COUNTS ============

@super_admin_router.post("/users/refresh-bill-counts")
async def refresh_bill_counts(
    username: str = Query(...),
    password: str = Query(...)
):
    """
    Force refresh bill counts for all users by recalculating from orders table.
    This ensures counts are always up-to-date without relying on stale bill_count field.
    """
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    db = get_db()
    
    try:
        print("🔄 REFRESH: Recalculating bill counts for all users...")
        
        # Get all users
        all_users = await db.users.find({}, {"_id": 0, "id": 1, "organization_id": 1}).to_list(None)
        
        # Get bill counts aggregated by organization
        bill_counts_pipeline = [
            {
                "$group": {
                    "_id": "$organization_id",
                    "count": {"$sum": 1}
                }
            }
        ]
        
        bill_counts_result = await db.orders.aggregate(bill_counts_pipeline).to_list(None)
        bill_counts_map = {item["_id"]: item["count"] for item in bill_counts_result}
        
        # Update each user's bill_count
        updated_count = 0
        for user in all_users:
            org_id = user.get("organization_id")
            new_bill_count = bill_counts_map.get(org_id, 0)
            
            # Update the user document with correct bill count
            await db.users.update_one(
                {"id": user.get("id")},
                {"$set": {"bill_count": new_bill_count, "updated_at": datetime.now(timezone.utc)}}
            )
            updated_count += 1
        
        print(f"✅ REFRESH COMPLETE: Updated bill counts for {updated_count} users")
        
        return {
            "success": True,
            "message": f"Bill counts refreshed for {updated_count} users",
            "users_updated": updated_count
        }
        
    except Exception as e:
        print(f"❌ Refresh bill counts error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to refresh bill counts: {str(e)}")

# ============ SEARCH USERS (LIGHTWEIGHT) - MUST BE BEFORE /users/{user_email} ============

@super_admin_router.get("/users/search")
async def search_users(
    username: str = Query(...),
    password: str = Query(...),
    q: str = Query(...),
    limit: int = Query(5)
):
    """Search users by email/username - LIGHTWEIGHT"""
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    if not q.strip():
        return {"users": [], "query": q, "count": 0}
    
    db = get_db()
    limit = min(limit, 5)
    
    try:
        print(f"📊 Searching users: '{q}' (limit={limit})...")
        
        search_filter = {
            "$or": [
                {"email": {"$regex": q, "$options": "i"}},
                {"username": {"$regex": q, "$options": "i"}}
            ]
        }
        
        users = await db.users.find(
            search_filter,
            {
                "_id": 0,
                "email": 1,
                "username": 1,
                "role": 1,
                "subscription_active": 1
            }
        ).limit(limit).to_list(limit)
        
        result = {
            "users": users,
            "query": q,
            "count": len(users),
            "limit": limit,
            "cached_at": datetime.now(timezone.utc).isoformat()
        }
        
        print(f"✅ Search results: {len(users)} users found")
        return result
        
    except Exception as e:
        print(f"❌ Search error: {e}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

# ============ USER DETAILS (INDIVIDUAL) ============

@super_admin_router.get("/users/{user_email}")
async def get_user_details(
    user_email: str,
    username: str = Query(...),
    password: str = Query(...)
):
    """Get detailed info for a specific user"""
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    db = get_db()
    
    try:
        print(f"📊 Fetching user details for: {user_email}")
        
        user = await db.users.find_one(
            {"email": user_email},
            {"_id": 0, "password": 0, "razorpay_key_secret": 0}
        )
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get user's recent orders count
        user_orders = await db.orders.count_documents({
            "organization_id": user.get("organization_id")
        })
        
        user["total_orders"] = user_orders
        user["fetched_at"] = datetime.now(timezone.utc).isoformat()
        
        print(f"✅ User details fetched for: {user_email}")
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ User details error: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# ============ RECENT ORDERS (LIMITED) ============

@super_admin_router.get("/orders/recent")
async def get_recent_orders(
    username: str = Query(...),
    password: str = Query(...),
    limit: int = Query(20)
):
    """Get recent orders across all users - LIMITED for performance"""
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    db = get_db()
    limit = min(limit, 20)
    
    try:
        print(f"📊 Fetching recent orders (limit={limit})...")
        
        orders = await db.orders.find(
            {},
            {
                "_id": 0,
                "id": 1,
                "total": 1,
                "status": 1,
                "created_at": 1,
                "organization_id": 1,
                "customer_name": 1,
                "waiter_name": 1
            }
        ).sort("created_at", -1).limit(limit).to_list(limit)
        
        result = {
            "orders": orders,
            "count": len(orders),
            "limit": limit,
            "cached_at": datetime.now(timezone.utc).isoformat()
        }
        
        print(f"✅ Recent orders: {len(orders)} orders returned")
        return result
        
    except Exception as e:
        print(f"❌ Recent orders error: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# ============ REVENUE STATS (AGGREGATED) ============

@super_admin_router.get("/stats/revenue")
async def get_revenue_stats(
    username: str = Query(...),
    password: str = Query(...),
    days: int = Query(7)
):
    """Get revenue statistics - AGGREGATED for performance"""
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    db = get_db()
    days = min(days, 30)
    
    try:
        print(f"📊 Fetching revenue stats (last {days} days)...")
        
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=days)
        
        pipeline = [
            {
                "$match": {
                    "created_at": {"$gte": start_date, "$lte": end_date},
                    "status": {"$in": ["completed", "paid"]}
                }
            },
            {
                "$group": {
                    "_id": None,
                    "total_revenue": {"$sum": "$total"},
                    "total_orders": {"$sum": 1},
                    "avg_order_value": {"$avg": "$total"}
                }
            }
        ]
        
        result = await db.orders.aggregate(pipeline).to_list(1)
        
        if result:
            stats = result[0]
            stats.pop("_id", None)
        else:
            stats = {
                "total_revenue": 0,
                "total_orders": 0,
                "avg_order_value": 0
            }
        
        stats.update({
            "days": days,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "cached_at": datetime.now(timezone.utc).isoformat()
        })
        
        print(f"✅ Revenue stats: ₹{stats['total_revenue']:.2f} from {stats['total_orders']} orders")
        return stats
        
    except Exception as e:
        print(f"❌ Revenue stats error: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# ============ SYSTEM HEALTH ============

@super_admin_router.get("/health")
async def get_system_health(
    username: str = Query(...),
    password: str = Query(...)
):
    """Get system health status - FAST endpoint"""
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    db = get_db()
    cache = get_cache()
    
    try:
        print("📊 Checking system health...")
        
        # Test database connection
        db_status = "connected"
        try:
            await db.users.count_documents({}, limit=1)
        except Exception as e:
            db_status = f"error: {str(e)}"
        
        # Test Redis connection
        redis_status = "not_configured"
        if cache:
            if cache.is_connected():
                redis_status = "connected"
            else:
                redis_status = "disconnected"
        
        health = {
            "database": db_status,
            "redis": redis_status,
            "uptime": "running",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        print(f"✅ System health: DB={db_status}, Redis={redis_status}")
        return health
        
    except Exception as e:
        print(f"❌ Health check error: {e}")
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")


# ============ REFERRAL TRACKING (Requirements 7.1, 7.2, 7.3) ============

@super_admin_router.get("/referrals")
async def get_all_referrals(
    username: str = Query(...),
    password: str = Query(...),
    status: Optional[str] = Query(None, description="Filter by status: PENDING, COMPLETED, REWARDED, REVERSED"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100)
):
    """
    Get paginated list of all referrals with optional status filter.
    
    Returns referrer name, referee name, status, reward amount, and date.
    
    Requirements: 7.1, 7.2, 7.3
    """
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    db = get_db()
    
    try:
        print(f"📊 Fetching referrals (status={status}, skip={skip}, limit={limit})...")
        
        # Build filter
        filter_query = {}
        if status:
            # Validate status value
            valid_statuses = ["PENDING", "COMPLETED", "REWARDED", "REVERSED"]
            if status.upper() not in valid_statuses:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
                )
            filter_query["status"] = status.upper()
        
        # Get referrals with pagination
        referrals_cursor = db.referrals.find(filter_query).sort("created_at", -1).skip(skip).limit(limit)
        referrals = await referrals_cursor.to_list(limit)
        
        # Get total count for pagination
        total_count = await db.referrals.count_documents(filter_query)
        
        # Enrich referrals with user names
        enriched_referrals = []
        for referral in referrals:
            # Get referrer info
            referrer = await db.users.find_one(
                {"id": referral.get("referrer_user_id")},
                {"username": 1, "email": 1}
            )
            
            # Get referee info
            referee = await db.users.find_one(
                {"id": referral.get("referee_user_id")},
                {"username": 1, "email": 1}
            )
            
            enriched_referral = {
                "id": referral.get("id"),
                "referrer_user_id": referral.get("referrer_user_id"),
                "referrer_name": referrer.get("username") if referrer else "Unknown",
                "referrer_email": referrer.get("email") if referrer else "Unknown",
                "referee_user_id": referral.get("referee_user_id"),
                "referee_name": referee.get("username") if referee else "Unknown",
                "referee_email": referee.get("email") if referee else "Unknown",
                "referral_code": referral.get("referral_code"),
                "status": referral.get("status"),
                "referrer_reward": referral.get("referrer_reward", 300.0),
                "referee_discount": referral.get("referee_discount", 200.0),
                "created_at": referral.get("created_at").isoformat() if referral.get("created_at") else None,
                "completed_at": referral.get("completed_at").isoformat() if referral.get("completed_at") else None,
                "rewarded_at": referral.get("rewarded_at").isoformat() if referral.get("rewarded_at") else None
            }
            enriched_referrals.append(enriched_referral)
        
        result = {
            "success": True,
            "referrals": enriched_referrals,
            "total": total_count,
            "skip": skip,
            "limit": limit,
            "has_more": (skip + len(enriched_referrals)) < total_count,
            "filter_status": status.upper() if status else None,
            "fetched_at": datetime.now(timezone.utc).isoformat()
        }
        
        print(f"✅ Referrals fetched: {len(enriched_referrals)} of {total_count} total")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Referrals fetch error: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# ============ REFERRAL ANALYTICS (Requirements 7.4) ============

@super_admin_router.get("/referrals/analytics")
async def get_referral_analytics(
    username: str = Query(...),
    password: str = Query(...)
):
    """
    Get referral program analytics.
    
    Returns total referrals, conversion rate, and total rewards paid.
    
    Requirements: 7.4
    """
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    db = get_db()
    
    try:
        print("📊 Fetching referral analytics...")
        
        # Get total referrals count
        total_referrals = await db.referrals.count_documents({})
        
        # Get count by status
        pending_count = await db.referrals.count_documents({"status": "PENDING"})
        completed_count = await db.referrals.count_documents({"status": "COMPLETED"})
        rewarded_count = await db.referrals.count_documents({"status": "REWARDED"})
        reversed_count = await db.referrals.count_documents({"status": "REVERSED"})
        
        # Calculate conversion rate (REWARDED / total * 100)
        conversion_rate = 0.0
        if total_referrals > 0:
            conversion_rate = (rewarded_count / total_referrals) * 100
        
        # Calculate total rewards paid using aggregation
        rewards_pipeline = [
            {"$match": {"status": "REWARDED"}},
            {"$group": {
                "_id": None,
                "total_rewards_paid": {"$sum": "$referrer_reward"}
            }}
        ]
        rewards_result = await db.referrals.aggregate(rewards_pipeline).to_list(1)
        total_rewards_paid = rewards_result[0]["total_rewards_paid"] if rewards_result else 0.0
        
        # Calculate total discounts given
        discounts_pipeline = [
            {"$match": {"status": {"$in": ["COMPLETED", "REWARDED"]}}},
            {"$group": {
                "_id": None,
                "total_discounts_given": {"$sum": "$referee_discount"}
            }}
        ]
        discounts_result = await db.referrals.aggregate(discounts_pipeline).to_list(1)
        total_discounts_given = discounts_result[0]["total_discounts_given"] if discounts_result else 0.0
        
        # Get referrals over time (last 30 days)
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        recent_referrals = await db.referrals.count_documents({
            "created_at": {"$gte": thirty_days_ago}
        })
        
        # Get top referrers
        top_referrers_pipeline = [
            {"$match": {"status": "REWARDED"}},
            {"$group": {
                "_id": "$referrer_user_id",
                "referral_count": {"$sum": 1},
                "total_earned": {"$sum": "$referrer_reward"}
            }},
            {"$sort": {"referral_count": -1}},
            {"$limit": 5}
        ]
        top_referrers_result = await db.referrals.aggregate(top_referrers_pipeline).to_list(5)
        
        # Enrich top referrers with user info
        top_referrers = []
        for referrer in top_referrers_result:
            user = await db.users.find_one(
                {"id": referrer["_id"]},
                {"username": 1, "email": 1}
            )
            top_referrers.append({
                "user_id": referrer["_id"],
                "username": user.get("username") if user else "Unknown",
                "email": user.get("email") if user else "Unknown",
                "referral_count": referrer["referral_count"],
                "total_earned": referrer["total_earned"]
            })
        
        analytics = {
            "success": True,
            "total_referrals": total_referrals,
            "status_breakdown": {
                "pending": pending_count,
                "completed": completed_count,
                "rewarded": rewarded_count,
                "reversed": reversed_count
            },
            "conversion_rate": round(conversion_rate, 2),
            "total_rewards_paid": total_rewards_paid,
            "total_discounts_given": total_discounts_given,
            "recent_referrals_30_days": recent_referrals,
            "top_referrers": top_referrers,
            "fetched_at": datetime.now(timezone.utc).isoformat()
        }
        
        print(f"✅ Referral analytics: {total_referrals} total, {conversion_rate:.2f}% conversion, ₹{total_rewards_paid} paid")
        return analytics
        
    except Exception as e:
        print(f"❌ Referral analytics error: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")



# ============ REFERRAL EXPORT (Requirements 7.5) ============

@super_admin_router.get("/referrals/export")
async def export_referrals(
    username: str = Query(...),
    password: str = Query(...),
    format: str = Query("csv", description="Export format: csv")
):
    """
    Export all referral records as CSV.
    
    Returns a downloadable CSV file with all referral data including
    referrer name, referee name, status, reward amount, and date.
    
    Requirements: 7.5
    """
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    if format.lower() != "csv":
        raise HTTPException(status_code=400, detail="Only CSV format is supported")
    
    db = get_db()
    
    try:
        print("📊 Exporting referrals to CSV...")
        
        # Get all referrals
        referrals_cursor = db.referrals.find({}).sort("created_at", -1)
        referrals = await referrals_cursor.to_list(None)  # Get all
        
        # Create CSV in memory
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header row
        headers = [
            "Referral ID",
            "Referrer Name",
            "Referrer Email",
            "Referee Name",
            "Referee Email",
            "Referral Code",
            "Status",
            "Referrer Reward (₹)",
            "Referee Discount (₹)",
            "Created Date",
            "Completed Date",
            "Rewarded Date"
        ]
        writer.writerow(headers)
        
        # Write data rows
        for referral in referrals:
            # Get referrer info
            referrer = await db.users.find_one(
                {"id": referral.get("referrer_user_id")},
                {"username": 1, "email": 1}
            )
            
            # Get referee info
            referee = await db.users.find_one(
                {"id": referral.get("referee_user_id")},
                {"username": 1, "email": 1}
            )
            
            row = [
                referral.get("id", ""),
                referrer.get("username", "Unknown") if referrer else "Unknown",
                referrer.get("email", "Unknown") if referrer else "Unknown",
                referee.get("username", "Unknown") if referee else "Unknown",
                referee.get("email", "Unknown") if referee else "Unknown",
                referral.get("referral_code", ""),
                referral.get("status", ""),
                referral.get("referrer_reward", 300.0),
                referral.get("referee_discount", 200.0),
                referral.get("created_at").strftime("%Y-%m-%d %H:%M:%S") if referral.get("created_at") else "",
                referral.get("completed_at").strftime("%Y-%m-%d %H:%M:%S") if referral.get("completed_at") else "",
                referral.get("rewarded_at").strftime("%Y-%m-%d %H:%M:%S") if referral.get("rewarded_at") else ""
            ]
            writer.writerow(row)
        
        # Prepare response
        output.seek(0)
        
        # Generate filename with timestamp
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        filename = f"referrals_export_{timestamp}.csv"
        
        print(f"✅ Referrals exported: {len(referrals)} records to {filename}")
        
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Content-Type": "text/csv; charset=utf-8"
            }
        )
        
    except Exception as e:
        print(f"❌ Referral export error: {e}")
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")


# ============ PRICING MANAGEMENT (Requirements 8.1, 8.2, 8.3, 8.4) ============

@super_admin_router.get("/pricing")
async def get_pricing_config(
    username: str = Query(...),
    password: str = Query(...)
):
    """
    Get current pricing configuration.
    
    Returns the current pricing configuration including regular_price, campaign_price,
    referral settings, trial days, and campaign information.
    
    Requirements: 8.1, 8.2
    """
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    db = get_db()
    
    try:
        print("📊 Fetching pricing configuration...")
        
        # Get or create pricing config
        config = await get_or_create_pricing_config(db)
        
        # Format datetime fields for response
        response = {
            "success": True,
            "pricing": {
                "id": config.get("id"),
                "regular_price": config.get("regular_price"),
                "campaign_price": config.get("campaign_price"),
                "referral_discount": config.get("referral_discount"),
                "referral_reward": config.get("referral_reward"),
                "trial_days": config.get("trial_days"),
                "subscription_months": config.get("subscription_months"),
                "campaign_active": config.get("campaign_active"),
                "campaign_name": config.get("campaign_name"),
                "campaign_start_date": config.get("campaign_start_date").isoformat() if config.get("campaign_start_date") else None,
                "campaign_end_date": config.get("campaign_end_date").isoformat() if config.get("campaign_end_date") else None,
                "updated_at": config.get("updated_at").isoformat() if config.get("updated_at") else None,
                "updated_by": config.get("updated_by")
            },
            "fetched_at": datetime.now(timezone.utc).isoformat()
        }
        
        print(f"✅ Pricing config fetched: regular=₹{config.get('regular_price')}, campaign=₹{config.get('campaign_price')}")
        return response
        
    except Exception as e:
        print(f"❌ Pricing config fetch error: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@super_admin_router.put("/pricing")
async def update_pricing_config(
    username: str = Query(...),
    password: str = Query(...),
    regular_price: Optional[float] = Query(None, ge=0, description="Regular subscription price in INR"),
    campaign_price: Optional[float] = Query(None, ge=0, description="Campaign/promotional price in INR"),
    referral_discount: Optional[float] = Query(None, ge=0, description="Discount for new users using referral code in INR"),
    referral_reward: Optional[float] = Query(None, ge=0, description="Reward for referrer in INR"),
    trial_days: Optional[int] = Query(None, ge=0, description="Number of trial days"),
    subscription_months: Optional[int] = Query(None, ge=1, description="Subscription duration in months"),
    campaign_active: Optional[bool] = Query(None, description="Whether campaign pricing is active"),
    campaign_name: Optional[str] = Query(None, description="Name of the campaign"),
    campaign_start_date: Optional[str] = Query(None, description="Campaign start date (ISO format)"),
    campaign_end_date: Optional[str] = Query(None, description="Campaign end date (ISO format)"),
    change_reason: Optional[str] = Query(None, description="Reason for the change")
):
    """
    Update pricing configuration.
    
    Updates the pricing configuration and maintains pricing history for audit purposes.
    Only provided fields will be updated; others remain unchanged.
    
    Requirements: 8.3, 8.4
    """
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    db = get_db()
    
    try:
        print("📊 Updating pricing configuration...")
        
        # Get current config
        current_config = await get_or_create_pricing_config(db)
        
        # Build update dict with only provided fields
        update_fields = {}
        
        if regular_price is not None:
            update_fields["regular_price"] = regular_price
        if campaign_price is not None:
            update_fields["campaign_price"] = campaign_price
        if referral_discount is not None:
            update_fields["referral_discount"] = referral_discount
        if referral_reward is not None:
            update_fields["referral_reward"] = referral_reward
        if trial_days is not None:
            update_fields["trial_days"] = trial_days
        if subscription_months is not None:
            update_fields["subscription_months"] = subscription_months
        if campaign_active is not None:
            update_fields["campaign_active"] = campaign_active
        if campaign_name is not None:
            update_fields["campaign_name"] = campaign_name
        
        # Parse and validate date fields
        if campaign_start_date is not None:
            try:
                update_fields["campaign_start_date"] = datetime.fromisoformat(campaign_start_date.replace('Z', '+00:00'))
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid campaign_start_date format. Use ISO format.")
        
        if campaign_end_date is not None:
            try:
                update_fields["campaign_end_date"] = datetime.fromisoformat(campaign_end_date.replace('Z', '+00:00'))
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid campaign_end_date format. Use ISO format.")
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields provided for update")
        
        # Create merged config for validation
        merged_config = {**current_config, **update_fields}
        
        # Validate the merged configuration
        validation_errors = validate_pricing_config(merged_config)
        if validation_errors:
            raise HTTPException(status_code=400, detail=f"Validation errors: {', '.join(validation_errors)}")
        
        # Save current config to history before updating
        await save_pricing_history(db, current_config, merged_config, username, change_reason)
        
        # Update the config
        update_fields["updated_at"] = datetime.now(timezone.utc)
        update_fields["updated_by"] = username
        
        await db.pricing_config.update_one(
            {"id": "default_pricing"},
            {"$set": update_fields}
        )
        
        # Fetch updated config
        updated_config = await get_or_create_pricing_config(db)
        
        response = {
            "success": True,
            "message": "Pricing configuration updated successfully",
            "pricing": {
                "id": updated_config.get("id"),
                "regular_price": updated_config.get("regular_price"),
                "campaign_price": updated_config.get("campaign_price"),
                "referral_discount": updated_config.get("referral_discount"),
                "referral_reward": updated_config.get("referral_reward"),
                "trial_days": updated_config.get("trial_days"),
                "subscription_months": updated_config.get("subscription_months"),
                "campaign_active": updated_config.get("campaign_active"),
                "campaign_name": updated_config.get("campaign_name"),
                "campaign_start_date": updated_config.get("campaign_start_date").isoformat() if updated_config.get("campaign_start_date") else None,
                "campaign_end_date": updated_config.get("campaign_end_date").isoformat() if updated_config.get("campaign_end_date") else None,
                "updated_at": updated_config.get("updated_at").isoformat() if updated_config.get("updated_at") else None,
                "updated_by": updated_config.get("updated_by")
            },
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        print(f"✅ Pricing config updated: regular=₹{updated_config.get('regular_price')}, campaign=₹{updated_config.get('campaign_price')}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Pricing config update error: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@super_admin_router.get("/pricing/history")
async def get_pricing_history(
    username: str = Query(...),
    password: str = Query(...),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100)
):
    """
    Get pricing configuration change history.
    
    Returns paginated list of pricing changes for audit purposes.
    
    Requirements: 8.4
    """
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    db = get_db()
    
    try:
        print(f"📊 Fetching pricing history (skip={skip}, limit={limit})...")
        
        # Get history entries with pagination
        history_cursor = db.pricing_history.find({}).sort("changed_at", -1).skip(skip).limit(limit)
        history_entries = await history_cursor.to_list(limit)
        
        # Get total count
        total_count = await db.pricing_history.count_documents({})
        
        # Format entries for response
        formatted_entries = []
        for entry in history_entries:
            formatted_entry = {
                "id": entry.get("id"),
                "regular_price": entry.get("regular_price"),
                "campaign_price": entry.get("campaign_price"),
                "referral_discount": entry.get("referral_discount"),
                "referral_reward": entry.get("referral_reward"),
                "trial_days": entry.get("trial_days"),
                "subscription_months": entry.get("subscription_months"),
                "campaign_active": entry.get("campaign_active"),
                "campaign_name": entry.get("campaign_name"),
                "campaign_start_date": entry.get("campaign_start_date").isoformat() if entry.get("campaign_start_date") else None,
                "campaign_end_date": entry.get("campaign_end_date").isoformat() if entry.get("campaign_end_date") else None,
                "changed_at": entry.get("changed_at").isoformat() if entry.get("changed_at") else None,
                "changed_by": entry.get("changed_by"),
                "change_reason": entry.get("change_reason")
            }
            formatted_entries.append(formatted_entry)
        
        response = {
            "success": True,
            "history": formatted_entries,
            "total": total_count,
            "skip": skip,
            "limit": limit,
            "has_more": (skip + len(formatted_entries)) < total_count,
            "fetched_at": datetime.now(timezone.utc).isoformat()
        }
        
        print(f"✅ Pricing history fetched: {len(formatted_entries)} of {total_count} entries")
        return response
        
    except Exception as e:
        print(f"❌ Pricing history fetch error: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# ============ CAMPAIGN MANAGEMENT (Requirements 9.1, 9.2, 9.3, 9.4) ============

@super_admin_router.get("/campaigns")
async def get_campaigns(
    username: str = Query(...),
    password: str = Query(...),
    status: Optional[str] = Query(None, description="Filter by status: active, scheduled, ended, disabled, all"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100)
):
    """
    Get all campaigns (active and past).
    
    Returns paginated list of campaigns with their current status.
    
    Requirements: 9.1
    """
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    db = get_db()
    
    try:
        print(f"📊 Fetching campaigns (status={status}, skip={skip}, limit={limit})...")
        
        # Get all campaigns first (we'll filter by computed status)
        campaigns_cursor = db.campaigns.find({}).sort("created_at", -1)
        all_campaigns = await campaigns_cursor.to_list(None)
        
        # Compute status for each campaign and filter if needed
        filtered_campaigns = []
        for campaign in all_campaigns:
            campaign_status = get_campaign_status(campaign)
            campaign["computed_status"] = campaign_status
            
            # Filter by status if specified
            if status and status.lower() != "all":
                if campaign_status != status.lower():
                    continue
            
            filtered_campaigns.append(campaign)
        
        # Get total count before pagination
        total_count = len(filtered_campaigns)
        
        # Apply pagination
        paginated_campaigns = filtered_campaigns[skip:skip + limit]
        
        # Format campaigns for response
        formatted_campaigns = []
        for campaign in paginated_campaigns:
            formatted_campaign = {
                "id": campaign.get("id"),
                "title": campaign.get("title"),
                "description": campaign.get("description"),
                "discount_percentage": campaign.get("discount_percentage", 0),
                "discount_amount": campaign.get("discount_amount"),
                "start_date": campaign.get("start_date").isoformat() if campaign.get("start_date") else None,
                "end_date": campaign.get("end_date").isoformat() if campaign.get("end_date") else None,
                "theme": campaign.get("theme"),
                "banner_text": campaign.get("banner_text"),
                "banner_color": campaign.get("banner_color"),
                "is_active": campaign.get("is_active", True),
                "status": campaign.get("computed_status"),
                "is_currently_active": is_campaign_currently_active(campaign),
                "created_at": campaign.get("created_at").isoformat() if campaign.get("created_at") else None,
                "created_by": campaign.get("created_by"),
                "updated_at": campaign.get("updated_at").isoformat() if campaign.get("updated_at") else None,
                "updated_by": campaign.get("updated_by")
            }
            formatted_campaigns.append(formatted_campaign)
        
        # Calculate stats
        active_count = sum(1 for c in all_campaigns if get_campaign_status(c) == "active")
        scheduled_count = sum(1 for c in all_campaigns if get_campaign_status(c) == "scheduled")
        ended_count = sum(1 for c in all_campaigns if get_campaign_status(c) == "ended")
        disabled_count = sum(1 for c in all_campaigns if get_campaign_status(c) == "disabled")
        
        response = {
            "success": True,
            "campaigns": formatted_campaigns,
            "total": total_count,
            "skip": skip,
            "limit": limit,
            "has_more": (skip + len(formatted_campaigns)) < total_count,
            "filter_status": status.lower() if status else None,
            "stats": {
                "total_campaigns": len(all_campaigns),
                "active_campaigns": active_count,
                "scheduled_campaigns": scheduled_count,
                "ended_campaigns": ended_count,
                "disabled_campaigns": disabled_count
            },
            "fetched_at": datetime.now(timezone.utc).isoformat()
        }
        
        print(f"✅ Campaigns fetched: {len(formatted_campaigns)} of {total_count} (active={active_count})")
        return response
        
    except Exception as e:
        print(f"❌ Campaigns fetch error: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@super_admin_router.post("/campaigns")
async def create_campaign(
    username: str = Query(...),
    password: str = Query(...),
    title: str = Query(..., min_length=1, max_length=200, description="Campaign title"),
    start_date: str = Query(..., description="Campaign start date (ISO format)"),
    end_date: str = Query(..., description="Campaign end date (ISO format)"),
    description: Optional[str] = Query(None, max_length=1000, description="Campaign description"),
    discount_percentage: float = Query(0.0, ge=0, le=100, description="Discount percentage"),
    discount_amount: Optional[float] = Query(None, ge=0, description="Fixed discount amount in INR"),
    theme: Optional[str] = Query(None, description="Campaign theme"),
    banner_text: Optional[str] = Query(None, description="Banner text to display"),
    banner_color: Optional[str] = Query("#FF6B35", description="Banner background color")
):
    """
    Create a new promotional campaign.
    
    Validates that the campaign date range does not overlap with existing active campaigns.
    
    Requirements: 9.2, 9.3
    """
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    db = get_db()
    
    try:
        print(f"📊 Creating campaign: {title}")
        
        # Parse dates
        try:
            parsed_start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            if parsed_start_date.tzinfo is None:
                parsed_start_date = parsed_start_date.replace(tzinfo=timezone.utc)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format. Use ISO format.")
        
        try:
            parsed_end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            if parsed_end_date.tzinfo is None:
                parsed_end_date = parsed_end_date.replace(tzinfo=timezone.utc)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format. Use ISO format.")
        
        # Build campaign data
        campaign_data = {
            "title": title.strip(),
            "description": description.strip() if description else None,
            "discount_percentage": discount_percentage,
            "discount_amount": discount_amount,
            "start_date": parsed_start_date,
            "end_date": parsed_end_date,
            "theme": theme.strip() if theme else None,
            "banner_text": banner_text.strip() if banner_text else None,
            "banner_color": banner_color or "#FF6B35"
        }
        
        # Validate campaign data
        validation_errors = validate_campaign(campaign_data)
        if validation_errors:
            raise HTTPException(status_code=400, detail=f"Validation errors: {', '.join(validation_errors)}")
        
        # Check for date overlap with existing campaigns
        existing_campaigns = await db.campaigns.find({"is_active": True}).to_list(None)
        has_overlap, overlapping_title = check_campaign_date_overlap(
            parsed_start_date, parsed_end_date, existing_campaigns
        )
        
        if has_overlap:
            raise HTTPException(
                status_code=400, 
                detail=f"Campaign dates overlap with existing campaign: '{overlapping_title}'"
            )
        
        # Create campaign record
        campaign_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        
        campaign_record = {
            "id": campaign_id,
            "title": campaign_data["title"],
            "description": campaign_data["description"],
            "discount_percentage": campaign_data["discount_percentage"],
            "discount_amount": campaign_data["discount_amount"],
            "start_date": campaign_data["start_date"],
            "end_date": campaign_data["end_date"],
            "theme": campaign_data["theme"],
            "banner_text": campaign_data["banner_text"],
            "banner_color": campaign_data["banner_color"],
            "is_active": True,
            "created_at": now,
            "created_by": username,
            "updated_at": now,
            "updated_by": username
        }
        
        await db.campaigns.insert_one(campaign_record)
        
        # Determine campaign status
        campaign_status = get_campaign_status(campaign_record)
        
        response = {
            "success": True,
            "message": "Campaign created successfully",
            "campaign": {
                "id": campaign_id,
                "title": campaign_record["title"],
                "description": campaign_record["description"],
                "discount_percentage": campaign_record["discount_percentage"],
                "discount_amount": campaign_record["discount_amount"],
                "start_date": campaign_record["start_date"].isoformat(),
                "end_date": campaign_record["end_date"].isoformat(),
                "theme": campaign_record["theme"],
                "banner_text": campaign_record["banner_text"],
                "banner_color": campaign_record["banner_color"],
                "is_active": campaign_record["is_active"],
                "status": campaign_status,
                "is_currently_active": is_campaign_currently_active(campaign_record),
                "created_at": campaign_record["created_at"].isoformat(),
                "created_by": campaign_record["created_by"]
            },
            "created_at": now.isoformat()
        }
        
        print(f"✅ Campaign created: {campaign_id} - {title} (status={campaign_status})")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Campaign creation error: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@super_admin_router.get("/campaigns/{campaign_id}")
async def get_campaign(
    campaign_id: str,
    username: str = Query(...),
    password: str = Query(...)
):
    """
    Get a specific campaign by ID.
    
    Requirements: 9.1
    """
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    db = get_db()
    
    try:
        print(f"📊 Fetching campaign: {campaign_id}")
        
        campaign = await db.campaigns.find_one({"id": campaign_id})
        
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        campaign_status = get_campaign_status(campaign)
        
        response = {
            "success": True,
            "campaign": {
                "id": campaign.get("id"),
                "title": campaign.get("title"),
                "description": campaign.get("description"),
                "discount_percentage": campaign.get("discount_percentage", 0),
                "discount_amount": campaign.get("discount_amount"),
                "start_date": campaign.get("start_date").isoformat() if campaign.get("start_date") else None,
                "end_date": campaign.get("end_date").isoformat() if campaign.get("end_date") else None,
                "theme": campaign.get("theme"),
                "banner_text": campaign.get("banner_text"),
                "banner_color": campaign.get("banner_color"),
                "is_active": campaign.get("is_active", True),
                "status": campaign_status,
                "is_currently_active": is_campaign_currently_active(campaign),
                "created_at": campaign.get("created_at").isoformat() if campaign.get("created_at") else None,
                "created_by": campaign.get("created_by"),
                "updated_at": campaign.get("updated_at").isoformat() if campaign.get("updated_at") else None,
                "updated_by": campaign.get("updated_by")
            },
            "fetched_at": datetime.now(timezone.utc).isoformat()
        }
        
        print(f"✅ Campaign fetched: {campaign_id}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Campaign fetch error: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@super_admin_router.put("/campaigns/{campaign_id}")
async def update_campaign(
    campaign_id: str,
    username: str = Query(...),
    password: str = Query(...),
    title: Optional[str] = Query(None, min_length=1, max_length=200, description="Campaign title"),
    description: Optional[str] = Query(None, max_length=1000, description="Campaign description"),
    discount_percentage: Optional[float] = Query(None, ge=0, le=100, description="Discount percentage"),
    discount_amount: Optional[float] = Query(None, ge=0, description="Fixed discount amount in INR"),
    start_date: Optional[str] = Query(None, description="Campaign start date (ISO format)"),
    end_date: Optional[str] = Query(None, description="Campaign end date (ISO format)"),
    theme: Optional[str] = Query(None, description="Campaign theme"),
    banner_text: Optional[str] = Query(None, description="Banner text to display"),
    banner_color: Optional[str] = Query(None, description="Banner background color"),
    is_active: Optional[bool] = Query(None, description="Whether campaign is enabled")
):
    """
    Update an existing campaign.
    
    Validates that updated date range does not overlap with other active campaigns.
    
    Requirements: 9.2, 9.3
    """
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    db = get_db()
    
    try:
        print(f"📊 Updating campaign: {campaign_id}")
        
        # Get existing campaign
        campaign = await db.campaigns.find_one({"id": campaign_id})
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        # Build update dict with only provided fields
        update_fields = {}
        
        if title is not None:
            update_fields["title"] = title.strip()
        if description is not None:
            update_fields["description"] = description.strip() if description else None
        if discount_percentage is not None:
            update_fields["discount_percentage"] = discount_percentage
        if discount_amount is not None:
            update_fields["discount_amount"] = discount_amount
        if theme is not None:
            update_fields["theme"] = theme.strip() if theme else None
        if banner_text is not None:
            update_fields["banner_text"] = banner_text.strip() if banner_text else None
        if banner_color is not None:
            update_fields["banner_color"] = banner_color
        if is_active is not None:
            update_fields["is_active"] = is_active
        
        # Parse and validate date fields
        parsed_start_date = campaign.get("start_date")
        parsed_end_date = campaign.get("end_date")
        
        if start_date is not None:
            try:
                parsed_start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                if parsed_start_date.tzinfo is None:
                    parsed_start_date = parsed_start_date.replace(tzinfo=timezone.utc)
                update_fields["start_date"] = parsed_start_date
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid start_date format. Use ISO format.")
        
        if end_date is not None:
            try:
                parsed_end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                if parsed_end_date.tzinfo is None:
                    parsed_end_date = parsed_end_date.replace(tzinfo=timezone.utc)
                update_fields["end_date"] = parsed_end_date
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid end_date format. Use ISO format.")
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields provided for update")
        
        # Create merged campaign for validation
        merged_campaign = {**campaign, **update_fields}
        
        # Validate merged campaign
        validation_errors = validate_campaign(merged_campaign)
        if validation_errors:
            raise HTTPException(status_code=400, detail=f"Validation errors: {', '.join(validation_errors)}")
        
        # Check for date overlap if dates are being updated and campaign will be active
        if (start_date is not None or end_date is not None) and merged_campaign.get("is_active", True):
            existing_campaigns = await db.campaigns.find({"is_active": True}).to_list(None)
            has_overlap, overlapping_title = check_campaign_date_overlap(
                merged_campaign["start_date"], 
                merged_campaign["end_date"], 
                existing_campaigns,
                exclude_campaign_id=campaign_id
            )
            
            if has_overlap:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Campaign dates overlap with existing campaign: '{overlapping_title}'"
                )
        
        # Update the campaign
        update_fields["updated_at"] = datetime.now(timezone.utc)
        update_fields["updated_by"] = username
        
        await db.campaigns.update_one(
            {"id": campaign_id},
            {"$set": update_fields}
        )
        
        # Fetch updated campaign
        updated_campaign = await db.campaigns.find_one({"id": campaign_id})
        campaign_status = get_campaign_status(updated_campaign)
        
        response = {
            "success": True,
            "message": "Campaign updated successfully",
            "campaign": {
                "id": updated_campaign.get("id"),
                "title": updated_campaign.get("title"),
                "description": updated_campaign.get("description"),
                "discount_percentage": updated_campaign.get("discount_percentage", 0),
                "discount_amount": updated_campaign.get("discount_amount"),
                "start_date": updated_campaign.get("start_date").isoformat() if updated_campaign.get("start_date") else None,
                "end_date": updated_campaign.get("end_date").isoformat() if updated_campaign.get("end_date") else None,
                "theme": updated_campaign.get("theme"),
                "banner_text": updated_campaign.get("banner_text"),
                "banner_color": updated_campaign.get("banner_color"),
                "is_active": updated_campaign.get("is_active", True),
                "status": campaign_status,
                "is_currently_active": is_campaign_currently_active(updated_campaign),
                "created_at": updated_campaign.get("created_at").isoformat() if updated_campaign.get("created_at") else None,
                "created_by": updated_campaign.get("created_by"),
                "updated_at": updated_campaign.get("updated_at").isoformat() if updated_campaign.get("updated_at") else None,
                "updated_by": updated_campaign.get("updated_by")
            },
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        print(f"✅ Campaign updated: {campaign_id}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Campaign update error: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@super_admin_router.delete("/campaigns/{campaign_id}")
async def delete_campaign(
    campaign_id: str,
    username: str = Query(...),
    password: str = Query(...)
):
    """
    Delete a campaign (soft delete by setting is_active to False).
    
    Requirements: 9.2
    """
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    db = get_db()
    
    try:
        print(f"📊 Deleting campaign: {campaign_id}")
        
        # Get existing campaign
        campaign = await db.campaigns.find_one({"id": campaign_id})
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        # Soft delete by setting is_active to False
        await db.campaigns.update_one(
            {"id": campaign_id},
            {"$set": {
                "is_active": False,
                "updated_at": datetime.now(timezone.utc),
                "updated_by": username
            }}
        )
        
        response = {
            "success": True,
            "message": "Campaign deleted successfully",
            "campaign_id": campaign_id,
            "deleted_at": datetime.now(timezone.utc).isoformat()
        }
        
        print(f"✅ Campaign deleted: {campaign_id}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Campaign delete error: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@super_admin_router.get("/campaigns/active/current")
async def get_current_active_campaign(
    username: str = Query(...),
    password: str = Query(...)
):
    """
    Get the currently active campaign (if any).
    
    Returns the campaign that is currently active based on dates and is_active flag.
    
    Requirements: 9.4
    """
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    db = get_db()
    
    try:
        print("📊 Fetching current active campaign...")
        
        # Get all active campaigns
        campaigns = await db.campaigns.find({"is_active": True}).to_list(None)
        
        # Find the currently active one
        current_campaign = None
        for campaign in campaigns:
            if is_campaign_currently_active(campaign):
                current_campaign = campaign
                break
        
        if current_campaign:
            response = {
                "success": True,
                "has_active_campaign": True,
                "campaign": {
                    "id": current_campaign.get("id"),
                    "title": current_campaign.get("title"),
                    "description": current_campaign.get("description"),
                    "discount_percentage": current_campaign.get("discount_percentage", 0),
                    "discount_amount": current_campaign.get("discount_amount"),
                    "start_date": current_campaign.get("start_date").isoformat() if current_campaign.get("start_date") else None,
                    "end_date": current_campaign.get("end_date").isoformat() if current_campaign.get("end_date") else None,
                    "theme": current_campaign.get("theme"),
                    "banner_text": current_campaign.get("banner_text"),
                    "banner_color": current_campaign.get("banner_color")
                },
                "fetched_at": datetime.now(timezone.utc).isoformat()
            }
        else:
            response = {
                "success": True,
                "has_active_campaign": False,
                "campaign": None,
                "fetched_at": datetime.now(timezone.utc).isoformat()
            }
        
        print(f"✅ Current active campaign: {current_campaign.get('title') if current_campaign else 'None'}")
        return response
        
    except Exception as e:
        print(f"❌ Current active campaign fetch error: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")



# ============ USER BUSINESS DETAILS (Requirements 10.2, 10.3, 10.4, 10.5) ============

class BusinessDetails(BaseModel):
    """
    Comprehensive business details for a user.
    
    Includes restaurant information, subscription status, payment history,
    and usage statistics.
    
    Requirements: 10.2, 10.3, 10.4
    """
    user_id: str
    email: str
    username: Optional[str] = None
    role: str
    
    # Business Information (Requirements 10.2)
    restaurant_name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    gstin: Optional[str] = None
    fssai: Optional[str] = None
    business_type: Optional[str] = None
    
    # Subscription Status (Requirements 10.3)
    subscription_active: bool = False
    subscription_expires_at: Optional[str] = None
    subscription_payment_id: Optional[str] = None
    
    # Usage Statistics (Requirements 10.4)
    menu_items_count: int = 0
    orders_count: int = 0
    total_revenue: float = 0.0
    tables_count: int = 0
    staff_count: int = 0
    
    # Additional Info
    created_at: Optional[str] = None
    bill_count: int = 0
    
    # Referral Info
    referral_code: Optional[str] = None
    wallet_balance: float = 0.0
    total_referrals: int = 0
    total_referral_earnings: float = 0.0


class UserNavigationResult(BaseModel):
    """
    Navigation result for browsing through users.
    
    Requirements: 10.5
    """
    current_user_id: str
    previous_user_id: Optional[str] = None
    next_user_id: Optional[str] = None
    total_users: int = 0
    current_position: int = 0


@super_admin_router.get("/users/{user_id}/business-details")
async def get_user_business_details(
    user_id: str,
    username: str = Query(...),
    password: str = Query(...)
):
    """
    Get comprehensive business details for a specific user.
    
    Returns restaurant information, subscription status, payment history,
    and usage statistics including menu items count, orders count, and revenue.
    
    Requirements: 10.2, 10.3, 10.4
    
    Property 17: Business Details Completeness
    For any user business details query, the response SHALL include restaurant_name,
    address, phone, GSTIN, FSSAI, business_type, subscription_status, and usage statistics.
    """
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    db = get_db()
    
    try:
        print(f"📊 Fetching business details for user: {user_id}")
        
        # Get user by id or email
        user = await db.users.find_one(
            {"$or": [{"id": user_id}, {"email": user_id}]},
            {"_id": 0, "password": 0, "razorpay_key_secret": 0}
        )
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get the actual user_id (in case we searched by email)
        actual_user_id = user.get("id")
        
        # Determine organization_id for data queries
        # For admin users, org_id is their own id
        # For staff users, org_id is their organization_id
        if user.get("role") == "admin":
            org_id = actual_user_id
        else:
            org_id = user.get("organization_id", actual_user_id)
        
        # Extract business settings
        business_settings = user.get("business_settings", {}) or {}
        
        # Get menu items count
        menu_items_count = await db.menu_items.count_documents({"organization_id": org_id})
        
        # Get orders count and total revenue
        orders_pipeline = [
            {"$match": {"organization_id": org_id}},
            {"$group": {
                "_id": None,
                "total_orders": {"$sum": 1},
                "total_revenue": {"$sum": {"$ifNull": ["$total", 0]}}
            }}
        ]
        orders_result = await db.orders.aggregate(orders_pipeline).to_list(1)
        
        orders_count = 0
        total_revenue = 0.0
        if orders_result:
            orders_count = orders_result[0].get("total_orders", 0)
            total_revenue = orders_result[0].get("total_revenue", 0.0)
        
        # Get tables count
        tables_count = await db.tables.count_documents({"organization_id": org_id})
        
        # Get staff count (users linked to this organization)
        staff_count = 0
        if user.get("role") == "admin":
            staff_count = await db.users.count_documents({
                "organization_id": org_id,
                "id": {"$ne": actual_user_id}  # Exclude the admin themselves
            })
        
        # Get payment history for subscription
        payment_history = []
        if user.get("subscription_payment_id"):
            payment_history.append({
                "payment_id": user.get("subscription_payment_id"),
                "order_id": user.get("subscription_order_id"),
                "verified_at": user.get("subscription_verified_at"),
                "type": "subscription"
            })
        
        # Format subscription_expires_at
        subscription_expires_at = user.get("subscription_expires_at")
        if subscription_expires_at:
            if isinstance(subscription_expires_at, datetime):
                subscription_expires_at = subscription_expires_at.isoformat()
        
        # Format created_at
        created_at = user.get("created_at")
        if created_at:
            if isinstance(created_at, datetime):
                created_at = created_at.isoformat()
        
        # Build response
        business_details = {
            "success": True,
            "user_id": actual_user_id,
            "email": user.get("email"),
            "username": user.get("username"),
            "role": user.get("role"),
            
            # Business Information (Requirements 10.2)
            "restaurant_name": business_settings.get("restaurant_name"),
            "address": business_settings.get("address"),
            "phone": business_settings.get("phone") or user.get("phone"),
            "gstin": business_settings.get("gstin"),
            "fssai": business_settings.get("fssai"),
            "business_type": business_settings.get("business_type"),
            
            # Subscription Status (Requirements 10.3)
            "subscription_active": user.get("subscription_active", False),
            "subscription_expires_at": subscription_expires_at,
            "subscription_payment_id": user.get("subscription_payment_id"),
            "payment_history": payment_history,
            
            # Usage Statistics (Requirements 10.4)
            "menu_items_count": menu_items_count,
            "orders_count": orders_count,
            "total_revenue": total_revenue,
            "tables_count": tables_count,
            "staff_count": staff_count,
            
            # Additional Info
            "created_at": created_at,
            "bill_count": orders_count,  # Use actual orders count as bill count
            
            # Referral Info
            "referral_code": user.get("referral_code"),
            "wallet_balance": user.get("wallet_balance", 0.0),
            "total_referrals": user.get("total_referrals", 0),
            "total_referral_earnings": user.get("total_referral_earnings", 0.0),
            
            "fetched_at": datetime.now(timezone.utc).isoformat()
        }
        
        print(f"✅ Business details fetched for user: {actual_user_id}")
        return business_details
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Business details fetch error: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@super_admin_router.get("/users/navigation")
async def get_user_navigation(
    username: str = Query(...),
    password: str = Query(...),
    current_user_id: str = Query(..., description="Current user ID to get navigation for")
):
    """
    Get previous and next user IDs for navigation.
    
    Allows navigating between users without closing the details modal.
    Users are sorted by creation date (newest first).
    
    Requirements: 10.5
    """
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    db = get_db()
    
    try:
        print(f"📊 Fetching user navigation for: {current_user_id}")
        
        # Get all users sorted by created_at descending (newest first)
        # Only fetch id field for efficiency
        users_cursor = db.users.find(
            {},
            {"_id": 0, "id": 1, "email": 1}
        ).sort("created_at", -1)
        
        users = await users_cursor.to_list(None)
        
        if not users:
            raise HTTPException(status_code=404, detail="No users found")
        
        # Find current user position
        current_position = -1
        for i, user in enumerate(users):
            if user.get("id") == current_user_id or user.get("email") == current_user_id:
                current_position = i
                break
        
        if current_position == -1:
            raise HTTPException(status_code=404, detail="Current user not found")
        
        # Get previous and next user IDs
        previous_user_id = None
        next_user_id = None
        
        if current_position > 0:
            previous_user_id = users[current_position - 1].get("id")
        
        if current_position < len(users) - 1:
            next_user_id = users[current_position + 1].get("id")
        
        result = {
            "success": True,
            "current_user_id": current_user_id,
            "previous_user_id": previous_user_id,
            "next_user_id": next_user_id,
            "total_users": len(users),
            "current_position": current_position + 1,  # 1-indexed for display
            "fetched_at": datetime.now(timezone.utc).isoformat()
        }
        
        print(f"✅ User navigation: position {current_position + 1}/{len(users)}, prev={previous_user_id}, next={next_user_id}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ User navigation fetch error: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
