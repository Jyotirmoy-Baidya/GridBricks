from typing import NamedTuple

from app.core.db import Db


class Row(NamedTuple):
    t: int
    actual: int
    forecast: int | None
    publish: int | None


async def compare(db: Db, start: int, end: int, horizon_h: float) -> list[Row]:
    """One row per actual hour in [start, end), joined to the newest forecast with
    publish <= hour - horizon_h (None when there is no such forecast)."""
    records = await db.fetch(
        """
        SELECT extract(epoch FROM a.start_time)::bigint AS t,
               a.generation_mw                          AS actual,
               f.generation_mw                          AS forecast,
               extract(epoch FROM f.publish_time)::bigint AS publish
        FROM actual_generation a
        LEFT JOIN LATERAL (
            SELECT w.publish_time, w.generation_mw
            FROM wind_forecast w
            WHERE w.target_time = a.start_time
              AND w.publish_time <= a.start_time - ($3::float8 * interval '1 hour')
            ORDER BY w.publish_time DESC
            LIMIT 1
        ) f ON true
        WHERE a.start_time >= to_timestamp($1::bigint)
          AND a.start_time <  to_timestamp($2::bigint)
          AND a.start_time = date_trunc('hour', a.start_time)
        ORDER BY a.start_time
        """,
        start,
        end,
        float(horizon_h),
    )
    return [Row(r["t"], r["actual"], r["forecast"], r["publish"]) for r in records]
