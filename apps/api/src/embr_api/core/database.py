"""Database connection: one engine per app, one session per request."""

from collections.abc import AsyncIterator
from typing import Any
from uuid import uuid4

from fastapi import Request
from sqlalchemy import make_url
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import Pool


def asyncpg_url(url: str) -> str:
    """The database address, in the form our driver (asyncpg) understands.

    Hosts such as Neon hand out the standard Postgres form,
    `postgresql://...?sslmode=require&channel_binding=require`. asyncpg needs
    `postgresql+asyncpg://...?ssl=require` instead. Addresses already in
    asyncpg form (like the local Docker one) come back unchanged.
    """
    parsed = make_url(url)
    if parsed.drivername not in ("postgresql", "postgres"):
        return url

    options = dict(parsed.query)
    sslmode = options.pop("sslmode", None)
    options.pop("channel_binding", None)  # asyncpg handles this itself
    if sslmode and "ssl" not in options:
        options["ssl"] = sslmode
    return parsed.set(drivername="postgresql+asyncpg", query=options).render_as_string(
        hide_password=False
    )


def uses_connection_pooler(url: str) -> bool:
    """Neon's "pooled" addresses share connections through PgBouncer ("-pooler" in the host)."""
    return "-pooler" in (make_url(url).host or "")


def connect_args_for(url: str) -> dict[str, Any]:
    connect_args: dict[str, Any] = {"timeout": 10}  # seconds; Neon may need a moment to wake up
    if uses_connection_pooler(url):
        # PgBouncer can hand each query to a different connection, so asyncpg
        # must not reuse saved ("prepared") statements, and must name each one uniquely
        connect_args["statement_cache_size"] = 0
        connect_args["prepared_statement_name_func"] = lambda: f"__asyncpg_{uuid4()}__"
    return connect_args


def create_engine(database_url: str, poolclass: type[Pool] | None = None) -> AsyncEngine:
    """The engine keeps a pool of open connections to Postgres."""
    url = asyncpg_url(database_url)
    options: dict[str, Any] = {"pool_pre_ping": True, "connect_args": connect_args_for(url)}
    if poolclass is not None:
        options["poolclass"] = poolclass
    return create_async_engine(url, **options)


def create_session_factory(engine: AsyncEngine) -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(engine, expire_on_commit=False)


async def get_session(request: Request) -> AsyncIterator[AsyncSession]:
    """FastAPI dependency: hands a route its own session, closed afterwards."""
    session_factory: async_sessionmaker[AsyncSession] = request.app.state.session_factory
    async with session_factory() as session:
        yield session
