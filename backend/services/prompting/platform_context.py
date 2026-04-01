"""
platform_context.py
Build prompt context for Core Truth House platform-owned copy.

Use this only for:
- landing pages
- onboarding copy
- help center content
- admin announcements
- platform emails
- internal product messaging

Do not use this for tenant brand generation.
"""

from __future__ import annotations

from typing import List

from constants.core_truth_house_brand import (
    CORE_TRUTH_HOUSE_BRAND,
    CORE_TRUTH_HOUSE_COLORS,
    CORE_TRUTH_HOUSE_TYPOGRAPHY,
    PLATFORM_VOICE_PROMPT,
    get_platform_method_rules,
)


def _bullet_lines(items: list[str]) -> str:
    return "\n".join(f"- {item}" for item in items if str(item).strip())


def build_platform_identity_context() -> str:
    brand = CORE_TRUTH_HOUSE_BRAND

    sections: List[str] = [
        "CORE TRUTH HOUSE PLATFORM IDENTITY",
        f"Brand name: {brand.get('name', 'Core Truth House')}",
        f"Mission: {brand.get('mission', '')}",
        f"Vision: {brand.get('vision', '')}",
        f"Hero headline: {brand.get('hero_headline', '')}",
        f"Value proposition: {brand.get('value_proposition', '')}",
        f"Brand voice: {brand.get('brand_voice', '')}",
        "",
        "Core principles:",
        _bullet_lines(list(brand.get("core_principles", []))),
        "",
        PLATFORM_VOICE_PROMPT,
    ]

    return "\n".join(sections).strip()


def build_platform_design_context() -> str:
    color_lines = [f"- {k}: {v}" for k, v in CORE_TRUTH_HOUSE_COLORS.items()]
    type_lines = [f"- {k}: {v}" for k, v in CORE_TRUTH_HOUSE_TYPOGRAPHY.items()]

    return (
        "CORE TRUTH HOUSE VISUAL SYSTEM\n"
        "Colors:\n"
        f"{chr(10).join(color_lines)}\n\n"
        "Typography:\n"
        f"{chr(10).join(type_lines)}"
    ).strip()


def build_platform_method_context() -> str:
    rules = get_platform_method_rules()
    return (
        "CORE TRUTH HOUSE METHOD\n"
        "Apply this product methodology to the task.\n"
        f"{_bullet_lines(rules)}"
    ).strip()


def build_platform_context(include_design: bool = False) -> str:
    parts = [
        build_platform_identity_context(),
        "",
        build_platform_method_context(),
    ]

    if include_design:
        parts.extend(["", build_platform_design_context()])

    return "\n".join(parts).strip()
