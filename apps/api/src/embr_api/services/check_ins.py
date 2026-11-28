"""Business logic for check-ins. Routes call this; it knows nothing about HTTP."""

import datetime as dt
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from embr_api.core.auth import SignedInPerson
from embr_api.repositories import check_ins
from embr_api.repositories.users import save_signed_in_user
from embr_api.schemas.check_in import CheckInAnswers, CheckInResponse


async def _user_id_of(session: AsyncSession, person: SignedInPerson) -> uuid.UUID:
    """Our own ID for the signed-in person, saving them first if /v1/me hasn't yet.

    The website calls /v1/me in the background, so a quick first check-in can
    arrive before it. Saving here too means that race never loses a check-in.
    """
    user = await save_signed_in_user(
        session,
        clerk_id=person.clerk_id,
        email=person.email,
        name=person.name,
        phone=person.phone,
    )
    return user.id


async def save_check_in(
    session: AsyncSession, person: SignedInPerson, date: dt.date, answers: CheckInAnswers
) -> CheckInResponse:
    """Saves the person's check-in for that day, replacing any earlier one."""
    user_id = await _user_id_of(session, person)
    check_in = await check_ins.save_check_in(
        session, user_id=user_id, date=date, answers=answers.model_dump()
    )
    await session.commit()
    return CheckInResponse.model_validate(check_in)
