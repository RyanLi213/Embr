from fastapi.testclient import TestClient

from embr_api.core.config import Settings, get_settings
from embr_api.main import create_app


def test_health_returns_ok() -> None:
    client = TestClient(create_app())

    response = client.get("/v1/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_health_reports_environment_and_version() -> None:
    app = create_app()
    app.dependency_overrides[get_settings] = lambda: Settings(environment="test", version="9.9.9")
    client = TestClient(app)

    body = client.get("/v1/health").json()

    assert body == {"status": "ok", "environment": "test", "version": "9.9.9"}


def test_unversioned_path_is_not_found() -> None:
    client = TestClient(create_app())

    assert client.get("/health").status_code == 404
