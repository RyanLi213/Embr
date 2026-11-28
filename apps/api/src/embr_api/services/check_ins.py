"""Business logic for check-ins. Routes call this; it knows nothing about HTTP."""

import datetime as dt
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from embr_api.core.auth import SignedInPerson
from embr_api.models.check_in import ANSWERS, CheckIn
from embr_api.repositories import check_ins
from embr_api.repositories.users import find_user_id, save_signed_in_user
from embr_api.schemas.check_in import (
    CheckInAnswers,
    CheckInImport,
    CheckInImportResult,
    CheckInRange,
    CheckInResponse,
    CheckInToImport,
)

# What has to match for two copies of a day to count as the same
_COMPARED = ("questions_version", *ANSWERS, "flare", "note")


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


async def load_check_ins(
    session: AsyncSession, person: SignedInPerson, days: CheckInRange
) -> list[CheckInResponse]:
    """The person's check-ins in the range, oldest first. Only reads: someone never
    saved simply has none."""
    user_id = await find_user_id(session, clerk_id=person.clerk_id)
    if user_id is None:
        return []
    found = await check_ins.check_ins_between(
        session, user_id=user_id, start=days.start, end=days.end
    )
    return [CheckInResponse.model_validate(check_in) for check_in in found]


async def import_check_ins(
    session: AsyncSession, person: SignedInPerson, browser: CheckInImport
) -> CheckInImportResult:
    """Moves check-ins a browser saved before signing in into the person's account.

    Days the account doesn't have are added. Days it already has keep the
    account's version; the ones that differ come back as conflicts, so the person
    can choose. Choosing the browser's version is then a normal save.
    """
    user_id = await _user_id_of(session, person)
    sent = {check_in.date: check_in for check_in in browser.check_ins}
    imported = await check_ins.add_missing_days(
        session, user_id=user_id, check_ins=[check_in.model_dump() for check_in in sent.values()]
    )
    in_both = await check_ins.check_ins_on(
        session, user_id=user_id, days=[day for day in sent if day not in imported]
    )
    conflicts = [saved for saved in in_both if _differs(saved, sent[saved.date])]
    await session.commit()
    return CheckInImportResult(
        imported=sorted(imported),
        conflicts=[CheckInResponse.model_validate(saved) for saved in conflicts],
    )


def _differs(saved: CheckIn, sent: CheckInToImport) -> bool:
    return any(getattr(saved, field) != getattr(sent, field) for field in _COMPARED)
