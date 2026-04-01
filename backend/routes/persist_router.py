from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional
import uuid

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from middleware.tenant_dependencies import (
    require_tenant_member,
    require_tenant_admin,
    get_db_from_request,
    stamp_tenant_fields,
)
from middleware.feature_gate import (
    require_feature,
    require_below_monthly_ai_limit,
)

from backend.services.ai import generate_with_ai


router = APIRouter(prefix="/api/persist", tags=["persistence"])


def now() -> datetime:
    return datetime.now(timezone.utc)


def now_iso() -> str:
    return now().isoformat()


def clean(doc: dict[str, Any] | None) -> dict[str, Any]:
    if not doc:
        return {}
    cleaned = dict(doc)
    cleaned.pop("_id", None)
    return cleaned


async def get_current_month_ai_usage(db, workspace_id: str) -> int:
    """
    Placeholder usage reader.

    Replace this with a real monthly usage calculation against your
    ai_usage_logs / usage_events / billing_transactions table later.
    """
    collection_names = set(await db.list_collection_names())

    if "ai_usage_logs" not in collection_names:
        return 0

    current = now()
    month_start = current.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    return await db.ai_usage_logs.count_documents(
        {
            "workspace_id": workspace_id,
            "created_at": {"$gte": month_start.isoformat()},
        }
    )


async def log_ai_usage(
    db,
    *,
    workspace_id: str,
    user_id: str,
    action: str,
    metadata: Optional[dict[str, Any]] = None,
) -> None:
    collection_names = set(await db.list_collection_names())
    if "ai_usage_logs" not in collection_names:
        return

    await db.ai_usage_logs.insert_one(
        {
            "id": str(uuid.uuid4()),
            "workspace_id": workspace_id,
            "user_id": user_id,
            "action": action,
            "metadata": metadata or {},
            "created_at": now_iso(),
        }
    )


def require_valid_step_number(step_number: int) -> None:
    if step_number < 1 or step_number > 9:
        raise HTTPException(status_code=400, detail="Step number must be between 1 and 9")


# =========================================================
# SCHEMAS
# =========================================================

class AIAssistRequest(BaseModel):
    field: str
    current_data: dict[str, Any] = Field(default_factory=dict)


class ContentGenerateRequest(BaseModel):
    content_type: str
    topic: Optional[str] = None
    offer: Optional[str] = None
    tone: Optional[str] = None
    custom_instruction: Optional[str] = None


class ContentSaveRequest(BaseModel):
    content_type: str = "generated"
    title: str = ""
    content: str = ""
    metadata: dict[str, Any] = Field(default_factory=dict)


# =========================================================
# BRAND FOUNDATION
# =========================================================

@router.get("/brand-foundation")
async def get_brand_foundation(request: Request):
    tenant = require_tenant_member(request)
    db = get_db_from_request(request)

    doc = await db.brand_foundation.find_one(
        {"workspace_id": tenant.workspace_id},
        {"_id": 0},
    )
    return doc or {}


@router.post("/brand-foundation")
async def save_brand_foundation(request: Request):
    tenant = require_tenant_admin(request)
    db = get_db_from_request(request)

    body = await request.json()
    body = stamp_tenant_fields(body, tenant)
    body["updated_at"] = now_iso()
    body["updated_by"] = tenant.user_id

    await db.brand_foundation.update_one(
        {"workspace_id": tenant.workspace_id},
        {"$set": body},
        upsert=True,
    )

    return {
        "saved": True,
        "workspace_id": tenant.workspace_id,
        "updated_at": body["updated_at"],
    }


# =========================================================
# AI ASSIST
# =========================================================

@router.post("/brand-foundation/ai-assist")
async def ai_assist(request: Request, payload: AIAssistRequest):
    tenant = require_tenant_member(request)
    db = get_db_from_request(request)

    await require_feature(request, "content_studio")

    current_usage = await get_current_month_ai_usage(db, tenant.workspace_id)
    await require_below_monthly_ai_limit(
        request,
        current_usage=current_usage,
    )

    brand_memory = await db.brand_memory.find_one(
        {"workspace_id": tenant.workspace_id},
        {"_id": 0},
    ) or {}

    prompt = f"""
Brand: {brand_memory.get('brand_name', '')}
Audience: {brand_memory.get('target_audience', '')}
Offer: {brand_memory.get('core_offer', '')}
Voice: {brand_memory.get('voice', '')}
Current Data: {payload.current_data}

Task: Generate content for the field "{payload.field}".
Return only the direct field suggestion.
""".strip()

    result = await generate_with_ai(prompt)

    await log_ai_usage(
        db,
        workspace_id=tenant.workspace_id,
        user_id=tenant.user_id,
        action="brand_foundation_ai_assist",
        metadata={"field": payload.field},
    )

    return {
        "field": payload.field,
        "suggestion": result.strip(),
    }


# =========================================================
# STRATEGIC OS
# =========================================================

@router.get("/strategic-os/progress")
async def get_strategic_os_progress(request: Request):
    tenant = require_tenant_member(request)
    db = get_db_from_request(request)

    steps = await db.strategic_os_steps.find(
        {"workspace_id": tenant.workspace_id},
        {"_id": 0},
    ).to_list(length=20)

    step_map = {step.get("step_number"): step for step in steps}

    progress = [
        {
            "step_number": i,
            "is_complete": bool(step_map.get(i, {}).get("is_complete", False)),
            "updated_at": step_map.get(i, {}).get("updated_at"),
        }
        for i in range(1, 10)
    ]

    return {
        "workspace_id": tenant.workspace_id,
        "steps": progress,
        "total_complete": sum(1 for step in progress if step["is_complete"]),
        "is_locked": all(step["is_complete"] for step in progress),
    }


@router.get("/strategic-os/steps/{step_number}")
async def get_strategic_os_step(step_number: int, request: Request):
    require_valid_step_number(step_number)

    tenant = require_tenant_member(request)
    db = get_db_from_request(request)

    doc = await db.strategic_os_steps.find_one(
        {
            "workspace_id": tenant.workspace_id,
            "step_number": step_number,
        },
        {"_id": 0},
    )

    if not doc:
        return {
            "workspace_id": tenant.workspace_id,
            "step_number": step_number,
            "is_complete": False,
        }

    return doc


@router.post("/strategic-os/steps/{step_number}")
async def save_strategic_os_step(step_number: int, request: Request):
    require_valid_step_number(step_number)

    tenant = require_tenant_member(request)
    db = get_db_from_request(request)

    body = await request.json()
    body = stamp_tenant_fields(body, tenant)
    body["step_number"] = step_number
    body["updated_at"] = now_iso()
    body["updated_by"] = tenant.user_id

    await db.strategic_os_steps.update_one(
        {
            "workspace_id": tenant.workspace_id,
            "step_number": step_number,
        },
        {"$set": body},
        upsert=True,
    )

    return {
        "saved": True,
        "workspace_id": tenant.workspace_id,
        "step_number": step_number,
        "updated_at": body["updated_at"],
    }


@router.post("/strategic-os/lock")
async def lock_strategic_os(request: Request):
    tenant = require_tenant_admin(request)
    db = get_db_from_request(request)

    steps = await db.strategic_os_steps.find(
        {"workspace_id": tenant.workspace_id},
        {"_id": 0},
    ).to_list(length=20)

    step_map = {step.get("step_number"): step for step in steps}

    if not all(step_map.get(i, {}).get("is_complete", False) for i in range(1, 10)):
        raise HTTPException(
            status_code=400,
            detail="All 9 steps must be complete before locking",
        )

    update_doc = {
        "strategic_os_locked": True,
        "workspace_id": tenant.workspace_id,
        "updated_at": now_iso(),
        "updated_by": tenant.user_id,
        "voice": step_map.get(9, {}).get("brand_voice_locked", ""),
        "core_message": step_map.get(9, {}).get("core_message_locked", ""),
        "positioning": step_map.get(3, {}).get("positioning_statement", ""),
        "target_audience": step_map.get(2, {}).get("ideal_client", ""),
        "pain_points": step_map.get(2, {}).get("pain_points", ""),
        "content_pillars": [
            step_map.get(5, {}).get(f"pillar_{i}", "")
            for i in range(1, 6)
            if step_map.get(5, {}).get(f"pillar_{i}")
        ],
    }

    await db.brand_memory.update_one(
        {"workspace_id": tenant.workspace_id},
        {"$set": update_doc},
        upsert=True,
    )

    return {
        "locked": True,
        "workspace_id": tenant.workspace_id,
        "updated_at": update_doc["updated_at"],
    }


# =========================================================
# CONTENT GENERATION
# =========================================================

@router.post("/content/generate")
async def generate_content(request: Request, payload: ContentGenerateRequest):
    tenant = require_tenant_member(request)
    db = get_db_from_request(request)

    await require_feature(request, "content_studio")

    current_usage = await get_current_month_ai_usage(db, tenant.workspace_id)
    await require_below_monthly_ai_limit(
        request,
        current_usage=current_usage,
    )

    prompt_parts = [
        f"Create {payload.content_type} content",
        f"about {payload.topic or 'the brand'}",
    ]

    if payload.offer:
        prompt_parts.append(f"for the offer: {payload.offer}")
    if payload.tone:
        prompt_parts.append(f"in a {payload.tone} tone")
    if payload.custom_instruction:
        prompt_parts.append(payload.custom_instruction)

    prompt = ". ".join(part.strip() for part in prompt_parts if part.strip())

    result = await generate_with_ai(prompt)

    await log_ai_usage(
        db,
        workspace_id=tenant.workspace_id,
        user_id=tenant.user_id,
        action="content_generate",
        metadata={
            "content_type": payload.content_type,
            "topic": payload.topic,
        },
    )

    return {
        "workspace_id": tenant.workspace_id,
        "content_type": payload.content_type,
        "content": result,
    }


@router.get("/content/library")
async def get_content_library(request: Request):
    tenant = require_tenant_member(request)
    db = get_db_from_request(request)

    await require_feature(request, "content_studio")

    assets = await db.content_assets.find(
        {"workspace_id": tenant.workspace_id},
        {"_id": 0},
    ).sort("created_at", -1).to_list(length=100)

    return {
        "workspace_id": tenant.workspace_id,
        "assets": assets,
        "total": len(assets),
    }


@router.post("/content/save")
async def save_content(request: Request, payload: ContentSaveRequest):
    tenant = require_tenant_member(request)
    db = get_db_from_request(request)

    await require_feature(request, "content_studio")

    doc = payload.model_dump()
    doc = stamp_tenant_fields(doc, tenant)
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = now_iso()
    doc["updated_at"] = now_iso()
    doc["created_by"] = tenant.user_id
    doc["updated_by"] = tenant.user_id

    await db.content_assets.insert_one(doc)

    return {
        "saved": True,
        "workspace_id": tenant.workspace_id,
        "asset_id": doc["id"],
    }


# =========================================================
# BRAND MEMORY
# =========================================================

@router.get("/brand-memory")
async def get_brand_memory(request: Request):
    tenant = require_tenant_member(request)
    db = get_db_from_request(request)

    doc = await db.brand_memory.find_one(
        {"workspace_id": tenant.workspace_id},
        {"_id": 0},
    )

    return doc or {}


@router.post("/brand-memory")
async def save_brand_memory(request: Request):
    tenant = require_tenant_member(request)
    db = get_db_from_request(request)

    body = await request.json()
    body = stamp_tenant_fields(body, tenant)
    body["updated_at"] = now_iso()
    body["updated_by"] = tenant.user_id

    await db.brand_memory.update_one(
        {"workspace_id": tenant.workspace_id},
        {"$set": body},
        upsert=True,
    )

    return {
        "saved": True,
        "workspace_id": tenant.workspace_id,
        "updated_at": body["updated_at"],
    }
