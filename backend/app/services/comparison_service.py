from typing import NamedTuple

from redis.asyncio import Redis

from app.repositories import actuals_repo, forecasts_repo
from app.utils.time import HOUR


class Row(NamedTuple):
    t: int
    actual: int
    forecast: int | None
    publish: int | None


async def hourly_actuals(redis: Redis, start: int, end: int) -> dict[int, int]:
    """Actuals on the hour in [start, end). Forecasts are hourly, so the grid is hourly."""
    rows = await actuals_repo.get_range(redis, start, end - 1)
    return {t: mw for t, mw in rows if t % HOUR == 0}


async def compare(redis: Redis, start: int, end: int, horizon_h: float) -> list[Row]:
    """One row per actual hour; forecast is the newest published >= horizon_h before it, else None."""
    actuals = await hourly_actuals(redis, start, end)
    picks = await forecasts_repo.latest_before_cutoff(redis, list(actuals), horizon_h)
    return [
        Row(t, mw, picks[t][1] if t in picks else None, picks[t][0] if t in picks else None)
        for t, mw in actuals.items()
    ]
