from fastapi import APIRouter, Depends, Request
from backend.app.core.auth import get_current_user

router = APIRouter()

@router.get("/api/workspaces/mine")
async def get_my_workspaces(request: Request, user=Depends(get_current_user)):
    try:
        db = request.app.state.db
        user_id = user["user_id"]
        cursor = db.workspaces.find({
            "$or": [
                {"owner_id": user_id},
                {"clerk_user_id": user_id},
            ]
        })
        workspaces = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            workspaces.append(doc)
        return {"workspaces": workspaces}
    except Exception as exc:
        return {"workspaces": [], "error": str(exc)}
