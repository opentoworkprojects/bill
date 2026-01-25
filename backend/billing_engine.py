"""
Ultra-Fast Billing Engine
=========================

Instant billing calculations with parallel processing
Pre-computed totals, cached tax rates, optimized discount logic

PERFORMANCE TARGETS:
- Bill calculation: <20ms
- Tax computation: <5ms
- Discount application: <3ms
- Total throughput: 1000+ bills/second
"""

import asyncio
from typing import Dict, List, Optional, Tuple
from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime
import time


class BillingEngine:
    """
    High-performance billing calculation engine
    
    Features:
    - Parallel tax/discount calculations
    - Pre-computed item totals
    - Cached tax rates
    - Optimized rounding
    """
    
    def __init__(self):
        # Tax rate cache (org_id -> tax_rate)
        self.tax_rate_cache: Dict[str, float] = {}
        
        # Statistics
        self.stats = {
            "calculations": 0,
            "avg_time_ms": 0,
            "cache_hits": 0,
            "cache_misses": 0
        }
    
    def _get_decimal(self, value: float) -> Decimal:
        """Convert float to Decimal for precise calculations"""
        return Decimal(str(value))
    
    def _round_currency(self, value: Decimal) -> float:
        """Round to 2 decimal places"""
        return float(value.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
    
    async def calculate_item_total(self, price: float, quantity: int) -> float:
        """Calculate item total (price * quantity)"""
        return self._round_currency(self._get_decimal(price) * quantity)
    
    async def calculate_subtotal(self, items: List[Dict]) -> float:
        """
        Calculate subtotal from items
        Parallel processing for large orders
        """
        if not items:
            return 0.0
        
        # For small orders, calculate directly
        if len(items) <= 10:
            subtotal = sum(
                item.get('price', 0) * item.get('quantity', 0) 
                for item in items
            )
            return self._round_currency(self._get_decimal(subtotal))
        
        # For large orders, use parallel processing
        async def calc_item(item):
            return await self.calculate_item_total(
                item.get('price', 0), 
                item.get('quantity', 0)
            )
        
        item_totals = await asyncio.gather(*[calc_item(item) for item in items])
        subtotal = sum(item_totals)
        
        return self._round_currency(self._get_decimal(subtotal))
    
    async def get_tax_rate(self, org_id: str, db=None) -> float:
        """
        Get tax rate with caching
        
        Args:
            org_id: Organization ID
            db: Database connection (for cache miss)
        
        Returns:
            Tax rate as decimal (e.g., 0.05 for 5%)
        """
        # Check cache
        if org_id in self.tax_rate_cache:
            self.stats["cache_hits"] += 1
            return self.tax_rate_cache[org_id]
        
        # Cache miss - fetch from database
        self.stats["cache_misses"] += 1
        
        if db:
            try:
                user = await db.users.find_one(
                    {"id": org_id},
                    {"_id": 0, "business_settings.tax_rate": 1}
                )
                
                tax_rate = 5.0  # Default
                if user and user.get("business_settings"):
                    tax_rate = user["business_settings"].get("tax_rate", 5.0)
                
                # Cache for future use
                self.tax_rate_cache[org_id] = tax_rate / 100
                return tax_rate / 100
                
            except Exception as e:
                print(f"⚠️ Error fetching tax rate: {e}")
        
        # Default fallback
        return 0.05  # 5%
    
    async def calculate_tax(self, subtotal: float, tax_rate: float) -> float:
        """Calculate tax amount"""
        tax = self._get_decimal(subtotal) * self._get_decimal(tax_rate)
        return self._round_currency(tax)
    
    async def apply_discount(
        self, 
        subtotal: float, 
        discount_type: str = "amount",
        discount_value: float = 0
    ) -> Tuple[float, float]:
        """
        Apply discount to subtotal
        
        Args:
            subtotal: Subtotal amount
            discount_type: "amount" or "percentage"
            discount_value: Discount value
        
        Returns:
            (discount_amount, subtotal_after_discount)
        """
        if discount_value <= 0:
            return 0.0, subtotal
        
        subtotal_decimal = self._get_decimal(subtotal)
        
        if discount_type == "percentage":
            # Percentage discount
            discount_amount = subtotal_decimal * (self._get_decimal(discount_value) / 100)
        else:
            # Fixed amount discount
            discount_amount = self._get_decimal(discount_value)
        
        # Ensure discount doesn't exceed subtotal
        discount_amount = min(discount_amount, subtotal_decimal)
        
        subtotal_after_discount = subtotal_decimal - discount_amount
        
        return (
            self._round_currency(discount_amount),
            self._round_currency(subtotal_after_discount)
        )
    
    async def calculate_bill(
        self,
        items: List[Dict],
        org_id: str,
        discount_type: str = "amount",
        discount_value: float = 0,
        tax_rate: Optional[float] = None,
        db=None
    ) -> Dict:
        """
        Complete bill calculation with all components
        
        Args:
            items: List of order items
            org_id: Organization ID
            discount_type: "amount" or "percentage"
            discount_value: Discount value
            tax_rate: Tax rate (if None, fetched from cache/db)
            db: Database connection
        
        Returns:
            Complete bill breakdown
        """
        start_time = time.time()
        
        # Step 1: Calculate subtotal (parallel for large orders)
        subtotal = await self.calculate_subtotal(items)
        
        # Step 2: Apply discount
        discount_amount, subtotal_after_discount = await self.apply_discount(
            subtotal, discount_type, discount_value
        )
        
        # Step 3: Get tax rate (cached)
        if tax_rate is None:
            tax_rate = await self.get_tax_rate(org_id, db)
        
        # Step 4: Calculate tax on discounted amount
        tax = await self.calculate_tax(subtotal_after_discount, tax_rate)
        
        # Step 5: Calculate total
        total = self._round_currency(
            self._get_decimal(subtotal_after_discount) + self._get_decimal(tax)
        )
        
        # Update statistics
        elapsed_ms = (time.time() - start_time) * 1000
        self.stats["calculations"] += 1
        
        # Update average time (exponential moving average)
        alpha = 0.1
        current_avg = self.stats["avg_time_ms"]
        self.stats["avg_time_ms"] = (alpha * elapsed_ms) + ((1 - alpha) * current_avg)
        
        return {
            "subtotal": subtotal,
            "discount_type": discount_type,
            "discount_value": discount_value,
            "discount_amount": discount_amount,
            "subtotal_after_discount": subtotal_after_discount,
            "tax_rate": tax_rate,
            "tax_rate_percent": tax_rate * 100,
            "tax": tax,
            "total": total,
            "calculation_time_ms": round(elapsed_ms, 2)
        }
    
    async def calculate_split_payment(
        self,
        total: float,
        cash: float = 0,
        card: float = 0,
        upi: float = 0,
        credit: float = 0
    ) -> Dict:
        """
        Calculate split payment breakdown
        
        Returns:
            Payment breakdown with balance
        """
        total_decimal = self._get_decimal(total)
        
        payment_received = (
            self._get_decimal(cash) +
            self._get_decimal(card) +
            self._get_decimal(upi)
        )
        
        balance = total_decimal - payment_received
        
        # If credit amount provided, validate
        if credit > 0:
            credit_decimal = self._get_decimal(credit)
            if credit_decimal != balance:
                print(f"⚠️ Credit amount mismatch: expected {balance}, got {credit}")
        
        return {
            "total": self._round_currency(total_decimal),
            "cash_amount": self._round_currency(self._get_decimal(cash)),
            "card_amount": self._round_currency(self._get_decimal(card)),
            "upi_amount": self._round_currency(self._get_decimal(upi)),
            "credit_amount": self._round_currency(balance if balance > 0 else Decimal(0)),
            "payment_received": self._round_currency(payment_received),
            "balance_amount": self._round_currency(balance if balance > 0 else Decimal(0)),
            "is_credit": balance > 0,
            "is_fully_paid": balance <= 0
        }
    
    def invalidate_tax_cache(self, org_id: Optional[str] = None):
        """Invalidate tax rate cache"""
        if org_id:
            self.tax_rate_cache.pop(org_id, None)
        else:
            self.tax_rate_cache.clear()
    
    def get_stats(self) -> Dict:
        """Get billing engine statistics"""
        total_cache_ops = self.stats["cache_hits"] + self.stats["cache_misses"]
        cache_hit_rate = (
            (self.stats["cache_hits"] / total_cache_ops * 100) 
            if total_cache_ops > 0 else 0
        )
        
        return {
            **self.stats,
            "cache_hit_rate": f"{cache_hit_rate:.2f}%",
            "cached_tax_rates": len(self.tax_rate_cache)
        }


# Global instance
_billing_engine: Optional[BillingEngine] = None


def init_billing_engine() -> BillingEngine:
    """Initialize billing engine"""
    global _billing_engine
    _billing_engine = BillingEngine()
    print("✅ Billing engine initialized")
    return _billing_engine


def get_billing_engine() -> Optional[BillingEngine]:
    """Get the global billing engine instance"""
    return _billing_engine


# Convenience function for quick calculations
async def calculate_order_bill(
    items: List[Dict],
    org_id: str,
    discount_type: str = "amount",
    discount_value: float = 0,
    db=None
) -> Dict:
    """
    Quick bill calculation
    
    Usage:
        bill = await calculate_order_bill(
            items=[{"price": 100, "quantity": 2}, {"price": 50, "quantity": 1}],
            org_id="org123",
            discount_type="percentage",
            discount_value=10
        )
    """
    engine = get_billing_engine()
    if not engine:
        engine = init_billing_engine()
    
    return await engine.calculate_bill(
        items=items,
        org_id=org_id,
        discount_type=discount_type,
        discount_value=discount_value,
        db=db
    )
