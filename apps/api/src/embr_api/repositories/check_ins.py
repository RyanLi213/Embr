"""Database code for check-ins. Only repositories talk to the database, and every
query here is limited to one person's own check-ins (`user_id`)."""

import datetime as dt
import uuid
from collections.abc import Collection, Sequence
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from embr_api.models.check_in import CheckIn

# The "one check-in per person per day" rule in the database (migration 0003)
_ONE_PER_DAY = "check_ins_user_id_date_key"


async def save_check_in(
    session: AsyncSession, *, user_id: uuid.UUID, date: dt.date, answers: dict[str, Any]
) -> CheckIn:
    """Adds the person's check-in for that day, or replaces the one already there.

    It's one statement ("insert, or update if this person already has this day"),
    so two saves at the same moment can never make two check-ins for one day.
    """
    statement = (
        insert(CheckIn)
        .values(user_id=user_id, date=date, **answers)
        .on_conflict_do_update(
            constraint=_ONE_PER_DAY,
            set_={**answers, "updated_at": func.now()},
        )
        .returning(CheckIn)
    )
    # populate_existing: if this check-in is already loaded, refresh it with the new values
    result = await session.scalars(statement, execution_options={"populate_existing": True})
    return result.one()


async def check_ins_between(
    session: AsyncSession, *, user_id: uuid.UUID, start: dt.date, end: dt.date
) -> Sequence[CheckIn]:
    """The person's check-ins from `start` to `end` (both included), oldest first.

    The one-per-day rule's index covers (user_id, date), so this stays fast as
    the table grows.
    """
    statement = (
        select(CheckIn)
        .where(CheckIn.user_id == user_id, CheckIn.date.between(start, end))
        .order_by(CheckIn.date)
    )
    return (await session.scalars(statement)).all()


async def add_missing_days(
    session: AsyncSession, *, user_id: uuid.UUID, check_ins: list[dict[str, Any]]
) -> set[dt.date]:
    """Adds each check-in whose day the person doesn't have yet, and leaves the days
    already there alone. Returns the days added.

    It's one statement ("insert, but skip any day already there"), so running it
    twice adds nothing the second time.
    """
    if not check_ins:
        return set()
    statement = (
        insert(CheckIn)
        .values([{**check_in, "user_id": user_id} for check_in in check_ins])
        .on_conflict_do_nothing(constraint=_ONE_PER_DAY)
        .returning(CheckIn.date)
    )
    return set(await session.scalars(statement))


async def check_ins_on(
    session: AsyncSession, *, user_id: uuid.UUID, days: Collection[dt.date]
) -> Sequence[CheckIn]:
    """The person's check-ins on these days, oldest first."""
    if not days:
        return []
    statement = (
        select(CheckIn)
        .where(CheckIn.user_id == user_id, CheckIn.date.in_(days))
        .order_by(CheckIn.date)
    )
    return (await session.scalars(statement)).all()
