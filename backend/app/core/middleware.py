import time
import uuid

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from redis.exceptions import RedisError
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

from app.core.config import get_settings


class RequestContextMiddleware(BaseHTTPMiddleware):
    """Echo or create X-Request-Id and report processing time."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        request_id = request.headers.get("x-request-id") or uuid.uuid4().hex
        started = time.perf_counter()
        response = await call_next(request)
        response.headers["X-Request-Id"] = request_id
        response.headers["X-Process-Time-Ms"] = f"{(time.perf_counter() - started) * 1000:.1f}"
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Fixed-window per-IP limiter backed by Redis. Fails open if Redis is unreachable."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        path = request.url.path
        if not path.startswith("/api/v1") or path.endswith("/health"):
            return await call_next(request)
        limit = get_settings().rate_limit_per_min
        now = int(time.time())
        window = now // 60
        ip = request.client.host if request.client else "unknown"
        key = f"rl:{ip}:{window}"
        try:
            redis = request.app.state.redis
            count = await redis.incr(key)
            if count == 1:
                await redis.expire(key, 60)
        except (RedisError, OSError):
            return await call_next(request)
        if count > limit:
            retry_after = (window + 1) * 60 - now
            return JSONResponse(
                status_code=429,
                content={"detail": "rate limit exceeded"},
                headers={"Retry-After": str(retry_after)},
            )
        return await call_next(request)
