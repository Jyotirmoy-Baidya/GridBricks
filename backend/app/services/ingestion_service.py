import base64
import json
import zlib
from datetime import date, timedelta
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


CHUNK_DAYS = 31
FRESH_DAYS = 3  # windows this close to today are still changing, so never serve them from cache


def windows(start: date, end: date, days: int = CHUNK_DAYS) -> list[tuple[date, date]]:
    """Split [start, end] into consecutive inclusive windows of at most `days` days."""
    out: list[tuple[date, date]] = []
    cur = start
    while cur <= end:
        last = min(cur + timedelta(days=days - 1), end)
        out.append((cur, last))
        cur = last + timedelta(days=1)
    return out


async def _cached_fetch(
    redis: Redis, dataset: str, start: date, end: date, fetch: Any
) -> list[dict[str, Any]]:
    """Raw Elexon responses are cached in Redis so a re-ingest does not hit the upstream API.

    Windows touching the last few days are always fetched fresh.
    """
    fresh = end >= date.today() - timedelta(days=FRESH_DAYS)
    key = keys.raw_key(dataset, start.isoformat(), end.isoformat())
    if not fresh:
        blob = await redis.get(key)
        if blob:
            return _unpack(str(blob))
    rows: list[dict[str, Any]] = await fetch(start, end)
    if not fresh:
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
        actuals: list[ActualRow] = []
        forecasts: list[ForecastRow] = []
        for a, b in windows(start, end):
            raw_a = await _cached_fetch(redis, "FUELHH", a, b, client.fetch_actuals)
            # WINDFOR is selected by publish time; the "to" bound is exclusive, so reach into the next day.
            raw_f = await _cached_fetch(
                redis, "WINDFOR", a, b, lambda s, e: client.fetch_forecasts(s, e + timedelta(days=1))
            )
            actuals += clean_actuals(raw_a)
            forecasts += clean_forecasts(raw_f, max_horizon_h)
        # Windows can overlap by a publish; keep one row per key so the upsert never sees a duplicate.
        by_target = dict(actuals)
        by_key = {(t, p): mw for t, p, mw in forecasts}
        await store_rows(
            db,
            redis,
            sorted(by_target.items()),
            sorted((t, p, mw) for (t, p), mw in by_key.items()),
        )
    finally:
        await redis.delete(keys.INGEST_LOCK)
    return await meta_repo.get_coverage(db)


__all__ = ["Db", "IngestInProgressError", "ingest", "store_rows"]
