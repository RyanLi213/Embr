# To do

Active tasks only. Finished tasks move to `DONE.md`.

- [ ] Discuss the grand vision with Lisa and Leo

## Milestone 2: screens from the Figma design (agreed 2026-11-18)

Web app only (`apps/web`). Each branch is merged into `main` through a pull
request once CI passes.

- [ ] `feature/api-online`: put the API and database online, so the live site
  saves accounts too. Plan: Neon for Postgres, AWS Lambda for the API, both in
  US East 1, set up with Terraform and deployed by GitHub Actions.
  - Done (2026-11-23, pushed on the branch): Neon project (Postgres 18, US
    East 1) with both migrations applied; the API accepts Neon's address as
    handed out; laptop and CI moved to Postgres 18 to match; AWS account made
    with MFA on root; AWS CLI and Terraform installed
  - Waiting on AWS's account review (documents sent 2026-11-23), then in order:
    1. Budget alert: $5 a month, started from AWS's "Explore AWS" activity
       so it earns $20
    2. Everyday login (IAM Identity Center user) and the CLI signed in with
       it, so the root login stays locked away
    3. Terraform in a new `infra/` folder: image storage (ECR), the Lambda
       function with a function URL, logs kept 14 days, a role GitHub Actions
       can deploy with (OIDC, no stored AWS keys), Terraform state stored in
       AWS (S3)
    4. Dockerfile: add the Lambda Web Adapter (one line; the same image still
       runs anywhere)
    5. GitHub Actions deploy workflow, after CI passes on `main`: build the
       image, push it to ECR, run migrations on Neon, update Lambda, check
       `/v1/health`. Neon's address goes in a GitHub secret
    6. Online API settings: `EMBR_DATABASE_URL`, `EMBR_CLERK_ISSUER`,
       `EMBR_CORS_ORIGINS=["https://embr-lovat.vercel.app"]`,
       `EMBR_ENVIRONMENT=production`
    7. Vercel: set `NEXT_PUBLIC_API_URL` to the function URL, redeploy, then
       sign in on the live site and check a row appears in Neon
    8. `docs/deploy.md` (how it deploys, how to roll back), tests, and the
       `AGENTS.md` update (shown to Ryan first)
    9. Open the pull request for the whole branch and merge it once CI passes
- [ ] Before 2027-05-23: upgrade the AWS account from the Free plan (or move
  the API), or AWS switches off everything when the free period or the
  credits run out. Credits: $100, plus up to $100 more from AWS's "Explore
  AWS" activities.
- [ ] `feature/sync-check-ins`: a signed-in person's check-ins are saved to the
  database instead of only the browser
- [ ] Swap in the new mascot once the team finishes it (the website artwork is
  a placeholder until then). Then the mascot also shows each check-in answer,
  for example a small flicker for low energy and a big bright flame for high.

## Milestone 3: privacy, consent and a smoother site (agreed 2026-11-22)

Starts after sign-in is done.

- [ ] Privacy and consent. Embr is a prototype for now, so sign-in is built
  first, without this.
- [ ] Make moving between pages smooth and optimized. Going to another page,
  like Calendar, feels rigid right now; the site should feel high quality.
  Ideas to look at: page transition animations, showing something straight
  away while a page loads, and loading pages ahead of time.

## Check-in (agreed 2026-11-18, updated 2026-11-22)

Five questions, each on a 5-step scale saved as 1 (lowest) to 5 (highest):
pain, stiffness, energy, mood, and "How was today overall?" Then "Is today a
flare day?" (yes or no) and an optional note (up to 240 characters).

- No answer is picked in advance: Continue stays off until one is tapped.
- Buttons show words, not numbers ("Embr's glow"), lowest to highest:

| Question | Answers |
| --- | --- |
| Pain | Not there · A whisper · Noticeable · Loud · Overwhelming |
| Stiffness | Moving freely · A little tight · Stiff · Very stiff · Locked up |
| Energy | Barely a flicker · Low glow · Steady flame · Burning bright · Fully lit |
| Mood | Heavy · A bit grey · Steady · Light · Glowing |
| Overall | A tough one · Rough edges · Getting by · A good day · A great day |

- Opening the check-in again after finishing shows today's answers, with a
  "Change answers" button.

Day colour on the calendar:

1. Turn each answer into a 1 to 5 "how good" score. Pain and stiffness are
   flipped (6 minus the answer); energy, mood and overall stay as they are.
2. Take a weighted average: overall counts 1.5 times, the other four once each.
3. 3.5 or higher is Good, 2.5 up to 3.5 is Okay, below 2.5 is Hard.
4. A flare day shows as Flare, whatever the score.

## Later

- [ ] Add more ways to sign in: passkeys, Apple, Microsoft, Facebook and phone
  (SMS), without making the sign-in form crowded. Details in `notes.md`
  (2026-11-23).
- [ ] Build our own authentication to replace Clerk, once Embr has real users.
  Until then, Clerk handles sign-in, and the API keeps its own `users` table
  and a single login-check module, so the swap stays small. It needs (details
  in `notes.md`, 2026-11-22):
  - Basics: db connection, accept data, validation, db talk, hashing, token
    (JWT), cookies, middleware
  - Structure: routing, API routing, MVC, modular, mail handling, env, Postman
    collection and testing, debugging without ChatGPT
  - Standards: Google Auth, OAuth2, OpenID Connect and OpenID standards, JWKS,
    SAML, access token, refresh token
- [ ] Maybe later: limit how many check-ins a guest keeps in the browser, to
  encourage registering (`apps/web/src/lib/store-load-check-in.ts`). Not needed
  for speed or storage (decided 2026-11-22, see `notes.md`), so no limit for
  now.
  - To weigh: a limit means a guest's calendar only shows the days kept, and
    only those move into their account when they sign up.

## Guests and accounts (agreed 2026-11-14)

Embr never forces sign-up. The home page welcomes everyone and the core app
works without an account. Guests get a limited version, so signing up is
rewarded, not required.

| | Guest | Signed in |
| --- | --- | --- |
| Check-in and calendar | Saved in this browser only | Saved to the account, synced across phone and computer |
| Personalization | Basic: a short survey | Better over time: survey, check-in history and uploaded medical documents |
| Community and chat | No | Yes |

- Guests see a banner on the check-in and calendar screens: "You're not signed
  in, so your check-ins are saved only in this browser. You'll lose them if you
  clear your browsing data, use a private window, or switch devices. Create a
  free account to keep them safe."
- When a guest signs up, their past check-ins move into the new account, so
  nothing is lost.

## Grand vision (draft, to discuss with Lisa and Leo)

Goal: more than a check-in app, which people barely use. Two things set Embr apart:

1. **Personalized AI informant.** Brings each user only the news, technology and
   products relevant to them (for example, new assistive devices for hands), so
   they know what is out there and worth a look.
2. **Community hub.** People with RA talk to each other, relate and help each
   other cope. Gives people a reason to open the app every day.

Also planned:

- **Voice check-in.** Speak instead of tapping, for sore hands. The AI fills in
  the check-in and the user confirms it.
- **Exercise suggestions.** Personalized to the day's check-in, including nearby
  options such as pools and warm-water classes.
- **Group video calls** about living with arthritis.
- **Paid tier: online advice from licensed professionals** (physios and nurses,
  doctors later through a partner) for people who can't easily reach their
  doctor. Helps between visits; does not replace the rheumatologist.
- **Upload medical documents** (reports, test results, medication lists) to
  personalize the app. The AI reads them and the user confirms the details.
  Used for personalization only, never to interpret results. Top safety and
  privacy priority: encrypted, minimal, deletable, clear consent.
- **No diet advice.**
- **Moderation** of the community: later.
