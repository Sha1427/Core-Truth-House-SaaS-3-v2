"""
cache_headers.py
CTH OS — FastAPI Cache-Control Headers Middleware
"""

from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
import re


HASHED_ASSET_RE = re.compile(
    r"\.[A-Za-z0-9_-]{8,}\.(js|css|woff2?|ttf|eot|png|jpg|jpeg|svg|gif|webp|ico|map|json)$"
)


class CacheHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        path = request.url.path

        # Respect explicitly set cache headers from downstream handlers
        if "Cache-Control" in response.headers:
            return response

        # /api/version — never cache
        if path == "/api/version":
            response.headers["Cache-Control"] = "no-store, max-age=0"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
            return response

        # All API routes — never cache
        if path.startswith("/api/"):
            response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
            return response

        # Hashed build assets — cache for 1 year
        if HASHED_ASSET_RE.search(path):
            response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
            return response

        # Common non-hashed static files — short cache
        if path.endswith((
            "/favicon.ico",
            "/robots.txt",
            "/manifest.json",
            "/asset-manifest.json",
        )):
            response.headers["Cache-Control"] = "public, max-age=3600"
            return response

        # index.html + SPA navigation routes — do not store
        last_segment = path.rstrip("/").split("/")[-1] if path else ""
        is_navigation_route = path == "/" or path == "/index.html" or "." not in last_segment

        if is_navigation_route:
            response.headers["Cache-Control"] = "no-store, max-age=0"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
            return response

        return response
