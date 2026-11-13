"""Integration tests against a real, throwaway Postgres started in Docker."""

import asyncio
from collections.abc import Iterator
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from testcontainers.community.postgres import PostgresContainer

from embr_api.core.config import Settings
from embr_api.main import create_app

API_ROOT = Path(__file__).resolve().parents[1]


@pytest.fixture(scope="module")
def database_url() -> Iterator[str]:
    """Start Postgres with pgvector, apply every migration, then throw it away."""
    with PostgresContainer("pgvector/pgvector:pg17", driver="asyncpg") as postgres:
        url = postgres.get_connection_url()

        alembic_config = Config(str(API_ROOT / "alembic.ini"))
        alembic_config.set_main_option("sqlalchemy.url", url)
        command.upgrade(alembic_config, "head")

        yield url


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
