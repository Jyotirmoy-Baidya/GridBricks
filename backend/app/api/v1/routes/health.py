from typing import Annotated

from fastapi import APIRouter, Depends
from redis.asyncio import Redis

from app.controllers.health_controller import get_health
from app.core.redis import get_redis
from app.schemas.health import HealthResponse

router = APIRouter()

RedisDep = Annotated[Redis, Depends(get_redis)]


@router.get("/health", response_model=HealthResponse)
async def health(redis: RedisDep) -> HealthResponse:
    return await get_health(redis)
