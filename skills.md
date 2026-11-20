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

Each check below can be run on its own, from the repo root. Run the one that matches what you changed while you work, fastest first. Before calling a change done, run all of them at once with `pnpm check` (Docker Desktop must be running): it runs every check CI runs, in the same order, and stops at the first failure.

What each check is and why it exists: [docs/testing.md](docs/testing.md).

### Lint

```
pnpm lint
```

- **Checks:** code style and common mistakes, without running the code. ESLint (web), Ruff (API).
- **Run after:** any edit. It takes seconds.
- **If it fails:** the output names the file, line and rule. For Ruff formatting, run `uv run ruff format .` in `apps/api`.

### Type check

```
pnpm typecheck
```

- **Checks:** every function gets the kind of data it expects. TypeScript (web, api-client), strict mypy (API).
- **Run after:** changing a function's inputs or outputs, or adding a page.
- **If it fails:** read the "is not assignable to" message: it names what was given and what was expected. If it mentions `.next/dev/types` or a deleted page, run `pnpm clean` and try again.

### API contract

```
pnpm check:api
```

- **Checks:** the web app's typed API client matches the current API.
- **Run after:** any change in `apps/api` that touches routes or schemas.
- **If it fails:** run `pnpm generate:api` and commit the regenerated files with the API change.

### API tests

```
pnpm --filter @embr/api test
```

- **Checks:** pytest, including integration tests against a real throwaway Postgres (Testcontainers). Coverage must stay at or above 90%.
- **Run after:** any change in `apps/api`. Needs Docker Desktop running.
- **If it fails:** "can't connect" means Docker isn't running. A coverage failure lists the missing lines under `Missing`.

### Web unit tests and coverage

```
pnpm --filter @embr/web test:coverage
```

- **Checks:** Vitest unit tests in `apps/web/src` (`*.test.ts(x)`). Coverage must stay at or above 90%.
- **Run after:** any change in `apps/web/src`. While working, `pnpm --filter @embr/web test <name>` runs only the test files whose name contains `<name>`.
- **If it fails:** the output shows what was expected and what was received. For coverage, the `Uncovered Line #s` column shows which lines need a test.

### End-to-end tests

```
pnpm db:up
pnpm test:e2e
```

- **Checks:** Playwright clicks through the real app in Chromium (browser → web app → API → database), and axe checks every page for accessibility (WCAG 2.1 AA) at computer and phone size.
- **Run after:** changing a page, the menu, or anything a user journey depends on. `pnpm --filter @embr/web test:e2e <name>` runs one file.
- **If it fails:** "can't connect" means Docker isn't running or `pnpm db:up` wasn't run. A timeout on the very first page is usually the dev server compiling; run again. Each failure saves a trace under `apps/web/test-results/` to replay with `pnpm --filter @embr/web exec playwright show-trace <trace.zip>`.

### If the web app shows a Next.js error after installing packages

Stop the web app, run `pnpm clean` (deletes build and test caches in every app), then start it again.

Never call a change done while a check fails.
