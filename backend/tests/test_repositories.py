from app.repositories import actuals_repo, comparison_repo, forecasts_repo, meta_repo

H = 3600
T = 100 * H  # target time, on the hour


async def test_actuals_range_is_half_open_and_revisions_overwrite(db):
    await actuals_repo.upsert(db, [(T, 10), (T + 1800, 20), (T + 3600, 30)])
    await actuals_repo.upsert(db, [(T, 15)])  # revision overwrites, no duplicate
    assert await actuals_repo.get_range(db, T, T + 3600) == [(T, 15), (T + 1800, 20)]


async def test_latest_before_cutoff_picks_newest_allowed_publish(db):
    await forecasts_repo.upsert(
        db, [(T, T - 30 * H, 1), (T, T - 10 * H, 2), (T, T - 3 * H, 3), (T, T - 1 * H, 4)]
    )

    async def pick(h):
        return await forecasts_repo.latest_by_horizon(db, T, T + H, h)

    assert (await pick(4))[T] == (T - 10 * H, 2)  # newest with publish <= T-4h
    assert (await pick(3))[T] == (T - 3 * H, 3)  # publish exactly at the cut-off counts
    assert (await pick(0))[T] == (T - 1 * H, 4)
    assert await pick(40) == {}  # nothing early enough: a gap, never back-filled


async def test_latest_at_fixed_cutoff(db):
    await forecasts_repo.upsert(db, [(T, T - 10 * H, 2), (T, T - 3 * H, 3), (T + H, T - 3 * H, 9)])
    got = await forecasts_repo.latest_at_cutoff(db, T, T + 2 * H, T - 5 * H)
    assert got == {T: (T - 10 * H, 2)}  # T+1h has no forecast before the cut-off


async def test_upsert_is_idempotent(db):
    rows = [(T, T - H, 5)]
    await forecasts_repo.upsert(db, rows)
    await forecasts_repo.upsert(db, [(T, T - H, 6)])  # restated value replaces, not duplicates
    assert await forecasts_repo.latest_by_horizon(db, T, T + H, 0) == {T: (T - H, 6)}


async def test_compare_joins_actuals_to_forecasts_on_the_hour_only(db):
    await actuals_repo.upsert(db, [(T, 100), (T + 1800, 110), (T + H, 120)])
    await forecasts_repo.upsert(db, [(T, T - 6 * H, 90)])
    rows = await comparison_repo.compare(db, T, T + 2 * H, 4)
    assert [(r.t, r.actual, r.forecast, r.publish) for r in rows] == [
        (T, 100, 90, T - 6 * H),  # half-hourly actual at T+30m is skipped
        (T + H, 120, None, None),  # no forecast for T+1h: a gap
    ]


async def test_coverage_is_computed_from_the_data(db):
    assert await meta_repo.get_coverage(db) == {}
    await actuals_repo.upsert(db, [(T, 1), (T + H, 2)])
    await forecasts_repo.upsert(db, [(T, T - H, 1)])
    await meta_repo.mark_ingested(db)
    c = await meta_repo.get_coverage(db)
    assert (c["actual_rows"], c["forecast_rows"], c["actual_min"], c["actual_max"]) == ("2", "1", str(T), str(T + H))
    assert c["ingested_at"].endswith("Z")
