from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse


def build_frontend_router(frontend_build_path: Path) -> APIRouter:
    router = APIRouter()

    index_file = frontend_build_path / "index.html"
    if not index_file.exists():
        raise RuntimeError(f"Frontend index.html not found at {index_file}")

    @router.get("/")
    async def serve_root():
        return FileResponse(str(index_file))

    @router.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        requested_path = (frontend_build_path / full_path).resolve()
        build_root = frontend_build_path.resolve()

        try:
            requested_path.relative_to(build_root)
        except ValueError:
            raise HTTPException(status_code=404, detail="File not found")

        if requested_path.exists() and requested_path.is_file():
            return FileResponse(str(requested_path))

        return FileResponse(str(index_file))

    return router
