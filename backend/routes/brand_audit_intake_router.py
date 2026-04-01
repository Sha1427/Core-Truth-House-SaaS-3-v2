"""
brand_audit_intake_router.py
CTH OS — Pre-Audit Intake API

What this version does:
- removes all Emergent dependencies
- uses services.ai.generate_with_ai(...) only
- preserves the existing route surface:
    - GET  /api/brand-audit/intake-status
    - POST /api/brand-audit/intake
- keeps Brand Memory save behavior
- keeps audit save behavior
- keeps non-blocking onboarding milestone hooks
- keeps non-blocking brand audit memory extraction hook
"""

from __future__ import annotations

import json
import logging
import re
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.database import get_db
from backend.services.ai import generate_with_ai

logger = logging.getLogger("cth.brand_audit_intake")

router = APIRouter(prefix="/api/brand-audit", tags=["brand-audit-intake"])

class IntakeSubmission(BaseModel):
    answers: dict[str, Any]
    user_id: str = "default"
    workspace_id: Optional[str] = None

def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def _require_db() -> Any:
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    return db

def map_answers_to_brand_memory(answers: dict[str, Any]) -> dict[str, Any]:
    """Maps intake form answers to Brand Memory field names."""
    mapping = {
        "brand_name": answers.get("brand_name", "").strip() if answers.get("brand_name") else "",
        "tagline": answers.get("tagline", "").strip() if answers.get("tagline") else "",
        "core_offer": answers.get("what_you_do", "").strip() if answers.get("what_you_do") else "",
        "target_audience": answers.get("who_you_serve", "").strip() if answers.get("who_you_serve") else "",
        "primary_offer": answers.get("primary_offer", "").strip() if answers.get("primary_offer") else "",
        "price_point": answers.get("price_point", "").strip() if answers.get("price_point") else "",
        "offer_type": answers.get("offer_type", "").strip() if answers.get("offer_type") else "",
        "secondary_offers": answers.get("other_offers", "").strip() if answers.get("other_offers") else "",
        "platforms": answers.get("active_platforms", []),
        "posting_frequency": answers.get("posting_frequency", "").strip() if answers.get("posting_frequency") else "",
        "website_url": answers.get("website", "").strip() if answers.get("website") else "",
        "growth_goal": answers.get("primary_goal", "").strip() if answers.get("primary_goal") else "",
        "audience_problem": answers.get("biggest_challenge", "").strip() if answers.get("biggest_challenge") else "",
        "revenue_goal": answers.get("revenue_target", "").strip() if answers.get("revenue_target") else "",
    }
    return {k: v for k, v in mapping.items() if v and (v != [] if isinstance(v, list) else True)}

def calculate_completion(brand_memory: dict[str, Any]) -> int:
    """Calculate Brand Memory completion % from saved fields."""
    required = [
        "primary_offer",
        "audience_problem",
        "platforms",
        "growth_goal",
        "revenue_goal",
        "core_offer",
        "target_audience",
        "brand_name",
    ]
    filled = 0
    for field in required:
        val = brand_memory.get(field)
        if isinstance(val, list) and len(val) > 0:
            filled += 1
        elif isinstance(val, str) and val.strip():
            filled += 1
    return round((filled / len(required)) * 100) if required else 0

def build_audit_prompt(answers: dict[str, Any]) -> str:
    """Build the AI analysis prompt using intake answers."""
    platforms = answers.get("active_platforms", [])
    platforms_str = ", ".join(platforms) if platforms else "None specified"

    return f"""You are a senior brand strategist conducting a brand audit for a new client.

BRAND INFORMATION (from intake form):

Brand Name: {answers.get('brand_name', 'Not specified')}
Tagline: {answers.get('tagline', 'None yet')}
What they do: {answers.get('what_you_do', 'Not specified')}
Who they serve: {answers.get('who_you_serve', 'Not specified')}

Primary Offer: {answers.get('primary_offer', 'Not specified')}
Price Point: {answers.get('price_point', 'Not specified')}
Offer Type: {answers.get('offer_type', 'Not specified')}
Other Offers: {answers.get('other_offers', 'None')}

Active Platforms: {platforms_str}
Posting Frequency: {answers.get('posting_frequency', 'Not specified')}
Website: {answers.get('website', 'None')}

Primary Goal: {answers.get('primary_goal', 'Not specified')}
Biggest Challenge: {answers.get('biggest_challenge', 'Not specified')}
Revenue Target: {answers.get('revenue_target', 'Not specified')}

AUDIT TASK:
Score this brand across 6 dimensions (0-100 each) and provide strategic analysis.
Base scores on what they have TOLD US, not on platform data. This is day one in the system.

SCORING DIMENSIONS:
1. Brand Foundation — How clearly defined is their mission, positioning, and brand promise based on what they've shared?
2. Visual Identity — Score 50 as baseline because we cannot see their visual assets yet, but they likely exist if they have a presence.
3. Offer Suite — How documented and structured is their offer based on what they've told us?
4. Systems & SOPs — Do they have systematic processes? Score based on posting frequency and business maturity signals.
5. Content Library — How active and consistent is their content based on platform activity and frequency?
6. Launch Readiness — How positioned are they to launch or campaign right now?

RESPOND IN THIS EXACT JSON FORMAT:
{{
  "overall_score": <number 0-100>,
  "brand_health_rating": "<Building|Developing|Established|Optimized>",
  "module_scores": {{
    "brand_foundation": <0-100>,
    "visual_identity": <0-100>,
    "offer_suite": <0-100>,
    "systems": <0-100>,
    "content_library": <0-100>,
    "launch_readiness": <0-100>
  }},
  "ai_analysis": "<full markdown analysis with Executive Summary, Strengths, Gaps, and Top 3 Priorities>"
}}

RATING GUIDE:
- Building (0-35): Early stage, foundational work needed
- Developing (36-60): Good start, key gaps to close
- Established (61-80): Strong foundation, execution gaps
- Optimized (81-100): Strong across all dimensions

Be honest and specific. Name the actual brand in your analysis. Reference their specific offer, audience, and challenges.
Return valid JSON only.
"""

def fallback_score(answers: dict[str, Any]) -> dict[str, Any]:
    """Generate a basic score from intake answers if AI fails."""
    foundation = 60 if answers.get("what_you_do") and answers.get("who_you_serve") else 30
    offer = 70 if answers.get("primary_offer") and answers.get("price_point") else 20
    systems = 50 if answers.get("posting_frequency") not in ["Rarely or never", ""] else 15
    content = 60 if answers.get("active_platforms") else 10
    visual = 50

    freq = answers.get("posting_frequency", "")
    if freq in ["Daily", "4-5x per week"]:
        content = 75
    elif freq in ["2-3x per week", "Weekly"]:
        content = 55

    launch_readiness = 30
    overall = round((foundation + visual + offer + systems + content + launch_readiness) / 6)

    if overall < 36:
        rating = "Building"
    elif overall < 61:
        rating = "Developing"
    elif overall < 81:
        rating = "Established"
    else:
        rating = "Optimized"

    brand_name = answers.get("brand_name", "Your brand")
    return {
        "overall_score": overall,
        "brand_health_rating": rating,
        "module_scores": {
            "brand_foundation": foundation,
            "visual_identity": visual,
            "offer_suite": offer,
            "systems": systems,
            "content_library": content,
            "launch_readiness": launch_readiness,
        },
        "ai_analysis": f"""## Executive Summary
{brand_name} is at an early stage in the CTH OS journey. The intake data gives us a solid starting point for your brand audit.

## Strengths
- Clear offer defined: {answers.get('primary_offer', 'documented')}
- Primary goal identified: {answers.get('primary_goal', 'growth')}
- Active on {len(answers.get('active_platforms', []))} platform(s)

## Gaps
- Brand Foundation needs to be documented in CTH OS
- Visual Identity assets need to be uploaded
- Content library needs to be built

## Top 3 Priorities
1. Complete Brand Memory with full detail
2. Run the Strategic OS to build your brand architecture
3. Build your first campaign around your primary offer""",
    }

def _extract_json_object(raw_text: str) -> dict[str, Any] | None:
    """Best-effort JSON extraction from model text."""
    if not raw_text or not raw_text.strip():
        return None

    text = raw_text.strip()

    try:
        parsed = json.loads(text)
        if isinstance(parsed, dict):
            return parsed
    except Exception:
        pass

    match = re.search(r"\{[\s\S]*\}", text)
    if not match:
        return None

    try:
        parsed = json.loads(match.group(0))
        if isinstance(parsed, dict):
            return parsed
    except Exception:
        return None

    return None

def _normalize_audit_result(audit_result: dict[str, Any], answers: dict[str, Any]) -> dict[str, Any]:
    """Ensure the AI result has the exact expected shape and sane defaults."""
    fallback = fallback_score(answers)

    module_scores = audit_result.get("module_scores", {}) if isinstance(audit_result.get("module_scores"), dict) else {}
    normalized_scores = {
        "brand_foundation": int(module_scores.get("brand_foundation", fallback["module_scores"]["brand_foundation"])),
        "visual_identity": int(module_scores.get("visual_identity", fallback["module_scores"]["visual_identity"])),
        "offer_suite": int(module_scores.get("offer_suite", fallback["module_scores"]["offer_suite"])),
        "systems": int(module_scores.get("systems", fallback["module_scores"]["systems"])),
        "content_library": int(module_scores.get("content_library", fallback["module_scores"]["content_library"])),
        "launch_readiness": int(module_scores.get("launch_readiness", fallback["module_scores"]["launch_readiness"])),
    }

    overall_score = audit_result.get("overall_score")
    try:
        overall_score = int(overall_score)
    except Exception:
        overall_score = round(sum(normalized_scores.values()) / len(normalized_scores))

    overall_score = max(0, min(100, overall_score))

    rating = str(audit_result.get("brand_health_rating", "") or "").strip()
    if rating not in {"Building", "Developing", "Established", "Optimized"}:
        if overall_score < 36:
            rating = "Building"
        elif overall_score < 61:
            rating = "Developing"
        elif overall_score < 81:
            rating = "Established"
        else:
            rating = "Optimized"

    ai_analysis = str(audit_result.get("ai_analysis", "") or "").strip()
    if not ai_analysis:
        ai_analysis = fallback["ai_analysis"]

    return {
        "overall_score": overall_score,
        "brand_health_rating": rating,
        "module_scores": normalized_scores,
        "ai_analysis": ai_analysis,
    }

async def _run_ai_audit(answers: dict[str, Any]) -> dict[str, Any] | None:
    """Run the AI audit and return parsed JSON if possible."""
    prompt = build_audit_prompt(answers)

    try:
        raw_text = await generate_with_ai(
            prompt=prompt,
            max_tokens=3000,
            use_mock_on_failure=False,
        )
        parsed = _extract_json_object(raw_text)
        if parsed:
            return _normalize_audit_result(parsed, answers)

        logger.warning("Brand audit AI returned non-JSON content. Falling back.")
        return None

    except Exception as e:
        logger.warning("Brand audit AI generation failed: %s", e)
        return None

@router.get("/intake-status")
async def check_intake_status(
    user_id: str = "default",
    workspace_id: Optional[str] = None,
):
    """Check if the user has completed intake or has any audits."""
    database = _require_db()

    query = {"user_id": user_id}
    if workspace_id:
        query["workspace_id"] = workspace_id

    audit_count = await database.brand_audits.count_documents(query)
    brand_mem = await database.brand_memory.find_one(query, {"_id": 0})
    intake_complete = brand_mem.get("intake_complete", False) if brand_mem else False

    return {
        "intake_complete": intake_complete or audit_count > 0,
        "audit_count": audit_count,
        "has_brand_memory": bool(brand_mem),
    }

@router.post("/intake")
async def submit_intake(body: IntakeSubmission):
    """
    Process intake form submission:
    1. Map answers to Brand Memory fields
    2. Save Brand Memory
    3. Run AI brand audit using intake data as context
    4. Save audit results
    5. Return audit ID and score
    """
    database = _require_db()

    answers = body.answers
    user_id = body.user_id
    workspace_id = body.workspace_id
    now = _utc_now_iso()

    query = {"user_id": user_id}
    if workspace_id:
        query["workspace_id"] = workspace_id

    # Step 1: Map to Brand Memory
    brand_memory_updates = map_answers_to_brand_memory(answers)

    # Load existing Brand Memory and merge
    existing = await database.brand_memory.find_one(query, {"_id": 0}) or {}
    merged = dict(existing)
    merged.update(brand_memory_updates)

    completion_pct = calculate_completion(merged)
    merged["completion_pct"] = completion_pct
    merged["updated_at"] = now
    merged["intake_complete"] = True
    merged["user_id"] = user_id
    if workspace_id:
        merged["workspace_id"] = workspace_id

    # Step 2: Save Brand Memory
    await database.brand_memory.update_one(query, {"$set": merged}, upsert=True)

    # Fire milestone if 80%+
    if completion_pct >= 80:
        try:
            from backend.routes.onboarding_router import mark_milestone_internal

            await mark_milestone_internal(user_id, "brand_memory_complete", workspace_id)
        except Exception as e:
            logger.warning("brand_memory_complete milestone failed: %s", e)

    # Step 3: Run AI audit with safe fallback
    audit_result = await _run_ai_audit(answers)
    if not audit_result:
        audit_result = fallback_score(answers)

    audit_result = _normalize_audit_result(audit_result, answers)

    # Step 4: Save audit
    audit_doc = {
        "user_id": user_id,
        "workspace_id": workspace_id,
        "overall_score": audit_result.get("overall_score", 0),
        "score": audit_result.get("overall_score", 0),
        "brand_health_rating": audit_result.get("brand_health_rating", "Building"),
        "rating": audit_result.get("brand_health_rating", "Building"),
        "scores": audit_result.get("module_scores", {}),
        "module_scores": audit_result.get("module_scores", {}),
        "analysis": audit_result.get("ai_analysis", ""),
        "ai_analysis": audit_result.get("ai_analysis", ""),
        "intake_answers": answers,
        "source": "intake",
        "created_at": now,
        "updated_at": now,
    }
    result = await database.brand_audits.insert_one(audit_doc)

    # Fire audit_complete milestone
    try:
        from backend.routes.onboarding_router import mark_milestone_internal

        await mark_milestone_internal(user_id, "audit_complete", workspace_id)
    except Exception as e:
        logger.warning("audit_complete milestone failed: %s", e)

    # Extract additional Brand Memory fields from audit analysis
    extraction_result = {"fields_added": 0, "completion_pct": completion_pct}
    try:
        from backend.routes.brand_audit_memory_parser import extract_and_save

        extraction_result = await extract_and_save(
            user_id=user_id,
            audit_result=audit_result,
            existing_brand_memory=merged,
            workspace_id=workspace_id,
        )
    except Exception as e:
        logger.warning("Audit memory parser failed (non-blocking): %s", e)

    return {
        "success": True,
        "audit_id": str(result.inserted_id),
        "overall_score": audit_result.get("overall_score", 0),
        "brand_health_rating": audit_result.get("brand_health_rating", "Building"),
        "brand_memory_completion": extraction_result.get("completion_pct", completion_pct),
        "variables_extracted": extraction_result.get("fields_added", 0),
        "redirect_to": "/brand-audit",
    }
