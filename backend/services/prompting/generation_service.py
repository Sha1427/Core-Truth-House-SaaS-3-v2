"""
generation_service.py
Unified AI generation service for Core Truth House.

Responsibilities:
- build the right prompt
- choose platform or tenant context
- call the AI model
- validate the output
- retry once if the output is weak/generic
- optionally enforce required JSON keys

This file assumes you already have:
- services.prompting.prompt_builder
- services.prompting.validators
- services.ai.generate_with_ai
"""

from __future__ import annotations

import json
from typing import Any, Dict, Iterable, Optional

from services.ai import generate_with_ai
from services.prompting.prompt_builder import (
    build_platform_copy_prompt,
    build_tenant_generation_prompt,
)
from services.prompting.validators import (
    validate_output,
    validate_json_like_payload,
)


DEFAULT_REPAIR_INSTRUCTIONS = """
Your previous output was too vague, too generic, too hype-driven, too thin, or structurally incomplete.

Rewrite it using these rules:
- be more specific
- use clearer strategic language
- remove hype and filler
- make the output more actionable
- follow the requested structure exactly
""".strip()


class GenerationError(Exception):
    pass


def _safe_strip(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


def _try_parse_json(text: str) -> Optional[Dict[str, Any]]:
    try:
        return json.loads(text)
    except Exception:
        return None


def _append_repair_feedback(
    task_request: str,
    validation: Dict[str, Any],
    required_json_keys: Optional[list[str]] = None,
) -> str:
    issues = validation.get("issues", []) or []
    lines = [
        task_request.strip(),
        "",
        "REVISION FEEDBACK",
        DEFAULT_REPAIR_INSTRUCTIONS,
    ]

    if issues:
        lines.append("")
        lines.append("Problems detected:")
        lines.extend([f"- {issue}" for issue in issues])

    if required_json_keys:
        lines.append("")
        lines.append("Required JSON keys:")
        lines.extend([f"- {key}" for key in required_json_keys])

    return "\n".join(lines).strip()


async def _run_ai(prompt: str, **kwargs) -> str:
    """
    Thin wrapper over your AI service.
    Adjust kwargs if your generate_with_ai signature is different.
    """
    result = await generate_with_ai(prompt, **kwargs)
    if not isinstance(result, str):
        result = str(result)
    return result.strip()


async def generate_tenant_output(
    *,
    db,
    workspace_id: str,
    task_request: str,
    output_format: Optional[str] = None,
    additional_context: Optional[Iterable[str]] = None,
    min_words: int = 20,
    required_json_keys: Optional[list[str]] = None,
    max_attempts: int = 2,
    ai_kwargs: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Tenant-facing generation.

    Uses:
    - tenant brand context
    - Core Truth House method
    - validation + one repair pass
    """
    if not workspace_id:
        raise GenerationError("workspace_id is required for tenant generation.")

    ai_kwargs = ai_kwargs or {}

    prompt = await build_tenant_generation_prompt(
        db=db,
        workspace_id=workspace_id,
        task_request=task_request,
        output_format=output_format,
        additional_context=additional_context,
    )

    attempts = 0
    last_output = ""
    last_validation: Dict[str, Any] = {"valid": False, "issues": ["No output generated."]}

    while attempts < max_attempts:
        attempts += 1
        output = await _run_ai(prompt, **ai_kwargs)
        last_output = output

        validation = validate_output(output, min_words=min_words)

        if required_json_keys:
            parsed = _try_parse_json(output)
            if not parsed:
                validation["valid"] = False
                validation.setdefault("issues", []).append("Output is not valid JSON.")
            else:
                json_validation = validate_json_like_payload(parsed, required_json_keys)
                if not json_validation["valid"]:
                    validation["valid"] = False
                    validation.setdefault("issues", []).append(
                        f"Missing required JSON keys: {', '.join(json_validation['missing_keys'])}"
                    )

        last_validation = validation

        if validation["valid"]:
            return {
                "success": True,
                "output": output,
                "attempts": attempts,
                "validation": validation,
                "context_type": "tenant",
            }

        if attempts < max_attempts:
            revised_task = _append_repair_feedback(
                task_request=task_request,
                validation=validation,
                required_json_keys=required_json_keys,
            )

            prompt = await build_tenant_generation_prompt(
                db=db,
                workspace_id=workspace_id,
                task_request=revised_task,
                output_format=output_format,
                additional_context=additional_context,
            )

    return {
        "success": False,
        "output": last_output,
        "attempts": attempts,
        "validation": last_validation,
        "context_type": "tenant",
    }


async def generate_platform_output(
    *,
    task_request: str,
    output_format: Optional[str] = None,
    min_words: int = 20,
    required_json_keys: Optional[list[str]] = None,
    max_attempts: int = 2,
    ai_kwargs: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Platform-owned generation.

    Use this for:
    - homepage copy
    - onboarding copy
    - docs/help center
    - admin/system announcements
    """
    ai_kwargs = ai_kwargs or {}

    prompt = build_platform_copy_prompt(
        task_request=task_request,
        output_format=output_format,
    )

    attempts = 0
    last_output = ""
    last_validation: Dict[str, Any] = {"valid": False, "issues": ["No output generated."]}

    while attempts < max_attempts:
        attempts += 1
        output = await _run_ai(prompt, **ai_kwargs)
        last_output = output

        validation = validate_output(output, min_words=min_words)

        if required_json_keys:
            parsed = _try_parse_json(output)
            if not parsed:
                validation["valid"] = False
                validation.setdefault("issues", []).append("Output is not valid JSON.")
            else:
                json_validation = validate_json_like_payload(parsed, required_json_keys)
                if not json_validation["valid"]:
                    validation["valid"] = False
                    validation.setdefault("issues", []).append(
                        f"Missing required JSON keys: {', '.join(json_validation['missing_keys'])}"
                    )

        last_validation = validation

        if validation["valid"]:
            return {
                "success": True,
                "output": output,
                "attempts": attempts,
                "validation": validation,
                "context_type": "platform",
            }

        if attempts < max_attempts:
            revised_task = _append_repair_feedback(
                task_request=task_request,
                validation=validation,
                required_json_keys=required_json_keys,
            )

            prompt = build_platform_copy_prompt(
                task_request=revised_task,
                output_format=output_format,
            )

    return {
        "success": False,
        "output": last_output,
        "attempts": attempts,
        "validation": last_validation,
        "context_type": "platform",
    }


async def generate_output(
    *,
    mode: str,
    task_request: str,
    db=None,
    workspace_id: Optional[str] = None,
    output_format: Optional[str] = None,
    additional_context: Optional[Iterable[str]] = None,
    min_words: int = 20,
    required_json_keys: Optional[list[str]] = None,
    max_attempts: int = 2,
    ai_kwargs: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Convenience wrapper.

    mode:
    - "tenant"
    - "platform"
    """
    mode = _safe_strip(mode).lower()

    if mode == "tenant":
        if db is None:
            raise GenerationError("db is required for tenant generation.")
        if not workspace_id:
            raise GenerationError("workspace_id is required for tenant generation.")

        return await generate_tenant_output(
            db=db,
            workspace_id=workspace_id,
            task_request=task_request,
            output_format=output_format,
            additional_context=additional_context,
            min_words=min_words,
            required_json_keys=required_json_keys,
            max_attempts=max_attempts,
            ai_kwargs=ai_kwargs,
        )

    if mode == "platform":
        return await generate_platform_output(
            task_request=task_request,
            output_format=output_format,
            min_words=min_words,
            required_json_keys=required_json_keys,
            max_attempts=max_attempts,
            ai_kwargs=ai_kwargs,
        )

    raise GenerationError(f"Unsupported generation mode: {mode}")
