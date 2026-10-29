import math

from app.services.comparison_service import Row
from app.services.metrics_service import by_hour_of_day, distribution, summarize

H = 3600
T0 = 1_767_225_600  # 2026-01-01T00:00:00Z


def rows(pairs):
    """pairs of (forecast, actual) on consecutive hours; forecast None = gap."""
    return [Row(T0 + i * H, a, f, T0 + i * H - 4 * H if f is not None else None) for i, (f, a) in enumerate(pairs)]


def test_summary_matches_hand_calculation():
    s = summarize(rows([(110, 100), (180, 200), (300, 300), (None, 50)]))
    # errors: +10, -20, 0
    assert s.n == 3 and s.hours == 4 and s.coverage == 0.75
    assert s.mae == 10.0
    assert s.bias == -3.3
    assert s.rmse == round(math.sqrt((100 + 400 + 0) / 3), 1)
    assert s.nmae == round(10 / 200, 4)  # mean actual of matched = 200
    assert s.over_p90 == 10.0  # only positive error is +10


def test_summary_with_no_forecasts():
    s = summarize(rows([(None, 100), (None, 120)]))
    assert (s.n, s.hours, s.coverage, s.mae) == (0, 2, 0.0, None)


def test_by_hour_groups_on_london_hour():
    out = by_hour_of_day(rows([(110, 100), (90, 100), (130, 100)]))
    assert [(h.hour, h.n, h.mae, h.bias) for h in out] == [(0, 1, 10.0, 10.0), (1, 1, 10.0, -10.0), (2, 1, 30.0, 30.0)]


def test_distribution_lists_worst_first():
    d = distribution(rows([(110, 100), (400, 100), (50, 100)]), 4.0, bins=5)
    assert sum(d.counts) == 3
    assert [w.error for w in d.worst] == [300, -50, 10]
