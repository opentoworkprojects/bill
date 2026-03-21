"""
Database Migration: Add indexes for users, menu_items, tables, and inventory collections.

Targets the most frequent query patterns observed in server.py:

users:
  - Login by username_lower / email_lower (most frequent path)
  - Regex fallback on username / email (older records)
  - Lookup by id (JWT auth on every request)
  - Lookup by organization_id (staff listing)
  - Lookup by referral_code (signup / referral reward)
  - Lookup by email (password reset, super-admin checks)

menu_items:
  - List all items for org (menu page, reports, AI)
  - List available items for org (self-order, public menu)
  - Find by id + org (update / delete)
  - Find by name + org (reports category lookup)

tables:
  - List all tables for org
  - Find by id + org
  - Find by table_number + org (self-order)

inventory:
  - List all items for org
  - Find by id + org
  - Find by name + org (CSV import dedup)
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()


async def _safe_create(collection, keys, name, **kwargs):
    """Create an index, silently skip if it already exists."""
    try:
        result = await collection.create_index(keys, name=name, **kwargs)
        print(f"  ✅ {name}")
        return result
    except Exception as e:
        if "already exists" in str(e).lower() or "IndexOptionsConflict" in str(e):
            print(f"  ℹ️  {name} already exists")
        else:
            print(f"  ❌ {name} failed: {e}")
            raise


async def add_collection_indexes():
    mongo_url = os.getenv("MONGO_URL")
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.getenv("DB_NAME", "restrobill")]

    try:
        # ── users ──────────────────────────────────────────────────────────────
        print("\n🔧 users collection")

        # Primary login path (new records store username_lower)
        await _safe_create(db.users, [("username_lower", 1)],
                           "idx_users_username_lower", sparse=True)

        # Primary login path by email_lower
        await _safe_create(db.users, [("email_lower", 1)],
                           "idx_users_email_lower", sparse=True)

        # JWT auth — every authenticated request hits this
        await _safe_create(db.users, [("id", 1)],
                           "idx_users_id")

        # Staff listing + staff lookup by org
        await _safe_create(db.users, [("organization_id", 1)],
                           "idx_users_organization_id", sparse=True)

        # Admin lookup: find admin of an org (very frequent)
        await _safe_create(db.users, [("id", 1), ("role", 1)],
                           "idx_users_id_role")

        # Referral code lookup (signup + reward processing)
        await _safe_create(db.users, [("referral_code", 1)],
                           "idx_users_referral_code", sparse=True)

        # Password reset / super-admin checks by email
        await _safe_create(db.users, [("email", 1)],
                           "idx_users_email")

        # ── menu_items ─────────────────────────────────────────────────────────
        print("\n🔧 menu_items collection")

        # List all items for org (most common query)
        await _safe_create(db.menu_items, [("organization_id", 1)],
                           "idx_menu_org")

        # List available items for org (self-order / public menu)
        await _safe_create(db.menu_items,
                           [("organization_id", 1), ("available", 1)],
                           "idx_menu_org_available")

        # Find by id + org (update / delete)
        await _safe_create(db.menu_items,
                           [("id", 1), ("organization_id", 1)],
                           "idx_menu_id_org")

        # Reports: find by name + org (category lookup in report loops)
        await _safe_create(db.menu_items,
                           [("organization_id", 1), ("name", 1)],
                           "idx_menu_org_name")

        # ── tables ─────────────────────────────────────────────────────────────
        print("\n🔧 tables collection")

        # List all tables for org
        await _safe_create(db.tables, [("organization_id", 1)],
                           "idx_tables_org")

        # Find by id + org
        await _safe_create(db.tables,
                           [("id", 1), ("organization_id", 1)],
                           "idx_tables_id_org")

        # Self-order: find by table_number + org
        await _safe_create(db.tables,
                           [("organization_id", 1), ("table_number", 1)],
                           "idx_tables_org_number")

        # ── inventory ──────────────────────────────────────────────────────────
        print("\n🔧 inventory collection")

        # List all items for org
        await _safe_create(db.inventory, [("organization_id", 1)],
                           "idx_inventory_org")

        # Find by id + org
        await _safe_create(db.inventory,
                           [("id", 1), ("organization_id", 1)],
                           "idx_inventory_id_org")

        # CSV import dedup: find by name + org
        await _safe_create(db.inventory,
                           [("organization_id", 1), ("name", 1)],
                           "idx_inventory_org_name")

        # ── summary ────────────────────────────────────────────────────────────
        print("\n📊 Index summary")
        for coll_name in ("users", "menu_items", "tables", "inventory"):
            coll = db[coll_name]
            indexes = await coll.list_indexes().to_list(None)
            print(f"  {coll_name}: {len(indexes)} indexes")

        print("\n✅ Migration completed successfully!")

    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        raise
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(add_collection_indexes())
