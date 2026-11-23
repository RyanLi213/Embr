"""The token check: only real, current tokens made for our site get through."""

import time
from typing import Any

import jwt
import pytest
from fastapi.testclient import TestClient

from embr_api.core.auth import get_token_verifier
from embr_api.core.config import Settings
from embr_api.main import create_app
from tests.conftest import TEST_ISSUER, FakeClerk


def test_a_valid_token_says_who_is_signed_in(fake_clerk: FakeClerk) -> None:
    person = fake_clerk.verifier().verify(fake_clerk.token())

    assert person.clerk_id == "user_test123"
    assert person.email == "alex@example.com"
    assert person.name == "Alex Example"
    # Clerk sends "" when a detail is missing, which we save as empty (None)
    assert person.phone is None


@pytest.mark.parametrize(
    ("name", "changes"),
    [
        ("expired", {"exp": int(time.time()) - 60}),
        ("from another Clerk app", {"iss": "https://someone-else.clerk.accounts.dev"}),
        ("made for another website", {"azp": "https://evil.example"}),
        ("not saying which website", {"azp": None}),
        ("missing who it belongs to", {"sub": None}),
    ],
)
def test_a_bad_token_is_refused(fake_clerk: FakeClerk, name: str, changes: dict[str, Any]) -> None:
    with pytest.raises(jwt.PyJWTError):
        fake_clerk.verifier().verify(fake_clerk.token(**changes))


def test_a_forged_token_is_refused(fake_clerk: FakeClerk) -> None:
    # Signed with a different private key: what an attacker without Clerk's key would make
    forger = FakeClerk()

    with pytest.raises(jwt.PyJWTError):
        fake_clerk.verifier().verify(forger.token())


def test_me_needs_a_token(fake_clerk: FakeClerk) -> None:
    app = create_app(Settings(clerk_issuer=TEST_ISSUER))
    app.dependency_overrides[get_token_verifier] = fake_clerk.verifier

    with TestClient(app) as client:
        no_token = client.get("/v1/me")
        bad_token = client.get("/v1/me", headers={"Authorization": "Bearer not-a-token"})

    assert no_token.status_code == 401
    assert bad_token.status_code == 401
    # The answer never says which check failed
    assert bad_token.json() == {"detail": "Sign in to continue."}


def test_me_says_sign_in_is_not_set_up_without_a_clerk_address() -> None:
    with TestClient(create_app(Settings(clerk_issuer=None))) as client:
        response = client.get("/v1/me", headers={"Authorization": "Bearer anything"})

    assert response.status_code == 503


def test_the_real_checker_uses_our_clerk_app_and_our_websites() -> None:
    settings = Settings(clerk_issuer=TEST_ISSUER, cors_origins=["https://embr.example"])

    verifier = get_token_verifier(settings)

    assert verifier.issuer == TEST_ISSUER
    assert verifier.allowed_sites == ["https://embr.example"]
    # The same checker is reused, so Clerk's keys are downloaded once, not on every request
    assert get_token_verifier(settings) is verifier
