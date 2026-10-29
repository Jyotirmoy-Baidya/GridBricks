from datetime import datetime

from pydantic import BaseModel


class CalibrationResponse(BaseModel):
    """Out-of-sample check: learn the error pattern on history before the range, test inside it."""

    horizon_h: float
    enough_training: bool  # false when there is less than a week of earlier history
    n_train: int
    n_test: int
    train_start: datetime
    train_end: datetime
    test_start: datetime
    test_end: datetime
    # Error learned on the training window (MW, forecast - actual).
    q10: float | None = None
    q90: float | None = None
    train_bias: float | None = None
    test_bias: float | None = None
    # How often the P10-P90 range held the actual (target 80%), out of sample and in sample.
    band_target: float = 0.8
    band_coverage: float | None = None
    band_coverage_in_sample: float | None = None
    # How often actual output was at or above the count-on line (target 90%).
    count_on_target: float = 0.9
    count_on_hit_rate: float | None = None
    # Removing the typical error learned on the training window.
    mae_raw: float | None = None
    mae_adjusted: float | None = None
    rmse_raw: float | None = None
    rmse_adjusted: float | None = None
