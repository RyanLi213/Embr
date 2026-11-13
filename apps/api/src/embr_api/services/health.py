"""Business logic for the health check. Routes call this; it knows nothing about HTTP."""

from embr_api.core.config import Settings
from embr_api.schemas.health import HealthResponse


def get_health(settings: Settings) -> HealthResponse:
    return HealthResponse(
        status="ok",
        environment=settings.environment,
        version=settings.version,
    )
