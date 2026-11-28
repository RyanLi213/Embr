"""Create the check_ins table.

One row per person per day, with that day's answers. As a second safety net
behind the API's checks, the database itself refuses answers outside 1 to 5,
notes over 240 characters, and a second check-in for the same person and day.
A person's check-ins are deleted with them. `questions_version` says which set
of questions was answered (1 is today's set).

Revision ID: 0003
Revises: 0002
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: str | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

ANSWERS = ("pain", "stiffness", "energy", "mood", "overall")


def upgrade() -> None:
    op.create_table(
        "check_ins",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("questions_version", sa.SmallInteger(), nullable=False),
        *(sa.Column(answer, sa.SmallInteger(), nullable=False) for answer in ANSWERS),
        sa.Column("flare", sa.Boolean(), nullable=False),
        sa.Column("note", sa.Text(), server_default="", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name="check_ins_pkey"),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], name="check_ins_user_id_fkey", ondelete="CASCADE"
        ),
        sa.UniqueConstraint("user_id", "date", name="check_ins_user_id_date_key"),
        *(
            sa.CheckConstraint(f"{answer} BETWEEN 1 AND 5", name=f"check_ins_{answer}_check")
            for answer in ANSWERS
        ),
        sa.CheckConstraint("questions_version >= 1", name="check_ins_questions_version_check"),
        sa.CheckConstraint("char_length(note) <= 240", name="check_ins_note_check"),
    )


def downgrade() -> None:
    op.drop_table("check_ins")
