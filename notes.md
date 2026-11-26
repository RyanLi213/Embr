# Notes

Ryan's thoughts and decisions, newest first.

## 2026-11-25: The API moves to Google Cloud Run (decided: Google Cloud is home)

AWS kept blocking us: the first account and a second one (made because the
first review was slow) were both suspended for identity checks, and every AWS
service answers "Access denied" until AWS approves the ID. So the API goes on
Google Cloud Run for now. Neon, Vercel, the Docker image and the API code stay
the same; only the Terraform files and the deploy workflow differ.

- **Cloud Run vs Lambda:** both run only when called, give a free `https://`
  address and wait a moment after a quiet spell. Cloud Run runs the Docker
  image as is (no adapter); it is told the app listens on port 8000, so the
  Dockerfile doesn't change.
- **Cost:** about $0. Free each month: 2 million requests, 180,000
  vCPU-seconds and 360,000 GiB-seconds (CPU only while answering a request).
  New Google Cloud customers also get $300 of trial credits.
- **Region:** `us-east4` (N. Virginia), the same area as Neon's AWS US East 1,
  so the API and the database stay close.
- **No stored keys:** GitHub Actions signs in to Google Cloud with Workload
  Identity Federation (the same idea as AWS's OIDC role). Neon's address goes
  in Secret Manager for the API and in a GitHub secret for migrations.
- **Everyday login:** the Google account with 2-step verification. Google has
  no separate root user to lock away.
- **Google Cloud is home** (decided 2026-11-26). No "Lambda, then ECS" move:
  Cloud Run scales to zero now, and with real users one setting (minimum one
  instance) keeps it always on. Later pieces have Google versions: Cloud SQL
  (instead of RDS), Cloud Storage (S3), Cloud Tasks or Pub/Sub (SQS). Ryan
  may think about swapping to AWS one day; not planned.
- **AWS on the side, maybe:** send the ID and card statement by 2026-11-27
  through AWS Settings → Contact support. If approved, use it for something
  small on the side so AWS still shows on the resume. On AWS's Free plan, turning on IAM Identity Center
  or AWS Organizations ends the credits: use an IAM user with MFA and
  `aws login` instead.
- **AWS words:** "projects" are real (AWS Settings: a management account
  holding projects, each its own AWS account). A Builder ID is only a profile
  for AWS's learning and community sites. Amazon.com is shopping.
- **Lesson:** one account per provider. A second account during a review can
  slow the review down.

## 2026-11-24: A personal patterns model (to discuss)

Research (Yimer 2022) shows people react to weather differently, so one rule
for everyone won't work. Idea: a **multilevel model**, a regression where each
person gets their own effects, pulled toward the group average until they have
enough days of their own. It's statistics, but counts as ML (Python:
`statsmodels`, or `PyMC` for the Bayesian version). People only see their own
patterns ("your patterns suggest"), not a flare prediction; the model is
tested in the background first, as research.

What data it would use:

| Source | What it gives | How we'd get it | When |
| --- | --- | --- | --- |
| Embr check-ins | Pain, stiffness, energy, mood, overall, flare yes/no. What the model predicts; yesterday's answers are also inputs | Already built | Once `sync-check-ins` is done |
| Weather | Humidity, air pressure (and how fast it's changing), temperature, wind, rain; also tomorrow's forecast | Free weather data matched to the person's city and the date (Environment Canada, NOAA for the US) | Any time after sync |
| Profile (asked once) | RA or OA, age range, years since diagnosis, medications | A short sign-up survey (already planned for personalization) | With the survey |
| Phone or watch | Sleep, steps, heart rate | Apple Health and Google Health Connect, with permission | Later, in the mobile app |

More check-in questions (sleep quality, stress, swollen hands, meds taken
today) make the daily check-in longer, so they'd be optional or asked once a
week.

Three catches:

1. The check-ins aren't in the database yet, only in each person's browser,
   so `sync-check-ins` comes first.
2. Embr needs each person's city to match the weather: ask for a city or the
   first three characters of a postal code, not GPS (more private, and no
   battery drain, which made people quit in Reade 2017).
3. Consent comes first: using health data and location for a model needs
   clear permission (Milestone 3).

Order: `sync-check-ins`, then city plus daily weather, then consent, then the
model. Phone data later, with the mobile app.

## 2026-11-23: Putting the API online (decided; hosting changed 2026-11-25)

What "online" means: three pieces. The web app is already on Vercel; the API
needs a computer on the internet to run on (with `https://`), and the database
needs to run online too. Then Vercel is told the API's address.

- **Hosting: option B, AWS Lambda for the API + Neon for the database.**
  About $0 a month at our size, and still AWS, Terraform and automatic deploys
  for the resume. Option A (AWS ECS + RDS, always running) would cost about
  $30–50 a month after credits, mostly the load balancer and network gateway,
  for an app nobody outside the team uses yet. Option C (simple hosts) teaches
  the least.
- **Lambda vs ECS:** Lambda runs only when called, pays per request, gives a
  free `https://` address, but the first request after a quiet spell waits
  1–3 seconds (a "cold start"). ECS is a container that always runs, pays per
  hour, needs a load balancer, never waits. Start on Lambda; move to ECS with
  real users. The Lambda Web Adapter lets the same Docker image run on both.
- **Database:** Neon now (free). AWS RDS (about $15 a month for the smallest)
  or Aurora once the user base scales: both are normal Postgres, so moving is
  a copy-and-restore, and only the database address setting changes.
- **Kubernetes:** not now (about $73 a month on AWS just for Kubernetes itself,
  and a lot to look after for one container). Later, with many services and a
  team. It can be learned for free on the laptop (`kind` or `minikube`).
- **Region:** AWS US East 1 (N. Virginia) for both. Where health data must be
  stored (for example in Canada) is a Milestone 3 privacy question.
- **Postgres 18** everywhere: Neon's default, so the laptop and CI moved to 18
  to match. Running migrations twice is safe: Alembic only runs newer ones.
- **Accounts:** an AWS Builder ID is not an AWS account. The AWS account is on
  the Free plan ($100 credits, ends 2027-05-23). AWS asked for ID and a card
  statement to verify the new account (sent 2026-11-23). Only upload documents
  through the AWS console itself, never through a link in an email.

## 2026-11-23: The API's routes: /v1/health and /v1/me

A **route** is one address on the API plus the code that answers it, like a
window at a counter that answers one kind of question.

| | `GET /v1/health` | `GET /v1/me` |
| --- | --- | --- |
| Question | "Are you alive?" | "Who am I? Remember me." |
| Sign-in needed | no | yes (Clerk token) |
| What it does | checks the API runs and can reach the database | checks the token, saves or updates me in `users`, answers my record |
| Answer | `{"status": "ok", "database": "connected", ...}` | `{"id": ..., "email": ..., "name": ..., "last_seen_at": ...}` |
| Who uses it | `/status` page, the tests, later the hosting service (to notice if the API dies) | the web app, once each time I open it signed in |
| Code | `routes/health.py` | `routes/me.py` |
| Built | Milestone 1 | sign-in branch |

Try them: http://localhost:8000/v1/health shows the answer. Opening
http://localhost:8000/v1/me in the browser gives 401, because a typed address
has no token: the check working.

**Calling it "me" is industry practice** (the "current user" endpoint): Spotify
`GET /v1/me`, Microsoft Graph `GET /me`, Facebook/Meta Graph `GET /me`, X
`GET /2/users/me`, Google People API `people/me`, GitHub `GET /user` (same
idea, different name). No ID in the address; the token decides who you are.
What matters is using one style consistently.

### How GET /v1/me works

- **v1** = version 1 of our API. Every address starts with it. If we ever have to
  change an answer in a way that breaks apps people already have, we make
  `/v2/...` and keep `/v1/...` working.
- **me** = "the person asking". There's no ID in the address, so nobody can see
  someone else's data by changing a number. The Clerk token decides who "me" is.

What happens, step by step:

1. **Web app** (`apps/web/src/components/account/save-account.tsx`), once per
   sign-in session: asks Clerk for the token (`getToken()`), then calls
   `GET /v1/me` with the header `Authorization: Bearer <token>`. It sits in the
   app layout, so it runs whatever page you open.
2. **Route** (`apps/api/src/embr_api/routes/me.py`): the door. It needs two things
   before it runs: a signed-in person (`Depends(get_signed_in_person)`) and a
   database session (`Depends(get_session)`).
3. **Token check** (`apps/api/src/embr_api/core/auth.py`): no token gives 401.
   Otherwise it checks Clerk's signature with Clerk's public key, that it hasn't
   expired, that it's from our Clerk app, and that it was made for our website.
   Any fail gives 401 "Sign in to continue." Pass: it reads who it is (Clerk ID,
   email, name, phone).
4. **Service** (`services/users.py`): the rule "save the person, then commit".
5. **Repository** (`repositories/users.py`): one SQL statement, "insert, or update
   if this Clerk ID is already there" (`INSERT ... ON CONFLICT`). First visit
   makes a new row; later visits update the details and `last_seen_at`. Never a
   duplicate.
6. **Answer**: 200 with the saved record (id, email, name, phone, created_at,
   last_seen_at), shaped by `schemas/user.py`.

In the API terminal it shows as `"GET /v1/me HTTP/1.1" 200` (passed) or `401`
(token refused, nothing saved). The `OPTIONS /v1/me` line before it is the
browser asking "may this site send this?" first.

## 2026-11-23: The users table (built)

Our own record of everyone who signs in, in Postgres (migration `0002`).
Clerk signs people in; the API checks Clerk's token, then saves them here.

| Column | What | Rules |
| --- | --- | --- |
| id | our own ID for the person | primary key, made by Postgres |
| clerk_id | Clerk's ID, like `user_2abc…` | unique, so one person can never be saved twice |
| email | their email | can be empty, for later sign-in ways like phone |
| name | their name | can be empty |
| phone | their phone number | can be empty |
| created_at | when they were first saved | set automatically |
| last_seen_at | last time they opened the app signed in | updated on every `/v1/me` |

## 2026-11-23: More ways to sign in (later)

I want to add all of these, but too many buttons will make the sign-in form
crowded, so we need a way to offer them without that. For now: email code and
Google (GitHub turned off).

| Way | Why it fits Embr | Cost (Clerk) |
| --- | --- | --- |
| Passkeys (fingerprint or face) | No typing at all after the first time, good for sore hands | free |
| Apple | Lots of people have iPhones; the App Store requires it for the iPhone app if we offer Google | free |
| Microsoft | Common account among older adults | free |
| Facebook | Common account among older adults | free |
| Phone (SMS code) | Familiar for everyone | free while testing, paid once live; only US and Canada by default |

WhatsApp: Clerk doesn't offer it.

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
