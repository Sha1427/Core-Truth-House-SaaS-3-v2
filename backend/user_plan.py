"""User plan route."""
from fastapi import APIRouter, Depends
from backend.app.core.auth import get_current_user

router = APIRouter(prefix="/api/user", tags=["user"])

@router.get("/plan")
async def get_user_plan(user_id: str = None, user=Depends(get_current_user)):
    return {
        "user_id": user_id or user.get("user_id"),
        "plan": "foundation",
        "plan_id": "foundation",
        "status": "active",
        "features": [],
    }
