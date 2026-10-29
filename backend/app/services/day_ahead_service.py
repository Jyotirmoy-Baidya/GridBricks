from datetime import date

import numpy as np

from app.core.db import Db
from app.schemas.day_ahead import DayAheadHour, DayAheadResponse
from app.services import comparison_service, forecast_service, metrics_service
from app.utils.time import HOUR, from_epoch, london_cutoff_epoch, london_day_bounds

MAX_HORIZON_H = 48


async def _error_quantiles(
    db: Db, horizon_h: int, ref_start: int, ref_end: int
) -> tuple[float, float] | None:
    """P10 and P90 of signed error (forecast - actual) at one horizon over the reference window."""
    rows = await comparison_service.compare(db, ref_start, ref_end, horizon_h)
    e = metrics_service.errors(rows)
    if e.size == 0:
        return None
    return float(np.percentile(e, 10)), float(np.percentile(e, 90))


async def add_error_bands(
    db: Db, hours: list[DayAheadHour], ref_start: int, ref_end: int
) -> None:
    """Fill p10, p90 and count_on on every hour that has a forecast.

    Bands come from how wrong forecasts at the same horizon were across the reference window
    (all ingested data), so they are an in-sample guide. Actual = forecast - error.
    """
    quantiles: dict[int, tuple[float, float] | None] = {}
    for hour in hours:
        if hour.forecast is None:
            continue
        h_key = min(max(round(hour.horizon_h), 0), MAX_HORIZON_H)
        if h_key not in quantiles:
            quantiles[h_key] = await _error_quantiles(db, h_key, ref_start, ref_end)
        q = quantiles[h_key]
        if q is None:
            continue
        q10, q90 = q
        hour.p10 = max(0, round(hour.forecast - q90))
        hour.p90 = max(0, round(hour.forecast - q10))
        hour.count_on = max(0, round(hour.forecast - max(0.0, q90)))


def totals(hours: list[DayAheadHour]) -> tuple[float | None, float | None, float | None]:
    """Daily GWh totals (forecast, count-on, actual); None unless all 24 hours have a value."""

    def gwh(values: list[int | None]) -> float | None:
        if not values or any(v is None for v in values):
            return None
        return round(sum(v for v in values if v is not None) / 1000, 2)

    return (
        gwh([h.forecast for h in hours]),
        gwh([h.count_on for h in hours]),
        gwh([h.actual for h in hours]),
    )


async def build(
    db: Db, delivery: date, cutoff_hhmm: str, ref_start: int, ref_end: int
) -> DayAheadResponse:
    """Hourly plan for one London delivery day, using the forecast published before the D-1 cut-off."""
    start, end = london_day_bounds(delivery)
    cutoff = london_cutoff_epoch(delivery, cutoff_hhmm)
    picks = await forecast_service.forecasts_at_cutoff(db, start, end, cutoff)
    actuals = await comparison_service.hourly_actuals(db, start, end)

    hours: list[DayAheadHour] = []
    for t in range(start, end, HOUR):
        hour = DayAheadHour(t=from_epoch(t), horizon_h=(t - cutoff) / HOUR, actual=actuals.get(t))
        if t in picks:
            publish, f = picks[t]
            hour.forecast, hour.publish_time = f, from_epoch(publish)
        hours.append(hour)

    await add_error_bands(db, hours, ref_start, ref_end)
    forecast_gwh, count_on_gwh, actual_gwh = totals(hours)
    return DayAheadResponse(
        delivery_date=delivery,
        cutoff=from_epoch(cutoff),
        forecast_gwh=forecast_gwh,
        count_on_gwh=count_on_gwh,
        actual_gwh=actual_gwh,
        hours=hours,
    )
