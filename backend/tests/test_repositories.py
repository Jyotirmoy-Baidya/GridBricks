from app.repositories import actuals_repo, forecasts_repo, meta_repo

H = 3600
T = 100 * H  # target time


async def test_actuals_range_and_revision(redis):
    await actuals_repo.upsert(redis, [(T, 10), (T + 1800, 20), (T + 3600, 30)])
    await actuals_repo.upsert(redis, [(T, 15)])  # revision overwrites, no duplicate
    assert await actuals_repo.get_range(redis, T, T + 1800) == [(T, 15), (T + 1800, 20)]


async def test_latest_before_cutoff_picks_newest_allowed_publish(redis):
    await forecasts_repo.upsert(
        redis, [(T, T - 30 * H, 1), (T, T - 10 * H, 2), (T, T - 3 * H, 3), (T, T - 1 * H, 4)]
    )
    pick = lambda h: forecasts_repo.latest_before_cutoff(redis, [T], h)
    assert (await pick(4))[T] == (T - 10 * H, 2)  # newest with publish <= T-4h
    assert (await pick(3))[T] == (T - 3 * H, 3)  # publish exactly at the cut-off counts
    assert (await pick(0))[T] == (T - 1 * H, 4)
    assert (await pick(40)) == {}  # nothing early enough: a gap, never back-filled


async def test_targets_index_and_version(redis):
    await forecasts_repo.upsert(redis, [(T, T - H, 1), (T + H, T - H, 2)])
    assert await forecasts_repo.get_targets(redis, T, T + H) == [T, T + H]
    assert await meta_repo.bump_version(redis) == 1
    assert await meta_repo.get_version(redis) == 1
