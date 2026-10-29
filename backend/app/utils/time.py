from datetime import date, datetime


def to_epoch(iso: str) -> int:
    """Parse an ISO-8601 UTC timestamp (e.g. 2026-01-09T22:30:00Z) to epoch seconds."""
    return int(datetime.fromisoformat(iso).timestamp())


def day_start(d: date) -> str:
    return f"{d.isoformat()}T00:00:00Z"
