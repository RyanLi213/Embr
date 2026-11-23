"""GET /v1/me against a real, throwaway Postgres: people are saved once and kept up to date."""

import asyncio
from collections.abc import Iterator
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from embr_api.core.auth import get_token_verifier
from embr_api.core.config import Settings
from embr_api.main import create_app
from tests.conftest import TEST_ISSUER, FakeClerk


@pytest.fixture
def client(database_url: str, fake_clerk: FakeClerk) -> Iterator[TestClient]:
    """The real app on the test database, trusting the fake Clerk's tokens. Starts with no users."""
    asyncio.run(_run(database_url, "DELETE FROM users"))
    app = create_app(Settings(database_url=database_url, clerk_issuer=TEST_ISSUER))
    app.dependency_overrides[get_token_verifier] = fake_clerk.verifier
    with TestClient(app) as test_client:
        yield test_client


def _signed_in(fake_clerk: FakeClerk, **changes: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {fake_clerk.token(**changes)}"}


async def _run(database_url: str, sql: str) -> list[tuple[Any, ...]]:
    engine = create_async_engine(database_url)
    async with engine.begin() as connection:
        result = await connection.execute(text(sql))
        rows = [tuple(row) for row in result] if result.returns_rows else []
    await engine.dispose()
    return rows


def _count_users(database_url: str) -> int:
    count: int = asyncio.run(_run(database_url, "SELECT count(*) FROM users"))[0][0]
    return count


def test_the_first_visit_saves_the_person(
    client: TestClient, fake_clerk: FakeClerk, database_url: str
) -> None:
    response = client.get("/v1/me", headers=_signed_in(fake_clerk))

    assert response.status_code == 200
    body = response.json()
    assert body["email"] == "alex@example.com"
    assert body["name"] == "Alex Example"
    assert body["phone"] is None
    assert _count_users(database_url) == 1


def test_later_visits_update_the_same_person_without_a_duplicate(
    client: TestClient, fake_clerk: FakeClerk, database_url: str
) -> None:
    first = client.get("/v1/me", headers=_signed_in(fake_clerk)).json()
    later = client.get(
        "/v1/me", headers=_signed_in(fake_clerk, email="alex.new@example.com", phone="+15550100")
    ).json()

    assert later["id"] == first["id"]
    assert later["created_at"] == first["created_at"]
    assert later["last_seen_at"] > first["last_seen_at"]
    # Clerk is the source of truth: changed details are copied over
    assert later["email"] == "alex.new@example.com"
    assert later["phone"] == "+15550100"
    assert _count_users(database_url) == 1


def test_two_people_get_two_rows(
    client: TestClient, fake_clerk: FakeClerk, database_url: str
) -> None:
    client.get("/v1/me", headers=_signed_in(fake_clerk))
    client.get(
        "/v1/me", headers=_signed_in(fake_clerk, sub="user_other456", email="sam@example.com")
    )

    assert _count_users(database_url) == 2


def test_nothing_is_saved_without_a_valid_token(
    client: TestClient, fake_clerk: FakeClerk, database_url: str
) -> None:
    forger = FakeClerk()

    response = client.get("/v1/me", headers={"Authorization": f"Bearer {forger.token()}"})

    assert response.status_code == 401
    assert _count_users(database_url) == 0
