"""
Order & Billing Fast Access Caching System
===========================================

Provides ultra-fast order and billing data access with:
- Real-time order state caching
- Customer balance fast access
- Billing calculation caching
- Order filtering and pagination caching
- Automatic invalidation on state changes
- Memory-efficient storage

PERFORMANCE TARGETS:
- Order fetch: <50ms (vs MongoDB: 100-300ms)
- Billing calculation: <20ms (vs computation: 50-150ms)
- Customer balance: <10ms (vs query: 30-100ms)
- Cache hit rate: 85%+ for typical operations
"""

import json
import time
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from collections import defaultdict
from enum import Enum
import hashlib

class OrderState(Enum):
    """Order state enumeration for caching logic"""
    ACTIVE = "active"  # placed, confirmed, preparing
    READY = "ready"  # ready_for_pickup
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    ON_HOLD = "on_hold"


class OrderFastAccessCache:
    """High-performance order and billing data cache"""
    
    def __init__(self):
        # Order state caching
        self._orders_by_org: Dict[str, List[Dict]] = {}  # org_id -> list of orders
        self._order_by_id: Dict[str, Dict] = {}  # order_id -> order details
        self._orders_by_status: Dict[str, Dict[str, List[Dict]]] = {}  # org_id -> {status -> orders}
        
        # Billing cache
        self._customer_balances: Dict[str, Dict[str, float]] = {}  # org_id -> {phone -> balance}
        self._billing_summaries: Dict[str, Dict] = {}  # org_id -> summary data
        self._payment_cache: Dict[str, Dict] = {}  # org_id -> payment info
        
        # Table-based caching
        self._table_orders: Dict[str, Dict[str, str]] = {}  # org_id -> {table_id -> order_id}
        
        # Cache expiry tracking
        self._cache_expiry: Dict[str, float] = {}  # cache_key -> expiry_timestamp
        
        # Configuration
        self.ORDER_CACHE_TTL = 120  # 2 minutes for order lists
        self.BILLING_CACHE_TTL = 300  # 5 minutes for billing data
        self.CUSTOMER_BALANCE_TTL = 600  # 10 minutes for customer balance
        
        # Statistics
        self._stats = {
            "order_hits": 0,
            "order_misses": 0,
            "billing_hits": 0,
            "billing_misses": 0,
            "invalidations": 0,
            "total_access_time": 0.0
        }
        
        self.redis_client = None
    
    async def set_redis_client(self, redis_client):
        """Set Redis client for distributed caching"""
        self.redis_client = redis_client
    
    # ============ ORDER CACHING ============
    
    async def get_active_orders(self, org_id: str, db=None, use_cache=True) -> List[Dict]:
        """
        Get active orders for organization with intelligent caching
        
        Active orders: placed, confirmed, preparing, ready
        """
        start_time = time.time()
        
        cache_key = f"active_orders:{org_id}"
        
        # Check if cache is still valid
        if use_cache and self._is_cache_valid(cache_key):
            orders = self._orders_by_org.get(org_id, [])
            access_time = (time.time() - start_time) * 1000
            self._stats["order_hits"] += 1
            self._stats["total_access_time"] += access_time
            print(f"✅ Active orders HIT: {org_id} ({len(orders)} orders) in {access_time:.2f}ms")
            return orders
        
        # Try Redis first
        if self.redis_client and use_cache:
            try:
                redis_data = await self.redis_client.get(cache_key)
                if redis_data:
                    orders = json.loads(redis_data)
                    self._orders_by_org[org_id] = orders
                    self._cache_expiry[cache_key] = time.time() + self.ORDER_CACHE_TTL
                    access_time = (time.time() - start_time) * 1000
                    self._stats["order_hits"] += 1
                    print(f"✅ Active orders HIT (Redis): {org_id} ({len(orders)} orders) in {access_time:.2f}ms")
                    return orders
            except Exception as e:
                print(f"⚠️ Redis read failed: {e}")
        
        # Query MongoDB
        if not db:
            self._stats["order_misses"] += 1
            return []
        
        try:
            orders = await db.orders.find(
                {
                    "organization_id": org_id,
                    "status": {"$in": ["placed", "confirmed", "preparing", "ready_for_pickup"]}
                },
                {"_id": 0}
            ).sort("created_at", -1).to_list(None)
            
            # Cache the results
            self._orders_by_org[org_id] = orders
            self._cache_expiry[cache_key] = time.time() + self.ORDER_CACHE_TTL
            
            # Store in Redis
            if self.redis_client:
                try:
                    await self.redis_client.setex(
                        cache_key,
                        self.ORDER_CACHE_TTL,
                        json.dumps(orders, default=str)
                    )
                except Exception as e:
                    print(f"⚠️ Redis write failed: {e}")
            
            access_time = (time.time() - start_time) * 1000
            self._stats["order_misses"] += 1
            print(f"📊 Active orders FETCH (DB): {org_id} ({len(orders)} orders) in {access_time:.2f}ms")
            return orders
            
        except Exception as e:
            print(f"❌ Database error: {e}")
            self._stats["order_misses"] += 1
            return []
    
    async def get_orders_by_status(self, org_id: str, status: str, db=None) -> List[Dict]:
        """Get orders filtered by status with caching"""
        cache_key = f"orders:{org_id}:status:{status}"
        
        if self._is_cache_valid(cache_key):
            orders = self._orders_by_status.get(org_id, {}).get(status, [])
            self._stats["order_hits"] += 1
            print(f"✅ Orders by status HIT: {org_id}/{status} ({len(orders)} orders)")
            return orders
        
        try:
            orders = await db.orders.find(
                {"organization_id": org_id, "status": status},
                {"_id": 0}
            ).sort("created_at", -1).to_list(None)
            
            # Cache
            if org_id not in self._orders_by_status:
                self._orders_by_status[org_id] = {}
            self._orders_by_status[org_id][status] = orders
            self._cache_expiry[cache_key] = time.time() + self.ORDER_CACHE_TTL
            
            print(f"📊 Orders by status FETCH: {org_id}/{status} ({len(orders)} orders)")
            return orders
            
        except Exception as e:
            print(f"❌ Error: {e}")
            self._stats["order_misses"] += 1
            return []
    
    async def get_order_by_id(self, order_id: str, org_id: str, db=None) -> Optional[Dict]:
        """Get single order with caching"""
        cache_key = f"order:{order_id}"
        
        if cache_key in self._order_by_id:
            order = self._order_by_id[cache_key]
            if self._is_cache_valid(cache_key):
                self._stats["order_hits"] += 1
                print(f"✅ Order HIT: {order_id}")
                return order
            else:
                del self._order_by_id[cache_key]
        
        try:
            order = await db.orders.find_one(
                {"id": order_id, "organization_id": org_id},
                {"_id": 0}
            )
            
            if order:
                self._order_by_id[cache_key] = order
                self._cache_expiry[cache_key] = time.time() + self.ORDER_CACHE_TTL
                print(f"📊 Order FETCH: {order_id}")
            
            return order
            
        except Exception as e:
            print(f"❌ Error: {e}")
            self._stats["order_misses"] += 1
            return None
    
    async def get_orders_paginated(self, org_id: str, page: int, page_size: int, db=None) -> Tuple[List[Dict], int]:
        """
        Get paginated orders with caching
        """
        cache_key = f"orders:{org_id}:page:{page}:size:{page_size}"
        
        if self._is_cache_valid(cache_key):
            orders = self._orders_by_org.get(f"paginated:{org_id}:{page}:{page_size}", [])
            if orders:
                self._stats["order_hits"] += 1
                print(f"✅ Paginated orders HIT: page {page}")
                return orders, len(orders)
        
        try:
            skip = (page - 1) * page_size
            orders = await db.orders.find(
                {"organization_id": org_id},
                {"_id": 0}
            ).sort("created_at", -1).skip(skip).limit(page_size).to_list(page_size)
            
            # Cache
            cache_id = f"paginated:{org_id}:{page}:{page_size}"
            self._orders_by_org[cache_id] = orders
            self._cache_expiry[cache_key] = time.time() + self.ORDER_CACHE_TTL
            
            return orders, len(orders)
            
        except Exception as e:
            print(f"❌ Error: {e}")
            return [], 0
    
    # ============ BILLING CACHING ============
    
    async def get_customer_balance(self, org_id: str, phone: str, db=None) -> float:
        """
        Get customer balance with ultra-fast caching
        Perfect for billing page display
        """
        start_time = time.time()
        cache_key = f"balance:{org_id}:{phone}"
        
        # Check local cache
        if org_id in self._customer_balances and phone in self._customer_balances[org_id]:
            if self._is_cache_valid(cache_key):
                balance = self._customer_balances[org_id][phone]
                access_time = (time.time() - start_time) * 1000
                self._stats["billing_hits"] += 1
                print(f"✅ Balance HIT: {phone} = {balance} in {access_time:.2f}ms")
                return balance
        
        # Try Redis
        if self.redis_client:
            try:
                redis_data = await self.redis_client.get(cache_key)
                if redis_data:
                    balance = float(redis_data)
                    if org_id not in self._customer_balances:
                        self._customer_balances[org_id] = {}
                    self._customer_balances[org_id][phone] = balance
                    self._cache_expiry[cache_key] = time.time() + self.CUSTOMER_BALANCE_TTL
                    access_time = (time.time() - start_time) * 1000
                    self._stats["billing_hits"] += 1
                    print(f"✅ Balance HIT (Redis): {phone} = {balance} in {access_time:.2f}ms")
                    return balance
            except Exception as e:
                print(f"⚠️ Redis error: {e}")
        
        # Query database
        if not db:
            return 0.0
        
        try:
            customer = await db.customers.find_one(
                {"phone": phone, "organization_id": org_id},
                {"_id": 0, "wallet_balance": 1}
            )
            
            balance = customer.get("wallet_balance", 0.0) if customer else 0.0
            
            # Cache
            if org_id not in self._customer_balances:
                self._customer_balances[org_id] = {}
            self._customer_balances[org_id][phone] = balance
            self._cache_expiry[cache_key] = time.time() + self.CUSTOMER_BALANCE_TTL
            
            if self.redis_client:
                try:
                    await self.redis_client.setex(cache_key, self.CUSTOMER_BALANCE_TTL, str(balance))
                except:
                    pass
            
            access_time = (time.time() - start_time) * 1000
            self._stats["billing_misses"] += 1
            print(f"📊 Balance FETCH: {phone} = {balance} in {access_time:.2f}ms")
            return balance
            
        except Exception as e:
            print(f"❌ Error: {e}")
            self._stats["billing_misses"] += 1
            return 0.0
    
    async def get_billing_summary(self, org_id: str, db=None) -> Dict[str, Any]:
        """
        Get billing summary (totals, statistics) with caching
        Used for dashboard display
        """
        cache_key = f"billing_summary:{org_id}"
        
        if self._is_cache_valid(cache_key):
            summary = self._billing_summaries.get(org_id)
            if summary:
                self._stats["billing_hits"] += 1
                print(f"✅ Billing summary HIT")
                return summary
        
        try:
            # Get today's totals
            today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            
            completed_orders = await db.orders.find(
                {
                    "organization_id": org_id,
                    "status": "completed",
                    "created_at": {"$gte": today}
                },
                {"_id": 0, "total_amount": 1}
            ).to_list(None)
            
            total_revenue = sum(order.get("total_amount", 0) for order in completed_orders)
            orders_count = len(completed_orders)
            
            summary = {
                "total_revenue": total_revenue,
                "orders_count": orders_count,
                "avg_order_value": total_revenue / orders_count if orders_count > 0 else 0,
                "last_updated": datetime.now().isoformat()
            }
            
            # Cache
            self._billing_summaries[org_id] = summary
            self._cache_expiry[cache_key] = time.time() + self.BILLING_CACHE_TTL
            
            self._stats["billing_misses"] += 1
            print(f"📊 Billing summary computed: {total_revenue} from {orders_count} orders")
            return summary
            
        except Exception as e:
            print(f"❌ Error: {e}")
            return {"total_revenue": 0, "orders_count": 0, "avg_order_value": 0}
    
    async def calculate_bill_total(self, org_id: str, order_id: str, db=None) -> Dict[str, float]:
        """
        Calculate bill total with caching
        Includes subtotal, tax, discount, final total
        """
        cache_key = f"bill_total:{order_id}"
        
        if self._is_cache_valid(cache_key):
            if cache_key in self._billing_summaries:
                self._stats["billing_hits"] += 1
                return self._billing_summaries[cache_key]
        
        try:
            order = await db.orders.find_one(
                {"id": order_id, "organization_id": org_id},
                {"_id": 0}
            )
            
            if not order:
                return {"subtotal": 0, "tax": 0, "discount": 0, "total": 0}
            
            items = order.get("items", [])
            subtotal = sum(item.get("price", 0) * item.get("quantity", 0) for item in items)
            discount = order.get("discount", 0)
            tax_rate = order.get("tax_rate", 0) / 100
            tax = (subtotal - discount) * tax_rate
            total = subtotal - discount + tax
            
            bill_data = {
                "subtotal": round(subtotal, 2),
                "discount": round(discount, 2),
                "tax": round(tax, 2),
                "total": round(total, 2)
            }
            
            self._billing_summaries[cache_key] = bill_data
            self._cache_expiry[cache_key] = time.time() + self.BILLING_CACHE_TTL
            
            self._stats["billing_misses"] += 1
            print(f"📊 Bill total computed: {bill_data}")
            return bill_data
            
        except Exception as e:
            print(f"❌ Error: {e}")
            return {"subtotal": 0, "tax": 0, "discount": 0, "total": 0}
    
    # ============ CACHE INVALIDATION ============
    
    async def invalidate_order_cache(self, org_id: str, order_id: str = None):
        """Invalidate order cache when state changes"""
        # Invalidate specific order
        if order_id:
            cache_key = f"order:{order_id}"
            if cache_key in self._order_by_id:
                del self._order_by_id[cache_key]
            if cache_key in self._cache_expiry:
                del self._cache_expiry[cache_key]
            
            # Also invalidate billing cache for this order
            bill_cache_key = f"bill_total:{order_id}"
            if bill_cache_key in self._billing_summaries:
                del self._billing_summaries[bill_cache_key]
        
        # Invalidate organization's active orders
        cache_key = f"active_orders:{org_id}"
        if org_id in self._orders_by_org:
            del self._orders_by_org[org_id]
        if cache_key in self._cache_expiry:
            del self._cache_expiry[cache_key]
        
        # Invalidate all status caches for org
        if org_id in self._orders_by_status:
            del self._orders_by_status[org_id]
        
        self._stats["invalidations"] += 1
        print(f"🗑️ Order cache invalidated for {org_id}/{order_id if order_id else 'all'}")
    
    async def invalidate_billing_cache(self, org_id: str):
        """Invalidate billing caches"""
        if org_id in self._billing_summaries:
            del self._billing_summaries[org_id]
        if org_id in self._customer_balances:
            del self._customer_balances[org_id]
        
        self._stats["invalidations"] += 1
        print(f"🗑️ Billing cache invalidated for {org_id}")
    
    async def invalidate_customer_balance(self, org_id: str, phone: str):
        """Invalidate customer balance cache after transaction"""
        cache_key = f"balance:{org_id}:{phone}"
        if org_id in self._customer_balances and phone in self._customer_balances[org_id]:
            del self._customer_balances[org_id][phone]
        if cache_key in self._cache_expiry:
            del self._cache_expiry[cache_key]
        
        print(f"🗑️ Balance cache invalidated for {phone}")
    
    # ============ UTILITIES ============
    
    def _is_cache_valid(self, cache_key: str) -> bool:
        """Check if cache entry is still valid (not expired)"""
        if cache_key not in self._cache_expiry:
            return False
        return time.time() < self._cache_expiry[cache_key]
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        total_order_ops = self._stats["order_hits"] + self._stats["order_misses"]
        total_billing_ops = self._stats["billing_hits"] + self._stats["billing_misses"]
        
        return {
            "order_cache": {
                "hits": self._stats["order_hits"],
                "misses": self._stats["order_misses"],
                "hit_rate": f"{(self._stats['order_hits'] / total_order_ops * 100) if total_order_ops > 0 else 0:.2f}%",
                "cached_org_orders": len(self._orders_by_org),
                "cached_individual_orders": len(self._order_by_id)
            },
            "billing_cache": {
                "hits": self._stats["billing_hits"],
                "misses": self._stats["billing_misses"],
                "hit_rate": f"{(self._stats['billing_hits'] / total_billing_ops * 100) if total_billing_ops > 0 else 0:.2f}%",
                "cached_balances": sum(len(balances) for balances in self._customer_balances.values()),
                "cached_summaries": len(self._billing_summaries)
            },
            "invalidations": self._stats["invalidations"],
            "total_cache_entries": len(self._cache_expiry)
        }
    
    def clear_all(self):
        """Clear all caches"""
        self._orders_by_org.clear()
        self._order_by_id.clear()
        self._orders_by_status.clear()
        self._customer_balances.clear()
        self._billing_summaries.clear()
        self._cache_expiry.clear()
        print("🗑️ All caches cleared")


# Global instance
_order_fast_access_cache: Optional[OrderFastAccessCache] = None

async def init_order_fast_access_cache(redis_client=None) -> OrderFastAccessCache:
    """Initialize order fast access cache"""
    global _order_fast_access_cache
    
    _order_fast_access_cache = OrderFastAccessCache()
    if redis_client:
        await _order_fast_access_cache.set_redis_client(redis_client)
    
    print("✅ Order fast access cache initialized")
    return _order_fast_access_cache

def get_order_fast_access_cache() -> Optional[OrderFastAccessCache]:
    """Get the global order fast access cache instance"""
    return _order_fast_access_cache
