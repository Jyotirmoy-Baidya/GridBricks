import ssl
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

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


def clean_dsn(url: str) -> str:
    """Drop URL options asyncpg cannot parse (Neon adds channel_binding=require)."""
    parts = urlparse(url)
    query = [(k, v) for k, v in parse_qsl(parts.query) if k != "channel_binding"]
    return urlunparse(parts._replace(query=urlencode(query)))


def uses_pooler(url: str) -> bool:
    """Neon's -pooler host is PgBouncer in transaction mode: no prepared statements, no session locks."""
    return "-pooler" in (urlparse(url).hostname or "")


def direct_url(url: str) -> str:
    """The same database through the direct (non-pooled) host, for schema setup and advisory locks."""
    parts = urlparse(url)
    host = (parts.hostname or "").replace("-pooler", "")
    netloc = parts.netloc.replace(parts.hostname or "", host)
    return urlunparse(parts._replace(netloc=netloc))


async def create_pool(
    settings: Settings, server_settings: dict[str, str] | None = None
) -> asyncpg.Pool:
    # UTC session so date_trunc('hour', ...) lines up with settlement hours.
    return await asyncpg.create_pool(
        clean_dsn(settings.database_url),
        min_size=1,
        max_size=settings.db_pool_max,
        ssl=_ssl_for(settings.database_url),
        statement_cache_size=0 if uses_pooler(settings.database_url) else 100,
        server_settings={"timezone": "UTC", **(server_settings or {})},
    )


SCHEMA_LOCK_ID = 7_243_000  # arbitrary key for the Postgres advisory lock


async def init_schema(pool: asyncpg.Pool) -> None:
    """Create the tables. Workers start together, and concurrent CREATE TABLE IF NOT EXISTS can
    still collide in Postgres' catalog, so one worker at a time holds an advisory lock."""
    async with pool.acquire() as conn:
        await conn.execute("SELECT pg_advisory_lock($1)", SCHEMA_LOCK_ID)
        try:
            await conn.execute(SCHEMA_PATH.read_text())
        finally:
            await conn.execute("SELECT pg_advisory_unlock($1)", SCHEMA_LOCK_ID)


async def get_db(request: Request) -> asyncpg.Pool:
    return request.app.state.db  # type: ignore[no-any-return]
