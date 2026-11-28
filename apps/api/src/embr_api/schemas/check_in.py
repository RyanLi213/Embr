"""Shapes of the check-in data the API takes in and sends back, with their rules.

The rules match the website's (`apps/web/src/lib/check-in.ts`), so neither side
can save something the other refuses. Answers are strict: "3" is not 3, and 1
is not true, so nothing is quietly converted.
"""

import datetime as dt
import re
from typing import Annotated, Self

from pydantic import (
    AfterValidator,
    BaseModel,
    BeforeValidator,
    ConfigDict,
    Field,
    StrictBool,
    StrictInt,
    StrictStr,
    StringConstraints,
    model_validator,
)

from embr_api.models.check_in import NOTE_LIMIT

# The newest set of check-in questions. Version 1 is today's set: pain, stiffness,
# energy, mood and "How was today overall?" (each 1 to 5), flare yes or no, and a note
QUESTIONS_VERSION = 1
# The most check-ins one import can move (nearly three years of days). Also keeps one
# database statement well under Postgres's limit on values per statement
IMPORT_LIMIT = 1000
# The most days one request can load: a whole year, even a leap year
RANGE_LIMIT_DAYS = 366

_YYYY_MM_DD = re.compile(r"\d{4}-\d{2}-\d{2}")


def _written_as_yyyy_mm_dd(value: object) -> object:
    """Days are sent as text like 2026-11-28, the way the website stores them."""
    if not isinstance(value, str) or not _YYYY_MM_DD.fullmatch(value):
        raise ValueError("must be a day written as YYYY-MM-DD")
    return value


def _started_somewhere(day: dt.date) -> dt.date:
    """The day is the person's own date, and we don't know their time zone. The
    furthest-ahead time zones are 14 hours past UTC, so nobody's today is later
    than UTC's tomorrow."""
    if day > dt.datetime.now(dt.UTC).date() + dt.timedelta(days=1):
        raise ValueError("can't be a day that hasn't started anywhere yet")
    return day


# Any day, written as YYYY-MM-DD (for example the ends of a range)
DayText = Annotated[dt.date, BeforeValidator(_written_as_yyyy_mm_dd)]
# A day someone can check in for: today or earlier, wherever they are
CheckInDay = Annotated[DayText, AfterValidator(_started_somewhere)]

Answer = Annotated[StrictInt, Field(ge=1, le=5)]
# Spaces around the note are trimmed before its length is checked, as on the website.
# Postgres can't store the "NUL" character, so it's refused here instead of failing there
Note = Annotated[
    StrictStr,
    StringConstraints(strip_whitespace=True, max_length=NOTE_LIMIT, pattern=r"^[^\x00]*$"),
]


class CheckInAnswers(BaseModel):
    """One day's answers, as the website sends them. The day itself is in the address."""

    # Anything else (like someone else's user ID) is refused, not ignored
    model_config = ConfigDict(extra="forbid")

    # Which set of questions was answered. Old sets stay valid, so old check-ins still load
    questions_version: Annotated[StrictInt, Field(ge=1, le=QUESTIONS_VERSION)]
    pain: Answer
    stiffness: Answer
    energy: Answer
    mood: Answer
    overall: Answer
    flare: StrictBool
    note: Note = ""


class CheckInToImport(CheckInAnswers):
    """A check-in saved in a browser before signing in, with its day."""

    date: CheckInDay


class CheckInImport(BaseModel):
    """The check-ins a browser saved before signing in, to move into the account."""

    model_config = ConfigDict(extra="forbid")

    check_ins: Annotated[list[CheckInToImport], Field(max_length=IMPORT_LIMIT)]

    @model_validator(mode="after")
    def _one_per_day(self) -> Self:
        days = [check_in.date for check_in in self.check_ins]
        if len(days) != len(set(days)):
            raise ValueError("each day can only be sent once")
        return self


class CheckInRange(BaseModel):
    """`?from=...&to=...`: which days to load, both ends included."""

    start: DayText = Field(alias="from")
    end: DayText = Field(alias="to")

    @model_validator(mode="after")
    def _a_sensible_range(self) -> Self:
        if self.start > self.end:
            raise ValueError("from must be on or before to")
        if (self.end - self.start).days + 1 > RANGE_LIMIT_DAYS:
            raise ValueError(f"can load at most {RANGE_LIMIT_DAYS} days at a time")
        return self


class CheckInResponse(BaseModel):
    """One saved check-in, as the API sends it back."""

    model_config = ConfigDict(from_attributes=True)

    date: dt.date
    questions_version: int
    pain: int
    stiffness: int
    energy: int
    mood: int
    overall: int
    flare: bool
    note: str
    # When it was last changed
    updated_at: dt.datetime


class CheckInImportResult(BaseModel):
    """What an import did. Days whose two copies were identical appear in neither list."""

    # Days moved from the browser into the account
    imported: list[dt.date]
    # The account's own version of each day that was in both and differed, oldest first,
    # so the website can show both and ask which to keep
    conflicts: list[CheckInResponse]
