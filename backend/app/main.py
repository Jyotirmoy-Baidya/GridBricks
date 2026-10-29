import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import asyncpg
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from redis.exceptions import RedisError

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.db import create_pool, init_schema
from app.core.exceptions import register_exception_handlers
from app.core.middleware import RateLimitMiddleware, RequestContextMiddleware
from app.core.redis import create_redis
from app.services.seed_service import load_seed_if_empty

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    app.state.redis = create_redis(settings)
    app.state.db = await create_pool(settings)  # Postgres is the system of record: fail loudly
    if settings.run_startup_init:
        await init_schema(app.state.db)
        try:
            await load_seed_if_empty(app.state.db, app.state.redis)
        except (RedisError, asyncpg.PostgresError, OSError):
            logger.exception("could not load the bundled seed data")
    yield
    await app.state.db.close()
    await app.state.redis.aclose()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="Wind Forecast Monitor API", version="0.1.0", lifespan=lifespan)
    app.add_middleware(RateLimitMiddleware)
    app.add_middleware(RequestContextMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_methods=["GET", "POST"],
        allow_headers=["*"],
        expose_headers=["X-Request-Id", "Retry-After"],
    )
    register_exception_handlers(app)
    app.include_router(api_router)
    return app


app = create_app()
