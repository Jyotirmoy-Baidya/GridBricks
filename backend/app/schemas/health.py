from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str  # ok when both stores answer; degraded when Redis (cache) is down; down without Postgres
    database: bool
    redis: bool
