"""HTTP layer for the signed-in person ("me"): receives the request, calls the service."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from embr_api.core.auth import SignedInPerson, get_signed_in_person
from embr_api.core.database import get_session
from embr_api.schemas.user import UserResponse
from embr_api.services.users import sign_in

router = APIRouter(tags=["me"])


@router.get(
    "/me",
    summary="The signed-in person: saved on their first visit, kept up to date after",
    responses={401: {"description": "Not signed in, or the sign-in token isn't valid"}},
)
async def read_me(
    person: Annotated[SignedInPerson, Depends(get_signed_in_person)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> UserResponse:
    return await sign_in(session, person)
