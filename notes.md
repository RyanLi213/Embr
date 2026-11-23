# Notes

Ryan's thoughts and decisions, newest first.

## 2026-11-22: No limit on check-ins in the browser (decided)

Check-ins barely affect memory or storage, so we don't need a limit. Measured:
a year of check-ins is 41 KB (126 KB if every note is full) and loads in about
1 ms; 10 years is up to 1.3 MB and about 7 ms. A browser allows about 5 MB per
site.

Maybe later: a limit on check-ins for guests, to incentivize registering.

## 2026-11-22: What building our own auth needs (later)

Eventually we build our own authentication to replace Clerk. It needs all of
these (from a course outline I saw). In Embr, "express" means FastAPI.

**Basics: how a backend handles a login**

| Part | What it is |
| --- | --- |
| db connection | The API talking to the database |
| accept data | Taking in what the person sends (email, password) |
| validation | Checking it follows the rules before using it |
| db -> talk | Reading and saving users in the database |
| hashing | Storing passwords scrambled one way, never as plain text |
| token => JWT | A signed pass that proves who you are on each request |
| cookies | Where the browser keeps the pass between pages |
| middleware | Code that runs before every route, for example "is this person signed in?" |

**Structure: how the backend is organized**

| Part | What it is |
| --- | --- |
| routing, API routing | Which code answers which address, like `/v1/me` |
| MVC, modular | Keeping routes, logic and database code apart (our layered backend) |
| mail handling | Sending emails: confirm your address, reset your password |
| env | Secrets kept in `.env`, never in the code |
| Postman collection/testing | Saved API requests to try by hand |
| express | The backend framework (ours is FastAPI) |
| debugging (without ChatGPT) | Finding bugs myself |

**Standards: signing in the way big apps do**

| Part | What it is |
| --- | --- |
| Google Auth | "Sign in with Google" |
| OAuth2 | The standard for letting one app sign you in to another |
| OpenID Connect, OpenID standards | Adds "who you are" on top of OAuth2 |
| JWKS (not JWT) | The public keys used to check a JWT is real |
| SAML | An older standard, used by schools and companies |
| access token | Short-lived pass used on each request |
| refresh token | Longer-lived pass used to get a new access token |

## 2026-11-22: Kinds of tests (to remember)

Most test names are about how much of the app one test runs at once. From
smallest and fastest to biggest and most realistic:

| Kind | The question it answers | Embr example | Tool |
| --- | --- | --- | --- |
| Static checks | Is the code written correctly, without even running it? | `pnpm lint` (style, common mistakes), `pnpm typecheck` (right kind of data everywhere) | ESLint, Ruff, TypeScript, mypy |
| Unit | Does this one function give the right answer? | My `dayColour` test; "November 2026 needs 6 empty squares" | Vitest, pytest |
| Component | Does this one screen work when someone uses it? | Calendar view: save a check-in, tap a day, see "A harder day" | Vitest + Testing Library (fake browser) |
| Integration | Do two real pieces work together? | The API talking to a real Postgres database in Docker (`test_database.py`) | pytest + Testcontainers |
| Contract | Do the web app and the API still agree on what they send each other? | `pnpm check:api` | openapi-typescript + git diff |
| End-to-end | Does the whole thing work for a real person? | Real Chrome clicks through a check-in, then the calendar | Playwright |
| Accessibility | Can everyone use it, including screen reader users and people with low vision? | Every page checked for contrast, labels and headings | axe, inside Playwright |

The further down, the more realistic, but slower and harder to tell what broke.
So: lots of small tests, a few big ones (the test pyramid).

Checks on the tests themselves:

- Coverage: which lines the tests ran. Running a line isn't the same as
  checking it's right.
- Mutation testing: break the code on purpose and make sure a test fails.
  Proves the tests actually notice bugs.

Names about the purpose, not the size:

- Regression test: added after a bug, so the bug can't come back.
- Test-first: write the test before the code.

Not in Embr yet: load testing (k6), pretending thousands of people use the app
at once and measuring how fast it stays.

## 2026-11-22: A nice screen for first-time visitors (to do)

Give people a nice screen the first time they visit Embr. Use the welcome page
we already have (`/welcome`) and work on making it nicer.

## 2026-11-22: Write a test for the Page helper (to do)

Write a unit test for `Page` in `apps/web/src/components/shell/page.tsx`, the
last uncovered line in the web app's coverage. It's uncovered because only the
home page uses it, and coverage skips pages; no unit test renders it directly.
Good first test to write myself.

## 2026-11-22: Check-in time of day (decided: built around the evening)

The daily check-in is not a morning check-in. Embr is built around an evening
check-in, so it can be accurate for the whole day, including "How was today
overall?". But we don't tell people directly to check in in the evening: the
app is just designed around it.

People should check in at the same time each day so their check-ins can be
compared, since pain can change through the day.

In the morning they can still open Embr to plan their day.

Still to discuss: when in their day people will actually open the app.

## 2026-11-18: "Overall" counts more (decided)

In the day colour, "How was today overall?" counts 1.5 times as much as the
other questions (chosen over 2: a bit heavier than the rest, not double).
