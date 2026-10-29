import os
from uuid import uuid4

import asyncpg
import fakeredis.aioredis
import pytest

from app.core.config import get_settings
from app.core.db import create_pool, init_schema

DB_URL = os.environ.get("TEST_DATABASE_URL", "postgresql://windmon:windmon@localhost:5433/windmon")


@pytest.fixture
async def redis():
    r = fakeredis.aioredis.FakeRedis(decode_responses=True)
    yield r
    await r.aclose()


@pytest.fixture
async def db():
    """A real Postgres, isolated per test in its own schema (dropped afterwards)."""
    try:
        admin = await asyncpg.connect(DB_URL, timeout=3)
    except (OSError, asyncpg.PostgresError) as exc:
        if os.environ.get("CI"):
            raise
        pytest.skip(f"Postgres not reachable ({exc}); run `docker compose up -d postgres`")
    schema = f"t_{uuid4().hex[:10]}"
    await admin.execute(f'CREATE SCHEMA "{schema}"')
    settings = get_settings().model_copy(update={"database_url": DB_URL})
    pool = await create_pool(settings, server_settings={"search_path": schema})
    await init_schema(pool)
    try:
        yield pool
    finally:
        await pool.close()
        await admin.execute(f'DROP SCHEMA "{schema}" CASCADE')
        await admin.close()
