"""Business logic for users. Routes call this; it knows nothing about HTTP."""

from sqlalchemy.ext.asyncio import AsyncSession

from embr_api.core.auth import SignedInPerson
from embr_api.repositories.users import save_signed_in_user
from embr_api.schemas.user import UserResponse


async def sign_in(session: AsyncSession, person: SignedInPerson) -> UserResponse:
    """Saves the signed-in person (or brings their details up to date) and returns them."""
    user = await save_signed_in_user(
        session,
        clerk_id=person.clerk_id,
        email=person.email,
        name=person.name,
        phone=person.phone,
    )
    await session.commit()
    return UserResponse.model_validate(user)
