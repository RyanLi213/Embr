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
| 8 | `pnpm test:e2e` | A real browser clicks through the real app, and every page is checked for accessibility. Needs Clerk's keys: `apps/web/.env.local` on your laptop, the repo's Actions secrets in CI | about 1 min |

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

**238 tests in total**: 192 web unit, 23 API, 23 end-to-end.

Web unit tests never contact Clerk: `src/test/clerk.tsx` is a fake Clerk that starts every test signed out, and `signInAs()` signs in a made-up person.

### Web unit tests (Vitest), `apps/web/src/`

| File | Tests | Protects |
| --- | --- | --- |
| `lib/today.test.ts` | 13 | Greeting changes at the right hours (4:59 am, 5:00, 11:59, 12:00, 4:59 pm, 5:00 pm); the date reads "Wednesday, November 18"; dates use local time, not UTC (so an evening check-in isn't saved as tomorrow); the week runs Monday to Sunday, including Sundays and weeks that cross a month |
| `lib/utils.test.ts` | 2 | The `cn` helper joins class names and lets a later Tailwind class win |
| `lib/check-in.test.ts` | 34 | **Day colour:** a typical day, the best, middle and worst answers, flare always wins, each answer counts the right way (pain and stiffness flipped, energy not), overall counts 1.5 times, and the closest scores either side of 3.5 and 2.5. **Rules (Zod):** answers must be whole numbers from 1 to 5, nothing missing, flare is yes or no, the note is 240 characters at most and trimmed, the date is a real YYYY-MM-DD day |
| `lib/check-in-questions.test.ts` | 11 | The five questions come in order with five answers each; each saved number shows the right words; the one-line summary ("Pain was a whisper and your mood felt light.") at both ends of each scale and on a flare day |
| `lib/store-load-check-in.test.ts` | 15 | Check-ins are saved by day, one per day, without losing other days; rule-breaking check-ins are refused; damaged or unreadable saved data is skipped instead of crashing; a browser that blocks storage is handled; listeners hear saves, including from another tab |
| `lib/calendar.test.ts` | 23 | Months count from 1; moving between months, including across a new year and back more than a year; "November 2026"; a month starting on Sunday gets 6 empty squares and one starting on Monday none; 28, 29 (leap year) and 31-day months; a saved date in words; past, today and future; what a screen reader hears for each kind of day |
| `components/calendar/calendar-view.test.tsx` | 13 | Opens on this month with today picked; each day's colour from its check-in, read out for screen readers; the heading for good, okay, hard and flare days; a tapped day shows its answers and note; the details scroll into view on phones; today links to its check-in, or offers "Check in now"; a past day with no check-in says so; future days can't be picked; back a month and forward again (the picked day is cleared), never past this month; nothing shows on the server |
| `lib/use-check-ins.test.tsx` | 4 | Screens see saved check-ins and update straight after a save; the same object comes back while nothing changes (React needs this); blocked storage; nothing is known on the server |
| `components/check-in/check-in-flow.test.tsx` | 10 | Nothing is picked at first and Continue is off; picking turns it on; focus moves to each new question for screen readers; Back keeps answers; the flare question and note come after the five; finishing saves every answer; the note stops at 240; a failed save explains and keeps the answers; changing answers starts from the saved ones; Back from the first question |
| `components/check-in/check-in-screen.test.tsx` | 6 | No check-in today starts the flow (yesterday's doesn't count); finishing shows the thank-you; an existing check-in shows today's answers and can be changed; coming back after finishing shows the answers, not the thank-you again (a bug the end-to-end test found); nothing shows on the server |
| `components/home/today-card.test.tsx` | 3 | The card invites a check-in, or shows today as done with its summary; it stays hidden on the server instead of flashing the wrong card |
| `proxy.test.ts` | 5 | A first-time visitor opening home is sent to `/welcome`; a welcomed visitor sees home; other pages are never redirected; the proxy runs on every page (so Clerk knows who is signed in) but skips images and Next.js's own files |
| `components/api-status.test.tsx` | 5 | The status message for loading, connected, database down, API unreachable, and API error |
| `components/home/greeting.test.tsx` | 3 | Greets by time of day with today's date; changes when the hour turns without a reload; starts hidden on the server, which can't know the visitor's time |
| `components/home/week-strip.test.tsx` | 3 | Shows this week from Monday with today marked and described for screen readers; colours each day by its check-in (good, flare, hard); shows plain dots on the server |
| `components/brand/brand.test.tsx` | 4 | The logo links home and is read as "embr"; the decorative mascot is hidden from screen readers; the mascot keeps its shape; the landscape is hidden from screen readers |
| `components/shell/app-nav.test.tsx` | 9 | Which menu item counts as current; the sidebar links to every page and marks the current one; Community is read as needing an account; the guest card; once signed in, the card shows the person (or their email) and Community unlocks; nothing flashes while Clerk starts; the phone menu marks the current page |
| `lib/use-account.test.ts` | 8 | Loading, guest or signed in; the person's name, email, phone and initial (from the email, or "?", when there's no name); the API is only called where it can be reached: always on the laptop, from the live site only once its address is set |
| `components/account/save-account.test.tsx` | 5 | After sign-in the app tells our API who signed in (`GET /v1/me`) with Clerk's token; once per sign-in, not on every page; nothing for guests or without a token; the app keeps working when the API can't be reached |
| `components/account/account-screens.test.tsx` | 13 | Profile: guests are invited to sign in; signed in it shows name, email and phone, leaves out missing details, and signs out; Community: locked for guests, "coming soon" once signed in; the guest banner stops offering an account once signed in; the phone avatar and home's Community link change once signed in; screens wait for Clerk instead of flashing the wrong page |
| `components/coming-soon.test.tsx` | 3 | The message is the page's main heading with a way onward; the lock and note appear only when asked |

### API tests (pytest), `apps/api/tests/`

| File | Tests | Protects |
| --- | --- | --- |
| `test_health.py` | 2 | `/v1/health` still answers when the database is down (reports "degraded"); unversioned paths like `/health` don't exist |
| `test_cors.py` | 4 | The browser may call the API from the web app's address, including the browser's "may I?" preflight request; other websites are blocked; a typo in the default setting is caught |
| `test_auth.py` | 10 | The sign-in token check, with a made-up signing key (no internet): a valid token says who is signed in; expired, wrong-Clerk-app, wrong-website, no-website, no-person and forged tokens are all refused; `/v1/me` answers 401 without a valid token and never says which check failed; 503 when sign-in isn't set up; the real checker uses our Clerk app and websites and is reused |
| `test_database.py` | 3 | **Integration**, with a real Postgres: health reports the database as connected; the migrations switch on pgvector and create the `users` table with a unique Clerk ID |
| `test_me.py` | 4 | **Integration**, `GET /v1/me` with a real Postgres: the first visit saves the person; later visits update the same row (new email, phone, last seen) without a duplicate; two people get two rows; nothing is saved without a valid token |

### End-to-end tests (Playwright), `apps/web/e2e/`

| File | Tests | Protects |
| --- | --- | --- |
| `status.spec.ts` | 1 | The whole chain works: browser → web app → API → database → back to the page |
| `first-visit.spec.ts` | 2 | A new guest is welcomed once, can start a check-in without an account, and sees the home screen on later visits; the menu reaches each page |
| `accessibility.spec.ts` | 16 | Every page (welcome, home, check-in, calendar, community, profile, sign-in, sign-up) meets WCAG 2.1 AA, at computer and phone size. The sign-in pages are checked after Clerk's form has loaded (this found two contrast problems in it) |
| `sign-in.spec.ts` | 1 | With a Clerk test account: signing in makes the app call `/v1/me`, our API checks the token and saves the person (200, with their email and name); the sidebar shows them, Community unlocks, Profile shows the account and meets WCAG 2.1 AA, and signing out returns to guest |
| `calendar.spec.ts` | 2 | With made-up check-ins and the clock fixed on a known day: the month shows each day's colour, a tapped day shows its answers and note, months go back and forward, and today's empty day leads to the check-in; meets WCAG 2.1 AA with coloured days and with a day open. On a phone, a tapped day's details scroll into view |
| `check-in.spec.ts` | 1 | A guest's whole check-in: Continue starts off, every question, flare, note, the thank-you; home then shows today as done and coloured; the answers can be viewed and changed, and survive a reload. Each check-in screen also meets WCAG 2.1 AA |

---

## Why this mix of tests

The common model is the **test pyramid**: many fast unit tests at the bottom, fewer integration tests in the middle, and a few slow end-to-end tests at the top. Google describes the same idea as small, medium and large tests, and is often quoted as aiming for roughly 70% / 20% / 10%.

```
        /\       end-to-end: few, slow, the most realistic      23
       /  \      integration: several real pieces together       7 (+ api-status)
      /____\     unit: many, fast, precise                     208
    __________
    static: lint, type check, API contract (the "testing trophy" base)
```

Frontend teams often add the **testing trophy** (Kent C. Dodds), which counts lint and type checks as the base layer of testing, because they catch a lot for almost no effort.

Why not test everything end-to-end? Because end-to-end tests are slow, and when one fails it can be hard to tell why. A failing unit test points straight at the broken function. Embr follows the pyramid: most behaviour is pinned down by unit tests, and end-to-end tests cover the journeys a real user depends on, plus accessibility.

---

## What CI runs

`.github/workflows/ci.yml` runs on **every push to `main` and every pull request**, on a fresh Ubuntu machine. It runs the same steps as `pnpm check`, plus installing tools and the Playwright browser first. One difference: CI runs the end-to-end tests against a production build (`next build`, then `next start`), the same build Vercel makes, so every page is ready before the tests start and a broken build fails CI. Your laptop uses the dev server, which builds each page on its first visit and shows detailed errors.

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
