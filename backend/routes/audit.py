"""AI Brand Audit routes."""

from __future__ import annotations

from datetime import datetime, timezone
import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from middleware.tenant_dependencies import (
    TenantContext,
    TenantDB,
    get_tenant_context,
    get_tenant_db,
)
from backend.services.ai import generate_with_ai
from backend.database import logger

router = APIRouter(prefix="/api/audit", tags=["audit"])

class AuditGenerateRequest(BaseModel):
    refresh: bool = True

def _calc_foundation_score(foundation: dict) -> int:
    foundation_fields = [
        "mission",
        "vision",
        "values",
        "tagline",
        "positioning",
        "story",
        "tone_of_voice",
    ]
    filled = sum(
        1
        for f in foundation_fields
        if foundation.get(f)
        and (len(foundation[f]) > 0 if isinstance(foundation[f], list) else bool(foundation[f]))
    )
    return round((filled / len(foundation_fields)) * 100) if foundation_fields else 0

def _calc_identity_score(identity: dict) -> int:
    has_colors = len(identity.get("colors", [])) >= 3
    fonts = identity.get("fonts", {}) or {}
    has_fonts = bool(fonts.get("heading") or fonts.get("body"))
    return (50 if has_colors else 0) + (50 if has_fonts else 0)

def _calc_rating(overall: int) -> str:
    if overall < 20:
        return "Critical"
    if overall < 40:
        return "Needs Work"
    if overall < 60:
        return "Building"
    if overall < 80:
        return "Strong"
    return "Elite"

def _build_brand_context(
    foundation: dict,
    identity: dict,
    offers_count: int,
    systems_count: int,
    content_count: int,
    active_launches_count: int,
    scores: dict,
) -> str:
    return f"""
Brand Audit Data:
- Mission: {foundation.get('mission', 'Not set')[:200]}
- Vision: {foundation.get('vision', 'Not set')[:200]}
- Values: {', '.join(foundation.get('values', [])[:5]) or 'Not set'}
- Tagline: {foundation.get('tagline', 'Not set')[:100]}
- Positioning: {foundation.get('positioning', 'Not set')[:200]}
- Story: {'Set' if foundation.get('story') else 'Not set'}
- Tone of Voice: {'Set' if foundation.get('tone_of_voice') else 'Not set'}
- Colors defined: {len(identity.get('colors', []))}
- Fonts set: {'Yes' if (identity.get('fonts', {}) or {}).get('heading') or (identity.get('fonts', {}) or {}).get('body') else 'No'}
- Offers created: {offers_count}
- Systems built: {systems_count}
- Content pieces: {content_count}
- Active launches: {active_launches_count}

Scores:
- Foundation: {scores['foundation']}%
- Identity: {scores['identity']}%
- Offers: {scores['offers']}%
- Systems: {scores['systems']}%
- Content: {scores['content']}%
- Launch Readiness: {scores['launch_readiness']}%
- Overall: {scores['overall']}%
"""

@router.post("/generate")
async def generate_brand_audit(
    _data: AuditGenerateRequest,
    ctx: TenantContext = Depends(get_tenant_context),
    tdb: TenantDB = Depends(get_tenant_db),
):
    """Generate a comprehensive AI brand audit for the current tenant workspace."""

    foundation = await tdb.find_one("brand_foundation") or {}
    identity = await tdb.find_one("identity") or {}

    offers_count = await tdb.count("offers")
    systems_count = await tdb.count("systems")
    content_count = await tdb.count("content_assets")
    launches = await tdb.find("launches", limit=50)

    active_launches = [
        l for l in launches if l.get("status") in ("planning", "active")
    ]

    scores = {}
    scores["foundation"] = _calc_foundation_score(foundation)
    scores["identity"] = _calc_identity_score(identity)
    scores["offers"] = min(100, offers_count * 25)
    scores["systems"] = min(100, systems_count * 20)
    scores["content"] = min(100, content_count * 10)
    scores["launch_readiness"] = min(100, len(active_launches) * 33)

    weights = {
        "foundation": 0.30,
        "identity": 0.15,
        "offers": 0.20,
        "systems": 0.15,
        "content": 0.10,
        "launch_readiness": 0.10,
    }
    scores["overall"] = round(sum(scores[k] * weights[k] for k in weights))

    brand_context = _build_brand_context(
        foundation=foundation,
        identity=identity,
        offers_count=offers_count,
        systems_count=systems_count,
        content_count=content_count,
        active_launches_count=len(active_launches),
        scores=scores,
    )

    prompt = f"""You are a senior brand strategist conducting a comprehensive brand audit. Based on the following data, provide a detailed analysis.

{brand_context}

Provide your audit in this exact format:

EXECUTIVE SUMMARY:
[2-3 sentences summarizing the brand's current state and biggest opportunity]

STRENGTHS:
1. [Strength with brief explanation]
2. [Strength with brief explanation]
3. [Strength with brief explanation]

GAPS:
1. [Gap with brief explanation and why it matters]
2. [Gap with brief explanation and why it matters]
3. [Gap with brief explanation and why it matters]

TOP 3 PRIORITIES:
1. [Most impactful action to take next, with specific guidance]
2. [Second priority with specific guidance]
3. [Third priority with specific guidance]

BRAND HEALTH RATING: [One of: Critical, Needs Work, Building, Strong, Elite]

Be specific, actionable, and encouraging. Reference the actual data provided.
"""

    ai_analysis = await generate_with_ai(prompt)
    rating = _calc_rating(scores["overall"])

    audit_doc = {
        "id": str(uuid.uuid4()),
        "user_id": ctx.user_id,
        "workspace_id": ctx.workspace_id,
        "scores": scores,
        "overall_score": scores["overall"],
        "brand_health_rating": rating,
        "rating": rating,
        "analysis": ai_analysis,
        "created_at": datetime.now(timezone.utc),
    }

    await tdb.insert_one("brand_audits", audit_doc)

    try:
        from backend.routes.onboarding_router import mark_milestone_internal
        await mark_milestone_internal(ctx.user_id, "audit_complete", ctx.workspace_id)
    except Exception as e:
        logger.warning(f"Could not mark audit milestone: {e}")

    try:
        from backend.routes.brand_audit_memory_parser import extract_and_save
        await extract_and_save(
            user_id=ctx.user_id,
            audit_result={
                "ai_analysis": ai_analysis,
                "module_scores": scores,
                "overall_score": scores.get("overall", 0),
                "brand_health_rating": rating,
            },
            workspace_id=ctx.workspace_id,
        )
    except Exception as e:
        logger.warning(f"Audit memory parser failed (non-blocking): {e}")

    return {
        "audit_id": audit_doc["id"],
        "scores": scores,
        "overall_score": scores["overall"],
        "rating": rating,
        "brand_health_rating": rating,
        "analysis": ai_analysis,
        "created_at": audit_doc["created_at"].isoformat(),
    }

@router.get("/latest")
async def get_latest_audit(
    tdb: TenantDB = Depends(get_tenant_db),
):
    """Get the most recent brand audit for the current tenant workspace."""

    audits = await tdb.find(
        "brand_audits",
        sort=[("created_at", -1)],
        limit=1,
    )

    if not audits:
        return {"audit": None}

    audit = audits[0]
    if isinstance(audit.get("created_at"), datetime):
        audit["created_at"] = audit["created_at"].isoformat()

    return {"audit": audit}

@router.get("/history")
async def get_audit_history(
    limit: int = 10,
    tdb: TenantDB = Depends(get_tenant_db),
):
    """Get recent audit history for the current tenant workspace."""

    audits = await tdb.find(
        "brand_audits",
        sort=[("created_at", -1)],
        limit=min(max(limit, 1), 50),
    )

    cleaned = []
    for audit in audits:
        item = {k: v for k, v in audit.items() if k != "_id"}
        if isinstance(item.get("created_at"), datetime):
            item["created_at"] = item["created_at"].isoformat()
        cleaned.append(item)

    return {"audits": cleaned}
