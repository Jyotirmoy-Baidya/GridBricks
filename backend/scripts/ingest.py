"""Usage: python -m scripts.ingest --from 2025-12-30 --to 2026-02-01"""

import argparse
import asyncio
from datetime import date

from app.core.config import get_settings
from app.core.db import create_pool, init_schema
from app.core.redis import create_redis
from app.services.elexon_client import ElexonClient
from app.services.ingestion_service import ingest


async def main(start: date, end: date) -> None:
    settings = get_settings()
    redis = create_redis(settings)
    db = await create_pool(settings)
    client = ElexonClient(settings.elexon_base_url)
    try:
        await init_schema(db)
        print(await ingest(db, redis, client, start, end, settings.ingest_horizon_h))
    finally:
        await client.aclose()
        await db.close()
        await redis.aclose()


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--from", dest="start", type=date.fromisoformat, required=True)
    p.add_argument("--to", dest="end", type=date.fromisoformat, required=True)
    args = p.parse_args()
    asyncio.run(main(args.start, args.end))
