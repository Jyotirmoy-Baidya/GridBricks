from redis.asyncio import Redis

from app.schemas.health import HealthResponse
from app.services.health_service import check_redis


async def get_health(redis: Redis) -> HealthResponse:
    redis_ok = await check_redis(redis)
    return HealthResponse(status="ok" if redis_ok else "degraded", redis=redis_ok)
