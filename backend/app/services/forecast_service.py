from redis.asyncio import Redis

from app.repositories import forecasts_repo
from app.schemas.generation import SelectedForecastPoint
from app.utils.time import HOUR, from_epoch


async def selected_forecasts(
    redis: Redis, start: int, end: int, horizon_h: float
) -> list[SelectedForecastPoint]:
    """Horizon mode: for each target hour, the newest forecast published >= horizon_h before it."""
    targets = [t for t in await forecasts_repo.get_targets(redis, start, end - 1) if t % HOUR == 0]
    picks = await forecasts_repo.latest_before_cutoff(redis, targets, horizon_h)
    return [
        SelectedForecastPoint(t=from_epoch(t), forecast=mw, publish_time=from_epoch(p))
        for t, (p, mw) in sorted(picks.items())
    ]


async def forecasts_at_cutoff(
    redis: Redis, targets: list[int], cutoff_epoch: int
) -> dict[int, tuple[int, int]]:
    """Day-ahead mode: the newest forecast published at or before one fixed cut-off for all targets."""
    return await forecasts_repo.latest_at_or_before(redis, {t: cutoff_epoch for t in targets})
