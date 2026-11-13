"""HTTP layer for the health check: receives the request, calls the service."""

from typing import Annotated

from fastapi import APIRouter, Depends

from embr_api.core.config import Settings, get_settings
from embr_api.schemas.health import HealthResponse
from embr_api.services.health import get_health

router = APIRouter(tags=["health"])


@router.get("/health", summary="Check that the API is running")
def read_health(settings: Annotated[Settings, Depends(get_settings)]) -> HealthResponse:
    return get_health(settings)
