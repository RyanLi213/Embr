"""Application settings, read from environment variables (and `.env` locally)."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="EMBR_", env_file=".env", extra="ignore")

    app_name: str = "Embr API"
    environment: str = "local"
    version: str = "0.1.0"


@lru_cache
def get_settings() -> Settings:
    return Settings()
