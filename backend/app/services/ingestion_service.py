import base64
import json
import zlib
from datetime import date
from typing import Any

import asyncpg
from redis.asyncio import Redis

from app.core.db import Db
from app.repositories import actuals_repo, forecasts_repo, keys, meta_repo
from app.services import cache_service
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
    """Raw Elexon responses are cached in Redis so a re-ingest does not hit the upstream API."""
    key = keys.raw_key(dataset, start.isoformat(), end.isoformat())
    blob = await redis.get(key)
    if blob:
        return _unpack(str(blob))
    rows: list[dict[str, Any]] = await fetch(start, end)
    await redis.set(key, _pack(rows), ex=RAW_TTL_S)
    return rows


async def store_rows(
    db: asyncpg.Pool, redis: Redis, actuals: list[ActualRow], forecasts: list[ForecastRow]
) -> None:
    """Write cleaned rows in one transaction, then invalidate cached results."""
    async with db.acquire() as conn, conn.transaction():
        await actuals_repo.upsert(conn, actuals)
        await forecasts_repo.upsert(conn, forecasts)
        await meta_repo.mark_ingested(conn)
    await cache_service.bump_version(redis)


async def ingest(
    db: asyncpg.Pool,
    redis: Redis,
    client: ElexonClient,
    start: date,
    end: date,
    max_horizon_h: int = 72,
) -> dict[str, str]:
    """Fetch FUELHH + WINDFOR for [start, end], clean, store. One run at a time (Redis lock)."""
    if not await redis.set(keys.INGEST_LOCK, "1", nx=True, ex=LOCK_TTL_S):
        raise IngestInProgressError("an ingest is already running")
    try:
        raw_a = await _cached_fetch(redis, "FUELHH", start, end, client.fetch_actuals)
        raw_f = await _cached_fetch(redis, "WINDFOR", start, end, client.fetch_forecasts)
        await store_rows(db, redis, clean_actuals(raw_a), clean_forecasts(raw_f, max_horizon_h))
    finally:
        await redis.delete(keys.INGEST_LOCK)
    return await meta_repo.get_coverage(db)


__all__ = ["Db", "IngestInProgressError", "ingest", "store_rows"]
