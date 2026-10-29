from app.services.cleaning import clean_actuals, clean_forecasts
from app.utils.time import to_epoch


def fc(target: str, publish: str, mw: int) -> dict:
    return {"startTime": target, "publishTime": publish, "generation": mw}


def test_clean_actuals_keeps_wind_and_dedupes():
    raw = [
        {"fuelType": "WIND", "startTime": "2026-01-01T00:00:00Z", "generation": 100},
        {"fuelType": "WIND", "startTime": "2026-01-01T00:00:00Z", "generation": 110},
        {"fuelType": "CCGT", "startTime": "2026-01-01T00:00:00Z", "generation": 999},
        {"fuelType": "WIND", "startTime": "2026-01-01T00:30:00Z", "generation": None},
    ]
    assert clean_actuals(raw) == [(to_epoch("2026-01-01T00:00:00Z"), 110)]


def test_clean_forecasts_drops_negative_and_long_horizons():
    pub = "2026-01-02T00:00:00Z"
    raw = [
        fc("2026-01-01T23:00:00Z", pub, 1),  # -1 h: already past
        fc("2026-01-02T00:00:00Z", pub, 2),  # 0 h: kept
        fc("2026-01-04T00:00:00Z", pub, 3),  # 48 h: kept
        fc("2026-01-04T01:00:00Z", pub, 4),  # 49 h: dropped
        fc("2026-01-02T00:00:00Z", pub, 5),  # duplicate, last wins
    ]
    assert [row[2] for row in clean_forecasts(raw, 48)] == [5, 3]
