from fastapi import APIRouter

from app.api.deps import DbDep, HorizonQuery, RangeDep, RedisDep, SettingsDep
from app.controllers import generation_controller as ctl
from app.schemas.generation import (
    ActualsResponse,
    ComparisonResponse,
    CoverageResponse,
    ForecastsResponse,
)

router = APIRouter()


@router.get("/meta/coverage", response_model=CoverageResponse)
async def coverage(db: DbDep) -> CoverageResponse:
    return await ctl.coverage(db)


@router.get("/generation/actuals", response_model=ActualsResponse)
async def actuals(db: DbDep, rng: RangeDep) -> ActualsResponse:
    return await ctl.actuals(db, rng)


@router.get("/generation/forecasts", response_model=ForecastsResponse)
async def forecasts(
    db: DbDep, redis: RedisDep, settings: SettingsDep, rng: RangeDep, horizon_h: HorizonQuery = 4.0
) -> ForecastsResponse:
    return await ctl.forecasts(db, redis, settings, rng, horizon_h)


@router.get("/generation/comparison", response_model=ComparisonResponse)
async def comparison(
    db: DbDep, redis: RedisDep, settings: SettingsDep, rng: RangeDep, horizon_h: HorizonQuery = 4.0
) -> ComparisonResponse:
    return await ctl.comparison(db, redis, settings, rng, horizon_h)
