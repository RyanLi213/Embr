"""CORS: the browser may call the API only from the web app's address."""

from fastapi.testclient import TestClient

from embr_api.core.config import Settings
from embr_api.main import create_app

NO_DATABASE = "postgresql+asyncpg://embr:embr@127.0.0.1:1/embr"
WEB_APP = "http://localhost:3000"


def make_client() -> TestClient:
    return TestClient(create_app(Settings(database_url=NO_DATABASE)))


def test_default_settings_allow_the_local_web_app() -> None:
    # Guards the real default, so a typo like "localost" fails here, not in the browser
    assert Settings().cors_origins == [WEB_APP]


def test_the_web_app_is_allowed() -> None:
    with make_client() as client:
        response = client.get("/v1/health", headers={"Origin": WEB_APP})

    assert response.headers["access-control-allow-origin"] == WEB_APP


def test_the_browser_preflight_check_is_allowed() -> None:
    # Before some requests the browser first asks "may I?" with an OPTIONS request
    with make_client() as client:
        response = client.options(
            "/v1/health",
            headers={"Origin": WEB_APP, "Access-Control-Request-Method": "GET"},
        )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == WEB_APP


def test_other_websites_are_not_allowed() -> None:
    with make_client() as client:
        response = client.get("/v1/health", headers={"Origin": "https://evil.example"})

    assert "access-control-allow-origin" not in response.headers
