"""API tests on a synthetic day where the right answers are known.

2026-01-10, hours 0..23. Actual = 1000 + 10*i.
Forecast A: published 2026-01-09 08:00, actual + 200 (available at every horizon >= ~16 h).
Forecast B: published 2 h before each target, actual - 50.
So horizon 4 picks A (+200 error) and horizon 1 picks B (-50 error).
"""

import fakeredis.aioredis
import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import get_settings
from app.main import create_app
from app.services.ingestion_service import store_rows
from app.utils.time import to_epoch

H = 3600
DAY = to_epoch("2026-01-10T00:00:00Z")
PUB_A = to_epoch("2026-01-09T08:00:00Z")
Q = "start=2026-01-10T00:00:00Z&end=2026-01-11T00:00:00Z"


@pytest.fixture
async def client(redis):
    actuals = [(DAY + i * H, 1000 + 10 * i) for i in range(24)]
    forecasts = []
    for t, a in actuals:
        forecasts.append((t, PUB_A, a + 200))
        forecasts.append((t, t - 2 * H, a - 50))
    await store_rows(redis, actuals, forecasts)
    app = create_app()
    app.state.redis = redis
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


async def test_coverage(client):
    body = (await client.get("/api/v1/meta/coverage")).json()
    assert body["loaded"] is True and body["actual_rows"] == 24 and body["forecast_rows"] == 48


async def test_comparison_picks_latest_allowed_forecast(client):
    at4 = (await client.get(f"/api/v1/generation/comparison?{Q}&horizon_h=4")).json()["points"]
    assert at4[0]["forecast"] == 1200 and at4[0]["error"] == 200
    at1 = (await client.get(f"/api/v1/generation/comparison?{Q}&horizon_h=1")).json()["points"]
    assert at1[0]["forecast"] == 950 and at1[0]["error"] == -50


async def test_summary_by_horizon(client):
    s4 = (await client.get(f"/api/v1/metrics/summary?{Q}&horizon_h=4")).json()
    assert (s4["n"], s4["mae"], s4["bias"], s4["coverage"]) == (24, 200.0, 200.0, 1.0)
    s1 = (await client.get(f"/api/v1/metrics/summary?{Q}&horizon_h=1")).json()
    assert (s1["mae"], s1["bias"]) == (50.0, -50.0)


async def test_by_horizon_rows(client):
    rows = (await client.get(f"/api/v1/metrics/by-horizon?{Q}&max_h=4")).json()["rows"]
    assert [r["horizon_h"] for r in rows] == [0, 1, 2, 3, 4]
    assert rows[1]["mae"] == 50.0 and rows[4]["mae"] == 200.0


async def test_day_ahead_band_and_count_on(client):
    body = (await client.get("/api/v1/day-ahead/2026-01-10?cutoff=09:00")).json()
    assert body["cutoff"].startswith("2026-01-09T09:00")
    h0 = body["hours"][0]
    assert h0["forecast"] == 1200 and h0["actual"] == 1000
    # constant +200 error, so the band and count-on collapse onto the actual
    assert h0["p10"] == h0["p90"] == h0["count_on"] == 1000
    assert body["actual_gwh"] == round(sum(1000 + 10 * i for i in range(24)) / 1000, 2)


async def test_day_ahead_cutoff_before_publish_has_gaps(client):
    body = (await client.get("/api/v1/day-ahead/2026-01-10?cutoff=07:00")).json()
    assert body["hours"][0]["forecast"] is None and body["forecast_gwh"] is None


async def test_responses_are_cached_under_data_version(client, redis):
    await client.get(f"/api/v1/metrics/summary?{Q}&horizon_h=4")
    keys = [k async for k in redis.scan_iter("cache:v1:metrics-summary:*")]
    assert len(keys) == 1


@pytest.mark.parametrize(
    "url",
    [
        "/api/v1/metrics/summary?start=2026-01-11T00:00:00Z&end=2026-01-10T00:00:00Z",
        "/api/v1/metrics/summary?start=2026-01-01T00:00:00Z&end=2026-03-01T00:00:00Z",
        f"/api/v1/metrics/summary?{Q}&horizon_h=49",
        "/api/v1/day-ahead/2026-01-10?cutoff=25:00",
    ],
)
async def test_bad_input_returns_422(client, url):
    assert (await client.get(url)).status_code == 422


async def test_admin_ingest_requires_token(client):
    r = await client.post("/api/v1/admin/ingest", json={"from": "2026-01-01", "to": "2026-01-02"})
    assert r.status_code == 401


async def test_rate_limit_returns_429(redis, monkeypatch):
    monkeypatch.setenv("RATE_LIMIT_PER_MIN", "2")
    get_settings.cache_clear()
    try:
        app = create_app()
        app.state.redis = redis
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            codes = [(await c.get("/api/v1/meta/coverage")).status_code for _ in range(3)]
            assert codes == [200, 200, 429]
            assert "retry-after" in (await c.get("/api/v1/meta/coverage")).headers
    finally:
        get_settings.cache_clear()


def test_fakeredis_import_is_available():
    assert fakeredis.aioredis.FakeRedis
