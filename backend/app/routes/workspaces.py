from fastapi import APIRouter, Depends
from backend.app.core.auth import get_current_user

router = APIRouter()


@router.get("/api/workspaces/mine")
async def get_my_workspaces(user=Depends(get_current_user)):
    return {
        "workspaces": [
            {
                "id": "default",
                "name": "My Workspace",
                "owner_id": user["user_id"],
            }
        ]
    }

