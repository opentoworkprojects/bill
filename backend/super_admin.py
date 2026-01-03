"""
Super Admin Panel - Site Owner Only
Monitor all users, subscriptions, tickets, and system health
"""

from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timezone, timedelta
from typing import Optional
import os

super_admin_router = APIRouter(prefix="/api/super-admin", tags=["Super Admin"])

# Super admin credentials (CHANGE THESE!)
SUPER_ADMIN_USERNAME = os.getenv("SUPER_ADMIN_USERNAME", "superadmin")
SUPER_ADMIN_PASSWORD = os.getenv("SUPER_ADMIN_PASSWORD", "change-this-password-123")

# Database reference - will be set by server.py
_db = None

def set_database(database):
    """Set the database reference from server.py"""
    global _db
    _db = database

def get_db():
    """Get the database reference"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    return _db

def verify_super_admin(username: str, password: str) -> bool:
    """Verify super admin credentials"""
    return username == SUPER_ADMIN_USERNAME and password == SUPER_ADMIN_PASSWORD


@super_admin_router.get("/dashboard")
async def get_super_admin_dashboard(
    username: str = Query(...),
    password: str = Query(...)
):
    """Get complete system overview"""
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    db = get_db()
    
    # Get all users
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    
    # Get all tickets
    tickets = await db.support_tickets.find({}, {"_id": 0}).to_list(1000)
    
    # Get all orders (last 30 days)
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    recent_orders = await db.orders.find(
        {"created_at": {"$gte": thirty_days_ago}},
        {"_id": 0}
    ).to_list(10000)
    
    # Calculate statistics
    total_users = len(users)
    active_subscriptions = sum(1 for u in users if u.get("subscription_active"))
    trial_users = sum(1 for u in users if not u.get("subscription_active"))
    total_revenue = sum(u.get("bill_count", 0) for u in users)
    
    # Ticket statistics
    open_tickets = sum(1 for t in tickets if t.get("status") == "open")
    pending_tickets = sum(1 for t in tickets if t.get("status") == "pending")
    resolved_tickets = sum(1 for t in tickets if t.get("status") == "resolved")
    
    return {
        "overview": {
            "total_users": total_users,
            "active_subscriptions": active_subscriptions,
            "trial_users": trial_users,
            "total_revenue": total_revenue,
            "total_orders_30d": len(recent_orders),
            "open_tickets": open_tickets,
            "pending_tickets": pending_tickets,
            "resolved_tickets": resolved_tickets
        },
        "users": users,
        "tickets": tickets,
        "recent_orders": recent_orders[:100]
    }


@super_admin_router.get("/users")
async def get_all_users(
    username: str = Query(...),
    password: str = Query(...),
    skip: int = Query(0),
    limit: int = Query(100)
):
    """Get all users with pagination"""
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    db = get_db()
    
    users = await db.users.find(
        {},
        {"_id": 0, "password": 0}
    ).skip(skip).limit(limit).to_list(limit)
    
    total = await db.users.count_documents({})
    
    return {
        "users": users,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@super_admin_router.get("/users/{user_id}")
async def get_user_details(
    user_id: str,
    username: str = Query(...),
    password: str = Query(...)
):
    """Get detailed user information"""
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    db = get_db()
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user's orders
    orders = await db.orders.find(
        {"organization_id": user_id},
        {"_id": 0}
    ).to_list(1000)
    
    # Get user's menu items
    menu_items = await db.menu_items.find(
        {"organization_id": user_id},
        {"_id": 0}
    ).to_list(1000)
    
    # Get user's payments
    payments = await db.payments.find(
        {"organization_id": user_id},
        {"_id": 0}
    ).to_list(1000)
    
    return {
        "user": user,
        "orders": orders,
        "menu_items": menu_items,
        "payments": payments,
        "statistics": {
            "total_orders": len(orders),
            "total_menu_items": len(menu_items),
            "total_payments": len(payments),
            "total_revenue": sum(p.get("amount", 0) for p in payments)
        }
    }


@super_admin_router.put("/users/{user_id}/subscription")
async def update_user_subscription(
    user_id: str,
    username: str = Query(...),
    password: str = Query(...),
    subscription_active: bool = Query(...),
    subscription_expires_at: Optional[str] = Query(None)
):
    """Manually update user subscription"""
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    db = get_db()
    
    update_data = {
        "subscription_active": subscription_active
    }
    
    if subscription_expires_at:
        update_data["subscription_expires_at"] = subscription_expires_at
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "message": "Subscription updated successfully",
        "user_id": user_id,
        "subscription_active": subscription_active
    }


@super_admin_router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    username: str = Query(...),
    password: str = Query(...)
):
    """Delete user and all their data"""
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    db = get_db()
    
    # Delete user
    await db.users.delete_one({"id": user_id})
    
    # Delete user's data
    await db.orders.delete_many({"organization_id": user_id})
    await db.menu_items.delete_many({"organization_id": user_id})
    await db.tables.delete_many({"organization_id": user_id})
    await db.payments.delete_many({"organization_id": user_id})
    await db.inventory.delete_many({"organization_id": user_id})
    
    return {
        "message": "User and all data deleted successfully",
        "user_id": user_id
    }


@super_admin_router.get("/tickets")
async def get_all_tickets(
    username: str = Query(...),
    password: str = Query(...),
    status: Optional[str] = Query(None),
    skip: int = Query(0),
    limit: int = Query(100)
):
    """Get all support tickets"""
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    db = get_db()
    
    query = {}
    if status:
        query["status"] = status
    
    tickets = await db.support_tickets.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    total = await db.support_tickets.count_documents(query)
    
    return {
        "tickets": tickets,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@super_admin_router.put("/tickets/{ticket_id}")
async def update_ticket_status(
    ticket_id: str,
    username: str = Query(...),
    password: str = Query(...),
    status: str = Query(...),
    admin_notes: Optional[str] = Query(None)
):
    """Update ticket status and add admin notes"""
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    db = get_db()
    
    update_data = {
        "status": status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if admin_notes:
        update_data["admin_notes"] = admin_notes
    
    result = await db.support_tickets.update_one(
        {"id": ticket_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    return {
        "message": "Ticket updated successfully",
        "ticket_id": ticket_id,
        "status": status
    }


@super_admin_router.get("/system/health")
async def get_system_health(
    username: str = Query(...),
    password: str = Query(...)
):
    """Get system health and statistics"""
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    db = get_db()
    
    # Database statistics
    users_count = await db.users.count_documents({})
    orders_count = await db.orders.count_documents({})
    menu_items_count = await db.menu_items.count_documents({})
    tickets_count = await db.support_tickets.count_documents({})
    
    # Get database size (approximate)
    try:
        stats = await db.command("dbStats")
        size_mb = stats.get("dataSize", 0) / (1024 * 1024)
        storage_mb = stats.get("storageSize", 0) / (1024 * 1024)
    except:
        size_mb = 0
        storage_mb = 0
    
    return {
        "database": {
            "users": users_count,
            "orders": orders_count,
            "menu_items": menu_items_count,
            "tickets": tickets_count,
            "size_mb": size_mb,
            "storage_mb": storage_mb
        },
        "system": {
            "status": "healthy",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    }


@super_admin_router.get("/analytics")
async def get_analytics(
    username: str = Query(...),
    password: str = Query(...),
    days: int = Query(30)
):
    """Get system analytics"""
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    db = get_db()
    
    start_date = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    
    # New users
    new_users = await db.users.count_documents({
        "created_at": {"$gte": start_date}
    })
    
    # New orders
    new_orders = await db.orders.count_documents({
        "created_at": {"$gte": start_date}
    })
    
    # New tickets
    new_tickets = await db.support_tickets.count_documents({
        "created_at": {"$gte": start_date}
    })
    
    # Active users (users with orders in period)
    active_users_pipeline = [
        {"$match": {"created_at": {"$gte": start_date}}},
        {"$group": {"_id": "$organization_id"}},
        {"$count": "total"}
    ]
    active_users_result = await db.orders.aggregate(active_users_pipeline).to_list(1)
    active_users = active_users_result[0]["total"] if active_users_result else 0
    
    return {
        "period_days": days,
        "new_users": new_users,
        "new_orders": new_orders,
        "new_tickets": new_tickets,
        "active_users": active_users,
        "start_date": start_date
    }


# ============ CAMPAIGN MANAGEMENT ============

@super_admin_router.get("/campaigns")
async def get_all_campaigns(
    username: str = Query(...),
    password: str = Query(...)
):
    """Get all campaigns including active early adopter campaign"""
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    db = get_db()
    
    # Get campaigns from database or use defaults
    campaigns = await db.campaigns.find({}, {"_id": 0}).to_list(100)
    
    # If no campaigns in DB, return the hardcoded early adopter campaign
    if not campaigns:
        now = datetime.now(timezone.utc)
        early_adopter_end = datetime(2025, 12, 31, 23, 59, 59, tzinfo=timezone.utc)
        
        campaigns = [{
            "id": "EARLY_ADOPTER_2025",
            "name": "Early Adopter Special",
            "description": "Get BillByteKOT for just ₹9/year - 99% OFF!",
            "price_paise": 900,
            "original_price_paise": 99900,
            "discount_percent": 99,
            "start_date": "2025-01-01T00:00:00+00:00",
            "end_date": "2025-12-31T23:59:59+00:00",
            "active": now <= early_adopter_end,
            "badge": "🔥 99% OFF",
            "max_users": 1000,
            "type": "early_adopter",
            "is_default": True
        }]
    
    # Get subscriber count for each campaign
    for campaign in campaigns:
        if campaign.get("id"):
            subscriber_count = await db.users.count_documents({
                "subscription_active": True,
                "subscription_campaign": campaign["id"]
            })
            campaign["current_subscribers"] = subscriber_count
    
    return {
        "campaigns": campaigns,
        "total": len(campaigns)
    }


@super_admin_router.post("/campaigns")
async def create_campaign(
    username: str = Query(...),
    password: str = Query(...),
    name: str = Query(...),
    description: str = Query(...),
    price_paise: int = Query(...),
    original_price_paise: int = Query(...),
    start_date: str = Query(...),
    end_date: str = Query(...),
    badge: str = Query(""),
    max_users: int = Query(0)
):
    """Create a new pricing campaign"""
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    db = get_db()
    
    import uuid
    campaign_id = f"CAMPAIGN_{uuid.uuid4().hex[:8].upper()}"
    
    discount_percent = int((1 - price_paise / original_price_paise) * 100) if original_price_paise > 0 else 0
    
    campaign = {
        "id": campaign_id,
        "name": name,
        "description": description,
        "price_paise": price_paise,
        "original_price_paise": original_price_paise,
        "discount_percent": discount_percent,
        "start_date": start_date,
        "end_date": end_date,
        "active": True,
        "badge": badge or f"{discount_percent}% OFF",
        "max_users": max_users,
        "current_users": 0,
        "type": "custom",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.campaigns.insert_one(campaign)
    
    return {
        "message": "Campaign created successfully",
        "campaign": campaign
    }


@super_admin_router.put("/campaigns/{campaign_id}")
async def update_campaign(
    campaign_id: str,
    username: str = Query(...),
    password: str = Query(...),
    active: Optional[bool] = Query(None),
    price_paise: Optional[int] = Query(None),
    end_date: Optional[str] = Query(None),
    badge: Optional[str] = Query(None),
    max_users: Optional[int] = Query(None)
):
    """Update an existing campaign"""
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    db = get_db()
    
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    
    if active is not None:
        update_data["active"] = active
    if price_paise is not None:
        update_data["price_paise"] = price_paise
    if end_date is not None:
        update_data["end_date"] = end_date
    if badge is not None:
        update_data["badge"] = badge
    if max_users is not None:
        update_data["max_users"] = max_users
    
    result = await db.campaigns.update_one(
        {"id": campaign_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        if campaign_id == "EARLY_ADOPTER_2025":
            return {
                "message": "Early adopter campaign is hardcoded. To modify, update server.py EARLY_ADOPTER_END_DATE",
                "campaign_id": campaign_id,
                "note": "This campaign runs till Dec 31, 2025 by default"
            }
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    return {
        "message": "Campaign updated successfully",
        "campaign_id": campaign_id
    }


@super_admin_router.delete("/campaigns/{campaign_id}")
async def delete_campaign(
    campaign_id: str,
    username: str = Query(...),
    password: str = Query(...)
):
    """Delete a campaign (cannot delete default early adopter campaign)"""
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    if campaign_id == "EARLY_ADOPTER_2025":
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete the default early adopter campaign. Modify server.py to change it."
        )
    
    db = get_db()
    
    result = await db.campaigns.delete_one({"id": campaign_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    return {
        "message": "Campaign deleted successfully",
        "campaign_id": campaign_id
    }


@super_admin_router.get("/campaigns/stats")
async def get_campaign_stats(
    username: str = Query(...),
    password: str = Query(...)
):
    """Get campaign performance statistics"""
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    db = get_db()
    
    # Get all subscribed users
    subscribed_users = await db.users.find(
        {"subscription_active": True},
        {"_id": 0, "subscription_campaign": 1, "subscription_price_paid": 1, "created_at": 1}
    ).to_list(10000)
    
    # Calculate stats
    total_subscribers = len(subscribed_users)
    total_revenue = sum(u.get("subscription_price_paid", 0) for u in subscribed_users)
    
    # Group by campaign
    campaign_stats = {}
    for user in subscribed_users:
        campaign = user.get("subscription_campaign", "unknown")
        if campaign not in campaign_stats:
            campaign_stats[campaign] = {"count": 0, "revenue": 0}
        campaign_stats[campaign]["count"] += 1
        campaign_stats[campaign]["revenue"] += user.get("subscription_price_paid", 0)
    
    return {
        "total_subscribers": total_subscribers,
        "total_revenue_paise": total_revenue,
        "total_revenue_display": f"₹{total_revenue / 100:.2f}",
        "by_campaign": campaign_stats,
        "early_adopter_active": datetime.now(timezone.utc) <= datetime(2025, 12, 31, 23, 59, 59, tzinfo=timezone.utc)
    }


# ============ SALE/OFFER MANAGEMENT ============

@super_admin_router.get("/sale-offer")
async def get_sale_offer(
    username: str = Query(...),
    password: str = Query(...)
):
    """Get current sale offer settings - Site Owner Only"""
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    db = get_db()
    offer = await db.site_settings.find_one({"type": "sale_offer"})
    if not offer:
        return {
            "enabled": False,
            "title": "",
            "subtitle": "",
            "discount_text": "",
            "badge_text": "",
            "bg_color": "from-red-500 to-orange-500",
            "end_date": "",
            "valid_until": "",
            "theme": "default",
            "discount_percent": 20,
            "original_price": 1999,
            "sale_price": 1599,
            "cta_text": "Grab This Deal Now!",
            "urgency_text": "⚡ Limited slots available. Offer ends soon!"
        }
    
    offer.pop("_id", None)
    offer.pop("type", None)
    return offer


@super_admin_router.post("/sale-offer")
async def update_sale_offer(
    offer_data: dict,
    username: str = Query(...),
    password: str = Query(...)
):
    """Update sale offer settings - Site Owner Only"""
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    db = get_db()
    offer_data["type"] = "sale_offer"
    offer_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.site_settings.update_one(
        {"type": "sale_offer"},
        {"$set": offer_data},
        upsert=True
    )
    
    return {"message": "Sale offer updated successfully"}


# ============ PRICING MANAGEMENT ============

@super_admin_router.get("/pricing")
async def get_pricing(
    username: str = Query(...),
    password: str = Query(...)
):
    """Get current pricing settings - Site Owner Only"""
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    db = get_db()
    pricing = await db.site_settings.find_one({"type": "pricing"})
    if not pricing:
        return {
            "regular_price": 999,
            "regular_price_display": "₹999",
            "campaign_price": 599,
            "campaign_price_display": "₹599",
            "campaign_active": False,
            "campaign_name": "NEWYEAR2026",
            "campaign_discount_percent": 40,
            "campaign_start_date": "",
            "campaign_end_date": "",
            "trial_days": 7,
            "subscription_months": 12
        }
    
    pricing.pop("_id", None)
    pricing.pop("type", None)
    return pricing


@super_admin_router.post("/pricing")
async def update_pricing(
    pricing_data: dict,
    username: str = Query(...),
    password: str = Query(...)
):
    """Update pricing settings - Site Owner Only"""
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    db = get_db()
    pricing_data["type"] = "pricing"
    pricing_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.site_settings.update_one(
        {"type": "pricing"},
        {"$set": pricing_data},
        upsert=True
    )
    
    return {"message": "Pricing updated successfully"}


# ============ PUSH NOTIFICATION MANAGEMENT ============

@super_admin_router.get("/notifications")
async def get_all_notifications(
    username: str = Query(...),
    password: str = Query(...),
    skip: int = Query(0),
    limit: int = Query(50)
):
    """Get all sent notifications - Site Owner Only"""
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    db = get_db()
    
    notifications = await db.admin_notifications.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    total = await db.admin_notifications.count_documents({})
    
    return {
        "notifications": notifications,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@super_admin_router.post("/notifications/send")
async def send_notification(
    notification_data: dict,
    username: str = Query(...),
    password: str = Query(...)
):
    """Send notification to all users or specific users - Site Owner Only"""
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    db = get_db()
    
    import uuid
    notification_id = str(uuid.uuid4())
    
    notification = {
        "id": notification_id,
        "title": notification_data.get("title", "Notification"),
        "message": notification_data.get("message", ""),
        "type": notification_data.get("type", "info"),  # info, success, warning, error, order, promo
        "target": notification_data.get("target", "all"),  # all, subscribed, trial, specific
        "target_users": notification_data.get("target_users", []),  # for specific targeting
        "action_url": notification_data.get("action_url", ""),
        "action_label": notification_data.get("action_label", ""),
        "priority": notification_data.get("priority", "normal"),  # low, normal, high
        "expires_at": notification_data.get("expires_at", ""),  # ISO date string
        "created_at": datetime.now(timezone.utc).isoformat(),
        "sent_count": 0,
        "read_count": 0,
        "status": "active"
    }
    
    await db.admin_notifications.insert_one(notification)
    
    # Get target users count
    query = {}
    if notification["target"] == "subscribed":
        query["subscription_active"] = True
    elif notification["target"] == "trial":
        query["subscription_active"] = False
    elif notification["target"] == "specific":
        query["id"] = {"$in": notification["target_users"]}
    
    target_count = await db.users.count_documents(query)
    
    # Update sent count
    await db.admin_notifications.update_one(
        {"id": notification_id},
        {"$set": {"sent_count": target_count}}
    )
    
    notification["sent_count"] = target_count
    notification.pop("_id", None)
    
    return {
        "message": "Notification sent successfully",
        "notification": notification,
        "target_users_count": target_count
    }


@super_admin_router.delete("/notifications/{notification_id}")
async def delete_notification(
    notification_id: str,
    username: str = Query(...),
    password: str = Query(...)
):
    """Delete a notification - Site Owner Only"""
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    db = get_db()
    
    result = await db.admin_notifications.delete_one({"id": notification_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {
        "message": "Notification deleted successfully",
        "notification_id": notification_id
    }


@super_admin_router.get("/notifications/templates")
async def get_notification_templates(
    username: str = Query(...),
    password: str = Query(...)
):
    """Get pre-built notification templates - Site Owner Only"""
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    templates = [
        {
            "id": "welcome",
            "name": "Welcome Message",
            "title": "Welcome to BillByteKOT! 🎉",
            "message": "Thanks for joining! Start creating orders and managing your restaurant like a pro.",
            "type": "success"
        },
        {
            "id": "new_feature",
            "name": "New Feature Announcement",
            "title": "New Feature Alert! 🚀",
            "message": "We've added exciting new features. Check them out now!",
            "type": "info"
        },
        {
            "id": "promo",
            "name": "Promotional Offer",
            "title": "Special Offer Just For You! 🎁",
            "message": "Get 50% off on your subscription. Limited time only!",
            "type": "promo"
        },
        {
            "id": "maintenance",
            "name": "Maintenance Notice",
            "title": "Scheduled Maintenance ⚠️",
            "message": "We'll be performing maintenance on [DATE]. Service may be briefly unavailable.",
            "type": "warning"
        },
        {
            "id": "trial_ending",
            "name": "Trial Ending Soon",
            "title": "Your Trial Ends Soon! ⏰",
            "message": "Don't lose access! Subscribe now to continue using all features.",
            "type": "warning"
        },
        {
            "id": "thank_you",
            "name": "Thank You",
            "title": "Thank You! 💜",
            "message": "Thanks for being part of the BillByteKOT family. We appreciate you!",
            "type": "success"
        },
        {
            "id": "update",
            "name": "App Update",
            "title": "App Updated! ✨",
            "message": "We've made improvements to make your experience even better.",
            "type": "info"
        },
        {
            "id": "tip",
            "name": "Pro Tip",
            "title": "Pro Tip 💡",
            "message": "Did you know? You can print receipts directly from the app!",
            "type": "info"
        }
    ]
    
    return {"templates": templates}
