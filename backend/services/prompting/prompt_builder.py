"""
prompt_builder.py
Unified prompt assembly for Core Truth House.

This file separates:
- System behavior rules
- Platform methodology
- Tenant brand context
- Task request
"""

from __future__ import annotations

from typing import Iterable, Optional

from backend.constants.core_truth_house_brand import (
    PLATFORM_VOICE_PROMPT,
    get_platform_method_rules,
)
from backend.services.prompting.tenant_context import build_tenant_context


def build_system_rules() -> str:
    rules = [
        "You are generating content inside Core Truth House.",
        "Follow the requested output format exactly.",
        "Be specific, strategic, and concrete.",
        "Avoid vague filler, hype, and generic marketing language.",
        "Do not invent tenant facts that were not provided.",
        "When information is missing, make the safest reasonable assumption and keep it minimal.",
    ]
    return "\n".join(f"- {rule}" for rule in rules)


def build_product_method_context() -> str:
    rules = get_platform_method_rules()
    joined = "\n".join(f"- {rule}" for rule in rules)
    return (
        "CORE TRUTH HOUSE METHOD\n"
        "Apply the platform methodology below to the tenant request.\n"
        f"{joined}\n\n"
        f"{PLATFORM_VOICE_PROMPT}"
    )


def _normalize_output_format(output_format: Optional[str]) -> str:
    if not output_format:
        return ""
    return f"OUTPUT FORMAT\n{output_format.strip()}"


def _normalize_task_request(task_request: str) -> str:
    return f"TASK REQUEST\n{task_request.strip()}"


async def build_tenant_generation_prompt(
    db,
    workspace_id: str,
    task_request: str,
    output_format: Optional[str] = None,
    additional_context: Optional[Iterable[str]] = None,
) -> str:
    """
    Main prompt builder for tenant-facing AI generation.
    """
    tenant_context = await build_tenant_context(db, workspace_id)

    sections = [
        "SYSTEM RULES",
        build_system_rules(),
        "",
        build_product_method_context(),
        "",
        tenant_context,
        "",
    ]

    if additional_context:
        cleaned = [str(item).strip() for item in additional_context if str(item).strip()]
        if cleaned:
            sections.extend([
                "ADDITIONAL CONTEXT",
                "\n".join(f"- {item}" for item in cleaned),
                "",
            ])

    output_block = _normalize_output_format(output_format)
    if output_block:
        sections.extend([output_block, ""])

    sections.append(_normalize_task_request(task_request))

    return "\n".join(sections).strip()


def build_platform_copy_prompt(
    task_request: str,
    output_format: Optional[str] = None,
) -> str:
    """
    Use this for Core Truth House marketing or platform-owned copy.
    Not for tenant brand generation.
    """
    sections = [
        "SYSTEM RULES",
        build_system_rules(),
        "",
        "PLATFORM COPY CONTEXT",
        build_product_method_context(),
        "",
    ]

    output_block = _normalize_output_format(output_format)
    if output_block:
        sections.extend([output_block, ""])

    sections.append(_normalize_task_request(task_request))
    return "\n".join(sections).strip()
