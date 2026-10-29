import hashlib
import json
from collections.abc import Awaitable, Callable
from typing import Any

from pydantic import BaseModel
from redis.asyncio import Redis

from app.repositories import meta_repo


async def get_or_compute[T: BaseModel](
    redis: Redis,
    endpoint: str,
    params: dict[str, Any],
    model: type[T],
    compute: Callable[[], Awaitable[T]],
    ttl_s: int,
) -> T:
    """Serve from Redis when present. Keys embed data:version, so a new ingest orphans old entries."""
    version = await meta_repo.get_version(redis)
    digest = hashlib.sha1(json.dumps(params, sort_keys=True, default=str).encode()).hexdigest()[:16]
    key = f"cache:v{version}:{endpoint}:{digest}"
    hit = await redis.get(key)
    if hit:
        return model.model_validate_json(hit)
    result = await compute()
    await redis.set(key, result.model_dump_json(), ex=ttl_s)
    return result
