"""Integration tests against a real, throwaway Postgres started in Docker."""

import asyncio

from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from embr_api.core.config import Settings
from embr_api.main import create_app


def test_health_reports_the_database_as_connected(database_url: str) -> None:
    settings = Settings(database_url=database_url)

    with TestClient(create_app(settings)) as client:
        body = client.get("/v1/health").json()

    assert body["status"] == "ok"
    assert body["database"] == "connected"


def test_migrations_enable_pgvector(database_url: str) -> None:
    async def installed_extensions() -> list[str]:
        engine = create_async_engine(database_url)
        async with engine.connect() as connection:
            result = await connection.execute(text("SELECT extname FROM pg_extension"))
            names = [row[0] for row in result]
        await engine.dispose()
        return names

    assert "vector" in asyncio.run(installed_extensions())


def test_migrations_create_users_with_a_unique_clerk_id(database_url: str) -> None:
    async def users_table() -> tuple[list[str], list[str]]:
        engine = create_async_engine(database_url)
        async with engine.connect() as connection:
            columns = await connection.execute(
                text(
                    "SELECT column_name FROM information_schema.columns"
                    " WHERE table_name = 'users' ORDER BY ordinal_position"
                )
            )
            unique = await connection.execute(
                text(
                    "SELECT constraint_name FROM information_schema.table_constraints"
                    " WHERE table_name = 'users' AND constraint_type = 'UNIQUE'"
                )
            )
            result = ([row[0] for row in columns], [row[0] for row in unique])
        await engine.dispose()
        return result

    columns, unique = asyncio.run(users_table())

    assert columns == ["id", "clerk_id", "email", "name", "phone", "created_at", "last_seen_at"]
    assert unique == ["users_clerk_id_key"]
