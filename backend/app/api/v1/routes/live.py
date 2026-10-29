from fastapi import APIRouter

from app.api.deps import DbDep, RedisDep, SettingsDep
from app.controllers import live_controller as ctl
from app.schemas.live import LiveResponse

router = APIRouter(prefix="/live")


@router.get("/day-ahead", response_model=LiveResponse)
async def live_day_ahead(db: DbDep, redis: RedisDep, settings: SettingsDep) -> LiveResponse:
    """Tomorrow's wind from the newest Elexon forecast. Not stored; outside the January dataset."""
    return await ctl.live(db, redis, settings)
