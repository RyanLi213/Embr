"""Database code for check-ins. Only repositories talk to the database, and every
query here is limited to one person's own check-ins (`user_id`)."""

import datetime as dt
import uuid
from typing import Any

from sqlalchemy import func
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
