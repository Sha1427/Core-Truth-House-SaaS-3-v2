"""Contact form routes for public submissions and admin review."""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, EmailStr, Field

from backend.database import get_db
from backend.dependencies.auth_context import require_admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["contact"])


# =========================================================
# Models
# =========================================================


class ContactFormRequest(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=50)
    inquiry_type: str = Field(default="General Inquiry", min_length=1, max_length=100)
    message: str = Field(..., min_length=1, max_length=5000)
    consent: bool
    source: str = Field(default="core_truth_house_contact_form", max_length=100)


class ContactMessageRecord(BaseModel):
    id: str
    first_name: str
    last_name: str
    full_name: str
    email: EmailStr
    phone: str | None = None
    inquiry_type: str
    message: str
    consent: bool
    status: str
    source: str
    ip_address: str | None = None
    user_agent: str | None = None
    created_at: str
    updated_at: str


class ContactSubmitResponse(BaseModel):
    success: bool = True
    message: str
    contact_id: str


class ContactListResponse(BaseModel):
    messages: list[ContactMessageRecord]
    total: int


# =========================================================
# Helpers
# =========================================================


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def normalize_contact_doc(doc: dict[str, Any]) -> ContactMessageRecord:
    return ContactMessageRecord(
        id=str(doc.get("id", "")),
        first_name=str(doc.get("first_name", "")),
        last_name=str(doc.get("last_name", "")),
        full_name=str(doc.get("full_name", "")),
        email=doc.get("email", ""),
        phone=doc.get("phone"),
        inquiry_type=str(doc.get("inquiry_type", "General Inquiry")),
        message=str(doc.get("message", "")),
        consent=bool(doc.get("consent", False)),
        status=str(doc.get("status", "new")),
        source=str(doc.get("source", "core_truth_house_contact_form")),
        ip_address=doc.get("ip_address"),
        user_agent=doc.get("user_agent"),
        created_at=str(doc.get("created_at", "")),
        updated_at=str(doc.get("updated_at", doc.get("created_at", ""))),
    )


async def ensure_contact_indexes(db: Any) -> None:
    try:
        await db.contact_messages.create_index(
            "id",
            unique=True,
            name="contact_messages_id_unique",
        )
        await db.contact_messages.create_index(
            "created_at",
            name="contact_messages_created_at_idx",
        )
        await db.contact_messages.create_index(
            "email",
            name="contact_messages_email_idx",
        )
        await db.contact_messages.create_index(
            "status",
            name="contact_messages_status_idx",
        )
        await db.contact_messages.create_index(
            "inquiry_type",
            name="contact_messages_inquiry_type_idx",
        )
    except Exception as exc:
        logger.warning("Failed to ensure contact_messages indexes: %s", exc)


# =========================================================
# Routes
# =========================================================


@router.post(
    "/contact",
    response_model=ContactSubmitResponse,
    status_code=status.HTTP_201_CREATED,
)
async def submit_contact_form(
    payload: ContactFormRequest,
    request: Request,
) -> ContactSubmitResponse:
    """
    Public contact form submission endpoint.
    """
    db = get_db()

    if not payload.consent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Consent is required.",
        )

    try:
        await ensure_contact_indexes(db)

        now = utc_now_iso()
        contact_id = str(uuid.uuid4())

        first_name = payload.first_name.strip()
        last_name = payload.last_name.strip()

        contact_doc = {
            "id": contact_id,
            "first_name": first_name,
            "last_name": last_name,
            "full_name": f"{first_name} {last_name}".strip(),
            "email": payload.email.lower().strip(),
            "phone": (payload.phone or "").strip() or None,
            "inquiry_type": payload.inquiry_type.strip(),
            "message": payload.message.strip(),
            "consent": payload.consent,
            "status": "new",
            "source": payload.source.strip(),
            "ip_address": request.client.host if request.client else None,
            "user_agent": request.headers.get("user-agent", ""),
            "created_at": now,
            "updated_at": now,
        }

        await db.contact_messages.insert_one(contact_doc)

        logger.info(
            "Contact form submitted",
            extra={
                "contact_id": contact_id,
                "email": contact_doc["email"],
                "inquiry_type": contact_doc["inquiry_type"],
            },
        )

        return ContactSubmitResponse(
            success=True,
            message="Contact form submitted successfully.",
            contact_id=contact_id,
        )

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to submit contact form: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit contact form.",
        ) from exc


@router.get(
    "/contact",
    response_model=ContactListResponse,
    dependencies=[Depends(require_admin)],
)
async def list_contact_messages(
    limit: int = Query(default=50, ge=1, le=200),
    status_filter: str | None = Query(default=None, alias="status"),
) -> ContactListResponse:
    """
    Admin-only contact message listing endpoint.
    """
    db = get_db()

    try:
        await ensure_contact_indexes(db)

        query: dict[str, Any] = {}
        if status_filter:
            query["status"] = status_filter.strip().lower()

        cursor = (
            db.contact_messages.find(query, {"_id": 0})
            .sort("created_at", -1)
            .limit(limit)
        )

        docs = await cursor.to_list(length=limit)
        messages = [normalize_contact_doc(doc) for doc in docs]
        total = await db.contact_messages.count_documents(query)

        return ContactListResponse(
            messages=messages,
            total=total,
        )

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to list contact messages: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load contact messages.",
        ) from exc
