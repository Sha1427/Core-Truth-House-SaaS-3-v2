"""Core routes: root, users, onboarding, lightweight public endpoints.

Clean rebuild notes:
- removes broken `from models import ...` dependency
- removes duplicate /api/workspaces* routes so tenant.py is the canonical workspace API
- keeps root, users, onboarding, public affiliate links, preloaded prompts, and user plan
"""

from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.database import get_db

router = APIRouter(prefix="/api")

# =========================================================
# LOCAL SCHEMAS
# =========================================================

def _utc_now() -> datetime:
    return datetime.now(timezone.utc)

def _utc_now_iso() -> str:
    return _utc_now().isoformat()

def _require_db() -> Any:
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    return db

class UserCreate(BaseModel):
    email: str
    first_name: Optional[str] = ""
    last_name: Optional[str] = ""
    plan: str = "FOUNDATION"

class User(BaseModel):
    id: str
    email: str
    first_name: Optional[str] = ""
    last_name: Optional[str] = ""
    plan: str = "FOUNDATION"
    created_at: datetime = Field(default_factory=_utc_now)

class OnboardingData(BaseModel):
    business_name: Optional[str] = None
    business_type: Optional[str] = None
    niche: Optional[str] = None
    audience: Optional[str] = None
    goals: Optional[list[str]] = None
    notes: Optional[str] = None

# =========================================================
# ROOT
# =========================================================

@router.get("/")
async def root():
    return {"message": "Core Truth House API", "version": "1.0.0"}

# =========================================================
# USERS
# =========================================================

@router.post("/users", response_model=User)
async def create_user(data: UserCreate):
    database = _require_db()

    user = User(
        id=str(uuid.uuid4()),
        email=data.email,
        first_name=data.first_name or "",
        last_name=data.last_name or "",
        plan=data.plan or "FOUNDATION",
    )

    doc = user.model_dump()
    doc["created_at"] = user.created_at.isoformat()

    await database.users.insert_one(doc)
    return user

@router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    database = _require_db()

    user = await database.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    created_at = user.get("created_at")
    if isinstance(created_at, str):
        user["created_at"] = datetime.fromisoformat(created_at)

    return User(**user)

# =========================================================
# PLAN / ROLE
# =========================================================

SUPER_ADMIN_CLERK_ID = os.environ.get("SUPER_ADMIN_CLERK_ID", "").strip()
SUPER_ADMIN_EMAIL = os.environ.get("SUPER_ADMIN_EMAIL", "").strip()

@router.get("/user/plan")
async def get_user_plan(user_id: str = "default"):
    """Return the user's subscription plan and admin status."""
    database = _require_db()

    if user_id == "dev_user_default":
        return {
            "plan": "ESTATE",
            "is_super_admin": True,
            "user_id": user_id,
            "role": "SUPER_ADMIN",
        }

    is_super_admin = bool(SUPER_ADMIN_CLERK_ID and user_id == SUPER_ADMIN_CLERK_ID)

    if not is_super_admin and SUPER_ADMIN_EMAIL:
        user_doc = await database.users.find_one({"id": user_id}, {"_id": 0, "email": 1})
        if user_doc and user_doc.get("email", "").lower() == SUPER_ADMIN_EMAIL.lower():
            is_super_admin = True

    user = await database.users.find_one({"id": user_id}, {"_id": 0, "plan": 1})
    plan = user.get("plan", "FOUNDATION") if user else "FOUNDATION"

    return {
        "plan": "ESTATE" if is_super_admin else plan,
        "is_super_admin": is_super_admin,
        "user_id": user_id,
    }

# =========================================================
# PUBLIC STORE / PROMPTS
# =========================================================

@router.get("/store/affiliate-links")
async def get_public_affiliate_links():
    """Public endpoint: get active affiliate links for the store."""
    database = _require_db()
    links = await database.affiliate_links.find({"is_active": True}, {"_id": 0}).to_list(100)
    return {"links": links}

@router.get("/prompts/preloaded")
async def get_preloaded_prompts(user_plan: str = "FOUNDATION"):
    """Get preloaded prompts available for the user's plan."""
    database = _require_db()

    plan_order = {"FOUNDATION": 0, "STRUCTURE": 1, "HOUSE": 2, "ESTATE": 3}
    user_level = plan_order.get(user_plan, 0)

    prompts = await database.preloaded_prompts.find({}, {"_id": 0}).to_list(200)
    accessible = [
        prompt for prompt in prompts
        if plan_order.get(prompt.get("min_plan", "STRUCTURE"), 1) <= user_level
    ]
    return {"prompts": accessible}

# =========================================================
# ONBOARDING
# =========================================================

@router.post("/onboarding")
async def save_onboarding(data: OnboardingData, user_id: str = "default"):
    database = _require_db()

    doc = {
        "user_id": user_id,
        **data.model_dump(),
        "created_at": _utc_now_iso(),
        "updated_at": _utc_now_iso(),
    }

    await database.onboarding.update_one(
        {"user_id": user_id},
        {"$set": doc},
        upsert=True,
    )

    return {"success": True, "message": "Onboarding data saved"}
