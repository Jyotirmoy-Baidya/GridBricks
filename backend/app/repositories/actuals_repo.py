from app.core.db import Db
from app.services.cleaning import ActualRow


async def upsert(db: Db, rows: list[ActualRow]) -> None:
    """Insert or revise actuals (FUELHH values can be restated)."""
    await db.execute(
        """
        INSERT INTO actual_generation (start_time, generation_mw)
        SELECT to_timestamp(t), mw FROM unnest($1::bigint[], $2::int[]) AS u(t, mw)
        ON CONFLICT (start_time) DO UPDATE SET generation_mw = EXCLUDED.generation_mw
        """,
        [t for t, _ in rows],
        [mw for _, mw in rows],
    )


async def purge_invalid(db: Db) -> int:
    """Delete readings of 0 MW or less (missing values) stored by an earlier load. Returns the count."""
    status = await db.execute("DELETE FROM actual_generation WHERE generation_mw <= 0")
    return int(status.split()[-1])


async def get_range(db: Db, start_epoch: int, end_epoch: int) -> list[ActualRow]:
    """Actuals with start_epoch <= target < end_epoch, ascending."""
    rows = await db.fetch(
        """
        SELECT extract(epoch FROM start_time)::bigint AS t, generation_mw AS mw
        FROM actual_generation
        WHERE start_time >= to_timestamp($1::bigint) AND start_time < to_timestamp($2::bigint)
        ORDER BY start_time
        """,
        start_epoch,
        end_epoch,
    )
    return [(r["t"], r["mw"]) for r in rows]
