"""Database code for users. Only repositories talk to the database."""

from sqlalchemy import func
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from embr_api.models.user import User


async def save_signed_in_user(
    session: AsyncSession,
    *,
    clerk_id: str,
    email: str | None,
    name: str | None,
    phone: str | None,
) -> User:
    """Adds the person the first time; after that, updates their details and last visit.

    It's one statement ("insert, or update if this Clerk ID is already there"),
    so two requests at the same moment can never save the same person twice.
    """
    details = {"email": email, "name": name, "phone": phone}
    statement = (
        insert(User)
        .values(clerk_id=clerk_id, **details)
        .on_conflict_do_update(
            index_elements=[User.clerk_id],
            set_={**details, "last_seen_at": func.now()},
        )
        .returning(User)
    )
    # populate_existing: if this person is already loaded, refresh them with the new values
    result = await session.scalars(statement, execution_options={"populate_existing": True})
    return result.one()
