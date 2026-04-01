"""AI service utilities for Core Truth House.

Clean rebuild goals:
- remove stale global db imports
- provide a stable surface for existing route imports
- support Anthropic as the primary provider
- keep helper names already used elsewhere in the repo:
    - generate_with_ai(...)
    - _call_llm(...)
    - FOUNDATION_PROMPTS
    - CONTENT_PROMPTS
- fail clearly when the API key is missing
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any

import httpx

from backend.database import get_db

logger = logging.getLogger("coretruthhouse.ai")

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "").strip()
ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"
ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-latest").strip()
ANTHROPIC_MAX_TOKENS = int(os.getenv("ANTHROPIC_MAX_TOKENS", "2000"))
AI_TIMEOUT_SECONDS = float(os.getenv("AI_TIMEOUT_SECONDS", "60"))


# ============================================================
# PROMPT LIBRARIES
# ============================================================

FOUNDATION_PROMPTS: dict[str, str] = {
    "brand_core": (
        "You are a senior brand strategist. Help define a clear brand core. "
        "Return concise, strategic language that is practical and easy to implement."
    ),
    "positioning": (
        "You are a strategic positioning expert. Clarify the customer's problem, "
        "the differentiated value, and the market position in plain language."
    ),
    "messaging": (
        "You are a messaging strategist. Build strong brand messaging that is clear, "
        "emotionally resonant, and conversion-aware."
    ),
    "customer": (
        "You are a customer insight strategist. Extract audience pain points, desires, "
        "decision triggers, and objections in a practical way."
    ),
    "offer": (
        "You are an offer strategist. Clarify what is being sold, who it is for, "
        "why it matters, and how it should be framed."
    ),
}

CONTENT_PROMPTS: dict[str, str] = {
    "social_caption": (
        "You are a content strategist. Write social content that is clear, engaging, "
        "and aligned with brand strategy."
    ),
    "blog_outline": (
        "You are a content strategist. Create a high-quality blog outline with a strong "
        "hook, logical structure, and practical takeaways."
    ),
    "email": (
        "You are an email strategist. Write brand-aligned email copy that is persuasive, "
        "clear, and natural."
    ),
    "campaign": (
        "You are a campaign strategist. Build integrated messaging across a campaign "
        "with consistency and strategic clarity."
    ),
    "seo": (
        "You are an SEO strategist. Generate useful, human-readable SEO content that "
        "balances search intent and strong messaging."
    ),
}


# ============================================================
# DB HELPERS
# ============================================================

def _get_db():
    return get_db()


async def get_workspace_context(workspace_id: str) -> dict[str, Any] | None:
    """Fetch lightweight workspace context for AI tasks."""
    db = _get_db()
    workspace = await db.workspaces.find_one(
        {"$or": [{"workspace_id": workspace_id}, {"id": workspace_id}]},
        {
            "_id": 0,
            "id": 1,
            "workspace_id": 1,
            "name": 1,
            "title": 1,
            "plan": 1,
            "subscription_status": 1,
            "billing": 1,
            "usage": 1,
        },
    )
    return workspace


async def get_brand_memory_context(workspace_id: str) -> dict[str, Any]:
    """Fetch optional brand memory style context if it exists."""
    db = _get_db()

    brand_memory = await db.brand_memory.find_one(
        {"workspace_id": workspace_id},
        {"_id": 0},
    )

    identity = await db.identity.find_one(
        {"workspace_id": workspace_id},
        {"_id": 0},
    )

    business = await db.business_profiles.find_one(
        {"workspace_id": workspace_id},
        {"_id": 0},
    )

    foundation = await db.brand_foundation.find_one(
        {"workspace_id": workspace_id},
        {"_id": 0},
    )

    return {
        "brand_memory": brand_memory or {},
        "identity": identity or {},
        "business": business or {},
        "foundation": foundation or {},
    }


# ============================================================
# LOW-LEVEL LLM CALLS
# ============================================================

def _require_anthropic_key() -> str:
    if not ANTHROPIC_API_KEY:
        raise RuntimeError("ANTHROPIC_API_KEY is not configured")
    return ANTHROPIC_API_KEY


def _normalize_messages(prompt: str, system_prompt: str | None = None) -> tuple[str, list[dict[str, str]]]:
    system = (system_prompt or "").strip()
    user_prompt = prompt.strip()

    if not user_prompt:
        raise ValueError("Prompt cannot be empty")

    messages = [
        {
            "role": "user",
            "content": user_prompt,
        }
    ]
    return system, messages


async def _anthropic_messages_call(
    *,
    prompt: str,
    system_prompt: str | None = None,
    model: str | None = None,
    max_tokens: int | None = None,
    temperature: float = 0.7,
) -> str:
    api_key = _require_anthropic_key()
    system, messages = _normalize_messages(prompt, system_prompt)

    payload: dict[str, Any] = {
        "model": model or ANTHROPIC_MODEL,
        "max_tokens": max_tokens or ANTHROPIC_MAX_TOKENS,
        "temperature": temperature,
        "messages": messages,
    }

    if system:
        payload["system"] = system

    headers = {
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }

    async with httpx.AsyncClient(timeout=AI_TIMEOUT_SECONDS) as client:
        response = await client.post(
            ANTHROPIC_API_URL,
            headers=headers,
            json=payload,
        )

    if response.status_code >= 400:
        logger.error("Anthropic error %s: %s", response.status_code, response.text)
        raise RuntimeError(f"Anthropic request failed: {response.status_code}")

    data = response.json()
    content = data.get("content", [])

    text_parts: list[str] = []
    for block in content:
        if isinstance(block, dict) and block.get("type") == "text":
            text_parts.append(block.get("text", ""))

    result = "\n".join(part for part in text_parts if part).strip()
    if not result:
        raise RuntimeError("Anthropic returned an empty response")

    return result


async def _call_llm(
    prompt: str,
    *,
    system_prompt: str | None = None,
    model: str | None = None,
    max_tokens: int | None = None,
    temperature: float = 0.7,
) -> str:
    """Primary internal LLM call helper used across routes/services."""
    return await _anthropic_messages_call(
        prompt=prompt,
        system_prompt=system_prompt,
        model=model,
        max_tokens=max_tokens,
        temperature=temperature,
    )


# ============================================================
# HIGH-LEVEL GENERATION HELPERS
# ============================================================

def _serialize_context(context: dict[str, Any] | None) -> str:
    if not context:
        return ""

    try:
        return json.dumps(context, indent=2, ensure_ascii=False)
    except Exception:
        return str(context)


def _build_prompt(
    *,
    task: str,
    prompt: str,
    context: dict[str, Any] | None = None,
    output_format: str | None = None,
) -> str:
    parts: list[str] = []

    if task:
        parts.append(f"Task Type:\n{task}")

    if context:
        parts.append(f"Context:\n{_serialize_context(context)}")

    if output_format:
        parts.append(f"Requested Output Format:\n{output_format}")

    parts.append(f"User Request:\n{prompt}")

    return "\n\n".join(parts).strip()


async def generate_with_ai(
    *,
    prompt: str,
    system_prompt: str | None = None,
    model: str | None = None,
    max_tokens: int | None = None,
    temperature: float = 0.7,
    task: str | None = None,
    context: dict[str, Any] | None = None,
    output_format: str | None = None,
) -> str:
    """Main high-level generation helper used throughout the app."""
    compiled_prompt = _build_prompt(
        task=task or "general_generation",
        prompt=prompt,
        context=context,
        output_format=output_format,
    )

    return await _call_llm(
        compiled_prompt,
        system_prompt=system_prompt,
        model=model,
        max_tokens=max_tokens,
        temperature=temperature,
    )


async def generate_for_workspace(
    *,
    workspace_id: str,
    prompt: str,
    system_prompt: str | None = None,
    task: str | None = None,
    output_format: str | None = None,
    model: str | None = None,
    max_tokens: int | None = None,
    temperature: float = 0.7,
) -> str:
    """Workspace-aware generation helper."""
    workspace = await get_workspace_context(workspace_id)
    memory = await get_brand_memory_context(workspace_id)

    context = {
        "workspace": workspace or {},
        "memory": memory,
    }

    return await generate_with_ai(
        prompt=prompt,
        system_prompt=system_prompt,
        task=task,
        context=context,
        output_format=output_format,
        model=model,
        max_tokens=max_tokens,
        temperature=temperature,
    )


async def generate_json_with_ai(
    *,
    prompt: str,
    system_prompt: str | None = None,
    model: str | None = None,
    max_tokens: int | None = None,
    temperature: float = 0.2,
) -> dict[str, Any]:
    """Helper for callers that need structured JSON output."""
    final_prompt = (
        f"{prompt.strip()}\n\n"
        "Return valid JSON only. Do not include markdown fences. "
        "Do not include commentary before or after the JSON."
    )

    text = await _call_llm(
        final_prompt,
        system_prompt=system_prompt,
        model=model,
        max_tokens=max_tokens,
        temperature=temperature,
    )

    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        logger.error("Failed to parse AI JSON output: %s", text)
        raise ValueError("AI did not return valid JSON") from exc


# ============================================================
# PROMPT LOOKUP HELPERS
# ============================================================

def get_foundation_prompt(key: str) -> str:
    return FOUNDATION_PROMPTS.get(key, FOUNDATION_PROMPTS["messaging"])


def get_content_prompt(key: str) -> str:
    return CONTENT_PROMPTS.get(key, CONTENT_PROMPTS["social_caption"])
