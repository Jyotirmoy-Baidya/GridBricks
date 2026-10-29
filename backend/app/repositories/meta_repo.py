from app.core.db import Db


async def mark_ingested(db: Db) -> None:
    await db.execute(
        """
        INSERT INTO ingest_meta (id, ingested_at) VALUES (1, now())
        ON CONFLICT (id) DO UPDATE SET ingested_at = EXCLUDED.ingested_at
        """
    )


async def get_coverage(db: Db) -> dict[str, str]:
    """Row counts and bounds computed from the data itself. Empty dict when nothing is loaded.

    Bounds are epoch seconds (as strings); ingested_at is ISO-8601.
    """
    rec = await db.fetchrow(
        """
        SELECT (SELECT count(*) FROM actual_generation)                          AS actual_rows,
               (SELECT count(*) FROM wind_forecast)                              AS forecast_rows,
               (SELECT extract(epoch FROM min(start_time))::bigint FROM actual_generation) AS actual_min,
               (SELECT extract(epoch FROM max(start_time))::bigint FROM actual_generation) AS actual_max,
               (SELECT extract(epoch FROM min(target_time))::bigint FROM wind_forecast)    AS target_min,
               (SELECT extract(epoch FROM max(target_time))::bigint FROM wind_forecast)    AS target_max,
               (SELECT to_char(ingested_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
                  FROM ingest_meta WHERE id = 1)                                 AS ingested_at
        """
    )
    if rec is None or rec["actual_rows"] == 0:
        return {}
    return {k: str(v) for k, v in dict(rec).items() if v is not None}
