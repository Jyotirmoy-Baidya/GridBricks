from fastapi import APIRouter

from app.api.deps import DbDep, RedisDep
from app.controllers.health_controller import get_health
from app.schemas.health import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health(db: DbDep, redis: RedisDep) -> HealthResponse:
    return await get_health(db, redis)
