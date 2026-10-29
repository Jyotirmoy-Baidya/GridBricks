from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql://windmon:windmon@localhost:5433/windmon"
    redis_url: str = "redis://localhost:6379/0"
    elexon_base_url: str = "https://data.elexon.co.uk/bmrs/api/v1"
    day_ahead_cutoff: str = "09:00"
    max_horizon_h: int = 48
    ingest_horizon_h: int = 72  # keep forecasts beyond 48 h so a 48 h cut-off still has data
    cache_ttl_s: int = 3600
    cors_origins: str = "http://localhost:5173"
    admin_token: str = "change-me"
    rate_limit_per_min: int = 120

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
