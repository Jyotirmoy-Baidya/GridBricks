from typing import Annotated

from fastapi import APIRouter, Header

from app.api.deps import RedisDep, SettingsDep
from app.controllers import admin_controller as ctl
from app.schemas.admin import IngestRequest, IngestResponse

router = APIRouter(prefix="/admin")


@router.post("/ingest", response_model=IngestResponse)
async def ingest(
    body: IngestRequest,
    redis: RedisDep,
    settings: SettingsDep,
    x_admin_token: Annotated[str | None, Header()] = None,
) -> IngestResponse:
    return await ctl.run_ingest(redis, settings, x_admin_token, body)
