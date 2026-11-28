"""The rules every check-in sent to the API must follow (unit tests: no API, no database)."""

import datetime as dt
from typing import Any

import pytest
from pydantic import TypeAdapter, ValidationError

from embr_api.schemas.check_in import (
    IMPORT_LIMIT,
    CheckInAnswers,
    CheckInDay,
    CheckInImport,
    CheckInRange,
)

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
ANSWERS = ["pain", "stiffness", "energy", "mood", "overall"]

check_in_day: TypeAdapter[dt.date] = TypeAdapter(CheckInDay)


def _utc_today_plus(days: int) -> str:
    return (dt.datetime.now(dt.UTC).date() + dt.timedelta(days=days)).isoformat()


def _answers(**changes: Any) -> CheckInAnswers:
    return CheckInAnswers.model_validate({**GOOD_ANSWERS, **changes})


def _import(days: list[str]) -> CheckInImport:
    return CheckInImport.model_validate(
        {"check_ins": [{**GOOD_ANSWERS, "date": day} for day in days]}
    )


# --- Answers ---


def test_good_answers_are_accepted() -> None:
    answers = _answers()

    assert answers.pain == 3
    assert answers.flare is False


@pytest.mark.parametrize("answer", ANSWERS)
@pytest.mark.parametrize("value", [1, 5])
def test_each_answer_accepts_1_to_5(answer: str, value: int) -> None:
    assert getattr(_answers(**{answer: value}), answer) == value


@pytest.mark.parametrize("answer", ANSWERS)
@pytest.mark.parametrize("value", [0, 6, 3.5, "3", True, None])
def test_each_answer_refuses_anything_but_a_whole_number_from_1_to_5(
    answer: str, value: Any
) -> None:
    with pytest.raises(ValidationError):
        _answers(**{answer: value})


@pytest.mark.parametrize("value", [1, "true", "yes", None])
def test_flare_must_be_true_or_false(value: Any) -> None:
    with pytest.raises(ValidationError):
        _answers(flare=value)


@pytest.mark.parametrize("missing", [*ANSWERS, "questions_version", "flare"])
def test_every_answer_is_required(missing: str) -> None:
    answers = {key: value for key, value in GOOD_ANSWERS.items() if key != missing}

    with pytest.raises(ValidationError):
        CheckInAnswers.model_validate(answers)


def test_anything_extra_is_refused_so_nobody_can_send_a_user_id() -> None:
    with pytest.raises(ValidationError):
        _answers(user_id="someone-else")


# --- Questions version ---


@pytest.mark.parametrize("value", [0, 2, True, "1"])
def test_only_known_questions_versions_are_accepted(value: Any) -> None:
    with pytest.raises(ValidationError):
        _answers(questions_version=value)


# --- Note ---


def test_the_note_can_be_left_out() -> None:
    answers = {key: value for key, value in GOOD_ANSWERS.items() if key != "note"}

    assert CheckInAnswers.model_validate(answers).note == ""


def test_spaces_around_the_note_are_trimmed_before_its_length_is_checked() -> None:
    assert _answers(note="  " + "a" * 240 + "  ").note == "a" * 240


@pytest.mark.parametrize("note", ["a" * 241, "a\x00b", 5, None])
def test_the_note_refuses_too_long_a_nul_character_or_not_text(note: Any) -> None:
    with pytest.raises(ValidationError):
        _answers(note=note)


# --- The day ---


@pytest.mark.parametrize("days_from_today", [-400, -1, 0, 1])
def test_a_day_up_to_utc_tomorrow_is_accepted(days_from_today: int) -> None:
    # Up to tomorrow, because somewhere in the world it may already be tomorrow
    day = _utc_today_plus(days_from_today)

    assert check_in_day.validate_python(day).isoformat() == day


def test_a_day_that_hasnt_started_anywhere_is_refused() -> None:
    with pytest.raises(ValidationError):
        check_in_day.validate_python(_utc_today_plus(2))


@pytest.mark.parametrize(
    "day", ["2026-02-30", "28/11/2026", "2026-11-28T00:00:00", "", 1764288000, None]
)
def test_a_day_must_be_a_real_date_written_as_yyyy_mm_dd(day: Any) -> None:
    with pytest.raises(ValidationError):
        check_in_day.validate_python(day)


# --- Import ---


def test_an_import_accepts_up_to_the_limit() -> None:
    first = dt.date(2020, 1, 1)
    days = [(first + dt.timedelta(days=n)).isoformat() for n in range(IMPORT_LIMIT)]

    assert len(_import(days).check_ins) == IMPORT_LIMIT


def test_an_import_refuses_more_than_the_limit() -> None:
    first = dt.date(2020, 1, 1)
    days = [(first + dt.timedelta(days=n)).isoformat() for n in range(IMPORT_LIMIT + 1)]

    with pytest.raises(ValidationError):
        _import(days)


def test_an_import_can_be_empty() -> None:
    assert _import([]).check_ins == []


def test_an_import_refuses_the_same_day_twice() -> None:
    with pytest.raises(ValidationError):
        _import(["2026-11-27", "2026-11-27"])


def test_an_import_checks_every_check_in() -> None:
    check_ins = [
        {**GOOD_ANSWERS, "date": "2026-11-27"},
        {**GOOD_ANSWERS, "date": "2026-11-28", "pain": 9},
    ]

    with pytest.raises(ValidationError):
        CheckInImport.model_validate({"check_ins": check_ins})


# --- Range ---


@pytest.mark.parametrize(
    ("start", "end"),
    [
        ("2026-11-28", "2026-11-28"),  # one day
        ("2026-11-01", "2026-11-30"),  # a month
        ("2024-01-01", "2024-12-31"),  # a leap year: 366 days
        ("2026-12-01", "2026-12-31"),  # the future is fine to ask about
    ],
)
def test_a_range_of_up_to_366_days_is_accepted(start: str, end: str) -> None:
    days = CheckInRange.model_validate({"from": start, "to": end})

    assert (days.start.isoformat(), days.end.isoformat()) == (start, end)


@pytest.mark.parametrize(
    ("start", "end"),
    [
        ("2026-11-30", "2026-11-01"),  # backwards
        ("2025-01-01", "2026-01-02"),  # 367 days
        ("2026-11-01", None),  # an end is missing
    ],
)
def test_a_range_refuses_backwards_too_long_or_missing_ends(start: str, end: str | None) -> None:
    with pytest.raises(ValidationError):
        CheckInRange.model_validate({"from": start, "to": end})
