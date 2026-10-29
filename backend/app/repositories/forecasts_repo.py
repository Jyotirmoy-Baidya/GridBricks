from app.core.db import Db
from app.services.cleaning import ForecastRow

_LATEST = """
    SELECT DISTINCT ON (target_time)
           extract(epoch FROM target_time)::bigint  AS t,
           extract(epoch FROM publish_time)::bigint AS p,
           generation_mw                            AS mw
    FROM wind_forecast
    WHERE target_time >= to_timestamp($1::bigint)
      AND target_time <  to_timestamp($2::bigint)
      AND target_time = date_trunc('hour', target_time)
      AND publish_time <= {cutoff}
    ORDER BY target_time, publish_time DESC
"""


async def upsert(db: Db, rows: list[ForecastRow]) -> None:
    await db.execute(
        """
        INSERT INTO wind_forecast (target_time, publish_time, generation_mw)
        SELECT to_timestamp(t), to_timestamp(p), mw
        FROM unnest($1::bigint[], $2::bigint[], $3::int[]) AS u(t, p, mw)
        ON CONFLICT (target_time, publish_time) DO UPDATE SET generation_mw = EXCLUDED.generation_mw
        """,
        [t for t, _, _ in rows],
        [p for _, p, _ in rows],
        [mw for _, _, mw in rows],
    )


def _pairs(records: list) -> dict[int, tuple[int, int]]:  # type: ignore[type-arg]
    return {r["t"]: (r["p"], r["mw"]) for r in records}


async def latest_by_horizon(
    db: Db, start: int, end: int, horizon_h: float
) -> dict[int, tuple[int, int]]:
    """Horizon mode: per target hour in [start, end), newest forecast with publish <= target - h.

    Returns {target_epoch: (publish_epoch, mw)}; hours with no early-enough forecast are absent.
    """
    sql = _LATEST.format(cutoff="target_time - ($3::float8 * interval '1 hour')")
    return _pairs(await db.fetch(sql, start, end, float(horizon_h)))


async def latest_at_cutoff(
    db: Db, start: int, end: int, cutoff_epoch: int
) -> dict[int, tuple[int, int]]:
    """Day-ahead mode: per target hour in [start, end), newest forecast with publish <= one cut-off."""
    sql = _LATEST.format(cutoff="to_timestamp($3::bigint)")
    return _pairs(await db.fetch(sql, start, end, cutoff_epoch))
