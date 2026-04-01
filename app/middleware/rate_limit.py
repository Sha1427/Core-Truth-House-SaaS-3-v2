from fastapi import Request

from backend.routes.ratelimit import check_rate_limit, get_rate_limit_headers


async def rate_limit_middleware(request: Request, call_next, rate_limited_paths: list[str]):
    path = request.url.path
    should_limit = any(path.startswith(prefix) for prefix in rate_limited_paths)

    if should_limit:
        await check_rate_limit(request)

    response = await call_next(request)

    if should_limit:
        try:
            headers = get_rate_limit_headers(request)
            for key, value in headers.items():
                response.headers[key] = value
        except Exception:
            pass

    return response
