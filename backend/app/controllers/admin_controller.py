import secrets

from redis.asyncio import Redis

from app.core.config import Settings
from app.core.exceptions import ApiError
from app.schemas.admin import IngestRequest, IngestResponse
from app.services.elexon_client import ElexonClient, ElexonError
from app.services.ingestion_service import IngestInProgressError, ingest


async def run_ingest(
    redis: Redis, settings: Settings, token: str | None, body: IngestRequest
) -> IngestResponse:
    if not token or not secrets.compare_digest(token, settings.admin_token):
        raise ApiError(401, "invalid admin token")
    client = ElexonClient(settings.elexon_base_url)
    try:
        coverage = await ingest(redis, client, body.start, body.end, settings.ingest_horizon_h)
    except IngestInProgressError as exc:
        raise ApiError(409, str(exc)) from exc
    except ElexonError as exc:
        raise ApiError(502, str(exc)) from exc
    finally:
        await client.aclose()
    return IngestResponse(coverage=coverage)
