import ssl
from pathlib import Path
from urllib.parse import urlparse

import asyncpg
from fastapi import Request

from app.core.config import Settings

SCHEMA_PATH = Path(__file__).with_name("schema.sql")
LOCAL_HOSTS = {"localhost", "127.0.0.1", "postgres", "db"}

Db = asyncpg.Pool | asyncpg.Connection


def _ssl_for(url: str) -> ssl.SSLContext | None:
    """Managed Postgres (e.g. Heroku) requires TLS with a self-signed chain; local does not."""
    parsed = urlparse(url)
    if parsed.hostname in LOCAL_HOSTS or "sslmode=disable" in (parsed.query or ""):
        return None
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    return ctx


async def create_pool(
    settings: Settings, server_settings: dict[str, str] | None = None
) -> asyncpg.Pool:
    # UTC session so date_trunc('hour', ...) lines up with settlement hours.
    return await asyncpg.create_pool(
        settings.database_url,
        min_size=1,
        max_size=5,
        ssl=_ssl_for(settings.database_url),
        server_settings={"timezone": "UTC", **(server_settings or {})},
    )


async def init_schema(pool: asyncpg.Pool) -> None:
    await pool.execute(SCHEMA_PATH.read_text())


async def get_db(request: Request) -> asyncpg.Pool:
    return request.app.state.db  # type: ignore[no-any-return]
