"""Redis keys. Redis holds only disposable state: cache, raw-response cache, lock, rate limits."""

DATA_VERSION = "data:version"  # bumped on every load; embedded in cache keys
INGEST_LOCK = "lock:ingest"


def raw_key(dataset: str, start: str, end: str) -> str:
    return f"elx:raw:{dataset}:{start}:{end}"
