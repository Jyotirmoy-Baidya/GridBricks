from datetime import date
from typing import Annotated

from fastapi import APIRouter, Query

from app.api.deps import RedisDep, SettingsDep
from app.controllers import day_ahead_controller as ctl
from app.schemas.day_ahead import DayAheadResponse

router = APIRouter()

CutoffQuery = Annotated[
    str, Query(pattern=r"^([01]\d|2[0-3]):[0-5]\d$", description="HH:MM London time on D-1")
]


@router.get("/day-ahead/{delivery_date}", response_model=DayAheadResponse)
async def day_ahead(
    delivery_date: date, redis: RedisDep, settings: SettingsDep, cutoff: CutoffQuery = "09:00"
) -> DayAheadResponse:
    return await ctl.day_ahead(redis, settings, delivery_date, cutoff)
