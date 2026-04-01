from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, EmailStr, Field


WorkflowType = Literal["daily_content_engine"]
RunStatus = Literal["queued", "running", "completed", "failed"]
TriggerMode = Literal["manual", "scheduled"]
ScheduleMode = Literal["manual", "daily", "weekly"]
ContentPackStatus = Literal[
    "pending_review",
    "approved",
    "partially_approved",
    "revision_requested",
    "rejected",
]


class BrandVoiceConfig(BaseModel):
    tone: str = ""
    banned_phrases: list[str] = Field(default_factory=list)
    cta_style: str = ""


class OutputSettings(BaseModel):
    blog_enabled: bool = True
    social_enabled: bool = True
    video_script_enabled: bool = True
    email_enabled: bool = True


class WorkflowConfigBase(BaseModel):
    workflow_type: WorkflowType = "daily_content_engine"
    is_enabled: bool = True
    schedule_mode: ScheduleMode = "manual"
    schedule_time_local: str | None = None
    timezone: str = "America/Chicago"
    delivery_channel: str = "dashboard"
    delivery_email: EmailStr | None = None
    topics: list[str] = Field(default_factory=list)
    content_pillars: list[str] = Field(default_factory=list)
    brand_voice: BrandVoiceConfig = Field(default_factory=BrandVoiceConfig)
    output_settings: OutputSettings = Field(default_factory=OutputSettings)
    approval_required: bool = True


class WorkflowConfigCreateUpdate(WorkflowConfigBase):
    pass


class WorkflowConfigRecord(WorkflowConfigBase):
    id: str
    workspace_id: str
    created_at: datetime
    updated_at: datetime


class RunWorkflowRequest(BaseModel):
    workflow_type: WorkflowType = "daily_content_engine"
    trigger_mode: TriggerMode = "manual"


class WorkflowRunRecord(BaseModel):
    id: str
    workspace_id: str
    workflow_config_id: str
    workflow_type: WorkflowType
    status: RunStatus
    trigger_mode: TriggerMode
    requested_by_user_id: str | None = None
    make_execution_id: str | None = None
    input_snapshot: dict[str, Any] = Field(default_factory=dict)
    result_summary: dict[str, Any] | None = None
    error_message: str | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime | None = None


class ContentPackRecord(BaseModel):
    id: str
    workspace_id: str
    workflow_run_id: str
    status: ContentPackStatus = "pending_review"
    assets: dict[str, Any] = Field(default_factory=dict)
    source_links: list[dict[str, str]] = Field(default_factory=list)
    review_notes: list[dict[str, Any]] = Field(default_factory=list)
    approved_assets: list[str] = Field(default_factory=list)
    rejected_assets: list[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime | None = None


class ReviewActionRequest(BaseModel):
    asset_keys: list[str] = Field(default_factory=list)
    note: str | None = None


class MakeCallbackPayload(BaseModel):
    workspace_id: str
    workflow_run_id: str
    status: Literal["completed", "failed"]
    result: dict[str, Any] | None = None
    error_message: str | None = None


class TriggerWorkflowResponse(BaseModel):
    run_id: str
    status: RunStatus
    message: str
