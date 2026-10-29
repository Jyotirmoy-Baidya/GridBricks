from redis.asyncio import Redis

from app.api.deps import TimeRange
from app.core.config import Settings
from app.schemas.metrics import (
    ByHorizonResponse,
    ByHourResponse,
    DistributionResponse,
    HorizonMetrics,
    SummaryMetrics,
)
from app.services import cache_service, comparison_service, metrics_service


async def summary(
    redis: Redis, settings: Settings, rng: TimeRange, horizon_h: float
) -> SummaryMetrics:
    async def compute() -> SummaryMetrics:
        return metrics_service.summarize(
            await comparison_service.compare(redis, rng.start, rng.end, horizon_h)
        )

    params = {"s": rng.start, "e": rng.end, "h": horizon_h}
    return await cache_service.get_or_compute(
        redis, "metrics-summary", params, SummaryMetrics, compute, settings.cache_ttl_s
    )


async def by_horizon(
    redis: Redis, settings: Settings, rng: TimeRange, max_h: int
) -> ByHorizonResponse:
    async def compute() -> ByHorizonResponse:
        rows = []
        for h in range(max_h + 1):
            s = metrics_service.summarize(
                await comparison_service.compare(redis, rng.start, rng.end, h)
            )
            rows.append(HorizonMetrics(horizon_h=h, **s.model_dump()))
        return ByHorizonResponse(rows=rows)

    params = {"s": rng.start, "e": rng.end, "m": max_h}
    return await cache_service.get_or_compute(
        redis, "metrics-by-horizon", params, ByHorizonResponse, compute, settings.cache_ttl_s
    )


async def by_hour(
    redis: Redis, settings: Settings, rng: TimeRange, horizon_h: float
) -> ByHourResponse:
    async def compute() -> ByHourResponse:
        rows = await comparison_service.compare(redis, rng.start, rng.end, horizon_h)
        return ByHourResponse(horizon_h=horizon_h, rows=metrics_service.by_hour_of_day(rows))

    params = {"s": rng.start, "e": rng.end, "h": horizon_h}
    return await cache_service.get_or_compute(
        redis, "metrics-by-hour", params, ByHourResponse, compute, settings.cache_ttl_s
    )


async def distribution(
    redis: Redis, settings: Settings, rng: TimeRange, horizon_h: float, bins: int
) -> DistributionResponse:
    async def compute() -> DistributionResponse:
        rows = await comparison_service.compare(redis, rng.start, rng.end, horizon_h)
        return metrics_service.distribution(rows, horizon_h, bins)

    params = {"s": rng.start, "e": rng.end, "h": horizon_h, "b": bins}
    return await cache_service.get_or_compute(
        redis, "metrics-distribution", params, DistributionResponse, compute, settings.cache_ttl_s
    )
