"""Create the tables and load the bundled data, once, from your machine. Used for serverless hosts
(Vercel) where the API does not do this on startup.

Usage (DATABASE_URL and REDIS_URL come from the environment or backend/.env):
    python -m scripts.init_db
"""

import asyncio

import asyncpg

from app.core.config import get_settings
from app.core.db import create_pool, direct_url, init_schema
from app.core.redis import create_redis
from app.services.seed_service import load_seed_if_empty


async def main() -> None:
    settings = get_settings()
    # session-level advisory locks need a direct connection, not the pooler
    settings.database_url = direct_url(settings.database_url)
    redis = create_redis(settings)
    pool: asyncpg.Pool = await create_pool(settings)
    try:
        await init_schema(pool)
        loaded = await load_seed_if_empty(pool, redis)
        print("seed loaded" if loaded else "database already has data; nothing to load")
    finally:
        await pool.close()
        await redis.aclose()


if __name__ == "__main__":
    asyncio.run(main())
