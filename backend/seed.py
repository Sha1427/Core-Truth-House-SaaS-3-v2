"""
Seed script for Core Truth House OS — MongoDB equivalent of `npx prisma db seed`.

Promotes your account to SUPER_ADMIN and creates development seed data.

Usage:
  python seed.py                          # Uses SUPER_ADMIN env vars from .env
  python seed.py --clerk-id user_xxx      # Override Clerk ID
  python seed.py --email you@email.com    # Override email
"""
import asyncio
import os
import sys
import uuid
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "cth_db")


async def seed():
    # Parse CLI overrides
    clerk_id = os.environ.get("SUPER_ADMIN_CLERK_ID", "")
    email = os.environ.get("SUPER_ADMIN_EMAIL", "")
    name = os.environ.get("SUPER_ADMIN_NAME", "Super Admin")

    for i, arg in enumerate(sys.argv[1:], 1):
        if arg == "--clerk-id" and i < len(sys.argv) - 1:
            clerk_id = sys.argv[i + 1]
        if arg == "--email" and i < len(sys.argv) - 1:
            email = sys.argv[i + 1]
        if arg == "--name" and i < len(sys.argv) - 1:
            name = sys.argv[i + 1]

    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    now = datetime.now(timezone.utc).isoformat()

    print("\n=== Core Truth House OS — Database Seed ===\n")

    # -------------------------------------------------------
    # 1. Promote / create SUPER_ADMIN user
    # -------------------------------------------------------
    if clerk_id:
        existing = await db.users.find_one({"clerk_id": clerk_id})
        if existing:
            await db.users.update_one(
                {"clerk_id": clerk_id},
                {"$set": {"role": "super_admin", "name": name, "email": email, "updated_at": now}},
            )
            print(f"  PROMOTED existing user to SUPER_ADMIN: {clerk_id}")
        else:
            await db.users.insert_one({
                "id": str(uuid.uuid4()),
                "clerk_id": clerk_id,
                "email": email,
                "name": name,
                "role": "super_admin",
                "plan": "enterprise",
                "created_at": now,
                "updated_at": now,
            })
            print(f"  CREATED SUPER_ADMIN user: {clerk_id} ({email})")
    else:
        print("  SKIP: No SUPER_ADMIN_CLERK_ID set. Add it to .env or pass --clerk-id user_xxx")

    # -------------------------------------------------------
    # 2. Default workspace
    # -------------------------------------------------------
    ws_id = str(uuid.uuid4())
    existing_ws = await db.workspaces.find_one({"name": "Core Truth House"})
    if not existing_ws:
        await db.workspaces.insert_one({
            "id": ws_id,
            "name": "Core Truth House",
            "owner_id": clerk_id or "seed",
            "plan": "enterprise",
            "created_at": now,
        })
        print(f"  CREATED workspace: Core Truth House ({ws_id})")
    else:
        ws_id = existing_ws.get("id", ws_id)
        print(f"  SKIP: Workspace 'Core Truth House' already exists")

    user_id = clerk_id or "seed"

    # -------------------------------------------------------
    # 3. CRM Seed Data
    # -------------------------------------------------------
    crm_count = await db.crm_contacts.count_documents({"user_id": user_id})
    if crm_count == 0:
        contacts = [
            {"id": str(uuid.uuid4()), "user_id": user_id, "name": "Alex Rivera", "email": "alex@example.com", "phone": "+1-555-0101", "company": "BrandCraft Agency", "status": "customer", "notes": "VIP client, quarterly strategy sessions", "created_at": now},
            {"id": str(uuid.uuid4()), "user_id": user_id, "name": "Jordan Lee", "email": "jordan@example.com", "phone": "+1-555-0102", "company": "StartupScale Inc", "status": "prospect", "notes": "Interested in enterprise plan", "created_at": now},
            {"id": str(uuid.uuid4()), "user_id": user_id, "name": "Sam Chen", "email": "sam@example.com", "phone": "+1-555-0103", "company": "PixelPerfect Studio", "status": "lead", "notes": "Inbound from landing page", "created_at": now},
        ]
        await db.crm_contacts.insert_many(contacts)

        companies = [
            {"id": str(uuid.uuid4()), "user_id": user_id, "name": "BrandCraft Agency", "industry": "Marketing", "size": "50-100", "website": "https://brandcraft.example.com", "created_at": now},
            {"id": str(uuid.uuid4()), "user_id": user_id, "name": "StartupScale Inc", "industry": "SaaS", "size": "10-50", "website": "https://startupscale.example.com", "created_at": now},
        ]
        await db.crm_companies.insert_many(companies)

        deals = [
            {"id": str(uuid.uuid4()), "user_id": user_id, "title": "BrandCraft Annual Renewal", "value": 24000, "stage": "negotiation", "probability": 80, "contact_name": "Alex Rivera", "notes": "Renewing for 2026", "created_at": now},
            {"id": str(uuid.uuid4()), "user_id": user_id, "title": "StartupScale Onboarding", "value": 12000, "stage": "proposal", "probability": 50, "contact_name": "Jordan Lee", "notes": "Custom enterprise setup", "created_at": now},
            {"id": str(uuid.uuid4()), "user_id": user_id, "title": "PixelPerfect Brand Audit", "value": 5000, "stage": "lead", "probability": 20, "contact_name": "Sam Chen", "notes": "Initial brand audit", "created_at": now},
        ]
        await db.crm_deals.insert_many(deals)
        print(f"  CREATED CRM seed: {len(contacts)} contacts, {len(companies)} companies, {len(deals)} deals")
    else:
        print(f"  SKIP: CRM data already exists ({crm_count} contacts)")

    # -------------------------------------------------------
    # 4. Blog Seed Data
    # -------------------------------------------------------
    blog_count = await db.blog_articles.count_documents({"user_id": user_id})
    if blog_count == 0:
        articles = [
            {
                "id": str(uuid.uuid4()), "user_id": user_id,
                "title": "Why Your Brand Needs a Core Truth", "slug": "why-your-brand-needs-a-core-truth",
                "content": "Every iconic brand is built on a fundamental truth — something that goes beyond products and services. This core truth becomes the foundation for every decision, every piece of content, and every interaction your brand has with the world.\n\nWithout it, you're building on sand.",
                "excerpt": "Every iconic brand is built on a fundamental truth. Here's how to find yours.",
                "status": "published", "published_at": now,
                "tags": ["brand-strategy", "foundations"], "seo_title": "Why Your Brand Needs a Core Truth | Core Truth House",
                "seo_description": "Discover why every iconic brand starts with a core truth and how to uncover yours.",
                "word_count": 450, "reading_time": 2, "author_name": name, "created_at": now,
            },
            {
                "id": str(uuid.uuid4()), "user_id": user_id,
                "title": "The 5-Step Brand Foundation Framework", "slug": "5-step-brand-foundation-framework",
                "content": "Building a brand isn't about picking colors and fonts. It's about establishing the strategic infrastructure that makes every tactical decision easier and more effective.\n\nHere are the five steps every founder should follow.",
                "excerpt": "A proven framework for building brand foundations that actually work.",
                "status": "draft", "tags": ["frameworks", "brand-building"],
                "word_count": 800, "reading_time": 4, "author_name": name, "created_at": now,
            },
        ]
        await db.blog_articles.insert_many(articles)
        print(f"  CREATED Blog seed: {len(articles)} articles (1 published, 1 draft)")
    else:
        print(f"  SKIP: Blog data already exists ({blog_count} articles)")

    # -------------------------------------------------------
    # 5. Calendar Seed Data
    # -------------------------------------------------------
    cal_count = await db.calendar_events.count_documents({"user_id": user_id})
    if cal_count == 0:
        base = datetime.now(timezone.utc)
        events = [
            {"id": str(uuid.uuid4()), "user_id": user_id, "title": "Weekly Strategy Review", "category": "meeting", "color": "#e04e35", "start_time": (base + timedelta(days=1, hours=10)).isoformat(), "end_time": (base + timedelta(days=1, hours=11)).isoformat(), "description": "Review brand metrics and pipeline", "created_at": now},
            {"id": str(uuid.uuid4()), "user_id": user_id, "title": "Blog Post Deadline", "category": "deadline", "color": "#ef4444", "start_time": (base + timedelta(days=3)).isoformat(), "end_time": None, "description": "Publish the brand foundation article", "created_at": now},
            {"id": str(uuid.uuid4()), "user_id": user_id, "title": "Social Media Batch", "category": "content", "color": "#763b5b", "start_time": (base + timedelta(days=2, hours=14)).isoformat(), "end_time": (base + timedelta(days=2, hours=16)).isoformat(), "description": "Create and schedule week's social content", "created_at": now},
            {"id": str(uuid.uuid4()), "user_id": user_id, "title": "Client Call — BrandCraft", "category": "meeting", "color": "#e04e35", "start_time": (base + timedelta(days=5, hours=9)).isoformat(), "end_time": (base + timedelta(days=5, hours=10)).isoformat(), "description": "Quarterly brand review with Alex", "created_at": now},
        ]
        await db.calendar_events.insert_many(events)
        print(f"  CREATED Calendar seed: {len(events)} events")
    else:
        print(f"  SKIP: Calendar data already exists ({cal_count} events)")

    # -------------------------------------------------------
    # 6. Social Media Seed Data
    # -------------------------------------------------------
    social_count = await db.social_posts.count_documents({"user_id": user_id})
    if social_count == 0:
        posts = [
            {"id": str(uuid.uuid4()), "user_id": user_id, "platform": "linkedin", "content": "Your brand isn't what you say it is. It's the system behind what you say. Build the infrastructure first, then the message follows.", "hashtags": ["branding", "strategy", "entrepreneurship"], "status": "published", "scheduled_for": now, "published_at": now, "created_at": now},
            {"id": str(uuid.uuid4()), "user_id": user_id, "platform": "twitter", "content": "Stop guessing. Start building. Your brand deserves a system, not a template.", "hashtags": ["brandbuilding", "coretruth"], "status": "scheduled", "scheduled_for": (base + timedelta(days=2, hours=9)).isoformat(), "created_at": now},
            {"id": str(uuid.uuid4()), "user_id": user_id, "platform": "instagram", "content": "Behind every iconic brand is a core truth that never wavers. What's yours?\n\nWe built Core Truth House because we believe every founder deserves the tools to build something that lasts.", "hashtags": ["coretruthhouse", "brandidentity", "founderlife", "brandstrategy"], "status": "draft", "created_at": now},
        ]
        await db.social_posts.insert_many(posts)
        print(f"  CREATED Social seed: {len(posts)} posts")
    else:
        print(f"  SKIP: Social data already exists ({social_count} posts)")

    # -------------------------------------------------------
    # 7. Digest Preferences
    # -------------------------------------------------------
    if clerk_id:
        await db.digest_preferences.update_one(
            {"user_id": user_id},
            {"$set": {
                "user_id": user_id, "enabled": True, "email": email,
                "day_of_week": "monday", "include_events": True,
                "include_blog": True, "include_crm": True, "include_usage": True,
                "user_name": name, "updated_at": now,
            }},
            upsert=True,
        )
        print(f"  CONFIGURED digest preferences for {email}")

    # -------------------------------------------------------
    # Done
    # -------------------------------------------------------
    print(f"\n=== Seed complete ===")
    if clerk_id:
        print(f"  Super Admin: {name} ({clerk_id})")
        print(f"  Email: {email}")
    else:
        print(f"  NOTE: Set SUPER_ADMIN_CLERK_ID in .env to lock down admin access.")
    print(f"  Database: {DB_NAME}")
    print()

    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
