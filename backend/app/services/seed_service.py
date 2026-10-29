import gzip
import json
from pathlib import Path

import asyncpg
from redis.asyncio import Redis

from app.repositories import meta_repo
from app.services.cleaning import ActualRow, ForecastRow
from app.services.ingestion_service import store_rows

SEED_PATH = Path(__file__).resolve().parents[2] / "data" / "seed.json.gz"
SEED_LOCK_ID = 7_243_001  # arbitrary key for the Postgres advisory lock


def write_seed(path: Path, actuals: list[ActualRow], forecasts: list[ForecastRow]) -> None:
    payload = {"actuals": actuals, "forecasts": forecasts}
    path.parent.mkdir(parents=True, exist_ok=True)
    with gzip.open(path, "wt", encoding="utf-8") as f:
        json.dump(payload, f, separators=(",", ":"))


async def load_seed_if_empty(db: asyncpg.Pool, redis: Redis, path: Path = SEED_PATH) -> bool:
    """Load the bundled snapshot when the database holds no data. Returns True if it loaded.

    Several workers (or dynos) start at once. An advisory lock makes the check-then-load
    atomic: the first one loads, the others wait, then see data and do nothing.
    """
    if not path.exists():
        return False
    async with db.acquire() as lock_conn:
        await lock_conn.execute("SELECT pg_advisory_lock($1)", SEED_LOCK_ID)
        try:
            if await meta_repo.get_coverage(db):
                return False
            with gzip.open(path, "rt", encoding="utf-8") as f:
                payload = json.load(f)
            actuals = [(int(t), int(mw)) for t, mw in payload["actuals"]]
            forecasts = [(int(t), int(p), int(mw)) for t, p, mw in payload["forecasts"]]
            await store_rows(db, redis, actuals, forecasts)
            return True
        finally:
            await lock_conn.execute("SELECT pg_advisory_unlock($1)", SEED_LOCK_ID)
