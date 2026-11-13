"""HTTP layer for the health check: receives the request, calls the service."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from embr_api.core.config import Settings, get_settings
from embr_api.core.database import get_session
from embr_api.schemas.health import HealthResponse
from embr_api.services.health import get_health

router = APIRouter(tags=["health"])


@router.get("/health", summary="Check that the API and its database are running")
async def read_health(
    settings: Annotated[Settings, Depends(get_settings)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> HealthResponse:
    return await get_health(settings, session)
