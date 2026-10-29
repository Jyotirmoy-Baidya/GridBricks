from datetime import datetime, timedelta
from typing import Any

from app.core.db import Db
from app.schemas.day_ahead import DayAheadHour
from app.schemas.live import LiveResponse
from app.services import day_ahead_service
from app.services.cleaning import clean_forecasts
from app.services.elexon_client import ElexonClient
from app.utils.time import HOUR, LONDON, dt_to_epoch, from_epoch, london_day_bounds

LOOKBACK_DAYS = 3  # WINDFOR publishes about 8 times a day; three days is ample


async def fetch_recent(client: ElexonClient, now: datetime) -> list[dict[str, Any]]:
    today = now.date()
    return await client.fetch_forecasts(today - timedelta(days=LOOKBACK_DAYS), today + timedelta(days=1))


async def build(
    db: Db,
    raw: list[dict[str, Any]],
    now: datetime,
    ref_range: tuple[int, int] | None,
) -> LiveResponse:
    """Tomorrow's hourly wind, using the newest forecast published up to now for each hour.

    Nothing is stored: live rows never mix into the January dataset or its metrics. The
    P10-P90 range and count-on line reuse the January error statistics (ref_range), when loaded.
    """
    now_epoch = dt_to_epoch(now)
    delivery = now.astimezone(LONDON).date() + timedelta(days=1)
    start, end = london_day_bounds(delivery)

    newest: dict[int, tuple[int, int]] = {}  # target -> (publish, mw)
    for target, publish, mw in clean_forecasts(raw, max_horizon_h=96):
        if publish > now_epoch or not start <= target < end:
            continue
        if target not in newest or publish > newest[target][0]:
            newest[target] = (publish, mw)

    hours: list[DayAheadHour] = []
    for t in range(start, end, HOUR):
        if t in newest:
            publish, mw = newest[t]
            hours.append(
                DayAheadHour(
                    t=from_epoch(t),
                    horizon_h=(t - publish) / HOUR,
                    forecast=mw,
                    publish_time=from_epoch(publish),
                )
            )
        else:
            hours.append(DayAheadHour(t=from_epoch(t), horizon_h=(t - now_epoch) / HOUR))

    if ref_range is not None:
        await day_ahead_service.add_error_bands(db, hours, *ref_range)
    forecast_gwh, count_on_gwh, _ = day_ahead_service.totals(hours)
    published = [h.publish_time for h in hours if h.publish_time is not None]
    return LiveResponse(
        delivery_date=delivery,
        as_of=max(published) if published else None,
        fetched_at=now,
        forecast_gwh=forecast_gwh,
        count_on_gwh=count_on_gwh,
        hours=hours,
    )
