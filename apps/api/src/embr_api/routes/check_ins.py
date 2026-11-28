"""HTTP layer for the signed-in person's check-ins: receives the request, calls the service.

There's no user ID in any address: the sign-in token decides whose check-ins
these are, so nobody can reach someone else's by changing the address.
"""

from typing import Annotated, Any

from fastapi import APIRouter, Depends, Path
from sqlalchemy.ext.asyncio import AsyncSession

from embr_api.core.auth import SignedInPerson, get_signed_in_person
from embr_api.core.database import get_session
from embr_api.schemas.check_in import CheckInAnswers, CheckInDay, CheckInResponse
from embr_api.services import check_ins

router = APIRouter(prefix="/check-ins", tags=["check-ins"])

SignedIn = Annotated[SignedInPerson, Depends(get_signed_in_person)]
Session = Annotated[AsyncSession, Depends(get_session)]

_ERRORS: dict[int | str, dict[str, Any]] = {
    401: {"description": "Not signed in, or the sign-in token isn't valid"},
}


@router.put(
    "/{date}",
    summary="Save the signed-in person's check-in for one day, replacing any earlier one",
    responses=_ERRORS,
)
async def save_day(
    date: Annotated[CheckInDay, Path(description="The person's own day, as YYYY-MM-DD")],
    answers: CheckInAnswers,
    person: SignedIn,
    session: Session,
) -> CheckInResponse:
    return await check_ins.save_check_in(session, person, date, answers)
