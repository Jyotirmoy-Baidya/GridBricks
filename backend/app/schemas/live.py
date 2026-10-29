from datetime import date, datetime

from pydantic import BaseModel

from app.schemas.day_ahead import DayAheadHour


class LiveResponse(BaseModel):
    delivery_date: date  # tomorrow, London time
    as_of: datetime | None = None  # newest forecast publish used
    fetched_at: datetime
    forecast_gwh: float | None = None
    count_on_gwh: float | None = None
    hours: list[DayAheadHour]
