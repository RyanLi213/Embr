"""Application settings, read from environment variables (and `.env` locally)."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="EMBR_", env_file=".env", extra="ignore")

    app_name: str = "Embr API"
    environment: str = "local"
    version: str = "0.1.0"

    # Default matches the local database in docker-compose.yml. Never a real secret.
    database_url: str = "postgresql+asyncpg://embr:embr@localhost:5432/embr"

    # Web addresses allowed to call this API from a browser. Sign-in tokens
    # must also have been made for one of these sites.
    cors_origins: list[str] = ["http://localhost:3000"]

    # Our Clerk app's public address, which signs the sign-in tokens. Not a
    # secret. Without it, sign-in endpoints answer 503 "not set up".
    clerk_issuer: str | None = None


@lru_cache
def get_settings() -> Settings:
    return Settings()
