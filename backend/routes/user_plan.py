"""User plan route."""
from fastapi import APIRouter, Request

router = APIRouter(prefix="/api/user", tags=["user"])

@router.get("/plan")
async def get_user_plan(request: Request, user_id: str = None):
    try:
        from backend.app.core.auth import get_current_user
        user = await get_current_user(request)
        resolved_user_id = user_id or user.get("user_id")
    except Exception:
        resolved_user_id = user_id or "anonymous"
    
    return {
        "user_id": resolved_user_id,
        "plan": "foundation",
        "plan_id": "foundation",
        "status": "active",
        "features": [],
    }
