from fastapi import APIRouter

from app.api.deps import HorizonQuery, RangeDep, RedisDep, SettingsDep
from app.controllers import generation_controller as ctl
from app.schemas.generation import (
    ActualsResponse,
    ComparisonResponse,
    CoverageResponse,
    ForecastsResponse,
)

router = APIRouter()


@router.get("/meta/coverage", response_model=CoverageResponse)
async def coverage(redis: RedisDep) -> CoverageResponse:
    return await ctl.coverage(redis)


@router.get("/generation/actuals", response_model=ActualsResponse)
async def actuals(redis: RedisDep, rng: RangeDep) -> ActualsResponse:
    return await ctl.actuals(redis, rng)


@router.get("/generation/forecasts", response_model=ForecastsResponse)
async def forecasts(
    redis: RedisDep, settings: SettingsDep, rng: RangeDep, horizon_h: HorizonQuery = 4.0
) -> ForecastsResponse:
    return await ctl.forecasts(redis, settings, rng, horizon_h)


@router.get("/generation/comparison", response_model=ComparisonResponse)
async def comparison(
    redis: RedisDep, settings: SettingsDep, rng: RangeDep, horizon_h: HorizonQuery = 4.0
) -> ComparisonResponse:
    return await ctl.comparison(redis, settings, rng, horizon_h)
