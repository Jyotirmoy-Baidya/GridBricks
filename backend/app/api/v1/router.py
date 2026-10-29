from fastapi import APIRouter

from app.api.v1.routes import admin, day_ahead, generation, health, live, metrics

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health.router, tags=["health"])
api_router.include_router(generation.router, tags=["generation"])
api_router.include_router(metrics.router, tags=["metrics"])
api_router.include_router(day_ahead.router, tags=["day-ahead"])
api_router.include_router(live.router, tags=["live"])
api_router.include_router(admin.router, tags=["admin"])
