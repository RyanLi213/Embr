"""Creates the FastAPI app and attaches the versioned routes."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from embr_api.core.config import Settings, get_settings
from embr_api.core.database import create_engine, create_session_factory
from embr_api.routes import health


def create_app(settings: Settings | None = None) -> FastAPI:
    """Build the app. Tests pass their own settings; normally they come from the environment."""
    app_settings = settings or get_settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        # Runs once at startup: open the database connection pool
        engine = create_engine(app_settings.database_url)
        app.state.session_factory = create_session_factory(engine)
        yield
        # Runs once at shutdown: close it cleanly
        await engine.dispose()

    app = FastAPI(title=app_settings.app_name, version=app_settings.version, lifespan=lifespan)
    app.dependency_overrides[get_settings] = lambda: app_settings

    app.add_middleware(
        CORSMiddleware,
        allow_origins=app_settings.cors_origins,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    v1 = APIRouter(prefix="/v1")
    v1.include_router(health.router)
    app.include_router(v1)

    return app


app = create_app()
