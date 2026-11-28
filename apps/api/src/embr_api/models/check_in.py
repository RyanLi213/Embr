"""The `check_ins` table: one row per person per day, with that day's answers."""

import datetime as dt
import uuid

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    SmallInteger,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from embr_api.models.base import Base

# The five 1-to-5 answers, in the order the check-in asks them
ANSWERS = ("pain", "stiffness", "energy", "mood", "overall")
# The longest note a check-in can have (the same limit as the website)
NOTE_LIMIT = 240


class CheckIn(Base):
    __tablename__ = "check_ins"
    __table_args__ = (
        # One check-in per person per day. Also makes "my check-ins between two dates" fast
        UniqueConstraint("user_id", "date", name="check_ins_user_id_date_key"),
        # A second safety net behind the API's own checks
        *(
            CheckConstraint(f"{answer} BETWEEN 1 AND 5", name=f"check_ins_{answer}_check")
            for answer in ANSWERS
        ),
        CheckConstraint("questions_version >= 1", name="check_ins_questions_version_check"),
        CheckConstraint(f"char_length(note) <= {NOTE_LIMIT}", name="check_ins_note_check"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, server_default=func.gen_random_uuid())
    # Whose check-in it is. Deleting the person deletes their check-ins too
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    # The person's own day (their local date, chosen by their device)
    date: Mapped[dt.date] = mapped_column(Date)
    # Which set of questions was answered: 1 is today's set. A new set gets a new number,
    # so old check-ins can always be read the way they were answered
    questions_version: Mapped[int] = mapped_column(SmallInteger)
    # The answers, each 1 (lowest) to 5 (highest)
    pain: Mapped[int] = mapped_column(SmallInteger)
    stiffness: Mapped[int] = mapped_column(SmallInteger)
    energy: Mapped[int] = mapped_column(SmallInteger)
    mood: Mapped[int] = mapped_column(SmallInteger)
    overall: Mapped[int] = mapped_column(SmallInteger)
    flare: Mapped[bool] = mapped_column(Boolean)
    note: Mapped[str] = mapped_column(Text, server_default="")
    # When it was first saved, and the last time it was changed
    created_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
