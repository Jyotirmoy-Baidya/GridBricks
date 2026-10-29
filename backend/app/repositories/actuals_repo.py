from redis.asyncio import Redis

from app.repositories import keys
from app.services.cleaning import ActualRow

CHUNK = 5000


async def upsert(redis: Redis, rows: list[ActualRow]) -> None:
    for i in range(0, len(rows), CHUNK):
        chunk = rows[i : i + CHUNK]
        pipe = redis.pipeline(transaction=False)
        pipe.zadd(keys.ACTUAL_INDEX, {str(t): t for t, _ in chunk})
        pipe.hset(keys.ACTUAL_VALUES, mapping={str(t): mw for t, mw in chunk})
        await pipe.execute()


async def get_range(redis: Redis, start_epoch: int, end_epoch: int) -> list[ActualRow]:
    """Actuals with start_epoch <= target <= end_epoch, ascending."""
    members = [str(m) for m in await redis.zrangebyscore(keys.ACTUAL_INDEX, start_epoch, end_epoch)]
    if not members:
        return []
    values = await redis.hmget(keys.ACTUAL_VALUES, members)
    return [(int(m), int(str(v))) for m, v in zip(members, values, strict=True) if v is not None]
