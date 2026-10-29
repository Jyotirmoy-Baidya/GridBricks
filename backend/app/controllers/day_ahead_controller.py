from datetime import date

import asyncpg
from redis.asyncio import Redis

from app.core.config import Settings
from app.core.exceptions import ApiError
from app.repositories import meta_repo
from app.schemas.day_ahead import DayAheadResponse
from app.services import cache_service, day_ahead_service


async def day_ahead(
    db: asyncpg.Pool, redis: Redis, settings: Settings, delivery: date, cutoff_hhmm: str
) -> DayAheadResponse:
    cov = await meta_repo.get_coverage(db)
    if "actual_min" not in cov:
        raise ApiError(503, "no data loaded yet")
    ref_start, ref_end = int(cov["actual_min"]), int(cov["actual_max"]) + 1

    async def compute() -> DayAheadResponse:
        return await day_ahead_service.build(db, delivery, cutoff_hhmm, ref_start, ref_end)

    params = {"d": delivery.isoformat(), "c": cutoff_hhmm}
    return await cache_service.get_or_compute(
        redis, "day-ahead", params, DayAheadResponse, compute, settings.cache_ttl_s
    )
