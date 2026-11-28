"""GET /v1/me against a real, throwaway Postgres: people are saved once and kept up to date."""

import asyncio

from fastapi.testclient import TestClient

from tests.conftest import FakeClerk, run_sql, signed_in


def _count_users(database_url: str) -> int:
    count: int = asyncio.run(run_sql(database_url, "SELECT count(*) FROM users"))[0][0]
    return count


def test_the_first_visit_saves_the_person(
    client: TestClient, fake_clerk: FakeClerk, database_url: str
) -> None:
    response = client.get("/v1/me", headers=signed_in(fake_clerk))

    assert response.status_code == 200
    body = response.json()
    assert body["email"] == "alex@example.com"
    assert body["name"] == "Alex Example"
    assert body["phone"] is None
    assert _count_users(database_url) == 1


def test_later_visits_update_the_same_person_without_a_duplicate(
    client: TestClient, fake_clerk: FakeClerk, database_url: str
) -> None:
    first = client.get("/v1/me", headers=signed_in(fake_clerk)).json()
    later = client.get(
        "/v1/me", headers=signed_in(fake_clerk, email="alex.new@example.com", phone="+15550100")
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
    client.get("/v1/me", headers=signed_in(fake_clerk))
    client.get(
        "/v1/me", headers=signed_in(fake_clerk, sub="user_other456", email="sam@example.com")
    )

    assert _count_users(database_url) == 2


def test_nothing_is_saved_without_a_valid_token(
    client: TestClient, fake_clerk: FakeClerk, database_url: str
) -> None:
    forger = FakeClerk()

    response = client.get("/v1/me", headers={"Authorization": f"Bearer {forger.token()}"})

    assert response.status_code == 401
    assert _count_users(database_url) == 0
