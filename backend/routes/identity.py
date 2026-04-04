"""Brand identity routes.

Clean rebuild notes:
- removes broken `from models import ...` dependency
- keeps brand identity save/load behavior
- keeps asset save/list/delete behavior
- adds a safe AI identity generator endpoint
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.database import get_db
from backend.routes.permissions import verify_workspace_access
from backend.services.ai import generate_with_ai

router = APIRouter(prefix="/api", tags=["identity"])

def _utc_now() -> datetime:
    return datetime.now(timezone.utc)

def _utc_now_iso() -> str:
    return _utc_now().isoformat()

def _require_db() -> Any:`r`n    database = get_db()`r`n    if database is None:`r`n        raise HTTPException(status_code=500, detail="Database not initialized")`r`n    return database

def _parse_dt_fields(doc: dict[str, Any]) -> dict[str, Any]:
    for key in ("created_at", "updated_at"):
        value = doc.get(key)
        if isinstance(value, str):
            try:
                doc[key] = datetime.fromisoformat(value)
            except Exception:
                pass
    return doc

# =========================================================
# LOCAL SCHEMAS
# =========================================================

class BrandAsset(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    asset_type: str
    name: str
    value: str
    description: str = ""
    created_at: datetime = Field(default_factory=_utc_now)

class BrandIdentity(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    workspace_id: Optional[str] = None

    brand_name: str = ""
    tagline: str = ""
    mission: str = ""
    vision: str = ""
    positioning: str = ""
    story: str = ""
    tone_of_voice: str = ""

    colors: List[str] = Field(default_factory=list)
    fonts: List[str] = Field(default_factory=list)
    keywords: List[str] = Field(default_factory=list)
    values: List[str] = Field(default_factory=list)
    audience: str = ""

    created_at: datetime = Field(default_factory=_utc_now)
    updated_at: datetime = Field(default_factory=_utc_now)

class IdentitySaveRequest(BaseModel):
    brand_name: str = ""
    tagline: str = ""
    mission: str = ""
    vision: str = ""
    positioning: str = ""
    story: str = ""
    tone_of_voice: str = ""

    colors: List[str] = Field(default_factory=list)
    fonts: List[str] = Field(default_factory=list)
    keywords: List[str] = Field(default_factory=list)
    values: List[str] = Field(default_factory=list)
    audience: str = ""

    workspace_id: Optional[str] = None

class BrandAssetCreate(BaseModel):
    asset_type: str
    name: str
    value: str
    description: str = ""
    workspace_id: Optional[str] = None

class IdentityGeneratorRequest(BaseModel):
    brand_name: str
    industry: str = ""
    audience: str = ""
    offer: str = ""
    personality: str = ""
    visual_direction: str = ""
    workspace_id: Optional[str] = None

# =========================================================
# BRAND IDENTITY
# =========================================================

@router.get("/identity", response_model=BrandIdentity)
async def get_identity(user_id: str = "default", workspace_id: Optional[str] = None):
    database = _require_db()

    if workspace_id:
        await verify_workspace_access(workspace_id, user_id)

    query = {"user_id": user_id}
    if workspace_id:
        query["workspace_id"] = workspace_id

    identity = await database.brand_identity.find_one(query, {"_id": 0})
    if not identity:
        raise HTTPException(status_code=404, detail="Brand identity not found")

    return BrandIdentity(**_parse_dt_fields(identity))

@router.post("/identity/save", response_model=BrandIdentity)
async def save_identity(data: IdentitySaveRequest, user_id: str = "default"):
    database = _require_db()

    workspace_id = data.workspace_id
    if workspace_id:
        await verify_workspace_access(workspace_id, user_id)

    query = {"user_id": user_id}
    if workspace_id:
        query["workspace_id"] = workspace_id

    existing = await database.brand_identity.find_one(query, {"_id": 0})

    if existing:
        identity_id = existing.get("id", str(uuid.uuid4()))
        created_at = existing.get("created_at", _utc_now_iso())
    else:
        identity_id = str(uuid.uuid4())
        created_at = _utc_now_iso()

    identity_doc = {
        "id": identity_id,
        "user_id": user_id,
        "workspace_id": workspace_id,
        "brand_name": data.brand_name,
        "tagline": data.tagline,
        "mission": data.mission,
        "vision": data.vision,
        "positioning": data.positioning,
        "story": data.story,
        "tone_of_voice": data.tone_of_voice,
        "colors": data.colors,
        "fonts": data.fonts,
        "keywords": data.keywords,
        "values": data.values,
        "audience": data.audience,
        "created_at": created_at,
        "updated_at": _utc_now_iso(),
    }

    await database.brand_identity.update_one(
        query,
        {"$set": identity_doc},
        upsert=True,
    )

    saved = await database.brand_identity.find_one(query, {"_id": 0})
    if not saved:
        raise HTTPException(status_code=500, detail="Failed to save brand identity")

    return BrandIdentity(**_parse_dt_fields(saved))

# =========================================================
# BRAND ASSETS
# =========================================================

@router.get("/identity/assets", response_model=List[BrandAsset])
async def get_identity_assets(user_id: str = "default", workspace_id: Optional[str] = None):
    database = _require_db()

    if workspace_id:
        await verify_workspace_access(workspace_id, user_id)

    query = {"user_id": user_id}
    if workspace_id:
        query["workspace_id"] = workspace_id

    assets = await database.brand_assets.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    parsed_assets = [_parse_dt_fields(asset) for asset in assets]
    return [BrandAsset(**asset) for asset in parsed_assets]

@router.post("/identity/assets", response_model=BrandAsset)
async def create_identity_asset(data: BrandAssetCreate, user_id: str = "default"):
    database = _require_db()

    if data.workspace_id:
        await verify_workspace_access(data.workspace_id, user_id)

    asset = BrandAsset(
        asset_type=data.asset_type,
        name=data.name,
        value=data.value,
        description=data.description,
    )

    asset_doc = asset.model_dump()
    asset_doc["user_id"] = user_id
    asset_doc["workspace_id"] = data.workspace_id
    asset_doc["created_at"] = asset.created_at.isoformat()

    await database.brand_assets.insert_one(asset_doc)
    return asset

@router.delete("/identity/assets/{asset_id}")
async def delete_identity_asset(asset_id: str, user_id: str = "default", workspace_id: Optional[str] = None):
    database = _require_db()

    if workspace_id:
        await verify_workspace_access(workspace_id, user_id)

    query = {"id": asset_id, "user_id": user_id}
    if workspace_id:
        query["workspace_id"] = workspace_id

    result = await database.brand_assets.delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Brand asset not found")

    return {"success": True, "message": "Brand asset deleted"}

# =========================================================
# AI GENERATOR
# =========================================================

@router.post("/identity/generate")
async def generate_identity(data: IdentityGeneratorRequest, user_id: str = "default"):
    database = _require_db()

    if data.workspace_id:
        await verify_workspace_access(data.workspace_id, user_id)

    prompt = f"""Create a complete brand identity draft.

Brand Name: {data.brand_name}
Industry: {data.industry}
Target Audience: {data.audience}
Core Offer: {data.offer}
Brand Personality: {data.personality}
Visual Direction: {data.visual_direction}

Generate:
1. Tagline
2. Mission
3. Vision
4. Positioning statement
5. Brand story summary
6. Tone of voice description
7. 5 core values
8. 8 brand keywords
9. 5 suggested color directions
10. 3 suggested font directions

Format clearly with section headings.
"""

    result = await generate_with_ai(prompt)

    generated_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "workspace_id": data.workspace_id,
        "brand_name": data.brand_name,
        "generator_input": data.model_dump(),
        "generated_content": result,
        "created_at": _utc_now_iso(),
        "updated_at": _utc_now_iso(),
    }

    await database.generated_identity_drafts.insert_one(generated_doc)

    return {
        "success": True,
        "brand_name": data.brand_name,
        "generated_content": result,
        "draft_id": generated_doc["id"],
    }


