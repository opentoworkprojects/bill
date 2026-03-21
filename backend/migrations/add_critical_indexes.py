"""
Critical Performance Migration: Missing indexes causing full collection scans.

Priority fixes:
1. users.id          — get_current_user() hits this on EVERY authenticated request
2. users.id+role     — check_subscription() hits this on every staff request
3. orders.id         — every find_one({"id": order_id}) is a full scan
4. orders.org+status+created_at — active orders query (most frequent orders query)
5. orders.org+id     — order detail lookup
6. referral_code     — exact match index (replaces slow $regex)
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()


async def _safe_create(collection, keys, name, **kwargs):
    try:
        result = await collection.create_index(keys, name=name, **kwargs)
        print(f"  ✅ {name}")
        return result
    except Exception as e:
        if "already exists" in str(e).lower() or "IndexOptionsConflict" in str(e):
            print(f"  ℹ️  {name} already exists")
        else:
            print(f"  ❌ {name} FAILED: {e}")
            raise


async def run():
    client = AsyncIOMotorClient(os.getenv("MONGO_URL"))
    db = client[os.getenv("DB_NAME", "restrobill")]

    try:
        # ── USERS (critical — hit on every request) ───────────────────────────
        print("\n🔧 users — critical auth indexes")

        # get_current_user: find_one({"id": user_id})  ← EVERY request
        await _safe_create(db.users, [("id", 1)], "idx_users_id_unique", unique=True)

        # check_subscription: find_one({"id": org_id, "role": "admin"})
        await _safe_create(db.users, [("id", 1), ("role", 1)], "idx_users_id_role")

        # login: find_one({"username_lower": ...})
        await _safe_create(db.users, [("username_lower", 1)], "idx_users_username_lower", sparse=True)

        # login fallback + password reset: find_one({"email": ...})
        await _safe_create(db.users, [("email", 1)], "idx_users_email_unique", unique=True, sparse=True)

        # referral: exact match (replaces $regex which can't use index)
        await _safe_create(db.users, [("referral_code", 1)], "idx_users_referral_code", sparse=True)

        # staff listing: find({"organization_id": ...})
        await _safe_create(db.users, [("organization_id", 1)], "idx_users_org_id", sparse=True)

        # ── ORDERS (most queried collection) ──────────────────────────────────
        print("\n🔧 orders — query pattern indexes")

        # find_one({"id": order_id, "organization_id": ...})  ← every order detail
        await _safe_create(db.orders, [("id", 1), ("organization_id", 1)], "idx_orders_id_org")

        # Active orders: find({"organization_id": ..., "status": {$nin: [...]}})
        # Most frequent query — kitchen, orders page, counter sale
        await _safe_create(
            db.orders,
            [("organization_id", 1), ("status", 1), ("created_at", -1)],
            "idx_orders_org_status_created"
        )

        # Today's bills / reports: find({"organization_id": ..., "created_at": {$gte: ...}})
        await _safe_create(
            db.orders,
            [("organization_id", 1), ("created_at", -1)],
            "idx_orders_org_created"
        )

        # Completed orders for reports: find({"organization_id": ..., "status": "completed", "created_at": ...})
        await _safe_create(
            db.orders,
            [("organization_id", 1), ("status", 1), ("created_at", -1), ("total_amount", 1)],
            "idx_orders_org_status_created_total"
        )

        # Credit orders: find({"organization_id": ..., "is_credit": true, "balance_amount": {$gt: 0}})
        await _safe_create(
            db.orders,
            [("organization_id", 1), ("is_credit", 1), ("balance_amount", 1)],
            "idx_orders_org_credit_balance",
            sparse=True
        )

        # Duplicate check: find({"organization_id": ..., "table_id": ..., "created_at": {$gte: ...}})
        await _safe_create(
            db.orders,
            [("organization_id", 1), ("table_id", 1), ("created_at", -1)],
            "idx_orders_org_table_created"
        )

        # Invoice number lookup (sparse — not all orders have invoice numbers)
        await _safe_create(
            db.orders,
            [("invoice_number", 1)],
            "idx_orders_invoice_number",
            sparse=True
        )

        # ── MENU ITEMS ────────────────────────────────────────────────────────
        print("\n🔧 menu_items")

        await _safe_create(db.menu_items, [("organization_id", 1)], "idx_menu_org")
        await _safe_create(
            db.menu_items,
            [("organization_id", 1), ("available", 1)],
            "idx_menu_org_available"
        )
        await _safe_create(
            db.menu_items,
            [("id", 1), ("organization_id", 1)],
            "idx_menu_id_org"
        )

        # ── TABLES ────────────────────────────────────────────────────────────
        print("\n🔧 tables")

        await _safe_create(db.tables, [("organization_id", 1)], "idx_tables_org")
        await _safe_create(
            db.tables,
            [("id", 1), ("organization_id", 1)],
            "idx_tables_id_org"
        )
        await _safe_create(
            db.tables,
            [("organization_id", 1), ("table_number", 1)],
            "idx_tables_org_number"
        )

        # ── INVENTORY ─────────────────────────────────────────────────────────
        print("\n🔧 inventory")

        await _safe_create(db.inventory, [("organization_id", 1)], "idx_inventory_org")
        await _safe_create(
            db.inventory,
            [("id", 1), ("organization_id", 1)],
            "idx_inventory_id_org"
        )

        # ── SUMMARY ───────────────────────────────────────────────────────────
        print("\n📊 Index counts after migration:")
        for coll_name in ("users", "orders", "menu_items", "tables", "inventory"):
            indexes = await db[coll_name].list_indexes().to_list(None)
            print(f"  {coll_name}: {len(indexes)} indexes")

        print("\n✅ Critical index migration complete!")

    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(run())
