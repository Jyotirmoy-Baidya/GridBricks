from datetime import date

import numpy as np
from redis.asyncio import Redis

from app.schemas.day_ahead import DayAheadHour, DayAheadResponse
from app.services import comparison_service, forecast_service, metrics_service
from app.utils.time import HOUR, from_epoch, london_cutoff_epoch, london_day_bounds

MAX_HORIZON_H = 48


async def _error_quantiles(
    redis: Redis, horizon_h: int, ref_start: int, ref_end: int
) -> tuple[float, float] | None:
    """P10 and P90 of signed error (forecast - actual) at one horizon over the reference window."""
    rows = await comparison_service.compare(redis, ref_start, ref_end, horizon_h)
    e = metrics_service.errors(rows)
    if e.size == 0:
        return None
    return float(np.percentile(e, 10)), float(np.percentile(e, 90))


async def build(
    redis: Redis, delivery: date, cutoff_hhmm: str, ref_start: int, ref_end: int
) -> DayAheadResponse:
    """Hourly plan for one London delivery day, using the forecast published before the D-1 cut-off.

    The P10-P90 band and "count-on" line come from how wrong forecasts at the same horizon were
    across the reference window (all ingested data), so they are an in-sample guide.
    """
    start, end = london_day_bounds(delivery)
    cutoff = london_cutoff_epoch(delivery, cutoff_hhmm)
    hours = list(range(start, end, HOUR))
    picks = await forecast_service.forecasts_at_cutoff(redis, hours, cutoff)
    actuals = await comparison_service.hourly_actuals(redis, start, end)

    quantiles: dict[int, tuple[float, float] | None] = {}
    out: list[DayAheadHour] = []
    for t in hours:
        horizon = (t - cutoff) / HOUR
        hour = DayAheadHour(t=from_epoch(t), horizon_h=horizon, actual=actuals.get(t))
        if t in picks:
            publish, f = picks[t]
            hour.forecast, hour.publish_time = f, from_epoch(publish)
            h_key = min(max(round(horizon), 0), MAX_HORIZON_H)
            if h_key not in quantiles:
                quantiles[h_key] = await _error_quantiles(redis, h_key, ref_start, ref_end)
            q = quantiles[h_key]
            if q is not None:
                q10, q90 = q
                hour.p10 = max(0, round(f - q90))  # actual = forecast - error
                hour.p90 = max(0, round(f - q10))
                hour.count_on = max(0, round(f - max(0.0, q90)))
        out.append(hour)

    def gwh(values: list[int]) -> float:
        return round(sum(values) / 1000, 2)

    with_f = [h for h in out if h.forecast is not None]
    complete = len(with_f) == len(out)
    return DayAheadResponse(
        delivery_date=delivery,
        cutoff=from_epoch(cutoff),
        forecast_gwh=gwh([h.forecast for h in with_f if h.forecast is not None]) if complete else None,
        count_on_gwh=gwh([h.count_on for h in with_f if h.count_on is not None]) if complete else None,
        actual_gwh=gwh([h.actual for h in out if h.actual is not None])
        if all(h.actual is not None for h in out)
        else None,
        hours=out,
    )
