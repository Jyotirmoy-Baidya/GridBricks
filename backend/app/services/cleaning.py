from typing import Any

from app.utils.time import to_epoch

HOUR = 3600

ActualRow = tuple[int, int]  # (target_epoch, mw)
ForecastRow = tuple[int, int, int]  # (target_epoch, publish_epoch, mw)


def clean_actuals(raw: list[dict[str, Any]]) -> list[ActualRow]:
    """Keep WIND rows, parse to epoch, dedupe on target time (last row wins)."""
    out: dict[int, int] = {}
    for r in raw:
        if r.get("fuelType") != "WIND" or r.get("generation") is None:
            continue
        out[to_epoch(r["startTime"])] = int(r["generation"])
    return sorted(out.items())


def clean_forecasts(raw: list[dict[str, Any]], max_horizon_h: int = 48) -> list[ForecastRow]:
    """Parse to epoch, drop horizons outside 0..max_horizon_h, dedupe on (target, publish)."""
    out: dict[tuple[int, int], int] = {}
    for r in raw:
        if r.get("generation") is None:
            continue
        target, publish = to_epoch(r["startTime"]), to_epoch(r["publishTime"])
        if not 0 <= (target - publish) <= max_horizon_h * HOUR:
            continue
        out[(target, publish)] = int(r["generation"])
    return sorted((t, p, mw) for (t, p), mw in out.items())
