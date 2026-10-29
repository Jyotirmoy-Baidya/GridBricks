import base64
import json
import zlib
from datetime import UTC, date, datetime
from typing import Any

from redis.asyncio import Redis

from app.repositories import actuals_repo, forecasts_repo, keys, meta_repo
from app.services.cleaning import ActualRow, ForecastRow, clean_actuals, clean_forecasts
from app.services.elexon_client import ElexonClient

LOCK_TTL_S = 300
RAW_TTL_S = 7 * 24 * 3600


class IngestInProgressError(Exception):
    pass


def _pack(rows: list[dict[str, Any]]) -> str:
    return base64.b64encode(zlib.compress(json.dumps(rows).encode())).decode()


def _unpack(blob: str) -> list[dict[str, Any]]:
    return json.loads(zlib.decompress(base64.b64decode(blob)))  # type: ignore[no-any-return]


async def _cached_fetch(
    redis: Redis, dataset: str, start: date, end: date, fetch: Any
) -> list[dict[str, Any]]:
    key = keys.raw_key(dataset, start.isoformat(), end.isoformat())
    blob = await redis.get(key)
    if blob:
        return _unpack(str(blob))
    rows: list[dict[str, Any]] = await fetch(start, end)
    await redis.set(key, _pack(rows), ex=RAW_TTL_S)
    return rows


async def store_rows(redis: Redis, actuals: list[ActualRow], forecasts: list[ForecastRow]) -> None:
    """Write cleaned rows, refresh coverage metadata and bump the cache version."""
    await actuals_repo.upsert(redis, actuals)
    await forecasts_repo.upsert(redis, forecasts)
    coverage: dict[str, int | str] = {
        "ingested_at": datetime.now(UTC).isoformat(timespec="seconds"),
        "actual_rows": len(actuals),
        "forecast_rows": len(forecasts),
    }
    if actuals:
        coverage["actual_min"], coverage["actual_max"] = actuals[0][0], actuals[-1][0]
    if forecasts:
        targets = [f[0] for f in forecasts]
        coverage["target_min"], coverage["target_max"] = min(targets), max(targets)
    await meta_repo.set_coverage(redis, coverage)
    await meta_repo.bump_version(redis)


async def ingest(
    redis: Redis, client: ElexonClient, start: date, end: date, max_horizon_h: int = 48
) -> dict[str, str]:
    """Fetch FUELHH + WINDFOR for [start, end], clean, store. One run at a time."""
    if not await redis.set(keys.INGEST_LOCK, "1", nx=True, ex=LOCK_TTL_S):
        raise IngestInProgressError("an ingest is already running")
    try:
        raw_a = await _cached_fetch(redis, "FUELHH", start, end, client.fetch_actuals)
        raw_f = await _cached_fetch(redis, "WINDFOR", start, end, client.fetch_forecasts)
        await store_rows(redis, clean_actuals(raw_a), clean_forecasts(raw_f, max_horizon_h))
    finally:
        await redis.delete(keys.INGEST_LOCK)
    return await meta_repo.get_coverage(redis)
