"""Database code for the health check. Only repositories talk to the database."""

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession


async def database_is_reachable(session: AsyncSession) -> bool:
    try:
        await session.execute(text("SELECT 1"))
    except (SQLAlchemyError, OSError, TimeoutError):
        return False
    return True
