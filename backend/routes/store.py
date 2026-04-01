from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

import stripe
from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import FileResponse
from pydantic import BaseModel, EmailStr, Field

from dependencies.auth_context import get_request_context
from middleware.tenant_dependencies import get_db_from_request


router = APIRouter(prefix="/api/store", tags=["store"])


STRIPE_API_KEY = os.getenv("STRIPE_API_KEY", "").strip()
STRIPE_STORE_WEBHOOK_SECRET = os.getenv("STRIPE_STORE_WEBHOOK_SECRET", "").strip()
PUBLIC_APP_URL = os.getenv("PUBLIC_APP_URL", "").strip() or os.getenv("FRONTEND_URL", "").strip()

if STRIPE_API_KEY:
    stripe.api_key = STRIPE_API_KEY

STORE_DIR = Path(os.getenv("STORE_DIR", "/app/backend/uploads/store"))
STORE_DIR.mkdir(parents=True, exist_ok=True)

PRODUCT_COLLECTION_CANDIDATES = ["store_products"]
PURCHASE_COLLECTION_CANDIDATES = ["store_purchases"]
USER_COLLECTION_CANDIDATES = ["users"]


class PurchaseRequest(BaseModel):
    email: Optional[EmailStr] = None
    success_url: Optional[str] = Field(default=None, max_length=2000)
    cancel_url: Optional[str] = Field(default=None, max_length=2000)


class GuestOrderLookupRequest(BaseModel):
    email: EmailStr
    limit: int = Field(default=25, ge=1, le=100)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _iso(value: Any) -> Any:
    if isinstance(value, datetime):
        return value.isoformat()
    return value


def _clean_doc(doc: dict[str, Any] | None) -> dict[str, Any]:
    if not doc:
        return {}
    clean = dict(doc)
    clean.pop("_id", None)
    for key, value in list(clean.items()):
        clean[key] = _iso(value)
    return clean


def _optional_user_id(request: Request) -> str | None:
    return getattr(request.state, "user_id", None)


def _optional_workspace_id(request: Request) -> str | None:
    return getattr(request.state, "workspace_id", None)


async def _find_existing_collection(db, candidates: list[str]) -> str | None:
    names = set(await db.list_collection_names())
    for candidate in candidates:
        if candidate in names:
            return candidate
    return None


async def _get_products_collection(db):
    name = await _find_existing_collection(db, PRODUCT_COLLECTION_CANDIDATES)
    if not name:
        raise HTTPException(status_code=500, detail="Store products collection is not configured")
    return getattr(db, name)


async def _get_purchases_collection(db):
    name = await _find_existing_collection(db, PURCHASE_COLLECTION_CANDIDATES)
    if not name:
        raise HTTPException(status_code=500, detail="Store purchases collection is not configured")
    return getattr(db, name)


async def _get_users_collection(db):
    name = await _find_existing_collection(db, USER_COLLECTION_CANDIDATES)
    if not name:
        raise HTTPException(status_code=500, detail="Users collection is not configured")
    return getattr(db, name)


async def _get_user_email(db, user_id: str | None) -> str | None:
    if not user_id:
        return None
    users = await _get_users_collection(db)
    user = await users.find_one({"id": user_id}, {"_id": 0, "email": 1})
    if not user:
        return None
    email = str(user.get("email") or "").strip().lower()
    return email or None


async def _resolve_product(db, product_id: str, include_unpublished: bool = False) -> dict[str, Any] | None:
    products = await _get_products_collection(db)
    query: dict[str, Any] = {"product_id": product_id}
    if not include_unpublished:
        query["is_published"] = True
    return await products.find_one(query, {"_id": 0})


def _public_product_payload(product: dict[str, Any]) -> dict[str, Any]:
    clean = _clean_doc(product)
    clean["id"] = str(clean.get("product_id") or "")
    clean.pop("file_storage_name", None)
    clean.pop("original_filename", None)
    clean.pop("download_token", None)
    clean.pop("file_path", None)
    return clean


def _purchase_match_query(
    *,
    user_id: str | None,
    email: str | None,
    product_id: str,
    status: str = "completed",
) -> dict[str, Any]:
    query: dict[str, Any] = {"product_id": product_id, "status": status}
    if user_id:
        query["user_id"] = user_id
    elif email:
        query["purchaser_email"] = email.lower()
    else:
        query["purchase_id"] = "__never__"
    return query


def _default_success_url() -> str:
    if not PUBLIC_APP_URL:
        raise HTTPException(status_code=500, detail="PUBLIC_APP_URL is not configured")
    return f"{PUBLIC_APP_URL.rstrip('/')}/store/success?session_id={{CHECKOUT_SESSION_ID}}"


def _default_cancel_url() -> str:
    if not PUBLIC_APP_URL:
        raise HTTPException(status_code=500, detail="PUBLIC_APP_URL is not configured")
    return f"{PUBLIC_APP_URL.rstrip('/')}/store"


def _safe_download_path(filename: str) -> Path:
    safe_name = Path(filename).name
    return STORE_DIR / safe_name


@router.get("/products")
async def list_products(
    request: Request,
    category: Optional[str] = Query(default=None),
):
    db = get_db_from_request(request)
    products = await _get_products_collection(db)
    purchases = await _get_purchases_collection(db)

    user_id = _optional_user_id(request)
    user_email = await _get_user_email(db, user_id)

    query: dict[str, Any] = {"is_published": True}
    if category:
        query["category"] = category

    product_docs = await products.find(
        query,
        {"_id": 0},
    ).sort("created_at", -1).to_list(length=100)

    purchased_ids: set[str] = set()
    if user_id or user_email:
        purchase_query: dict[str, Any] = {"status": "completed"}
        if user_id:
            purchase_query["user_id"] = user_id
        else:
            purchase_query["purchaser_email"] = user_email

        purchase_docs = await purchases.find(
            purchase_query,
            {"_id": 0, "product_id": 1},
        ).to_list(length=1000)

        purchased_ids = {str(doc.get("product_id") or "") for doc in purchase_docs}

    result = []
    for product in product_docs:
        clean = _public_product_payload(product)
        clean["is_purchased"] = clean["id"] in purchased_ids
        result.append(clean)

    return {
        "products": result,
        "total": len(result),
    }


@router.get("/products/{product_id}")
async def get_product(product_id: str, request: Request):
    db = get_db_from_request(request)
    purchases = await _get_purchases_collection(db)

    user_id = _optional_user_id(request)
    user_email = await _get_user_email(db, user_id)

    product = await _resolve_product(db, product_id, include_unpublished=False)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    clean = _public_product_payload(product)
    clean["is_purchased"] = False

    if user_id or user_email:
        purchase = await purchases.find_one(
            _purchase_match_query(
                user_id=user_id,
                email=user_email,
                product_id=product_id,
                status="completed",
            ),
            {"_id": 0, "purchase_id": 1, "download_token": 1},
        )
        if purchase:
            clean["is_purchased"] = True
            clean["download_url"] = (
                f"/api/store/downloads/{purchase['purchase_id']}?token={purchase.get('download_token', '')}"
            )

    return clean


@router.post("/products/{product_id}/purchase")
async def purchase_product(
    product_id: str,
    request: Request,
    payload: PurchaseRequest,
):
    if not STRIPE_API_KEY:
        raise HTTPException(status_code=500, detail="Stripe is not configured")

    db = get_db_from_request(request)
    purchases = await _get_purchases_collection(db)

    context = get_request_context(request)
    user_id = str(context.get("user_id") or "").strip() or None
    workspace_id = str(context.get("workspace_id") or "").strip() or None

    purchaser_email = (str(payload.email).strip().lower() if payload.email else None) or await _get_user_email(db, user_id)
    if not purchaser_email:
        raise HTTPException(status_code=400, detail="Email is required for purchase")

    product = await _resolve_product(db, product_id, include_unpublished=False)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    existing_completed = await purchases.find_one(
        _purchase_match_query(
            user_id=user_id,
            email=purchaser_email,
            product_id=product_id,
            status="completed",
        ),
        {"_id": 0, "purchase_id": 1, "download_token": 1},
    )
    if existing_completed:
        return {
            "already_purchased": True,
            "purchase_id": existing_completed["purchase_id"],
            "download_url": f"/api/store/downloads/{existing_completed['purchase_id']}?token={existing_completed.get('download_token', '')}",
        }

    existing_pending = await purchases.find_one(
        {
            "product_id": product_id,
            "status": "pending",
            "purchaser_email": purchaser_email,
        },
        {"_id": 0},
    )
    if existing_pending:
        return {
            "pending": True,
            "checkout_session_id": existing_pending.get("stripe_session_id"),
        }

    success_url = payload.success_url or _default_success_url()
    cancel_url = payload.cancel_url or _default_cancel_url()

    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        mode="payment",
        customer_email=purchaser_email,
        line_items=[
            {
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": str(product["name"]),
                        "description": str(product.get("description", ""))[:500],
                        "images": [product["cover_url"]] if product.get("cover_url") else [],
                    },
                    "unit_amount": int(product["price_cents"]),
                },
                "quantity": 1,
            }
        ],
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "product_id": product_id,
            "purchaser_email": purchaser_email,
            "user_id": user_id or "",
            "workspace_id": workspace_id or "",
            "purchase_type": "digital_store",
        },
    )

    purchase_doc = {
        "purchase_id": str(uuid.uuid4()),
        "user_id": user_id,
        "workspace_id": workspace_id,
        "purchaser_email": purchaser_email,
        "product_id": product_id,
        "product_name": product["name"],
        "amount_cents": int(product["price_cents"]),
        "currency": "usd",
        "stripe_session_id": session.id,
        "stripe_payment_intent": None,
        "status": "pending",
        "download_token": None,
        "created_at": _utcnow(),
        "completed_at": None,
    }

    await purchases.insert_one(purchase_doc)

    return {
        "checkout_url": session.url,
        "purchase_id": purchase_doc["purchase_id"],
    }


@router.post("/webhook")
async def stripe_store_webhook(request: Request):
    if not STRIPE_API_KEY:
        raise HTTPException(status_code=500, detail="Stripe is not configured")
    if not STRIPE_STORE_WEBHOOK_SECRET:
        raise HTTPException(status_code=500, detail="STRIPE_STORE_WEBHOOK_SECRET is not configured")

    db = get_db_from_request(request)
    purchases = await _get_purchases_collection(db)
    products = await _get_products_collection(db)

    payload = await request.body()
    signature = request.headers.get("stripe-signature", "")

    try:
        event = stripe.Webhook.construct_event(payload, signature, STRIPE_STORE_WEBHOOK_SECRET)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid webhook: {exc}") from exc

    if event.get("type") == "checkout.session.completed":
        session = event["data"]["object"]
        stripe_session_id = session.get("id")

        purchase = await purchases.find_one(
            {"stripe_session_id": stripe_session_id},
            {"_id": 0},
        )

        if purchase and purchase.get("status") != "completed":
            completed_at = _utcnow()
            download_token = secrets.token_urlsafe(32)

            await purchases.update_one(
                {"stripe_session_id": stripe_session_id},
                {
                    "$set": {
                        "status": "completed",
                        "completed_at": completed_at,
                        "stripe_payment_intent": session.get("payment_intent"),
                        "download_token": download_token,
                    }
                },
            )

            await products.update_one(
                {"product_id": purchase["product_id"]},
                {
                    "$inc": {
                        "purchase_count": 1,
                        "revenue_cents": int(session.get("amount_total", 0) or 0),
                    },
                    "$set": {
                        "updated_at": completed_at,
                    },
                },
            )

    return {"received": True}


@router.get("/my-purchases")
async def my_purchases(request: Request):
    context = get_request_context(request)
    user_id = str(context.get("user_id") or "").strip()
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    db = get_db_from_request(request)
    purchases = await _get_purchases_collection(db)
    products = await _get_products_collection(db)

    purchase_docs = await purchases.find(
        {"user_id": user_id, "status": "completed"},
        {"_id": 0},
    ).sort("completed_at", -1).to_list(length=100)

    result = []
    for purchase in purchase_docs:
        product = await products.find_one(
            {"product_id": purchase["product_id"]},
            {"_id": 0, "cover_url": 1},
        )

        item = _clean_doc(purchase)
        item["download_url"] = f"/api/store/downloads/{purchase['purchase_id']}?token={purchase.get('download_token', '')}"
        item["cover_url"] = product.get("cover_url", "") if product else ""
        result.append(item)

    return {"purchases": result}


@router.post("/orders/lookup")
async def lookup_guest_orders(request: Request, payload: GuestOrderLookupRequest):
    db = get_db_from_request(request)
    purchases = await _get_purchases_collection(db)
    products = await _get_products_collection(db)

    purchase_docs = await purchases.find(
        {
            "purchaser_email": str(payload.email).strip().lower(),
            "status": "completed",
        },
        {"_id": 0},
    ).sort("completed_at", -1).to_list(length=payload.limit)

    result = []
    for purchase in purchase_docs:
        product = await products.find_one(
            {"product_id": purchase["product_id"]},
            {"_id": 0, "cover_url": 1},
        )

        item = _clean_doc(purchase)
        item["download_url"] = f"/api/store/downloads/{purchase['purchase_id']}?token={purchase.get('download_token', '')}"
        item["cover_url"] = product.get("cover_url", "") if product else ""
        result.append(item)

    return {
        "purchases": result,
        "total": len(result),
    }


@router.get("/downloads/{purchase_id}")
async def download_product_file(
    purchase_id: str,
    token: str = Query(..., min_length=10),
    request: Request = None,
):
    db = get_db_from_request(request)
    purchases = await _get_purchases_collection(db)
    products = await _get_products_collection(db)

    purchase = await purchases.find_one(
        {
            "purchase_id": purchase_id,
            "status": "completed",
            "download_token": token,
        },
        {"_id": 0},
    )
    if not purchase:
        raise HTTPException(status_code=404, detail="Download not found")

    product = await products.find_one(
        {"product_id": purchase["product_id"]},
        {"_id": 0},
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    storage_name = str(product.get("file_storage_name") or "").strip()
    if not storage_name:
        raise HTTPException(status_code=404, detail="No downloadable file is attached to this product")

    file_path = _safe_download_path(storage_name)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on server")

    download_name = str(product.get("original_filename") or file_path.name)
    return FileResponse(str(file_path), filename=download_name)
