from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status

from backend.app.core.auth import get_current_user

router = APIRouter()


def _string(value: Any) -> str:
    return str(value or "").strip()


def _normalize_workspace(doc: dict[str, Any], user_id: str) -> dict[str, Any]:
    workspace_id = (
        _string(doc.get("workspace_id"))
        or _string(doc.get("id"))
        or _string(doc.get("workspaceId"))
        or _string(doc.get("org_id"))
        or _string(doc.get("organization_id"))
    )

    if not workspace_id:
        return {}

    name = (
        _string(doc.get("name"))
        or _string(doc.get("workspace_name"))
        or _string(doc.get("title"))
        or "Workspace"
    )

    role = (
        _string(doc.get("role"))
        or _string(doc.get("workspace_role"))
        or _string(doc.get("member_role"))
        or "member"
    )

    owner_id = (
        _string(doc.get("owner_id"))
        or _string(doc.get("created_by"))
        or user_id
    )

    plan = (
        _string(doc.get("plan"))
        or _string(doc.get("plan_name"))
        or _string(doc.get("subscription_plan"))
        or "free"
    )

    return {
        "id": workspace_id,
        "workspace_id": workspace_id,
        "name": name,
        "owner_id": owner_id,
        "role": role.lower(),
        "plan": plan.lower(),
        "status": _string(doc.get("status")) or "active",
    }


async def _get_db(request: Request):
    db = getattr(request.app.state, "db", None)
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not initialized",
        )
    return db


async def _list_collection_names(db) -> set[str]:
    try:
        return set(await db.list_collection_names())
    except Exception:
        return set()


async def _load_workspaces_from_memberships(db, user: dict[str, Any]) -> list[dict[str, Any]]:
    collection_names = await _list_collection_names(db)
    user_id = _string(user.get("user_id") or user.get("id"))
    workspace_id_from_auth = _string(user.get("workspace_id"))
    is_super_admin = bool(user.get("is_super_admin", False))

    results: list[dict[str, Any]] = []
    seen: set[str] = set()

    membership_collections = [
        "workspace_members",
        "team_members",
        "memberships",
        "workspace_users",
    ]

    workspace_collections = [
        "workspaces",
        "tenants",
        "accounts",
    ]

    if is_super_admin:
        for workspace_collection_name in workspace_collections:
            if workspace_collection_name not in collection_names:
                continue

            workspace_collection = getattr(db, workspace_collection_name)
            docs = await workspace_collection.find({}, {"_id": 0}).to_list(length=500)

            for doc in docs:
                normalized = _normalize_workspace(doc, user_id)
                if not normalized:
                    continue
                normalized["role"] = normalized.get("role") or "owner"
                if normalized["id"] not in seen:
                    results.append(normalized)
                    seen.add(normalized["id"])

        if results:
            return results

    for membership_collection_name in membership_collections:
        if membership_collection_name not in collection_names:
            continue

        membership_collection = getattr(db, membership_collection_name)
        membership_docs = await membership_collection.find(
            {
                "$or": [
                    {"user_id": user_id},
                    {"member_id": user_id},
                    {"clerk_user_id": user_id},
                    {"id": user_id},
                ]
            },
            {"_id": 0},
        ).to_list(length=500)

        for membership in membership_docs:
            raw_workspace_id = (
                _string(membership.get("workspace_id"))
                or _string(membership.get("workspaceId"))
                or _string(membership.get("tenant_id"))
            )
            if not raw_workspace_id:
                continue

            role = (
                _string(membership.get("role"))
                or _string(membership.get("workspace_role"))
                or _string(membership.get("member_role"))
                or "member"
            ).lower()

            workspace_doc = None
            for workspace_collection_name in workspace_collections:
                if workspace_collection_name not in collection_names:
                    continue

                workspace_collection = getattr(db, workspace_collection_name)
                workspace_doc = await workspace_collection.find_one(
                    {
                        "$or": [
                            {"workspace_id": raw_workspace_id},
                            {"id": raw_workspace_id},
                            {"workspaceId": raw_workspace_id},
                        ]
                    },
                    {"_id": 0},
                )
                if workspace_doc:
                    break

            normalized = _normalize_workspace(
                workspace_doc or {"id": raw_workspace_id, "name": "Workspace"},
                user_id,
            )
            if not normalized:
                continue

            normalized["role"] = role

            if normalized["id"] not in seen:
                results.append(normalized)
                seen.add(normalized["id"])

    if results:
        return results

    if workspace_id_from_auth:
        return [
            {
                "id": workspace_id_from_auth,
                "workspace_id": workspace_id_from_auth,
                "name": "My Workspace",
                "owner_id": user_id,
                "role": _string(user.get("workspace_role")) or "owner",
                "plan": "free",
                "status": "active",
            }
        ]

    return [
        {
            "id": "default",
            "workspace_id": "default",
            "name": "My Workspace",
            "owner_id": user_id,
            "role": "owner",
            "plan": "free",
            "status": "active",
        }
    ]


@router.get("/api/workspaces/mine")
async def get_my_workspaces(
    request: Request,
    user: dict[str, Any] = Depends(get_current_user),
):
    db = await _get_db(request)
    workspaces = await _load_workspaces_from_memberships(db, user)

    active_workspace_id = (
        _string(request.headers.get("X-Workspace-ID"))
        or _string(user.get("workspace_id"))
        or (workspaces[0]["id"] if workspaces else None)
    )

    return {
        "workspaces": workspaces,
        "active_workspace_id": active_workspace_id,
    }


@router.post("/api/workspaces/switch")
async def switch_workspace(
    request: Request,
    user: dict[str, Any] = Depends(get_current_user),
):
    body = await request.json()
    requested_workspace_id = _string(
        body.get("workspace_id") or body.get("workspaceId") or body.get("id")
    )

    if not requested_workspace_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="workspace_id is required",
        )

    db = await _get_db(request)
    workspaces = await _load_workspaces_from_memberships(db, user)
    selected = next((w for w in workspaces if w["id"] == requested_workspace_id), None)

    if not selected:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to that workspace",
        )

    return {
        "switched": True,
        "workspace": selected,
        "active_workspace_id": selected["id"],
    }
