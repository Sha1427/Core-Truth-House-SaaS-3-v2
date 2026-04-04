from __future__ import annotations

import logging
import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.api import register_api_routers


# =========================================================
# Path bootstrapping
# =========================================================

APP_DIR = Path(__file__).resolve().parent
SRC_ROOT = APP_DIR.parent
BACKEND_DIR = SRC_ROOT / "backend"

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


# =========================================================
# Logging
# =========================================================

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger("coretruthhouse.app")


# =========================================================
# Database lifecycle
# =========================================================

async def _maybe_init_database(app: FastAPI) -> None:
    try:
        from backend.database import get_db, init_db
    except Exception as exc:
        logger.warning("Database init hook not available: %s", exc)
        return

    try:
        result = init_db()
        if hasattr(result, "__await__"):
            await result

        app.state.db = get_db()
        logger.info("Database initialization completed")
    except Exception as exc:
        logger.exception("Database initialization failed: %s", exc)
        raise


async def _maybe_close_database() -> None:
    try:
        from backend.database import close_db
    except Exception:
        return

    try:
        result = close_db()
        if hasattr(result, "__await__"):
            await result
        logger.info("Database shutdown completed")
    except Exception as exc:
        logger.warning("Database shutdown raised an error: %s", exc)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Application startup beginning")
    await _maybe_init_database(app)
    try:
        yield
    finally:
        logger.info("Application shutdown beginning")
        await _maybe_close_database()


# =========================================================
# App helpers
# =========================================================

def resolve_version() -> str:
    return (
        os.getenv("VERSION")
        or os.getenv("RAILWAY_GIT_COMMIT_SHA")
        or os.getenv("RENDER_GIT_COMMIT")
        or os.getenv("RAILWAY_DEPLOYMENT_ID")
        or os.getenv("RELEASE_ID")
        or "dev"
    )


def resolve_allowed_origins() -> list[str]:
    raw_origins = os.getenv(
        "CORS_ALLOWED_ORIGINS",
        ",".join(
            [
                "https://coretruthhouse.com",
                "https://www.coretruthhouse.com",
                "http://localhost:3000",
                "http://localhost:5173",
            ]
        ),
    )

    origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

    seen: set[str] = set()
    deduped: list[str] = []
    for origin in origins:
        if origin not in seen:
            seen.add(origin)
            deduped.append(origin)

    return deduped


# =========================================================
# Application factory
# =========================================================

def build_app() -> FastAPI:
    app = FastAPI(
        title="Core Truth House API",
        version=resolve_version(),
        lifespan=lifespan,
    )

    allowed_origins = resolve_allowed_origins()

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    async def health() -> dict[str, Any]:
        return {
            "status": "ok",
            "service": "coretruthhouse-api",
            "version": app.version,
        }

    @app.get("/health/live")
    async def health_live() -> dict[str, Any]:
        return {
            "status": "live",
            "service": "coretruthhouse-api",
        }

    @app.get("/health/ready")
    async def health_ready() -> dict[str, Any]:
        return {
            "status": "ready",
            "service": "coretruthhouse-api",
        }

    @app.get("/api/version")
    async def api_version() -> dict[str, Any]:
        return {
            "version": app.version,
            "service": "coretruthhouse-api",
        }

    register_api_routers(app)

    logger.info("Application assembly completed successfully")
    logger.info("Allowed CORS origins: %s", allowed_origins)

    return app


app = build_app()
