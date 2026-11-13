"""Health endpoint tests that need no database."""

from fastapi.testclient import TestClient

from embr_api.core.config import Settings
from embr_api.main import create_app

# Nothing listens on port 1, so the database check fails fast
NO_DATABASE = "postgresql+asyncpg://embr:embr@127.0.0.1:1/embr"


def test_health_answers_even_when_the_database_is_down() -> None:
    settings = Settings(database_url=NO_DATABASE, environment="test", version="9.9.9")

    with TestClient(create_app(settings)) as client:
        response = client.get("/v1/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "degraded",
        "database": "unavailable",
        "environment": "test",
        "version": "9.9.9",
    }


def test_unversioned_path_is_not_found() -> None:
    with TestClient(create_app(Settings(database_url=NO_DATABASE))) as client:
        assert client.get("/health").status_code == 404
