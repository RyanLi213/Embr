"""Business logic for the health check. Routes call this; it knows nothing about HTTP."""

from sqlalchemy.ext.asyncio import AsyncSession

from embr_api.core.config import Settings
from embr_api.repositories.health import database_is_reachable
from embr_api.schemas.health import HealthResponse


async def get_health(settings: Settings, session: AsyncSession) -> HealthResponse:
    database_up = await database_is_reachable(session)
    return HealthResponse(
        status="ok" if database_up else "degraded",
        database="connected" if database_up else "unavailable",
        environment=settings.environment,
        version=settings.version,
    )
