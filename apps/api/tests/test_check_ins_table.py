"""The check_ins table's own rules, tested straight on a real, throwaway Postgres.

The API checks every rule first. These tests prove the database also refuses
bad data, as a second safety net if the API ever has a bug.
"""

import asyncio
import uuid
from datetime import date
from typing import Any

import pytest
from sqlalchemy.exc import IntegrityError

from tests.conftest import run_sql

# One good check-in. Tests change one value at a time to break a rule
GOOD_CHECK_IN: dict[str, Any] = {
    "date": date(2026, 11, 28),
    "questions_version": 1,
    "pain": 3,
    "stiffness": 2,
    "energy": 4,
    "mood": 4,
    "overall": 3,
    "flare": False,
    "note": "walked the dog",
}

SAVE_CHECK_IN = """
    INSERT INTO check_ins
        (user_id, date, questions_version, pain, stiffness, energy, mood, overall, flare, note)
    VALUES
        (:user_id, :date, :questions_version, :pain, :stiffness, :energy, :mood, :overall,
         :flare, :note)
"""


def _add_person(database_url: str, clerk_id: str) -> uuid.UUID:
    """Saves a person in `users` and gives back their id."""
    rows = asyncio.run(
        run_sql(
            database_url,
            "INSERT INTO users (clerk_id) VALUES (:clerk_id) RETURNING id",
            {"clerk_id": clerk_id},
        )
    )
    person_id: uuid.UUID = rows[0][0]
    return person_id


def _save(database_url: str, user_id: uuid.UUID, **changes: Any) -> None:
    """Saves one check-in straight into the table. Pass changes to break a rule, e.g. pain=6."""
    asyncio.run(
        run_sql(database_url, SAVE_CHECK_IN, {**GOOD_CHECK_IN, **changes, "user_id": user_id})
    )


@pytest.fixture
def person(database_url: str) -> uuid.UUID:
    """An empty database with one person in it. Gives their id."""
    asyncio.run(run_sql(database_url, "DELETE FROM users"))
    return _add_person(database_url, "user_alex")


ANSWERS = ["pain", "stiffness", "energy", "mood", "overall"]


def _count_check_ins(database_url: str) -> int:
    count: int = asyncio.run(run_sql(database_url, "SELECT count(*) FROM check_ins"))[0][0]
    return count


# --- What a check-in holds ---


def test_a_good_check_in_is_saved(database_url: str, person: uuid.UUID) -> None:
    _save(database_url, person)

    rows = asyncio.run(run_sql(database_url, "SELECT date, pain, flare, note FROM check_ins"))
    assert rows == [(date(2026, 11, 28), 3, False, "walked the dog")]


def test_an_empty_note_is_allowed(database_url: str, person: uuid.UUID) -> None:
    _save(database_url, person, note="")

    assert _count_check_ins(database_url) == 1


def test_a_note_of_exactly_240_characters_is_allowed(database_url: str, person: uuid.UUID) -> None:
    _save(database_url, person, note="a" * 240)

    assert _count_check_ins(database_url) == 1


@pytest.mark.parametrize("missing", [*ANSWERS, "date", "questions_version", "flare", "note"])
def test_the_database_refuses_a_check_in_with_a_value_missing(
    database_url: str, person: uuid.UUID, missing: str
) -> None:
    with pytest.raises(IntegrityError):
        _save(database_url, person, **{missing: None})


# --- The rules the database enforces ---


@pytest.mark.parametrize("answer", ANSWERS)
@pytest.mark.parametrize("value", [0, 6])
def test_the_database_refuses_an_answer_outside_1_to_5(
    database_url: str, person: uuid.UUID, answer: str, value: int
) -> None:
    with pytest.raises(IntegrityError):
        _save(database_url, person, **{answer: value})


def test_the_database_refuses_a_note_over_240_characters(
    database_url: str, person: uuid.UUID
) -> None:
    with pytest.raises(IntegrityError):
        _save(database_url, person, note="a" * 241)


def test_the_database_refuses_a_questions_version_below_1(
    database_url: str, person: uuid.UUID
) -> None:
    with pytest.raises(IntegrityError):
        _save(database_url, person, questions_version=0)


# --- One per person per day ---


def test_the_database_refuses_a_second_check_in_for_the_same_day(
    database_url: str, person: uuid.UUID
) -> None:
    _save(database_url, person)

    with pytest.raises(IntegrityError):
        _save(database_url, person, pain=5)
    assert _count_check_ins(database_url) == 1


def test_one_person_can_check_in_on_different_days(database_url: str, person: uuid.UUID) -> None:
    _save(database_url, person, date=date(2026, 11, 27))
    _save(database_url, person, date=date(2026, 11, 28))

    assert _count_check_ins(database_url) == 2


def test_two_people_can_check_in_on_the_same_day(database_url: str, person: uuid.UUID) -> None:
    sam = _add_person(database_url, "user_sam")

    _save(database_url, person)
    _save(database_url, sam)

    assert _count_check_ins(database_url) == 2


# --- Whose check-in it is ---


def test_the_database_refuses_a_check_in_for_someone_who_doesnt_exist(
    database_url: str, person: uuid.UUID
) -> None:
    # `person` isn't used here; asking for it empties the database first
    with pytest.raises(IntegrityError):
        _save(database_url, uuid.uuid4())


def test_deleting_a_person_deletes_only_their_check_ins(
    database_url: str, person: uuid.UUID
) -> None:
    sam = _add_person(database_url, "user_sam")
    _save(database_url, person)
    _save(database_url, sam)

    asyncio.run(run_sql(database_url, "DELETE FROM users WHERE id = :id", {"id": person}))

    rows = asyncio.run(run_sql(database_url, "SELECT user_id FROM check_ins"))
    assert rows == [(sam,)]
