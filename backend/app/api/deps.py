from dataclasses import dataclass
from datetime import datetime
from typing import Annotated

from fastapi import Depends, Query
from redis.asyncio import Redis

from app.core.config import Settings, get_settings
from app.core.exceptions import ApiError
from app.core.redis import get_redis
from app.utils.time import dt_to_epoch

MAX_RANGE_DAYS = 45

RedisDep = Annotated[Redis, Depends(get_redis)]
SettingsDep = Annotated[Settings, Depends(get_settings)]
HorizonQuery = Annotated[float, Query(ge=0, le=48, description="Hours between publish and target")]


@dataclass(frozen=True)
class TimeRange:
    start: int  # epoch seconds, inclusive
    end: int  # epoch seconds, exclusive


def time_range(start: datetime, end: datetime) -> TimeRange:
    s, e = dt_to_epoch(start), dt_to_epoch(end)
    if e <= s:
        raise ApiError(422, "'end' must be after 'start'")
    if e - s > MAX_RANGE_DAYS * 86400:
        raise ApiError(422, f"range is limited to {MAX_RANGE_DAYS} days")
    return TimeRange(s, e)


RangeDep = Annotated[TimeRange, Depends(time_range)]
