import hashlib
import json
from collections.abc import Awaitable, Callable
from typing import Any

from pydantic import BaseModel
from redis.asyncio import Redis

from app.repositories import keys


async def get_version(redis: Redis) -> int:
    return int(await redis.get(keys.DATA_VERSION) or 0)


async def bump_version(redis: Redis) -> int:
    """Called after every load. Cache keys embed the version, so old entries are orphaned."""
    return int(await redis.incr(keys.DATA_VERSION))


async def get_or_compute[T: BaseModel](
    redis: Redis,
    endpoint: str,
    params: dict[str, Any],
    model: type[T],
    compute: Callable[[], Awaitable[T]],
    ttl_s: int,
) -> T:
    """Serve from Redis when present, otherwise compute from Postgres and store with a TTL."""
    version = await get_version(redis)
    digest = hashlib.sha1(json.dumps(params, sort_keys=True, default=str).encode()).hexdigest()[:16]
    key = f"cache:v{version}:{endpoint}:{digest}"
    hit = await redis.get(key)
    if hit:
        return model.model_validate_json(hit)
    result = await compute()
    await redis.set(key, result.model_dump_json(), ex=ttl_s)
    return result
