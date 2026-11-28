"""Shared test helpers: a throwaway Postgres, made-up sign-in tokens, and the app on top."""

import asyncio
import time
from collections.abc import Iterator
from pathlib import Path
from typing import Any

import jwt
import pytest
from alembic import command
from alembic.config import Config
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from testcontainers.community.postgres import PostgresContainer

from embr_api.core.auth import TokenVerifier, get_token_verifier
from embr_api.core.config import Settings
from embr_api.main import create_app

API_ROOT = Path(__file__).resolve().parents[1]

# A pretend Clerk app and website, used only by tests
TEST_ISSUER = "https://test-app.clerk.accounts.dev"
TEST_SITE = "http://localhost:3000"


@pytest.fixture(scope="session")
def database_url() -> Iterator[str]:
    """Start Postgres with pgvector, apply every migration, then throw it away."""
    # The same Postgres version as Neon online, so tests prove what really runs there
    with PostgresContainer("pgvector/pgvector:pg18", driver="asyncpg") as postgres:
        url = postgres.get_connection_url()

        alembic_config = Config(str(API_ROOT / "alembic.ini"))
        alembic_config.set_main_option("sqlalchemy.url", url)
        command.upgrade(alembic_config, "head")

        yield url


class FakeClerk:
    """Plays Clerk in tests: signs tokens with a made-up key, and hands out its public key."""

    def __init__(self) -> None:
        self.private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

    def get_signing_key_from_jwt(self, token: str) -> jwt.PyJWK:
        return jwt.PyJWK.from_dict(
            {**jwt.algorithms.RSAAlgorithm.to_jwk(self.private_key.public_key(), as_dict=True)},
            algorithm="RS256",
        )

    def token(self, **changes: Any) -> str:
        """A valid token for a made-up person. Pass changes to break or alter it."""
        now = int(time.time())
        claims: dict[str, Any] = {
            "sub": "user_test123",
            "iss": TEST_ISSUER,
            "azp": TEST_SITE,
            "iat": now,
            "exp": now + 60,
            "email": "alex@example.com",
            "name": "Alex Example",
            "phone": "",
            **changes,
        }
        claims = {key: value for key, value in claims.items() if value is not None}
        return jwt.encode(claims, self.private_key, algorithm="RS256")

    def verifier(self) -> TokenVerifier:
        """A token checker that trusts this fake Clerk instead of the real one."""
        return TokenVerifier(TEST_ISSUER, [TEST_SITE], keys=self)


@pytest.fixture(scope="session")
def fake_clerk() -> FakeClerk:
    return FakeClerk()


@pytest.fixture
def client(database_url: str, fake_clerk: FakeClerk) -> Iterator[TestClient]:
    """The real app on the test database, trusting the fake Clerk's tokens. Starts with no users."""
    asyncio.run(run_sql(database_url, "DELETE FROM users"))
    app = create_app(Settings(database_url=database_url, clerk_issuer=TEST_ISSUER))
    app.dependency_overrides[get_token_verifier] = fake_clerk.verifier
    with TestClient(app) as test_client:
        yield test_client


def signed_in(fake_clerk: FakeClerk, **changes: str) -> dict[str, str]:
    """Request headers that sign in as the fake Clerk's person (pass changes for someone else)."""
    return {"Authorization": f"Bearer {fake_clerk.token(**changes)}"}


async def run_sql(
    database_url: str, sql: str, params: dict[str, Any] | None = None
) -> list[tuple[Any, ...]]:
    """Runs SQL straight on the test database (to set up or check rows), and returns any rows.

    Values go in `params` and are written `:name` in the SQL, so the database fills
    them in safely instead of the values being pasted into the SQL text.
    """
    engine = create_async_engine(database_url)
    async with engine.begin() as connection:
        result = await connection.execute(text(sql), params or {})
        rows = [tuple(row) for row in result] if result.returns_rows else []
    await engine.dispose()
    return rows
