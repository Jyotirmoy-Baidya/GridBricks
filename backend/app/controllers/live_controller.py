from datetime import UTC, datetime

import asyncpg
from redis.asyncio import Redis

from app.core.config import Settings
from app.core.exceptions import ApiError
from app.repositories import meta_repo
from app.schemas.live import LiveResponse
from app.services import cache_service, live_service
from app.services.elexon_client import ElexonClient, ElexonError

LIVE_TTL_S = 600  # new WINDFOR publishes arrive every few hours; ten minutes is plenty fresh


async def live(db: asyncpg.Pool, redis: Redis, settings: Settings) -> LiveResponse:
    now = datetime.now(UTC).replace(microsecond=0)

    async def compute() -> LiveResponse:
        client = ElexonClient(settings.elexon_base_url)
        try:
            raw = await live_service.fetch_recent(client, now)
        except ElexonError as exc:
            raise ApiError(502, f"Elexon is unreachable: {exc}") from exc
        finally:
            await client.aclose()
        cov = await meta_repo.get_coverage(db)
        ref = (int(cov["actual_min"]), int(cov["actual_max"]) + 1) if "actual_min" in cov else None
        return await live_service.build(db, raw, now, ref)

    # Keyed to a ten-minute bucket so concurrent viewers share one upstream call.
    params = {"bucket": int(now.timestamp()) // LIVE_TTL_S}
    return await cache_service.get_or_compute(redis, "live", params, LiveResponse, compute, LIVE_TTL_S)
