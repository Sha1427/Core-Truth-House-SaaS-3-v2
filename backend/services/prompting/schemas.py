"""
schemas.py
Pydantic schemas for Core Truth House prompting and generation flows.
"""

from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field, ConfigDict


GenerationMode = Literal["tenant", "platform"]


class GenerationRequest(BaseModel):
    """
    Generic request model for generation endpoints.
    """
    model_config = ConfigDict(extra="ignore")

    mode: GenerationMode = Field(
        default="tenant",
        description="Whether to generate tenant-owned output or platform-owned output.",
    )
    task: str = Field(
        ...,
        min_length=3,
        description="The actual generation request.",
    )
    output_format: Optional[str] = Field(
        default=None,
        description="Optional structure or output formatting instructions.",
    )
    additional_context: List[str] = Field(
        default_factory=list,
        description="Optional extra context lines.",
    )
    min_words: int = Field(
        default=20,
        ge=0,
        le=5000,
        description="Minimum word count validator threshold.",
    )
    required_json_keys: List[str] = Field(
        default_factory=list,
        description="Keys that must exist if the output is expected to be JSON.",
    )
    max_attempts: int = Field(
        default=2,
        ge=1,
        le=5,
        description="How many tries the system should make before returning failure.",
    )
    meta: Dict[str, Any] = Field(
        default_factory=dict,
        description="Optional metadata passed through to the response.",
    )


class TenantGenerationRequest(BaseModel):
    """
    Explicit tenant generation schema.
    Useful for tenant-facing endpoints where mode is always tenant.
    """
    model_config = ConfigDict(extra="ignore")

    task: str = Field(..., min_length=3)
    output_format: Optional[str] = None
    additional_context: List[str] = Field(default_factory=list)
    min_words: int = Field(default=20, ge=0, le=5000)
    required_json_keys: List[str] = Field(default_factory=list)
    max_attempts: int = Field(default=2, ge=1, le=5)
    meta: Dict[str, Any] = Field(default_factory=dict)


class PlatformGenerationRequest(BaseModel):
    """
    Explicit platform generation schema.
    Useful for Core Truth House platform copy generation.
    """
    model_config = ConfigDict(extra="ignore")

    task: str = Field(..., min_length=3)
    output_format: Optional[str] = None
    min_words: int = Field(default=20, ge=0, le=5000)
    required_json_keys: List[str] = Field(default_factory=list)
    max_attempts: int = Field(default=2, ge=1, le=5)
    meta: Dict[str, Any] = Field(default_factory=dict)


class ValidationResult(BaseModel):
    model_config = ConfigDict(extra="ignore")

    valid: bool
    issues: List[str] = Field(default_factory=list)
    word_count: int = 0


class GenerationResponse(BaseModel):
    """
    Normalized response for all generation routes.
    """
    model_config = ConfigDict(extra="ignore")

    success: bool
    output: str
    context_type: Literal["tenant", "platform"]
    attempts: int
    validation: ValidationResult
    meta: Dict[str, Any] = Field(default_factory=dict)
