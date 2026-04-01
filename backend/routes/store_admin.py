from __future__ import annotations

import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

from fastapi import APIRouter, File, HTTPException, Query, Request, UploadFile
from pydantic import BaseModel, Field

from dependencies.auth_context import require_super_admin
from middleware.tenant_dependencies import get_db_from_request


router = APIRouter(prefix="/api/store/admin", tags=["store_admin"])


STORE_DIR = Path("/app/backend/uploads/store")
STORE_DIR.mkdir(parents=True, exist_ok=True)

PRODUCT_COLLECTION_CANDIDATES = ["store_products"]
PURCHASE_COLLECTION_CANDIDATES = ["store_purchases"]


class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=10000)
    price_cents: int = Field(ge=0)
    category: str = Field(min_length=1, max_length=100)
    cover_url: Optional[str] = None
    is_published: bool = False
    tags: list[str] = Field(default_factory=list)


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=10000)
    price_cents: Optional[int] = Field(default=None, ge=0)
    category: Optional[str] = Field(default=None, min_length=1, max_length=100)
    cover_url: Optional[str] = None
    is_published: Optional[bool] = None
    tags: Optional[list[str]] = None


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


def _new_product_id() -> str:
    return str(uuid.uuid4())


def _safe_filename(filename: str) -> str:
    safe_name = Path(filename).name.strip()
    if not safe_name:
        return "file.bin"
    return safe_name.replace(" ", "_")


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


async def _resolve_product(db, product_id: str) -> dict[str, Any] | None:
    products = await _get_products_collection(db)
    return await products.find_one({"product_id": product_id}, {"_id": 0})


@router.get("/products")
async def admin_list_products(request: Request):
    require_super_admin(request)
    db = get_db_from_request(request)
    products = await _get_products_collection(db)

    docs = await products.find({}, {"_id": 0}).sort("created_at", -1).to_list(length=500)

    result = []
    for product in docs:
        clean = _clean_doc(product)
        clean["id"] = str(clean.get("product_id") or "")
        result.append(clean)

    return {
        "products": result,
        "total": len(result),
    }


@router.get("/products/{product_id}")
async def admin_get_product(product_id: str, request: Request):
    require_super_admin(request)
    db = get_db_from_request(request)

    product = await _resolve_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    clean = _clean_doc(product)
    clean["id"] = product_id
    return clean


@router.post("/products")
async def admin_create_product(data: ProductCreate, request: Request):
    require_super_admin(request)
    db = get_db_from_request(request)
    products = await _get_products_collection(db)

    now = _utcnow()
    product_id = _new_product_id()

    doc = {
        "product_id": product_id,
        "name": data.name,
        "description": data.description,
        "price_cents": data.price_cents,
        "category": data.category,
        "cover_url": data.cover_url,
        "is_published": data.is_published,
        "tags": data.tags,
        "file_storage_name": None,
        "original_filename": None,
        "purchase_count": 0,
        "revenue_cents": 0,
        "created_at": now,
        "updated_at": now,
    }

    await products.insert_one(doc)

    clean = _clean_doc(doc)
    clean["id"] = product_id
    return clean


@router.put("/products/{product_id}")
async def admin_update_product(product_id: str, data: ProductUpdate, request: Request):
    require_super_admin(request)
    db = get_db_from_request(request)
    products = await _get_products_collection(db)

    existing = await _resolve_product(db, product_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")

    updates = data.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No updates provided")

    updates["updated_at"] = _utcnow()

    await products.update_one(
        {"product_id": product_id},
        {"$set": updates},
    )

    updated = await _resolve_product(db, product_id)
    clean = _clean_doc(updated)
    clean["id"] = product_id
    return clean


@router.delete("/products/{product_id}")
async def admin_delete_product(product_id: str, request: Request):
    require_super_admin(request)
    db = get_db_from_request(request)
    products = await _get_products_collection(db)

    product = await _resolve_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    storage_name = str(product.get("file_storage_name") or "").strip()
    if storage_name:
        file_path = STORE_DIR / Path(storage_name).name
        if file_path.exists():
            try:
                file_path.unlink()
            except Exception:
                pass

    result = await products.delete_one({"product_id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")

    return {
        "deleted": True,
        "product_id": product_id,
    }


@router.post("/products/{product_id}/upload")
async def admin_upload_product_file(
    product_id: str,
    request: Request,
    file: UploadFile = File(...),
):
    require_super_admin(request)
    db = get_db_from_request(request)
    products = await _get_products_collection(db)

    product = await _resolve_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    original_name = _safe_filename(file.filename or "file.bin")
    ext = Path(original_name).suffix or ".bin"
    storage_name = f"product_{product_id[:8]}_{uuid.uuid4().hex[:8]}{ext}"
    file_path = STORE_DIR / storage_name

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    await products.update_one(
        {"product_id": product_id},
        {
            "$set": {
                "file_storage_name": storage_name,
                "original_filename": original_name,
                "updated_at": _utcnow(),
            }
        },
    )

    return {
        "product_id": product_id,
        "file_storage_name": storage_name,
        "original_filename": original_name,
        "size_bytes": len(content),
    }


@router.get("/orders")
async def admin_list_orders(
    request: Request,
    status: Optional[str] = Query(default=None),
    limit: int = Query(default=500, ge=1, le=5000),
):
    require_super_admin(request)
    db = get_db_from_request(request)
    purchases = await _get_purchases_collection(db)

    query: dict[str, Any] = {}
    if status:
        query["status"] = status

    docs = await purchases.find(
        query,
        {"_id": 0},
    ).sort("completed_at", -1).to_list(length=limit)

    result = [_clean_doc(doc) for doc in docs]
    total = sum(int(doc.get("amount_cents", 0) or 0) for doc in result if doc.get("status") == "completed")

    return {
        "orders": result,
        "order_count": len(result),
        "total_revenue_cents": total,
        "total_revenue_dollars": round(total / 100, 2),
    }


@router.get("/orders/{purchase_id}")
async def admin_get_order(purchase_id: str, request: Request):
    require_super_admin(request)
    db = get_db_from_request(request)
    purchases = await _get_purchases_collection(db)

    order = await purchases.find_one(
        {"purchase_id": purchase_id},
        {"_id": 0},
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    return _clean_doc(order)
