"""
brand_audit_memory_parser.py
CTH OS — Brand Audit Memory Extraction

What this version does:
- removes all Emergent dependencies
- uses services.ai.generate_with_ai(...) only
- preserves the callable surface:
    - extract_and_save(...)
- keeps extraction non-blocking and safe
- writes back into brand_memory without destroying existing values
"""

from __future__ import annotations

import json
import logging
import re
from datetime import datetime, timezone
from typing import Any, Optional

from backend.database import get_db
from backend.services.ai import generate_with_ai

logger = logging.getLogger("cth.brand_audit_memory_parser")

def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def _require_db() -> Any:
    if db is None:
        raise RuntimeError("Database not initialized")
    return db

def _clean_text(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()

def _calculate_completion(brand_memory: dict[str, Any]) -> int:
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

def _safe_module_scores(audit_result: dict[str, Any]) -> dict[str, Any]:
    scores = audit_result.get("module_scores", {})
    if isinstance(scores, dict):
        return scores
    return {}

def _build_extraction_prompt(
    *,
    user_id: str,
    workspace_id: Optional[str],
    audit_result: dict[str, Any],
    existing_brand_memory: dict[str, Any],
) -> str:
    analysis = _clean_text(audit_result.get("ai_analysis"))
    overall_score = audit_result.get("overall_score", 0)
    rating = _clean_text(audit_result.get("brand_health_rating"))
    module_scores = _safe_module_scores(audit_result)

    existing_memory_json = json.dumps(existing_brand_memory, ensure_ascii=False, indent=2)
    module_scores_json = json.dumps(module_scores, ensure_ascii=False, indent=2)

    return f"""You are a brand strategist extracting structured Brand Memory fields from a completed brand audit.

Your task:
Read the audit analysis and infer ONLY useful, defensible structured values that can improve Brand Memory.

Rules:
- Do not invent fake specifics that are not reasonably supported
- If a value is unclear, omit it
- Prefer concise strings over long paragraphs
- For lists, return short clean entries
- Only return valid JSON
- Do not include commentary
- Do not repeat fields that already exist in existing_brand_memory unless your extracted value is clearly better and more specific

Context:
user_id: {user_id}
workspace_id: {workspace_id or ""}

Audit result:
overall_score: {overall_score}
brand_health_rating: {rating}
module_scores: {module_scores_json}

Audit analysis:
{analysis}

Existing brand memory:
{existing_memory_json}

Return JSON in this exact format:
{{
  "updates": {{
    "brand_name": "<string if confidently inferred>",
    "tagline": "<string if confidently inferred>",
    "core_offer": "<string if confidently inferred>",
    "target_audience": "<string if confidently inferred>",
    "primary_offer": "<string if confidently inferred>",
    "price_point": "<string if confidently inferred>",
    "offer_type": "<string if confidently inferred>",
    "secondary_offers": "<string if confidently inferred>",
    "platforms": ["<list values if confidently inferred>"],
    "posting_frequency": "<string if confidently inferred>",
    "website_url": "<string if confidently inferred>",
    "growth_goal": "<string if confidently inferred>",
    "audience_problem": "<string if confidently inferred>",
    "revenue_goal": "<string if confidently inferred>",
    "brand_health_rating": "<Building|Developing|Established|Optimized if useful>",
    "brand_foundation_score": <number if useful>,
    "visual_identity_score": <number if useful>,
    "offer_suite_score": <number if useful>,
    "systems_score": <number if useful>,
    "content_library_score": <number if useful>,
    "launch_readiness_score": <number if useful>
  }}
}}

Return only fields that should actually be updated. Omit empty or uncertain values.
"""

def _extract_json_object(raw_text: str) -> dict[str, Any] | None:
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

def _normalize_platforms(value: Any) -> list[str]:
    if isinstance(value, list):
        cleaned = []
        for item in value:
            item_text = _clean_text(item)
            if item_text:
                cleaned.append(item_text)
        return cleaned

    if isinstance(value, str):
        raw = value.strip()
        if not raw:
            return []
        return [part.strip() for part in raw.split(",") if part.strip()]

    return []

def _normalize_updates(raw_updates: dict[str, Any], existing_brand_memory: dict[str, Any]) -> dict[str, Any]:
    allowed_fields = {
        "brand_name",
        "tagline",
        "core_offer",
        "target_audience",
        "primary_offer",
        "price_point",
        "offer_type",
        "secondary_offers",
        "platforms",
        "posting_frequency",
        "website_url",
        "growth_goal",
        "audience_problem",
        "revenue_goal",
        "brand_health_rating",
        "brand_foundation_score",
        "visual_identity_score",
        "offer_suite_score",
        "systems_score",
        "content_library_score",
        "launch_readiness_score",
    }

    normalized: dict[str, Any] = {}

    for key, value in raw_updates.items():
        if key not in allowed_fields:
            continue

        if key == "platforms":
            platforms = _normalize_platforms(value)
            if platforms:
                existing_platforms = existing_brand_memory.get("platforms")
                if not existing_platforms or (
                    isinstance(existing_platforms, list) and len(platforms) > len(existing_platforms)
                ):
                    normalized[key] = platforms
            continue

        if key.endswith("_score"):
            try:
                score = int(value)
                score = max(0, min(100, score))
                normalized[key] = score
            except Exception:
                continue
            continue

        text = _clean_text(value)
        if not text:
            continue

        existing_value = existing_brand_memory.get(key)
        if isinstance(existing_value, str) and existing_value.strip():
            # Only replace if the new value is meaningfully more specific
            if len(text) <= len(existing_value.strip()):
                continue

        normalized[key] = text

    return normalized

async def _run_extraction(
    *,
    user_id: str,
    workspace_id: Optional[str],
    audit_result: dict[str, Any],
    existing_brand_memory: dict[str, Any],
) -> dict[str, Any]:
    prompt = _build_extraction_prompt(
        user_id=user_id,
        workspace_id=workspace_id,
        audit_result=audit_result,
        existing_brand_memory=existing_brand_memory,
    )

    raw_text = await generate_with_ai(
        prompt=prompt,
        max_tokens=2000,
        use_mock_on_failure=False,
    )

    parsed = _extract_json_object(raw_text)
    if not parsed:
        return {}

    updates = parsed.get("updates", {})
    if not isinstance(updates, dict):
        return {}

    return _normalize_updates(updates, existing_brand_memory)

def _fallback_updates(audit_result: dict[str, Any], existing_brand_memory: dict[str, Any]) -> dict[str, Any]:
    updates: dict[str, Any] = {}

    rating = _clean_text(audit_result.get("brand_health_rating"))
    if rating and not existing_brand_memory.get("brand_health_rating"):
        updates["brand_health_rating"] = rating

    scores = _safe_module_scores(audit_result)
    score_map = {
        "brand_foundation": "brand_foundation_score",
        "visual_identity": "visual_identity_score",
        "offer_suite": "offer_suite_score",
        "systems": "systems_score",
        "content_library": "content_library_score",
        "launch_readiness": "launch_readiness_score",
    }

    for source_key, target_key in score_map.items():
        if target_key in existing_brand_memory:
            continue
        try:
            value = int(scores.get(source_key))
            updates[target_key] = max(0, min(100, value))
        except Exception:
            continue

    return updates

async def extract_and_save(
    *,
    user_id: str,
    audit_result: dict[str, Any],
    existing_brand_memory: dict[str, Any],
    workspace_id: Optional[str] = None,
) -> dict[str, Any]:
    """
    Extract additional structured brand memory from the audit analysis and save it.

    Returns:
    {
      "fields_added": int,
      "completion_pct": int,
      "updates": dict
    }
    """
    database = _require_db()

    query = {"user_id": user_id}
    if workspace_id:
        query["workspace_id"] = workspace_id

    current_memory = dict(existing_brand_memory or {})

    try:
        extracted_updates = await _run_extraction(
            user_id=user_id,
            workspace_id=workspace_id,
            audit_result=audit_result,
            existing_brand_memory=current_memory,
        )
    except Exception as e:
        logger.warning("AI extraction failed, using fallback updates: %s", e)
        extracted_updates = _fallback_updates(audit_result, current_memory)

    if not extracted_updates:
        completion_pct = _calculate_completion(current_memory)
        return {
            "fields_added": 0,
            "completion_pct": completion_pct,
            "updates": {},
        }

    merged = dict(current_memory)
    merged.update(extracted_updates)
    merged["completion_pct"] = _calculate_completion(merged)
    merged["updated_at"] = _utc_now_iso()
    merged["user_id"] = user_id
    if workspace_id:
        merged["workspace_id"] = workspace_id

    await database.brand_memory.update_one(
        query,
        {"$set": merged},
        upsert=True,
    )

    fields_added = 0
    for key in extracted_updates:
        old_val = current_memory.get(key)
        new_val = extracted_updates.get(key)

        if old_val is None:
            fields_added += 1
        elif isinstance(old_val, str) and not old_val.strip() and isinstance(new_val, str) and new_val.strip():
            fields_added += 1
        elif isinstance(old_val, list) and len(old_val) == 0 and isinstance(new_val, list) and len(new_val) > 0:
            fields_added += 1

    return {
        "fields_added": fields_added,
        "completion_pct": merged["completion_pct"],
        "updates": extracted_updates,
    }
