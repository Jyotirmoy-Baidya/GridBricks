from datetime import date

import httpx
import pytest
import respx

from app.repositories import actuals_repo, forecasts_repo, keys, meta_repo
from app.services.elexon_client import ElexonClient, ElexonError
from app.services.ingestion_service import IngestInProgressError, ingest
from app.services.seed_service import load_seed_if_empty, write_seed
from app.utils.time import to_epoch

BASE = "https://elexon.test"
ACTUALS = [
    {"fuelType": "WIND", "startTime": "2026-01-02T00:00:00Z", "generation": 500},
    {"fuelType": "WIND", "startTime": "2026-01-02T00:30:00Z", "generation": 520},
]
FORECASTS = [
    {"startTime": "2026-01-02T00:00:00Z", "publishTime": "2026-01-01T09:30:00Z", "generation": 480},
    {"startTime": "2026-01-01T08:00:00Z", "publishTime": "2026-01-01T09:30:00Z", "generation": 1},
]


def mock_elexon(router: respx.MockRouter) -> None:
    router.get("/datasets/FUELHH/stream").respond(json=ACTUALS)
    router.get("/datasets/WINDFOR/stream").respond(json=FORECASTS)


@pytest.fixture
def client():
    return ElexonClient(BASE, backoff_s=0, http=httpx.AsyncClient(base_url=BASE))


@respx.mock(base_url=BASE)
async def test_ingest_stores_data_and_second_run_uses_raw_cache(respx_mock, redis, client):
    mock_elexon(respx_mock)
    start, end = date(2026, 1, 1), date(2026, 1, 3)

    coverage = await ingest(redis, client, start, end)
    assert coverage["actual_rows"] == "2" and coverage["forecast_rows"] == "1"
    assert await meta_repo.get_version(redis) == 1
    t = to_epoch("2026-01-02T00:00:00Z")
    assert await actuals_repo.get_range(redis, t, t) == [(t, 500)]
    assert (await forecasts_repo.latest_before_cutoff(redis, [t], 4))[t][1] == 480

    calls = respx_mock.calls.call_count
    await ingest(redis, client, start, end)
    assert respx_mock.calls.call_count == calls  # served from the raw cache
    assert await meta_repo.get_version(redis) == 2


@respx.mock(base_url=BASE, assert_all_called=False)
async def test_concurrent_ingest_is_rejected(respx_mock, redis, client):
    mock_elexon(respx_mock)
    await redis.set(keys.INGEST_LOCK, "1")
    with pytest.raises(IngestInProgressError):
        await ingest(redis, client, date(2026, 1, 1), date(2026, 1, 3))


@respx.mock(base_url=BASE)
async def test_client_retries_then_succeeds(respx_mock, client):
    route = respx_mock.get("/datasets/FUELHH/stream").mock(
        side_effect=[httpx.Response(503), httpx.Response(200, json=ACTUALS)]
    )
    assert await client.fetch_actuals(date(2026, 1, 1), date(2026, 1, 2)) == ACTUALS
    assert route.call_count == 2


@respx.mock(base_url=BASE)
async def test_client_gives_up_after_retries(respx_mock, client):
    respx_mock.get("/datasets/FUELHH/stream").respond(503)
    with pytest.raises(ElexonError):
        await client.fetch_actuals(date(2026, 1, 1), date(2026, 1, 2))


async def test_seed_loads_only_into_empty_redis(redis, tmp_path):
    path = tmp_path / "seed.json.gz"
    write_seed(path, [(1000, 5)], [(2000, 1000, 7)])
    assert await load_seed_if_empty(redis, path) is True
    assert await actuals_repo.get_range(redis, 0, 5000) == [(1000, 5)]
    assert await load_seed_if_empty(redis, path) is False  # already populated
