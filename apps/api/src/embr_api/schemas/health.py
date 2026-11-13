"""Shapes of the data the health endpoint sends back."""

from typing import Literal

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: Literal["ok"]
    environment: str
    version: str
