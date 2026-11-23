"""Database addresses from hosts like Neon work as they are handed out. Made-up addresses only."""

import pytest
from sqlalchemy import make_url

from embr_api.core.database import asyncpg_url, connect_args_for, create_engine

NEON_POOLED = (
    "postgresql://app_user:not-a-real-password@ep-made-up-123-pooler.c-1.us-east-1.aws.neon.tech"
    "/neondb?sslmode=require&channel_binding=require"
)
LOCAL = "postgresql+asyncpg://embr:embr@localhost:5432/embr"


def test_turns_a_neon_address_into_the_asyncpg_form() -> None:
    url = make_url(asyncpg_url(NEON_POOLED))

    assert url.drivername == "postgresql+asyncpg"
    assert url.host == "ep-made-up-123-pooler.c-1.us-east-1.aws.neon.tech"
    assert url.database == "neondb"
    assert url.password == make_url(NEON_POOLED).password  # the password survives the change
    # sslmode becomes asyncpg's "ssl"; channel_binding is dropped (asyncpg doesn't take it)
    assert dict(url.query) == {"ssl": "require"}


@pytest.mark.parametrize(
    ("name", "address"),
    [
        ("the local Docker database", LOCAL),
        (
            "an address already in asyncpg form",
            "postgresql+asyncpg://u:p@db.example/app?ssl=require",
        ),
    ],
)
def test_leaves_asyncpg_addresses_alone(name: str, address: str) -> None:
    assert asyncpg_url(address) == address


def test_accepts_the_short_postgres_scheme() -> None:
    assert asyncpg_url("postgres://u:p@db.example/app").startswith("postgresql+asyncpg://")


def test_turns_off_saved_statements_on_neons_pooled_address() -> None:
    # PgBouncer may run each query on a different connection, so asyncpg must not reuse them
    args = connect_args_for(asyncpg_url(NEON_POOLED))

    assert args["statement_cache_size"] == 0
    first, second = args["prepared_statement_name_func"](), args["prepared_statement_name_func"]()
    assert first != second


def test_keeps_saved_statements_on_a_direct_connection() -> None:
    assert connect_args_for(LOCAL) == {"timeout": 10}


def test_the_engine_accepts_neons_address_as_handed_out() -> None:
    engine = create_engine(NEON_POOLED)

    assert engine.url.drivername == "postgresql+asyncpg"
    assert dict(engine.url.query) == {"ssl": "require"}
