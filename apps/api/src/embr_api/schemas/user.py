"""Shapes of the data the user endpoints send back."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class UserResponse(BaseModel):
    """The signed-in person, as saved in our database."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str | None
    name: str | None
    phone: str | None
    created_at: datetime
    last_seen_at: datetime
