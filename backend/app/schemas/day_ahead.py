from datetime import date, datetime

from pydantic import BaseModel


class DayAheadHour(BaseModel):
    t: datetime
    horizon_h: float
    forecast: int | None = None
    publish_time: datetime | None = None
    p10: int | None = None
    p90: int | None = None
    count_on: int | None = None  # forecast less the P90 over-forecast, floored at 0
    actual: int | None = None


class DayAheadResponse(BaseModel):
    delivery_date: date
    cutoff: datetime
    forecast_gwh: float | None = None
    count_on_gwh: float | None = None
    actual_gwh: float | None = None
    hours: list[DayAheadHour]
