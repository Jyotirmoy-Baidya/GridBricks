from typing import Annotated

from fastapi import APIRouter, Query

from app.api.deps import DbDep, HorizonQuery, RangeDep, RedisDep, SettingsDep
from app.controllers import metrics_controller as ctl
from app.schemas.metrics import (
    ByHorizonResponse,
    ByHourResponse,
    DistributionResponse,
    SummaryMetrics,
)

router = APIRouter(prefix="/metrics")


@router.get("/summary", response_model=SummaryMetrics)
async def summary(
    db: DbDep, redis: RedisDep, settings: SettingsDep, rng: RangeDep, horizon_h: HorizonQuery = 4.0
) -> SummaryMetrics:
    return await ctl.summary(db, redis, settings, rng, horizon_h)


@router.get("/by-horizon", response_model=ByHorizonResponse)
async def by_horizon(
    db: DbDep,
    redis: RedisDep,
    settings: SettingsDep,
    rng: RangeDep,
    max_h: Annotated[int, Query(ge=1, le=48)] = 48,
) -> ByHorizonResponse:
    return await ctl.by_horizon(db, redis, settings, rng, max_h)


@router.get("/by-hour", response_model=ByHourResponse)
async def by_hour(
    db: DbDep, redis: RedisDep, settings: SettingsDep, rng: RangeDep, horizon_h: HorizonQuery = 4.0
) -> ByHourResponse:
    return await ctl.by_hour(db, redis, settings, rng, horizon_h)


@router.get("/distribution", response_model=DistributionResponse)
async def distribution(
    db: DbDep,
    redis: RedisDep,
    settings: SettingsDep,
    rng: RangeDep,
    horizon_h: HorizonQuery = 4.0,
    bins: Annotated[int, Query(ge=5, le=60)] = 20,
) -> DistributionResponse:
    return await ctl.distribution(db, redis, settings, rng, horizon_h, bins)
