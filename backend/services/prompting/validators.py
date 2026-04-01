"""
validators.py
Validation helpers for Core Truth House prompt outputs.

These validators do not decide brand identity.
They check whether an output is:
- clear enough
- specific enough
- aligned with expected tone
- free of obvious hype/generic filler
"""

from __future__ import annotations

from typing import Any, Dict, List


BANNED_HYPE_PHRASES = [
    "game changer",
    "revolutionary",
    "next level",
    "crush it",
    "dominate",
    "10x your",
    "skyrocket",
    "blow up",
    "viral overnight",
]

GENERIC_FILLER_PHRASES = [
    "in today's fast-paced world",
    "at the end of the day",
    "unlock your potential",
    "elevate your brand",
    "stand out from the crowd",
    "take your business to the next level",
]

TOO_LOUD_MARKERS = [
    "!!!",
    "must-have",
    "unstoppable",
    "secret formula",
]

RECOMMENDED_STRUCTURE_HINTS = [
    "specific audience",
    "clear outcome",
    "concrete problem",
    "practical direction",
]


def _normalize(text: str) -> str:
    return (text or "").strip()


def _lower(text: str) -> str:
    return _normalize(text).lower()


def check_minimum_substance(text: str, min_words: int = 20) -> List[str]:
    issues: List[str] = []
    word_count = len(_normalize(text).split())
    if word_count < min_words:
        issues.append(f"Output is too thin. Minimum recommended word count is {min_words}, got {word_count}.")
    return issues


def check_hype_language(text: str) -> List[str]:
    issues: List[str] = []
    lowered = _lower(text)

    for phrase in BANNED_HYPE_PHRASES:
        if phrase in lowered:
            issues.append(f"Contains hype phrase: '{phrase}'")

    for phrase in TOO_LOUD_MARKERS:
        if phrase in lowered:
            issues.append(f"Contains loud or exaggerated language: '{phrase}'")

    return issues


def check_generic_language(text: str) -> List[str]:
    issues: List[str] = []
    lowered = _lower(text)

    for phrase in GENERIC_FILLER_PHRASES:
        if phrase in lowered:
            issues.append(f"Contains generic filler phrase: '{phrase}'")

    return issues


def check_specificity(text: str) -> List[str]:
    """
    Lightweight heuristic.
    Looks for signs that the output may be too vague.
    """
    issues: List[str] = []
    normalized = _normalize(text)

    if not normalized:
        return ["Output is empty."]

    # Simple heuristics
    has_number = any(ch.isdigit() for ch in normalized)
    has_colon = ":" in normalized
    has_bullets = "- " in normalized or "\n•" in normalized
    long_enough = len(normalized.split()) >= 40

    score = sum([has_number, has_colon, has_bullets, long_enough])

    if score <= 1:
        issues.append("Output may be too vague or underspecified.")

    return issues


def check_tone_alignment(text: str) -> List[str]:
    """
    Checks against platform-level tone rules:
    calm, precise, specific, not loud.
    """
    issues: List[str] = []
    normalized = _normalize(text)

    if normalized.isupper():
        issues.append("Output is excessively loud or all caps.")

    if normalized.count("!") > 2:
        issues.append("Output uses too many exclamation marks.")

    return issues


def validate_output(
    text: str,
    min_words: int = 20,
) -> Dict[str, Any]:
    issues: List[str] = []
    issues.extend(check_minimum_substance(text, min_words=min_words))
    issues.extend(check_hype_language(text))
    issues.extend(check_generic_language(text))
    issues.extend(check_specificity(text))
    issues.extend(check_tone_alignment(text))

    return {
        "valid": len(issues) == 0,
        "issues": issues,
        "word_count": len(_normalize(text).split()),
    }


def validate_json_like_payload(payload: Dict[str, Any], required_keys: List[str]) -> Dict[str, Any]:
    missing = [key for key in required_keys if key not in payload]
    return {
        "valid": len(missing) == 0,
        "missing_keys": missing,
    }
