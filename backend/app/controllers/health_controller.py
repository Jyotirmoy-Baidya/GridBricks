import asyncpg
from redis.asyncio import Redis

from app.schemas.health import HealthResponse
from app.services.health_service import check_database, check_redis


async def get_health(db: asyncpg.Pool, redis: Redis) -> HealthResponse:
    database, cache = await check_database(db), await check_redis(redis)
    status = "down" if not database else "ok" if cache else "degraded"
    return HealthResponse(status=status, database=database, redis=cache)
