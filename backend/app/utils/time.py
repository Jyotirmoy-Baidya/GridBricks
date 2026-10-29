from datetime import UTC, date, datetime, time, timedelta
from zoneinfo import ZoneInfo

LONDON = ZoneInfo("Europe/London")
HOUR = 3600


def to_epoch(iso: str) -> int:
    """Parse an ISO-8601 UTC timestamp (e.g. 2026-01-09T22:30:00Z) to epoch seconds."""
    return int(datetime.fromisoformat(iso).timestamp())


def dt_to_epoch(dt: datetime) -> int:
    """Epoch seconds for an aware datetime; naive values are taken as UTC."""
    return int((dt if dt.tzinfo else dt.replace(tzinfo=UTC)).timestamp())


def from_epoch(epoch: int) -> datetime:
    return datetime.fromtimestamp(epoch, tz=UTC)


def day_start(d: date) -> str:
    return f"{d.isoformat()}T00:00:00Z"


def london_day_bounds(d: date) -> tuple[int, int]:
    """[start, end) epochs of a London calendar day (23 or 25 hours on DST changes)."""
    start = datetime.combine(d, time(0), tzinfo=LONDON)
    end = datetime.combine(d + timedelta(days=1), time(0), tzinfo=LONDON)
    return int(start.timestamp()), int(end.timestamp())


def london_cutoff_epoch(delivery: date, hhmm: str) -> int:
    """Epoch of HH:MM London time on the day before the delivery date."""
    hh, mm = (int(x) for x in hhmm.split(":"))
    return int(datetime.combine(delivery - timedelta(days=1), time(hh, mm), tzinfo=LONDON).timestamp())


def london_hour(epoch: int) -> int:
    return from_epoch(epoch).astimezone(LONDON).hour
