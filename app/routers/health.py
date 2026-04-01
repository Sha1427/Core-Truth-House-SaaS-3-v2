import os

from fastapi import APIRouter, Request

router = APIRouter(tags=["health"])


def resolve_version() -> str:
    return (
        os.getenv("VERSION")
        or os.getenv("RAILWAY_GIT_COMMIT_SHA")
        or os.getenv("RENDER_GIT_COMMIT")
        or os.getenv("RAILWAY_DEPLOYMENT_ID")
        or os.getenv("RELEASE_ID")
        or "dev"
    )


def is_ai_configured() -> bool:
    ai_keys = [
        os.getenv("ANTHROPIC_API_KEY", "").strip(),
        os.getenv("OPENAI_API_KEY", "").strip(),
    ]
    return any(bool(key) for key in ai_keys)


@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": resolve_version(),
    }


@router.get("/api/health")
async def api_health(request: Request):
    db = getattr(request.app.state, "db", None)
    db_status = "disconnected"

    try:
        if db is None:
            raise RuntimeError("Database not initialized")
        await db.command("ping")
        db_status = "connected"
    except Exception:
        db_status = "disconnected"

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "version": resolve_version(),
        "database": db_status,
        "ai_configured": is_ai_configured(),
    }
