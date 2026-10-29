from datetime import datetime

import asyncpg
from redis.asyncio import Redis

from app.api.deps import TimeRange
from app.core.config import Settings
from app.repositories import actuals_repo, meta_repo
from app.schemas.generation import (
    ActualPoint,
    ActualsResponse,
    ComparisonPoint,
    ComparisonResponse,
    CoverageResponse,
    ForecastsResponse,
)
from app.services import cache_service, comparison_service, forecast_service
from app.utils.time import from_epoch


async def coverage(db: asyncpg.Pool) -> CoverageResponse:
    c = await meta_repo.get_coverage(db)
    if not c:
        return CoverageResponse(loaded=False)

    def ts(key: str) -> datetime | None:
        return from_epoch(int(c[key])) if key in c else None

    return CoverageResponse(
        loaded=True,
        ingested_at=datetime.fromisoformat(c["ingested_at"]) if "ingested_at" in c else None,
        actual_rows=int(c.get("actual_rows", 0)),
        forecast_rows=int(c.get("forecast_rows", 0)),
        actual_start=ts("actual_min"),
        actual_end=ts("actual_max"),
        target_start=ts("target_min"),
        target_end=ts("target_max"),
    )


async def actuals(db: asyncpg.Pool, rng: TimeRange) -> ActualsResponse:
    rows = await actuals_repo.get_range(db, rng.start, rng.end)
    return ActualsResponse(points=[ActualPoint(t=from_epoch(t), generation=mw) for t, mw in rows])


async def forecasts(
    db: asyncpg.Pool, redis: Redis, settings: Settings, rng: TimeRange, horizon_h: float
) -> ForecastsResponse:
    async def compute() -> ForecastsResponse:
        points = await forecast_service.selected_forecasts(db, rng.start, rng.end, horizon_h)
        return ForecastsResponse(horizon_h=horizon_h, points=points)

    params = {"s": rng.start, "e": rng.end, "h": horizon_h}
    return await cache_service.get_or_compute(
        redis, "forecasts", params, ForecastsResponse, compute, settings.cache_ttl_s
    )


async def comparison(
    db: asyncpg.Pool, redis: Redis, settings: Settings, rng: TimeRange, horizon_h: float
) -> ComparisonResponse:
    async def compute() -> ComparisonResponse:
        rows = await comparison_service.compare(db, rng.start, rng.end, horizon_h)
        return ComparisonResponse(
            horizon_h=horizon_h,
            points=[
                ComparisonPoint(
                    t=from_epoch(r.t),
                    actual=r.actual,
                    forecast=r.forecast,
                    publish_time=from_epoch(r.publish) if r.publish is not None else None,
                    error=r.forecast - r.actual if r.forecast is not None else None,
                )
                for r in rows
            ],
        )

    params = {"s": rng.start, "e": rng.end, "h": horizon_h}
    return await cache_service.get_or_compute(
        redis, "comparison", params, ComparisonResponse, compute, settings.cache_ttl_s
    )
