ACTUAL_INDEX = "wind:actual"  # zset: member=target epoch, score=target epoch
ACTUAL_VALUES = "wind:actual:mw"  # hash: target epoch -> mw (actuals can be revised)
FC_TARGETS = "wind:fc:targets"  # zset: member=score=target epoch
DATA_VERSION = "data:version"
COVERAGE = "meta:coverage"
INGEST_LOCK = "lock:ingest"


def forecast_key(target_epoch: int) -> str:
    """zset: score=publish epoch, member='<publish epoch>:<mw>'."""
    return f"wind:fc:{target_epoch}"


def raw_key(dataset: str, start: str, end: str) -> str:
    return f"elx:raw:{dataset}:{start}:{end}"
