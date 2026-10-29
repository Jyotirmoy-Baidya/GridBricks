from typing import Any

import numpy as np

from app.core.db import Db
from app.schemas.calibration import CalibrationResponse
from app.services import comparison_service
from app.utils.time import from_epoch

MIN_TRAIN_HOURS = 168  # one week of matched hours
DAY = 86400


def _arrays(rows: list[comparison_service.Row]) -> tuple[np.ndarray, np.ndarray]:
    matched = [r for r in rows if r.forecast is not None]
    f = np.array([r.forecast for r in matched], dtype=float)
    a = np.array([r.actual for r in matched], dtype=float)
    return f, a


def _inside(f: np.ndarray, a: np.ndarray, q10: float, q90: float) -> float:
    """Share of hours where actual fell in [f - q90, f - q10], the P10-P90 range for actual."""
    return float(np.mean((a >= f - q90) & (a <= f - q10)))


async def calibrate(
    db: Db, history_start: int, start: int, end: int, horizon_h: float, train_days: int | None = None
) -> CalibrationResponse:
    """Learn error statistics on the days before `start`, then score them on [start, end).

    The training window is the `train_days` days just before the range (all earlier history when
    None, never earlier than `history_start`). A recent window follows a drifting bias better.

    This is the honest version of the P10-P90 range and count-on line: the statistics never saw
    the hours they are tested on.
    """
    if train_days is not None:
        history_start = max(history_start, start - train_days * DAY)
    f_tr, a_tr = _arrays(await comparison_service.compare(db, history_start, start, horizon_h))
    f_te, a_te = _arrays(await comparison_service.compare(db, start, end, horizon_h))
    base: dict[str, Any] = {
        "horizon_h": horizon_h,
        "n_train": int(f_tr.size),
        "n_test": int(f_te.size),
        "train_start": from_epoch(history_start),
        "train_end": from_epoch(start),
        "test_start": from_epoch(start),
        "test_end": from_epoch(end),
    }
    if f_tr.size < MIN_TRAIN_HOURS or f_te.size == 0:
        return CalibrationResponse(enough_training=False, **base)

    e_tr = f_tr - a_tr
    q10, q90 = float(np.percentile(e_tr, 10)), float(np.percentile(e_tr, 90))
    train_bias = float(e_tr.mean())

    e_te = f_te - a_te
    count_on = np.maximum(0.0, f_te - max(0.0, q90))
    adjusted = np.maximum(0.0, f_te - train_bias)
    in_q10, in_q90 = float(np.percentile(e_te, 10)), float(np.percentile(e_te, 90))

    def r1(x: float) -> float:
        return round(float(x), 1)

    return CalibrationResponse(
        enough_training=True,
        q10=r1(q10),
        q90=r1(q90),
        train_bias=r1(train_bias),
        test_bias=r1(e_te.mean()),
        band_coverage=round(_inside(f_te, a_te, q10, q90), 4),
        band_coverage_in_sample=round(_inside(f_te, a_te, in_q10, in_q90), 4),
        count_on_hit_rate=round(float(np.mean(a_te >= count_on)), 4),
        mae_raw=r1(np.abs(e_te).mean()),
        mae_adjusted=r1(np.abs(adjusted - a_te).mean()),
        rmse_raw=r1(np.sqrt((e_te**2).mean())),
        rmse_adjusted=r1(np.sqrt(((adjusted - a_te) ** 2).mean())),
        **base,
    )
