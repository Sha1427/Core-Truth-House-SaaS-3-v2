"""
response_service.py
Normalized response helpers for Core Truth House generation routes.

Goals:
- keep route handlers thin
- standardize success/error payloads
- provide one place to shape AI responses for the frontend
"""

from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import HTTPException

from services.prompting.generation_service import (
    GenerationError,
    generate_output,
    generate_platform_output,
    generate_tenant_output,
)


def success_response(
    *,
    output: str,
    context_type: str,
    attempts: int,
    validation: Dict[str, Any],
    meta: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    return {
        "success": True,
        "output": output,
        "context_type": context_type,
        "attempts": attempts,
        "validation": validation,
        "meta": meta or {},
    }


def failure_response(
    *,
    output: str,
    context_type: str,
    attempts: int,
    validation: Dict[str, Any],
    meta: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    return {
        "success": False,
        "output": output,
        "context_type": context_type,
        "attempts": attempts,
        "validation": validation,
        "meta": meta or {},
    }


def raise_generation_http_error(message: str, status_code: int = 400) -> None:
    raise HTTPException(status_code=status_code, detail=message)


async def run_tenant_generation(
    *,
    db,
    workspace_id: str,
    task_request: str,
    output_format: Optional[str] = None,
    additional_context=None,
    min_words: int = 20,
    required_json_keys: Optional[list[str]] = None,
    max_attempts: int = 2,
    ai_kwargs: Optional[Dict[str, Any]] = None,
    meta: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    try:
        result = await generate_tenant_output(
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
    except GenerationError as e:
        raise_generation_http_error(str(e), status_code=400)
    except Exception as e:
        raise_generation_http_error(f"Tenant generation failed: {str(e)}", status_code=500)

    if result["success"]:
        return success_response(
            output=result["output"],
            context_type=result["context_type"],
            attempts=result["attempts"],
            validation=result["validation"],
            meta=meta,
        )

    return failure_response(
        output=result["output"],
        context_type=result["context_type"],
        attempts=result["attempts"],
        validation=result["validation"],
        meta=meta,
    )


async def run_platform_generation(
    *,
    task_request: str,
    output_format: Optional[str] = None,
    min_words: int = 20,
    required_json_keys: Optional[list[str]] = None,
    max_attempts: int = 2,
    ai_kwargs: Optional[Dict[str, Any]] = None,
    meta: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    try:
        result = await generate_platform_output(
            task_request=task_request,
            output_format=output_format,
            min_words=min_words,
            required_json_keys=required_json_keys,
            max_attempts=max_attempts,
            ai_kwargs=ai_kwargs,
        )
    except GenerationError as e:
        raise_generation_http_error(str(e), status_code=400)
    except Exception as e:
        raise_generation_http_error(f"Platform generation failed: {str(e)}", status_code=500)

    if result["success"]:
        return success_response(
            output=result["output"],
            context_type=result["context_type"],
            attempts=result["attempts"],
            validation=result["validation"],
            meta=meta,
        )

    return failure_response(
        output=result["output"],
        context_type=result["context_type"],
        attempts=result["attempts"],
        validation=result["validation"],
        meta=meta,
    )


async def run_generation(
    *,
    mode: str,
    task_request: str,
    db=None,
    workspace_id: Optional[str] = None,
    output_format: Optional[str] = None,
    additional_context=None,
    min_words: int = 20,
    required_json_keys: Optional[list[str]] = None,
    max_attempts: int = 2,
    ai_kwargs: Optional[Dict[str, Any]] = None,
    meta: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    try:
        result = await generate_output(
            mode=mode,
            task_request=task_request,
            db=db,
            workspace_id=workspace_id,
            output_format=output_format,
            additional_context=additional_context,
            min_words=min_words,
            required_json_keys=required_json_keys,
            max_attempts=max_attempts,
            ai_kwargs=ai_kwargs,
        )
    except GenerationError as e:
        raise_generation_http_error(str(e), status_code=400)
    except Exception as e:
        raise_generation_http_error(f"Generation failed: {str(e)}", status_code=500)

    if result["success"]:
        return success_response(
            output=result["output"],
            context_type=result["context_type"],
            attempts=result["attempts"],
            validation=result["validation"],
            meta=meta,
        )

    return failure_response(
        output=result["output"],
        context_type=result["context_type"],
        attempts=result["attempts"],
        validation=result["validation"],
        meta=meta,
    )
