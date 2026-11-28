"""The check-in routes against a real, throwaway Postgres: each person's check-ins
are saved, loaded and imported, and nobody ever sees anyone else's."""

import asyncio
from typing import Any

from fastapi.testclient import TestClient

from tests.conftest import FakeClerk, run_sql, signed_in

GOOD_ANSWERS: dict[str, Any] = {
    "questions_version": 1,
    "pain": 3,
    "stiffness": 2,
    "energy": 4,
    "mood": 4,
    "overall": 3,
    "flare": False,
    "note": "walked the dog",
}

# A second person, for the privacy tests
SAM = {"sub": "user_sam456", "email": "sam@example.com", "name": "Sam Example"}


def _count_check_ins(database_url: str) -> int:
    count: int = asyncio.run(run_sql(database_url, "SELECT count(*) FROM check_ins"))[0][0]
    return count


def _count_users(database_url: str) -> int:
    count: int = asyncio.run(run_sql(database_url, "SELECT count(*) FROM users"))[0][0]
    return count


# --- Saving a day: PUT /v1/check-ins/{date} ---


def test_saving_a_day_saves_it_and_sends_it_back(
    client: TestClient, fake_clerk: FakeClerk, database_url: str
) -> None:
    response = client.put(
        "/v1/check-ins/2026-11-28", json=GOOD_ANSWERS, headers=signed_in(fake_clerk)
    )

    assert response.status_code == 200
    body = response.json()
    assert body["date"] == "2026-11-28"
    assert {key: body[key] for key in GOOD_ANSWERS} == GOOD_ANSWERS
    assert _count_check_ins(database_url) == 1


def test_saving_the_same_day_again_replaces_it(
    client: TestClient, fake_clerk: FakeClerk, database_url: str
) -> None:
    first = client.put(
        "/v1/check-ins/2026-11-28", json=GOOD_ANSWERS, headers=signed_in(fake_clerk)
    ).json()
    created_before = asyncio.run(run_sql(database_url, "SELECT created_at FROM check_ins"))

    again = client.put(
        "/v1/check-ins/2026-11-28",
        json={**GOOD_ANSWERS, "pain": 5, "note": "worse in the evening"},
        headers=signed_in(fake_clerk),
    ).json()

    assert again["pain"] == 5
    assert again["note"] == "worse in the evening"
    assert again["updated_at"] > first["updated_at"]
    # Still one row, first saved at the same time
    assert _count_check_ins(database_url) == 1
    assert asyncio.run(run_sql(database_url, "SELECT created_at FROM check_ins")) == created_before


def test_saving_works_even_before_the_person_is_saved_by_v1_me(
    client: TestClient, fake_clerk: FakeClerk, database_url: str
) -> None:
    # /v1/me runs in the background, so a quick first check-in can arrive before it
    response = client.put(
        "/v1/check-ins/2026-11-28", json=GOOD_ANSWERS, headers=signed_in(fake_clerk)
    )

    assert response.status_code == 200
    assert _count_users(database_url) == 1


def test_saving_needs_a_valid_sign_in(
    client: TestClient, fake_clerk: FakeClerk, database_url: str
) -> None:
    forger = FakeClerk()

    no_token = client.put("/v1/check-ins/2026-11-28", json=GOOD_ANSWERS)
    forged = client.put(
        "/v1/check-ins/2026-11-28",
        json=GOOD_ANSWERS,
        headers={"Authorization": f"Bearer {forger.token()}"},
    )

    assert (no_token.status_code, forged.status_code) == (401, 401)
    assert _count_check_ins(database_url) == 0


def test_sign_in_is_checked_before_the_answers(client: TestClient) -> None:
    # Someone not signed in can't use the error messages to learn the rules
    response = client.put("/v1/check-ins/2026-11-28", json={**GOOD_ANSWERS, "pain": 9})

    assert response.status_code == 401


def test_a_check_in_that_breaks_a_rule_is_refused_and_nothing_is_saved(
    client: TestClient, fake_clerk: FakeClerk, database_url: str
) -> None:
    response = client.put(
        "/v1/check-ins/2026-11-28",
        json={**GOOD_ANSWERS, "pain": 9},
        headers=signed_in(fake_clerk),
    )

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["body", "pain"]
    assert _count_check_ins(database_url) == 0


def test_a_day_that_hasnt_started_anywhere_is_refused(
    client: TestClient, fake_clerk: FakeClerk
) -> None:
    response = client.put(
        "/v1/check-ins/2100-01-01", json=GOOD_ANSWERS, headers=signed_in(fake_clerk)
    )

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["path", "date"]


def test_error_messages_never_repeat_what_was_sent(
    client: TestClient, fake_clerk: FakeClerk
) -> None:
    # A note can hold health details, so a refusal says which rule broke, not the note
    private = "my knees are bad today " * 20

    response = client.put(
        "/v1/check-ins/2026-11-28",
        json={**GOOD_ANSWERS, "note": private},
        headers=signed_in(fake_clerk),
    )

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["body", "note"]
    assert "my knees" not in response.text
    assert "input" not in response.json()["detail"][0]


def test_two_people_saving_the_same_day_each_get_their_own(
    client: TestClient, fake_clerk: FakeClerk, database_url: str
) -> None:
    client.put("/v1/check-ins/2026-11-28", json=GOOD_ANSWERS, headers=signed_in(fake_clerk))
    client.put(
        "/v1/check-ins/2026-11-28",
        json={**GOOD_ANSWERS, "pain": 1},
        headers=signed_in(fake_clerk, **SAM),
    )

    rows = asyncio.run(
        run_sql(
            database_url,
            "SELECT users.clerk_id, check_ins.pain FROM check_ins"
            " JOIN users ON users.id = check_ins.user_id ORDER BY users.clerk_id",
        )
    )
    assert rows == [("user_sam456", 1), ("user_test123", 3)]
