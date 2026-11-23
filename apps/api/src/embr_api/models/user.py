"""The `users` table: everyone who has signed in to Embr."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from embr_api.models.base import Base


class User(Base):
    __tablename__ = "users"

    # Our own ID for the person, made by Postgres
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, server_default=func.gen_random_uuid())
    # Clerk's ID for the person ("user_..."). Unique, so nobody is saved twice
    clerk_id: Mapped[str] = mapped_column(Text, unique=True)
    # Copied from Clerk on each visit. Any of them can be missing
    email: Mapped[str | None] = mapped_column(Text)
    name: Mapped[str | None] = mapped_column(Text)
    phone: Mapped[str | None] = mapped_column(Text)
    # When they were first saved, and the last time they opened the app signed in
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    last_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
