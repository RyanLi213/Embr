# Skills

Step-by-step recipes for tasks that repeat in Embr. Follow them so every feature is built the same way.

- [Add an API endpoint](#add-an-api-endpoint)
- [Add a database migration](#add-a-database-migration)
- [Run all checks](#run-all-checks)

---

## Add an API endpoint

The backend in `apps/api` is layered. Each layer has one job and only talks to the layer below it:

```
routes/        HTTP only: read the request, call a service, return a schema
services/      business rules; knows nothing about HTTP
repositories/  the only code that talks to the database
models/        SQLAlchemy table definitions
schemas/       Pydantic shapes for data in and out (this is where validation lives)
```

`/v1/health` is the reference example: `routes/health.py` → `services/health.py` → `repositories/health.py`, with `schemas/health.py`.

### Steps

1. **Schema** (`schemas/<feature>.py`): Pydantic models for the request body and the response. Put validation here with `Field(...)`, for example `pain: int = Field(ge=0, le=10)`. Never return a database model directly.
2. **Model** (`models/<feature>.py`), if a new table is needed: inherit from `models.base.Base` and use typed `Mapped[...]` columns.
3. **Migration**, if a model changed: see [Add a database migration](#add-a-database-migration).
4. **Repository** (`repositories/<feature>.py`): async functions that take an `AsyncSession`. Every query that reads personal data filters by the current user.
5. **Service** (`services/<feature>.py`): business rules. Takes plain values and a session, returns schemas.
6. **Route** (`routes/<feature>.py`): an `APIRouter` with `tags=[...]` and a `summary=` on each endpoint. Get the session with `Depends(get_session)`. Declare the return type so it appears in the OpenAPI spec.
7. **Register the router** in `main.py` under the `v1` router. Every route lives under `/v1`.
8. **Tests** (`apps/api/tests/test_<feature>.py`):
   - the happy path, plus validation failures (expect `422`)
   - anything touching the database uses the Testcontainers pattern in `tests/test_database.py`
   - coverage stays at or above 90%
9. **Regenerate the web client** from the repo root: `pnpm generate:api`. Commit `packages/api-client/openapi.json` and `src/schema.d.ts` together with the API change.
10. **Run all checks**: see [Run all checks](#run-all-checks).

### Rules

- Health data is sensitive: no personal data in logs or error messages.
- No secrets in code; read settings from `core/config.py` (environment variables).
- User-facing wording never diagnoses or predicts: "your patterns suggest", "see a doctor".

---

## Add a database migration

The database schema only changes through Alembic migrations in `apps/api/migrations/versions/`. Never edit tables by hand.

### Steps

1. Start the local database and bring it up to date (repo root):
   ```
   pnpm db:up
   pnpm db:migrate
   ```
2. Change or add the model in `apps/api/src/embr_api/models/`. New model files must be imported where `migrations/env.py` can reach them through `models.base.Base`, or Alembic will not see them.
3. Generate the migration (from `apps/api`):
   ```
   uv run alembic revision --autogenerate -m "short description of the change"
   ```
4. **Read the generated file.** Alembic misses some things (renames look like drop + add, server defaults, extensions). Fix it by hand, and make sure `downgrade()` truly reverses `upgrade()`.
5. Apply it: `pnpm db:migrate` (repo root).
6. Run the tests. `tests/test_database.py` applies every migration to a fresh Postgres, so a broken migration fails there.
7. Commit the migration together with the model change.

### Rules

- Never edit a migration that is already on `main`; write a new one.
- Changes that delete data (dropping a column or table) need explicit approval first.

---

## Run all checks

Run from the repo root, fastest first. Docker must be running.

```
pnpm lint            # Ruff (API) + ESLint (web)
pnpm typecheck       # strict mypy (API) + TypeScript (web, api-client)
pnpm test            # pytest with a real Postgres (API) + Vitest (web)
pnpm check:api       # the committed typed client matches the current API
pnpm db:up           # needed for the end-to-end test
pnpm test:e2e        # Playwright: real browser -> web app -> API -> database
```

Coverage minimums: API 90% (runs with `pnpm test`), web 90% (`pnpm --filter @embr/web test:coverage`).

### If something fails

- **Ruff formatting**: run `uv run ruff format .` in `apps/api`.
- **`check:api` shows a difference**: the API changed without regenerating the client. Run `pnpm generate:api` and commit the result.
- **Database tests or e2e can't connect**: Docker Desktop isn't running, or `pnpm db:up` wasn't run.
- **Next.js error overlay after installing packages**: stop the web app, run `pnpm clean` (deletes build and test caches in every app), then start it again.

Never call a change done while a check fails.
