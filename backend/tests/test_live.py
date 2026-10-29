from datetime import UTC, datetime

import httpx
import pytest
import respx
from httpx import ASGITransport, AsyncClient

from app.main import create_app
from app.services import live_service
from app.services.ingestion_service import store_rows
from app.utils.time import to_epoch

H = 3600
NOW = datetime(2026, 7, 15, 9, 0, tzinfo=UTC)  # Wednesday in BST (UTC+1); tomorrow is 16 Jul


def fc(target: str, publish: str, mw: int) -> dict:
    return {"startTime": target, "publishTime": publish, "generation": mw}


RAW = [
    # 16 Jul 00:00 London is 15 Jul 23:00Z. Two publishes before now: the newer one must win.
    fc("2026-07-15T23:00:00Z", "2026-07-15T02:30:00Z", 1000),
    fc("2026-07-15T23:00:00Z", "2026-07-15T07:30:00Z", 1200),
    # A publish after "now" is not available yet and must be ignored.
    fc("2026-07-15T23:00:00Z", "2026-07-15T11:30:00Z", 9999),
    # A target on another day is ignored.
    fc("2026-07-17T10:00:00Z", "2026-07-15T07:30:00Z", 5),
]


async def test_live_uses_newest_forecast_published_by_now(db):
    r = await live_service.build(db, RAW, NOW, ref_range=None)
    assert str(r.delivery_date) == "2026-07-16"
    first = r.hours[0]
    assert first.t == datetime(2026, 7, 15, 23, 0, tzinfo=UTC)
    assert (first.forecast, first.publish_time) == (1200, datetime(2026, 7, 15, 7, 30, tzinfo=UTC))
    assert first.horizon_h == 15.5  # 07:30Z publish to 23:00Z target
    assert r.as_of == datetime(2026, 7, 15, 7, 30, tzinfo=UTC)
    assert r.forecast_gwh is None  # other hours have no forecast, so no total
    assert sum(h.forecast is not None for h in r.hours) == 1


async def test_live_adds_bands_from_loaded_history(db, redis):
    # History with a constant +200 error at every horizon: the band collapses onto forecast - 200.
    base = to_epoch("2026-01-10T00:00:00Z")
    actuals = [(base + i * H, 1000) for i in range(24)]
    forecasts = [(t, t - 15 * H, 1200) for t, _ in actuals]
    forecasts += [(t, t - 16 * H, 1200) for t, _ in actuals]
    await store_rows(db, redis, actuals, forecasts)
    r = await live_service.build(db, RAW, NOW, ref_range=(base, base + 24 * H))
    first = r.hours[0]
    assert (first.p10, first.p90, first.count_on) == (1000, 1000, 1000)


@pytest.fixture
async def client(db, redis):
    app = create_app()
    app.state.db, app.state.redis = db, redis
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


@respx.mock
async def test_live_endpoint_and_upstream_failure(client):
    route = respx.get(url__regex=r".*/datasets/WINDFOR/stream.*").mock(
        return_value=httpx.Response(200, json=[])
    )
    r = await client.get("/api/v1/live/day-ahead")
    assert r.status_code == 200
    body = r.json()
    assert len(body["hours"]) in (23, 24, 25) and body["as_of"] is None
    assert route.called
    # Second call within ten minutes is served from the cache, not Elexon.
    calls = route.call_count
    await client.get("/api/v1/live/day-ahead")
    assert route.call_count == calls


@respx.mock
async def test_live_returns_502_when_elexon_is_down(client):
    respx.get(url__regex=r".*/datasets/WINDFOR/stream.*").mock(return_value=httpx.Response(503))
    r = await client.get("/api/v1/live/day-ahead")
    assert r.status_code == 502
