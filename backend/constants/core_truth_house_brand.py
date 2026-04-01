"""
core_truth_house_brand.py
Core Truth House — Platform Brand Constants

This file defines the Core Truth House brand only.
It must never be used as a tenant brand record.
"""

from typing import Dict, List


CORE_TRUTH_HOUSE_BRAND: Dict[str, object] = {
    "name": "Core Truth House",
    "vision": (
        "A world where every serious founder stops guessing and starts building "
        "on a foundation of truth, where strategy comes before aesthetics, "
        "systems come before scale, and the brands that last are built the deepest."
    ),
    "mission": (
        "We help founders build the brand behind the business — the strategy, "
        "systems, and clarity that make everything they create compound over time."
    ),
    "hero_headline": (
        "Build the brand behind the business before you build the brand the world sees."
    ),
    "value_proposition": (
        "Build the strategy, systems, and content behind a brand that actually grows."
    ),
    "brand_voice": (
        "Authoritative. Calm. Precise. Warm sophistication. Never academic. "
        "Never loud. Always specific."
    ),
    "core_principles": [
        "Strategy before aesthetics",
        "Systems before scale",
        "Foundation before visibility",
        "Truth before trend",
    ],
}

CORE_TRUTH_HOUSE_COLORS: Dict[str, str] = {
    "primary_dark_purple": "#33033C",
    "secondary_cinnabar": "#E04E35",
    "alabama_crimson": "#AF0024",
    "dark_scarlet": "#5D0012",
    "deep_ruby": "#763B5B",
    "tuscany": "#C7A09D",
    "darkest": "#0D0010",
    "card_background": "#1A0020",
}

CORE_TRUTH_HOUSE_TYPOGRAPHY: Dict[str, str] = {
    "display": "Playfair Display",
    "headings": "Cormorant Garamond",
    "body": "Inter / DM Sans",
}

PLATFORM_METHOD_RULES: List[str] = [
    "Strategy before aesthetics.",
    "Systems before scale.",
    "Foundation before visibility.",
    "Truth before trend.",
    "Be clear before being clever.",
    "Prefer precision over hype.",
    "Prioritize usable strategy over vague inspiration.",
]

PLATFORM_VOICE_PROMPT = """
Core Truth House product voice:
- Authoritative
- Calm
- Precise
- Warm sophistication

Never:
- Loud
- Generic
- Trend-chasing
- Academic for the sake of sounding smart

Always:
- Specific
- Structured
- Strategic
- Clear
""".strip()


def get_core_truth_house_brand() -> Dict[str, object]:
    return CORE_TRUTH_HOUSE_BRAND.copy()


def get_platform_method_rules() -> List[str]:
    return list(PLATFORM_METHOD_RULES)
