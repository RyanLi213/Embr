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


def _save_day(
    client: TestClient, headers: dict[str, str], day: str, **changes: Any
) -> dict[str, Any]:
    """Saves one day through the API (for setting up the load and import tests)."""
    response = client.put(f"/v1/check-ins/{day}", json={**GOOD_ANSWERS, **changes}, headers=headers)
    assert response.status_code == 200
    saved: dict[str, Any] = response.json()
    return saved


def _load(client: TestClient, headers: dict[str, str], start: str, end: str) -> list[str]:
    """The days the API sends back for a range."""
    response = client.get("/v1/check-ins", params={"from": start, "to": end}, headers=headers)
    assert response.status_code == 200
    return [check_in["date"] for check_in in response.json()]


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


# --- Loading a range: GET /v1/check-ins?from=...&to=... ---


def test_loading_gives_the_days_in_the_range_oldest_first_with_both_ends_included(
    client: TestClient, fake_clerk: FakeClerk
) -> None:
    alex = signed_in(fake_clerk)
    # Saved out of order, with one day just outside each end of October
    for day in ["2026-10-31", "2026-09-30", "2026-10-15", "2026-11-01", "2026-10-01"]:
        _save_day(client, alex, day)

    assert _load(client, alex, "2026-10-01", "2026-10-31") == [
        "2026-10-01",
        "2026-10-15",
        "2026-10-31",
    ]


def test_loading_sends_back_every_answer(client: TestClient, fake_clerk: FakeClerk) -> None:
    saved = _save_day(client, signed_in(fake_clerk), "2026-11-28", pain=5, flare=True)

    response = client.get(
        "/v1/check-ins",
        params={"from": "2026-11-28", "to": "2026-11-28"},
        headers=signed_in(fake_clerk),
    )

    assert response.json() == [saved]


def test_loading_never_shows_someone_elses_check_ins(
    client: TestClient, fake_clerk: FakeClerk
) -> None:
    alex = signed_in(fake_clerk)
    sam = signed_in(fake_clerk, **SAM)
    _save_day(client, alex, "2026-11-28")
    _save_day(client, sam, "2026-11-27")
    _save_day(client, sam, "2026-11-28")

    assert _load(client, alex, "2026-11-01", "2026-11-30") == ["2026-11-28"]
    assert _load(client, sam, "2026-11-01", "2026-11-30") == ["2026-11-27", "2026-11-28"]


def test_loading_with_no_check_ins_gives_an_empty_list_and_changes_nothing(
    client: TestClient, fake_clerk: FakeClerk, database_url: str
) -> None:
    # A GET only reads: it doesn't save the person, unlike saving a check-in
    assert _load(client, signed_in(fake_clerk), "2026-11-01", "2026-11-30") == []
    assert _count_users(database_url) == 0


def test_loading_needs_a_valid_sign_in(client: TestClient) -> None:
    response = client.get("/v1/check-ins", params={"from": "2026-11-01", "to": "2026-11-30"})

    assert response.status_code == 401


def test_loading_refuses_a_backwards_or_too_long_range(
    client: TestClient, fake_clerk: FakeClerk
) -> None:
    backwards = client.get(
        "/v1/check-ins",
        params={"from": "2026-11-30", "to": "2026-11-01"},
        headers=signed_in(fake_clerk),
    )
    too_long = client.get(
        "/v1/check-ins",
        params={"from": "2025-01-01", "to": "2026-01-02"},
        headers=signed_in(fake_clerk),
    )

    assert (backwards.status_code, too_long.status_code) == (422, 422)


# --- Importing a browser's check-ins: POST /v1/check-ins/import ---


def _import(
    client: TestClient, headers: dict[str, str], check_ins: list[dict[str, Any]]
) -> dict[str, Any]:
    response = client.post("/v1/check-ins/import", json={"check_ins": check_ins}, headers=headers)
    assert response.status_code == 200
    result: dict[str, Any] = response.json()
    return result


def _from_browser(day: str, **changes: Any) -> dict[str, Any]:
    return {**GOOD_ANSWERS, "date": day, **changes}


def test_importing_moves_every_new_day_into_the_account(
    client: TestClient, fake_clerk: FakeClerk
) -> None:
    alex = signed_in(fake_clerk)

    result = _import(
        client,
        alex,
        [_from_browser("2026-11-28"), _from_browser("2026-11-26"), _from_browser("2026-11-27")],
    )

    assert result == {"imported": ["2026-11-26", "2026-11-27", "2026-11-28"], "conflicts": []}
    assert _load(client, alex, "2026-11-01", "2026-11-30") == [
        "2026-11-26",
        "2026-11-27",
        "2026-11-28",
    ]


def test_importing_works_for_someone_signing_up_right_now(
    client: TestClient, fake_clerk: FakeClerk, database_url: str
) -> None:
    # The import can arrive before /v1/me has saved them
    _import(client, signed_in(fake_clerk), [_from_browser("2026-11-28")])

    assert _count_users(database_url) == 1


def test_a_day_already_in_the_account_keeps_the_accounts_version_and_is_reported(
    client: TestClient, fake_clerk: FakeClerk
) -> None:
    alex = signed_in(fake_clerk)
    account = _save_day(client, alex, "2026-11-28", pain=3)

    result = _import(
        client, alex, [_from_browser("2026-11-28", pain=5), _from_browser("2026-11-27")]
    )

    # The new day moves in; the day in both comes back so the person can choose
    assert result["imported"] == ["2026-11-27"]
    assert result["conflicts"] == [account]
    # Nothing was overwritten
    response = client.get(
        "/v1/check-ins", params={"from": "2026-11-28", "to": "2026-11-28"}, headers=alex
    )
    assert response.json()[0]["pain"] == 3


def test_identical_copies_are_not_reported(client: TestClient, fake_clerk: FakeClerk) -> None:
    alex = signed_in(fake_clerk)
    _save_day(client, alex, "2026-11-28", note="walked the dog")

    # Spaces around the note are trimmed first, so these two count as the same
    result = _import(client, alex, [_from_browser("2026-11-28", note="  walked the dog ")])

    assert result == {"imported": [], "conflicts": []}


def test_conflicts_come_back_oldest_first(client: TestClient, fake_clerk: FakeClerk) -> None:
    alex = signed_in(fake_clerk)
    _save_day(client, alex, "2026-11-28", pain=1)
    _save_day(client, alex, "2026-11-20", pain=1)

    result = _import(
        client, alex, [_from_browser("2026-11-28", pain=5), _from_browser("2026-11-20", pain=5)]
    )

    assert [day["date"] for day in result["conflicts"]] == ["2026-11-20", "2026-11-28"]


def test_importing_the_same_check_ins_twice_changes_nothing_the_second_time(
    client: TestClient, fake_clerk: FakeClerk, database_url: str
) -> None:
    # Safe to retry if the connection drops halfway
    alex = signed_in(fake_clerk)
    browser = [_from_browser("2026-11-27"), _from_browser("2026-11-28")]
    _import(client, alex, browser)

    again = _import(client, alex, browser)

    assert again == {"imported": [], "conflicts": []}
    assert _count_check_ins(database_url) == 2


def test_importing_only_compares_with_my_own_check_ins(
    client: TestClient, fake_clerk: FakeClerk
) -> None:
    sam = signed_in(fake_clerk, **SAM)
    _save_day(client, sam, "2026-11-28", pain=1)

    result = _import(client, signed_in(fake_clerk), [_from_browser("2026-11-28", pain=5)])

    # Sam's day is neither a conflict nor touched
    assert result == {"imported": ["2026-11-28"], "conflicts": []}
    assert _load(client, sam, "2026-11-28", "2026-11-28") == ["2026-11-28"]
    response = client.get(
        "/v1/check-ins", params={"from": "2026-11-28", "to": "2026-11-28"}, headers=sam
    )
    assert response.json()[0]["pain"] == 1


def test_an_empty_import_does_nothing(client: TestClient, fake_clerk: FakeClerk) -> None:
    assert _import(client, signed_in(fake_clerk), []) == {"imported": [], "conflicts": []}


def test_an_import_with_one_bad_check_in_saves_nothing(
    client: TestClient, fake_clerk: FakeClerk, database_url: str
) -> None:
    response = client.post(
        "/v1/check-ins/import",
        json={"check_ins": [_from_browser("2026-11-27"), _from_browser("2026-11-28", pain=9)]},
        headers=signed_in(fake_clerk),
    )

    assert response.status_code == 422
    assert _count_check_ins(database_url) == 0


def test_importing_needs_a_valid_sign_in(client: TestClient, database_url: str) -> None:
    response = client.post(
        "/v1/check-ins/import", json={"check_ins": [_from_browser("2026-11-28")]}
    )

    assert response.status_code == 401
    assert _count_check_ins(database_url) == 0
