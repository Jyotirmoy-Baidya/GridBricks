import pytest
from httpx import ASGITransport, AsyncClient

from app.main import create_app
from app.services import calibration_service
from app.services.ingestion_service import store_rows
from app.utils.time import to_epoch

H = 3600
DAY = 24 * H
START = to_epoch("2026-03-01T00:00:00Z")
DAYS = 20


def _history():
    """20 days of hourly data. Forecast error cycles through -50..+150 (mean about +50)."""
    actuals, forecasts = [], []
    for i in range(DAYS * 24):
        t = START + i * H
        err = ((i * 37) % 21) * 10 - 50
        actuals.append((t, 1000))
        forecasts.append((t, t - 4 * H, 1000 + err))
    return actuals, forecasts


@pytest.fixture
async def loaded(db, redis):
    actuals, forecasts = _history()
    await store_rows(db, redis, actuals, forecasts)
    return db


TRAIN_DAYS = 14


async def test_learns_on_the_past_and_scores_on_the_range(loaded):
    test_start = START + TRAIN_DAYS * DAY
    r = await calibration_service.calibrate(loaded, START, test_start, START + DAYS * DAY, 4)
    assert r.enough_training and r.n_train == TRAIN_DAYS * 24 and r.n_test == (DAYS - TRAIN_DAYS) * 24
    assert 40 <= r.train_bias <= 60  # the steady +50 offset is learned
    assert 0.7 <= r.band_coverage <= 0.9  # a P10-P90 range should hold about 80%
    assert r.count_on_hit_rate >= 0.8  # close to the 90% target
    assert r.mae_adjusted < r.mae_raw and r.rmse_adjusted < r.rmse_raw  # removing the offset helps


async def test_recent_training_window_limits_what_is_learned(loaded):
    test_start = START + TRAIN_DAYS * DAY
    r = await calibration_service.calibrate(loaded, START, test_start, START + DAYS * DAY, 4, train_days=10)
    assert r.n_train == 10 * 24 and r.train_start.day == 5  # 1 Mar + 14 d - 10 d


async def test_reports_when_there_is_too_little_history(loaded):
    r = await calibration_service.calibrate(loaded, START, START + 2 * DAY, START + 5 * DAY, 4)
    assert r.enough_training is False and r.band_coverage is None


@pytest.fixture
async def client(loaded, redis):
    app = create_app()
    app.state.db, app.state.redis = loaded, redis
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


async def test_endpoint(client):
    q = "start=2026-03-15T00:00:00Z&end=2026-03-21T00:00:00Z&horizon_h=4"
    body = (await client.get(f"/api/v1/metrics/calibration?{q}")).json()
    assert body["enough_training"] is True and body["band_target"] == 0.8
    assert body["train_start"].startswith("2026-03-01")


def test_reference_window_prefers_the_recent_month_and_falls_back_when_history_is_short():
    from app.services.day_ahead_service import reference_window

    d = 86400
    assert reference_window(0, 100 * d, 90 * d) == (60 * d, 90 * d, "recent")  # the 30 days before
    assert reference_window(0, 100 * d, 10 * d) == (0, 10 * d, "recent")  # 10 days of history is enough
    assert reference_window(0, 100 * d, 3 * d) == (0, 100 * d, "all_history")  # too little: in-sample
