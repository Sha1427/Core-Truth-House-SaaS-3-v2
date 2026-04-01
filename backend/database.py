from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Any

from motor.motor_asyncio import (
    AsyncIOMotorClient,
    AsyncIOMotorCollection,
    AsyncIOMotorDatabase,
)

# ============================================
# LOGGING
# ============================================

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("coretruthhouse.database")


# ============================================
# ENV HELPERS
# ============================================

def _get_env(name: str, default: str | None = None) -> str | None:
    value = os.getenv(name, default)
    if value is None:
        return None
    value = value.strip()
    return value or default


def _require_env(name: str) -> str:
    value = _get_env(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


# ============================================
# PATHS / FILE STORAGE
# ============================================

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


# ============================================
# DATABASE CONFIG
# ============================================

def get_mongo_url() -> str:
    return (
        _get_env("MONGO_URL")
        or _get_env("MONGODB_URL")
        or _get_env("MONGO_URI")
        or _require_env("MONGO_URL")
    )


def get_mongo_db_name() -> str:
    return (
        _get_env("MONGO_DB_NAME")
        or _get_env("MONGODB_DB")
        or _get_env("DB_NAME")
        or "coretruthhouse"
    )


# ============================================
# GLOBAL CONNECTION STATE
# ============================================

mongo_client: AsyncIOMotorClient | None = None
db: AsyncIOMotorDatabase | None = None


# ============================================
# CONNECTION HELPERS
# ============================================

def is_db_initialized() -> bool:
    return mongo_client is not None and db is not None


def get_db() -> AsyncIOMotorDatabase:
    if db is None:
        raise RuntimeError("Database has not been initialized. Call init_db() first.")
    return db


async def init_db() -> AsyncIOMotorDatabase:
    """
    Initialize the Mongo client and database handle.

    Safe to call multiple times. If already initialized, it returns the
    existing database handle.
    """
    global mongo_client, db

    if db is not None and mongo_client is not None:
        logger.info("Database already initialized")
        return db

    mongo_url = get_mongo_url()
    mongo_db_name = get_mongo_db_name()

    logger.info("Initializing MongoDB connection")
    logger.info("MongoDB database name: %s", mongo_db_name)

    mongo_client = AsyncIOMotorClient(
        mongo_url,
        serverSelectionTimeoutMS=5000,
        connectTimeoutMS=5000,
        socketTimeoutMS=10000,
        maxPoolSize=int(os.getenv("MONGO_MAX_POOL_SIZE", "20")),
        minPoolSize=int(os.getenv("MONGO_MIN_POOL_SIZE", "0")),
        uuidRepresentation="standard",
    )

    db = mongo_client[mongo_db_name]

    # Force an actual round-trip so startup fails fast if Mongo is unreachable
    await db.command("ping")

    logger.info("MongoDB connection initialized successfully")
    return db


async def close_db() -> None:
    """
    Close the Mongo client and clear global handles.

    Safe to call multiple times.
    """
    global mongo_client, db

    if mongo_client is not None:
        logger.info("Closing MongoDB connection")
        mongo_client.close()

    mongo_client = None
    db = None


async def ping_db() -> dict[str, Any]:
    """
    Lightweight dependency check used by health endpoints.
    """
    database = get_db()
    result = await database.command("ping")
    return {"ok": bool(result.get("ok", 0))}


# ============================================
# COLLECTION ACCESSORS
# ============================================

def get_collection(name: str) -> AsyncIOMotorCollection:
    return get_db()[name]


# ============================================
# OPTIONAL INDEX BOOTSTRAP
# ============================================

async def ensure_core_indexes() -> None:
    """
    Put shared app-wide indexes here if needed.
    Keep feature-specific indexes in their own repository layer.
    """
    database = get_db()

    # Example:
    # await database.workspaces.create_index("id", unique=True, name="workspaces_id_unique_idx")
    # await database.users.create_index("id", unique=True, name="users_id_unique_idx")

    logger.info("Core database indexes ensured")


# ============================================
# DEBUG HELPERS
# ============================================

async def describe_connection() -> dict[str, Any]:
    """
    Helpful when debugging inside a container.
    """
    return {
        "initialized": is_db_initialized(),
        "database_name": get_mongo_db_name(),
        "client_present": mongo_client is not None,
        "db_present": db is not None,
        "upload_dir": str(UPLOAD_DIR),
        "upload_dir_exists": UPLOAD_DIR.exists(),
    }


__all__ = [
    "logger",
    "mongo_client",
    "db",
    "BASE_DIR",
    "UPLOAD_DIR",
    "is_db_initialized",
    "get_db",
    "init_db",
    "close_db",
    "ping_db",
    "get_collection",
    "ensure_core_indexes",
    "describe_connection",
]
