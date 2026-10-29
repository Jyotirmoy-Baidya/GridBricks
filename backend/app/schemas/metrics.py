from datetime import datetime

from pydantic import BaseModel


class SummaryMetrics(BaseModel):
    n: int  # hours with both a forecast and an actual
    hours: int  # hours with an actual in the range
    coverage: float  # n / hours
    mae: float | None = None
    rmse: float | None = None
    bias: float | None = None  # mean(forecast - actual); positive = over-forecast
    nmae: float | None = None  # mae / mean(actual)
    p50_abs: float | None = None
    p90_abs: float | None = None
    p99_abs: float | None = None
    over_p90: float | None = None  # P90 of positive errors only (shortfall risk)
    correlation: float | None = None


class HorizonMetrics(SummaryMetrics):
    horizon_h: int


class ByHorizonResponse(BaseModel):
    rows: list[HorizonMetrics]


class HourOfDayMetrics(BaseModel):
    hour: int  # Europe/London hour of day
    n: int
    mae: float
    bias: float


class ByHourResponse(BaseModel):
    horizon_h: float
    rows: list[HourOfDayMetrics]


class WorstMiss(BaseModel):
    t: datetime
    publish_time: datetime
    forecast: int
    actual: int
    error: int


class DistributionResponse(BaseModel):
    horizon_h: float
    bin_edges: list[float]
    counts: list[int]
    worst: list[WorstMiss]
