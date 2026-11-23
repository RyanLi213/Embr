"""The one place the API checks who is signed in.

The web app signs people in with Clerk and sends us Clerk's token (a JWT) with
each request. We check it is real before trusting who it says the person is.
Everything Clerk-specific lives in this file, so replacing Clerk later with our
own sign-in only changes this module.
"""

from dataclasses import dataclass
from functools import lru_cache
from typing import Annotated, Any, Protocol

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.concurrency import run_in_threadpool
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from embr_api.core.config import Settings, get_settings


@dataclass(frozen=True)
class SignedInPerson:
    """Who a valid token belongs to. Email, name and phone can be missing."""

    clerk_id: str
    email: str | None
    name: str | None
    phone: str | None


class SigningKeySource(Protocol):
    """Finds the public key that signed a token (normally Clerk's key list, the JWKS)."""

    def get_signing_key_from_jwt(self, token: str) -> jwt.PyJWK: ...


class TokenVerifier:
    """Checks a Clerk token and says who it belongs to. Raises jwt.PyJWTError if it is not valid."""

    def __init__(
        self, issuer: str, allowed_sites: list[str], keys: SigningKeySource | None = None
    ) -> None:
        self.issuer = issuer
        self.allowed_sites = allowed_sites
        # Clerk publishes its public keys here; PyJWKClient downloads and caches them
        self.keys = keys or jwt.PyJWKClient(f"{issuer}/.well-known/jwks.json", lifespan=3600)

    def verify(self, token: str) -> SignedInPerson:
        signing_key = self.keys.get_signing_key_from_jwt(token)
        claims: dict[str, Any] = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            # 1. made by our Clerk app, 2. signature, expiry and start time checked by decode
            issuer=self.issuer,
            options={"require": ["exp", "iat", "iss", "sub"]},
            leeway=5,  # seconds, for small differences between clocks
        )
        # 3. made for our website, not another site using the same Clerk app
        if claims.get("azp") not in self.allowed_sites:
            raise jwt.InvalidTokenError("token was made for another website")
        return SignedInPerson(
            clerk_id=claims["sub"],
            email=_text_or_none(claims.get("email")),
            name=_text_or_none(claims.get("name")),
            phone=_text_or_none(claims.get("phone")),
        )


def _text_or_none(value: object) -> str | None:
    """Clerk sends "" or null for details a person hasn't given."""
    return value if isinstance(value, str) and value.strip() else None


@lru_cache
def _verifier_for(issuer: str, allowed_sites: tuple[str, ...]) -> TokenVerifier:
    # One verifier per Clerk app, so its downloaded keys are reused between requests
    return TokenVerifier(issuer, list(allowed_sites))


def get_token_verifier(settings: Annotated[Settings, Depends(get_settings)]) -> TokenVerifier:
    """FastAPI dependency. Tests replace it with a verifier that uses a made-up key."""
    if not settings.clerk_issuer:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Sign-in is not set up yet.")
    return _verifier_for(settings.clerk_issuer, tuple(settings.cors_origins))


# Reads "Authorization: Bearer <token>", and adds the "Authorize" button to /docs
_bearer = HTTPBearer(auto_error=False)


async def get_signed_in_person(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
    verifier: Annotated[TokenVerifier, Depends(get_token_verifier)],
) -> SignedInPerson:
    """FastAPI dependency for routes that need someone signed in. Anything wrong gives 401."""
    if credentials is None:
        raise _not_signed_in()
    try:
        # Checking may download Clerk's keys, so run it off the main thread
        return await run_in_threadpool(verifier.verify, credentials.credentials)
    except jwt.PyJWTError as error:
        raise _not_signed_in() from error


def _not_signed_in() -> HTTPException:
    # Never says which check failed, so nobody can learn how to forge a token
    return HTTPException(
        status.HTTP_401_UNAUTHORIZED,
        "Sign in to continue.",
        headers={"WWW-Authenticate": "Bearer"},
    )
