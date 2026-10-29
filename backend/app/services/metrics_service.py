import numpy as np

from app.schemas.metrics import (
    DistributionResponse,
    HourOfDayMetrics,
    SummaryMetrics,
    WorstMiss,
)
from app.services.comparison_service import Row
from app.utils.time import from_epoch, london_hour


def _matched(rows: list[Row]) -> list[Row]:
    return [r for r in rows if r.forecast is not None]


def errors(rows: list[Row]) -> np.ndarray:
    """Signed errors (forecast - actual) for rows that have a forecast."""
    return np.array([r.forecast - r.actual for r in _matched(rows) if r.forecast is not None], float)


def summarize(rows: list[Row]) -> SummaryMetrics:
    matched = _matched(rows)
    n, hours = len(matched), len(rows)
    if n == 0:
        return SummaryMetrics(n=0, hours=hours, coverage=0.0)
    f = np.array([r.forecast for r in matched], float)
    a = np.array([r.actual for r in matched], float)
    e = f - a
    abs_e = np.abs(e)
    over = e[e > 0]
    corr = float(np.corrcoef(f, a)[0, 1]) if n > 1 and f.std() > 0 and a.std() > 0 else None
    mean_actual = float(a.mean())
    return SummaryMetrics(
        n=n,
        hours=hours,
        coverage=round(n / hours, 4),
        mae=round(float(abs_e.mean()), 1),
        rmse=round(float(np.sqrt((e**2).mean())), 1),
        bias=round(float(e.mean()), 1),
        nmae=round(float(abs_e.mean()) / mean_actual, 4) if mean_actual > 0 else None,
        p50_abs=round(float(np.percentile(abs_e, 50)), 1),
        p90_abs=round(float(np.percentile(abs_e, 90)), 1),
        p99_abs=round(float(np.percentile(abs_e, 99)), 1),
        over_p90=round(float(np.percentile(over, 90)), 1) if over.size else 0.0,
        correlation=round(corr, 4) if corr is not None else None,
    )


def by_hour_of_day(rows: list[Row]) -> list[HourOfDayMetrics]:
    groups: dict[int, list[float]] = {}
    for r in _matched(rows):
        if r.forecast is not None:
            groups.setdefault(london_hour(r.t), []).append(r.forecast - r.actual)
    return [
        HourOfDayMetrics(
            hour=h,
            n=len(es),
            mae=round(float(np.mean(np.abs(es))), 1),
            bias=round(float(np.mean(es)), 1),
        )
        for h, es in sorted(groups.items())
    ]


def distribution(rows: list[Row], horizon_h: float, bins: int, top: int = 10) -> DistributionResponse:
    matched = [r for r in _matched(rows) if r.forecast is not None and r.publish is not None]
    if not matched:
        return DistributionResponse(horizon_h=horizon_h, bin_edges=[], counts=[], worst=[])
    e = errors(rows)
    counts, edges = np.histogram(e, bins=bins)
    worst = sorted(matched, key=lambda r: abs((r.forecast or 0) - r.actual), reverse=True)[:top]
    return DistributionResponse(
        horizon_h=horizon_h,
        bin_edges=[round(float(x), 1) for x in edges],
        counts=[int(c) for c in counts],
        worst=[
            WorstMiss(
                t=from_epoch(r.t),
                publish_time=from_epoch(r.publish or 0),
                forecast=r.forecast or 0,
                actual=r.actual,
                error=(r.forecast or 0) - r.actual,
            )
            for r in worst
        ],
    )
