from __future__ import annotations

import secrets
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel, ConfigDict, EmailStr, Field

from dependencies.auth_context import (
    get_request_context,
    require_authenticated_user,
)
from middleware.tenant_dependencies import (
    audit_actor_metadata,
    enforce_workspace_match,
    get_db_from_request,
    require_platform_admin,
    require_tenant_admin,
    require_tenant_member,
)
from middleware.feature_gate import (
    require_feature,
    require_below_team_member_limit,
)
from backend.services import send_email, team_invite_html


router = APIRouter(prefix="/api/teams", tags=["teams"])


ALLOWED_ROLES = {"owner", "admin", "editor", "member", "viewer", "billing", "guest"}
MANAGEABLE_ROLES = {"admin", "editor", "member", "viewer", "billing", "guest"}

TEAM_MEMBER_COLLECTION_CANDIDATES = ["team_members"]
WORKSPACE_MEMBER_COLLECTION_CANDIDATES = ["workspace_members"]
WORKSPACE_COLLECTION_CANDIDATES = ["workspaces"]
USER_COLLECTION_CANDIDATES = ["users"]
AI_USAGE_COLLECTION_CANDIDATES = ["ai_usage"]
CONTENT_COLLECTION_CANDIDATES = ["content_assets"]


class TeamMember(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    workspace_id: str
    user_id: str | None = None
    email: EmailStr
    name: str = ""
    role: str = "member"
    status: str = "active"
    invited_by: str = ""
    invite_token: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    resent_at: datetime | None = None
    last_active_at: datetime | None = None


class InviteMemberRequest(BaseModel):
    email: EmailStr
    name: str = ""
    role: str = "member"


class UpdateMemberRoleRequest(BaseModel):
    role: str


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _iso(value: Any) -> Any:
    if isinstance(value, datetime):
        return value.isoformat()
    return value


def _serialize_member(member: dict[str, Any]) -> dict[str, Any]:
    clean = {k: v for k, v in member.items() if k != "_id"}
    for key, value in list(clean.items()):
        clean[key] = _iso(value)
    return clean


async def _find_existing_collection(db, candidates: list[str]) -> str | None:
    names = set(await db.list_collection_names())
    for candidate in candidates:
        if candidate in names:
            return candidate
    return None


async def _get_team_members_collection(db):
    name = await _find_existing_collection(db, TEAM_MEMBER_COLLECTION_CANDIDATES)
    if not name:
        raise HTTPException(status_code=500, detail="Team members collection is not configured")
    return getattr(db, name)


async def _get_workspace_members_collection(db):
    name = await _find_existing_collection(db, WORKSPACE_MEMBER_COLLECTION_CANDIDATES)
    if not name:
        raise HTTPException(status_code=500, detail="Workspace members collection is not configured")
    return getattr(db, name)


async def _get_workspaces_collection(db):
    name = await _find_existing_collection(db, WORKSPACE_COLLECTION_CANDIDATES)
    if not name:
        raise HTTPException(status_code=500, detail="Workspaces collection is not configured")
    return getattr(db, name)


async def _get_users_collection(db):
    name = await _find_existing_collection(db, USER_COLLECTION_CANDIDATES)
    if not name:
        raise HTTPException(status_code=500, detail="Users collection is not configured")
    return getattr(db, name)


async def _resolve_workspace(db, workspace_id: str) -> dict[str, Any]:
    workspaces = await _get_workspaces_collection(db)
    workspace = await workspaces.find_one(
        {"$or": [{"id": workspace_id}, {"workspace_id": workspace_id}]},
        {"_id": 0},
    )
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return workspace


def _canonical_workspace_id(workspace: dict[str, Any], fallback: str) -> str:
    return str(workspace.get("id") or workspace.get("workspace_id") or fallback).strip()


async def _ensure_workspace_scope(
    request: Request,
    workspace_id: str,
) -> tuple[dict[str, Any], str]:
    context = get_request_context(request)
    tenant = require_tenant_member(request)

    resolved_workspace_id = enforce_workspace_match(
        tenant,
        workspace_id,
        allow_super_admin=True,
    )
    return context, resolved_workspace_id


async def _ensure_workspace_admin_scope(
    request: Request,
    workspace_id: str,
) -> tuple[dict[str, Any], str]:
    context = get_request_context(request)
    tenant = require_tenant_admin(request)

    resolved_workspace_id = enforce_workspace_match(
        tenant,
        workspace_id,
        allow_super_admin=True,
    )
    return context, resolved_workspace_id


async def _current_team_member_count(db, workspace_id: str) -> int:
    team_members = await _get_team_members_collection(db)
    return await team_members.count_documents(
        {
            "workspace_id": workspace_id,
            "status": {"$in": ["active", "pending"]},
        }
    )


async def _ensure_owner_shadow_member(db, workspace: dict[str, Any]) -> None:
    team_members = await _get_team_members_collection(db)

    workspace_id = _canonical_workspace_id(workspace, "")
    owner_id = str(workspace.get("owner_id") or "").strip()
    owner_email = str(workspace.get("owner_email") or "").strip().lower()
    owner_name = str(workspace.get("name") or "Workspace Owner").strip()

    if not workspace_id or not owner_id:
        return

    existing = await team_members.find_one(
        {
            "workspace_id": workspace_id,
            "role": "owner",
        },
        {"_id": 0},
    )

    if existing:
        updates: dict[str, Any] = {}
        if existing.get("status") != "active":
            updates["status"] = "active"
        if str(existing.get("user_id") or "") != owner_id:
            updates["user_id"] = owner_id
        if owner_email and str(existing.get("email") or "").strip().lower() != owner_email:
            updates["email"] = owner_email
        if owner_name and str(existing.get("name") or "").strip() != owner_name:
            updates["name"] = owner_name

        if updates:
            updates["updated_at"] = _utcnow()
            await team_members.update_one(
                {"workspace_id": workspace_id, "role": "owner"},
                {"$set": updates},
            )
        return

    await team_members.insert_one(
        {
            "id": str(uuid.uuid4()),
            "workspace_id": workspace_id,
            "user_id": owner_id,
            "email": owner_email,
            "name": owner_name,
            "role": "owner",
            "status": "active",
            "invited_by": "",
            "invite_token": None,
            "created_at": _utcnow(),
            "resent_at": None,
            "last_active_at": None,
        }
    )


async def _get_user_display_name(db, user_id: str) -> str:
    users = await _get_users_collection(db)
    user = await users.find_one({"id": user_id}, {"_id": 0, "name": 1, "email": 1})
    if not user:
        return user_id
    return str(user.get("name") or user.get("email") or user_id)


async def _get_user_email(db, user_id: str) -> str | None:
    users = await _get_users_collection(db)
    user = await users.find_one({"id": user_id}, {"_id": 0, "email": 1})
    if not user:
        return None
    email = str(user.get("email") or "").strip().lower()
    return email or None


async def _upsert_workspace_member(
    db,
    *,
    workspace_id: str,
    user_id: str,
    role: str,
    email: str | None = None,
    name: str | None = None,
) -> None:
    workspace_members = await _get_workspace_members_collection(db)

    update_doc: dict[str, Any] = {
        "workspace_id": workspace_id,
        "user_id": user_id,
        "role": role,
        "status": "active",
        "updated_at": _utcnow(),
    }
    if email:
        update_doc["email"] = email
    if name:
        update_doc["name"] = name

    await workspace_members.update_one(
        {
            "workspace_id": workspace_id,
            "user_id": user_id,
        },
        {
            "$set": update_doc,
            "$setOnInsert": {
                "id": str(uuid.uuid4()),
                "created_at": _utcnow(),
            },
        },
        upsert=True,
    )


async def _send_invitation_email(
    *,
    workspace_name: str,
    inviter_name: str,
    email: str,
    invite_token: str,
) -> None:
    try:
        html = team_invite_html(workspace_name, inviter_name, invite_token)
        await send_email(
            to=email,
            subject=f"You're invited to {workspace_name} on Core Truth House",
            html=html,
        )
    except Exception:
        # intentionally swallow email transport failures here
        # invite creation should not hard-fail because of email delivery
        pass


async def _get_activity_summary_data(db, workspace_id: str) -> dict[str, Any]:
    collection_names = set(await db.list_collection_names())

    total_used = 0
    credits_by_member: dict[str, int] = {}
    content_count = 0

    if "ai_usage" in collection_names:
        ai_usage = getattr(db, "ai_usage")
        credit_docs = await ai_usage.find(
            {"workspace_id": workspace_id},
            {"_id": 0},
        ).to_list(length=500)

        total_used = sum(int(doc.get("generation_count", 0) or 0) for doc in credit_docs)

        for doc in credit_docs:
            uid = str(doc.get("user_id") or "unknown")
            credits_by_member[uid] = credits_by_member.get(uid, 0) + int(doc.get("generation_count", 0) or 0)

    if "content_assets" in collection_names:
        content_assets = getattr(db, "content_assets")
        content_count = await content_assets.count_documents({"workspace_id": workspace_id})

    return {
        "total_credits_used": total_used,
        "credits_by_member": credits_by_member,
        "content_generated": content_count,
    }


@router.get("/{workspace_id}/members")
async def get_members(workspace_id: str, request: Request):
    db = get_db_from_request(request)

    await require_feature(request, "team_invite", workspace_id=workspace_id)

    _, resolved_workspace_id = await _ensure_workspace_scope(request, workspace_id)

    workspace = await _resolve_workspace(db, resolved_workspace_id)
    canonical_workspace_id = _canonical_workspace_id(workspace, resolved_workspace_id)

    await _ensure_owner_shadow_member(db, workspace)

    team_members = await _get_team_members_collection(db)
    members = await team_members.find(
        {"workspace_id": canonical_workspace_id},
        {"_id": 0},
    ).sort("created_at", 1).to_list(length=250)

    return {
        "workspace_id": canonical_workspace_id,
        "members": [_serialize_member(member) for member in members],
    }


@router.post("/{workspace_id}/invite")
async def invite_member(workspace_id: str, data: InviteMemberRequest, request: Request):
    db = get_db_from_request(request)

    await require_feature(request, "team_invite", workspace_id=workspace_id)

    context, resolved_workspace_id = await _ensure_workspace_admin_scope(request, workspace_id)

    if data.role not in MANAGEABLE_ROLES:
        raise HTTPException(
            status_code=400,
            detail=f"Role must be one of: {', '.join(sorted(MANAGEABLE_ROLES))}",
        )

    current_usage = await _current_team_member_count(db, resolved_workspace_id)
    await require_below_team_member_limit(
        request,
        current_usage=current_usage,
        workspace_id=resolved_workspace_id,
    )

    workspace = await _resolve_workspace(db, resolved_workspace_id)
    canonical_workspace_id = _canonical_workspace_id(workspace, resolved_workspace_id)

    team_members = await _get_team_members_collection(db)
    existing = await team_members.find_one(
        {
            "workspace_id": canonical_workspace_id,
            "email": str(data.email).strip().lower(),
        },
        {"_id": 0},
    )
    if existing:
        raise HTTPException(status_code=409, detail="User is already invited or already a member")

    invite_token = secrets.token_urlsafe(24)

    member = TeamMember(
        workspace_id=canonical_workspace_id,
        email=str(data.email).strip().lower(),
        name=data.name,
        role=data.role,
        status="pending",
        invited_by=str(context["user_id"]),
        invite_token=invite_token,
    )

    doc = member.model_dump()
    await team_members.insert_one(doc)

    inviter_name = await _get_user_display_name(db, str(context["user_id"]))
    await _send_invitation_email(
        workspace_name=str(workspace.get("name") or "Workspace"),
        inviter_name=inviter_name,
        email=member.email,
        invite_token=invite_token,
    )

    return {
        "success": True,
        "workspace_id": canonical_workspace_id,
        "member": {
            "id": member.id,
            "email": member.email,
            "name": member.name,
            "role": member.role,
            "status": member.status,
            "invite_token": invite_token,
        },
        "audit": audit_actor_metadata(require_tenant_admin(request)),
    }


@router.post("/accept-invite")
async def accept_invite(request: Request, token: str = Query(...)):
    require_authenticated_user(request)
    context = get_request_context(request)
    db = get_db_from_request(request)

    team_members = await _get_team_members_collection(db)
    member = await team_members.find_one(
        {"invite_token": token, "status": "pending"},
        {"_id": 0},
    )
    if not member:
        raise HTTPException(status_code=404, detail="Invalid or expired invitation")

    current_user_id = str(context["user_id"])
    current_user_email = await _get_user_email(db, current_user_id)
    invited_email = str(member.get("email") or "").strip().lower()

    if (
        current_user_email
        and invited_email
        and current_user_email != invited_email
        and not bool(context.get("is_super_admin"))
    ):
        raise HTTPException(
            status_code=403,
            detail="This invitation was sent to a different email address",
        )

    now = _utcnow()
    workspace_id = str(member["workspace_id"])
    role = str(member.get("role") or "member")
    user_name = await _get_user_display_name(db, current_user_id)

    await team_members.update_one(
        {"invite_token": token},
        {
            "$set": {
                "status": "active",
                "user_id": current_user_id,
                "invite_token": None,
                "last_active_at": now,
                "name": member.get("name") or user_name,
                "updated_at": now,
            }
        },
    )

    await _upsert_workspace_member(
        db,
        workspace_id=workspace_id,
        user_id=current_user_id,
        role=role,
        email=current_user_email,
        name=str(member.get("name") or user_name),
    )

    return {
        "success": True,
        "workspace_id": workspace_id,
        "message": "Invitation accepted",
    }


@router.put("/{workspace_id}/members/{member_id}/role")
async def update_member_role(
    workspace_id: str,
    member_id: str,
    data: UpdateMemberRoleRequest,
    request: Request,
):
    db = get_db_from_request(request)

    await require_feature(request, "team_invite", workspace_id=workspace_id)

    _, resolved_workspace_id = await _ensure_workspace_admin_scope(request, workspace_id)

    if data.role not in ALLOWED_ROLES:
        raise HTTPException(
            status_code=400,
            detail=f"Role must be one of: {', '.join(sorted(ALLOWED_ROLES))}",
        )

    if data.role == "owner":
        raise HTTPException(status_code=400, detail="Transfer ownership through a dedicated flow")

    workspace = await _resolve_workspace(db, resolved_workspace_id)
    canonical_workspace_id = _canonical_workspace_id(workspace, resolved_workspace_id)

    team_members = await _get_team_members_collection(db)
    member = await team_members.find_one(
        {"id": member_id, "workspace_id": canonical_workspace_id},
        {"_id": 0},
    )
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    if member.get("role") == "owner":
        raise HTTPException(status_code=400, detail="Cannot change workspace owner role")

    await team_members.update_one(
        {"id": member_id, "workspace_id": canonical_workspace_id},
        {
            "$set": {
                "role": data.role,
                "updated_at": _utcnow(),
            }
        },
    )

    if member.get("user_id"):
        await _upsert_workspace_member(
            db,
            workspace_id=canonical_workspace_id,
            user_id=str(member["user_id"]),
            role=data.role,
            email=str(member.get("email") or "") or None,
            name=str(member.get("name") or "") or None,
        )

    return {
        "success": True,
        "workspace_id": canonical_workspace_id,
        "message": f"Role updated to {data.role}",
    }


@router.delete("/{workspace_id}/members/{member_id}")
async def remove_member(workspace_id: str, member_id: str, request: Request):
    db = get_db_from_request(request)

    await require_feature(request, "team_invite", workspace_id=workspace_id)

    _, resolved_workspace_id = await _ensure_workspace_admin_scope(request, workspace_id)

    workspace = await _resolve_workspace(db, resolved_workspace_id)
    canonical_workspace_id = _canonical_workspace_id(workspace, resolved_workspace_id)

    team_members = await _get_team_members_collection(db)
    member = await team_members.find_one(
        {"id": member_id, "workspace_id": canonical_workspace_id},
        {"_id": 0},
    )
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    if member.get("role") == "owner":
        raise HTTPException(status_code=400, detail="Cannot remove workspace owner")

    await team_members.delete_one(
        {"id": member_id, "workspace_id": canonical_workspace_id},
    )

    if member.get("user_id"):
        workspace_members = await _get_workspace_members_collection(db)
        await workspace_members.delete_one(
            {
                "workspace_id": canonical_workspace_id,
                "user_id": str(member["user_id"]),
            }
        )

    return {
        "success": True,
        "workspace_id": canonical_workspace_id,
        "message": "Member removed",
    }


@router.get("/{workspace_id}/pending-invites")
async def get_pending_invites(workspace_id: str, request: Request):
    db = get_db_from_request(request)

    await require_feature(request, "team_invite", workspace_id=workspace_id)

    _, resolved_workspace_id = await _ensure_workspace_admin_scope(request, workspace_id)

    workspace = await _resolve_workspace(db, resolved_workspace_id)
    canonical_workspace_id = _canonical_workspace_id(workspace, resolved_workspace_id)

    team_members = await _get_team_members_collection(db)
    invites = await team_members.find(
        {
            "workspace_id": canonical_workspace_id,
            "status": "pending",
        },
        {"_id": 0},
    ).sort("created_at", -1).to_list(length=100)

    return {
        "workspace_id": canonical_workspace_id,
        "invites": [_serialize_member(invite) for invite in invites],
    }


@router.delete("/{workspace_id}/pending-invites/{invite_id}")
async def cancel_invite(workspace_id: str, invite_id: str, request: Request):
    db = get_db_from_request(request)

    await require_feature(request, "team_invite", workspace_id=workspace_id)

    _, resolved_workspace_id = await _ensure_workspace_admin_scope(request, workspace_id)

    workspace = await _resolve_workspace(db, resolved_workspace_id)
    canonical_workspace_id = _canonical_workspace_id(workspace, resolved_workspace_id)

    team_members = await _get_team_members_collection(db)
    result = await team_members.delete_one(
        {
            "id": invite_id,
            "workspace_id": canonical_workspace_id,
            "status": "pending",
        }
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Invite not found")

    return {
        "success": True,
        "workspace_id": canonical_workspace_id,
    }


@router.post("/{workspace_id}/pending-invites/{invite_id}/resend")
async def resend_invite(workspace_id: str, invite_id: str, request: Request):
    db = get_db_from_request(request)

    await require_feature(request, "team_invite", workspace_id=workspace_id)

    context, resolved_workspace_id = await _ensure_workspace_admin_scope(request, workspace_id)

    workspace = await _resolve_workspace(db, resolved_workspace_id)
    canonical_workspace_id = _canonical_workspace_id(workspace, resolved_workspace_id)

    team_members = await _get_team_members_collection(db)
    invite = await team_members.find_one(
        {
            "id": invite_id,
            "workspace_id": canonical_workspace_id,
            "status": "pending",
        },
        {"_id": 0},
    )
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")

    resent_at = _utcnow()
    await team_members.update_one(
        {"id": invite_id, "workspace_id": canonical_workspace_id},
        {"$set": {"resent_at": resent_at, "updated_at": resent_at}},
    )

    inviter_name = await _get_user_display_name(db, str(context["user_id"]))
    await _send_invitation_email(
        workspace_name=str(workspace.get("name") or "Workspace"),
        inviter_name=inviter_name,
        email=str(invite["email"]),
        invite_token=str(invite.get("invite_token") or ""),
    )

    return {
        "success": True,
        "workspace_id": canonical_workspace_id,
    }


@router.get("/{workspace_id}/activity-summary")
async def get_activity_summary(workspace_id: str, request: Request):
    db = get_db_from_request(request)

    await require_feature(request, "team_invite", workspace_id=workspace_id)

    _, resolved_workspace_id = await _ensure_workspace_scope(request, workspace_id)

    workspace = await _resolve_workspace(db, resolved_workspace_id)
    canonical_workspace_id = _canonical_workspace_id(workspace, resolved_workspace_id)

    summary = await _get_activity_summary_data(db, canonical_workspace_id)

    return {
        "workspace_id": canonical_workspace_id,
        **summary,
    }


@router.get("/admin/portfolio")
async def admin_team_portfolio(
    request: Request,
    limit: int = Query(default=100, ge=1, le=500),
):
    require_platform_admin(request)
    db = get_db_from_request(request)

    team_members = await _get_team_members_collection(db)
    workspaces = await _get_workspaces_collection(db)

    workspace_docs = await workspaces.find(
        {},
        {"_id": 0, "id": 1, "workspace_id": 1, "name": 1, "status": 1, "plan_id": 1},
    ).sort("created_at", -1).to_list(length=limit)

    rows: list[dict[str, Any]] = []
    for workspace in workspace_docs:
        canonical_workspace_id = _canonical_workspace_id(workspace, "")

        if not canonical_workspace_id:
            continue

        active_members = await team_members.count_documents(
            {
                "workspace_id": canonical_workspace_id,
                "status": "active",
            }
        )
        pending_invites = await team_members.count_documents(
            {
                "workspace_id": canonical_workspace_id,
                "status": "pending",
            }
        )

        rows.append(
            {
                "workspace_id": canonical_workspace_id,
                "name": workspace.get("name"),
                "status": workspace.get("status"),
                "plan_id": workspace.get("plan_id"),
                "active_members": active_members,
                "pending_invites": pending_invites,
                "total_team_records": active_members + pending_invites,
            }
        )

    rows.sort(
        key=lambda item: (
            item.get("active_members", 0),
            item.get("pending_invites", 0),
            item.get("total_team_records", 0),
        ),
        reverse=True,
    )

    return {
        "workspaces": rows,
        "total": len(rows),
    }
