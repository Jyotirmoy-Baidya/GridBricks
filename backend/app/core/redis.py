from collections.abc import AsyncIterator

import redis.asyncio as aioredis
from fastapi import Request

from app.core.config import Settings


def create_redis(settings: Settings) -> aioredis.Redis:
    # rediss:// (Heroku Key-Value Store) uses a self-signed cert
    kwargs = {"ssl_cert_reqs": None} if settings.redis_url.startswith("rediss://") else {}
    return aioredis.from_url(settings.redis_url, decode_responses=True, **kwargs)


async def get_redis(request: Request) -> AsyncIterator[aioredis.Redis]:
    yield request.app.state.redis
