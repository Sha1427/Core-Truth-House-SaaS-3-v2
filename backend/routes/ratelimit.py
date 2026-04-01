"""Rate limiting middleware for API endpoints."""
from fastapi import Request, HTTPException
from datetime import datetime, timezone
from collections import defaultdict
import asyncio
import logging

logger = logging.getLogger("cth.ratelimit")

# In-memory rate limit store (use Redis in production)
rate_limit_store = defaultdict(list)

# Rate limit configurations
RATE_LIMITS = {
    "/api/generate": {"requests": 10, "window": 60},  # 10 requests per minute
    "/api/generate-image": {"requests": 5, "window": 60},  # 5 images per minute
    "/api/generate-video": {"requests": 2, "window": 300},  # 2 videos per 5 minutes
    "/api/generators/scene": {"requests": 10, "window": 60},
    "/api/generators/dna": {"requests": 10, "window": 60},
    "/api/generators/god-prompt": {"requests": 5, "window": 60},
    "/api/generators/launch": {"requests": 5, "window": 60},
    "/api/audit/perform": {"requests": 3, "window": 300},  # 3 audits per 5 minutes
    "default": {"requests": 100, "window": 60},  # Default: 100 requests per minute
}


def get_client_id(request: Request) -> str:
    """Get a unique identifier for the client."""
    # Try to get user_id from query params or headers
    user_id = request.query_params.get("user_id")
    if user_id and user_id != "default":
        return f"user:{user_id}"
    
    # Fall back to IP address
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return f"ip:{forwarded.split(',')[0].strip()}"
    
    return f"ip:{request.client.host if request.client else 'unknown'}"


def clean_old_requests(client_id: str, window: int):
    """Remove requests outside the current window."""
    now = datetime.now(timezone.utc).timestamp()
    cutoff = now - window
    rate_limit_store[client_id] = [
        ts for ts in rate_limit_store[client_id] if ts > cutoff
    ]


async def check_rate_limit(request: Request) -> bool:
    """
    Check if request is within rate limits.
    Returns True if allowed, raises HTTPException if rate limited.
    """
    path = request.url.path
    client_id = get_client_id(request)
    
    # Get rate limit config for this path
    config = RATE_LIMITS.get(path, RATE_LIMITS["default"])
    max_requests = config["requests"]
    window = config["window"]
    
    # Clean old requests and check current count
    clean_old_requests(client_id, window)
    current_count = len(rate_limit_store[client_id])
    
    if current_count >= max_requests:
        remaining_time = int(window - (datetime.now(timezone.utc).timestamp() - rate_limit_store[client_id][0]))
        logger.warning(f"Rate limit exceeded for {client_id} on {path}")
        raise HTTPException(
            status_code=429,
            detail={
                "error": "Rate limit exceeded",
                "limit": max_requests,
                "window_seconds": window,
                "retry_after": max(1, remaining_time),
                "message": f"Too many requests. Please wait {remaining_time} seconds."
            }
        )
    
    # Record this request
    rate_limit_store[client_id].append(datetime.now(timezone.utc).timestamp())
    return True


def get_rate_limit_headers(request: Request) -> dict:
    """Get rate limit headers to include in response."""
    path = request.url.path
    client_id = get_client_id(request)
    config = RATE_LIMITS.get(path, RATE_LIMITS["default"])
    
    clean_old_requests(client_id, config["window"])
    current_count = len(rate_limit_store[client_id])
    remaining = max(0, config["requests"] - current_count)
    
    return {
        "X-RateLimit-Limit": str(config["requests"]),
        "X-RateLimit-Remaining": str(remaining),
        "X-RateLimit-Window": str(config["window"])
    }


# Cleanup task to prevent memory bloat
async def cleanup_rate_limit_store():
    """Periodically clean up expired entries."""
    while True:
        await asyncio.sleep(300)  # Run every 5 minutes
        now = datetime.now(timezone.utc).timestamp()
        max_window = max(c["window"] for c in RATE_LIMITS.values())
        cutoff = now - max_window
        
        keys_to_delete = []
        for client_id, timestamps in rate_limit_store.items():
            rate_limit_store[client_id] = [ts for ts in timestamps if ts > cutoff]
            if not rate_limit_store[client_id]:
                keys_to_delete.append(client_id)
        
        for key in keys_to_delete:
            del rate_limit_store[key]
        
        logger.debug(f"Rate limit cleanup: removed {len(keys_to_delete)} expired entries")
