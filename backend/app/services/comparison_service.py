from app.core.db import Db
from app.repositories import actuals_repo, comparison_repo
from app.repositories.comparison_repo import Row
from app.utils.time import HOUR

__all__ = ["Row", "compare", "hourly_actuals"]


async def hourly_actuals(db: Db, start: int, end: int) -> dict[int, int]:
    """Actuals on the hour in [start, end). Forecasts are hourly, so the grid is hourly."""
    rows = await actuals_repo.get_range(db, start, end)
    return {t: mw for t, mw in rows if t % HOUR == 0}


async def compare(db: Db, start: int, end: int, horizon_h: float) -> list[Row]:
    """One row per actual hour; forecast is the newest published >= horizon_h before it, else None."""
    return await comparison_repo.compare(db, start, end, horizon_h)
