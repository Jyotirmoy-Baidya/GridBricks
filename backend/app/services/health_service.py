import asyncpg
from redis.asyncio import Redis
from redis.exceptions import RedisError


async def check_redis(redis: Redis) -> bool:
    try:
        return bool(await redis.ping())
    except (RedisError, OSError):
        return False


async def check_database(db: asyncpg.Pool) -> bool:
    try:
        return await db.fetchval("SELECT 1") == 1
    except (asyncpg.PostgresError, OSError):
        return False
