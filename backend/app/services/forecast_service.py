from app.core.db import Db
from app.repositories import forecasts_repo
from app.schemas.generation import SelectedForecastPoint
from app.utils.time import from_epoch


async def selected_forecasts(
    db: Db, start: int, end: int, horizon_h: float
) -> list[SelectedForecastPoint]:
    """Horizon mode: for each target hour, the newest forecast published >= horizon_h before it."""
    picks = await forecasts_repo.latest_by_horizon(db, start, end, horizon_h)
    return [
        SelectedForecastPoint(t=from_epoch(t), forecast=mw, publish_time=from_epoch(p))
        for t, (p, mw) in sorted(picks.items())
    ]


async def forecasts_at_cutoff(
    db: Db, start: int, end: int, cutoff_epoch: int
) -> dict[int, tuple[int, int]]:
    """Day-ahead mode: the newest forecast published at or before one fixed cut-off for all hours."""
    return await forecasts_repo.latest_at_cutoff(db, start, end, cutoff_epoch)
