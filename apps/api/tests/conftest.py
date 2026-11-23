"""Shared test helpers: a throwaway Postgres, and made-up sign-in tokens."""

import time
from collections.abc import Iterator
from pathlib import Path
from typing import Any

import jwt
import pytest
from alembic import command
from alembic.config import Config
from cryptography.hazmat.primitives.asymmetric import rsa
from testcontainers.community.postgres import PostgresContainer

from embr_api.core.auth import TokenVerifier

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
