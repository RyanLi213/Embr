# Testing Embr

How Embr is checked before any change reaches `main`: what each check and test is, why it exists, and how to run it. Written for anyone working on the code, including people new to automated testing.

- [Quick start: `pnpm check`](#quick-start-pnpm-check)
- [The checks at a glance](#the-checks-at-a-glance)
- [Each check explained](#each-check-explained)
- [Every test, and what it protects](#every-test-and-what-it-protects)
- [Why this mix of tests](#why-this-mix-of-tests)
- [What CI runs](#what-ci-runs)
- [Writing a new test](#writing-a-new-test)
- [When something fails](#when-something-fails)
- [Further reading](#further-reading)

---

## Quick start: `pnpm check`

Open Docker Desktop, then run from the repo root:

```
pnpm check
```

This runs **every check that CI runs, in the same order**, and stops at the first failure. If it passes on your computer, it will pass on GitHub.

### What `pnpm check` does

It is a script in the root `package.json`. It chains eight commands with `&&`, which means "run the next one only if the last one passed":

| Step | Command | What it checks | Time |
| --- | --- | --- | --- |
| 1 | `pnpm lint` | Code style and common mistakes, without running anything | seconds |
| 2 | `pnpm typecheck` | Every piece of code gets the kind of data it expects | seconds |
| 3 | `pnpm check:api` | The web app's copy of the API description is up to date | seconds |
| 4 | `pnpm --filter @embr/api test` | API tests, including a real throwaway database; coverage 90% minimum | under a minute |
| 5 | `pnpm --filter @embr/web test:coverage` | Web unit tests; coverage 90% minimum | under 30 s |
| 6 | `pnpm db:up` | Starts the local database in Docker (needed by step 8) | seconds |
| 7 | `pnpm db:migrate` | Brings the database's tables up to date | seconds |
| 8 | `pnpm test:e2e` | A real browser clicks through the real app, and every page is checked for accessibility | about 1 min |

**Why fastest first:** a typo found by lint in 5 seconds should not wait behind a minute of browser tests. **Why stop at the first failure:** once something is broken, the later results are not worth waiting for. Fix it and run again.

**Why the same order as CI:** the GitHub workflow (`.github/workflows/ci.yml`) runs these same steps. One command that matches CI means "it works on my machine" and "it works in CI" are the same claim. If you add or change a step in one, change the other too.

**Turbo remembers:** steps 1, 2 and the tests inside them are run through Turborepo. If no file changed since the last run, Turbo replays the saved result in milliseconds (`FULL TURBO`).

---

## The checks at a glance

| Check | Tool | Catches | Runs the code? | Where the files are |
| --- | --- | --- | --- | --- |
| Lint | ESLint (web), Ruff (API) | Mistakes and bad habits: unused imports, misused React hooks, formatting | No | Config: `apps/web/eslint.config.mjs`, `apps/api/pyproject.toml` |
| Type check | TypeScript (web, api-client), mypy (API) | Pieces that don't fit, such as text passed where a number is needed | No | Config: `tsconfig.json` files, `apps/api/pyproject.toml` |
| API contract | `openapi-typescript` + `git diff` | The API changed but the web app's typed client was not regenerated | No | `packages/api-client/` |
| Unit tests | Vitest (web), pytest (API) | One small piece giving a wrong answer | Yes, in isolation | Next to the code: `*.test.ts(x)`; `apps/api/tests/` |
| Integration tests | pytest + Testcontainers | Pieces that each work alone but fail together (API + real database) | Yes, several real pieces | `apps/api/tests/test_database.py` |
| End-to-end tests | Playwright + Chromium | The whole app failing a real user journey | Yes, everything | `apps/web/e2e/` |
| Accessibility | axe (inside Playwright) | Pages that break the WCAG 2.1 AA rules: contrast, labels, headings | Yes, real pages | `apps/web/e2e/accessibility.spec.ts` |
| Coverage | Vitest (v8), pytest-cov | Code that no test ever ran | Measures the tests | Thresholds: `apps/web/vitest.config.mts`, `apps/api/pyproject.toml` |

---

## Each check explained

### Lint

**What:** reads every file and flags code that is legal but likely wrong or messy. Think of a spell-checker and grammar-checker for code. Nothing runs, so it is the fastest check.

**Why it matters:** it catches whole families of bugs for free, such as a React hook called inside an `if`, which breaks in confusing ways at runtime. It also keeps the code looking the same no matter who wrote it.

**Run alone:** `pnpm lint`. A failure prints the file, the line, and the rule's name, for example `src/proxy.ts 12:5 error 'x' is defined but never used`.

### Type check

**What:** TypeScript and mypy check that every function gets the type of data it expects, before anything runs.

**Example from Embr:** `useCurrentHour()` returns `number | null` (a number in the browser, `null` on the server, which can't know the visitor's time). `greetingFor()` only accepts a number. Writing `greetingFor(hour)` without handling `null` fails the type check:

```
Argument of type 'number | null' is not assignable to parameter of type 'number'.
```

That forced the safe version, `hour === null ? "Hello" : greetingFor(hour)`. Without the type check this would have been a crash that only happened on the server, only sometimes: the hardest kind of bug to find.

**Run alone:** `pnpm typecheck`. In the web app it first runs `next typegen`, which also catches links to pages that don't exist.

### API contract check

**What:** the web app never calls the API by hand-written URLs. It uses a typed client generated from the API's OpenAPI description (`packages/api-client`). This check regenerates that client and fails if the result differs from the committed copy.

**Why it matters:** it guarantees the web app and the API agree on every endpoint and every field. If someone renames a field in the API and forgets the client, this fails instead of the live app.

**Run alone:** `pnpm check:api`. If it fails, run `pnpm generate:api` and commit the regenerated files with the API change.

### Unit tests

**What:** test one small piece on its own, with fixed inputs, and check the answer. They are fast enough to run hundreds of times a day.

- **Web (Vitest):** run in **jsdom**, a pretend browser written in JavaScript. It builds the page's structure so a test can find and click things, but draws nothing, so it is very fast. Test files sit next to the code they test and end in `.test.ts` or `.test.tsx`. Vitest finds them with the pattern `src/**/*.test.{ts,tsx}` in `apps/web/vitest.config.mts`.
- **API (pytest):** test files are in `apps/api/tests/` and start with `test_`.

**Run alone:** `pnpm --filter @embr/web test` (web) or `pnpm --filter @embr/api test` (API). To run one web file: `pnpm --filter @embr/web test today` runs only files whose name contains "today".

### Integration tests

**What:** check that several real pieces work together. `apps/api/tests/test_database.py` uses **Testcontainers** to start a brand-new Postgres in Docker, applies every migration, checks the API against it, and throws it away afterwards.

**Why it matters:** a fake database can't catch a broken migration or a query Postgres rejects. A real throwaway one can, and because it is new every time, tests never depend on leftover data.

The web test `api-status.test.tsx` sits between unit and integration: it uses the real API client and the real `fetch`, and only the network is faked (with MSW).

### End-to-end tests

**What:** Playwright starts the API and the web app, opens a real **Chromium** (the browser engine inside Google Chrome) without a window, and clicks through the app like a user.

**Why it matters:** this is the only check that proves the pieces work together in a real browser, for example that a first-time visitor really lands on the welcome page and that "Check in now" really works. It is also the only place the screens in `src/app/` are tested, because unit coverage leaves them out on purpose.

**Run alone:** `pnpm db:up`, then `pnpm test:e2e`. To run one file: `pnpm --filter @embr/web test:e2e first-visit`. The first run is slower because the web app compiles each page on its first visit.

### Accessibility checks

**What:** inside the end-to-end tests, **axe** checks every page against the WCAG 2.1 AA rules: colour contrast, every button and link having a name, sensible headings, and more. Each page is checked at computer and phone size, because the layout changes.

**Why it matters for Embr:** many people with arthritis are older or have trouble with fine movements, and some use screen readers or zoom. These checks have already caught two real problems: a logo whose spoken name didn't match its visible text, and a menu link read aloud with a missing space.

### Coverage

**What:** measures how much of the code the unit tests actually ran. CI fails if it drops below **90%** for the web app or the API.

| Column | Counts |
| --- | --- |
| % Stmts | instructions that ran |
| % Branch | at every decision (`if`, `? :`), whether tests tried **every path** |
| % Funcs | functions called at least once |
| % Lines | lines that ran |
| Uncovered Line #s | the exact lines no test ran: where a test is missing |

**Branch is the most telling column.** You can run every line and still never test the "else" case.

**Coverage shows code ran, not that it is right.** A test with no `expect(...)` still counts. That is why every test must check a real result.

**Left out on purpose:** `src/app/**` (screens, tested end-to-end), `src/components/ui/**` (shadcn components, tested by their authors) and the tests themselves.

---

## Every test, and what it protects

**66 tests in total**: 41 web unit, 8 API, 17 end-to-end.

### Web unit tests (Vitest), `apps/web/src/`

| File | Tests | Protects |
| --- | --- | --- |
| `lib/today.test.ts` | 13 | Greeting changes at the right hours (4:59 am, 5:00, 11:59, 12:00, 4:59 pm, 5:00 pm); the date reads "Wednesday, November 18"; dates use local time, not UTC (so an evening check-in isn't saved as tomorrow); the week runs Monday to Sunday, including Sundays and weeks that cross a month |
| `lib/utils.test.ts` | 2 | The `cn` helper joins class names and lets a later Tailwind class win |
| `proxy.test.ts` | 3 | A first-time visitor is sent to `/welcome`; a welcomed visitor sees home; the check only runs on `/` |
| `components/api-status.test.tsx` | 5 | The status message for loading, connected, database down, API unreachable, and API error |
| `components/home/greeting.test.tsx` | 3 | Greets by time of day with today's date; changes when the hour turns without a reload; starts hidden on the server, which can't know the visitor's time |
| `components/home/week-strip.test.tsx` | 2 | Shows this week from Monday with today marked and described for screen readers; shows plain dots on the server |
| `components/brand/brand.test.tsx` | 4 | The logo links home and is read as "embr"; the decorative mascot is hidden from screen readers; the mascot keeps its shape; the landscape is hidden from screen readers |
| `components/shell/app-nav.test.tsx` | 6 | Which menu item counts as current; the sidebar links to every page and marks the current one; Community is read as needing an account; the guest card; the phone menu marks the current page |
| `components/coming-soon.test.tsx` | 3 | The message is the page's main heading with a way onward; the lock and note appear only when asked |

### API tests (pytest), `apps/api/tests/`

| File | Tests | Protects |
| --- | --- | --- |
| `test_health.py` | 2 | `/v1/health` still answers when the database is down (reports "degraded"); unversioned paths like `/health` don't exist |
| `test_cors.py` | 4 | The browser may call the API from the web app's address, including the browser's "may I?" preflight request; other websites are blocked; a typo in the default setting is caught |
| `test_database.py` | 2 | **Integration**, with a real Postgres: health reports the database as connected; the migrations switch on pgvector |

### End-to-end tests (Playwright), `apps/web/e2e/`

| File | Tests | Protects |
| --- | --- | --- |
| `status.spec.ts` | 1 | The whole chain works: browser → web app → API → database → back to the page |
| `first-visit.spec.ts` | 2 | A new guest is welcomed once, can start a check-in without an account, and sees the home screen on later visits; the menu reaches each page |
| `accessibility.spec.ts` | 14 | Every page (welcome, home, check-in, calendar, community, profile, sign-in) meets WCAG 2.1 AA, at computer and phone size |

---

## Why this mix of tests

The common model is the **test pyramid**: many fast unit tests at the bottom, fewer integration tests in the middle, and a few slow end-to-end tests at the top. Google describes the same idea as small, medium and large tests, and is often quoted as aiming for roughly 70% / 20% / 10%.

```
        /\       end-to-end: few, slow, the most realistic      17
       /  \      integration: several real pieces together       2 (+ api-status)
      /____\     unit: many, fast, precise                      47
    __________
    static: lint, type check, API contract (the "testing trophy" base)
```

Frontend teams often add the **testing trophy** (Kent C. Dodds), which counts lint and type checks as the base layer of testing, because they catch a lot for almost no effort.

Why not test everything end-to-end? Because end-to-end tests are slow, and when one fails it can be hard to tell why. A failing unit test points straight at the broken function. Embr follows the pyramid: most behaviour is pinned down by unit tests, and end-to-end tests cover the journeys a real user depends on, plus accessibility.

---

## What CI runs

`.github/workflows/ci.yml` runs on **every push to `main` and every pull request**, on a fresh Ubuntu machine. It runs the same steps as `pnpm check`, plus installing tools and the Playwright browser first.

- Results appear on the pull request page and in the repo's **Actions** tab. Failed end-to-end tests are listed with the file and line.
- A pull request should only be merged when CI is green.

---

## Writing a new test

### When to write one

- **Every behaviour a user relies on.** For example, "the check-in saves the note", "Continue stays disabled until an answer is picked".
- **Every bug you fix.** First write a test that fails because of the bug, then fix it. The test then stops the bug from ever coming back (a "regression test").
- **Edge cases.** Boundaries (exactly 12:00), empty input, too-long input (a 241-character note), dates around midnight and month ends.
- **Not needed:** pure styling, code from libraries (such as `src/components/ui/`), and the framework itself.

### Which kind

| You want to check... | Write a... |
| --- | --- |
| A function's answer (dates, scores, rules) | unit test next to the file |
| A component shows and does the right thing | unit test with Testing Library |
| The API works with the real database | API test using the Testcontainers pattern in `test_database.py` |
| A whole journey across pages, in a real browser | end-to-end test in `apps/web/e2e/` |

### How: set up, run, check

Almost every test has the same three steps. From `today.test.ts`:

```ts
describe("formatDateLabel", () => {                // the thing being tested
  it("writes the weekday, month and day", () => {  // one behaviour, as a sentence
    const result = formatDateLabel(at(10, 18));    // set up and run: November 18, 2026
    expect(result).toBe("Wednesday, November 18"); // check
  });
});
```

- **`describe`** groups the tests for one function or component.
- **`it`** is one test, named so it reads as a sentence: "formatDateLabel writes the weekday, month and day". When it fails, the name says what broke.
- **`expect(actual).toBe(expected)`** is the check. If they differ, the test fails and shows both.

For a component, "run" becomes `render(<ComingSoon ... />)` and "check" becomes finding something on the page, such as `screen.getByRole("heading", { level: 1 })`.

### Good habits

- **Name the file after the code:** `today.ts` → `today.test.ts`, in the same folder.
- **Test what the user sees, not how the code is built.** Find elements the way a person would: by role, label or text (`getByRole("button", { name: "Check in now" })`), not by CSS class.
- **Use fixed inputs.** Never depend on today's real date or the network. Fake the clock (`vi.useFakeTimers()`) and the network (MSW).
- **One behaviour per test,** so a failure points at one thing.
- **Make sure the test can fail.** After writing it, break the code on purpose for a moment and check the test goes red.

---

## When something fails

- **Lint: Ruff formatting.** Run `uv run ruff format .` in `apps/api`.
- **Type check mentions `.next/dev/types`** or a page that no longer exists: old generated files. Run `pnpm clean`, then try again.
- **`check:api` shows a difference:** the API changed without regenerating the client. Run `pnpm generate:api` and commit the result.
- **API tests or end-to-end tests can't connect:** Docker Desktop isn't running, or `pnpm db:up` wasn't run. Docker Desktop takes a moment to start after you open it.
- **An end-to-end test times out on its first page:** the web app compiles each page on its first visit. Run it again; if it still fails, it is real.
- **Seeing why an end-to-end test failed:** each failure saves a trace under `apps/web/test-results/`. Open it with `pnpm --filter @embr/web exec playwright show-trace <path to trace.zip>` to replay the test step by step.
- **An end-to-end test failed in CI:** open the failed run in the repo's Actions tab, download `playwright-report` under Artifacts, unzip it, and run `pnpm --filter @embr/web exec playwright show-report <unzipped folder>`. It shows every test, the error, and a step-by-step replay of each failure. GitHub deletes the report after 7 days.
- **Coverage below 90%:** the table's "Uncovered Line #s" column shows exactly which lines need a test.

Never call a change done while a check fails.

---

## Further reading

- [The Practical Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html), Martin Fowler's site
- [Test Sizes](https://testing.googleblog.com/2010/12/test-sizes.html) and [Just Say No to More End-to-End Tests](https://testing.googleblog.com/2015/04/just-say-no-to-more-end-to-end-tests.html), Google Testing Blog
- [The Testing Trophy and Testing Classifications](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications), Kent C. Dodds
- [Testing Library: guiding principles](https://testing-library.com/docs/guiding-principles)
- [Playwright: accessibility testing](https://playwright.dev/docs/accessibility-testing)
- [WCAG 2.1 at a glance](https://www.w3.org/WAI/standards-guidelines/wcag/glance/)
