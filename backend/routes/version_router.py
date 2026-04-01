"""
version_router.py
CTH OS — FastAPI Version Endpoint

Returns the current deployed version string.
The React app polls this every few minutes and
shows an "Update available" banner when the version changes.
"""

from fastapi import APIRouter
import os

router = APIRouter(tags=["version"])


def _resolve_version() -> str:
    """
    Resolve a stable deployment version.

    Priority:
    1. Explicit VERSION env var
    2. Git commit SHA from hosting provider
    3. Deployment/release identifier
    4. Fallback to 'dev'
    """
    return (
        os.getenv("VERSION")
        or os.getenv("RAILWAY_GIT_COMMIT_SHA")
        or os.getenv("RENDER_GIT_COMMIT")
        or os.getenv("RAILWAY_DEPLOYMENT_ID")
        or os.getenv("RELEASE_ID")
        or "dev"
    )


@router.get("/api/version")
async def get_version():
    """
    Returns the current deployed version.
    This endpoint should be served with no-cache headers.
    """
    return {
        "version": _resolve_version(),
        "deployed_at": os.getenv("DEPLOYED_AT", "unknown"),
        "environment": os.getenv("ENVIRONMENT", "unknown"),
    }
