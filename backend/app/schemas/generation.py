from datetime import datetime

from pydantic import BaseModel


class CoverageResponse(BaseModel):
    loaded: bool
    ingested_at: datetime | None = None
    actual_rows: int = 0
    forecast_rows: int = 0
    actual_start: datetime | None = None
    actual_end: datetime | None = None
    target_start: datetime | None = None
    target_end: datetime | None = None


class ActualPoint(BaseModel):
    t: datetime
    generation: int


class ActualsResponse(BaseModel):
    points: list[ActualPoint]


class SelectedForecastPoint(BaseModel):
    t: datetime
    forecast: int
    publish_time: datetime


class ForecastsResponse(BaseModel):
    horizon_h: float
    points: list[SelectedForecastPoint]


class ComparisonPoint(BaseModel):
    t: datetime
    actual: int
    forecast: int | None = None
    publish_time: datetime | None = None
    error: int | None = None  # forecast - actual


class ComparisonResponse(BaseModel):
    horizon_h: float
    points: list[ComparisonPoint]
