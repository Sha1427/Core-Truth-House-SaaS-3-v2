"""
tenant_context.py
Build tenant-scoped prompt context from workspace data.

This layer uses tenant data only.
It must not inject Core Truth House brand identity into tenant outputs.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional


def _clean(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, list):
        return ", ".join(str(v).strip() for v in value if str(v).strip())
    return str(value).strip()


def _nonempty_lines(pairs: List[tuple[str, Any]]) -> List[str]:
    lines: List[str] = []
    for label, value in pairs:
        cleaned = _clean(value)
        if cleaned:
            lines.append(f"{label}: {cleaned}")
    return lines


async def fetch_tenant_brand_snapshot(db, workspace_id: str) -> Dict[str, Any]:
    """
    Pull a normalized tenant snapshot from the main tenant collections.
    """
    brand_memory = await db.brand_memory.find_one(
        {"workspace_id": workspace_id},
        {"_id": 0},
    ) or {}

    brand_foundation = await db.brand_foundation.find_one(
        {"workspace_id": workspace_id},
        {"_id": 0},
    ) or {}

    offers = await db.offers.find(
        {"workspace_id": workspace_id},
        {"_id": 0, "name": 1, "description": 1, "price": 1, "target_audience": 1, "transformation": 1},
    ).to_list(20)

    systems = await db.systems.find(
        {"workspace_id": workspace_id},
        {"_id": 0, "name": 1, "description": 1, "category": 1},
    ).to_list(20)

    return {
        "workspace_id": workspace_id,
        "brand_memory": brand_memory,
        "brand_foundation": brand_foundation,
        "offers": offers,
        "systems": systems,
    }


def format_tenant_context(snapshot: Dict[str, Any]) -> str:
    """
    Convert normalized tenant snapshot into a prompt-safe context block.
    """
    brand_memory = snapshot.get("brand_memory", {}) or {}
    brand_foundation = snapshot.get("brand_foundation", {}) or {}
    offers = snapshot.get("offers", []) or []
    systems = snapshot.get("systems", []) or []

    lines: List[str] = []
    lines.append("TENANT BRAND CONTEXT")
    lines.append("Use the tenant brand identity below as the primary source of truth for outputs.")
    lines.append("Do not replace the tenant voice with the platform voice.")
    lines.append("")

    lines.extend(_nonempty_lines([
        ("Brand name", brand_memory.get("brand_name") or brand_foundation.get("brand_name")),
        ("Mission", brand_foundation.get("mission") or brand_memory.get("mission")),
        ("Vision", brand_foundation.get("vision") or brand_memory.get("vision")),
        ("Values", brand_foundation.get("values") or brand_memory.get("values")),
        ("Tagline", brand_foundation.get("tagline") or brand_memory.get("tagline")),
        ("Positioning", brand_foundation.get("positioning")),
        ("Brand story", brand_foundation.get("story")),
        ("Tone of voice", brand_foundation.get("tone_of_voice") or brand_memory.get("voice")),
        ("Target audience", brand_foundation.get("target_audience") or brand_memory.get("target_audience")),
        ("Audience problem", brand_memory.get("audience_problem")),
        ("Audience desire", brand_memory.get("audience_desire")),
        ("Primary offer", brand_memory.get("primary_offer") or brand_memory.get("core_offer")),
        ("Secondary offers", brand_memory.get("secondary_offers")),
        ("Unique mechanism", brand_memory.get("unique_mechanism")),
        ("Transformation", brand_memory.get("transformation")),
        ("Brand strengths", brand_memory.get("brand_strengths")),
        ("Founder background", brand_memory.get("founder_background")),
        ("Growth goal", brand_memory.get("growth_goal")),
        ("Revenue goal", brand_memory.get("revenue_goal")),
        ("Content style", brand_memory.get("content_style")),
        ("Posting frequency", brand_memory.get("posting_frequency")),
        ("Priority platforms", brand_memory.get("platforms")),
        ("Competitors", [
            brand_memory.get("competitor_1"),
            brand_memory.get("competitor_2"),
            brand_memory.get("competitor_3"),
        ]),
    ]))

    if offers:
        lines.append("")
        lines.append("Offers:")
        for offer in offers[:5]:
            offer_parts = _nonempty_lines([
                ("Name", offer.get("name")),
                ("Description", offer.get("description")),
                ("Price", offer.get("price")),
                ("Audience", offer.get("target_audience")),
                ("Transformation", offer.get("transformation")),
            ])
            if offer_parts:
                lines.append(f"- {' | '.join(offer_parts)}")

    if systems:
        lines.append("")
        lines.append("Systems:")
        for system in systems[:5]:
            system_parts = _nonempty_lines([
                ("Name", system.get("name")),
                ("Description", system.get("description")),
                ("Category", system.get("category")),
            ])
            if system_parts:
                lines.append(f"- {' | '.join(system_parts)}")

    return "\n".join(lines).strip()


async def build_tenant_context(db, workspace_id: str) -> str:
    snapshot = await fetch_tenant_brand_snapshot(db, workspace_id)
    return format_tenant_context(snapshot)
