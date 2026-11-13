"""Creates the FastAPI app and attaches the versioned routes."""

from fastapi import APIRouter, FastAPI

from embr_api.core.config import get_settings
from embr_api.routes import health


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name, version=settings.version)

    v1 = APIRouter(prefix="/v1")
    v1.include_router(health.router)
    app.include_router(v1)

    return app


app = create_app()
