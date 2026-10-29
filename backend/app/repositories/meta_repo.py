from redis.asyncio import Redis

from app.repositories import keys


async def get_version(redis: Redis) -> int:
    return int(await redis.get(keys.DATA_VERSION) or 0)


async def bump_version(redis: Redis) -> int:
    return int(await redis.incr(keys.DATA_VERSION))


async def set_coverage(redis: Redis, coverage: dict[str, int | str]) -> None:
    await redis.hset(keys.COVERAGE, mapping={k: str(v) for k, v in coverage.items()})


async def get_coverage(redis: Redis) -> dict[str, str]:
    return {str(k): str(v) for k, v in (await redis.hgetall(keys.COVERAGE)).items()}
