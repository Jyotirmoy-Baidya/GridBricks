from redis.asyncio import Redis

from app.repositories import keys
from app.services.cleaning import ForecastRow

CHUNK = 5000
HOUR = 3600


async def upsert(redis: Redis, rows: list[ForecastRow]) -> None:
    """Forecasts are immutable per (target, publish), so the member embeds the value."""
    for i in range(0, len(rows), CHUNK):
        pipe = redis.pipeline(transaction=False)
        for target, publish, mw in rows[i : i + CHUNK]:
            pipe.zadd(keys.forecast_key(target), {f"{publish}:{mw}": publish})
            pipe.zadd(keys.FC_TARGETS, {str(target): target})
        await pipe.execute()


async def get_targets(redis: Redis, start_epoch: int, end_epoch: int) -> list[int]:
    members = await redis.zrangebyscore(keys.FC_TARGETS, start_epoch, end_epoch)
    return [int(str(m)) for m in members]


async def latest_before_cutoff(
    redis: Redis, targets: list[int], horizon_h: float
) -> dict[int, tuple[int, int]]:
    """For each target T, the newest forecast with publish <= T - horizon_h.

    Returns {target: (publish_epoch, mw)}; targets with no such forecast are absent.
    """
    if not targets:
        return {}
    pipe = redis.pipeline(transaction=False)
    for t in targets:
        cutoff = t - int(horizon_h * HOUR)
        pipe.zrevrangebyscore(keys.forecast_key(t), cutoff, "-inf", start=0, num=1)
    results = await pipe.execute()
    out: dict[int, tuple[int, int]] = {}
    for t, res in zip(targets, results, strict=True):
        if res:
            publish, mw = res[0].split(":")
            out[t] = (int(publish), int(mw))
    return out
